"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../components/AuthContext';
import { useFavorites } from '../../../components/FavoritesContext';
import { useToast } from '../../../components/ToastContext';
import { getApiUrl } from '../../../lib/config';
import { apiFetch } from '../../../lib/api';
import { 
  ShoppingCart, 
  MessageSquare, 
  Heart, 
  Calendar, 
  ChevronLeft, 
  Lock,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Share2
} from 'lucide-react';
import Link from 'next/link';
import FormattedPrice from '../../../components/FormattedPrice';
import { formatearTituloProducto } from '../../../lib/format';
import { trackProductView, trackProductEvent } from '../../../lib/analytics';

interface ProductDetail {
  id: number;
  title: string;
  description: string;
  price: number;
  condition: 'USED' | 'NEW' | 'used' | 'new';
  category: string;
  subcategory?: string;
  material?: string;
  color?: string;
  weight_kg?: number;
  height_cm?: number;
  width_cm?: number;
  length_cm?: number;
  seller_id: number;
  seller_name?: string;
  image_url: string;
  images: string[];
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'PAUSED';
  created_at: string;
  is_new?: boolean;
  views?: number;
  favorites?: number;
}

const COLOR_MAP: Record<string, string> = {
  "Madera natural": "#c29b61",
  "Negro": "#1a1a1a",
  "Blanco": "#ffffff",
  "Dorado / Bronce": "#c5a059",
  "Gris": "#808080",
  "Beige / Arena": "#e3dac9",
  "Marrón / Chocolate": "#5c3a21",
  "Verde": "#2e5a36",
  "Azul / Petróleo": "#1f456e",
  "Terracota / Óxido": "#b95c3b",
  "Multicolor / Otro": "linear-gradient(135deg, #e11d48, #eab308, #2563eb)",
};

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
        trackProductView(data.id);
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
        trackProductEvent(producto.id, 'cart_add');
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
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 border-3 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#5f6368] font-medium">Cargando detalles del objeto...</span>
        </div>
      </div>
    );
  }

  if (error || !producto) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-[#dadce0] rounded-2xl p-8 text-center shadow-2xs space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-lg font-bold text-[#202124]">Error al cargar el producto</h2>
          <p className="text-xs text-[#5f6368]">{error || "El producto solicitado no existe o fue retirado."}</p>
          <Link 
            href="/catalog" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a73e8] text-white rounded-xl font-semibold text-xs hover:bg-[#1557b0] transition shadow-2xs"
          >
            <ChevronLeft className="h-4 w-4" /> Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-6 sm:py-8 font-sans antialiased text-[#202124]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* NAVEGACIÓN BREADCRUMB & VOLVER */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#5f6368] select-none">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-[#202124] transition">
              Inicio
            </Link>
            <span className="text-[#9aa0a6]">/</span>
            <Link href="/catalog" className="hover:text-[#202124] transition">
              Catálogo
            </Link>
            <span className="text-[#9aa0a6]">/</span>
            <Link 
              href={`/catalog?category=${encodeURIComponent(producto.category)}`}
              className="hover:text-[#1a73e8] transition font-medium"
            >
              {producto.category}
            </Link>
            {producto.subcategory && (
              <>
                <span className="text-[#9aa0a6]">/</span>
                <Link 
                  href={`/catalog?category=${encodeURIComponent(producto.category)}&subcategory=${encodeURIComponent(producto.subcategory)}`}
                  className="hover:text-[#1a73e8] transition font-medium"
                >
                  {producto.subcategory}
                </Link>
              </>
            )}
          </div>

          <Link 
            href="/catalog" 
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#5f6368] hover:text-[#202124] transition hover:bg-white px-2.5 py-1 rounded-lg border border-transparent hover:border-[#dadce0]"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Volver al catálogo
          </Link>
        </div>

        {/* CONTENEDOR PRINCIPAL 2 COLUMNAS (PROPORCIONES EQUILIBRADAS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUMNA IZQUIERDA: GALERÍA DE IMÁGENES CONTROLADA (440px MAX) */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col items-center lg:items-start space-y-4">
            
            {/* Marco de Imagen Principal (4:5 vertical con tamaño proporcionado y elegante) */}
            <div className="relative w-full max-w-[440px] aspect-[4/5] max-h-[480px] bg-white rounded-2xl border border-[#dadce0] overflow-hidden shadow-2xs group flex items-center justify-center">
              <img 
                src={imagenActiva || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600"} 
                alt={formatearTituloProducto(producto.title)} 
                className={`w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-103 ${
                  producto.status !== 'AVAILABLE' ? 'blur-[2px] grayscale-[25%]' : ''
                }`}
              />

              {/* Badges superiores flotantes */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 select-none">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-2xs backdrop-blur-md ${
                  producto.condition?.toLowerCase() === 'used'
                    ? 'bg-amber-500/90 text-white'
                    : 'bg-emerald-600/90 text-white'
                }`}>
                  {producto.condition?.toLowerCase() === 'used' ? 'Usado selecto' : 'Nuevo'}
                </span>
                {producto.is_new && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-xl bg-white/90 text-[#202124] border border-[#dadce0] shadow-2xs backdrop-blur-md">
                    Nuevo ingreso
                  </span>
                )}
              </div>

              {/* Botón flotante para compartir */}
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.share) {
                    navigator.share({ title: producto.title, url: window.location.href });
                  } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Enlace copiado al portapapeles.");
                  }
                }}
                className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white text-[#5f6368] hover:text-[#202124] rounded-full shadow-2xs border border-[#dadce0] transition cursor-pointer backdrop-blur-md"
                title="Compartir producto"
              >
                <Share2 className="h-4 w-4" />
              </button>

              {/* Overlays de Estado Bloqueado */}
              {producto.status === 'RESERVED' && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center text-white font-bold gap-2 p-4 text-center">
                  <Lock className="h-8 w-8 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider bg-amber-500/30 px-3 py-1.5 rounded-xl border border-amber-400/40">
                    Reservado temporalmente
                  </span>
                  <p className="text-[11px] text-gray-200 font-normal max-w-xs">
                    Un comprador lo tiene reservado en su proceso de pago.
                  </p>
                </div>
              )}
              {producto.status === 'SOLD' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white font-bold gap-2 p-4 text-center">
                  <span className="text-xs font-bold uppercase tracking-wider bg-red-600/30 px-4 py-1.5 rounded-xl border border-red-500/40">
                    Vendido
                  </span>
                  <p className="text-[11px] text-gray-200 font-normal max-w-xs">
                    Este objeto único ya encontró un nuevo hogar.
                  </p>
                </div>
              )}
              {producto.status === 'PAUSED' && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center text-white font-bold gap-2 p-4 text-center">
                  <span className="text-xs font-bold uppercase tracking-wider bg-gray-600/40 px-4 py-1.5 rounded-xl border border-gray-400/40">
                    Publicación en Pausa
                  </span>
                </div>
              )}
            </div>

            {/* Miniaturas de la galería */}
            {producto.images && producto.images.length > 1 && (
              <div className="w-full max-w-[440px] flex gap-2.5 overflow-x-auto pb-1 light-scrollbar select-none">
                {producto.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setImagenActiva(img)}
                    className={`relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden border-2 bg-white flex-shrink-0 cursor-pointer transition ${
                      imagenActiva === img 
                        ? "border-[#1a73e8] shadow-xs" 
                        : "border-[#dadce0] opacity-70 hover:opacity-100 hover:border-[#9aa0a6]"
                    }`}
                  >
                    <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: PANEL DE COMPRA Y DETALLES */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-5">
            
            <div className="bg-white border border-[#dadce0] rounded-2xl p-6 sm:p-7 shadow-2xs space-y-6">
              
              {/* Vendedor y fecha */}
              <div className="flex items-center justify-between text-xs text-[#5f6368] border-b border-[#dadce0] pb-3.5">
                <div className="flex items-center gap-1.5 font-medium text-[#202124]">
                  <CheckCircle2 className="h-4 w-4 text-[#1a73e8] flex-shrink-0" />
                  <span>Publicado por <strong>{producto.seller_name || 'Vendedor Verificado'}</strong></span>
                </div>
                <div className="flex items-center gap-1 text-[#5f6368]">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{new Date(producto.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Título y Categorías */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#f1f3f4] text-[#3c4043] border border-[#dadce0]">
                    {producto.category}
                  </span>
                  {producto.subcategory && (
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]">
                      {producto.subcategory}
                    </span>
                  )}
                </div>
                
                <h1 className="text-2xl sm:text-3xl font-bold text-[#202124] tracking-tight leading-snug">
                  {formatearTituloProducto(producto.title)}
                </h1>
              </div>

              {/* Precio destacado */}
              <div className="pt-1">
                <FormattedPrice 
                  price={producto.price} 
                  className="text-3xl sm:text-4xl font-extrabold text-[#202124] tracking-tight block" 
                />
              </div>

              {/* Ficha de Especificaciones Clave (Chips informativos) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 select-none">
                {producto.material && (
                  <div className="p-3 bg-[#f8f9fa] border border-[#dadce0] rounded-xl flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6368]">Material</span>
                    <span className="text-xs font-semibold text-[#202124] mt-0.5 truncate">{producto.material}</span>
                  </div>
                )}
                {producto.color && (
                  <div className="p-3 bg-[#f8f9fa] border border-[#dadce0] rounded-xl flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6368]">Color</span>
                    <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                      {COLOR_MAP[producto.color] && (
                        <span 
                          className={`w-3 h-3 rounded-full inline-block flex-shrink-0 ${producto.color === 'Blanco' ? 'border border-gray-300' : ''}`}
                          style={COLOR_MAP[producto.color].startsWith('linear') ? { background: COLOR_MAP[producto.color] } : { backgroundColor: COLOR_MAP[producto.color] }}
                        />
                      )}
                      <span className="text-xs font-semibold text-[#202124] truncate">{producto.color}</span>
                    </div>
                  </div>
                )}
                <div className="p-3 bg-[#f8f9fa] border border-[#dadce0] rounded-xl flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6368]">Condición</span>
                  <span className="text-xs font-semibold text-[#202124] mt-0.5">
                    {producto.condition?.toLowerCase() === 'used' ? 'Usado selecto' : 'Nuevo'}
                  </span>
                </div>
              </div>

              {/* ACCIONES DE COMPRA */}
              {usuario && producto.seller_id === usuario.id ? (
                <div className="text-center py-3.5 px-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold leading-relaxed">
                  Esta es una publicación propia. Podés administrarla desde Mi Objetia.
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {/* Botón Principal: Reservar y Agregar al Carrito */}
                  <button
                    type="button"
                    onClick={handleAgregarAlCarrito}
                    disabled={producto.status !== 'AVAILABLE' || cargandoAccion}
                    className={`w-full h-12 flex items-center justify-center gap-2.5 rounded-xl font-bold text-sm tracking-wide transition shadow-xs cursor-pointer ${
                      producto.status === 'AVAILABLE'
                        ? "bg-[#1a73e8] hover:bg-[#1557b0] text-white active:scale-98"
                        : "bg-[#f1f3f4] text-[#9aa0a6] cursor-not-allowed border border-[#dadce0]"
                    }`}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {producto.status === 'AVAILABLE' 
                      ? "Reservar y Agregar al Carrito" 
                      : (producto.status === 'PAUSED' ? "Publicación Pausada" : (producto.status === 'RESERVED' ? "Producto Reservado" : "Agotado"))}
                  </button>

                  {/* Acciones Secundarias: Chat + Favorito */}
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={handleIniciarChat}
                      disabled={cargandoAccion}
                      className="flex-1 h-11 px-4 rounded-xl border border-[#dadce0] hover:bg-[#f8f9fa] hover:border-[#9aa0a6] text-[#202124] font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer bg-white"
                    >
                      <MessageSquare className="h-4 w-4 text-[#5f6368]" /> 
                      <span>Chatear con el vendedor</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleFavorito}
                      aria-label={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
                      className={`h-11 w-11 flex-shrink-0 rounded-xl border transition flex items-center justify-center cursor-pointer ${
                        esFavorito 
                          ? "border-red-200 bg-red-50 text-red-500 shadow-2xs" 
                          : "border-[#dadce0] hover:bg-[#f8f9fa] hover:border-[#9aa0a6] text-[#5f6368] bg-white"
                      }`}
                      title={esFavorito ? "Guardado en favoritos" : "Guardar en favoritos"}
                    >
                      <Heart className={`h-4.5 w-4.5 transition-colors ${esFavorito ? "fill-red-500 text-red-500" : ""}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* BENEFICIOS / SEGURIDAD (OBJETIA TRUST) */}
              <div className="pt-2 border-t border-[#dadce0] grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
                  <Truck className="h-4 w-4 text-[#1a73e8] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-[#202124]">Envíos asegurados</h4>
                    <p className="text-[11px] text-[#5f6368] mt-0.5 leading-snug">
                      Despachos a todo el país vía Correo Argentino con seguimiento online.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-[#202124]">Compra Protegida</h4>
                    <p className="text-[11px] text-[#5f6368] mt-0.5 leading-snug">
                      Tu dinero se custodia hasta que recibís el objeto tal como fue publicado.
                    </p>
                  </div>
                </div>
              </div>

              {/* DESCRIPCIÓN */}
              <div className="pt-4 border-t border-[#dadce0] space-y-2">
                <h3 className="text-xs font-bold text-[#5f6368] uppercase tracking-wider">
                  Descripción del objeto
                </h3>
                <p className="text-sm text-[#3c4043] leading-relaxed whitespace-pre-line">
                  {producto.description || "El vendedor no ha incluido una descripción adicional para este objeto."}
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
