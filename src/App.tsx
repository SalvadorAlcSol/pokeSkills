import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { LanguageProvider } from './context/LanguageContext';
import { HubMenu } from './components/HubMenu';
import { RouteTracker } from './components/RouteTracker';
import { DamageCalculator } from './components/DamageCalculator';
import { RaidTeamGenerator } from './components/RaidTeamGenerator';
import { InventoryManager } from './components/InventoryManager';
import { NycQuestsTool } from './components/NycQuestsTool';
import { MaxBattleTool } from './components/MaxBattleTool';
import { useInventoryStore } from './store/inventoryStore';
import { isSupabaseConfigured } from './services/supabaseClient';
import { checkServerUpdateAvailable, forceRefreshAppFromServer } from './utils/appUpdater';

export type ScreenType = 'hub' | 'route-tracker' | 'damage-calc' | 'raid-generator' | 'max-battles' | 'inventory' | 'nyc-quests';

function MainApp() {
  const { inventory } = useInventoryStore();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(() => {
    const saved = localStorage.getItem('poketools_current_screen');
    if (
      saved === 'route-tracker' ||
      saved === 'damage-calc' ||
      saved === 'raid-generator' ||
      saved === 'max-battles' ||
      saved === 'inventory' ||
      saved === 'nyc-quests' ||
      saved === 'hub'
    ) {
      return saved as ScreenType;
    }
    return 'hub';
  });

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isRefreshingApp, setIsRefreshingApp] = useState(false);

  const runUpdateCheck = useCallback(async () => {
    const res = await checkServerUpdateAvailable();
    if (res.hasUpdate) {
      setUpdateAvailable(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('poketools_current_screen', currentScreen);
  }, [currentScreen]);

  useEffect(() => {
    // Clean up temporary cache-busting query param after reload
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('_refresh')) {
        url.searchParams.delete('_refresh');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      // ignore URL errors
    }

    if (isSupabaseConfigured) {
      useInventoryStore.getState().syncFromCloud();
    }

    runUpdateCheck();
    const intervalId = window.setInterval(runUpdateCheck, 45000);
    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        runUpdateCheck();
      }
    };
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [runUpdateCheck]);

  const handleRefreshFromServer = async () => {
    if (isRefreshingApp) return;
    setIsRefreshingApp(true);
    await forceRefreshAppFromServer();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1B3C]">
      {/* Global Top Navbar with User Profile & Box Access */}
      <nav className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 flex items-center justify-between z-40 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentScreen('hub')}
            className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-black text-sm transition-colors cursor-pointer"
          >
            <span className="text-base">⚡</span>
            <span className="tracking-tight">PokeSkills Hub</span>
          </button>

          {/* Quick Tab to NYC Quests */}
          <button
            onClick={() => setCurrentScreen('nyc-quests')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              currentScreen === 'nyc-quests'
                ? 'bg-red-600 text-white border-red-500 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <span>🎯</span>
            <span>Misiones NYC (PGSharp)</span>
          </button>

          {/* Quick Tab to Max Battles */}
          <button
            onClick={() => setCurrentScreen('max-battles')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              currentScreen === 'max-battles'
                ? 'bg-fuchsia-600 text-white border-fuchsia-400 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <span>⚡</span>
            <span>Combates Max</span>
          </button>
        </div>

        {/* User Profile / Inventory Box Quick Access Bar & Live App Updater */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshFromServer}
            disabled={isRefreshingApp}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 border shadow-sm cursor-pointer ${
              updateAvailable
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-300 ring-2 ring-emerald-400/50 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Descargar la última versión desde el servidor sin cerrar la app (limpia caché y recarga)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingApp ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">
              {isRefreshingApp
                ? 'Actualizando...'
                : updateAvailable
                ? '¡Nueva versión! Actualizar'
                : 'Actualizar App'}
            </span>
          </button>

          <button
            onClick={() => setCurrentScreen('inventory')}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 border shadow-sm cursor-pointer ${
              currentScreen === 'inventory'
                ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/30'
                : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
            }`}
            title="Abrir Mi Caja de Pokémon (Perfil & Inventario)"
          >
            <span className="text-sm">📦</span>
            <span className="hidden sm:inline">Mi Caja Pokémon</span>
            <span className="bg-amber-400 text-slate-950 px-2 py-0.2 rounded-full text-[10px] font-black border border-amber-500">
              {inventory.length}
            </span>
          </button>
        </div>
      </nav>

      {/* Screen Views */}
      <div className="flex-1 flex flex-col">
        {currentScreen === 'route-tracker' && (
          <RouteTracker onBackToHub={() => setCurrentScreen('hub')} />
        )}
        {currentScreen === 'damage-calc' && (
          <DamageCalculator onBackToHub={() => setCurrentScreen('hub')} />
        )}
        {currentScreen === 'raid-generator' && (
          <RaidTeamGenerator onBackToHub={() => setCurrentScreen('hub')} />
        )}
        {currentScreen === 'max-battles' && (
          <MaxBattleTool onBackToHub={() => setCurrentScreen('hub')} />
        )}
        {currentScreen === 'inventory' && (
          <InventoryManager onBackToHub={() => setCurrentScreen('hub')} />
        )}
        {currentScreen === 'nyc-quests' && (
          <NycQuestsTool onBackToHub={() => setCurrentScreen('hub')} />
        )}
        {currentScreen === 'hub' && (
          <HubMenu
            onSelectTool={(tool) => setCurrentScreen(tool)}
            updateAvailable={updateAvailable}
            isRefreshingApp={isRefreshingApp}
            onRefreshApp={handleRefreshFromServer}
          />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}
