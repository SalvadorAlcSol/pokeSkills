import React from 'react';
import {
  X,
  HelpCircle,
  Sparkles,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white border-2 border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b-2 border-red-700 flex items-center justify-between bg-gradient-to-r from-red-600 to-red-500 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white border border-white/30 flex items-center justify-center shadow-inner">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-wider text-yellow-300">
                Análisis y Guía de Operación
              </h3>
              <p className="text-xs text-red-100 font-medium">
                Optimización de Ruta Pokémon GO (27 PokéStops)
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

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700 bg-slate-50 leading-relaxed">
          {/* Section 1: How it works */}
          <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm space-y-2">
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-red-600" />
              1. ¿Cómo Funciona la Aplicación?
            </h4>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 pl-1 font-medium">
              <li>
                <strong>Algoritmo TSP (2-Opt)</strong>: Reordena automáticamente las 27 PokéStops para reducir la distancia total recorrida a ~1,420 km (-730 km menos).
              </li>
              <li>
                <strong>Simulación de Cooldown Oficial</strong>: Mapea distancias a tiempos de espera oficial (desde 30s hasta 2h máximo).
              </li>
              <li>
                <strong>Exportación GPX</strong>: Carga directa para GPS Joystick y PGSharp.
              </li>
            </ul>
          </div>

          {/* Section 2: Safety & Improvements */}
          <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm space-y-2">
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-600" />
              2. Ventajas Clave de la Optimización
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-extrabold text-slate-900 block mb-1 flex items-center gap-1 text-[11px] uppercase">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Reducción de ~5 Horas
                </span>
                El tiempo total se reduce significativamente optimizando saltos entre paradas.
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-extrabold text-slate-900 block mb-1 flex items-center gap-1 text-[11px] uppercase">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Inicio Personalizable
                </span>
                Calcula la ruta partiendo desde cualquier PokéStop elegida en los ajustes.
              </div>
            </div>
          </div>

          {/* Section 3: Safety recommendation */}
          <div className="bg-amber-400 text-slate-950 p-4 rounded-2xl border-2 border-amber-500 shadow-sm space-y-2 font-bold">
            <h4 className="font-black text-sm uppercase tracking-wider text-slate-950 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-slate-950" />
              3. Recomendación para Entrenadores
            </h4>
            <p className="text-slate-950 font-extrabold leading-relaxed">
              Respetar el tiempo de Cooldown entre paradas para mantener protegida la cuenta del jugador durante el evento.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs transition-all shadow-md"
          >
            Entendido, Volver a la App
          </button>
        </div>
      </div>
    </div>
  );
};

