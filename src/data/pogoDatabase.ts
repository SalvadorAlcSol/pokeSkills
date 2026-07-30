import { PokemonType } from './pokemonData';
import fullPogoJson from './fullPogoDatabase.json';

export interface PogoMove {
  id: string;
  name: string;
  type: PokemonType;
  power: number;
  energy: number;
  typeCategory: 'fast' | 'charged';
}

export interface SpecialForm {
  id: string;
  name: string;
  category?: 'mega' | 'fusion' | 'transformation' | 'primal' | 'origin' | 'therian' | 'alternate';
  types: PokemonType[];
  baseAttack: number;
  baseDefense: number;
  baseStamina: number;
  spriteUrl: string;
  fastMoves?: PogoMove[];
  chargedMoves?: PogoMove[];
}

export type MegaForm = SpecialForm;

export interface PogoPokemon {
  id: number;
  name: string;
  types: PokemonType[];
  baseAttack: number;
  baseDefense: number;
  baseStamina: number;
  spriteUrl: string;
  fastMoves: PogoMove[];
  chargedMoves: PogoMove[];
  specialForms?: SpecialForm[];
  // Legacy backward compatibility alias
  megaForms?: SpecialForm[];
}

// Pokemon GO Level CPM (CP Multiplier) Table for Levels 1 to 50
export const CPM_TABLE: Record<number, number> = {
  1: 0.094,
  5: 0.29024988,
  10: 0.42250001,
  15: 0.51739396,
  20: 0.59740001,
  25: 0.667934,
  30: 0.7317,
  35: 0.76156384,
  40: 0.7903001,
  41: 0.79535804,
  42: 0.800358,
  43: 0.805309,
  44: 0.810259,
  45: 0.815209,
  46: 0.820159,
  47: 0.825109,
  48: 0.830059,
  49: 0.835009,
  50: 0.8402999,
};

export function getCPM(level: number): number {
  if (CPM_TABLE[level]) return CPM_TABLE[level];
  const lowerLevel = Math.floor(level);
  const upperLevel = Math.ceil(level);
  const lowerCpm = CPM_TABLE[lowerLevel] || 0.7903001;
  const upperCpm = CPM_TABLE[upperLevel] || 0.8402999;
  return lowerCpm + (upperCpm - lowerCpm) * (level - lowerLevel);
}

// PoGo Type Effectiveness Table
export const POGO_TYPE_CHART: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  normal: { rock: 0.625, ghost: 0.390625, steel: 0.625 },
  fire: { fire: 0.625, water: 0.625, grass: 1.6, ice: 1.6, bug: 1.6, rock: 0.625, dragon: 0.625, steel: 1.6 },
  water: { fire: 1.6, water: 0.625, grass: 0.625, ground: 1.6, rock: 1.6, dragon: 0.625 },
  grass: { fire: 0.625, water: 1.6, grass: 0.625, poison: 0.625, ground: 1.6, flying: 0.625, bug: 0.625, rock: 1.6, dragon: 0.625, steel: 0.625 },
  electric: { water: 1.6, grass: 0.625, electric: 0.625, ground: 0.390625, flying: 1.6, dragon: 0.625 },
  ice: { fire: 0.625, water: 0.625, grass: 1.6, ice: 0.625, ground: 1.6, flying: 1.6, dragon: 1.6, steel: 0.625 },
  fighting: { normal: 1.6, ice: 1.6, poison: 0.625, flying: 0.625, psychic: 0.625, bug: 0.625, rock: 1.6, ghost: 0.390625, dark: 1.6, steel: 1.6, fairy: 0.625 },
  poison: { grass: 1.6, poison: 0.625, ground: 0.625, rock: 0.625, ghost: 0.625, steel: 0.390625, fairy: 1.6 },
  ground: { fire: 1.6, grass: 0.625, electric: 1.6, poison: 1.6, flying: 0.390625, bug: 0.625, rock: 1.6, steel: 1.6 },
  flying: { grass: 1.6, electric: 0.625, fighting: 1.6, bug: 1.6, rock: 0.625, steel: 0.625 },
  psychic: { fighting: 1.6, poison: 1.6, psychic: 0.625, dark: 0.390625, steel: 0.625 },
  bug: { fire: 0.625, grass: 1.6, fighting: 0.625, poison: 0.625, flying: 0.625, psychic: 1.6, ghost: 0.625, dark: 1.6, steel: 0.625, fairy: 0.625 },
  rock: { fire: 1.6, ice: 1.6, fighting: 0.625, ground: 0.625, flying: 1.6, bug: 1.6, steel: 0.625 },
  ghost: { normal: 0.390625, psychic: 1.6, ghost: 1.6, dark: 0.625 },
  dragon: { dragon: 1.6, steel: 0.625, fairy: 0.390625 },
  dark: { fighting: 0.625, psychic: 1.6, ghost: 1.6, dark: 0.625, fairy: 0.625 },
  steel: { fire: 0.625, water: 0.625, electric: 0.625, ice: 1.6, rock: 1.6, steel: 0.625, fairy: 1.6 },
  fairy: { fire: 0.625, fighting: 1.6, poison: 0.625, dragon: 1.6, dark: 1.6, steel: 0.625 },
};

// Full PoGo Database with Special Forms (Megas, Fusionados, Transformados, Primales, Formas Origen, Tótems, etc.)
export const POGO_DATABASE: PogoPokemon[] = fullPogoJson as PogoPokemon[];
