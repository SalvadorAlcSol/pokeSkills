import React, { useState } from 'react';
import Papa from 'papaparse';
import { useInventoryStore } from '../store/inventoryStore';
import { UserPokemon } from '../types/UserInventory';
import { Upload, AlertCircle, CheckCircle2, Download } from 'lucide-react';

import { resolvePogoSpeciesAndForm } from '../utils/pokemonUtils';
import { calculatePogoPokemonCp } from '../utils/pokemonMath';

export const PokeGenieImporter: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const importPokemons = useInventoryStore(state => state.importPokemons);

  const [pastedText, setPastedText] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'upload' | 'paste'>('paste');

  const processParsedData = (results: Papa.ParseResult<any>) => {
    try {
      const pokemons: Omit<UserPokemon, 'id' | 'addedAt'>[] = results.data.map((row: any) => {
        const getVal = (...keys: string[]) => {
          for (const k of keys) {
            const foundKey = Object.keys(row).find(
              (rk) => rk.trim().toLowerCase() === k.toLowerCase()
            );
            if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
              return row[foundKey];
            }
          }
          return '';
        };

        let rawName = getVal('Name', 'Nombre', 'Pokemon', 'Especie') || 'Unknown';
        const form = getVal('Form', 'Forma', 'Variant') || '';
        const rawCp = parseInt(getVal('CP', 'PC', 'Combat Power') || '0', 10);
        const level = parseFloat(getVal('Level', 'Nivel', 'Lvl', 'Lv') || '40');
        const ivAtk = parseInt(getVal('Atk IV', 'Atk', 'Ataque IV', 'Ataque', 'IV Atk') || '15', 10);
        const ivDef = parseInt(getVal('Def IV', 'Def', 'Defensa IV', 'Defensa', 'IV Def') || '15', 10);
        const ivHp = parseInt(getVal('Sta IV', 'Sta', 'HP IV', 'Salud IV', 'Salud', 'HP', 'IV Hp') || '15', 10);
        const fastMove = getVal('Fast Move', 'Ataque Rapido', 'Movimiento Rapido', 'Fast') || '';
        let chargedMove1 = getVal('Charge Move', 'Charge Move 1', 'Ataque Cargado', 'Ataque Cargado 1', 'Charged 1') || '';
        let chargedMove2 = getVal('Charge Move 2', 'Ataque Cargado 2', 'Charged 2') || '';
        
        if (chargedMove1.includes('/') || chargedMove1.includes(',') || /\s+y\s+/i.test(chargedMove1) || /\s+and\s+/i.test(chargedMove1)) {
          const parts = chargedMove1.split(/[\/,]|\s+y\s+|\s+and\s+/i).map((s) => s.trim()).filter(Boolean);
          if (parts.length > 0) chargedMove1 = parts[0];
          if (parts.length > 1 && !chargedMove2) chargedMove2 = parts[1];
        }
        
        const shadowCol = getVal('Shadow', 'Is Shadow', 'Oscuro', 'Es Oscuro', 'IsShadow') || '';
        const isShadow =
          ['true', '1', 'yes', 'si', 'shadow', 'oscuro', 's'].includes(shadowCol.trim().toLowerCase()) ||
          form.toLowerCase().includes('shadow') ||
          form.toLowerCase().includes('oscuro') ||
          rawName.toLowerCase().includes('shadow') ||
          rawName.toLowerCase().includes('oscuro');

        const isPurified =
          form.toLowerCase().includes('purified') ||
          form.toLowerCase().includes('purificado') ||
          rawName.toLowerCase().includes('purified') ||
          rawName.toLowerCase().includes('purificado');

        // Clean "Shadow" or "Oscuro" from name if present in rawName string
        rawName = rawName.replace(/shadow|oscuro|purified|purificado/gi, '').trim();

        const resolved = resolvePogoSpeciesAndForm(rawName, form);

        const canMegaRaw = getVal('Can Mega', 'Mega Unlocked', 'Puede Mega', 'Mega Ready', 'CanMega', 'Mega Available') || '';
        const canMegaEvolve =
          ['true', '1', 'yes', 'si', 'verdadera', 'verdadero'].includes(canMegaRaw.trim().toLowerCase()) ||
          form.toLowerCase().includes('mega') ||
          rawName.toLowerCase().includes('mega') ||
          Boolean(resolved.isMegaUnlocked);

        const megaLevelRaw = getVal('Mega Level', 'Nivel Mega', 'MegaLevel', 'Mega Tier', 'NivelMega') || '';
        let megaLevel = 0;
        if (megaLevelRaw) {
          const lowerML = megaLevelRaw.trim().toLowerCase();
          if (lowerML.includes('4') || lowerML.includes('ultra') || lowerML.includes('supremo')) megaLevel = 4;
          else if (lowerML.includes('3') || lowerML.includes('max') || lowerML.includes('máx')) megaLevel = 3;
          else if (lowerML.includes('2') || lowerML.includes('alto') || lowerML.includes('high')) megaLevel = 2;
          else if (lowerML.includes('1') || lowerML.includes('base')) megaLevel = 1;
          else megaLevel = Number(lowerML) || (canMegaEvolve ? 3 : 0);
        } else if (canMegaEvolve) {
          megaLevel = 3; // Default unlocked Megas to Level 3 (Max)
        }

        const cp = rawCp > 0 ? rawCp : calculatePogoPokemonCp(
          resolved.baseAttack,
          resolved.baseDefense,
          resolved.baseStamina,
          level,
          ivAtk,
          ivDef,
          ivHp
        );

        const finalFastMove = fastMove || (resolved.fastMoves && resolved.fastMoves.length > 0 ? resolved.fastMoves[0] : '');
        const finalChargedMove1 = chargedMove1 || (resolved.chargedMoves && resolved.chargedMoves.length > 0 ? resolved.chargedMoves[0] : '');

        return {
          speciesId: resolved.speciesId,
          name: resolved.displayName,
          cp,
          level,
          ivAtk,
          ivDef,
          ivHp,
          fastMove: finalFastMove,
          chargedMove1: finalChargedMove1,
          chargedMove2,
          isShadow,
          isPurified,
          isFavorite: false,
          canMegaEvolve,
          unlockedMegaForm: resolved.unlockedMegaFormId,
          megaLevel,
        };
      });

      const validPokes = pokemons.filter(p => p.name && p.name !== 'Unknown');
      if (validPokes.length === 0) {
        setError('No se detectaron Pokémon válidos en los datos pegados/procesados.');
        return;
      }

      importPokemons(validPokes);
      setSuccess(`¡Se importaron ${validPokes.length} Pokémon exitosamente!`);
    } catch (err: any) {
      setError(`Error procesando los datos: ${err.message}`);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: processParsedData,
      error: (err) => setError(`Error leyendo archivo CSV: ${err.message}`)
    });
  };

  const handleProcessPastedText = () => {
    if (!pastedText.trim()) {
      setError('Por favor pega primero el texto CSV en el recuadro.');
      return;
    }

    setError(null);
    setSuccess(null);

    // Clean code fences if present in pasted text from AI response
    let cleanText = pastedText.trim();
    if (cleanText.includes('```')) {
      cleanText = cleanText.replace(/```(?:csv)?/gi, '').replace(/```/g, '').trim();
    }

    Papa.parse(cleanText, {
      header: true,
      skipEmptyLines: true,
      complete: processParsedData,
      error: (err) => setError(`Error leyendo el texto CSV: ${err.message}`)
    });
  };

  const handleDownloadTemplate = () => {
    const templateContent = `Name,CP,Level,Atk IV,Def IV,Sta IV,Fast Move,Charge Move,Charge Move 2,Form,Can Mega
Rayquaza,3840,40,15,15,15,Dragon Tail,Outrage,,Normal,TRUE
Rayquaza,3400,35,14,14,14,Dragon Tail,Outrage,,Normal,FALSE
Mewtwo,3830,40,15,13,14,Psycho Cut,Psystrike,Focus Blast,Normal,TRUE
Tyranitar,3834,50,15,15,15,Bite,Crunch,,Shadow,FALSE
Gyarados,3391,40,15,15,15,Waterfall,Aqua Tail,,Normal,TRUE
Dragonite,3792,40,15,14,15,Dragon Tail,Outrage,,Normal,FALSE`;

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_pokeroutes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-6 mb-6 font-sans">
      <h3 className="text-xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
        <Upload className="w-5 h-5 text-purple-600" />
        Importar CSV (Texto o Archivo)
      </h3>
      
      <p className="text-slate-600 mb-4 text-xs font-medium">
        Pega directamente el texto CSV que generó Gemini o sube un archivo CSV descargado de PokeGenie.
      </p>

      {/* Selector Sub-Tab */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveSubTab('paste')}
          className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl border transition-all ${
            activeSubTab === 'paste'
              ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-200'
          }`}
        >
          📋 Pegar Texto CSV (Gemini)
        </button>
        <button
          onClick={() => setActiveSubTab('upload')}
          className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl border transition-all ${
            activeSubTab === 'upload'
              ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-200'
          }`}
        >
          📁 Subir Archivo .CSV
        </button>
      </div>

      {activeSubTab === 'paste' ? (
        <div className="space-y-3 mb-4">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Pega aquí el texto CSV copiado del chat de Gemini (ej: Name,CP,Level,Atk IV...)"
            rows={6}
            className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600 transition-colors shadow-inner custom-scrollbar"
          />
          <button
            onClick={handleProcessPastedText}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <CheckCircle2 className="w-4 h-4" />
            Importar Texto Pegado
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full mb-4">
          <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer bg-white hover:bg-slate-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-purple-600" />
              <p className="mb-1 text-xs font-extrabold text-slate-700">Haz clic para subir CSV o arrastra y suelta</p>
              <p className="text-[10px] font-bold text-slate-400">Archivos .csv</p>
            </div>
            <input id="dropzone-file" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      )}

      <button
        onClick={handleDownloadTemplate}
        className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-purple-700 border border-slate-300 rounded-2xl text-xs font-extrabold transition-colors flex items-center justify-center gap-2 shadow-xs"
      >
        <Download className="w-4 h-4" />
        Descargar Plantilla CSV de Ejemplo
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-600 text-white rounded-2xl flex items-start gap-3 shadow-sm font-extrabold text-xs">
          <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-emerald-600 text-white rounded-2xl flex items-start gap-3 shadow-sm font-extrabold text-xs">
          <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
          <p>{success}</p>
        </div>
      )}
    </div>
  );
};

