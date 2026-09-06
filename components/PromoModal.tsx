"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Gift, Sparkles, ArrowRight, Tag } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function PromoModal() {
  const [abierto, setAbierto] = useState(false);
  const { usuario } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    // El cartel de bienvenida SOLO debe aparecer en la página de inicio (Home '/') y si no hay usuario
    if (pathname !== '/' || usuario) {
      setAbierto(false);
      return;
    }

    // Verificar si el usuario ya lo cerró previamente en este navegador
    try {
      const yaDescartado = localStorage.getItem('objetia_welcome_promo_dismissed');
      if (yaDescartado) {
        setAbierto(false);
        return;
      }
    } catch {
      // Ignorar error si localStorage no está disponible
    }

    const timer = setTimeout(() => {
      setAbierto(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [usuario, pathname]);

  const cerrarModal = () => {
    setAbierto(false);
    try {
      localStorage.setItem('objetia_welcome_promo_dismissed', 'true');
    } catch {
      // Ignorar error si localStorage no está disponible
    }
  };

  if (!abierto || usuario || pathname !== '/') return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in"
      onClick={cerrarModal}
    >
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 p-6 md:p-8 space-y-6 animate-scale-up text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* BOTÓN CERRAR ESQUINA */}
        <button 
          onClick={cerrarModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* ÍCONO REGALO DESTACADO */}
        <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 transform -rotate-3">
          <Gift className="h-8 w-8" />
        </div>

        {/* BADGE Y TÍTULOS */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-widest rounded-full border border-amber-200">
            <Sparkles className="h-3 w-3 text-amber-600" /> Regalo de Bienvenida
          </span>

          <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">
            “Tu primera buena elección viene con regalo”
          </h3>

          <p className="text-xs md:text-sm text-gray-600 leading-relaxed max-w-xs mx-auto pt-1">
            Registrate y recibí <span className="font-extrabold text-purple-700">$5.000 de regalo</span> para tu primera compra superior a <span className="font-bold text-gray-900">$50.000</span>.
          </p>
        </div>

        {/* BOTÓN ACTIVAR MI REGALO */}
        <div className="space-y-2 pt-1">
          <Link
            href="/auth?mode=register&promo=bienvenida5k"
            onClick={cerrarModal}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white rounded-2xl text-xs font-extrabold uppercase tracking-wider transition shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>ACTIVAR MI REGALO</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <button
            onClick={cerrarModal}
            className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition cursor-pointer"
          >
            Continuar sin regalo
          </button>
        </div>
      </div>
    </div>
  );
}
