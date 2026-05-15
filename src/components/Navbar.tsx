"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "./Auth/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Navigation2, User as UserIcon, LogOut, Menu, X, MapPin, LogIn, UserPlus } from "lucide-react";
import { Button } from "./ui/button";

export function Navbar({ children }: { children?: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMobileOpen(false);
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    if (mobileOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileOpen]);

  // Close on resize to desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const handler = () => { if (mq.matches) setMobileOpen(false); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      {/* ─── Main bar ─── */}
      <nav className="w-full px-4 sm:px-5 py-3 sm:py-4 flex justify-between items-center bg-[#F9F9F7]/80 backdrop-blur-[12px] border-b border-[#c2c8c3]/40 sticky top-0 z-50">
        {/* Logo — always visible */}
        <Link href="/" className="flex items-center space-x-2 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-[#1b2b24] flex items-center justify-center shadow-sm">
            <Navigation2 className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-white" />
          </div>
          <h1 className="text-[#1a1c1b] font-bold text-base sm:text-lg tracking-tight leading-none">
            VeloRoute
          </h1>
        </Link>

        {/* ─── Desktop actions (sm+) ─── */}
        <div className="hidden sm:flex items-center space-x-3">
          <Link href="/planner" className="label-caps text-[#1b2b24] hover:text-[#3a4a42] transition-colors whitespace-nowrap">
            Planificador
          </Link>
          {children}
          {!loading && (
            user ? (
              <div className="flex items-center space-x-2">
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="text-[#424845] hover:text-[#1a1c1b] px-3">
                    <UserIcon className="w-4 h-4 mr-2" />
                    Perfil
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout} className="text-[#424845] border-[#c2c8c3] hover:bg-[#eeeeec] px-3 rounded">
                  <LogOut className="w-4 h-4 mr-2" />
                  Salir
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-[#424845] hover:text-[#1a1c1b] px-3">
                    Entrar
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-[#cd4800] hover:bg-[#a33800] text-white rounded px-4 text-sm font-medium">
                    Registrarse
                  </Button>
                </Link>
              </div>
            )
          )}
        </div>

        {/* ─── Mobile hamburger (< sm) ─── */}
        <button
          className="sm:hidden flex items-center justify-center w-9 h-9 rounded bg-[#eeeeec] text-[#1b2b24] active:scale-95 transition-all"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* ─── Mobile dropdown panel ─── */}
      <div
        className={`sm:hidden absolute top-full left-0 right-0 z-50 bg-[#F9F9F7]/95 backdrop-blur-xl border-b border-[#c2c8c3]/40 shadow-lg overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          mobileOpen
            ? "max-h-[400px] opacity-100"
            : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="px-5 py-4 space-y-3">
          {/* Action buttons row — route actions passed as children */}
          {children && (
            <div className="pb-3 border-b border-[#c2c8c3]/30">
              <p className="label-caps text-[#737874] mb-2.5">Acciones de ruta</p>
              <div className="flex items-center gap-2 flex-wrap">
                {children}
              </div>
            </div>
          )}

          {/* Navigation links */}
          <div className="space-y-1">
            <Link
              href="/planner"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded text-[#1a1c1b] hover:bg-[#eeeeec] transition-colors"
            >
              <MapPin className="w-4 h-4 text-[#1b2b24]" />
              <span className="text-sm font-medium">Planificador</span>
            </Link>

            {!loading && (
              user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded text-[#1a1c1b] hover:bg-[#eeeeec] transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-[#1b2b24]" />
                    <span className="text-sm font-medium">Mi perfil</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded text-[#424845] hover:bg-[#ffdad6] hover:text-[#ba1a1a] transition-colors w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Cerrar sesión</span>
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-1">
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1">
                    <Button variant="outline" className="w-full text-[#1b2b24] border-[#c2c8c3] hover:bg-[#eeeeec] rounded h-10 text-sm font-medium">
                      <LogIn className="w-4 h-4 mr-2" />
                      Entrar
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1">
                    <Button className="w-full bg-[#cd4800] hover:bg-[#a33800] text-white rounded h-10 text-sm font-medium">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Registrarse
                    </Button>
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
