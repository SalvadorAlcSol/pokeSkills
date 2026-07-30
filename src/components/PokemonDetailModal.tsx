import React, { useState } from 'react';
import { X, Swords, Shield, Sparkles, BookOpen, Trophy, Zap, Heart, Flame, Layers, Award, Edit3 } from 'lucide-react';
import { UserPokemon } from '../types/UserInventory';
import { getPokemonWeaknessesAndResistances } from '../utils/pokemonMath';
import { getTypeLabel } from '../utils/pogoTypeTranslator';
import { useLanguage } from '../context/LanguageContext';
import { getPokemonLore } from '../data/pokemonLoreData';
import { getPvpAnalysis, PvpLeague } from '../utils/pvpRecommender';
import { PokemonType } from '../data/pokemonData';

interface PokemonDetailModalProps {
  pokemon: UserPokemon;
  onClose: () => void;
  onEdit?: () => void;
}

const SOLID_TYPE_COLORS: Record<PokemonType, string> = {
  normal: 'bg-neutral-600 text-white border-neutral-700 font-extrabold',
  fire: 'bg-red-600 text-white border-red-700 font-extrabold',
  water: 'bg-blue-600 text-white border-blue-700 font-extrabold',
  grass: 'bg-emerald-600 text-white border-emerald-700 font-extrabold',
  electric: 'bg-amber-400 text-slate-950 border-amber-500 font-black',
  ice: 'bg-cyan-500 text-white border-cyan-600 font-extrabold',
  fighting: 'bg-red-700 text-white border-red-800 font-extrabold',
  poison: 'bg-purple-600 text-white border-purple-700 font-extrabold',
  ground: 'bg-amber-700 text-white border-amber-800 font-extrabold',
  flying: 'bg-indigo-500 text-white border-indigo-600 font-extrabold',
  psychic: 'bg-pink-600 text-white border-pink-700 font-extrabold',
  bug: 'bg-lime-600 text-white border-lime-700 font-extrabold',
  rock: 'bg-stone-600 text-white border-stone-700 font-extrabold',
  ghost: 'bg-violet-700 text-white border-violet-800 font-extrabold',
  dragon: 'bg-indigo-700 text-white border-indigo-800 font-extrabold',
  dark: 'bg-slate-800 text-white border-slate-900 font-extrabold',
  steel: 'bg-slate-600 text-white border-slate-700 font-extrabold',
  fairy: 'bg-pink-500 text-white border-pink-600 font-extrabold',
};

export const PokemonDetailModal: React.FC<PokemonDetailModalProps> = ({ pokemon, onClose, onEdit }) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'pvp' | 'weakness' | 'lore'>('pvp');
  const [selectedLeague, setSelectedLeague] = useState<PvpLeague>('great');

  // Type effectiveness analysis
  const { weaknesses, resistances } = getPokemonWeaknessesAndResistances(pokemon.types);

  // Lore & Trivia
  const lore = getPokemonLore(pokemon.name, pokemon.types);

  // PvP League Analysis & Teammate Trio recommendations
  const pvpInfo = getPvpAnalysis(pokemon.name, pokemon.types, selectedLeague);

  // Calculate IV Percentage
  const ivPercent = Math.round(((pokemon.ivAtk + pokemon.ivDef + pokemon.ivHp) / 45) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative custom-scrollbar max-h-[92vh] overflow-y-auto text-slate-900 flex flex-col gap-5">
        {/* Header Bar */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 p-2 border-2 border-slate-300 shadow-md shrink-0 flex items-center justify-center relative">
              <img
                src={pokemon.spriteUrl}
                alt={pokemon.name}
                className="w-full h-full object-contain drop-shadow-md"
              />
              {pokemon.isShadow && (
                <span className="absolute -bottom-1 -right-1 bg-purple-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md border border-purple-900 shadow-xs">
                  💀 OSCURO
                </span>
              )}
              {pokemon.isPurified && (
                <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md border border-blue-700 shadow-xs">
                  ✨ PURIFICADO
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {pokemon.name}
                </h2>
                <span className="text-xs font-black text-purple-700 bg-purple-100 border border-purple-300 px-2.5 py-0.5 rounded-full">
                  Nvl. {pokemon.level}
                </span>
              </div>

              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {pokemon.types.map((tItem) => (
                  <span
                    key={tItem}
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${SOLID_TYPE_COLORS[tItem]}`}
                  >
                    {getTypeLabel(tItem, language)}
                  </span>
                ))}
              </div>

              <div className="text-xs text-slate-600 font-extrabold mt-1.5 flex items-center gap-3">
                <span className="text-red-600 font-black">⚡ PC {pokemon.cp}</span>
                <span>•</span>
                <span className="text-emerald-700 font-black">🏆 IV {ivPercent}% ({pokemon.ivAtk}/{pokemon.ivDef}/{pokemon.ivHp})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 text-slate-700 hover:text-purple-700 bg-slate-100 hover:bg-purple-100 rounded-xl transition-all border border-slate-300 flex items-center gap-1 text-xs font-bold"
                title="Editar este Pokémon"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">Editar</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-300 text-xs font-black">
          <button
            onClick={() => setActiveTab('pvp')}
            className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 border ${
              activeTab === 'pvp'
                ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>⚔️ Equipos PvP</span>
          </button>

          <button
            onClick={() => setActiveTab('weakness')}
            className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 border ${
              activeTab === 'weakness'
                ? 'bg-red-600 text-white border-red-700 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>🛡️ Fortalezas / Debilidades</span>
          </button>

          <button
            onClick={() => setActiveTab('lore')}
            className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 border ${
              activeTab === 'lore'
                ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>📜 Historia & Lore</span>
          </button>
        </div>

        {/* TAB CONTENT 1: PVP TEAM RECOMMENDER & LEAGUE SELECTOR */}
        {activeTab === 'pvp' && (
          <div className="space-y-4">
            {/* League Selector Header */}
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                🏆 Selecciona la Liga de Combates GO:
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedLeague('great')}
                  className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 border ${
                    selectedLeague === 'great'
                      ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Trophy className="w-4 h-4 text-blue-200" />
                  <span>Liga Súper</span>
                  <span className="text-[10px] opacity-90 font-mono">CP ≤ 1500</span>
                </button>

                <button
                  onClick={() => setSelectedLeague('ultra')}
                  className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 border ${
                    selectedLeague === 'ultra'
                      ? 'bg-purple-600 text-white border-purple-700 shadow-md ring-2 ring-purple-500/20'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Swords className="w-4 h-4 text-purple-200" />
                  <span>Liga Ultra</span>
                  <span className="text-[10px] opacity-90 font-mono">CP ≤ 2500</span>
                </button>

                <button
                  onClick={() => setSelectedLeague('master')}
                  className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 border ${
                    selectedLeague === 'master'
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md ring-2 ring-amber-500/20'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Award className="w-4 h-4 text-slate-950" />
                  <span>Liga Master</span>
                  <span className="text-[10px] opacity-90 font-mono">Sin Límite</span>
                </button>
              </div>
            </div>

            {/* PVP Analysis Card */}
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-purple-200 pb-2.5">
                <div>
                  <span className="text-xs font-black text-purple-900 uppercase tracking-wider block">
                    Clasificación Meta & Rol Táctico
                  </span>
                  <span className="text-xs text-purple-700 font-bold">
                    {pvpInfo.pvpOverview}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-purple-700 text-white shadow-2xs border border-purple-900">
                    {pvpInfo.tier}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-400 text-slate-950 border border-amber-500 shadow-2xs">
                    {pvpInfo.role}
                  </span>
                </div>
              </div>

              {/* Optimal Movesets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-purple-200">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase block mb-0.5">⚡ Ataque Rápido Óptimo:</span>
                  <strong className="text-purple-900 font-black text-sm">{pvpInfo.optimalFastMove}</strong>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-purple-200">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase block mb-0.5">💥 Ataques Cargados Recomendados:</span>
                  <strong className="text-purple-900 font-black text-sm">{pvpInfo.optimalChargedMoves.join(' + ')}</strong>
                </div>
              </div>
            </div>

            {/* Recommended 3-Pokemon Team Trio */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Trío de Combate Recomendado (Mejores Compañeros):
                </h4>
                <span className="text-[10px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-300">
                  Cobertura de Debilidades
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pvpInfo.recommendedTeammates.map((teammate, idx) => (
                  <div
                    key={teammate.name + idx}
                    className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 shadow-sm flex flex-col justify-between gap-2.5 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={teammate.spriteUrl}
                        alt={teammate.name}
                        className="w-12 h-12 object-contain drop-shadow-sm shrink-0"
                      />
                      <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase block">Compañero #{idx + 2}</span>
                        <h5 className="font-extrabold text-sm text-slate-900">{teammate.name}</h5>
                        <div className="flex items-center gap-1 mt-0.5">
                          {teammate.types.map((tItem) => (
                            <span
                              key={tItem}
                              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${SOLID_TYPE_COLORS[tItem]}`}
                            >
                              {getTypeLabel(tItem, language)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                      <div className="text-slate-700 font-bold">
                        ⚔️ <strong className="text-slate-900">{teammate.recommendedFastMove}</strong> + {teammate.recommendedChargedMoves.join(' / ')}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-snug font-medium">
                        {teammate.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT 2: WEAKNESSES & RESISTANCES */}
        {activeTab === 'weakness' && (
          <div className="space-y-4">
            {/* Weaknesses List */}
            <div className="bg-red-50/70 border-2 border-red-200 rounded-2xl p-4 space-y-2.5">
              <h4 className="text-xs font-black uppercase text-red-900 tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-red-600 fill-red-600" />
                Debilidades (Recibe Más Daño):
              </h4>

              {weaknesses.length === 0 ? (
                <p className="text-xs text-slate-600 font-bold">¡Este Pokémon no posee debilidades registradas!</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {weaknesses.map(({ type, multiplier }) => (
                    <div
                      key={type}
                      className="flex items-center gap-1.5 bg-white border border-red-300 px-3 py-1.5 rounded-xl shadow-2xs"
                    >
                      <span className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded-md border ${SOLID_TYPE_COLORS[type]}`}>
                        {getTypeLabel(type, language)}
                      </span>
                      <span className="text-xs font-black text-red-700">
                        {multiplier.toFixed(2)}x
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resistances List */}
            <div className="bg-emerald-50/70 border-2 border-emerald-200 rounded-2xl p-4 space-y-2.5">
              <h4 className="text-xs font-black uppercase text-emerald-900 tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                Resistencias e Inmunidades (Recibe Menos Daño):
              </h4>

              {resistances.length === 0 ? (
                <p className="text-xs text-slate-600 font-bold">Este Pokémon no posee resistencias de tipo particulares.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {resistances.map(({ type, multiplier }) => (
                    <div
                      key={type}
                      className="flex items-center gap-1.5 bg-white border border-emerald-300 px-3 py-1.5 rounded-xl shadow-2xs"
                    >
                      <span className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded-md border ${SOLID_TYPE_COLORS[type]}`}>
                        {getTypeLabel(type, language)}
                      </span>
                      <span className="text-xs font-black text-emerald-700">
                        {multiplier.toFixed(2)}x
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB CONTENT 3: LORE, STORY & FUN FACTS */}
        {activeTab === 'lore' && (
          <div className="space-y-4">
            {/* Story Card */}
            <div className="bg-blue-50/70 border-2 border-blue-200 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-black uppercase text-blue-900 tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Historia de Pokédex:
              </h4>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {lore.story}
              </p>
            </div>

            {/* Biology Card */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-pink-600" />
                Biología & Comportamiento:
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {lore.biology}
              </p>
            </div>

            {/* Trivia & Fun Fact Card */}
            <div className="bg-amber-50/70 border-2 border-amber-300 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-black uppercase text-amber-950 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600 fill-amber-600" />
                Datos Curiosos & Curiosidades:
              </h4>

              <ul className="space-y-1.5 text-xs text-slate-800 font-medium pl-1">
                {lore.trivia.map((tItem, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-600 font-black">•</span>
                    <span>{tItem}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2 border-t border-amber-200 text-xs font-black text-amber-950 flex items-center gap-2">
                <span>💡 Sabías que:</span>
                <span className="font-bold text-amber-900">{lore.funFact}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
