import { POGO_DATABASE } from '../data/pogoDatabase';
import { getDistance, getCooldownMinutes } from '../utils/pogoMath';

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

export interface NycRouteStop {
  quest: NycQuest;
  stepNumber: number;
  distanceFromPrevKm: number;
  cooldownMinutes: number;
  stopKey: string;
}

export type NycRouteOriginMode = 'auto_cluster' | 'last_stop' | 'map_point' | 'custom_coords';

export interface NycGeneratedRoute {
  stops: NycRouteStop[];
  totalDistanceKm: number;
  avgDistanceMeters: number;
  totalCooldownMinutes: number;
  originLabel: string;
  createdAt: number;
}

export interface GenerateNycRouteParams {
  candidateQuests: NycQuest[];
  targetCount: number;
  originCoords?: { lat: number; lng: number } | null;
  originQuest?: NycQuest | null;
  originMode: NycRouteOriginMode;
  originLabel?: string;
  excludedStopKeys?: Set<string>;
}

/**
 * Genera la clave única de una Poképarada consistente con visitedStops
 */
export function getQuestStopKey(quest: NycQuest): string {
  return `${(quest.name || '').trim()}_${formatCoordsForPgsharp(quest.lat, quest.lng)}`;
}

/**
 * Clave normalizada de coordenadas a 5 decimales (~1.1 m) para identificar la misma Poképarada física
 */
export function getQuestCoordKey(lat: number, lng: number): string {
  return `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;
}

/**
 * Extrae el conjunto de coordenadas normalizadas (5 decimales) desde el historial visitedStops
 */
export function extractVisitedCoordSet(visitedStops: Iterable<string>): Set<string> {
  const coords = new Set<string>();
  for (const entry of visitedStops) {
    if (!entry) continue;
    const lastUnderscore = entry.lastIndexOf('_');
    const rawCoord = lastUnderscore >= 0 ? entry.slice(lastUnderscore + 1) : entry;
    const parts = rawCoord.split(',');
    if (parts.length === 2) {
      const lat = Number(parts[0]);
      const lng = Number(parts[1]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        coords.add(getQuestCoordKey(lat, lng));
      }
    }
  }
  return coords;
}

/**
 * Verifica de forma estricta si una Poképarada ya fue visitada (por clave exacta o por coordenadas físicas)
 */
export function isQuestVisited(
  quest: NycQuest,
  visitedStops: Set<string>,
  visitedCoordSet?: Set<string>
): boolean {
  if (visitedStops.has(getQuestStopKey(quest))) return true;
  if (visitedStops.has(`${quest.name}_${formatCoordsForPgsharp(quest.lat, quest.lng)}`)) return true;
  const coordKey = getQuestCoordKey(quest.lat, quest.lng);
  if (visitedCoordSet) {
    return visitedCoordSet.has(coordKey);
  }
  return extractVisitedCoordSet(visitedStops).has(coordKey);
}

function calcChainDistanceKm(chain: NycQuest[]): number {
  let total = 0;
  for (let i = 1; i < chain.length; i++) {
    total += getDistance(chain[i - 1].lat, chain[i - 1].lng, chain[i].lat, chain[i].lng);
  }
  return total;
}

/**
 * Construye una cadena voraz (Nearest-Neighbor) de hasta `limit` paradas partiendo de `startIdx`
 */
function buildGreedyChain(
  pool: NycQuest[],
  startIdx: number,
  limit: number
): { chain: NycQuest[]; totalDistanceKm: number } {
  const n = pool.length;
  const used = new Uint8Array(n);
  const chain: NycQuest[] = [pool[startIdx]];
  used[startIdx] = 1;

  let current = pool[startIdx];
  let totalDist = 0;

  while (chain.length < limit) {
    let nearestIdx = -1;
    let minDist = Infinity;

    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      const dist = getDistance(current.lat, current.lng, pool[i].lat, pool[i].lng);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    }

    if (nearestIdx === -1) break;
    used[nearestIdx] = 1;
    current = pool[nearestIdx];
    chain.push(current);
    totalDist += minDist;
  }

  return { chain, totalDistanceKm: totalDist };
}

/**
 * Optimiza una ruta abierta con 2-Opt manteniendo fija la primera parada (path[0])
 */
function optimizeChain2Opt(initialChain: NycQuest[]): NycQuest[] {
  const n = initialChain.length;
  if (n <= 2) return [...initialChain];

  const path = [...initialChain];
  let improved = true;
  let iterations = 0;
  const maxIterations = 100;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 1; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = path[i - 1];
        const b = path[i];
        const c = path[j];

        const oldPrev = getDistance(a.lat, a.lng, b.lat, b.lng);
        const newPrev = getDistance(a.lat, a.lng, c.lat, c.lng);

        let delta = newPrev - oldPrev;
        if (j < n - 1) {
          const d = path[j + 1];
          const oldNext = getDistance(c.lat, c.lng, d.lat, d.lng);
          const newNext = getDistance(b.lat, b.lng, d.lat, d.lng);
          delta += newNext - oldNext;
        }

        if (delta < -1e-6) {
          let left = i;
          let right = j;
          while (left < right) {
            const tmp = path[left];
            path[left] = path[right];
            path[right] = tmp;
            left++;
            right--;
          }
          improved = true;
        }
      }
    }
  }

  return path;
}

/**
 * Selecciona semillas prometedoras por densidad local de vecinos cercanos para el modo auto_cluster
 */
function pickDenseClusterSeedIndices(pool: NycQuest[], limit: number): number[] {
  const n = pool.length;
  if (n <= 20) {
    return pool.map((_, idx) => idx);
  }

  const cosLat = Math.cos((40.75 * Math.PI) / 180);
  const k = Math.min(n - 1, Math.max(5, Math.min(15, Math.floor(limit / 2))));
  const scores: { idx: number; score: number }[] = [];

  // Para listas muy grandes, evaluamos una muestra espaciada o todas si n <= 1200
  const step = n > 1200 ? Math.ceil(n / 800) : 1;

  for (let i = 0; i < n; i += step) {
    const latI = pool[i].lat;
    const lngI = pool[i].lng;
    const smallest: number[] = [];

    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const dLat = pool[j].lat - latI;
      const dLng = (pool[j].lng - lngI) * cosLat;
      const d2 = dLat * dLat + dLng * dLng;

      if (smallest.length < k) {
        smallest.push(d2);
        if (smallest.length === k) {
          smallest.sort((a, b) => a - b);
        }
      } else if (d2 < smallest[k - 1]) {
        smallest[k - 1] = d2;
        for (let m = k - 1; m > 0 && smallest[m] < smallest[m - 1]; m--) {
          const tmp = smallest[m];
          smallest[m] = smallest[m - 1];
          smallest[m - 1] = tmp;
        }
      }
    }

    let sum = 0;
    for (let m = 0; m < smallest.length; m++) {
      sum += smallest[m];
    }
    scores.push({ idx: i, score: sum });
  }

  scores.sort((a, b) => a.score - b.score);

  const maxSeeds = limit > 150 ? 10 : 20;
  const selected = new Set<number>();
  for (let i = 0; i < scores.length && selected.size < maxSeeds; i++) {
    selected.add(scores[i].idx);
  }

  // Añadir algunas semillas distribuidas por índice para evitar óptimos locales
  const spreadCount = 5;
  for (let s = 0; s < spreadCount; s++) {
    const idx = Math.min(n - 1, Math.floor((s * n) / spreadCount));
    selected.add(idx);
  }

  return Array.from(selected);
}

/**
 * Genera una ruta óptima encadenando N Poképaradas con menor distancia posible (Nearest-Neighbor + 2-Opt)
 */
export function generateOptimalNycRoute(params: GenerateNycRouteParams): NycGeneratedRoute {
  const {
    candidateQuests,
    targetCount,
    originCoords,
    originQuest,
    originMode,
    originLabel,
    excludedStopKeys,
  } = params;

  const excludedCoords = excludedStopKeys
    ? extractVisitedCoordSet(excludedStopKeys)
    : new Set<string>();

  // Deduplicar por clave única y coordenada física, excluyendo estrictamente paradas ya visitadas
  const seenKeys = new Set<string>();
  const seenCoords = new Set<string>();
  const pool: NycQuest[] = [];
  for (const q of candidateQuests) {
    if (typeof q.lat !== 'number' || typeof q.lng !== 'number' || isNaN(q.lat) || isNaN(q.lng)) {
      continue;
    }
    if (excludedStopKeys && isQuestVisited(q, excludedStopKeys, excludedCoords)) {
      continue;
    }
    const key = getQuestStopKey(q);
    const coordKey = getQuestCoordKey(q.lat, q.lng);
    if (!seenKeys.has(key) && !seenCoords.has(coordKey)) {
      seenKeys.add(key);
      seenCoords.add(coordKey);
      pool.push(q);
    }
  }

  if (pool.length === 0 || targetCount <= 0) {
    return {
      stops: [],
      totalDistanceKm: 0,
      avgDistanceMeters: 0,
      totalCooldownMinutes: 0,
      originLabel: originLabel || 'Sin paradas disponibles',
      createdAt: Date.now(),
    };
  }

  const limit = Math.min(Math.max(1, Math.floor(targetCount)), pool.length);
  let bestChain: NycQuest[] = [];
  let resolvedOriginLabel = originLabel || '';

  if (originMode === 'last_stop' && originQuest) {
    const targetKey = getQuestStopKey(originQuest);
    let startIdx = pool.findIndex(q => getQuestStopKey(q) === targetKey);
    if (startIdx === -1) {
      // Si la parada origen ya está oculta/visitada, iniciar en la parada disponible más cercana a ella
      let minDist = Infinity;
      for (let i = 0; i < pool.length; i++) {
        const d = getDistance(originQuest.lat, originQuest.lng, pool[i].lat, pool[i].lng);
        if (d < minDist) {
          minDist = d;
          startIdx = i;
        }
      }
    }
    bestChain = buildGreedyChain(pool, Math.max(0, startIdx), limit).chain;
    if (!resolvedOriginLabel) {
      resolvedOriginLabel = `Desde ${originQuest.name || 'parada seleccionada'}`;
    }
  } else if ((originMode === 'map_point' || originMode === 'custom_coords') && originCoords) {
    let startIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < pool.length; i++) {
      const d = getDistance(originCoords.lat, originCoords.lng, pool[i].lat, pool[i].lng);
      if (d < minDist) {
        minDist = d;
        startIdx = i;
      }
    }
    bestChain = buildGreedyChain(pool, startIdx, limit).chain;
    if (!resolvedOriginLabel) {
      resolvedOriginLabel =
        originMode === 'map_point'
          ? `Punto en mapa (${originCoords.lat.toFixed(4)},${originCoords.lng.toFixed(4)})`
          : `Coordenadas (${originCoords.lat.toFixed(4)},${originCoords.lng.toFixed(4)})`;
    }
  } else {
    // Modo auto_cluster: buscar el clúster más denso entre semillas candidatas
    const seedIndices = pickDenseClusterSeedIndices(pool, limit);
    let minChainDist = Infinity;

    for (const seedIdx of seedIndices) {
      const candidate = buildGreedyChain(pool, seedIdx, limit);
      if (candidate.totalDistanceKm < minChainDist) {
        minChainDist = candidate.totalDistanceKm;
        bestChain = candidate.chain;
      }
    }

    if (!resolvedOriginLabel) {
      resolvedOriginLabel = 'Clúster más denso (Auto)';
    }
  }

  // Refinamiento con 2-Opt conservando fija la parada de inicio
  const optimizedChain = optimizeChain2Opt(bestChain);
  const totalDistanceKm = calcChainDistanceKm(optimizedChain);

  let totalCooldownMinutes = 0;
  const stops: NycRouteStop[] = optimizedChain.map((quest, idx) => {
    let distKm = 0;
    let cdMins = 0;
    if (idx > 0) {
      const prev = optimizedChain[idx - 1];
      distKm = getDistance(prev.lat, prev.lng, quest.lat, quest.lng);
      cdMins = getCooldownMinutes(distKm);
      totalCooldownMinutes += cdMins;
    }
    return {
      quest,
      stepNumber: idx + 1,
      distanceFromPrevKm: distKm,
      cooldownMinutes: cdMins,
      stopKey: getQuestStopKey(quest),
    };
  });

  const avgDistanceMeters =
    stops.length > 1 ? Math.round((totalDistanceKm * 1000) / (stops.length - 1)) : 0;

  return {
    stops,
    totalDistanceKm,
    avgDistanceMeters,
    totalCooldownMinutes: Number(totalCooldownMinutes.toFixed(1)),
    originLabel: resolvedOriginLabel,
    createdAt: Date.now(),
  };
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Genera un archivo GPX válido compatible con PGSharp para importar la ruta óptima completa
 */
export function generateNycRouteGPX(routeStops: NycRouteStop[]): string {
  const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="PokeSkills Hub - NYC Quests" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>NYC Quest Route (${routeStops.length} paradas)</name>
    <trkseg>`;

  const points = routeStops
    .map((s) => {
      const safeName = escapeXml(`#${s.stepNumber}. ${s.quest.name || 'Pokeparada'} (${s.quest.rewards_string || 'Quest'})`);
      const safeDesc = escapeXml(`${s.quest.conditions_string || ''} -> ${s.quest.rewards_string || ''}`);
      return `      <trkpt lat="${s.quest.lat}" lon="${s.quest.lng}">
        <name>${safeName}</name>
        <desc>${safeDesc}</desc>
      </trkpt>`;
    })
    .join('\n');

  const gpxFooter = `
    </trkseg>
  </trk>
</gpx>`;

  return `${gpxHeader}\n${points}\n${gpxFooter}`;
}

export interface NycCloudSyncPayload {
  visitedStops: string[];
  lastCopiedQuest?: NycQuest | null;
  activeRoute?: NycGeneratedRoute | null;
  routeCurrentIdx?: number;
  updatedAt: number;
  action?: 'merge' | 'replace';
  resetEpoch?: number;
}

const NYC_CLOUD_SYNC_BASE_ENDPOINTS = [
  '/api/nyc-cloud-sync',
  'https://ntfy.sh/pokeskills_nyc_sync_v3_salca',
];

/**
 * Descarga el estado consolidado de paradas visitadas NYC desde la nube (Celular <-> PC)
 */
export async function fetchNycCloudSyncState(): Promise<NycCloudSyncPayload | null> {
  for (const base of NYC_CLOUD_SYNC_BASE_ENDPOINTS) {
    try {
      const res = await fetch(`${base}/json?poll=1&since=all`, {
        method: 'GET',
        cache: 'no-store',
      });
      if (!res.ok) continue;
      const text = await res.text();
      const lines = text.trim().split('\n').filter(Boolean);

      let visitedSet = new Set<string>();
      let latestCopied: NycQuest | null = null;
      let latestUpdatedAt = 0;
      let currentResetEpoch = 0;

      for (const line of lines) {
        try {
          const env = JSON.parse(line);
          if (env?.event !== 'message' || typeof env.message !== 'string') continue;
          const data = JSON.parse(env.message);
          const ts = typeof data?.updatedAt === 'number' ? data.updatedAt : (env.time || 0) * 1000;
          const msgResetEpoch = typeof data?.resetEpoch === 'number' ? data.resetEpoch : 0;

          // Si el mensaje es una sustitución/reinicio autoritativo
          if (data?.action === 'replace' && ts >= currentResetEpoch) {
            currentResetEpoch = ts;
            visitedSet = new Set<string>();
            if (Array.isArray(data?.visitedStops)) {
              for (const s of data.visitedStops) {
                if (typeof s === 'string' && s) visitedSet.add(s);
              }
            }
          } else if (msgResetEpoch >= currentResetEpoch || ts >= currentResetEpoch) {
            // Incorporación normal respetando el último epoch de reinicio
            if (Array.isArray(data?.visitedStops)) {
              for (const s of data.visitedStops) {
                if (typeof s === 'string' && s) visitedSet.add(s);
              }
            }
          }

          if (ts >= latestUpdatedAt) {
            latestUpdatedAt = ts;
            if (data?.lastCopiedQuest !== undefined) {
              latestCopied = data.lastCopiedQuest;
            }
          }
        } catch {
          // Ignorar líneas malformadas
        }
      }

      return {
        visitedStops: Array.from(visitedSet),
        lastCopiedQuest: latestCopied,
        updatedAt: latestUpdatedAt,
        resetEpoch: currentResetEpoch,
      };
    } catch {
      // Probar siguiente endpoint
    }
  }
  return null;
}

/**
 * Sincroniza hacia la nube enviando únicamente los deltas nuevos en bloques seguros (<3 KB)
 * Soporta forceReplace para restablecer o vaciar el historial limpiamente en todos los dispositivos
 */
export async function pushNycCloudSyncState(
  localPayload: NycCloudSyncPayload,
  options?: { forceReplace?: boolean }
): Promise<NycCloudSyncPayload | null> {
  const isReplace = !!options?.forceReplace;
  const now = Date.now();

  let stopsToSend: string[] = [];
  let mergedVisited: string[] = [];

  if (isReplace) {
    stopsToSend = localPayload.visitedStops.filter(Boolean);
    mergedVisited = [...stopsToSend];
  } else {
    const remote = await fetchNycCloudSyncState();
    const remoteSet = new Set<string>(remote?.visitedStops || []);
    stopsToSend = localPayload.visitedStops.filter(k => k && !remoteSet.has(k));
    mergedVisited = Array.from(new Set<string>([...remoteSet, ...localPayload.visitedStops]));
  }

  const mergedPayload: NycCloudSyncPayload = {
    visitedStops: mergedVisited,
    lastCopiedQuest: localPayload.lastCopiedQuest ?? null,
    updatedAt: now,
    resetEpoch: isReplace ? now : undefined,
    action: isReplace ? 'replace' : 'merge',
  };

  if (!isReplace && stopsToSend.length === 0) {
    return mergedPayload;
  }

  // Dividir en bloques de máximo 35 paradas (~2.2 KB por bloque)
  const chunkSize = 35;
  const chunks: string[][] = [];
  if (stopsToSend.length === 0) {
    chunks.push([]);
  } else {
    for (let i = 0; i < stopsToSend.length; i += chunkSize) {
      chunks.push(stopsToSend.slice(i, i + chunkSize));
    }
  }

  for (const base of NYC_CLOUD_SYNC_BASE_ENDPOINTS) {
    let allOk = true;
    for (let c = 0; c < chunks.length; c++) {
      const isFirstChunk = c === 0;
      const isLastChunk = c === chunks.length - 1;
      const bodyStr = JSON.stringify({
        visitedStops: chunks[c],
        lastCopiedQuest: isLastChunk ? localPayload.lastCopiedQuest ?? null : undefined,
        updatedAt: now,
        action: isReplace && isFirstChunk ? 'replace' : 'merge',
        resetEpoch: isReplace ? now : undefined,
      });
      try {
        const res = await fetch(base, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: bodyStr,
        });
        if (!res.ok) {
          allOk = false;
          break;
        }
      } catch {
        allOk = false;
        break;
      }
    }
    if (allOk) {
      return mergedPayload;
    }
  }

  return mergedPayload;
}
