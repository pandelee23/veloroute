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
    <nav className="w-full px-5 py-4 flex justify-between items-center bg-[#F9F7F2] border-b border-[#EAEAEA]">
      <Link href="/" className="flex items-center space-x-2.5">
        <div className="w-9 h-9 rounded-full bg-[#4A7A30] flex items-center justify-center shadow-sm">
          <Navigation2 className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <h1 className="text-[#1A1A1A] font-bold text-lg tracking-tight leading-none">VeloRoute Pro</h1>
        </div>
      </Link>

      <div className="flex items-center space-x-3">
        <Link href="/planner" className="text-sm font-medium text-[#4A7A30] hover:text-[#3A6025] transition-colors">
          Planificador
        </Link>
        {children}
        {!loading && (
          user ? (
            <div className="flex items-center space-x-2">
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="text-[#757575] hover:text-[#1A1A1A]">
                  <UserIcon className="w-4 h-4 mr-2" />
                  Perfil
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout} className="text-[#757575] border-[#EAEAEA] hover:bg-[#EAEAEA]">
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-[#757575] hover:text-[#1A1A1A]">
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-[#4A7A30] hover:bg-[#3A6025] text-white rounded-full">
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
