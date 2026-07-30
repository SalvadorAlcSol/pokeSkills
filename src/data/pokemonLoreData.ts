export interface PokemonLore {
  story: string;
  biology: string;
  trivia: string[];
  funFact: string;
}

export const POKEMON_LORE_DATABASE: Record<string, PokemonLore> = {
  zacian: {
    story: 'Zacian es el legendario Pokémon de la región de Galar conocido en los mitos antiguos como el "Héroe de la Espada". En la era remota, unió fuerzas con Zamazenta y los reyes humanos de Galar para detener la catástrofe de la "Noche Negra" provocada por el inconmensurable Eternatus.',
    biology: 'En su forma base (Guerrero Avezado) vaga como un lobo solitario portando cicatrices de batallas milenarias. Al sostener la Espada Oxidada en su hocico, absorbe la energía del planeta y se transforma en su Forma Espada Suprema, imbuido de un áura dorada resplandeciente.',
    trivia: [
      'Su ataque característico es Tajo Supremo (Behemoth Blade), una estocada legendaria capaz de hendir océanos y cortar el acero como papel.',
      'En el anime "Pokémon Viajes", Zacian se manifiesta como una entidad guardiana ante Ash Ketchum en el Bosque Corona antes de unirse a la batalla final contra Eternatus Dinamax.',
      'Al transformarse en Espada Suprema, su tipo cambia de Hada puro a Hada/Acero, otorgándole una cobertura defensiva casi impenetrable.'
    ],
    funFact: '¡Su espada es tan afilada que puede cortar montañas enteras con una sola estocada veloz!'
  },
  zaciancrowned: {
    story: 'Zacian Espada Suprema es la verdadera forma manifestada del héroe legendario de Galar cuando empuña la Espada Oxidada. Su espada dorada resplandece con una energía capaz de desintegrar la mismísima distorsión espacial de Eternatus.',
    biology: 'Mantiene la Espada Oxidada aferrada firmemente con sus mandíbulas. Se desplaza a velocidades supersónicas que superan la vista humana, pareciendo un rayo dorado en el campo de batalla.',
    trivia: [
      'Posee el ataque insignia Tajo Supremo (Behemoth Blade), de tipo Acero con una potencia devastadora de 160.',
      'En los videojuegos principales (Pokémon Espada y Escudo), Tajo Supremo causa el doble de daño a Pokémon en estado Dinamax o Gigamax.',
      'Forma junto a Zamazenta Escudo Supremo la dupla de guardianes legendarios de la región de Galar.'
    ],
    funFact: '¡Se dice que su espada jamás ha sufrido una sola mella en más de tres mil años de historia!'
  },
  zamazenta: {
    story: 'Zamazenta es el legendario "Héroe del Escudo" de Galar. Junto a Zacian, protegió los reinos de la antigüedad del colapso energético de la Noche Negra, sirviendo como el baluarte inquebrantable de la humanidad.',
    biology: 'Al equipar el Escudo Oxidado, su pelaje frontal se convierte en un escudo de aleación dorada impenetrable capaz de repeler cualquier ataque o rayo de energía elemental.',
    trivia: [
      'Su ataque distintivo es Embate Supremo (Behemoth Bash), de tipo Acero.',
      'Al adoptar la Forma Escudo Supremo, su tipo evoluciona de Lucha puro a Lucha/Acero.',
      'En la serie animada de Pokémon, protege la región de Galar junto a Goh en el Climax de la crisis de Puntera.'
    ],
    funFact: '¡Su escudo frontal puede soportar la explosión simultánea de mil bombas sin moverse un solo milímetro!'
  },
  swampert: {
    story: 'Swampert es la evolución final de Mudkip, el inicial de Agua de Hoenn. Es famoso en la franquicia por su inmensa fuerza física y por acompañar a entrenadores en aventuras marítimas y montañosas.',
    biology: 'Posee aletas sensoriales hiperdesarrolladas capaces de detectar maremotos o cambios de clima. Sus brazos tienen una densidad ósea comparable al titanio.',
    trivia: [
      'En los videojuegos principales, posee la suma de estadísticas base más alta de todos los Pokémon iniciales de Agua.',
      'Su tipo dual Agua/Tierra solo le otorga una única debilidad elemental en toda la tabla de tipos: el tipo Planta.',
      'En el anime, fue el Pokémon insignia del líder de gimnasio Brock durante sus viajes por Hoenn.'
    ],
    funFact: '¡Puede nadar tan rápido como una lancha de carreras y mover rocas de varias toneladas con un solo brazo!'
  },
  charizard: {
    story: 'Charizard es el icónico Pokémon Llama de Kanto. Famoso por ser el compañero rebelde y heroico de Ash Ketchum en el anime original, es una de las criaturas más queridas en la historia del entretenimiento.',
    biology: 'Vuela alto por los cielos buscando rivales a su altura. La intensidad de la llama de su cola aumenta exponencialmente a medida que su espíritu de lucha se enciende.',
    trivia: [
      'Es uno de los pocos Pokémon con dos Megaevoluciones distintas: Mega Charizard X (Fuego/Dragón) y Mega Charizard Y (Fuego/Volador).',
      'En el anime original, derrotó al legendario Articuno de Noland en la Fábrica de la Batalla.',
      'Fue el Pokémon estrella del Campeón de Kanto y Galar, Lionel (Leon).'
    ],
    funFact: '¡Su aliento de fuego alcanza temperaturas capaces de derretir glaciares y rocas sólidas en segundos!'
  },
  rayquaza: {
    story: 'Rayquaza es el señor de los cielos y guardián de la capa de ozono del planeta. Es el líder supremo del trío creador de Hoenn junto a Groudon y Kyogre.',
    biology: 'Habita a miles de metros de altura en la estratosfera. Desciende únicamente a la superficie cuando los titanes Groudon y Kyogre despiertan para sofocar su furioso combate.',
    trivia: [
      'Fue el primer Pokémon en la historia en poder Megaevolucionar mediante un movimiento aprendido (Ascenso Draco) en lugar de una Megapiedra.',
      'En la película animada "El Destino de Deoxys", protagonizó una batalla épica en los límites del espacio exterior.',
      'Su variante variocolor (Shiny) de color negro azabache es una de las más cotizadas por los coleccionistas.'
    ],
    funFact: '¡Jamás toca el suelo! Pasa siglos enteros flotando plácidamente en la estratosfera comiendo meteoritos.'
  },
  mewtwo: {
    story: 'Mewtwo es la creación científica definitiva de Isla Cayo. Fue clonado genéticamente a partir del ADN de Mew con el objetivo de crear el luchador indestructible.',
    biology: 'Posee habilidades psíquicas capaces de manipular la gravedad, crear tormentas globales con el pensamiento y comunicarse por telepatía con los seres humanos.',
    trivia: [
      'Protagonizó la primera película de cine de Pokémon "Mewtwo vs. Mew" (1998), dejando un mensaje filosófico inolvidable sobre el valor de la vida.',
      'Cuenta con dos formas Megaevolucionadas: Mega Mewtwo X (Psíquico/Lucha) y Mega Mewtwo Y (Psíquico puro).',
      'En los videojuegos de la primera generación (Rojo/Azul/Amarillo), habitaba en el fondo de la Cueva Celeste de Ciudad Verde.'
    ],
    funFact: 'Descansa en trance meditativo dentro de cavernas profundas para contener su abrumadora energía psíquica.'
  },
  lucario: {
    story: 'Lucario es el Pokémon Aura de Sinnoh. Posee una sintonía espiritual profunda que le permite canalizar el aura vital de los seres vivos en poderosos ataques defensivos y ofensivos.',
    biology: 'Puede leer los sentimientos, pensamientos y movimientos de amigos y enemigos a kilómetros de distancia mediante sus apéndices sensores de aura.',
    trivia: [
      'Fue el protagonista de la película "Lucario y el Misterio de Mew", donde sacrificó su vida para salvar el Árbol del Comienzo.',
      'Su ataque característico "Esfera Aural" es una concentración de energía espiritual que jamás falla su objetivo.',
      'Es el Pokémon compañero del Campeón Ash Ketchum en su equipo ganador del Campeonato Mundial de Entrenadores.'
    ],
    funFact: '¡Puede detectar la presencia y emociones de una persona a más de un kilómetro de distancia aunque esté oculta!'
  },
  gengar: {
    story: 'Gengar es el legendario Pokémon Sombra de Kanto. Se oculta en los rincones oscuros de la noche para asustar a los caminantes y gastar bromas pesadas.',
    biology: 'Cuando se oculta en la sombra de alguien, roba el calor del ambiente provocando una caída drástica de más de 10°C de temperatura instantánea.',
    trivia: [
      'Una famosa teoría de fans de la franquicia sostiene que Gengar es la sombra cobra vida del Pokémon Clefable.',
      'Posee una forma Gigamax en Galar donde su boca se transforma en un portal directo al inframundo.',
      'Fue un miembro destacado del equipo campeón de Ash Ketchum en Pokémon Viajes.'
    ],
    funFact: '¡Si sientes un escalofrío helado repentino en la espalda, hay un Gengar riéndose justo detrás de ti!'
  }
};

export function getPokemonLore(pokemonName: string, types: string[]): PokemonLore {
  const cleanName = (pokemonName || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const [key, lore] of Object.entries(POKEMON_LORE_DATABASE)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return lore;
    }
  }

  const typesFormatted = types.map((t) => t.toUpperCase()).join(' y ');

  return {
    story: `${pokemonName} es un emblemático Pokémon de tipo ${typesFormatted}. Dentro de la saga principal de videojuegos y la serie animada de Pokémon, destaca por su rol en la ecología de su región de origen y su gran lealtad hacia sus entrenadores.`,
    biology: `Como especie de tipo ${typesFormatted}, cuenta con adaptaciones biológicas naturales para dominar su hábitat. Canaliza energía elemental a través de sus movimientos característicos en combates de Liga y Gimnasio.`,
    trivia: [
      `En la saga de videojuegos de Pokémon, aprende movimientos elementales de tipo ${typesFormatted} por nivel y MTs.`,
      `Forma parte de la Pokédex regional y es altamente valorado por coleccionistas por su diseño y biología única.`,
      `Ha hecho apariciones en la serie animada de Pokémon demostrando grandes hazañas de valentía y trabajo en equipo.`
    ],
    funFact: `¡Los entrenadores de la saga Pokémon suelen incluir a ${pokemonName} en su equipo principal por su excelente cobertura en batalla!`
  };
}
