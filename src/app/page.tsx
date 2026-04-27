"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Map, TrendingUp, Droplets, Navigation2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-[#F9F7F2] to-white">
        <div className="w-16 h-16 rounded-full bg-[#4A7A30] flex items-center justify-center shadow-lg mb-8">
          <Navigation2 className="h-8 w-8 text-white" />
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-[#1A1A1A] tracking-tight mb-6 max-w-3xl">
          Planifica tus rutas ciclistas como un <span className="text-[#4A7A30]">profesional</span>
        </h1>
        
        <p className="text-lg md:text-xl text-[#757575] mb-10 max-w-2xl leading-relaxed">
          VeloRoute Pro te permite crear rutas personalizadas con altimetría precisa, fuentes de agua en el camino y tiempos estimados según el desnivel.
        </p>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <Link href="/planner">
            <Button size="lg" className="w-full sm:w-auto bg-[#4A7A30] hover:bg-[#3A6025] text-white rounded-full px-8 py-6 text-lg shadow-md">
              Empezar a planificar
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-[#EAEAEA] text-[#1A1A1A] hover:bg-[#F9F7F2] rounded-full px-8 py-6 text-lg">
              Crear cuenta gratis
            </Button>
          </Link>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4">
          <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-[#EAEAEA]">
            <TrendingUp className="w-10 h-10 text-[#4A7A30] mb-4" />
            <h3 className="text-xl font-semibold mb-2">Altimetría Precisa</h3>
            <p className="text-[#757575] text-sm">Visualiza el perfil de elevación y los puertos de montaña de tu ruta antes de salir de casa.</p>
          </div>
          <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-[#EAEAEA]">
            <Droplets className="w-10 h-10 text-[#4A7A30] mb-4" />
            <h3 className="text-xl font-semibold mb-2">Puntos de Agua</h3>
            <p className="text-[#757575] text-sm">Encuentra fuentes de agua a lo largo de tu recorrido gracias a la integración con Overpass.</p>
          </div>
          <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-[#EAEAEA]">
            <Map className="w-10 h-10 text-[#4A7A30] mb-4" />
            <h3 className="text-xl font-semibold mb-2">Guarda tus Rutas</h3>
            <p className="text-[#757575] text-sm">Crea una cuenta para almacenar tus rutas favoritas y consultarlas cuando quieras.</p>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-[#757575] bg-white border-t border-[#EAEAEA]">
        © {new Date().getFullYear()} VeloRoute Pro. Todos los derechos reservados.
      </footer>
    </div>
  );
}
