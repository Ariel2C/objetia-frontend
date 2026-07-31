// app/mi-espacio/ModerationTab.tsx
"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Loader2, RefreshCw, User, Mail, Search } from "lucide-react";
import { getApiUrl } from "../../lib/config";
import { useToast } from "../../components/ToastContext";

interface ModerationItem {
  id: number;
  title: string;
  price: number;
  category: string;
  condition: string;
  moderation_status: "pending" | "approved" | "rejected";
  ai_moderation_notes: string | null;
  seller_id: number;
  seller_name: string;
  seller_email: string;
  image_url: string;
  created_at: string | null;
}

interface ModerationTabProps {
  token: string;
}

export default function ModerationTab({ token }: ModerationTabProps) {
  const [productos, setProductos] = useState<ModerationItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "rejected" | "pending" | "approved">("rejected");
  const [busqueda, setBusqueda] = useState("");
  const toast = useToast();

  const cargarProductos = async () => {
    setCargando(true);
    try {
      const res = await fetch(`${getApiUrl()}/products/admin/moderation/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Error al obtener productos de moderación");
      const data = await res.json();
      setProductos(data);
    } catch (err: any) {
      console.error(err);
      toast.error("No se pudieron cargar los productos en revisión.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (token) cargarProductos();
  }, [token]);

  const handleAccion = async (id: number, action: "approve" | "reject") => {
    setProcesandoId(id);
    try {
      const res = await fetch(`${getApiUrl()}/products/admin/moderation/${id}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error("Error al procesar la acción de moderación");

      toast.success(action === "approve" ? "Producto aprobado exitosamente." : "Producto rechazado.");
      setProductos(prev =>
        prev.map(p => (p.id === id ? { ...p, moderation_status: action === "approve" ? "approved" : "rejected" } : p))
      );
    } catch (err: any) {
      console.error(err);
      toast.error("Fallo la acción sobre el producto.");
    } finally {
      setProcesandoId(null);
    }
  };

  const productosFiltrados = productos.filter(p => {
    if (filtroEstado === "rejected" && p.moderation_status !== "rejected") return false;
    if (filtroEstado === "pending" && p.moderation_status !== "pending") return false;
    if (filtroEstado === "approved" && p.moderation_status !== "approved") return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      return (
        p.title.toLowerCase().includes(q) ||
        p.seller_name?.toLowerCase().includes(q) ||
        p.seller_email?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const conteoRechazados = productos.filter(p => p.moderation_status === "rejected").length;
  const conteoPendientes = productos.filter(p => p.moderation_status === "pending").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-amber-500" />
            <h2 className="text-lg font-bold text-gray-900">Moderación y Revisión de Productos</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Revisá los artículos rechazados o bajo la lupa de la Inteligencia Artificial por contacto externo o imágenes inapropiadas.
          </p>
        </div>
        <button
          onClick={cargarProductos}
          disabled={cargando}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${cargando ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltroEstado("rejected")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filtroEstado === "rejected"
                ? "bg-red-500 text-white shadow-xs"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Rechazados por IA ({conteoRechazados})
          </button>

          <button
            onClick={() => setFiltroEstado("pending")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filtroEstado === "pending"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Pendientes ({conteoPendientes})
          </button>

          <button
            onClick={() => setFiltroEstado("todos")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              filtroEstado === "todos"
                ? "bg-gray-900 text-white shadow-xs"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Todos ({productos.length})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por vendedor, título..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
      </div>

      {/* LISTADO DE PRODUCTOS */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-2" />
          <p className="text-xs text-gray-400 font-medium">Cargando productos de moderación...</p>
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-2">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
          <p className="text-sm font-bold text-gray-800">¡Todo impecable!</p>
          <p className="text-xs text-gray-400">No hay publicaciones con el filtro seleccionado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {productosFiltrados.map(p => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs hover:shadow-md transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-4">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.title}
                      className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-xl border border-gray-100 flex-shrink-0"
                    />
                  ) : (
                    <div className="h-16 w-16 sm:h-20 sm:w-20 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs font-bold flex-shrink-0">
                      Sin foto
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-gray-900">{p.title}</h3>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                          p.moderation_status === "rejected"
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : p.moderation_status === "pending"
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {p.moderation_status === "rejected"
                          ? "Rechazado"
                          : p.moderation_status === "pending"
                          ? "En Revisión"
                          : "Aprobado"}
                      </span>
                    </div>

                    <p className="text-xs font-extrabold text-purple-700 mt-1">
                      $ {p.price.toLocaleString("es-AR")} <span className="text-[11px] text-gray-400 font-normal">| {p.category}</span>
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-gray-500 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 font-medium">
                        <User className="h-3.5 w-3.5 text-gray-400" /> {p.seller_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-gray-400" /> {p.seller_email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ACCIONES DEL ADMIN */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {p.moderation_status !== "approved" && (
                    <button
                      onClick={() => handleAccion(p.id, "approve")}
                      disabled={procesandoId === p.id}
                      className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {procesandoId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Aprobar
                    </button>
                  )}

                  {p.moderation_status !== "rejected" && (
                    <button
                      onClick={() => handleAccion(p.id, "reject")}
                      disabled={procesandoId === p.id}
                      className="flex-1 sm:flex-none px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {procesandoId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                      Rechazar
                    </button>
                  )}
                </div>
              </div>

              {/* DETALLE DE MODERACIÓN / DETECCIÓN DE IA */}
              {p.ai_moderation_notes ? (
                <div className="bg-amber-50/80 border border-amber-200/80 p-3 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block text-amber-950 text-[11px] uppercase tracking-wider">
                      Detalle de Moderación de IA:
                    </span>
                    <p className="mt-0.5 text-[11px] leading-relaxed font-medium">{p.ai_moderation_notes}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-start gap-2.5 text-xs text-slate-800">
                  <Loader2 className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5 animate-spin" />
                  <div>
                    <span className="font-extrabold block text-slate-900 text-[11px] uppercase tracking-wider">
                      Estado de Moderación:
                    </span>
                    <p className="mt-0.5 text-[11px] leading-relaxed font-medium">Publicación en cola de análisis por IA (escaneando imágenes y OCR anti-evasión).</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
