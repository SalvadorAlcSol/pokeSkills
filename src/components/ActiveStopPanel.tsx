import React, { useEffect, useState } from 'react';
import {
  Copy,
  CheckCircle2,
  Play,
  SkipForward,
  Clock,
  MapPin,
  Flag,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import { RouteStep } from '../types';

interface ActiveStopPanelProps {
  currentStep: RouteStep | undefined;
  totalSteps: number;
  currentIndex: number;
  onAdvance: () => void;
  onSkip: () => void;
  onCopyCoords: (coords: string) => void;
  finalEtaFormatted: string;
  totalTimeLeftFormatted: string;
}

export const ActiveStopPanel: React.FC<ActiveStopPanelProps> = ({
  currentStep,
  totalSteps,
  currentIndex,
  onAdvance,
  onSkip,
  onCopyCoords,
  finalEtaFormatted,
  totalTimeLeftFormatted,
}) => {
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [alarmFired, setAlarmFired] = useState<boolean>(false);

  // Play audio beep on completion
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // ignore web audio limitations
    }
  };

  useEffect(() => {
    if (!currentStep) return;

    setAlarmFired(false);

    const updateTimer = () => {
      const targetMs = currentStep.plannedTime.getTime();
      const nowMs = Date.now();
      const diff = targetMs - nowMs;

      if (diff <= 0) {
        setTimeLeftMs(0);
        if (!alarmFired && currentIndex > 0) {
          playBeep();
          setAlarmFired(true);
        }
      } else {
        setTimeLeftMs(diff);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentStep, currentIndex]);

  // Format HH:MM:SS
  const formatCountdown = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isCompleted = currentIndex >= totalSteps;
  const isFirstStop = currentIndex === 0;
  const isCooldownOver = timeLeftMs <= 0 || isFirstStop;

  const handleCopy = () => {
    if (!currentStep) return;
    const coordsStr = `${currentStep.stop.lat},${currentStep.stop.lon}`;
    onCopyCoords(coordsStr);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-red-600 p-3 sm:p-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
      <div className="max-w-4xl mx-auto flex flex-col gap-3 font-sans">
        {/* Top bar: ETA Banner */}
        <div className="flex items-center justify-between bg-slate-100 rounded-xl px-4 py-2 border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="text-slate-500 font-bold text-[9px] uppercase tracking-wider block">
                Fin de Ruta ETA
              </span>
              <p className="font-extrabold text-slate-900 text-xs">
                {finalEtaFormatted}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-slate-500 font-bold text-[9px] uppercase tracking-wider block">
              Tiempo Restante
            </span>
            <p className="font-extrabold text-red-600 text-xs">
              {totalTimeLeftFormatted}
            </p>
          </div>
        </div>

        {/* Main active stop details */}
        {isCompleted ? (
          <div className="text-center py-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl">
            <h2 className="text-lg font-black text-emerald-800 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" /> RUTA DE 27 POKÉSTOPS COMPLETADA
            </h2>
            <p className="text-xs text-emerald-700 font-medium mt-1">
              Has visitado todas las ubicaciones de National Trust UK en la ruta optimizada.
            </p>
          </div>
        ) : (
          currentStep && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 shadow-sm">
              {/* Left: Stop Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white bg-red-600 px-2.5 py-0.5 rounded-full shadow-sm">
                    {isFirstStop ? 'PUNTO DE INICIO' : `PARADA ${currentIndex + 1} DE ${totalSteps}`}
                  </span>
                  <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-md truncate border border-slate-300">
                    {currentStep.stop.region}
                  </span>
                  <span className="text-[10px] font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-md border border-pink-300">
                    👾 {currentStep.stop.pkmn}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                  <MapPin className="w-5 h-5 text-red-600 shrink-0" />
                  {currentStep.stop.name}
                </h3>

                <p className="text-xs text-slate-600 mt-0.5">
                  COORDS: <code className="text-slate-900 font-bold bg-slate-200 px-1.5 py-0.5 rounded">{currentStep.stop.lat}, {currentStep.stop.lon}</code>
                  {currentStep.distanceFromPrev > 0 && (
                    <span className="ml-2 text-red-600 font-extrabold">
                      ({currentStep.distanceFromPrev.toFixed(1)} km)
                    </span>
                  )}
                </p>
              </div>

              {/* Right: Countdown Timer */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-2.5 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 border border-slate-300 transition-colors"
                  title={soundEnabled ? 'Sonido activado' : 'Sonido silenciado'}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-rose-600" />
                  )}
                </button>

                <div className="text-right">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block flex items-center justify-end gap-1">
                    <Clock className="w-3.5 h-3.5 text-red-600" /> Cooldown Restante
                  </span>
                  <span
                    className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      isCooldownOver
                        ? 'text-emerald-600'
                        : 'text-red-600 animate-pulse'
                    }`}
                  >
                    {isFirstStop ? '00:00:00' : formatCountdown(timeLeftMs)}
                  </span>
                </div>
              </div>
            </div>
          )
        )}

        {/* Action buttons */}
        {!isCompleted && (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleCopy}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase tracking-tight flex items-center justify-center gap-1.5 border border-slate-300 transition-all shadow-sm"
            >
              <Copy className="w-4 h-4 text-slate-600" />
              Copiar Coords
            </button>

            <button
              onClick={onAdvance}
              className={`col-span-1 py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md ${
                isCooldownOver
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isFirstStop ? (
                <>
                  <Play className="w-4 h-4" /> Iniciar Ruta
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> ¡Giré, Siguiente!
                </>
              )}
            </button>

            <button
              onClick={onSkip}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase tracking-tight flex items-center justify-center gap-1.5 border border-slate-300 transition-all"
            >
              <SkipForward className="w-4 h-4 text-amber-600" />
              Saltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

