"use client";
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, Zap } from 'lucide-react';

export default function AnnouncementBar() {
  const pathname = usePathname();
  const [isRootTab, setIsRootTab] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mensajeState, setMensajeState] = useState("");
  const [finISOState, setFinISOState] = useState<string | null>(null);

  useEffect(() => {
    const checkRoot = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const isRoot = pathname === '/root/dashboard' || (pathname === '/mi-espacio' && params.get('tab') === 'root');
        setIsRootTab(isRoot);
      }
    };
    checkRoot();
    const interval = setInterval(checkRoot, 300);
    return () => clearInterval(interval);
  }, [pathname]);

  const syncCampaignData = (campana: any) => {
    if (campana && campana.activa && campana.mostrarBarraAnuncios !== false) {
      const now = Date.now();
      const start = new Date(campana.inicio).getTime();
      const end = new Date(campana.fin).getTime();
      
      // SOLO MOSTRAR SI LA FECHA ACTUAL ESTÁ DENTRO DEL RANGO DE EJECUCIÓN (now >= start && now <= end)
      if (now >= start && now <= end) {
        setVisible(true);
        if (campana.textoBarraAnuncios) setMensajeState(campana.textoBarraAnuncios);
        if (campana.fin) setFinISOState(campana.fin);
      } else {
        // Si aún no inició (now < start) o si ya finalizó (now > end), la barra permanece totalmente OCULTA
        setVisible(false);
      }
    } else {
      setVisible(false);
    }
  };

  useEffect(() => {
    // 1. Cargar desde localStorage al inicio
    try {
      const stored = localStorage.getItem('objetia_active_campaign');
      if (stored) {
        syncCampaignData(JSON.parse(stored));
      } else {
        setVisible(false);
      }
    } catch (e) {
      setVisible(false);
    }

    // 2. Escuchar evento de actualización en vivo
    const handleCampaignChanged = (e: any) => {
      syncCampaignData(e.detail);
    };

    window.addEventListener('objetia_campaign_changed', handleCampaignChanged);
    return () => window.removeEventListener('objetia_campaign_changed', handleCampaignChanged);
  }, []);

  const [timeLeft, setTimeLeft] = useState<{ horas: number; minutos: number; segundos: number }>({
    horas: 0,
    minutos: 0,
    segundos: 0
  });

  useEffect(() => {
    if (!finISOState || !visible) return;

    const targetDate = new Date(finISOState).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = targetDate - now;

      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft({ horas: 0, minutos: 0, segundos: 0 });
        setVisible(false);
      } else {
        const horas = Math.floor(diff / (1000 * 60 * 60));
        const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ horas, minutos, segundos });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [finISOState, visible]);

  if (isRootTab || !visible) return null;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white text-xs py-2 px-4 relative flex items-center justify-between z-50 border-b border-purple-800/60 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 w-full text-center">
        
        {/* Mensaje Promocional Dinámico de Campaña */}
        <div className="flex items-center gap-2 font-bold tracking-wide">
          <span className="p-1 bg-amber-400 text-gray-900 rounded-full animate-bounce">
            <Zap className="h-3 w-3 fill-gray-900" />
          </span>
          <span>{mensajeState}</span>
        </div>

        {/* Reloj Regresivo Dinámico de Campaña */}
        <div className="flex items-center gap-1.5 font-mono text-[11px] bg-black/30 px-3 py-1 rounded-full border border-white/10 shadow-inner">
          <span className="text-gray-400 font-sans text-[9px] uppercase font-extrabold mr-1">Termina en</span>
          <span className="font-bold text-amber-300">{pad(timeLeft.horas)}h</span>
          <span className="text-gray-500">:</span>
          <span className="font-bold text-amber-300">{pad(timeLeft.minutos)}m</span>
          <span className="text-gray-500">:</span>
          <span className="font-bold text-amber-300">{pad(timeLeft.segundos)}s</span>
        </div>

      </div>

      {/* Botón Cerrar */}
      <button 
        onClick={() => setVisible(false)}
        className="p-1 text-purple-300 hover:text-white hover:bg-white/10 rounded-lg transition ml-2 flex-shrink-0 cursor-pointer"
        aria-label="Cerrar aviso"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
