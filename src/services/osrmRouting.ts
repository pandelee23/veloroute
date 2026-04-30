import { decodePolyline } from "@/lib/polyline";
import { RoutePoint } from "@/types/route";
import { filterElevationOutliers, resampleRoute, smoothElevations } from "@/utils/slope";

const ORS_BASE_URL = "https://api.openrouteservice.org/v2/directions/cycling-road/geojson";

/**
 * Pide la ruta a OpenRouteService dada una lista de coordenadas [lat, lng].
 * ORS permite evitar autopistas de forma nativa.
 */
export async function getOsrmRoute(waypoints: [number, number][]): Promise<RoutePoint[] | null> {
  if (waypoints.length < 2) return null;

  const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY;
  
  if (!apiKey) {
    console.error("Falta la API Key de OpenRouteService en .env.local (NEXT_PUBLIC_ORS_API_KEY)");
    return null;
  }

  // ORS espera [longitude, latitude]
  const coordinates = waypoints.map(p => [p[1], p[0]]);

  try {
    const response = await fetch(ORS_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": apiKey,
      },
      body: JSON.stringify({
        coordinates,
        elevation: true,
        options: {
          avoid_features: ["ferries", "steps", "fords"]
        }
      })
    });

    if (!response.ok) {
      const status = response.status;
      let errorDetail = "";
      try {
        const errorData = await response.json();
        errorDetail = JSON.stringify(errorData);
      } catch {
        errorDetail = await response.text();
      }
      console.error(`Error en OpenRouteService (Status ${status}):`, errorDetail);
      return null;
    }

    const data = await response.json();
    if (!data.features || data.features.length === 0) {
      console.error("ORS no encontró rutas");
      return null;
    }

    const feature = data.features[0];
    const coordsWithElev = feature.geometry.coordinates; // [[lon, lat, elev], ...]

    // ORS ya nos da elevación, pero seguimos tu flujo de resampling y smoothing para consistencia en los gráficos
    let currentDistance = 0;
    const routePoints: RoutePoint[] = [];

    for (let i = 0; i < coordsWithElev.length; i++) {
        const [lon, lat, elev] = coordsWithElev[i];
        
        if (i > 0) {
            const [prevLon, prevLat] = coordsWithElev[i - 1];
            // Haversine
            const R = 6371; 
            const dLat = (lat - prevLat) * Math.PI / 180;
            const dLon = (lon - prevLon) * Math.PI / 180;
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
            longitude: lon,
            elevation: elev || 0,
            distance: currentDistance,
            surface: 'asphalt' // Simplificado
        });
    }

    // 1. Filter out physically impossible elevation spikes
    const cleanedPoints = filterElevationOutliers(routePoints, 8); 
    
    // 2. Resample exactly to ~25m intervals
    const resampledPoints = resampleRoute(cleanedPoints, 25);

    // 3. Apply smoothing
    const finalPoints = smoothElevations(resampledPoints, 5);

    return finalPoints;
  } catch (error) {
    console.error("Fetch error to ORS", error);
    return null;
  }
}
