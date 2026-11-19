import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search,
  Copy,
  Check,
  RefreshCw,
  MapPin,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  Target,
  Gift,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  List,
  Map as MapIcon,
  X,
  Route,
  SkipBack,
  SkipForward,
  Download,
  Minimize2,
  Maximize2,
  Crosshair,
  PictureInPicture2,
  HelpCircle,
  Trash2,
  RotateCcw,
  Eye,
  EyeOff,
  Cloud
} from 'lucide-react';
import {
  NycQuest,
  NycFilterData,
  NycGeneratedRoute,
  NycRouteOriginMode,
  fetchNycMetadata,
  fetchNycQuestsByFilters,
  formatCoordsForPgsharp,
  getQuestStopKey,
  extractVisitedCoordSet,
  isQuestVisited,
  generateOptimalNycRoute,
  generateNycRouteGPX,
  fetchNycCloudSyncState,
  pushNycCloudSyncState,
  POPULAR_PRESET_FILTERS
} from '../services/nycPokeMapService';
import { getDistance } from '../utils/pogoMath';

interface NycQuestsToolProps {
  onBackToHub: () => void;
}

const NYC_STORAGE_KEYS = {
  VISITED_STOPS: 'pgsharp_copied_stops',
  ACTIVE_PRESET: 'nyc_active_preset',
  SELECTED_CONDITION: 'nyc_selected_condition',
  SELECTED_REWARD: 'nyc_selected_reward',
  SEARCH_TERM: 'nyc_search_term',
  HIDE_VISITED: 'nyc_hide_visited',
  VIEW_MODE: 'nyc_view_mode',
  QUESTS_CACHE: 'nyc_quests_cache_v1',
  LAST_COPIED: 'nyc_last_copied_quest_v1',
  ACTIVE_ROUTE: 'nyc_active_route_v1',
  ROUTE_IDX: 'nyc_active_route_idx_v1',
  MINI_HUD: 'nyc_mini_hud_mode_v1',
  MAP_VIEW: 'nyc_map_view_v1',
  ONLY_ROUTE_STOPS: 'nyc_only_route_stops_v1',
  ROUTE_COUNT: 'nyc_route_target_count_v1',
};

const QUESTS_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

interface QuestsCachePayload {
  preset: string;
  quests: NycQuest[];
  filters: NycFilterData | null;
  timestamp: number;
}

interface SavedMapView {
  lat: number;
  lng: number;
  zoom: number;
}

const NYC_QUICK_ZONES = [
  { id: 'central_park_s', label: '🌳 Central Park Sur', lat: 40.7678, lng: -73.9718 },
  { id: 'bryant_park', label: '⛲ Bryant Park', lat: 40.7536, lng: -73.9832 },
  { id: 'times_square', label: '🏙️ Times Square', lat: 40.7580, lng: -73.9855 },
  { id: 'midtown_east', label: '🏢 Midtown East', lat: 40.7549, lng: -73.9708 },
  { id: 'harlem', label: '🎷 Harlem', lat: 40.8075, lng: -73.9465 },
  { id: 'lower_manhattan', label: '🗽 Lower Manhattan', lat: 40.7128, lng: -74.0060 },
];

const ROUTE_COUNT_PRESETS = [10, 15, 25, 30, 50, 100];

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error guardando estado en localStorage:', e);
  }
}

function parseCoordsInput(raw: string): { lat: number; lng: number } | null {
  const cleaned = raw.trim().replace(/\s+/g, '');
  const parts = cleaned.split(',');
  if (parts.length !== 2) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function formatDistanceMeters(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(2)} km`;
}

function formatCooldownShort(mins: number): string {
  if (mins <= 0) return '0s';
  if (mins < 1) return `~${Math.round(mins * 60)}s`;
  return `~${Math.round(mins)} min`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Icono personalizado para las Poképaradas en el mapa
function createPokestopDivIcon(quest: NycQuest, isVisited: boolean, isSelected: boolean): L.DivIcon {
  const isEternatus = quest.rewards_string?.toLowerCase().includes('eternatus') || quest.rewards_ids === '890';
  const isCandy = quest.rewards_string?.toLowerCase().includes('rare candy') || quest.rewards_ids === '1301';
  const isStardust = quest.rewards_types === '3' || quest.rewards_string?.toLowerCase().includes('stardust');

  let bg = '#2563EB'; // Azul Pokestop
  let border = '#1D4ED8';
  let symbol = '📍';

  if (isEternatus) {
    bg = '#9333EA'; // Púrpura Eternatus
    border = '#6B21A8';
    symbol = '🟣';
  } else if (isCandy) {
    bg = '#F59E0B'; // Ámbar Caramelo Raro
    border = '#B45309';
    symbol = '⭐';
  } else if (isStardust) {
    bg = '#10B981'; // Esmeralda Polvos
    border = '#047857';
    symbol = '💰';
  }

  if (isVisited) {
    border = '#16A34A';
  }

  const size = isSelected ? 34 : 26;
  const content = isVisited ? '✓' : symbol;

  const html = `
    <div style="
      background: ${bg};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: ${isSelected ? '3px solid #FFE550' : `2px solid ${border}`};
      box-shadow: ${isSelected ? '0 0 12px #FFE550, 0 4px 10px rgba(0,0,0,0.5)' : '0 2px 5px rgba(0,0,0,0.35)'};
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 900;
      font-size: ${isSelected ? '15px' : '11px'};
      cursor: pointer;
      transition: transform 0.15s ease-out;
      transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
    ">
      ${content}
    </div>
  `;

  return L.divIcon({
    className: 'pogo-pokestop-icon',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// Icono numerado 1..N para las paradas dentro de la ruta óptima
function createRouteStopDivIcon(
  stepNumber: number,
  isCurrent: boolean,
  isDoneOrVisited: boolean
): L.DivIcon {
  let bg = '#1D4ED8'; // Próximas en ruta
  let border = '#FFFFFF';
  let size = 28;
  let shadow = '0 3px 8px rgba(0,0,0,0.45)';

  if (isCurrent) {
    bg = '#C22615'; // Parada actual destacada
    border = '#FFE550';
    size = 38;
    shadow = '0 0 0 4px rgba(255, 229, 80, 0.55), 0 6px 14px rgba(0,0,0,0.6)';
  } else if (isDoneOrVisited) {
    bg = '#10B981'; // Completada / visitada
    border = '#065F46';
    size = 26;
  }

  const label = isDoneOrVisited && !isCurrent ? `${stepNumber}✓` : `${stepNumber}`;

  const html = `
    <div style="
      background: ${bg};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: ${isCurrent ? '3px' : '2px'} solid ${border};
      box-shadow: ${shadow};
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 900;
      font-size: ${isCurrent ? '13px' : '10px'};
      font-family: system-ui, sans-serif;
      cursor: pointer;
      ${isCurrent ? 'transform: scale(1.1);' : ''}
    ">
      ${label}
    </div>
  `;

  return L.divIcon({
    className: 'pogo-route-stop-icon',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function createOriginPinDivIcon(): L.DivIcon {
  const html = `
    <div style="
      background: #0B1B3C;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 3px solid #FFE550;
      box-shadow: 0 3px 10px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    ">
      🚩
    </div>
  `;

  return L.divIcon({
    className: 'pogo-origin-pin',
    html,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

// Las 63 Poképaradas registradas y visitadas en la sesión de hoy
export const INITIAL_VISITED_STOPS: string[] = [
  "Memorial bench for Joseph Brandefine_40.594178,-74.186656",
  "Greenstreets park_40.537626,-74.189922",
  "Ceramic Waterspout Gargoyle_40.767642,-73.959876",
  "Graffiti Mural Circa 2002_40.798824,-73.939784",
  "What Sunshine is to Flowers, Smiles are to Humanity_40.797485,-73.93655",
  "Welcome to Heavenly Harlem Mural_40.795223,-73.931625",
  "El Mural De Las Cruces_40.79046,-73.944719",
  "Pleasant Youth Center_40.795745,-73.932453",
  "Holy Tabernacle Church_40.794532,-73.935765",
  "Macedonian Pentecostal Church_40.79922,-73.936347",
  "Glass Mosaic_40.797692,-73.940975",
  "Oye Como Va Mural_40.794196,-73.943103",
  "Franklin Plaza Playground #2_40.791884,-73.942757",
  "George Washington Carver as a Boy_40.789389,-73.951667",
  "Peter and Sophie Quinn_40.790766,-73.954955",
  "North Meadow Ballfield 1_40.793187,-73.960354",
  "Claire's Kitchen Cafe_40.799779,-73.952652",
  "Fields Court_40.801829,-73.953807",
  "Adam Clayton Powell Jr Malls_40.803868,-73.952092",
  "Ceres Frieze_40.805449,-73.952614",
  "Manhattan Ave & W 120th St_40.807516,-73.955342",
  "St. Paul's Chapel_40.80788,-73.960945",
  "Warren Hall_40.806303,-73.961289",
  "Reach for the Stars Inspirational Mosaic_40.800535,-73.958793",
  "Starbucks_40.79888,-73.96837",
  "Metro Diner_40.79742,-73.970068",
  "Lenny’s Bagels_40.795835,-73.971242",
  "Stone Lion on 92nd Street_40.790879,-73.970483",
  "Abstract Relief_40.789752,-73.971687",
  "Street Vendor Tilework_40.789199,-73.976174",
  "Louis D. Brandes Mural_40.785979,-73.974716",
  "Bard Graduate Center_40.785959,-73.971254",
  "Swings in the Central Park_40.783209,-73.967231",
  "Verizon_40.78111152,-73.96749271",
  "Alberto Arroyo_40.781819,-73.962297",
  "Cedar Hill Northwest Boundary Sign_40.777973,-73.966378",
  "Face Off_40.778112,-73.978101",
  "Birds And The Bees_40.778533,-73.979608",
  "Verdi Square_40.77916,-73.98158",
  "Facade_40.778725,-73.985106",
  "West 59th Street Generating Station_40.771636,-73.990658",
  "Bronzed Time_40.768754,-73.989026",
  "Pattern of Trees Mural_40.766514,-73.990051",
  "Bartolo's_40.76625,-73.994173",
  "Pier 84 Public Boat Launch_40.764194,-74.001776",
  "Monsters Graffiti_40.76233,-73.997585",
  "Sky Swimming Pool_40.761333,-73.998373",
  "Henrock The Bulldog_40.759865,-73.989651",
  "I.A.T.S.E. Local One_40.76004,-73.988882",
  "Saint Luke's Lutheran Church_40.759972,-73.988607",
  "Hotel Edison_40.759688,-73.985932",
  "Peninsula Hotel_40.761659,-73.975184",
  "Stone Boat Fountain_40.761807,-73.972978",
  "Round Fountain at Ruppert Park_40.780776,-73.95026",
  "Dekovats Playground_40.779267,-73.94447",
  "Carl Schurz Park_40.777176,-73.942901",
  "St. Stephen of Hungary Catholic Church_40.773881,-73.950469",
  "Gracie Mews Outdoor Sculpture_40.772953,-73.951779",
  "Congregation Bnai Jehuda Sign board_40.771997,-73.953871",
  "Ornate Wreaths_40.771362,-73.961656",
  "Virgin Mother by Damien Hirst_40.759692,-73.97251",
  "Stone Muse_40.76724,-73.960407",
  "Pita Grill Wall Sculpture_40.759473,-73.965374"
];

export const NycQuestsTool: React.FC<NycQuestsToolProps> = ({ onBackToHub }) => {
  // Hidratar preset inicial y caché para arranque instantáneo sin perder estado al cambiar de app
  const initialPreset = useMemo(
    () => readStorage<string>(NYC_STORAGE_KEYS.ACTIVE_PRESET, 'eternatus'),
    []
  );

  const initialCache = useMemo(() => {
    const cached = readStorage<QuestsCachePayload | null>(NYC_STORAGE_KEYS.QUESTS_CACHE, null);
    if (
      cached &&
      cached.preset === initialPreset &&
      Array.isArray(cached.quests) &&
      cached.quests.length > 0 &&
      Date.now() - cached.timestamp < QUESTS_CACHE_TTL_MS
    ) {
      return cached;
    }
    return null;
  }, [initialPreset]);

  const [loading, setLoading] = useState<boolean>(!initialCache);
  const [error, setError] = useState<string | null>(null);
  const [availableFilters, setAvailableFilters] = useState<NycFilterData | null>(
    initialCache?.filters ?? null
  );
  const [quests, setQuests] = useState<NycQuest[]>(initialCache?.quests ?? []);
  const [selectedQuest, setSelectedQuest] = useState<NycQuest | null>(null);
  const [copiedCoords, setCopiedCoords] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>(() =>
    readStorage<'map' | 'list'>(NYC_STORAGE_KEYS.VIEW_MODE, 'map')
  );
  const [hideVisited, setHideVisited] = useState<boolean>(() =>
    readStorage<boolean>(NYC_STORAGE_KEYS.HIDE_VISITED, false)
  );

  // Cargar paradas visitadas combinando la lista inicial con localStorage
  const [visitedStops, setVisitedStops] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(NYC_STORAGE_KEYS.VISITED_STOPS);
      const existing: string[] = saved ? JSON.parse(saved) : [];
      const combined = new Set<string>([...INITIAL_VISITED_STOPS, ...existing]);
      localStorage.setItem(NYC_STORAGE_KEYS.VISITED_STOPS, JSON.stringify(Array.from(combined)));
      return combined;
    } catch {
      return new Set(INITIAL_VISITED_STOPS);
    }
  });

  // Última parada copiada persistida (antirreinicio)
  const [lastCopiedQuest, setLastCopiedQuest] = useState<NycQuest | null>(() =>
    readStorage<NycQuest | null>(NYC_STORAGE_KEYS.LAST_COPIED, null)
  );

  // Filtros interactivos persistidos
  const [searchTerm, setSearchTerm] = useState<string>(() =>
    readStorage<string>(NYC_STORAGE_KEYS.SEARCH_TERM, '')
  );
  const [selectedCondition, setSelectedCondition] = useState<string>(() =>
    readStorage<string>(NYC_STORAGE_KEYS.SELECTED_CONDITION, 'all')
  );
  const [selectedReward, setSelectedReward] = useState<string>(() =>
    readStorage<string>(NYC_STORAGE_KEYS.SELECTED_REWARD, 'all')
  );
  const [activePreset, setActivePreset] = useState<string>(initialPreset);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(
    initialCache ? new Date(initialCache.timestamp) : null
  );

  // Estado del Generador de Rutas Óptimas
  const [isRoutePlannerOpen, setIsRoutePlannerOpen] = useState<boolean>(false);
  const [originMode, setOriginMode] = useState<NycRouteOriginMode>('auto_cluster');
  const [routeTargetCount, setRouteTargetCount] = useState<number>(() =>
    readStorage<number>(NYC_STORAGE_KEYS.ROUTE_COUNT, 30)
  );
  const [excludeVisitedOnRoute, setExcludeVisitedOnRoute] = useState<boolean>(true);
  const [customCoordsInput, setCustomCoordsInput] = useState<string>('40.7536,-73.9832');
  const [mapPickCoords, setMapPickCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isPickingOriginOnMap, setIsPickingOriginOnMap] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const [activeRoute, setActiveRoute] = useState<NycGeneratedRoute | null>(() =>
    readStorage<NycGeneratedRoute | null>(NYC_STORAGE_KEYS.ACTIVE_ROUTE, null)
  );
  const [routeCurrentIdx, setRouteCurrentIdx] = useState<number>(() => {
    const savedRoute = readStorage<NycGeneratedRoute | null>(NYC_STORAGE_KEYS.ACTIVE_ROUTE, null);
    const savedIdx = readStorage<number>(NYC_STORAGE_KEYS.ROUTE_IDX, 0);
    if (!savedRoute || !savedRoute.stops.length) return 0;
    return Math.min(Math.max(0, savedIdx), savedRoute.stops.length - 1);
  });
  const [showOnlyRouteStops, setShowOnlyRouteStops] = useState<boolean>(() =>
    readStorage<boolean>(NYC_STORAGE_KEYS.ONLY_ROUTE_STOPS, false)
  );

  // Modo Mini Barra Horizontal (HUD Compacto)
  const [isMiniHudMode, setIsMiniHudMode] = useState<boolean>(() => {
    const wantHud = readStorage<boolean>(NYC_STORAGE_KEYS.MINI_HUD, false);
    const savedRoute = readStorage<NycGeneratedRoute | null>(NYC_STORAGE_KEYS.ACTIVE_ROUTE, null);
    return Boolean(wantHud && savedRoute && savedRoute.stops.length > 0);
  });
  const [pauseMapInHud, setPauseMapInHud] = useState<boolean>(true);
  const [showAndroidTip, setShowAndroidTip] = useState<boolean>(false);
  const [isPipOpen, setIsPipOpen] = useState<boolean>(false);

  // Referencias para mapa Leaflet y Document PiP
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const isPickingOriginRef = useRef<boolean>(isPickingOriginOnMap);
  const pipWindowRef = useRef<Window | null>(null);
  const skipNextPanRef = useRef<boolean>(false);
  const hasPulledCloudRef = useRef<boolean>(false);
  const isPullingCloudRef = useRef<boolean>(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState<Date | null>(null);

  useEffect(() => {
    isPickingOriginRef.current = isPickingOriginOnMap;
  }, [isPickingOriginOnMap]);

  // Persistir filtros y estados clave en localStorage
  useEffect(() => {
    writeStorage(NYC_STORAGE_KEYS.ACTIVE_PRESET, activePreset);
  }, [activePreset]);

  useEffect(() => {
    writeStorage(NYC_STORAGE_KEYS.SELECTED_CONDITION, selectedCondition);
  }, [selectedCondition]);

  useEffect(() => {
    writeStorage(NYC_STORAGE_KEYS.SELECTED_REWARD, selectedReward);
  }, [selectedReward]);

  useEffect(() => {
    writeStorage(NYC_STORAGE_KEYS.SEARCH_TERM, searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    writeStorage(NYC_STORAGE_KEYS.HIDE_VISITED, hideVisited);
  }, [hideVisited]);

  useEffect(() => {
    writeStorage(NYC_STORAGE_KEYS.VIEW_MODE, viewMode);
  }, [viewMode]);

  useEffect(() => {
    writeStorage(NYC_STORAGE_KEYS.LAST_COPIED, lastCopiedQuest);
  }, [lastCopiedQuest]);

  useEffect(() => {
    writeStorage(NYC_STORAGE_KEYS.ACTIVE_ROUTE, activeRoute);
  }, [activeRoute]);

  useEffect(() => {
    writeStorage(NYC_STORAGE_KEYS.ROUTE_IDX, routeCurrentIdx);
  }, [routeCurrentIdx]);

  useEffect(() => {
    writeStorage(NYC_STORAGE_KEYS.MINI_HUD, isMiniHudMode);
  }, [isMiniHudMode]);

  useEffect(() => {
    writeStorage(NYC_STORAGE_KEYS.ONLY_ROUTE_STOPS, showOnlyRouteStops);
  }, [showOnlyRouteStops]);

  useEffect(() => {
    writeStorage(NYC_STORAGE_KEYS.ROUTE_COUNT, routeTargetCount);
  }, [routeTargetCount]);

  // Sincronización automática bidireccional en la nube (Celular <-> PC)
  const handleSyncWithCloud = useCallback(
    async (showToastOnSuccess = false) => {
      if (isPullingCloudRef.current) return;
      isPullingCloudRef.current = true;
      setIsCloudSyncing(true);
      try {
        const remote = await fetchNycCloudSyncState();
        let mergedList: string[] = Array.from(visitedStops);
        let addedFromCloud = 0;

        if (remote && Array.isArray(remote.visitedStops)) {
          const unionSet = new Set<string>(visitedStops);
          for (const k of remote.visitedStops) {
            if (k && !unionSet.has(k)) {
              unionSet.add(k);
              addedFromCloud++;
            }
          }
          mergedList = Array.from(unionSet);
          if (addedFromCloud > 0) {
            setVisitedStops(unionSet);
            try {
              localStorage.setItem(NYC_STORAGE_KEYS.VISITED_STOPS, JSON.stringify(mergedList));
            } catch (e) {
              console.error(e);
            }
          }

          if (!lastCopiedQuest && remote.lastCopiedQuest) {
            setLastCopiedQuest(remote.lastCopiedQuest);
          }
        }

        hasPulledCloudRef.current = true;

        // Si el dispositivo local tiene paradas que la nube aún no tenía o se pidió sync manual, subir la unión
        const remoteCount = remote?.visitedStops?.length ?? 0;
        if (mergedList.length > remoteCount || showToastOnSuccess) {
          await pushNycCloudSyncState({
            visitedStops: mergedList,
            lastCopiedQuest,
            activeRoute,
            routeCurrentIdx,
            updatedAt: Date.now(),
          });
        }

        setLastCloudSyncAt(new Date());
        if (showToastOnSuccess) {
          setCopiedCoords(
            addedFromCloud > 0
              ? `☁️ +${addedFromCloud} paradas sincronizadas desde tu otro dispositivo (${mergedList.length} total)`
              : `☁️ Nube al día (${mergedList.length} paradas sincronizadas Celular ↔ PC)`
          );
          setTimeout(() => setCopiedCoords(null), 3200);
        }
      } catch (e) {
        console.error('Error sincronizando con la nube:', e);
      } finally {
        isPullingCloudRef.current = false;
        setIsCloudSyncing(false);
      }
    },
    [visitedStops, lastCopiedQuest, activeRoute, routeCurrentIdx]
  );

  // Pull inicial al abrir en PC o Celular y cada vez que la pestaña vuelve a foco
  useEffect(() => {
    handleSyncWithCloud(false);

    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        handleSyncWithCloud(false);
      }
    };
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);
    return () => {
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push automático con debounce cuando se marcan nuevas paradas visitadas o avanza la ruta
  useEffect(() => {
    if (!hasPulledCloudRef.current) return;
    const timer = setTimeout(() => {
      pushNycCloudSyncState({
        visitedStops: Array.from(visitedStops),
        lastCopiedQuest,
        activeRoute,
        routeCurrentIdx,
        updatedAt: Date.now(),
      })
        .then(res => {
          if (res) setLastCloudSyncAt(new Date());
        })
        .catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [visitedStops, lastCopiedQuest, activeRoute, routeCurrentIdx]);

  // Conjunto de coordenadas normalizadas a 5 decimales (~1.1 m) de todas las paradas visitadas
  const visitedCoordSet = useMemo(() => extractVisitedCoordSet(visitedStops), [visitedStops]);

  const checkQuestVisited = useCallback(
    (quest: NycQuest) => isQuestVisited(quest, visitedStops, visitedCoordSet),
    [visitedStops, visitedCoordSet]
  );

  // Registro de paradas ya copiadas / teletransportadas (individual o por lote)
  const markAsVisited = useCallback((key: string) => {
    setVisitedStops(prev => {
      if (prev.has(key)) return prev;
      const updated = new Set(prev);
      updated.add(key);
      try {
        localStorage.setItem(NYC_STORAGE_KEYS.VISITED_STOPS, JSON.stringify(Array.from(updated)));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  }, []);

  const markQuestsAsVisited = useCallback((questsToMark: NycQuest[]) => {
    if (!questsToMark.length) return;
    setVisitedStops(prev => {
      const updated = new Set(prev);
      let changed = false;
      for (const q of questsToMark) {
        const key = getQuestStopKey(q);
        if (!updated.has(key)) {
          updated.add(key);
          changed = true;
        }
      }
      if (!changed) return prev;
      try {
        localStorage.setItem(NYC_STORAGE_KEYS.VISITED_STOPS, JSON.stringify(Array.from(updated)));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  }, []);

  // Copia de coordenadas exacta: lat,long sin espacios
  const handleCopyCoords = useCallback(
    async (quest: NycQuest, e?: React.MouseEvent, toastLabel?: string) => {
      if (e) e.stopPropagation();
      const formatted = formatCoordsForPgsharp(quest.lat, quest.lng);
      const stopKey = getQuestStopKey(quest);

      const copyWithTextareaFallback = () => {
        const textarea = document.createElement('textarea');
        textarea.value = formatted;
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      };

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(formatted);
          } catch {
            copyWithTextareaFallback();
          }
        } else {
          copyWithTextareaFallback();
        }

        const displayMsg = toastLabel ? `${toastLabel}: ${formatted}` : formatted;
        setCopiedCoords(displayMsg);
        markAsVisited(stopKey);
        setLastCopiedQuest(quest);
        setTimeout(() => {
          setCopiedCoords(curr => (curr === displayMsg ? null : curr));
        }, 3000);
      } catch (err) {
        console.error('Error al copiar coordenadas:', err);
      }
    },
    [markAsVisited]
  );

  // Carga de datos desde nycpokemap.com con almacenamiento en caché local
  const loadData = useCallback(
    async (filterCodes?: string[], presetKeyOverride?: string) => {
      const presetKey = presetKeyOverride || activePreset;
      setLoading(true);
      setError(null);
      try {
        const meta = await fetchNycMetadata();
        setAvailableFilters(meta.filters);

        let queryCodes = filterCodes;
        if (!queryCodes || queryCodes.length === 0) {
          if (presetKey === 'eternatus') {
            queryCodes = ['4,0,890'];
          } else if (presetKey === 'all_popular') {
            queryCodes = POPULAR_PRESET_FILTERS.map(p => p.code);
          } else {
            const match = POPULAR_PRESET_FILTERS.find(p => p.id === presetKey);
            queryCodes = match ? [match.code] : ['4,0,890'];
          }
        }

        const questData = await fetchNycQuestsByFilters(queryCodes);
        const fetchedQuests = questData.quests || [];
        setQuests(fetchedQuests);
        const now = Date.now();
        setLastUpdated(new Date(now));

        const cachePayload: QuestsCachePayload = {
          preset: presetKey,
          quests: fetchedQuests,
          filters: meta.filters || null,
          timestamp: now,
        };
        writeStorage(NYC_STORAGE_KEYS.QUESTS_CACHE, cachePayload);
      } catch (err: any) {
        console.error(err);
        setError('No se pudo conectar a nycpokemap.com. Revisa tu conexión o intenta recargar.');
      } finally {
        setLoading(false);
      }
    },
    [activePreset]
  );

  // Carga inicial solo si no hay caché válida para el preset activo
  useEffect(() => {
    if (!initialCache) {
      loadData(undefined, initialPreset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manejador de atajos rápidos
  const handleSelectPreset = (presetId: string, code: string) => {
    setActivePreset(presetId);
    setSelectedCondition('all');
    setSelectedReward('all');
    setSearchTerm('');
    setSelectedQuest(null);
    loadData([code], presetId);
  };

  const handleSelectAllPopular = () => {
    setActivePreset('all_popular');
    setSelectedCondition('all');
    setSelectedReward('all');
    setSearchTerm('');
    setSelectedQuest(null);
    loadData(
      POPULAR_PRESET_FILTERS.map(p => p.code),
      'all_popular'
    );
  };

  // Condiciones (desafíos) únicas
  const uniqueConditions = useMemo(() => {
    const set = new Set<string>();
    quests.forEach(q => {
      if (q.conditions_string && q.conditions_string.trim()) {
        set.add(q.conditions_string.trim());
      }
    });
    return Array.from(set).sort();
  }, [quests]);

  // Recompensas únicas
  const uniqueRewards = useMemo(() => {
    const set = new Set<string>();
    quests.forEach(q => {
      if (q.rewards_string && q.rewards_string.trim()) {
        set.add(q.rewards_string.trim());
      }
    });
    return Array.from(set).sort();
  }, [quests]);

  // Filtrado reactivo en memoria
  const filteredQuests = useMemo(() => {
    return quests.filter(q => {
      if (searchTerm.trim()) {
        const lower = searchTerm.toLowerCase();
        const matchesName = q.name?.toLowerCase().includes(lower);
        const matchesCond = q.conditions_string?.toLowerCase().includes(lower);
        const matchesReward = q.rewards_string?.toLowerCase().includes(lower);
        if (!matchesName && !matchesCond && !matchesReward) return false;
      }

      if (selectedCondition !== 'all' && q.conditions_string !== selectedCondition) {
        return false;
      }

      if (selectedReward !== 'all' && q.rewards_string !== selectedReward) {
        return false;
      }

      if (hideVisited) {
        if (checkQuestVisited(q)) return false;
      }

      return true;
    });
  }, [quests, searchTerm, selectedCondition, selectedReward, hideVisited, checkQuestVisited]);

  const unvisitedFilteredCount = useMemo(() => {
    return filteredQuests.filter(q => !checkQuestVisited(q)).length;
  }, [filteredQuests, checkQuestVisited]);

  // Generación de ruta óptima
  const handleGenerateRoute = useCallback(
    (overrides?: {
      mode?: NycRouteOriginMode;
      originQuest?: NycQuest | null;
      originCoords?: { lat: number; lng: number } | null;
      originLabel?: string;
      openHud?: boolean;
      markPrevRouteAllVisited?: boolean;
    }) => {
      setRouteError(null);
      const effectiveMode = overrides?.mode ?? originMode;

      // Consolidar sincrónicamente todas las paradas ya visitadas (incluyendo las ya recorridas en la ruta activa)
      const effectiveVisited = new Set<string>(visitedStops);
      let visitedAdded = false;
      if (activeRoute && activeRoute.stops.length > 0 && excludeVisitedOnRoute) {
        const uptoIdx = overrides?.markPrevRouteAllVisited
          ? activeRoute.stops.length - 1
          : routeCurrentIdx;
        for (let i = 0; i <= Math.min(uptoIdx, activeRoute.stops.length - 1); i++) {
          const k = getQuestStopKey(activeRoute.stops[i].quest);
          if (!effectiveVisited.has(k)) {
            effectiveVisited.add(k);
            visitedAdded = true;
          }
        }
      }
      const effectiveVisitedCoords = extractVisitedCoordSet(effectiveVisited);

      let pool = filteredQuests;
      if (excludeVisitedOnRoute) {
        pool = filteredQuests.filter(
          q => !isQuestVisited(q, effectiveVisited, effectiveVisitedCoords)
        );
      }

      const explicitOriginQuest =
        overrides?.originQuest !== undefined
          ? overrides.originQuest
          : selectedQuest || lastCopiedQuest;

      // Si el usuario inicia ruta explícitamente desde una parada concreta NO visitada, incluirla
      if (
        effectiveMode === 'last_stop' &&
        explicitOriginQuest &&
        overrides?.originQuest &&
        !pool.some(q => getQuestStopKey(q) === getQuestStopKey(explicitOriginQuest)) &&
        (!excludeVisitedOnRoute ||
          !isQuestVisited(explicitOriginQuest, effectiveVisited, effectiveVisitedCoords))
      ) {
        pool = [explicitOriginQuest, ...pool];
      }

      if (pool.length === 0) {
        setRouteError(
          'No hay paradas pendientes sin visitar con los filtros actuales. Desmarca "Omitir ya visitadas" o cambia los filtros.'
        );
        return;
      }

      let resolvedCoords = overrides?.originCoords ?? null;
      let resolvedLabel = overrides?.originLabel;

      if (effectiveMode === 'last_stop' && !explicitOriginQuest) {
        setRouteError(
          'Primero toca una Poképarada en el mapa o copia una para usarla como inicio, o elige otro modo de inicio.'
        );
        return;
      }

      if (effectiveMode === 'map_point') {
        resolvedCoords = resolvedCoords || mapPickCoords;
        if (!resolvedCoords) {
          setRouteError('Toca primero un punto en el mapa con "Elegir punto en el mapa".');
          return;
        }
      }

      if (effectiveMode === 'custom_coords') {
        resolvedCoords = resolvedCoords || parseCoordsInput(customCoordsInput);
        if (!resolvedCoords) {
          setRouteError('Coordenadas inválidas. Usa el formato lat,lng (ej. 40.7536,-73.9832).');
          return;
        }
      }

      const target =
        routeTargetCount <= 0 ? pool.length : Math.min(routeTargetCount, pool.length);

      const generated = generateOptimalNycRoute({
        candidateQuests: pool,
        targetCount: target,
        originMode: effectiveMode,
        originQuest: effectiveMode === 'last_stop' ? explicitOriginQuest : null,
        originCoords: resolvedCoords,
        originLabel: resolvedLabel,
        excludedStopKeys: excludeVisitedOnRoute ? effectiveVisited : undefined,
      });

      if (generated.stops.length === 0) {
        setRouteError('No se pudo generar la ruta con las paradas disponibles.');
        return;
      }

      // Marcar inmediatamente la Parada #1 de la nueva ruta como visitada para que jamás quede suelta
      const firstStopKey = getQuestStopKey(generated.stops[0].quest);
      if (!effectiveVisited.has(firstStopKey)) {
        effectiveVisited.add(firstStopKey);
        visitedAdded = true;
      }
      if (visitedAdded) {
        setVisitedStops(effectiveVisited);
        try {
          localStorage.setItem(
            NYC_STORAGE_KEYS.VISITED_STOPS,
            JSON.stringify(Array.from(effectiveVisited))
          );
        } catch (e) {
          console.error(e);
        }
      }

      setActiveRoute(generated);
      setRouteCurrentIdx(0);
      setSelectedQuest(generated.stops[0].quest);
      setLastCopiedQuest(generated.stops[0].quest);
      setIsPickingOriginOnMap(false);
      setIsRoutePlannerOpen(false);
      if (overrides?.openHud) {
        setIsMiniHudMode(true);
      }

      setCopiedCoords(
        `Ruta óptima de ${generated.stops.length} paradas (${generated.totalDistanceKm.toFixed(2)} km)`
      );
      setTimeout(() => setCopiedCoords(null), 3200);

      // Ajustar vista del mapa a la ruta completa si el mapa está montado
      if (mapInstanceRef.current && generated.stops.length > 0) {
        const bounds = L.latLngBounds(
          generated.stops.map(s => [s.quest.lat, s.quest.lng] as [number, number])
        );
        skipNextPanRef.current = true;
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [45, 45],
          maxZoom: 16,
          animate: false,
        });
      }
    },
    [
      originMode,
      filteredQuests,
      excludeVisitedOnRoute,
      visitedStops,
      activeRoute,
      routeCurrentIdx,
      selectedQuest,
      lastCopiedQuest,
      mapPickCoords,
      customCoordsInput,
      routeTargetCount,
    ]
  );

  // Navegación sobre la ruta activa
  const currentRouteStop = activeRoute?.stops[routeCurrentIdx] ?? null;
  const nextRouteStop =
    activeRoute && routeCurrentIdx < activeRoute.stops.length - 1
      ? activeRoute.stops[routeCurrentIdx + 1]
      : null;

  const handleCopyCurrentRouteStop = useCallback(async () => {
    if (!currentRouteStop) return;
    if (activeRoute) {
      markQuestsAsVisited(
        activeRoute.stops.slice(0, routeCurrentIdx + 1).map(s => s.quest)
      );
    }
    await handleCopyCoords(
      currentRouteStop.quest,
      undefined,
      `Parada #${currentRouteStop.stepNumber}`
    );
  }, [currentRouteStop, activeRoute, routeCurrentIdx, markQuestsAsVisited, handleCopyCoords]);

  const handleNextRouteStopAndCopy = useCallback(async () => {
    if (!activeRoute || activeRoute.stops.length === 0) return;
    if (routeCurrentIdx < activeRoute.stops.length - 1) {
      const nextIdx = routeCurrentIdx + 1;
      const stop = activeRoute.stops[nextIdx];
      markQuestsAsVisited(activeRoute.stops.slice(0, nextIdx + 1).map(s => s.quest));
      setRouteCurrentIdx(nextIdx);
      setSelectedQuest(stop.quest);
      await handleCopyCoords(stop.quest, undefined, `Parada #${stop.stepNumber}`);
    } else if (currentRouteStop) {
      markQuestsAsVisited(activeRoute.stops.map(s => s.quest));
      await handleCopyCoords(
        currentRouteStop.quest,
        undefined,
        `Última parada (#${currentRouteStop.stepNumber})`
      );
    }
  }, [activeRoute, routeCurrentIdx, currentRouteStop, markQuestsAsVisited, handleCopyCoords]);

  const handlePrevRouteStopAndCopy = useCallback(async () => {
    if (!activeRoute || activeRoute.stops.length === 0) return;
    if (routeCurrentIdx > 0) {
      const prevIdx = routeCurrentIdx - 1;
      const stop = activeRoute.stops[prevIdx];
      setRouteCurrentIdx(prevIdx);
      setSelectedQuest(stop.quest);
      await handleCopyCoords(stop.quest, undefined, `Parada #${stop.stepNumber}`);
    }
  }, [activeRoute, routeCurrentIdx, handleCopyCoords]);

  const handleJumpToRouteStop = useCallback(
    async (idx: number, copyNow = false) => {
      if (!activeRoute || activeRoute.stops.length === 0) return;
      const clamped = Math.min(Math.max(0, idx), activeRoute.stops.length - 1);
      const stop = activeRoute.stops[clamped];
      setRouteCurrentIdx(clamped);
      setSelectedQuest(stop.quest);
      if (copyNow) {
        await handleCopyCoords(stop.quest, undefined, `Parada #${stop.stepNumber}`);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo([stop.quest.lat, stop.quest.lng], { animate: false });
      }
    },
    [activeRoute, handleCopyCoords]
  );

  const handleMarkEntireRouteVisited = useCallback(() => {
    if (!activeRoute || activeRoute.stops.length === 0) return;
    markQuestsAsVisited(activeRoute.stops.map(s => s.quest));
    setCopiedCoords(`✓ ${activeRoute.stops.length} paradas de la ruta marcadas como visitadas`);
    setTimeout(() => setCopiedCoords(null), 3000);
  }, [activeRoute, markQuestsAsVisited]);

  const handleClearRoute = () => {
    setActiveRoute(null);
    setRouteCurrentIdx(0);
    setShowOnlyRouteStops(false);
    setIsMiniHudMode(false);
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.close();
    }
  };

  const handleDownloadRouteGPX = () => {
    if (!activeRoute || activeRoute.stops.length === 0) return;
    markQuestsAsVisited(activeRoute.stops.map(s => s.quest));
    const gpx = generateNycRouteGPX(activeRoute.stops);
    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ruta-nyc-${activeRoute.stops.length}-paradas.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyRouteList = async () => {
    if (!activeRoute || activeRoute.stops.length === 0) return;
    markQuestsAsVisited(activeRoute.stops.map(s => s.quest));
    const list = activeRoute.stops
      .map(s => formatCoordsForPgsharp(s.quest.lat, s.quest.lng))
      .join('\n');
    try {
      await navigator.clipboard.writeText(list);
      setCopiedCoords(`¡Copiadas y marcadas ${activeRoute.stops.length} paradas de la ruta!`);
      setTimeout(() => setCopiedCoords(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Refs para callbacks frescos en Document Picture-in-Picture
  const prevStopRef = useRef(handlePrevRouteStopAndCopy);
  const copyStopRef = useRef(handleCopyCurrentRouteStop);
  const nextStopRef = useRef(handleNextRouteStopAndCopy);

  useEffect(() => {
    prevStopRef.current = handlePrevRouteStopAndCopy;
    copyStopRef.current = handleCopyCurrentRouteStop;
    nextStopRef.current = handleNextRouteStopAndCopy;
  }, [handlePrevRouteStopAndCopy, handleCopyCurrentRouteStop, handleNextRouteStopAndCopy]);

  const updatePipWindowDom = useCallback(
    (pipWin: Window) => {
      if (!pipWin || pipWin.closed) return;
      const doc = pipWin.document;
      const stop = activeRoute?.stops[routeCurrentIdx] ?? null;
      const total = activeRoute?.stops.length ?? 0;

      const stepBadge = doc.getElementById('pip-step');
      const stopNameEl = doc.getElementById('pip-name');
      const coordsEl = doc.getElementById('pip-coords');
      const metaEl = doc.getElementById('pip-meta');
      const prevBtn = doc.getElementById('pip-prev') as HTMLButtonElement | null;
      const copyBtn = doc.getElementById('pip-copy') as HTMLButtonElement | null;
      const nextBtn = doc.getElementById('pip-next') as HTMLButtonElement | null;

      if (!stop) {
        if (stepBadge) stepBadge.textContent = 'Sin ruta';
        if (stopNameEl) stopNameEl.textContent = 'Genera una ruta en PokeSkills';
        if (coordsEl) coordsEl.textContent = '---';
        if (metaEl) metaEl.textContent = '';
        return;
      }

      const coordsStr = formatCoordsForPgsharp(stop.quest.lat, stop.quest.lng);
      const isVisited = visitedStops.has(stop.stopKey);
      const distText =
        stop.stepNumber === 1 ? 'Inicio' : formatDistanceMeters(stop.distanceFromPrevKm);

      if (stepBadge) stepBadge.textContent = `#${stop.stepNumber}/${total}`;
      if (stopNameEl) stopNameEl.textContent = stop.quest.name || 'Poképarada';
      if (coordsEl) coordsEl.textContent = `${coordsStr} • ${distText}`;
      if (metaEl) metaEl.textContent = stop.quest.rewards_string || '';

      if (prevBtn) prevBtn.disabled = routeCurrentIdx <= 0;
      if (copyBtn) {
        copyBtn.textContent = isVisited ? `✓ #${stop.stepNumber}` : `📋 #${stop.stepNumber}`;
        copyBtn.style.background = isVisited ? '#059669' : '#2563EB';
      }
      if (nextBtn) {
        const hasNext = routeCurrentIdx < total - 1;
        nextBtn.textContent = hasNext ? `⏭ #${stop.stepNumber + 1}` : '🏁 Fin';
        nextBtn.disabled = !hasNext;
      }
    },
    [activeRoute, routeCurrentIdx, visitedStops]
  );

  useEffect(() => {
    if (isPipOpen && pipWindowRef.current && !pipWindowRef.current.closed) {
      updatePipWindowDom(pipWindowRef.current);
    }
  }, [isPipOpen, updatePipWindowDom, copiedCoords]);

  const handleOpenDocumentPip = async () => {
    const pipApi = (window as any).documentPictureInPicture;
    if (!pipApi || typeof pipApi.requestWindow !== 'function') {
      setShowAndroidTip(true);
      setCopiedCoords('Tu navegador móvil no soporta PiP web: usa Vista Emergente / Pantalla Dividida');
      setTimeout(() => setCopiedCoords(null), 3500);
      return;
    }

    try {
      if (pipWindowRef.current && !pipWindowRef.current.closed) {
        pipWindowRef.current.close();
        pipWindowRef.current = null;
        setIsPipOpen(false);
        return;
      }

      const pipWin: Window = await pipApi.requestWindow({ width: 390, height: 118 });
      pipWindowRef.current = pipWin;
      setIsPipOpen(true);

      pipWin.document.head.innerHTML = `
        <title>PokeSkills HUD</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
          body { background: #0B1B3C; color: #fff; padding: 8px 10px; display: flex; flex-direction: column; justify-content: space-between; height: 100vh; overflow: hidden; }
          .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
          .info { min-width: 0; flex: 1; }
          .top { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
          .badge { background: #C22615; color: #FFE550; font-size: 11px; font-weight: 900; padding: 2px 7px; border-radius: 999px; }
          .meta { font-size: 10px; color: #93C5FD; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 700; }
          .name { font-size: 13px; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff; }
          .coords { font-size: 11px; font-family: monospace; color: #CBD5E1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .btns { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
          button { border: none; color: #fff; font-weight: 900; font-size: 12px; border-radius: 10px; cursor: pointer; height: 48px; padding: 0 11px; }
          button:disabled { opacity: 0.4; cursor: not-allowed; }
          #pip-prev { background: #334155; padding: 0 10px; }
          #pip-copy { background: #2563EB; }
          #pip-next { background: #10B981; padding: 0 13px; }
        </style>
      `;

      pipWin.document.body.innerHTML = `
        <div class="row">
          <div class="info">
            <div class="top">
              <span id="pip-step" class="badge">#1</span>
              <span id="pip-meta" class="meta"></span>
            </div>
            <div id="pip-name" class="name">Cargando...</div>
            <div id="pip-coords" class="coords">---</div>
          </div>
          <div class="btns">
            <button id="pip-prev" title="Parada anterior">⏮</button>
            <button id="pip-copy" title="Copiar parada actual">📋</button>
            <button id="pip-next" title="Siguiente parada y copiar">⏭</button>
          </div>
        </div>
      `;

      pipWin.document.getElementById('pip-prev')?.addEventListener('click', () => prevStopRef.current());
      pipWin.document.getElementById('pip-copy')?.addEventListener('click', () => copyStopRef.current());
      pipWin.document.getElementById('pip-next')?.addEventListener('click', () => nextStopRef.current());

      pipWin.addEventListener('pagehide', () => {
        pipWindowRef.current = null;
        setIsPipOpen(false);
      });

      updatePipWindowDom(pipWin);
    } catch (err) {
      console.error('Error abriendo Document PiP:', err);
      setShowAndroidTip(true);
    }
  };

  // Determinar si el mapa de Leaflet debe estar montado en el DOM (se desmonta en Mini HUD ligero para ahorrar RAM)
  const shouldMountMap = (!isMiniHudMode && viewMode === 'map') || (isMiniHudMode && !pauseMapInHud);

  // Inicializar y desmontar mapa Leaflet limpiamente según shouldMountMap
  useEffect(() => {
    if (!shouldMountMap || !mapContainerRef.current) return;

    const savedView = readStorage<SavedMapView | null>(NYC_STORAGE_KEYS.MAP_VIEW, null);
    const initCenter: [number, number] = savedView
      ? [savedView.lat, savedView.lng]
      : [40.7580, -73.9855];
    const initZoom = savedView ? savedView.zoom : 13;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
    }).setView(initCenter, initZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      minZoom: 10,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    const routeLayerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    routeLayerGroupRef.current = routeLayerGroup;
    mapInstanceRef.current = map;

    map.on('moveend', () => {
      const c = map.getCenter();
      writeStorage(NYC_STORAGE_KEYS.MAP_VIEW, {
        lat: Number(c.lat.toFixed(6)),
        lng: Number(c.lng.toFixed(6)),
        zoom: map.getZoom(),
      });
    });

    map.on('click', (ev: L.LeafletMouseEvent) => {
      if (isPickingOriginRef.current) {
        const picked = {
          lat: Number(ev.latlng.lat.toFixed(6)),
          lng: Number(ev.latlng.lng.toFixed(6)),
        };
        setMapPickCoords(picked);
        setOriginMode('map_point');
        setIsPickingOriginOnMap(false);
        setIsRoutePlannerOpen(true);
      }
    });

    return () => {
      try {
        map.stop();
      } catch {
        // Ignorar si ya está desmontado
      }
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
      routeLayerGroupRef.current = null;
    };
  }, [shouldMountMap]);

  // Ref para iniciar ruta desde popup Leaflet sin recrear marcadores
  const startRouteFromQuestRef = useRef<(q: NycQuest) => void>(() => {});
  useEffect(() => {
    startRouteFromQuestRef.current = (q: NycQuest) => {
      setOriginMode('last_stop');
      handleGenerateRoute({
        mode: 'last_stop',
        originQuest: q,
        originLabel: `Desde ${q.name || 'parada'}`,
      });
    };
  }, [handleGenerateRoute]);

  // Actualizar marcadores y polilíneas de ruta en el mapa
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    const routeLayerGroup = routeLayerGroupRef.current;
    if (!shouldMountMap || !map || !layerGroup || !routeLayerGroup) return;

    layerGroup.clearLayers();
    routeLayerGroup.clearLayers();

    const routeStopKeys = new Set<string>(
      activeRoute ? activeRoute.stops.map(s => s.stopKey) : []
    );

    // 1. Marcadores normales (si no está activado "Ver solo ruta")
    if (!showOnlyRouteStops || !activeRoute) {
      const stopsToRender = filteredQuests.slice(0, 1500);

      stopsToRender.forEach(quest => {
        const stopKey = getQuestStopKey(quest);
        if (routeStopKeys.has(stopKey)) return; // Se dibuja en la capa superior de ruta

        const formattedCoords = formatCoordsForPgsharp(quest.lat, quest.lng);
        const isVisited = checkQuestVisited(quest);
        const isSelected =
          selectedQuest?.lat === quest.lat && selectedQuest?.lng === quest.lng;

        const icon = createPokestopDivIcon(quest, isVisited, isSelected);
        const marker = L.marker([quest.lat, quest.lng], {
          icon,
          title: quest.name,
        });

        marker.on('click', () => {
          if (isPickingOriginRef.current) {
            setMapPickCoords({ lat: quest.lat, lng: quest.lng });
            setOriginMode('map_point');
            setIsPickingOriginOnMap(false);
            setIsRoutePlannerOpen(true);
            return;
          }
          setSelectedQuest(quest);
          map.panTo([quest.lat, quest.lng], { animate: false });
        });

        const popupHtml = `
          <div style="font-family: sans-serif; min-width: 210px; padding: 2px;">
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
              📍 ${escapeHtml(quest.name || 'Poképarada')}
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px; margin-bottom: 6px;">
              <div style="font-size: 10px; font-weight: 800; color: #b45309; text-transform: uppercase;">🎯 Desafío</div>
              <div style="font-size: 11px; font-weight: 700; color: #334155;">${escapeHtml(quest.conditions_string || 'Desafío')}</div>
            </div>
            <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 6px; margin-bottom: 8px;">
              <div style="font-size: 10px; font-weight: 800; color: #6d28d9; text-transform: uppercase;">🎁 Recompensa</div>
              <div style="font-size: 11px; font-weight: 800; color: #4c1d95;">${escapeHtml(quest.rewards_string || 'Recompensa')}</div>
            </div>
            <div style="font-family: monospace; font-size: 11px; font-weight: bold; color: #475569; background: #e2e8f0; padding: 4px 6px; border-radius: 6px; text-align: center; margin-bottom: 8px;">
              ${formattedCoords}
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <button data-action="copy" style="
                width: 100%;
                background: #C22615;
                color: white;
                font-size: 11px;
                font-weight: 900;
                padding: 7px 10px;
                border-radius: 8px;
                border: none;
                cursor: pointer;
              ">
                📋 Copiar para PGSharp
              </button>
              <button data-action="route" style="
                width: 100%;
                background: #1160C0;
                color: white;
                font-size: 11px;
                font-weight: 900;
                padding: 7px 10px;
                border-radius: 8px;
                border: none;
                cursor: pointer;
              ">
                🚀 Iniciar Ruta desde aquí
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml, { closeButton: false, offset: [0, -10] });

        marker.on('popupopen', ev => {
          const el = ev.popup.getElement();
          if (!el) return;
          const copyBtn = el.querySelector<HTMLButtonElement>('[data-action="copy"]');
          if (copyBtn) copyBtn.onclick = () => handleCopyCoords(quest);
          const routeBtn = el.querySelector<HTMLButtonElement>('[data-action="route"]');
          if (routeBtn) {
            routeBtn.onclick = () => {
              marker.closePopup();
              startRouteFromQuestRef.current(quest);
            };
          }
        });

        marker.addTo(layerGroup);
      });
    }

    // 2. Pin de origen manual en mapa si aplica
    if (originMode === 'map_point' && mapPickCoords) {
      const pin = L.marker([mapPickCoords.lat, mapPickCoords.lng], {
        icon: createOriginPinDivIcon(),
        zIndexOffset: 500,
      }).bindTooltip('Inicio elegido para ruta');
      pin.addTo(routeLayerGroup);
    }

    // 3. Polilíneas y marcadores numerados 1..N de la ruta óptima activa
    if (activeRoute && activeRoute.stops.length > 0) {
      const doneCoords: [number, number][] = [];
      const pendingCoords: [number, number][] = [];

      activeRoute.stops.forEach((stop, idx) => {
        const pt: [number, number] = [stop.quest.lat, stop.quest.lng];
        if (idx <= routeCurrentIdx) doneCoords.push(pt);
        if (idx >= routeCurrentIdx) pendingCoords.push(pt);
      });

      if (doneCoords.length > 1) {
        L.polyline(doneCoords, {
          color: '#10b981',
          weight: 5,
          opacity: 0.9,
        }).addTo(routeLayerGroup);
      }

      if (pendingCoords.length > 1) {
        L.polyline(pendingCoords, {
          color: '#2563eb',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 6',
        }).addTo(routeLayerGroup);
      }

      activeRoute.stops.forEach((stop, idx) => {
        const isCurrent = idx === routeCurrentIdx;
        const isDoneOrVisited = checkQuestVisited(stop.quest);
        const icon = createRouteStopDivIcon(stop.stepNumber, isCurrent, isDoneOrVisited);

        const marker = L.marker([stop.quest.lat, stop.quest.lng], {
          icon,
          zIndexOffset: isCurrent ? 1000 : 600,
          title: `#${stop.stepNumber}. ${stop.quest.name}`,
        });

        marker.on('click', () => {
          setRouteCurrentIdx(idx);
          setSelectedQuest(stop.quest);
          map.panTo([stop.quest.lat, stop.quest.lng], { animate: false });
        });

        const formattedCoords = formatCoordsForPgsharp(stop.quest.lat, stop.quest.lng);
        const popupHtml = `
          <div style="font-family: sans-serif; min-width: 210px; padding: 2px;">
            <div style="font-size: 11px; font-weight: 900; color: #C22615; margin-bottom: 2px;">
              RUTA ÓPTIMA • PARADA #${stop.stepNumber} DE ${activeRoute.stops.length}
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
              ${escapeHtml(stop.quest.name || 'Poképarada')}
            </div>
            <div style="font-size: 11px; font-weight: 700; color: #334155; margin-bottom: 4px;">
              🎯 ${escapeHtml(stop.quest.conditions_string || 'Desafío')}
            </div>
            <div style="font-size: 11px; font-weight: 800; color: #4c1d95; margin-bottom: 6px;">
              🎁 ${escapeHtml(stop.quest.rewards_string || 'Recompensa')}
            </div>
            <div style="font-family: monospace; font-size: 11px; font-weight: bold; color: #475569; background: #e2e8f0; padding: 4px 6px; border-radius: 6px; text-align: center; margin-bottom: 8px;">
              ${formattedCoords}
            </div>
            <button data-action="copy-step" style="
              width: 100%;
              background: #10B981;
              color: white;
              font-size: 11px;
              font-weight: 900;
              padding: 7px 10px;
              border-radius: 8px;
              border: none;
              cursor: pointer;
            ">
              📋 Copiar Parada #${stop.stepNumber}
            </button>
          </div>
        `;

        marker.bindPopup(popupHtml, { closeButton: false, offset: [0, -12] });
        marker.on('popupopen', ev => {
          const el = ev.popup.getElement();
          if (!el) return;
          const btn = el.querySelector<HTMLButtonElement>('[data-action="copy-step"]');
          if (btn) {
            btn.onclick = () => {
              setRouteCurrentIdx(idx);
              handleCopyCoords(stop.quest, undefined, `Parada #${stop.stepNumber}`);
            };
          }
        });

        marker.addTo(routeLayerGroup);
      });
    }

    if (skipNextPanRef.current) {
      skipNextPanRef.current = false;
    } else if (selectedQuest) {
      map.panTo([selectedQuest.lat, selectedQuest.lng], { animate: false });
    }
  }, [
    shouldMountMap,
    filteredQuests,
    selectedQuest,
    visitedStops,
    activeRoute,
    routeCurrentIdx,
    showOnlyRouteStops,
    originMode,
    mapPickCoords,
    handleCopyCoords,
  ]);

  // Redimensionar mapa cuando cambia tamaño o sale de vista lista
  useEffect(() => {
    if (!shouldMountMap || !mapInstanceRef.current) return;
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [shouldMountMap, isMiniHudMode, pauseMapInHud]);

  // Copiar todas las coordenadas visibles
  const handleCopyAllVisible = async () => {
    if (filteredQuests.length === 0) return;
    const list = filteredQuests
      .slice(0, 100)
      .map(q => formatCoordsForPgsharp(q.lat, q.lng))
      .join('\n');
    try {
      await navigator.clipboard.writeText(list);
      setCopiedCoords(`¡Copiadas ${Math.min(filteredQuests.length, 100)} coordenadas!`);
      setTimeout(() => setCopiedCoords(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const isSelectedStopInRoute =
    Boolean(selectedQuest && activeRoute) &&
    activeRoute!.stops.some(s => s.stopKey === getQuestStopKey(selectedQuest!));

  // =========================================================================
  // MODO MINI BARRA HORIZONTAL (HUD COMPACTO PARA PANTALLA DIVIDIDA / FLOTANTE)
  // =========================================================================
  if (isMiniHudMode) {
    const totalStops = activeRoute?.stops.length ?? 0;
    const hudStop = currentRouteStop;
    const hudQuest = hudStop?.quest || selectedQuest || lastCopiedQuest;
    const hudCoords = hudQuest ? formatCoordsForPgsharp(hudQuest.lat, hudQuest.lng) : '---';
    const hudVisited = hudQuest ? visitedStops.has(getQuestStopKey(hudQuest)) : false;
    const nextDistText = nextRouteStop
      ? `Próx: ${formatDistanceMeters(nextRouteStop.distanceFromPrevKm)}`
      : activeRoute
      ? 'Última parada'
      : '';

    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-y-auto select-none">
        {/* Toast ultra compacto en HUD */}
        {copiedCoords && (
          <div className="bg-emerald-600 text-white px-3 py-1 text-[11px] font-black flex items-center justify-center gap-1.5 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#FFE550] shrink-0" />
            <span className="truncate">Copiado: {copiedCoords}</span>
          </div>
        )}

        {/* FILA PRINCIPAL HORIZONTAL (Diseñada para caber en ~75-95px de pantalla dividida o ventana flotante) */}
        <div className="bg-slate-900 border-b border-slate-800 px-2.5 py-2 flex items-center justify-between gap-2 shrink-0">
          {/* Izquierda: Parada actual + distancia + coords */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              {activeRoute ? (
                <span className="bg-[#C22615] text-[#FFE550] text-[11px] font-black px-2 py-0.5 rounded-full shrink-0">
                  #{hudStop?.stepNumber}/{totalStops}
                </span>
              ) : (
                <span className="bg-slate-700 text-slate-200 text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                  Libre
                </span>
              )}

              {hudStop && (
                <span className="text-[10px] font-bold text-cyan-300 truncate">
                  {hudStop.stepNumber === 1
                    ? 'Inicio'
                    : `${formatDistanceMeters(hudStop.distanceFromPrevKm)} • ${formatCooldownShort(hudStop.cooldownMinutes)}`}
                </span>
              )}

              {nextDistText && (
                <span className="hidden sm:inline text-[10px] font-bold text-slate-400">
                  • {nextDistText}
                </span>
              )}
            </div>

            <div className="text-xs sm:text-sm font-black text-white truncate">
              {hudQuest?.name || 'Sin parada seleccionada'}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-300 truncate">
              <span className="font-mono font-bold text-amber-300">{hudCoords}</span>
              {hudQuest?.rewards_string && (
                <span className="text-purple-300 font-bold truncate">
                  • {hudQuest.rewards_string}
                </span>
              )}
            </div>
          </div>

          {/* Derecha: 3 Botones grandes de pulgar en 1 toque */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handlePrevRouteStopAndCopy}
              disabled={!activeRoute || routeCurrentIdx <= 0}
              className="h-12 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-35 text-white font-black text-xs flex items-center justify-center border border-slate-700 cursor-pointer"
              title="Parada anterior y copiar"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (activeRoute && currentRouteStop) {
                  handleCopyCurrentRouteStop();
                } else if (hudQuest) {
                  handleCopyCoords(hudQuest);
                }
              }}
              disabled={!hudQuest}
              className={`h-12 px-3 rounded-xl active:scale-95 disabled:opacity-40 font-black text-xs flex items-center gap-1 shadow-md cursor-pointer border ${
                hudVisited
                  ? 'bg-emerald-700 hover:bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-[#1160C0] hover:bg-blue-600 border-blue-400 text-white'
              }`}
              title="Copiar coordenadas de la parada actual"
            >
              <Copy className="w-3.5 h-3.5 text-[#FFE550]" />
              <span>{hudStop ? `#${hudStop.stepNumber}` : 'Copiar'}</span>
            </button>

            <button
              onClick={handleNextRouteStopAndCopy}
              disabled={!activeRoute || routeCurrentIdx >= totalStops - 1}
              className="h-12 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-40 text-white font-black text-xs flex items-center gap-1 shadow-md border border-emerald-400 cursor-pointer"
              title="Avanzar a la siguiente parada y copiar coordenadas automáticamente"
            >
              <span>{nextRouteStop ? `#${nextRouteStop.stepNumber}` : 'Fin'}</span>
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* BARRA SECUNDARIA COMPACTA */}
        <div className="bg-slate-900/70 border-b border-slate-800 px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-1.5 text-[11px] shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {activeRoute && (
              <select
                value={routeCurrentIdx}
                onChange={e => handleJumpToRouteStop(Number(e.target.value), true)}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-1 text-[11px] font-bold max-w-[175px] truncate cursor-pointer"
                title="Saltar a cualquier parada de la ruta"
              >
                {activeRoute.stops.map((s, idx) => (
                  <option key={s.stopKey} value={idx}>
                    #{s.stepNumber} {visitedStops.has(s.stopKey) ? '✓' : '•'} {s.quest.name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleOpenDocumentPip}
              className={`px-2 py-1 rounded-lg font-bold border flex items-center gap-1 cursor-pointer ${
                isPipOpen
                  ? 'bg-purple-600 border-purple-400 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              title="Abrir miniventana flotante Picture-in-Picture"
            >
              <PictureInPicture2 className="w-3.5 h-3.5" />
              <span>{isPipOpen ? 'PiP Activo' : 'Flotar (PiP)'}</span>
            </button>

            <button
              onClick={() => setPauseMapInHud(prev => !prev)}
              className={`px-2 py-1 rounded-lg font-bold border flex items-center gap-1 cursor-pointer ${
                pauseMapInHud
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-emerald-300'
                  : 'bg-blue-700 border-blue-500 text-white'
              }`}
              title="Pausar mapa ahorra RAM para evitar que Android reinicie PoGo o Chrome"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>{pauseMapInHud ? 'Mapa pausado (Ahorro RAM)' : 'Ocultar mapa'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowAndroidTip(prev => !prev)}
              className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-bold flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Tip Android</span>
            </button>

            <button
              onClick={() => setIsMiniHudMode(false)}
              className="px-2.5 py-1 rounded-lg bg-white text-slate-900 hover:bg-slate-100 font-black flex items-center gap-1 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Mapa Completo</span>
            </button>
          </div>
        </div>

        {/* GUÍA RÁPIDA ANDROID ANTI-REINICIOS */}
        {showAndroidTip && (
          <div className="bg-amber-950/80 border-b border-amber-600/50 px-3 py-2.5 text-xs text-amber-100 space-y-1 shrink-0">
            <div className="flex items-center justify-between">
              <strong className="text-[#FFE550]">📱 Cómo mantener PokeSkills encima de PoGo sin reinicios:</strong>
              <button
                onClick={() => setShowAndroidTip(false)}
                className="text-amber-200 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p>
              <strong>1. Ventana Flotante (Vista emergente):</strong> Abre recientes en Android, toca el ícono de Chrome/PokeSkills arriba y elige <em>"Abrir en vista emergente"</em> o <em>"Ventana flotante"</em>. Colócala arriba de PoGo tocando <strong>⏭ Sig.</strong> con 1 dedo sin salir del juego.
            </p>
            <p>
              <strong>2. Pantalla Dividida 15% / 85%:</strong> En recientes elige <em>"Pantalla dividida"</em>, pon PokeSkills arriba ajustada lo más delgada posible y Pokémon GO abajo. Como el mapa está pausado aquí, Chrome usa mínima RAM y Android no cerrará ninguna app.
            </p>
          </div>
        )}

        {/* CONTENIDO EXTENDIDO (Visible si el usuario dejó la ventana alta; si la encoge a barra horizontal queda oculto debajo sin estorbar) */}
        <div className="flex-1 p-3 space-y-3">
          {!pauseMapInHud && (
            <div className="rounded-2xl overflow-hidden border border-slate-700 h-56 relative">
              <div ref={mapContainerRef} className="w-full h-full" />
            </div>
          )}

          {hudQuest && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-300 font-bold">
                  🎯 {hudQuest.conditions_string || 'Desafío estándar'}
                </span>
                <span className="text-slate-400 font-semibold">
                  {activeRoute
                    ? `Total ruta: ${activeRoute.totalDistanceKm.toFixed(2)} km • Prom: ${activeRoute.avgDistanceMeters} m`
                    : ''}
                </span>
              </div>
              <div className="text-xs font-black text-purple-300">
                🎁 {hudQuest.rewards_string || 'Recompensa'}
              </div>
            </div>
          )}

          {/* Vista previa de las próximas 4 paradas */}
          {activeRoute && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Siguientes en tu ruta ({activeRoute.stops.length - routeCurrentIdx - 1} restantes)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {activeRoute.stops
                  .slice(routeCurrentIdx + 1, routeCurrentIdx + 5)
                  .map((stop, offset) => {
                    const targetIdx = routeCurrentIdx + 1 + offset;
                    return (
                      <button
                        key={stop.stopKey}
                        onClick={() => handleJumpToRouteStop(targetIdx, true)}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl p-2 text-left flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-black text-white truncate">
                            #{stop.stepNumber}. {stop.quest.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {formatDistanceMeters(stop.distanceFromPrevKm)} • {stop.quest.rewards_string}
                          </div>
                        </div>
                        <span className="text-[10px] font-black bg-slate-800 text-emerald-300 px-2 py-1 rounded-lg shrink-0">
                          Ir + Copiar
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODO NORMAL COMPLETO (MAPA / LISTA + GENERADOR DE RUTAS ÓPTIMAS)
  // =========================================================================
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EBF3F8] via-[#F4F8FA] to-[#E5EFF5] text-slate-800 flex flex-col font-sans pb-10">
      {/* Header Oficial Pokémon GO Red */}
      <header className="bg-gradient-to-r from-[#C22615] via-[#D62B18] to-[#C22615] border-b-4 border-red-800 text-white shadow-md sticky top-0 z-30 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHub}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all border border-white/20 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Volver al menú principal"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Hub</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black text-[#FFE550] tracking-tight font-pogo drop-shadow-sm">
                  Mapa de Desafíos NYC (nycpokemap)
                </h1>
                <span className="bg-[#FFE550] text-[#0B1B3C] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  PGSharp Ready
                </span>
              </div>
              <p className="text-xs text-red-100 font-medium">
                {lastUpdated
                  ? `Caché guardada (${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) • Estado protegido contra reinicios`
                  : 'Toca cualquier Poképarada en el mapa o genera una ruta óptima'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Botón directo al Generador de Rutas Óptimas */}
            <button
              onClick={() => setIsRoutePlannerOpen(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border shadow-sm ${
                isRoutePlannerOpen
                  ? 'bg-[#FFE550] text-[#0B1B3C] border-yellow-300'
                  : 'bg-[#0B1B3C] hover:bg-slate-900 text-[#FFE550] border-slate-700'
              }`}
            >
              <Route className="w-3.5 h-3.5" />
              <span>Ruta Óptima</span>
            </button>

            {/* Botón rápido Modo Mini Barra Horizontal (HUD) */}
            {activeRoute && activeRoute.stops.length > 0 && (
              <button
                onClick={() => setIsMiniHudMode(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md border border-emerald-400 flex items-center gap-1.5 cursor-pointer"
                title="Abrir menú horizontal compacto ideal para pantalla dividida o ventana flotante encima de PoGo"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Mini Barra HUD</span>
              </button>
            )}

            {/* Toggle Vista Mapa / Lista */}
            <div className="flex items-center bg-red-950/40 p-1 rounded-xl border border-red-700/50">
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-white text-[#C22615] shadow-xs'
                    : 'text-red-100 hover:text-white'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Mapa</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-[#C22615] shadow-xs'
                    : 'text-red-100 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Lista</span>
              </button>
            </div>

            <button
              onClick={() => loadData()}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-[#C22615] text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{loading ? 'Cargando...' : 'Recargar'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast Alert Flotante para Confirmación de Copia */}
      {copiedCoords && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="bg-emerald-600 border-2 border-emerald-400 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-[#FFE550] shrink-0" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-emerald-100">
                ¡Listo en Portapapeles!
              </p>
              <p className="text-sm font-mono font-black text-white">{copiedCoords}</p>
              <p className="text-[11px] text-emerald-100 font-medium">
                Pega directo en PGSharp (lat,long sin espacio)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 flex flex-col gap-4">
        {/* Barra de Última Parada Copiada (Recuperación instantánea ante reinicios) */}
        {lastCopiedQuest && (
          <div className="bg-[#0B1B3C] text-white rounded-2xl px-4 py-2.5 shadow-sm border border-slate-700 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">
                Última copiada
              </span>
              <span className="text-xs font-black truncate">{lastCopiedQuest.name}</span>
              <span className="text-[11px] font-mono text-amber-300 hidden sm:inline">
                {formatCoordsForPgsharp(lastCopiedQuest.lat, lastCopiedQuest.lng)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleCopyCoords(lastCopiedQuest)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold border border-slate-600 flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3 text-[#FFE550]" />
                <span>Re-copiar</span>
              </button>
              <button
                onClick={() => {
                  setSelectedQuest(lastCopiedQuest);
                  setViewMode('map');
                  mapInstanceRef.current?.setView([lastCopiedQuest.lat, lastCopiedQuest.lng], 16);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold border border-slate-600 flex items-center gap-1 cursor-pointer"
              >
                <MapPin className="w-3 h-3 text-cyan-300" />
                <span>Enfocar</span>
              </button>
              <button
                onClick={() =>
                  handleGenerateRoute({
                    mode: 'last_stop',
                    originQuest: lastCopiedQuest,
                    originLabel: `Desde ${lastCopiedQuest.name}`,
                  })
                }
                className="px-2.5 py-1 rounded-lg bg-[#C22615] hover:bg-red-600 text-white text-xs font-black flex items-center gap-1 cursor-pointer"
              >
                <Route className="w-3 h-3 text-[#FFE550]" />
                <span>Ruta desde aquí</span>
              </button>
            </div>
          </div>
        )}

        {/* PANEL DESPLEGABLE: GENERADOR DE RUTAS ÓPTIMAS */}
        {isRoutePlannerOpen && (
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-md border-2 border-[#1160C0] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-black text-[#0B1B3C] flex items-center gap-2">
                  <Route className="w-5 h-5 text-[#1160C0]" />
                  <span>Generador de Ruta Óptima (Encadenado Más Corto)</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Analiza las {filteredQuests.length.toLocaleString()} paradas filtradas ({unvisitedFilteredCount.toLocaleString()} sin visitar) y encadena la ruta con menor distancia.
                </p>
              </div>
              <button
                onClick={() => setIsRoutePlannerOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Columna 1: Punto de inicio */}
              <div className="space-y-2.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-600 block">
                  1. ¿Desde dónde quieres iniciar la ruta?
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOriginMode('auto_cluster')}
                    className={`p-2.5 rounded-2xl text-xs font-black border-2 text-left transition-all cursor-pointer ${
                      originMode === 'auto_cluster'
                        ? 'bg-blue-50 border-[#1160C0] text-[#0B1B3C]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>🔥 Clúster Más Denso</div>
                    <div className="text-[10px] font-semibold text-slate-500">
                      Auto-detecta la mejor zona
                    </div>
                  </button>

                  <button
                    onClick={() => setOriginMode('last_stop')}
                    className={`p-2.5 rounded-2xl text-xs font-black border-2 text-left transition-all cursor-pointer ${
                      originMode === 'last_stop'
                        ? 'bg-blue-50 border-[#1160C0] text-[#0B1B3C]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>📍 Última / Seleccionada</div>
                    <div className="text-[10px] font-semibold text-slate-500 truncate">
                      {(selectedQuest || lastCopiedQuest)?.name || 'Ninguna aún'}
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setOriginMode('map_point');
                      setViewMode('map');
                      setIsPickingOriginOnMap(true);
                    }}
                    className={`p-2.5 rounded-2xl text-xs font-black border-2 text-left transition-all cursor-pointer ${
                      originMode === 'map_point'
                        ? 'bg-blue-50 border-[#1160C0] text-[#0B1B3C]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>👆 Elegir en el Mapa</div>
                    <div className="text-[10px] font-semibold text-slate-500">
                      {mapPickCoords
                        ? `${mapPickCoords.lat.toFixed(4)},${mapPickCoords.lng.toFixed(4)}`
                        : 'Toca un punto del mapa'}
                    </div>
                  </button>

                  <button
                    onClick={() => setOriginMode('custom_coords')}
                    className={`p-2.5 rounded-2xl text-xs font-black border-2 text-left transition-all cursor-pointer ${
                      originMode === 'custom_coords'
                        ? 'bg-blue-50 border-[#1160C0] text-[#0B1B3C]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>⌨️ Coordenadas / Zona</div>
                    <div className="text-[10px] font-semibold text-slate-500">
                      Pega coords o elige zona NYC
                    </div>
                  </button>
                </div>

                {originMode === 'custom_coords' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                    <input
                      type="text"
                      value={customCoordsInput}
                      onChange={e => setCustomCoordsInput(e.target.value)}
                      placeholder="40.7536,-73.9832"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {NYC_QUICK_ZONES.map(z => (
                        <button
                          key={z.id}
                          onClick={() => setCustomCoordsInput(`${z.lat},${z.lng}`)}
                          className="px-2 py-1 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 text-[11px] font-bold text-slate-700 cursor-pointer"
                        >
                          {z.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Columna 2: Cantidad de Poképaradas y ejecución */}
              <div className="space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600 block">
                    2. ¿Cuántas Poképaradas quieres encadenar?
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {ROUTE_COUNT_PRESETS.map(count => (
                      <button
                        key={count}
                        onClick={() => setRouteTargetCount(count)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                          routeTargetCount === count
                            ? 'bg-[#C22615] text-white border-red-700 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                    <button
                      onClick={() => setRouteTargetCount(0)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                        routeTargetCount === 0
                          ? 'bg-[#C22615] text-white border-red-700 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      Todas
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={routeTargetCount === 0 ? '' : routeTargetCount}
                      placeholder="Otra"
                      onChange={e => {
                        const val = parseInt(e.target.value, 10);
                        setRouteTargetCount(Number.isFinite(val) && val > 0 ? val : 0);
                      }}
                      className="w-20 px-2.5 py-1.5 rounded-xl border-2 border-slate-200 text-xs font-black text-slate-800 bg-slate-50"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={excludeVisitedOnRoute}
                      onChange={e => setExcludeVisitedOnRoute(e.target.checked)}
                      className="rounded border-slate-300 text-[#C22615]"
                    />
                    <span>Omitir paradas ya visitadas ({visitedStops.size} en historial)</span>
                  </label>

                  {activeRoute && activeRoute.stops.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-emerald-900">
                        Ruta actual: {activeRoute.stops.filter(s => checkQuestVisited(s.quest)).length}/
                        {activeRoute.stops.length} paradas marcadas visitadas
                      </span>
                      {activeRoute.stops.some(s => !checkQuestVisited(s.quest)) && (
                        <button
                          type="button"
                          onClick={handleMarkEntireRouteVisited}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] cursor-pointer"
                        >
                          ✓ Marcar las {activeRoute.stops.length} como visitadas
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {routeError && (
                  <div className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl p-2.5">
                    {routeError}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleGenerateRoute()}
                    className="flex-1 py-2.5 px-4 rounded-2xl bg-[#C22615] hover:bg-red-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Route className="w-4 h-4 text-[#FFE550]" />
                    <span>
                      Generar Ruta Óptima ({routeTargetCount === 0 ? 'Todas' : `${routeTargetCount} paradas`})
                    </span>
                  </button>

                  <button
                    onClick={() => handleGenerateRoute({ openHud: true })}
                    className="py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Genera la ruta y abre directamente la Mini Barra Horizontal HUD"
                  >
                    <Minimize2 className="w-4 h-4" />
                    <span>Generar + HUD</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BARRA DE RUTA ÓPTIMA ACTIVA */}
        {activeRoute && activeRoute.stops.length > 0 && currentRouteStop && (
          <div className="bg-slate-900 text-white rounded-3xl p-4 shadow-md border-2 border-emerald-500/60 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-emerald-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full">
                  Ruta Activa: #{currentRouteStop.stepNumber} / {activeRoute.stops.length}
                </span>
                <span className="text-xs font-bold text-slate-200">
                  📏 {activeRoute.totalDistanceKm.toFixed(2)} km total • Promedio{' '}
                  {activeRoute.avgDistanceMeters} m/parada
                </span>
                <span className="text-[11px] font-semibold text-cyan-300">
                  ({activeRoute.originLabel})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setIsMiniHudMode(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Abrir Mini Barra HUD</span>
                </button>

                <button
                  onClick={() => setShowOnlyRouteStops(prev => !prev)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 cursor-pointer ${
                    showOnlyRouteStops
                      ? 'bg-blue-600 border-blue-400 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                >
                  {showOnlyRouteStops ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{showOnlyRouteStops ? 'Solo ruta' : 'Ver todas'}</span>
                </button>

                <button
                  onClick={handleMarkEntireRouteVisited}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 border border-emerald-600 text-emerald-100 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Marcar todas las paradas de esta ruta como ya visitadas"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Marcar Visitadas</span>
                </button>

                <button
                  onClick={() =>
                    handleGenerateRoute({
                      mode: 'last_stop',
                      originQuest: currentRouteStop.quest,
                      originLabel: `Recalculada desde ${currentRouteStop.quest.name}`,
                    })
                  }
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Recalcular nueva ruta desde esta parada"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                  <span>Recalcular</span>
                </button>

                <button
                  onClick={handleDownloadRouteGPX}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Descargar archivo GPX para PGSharp"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-300" />
                  <span>GPX</span>
                </button>

                <button
                  onClick={handleCopyRouteList}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Copiar todas las coordenadas de la ruta"
                >
                  <Copy className="w-3.5 h-3.5 text-[#FFE550]" />
                  <span>Lista</span>
                </button>

                <button
                  onClick={handleClearRoute}
                  className="px-2.5 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-800 text-red-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Cerrar ruta"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Controles rápidos de paso actual en el mapa */}
            <div className="bg-slate-800/80 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-2 border border-slate-700">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-white truncate">
                  #{currentRouteStop.stepNumber}. {currentRouteStop.quest.name}
                </div>
                <div className="text-[11px] text-slate-300 truncate">
                  <span className="font-mono text-amber-300">
                    {formatCoordsForPgsharp(currentRouteStop.quest.lat, currentRouteStop.quest.lng)}
                  </span>{' '}
                  •{' '}
                  {nextRouteStop
                    ? `Siguiente en ${formatDistanceMeters(nextRouteStop.distanceFromPrevKm)} (${formatCooldownShort(nextRouteStop.cooldownMinutes)})`
                    : 'Fin de ruta'}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevRouteStopAndCopy}
                  disabled={routeCurrentIdx <= 0}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-xs font-black flex items-center gap-1 cursor-pointer"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                  <span>Ant.</span>
                </button>

                <button
                  onClick={handleCopyCurrentRouteStop}
                  className="px-3 py-1.5 rounded-xl bg-[#1160C0] hover:bg-blue-600 text-white text-xs font-black flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-[#FFE550]" />
                  <span>Copiar #{currentRouteStop.stepNumber}</span>
                </button>

                <button
                  onClick={handleNextRouteStopAndCopy}
                  disabled={routeCurrentIdx >= activeRoute.stops.length - 1}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-black flex items-center gap-1 cursor-pointer"
                >
                  <span>
                    {nextRouteStop ? `Sig. (#${nextRouteStop.stepNumber}) + Copiar` : 'Fin'}
                  </span>
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Filtros Rápidos (Estilo nycpokemap pero simplificado) */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border-2 border-slate-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#C22615]" /> Atajos de Recompensa:
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {/* Botón de Sincronización en la Nube Celular <-> PC */}
              <button
                onClick={() => handleSyncWithCloud(true)}
                disabled={isCloudSyncing}
                className="px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-300 disabled:opacity-60"
                title={
                  lastCloudSyncAt
                    ? `Sincronizado Celular ↔ PC a las ${lastCloudSyncAt.toLocaleTimeString()}`
                    : 'Sincronizar paradas visitadas entre Celular y PC'
                }
              >
                <Cloud className={`w-3.5 h-3.5 text-sky-600 ${isCloudSyncing ? 'animate-pulse' : ''}`} />
                <span>{isCloudSyncing ? 'Sincronizando...' : 'Sync Celular↔PC'}</span>
              </button>

              {/* Botón para Alternar entre ver todas u ocultar las ya visitadas */}
              <button
                onClick={() => setHideVisited(prev => !prev)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer flex items-center gap-1.5 ${
                  hideVisited
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}
                title="Oculta del mapa las paradas que ya visitaste para ver solo las pendientes"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {hideVisited
                    ? `Ocultando ${visitedStops.size} visitadas`
                    : `Ocultar ${visitedStops.size} visitadas`}
                </span>
              </button>

              <span className="text-xs font-black text-slate-700 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200 shadow-xs">
                📍 {filteredQuests.length.toLocaleString()} paradas en mapa
              </span>
            </div>
          </div>

          {/* Botones de Recompensas Rápidas */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Botón Principal: 25 Caramelos Eternatus */}
            <button
              onClick={() => handleSelectPreset('eternatus', '4,0,890')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border-2 ${
                activePreset === 'eternatus'
                  ? 'bg-purple-600 text-white border-purple-700 shadow-md ring-2 ring-purple-300 scale-105'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200'
              }`}
            >
              <span className="text-sm">🟣</span>
              <span>25 Caramelos Eternatus</span>
              <span className="bg-purple-800 text-purple-100 text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                Hoy
              </span>
            </button>

            {/* Caramelo Raro */}
            <button
              onClick={() => handleSelectPreset('rare_candy', '2,0,1301')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border-2 ${
                activePreset === 'rare_candy'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md ring-2 ring-amber-300 scale-105'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
              }`}
            >
              <span>⭐</span>
              <span>Caramelo Raro</span>
            </button>

            {/* 1000+ Polvos */}
            <button
              onClick={() => handleSelectPreset('stardust_1000', '3,1000,0')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border-2 ${
                activePreset === 'stardust_1000'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300 scale-105'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
              }`}
            >
              <span>💰</span>
              <span>1,000+ Polvos</span>
            </button>

            {/* Pokochazo */}
            <button
              onClick={() => handleSelectPreset('poffin', '2,0,709')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border-2 ${
                activePreset === 'poffin'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-300 scale-105'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-200'
              }`}
            >
              <span>🥐</span>
              <span>Pokochazo</span>
            </button>

            {/* Spinda */}
            <button
              onClick={() => handleSelectPreset('spinda', '7,0,327')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border-2 ${
                activePreset === 'spinda'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300 scale-105'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200'
              }`}
            >
              <span>🌀</span>
              <span>Spinda</span>
            </button>

            {/* Ver Todos */}
            <button
              onClick={handleSelectAllPopular}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border-2 ${
                activePreset === 'all_popular'
                  ? 'bg-slate-800 text-white border-slate-900 shadow-md ring-2 ring-slate-400 scale-105'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <span>🎯</span>
              <span>Ver Todos</span>
            </button>

            <button
              onClick={handleCopyAllVisible}
              className="ml-auto px-3.5 py-2 rounded-2xl bg-[#1160C0] hover:bg-blue-700 text-white text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              title="Copiar lista de coordenadas visibles"
            >
              <Copy className="w-3.5 h-3.5 text-[#FFE550]" />
              <span>Copiar Lista ({Math.min(filteredQuests.length, 100)})</span>
            </button>
          </div>

          {/* Fila de Filtros: Buscador + Dropdown Desafío + Dropdown Recompensa */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por Poképarada o Desafío..."
                className="w-full pl-9 pr-7 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#C22615] focus:bg-white font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={selectedCondition}
                onChange={e => setSelectedCondition(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#C22615] font-semibold appearance-none cursor-pointer"
              >
                <option value="all">🎯 Filtrar por Desafío (Todos)</option>
                {uniqueConditions.map(cond => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={selectedReward}
                onChange={e => setSelectedReward(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#C22615] font-semibold appearance-none cursor-pointer"
              >
                <option value="all">🎁 Filtrar por Recompensa (Todas)</option>
                {uniqueRewards.map(rew => (
                  <option key={rew} value={rew}>
                    {rew}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {availableFilters && (
            <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between pt-1">
              <span>
                Categorías disponibles en nycpokemap: {availableFilters.t7?.length || 0} Pokémon •{' '}
                {availableFilters.t2?.length || 0} Objetos
              </span>
              {activeRoute && (
                <span className="text-emerald-700 font-bold">
                  ✓ Ruta óptima activa ({activeRoute.stops.length} paradas)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-red-700 text-xs shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span className="font-bold">{error}</span>
            </div>
            <button
              onClick={() => loadData()}
              className="px-3.5 py-1.5 bg-[#C22615] hover:bg-red-700 text-white rounded-xl font-bold cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* CONTENEDOR DEL MAPA / LISTA */}
        {viewMode === 'map' ? (
          <div className="relative w-full rounded-3xl overflow-hidden border-2 border-slate-200 shadow-md bg-white">
            {/* Banner de modo "Elegir punto de inicio en mapa" */}
            {isPickingOriginOnMap && (
              <div className="absolute top-3 left-3 right-14 z-30 bg-[#0B1B3C]/95 text-white px-4 py-2.5 rounded-2xl shadow-xl border-2 border-[#FFE550] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-black">
                  <Crosshair className="w-4 h-4 text-[#FFE550] shrink-0" />
                  <span>Toca cualquier punto o Poképarada en el mapa para fijar el inicio de tu ruta</span>
                </div>
                <button
                  onClick={() => setIsPickingOriginOnMap(false)}
                  className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* Mapa Leaflet de Nueva York */}
            <div
              ref={mapContainerRef}
              className={`w-full h-[650px] sm:h-[700px] z-10 ${
                isPickingOriginOnMap ? 'cursor-crosshair' : ''
              }`}
              style={{ minHeight: '550px' }}
            />

            {/* Spinner de Carga Flotante sobre el Mapa */}
            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-20 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-9 h-9 text-[#C22615] animate-spin" />
                <p className="text-sm font-black text-slate-900 font-pogo">
                  Cargando Poképaradas de nycpokemap en tiempo real...
                </p>
              </div>
            )}

            {/* FICHA FLOTANTE DE LA POKÉPARADA SELECCIONADA */}
            {selectedQuest && (
              <div className="absolute bottom-5 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-30 animate-in fade-in slide-in-from-bottom-4 duration-200">
                <div className="bg-white rounded-3xl p-5 shadow-2xl border-3 border-[#C22615] space-y-3 relative">
                  {/* Botón Cerrar Ficha */}
                  <button
                    onClick={() => setSelectedQuest(null)}
                    className="absolute top-3.5 right-3.5 p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Encabezado de la Ficha */}
                  <div className="pr-6">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#C22615] flex items-center gap-1 mb-1">
                      <MapPin className="w-3.5 h-3.5" /> Ficha de Poképarada
                    </span>
                    <h3 className="text-base font-black text-slate-900 line-clamp-1">
                      {selectedQuest.name || 'Poképarada en Nueva York'}
                    </h3>
                  </div>

                  {/* Caja Desafío */}
                  <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 space-y-0.5">
                    <div className="text-[10px] font-black uppercase text-amber-800 flex items-center gap-1">
                      <Target className="w-3 h-3 text-amber-600" /> Desafío
                    </div>
                    <p className="text-xs font-bold text-amber-950">
                      {selectedQuest.conditions_string || 'Desafío estándar'}
                    </p>
                  </div>

                  {/* Caja Recompensa */}
                  <div className="bg-purple-50 rounded-2xl p-3 border border-purple-200 space-y-0.5">
                    <div className="text-[10px] font-black uppercase text-purple-800 flex items-center gap-1">
                      <Gift className="w-3 h-3 text-purple-600" /> Recompensa
                    </div>
                    <p className="text-xs font-black text-purple-950">
                      {selectedQuest.rewards_string || 'Recompensa'}
                    </p>
                  </div>

                  {/* Coordenadas PGSharp */}
                  <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-xl border border-slate-200 font-mono text-xs font-black text-slate-700">
                    <span>{formatCoordsForPgsharp(selectedQuest.lat, selectedQuest.lng)}</span>
                    <span className="text-[10px] text-slate-500 font-sans font-bold">lat,long</span>
                  </div>

                  {/* Botones de Acción */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleCopyCoords(selectedQuest)}
                      className="w-full py-2.5 rounded-xl bg-[#C22615] hover:bg-red-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#FFE550]" />
                      <span>Copiar PGSharp</span>
                    </button>

                    <button
                      onClick={() =>
                        handleGenerateRoute({
                          mode: 'last_stop',
                          originQuest: selectedQuest,
                          originLabel: `Desde ${selectedQuest.name || 'parada'}`,
                        })
                      }
                      className="w-full py-2.5 rounded-xl bg-[#1160C0] hover:bg-blue-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Route className="w-3.5 h-3.5 text-[#FFE550]" />
                      <span>Ruta desde aquí</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={`https://www.google.com/maps?q=${selectedQuest.lat},${selectedQuest.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition-all flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                      <span>Abrir Maps</span>
                    </a>

                    {isSelectedStopInRoute && (
                      <button
                        onClick={() => setIsMiniHudMode(true)}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Minimize2 className="w-3.5 h-3.5" />
                        <span>Mini Barra HUD</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* MODO VISTA LISTA TRADICIONAL */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQuests.slice(0, 150).map((quest, idx) => {
              const formattedCoords = formatCoordsForPgsharp(quest.lat, quest.lng);
              const stopKey = getQuestStopKey(quest);
              const isVisited = visitedStops.has(stopKey);
              const isEternatus =
                quest.rewards_string?.toLowerCase().includes('eternatus') || quest.rewards_ids === '890';
              const distText =
                lastCopiedQuest && lastCopiedQuest.name !== quest.name
                  ? formatDistanceMeters(
                      getDistance(lastCopiedQuest.lat, lastCopiedQuest.lng, quest.lat, quest.lng)
                    )
                  : null;

              return (
                <div
                  key={`${quest.lat}_${quest.lng}_${idx}`}
                  onClick={() => setSelectedQuest(quest)}
                  className={`rounded-3xl p-5 transition-all border-2 cursor-pointer flex flex-col justify-between gap-3 bg-white hover:border-[#C22615] shadow-xs hover:shadow-md ${
                    isVisited ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin
                          className={`w-4 h-4 shrink-0 ${
                            isEternatus ? 'text-purple-600' : 'text-[#C22615]'
                          }`}
                        />
                        <h4 className="text-sm font-black text-slate-900 line-clamp-1">
                          {quest.name || 'Poképarada'}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {distText && (
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                            {distText}
                          </span>
                        )}
                        {isVisited && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full border border-emerald-300">
                            ✓ Copiada
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">🎯 Desafío</div>
                      <p className="text-xs font-bold text-slate-800">{quest.conditions_string}</p>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-2.5 border border-purple-200">
                      <div className="text-[10px] font-bold text-purple-700 uppercase">🎁 Recompensa</div>
                      <p className="text-xs font-black text-purple-950">{quest.rewards_string}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-slate-600 font-bold">{formattedCoords}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleGenerateRoute({
                            mode: 'last_stop',
                            originQuest: quest,
                            originLabel: `Desde ${quest.name || 'parada'}`,
                          });
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-[#1160C0] hover:bg-blue-700 text-white font-black text-xs cursor-pointer flex items-center gap-1"
                        title="Iniciar ruta óptima desde esta parada"
                      >
                        <Route className="w-3 h-3 text-[#FFE550]" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleCopyCoords(quest);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#C22615] hover:bg-red-700 text-white font-black text-xs cursor-pointer flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3 text-[#FFE550]" />
                        <span>Copiar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
