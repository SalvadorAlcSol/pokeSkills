import { PokemonType } from '../data/pokemonData';
import { POGO_DATABASE } from '../data/pogoDatabase';
import { getPokemonWeaknessesAndResistances } from './pokemonMath';

export type PvpLeague = 'great' | 'ultra' | 'master';

export interface PvpTeammate {
  name: string;
  types: PokemonType[];
  spriteUrl: string;
  recommendedFastMove: string;
  recommendedChargedMoves: string[];
  reason: string;
}

export interface PvpAnalysis {
  tier: 'S-Tier (Meta Dominante)' | 'A-Tier (Muy Fuerte)' | 'B-Tier (Viable / Sorpresa)';
  role: 'Abridor / Lead' | 'Cambio Seguro / Safe Swap' | 'Rematador / Closer' | 'Versátil / Flex';
  optimalFastMove: string;
  optimalChargedMoves: string[];
  recommendedTeammates: PvpTeammate[];
  pvpOverview: string;
}

// Meta staples for each league with optimal movesets
const PVP_META_POOL: Record<PvpLeague, Array<{ name: string; fast: string; charged: string[]; role: string }>> = {
  great: [
    { name: 'Swampert', fast: 'Disparo Lodo', charged: ['Hidrocañón', 'Terremoto'], role: 'Abridor / Safe Swap' },
    { name: 'Skarmory', fast: 'Tajo Aéreo', charged: ['Ataque Aéreo', 'Foco Resplandor'], role: 'Abridor' },
    { name: 'Registeel', fast: 'Fijar Blanco', charged: ['Foco Resplandor', 'Onda Certera'], role: 'Rematador' },
    { name: 'Altaria', fast: 'Dragoaliento', charged: ['Ataque Aéreo', 'Fuerza Lunar'], role: 'Abridor / Safe Swap' },
    { name: 'Bastiodon', fast: 'Anti-Aéreo', charged: ['Roca Afilada', 'Lanzallamas'], role: 'Rematador' },
    { name: 'Azumarill', fast: 'Burbuja', charged: ['Carantoña', 'Rayos Hielo'], role: 'Safe Swap' },
    { name: 'Trevenant', fast: 'Garra Umbría', charged: ['Bomba Germen', 'Bola Sombra'], role: 'Abridor' },
    { name: 'Gunfisk (Galarian Stunfisk)', fast: 'Disparo Lodo', charged: ['Avalancha', 'Terremoto'], role: 'Safe Swap' },
    { name: 'Lickitung', fast: 'Lengüetazo', charged: ['Golpe Cuerpo', 'Látigo Cepa'], role: 'Safe Swap' },
    { name: 'Medicham', fast: 'Contraataque', charged: ['Puño Hielo', 'Psíquico'], role: 'Abridor' }
  ],
  ultra: [
    { name: 'Giratina (Altered)', fast: 'Garra Umbría', charged: ['Garra Dragón', 'Poder Pasado'], role: 'Safe Swap' },
    { name: 'Swampert', fast: 'Disparo Lodo', charged: ['Hidrocañón', 'Onda Certera'], role: 'Abridor' },
    { name: 'Cresselia', fast: 'Confusión', charged: ['Fuerza Lunar', 'Hierba Lazo'], role: 'Safe Swap' },
    { name: 'Talonflame', fast: 'Incineración', charged: ['Vuelo', 'Nitrocarga'], role: 'Abridor' },
    { name: 'Cobalion', fast: 'Doble Patada', charged: ['Espada Santa', 'Roca Afilada'], role: 'Abridor' },
    { name: 'Virizion', fast: 'Doble Patada', charged: ['Espada Santa', 'Hoja Aguda'], role: 'Safe Swap' },
    { name: 'Walrein', fast: 'Nieve Polvo', charged: ['Carámbano', 'Terremoto'], role: 'Abridor' },
    { name: 'Charizard', fast: 'Dragoaliento', charged: ['Anillo de Fuego', 'Garra Dragón'], role: 'Abridor' },
    { name: 'Registeel', fast: 'Fijar Blanco', charged: ['Foco Resplandor', 'Onda Certera'], role: 'Rematador' }
  ],
  master: [
    { name: 'Dialga', fast: 'Dragoaliento', charged: ['Cabeza de Hierro', 'Cometa Draco'], role: 'Abridor / Lead' },
    { name: 'Mewtwo', fast: 'Psicocorte', charged: ['Onda Mental', 'Bola Sombra'], role: 'Safe Swap / Rematador' },
    { name: 'Dragonite', fast: 'Dragoaliento', charged: ['Garra Dragón', 'Fuerza Bruta'], role: 'Abridor' },
    { name: 'Groudon', fast: 'Disparo Lodo', charged: ['Filo del Abismo', 'Puño Fuego'], role: 'Rematador' },
    { name: 'Kyogre', fast: 'Cascada', charged: ['Origen Primigenio', 'Surf'], role: 'Abridor' },
    { name: 'Metagross', fast: 'Puño Bala', charged: ['Puño Meteoro', 'Terremoto'], role: 'Rematador' },
    { name: 'Giratina (Origin)', fast: 'Garra Umbría', charged: ['Viento Aciago', 'Bola Sombra'], role: 'Safe Swap' },
    { name: 'Zacian', fast: 'Alarido', charged: ['Abocajarro', 'Carantoña'], role: 'Safe Swap' },
    { name: 'Rayquaza', fast: 'Dragoaliento', charged: ['Ascenso Draco', 'Triturar'], role: 'Abridor' },
    { name: 'Landorus (Therian)', fast: 'Disparo Lodo', charged: ['Tormenta de Arena', 'Fuerza Bruta'], role: 'Abridor' }
  ]
};

export function getPvpAnalysis(pokemonName: string, rawTypes: PokemonType[] = [], league: PvpLeague): PvpAnalysis {
  const types: PokemonType[] = rawTypes && Array.isArray(rawTypes) && rawTypes.length > 0 ? rawTypes : ['normal'];
  const { weaknesses } = getPokemonWeaknessesAndResistances(types);
  const weakTypeNames = weaknesses.map((w) => w.type);

  // Find optimal moves from pogoDatabase
  const normalizedSearch = (pokemonName || '').toLowerCase().split(' ')[0];
  const dbMatch = POGO_DATABASE.find((p) => p.name.toLowerCase().includes(normalizedSearch));

  let optimalFast = dbMatch?.fastMoves?.[0]?.name || 'Ataque Rápido Recomendado';
  let optimalCharged: string[] = dbMatch?.chargedMoves?.slice(0, 2).map((m) => m.name) || ['Ataque Cargado 1', 'Ataque Cargado 2'];

  if (dbMatch) {
    const sortedFast = [...dbMatch.fastMoves].sort((a, b) => b.energy - a.energy || b.power - a.power);
    if (sortedFast.length > 0) optimalFast = sortedFast[0].name;

    const sortedCharged = [...dbMatch.chargedMoves].sort((a, b) => a.energy - b.energy || b.power - a.power);
    if (sortedCharged.length > 0) {
      optimalCharged = sortedCharged.slice(0, 2).map((m) => m.name);
    }
  }

  // Determine Tier and Role based on stats & types
  let tier: PvpAnalysis['tier'] = 'B-Tier (Viable / Sorpresa)';
  let role: PvpAnalysis['role'] = 'Versátil / Flex';

  if (['Swampert', 'Dragonite', 'Dialga', 'Mewtwo', 'Giratina', 'Metagross', 'Groudon', 'Kyogre', 'Skarmory', 'Azumarill', 'Lucario', 'Rayquaza', 'Registeel'].some(m => pokemonName.includes(m))) {
    tier = 'S-Tier (Meta Dominante)';
  } else if (types.includes('dragon') || types.includes('steel') || types.includes('ghost') || types.includes('fairy') || types.includes('fighting')) {
    tier = 'A-Tier (Muy Fuerte)';
  }

  if (types.includes('steel') || types.includes('normal') || types.includes('dragon')) {
    role = 'Cambio Seguro / Safe Swap';
  } else if (types.includes('fighting') || types.includes('electric') || types.includes('fire') || types.includes('ice')) {
    role = 'Abridor / Lead';
  } else {
    role = 'Rematador / Closer';
  }

  // Find 2 best meta teammates that resist weaknesses of this Pokemon
  const pool = PVP_META_POOL[league];
  const teammates: PvpTeammate[] = [];

  for (const metaItem of pool) {
    if (teammates.length >= 2) break;
    if (metaItem.name.toLowerCase().includes(normalizedSearch)) continue;

    const metaDb = POGO_DATABASE.find((p) => p.name.toLowerCase().includes(metaItem.name.toLowerCase().split(' ')[0]));
    const metaTypes = metaDb?.types || ['normal'];

    const metaWeakRes = getPokemonWeaknessesAndResistances(metaTypes);
    const coversWeakness = weakTypeNames.some((wt) => metaWeakRes.resistances.some((r) => r.type === wt && r.multiplier < 1));

    if (coversWeakness || teammates.length < 2) {
      teammates.push({
        name: metaItem.name,
        types: metaTypes,
        spriteUrl: metaDb?.spriteUrl || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
        recommendedFastMove: metaItem.fast,
        recommendedChargedMoves: metaItem.charged,
        reason: `Resiste los ataques de tipo ${weakTypeNames.slice(0, 2).join(' / ')} que amenazan a ${pokemonName} y aporta excelente presión de escudos en Liga ${league.toUpperCase()}.`
      });
    }
  }

  const leagueNames = {
    great: 'Liga Súper (CP 1500)',
    ultra: 'Liga Ultra (CP 2500)',
    master: 'Liga Master (Sin Límite)'
  };

  return {
    tier,
    role,
    optimalFastMove: optimalFast,
    optimalChargedMoves: optimalCharged,
    recommendedTeammates: teammates,
    pvpOverview: `${pokemonName} se desempeña como un destacado ${role} en ${leagueNames[league]}. Su rendimiento destaca al combinarse con compañeros que absorban sus debilidades defensivas.`
  };
}
