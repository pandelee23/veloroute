"use client";

import { useState } from "react";
import { Link2, Check, MessageCircle } from "lucide-react";
import { encodeWaypoints } from "@/lib/shareUrl";
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  waypoints: [number, number][];
}

export function ShareButton({ waypoints }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    if (typeof window === "undefined") return "";
    const encoded = encodeWaypoints(waypoints);
    // Removemos parámetros previos si los hubiera
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?r=${encoded}`;
  };

  const handleCopy = async () => {
    if (waypoints.length < 2) {
      alert("Traza al menos una ruta con dos puntos antes de compartir.");
      return;
    }
    
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      // Update browser URL silently without reloading
      window.history.replaceState(null, "", url);
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("No se pudo copiar", err);
      // Fallback
      window.prompt("Copia este enlace:", url);
    }
  };

  const handleWhatsAppShare = () => {
    if (waypoints.length < 2) {
      alert("Traza al menos una ruta con dos puntos antes de compartir.");
      return;
    }
    const url = getShareUrl();
    const text = encodeURIComponent("¡Mira esta ruta ciclista que he planeado en VeloRoute! 🚴‍♂️🔥\n");
    window.open(`https://wa.me/?text=${text}${encodeURIComponent(url)}`, "_blank");
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="bg-[#F9F9F7] hover:bg-[#eeeeec] text-[#1b2b24] border-[#c2c8c3] h-9 px-3 transition-all font-medium text-xs rounded shadow-sm"
        disabled={waypoints.length < 2}
      >
        {copied ? (
          <Check className="h-4 w-4 mr-1.5 text-[#1b2b24]" />
        ) : (
          <Link2 className="h-4 w-4 mr-1.5" />
        )}
        {copied ? "¡Copiado!" : "Compartir"}
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        onClick={handleWhatsAppShare}
        className="bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border-transparent h-9 w-9 transition-all rounded shadow-sm"
        disabled={waypoints.length < 2}
        title="Enviar por WhatsApp"
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
    </div>
  );
}
