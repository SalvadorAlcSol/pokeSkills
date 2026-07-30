export interface PokemonLore {
  story: string;
  biology: string;
  trivia: string[];
  funFact: string;
}

export const POKEMON_LORE_DATABASE: Record<string, PokemonLore> = {
  swampert: {
    story: 'Swampert es la evolución final de Mudkip, el inicial de tipo Agua de la región de Hoenn. Conocido como el "Pokémon Pez Lodo", posee una fuerza física colosal capaz de arrastrar rocas de más de una tonelada y nadar tan rápido como una moto acuática.',
    biology: 'Posee aletas pectorales y dorsales ultra sensibles que le permiten detectar cambios en las corrientes de agua y predecir tormentas o maremotos inminentes. Sus brazos son tan duros como el acero.',
    trivia: [
      'Tiene la suma de estadísticas base más alta entre todos los Pokémon iniciales de agua en sus primeras generaciones.',
      'Su combinación de tipos Agua/Tierra solo le otorga una única debilidad: el tipo Planta (recibe daño 4x en los juegos principales y 2.56x en Pokémon GO).',
      'En la Liga de Combates GO (Liga Súper y Ultra), Swampert con el ataque legado Hidrocañón es uno de los líderes históricos del metagame.'
    ],
    funFact: '¡Swampert puede predecir tsunamis con solo tocar el agua con sus aletas!'
  },
  charizard: {
    story: 'Charizard es el icónico Pokémon Llama de la región de Kanto. Vuela por los cielos en busca de oponentes poderosos y escupe fuego a temperaturas tan extremas que es capaz de derretir glaciares enteros.',
    biology: 'La llama en la punta de su cola refleja su salud y estado emocional. Si la llama arde con un tono azul intenso, significa que Charizard está en su punto máximo de poder de combate.',
    trivia: [
      'Es uno de los pocos Pokémon en poseer dos Megaevoluciones distintas (Mega Charizard X y Mega Charizard Y).',
      'En Pokémon GO, su ataque de evento de Día de la Comunidad "Anillo de Fuego" lo convierte en uno de los atacantes de fuego más devastadores en Incursiones.',
      'A pesar de tener alas y volar, su tipo primario es Fuego/Volador (no Dragón), excepto en su forma Mega Charizard X.'
    ],
    funFact: 'Su aliento de fuego jamás arderá contra un rival más débil que él.'
  },
  dragonite: {
    story: 'Dragonite es el legendario Pokémon Dragón de la primera generación. A pesar de su cuerpo robusto y de apariencia amigable, es capaz de dar la vuelta al mundo en solo 16 horas alcanzando velocidades supersónicas.',
    biology: 'Conocido como el "Guardián del Mar", es una criatura de gran bondad que rescata a marineros a la deriva durante violentas tormentas oceánicas.',
    trivia: [
      'Fue el primer Pokémon pseudo-legendario de la historia de la franquicia.',
      'En Pokémon GO Master League, Dragonite es una piedra angular indiscutible gracias a su combinación de Garra Dragón y Garra Dragón / Cometa Draco.',
      'Su inteligencia rivaliza con la de los seres humanos.'
    ],
    funFact: 'Existe un mito en el mundo Pokémon sobre una isla secreta habitada únicamente por comunidades de Dragonite.'
  },
  metagross: {
    story: 'Metagross es un Pokémon pseudo-legendario de tipo Acero/Psíquico. Nace de la fusión de dos Metang (que a su vez nacieron de la fusión de dos Beldum), dándole un total de cuatro cerebros conectados en red.',
    biology: 'Sus cuatro cerebros funcionan en paralelo como una supercomputadora cuántica. Puede calcular complejas trayectorias de ataque y predecir los movimientos del enemigo en milisegundos.',
    trivia: [
      'Metagross con el movimiento de evento "Puño Meteoro" es el atacante de tipo Acero no-legendario con el DPS más alto en Pokémon GO.',
      'Cuando Megaevoluciona en Mega Metagross, sus patas se transforman en brazos gigantescos flotantes.',
      'Es el Pokémon insignia de Steven Stone (Máximo Peñas), el Campeón de la Liga Pokémon de Hoenn.'
    ],
    funFact: '¡Sus 4 cerebros juntos son más rápidos que la computadora más avanzada del mundo!'
  },
  groudon: {
    story: 'Groudon es el Pokémon Continental legendario que personifica la masa terrestre. Desde la antigüedad, se dice que libró titánicas batallas contra Kyogre para expandir los continentes y evaporar los océanos.',
    biology: 'Al absorber la energía de la naturaleza, Groudon puede acceder a su Regresión Primigenia (Groudon Primigenio), imbuyendo su cuerpo con magma ardiente y alcanzando un poder cósmico.',
    trivia: [
      'En su forma Primigenia gana el tipo Fuego secundario, convirtiéndose en tipo Tierra/Fuego.',
      'Su ataque característico es "Filo del Abismo" (Precipice Blades), el ataque cargado de tipo Tierra más poderoso en Pokémon GO.',
      'Tiene el poder de despejar tormentas e invocar un sol abrasador de forma instantánea.'
    ],
    funFact: 'Duerme profundamente en pozos de magma subterráneos en el manto terrestre.'
  },
  kyogre: {
    story: 'Kyogre es el Pokémon Cuenca legendario de Hoenn. Posee el control absoluto sobre los océanos y es capaz de expandir los mares creando lluvias torrenciales y marejadas gigantescas.',
    biology: 'En su forma Primigenia (Kyogre Primigenio), su cuerpo se vuelve parcialmente translúcido, revelando una energía azul brillante capaz de sumergir continentes enteros.',
    trivia: [
      'Su movimiento signature es "Origen Primigenio" (Origin Pulse).',
      'Es considerado el atacante de agua #1 en Incursiones de Pokémon GO.',
      'Su habilidad en los juegos principales (Llovizna) altera el clima del planeta entero.'
    ],
    funFact: 'Se dice que Kyogre salvó al mundo antiguo de las sequías llenando las cuencas con agua pura.'
  },
  rayquaza: {
    story: 'Rayquaza es el Pokémon Cielo legendario que habita en la capa de ozono, muy por encima de las nubes. Ha volado durante millones de años alimentándose de agua y meteoritos.',
    biology: 'Desciende a la superficie del planeta únicamente cuando Groudon y Kyogre despiertan para detener sus combates destructivos y restablecer el equilibrio climático.',
    trivia: [
      'Mega Rayquaza posee una estadística de ataque colosal en Pokémon GO y su movimiento "Ascenso Draco" (Dragon Ascent) es de los más fuertes del juego.',
      'Es el líder del trío creador de Hoenn (Groudon, Kyogre y Rayquaza).',
      'Su color variocolor (Shiny) es negro azabache con dorados, considerado uno de los variocolores más populares.'
    ],
    funFact: '¡Jamás toca el suelo! Pasa toda su vida flotando en la estratosfera.'
  },
  mewtwo: {
    story: 'Mewtwo es un Pokémon legendario creado por manipulación genética a partir del ADN de Mew. Fue diseñado por científicos para ser el luchador definitivo, pero sus extraordinarios poderes psíquicos superaron todo control.',
    biology: 'Posee una mente psíquica tan poderosa que puede levitar, comunicarse por telepatía y bloquear ataques enemigos con barreras de energía pura.',
    trivia: [
      'En Pokémon GO, Mewtwo con "Onda Mental" (Psystrike) tiene una de las salidas de daño neutral más altas del juego.',
      'Cuenta con dos Megaevoluciones: Mega Mewtwo X (Psíquico/Lucha) y Mega Mewtwo Y (Psíquico puro).',
      'Su corazón es frío debido a los dolorosos experimentos que sufrió en su creación.'
    ],
    funFact: 'Descansa inmóvil dentro de cumbres oscuras para conservar al máximo su energía psíquica.'
  },
  lucario: {
    story: 'Lucario es el Pokémon Aura de tipo Lucha/Acero de la región de Sinnoh. Tiene la habilidad única de percibir las auras de todos los seres vivos a kilómetros de distancia.',
    biology: 'Al leer el aura de un adversario, Lucario puede predecir sus pensamientos, emociones y movimientos exactos en combate antes de que sucedan.',
    trivia: [
      'Su ataque característico "Esfera Aural" (Aura Sphere) nunca falla y causa un daño masivo.',
      'Es uno de los Pokémon más usados en Incursiones y Combates de Gimnasio contra tipos Normal, Roca y Acero.',
      'Puede comprender el lenguaje humano perfectamente mediante su lectura de auras.'
    ],
    funFact: '¡Puede detectar la presencia de una persona a más de un kilómetro de distancia aunque no la vea!'
  },
  gengar: {
    story: 'Gengar es el icónico Pokémon Sombra de tipo Fantasma/Veneno de la primera generación. Se oculta en las sombras de las casas y callejones para absorber el calor del ambiente y gastar travesuras.',
    biology: 'Cuando Gengar se esconde cerca, la temperatura ambiente cae drásticamente casi 10°C. Le apasiona aterrorizar a los viajeros desvalidos.',
    trivia: [
      'Mega Gengar es uno de los atacantes de tipo Fantasma con mayor DPS en todo Pokémon GO.',
      'Existen teorías populares que sugieren que Gengar es la sombra viviente del Pokémon Clefable.',
      'A pesar de ser tipo Veneno, su rol principal en PvP y Raids es como demoledor de tipo Fantasma.'
    ],
    funFact: 'Si sientes un escalofrío repentino en una habitación cerrada, ¡un Gengar anda cerca observándote!'
  }
};

export function getPokemonLore(pokemonName: string, types: string[]): PokemonLore {
  const normalizedKey = pokemonName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (POKEMON_LORE_DATABASE[normalizedKey]) {
    return POKEMON_LORE_DATABASE[normalizedKey];
  }

  const typesFormatted = types.map((t) => t.toUpperCase()).join(' y ');
  return {
    story: `${pokemonName} es una criatura destacada dentro del mundo Pokémon de tipo ${typesFormatted}. Es valorado por los entrenadores debido a su versatilidad táctica y potencia de combate en Pokémon GO.`,
    biology: `Como Pokémon de tipo ${typesFormatted}, posee facultades adaptadas a su entorno natural. Su estructura física le permite canalizar movimientos elementales de alta efectividad en combates de Gimnasios e Incursiones.`,
    trivia: [
      `En Pokémon GO, sus estadísticas base de ataque, defensa y salud determinan su PC Máximo y rendimiento en Ligas PvP.`,
      `Aprovecha el bono STAB (Same Type Attack Bonus) del 20% al utilizar ataques que coincidan con su tipo elemental (${typesFormatted}).`,
      `Al potenciar sus IVs al 100% (15/15/15), alcanza su rendimiento de combate óptimo.`
    ],
    funFact: `¡Los entrenadores veteranos frecuentemente incluyen a ${pokemonName} en sus equipos para cubrir debilidades clave de tipo!`
  };
}
