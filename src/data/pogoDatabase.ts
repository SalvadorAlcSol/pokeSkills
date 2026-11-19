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

// Pokemon GO Level CPM (CP Multiplier) Table for Levels 1 to 51 (half-level increments)
export const CPM_TABLE: Record<number, number> = {
  1: 0.094,
  1.5: 0.135137432,
  2: 0.16639787,
  2.5: 0.192650919,
  3: 0.21573247,
  3.5: 0.236572661,
  4: 0.25572005,
  4.5: 0.273530381,
  5: 0.29024988,
  5.5: 0.306057377,
  6: 0.3210876,
  6.5: 0.335445036,
  7: 0.34921268,
  7.5: 0.362457751,
  8: 0.37523559,
  8.5: 0.387592406,
  9: 0.39956728,
  9.5: 0.411193551,
  10: 0.42250001,
  10.5: 0.432926419,
  11: 0.44310755,
  11.5: 0.453059958,
  12: 0.46279839,
  12.5: 0.472336083,
  13: 0.48168495,
  13.5: 0.4908558,
  14: 0.49985844,
  14.5: 0.508701765,
  15: 0.51739395,
  15.5: 0.525942511,
  16: 0.53435433,
  16.5: 0.542635767,
  17: 0.55079269,
  17.5: 0.558830576,
  18: 0.56675452,
  18.5: 0.574569153,
  19: 0.58227891,
  19.5: 0.589887917,
  20: 0.59740001,
  20.5: 0.604823665,
  21: 0.61215729,
  21.5: 0.619404122,
  22: 0.62656713,
  22.5: 0.633649143,
  23: 0.64065295,
  23.5: 0.647580967,
  24: 0.65443563,
  24.5: 0.661219252,
  25: 0.667934,
  25.5: 0.674581896,
  26: 0.68116492,
  26.5: 0.687684904,
  27: 0.69414365,
  27.5: 0.70054287,
  28: 0.70688421,
  28.5: 0.713169109,
  29: 0.71939909,
  29.5: 0.725575614,
  30: 0.7317,
  30.5: 0.734741009,
  31: 0.73776948,
  31.5: 0.740785574,
  32: 0.74378943,
  32.5: 0.746781211,
  33: 0.74976104,
  33.5: 0.752729087,
  34: 0.75568551,
  34.5: 0.758630378,
  35: 0.76156384,
  35.5: 0.764486065,
  36: 0.76739717,
  36.5: 0.770297266,
  37: 0.7731865,
  37.5: 0.776064962,
  38: 0.77893275,
  38.5: 0.781790055,
  39: 0.78463697,
  39.5: 0.787473578,
  40: 0.79030001,
  40.5: 0.792803968,
  41: 0.79530001,
  41.5: 0.79780001,
  42: 0.8003,
  42.5: 0.802799995,
  43: 0.8053,
  43.5: 0.8078,
  44: 0.81029999,
  44.5: 0.812799985,
  45: 0.81529999,
  45.5: 0.81779999,
  46: 0.82029999,
  46.5: 0.82279999,
  47: 0.82529999,
  47.5: 0.82779999,
  48: 0.83029999,
  48.5: 0.83279999,
  49: 0.83529999,
  49.5: 0.83779999,
  50: 0.84029999,
  50.5: 0.84279999,
  51: 0.84529999,
};

export function getCPM(level: number): number {
  const clamped = Math.min(51, Math.max(1, Number.isFinite(level) ? level : 40));
  const roundedHalf = Math.round(clamped * 2) / 2;
  if (CPM_TABLE[roundedHalf] !== undefined && Math.abs(clamped - roundedHalf) < 0.001) {
    return CPM_TABLE[roundedHalf];
  }
  const lowerLevel = Math.floor(clamped * 2) / 2;
  const upperLevel = Math.min(51, lowerLevel + 0.5);
  const lowerCpm = CPM_TABLE[lowerLevel] ?? CPM_TABLE[40];
  const upperCpm = CPM_TABLE[upperLevel] ?? lowerCpm;
  const frac = (clamped - lowerLevel) / 0.5;
  return lowerCpm + (upperCpm - lowerCpm) * frac;
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
