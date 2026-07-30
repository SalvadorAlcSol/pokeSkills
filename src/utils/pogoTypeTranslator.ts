import { PokemonType } from '../data/pokemonData';
import { Language } from '../context/LanguageContext';

const SPANISH_TYPE_NAMES: Record<PokemonType, string> = {
  normal: 'NORMAL',
  fire: 'FUEGO',
  water: 'AGUA',
  grass: 'PLANTA',
  electric: 'ELÉCTRICO',
  ice: 'HIELO',
  fighting: 'LUCHA',
  poison: 'VENENO',
  ground: 'TIERRA',
  flying: 'VOLADOR',
  psychic: 'PSÍQUICO',
  bug: 'BICHO',
  rock: 'ROCA',
  ghost: 'FANTASMA',
  dragon: 'DRAGÓN',
  dark: 'SINIESTRO',
  steel: 'ACERO',
  fairy: 'HADA',
};

const ENGLISH_TYPE_NAMES: Record<PokemonType, string> = {
  normal: 'NORMAL',
  fire: 'FIRE',
  water: 'WATER',
  grass: 'GRASS',
  electric: 'ELECTRIC',
  ice: 'ICE',
  fighting: 'FIGHTING',
  poison: 'POISON',
  ground: 'GROUND',
  flying: 'FLYING',
  psychic: 'PSYCHIC',
  bug: 'BUG',
  rock: 'ROCK',
  ghost: 'GHOST',
  dragon: 'DRAGON',
  dark: 'DARK',
  steel: 'STEEL',
  fairy: 'FAIRY',
};

export function getTypeLabel(type: PokemonType, lang: Language): string {
  if (lang === 'es') {
    return SPANISH_TYPE_NAMES[type] || type.toUpperCase();
  }
  return ENGLISH_TYPE_NAMES[type] || type.toUpperCase();
}
