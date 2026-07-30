import React from 'react';
import { PokemonType } from '../data/pokemonData';
import { useLanguage } from '../context/LanguageContext';
import { getPokemonWeaknessesAndResistances } from '../utils/pokemonMath';
import { getTypeLabel } from '../utils/pogoTypeTranslator';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

interface TypeWeaknessBadgeListProps {
  types: PokemonType[];
}

const BADGE_COLOR_CLASSES: Record<PokemonType, string> = {
  normal: 'bg-neutral-500 text-white font-bold',
  fire: 'bg-red-600 text-white font-bold',
  water: 'bg-blue-600 text-white font-bold',
  grass: 'bg-emerald-600 text-white font-bold',
  electric: 'bg-amber-400 text-slate-950 font-black',
  ice: 'bg-cyan-500 text-white font-bold',
  fighting: 'bg-red-700 text-white font-bold',
  poison: 'bg-purple-600 text-white font-bold',
  ground: 'bg-amber-700 text-white font-bold',
  flying: 'bg-indigo-500 text-white font-bold',
  psychic: 'bg-pink-600 text-white font-bold',
  bug: 'bg-lime-600 text-white font-bold',
  rock: 'bg-stone-600 text-white font-bold',
  ghost: 'bg-violet-700 text-white font-bold',
  dragon: 'bg-indigo-700 text-white font-bold',
  dark: 'bg-slate-800 text-white font-bold',
  steel: 'bg-slate-600 text-white font-bold',
  fairy: 'bg-pink-500 text-white font-bold',
};

export const TypeWeaknessBadgeList: React.FC<TypeWeaknessBadgeListProps> = ({ types }) => {
  const { t, language } = useLanguage();
  const { weaknesses, resistances } = getPokemonWeaknessesAndResistances(types);

  return (
    <div className="space-y-2.5 font-sans text-xs pt-3 border-t border-slate-200">
      {/* Debilidades Section */}
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-red-600 uppercase tracking-wider mb-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <span>{t.weaknessesTitle || 'Debilidades (Recibe +Daño)'}:</span>
        </div>

        {weaknesses.length === 0 ? (
          <span className="text-[10px] text-slate-500 italic font-medium">Ninguna debilidad</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {weaknesses.map(({ type, multiplier }) => (
              <span
                key={type}
                className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-lg font-bold shadow-2xs ${BADGE_COLOR_CLASSES[type]}`}
              >
                <span>{getTypeLabel(type, language)}</span>
                <span
                  className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                    multiplier >= 2.0
                      ? 'bg-red-950 text-yellow-300'
                      : 'bg-slate-900/30 text-white'
                  }`}
                >
                  {multiplier}x
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Resistencias / Fortalezas Section */}
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider mb-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{t.resistancesTitle || 'Resistencias / Fortalezas'}:</span>
        </div>

        {resistances.length === 0 ? (
          <span className="text-[10px] text-slate-500 italic font-medium">Ninguna resistencia</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {resistances.map(({ type, multiplier }) => (
              <span
                key={type}
                className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-lg font-bold shadow-2xs ${BADGE_COLOR_CLASSES[type]}`}
              >
                <span>{getTypeLabel(type, language)}</span>
                <span
                  className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                    multiplier <= 0.4
                      ? 'bg-slate-950 text-emerald-300'
                      : 'bg-slate-900/30 text-white'
                  }`}
                >
                  {multiplier}x
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


