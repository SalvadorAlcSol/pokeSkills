import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Search,
  Swords,
  Shield,
  Zap,
  Copy,
  Check,
  Award,
  Flame,
  Layers,
} from 'lucide-react';
import { POGO_DATABASE, PogoPokemon, PogoMove, getCPM } from '../data/pogoDatabase';
import { PokemonType } from '../data/pokemonData';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { getTranslatedMoveName } from '../utils/pogoMoveTranslator';
import { getTypeLabel } from '../utils/pogoTypeTranslator';
import { TypeWeaknessBadgeList } from './TypeWeaknessBadgeList';
import { getPogoTypeEffectiveness, calculateRaidBossCp, calculatePogoPokemonCp, RaidTier } from '../utils/pokemonMath';
import { useInventoryStore } from '../store/inventoryStore';
import { UserPokemon } from '../types/UserInventory';

function getBestCandyFarmingMega(bossTypes: PokemonType[], inventory: UserPokemon[]) {
  const eligible: {
    userPoke: UserPokemon;
    megaFormName: string;
    spriteUrl: string;
    megaLevel: number;
    matchingTypes: PokemonType[];
  }[] = [];

  inventory.forEach((userPoke) => {
    if (!userPoke.canMegaEvolve) return;

    const dbPoke = POGO_DATABASE.find(
      (p) => p.id.toString() === userPoke.speciesId || p.name.toLowerCase() === userPoke.name.toLowerCase()
    );
    let megaForms = dbPoke?.specialForms?.filter((f) => f.category === 'mega' || f.category === 'primal') || dbPoke?.megaForms;
    if (!megaForms || megaForms.length === 0) return;

    if (userPoke.unlockedMegaForm && userPoke.unlockedMegaForm !== 'all') {
      megaForms = megaForms.filter(
        (f) =>
          f.id.toLowerCase() === userPoke.unlockedMegaForm!.toLowerCase() ||
          f.id.toLowerCase().includes(userPoke.unlockedMegaForm!.toLowerCase())
      );
    }

    megaForms.forEach((mForm) => {
      const overlap = mForm.types.filter((t) => bossTypes.includes(t));
      const isKyogrePrimal = mForm.id.includes('kyogre') && bossTypes.some((t) => ['water', 'electric', 'bug'].includes(t));
      const isGroudonPrimal = mForm.id.includes('groudon') && bossTypes.some((t) => ['ground', 'fire', 'grass'].includes(t));
      const isRayquazaMega = mForm.id.includes('rayquaza') && bossTypes.some((t) => ['dragon', 'flying', 'psychic'].includes(t));

      if (overlap.length > 0 || isKyogrePrimal || isGroudonPrimal || isRayquazaMega) {
        eligible.push({
          userPoke,
          megaFormName: mForm.name,
          spriteUrl: mForm.spriteUrl,
          megaLevel: userPoke.megaLevel ?? 3,
          matchingTypes: overlap.length > 0 ? overlap : mForm.types,
        });
      }
    });
  });

  if (eligible.length === 0) return null;

  eligible.sort((a, b) => b.megaLevel - a.megaLevel);
  return eligible[0];
}

interface RaidTeamGeneratorProps {
  onBackToHub?: () => void;
}

// Popular Raid Bosses for quick selection
const POPULAR_BOSS_IDS = [
  150, // Mewtwo
  384, // Rayquaza
  382, // Kyogre
  383, // Groudon
  483, // Dialga
  484, // Palkia
  487, // Giratina
  248, // Tyranitar
  6,   // Charizard
  94,  // Gengar
];

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


interface CounterCandidate {
  id: string;
  name: string;
  spriteUrl: string;
  types: PokemonType[];
  fastMove: PogoMove;
  fastDamageHp: number;
  fastTypeMult: number;
  chargedMove: PogoMove;
  chargedDamageHp: number;
  chargedTypeMult: number;
  dps: number;
  typeMultiplier: number;
  isSpecialForm?: boolean;
}

export interface ActiveRaidBoss {
  id: string;
  pokemonId: number;
  name: string;
  types: PokemonType[];
  baseAttack: number;
  baseDefense: number;
  baseStamina: number;
  spriteUrl: string;
  fastMoves: PogoMove[];
  chargedMoves: PogoMove[];
  isSpecialForm: boolean;
  parentPokemon: PogoPokemon;
}

function createActiveBoss(p: PogoPokemon, formId?: string): ActiveRaidBoss {
  const forms = p.specialForms || p.megaForms;
  if (formId && forms) {
    const foundForm = forms.find((f) => f.id === formId);
    if (foundForm) {
      return {
        id: `${p.id}-${foundForm.id}`,
        pokemonId: p.id,
        name: foundForm.name,
        types: foundForm.types,
        baseAttack: foundForm.baseAttack,
        baseDefense: foundForm.baseDefense,
        baseStamina: foundForm.baseStamina,
        spriteUrl: foundForm.spriteUrl,
        fastMoves: foundForm.fastMoves && foundForm.fastMoves.length > 0 ? foundForm.fastMoves : p.fastMoves,
        chargedMoves: foundForm.chargedMoves && foundForm.chargedMoves.length > 0 ? foundForm.chargedMoves : p.chargedMoves,
        isSpecialForm: true,
        parentPokemon: p,
      };
    }
  }

  return {
    id: `${p.id}`,
    pokemonId: p.id,
    name: p.name,
    types: p.types,
    baseAttack: p.baseAttack,
    baseDefense: p.baseDefense,
    baseStamina: p.baseStamina,
    spriteUrl: p.spriteUrl,
    fastMoves: p.fastMoves,
    chargedMoves: p.chargedMoves,
    isSpecialForm: false,
    parentPokemon: p,
  };
}

function getSuggestedTier(boss: ActiveRaidBoss | PogoPokemon): RaidTier {
  const lowerName = boss.name.toLowerCase();

  // 1. Primigenia / Mega Legendaria (Tier 6 - 22,500 HP / 92k CP)
  if (
    lowerName.includes('primal') ||
    lowerName.includes('primigenio') ||
    lowerName.includes('mega rayquaza') ||
    lowerName.includes('mega mewtwo') ||
    lowerName.includes('mega latias') ||
    lowerName.includes('mega latios') ||
    lowerName.includes('mega diancie')
  ) {
    return 'primal';
  }

  // 2. Mega Raid (Mega Tier - 9,000 HP / 47k CP)
  if (lowerName.includes('mega')) {
    return 'mega';
  }

  // 3. Legendaria / Singular (Tier 5 - 15,000 HP / 54k CP)
  const LEGENDARY_MYTHICAL_IDS = new Set([
    // Gen 1: Articuno, Zapdos, Moltres, Mewtwo, Mew
    144, 145, 146, 150, 151,
    // Gen 2: Raikou, Entei, Suicune, Lugia, Ho-Oh, Celebi
    243, 244, 245, 249, 250, 251,
    // Gen 3: Regis, Latias, Latios, Kyogre, Groudon, Rayquaza, Jirachi, Deoxys
    377, 378, 379, 380, 381, 382, 383, 384, 385, 386,
    // Gen 4: Uxie, Mesprit, Azelf, Dialga, Palkia, Heatran, Regigigas, Giratina, Cresselia, Phione, Manaphy, Darkrai, Shaymin, Arceus
    480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493,
    // Gen 5: Cobalion, Terrakion, Virizion, Tornadus, Thundurus, Reshiram, Zekrom, Landorus, Kyurem, Keldeo, Meloetta, Genesect
    638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649,
    // Gen 6: Xerneas, Yveltal, Zygarde, Diancie, Hoopa, Volcanion
    716, 717, 718, 719, 720, 721,
    // Gen 7: Tapus, Solgaleo, Lunala, Ultra Beasts, Necrozma, Magearna, Marshadow, Poipole, Naganadel, Stakataka, Blacephalon, Zeraora, Meltan, Melmetal
    785, 786, 787, 788, 791, 792, 793, 794, 795, 796, 797, 798, 799, 800, 801, 802, 803, 804, 805, 806, 807, 808, 809,
    // Gen 8: Zacian, Zamazenta, Eternatus, Kubfu, Urshifu, Regieleki, Regidrago, Glastrier, Spectrier, Calyrex, Enamorus
    888, 889, 890, 891, 892, 894, 895, 896, 897, 898, 905,
    // Gen 9: Koraidon, Miraidon, Ting-Lu, Chien-Pao, Wo-Chien, Chi-Yu, Okidogi, Munkidori, Fezandipiti, Ogerpon, Terapagos, Pecharunt
    1007, 1008, 1009, 1010, 1001, 1002, 1003, 1004, 1014, 1015, 1016, 1017, 1024, 1025,
  ]);

  const pId = 'pokemonId' in boss ? boss.pokemonId : boss.id;
  if (LEGENDARY_MYTHICAL_IDS.has(pId)) {
    return '5';
  }

  // 4. Tier 1 (1,500 HP): Pokémon básicos, 1ª etapa o sin evolucionar (ej. Sinistea, Bulbasaur, Charmander, Machop, Gastly, Dratini)
  if (boss.baseAttack < 170) {
    return '1';
  }

  // 5. Tier 3 (3,600 HP): Evoluciones finales intermedias/avanzadas normales (Machamp, Dragonite, Tyranitar normal, Metagross normal, etc.)
  return '3';
}

export const RaidTeamGenerator: React.FC<RaidTeamGeneratorProps> = ({ onBackToHub }) => {
  const { t, language } = useLanguage();

  // Selected Active Raid Boss State (Default: Rayquaza #384 or first)
  const [activeBoss, setActiveBoss] = useState<ActiveRaidBoss>(() => {
    const defaultP = POGO_DATABASE.find((p) => p.id === 384) || POGO_DATABASE[0];
    return createActiveBoss(defaultP);
  });

  const [bossSearch, setBossSearch] = useState<string>('');
  const [showBossDropdown, setShowBossDropdown] = useState<boolean>(false);
  const [raidTier, setRaidTier] = useState<RaidTier>(() => getSuggestedTier(activeBoss));

  // Checkboxes for Raid Variants
  const [isShadowRaid, setIsShadowRaid] = useState<boolean>(false);
  const [isMegaSelected, setIsMegaSelected] = useState<boolean>(false);
  const [isSuperMegaSelected, setIsSuperMegaSelected] = useState<boolean>(false);
  const [isFusionSelected, setIsFusionSelected] = useState<boolean>(false);

  // Raid Goal (Max DPS vs Max Candy & XL Farming)
  const [raidGoal, setRaidGoal] = useState<'dps' | 'candies'>('dps');

  // Settings
  const [attackerLevel, setAttackerLevel] = useState<number>(40);
  const [includeSpecialForms, setIncludeSpecialForms] = useState<boolean>(true);
  const [copiedSearch, setCopiedSearch] = useState<boolean>(false);
  const [usePersonalBox, setUsePersonalBox] = useState<boolean>(false);
  const { inventory } = useInventoryStore();

  // Calculate Best Mega recommendation for Candy & XL Farming
  const bestCandyMega = useMemo(() => {
    return getBestCandyFarmingMega(activeBoss.types, inventory);
  }, [activeBoss.types, inventory]);

  // Calculate Real Raid Boss Combat Power (CP) & HP using activeBoss stats
  const { raidCp, raidHp } = useMemo(() => {
    return calculateRaidBossCp(activeBoss.baseAttack, activeBoss.baseDefense, raidTier);
  }, [activeBoss, raidTier]);

  // Select boss helper
  const handleSelectBoss = (p: PogoPokemon, formId?: string) => {
    const newBoss = createActiveBoss(p, formId);
    setActiveBoss(newBoss);
    setBossSearch('');
    setShowBossDropdown(false);
    setRaidTier(getSuggestedTier(newBoss));

    const isMegaOrPrimal =
      newBoss.name.toLowerCase().includes('mega') ||
      newBoss.name.toLowerCase().includes('primal') ||
      newBoss.name.toLowerCase().includes('primigenio');

    if (isMegaOrPrimal) {
      setIsShadowRaid(false);
    }
  };

  // Flattened Boss list including base forms & special forms for autocomplete
  const searchEntries = useMemo(() => {
    const list: { pokemon: PogoPokemon; formId?: string; displayName: string; spriteUrl: string; types: PokemonType[] }[] = [];

    POGO_DATABASE.forEach((p) => {
      list.push({
        pokemon: p,
        displayName: p.name,
        spriteUrl: p.spriteUrl,
        types: p.types,
      });

      const forms = p.specialForms || p.megaForms;
      if (forms) {
        forms.forEach((f) => {
          list.push({
            pokemon: p,
            formId: f.id,
            displayName: f.name,
            spriteUrl: f.spriteUrl,
            types: f.types,
          });
        });
      }
    });

    return list;
  }, []);

  // Filtered Boss list for dropdown (Normalized to support "mew two", "mew-two", "mewtwo")
  const filteredBossList = useMemo(() => {
    if (!bossSearch.trim()) return searchEntries.slice(0, 30);
    const rawQ = bossSearch.toLowerCase().trim();
    const cleanQ = rawQ.replace(/[\s\-_]+/g, '');
    return searchEntries.filter((item) => {
      const name = item.displayName.toLowerCase();
      const cleanName = name.replace(/[\s\-_]+/g, '');
      return name.includes(rawQ) || cleanName.includes(cleanQ);
    });
  }, [bossSearch, searchEntries]);

  // Calculate Top 6 Counter Team against selected Raid Boss
  const topTeam = useMemo(() => {
    const attackerCpm = getCPM(attackerLevel);
    const bossCpm = getCPM(40); // Raid Boss Level 40 standard

    const bossDef = (activeBoss.baseDefense + 15) * bossCpm;

    const candidates: CounterCandidate[] = [];

    // Helper to calculate damage and DPS
    const processAttacker = (
      id: string,
      name: string,
      spriteUrl: string,
      types: PokemonType[],
      baseAtk: number,
      fastMoves: PogoMove[],
      chargedMoves: PogoMove[],
      isSpecialForm = false
    ) => {
      const atkStat = (baseAtk + 15) * attackerCpm;

      let bestCombination: {
        fast: PogoMove;
        fastDmg: number;
        fastMult: number;
        charged: PogoMove;
        chargedDmg: number;
        chargedMult: number;
        dps: number;
        mult: number;
      } | null = null;

      fastMoves.forEach((fast) => {
        chargedMoves.forEach((charged) => {
          // Fast Move calc
          const fastStab = types.includes(fast.type) ? 1.2 : 1.0;
          const fastMult = getPogoTypeEffectiveness(fast.type, activeBoss.types);
          const fastDmg = Math.max(1, Math.floor(0.5 * fast.power * (atkStat / bossDef) * fastStab * fastMult) + 1);
          const fastDps = fastDmg / 1.0; // approx 1s fast move

          // Charged Move calc
          const chargedStab = types.includes(charged.type) ? 1.2 : 1.0;
          const chargedMult = getPogoTypeEffectiveness(charged.type, activeBoss.types);
          const chargedDmg = Math.max(1, Math.floor(0.5 * charged.power * (atkStat / bossDef) * chargedStab * chargedMult) + 1);
          const chargedDps = chargedDmg / 3.0; // approx 3s charged move

          // Combo DPS (Weighted 40% Fast + 60% Charged)
          const comboDps = fastDps * 0.4 + chargedDps * 0.6;
          const totalMult = Math.max(fastMult, chargedMult);

          if (!bestCombination || comboDps > bestCombination.dps) {
            bestCombination = {
              fast,
              fastDmg,
              fastMult,
              charged,
              chargedDmg,
              chargedMult,
              dps: comboDps,
              mult: totalMult,
            };
          }
        });
      });

      if (bestCombination) {
        candidates.push({
          id,
          name,
          spriteUrl,
          types,
          fastMove: bestCombination.fast,
          fastDamageHp: bestCombination.fastDmg,
          fastTypeMult: bestCombination.fastMult,
          chargedMove: bestCombination.charged,
          chargedDamageHp: bestCombination.chargedDmg,
          chargedTypeMult: bestCombination.chargedMult,
          dps: Number(bestCombination.dps.toFixed(1)),
          typeMultiplier: bestCombination.mult,
          isSpecialForm,
        });
      }
    };

    if (usePersonalBox && inventory.length > 0) {
      // PROCESS FROM USER INVENTORY (Form-aware: Megas, Primals, Fusions, Origin forms)
      inventory.forEach((userPoke) => {
        // Find exact stats and moves for this species or special form
        let attackerData: {
          baseAttack: number;
          types: PokemonType[];
          spriteUrl: string;
          fastMoves: PogoMove[];
          chargedMoves: PogoMove[];
        } | null = null;

        for (const p of POGO_DATABASE) {
          if (p.id.toString() === userPoke.speciesId || p.name.toLowerCase() === userPoke.name.toLowerCase()) {
            attackerData = {
              baseAttack: p.baseAttack,
              types: p.types,
              spriteUrl: p.spriteUrl,
              fastMoves: p.fastMoves,
              chargedMoves: p.chargedMoves,
            };
            break;
          }
          const forms = p.specialForms || p.megaForms;
          if (forms) {
            for (const f of forms) {
              if (`${p.id}-${f.id}` === userPoke.speciesId || f.name.toLowerCase() === userPoke.name.toLowerCase()) {
                attackerData = {
                  baseAttack: f.baseAttack,
                  types: f.types,
                  spriteUrl: f.spriteUrl,
                  fastMoves: f.fastMoves && f.fastMoves.length > 0 ? f.fastMoves : p.fastMoves,
                  chargedMoves: f.chargedMoves && f.chargedMoves.length > 0 ? f.chargedMoves : p.chargedMoves,
                };
                break;
              }
            }
          }
          if (attackerData) break;
        }

        if (!attackerData) return;

        // In personal box we know level and IV
        const pokeCpm = getCPM(userPoke.level);
        const atkStat = (attackerData.baseAttack + userPoke.ivAtk) * pokeCpm;
        
        // Find exact moves
        const fast = attackerData.fastMoves.find(m => m.name.toLowerCase() === userPoke.fastMove.toLowerCase()) || attackerData.fastMoves[0];
        const charged = attackerData.chargedMoves.find(m => m.name.toLowerCase() === userPoke.chargedMove1.toLowerCase()) || attackerData.chargedMoves[0];
        
        if (!fast || !charged) return;

        // Fast Move calc
        const fastStab = attackerData.types.includes(fast.type) ? 1.2 : 1.0;
        const fastMult = getPogoTypeEffectiveness(fast.type, activeBoss.types);
        const fastDmg = Math.max(1, Math.floor(0.5 * fast.power * (atkStat / bossDef) * fastStab * fastMult) + 1);
        const fastDps = fastDmg / 1.0;

        // Charged Move calc
        const chargedStab = attackerData.types.includes(charged.type) ? 1.2 : 1.0;
        const chargedMult = getPogoTypeEffectiveness(charged.type, activeBoss.types);
        const chargedDmg = Math.max(1, Math.floor(0.5 * charged.power * (atkStat / bossDef) * chargedStab * chargedMult) + 1);
        const chargedDps = chargedDmg / 3.0;

        const comboDps = fastDps * 0.4 + chargedDps * 0.6;
        const totalMult = Math.max(fastMult, chargedMult);

        candidates.push({
          id: userPoke.id,
          name: `${userPoke.name} (CP ${userPoke.cp})`,
          spriteUrl: attackerData.spriteUrl,
          types: attackerData.types,
          fastMove: fast,
          fastDamageHp: fastDmg,
          fastTypeMult: fastMult,
          chargedMove: charged,
          chargedDamageHp: chargedDmg,
          chargedTypeMult: chargedMult,
          dps: Number(comboDps.toFixed(1)),
          typeMultiplier: totalMult,
          isSpecialForm: userPoke.isShadow || userPoke.isPurified || userPoke.speciesId.includes('-'),
        });

        // If user explicitly marked THIS specific Pokemon as Mega-unlocked (canMegaEvolve = true)
        if (userPoke.canMegaEvolve) {
          const dbPoke = POGO_DATABASE.find(p => p.id.toString() === userPoke.speciesId || p.name.toLowerCase() === userPoke.name.toLowerCase());
          let megaForms = dbPoke?.specialForms?.filter(f => f.category === 'mega' || f.category === 'primal') || dbPoke?.megaForms;
          if (megaForms && megaForms.length > 0) {
            if (userPoke.unlockedMegaForm && userPoke.unlockedMegaForm !== 'all') {
              megaForms = megaForms.filter(f => f.id.toLowerCase() === userPoke.unlockedMegaForm!.toLowerCase() || f.id.toLowerCase().includes(userPoke.unlockedMegaForm!.toLowerCase()));
            }
            megaForms.forEach((mForm) => {
              const mFastMoves = mForm.fastMoves && mForm.fastMoves.length > 0 ? mForm.fastMoves : (dbPoke?.fastMoves || []);
              const mChargedMoves = mForm.chargedMoves && mForm.chargedMoves.length > 0 ? mForm.chargedMoves : (dbPoke?.chargedMoves || []);
              const mFast = mFastMoves.find(m => m.name.toLowerCase() === userPoke.fastMove.toLowerCase()) || mFastMoves[0];
              const mCharged = mChargedMoves.find(m => m.name.toLowerCase() === userPoke.chargedMove1.toLowerCase()) || mChargedMoves[0];

              if (mFast && mCharged) {
                const mAtkStat = (mForm.baseAttack + userPoke.ivAtk) * pokeCpm;
                const mFastStab = mForm.types.includes(mFast.type) ? 1.2 : 1.0;
                const mFastMult = getPogoTypeEffectiveness(mFast.type, activeBoss.types);
                const mFastDmg = Math.max(1, Math.floor(0.5 * mFast.power * (mAtkStat / bossDef) * mFastStab * mFastMult) + 1);
                const mFastDps = mFastDmg / 1.0;

                const mChargedStab = mForm.types.includes(mCharged.type) ? 1.2 : 1.0;
                const mChargedMult = getPogoTypeEffectiveness(mCharged.type, activeBoss.types);
                const mChargedDmg = Math.max(1, Math.floor(0.5 * mCharged.power * (mAtkStat / bossDef) * mChargedStab * mChargedMult) + 1);
                const mChargedDps = mChargedDmg / 3.0;

                const mComboDps = mFastDps * 0.4 + mChargedDps * 0.6;
                const mTotalMult = Math.max(mFastMult, mChargedMult);

                const megaCp = calculatePogoPokemonCp(mForm.baseAttack, mForm.baseDefense, mForm.baseStamina, userPoke.level, userPoke.ivAtk, userPoke.ivDef, userPoke.ivHp);

                candidates.push({
                  id: `${userPoke.id}-mega`,
                  name: `💎 ${mForm.name} (CP ${megaCp})`,
                  spriteUrl: mForm.spriteUrl,
                  types: mForm.types,
                  fastMove: mFast,
                  fastDamageHp: mFastDmg,
                  fastTypeMult: mFastMult,
                  chargedMove: mCharged,
                  chargedDamageHp: mChargedDmg,
                  chargedTypeMult: mChargedMult,
                  dps: Number(mComboDps.toFixed(1)),
                  typeMultiplier: mTotalMult,
                  isSpecialForm: true,
                });
              }
            });
          }
        }
      });
    } else {
      // Process all Pokemon in database (Theoretical)
      POGO_DATABASE.forEach((p) => {
        // Process base form
        processAttacker(
          `${p.id}`,
          p.name,
          p.spriteUrl,
          p.types,
          p.baseAttack,
          p.fastMoves,
          p.chargedMoves,
          false
        );

        // Process special forms / megas if enabled
        if (includeSpecialForms) {
          const forms = p.specialForms || p.megaForms;
          if (forms) {
            forms.forEach((form) => {
              const fMoves = form.fastMoves && form.fastMoves.length > 0 ? form.fastMoves : p.fastMoves;
              const cMoves = form.chargedMoves && form.chargedMoves.length > 0 ? form.chargedMoves : p.chargedMoves;
              processAttacker(
                `${p.id}-${form.id}`,
                form.name,
                form.spriteUrl,
                form.types,
                form.baseAttack,
                fMoves,
                cMoves,
                true
              );
            });
          }
        }
      });
    }

    // Sort by DPS descending and pick unique top 6
    candidates.sort((a, b) => b.dps - a.dps);

    // Filter to top 6 (limit max 1 per species unless Mega vs Normal)
    const result: CounterCandidate[] = [];
    const seenNames = new Set<string>();

    for (const cand of candidates) {
      if (!seenNames.has(cand.name)) {
        seenNames.add(cand.name);
        result.push(cand);
      }
      if (result.length >= 6) break;
    }

    return result;
  }, [activeBoss, attackerLevel, includeSpecialForms, usePersonalBox, inventory]);

  // Handle Copy Search String for PoGo
  const handleCopySearchString = () => {
    const names = topTeam.map((c) => c.name.split(' ')[0].toLowerCase()).join(',');
    navigator.clipboard.writeText(names);
    setCopiedSearch(true);
    setTimeout(() => setCopiedSearch(false), 2000);
  };

  const availableFormsList = useMemo(() => {
    const forms = activeBoss.parentPokemon.specialForms || activeBoss.parentPokemon.megaForms;
    if (!forms) return [];
    const seen = new Set<string>();
    const list: typeof forms = [];
    forms.forEach((f) => {
      const key = `${f.baseAttack}-${f.baseDefense}-${f.types.join(',')}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(f);
      }
    });
    return list;
  }, [activeBoss]);

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-800 flex flex-col font-sans">
      {/* Pokédex Top Bar Header */}
      <header className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 border-b-4 border-red-700 text-white shadow-md sticky top-0 z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
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

            <div>
              <h1 className="text-lg font-black tracking-tight text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                {t.raidGenHeader}
              </h1>
              <p className="text-[11px] font-medium text-red-100">
                {t.raidGenHeaderSub}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-red-900 bg-yellow-300 px-3.5 py-1.5 rounded-full shadow-sm">
              <Sparkles className="w-4 h-4 text-red-600" />
              <span>DPS Optimizer</span>
            </div>
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Top Control Grid: Boss Selector & Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Section 1: Raid Boss Search & Quick Select */}
          <div className="lg:col-span-2 bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-600" />
                {t.selectRaidBoss}
              </h3>
              <span className="text-[10px] font-extrabold text-red-700 bg-red-100 border border-red-300 px-2.5 py-0.5 rounded-full uppercase">
                POKÉMON GO RAID SYSTEM
              </span>
            </div>

            {/* Live Autocomplete Search Bar */}
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={bossSearch}
                  onFocus={() => setShowBossDropdown(true)}
                  onChange={(e) => {
                    setBossSearch(e.target.value);
                    setShowBossDropdown(true);
                  }}
                  placeholder={`Buscar Jefe de Raid: ${activeBoss.name}...`}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-red-500 focus:bg-white transition-all shadow-inner"
                />
              </div>

              {/* Dropdown Menu List */}
              {showBossDropdown && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-white border-2 border-slate-200 rounded-2xl shadow-xl p-1.5">
                  {filteredBossList.map((item) => (
                    <div
                      key={`${item.pokemon.id}-${item.formId || 'base'}`}
                      onClick={() => handleSelectBoss(item.pokemon, item.formId)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <img src={item.spriteUrl} alt={item.displayName} className="w-8 h-8 object-contain" />
                        <div>
                          <span className="text-xs font-extrabold text-slate-900 block">{item.displayName}</span>
                          <div className="flex items-center gap-1">
                            {item.types.map((tItem) => (
                              <span key={tItem} className="text-[9px] uppercase text-slate-600 font-bold">
                                {getTypeLabel(tItem, language)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {item.formId && (
                        <span className="text-[9px] font-extrabold uppercase bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full">
                          Forma Especial
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Selection Buttons for Popular Bosses */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                {t.quickSelectBosses}
              </label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_BOSS_IDS.map((bossId) => {
                  const p = POGO_DATABASE.find((item) => item.id === bossId);
                  if (!p) return null;
                  const isSelected = activeBoss.pokemonId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectBoss(p)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                        isSelected
                          ? 'bg-red-600 text-white border-red-700 shadow-md'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <img src={p.spriteUrl} alt={p.name} className="w-5 h-5 object-contain" />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Variant Checkboxes Panel (MEGA, SUPERMEGA, FUSIÓN/TRANSFORMACIÓN, OSCURA) */}
            <div className="bg-slate-100/80 p-3.5 rounded-2xl border border-slate-300 space-y-2.5">
              <label className="block text-[11px] font-black text-slate-800 uppercase tracking-wider">
                ⚙️ Opciones y Variantes del Jefe de Incursión:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                {/* Checkbox: Incursión Oscura (Shadow Raid) - Disabled for Megas/Primals */}
                {(() => {
                  const isMegaOrPrimalActive =
                    activeBoss.name.toLowerCase().includes('mega') ||
                    activeBoss.name.toLowerCase().includes('primal') ||
                    activeBoss.name.toLowerCase().includes('primigenio') ||
                    isMegaSelected ||
                    isSuperMegaSelected;

                  return (
                    <label
                      className={`flex items-center gap-2 p-2 rounded-xl border font-bold transition-all ${
                        isMegaOrPrimalActive
                          ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-60'
                          : isShadowRaid
                          ? 'bg-purple-950 text-purple-200 border-purple-600 shadow-md cursor-pointer'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer'
                      }`}
                      title={isMegaOrPrimalActive ? 'Las Mega Evoluciones y Primigenios no pueden ser Pokémon Oscuros (Shadow)' : ''}
                    >
                      <input
                        type="checkbox"
                        disabled={isMegaOrPrimalActive}
                        checked={isShadowRaid && !isMegaOrPrimalActive}
                        onChange={(e) => setIsShadowRaid(e.target.checked)}
                        className="accent-purple-500 w-4 h-4 rounded cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="flex items-center gap-1">
                        💀{' '}
                        <span>
                          {language === 'es' ? 'Incursión OSCURA (Shadow)' : 'SHADOW Raid'}
                          {isMegaOrPrimalActive && (
                            <span className="text-[9px] block font-normal text-slate-500">
                              (No disponible en Megas)
                            </span>
                          )}
                        </span>
                      </span>
                    </label>
                  );
                })()}

                {/* Checkbox: Versión MEGA (si el Pokémon tiene forma Mega) */}
                {availableFormsList.some((f) => f.category === 'mega' || f.name.toLowerCase().includes('mega')) && (
                  <label className={`flex items-center gap-2 p-2 rounded-xl border font-bold cursor-pointer transition-all ${
                    isMegaSelected || activeBoss.name.toLowerCase().includes('mega')
                      ? 'bg-pink-900 text-pink-100 border-pink-500 shadow-md'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}>
                    <input
                      type="checkbox"
                      checked={isMegaSelected || activeBoss.name.toLowerCase().includes('mega')}
                      onChange={(e) => {
                        const nextState = e.target.checked;
                        setIsMegaSelected(nextState);
                        if (nextState) {
                          const megaForm = availableFormsList.find((f) => f.category === 'mega' || f.name.toLowerCase().includes('mega'));
                          if (megaForm) handleSelectBoss(activeBoss.parentPokemon, megaForm.id);
                        } else {
                          handleSelectBoss(activeBoss.parentPokemon);
                        }
                      }}
                      className="accent-pink-500 w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="flex items-center gap-1">
                      💎 <span>{language === 'es' ? 'Versión MEGA' : 'MEGA Form'}</span>
                    </span>
                  </label>
                )}

                {/* Checkbox: Versión SUPERMEGA / PRIMIGENIA */}
                {availableFormsList.some((f) => f.category === 'primal' || f.name.toLowerCase().includes('primal') || f.name.toLowerCase().includes('primigenio')) && (
                  <label className={`flex items-center gap-2 p-2 rounded-xl border font-bold cursor-pointer transition-all ${
                    isSuperMegaSelected || activeBoss.name.toLowerCase().includes('primal') || activeBoss.name.toLowerCase().includes('primigenio')
                      ? 'bg-amber-900 text-amber-100 border-amber-500 shadow-md'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}>
                    <input
                      type="checkbox"
                      checked={isSuperMegaSelected || activeBoss.name.toLowerCase().includes('primal') || activeBoss.name.toLowerCase().includes('primigenio')}
                      onChange={(e) => {
                        const nextState = e.target.checked;
                        setIsSuperMegaSelected(nextState);
                        if (nextState) {
                          const primalForm = availableFormsList.find((f) => f.category === 'primal' || f.name.toLowerCase().includes('primal') || f.name.toLowerCase().includes('primigenio'));
                          if (primalForm) handleSelectBoss(activeBoss.parentPokemon, primalForm.id);
                        } else {
                          handleSelectBoss(activeBoss.parentPokemon);
                        }
                      }}
                      className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="flex items-center gap-1">
                      🌋 <span>{language === 'es' ? 'Versión SUPERMEGA / PRIMIGENIA' : 'SUPERMEGA / PRIMAL'}</span>
                    </span>
                  </label>
                )}

                {/* Checkbox: Versión FUSIÓN / TRANSFORMACIÓN */}
                {availableFormsList.some((f) => f.category === 'fusion' || f.category === 'transformation' || f.name.toLowerCase().includes('negro') || f.name.toLowerCase().includes('blanco') || f.name.toLowerCase().includes('espada') || f.name.toLowerCase().includes('escudo') || f.name.toLowerCase().includes('crepuscular') || f.name.toLowerCase().includes('alba')) && (
                  <label className={`flex items-center gap-2 p-2 rounded-xl border font-bold cursor-pointer transition-all ${
                    isFusionSelected || activeBoss.isSpecialForm
                      ? 'bg-indigo-900 text-indigo-100 border-indigo-500 shadow-md'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}>
                    <input
                      type="checkbox"
                      checked={isFusionSelected || activeBoss.isSpecialForm}
                      onChange={(e) => {
                        const nextState = e.target.checked;
                        setIsFusionSelected(nextState);
                        if (nextState) {
                          const fusionForm = availableFormsList.find((f) => f.category === 'fusion' || f.category === 'transformation');
                          if (fusionForm) handleSelectBoss(activeBoss.parentPokemon, fusionForm.id);
                        } else {
                          handleSelectBoss(activeBoss.parentPokemon);
                        }
                      }}
                      className="accent-indigo-500 w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="flex items-center gap-1">
                      🔮 <span>{language === 'es' ? 'Versión FUSIÓN / TRANSFORMACIÓN' : 'FUSION / TRANSFORMED'}</span>
                    </span>
                  </label>
                )}
              </div>

              {/* Specific Forms Quick Buttons (if multiple forms exist) */}
              {availableFormsList && availableFormsList.length > 1 && (
                <div className="pt-2 border-t border-slate-300/80 flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-500 font-bold self-center mr-1">Variantes:</span>
                  {availableFormsList.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handleSelectBoss(activeBoss.parentPokemon, f.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border transition-all ${
                        activeBoss.id === `${activeBoss.parentPokemon.id}-${f.id}`
                          ? 'bg-purple-700 text-white border-purple-800 shadow-sm'
                          : 'bg-white text-purple-900 border-purple-300 hover:bg-purple-100'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
            </div>


            {/* Selected Boss Summary Display Card with Real Raid CP & Immutable Tier Badge */}
            <div className={`p-5 rounded-3xl border-2 flex flex-col sm:flex-row items-center gap-5 shadow-md transition-all ${
              isShadowRaid
                ? 'bg-slate-900 border-purple-600 text-white shadow-xl'
                : 'bg-white border-slate-300 text-slate-900'
            }`}>
              <div className="sm:self-center shrink-0 text-center relative">
                <img
                  src={activeBoss.spriteUrl}
                  alt={activeBoss.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = activeBoss.parentPokemon.spriteUrl;
                  }}
                  className={`w-24 h-24 object-contain mx-auto transition-all ${
                    isShadowRaid ? 'drop-shadow-[0_0_15px_rgba(168,85,247,0.8)] filter brightness-90 contrast-125' : 'drop-shadow-md'
                  }`}
                />
                <div className="mt-1.5 inline-flex items-center gap-1 bg-amber-400 text-slate-950 font-black text-sm px-3.5 py-1 rounded-full shadow-sm">
                  <span className="text-xs">PC RAID:</span>
                  <span className="text-base font-black tracking-tight">{raidCp.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2.5 text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h4 className={`text-2xl font-black ${isShadowRaid ? 'text-purple-200' : 'text-slate-900'}`}>
                    {isShadowRaid ? `💀 ${activeBoss.name} (Oscuro)` : activeBoss.name}
                  </h4>

                  {/* Immutable Raid Tier Badge */}
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-sm ${
                    raidTier === 'primal'
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : raidTier === 'mega'
                      ? 'bg-pink-600 text-white font-extrabold'
                      : raidTier === '5'
                      ? 'bg-purple-600 text-white font-extrabold'
                      : raidTier === '3'
                      ? 'bg-blue-600 text-white font-extrabold'
                      : 'bg-emerald-600 text-white font-extrabold'
                  }`}>
                    {raidTier === 'primal' && '🌋 PRIMIGENIA / TIER 6 (22,500 HP)'}
                    {raidTier === 'mega' && '💎 MEGA RAID (9,000 HP)'}
                    {raidTier === '5' && '🌟 TIER 5 LEGENDARIA (15,000 HP)'}
                    {raidTier === '3' && '⚔️ TIER 3 (3,600 HP)'}
                    {raidTier === '1' && '⚡ TIER 1 (1,500 HP)'}
                  </span>

                  {isShadowRaid && (
                    <span className="text-[10px] font-black uppercase bg-purple-700 text-purple-100 px-2.5 py-1 rounded-full shadow-sm">
                      💀 INCURSIÓN OSCURA (+20% Daño Recibido/Causado)
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                  {activeBoss.types.map((tItem) => (
                    <span
                      key={tItem}
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md ${TYPE_COLORS[tItem]}`}
                    >
                      {getTypeLabel(tItem, language)}
                    </span>
                  ))}
                </div>

                <div className="text-xs text-slate-800 font-extrabold bg-slate-100 p-2.5 rounded-2xl border border-slate-200 flex flex-wrap gap-x-4 gap-y-1 justify-center sm:justify-start">
                  <span>
                    ⚔️ Atq Base: <strong className="text-red-600 font-black">{activeBoss.baseAttack}</strong>
                  </span>
                  <span>
                    🛡️ Def Base: <strong className="text-blue-600 font-black">{activeBoss.baseDefense}</strong>
                  </span>
                  <span>
                    ❤️ HP de Raid: <strong className="text-emerald-600 font-black">{raidHp.toLocaleString()} HP</strong>
                  </span>
                </div>

                {/* Weaknesses List */}
                <TypeWeaknessBadgeList types={activeBoss.types} />
              </div>
            </div>
          </div>

          {/* Section 2: Generator Parameters & Quick Actions */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-md flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-red-600" />
                  Ajustes y Objetivo
                </h3>
              </div>

              {/* Goal Selector: Max DPS vs Max Candy & XL */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                  🎯 Objetivo de la Incursión:
                </label>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <button
                    onClick={() => setRaidGoal('dps')}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border ${
                      raidGoal === 'dps'
                        ? 'bg-red-600 text-white border-red-700 shadow-md'
                        : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <Swords className="w-4 h-4" />
                    <span>⚔️ Max DPS</span>
                  </button>

                  <button
                    onClick={() => setRaidGoal('candies')}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border ${
                      raidGoal === 'candies'
                        ? 'bg-pink-600 text-white border-pink-700 shadow-md'
                        : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>🍬 Caramelos & XL</span>
                  </button>
                </div>
              </div>

              {/* Attacker Level Setting */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span>{t.attackerLevelLabel}</span>
                  <span className="font-extrabold text-red-600">Nvl. {attackerLevel}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="50"
                  step="5"
                  value={attackerLevel}
                  onChange={(e) => setAttackerLevel(Number(e.target.value))}
                  className="w-full accent-red-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                  <span>Nvl. 20</span>
                  <span>Nvl. 30</span>
                  <span>Nvl. 40</span>
                  <span>Nvl. 50</span>
                </div>
              </div>

              {/* Checkbox: Use Personal Box */}
              <label className={`flex items-center gap-2.5 p-3 rounded-2xl text-white text-xs font-extrabold cursor-pointer shadow-sm transition-colors ${usePersonalBox ? 'bg-purple-600' : 'bg-slate-400'}`}>
                <input
                  type="checkbox"
                  checked={usePersonalBox}
                  onChange={(e) => setUsePersonalBox(e.target.checked)}
                  className="accent-purple-900 w-4 h-4 rounded"
                />
                <span>Usar Mi Caja Pokémon ({inventory.length} guardados)</span>
              </label>

              {/* Checkbox: Special Forms / Megas */}
              <label className={`flex items-center gap-2.5 p-3 rounded-2xl text-white text-xs font-extrabold cursor-pointer shadow-sm transition-colors ${!usePersonalBox && includeSpecialForms ? 'bg-purple-600' : 'bg-slate-400'} ${usePersonalBox ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  disabled={usePersonalBox}
                  checked={includeSpecialForms && !usePersonalBox}
                  onChange={(e) => setIncludeSpecialForms(e.target.checked)}
                  className="accent-purple-900 w-4 h-4 rounded"
                />
                <span>{t.includeMegas}</span>
              </label>
            </div>

            {/* Copy Search String Button for PoGo App */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <button
                onClick={handleCopySearchString}
                className="w-full py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                {copiedSearch ? (
                  <>
                    <Check className="w-4 h-4 text-yellow-300" />
                    <span className="text-yellow-300">{t.copiedSearchString}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>{t.copySearchString}</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-400 text-center font-medium">
                Pega este texto en el buscador de la app de PoGo para seleccionar a tus 6 atacantes al instante.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Recommended Top 6 Team Output */}
        <div className="space-y-4">
          {/* Best Candy & XL Farming Mega Card */}
          {bestCandyMega && (
            <div className="bg-gradient-to-r from-pink-950 via-purple-900 to-slate-900 text-white rounded-3xl p-5 shadow-xl border-2 border-pink-500/50 space-y-3 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 bg-pink-600 rounded-2xl text-white shadow-md">
                    <Sparkles className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                  </span>
                  <div>
                    <h4 className="text-base font-black text-yellow-300 flex items-center gap-2">
                      🍬 Mega Recomendada para Caramelos & Caramelos XL
                    </h4>
                    <p className="text-xs text-pink-200 font-medium">
                      Optimiza el bono de captura en tu caja contra <strong>{activeBoss.name}</strong>
                    </p>
                  </div>
                </div>

                <span className="self-start sm:self-auto text-xs font-black uppercase bg-pink-500 text-white px-3 py-1 rounded-full shadow-sm">
                  {bestCandyMega.megaLevel === 4
                    ? '🌟 Nivel Mega 4 (Supremo)'
                    : bestCandyMega.megaLevel === 3
                    ? '💎 Nivel Mega 3 (Máximo)'
                    : bestCandyMega.megaLevel === 2
                    ? '⭐ Nivel Mega 2 (Alto)'
                    : '🌱 Nivel Mega 1 (Base)'}
                </span>
              </div>

              <div className="flex items-center gap-4 bg-white/10 p-3 rounded-2xl border border-white/10">
                <img src={bestCandyMega.spriteUrl} alt={bestCandyMega.megaFormName} className="w-14 h-14 object-contain shrink-0 drop-shadow-md" />
                <div className="space-y-1">
                  <div className="font-extrabold text-sm text-white">
                    {bestCandyMega.userPoke.name} ➔ <span className="text-yellow-300">{bestCandyMega.megaFormName}</span>
                  </div>
                  <p className="text-xs text-emerald-300 font-bold">
                    {bestCandyMega.megaLevel === 4
                      ? '🎁 Bono Supremo: +3 Caramelos extra, +35% probabilidad de Caramelo XL y +300 PX por captura.'
                      : bestCandyMega.megaLevel === 3
                      ? '🎁 Bono Máximo: +2 Caramelos extra, +25% probabilidad de Caramelo XL y +200 PX por captura.'
                      : bestCandyMega.megaLevel === 2
                      ? '🎁 Bono Alto: +1 Caramelo extra, +10% probabilidad de Caramelo XL y +100 PX por captura.'
                      : '🎁 Bono Base: +1 Caramelo extra y +50 PX por captura.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-200 pb-3">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Award className="w-6 h-6 text-red-600" />
                {t.recommendedTeamTitle}
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                {t.recommendedTeamSub} contra <strong>{activeBoss.name}</strong>
              </p>
            </div>

            <span className="self-start sm:self-auto text-xs font-black uppercase bg-red-600 text-white px-3 py-1 rounded-full shadow-sm">
              {t.topCountersTag}
            </span>
          </div>

          {/* Grid of Top 6 Counters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {topTeam.map((cand, idx) => (
              <div
                key={cand.id}
                className="relative bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-md flex flex-col justify-between overflow-hidden hover:border-red-500 transition-all duration-300 space-y-4"
              >
                {/* Rank Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                      #{idx + 1}
                    </span>
                    {cand.isSpecialForm && (
                      <span className="text-[9px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-extrabold uppercase">
                        FORMA ESPECIAL
                      </span>
                    )}
                  </div>

                  {/* DPS Metric Tag */}
                  <span className="text-xs font-black text-white bg-emerald-600 px-3 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                    <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                    {cand.dps} DPS
                  </span>
                </div>

                {/* Pokemon Sprite & Info */}
                <div className="flex items-center gap-3">
                  <img
                    src={cand.spriteUrl}
                    alt={cand.name}
                    className="w-16 h-16 object-contain shrink-0 drop-shadow-sm"
                  />
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900 leading-tight">
                      {cand.name}
                    </h4>
                    <div className="flex items-center gap-1 flex-wrap mt-1">
                      {cand.types.map((tItem) => (
                        <span
                          key={tItem}
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.2 rounded ${TYPE_COLORS[tItem]}`}
                        >
                          {getTypeLabel(tItem, language)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Moveset Details with Exact Damage Effects */}
                <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    {t.optimalMoveset}:
                  </span>

                  {/* Fast Move with Damage Effect */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="font-extrabold text-slate-900 text-xs">
                          {getTranslatedMoveName(cand.fastMove.name, language)}
                        </span>
                      </div>
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.2 rounded ${TYPE_COLORS[cand.fastMove.type]}`}>
                        {getTypeLabel(cand.fastMove.type, language)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 pt-1 border-t border-slate-100">
                      <span className="text-blue-700 font-extrabold flex items-center gap-1">
                        💥 Daño: <strong className="text-blue-900 font-black">-{cand.fastDamageHp} HP</strong> / golp.
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                        cand.fastTypeMult >= 2.5
                          ? 'bg-red-600 text-white'
                          : cand.fastTypeMult >= 1.5
                          ? 'bg-amber-400 text-slate-950'
                          : cand.fastTypeMult <= 0.65
                          ? 'bg-slate-800 text-white'
                          : 'bg-blue-600 text-white'
                      }`}>
                        {cand.fastTypeMult >= 2.5 ? '2.56x Doble' : cand.fastTypeMult >= 1.5 ? '1.6x Súper' : cand.fastTypeMult <= 0.65 ? `${cand.fastTypeMult}x Resis.` : '1.0x Neutral'}
                      </span>
                    </div>
                  </div>

                  {/* Charged Move with Damage Effect */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Swords className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span className="font-extrabold text-slate-900 text-xs">
                          {getTranslatedMoveName(cand.chargedMove.name, language)}
                        </span>
                      </div>
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.2 rounded ${TYPE_COLORS[cand.chargedMove.type]}`}>
                        {getTypeLabel(cand.chargedMove.type, language)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 pt-1 border-t border-slate-100">
                      <span className="text-purple-800 font-extrabold flex items-center gap-1">
                        🔥 Daño: <strong className="text-purple-950 font-black">-{cand.chargedDamageHp} HP</strong> / imp.
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                        cand.chargedTypeMult >= 2.5
                          ? 'bg-red-600 text-white'
                          : cand.chargedTypeMult >= 1.5
                          ? 'bg-amber-400 text-slate-950'
                          : cand.chargedTypeMult <= 0.65
                          ? 'bg-slate-800 text-white'
                          : 'bg-blue-600 text-white'
                      }`}>
                        {cand.chargedTypeMult >= 2.5 ? '2.56x Doble' : cand.chargedTypeMult >= 1.5 ? '1.6x Súper' : cand.chargedTypeMult <= 0.65 ? `${cand.chargedTypeMult}x Resis.` : '1.0x Neutral'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>


      {/* Pokédex Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs font-extrabold text-slate-500">
        PokéTools Raid Team Generator • Fórmula Oficial PoGo DPS
      </footer>
    </div>
  );
};
