import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'es' | 'en';

interface Translations {
  // Hub Menu
  hubTitle: string;
  hubSubtitle: string;
  hubTagline: string;
  toolsReady: string;
  selectTool: string;
  routeTrackerTitle: string;
  routeTrackerDesc: string;
  openMap: string;
  stopsCount: string;
  damageCalcTitle: string;
  damageCalcDesc: string;
  calcDamage: string;
  exactCalc: string;
  upcoming: string;
  inDevelopment: string;
  teamBuilderTitle: string;
  teamBuilderDesc: string;
  evaluatorTitle: string;
  evaluatorDesc: string;
  footerTagline: string;

  // Buttons & Actions
  backToHub: string;
  searchPlaceholder: string;
  searchApiBtn: string;
  pogoActive: string;
  
  // Damage Calculator
  damageCalcHeader: string;
  damageCalcHeaderSub: string;
  officialFormula: string;
  damageBreakdown: string;
  attackerStats: string;
  defender: string;
  attacker: string;
  fastMove: string;
  chargedMove1: string;
  chargedMove2: string;
  unlockCharged2: string;
  damagePerHit: string;
  rivalLifePercent: string;
  searchAttacker: string;
  searchDefender: string;
  filterByType: string;
  allTypes: string;
  clearFilters: string;
  powerLabel: string;
  baseAtkLabel: string;
  baseDefLabel: string;
  baseStaLabel: string;
  offensiveTag: string;
  defensiveTag: string;
  defenderLevelLabel: string;
  localDatabaseNote: string;
  searchPokeApiGlobal: string;
  weaknessesTitle: string;
  resistancesTitle: string;
  activateMega: string;
  enableSpecialForm: string;
  selectMegaVariant: string;
  selectFormVariant: string;
  levelLabel: string;
  ivAtk: string;
  ivDef: string;
  ivHp: string;
  baseAtk: string;
  baseDef: string;
  baseSta: string;
  movesFor: string;
  superEffective: string;
  neutralDamage: string;
  notVeryEffective: string;
  immune: string;
  stab: string;

  // Route Tracker
  routeTrackerHeader: string;
  totalDistance: string;
  estimatedTime: string;
  routeAlgorithm: string;
  optimizeTsp: string;
  reoptimizeTsp: string;
  comparison: string;
  analysis: string;
  reset: string;

  // Raid Team Generator
  raidGenTitle: string;
  raidGenDesc: string;
  raidGenHeader: string;
  raidGenHeaderSub: string;
  selectRaidBoss: string;
  quickSelectBosses: string;
  recommendedTeamTitle: string;
  recommendedTeamSub: string;
  optimalMoveset: string;
  estimatedDps: string;
  copySearchString: string;
  copiedSearchString: string;
  includeMegas: string;
  attackerLevelLabel: string;
  topCountersTag: string;
}

const translations: Record<Language, Translations> = {
  es: {
    // Hub Menu
    hubTitle: 'POKÉTOOLS HUB',
    hubSubtitle: 'Centro Táctico de Entrenadores Pokémon',
    hubTagline: 'Pokédex Táctica',
    toolsReady: '3 Herramientas listas',
    selectTool: 'Selecciona tu Herramienta',
    routeTrackerTitle: 'Route Tracker',
    routeTrackerDesc: 'Optimizador de rutas para Pokémon GO con algoritmo TSP (2-Opt), cálculo de tiempo de cooldown oficial, mapa interactivo y exportación GPX.',
    openMap: 'Abrir Mapa',
    stopsCount: '27 PokéStops Nacionales',
    damageCalcTitle: 'Damage Calculator',
    damageCalcDesc: 'Calculadora exacta de daño en puntos de salud (HP) y porcentaje de vida. Evalúa multiplicadores de tipo (STAB, súper eficaz) y barra de vida animada.',
    calcDamage: 'Calcular Daño',
    exactCalc: 'Cálculo exacto HP & KO',
    upcoming: 'Próximamente',
    inDevelopment: 'En desarrollo para futuras versiones...',
    teamBuilderTitle: 'Raid Team Generator',
    teamBuilderDesc: 'Generador táctico de equipos para Incursiones. Determina los 6 mejores Pokémon y sus ataques exactos para maximizar el daño al Jefe de Raid.',
    evaluatorTitle: 'IV & EV Stats Evaluator',
    evaluatorDesc: 'Calculadora de IVs y estadísticas máximas según naturaleza y esfuerzo (EVs) para optimizar el rendimiento competitivo.',
    footerTagline: 'Versión 2.0 PRO • Diseñado para entrenadores de Pokémon GO y juego competitivo',

    // Buttons & Actions
    backToHub: 'Hub',
    searchPlaceholder: 'Actual',
    searchApiBtn: 'Buscar API',
    pogoActive: 'PoGo Activo',

    // Damage Calculator
    damageCalcHeader: 'DAMAGE CALCULATOR',
    damageCalcHeaderSub: 'Calculadora exacta de daño y efectividad de ataques en Pokémon GO',
    officialFormula: 'Fórmula Oficial PoGo',
    damageBreakdown: 'Desglose de Daño en HP',
    attackerStats: 'Atacante Stats',
    defender: 'Defensor (Objetivo)',
    attacker: 'Atacante (Pokémon)',
    fastMove: 'Movimiento Rápido',
    chargedMove1: 'Movimiento Cargado 1',
    chargedMove2: '2º Movimiento Cargado',
    unlockCharged2: 'Desbloquear 2º Movimiento Cargado',
    damagePerHit: 'Daño por Golpe',
    rivalLifePercent: 'vida del rival',
    searchAttacker: 'Buscar Pokémon Atacante (Teclea nombre):',
    searchDefender: 'Buscar Pokémon Defensor (Teclea nombre):',
    filterByType: 'Filtrar por Tipo(s):',
    allTypes: 'Todos',
    clearFilters: 'Limpiar Filtros',
    powerLabel: 'Pot',
    baseAtkLabel: 'Atq Base',
    baseDefLabel: 'Def Base',
    baseStaLabel: 'Sal Base',
    offensiveTag: 'OFENSIVO',
    defensiveTag: 'DEFENSIVO',
    defenderLevelLabel: 'Nivel Defensor (1 - 50):',
    localDatabaseNote: 'No está en la lista rápida local.',
    searchPokeApiGlobal: 'Buscar en PokéAPI Global',
    weaknessesTitle: 'Debilidades (Daño Recibido)',
    resistancesTitle: 'Resistencias (Fortalezas Defensivas)',
    activateMega: 'Activar Mega Evolución',
    enableSpecialForm: 'Activar Forma Especial (Mega, Fusionado, Transformado, Origen)',
    selectMegaVariant: 'Seleccionar Variante Mega:',
    selectFormVariant: 'Seleccionar Forma / Variante:',
    levelLabel: 'Nivel (PoGo 1 - 50):',
    ivAtk: 'IV Ataque (0-15):',
    ivDef: 'IV Defensa (0-15):',
    ivHp: 'IV HP (0-15):',
    baseAtk: 'Base Atk',
    baseDef: 'Base Def',
    baseSta: 'Base Sta',
    movesFor: 'Movimientos de',
    superEffective: '¡Súper Eficaz!',
    neutralDamage: 'Daño Neutral',
    notVeryEffective: 'Poco Eficaz',
    immune: 'Sin Efecto / Inmune',
    stab: 'STAB 1.2x',

    // Route Tracker
    routeTrackerHeader: 'ROUTE TRACKER',
    totalDistance: 'Distancia Total',
    estimatedTime: 'Tiempo Estimado',
    routeAlgorithm: 'Algoritmo Ruta',
    optimizeTsp: 'Optimizar (TSP)',
    reoptimizeTsp: 'Re-optimizar (TSP)',
    comparison: 'Comparativa',
    analysis: 'Análisis',
    reset: 'Reiniciar',

    // Raid Team Generator
    raidGenTitle: 'Raid Team Generator',
    raidGenDesc: 'Generador táctico de equipos para Incursiones. Maximiza el daño por segundo (DPS) contra cualquier Jefe de Raid.',
    raidGenHeader: 'RAID TEAM GENERATOR',
    raidGenHeaderSub: 'Genera el equipo ideal de 6 Pokémon y los ataques exactos que maximizan el daño al Jefe de la Incursión',
    selectRaidBoss: 'Seleccionar Jefe de Incursión (Raid Boss):',
    quickSelectBosses: 'Jefes de Raid Populares:',
    recommendedTeamTitle: 'Equipo Recomendado (Top 6 Counters)',
    recommendedTeamSub: 'Calculado para maximizar el DPS y derrotar al Jefe de Incursión lo antes posible',
    optimalMoveset: 'Ataques Óptimos Recomendados',
    estimatedDps: 'DPS Estimado',
    copySearchString: 'Copiar Cadena de Búsqueda para PoGo',
    copiedSearchString: '¡Copiado al Portapapeles!',
    includeMegas: 'Incluir Formas Especiales / Megas',
    attackerLevelLabel: 'Nivel Objetivo de los Atacantes:',
    topCountersTag: 'TOP COUNTERS',
  },
  en: {
    // Hub Menu
    hubTitle: 'POKÉTOOLS HUB',
    hubSubtitle: 'Tactical Pokémon Trainer Center',
    hubTagline: 'Tactical Pokédex',
    toolsReady: '3 Tools ready',
    selectTool: 'Select Your Tool',
    routeTrackerTitle: 'Route Tracker',
    routeTrackerDesc: 'Route optimizer for Pokémon GO powered by TSP (2-Opt) algorithm, official cooldown timer calculation, interactive map, and GPX exporter.',
    openMap: 'Open Map',
    stopsCount: '27 National PokéStops',
    damageCalcTitle: 'Damage Calculator',
    damageCalcDesc: 'Exact damage calculator in Health Points (HP) and life percentage. Evaluates type multipliers (STAB, super effective) with live animated health bar.',
    calcDamage: 'Calculate Damage',
    exactCalc: 'Exact HP & KO Calc',
    upcoming: 'Coming Soon',
    inDevelopment: 'In development for future releases...',
    teamBuilderTitle: 'Raid Team Generator',
    teamBuilderDesc: 'Tactical raid team builder. Calculates top 6 Pokémon and exact movesets to maximize Damage Per Second (DPS) against raid bosses.',
    evaluatorTitle: 'IV & EV Stats Evaluator',
    evaluatorDesc: 'IV and max stats calculator based on nature and EVs to optimize competitive performance.',
    footerTagline: 'Version 2.0 PRO • Built for Pokémon GO trainers and competitive play',

    // Buttons & Actions
    backToHub: 'Hub',
    searchPlaceholder: 'Current',
    searchApiBtn: 'Search API',
    pogoActive: 'PoGo Active',

    // Damage Calculator
    damageCalcHeader: 'DAMAGE CALCULATOR',
    damageCalcHeaderSub: 'Exact damage & type effectiveness calculator for Pokémon GO',
    officialFormula: 'Official PoGo Formula',
    damageBreakdown: 'Damage Breakdown in HP',
    attackerStats: 'Attacker Stats',
    defender: 'Defender (Target)',
    attacker: 'Attacker (Pokémon)',
    fastMove: 'Fast Move',
    chargedMove1: 'Charged Move 1',
    chargedMove2: '2nd Charged Move',
    unlockCharged2: 'Unlock 2nd Charged Move',
    damagePerHit: 'Damage per Hit',
    rivalLifePercent: "rival's HP",
    searchAttacker: 'Search Attacker Pokémon (Type name):',
    searchDefender: 'Search Defender Pokémon (Type name):',
    filterByType: 'Filter by Type(s):',
    allTypes: 'All',
    clearFilters: 'Clear Filters',
    powerLabel: 'Pwr',
    baseAtkLabel: 'Base Atk',
    baseDefLabel: 'Base Def',
    baseStaLabel: 'Base Sta',
    offensiveTag: 'OFFENSIVE',
    defensiveTag: 'DEFENSIVE',
    defenderLevelLabel: 'Defender Level (1 - 50):',
    localDatabaseNote: 'Not in quick local list.',
    searchPokeApiGlobal: 'Search in Global PokéAPI',
    weaknessesTitle: 'Weaknesses (Damage Taken)',
    resistancesTitle: 'Resistances (Defensive Strengths)',
    activateMega: 'Enable Mega Evolution',
    enableSpecialForm: 'Enable Special Form (Mega, Fusion, Crowned, Origin)',
    selectMegaVariant: 'Select Mega Variant:',
    selectFormVariant: 'Select Form / Variant:',
    levelLabel: 'Level (PoGo 1 - 50):',
    ivAtk: 'Attack IV (0-15):',
    ivDef: 'Defense IV (0-15):',
    ivHp: 'HP IV (0-15):',
    baseAtk: 'Base Atk',
    baseDef: 'Base Def',
    baseSta: 'Base Sta',
    movesFor: 'Moves for',
    superEffective: 'Super Effective!',
    neutralDamage: 'Neutral Damage',
    notVeryEffective: 'Not Very Effective',
    immune: 'No Effect / Immune',
    stab: 'STAB 1.2x',

    // Route Tracker
    routeTrackerHeader: 'ROUTE TRACKER',
    totalDistance: 'Total Distance',
    estimatedTime: 'Estimated Time',
    routeAlgorithm: 'Route Algorithm',
    optimizeTsp: 'Optimize (TSP)',
    reoptimizeTsp: 'Re-optimize (TSP)',
    comparison: 'Comparison',
    analysis: 'Analysis',
    reset: 'Reset',

    // Raid Team Generator
    raidGenTitle: 'Raid Team Generator',
    raidGenDesc: 'Tactical raid team builder. Maximizes Damage Per Second (DPS) against any Raid Boss.',
    raidGenHeader: 'RAID TEAM GENERATOR',
    raidGenHeaderSub: 'Generates the optimal 6-Pokémon team and exact movesets that maximize damage to the Raid Boss',
    selectRaidBoss: 'Select Raid Boss:',
    quickSelectBosses: 'Popular Raid Bosses:',
    recommendedTeamTitle: 'Recommended Team (Top 6 Counters)',
    recommendedTeamSub: 'Calculated to maximize DPS and defeat the Raid Boss as fast as possible',
    optimalMoveset: 'Optimal Recommended Moveset',
    estimatedDps: 'Estimated DPS',
    copySearchString: 'Copy Search String for PoGo',
    copiedSearchString: 'Copied to Clipboard!',
    includeMegas: 'Include Special Forms / Megas',
    attackerLevelLabel: 'Target Attacker Level:',
    topCountersTag: 'TOP COUNTERS',
  },
};


interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('poketools_language');
    return saved === 'en' || saved === 'es' ? saved : 'es';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('poketools_language', lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
