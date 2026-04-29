"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/Auth/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { RouteCard, SavedRouteData } from "@/components/RouteCard";
import {
  Map,
  TrendingUp,
  Clock,
  Route,
  Loader2,
  Plus,
  Search,
  ArrowUpDown,
  Bike,
} from "lucide-react";
import "./profile.css";

type SortKey = "date" | "distance" | "elevation" | "time";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [routes, setRoutes] = useState<SavedRouteData[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("date");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchRoutes = async () => {
      setLoadingRoutes(true);
      const { data, error } = await supabase
        .from("routes")
        .select("id, name, total_distance, elevation_gain, estimated_time, created_at, geometry, user_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        // We need to fetch geometry as GeoJSON separately since the PostGIS column
        // comes as WKB by default. Use a separate RPC or raw SQL.
        const routeIds = data.map((r: { id: string }) => r.id);
        
        let geojsonMap: Record<string, { type: string; coordinates: [number, number][] }> = {};
        
        if (routeIds.length > 0) {
          const { data: geoData } = await supabase.rpc("get_routes_geojson", {
            route_ids: routeIds,
          }).select();

          if (geoData && Array.isArray(geoData)) {
            geoData.forEach((g: { id: string; geojson: string }) => {
              try {
                geojsonMap[g.id] = JSON.parse(g.geojson);
              } catch { /* skip invalid */ }
            });
          }
        }

        setRoutes(
          data.map((r: any) => ({
            id: r.id,
            name: r.name,
            total_distance: Number(r.total_distance),
            elevation_gain: Number(r.elevation_gain),
            estimated_time: Number(r.estimated_time),
            created_at: r.created_at,
            geojson: geojsonMap[r.id] || null,
          }))
        );
      }
      setLoadingRoutes(false);
    };

    fetchRoutes();
  }, [user]);

  const handleDeleteRoute = async (id: string) => {
    const { error } = await supabase.from("routes").delete().eq("id", id);
    if (!error) {
      setRoutes((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleExportGPX = (route: SavedRouteData) => {
    if (!route.geojson?.coordinates || route.geojson.coordinates.length < 2) {
      alert("Esta ruta no tiene datos de geometría para exportar.");
      return;
    }

    const trackPoints = route.geojson.coordinates
      .map(([lng, lat]) => `      <trkpt lat="${lat}" lon="${lng}"></trkpt>`)
      .join("\n");

    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="VeloRoute Pro">
  <trk>
    <name>${route.name}</name>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([gpx], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${route.name.replace(/\s+/g, "_")}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Filtering & Sorting ──────────────────────────────────
  const filtered = useMemo(() => {
    let result = routes;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => r.name.toLowerCase().includes(q));
    }

    const sorted = [...result];
    switch (sortBy) {
      case "date":
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "distance":
        sorted.sort((a, b) => b.total_distance - a.total_distance);
        break;
      case "elevation":
        sorted.sort((a, b) => b.elevation_gain - a.elevation_gain);
        break;
      case "time":
        sorted.sort((a, b) => b.estimated_time - a.estimated_time);
        break;
    }

    return sorted;
  }, [routes, searchQuery, sortBy]);

  // ── Quick stats ──────────────────────────────────────────
  const totalDist = routes.reduce((a, r) => a + r.total_distance, 0);
  const totalElev = routes.reduce((a, r) => a + r.elevation_gain, 0);
  const totalTime = routes.reduce((a, r) => a + r.estimated_time, 0);

  function formatDistance(km: number) {
    return km >= 1 ? `${km.toFixed(1)} km` : `${(km * 1000).toFixed(0)} m`;
  }
  function formatTime(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h === 0) return `${m} min`;
    return `${h}h ${m}m`;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F7F2]">
        <Loader2 className="w-8 h-8 text-[#4A7A30] animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F7F2]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
              Rutas guardadas
            </h1>
          </div>
          <Link href="/planner">
            <Button className="bg-[#D96A27] hover:bg-[#C55E20] text-white rounded-full px-4 sm:px-5 py-2 sm:py-2.5 font-semibold text-xs sm:text-sm shadow-sm">
              <Plus className="w-4 h-4 mr-1 sm:mr-1.5" />
              <span className="hidden sm:inline">Nueva ruta</span>
              <span className="sm:hidden">Nueva</span>
            </Button>
          </Link>
        </div>

        <p className="text-[#757575] text-sm mb-6">
          {routes.length} {routes.length === 1 ? "Tour" : "Tours"}
        </p>

        {/* ── Quick stats strip ───────────────────────────── */}
        {routes.length > 0 && (
          <div className="flex items-center gap-6 mb-6 text-sm overflow-x-auto pb-2 scrollbar-hide">
            <span className="flex items-center gap-1.5 text-[#757575] shrink-0">
              <Route className="w-4 h-4 text-[#4A7A30]" />
              <strong className="text-[#1A1A1A]">{routes.length}</strong> rutas
            </span>
            <span className="flex items-center gap-1.5 text-[#757575] shrink-0">
              <Map className="w-4 h-4 text-[#4A7A30]" />
              <strong className="text-[#1A1A1A]">{formatDistance(totalDist)}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-[#757575] shrink-0">
              <TrendingUp className="w-4 h-4 text-[#4A7A30]" />
              <strong className="text-[#1A1A1A]">{totalElev.toFixed(0)} m</strong>
            </span>
            <span className="flex items-center gap-1.5 text-[#757575] shrink-0">
              <Clock className="w-4 h-4 text-[#4A7A30]" />
              <strong className="text-[#1A1A1A]">{formatTime(totalTime)}</strong>
            </span>
          </div>
        )}

        {/* ── Search bar ──────────────────────────────────── */}
        <div className="profile-search mb-4">
          <Search className="profile-search__icon w-5 h-5" />
          <input
            type="text"
            className="profile-search__input"
            placeholder="Buscar por nombre de la ruta"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* ── Filter & sort bar ───────────────────────────── */}
        <div className="profile-filters mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button className="profile-filter profile-filter--active shrink-0">
            <Bike className="w-3.5 h-3.5" />
            Ciclismo
          </button>
          <select
            className="profile-sort-select shrink-0"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
          >
            <option value="date">Fecha</option>
            <option value="distance">Distancia</option>
            <option value="elevation">Desnivel</option>
            <option value="time">Duración</option>
          </select>
          <button className="profile-filter shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5" />
            Distancia/duración
          </button>
          <button className="profile-filter shrink-0">Desnivel</button>
          <button className="profile-filter shrink-0">Dificultad</button>
        </div>

        {/* ── Route list ──────────────────────────────────── */}
        {loadingRoutes ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 text-[#4A7A30] animate-spin" />
          </div>
        ) : filtered.length === 0 && routes.length === 0 ? (
          <div className="route-list">
            <div className="profile-empty">
              <div className="profile-empty__icon">
                <Map className="w-7 h-7 text-[#BDBDBD]" />
              </div>
              <p className="profile-empty__title">No tienes rutas guardadas aún</p>
              <p className="profile-empty__text">
                Crea tu primera ruta en el planificador y guárdala aquí.
              </p>
              <Link href="/planner">
                <Button className="bg-[#4A7A30] hover:bg-[#3A6025] text-white rounded-full">
                  Ir al planificador
                </Button>
              </Link>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="route-list">
            <div className="profile-empty">
              <div className="profile-empty__icon">
                <Search className="w-6 h-6 text-[#BDBDBD]" />
              </div>
              <p className="profile-empty__title">Sin resultados</p>
              <p className="profile-empty__text">
                No se encontraron rutas que coincidan con &quot;{searchQuery}&quot;
              </p>
            </div>
          </div>
        ) : (
          <div className="route-list">
            {filtered.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                onDelete={handleDeleteRoute}
                onExportGPX={handleExportGPX}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
