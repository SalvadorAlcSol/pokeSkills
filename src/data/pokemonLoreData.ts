export interface PokemonLore {
  story: string;
  biology: string;
  trivia: string[];
  funFact: string;
}

export const POKEMON_LORE_DATABASE: Record<string, PokemonLore> = {
  // --- GEN 1 KANTO LEGENDARIES & MYTHICALS ---
  articuno: {
    story: 'Articuno es el Pokémon Congelación legendario de Kanto. Se dice que sus alas hechas de hielo puro enfrían el aire provocando nevadas a su paso.',
    biology: 'Vuela por los picos de las montañas nevadas. Guía a los montañistas perdidos en las ventiscas hacia refugios seguros.',
    trivia: [
      'Es el ave legendaria representativa del Equipo Sabiduría (Team Mystic) en Pokémon GO.',
      'Posee una forma regional en Galar de tipo Psíquico/Volador con mirada hipnótica.',
      'En el anime, el Charizard de Ash derrotó a un Articuno salvaje en la Fábrica de la Batalla.'
    ],
    funFact: '¡Al batir sus alas transparentes congeladas, crea ráfagas de nieve y hace caer la temperatura ambiente al instante!'
  },
  zapdos: {
    story: 'Zapdos es el Pokémon Eléctrico legendario de Kanto. Vive en las nubes de tormenta y desata rayos cuando cae sobre la tierra.',
    biology: 'Gana energía cuando es alcanzado por rayos estelares. Cuando vuela, sus plumas chasquean desprendiendo chispas de alta tensión.',
    trivia: [
      'Es el ave legendaria representativa del Equipo Instinto (Team Instinct) en Pokémon GO.',
      'Posee una forma regional en Galar de tipo Lucha/Volador que corre a velocidad supersónica.',
      'En los juegos originales de Kanto, habitaba en el fondo de la Central Energía abandonada.'
    ],
    funFact: '¡Se dice que habita dentro de nubes de tormenta gigantescas y solo desciende a la tierra cuando cae un rayo!'
  },
  moltres: {
    story: 'Moltres es el Pokémon Llama legendario de Kanto. Con el batir de sus alas envueltas en fuego, anuncia el inicio de una primavera cálida.',
    biology: 'Si resulta herido en combate, se sumerge en el magma hirviente de un volcán para sanar sus heridas y regenerar sus plumas.',
    trivia: [
      'Es el ave legendaria representativa del Equipo Valor (Team Valor) en Pokémon GO.',
      'Posee una forma regional en Galar de tipo Siniestro/Volador cargada de aura malévola.',
      'Es la antorcha oficial que enciende el fuego sagrado de la Liga Pokémon de Kanto.'
    ],
    funFact: '¡Basta con que una persona contemple el vuelo ardiente de Moltres para renovar su alegría y esperanza!'
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
    story: 'Mew es el Pokémon Mítico ancestral que posee el código genético de todos los Pokémon existentes. Es considerado el ancestro de la vida Pokémon.',
    biology: 'Es capaz de volverse invisible a voluntad y posee la habilidad de aprender cualquier movimiento existente.',
    trivia: [
      'Fue creado por el programador Shigeki Morimoto como un secreto en el código de Pokémon Rojo y Verde.',
      'En la película "Mewtwo vs. Mew", demostró un poder infinito pero una naturaleza juguetona.',
      'Puede transformarse en cualquier otro Pokémon.'
    ],
    funFact: '¡Se dice que solo se muestra ante personas que poseen un corazón puro e inocente!'
  },

  // --- GEN 2 JOHTO LEGENDARIES ---
  hooh: {
    story: 'Ho-Oh es el Pokémon Arcoíris legendario de Johto. Reside en los cielos y deja tras de sí una estela de siete colores al volar.',
    biology: 'Hace mil años resucitó a tres Pokémon sin nombre que perecieron en el incendio de la Torre Quemada, convirtiéndolos en Raikou, Entei y Suicune.',
    trivia: [
      'Fue el primer Pokémon legendario mostrado en el primer episodio del anime en 1997 antes de la Gen 2.',
      'Su pluma Pluma Arcoíris concede la felicidad eterna a quien la posee.',
      'Su ataque insignia es Fuego Sagrado (Sacred Fire), de tipo Fuego con alta probabilidad de quemar.'
    ],
    funFact: '¡Apareció ante Ash Ketchum en el mismísimo primer episodio del anime cruzando un arcoíris en el cielo!'
  },
  lugia: {
    story: 'Lugia es el Pokémon Buceo legendario de Johto y guardián de los mares. Posee una fuerza tan inmensa que un simple aleteo puede provocar tempestades de 40 días.',
    biology: 'Habita en las profundidades de las Islas Remolino. Duerme en el fondo del mar para mantener bajo control su desbordante poder destructivo.',
    trivia: [
      'Fue el protagonista de la célebre película "Pokémon 2000: El Poder de Uno", calmando la furia de las tres aves legendarias.',
      'Es considerado el guardián pacificador de los mares.',
      'Su ataque característico es Aerochorro (Aeroblast).'
    ],
    funFact: '¡Prefiere dormir en la fosa más profunda del océano porque un solo movimiento de sus alas causa tormentas de 40 días!'
  },
  raikou: {
    story: 'Raikou es el Pokémon Trueno legendario de Johto. Nació de la energía de un rayo caído durante el incendio de la Torre Quemada y fue resucitado por Ho-Oh.',
    biology: 'Lleva una nube de tormenta morada en el lomo. Emite un rugido retumbante que sacude la tierra como un trueno.',
    trivia: [
      'Protagonizó la película espacial "Pokémon: La Leyenda del Trueno".',
      'Corre por las praderas a la velocidad del rayo.',
      'Posee una variante Paradoja del pasado en Paldea llamada Electrofuria (Raging Bolt).'
    ],
    funFact: '¡Su rugido hace retumbar el suelo exactamente igual que el impacto directo de un rayo!'
  },
  entei: {
    story: 'Entei es el Pokémon Volcán legendario de Johto. Nació de las llamas purificadoras de la Torre Quemada tras ser resucitado por Ho-Oh.',
    biology: 'Se dice que cada vez que Entei ruge, un volcán entra en erupción en algún rincón del mundo.',
    trivia: [
      'Fue el protagonista de la tercera película "El Hechizo de los Unown" como el protector ilusorio de Molly.',
      'Posee una variante Paradoja ancestral llamada Flamariete (Gouging Fire).',
      'Recorre el mundo sin descansar soltando llamaradas incandescentes.'
    ],
    funFact: '¡Se dice que cada vez que lanza un rugido potente, entra en erupción un volcán en alguna parte del planeta!'
  },
  suicune: {
    story: 'Suicune es el Pokémon Aurora legendario de Johto. Personifica los vientos del norte y la pureza del agua cristalina.',
    biology: 'Tiene el poder instantáneo de purificar cualquier cuerpo de agua contaminada con solo tocarla con sus patas.',
    trivia: [
      'Fue el Pokémon mascota oficial de Pokémon Cristal en Game Boy Color.',
      'Fue perseguido durante años por el entrenador Eusine en el anime y juegos.',
      'Posee una variante Paradoja ancestral en Paldea llamada Ondulagua (Walking Wake).'
    ],
    funFact: '¡Tiene la capacidad milagrosa de purificar al instante cualquier agua sucia con solo rozar la superficie!'
  },
  celebi: {
    story: 'Celebi es el Pokémon Viajetiempo mítico de Johto y guardián de los bosques ancestrales.',
    biology: 'Viaja libremente a través del tiempo. Mientras Celebi aparezca en los bosques, el futuro del mundo estará lleno de vida y vegetación.',
    trivia: [
      'Protagonizó la cuarta película "Celebi: La Voz del Bosque".',
      'Su presencia hace florecer plantas y árboles marchitos al instante.',
      'En Pokémon Cristal, se obtenía mediante la GS Ball en el Encinar.'
    ],
    funFact: '¡Allí donde aparece Celebi, los árboles crecen exuberantes y el bosque se llena de vida pura!'
  },

  // --- GEN 3 HOENN LEGENDARIES & MYTHICALS ---
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
  latios: {
    story: 'Latios es el Pokémon Eón legendario de Hoenn de tipo Dragón/Psíquico. Posee una gran inteligencia y compresión humana.',
    biology: 'Pliega sus alas aerodinámicas para volar más rápido que un avión de reacción a reacción supersónico.',
    trivia: [
      'Protagonizó la película "Héroes Pokémon" en Alto Mare protegiendo la Joya del Alma.',
      'Posee una Megaevolución (Mega Latios) combinada con Latias.',
      'Puede mostrar a otros lo que él ve mediante la visión compartida.'
    ],
    funFact: '¡Vuela más rápido que un avión jet replegando sus alas para reducir la fricción del aire!'
  },
  latias: {
    story: 'Latias es la Pokémon Eón legendaria de Hoenn de tipo Dragón/Psíquico. Es sumamente sensible a las emociones humanas.',
    biology: 'Su cuerpo está cubierto de un plumón cristalino que refracta la luz, permitiéndole volverse completamente invisible.',
    trivia: [
      'En la película "Héroes Pokémon", adoptaba la forma de una chica humana llamada Bianca.',
      'Posee Megaevolución (Mega Latias).',
      'Se comunica telepáticamente con los entrenadores de corazón noble.'
    ],
    funFact: '¡Refracta la luz en sus plumas cristalinas para hacerse completamente invisible a la vista!'
  },
  jirachi: {
    story: 'Jirachi es el Pokémon Deseo mítico de Hoenn. Despierta de su letargo de mil años durante solo siete días cuando el Cometa Milenario brilla.',
    biology: 'Posee un tercer ojo en el vientre llamado el "Ojo Verdadero". Cumple cualquier deseo escrito en las notas de su cabeza.',
    trivia: [
      'Protagonizó la película "Jirachi y los Deseos".',
      'Concede deseos durante la semana festiva del Cometa Milenario.',
      'Su movimiento característico es Deseo Oculto (Doom Desire).'
    ],
    funFact: '¡Solo despierta 7 días cada 1,000 años cuando el Cometa Milenario cruza el cielo nocturno!'
  },
  deoxys: {
    story: 'Deoxys es el Pokémon ADN mítico de Hoenn. Nació a partir de un virus alienígena espacial expuesto a un rayo láser de laboratorio.',
    biology: 'Su órgano cristalino cerebral le permite cambiar libremente entre 4 formas: Ataque, Defensa, Velocidad y Normal.',
    trivia: [
      'Fue el primer Pokémon con formas alternativas dinámicas intercambiables.',
      'Protagonizó la película "El Destino de Deoxys".',
      'En Pokémon Rastro de la Luna / Alfa Zafiro, se combate en el espacio en el Episodio Delta.'
    ],
    funFact: '¡Es una forma de vida extraterrestre nacida de un virus espacial mutado por radiación láser!'
  },

  // --- GEN 4 SINNOH LEGENDARIES & MYTHICALS ---
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
    story: 'Palkia es el Pokémon Legendario de Sinnoh que gobierna el espacio. Su respiración estabiliza la estructura y volumen de las dimensiones.',
    biology: 'Habita en una dimensión paralela entre las grietas del espacio. Puede rasgar la estructura espacial para teletransportar materia.',
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
      'Su movimiento característico es Golpe Umbrío (Shadow Force).',
      'Es el tercer integrante del Trío de la Creación de Sinnoh junto a Dialga y Palkia.',
      'En Pokémon Platino, arrastra al antagonista Helio al Mundo Distorsión.'
    ],
    funFact: '¡En su mundo de origen, la gravedad no existe y el agua fluye hacia el cielo!'
  },
  arceus: {
    story: 'Arceus es el Pokémon Alfa mítico de Sinnoh. Según la mitología ancestral, nació de un huevo en medio del caos primigenio y moldeo el universo entero con sus mil brazos.',
    biology: 'Posee la habilidad Multitipo. Al equipar cualquiera de las tablas elementales, su tipo y su ataque Sentencia cambian dinámicamente.',
    trivia: [
      'Es considerado el dios creador del universo Pokémon.',
      'Protagonizó el juego galardonado "Pokémon Leyendas: Arceus".',
      'Su ataque exclusivo es Sentencia (Judgment).'
    ],
    funFact: '¡La mitología cuenta que creó el universo entero con sus mil brazos antes de que existiera la materia!'
  },
  darkrai: {
    story: 'Darkrai es el Pokémon Oscuridad mítico de Sinnoh. Habita en las sombras y causa pesadillas terribles e incesantes a quienes duermen cerca.',
    biology: 'No provoca pesadillas por malicia, sino como un mecanismo instintivo de autodefensa cuando se siente amenazado.',
    trivia: [
      'Protagonizó la película "Dialga vs. Palkia vs. Darkrai" protegiendo los jardines de Ciudad Álamos.',
      'Su ataque característico es Brecha Negra (Dark Void), que adormece a los enemigos.',
      'Es el contraparte directa del Pokémon lunar Cresselia.'
    ],
    funFact: '¡Provoca pesadillas horripilantes sin querer solo para defender su territorio cuando alguien duerme cerca!'
  },
  cresselia: {
    story: 'Cresselia es el Pokémon Creciente legendario de Sinnoh. Representa la luna creciente y la esperanza que disipa la oscuridad.',
    biology: 'Vuela desprendiendo velos de luz brillante. Sus Plumas Lunares cura las pesadillas provocadas por Darkrai.',
    trivia: [
      'Habita en la Isla Plenilunio en la región de Sinnoh.',
      'Es uno de los Pokémon defensivos más cotizados en la Liga de Combates PvP.',
      'Disipa los malos sueños trayendo calma y sueños apacibles.'
    ],
    funFact: '¡Sus plumas brillantes curan al instante las peores pesadillas nocturnas traídas por las sombras!'
  },
  regigigas: {
    story: 'Regigigas es el Pokémon Colosal legendario de Sinnoh. Dice la leyenda que ató cuerdas a los continentes y los arrastró a través de los océanos para formar el mapa del mundo.',
    biology: 'Creó a los cinco titanes Regirock, Regice, Registeel, Regieleki y Regidrago a partir de arcilla, hielo, hierro, electricidad y magma dragónico.',
    trivia: [
      'En los juegos posee la habilidad Inicio Lento (Slow Start) que reduce sus stats los primeros 5 turnos.',
      'Duerme en el Templo de Puntaneva encadenado en piedra.',
      'Su fuerza física no tiene rival en el mundo Pokémon.'
    ],
    funFact: '¡Arrastró continentes enteros con gruesas sogas para dar forma a la geografía del planeta!'
  },

  // --- GEN 5 UNOVA LEGENDARIES & MYTHICALS ---
  reshiram: {
    story: 'Reshiram es el Pokémon Blanco Verídico de Teselia (Unova). Nació cuando el Dragón Único se dividió entre los príncipes gemelos de la antigüedad, eligiendo al hermano que buscaba la Verdad.',
    biology: 'Su cola es una turbina de combustión interna que puede abrasar el mundo entero con llamas blancas y alterar el clima del planeta.',
    trivia: [
      'Su movimiento característico es Llama Fusión (Fusion Flare) y Llama Azul (Blue Flare).',
      'En el anime, protagonizó la película "Pokémon: Blanco - Victini y Zekrom / Negro - Victini y Reshiram".',
      'Vuela envolviendo los cielos en resplandores de fuego blanco deslumbrante.'
    ],
    funFact: '¡Cuando vuela a toda velocidad, el calor expulsado por su cola mueve las masas de aire del planeta!'
  },
  zekrom: {
    story: 'Zekrom es el Pokémon Negro Ideales de Teselia (Unova). Se escindió del Dragón Único para apoyar al hermano gemelo que luchaba por los Ideales.',
    biology: 'El generador en forma de cono de su cola produce cantidades ilimitadas de electricidad. Oculta su cuerpo dentro de nubes de tormenta oscuras.',
    trivia: [
      'Sus movimientos característicos son Rayo Fusión (Fusion Bolt) y Ataque Fulgor (Bolt Strike).',
      'Posee la habilidad Terravoltio, que le permite ignorar las habilidades defensivas enemigas.',
      'En Pokémon Negro y Blanco, N invoca a Zekrom en el Palacio para desafiar al Campeón Mirto.'
    ],
    funFact: '¡Su cola gira como una gigantesca turbina de alta tensión capaz de electrocutar continentes!'
  },
  victini: {
    story: 'Victini es el Pokémon Victoria mítico de Teselia. Se dice que el entrenador que lleve a Victini consigo ganará cualquier combate sin importar el rival.',
    biology: 'Produce una cantidad ilimitada de energía en su cuerpo. Comparte esa energía al tocar a otras personas o Pokémon, llenándolos de fuerza sobrehumana.',
    trivia: [
      'Ocupa el número #000 en la Pokédex regional de Teselia (el único Pokémon con número 0).',
      'Su movimiento característico es V de Fuego (V-create), el ataque de mayor potencia fija (180).',
      'Habita en el Faro Libertad en la región de Teselia.'
    ],
    funFact: '¡Ocupa el puesto #000 en la Pokédex de Teselia y garantiza la victoria a quien luche a su lado!'
  },
  keldeo: {
    story: 'Keldeo es el Pokémon Potro mítico de Teselia. Es el cuarto integrante y aprendiz de los Espadachines Místicos (Cobalion, Terrakion y Virizion).',
    biology: 'Al aprender el movimiento Espada Santa y fortalecer su convicción, cambia a su Forma Brío con un cuerno resplandeciente.',
    trivia: [
      'Protagonizó la película "Kyurem vs. el Espadachín Místico (Keldeo)".',
      'Dispara chorros de agua a alta presión desde sus cascos para impulsarse flotando en el agua.',
      'Entrenó rigurosamente para dominar la técnica de los Espadachines Místicos.'
    ],
    funFact: '¡Dispara chorros de agua hirviente por las pezuñas para deslizarse y saltar por encima de los mares!'
  },
  genesect: {
    story: 'Genesect es el Pokémon Paleozoico mítico de Teselia. Fue un depredador anciano de hace 300 millones de años resucitado y modificado cibernéticamente por el Equipo Plasma.',
    biology: 'El Equipo Plasma instaló un cañón láser de alta tecnología en su lomo. Cambia el tipo elemental de su ataque Tecno Impacto insertando distintos cartuchos.',
    trivia: [
      'Protagonizó la película "Genesect y el Despertar de una Leyenda" combatiendo contra Mewtwo.',
      'Se pliega sobre sí mismo adoptando la forma de una nave voladora de alta velocidad.',
      'Existen 5 formas según el cartucho (Normal, Hidro, Fulgor, Piro, Crio).'
    ],
    funFact: '¡Fue resucitado de un fósil de hace 300 millones de años y equipado con un cañón láser por el Equipo Plasma!'
  },

  // --- GEN 6 KALOS LEGENDARIES ---
  xerneas: {
    story: 'Xerneas es el Pokémon Creación legendario de Kalos de tipo Hada puro. Se dice que puede otorgar la vida eterna.',
    biology: 'Cuando sus cuernos brillan en ocho colores celestiales, libera la energía de la vida. Al finalizar su ciclo de vida, se transforma en un árbol milenario.',
    trivia: [
      'Es el Pokémon insignia de Pokémon X en Nintendo 3DS.',
      'Su ataque característico Geocontrol (Geomancy) aumenta drásticamente sus estadísticas.',
      'Su habilidad Aura Hada potencia los ataques de tipo Hada de todos los combatientes.'
    ],
    funFact: '¡Sus cuernos brillan en 8 colores deslumbrantes cuando otorga vitalidad y vida eterna a los seres vivos!'
  },
  yveltal: {
    story: 'Yveltal es el Pokémon Destrucción legendario de Kalos de tipo Siniestro/Volador.',
    biology: 'Cuando sus plumas y alas se vuelven rojas y negras, absorbe la energía vital de todos los seres vivos a su alrededor. Al morir, se transforma en un capullo protector.',
    trivia: [
      'Es el Pokémon insignia de Pokémon Y.',
      'Su movimiento característico Ala Mortífera (Oblivion Wing) absorbe la salud del enemigo.',
      'Entra en un letargo de mil años encerrado en una crisálida oscura.'
    ],
    funFact: '¡Al llegar al final de su vida, absorbe toda la fuerza vital del entorno y se encierra en un capullo de mil años!'
  },
  zygarde: {
    story: 'Zygarde es el Pokémon Equilibrio legendario de Kalos y Alola de tipo Dragón/Tierra.',
    biology: 'Monitorea el ecosistema del planeta entero mediante sus Células y Núcleos dispersos. Al reunirlos todos, adopta su Forma Completa (100%) con un poder abrumador.',
    trivia: [
      'Posee 4 formas: Célula, Núcleo, Forma 10% (Perro), Forma 50% (Serpiente) y Forma Completa 100% (Titán).',
      'Su habilidad Agrupamiento activa la Forma Completa cuando sus PS bajan a la mitad.',
      'Sus ataques insignia son Fuerza Geotérmica y Núcleo Castigo.'
    ],
    funFact: '¡Se compone de cientos de diminutas Células repartidas por todo el planeta que se unen para salvar el ecosistema!'
  },

  // --- GEN 7 ALOLA & GEN 8 GALAR & GEN 9 PALDEA ---
  koraidon: {
    story: 'Koraidon es el Pokémon Paradoja ancestral de Paldea (Gen 9). Es conocido en la antigüedad como las "Alas del Rey" y es el antepasado remoto de Cyclizar.',
    biology: 'En su Forma Construcción corre a toda velocidad apoyándose sobre sus patas mientras la rueda pectoral actúa como flotador. Libera un sol abrasador al saltar a luchar.',
    trivia: [
      'Es el Pokémon insignia de Pokémon Escarlata.',
      'Su habilidad Oricalco Pulsante invoca un Sol Abrasador y aumenta su Ataque.',
      'Su ataque exclusivo es Choque Colisionador (Collision Course).'
    ],
    funFact: '¡A pesar de tener ruedas gigantes en el pecho, corre sobre cuatro patas usando la rueda frontal como flotador de impacto!'
  },
  miraidon: {
    story: 'Miraidon es el Pokémon Paradoja futurista de Paldea (Gen 9). Es conocido en la era futura como el "Sertor de Serpientes" y es el descendiente cibernético de Cyclizar.',
    biology: 'Sus extremidades inferiores se transforman en propulsores jet flotantes de alta energía eléctrica. Su cuerpo está compuesto de aleaciones metálicas cósmicas.',
    trivia: [
      'Es el Pokémon insignia de Pokémon Púrpura.',
      'Su habilidad Motor Hadrónico crea un Campo Eléctrico al entrar y potencia su Ataque Especial.',
      'Su ataque exclusivo es Carga Parabólica / Rayo Electroderrape (Electro Drift).'
    ],
    funFact: '¡Flota sobre propulsores jet cibernéticos de plasma impulsados por energía cuántica!'
  }
};

export function getPokemonLore(pokemonName: string, types: string[]): PokemonLore {
  const rawName = (pokemonName || '').toLowerCase();
  
  // Clean special characters, numbers, and bracket expressions like "(fusionado)", "(crowned)", "form", etc.
  const cleanName = rawName
    .replace(/\(.*\)/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();

  // 1. Direct or partial matching keys in POKEMON_LORE_DATABASE
  for (const [key, lore] of Object.entries(POKEMON_LORE_DATABASE)) {
    if (cleanName.includes(key) || key.includes(cleanName) || rawName.includes(key)) {
      return lore;
    }
  }

  // 2. Specific alias mappings (e.g., "hooh" -> "hooh", "palkia" -> "palkia", "reshiram" -> "reshiram")
  if (cleanName.includes('hooh') || cleanName.includes('ho-oh') || cleanName.includes('ho oh')) {
    return POKEMON_LORE_DATABASE.hooh;
  }
  if (cleanName.includes('palkia')) {
    return POKEMON_LORE_DATABASE.palkia;
  }
  if (cleanName.includes('reshiram')) {
    return POKEMON_LORE_DATABASE.reshiram;
  }

  // 3. Fallback for species without explicit lore: clean, non-generic summary
  const typesFormatted = types.map((t) => t.toUpperCase()).join(' y ');
  const displayName = pokemonName.replace(/\(.*\)/g, '').trim();

  return {
    story: `${displayName} es una especie emblemática registrada oficialmente en la Pokédex de la franquicia Pokémon de tipo ${typesFormatted}. En la historia y saga de videojuegos principales desarrollados por Game Freak y Nintendo, destaca por su biología elemental y su papel en las distintas regiones.`,
    biology: `Como criatura de tipo ${typesFormatted}, su organismo canaliza la energía de su entorno para desenvolverse en su hábitat natural y desatar potentes ataques cargados durante los combates de Liga.`,
    trivia: [
      `En los videojuegos principales de la franquicia (Game Boy, DS, Switch), aprende potentes ataques de tipo ${typesFormatted} por nivel y MT.`,
      `Es una especie documentada en las enciclopedias Pokédex regionales oficiales.`,
      `Ha formado parte de combates y eventos destacados en la serie animada y manga de Pokémon.`
    ],
    funFact: `¡En las enciclopedias Pokédex, los entrenadores destacan a ${displayName} por su versatilidad táctica y poder de tipo ${typesFormatted}!`
  };
}
