import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RouteStep } from '../types';

interface MapComponentProps {
  steps: RouteStep[];
  currentIndex: number;
  onSelectStep?: (index: number) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  steps,
  currentIndex,
  onSelectStep,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineDoneRef = useRef<L.Polyline | null>(null);
  const polylinePendingRef = useRef<L.Polyline | null>(null);

  // Helper for custom SVG div icons
  const createMarkerIcon = (stepIndex: number, status: RouteStep['status'], pkmn: string) => {
    let color = '#64748b'; // slate
    let size = 24;
    let border = '2px solid #334155';
    let zIndex = 10;

    if (status === 'done') {
      color = '#10b981'; // emerald
      border = '2px solid #064e3b';
      zIndex = 20;
    } else if (status === 'active') {
      color = '#3b82f6'; // blue
      size = 32;
      border = '3px solid #ffffff';
      zIndex = 100;
    } else if (status === 'skipped') {
      color = '#f59e0b'; // amber
    }

    const html = `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: ${border};
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${size > 28 ? '12px' : '10px'};
        font-family: sans-serif;
        ${status === 'active' ? 'animation: pulse 1.5s infinite;' : ''}
      ">
        ${stepIndex + 1}
      </div>
    `;

    return L.divIcon({
      className: 'custom-leaflet-marker',
      html,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create Leaflet map
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([52.5, -1.8], 6);

    // Dark carto tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Polylines whenever steps or currentIndex change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || steps.length === 0) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Clear old polylines
    if (polylineDoneRef.current) polylineDoneRef.current.remove();
    if (polylinePendingRef.current) polylinePendingRef.current.remove();

    const allCoords: [number, number][] = [];
    const doneCoords: [number, number][] = [];
    const pendingCoords: [number, number][] = [];

    steps.forEach((step, idx) => {
      const coord: [number, number] = [step.stop.lat, step.stop.lon];
      allCoords.push(coord);

      if (idx <= currentIndex) {
        doneCoords.push(coord);
      }
      if (idx >= currentIndex) {
        pendingCoords.push(coord);
      }

      // Create Marker
      const icon = createMarkerIcon(idx, step.status, step.stop.pkmn);
      const marker = L.marker(coord, { icon }).addTo(map);

      // Popup
      const popupContent = `
        <div style="font-family: sans-serif; color: #0f172a; padding: 2px;">
          <strong style="font-size: 13px;">#${idx + 1}. ${step.stop.name}</strong><br/>
          <span style="font-size: 11px; color: #475569;">Región: ${step.stop.region}</span><br/>
          <span style="font-size: 11px; color: #2563eb; font-weight: bold;">Raid / Spawns: ${step.stop.pkmn}</span><br/>
          ${
            step.distanceFromPrev > 0
              ? `<span style="font-size: 10px; color: #059669;">CD: ${step.cooldownFromPrev} min (${step.distanceFromPrev.toFixed(1)} km)</span>`
              : `<span style="font-size: 10px; color: #6b7280;">Punto de Inicio</span>`
          }
        </div>
      `;
      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectStep) onSelectStep(idx);
      });

      markersRef.current.push(marker);
    });

    // Draw Polyline for completed legs (Emerald)
    if (doneCoords.length > 1) {
      polylineDoneRef.current = L.polyline(doneCoords, {
        color: '#10b981',
        weight: 4,
        opacity: 0.9,
      }).addTo(map);
    }

    // Draw Polyline for remaining legs (Blue dashed)
    if (pendingCoords.length > 1) {
      polylinePendingRef.current = L.polyline(pendingCoords, {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.7,
        dashArray: '6, 8',
      }).addTo(map);
    }

    // Pan / Fly map to active stop or fit bounds on load
    const activeStep = steps[currentIndex];
    if (activeStep) {
      map.flyTo([activeStep.stop.lat, activeStep.stop.lon], 9, {
        duration: 1.2,
      });
    } else if (allCoords.length > 0) {
      map.fitBounds(L.latLngBounds(allCoords), { padding: [30, 30] });
    }
  }, [steps, currentIndex, onSelectStep]);

  return (
    <div className="relative w-full h-[32vh] min-h-[220px] max-h-[380px] border-b border-blue-500/20 bg-[#05070A] overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Map Legend Floating Tag */}
      <div className="absolute top-3 left-3 z-20 bg-[#0A0F1A]/90 backdrop-blur border border-blue-500/30 rounded px-2.5 py-1.5 text-[10px] font-mono text-cyan-200 flex items-center gap-3 shadow-[0_4px_15px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          <span>COMPLETADAS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse inline-block shadow-[0_0_8px_rgba(56,189,248,0.8)]"></span>
          <span>PARADA ACTUAL</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600/60 inline-block"></span>
          <span>PENDIENTES</span>
        </div>
      </div>
    </div>
  );
};
