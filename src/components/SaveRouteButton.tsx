"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Check, LogIn } from "lucide-react";
import { RoutePoint, RouteStats } from "@/types/route";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/Auth/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface SaveRouteButtonProps {
  routePoints: RoutePoint[];
  stats: RouteStats;
}

export function SaveRouteButton({ routePoints, stats }: SaveRouteButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [routeName, setRouteName] = useState("");

  const handleInitialClick = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (routePoints.length < 2) return;
    
    setRouteName(`Ruta de Entrenamiento - ${new Date().toLocaleDateString()}`);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsDialogOpen(false);
    setSaving(true);

    // Construct WKT (Well-Known Text) LINESTRING
    // PostGIS expects coordinates in LONGITUDE LATITUDE order
    const wktCoords = routePoints.map(p => `${p.longitude} ${p.latitude}`).join(', ');
    const lineString = `SRID=4326;LINESTRING(${wktCoords})`;

    try {
      const { error } = await supabase.from('routes').insert({
        user_id: user.id,
        name: routeName.trim() || `Ruta de Entrenamiento - ${new Date().toLocaleDateString()}`,
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
    <>
      <Button
        onClick={handleInitialClick}
        disabled={routePoints.length < 2 || saving || success}
        className={`rounded shadow-sm font-medium text-sm transition-all border-0 ${
          success
            ? 'bg-[#1b2b24] hover:bg-[#3a4a42] text-white'
            : 'bg-[#cd4800] hover:bg-[#a33800] text-white'
        }`}
      >
        {saving ? (
          <Loader2 className="sm:mr-1.5 h-4 w-4 animate-spin" />
        ) : success ? (
          <Check className="sm:mr-1.5 h-4 w-4" />
        ) : !user ? (
          <LogIn className="sm:mr-1.5 h-4 w-4" />
        ) : (
          <Save className="sm:mr-1.5 h-4 w-4" />
        )}
        <span className="hidden sm:inline">
          {success ? "Guardado" : !user ? "Inicia sesión" : "Guardar"}
        </span>
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar ruta</DialogTitle>
            <DialogDescription>
              Ponle un nombre a tu ruta para encontrarla fácilmente después.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <input
              type="text"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
              }}
              placeholder="Ej: Ruta por la sierra"
              className="w-full rounded-md border border-[#c2c8c3] px-3 py-2 text-sm text-[#1b2b24] outline-none focus:border-[#cd4800] focus:ring-1 focus:ring-[#cd4800] bg-white transition-colors"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded text-[#424845]">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="rounded bg-[#cd4800] hover:bg-[#a33800] text-white">
              Guardar ruta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
