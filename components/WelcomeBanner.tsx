"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gift, ArrowRight, Sparkles, X } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function WelcomeBanner() {
  const { usuario } = useAuth();
  const [oculto, setOculto] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  if (!montado || usuario || oculto) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-2">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white p-4 sm:p-5 shadow-md border border-purple-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Glow de fondo decorativo */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/30">
            <Gift className="h-6 w-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-300 uppercase tracking-wider mb-0.5">
              <Sparkles className="h-3 w-3 text-amber-300" /> Beneficio exclusivo
            </div>
            <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
              “Tu primera buena elección viene con regalo”
            </h4>
            <p className="text-xs text-purple-200 mt-0.5">
              Registrate y recibí <span className="text-white font-bold">$5.000 de regalo</span> para tu primera compra superior a <span className="text-white font-bold">$50.000</span>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Link
            href="/auth?mode=register&promo=bienvenida5k"
            className="w-full sm:w-auto text-center px-4 py-2.5 bg-white hover:bg-purple-50 text-purple-900 text-xs font-extrabold uppercase tracking-wider rounded-xl transition shadow-sm flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>ACTIVAR MI REGALO</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          
          <button
            onClick={() => setOculto(true)}
            className="text-purple-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            aria-label="Cerrar banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
