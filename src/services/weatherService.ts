import { RoutePoint, WindForecast } from "@/types/route";

const WIND_INTERVAL_KM = 10; // Extraer datos de viento cada 10 km
const MAX_POINTS = 10; // Máximo de puntos a consultar por ruta

/**
 * Filtra los puntos de la ruta para obtener una muestra representativa
 * para la consulta de viento (por ejemplo, cada 10 km).
 */
function sampleRoutePoints(route: RoutePoint[]): RoutePoint[] {
  if (route.length === 0) return [];
  
  const sampled: RoutePoint[] = [route[0]]; // Siempre incluir el inicio
  let lastDist = 0;

  for (let i = 1; i < route.length - 1; i++) {
    const pt = route[i];
    if (pt.distance - lastDist >= WIND_INTERVAL_KM) {
      sampled.push(pt);
      lastDist = pt.distance;
    }
  }

  // Si el último punto no está cerca del último punto muestreado, lo añadimos
  const lastPt = route[route.length - 1];
  if (lastPt.distance - lastDist > WIND_INTERVAL_KM / 2) {
    sampled.push(lastPt);
  }

  // Limitar el número máximo de puntos para no sobrecargar el mapa/API
  if (sampled.length > MAX_POINTS) {
    const step = Math.ceil(sampled.length / MAX_POINTS);
    return sampled.filter((_, idx) => idx % step === 0).slice(0, MAX_POINTS);
  }

  return sampled;
}

/**
 * Obtiene el pronóstico de viento (3 días por horas) para una serie de puntos
 * utilizando la API gratuita de Open-Meteo.
 */
export async function fetchWindForecastForRoute(route: RoutePoint[]): Promise<WindForecast[]> {
  const sampledPoints = sampleRoutePoints(route);
  if (sampledPoints.length === 0) return [];

  const lats = sampledPoints.map(p => p.latitude).join(",");
  const lngs = sampledPoints.map(p => p.longitude).join(",");

  // Obtenemos pronóstico por horas para los próximos 3 días
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&hourly=wind_speed_10m,wind_direction_10m&forecast_days=3`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Error fetching weather data");
    }

    const data = await response.json();
    const forecastList: WindForecast[] = [];

    if (Array.isArray(data)) {
      data.forEach((locationData, index) => {
        const pt = sampledPoints[index];
        forecastList.push({
          latitude: pt.latitude,
          longitude: pt.longitude,
          hourly: {
            time: locationData.hourly.time,
            windSpeed: locationData.hourly.wind_speed_10m,
            windDirection: locationData.hourly.wind_direction_10m,
          }
        });
      });
    } else if (data.hourly) {
      const pt = sampledPoints[0];
      forecastList.push({
        latitude: pt.latitude,
        longitude: pt.longitude,
        hourly: {
          time: data.hourly.time,
          windSpeed: data.hourly.wind_speed_10m,
          windDirection: data.hourly.wind_direction_10m,
        }
      });
    }

    return forecastList;
  } catch (error) {
    console.error("Failed to fetch wind forecast data:", error);
    return [];
  }
}
