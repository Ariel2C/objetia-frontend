"use client";
import React, { useState, useEffect } from 'react';
import { Eye, Copy, Trash2, Plus, Check, Edit2, X, Loader2 } from 'lucide-react';
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
}

interface PublicationsTabProps {
  token: string | null;
}

export default function PublicationsTab({ token }: PublicationsTabProps) {
  const toast = useToast();
  const [products, setProducts] = useState<ProductItem[]>([]);
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
      const res = await fetch(`${getApiUrl()}/products/my-publications/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('vamaar_token') || token}`
        }
      });
      if (!res.ok) throw new Error("No se pudo obtener tus publicaciones.");
      const data = await res.json();
      setProducts(data);
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
    <div className="space-y-6 animate-fade-in relative">
      <div>
        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Mis Publicaciones</h3>
        <p className="text-xs text-gray-500">Administra los artículos de decoración y muebles que has subido a la tienda.</p>
      </div>

      {/* Tabs superiores */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-2">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setFiltroActual('published')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition border cursor-pointer ${
              filtroActual === 'published' 
                ? 'bg-gray-900 text-white border-gray-900' 
                : 'bg-white text-gray-500 hover:text-gray-900 border-gray-200'
            }`}
          >
            Publicadas ({publicadas.length})
          </button>
          <button 
            onClick={() => setFiltroActual('pending')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition border cursor-pointer ${
              filtroActual === 'pending' 
                ? 'bg-gray-900 text-white border-gray-900' 
                : 'bg-white text-gray-500 hover:text-gray-900 border-gray-200'
            }`}
          >
            En revisión ({enRevision.length})
          </button>
          <button 
            onClick={() => setFiltroActual('rejected')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition border cursor-pointer ${
              filtroActual === 'rejected' 
                ? 'bg-gray-900 text-white border-gray-900' 
                : 'bg-white text-gray-500 hover:text-gray-900 border-gray-200'
            }`}
          >
            Rechazadas ({rechazadas.length})
          </button>
          <button 
            onClick={() => setFiltroActual('sold')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition border cursor-pointer ${
              filtroActual === 'sold' 
                ? 'bg-gray-900 text-white border-gray-900' 
                : 'bg-white text-gray-500 hover:text-gray-900 border-gray-200'
            }`}
          >
            Vendidas ({vendidas.length})
          </button>
        </div>

        <Link 
          href="/products/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2D332D] hover:bg-[#1E221E] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo objeto</span>
        </Link>
      </div>

      {/* Tabla de Publicaciones */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-5">Objeto</th>
                <th className="py-3 px-5">Estado</th>
                <th className="py-3 px-5">Precio</th>
                <th className="py-3 px-5">Actualizado</th>
                <th className="py-3 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {getFilteredList().length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-gray-400">
                    No hay publicaciones en esta sección.
                  </td>
                </tr>
              ) : (
                getFilteredList().map((item) => (
                  <tr key={item.id} className="hover:bg-gray-55/30 transition">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={formatearTituloProducto(item.title)} 
                            className="h-10 w-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0">
                            🛋️
                          </div>
                        )}
                        <span className="font-bold text-gray-800 text-xs truncate max-w-[200px]">
                          {formatearTituloProducto(item.title)}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      {item.moderation_status === 'rejected' ? (
                        <span
                          className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-100"
                          title={item.ai_moderation_notes || "La publicación fue rechazada por la moderación."}
                        >
                          Rechazada
                        </span>
                      ) : item.stock < 1 ? (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-gray-100 text-gray-600 border border-gray-200">
                          Vendido
                        </span>
                      ) : item.moderation_status === 'approved' ? (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Publicado
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-100">
                          En revisión
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-5 font-bold text-gray-800 text-xs">
                      {formatearMonedaLocal(item.price)}
                    </td>

                    <td className="py-4 px-5 text-gray-400 text-xs">
                      {new Date(item.updated_at).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/products/${item.id}`}
                          title="Ver publicación"
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </Link>
                        
                        {item.stock > 0 && (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Editar publicación"
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          >
                            <Edit2 className="h-4.5 w-4.5" />
                          </button>
                        )}

                        {item.moderation_status === 'approved' && item.stock > 0 && (
                          <button
                            onClick={() => handleCopiarEnlace(item.id)}
                            title="Copiar enlace"
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                          >
                            {copiandoId === item.id ? (
                              <Check className="h-4.5 w-4.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-4.5 w-4.5" />
                            )}
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleEliminarProducto(item.id)}
                          title="Eliminar publicación"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
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

      {/* --- MODAL DE EDICIÓN --- */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative border border-gray-100">
            <button 
              onClick={() => setEditingProduct(null)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-base font-black text-gray-900 tracking-tight">Editar Publicación</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Modifica los detalles del artículo y las dimensiones físicas de envío.</p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Título del Artículo</label>
                <input 
                  type="text" 
                  required
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Descripción</label>
                <textarea 
                  rows={3}
                  required
                  value={editDescripcion}
                  onChange={(e) => setEditDescripcion(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:border-amber-500 font-medium leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Precio (ARS)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={editPrecio}
                    onChange={(e) => setEditPrecio(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Categoría</label>
                  <select
                    value={editCategoria}
                    onChange={(e) => setEditCategoria(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:border-amber-500 font-bold cursor-pointer"
                  >
                    <option value="Sillones y Sofás">Sillones y Sofás</option>
                    <option value="Mesas y Escritorios">Mesas y Escritorios</option>
                    <option value="Sillas y Bancos">Sillas y Bancos</option>
                    <option value="Almacenamiento">Almacenamiento</option>
                    <option value="Iluminación">Iluminación</option>
                    <option value="Decoración">Decoración</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Estado/Condición</label>
                  <select
                    value={editCondicion}
                    onChange={(e) => setEditCondicion(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:border-amber-500 font-bold cursor-pointer"
                  >
                    <option value="NEW">Sin Uso</option>
                    <option value="USED">Usado Único</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Stock</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={editStock}
                    onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Medidas de Embalaje (Correo Argentino)</span>
                
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Peso (kg)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      required
                      value={editPeso}
                      onChange={(e) => setEditPeso(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg text-center font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Alto (cm)</label>
                    <input 
                      type="number" 
                      required
                      value={editAlto}
                      onChange={(e) => setEditAlto(parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg text-center font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Ancho (cm)</label>
                    <input 
                      type="number" 
                      required
                      value={editAncho}
                      onChange={(e) => setEditAncho(parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg text-center font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Largo (cm)</label>
                    <input 
                      type="number" 
                      required
                      value={editLargo}
                      onChange={(e) => setEditLargo(parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={guardandoEdit}
                  className="flex-grow py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {guardandoEdit && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
