// app/components/ProductCard.tsx
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Lock } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useFavorites } from './FavoritesContext';
import { useToast } from './ToastContext';
import { getApiUrl } from '../lib/config';
import FormattedPrice from './FormattedPrice';
import type { Producto } from '../lib/types';
import { formatearTituloProducto } from '../lib/format';

interface ProductCardProps {
  producto: Producto;
  priority?: boolean;
  showSeller?: boolean;
  showCategory?: boolean;
  showBuyButton?: boolean;
}

export default function ProductCard({ 
  producto, 
  priority = false,
  showSeller = false,
  showCategory = false,
  showBuyButton = false
}: ProductCardProps) {
  const { usuario, logout } = useAuth();
  const { esFavorito: esFavoritoGlobal, toggleFavorito } = useFavorites();
  const toast = useToast();
  const esFavorito = esFavoritoGlobal(producto.id);
  const [cargandoCarrito, setCargandoCarrito] = useState(false);
  const [estadoStock, setEstadoStock] = useState(producto.status);

  // Comparar por ID cuando el backend lo envía; el nombre es solo un fallback frágil
  const esProductoPropio = usuario != null && (
    producto.seller_id != null
      ? producto.seller_id === usuario.id
      : (producto.seller_name != null && producto.seller_name === usuario.full_name)
  );

  const handleFavorito = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!usuario) return toast.info("Iniciá sesión para guardar favoritos.");

    if (esProductoPropio) {
      toast.warning("No podés agregar tu propia publicación a tus favoritos.");
      return;
    }

    try {
      // El contexto aplica UI optimista y sincroniza todas las tarjetas
      await toggleFavorito(producto.id);
    } catch (err: any) {
      if (err?.status === 401) {
        toast.warning("Tu sesión expiró. Iniciá sesión nuevamente.");
        logout();
        return;
      }
      toast.error(err?.detail || "Error al procesar la solicitud.");
    }
  };

  const handleAgregarAlCarrito = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (estadoStock !== 'AVAILABLE') return;

    if (!usuario) {
      toast.info("Iniciá sesión para agregar productos al carrito.");
      return;
    }
    
    if (esProductoPropio) {
      toast.warning("Este es tu propio producto. No podés comprar tus propias publicaciones.");
      return;
    }
    
    setCargandoCarrito(true);

    try {
      const res = await fetch(`${getApiUrl()}/cart/add/${producto.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('vamaar_token')}`
        }
      });

      if (res.status === 401) {
        toast.warning("Tu sesión expiró. Iniciá sesión nuevamente.");
        logout();
        return;
      }

      if (res.status === 409) {
        setEstadoStock('RESERVED');
        toast.warning("Este artículo único acaba de ser reservado por otro usuario.");
      } else if (res.ok) {
        setEstadoStock('RESERVED');
        toast.success("Reservado y agregado a tu carrito.", formatearTituloProducto(producto.title));
        // Notificar al Navbar para que actualice el contador del carrito
        window.dispatchEvent(new Event('cart_updated'));
      }
    } catch (err) {
      console.error(err);
      toast.error("No pudimos agregar el producto. Probá de nuevo.");
    } finally {
      setCargandoCarrito(false);
    }
  };

  const [campanaActiva, setCampanaActiva] = useState<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('objetia_active_campaign');
      if (stored) setCampanaActiva(JSON.parse(stored));
    } catch {}

    const handleCampaignChanged = (e: any) => {
      setCampanaActiva(e.detail);
    };
    window.addEventListener('objetia_campaign_changed', handleCampaignChanged);
    return () => window.removeEventListener('objetia_campaign_changed', handleCampaignChanged);
  }, []);

  return (
    <Link
      href={`/products/${producto.id}`}
      className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-full cursor-pointer"
    >
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <Image
          src={producto.image_url || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600"}
          alt={formatearTituloProducto(producto.title)}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className={`object-cover object-center group-hover:scale-102 transition-transform duration-500 ${estadoStock !== 'AVAILABLE' ? 'blur-[2px] grayscale-[30%]' : ''}`}
        />
        
        {/* Etiquetas en Cascada */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {(() => {
            if (!campanaActiva || !campanaActiva.activa || !campanaActiva.badgeTexto) return null;
            const now = Date.now();
            const start = new Date(campanaActiva.inicio).getTime();
            const end = new Date(campanaActiva.fin).getTime();
            if (now < start || now > end) return null;
            return (
              <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full bg-amber-400 text-gray-900 shadow-sm border border-amber-500 animate-pulse">
                {campanaActiva.badgeTexto}
              </span>
            );
          })()}
          {producto.is_new && (
            <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full bg-[#4F46E5] text-white shadow-sm border border-indigo-500">
              Nuevo ingreso
            </span>
          )}
          {producto.condition === "USED" && (
            <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full shadow-sm bg-amber-50 text-amber-800 border border-amber-200">
              Usado único
            </span>
          )}
        </div>

        {/* Indicador de Estado del Motor de Stock */}
        {estadoStock === 'RESERVED' && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center text-white font-bold gap-2 z-10 animate-fade-in">
            <Lock className="h-5 w-5 text-amber-400" />
            <span className="text-xs uppercase tracking-widest bg-amber-500/20 px-3 py-1 rounded-md border border-amber-400/30">Reservado (10 min)</span>
          </div>
        )}

        {/* Favorito Async */}
        <button 
          onClick={handleFavorito}
          aria-label={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
          className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-md rounded-full text-gray-400 hover:text-red-500 hover:bg-white transition-all shadow-sm z-20"
        >
          <Heart className={`h-4 w-4 transition-colors ${esFavorito ? "fill-red-500 text-red-500" : ""}`} />
        </button>
      </div>

      <div className="p-2.5 sm:p-3 flex-grow flex flex-col justify-between items-center text-center">
        <div className="w-full flex flex-col items-center">
          <h3 className="text-xs sm:text-sm font-bold text-gray-800 text-center group-hover:text-purple-700 transition line-clamp-2 leading-snug">
            {formatearTituloProducto(producto.title)}
          </h3>
          {showSeller && producto.seller_name && (
            <span className="text-[10px] text-gray-500 font-medium block mt-0.5 text-center">
              {producto.seller_name}
            </span>
          )}
          {showCategory && producto.category && (
            <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-gray-100 text-gray-500 border border-gray-200 text-center">
              {producto.category}
            </span>
          )}
        </div>
        
        <div className="w-full flex flex-col justify-center items-center mt-2 pt-1.5 border-t border-gray-100/80 text-center">
          <FormattedPrice price={producto.price} showCents={false} className="text-sm sm:text-base font-black text-gray-900 text-center" />
          <span className="text-[9.5px] font-bold text-emerald-700 mt-0.5 block tracking-tight">
            {campanaActiva?.cuotasSinInteres || 3} cuotas sin interés de <span className="font-extrabold">${Math.round(producto.price / (campanaActiva?.cuotasSinInteres || 3)).toLocaleString('es-AR')}</span>
          </span>
          {showBuyButton && (
            <button 
              onClick={handleAgregarAlCarrito}
              disabled={estadoStock !== 'AVAILABLE' || cargandoCarrito}
              aria-label="Agregar al carrito"
              className={`p-2 rounded-lg transition-all duration-200 shadow-xs mt-1.5 ${
                estadoStock === 'AVAILABLE' 
                  ? "bg-gray-900 text-white hover:bg-amber-500 hover:text-gray-900" 
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
