import { PokemonType } from '../data/pokemonData';
import { POGO_DATABASE, PogoMove } from '../data/pogoDatabase';
import { getSpanishMoveName } from './pogoMoveTranslator';

export interface FastMoveDetail {
  id: string;
  name: string;
  spanishName: string;
  type: PokemonType;
  power: number;
  energy: number; // energy gained
  duration: number; // in seconds (estimated 0.5s - 1.5s)
  dps: number;
  eps: number; // energy per second
  isStab: boolean;
}

export interface ChargedMoveDetail {
  id: string;
  name: string;
  spanishName: string;
  type: PokemonType;
  power: number;
  energyCost: number; // e.g. 33, 50, 100
  duration: number; // in seconds (estimated 1.5s - 3.5s)
  dps: number;
  bars: number; // 1, 2, or 3 bars
  isStab: boolean;
  isLegacy?: boolean;
}

export interface MovesetCombo {
  rank: number;
  fastMove: FastMoveDetail;
  chargedMove: ChargedMoveDetail;
  dps: number;
  tdo: number;
  score: number; // % relative to rank #1
  roleCategory: string; // e.g. "Dragon Attacker", "Flying Attacker"
}

export interface BestMovesetByRole {
  roleName: string;
  type: PokemonType;
  fastMove: FastMoveDetail;
  chargedMove: ChargedMoveDetail;
  dps: number;
  tdo: number;
  tier: 'S Tier' | 'A Tier' | 'B Tier';
}

export interface MovesetAnalysisResult {
  fastMoves: FastMoveDetail[];
  chargedMoves: ChargedMoveDetail[];
  combos: MovesetCombo[];
  bestByRoles: BestMovesetByRole[];
}

// Estimated durations and legacy markers for PoGo moves
const MOVE_SPECS: Record<string, { duration: number; isLegacy?: boolean }> = {
  'Dragon Tail': { duration: 1.1 },
  'Air Slash': { duration: 1.2 },
  'Mud Shot': { duration: 0.6 },
  'Lock-On': { duration: 0.5 },
  'Counter': { duration: 0.7 },
  'Shadow Claw': { duration: 0.7 },
  'Waterfall': { duration: 1.2 },
  'Fire Spin': { duration: 1.1 },
  'Bullet Punch': { duration: 0.9 },
  'Vine Whip': { duration: 0.6 },
  'Dragon Ascent': { duration: 3.5 },
  'Breaking Swipe': { duration: 1.9, isLegacy: true },
  'Hydro Cannon': { duration: 1.9, isLegacy: true },
  'Blast Burn': { duration: 3.3, isLegacy: true },
  'Frenzy Plant': { duration: 2.6, isLegacy: true },
  'Meteor Mash': { duration: 2.6, isLegacy: true },
  'Psystrike': { duration: 2.3, isLegacy: true },
  'Precipice Blades': { duration: 1.7, isLegacy: true },
  'Origin Pulse': { duration: 1.7, isLegacy: true },
  'Outrage': { duration: 3.9 },
  'Hurricane': { duration: 2.7, isLegacy: true },
  'Earthquake': { duration: 3.6 },
  'Solar Beam': { duration: 4.9 },
  'Thunderbolt': { duration: 2.5 },
  'Ice Beam': { duration: 3.3 },
  'Shadow Ball': { duration: 3.0 },
};

export function calculatePokemonMovesetAnalysis(
  pokemonName: string,
  rawTypes: PokemonType[] = [],
  baseAttack: number,
  baseDefense: number,
  baseStamina: number,
  customFastMoves?: PogoMove[],
  customChargedMoves?: PogoMove[]
): MovesetAnalysisResult {
  const pokemonTypes: PokemonType[] =
    rawTypes && Array.isArray(rawTypes) && rawTypes.length > 0 ? rawTypes : ['normal'];

  const normalizedSearch = (pokemonName || '').toLowerCase().split(' ')[0];
  const dbMatch = POGO_DATABASE.find((p) => p.name.toLowerCase().includes(normalizedSearch));

  const rawFastMoves: PogoMove[] =
    customFastMoves && customFastMoves.length > 0
      ? customFastMoves
      : dbMatch?.fastMoves || [
          { id: 'fast_1', name: 'Ataque Rápido', type: pokemonTypes[0] || 'normal', power: 10, energy: 9, typeCategory: 'fast' }
        ];

  const rawChargedMoves: PogoMove[] =
    customChargedMoves && customChargedMoves.length > 0
      ? customChargedMoves
      : dbMatch?.chargedMoves || [
          { id: 'charged_1', name: 'Ataque Cargado', type: pokemonTypes[0] || 'normal', power: 90, energy: 50, typeCategory: 'charged' }
        ];

  // 1. Process Fast Moves
  const processedFastMoves: FastMoveDetail[] = rawFastMoves.map((m) => {
    const spec = MOVE_SPECS[m.name] || { duration: 1.0 };
    const isStab = pokemonTypes.includes(m.type);
    const stabMultiplier = isStab ? 1.2 : 1.0;
    const duration = spec.duration;

    const dps = Number(((m.power * stabMultiplier) / duration).toFixed(2));
    const eps = Number((m.energy / duration).toFixed(2));

    return {
      id: m.id || m.name,
      name: m.name,
      spanishName: getSpanishMoveName(m.name) || m.name,
      type: m.type,
      power: m.power,
      energy: m.energy,
      duration,
      dps,
      eps,
      isStab
    };
  });

  // 2. Process Charged Moves
  const processedChargedMoves: ChargedMoveDetail[] = rawChargedMoves.map((m) => {
    const spec = MOVE_SPECS[m.name] || { duration: 2.5 };
    const isStab = pokemonTypes.includes(m.type);
    const stabMultiplier = isStab ? 1.2 : 1.0;
    const duration = spec.duration;
    const energyCost = Math.abs(m.energy) || 50;
    const dps = Number(((m.power * stabMultiplier) / duration).toFixed(2));

    let bars = 2;
    if (energyCost <= 35) bars = 3;
    else if (energyCost >= 80) bars = 1;

    return {
      id: m.id || m.name,
      name: m.name,
      spanishName: getSpanishMoveName(m.name) || m.name,
      type: m.type,
      power: m.power,
      energyCost,
      duration,
      dps,
      bars,
      isStab,
      isLegacy: Boolean(spec.isLegacy)
    };
  });

  // 3. Process Combinations
  const rawCombos: Array<{ fast: FastMoveDetail; charged: ChargedMoveDetail; rawDps: number; rawTdo: number }> = [];

  for (const fast of processedFastMoves) {
    for (const charged of processedChargedMoves) {
      // Calculate Weave DPS
      const fastEnergyPerSec = fast.eps || 8;
      const energyNeeded = charged.energyCost || 50;
      const nFastNeeded = Math.ceil(energyNeeded / Math.max(1, fast.energy));
      
      const cycleTime = nFastNeeded * fast.duration + charged.duration;
      const fastPowerTotal = nFastNeeded * fast.power * (fast.isStab ? 1.2 : 1.0);
      const chargedPowerTotal = charged.power * (charged.isStab ? 1.2 : 1.0);
      
      const rawCycleDamage = fastPowerTotal + chargedPowerTotal;
      const comboDps = Number(((rawCycleDamage / cycleTime) * (baseAttack / 120)).toFixed(2));

      // TDO = Combo DPS * Tankiness Factor
      const tankiness = (baseDefense * baseStamina) / 100;
      const comboTdo = Number((comboDps * tankiness * 0.35).toFixed(1));

      rawCombos.push({
        fast,
        charged,
        rawDps: comboDps,
        rawTdo: comboTdo
      });
    }
  }

  // Sort combos descending by DPS
  rawCombos.sort((a, b) => b.rawDps - a.rawDps || b.rawTdo - a.rawTdo);

  const topDps = rawCombos.length > 0 ? rawCombos[0].rawDps : 1;

  const combos: MovesetCombo[] = rawCombos.map((item, index) => {
    const score = Number(((item.rawDps / topDps) * 100).toFixed(2));
    const roleCategory = `${item.charged.type.toUpperCase()} Attacker`;

    return {
      rank: index + 1,
      fastMove: item.fast,
      chargedMove: item.charged,
      dps: item.rawDps,
      tdo: item.rawTdo,
      score,
      roleCategory
    };
  });

  // 4. Identify Best Moveset per Primary/Secondary Types
  const bestByRoles: BestMovesetByRole[] = [];
  const processedRoleTypes = new Set<PokemonType>();

  for (const combo of combos) {
    const cType = combo.chargedMove.type;
    if (!processedRoleTypes.has(cType)) {
      processedRoleTypes.add(cType);
      const roleName = `Mejor Moveset Tipo ${getSpanishMoveName(cType) || cType.toUpperCase()}`;

      bestByRoles.push({
        roleName,
        type: cType,
        fastMove: combo.fastMove,
        chargedMove: combo.chargedMove,
        dps: combo.dps,
        tdo: combo.tdo,
        tier: combo.rank === 1 ? 'S Tier' : combo.rank <= 3 ? 'A Tier' : 'B Tier'
      });
    }
  }

  return {
    fastMoves: processedFastMoves,
    chargedMoves: processedChargedMoves,
    combos,
    bestByRoles
  };
}
