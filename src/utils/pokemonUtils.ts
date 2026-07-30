import { POGO_DATABASE } from '../data/pogoDatabase';

export function getSpecialFormSpriteUrl(speciesId: string): string {
  if (!speciesId) {
    return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';
  }

  const cleanId = speciesId.toLowerCase().trim();

  // 1. Check in POGO_DATABASE
  for (const p of POGO_DATABASE) {
    if (p.id.toString() === cleanId || p.name.toLowerCase() === cleanId || p.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === cleanId) {
      return p.spriteUrl;
    }
    const forms = p.specialForms || p.megaForms;
    if (forms) {
      for (const f of forms) {
        if (
          f.id.toLowerCase() === cleanId ||
          f.name.toLowerCase() === cleanId ||
          f.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === cleanId ||
          `${p.id}-${f.id}`.toLowerCase() === cleanId
        ) {
          return f.spriteUrl;
        }
      }
    }
  }

  // 2. Fallback to Pokemondb sprite URL
  const formattedSlug = cleanId.replace(/[\s_]+/g, '-');
  return `https://img.pokemondb.net/sprites/pokemon-go/normal/${formattedSlug}.jpg`;
}

export interface ResolvedPogoPokemon {
  speciesId: string;
  displayName: string;
  baseAttack: number;
  baseDefense: number;
  baseStamina: number;
  spriteUrl: string;
  fastMoves: string[];
  chargedMoves: string[];
  isMegaUnlocked?: boolean;
  unlockedMegaFormId?: string;
}

/**
 * Resolves raw Pokemon name and form (e.g. "Palkia", "Origin" or "Necrozma (Dusk Mane)")
 * to exact POGO_DATABASE base or special form stats and spriteUrl.
 */
export function resolvePogoSpeciesAndForm(rawName: string, rawForm: string = ''): ResolvedPogoPokemon {
  const combined = `${rawName} ${rawForm}`.toLowerCase().replace(/[\(\)]/g, ' ').trim();
  const cleanCombined = combined.replace(/[^a-z0-9]/g, '');

  // First pass: Exact species match
  const exactPoke = POGO_DATABASE.find((p) => {
    const cleanBaseName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleanCombined === cleanBaseName || cleanCombined.startsWith(`${cleanBaseName}-`);
  });

  if (exactPoke) {
    const fMoves = exactPoke.fastMoves.map((m) => m.name);
    const cMoves = exactPoke.chargedMoves.map((m) => m.name);

    const forms = exactPoke.specialForms || exactPoke.megaForms;
    if (forms) {
      for (const f of forms) {
        const formName = f.name.toLowerCase();
        const cleanFormName = formName.replace(/[^a-z0-9]/g, '');
        const formId = f.id.toLowerCase().replace(/[^a-z0-9]/g, '');
        const isMegaOrPrimal = f.category === 'mega' || f.category === 'primal' || formId.includes('mega') || formId.includes('primal');

        if (
          cleanCombined.includes(cleanFormName) ||
          cleanCombined.includes(formId) ||
          (cleanCombined.includes('mega') && (formId.includes('mega') || f.category === 'mega')) ||
          ((cleanCombined.includes('primal') || cleanCombined.includes('primigenio')) && (formId.includes('primal') || f.category === 'primal'))
        ) {
          const formFMoves = f.fastMoves && f.fastMoves.length > 0 ? f.fastMoves.map((m) => m.name) : fMoves;
          const formCMoves = f.chargedMoves && f.chargedMoves.length > 0 ? f.chargedMoves.map((m) => m.name) : cMoves;

          if (isMegaOrPrimal) {
            return {
              speciesId: `${exactPoke.id}`,
              displayName: exactPoke.name,
              baseAttack: exactPoke.baseAttack,
              baseDefense: exactPoke.baseDefense,
              baseStamina: exactPoke.baseStamina,
              spriteUrl: exactPoke.spriteUrl,
              fastMoves: formFMoves,
              chargedMoves: formCMoves,
              isMegaUnlocked: true,
              unlockedMegaFormId: f.id,
            };
          }
          return {
            speciesId: `${exactPoke.id}-${f.id}`,
            displayName: f.name,
            baseAttack: f.baseAttack,
            baseDefense: f.baseDefense,
            baseStamina: f.baseStamina,
            spriteUrl: f.spriteUrl,
            fastMoves: formFMoves,
            chargedMoves: formCMoves,
          };
        }
      }
    }
    return {
      speciesId: `${exactPoke.id}`,
      displayName: exactPoke.name,
      baseAttack: exactPoke.baseAttack,
      baseDefense: exactPoke.baseDefense,
      baseStamina: exactPoke.baseStamina,
      spriteUrl: exactPoke.spriteUrl,
      fastMoves: fMoves,
      chargedMoves: cMoves,
    };
  }

  // Second pass: Fuzzy / Substring match
  for (const p of POGO_DATABASE) {
    const baseName = p.name.toLowerCase();
    const cleanBaseName = baseName.replace(/[^a-z0-9]/g, '');

    if (cleanCombined.includes(cleanBaseName)) {
      const fMoves = p.fastMoves.map((m) => m.name);
      const cMoves = p.chargedMoves.map((m) => m.name);

      const forms = p.specialForms || p.megaForms;
      if (forms) {
        for (const f of forms) {
          const formName = f.name.toLowerCase();
          const cleanFormName = formName.replace(/[^a-z0-9]/g, '');
          const formId = f.id.toLowerCase().replace(/[^a-z0-9]/g, '');

          const isMegaOrPrimal = f.category === 'mega' || f.category === 'primal' || formId.includes('mega') || formId.includes('primal');

          if (
            cleanCombined.includes(cleanFormName) ||
            cleanCombined.includes(formId) ||
            (cleanCombined.includes('origin') && (formId.includes('origin') || formName.includes('origen') || formName.includes('origin'))) ||
            (cleanCombined.includes('origen') && (formId.includes('origin') || formName.includes('origen') || formName.includes('origin'))) ||
            (cleanCombined.includes('dusk') && formId.includes('dusk')) ||
            (cleanCombined.includes('melena') && formId.includes('dusk')) ||
            (cleanCombined.includes('dawn') && formId.includes('dawn')) ||
            (cleanCombined.includes('alba') && formId.includes('dawn')) ||
            (cleanCombined.includes('black') && formId.includes('black')) ||
            (cleanCombined.includes('negro') && formId.includes('black')) ||
            (cleanCombined.includes('white') && formId.includes('white')) ||
            (cleanCombined.includes('blanco') && formId.includes('white')) ||
            (cleanCombined.includes('mega') && (formId.includes('mega') || f.category === 'mega')) ||
            ((cleanCombined.includes('primal') || cleanCombined.includes('primigenio')) && (formId.includes('primal') || f.category === 'primal'))
          ) {
            const formFMoves = f.fastMoves && f.fastMoves.length > 0 ? f.fastMoves.map((m) => m.name) : fMoves;
            const formCMoves = f.chargedMoves && f.chargedMoves.length > 0 ? f.chargedMoves.map((m) => m.name) : cMoves;

            if (isMegaOrPrimal) {
              return {
                speciesId: `${p.id}`,
                displayName: p.name,
                baseAttack: p.baseAttack,
                baseDefense: p.baseDefense,
                baseStamina: p.baseStamina,
                spriteUrl: p.spriteUrl,
                fastMoves: formFMoves,
                chargedMoves: formCMoves,
                isMegaUnlocked: true,
                unlockedMegaFormId: f.id,
              };
            }

            return {
              speciesId: `${p.id}-${f.id}`,
              displayName: f.name,
              baseAttack: f.baseAttack,
              baseDefense: f.baseDefense,
              baseStamina: f.baseStamina,
              spriteUrl: f.spriteUrl,
              fastMoves: formFMoves,
              chargedMoves: formCMoves,
            };
          }
        }
      }

      return {
        speciesId: `${p.id}`,
        displayName: p.name,
        baseAttack: p.baseAttack,
        baseDefense: p.baseDefense,
        baseStamina: p.baseStamina,
        spriteUrl: p.spriteUrl,
        fastMoves: fMoves,
        chargedMoves: cMoves,
      };
    }
  }

  const slug = rawName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return {
    speciesId: slug,
    displayName: rawName,
    baseAttack: 200,
    baseDefense: 200,
    baseStamina: 200,
    spriteUrl: `https://img.pokemondb.net/sprites/pokemon-go/normal/${slug}.jpg`,
    fastMoves: [],
    chargedMoves: [],
  };
}

/**
 * Gets available Mega/Primal forms for a given species ID or name.
 * Deduplicates entries in database (e.g. Primal Kyogre vs Kyogre Primigenio).
 */
export function getMegaFormsForPokemon(speciesId: string, name: string) {
  const dbPoke = POGO_DATABASE.find(
    (p) =>
      p.id.toString() === speciesId ||
      speciesId.startsWith(`${p.id}-`) ||
      p.name.toLowerCase() === name.toLowerCase()
  );
  if (!dbPoke) return [];
  const forms = dbPoke.specialForms || dbPoke.megaForms;
  if (!forms) return [];

  const megaForms = forms.filter(
    (f) => f.category === 'mega' || f.category === 'primal' || f.id.includes('mega') || f.id.includes('primal')
  );

  const uniqueForms: typeof megaForms = [];
  const seen = new Set<string>();

  for (const f of megaForms) {
    const fn = f.name.toLowerCase();
    const key = fn.includes('x') ? 'x' : fn.includes('y') ? 'y' : 'main';
    if (!seen.has(key)) {
      seen.add(key);
      uniqueForms.push(f);
    }
  }

  return uniqueForms;
}

export interface AvailableFormOption {
  speciesId: string;
  displayName: string;
  baseAttack: number;
  baseDefense: number;
  baseStamina: number;
  spriteUrl: string;
  fastMoves: string[];
  chargedMoves: string[];
}

/**
 * Returns all permanent form options for a given Pokemon species (base form + special forms like Origin, Dusk Mane, etc.)
 * Excludes temporary Mega/Primal evolutions.
 */
export function getAvailableFormsForSpecies(speciesId: string, name: string): AvailableFormOption[] {
  const dbPoke = POGO_DATABASE.find(
    (p) =>
      p.id.toString() === speciesId ||
      speciesId.startsWith(`${p.id}-`) ||
      p.name.toLowerCase() === name.toLowerCase() ||
      name.toLowerCase().includes(p.name.toLowerCase())
  );

  if (!dbPoke) return [];

  const options: AvailableFormOption[] = [
    {
      speciesId: `${dbPoke.id}`,
      displayName: dbPoke.name,
      baseAttack: dbPoke.baseAttack,
      baseDefense: dbPoke.baseDefense,
      baseStamina: dbPoke.baseStamina,
      spriteUrl: dbPoke.spriteUrl,
      fastMoves: dbPoke.fastMoves.map((m) => m.name),
      chargedMoves: dbPoke.chargedMoves.map((m) => m.name),
    },
  ];

  const forms = dbPoke.specialForms || dbPoke.megaForms;
  if (forms) {
    for (const f of forms) {
      if (f.category !== 'mega' && f.category !== 'primal' && !f.id.includes('mega') && !f.id.includes('primal')) {
        const fFast = f.fastMoves && f.fastMoves.length > 0 ? f.fastMoves : dbPoke.fastMoves;
        const fCharged = f.chargedMoves && f.chargedMoves.length > 0 ? f.chargedMoves : dbPoke.chargedMoves;
        options.push({
          speciesId: `${dbPoke.id}-${f.id}`,
          displayName: f.name,
          baseAttack: f.baseAttack,
          baseDefense: f.baseDefense,
          baseStamina: f.baseStamina,
          spriteUrl: f.spriteUrl,
          fastMoves: fFast.map((m) => m.name),
          chargedMoves: fCharged.map((m) => m.name),
        });
      }
    }
  }

  return options;
}
