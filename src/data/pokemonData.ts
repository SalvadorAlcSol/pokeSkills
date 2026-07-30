export type PokemonType =
  | 'normal'
  | 'fire'
  | 'water'
  | 'grass'
  | 'electric'
  | 'ice'
  | 'fighting'
  | 'poison'
  | 'ground'
  | 'flying'
  | 'psychic'
  | 'bug'
  | 'rock'
  | 'ghost'
  | 'dragon'
  | 'dark'
  | 'steel'
  | 'fairy';

export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

export interface PokemonData {
  id: number;
  name: string;
  types: PokemonType[];
  stats: PokemonStats;
  spriteUrl: string;
}

export interface MoveData {
  id: string;
  name: string;
  type: PokemonType;
  category: 'physical' | 'special';
  power: number;
  accuracy: number;
}

// Type Effectiveness Matrix: Attacker Type -> Defender Type -> Multiplier
export const TYPE_CHART: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  electric: { water: 2, grass: 0.5, electric: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, grass: 0.5, electric: 2, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { grass: 2, electric: 0.5, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

// Popular Pokemon list with base stats and PokéAPI sprites
export const POKEMON_LIST: PokemonData[] = [
  {
    id: 6,
    name: 'Charizard',
    types: ['fire', 'flying'],
    stats: { hp: 78, attack: 84, defense: 78, spAttack: 109, spDefense: 85, speed: 100 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
  },
  {
    id: 3,
    name: 'Venusaur',
    types: ['grass', 'poison'],
    stats: { hp: 80, attack: 82, defense: 83, spAttack: 100, spDefense: 100, speed: 80 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png',
  },
  {
    id: 9,
    name: 'Blastoise',
    types: ['water'],
    stats: { hp: 79, attack: 83, defense: 100, spAttack: 85, spDefense: 105, speed: 78 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png',
  },
  {
    id: 25,
    name: 'Pikachu',
    types: ['electric'],
    stats: { hp: 35, attack: 55, defense: 40, spAttack: 50, spDefense: 50, speed: 90 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
  },
  {
    id: 150,
    name: 'Mewtwo',
    types: ['psychic'],
    stats: { hp: 106, attack: 110, defense: 90, spAttack: 154, spDefense: 90, speed: 130 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png',
  },
  {
    id: 149,
    name: 'Dragonite',
    types: ['dragon', 'flying'],
    stats: { hp: 91, attack: 134, defense: 95, spAttack: 100, spDefense: 100, speed: 80 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png',
  },
  {
    id: 248,
    name: 'Tyranitar',
    types: ['rock', 'dark'],
    stats: { hp: 100, attack: 134, defense: 110, spAttack: 95, spDefense: 100, speed: 61 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/248.png',
  },
  {
    id: 384,
    name: 'Rayquaza',
    types: ['dragon', 'flying'],
    stats: { hp: 105, attack: 150, defense: 90, spAttack: 150, spDefense: 90, speed: 95 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/384.png',
  },
  {
    id: 445,
    name: 'Garchomp',
    types: ['dragon', 'ground'],
    stats: { hp: 108, attack: 130, defense: 95, spAttack: 80, spDefense: 85, speed: 102 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/445.png',
  },
  {
    id: 448,
    name: 'Lucario',
    types: ['fighting', 'steel'],
    stats: { hp: 70, attack: 110, defense: 70, spAttack: 115, spDefense: 70, speed: 90 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png',
  },
  {
    id: 94,
    name: 'Gengar',
    types: ['ghost', 'poison'],
    stats: { hp: 60, attack: 65, defense: 60, spAttack: 130, spDefense: 75, speed: 110 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png',
  },
  {
    id: 130,
    name: 'Gyarados',
    types: ['water', 'flying'],
    stats: { hp: 95, attack: 125, defense: 79, spAttack: 60, spDefense: 100, speed: 81 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/130.png',
  },
  {
    id: 282,
    name: 'Gardevoir',
    types: ['psychic', 'fairy'],
    stats: { hp: 68, attack: 65, defense: 65, spAttack: 125, spDefense: 115, speed: 80 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/282.png',
  },
  {
    id: 212,
    name: 'Scizor',
    types: ['bug', 'steel'],
    stats: { hp: 70, attack: 130, defense: 100, spAttack: 55, spDefense: 80, speed: 65 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/212.png',
  },
  {
    id: 143,
    name: 'Snorlax',
    types: ['normal'],
    stats: { hp: 160, attack: 110, defense: 65, spAttack: 65, spDefense: 110, speed: 30 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png',
  },
  {
    id: 373,
    name: 'Salamence',
    types: ['dragon', 'flying'],
    stats: { hp: 95, attack: 135, defense: 80, spAttack: 110, spDefense: 80, speed: 100 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/373.png',
  },
  {
    id: 376,
    name: 'Metagross',
    types: ['steel', 'psychic'],
    stats: { hp: 80, attack: 135, defense: 130, spAttack: 95, spDefense: 90, speed: 70 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/376.png',
  },
  {
    id: 131,
    name: 'Lapras',
    types: ['water', 'ice'],
    stats: { hp: 130, attack: 85, defense: 80, spAttack: 85, spDefense: 95, speed: 60 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/131.png',
  },
  {
    id: 257,
    name: 'Blaziken',
    types: ['fire', 'fighting'],
    stats: { hp: 80, attack: 120, defense: 70, spAttack: 110, spDefense: 70, speed: 80 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/257.png',
  },
  {
    id: 254,
    name: 'Sceptile',
    types: ['grass'],
    stats: { hp: 70, attack: 85, defense: 65, spAttack: 105, spDefense: 85, speed: 120 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/254.png',
  },
  {
    id: 260,
    name: 'Swampert',
    types: ['water', 'ground'],
    stats: { hp: 100, attack: 110, defense: 90, spAttack: 85, spDefense: 90, speed: 60 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/260.png',
  },
  {
    id: 479,
    name: 'Rotom-Wash',
    types: ['electric', 'water'],
    stats: { hp: 50, attack: 65, defense: 107, spAttack: 105, spDefense: 107, speed: 86 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/479.png',
  },
  {
    id: 778,
    name: 'Mimikyu',
    types: ['ghost', 'fairy'],
    stats: { hp: 55, attack: 90, defense: 80, spAttack: 50, spDefense: 105, speed: 96 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/778.png',
  },
  {
    id: 658,
    name: 'Greninja',
    types: ['water', 'dark'],
    stats: { hp: 72, attack: 95, defense: 67, spAttack: 103, spDefense: 71, speed: 122 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/658.png',
  },
  {
    id: 700,
    name: 'Sylveon',
    types: ['fairy'],
    stats: { hp: 95, attack: 65, defense: 65, spAttack: 110, spDefense: 130, speed: 60 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/700.png',
  },
  {
    id: 197,
    name: 'Umbreon',
    types: ['dark'],
    stats: { hp: 95, attack: 65, defense: 110, spAttack: 60, spDefense: 130, speed: 65 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/197.png',
  },
  {
    id: 136,
    name: 'Flareon',
    types: ['fire'],
    stats: { hp: 65, attack: 130, defense: 60, spAttack: 95, spDefense: 110, speed: 65 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/136.png',
  },
  {
    id: 134,
    name: 'Vaporeon',
    types: ['water'],
    stats: { hp: 130, attack: 65, defense: 60, spAttack: 110, spDefense: 95, speed: 65 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/134.png',
  },
  {
    id: 135,
    name: 'Jolteon',
    types: ['electric'],
    stats: { hp: 65, attack: 65, defense: 60, spAttack: 110, spDefense: 95, speed: 130 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/135.png',
  },
  {
    id: 196,
    name: 'Espeon',
    types: ['psychic'],
    stats: { hp: 65, attack: 65, defense: 60, spAttack: 130, spDefense: 95, speed: 110 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/196.png',
  },
  {
    id: 470,
    name: 'Leafeon',
    types: ['grass'],
    stats: { hp: 65, attack: 110, defense: 130, spAttack: 60, spDefense: 65, speed: 95 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/470.png',
  },
  {
    id: 471,
    name: 'Glaceon',
    types: ['ice'],
    stats: { hp: 65, attack: 60, defense: 110, spAttack: 130, spDefense: 95, speed: 65 },
    spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/471.png',
  },
];

// Pre-defined signature and common moves
export const MOVES_LIST: MoveData[] = [
  { id: 'flamethrower', name: 'Flamethrower (Lanzallamas)', type: 'fire', category: 'special', power: 90, accuracy: 100 },
  { id: 'fire_blast', name: 'Fire Blast (Llamarada)', type: 'fire', category: 'special', power: 110, accuracy: 85 },
  { id: 'flare_blitz', name: 'Flare Blitz (Envite Ígneo)', type: 'fire', category: 'physical', power: 120, accuracy: 100 },
  { id: 'hydro_pump', name: 'Hydro Pump (Hidrobomba)', type: 'water', category: 'special', power: 110, accuracy: 80 },
  { id: 'surf', name: 'Surf (Surf)', type: 'water', category: 'special', power: 90, accuracy: 100 },
  { id: 'water_fall', name: 'Waterfall (Cascada)', type: 'water', category: 'physical', power: 80, accuracy: 100 },
  { id: 'solar_beam', name: 'Solar Beam (Rayo Solar)', type: 'grass', category: 'special', power: 120, accuracy: 100 },
  { id: 'energy_ball', name: 'Energy Ball (Energibola)', type: 'grass', category: 'special', power: 90, accuracy: 100 },
  { id: 'wood_hammer', name: 'Wood Hammer (Mazazo)', type: 'grass', category: 'physical', power: 120, accuracy: 100 },
  { id: 'thunderbolt', name: 'Thunderbolt (Rayo)', type: 'electric', category: 'special', power: 90, accuracy: 100 },
  { id: 'thunder', name: 'Thunder (Trueno)', type: 'electric', category: 'special', power: 110, accuracy: 70 },
  { id: 'wild_charge', name: 'Wild Charge (Voltio Cruel)', type: 'electric', category: 'physical', power: 90, accuracy: 100 },
  { id: 'ice_beam', name: 'Ice Beam (Rayo Hielo)', type: 'ice', category: 'special', power: 90, accuracy: 100 },
  { id: 'blizzard', name: 'Blizzard (Ventisca)', type: 'ice', category: 'special', power: 110, accuracy: 70 },
  { id: 'icicle_crash', name: 'Icicle Crash (Chuzos)', type: 'ice', category: 'physical', power: 85, accuracy: 90 },
  { id: 'close_combat', name: 'Close Combat (Abocajarro)', type: 'fighting', category: 'physical', power: 120, accuracy: 100 },
  { id: 'aura_sphere', name: 'Aura Sphere (Esfera Aural)', type: 'fighting', category: 'special', power: 80, accuracy: 100 },
  { id: 'sludge_bomb', name: 'Sludge Bomb (Bomba Lodo)', type: 'poison', category: 'special', power: 90, accuracy: 100 },
  { id: 'gunk_shot', name: 'Gunk Shot (Lanza Mugre)', type: 'poison', category: 'physical', power: 120, accuracy: 80 },
  { id: 'earthquake', name: 'Earthquake (Terremoto)', type: 'ground', category: 'physical', power: 100, accuracy: 100 },
  { id: 'earth_power', name: 'Earth Power (Tierra Viva)', type: 'ground', category: 'special', power: 90, accuracy: 100 },
  { id: 'air_slash', name: 'Air Slash (Tajo Aéreo)', type: 'flying', category: 'special', power: 75, accuracy: 95 },
  { id: 'brave_bird', name: 'Brave Bird (Pájaro Osado)', type: 'flying', category: 'physical', power: 120, accuracy: 100 },
  { id: 'psychic', name: 'Psychic (Psíquico)', type: 'psychic', category: 'special', power: 90, accuracy: 100 },
  { id: 'psystrike', name: 'Psystrike (Onda Mental)', type: 'psychic', category: 'special', power: 100, accuracy: 100 },
  { id: 'bug_buzz', name: 'Bug Buzz (Zumbido)', type: 'bug', category: 'special', power: 90, accuracy: 100 },
  { id: 'x_scissor', name: 'X-Scissor (Tijera X)', type: 'bug', category: 'physical', power: 80, accuracy: 100 },
  { id: 'stone_edge', name: 'Stone Edge (Roca Afilada)', type: 'rock', category: 'physical', power: 100, accuracy: 80 },
  { id: 'rock_slide', name: 'Rock Slide (Avalancha)', type: 'rock', category: 'physical', power: 75, accuracy: 90 },
  { id: 'shadow_ball', name: 'Shadow Ball (Bola Sombra)', type: 'ghost', category: 'special', power: 80, accuracy: 100 },
  { id: 'shadow_claw', name: 'Shadow Claw (Garra Umbría)', type: 'ghost', category: 'physical', power: 70, accuracy: 100 },
  { id: 'outrage', name: 'Outrage (Enfado)', type: 'dragon', category: 'physical', power: 120, accuracy: 100 },
  { id: 'dragon_pulse', name: 'Dragon Pulse (Pulso Dragón)', type: 'dragon', category: 'special', power: 85, accuracy: 100 },
  { id: 'draco_meteor', name: 'Draco Meteor (Cometa Draco)', type: 'dragon', category: 'special', power: 130, accuracy: 90 },
  { id: 'crunch', name: 'Crunch (Triturar)', type: 'dark', category: 'physical', power: 80, accuracy: 100 },
  { id: 'dark_pulse', name: 'Dark Pulse (Pulso Umbrío)', type: 'dark', category: 'special', power: 80, accuracy: 100 },
  { id: 'iron_head', name: 'Iron Head (Cabeza de Hierro)', type: 'steel', category: 'physical', power: 80, accuracy: 100 },
  { id: 'flash_cannon', name: 'Flash Cannon (Foco Resplandor)', type: 'steel', category: 'special', power: 80, accuracy: 100 },
  { id: 'moonblast', name: 'Moonblast (Fuerza Lunar)', type: 'fairy', category: 'special', power: 95, accuracy: 100 },
  { id: 'dazzling_gleam', name: 'Dazzling Gleam (Brillo Mágico)', type: 'fairy', category: 'special', power: 80, accuracy: 100 },
  { id: 'hyper_beam', name: 'Hyper Beam (Hiperrayo)', type: 'normal', category: 'special', power: 150, accuracy: 90 },
  { id: 'body_slam', name: 'Body Slam (Golpe Cuerpo)', type: 'normal', category: 'physical', power: 85, accuracy: 100 },
];
