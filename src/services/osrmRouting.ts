import { decodePolyline } from "@/lib/polyline";
import { RoutePoint } from "@/types/route";
import { filterElevationOutliers, resampleRoute, smoothElevations } from "@/utils/slope";

const OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/bicycle";

/**
 * Pide la ruta a OSRM dada una lista de coordenadas [lat, lng].
 * OSRM espera el formato {longitude},{latitude};...
 */
export async function getOsrmRoute(waypoints: [number, number][]): Promise<RoutePoint[] | null> {
  if (waypoints.length < 2) return null;

  // OSRM format: lon,lat;lon,lat
  const coordString = waypoints.map(p => `${p[1]},${p[0]}`).join(";");
  const url = `${OSRM_BASE_URL}/${coordString}?overview=full&geometries=polyline`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Error al obtener la ruta de OSRM");
      return null;
    }

    const data = await response.json();
    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      console.error("OSRM devolvió un error o sin rutas:", data);
      return null;
    }

    const route = data.routes[0];
    const encodedGeometry = route.geometry;
    const decodedCoords = decodePolyline(encodedGeometry); // returns array of [lat, lng]

    // Sample up to 80 points for the Elevation API
    const sampleCount = Math.min(80, decodedCoords.length);
    const sampleIndices: number[] = [];
    for (let i = 0; i < sampleCount; i++) {
        sampleIndices.push(Math.floor(i * (decodedCoords.length - 1) / (sampleCount - 1 || 1)));
    }

    // Fetch elevation in chunks via GET to Open-Meteo
    const sampledElevations: number[] = [];
    const CHUNK_SIZE = 40; // Open-Meteo handles max 100 per request, 40 is safe
    for (let start = 0; start < sampleIndices.length; start += CHUNK_SIZE) {
        const chunkIndices = sampleIndices.slice(start, start + CHUNK_SIZE);
        const lats = chunkIndices.map(i => decodedCoords[i][0]).join(',');
        const lons = chunkIndices.map(i => decodedCoords[i][1]).join(',');

        try {
            const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lons}`);
            
            if (res.ok) {
                const json = await res.json();
                if (json.elevation && Array.isArray(json.elevation)) {
                    sampledElevations.push(...json.elevation);
                    continue;
                }
            }
        } catch (err) {
            console.warn('Elevation chunk failed, padding zeros:', err);
        }
        // Pad this chunk with zeros on failure
        sampledElevations.push(...new Array(chunkIndices.length).fill(0));
    }

    // Now interpolate elevation for ALL OSRM points using linear interpolation
    const elevations: number[] = new Array(decodedCoords.length).fill(0);
    for (let i = 0; i < decodedCoords.length; i++) {
        let rightSampleIdx = sampleIndices.findIndex(idx => idx >= i);
        if (rightSampleIdx === -1) rightSampleIdx = sampleCount - 1;
        let leftSampleIdx = rightSampleIdx === 0 ? 0 : rightSampleIdx - 1;

        const idxLeft = sampleIndices[leftSampleIdx];
        const idxRight = sampleIndices[rightSampleIdx];
        const elevLeft = sampledElevations[leftSampleIdx];
        const elevRight = sampledElevations[rightSampleIdx];

        if (idxLeft === idxRight) {
            elevations[i] = elevLeft;
        } else {
            const fraction = (i - idxLeft) / (idxRight - idxLeft);
            elevations[i] = elevLeft + (elevRight - elevLeft) * fraction;
        }
    }

    // Convert decoded raw coordinates into our RoutePoint format.
    // OSRM doesn't easily map exact sub-distances to all geometry points, 
    // so we approximate the distance along the line.
    let currentDistance = 0;
    const routePoints: RoutePoint[] = [];

    for (let i = 0; i < decodedCoords.length; i++) {
        const [lat, lng] = decodedCoords[i];
        
        if (i > 0) {
            const [prevLat, prevLng] = decodedCoords[i - 1];
            // Haversine formula for distance between two points
            const R = 6371; // Earth's radius in km
            const dLat = (lat - prevLat) * Math.PI / 180;
            const dLon = (lng - prevLng) * Math.PI / 180;
            const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(prevLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const d = R * c; 
            currentDistance += d;
        }

        routePoints.push({
            latitude: lat,
            longitude: lng,
            elevation: elevations[i] || 0,
            distance: currentDistance,
            surface: 'asphalt' // Defaulting to asphalt since public OSRM lacks surface array matching points easily
        });
    }
    // 1. Filter out physically impossible elevation spikes
    const cleanedPoints = filterElevationOutliers(routePoints, 8); 
    
    // 2. Resample exactly to ~25m intervals to remove distance-based noise magnification
    const resampledPoints = resampleRoute(cleanedPoints, 25);

    // 3. Apply a heavy 275m moving average (window 5 * 25m * 2) to blend SRTM 90m pixel cliffs into realistic roadway gradients
    const finalPoints = smoothElevations(resampledPoints, 5);

    return finalPoints;
  } catch (error) {
    console.error("Fetch error to OSRM", error);
    return null;
  }
}
