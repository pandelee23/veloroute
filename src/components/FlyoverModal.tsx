"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as turf from "@turf/turf";
import { RoutePoint } from "@/types/route";
import { Play, Pause, X, RotateCcw, Gauge } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface FlyoverModalProps {
  routePoints: RoutePoint[];
  onClose: () => void;
}

type SpeedOption = 0.5 | 1 | 2 | 3;

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const SPEEDS: SpeedOption[] = [0.5, 1, 2, 3];
const SPEED_LABELS: Record<SpeedOption, string> = {
  0.5: "0.5×",
  1: "1×",
  2: "2×",
  3: "3×",
};

const CAMERA_PITCH = 65;
const CAMERA_ZOOM = 14.8;
const CAMERA_ALTITUDE_OFFSET = 0.001; // slight offset behind the point
const TERRAIN_EXAGGERATION = 1.4;
const BASE_SPEED_KM_PER_SECOND = 0.15; // How many km of route per second at 1x speed

// ESRI World Imagery (free for visualization)
const ESRI_SATELLITE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

// ─────────────────────────────────────────────────────────────
// Helper: convert RoutePoint[] to GeoJSON
// ─────────────────────────────────────────────────────────────
function routeToGeoJSON(
  points: RoutePoint[]
): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: points.map((p) => [p.longitude, p.latitude, p.elevation]),
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function FlyoverModal({
  routePoints,
  onClose,
}: FlyoverModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const distanceRef = useRef<number>(0);
  const routeLineRef = useRef<GeoJSON.Feature<GeoJSON.LineString> | null>(null);
  const totalDistanceRef = useRef<number>(0);
  const isMapReadyRef = useRef<boolean>(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<SpeedOption>(1);
  const [progress, setProgress] = useState(0); // 0-1
  const [currentKm, setCurrentKm] = useState(0);
  const [currentElevation, setCurrentElevation] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [webglError, setWebglError] = useState(false);

  const totalKm =
    routePoints.length > 0
      ? routePoints[routePoints.length - 1].distance
      : 0;

  // ── Check WebGL support ──
  useEffect(() => {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) {
      setWebglError(true);
    }
  }, []);

  // ── Initialize MapLibre ──
  useEffect(() => {
    if (webglError || !mapContainerRef.current || routePoints.length < 2)
      return;

    const routeLine = routeToGeoJSON(routePoints);
    routeLineRef.current = routeLine;
    totalDistanceRef.current = turf.length(routeLine, { units: "kilometers" });

    const startCoord = routeLine.geometry.coordinates[0];

    // Calculate initial bearing from first two points
    const secondCoord = routeLine.geometry.coordinates[Math.min(5, routeLine.geometry.coordinates.length - 1)];
    const initialBearing = turf.bearing(
      turf.point(startCoord),
      turf.point(secondCoord)
    );

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          "esri-satellite": {
            type: "raster",
            tiles: [ESRI_SATELLITE_URL],
            tileSize: 256,
            attribution:
              "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
            maxzoom: 18,
          },
          "terrain-dem": {
            type: "raster-dem",
            tiles: [
              "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            encoding: "terrarium",
            maxzoom: 15,
          },
        },
        layers: [
          {
            id: "esri-satellite-layer",
            type: "raster",
            source: "esri-satellite",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
        terrain: {
          source: "terrain-dem",
          exaggeration: TERRAIN_EXAGGERATION,
        },
        sky: {
          "sky-color": "#87CEEB",
          "sky-horizon-blend": 0.3,
          "horizon-color": "#C5DDF5",
          "horizon-fog-blend": 0.8,
          "fog-color": "#DCE8F2",
          "fog-ground-blend": 0.9,
        },
      },
      center: [startCoord[0], startCoord[1]],
      zoom: CAMERA_ZOOM,
      pitch: CAMERA_PITCH,
      bearing: initialBearing,
      maxPitch: 80,
    });

    mapRef.current = map;

    map.on("load", () => {
      // Add the route line
      map.addSource("flyover-route", {
        type: "geojson",
        data: routeLine,
      });

      // Glow layer (wide, semi-transparent)
      map.addLayer({
        id: "flyover-route-glow",
        type: "line",
        source: "flyover-route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#FFFFFF",
          "line-width": 8,
          "line-opacity": 0.35,
          "line-blur": 4,
        },
      });

      // Main route line
      map.addLayer({
        id: "flyover-route-line",
        type: "line",
        source: "flyover-route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#FF6B35",
          "line-width": 4,
          "line-opacity": 0.95,
        },
      });

      // Camera position marker (moving dot)
      map.addSource("camera-point", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: startCoord,
          },
        },
      });

      // Outer glow for marker
      map.addLayer({
        id: "camera-point-glow",
        type: "circle",
        source: "camera-point",
        paint: {
          "circle-radius": 12,
          "circle-color": "#FF6B35",
          "circle-opacity": 0.25,
          "circle-blur": 0.6,
        },
      });

      map.addLayer({
        id: "camera-point-dot",
        type: "circle",
        source: "camera-point",
        paint: {
          "circle-radius": 6,
          "circle-color": "#FF6B35",
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#FFFFFF",
        },
      });

      // Start marker
      map.addSource("start-point", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: startCoord,
          },
        },
      });

      map.addLayer({
        id: "start-point-dot",
        type: "circle",
        source: "start-point",
        paint: {
          "circle-radius": 7,
          "circle-color": "#4A7A30",
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#FFFFFF",
        },
      });

      // End marker
      const endCoord =
        routeLine.geometry.coordinates[
          routeLine.geometry.coordinates.length - 1
        ];
      map.addSource("end-point", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: endCoord,
          },
        },
      });

      map.addLayer({
        id: "end-point-dot",
        type: "circle",
        source: "end-point",
        paint: {
          "circle-radius": 7,
          "circle-color": "#D96A27",
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#FFFFFF",
        },
      });

      isMapReadyRef.current = true;
      setMapLoaded(true);

      // Start fit: show the whole route first, then begin flyover
      const bounds = new maplibregl.LngLatBounds();
      routeLine.geometry.coordinates.forEach((coord) => {
        bounds.extend(coord as [number, number]);
      });
      map.fitBounds(bounds, {
        padding: 80,
        pitch: 45,
        duration: 2000,
      });

      // After showing the full route, move camera to start
      setTimeout(() => {
        map.easeTo({
          center: [startCoord[0], startCoord[1]],
          zoom: CAMERA_ZOOM,
          pitch: CAMERA_PITCH,
          bearing: initialBearing,
          duration: 2500,
        });
      }, 2500);
    });

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      map.remove();
      mapRef.current = null;
      isMapReadyRef.current = false;
    };
  }, [routePoints, webglError]);

  // ── Interpolate elevation from route points ──
  const getElevationAtDistance = useCallback(
    (distKm: number): number => {
      if (routePoints.length === 0) return 0;
      for (let i = 1; i < routePoints.length; i++) {
        if (routePoints[i].distance >= distKm) {
          const prev = routePoints[i - 1];
          const curr = routePoints[i];
          const segDist = curr.distance - prev.distance;
          if (segDist === 0) return curr.elevation;
          const t = (distKm - prev.distance) / segDist;
          return prev.elevation + t * (curr.elevation - prev.elevation);
        }
      }
      return routePoints[routePoints.length - 1].elevation;
    },
    [routePoints]
  );

  // ── Animation loop ──
  const animate = useCallback(
    (timestamp: number) => {
      const map = mapRef.current;
      const routeLine = routeLineRef.current;
      if (!map || !routeLine || !isMapReadyRef.current) return;

      const totalDist = totalDistanceRef.current;
      if (totalDist === 0) return;

      // Calculate delta time
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }
      const deltaMs = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Advance distance
      const deltaDist =
        (deltaMs / 1000) * BASE_SPEED_KM_PER_SECOND * speed;
      distanceRef.current = Math.min(
        distanceRef.current + deltaDist,
        totalDist
      );

      const currentDist = distanceRef.current;
      const currentProgress = currentDist / totalDist;

      // Get current position on the line
      const currentPoint = turf.along(routeLine, currentDist, {
        units: "kilometers",
      });
      const currentCoord = currentPoint.geometry.coordinates;

      // Look-ahead for bearing (look further ahead for smoother rotation)
      const lookAheadDist = Math.min(currentDist + 0.3, totalDist);
      const lookAheadPoint = turf.along(routeLine, lookAheadDist, {
        units: "kilometers",
      });
      const bearing = turf.bearing(currentPoint, lookAheadPoint);

      // Update camera
      map.easeTo({
        center: [currentCoord[0], currentCoord[1]],
        bearing: bearing,
        pitch: CAMERA_PITCH,
        zoom: CAMERA_ZOOM,
        duration: 0,
        easing: (t: number) => t,
      });

      // Update the camera point marker
      const cameraSource = map.getSource("camera-point") as maplibregl.GeoJSONSource;
      if (cameraSource) {
        cameraSource.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: currentCoord,
          },
        });
      }

      // Update UI state
      setProgress(currentProgress);
      setCurrentKm(currentDist);
      setCurrentElevation(getElevationAtDistance(currentDist));

      // Check if animation is complete
      if (currentProgress >= 1) {
        setIsPlaying(false);
        // Fly out to show the complete route
        const bounds = new maplibregl.LngLatBounds();
        routeLine.geometry.coordinates.forEach((coord) => {
          bounds.extend(coord as [number, number]);
        });
        map.fitBounds(bounds, {
          padding: 80,
          pitch: 50,
          duration: 3000,
        });
        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    },
    [speed, getElevationAtDistance]
  );

  // ── Play/Pause ──
  useEffect(() => {
    if (isPlaying && mapLoaded) {
      lastTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, mapLoaded, animate]);

  // ── Reset animation ──
  const handleReset = useCallback(() => {
    setIsPlaying(false);
    distanceRef.current = 0;
    setProgress(0);
    setCurrentKm(0);
    setCurrentElevation(routePoints[0]?.elevation ?? 0);

    const map = mapRef.current;
    const routeLine = routeLineRef.current;
    if (!map || !routeLine) return;

    const startCoord = routeLine.geometry.coordinates[0];
    const secondCoord = routeLine.geometry.coordinates[Math.min(5, routeLine.geometry.coordinates.length - 1)];
    const bearing = turf.bearing(
      turf.point(startCoord),
      turf.point(secondCoord)
    );

    map.easeTo({
      center: [startCoord[0], startCoord[1]],
      zoom: CAMERA_ZOOM,
      pitch: CAMERA_PITCH,
      bearing: bearing,
      duration: 1500,
    });

    // Reset the camera point marker
    const cameraSource = map.getSource("camera-point") as maplibregl.GeoJSONSource;
    if (cameraSource) {
      cameraSource.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: startCoord,
        },
      });
    }
  }, [routePoints]);

  // ── Cycle speed ──
  const cycleSpeed = () => {
    setSpeed((prev) => {
      const idx = SPEEDS.indexOf(prev);
      return SPEEDS[(idx + 1) % SPEEDS.length];
    });
  };

  // ── Progress bar scrubbing ──
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));

    const totalDist = totalDistanceRef.current;
    const newDist = newProgress * totalDist;
    distanceRef.current = newDist;
    setProgress(newProgress);
    setCurrentKm(newDist);
    setCurrentElevation(getElevationAtDistance(newDist));

    // Move camera to the new position
    const map = mapRef.current;
    const routeLine = routeLineRef.current;
    if (!map || !routeLine) return;

    const currentPoint = turf.along(routeLine, newDist, {
      units: "kilometers",
    });
    const lookAhead = Math.min(newDist + 0.3, totalDist);
    const lookAheadPoint = turf.along(routeLine, lookAhead, {
      units: "kilometers",
    });
    const bearing = turf.bearing(currentPoint, lookAheadPoint);

    map.easeTo({
      center: currentPoint.geometry.coordinates as [number, number],
      bearing,
      pitch: CAMERA_PITCH,
      zoom: CAMERA_ZOOM,
      duration: 800,
    });

    const cameraSource = map.getSource("camera-point") as maplibregl.GeoJSONSource;
    if (cameraSource) {
      cameraSource.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: currentPoint.geometry.coordinates,
        },
      });
    }
  };

  // ── Close with escape ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // ── WebGL error state ──
  if (webglError) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-2xl">
          <div className="text-4xl mb-4">😔</div>
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">
            WebGL no disponible
          </h2>
          <p className="text-sm text-[#757575] mb-6">
            Tu navegador no soporta WebGL, necesario para la vista 3D.
            Prueba con Chrome, Firefox o Edge actualizados.
          </p>
          <button
            onClick={onClose}
            className="bg-[#4A7A30] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#3D6628] transition-colors cursor-pointer"
          >
            Volver al mapa
          </button>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* ── Map container ── */}
      <div ref={mapContainerRef} className="flex-1 w-full" />

      {/* ── Loading overlay ── */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-white/80 text-sm font-medium tracking-wide">
              Preparando vista 3D…
            </p>
          </div>
        </div>
      )}

      {/* ── Close button ── */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white p-2.5 rounded-full transition-all cursor-pointer border border-white/10 shadow-lg"
        title="Cerrar (Esc)"
      >
        <X className="h-5 w-5" />
      </button>

      {/* ── Live stats overlay ── */}
      {mapLoaded && (
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5 shadow-lg">
            <div className="flex items-center gap-5">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-widest text-white/50 font-bold">
                  Distancia
                </span>
                <span className="text-white font-bold text-base tabular-nums">
                  {currentKm.toFixed(1)}
                  <span className="text-xs font-normal text-white/50 ml-0.5">
                    / {totalKm.toFixed(1)} km
                  </span>
                </span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-widest text-white/50 font-bold">
                  Altitud
                </span>
                <span className="text-white font-bold text-base tabular-nums">
                  {Math.round(currentElevation)}
                  <span className="text-xs font-normal text-white/50 ml-0.5">
                    m
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom controls bar ── */}
      {mapLoaded && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          {/* Progress bar */}
          <div
            className="w-full h-1.5 bg-white/10 cursor-pointer group"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-gradient-to-r from-[#4A7A30] to-[#FF6B35] transition-[width] duration-75 relative"
              style={{ width: `${progress * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Controls */}
          <div className="bg-black/60 backdrop-blur-xl border-t border-white/5 px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Play/Pause */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-white/10 hover:bg-white/20 text-white p-2.5 sm:p-3 rounded-full transition-all cursor-pointer border border-white/5 active:scale-95"
                title={isPlaying ? "Pausar (Espacio)" : "Reproducir (Espacio)"}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Play className="h-4 w-4 sm:h-5 sm:w-5 ml-0.5" />
                )}
              </button>

              {/* Reset */}
              <button
                onClick={handleReset}
                className="bg-white/10 hover:bg-white/20 text-white/70 hover:text-white p-2 sm:p-2.5 rounded-full transition-all cursor-pointer border border-white/5 active:scale-95"
                title="Reiniciar"
              >
                <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>

              {/* Speed */}
              <button
                onClick={cycleSpeed}
                className="bg-white/10 hover:bg-white/20 text-white/70 hover:text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all cursor-pointer border border-white/5 flex items-center gap-1.5 active:scale-95"
                title="Cambiar velocidad"
              >
                <Gauge className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-bold tabular-nums">
                  {SPEED_LABELS[speed]}
                </span>
              </button>
            </div>

            {/* Right side: branding */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs text-white/30 font-medium tracking-wide hidden sm:block">
                Flyover 3D
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#4A7A30]" />
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
