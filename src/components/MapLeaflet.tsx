"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MapContainer, TileLayer, useMapEvents, useMap, CircleMarker
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RoutePoint } from "@/types/route";
import { getOsrmRoute } from "@/services/osrmRouting";
import { smoothElevations, calculateSlope, getSlopeColor, getSurfaceStyle, calculateDistanceSmoothedSlope } from "@/utils/slope";
import { detectClimbs, Climb } from "@/utils/climbDetection";
import { ClimbDetailPanel } from "@/components/ClimbDetailPanel";
import { fetchDrinkingWaterNearRoute, WaterFountain } from "@/services/overpassService";
import { Mountain, Droplets, ChevronDown, ChevronUp } from "lucide-react";

interface MapLeafletProps {
  onRouteUpdate: (points: RoutePoint[]) => void;
  onClimbsDetected?: (climbs: Climb[]) => void;
  onFountainsLoaded?: (fountains: WaterFountain[]) => void;
  hoveredPointIndex?: number | null;
}

// ─────────────────────────────────────────────────────────────
// Route gradient layer
// ─────────────────────────────────────────────────────────────
function RouteGradientLayer({ route }: { route: RoutePoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (!route || route.length < 2) return;
    const fg = L.featureGroup().addTo(map);
    for (let i = 0; i < route.length - 1; i++) {
      const p1 = route[i], p2 = route[i + 1];
      const slope = calculateDistanceSmoothedSlope(route, i, 100);
      const color = getSlopeColor(slope);
      const { dashArray, weightBonus } = getSurfaceStyle(p1.surface);
      const w = 5 + weightBonus;
      L.polyline([[p1.latitude, p1.longitude],[p2.latitude, p2.longitude]],
        { color: "#FFFFFF", weight: w + 2, opacity: 0.5, lineCap:"round", lineJoin:"round" }).addTo(fg);
      L.polyline([[p1.latitude, p1.longitude],[p2.latitude, p2.longitude]],
        { color, weight: w, opacity: 1, lineCap:"round", lineJoin:"round", dashArray }).addTo(fg);
    }
    return () => { fg.clearLayers(); map.removeLayer(fg); };
  }, [route, map]);
  return null;
}

// ─────────────────────────────────────────────────────────────
// Climb highlight layer — drawn when user hovers a climb badge
// ─────────────────────────────────────────────────────────────
function ClimbHighlightLayer({
  climb, route,
}: { climb: Climb | null; route: RoutePoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (!climb || !route || route.length === 0) return;
    const segment = route.slice(climb.startIndex, climb.endIndex + 1);
    if (segment.length < 2) return;
    const coords: [number, number][] = segment.map(p => [p.latitude, p.longitude]);
    const glow = L.featureGroup().addTo(map);
    L.polyline(coords, { color: "#fff", weight: 14, opacity: 0.4, lineCap:"round" }).addTo(glow);
    L.polyline(coords, { color: climb.categoryColor, weight: 6, opacity: 1, lineCap:"round" }).addTo(glow);
    return () => { glow.clearLayers(); map.removeLayer(glow); };
  }, [climb, route, map]);
  return null;
}

// ─────────────────────────────────────────────────────────────
// Climb labels — interactive badges with hover + click
// ─────────────────────────────────────────────────────────────
function ClimbLabelsLayer({
  climbs, onHover, onClick,
}: {
  climbs: Climb[];
  onHover: (c: Climb | null) => void;
  onClick: (c: Climb) => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (!climbs || climbs.length === 0) return;
    const markers: L.Marker[] = [];
    climbs.forEach((c) => {
      const badge = (hovered: boolean) => `
        <div style="
          background: ${hovered ? "#FFFFFF" : "#FFFFFFEE"};
          border: ${hovered ? "2px" : "1.5px"} solid ${c.categoryColor}80;
          border-radius: 12px; padding: 5px 10px;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 10px; color: #1A1A1A;
          white-space: nowrap;
          box-shadow: ${hovered ? `0 4px 16px rgba(0,0,0,0.12)` : "0 2px 8px rgba(0,0,0,0.06)"};
          line-height: 1.4; cursor: pointer;
          transform: ${hovered ? "scale(1.05)" : "scale(1)"};
          transition: all .15s ease;
        ">
           <span style="font-weight:700;color:${c.categoryColor};font-size:9px;text-transform:uppercase;letter-spacing:.5px">
            ⛰ ${c.category}
          </span><br/>
          <span style="color:#1A1A1A;font-weight:600">${c.name}</span>
          &nbsp;·&nbsp;${c.lengthKm}km&nbsp;·&nbsp;${c.avgSlopePct}%&nbsp;·&nbsp;<span style="color:#2D4B1D">APM ${c.apm}</span>
        </div>`;
      const icon = (hovered: boolean) =>
        L.divIcon({ html: badge(hovered), className: "", iconAnchor: [0, 0] });
      const marker = L.marker([c.startLat, c.startLng], { icon: icon(false) }).addTo(map);
      marker.on("mouseover", () => { marker.setIcon(icon(true)); onHover(c); });
      marker.on("mouseout", () => { marker.setIcon(icon(false)); onHover(null); });
      marker.on("click", (e) => { L.DomEvent.stopPropagation(e); onClick(c); });
      markers.push(marker);
    });
    return () => { markers.forEach(m => map.removeLayer(m)); };
  }, [climbs, map, onHover, onClick]);
  return null;
}

// ─────────────────────────────────────────────────────────────
// Water fountain markers layer
// ─────────────────────────────────────────────────────────────
function WaterFountainLayer({ fountains }: { fountains: WaterFountain[] }) {
  const map = useMap();
  useEffect(() => {
    if (!fountains || fountains.length === 0) return;
    const markers: L.Marker[] = [];
    fountains.forEach((f) => {
      const dropletSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="rgba(74,122,48,0.15)" stroke="#4A7A30" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>`;
      const iconHtml = `
        <div style="
          background: white; border: 1.5px solid rgba(74,122,48,0.35);
          border-radius: 50%; width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08); cursor: pointer;
        ">${dropletSvg}</div>`;
      const icon = L.divIcon({ html: iconHtml, className: "", iconSize: [28, 28], iconAnchor: [14, 14] });
      const marker = L.marker([f.lat, f.lng], { icon }).addTo(map);
      marker.bindPopup(
        `<div style="
          background: white; border: 1px solid #EAEAEA;
          border-radius: 12px; padding: 10px 14px;
          font-family: 'Inter', system-ui, sans-serif;
          color: #1A1A1A; font-size: 11px; min-width: 120px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        ">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            ${dropletSvg}
            <span style="font-weight:700;font-size:12px;color:#4A7A30">Fuente de agua</span>
          </div>
          <div style="color:#757575;font-size:10px">
            📍 Km ${f.distanceFromStart.toFixed(1)} desde el inicio
          </div>
        </div>`,
        { className: "water-fountain-popup", closeButton: false }
      );
      markers.push(marker);
    });
    return () => { markers.forEach(m => map.removeLayer(m)); };
  }, [fountains, map]);
  return null;
}

// ─────────────────────────────────────────────────────────────
// Fly to climb bounds helper
// ─────────────────────────────────────────────────────────────
function FlyToClimbLayer({ climb, route }: { climb: Climb | null; route: RoutePoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (!climb || !route || route.length === 0) return;
    const segment = route.slice(climb.startIndex, climb.endIndex + 1);
    if (segment.length < 2) return;
    const bounds = L.latLngBounds(segment.map(p => [p.latitude, p.longitude] as [number, number]));
    map.flyToBounds(bounds, { padding: [60, 60], duration: 0.8 });
  }, [climb, route, map]);
  return null;
}

// ─────────────────────────────────────────────────────────────
// Map click handler
// ─────────────────────────────────────────────────────────────
function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

// ─────────────────────────────────────────────────────────────
// Legend data
// ─────────────────────────────────────────────────────────────
const SLOPE_LEGEND = [
  { color: "#6B9E50", label: "Bajada",   range: "< 0 %"  },
  { color: "#4A7A30", label: "Llano",    range: "0–2 %"  },
  { color: "#C4A035", label: "Moderada", range: "2–6 %"  },
  { color: "#D96A27", label: "Dura",     range: "6–10 %" },
  { color: "#B5451B", label: "Muro",     range: "> 10 %" },
];

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
export default function MapLeaflet({ onRouteUpdate, onClimbsDetected, onFountainsLoaded, hoveredPointIndex }: MapLeafletProps) {
  const [waypoints, setWaypoints]     = useState<[number, number][]>([]);
  const [routeLine, setRouteLine]     = useState<RoutePoint[]>([]);
  const [climbs, setClimbs]           = useState<Climb[]>([]);
  const [fountains, setFountains]     = useState<WaterFountain[]>([]);
  const [loading, setLoading]         = useState(false);
  const [hoveredClimb, setHoveredClimb] = useState<Climb | null>(null);
  const [selectedClimb, setSelectedClimb] = useState<Climb | null>(null);
  const [flyToClimb, setFlyToClimb]   = useState<Climb | null>(null);
  const [climbListOpen, setClimbListOpen] = useState(true);

  const updateClimbs = useCallback((points: RoutePoint[]) => {
    const detected = detectClimbs(points);
    setClimbs(detected);
    onClimbsDetected?.(detected);
  }, [onClimbsDetected]);

  const loadFountains = useCallback(async (points: RoutePoint[]) => {
    try {
      const result = await fetchDrinkingWaterNearRoute(points);
      setFountains(result);
      onFountainsLoaded?.(result);
    } catch {
      setFountains([]);
      onFountainsLoaded?.([]);
    }
  }, [onFountainsLoaded]);

  const handleMapClick = async (lat: number, lng: number) => {
    if (selectedClimb) { setSelectedClimb(null); return; }
    const newWaypoints = [...waypoints, [lat, lng] as [number, number]];
    setWaypoints(newWaypoints);
    if (newWaypoints.length >= 2) {
      setLoading(true);
      const points = await getOsrmRoute(newWaypoints);
      setLoading(false);
      if (points) {
        setRouteLine(points); onRouteUpdate(points);
        updateClimbs(points); loadFountains(points);
      }
    } else if (newWaypoints.length === 1) {
      const sp: RoutePoint = { latitude: lat, longitude: lng, elevation: 0, distance: 0, surface: "asphalt" };
      setRouteLine([sp]); onRouteUpdate([sp]);
      setClimbs([]); onClimbsDetected?.([]);
      setFountains([]); onFountainsLoaded?.([]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setWaypoints([]); setRouteLine([]); setClimbs([]); setFountains([]);
    setSelectedClimb(null); setHoveredClimb(null); setFlyToClimb(null);
    onRouteUpdate([]); onClimbsDetected?.([]); onFountainsLoaded?.([]);
  };

  const handleUndo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (waypoints.length === 0) return;
    const nw = waypoints.slice(0, -1);
    setWaypoints(nw); setSelectedClimb(null);
    if (nw.length === 0) {
      setRouteLine([]); setClimbs([]); setFountains([]);
      onRouteUpdate([]); onClimbsDetected?.([]); onFountainsLoaded?.([]);
    } else if (nw.length === 1) {
      const [lat, lng] = nw[0];
      const sp: RoutePoint = { latitude: lat, longitude: lng, elevation: 0, distance: 0, surface: "asphalt" };
      setRouteLine([sp]); setClimbs([]); setFountains([]);
      onRouteUpdate([sp]); onClimbsDetected?.([]); onFountainsLoaded?.([]);
    } else {
      setLoading(true);
      const points = await getOsrmRoute(nw);
      setLoading(false);
      if (points) {
        setRouteLine(points); onRouteUpdate(points);
        updateClimbs(points); loadFountains(points);
      }
    }
  };

  const handleClimbListClick = (climb: Climb) => {
    setFlyToClimb(climb);
    setSelectedClimb(prev => prev?.name === climb.name ? null : climb);
    setTimeout(() => setFlyToClimb(null), 1000);
  };

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer
        center={[40.4168, -3.7038]} zoom={13}
        className="z-0 font-sans"
        style={{ width:"100%", height:"100%", position:"absolute", inset:0 }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onMapClick={handleMapClick} />

        {/* Waypoint markers */}
        {waypoints.map((wp, idx) => (
          <CircleMarker key={idx} center={wp}
            radius={idx === 0 ? 8 : idx === waypoints.length - 1 ? 8 : 4}
            pathOptions={{
              color:"#FFFFFF", weight:2,
              fillColor: idx === 0 ? "#4A7A30" : idx === waypoints.length - 1 ? "#D96A27" : "#1A1A1A",
              fillOpacity:1,
            }}
          />
        ))}

        <RouteGradientLayer route={routeLine} />
        <ClimbHighlightLayer climb={hoveredClimb} route={routeLine} />
        <ClimbLabelsLayer climbs={climbs} onHover={setHoveredClimb}
          onClick={(c) => setSelectedClimb(prev => prev?.name === c.name ? null : c)}
        />
        <WaterFountainLayer fountains={fountains} />
        <FlyToClimbLayer climb={flyToClimb} route={routeLine} />

        {/* Chart hover marker */}
        {hoveredPointIndex != null && routeLine[hoveredPointIndex] && (
          <CircleMarker
            center={[routeLine[hoveredPointIndex].latitude, routeLine[hoveredPointIndex].longitude]}
            radius={7}
            pathOptions={{ color:"#FFFFFF", weight:2, fillColor:"#D96A27", fillOpacity:1 }}
          />
        )}
      </MapContainer>

      {/* ── Top info pill ── */}
      <div className="absolute top-[72px] right-4 z-10 text-[10px] sm:text-xs text-[#1A1A1A] bg-white/90 px-3 py-1.5 rounded-full backdrop-blur-sm border border-[#EAEAEA] shadow-sm">
        Haz clic en el mapa para trazar · Puntos: {waypoints.length}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="absolute top-[108px] right-4 z-10 text-[10px] sm:text-xs text-white bg-[#4A7A30] px-3 py-1.5 rounded-full animate-pulse shadow-md">
          Calculando ruta…
        </div>
      )}

      {/* ── Action buttons ── */}
      {waypoints.length > 0 && !loading && (
        <div className="absolute top-[108px] right-4 z-10 flex gap-2">
          {waypoints.length > 1 && (
            <button onClick={handleUndo}
              className="text-[10px] sm:text-xs bg-white hover:bg-[#F3F0E8] text-[#1A1A1A] px-3 py-1.5 rounded-full transition-colors shadow-sm cursor-pointer border border-[#EAEAEA]"
              title="Deshacer último punto"
            >
              ↩ Deshacer
            </button>
          )}
          <button onClick={handleClear}
            className="text-[10px] sm:text-xs bg-[#C0392B] hover:bg-[#A93226] text-white px-3 py-1.5 rounded-full transition-colors shadow-sm cursor-pointer"
          >
            Borrar Ruta
          </button>
        </div>
      )}

      {/* ── Climb list panel ── */}
      {climbs.length > 0 && (
        <div className="absolute top-[220px] left-4 z-10" style={{ maxWidth: 310 }}>
          <div className="bg-white/95 backdrop-blur-sm border border-[#EAEAEA] rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden">
            <button
              onClick={() => setClimbListOpen(!climbListOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#F9F7F2] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-[#757575]">
                <Mountain className="h-3.5 w-3.5 text-[#D96A27]" />
                Puertos ({climbs.length})
              </span>
              {climbListOpen
                ? <ChevronUp className="h-3.5 w-3.5 text-[#757575]" />
                : <ChevronDown className="h-3.5 w-3.5 text-[#757575]" />}
            </button>
            {climbListOpen && (
              <div className="max-h-[240px] overflow-y-auto">
                {climbs.map((c, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleClimbListClick(c)}
                    onMouseEnter={() => setHoveredClimb(c)}
                    onMouseLeave={() => setHoveredClimb(null)}
                    className={`w-full text-left px-3 py-2 border-t border-[#EAEAEA] hover:bg-[#F9F7F2] transition-all cursor-pointer ${
                      selectedClimb?.name === c.name ? "bg-[#F3F0E8]" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-semibold text-[#1A1A1A]">{c.name}</span>
                      <span
                        className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-full"
                        style={{
                          background: c.categoryColor + "15",
                          color: c.categoryColor,
                          border: `1px solid ${c.categoryColor}30`,
                        }}
                      >
                        {c.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#757575]">
                      <span>{c.lengthKm} km</span>
                      <span className="text-[#EAEAEA]">·</span>
                      <span>+{c.elevationGainM} m</span>
                      <span className="text-[#EAEAEA]">·</span>
                      <span style={{ color: getSlopeColor(c.avgSlopePct) }}>{c.avgSlopePct}%</span>
                      <span className="text-[#EAEAEA]">·</span>
                      <span className="text-[#2D4B1D]">APM {c.apm}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Fountain count pill ── */}
      {fountains.length > 0 && (
        <div className="absolute top-[72px] left-4 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-[#4A7A30]/20 px-3 py-1.5 rounded-full text-[10px] sm:text-xs text-[#4A7A30] shadow-sm font-medium">
          <Droplets className="h-3.5 w-3.5" />
          {fountains.length} fuente{fountains.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* ── Slope + Surface legend ── */}
      {routeLine.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 left-4 z-10 bg-white/95 backdrop-blur-sm border border-[#EAEAEA] rounded-2xl px-3 py-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.05)]" style={{ minWidth: 130 }}>
          <p className="text-[9px] font-bold tracking-widest uppercase text-[#757575] mb-1.5">Pendiente</p>
          <div className="flex flex-col gap-[3px]">
            {SLOPE_LEGEND.map(({ color, label, range }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span style={{ background: color }} className="inline-block w-4 h-[3px] rounded-full flex-shrink-0" />
                <span className="text-[10px] text-[#1A1A1A] leading-none">{label}</span>
                <span className="text-[9px] text-[#757575] leading-none ml-auto">{range}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-1.5 border-t border-[#EAEAEA]">
            <p className="text-[9px] font-bold tracking-widest uppercase text-[#757575] mb-1">Firme</p>
            <div className="flex flex-col gap-[3px]">
              {[
                { style: "solid",  label: "Asfalto" },
                { style: "dashed", label: "Grava" },
                { style: "dotted", label: "Trail" },
              ].map(({ style, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span style={{ borderBottom:`2px ${style} #757575`, display:"inline-block", width:16 }} />
                  <span className="text-[10px] text-[#1A1A1A] leading-none">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Climb detail panel ── */}
      {selectedClimb && (
        <ClimbDetailPanel
          climb={selectedClimb}
          routePoints={routeLine}
          onClose={() => setSelectedClimb(null)}
        />
      )}

      <style>{`
        .leaflet-container { background-color: #FAF8F5; }
        .leaflet-tooltip {
          background: white !important;
          border: 1px solid #E1EDDA !important;
          color: #1A1A1A !important;
          font-size: 11px !important;
          border-radius: 10px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06) !important;
        }
        .leaflet-tooltip-top::before { border-top-color: #E1EDDA !important; }
        .water-fountain-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .water-fountain-popup .leaflet-popup-content { margin: 0 !important; }
        .water-fountain-popup .leaflet-popup-tip { background: white !important; }
      `}</style>
    </div>
  );
}
