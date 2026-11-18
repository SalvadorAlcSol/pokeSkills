import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Coins,
  CheckCircle2,
  AlertCircle,
  Navigation,
  ChevronDown,
  Layers,
  List,
  Map as MapIcon,
  Zap,
  X
} from 'lucide-react';
import {
  NycQuest,
  NycFilterData,
  fetchNycMetadata,
  fetchNycQuestsByFilters,
  formatCoordsForPgsharp,
  POPULAR_PRESET_FILTERS
} from '../services/nycPokeMapService';

interface NycQuestsToolProps {
  onBackToHub: () => void;
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

// Las 57 Poképaradas registradas y visitadas en la sesión de hoy
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
  "St. Stephen of Hungary Catholic Church_40.773881,-73.950469"
];

export const NycQuestsTool: React.FC<NycQuestsToolProps> = ({ onBackToHub }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [availableFilters, setAvailableFilters] = useState<NycFilterData | null>(null);
  const [quests, setQuests] = useState<NycQuest[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<NycQuest | null>(null);
  const [copiedCoords, setCopiedCoords] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [hideVisited, setHideVisited] = useState<boolean>(false);

  // Cargar paradas visitadas combinando la lista inicial con localStorage
  const [visitedStops, setVisitedStops] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('pgsharp_copied_stops');
      const existing: string[] = saved ? JSON.parse(saved) : [];
      const combined = new Set<string>([...INITIAL_VISITED_STOPS, ...existing]);
      localStorage.setItem('pgsharp_copied_stops', JSON.stringify(Array.from(combined)));
      return combined;
    } catch {
      return new Set(INITIAL_VISITED_STOPS);
    }
  });

  // Filtros interactivos
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [selectedReward, setSelectedReward] = useState<string>('all');
  const [activePreset, setActivePreset] = useState<string>('eternatus'); // Por defecto: Caramelos Eternatus
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Referencias para el mapa Leaflet
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Registro de paradas ya copiadas / teletransportadas
  const markAsVisited = (key: string) => {
    setVisitedStops(prev => {
      const updated = new Set(prev);
      updated.add(key);
      try {
        localStorage.setItem('pgsharp_copied_stops', JSON.stringify(Array.from(updated)));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const clearVisitedHistory = () => {
    setVisitedStops(new Set());
    localStorage.removeItem('pgsharp_copied_stops');
  };

  // Copia de coordenadas exacta: lat,long sin espacios
  const handleCopyCoords = async (quest: NycQuest, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const formatted = formatCoordsForPgsharp(quest.lat, quest.lng);
    const stopKey = `${quest.name}_${formatted}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(formatted);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = formatted;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setCopiedCoords(formatted);
      markAsVisited(stopKey);
      setTimeout(() => {
        setCopiedCoords((curr) => (curr === formatted ? null : curr));
      }, 3500);
    } catch (err) {
      console.error('Error al copiar coordenadas:', err);
    }
  };

  // Carga de datos desde nycpokemap.com
  const loadData = async (filterCodes?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const meta = await fetchNycMetadata();
      setAvailableFilters(meta.filters);

      let queryCodes = filterCodes;
      if (!queryCodes || queryCodes.length === 0) {
        if (activePreset === 'eternatus') {
          queryCodes = ['4,0,890'];
        } else if (activePreset === 'all_popular') {
          queryCodes = POPULAR_PRESET_FILTERS.map(p => p.code);
        } else {
          const match = POPULAR_PRESET_FILTERS.find(p => p.id === activePreset);
          queryCodes = match ? [match.code] : ['4,0,890'];
        }
      }

      const questData = await fetchNycQuestsByFilters(queryCodes);
      setQuests(questData.quests || []);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error(err);
      setError('No se pudo conectar a nycpokemap.com. Revisa tu conexión o intenta recargar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Carga inicial con Caramelos Eternatus
    loadData(['4,0,890']);
  }, []);

  // Manejador de atajos rápidos
  const handleSelectPreset = (presetId: string, code: string) => {
    setActivePreset(presetId);
    setSelectedCondition('all');
    setSelectedReward('all');
    setSearchTerm('');
    setSelectedQuest(null);
    loadData([code]);
  };

  const handleSelectAllPopular = () => {
    setActivePreset('all_popular');
    setSelectedCondition('all');
    setSelectedReward('all');
    setSearchTerm('');
    setSelectedQuest(null);
    loadData(POPULAR_PRESET_FILTERS.map(p => p.code));
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
        const formattedCoords = formatCoordsForPgsharp(q.lat, q.lng);
        const stopKey = `${q.name}_${formattedCoords}`;
        if (visitedStops.has(stopKey)) return false;
      }

      return true;
    });
  }, [quests, searchTerm, selectedCondition, selectedReward, hideVisited, visitedStops]);

  // Inicializar mapa Leaflet centrado en Manhattan / NYC
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([40.7580, -73.9855], 13); // Manhattan / Times Square / Central Park

    // OpenStreetMap 100% libre y sin API key (el mismo proveedor de nycpokemap.com)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      minZoom: 10,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Actualizar marcadores en el mapa cuando cambian las paradas filtradas o la parada seleccionada
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Renderizamos hasta 1500 paradas para máxima fluidez a 60 FPS
    const stopsToRender = filteredQuests.slice(0, 1500);

    stopsToRender.forEach(quest => {
      const formattedCoords = formatCoordsForPgsharp(quest.lat, quest.lng);
      const stopKey = `${quest.name}_${formattedCoords}`;
      const isVisited = visitedStops.has(stopKey);
      const isSelected =
        selectedQuest?.lat === quest.lat && selectedQuest?.lng === quest.lng;

      const icon = createPokestopDivIcon(quest, isVisited, isSelected);

      const marker = L.marker([quest.lat, quest.lng], {
        icon,
        title: quest.name,
      });

      // Al hacer clic en el marcador: abre la ficha de la Poképarada (sin copiar al portapapeles)
      marker.on('click', () => {
        setSelectedQuest(quest);
        map.panTo([quest.lat, quest.lng]);
      });

      // Popup de Leaflet al hacer clic
      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 200px; padding: 2px;">
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
            📍 ${quest.name || 'Poképarada'}
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px; margin-bottom: 6px;">
            <div style="font-size: 10px; font-weight: 800; color: #b45309; text-transform: uppercase;">🎯 Desafío</div>
            <div style="font-size: 11px; font-weight: 700; color: #334155;">${quest.conditions_string || 'Desafío'}</div>
          </div>
          <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 6px; margin-bottom: 8px;">
            <div style="font-size: 10px; font-weight: 800; color: #6d28d9; text-transform: uppercase;">🎁 Recompensa</div>
            <div style="font-size: 11px; font-weight: 800; color: #4c1d95;">${quest.rewards_string || 'Recompensa'}</div>
          </div>
          <div style="font-family: monospace; font-size: 11px; font-weight: bold; color: #475569; background: #e2e8f0; padding: 4px 6px; border-radius: 6px; text-align: center; margin-bottom: 8px;">
            ${formattedCoords}
          </div>
          <button id="btn-popup-copy-${quest.lat}-${quest.lng}" style="
            width: 100%;
            background: #C22615;
            color: white;
            font-size: 11px;
            font-weight: 900;
            padding: 7px 10px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          ">
            📋 Copiar para PGSharp
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, { closeButton: false, offset: [0, -10] });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-popup-copy-${quest.lat}-${quest.lng}`);
        if (btn) {
          btn.onclick = () => handleCopyCoords(quest);
        }
      });

      marker.addTo(layerGroup);
    });

    // Si hay una parada seleccionada, enfocarla
    if (selectedQuest) {
      map.panTo([selectedQuest.lat, selectedQuest.lng]);
    }
  }, [filteredQuests, selectedQuest, visitedStops]);

  // Redimensionar el mapa si cambia a modo mapa
  useEffect(() => {
    if (viewMode === 'map' && mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 100);
    }
  }, [viewMode]);

  // Copiar todas las coordenadas visibles
  const handleCopyAllVisible = async () => {
    if (filteredQuests.length === 0) return;
    const list = filteredQuests.slice(0, 100).map(q => formatCoordsForPgsharp(q.lat, q.lng)).join('\n');
    try {
      await navigator.clipboard.writeText(list);
      setCopiedCoords(`¡Copiadas ${Math.min(filteredQuests.length, 100)} coordenadas!`);
      setTimeout(() => setCopiedCoords(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

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
                <h1 className="text-xl sm:text-2xl font-black text-[#FFE550] tracking-tight font-pogo drop-shadow-sm">
                  Mapa de Desafíos NYC (nycpokemap)
                </h1>
                <span className="bg-[#FFE550] text-[#0B1B3C] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  PGSharp Ready
                </span>
              </div>
              <p className="text-xs text-red-100 font-medium">
                Toca cualquier Poképarada en el mapa para copiar sus coordenadas directamente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
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
                ¡Coordenadas Copiadas al Portapapeles!
              </p>
              <p className="text-sm font-mono font-black text-white">{copiedCoords}</p>
              <p className="text-[11px] text-emerald-100 font-medium">
                Listo para teletransportar en PGSharp (sin espacio)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 flex flex-col gap-4">
        {/* Barra de Filtros Rápidos (Estilo nycpokemap pero simplificado) */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border-2 border-slate-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#C22615]" /> Atajos de Recompensa:
            </span>

            <div className="flex flex-wrap items-center gap-2">
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
            {/* Mapa Leaflet de Nueva York */}
            <div
              ref={mapContainerRef}
              className="w-full h-[650px] sm:h-[700px] z-10"
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

            {/* FICHA FLOTANTE DE LA POKÉPARADA SELECCIONADA (Estilo nycpokemap + PGSharp) */}
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

                    <a
                      href={`https://www.google.com/maps?q=${selectedQuest.lat},${selectedQuest.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs border border-slate-300 transition-all flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                      <span>Abrir Maps</span>
                    </a>
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
              const stopKey = `${quest.name}_${formattedCoords}`;
              const isVisited = visitedStops.has(stopKey);
              const isEternatus =
                quest.rewards_string?.toLowerCase().includes('eternatus') || quest.rewards_ids === '890';

              return (
                <div
                  key={`${quest.lat}_${quest.lng}_${idx}`}
                  onClick={() => setSelectedQuest(quest)}
                  className={`rounded-3xl p-5 transition-all border-2 cursor-pointer flex flex-col justify-between gap-3 bg-white hover:border-[#C22615] shadow-xs hover:shadow-md ${
                    isVisited ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <MapPin
                          className={`w-4 h-4 ${isEternatus ? 'text-purple-600' : 'text-[#C22615]'}`}
                        />
                        <h4 className="text-sm font-black text-slate-900 line-clamp-1">
                          {quest.name || 'Poképarada'}
                        </h4>
                      </div>
                      {isVisited && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full border border-emerald-300">
                          ✓ Copiada
                        </span>
                      )}
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

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-600 font-bold">{formattedCoords}</span>
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
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
