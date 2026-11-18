import { POGO_DATABASE } from '../data/pogoDatabase';

export interface NycQuest {
  name: string; // Nombre de la Poképarada
  lat: number;
  lng: number;
  rewards_string: string;
  conditions_string: string;
  image?: string;
  rewards_types?: string;
  rewards_amounts?: string;
  rewards_ids?: string;
}

export interface NycFilterData {
  t3: string[]; // Stardust
  t4: string[]; // Mega Energy
  t2: string[]; // Items
  t7: string[]; // Pokémon
  t8: string[]; // Pokécoins
  t9: string[]; // XL Candy
  t12: string[]; // Candy
}

export interface NycApiResponse {
  quests: NycQuest[];
  meta: { time: number };
  filters: NycFilterData;
}

export const ITEM_NAMES: Record<string, string> = {
  "1": "Poké Ball",
  "2": "Super Ball",
  "3": "Ultra Ball",
  "4": "Master Ball",
  "5": "Premier Ball",
  "101": "Poción",
  "102": "Superpoción",
  "103": "Hiperpoción",
  "104": "Poción Máxima",
  "201": "Revivir",
  "202": "Revivir Máximo",
  "301": "Huevo Suerte",
  "401": "Incienso",
  "501": "Módulo Cebo",
  "502": "Módulo Cebo Glaciar",
  "503": "Módulo Cebo Musgoso",
  "504": "Módulo Cebo Magnético",
  "701": "Baya Frambu",
  "702": "Baya Osta",
  "703": "Baya Latano",
  "705": "Baya Pinia",
  "706": "Baya Frambu Dorada",
  "707": "Baya Latano Dorada",
  "708": "Baya Pinia Plateada",
  "709": "Pokochazo (Poffin)",
  "902": "Incubadora",
  "903": "Superincubadora",
  "1101": "Piedra Solar",
  "1102": "Roca del Rey",
  "1103": "Revestimiento Metálico",
  "1104": "Escama Dragón",
  "1105": "Mejora",
  "1106": "Piedra Sinnoh",
  "1107": "Piedra Teselia",
  "1301": "Caramelo Raro (Rare Candy)",
  "1302": "Caramelo Raro XL",
};

// Mapeo de IDs especiales de Pokémon en nycpokemap
const SPECIAL_POKEMON_NAMES: Record<string, string> = {
  '890': 'Eternatus',
  '79-g': 'Slowpoke de Galar',
  '58-2792': 'Growlithe de Hisui',
  '351-29': 'Castform Sol',
  '351-30': 'Castform Lluvia',
  '351-31': 'Castform Nieve',
  '77-g': 'Ponyta de Galar',
  '83-g': "Farfetch'd de Galar",
  '110-g': 'Weezing de Galar',
  '263-g': 'Zigzagoon de Galar',
  '554-g': 'Darumaka de Galar',
  '562-g': 'Yamask de Galar',
};

export function getPokemonDisplayName(idStr: string): string {
  if (SPECIAL_POKEMON_NAMES[idStr]) {
    return SPECIAL_POKEMON_NAMES[idStr];
  }
  const numId = parseInt(idStr, 10);
  if (!isNaN(numId)) {
    const pkmn = POGO_DATABASE.find(p => p.id === numId);
    if (pkmn) return pkmn.name;
  }
  return `Pokémon #${idStr}`;
}

export function getItemDisplayName(idStr: string): string {
  return ITEM_NAMES[idStr] || `Objeto #${idStr}`;
}

/**
 * Realiza la petición con estrategia de fallbacks (Vite / Vercel proxy y proxies CORS públicos)
 */
async function fetchWithFallbacks(targetUrlQuery: string): Promise<Response> {
  const primaryUrl = `/api/nycpokemap/quests.php?${targetUrlQuery}`;
  const fullTargetUrl = `https://nycpokemap.com/quests.php?${targetUrlQuery}`;

  const candidates = [
    primaryUrl,
    `https://corsproxy.io/?${encodeURIComponent(fullTargetUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(fullTargetUrl)}`
  ];

  let lastError: any = null;

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });
      if (res.ok) {
        return res;
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('No se pudo conectar con nycpokemap.com a través de los canales disponibles.');
}

/**
 * Obtiene los filtros disponibles y metadatos de nycpokemap.com
 */
export async function fetchNycMetadata(): Promise<NycApiResponse> {
  const query = `time=${Date.now()}`;
  const res = await fetchWithFallbacks(query);
  const data: NycApiResponse = await res.json();
  return data;
}

/**
 * Consulta misiones según un listado de códigos de filtro:
 * Formato de filtro nycpokemap:
 * - Stardust: "3,{amount},0" (ej: "3,1000,0")
 * - Pokécoin: "8,{amount},0"
 * - Mega Energy: "4,0,{rewardId}"
 * - XL Candy: "9,0,{rewardId}"
 * - Candy: "12,0,{rewardId}"
 * - Pokémon: "7,0,{rewardId}"
 * - Items: "2,0,{rewardId}" (ej: "2,0,1301" para Rare Candy)
 */
export async function fetchNycQuestsByFilters(filterCodes: string[]): Promise<NycApiResponse> {
  const params = new URLSearchParams();
  for (const code of filterCodes) {
    params.append('quests[]', code);
  }
  params.append('time', Date.now().toString());

  const res = await fetchWithFallbacks(params.toString());
  const data: NycApiResponse = await res.json();
  return data;
}

/**
 * Filtros rápidos recomendados de alto valor para entrenadores PGSharp
 */
export const POPULAR_PRESET_FILTERS = [
  { id: 'eternatus', label: '🟣 25 Caramelos Eternatus', code: '4,0,890', category: 'candy' },
  { id: 'rare_candy', label: '⭐ Caramelo Raro', code: '2,0,1301', category: 'candy' },
  { id: 'stardust_1000', label: '💰 1,000+ Polvos', code: '3,1000,0', category: 'stardust' },
  { id: 'stardust_1500', label: '💰 1,500 Polvos', code: '3,1500,0', category: 'stardust' },
  { id: 'poffin', label: '🥐 Pokochazo (Poffin)', code: '2,0,709', category: 'item' },
  { id: 'golden_razz', label: '✨ Baya Frambu Dorada', code: '2,0,706', category: 'item' },
  { id: 'silver_pinap', label: '🍍 Baya Pinia Plateada', code: '2,0,708', category: 'item' },
  { id: 'spinda', label: '🌀 Spinda (#327)', code: '7,0,327', category: 'pokemon' },
  { id: 'bulbasaur', label: '🍃 Bulbasaur (#1)', code: '7,0,1', category: 'pokemon' },
  { id: 'charmander', label: '🔥 Charmander (#4)', code: '7,0,4', category: 'pokemon' },
  { id: 'squirtle', label: '💧 Squirtle (#7)', code: '7,0,7', category: 'pokemon' },
];

/**
 * Formatea las coordenadas exactamente para PGSharp: lat,long sin espacios después de la coma.
 */
export function formatCoordsForPgsharp(lat: number, lng: number): string {
  return `${lat},${lng}`;
}
