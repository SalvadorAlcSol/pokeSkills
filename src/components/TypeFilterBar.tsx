import React from 'react';
import { PokemonType } from '../data/pokemonData';
import { useLanguage } from '../context/LanguageContext';
import { getTypeLabel } from '../utils/pogoTypeTranslator';
import { Filter, X } from 'lucide-react';

interface TypeFilterBarProps {
  selectedTypes: PokemonType[];
  onToggleType: (type: PokemonType) => void;
  onClearTypes: () => void;
}

const ALL_POKEMON_TYPES: PokemonType[] = [
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

const TYPE_STYLES: Record<PokemonType, { active: string; inactive: string }> = {
  normal: {
    active: 'bg-neutral-600 text-white border-neutral-700 shadow-sm font-extrabold',
    inactive: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-extrabold',
  },
  fire: {
    active: 'bg-red-600 text-white border-red-700 shadow-sm font-extrabold',
    inactive: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-extrabold',
  },
  water: {
    active: 'bg-blue-600 text-white border-blue-700 shadow-sm font-extrabold',
    inactive: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-extrabold',
  },
  grass: {
    active: 'bg-emerald-600 text-white border-emerald-700 shadow-sm font-extrabold',
    inactive: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-extrabold',
  },
  electric: {
    active: 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm font-black',
    inactive: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-extrabold',
  },
  ice: {
    active: 'bg-cyan-500 text-white border-cyan-600 shadow-sm font-extrabold',
    inactive: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-extrabold',
  },
  fighting: {
    active: 'bg-red-700 text-white border-red-800 shadow-sm font-extrabold',
    inactive: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-extrabold',
  },
  poison: {
    active: 'bg-purple-600 text-white border-purple-700 shadow-sm font-extrabold',
    inactive: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-extrabold',
  },
  ground: {
    active: 'bg-amber-700 text-white border-amber-800 shadow-sm font-extrabold',
    inactive: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-extrabold',
  },
  flying: {
    active: 'bg-indigo-500 text-white border-indigo-600 shadow-sm font-extrabold',
    inactive: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-extrabold',
  },
  psychic: {
    active: 'bg-pink-600 text-white border-pink-700 shadow-sm font-extrabold',
    inactive: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-extrabold',
  },
  bug: {
    active: 'bg-lime-600 text-white border-lime-700 shadow-sm font-extrabold',
    inactive: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-extrabold',
  },
  rock: {
    active: 'bg-stone-600 text-white border-stone-700 shadow-sm font-extrabold',
    inactive: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-extrabold',
  },
  ghost: {
    active: 'bg-violet-700 text-white border-violet-800 shadow-sm font-extrabold',
    inactive: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-extrabold',
  },
  dragon: {
    active: 'bg-indigo-700 text-white border-indigo-800 shadow-sm font-extrabold',
    inactive: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-extrabold',
  },
  dark: {
    active: 'bg-slate-800 text-white border-slate-900 shadow-sm font-extrabold',
    inactive: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-extrabold',
  },
  steel: {
    active: 'bg-slate-600 text-white border-slate-700 shadow-sm font-extrabold',
    inactive: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-extrabold',
  },
  fairy: {
    active: 'bg-pink-500 text-white border-pink-600 shadow-sm font-extrabold',
    inactive: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-extrabold',
  },
};

export const TypeFilterBar: React.FC<TypeFilterBarProps> = ({
  selectedTypes,
  onToggleType,
  onClearTypes,
}) => {
  const { t, language } = useLanguage();

  return (
    <div className="space-y-1.5 font-sans">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-red-600" />
          {t.filterByType}
        </label>

        {selectedTypes.length > 0 && (
          <button
            type="button"
            onClick={onClearTypes}
            className="text-[10px] text-white hover:bg-red-700 flex items-center gap-1 bg-red-600 px-2.5 py-0.5 rounded-full font-extrabold shadow-2xs transition-all"
          >
            <X className="w-3 h-3" />
            <span>{t.clearFilters} ({selectedTypes.length})</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={onClearTypes}
          className={`px-2 py-0.5 rounded text-[10px] uppercase transition-all border ${
            selectedTypes.length === 0
              ? 'bg-red-600 text-white font-extrabold border-red-700 shadow-sm'
              : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200 font-bold'
          }`}
        >
          {t.allTypes}
        </button>

        {ALL_POKEMON_TYPES.map((type) => {
          const isSelected = selectedTypes.includes(type);
          const styles = TYPE_STYLES[type];

          return (
            <button
              key={type}
              type="button"
              onClick={() => onToggleType(type)}
              className={`px-2 py-0.5 rounded text-[10px] uppercase transition-all border ${
                isSelected ? styles.active : styles.inactive
              }`}
            >
              {getTypeLabel(type, language)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

