import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/Auth/AuthContext";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} min-h-full flex flex-col bg-[#F9F7F2] text-[#1A1A1A]`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
