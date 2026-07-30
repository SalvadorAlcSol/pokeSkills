import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { HubMenu } from './components/HubMenu';
import { RouteTracker } from './components/RouteTracker';
import { DamageCalculator } from './components/DamageCalculator';
import { RaidTeamGenerator } from './components/RaidTeamGenerator';
import { InventoryManager } from './components/InventoryManager';
import { useInventoryStore } from './store/inventoryStore';
import { isSupabaseConfigured } from './services/supabaseClient';

type ScreenType = 'hub' | 'route-tracker' | 'damage-calc' | 'raid-generator' | 'inventory';

function MainApp() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(() => {
    const saved = localStorage.getItem('poketools_current_screen');
    if (saved === 'route-tracker' || saved === 'damage-calc' || saved === 'raid-generator' || saved === 'inventory' || saved === 'hub') {
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

  if (currentScreen === 'route-tracker') {
    return <RouteTracker onBackToHub={() => setCurrentScreen('hub')} />;
  }

  if (currentScreen === 'damage-calc') {
    return <DamageCalculator onBackToHub={() => setCurrentScreen('hub')} />;
  }

  if (currentScreen === 'raid-generator') {
    return <RaidTeamGenerator onBackToHub={() => setCurrentScreen('hub')} />;
  }

  if (currentScreen === 'inventory') {
    return <InventoryManager onBackToHub={() => setCurrentScreen('hub')} />;
  }

  return <HubMenu onSelectTool={(tool) => setCurrentScreen(tool)} />;
}

export default function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}
