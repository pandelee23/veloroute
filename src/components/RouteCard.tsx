"use client";

import React, { useMemo } from "react";
import { Download, Trash2, MoreHorizontal, TrendingUp, TrendingDown, Clock, MapPin } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
export interface SavedRouteData {
  id: string;
  name: string;
  total_distance: number;
  elevation_gain: number;
  estimated_time: number;
  created_at: string | null;
  geojson?: {
    type: string;
    coordinates: [number, number][];
  } | null;
}

interface RouteCardProps {
  route: SavedRouteData;
  onDelete: (id: string) => void;
  onExportGPX: (route: SavedRouteData) => void;
}

// ─── Helpers ─────────────────────────────────────────────────
function formatDistance(km: number) {
  return km >= 1 ? `${km.toFixed(1)} km` : `${(km * 1000).toFixed(0)} m`;
}

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} h`;
}

function formatDate(iso: string | null) {
  if (!iso) return "Fecha desconocida";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getDifficulty(distanceKm: number, elevationGain: number) {
  // Simple heuristic based on distance and elevation
  const score = distanceKm * 0.5 + elevationGain * 0.01;
  if (score < 10) return { label: "Fácil", color: "#4A7A30", bg: "#F2F7EE" };
  if (score < 25) return { label: "Moderado", color: "#6B9E50", bg: "#F2F7EE" };
  return { label: "Difícil", color: "#D96A27", bg: "#FFF4ED" };
}

// ─── Mini‑map SVG ────────────────────────────────────────────
function MiniMap({ coordinates }: { coordinates: [number, number][] }) {
  const { pathD, viewBox } = useMemo(() => {
    if (!coordinates || coordinates.length < 2) {
      return { pathD: "", viewBox: "0 0 100 100" };
    }

    // coordinates are [lng, lat]
    const lngs = coordinates.map((c) => c[0]);
    const lats = coordinates.map((c) => c[1]);

    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const rangeLng = maxLng - minLng || 0.001;
    const rangeLat = maxLat - minLat || 0.001;

    const padding = 12;
    const size = 120;
    const inner = size - padding * 2;

    // Sample down to ~80 points for performance
    const step = Math.max(1, Math.floor(coordinates.length / 80));
    const sampled = coordinates.filter((_, i) => i % step === 0 || i === coordinates.length - 1);

    const points = sampled.map((c) => {
      const x = padding + ((c[0] - minLng) / rangeLng) * inner;
      // Flip Y axis because SVG y goes down, but latitude goes up
      const y = padding + ((maxLat - c[1]) / rangeLat) * inner;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const d = `M${points.join("L")}`;
    return { pathD: d, viewBox: `0 0 ${size} ${size}` };
  }, [coordinates]);

  if (!coordinates || coordinates.length < 2) {
    return (
      <div className="route-card__thumbnail route-card__thumbnail--empty">
        <MapPin className="w-6 h-6 text-[#BDBDBD]" />
      </div>
    );
  }

  return (
    <div className="route-card__thumbnail">
      <svg viewBox={viewBox} className="route-card__minimap-svg">
        <path
          d={pathD}
          fill="none"
          stroke="#4A7A30"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Start dot */}
        <circle
          cx={pathD.match(/^M([\d.]+),([\d.]+)/)?.[1] || 0}
          cy={pathD.match(/^M([\d.]+),([\d.]+)/)?.[2] || 0}
          r="3.5"
          fill="#4A7A30"
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}

// ─── Route Card ──────────────────────────────────────────────
export function RouteCard({ route, onDelete, onExportGPX }: RouteCardProps) {
  const difficulty = getDifficulty(route.total_distance, route.elevation_gain);
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <div className="route-card">
      {/* Thumbnail */}
      <MiniMap coordinates={route.geojson?.coordinates || []} />

      {/* Content */}
      <div className="route-card__content">
        {/* Difficulty badge */}
        <span
          className="route-card__badge"
          style={{ background: difficulty.bg, color: difficulty.color, borderColor: difficulty.color + "30" }}
        >
          {difficulty.label}
        </span>

        {/* Name */}
        <h3 className="route-card__name">{route.name}</h3>

        {/* Stats row */}
        <div className="route-card__stats">
          <span className="route-card__stat">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(route.estimated_time)}
          </span>
          <span className="route-card__stat-sep">·</span>
          <span className="route-card__stat">
            <strong>{formatDistance(route.total_distance)}</strong>
          </span>
          <span className="route-card__stat-sep">·</span>
          <span className="route-card__stat">
            <TrendingUp className="w-3.5 h-3.5" />
            {route.elevation_gain.toFixed(0)} m
          </span>
          <span className="route-card__stat-sep">·</span>
          <span className="route-card__stat">
            <TrendingDown className="w-3.5 h-3.5" />
            {route.elevation_gain.toFixed(0)} m
          </span>
        </div>

        {/* Date */}
        <p className="route-card__date">
          {formatDate(route.created_at)}
        </p>
      </div>

      {/* Actions */}
      <div className="route-card__actions">
        <button
          className="route-card__action-btn"
          onClick={() => onExportGPX(route)}
          title="Descargar GPX"
        >
          <Download className="w-[18px] h-[18px]" />
        </button>
        <div className="route-card__action-menu-wrapper">
          <button
            className="route-card__action-btn"
            onClick={() => setShowMenu(!showMenu)}
            title="Más opciones"
          >
            <MoreHorizontal className="w-[18px] h-[18px]" />
          </button>
          {showMenu && (
            <>
              <div className="route-card__backdrop" onClick={() => setShowMenu(false)} />
              <div className="route-card__dropdown">
                <button
                  className="route-card__dropdown-item route-card__dropdown-item--danger"
                  onClick={() => { onDelete(route.id); setShowMenu(false); }}
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar ruta
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
