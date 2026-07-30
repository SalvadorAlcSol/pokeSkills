import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './Header';
import { MapComponent } from './MapComponent';
import { ActiveStopPanel } from './ActiveStopPanel';
import { ItineraryList } from './ItineraryList';
import { SettingsModal } from './SettingsModal';
import { RouteComparisonModal } from './RouteComparisonModal';
import { AnalysisModal } from './AnalysisModal';
import {
  NATIONAL_TRUST_STOPS,
  INITIAL_USER_SEQUENCE_IDS,
} from '../data/nationalTrustStops';
import {
  solveTSP,
  generateScheduleSteps,
} from '../utils/pogoMath';
import { PlannerSettings, Pokestop } from '../types';
import { Check, Info, AlertTriangle } from 'lucide-react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'warning' | 'info';
}

interface RouteTrackerProps {
  onBackToHub?: () => void;
}

export const RouteTracker: React.FC<RouteTrackerProps> = ({ onBackToHub }) => {
  // 1. Initial User Sequence
  const initialUserSequence = useMemo(() => {
    return INITIAL_USER_SEQUENCE_IDS.map(
      (id) => NATIONAL_TRUST_STOPS.find((s) => s.id === id) || NATIONAL_TRUST_STOPS[0]
    );
  }, []);

  // 2. State & Persistence
  const now = new Date();
  const defaultTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  const [isOptimized, setIsOptimized] = useState<boolean>(() => {
    const saved = localStorage.getItem('pogo_is_optimized');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [activeSequence, setActiveSequence] = useState<Pokestop[]>(() => {
    const saved = localStorage.getItem('pogo_active_sequence');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    const startIdx = NATIONAL_TRUST_STOPS.findIndex((s) => s.id === 25);
    return solveTSP(NATIONAL_TRUST_STOPS, startIdx >= 0 ? startIdx : 0);
  });

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    const saved = localStorage.getItem('pogo_current_index');
    return saved !== null ? Number(saved) : 0;
  });

  const [settings, setSettings] = useState<PlannerSettings>(() => {
    const saved = localStorage.getItem('pogo_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return {
      calcMode: 'start',
      targetTime: defaultTimeStr,
      farmBufferMins: 1,
      startStopId: 25,
    };
  });

  // Modal States
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState<boolean>(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Save states to localStorage on change
  useEffect(() => {
    localStorage.setItem('pogo_is_optimized', JSON.stringify(isOptimized));
  }, [isOptimized]);

  useEffect(() => {
    localStorage.setItem('pogo_active_sequence', JSON.stringify(activeSequence));
  }, [activeSequence]);

  useEffect(() => {
    localStorage.setItem('pogo_current_index', currentIndex.toString());
  }, [currentIndex]);

  useEffect(() => {
    localStorage.setItem('pogo_settings', JSON.stringify(settings));
  }, [settings]);

  // 3. Compute Schedule Steps & Metrics for Active Route
  const { steps, metrics } = useMemo(() => {
    return generateScheduleSteps(activeSequence, settings, currentIndex);
  }, [activeSequence, settings, currentIndex]);

  // 4. Compute Metrics for Original vs TSP Optimized Comparison
  const originalSequenceSteps = useMemo(() => {
    return generateScheduleSteps(initialUserSequence, settings, 0);
  }, [initialUserSequence, settings]);

  const optimizedSequenceStops = useMemo(() => {
    const startIdxInList = NATIONAL_TRUST_STOPS.findIndex(
      (s) => s.id === settings.startStopId
    );
    return solveTSP(
      NATIONAL_TRUST_STOPS,
      startIdxInList >= 0 ? startIdxInList : 0
    );
  }, [settings.startStopId]);

  const optimizedSequenceSteps = useMemo(() => {
    return generateScheduleSteps(optimizedSequenceStops, settings, 0);
  }, [optimizedSequenceStops, settings]);

  // 5. Actions
  const handleOptimize = () => {
    setActiveSequence(optimizedSequenceStops);
    setIsOptimized(true);
    setCurrentIndex(0);
    showToast('Ruta optimizada con algoritmo TSP 2-Opt (-700+ km ahorrados)', 'success');
  };

  const handleApplyOriginal = () => {
    setActiveSequence(initialUserSequence);
    setIsOptimized(false);
    setCurrentIndex(0);
    showToast('Secuencia original aplicada', 'info');
  };

  const handleSaveSettings = (newSettings: PlannerSettings) => {
    setSettings(newSettings);
    if (newSettings.startStopId !== settings.startStopId) {
      const startIdxInList = NATIONAL_TRUST_STOPS.findIndex(
        (s) => s.id === newSettings.startStopId
      );
      const newPath = solveTSP(
        NATIONAL_TRUST_STOPS,
        startIdxInList >= 0 ? startIdxInList : 0
      );
      setActiveSequence(newPath);
      setIsOptimized(true);
      setCurrentIndex(0);
    }
    showToast('Configuración y tiempos actualizados', 'success');
  };

  const handleAdvance = () => {
    if (currentIndex < activeSequence.length) {
      setCurrentIndex((prev) => prev + 1);
      showToast('¡Parada registrada! Cooldown iniciado para el siguiente paso.', 'success');
    }
  };

  const handleSkip = () => {
    if (currentIndex < activeSequence.length) {
      setCurrentIndex((prev) => prev + 1);
      showToast('Parada omitida. Avanzando a la siguiente...', 'warning');
    }
  };

  const handleSelectStep = (idx: number) => {
    setCurrentIndex(idx);
    const stopName = activeSequence[idx]?.name || '';
    showToast(`Enfocando parada #${idx + 1}: ${stopName}`, 'info');
  };

  const handleCopyCoords = (coords: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(coords)
        .then(() => {
          showToast(`Coordenadas copiadas: ${coords}`, 'success');
        })
        .catch(() => fallbackCopy(coords));
    } else {
      fallbackCopy(coords);
    }
  };

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) showToast(`Coordenadas copiadas: ${text}`, 'success');
      else showToast('Error al copiar coordenadas', 'warning');
    } catch {
      showToast('Error al copiar', 'warning');
    }
    document.body.removeChild(textArea);
  };

  const handleResetProgress = () => {
    setCurrentIndex(0);
    showToast('Progreso reiniciado al inicio de la ruta', 'info');
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-800 flex flex-col font-sans">
      {/* Toast Notifications Overlay */}
      <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none font-sans">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-2xl shadow-lg border-2 text-xs font-extrabold flex items-center gap-2.5 transition-all transform translate-x-0 ${
              t.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : t.type === 'warning'
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-red-50 text-red-900 border-red-300'
            }`}
          >
            {t.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : t.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            ) : (
              <Info className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{t.message}</span>
          </div>
        ))}
      </div>


      {/* Main Header */}
      <Header
        metrics={metrics}
        isOptimized={isOptimized}
        onOptimize={handleOptimize}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenComparison={() => setIsComparisonOpen(true)}
        onOpenAnalysis={() => setIsAnalysisOpen(true)}
        onReset={handleResetProgress}
        onBackToHub={onBackToHub}
      />

      {/* Main Body Layout */}
      <main className="flex-1 flex flex-col">
        {/* Leaflet Map Area */}
        <MapComponent
          steps={steps}
          currentIndex={currentIndex}
          onSelectStep={handleSelectStep}
        />

        {/* Itinerary & Controls Section */}
        <div className="max-w-7xl mx-auto w-full px-4 pt-4 flex-1 flex flex-col gap-4">
          <ActiveStopPanel
            steps={steps}
            currentIndex={currentIndex}
            stops={activeSequence}
            onAdvance={handleAdvance}
            onSkip={handleSkip}
            onCopyCoords={handleCopyCoords}
          />

          <ItineraryList
            steps={steps}
            currentIndex={currentIndex}
            onSelectStep={handleSelectStep}
            onCopyCoords={handleCopyCoords}
          />
        </div>
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        stops={NATIONAL_TRUST_STOPS}
        onSave={handleSaveSettings}
      />

      <RouteComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        originalSteps={originalSequenceSteps.steps}
        originalMetrics={originalSequenceSteps.metrics}
        optimizedSteps={optimizedSequenceSteps.steps}
        optimizedMetrics={optimizedSequenceSteps.metrics}
        isCurrentlyOptimized={isOptimized}
        onApplyOptimized={handleOptimize}
        onApplyOriginal={handleApplyOriginal}
      />

      <AnalysisModal
        isOpen={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
      />
    </div>
  );
};
