import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { useInventoryStore } from '../store/inventoryStore';
import { UserPokemon } from '../types/UserInventory';
import { Upload, AlertCircle, CheckCircle2, Download, Table, Check, Eye, HelpCircle } from 'lucide-react';

import { resolvePogoSpeciesAndForm } from '../utils/pokemonUtils';
import { calculatePogoPokemonCp } from '../utils/pokemonMath';
import { getSpanishMoveName, getEnglishMoveName } from '../utils/pogoMoveTranslator';

// Fuzzy header mapping dictionary
const HEADER_MAPPINGS: Record<string, string[]> = {
  name: ['name', 'nombre', 'pokemon', 'especie', 'species', 'especie id', 'species name', 'pokename'],
  cp: ['cp', 'pc', 'combat power', 'puntos combate', 'combatpower', 'puntos de combate'],
  level: ['level', 'nivel', 'lvl', 'lv', 'nivel pokémon', 'level min', 'level min.', 'level max'],
  ivAtk: ['atk iv', 'atk', 'ataque iv', 'ataque', 'iv atk', 'attack', 'iv_atk', 'iv attack', 'ataque_iv'],
  ivDef: ['def iv', 'def', 'defensa iv', 'defensa', 'iv def', 'defense', 'iv_def', 'iv defense', 'defensa_iv'],
  ivHp: ['sta iv', 'sta', 'hp iv', 'salud iv', 'salud', 'hp', 'iv hp', 'stamina', 'iv_hp', 'iv hp', 'iv stamina', 'salud_iv'],
  fastMove: ['fast move', 'ataque rapido', 'movimiento rapido', 'fast', 'fastmove', 'ataque rápido', 'movimiento rápido', 'quick move', 'ataque_rapido'],
  chargedMove1: ['charge move', 'charge move 1', 'ataque cargado', 'ataque cargado 1', 'charged 1', 'specialmove', 'charged move 1', 'charged move', 'ataque_cargado_1'],
  chargedMove2: ['charge move 2', 'ataque cargado 2', 'charged 2', 'specialmove2', 'charged move 2', 'ataque_cargado_2'],
  form: ['form', 'forma', 'variant', 'forma id', 'variante'],
  shiny: ['shiny', 'is shiny', 'variocolor', 'es variocolor', 'es_variocolor', 'isshiny', 'brillante'],
  caughtDate: ['caught', 'caught date', 'caught_date', 'date', 'fecha', 'fecha captura', 'fecha_captura', 'capturado'],
  caughtLocation: ['location', 'caught location', 'caught_location', 'lugar', 'lugar de captura', 'ubicacion', 'ubicación']
};

interface ColumnMapping {
  name: string;
  cp: string;
  level: string;
  ivAtk: string;
  ivDef: string;
  ivHp: string;
  fastMove: string;
  chargedMove1: string;
  chargedMove2: string;
  form: string;
  shiny: string;
  caughtDate: string;
  caughtLocation: string;
}

interface PokeGenieImporterProps {
  onComplete?: () => void;
  importMode?: 'merge' | 'overwrite' | 'append';
  onImportRequest?: (list: Omit<UserPokemon, 'id' | 'addedAt'>[]) => void;
}

export const PokeGenieImporter: React.FC<PokeGenieImporterProps> = ({ onComplete, importMode = 'merge' as const, onImportRequest }) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const importPokemons = useInventoryStore(state => state.importPokemons);

  const [pastedText, setPastedText] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'upload' | 'paste'>('paste');

  // Parser state
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    name: '', cp: '', level: '', ivAtk: '', ivDef: '', ivHp: '', fastMove: '', chargedMove1: '', chargedMove2: '', form: '', shiny: '', caughtDate: '', caughtLocation: ''
  });
  const [showMappingPanel, setShowMappingPanel] = useState<boolean>(false);
  const [parsedPreviewList, setParsedPreviewList] = useState<Omit<UserPokemon, 'id' | 'addedAt'>[]>([]);

  // Automatically find matching header
  const findMatchingHeader = (targetKey: keyof ColumnMapping, headers: string[]): string => {
    const list = HEADER_MAPPINGS[targetKey] || [];
    for (const option of list) {
      const found = headers.find(h => h.trim().toLowerCase() === option.toLowerCase());
      if (found) return found;
    }
    return '';
  };

  const handleParseComplete = (results: Papa.ParseResult<any>) => {
    if (results.data.length === 0) {
      setError('El archivo CSV está vacío.');
      return;
    }

    const headers = results.meta.fields || Object.keys(results.data[0] || {});
    setCsvHeaders(headers);
    setCsvRows(results.data);

    // Initial fuzzy mapping
    const newMapping: ColumnMapping = {
      name: findMatchingHeader('name', headers),
      cp: findMatchingHeader('cp', headers),
      level: findMatchingHeader('level', headers),
      ivAtk: findMatchingHeader('ivAtk', headers),
      ivDef: findMatchingHeader('ivDef', headers),
      ivHp: findMatchingHeader('ivHp', headers),
      fastMove: findMatchingHeader('fastMove', headers),
      chargedMove1: findMatchingHeader('chargedMove1', headers),
      chargedMove2: findMatchingHeader('chargedMove2', headers),
      form: findMatchingHeader('form', headers),
      shiny: findMatchingHeader('shiny', headers),
      caughtDate: findMatchingHeader('caughtDate', headers),
      caughtLocation: findMatchingHeader('caughtLocation', headers)
    };

    setColumnMapping(newMapping);
    updatePreview(results.data, newMapping);
  };

  const updatePreview = (rows: any[], mapping: ColumnMapping) => {
    try {
      const previewLimit = 5;
      const previewPokes: Omit<UserPokemon, 'id' | 'addedAt'>[] = [];

      for (let i = 0; i < Math.min(rows.length, previewLimit); i++) {
        const row = rows[i];
        const resolved = parseSinglePokemonRow(row, mapping);
        if (resolved) {
          previewPokes.push(resolved);
        }
      }

      setParsedPreviewList(previewPokes);
      
      // If we are missing critical columns (name, cp), show the mapping helper
      if (!mapping.name || !mapping.cp) {
        setShowMappingPanel(true);
      } else {
        setShowMappingPanel(false);
      }
    } catch (err: any) {
      setError(`Error al generar la previsualización: ${err.message}`);
    }
  };

  const parseSinglePokemonRow = (row: any, mapping: ColumnMapping): Omit<UserPokemon, 'id' | 'addedAt'> | null => {
    const getValue = (field: keyof ColumnMapping) => {
      const headerName = mapping[field];
      return headerName ? String(row[headerName] || '').trim() : '';
    };

    let rawName = getValue('name');
    if (!rawName || rawName.toLowerCase() === 'unknown') return null;

    const form = getValue('form');
    const rawCp = parseInt(getValue('cp') || '0', 10);
    const level = parseFloat(getValue('level') || '30');
    const ivAtk = parseInt(getValue('ivAtk') || '15', 10);
    const ivDef = parseInt(getValue('ivDef') || '15', 10);
    const ivHp = parseInt(getValue('ivHp') || '15', 10);
    
    // Resolve moves (supporting Spanish to English translations)
    const rawFast = getValue('fastMove');
    let rawCharged1 = getValue('chargedMove1');
    let rawCharged2 = getValue('chargedMove2');

    // Handle split charged moves (sometimes exported as "Move 1 / Move 2")
    if (rawCharged1.includes('/') || rawCharged1.includes(',') || /\s+y\s+/i.test(rawCharged1) || /\s+and\s+/i.test(rawCharged1)) {
      const parts = rawCharged1.split(/[\/,]|\s+y\s+|\s+and\s+/i).map((s) => s.trim()).filter(Boolean);
      if (parts.length > 0) rawCharged1 = parts[0];
      if (parts.length > 1 && !rawCharged2) rawCharged2 = parts[1];
    }

    const finalFast = getEnglishMoveName(rawFast);
    const finalCharged1 = getEnglishMoveName(rawCharged1);
    const finalCharged2 = rawCharged2 ? getEnglishMoveName(rawCharged2) : '';

    const shadowForm = ['shadow', 'oscuro', 's'].includes(form.toLowerCase()) || rawName.toLowerCase().includes('shadow') || rawName.toLowerCase().includes('oscuro');
    const purifiedForm = ['purified', 'purificado'].includes(form.toLowerCase()) || rawName.toLowerCase().includes('purified') || rawName.toLowerCase().includes('purificado');
    const rawShiny = getValue('shiny');
    const isShiny = ['true', '1', 'yes', 'si', 'shiny', 'variocolor', 's'].includes(rawShiny.toLowerCase()) ||
      form.toLowerCase().includes('shiny') ||
      rawName.toLowerCase().includes('shiny') ||
      rawName.toLowerCase().includes('variocolor');

    // Clean shadow/purified/shiny tags from name
    rawName = rawName.replace(/shadow|oscuro|purified|purificado|shiny|variocolor/gi, '').trim();

    const resolved = resolvePogoSpeciesAndForm(rawName, form);

    const cp = rawCp > 0 ? rawCp : calculatePogoPokemonCp(
      resolved.baseAttack,
      resolved.baseDefense,
      resolved.baseStamina,
      level,
      ivAtk,
      ivDef,
      ivHp
    );

    const caughtDate = getValue('caughtDate');
    const caughtLocation = getValue('caughtLocation');

    return {
      speciesId: resolved.speciesId,
      name: resolved.displayName,
      cp,
      level,
      ivAtk,
      ivDef,
      ivHp,
      fastMove: finalFast || (resolved.fastMoves?.[0] || ''),
      chargedMove1: finalCharged1 || (resolved.chargedMoves?.[0] || ''),
      chargedMove2: finalCharged2 || undefined,
      isShadow: shadowForm,
      isPurified: purifiedForm,
      isShiny,
      caughtDate: caughtDate || undefined,
      caughtLocation: caughtLocation || undefined,
      isFavorite: false,
    };
  };

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    const updated = { ...columnMapping, [field]: value };
    setColumnMapping(updated);
    updatePreview(csvRows, updated);
  };

  const handleConfirmImport = () => {
    try {
      const importedList: Omit<UserPokemon, 'id' | 'addedAt'>[] = [];
      
      for (const row of csvRows) {
        const parsed = parseSinglePokemonRow(row, columnMapping);
        if (parsed) {
          importedList.push(parsed);
        }
      }

      if (importedList.length === 0) {
        setError('No se encontraron Pokémon válidos para importar. Revisa el mapeado de tus columnas.');
        return;
      }

      if (onImportRequest) {
        onImportRequest(importedList);
      } else {
        importPokemons(importedList, importMode);
        setSuccess(`¡Se importaron ${importedList.length} Pokémon exitosamente a tu Caja!`);
        setError(null);

        // Clean parser states
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 1500);
      }
    } catch (err: any) {
      setError(`Error al importar: ${err.message}`);
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
      complete: handleParseComplete,
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

    let cleanText = pastedText.trim();
    if (cleanText.includes('```')) {
      cleanText = cleanText.replace(/```(?:csv)?/gi, '').replace(/```/g, '').trim();
    }

    Papa.parse(cleanText, {
      header: true,
      skipEmptyLines: true,
      complete: handleParseComplete,
      error: (err) => setError(`Error leyendo el texto CSV: ${err.message}`)
    });
  };

  const handleDownloadTemplate = () => {
    const templateContent = `Name,CP,Level,Atk IV,Def IV,Sta IV,Fast Move,Charge Move,Charge Move 2,Form
Rayquaza,3840,40,15,15,15,Dragon Tail,Outrage,,Normal
Mewtwo,3830,40,15,13,14,Psycho Cut,Psystrike,Focus Blast,Normal
Tyranitar,3834,50,15,15,15,Bite,Crunch,,Shadow
Dragonite,3792,40,15,14,15,Dragon Tail,Outrage,,Normal`;

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
        <Table className="w-5 h-5 text-purple-600" />
        Importación Masiva de CSV
      </h3>
      
      <p className="text-slate-600 mb-4 text-xs font-medium">
        Sube o pega tu archivo CSV de PokeGenie, Calcy IV, o tu plantilla personalizada. Detectaremos automáticamente las columnas para una importación rápida y confiable.
      </p>

      {/* Selector Sub-Tab */}
      {csvRows.length === 0 && (
        <>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveSubTab('paste')}
              className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl border transition-all ${
                activeSubTab === 'paste'
                  ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
            >
              📋 Pegar Texto CSV
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
                placeholder="Pega aquí el contenido de tu CSV (ej: Name,CP,Level,Atk IV...)"
                rows={6}
                className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600 transition-colors shadow-inner custom-scrollbar"
              />
              <button
                onClick={handleProcessPastedText}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Eye className="w-4 h-4" />
                Previsualizar Datos Pegados
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
            Descargar Plantilla de Ejemplo (.CSV)
          </button>
        </>
      )}

      {/* Parser Configuration / Preview Grid */}
      {csvRows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3 mb-2">
            <div>
              <p className="text-xs text-slate-700 font-extrabold">
                📊 {csvRows.length} filas detectadas en tu archivo.
              </p>
            </div>
            <button
              onClick={() => {
                setCsvRows([]);
                setCsvHeaders([]);
                setParsedPreviewList([]);
              }}
              className="text-xs text-red-600 hover:text-red-700 font-extrabold transition-all"
            >
              Cambiar Archivo
            </button>
          </div>

          {/* Interactive Column Mapping Panel */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 space-y-3">
            <button
              onClick={() => setShowMappingPanel(!showMappingPanel)}
              className="w-full flex items-center justify-between text-xs font-black text-slate-900 focus:outline-none"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-purple-600" />
                Mapeo de Columnas {showMappingPanel ? '▲' : '▼'}
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {!columnMapping.name || !columnMapping.cp ? '⚠️ Mapeo Incompleto' : '✅ Mapeado Automático'}
              </span>
            </button>

            {showMappingPanel && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Nombre / Especie *</label>
                  <select
                    value={columnMapping.name}
                    onChange={(e) => handleMappingChange('name', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold outline-none focus:border-purple-600"
                  >
                    <option value="">-- No mapeado --</option>
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Puntos de Combate (CP) *</label>
                  <select
                    value={columnMapping.cp}
                    onChange={(e) => handleMappingChange('cp', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold outline-none focus:border-purple-600"
                  >
                    <option value="">-- No mapeado --</option>
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Nivel</label>
                  <select
                    value={columnMapping.level}
                    onChange={(e) => handleMappingChange('level', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold outline-none focus:border-purple-600"
                  >
                    <option value="">-- No mapeado --</option>
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Ataque IV</label>
                  <select
                    value={columnMapping.ivAtk}
                    onChange={(e) => handleMappingChange('ivAtk', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold outline-none focus:border-purple-600"
                  >
                    <option value="">-- No mapeado --</option>
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Ataque Rápido</label>
                  <select
                    value={columnMapping.fastMove}
                    onChange={(e) => handleMappingChange('fastMove', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold outline-none focus:border-purple-600"
                  >
                    <option value="">-- No mapeado --</option>
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Ataque Cargado 1</label>
                  <select
                    value={columnMapping.chargedMove1}
                    onChange={(e) => handleMappingChange('chargedMove1', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold outline-none focus:border-purple-600"
                  >
                    <option value="">-- No mapeado --</option>
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Shiny / Variocolor</label>
                  <select
                    value={columnMapping.shiny}
                    onChange={(e) => handleMappingChange('shiny', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold outline-none focus:border-purple-600"
                  >
                    <option value="">-- No mapeado --</option>
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Fecha de Captura</label>
                  <select
                    value={columnMapping.caughtDate}
                    onChange={(e) => handleMappingChange('caughtDate', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold outline-none focus:border-purple-600"
                  >
                    <option value="">-- No mapeado --</option>
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Lugar de Captura</label>
                  <select
                    value={columnMapping.caughtLocation}
                    onChange={(e) => handleMappingChange('caughtLocation', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold outline-none focus:border-purple-600"
                  >
                    <option value="">-- No mapeado --</option>
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Visual Preview Table of First 5 rows */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase text-slate-500 font-extrabold tracking-wider block">Previsualización (Primeras 5 Filas)</span>
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs max-h-60 overflow-y-auto">
              <table className="w-full border-collapse text-left text-xs text-slate-700">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-extrabold text-[10px] text-slate-500 uppercase">
                    <th className="p-3">Pokémon</th>
                    <th className="p-3">CP</th>
                    <th className="p-3">Nivel</th>
                    <th className="p-3">IVs</th>
                    <th className="p-3">Movimientos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {parsedPreviewList.map((poke, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-900 font-black">{poke.name}</span>
                          {poke.isShadow && <span className="bg-purple-100 text-purple-700 border border-purple-200 text-[8px] px-1.5 py-0.5 rounded-full font-black">Shadow</span>}
                          {poke.isPurified && <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[8px] px-1.5 py-0.5 rounded-full font-black">Purificado</span>}
                          {poke.isShiny && <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[8px] px-1.5 py-0.5 rounded-full font-black">🌟 Variocolor</span>}
                        </div>
                      </td>
                      <td className="p-3 text-slate-950 font-black">CP {poke.cp}</td>
                      <td className="p-3">Nv.{poke.level}</td>
                      <td className="p-3 text-slate-600">{poke.ivAtk}/{poke.ivDef}/{poke.ivHp}</td>
                      <td className="p-3 text-slate-500 text-[10px]">
                        <span className="block font-semibold text-blue-700">{getSpanishMoveName(poke.fastMove)}</span>
                        <span className="block font-semibold text-purple-700">{getSpanishMoveName(poke.chargedMove1)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={handleConfirmImport}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <Check className="w-4 h-4" />
            Confirmar e Importar {csvRows.length} Pokémon a Mi Caja
          </button>
        </div>
      )}

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
