"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { RoutePoint } from "@/types/route";

interface ExportButtonProps {
  routePoints: RoutePoint[];
}

export function ExportButton({ routePoints }: ExportButtonProps) {
  const handleExport = () => {
    if (routePoints.length === 0) return;
    
    // Generación mock de GPX
    let gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="PlanificadorRutas">\n  <trk>\n    <name>Ruta Ciclista</name>\n    <trkseg>\n`;
    
    routePoints.forEach(p => {
      gpx += `      <trkpt lat="${p.latitude}" lon="${p.longitude}">\n        <ele>${p.elevation}</ele>\n      </trkpt>\n`;
    });
    
    gpx += `    </trkseg>\n  </trk>\n</gpx>`;

    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ruta-planificada.gpx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button 
      onClick={handleExport}
      disabled={routePoints.length === 0}
      className="bg-[#EAE5D9] hover:bg-[#DDD7C9] text-[#1A1A1A] rounded-[20px] border-0 shadow-sm font-medium text-sm transition-all"
    >
      <Download className="mr-1.5 h-4 w-4" />
      Exportar GPX
    </Button>
  );
}
