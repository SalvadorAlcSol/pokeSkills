export interface Pokestop {
  id: number;
  name: string;
  lat: number;
  lon: number;
  region: 'Southern England Coast' | 'Midlands and London' | 'North' | 'South West and Wales';
  pkmn: 'Hoppip' | 'Sewaddle' | 'Pineco' | 'Seedot';
  county?: string;
  notes?: string;
}

export interface RouteStep {
  stop: Pokestop;
  distanceFromPrev: number; // in km
  cooldownFromPrev: number; // in minutes
  plannedTime: Date;
  status: 'pending' | 'active' | 'done' | 'skipped';
}

export type CalcMode = 'start' | 'end';

export interface PlannerSettings {
  calcMode: CalcMode;
  targetTime: string; // "HH:MM"
  farmBufferMins: number; // buffer time spent at each stop (e.g. 1 min)
  startStopId: number; // 0..26 or custom
  customStartCoords?: { lat: number; lon: number };
}

export interface RouteMetrics {
  totalDistanceKm: number;
  totalCooldownMins: number;
  totalFarmTimeMins: number;
  totalDurationMins: number;
  startTime: Date;
  endTime: Date;
}
