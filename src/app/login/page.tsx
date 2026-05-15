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
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded bg-[#1b2b24] flex items-center justify-center shadow-[4px_4px_0px_#c2c8c3] mb-3">
            <Navigation2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a1c1b] tracking-tight">VeloRoute Pro</h1>
        </Link>

        {/* Card */}
        <div className="bg-[#F9F9F7] rounded border border-[#c2c8c3] p-8 shadow-[4px_4px_0px_#e2e3e1]">
          <h2 className="text-2xl font-bold text-[#1a1c1b] mb-2">Bienvenido de nuevo</h2>
          <p className="text-[#424845] text-sm mb-6">Inicia sesión para ver tus rutas guardadas</p>

          {error && (
            <div className="bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] text-sm rounded px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="label-caps text-[#1a1c1b] mb-1.5 block">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@correo.com"
                className="w-full px-4 py-2.5 rounded border border-[#c2c8c3] bg-transparent text-[#1a1c1b] text-sm focus:outline-none focus:border-[#cd4800] focus:ring-1 focus:ring-[#cd4800] transition-all placeholder:text-[#737874]"
              />
            </div>

            <div>
              <label htmlFor="password" className="label-caps text-[#1a1c1b] mb-1.5 block">
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
                  className="w-full px-4 py-2.5 pr-10 rounded border border-[#c2c8c3] bg-transparent text-[#1a1c1b] text-sm focus:outline-none focus:border-[#cd4800] focus:ring-1 focus:ring-[#cd4800] transition-all placeholder:text-[#737874]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737874] hover:text-[#424845]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#cd4800] hover:bg-[#a33800] text-white rounded py-2.5 mt-2 font-medium transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? "Entrando..." : "Iniciar sesión"}
            </Button>
          </form>

          <p className="text-center text-sm text-[#424845] mt-6">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-[#1b2b24] font-medium hover:underline">
              Regístrate gratis
            </Link>
          </p>
        </div>

        <p className="text-center text-sm text-[#737874] mt-6">
          <Link href="/" className="hover:text-[#424845] transition-colors">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
