import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Zap,
  Shield,
  Swords,
  Search,
  Sparkles,
  Award,
  Flame,
  Clock,
  Users,
  Heart,
  TrendingUp,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PokemonType } from '../data/pokemonData';
import { POGO_DATABASE, PogoMove, PogoPokemon } from '../data/pogoDatabase';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { getTypeLabel } from '../utils/pogoTypeTranslator';
import { getSpanishMoveName } from '../utils/pogoMoveTranslator';
import { TypeWeaknessBadgeList } from './TypeWeaknessBadgeList';
import { useInventoryStore } from '../store/inventoryStore';
import {
  AdventureEffectType,
  buildMaxRosterEntries,
  createMaxBossFromPokemon,
  FRIENDSHIP_BONUS_TABLE,
  FriendshipTier,
  generateMaxTeamFromInventory,
  generateOptimalMaxTeam,
  getBestMaxAttackersByType,
  getCombinedExternalDamageMultiplier,
  getFastMoveDuration,
  GIGANTAMAX_SPECIES,
  HELPER_BONUS_TABLE,
  HelperTier,
  isCrownedWolfForm,
  isEternatus,
  isHalfSecondFastMove,
  MAX_BOSS_TIERS,
  MaxBattleUnitConfig,
  MaxBossEntity,
  MaxBossTier,
  MaxModifiersConfig,
  MaxMoveLevel,
  MaxRosterEntry,
  MaxSupportLevel,
  MaxUnitRole,
  OFFICIAL_GMAX_SPECIES_IDS,
  OFFICIAL_MAX_ELIGIBLE_IDS,
  resolvePokemonMaxMove,
  simulateMaxBattleCycle,
} from '../utils/maxBattleMath';

interface MaxBattleToolProps {
  onBackToHub?: () => void;
}

const ALL_TYPES: PokemonType[] = [
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
  'normal',
];

const TYPE_COLORS: Record<PokemonType, string> = {
  normal: 'bg-neutral-500 text-white',
  fire: 'bg-red-600 text-white',
  water: 'bg-blue-600 text-white',
  grass: 'bg-emerald-600 text-white',
  electric: 'bg-amber-400 text-slate-950',
  ice: 'bg-cyan-500 text-white',
  fighting: 'bg-red-700 text-white',
  poison: 'bg-purple-600 text-white',
  ground: 'bg-amber-700 text-white',
  flying: 'bg-indigo-500 text-white',
  psychic: 'bg-pink-600 text-white',
  bug: 'bg-lime-600 text-white',
  rock: 'bg-stone-600 text-white',
  ghost: 'bg-violet-700 text-white',
  dragon: 'bg-indigo-700 text-white',
  dark: 'bg-slate-800 text-white',
  steel: 'bg-slate-600 text-white',
  fairy: 'bg-pink-500 text-white',
};

const POPULAR_MAX_BOSSES: Array<{ pokemonId: number; isGmax: boolean; label: string }> = [
  { pokemonId: 6, isGmax: true, label: 'Charizard G-Max' },
  { pokemonId: 94, isGmax: true, label: 'Gengar G-Max' },
  { pokemonId: 849, isGmax: true, label: 'Toxtricity G-Max' },
  { pokemonId: 3, isGmax: true, label: 'Venusaur G-Max' },
  { pokemonId: 9, isGmax: true, label: 'Blastoise G-Max' },
  { pokemonId: 131, isGmax: true, label: 'Lapras G-Max' },
  { pokemonId: 143, isGmax: true, label: 'Snorlax G-Max' },
  { pokemonId: 68, isGmax: true, label: 'Machamp G-Max' },
  { pokemonId: 851, isGmax: true, label: 'Centiskorch G-Max' },
  { pokemonId: 858, isGmax: true, label: 'Hatterene G-Max' },
  { pokemonId: 12, isGmax: true, label: 'Butterfree G-Max' },
  { pokemonId: 99, isGmax: true, label: 'Kingler G-Max' },
  { pokemonId: 376, isGmax: false, label: 'Metagross D-Max' },
  { pokemonId: 145, isGmax: false, label: 'Zapdos D-Max' },
  { pokemonId: 146, isGmax: false, label: 'Moltres D-Max' },
  { pokemonId: 144, isGmax: false, label: 'Articuno D-Max' },
  { pokemonId: 243, isGmax: false, label: 'Raikou D-Max' },
  { pokemonId: 530, isGmax: false, label: 'Excadrill D-Max' },
];

function createDefaultUnitFromEntry(
  entry: MaxRosterEntry,
  slotIndex: 0 | 1 | 2,
  role: MaxUnitRole,
  level = 40,
  preferredFastMove?: PogoMove
): MaxBattleUnitConfig {
  const fastMove =
    preferredFastMove ||
    entry.fastMoves.find((m) => isHalfSecondFastMove(m.name)) ||
    entry.fastMoves[0];
  const chargedMove = entry.chargedMoves[0] || {
    id: 'struggle',
    name: 'Struggle',
    type: entry.types[0] || 'normal',
    power: 35,
    energy: 33,
    typeCategory: 'charged',
  };

  return {
    slotIndex,
    pokemonId: entry.pokemonId,
    formId: entry.formId,
    name: entry.displayNameEs,
    types: entry.types,
    baseAttack: entry.baseAttack,
    baseDefense: entry.baseDefense,
    baseStamina: entry.baseStamina,
    spriteUrl: entry.spriteUrl,
    level,
    ivAtk: 15,
    ivDef: 15,
    ivHp: 15,
    isGigantamax: entry.isGigantamax,
    gmaxVariantIndex: entry.gmaxVariantIndex,
    role,
    fastMove,
    chargedMove,
    useChargedInSmallPhase: false,
    maxAttackLevel: role === 'charger' ? 1 : 3,
    maxGuardLevel: role === 'charger' ? 3 : 0,
    maxSpiritLevel: role === 'charger' ? 2 : 0,
  };
}

interface SimulatorSlotCardProps {
  unit: MaxBattleUnitConfig;
  slotIndex: 0 | 1 | 2;
  roster: MaxRosterEntry[];
  modifiers: MaxModifiersConfig;
  language: 'es' | 'en';
  onUpdate: (updated: MaxBattleUnitConfig) => void;
}

const SimulatorSlotCard: React.FC<SimulatorSlotCardProps> = ({
  unit,
  slotIndex,
  roster,
  modifiers,
  language,
  onUpdate,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [expandedMoves, setExpandedMoves] = useState(true);

  const currentPokemonData = useMemo(() => {
    const p = POGO_DATABASE.find((item) => item.id === unit.pokemonId);
    const form = unit.formId
      ? (p?.specialForms || p?.megaForms)?.find((f) => f.id === unit.formId)
      : undefined;
    const fastPool =
      form?.fastMoves && form.fastMoves.length > 0 ? form.fastMoves : p?.fastMoves || [];
    const chargedPool =
      form?.chargedMoves && form.chargedMoves.length > 0
        ? form.chargedMoves
        : p?.chargedMoves || [];
    return { p, form, fastPool, chargedPool };
  }, [unit.pokemonId, unit.formId]);

  const gmaxFormsForSpecies = GIGANTAMAX_SPECIES[unit.pokemonId];
  const hasGigamaxOption =
    Boolean(gmaxFormsForSpecies && gmaxFormsForSpecies.length > 0) &&
    !isCrownedWolfForm(unit.pokemonId, unit.formId) &&
    !isEternatus(unit.pokemonId);

  const resolvedMax = resolvePokemonMaxMove({
    pokemonId: unit.pokemonId,
    formId: unit.formId,
    fastMove: unit.fastMove,
    isGigantamax: unit.isGigantamax,
    gmaxVariantIndex: unit.gmaxVariantIndex,
    baseLevel: unit.maxAttackLevel,
    adventureEffect: modifiers.adventureEffect,
  });

  const filteredRoster = useMemo(() => {
    const q = searchText.toLowerCase().trim();
    if (!q) return roster.slice(0, 35);
    const cleanQ = q.replace(/[\s\-_]+/g, '');
    return roster
      .filter((r) => {
        const name = r.displayNameEs.toLowerCase();
        return name.includes(q) || name.replace(/[\s\-_]+/g, '').includes(cleanQ);
      })
      .slice(0, 35);
  }, [roster, searchText]);

  const roleBadgeStyle: Record<MaxUnitRole, string> = {
    charger: 'bg-sky-600 text-white border-sky-700',
    attacker: 'bg-fuchsia-600 text-white border-fuchsia-700',
    hybrid: 'bg-amber-500 text-slate-950 border-amber-600',
  };

  return (
    <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-md flex flex-col gap-3 relative">
      {/* Slot Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
          Pokémon #{slotIndex + 1}
        </span>

        <div className="flex items-center gap-1">
          {(['charger', 'attacker', 'hybrid'] as MaxUnitRole[]).map((r) => (
            <button
              key={r}
              onClick={() => onUpdate({ ...unit, role: r })}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                unit.role === r
                  ? roleBadgeStyle[r]
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
              title={
                r === 'charger'
                  ? 'Tanque que carga el Medidor Max en fase pequeña'
                  : r === 'attacker'
                  ? 'Atacante principal que entra en Fase Max'
                  : 'Híbrido (carga y ataca)'
              }
            >
              {r === 'charger' ? '🛡️ Cargador' : r === 'attacker' ? '💥 Atacante' : '⚡ Híbrido'}
            </button>
          ))}
        </div>
      </div>

      {/* Pokemon Picker */}
      <div className="relative">
        <div
          onClick={() => setSearchOpen(!searchOpen)}
          className="flex items-center justify-between gap-2.5 p-2 rounded-2xl bg-slate-50 border border-slate-200 hover:border-fuchsia-400 cursor-pointer transition-all"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={unit.spriteUrl}
              alt={unit.name}
              className="w-11 h-11 object-contain bg-white rounded-xl p-1 border border-slate-200 shrink-0"
            />
            <div className="min-w-0">
              <div className="font-black text-xs text-slate-900 truncate flex items-center gap-1.5">
                <span className="truncate">{unit.name}</span>
                {unit.isGigantamax && (
                  <span className="bg-fuchsia-600 text-white text-[9px] px-1.5 py-0.2 rounded-full shrink-0">
                    G-MAX
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                {unit.types.map((tp) => (
                  <span
                    key={tp}
                    className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase ${TYPE_COLORS[tp]}`}
                  >
                    {getTypeLabel(tp, language)}
                  </span>
                ))}
                <span className="text-[10px] font-bold text-slate-500 ml-1">
                  Nv.{unit.level}
                </span>
              </div>
            </div>
          </div>
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        {searchOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white border-2 border-fuchsia-300 rounded-2xl shadow-2xl p-2 space-y-2">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Buscar Pokémon Max..."
              autoFocus
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-fuchsia-500"
            />
            <div className="max-h-52 overflow-y-auto space-y-1">
              {filteredRoster.map((entry) => (
                <button
                  key={entry.key}
                  onClick={() => {
                    onUpdate(
                      createDefaultUnitFromEntry(entry, slotIndex, unit.role, unit.level)
                    );
                    setSearchOpen(false);
                    setSearchText('');
                  }}
                  className="w-full flex items-center justify-between p-1.5 rounded-xl hover:bg-fuchsia-50 text-left cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={entry.spriteUrl} alt={entry.name} className="w-7 h-7 object-contain" />
                    <span className="text-xs font-extrabold text-slate-800 truncate">
                      {entry.displayNameEs}
                    </span>
                  </div>
                  {entry.isGigantamax ? (
                    <span className="text-[9px] font-black bg-fuchsia-100 text-fuchsia-700 px-1.5 py-0.5 rounded-full">
                      G-MAX
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                      D-MAX
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dynamax vs Gigamax Toggle + Urshifu Form Picker */}
      {hasGigamaxOption && (
        <div className="flex flex-wrap items-center gap-1.5 bg-fuchsia-50/70 p-2 rounded-xl border border-fuchsia-200">
          <button
            onClick={() =>
              onUpdate({
                ...unit,
                isGigantamax: false,
                name: `${currentPokemonData.p?.name || unit.name} (Dinamax)`,
              })
            }
            className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
              !unit.isGigantamax
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Dinamax (250-450)
          </button>
          <button
            onClick={() => {
              const gSpec = gmaxFormsForSpecies![unit.gmaxVariantIndex || 0] || gmaxFormsForSpecies![0];
              onUpdate({
                ...unit,
                isGigantamax: true,
                types: gSpec.overrideTypes || currentPokemonData.p?.types || unit.types,
                name: gSpec.labelEs,
              });
            }}
            className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
              unit.isGigantamax
                ? 'bg-fuchsia-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Gigamax (350-550)
          </button>

          {unit.isGigantamax && gmaxFormsForSpecies && gmaxFormsForSpecies.length > 1 && (
            <div className="w-full flex gap-1 pt-1">
              {gmaxFormsForSpecies.map((gf, idx) => (
                <button
                  key={gf.id}
                  onClick={() =>
                    onUpdate({
                      ...unit,
                      gmaxVariantIndex: idx,
                      types: gf.overrideTypes || unit.types,
                      name: gf.labelEs,
                    })
                  }
                  className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold cursor-pointer ${
                    (unit.gmaxVariantIndex || 0) === idx
                      ? 'bg-slate-900 text-amber-300'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  {gf.nameEs} ({getTypeLabel(gf.type, language)})
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Level & IVs */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase">Nivel</span>
            <span className="font-black text-slate-900">{unit.level}</span>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            step={1}
            value={unit.level}
            onChange={(e) => onUpdate({ ...unit, level: Number(e.target.value) })}
            className="w-full accent-fuchsia-600 cursor-pointer"
          />
          <div className="flex gap-1">
            {[20, 30, 40, 50].map((lvl) => (
              <button
                key={lvl}
                onClick={() => onUpdate({ ...unit, level: lvl })}
                className={`flex-1 py-0.5 rounded text-[9px] font-black cursor-pointer ${
                  unit.level === lvl
                    ? 'bg-fuchsia-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase">IVs (A/D/S)</span>
            <button
              onClick={() => onUpdate({ ...unit, ivAtk: 15, ivDef: 15, ivHp: 15 })}
              className="text-[9px] font-black text-fuchsia-600 hover:underline cursor-pointer"
            >
              100%
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <input
              type="number"
              min={0}
              max={15}
              value={unit.ivAtk}
              onChange={(e) =>
                onUpdate({ ...unit, ivAtk: Math.min(15, Math.max(0, Number(e.target.value))) })
              }
              className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-center text-[11px] font-black"
              title="IV Ataque"
            />
            <input
              type="number"
              min={0}
              max={15}
              value={unit.ivDef}
              onChange={(e) =>
                onUpdate({ ...unit, ivDef: Math.min(15, Math.max(0, Number(e.target.value))) })
              }
              className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-center text-[11px] font-black"
              title="IV Defensa"
            />
            <input
              type="number"
              min={0}
              max={15}
              value={unit.ivHp}
              onChange={(e) =>
                onUpdate({ ...unit, ivHp: Math.min(15, Math.max(0, Number(e.target.value))) })
              }
              className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-center text-[11px] font-black"
              title="IV Salud"
            />
          </div>
        </div>
      </div>

      {/* Fast & Charged Moves */}
      <div className="space-y-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
        <div>
          <label className="text-[10px] font-extrabold text-slate-500 uppercase flex items-center justify-between mb-1">
            <span>Ataque Rápido (Define Max Move si es D-Max)</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                isHalfSecondFastMove(unit.fastMove.name)
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {getFastMoveDuration(unit.fastMove.name)}s
              {isHalfSecondFastMove(unit.fastMove.name) ? ' ⚡ Meta' : ''}
            </span>
          </label>
          <select
            value={unit.fastMove.name}
            onChange={(e) => {
              const found = currentPokemonData.fastPool.find((m) => m.name === e.target.value);
              if (found) onUpdate({ ...unit, fastMove: found });
            }}
            className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900"
          >
            {currentPokemonData.fastPool.map((m) => (
              <option key={m.name} value={m.name}>
                {getSpanishMoveName(m.name)} ({getTypeLabel(m.type, language)} ·{' '}
                {getFastMoveDuration(m.name)}s · Pot {m.power})
              </option>
            ))}
          </select>
        </div>

        {/* Resolved Max Move Pill */}
        <div
          className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
            resolvedMax.category === 'gmax'
              ? 'bg-fuchsia-950 text-white border-fuchsia-600'
              : resolvedMax.category === 'signature'
              ? 'bg-indigo-950 text-white border-indigo-500'
              : 'bg-rose-950 text-white border-rose-700'
          }`}
        >
          <div className="min-w-0">
            <div className="text-[9px] uppercase font-bold text-fuchsia-300">
              {resolvedMax.category === 'gmax'
                ? 'Ataque Gigamax (Tipo Fijo)'
                : resolvedMax.category === 'signature'
                ? 'Ataque Max Exclusivo'
                : `Ataque Dinamax (Desde ${getSpanishMoveName(unit.fastMove.name)})`}
            </div>
            <div className="text-xs font-black truncate flex items-center gap-1.5">
              <span>{resolvedMax.nameEs}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${
                  TYPE_COLORS[resolvedMax.type]
                }`}
              >
                {getTypeLabel(resolvedMax.type, language)}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] font-black text-amber-300">
              Nv.{resolvedMax.effectiveLevel}
              {resolvedMax.boostedByEternatus && ' (+1)'}
            </div>
            <div className="text-xs font-black">{resolvedMax.power} Pot</div>
          </div>
        </div>

        <button
          onClick={() => setExpandedMoves(!expandedMoves)}
          className="w-full flex items-center justify-between text-[10px] font-extrabold text-slate-600 uppercase pt-1 cursor-pointer"
        >
          <span>Niveles Movimientos Max & Cargado</span>
          {expandedMoves ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {expandedMoves && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <select
                value={unit.chargedMove.name}
                onChange={(e) => {
                  const found = currentPokemonData.chargedPool.find(
                    (m) => m.name === e.target.value
                  );
                  if (found) onUpdate({ ...unit, chargedMove: found });
                }}
                className="flex-1 bg-white border border-slate-300 rounded-xl px-2 py-1 text-[11px] font-bold text-slate-900"
              >
                {currentPokemonData.chargedPool.map((m) => (
                  <option key={m.name} value={m.name}>
                    {getSpanishMoveName(m.name)} (Pot {m.power})
                  </option>
                ))}
              </select>
              <label
                className="flex items-center gap-1 text-[10px] font-bold text-slate-700 cursor-pointer shrink-0"
                title="Si se desactiva, solo usa el ataque rápido de 0.5s en fase pequeña para cargar antes el Medidor Max"
              >
                <input
                  type="checkbox"
                  checked={unit.useChargedInSmallPhase}
                  onChange={(e) =>
                    onUpdate({ ...unit, useChargedInSmallPhase: e.target.checked })
                  }
                  className="accent-fuchsia-600"
                />
                <span>Usar Carg.</span>
              </label>
            </div>

            {/* Max Attack / Guard / Spirit Levels */}
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="bg-white p-1.5 rounded-xl border border-slate-200">
                <div className="text-[9px] font-black text-rose-700 uppercase mb-1">
                  ⚔️ Ataque Max
                </div>
                <div className="flex gap-0.5">
                  {([1, 2, 3] as MaxMoveLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => onUpdate({ ...unit, maxAttackLevel: lvl })}
                      className={`flex-1 py-0.5 rounded text-[10px] font-black cursor-pointer ${
                        unit.maxAttackLevel === lvl
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white p-1.5 rounded-xl border border-slate-200">
                <div className="text-[9px] font-black text-sky-700 uppercase mb-1">
                  🛡️ Maxibarrera
                </div>
                <div className="flex gap-0.5">
                  {([0, 1, 2, 3] as MaxSupportLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => onUpdate({ ...unit, maxGuardLevel: lvl })}
                      className={`flex-1 py-0.5 rounded text-[10px] font-black cursor-pointer ${
                        unit.maxGuardLevel === lvl
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {lvl === 0 ? '—' : lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white p-1.5 rounded-xl border border-slate-200">
                <div className="text-[9px] font-black text-emerald-700 uppercase mb-1">
                  💚 Maxivigor
                </div>
                <div className="flex gap-0.5">
                  {([0, 1, 2, 3] as MaxSupportLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => onUpdate({ ...unit, maxSpiritLevel: lvl })}
                      className={`flex-1 py-0.5 rounded text-[10px] font-black cursor-pointer ${
                        unit.maxSpiritLevel === lvl
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {lvl === 0 ? '—' : lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const MaxBattleTool: React.FC<MaxBattleToolProps> = ({ onBackToHub }) => {
  const { t, language } = useLanguage();
  const { inventory } = useInventoryStore();

  // Active Sub-tab
  const [activeTab, setActiveTab] = useState<'generator' | 'simulator' | 'rankings'>('generator');

  // Boss Selection State (Default: Charizard Gigamax 6*)
  const [boss, setBoss] = useState<MaxBossEntity>(() => {
    const charizard = POGO_DATABASE.find((p) => p.id === 6) || POGO_DATABASE[0];
    return createMaxBossFromPokemon(charizard, { isGigantamax: true, tier: 6 });
  });
  const [bossSearch, setBossSearch] = useState('');
  const [showBossDropdown, setShowBossDropdown] = useState(false);

  // Global Enablers / Modifiers (recalculate EVERYTHING live)
  const [modifiers, setModifiers] = useState<MaxModifiersConfig>({
    adventureEffect: 'none',
    maxMushroom: false,
    helperTier: 0,
    weatherBoost: false,
    friendshipTier: 'none',
  });

  // Generator Options
  const [includeAllPokedex, setIncludeAllPokedex] = useState(false);
  const [usePersonalBox, setUsePersonalBox] = useState(false);
  const [teamPattern, setTeamPattern] = useState<'2-tanks-1-attacker' | '1-tank-2-attackers'>(
    '2-tanks-1-attacker'
  );
  const [genLevel, setGenLevel] = useState(40);
  const [genMaxMoveLevel, setGenMaxMoveLevel] = useState<MaxMoveLevel>(3);
  const [loadedToast, setLoadedToast] = useState<string | null>(null);

  // Simulator Settings & Team (3 Pokemon)
  const [trainersCount, setTrainersCount] = useState(4);
  const [orbsEnergyPerCycle, setOrbsEnergyPerCycle] = useState(10);
  const [maxAttacksPerPhase, setMaxAttacksPerPhase] = useState<1 | 2 | 3>(3);

  const fullRoster = useMemo(() => buildMaxRosterEntries(true), []);
  const officialRoster = useMemo(() => buildMaxRosterEntries(false), []);

  const [simTeam, setSimTeam] = useState<MaxBattleUnitConfig[]>(() => {
    const blissey = officialRoster.find((r) => r.pokemonId === 242) || officialRoster[0];
    const excadrill = officialRoster.find((r) => r.pokemonId === 530) || officialRoster[1];
    const kinglerGmax =
      officialRoster.find((r) => r.pokemonId === 99 && r.isGigantamax) || officialRoster[2];
    return [
      createDefaultUnitFromEntry(blissey, 0, 'charger', 40),
      createDefaultUnitFromEntry(excadrill, 1, 'charger', 40),
      createDefaultUnitFromEntry(kinglerGmax, 2, 'attacker', 40),
    ];
  });

  // Rankings by Type state
  const [selectedRankingType, setSelectedRankingType] = useState<PokemonType>('fire');
  const [rankingAgainstBoss, setRankingAgainstBoss] = useState(false);
  const [rankingLevel, setRankingLevel] = useState(40);
  const [rankingMaxLevel, setRankingMaxLevel] = useState<MaxMoveLevel>(3);

  // Boss Dropdown Entries
  const bossDropdownEntries = useMemo(() => {
    const entries: Array<{
      key: string;
      pokemon: PogoPokemon;
      formId?: string;
      isGmax: boolean;
      label: string;
      types: PokemonType[];
      spriteUrl: string;
    }> = [];

    for (const p of POGO_DATABASE) {
      const isOfficialGMax = OFFICIAL_GMAX_SPECIES_IDS.has(p.id);
      const isOfficialDMax = OFFICIAL_MAX_ELIGIBLE_IDS.has(p.id);

      if (GIGANTAMAX_SPECIES[p.id]) {
        if (isOfficialGMax || includeAllPokedex) {
          const gSpec = GIGANTAMAX_SPECIES[p.id][0];
          entries.push({
            key: `${p.id}-gmax`,
            pokemon: p,
            isGmax: true,
            label: isOfficialGMax ? gSpec.labelEs : `${gSpec.labelEs} (Teórico)`,
            types: gSpec.overrideTypes || p.types,
            spriteUrl: p.spriteUrl,
          });
        }
      }

      if ((p.id === 888 || p.id === 889) && includeAllPokedex) {
        const crowned = (p.specialForms || []).find(
          (f) => f.id === 'zacian_crowned' || f.id === 'zamazenta_crowned'
        );
        if (crowned) {
          entries.push({
            key: `${p.id}-${crowned.id}`,
            pokemon: p,
            formId: crowned.id,
            isGmax: false,
            label: `${crowned.name} (Teórico)`,
            types: crowned.types,
            spriteUrl: crowned.spriteUrl,
          });
        }
      }

      if (isOfficialDMax || p.id === 890 || includeAllPokedex) {
        entries.push({
          key: `${p.id}-dmax`,
          pokemon: p,
          isGmax: false,
          label:
            p.id === 890
              ? 'Eternatus'
              : isOfficialDMax
              ? `${p.name} (Dinamax)`
              : `${p.name} (Dinamax Teórico)`,
          types: p.types,
          spriteUrl: p.spriteUrl,
        });
      }
    }

    const q = bossSearch.toLowerCase().trim();
    if (!q) return entries.slice(0, 35);
    const cleanQ = q.replace(/[\s\-_]+/g, '');
    return entries
      .filter((e) => {
        const l = e.label.toLowerCase();
        return l.includes(q) || l.replace(/[\s\-_]+/g, '').includes(cleanQ);
      })
      .slice(0, 35);
  }, [bossSearch, includeAllPokedex]);

  const handleSelectBoss = (p: PogoPokemon, opts?: { formId?: string; isGmax?: boolean }) => {
    setBoss(
      createMaxBossFromPokemon(p, {
        formId: opts?.formId,
        isGigantamax: opts?.isGmax,
      })
    );
    setBossSearch('');
    setShowBossDropdown(false);
  };

  // Generated Team Calculation (live-reacts to boss + modifiers + settings)
  const generatedResult = useMemo(() => {
    if (usePersonalBox && inventory.length > 0) {
      return generateMaxTeamFromInventory({
        boss,
        inventory,
        maxMoveLevel: genMaxMoveLevel,
        modifiers,
        teamPattern,
        onlyOfficialMax: !includeAllPokedex,
      });
    }
    return generateOptimalMaxTeam({
      boss,
      attackerLevel: genLevel,
      maxMoveLevel: genMaxMoveLevel,
      modifiers,
      includeAllPokedex,
      teamPattern,
    });
  }, [
    boss,
    usePersonalBox,
    inventory,
    genMaxMoveLevel,
    modifiers,
    teamPattern,
    includeAllPokedex,
    genLevel,
  ]);

  // Live Battle Simulation Calculation
  const simulationResult = useMemo(() => {
    return simulateMaxBattleCycle({
      team: simTeam,
      boss,
      modifiers,
      trainersCount,
      orbsEnergyPerCycle,
      maxAttacksPerPhase,
    });
  }, [simTeam, boss, modifiers, trainersCount, orbsEnergyPerCycle, maxAttacksPerPhase]);

  // Top Pokémon by Type Ranking Calculation
  const typeRankingList = useMemo(() => {
    return getBestMaxAttackersByType({
      targetType: selectedRankingType,
      attackerLevel: rankingLevel,
      maxMoveLevel: rankingMaxLevel,
      modifiers,
      includeAllPokedex,
      bossDefenderTypes: rankingAgainstBoss ? boss.types : undefined,
      bossDefenseStat: rankingAgainstBoss ? (boss.baseDefense + 15) * boss.cpm : 150,
    });
  }, [
    selectedRankingType,
    rankingLevel,
    rankingMaxLevel,
    modifiers,
    includeAllPokedex,
    rankingAgainstBoss,
    boss,
  ]);

  // Top #1 King Summary across all 18 types
  const topKingsPerType = useMemo(() => {
    return ALL_TYPES.map((tp) => {
      const top = getBestMaxAttackersByType({
        targetType: tp,
        attackerLevel: rankingLevel,
        maxMoveLevel: rankingMaxLevel,
        modifiers,
        includeAllPokedex,
      })[0];
      return { type: tp, king: top };
    });
  }, [rankingLevel, rankingMaxLevel, modifiers, includeAllPokedex]);

  const totalExternalMultiplier = getCombinedExternalDamageMultiplier(modifiers);

  const notifyLoaded = (msg: string) => {
    setLoadedToast(msg);
    setTimeout(() => setLoadedToast(null), 2600);
  };

  const assignEntryToSimulatorSlot = (
    entry: MaxRosterEntry,
    slotIndex: 0 | 1 | 2,
    fastMove?: PogoMove,
    levelOverride?: number
  ) => {
    const role: MaxUnitRole = slotIndex === 2 ? 'attacker' : simTeam[slotIndex]?.role || 'hybrid';
    const newUnit = createDefaultUnitFromEntry(
      entry,
      slotIndex,
      role,
      levelOverride ?? simTeam[slotIndex]?.level ?? 40,
      fastMove
    );
    setSimTeam((prev) => prev.map((u, idx) => (idx === slotIndex ? newUnit : u)));
    notifyLoaded(`${entry.displayNameEs} asignado al Slot #${slotIndex + 1} del Simulador`);
  };

  const handleLoadGeneratedTeamToSimulator = () => {
    if (generatedResult.recommendedTeam.length === 0) return;
    setSimTeam(generatedResult.recommendedTeam);
    setActiveTab('simulator');
    notifyLoaded('Equipo óptimo cargado en el Simulador de Combate Max');
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-800 flex flex-col font-sans">
      {/* Dynamax Crimson-Magenta Header */}
      <header className="bg-gradient-to-r from-[#7B0E42] via-[#B91C5C] to-[#581C87] border-b-4 border-fuchsia-400 text-white shadow-lg sticky top-0 z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBackToHub && (
              <button
                onClick={onBackToHub}
                className="px-3 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{t.backToHub}</span>
              </button>
            )}

            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] flex items-center gap-2">
                <span>⚡ COMBATES MAX (DYNAMAX & GIGAMAX)</span>
              </h1>
              <p className="text-[11px] font-medium text-fuchsia-100">
                Generador de Equipos Max · Calculadora de Movimientos Max · Habilitadores · Simulador de Golpes & KO
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-2 text-xs font-black text-fuchsia-950 bg-yellow-300 px-3 py-1.5 rounded-full shadow-sm">
              <Sparkles className="w-4 h-4 text-fuchsia-700" />
              <span>Multiplicador: ×{totalExternalMultiplier.toFixed(2)}</span>
            </div>
            <LanguageSelector />
          </div>
        </div>
      </header>

      {loadedToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-amber-300 border-2 border-fuchsia-500 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-black flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{loadedToast}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Global Enablers / Modifiers Bar (Always accessible for instant recalculation) */}
        <section className="bg-gradient-to-br from-slate-900 via-[#1E1035] to-slate-900 text-white rounded-3xl p-4 sm:p-5 border-2 border-fuchsia-500/50 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-fuchsia-400" />
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-fuchsia-200">
                Habilitadores y Modificadores Max (Recálculo Instantáneo)
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-black">
              <span className="px-2.5 py-1 rounded-full bg-fuchsia-600/40 border border-fuchsia-400/50 text-fuchsia-100">
                Daño Externo: ×{totalExternalMultiplier.toFixed(2)}
              </span>
              {modifiers.adventureEffect === 'eternatus' && (
                <span className="px-2.5 py-1 rounded-full bg-purple-600 text-amber-300 border border-purple-400">
                  🌌 +1 Nivel Mov. Max (hasta Nv.4)
                </span>
              )}
              {modifiers.adventureEffect === 'zacian' && (
                <span className="px-2.5 py-1 rounded-full bg-sky-600 text-white border border-sky-400">
                  ⚔️ +5% ATQ Equipo
                </span>
              )}
              {modifiers.adventureEffect === 'zamazenta' && (
                <span className="px-2.5 py-1 rounded-full bg-amber-600 text-white border border-amber-400">
                  🛡️ +5% DEF Equipo
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Adventure Effects (Mutually exclusive: only 1 active at a time) */}
            <div className="lg:col-span-6 space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 block">
                Efecto Aventura Activo (máx. 1 simultáneo):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'none' as AdventureEffectType, label: 'Ninguno', sub: 'Base' },
                  {
                    id: 'eternatus' as AdventureEffectType,
                    label: '🌌 Eternatus',
                    sub: '+1 Nivel Max (Nv.4)',
                  },
                  {
                    id: 'zacian' as AdventureEffectType,
                    label: '⚔️ Zacian',
                    sub: '+5% Ataque',
                  },
                  {
                    id: 'zamazenta' as AdventureEffectType,
                    label: '🛡️ Zamazenta',
                    sub: '+5% Defensa',
                  },
                ].map((opt) => {
                  const active = modifiers.adventureEffect === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() =>
                        setModifiers((m) => ({ ...m, adventureEffect: opt.id }))
                      }
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-fuchsia-600 border-amber-300 text-white shadow-md ring-2 ring-amber-300/30'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-black">{opt.label}</div>
                      <div className="text-[9px] font-bold text-fuchsia-200/90">{opt.sub}</div>
                    </button>
                  );
                })}
              </div>
              {modifiers.adventureEffect === 'eternatus' && (
                <p className="text-[10px] text-amber-300 font-semibold">
                  * Regla oficial: Cañón Dinamax sube +1 nivel a Pokémon Dinamax, Gigamax y Eternatus (hasta Nv.4). No aplica sobre Zacian/Zamazenta Supremos.
                </p>
              )}
            </div>

            {/* Max Mushroom, Helpers, Weather, Friendship */}
            <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Max Mushroom */}
              <button
                onClick={() =>
                  setModifiers((m) => ({ ...m, maxMushroom: !m.maxMushroom }))
                }
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  modifiers.maxMushroom
                    ? 'bg-gradient-to-br from-rose-600 to-fuchsia-700 border-amber-300 text-white shadow-lg'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="text-xs font-black">🍄 Maxiseta</span>
                <span className="text-[10px] font-bold text-amber-300 mt-1">
                  {modifiers.maxMushroom ? 'ACTIVA (×2.00 Daño)' : 'Desactivada (×1.0)'}
                </span>
              </button>

              {/* Weather Boost */}
              <button
                onClick={() =>
                  setModifiers((m) => ({ ...m, weatherBoost: !m.weatherBoost }))
                }
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  modifiers.weatherBoost
                    ? 'bg-sky-600 border-sky-300 text-white shadow-lg'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="text-xs font-black">🌤️ Clima</span>
                <span className="text-[10px] font-bold text-sky-100 mt-1">
                  {modifiers.weatherBoost ? 'A favor (×1.20)' : 'Sin clima (×1.0)'}
                </span>
              </button>

              {/* Helpers / Gloves */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-2 flex flex-col justify-between">
                <label className="text-[10px] font-black text-slate-300">
                  🧤 Ayudantes Nodo
                </label>
                <select
                  value={modifiers.helperTier}
                  onChange={(e) =>
                    setModifiers((m) => ({
                      ...m,
                      helperTier: Number(e.target.value) as HelperTier,
                    }))
                  }
                  className="mt-1 w-full bg-slate-900 border border-slate-600 rounded-lg px-1.5 py-1 text-[10px] font-bold text-amber-300"
                >
                  {(Object.keys(HELPER_BONUS_TABLE) as unknown as HelperTier[]).map((tierKey) => (
                    <option key={tierKey} value={tierKey}>
                      {HELPER_BONUS_TABLE[tierKey].labelEs}
                    </option>
                  ))}
                </select>
              </div>

              {/* Friendship */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-2 flex flex-col justify-between">
                <label className="text-[10px] font-black text-slate-300">🤝 Amistad</label>
                <select
                  value={modifiers.friendshipTier}
                  onChange={(e) =>
                    setModifiers((m) => ({
                      ...m,
                      friendshipTier: e.target.value as FriendshipTier,
                    }))
                  }
                  className="mt-1 w-full bg-slate-900 border border-slate-600 rounded-lg px-1.5 py-1 text-[10px] font-bold text-emerald-300"
                >
                  {(Object.keys(FRIENDSHIP_BONUS_TABLE) as FriendshipTier[]).map((fk) => (
                    <option key={fk} value={fk}>
                      {FRIENDSHIP_BONUS_TABLE[fk].labelEs}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Boss Selector Card */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-fuchsia-600" />
                Jefe de Nodo Energético (Power Spot Boss)
              </h3>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-300">
                {MAX_BOSS_TIERS[boss.tier].labelEs}
              </span>
            </div>

            {/* Search Boss */}
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3 text-slate-400" />
                <input
                  type="text"
                  value={bossSearch}
                  onFocus={() => setShowBossDropdown(true)}
                  onChange={(e) => {
                    setBossSearch(e.target.value);
                    setShowBossDropdown(true);
                  }}
                  placeholder={`Buscar Jefe Max (actual: ${boss.name})...`}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              {showBossDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 z-40 max-h-60 overflow-y-auto bg-white border-2 border-slate-200 rounded-2xl shadow-xl p-1.5">
                  {bossDropdownEntries.map((item) => (
                    <div
                      key={item.key}
                      onClick={() =>
                        handleSelectBoss(item.pokemon, {
                          formId: item.formId,
                          isGmax: item.isGmax,
                        })
                      }
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-fuchsia-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.spriteUrl}
                          alt={item.label}
                          className="w-8 h-8 object-contain"
                        />
                        <div>
                          <span className="text-xs font-extrabold text-slate-900 block">
                            {item.label}
                          </span>
                          <div className="flex gap-1">
                            {item.types.map((tp) => (
                              <span
                                key={tp}
                                className="text-[9px] font-bold uppercase text-slate-500"
                              >
                                {getTypeLabel(tp, language)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          item.isGmax
                            ? 'bg-fuchsia-100 text-fuchsia-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.isGmax ? 'GIGAMAX' : 'DINAMAX'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Boss Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_MAX_BOSSES.map((pb) => {
                const p = POGO_DATABASE.find((item) => item.id === pb.pokemonId);
                if (!p) return null;
                const isSelected =
                  boss.pokemonId === pb.pokemonId && boss.isGigantamax === pb.isGmax;
                return (
                  <button
                    key={`${pb.pokemonId}-${pb.isGmax}`}
                    onClick={() => handleSelectBoss(p, { isGmax: pb.isGmax })}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-fuchsia-600 text-white border-fuchsia-700 shadow-sm'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <img src={p.spriteUrl} alt={pb.label} className="w-4 h-4 object-contain" />
                    <span>{pb.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Boss Tier & Editable HP / CPM */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                  Nivel del Nodo (1★ - 6★)
                </label>
                <div className="grid grid-cols-6 gap-1">
                  {([1, 2, 3, 4, 5, 6] as MaxBossTier[]).map((tierVal) => (
                    <button
                      key={tierVal}
                      onClick={() => {
                        const spec = MAX_BOSS_TIERS[tierVal];
                        setBoss((b) => ({
                          ...b,
                          tier: tierVal,
                          hp: spec.defaultHp,
                          cpm: spec.defaultCpm,
                        }));
                      }}
                      className={`py-1 rounded-lg text-[11px] font-black cursor-pointer ${
                        boss.tier === tierVal
                          ? 'bg-fuchsia-600 text-white'
                          : 'bg-white border border-slate-300 text-slate-700'
                      }`}
                    >
                      {tierVal}★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                  HP Total del Jefe
                </label>
                <input
                  type="number"
                  min={500}
                  max={500000}
                  step={500}
                  value={boss.hp}
                  onChange={(e) =>
                    setBoss((b) => ({
                      ...b,
                      hp: Math.max(500, Number(e.target.value) || 1000),
                    }))
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-black text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                  CPM Interno del Jefe
                </label>
                <input
                  type="number"
                  min={0.1}
                  max={1.5}
                  step={0.05}
                  value={boss.cpm}
                  onChange={(e) =>
                    setBoss((b) => ({
                      ...b,
                      cpm: Math.max(0.1, Math.min(1.5, Number(e.target.value) || 0.5)),
                    }))
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-black text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Boss Info & Weaknesses */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-md flex flex-col justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-100 to-purple-100 border border-fuchsia-300 flex items-center justify-center p-1.5 shrink-0">
                <img
                  src={boss.spriteUrl}
                  alt={boss.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-black text-slate-900 truncate">{boss.name}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {boss.types.map((tp) => (
                    <span
                      key={tp}
                      className={`text-[10px] px-2 py-0.5 rounded-lg font-black uppercase ${TYPE_COLORS[tp]}`}
                    >
                      {getTypeLabel(tp, language)}
                    </span>
                  ))}
                </div>
                <div className="text-[11px] font-bold text-slate-500 mt-1">
                  HP: {boss.hp.toLocaleString()} · DEF Efec.:{' '}
                  {((boss.baseDefense + 15) * boss.cpm).toFixed(1)}
                </div>
              </div>
            </div>

            <TypeWeaknessBadgeList types={boss.types} />
          </div>
        </section>

        {/* Main Navigation Tabs */}
        <nav className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border-2 border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'generator'
                ? 'bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white shadow-md'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>1. Generador de Equipo Max</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-gradient-to-r from-rose-600 to-fuchsia-600 text-white shadow-md'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>2. Simulador de Batalla y Golpes</span>
          </button>

          <button
            onClick={() => setActiveTab('rankings')}
            className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'rankings'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>3. Mejores Pokémon por Tipo (18 Tipos)</span>
          </button>
        </nav>

        {/* TAB 1: TEAM GENERATOR */}
        {activeTab === 'generator' && (
          <div className="space-y-6">
            {/* Generator Controls */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-md flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Source */}
                <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    onClick={() => setUsePersonalBox(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer ${
                      !usePersonalBox ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Catálogo Global
                  </button>
                  <button
                    onClick={() => setUsePersonalBox(true)}
                    disabled={inventory.length === 0}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer disabled:opacity-50 ${
                      usePersonalBox ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    📦 Mi Caja ({inventory.length})
                  </button>
                </div>

                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAllPokedex}
                    onChange={(e) => setIncludeAllPokedex(e.target.checked)}
                    className="accent-fuchsia-600"
                  />
                  <span>Incluir toda la Pokédex (Teórico)</span>
                </label>

                <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    onClick={() => setTeamPattern('2-tanks-1-attacker')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer ${
                      teamPattern === '2-tanks-1-attacker'
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-600'
                    }`}
                  >
                    2 Tanques + 1 Atacante
                  </button>
                  <button
                    onClick={() => setTeamPattern('1-tank-2-attackers')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer ${
                      teamPattern === '1-tank-2-attackers'
                        ? 'bg-fuchsia-600 text-white'
                        : 'text-slate-600'
                    }`}
                  >
                    1 Tanque + 2 Atacantes
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {!usePersonalBox && (
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 text-xs">
                    <span className="font-bold text-slate-500">Nivel:</span>
                    {[20, 30, 40, 50].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setGenLevel(lvl)}
                        className={`px-2 py-0.5 rounded font-black cursor-pointer ${
                          genLevel === lvl ? 'bg-slate-900 text-white' : 'text-slate-600'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-500">Mov. Max:</span>
                  {([1, 2, 3] as MaxMoveLevel[]).map((ml) => (
                    <button
                      key={ml}
                      onClick={() => setGenMaxMoveLevel(ml)}
                      className={`px-2 py-0.5 rounded font-black cursor-pointer ${
                        genMaxMoveLevel === ml
                          ? 'bg-rose-600 text-white'
                          : 'text-slate-600'
                      }`}
                    >
                      Nv.{ml}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommended 3-Pokemon Max Squad */}
            <div className="bg-white border-2 border-fuchsia-300 rounded-3xl p-5 shadow-md space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-fuchsia-600" />
                    Equipo Max Recomendado contra {boss.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Recuerda la regla táctica: usa los Cargadores con ataque de 0.5s para llenar el Medidor Max y cambia a tu Atacante Max cuando empiece la Fase Dinamax/Gigamax.
                  </p>
                </div>

                <button
                  onClick={handleLoadGeneratedTeamToSimulator}
                  disabled={generatedResult.recommendedTeam.length === 0}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-700 hover:to-purple-800 text-white text-xs font-black shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <span>Simular Batalla con este Equipo</span>
                </button>
              </div>

              {generatedResult.recommendedTeam.length === 0 ? (
                <div className="p-6 text-center text-xs font-bold text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                  No se encontraron Pokémon elegibles en Tu Caja Pokémon con este filtro. Desactiva el filtro oficial o cambia a Catálogo Global.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {generatedResult.recommendedTeam.map((unit) => {
                    const resolved = resolvePokemonMaxMove({
                      pokemonId: unit.pokemonId,
                      formId: unit.formId,
                      fastMove: unit.fastMove,
                      isGigantamax: unit.isGigantamax,
                      gmaxVariantIndex: unit.gmaxVariantIndex,
                      baseLevel: unit.maxAttackLevel,
                      adventureEffect: modifiers.adventureEffect,
                    });
                    const fastDur = getFastMoveDuration(unit.fastMove.name);
                    const matchingCand =
                      unit.role === 'charger'
                        ? generatedResult.topTanks.find(
                            (t) =>
                              t.entry.pokemonId === unit.pokemonId &&
                              t.entry.formId === unit.formId &&
                              t.entry.isGigantamax === unit.isGigantamax
                          )
                        : generatedResult.topAttackers.find(
                            (a) =>
                              a.entry.pokemonId === unit.pokemonId &&
                              a.entry.formId === unit.formId &&
                              a.entry.isGigantamax === unit.isGigantamax
                          );

                    return (
                      <div
                        key={unit.slotIndex}
                        className={`rounded-2xl p-4 border-2 flex flex-col justify-between gap-3 ${
                          unit.role === 'attacker'
                            ? 'bg-gradient-to-br from-fuchsia-50 to-white border-fuchsia-300'
                            : 'bg-gradient-to-br from-sky-50 to-white border-sky-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={unit.spriteUrl}
                              alt={unit.name}
                              className="w-14 h-14 object-contain bg-white rounded-2xl p-1 border border-slate-200"
                            />
                            <div>
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  unit.role === 'charger'
                                    ? 'bg-sky-600 text-white'
                                    : unit.role === 'attacker'
                                    ? 'bg-fuchsia-600 text-white'
                                    : 'bg-amber-500 text-slate-950'
                                }`}
                              >
                                {unit.role === 'charger'
                                  ? '🛡️ Tanque / Cargador'
                                  : unit.role === 'attacker'
                                  ? '💥 Atacante Fase Max'
                                  : '⚡ Híbrido'}
                              </span>
                              <h4 className="font-black text-sm text-slate-900 mt-1">
                                {unit.name}
                              </h4>
                              <div className="flex gap-1 mt-0.5">
                                {unit.types.map((tp) => (
                                  <span
                                    key={tp}
                                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${TYPE_COLORS[tp]}`}
                                  >
                                    {getTypeLabel(tp, language)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs bg-white p-2.5 rounded-xl border border-slate-200">
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-bold">Ataque Rápido:</span>
                            <span className="font-black text-slate-900">
                              {getSpanishMoveName(unit.fastMove.name)} ({fastDur}s
                              {fastDur <= 0.5 ? ' ⚡' : ''})
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-bold">Ataque Max:</span>
                            <span className="font-black text-fuchsia-700">
                              {resolved.nameEs} (Nv.{resolved.effectiveLevel} · {resolved.power})
                            </span>
                          </div>
                          {matchingCand && (
                            <div className="flex justify-between border-t border-slate-100 pt-1">
                              <span className="text-slate-500 font-bold">Daño Fase Max (×3):</span>
                              <span className="font-black text-rose-700">
                                {matchingCand.maxMoveDamage.toLocaleString()} / golpe ·{' '}
                                {matchingCand.threeHitDamage.toLocaleString()} (×3)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top Attackers & Top Chargers Detailed Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Max Attackers */}
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-md space-y-3">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Swords className="w-4 h-4 text-rose-600" />
                  Top Atacantes en Fase Max vs {boss.name}
                </h4>
                <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
                  {generatedResult.topAttackers.map((cand, idx) => (
                    <div
                      key={`${cand.entry.key}-${idx}`}
                      className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <img
                          src={cand.entry.spriteUrl}
                          alt={cand.entry.name}
                          className="w-9 h-9 object-contain shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-black text-slate-900 truncate flex items-center gap-1">
                            <span className="truncate">{cand.entry.displayNameEs}</span>
                            {cand.entry.isGigantamax && (
                              <span className="text-[9px] bg-fuchsia-600 text-white px-1.5 rounded-full">
                                G-MAX
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-bold text-slate-600 truncate">
                            Rápido: <span className="text-slate-900">{getSpanishMoveName(cand.fastMove.name)}</span> ➔{' '}
                            <span className="text-fuchsia-700 font-black">
                              {cand.resolvedMaxMove.nameEs} ({cand.resolvedMaxMove.power})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <div className="text-xs font-black text-rose-700">
                          {cand.maxMoveDamage.toLocaleString()} HP
                        </div>
                        <div className="flex gap-1 justify-end">
                          {([0, 1, 2] as const).map((sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() =>
                                assignEntryToSimulatorSlot(
                                  cand.entry,
                                  sIdx,
                                  cand.fastMove,
                                  genLevel
                                )
                              }
                              className="px-1.5 py-0.5 rounded bg-white border border-slate-300 hover:border-fuchsia-500 text-[9px] font-black text-slate-700 cursor-pointer"
                              title={`Enviar al Slot #${sIdx + 1} del Simulador`}
                            >
                              +S{sIdx + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Tanks / 0.5s Chargers */}
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-md space-y-3">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sky-600" />
                  Top Tanques / Cargadores (0.5s ⚡) vs {boss.name}
                </h4>
                <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
                  {generatedResult.topTanks.map((cand, idx) => (
                    <div
                      key={`${cand.entry.key}-${idx}`}
                      className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <img
                          src={cand.entry.spriteUrl}
                          alt={cand.entry.name}
                          className="w-9 h-9 object-contain shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-black text-slate-900 truncate flex items-center gap-1">
                            <span className="truncate">{cand.entry.displayNameEs}</span>
                            {cand.hasHalfSecondFast && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 rounded-full">
                                0.5s ⚡
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-bold text-slate-600">
                            Rápido: <span className="text-slate-900">{getSpanishMoveName(cand.fastMove.name)}</span> · Daño recibido promedio:{' '}
                            <span
                              className={
                                cand.resistanceFactorAgainstBoss < 0.9
                                  ? 'text-emerald-700 font-black'
                                  : cand.resistanceFactorAgainstBoss > 1.1
                                  ? 'text-red-600 font-black'
                                  : 'text-slate-700 font-bold'
                              }
                            >
                              {cand.resistanceFactorAgainstBoss}x
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <div className="text-[11px] font-black text-sky-700">
                          Aguante: {cand.tankinessScore.toLocaleString()}
                        </div>
                        <div className="flex gap-1 justify-end">
                          {([0, 1, 2] as const).map((sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() =>
                                assignEntryToSimulatorSlot(
                                  cand.entry,
                                  sIdx,
                                  cand.fastMove,
                                  genLevel
                                )
                              }
                              className="px-1.5 py-0.5 rounded bg-white border border-slate-300 hover:border-sky-500 text-[9px] font-black text-slate-700 cursor-pointer"
                              title={`Enviar al Slot #${sIdx + 1} del Simulador`}
                            >
                              +S{sIdx + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BATTLE SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            {/* 3 Editable Team Slots */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {simTeam.map((unit, idx) => (
                <SimulatorSlotCard
                  key={idx}
                  unit={unit}
                  slotIndex={idx as 0 | 1 | 2}
                  roster={includeAllPokedex ? fullRoster : officialRoster}
                  modifiers={modifiers}
                  language={language}
                  onUpdate={(updated) =>
                    setSimTeam((prev) => prev.map((item, i) => (i === idx ? updated : item)))
                  }
                />
              ))}
            </div>

            {/* Lobby & Simulation Controls */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-md grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-700 uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-fuchsia-600" /> Entrenadores en Combate
                  </span>
                  <span className="text-fuchsia-700 font-black">{trainersCount}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={40}
                  value={trainersCount}
                  onChange={(e) => setTrainersCount(Number(e.target.value))}
                  className="w-full accent-fuchsia-600 cursor-pointer"
                />
                <div className="flex gap-1">
                  {[1, 2, 4, 10, 20, 40].map((n) => (
                    <button
                      key={n}
                      onClick={() => setTrainersCount(n)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-black cursor-pointer ${
                        trainersCount === n
                          ? 'bg-fuchsia-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {n === 1 ? '1 Solo' : n}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Grupos de hasta 4 llenan su propio medidor de 100 energía; todos los {trainersCount} dañan al Jefe.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-700 uppercase block">
                  Orbes de Energía recogidos por Ciclo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 10, 20].map((orbs) => (
                    <button
                      key={orbs}
                      onClick={() => setOrbsEnergyPerCycle(orbs)}
                      className={`py-2 rounded-xl text-xs font-black border cursor-pointer ${
                        orbsEnergyPerCycle === orbs
                          ? 'bg-purple-700 text-white border-purple-800'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      +{orbs} Energía
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Cada orbe morado al deslizar aporta ~10 de energía Max al medidor del grupo.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-700 uppercase block">
                  Ataques Max por Fase Dinamax
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([3, 2, 1] as const).map((cnt) => (
                    <button
                      key={cnt}
                      onClick={() => setMaxAttacksPerPhase(cnt)}
                      className={`py-2 rounded-xl text-xs font-black border cursor-pointer ${
                        maxAttacksPerPhase === cnt
                          ? 'bg-rose-600 text-white border-rose-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {cnt} {cnt === 3 ? '(Full DPS)' : cnt === 2 ? '+1 Apoyo' : '+2 Apoyo'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Cada Fase Max tiene 3 acciones; puedes dedicar 1 o 2 a Maxibarrera / Maxivigor.
                </p>
              </div>
            </div>

            {/* Simulation Output KPIs */}
            <div className="bg-gradient-to-br from-slate-900 via-[#220B38] to-slate-900 text-white rounded-3xl p-5 sm:p-6 border-2 border-fuchsia-500/60 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-yellow-300 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-fuchsia-400" />
                    Resultado de Simulación vs {boss.name} ({boss.hp.toLocaleString()} HP)
                  </h3>
                  <p className="text-xs text-slate-300">
                    Cargando con <span className="text-sky-300 font-black">{simulationResult.activeCharger.unitName}</span> y rematando en Fase Max con <span className="text-fuchsia-300 font-black">{simulationResult.activeAttacker.unitName}</span>
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                    simulationResult.koAchievedWithinEnrage
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400'
                      : 'bg-red-500/20 text-red-300 border border-red-400'
                  }`}
                >
                  {simulationResult.koAchievedWithinEnrage ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Victoria viable (&lt; 6 min)
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" /> Riesgo de Enrage (&gt; 360s)
                    </>
                  )}
                </span>
              </div>

              {/* 4 Main Simulation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-2xl p-4 border border-white/15 space-y-1">
                  <div className="text-[10px] font-black uppercase text-fuchsia-300">
                    Golpes Max Puros para KO
                  </div>
                  <div className="text-2xl font-black text-white">
                    {simulationResult.pureMaxHitsSingleAttacker}{' '}
                    <span className="text-sm font-bold text-slate-300">Golpes Max</span>
                  </div>
                  <div className="text-xs font-bold text-amber-300">
                    = {simulationResult.pureMaxPhasesSingleAttacker} Fases Max (sin contar daño rápido)
                  </div>
                  <div className="text-[11px] text-slate-300 pt-1">
                    {simulationResult.activeAttacker.maxAttackDamage.damage.toLocaleString()} HP/golpe por entrenador
                  </div>
                </div>

                <div className="bg-white/10 rounded-2xl p-4 border border-white/15 space-y-1">
                  <div className="text-[10px] font-black uppercase text-sky-300">
                    Simulación Real (Carga + Max)
                  </div>
                  <div className="text-2xl font-black text-white">
                    {simulationResult.cyclesToKo}{' '}
                    <span className="text-sm font-bold text-slate-300">Ciclos Max</span>
                  </div>
                  <div className="text-xs font-bold text-sky-200">
                    {simulationResult.totalFastHitsPerTrainer} Rápidos + {simulationResult.totalMaxHitsPerTrainer} Golpes Max
                    {trainersCount > 1 ? ' (por entrenador)' : ''}
                  </div>
                  <div className="text-[11px] text-slate-300 pt-1">
                    {simulationResult.fastHitsPerCyclePerTrainer} golpes ({simulationResult.smallPhaseSecondsPerCycle}s) por carga
                  </div>
                </div>

                <div className="bg-white/10 rounded-2xl p-4 border border-white/15 space-y-1">
                  <div className="text-[10px] font-black uppercase text-amber-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Tiempo Total Estimado
                  </div>
                  <div className="text-2xl font-black text-white">
                    {simulationResult.estimatedTotalSeconds}s
                  </div>
                  <div className="text-xs font-bold text-emerald-300">
                    Daño/ciclo del grupo: {simulationResult.totalDamagePerCycleTeam.toLocaleString()} HP (
                    {((simulationResult.totalDamagePerCycleTeam / boss.hp) * 100).toFixed(1)}%)
                  </div>
                  <div className="text-[11px] text-slate-300 pt-1">
                    Fase peq: {simulationResult.smallPhaseDamageTeam.toLocaleString()} · Fase Max: {simulationResult.maxPhaseDamageTeam.toLocaleString()}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-900/60 to-teal-900/60 rounded-2xl p-4 border border-emerald-400/40 space-y-1">
                  <div className="text-[10px] font-black uppercase text-emerald-300 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Impacto de Habilitadores
                  </div>
                  <div className="text-xl font-black text-white">
                    {simulationResult.hitsSavedByModifiers > 0
                      ? `-${simulationResult.hitsSavedByModifiers} Golpes Max`
                      : 'Sin bonos activos'}
                  </div>
                  <div className="text-xs font-bold text-emerald-200">
                    {simulationResult.secondsSavedByModifiers > 0
                      ? `Ahorras ${simulationResult.secondsSavedByModifiers}s y ${Math.max(0, simulationResult.baselineCyclesToKo - simulationResult.cyclesToKo)} ciclos`
                      : `Base: ${simulationResult.baselineTotalMaxHitsPerTrainer} Max hits / ${simulationResult.baselineEstimatedSeconds}s`}
                  </div>
                  <div className="text-[11px] text-slate-200 pt-1">
                    Sin bonos: {simulationResult.baselineCyclesToKo} ciclos ({simulationResult.baselineEstimatedSeconds}s)
                  </div>
                </div>
              </div>

              {/* Support Moves Summary (Defense-scaled Guard + HP%-scaled Spirit) */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-fuchsia-200 font-semibold">
                  <span>
                    🛡️ <strong>Maxibarrera</strong> crea 20/40/60/80 PS de escudo que rinden según la <strong>Defensa + Resistencias</strong> del usuario (daño mitigado / golpes aguantados).
                  </span>
                  <span>
                    💚 <strong>Maxivigor</strong> cura el <strong>8% / 12% / 16% / 20%</strong> de la <strong>Salud máxima</strong> del usuario al equipo.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {simulationResult.unitBreakdowns.map((bd) => (
                    <div
                      key={bd.slotIndex}
                      className="bg-black/35 rounded-2xl p-3.5 border border-white/15 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
                        <span className="font-black text-amber-300 truncate">
                          #{bd.slotIndex + 1} {bd.unitName}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300 shrink-0">
                          DEF {bd.effectiveDefense} · HP {bd.maxHp}
                        </span>
                      </div>

                      {/* Max Guard Details */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-sky-200">
                          <span>🛡️ Maxibarrera (Nv.{bd.effectiveGuardLevel}):</span>
                          <span className="font-black text-white">
                            {bd.guardHpPerUse > 0
                              ? `EHP ${bd.guardEffectiveHpPerUse} (×3: ${bd.guardEffectiveHpThreeStacks})`
                              : 'Bloqueado'}
                          </span>
                        </div>
                        {bd.guardHpPerUse > 0 ? (
                          <div className="text-[10px] text-slate-300 flex justify-between">
                            <span>
                              Base {bd.guardHpPerUse} PS ·{' '}
                              {bd.defenseDamageReductionPct >= 0
                                ? `Mitigación DEF ${bd.defenseDamageReductionPct}%`
                                : `Vulnerable (${bd.defenseDamageReductionPct}%)`}
                            </span>
                            <span className="text-sky-300 font-bold">
                              ~{(bd.bossHitsAbsorbedByGuard * 3).toFixed(1)} golpes jefe (×3)
                            </span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400">
                            Ataque fuerte del jefe estimado: {bd.bossEstimatedHitDamage} HP
                          </div>
                        )}
                      </div>

                      {/* Max Spirit Details */}
                      <div className="space-y-0.5 border-t border-white/10 pt-1.5">
                        <div className="flex justify-between text-emerald-200">
                          <span>💚 Maxivigor (Nv.{bd.effectiveSpiritLevel}):</span>
                          <span className="font-black text-white">
                            {bd.spiritHealHpPerUse > 0
                              ? `${bd.spiritHealPct}% HP (+${bd.spiritHealHpPerUse} PS)`
                              : 'Bloqueado'}
                          </span>
                        </div>
                        {bd.spiritHealHpPerUse > 0 && (
                          <div className="text-[10px] text-slate-300 flex justify-between">
                            <span>
                              {bd.spiritHealPct}% de {bd.maxHp} PS del usuario
                            </span>
                            <span className="text-emerald-300 font-bold">
                              3 usos: +{bd.spiritHealHpThreeUses} PS
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Transparent Formula Breakdown Table */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-md space-y-3">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-fuchsia-600" />
                Desglose Exacto de Ataques y Fórmula por Pokémon
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-[10px] font-black uppercase text-slate-500">
                      <th className="py-2 pr-3">Pokémon</th>
                      <th className="py-2 px-2">Stats Efec. (ATQ / DEF / HP)</th>
                      <th className="py-2 px-2">Ataque Rápido (Energía Max)</th>
                      <th className="py-2 px-2">Ataque Cargado</th>
                      <th className="py-2 px-2">Movimiento Max</th>
                      <th className="py-2 px-2">Daño 1 Golpe Max</th>
                      <th className="py-2 pl-2">Fase Max (×3) / KO Puro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {simulationResult.unitBreakdowns.map((bd) => (
                      <tr key={bd.slotIndex} className="hover:bg-slate-50">
                        <td className="py-3 pr-3 font-black text-slate-900">
                          #{bd.slotIndex + 1} {bd.unitName}
                        </td>
                        <td className="py-3 px-2 font-mono text-[11px] text-slate-700">
                          {bd.effectiveAttack} / {bd.effectiveDefense} / {bd.maxHp}
                        </td>
                        <td className="py-3 px-2">
                          <div className="font-bold text-slate-900">
                            {bd.fastDamage.moveNameEs}: <span className="text-sky-700 font-black">{bd.fastDamage.damage} HP</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {bd.fastMoveDuration}s · +{bd.maxEnergyPerFastHit} energía ({bd.maxEnergyPerSecond}/s)
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="font-bold text-slate-900">
                            {bd.chargedDamage.moveNameEs}: <span className="font-black">{bd.chargedDamage.damage} HP</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {bd.chargedDamage.typeMultiplier}x tipo {bd.chargedDamage.stab ? '· STAB' : ''}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="font-black text-fuchsia-700">
                            {bd.resolvedMaxMove.nameEs} (Nv.{bd.resolvedMaxMove.effectiveLevel})
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Pot {bd.resolvedMaxMove.power} · {bd.maxAttackDamage.typeMultiplier}x
                            {bd.maxAttackDamage.stab ? ' · STAB 1.2x' : ''}
                            {bd.maxAttackDamage.totalExternalMultiplier > 1
                              ? ` · ×${bd.maxAttackDamage.totalExternalMultiplier.toFixed(2)} bonos`
                              : ''}
                          </div>
                        </td>
                        <td className="py-3 px-2 font-black text-rose-700">
                          {bd.maxAttackDamage.damage.toLocaleString()} HP
                          <div className="text-[10px] font-bold text-slate-500">
                            ({bd.maxAttackDamage.bossHpPercent}% · Base sin bonos: {bd.baselineMaxAttackDamage})
                          </div>
                        </td>
                        <td className="py-3 pl-2 font-black text-slate-900">
                          {bd.maxPhaseThreeHitsDamage.toLocaleString()} HP ({bd.maxPhaseThreeHitsPct}%)
                          <div className="text-[10px] font-bold text-fuchsia-700">
                            {bd.pureMaxHitsToKo} golpes ({bd.pureMaxPhasesToKo} fases)
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BEST POKÉMON MAX BY TYPE */}
        {activeTab === 'rankings' && (
          <div className="space-y-6">
            {/* Overview of #1 King per Type */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-md space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Mejores Atacantes Max por Tipo (Los 18 Tipos)
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Recalculado automáticamente según tus habilitadores activos (Eternatus, Zacian, Maxiseta, Clima, Ayudantes). Haz clic en cualquier tipo para ver el Top 30 completo.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <label className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeAllPokedex}
                      onChange={(e) => setIncludeAllPokedex(e.target.checked)}
                      className="accent-fuchsia-600"
                    />
                    <span>Toda la Pokédex</span>
                  </label>
                  <label className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rankingAgainstBoss}
                      onChange={(e) => setRankingAgainstBoss(e.target.checked)}
                      className="accent-fuchsia-600"
                    />
                    <span>Efectividad vs {boss.name}</span>
                  </label>
                </div>
              </div>

              {/* 18-Type Selector Grid showing #1 of each type */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {topKingsPerType.map(({ type, king }) => {
                  const isSel = selectedRankingType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedRankingType(type)}
                      className={`p-2 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        isSel
                          ? 'border-fuchsia-600 bg-fuchsia-50 ring-2 ring-fuchsia-300'
                          : 'border-slate-200 bg-slate-50 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase ${TYPE_COLORS[type]}`}
                        >
                          {getTypeLabel(type, language)}
                        </span>
                        {king?.entry.isGigantamax && (
                          <span className="text-[8px] font-black text-fuchsia-700 bg-fuchsia-100 px-1 rounded">
                            GMAX
                          </span>
                        )}
                      </div>
                      {king ? (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <img
                            src={king.entry.spriteUrl}
                            alt={king.entry.name}
                            className="w-7 h-7 object-contain shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-[11px] font-black text-slate-900 truncate">
                              {king.entry.displayNameEs.replace(' Gigamax', '').replace(' (Dinamax)', '')}
                            </div>
                            <div className="text-[9px] font-bold text-slate-500 truncate">
                              {king.maxMoveDamage.toLocaleString()} HP
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 font-bold">Sin datos</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed Ranking for Selected Type */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-md space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${TYPE_COLORS[selectedRankingType]}`}
                  >
                    Tipo {getTypeLabel(selectedRankingType, language)}
                  </span>
                  <h4 className="text-sm font-black text-slate-900">
                    Top Atacantes Max de Tipo {getTypeLabel(selectedRankingType, language)}
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-xl">
                    <span className="font-bold text-slate-500">Nivel:</span>
                    {[20, 30, 40, 50].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setRankingLevel(lvl)}
                        className={`px-2 py-0.5 rounded font-black cursor-pointer ${
                          rankingLevel === lvl ? 'bg-slate-900 text-white' : 'text-slate-600'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-xl">
                    <span className="font-bold text-slate-500">Mov. Max:</span>
                    {([1, 2, 3] as MaxMoveLevel[]).map((ml) => (
                      <button
                        key={ml}
                        onClick={() => setRankingMaxLevel(ml)}
                        className={`px-2 py-0.5 rounded font-black cursor-pointer ${
                          rankingMaxLevel === ml ? 'bg-rose-600 text-white' : 'text-slate-600'
                        }`}
                      >
                        Nv.{ml}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {typeRankingList.length === 0 ? (
                <div className="p-6 text-center text-xs font-bold text-slate-500 bg-slate-50 rounded-2xl">
                  No hay Pokémon en el Pool Oficial Max que cubran este tipo todavía. Activa "Toda la Pokédex" para ver el ranking teórico completo.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b-2 border-slate-200 text-[10px] font-black uppercase text-slate-500">
                        <th className="py-2 pr-2">#</th>
                        <th className="py-2 px-2">Pokémon</th>
                        <th className="py-2 px-2">Ataque Rápido Requerido</th>
                        <th className="py-2 px-2">Movimiento Max</th>
                        <th className="py-2 px-2">Daño (1 Golpe / Fase ×3)</th>
                        <th className="py-2 px-2">% vs #1</th>
                        <th className="py-2 pl-2 text-right">Enviar al Simulador</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {typeRankingList.map((row) => (
                        <tr key={row.entry.key} className="hover:bg-fuchsia-50/40">
                          <td className="py-2.5 pr-2 font-black text-slate-700">{row.rank}</td>
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-2">
                              <img
                                src={row.entry.spriteUrl}
                                alt={row.entry.name}
                                className="w-8 h-8 object-contain"
                              />
                              <div>
                                <div className="font-black text-slate-900 flex items-center gap-1.5">
                                  <span>{row.entry.displayNameEs}</span>
                                  {row.entry.isGigantamax ? (
                                    <span className="text-[9px] bg-fuchsia-600 text-white px-1.5 rounded-full">
                                      G-MAX
                                    </span>
                                  ) : row.resolvedMaxMove.category === 'signature' ? (
                                    <span className="text-[9px] bg-indigo-600 text-white px-1.5 rounded-full">
                                      ESPECIAL
                                    </span>
                                  ) : (
                                    <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 rounded-full">
                                      D-MAX
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 font-bold">
                                  ATQ Efec: {row.effectiveAttack} {row.stab ? '· STAB 1.2x' : ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 font-bold text-slate-800">
                            {getSpanishMoveName(row.requiredFastMove.name)}
                            <span className="text-[10px] text-slate-500 block">
                              {getFastMoveDuration(row.requiredFastMove.name)}s
                              {isHalfSecondFastMove(row.requiredFastMove.name) ? ' ⚡ 0.5s' : ''}
                            </span>
                          </td>
                          <td className="py-2.5 px-2">
                            <div className="font-black text-fuchsia-700">
                              {row.resolvedMaxMove.nameEs}
                            </div>
                            <div className="text-[10px] font-bold text-slate-500">
                              Nv.{row.resolvedMaxMove.effectiveLevel} · Pot {row.resolvedMaxMove.power}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 font-black text-rose-700">
                            {row.maxMoveDamage.toLocaleString()} HP
                            <span className="text-[10px] font-bold text-slate-500 block">
                              ×3: {row.threeHitDamage.toLocaleString()} HP
                            </span>
                          </td>
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-14 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-fuchsia-600"
                                  style={{ width: `${row.scorePct}%` }}
                                />
                              </div>
                              <span className="font-black text-slate-700">{row.scorePct}%</span>
                            </div>
                          </td>
                          <td className="py-2.5 pl-2 text-right">
                            <div className="inline-flex gap-1">
                              {([0, 1, 2] as const).map((sIdx) => (
                                <button
                                  key={sIdx}
                                  onClick={() =>
                                    assignEntryToSimulatorSlot(
                                      row.entry,
                                      sIdx,
                                      row.requiredFastMove,
                                      rankingLevel
                                    )
                                  }
                                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-fuchsia-600 hover:text-white text-[10px] font-black text-slate-700 transition-colors cursor-pointer"
                                >
                                  S{sIdx + 1}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
