"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Navigation2, Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
    } else {
      router.push("/profile");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F7F2] to-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-full bg-[#4A7A30] flex items-center justify-center shadow-md mb-3">
            <Navigation2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">VeloRoute Pro</h1>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EAEAEA] p-8">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Bienvenido de nuevo</h2>
          <p className="text-[#757575] text-sm mb-6">Inicia sesión para ver tus rutas guardadas</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@correo.com"
                className="w-full px-4 py-2.5 rounded-lg border border-[#EAEAEA] bg-[#FAF8F5] text-[#1A1A1A] text-sm focus:outline-none focus:ring-2 focus:ring-[#4A7A30] focus:border-transparent transition-all placeholder:text-[#BDBDBD]"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-[#EAEAEA] bg-[#F9F7F2] text-[#1A1A1A] text-sm focus:outline-none focus:ring-2 focus:ring-[#4A7A30] focus:border-transparent transition-all placeholder:text-[#BDBDBD]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BDBDBD] hover:text-[#757575]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4A7A30] hover:bg-[#3A6025] text-white rounded-full py-2.5 mt-2 font-medium transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? "Entrando..." : "Iniciar sesión"}
            </Button>
          </form>

          <p className="text-center text-sm text-[#757575] mt-6">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-[#4A7A30] font-medium hover:underline">
              Regístrate gratis
            </Link>
          </p>
        </div>

        <p className="text-center text-sm text-[#BDBDBD] mt-6">
          <Link href="/" className="hover:text-[#757575] transition-colors">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
