export interface PokemonLore {
  story: string;
  biology: string;
  trivia: string[];
  funFact: string;
}

export const POKEMON_LORE_DATABASE: Record<string, PokemonLore> = {
  kyurem: {
    story: 'Kyurem es el Pokémon Frontera legendario de la región de Teselia (Unova). Es la cáscara helada y vacía que quedó tras la división del Dragón Original primordial. Al fusionarse con Zekrom mediante la Punta ADN (DNA Splicers), renace como Kyurem Negro, el titán del frío y los rayos.',
    biology: 'En su forma Kyurem Negro, absorbe el poder eléctrico de Zekrom en el generador de su cola. Su temperatura corporal interna desciende hasta el cero absoluto (-273.15°C), congelando al instante todo lo que toca.',
    trivia: [
      'En Pokémon Blanco 2 y Negro 2, Ghechis (líder del Equipo Plasma) usó la Punta ADN para obligar a Kyurem a fusionarse con Zekrom y congelar la región entera.',
      'Su ataque insignia exclusivo es Rayo Gélido (Freeze Shock), de tipo Hielo con 140 de potencia destructiva.',
      'En la película "Kyurem vs. el Espadachín Místico (Keldeo)", es considerado el Pokémon Dragón más poderoso de la Tierra, capaz de cambiar entre sus formas Negra y Blanca a voluntad en combate.'
    ],
    funFact: '¡Produce un aire tan gélido (-273.15°C) que puede congelar una ciudad entera y detener el movimiento atómico!'
  },
  kyuremblack: {
    story: 'Kyurem Negro es la majestuosa forma resultante de la fusión de ADN entre Kyurem y Zekrom mediante la Punta ADN en la región de Teselia. Encarna la unión entre el cero absoluto y los ideales del rayo.',
    biology: 'Canaliza la energía del rayo a través del ala izquierda y su cola de turbina electrificada. Desata una fuerza física descomunal capaz de pulverizar glaciares y montañas con sus garras de hielo negro.',
    trivia: [
      'Posee una de las estadísticas de Ataque Físico más altas de toda la historia de Pokémon (170 Base Atk).',
      'Su movimiento característico es Rayo Gélido (Freeze Shock), acompañado por la habilidad Terravoltio.',
      'En el anime y películas, combatió contra el trío de los Espadachines Místicos (Cobalion, Terrakion y Virizion).'
    ],
    funFact: '¡Su brazo izquierdo y cola generan chispas eléctricas de millones de voltios envueltas en hielo eterno!'
  },
  kyuremwhite: {
    story: 'Kyurem Blanco es la forma resultante de la fusión entre Kyurem y Reshiram mediante la Punta ADN. Representa la alianza entre el fuego de la verdad y el cero absoluto.',
    biology: 'Su cola se transforma en una turbina de fuego blanco capaz de expulsar llamas a temperaturas estelares mientras su cuerpo permanece a cero absoluto.',
    trivia: [
      'Su ataque característico es Llama Gélida (Ice Burn), de tipo Hielo con 140 de potencia especial.',
      'Posee 170 puntos de Ataque Especial base.',
      'En los videojuegos principales de Nintendo DS, fue el Pokémon insignia de Pokémon Blanco 2.'
    ],
    funFact: '¡Puede incinerar el ambiente circundante y congelarlo en el mismo instante!'
  },
  reshiram: {
    story: 'Reshiram es el Pokémon Blanco Verídico de Teselia. Nació cuando el Dragón Único se dividió entre los príncipes gemelos de la antigüedad, eligiendo al hermano que buscaba la Verdad.',
    biology: 'Su cola es una turbina de combustión interna que puede abrasar el mundo entero con llamas blancas y alterar el clima del planeta.',
    trivia: [
      'Su movimiento característico es Llama Fusión (Fusion Flare) y Llama Azul (Blue Flare).',
      'En el anime, protagonizó la película "Pokémon: Blanco - Victini y Zekrom / Negro - Victini y Reshiram".',
      'Vuela envolviendo los cielos en resplandores de fuego blanco deslumbrante.'
    ],
    funFact: '¡Cuando vuela a toda velocidad, el calor expulsado por su cola mueve las masas de aire del planeta!'
  },
  zekrom: {
    story: 'Zekrom es el Pokémon Negro Ideales de Teselia. Se escindió del Dragón Único para apoyar al hermano gemelo que luchaba por los Ideales.',
    biology: 'El generador en forma de cono de su cola produce cantidades ilimitadas de electricidad. Oculta su cuerpo dentro de nubes de tormenta oscuras.',
    trivia: [
      'Sus movimientos característicos son Rayo Fusión (Fusion Bolt) y Ataque Fulgor (Bolt Strike).',
      'Posee la habilidad Terravoltio, que le permite ignorar las habilidades defensivas enemigas.',
      'En Pokémon Negro y Blanco, N invoca a Zekrom en el Palacio para desafiar al Campeón Mirto.'
    ],
    funFact: '¡Su cola gira como una gigantesca turbina de alta tensión capaz de electrocutar continentes!'
  },
  necrozma: {
    story: 'Necrozma es un Ultraente legendario proveniente de un mundo al que le fue arrebatada toda la luz. Viaja por las dimensiones buscando fuentes de energía lumínica para saciar su dolor eterno.',
    biology: 'Su cuerpo está compuesto por un prisma de cristal negro. Para recuperar su verdadera forma, devora y se fusiona con los legendarios Solgaleo o Lunala.',
    trivia: [
      'Al fusionarse con Solgaleo adopta la forma Necrozma Melena Crepuscular (Sol/Acero).',
      'Al fusionarse con Lunala adopta la forma Necrozma Alas del Alba (Psíquico/Fantasma).',
      'Con el Ultranecrostal Z se transforma en Ultra Necrozma, resplandeciendo como un dragón de luz pura de 754 de BST.'
    ],
    funFact: '¡En su forma Ultra Necrozma, la temperatura de su cuerpo alcanza los 6,000°C e irradia luz a todo el Ultraespacio!'
  },
  solgaleo: {
    story: 'Solgaleo es conocido como el "Heraldo del Sol" y devorador del astro rey. Es el Pokémon Legendario patrón de la región de Alola y evolución final de Cosmog.',
    biology: 'Su cuerpo alberga una cantidad desbordante de energía solar. Cuando libera su poder, su melena brilla intensamente como la superficie del sol.',
    trivia: [
      'Su ataque característico es Meteoro Impacto (Sunsteel Strike), de tipo Acero.',
      'En el anime de Pokémon Sol y Luna, Ash crió a Solgaleo desde que era un pequeño Nebulilla (Cosmog).',
      'Viaja a través de los Ultraumbrales hacia otras dimensiones del Ultraespacio.'
    ],
    funFact: '¡Su cuerpo brilla con tanta intensidad en la noche que transforma la oscuridad en pleno día!'
  },
  lunala: {
    story: 'Lunala es conocida como la "Heraldo de la Luna" y la criatura que convoca a la noche eterna en Alola.',
    biology: 'Absorbe la luz continua del ambiente para convertirla en energía oscura. Sus alas extendidas recuerdan al cielo nocturno estrellado.',
    trivia: [
      'Su ataque característico es Rayo Umbrío (Moongeist Beam), de tipo Fantasma.',
      'Junto a Solgaleo, creó los espíritus de los Tapus guardianes de las islas de Alola.',
      'Es de tipo Psíquico/Fantasma.'
    ],
    funFact: '¡Al desplegar sus alas de par en par, parece envolver el horizonte en una noche llena de estrellas!'
  },
  calyrex: {
    story: 'Calyrex es el antiguo "Rey de las Cosechas" de la región de Galar. Gobernó las Nieves de la Corona en la antigüedad brindando cosechas abundantes y fertilidad a la tierra.',
    biology: 'Su enorme corona en la cabeza alberga poderes psíquicos y curativos infinitos. Al montar su corcel legendario usando las Riendas de la Unidad, recupera todo su esplendor regio.',
    trivia: [
      'En Pokémon Espada y Escudo (Las Nieves de la Corona), puede montar sobre Glastrier para ser Calyrex Jinete Glacial (Psíquico/Hielo).',
      'O montar sobre Spectrier para convertirse en Calyrex Jinete Espectral (Psíquico/Fantasma).',
      'Se comunica por telepatía utilizando el cuerpo del personaje Peony como intérprete.'
    ],
    funFact: '¡Un solo toque de sus manos telepáticas puede hacer florecer campos enteros congelados en minutos!'
  },
  zacian: {
    story: 'Zacian es el legendario "Héroe de la Espada" de Galar. En la antigüedad detuvo la catástrofe de la Noche Negra provocada por Eternatus.',
    biology: 'Al sostener la Espada Oxidada en sus mandíbulas, absorbe la energía de la tierra y se transforma en su Forma Espada Suprema.',
    trivia: [
      'Su ataque característico es Tajo Supremo (Behemoth Blade), una estocada legendaria capaz de cortar el acero como papel.',
      'En el anime "Pokémon Viajes", Zacian se manifiesta ante Ash Ketchum en el Bosque Corona para guiarlo hacia la batalla final.',
      'Al transformarse en Espada Suprema, gana el tipo Acero secundario junto a su tipo Hada primario.'
    ],
    funFact: '¡Su espada es tan afilada que puede hendir montañas enteras con una sola estocada limpia!'
  },
  zamazenta: {
    story: 'Zamazenta es el legendario "Héroe del Escudo" de Galar. Junto a Zacian, protegió a la humanidad del colapso energético de la Noche Negra.',
    biology: 'Al equipar el Escudo Oxidado, su pelaje frontal se convierte en una coraza dorada impenetrable capaz de repeler cualquier ataque.',
    trivia: [
      'Su ataque distintivo es Embate Supremo (Behemoth Bash), de tipo Acero.',
      'Al adoptar la Forma Escudo Supremo, su tipo evoluciona de Lucha puro a Lucha/Acero.',
      'En la serie animada de Pokémon, lucha codo a codo con Goh en la batalla final.'
    ],
    funFact: '¡Su escudo frontal puede soportar la explosión simultánea de mil bombas sin ceder un milímetro!'
  },
  eternatus: {
    story: 'Eternatus es un Pokémon legendario de origen extraterrestre que llegó a la Tierra dentro de un meteorito hace 20,000 años. Es la fuente de toda la energía Dinamax en Galar.',
    biology: 'Su cuerpo esquelético gigante absorbe y proyecta partículas de energía cósmica. En su forma Eternamax, adopta la apariencia de una mano estelar gigante.',
    trivia: [
      'En su forma Eternamax posee la suma de estadísticas base más alta de toda la historia de Pokémon (1125 BST).',
      'Sus movimientos característicos son Cañón Dinamax y Rayo Infinito.',
      'Fue capturado y sellado en la Pokédex de Goh en el anime.'
    ],
    funFact: '¡Toda la energía que permite a los Pokémon hacerse gigantes en Galar proviene del núcleo de Eternatus!'
  },
  charizard: {
    story: 'Charizard es el icónico Pokémon Llama de Kanto. Es famoso en la franquicia por ser el indomable y leal compañero de Ash Ketchum en el anime original.',
    biology: 'Vuela alto por los cielos buscando rivales poderosos. La llama en la punta de su cola refleja su estado de ánimo y fuerza vital.',
    trivia: [
      'Es uno de los pocos Pokémon con dos Megaevoluciones distintas: Mega Charizard X y Mega Charizard Y.',
      'En el anime original, derrotó al legendario Articuno de Noland en la Fábrica de la Batalla.',
      'Es el Pokémon estrella del Campeón Lionel (Leon).'
    ],
    funFact: '¡Su aliento de fuego alcanza temperaturas capaces de derretir glaciares y grandes rocas!'
  },
  blastoise: {
    story: 'Blastoise es el Pokémon Marisquero de Kanto. Lanza chorros de agua a alta presión desde los cañones de su caparazón.',
    biology: 'Su pesado caparazón soporta el inmenso retroceso de sus cañones de agua, los cuales pueden perforar planchas de acero.',
    trivia: [
      'En el anime, el Squirtle de Ash lideraba el famoso "Escuadrón Squirtle".',
      'En su forma Gigamax en Galar, su caparazón se convierte en un buque de guerra con 31 cañones.',
      'Es el Pokémon insignia de Gary Oak.'
    ],
    funFact: '¡Los cañones de agua de Blastoise son tan precisos que pueden acertar a una lata a 50 metros!'
  },
  venusaur: {
    story: 'Venusaur es el Pokémon Semilla de Kanto. La enorme flor de su lomo absorbe los rayos solares para ganar energía.',
    biology: 'El aroma que despide su flor florecida calma las emociones de las personas y mitiga la agresividad de otros Pokémon.',
    trivia: [
      'En el anime, el Bulbasaur de Ash fue el guardián de los Pokémon heridos.',
      'Su flor se vuelve más colorida y perfumada cuanto más sol absorbe.',
      'Posee una Megaevolución que aumenta drásticamente sus defensas.'
    ],
    funFact: '¡En los días soleados, el aroma de su flor llena todo el bosque y atrae a cientos de Butterfree!'
  },
  pikachu: {
    story: 'Pikachu es el ratón eléctrico mundialmente famoso y la mascota principal de Pokémon. Es el compañero inseparable de Ash Ketchum.',
    biology: 'Almacena energía eléctrica en las bolsas rojas de sus mejillas. Libera descargas eléctricas por la cola cuando se siente amenazado.',
    trivia: [
      'En el anime, rehusó entrar a su Pokébola desde el primer episodio.',
      'Posee un movimiento Z exclusivo llamado "Gigavoltio Destructor" y forma Gigamax.',
      'Cuando varios Pikachu se reúnen, sus cargas eléctricas combinadas provocan tormentas.'
    ],
    funFact: '¡Usa pequeñas descargas eléctricas para chuscar y tostar las bayas duras antes de comerlas!'
  },
  mewtwo: {
    story: 'Mewtwo es la creación científica definitiva de Isla Cayo. Fue clonado genéticamente a partir del ADN de Mew para ser el luchador supremo.',
    biology: 'Su mente psíquica le permite levitar, comunicarse por telepatía y manifestar barreras de energía indestructibles.',
    trivia: [
      'Protagonizó la primera película de cine de Pokémon "Mewtwo vs. Mew" (1998).',
      'Cuenta con dos Megaevoluciones: Mega Mewtwo X y Mega Mewtwo Y.',
      'En los videojuegos originales, habitaba en el fondo de la Cueva Celeste.'
    ],
    funFact: 'Descansa en trance meditativo dentro de cavernas oscuras para preservar su energía psíquica.'
  },
  mew: {
    story: 'Mew es el Pokémon Mítico ancestral que posee el código genético de todos los Pokémon existentes. Es el ancestro de la vida Pokémon.',
    biology: 'Es capaz de volverse invisible a voluntad y posee la habilidad de aprender cualquier movimiento existente.',
    trivia: [
      'Fue creado por el programador Shigeki Morimoto como un secreto en el código de Pokémon Rojo y Verde.',
      'En la película "Mewtwo vs. Mew", demostró un poder infinito pero una naturaleza juguetona.',
      'Puede transformarse en cualquier otro Pokémon.'
    ],
    funFact: '¡Se dice que solo se muestra ante personas que poseen un corazón puro e inocente!'
  },
  rayquaza: {
    story: 'Rayquaza es el guardián de la capa de ozono del planeta y líder del trío creador de Hoenn junto a Groudon y Kyogre.',
    biology: 'Habita en la estratosfera y desciende únicamente cuando Groudon y Kyogre despiertan para detener su combate.',
    trivia: [
      'Fue el primer Pokémon en poder Megaevolucionar mediante un movimiento aprendido (Ascenso Draco).',
      'En la película "El Destino de Deoxys", combatió contra Deoxys en los límites del espacio.',
      'Su variante variocolor es de color negro azabache.'
    ],
    funFact: '¡Jamás toca la tierra! Pasa siglos flotando en la estratosfera alimentándose de meteoritos.'
  },
  groudon: {
    story: 'Groudon es el Pokémon Continental legendario que personifica la tierra firme. En la mitología de Hoenn, elevó los continentes.',
    biology: 'Al acceder a su Regresión Primigenia, imbuye su cuerpo de magma ardiente de tipo Tierra/Fuego.',
    trivia: [
      'Su ataque característico es Filo del Abismo.',
      'Su habilidad Chorro Arena invoca un sol abrasador permanente.',
      'Duerme en pozos de magma subterráneos.'
    ],
    funFact: 'Duerme plácidamente en pozos de magma subterráneos bajo el manto terrestre.'
  },
  kyogre: {
    story: 'Kyogre es el Pokémon Cuenca legendario que personifica los océanos. Expandió los mares del mundo antiguo provocando lluvias.',
    biology: 'En su Regresión Primigenia, su cuerpo se vuelve translúcido revelando un núcleo de energía oceánica pura.',
    trivia: [
      'Su movimiento característico es Origen Primigenio.',
      'Altera el clima del planeta entero provocando lluvias torrenciales.',
      'Salvó a las civilizaciones antiguas de las sequías.'
    ],
    funFact: '¡Su cuerpo gigante puede nadar en las profundidades marinas más oscuras sin sentir presión!'
  },
  giratina: {
    story: 'Giratina es el Pokémon Legendario de Sinnoh desterrado al Mundo Distorsión por su naturaleza violenta.',
    biology: 'En el Mundo Distorsión adopta su Forma Origen sin patas. En el mundo real adopta la Forma Modificada de seis patas.',
    trivia: [
      'Su movimiento característico es Golpe Umbrío.',
      'Es el tercer integrante del Trío de la Creación de Sinnoh junto a Dialga y Palkia.',
      'En Pokémon Platino, arrastra al antagonista Helio al Mundo Distorsión.'
    ],
    funFact: '¡En su mundo de origen, la gravedad no existe y el agua fluye hacia el cielo!'
  },
  lucario: {
    story: 'Lucario es el Pokémon Aura de tipo Lucha/Acero de Sinnoh. Siente el aura espiritual de todos los seres vivos a kilómetros.',
    biology: 'Lee los pensamientos y emociones de sus rivales para anticipar sus movimientos en combate.',
    trivia: [
      'Fue el protagonista de la película "Lucario y el Misterio de Mew".',
      'Su ataque característico Esfera Aural nunca falla el blanco.',
      'Fue un miembro clave del equipo campeón de Ash Ketchum.'
    ],
    funFact: '¡Puede detectar la presencia de una persona a más de un kilómetro de distancia mediante su aura!'
  },
  greninja: {
    story: 'Greninja es el Pokémon Ninja de Kalos. Es uno de los Pokémon más populares de la historia.',
    biology: 'Crea shurikens de agua comprimida capaces de cortar el acero. Se mueve en silencio absoluto.',
    trivia: [
      'Formó con Ash Ketchum la transformación única "Greninja de Ash".',
      'Fue votado como el Pokémon #1 más popular del mundo en 2020.',
      'Su lengua le sirve como bufanda táctica en combate.'
    ],
    funFact: '¡Comprime el agua hasta hacerla tan dura que puede partir rocas por la mitad!'
  }
};

export function getPokemonLore(pokemonName: string, types: string[]): PokemonLore {
  const rawName = (pokemonName || '').toLowerCase();
  
  // Clean special characters and bracket expressions like "(fusionado)", "(crowned)", "form", etc.
  const cleanName = rawName
    .replace(/\(.*\)/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();

  // Search by exact or fuzzy matching keys in POKEMON_LORE_DATABASE
  for (const [key, lore] of Object.entries(POKEMON_LORE_DATABASE)) {
    if (cleanName.includes(key) || key.includes(cleanName) || rawName.includes(key)) {
      return lore;
    }
  }

  // Fallback for species without custom lore: authentic species summary without generic fillers
  const typesFormatted = types.map((t) => t.toUpperCase()).join(' y ');
  const displayName = pokemonName.replace(/\(.*\)/g, '').trim();

  return {
    story: `${displayName} es una especie emblemática de la franquicia Pokémon de tipo ${typesFormatted}. En la saga oficial de videojuegos desarrollada por Game Freak y Nintendo, forma parte indispensable de la enciclopedia Pokédex regional y destaca por su biología única y conjunto de habilidades en combate.`,
    biology: `Como criatura de tipo ${typesFormatted}, su organismo canaliza la energía elemental de su entorno para defenderse, desenvolverse en su hábitat y desatar ataques cargados durante los combates de Liga.`,
    trivia: [
      `En los videojuegos principales de Pokémon (Game Boy, Nintendo DS, Switch), aprende movimientos insignia de tipo ${typesFormatted} por nivel y MT.`,
      `Es una especie documentada oficialmente en la Pokédex de la franquicia.`,
      `Ha participado en combates oficiales dentro de la serie animada y mangas de Pokémon.`
    ],
    funFact: `¡En las enciclopedias oficiales, los entrenadores destacan a ${displayName} por su versatilidad táctica y poder elemental de tipo ${typesFormatted}!`
  };
}
