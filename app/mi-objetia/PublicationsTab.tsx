"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Eye, Copy, Trash2, Check, Edit2, X, Loader2, Heart, TrendingUp, ShoppingBag, BarChart3, ChevronDown, ChevronUp, Sparkles, Info } from 'lucide-react';
import Link from 'next/link';
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

  // Filtro de pestaña actual
  const [filtroActual, setFiltroActual] = useState<'published' | 'pending' | 'rejected' | 'sold'>('published');

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

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const authToken = localStorage.getItem('vamaar_token') || token;
      const [resProd, resMetrics] = await Promise.all([
        fetch(`${getApiUrl()}/products/my-publications/`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }),
        fetch(`${getApiUrl()}/analytics/seller/metrics`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }).catch(() => null)
      ]);

      if (!resProd.ok) throw new Error("No se pudo obtener tus publicaciones.");
      const dataProd = await resProd.json();
      setProducts(dataProd);

      if (resMetrics && resMetrics.ok) {
        const dataMetrics = await resMetrics.json();
        setMetrics(dataMetrics);
      }
    } catch (err: any) {
      setError(err.message || "Error de red.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const handleCopiarEnlace = (id: number) => {
    const url = `${window.location.origin}/products/${id}`;
    navigator.clipboard.writeText(url);
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
        // Actualizar local
        setProducts(prev => prev.map(p => {
          if (p.id === editingProduct.id) {
            return {
              ...p,
              title: editTitulo,
              price: editPrecio,
              category: editCategoria,
              condition: editCondicion,
              stock: editStock,
              updated_at: new Date().toISOString()
            };
          }
          return p;
        }));
        setEditingProduct(null);
        toast.success("Los cambios de tu publicación fueron guardados.");
      } else {
        toast.error("Error al guardar modificaciones.");
      }
    } catch (err) {
      toast.error("Error de conexión con el servidor.");
    } finally {
      setGuardandoEdit(false);
    }
  };

  // Clasificación para los contadores
  const publicadas = products.filter(p => p.moderation_status === 'approved' && p.stock > 0);
  const enRevision = products.filter(p => p.moderation_status === 'pending');
  const rechazadas = products.filter(p => p.moderation_status === 'rejected');
  const vendidas = products.filter(p => p.moderation_status === 'approved' && p.stock < 1);

  // Determinar qué lista renderizar
  const getFilteredList = () => {
    switch (filtroActual) {
      case 'published': return publicadas;
      case 'pending': return enRevision;
      case 'rejected': return rechazadas;
      case 'sold': return vendidas;
    }
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
        <div className="h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative select-none">
      {/* ========================================================================= */}
      {/* MÉTRICAS DE RENDIMIENTO (DISEÑO INTERACTIVO CON BADGES, GRÁFICO CSS Y CONVERSIÓN) */}
      {/* ========================================================================= */}
      {metrics && (
        <div className="bg-white border border-[#e0e0e0] rounded-2xl p-5 space-y-4">
          {/* 1. Título y Subtítulo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-[14px] font-semibold text-[#202124]">
                Métricas de rendimiento
              </h4>
              <p className="text-[11px] text-[#5f6368]">
                Alcance y conversiones de tus artículos publicados
              </p>
            </div>

            <div className="flex items-center">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[#5f6368] bg-[#f1f3f4]">
                Actualizado en tiempo real
              </span>
            </div>
          </div>

          {/* 2. Barra con Botones estilo Actualizar de Objetia Studio (Light con activo carbón Google AI Studio) */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {/* Botón 1: Visualizaciones */}
            <button
              type="button"
              onClick={() => setMetricaActiva('views')}
              className={`px-3.5 h-[34px] sm:h-[36px] rounded-[10px] sm:rounded-[12px] text-[12px] sm:text-[13px] font-medium transition flex items-center gap-2 cursor-pointer border whitespace-nowrap ${
                metricaActiva === 'views'
                  ? 'bg-[#202124] border-[#202124] text-white shadow-xs'
                  : 'bg-white border-[#dadce0] text-[#3c4043] hover:bg-[#f8f9fa] hover:text-[#202124]'
              }`}
            >
              <span>Visualizaciones</span>
              <span className={`px-2 py-0.5 rounded-[6px] text-[11px] sm:text-[12px] font-mono font-semibold ${
                metricaActiva === 'views'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#f1f3f4] text-[#5f6368]'
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
                  ? 'bg-[#202124] border-[#202124] text-white shadow-xs'
                  : 'bg-white border-[#dadce0] text-[#3c4043] hover:bg-[#f8f9fa] hover:text-[#202124]'
              }`}
            >
              <span>Favoritos</span>
              <span className={`px-2 py-0.5 rounded-[6px] text-[11px] sm:text-[12px] font-mono font-semibold ${
                metricaActiva === 'favorites'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#f1f3f4] text-[#5f6368]'
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
                  ? 'bg-[#202124] border-[#202124] text-white shadow-xs'
                  : 'bg-white border-[#dadce0] text-[#3c4043] hover:bg-[#f8f9fa] hover:text-[#202124]'
              }`}
            >
              <span>Ventas</span>
              <span className={`px-2 py-0.5 rounded-[6px] text-[11px] sm:text-[12px] font-mono font-semibold ${
                metricaActiva === 'sales'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#f1f3f4] text-[#5f6368]'
              }`}>
                {metrics.total_sales.toLocaleString('es-AR')}
              </span>
            </button>
          </div>

          {/* 3. Gráfico de los últimos 30 días estilo "Ganancia de la plataforma por mes" (Sin Limit, CSS, Light con barras carbón) */}
          <div className="bg-[#f8f9fa] border border-[#dadce0] rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#5f6368]">
              <span className="font-medium text-[#202124]">
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

            {/* Lienzo del Gráfico con Líneas Horizontales */}
            <div className="relative h-48 w-full select-none flex flex-col justify-between pt-2 pb-1">
              {/* Líneas horizontales de referencia */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between pr-10">
                <div className="border-b border-[#dadce0] w-full relative">
                  <span className="absolute right-0 -top-2.5 text-[10px] text-[#5f6368] font-mono">
                    {maxActiveVal}
                  </span>
                </div>
                <div className="border-b border-[#dadce0] border-dashed w-full relative">
                  <span className="absolute right-0 -top-2.5 text-[10px] text-[#5f6368] font-mono">
                    {Math.round(maxActiveVal * 0.5)}
                  </span>
                </div>
                <div className="border-b border-[#dadce0] w-full relative">
                  <span className="absolute right-0 -top-2.5 text-[10px] text-[#5f6368] font-mono">
                    0
                  </span>
                </div>
              </div>

              {/* Barras CSS en carbón Google AI Studio (#3c4043 -> #202124) para todas las métricas */}
              <div className="relative z-10 flex items-end justify-between h-40 w-full pr-12 pl-1 gap-1">
                {activeTimelineData.map((d, idx) => {
                  const val = d.value;
                  const barH = val > 0 ? Math.max(8, Math.round((val / maxActiveVal) * 100)) : 2;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                    >
                      {/* Tooltip dinámico al pasar el cursor */}
                      <div className="absolute -top-8 hidden group-hover:flex bg-[#202124] text-white text-[10px] px-2 py-0.5 rounded-md shadow-md z-20 whitespace-nowrap">
                        {d.label}: {val} {metricaActiva === 'views' ? 'vistas' : metricaActiva === 'favorites' ? 'favoritos' : 'ventas'}
                      </div>

                      {/* Barra CSS con tono carbón Google AI Studio */}
                      <div
                        style={{ height: `${barH}%` }}
                        className={`w-full max-w-[22px] rounded-t-[4px] transition-all ${
                          val > 0 ? 'bg-[#3c4043] group-hover:bg-[#202124]' : 'bg-[#dadce0] hover:bg-[#bcc1c8]'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Eje X de fechas */}
              <div className="relative z-10 flex items-center justify-between text-[10px] text-[#5f6368] font-mono pt-2 pr-12 pl-1 border-t border-[#dadce0]">
                {activeTimelineData.map((d, idx) => (
                  <span key={idx} className={idx % 5 === 0 ? "block" : "hidden sm:inline-block opacity-0 select-none"}>
                    {idx % 5 === 0 ? d.label : d.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Abajo del Gráfico: Tasa de Conversión (Sobrio, sin colores estridentes) */}
          <div className="bg-[#fafafa] border border-[#e0e0e0] rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#202124]">
                  Tasa de conversión
                </span>
                <span className="text-[10px] font-mono text-[#5f6368]">
                  ({metrics.total_sales} ventas / {metrics.total_views} visitas)
                </span>
              </div>
              <p className="text-[11px] text-[#5f6368] mt-0.5">
                Porcentaje de visitas a tus publicaciones que finalizaron en una venta.
              </p>
            </div>

            <div className="flex items-baseline gap-1.5 self-start sm:self-center">
              <span className="text-xl sm:text-2xl font-semibold text-[#202124] font-mono">
                {metrics.conversion_rate}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs superiores Google AI Studio Light */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setFiltroActual('published')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition border cursor-pointer ${
              filtroActual === 'published' 
                ? 'bg-[#1a73e8] text-white border-[#1a73e8] shadow-2xs' 
                : 'bg-white text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] border-[#dadce0]'
            }`}
          >
            Publicadas ({publicadas.length})
          </button>
          <button 
            onClick={() => setFiltroActual('pending')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition border cursor-pointer ${
              filtroActual === 'pending' 
                ? 'bg-[#1a73e8] text-white border-[#1a73e8] shadow-2xs' 
                : 'bg-white text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] border-[#dadce0]'
            }`}
          >
            En revisión ({enRevision.length})
          </button>
          <button 
            onClick={() => setFiltroActual('rejected')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition border cursor-pointer ${
              filtroActual === 'rejected' 
                ? 'bg-[#1a73e8] text-white border-[#1a73e8] shadow-2xs' 
                : 'bg-white text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] border-[#dadce0]'
            }`}
          >
            Rechazadas ({rechazadas.length})
          </button>
          <button 
            onClick={() => setFiltroActual('sold')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition border cursor-pointer ${
              filtroActual === 'sold' 
                ? 'bg-[#1a73e8] text-white border-[#1a73e8] shadow-2xs' 
                : 'bg-white text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] border-[#dadce0]'
            }`}
          >
            Vendidas ({vendidas.length})
          </button>
        </div>
      </div>

      {/* Tabla de Publicaciones Google AI Studio Light */}
      <div className="bg-white border border-[#dadce0] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#dadce0] bg-[#f8f9fa] text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider">
                <th className="py-3 px-5">Producto</th>
                <th className="py-3 px-5">Estado</th>
                <th className="py-3 px-5 text-center">Interacciones</th>
                <th className="py-3 px-5">Precio</th>
                <th className="py-3 px-5">Actualizado</th>
                <th className="py-3 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f3f4]">
              {getFilteredList().length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#5f6368]">
                    No hay publicaciones en esta sección.
                  </td>
                </tr>
              ) : (
                getFilteredList().map((item) => (
                  <tr key={item.id} className="hover:bg-[#f8f9fa] transition">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={formatearTituloProducto(item.title)} 
                            className="h-10 w-10 rounded-xl object-cover border border-[#dadce0] flex-shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-[#f8f9fa] border border-[#dadce0] rounded-xl flex items-center justify-center text-base flex-shrink-0">
                            🛋️
                          </div>
                        )}
                        <span className="font-bold text-[#202124] text-xs truncate max-w-[200px]">
                          {formatearTituloProducto(item.title)}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      {item.moderation_status === 'rejected' ? (
                        <span
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200"
                          title={item.ai_moderation_notes || "La publicación fue rechazada por la moderación."}
                        >
                          Rechazada
                        </span>
                      ) : item.stock < 1 ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0]">
                          Vendido
                        </span>
                      ) : item.moderation_status === 'approved' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                          Publicado
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#fef7e0] text-[#b06000] border border-[#feefc3]">
                          En revisión
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center justify-center gap-3 text-xs text-[#5f6368] font-mono">
                        <span title="Visualizaciones">
                          {item.views || 0} vistas
                        </span>
                        <span className="text-[#dadce0]">·</span>
                        <span title="Favoritos">
                          {item.favorites || 0} favs
                        </span>
                        {(item.sales ?? 0) > 0 && (
                          <>
                            <span className="text-[#dadce0]">·</span>
                            <span className="font-semibold text-[#202124]" title="Ventas">
                              {item.sales} ventas
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-5 font-bold text-[#202124] text-xs">
                      {formatearMonedaLocal(item.price)}
                    </td>

                    <td className="py-4 px-5 text-[#5f6368] text-xs">
                      {new Date(item.updated_at).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link 
                          href={`/products/${item.id}`}
                          title="Ver publicación"
                          className="p-1.5 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] rounded-lg transition"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        
                        {item.stock > 0 && (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Editar publicación"
                            className="p-1.5 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] rounded-lg transition cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}

                        {item.moderation_status === 'approved' && item.stock > 0 && (
                          <button
                            onClick={() => handleCopiarEnlace(item.id)}
                            title="Copiar enlace"
                            className="p-1.5 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] rounded-lg transition cursor-pointer"
                          >
                            {copiandoId === item.id ? (
                              <Check className="h-4 w-4 text-[#137333]" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleEliminarProducto(item.id)}
                          title="Eliminar publicación"
                          className="p-1.5 text-[#5f6368] hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL DE EDICIÓN GOOGLE AI STUDIO LIGHT --- */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative border border-[#dadce0]">
            <button 
              onClick={() => setEditingProduct(null)}
              className="absolute top-5 right-5 p-2 text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] rounded-full transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-[#202124] tracking-tight">Editar Publicación</h3>
              <p className="text-xs text-[#5f6368] mt-0.5">Modifica los detalles del artículo y las dimensiones físicas para envío.</p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#3c4043] block">Título del Artículo</label>
                <input 
                  type="text" 
                  required
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#dadce0] bg-[#f8f9fa] focus:bg-white text-[#202124] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 font-medium transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#3c4043] block">Descripción</label>
                <textarea 
                  rows={3}
                  required
                  value={editDescripcion}
                  onChange={(e) => setEditDescripcion(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#dadce0] bg-[#f8f9fa] focus:bg-white text-[#202124] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 font-medium leading-relaxed transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#3c4043] block">Precio (ARS)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={editPrecio}
                    onChange={(e) => setEditPrecio(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#dadce0] bg-[#f8f9fa] focus:bg-white text-[#202124] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 font-bold transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#3c4043] block">Stock Disponible</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={editStock}
                    onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#dadce0] bg-[#f8f9fa] focus:bg-white text-[#202124] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 font-bold transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#3c4043] block">Categoría</label>
                  <input 
                    type="text" 
                    required
                    value={editCategoria}
                    onChange={(e) => setEditCategoria(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#dadce0] bg-[#f8f9fa] focus:bg-white text-[#202124] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 font-medium transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#3c4043] block">Condición</label>
                  <select 
                    value={editCondicion}
                    onChange={(e) => setEditCondicion(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#dadce0] bg-[#f8f9fa] focus:bg-white text-[#202124] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 font-medium transition"
                  >
                    <option value="NEW">Nuevo</option>
                    <option value="USED">Usado / Restaurado</option>
                  </select>
                </div>
              </div>

              {/* Medidas de Envío */}
              <div className="border-t border-[#f1f3f4] pt-3">
                <span className="text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider block mb-2">
                  Dimensiones de Despacho (Correo Argentino)
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[11px] text-[#5f6368] block mb-1">Peso (kg)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0"
                      value={editPeso}
                      onChange={(e) => setEditPeso(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-2 text-xs border border-[#dadce0] bg-[#f8f9fa] focus:bg-white rounded-xl text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#5f6368] block mb-1">Alto (cm)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={editAlto}
                      onChange={(e) => setEditAlto(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-2 text-xs border border-[#dadce0] bg-[#f8f9fa] focus:bg-white rounded-xl text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#5f6368] block mb-1">Ancho (cm)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={editAncho}
                      onChange={(e) => setEditAncho(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-2 text-xs border border-[#dadce0] bg-[#f8f9fa] focus:bg-white rounded-xl text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#5f6368] block mb-1">Largo (cm)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={editLargo}
                      onChange={(e) => setEditLargo(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-2 text-xs border border-[#dadce0] bg-[#f8f9fa] focus:bg-white rounded-xl text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={guardandoEdit}
                  className="w-full py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl text-xs font-semibold shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 h-[42px]"
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
