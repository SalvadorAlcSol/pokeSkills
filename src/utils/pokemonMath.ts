import { PokemonType } from '../data/pokemonData';
import { getCPM, POGO_TYPE_CHART, PogoMove } from '../data/pogoDatabase';

export interface PogoDamageResult {
  moveName: string;
  moveType: PokemonType;
  moveCategory: 'fast' | 'charged';
  damageHp: number;
  typeMultiplier: number;
  isStab: boolean;
  defenderMaxHp: number;
  damagePercent: number;
}

/**
 * Calculates Pokemon GO Type Effectiveness Multiplier
 */
export function getPogoTypeEffectiveness(
  moveType: PokemonType,
  defenderTypes: PokemonType[]
): number {
  let multiplier = 1.0;
  const moveChart = POGO_TYPE_CHART[moveType] || {};

  for (const defType of defenderTypes) {
    if (defType in moveChart) {
      multiplier *= moveChart[defType]!;
    }
  }

  return Number(multiplier.toFixed(4));
}

export interface TypeEffectivenessDetail {
  type: PokemonType;
  multiplier: number;
}

/**
 * Calculates Weaknesses (> 1.0x) and Resistances (< 1.0x) for a Pokemon given its type(s)
 */
export function getPokemonWeaknessesAndResistances(defenderTypes: PokemonType[]) {
  const ALL_TYPES: PokemonType[] = [
    'normal',
    'fire',
    'water',
    'grass',
    'electric',
    'ice',
    'fighting',
    'poison',
    'ground',
    'flying',
    'psychic',
    'bug',
    'rock',
    'ghost',
    'dragon',
    'dark',
    'steel',
    'fairy',
  ];

  const weaknesses: TypeEffectivenessDetail[] = [];
  const resistances: TypeEffectivenessDetail[] = [];

  for (const atkType of ALL_TYPES) {
    const mult = getPogoTypeEffectiveness(atkType, defenderTypes);
    if (mult > 1.05) {
      weaknesses.push({ type: atkType, multiplier: mult });
    } else if (mult < 0.95) {
      resistances.push({ type: atkType, multiplier: mult });
    }
  }

  // Sort weaknesses descending (e.g., 2.56x before 1.6x)
  weaknesses.sort((a, b) => b.multiplier - a.multiplier);
  // Sort resistances ascending (e.g., 0.39x before 0.625x)
  resistances.sort((a, b) => a.multiplier - b.multiplier);

  return { weaknesses, resistances };
}

/**
 * Calculates Pokemon GO Final Stats at a specific level (1-50) & IVs (0-15)
 */
export function calculatePogoStats(
  baseAttack: number,
  baseDefense: number,
  baseStamina: number,
  level: number,
  ivAtk: number = 15,
  ivDef: number = 15,
  ivHp: number = 15
) {
  const cpm = getCPM(level);
  const finalAttack = (baseAttack + ivAtk) * cpm;
  const finalDefense = (baseDefense + ivDef) * cpm;
  const finalHp = Math.max(10, Math.floor((baseStamina + ivHp) * cpm));

  return {
    cpm,
    finalAttack,
    finalDefense,
    finalHp,
  };
}

/**
 * Calculates exact Pokemon GO Combat Power (CP) for a Pokemon given base stats, level, and IVs.
 * Formula: Math.max(10, Math.floor((BaseAtk + IV_Atk) * Math.sqrt(BaseDef + IV_Def) * Math.sqrt(BaseSta + IV_Hp) * (CPM^2) / 10))
 */
export function calculatePogoPokemonCp(
  baseAttack: number,
  baseDefense: number,
  baseStamina: number,
  level: number,
  ivAtk: number = 15,
  ivDef: number = 15,
  ivHp: number = 15
): number {
  const cpm = getCPM(level);
  const atk = baseAttack + ivAtk;
  const def = Math.sqrt(baseDefense + ivDef);
  const sta = Math.sqrt(baseStamina + ivHp);
  const cp = Math.floor((atk * def * sta * (cpm * cpm)) / 10);
  return Math.max(10, cp);
}

/**
 * Calculates exact Pokemon GO Damage per move
 * Formula: floor(0.5 * Power * (AttackerStat / DefenderStat) * STAB * TypeMultiplier) + 1
 */
export function calculatePogoMoveDamage(params: {
  move: PogoMove;
  attackerTypes: PokemonType[];
  attackerStat: number; // Final Attack with CPM
  defenderTypes: PokemonType[];
  defenderStat: number; // Final Defense with CPM
  defenderMaxHp: number;
}): PogoDamageResult {
  const {
    move,
    attackerTypes,
    attackerStat,
    defenderTypes,
    defenderStat,
    defenderMaxHp,
  } = params;

  if (move.power <= 0 || defenderStat <= 0) {
    return {
      moveName: move.name,
      moveType: move.type,
      moveCategory: move.typeCategory,
      damageHp: 0,
      typeMultiplier: 1.0,
      isStab: false,
      defenderMaxHp,
      damagePercent: 0,
    };
  }

  // STAB in PoGo is 1.2
  const isStab = attackerTypes.includes(move.type);
  const stabMultiplier = isStab ? 1.2 : 1.0;

  // Type Multiplier in PoGo
  const typeMultiplier = getPogoTypeEffectiveness(move.type, defenderTypes);

  // Exact PoGo Damage Formula
  const damageHp = Math.max(
    1,
    Math.floor(
      0.5 * move.power * (attackerStat / defenderStat) * stabMultiplier * typeMultiplier
    ) + 1
  );

  const damagePercent = Number(((damageHp / defenderMaxHp) * 100).toFixed(1));

  return {
    moveName: move.name,
    moveType: move.type,
    moveCategory: move.typeCategory,
    damageHp,
    typeMultiplier,
    isStab,
    defenderMaxHp,
    damagePercent,
  };
}

export type RaidTier = '1' | '3' | '5' | 'mega' | 'primal';

export const RAID_TIER_HP: Record<RaidTier, number> = {
  '1': 600,
  '3': 3600,
  '5': 15000,
  'mega': 9000,
  'primal': 22500,
};

/**
 * Calculates Official Pokemon GO Raid Boss Combat Power (CP) & HP
 * Formula: floor( (BaseAtk + 15) * sqrt(BaseDef + 15) * sqrt(RaidHP) / 10 )
 */
export function calculateRaidBossCp(
  baseAttack: number,
  baseDefense: number,
  tier: RaidTier = '5'
): { raidCp: number; raidHp: number } {
  const raidHp = RAID_TIER_HP[tier] || 15000;
  const atkFactor = baseAttack + 15;
  const defFactor = Math.sqrt(baseDefense + 15);
  const hpFactor = Math.sqrt(raidHp);

  const raidCp = Math.floor((atkFactor * defFactor * hpFactor) / 10);
  return { raidCp, raidHp };
}

