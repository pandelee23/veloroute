import { RoutePoint } from "@/types/route";

export interface Climb {
  name: string;
  category: string;
  categoryColor: string;
  startIndex: number;
  endIndex: number;
  /** Lat/lng of the start of the climb (for map label) */
  startLat: number;
  startLng: number;
  /** Lat/lng of the highest point */
  peakLat: number;
  peakLng: number;
  lengthKm: number;
  elevationGainM: number;
  avgSlopePct: number;
  difficulty: number;
  /** Coeficiente APM = Desnivel × Pendiente Media / 10 */
  apm: number;
}

// ---------- internal helpers ----------

function climbCategory(difficulty: number): { label: string; color: string } {
  if (difficulty >= 64_000) return { label: "HC", color: "#dc2626" };        // red-600
  if (difficulty >= 32_000) return { label: "Cat 1", color: "#ea580c" };      // orange-600
  if (difficulty >= 16_000) return { label: "Cat 2", color: "#d97706" };      // amber-600
  if (difficulty >= 8_000)  return { label: "Cat 3", color: "#16a34a" };      // green-600
  return                          { label: "Cat 4", color: "#2563eb" };        // blue-600
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------- public API ----------

/**
 * Detects significant climbing segments in a route.
 *
 * A "climb" is a continuous stretch where the 500 m rolling average slope
 * stays above MIN_SLOPE_PCT.  Short dips (< DIP_TOLERANCE_M) are bridged
 * so single minor descents don't split one long climb into two.
 *
 * After detection the climb is characterised and assigned a cycling category
 * based on the classic difficulty coefficient: gain_m × avg_slope_%.
 */
export function detectClimbs(points: RoutePoint[]): Climb[] {
  if (points.length < 10) return [];

  const MIN_SLOPE_PCT = 1.0;      // lower threshold to capture long 'falsos llanos' (1-2%) at climb starts
  const MIN_LENGTH_KM = 1.0;      // minimum climb length
  const DIP_TOLERANCE_M = 50;     // ignore descents with less than 50m of elevation drop

  // ---- 1. Mark each point as "climbing" using a 200 m look-ahead average ----
  const isClimbing: boolean[] = new Array(points.length).fill(false);
  for (let i = 0; i < points.length - 1; i++) {
    // Gather points within the next ~300 m
    const windowPts: RoutePoint[] = [points[i]];
    for (let j = i + 1; j < points.length; j++) {
      windowPts.push(points[j]);
      if ((points[j].distance - points[i].distance) * 1000 >= 300) break;
    }
    const last = windowPts[windowPts.length - 1];
    const distM = (last.distance - points[i].distance) * 1000;
    const gain = last.elevation - points[i].elevation;
    if (distM > 0 && (gain / distM) * 100 >= MIN_SLOPE_PCT) {
      isClimbing[i] = true;
    }
  }

  // ---- 2. Bridge small dips ----
  for (let i = 1; i < points.length - 1; i++) {
    if (!isClimbing[i]) {
      // Check if the elevation dip from current to next climbing stretch is small
      let nextClimb = -1;
      for (let j = i + 1; j < points.length; j++) {
        if (isClimbing[j]) { nextClimb = j; break; }
        // Allow up to a 2km flat/descent section before breaking a climb
        if ((points[j].distance - points[i].distance) * 1000 > 2000) break;
      }
      if (nextClimb !== -1) {
        const minElev = Math.min(...points.slice(i, nextClimb + 1).map(p => p.elevation));
        const dipM = points[i].elevation - minElev;
        if (dipM < DIP_TOLERANCE_M) {
          for (let k = i; k < nextClimb; k++) isClimbing[k] = true;
        }
      }
    }
  }

  // ---- 3. Extract continuous "climbing" stretches ----
  const climbs: Climb[] = [];
  let climbNum = 1;
  let i = 0;
  while (i < points.length) {
    if (!isClimbing[i]) { i++; continue; }

    const startIdx = i;
    while (i < points.length && isClimbing[i]) i++;
    const endIdx = i - 1;

    const lengthKm = points[endIdx].distance - points[startIdx].distance;
    if (lengthKm < MIN_LENGTH_KM) continue;

    const elevGain = Math.max(0, points[endIdx].elevation - points[startIdx].elevation);
    const avgSlope = lengthKm > 0 ? (elevGain / (lengthKm * 1000)) * 100 : 0;
    const difficulty = elevGain * avgSlope;

    // Find peak index
    let peakIdx = startIdx;
    for (let k = startIdx; k <= endIdx; k++) {
      if (points[k].elevation > points[peakIdx].elevation) peakIdx = k;
    }

    const { label, color } = climbCategory(difficulty);

    climbs.push({
      name: `Subida ${climbNum++}`,
      category: label,
      categoryColor: color,
      startIndex: startIdx,
      endIndex: endIdx,
      startLat: points[startIdx].latitude,
      startLng: points[startIdx].longitude,
      peakLat: points[peakIdx].latitude,
      peakLng: points[peakIdx].longitude,
      lengthKm: Math.round(lengthKm * 10) / 10,
      elevationGainM: Math.round(elevGain),
      avgSlopePct: Math.round(avgSlope * 10) / 10,
      difficulty,
      apm: Math.round((elevGain * avgSlope) / 10),
    });
  }

  return climbs;
}
