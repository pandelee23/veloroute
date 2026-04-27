"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/Auth/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Map,
  TrendingUp,
  Clock,
  Calendar,
  Route,
  Loader2,
  LogOut,
  Plus,
} from "lucide-react";

interface SavedRoute {
  id: string;
  name: string;
  total_distance: number;
  elevation_gain: number;
  estimated_time: number;
  created_at: string;
}

function formatDistance(km: number) {
  return km >= 1 ? `${km.toFixed(1)} km` : `${(km * 1000).toFixed(0)} m`;
}

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  return `${h}h ${m}m`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

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
        .select("id, name, total_distance, elevation_gain, estimated_time, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setRoutes(data as SavedRoute[]);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

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
        {/* Header del perfil */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="w-14 h-14 rounded-full bg-[#4A7A30] flex items-center justify-center text-white text-xl font-bold mb-3 shadow-sm">
              {user.email?.[0].toUpperCase()}
            </div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Mi Perfil</h1>
            <p className="text-[#757575] text-sm mt-0.5">{user.email}</p>
          </div>
          <div className="flex space-x-2">
            <Link href="/planner">
              <Button size="sm" className="bg-[#4A7A30] hover:bg-[#3A6025] text-white rounded-full">
                <Plus className="w-4 h-4 mr-1.5" />
                Nueva ruta
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-[#757575] border-[#EAEAEA] hover:bg-[#EAEAEA] rounded-full"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Salir
            </Button>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: Route,
              label: "Rutas guardadas",
              value: routes.length,
            },
            {
              icon: Map,
              label: "Distancia total",
              value: formatDistance(routes.reduce((a, r) => a + r.total_distance, 0)),
            },
            {
              icon: TrendingUp,
              label: "Desnivel total",
              value: `${routes.reduce((a, r) => a + r.elevation_gain, 0).toFixed(0)} m`,
            },
            {
              icon: Clock,
              label: "Tiempo total",
              value: formatTime(routes.reduce((a, r) => a + r.estimated_time, 0)),
            },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-[#EAEAEA] p-5 shadow-sm flex flex-col items-center text-center"
            >
              <Icon className="w-6 h-6 text-[#4A7A30] mb-2" />
              <span className="text-2xl font-bold text-[#1A1A1A]">{value}</span>
              <span className="text-xs text-[#757575] mt-0.5">{label}</span>
            </div>
          ))}
        </div>

        {/* Lista de rutas */}
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Mis rutas</h2>

          {loadingRoutes ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#4A7A30] animate-spin" />
            </div>
          ) : routes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#EAEAEA] shadow-sm p-12 flex flex-col items-center text-center">
              <Map className="w-12 h-12 text-[#BDBDBD] mb-4" />
              <p className="text-lg font-medium text-[#1A1A1A] mb-1">No tienes rutas guardadas aún</p>
              <p className="text-sm text-[#757575] mb-6">
                Crea tu primera ruta en el planificador y guárdala aquí.
              </p>
              <Link href="/planner">
                <Button className="bg-[#4A7A30] hover:bg-[#3A6025] text-white rounded-full">
                  Ir al planificador
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {routes.map((route) => (
                <div
                  key={route.id}
                  className="bg-white rounded-2xl border border-[#EAEAEA] shadow-sm p-5 flex items-center justify-between hover:border-[#4A7A30] transition-colors group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-[#F9F7F2] flex items-center justify-center group-hover:bg-[#EBF4E3] transition-colors">
                      <Route className="w-5 h-5 text-[#4A7A30]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1A1A1A]">{route.name}</p>
                      <div className="flex items-center space-x-3 text-xs text-[#757575] mt-0.5">
                        <span className="flex items-center gap-1">
                          <Map className="w-3 h-3" />
                          {formatDistance(route.total_distance)}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {route.elevation_gain.toFixed(0)} m
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(route.estimated_time)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(route.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRoute(route.id)}
                    className="text-[#BDBDBD] hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
