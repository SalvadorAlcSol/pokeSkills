/**
 * Gemini Vision Service
 * Analyzes Pokémon GO screenshots/frames using Google's Gemini Vision API
 * to extract Pokémon data (name, CP, moves, IVs).
 */

import { GoogleGenAI } from '@google/genai';

export interface DetectedPokemon {
  detected: true;
  name: string;
  cp: number;
  fastMove: string;
  chargedMove1: string;
  chargedMove2: string | null;
  level: number | null;
  ivAtk: number | null;
  ivDef: number | null;
  ivHp: number | null;
  ivPercent: number | null;
  isShadow: boolean;
  isPurified: boolean;
  isShiny: boolean;
  frameIndex: number;
}

export interface NotDetected {
  detected: false;
}

export type FrameAnalysisResult = DetectedPokemon | NotDetected;

export interface AnalysisProgress {
  phase: 'analyzing' | 'done' | 'error';
  current: number;
  total: number;
  message: string;
  results: DetectedPokemon[];
}

const ANALYSIS_PROMPT = `You are analyzing a screenshot from the mobile game Pokémon GO, specifically using the PGSharp modified client which displays additional IV information directly on the Pokémon's detail screen.

Determine if this image shows a Pokémon's detail/summary screen.

A Pokémon detail screen typically shows:
- The Pokémon's 3D model in the center
- CP (Combat Power) as a large number at the top
- The Pokémon's name
- HP bar
- Fast Move and Charged Move(s) with their names and type icons
- Power Up and Evolve buttons at the bottom

PGSharp OVERLAY (visible on the same detail screen):
- IV percentage (e.g. "100%", "96%", "82%")
- Individual IV values shown as ATK/DEF/STA or Attack/Defense/Stamina (e.g. "15/15/15", "15/14/15")
- Sometimes the Level is also displayed (e.g. "Lv. 40", "Level 50")

If this IS a Pokémon detail screen, extract ALL visible data as JSON:
{
  "detected": true,
  "name": "Pokémon species name in English (e.g. Mewtwo, Tyranitar, Charizard). Use the base English name even if the game is in Spanish.",
  "cp": <number>,
  "level": <number if visible from PGSharp overlay, null otherwise>,
  "fastMove": "fast move name in English (e.g. Confusion, Bite, Dragon Tail)",
  "chargedMove1": "first charged move name in English (e.g. Psystrike, Crunch)",
  "chargedMove2": "second charged move name in English, or null if only one",
  "ivAtk": <0-15 if visible from PGSharp overlay, null otherwise>,
  "ivDef": <0-15 if visible from PGSharp overlay, null otherwise>,
  "ivHp": <0-15 if visible from PGSharp overlay, null otherwise>,
  "ivPercent": <0-100 if visible, null otherwise>,
  "isShadow": <true if purple/dark flames or "Shadow"/"Oscuro" visible, false otherwise>,
  "isPurified": <true if white glowing aura/sparkles or "Purified"/"Purificado" visible, false otherwise>,
  "isShiny": <true if the Pokémon model has shiny coloring/particles, or if the three-sparkles icon is visible next to the name/CP, false otherwise>
}

If this is NOT a Pokémon detail screen (it's a menu, transition, loading screen, Pokémon list, map, etc.):
{ "detected": false }

IMPORTANT: 
- Return ONLY the raw JSON object. No markdown fences, no explanation text.
- Move names should be in English even if the game UI is in Spanish.
- Pokémon names should be in English (e.g. "Charizard" not "Lizardon").`;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

function parseNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9]/g, '');
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

function parseNullableNumber(val: any): number | null {
  if (val === null || val === undefined) return null;
  const num = parseNumber(val);
  return num > 0 ? num : null;
}

/**
 * Analyzes a single frame image using Gemini Vision.
 */
async function analyzeFrame(
  client: GoogleGenAI,
  imageDataUrl: string,
  frameIndex: number
): Promise<FrameAnalysisResult> {
  try {
    const base64Data = imageDataUrl.split(',')[1];
    if (!base64Data) {
      console.warn(`Frame #${frameIndex}: missing base64 data`);
      return { detected: false };
    }

    // Try gemini-2.5-flash first, fallback to gemini-2.0-flash if needed
    let responseText = '';
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

    for (const modelName of modelsToTry) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                { text: ANALYSIS_PROMPT },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });
        responseText = response.text?.trim() || '';
        if (responseText) break;
      } catch (e) {
        console.warn(`Model ${modelName} failed for frame #${frameIndex}:`, e);
      }
    }

    if (!responseText) {
      console.warn(`Frame #${frameIndex}: empty response from Gemini`);
      return { detected: false };
    }

    // Clean up response - strip markdown code fences if present
    let cleanJson = responseText;
    if (cleanJson.includes('```')) {
      cleanJson = cleanJson.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    }

    // Find JSON block if extra text exists
    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (jsonErr) {
      console.warn(`Frame #${frameIndex}: JSON parse error on response:`, cleanJson);
      return { detected: false };
    }

    if (!parsed || !parsed.detected) {
      return { detected: false };
    }

    const name = String(parsed.name || '').trim();
    const cp = parseNumber(parsed.cp);
    const level = parseNullableNumber(parsed.level);
    const fastMove = String(parsed.fastMove || '').trim();
    let chargedMove1 = String(parsed.chargedMove1 || '').trim();
    let chargedMove2 = parsed.chargedMove2 ? String(parsed.chargedMove2).trim() : null;

    if (chargedMove1.includes('/') || chargedMove1.includes(',') || /\s+y\s+/i.test(chargedMove1) || /\s+and\s+/i.test(chargedMove1)) {
      const parts = chargedMove1.split(/[\/,]|\s+y\s+|\s+and\s+/i).map((s) => s.trim()).filter(Boolean);
      if (parts.length > 0) chargedMove1 = parts[0];
      if (parts.length > 1 && !chargedMove2) chargedMove2 = parts[1];
    }
    const ivAtk = parseNullableNumber(parsed.ivAtk);
    const ivDef = parseNullableNumber(parsed.ivDef);
    const ivHp = parseNullableNumber(parsed.ivHp);
    const ivPercent = parseNullableNumber(parsed.ivPercent);
    const isShadow = Boolean(parsed.isShadow);
    const isPurified = Boolean(parsed.isPurified);
    const isShiny = Boolean(parsed.isShiny);

    console.log(`Frame #${frameIndex} DETECTED:`, { name, cp, level, fastMove, chargedMove1, ivPercent, isShiny, isPurified });

    return {
      detected: true,
      name: name || 'Unknown',
      cp,
      level,
      fastMove,
      chargedMove1,
      chargedMove2,
      ivAtk,
      ivDef,
      ivHp,
      ivPercent,
      isShadow,
      isPurified,
      isShiny,
      frameIndex,
    };
  } catch (err) {
    console.warn(`Error analizando fotograma #${frameIndex}:`, err);
    return { detected: false };
  }
}

/**
 * Analyzes an array of extracted frames using Gemini Vision API.
 * Processes frames sequentially with a small delay to respect rate limits.
 */
export async function analyzeFrames(
  frameDataUrls: string[],
  onProgress?: (progress: AnalysisProgress) => void
): Promise<DetectedPokemon[]> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error(
      'API Key de Gemini no configurada. Crea un archivo .env en la raíz del proyecto con:\nVITE_GEMINI_API_KEY="tu-api-key"\n\nObtén una gratis en: https://aistudio.google.com/apikey'
    );
  }

  const results: DetectedPokemon[] = [];
  const total = frameDataUrls.length;

  for (let i = 0; i < total; i++) {
    onProgress?.({
      phase: 'analyzing',
      current: i + 1,
      total,
      message: `Analizando fotograma ${i + 1} de ${total} con Gemini Vision... (${results.length} detectados)`,
      results: [...results],
    });

    const result = await analyzeFrame(client, frameDataUrls[i], i);

    if (result.detected) {
      results.push(result);
    }

    // Small delay to avoid rate limiting
    if (i < total - 1) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  // Deduplicate: merge entries for the same Pokémon
  const deduped = deduplicateResults(results);

  onProgress?.({
    phase: 'done',
    current: total,
    total,
    message: `¡Análisis completado! ${deduped.length} Pokémon detectados de ${results.length} capturas.`,
    results: deduped,
  });

  return deduped;
}

import { POGO_DATABASE } from '../data/pogoDatabase';

/**
 * Deduplicates detected Pokémon by merging data from multiple frames.
 * Groups detections of the same Pokémon name + CP and auto-fills missing moves.
 */
function deduplicateResults(results: DetectedPokemon[]): DetectedPokemon[] {
  const merged: DetectedPokemon[] = [];

  for (const result of results) {
    if (!result.name || result.name === 'Unknown') continue;

    // Try to find an existing entry to merge with
    const existing = merged.find(
      (m) =>
        m.name.toLowerCase() === result.name.toLowerCase() &&
        (m.cp === result.cp || m.cp === 0 || result.cp === 0)
    );

    if (existing) {
      // Merge: fill in missing data
      if (result.cp > 0) existing.cp = result.cp;
      if (result.level !== null) existing.level = result.level;
      if (result.fastMove) existing.fastMove = result.fastMove;
      if (result.chargedMove1) existing.chargedMove1 = result.chargedMove1;
      if (result.chargedMove2) existing.chargedMove2 = result.chargedMove2;
      if (result.ivAtk !== null) existing.ivAtk = result.ivAtk;
      if (result.ivDef !== null) existing.ivDef = result.ivDef;
      if (result.ivHp !== null) existing.ivHp = result.ivHp;
      if (result.ivPercent !== null) existing.ivPercent = result.ivPercent;
      if (result.isShadow) existing.isShadow = true;
    } else {
      merged.push({ ...result });
    }
  }

  // Auto-fill missing moves from POGO_DATABASE fallback
  const enriched = merged.map((p) => {
    const dbPoke = POGO_DATABASE.find(
      (item) => item.name.toLowerCase() === p.name.toLowerCase()
    );
    if (!dbPoke) return p;

    let fastMove = p.fastMove;
    let chargedMove1 = p.chargedMove1;

    if (!fastMove && dbPoke.fastMoves.length > 0) {
      fastMove = dbPoke.fastMoves[0].name;
    }
    if (!chargedMove1 && dbPoke.chargedMoves.length > 0) {
      chargedMove1 = dbPoke.chargedMoves[0].name;
    }

    return {
      ...p,
      fastMove,
      chargedMove1,
    };
  });

  // Filter: require name and valid CP (or if name exists and CP > 0)
  return enriched.filter((m) => m.name && m.name !== 'Unknown' && typeof m.cp === 'number' && m.cp > 0);
}

/**
 * Checks if the Gemini API key is configured.
 */
export function isGeminiConfigured(): boolean {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  return !!apiKey && apiKey !== 'YOUR_API_KEY_HERE';
}
