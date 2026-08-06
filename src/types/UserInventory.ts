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
  caughtDate?: string; // e.g. '2026-08-06'
  caughtLocation?: string; // e.g. 'Monterrey, Mexico'
  // Metadata for filtering
  addedAt: number;
}
