// app/mi-espacio/ModerationTab.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Loader2, RefreshCw, 
  User, Mail, Search, Sparkles, Filter, Eye, ShieldCheck, ArrowUpRight, Clock
} from "lucide-react";
import { getApiUrl } from "../../lib/config";
import { useToast } from "../../components/ToastContext";
import { useAuth } from "../../components/AuthContext";
import FormattedPrice from "../../components/FormattedPrice";

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
  token?: string;
}

export default function ModerationTab({ token }: ModerationTabProps) {
  const { token: contextToken } = useAuth();
  const activeToken = token || contextToken || (typeof window !== "undefined" ? localStorage.getItem("token") : "") || "";

  const [productos, setProductos] = useState<ModerationItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "rejected" | "pending" | "approved">("rejected");
  const [busqueda, setBusqueda] = useState("");
  const toast = useToast();

  const cargarProductos = async () => {
    if (!activeToken) return;
    setCargando(true);
    try {
      const res = await fetch(`${getApiUrl()}/products/admin/moderation/`, {
        headers: {
          Authorization: `Bearer ${activeToken}`
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
    if (activeToken) cargarProductos();
  }, [activeToken]);

  const handleAccion = async (id: number, action: "approve" | "reject") => {
    if (!activeToken) return;
    setProcesandoId(id);
    try {
      const res = await fetch(`${getApiUrl()}/products/admin/moderation/${id}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`
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
  const conteoAprobados = productos.filter(p => p.moderation_status === "approved").length;

  return (
    <div className="space-y-6 animate-fade-in font-sans text-[#d4d4d4]">
      {/* 1. CABECERA & CONTROLES ESTILO GOOGLE AI STUDIO */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          {/* Badge de Proyecto */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252525] border border-[#333333] text-xs font-medium text-[#d4d4d4]">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[#8c8c8c]">Motor</span>
            <span className="text-white font-semibold">Moderación IA Automática</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252525] border border-[#333333] text-xs text-[#8c8c8c]">
            <Clock className="h-3.5 w-3.5 text-[#87a9ff]" />
            <span>Escaneo en vivo</span>
          </div>
        </div>

        {/* Botón Actualizar Estilo IDE */}
        <button
          onClick={cargarProductos}
          disabled={cargando}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-[#252525] hover:bg-[#2f2f2f] text-white text-xs font-medium rounded-lg border border-[#333333] transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-[#87a9ff] ${cargando ? "animate-spin" : ""}`} />
          <span>Actualizar Cola</span>
        </button>
      </div>

      {/* 2. MINI TARJETAS KPI DE MODERACIÓN (Google AI Studio Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1: Rechazados */}
        <div 
          onClick={() => setFiltroEstado("rejected")}
          className={`bg-[#1f1f1f] border rounded-[16px] p-4 flex flex-col justify-between cursor-pointer transition-all ${
            filtroEstado === "rejected" ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]" : "border-[#2b2b2b] hover:border-[#3d3d3d]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-[#9aa0a6]">Rechazados por IA</span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-red-500/10 text-red-400 border border-red-500/20">
              Alerta
            </span>
          </div>
          <div className="text-[28px] font-bold text-white tracking-tight mt-2 tabular-nums">
            {conteoRechazados}
          </div>
          <p className="text-[11px] text-[#8c8c8c] mt-1">Violaciones de contacto o imágenes</p>
        </div>

        {/* KPI 2: Pendientes */}
        <div 
          onClick={() => setFiltroEstado("pending")}
          className={`bg-[#1f1f1f] border rounded-[16px] p-4 flex flex-col justify-between cursor-pointer transition-all ${
            filtroEstado === "pending" ? "border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]" : "border-[#2b2b2b] hover:border-[#3d3d3d]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-[#9aa0a6]">En Cola de Revisión</span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              En proceso
            </span>
          </div>
          <div className="text-[28px] font-bold text-white tracking-tight mt-2 tabular-nums">
            {conteoPendientes}
          </div>
          <p className="text-[11px] text-[#8c8c8c] mt-1">Escaneando OCR y contenido</p>
        </div>

        {/* KPI 3: Aprobados / Total */}
        <div 
          onClick={() => setFiltroEstado("todos")}
          className={`bg-[#1f1f1f] border rounded-[16px] p-4 flex flex-col justify-between cursor-pointer transition-all ${
            filtroEstado === "todos" ? "border-[#87a9ff]/50 shadow-[0_0_15px_rgba(135,169,255,0.15)]" : "border-[#2b2b2b] hover:border-[#3d3d3d]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-[#9aa0a6]">Total de Publicaciones</span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-[#2a2a2a] text-[#87a9ff] border border-[#383838]">
              Registros
            </span>
          </div>
          <div className="text-[28px] font-bold text-white tracking-tight mt-2 tabular-nums">
            {productos.length}
          </div>
          <p className="text-[11px] text-[#8c8c8c] mt-1">{conteoAprobados} publicaciones aprobadas</p>
        </div>
      </div>

      {/* 3. FILTROS Y BARRA DE BÚSQUEDA */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-[#1f1f1f] border border-[#2b2b2b] p-2.5 rounded-[14px]">
        {/* Pills de Filtrado */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFiltroEstado("rejected")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              filtroEstado === "rejected"
                ? "bg-[#2f2020] text-red-300 border border-red-500/40"
                : "bg-[#18181a] text-[#8c8c8c] border border-transparent hover:bg-[#252525] hover:text-white"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            Rechazados ({conteoRechazados})
          </button>

          <button
            onClick={() => setFiltroEstado("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              filtroEstado === "pending"
                ? "bg-[#2d2515] text-amber-300 border border-amber-500/40"
                : "bg-[#18181a] text-[#8c8c8c] border border-transparent hover:bg-[#252525] hover:text-white"
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            Pendientes ({conteoPendientes})
          </button>

          <button
            onClick={() => setFiltroEstado("approved")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              filtroEstado === "approved"
                ? "bg-[#182820] text-emerald-300 border border-emerald-500/40"
                : "bg-[#18181a] text-[#8c8c8c] border border-transparent hover:bg-[#252525] hover:text-white"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Aprobados ({conteoAprobados})
          </button>

          <button
            onClick={() => setFiltroEstado("todos")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filtroEstado === "todos"
                ? "bg-[#252525] text-white border border-[#444444]"
                : "bg-[#18181a] text-[#8c8c8c] border border-transparent hover:bg-[#252525] hover:text-white"
            }`}
          >
            Todos ({productos.length})
          </button>
        </div>

        {/* Input Buscador Oscuro */}
        <div className="relative min-w-[240px]">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8c8c]" />
          <input
            type="text"
            placeholder="Buscar por vendedor, título..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ color: '#ffffff', backgroundColor: '#18181a', caretColor: '#ffffff' }}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#18181a] text-white border border-[#333333] rounded-lg placeholder:text-[#666666] focus:outline-none focus:border-[#87a9ff] transition font-sans"
          />
        </div>
      </div>

      {/* 4. LISTADO DE PRODUCTOS EN MODERACIÓN */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#1f1f1f] rounded-[16px] border border-[#2b2b2b] gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#87a9ff]" />
          <p className="text-xs text-[#8c8c8c]">Cargando cola de moderación...</p>
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="text-center py-20 bg-[#1f1f1f] rounded-[16px] border border-[#2b2b2b] space-y-3">
          <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
          <p className="text-sm font-bold text-white">¡Cola de revisión despejada!</p>
          <p className="text-xs text-[#8c8c8c]">No hay publicaciones que coincidan con los filtros actuales.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {productosFiltrados.map(p => (
            <div
              key={p.id}
              className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[16px] p-5 space-y-4 hover:border-[#3d3d3d] transition-all"
            >
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Info Producto */}
                <div className="flex items-center gap-4 min-w-0">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.title}
                      className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-xl border border-[#2b2b2b] bg-[#121214] flex-shrink-0"
                    />
                  ) : (
                    <div className="h-16 w-16 sm:h-20 sm:w-20 bg-[#18181a] border border-[#2b2b2b] rounded-xl flex items-center justify-center text-[#8c8c8c] text-xs font-semibold flex-shrink-0">
                      Sin foto
                    </div>
                  )}

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-white truncate max-w-[280px] sm:max-w-md">
                        {p.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-[6px] border ${
                          p.moderation_status === "rejected"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : p.moderation_status === "pending"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}
                      >
                        {p.moderation_status === "rejected"
                          ? "Rechazado"
                          : p.moderation_status === "pending"
                          ? "En Revisión"
                          : "Aprobado"}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                      <FormattedPrice price={p.price} />
                      <span className="text-[11px] text-[#8c8c8c] font-normal">· {p.category}</span>
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-[#8c8c8c] pt-0.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-[#666666]" /> {p.seller_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-[#666666]" /> {p.seller_email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ACCIONES DEL ADMINISTRADOR */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
                  {p.moderation_status !== "approved" && (
                    <button
                      onClick={() => handleAccion(p.id, "approve")}
                      disabled={procesandoId === p.id}
                      className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-[#121214] border border-emerald-500/30 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {procesandoId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Aprobar
                    </button>
                  )}

                  {p.moderation_status !== "rejected" && (
                    <button
                      onClick={() => handleAccion(p.id, "reject")}
                      disabled={procesandoId === p.id}
                      className="flex-1 sm:flex-none px-4 py-2 bg-red-500/15 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/30 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {procesandoId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                      Rechazar
                    </button>
                  )}
                </div>
              </div>

              {/* DETALLE DE MODERACIÓN / DETECCIÓN DE IA */}
              {p.ai_moderation_notes ? (
                <div className="bg-[#241e15] border border-amber-500/30 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold block text-amber-300 text-[10px] uppercase tracking-wider">
                      Detección Inteligente de IA:
                    </span>
                    <p className="text-[11px] leading-relaxed text-[#fef3c7]">{p.ai_moderation_notes}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#18181a] border border-[#2b2b2b] p-3 rounded-xl flex items-start gap-2.5 text-xs text-[#8c8c8c]">
                  <Loader2 className="h-3.5 w-3.5 text-[#87a9ff] flex-shrink-0 mt-0.5 animate-spin" />
                  <div>
                    <span className="font-semibold block text-white text-[10px] uppercase tracking-wider">
                      Estado de Análisis:
                    </span>
                    <p className="text-[11px] text-[#8c8c8c]">Publicación en proceso de verificación automática por los filtros de seguridad.</p>
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
