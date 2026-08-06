import React, { useState } from 'react';
import { useInventoryStore } from '../store/inventoryStore';
import { PokeGenieImporter } from './PokeGenieImporter';
import { VideoScanner } from './VideoScanner';
import { PokemonDetailModal } from './PokemonDetailModal';
import {
  Trash2,
  Search,
  Zap,
  Shield,
  Heart,
  Upload,
  X,
  Sparkles,
  ArrowLeft,
  Video,
  FileSpreadsheet,
  Edit3,
  Check,
  Layers,
  Download,
  FolderInput,
  Cloud,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  Image,
} from 'lucide-react';
import { ScreenshotScanner } from './ScreenshotScanner';
import { POGO_DATABASE } from '../data/pogoDatabase';
import {
  getSpecialFormSpriteUrl,
  getMegaFormsForPokemon,
  getAvailableFormsForSpecies,
} from '../utils/pokemonUtils';
import { calculatePogoPokemonCp } from '../utils/pokemonMath';
import { getSpanishMoveName } from '../utils/pogoMoveTranslator';
import { exportFullAppBackup, importFullAppBackupFile } from '../utils/backupService';
import { UserPokemon } from '../types/UserInventory';
import { isSupabaseConfigured } from '../services/supabaseClient';

export const InventoryManager: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
  const {
    inventory,
    removePokemon,
    updatePokemon,
    importPokemons,
    clearInventory,
    syncFromCloud,
    syncToCloud,
    isSyncing,
  } = useInventoryStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mega' | 'shadow' | 'perfect'>('all');
  const [sortBy, setSortBy] = useState<'cp' | 'pokedex' | 'hp' | 'date'>('cp');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState<'video' | 'images' | 'csv'>('images');

  // Track editing pokemon
  const [editingPokemon, setEditingPokemon] = useState<UserPokemon | null>(null);

  // Track detail view pokemon (opens exclusive screen with strengths, PvP recommendations & lore)
  const [selectedDetailPokemon, setSelectedDetailPokemon] = useState<UserPokemon | null>(null);

  // Local state to track real-time Mega Evolution simulations per card
  const [simulatedMegas, setSimulatedMegas] = useState<Record<string, string>>({});

  const handleManualSyncFromCloud = async () => {
    const res = await syncFromCloud();
    alert(res.message);
  };

  const handleManualSyncToCloud = async () => {
    const res = await syncToCloud();
    alert(res.message);
  };

  React.useEffect(() => {
    if (isSupabaseConfigured) {
      syncFromCloud();
    }
  }, []);

  const handleExportBackup = () => {
    exportFullAppBackup();
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importFullAppBackupFile(file);
  };

  // Filtered inventory based on search and chip filter
  const filteredInventory = inventory.filter((pokemon) => {
    const matchesSearch =
      pokemon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pokemon.speciesId.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const ivPct = Math.round(((pokemon.ivAtk + pokemon.ivDef + pokemon.ivHp) / 45) * 100);

    if (filterType === 'mega') return Boolean(pokemon.canMegaEvolve);
    if (filterType === 'shadow') return Boolean(pokemon.isShadow);
    if (filterType === 'perfect') return ivPct === 100;
    if (filterType === 'shiny') return Boolean(pokemon.isShiny);

    return true;
  });

  // Sorted inventory based on chosen criteria (PC, Pokédex, Salud, Antigüedad)
  const sortedInventory = [...filteredInventory].sort((a, b) => {
    let diff = 0;
    if (sortBy === 'cp') {
      diff = (a.cp || 0) - (b.cp || 0);
    } else if (sortBy === 'pokedex') {
      const numA = parseInt(String(a.speciesId).split('-')[0], 10) || 0;
      const numB = parseInt(String(b.speciesId).split('-')[0], 10) || 0;
      diff = numA - numB;
    } else if (sortBy === 'hp') {
      diff = (a.ivHp || 0) - (b.ivHp || 0);
    } else if (sortBy === 'date') {
      diff = (a.addedAt || 0) - (b.addedAt || 0);
    }

    return sortOrder === 'desc' ? -diff : diff;
  });

  const perfectCount = inventory.filter(
    (p) => Math.round(((p.ivAtk + p.ivDef + p.ivHp) / 45) * 100) === 100
  ).length;
  const megaCount = inventory.filter((p) => p.canMegaEvolve).length;
  const shadowCount = inventory.filter((p) => p.isShadow).length;
  const shinyCount = inventory.filter((p) => p.isShiny).length;

  const toggleMegaSimulation = (pokemonId: string, megaFormId: string) => {
    setSimulatedMegas((prev) => {
      if (prev[pokemonId] === megaFormId) {
        const next = { ...prev };
        delete next[pokemonId];
        return next;
      }
      return { ...prev, [pokemonId]: megaFormId };
    });
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-800 flex flex-col font-sans">
      {/* Pokédex Header Bar */}
      <header className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 border-b-4 border-red-700 text-white shadow-md sticky top-0 z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHub}
              className="px-3.5 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-red-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Volver al Inicio</span>
            </button>

            <div>
              <h1 className="text-lg font-black tracking-tight text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] flex items-center gap-2">
                📦 Mi Caja Pokémon
              </h1>
              <p className="text-[11px] font-medium text-red-100">
                Gestiona tus Pokémon capturados, simula Megas y sincroniza tu inventario
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3.5 py-2 bg-yellow-400 hover:bg-yellow-300 text-red-950 font-black rounded-xl shadow-sm transition-all flex items-center gap-1.5 text-xs border border-yellow-500"
            >
              <Upload className="w-4 h-4 text-red-800" />
              <span>Importar Pokémon</span>
            </button>

            {isSupabaseConfigured && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleManualSyncFromCloud}
                  disabled={isSyncing}
                  className="px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white font-extrabold rounded-xl shadow-sm transition-all flex items-center gap-1.5 text-xs border border-blue-600 disabled:opacity-50"
                  title="Descargar de la nube Supabase a este dispositivo"
                >
                  <Cloud className={`w-4 h-4 ${isSyncing ? 'animate-spin text-yellow-300' : 'text-sky-300'}`} />
                  <span className="hidden lg:inline">{isSyncing ? 'Sincronizando...' : 'Descargar Nube'}</span>
                </button>
                <button
                  onClick={handleManualSyncToCloud}
                  disabled={isSyncing}
                  className="px-2.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold rounded-xl shadow-sm transition-all flex items-center gap-1 text-xs border border-indigo-600 disabled:opacity-50"
                  title="Subir Pokémon locales a la nube Supabase"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-200" />
                  <span className="hidden xl:inline">Subir Nube</span>
                </button>
              </div>
            )}

            {inventory.length > 0 && (
              <button
                onClick={handleExportBackup}
                className="px-3 py-2 bg-red-800/80 hover:bg-red-900 text-white font-extrabold rounded-xl shadow-sm transition-all flex items-center gap-1.5 text-xs border border-red-700"
                title="Descargar copia de seguridad JSON"
              >
                <Download className="w-4 h-4 text-yellow-300" />
                <span className="hidden lg:inline">Guardar Backup</span>
              </button>
            )}

            <label className="px-3 py-2 bg-red-800/80 hover:bg-red-900 text-white font-extrabold rounded-xl shadow-sm transition-all flex items-center gap-1.5 text-xs border border-red-700 cursor-pointer" title="Cargar copia de seguridad JSON">
              <FolderInput className="w-4 h-4 text-yellow-300" />
              <span className="hidden lg:inline">Restaurar Backup</span>
              <input type="file" accept=".json" onChange={handleImportBackupFile} className="hidden" />
            </label>

            {inventory.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que deseas vaciar tu Caja Pokémon?')) {
                    clearInventory();
                  }
                }}
                className="px-2.5 py-2 bg-red-950 hover:bg-black text-red-300 rounded-xl transition-all text-xs font-extrabold flex items-center gap-1 shadow-sm border border-red-800"
                title="Borrar todo el inventario"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden xl:inline">Vaciar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Controls Header Card */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                Inventario de Entrenador
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Simula Megaevoluciones en vivo y obtén recomendaciones personalizadas para Incursiones.
              </p>
            </div>

            <span className="self-start sm:self-auto bg-purple-600 text-white font-extrabold text-xs px-3.5 py-1 rounded-full shadow-xs">
              {inventory.length} Pokémon Guardados
            </span>
          </div>

          {/* Counter Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs transition-all border ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white border-blue-700 font-extrabold shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-extrabold'
              }`}
            >
              Todos ({inventory.length})
            </button>
            <button
              onClick={() => setFilterType('mega')}
              className={`px-3.5 py-1.5 rounded-xl text-xs transition-all border flex items-center gap-1.5 ${
                filterType === 'mega'
                  ? 'bg-pink-600 text-white border-pink-700 font-extrabold shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-extrabold'
              }`}
            >
              💎 Mega Listos ({megaCount})
            </button>
            <button
              onClick={() => setFilterType('shadow')}
              className={`px-3.5 py-1.5 rounded-xl text-xs transition-all border flex items-center gap-1.5 ${
                filterType === 'shadow'
                  ? 'bg-purple-600 text-white border-purple-700 font-extrabold shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-extrabold'
              }`}
            >
              💀 Oscuros ({shadowCount})
            </button>
            <button
              onClick={() => setFilterType('perfect')}
              className={`px-3.5 py-1.5 rounded-xl text-xs transition-all border flex items-center gap-1.5 ${
                filterType === 'perfect'
                  ? 'bg-amber-400 text-slate-950 border-amber-500 font-black shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-extrabold'
              }`}
            >
              🏆 100% Perfectos ({perfectCount})
            </button>
            <button
              onClick={() => setFilterType('shiny')}
              className={`px-3.5 py-1.5 rounded-xl text-xs transition-all border flex items-center gap-1.5 ${
                filterType === 'shiny'
                  ? 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-extrabold'
              }`}
            >
              🌟 Variocolores ({shinyCount})
            </button>
          </div>

          {/* Search Input & Sorting Controls Bar */}
          <div className="flex flex-col gap-3 font-sans">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar Pokémon por nombre o especie en tu caja..."
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-extrabold text-xs focus:outline-none focus:border-purple-600 focus:bg-white transition-all shadow-inner"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Main Sorting Dropdown & Order Direction Toggle */}
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 border-2 border-slate-300 rounded-xl text-xs flex-1 md:flex-initial shadow-xs">
                  <span className="text-[11px] font-black text-slate-800 px-1.5 flex items-center gap-1 shrink-0">
                    <ArrowUpDown className="w-3.5 h-3.5 text-purple-600" />
                    Ordenar:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full bg-white text-slate-900 font-black text-xs py-2 px-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-purple-600 cursor-pointer shadow-2xs"
                  >
                    <option value="cp">⚡ Mayor PC (Puntos de Combate)</option>
                    <option value="pokedex">📖 Número Pokédex (#1 - #1025)</option>
                    <option value="hp">❤️ Salud / IV HP</option>
                    <option value="date">📅 Fecha de Captura</option>
                  </select>
                </div>

                <button
                  onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                  className="px-3 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0 border border-purple-700"
                  title={`Orden actual: ${sortOrder === 'desc' ? 'Descendente (Mayor a Menor)' : 'Ascendente (Menor a Mayor)'}`}
                >
                  {sortOrder === 'desc' ? (
                    <>
                      <ArrowDown className="w-4 h-4 text-yellow-300" />
                      <span className="text-[11px] uppercase font-extrabold">Mayor</span>
                    </>
                  ) : (
                    <>
                      <ArrowUp className="w-4 h-4 text-yellow-300" />
                      <span className="text-[11px] uppercase font-extrabold">Menor</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick 1-Tap Sorting Pills for Mobile */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-xs touch-pan-x">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider shrink-0">Acceso Rápido:</span>
              <button
                onClick={() => { setSortBy('cp'); setSortOrder('desc'); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black border shrink-0 transition-all ${
                  sortBy === 'cp' && sortOrder === 'desc'
                    ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                ⚡ Max PC
              </button>
              <button
                onClick={() => { setSortBy('pokedex'); setSortOrder('asc'); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black border shrink-0 transition-all ${
                  sortBy === 'pokedex' && sortOrder === 'asc'
                    ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                📖 Pokédex #
              </button>
              <button
                onClick={() => { setSortBy('hp'); setSortOrder('desc'); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black border shrink-0 transition-all ${
                  sortBy === 'hp'
                    ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                ❤️ Salud / IV
              </button>
              <button
                onClick={() => { setSortBy('date'); setSortOrder('desc'); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black border shrink-0 transition-all ${
                  sortBy === 'date'
                    ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                📅 Más Recientes
              </button>
            </div>
          </div>
        </div>

        {/* Grid of Pokémon Cards */}
        {sortedInventory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedInventory.map((pokemon) => (
              <PokemonInventoryCard
                key={pokemon.id}
                pokemon={pokemon}
                simulatedMegaId={simulatedMegas[pokemon.id]}
                onToggleMegaSim={(megaId) => toggleMegaSimulation(pokemon.id, megaId)}
                onEdit={() => setEditingPokemon(pokemon)}
                onRemove={() => removePokemon(pokemon.id)}
                onSelect={() => setSelectedDetailPokemon(pokemon)}
                onUpdate={(updates) => updatePokemon(pokemon.id, updates)}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-md">
            <div className="w-16 h-16 bg-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Tu Caja está vacía</h3>
            <p className="text-slate-600 max-w-md mx-auto text-xs font-medium mb-6">
              Agrega tus Pokémon usando el Escáner de Video Inteligente o pega tu CSV de PokeGenie para obtener recomendaciones personalizadas.
            </p>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-2xl shadow-md transition-all text-xs inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Importar mi Primer Pokémon
            </button>
          </div>
        )}
      </main>

      {/* Modal for Exclusive Pokémon Detail (Strengths, Weaknesses, PvP Teams, Lore) */}
      {selectedDetailPokemon && (
        <PokemonDetailModal
          pokemon={selectedDetailPokemon}
          onClose={() => setSelectedDetailPokemon(null)}
          onEdit={() => {
            const target = selectedDetailPokemon;
            setSelectedDetailPokemon(null);
            setEditingPokemon(target);
          }}
        />
      )}

      {/* Modal for Editing a Pokémon */}
      {editingPokemon && (
        <EditPokemonModal
          pokemon={editingPokemon}
          onClose={() => setEditingPokemon(null)}
          onSave={(updates) => updatePokemon(editingPokemon.id, updates)}
        />
      )}

      {/* Modal for Importing Pokémon */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative custom-scrollbar">
            <button
              onClick={() => setShowImportModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
              📥 Importar Pokémon a tu Caja
            </h3>

            {/* Import Tab Switcher */}
            <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6 border border-slate-200">
              <button
                onClick={() => setImportTab('images')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  importTab === 'images'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Image className="w-4 h-4" />
                <span>📸 Capturas con IA</span>
              </button>
              <button
                onClick={() => setImportTab('video')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  importTab === 'video'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Escáner de Video</span>
              </button>
              <button
                onClick={() => setImportTab('csv')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  importTab === 'csv'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Importar CSV</span>
              </button>
            </div>

            {importTab === 'images' && (
              <ScreenshotScanner onComplete={() => setShowImportModal(false)} />
            )}
            {importTab === 'video' && (
              <VideoScanner onComplete={() => setShowImportModal(false)} />
            )}
            {importTab === 'csv' && (
              <PokeGenieImporter onComplete={() => setShowImportModal(false)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface PokemonInventoryCardProps {
  pokemon: UserPokemon;
  simulatedMegaId?: string;
  onToggleMegaSim: (megaFormId: string) => void;
  onEdit: () => void;
  onRemove: () => void;
  onSelect: () => void;
  onUpdate: (updates: Partial<UserPokemon>) => void;
}

const PokemonInventoryCard: React.FC<PokemonInventoryCardProps> = ({
  pokemon,
  simulatedMegaId,
  onToggleMegaSim,
  onEdit,
  onRemove,
  onSelect,
  onUpdate,
}) => {
  const ivPct = Math.round(((pokemon.ivAtk + pokemon.ivDef + pokemon.ivHp) / 45) * 100);
  const isPerfect = ivPct === 100;

  // Database fallback for missing/empty moves
  const dbMatch = POGO_DATABASE.find(
    (p) => p.id.toString() === pokemon.speciesId || p.name.toLowerCase() === pokemon.name.toLowerCase()
  );
  const displayFastMove = pokemon.fastMove || (dbMatch?.fastMoves && dbMatch.fastMoves.length > 0 ? dbMatch.fastMoves[0].name : '');
  const displayChargedMove1 = pokemon.chargedMove1 || (dbMatch?.chargedMoves && dbMatch.chargedMoves.length > 0 ? dbMatch.chargedMoves[0].name : '');

  // Available Mega/Primal forms for this species
  const allMegaForms = getMegaFormsForPokemon(pokemon.speciesId, pokemon.name);

  // Filter available Mega forms based on user's unlockedMegaForm setting
  const availableMegaForms = allMegaForms.filter((f) => {
    if (!pokemon.unlockedMegaForm) {
      if (allMegaForms.length > 1) {
        return f.id === allMegaForms[0].id;
      }
      return true;
    }
    if (pokemon.unlockedMegaForm === 'all') return true;
    return (
      f.id.toLowerCase() === pokemon.unlockedMegaForm.toLowerCase() ||
      f.id.toLowerCase().includes(pokemon.unlockedMegaForm.toLowerCase())
    );
  });

  const activeMegaForm = availableMegaForms.find((f) => f.id === simulatedMegaId);

  // Helper to format clean label for Mega / Primal simulation buttons
  const getFormLabel = (mForm: any) => {
    const name = mForm.name.toLowerCase();
    if (name.includes('x')) return 'Mega X';
    if (name.includes('y')) return 'Mega Y';
    if (mForm.category === 'primal' || name.includes('primal') || name.includes('primigeni')) {
      return 'Primigenio';
    }
    return 'Mega';
  };

  // If Mega simulation is active, calculate simulated Mega CP & Sprite
  const displayCp = activeMegaForm
    ? calculatePogoPokemonCp(
        activeMegaForm.baseAttack,
        activeMegaForm.baseDefense,
        activeMegaForm.baseStamina,
        pokemon.level,
        pokemon.ivAtk,
        pokemon.ivDef,
        pokemon.ivHp
      )
    : pokemon.cp;

  const displaySprite = activeMegaForm
    ? activeMegaForm.spriteUrl
    : getSpecialFormSpriteUrl(pokemon.speciesId);

  const displayName = activeMegaForm ? activeMegaForm.name : pokemon.name;

  return (
    <div
      className={`relative rounded-3xl p-5 border-2 transition-all duration-300 group bg-white shadow-md hover:shadow-lg ${
        activeMegaForm
          ? 'border-pink-500 ring-2 ring-pink-500/20'
          : pokemon.isShadow
          ? 'border-purple-600'
          : 'border-slate-200 hover:border-purple-500'
      }`}
    >
      {/* Action Buttons (Info, Edit & Delete) */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all z-10">
        <button
          onClick={onSelect}
          className="p-1.5 bg-purple-600 text-white hover:bg-purple-700 rounded-xl transition-all shadow-sm"
          title="Ver Detalle Exclusivo (Fortalezas, PvP e Historia)"
        >
          <Info className="w-4 h-4" />
        </button>
        <button
          onClick={onEdit}
          className="p-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all shadow-sm"
          title="Editar Pokémon"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          onClick={onRemove}
          className="p-1.5 bg-red-600 text-white hover:bg-red-700 rounded-xl transition-all shadow-sm"
          title="Eliminar Pokémon"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Top Banner Badges */}
      <div className="flex items-center gap-2 mb-3 flex-wrap cursor-pointer" onClick={onSelect}>
        <span
          className={`text-xs px-3 py-1 rounded-xl font-black shadow-2xs border ${
            activeMegaForm
              ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-700'
              : 'bg-gradient-to-r from-red-600 to-amber-600 text-white border-red-700'
          }`}
        >
          ⚡ PC {displayCp}
        </span>

        <span className="text-white text-xs font-black bg-purple-700 border border-purple-800 px-3 py-1 rounded-xl shadow-2xs">
          Nv. {pokemon.level}
        </span>

        <span
          className={`text-xs px-3 py-1 rounded-xl font-black shadow-2xs border ${
            isPerfect
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 border-amber-600'
              : ivPct >= 90
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-700'
              : 'bg-slate-800 text-white border-slate-900'
          }`}
        >
          {isPerfect ? '🏆 IV 100%' : `IV ${ivPct}%`}
        </span>

        {/* Read-only Shadow Badge */}
        {pokemon.isShadow && (
          <span className="text-[10px] bg-purple-800 text-white border border-purple-950 px-2.5 py-0.5 rounded-xl font-black shadow-2xs">
            💀 Oscuro
          </span>
        )}

        {pokemon.isPurified && (
          <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-xl font-black shadow-2xs">
            ✨ Purificado
          </span>
        )}

        {pokemon.isShiny && (
          <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-xl font-black shadow-2xs flex items-center gap-0.5">
            🌟 Variocolor
          </span>
        )}

        {activeMegaForm && (
          <span className="text-[10px] bg-pink-600 text-white px-2.5 py-0.5 rounded-full font-extrabold shadow-xs">
            ⚡ Mega Simulación
          </span>
        )}
      </div>

      {/* Pokemon Image & Name Header (Clickable) */}
      <div className="flex items-center gap-4 mb-4 cursor-pointer" onClick={onSelect}>
        <div
          className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
            activeMegaForm
              ? 'bg-pink-50 border-pink-300'
              : pokemon.isShadow
              ? 'bg-purple-50 border-purple-300'
              : 'bg-slate-100 border-slate-200'
          }`}
        >
          <img
            src={displaySprite}
            alt={displayName}
            className="max-w-[85%] max-h-[85%] object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-extrabold text-slate-900 text-lg truncate tracking-tight flex items-center gap-1.5">
            {pokemon.isShadow && <span title="Pokémon Oscuro">💀</span>}
            {pokemon.isPurified && <span title="Pokémon Purificado">✨</span>}
            {pokemon.isShiny && <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" title="Pokémon Variocolor" />}
            {displayName}
          </h3>

          {/* Individual IV Bars */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center text-[11px] text-slate-700 gap-2 font-bold">
              <span className="w-7 text-amber-600 font-extrabold flex items-center gap-0.5">
                <Zap className="w-3 h-3" /> ATK
              </span>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${(pokemon.ivAtk / 15) * 100}%` }}
                />
              </div>
              <span className="font-mono text-slate-900 font-black w-4 text-right">{pokemon.ivAtk}</span>
            </div>

            <div className="flex items-center text-[11px] text-slate-700 gap-2 font-bold">
              <span className="w-7 text-blue-600 font-extrabold flex items-center gap-0.5">
                <Shield className="w-3 h-3" /> DEF
              </span>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${(pokemon.ivDef / 15) * 100}%` }}
                />
              </div>
              <span className="font-mono text-slate-900 font-black w-4 text-right">{pokemon.ivDef}</span>
            </div>

            <div className="flex items-center text-[11px] text-slate-700 gap-2 font-bold">
              <span className="w-7 text-emerald-600 font-extrabold flex items-center gap-0.5">
                <Heart className="w-3 h-3" /> STA
              </span>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{ width: `${(pokemon.ivHp / 15) * 100}%` }}
                />
              </div>
              <span className="font-mono text-slate-900 font-black w-4 text-right">{pokemon.ivHp}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Moves Section */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3 mb-4 space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-700 font-bold gap-2">
          <span className="text-blue-700 font-extrabold flex items-center gap-1 shrink-0">⚡ Rápido:</span>
          <span className="font-extrabold text-slate-900 text-right truncate">
            {getSpanishMoveName(displayFastMove) || 'Desconocido'}
          </span>
        </div>

        <div className="flex items-start justify-between text-slate-700 font-bold gap-2">
          <span className="text-purple-700 font-extrabold flex items-center gap-1 shrink-0 pt-0.5">💥 Cargados:</span>
          <div className="flex flex-col items-end gap-1 min-w-0">
            <span className="font-extrabold text-slate-900 text-right truncate max-w-full">
              {getSpanishMoveName(displayChargedMove1) || 'Desconocido'}
            </span>
            {pokemon.chargedMove2 && (
              <span className="font-extrabold text-purple-700 text-right text-[11px] bg-purple-100 border border-purple-300 px-2 py-0.5 rounded-lg shadow-2xs">
                + {getSpanishMoveName(pokemon.chargedMove2)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Controls & Mega Simulation */}
      <div className="pt-2 border-t border-slate-200 space-y-2">
        {/* Mega / Primal Evolution Simulation Selector */}
        {allMegaForms.length > 0 && pokemon.canMegaEvolve && (
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-2.5">
            <div className="flex items-center justify-between mb-1.5 text-[11px] text-pink-700 font-extrabold">
              <span className="flex items-center gap-1">⚡ Simular Mega / Regresión:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableMegaForms.map((mForm) => {
                const isSelected = simulatedMegaId === mForm.id;
                return (
                  <button
                    key={mForm.id}
                    onClick={() => onToggleMegaSim(mForm.id)}
                    className={`flex-1 py-1 px-2 rounded-xl text-[11px] font-extrabold transition-all border ${
                      isSelected
                        ? 'bg-pink-600 text-white border-pink-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? '✓ ' : '⚡ '} {getFormLabel(mForm)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mega Ready Status Toggle ONLY IF species actually can Mega evolve */}
        {allMegaForms.length > 0 && (
          <div className="flex items-center justify-between gap-2 text-xs pt-1">
            <button
              onClick={() => onUpdate({ canMegaEvolve: !pokemon.canMegaEvolve })}
              className={`w-full py-1.5 px-2 rounded-xl border text-[11px] font-extrabold transition-all flex items-center justify-center gap-1 ${
                pokemon.canMegaEvolve
                  ? 'bg-pink-600 text-white border-pink-700 shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
              title="Toca para marcar si tiene la Mega Desbloqueada"
            >
              💎 {pokemon.canMegaEvolve ? `Mega Nivel ${pokemon.megaLevel ?? 3}` : 'Sin Mega'}
            </button>
          </div>
        )}

        {/* Full Details Button */}
        <button
          onClick={onSelect}
          className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-2xs mt-2"
        >
          <Info className="w-3.5 h-3.5 text-purple-600" />
          <span>Ver Ficha, Equipos PvP & Lore</span>
        </button>
      </div>
    </div>
  );
};

interface EditPokemonModalProps {
  pokemon: UserPokemon;
  onClose: () => void;
  onSave: (updates: Partial<UserPokemon>) => void;
}

const EditPokemonModal: React.FC<EditPokemonModalProps> = ({ pokemon, onClose, onSave }) => {
  const availableForms = getAvailableFormsForSpecies(pokemon.speciesId, pokemon.name);
  const allMegaForms = getMegaFormsForPokemon(pokemon.speciesId, pokemon.name);

  const currentFormOpt =
    availableForms.find((f) => f.speciesId === pokemon.speciesId) || availableForms[0];

  const [selectedFormSpeciesId, setSelectedFormSpeciesId] = useState(
    currentFormOpt?.speciesId || pokemon.speciesId
  );
  const [level, setLevel] = useState(pokemon.level);
  const [ivAtk, setIvAtk] = useState(pokemon.ivAtk);
  const [ivDef, setIvDef] = useState(pokemon.ivDef);
  const [ivHp, setIvHp] = useState(pokemon.ivHp);
  const [fastMove, setFastMove] = useState(pokemon.fastMove);
  const [chargedMove1, setChargedMove1] = useState(pokemon.chargedMove1);
  const [chargedMove2, setChargedMove2] = useState(pokemon.chargedMove2 || '');
  const [canMegaEvolve, setCanMegaEvolve] = useState(Boolean(pokemon.canMegaEvolve));
  const [unlockedMegaForm, setUnlockedMegaForm] = useState(pokemon.unlockedMegaForm || (allMegaForms[0]?.id || ''));
  const [megaLevel, setMegaLevel] = useState<number>(pokemon.megaLevel ?? (pokemon.canMegaEvolve ? 3 : 0));

  const activeFormOpt =
    availableForms.find((f) => f.speciesId === selectedFormSpeciesId) || currentFormOpt;

  const computedCp = activeFormOpt
    ? calculatePogoPokemonCp(
        activeFormOpt.baseAttack,
        activeFormOpt.baseDefense,
        activeFormOpt.baseStamina,
        level,
        ivAtk,
        ivDef,
        ivHp
      )
    : pokemon.cp;

  const handleSave = () => {
    onSave({
      speciesId: activeFormOpt ? activeFormOpt.speciesId : pokemon.speciesId,
      name: activeFormOpt ? activeFormOpt.displayName : pokemon.name,
      cp: computedCp,
      level,
      ivAtk,
      ivDef,
      ivHp,
      fastMove,
      chargedMove1,
      chargedMove2: chargedMove2 || undefined,
      canMegaEvolve: allMegaForms.length > 0 ? canMegaEvolve : false,
      unlockedMegaForm: allMegaForms.length > 0 && canMegaEvolve ? unlockedMegaForm : undefined,
      megaLevel: allMegaForms.length > 0 && canMegaEvolve ? megaLevel : 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative custom-scrollbar max-h-[90vh] overflow-y-auto text-slate-900 font-sans">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          ✏️ Editar {pokemon.name}
        </h3>

        <div className="space-y-4 text-xs font-bold">
          {/* Base Species Selector */}
          <div>
            <label className="block text-slate-700 font-extrabold mb-1">Especie Pokémon:</label>
            <select
              value={selectedFormSpeciesId.split('-')[0]}
              onChange={(e) => {
                const newId = e.target.value;
                const dbMatch = POGO_DATABASE.find((p) => p.id.toString() === newId || p.name === newId);
                if (dbMatch) {
                  setSelectedFormSpeciesId(dbMatch.id.toString());
                  if (dbMatch.fastMoves.length > 0) setFastMove(dbMatch.fastMoves[0].name);
                  if (dbMatch.chargedMoves.length > 0) setChargedMove1(dbMatch.chargedMoves[0].name);
                  setChargedMove2('');
                }
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-purple-600 font-extrabold"
            >
              {POGO_DATABASE.map((p) => (
                <option key={p.id} value={p.id.toString()} className="bg-white text-slate-900 font-bold">
                  #{p.id} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Form Selection if species has multiple permanent forms (e.g. Palkia Normal vs Origin) */}
          {availableForms.length > 1 && (
            <div>
              <label className="block text-slate-700 font-extrabold mb-1">Forma / Variante:</label>
              <select
                value={selectedFormSpeciesId}
                onChange={(e) => {
                  const newSpeciesId = e.target.value;
                  setSelectedFormSpeciesId(newSpeciesId);
                  const newOpt = availableForms.find((f) => f.speciesId === newSpeciesId);
                  if (newOpt) {
                    if (newOpt.fastMoves.length > 0) setFastMove(newOpt.fastMoves[0]);
                    if (newOpt.chargedMoves.length > 0) setChargedMove1(newOpt.chargedMoves[0]);
                  }
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-purple-600 font-extrabold"
              >
                {availableForms.map((f) => (
                  <option key={f.speciesId} value={f.speciesId} className="bg-white text-slate-900">
                    {f.displayName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Level Slider / Steppers */}
          <div>
            <div className="flex justify-between items-center text-slate-800 font-extrabold mb-1">
              <span>Nivel: <strong className="text-purple-700 font-black">{level}</strong></span>
              <span className="text-blue-700 font-black bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">PC Calculado: {computedCp}</span>
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => setLevel((prev) => Math.max(1, prev - 0.5))}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-base flex items-center justify-center shrink-0 border border-slate-300 active:scale-95 shadow-xs"
              >
                -
              </button>
              <input
                type="range"
                min="1"
                max="50"
                step="0.5"
                value={level}
                onChange={(e) => setLevel(parseFloat(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <button
                type="button"
                onClick={() => setLevel((prev) => Math.min(50, prev + 0.5))}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-base flex items-center justify-center shrink-0 border border-slate-300 active:scale-95 shadow-xs"
              >
                +
              </button>
            </div>
          </div>

          {/* IV Inputs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700">Valores Individuales (IVs):</span>
              <button
                type="button"
                onClick={() => {
                  setIvAtk(15);
                  setIvDef(15);
                  setIvHp(15);
                }}
                className="text-[10px] font-black text-amber-950 bg-amber-400 hover:bg-amber-300 px-2 py-0.5 rounded-md border border-amber-500 shadow-2xs"
              >
                🏆 100% IV (15/15/15)
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-amber-600 font-extrabold text-[10px] uppercase mb-1">Ataque IV:</label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={ivAtk}
                  onChange={(e) => setIvAtk(Math.min(15, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-center font-mono font-black text-sm"
                />
              </div>
              <div>
                <label className="block text-blue-600 font-extrabold text-[10px] uppercase mb-1">Defensa IV:</label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={ivDef}
                  onChange={(e) => setIvDef(Math.min(15, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-center font-mono font-black text-sm"
                />
              </div>
              <div>
                <label className="block text-emerald-600 font-extrabold text-[10px] uppercase mb-1">Salud IV:</label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={ivHp}
                  onChange={(e) => setIvHp(Math.min(15, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-center font-mono font-black text-sm"
                />
              </div>
            </div>
          </div>

          {/* Moves Selectors */}
          <div>
            <label className="block text-blue-700 font-extrabold mb-1">Ataque Rápido:</label>
            <select
              value={fastMove}
              onChange={(e) => setFastMove(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-extrabold outline-none"
            >
              {activeFormOpt?.fastMoves.map((m) => (
                <option key={m} value={m} className="bg-white text-slate-900 font-extrabold">
                  {getSpanishMoveName(m)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-purple-700 font-extrabold mb-1">Primer Ataque Cargado:</label>
            <select
              value={chargedMove1}
              onChange={(e) => setChargedMove1(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-extrabold outline-none"
            >
              {activeFormOpt?.chargedMoves.map((m) => (
                <option key={m} value={m} className="bg-white text-slate-900 font-extrabold">
                  {getSpanishMoveName(m)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-extrabold mb-1">Segundo Ataque Cargado (Opcional):</label>
            <select
              value={chargedMove2}
              onChange={(e) => setChargedMove2(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-extrabold outline-none"
            >
              <option value="" className="bg-white text-slate-500 font-medium">
                Ninguno
              </option>
              {activeFormOpt?.chargedMoves.map((m) => (
                <option key={m} value={m} className="bg-white text-slate-900 font-extrabold">
                  {getSpanishMoveName(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Mega Unlock Settings (ONLY if species can Mega evolve) */}
          {allMegaForms.length > 0 && (
            <div className="p-3.5 bg-pink-50 border border-pink-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-pink-900 font-extrabold block">💎 MegaEvolución Desbloqueada</span>
                  <span className="text-[10px] text-slate-600 font-medium">
                    Marcar si esta unidad tiene la Mega / Primigenio desbloqueada
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={canMegaEvolve}
                  onChange={(e) => setCanMegaEvolve(e.target.checked)}
                  className="w-5 h-5 accent-pink-600 cursor-pointer"
                />
              </div>

              {canMegaEvolve && (
                <div className="space-y-3 pt-1">
                  {allMegaForms.length > 1 && (
                    <div>
                      <label className="block text-pink-800 text-[11px] font-extrabold mb-1">
                        Variante Mega Liberada en este Pokémon:
                      </label>
                      <select
                        value={unlockedMegaForm}
                        onChange={(e) => setUnlockedMegaForm(e.target.value)}
                        className="w-full p-2 bg-white border border-pink-300 rounded-xl text-slate-900 font-extrabold outline-none text-xs"
                      >
                        {allMegaForms.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                        <option value="all">Ambas (Mega X y Mega Y)</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-pink-800 text-[11px] font-extrabold mb-1">
                      Nivel Mega Desbloqueado:
                    </label>
                    <select
                      value={megaLevel}
                      onChange={(e) => setMegaLevel(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-pink-300 rounded-xl text-slate-900 font-extrabold outline-none text-xs"
                    >
                      <option value={4}>🌟 Nivel 4 (Ultra / Supremo - +3 Caramelos, +35% XL, +300 PX)</option>
                      <option value={3}>💎 Nivel 3 (Máximo - +2 Caramelos, +25% XL, +200 PX)</option>
                      <option value={2}>⭐ Nivel 2 (Alto - +1 Caramelo, +10% XL, +100 PX)</option>
                      <option value={1}>🌱 Nivel 1 (Base - +1 Caramelo, +50 PX)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-extrabold transition-colors text-xs"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
          >
            <Check className="w-4 h-4" />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
