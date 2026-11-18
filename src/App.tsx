import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { HubMenu } from './components/HubMenu';
import { RouteTracker } from './components/RouteTracker';
import { DamageCalculator } from './components/DamageCalculator';
import { RaidTeamGenerator } from './components/RaidTeamGenerator';
import { InventoryManager } from './components/InventoryManager';
import { NycQuestsTool } from './components/NycQuestsTool';
import { useInventoryStore } from './store/inventoryStore';
import { isSupabaseConfigured } from './services/supabaseClient';

export type ScreenType = 'hub' | 'route-tracker' | 'damage-calc' | 'raid-generator' | 'inventory' | 'nyc-quests';

function MainApp() {
  const { inventory } = useInventoryStore();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(() => {
    const saved = localStorage.getItem('poketools_current_screen');
    if (
      saved === 'route-tracker' ||
      saved === 'damage-calc' ||
      saved === 'raid-generator' ||
      saved === 'inventory' ||
      saved === 'nyc-quests' ||
      saved === 'hub'
    ) {
      return saved as ScreenType;
    }
    return 'hub';
  });

  useEffect(() => {
    localStorage.setItem('poketools_current_screen', currentScreen);
  }, [currentScreen]);

  useEffect(() => {
    if (isSupabaseConfigured) {
      useInventoryStore.getState().syncFromCloud();
    }
  }, []);

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
        </div>

        {/* User Profile / Inventory Box Quick Access Bar */}
        <div className="flex items-center gap-2">
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
            <span>Mi Caja Pokémon</span>
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
        {currentScreen === 'inventory' && (
          <InventoryManager onBackToHub={() => setCurrentScreen('hub')} />
        )}
        {currentScreen === 'nyc-quests' && (
          <NycQuestsTool onBackToHub={() => setCurrentScreen('hub')} />
        )}
        {currentScreen === 'hub' && (
          <HubMenu onSelectTool={(tool) => setCurrentScreen(tool)} />
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
