"use client";
import React, { useState, useEffect } from 'react';
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
  views_timeline: { date: string; label: string; views: number }[];
  top_products: any[];
}

interface PublicationsTabProps {
  token: string | null;
}

export default function PublicationsTab({ token }: PublicationsTabProps) {
  const toast = useToast();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [metrics, setMetrics] = useState<SellerMetrics | null>(null);
  const [mostrarGrafico, setMostrarGrafico] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiandoId, setCopiandoId] = useState<number | null>(null);

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
      {/* MÉTRICAS DE OPERACIÓN Y RENDIMIENTO (DISEÑO GOOGLE AI STUDIO LIGHT) */}
      {/* ========================================================================= */}
      {metrics && (
        <div className="bg-white border border-[#dadce0] rounded-[16px] p-5 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-[14px] font-semibold text-[#202124] tracking-tight">
                  Métricas de Operación y Rendimiento
                </h4>
                <Info className="h-3.5 w-3.5 text-[#5f6368]" />
              </div>
              <p className="text-[11px] text-[#5f6368] mt-0.5">
                Rendimiento de tus publicaciones y alcance de tu catálogo en comparación con el marketplace
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-[6px] bg-[#e8f0fe] text-[#1a73e8] font-mono text-[11px] border border-[#d2e3fc]">
                En tiempo real
              </span>
              {metrics.views_timeline && metrics.views_timeline.length > 0 && (
                <button
                  onClick={() => setMostrarGrafico(!mostrarGrafico)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-[#dadce0] bg-[#f8f9fa] hover:bg-[#f1f3f4] text-[#202124] transition cursor-pointer"
                >
                  {mostrarGrafico ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {mostrarGrafico ? "Ocultar tendencia" : "Ver tendencia (30 días)"}
                </button>
              )}
            </div>
          </div>

          {/* Tabla de Capacidad y Progreso estilo Google AI Studio Light */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="border-b border-[#dadce0] text-[#5f6368] font-medium text-[11px] uppercase tracking-wider">
                  <th className="pb-3 pr-4">Métrica</th>
                  <th className="pb-3 px-4">Categoría</th>
                  <th className="pb-3 px-4">Progreso / Volumen</th>
                  <th className="pb-3 px-4 text-right">Ratio / Impacto</th>
                  <th className="pb-3 pl-4 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f4] text-[#202124] font-normal text-[13px]">
                {/* Fila 1: Visualizaciones de Artículos */}
                <tr className="hover:bg-[#f8f9fa] transition">
                  <td className="py-3.5 pr-4 font-semibold text-[#202124]">
                    <div className="flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5 text-[#1a73e8]" />
                      <span>Visualizaciones Totales</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#5f6368]">Audiencia</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-1.5 bg-[#f1f3f4] rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${Math.min(100, Math.max(10, (metrics.total_views / Math.max(1, (metrics.total_publications * 50))) * 100))}%` }} 
                          className="h-full bg-[#1a73e8] rounded-full"
                        />
                      </div>
                      <span className="text-xs text-[#5f6368] font-mono">
                        {metrics.total_views.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-[#202124]">
                    {metrics.total_publications > 0 ? (metrics.total_views / metrics.total_publications).toFixed(1) : 0} vistas/art.
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-medium bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                      Activo
                    </span>
                  </td>
                </tr>

                {/* Fila 2: Guardados en Favoritos */}
                <tr className="hover:bg-[#f8f9fa] transition">
                  <td className="py-3.5 pr-4 font-semibold text-[#202124]">
                    <div className="flex items-center gap-2">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span>Artículos en Favoritos</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#5f6368]">Interés</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-1.5 bg-[#f1f3f4] rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${Math.min(100, Math.max(10, (metrics.total_favorites / Math.max(1, metrics.total_views || 1)) * 100 * 2))}%` }} 
                          className="h-full bg-rose-500 rounded-full"
                        />
                      </div>
                      <span className="text-xs text-[#5f6368] font-mono">
                        {metrics.total_favorites.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-[#202124]">
                    {metrics.total_views > 0 ? ((metrics.total_favorites / metrics.total_views) * 100).toFixed(1) : 0}% ratio fav
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-medium bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf]">
                      En demanda
                    </span>
                  </td>
                </tr>

                {/* Fila 3: Ventas Concretadas */}
                <tr className="hover:bg-[#f8f9fa] transition">
                  <td className="py-3.5 pr-4 font-semibold text-[#202124]">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Venta de Artículos</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#5f6368]">Operaciones</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-1.5 bg-[#f1f3f4] rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${Math.min(100, Math.max(10, (metrics.total_sales / Math.max(1, metrics.total_publications || 1)) * 100))}%` }} 
                          className="h-full bg-emerald-600 rounded-full"
                        />
                      </div>
                      <span className="text-xs text-[#5f6368] font-mono">
                        {metrics.total_sales.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-emerald-700">
                    {metrics.total_sales > 0 ? `${metrics.total_sales} u. vendidas` : 'Sin ventas'}
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-medium bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                      Efectivo
                    </span>
                  </td>
                </tr>

                {/* Fila 4: Tasa de Conversión */}
                <tr className="hover:bg-[#f8f9fa] transition">
                  <td className="py-3.5 pr-4 font-semibold text-[#202124]">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                      <span>Tasa de Conversión</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#5f6368]">Rendimiento</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-1.5 bg-[#f1f3f4] rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${Math.min(100, Math.max(10, metrics.conversion_rate * 10))}%` }} 
                          className="h-full bg-amber-500 rounded-full"
                        />
                      </div>
                      <span className="text-xs text-[#5f6368] font-mono">
                        {metrics.conversion_rate}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-amber-700">
                    {metrics.conversion_rate > 0 ? `1 cada ${Math.round(100 / metrics.conversion_rate)} vistas` : '0%'}
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-medium bg-[#fef7e0] text-[#b06000] border border-[#feefc3]">
                      Óptimo
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Gráfico de Evolución de Visitas (30 días) en versión Light */}
          {mostrarGrafico && metrics.views_timeline && metrics.views_timeline.length > 0 && (
            <div className="pt-3 border-t border-[#dadce0]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#5f6368]">Tendencia diaria de visualizaciones (últimos 30 días)</span>
                <span className="text-[10px] text-[#5f6368] font-mono">Total acumulado: {metrics.total_views} vistas</span>
              </div>
              <div className="h-28 w-full flex items-end gap-1 pt-4 pb-1 overflow-x-auto bg-[#f8f9fa] rounded-xl p-3 border border-[#dadce0]">
                {metrics.views_timeline.map((item, idx) => {
                  const maxV = Math.max(...metrics.views_timeline.map(x => x.views), 1);
                  const hPercent = Math.round((item.views / maxV) * 100);
                  return (
                    <div key={idx} className="flex-1 min-w-[14px] flex flex-col items-center group relative h-full justify-end">
                      <div className="absolute -top-7 hidden group-hover:flex bg-[#202124] text-white text-[10px] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-10">
                        {item.label}: {item.views} vistas
                      </div>
                      <div
                        style={{ height: `${Math.max(hPercent, 6)}%` }}
                        className={`w-full rounded-t transition-all ${
                          item.views > 0 ? 'bg-[#1a73e8] group-hover:bg-[#1557b0]' : 'bg-[#dadce0]'
                        }`}
                      />
                      {idx % 5 === 0 && (
                        <span className="text-[9px] text-[#5f6368] mt-1 font-mono">{item.label}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
                      <div className="flex items-center justify-center gap-3">
                        <span className="inline-flex items-center gap-1 text-xs text-[#5f6368]" title="Visualizaciones">
                          <Eye className="w-3.5 h-3.5 text-[#1a73e8]" />
                          {item.views || 0}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-[#5f6368]" title="Favoritos">
                          <Heart className="w-3.5 h-3.5 text-rose-500" />
                          {item.favorites || 0}
                        </span>
                        {(item.sales ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200" title="Ventas">
                            <ShoppingBag className="w-3 h-3 text-emerald-600" />
                            {item.sales}
                          </span>
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
