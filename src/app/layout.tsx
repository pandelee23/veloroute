import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/Auth/AuthContext";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "VeloRoute Pro — Planificador de Rutas Ciclistas",
  description: "Planifica tus rutas de ciclismo con detalle de altimetría, nutrición y superficie del terreno.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body suppressHydrationWarning className={`${geist.variable} ${jetbrainsMono.variable} font-[family-name:var(--font-geist)] min-h-full flex flex-col bg-[#F9F9F7] text-[#1a1c1b]`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
