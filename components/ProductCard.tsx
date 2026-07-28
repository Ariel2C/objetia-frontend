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

  const cuotasVal = campanaActiva?.cuotasSinInteres || 3;

  return (
    <Link
      href={`/products/${producto.id}`}
      className="group relative bg-white border border-gray-100 rounded-none overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full cursor-pointer select-none"
    >
      {/* SECCIÓN DE IMAGEN DE PRODUCTO (Fotografía vertical 4:5 un poco más alta) */}
      <div className="relative aspect-[4/5] w-full bg-gray-50 overflow-hidden">
        <Image
          src={producto.image_url || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600"}
          alt={formatearTituloProducto(producto.title)}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className={`object-cover object-center group-hover:scale-103 transition-transform duration-500 ease-out ${
            estadoStock !== 'AVAILABLE' ? 'blur-[2px] grayscale-[30%]' : ''
          }`}
        />
        
        {/* PARTE SUPERIOR: BADGES CREMA Y BOTÓN FAVORITO */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {(() => {
            if (!campanaActiva || !campanaActiva.activa || !campanaActiva.badgeTexto) return null;
            const now = Date.now();
            const start = new Date(campanaActiva.inicio).getTime();
            const end = new Date(campanaActiva.fin).getTime();
            if (now < start || now > end) return null;
            return (
              <span className="px-2 py-0.5 text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider rounded-full bg-[#F5F0E1] text-gray-900 shadow-xs border border-amber-200/50">
                {campanaActiva.badgeTexto}
              </span>
            );
          })()}
          {producto.is_new && (
            <span className="px-2 py-0.5 text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider rounded-full bg-[#F5F0E1] text-gray-900 shadow-xs border border-amber-200/50">
              NUEVO INGRESO
            </span>
          )}
          {producto.condition === "USED" && (
            <span className="px-2 py-0.5 text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider rounded-full bg-[#F5F0E1] text-gray-900 shadow-xs border border-amber-200/50">
              USADO ÚNICO
            </span>
          )}
        </div>

        {/* BOTÓN FAVORITO FLOTANTE CIRCULAR BLANCO */}
        <button 
          onClick={handleFavorito}
          aria-label={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
          className="absolute top-2.5 right-2.5 p-1.5 bg-white/90 backdrop-blur-xs rounded-full text-gray-700 hover:text-red-500 transition-all shadow-sm z-20 cursor-pointer flex items-center justify-center"
        >
          <Heart className={`h-3.5 w-3.5 transition-colors ${esFavorito ? "fill-red-500 text-red-500" : ""}`} />
        </button>

        {/* INDICADOR DE STOCK RESERVADO */}
        {estadoStock === 'RESERVED' && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center text-white font-bold gap-2 z-20 animate-fade-in">
            <Lock className="h-4 w-4 text-amber-400" />
            <span className="text-[9px] font-black uppercase tracking-widest bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/40">Reservado</span>
          </div>
        )}
      </div>

      {/* SECCIÓN INFERIOR DE TEXTO (ESTILO E-COMMERCE MODERNO COMO LA FOTO) */}
      <div className="p-2.5 sm:p-3 bg-white flex flex-col justify-between flex-grow space-y-1 text-left">
        {/* TÍTULO DEL PRODUCTO EN 2 LÍNEAS LIMPIAS */}
        <h3 className="text-xs sm:text-[13px] font-normal text-gray-700 text-left line-clamp-2 leading-snug tracking-normal group-hover:text-purple-700 transition">
          {formatearTituloProducto(producto.title)}
        </h3>

        {/* PRECIO + CUOTAS EN VERDE #00A650 */}
        <div className="flex flex-col text-left space-y-0.5 pt-0.5">
          <FormattedPrice price={producto.price} showCents={false} className="text-base sm:text-lg font-semibold text-gray-900 text-left tracking-tight leading-none" />
          
          <span className="text-[10px] sm:text-[11px] font-medium text-[#00A650] text-left leading-tight block">
            {cuotasVal} cuotas sin interés
          </span>
        </div>
      </div>
    </Link>
  );
}
