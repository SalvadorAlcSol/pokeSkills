import React, { useState } from 'react';
import {
  Search,
  CheckCircle,
  Clock,
  Copy,
  MapPin,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { RouteStep } from '../types';

interface ItineraryListProps {
  steps: RouteStep[];
  currentIndex: number;
  onSelectStep: (index: number) => void;
  onCopyCoords: (coords: string) => void;
}

export const ItineraryList: React.FC<ItineraryListProps> = ({
  steps,
  currentIndex,
  onSelectStep,
  onCopyCoords,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');

  const filteredSteps = steps.filter((step) => {
    const matchesSearch =
      step.stop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      step.stop.county?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      step.stop.pkmn.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRegion =
      selectedRegion === 'ALL' || step.stop.region === selectedRegion;

    return matchesSearch && matchesRegion;
  });

  const regions = [
    'ALL',
    'Southern England Coast',
    'Midlands and London',
    'North',
    'South West and Wales',
  ];

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 shadow-md mb-36">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-600" />
            Itinerario de la Ruta ({steps.length} PokéStops)
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Haz clic en cualquier parada para enfocarla en el mapa o copiar coordenadas
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64 font-sans">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o Pokémon..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-red-500 focus:bg-white transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Region Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none text-xs font-sans">
        {regions.map((r) => (
          <button
            key={r}
            onClick={() => setSelectedRegion(r)}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold tracking-wider whitespace-nowrap transition-all ${
              selectedRegion === r
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
            }`}
          >
            {r === 'ALL' ? 'Todas las Regiones' : r}
          </button>
        ))}
      </div>

      {/* Stops List */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {filteredSteps.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs font-medium">
            No se encontraron paradas con ese filtro.
          </div>
        ) : (
          filteredSteps.map((step) => {
            const indexInFullList = steps.findIndex(
              (s) => s.stop.id === step.stop.id
            );
            const isActive = indexInFullList === currentIndex;
            const isPast = indexInFullList < currentIndex;

            let cardStyle =
              'border-slate-200 bg-white hover:bg-slate-50 hover:border-red-300 text-slate-800 shadow-sm';
            if (isActive) {
              cardStyle =
                'border-2 border-red-500 bg-red-50/70 text-slate-900 shadow-md ring-2 ring-red-300';
            } else if (isPast) {
              cardStyle = 'border-slate-100 bg-slate-50 text-slate-400 opacity-60';
            }

            return (
              <div
                key={step.stop.id}
                id={`stop-card-${indexInFullList}`}
                onClick={() => onSelectStep(indexInFullList)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${cardStyle}`}
              >
                {/* Left: Step number & Stop Info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      isActive
                        ? 'bg-red-600 text-white shadow-sm'
                        : isPast
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-300'
                    }`}
                  >
                    {isPast ? <CheckCircle className="w-4 h-4" /> : indexInFullList + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="text-xs font-extrabold text-slate-900 truncate">
                        {step.stop.name}
                      </span>
                      {isActive && (
                        <span className="text-[10px] uppercase font-black bg-red-600 text-white px-2 py-0.5 rounded-full">
                          ACTUAL
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                      <span>{step.stop.county}</span>
                      <span>•</span>
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        👾 {step.stop.pkmn}
                      </span>
                      {step.distanceFromPrev > 0 && (
                        <>
                          <span>•</span>
                          <span className="font-bold text-red-600">
                            {step.distanceFromPrev.toFixed(1)} km
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Times & Coords Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Llegada ETA
                    </span>
                    <span className="text-xs font-extrabold text-slate-800">
                      {step.plannedTime.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {step.cooldownFromPrev !== undefined && (
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] font-bold uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 block">
                        ⏱️ {step.cooldownFromPrev}m CD
                      </span>
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyCoords(`${step.stop.lat},${step.stop.lon}`);
                    }}
                    title="Copiar Coordenadas GPS"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-700 transition-colors border border-slate-200"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
