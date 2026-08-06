import React, { useState, useRef, useCallback } from 'react';
import { Video, Upload, Loader2, CheckCircle2, AlertCircle, Trash2, Download, Zap, Shield, Heart, X } from 'lucide-react';
import { extractFramesFromVideo, ExtractionProgress, ExtractedFrame } from '../services/videoFrameExtractor';
import { analyzeFrames, DetectedPokemon, AnalysisProgress, isGeminiConfigured } from '../services/geminiService';
import { POGO_DATABASE } from '../data/pogoDatabase';
import { useInventoryStore } from '../store/inventoryStore';
import { getSpanishMoveName } from '../utils/pogoMoveTranslator';

// Inside component or helper:
function getValidMovesForSpecies(speciesName: string) {
  const dbPoke = POGO_DATABASE.find(p => p.name.toLowerCase() === speciesName.toLowerCase());
  if (!dbPoke) return { fastMoves: [], chargedMoves: [] };
  return {
    fastMoves: dbPoke.fastMoves.map(m => m.name),
    chargedMoves: dbPoke.chargedMoves.map(m => m.name)
  };
}

type ScanPhase = 'idle' | 'extracting' | 'analyzing' | 'preview' | 'done' | 'error';

interface VideoScannerProps {
  onComplete?: () => void;
  importMode?: 'merge' | 'overwrite' | 'append';
}

export const VideoScanner: React.FC<VideoScannerProps> = ({ onComplete, importMode = 'merge' as const }) => {
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [extractionProgress, setExtractionProgress] = useState<ExtractionProgress | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [detectedPokemons, setDetectedPokemons] = useState<DetectedPokemon[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importPokemons = useInventoryStore((state) => state.importPokemons);

  const geminiReady = isGeminiConfigured();

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setErrorMessage('Por favor sube un archivo de video (.mp4, .mov, .webm)');
      setPhase('error');
      return;
    }

    setSelectedFile(file);
    setPhase('extracting');
    setErrorMessage('');
    setStatusMessage(`Procesando: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);

    try {
      // Phase 1: Extract frames
      const frames: ExtractedFrame[] = await extractFramesFromVideo(file, 1.5, (progress) => {
        setExtractionProgress(progress);
        setStatusMessage(progress.message);
      });

      if (frames.length === 0) {
        setErrorMessage('No se pudieron extraer fotogramas del video.');
        setPhase('error');
        return;
      }

      // Phase 2: Analyze with Gemini
      setPhase('analyzing');
      const frameDataUrls = frames.map((f) => f.dataUrl);

      const detected = await analyzeFrames(frameDataUrls, (progress) => {
        setAnalysisProgress(progress);
        setStatusMessage(progress.message);
      });

      setDetectedPokemons(detected);
      setPhase('preview');
      setStatusMessage(`¡${detected.length} Pokémon detectados! Revisa los datos antes de importar.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error procesando el video.');
      setPhase('error');
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleImportAll = () => {
    const pokemonsToImport = detectedPokemons.map((p) => ({
      speciesId: p.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: p.name,
      cp: p.cp,
      level: p.level ?? estimateLevelFromCp(p.cp),
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
    setStatusMessage(`¡${pokemonsToImport.length} Pokémon importados exitosamente a tu Caja!`);
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
    setExtractionProgress(null);
    setAnalysisProgress(null);
    setDetectedPokemons([]);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Simple level estimation from CP (rough approximation)
  const estimateLevelFromCp = (cp: number): number => {
    if (cp >= 4000) return 50;
    if (cp >= 3500) return 45;
    if (cp >= 3000) return 40;
    if (cp >= 2500) return 35;
    if (cp >= 2000) return 30;
    if (cp >= 1500) return 25;
    if (cp >= 1000) return 20;
    if (cp >= 500) return 15;
    return 10;
  };

  const progressPercent = (() => {
    if (phase === 'extracting' && extractionProgress) {
      return Math.round((extractionProgress.currentFrame / Math.max(1, extractionProgress.totalFrames)) * 50);
    }
    if (phase === 'analyzing' && analysisProgress) {
      return 50 + Math.round((analysisProgress.current / Math.max(1, analysisProgress.total)) * 50);
    }
    if (phase === 'preview' || phase === 'done') return 100;
    return 0;
  })();

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
      <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <Video className="w-5 h-5 text-blue-400" />
        Escáner de Video con IA
      </h3>
      <p className="text-gray-400 text-sm mb-4">
        Graba tu pantalla mientras deslizas por tus Pokémon en Pokémon GO. Sube el video y Gemini Vision extraerá los datos automáticamente.
      </p>

      {/* API Key Warning */}
      {!geminiReady && (
        <div className="mb-4 p-4 bg-amber-900/50 border border-amber-500/50 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-200 font-bold mb-1">API Key de Gemini no configurada</p>
              <p className="text-xs text-amber-300/80 mb-2">
                Para usar el escáner de video necesitas una API Key gratuita de Google AI.
              </p>
              <ol className="text-xs text-amber-300/80 list-decimal pl-4 space-y-1">
                <li>
                  Ve a{' '}
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline text-amber-200 hover:text-white">
                    aistudio.google.com/apikey
                  </a>
                </li>
                <li>Crea una API Key (gratis)</li>
                <li>
                  Abre el archivo <code className="bg-black/30 px-1 rounded">.env</code> en la raíz del proyecto y reemplaza <code className="bg-black/30 px-1 rounded">YOUR_API_KEY_HERE</code> con tu key
                </li>
                <li>Reinicia el servidor de desarrollo</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      {phase === 'idle' && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => geminiReady && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-2xl transition-all ${
            geminiReady
              ? 'border-blue-600 bg-white hover:bg-slate-100 cursor-pointer shadow-xs'
              : 'border-slate-300 bg-slate-100 cursor-not-allowed opacity-60'
          }`}
        >
          <Upload className="w-10 h-10 mb-3 text-blue-600" />
          <p className="mb-1 text-xs font-extrabold text-slate-800">
            <span className="font-black">Arrastra tu video aquí</span> o haz clic para seleccionar
          </p>
          <p className="text-[10px] font-bold text-slate-400">Formatos: .mp4, .mov, .webm</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleInputChange}
            disabled={!geminiReady}
          />
        </div>
      )}

      {/* Processing Progress */}
      {(phase === 'extracting' || phase === 'analyzing') && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <div className="flex-1">
              <p className="text-xs font-extrabold text-slate-900">{statusMessage}</p>
              {selectedFile && <p className="text-[10px] font-bold text-slate-500">{selectedFile.name}</p>}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border border-slate-300">
            <div
              className="h-full rounded-full transition-all duration-300 bg-blue-600"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-xs font-extrabold">
            <span className={phase === 'extracting' ? 'text-blue-600' : 'text-emerald-600'}>
              {phase === 'extracting' ? '🎬 Extrayendo fotogramas...' : '✅ Fotogramas extraídos'}
            </span>
            <span className={phase === 'analyzing' ? 'text-purple-600' : 'text-slate-500'}>
              {phase === 'analyzing' ? '🤖 Analizando con Gemini...' : '⏳ Esperando...'}
            </span>
          </div>

          {/* Detected count so far */}
          {analysisProgress && analysisProgress.results.length > 0 && (
            <p className="text-xs text-emerald-700 font-extrabold">
              ✨ {analysisProgress.results.length} Pokémon detectados hasta ahora...
            </p>
          )}
        </div>
      )}

      {/* Preview Results */}
      {phase === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-emerald-700 font-extrabold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              {statusMessage}
            </p>
            <button onClick={handleReset} className="text-xs text-slate-500 hover:text-slate-900 font-bold transition-colors flex items-center gap-1">
              <X className="w-4 h-4" /> Cancelar
            </button>
          </div>

          {/* Detected Pokémon Table */}
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
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-extrabold text-slate-900 text-sm">{poke.name}</span>
                    <span className="bg-blue-600 text-white text-xs px-2.5 py-0.5 rounded-full font-black">CP {poke.cp}</span>
                    {poke.level !== null && <span className="bg-slate-700 text-white text-xs px-2 py-0.5 rounded-full font-extrabold">Nv.{poke.level}</span>}
                    {poke.ivPercent !== null && <span className="bg-amber-400 text-slate-950 text-xs px-2.5 py-0.5 rounded-full font-black">{poke.ivPercent}%</span>}
                    {poke.isShadow && <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold">💀 Shadow</span>}
                    {poke.isPurified && <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-extrabold">✨ Purificado</span>}
                    {poke.isShiny && <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] px-2 py-0.5 rounded-full font-extrabold flex items-center gap-0.5">🌟 Variocolor</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700 font-bold mt-1">
                    {(() => {
                      const { fastMoves, chargedMoves } = getValidMovesForSpecies(poke.name);
                      return (
                        <>
                          <div className="flex items-center gap-1">
                            <strong className="text-blue-700">R:</strong>
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
                            <strong className="text-purple-700">C:</strong>
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
                              <span>{getSpanishMoveName(poke.chargedMove1) || '?'}{poke.chargedMove2 ? ` / ${getSpanishMoveName(poke.chargedMove2)}` : ''}</span>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  {(poke.ivAtk !== null || poke.ivDef !== null || poke.ivHp !== null) && (
                    <div className="flex items-center gap-3 mt-1 text-xs font-extrabold text-slate-700">
                      {poke.ivAtk !== null && (
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" /> {poke.ivAtk}</span>
                      )}
                      {poke.ivDef !== null && (
                        <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-blue-600" /> {poke.ivDef}</span>
                      )}
                      {poke.ivHp !== null && (
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-emerald-600" /> {poke.ivHp}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {detectedPokemons.length === 0 && (
              <div className="py-8 text-center text-slate-500 text-xs font-medium">
                No se detectaron Pokémon en el video. Intenta con un video más lento o con mejor iluminación.
              </div>
            )}
          </div>

          {/* Import Button */}
          {detectedPokemons.length > 0 && (
            <button
              onClick={handleImportAll}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <Download className="w-4 h-4" />
              Importar {detectedPokemons.length} Pokémon a Mi Caja
            </button>
          )}
        </div>
      )}

      {/* Done State */}
      {phase === 'done' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-600 text-white rounded-2xl flex items-start gap-3 shadow-sm font-extrabold text-xs">
            <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
            <div>
              <p>{statusMessage}</p>
              <p className="text-[11px] text-emerald-100 font-medium mt-1">
                Puedes ir al Generador de Equipos de Incursión y activar "Usar Mi Caja Pokémon" para ver recomendaciones personalizadas.
              </p>
            </div>
          </div>
          <button onClick={handleReset} className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-xl transition-all text-xs">
            Escanear otro video
          </button>
        </div>
      )}

      {/* Error State */}
      {phase === 'error' && (
        <div className="space-y-4">
          <div className="p-4 bg-red-600 text-white rounded-2xl flex items-start gap-3 shadow-sm font-extrabold text-xs">
            <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
          <button onClick={handleReset} className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-xl transition-all text-xs">
            Intentar de nuevo
          </button>
        </div>
      )}
    </div>
  );
};

