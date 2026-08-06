import React, { useState } from 'react';
import { UserPokemon } from '../types/UserInventory';
import { Check, Plus, RefreshCw, Calendar, MapPin, Sparkles, AlertCircle, X } from 'lucide-react';
import { getSpanishMoveName } from '../utils/pogoMoveTranslator';

interface DuplicateVerifierProps {
  importedList: Omit<UserPokemon, 'id' | 'addedAt'>[];
  existingInventory: UserPokemon[];
  onConfirm: (finalList: (Omit<UserPokemon, 'id' | 'addedAt'> & { id?: string })[]) => void;
  onCancel: () => void;
}

interface DuplicateItem {
  index: number; // Index in importedList
  incoming: Omit<UserPokemon, 'id' | 'addedAt'>;
  existing: UserPokemon;
}

export const DuplicateVerifier: React.FC<DuplicateVerifierProps> = ({
  importedList,
  existingInventory,
  onConfirm,
  onCancel,
}) => {
  // Find duplicates
  const duplicates: DuplicateItem[] = [];
  const uniques: Omit<UserPokemon, 'id' | 'addedAt'>[] = [];

  importedList.forEach((p, idx) => {
    const match = existingInventory.find((exist) => {
      const speciesMatch = exist.name.toLowerCase() === p.name.toLowerCase();
      const ivsMatch = exist.ivAtk === p.ivAtk && exist.ivDef === p.ivDef && exist.ivHp === p.ivHp;
      const formsMatch =
        Boolean(exist.isShadow) === Boolean(p.isShadow) &&
        Boolean(exist.isPurified) === Boolean(p.isPurified) &&
        Boolean(exist.isShiny) === Boolean(p.isShiny);

      if (!speciesMatch || !ivsMatch || !formsMatch) return false;

      // If both have caught date/location and they differ, they are NOT duplicates
      if (exist.caughtDate && p.caughtDate && exist.caughtDate !== p.caughtDate) return false;
      if (exist.caughtLocation && p.caughtLocation && exist.caughtLocation !== p.caughtLocation) return false;

      return true;
    });

    if (match) {
      duplicates.push({ index: idx, incoming: p, existing: match });
    } else {
      uniques.push(p);
    }
  });

  // State to track resolution action per duplicate
  // Record<index_in_imported_list, 'merge' | 'keep_both'>
  const [resolutions, setResolutions] = useState<Record<number, 'merge' | 'keep_both'>>(() => {
    const initial: Record<number, 'merge' | 'keep_both'> = {};
    duplicates.forEach((dup) => {
      initial[dup.index] = 'merge';
    });
    return initial;
  });

  const handleToggleResolution = (index: number, action: 'merge' | 'keep_both') => {
    setResolutions((prev) => ({ ...prev, [index]: action }));
  };

  const handleConfirmSave = () => {
    const finalList: (Omit<UserPokemon, 'id' | 'addedAt'> & { id?: string })[] = [];

    // Add all uniques
    uniques.forEach((u) => {
      finalList.push(u);
    });

    // Add duplicates according to chosen resolutions
    duplicates.forEach((dup) => {
      const action = resolutions[dup.index];
      if (action === 'merge') {
        // Keep existing ID so store updates it
        finalList.push({
          ...dup.incoming,
          id: dup.existing.id,
        });
      } else {
        // No ID, store adds as new item
        finalList.push(dup.incoming);
      }
    });

    onConfirm(finalList);
  };

  // Helper to calculate IV percentage
  const getIvPercent = (atk: number, def: number, hp: number) => {
    return Math.round(((atk + def + hp) / 45) * 100);
  };

  if (duplicates.length === 0) {
    // If no duplicates found, we can auto-call confirm, but as a safety we show button
    return (
      <div className="p-6 text-center space-y-4 font-sans">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-6 h-6" />
        </div>
        <h4 className="text-base font-black text-slate-900">¡Todo Listo!</h4>
        <p className="text-xs font-bold text-slate-500 max-w-sm mx-auto">
          No se encontraron duplicados biológicos con Pokémon en tu caja actual. Todos los registros son nuevos.
        </p>
        <button
          onClick={handleConfirmSave}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md"
        >
          Confirmar e Importar {uniques.length} Pokémon
        </button>
      </div>
    );
  }

  const mergeCount = Object.values(resolutions).filter((r) => r === 'merge').length;
  const keepNewCount = Object.values(resolutions).filter((r) => r === 'keep_both').length;

  return (
    <div className="space-y-6 font-sans">
      {/* Alert Header */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
        <div>
          <span className="block font-black text-amber-900 mb-0.5">⚠️ Se encontraron posibles duplicados</span>
          <p className="font-bold text-amber-800">
            Hemos encontrado <span className="underline font-black">{duplicates.length} Pokémon</span> con los mismos IVs, especie y forma que ya tenías en tu Caja. 
            Revisa cada caso abajo y decide si deseas actualizarlos (combinar) o conservarlos como nuevos ejemplares.
          </p>
        </div>
      </div>

      {/* Duplicates List */}
      <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1.5 custom-scrollbar">
        {duplicates.map((dup) => {
          const ivPct = getIvPercent(dup.incoming.ivAtk, dup.incoming.ivDef, dup.incoming.ivHp);
          const currentAction = resolutions[dup.index];

          return (
            <div
              key={dup.index}
              className={`border-2 rounded-2xl p-4 transition-all ${
                currentAction === 'merge'
                  ? 'border-purple-600 bg-purple-50/10'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {/* Header Info */}
              <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-sm">{dup.incoming.name}</span>
                  <span className="bg-amber-400 text-slate-950 text-[10px] px-2 py-0.5 rounded-full font-black">
                    IV {ivPct}% ({dup.incoming.ivAtk}/{dup.incoming.ivDef}/{dup.incoming.ivHp})
                  </span>
                  {dup.incoming.isShiny && (
                    <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[9px] px-1.5 py-0.5 rounded-md font-black flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> Shiny
                    </span>
                  )}
                  {dup.incoming.isShadow && (
                    <span className="bg-purple-100 text-purple-700 border border-purple-200 text-[9px] px-1.5 py-0.5 rounded-md font-black">
                      💀 Oscuro
                    </span>
                  )}
                  {dup.incoming.isPurified && (
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] px-1.5 py-0.5 rounded-md font-black">
                      ✨ Purificado
                    </span>
                  )}
                </div>

                {/* Switch Actions */}
                <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 text-[10px] font-black">
                  <button
                    type="button"
                    onClick={() => handleToggleResolution(dup.index, 'merge')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                      currentAction === 'merge'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Combinar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleResolution(dup.index, 'keep_both')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                      currentAction === 'keep_both'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    <span>Nuevo</span>
                  </button>
                </div>
              </div>

              {/* Side-by-side comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-700">
                {/* Existing item in inventory */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <span className="block font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">
                    En tu Caja actual
                  </span>
                  <div className="flex justify-between items-center font-bold">
                    <span>CP {dup.existing.cp}</span>
                    <span className="text-slate-500">Nivel {dup.existing.level}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 font-semibold space-y-0.5">
                    <span className="block">Ataques: {getSpanishMoveName(dup.existing.fastMove)} / {getSpanishMoveName(dup.existing.chargedMove1)}</span>
                    {(dup.existing.caughtDate || dup.existing.caughtLocation) && (
                      <div className="flex items-center gap-2 mt-1 text-slate-400 font-bold flex-wrap">
                        {dup.existing.caughtDate && (
                          <span className="flex items-center gap-0.5">
                            <Calendar className="w-3 h-3" /> {dup.existing.caughtDate}
                          </span>
                        )}
                        {dup.existing.caughtLocation && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" /> {dup.existing.caughtLocation}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Incoming item */}
                <div className="bg-purple-50/20 border border-purple-200/50 rounded-xl p-3 space-y-1.5">
                  <span className="block font-extrabold text-purple-600 uppercase text-[9px] tracking-wider">
                    A importar / Nuevo Escaneo
                  </span>
                  <div className="flex justify-between items-center font-bold">
                    <span className={dup.incoming.cp > dup.existing.cp ? 'text-purple-600 font-black' : ''}>
                      CP {dup.incoming.cp} {dup.incoming.cp > dup.existing.cp && '▲'}
                    </span>
                    <span className={dup.incoming.level > dup.existing.level ? 'text-purple-600 font-black' : ''}>
                      Nivel {dup.incoming.level} {dup.incoming.level > dup.existing.level && '▲'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-600 font-semibold space-y-0.5">
                    <span className="block">Ataques: {getSpanishMoveName(dup.incoming.fastMove)} / {getSpanishMoveName(dup.incoming.chargedMove1)}</span>
                    {(dup.incoming.caughtDate || dup.incoming.caughtLocation) && (
                      <div className="flex items-center gap-2 mt-1 text-slate-400 font-bold flex-wrap">
                        {dup.incoming.caughtDate && (
                          <span className="flex items-center gap-0.5">
                            <Calendar className="w-3 h-3" /> {dup.incoming.caughtDate}
                          </span>
                        )}
                        {dup.incoming.caughtLocation && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" /> {dup.incoming.caughtLocation}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Verification footer actions */}
      <div className="pt-4 border-t border-slate-200 space-y-3 font-sans">
        <div className="flex justify-between items-center text-xs text-slate-600 font-bold">
          <span>Pokémon Nuevos directos: <strong className="text-slate-900">{uniques.length}</strong></span>
          <span>A actualizar: <strong className="text-purple-700">{mergeCount}</strong></span>
          <span>Nuevos duplicados: <strong className="text-slate-900">{keepNewCount}</strong></span>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Cancelar</span>
          </button>
          <button
            type="button"
            onClick={handleConfirmSave}
            className="flex-2 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar e Importar {uniques.length + mergeCount + keepNewCount} Pokémon</span>
          </button>
        </div>
      </div>
    </div>
  );
};
