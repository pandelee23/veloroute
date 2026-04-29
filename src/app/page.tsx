"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Map, TrendingUp, Droplets, Navigation2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen topo-pattern">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Glass Container with Radial Gradient */}
        <div className="absolute inset-0 bg-radial-[at_center] from-white/90 via-white/70 to-transparent pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-20 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-[#4A7A30] flex items-center justify-center shadow-2xl mb-10 transition-transform hover:scale-105">
            <Navigation2 className="h-10 w-10 text-white" />
          </div>
          
          <div className="bg-white/80 backdrop-blur-md rounded-[3rem] p-8 md:p-16 shadow-2xl border border-white/50 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-7xl font-bold text-[#1A1A1A] tracking-tight mb-6 md:mb-8 leading-[1.1]">
              Planifica tus rutas ciclistas como un <span className="text-[#4A7A30]">profesional</span>
            </h1>
            
            <p className="text-lg md:text-2xl text-[#1A1A1A]/70 mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed">
              VeloRoute Pro te permite crear rutas personalizadas con altimetría precisa, fuentes de agua en el camino y tiempos estimados.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6">
              <Link href="/planner" className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-[#4A7A30] hover:bg-[#3A6025] text-white rounded-full px-8 md:px-10 py-6 md:py-8 text-lg md:text-xl font-semibold shadow-xl transition-all hover:shadow-[#4A7A30]/20">
                  Empezar a planificar
                </Button>
              </Link>
              <Link href="/register" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full border-[#4A7A30]/20 text-[#1A1A1A] hover:bg-white/50 backdrop-blur-sm rounded-full px-8 md:px-10 py-6 md:py-8 text-lg md:text-xl font-medium transition-all">
                  Crear cuenta gratis
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
            <div className="group flex flex-col items-center p-10 bg-white rounded-[2rem] shadow-sm hover:shadow-xl transition-all border border-[#E1EDDA]/50">
              <div className="w-16 h-16 rounded-2xl bg-[#4A7A30]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 text-[#4A7A30]" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-[#1A1A1A]">Altimetría Precisa</h3>
              <p className="text-[#1A1A1A]/60 text-center leading-relaxed">
                Visualiza el perfil de elevación y los puertos de montaña de tu ruta antes de salir de casa.
              </p>
            </div>

            <div className="group flex flex-col items-center p-10 bg-white rounded-[2rem] shadow-sm hover:shadow-xl transition-all border border-[#E1EDDA]/50">
              <div className="w-16 h-16 rounded-2xl bg-[#4A7A30]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Droplets className="w-8 h-8 text-[#4A7A30]" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-[#1A1A1A]">Puntos de Agua</h3>
              <p className="text-[#1A1A1A]/60 text-center leading-relaxed">
                Encuentra fuentes de agua a lo largo de tu recorrido gracias a la integración con Overpass.
              </p>
            </div>

            <div className="group flex flex-col items-center p-10 bg-white rounded-[2rem] shadow-sm hover:shadow-xl transition-all border border-[#E1EDDA]/50">
              <div className="w-16 h-16 rounded-2xl bg-[#4A7A30]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Map className="w-8 h-8 text-[#4A7A30]" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-[#1A1A1A]">Guarda tus Rutas</h3>
              <p className="text-[#1A1A1A]/60 text-center leading-relaxed">
                Crea una cuenta para almacenar tus rutas favoritas y consultarlas cuando quieras.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-10 text-center text-[#1A1A1A]/40 bg-transparent border-t border-[#1A1A1A]/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-sm">© {new Date().getFullYear()} VeloRoute Pro. Inspirado en la aventura.</p>
        </div>
      </footer>
    </div>
  );
}

