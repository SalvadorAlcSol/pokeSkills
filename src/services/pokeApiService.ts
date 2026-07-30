import { PokemonType } from '../data/pokemonData';
import { PogoPokemon, PogoMove } from '../data/pogoDatabase';

const pokeApiCache: Record<string, PogoPokemon> = {};

/**
 * Converts Mainline Stats to PoGo Base Stats formula
 */
function convertToPogoStats(hp: number, atk: number, def: number, spAtk: number, spDef: number, speed: number) {
  const higherAtk = Math.max(atk, spAtk);
  const lowerAtk = Math.min(atk, spAtk);
  const higherDef = Math.max(def, spDef);
  const lowerDef = Math.min(def, spDef);

  const speedMod = 1 + (speed - 75) / 500;

  const baseAttack = Math.round(2 * (7 / 8 * higherAtk + 1 / 8 * lowerAtk) * speedMod);
  const baseDefense = Math.round(2 * (5 / 8 * higherDef + 3 / 8 * lowerDef) * speedMod);
  const baseStamina = Math.floor(1.75 * hp + 50);

  return { baseAttack, baseDefense, baseStamina };
}

/**
 * Fetches any Pokemon from PokéAPI dynamically if not in local dataset
 */
export async function fetchPokemonFromPokeApi(nameOrId: string): Promise<PogoPokemon | null> {
  const query = nameOrId.trim().toLowerCase();
  if (!query) return null;

  if (pokeApiCache[query]) {
    return pokeApiCache[query];
  }

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
    if (!res.ok) return null;

    const data = await res.json();

    const types: PokemonType[] = data.types.map((t: any) => t.type.name as PokemonType);

    const statMap: Record<string, number> = {};
    data.stats.forEach((s: any) => {
      statMap[s.stat.name] = s.base_stat;
    });

    const { baseAttack, baseDefense, baseStamina } = convertToPogoStats(
      statMap['hp'] || 80,
      statMap['attack'] || 80,
      statMap['defense'] || 80,
      statMap['special-attack'] || 80,
      statMap['special-defense'] || 80,
      statMap['speed'] || 80
    );

    const spriteUrl =
      data.sprites?.other?.['official-artwork']?.front_default ||
      data.sprites?.front_default ||
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png`;

    // Extract some fast and charged moves
    const fastMoves: PogoMove[] = [];
    const chargedMoves: PogoMove[] = [];

    // Fallback default moves based on types
    const primaryType = types[0] || 'normal';
    fastMoves.push({
      id: `fast_${primaryType}`,
      name: `Ataque Rápido (${primaryType.toUpperCase()})`,
      type: primaryType,
      power: 10,
      energy: 8,
      typeCategory: 'fast',
    });

    chargedMoves.push({
      id: `charged_${primaryType}`,
      name: `Ataque Cargado 1 (${primaryType.toUpperCase()})`,
      type: primaryType,
      power: 90,
      energy: 50,
      typeCategory: 'charged',
    });

    if (types.length > 1) {
      const secType = types[1];
      chargedMoves.push({
        id: `charged_${secType}`,
        name: `Ataque Cargado 2 (${secType.toUpperCase()})`,
        type: secType,
        power: 100,
        energy: 55,
        typeCategory: 'charged',
      });
    }

    const pokemon: PogoPokemon = {
      id: data.id,
      name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
      types,
      baseAttack,
      baseDefense,
      baseStamina,
      spriteUrl,
      fastMoves,
      chargedMoves,
    };

    pokeApiCache[query] = pokemon;
    pokeApiCache[data.id.toString()] = pokemon;

    return pokemon;
  } catch {
    return null;
  }
}
