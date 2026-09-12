"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Eye, Copy, Trash2, Check, Edit2, X, Loader2, Heart, TrendingUp, ShoppingBag, BarChart3, ChevronDown, ChevronUp, Info, Search, ChevronLeft, ChevronRight, Pause, Play, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getApiUrl } from '../../lib/config';
import { useToast } from '../../components/ToastContext';
import { formatearTituloProducto } from '../../lib/format';

interface ProductItem {
  id: number;
  title: string;
  price: number;
  category: string;
  condition: string;
  moderation_status: string;
  ai_moderation_notes?: string | null;
  stock: number;
  image_url: string;
  updated_at: string;
  views?: number;
  favorites?: number;
  sales?: number;
  relevance_score?: number;
}

interface SellerMetrics {
  total_publications: number;
  total_views: number;
  total_favorites: number;
  total_sales: number;
  conversion_rate: number;
  views_timeline: { date: string; label: string; views: number; favorites?: number; sales?: number }[];
  top_products: any[];
}

interface PublicationsTabProps {
  token: string | null;
}

export default function PublicationsTab({ token }: PublicationsTabProps) {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [metrics, setMetrics] = useState<SellerMetrics | null>(null);
  const [metricaActiva, setMetricaActiva] = useState<'views' | 'favorites' | 'sales'>('views');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiandoId, setCopiandoId] = useState<number | null>(null);

  // Datos de la métrica activa para el gráfico CSS de 30 días
  const activeTimelineData = useMemo(() => {
    if (!metrics?.views_timeline) return [];
    return metrics.views_timeline.map(d => {
      let val = 0;
      if (metricaActiva === 'views') val = d.views || 0;
      else if (metricaActiva === 'favorites') val = d.favorites || 0;
      else if (metricaActiva === 'sales') val = d.sales || 0;
      return { ...d, value: val };
    });
  }, [metrics, metricaActiva]);

  const maxActiveVal = useMemo(() => {
    const vals = activeTimelineData.map(d => d.value);
    const max = Math.max(...vals, 1);
    return Math.ceil(max * 1.2);
  }, [activeTimelineData]);

  // Filtro de estado: 'all' | 'published' | 'pending' | 'rejected' | 'paused' | 'sold'
  const [filtroActual, setFiltroActual] = useState<'all' | 'published' | 'pending' | 'rejected' | 'paused' | 'sold'>('all');
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 8;

  // --- ESTADOS DE EDICIÓN ---
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editPrecio, setEditPrecio] = useState(0);
  const [editCategoria, setEditCategoria] = useState("");
  const [editCondicion, setEditCondicion] = useState("");
  const [editStock, setEditStock] = useState(1);
  const [editPeso, setEditPeso] = useState(0);
  const [editAlto, setEditAlto] = useState(0);
  const [editAncho, setEditAncho] = useState(0);
  const [editLargo, setEditLargo] = useState(0);
  const [guardandoEdit, setGuardandoEdit] = useState(false);

  const pendingScrollRef = useRef(false);

  useEffect(() => {
    const scrollTarget = searchParams?.get('scroll');
    if (scrollTarget === 'lista-publicaciones') {
      pendingScrollRef.current = true;
    }
  }, [searchParams]);

  const ejecutarScrollSuave = useCallback(() => {
    const el = document.getElementById('lista-publicaciones');
    if (!el) return false;

    // En mi-objetia el contenedor con scroll es el div padre con overflow-y-auto
    const scrollContainer = el.closest('.overflow-y-auto') as HTMLElement | null;
    if (scrollContainer && scrollContainer.scrollHeight > scrollContainer.clientHeight) {
      const rect = el.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      const targetScrollTop = scrollContainer.scrollTop + (rect.top - containerRect.top) - 75;
      scrollContainer.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return true;
  }, []);

  const fetchProducts = async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    }
    setError(null);
    const authToken = localStorage.getItem('vamaar_token') || token;

    // 1. Obtener métricas analíticas en paralelo (nunca se bloquea si las publicaciones fallan)
    fetch(`${getApiUrl()}/analytics/seller/metrics`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
      .then(res => res && res.ok ? res.json() : null)
      .then(dataMetrics => {
        if (dataMetrics) setMetrics(dataMetrics);
      })
      .catch(() => null);

    // 2. Obtener publicaciones inmediatamente para desbloquear la vista
    try {
      const resProd = await fetch(`${getApiUrl()}/products/my-publications/`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (!resProd.ok) {
        const errData = await resProd.json().catch(() => null);
        throw new Error(errData?.detail || "No se pudo obtener tus publicaciones.");
      }
      const dataProd = await resProd.json();
      setProducts(Array.isArray(dataProd) ? dataProd : []);
    } catch (err: any) {
      setError(err.message || "Error de conexión al cargar publicaciones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token]);

  // Escuchar refresco disparado tras crear producto
  useEffect(() => {
    const handleRefresh = () => {
      pendingScrollRef.current = true;
      fetchProducts(true);
    };
    window.addEventListener('vamaar:refresh-publications', handleRefresh);
    return () => window.removeEventListener('vamaar:refresh-publications', handleRefresh);
  }, []);

  // Auto-scroll suave en cuanto termina la carga y el DOM está listo
  useEffect(() => {
    if (!loading && pendingScrollRef.current) {
      pendingScrollRef.current = false;
      
      const timer1 = setTimeout(() => {
        ejecutarScrollSuave();
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          if (url.searchParams.has('scroll')) {
            url.searchParams.delete('scroll');
            window.history.replaceState({}, '', url.toString());
          }
        }
      }, 100);

      // Reasegurar scroll si el layout calculó alturas de imágenes
      const timer2 = setTimeout(() => {
        ejecutarScrollSuave();
      }, 350);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [loading, ejecutarScrollSuave]);

  const handleCopiarEnlace = (id: number) => {
    const url = `${window.location.origin}/products/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Enlace copiado al portapapeles");
    setCopiandoId(id);
    setTimeout(() => setCopiandoId(null), 2000);
  };

  const handleEliminarProducto = async (id: number) => {
    const confirmar = await toast.confirm({
      title: "Eliminar publicación",
      message: "Esta acción es permanente y no se puede deshacer. ¿Querés eliminar esta publicación?",
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!confirmar) return;

    try {
      const res = await fetch(`${getApiUrl()}/products/${id}/`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('vamaar_token') || token}`
        }
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
        toast.success("La publicación fue eliminada.");
      } else {
        toast.error("No se pudo eliminar el producto.");
      }
    } catch (err) {
      toast.error("Error de red al intentar eliminar.");
    }
  };

  const handleTogglePausa = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`${getApiUrl()}/products/${id}/toggle-pause`, {
        method: "PATCH",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('vamaar_token') || token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        const nextStatus = (data.moderation_status || '').toLowerCase().trim();
        setProducts(prev => prev.map(p => {
          if (p.id === id) {
            return {
              ...p,
              moderation_status: nextStatus,
              updated_at: new Date().toISOString()
            };
          }
          return p;
        }));
        toast.success(data.mensaje || "Estado de la publicación actualizado.");
      } else {
        toast.error(data.detail || "No se pudo cambiar el estado de la publicación.");
      }
    } catch (err) {
      toast.error("Error de conexión al cambiar el estado.");
    }
  };

  const handleOpenEdit = async (item: ProductItem) => {
    try {
      const res = await fetch(`${getApiUrl()}/products/${item.id}`);
      if (res.ok) {
        const detail = await res.json();
        setEditingProduct(detail);
        setEditTitulo(detail.title || "");
        setEditDescripcion(detail.description || "");
        setEditPrecio(detail.price || 0);
        setEditCategoria(detail.category || "");
        setEditCondicion(detail.condition || "USED");
        setEditStock(detail.stock || 1);
        setEditPeso(detail.weight_kg || 0);
        setEditAlto(detail.height_cm || 0);
        setEditAncho(detail.width_cm || 0);
        setEditLargo(detail.length_cm || 0);
      } else {
        toast.error("No se pudo obtener el detalle de la publicación.");
      }
    } catch (e) {
      toast.error("Error al conectar con el servidor.");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setGuardandoEdit(true);
    try {
      const res = await fetch(`${getApiUrl()}/products/${editingProduct.id}/`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('vamaar_token') || token}`
        },
        body: JSON.stringify({
          title: editTitulo,
          description: editDescripcion,
          price: editPrecio,
          category: editCategoria,
          condition: editCondicion,
          stock: editStock,
          weight_kg: editPeso,
          height_cm: editAlto,
          width_cm: editAncho,
          length_cm: editLargo
        })
      });
      if (res.ok) {
        const dataEdit = await res.json();
        const nextStatus = (dataEdit.moderation_status || editingProduct.moderation_status || '').toLowerCase().trim();
        setProducts(prev => prev.map(p => {
          if (p.id === editingProduct.id) {
            return {
              ...p,
              title: editTitulo,
              price: editPrecio,
              category: editCategoria,
              condition: editCondicion,
              stock: editStock,
              moderation_status: nextStatus,
              ai_moderation_notes: nextStatus === 'pending' ? null : p.ai_moderation_notes,
              updated_at: new Date().toISOString()
            };
          }
          return p;
        }));
        setEditingProduct(null);
        toast.success(
          nextStatus === 'pending'
            ? "Publicación modificada y enviada a revisión."
            : "Los cambios de tu publicación fueron guardados."
        );
      } else {
        const errData = await res.json().catch(() => null);
        toast.error(errData?.detail || "Error al guardar modificaciones.");
      }
    } catch (err) {
      toast.error("Error de conexión con el servidor.");
    } finally {
      setGuardandoEdit(false);
    }
  };

  // Clasificación para los contadores
  const todasCount = products.length;
  const enVentaCount = products.filter(p => (p.moderation_status || '').toLowerCase() === 'approved' && p.stock > 0).length;
  const enRevisionCount = products.filter(p => (p.moderation_status || '').toLowerCase() === 'pending').length;
  const pausadasCount = products.filter(p => (p.moderation_status || '').toLowerCase() === 'paused').length;
  const rechazadasCount = products.filter(p => (p.moderation_status || '').toLowerCase() === 'rejected').length;
  const vendidasCount = products.filter(p => p.stock < 1).length;

  // Filtrado y búsqueda
  const productosFiltrados = useMemo(() => {
    return products.filter(p => {
      const status = (p.moderation_status || '').toLowerCase().trim();
      // Filtro por estado
      if (filtroActual === 'published' && !(status === 'approved' && p.stock > 0)) return false;
      if (filtroActual === 'pending' && status !== 'pending') return false;
      if (filtroActual === 'paused' && status !== 'paused') return false;
      if (filtroActual === 'rejected' && status !== 'rejected') return false;
      if (filtroActual === 'sold' && p.stock >= 1) return false;

      // Filtro por búsqueda
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const matchesTitle = (p.title || "").toLowerCase().includes(q);
        const matchesCategory = (p.category || "").toLowerCase().includes(q);
        const matchesId = p.id.toString().includes(q);
        if (!matchesTitle && !matchesCategory && !matchesId) return false;
      }

      return true;
    });
  }, [products, filtroActual, busqueda]);

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / elementosPorPagina));
  const productosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * elementosPorPagina;
    return productosFiltrados.slice(inicio, inicio + elementosPorPagina);
  }, [productosFiltrados, paginaActual]);

  // Reset de página al cambiar filtro o búsqueda
  const cambiarFiltro = (nuevoFiltro: 'all' | 'published' | 'pending' | 'rejected' | 'paused' | 'sold') => {
    setFiltroActual(nuevoFiltro);
    setPaginaActual(1);
  };

  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
    setPaginaActual(1);
  };

  const formatearMonedaLocal = (valor: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 border-4 border-[#B88D65] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative select-none">
      {/* ========================================================================= */}
      {/* MÉTRICAS DE RENDIMIENTO (DISEÑO INTERACTIVO ORGANIC MODERN) */}
      {/* ========================================================================= */}
      {metrics && (
        <div className="bg-[#FAF8F5] border border-[#EAE5DC] rounded-2xl p-5 space-y-4 shadow-xs">
          {/* 1. Título y Subtítulo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-[14px] font-semibold text-[#2C2723]">
                Métricas de rendimiento
              </h4>
              <p className="text-[11px] text-[#73675C]">
                Alcance y conversiones de tus artículos publicados
              </p>
            </div>
          </div>

          {/* 2. Barra con Botones interactivos */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {/* Botón 1: Visualizaciones */}
            <button
              type="button"
              onClick={() => setMetricaActiva('views')}
              className={`px-3.5 h-[34px] sm:h-[36px] rounded-[10px] sm:rounded-[12px] text-[12px] sm:text-[13px] font-medium transition flex items-center gap-2 cursor-pointer border whitespace-nowrap ${
                metricaActiva === 'views'
                  ? 'bg-[#B88D65] border-[#B88D65] text-white shadow-xs'
                  : 'bg-white border-[#EAE5DC] text-[#534636] hover:bg-[#FAF0E6] hover:text-[#2C2723] hover:border-[#EAE5DC]'
              }`}
            >
              <span>Visualizaciones</span>
              <span className={`px-2 py-0.5 rounded-[6px] text-[11px] sm:text-[12px] font-mono font-semibold ${
                metricaActiva === 'views'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#F2EFE9] text-[#73675C]'
              }`}>
                {metrics.total_views.toLocaleString('es-AR')}
              </span>
            </button>

            {/* Botón 2: Favoritos */}
            <button
              type="button"
              onClick={() => setMetricaActiva('favorites')}
              className={`px-3.5 h-[34px] sm:h-[36px] rounded-[10px] sm:rounded-[12px] text-[12px] sm:text-[13px] font-medium transition flex items-center gap-2 cursor-pointer border whitespace-nowrap ${
                metricaActiva === 'favorites'
                  ? 'bg-[#B88D65] border-[#B88D65] text-white shadow-xs'
                  : 'bg-white border-[#EAE5DC] text-[#534636] hover:bg-[#FAF0E6] hover:text-[#2C2723] hover:border-[#EAE5DC]'
              }`}
            >
              <span>Favoritos</span>
              <span className={`px-2 py-0.5 rounded-[6px] text-[11px] sm:text-[12px] font-mono font-semibold ${
                metricaActiva === 'favorites'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#F2EFE9] text-[#73675C]'
              }`}>
                {metrics.total_favorites.toLocaleString('es-AR')}
              </span>
            </button>

            {/* Botón 3: Ventas */}
            <button
              type="button"
              onClick={() => setMetricaActiva('sales')}
              className={`px-3.5 h-[34px] sm:h-[36px] rounded-[10px] sm:rounded-[12px] text-[12px] sm:text-[13px] font-medium transition flex items-center gap-2 cursor-pointer border whitespace-nowrap ${
                metricaActiva === 'sales'
                  ? 'bg-[#B88D65] border-[#B88D65] text-white shadow-xs'
                  : 'bg-white border-[#EAE5DC] text-[#534636] hover:bg-[#FAF0E6] hover:text-[#2C2723] hover:border-[#EAE5DC]'
              }`}
            >
              <span>Ventas</span>
              <span className={`px-2 py-0.5 rounded-[6px] text-[11px] sm:text-[12px] font-mono font-semibold ${
                metricaActiva === 'sales'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#F2EFE9] text-[#73675C]'
              }`}>
                {metrics.total_sales.toLocaleString('es-AR')}
              </span>
            </button>
          </div>

          {/* 3. Gráfico de los últimos 30 días */}
          <div className="bg-white border border-[#EAE5DC] rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#73675C]">
              <span className="font-medium text-[#2C2723]">
                {metricaActiva === 'views' && "Visualizaciones por día (últimos 30 días)"}
                {metricaActiva === 'favorites' && "Guardados en favoritos por día (últimos 30 días)"}
                {metricaActiva === 'sales' && "Ventas concretadas por día (últimos 30 días)"}
              </span>
              <span className="font-mono text-[11px]">
                Total acumulado: {
                  (metricaActiva === 'views' ? metrics.total_views :
                   metricaActiva === 'favorites' ? metrics.total_favorites :
                   metrics.total_sales).toLocaleString('es-AR')
                }
              </span>
            </div>

            {/* Lienzo del Gráfico */}
            <div className="relative h-48 w-full select-none flex flex-col justify-between pt-2 pb-1">
              {/* Líneas horizontales de referencia */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between pr-10">
                <div className="border-b border-[#EAE5DC] w-full relative">
                  <span className="absolute right-0 -top-2.5 text-[10px] text-[#73675C] font-mono">
                    {maxActiveVal}
                  </span>
                </div>
                <div className="border-b border-[#EAE5DC] border-dashed w-full relative">
                  <span className="absolute right-0 -top-2.5 text-[10px] text-[#73675C] font-mono">
                    {Math.round(maxActiveVal * 0.5)}
                  </span>
                </div>
                <div className="border-b border-[#EAE5DC] w-full relative">
                  <span className="absolute right-0 -top-2.5 text-[10px] text-[#73675C] font-mono">
                    0
                  </span>
                </div>
              </div>

              {/* Barras CSS en toffee #B88D65 */}
              <div className="relative z-10 flex items-end justify-between h-40 w-full pr-12 pl-1 gap-1">
                {activeTimelineData.map((d, idx) => {
                  const val = d.value;
                  const barH = val > 0 ? Math.max(8, Math.round((val / maxActiveVal) * 100)) : 2;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                    >
                      {/* Barra CSS con contenedor relativo para el tooltip */}
                      <div
                        style={{ height: `${barH}%` }}
                        className={`w-full max-w-[22px] rounded-t-[4px] transition-all relative flex justify-center ${
                          val > 0 ? 'bg-[#B88D65] group-hover:bg-[#A37953]' : 'bg-[#EAE5DC] hover:bg-[#D5CEC4]'
                        }`}
                      >
                        {/* Tooltip dinámico */}
                        <div className="absolute -top-7 hidden group-hover:flex items-center flex-col z-30 pointer-events-none">
                          <span className="bg-[#2C2723] text-white text-[10px] px-2 py-0.5 rounded shadow-md whitespace-nowrap">
                            {d.label}: {val}
                          </span>
                          <span className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#2C2723]" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Eje X de fechas */}
              <div className="relative z-10 flex items-center justify-between text-[10px] text-[#73675C] font-mono pt-2 pr-12 pl-1 border-t border-[#EAE5DC]">
                {activeTimelineData.map((d, idx) => (
                  <span key={idx} className={idx % 5 === 0 ? "block" : "hidden sm:inline-block opacity-0 select-none"}>
                    {idx % 5 === 0 ? d.label : d.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Abajo del Gráfico: Tasa de Conversión */}
          <div className="bg-white border border-[#EAE5DC] rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#2C2723]">
                  Tasa de conversión
                </span>
                <span className="text-[10px] font-mono text-[#73675C]">
                  ({metrics.total_sales} ventas / {metrics.total_views} visitas)
                </span>
              </div>
              <p className="text-[11px] text-[#73675C] mt-0.5">
                Porcentaje de visitas a tus publicaciones que finalizaron en una venta.
              </p>
            </div>

            <div className="flex items-baseline gap-1.5 self-start sm:self-center">
              <span className="text-xl sm:text-2xl font-semibold text-[#2C2723] font-mono">
                {metrics.conversion_rate}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TARJETA DE PUBLICACIONES (ESTILO ORGANIC MODERN) */}
      {/* ========================================================================= */}
      <div id="lista-publicaciones" className="scroll-mt-24 bg-[#FAF8F5] border border-[#EAE5DC] rounded-2xl p-5 space-y-4 shadow-xs">
        {/* Cabecera con Título, Subtítulo y Buscador al nivel del título */}
        <div className="space-y-3 pb-1 border-b border-[#EAE5DC]">
          {/* Fila 1: Título/Subtítulo a la izquierda y Buscador a la derecha (al mismo nivel) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-[14px] font-semibold text-[#2C2723]">
                Gestión de publicaciones
              </h4>
              <p className="text-[11px] text-[#73675C]">
                Monitorea, edita y gestiona el inventario de tus artículos
              </p>
            </div>

            {/* Buscador bien a la derecha, alineado a nivel del título */}
            <div className="relative w-full sm:w-64 lg:w-72 flex-shrink-0">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#73675C] pointer-events-none" />
              <input
                type="text"
                value={busqueda}
                onChange={handleBusquedaChange}
                placeholder="Buscar por título o ID..."
                className="w-full pl-9 pr-8 h-[34px] text-xs rounded-xl border border-[#E6E1DB] bg-white text-[#2C2723] placeholder-[#73675C] focus:outline-none focus:border-[#B88D65] focus:ring-2 focus:ring-[#B88D65]/20 transition"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => { setBusqueda(''); setPaginaActual(1); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#73675C] hover:text-[#2C2723] p-0.5 cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Fila 2: Badges "Agrupa por" */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-xs font-medium text-[#73675C] mr-1">
              Agrupa por:
            </span>

            {/* Badge: Todas */}
            <button
              type="button"
              onClick={() => cambiarFiltro('all')}
              className={`px-3 h-[30px] rounded-[8px] text-[12px] font-medium transition flex items-center gap-1.5 cursor-pointer border whitespace-nowrap ${
                filtroActual === 'all'
                  ? 'bg-[#B88D65] border-[#B88D65] text-white shadow-xs'
                  : 'bg-white border-[#EAE5DC] text-[#534636] hover:bg-[#FAF0E6] hover:text-[#2C2723] hover:border-[#EAE5DC]'
              }`}
            >
              <span>Todas</span>
              <span className={`px-1.5 py-0.2 rounded text-[10.5px] font-mono font-semibold ${
                filtroActual === 'all' ? 'bg-white/20 text-white' : 'bg-[#F2EFE9] text-[#73675C]'
              }`}>
                {todasCount}
              </span>
            </button>

            {/* Badge: En venta */}
            <button
              type="button"
              onClick={() => cambiarFiltro('published')}
              className={`px-3 h-[30px] rounded-[8px] text-[12px] font-medium transition flex items-center gap-1.5 cursor-pointer border whitespace-nowrap ${
                filtroActual === 'published'
                  ? 'bg-[#B88D65] border-[#B88D65] text-white shadow-xs'
                  : 'bg-white border-[#EAE5DC] text-[#534636] hover:bg-[#FAF0E6] hover:text-[#2C2723] hover:border-[#EAE5DC]'
              }`}
            >
              <span>En venta</span>
              <span className={`px-1.5 py-0.2 rounded text-[10.5px] font-mono font-semibold ${
                filtroActual === 'published' ? 'bg-white/20 text-white' : 'bg-[#F2EFE9] text-[#73675C]'
              }`}>
                {enVentaCount}
              </span>
            </button>

            {/* Badge: En revisión */}
            <button
              type="button"
              onClick={() => cambiarFiltro('pending')}
              className={`px-3 h-[30px] rounded-[8px] text-[12px] font-medium transition flex items-center gap-1.5 cursor-pointer border whitespace-nowrap ${
                filtroActual === 'pending'
                  ? 'bg-[#B88D65] border-[#B88D65] text-white shadow-xs'
                  : 'bg-white border-[#EAE5DC] text-[#534636] hover:bg-[#FAF0E6] hover:text-[#2C2723] hover:border-[#EAE5DC]'
              }`}
            >
              <span>En revisión</span>
              <span className={`px-1.5 py-0.2 rounded text-[10.5px] font-mono font-semibold ${
                filtroActual === 'pending' ? 'bg-white/20 text-white' : 'bg-[#F2EFE9] text-[#73675C]'
              }`}>
                {enRevisionCount}
              </span>
            </button>

            {/* Badge: Pausadas */}
            <button
              type="button"
              onClick={() => cambiarFiltro('paused')}
              className={`px-3 h-[30px] rounded-[8px] text-[12px] font-medium transition flex items-center gap-1.5 cursor-pointer border whitespace-nowrap ${
                filtroActual === 'paused'
                  ? 'bg-[#B88D65] border-[#B88D65] text-white shadow-xs'
                  : 'bg-white border-[#EAE5DC] text-[#534636] hover:bg-[#FAF0E6] hover:text-[#2C2723] hover:border-[#EAE5DC]'
              }`}
            >
              <span>Pausadas</span>
              <span className={`px-1.5 py-0.2 rounded text-[10.5px] font-mono font-semibold ${
                filtroActual === 'paused' ? 'bg-white/20 text-white' : 'bg-[#F2EFE9] text-[#73675C]'
              }`}>
                {pausadasCount}
              </span>
            </button>

            {/* Badge: Rechazadas */}
            <button
              type="button"
              onClick={() => cambiarFiltro('rejected')}
              className={`px-3 h-[30px] rounded-[8px] text-[12px] font-medium transition flex items-center gap-1.5 cursor-pointer border whitespace-nowrap ${
                filtroActual === 'rejected'
                  ? 'bg-[#B88D65] border-[#B88D65] text-white shadow-xs'
                  : 'bg-white border-[#EAE5DC] text-[#534636] hover:bg-[#FAF0E6] hover:text-[#2C2723] hover:border-[#EAE5DC]'
              }`}
            >
              <span>Rechazadas</span>
              <span className={`px-1.5 py-0.2 rounded text-[10.5px] font-mono font-semibold ${
                filtroActual === 'rejected' ? 'bg-white/20 text-white' : 'bg-[#F2EFE9] text-[#73675C]'
              }`}>
                {rechazadasCount}
              </span>
            </button>

            {/* Badge: Vendidas */}
            <button
              type="button"
              onClick={() => cambiarFiltro('sold')}
              className={`px-3 h-[30px] rounded-[8px] text-[12px] font-medium transition flex items-center gap-1.5 cursor-pointer border whitespace-nowrap ${
                filtroActual === 'sold'
                  ? 'bg-[#B88D65] border-[#B88D65] text-white shadow-xs'
                  : 'bg-white border-[#EAE5DC] text-[#534636] hover:bg-[#FAF0E6] hover:text-[#2C2723] hover:border-[#EAE5DC]'
              }`}
            >
              <span>Vendidas</span>
              <span className={`px-1.5 py-0.2 rounded text-[10.5px] font-mono font-semibold ${
                filtroActual === 'sold' ? 'bg-white/20 text-white' : 'bg-[#F2EFE9] text-[#73675C]'
              }`}>
                {vendidasCount}
              </span>
            </button>
          </div>
        </div>

        {/* Tabla de Publicaciones estilizada con bordes suaves */}
        <div className="border border-[#EAE5DC] rounded-2xl overflow-hidden bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EAE5DC] bg-[#FAF8F5] text-[11px] font-semibold text-[#73675C] uppercase tracking-wider">
                  <th className="py-3 px-5">Producto</th>
                  <th className="py-3 px-5">Estado</th>
                  <th className="py-3 px-5 text-center">Interacciones</th>
                  <th className="py-3 px-5">Precio</th>
                  <th className="py-3 px-5">Actualizado</th>
                  <th className="py-3 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5DC]">
                {productosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-[#73675C]">
                      {busqueda ? "No se encontraron publicaciones que coincidan con la búsqueda." : "No hay publicaciones en esta sección."}
                    </td>
                  </tr>
                ) : (
                  productosPaginados.map((item) => {
                    const itemStatus = (item.moderation_status || '').toLowerCase().trim();
                    return (
                    <tr key={item.id} className="hover:bg-[#FAF8F5]/80 transition">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={formatearTituloProducto(item.title)} 
                              className="h-10 w-10 rounded-xl object-cover border border-[#EAE5DC] flex-shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl flex items-center justify-center text-base flex-shrink-0">
                              🛋️
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-[#2C2723] text-xs truncate max-w-[200px] sm:max-w-[280px]">
                              {formatearTituloProducto(item.title)}
                            </span>
                            <span className="text-[10px] text-[#73675C] font-mono">
                              ID: #{item.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        {itemStatus === 'rejected' ? (
                          <div className="space-y-1">
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200"
                              title={item.ai_moderation_notes || "La publicación fue rechazada por la moderación."}
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Rechazada
                            </span>
                            {item.ai_moderation_notes && (
                              <p className="text-[10px] text-red-600 max-w-[180px] truncate" title={item.ai_moderation_notes}>
                                Motivo: {item.ai_moderation_notes}
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="text-[10px] text-[#B88D65] hover:text-[#A37953] hover:underline font-semibold block"
                            >
                              Editar para corregir →
                            </button>
                          </div>
                        ) : itemStatus === 'paused' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#FEF6EE] text-[#B54708] border border-[#F9DBAF]">
                            <Pause className="h-2.5 w-2.5" />
                            Pausada
                          </span>
                        ) : item.stock < 1 ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#F2EFE9] text-[#73675C] border border-[#EAE5DC]">
                            Vendido
                          </span>
                        ) : itemStatus === 'approved' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#EDF7EE] text-[#1E7E34] border border-[#C3E6CB]">
                            Publicado
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#FEF6EE] text-[#B54708] border border-[#F9DBAF]">
                            En revisión
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center justify-center gap-2.5 text-xs text-[#73675C] font-mono">
                          <span title="Visualizaciones">
                            {item.views || 0} vistas
                          </span>
                          <span className="text-[#D5CEC4]">·</span>
                          <span title="Favoritos">
                            {item.favorites || 0} favs
                          </span>
                          {(item.sales ?? 0) > 0 && (
                            <>
                              <span className="text-[#D5CEC4]">·</span>
                              <span className="font-semibold text-[#2C2723]" title="Ventas">
                                {item.sales} ventas
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-5 font-semibold text-[#2C2723] text-xs">
                        {formatearMonedaLocal(item.price)}
                      </td>

                      <td className="py-4 px-5 text-[#73675C] text-xs">
                        {new Date(item.updated_at).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link 
                            href={`/products/${item.id}`}
                            title="Ver publicación"
                            className="p-1.5 text-[#73675C] hover:text-[#B88D65] hover:bg-[#FAF0E6] rounded-lg transition"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          
                          {/* Botón Pausar / Reactivar */}
                          {(itemStatus === 'approved' || itemStatus === 'paused') && item.stock > 0 && (
                            <button
                              type="button"
                              onClick={(e) => handleTogglePausa(item.id, e)}
                              title={itemStatus === 'approved' ? "Pausar publicación" : "Reactivar publicación"}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                itemStatus === 'paused'
                                  ? "text-[#1E7E34] hover:text-[#155724] hover:bg-[#EDF7EE]"
                                  : "text-[#B54708] hover:text-[#7A2E0E] hover:bg-[#FEF6EE]"
                              }`}
                            >
                              {itemStatus === 'paused' ? (
                                <Play className="h-4 w-4" />
                              ) : (
                                <Pause className="h-4 w-4" />
                              )}
                            </button>
                          )}

                          {/* Botón Editar */}
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title={itemStatus === 'rejected' ? "Editar para corregir rechazo" : "Editar publicación"}
                            className="p-1.5 text-[#73675C] hover:text-[#B88D65] hover:bg-[#FAF0E6] rounded-lg transition cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          {itemStatus === 'approved' && item.stock > 0 && (
                            <button
                              onClick={() => handleCopiarEnlace(item.id)}
                              title="Copiar enlace"
                              className="p-1.5 text-[#73675C] hover:text-[#B88D65] hover:bg-[#FAF0E6] rounded-lg transition cursor-pointer"
                            >
                              {copiandoId === item.id ? (
                                <Check className="h-4 w-4 text-[#1E7E34]" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleEliminarProducto(item.id)}
                            title="Eliminar publicación"
                            className="p-1.5 text-[#73675C] hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación estilo Organic Modern */}
        {totalPaginas > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-xs text-[#73675C]">
              Mostrando {Math.min((paginaActual - 1) * elementosPorPagina + 1, productosFiltrados.length)} a {Math.min(paginaActual * elementosPorPagina, productosFiltrados.length)} de {productosFiltrados.length} publicaciones
            </span>

            <div className="flex items-center gap-1 self-center sm:self-auto">
              <button
                type="button"
                onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                disabled={paginaActual === 1}
                className="p-1.5 rounded-lg border border-[#EAE5DC] text-[#73675C] hover:bg-[#FAF0E6] hover:text-[#2C2723] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                title="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPaginaActual(num)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium font-mono transition cursor-pointer ${
                      paginaActual === num
                        ? 'bg-[#B88D65] text-white shadow-xs'
                        : 'text-[#73675C] hover:bg-[#FAF0E6] hover:text-[#2C2723]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
                disabled={paginaActual === totalPaginas}
                className="p-1.5 rounded-lg border border-[#EAE5DC] text-[#73675C] hover:bg-[#FAF0E6] hover:text-[#2C2723] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                title="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL DE EDICIÓN ORGANIC MODERN --- */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF8F5] rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative border border-[#EAE5DC]">
            <button 
              onClick={() => setEditingProduct(null)}
              className="absolute top-5 right-5 p-2 text-[#73675C] hover:text-[#2C2723] hover:bg-[#F2EFE9] rounded-full transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-[#2C2723] tracking-tight">Editar Publicación</h3>
              <p className="text-xs text-[#73675C] mt-0.5">Modifica los detalles del artículo y las dimensiones físicas para envío.</p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#2C2723] block">Título del Artículo</label>
                <input 
                  type="text" 
                  required
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E6E1DB] bg-white focus:bg-white text-[#2C2723] focus:outline-none focus:border-[#B88D65] focus:ring-2 focus:ring-[#B88D65]/20 font-medium transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#2C2723] block">Descripción</label>
                <textarea 
                  rows={3}
                  required
                  value={editDescripcion}
                  onChange={(e) => setEditDescripcion(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E6E1DB] bg-white focus:bg-white text-[#2C2723] focus:outline-none focus:border-[#B88D65] focus:ring-2 focus:ring-[#B88D65]/20 font-medium leading-relaxed transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#2C2723] block">Precio (ARS)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={editPrecio}
                    onChange={(e) => setEditPrecio(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E6E1DB] bg-white focus:bg-white text-[#2C2723] focus:outline-none focus:border-[#B88D65] focus:ring-2 focus:ring-[#B88D65]/20 font-bold transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#2C2723] block">Stock Disponible</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={editStock}
                    onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E6E1DB] bg-white focus:bg-white text-[#2C2723] focus:outline-none focus:border-[#B88D65] focus:ring-2 focus:ring-[#B88D65]/20 font-bold transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#2C2723] block">Categoría</label>
                  <input 
                    type="text" 
                    required
                    value={editCategoria}
                    onChange={(e) => setEditCategoria(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E6E1DB] bg-white focus:bg-white text-[#2C2723] focus:outline-none focus:border-[#B88D65] focus:ring-2 focus:ring-[#B88D65]/20 font-medium transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#2C2723] block">Condición</label>
                  <select 
                    value={editCondicion}
                    onChange={(e) => setEditCondicion(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E6E1DB] bg-white focus:bg-white text-[#2C2723] focus:outline-none focus:border-[#B88D65] focus:ring-2 focus:ring-[#B88D65]/20 font-medium transition"
                  >
                    <option value="NEW">Nuevo</option>
                    <option value="USED">Usado / Restaurado</option>
                  </select>
                </div>
              </div>

              {/* Medidas de Envío */}
              <div className="border-t border-[#EAE5DC] pt-3">
                <span className="text-[11px] font-semibold text-[#73675C] uppercase tracking-wider block mb-2">
                  Dimensiones de Despacho (Correo Argentino)
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[11px] text-[#73675C] block mb-1">Peso (kg)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0"
                      value={editPeso}
                      onChange={(e) => setEditPeso(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-2 text-xs border border-[#E6E1DB] bg-white focus:bg-white rounded-xl text-center font-bold text-[#2C2723] focus:outline-none focus:border-[#B88D65]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#73675C] block mb-1">Alto (cm)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={editAlto}
                      onChange={(e) => setEditAlto(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-2 text-xs border border-[#E6E1DB] bg-white focus:bg-white rounded-xl text-center font-bold text-[#2C2723] focus:outline-none focus:border-[#B88D65]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#73675C] block mb-1">Ancho (cm)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={editAncho}
                      onChange={(e) => setEditAncho(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-2 text-xs border border-[#E6E1DB] bg-white focus:bg-white rounded-xl text-center font-bold text-[#2C2723] focus:outline-none focus:border-[#B88D65]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#73675C] block mb-1">Largo (cm)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={editLargo}
                      onChange={(e) => setEditLargo(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-2 text-xs border border-[#E6E1DB] bg-white focus:bg-white rounded-xl text-center font-bold text-[#2C2723] focus:outline-none focus:border-[#B88D65]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={guardandoEdit}
                  className="w-full py-2.5 bg-[#B88D65] hover:bg-[#A37953] text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 h-[42px]"
                >
                  {guardandoEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {guardandoEdit ? "Guardando..." : "Guardar Modificaciones"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
