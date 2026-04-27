import { RoutePoint } from "@/types/route";

export interface WaterFountain {
  id: number;
  lat: number;
  lng: number;
  /** Distance from the start of the route in km */
  distanceFromStart: number;
}

/**
 * Query Overpass for amenity=drinking_water near the route.
 * Strategy: compute the bounding box of the route (expanded by ~250m),
 * fetch ALL drinking water nodes in that bbox, then filter client-side
 * to keep only those within 200m of any route point.
 */
export async function fetchDrinkingWaterNearRoute(
  routePoints: RoutePoint[]
): Promise<WaterFountain[]> {
  if (routePoints.length < 2) return [];

  // --- 1. Compute bounding box of route with ~250m padding ---
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;
  for (const p of routePoints) {
    if (p.latitude < minLat) minLat = p.latitude;
    if (p.latitude > maxLat) maxLat = p.latitude;
    if (p.longitude < minLng) minLng = p.longitude;
    if (p.longitude > maxLng) maxLng = p.longitude;
  }
  // ~250m padding in degrees (rough: 1° lat ≈ 111km)
  const PAD = 0.003; // ~330m
  minLat -= PAD; maxLat += PAD;
  minLng -= PAD; maxLng += PAD;

  // --- 2. Simple bbox Overpass query ---
  const query = `
    [out:json][timeout:10];
    node["amenity"="drinking_water"](${minLat},${minLng},${maxLat},${maxLng});
    out body;
  `;

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      console.warn("Overpass API returned", response.status);
      return [];
    }

    const data = await response.json();
    if (!data.elements || data.elements.length === 0) return [];

    // --- 3. Filter to within 200m of route & compute distance from start ---
    // Sample route points for fast proximity check
    const SAMPLE_STEP = Math.max(1, Math.floor(routePoints.length / 200));
    const sampledRoute: RoutePoint[] = [];
    for (let i = 0; i < routePoints.length; i += SAMPLE_STEP) {
      sampledRoute.push(routePoints[i]);
    }

    const fountains: WaterFountain[] = [];
    const seen = new Set<number>();

    for (const el of data.elements) {
      if (el.type !== "node" || !el.lat || !el.lon) continue;
      if (seen.has(el.id)) continue;

      // Check if within ~200m of any route point
      const nearby = sampledRoute.some((rp) => {
        const dLat = (rp.latitude - el.lat) * 111320;
        const dLng = (rp.longitude - el.lon) * 111320 * Math.cos((el.lat * Math.PI) / 180);
        return Math.sqrt(dLat * dLat + dLng * dLng) < 200;
      });

      if (nearby) {
        seen.add(el.id);
        fountains.push({
          id: el.id,
          lat: el.lat,
          lng: el.lon,
          distanceFromStart: projectDistanceOnRoute(el.lat, el.lon, routePoints),
        });
      }
    }

    return fountains;
  } catch (err) {
    console.warn("Overpass fetch failed", err);
    return [];
  }
}

/**
 * Projects a point (lat,lng) onto the route polyline and returns
 * the approximate distance (km) from route start.
 */
function projectDistanceOnRoute(
  lat: number,
  lng: number,
  route: RoutePoint[]
): number {
  let bestDist = Infinity;
  let bestKm = 0;

  for (let i = 0; i < route.length; i++) {
    const dx = (route[i].latitude - lat) * 111.32;
    const dy =
      (route[i].longitude - lng) *
      111.32 *
      Math.cos((lat * Math.PI) / 180);
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      bestKm = route[i].distance;
    }
  }

  return Math.round(bestKm * 10) / 10;
}
