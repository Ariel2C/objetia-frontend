"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Gift, Sparkles, ArrowRight, Tag } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function PromoModal() {
  const [abierto, setAbierto] = useState(false);
  const { usuario } = useAuth();

  useEffect(() => {
    // Si el usuario ya inició sesión, no mostrar
    if (usuario) return;
    const timer = setTimeout(() => {
      setAbierto(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [usuario]);

  const cerrarModal = () => {
    setAbierto(false);
  };

  if (!abierto || usuario) return null;

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

        {/* CÓDIGO DESTACADO */}
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 p-3.5 rounded-2xl border border-purple-100 flex items-center justify-center gap-2">
          <Tag className="h-4 w-4 text-purple-600" />
          <span className="text-xs font-bold text-gray-700">Cupón de regalo:</span>
          <span className="font-mono font-black text-sm text-purple-800 tracking-wider uppercase bg-white px-2 py-0.5 rounded-md border border-purple-200 shadow-xs">
            BIENVENIDA5K
          </span>
        </div>

        {/* BOTÓN ACTIVAR MI REGALO */}
        <div className="space-y-2 pt-1">
          <Link
            href="/auth"
            onClick={cerrarModal}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white rounded-2xl text-xs font-extrabold uppercase tracking-wider transition shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>ACTIVAR MI REGALO</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <button
            onClick={cerrarModal}
            className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition"
          >
            Continuar sin regalo
          </button>
        </div>
      </div>
    </div>
  );
}
