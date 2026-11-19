import { PokemonType } from '../data/pokemonData';
import { getCPM, POGO_DATABASE, PogoMove, PogoPokemon, SpecialForm } from '../data/pogoDatabase';
import { UserPokemon } from '../types/UserInventory';
import { getPogoTypeEffectiveness } from './pokemonMath';
import { getSpanishMoveName } from './pogoMoveTranslator';

export type AdventureEffectType = 'none' | 'eternatus' | 'zacian' | 'zamazenta';
export type MaxMoveLevel = 1 | 2 | 3;
export type MaxSupportLevel = 0 | 1 | 2 | 3;
export type MaxBossTier = 1 | 2 | 3 | 4 | 5 | 6;
export type HelperTier = 0 | 1 | 2 | 3 | 4;
export type FriendshipTier = 'none' | 'good' | 'great' | 'ultra' | 'best';
export type MaxUnitRole = 'attacker' | 'charger' | 'hybrid';

export interface MaxModifiersConfig {
  adventureEffect: AdventureEffectType;
  maxMushroom: boolean;
  helperTier: HelperTier;
  weatherBoost: boolean;
  friendshipTier: FriendshipTier;
}

export interface MaxMoveSpec {
  id: string;
  nameEn: string;
  nameEs: string;
  type: PokemonType;
}

export interface GMaxSpeciesSpec extends MaxMoveSpec {
  formKey?: string; // e.g. 'single_strike' vs 'rapid_strike'
  labelEs: string;
  labelEn: string;
  overrideTypes?: PokemonType[];
}

export interface MaxBossTierSpec {
  tier: MaxBossTier;
  labelEs: string;
  labelEn: string;
  defaultHp: number;
  defaultCpm: number;
  recommendedPlayers: string;
}

export const MAX_BOSS_TIERS: Record<MaxBossTier, MaxBossTierSpec> = {
  1: {
    tier: 1,
    labelEs: '1★ Dinamax',
    labelEn: '1★ Dynamax',
    defaultHp: 1700,
    defaultCpm: 0.15,
    recommendedPlayers: '1',
  },
  2: {
    tier: 2,
    labelEs: '2★ Dinamax',
    labelEn: '2★ Dynamax',
    defaultHp: 5000,
    defaultCpm: 0.38,
    recommendedPlayers: '1-2',
  },
  3: {
    tier: 3,
    labelEs: '3★ Dinamax',
    labelEn: '3★ Dynamax',
    defaultHp: 10000,
    defaultCpm: 0.50,
    recommendedPlayers: '1-3',
  },
  4: {
    tier: 4,
    labelEs: '4★ Dinamax',
    labelEn: '4★ Dynamax',
    defaultHp: 20000,
    defaultCpm: 0.65,
    recommendedPlayers: '2-4',
  },
  5: {
    tier: 5,
    labelEs: '5★ Legendario Max',
    labelEn: '5★ Max Legendary',
    defaultHp: 32000,
    defaultCpm: 0.75,
    recommendedPlayers: '3-4',
  },
  6: {
    tier: 6,
    labelEs: '6★ Gigamax / Especial',
    labelEn: '6★ Gigantamax / Special',
    defaultHp: 80000,
    defaultCpm: 0.85,
    recommendedPlayers: '8-40',
  },
};

export const HELPER_BONUS_TABLE: Record<
  HelperTier,
  { multiplier: number; bonusPct: number; labelEs: string; labelEn: string }
> = {
  0: { multiplier: 1.0, bonusPct: 0, labelEs: '0 Ayudantes (+0%)', labelEn: '0 Helpers (+0%)' },
  1: { multiplier: 1.1, bonusPct: 10, labelEs: '1 Guante / 1 Poke (+10%)', labelEn: '1 Glove / 1 Helper (+10%)' },
  2: { multiplier: 1.15, bonusPct: 15, labelEs: '2 Guantes / 2-3 Pokes (+15%)', labelEn: '2 Gloves / 2-3 Helpers (+15%)' },
  3: { multiplier: 1.188, bonusPct: 18.8, labelEs: '3 Guantes / 4-14 Pokes (+18.8%)', labelEn: '3 Gloves / 4-14 Helpers (+18.8%)' },
  4: { multiplier: 1.2, bonusPct: 20, labelEs: '4 Guantes / 15+ Pokes (+20%)', labelEn: '4 Gloves / 15+ Helpers (+20%)' },
};

export const FRIENDSHIP_BONUS_TABLE: Record<
  FriendshipTier,
  { multiplier: number; labelEs: string; labelEn: string }
> = {
  none: { multiplier: 1.0, labelEs: 'Sin amistad (1.00x)', labelEn: 'No Friendship (1.00x)' },
  good: { multiplier: 1.03, labelEs: 'Buena Amistad (+3%)', labelEn: 'Good Friend (+3%)' },
  great: { multiplier: 1.05, labelEs: 'Gran Amistad (+5%)', labelEn: 'Great Friend (+5%)' },
  ultra: { multiplier: 1.07, labelEs: 'Ultra Amistad (+7%)', labelEn: 'Ultra Friend (+7%)' },
  best: { multiplier: 1.1, labelEs: 'Mejor Amistad (+10%)', labelEn: 'Best Friend (+10%)' },
};

// Official 18 Standard Dynamax Max Moves
export const STANDARD_DMAX_MOVES: Record<PokemonType, MaxMoveSpec> = {
  normal: { id: 'max_strike', nameEn: 'Max Strike', nameEs: 'Maxiataque', type: 'normal' },
  fire: { id: 'max_flare', nameEn: 'Max Flare', nameEs: 'Maxignición', type: 'fire' },
  water: { id: 'max_geyser', nameEn: 'Max Geyser', nameEs: 'Maxichorro', type: 'water' },
  grass: { id: 'max_overgrowth', nameEn: 'Max Overgrowth', nameEs: 'Maxiflora', type: 'grass' },
  electric: { id: 'max_lightning', nameEn: 'Max Lightning', nameEs: 'Maxitrueno', type: 'electric' },
  ice: { id: 'max_hailstorm', nameEn: 'Max Hailstorm', nameEs: 'Maxihelada', type: 'ice' },
  fighting: { id: 'max_knuckle', nameEn: 'Max Knuckle', nameEs: 'Maxipuño', type: 'fighting' },
  poison: { id: 'max_ooze', nameEn: 'Max Ooze', nameEs: 'Maxiácido', type: 'poison' },
  ground: { id: 'max_quake', nameEn: 'Max Quake', nameEs: 'Maxitemblor', type: 'ground' },
  flying: { id: 'max_airstream', nameEn: 'Max Airstream', nameEs: 'Maxiciclón', type: 'flying' },
  psychic: { id: 'max_mindstorm', nameEn: 'Max Mindstorm', nameEs: 'Maxionda', type: 'psychic' },
  bug: { id: 'max_flutterby', nameEn: 'Max Flutterby', nameEs: 'Maxinsecto', type: 'bug' },
  rock: { id: 'max_rockfall', nameEn: 'Max Rockfall', nameEs: 'Maxilito', type: 'rock' },
  ghost: { id: 'max_phantasm', nameEn: 'Max Phantasm', nameEs: 'Maxiespectro', type: 'ghost' },
  dragon: { id: 'max_wyrmwind', nameEn: 'Max Wyrmwind', nameEs: 'Maxidraco', type: 'dragon' },
  dark: { id: 'max_darkness', nameEn: 'Max Darkness', nameEs: 'Maxisombra', type: 'dark' },
  steel: { id: 'max_steelspike', nameEn: 'Max Steelspike', nameEs: 'Maximetal', type: 'steel' },
  fairy: { id: 'max_starfall', nameEn: 'Max Starfall', nameEs: 'Maxiestela', type: 'fairy' },
};

// All 32 Gigantamax Pokémon species (33 G-Max moves including both Urshifu styles)
export const GIGANTAMAX_SPECIES: Record<number, GMaxSpeciesSpec[]> = {
  3: [{ id: 'gmax_vine_lash', nameEn: 'G-Max Vine Lash', nameEs: 'Gigalianas', type: 'grass', labelEs: 'Venusaur Gigamax', labelEn: 'Gigantamax Venusaur' }],
  6: [{ id: 'gmax_wildfire', nameEn: 'G-Max Wildfire', nameEs: 'Gigallamarada', type: 'fire', labelEs: 'Charizard Gigamax', labelEn: 'Gigantamax Charizard' }],
  9: [{ id: 'gmax_cannonade', nameEn: 'G-Max Cannonade', nameEs: 'Gigacañonazo', type: 'water', labelEs: 'Blastoise Gigamax', labelEn: 'Gigantamax Blastoise' }],
  12: [{ id: 'gmax_befuddle', nameEn: 'G-Max Befuddle', nameEs: 'Gigaestupor', type: 'bug', labelEs: 'Butterfree Gigamax', labelEn: 'Gigantamax Butterfree' }],
  25: [{ id: 'gmax_volt_crash', nameEn: 'G-Max Volt Crash', nameEs: 'Gigatrueno', type: 'electric', labelEs: 'Pikachu Gigamax', labelEn: 'Gigantamax Pikachu' }],
  52: [{ id: 'gmax_gold_rush', nameEn: 'G-Max Gold Rush', nameEs: 'Gigamonedas', type: 'normal', labelEs: 'Meowth Gigamax', labelEn: 'Gigantamax Meowth' }],
  68: [{ id: 'gmax_chi_strike', nameEn: 'G-Max Chi Strike', nameEs: 'Gigapuñición', type: 'fighting', labelEs: 'Machamp Gigamax', labelEn: 'Gigantamax Machamp' }],
  94: [{ id: 'gmax_terror', nameEn: 'G-Max Terror', nameEs: 'Gigaaparición', type: 'ghost', labelEs: 'Gengar Gigamax', labelEn: 'Gigantamax Gengar' }],
  99: [{ id: 'gmax_foam_burst', nameEn: 'G-Max Foam Burst', nameEs: 'Gigaespuma', type: 'water', labelEs: 'Kingler Gigamax', labelEn: 'Gigantamax Kingler' }],
  131: [{ id: 'gmax_resonance', nameEn: 'G-Max Resonance', nameEs: 'Gigamelodía', type: 'ice', labelEs: 'Lapras Gigamax', labelEn: 'Gigantamax Lapras' }],
  133: [{ id: 'gmax_cuddle', nameEn: 'G-Max Cuddle', nameEs: 'Gigaternura', type: 'normal', labelEs: 'Eevee Gigamax', labelEn: 'Gigantamax Eevee' }],
  143: [{ id: 'gmax_replenish', nameEn: 'G-Max Replenish', nameEs: 'Gigarreciclaje', type: 'normal', labelEs: 'Snorlax Gigamax', labelEn: 'Gigantamax Snorlax' }],
  569: [{ id: 'gmax_malodor', nameEn: 'G-Max Malodor', nameEs: 'Gigacorrosión', type: 'poison', labelEs: 'Garbodor Gigamax', labelEn: 'Gigantamax Garbodor' }],
  809: [{ id: 'gmax_meltdown', nameEn: 'G-Max Meltdown', nameEs: 'Gigafusión', type: 'steel', labelEs: 'Melmetal Gigamax', labelEn: 'Gigantamax Melmetal' }],
  812: [{ id: 'gmax_drum_solo', nameEn: 'G-Max Drum Solo', nameEs: 'Gigarredoble', type: 'grass', labelEs: 'Rillaboom Gigamax', labelEn: 'Gigantamax Rillaboom' }],
  815: [{ id: 'gmax_fireball', nameEn: 'G-Max Fireball', nameEs: 'Gigabala Ígnea', type: 'fire', labelEs: 'Cinderace Gigamax', labelEn: 'Gigantamax Cinderace' }],
  818: [{ id: 'gmax_hydrosnipe', nameEn: 'G-Max Hydrosnipe', nameEs: 'Gigadisparo', type: 'water', labelEs: 'Inteleon Gigamax', labelEn: 'Gigantamax Inteleon' }],
  823: [{ id: 'gmax_wind_rage', nameEn: 'G-Max Wind Rage', nameEs: 'Gigahuracán', type: 'flying', labelEs: 'Corviknight Gigamax', labelEn: 'Gigantamax Corviknight' }],
  826: [{ id: 'gmax_gravitas', nameEn: 'G-Max Gravitas', nameEs: 'Gigagravedad', type: 'psychic', labelEs: 'Orbeetle Gigamax', labelEn: 'Gigantamax Orbeetle' }],
  834: [{ id: 'gmax_stonesurge', nameEn: 'G-Max Stonesurge', nameEs: 'Gigalitofagia', type: 'water', labelEs: 'Drednaw Gigamax', labelEn: 'Gigantamax Drednaw' }],
  839: [{ id: 'gmax_volcalith', nameEn: 'G-Max Volcalith', nameEs: 'Gigarroca Ígnea', type: 'rock', labelEs: 'Coalossal Gigamax', labelEn: 'Gigantamax Coalossal' }],
  841: [{ id: 'gmax_tartness', nameEn: 'G-Max Tartness', nameEs: 'Gigaacidez', type: 'grass', labelEs: 'Flapple Gigamax', labelEn: 'Gigantamax Flapple' }],
  842: [{ id: 'gmax_sweetness', nameEn: 'G-Max Sweetness', nameEs: 'Gigaalmíbar', type: 'grass', labelEs: 'Appletun Gigamax', labelEn: 'Gigantamax Appletun' }],
  844: [{ id: 'gmax_sandblast', nameEn: 'G-Max Sandblast', nameEs: 'Gigapolvareda', type: 'ground', labelEs: 'Sandaconda Gigamax', labelEn: 'Gigantamax Sandaconda' }],
  849: [{ id: 'gmax_stun_shock', nameEn: 'G-Max Stun Shock', nameEs: 'Gigadescarga', type: 'electric', labelEs: 'Toxtricity Gigamax', labelEn: 'Gigantamax Toxtricity' }],
  851: [{ id: 'gmax_centiferno', nameEn: 'G-Max Centiferno', nameEs: 'Gigacienfuegos', type: 'fire', labelEs: 'Centiskorch Gigamax', labelEn: 'Gigantamax Centiskorch' }],
  858: [{ id: 'gmax_smite', nameEn: 'G-Max Smite', nameEs: 'Gigacastigo', type: 'fairy', labelEs: 'Hatterene Gigamax', labelEn: 'Gigantamax Hatterene' }],
  861: [{ id: 'gmax_snooze', nameEn: 'G-Max Snooze', nameEs: 'Gigasopor', type: 'dark', labelEs: 'Grimmsnarl Gigamax', labelEn: 'Gigantamax Grimmsnarl' }],
  869: [{ id: 'gmax_finale', nameEn: 'G-Max Finale', nameEs: 'Gigacolofón', type: 'fairy', labelEs: 'Alcremie Gigamax', labelEn: 'Gigantamax Alcremie' }],
  879: [{ id: 'gmax_steelsurge', nameEn: 'G-Max Steelsurge', nameEs: 'Gigatrampa Acero', type: 'steel', labelEs: 'Copperajah Gigamax', labelEn: 'Gigantamax Copperajah' }],
  884: [{ id: 'gmax_depletion', nameEn: 'G-Max Depletion', nameEs: 'Gigadesgaste', type: 'dragon', labelEs: 'Duraludon Gigamax', labelEn: 'Gigantamax Duraludon' }],
  892: [
    {
      id: 'gmax_rapid_flow',
      formKey: 'rapid_strike',
      nameEn: 'G-Max Rapid Flow',
      nameEs: 'Gigagolpe Fluido',
      type: 'water',
      labelEs: 'Urshifu Fluido Gigamax',
      labelEn: 'G-Max Urshifu (Rapid Strike)',
      overrideTypes: ['fighting', 'water'],
    },
    {
      id: 'gmax_one_blow',
      formKey: 'single_strike',
      nameEn: 'G-Max One Blow',
      nameEs: 'Gigagolpe Brusco',
      type: 'dark',
      labelEs: 'Urshifu Brusco Gigamax',
      labelEn: 'G-Max Urshifu (Single Strike)',
      overrideTypes: ['fighting', 'dark'],
    },
  ],
};

// Official Pokémon GO Max Battle eligible roster (Dynamax, Gigantamax & Special Crowned/Eternatus)
export const OFFICIAL_MAX_ELIGIBLE_IDS = new Set<number>([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 17, 18, 25, 37, 38, 52, 53, 63, 64, 65,
  66, 67, 68, 90, 91, 92, 93, 94, 98, 99, 113, 130, 131, 133, 134, 135, 136, 138, 139,
  140, 141, 143, 144, 145, 146, 196, 197, 213, 242, 243, 244, 245, 246, 247, 248, 249, 250,
  302, 303, 304, 305, 306, 374, 375, 376, 380, 381, 443, 444, 445, 470, 471, 519, 520, 521,
  529, 530, 554, 555, 568, 569, 615, 622, 623, 635, 700, 764, 780, 808, 809, 810, 811, 812,
  813, 814, 815, 816, 817, 818, 819, 820, 821, 822, 823, 824, 825, 826, 831, 832, 833, 834,
  837, 838, 839, 840, 841, 842, 843, 844, 848, 849, 850, 851, 856, 857, 858, 859, 860, 861,
  868, 869, 870, 878, 879, 884, 885, 886, 887, 888, 889, 890, 891, 892,
]);

// Accurate PvE Fast Move Durations (seconds)
export const FAST_MOVE_DURATIONS: Record<string, number> = {
  // 0.5s moves (Max Meter Meta)
  'Bite': 0.5,
  'Bug Bite': 0.5,
  'Cut': 0.5,
  'Dragon Breath': 0.5,
  'Fury Cutter': 0.5,
  'Leafage': 0.5,
  'Lick': 0.5,
  'Lock On': 0.5,
  'Lock-On': 0.5,
  'Low Kick': 0.5,
  'Metal Claw': 0.5,
  'Mud Shot': 0.5,
  'Placaje (Tackle)': 0.5,
  'Poison Sting': 0.5,
  'Pound': 0.5,
  'Psycho Cut': 0.5,
  'Psywave': 0.5,
  'Sand Attack': 0.5,
  'Scratch': 0.5,
  'Shadow Claw': 0.5,
  'Spark': 0.5,
  'Sucker Punch': 0.5,
  'Tackle': 0.5,
  'Thunder Shock': 0.5,
  'Vine Whip': 0.5,
  'Water Gun': 0.5,

  // 1.0s moves
  'Acid': 1.0,
  'Air Slash': 1.0,
  'Astonish': 1.0,
  'Bubble': 1.0,
  'Bullet Punch': 1.0,
  'Bullet Seed': 1.0,
  'Charge Beam': 1.0,
  'Counter': 1.0,
  'Double Kick': 1.0,
  'Dragon Tail': 1.0,
  'Ember': 1.0,
  'Extrasensory': 1.0,
  'Fairy Wind': 1.0,
  'Feint Attack': 1.0,
  'Fire Fang': 1.0,
  'Fire Spin': 1.0,
  'Force Palm': 1.0,
  'Frost Breath': 1.0,
  'Geomancy': 1.0,
  'Hex': 1.0,
  'Ice Fang': 1.0,
  'Ice Shard': 1.0,
  'Infestation': 1.0,
  'Iron Tail': 1.0,
  'Karate Chop': 1.0,
  'Magical Leaf': 1.0,
  'Peck': 1.0,
  'Poison Jab': 1.0,
  'Powder Snow': 1.0,
  'Present': 1.0,
  'Quick Attack': 1.0,
  'Razor Leaf': 1.0,
  'Rock Throw': 1.0,
  'Smack Down': 1.0,
  'Snarl': 1.0,
  'Steel Wing': 1.0,
  'Take Down': 1.0,
  'Thunder Fang': 1.0,
  'Water Shuriken': 1.0,
  'Waterfall': 1.0,
  'Wing Attack': 1.0,
  'Zen Headbutt': 1.0,

  // 1.5s moves
  'Charm': 1.5,
  'Confusion': 1.5,
  'Hidden Power': 1.5,
  'Mud Slap': 1.5,
  'Rock Smash': 1.5,
  'Rollout': 1.5,
  'Splash': 1.5,
  'Struggle Bug': 1.5,
  'Volt Switch': 1.5,
  'Yawn': 1.5,

  // 2.0s+ moves
  'Gust': 2.0,
  'Transform': 2.0,
  'Incinerate': 2.5,
};

export function getFastMoveDuration(moveName: string): number {
  return FAST_MOVE_DURATIONS[moveName] ?? 1.0;
}

export function isHalfSecondFastMove(moveName: string): boolean {
  return getFastMoveDuration(moveName) <= 0.5;
}

export const DMAX_POWER_BY_LEVEL: Record<1 | 2 | 3 | 4, number> = {
  1: 250,
  2: 300,
  3: 350,
  4: 450,
};

export const GMAX_POWER_BY_LEVEL: Record<1 | 2 | 3 | 4, number> = {
  1: 350,
  2: 400,
  3: 450,
  4: 550,
};

export const MAX_GUARD_HP_BY_LEVEL: Record<0 | 1 | 2 | 3 | 4, number> = {
  0: 0,
  1: 20,
  2: 40,
  3: 60,
  4: 80,
};

export const MAX_SPIRIT_PCT_BY_LEVEL: Record<0 | 1 | 2 | 3 | 4, number> = {
  0: 0,
  1: 8,
  2: 12,
  3: 16,
  4: 20,
};

export function isCrownedWolfForm(pokemonId: number, formId?: string): boolean {
  if (formId === 'zacian_crowned' || formId === 'zamazenta_crowned') return true;
  return false;
}

export function isEternatus(pokemonId: number): boolean {
  return pokemonId === 890;
}

export interface ResolvedMaxMove {
  id: string;
  nameEn: string;
  nameEs: string;
  type: PokemonType;
  category: 'dmax' | 'gmax' | 'signature';
  baseLevel: MaxMoveLevel;
  effectiveLevel: 1 | 2 | 3 | 4;
  power: number;
  boostedByEternatus: boolean;
}

export function resolvePokemonMaxMove(params: {
  pokemonId: number;
  formId?: string;
  fastMove: PogoMove;
  isGigantamax: boolean;
  gmaxVariantIndex?: number;
  baseLevel: MaxMoveLevel;
  adventureEffect: AdventureEffectType;
}): ResolvedMaxMove {
  const {
    pokemonId,
    formId,
    fastMove,
    isGigantamax,
    gmaxVariantIndex = 0,
    baseLevel,
    adventureEffect,
  } = params;

  const eternatusActive = adventureEffect === 'eternatus';

  // 1. Crowned Zacian (Behemoth Blade) - capped at Level 3 even with Eternatus
  if (pokemonId === 888 && formId === 'zacian_crowned') {
    const effLvl = baseLevel;
    return {
      id: 'behemoth_blade',
      nameEn: 'Behemoth Blade',
      nameEs: 'Espada Suprema',
      type: 'steel',
      category: 'signature',
      baseLevel,
      effectiveLevel: effLvl,
      power: DMAX_POWER_BY_LEVEL[effLvl],
      boostedByEternatus: false,
    };
  }

  // 2. Crowned Zamazenta (Behemoth Bash) - capped at Level 3 even with Eternatus
  if (pokemonId === 889 && formId === 'zamazenta_crowned') {
    const effLvl = baseLevel;
    return {
      id: 'behemoth_bash',
      nameEn: 'Behemoth Bash',
      nameEs: 'Escudo Supremo',
      type: 'steel',
      category: 'signature',
      baseLevel,
      effectiveLevel: effLvl,
      power: DMAX_POWER_BY_LEVEL[effLvl],
      boostedByEternatus: false,
    };
  }

  // 3. Eternatus (Dynamax Cannon) - uses G-Max power curve and CAN reach Level 4
  if (pokemonId === 890) {
    const effLvl = (eternatusActive ? Math.min(4, baseLevel + 1) : baseLevel) as 1 | 2 | 3 | 4;
    return {
      id: 'dynamax_cannon',
      nameEn: 'Dynamax Cannon',
      nameEs: 'Cañón Dinamax',
      type: 'dragon',
      category: 'signature',
      baseLevel,
      effectiveLevel: effLvl,
      power: GMAX_POWER_BY_LEVEL[effLvl],
      boostedByEternatus: eternatusActive,
    };
  }

  // 4. Gigantamax fixed move
  const gmaxList = GIGANTAMAX_SPECIES[pokemonId];
  if (isGigantamax && gmaxList && gmaxList.length > 0) {
    const gmax = gmaxList[gmaxVariantIndex] || gmaxList[0];
    const effLvl = (eternatusActive ? Math.min(4, baseLevel + 1) : baseLevel) as 1 | 2 | 3 | 4;
    return {
      id: gmax.id,
      nameEn: gmax.nameEn,
      nameEs: gmax.nameEs,
      type: gmax.type,
      category: 'gmax',
      baseLevel,
      effectiveLevel: effLvl,
      power: GMAX_POWER_BY_LEVEL[effLvl],
      boostedByEternatus: eternatusActive,
    };
  }

  // 5. Standard Dynamax (derived from Fast Move type)
  const moveType = fastMove?.type || 'normal';
  const std = STANDARD_DMAX_MOVES[moveType] || STANDARD_DMAX_MOVES.normal;
  const effLvl = (eternatusActive ? Math.min(4, baseLevel + 1) : baseLevel) as 1 | 2 | 3 | 4;

  return {
    id: std.id,
    nameEn: std.nameEn,
    nameEs: std.nameEs,
    type: std.type,
    category: 'dmax',
    baseLevel,
    effectiveLevel: effLvl,
    power: DMAX_POWER_BY_LEVEL[effLvl],
    boostedByEternatus: eternatusActive,
  };
}

export interface MaxBossEntity {
  id: string;
  pokemonId: number;
  formId?: string;
  name: string;
  types: PokemonType[];
  baseAttack: number;
  baseDefense: number;
  baseStamina: number;
  spriteUrl: string;
  isGigantamax: boolean;
  tier: MaxBossTier;
  hp: number;
  cpm: number;
}

export interface MaxBattleUnitConfig {
  slotIndex: 0 | 1 | 2;
  pokemonId: number;
  formId?: string;
  name: string;
  types: PokemonType[];
  baseAttack: number;
  baseDefense: number;
  baseStamina: number;
  spriteUrl: string;
  level: number;
  ivAtk: number;
  ivDef: number;
  ivHp: number;
  isGigantamax: boolean;
  gmaxVariantIndex?: number;
  role: MaxUnitRole;
  fastMove: PogoMove;
  chargedMove: PogoMove;
  useChargedInSmallPhase: boolean;
  maxAttackLevel: MaxMoveLevel;
  maxGuardLevel: MaxSupportLevel;
  maxSpiritLevel: MaxSupportLevel;
}

export interface SingleMoveDamageDetail {
  moveName: string;
  moveNameEs: string;
  moveType: PokemonType;
  power: number;
  damage: number;
  stab: boolean;
  typeMultiplier: number;
  totalExternalMultiplier: number;
  bossHpPercent: number;
}

export interface MaxUnitBattleBreakdown {
  slotIndex: 0 | 1 | 2;
  unitName: string;
  effectiveAttack: number;
  effectiveDefense: number;
  maxHp: number;
  fastMoveDuration: number;
  fastIsHalfSecond: boolean;
  fastDamage: SingleMoveDamageDetail;
  chargedDamage: SingleMoveDamageDetail;
  resolvedMaxMove: ResolvedMaxMove;
  maxAttackDamage: SingleMoveDamageDetail;
  maxPhaseThreeHitsDamage: number;
  maxPhaseThreeHitsPct: number;
  maxEnergyPerFastHit: number;
  maxEnergyPerSecond: number;
  effectiveGuardLevel: 0 | 1 | 2 | 3 | 4;
  guardHpPerUse: number;
  guardEffectiveHpPerUse: number;
  guardEffectiveHpThreeStacks: number;
  defenseDamageReductionPct: number;
  bossEstimatedHitDamage: number;
  bossHitsAbsorbedByGuard: number;
  effectiveSpiritLevel: 0 | 1 | 2 | 3 | 4;
  spiritHealPct: number;
  spiritHealHpPerUse: number;
  spiritHealHpThreeUses: number;
  pureMaxHitsToKo: number;
  pureMaxPhasesToKo: number;
  baselineMaxAttackDamage: number;
  baselinePureMaxHitsToKo: number;
}

export function getCombinedExternalDamageMultiplier(modifiers: MaxModifiersConfig): number {
  const mushroom = modifiers.maxMushroom ? 2.0 : 1.0;
  const helper = HELPER_BONUS_TABLE[modifiers.helperTier].multiplier;
  const weather = modifiers.weatherBoost ? 1.2 : 1.0;
  const friendship = FRIENDSHIP_BONUS_TABLE[modifiers.friendshipTier].multiplier;
  return mushroom * helper * weather * friendship;
}

export function calculateMaxMoveDamageValue(params: {
  power: number;
  moveType: PokemonType;
  attackerTypes: PokemonType[];
  attackerEffectiveAtk: number;
  defenderTypes: PokemonType[];
  defenderEffectiveDef: number;
  externalMultiplier: number;
}): { damage: number; stab: boolean; typeMultiplier: number } {
  const {
    power,
    moveType,
    attackerTypes,
    attackerEffectiveAtk,
    defenderTypes,
    defenderEffectiveDef,
    externalMultiplier,
  } = params;

  if (power <= 0 || defenderEffectiveDef <= 0) {
    return { damage: 0, stab: false, typeMultiplier: 1 };
  }

  const stab = attackerTypes.includes(moveType);
  const stabMult = stab ? 1.2 : 1.0;
  const typeMultiplier = getPogoTypeEffectiveness(moveType, defenderTypes);

  const damage = Math.max(
    1,
    Math.floor(
      0.5 *
        power *
        (attackerEffectiveAtk / defenderEffectiveDef) *
        stabMult *
        typeMultiplier *
        externalMultiplier
    ) + 1
  );

  return { damage, stab, typeMultiplier };
}

export function calculateMaxUnitBreakdown(
  unit: MaxBattleUnitConfig,
  boss: MaxBossEntity,
  modifiers: MaxModifiersConfig
): MaxUnitBattleBreakdown {
  const unitCpm = getCPM(unit.level);
  const zacianAtkMult = modifiers.adventureEffect === 'zacian' ? 1.05 : 1.0;
  const zamazentaDefMult = modifiers.adventureEffect === 'zamazenta' ? 1.05 : 1.0;

  const effectiveAttack = (unit.baseAttack + unit.ivAtk) * unitCpm * zacianAtkMult;
  const effectiveDefense = (unit.baseDefense + unit.ivDef) * unitCpm * zamazentaDefMult;
  const maxHp = Math.max(10, Math.floor((unit.baseStamina + unit.ivHp) * unitCpm));

  const bossDef = (boss.baseDefense + 15) * boss.cpm;
  const externalMult = getCombinedExternalDamageMultiplier(modifiers);

  // Fast Move
  const fastCalc = calculateMaxMoveDamageValue({
    power: unit.fastMove.power,
    moveType: unit.fastMove.type,
    attackerTypes: unit.types,
    attackerEffectiveAtk: effectiveAttack,
    defenderTypes: boss.types,
    defenderEffectiveDef: bossDef,
    externalMultiplier: externalMult,
  });
  const fastMoveDuration = getFastMoveDuration(unit.fastMove.name);

  // Charged Move
  const chargedCalc = calculateMaxMoveDamageValue({
    power: unit.chargedMove.power,
    moveType: unit.chargedMove.type,
    attackerTypes: unit.types,
    attackerEffectiveAtk: effectiveAttack,
    defenderTypes: boss.types,
    defenderEffectiveDef: bossDef,
    externalMultiplier: externalMult,
  });

  // Max Move (with active modifiers)
  const resolvedMaxMove = resolvePokemonMaxMove({
    pokemonId: unit.pokemonId,
    formId: unit.formId,
    fastMove: unit.fastMove,
    isGigantamax: unit.isGigantamax,
    gmaxVariantIndex: unit.gmaxVariantIndex,
    baseLevel: unit.maxAttackLevel,
    adventureEffect: modifiers.adventureEffect,
  });

  const maxCalc = calculateMaxMoveDamageValue({
    power: resolvedMaxMove.power,
    moveType: resolvedMaxMove.type,
    attackerTypes: unit.types,
    attackerEffectiveAtk: effectiveAttack,
    defenderTypes: boss.types,
    defenderEffectiveDef: bossDef,
    externalMultiplier: externalMult,
  });

  // Baseline Max Move (no adventure effect, no mushroom, no helpers, no weather, no friendship)
  const baselineAtk = (unit.baseAttack + unit.ivAtk) * unitCpm;
  const baselineResolved = resolvePokemonMaxMove({
    pokemonId: unit.pokemonId,
    formId: unit.formId,
    fastMove: unit.fastMove,
    isGigantamax: unit.isGigantamax,
    gmaxVariantIndex: unit.gmaxVariantIndex,
    baseLevel: unit.maxAttackLevel,
    adventureEffect: 'none',
  });
  const baselineMaxCalc = calculateMaxMoveDamageValue({
    power: baselineResolved.power,
    moveType: baselineResolved.type,
    attackerTypes: unit.types,
    attackerEffectiveAtk: baselineAtk,
    defenderTypes: boss.types,
    defenderEffectiveDef: bossDef,
    externalMultiplier: 1.0,
  });

  const maxEnergyPerFastHit = Math.max(1, Math.floor((fastCalc.damage / boss.hp) * 200));
  const maxEnergyPerSecond = Number((maxEnergyPerFastHit / fastMoveDuration).toFixed(2));

  const eternatusBoostsSupport =
    modifiers.adventureEffect === 'eternatus' && !isCrownedWolfForm(unit.pokemonId, unit.formId);

  const effectiveGuardLevel = (
    unit.maxGuardLevel > 0 && eternatusBoostsSupport
      ? Math.min(4, unit.maxGuardLevel + 1)
      : unit.maxGuardLevel
  ) as 0 | 1 | 2 | 3 | 4;

  const effectiveSpiritLevel = (
    unit.maxSpiritLevel > 0 && eternatusBoostsSupport
      ? Math.min(4, unit.maxSpiritLevel + 1)
      : unit.maxSpiritLevel
  ) as 0 | 1 | 2 | 3 | 4;

  const pureMaxHitsToKo = Math.max(1, Math.ceil(boss.hp / Math.max(1, maxCalc.damage)));
  const pureMaxPhasesToKo = Math.max(1, Math.ceil(pureMaxHitsToKo / 3));
  const baselinePureMaxHitsToKo = Math.max(
    1,
    Math.ceil(boss.hp / Math.max(1, baselineMaxCalc.damage))
  );

  // Defense-scaled Max Guard mitigation & Boss incoming damage analysis
  const bossIncomingMults = boss.types.map((bt) => getPogoTypeEffectiveness(bt, unit.types));
  const avgIncomingTypeMultiplier =
    bossIncomingMults.length > 0
      ? bossIncomingMults.reduce((sum, v) => sum + v, 0) / bossIncomingMults.length
      : 1.0;

  const bossEffectiveAtk = (boss.baseAttack + 15) * boss.cpm;
  const bossEstimatedHitDamage = Math.max(
    1,
    Math.floor(
      0.5 *
        100 *
        (bossEffectiveAtk / Math.max(1, effectiveDefense)) *
        1.2 *
        avgIncomingTypeMultiplier
    ) + 1
  );

  const guardHpPerUse = MAX_GUARD_HP_BY_LEVEL[effectiveGuardLevel];
  const defenseDamageReductionPct = Number(
    ((1 - (100 / Math.max(1, effectiveDefense)) * avgIncomingTypeMultiplier) * 100).toFixed(1)
  );
  const guardEffectiveHpPerUse = Math.round(
    guardHpPerUse * (effectiveDefense / 100) / Math.max(0.25, avgIncomingTypeMultiplier)
  );
  const guardEffectiveHpThreeStacks = guardEffectiveHpPerUse * 3;
  const bossHitsAbsorbedByGuard =
    guardHpPerUse > 0
      ? Number((guardHpPerUse / Math.max(1, bossEstimatedHitDamage)).toFixed(1))
      : 0;

  const spiritHealPct = MAX_SPIRIT_PCT_BY_LEVEL[effectiveSpiritLevel];
  const spiritHealHpPerUse = Math.round((maxHp * spiritHealPct) / 100);
  const spiritHealHpThreeUses = spiritHealHpPerUse * 3;

  return {
    slotIndex: unit.slotIndex,
    unitName: unit.name,
    effectiveAttack: Number(effectiveAttack.toFixed(1)),
    effectiveDefense: Number(effectiveDefense.toFixed(1)),
    maxHp,
    fastMoveDuration,
    fastIsHalfSecond: fastMoveDuration <= 0.5,
    fastDamage: {
      moveName: unit.fastMove.name,
      moveNameEs: getSpanishMoveName(unit.fastMove.name),
      moveType: unit.fastMove.type,
      power: unit.fastMove.power,
      damage: fastCalc.damage,
      stab: fastCalc.stab,
      typeMultiplier: fastCalc.typeMultiplier,
      totalExternalMultiplier: externalMult,
      bossHpPercent: Number(((fastCalc.damage / boss.hp) * 100).toFixed(2)),
    },
    chargedDamage: {
      moveName: unit.chargedMove.name,
      moveNameEs: getSpanishMoveName(unit.chargedMove.name),
      moveType: unit.chargedMove.type,
      power: unit.chargedMove.power,
      damage: chargedCalc.damage,
      stab: chargedCalc.stab,
      typeMultiplier: chargedCalc.typeMultiplier,
      totalExternalMultiplier: externalMult,
      bossHpPercent: Number(((chargedCalc.damage / boss.hp) * 100).toFixed(2)),
    },
    resolvedMaxMove,
    maxAttackDamage: {
      moveName: resolvedMaxMove.nameEn,
      moveNameEs: resolvedMaxMove.nameEs,
      moveType: resolvedMaxMove.type,
      power: resolvedMaxMove.power,
      damage: maxCalc.damage,
      stab: maxCalc.stab,
      typeMultiplier: maxCalc.typeMultiplier,
      totalExternalMultiplier: externalMult,
      bossHpPercent: Number(((maxCalc.damage / boss.hp) * 100).toFixed(2)),
    },
    maxPhaseThreeHitsDamage: maxCalc.damage * 3,
    maxPhaseThreeHitsPct: Number((((maxCalc.damage * 3) / boss.hp) * 100).toFixed(1)),
    maxEnergyPerFastHit,
    maxEnergyPerSecond,
    effectiveGuardLevel,
    guardHpPerUse,
    guardEffectiveHpPerUse,
    guardEffectiveHpThreeStacks,
    defenseDamageReductionPct,
    bossEstimatedHitDamage,
    bossHitsAbsorbedByGuard,
    effectiveSpiritLevel,
    spiritHealPct,
    spiritHealHpPerUse,
    spiritHealHpThreeUses,
    pureMaxHitsToKo,
    pureMaxPhasesToKo,
    baselineMaxAttackDamage: baselineMaxCalc.damage,
    baselinePureMaxHitsToKo,
  };
}

export interface MaxSimulationParams {
  team: MaxBattleUnitConfig[];
  boss: MaxBossEntity;
  modifiers: MaxModifiersConfig;
  trainersCount: number; // 1-40 (each group of up to 4 fills its own 100 energy bar)
  orbsEnergyPerCycle: number; // 0, 10, 20
  maxAttacksPerPhase: 1 | 2 | 3; // e.g., 3 attacks, or 2 attacks + 1 shield/heal
}

export interface MaxSimulationResult {
  unitBreakdowns: MaxUnitBattleBreakdown[];
  activeCharger: MaxUnitBattleBreakdown;
  activeAttacker: MaxUnitBattleBreakdown;
  // Cycle breakdown
  fastHitsPerCyclePerTrainer: number;
  chargedHitsPerCyclePerTrainer: number;
  smallPhaseSecondsPerCycle: number;
  smallPhaseDamagePerTrainer: number;
  smallPhaseDamageTeam: number;
  maxPhaseDamagePerTrainer: number;
  maxPhaseDamageTeam: number;
  totalDamagePerCycleTeam: number;
  // Totals to KO
  cyclesToKo: number;
  totalFastHitsPerTrainer: number;
  totalFastHitsTeam: number;
  totalChargedHitsPerTrainer: number;
  totalMaxHitsPerTrainer: number;
  totalMaxHitsTeam: number;
  pureMaxHitsSingleAttacker: number;
  pureMaxPhasesSingleAttacker: number;
  estimatedTotalSeconds: number;
  koAchievedWithinEnrage: boolean;
  // Baseline comparison (sin habilitadores)
  baselineCyclesToKo: number;
  baselineTotalMaxHitsPerTrainer: number;
  baselineEstimatedSeconds: number;
  hitsSavedByModifiers: number;
  secondsSavedByModifiers: number;
}

const DEFAULT_NONE_MODIFIERS: MaxModifiersConfig = {
  adventureEffect: 'none',
  maxMushroom: false,
  helperTier: 0,
  weatherBoost: false,
  friendshipTier: 'none',
};

function runSingleSimulationPass(
  breakdowns: MaxUnitBattleBreakdown[],
  team: MaxBattleUnitConfig[],
  boss: MaxBossEntity,
  trainersCount: number,
  orbsEnergyPerCycle: number,
  maxAttacksPerPhase: 1 | 2 | 3
) {
  // Choose primary Small Phase Charger (first 'charger', else highest energy/sec among 'hybrid'/all)
  const chargerUnit =
    team.find((u) => u.role === 'charger') ||
    team.find((u) => u.role === 'hybrid') ||
    team[0];
  const activeCharger =
    breakdowns.find((b) => b.slotIndex === chargerUnit.slotIndex) || breakdowns[0];

  // Choose primary Max Phase Attacker (highest maxAttackDamage among 'attacker' or 'hybrid', else overall max)
  const attackerCandidates = team.filter((u) => u.role === 'attacker' || u.role === 'hybrid');
  const poolForAttacker = attackerCandidates.length > 0 ? attackerCandidates : team;
  let activeAttacker = breakdowns[0];
  let bestMaxDmg = -1;
  for (const cand of poolForAttacker) {
    const bd = breakdowns.find((b) => b.slotIndex === cand.slotIndex);
    if (bd && bd.maxAttackDamage.damage > bestMaxDmg) {
      bestMaxDmg = bd.maxAttackDamage.damage;
      activeAttacker = bd;
    }
  }

  const meterGroupSize = Math.min(4, Math.max(1, trainersCount));
  const energyNeededFromHits = Math.max(1, 100 - orbsEnergyPerCycle);
  const energyPerFastHitGroup = activeCharger.maxEnergyPerFastHit * meterGroupSize;

  let fastHitsPerCyclePerTrainer = 0;
  let chargedHitsPerCyclePerTrainer = 0;
  let smallPhaseSecondsPerCycle = 0;
  let smallPhaseDamagePerTrainer = 0;

  if (chargerUnit.useChargedInSmallPhase && chargerUnit.chargedMove.power > 0) {
    const chargedCost = Math.abs(chargerUnit.chargedMove.energy) || 50;
    const fastEnergyGain = Math.max(1, chargerUnit.fastMove.energy || 8);
    const chargedMaxEnergy = Math.max(
      1,
      Math.floor((activeCharger.chargedDamage.damage / boss.hp) * 200)
    );

    let meterEnergy = 0;
    let moveEnergyPool = 0;
    let guardSteps = 0;
    while (meterEnergy < energyNeededFromHits && guardSteps < 200) {
      guardSteps++;
      if (moveEnergyPool >= chargedCost) {
        moveEnergyPool -= chargedCost;
        chargedHitsPerCyclePerTrainer += 1;
        smallPhaseSecondsPerCycle += 2.5;
        smallPhaseDamagePerTrainer += activeCharger.chargedDamage.damage;
        meterEnergy += chargedMaxEnergy * meterGroupSize;
      } else {
        moveEnergyPool += fastEnergyGain;
        fastHitsPerCyclePerTrainer += 1;
        smallPhaseSecondsPerCycle += activeCharger.fastMoveDuration;
        smallPhaseDamagePerTrainer += activeCharger.fastDamage.damage;
        meterEnergy += energyPerFastHitGroup;
      }
    }
  } else {
    fastHitsPerCyclePerTrainer = Math.ceil(energyNeededFromHits / energyPerFastHitGroup);
    smallPhaseSecondsPerCycle = Number(
      (fastHitsPerCyclePerTrainer * activeCharger.fastMoveDuration).toFixed(1)
    );
    smallPhaseDamagePerTrainer = fastHitsPerCyclePerTrainer * activeCharger.fastDamage.damage;
  }

  const smallPhaseDamageTeam = smallPhaseDamagePerTrainer * trainersCount;
  const maxPhaseDamagePerTrainer = activeAttacker.maxAttackDamage.damage * maxAttacksPerPhase;
  const maxPhaseDamageTeam = maxPhaseDamagePerTrainer * trainersCount;
  const totalDamagePerCycleTeam = smallPhaseDamageTeam + maxPhaseDamageTeam;

  // Step through HP to calculate exact hits / cycles to KO
  let remainingHp = boss.hp;
  let cyclesToKo = 0;
  let totalFastHitsPerTrainer = 0;
  let totalChargedHitsPerTrainer = 0;
  let totalMaxHitsPerTrainer = 0;
  let estimatedTotalSeconds = 0;
  const MAX_PHASE_ANIMATION_SEC = 10; // Dynamax transformation + 3 Max actions (~10s)

  while (remainingHp > 0 && cyclesToKo < 150) {
    cyclesToKo++;
    // Small phase
    if (remainingHp <= smallPhaseDamageTeam) {
      const fraction = remainingHp / Math.max(1, smallPhaseDamageTeam);
      const partialFast = Math.max(1, Math.ceil(fastHitsPerCyclePerTrainer * fraction));
      const partialCharged = Math.ceil(chargedHitsPerCyclePerTrainer * fraction);
      totalFastHitsPerTrainer += partialFast;
      totalChargedHitsPerTrainer += partialCharged;
      estimatedTotalSeconds += Number((smallPhaseSecondsPerCycle * fraction).toFixed(1));
      remainingHp = 0;
      break;
    }

    remainingHp -= smallPhaseDamageTeam;
    totalFastHitsPerTrainer += fastHitsPerCyclePerTrainer;
    totalChargedHitsPerTrainer += chargedHitsPerCyclePerTrainer;
    estimatedTotalSeconds += smallPhaseSecondsPerCycle;

    // Max phase (1 to 3 Max Hits)
    const dmgPerMaxStepTeam = activeAttacker.maxAttackDamage.damage * trainersCount;
    let hitsUsedThisPhase = 0;
    for (let h = 0; h < maxAttacksPerPhase; h++) {
      hitsUsedThisPhase++;
      totalMaxHitsPerTrainer++;
      remainingHp -= dmgPerMaxStepTeam;
      if (remainingHp <= 0) {
        remainingHp = 0;
        break;
      }
    }
    const maxPhaseTime =
      hitsUsedThisPhase === maxAttacksPerPhase
        ? MAX_PHASE_ANIMATION_SEC
        : Math.ceil((MAX_PHASE_ANIMATION_SEC * hitsUsedThisPhase) / maxAttacksPerPhase);
    estimatedTotalSeconds += maxPhaseTime;
  }

  const pureMaxHitsSingleAttacker = Math.max(
    1,
    Math.ceil(boss.hp / Math.max(1, activeAttacker.maxAttackDamage.damage * trainersCount))
  );
  const pureMaxPhasesSingleAttacker = Math.max(
    1,
    Math.ceil(pureMaxHitsSingleAttacker / maxAttacksPerPhase)
  );

  return {
    activeCharger,
    activeAttacker,
    fastHitsPerCyclePerTrainer,
    chargedHitsPerCyclePerTrainer,
    smallPhaseSecondsPerCycle,
    smallPhaseDamagePerTrainer,
    smallPhaseDamageTeam,
    maxPhaseDamagePerTrainer,
    maxPhaseDamageTeam,
    totalDamagePerCycleTeam,
    cyclesToKo,
    totalFastHitsPerTrainer,
    totalFastHitsTeam: totalFastHitsPerTrainer * trainersCount,
    totalChargedHitsPerTrainer,
    totalMaxHitsPerTrainer,
    totalMaxHitsTeam: totalMaxHitsPerTrainer * trainersCount,
    pureMaxHitsSingleAttacker,
    pureMaxPhasesSingleAttacker,
    estimatedTotalSeconds: Number(estimatedTotalSeconds.toFixed(1)),
  };
}

export function simulateMaxBattleCycle(params: MaxSimulationParams): MaxSimulationResult {
  const {
    team,
    boss,
    modifiers,
    trainersCount,
    orbsEnergyPerCycle,
    maxAttacksPerPhase,
  } = params;

  const safeTeam = team.length > 0 ? team : [];
  const unitBreakdowns = safeTeam.map((u) => calculateMaxUnitBreakdown(u, boss, modifiers));
  const baselineBreakdowns = safeTeam.map((u) =>
    calculateMaxUnitBreakdown(u, boss, DEFAULT_NONE_MODIFIERS)
  );

  const mainPass = runSingleSimulationPass(
    unitBreakdowns,
    safeTeam,
    boss,
    trainersCount,
    orbsEnergyPerCycle,
    maxAttacksPerPhase
  );

  const basePass = runSingleSimulationPass(
    baselineBreakdowns,
    safeTeam,
    boss,
    trainersCount,
    orbsEnergyPerCycle,
    maxAttacksPerPhase
  );

  return {
    unitBreakdowns,
    ...mainPass,
    koAchievedWithinEnrage: mainPass.estimatedTotalSeconds <= 360,
    baselineCyclesToKo: basePass.cyclesToKo,
    baselineTotalMaxHitsPerTrainer: basePass.totalMaxHitsPerTrainer,
    baselineEstimatedSeconds: basePass.estimatedTotalSeconds,
    hitsSavedByModifiers: Math.max(0, basePass.totalMaxHitsPerTrainer - mainPass.totalMaxHitsPerTrainer),
    secondsSavedByModifiers: Number(
      Math.max(0, basePass.estimatedTotalSeconds - mainPass.estimatedTotalSeconds).toFixed(1)
    ),
  };
}

export interface MaxRosterEntry {
  key: string;
  pokemonId: number;
  formId?: string;
  name: string;
  displayNameEs: string;
  displayNameEn: string;
  types: PokemonType[];
  baseAttack: number;
  baseDefense: number;
  baseStamina: number;
  spriteUrl: string;
  fastMoves: PogoMove[];
  chargedMoves: PogoMove[];
  isGigantamax: boolean;
  gmaxVariantIndex?: number;
  isOfficialMax: boolean;
}

export function buildMaxRosterEntries(includeAllPokedex: boolean): MaxRosterEntry[] {
  const entries: MaxRosterEntry[] = [];

  for (const p of POGO_DATABASE) {
    const isOfficialSpecies = OFFICIAL_MAX_ELIGIBLE_IDS.has(p.id);

    // Special Crowned Forms for Zacian (888) and Zamazenta (889)
    if (p.id === 888 || p.id === 889) {
      const forms = p.specialForms || [];
      const crowned = forms.find(
        (f) => f.id === 'zacian_crowned' || f.id === 'zamazenta_crowned'
      );
      if (crowned) {
        entries.push({
          key: `${p.id}-${crowned.id}`,
          pokemonId: p.id,
          formId: crowned.id,
          name: crowned.name,
          displayNameEs:
            p.id === 888 ? 'Zacian Espada Suprema' : 'Zamazenta Escudo Supremo',
          displayNameEn:
            p.id === 888 ? 'Zacian (Crowned Sword)' : 'Zamazenta (Crowned Shield)',
          types: crowned.types,
          baseAttack: crowned.baseAttack,
          baseDefense: crowned.baseDefense,
          baseStamina: crowned.baseStamina,
          spriteUrl: crowned.spriteUrl,
          fastMoves:
            crowned.fastMoves && crowned.fastMoves.length > 0 ? crowned.fastMoves : p.fastMoves,
          chargedMoves:
            crowned.chargedMoves && crowned.chargedMoves.length > 0
              ? crowned.chargedMoves
              : p.chargedMoves,
          isGigantamax: false,
          isOfficialMax: true,
        });
      }
      if (!includeAllPokedex) continue;
    }

    // Gigantamax forms
    const gmaxList = GIGANTAMAX_SPECIES[p.id];
    if (gmaxList && gmaxList.length > 0) {
      gmaxList.forEach((gmax, idx) => {
        entries.push({
          key: `${p.id}-gmax-${idx}`,
          pokemonId: p.id,
          name: p.name,
          displayNameEs: gmax.labelEs,
          displayNameEn: gmax.labelEn,
          types: gmax.overrideTypes || p.types,
          baseAttack: p.baseAttack,
          baseDefense: p.baseDefense,
          baseStamina: p.baseStamina,
          spriteUrl: p.spriteUrl,
          fastMoves: p.fastMoves,
          chargedMoves: p.chargedMoves,
          isGigantamax: true,
          gmaxVariantIndex: idx,
          isOfficialMax: true,
        });
      });
    }

    // Standard Dynamax / Base form (Note: Eternatus #890 doesn't Dynamax, enters as base)
    if (isOfficialSpecies || includeAllPokedex) {
      entries.push({
        key: `${p.id}-dmax`,
        pokemonId: p.id,
        name: p.name,
        displayNameEs: p.id === 890 ? 'Eternatus' : `${p.name} (Dinamax)`,
        displayNameEn: p.id === 890 ? 'Eternatus' : `${p.name} (Dynamax)`,
        types: p.types,
        baseAttack: p.baseAttack,
        baseDefense: p.baseDefense,
        baseStamina: p.baseStamina,
        spriteUrl: p.spriteUrl,
        fastMoves: p.fastMoves,
        chargedMoves: p.chargedMoves,
        isGigantamax: false,
        isOfficialMax: isOfficialSpecies,
      });
    }
  }

  return entries;
}

export interface MaxBestByTypeEntry {
  rank: number;
  entry: MaxRosterEntry;
  requiredFastMove: PogoMove;
  resolvedMaxMove: ResolvedMaxMove;
  maxMoveDamage: number;
  threeHitDamage: number;
  effectiveAttack: number;
  stab: boolean;
  typeMultiplier: number;
  scorePct: number;
}

export function getBestMaxAttackersByType(params: {
  targetType: PokemonType;
  attackerLevel: number;
  maxMoveLevel: MaxMoveLevel;
  modifiers: MaxModifiersConfig;
  includeAllPokedex: boolean;
  bossDefenderTypes?: PokemonType[];
  bossDefenseStat?: number;
}): MaxBestByTypeEntry[] {
  const {
    targetType,
    attackerLevel,
    maxMoveLevel,
    modifiers,
    includeAllPokedex,
    bossDefenderTypes,
    bossDefenseStat = 150, // neutral reference defense if viewing general type tier list
  } = params;

  const roster = buildMaxRosterEntries(includeAllPokedex);
  const cpm = getCPM(attackerLevel);
  const zacianMult = modifiers.adventureEffect === 'zacian' ? 1.05 : 1.0;
  const externalMult = getCombinedExternalDamageMultiplier(modifiers);

  const candidates: Omit<MaxBestByTypeEntry, 'rank' | 'scorePct'>[] = [];

  for (const entry of roster) {
    if (entry.fastMoves.length === 0) continue;

    let chosenFastMove: PogoMove | undefined;

    if (
      entry.isGigantamax ||
      isEternatus(entry.pokemonId) ||
      isCrownedWolfForm(entry.pokemonId, entry.formId)
    ) {
      const dummyFast = entry.fastMoves[0];
      const probe = resolvePokemonMaxMove({
        pokemonId: entry.pokemonId,
        formId: entry.formId,
        fastMove: dummyFast,
        isGigantamax: entry.isGigantamax,
        gmaxVariantIndex: entry.gmaxVariantIndex,
        baseLevel: maxMoveLevel,
        adventureEffect: modifiers.adventureEffect,
      });

      if (probe.type !== targetType) continue;

      // Prefer 0.5s fast move for utility when G-Max/signature type is fixed
      chosenFastMove =
        entry.fastMoves.find((m) => isHalfSecondFastMove(m.name)) || entry.fastMoves[0];
    } else {
      // Standard Dynamax: MUST have a Fast Move of targetType
      const matchingFast = entry.fastMoves.filter((m) => m.type === targetType);
      if (matchingFast.length === 0) continue;

      // Prefer 0.5s fast move of that type, else highest power/lowest duration
      chosenFastMove =
        matchingFast.find((m) => isHalfSecondFastMove(m.name)) ||
        [...matchingFast].sort((a, b) => getFastMoveDuration(a.name) - getFastMoveDuration(b.name))[0];
    }

    if (!chosenFastMove) continue;

    const resolvedMaxMove = resolvePokemonMaxMove({
      pokemonId: entry.pokemonId,
      formId: entry.formId,
      fastMove: chosenFastMove,
      isGigantamax: entry.isGigantamax,
      gmaxVariantIndex: entry.gmaxVariantIndex,
      baseLevel: maxMoveLevel,
      adventureEffect: modifiers.adventureEffect,
    });

    const effectiveAttack = (entry.baseAttack + 15) * cpm * zacianMult;
    const defTypes = bossDefenderTypes || [];
    const stab = entry.types.includes(resolvedMaxMove.type);
    const stabMult = stab ? 1.2 : 1.0;
    const typeMult =
      defTypes.length > 0 ? getPogoTypeEffectiveness(resolvedMaxMove.type, defTypes) : 1.0;

    const damage = Math.max(
      1,
      Math.floor(
        0.5 *
          resolvedMaxMove.power *
          (effectiveAttack / bossDefenseStat) *
          stabMult *
          typeMult *
          externalMult
      ) + 1
    );

    candidates.push({
      entry,
      requiredFastMove: chosenFastMove,
      resolvedMaxMove,
      maxMoveDamage: damage,
      threeHitDamage: damage * 3,
      effectiveAttack: Number(effectiveAttack.toFixed(1)),
      stab,
      typeMultiplier: typeMult,
    });
  }

  candidates.sort((a, b) => b.maxMoveDamage - a.maxMoveDamage || b.effectiveAttack - a.effectiveAttack);

  const topDamage = candidates.length > 0 ? candidates[0].maxMoveDamage : 1;

  return candidates.slice(0, 30).map((item, idx) => ({
    ...item,
    rank: idx + 1,
    scorePct: Number(((item.maxMoveDamage / topDamage) * 100).toFixed(1)),
  }));
}

export interface MaxCounterCandidate {
  entry: MaxRosterEntry;
  fastMove: PogoMove;
  chargedMove: PogoMove;
  resolvedMaxMove: ResolvedMaxMove;
  maxMoveDamage: number;
  threeHitDamage: number;
  typeMultiplier: number;
  stab: boolean;
  tankinessScore: number;
  hasHalfSecondFast: boolean;
  resistanceFactorAgainstBoss: number;
  pureMaxHitsToKo: number;
}

export interface GeneratedMaxTeamResult {
  recommendedTeam: MaxBattleUnitConfig[];
  topAttackers: MaxCounterCandidate[];
  topTanks: MaxCounterCandidate[];
}

export function generateOptimalMaxTeam(params: {
  boss: MaxBossEntity;
  attackerLevel: number;
  maxMoveLevel: MaxMoveLevel;
  modifiers: MaxModifiersConfig;
  includeAllPokedex: boolean;
  teamPattern: '2-tanks-1-attacker' | '1-tank-2-attackers';
}): GeneratedMaxTeamResult {
  const {
    boss,
    attackerLevel,
    maxMoveLevel,
    modifiers,
    includeAllPokedex,
    teamPattern,
  } = params;

  const roster = buildMaxRosterEntries(includeAllPokedex);
  const cpm = getCPM(attackerLevel);
  const zacianMult = modifiers.adventureEffect === 'zacian' ? 1.05 : 1.0;
  const zamazentaMult = modifiers.adventureEffect === 'zamazenta' ? 1.05 : 1.0;
  const externalMult = getCombinedExternalDamageMultiplier(modifiers);
  const bossDef = (boss.baseDefense + 15) * boss.cpm;

  const attackerScored: MaxCounterCandidate[] = [];
  const tankScored: MaxCounterCandidate[] = [];

  for (const entry of roster) {
    if (entry.fastMoves.length === 0) continue;

    const effAtk = (entry.baseAttack + 15) * cpm * zacianMult;
    const effDef = (entry.baseDefense + 15) * cpm * zamazentaMult;
    const effHp = Math.max(10, Math.floor((entry.baseStamina + 15) * cpm));

    // Average incoming damage multiplier from Boss's STAB types
    const incomingMults = boss.types.map((bt) => getPogoTypeEffectiveness(bt, entry.types));
    const avgIncomingMult =
      incomingMults.length > 0
        ? incomingMults.reduce((sum, v) => sum + v, 0) / incomingMults.length
        : 1.0;

    // 1. Evaluate Best Max Attack Option against Boss
    let bestAttackerOption: MaxCounterCandidate | null = null;
    for (const fm of entry.fastMoves) {
      const resolved = resolvePokemonMaxMove({
        pokemonId: entry.pokemonId,
        formId: entry.formId,
        fastMove: fm,
        isGigantamax: entry.isGigantamax,
        gmaxVariantIndex: entry.gmaxVariantIndex,
        baseLevel: maxMoveLevel,
        adventureEffect: modifiers.adventureEffect,
      });

      const dmgRes = calculateMaxMoveDamageValue({
        power: resolved.power,
        moveType: resolved.type,
        attackerTypes: entry.types,
        attackerEffectiveAtk: effAtk,
        defenderTypes: boss.types,
        defenderEffectiveDef: bossDef,
        externalMultiplier: externalMult,
      });

      const cand: MaxCounterCandidate = {
        entry,
        fastMove: fm,
        chargedMove: entry.chargedMoves[0] || {
          id: 'struggle',
          name: 'Struggle',
          type: entry.types[0] || 'normal',
          power: 35,
          energy: 33,
          typeCategory: 'charged',
        },
        resolvedMaxMove: resolved,
        maxMoveDamage: dmgRes.damage,
        threeHitDamage: dmgRes.damage * 3,
        typeMultiplier: dmgRes.typeMultiplier,
        stab: dmgRes.stab,
        tankinessScore: Number(((effDef * effHp) / Math.max(0.25, avgIncomingMult)).toFixed(0)),
        hasHalfSecondFast: isHalfSecondFastMove(fm.name),
        resistanceFactorAgainstBoss: Number(avgIncomingMult.toFixed(3)),
        pureMaxHitsToKo: Math.max(1, Math.ceil(boss.hp / Math.max(1, dmgRes.damage))),
      };

      if (
        !bestAttackerOption ||
        cand.maxMoveDamage > bestAttackerOption.maxMoveDamage ||
        (cand.maxMoveDamage === bestAttackerOption.maxMoveDamage &&
          cand.hasHalfSecondFast &&
          !bestAttackerOption.hasHalfSecondFast)
      ) {
        bestAttackerOption = cand;
      }
    }

    if (bestAttackerOption) {
      attackerScored.push(bestAttackerOption);
    }

    // 2. Evaluate Best Tank / Charger Option (requires 0.5s fast move strongly favored)
    const halfSecMoves = entry.fastMoves.filter((m) => isHalfSecondFastMove(m.name));
    const bestTankFast =
      halfSecMoves.length > 0
        ? halfSecMoves[0]
        : [...entry.fastMoves].sort(
            (a, b) => getFastMoveDuration(a.name) - getFastMoveDuration(b.name)
          )[0];

    const tankResolved = resolvePokemonMaxMove({
      pokemonId: entry.pokemonId,
      formId: entry.formId,
      fastMove: bestTankFast,
      isGigantamax: entry.isGigantamax,
      gmaxVariantIndex: entry.gmaxVariantIndex,
      baseLevel: maxMoveLevel,
      adventureEffect: modifiers.adventureEffect,
    });

    const tankMaxRes = calculateMaxMoveDamageValue({
      power: tankResolved.power,
      moveType: tankResolved.type,
      attackerTypes: entry.types,
      attackerEffectiveAtk: effAtk,
      defenderTypes: boss.types,
      defenderEffectiveDef: bossDef,
      externalMultiplier: externalMult,
    });

    const duration = getFastMoveDuration(bestTankFast.name);
    const speedFactor = duration <= 0.5 ? 2.2 : 1.0 / duration;
    const rawTankiness = (effDef * effHp) / Math.max(0.25, avgIncomingMult);

    tankScored.push({
      entry,
      fastMove: bestTankFast,
      chargedMove: entry.chargedMoves[0] || {
        id: 'struggle',
        name: 'Struggle',
        type: entry.types[0] || 'normal',
        power: 35,
        energy: 33,
        typeCategory: 'charged',
      },
      resolvedMaxMove: tankResolved,
      maxMoveDamage: tankMaxRes.damage,
      threeHitDamage: tankMaxRes.damage * 3,
      typeMultiplier: tankMaxRes.typeMultiplier,
      stab: tankMaxRes.stab,
      tankinessScore: Number((rawTankiness * speedFactor).toFixed(0)),
      hasHalfSecondFast: duration <= 0.5,
      resistanceFactorAgainstBoss: Number(avgIncomingMult.toFixed(3)),
      pureMaxHitsToKo: Math.max(1, Math.ceil(boss.hp / Math.max(1, tankMaxRes.damage))),
    });
  }

  attackerScored.sort(
    (a, b) => b.maxMoveDamage - a.maxMoveDamage || b.tankinessScore - a.tankinessScore
  );

  // Deduplicate species in top lists (prefer G-Max over D-Max of same species unless distinct)
  const dedupeBySpecies = (list: MaxCounterCandidate[], limit: number) => {
    const out: MaxCounterCandidate[] = [];
    const seen = new Set<string>();
    for (const item of list) {
      const k = `${item.entry.pokemonId}-${item.entry.formId || 'base'}`;
      if (!seen.has(k)) {
        seen.add(k);
        out.push(item);
      }
      if (out.length >= limit) break;
    }
    return out;
  };

  const topAttackers = dedupeBySpecies(attackerScored, 12);

  tankScored.sort((a, b) => {
    if (a.hasHalfSecondFast !== b.hasHalfSecondFast) {
      return a.hasHalfSecondFast ? -1 : 1;
    }
    return b.tankinessScore - a.tankinessScore;
  });
  const topTanks = dedupeBySpecies(tankScored, 10);

  const recommendedTeam = assembleRecommendedTeam({
    topAttackers,
    topTanks,
    teamPattern,
    defaultLevel: attackerLevel,
    defaultMaxLevel: maxMoveLevel,
  });

  return {
    recommendedTeam,
    topAttackers,
    topTanks,
  };
}

function assembleRecommendedTeam(params: {
  topAttackers: MaxCounterCandidate[];
  topTanks: MaxCounterCandidate[];
  teamPattern: '2-tanks-1-attacker' | '1-tank-2-attackers';
  defaultLevel: number;
  defaultMaxLevel: MaxMoveLevel;
  overridesByKey?: Map<
    string,
    {
      level: number;
      ivAtk: number;
      ivDef: number;
      ivHp: number;
      maxAttackLevel?: MaxMoveLevel;
      maxGuardLevel?: MaxSupportLevel;
      maxSpiritLevel?: MaxSupportLevel;
    }
  >;
}): MaxBattleUnitConfig[] {
  const {
    topAttackers,
    topTanks,
    teamPattern,
    defaultLevel,
    defaultMaxLevel,
    overridesByKey,
  } = params;

  if (topAttackers.length === 0 && topTanks.length === 0) return [];

  const toUnitConfig = (
    cand: MaxCounterCandidate,
    slotIndex: 0 | 1 | 2,
    role: MaxUnitRole
  ): MaxBattleUnitConfig => {
    const ov = overridesByKey?.get(cand.entry.key);
    return {
      slotIndex,
      pokemonId: cand.entry.pokemonId,
      formId: cand.entry.formId,
      name: cand.entry.displayNameEs,
      types: cand.entry.types,
      baseAttack: cand.entry.baseAttack,
      baseDefense: cand.entry.baseDefense,
      baseStamina: cand.entry.baseStamina,
      spriteUrl: cand.entry.spriteUrl,
      level: ov?.level ?? defaultLevel,
      ivAtk: ov?.ivAtk ?? 15,
      ivDef: ov?.ivDef ?? 15,
      ivHp: ov?.ivHp ?? 15,
      isGigantamax: cand.entry.isGigantamax,
      gmaxVariantIndex: cand.entry.gmaxVariantIndex,
      role,
      fastMove: cand.fastMove,
      chargedMove: cand.chargedMove,
      useChargedInSmallPhase: false,
      maxAttackLevel: ov?.maxAttackLevel ?? (role === 'charger' ? 1 : defaultMaxLevel),
      maxGuardLevel: ov?.maxGuardLevel ?? (role === 'charger' ? 3 : 0),
      maxSpiritLevel: ov?.maxSpiritLevel ?? (role === 'charger' ? 2 : 0),
    };
  };

  const recommendedTeam: MaxBattleUnitConfig[] = [];
  const mainAttacker = topAttackers[0] || topTanks[0];
  const secondaryAttacker =
    topAttackers.find((a) => a.entry.key !== mainAttacker.entry.key) || mainAttacker;
  const primaryTank = topTanks[0] || mainAttacker;
  const secondaryTank =
    topTanks.find((t) => t.entry.key !== primaryTank.entry.key) || primaryTank;

  if (teamPattern === '2-tanks-1-attacker') {
    recommendedTeam.push(toUnitConfig(primaryTank, 0, 'charger'));
    recommendedTeam.push(toUnitConfig(secondaryTank, 1, 'charger'));
    recommendedTeam.push(toUnitConfig(mainAttacker, 2, 'attacker'));
  } else {
    recommendedTeam.push(toUnitConfig(primaryTank, 0, 'charger'));
    recommendedTeam.push(toUnitConfig(mainAttacker, 1, 'attacker'));
    recommendedTeam.push(toUnitConfig(secondaryAttacker, 2, 'hybrid'));
  }

  return recommendedTeam;
}

type UserPokemonWithMax = UserPokemon & {
  isDynamax?: boolean;
  isGigantamax?: boolean;
  maxAttackLevel?: MaxMoveLevel;
  maxGuardLevel?: MaxSupportLevel;
  maxSpiritLevel?: MaxSupportLevel;
};

export function generateMaxTeamFromInventory(params: {
  boss: MaxBossEntity;
  inventory: UserPokemonWithMax[];
  maxMoveLevel: MaxMoveLevel;
  modifiers: MaxModifiersConfig;
  teamPattern: '2-tanks-1-attacker' | '1-tank-2-attackers';
  onlyOfficialMax: boolean;
}): GeneratedMaxTeamResult {
  const { boss, inventory, maxMoveLevel, modifiers, teamPattern, onlyOfficialMax } = params;

  const zacianMult = modifiers.adventureEffect === 'zacian' ? 1.05 : 1.0;
  const zamazentaMult = modifiers.adventureEffect === 'zamazenta' ? 1.05 : 1.0;
  const externalMult = getCombinedExternalDamageMultiplier(modifiers);
  const bossDef = (boss.baseDefense + 15) * boss.cpm;

  const attackerScored: MaxCounterCandidate[] = [];
  const tankScored: MaxCounterCandidate[] = [];
  const overridesByKey = new Map<
    string,
    {
      level: number;
      ivAtk: number;
      ivDef: number;
      ivHp: number;
      maxAttackLevel?: MaxMoveLevel;
      maxGuardLevel?: MaxSupportLevel;
      maxSpiritLevel?: MaxSupportLevel;
    }
  >();

  for (const userPoke of inventory) {
    if (userPoke.isShadow) continue;

    let basePoke: PogoPokemon | undefined;
    let specialForm: SpecialForm | undefined;
    for (const p of POGO_DATABASE) {
      if (
        p.id.toString() === userPoke.speciesId ||
        p.name.toLowerCase() === userPoke.name.toLowerCase()
      ) {
        basePoke = p;
        break;
      }
      const forms = p.specialForms || p.megaForms;
      if (forms) {
        const found = forms.find(
          (f) =>
            `${p.id}-${f.id}` === userPoke.speciesId ||
            f.name.toLowerCase() === userPoke.name.toLowerCase()
        );
        if (found) {
          basePoke = p;
          specialForm = found;
          break;
        }
      }
    }

    if (!basePoke) continue;
    const isOfficial =
      OFFICIAL_MAX_ELIGIBLE_IDS.has(basePoke.id) ||
      specialForm?.id === 'zacian_crowned' ||
      specialForm?.id === 'zamazenta_crowned' ||
      Boolean(userPoke.isDynamax) ||
      Boolean(userPoke.isGigantamax);
    if (onlyOfficialMax && !isOfficial) continue;

    const types = specialForm ? specialForm.types : basePoke.types;
    const baseAtk = specialForm ? specialForm.baseAttack : basePoke.baseAttack;
    const baseDef = specialForm ? specialForm.baseDefense : basePoke.baseDefense;
    const baseSta = specialForm ? specialForm.baseStamina : basePoke.baseStamina;
    const spriteUrl = specialForm ? specialForm.spriteUrl : basePoke.spriteUrl;
    const fastPool =
      specialForm?.fastMoves && specialForm.fastMoves.length > 0
        ? specialForm.fastMoves
        : basePoke.fastMoves;
    const chargedPool =
      specialForm?.chargedMoves && specialForm.chargedMoves.length > 0
        ? specialForm.chargedMoves
        : basePoke.chargedMoves;

    if (fastPool.length === 0) continue;

    const fastMove =
      fastPool.find((m) => m.name.toLowerCase() === userPoke.fastMove?.toLowerCase()) ||
      fastPool[0];
    const chargedMove =
      chargedPool.find((m) => m.name.toLowerCase() === userPoke.chargedMove1?.toLowerCase()) ||
      chargedPool[0] || {
        id: 'struggle',
        name: 'Struggle',
        type: types[0] || 'normal',
        power: 35,
        energy: 33,
        typeCategory: 'charged' as const,
      };

    const gmaxAvailable = Boolean(GIGANTAMAX_SPECIES[basePoke.id]);
    const isNicknameGmax =
      (userPoke.nickname || '').toLowerCase().includes('gmax') ||
      (userPoke.nickname || '').toLowerCase().includes('gigamax') ||
      userPoke.name.toLowerCase().includes('gmax') ||
      userPoke.name.toLowerCase().includes('gigamax');
    const isGmax = gmaxAvailable && (Boolean(userPoke.isGigantamax) || isNicknameGmax);
    const effectiveMaxMoveLevel: MaxMoveLevel = userPoke.maxAttackLevel || maxMoveLevel;

    const cpm = getCPM(userPoke.level || 40);
    const effAtk = (baseAtk + (userPoke.ivAtk ?? 15)) * cpm * zacianMult;
    const effDef = (baseDef + (userPoke.ivDef ?? 15)) * cpm * zamazentaMult;
    const effHp = Math.max(10, Math.floor((baseSta + (userPoke.ivHp ?? 15)) * cpm));

    const resolved = resolvePokemonMaxMove({
      pokemonId: basePoke.id,
      formId: specialForm?.id,
      fastMove,
      isGigantamax: isGmax,
      baseLevel: effectiveMaxMoveLevel,
      adventureEffect: modifiers.adventureEffect,
    });

    const dmgRes = calculateMaxMoveDamageValue({
      power: resolved.power,
      moveType: resolved.type,
      attackerTypes: types,
      attackerEffectiveAtk: effAtk,
      defenderTypes: boss.types,
      defenderEffectiveDef: bossDef,
      externalMultiplier: externalMult,
    });

    const incomingMults = boss.types.map((bt) => getPogoTypeEffectiveness(bt, types));
    const avgIncomingMult =
      incomingMults.length > 0
        ? incomingMults.reduce((sum, v) => sum + v, 0) / incomingMults.length
        : 1.0;

    const duration = getFastMoveDuration(fastMove.name);
    const speedFactor = duration <= 0.5 ? 2.2 : 1.0 / duration;
    const rawTankiness = (effDef * effHp) / Math.max(0.25, avgIncomingMult);

    const entryKey = `inv-${userPoke.id}`;
    overridesByKey.set(entryKey, {
      level: userPoke.level || 40,
      ivAtk: userPoke.ivAtk ?? 15,
      ivDef: userPoke.ivDef ?? 15,
      ivHp: userPoke.ivHp ?? 15,
      maxAttackLevel: userPoke.maxAttackLevel,
      maxGuardLevel: userPoke.maxGuardLevel,
      maxSpiritLevel: userPoke.maxSpiritLevel,
    });

    const entry: MaxRosterEntry = {
      key: entryKey,
      pokemonId: basePoke.id,
      formId: specialForm?.id,
      name: userPoke.name,
      displayNameEs: `${userPoke.nickname || userPoke.name} (PC ${userPoke.cp})`,
      displayNameEn: `${userPoke.nickname || userPoke.name} (CP ${userPoke.cp})`,
      types,
      baseAttack: baseAtk,
      baseDefense: baseDef,
      baseStamina: baseSta,
      spriteUrl,
      fastMoves: fastPool,
      chargedMoves: chargedPool,
      isGigantamax: isGmax,
      isOfficialMax: isOfficial,
    };

    const cand: MaxCounterCandidate = {
      entry,
      fastMove,
      chargedMove,
      resolvedMaxMove: resolved,
      maxMoveDamage: dmgRes.damage,
      threeHitDamage: dmgRes.damage * 3,
      typeMultiplier: dmgRes.typeMultiplier,
      stab: dmgRes.stab,
      tankinessScore: Number((rawTankiness * speedFactor).toFixed(0)),
      hasHalfSecondFast: duration <= 0.5,
      resistanceFactorAgainstBoss: Number(avgIncomingMult.toFixed(3)),
      pureMaxHitsToKo: Math.max(1, Math.ceil(boss.hp / Math.max(1, dmgRes.damage))),
    };

    attackerScored.push(cand);
    tankScored.push(cand);
  }

  attackerScored.sort(
    (a, b) => b.maxMoveDamage - a.maxMoveDamage || b.tankinessScore - a.tankinessScore
  );
  tankScored.sort((a, b) => {
    if (a.hasHalfSecondFast !== b.hasHalfSecondFast) {
      return a.hasHalfSecondFast ? -1 : 1;
    }
    return b.tankinessScore - a.tankinessScore;
  });

  const topAttackers = attackerScored.slice(0, 12);
  const topTanks = tankScored.slice(0, 10);

  const recommendedTeam = assembleRecommendedTeam({
    topAttackers,
    topTanks,
    teamPattern,
    defaultLevel: 40,
    defaultMaxLevel: maxMoveLevel,
    overridesByKey,
  });

  return {
    recommendedTeam,
    topAttackers,
    topTanks,
  };
}

export function createMaxBossFromPokemon(
  p: PogoPokemon,
  options?: { formId?: string; isGigantamax?: boolean; tier?: MaxBossTier }
): MaxBossEntity {
  const forms = p.specialForms || p.megaForms;
  const foundForm: SpecialForm | undefined =
    options?.formId && forms ? forms.find((f) => f.id === options.formId) : undefined;

  const isGmax = Boolean(options?.isGigantamax && GIGANTAMAX_SPECIES[p.id]);
  const gmaxSpec = isGmax ? GIGANTAMAX_SPECIES[p.id]?.[0] : undefined;

  const defaultTier: MaxBossTier =
    options?.tier ||
    (isGmax
      ? 6
      : p.id === 890 ||
        p.id === 144 ||
        p.id === 145 ||
        p.id === 146 ||
        p.id === 243 ||
        p.id === 244 ||
        p.id === 245 ||
        p.id === 380 ||
        p.id === 381 ||
        p.id === 249 ||
        p.id === 250
      ? 5
      : p.baseAttack >= 190
      ? 3
      : 1);

  const tierSpec = MAX_BOSS_TIERS[defaultTier];

  return {
    id: foundForm ? `${p.id}-${foundForm.id}` : isGmax ? `${p.id}-gmax` : `${p.id}`,
    pokemonId: p.id,
    formId: foundForm?.id,
    name: gmaxSpec ? gmaxSpec.labelEs : foundForm ? foundForm.name : p.name,
    types: foundForm ? foundForm.types : p.types,
    baseAttack: foundForm ? foundForm.baseAttack : p.baseAttack,
    baseDefense: foundForm ? foundForm.baseDefense : p.baseDefense,
    baseStamina: foundForm ? foundForm.baseStamina : p.baseStamina,
    spriteUrl: foundForm ? foundForm.spriteUrl : p.spriteUrl,
    isGigantamax: isGmax,
    tier: defaultTier,
    hp: tierSpec.defaultHp,
    cpm: tierSpec.defaultCpm,
  };
}
