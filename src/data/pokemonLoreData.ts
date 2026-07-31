import officialLoreData from './officialPokedexLoreEs.json';

export interface PokemonLore {
  story: string;
  biology: string;
  trivia: string[];
  funFact: string;
  genus?: string;
}

const OFFICIAL_LORE_MAP = officialLoreData as Record<string, any>;

export function getPokemonLore(pokemonName: string, types: string[], speciesId?: string | number): PokemonLore {
  const rawName = (pokemonName || '').toLowerCase();
  
  // Clean special characters, numbers, and bracket expressions like "(fusionado)", "(crowned)", "form", etc.
  const cleanName = rawName
    .replace(/\(.*\)/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();

  // 1. Try numeric species ID lookup first if available
  if (speciesId && OFFICIAL_LORE_MAP[String(speciesId)]) {
    const entry = OFFICIAL_LORE_MAP[String(speciesId)];
    return formatLoreEntry(entry, pokemonName, types);
  }

  // 2. Try exact clean name match in JSON
  if (OFFICIAL_LORE_MAP[cleanName]) {
    const entry = OFFICIAL_LORE_MAP[cleanName];
    return formatLoreEntry(entry, pokemonName, types);
  }

  // 3. Try partial key search in OFFICIAL_LORE_MAP
  for (const [key, entry] of Object.entries(OFFICIAL_LORE_MAP)) {
    if (typeof entry === 'object' && entry !== null && entry.name) {
      const entryName = entry.name.toLowerCase();
      const entrySpanish = (entry.spanishName || '').toLowerCase();
      if (
        cleanName.includes(entryName) ||
        entryName.includes(cleanName) ||
        cleanName.includes(entrySpanish) ||
        entrySpanish.includes(cleanName)
      ) {
        return formatLoreEntry(entry, pokemonName, types);
      }
    }
  }

  // 4. Ultimate Fallback (if species is beyond #1025 or custom form)
  const typesFormatted = types.map((t) => t.toUpperCase()).join(' y ');
  const displayName = pokemonName.replace(/\(.*\)/g, '').trim();

  return {
    story: `${displayName} es una especie emblemática registrada oficialmente en la Pokédex de tipo ${typesFormatted}. En la historia de la saga Pokémon, destaca por su biología elemental y su papel estratégico en los combates de entrenador.`,
    biology: `Como especie de tipo ${typesFormatted}, canaliza la energía de su entorno para desenvolverse en su hábitat natural y ejecutar poderosas técnicas durante los combates de Liga.`,
    trivia: [
      `Registrado oficialmente en la Pokédex de la franquicia Pokémon.`,
      `Aprende potentes ataques de tipo ${typesFormatted} por nivel y MT.`,
      `Es valorado por entrenadores por su versatilidad táctica.`
    ],
    funFact: `¡En las enciclopedias Pokédex, los entrenadores destacan a ${displayName} por su gran potencial de tipo ${typesFormatted}!`
  };
}

function formatLoreEntry(entry: any, pokemonName: string, types: string[]): PokemonLore {
  const displayName = entry.spanishName || pokemonName.replace(/\(.*\)/g, '').trim();
  const genusText = entry.genus ? ` (${entry.genus})` : '';

  return {
    genus: entry.genus || '',
    story: entry.story
      ? `${displayName}${genusText}: ${entry.story}`
      : `${displayName} es un Pokémon emblemático registrado en la Pokédex oficial.`,
    biology: entry.biology || entry.story || `${displayName} destaca por su biología y adaptabilidad en combate.`,
    trivia: Array.isArray(entry.trivia) && entry.trivia.length > 0
      ? entry.trivia
      : [
          entry.genus ? `Categorizado en la Pokédex oficial como el ${entry.genus}.` : `Documentado oficialmente en la Pokédex.`,
          `Forma parte del registro oficial de la franquicia Pokémon.`,
          `Destaca por sus atributos de combate y biología elemental.`
        ],
    funFact: entry.funFact || `¡${displayName} es muy admirado por los entrenadores por su versatilidad en combate!`
  };
}
