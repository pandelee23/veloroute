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
        <div className="absolute inset-0 bg-radial-[at_center] from-[#F9F9F7]/90 via-[#F9F9F7]/70 to-transparent pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-20 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-[12px] bg-[#1b2b24] flex items-center justify-center shadow-[4px_4px_0px_#c2c8c3] mb-10 transition-transform hover:scale-105">
            <Navigation2 className="h-10 w-10 text-white" />
          </div>
          
          <div className="bg-[#F9F9F7]/80 backdrop-blur-[12px] rounded-[4px] p-8 md:p-16 shadow-[8px_8px_0px_#c2c8c3] border border-[#c2c8c3]/30 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-7xl font-bold text-[#1a1c1b] tracking-tight mb-6 md:mb-8 leading-[1.1]">
              Planifica tus rutas ciclistas como un <span className="text-[#1b2b24]">profesional</span>
            </h1>
            
            <p className="text-lg md:text-2xl text-[#424845] mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed">
              VeloRoute Pro te permite crear rutas personalizadas con altimetría precisa, fuentes de agua en el camino y tiempos estimados.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6">
              <Link href="/planner" className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-[#cd4800] hover:bg-[#a33800] text-white rounded px-8 md:px-10 py-6 md:py-8 text-lg md:text-xl font-semibold shadow-[4px_4px_0px_#a33800] hover:shadow-[2px_2px_0px_#a33800] transition-all">
                  Empezar a planificar
                </Button>
              </Link>
              <Link href="/register" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full border-[#1b2b24]/30 text-[#1a1c1b] hover:bg-[#eeeeec] backdrop-blur-sm rounded px-8 md:px-10 py-6 md:py-8 text-lg md:text-xl font-medium transition-all">
                  Crear cuenta gratis
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
            <div className="group flex flex-col items-center p-10 bg-[#F9F9F7] rounded border border-[#c2c8c3]/50 shadow-sm hover:shadow-[4px_4px_0px_#c2c8c3] transition-all">
              <div className="w-16 h-16 rounded bg-[#1b2b24]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 text-[#1b2b24]" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-[#1a1c1b]">Altimetría Precisa</h3>
              <p className="text-[#424845] text-center leading-relaxed">
                Visualiza el perfil de elevación y los puertos de montaña de tu ruta antes de salir de casa.
              </p>
            </div>

            <div className="group flex flex-col items-center p-10 bg-[#F9F9F7] rounded border border-[#c2c8c3]/50 shadow-sm hover:shadow-[4px_4px_0px_#c2c8c3] transition-all">
              <div className="w-16 h-16 rounded bg-[#1b2b24]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Droplets className="w-8 h-8 text-[#1b2b24]" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-[#1a1c1b]">Puntos de Agua</h3>
              <p className="text-[#424845] text-center leading-relaxed">
                Encuentra fuentes de agua a lo largo de tu recorrido gracias a la integración con Overpass.
              </p>
            </div>

            <div className="group flex flex-col items-center p-10 bg-[#F9F9F7] rounded border border-[#c2c8c3]/50 shadow-sm hover:shadow-[4px_4px_0px_#c2c8c3] transition-all">
              <div className="w-16 h-16 rounded bg-[#1b2b24]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Map className="w-8 h-8 text-[#1b2b24]" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-[#1a1c1b]">Guarda tus Rutas</h3>
              <p className="text-[#424845] text-center leading-relaxed">
                Crea una cuenta para almacenar tus rutas favoritas y consultarlas cuando quieras.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-10 text-center text-[#424845]/60 bg-transparent border-t border-[#c2c8c3]/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4">
          <p className="label-caps">© {new Date().getFullYear()} VeloRoute Pro. Inspirado en la aventura.</p>
        </div>
      </footer>
    </div>
  );
}
