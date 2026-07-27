"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../components/AuthContext';
import { useFavorites } from '../../../components/FavoritesContext';
import { useToast } from '../../../components/ToastContext';
import { getApiUrl } from '../../../lib/config';
import { apiFetch } from '../../../lib/api';
import { ShoppingCart, MessageSquare, Heart, Calendar, ChevronLeft, Lock } from 'lucide-react';
import Link from 'next/link';
import FormattedPrice from '../../../components/FormattedPrice';
import { formatearTituloProducto } from '../../../lib/format';

interface ProductDetail {
  id: number;
  title: string;
  description: string;
  price: number;
  condition: 'USED' | 'NEW';
  category: string;
  seller_id: number;
  image_url: string;
  images: string[];
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
  created_at: string;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { usuario } = useAuth();
  const { esFavorito: esFavoritoGlobal, toggleFavorito } = useFavorites();
  const toast = useToast();
  
  const [producto, setProducto] = useState<ProductDetail | null>(null);
  const [imagenActiva, setImagenActiva] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cargandoAccion, setCargandoAccion] = useState(false);
  const esFavorito = producto ? esFavoritoGlobal(producto.id) : false;

  useEffect(() => {
    if (!id) return;
    const fetchDetalle = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/products/${id}`);
        if (!res.ok) throw new Error("No se pudo cargar el producto.");
        const data = await res.json();
        setProducto(data);
        setImagenActiva(data.image_url);
      } catch (err: any) {
        setError(err.message || "Error al obtener detalles.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetalle();
  }, [id]);

  const handleAgregarAlCarrito = async () => {
    if (!producto || producto.status !== 'AVAILABLE') return;
    if (!usuario) return router.push("/auth");
    
    setCargandoAccion(true);
    try {
      const res = await fetch(`${getApiUrl()}/cart/add/${producto.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('vamaar_token')}`
        }
      });

      if (res.status === 409) {
        toast.warning("Este artículo único acaba de ser reservado por otro usuario.");
        setTimeout(() => window.location.reload(), 1200);
      } else if (res.ok) {
        toast.success("Reservado y agregado a tu carrito.");
        window.dispatchEvent(new Event('cart_updated'));
        router.push("/cart");
      } else {
        toast.error("Ocurrió un error al reservar el producto.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoAccion(false);
    }
  };

  const handleIniciarChat = async () => {
    if (!producto) return;
    if (!usuario) return router.push("/auth");
    
    if (usuario.id === producto.seller_id) {
      return toast.warning("No podés chatear con vos mismo sobre tu propio producto.");
    }

    setCargandoAccion(true);
    try {
      // El comprador se deriva del token en el backend; solo enviamos producto y vendedor
      const data = await apiFetch<{ room_id: number }>(
        `/chat/rooms/get-or-create/?product_id=${producto.id}&seller_id=${producto.seller_id}`,
        { method: 'POST' }
      );
      router.push(`/chat?room_id=${data.room_id}`);
    } catch (err: any) {
      toast.error(err.message || "Fallo al crear la sala de chat.");
    } finally {
      setCargandoAccion(false);
    }
  };

  const handleFavorito = async () => {
    if (!producto) return;
    if (!usuario) return router.push("/auth");

    try {
      await toggleFavorito(producto.id);
    } catch (err: any) {
      toast.error(err?.detail || "No pudimos actualizar tus favoritos.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !producto) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-800">Error al cargar el producto</h2>
        <p className="text-gray-500 mt-1">{error || "El producto no existe."}</p>
        <Link href="/catalog" className="inline-block mt-6 px-6 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-8">
      <Link href="/catalog" className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900 mb-4 transition">
        <ChevronLeft className="h-4 w-4" /> Volver al catálogo
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10 items-start">
        {/* GALERÍA DE IMÁGENES */}
        <div className="lg:col-span-3 space-y-3 animate-fade-in">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
            <img 
              src={imagenActiva || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600"} 
              alt={formatearTituloProducto(producto.title)} 
              className={`w-full h-full object-cover object-center transition-all ${producto.status !== 'AVAILABLE' ? 'blur-[2px] grayscale-[20%]' : ''}`}
            />
            {producto.status === 'RESERVED' && (
              <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] flex flex-col items-center justify-center text-white font-bold gap-2">
                <Lock className="h-8 w-8 text-amber-400" />
                <span className="text-sm uppercase tracking-widest bg-amber-500/20 px-4 py-1.5 rounded-lg border border-amber-400/30">Reservado temporalmente</span>
              </div>
            )}
            {producto.status === 'SOLD' && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex flex-col items-center justify-center text-white font-bold gap-2">
                <span className="text-sm uppercase tracking-widest bg-red-600/30 px-4 py-1.5 rounded-lg border border-red-500/30">Vendido</span>
              </div>
            )}
          </div>
          {producto.images && producto.images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {producto.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setImagenActiva(img)}
                  className={`relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden border-2 bg-gray-50 flex-shrink-0 cursor-pointer transition ${
                    imagenActiva === img ? "border-[var(--color-primary)]" : "border-gray-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PANEL DE COMPRA */}
        <div className="lg:col-span-2 animate-slide-up lg:sticky lg:top-24">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 sm:p-6 space-y-5">
            {/* Meta + título */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  producto.condition === 'USED' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {producto.condition === 'USED' ? 'Usado selecto' : 'Nuevo'}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-wider">
                  {producto.category}
                </span>
              </div>
              <h1 className="text-2xl sm:text-[26px] font-black text-gray-900 tracking-tight leading-tight">
                {formatearTituloProducto(producto.title)}
              </h1>
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Publicado el {new Date(producto.created_at).toLocaleDateString()}
              </span>
            </div>

            {/* Precio */}
            <FormattedPrice price={producto.price} className="block text-4xl font-black text-gray-900" />

            {/* Acciones */}
            {usuario && producto.seller_id === usuario.id ? (
              <div className="text-center py-3.5 px-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold leading-relaxed">
                Este producto es de tu propiedad. No podés comprarlo ni agregarlo a favoritos.
              </div>
            ) : (
              <div className="space-y-2.5">
                <button
                  onClick={handleAgregarAlCarrito}
                  disabled={producto.status !== 'AVAILABLE' || cargandoAccion}
                  style={{
                    backgroundColor: producto.status === 'AVAILABLE' ? 'var(--color-primary)' : '#F3F4F6',
                    color: producto.status === 'AVAILABLE' ? '#ffffff' : '#9CA3AF'
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition active:scale-98 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {producto.status === 'AVAILABLE' 
                    ? "Reservar y Agregar al Carrito" 
                    : (producto.status === 'RESERVED' ? "Producto Reservado" : "Agotado")}
                </button>

                <div className="flex gap-2.5">
                  <button
                    onClick={handleIniciarChat}
                    disabled={cargandoAccion}
                    className="flex-grow px-4 py-3 rounded-xl border border-gray-200 hover:border-gray-400 text-gray-700 font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer bg-white"
                  >
                    <MessageSquare className="h-4 w-4" /> Chatear con el vendedor
                  </button>
                  <button
                    onClick={handleFavorito}
                    aria-label={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
                    className={`flex-shrink-0 px-4 py-3 rounded-xl border transition flex items-center justify-center cursor-pointer ${
                      esFavorito ? "border-red-200 bg-red-50 text-red-500" : "border-gray-200 hover:border-gray-400 text-gray-400 bg-white"
                    }`}
                  >
                    <Heart className={`h-4.5 w-4.5 ${esFavorito ? "fill-red-500" : ""}`} />
                  </button>
                </div>
              </div>
            )}

            {/* Descripción */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Descripción</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {producto.description || "Nuestros moderadores están redactando la reseña comercial..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
