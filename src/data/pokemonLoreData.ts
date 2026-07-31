export interface PokemonLore {
  story: string;
  biology: string;
  trivia: string[];
  funFact: string;
}

export const POKEMON_LORE_DATABASE: Record<string, PokemonLore> = {
  zacian: {
    story: 'Zacian es el legendario Pokémon de la región de Galar conocido como el "Héroe de la Espada". En la antigüedad, unió fuerzas con Zamazenta y los reyes humanos para detener la catástrofe de la "Noche Negra" provocada por el gigantesco Eternatus.',
    biology: 'En su forma base (Guerrero Avezado) vaga como un lobo solitario con cicatrices de batallas milenarias. Al sostener la Espada Oxidada en sus mandíbulas, absorbe la energía de la tierra y se transforma en su Forma Espada Suprema.',
    trivia: [
      'Su ataque característico es Tajo Supremo (Behemoth Blade), una estocada legendaria capaz de cortar el acero como papel.',
      'En el anime "Pokémon Viajes", Zacian se manifiesta ante Ash Ketchum en el Bosque Corona para guiarlo hacia la batalla final contra Eternatus Dinamax.',
      'Al transformarse en Espada Suprema, gana el tipo Acero secundario junto a su tipo Hada primario.'
    ],
    funFact: '¡Su espada es tan afilada que puede hendir montañas enteras con una sola estocada limpia!'
  },
  zaciancrowned: {
    story: 'Zacian Espada Suprema es la forma manifestada del héroe legendario de Galar al empuñar la Espada Oxidada. Su espada resplandece con un áura dorada capaz de cortar la distorsión espacial de Eternatus.',
    biology: 'Aferra la Espada Oxidada con sus mandíbulas. Se desplaza en combate a velocidades supersónicas que superan la vista humana, pareciendo un rayo dorado.',
    trivia: [
      'Posee el ataque insignia Tajo Supremo (Behemoth Blade), de tipo Acero con 160 de potencia.',
      'En los videojuegos principales (Pokémon Espada y Escudo), Tajo Supremo causa el doble de daño a Pokémon en estado Dinamax o Gigamax.',
      'Forma junto a Zamazenta la dupla legendaria que protegió a la región de Galar hace más de 3,000 años.'
    ],
    funFact: '¡Se dice que su espada jamás ha sufrido una sola mella en miles de años de batallas!'
  },
  zamazenta: {
    story: 'Zamazenta es el legendario "Héroe del Escudo" de Galar. Junto a Zacian, protegió a la humanidad del colapso energético de la Noche Negra, sirviendo como el baluarte inexpugnable de la región.',
    biology: 'Al equipar el Escudo Oxidado, su pelaje frontal se convierte en una coraza dorada impenetrable capaz de repeler cualquier ataque o rayo de energía elemental.',
    trivia: [
      'Su ataque distintivo es Embate Supremo (Behemoth Bash), de tipo Acero.',
      'Al adoptar la Forma Escudo Supremo, su tipo evoluciona de Lucha puro a Lucha/Acero.',
      'En la serie animada de Pokémon, lucha codo a codo con Goh en el clímax de la crisis de Puntera.'
    ],
    funFact: '¡Su escudo frontal puede soportar la explosión simultánea de mil bombas sin ceder un milímetro!'
  },
  eternatus: {
    story: 'Eternatus es un Pokémon legendario de origen extraterrestre que llegó a la Tierra dentro de un meteorito hace 20,000 años. Es la fuente de toda la energía Dinamax que existe en la región de Galar.',
    biology: 'Su cuerpo tiene una estructura esquelética dragónica gigante alimentada por un núcleo de energía infinita. En su forma Eternamax, adopta la apariencia de una mano cósmica gigantesca.',
    trivia: [
      'En su forma Eternamax posee la suma de estadísticas base más alta de toda la historia de Pokémon (1125 BST).',
      'Sus movimientos característicos son Cañón Dinamax (Dyna Beam) y Rayo Infinito (Eternabeam).',
      'En la serie animada, fue sellado en la Pokédex de Goh tras una batalla titánica asistida por Zacian y Zamazenta.'
    ],
    funFact: '¡Toda la energía que permite a los Pokémon hacerse gigantes en Galar proviene del núcleo de Eternatus!'
  },
  charizard: {
    story: 'Charizard es el icónico Pokémon Llama de Kanto. Es famoso en la franquicia por ser el indomable y leal compañero de Ash Ketchum en el anime original.',
    biology: 'Vuela alto por los cielos buscando rivales poderosos. La llama en la punta de su cola refleja su estado de ánimo y fuerza vital; si se apaga, su vida termina.',
    trivia: [
      'Es uno de los pocos Pokémon con dos Megaevoluciones distintas: Mega Charizard X (Fuego/Dragón) y Mega Charizard Y (Fuego/Volador).',
      'En el anime original, derrotó al legendario Articuno de Noland en la Fábrica de la Batalla.',
      'Es el Pokémon estrella del Campeón de Kanto y Galar, Lionel (Leon).'
    ],
    funFact: '¡Su aliento de fuego alcanza temperaturas capaces de derretir glaciares y grandes rocas!'
  },
  blastoise: {
    story: 'Blastoise es el Pokémon Marisquero de la región de Kanto y evolución final de Squirtle. Lanza chorros de agua a alta presión desde los cañones de su caparazón.',
    biology: 'Su pesado caparazón soporta el inmenso retroceso de sus cañones de agua, los cuales pueden perforar planchas de acero a más de 50 metros de distancia.',
    trivia: [
      'En el anime, el Squirtle de Ash lideraba el famoso "Escuadrón Squirtle" antes de unirse al viaje.',
      'En su forma Gigamax en Galar, su caparazón se convierte en un buque de guerra con 31 cañones pequeños y uno gigante central.',
      'Es el Pokémon insignia del rival de Ash, Gary Oak.'
    ],
    funFact: '¡Los cañones de agua de Blastoise son tan precisos que pueden acertar a una lata de refresco a 50 metros!'
  },
  venusaur: {
    story: 'Venusaur es el Pokémon Semilla de Kanto y evolución final de Bulbasaur. La enorme flor de su lomo absorbe los rayos solares para ganar energía.',
    biology: 'El aroma que despide su flor florecida calma las emociones de las personas y calma la agresividad de otros Pokémon en el bosque.',
    trivia: [
      'En el anime, el Bulbasaur de Ash fue el guardián de los Pokémon heridos en la cabaña de Melanie.',
      'Su flor se vuelve más colorida y perfumada cuanto más sol absorbe.',
      'Posee una Megaevolución (Mega Venusaur) que aumenta drásticamente sus defensas.'
    ],
    funFact: '¡En los días soleados, el aroma de su flor llena todo el bosque y atrae a cientos de Butterfree!'
  },
  pikachu: {
    story: 'Pikachu es el ratón eléctrico mundialmente famoso y la mascota principal de la franquicia Pokémon. Es el inseparable compañero de aventuras de Ash Ketchum.',
    biology: 'Almacena energía eléctrica en las bolsas rojas de sus mejillas. Cuando se siente amenazado o emocionado, libera potentes descargas eléctricas por la cola.',
    trivia: [
      'En el anime, el Pikachu de Ash rehusó entrar a su Pokébola desde el primer episodio.',
      'Posee un movimiento Z exclusivo llamado "Gigavoltio Destructor" y una forma Gigamax.',
      'Cuando varios Pikachu se reúnen, sus cargas eléctricas combinadas pueden provocar tormentas eléctricas.'
    ],
    funFact: '¡Usa pequeñas descargas eléctricas para chuscar y tostar las bayas duras antes de comerlas!'
  },
  mewtwo: {
    story: 'Mewtwo es la creación científica definitiva de Isla Cayo. Fue clonado genéticamente a partir del ADN del mítico Mew con el objetivo de crear al luchador supremo.',
    biology: 'Su mente psíquica le permite levitar, comunicarse por telepatía y manifestar barreras de energía indestructibles.',
    trivia: [
      'Protagonizó la primera película de cine de Pokémon "Mewtwo vs. Mew" (1998).',
      'Cuenta con dos Megaevoluciones: Mega Mewtwo X (Psíquico/Lucha) y Mega Mewtwo Y (Psíquico puro).',
      'En los videojuegos originales, habitaba en el fondo de la Cueva Celeste.'
    ],
    funFact: 'Descansa en trance meditativo dentro de cavernas oscuras para preservar su energía psíquica.'
  },
  mew: {
    story: 'Mew es el Pokémon Mítico ancestral que se cree posee el código genético de todos los Pokémon existentes. Es considerado el ancestro de la vida Pokémon.',
    biology: 'Es capaz de volverse invisible a voluntad y posee la habilidad de aprender cualquier movimiento existente en el mundo Pokémon.',
    trivia: [
      'Fue creado por el programador Shigeki Morimoto como un secreto oculto en el código de Pokémon Rojo y Verde.',
      'En la película "Mewtwo vs. Mew", demostró una naturaleza juguetona e inocente pero de poder infinito.',
      'Puede transformarse en cualquier otro Pokémon usando el movimiento Transformación.'
    ],
    funFact: '¡Se dice que solo se muestra ante personas que poseen un corazón puro e inocente!'
  },
  rayquaza: {
    story: 'Rayquaza es el guardián de la capa de ozono del planeta y líder del trío creador de Hoenn junto a Groudon y Kyogre.',
    biology: 'Habita a miles de metros de altura en la estratosfera. Desciende únicamente a la superficie cuando los titanes Groudon y Kyogre despiertan para detener su combate.',
    trivia: [
      'Fue el primer Pokémon en la historia en poder Megaevolucionar mediante un movimiento aprendido (Ascenso Draco).',
      'En la película animada "El Destino de Deoxys", combatió contra Deoxys en los límites del espacio.',
      'Su variante variocolor (Shiny) es de color negro azabache con filamentos dorados.'
    ],
    funFact: '¡Jamás toca la tierra! Pasa siglos enteros flotando en la estratosfera alimentándose de meteoritos.'
  },
  groudon: {
    story: 'Groudon es el Pokémon Continental legendario que personifica la tierra firme. En la mitología de Hoenn, elevó los continentes y creó los volcanes.',
    biology: 'Al absorber la energía de la naturaleza, accede a su Regresión Primigenia (Groudon Primigenio), imbuyendo su cuerpo de magma ardiente.',
    trivia: [
      'En su forma Primigenia gana el tipo Fuego secundario (Tierra/Fuego).',
      'Su ataque característico es Filo del Abismo (Precipice Blades).',
      'Tiene el poder de disipar tormentas e invocar un sol abrasador al instante.'
    ],
    funFact: 'Duerme plácidamente en pozos de magma subterráneos bajo el manto terrestre.'
  },
  kyogre: {
    story: 'Kyogre es el Pokémon Cuenca legendario que personifica los océanos. Expandió los mares del mundo antiguo provocando lluvias y marea alta.',
    biology: 'En su Regresión Primigenia (Kyogre Primigenio), su cuerpo se vuelve parcialmente translúcido revelando un núcleo de energía oceánica pura.',
    trivia: [
      'Su movimiento característico es Origen Primigenio (Origin Pulse).',
      'En los videojuegos principales, su habilidad Llovizna altera el clima del planeta entero.',
      'Salvó a las civilizaciones antiguas de las sequías llenando las cuencas con agua desbordante.'
    ],
    funFact: '¡Su cuerpo gigante puede nadar en las profundidades marinas más oscuras sin sentir presión!'
  },
  dialga: {
    story: 'Dialga es el Pokémon Legendario de Sinnoh que gobierna el tiempo. Se dice que el tiempo comenzó a marchar en el universo cuando Dialga nació.',
    biology: 'El latido de su corazón impulsa el flujo del tiempo hacia adelante. Puede viajar libremente al pasado y al futuro.',
    trivia: [
      'Su movimiento característico es Distorsión (Roar of Time), de tipo Dragón.',
      'Posee una Forma Origen en la región de Hisui (Pokémon Leyendas: Arceus).',
      'Es la deidad protectora representada en la estructura de la Columna Lanza.'
    ],
    funFact: '¡Cada segundo que pasa en el universo está coordinado por los latidos del corazón de Dialga!'
  },
  palkia: {
    story: 'Palkia es el Pokémon Legendario de Sinnoh que gobierna el espacio. Su respiración estabiliza las dimensiones del cosmos.',
    biology: 'Habita en una dimensión paralela entre las grietas del espacio. Puede rasgar la estructura del espacio para teletransportar materia.',
    trivia: [
      'Su movimiento característico es Spacial Rend (Corte Vacío), de tipo Dragón.',
      'Al igual que Dialga, posee una Forma Origen en Pokémon Leyendas: Arceus.',
      'En la película "Dialga vs. Palkia vs. Darkrai", libró una batalla dimensional sobre Ciudad Álamos.'
    ],
    funFact: '¡Un solo movimiento de sus garras puede rasgar el tejido del espacio y conectar dos mundos!'
  },
  giratina: {
    story: 'Giratina es el Pokémon Legendario de Sinnoh desterrado al Mundo Distorsión por su naturaleza violenta e incontrolable.',
    biology: 'En el Mundo Distorsión adopta su Forma Origen sin patas y voladora. En el mundo real adopta la Forma Modificada de seis patas.',
    trivia: [
      'Su movimiento característico es Golpe Umbrío (Shadow Force), que atraviesa cualquier protección o barrera.',
      'Es el tercer integrante del Trío de la Creación de Sinnoh junto a Dialga y Palkia.',
      'En Pokémon Platino, arrastra al antagonista Helio al Mundo Distorsión.'
    ],
    funFact: '¡En su mundo de origen, la gravedad no existe y el agua fluye hacia el cielo!'
  },
  lucario: {
    story: 'Lucario es el Pokémon Aura de tipo Lucha/Acero de Sinnoh. Es capaz de sentir el aura espiritual de todos los seres vivos a kilómetros.',
    biology: 'Lee los pensamientos y emociones de sus rivales para anticipar sus movimientos exactos en combate.',
    trivia: [
      'Fue el protagonista de la película "Lucario y el Misterio de Mew".',
      'Su ataque característico Esfera Aural (Aura Sphere) nunca falla el blanco.',
      'Fue un miembro clave del equipo de Ash Ketchum en su victoria en la Serie Mundial de Coronación.'
    ],
    funFact: '¡Puede detectar la presencia de una persona a más de un kilómetro de distancia mediante su aura!'
  },
  greninja: {
    story: 'Greninja es el Pokémon Ninja de tipo Agua/Siniestro de Kalos y evolución final de Froakie. Es uno de los Pokémon más populares de la franquicia.',
    biology: 'Crea shurikens de agua comprimida capaces de cortar el acero. Se mueve en silencio absoluto imitando a los ninjas ancestrales.',
    trivia: [
      'Formó con Ash Ketchum una transformación única llamada "Greninja de Ash" impulsada por el fenómeno vínculo.',
      'Fue votado como el Pokémon #1 más popular del mundo en la encuesta oficial de la Compañía Pokémon en 2020.',
      'Su lengua le sirve como bufanda táctica en combate.'
    ],
    funFact: '¡Comprime el agua hasta hacerla tan dura y afilada que puede partir rocas por la mitad!'
  },
  gengar: {
    story: 'Gengar es el Pokémon Sombra de tipo Fantasma/Veneno de Kanto. Se oculta en las sombras nocturnas para asustar a los viajeros.',
    biology: 'Cuando se oculta en la sombra de alguien, roba el calor del ambiente provocando una caída drástica de temperatura de 10°C.',
    trivia: [
      'Una famosa teoría de fans sugiere que Gengar es la sombra viviente de Clefable.',
      'Posee una forma Gigamax en Galar donde su boca es un portal al inframundo.',
      'Fue parte del equipo campeón de Ash Ketchum en Pokémon Viajes.'
    ],
    funFact: '¡Si sientes un escalofrío helado repentino en la espalda, hay un Gengar riéndose detrás de ti!'
  },
  dragonite: {
    story: 'Dragonite es el legendario Pokémon Dragón pseudo-legendario de Kanto. Posee una naturaleza bondadosa y salva a marineros náufragos.',
    biology: 'A pesar de su cuerpo robusto, puede volar alrededor del globo terráqueo entero en solo 16 horas a velocidad supersónica.',
    trivia: [
      'Fue el primer Pokémon pseudo-legendario de la historia de la franquicia.',
      'En el anime, el Dragonite de Ash era conocido por su personalidad afectuosa y sus abrazos gigantes.',
      'Su inteligencia rivaliza con la de los seres humanos.'
    ],
    funFact: '¡Existe un mito en el mundo Pokémon sobre una isla secreta habitada únicamente por comunidades de Dragonite!'
  },
  tyranitar: {
    story: 'Tyranitar es el Pokémon Coraza pseudo-legendario de tipo Roca/Siniestro de la región de Johto.',
    biology: 'Su cuerpo está cubierto por una coraza impenetrable. Cuando se enfurece, derrumba montañas enteras y altera la geografía de la región.',
    trivia: [
      'Posee una Megaevolución (Mega Tyranitar) con púas alargadas y mayor fuerza bruta.',
      'En los videojuegos principales, su habilidad Chorro Arena invoca una tormenta de arena permanente.',
      'En el anime, es representado como una fuerza de la naturaleza imparable.'
    ],
    funFact: '¡Es tan fuerte que puede derribar una montaña entera solo para construir su nido!'
  },
  metagross: {
    story: 'Metagross es el Pokémon Patas de Acero de tipo Acero/Psíquico de Hoenn. Nace de la fusión de dos Metang.',
    biology: 'Sus cuatro cerebros interconectados funcionan como una supercomputadora cuántica capaces de calcular trayectorias de ataque en milisegundos.',
    trivia: [
      'Es el Pokémon estrella del Campeón de la Liga de Hoenn, Máximo Peñas (Steven Stone).',
      'Posee una Megaevolución donde flota en el aire usando magnetismo.',
      'Plega sus cuatro patas para flotar por los aires a gran velocidad.'
    ],
    funFact: '¡Sus 4 cerebros combinados son más rápidos que la supercomputadora más avanzada de la Tierra!'
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
    story: `${pokemonName} es una criatura oficial registrada en la Pokédex de la saga principal de Pokémon de tipo ${typesFormatted}. En la historia y los videojuegos principales de Nintendo, destaca por su biología única y por su participación en combates de Gimnasios y Ligas Pokémon regionales.`,
    biology: `Como Pokémon de tipo ${typesFormatted}, posee facultades defensivas y ofensivas adaptadas a su entorno natural en el mundo Pokémon. Canaliza movimientos elementales característicos durante las batallas de entrenamiento.`,
    trivia: [
      `En los videojuegos principales de la franquicia Pokémon, aprende poderosos ataques de tipo ${typesFormatted} al subir de nivel y mediante Máquinas Técnicas (MT).`,
      `Forma parte de las enciclopedias Pokédex regionales oficiales de la saga de videojuegos de Game Freak.`,
      `Ha hecho apariciones en la serie animada oficial de Pokémon (Anime) demostrando gran lealtad e inteligencia en combate.`
    ],
    funFact: `¡En el universo de Pokémon, los entrenadores valoran mucho a ${pokemonName} por sus movimientos de tipo ${typesFormatted}!`
  };
}
