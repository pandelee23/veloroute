"use client";

import Link from "next/link";
import { useAuth } from "./Auth/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Navigation2, User as UserIcon, LogOut } from "lucide-react";
import { Button } from "./ui/button";

export function Navbar({ children }: { children?: React.ReactNode }) {
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="w-full px-5 py-4 flex justify-between items-center bg-transparent backdrop-blur-sm border-b border-[#1A1A1A]/5 sticky top-0 z-50">
      <Link href="/" className="flex items-center space-x-2.5 shrink-0">
        <div className="w-9 h-9 rounded-full bg-[#4A7A30] flex items-center justify-center shadow-sm">
          <Navigation2 className="h-4.5 w-4.5 text-white" />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-[#1A1A1A] font-bold text-lg tracking-tight leading-none">VeloRoute Pro</h1>
        </div>
      </Link>

      <div className="flex items-center space-x-2 sm:space-x-3">
        <Link href="/planner" className="text-xs sm:text-sm font-medium text-[#4A7A30] hover:text-[#3A6025] transition-colors whitespace-nowrap">
          Planificador
        </Link>
        {children}
        {!loading && (
          user ? (
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="text-[#757575] hover:text-[#1A1A1A] px-2 sm:px-3">
                  <UserIcon className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Perfil</span>
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout} className="text-[#757575] border-[#EAEAEA] hover:bg-[#EAEAEA] px-2 sm:px-3">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-[#757575] hover:text-[#1A1A1A] px-2 sm:px-3">
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-[#4A7A30] hover:bg-[#3A6025] text-white rounded-full px-3 sm:px-4 text-xs sm:text-sm">
                  Registrarse
                </Button>
              </Link>
            </div>
          )
        )}
      </div>
    </nav>
  );
}
