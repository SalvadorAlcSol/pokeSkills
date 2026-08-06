import React, { useState, useRef, useCallback } from 'react';
import { Upload, Loader2, CheckCircle2, AlertCircle, Trash2, Download, Zap, Shield, Heart, X, Sparkles, Image } from 'lucide-react';
import { analyzeFrames, DetectedPokemon, AnalysisProgress, isGeminiConfigured } from '../services/geminiService';
import { POGO_DATABASE } from '../data/pogoDatabase';
import { useInventoryStore } from '../store/inventoryStore';
import { getSpanishMoveName } from '../utils/pogoMoveTranslator';

function getValidMovesForSpecies(speciesName: string) {
  const dbPoke = POGO_DATABASE.find(p => p.name.toLowerCase() === speciesName.toLowerCase());
  if (!dbPoke) return { fastMoves: [], chargedMoves: [] };
  return {
    fastMoves: dbPoke.fastMoves.map(m => m.name),
    chargedMoves: dbPoke.chargedMoves.map(m => m.name)
  };
}

type ScanPhase = 'idle' | 'reading' | 'analyzing' | 'preview' | 'done' | 'error';

interface ScreenshotScannerProps {
  onComplete?: () => void;
  importMode?: 'merge' | 'overwrite' | 'append';
}

export const ScreenshotScanner: React.FC<ScreenshotScannerProps> = ({ onComplete, importMode = 'merge' as const }) => {
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [detectedPokemons, setDetectedPokemons] = useState<DetectedPokemon[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importPokemons = useInventoryStore((state) => state.importPokemons);

  const geminiReady = isGeminiConfigured();

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleFilesSelect = useCallback(async (files: FileList | File[]) => {
    const fileList = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (fileList.length === 0) {
      setErrorMessage('Por favor sube archivos de imagen válidos (.png, .jpg, .jpeg)');
      setPhase('error');
      return;
    }

    setSelectedFiles(fileList);
    setPhase('reading');
    setErrorMessage('');
    setStatusMessage(`Leyendo ${fileList.length} imágenes...`);

    try {
      // Phase 1: Convert files to Data URLs
      const dataUrls: string[] = [];
      for (let i = 0; i < fileList.length; i++) {
        setStatusMessage(`Leyendo imagen ${i + 1} de ${fileList.length}...`);
        const url = await readFileAsDataUrl(fileList[i]);
        dataUrls.push(url);
      }

      // Phase 2: Analyze with Gemini Vision
      setPhase('analyzing');
      const detected = await analyzeFrames(dataUrls, (progress) => {
        setAnalysisProgress(progress);
        setStatusMessage(progress.message);
      });

      setDetectedPokemons(detected);
      setPhase('preview');
      setStatusMessage(`¡Análisis completo! Se detectaron ${detected.length} Pokémon.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error procesando las capturas de pantalla.');
      setPhase('error');
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const files = e.dataTransfer.files;
      if (files && files.length > 0) handleFilesSelect(files);
    },
    [handleFilesSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) handleFilesSelect(files);
    },
    [handleFilesSelect]
  );

  const handleImportAll = () => {
    const pokemonsToImport = detectedPokemons.map((p) => ({
      speciesId: p.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: p.name,
      cp: p.cp,
      level: p.level ?? 40,
      ivAtk: p.ivAtk ?? 15,
      ivDef: p.ivDef ?? 15,
      ivHp: p.ivHp ?? 15,
      fastMove: p.fastMove,
      chargedMove1: p.chargedMove1,
      chargedMove2: p.chargedMove2 || undefined,
      isShadow: p.isShadow,
      isPurified: p.isPurified || false,
      isShiny: p.isShiny || false,
      isFavorite: false,
    }));

    importPokemons(pokemonsToImport, importMode);
    setPhase('done');
    setStatusMessage(`¡${pokemonsToImport.length} Pokémon importados a tu Caja!`);
    if (onComplete) {
      setTimeout(() => onComplete(), 1500);
    }
  };

  const handleRemoveDetected = (index: number) => {
    setDetectedPokemons((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateDetected = (index: number, updates: Partial<DetectedPokemon>) => {
    setDetectedPokemons((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p))
    );
  };

  const handleReset = () => {
    setPhase('idle');
    setStatusMessage('');
    setErrorMessage('');
    setAnalysisProgress(null);
    setDetectedPokemons([]);
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const progressPercent = (() => {
    if (phase === 'reading') {
      return 20;
    }
    if (phase === 'analyzing' && analysisProgress) {
      return 20 + Math.round((analysisProgress.current / Math.max(1, analysisProgress.total)) * 80);
    }
    if (phase === 'preview' || phase === 'done') return 100;
    return 0;
  })();

  return (
    <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-6 mb-6 font-sans">
      <h3 className="text-xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
        <Image className="w-5 h-5 text-purple-600" />
        Escáner de Capturas de Pantalla con IA
      </h3>
      <p className="text-slate-600 text-xs font-medium mb-4">
        Sube capturas de pantalla de tus Pokémon (ej. pantalla de detalles de PGSharp o valoración Appraisal) y Gemini Vision extraerá sus datos automáticamente en lote.
      </p>

      {/* API Key Warning */}
      {!geminiReady && (
        <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-amber-950 mb-1">API Key de Gemini no configurada</p>
              <p className="text-[11px] text-amber-900 font-bold mb-2">
                Para usar esta función de análisis de imágenes necesitas tu propia API Key de Google AI Studio (gratuita).
              </p>
              <ol className="text-[10px] text-amber-900 font-bold list-decimal pl-4 space-y-1">
                <li>
                  Ve a{' '}
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline text-amber-950 font-black">
                    aistudio.google.com/apikey
                  </a>
                </li>
                <li>Crea una API Key</li>
                <li>Pégala en tu archivo local <code className="bg-white/60 px-1 rounded border border-amber-300">.env</code></li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Dropzone Area */}
      {phase === 'idle' && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => geminiReady && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-2xl transition-all ${
            geminiReady
              ? 'border-purple-600 bg-white hover:bg-slate-100 cursor-pointer shadow-sm'
              : 'border-slate-300 bg-slate-100 cursor-not-allowed opacity-60'
          }`}
        >
          <Upload className="w-10 h-10 mb-3 text-purple-600" />
          <p className="mb-1 text-xs font-extrabold text-slate-800">
            <span className="font-black">Arrastra tus capturas aquí</span> o haz clic para subir
          </p>
          <p className="text-[10px] font-bold text-slate-400">Sube múltiples imágenes (.png, .jpg, .jpeg)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleInputChange}
            disabled={!geminiReady}
          />
        </div>
      )}

      {/* Progress View */}
      {(phase === 'reading' || phase === 'analyzing') && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
            <div className="flex-1">
              <p className="text-xs font-extrabold text-slate-900">{statusMessage}</p>
              {selectedFiles.length > 0 && (
                <p className="text-[10px] font-bold text-slate-500">
                  Procesando {selectedFiles.length} imágenes...
                </p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border border-slate-300">
            <div
              className="h-full rounded-full transition-all duration-300 bg-purple-600"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] font-extrabold text-slate-600">
            <span>📸 Lectura de archivos</span>
            <span className={phase === 'analyzing' ? 'text-purple-600' : 'text-slate-500'}>
              {phase === 'analyzing' ? '🤖 Extrayendo con Gemini...' : '⏳ En espera...'}
            </span>
          </div>

          {/* Real-time stats */}
          {analysisProgress && analysisProgress.results.length > 0 && (
            <p className="text-xs text-emerald-700 font-extrabold">
              ✨ {analysisProgress.results.length} Pokémon detectados hasta ahora...
            </p>
          )}
        </div>
      )}

      {/* Preview Grid and Editor */}
      {phase === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-emerald-700 font-extrabold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              {statusMessage}
            </p>
            <button onClick={handleReset} className="text-xs text-slate-500 hover:text-slate-900 font-extrabold transition-colors flex items-center gap-1">
              <X className="w-4 h-4" /> Resetear
            </button>
          </div>

          {/* Detected List */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {detectedPokemons.map((poke, idx) => (
              <div key={idx} className="bg-white border-2 border-slate-200 rounded-2xl p-3 flex items-center gap-3 group relative shadow-xs">
                <button
                  onClick={() => handleRemoveDetected(idx)}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white hover:bg-red-700 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="font-extrabold text-slate-900 text-sm">{poke.name}</span>
                    <span className="bg-purple-600 text-white text-xs px-2.5 py-0.5 rounded-full font-black">CP {poke.cp}</span>
                    {poke.level !== null && <span className="bg-slate-700 text-white text-xs px-2 py-0.5 rounded-full font-extrabold">Nv.{poke.level}</span>}
                    {poke.ivPercent !== null && <span className="bg-amber-400 text-slate-950 text-xs px-2.5 py-0.5 rounded-full font-black">{poke.ivPercent}%</span>}
                    {poke.isShadow && <span className="bg-purple-100 text-purple-800 border border-purple-300 text-[10px] px-2 py-0.5 rounded-full font-extrabold">💀 Shadow</span>}
                    {poke.isPurified && <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-extrabold">✨ Purificado</span>}
                    {poke.isShiny && <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] px-2 py-0.5 rounded-full font-extrabold flex items-center gap-0.5">🌟 Variocolor</span>}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-700 font-bold mt-1">
                    {(() => {
                      const { fastMoves, chargedMoves } = getValidMovesForSpecies(poke.name);
                      return (
                        <>
                          <div className="flex items-center gap-1">
                            <strong className="text-blue-700">Rápido:</strong>
                            {fastMoves.length > 0 ? (
                              <select
                                value={poke.fastMove}
                                onChange={(e) => handleUpdateDetected(idx, { fastMove: e.target.value })}
                                className="bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-900 font-extrabold outline-none cursor-pointer hover:border-blue-600"
                              >
                                {fastMoves.map((m) => (
                                  <option key={m} value={m} className="bg-white text-slate-900 font-extrabold">
                                    {getSpanishMoveName(m)}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span>{getSpanishMoveName(poke.fastMove) || '?'}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <strong className="text-purple-700">Cargado:</strong>
                            {chargedMoves.length > 0 ? (
                              <select
                                value={poke.chargedMove1}
                                onChange={(e) => handleUpdateDetected(idx, { chargedMove1: e.target.value })}
                                className="bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-900 font-extrabold outline-none cursor-pointer hover:border-purple-600"
                              >
                                {chargedMoves.map((m) => (
                                  <option key={m} value={m} className="bg-white text-slate-900 font-extrabold">
                                    {getSpanishMoveName(m)}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span>{getSpanishMoveName(poke.chargedMove1) || '?'}</span>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {(poke.ivAtk !== null || poke.ivDef !== null || poke.ivHp !== null) && (
                    <div className="flex items-center gap-3 mt-1.5 text-xs font-extrabold text-slate-700">
                      {poke.ivAtk !== null && (
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" /> Atk: {poke.ivAtk}</span>
                      )}
                      {poke.ivDef !== null && (
                        <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-blue-600" /> Def: {poke.ivDef}</span>
                      )}
                      {poke.ivHp !== null && (
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-emerald-600" /> Hp: {poke.ivHp}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {detectedPokemons.length === 0 && (
              <div className="py-8 text-center text-slate-500 text-xs font-medium">
                No se detectaron Pokémon en las capturas de pantalla. Sube fotos nítidas con el menú abierto.
              </div>
            )}
          </div>

          {/* Confirm Import */}
          {detectedPokemons.length > 0 && (
            <button
              onClick={handleImportAll}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <Download className="w-4 h-4" />
              Importar {detectedPokemons.length} Pokémon a Mi Caja
            </button>
          )}
        </div>
      )}

      {/* Done state */}
      {phase === 'done' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-600 text-white rounded-2xl flex items-start gap-3 shadow-sm font-extrabold text-xs">
            <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
            <div>
              <p>{statusMessage}</p>
              <p className="text-[11px] text-emerald-100 font-medium mt-1">
                Tus Pokémon han sido importados con éxito.
              </p>
            </div>
          </div>
          <button onClick={handleReset} className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-xl transition-all text-xs">
            Escanear más imágenes
          </button>
        </div>
      )}

      {/* Error state */}
      {phase === 'error' && (
        <div className="space-y-4">
          <div className="p-4 bg-red-600 text-white rounded-2xl flex items-start gap-3 shadow-sm font-extrabold text-xs">
            <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
          <button onClick={handleReset} className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-xl transition-all text-xs">
            Volver a intentar
          </button>
        </div>
      )}
    </div>
  );
};
