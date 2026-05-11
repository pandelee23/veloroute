export type SurfaceType = 'asphalt' | 'gravel' | 'trail';

export interface RoutePoint {
  latitude: number;
  longitude: number;
  elevation: number;
  distance: number; // Distancia acumulada desde el inicio en km
  surface: SurfaceType;
}

export interface RouteStats {
  totalDistance: number; // en km
  elevationGain: number; // en metros
  estimatedTime: number; // en minutos
}

export interface WindData {
  latitude: number;
  longitude: number;
  windSpeed: number; // km/h
  windDirection: number; // degrees
}

export interface WindForecast {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[]; // ISO timestamps
    windSpeed: number[]; // km/h
    windDirection: number[]; // degrees
  };
}
