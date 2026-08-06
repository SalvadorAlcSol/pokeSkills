import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Swords,
  Shield,
  Zap,
  Search,
  Check,
  Sparkles,
  Heart,
  Loader2,
  Sparkle,
} from 'lucide-react';
import { PokemonType } from '../data/pokemonData';
import {
  POGO_DATABASE,
  PogoPokemon,
  PogoMove,
  MegaForm,
} from '../data/pogoDatabase';
import {
  calculatePogoStats,
  calculatePogoMoveDamage,
} from '../utils/pokemonMath';
import { fetchPokemonFromPokeApi } from '../services/pokeApiService';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { getTranslatedMoveName } from '../utils/pogoMoveTranslator';
import { getTypeLabel } from '../utils/pogoTypeTranslator';
import { TypeFilterBar } from './TypeFilterBar';
import { TypeWeaknessBadgeList } from './TypeWeaknessBadgeList';
import { useInventoryStore } from '../store/inventoryStore';
import { UserPokemon } from '../types/UserInventory';

interface DamageCalculatorProps {
  onBackToHub?: () => void;
}

const TYPE_COLORS: Record<PokemonType, string> = {
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



export const DamageCalculator: React.FC<DamageCalculatorProps> = ({ onBackToHub }) => {
  const { inventory } = useInventoryStore();
  const [useUserInventoryAttacker, setUseUserInventoryAttacker] = useState<boolean>(false);
  const [selectedUserPokemonId, setSelectedUserPokemonId] = useState<string>('');

  // Custom database state
  const [customDatabase, setCustomDatabase] = useState<PogoPokemon[]>(POGO_DATABASE);

  // Attacker State
  const [attackerBase, setAttackerBase] = useState<PogoPokemon>(POGO_DATABASE[0]); // Charizard
  const [isAttackerMegaActive, setIsAttackerMegaActive] = useState<boolean>(false);
  const [selectedAttackerMegaId, setSelectedAttackerMegaId] = useState<string>(''); // For multi megas (mega-x / mega-y)

  const [attackerSearch, setAttackerSearch] = useState<string>('');
  const [showAttackerDropdown, setShowAttackerDropdown] = useState<boolean>(false);
  const [isSearchingAttackerApi, setIsSearchingAttackerApi] = useState<boolean>(false);

  const [attackerLevel, setAttackerLevel] = useState<number>(40);
  const [attackerIvAtk, setAttackerIvAtk] = useState<number>(15);
  const [attackerIvDef, setAttackerIvDef] = useState<number>(15);
  const [attackerIvHp, setAttackerIvHp] = useState<number>(15);

  // Attacker Moves
  const [selectedFastMove, setSelectedFastMove] = useState<PogoMove>(POGO_DATABASE[0].fastMoves[0]);
  const [selectedChargedMove1, setSelectedChargedMove1] = useState<PogoMove>(POGO_DATABASE[0].chargedMoves[0]);
  const [enableSecondCharged, setEnableSecondCharged] = useState<boolean>(true);
  const [selectedChargedMove2, setSelectedChargedMove2] = useState<PogoMove | null>(
    POGO_DATABASE[0].chargedMoves[1] || null
  );

  // Helper to load exact stats and moves from user's box item
  const selectAttackerFromUserPokemon = (userPoke: UserPokemon) => {
    setSelectedUserPokemonId(userPoke.id);

    const dbMatch = POGO_DATABASE.find(
      (p) => p.id.toString() === userPoke.speciesId || p.name.toLowerCase() === userPoke.name.toLowerCase()
    );

    if (dbMatch) {
      setAttackerBase(dbMatch);
      setAttackerLevel(userPoke.level || 40);
      setAttackerIvAtk(userPoke.ivAtk ?? 15);
      setAttackerIvDef(userPoke.ivDef ?? 15);
      setAttackerIvHp(userPoke.ivHp ?? 15);

      const fMove = dbMatch.fastMoves.find(
        (m) => m.name.toLowerCase() === userPoke.fastMove?.toLowerCase() || m.id.toLowerCase() === userPoke.fastMove?.toLowerCase()
      );
      if (fMove) setSelectedFastMove(fMove);

      const cMove1 = dbMatch.chargedMoves.find(
        (m) => m.name.toLowerCase() === userPoke.chargedMove1?.toLowerCase() || m.id.toLowerCase() === userPoke.chargedMove1?.toLowerCase()
      );
      if (cMove1) setSelectedChargedMove1(cMove1);

      if (userPoke.chargedMove2) {
        setEnableSecondCharged(true);
        const cMove2 = dbMatch.chargedMoves.find(
          (m) => m.name.toLowerCase() === userPoke.chargedMove2?.toLowerCase() || m.id.toLowerCase() === userPoke.chargedMove2?.toLowerCase()
        );
        if (cMove2) setSelectedChargedMove2(cMove2);
      } else {
        setEnableSecondCharged(false);
        setSelectedChargedMove2(null);
      }

      if (userPoke.unlockedMegaForm) {
        const forms = dbMatch.specialForms || dbMatch.megaForms;
        if (forms && forms.length > 0) {
          setIsAttackerMegaActive(true);
          const formMatch = forms.find((f) => f.id.toLowerCase() === userPoke.unlockedMegaForm?.toLowerCase());
          if (formMatch) {
            setSelectedAttackerMegaId(formMatch.id);
          }
        }
      } else {
        setIsAttackerMegaActive(false);
      }
    }
  };

  // Reactive selector for user box selection
  useEffect(() => {
    if (useUserInventoryAttacker && selectedUserPokemonId) {
      const poke = inventory.find((p) => p.id === selectedUserPokemonId);
      if (poke) {
        selectAttackerFromUserPokemon(poke);
      }
    }
  }, [selectedUserPokemonId, useUserInventoryAttacker, inventory]);

  // Defender State
  const [defenderBase, setDefenderBase] = useState<PogoPokemon>(POGO_DATABASE[1]); // Venusaur
  const [isDefenderMegaActive, setIsDefenderMegaActive] = useState<boolean>(false);
  const [selectedDefenderMegaId, setSelectedDefenderMegaId] = useState<string>('');

  const [defenderSearch, setDefenderSearch] = useState<string>('');
  const [showDefenderDropdown, setShowDefenderDropdown] = useState<boolean>(false);
  const [isSearchingDefenderApi, setIsSearchingDefenderApi] = useState<boolean>(false);

  const [defenderLevel, setDefenderLevel] = useState<number>(40);
  const [defenderIvAtk, setDefenderIvAtk] = useState<number>(15);
  const [defenderIvDef, setDefenderIvDef] = useState<number>(15);
  const [defenderIvHp, setDefenderIvHp] = useState<number>(15);

  // Reset Attacker Special Form state when Attacker Base changes
  useEffect(() => {
    if (useUserInventoryAttacker) return;
    setIsAttackerMegaActive(false);
    const forms = attackerBase.specialForms || attackerBase.megaForms;
    if (forms && forms.length > 0) {
      setSelectedAttackerMegaId(forms[0].id);
    } else {
      setSelectedAttackerMegaId('');
    }

    if (attackerBase.fastMoves.length > 0) {
      setSelectedFastMove(attackerBase.fastMoves[0]);
    }
    if (attackerBase.chargedMoves.length > 0) {
      setSelectedChargedMove1(attackerBase.chargedMoves[0]);
    }
    if (attackerBase.chargedMoves.length > 1) {
      setSelectedChargedMove2(attackerBase.chargedMoves[1]);
    } else {
      setSelectedChargedMove2(null);
    }
  }, [attackerBase, useUserInventoryAttacker]);

  // Reset Defender Special Form state when Defender Base changes
  useEffect(() => {
    setIsDefenderMegaActive(false);
    const forms = defenderBase.specialForms || defenderBase.megaForms;
    if (forms && forms.length > 0) {
      setSelectedDefenderMegaId(forms[0].id);
    } else {
      setSelectedDefenderMegaId('');
    }
  }, [defenderBase]);

  // Active Attacker Data (Normal vs Special Form based on Checkbox + Selected Form ID)
  const activeAttacker = useMemo(() => {
    const forms = attackerBase.specialForms || attackerBase.megaForms;
    if (isAttackerMegaActive && forms && forms.length > 0) {
      const form =
        forms.find((m) => m.id === selectedAttackerMegaId) ||
        forms[0];
      return {
        name: form.name,
        types: form.types,
        baseAttack: form.baseAttack,
        baseDefense: form.baseDefense,
        baseStamina: form.baseStamina,
        spriteUrl: form.spriteUrl,
      };
    }
    return {
      name: attackerBase.name,
      types: attackerBase.types,
      baseAttack: attackerBase.baseAttack,
      baseDefense: attackerBase.baseDefense,
      baseStamina: attackerBase.baseStamina,
      spriteUrl: attackerBase.spriteUrl,
    };
  }, [attackerBase, isAttackerMegaActive, selectedAttackerMegaId]);

  // Active Attacker Moveset (Updates dynamically for Special Forms / Fusionados)
  const activeAttackerMoves = useMemo(() => {
    const forms = attackerBase.specialForms || attackerBase.megaForms;
    if (isAttackerMegaActive && forms && forms.length > 0) {
      const form = forms.find((m) => m.id === selectedAttackerMegaId) || forms[0];
      return {
        fastMoves: form.fastMoves && form.fastMoves.length > 0 ? form.fastMoves : attackerBase.fastMoves,
        chargedMoves: form.chargedMoves && form.chargedMoves.length > 0 ? form.chargedMoves : attackerBase.chargedMoves,
      };
    }
    return {
      fastMoves: attackerBase.fastMoves,
      chargedMoves: attackerBase.chargedMoves,
    };
  }, [attackerBase, isAttackerMegaActive, selectedAttackerMegaId]);

  // Sync moves when activeAttackerMoves change
  useEffect(() => {
    if (useUserInventoryAttacker) return;
    if (activeAttackerMoves.fastMoves.length > 0) {
      setSelectedFastMove(activeAttackerMoves.fastMoves[0]);
    }
    if (activeAttackerMoves.chargedMoves.length > 0) {
      setSelectedChargedMove1(activeAttackerMoves.chargedMoves[0]);
    }
    if (activeAttackerMoves.chargedMoves.length > 1) {
      setSelectedChargedMove2(activeAttackerMoves.chargedMoves[1]);
    } else {
      setSelectedChargedMove2(null);
    }
  }, [activeAttackerMoves, useUserInventoryAttacker]);

  // Active Defender Data (Normal vs Special Form based on Checkbox + Selected Form ID)
  const activeDefender = useMemo(() => {
    const forms = defenderBase.specialForms || defenderBase.megaForms;
    if (isDefenderMegaActive && forms && forms.length > 0) {
      const form =
        forms.find((m) => m.id === selectedDefenderMegaId) ||
        forms[0];
      return {
        name: form.name,
        types: form.types,
        baseAttack: form.baseAttack,
        baseDefense: form.baseDefense,
        baseStamina: form.baseStamina,
        spriteUrl: form.spriteUrl,
      };
    }
    return {
      name: defenderBase.name,
      types: defenderBase.types,
      baseAttack: defenderBase.baseAttack,
      baseDefense: defenderBase.baseDefense,
      baseStamina: defenderBase.baseStamina,
      spriteUrl: defenderBase.spriteUrl,
    };
  }, [defenderBase, isDefenderMegaActive, selectedDefenderMegaId]);

  // Calculated Stats
  const attackerStats = useMemo(() => {
    return calculatePogoStats(
      activeAttacker.baseAttack,
      activeAttacker.baseDefense,
      activeAttacker.baseStamina,
      attackerLevel,
      attackerIvAtk,
      attackerIvDef,
      attackerIvHp
    );
  }, [activeAttacker, attackerLevel, attackerIvAtk, attackerIvDef, attackerIvHp]);

  const defenderStats = useMemo(() => {
    return calculatePogoStats(
      activeDefender.baseAttack,
      activeDefender.baseDefense,
      activeDefender.baseStamina,
      defenderLevel,
      defenderIvAtk,
      defenderIvDef,
      defenderIvHp
    );
  }, [activeDefender, defenderLevel, defenderIvAtk, defenderIvDef, defenderIvHp]);

  // Damage Calculations
  const fastMoveDamage = useMemo(() => {
    return calculatePogoMoveDamage({
      move: selectedFastMove,
      attackerTypes: activeAttacker.types,
      attackerStat: attackerStats.finalAttack,
      defenderTypes: activeDefender.types,
      defenderStat: defenderStats.finalDefense,
      defenderMaxHp: defenderStats.finalHp,
    });
  }, [selectedFastMove, activeAttacker, attackerStats, activeDefender, defenderStats]);

  const chargedMove1Damage = useMemo(() => {
    return calculatePogoMoveDamage({
      move: selectedChargedMove1,
      attackerTypes: activeAttacker.types,
      attackerStat: attackerStats.finalAttack,
      defenderTypes: activeDefender.types,
      defenderStat: defenderStats.finalDefense,
      defenderMaxHp: defenderStats.finalHp,
    });
  }, [selectedChargedMove1, activeAttacker, attackerStats, activeDefender, defenderStats]);

  const chargedMove2Damage = useMemo(() => {
    if (!enableSecondCharged || !selectedChargedMove2) return null;
    return calculatePogoMoveDamage({
      move: selectedChargedMove2,
      attackerTypes: activeAttacker.types,
      attackerStat: attackerStats.finalAttack,
      defenderTypes: activeDefender.types,
      defenderStat: defenderStats.finalDefense,
      defenderMaxHp: defenderStats.finalHp,
    });
  }, [enableSecondCharged, selectedChargedMove2, activeAttacker, attackerStats, activeDefender, defenderStats]);

  // Type Filters State
  const [attackerSelectedTypes, setAttackerSelectedTypes] = useState<PokemonType[]>([]);
  const [defenderSelectedTypes, setDefenderSelectedTypes] = useState<PokemonType[]>([]);

  const handleToggleAttackerType = (type: PokemonType) => {
    setAttackerSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleToggleDefenderType = (type: PokemonType) => {
    setDefenderSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Search & Type Filtering
  const filteredAttackerList = useMemo(() => {
    let list = customDatabase;

    if (attackerSelectedTypes.length > 0) {
      list = list.filter((p) =>
        p.types.some((t) => attackerSelectedTypes.includes(t))
      );
    }

    if (attackerSearch.trim()) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(attackerSearch.toLowerCase())
      );
    }

    return list;
  }, [attackerSearch, customDatabase, attackerSelectedTypes]);

  const filteredDefenderList = useMemo(() => {
    let list = customDatabase;

    if (defenderSelectedTypes.length > 0) {
      list = list.filter((p) =>
        p.types.some((t) => defenderSelectedTypes.includes(t))
      );
    }

    if (defenderSearch.trim()) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(defenderSearch.toLowerCase())
      );
    }

    return list;
  }, [defenderSearch, customDatabase, defenderSelectedTypes]);

  // PokéAPI Dynamic Fetch
  const handleSearchAttackerApi = async () => {
    if (!attackerSearch.trim()) return;
    setIsSearchingAttackerApi(true);
    const fetched = await fetchPokemonFromPokeApi(attackerSearch);
    setIsSearchingAttackerApi(false);
    if (fetched) {
      setCustomDatabase((prev) => {
        if (prev.some((p) => p.id === fetched.id)) return prev;
        return [fetched, ...prev];
      });
      setAttackerBase(fetched);
      setAttackerSearch('');
      setShowAttackerDropdown(false);
    }
  };

  const handleSearchDefenderApi = async () => {
    if (!defenderSearch.trim()) return;
    setIsSearchingDefenderApi(true);
    const fetched = await fetchPokemonFromPokeApi(defenderSearch);
    setIsSearchingDefenderApi(false);
    if (fetched) {
      setCustomDatabase((prev) => {
        if (prev.some((p) => p.id === fetched.id)) return prev;
        return [fetched, ...prev];
      });
      setDefenderBase(fetched);
      setDefenderSearch('');
      setShowDefenderDropdown(false);
    }
  };
  // Mobile Tab Navigation State ('attacker' | 'defender' | 'results')
  const [mobileTab, setMobileTab] = useState<'attacker' | 'defender' | 'results'>('results');

  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-800 flex flex-col font-sans pb-12">
      {/* Pokédex Header */}
      <header className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 border-b-4 border-red-700 text-white px-4 py-3 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBackToHub && (
              <button
                onClick={onBackToHub}
                className="px-3 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-red-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{t.backToHub}</span>
              </button>
            )}

            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/40 flex items-center justify-center text-white shrink-0 shadow-inner">
              <Swords className="w-5 h-5 text-white" />
            </div>

            <div>
              <h1 className="text-lg font-black tracking-tight text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                {t.damageCalcHeader}
              </h1>
              <p className="text-[11px] font-medium text-red-100">
                {t.damageCalcHeaderSub}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-red-900 bg-yellow-300 px-3.5 py-1.5 rounded-full shadow-sm">
              <Sparkles className="w-4 h-4 text-red-600" />
              <span>{t.officialFormula}</span>
            </div>
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Mobile Sticky Tab Bar (Only visible on screens < 768px) */}
      <div className="md:hidden sticky top-[57px] z-20 bg-white border-b-2 border-slate-200 p-2 flex items-center justify-around gap-1.5 shadow-md font-sans">
        <button
          onClick={() => setMobileTab('attacker')}
          className={`flex-1 py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border ${
            mobileTab === 'attacker'
              ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
              : 'bg-slate-100 text-slate-700 border-slate-300'
          }`}
        >
          <Swords className="w-3.5 h-3.5" />
          <span>Atacante</span>
        </button>

        <button
          onClick={() => setMobileTab('defender')}
          className={`flex-1 py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border ${
            mobileTab === 'defender'
              ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
              : 'bg-slate-100 text-slate-700 border-slate-300'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Defensor</span>
        </button>

        <button
          onClick={() => setMobileTab('results')}
          className={`flex-1 py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border ${
            mobileTab === 'results'
              ? 'bg-red-600 text-white border-red-700 shadow-sm'
              : 'bg-slate-100 text-slate-700 border-slate-300'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Daño</span>
        </button>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-4 py-4 sm:py-6 flex-1 flex flex-col gap-6 font-sans">
        {/* Results Summary Card (Shown if mobileTab === 'results' on mobile, or always on desktop) */}
        <div className={`bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-5 shadow-md flex flex-col gap-4 ${mobileTab === 'results' ? 'block' : 'hidden md:block'}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <span className="text-sm font-extrabold tracking-wider text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                Desglose de Daño en HP: {activeAttacker.name} vs {activeDefender.name}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Defensor: {defenderStats.finalHp} HP Max • Nvl. {defenderLevel} ({defenderIvAtk}/{defenderIvDef}/{defenderIvHp})
              </span>
            </div>


            <div className="text-xs text-blue-900 font-extrabold bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl">
              Atacante Stats: {Math.round(attackerStats.finalAttack)} Atk (CPM: {attackerStats.cpm.toFixed(4)})
            </div>
          </div>


          {/* Cards for each Move Damage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fast Move Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md border border-blue-300">
                    ⚡ Movimiento Rápido
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${TYPE_COLORS[fastMoveDamage.moveType]}`}>
                    {getTypeLabel(fastMoveDamage.moveType, language)}
                  </span>
                </div>
                <h4 className="font-extrabold text-base text-slate-900 mb-1">{getTranslatedMoveName(fastMoveDamage.moveName, language)}</h4>
                <div className="text-xs text-slate-600 mb-3 font-medium">
                  Efectividad: <strong className="text-blue-700 font-extrabold">{fastMoveDamage.typeMultiplier}x</strong>
                  {fastMoveDamage.isStab && <span className="ml-1 text-purple-700 font-extrabold">(STAB 1.2x)</span>}
                </div>
              </div>

              <div className="bg-blue-100/70 p-3 rounded-xl border border-blue-300 text-center">
                <span className="text-[10px] text-blue-800 font-extrabold block uppercase">{t.damagePerHit}</span>
                <span className="text-2xl font-black text-blue-900">-{fastMoveDamage.damageHp} HP</span>
                <span className="text-xs text-blue-800 block mt-0.5 font-bold">
                  {fastMoveDamage.damagePercent}% {t.rivalLifePercent}
                </span>
              </div>
            </div>

            {/* Charged Move 1 Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-300">
                    🔥 {t.chargedMove1}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${TYPE_COLORS[chargedMove1Damage.moveType]}`}>
                    {getTypeLabel(chargedMove1Damage.moveType, language)}
                  </span>
                </div>
                <h4 className="font-extrabold text-base text-slate-900 mb-1">{getTranslatedMoveName(chargedMove1Damage.moveName, language)}</h4>
                <div className="text-xs text-slate-600 mb-3 font-medium">
                  Efectividad: <strong className="text-purple-700 font-extrabold">{chargedMove1Damage.typeMultiplier}x</strong>
                  {chargedMove1Damage.isStab && <span className="ml-1 text-purple-700 font-extrabold">(STAB 1.2x)</span>}
                </div>
              </div>

              <div className="bg-purple-100/70 p-3 rounded-xl border border-purple-300 text-center">
                <span className="text-[10px] text-purple-800 font-extrabold block uppercase">{t.damagePerHit}</span>
                <span className="text-2xl font-black text-purple-950">-{chargedMove1Damage.damageHp} HP</span>
                <span className="text-xs text-purple-800 block mt-0.5 font-bold">
                  {chargedMove1Damage.damagePercent}% {t.rivalLifePercent}
                </span>
              </div>
            </div>

            {/* Charged Move 2 Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase text-pink-800 bg-pink-100 px-2 py-0.5 rounded-md border border-pink-300">
                    💥 {t.chargedMove2}
                  </span>
                  {chargedMove2Damage && (
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${TYPE_COLORS[chargedMove2Damage.moveType]}`}>
                      {getTypeLabel(chargedMove2Damage.moveType, language)}
                    </span>
                  )}
                </div>

                {chargedMove2Damage ? (
                  <>
                    <h4 className="font-extrabold text-base text-slate-900 mb-1">{getTranslatedMoveName(chargedMove2Damage.moveName, language)}</h4>
                    <div className="text-xs text-slate-600 mb-3 font-medium">
                      Efectividad: <strong className="text-pink-700 font-extrabold">{chargedMove2Damage.typeMultiplier}x</strong>
                      {chargedMove2Damage.isStab && <span className="ml-1 text-purple-700 font-extrabold">(STAB 1.2x)</span>}
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400 font-medium italic">
                    Activa la casilla "2º Movimiento Cargado" abajo para configurar un segundo ataque.
                  </div>
                )}
              </div>

              {chargedMove2Damage && (
                <div className="bg-pink-100/70 p-3 rounded-xl border border-pink-300 text-center">
                  <span className="text-[10px] text-pink-800 font-extrabold block uppercase">Daño por Impacto</span>
                  <span className="text-2xl font-black text-pink-950">-{chargedMove2Damage.damageHp} HP</span>
                  <span className="text-xs text-pink-800 block mt-0.5 font-bold">
                    {chargedMove2Damage.damagePercent}% vida del rival
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Configuration Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
          {/* ATTACKER CONFIG PANEL */}
          <div className={`bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-5 shadow-md flex-col gap-4 ${mobileTab === 'attacker' ? 'flex' : 'hidden md:flex'}`}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-2">
                <Swords className="w-4 h-4 text-blue-600" />
                1. {t.attacker}
              </h3>
              <span className="text-[10px] font-extrabold text-blue-800 bg-blue-100 border border-blue-300 px-2.5 py-0.5 rounded-full uppercase">
                {t.offensiveTag}
              </span>
            </div>
            {/* Mis Pokémon (Caja) Box Selector Switch */}
            <div className="bg-amber-50 p-3.5 rounded-2xl border-2 border-amber-300 flex flex-col gap-2.5 shadow-xs">
              <label className="flex items-center gap-2.5 text-xs font-black text-amber-950 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useUserInventoryAttacker}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setUseUserInventoryAttacker(checked);
                    if (checked && inventory.length > 0) {
                      selectAttackerFromUserPokemon(inventory[0]);
                    }
                  }}
                  className="accent-amber-600 w-4 h-4 rounded cursor-pointer"
                />
                <span className="flex items-center gap-1.5 font-extrabold text-sm">
                  <span>📦 Usar Mis Pokémon (Mi Caja)</span>
                  <span className="bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-amber-500">
                    {inventory.length} en caja
                  </span>
                </span>
              </label>

              {useUserInventoryAttacker && (
                <div className="pt-2 border-t border-amber-200 space-y-1.5">
                  {inventory.length === 0 ? (
                    <p className="text-xs text-amber-900 font-extrabold italic bg-amber-100 p-2 rounded-xl border border-amber-300">
                      ⚠️ Tu caja Pokémon está vacía. ¡Añade o importa tus Pokémon desde tu perfil arriba (📦 Mi Caja) para usarlos aquí!
                    </p>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-black text-amber-950 uppercase tracking-wider mb-1">
                        Cargar Pokémon de Mi Caja (Stats & Movimientos Reales):
                      </label>
                      <select
                        value={selectedUserPokemonId}
                        onChange={(e) => {
                          const poke = inventory.find((p) => p.id === e.target.value);
                          if (poke) selectAttackerFromUserPokemon(poke);
                        }}
                        className="w-full bg-white border-2 border-amber-400 rounded-xl px-3 py-2 text-xs text-slate-900 font-black shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        {inventory.map((poke) => {
                          const ivPct = Math.round(((poke.ivAtk + poke.ivDef + poke.ivHp) / 45) * 100);
                          return (
                            <option key={poke.id} value={poke.id}>
                              {poke.nickname ? `${poke.nickname} (${poke.name})` : poke.name} — Nvl {poke.level || 30} | PC {poke.cp} | IV {ivPct}% ({poke.ivAtk}/{poke.ivDef}/{poke.ivHp})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!useUserInventoryAttacker && (
              <>
                {/* Type Filter Bar for Attacker */}
                <TypeFilterBar
                  selectedTypes={attackerSelectedTypes}
                  onToggleType={handleToggleAttackerType}
                  onClearTypes={() => setAttackerSelectedTypes([])}
                />

                {/* Live Autocomplete Search Bar */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t.searchAttacker}
                  </label>
                  <div className="relative flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={attackerSearch}
                        onFocus={() => setShowAttackerDropdown(true)}
                        onChange={(e) => {
                          setAttackerSearch(e.target.value);
                          setShowAttackerDropdown(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSearchAttackerApi();
                        }}
                        placeholder={`Actual: ${attackerBase.name}...`}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-red-500 focus:bg-white transition-all shadow-inner"
                      />
                    </div>
                    {attackerSearch && (
                      <button
                        onClick={handleSearchAttackerApi}
                        disabled={isSearchingAttackerApi}
                        className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shrink-0 flex items-center gap-1 transition-all shadow-sm"
                      >
                        {isSearchingAttackerApi ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          'Buscar API'
                        )}
                      </button>
                    )}
                  </div>

                  {/* Dropdown Menu List */}
                  {showAttackerDropdown && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-white border-2 border-slate-200 rounded-2xl shadow-xl p-1.5">
                      {filteredAttackerList.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-600 flex flex-col gap-2">
                          <span>{t.localDatabaseNote}</span>
                          <button
                            onClick={handleSearchAttackerApi}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-extrabold"
                          >
                            {t.searchPokeApiGlobal} "{attackerSearch}"
                          </button>
                        </div>
                      ) : (
                        filteredAttackerList.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setAttackerBase(p);
                              setAttackerSearch('');
                              setShowAttackerDropdown(false);
                            }}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <img src={p.spriteUrl} alt={p.name} className="w-8 h-8 object-contain" />
                              <div>
                                <span className="text-xs font-extrabold text-slate-900 block">{p.name}</span>
                                <div className="flex items-center gap-1">
                                  {p.types.map((tItem) => (
                                    <span key={tItem} className="text-[9px] uppercase text-slate-600 font-bold">
                                      {getTypeLabel(tItem, language)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            {((p.specialForms && p.specialForms.length > 0) || (p.megaForms && p.megaForms.length > 0)) && (
                              <span className="text-[9px] bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded-full font-extrabold uppercase">
                                {p.specialForms?.[0]?.category || 'ESPECIAL'}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Checkbox for Special Forms & Megas (ONLY IF POKEMON HAS SPECIAL FORMS / MEGAS) */}
            {((attackerBase.specialForms && attackerBase.specialForms.length > 0) ||
              (attackerBase.megaForms && attackerBase.megaForms.length > 0)) && (
              <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-200 flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs font-bold text-purple-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAttackerMegaActive}
                    onChange={(e) => setIsAttackerMegaActive(e.target.checked)}
                    className="accent-purple-600 w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="flex items-center gap-1 font-extrabold">
                    <Sparkle className="w-4 h-4 text-purple-600 fill-purple-600" />
                    {t.enableSpecialForm || 'Activar Forma Especial (Mega, Fusionado, Transformado)'}
                  </span>
                </label>

                {/* If Enabled AND Pokemon has MORE THAN 1 Special Form */}
                {isAttackerMegaActive && (
                  <div className="pt-2 border-t border-purple-200 space-y-1">
                    <label className="block text-[11px] font-bold text-purple-800">
                      {t.selectFormVariant || 'Seleccionar Forma / Variante:'}
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {(attackerBase.specialForms || attackerBase.megaForms || []).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedAttackerMegaId(m.id)}
                          className={`flex-1 min-w-[120px] py-1.5 px-2.5 rounded-xl text-xs font-extrabold transition-all border ${
                            selectedAttackerMegaId === m.id
                              ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                              : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-100'
                          }`}
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Active Attacker Display Header */}
            <div className="flex flex-col gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-4">
                <img
                  src={activeAttacker.spriteUrl}
                  alt={activeAttacker.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = attackerBase.spriteUrl;
                  }}
                  className="w-20 h-20 object-contain drop-shadow-md shrink-0"
                />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="font-extrabold text-base text-slate-900 flex items-center justify-between">
                    <span className="truncate">{activeAttacker.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {activeAttacker.types.map((tItem) => (
                      <span
                        key={tItem}
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${TYPE_COLORS[tItem]}`}
                      >
                        {getTypeLabel(tItem, language)}
                      </span>
                    ))}
                  </div>

                  <div className="text-[11px] text-slate-600 font-medium">
                    {t.baseAtkLabel}: <strong className="text-blue-700">{activeAttacker.baseAttack}</strong> | {t.baseDefLabel}:{' '}
                    <strong className="text-blue-700">{activeAttacker.baseDefense}</strong> | {t.baseStaLabel}:{' '}
                    <strong className="text-blue-700">{activeAttacker.baseStamina}</strong>
                  </div>
                </div>
              </div>

              {/* Weaknesses & Resistances Badges */}
              <TypeWeaknessBadgeList types={activeAttacker.types} />
            </div>

            {/* MOVES SELECTION FOR THIS POKEMON */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                {t.movesFor} {activeAttacker.name}:
              </h4>

              {/* Fast Move Selector */}
              <div>
                <label className="block text-slate-700 text-[11px] font-bold mb-1">{t.fastMove}:</label>
                <select
                  value={selectedFastMove.id}
                  onChange={(e) => {
                    const found = activeAttackerMoves.fastMoves.find((m) => m.id === e.target.value);
                    if (found) setSelectedFastMove(found);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-red-500 shadow-sm"
                >
                  {activeAttackerMoves.fastMoves.map((m) => (
                    <option key={m.id} value={m.id}>
                      {getTranslatedMoveName(m.name, language)} - {m.type.toUpperCase()} (Pwr: {m.power})
                    </option>
                  ))}
                </select>
              </div>

              {/* Charged Move 1 Selector */}
              <div>
                <label className="block text-slate-700 text-[11px] font-bold mb-1">{t.chargedMove1}:</label>
                <select
                  value={selectedChargedMove1.id}
                  onChange={(e) => {
                    const found = activeAttackerMoves.chargedMoves.find((m) => m.id === e.target.value);
                    if (found) setSelectedChargedMove1(found);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-red-500 shadow-sm"
                >
                  {activeAttackerMoves.chargedMoves.map((m) => (
                    <option key={m.id} value={m.id}>
                      {getTranslatedMoveName(m.name, language)} - {m.type.toUpperCase()} (Pwr: {m.power})
                    </option>
                  ))}
                </select>
              </div>

              {/* Checkbox for 2nd Charged Move */}
              <label className="flex items-center gap-2 text-xs font-bold text-pink-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={enableSecondCharged}
                  onChange={(e) => setEnableSecondCharged(e.target.checked)}
                  className="accent-pink-600 w-4 h-4 rounded"
                />
                <span>{t.unlockCharged2}</span>
              </label>

              {/* Charged Move 2 Selector */}
              {enableSecondCharged && (
                <div>
                  <label className="block text-slate-700 text-[11px] font-bold mb-1">{t.chargedMove2}:</label>
                  <select
                    value={selectedChargedMove2?.id || ''}
                    onChange={(e) => {
                      const found = activeAttackerMoves.chargedMoves.find((m) => m.id === e.target.value);
                      if (found) setSelectedChargedMove2(found);
                    }}
                    className="w-full bg-white border border-pink-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-pink-500 shadow-sm"
                  >
                    {activeAttackerMoves.chargedMoves.map((m) => (
                      <option key={m.id} value={m.id}>
                        {getTranslatedMoveName(m.name, language)} - {m.type.toUpperCase()} (Pwr: {m.power})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Level (1-50) & IVs (0-15) Controls */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                  <span>Nivel (PoGo 1 - 50):</span>
                  <span className="font-extrabold text-blue-700 text-sm bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                    Nvl. {attackerLevel}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setAttackerLevel((prev) => Math.max(1, prev - 0.5))}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-base flex items-center justify-center shrink-0 border border-slate-300 active:scale-95 shadow-xs"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="0.5"
                    value={attackerLevel}
                    onChange={(e) => setAttackerLevel(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setAttackerLevel((prev) => Math.min(50, prev + 0.5))}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-base flex items-center justify-center shrink-0 border border-slate-300 active:scale-95 shadow-xs"
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-500 shrink-0">Acceso Rápido:</span>
                  {[30, 35, 40, 50].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setAttackerLevel(lvl)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black border transition-all ${
                        attackerLevel === lvl
                          ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      Nv.{lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* IVs 0-15 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700">Valores Individuales (IVs):</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAttackerIvAtk(15);
                      setAttackerIvDef(15);
                      setAttackerIvHp(15);
                    }}
                    className="text-[10px] font-black text-amber-950 bg-amber-400 hover:bg-amber-300 px-2 py-0.5 rounded-md border border-amber-500 shadow-2xs"
                  >
                    🏆 100% IV (15/15/15)
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold text-[10px] uppercase mb-1">Ataque (0-15):</label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={attackerIvAtk}
                      onChange={(e) => setAttackerIvAtk(Math.min(15, Math.max(0, Number(e.target.value))))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-slate-900 font-extrabold text-center text-sm shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold text-[10px] uppercase mb-1">Defensa (0-15):</label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={attackerIvDef}
                      onChange={(e) => setAttackerIvDef(Math.min(15, Math.max(0, Number(e.target.value))))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-slate-900 font-extrabold text-center text-sm shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold text-[10px] uppercase mb-1">Salud (0-15):</label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={attackerIvHp}
                      onChange={(e) => setAttackerIvHp(Math.min(15, Math.max(0, Number(e.target.value))))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-slate-900 font-extrabold text-center text-sm shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DEFENDER CONFIG PANEL */}
          <div className={`bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-5 shadow-md flex-col gap-4 ${mobileTab === 'defender' ? 'flex' : 'hidden md:flex'}`}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-purple-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600" />
                2. {t.defender}
              </h3>
              <span className="text-[10px] font-extrabold text-purple-800 bg-purple-100 border border-purple-300 px-2.5 py-0.5 rounded-full uppercase">
                {t.defensiveTag}
              </span>
            </div>

            {/* Type Filter Bar for Defender */}
            <TypeFilterBar
              selectedTypes={defenderSelectedTypes}
              onToggleType={handleToggleDefenderType}
              onClearTypes={() => setDefenderSelectedTypes([])}
            />

            {/* Live Autocomplete Search Bar */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.searchDefender}
              </label>
              <div className="relative flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={defenderSearch}
                    onFocus={() => setShowDefenderDropdown(true)}
                    onChange={(e) => {
                      setDefenderSearch(e.target.value);
                      setShowDefenderDropdown(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearchDefenderApi();
                    }}
                    placeholder={`Actual: ${defenderBase.name}...`}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-purple-600 focus:bg-white transition-all shadow-inner"
                  />
                </div>
                {defenderSearch && (
                  <button
                    onClick={handleSearchDefenderApi}
                    disabled={isSearchingDefenderApi}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shrink-0 flex items-center gap-1 transition-all shadow-sm"
                  >
                    {isSearchingDefenderApi ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Buscar API'
                    )}
                  </button>
                )}
              </div>

              {/* Dropdown Menu List */}
              {showDefenderDropdown && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-white border-2 border-slate-200 rounded-2xl shadow-xl p-1.5">
                  {filteredDefenderList.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-600 flex flex-col gap-2">
                      <span>{t.localDatabaseNote}</span>
                      <button
                        onClick={handleSearchDefenderApi}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-extrabold"
                      >
                        {t.searchPokeApiGlobal} "{defenderSearch}"
                      </button>
                    </div>
                  ) : (
                    filteredDefenderList.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setDefenderBase(p);
                          setDefenderSearch('');
                          setShowDefenderDropdown(false);
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <img src={p.spriteUrl} alt={p.name} className="w-8 h-8 object-contain" />
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 block">{p.name}</span>
                            <div className="flex items-center gap-1">
                              {p.types.map((tItem) => (
                                <span key={tItem} className="text-[9px] uppercase text-slate-600 font-bold">
                                  {getTypeLabel(tItem, language)}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        {((p.specialForms && p.specialForms.length > 0) || (p.megaForms && p.megaForms.length > 0)) && (
                          <span className="text-[9px] bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded-full font-extrabold uppercase">
                            {p.specialForms?.[0]?.category || 'ESPECIAL'}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Checkbox for Special Forms & Megas (ONLY IF POKEMON HAS SPECIAL FORMS / MEGAS) */}
            {((defenderBase.specialForms && defenderBase.specialForms.length > 0) ||
              (defenderBase.megaForms && defenderBase.megaForms.length > 0)) && (
              <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-200 flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs font-bold text-purple-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefenderMegaActive}
                    onChange={(e) => setIsDefenderMegaActive(e.target.checked)}
                    className="accent-purple-600 w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="flex items-center gap-1 font-extrabold">
                    <Sparkle className="w-4 h-4 text-purple-600 fill-purple-600" />
                    {t.enableSpecialForm || 'Activar Forma Especial'}
                  </span>
                </label>

                {/* If Enabled AND Pokemon has MORE THAN 1 Special Form */}
                {isDefenderMegaActive && (
                  <div className="pt-2 border-t border-purple-200 space-y-1">
                    <label className="block text-[11px] font-bold text-purple-800">
                      {t.selectFormVariant || 'Seleccionar Forma / Variante:'}
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {(defenderBase.specialForms || defenderBase.megaForms || []).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedDefenderMegaId(m.id)}
                          className={`flex-1 min-w-[120px] py-1.5 px-2.5 rounded-xl text-xs font-extrabold transition-all border ${
                            selectedDefenderMegaId === m.id
                              ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                              : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-100'
                          }`}
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Active Defender Display Header */}
            <div className="flex flex-col gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-4">
                <img
                  src={activeDefender.spriteUrl}
                  alt={activeDefender.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = defenderBase.spriteUrl;
                  }}
                  className="w-20 h-20 object-contain drop-shadow-md shrink-0"
                />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="font-extrabold text-base text-slate-900 flex items-center justify-between">
                    <span className="truncate">{activeDefender.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {activeDefender.types.map((tItem) => (
                      <span
                        key={tItem}
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${TYPE_COLORS[tItem]}`}
                      >
                        {getTypeLabel(tItem, language)}
                      </span>
                    ))}
                  </div>

                  <div className="text-[11px] text-slate-600 font-medium">
                    {t.baseAtkLabel}: <strong className="text-purple-700">{activeDefender.baseAttack}</strong> | {t.baseDefLabel}:{' '}
                    <strong className="text-purple-700">{activeDefender.baseDefense}</strong> | {t.baseStaLabel}:{' '}
                    <strong className="text-purple-700">{activeDefender.baseStamina}</strong>
                  </div>
                </div>
              </div>

              {/* Weaknesses & Resistances Badges */}
              <TypeWeaknessBadgeList types={activeDefender.types} />
            </div>

            {/* Level (1-50) & IVs (0-15) Controls */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                  <span>{t.defenderLevelLabel}</span>
                  <span className="font-extrabold text-purple-700 text-sm bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                    Nvl. {defenderLevel}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setDefenderLevel((prev) => Math.max(1, prev - 0.5))}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-base flex items-center justify-center shrink-0 border border-slate-300 active:scale-95 shadow-xs"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="0.5"
                    value={defenderLevel}
                    onChange={(e) => setDefenderLevel(Number(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setDefenderLevel((prev) => Math.min(50, prev + 0.5))}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-base flex items-center justify-center shrink-0 border border-slate-300 active:scale-95 shadow-xs"
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-500 shrink-0">Acceso Rápido:</span>
                  {[30, 35, 40, 50].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDefenderLevel(lvl)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black border transition-all ${
                        defenderLevel === lvl
                          ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      Nv.{lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* IVs 0-15 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700">Valores Individuales (IVs):</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDefenderIvAtk(15);
                      setDefenderIvDef(15);
                      setDefenderIvHp(15);
                    }}
                    className="text-[10px] font-black text-amber-950 bg-amber-400 hover:bg-amber-300 px-2 py-0.5 rounded-md border border-amber-500 shadow-2xs"
                  >
                    🏆 100% IV (15/15/15)
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold text-[10px] uppercase mb-1">Ataque (0-15):</label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={defenderIvAtk}
                      onChange={(e) => setDefenderIvAtk(Math.min(15, Math.max(0, Number(e.target.value))))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-slate-900 font-extrabold text-center text-sm shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold text-[10px] uppercase mb-1">Defensa (0-15):</label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={defenderIvDef}
                      onChange={(e) => setDefenderIvDef(Math.min(15, Math.max(0, Number(e.target.value))))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-slate-900 font-extrabold text-center text-sm shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold text-[10px] uppercase mb-1">Salud (0-15):</label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={defenderIvHp}
                      onChange={(e) => setDefenderIvHp(Math.min(15, Math.max(0, Number(e.target.value))))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-slate-900 font-extrabold text-center text-sm shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs font-extrabold text-slate-500">
        PokéTools Damage Calculator • Fórmula Oficial Pokémon GO
      </footer>
    </div>
  );
};

