import React from 'react';
import {
  X,
  Sparkles,
  TrendingDown,
  Clock,
  Compass,
  CheckCircle,
} from 'lucide-react';
import { RouteMetrics } from '../types';

interface RouteComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalMetrics: RouteMetrics;
  optimizedMetrics: RouteMetrics;
  isOptimized: boolean;
  onApplyOptimized: () => void;
  onApplyOriginal: () => void;
}

export const RouteComparisonModal: React.FC<RouteComparisonModalProps> = ({
  isOpen,
  onClose,
  originalMetrics,
  optimizedMetrics,
  isOptimized,
  onApplyOptimized,
  onApplyOriginal,
}) => {
  if (!isOpen) return null;

  const distSaved = originalMetrics.totalDistanceKm - optimizedMetrics.totalDistanceKm;
  const distSavedPercent = (
    (distSaved / originalMetrics.totalDistanceKm) *
    100
  ).toFixed(1);

  const timeSavedMins =
    originalMetrics.totalDurationMins - optimizedMetrics.totalDurationMins;
  const timeSavedHours = (timeSavedMins / 60).toFixed(1);

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white border-2 border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b-2 border-red-700 flex items-center justify-between bg-gradient-to-r from-red-600 to-red-500 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white border border-white/30 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-wider text-yellow-300">
                Comparativa de Eficiencia de Ruta
              </h3>
              <p className="text-xs text-red-100 font-medium">
                Secuencia Manual vs Algoritmo TSP 2-Opt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700 bg-slate-50">
          {/* Highlights Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-emerald-600 text-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 shadow-inner">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-emerald-100 tracking-wider block">
                  Distancia Ahorrada
                </span>
                <span className="text-lg font-black text-white">
                  -{distSaved.toFixed(1)} km ({distSavedPercent}%)
                </span>
              </div>
            </div>

            <div className="bg-amber-400 text-slate-950 rounded-2xl p-4 flex items-center gap-3 shadow-sm font-bold">
              <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow-md">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-slate-900 tracking-wider block">
                  Tiempo de Viaje Reducido
                </span>
                <span className="text-lg font-black text-slate-950">
                  -{timeSavedMins} mins (~{timeSavedHours}h)
                </span>
              </div>
            </div>
          </div>

          {/* Side-by-side comparison grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Original Route Card */}
            <div
              className={`p-4 rounded-2xl border-2 transition-all bg-white ${
                !isOptimized
                  ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-md'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                  Secuencia Manual
                </h5>
                {!isOptimized && (
                  <span className="text-[10px] bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full font-black uppercase">
                    ACTIVA
                  </span>
                )}
              </div>

              <div className="space-y-2.5 text-xs font-medium">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-1 font-bold">
                    <Compass className="w-4 h-4 text-red-600" /> Distancia:
                  </span>
                  <span className="font-black text-slate-900">
                    {originalMetrics.totalDistanceKm.toFixed(1)} km
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-1 font-bold">
                    <Clock className="w-4 h-4 text-amber-600" /> Cooldowns:
                  </span>
                  <span className="font-black text-slate-900">
                    {originalMetrics.totalCooldownMins} min
                  </span>
                </div>

                <div className="flex justify-between items-center border-t border-slate-200 pt-2 font-bold">
                  <span className="text-slate-900 font-extrabold">Duración Total:</span>
                  <span className="font-black text-amber-600 text-sm">
                    {formatDuration(originalMetrics.totalDurationMins)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onApplyOriginal();
                  onClose();
                }}
                disabled={!isOptimized}
                className={`mt-4 w-full py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase transition-all ${
                  !isOptimized
                    ? 'bg-slate-200 text-slate-500 cursor-default'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                }`}
              >
                {!isOptimized ? 'Ruta Actual' : 'Usar Secuencia Manual'}
              </button>
            </div>

            {/* Optimized Route Card */}
            <div
              className={`p-4 rounded-2xl border-2 transition-all bg-white ${
                isOptimized
                  ? 'border-emerald-600 ring-2 ring-emerald-600/20 shadow-md'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-emerald-600" /> Ruta Optimizada (TSP)
                </h5>
                {isOptimized && (
                  <span className="text-[10px] bg-emerald-600 text-white px-2.5 py-0.5 rounded-full font-black uppercase">
                    ACTIVA
                  </span>
                )}
              </div>

              <div className="space-y-2.5 text-xs font-medium">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-1 font-bold">
                    <Compass className="w-4 h-4 text-emerald-600" /> Distancia:
                  </span>
                  <span className="font-black text-emerald-700">
                    {optimizedMetrics.totalDistanceKm.toFixed(1)} km
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-1 font-bold">
                    <Clock className="w-4 h-4 text-emerald-600" /> Cooldowns:
                  </span>
                  <span className="font-black text-emerald-700">
                    {optimizedMetrics.totalCooldownMins} min
                  </span>
                </div>

                <div className="flex justify-between items-center border-t border-slate-200 pt-2 font-bold">
                  <span className="text-slate-900 font-extrabold">Duración Total:</span>
                  <span className="font-black text-emerald-600 text-sm">
                    {formatDuration(optimizedMetrics.totalDurationMins)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onApplyOptimized();
                  onClose();
                }}
                disabled={isOptimized}
                className={`mt-4 w-full py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase transition-all shadow-sm ${
                  isOptimized
                    ? 'bg-slate-200 text-slate-500 cursor-default'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isOptimized ? 'Ruta Actual' : 'Usar Ruta Optimizada'}
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500 font-bold">
            Estado: {isOptimized ? '⚡ Ruta Optimizada Activa' : '⚠️ Secuencia Manual Activa'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-extrabold transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

