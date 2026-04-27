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
