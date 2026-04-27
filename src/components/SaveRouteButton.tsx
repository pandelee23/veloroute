"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Check, LogIn } from "lucide-react";
import { RoutePoint, RouteStats } from "@/types/route";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/Auth/AuthContext";

interface SaveRouteButtonProps {
  routePoints: RoutePoint[];
  stats: RouteStats;
}

export function SaveRouteButton({ routePoints, stats }: SaveRouteButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (routePoints.length < 2) return;

    setSaving(true);

    // Construct WKT (Well-Known Text) LINESTRING
    // PostGIS expects coordinates in LONGITUDE LATITUDE order
    const wktCoords = routePoints.map(p => `${p.longitude} ${p.latitude}`).join(', ');
    const lineString = `SRID=4326;LINESTRING(${wktCoords})`;

    try {
      const { error } = await supabase.from('routes').insert({
        user_id: user.id,
        name: `Ruta de Entrenamiento - ${new Date().toLocaleDateString()}`,
        total_distance: stats.totalDistance,
        elevation_gain: stats.elevationGain,
        estimated_time: stats.estimatedTime,
        geometry: lineString
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error al guardar la ruta:", err);
      alert("Hubo un problema guardando la ruta. Mira la consola.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button
      onClick={handleSave}
      disabled={routePoints.length < 2 || saving || success}
      className={`rounded-[9999px] shadow-sm font-medium text-sm transition-all border-0 ${
        success
          ? 'bg-[#4A7A30] hover:bg-[#3A6025] text-white'
          : 'bg-[#4A7A30] hover:bg-[#3A6025] text-white'
      }`}
    >
      {saving ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : success ? (
        <Check className="mr-1.5 h-4 w-4" />
      ) : !user ? (
        <LogIn className="mr-1.5 h-4 w-4" />
      ) : (
        <Save className="mr-1.5 h-4 w-4" />
      )}
      {success ? "Guardado" : !user ? "Inicia sesión" : "Guardar"}
    </Button>
  );
}
