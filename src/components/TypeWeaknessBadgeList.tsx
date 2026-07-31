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
  normal: 'bg-neutral-600 text-white border border-neutral-700 shadow-2xs font-black',
  fire: 'bg-gradient-to-r from-red-600 to-amber-600 text-white border border-red-700 shadow-2xs font-black',
  water: 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border border-blue-700 shadow-2xs font-black',
  grass: 'bg-gradient-to-r from-emerald-600 to-green-600 text-white border border-emerald-700 shadow-2xs font-black',
  electric: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 border border-amber-600 shadow-2xs font-black',
  ice: 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white border border-cyan-700 shadow-2xs font-black',
  fighting: 'bg-gradient-to-r from-red-700 to-rose-800 text-white border border-red-900 shadow-2xs font-black',
  poison: 'bg-gradient-to-r from-purple-600 to-fuchsia-700 text-white border border-purple-800 shadow-2xs font-black',
  ground: 'bg-gradient-to-r from-amber-700 to-yellow-800 text-white border border-amber-900 shadow-2xs font-black',
  flying: 'bg-gradient-to-r from-indigo-500 to-sky-600 text-white border border-indigo-700 shadow-2xs font-black',
  psychic: 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border border-pink-700 shadow-2xs font-black',
  bug: 'bg-gradient-to-r from-lime-600 to-emerald-600 text-white border border-lime-700 shadow-2xs font-black',
  rock: 'bg-gradient-to-r from-stone-600 to-neutral-700 text-white border border-stone-800 shadow-2xs font-black',
  ghost: 'bg-gradient-to-r from-violet-700 to-purple-900 text-white border border-violet-900 shadow-2xs font-black',
  dragon: 'bg-gradient-to-r from-indigo-700 to-violet-800 text-white border border-indigo-900 shadow-2xs font-black',
  dark: 'bg-gradient-to-r from-slate-800 to-neutral-900 text-white border border-slate-950 shadow-2xs font-black',
  steel: 'bg-gradient-to-r from-slate-600 to-zinc-700 text-white border border-slate-700 shadow-2xs font-black',
  fairy: 'bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white border border-pink-600 shadow-2xs font-black',
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


