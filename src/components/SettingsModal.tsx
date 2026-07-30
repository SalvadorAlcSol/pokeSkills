import React, { useState } from 'react';
import {
  X,
  Clock,
  MapPin,
  Download,
  Settings as SettingsIcon,
  Check,
  FileCode,
} from 'lucide-react';
import { PlannerSettings, Pokestop } from '../types';
import { generateGPX } from '../utils/pogoMath';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PlannerSettings;
  onSaveSettings: (newSettings: PlannerSettings) => void;
  allStops: Pokestop[];
  activeRouteStops: Pokestop[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  allStops,
  activeRouteStops,
}) => {
  const [calcMode, setCalcMode] = useState<PlannerSettings['calcMode']>(
    settings.calcMode
  );
  const [targetTime, setTargetTime] = useState<string>(settings.targetTime);
  const [farmBufferMins, setFarmBufferMins] = useState<number>(
    settings.farmBufferMins
  );
  const [startStopId, setStartStopId] = useState<number>(settings.startStopId);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      calcMode,
      targetTime,
      farmBufferMins,
      startStopId,
    });
    onClose();
  };

  const handleDownloadGPX = () => {
    const gpxData = generateGPX(activeRouteStops);
    const blob = new Blob([gpxData], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pogo_national_trust_uk_route.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(activeRouteStops, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pogo_national_trust_uk_route.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border-2 border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] font-sans">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b-2 border-red-700 flex items-center justify-between bg-gradient-to-r from-red-600 to-red-500 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white border border-white/30 flex items-center justify-center shadow-inner">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-wider text-yellow-300">
                Planificador & Ajustes de Ruta
              </h3>
              <p className="text-xs text-red-100 font-medium">
                Horarios, punto de inicio y exportación GPX
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
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700 bg-slate-50">
          {/* Mode toggle */}
          <div>
            <label className="block font-extrabold text-slate-900 mb-2 uppercase tracking-wider text-[11px]">
              Modo de Cálculo de Tiempos
            </label>
            <div className="grid grid-cols-2 bg-slate-200 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setCalcMode('start')}
                className={`py-2 px-3 rounded-lg font-extrabold uppercase text-[11px] transition-all ${
                  calcMode === 'start'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Hora de Inicio
              </button>
              <button
                type="button"
                onClick={() => setCalcMode('end')}
                className={`py-2 px-3 rounded-lg font-extrabold uppercase text-[11px] transition-all ${
                  calcMode === 'end'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Hora de Finalización
              </button>
            </div>
          </div>

          {/* Time Picker */}
          <div>
            <label className="block font-extrabold text-slate-900 mb-1.5 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              {calcMode === 'start'
                ? 'Selecciona Hora de Inicio'
                : 'Selecciona Hora de Llegada Deseada'}
            </label>
            <input
              type="time"
              value={targetTime}
              onChange={(e) => setTargetTime(e.target.value)}
              className="w-full bg-white border-2 border-slate-300 rounded-xl p-3 text-base text-slate-900 font-extrabold focus:outline-none focus:border-red-500 shadow-inner"
            />
          </div>

          {/* Start Stop Selection */}
          <div>
            <label className="block font-extrabold text-slate-900 mb-1.5 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-600" />
              Punto de Inicio de la Ruta
            </label>
            <select
              value={startStopId}
              onChange={(e) => setStartStopId(Number(e.target.value))}
              className="w-full bg-white border-2 border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-bold focus:outline-none focus:border-red-500 shadow-inner"
            >
              {allStops.map((stop, idx) => (
                <option key={stop.id} value={stop.id}>
                  #{idx + 1} - {stop.name} ({stop.region})
                </option>
              ))}
            </select>
          </div>

          {/* Buffer time */}
          <div>
            <label className="block font-extrabold text-slate-900 mb-1.5 uppercase tracking-wider text-[11px]">
              Tiempo de Permanencia por PokéStop (Minutos)
            </label>
            <input
              type="number"
              min="0"
              max="15"
              value={farmBufferMins}
              onChange={(e) => setFarmBufferMins(Number(e.target.value))}
              className="w-full bg-white border-2 border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-bold focus:outline-none focus:border-red-500 shadow-inner"
            />
          </div>

          {/* Export Section */}
          <div className="pt-3 border-t border-slate-200">
            <label className="block font-extrabold text-slate-900 mb-2 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-600" />
              Exportar Ruta Activa
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadGPX}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <FileCode className="w-4 h-4" /> GPX (GPS Bot)
              </button>
              <button
                type="button"
                onClick={handleDownloadJSON}
                className="py-2.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs flex items-center justify-center gap-1.5 border border-slate-300 transition-all"
              >
                <Download className="w-4 h-4" /> JSON Data
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-extrabold transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md"
          >
            <Check className="w-4 h-4" /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
