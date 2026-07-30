import { Pokestop, RouteStep, PlannerSettings, RouteMetrics } from '../types';

/**
 * Calculates straight-line distance in km between two lat/lon points using Haversine formula
 */
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Standard Pokémon GO Cooldown Table (distance in km -> cooldown in minutes)
 */
export function getCooldownMinutes(distanceKm: number): number {
  if (distanceKm < 1) return 0.5;
  if (distanceKm <= 2) return 1;
  if (distanceKm <= 4) return 2;
  if (distanceKm <= 7) return 5;
  if (distanceKm <= 10) return 6;
  if (distanceKm <= 15) return 8;
  if (distanceKm <= 20) return 10;
  if (distanceKm <= 25) return 11;
  if (distanceKm <= 35) return 14;
  if (distanceKm <= 45) return 17;
  if (distanceKm <= 60) return 20;
  if (distanceKm <= 70) return 23;
  if (distanceKm <= 80) return 26;
  if (distanceKm <= 100) return 35;
  if (distanceKm <= 250) {
    return Math.min(65, 35 + ((distanceKm - 100) / 150) * 30);
  }
  // Max cap 2 hours (120 min) for teleporting long distance > 250km (e.g., across Irish Sea)
  return 120;
}

/**
 * Calculates total edge cost (cooldown time + distance tiebreaker) for a path
 */
function calculateTotalRouteCost(path: Pokestop[]): number {
  let totalDist = 0;
  let totalCd = 0;
  for (let i = 1; i < path.length; i++) {
    const d = getDistance(path[i - 1].lat, path[i - 1].lon, path[i].lat, path[i].lon);
    totalDist += d;
    totalCd += Math.ceil(getCooldownMinutes(d));
  }
  return totalCd * 100 + totalDist;
}

/**
 * Runs 2-Opt improvement on a given path while keeping path[0] fixed as the starting point
 */
function run2OptForStart(initialPath: Pokestop[]): Pokestop[] {
  if (initialPath.length <= 2) return [...initialPath];
  let bestPath = [...initialPath];
  let bestCost = calculateTotalRouteCost(bestPath);
  let improved = true;
  let iterations = 0;

  while (improved && iterations < 100) {
    improved = false;
    iterations++;

    for (let i = 1; i < bestPath.length - 1; i++) {
      for (let j = i + 1; j < bestPath.length; j++) {
        const candidate = [
          ...bestPath.slice(0, i),
          ...bestPath.slice(i, j + 1).reverse(),
          ...bestPath.slice(j + 1),
        ];
        const cost = calculateTotalRouteCost(candidate);
        if (cost < bestCost - 0.01) {
          bestCost = cost;
          bestPath = candidate;
          improved = true;
        }
      }
    }
  }
  return bestPath;
}

/**
 * Solves the Traveling Salesperson Problem (TSP) using Nearest Neighbor + 2-Opt Optimization
 */
export function solveTSP(allStops: Pokestop[], startStopIndexInList: number = 0): Pokestop[] {
  if (allStops.length <= 2) return [...allStops];

  const validStartIdx =
    startStopIndexInList >= 0 && startStopIndexInList < allStops.length
      ? startStopIndexInList
      : 0;
  const startStop = allStops[validStartIdx];

  const candidateInitialPaths: Pokestop[][] = [];

  // Candidate 1: Nearest Neighbor by getEdgeCost
  {
    const unvisited = [...allStops];
    const first = unvisited.splice(validStartIdx, 1)[0];
    const path: Pokestop[] = [first];

    while (unvisited.length > 0) {
      const current = path[path.length - 1];
      let nearestIdx = 0;
      let minCost = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const dist = getDistance(current.lat, current.lon, unvisited[i].lat, unvisited[i].lon);
        const cd = getCooldownMinutes(dist);
        const cost = cd * 100 + dist;
        if (cost < minCost) {
          minCost = cost;
          nearestIdx = i;
        }
      }
      path.push(unvisited.splice(nearestIdx, 1)[0]);
    }
    candidateInitialPaths.push(path);
  }

  // Candidate 2: Nearest Neighbor by pure Haversine distance
  {
    const unvisited = [...allStops];
    const first = unvisited.splice(validStartIdx, 1)[0];
    const path: Pokestop[] = [first];

    while (unvisited.length > 0) {
      const current = path[path.length - 1];
      let nearestIdx = 0;
      let minDist = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const dist = getDistance(current.lat, current.lon, unvisited[i].lat, unvisited[i].lon);
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = i;
        }
      }
      path.push(unvisited.splice(nearestIdx, 1)[0]);
    }
    candidateInitialPaths.push(path);
  }

  // Optimize each candidate with 2-Opt and pick the one with lowest overall cost
  let bestOptimizedPath: Pokestop[] = candidateInitialPaths[0];
  let minOverallCost = Infinity;

  for (const candidate of candidateInitialPaths) {
    const optimized = run2OptForStart(candidate);
    const cost = calculateTotalRouteCost(optimized);
    if (cost < minOverallCost) {
      minOverallCost = cost;
      bestOptimizedPath = optimized;
    }
  }

  return bestOptimizedPath;
}

/**
 * Build RouteStep array and compute metrics
 */
export function generateScheduleSteps(
  stopsSequence: Pokestop[],
  settings: PlannerSettings,
  currentIndex: number = 0,
  referenceDate?: Date
): { steps: RouteStep[]; metrics: RouteMetrics } {
  const steps: RouteStep[] = [];
  const baseDate = referenceDate || new Date();

  // Parse time input "HH:MM"
  const [hours, mins] = settings.targetTime.split(':').map(Number);
  const targetDate = new Date(baseDate);
  targetDate.setHours(hours || 0, mins || 0, 0, 0);

  let currentMs = targetDate.getTime();
  let totalDistanceKm = 0;
  let totalCooldownMins = 0;

  if (settings.calcMode === 'start') {
    // Forward calculation from start time
    for (let i = 0; i < stopsSequence.length; i++) {
      let dist = 0;
      let cd = 0;

      if (i > 0) {
        const prev = stopsSequence[i - 1];
        const curr = stopsSequence[i];
        dist = getDistance(prev.lat, prev.lon, curr.lat, curr.lon);
        cd = Math.ceil(getCooldownMinutes(dist));
        totalDistanceKm += dist;
        totalCooldownMins += cd;

        // Add cooldown + farm buffer
        currentMs += (cd + settings.farmBufferMins) * 60000;
      }

      let status: RouteStep['status'] = 'pending';
      if (i < currentIndex) status = 'done';
      else if (i === currentIndex) status = 'active';

      steps.push({
        stop: stopsSequence[i],
        distanceFromPrev: dist,
        cooldownFromPrev: cd,
        plannedTime: new Date(currentMs),
        status,
      });
    }
  } else {
    // Backward calculation from desired end time
    const tempSteps: RouteStep[] = [];
    let endMs = targetDate.getTime();

    for (let i = stopsSequence.length - 1; i >= 0; i--) {
      let dist = 0;
      let cd = 0;

      if (i > 0) {
        const prev = stopsSequence[i - 1];
        const curr = stopsSequence[i];
        dist = getDistance(prev.lat, prev.lon, curr.lat, curr.lon);
        cd = Math.ceil(getCooldownMinutes(dist));
        totalDistanceKm += dist;
        totalCooldownMins += cd;
      }

      let status: RouteStep['status'] = 'pending';
      if (i < currentIndex) status = 'done';
      else if (i === currentIndex) status = 'active';

      tempSteps.unshift({
        stop: stopsSequence[i],
        distanceFromPrev: dist,
        cooldownFromPrev: cd,
        plannedTime: new Date(endMs),
        status,
      });

      if (i > 0) {
        endMs -= (cd + settings.farmBufferMins) * 60000;
      }
    }
    steps.push(...tempSteps);
  }

  const farmTimeMins = (stopsSequence.length - 1) * settings.farmBufferMins;
  const totalDurationMins = totalCooldownMins + farmTimeMins;
  const startTime = steps[0]?.plannedTime || new Date();
  const endTime = steps[steps.length - 1]?.plannedTime || new Date();

  return {
    steps,
    metrics: {
      totalDistanceKm,
      totalCooldownMins,
      totalFarmTimeMins: farmTimeMins,
      totalDurationMins,
      startTime,
      endTime,
    },
  };
}

/**
 * Generate GPX string for joystick/GPS spoofing import
 */
export function generateGPX(stops: Pokestop[]): string {
  const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="PoGo UK Route Tracker" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>PoGo National Trust UK Route</name>
    <trkseg>`;

  const points = stops
    .map(
      (s, idx) => `      <trkpt lat="${s.lat}" lon="${s.lon}">
        <name>${idx + 1}. ${s.name} (${s.pkmn})</name>
      </trkpt>`
    )
    .join('\n');

  const gpxFooter = `
    </trkseg>
  </trk>
</gpx>`;

  return `${gpxHeader}\n${points}\n${gpxFooter}`;
}
