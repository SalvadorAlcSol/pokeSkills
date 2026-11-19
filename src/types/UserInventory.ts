export interface UserPokemon {
  id: string; // UUID
  speciesId: string; // Corresponds to the slug in fullPogoDatabase
  name: string;
  nickname?: string;
  cp: number;
  level: number;
  ivAtk: number;
  ivDef: number;
  ivHp: number;
  fastMove: string;
  chargedMove1: string;
  chargedMove2?: string;
  isShadow: boolean;
  isPurified: boolean;
  isShiny?: boolean;
  isFavorite: boolean;
  canMegaEvolve?: boolean;
  unlockedMegaForm?: string; // Form ID e.g. 'mega_mewtwo_x', 'mega_mewtwo_y', 'mega_rayquaza', 'primal_kyogre'
  megaLevel?: number; // 0: None/Unlocked, 1: Base (Level 1), 2: High (Level 2), 3: Max (Level 3)
  megaEnergy?: number; // Cantidad de Megaenergía / Caramelos Mega disponibles de la especie
  megaEvolveCost?: number; // Costo actual que muestra el botón MegaEvolucionar (0-80 si ya tiene Mega; 100-400 si es 1ª vez)
  candy?: number; // Cantidad de caramelos normales de la especie
  candyXl?: number; // Cantidad de caramelos ++ (XL) de la especie
  buddyLevel?: 0 | 1 | 2 | 3 | 4; // 0: Sin compañero, 1: Buen, 2: Gran, 3: Ultra, 4: Mejor Compañero (Best Buddy)
  isBestBuddy?: boolean; // True si ya alcanzó el nivel máximo de Mejor Compañero (cinta / Nivel 4)
  caughtDate?: string; // e.g. '2026-08-06'
  caughtLocation?: string; // e.g. 'Monterrey, Mexico'
  isDynamax?: boolean; // True si tiene factor Dinamax
  isGigantamax?: boolean; // True si tiene factor Gigamax (G-Max)
  maxAttackMove?: string; // Nombre del ataque Max o G-Max
  maxAttackLevel?: 1 | 2 | 3; // Nivel del Ataque Max / G-Max (1, 2 o 3 / MAX)
  maxGuardLevel?: 0 | 1 | 2 | 3; // Nivel de Maxibarrera / Max Guard (0 = Bloqueado, 1-3 = Nivel)
  maxSpiritLevel?: 0 | 1 | 2 | 3; // Nivel de Maxiespíritu / Max Spirit (0 = Bloqueado, 1-3 = Nivel)
  isLucky?: boolean; // Pokémon Con Suerte
  // Metadata for filtering
  addedAt: number;
}
