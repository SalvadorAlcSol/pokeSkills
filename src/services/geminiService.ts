/**
 * Gemini Vision Service
 * Analyzes Pokémon GO screenshots/frames using Google's Gemini Vision API
 * to extract Pokémon data (name, CP, moves, IVs).
 */

import { GoogleGenAI } from '@google/genai';
import { POGO_DATABASE } from '../data/pogoDatabase';
import { UserPokemon } from '../types/UserInventory';
import { inferExactLevelForSpecies } from '../utils/pokemonMath';
import { getEnglishMoveName } from '../utils/pogoMoveTranslator';
import { getMegaFormsForPokemon, resolvePogoSpeciesAndForm } from '../utils/pokemonUtils';

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
  canMegaEvolve: boolean;
  megaLevel: 0 | 1 | 2 | 3 | null;
  megaEnergy: number | null;
  megaEvolveCost: number | null;
  candy: number | null;
  candyXl: number | null;
  buddyLevel: 0 | 1 | 2 | 3 | 4 | null;
  isBestBuddy: boolean;
  isDynamax: boolean;
  isGigantamax: boolean;
  maxAttackMove?: string | null;
  maxAttackLevel: 1 | 2 | 3 | null;
  maxGuardLevel: 0 | 1 | 2 | 3 | null;
  maxSpiritLevel: 0 | 1 | 2 | 3 | null;
  isLucky?: boolean;
  frameIndex: number;
  caughtDate?: string | null;
  caughtLocation?: string | null;
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

const SHARED_JSON_SCHEMA_INSTRUCTIONS = `Return a single JSON object with these exact fields:
{
  "detected": true,
  "name": "Pokémon species name in English (e.g. Mewtwo, Tyranitar, Charizard, Necrozma Dusk Mane, Zacian Crowned, Palkia Origin). Always English base/form name even if the game UI is in Spanish.",
  "cp": <integer Combat Power (CP/PC) shown at the top, or 0 if scrolled off-screen>,
  "level": <number 1-51 (can be .5 like 40.5) if explicitly shown by PGSharp overlay e.g. 'Lv.40'/'L50', otherwise null>,
  "fastMove": "Fast Move name in English (e.g. Confusion, Bite, Dragon Tail, Fire Spin) or empty string if not visible",
  "chargedMove1": "First Charged Move name in English (e.g. Psystrike, Crunch, Blast Burn) or empty string if not visible",
  "chargedMove2": "Second Charged Move name in English, or null if only one charged move or button says 'NEW ATTACK'/'NUEVO ATAQUE'",
  "ivAtk": <integer 0-15 if visible from PGSharp overlay or appraisal bars, null otherwise>,
  "ivDef": <integer 0-15 if visible from PGSharp overlay or appraisal bars, null otherwise>,
  "ivHp": <integer 0-15 if visible from PGSharp overlay or appraisal bars, null otherwise>,
  "ivPercent": <integer 0-100 if visible, null otherwise>,
  "isShadow": <true if purple/dark shadow flames or 'Shadow'/'Oscuro' visible, false otherwise>,
  "isPurified": <true if white glowing aura or 'Purified'/'Purificado' visible, false otherwise>,
  "isShiny": <true if shiny sparkles icon or shiny model coloration visible, false otherwise>,
  "isLucky": <true if golden 'Lucky'/'Con suerte' background/bubbles/label visible, false otherwise>,
  "candy": <integer amount of regular species Candy ('CARAMELOS ...' / '... CANDY', round candy icon) shown on the left of the resource row below Weight/Types/Height, null if not visible>,
  "candyXl": <integer amount of Candy XL ('CARAMELOS ++' / 'CANDY XL', triangle-shaped XL candy icon) shown in the middle of the resource row, null if not visible>,
  "buddyLevel": <0, 1, 2, 3, or 4 for Buddy Level ('Nivel de Compañero'). Look at the circular heart badge at the top-left of the Pokémon card (next to or below the Mega icon) or the Best Buddy ribbon: 0 = no buddy heart badge; 1 = Good Buddy (1 lit orange/red heart segment); 2 = Great Buddy (2 lit heart segments); 3 = Ultra Buddy (3 lit heart segments); 4 = Best Buddy / Mejor Compañero (all 4 heart segments lit OR red-and-gold Best Buddy ribbon badge visible on the Pokémon / next to CP / top-left). Null if not visible>,
  "isBestBuddy": <true if Buddy Level is 4 (all 4 heart segments filled) OR if the Best Buddy Ribbon ('Cinta de Mejor Compañero') badge is visible on the Pokémon model or top-left, false otherwise>,
  "megaEnergy": <integer amount of Mega Energy / Megaenergía / Primal Energy shown next to Candy & Candy XL (right of Candy XL with DNA/Primal icon), null if not visible>,
  "megaEvolveCost": <integer cost shown inside the 'MEGA EVOLVE'/'MEGAEVOLUCIONAR'/'PRIMAL REVERSION'/'REGRESIÓN PRIMIGENIA' button (e.g. 0, 10, 20, 40, 200, 300, 400), null if no Mega button>,
  "canMegaEvolve": <true ONLY if this specific Pokémon has ALREADY been Mega Evolved before: (1) top-left circular Mega Level badge has 1, 2, or 3 lit segments, OR (2) Mega Evolve button cost is 0 or <100 with a cooldown timer. False if button asks 100/200/300/400 energy without timer, if all 3 ring segments are grey/empty, or if Shadow>,
  "megaLevel": <0 if never Mega Evolved before; 1 (Base, 1 lit ring segment), 2 (High, 2 lit segments), or 3 (Max, 3 lit segments / full bright ring); null if species cannot Mega Evolve>,
  "isDynamax": <true if pink/magenta Dynamax cloud/X emblem is visible OR if the 'MAX MOVES'/'MOVIMIENTOS MAX' section is visible, false otherwise>,
  "isGigantamax": <true if the Gigantamax emblem is visible OR if the first Max Move is a G-Max move (e.g. 'G-Max ...' / 'Giga...'), false otherwise>,
  "maxAttackMove": "Name of the first Max Move (left slot under 'MAX MOVES'/'MOVIMIENTOS MAX'), e.g. 'G-Max Wildfire', 'Max Flare', or null if not Dynamax/Gigantamax",
  "maxAttackLevel": <1, 2, or 3 if Dynamax/Gigantamax. Note: 'MAX LEVEL'/'NIVEL MÁX.'/'MÁX' means 3. Null if not visible>,
  "maxGuardLevel": <0 if 'LOCKED'/'BLOQUEADO'/padlock, 1, 2, or 3 ('MAX'/'MÁX') for middle slot Max Guard/Maxibarrera, null if not visible>,
  "maxSpiritLevel": <0 if 'LOCKED'/'BLOQUEADO'/padlock, 1, 2, or 3 ('MAX'/'MÁX') for right slot Max Spirit/Maxiespíritu, null if not visible>,
  "caughtDate": "Caught date visible near the bottom (e.g. '2026-08-06' or '14/07/2026'), null otherwise",
  "caughtLocation": "Caught location visible near the bottom (e.g. 'Monterrey, México'), null otherwise"
}`;

const ANALYSIS_PROMPT = `You are analyzing a screenshot from Pokémon GO (commonly with a PGSharp overlay showing IVs and/or Level, in Spanish or English UI).

Determine if this image shows a Pokémon's detail/summary screen (either the top half with CP/name/3D model/PGSharp IVs or the scrolled-down bottom half with Attacks, Max Moves, and caught date/location).

If this IS a Pokémon detail screen, extract ALL visible data.
${SHARED_JSON_SCHEMA_INSTRUCTIONS}

If this is NOT a Pokémon detail screen (e.g. Pokémon storage grid/list, world map, menu, loading screen):
{ "detected": false }

IMPORTANT:
- Return ONLY raw JSON. No markdown fences, no commentary.
- Always translate Pokémon species names and move names into standard English Pokémon GO names.
- Never treat 'NEW ATTACK' / 'NUEVO ATAQUE' as chargedMove2.`;

const PAIRED_ANALYSIS_PROMPT = `You are analyzing 1 or 2 screenshots of the SAME Pokémon in Pokémon GO (Image 1 = top of the Pokémon detail card with CP, Name, Model, PGSharp IV/Level overlay; Image 2 = scrolled-down bottom of the SAME Pokémon showing Attacks, Charged Moves, Max Moves for Dynamax/Gigantamax, and Caught Date/Location).

Combine information from BOTH images cleanly into a single JSON object.
${SHARED_JSON_SCHEMA_INSTRUCTIONS}

If Image 1 does NOT show a Pokémon detail screen (e.g. it's a list/grid, map, or menu):
{ "detected": false }

IMPORTANT:
- Return ONLY raw JSON. No markdown fences, no commentary.
- Always output Pokémon species names and Fast/Charged move names in standard English.
- Ignore 'NEW ATTACK' / 'NUEVO ATAQUE' buttons (chargedMove2 = null if not unlocked).
- For Dynamax / Gigantamax: carefully inspect the 3 Max Move slots ('MOVIMIENTOS MAX' / 'MAX MOVES'):
  1) Left slot = Max Attack or G-Max Attack. Level 'NIVEL MÁX.' / 'MAX LEVEL' / 'MÁX' = 3.
  2) Middle slot = Max Guard / Maxibarrera. 'BLOQUEADO'/'LOCKED' = 0; Level 1/2/MÁX = 1/2/3.
  3) Right slot = Max Spirit / Maxiespíritu. 'BLOQUEADO'/'LOCKED' = 0; Level 1/2/MÁX = 1/2/3.
- For Mega Evolution / Primal Reversion:
  1) Look at the top-left of the 3D Pokémon model for the circular Mega Level icon (3 ring segments). Count lit segments (0 = not yet Mega Evolved, 1 = Base, 2 = High, 3 = Max).
  2) Look right of Candy & Candy XL for 'megaEnergy' (total Mega Energy / Primal Energy stored).
  3) Look at the 'MEGAEVOLUCIONAR' / 'MEGA EVOLVE' / 'REGRESIÓN PRIMIGENIA' button cost: 0 or <100 (with cooldown timer) means already unlocked ('canMegaEvolve: true'); 100, 200, 300 or 400 means NEVER Mega Evolved ('canMegaEvolve: false').
- For Candy, Candy XL & Buddy Level:
  1) Below the Weight / Types / Height row, extract 'candy' (left column: normal Candy) and 'candyXl' (middle column: 'CARAMELOS ++' / 'CANDY XL' with triangular candy icon).
  2) At the top-left of the Pokémon detail card (or on the Pokémon's body/CP), check for the Buddy heart icon (1 to 4 filled orange/red heart segments) or the red-and-gold Best Buddy Ribbon ('isBestBuddy: true', 'buddyLevel: 4').`;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

function parseIntStrict(val: any): number {
  if (typeof val === 'number') return Number.isFinite(val) ? Math.round(val) : 0;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9]/g, '');
    const num = parseInt(cleaned, 10);
    return Number.isNaN(num) ? 0 : num;
  }
  return 0;
}

function parseNullableIntInRange(val: any, min: number, max: number): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return null;
    const rounded = Math.round(val);
    return rounded >= min && rounded <= max ? rounded : null;
  }
  if (typeof val === 'string') {
    const cleaned = val.replace(/[,.\s]/g, '');
    const match = cleaned.match(/\d+/);
    if (!match) return null;
    const num = parseInt(match[0], 10);
    return !Number.isNaN(num) && num >= min && num <= max ? num : null;
  }
  return null;
}

function parseLevelNumber(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num =
    typeof val === 'number'
      ? val
      : parseFloat(String(val).replace(',', '.').replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(num) || num < 1 || num > 55) return null;
  return Math.round(num * 2) / 2;
}

function parseMaxAttackLevel(val: any): 1 | 2 | 3 | null {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val).trim().toLowerCase();
  if (str.includes('max') || str.includes('máx') || str === '3') return 3;
  if (str.includes('2')) return 2;
  if (str.includes('1')) return 1;
  return null;
}

function parseBuddyLevel(val: any): 0 | 1 | 2 | 3 | 4 | null {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val).trim().toLowerCase();
  if (str === '4' || str.includes('best') || str.includes('mejor') || str.includes('max')) return 4;
  if (str === '3' || str.includes('ultra')) return 3;
  if (str === '2' || str.includes('great') || str.includes('gran')) return 2;
  if (str === '1' || str.includes('good') || str.includes('buen')) return 1;
  if (str === '0' || str.includes('none')) return 0;
  return null;
}

function parseMegaLevel(val: any): 0 | 1 | 2 | 3 | null {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val).trim().toLowerCase();
  if (str === '3' || str.includes('max') || str.includes('máx')) return 3;
  if (str === '2' || str.includes('high') || str.includes('alto')) return 2;
  if (str === '1' || str.includes('base')) return 1;
  if (str === '0' || str.includes('none')) return 0;
  return null;
}

function parseMaxSupportLevel(val: any): 0 | 1 | 2 | 3 | null {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val).trim().toLowerCase();
  if (str.includes('lock') || str.includes('bloq') || str === '0') return 0;
  if (str.includes('max') || str.includes('máx') || str === '3') return 3;
  if (str.includes('2')) return 2;
  if (str.includes('1')) return 1;
  return null;
}

function extractBase64Part(dataUrl: string): { mimeType: string; data: string } | null {
  if (!dataUrl || !dataUrl.includes(',')) return null;
  const [header, data] = dataUrl.split(',');
  if (!data) return null;
  const mimeMatch = header.match(/data:([^;]+);base64/i);
  return {
    mimeType: mimeMatch?.[1] || 'image/jpeg',
    data,
  };
}

function cleanMoveName(raw: any): string {
  const str = String(raw || '').trim();
  if (!str) return '';
  if (/^(new attack|nuevo ataque|none|ninguno|-|null)$/i.test(str)) return '';
  return getEnglishMoveName(str);
}

function parseGeminiPokemonResponse(responseText: string, frameIndex: number): FrameAnalysisResult {
  if (!responseText) return { detected: false };

  let cleanJson = responseText;
  if (cleanJson.includes('```')) {
    cleanJson = cleanJson.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  }

  const firstBrace = cleanJson.indexOf('{');
  const lastBrace = cleanJson.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleanJson);
  } catch {
    console.warn(`Frame #${frameIndex}: JSON parse error on response:`, cleanJson);
    return { detected: false };
  }

  if (!parsed || !parsed.detected) {
    return { detected: false };
  }

  const name = String(parsed.name || '').trim() || 'Unknown';
  const cp = parseIntStrict(parsed.cp);
  const ivAtk = parseNullableIntInRange(parsed.ivAtk, 0, 15);
  const ivDef = parseNullableIntInRange(parsed.ivDef, 0, 15);
  const ivHp = parseNullableIntInRange(parsed.ivHp, 0, 15);
  const ivPercent = parseNullableIntInRange(parsed.ivPercent, 0, 100);

  let level = parseLevelNumber(parsed.level);
  if (level === null && cp > 0 && name !== 'Unknown') {
    level = inferExactLevelForSpecies(name, cp, ivAtk, ivDef, ivHp);
  }

  const fastMove = cleanMoveName(parsed.fastMove);
  let chargedMove1 = cleanMoveName(parsed.chargedMove1);
  let chargedMove2Str = cleanMoveName(parsed.chargedMove2);

  if (
    chargedMove1.includes('/') ||
    chargedMove1.includes(',') ||
    /\s+y\s+/i.test(chargedMove1) ||
    /\s+and\s+/i.test(chargedMove1)
  ) {
    const parts = chargedMove1
      .split(/[\/,]|\s+y\s+|\s+and\s+/i)
      .map((s) => cleanMoveName(s))
      .filter(Boolean);
    if (parts.length > 0) chargedMove1 = parts[0];
    if (parts.length > 1 && !chargedMove2Str) chargedMove2Str = parts[1];
  }

  const isShadow = Boolean(parsed.isShadow);
  const isPurified = Boolean(parsed.isPurified);
  const isShiny = Boolean(parsed.isShiny);
  const isLucky = Boolean(parsed.isLucky);

  const candy = parseNullableIntInRange(parsed.candy, 0, 999999);
  const candyXl = parseNullableIntInRange(parsed.candyXl, 0, 999999);
  const rawBuddyLevel = parseBuddyLevel(parsed.buddyLevel);
  const isBestBuddy = Boolean(parsed.isBestBuddy) || rawBuddyLevel === 4;
  const buddyLevel: 0 | 1 | 2 | 3 | 4 | null = isBestBuddy ? 4 : rawBuddyLevel;

  const megaEnergy = parseNullableIntInRange(parsed.megaEnergy, 0, 99999);
  const megaEvolveCost = parseNullableIntInRange(parsed.megaEvolveCost, 0, 1000);
  const rawMegaLevel = parseMegaLevel(parsed.megaLevel);

  let canMegaEvolve = false;
  let megaLevel: 0 | 1 | 2 | 3 | null = rawMegaLevel;
  if (isShadow) {
    canMegaEvolve = false;
    megaLevel = 0;
  } else if (megaEvolveCost !== null && megaEvolveCost >= 100) {
    canMegaEvolve = false;
    megaLevel = 0;
  } else if (
    (megaEvolveCost !== null && megaEvolveCost < 100) ||
    (rawMegaLevel !== null && rawMegaLevel >= 1) ||
    Boolean(parsed.canMegaEvolve)
  ) {
    canMegaEvolve = true;
    megaLevel = rawMegaLevel !== null && rawMegaLevel >= 1 ? rawMegaLevel : 1;
  } else if (rawMegaLevel === 0) {
    megaLevel = 0;
  }

  const maxAttackMove = parsed.maxAttackMove ? String(parsed.maxAttackMove).trim() : null;
  const maxAttackLevel = parseMaxAttackLevel(parsed.maxAttackLevel);
  const maxGuardLevel = parseMaxSupportLevel(parsed.maxGuardLevel);
  const maxSpiritLevel = parseMaxSupportLevel(parsed.maxSpiritLevel);

  const looksLikeGmaxMove = Boolean(
    maxAttackMove &&
      (/g-?max/i.test(maxAttackMove) ||
        (/^giga/i.test(maxAttackMove) && !/giga impact|giga drain|gigaimpacto|gigadrenado/i.test(maxAttackMove)))
  );
  const isGigantamax = Boolean(parsed.isGigantamax) || looksLikeGmaxMove;
  const isDynamax =
    Boolean(parsed.isDynamax) ||
    isGigantamax ||
    Boolean(maxAttackMove) ||
    maxAttackLevel !== null ||
    maxGuardLevel !== null ||
    maxSpiritLevel !== null;

  const caughtDate = parsed.caughtDate ? String(parsed.caughtDate).trim() : null;
  const caughtLocation = parsed.caughtLocation ? String(parsed.caughtLocation).trim() : null;

  return {
    detected: true,
    name,
    cp,
    level,
    fastMove,
    chargedMove1,
    chargedMove2: chargedMove2Str || null,
    ivAtk,
    ivDef,
    ivHp,
    ivPercent,
    isShadow,
    isPurified,
    isShiny,
    canMegaEvolve,
    megaLevel,
    megaEnergy,
    megaEvolveCost,
    candy,
    candyXl,
    buddyLevel,
    isBestBuddy,
    isDynamax,
    isGigantamax,
    maxAttackMove,
    maxAttackLevel,
    maxGuardLevel,
    maxSpiritLevel,
    isLucky,
    frameIndex,
    caughtDate,
    caughtLocation,
  };
}

async function generateWithFallbackModels(
  client: GoogleGenAI,
  parts: any[],
  label: string
): Promise<string> {
  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  for (const modelName of modelsToTry) {
    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts }],
        config: {
          responseMimeType: 'application/json',
        },
      });
      const text = response.text?.trim() || '';
      if (text) return text;
    } catch (e) {
      console.warn(`Model ${modelName} failed for ${label}:`, e);
    }
  }
  return '';
}

/**
 * Analyzes a paired top + scrolled-down bottom capture of a single Pokémon in one Gemini Vision call.
 */
export async function analyzePokemonCapturePair(
  topDataUrl: string,
  bottomDataUrl?: string | null,
  index: number = 0
): Promise<FrameAnalysisResult> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error(
      'API Key de Gemini no configurada. Crea un archivo .env en la raíz del proyecto con:\nVITE_GEMINI_API_KEY="tu-api-key"'
    );
  }

  try {
    const topImg = extractBase64Part(topDataUrl);
    if (!topImg) {
      console.warn(`Pair #${index}: missing top base64 data`);
      return { detected: false };
    }

    const parts: any[] = [
      { text: PAIRED_ANALYSIS_PROMPT },
      { inlineData: { mimeType: topImg.mimeType, data: topImg.data } },
    ];

    if (bottomDataUrl) {
      const bottomImg = extractBase64Part(bottomDataUrl);
      if (bottomImg) {
        parts.push({ inlineData: { mimeType: bottomImg.mimeType, data: bottomImg.data } });
      }
    }

    const responseText = await generateWithFallbackModels(client, parts, `pair #${index}`);
    return parseGeminiPokemonResponse(responseText, index);
  } catch (err) {
    console.warn(`Error analizando par de capturas #${index}:`, err);
    return { detected: false };
  }
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
    const img = extractBase64Part(imageDataUrl);
    if (!img) {
      console.warn(`Frame #${frameIndex}: missing base64 data`);
      return { detected: false };
    }

    const parts = [
      { text: ANALYSIS_PROMPT },
      { inlineData: { mimeType: img.mimeType, data: img.data } },
    ];

    const responseText = await generateWithFallbackModels(client, parts, `frame #${frameIndex}`);
    return parseGeminiPokemonResponse(responseText, frameIndex);
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
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }

  // Deduplicate: merge entries for the same Pokémon (including scrolled top/bottom pairs)
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

/**
 * Deduplicates detected Pokémon by merging data from multiple frames (including scrolled bottom frames).
 * Groups detections of the same Pokémon name + CP and auto-fills missing moves and exact level.
 */
function deduplicateResults(results: DetectedPokemon[]): DetectedPokemon[] {
  const merged: DetectedPokemon[] = [];

  for (const result of results) {
    const hasBottomData = Boolean(
      result.fastMove ||
        result.chargedMove1 ||
        result.maxAttackLevel ||
        result.maxGuardLevel !== null ||
        result.maxSpiritLevel !== null ||
        result.caughtDate ||
        result.caughtLocation
    );

    if (!result.name || result.name === 'Unknown') {
      // If it's purely a scrolled-down screen (no name/CP header), merge into previous Pokémon
      if (result.cp === 0 && hasBottomData && merged.length > 0) {
        mergePokemonFrames(merged[merged.length - 1], result);
      }
      continue;
    }

    // Try to find an existing entry to merge with
    const existing = merged.find(
      (m) =>
        m.name.toLowerCase() === result.name.toLowerCase() &&
        (m.cp === result.cp || m.cp === 0 || result.cp === 0)
    );

    if (existing) {
      mergePokemonFrames(existing, result);
    } else {
      merged.push({ ...result });
    }
  }

  // Auto-fill missing moves from POGO_DATABASE fallback and solve exact level
  const enriched = merged.map((p) => {
    const dbPoke = POGO_DATABASE.find(
      (item) => item.name.toLowerCase() === p.name.toLowerCase()
    );

    let fastMove = p.fastMove;
    let chargedMove1 = p.chargedMove1;

    if (dbPoke) {
      if (!fastMove && dbPoke.fastMoves.length > 0) {
        fastMove = dbPoke.fastMoves[0].name;
      }
      if (!chargedMove1 && dbPoke.chargedMoves.length > 0) {
        chargedMove1 = dbPoke.chargedMoves[0].name;
      }
    }

    const level =
      p.level !== null
        ? p.level
        : p.cp > 0
        ? inferExactLevelForSpecies(p.name, p.cp, p.ivAtk, p.ivDef, p.ivHp)
        : null;

    return {
      ...p,
      level,
      fastMove,
      chargedMove1,
    };
  });

  // Filter: require name and valid CP
  return enriched.filter((m) => m.name && m.name !== 'Unknown' && typeof m.cp === 'number' && m.cp > 0);
}

function mergePokemonFrames(existing: DetectedPokemon, incoming: DetectedPokemon) {
  if (incoming.cp > 0) existing.cp = incoming.cp;
  if (incoming.level !== null) existing.level = incoming.level;
  if (incoming.fastMove) existing.fastMove = incoming.fastMove;
  if (incoming.chargedMove1) existing.chargedMove1 = incoming.chargedMove1;
  if (incoming.chargedMove2) existing.chargedMove2 = incoming.chargedMove2;
  if (incoming.ivAtk !== null) existing.ivAtk = incoming.ivAtk;
  if (incoming.ivDef !== null) existing.ivDef = incoming.ivDef;
  if (incoming.ivHp !== null) existing.ivHp = incoming.ivHp;
  if (incoming.ivPercent !== null) existing.ivPercent = incoming.ivPercent;
  if (incoming.isShadow) {
    existing.isShadow = true;
    existing.canMegaEvolve = false;
    existing.megaLevel = 0;
  }
  if (incoming.isPurified) existing.isPurified = true;
  if (incoming.isShiny) existing.isShiny = true;
  if (incoming.isLucky) existing.isLucky = true;
  if (incoming.candy !== null) existing.candy = incoming.candy;
  if (incoming.candyXl !== null) existing.candyXl = incoming.candyXl;
  if (incoming.buddyLevel !== null && (existing.buddyLevel === null || incoming.buddyLevel > existing.buddyLevel)) {
    existing.buddyLevel = incoming.buddyLevel;
  }
  if (incoming.isBestBuddy || existing.buddyLevel === 4) {
    existing.isBestBuddy = true;
    existing.buddyLevel = 4;
  }
  if (incoming.megaEnergy !== null) existing.megaEnergy = incoming.megaEnergy;
  if (incoming.megaEvolveCost !== null) existing.megaEvolveCost = incoming.megaEvolveCost;
  if (incoming.megaLevel !== null && (existing.megaLevel === null || incoming.megaLevel > existing.megaLevel)) {
    existing.megaLevel = incoming.megaLevel;
  }
  if (!existing.isShadow) {
    if (existing.megaEvolveCost !== null && existing.megaEvolveCost >= 100 && !existing.megaLevel) {
      existing.canMegaEvolve = false;
      existing.megaLevel = 0;
    } else if (
      incoming.canMegaEvolve ||
      (existing.megaEvolveCost !== null && existing.megaEvolveCost < 100) ||
      (existing.megaLevel !== null && existing.megaLevel >= 1)
    ) {
      existing.canMegaEvolve = true;
      if (!existing.megaLevel) {
        existing.megaLevel = 1;
      }
    }
  }
  if (incoming.isDynamax) existing.isDynamax = true;
  if (incoming.isGigantamax) {
    existing.isGigantamax = true;
    existing.isDynamax = true;
  }
  if (incoming.maxAttackMove) existing.maxAttackMove = incoming.maxAttackMove;
  if (incoming.maxAttackLevel !== null) existing.maxAttackLevel = incoming.maxAttackLevel;
  if (incoming.maxGuardLevel !== null) existing.maxGuardLevel = incoming.maxGuardLevel;
  if (incoming.maxSpiritLevel !== null) existing.maxSpiritLevel = incoming.maxSpiritLevel;
  if (incoming.caughtDate) existing.caughtDate = incoming.caughtDate;
  if (incoming.caughtLocation) existing.caughtLocation = incoming.caughtLocation;
}

/**
 * Converts a Gemini DetectedPokemon result into a UserPokemon payload ready for inventoryStore.
 */
export function detectedPokemonToUserPokemon(
  p: DetectedPokemon
): Omit<UserPokemon, 'id' | 'addedAt'> {
  const resolved = resolvePogoSpeciesAndForm(p.name);
  const ivAtk = p.ivAtk ?? 15;
  const ivDef = p.ivDef ?? 15;
  const ivHp = p.ivHp ?? 15;
  const level =
    p.level !== null && p.level !== undefined
      ? p.level
      : inferExactLevelForSpecies(resolved.speciesId || p.name, p.cp, ivAtk, ivDef, ivHp);

  const hasMax = Boolean(p.isDynamax || p.isGigantamax);
  const megaForms = getMegaFormsForPokemon(resolved.speciesId, resolved.displayName || p.name);
  const megaFields: Partial<UserPokemon> = {};

  if (megaForms.length > 0 && !p.isShadow) {
    if (p.canMegaEvolve) {
      megaFields.canMegaEvolve = true;
      megaFields.megaLevel = p.megaLevel && p.megaLevel >= 1 ? p.megaLevel : 1;
      megaFields.unlockedMegaForm = megaForms.length > 1 ? 'all' : megaForms[0].id;
    } else {
      megaFields.canMegaEvolve = false;
      megaFields.megaLevel = 0;
    }
    if (p.megaEnergy !== null && p.megaEnergy !== undefined) {
      megaFields.megaEnergy = p.megaEnergy;
    }
    if (p.megaEvolveCost !== null && p.megaEvolveCost !== undefined) {
      megaFields.megaEvolveCost = p.megaEvolveCost;
    }
  }

  return {
    speciesId: resolved.speciesId,
    name: resolved.displayName || p.name,
    cp: p.cp,
    level,
    ivAtk,
    ivDef,
    ivHp,
    fastMove: p.fastMove || resolved.fastMoves?.[0] || '',
    chargedMove1: p.chargedMove1 || resolved.chargedMoves?.[0] || '',
    chargedMove2: p.chargedMove2 || undefined,
    isShadow: p.isShadow,
    isPurified: Boolean(p.isPurified),
    isShiny: Boolean(p.isShiny),
    ...(p.isLucky ? { isLucky: true } : {}),
    ...(p.candy !== null && p.candy !== undefined ? { candy: p.candy } : {}),
    ...(p.candyXl !== null && p.candyXl !== undefined ? { candyXl: p.candyXl } : {}),
    ...(p.buddyLevel && p.buddyLevel > 0
      ? { buddyLevel: p.buddyLevel, isBestBuddy: p.buddyLevel === 4 || Boolean(p.isBestBuddy) }
      : p.isBestBuddy
      ? { buddyLevel: 4, isBestBuddy: true }
      : {}),
    ...megaFields,
    ...(hasMax
      ? {
          isDynamax: true,
          isGigantamax: Boolean(p.isGigantamax),
          ...(p.maxAttackMove ? { maxAttackMove: p.maxAttackMove } : {}),
          maxAttackLevel: p.maxAttackLevel ?? 1,
          maxGuardLevel: p.maxGuardLevel ?? 0,
          maxSpiritLevel: p.maxSpiritLevel ?? 0,
        }
      : {}),
    caughtDate: p.caughtDate || undefined,
    caughtLocation: p.caughtLocation || undefined,
    isFavorite: false,
  };
}

/**
 * Checks if the Gemini API key is configured.
 */
export function isGeminiConfigured(): boolean {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  return !!apiKey && apiKey !== 'YOUR_API_KEY_HERE';
}
