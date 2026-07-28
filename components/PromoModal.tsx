"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Gift, Sparkles, ArrowRight } from 'lucide-react';

export default function PromoModal() {
  const [abierto, setAbierto] = useState(false);
  const [campanaState, setCampanaState] = useState<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('objetia_active_campaign');
      if (stored) {
        const campana = JSON.parse(stored);
        const now = Date.now();
        const start = new Date(campana.inicio).getTime();
        const end = new Date(campana.fin).getTime();

        if (campana.activa && campana.mostrarModalPromo !== false && now >= start && now <= end) {
          setCampanaState(campana);
          const visto = localStorage.getItem('objetia_promo_visto');
          if (!visto) {
            const timer = setTimeout(() => {
              setAbierto(true);
            }, 1500);
            return () => clearTimeout(timer);
          }
        }
      }
    } catch {}
  }, []);

  const cerrarModal = () => {
    setAbierto(false);
    localStorage.setItem('objetia_promo_visto', 'true');
  };

  if (!abierto || !campanaState) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col sm:flex-row transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Imagen Promocional */}
        <div className="relative sm:w-1/2 h-48 sm:h-auto bg-gradient-to-br from-purple-900 via-indigo-900 to-black p-6 flex flex-col justify-between text-white overflow-hidden">
          <div className="absolute inset-0 opacity-40">
            <Image
              src="/objetia_logo.png"
              alt="Promo Banner"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative z-10">
            <span className="px-3 py-1 bg-amber-400 text-gray-900 text-[9px] font-black uppercase tracking-wider rounded-full shadow-sm inline-flex items-center gap-1">
              <Gift className="h-3 w-3" /> Regalo Exclusivo
            </span>
          </div>

          <div className="relative z-10 space-y-1 mt-auto">
            <h4 className="text-xl font-black tracking-tight text-white uppercase" style={{ fontFamily: 'var(--font-family-brand, Outfit)' }}>
              OBJETIA
            </h4>
            <p className="text-[11px] text-purple-200">Decoración & Muebles Premium</p>
          </div>
        </div>

        {/* Contenido del Modal */}
        <div className="p-6 sm:w-1/2 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Evento Especial
              </span>
              <button 
                onClick={cerrarModal}
                className="text-gray-400 hover:text-gray-600 p-1 transition cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3 className="text-lg font-black text-gray-900 leading-tight">
              {campanaState.nombre || "¡Beneficio Exclusivo!"}
            </h3>

            <p className="text-xs text-gray-600">
              {campanaState.slogan || "Aprovechá nuestros descuentos especiales por tiempo limitado."}
            </p>
          </div>

          {/* Código de Cupón Copiable */}
          <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100 space-y-1 text-center">
            <span className="text-[9px] font-extrabold text-purple-800 uppercase tracking-wider block">Tu Cupón Promocional</span>
            <div className="font-mono font-black text-sm text-purple-900 tracking-wider">
              {campanaState.codigoCupon || "OBJETIAOFF"}
            </div>
          </div>

          <Link
            href="/catalog"
            onClick={cerrarModal}
            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Usar Cupón en Catálogo</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
