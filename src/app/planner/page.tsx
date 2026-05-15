"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { DataPanel } from "@/components/DataPanel";
import { ProfileChart } from "@/components/ProfileChart";
import { ExportButton } from "@/components/ExportButton";
import { SaveRouteButton } from "@/components/SaveRouteButton";
import { RoutePoint, RouteStats } from "@/types/route";
import { Climb } from "@/utils/climbDetection";
import { WaterFountain } from "@/services/overpassService";
import { Navbar } from "@/components/Navbar";
import { ShareButton } from "@/components/ShareButton";
import { decodeWaypoints } from "@/lib/shareUrl";
import { useEffect } from "react";

// Dynamic import with SSR disabled is required for React-Leaflet
const DynamicMapLeaflet = dynamic(
  () => import("@/components/MapLeaflet"),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#F9F9F7] flex items-center justify-center text-[#424845]">Cargando Mapa...</div> }
);

export default function Home() {
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [climbs, setClimbs] = useState<Climb[]>([]);
  const [fountains, setFountains] = useState<WaterFountain[]>([]);
  const [showDataPanel, setShowDataPanel] = useState(true);
  const [showProfile, setShowProfile] = useState(true);
  
  const [waypoints, setWaypoints] = useState<[number, number][]>([]);
  const [initialWaypoints, setInitialWaypoints] = useState<[number, number][] | undefined>(undefined);

  // Leer la ruta de la URL al cargar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('r');
      if (r) {
        const decoded = decodeWaypoints(r);
        if (decoded.length > 0) {
          setInitialWaypoints(decoded);
        }
      }
    }
  }, []);

  // Calculate dynamic stats based on route points from OSRM
  const currentStats: RouteStats = {
    totalDistance: routePoints.length > 0 ? routePoints[routePoints.length - 1].distance : 0,
    elevationGain: routePoints.reduce((acc, curr, idx, arr) => {
      if (idx === 0) return acc;
      const prev = arr[idx - 1];
      const diff = curr.elevation - prev.elevation;
      return diff > 0 ? acc + diff : acc;
    }, 0),
    // Rough estimate: 20 km/h avg speed for intermediate user + extra time for elevation (e.g. 1 min per 10m elev)
    estimatedTime: routePoints.length > 0 ? 
      ((routePoints[routePoints.length - 1].distance / 20) * 60) + 
      ((routePoints.reduce((acc, curr, idx, arr) => idx > 0 && curr.elevation > arr[idx - 1].elevation ? acc + (curr.elevation - arr[idx - 1].elevation) : acc, 0)) / 10) : 0,
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#F9F9F7] overflow-hidden relative font-[family-name:var(--font-geist)]">
      {/* Navbar compartido con auth */}
      <div className="relative z-20">
        <Navbar>
          <div className="flex items-center space-x-2">
            <ShareButton waypoints={waypoints} />
            <SaveRouteButton routePoints={routePoints} stats={currentStats} />
            <ExportButton routePoints={routePoints} />
          </div>
        </Navbar>
      </div>

      {/* Área del mapa interactivo (Carga dinámica SSR: false) */}
      <div className="flex-1 relative w-full overflow-hidden">
        <DynamicMapLeaflet 
          onRouteUpdate={setRoutePoints} 
          onClimbsDetected={setClimbs}
          onFountainsLoaded={setFountains}
          hoveredPointIndex={hoveredPointIndex} 
          initialWaypoints={initialWaypoints}
          onWaypointsChange={setWaypoints}
        />
        
        {/* Panel lateral superpuesto - Toggleable con pestaña lateral (Solo desktop) */}
        <div className={`hidden md:flex absolute top-4 left-0 z-30 items-start transition-transform duration-300 ease-in-out ${showDataPanel ? 'translate-x-4' : '-translate-x-[calc(100%-28px)]'}`}>
          <div className="flex-shrink-0 relative z-10">
            <DataPanel stats={currentStats} fountains={fountains} />
          </div>
          <button 
            onClick={() => setShowDataPanel(!showDataPanel)}
            className="bg-[#F9F9F7]/95 backdrop-blur-sm flex items-center justify-center w-11 h-14 shadow-[4px_4px_12px_rgba(0,0,0,0.08)] border border-l-0 border-[#c2c8c3] text-[#1b2b24] hover:bg-[#eeeeec] transition-colors mt-8 rounded-r cursor-pointer -ml-4 z-0 pl-3"
            title={showDataPanel ? "Ocultar estadísticas" : "Mostrar estadísticas"}
          >
            <div className={`transition-transform duration-300 ${showDataPanel ? 'rotate-180' : 'rotate-0'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          </button>
        </div>
      </div>

      {/* Gráfico de perfil anclado abajo - Toggleable con pestaña superior */}
      <div className="relative z-20 flex flex-col items-center">
        <button 
          onClick={() => setShowProfile(!showProfile)}
          className="absolute -top-8 bg-[#F9F9F7]/95 backdrop-blur-sm border border-b-0 border-[#c2c8c3] text-[#1b2b24] w-16 h-8 rounded-t shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex items-center justify-center hover:bg-[#eeeeec] transition-colors cursor-pointer z-30"
          title={showProfile ? "Ocultar perfil" : "Mostrar perfil"}
        >
          <div className={`transition-transform duration-300 ${showProfile ? 'rotate-180' : 'rotate-0'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
          </div>
        </button>

        <div className={`w-full grid transition-all duration-300 ease-in-out ${showProfile ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <ProfileChart 
              routePoints={routePoints} 
              onHover={setHoveredPointIndex}
              stats={currentStats}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
