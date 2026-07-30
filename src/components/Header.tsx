import React from 'react';
import {
  MapPin,
  Settings,
  Sparkles,
  BarChart2,
  HelpCircle,
  RotateCcw,
  Clock,
  Compass,
  ArrowLeft,
} from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { RouteMetrics } from '../types';

interface HeaderProps {
  metrics: RouteMetrics;
  isOptimized: boolean;
  onOptimize: () => void;
  onOpenSettings: () => void;
  onOpenComparison: () => void;
  onOpenAnalysis: () => void;
  onReset: () => void;
  onBackToHub?: () => void;
}

const PokeballIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white" />
    <path d="M2 12H22" stroke="currentColor" strokeWidth="2" />
    <path d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12H2Z" fill="#DC2626" />
    <circle cx="12" cy="12" r="3" fill="white" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="1" fill="#334155" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({
  metrics,
  isOptimized,
  onOptimize,
  onOpenSettings,
  onOpenComparison,
  onOpenAnalysis,
  onReset,
  onBackToHub,
}) => {
  const hours = Math.floor(metrics.totalDurationMins / 60);
  const mins = metrics.totalDurationMins % 60;

  return (
    <header className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 border-b-4 border-red-700 text-white px-4 py-3 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand Title & Back to Hub */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToHub && (
              <button
                onClick={onBackToHub}
                className="px-3 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-red-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm mr-1"
                title="Volver al Menú del Hub"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Hub</span>
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/40 flex items-center justify-center text-white shrink-0 shadow-inner">
              <PokeballIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                  ROUTE TRACKER
                </h1>
                <span className="text-[10px] uppercase font-extrabold text-red-900 bg-yellow-400 px-2 py-0.5 rounded-full">
                  PoGo PRO
                </span>
              </div>
              <p className="text-[11px] font-medium text-red-100 mt-0.5 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                27 POKÉSTOPS NACIONALES
              </p>
            </div>
          </div>

          {/* Quick actions for mobile */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={onOptimize}
              title="Optimizar Ruta con 2-Opt TSP"
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                isOptimized
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-yellow-400 text-red-900 hover:bg-yellow-300 shadow-sm'
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-white/20 text-white border border-white/30 hover:bg-white/30"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Route Quick Metrics */}
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-2 px-4 border border-white/20 text-xs shadow-inner">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-yellow-300" />
            <div>
              <span className="text-red-100 block text-[9px] font-bold uppercase tracking-wider">
                Distancia Total
              </span>
              <span className="font-extrabold text-white text-xs">
                {metrics.totalDistanceKm.toFixed(1)} <span className="text-[10px] text-yellow-200">KM</span>
              </span>
            </div>
          </div>

          <div className="w-[1px] h-7 bg-red-400/40" />

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-300" />
            <div>
              <span className="text-red-100 block text-[9px] font-bold uppercase tracking-wider">
                Tiempo Estimado
              </span>
              <span className="font-extrabold text-white text-xs">
                {hours}H {mins.toString().padStart(2, '0')}M
              </span>
            </div>
          </div>

          <div className="w-[1px] h-7 bg-red-400/40 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2">
            <div className="text-right">
              <span className="text-red-100 block text-[9px] font-bold uppercase tracking-wider">
                Algoritmo Ruta
              </span>
              <span
                className={`font-extrabold text-[10px] uppercase tracking-wider ${
                  isOptimized ? 'text-emerald-300' : 'text-yellow-300'
                }`}
              >
                {isOptimized ? '⚡ TSP 2-OPT ACTIVADO' : '⚠️ SECUENCIA MANUAL'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons (Desktop) */}
        <div className="hidden md:flex items-center gap-2 font-sans">
          <button
            onClick={onOptimize}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-tight flex items-center gap-1.5 transition-all shadow-sm ${
              isOptimized
                ? 'bg-emerald-500 text-white border border-emerald-400'
                : 'bg-yellow-400 hover:bg-yellow-300 text-red-950 border border-yellow-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isOptimized ? 'Re-optimizar (TSP)' : 'Optimizar (TSP)'}
          </button>

          <button
            onClick={onOpenComparison}
            className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 text-xs font-bold uppercase tracking-tight flex items-center gap-1.5 transition-all"
          >
            <BarChart2 className="w-3.5 h-3.5 text-yellow-300" />
            Comparativa
          </button>

          <button
            onClick={onOpenAnalysis}
            className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 text-xs font-bold uppercase tracking-tight flex items-center gap-1.5 transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5 text-yellow-300" />
            Análisis
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all"
            title="Configuración de tiempos y punto de inicio"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onReset}
            className="p-1.5 rounded-xl bg-red-800/40 hover:bg-red-800/60 text-white border border-red-400/40 transition-all"
            title="Reiniciar progreso"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Language Selector */}
          <LanguageSelector className="ml-1" />
        </div>
      </div>
    </header>
  );
};

