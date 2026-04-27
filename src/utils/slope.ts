import { RoutePoint, SurfaceType } from "@/types/route";

/**
 * Applies a symmetric moving average to the elevation field of a route.
 * Eliminates GPS noise spikes that cause flickery colour changes on the map.
 *
 * @param points   Source route points (not mutated)
 * @param window   Half-window radius (total samples = 2*window+1)
 */
export function smoothElevations(points: RoutePoint[], window = 3): RoutePoint[] {
  if (points.length < 3) return points;
  return points.map((pt, idx) => {
    const lo = Math.max(0, idx - window);
    const hi = Math.min(points.length - 1, idx + window);
    let sum = 0;
    for (let k = lo; k <= hi; k++) sum += points[k].elevation;
    return { ...pt, elevation: sum / (hi - lo + 1) };
  });
}

/**
 * Removes unrealistic elevation spikes (outliers) from the route.
 * Compares each point to its neighbors and caps impossible jumps.
 */
export function filterElevationOutliers(points: RoutePoint[], thresholdMeters = 8): RoutePoint[] {
  if (points.length < 3) return points;
  const result = [...points];

  // Run 2 passes to handle adjacent spikes
  for (let pass = 0; pass < 2; pass++) {
      for (let i = 1; i < result.length - 1; i++) {
          const prev = result[i - 1].elevation;
          const next = result[i + 1].elevation;
          const current = result[i].elevation;
          
          const avgNeighbor = (prev + next) / 2;
          if (Math.abs(current - avgNeighbor) > thresholdMeters) {
              result[i] = { ...result[i], elevation: avgNeighbor };
          }
      }
  }
  return result;
}

/**
 * Interpolates the route to have exactly `intervalMeters` between points.
 * Solves the issue where highly dense GPS points (e.g. 1m apart) magnify
 * minor elevation errors into huge 30-50% slope artifacts.
 */
export function resampleRoute(points: RoutePoint[], intervalMeters = 25): RoutePoint[] {
  if (points.length < 2) return points;
  
  const result: RoutePoint[] = [];
  result.push(points[0]);
  
  const intervalKm = intervalMeters / 1000;
  let targetDistKm = points[0].distance + intervalKm;
  let p1Index = 0;
  const maxDist = points[points.length - 1].distance;
  
  while (targetDistKm <= maxDist) {
      while (p1Index < points.length - 1 && points[p1Index + 1].distance < targetDistKm) {
          p1Index++;
      }
      
      if (p1Index >= points.length - 1) break;
      
      const p1 = points[p1Index];
      const p2 = points[p1Index + 1];
      const segmentLen = p2.distance - p1.distance;
      
      if (segmentLen === 0) {
          targetDistKm += intervalKm;
          continue;
      }
      
      const fraction = (targetDistKm - p1.distance) / segmentLen;
      
      result.push({
          latitude: p1.latitude + (p2.latitude - p1.latitude) * fraction,
          longitude: p1.longitude + (p2.longitude - p1.longitude) * fraction,
          elevation: p1.elevation + (p2.elevation - p1.elevation) * fraction,
          distance: targetDistKm,
          surface: p1.surface
      });
      
      targetDistKm += intervalKm;
  }
  
  const lastPoint = points[points.length - 1];
  if (result[result.length - 1].distance < lastPoint.distance - 0.005) {
      result.push(lastPoint);
  }
  
  return result;
}

/**
 * Calculates the slope percentage between two (optionally smoothed) points.
 */
export function calculateSlope(p1: RoutePoint, p2: RoutePoint): number {
  if (!p1 || !p2 || p1.distance === p2.distance) return 0;
  const distanceM = Math.abs(p2.distance - p1.distance) * 1000;
  if (distanceM === 0) return 0;
  return ((p2.elevation - p1.elevation) / distanceM) * 100;
}

/**
 * Calculates a realistic gradient by measuring the elevation change over a
 * physical distance window (default 100m) rather than between consecutive GPS points.
 * This closely mimics how Garmin/Wahoo bike computers smooth gradients.
 */
export function calculateDistanceSmoothedSlope(points: RoutePoint[], index: number, windowMeters = 100): number {
  if (points.length < 2) return 0;
  
  const centerDist = points[index].distance;
  const halfWindow = (windowMeters / 1000) / 2;
  
  let startIdx = index;
  while (startIdx > 0 && (centerDist - points[startIdx].distance) < halfWindow) {
    startIdx--;
  }
  
  let endIdx = index;
  while (endIdx < points.length - 1 && (points[endIdx].distance - centerDist) < halfWindow) {
    endIdx++;
  }
  
  const distM = (points[endIdx].distance - points[startIdx].distance) * 1000;
  if (distM < 10) return 0;
  
  const elevDiff = points[endIdx].elevation - points[startIdx].elevation;
  return (elevDiff / distM) * 100;
}

/**
 * Maps a slope percentage to a vibrant hex colour.
 *   Blue   (<  0 %) Downhill
 *   Green  (0–3 %)  Flat / false flat
 *   Yellow (3–6 %)  Moderate
 *   Orange (6–10%)  Hard
 *   Red    (>10 %)  Wall
 */
export function getSlopeColor(slope: number): string {
  if (slope < 0)    return "#3b82f6"; // blue-500   — bajada
  if (slope < 2.0)  return "#10b981"; // emerald-500 — llano (0–2%)
  if (slope < 6.0)  return "#eab308"; // yellow-500  — moderada (2–6%)
  if (slope < 10.0) return "#f97316"; // orange-500  — dura (6–10%)
  return "#ef4444";                   // red-500     — muro (>10%)
}

/**
 * Returns Leaflet polyline options specific to the surface type.
 *
 * Asphalt  → solid line
 * Gravel   → medium dash (6 4)
 * Trail    → short dot (3 5)
 */
export interface SurfaceStyle {
  dashArray: string | undefined;
  /** Stroke weight modifier relative to base weight */
  weightBonus: number;
}

export function getSurfaceStyle(surface: SurfaceType): SurfaceStyle {
  switch (surface) {
    case "gravel": return { dashArray: "8 5",  weightBonus: 0 };
    case "trail":  return { dashArray: "3 6",  weightBonus: -1 };
    case "asphalt":
    default:       return { dashArray: undefined, weightBonus: 0 };
  }
}
