"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Loader2, Users, TrendingUp, AlertTriangle, Truck, Percent, Lock, Wallet, 
  ShieldCheck, ChevronDown, ShoppingBag, Receipt, BarChart3, ArrowUpRight, 
  Sliders, Calendar, Filter, Zap, Activity, Info
} from 'lucide-react';
import FormattedPrice from '../../components/FormattedPrice';
import { apiFetch } from '../../lib/api';

interface ResumenPeriodo {
  orders_count: number;
  sales_total: number;
  products_total: number;
  shipping_total: number;
  commissions: number;
  avg_ticket: number;
}

interface StatsData {
  years: number[];
  year: number;
  monthly: (ResumenPeriodo & { month: number; label: string })[];
  totals_year: ResumenPeriodo;
  all_time: ResumenPeriodo;
}

const formatearARS = (val: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

const formatearCompacto = (val: number) => {
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} M`;
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toLocaleString('es-AR', { maximumFractionDigits: 0 })}K`;
  return `$${val.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
};

interface DashboardTabProps {
  msgAsignar: { tipo: 'exito' | 'error'; texto: string } | null;
  emailAsignar: string;
  setEmailAsignar: (val: string) => void;
  rolAsignar: string;
  setRolAsignar: (val: string) => void;
  cargandoAsignar: boolean;
  handleAsignarRango: (e: React.FormEvent) => void;
  adminDashboardData?: {
    total_users: number;
    total_sales_volume: number;
    total_shipping_volume: number;
    total_platform_commissions: number;
    total_frozen_funds: number;
    total_available_funds: number;
    pending_moderations: number;
    all_sales: {
      id: number;
      buyer_name: string;
      seller_name: string;
      product_title: string;
      total_price: number;
      shipping_cost: number;
      status: string;
      created_at: string;
    }[];
  } | null;
  cargandoDashboard?: boolean;
}

const ESTADOS_VENTA: Record<string, { label: string; className: string }> = {
  paid: { label: "Pagado", className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  pending_payment: { label: "Pendiente", className: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  shipped: { label: "Enviado", className: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  delivered: { label: "Entregado", className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  cancelled: { label: "Cancelado", className: "bg-red-500/20 text-red-300 border-red-500/30" },
};

// Generador de curva suave Bezier para SVG
function generateSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cx = (curr.x + next.x) / 2;
    d += ` C ${cx} ${curr.y}, ${cx} ${next.y}, ${next.x} ${next.y}`;
  }
  return d;
}

export default function DashboardTab({
  msgAsignar,
  emailAsignar,
  setEmailAsignar,
  rolAsignar,
  setRolAsignar,
  cargandoAsignar,
  handleAsignarRango,
  adminDashboardData,
  cargandoDashboard
}: DashboardTabProps) {
  const moderacionesPendientes = adminDashboardData?.pending_moderations ?? 0;

  // --- Estadísticas por período (año) ---
  const [stats, setStats] = useState<StatsData | null>(null);
  const [anioSeleccionado, setAnioSeleccionado] = useState<number | null>(null);
  const [cargandoStats, setCargandoStats] = useState(false);
  const [activeHoverPoint, setActiveHoverPoint] = useState<{ label: string; value: number; commissions: number; x: number; y: number } | null>(null);

  useEffect(() => {
    let cancelado = false;
    const fetchStats = async () => {
      setCargandoStats(true);
      try {
        const query = anioSeleccionado ? `?year=${anioSeleccionado}` : '';
        const data = await apiFetch<StatsData>(`/orders/admin/stats/${query}`);
        if (!cancelado) setStats(data);
      } catch (e) {
        console.error("Error al cargar estadísticas:", e);
      } finally {
        if (!cancelado) setCargandoStats(false);
      }
    };
    fetchStats();
    return () => { cancelado = true; };
  }, [anioSeleccionado]);

  const resumen = stats?.totals_year;
  const monthlyData = useMemo(() => stats?.monthly || [], [stats]);

  // Cálculos para gráfico nativo SVG (Ventas Mensuales)
  const maxVenta = useMemo(() => {
    const vals = monthlyData.map(m => m.products_total);
    const m = Math.max(...vals, 1000);
    return Math.ceil(m * 1.15);
  }, [monthlyData]);

  const maxComision = useMemo(() => {
    const vals = monthlyData.map(m => m.commissions);
    const m = Math.max(...vals, 500);
    return Math.ceil(m * 1.2);
  }, [monthlyData]);

  const linePoints = useMemo(() => {
    if (monthlyData.length === 0) return [];
    const width = 560;
    const height = 140;
    const paddingX = 30;
    const paddingY = 20;

    return monthlyData.map((m, idx) => {
      const x = paddingX + (idx / Math.max(1, monthlyData.length - 1)) * (width - paddingX * 2);
      const ratio = m.products_total / maxVenta;
      const y = height - paddingY - ratio * (height - paddingY * 2);
      return { x, y, label: m.label, value: m.products_total, commissions: m.commissions };
    });
  }, [monthlyData, maxVenta]);

  const sparklineOrangePink = useMemo(() => {
    if (linePoints.length === 0) return "";
    return generateSmoothPath(linePoints);
  }, [linePoints]);

  const sparklineArea = useMemo(() => {
    if (linePoints.length === 0) return "";
    const first = linePoints[0];
    const last = linePoints[linePoints.length - 1];
    return `${sparklineOrangePink} L ${last.x} 140 L ${first.x} 140 Z`;
  }, [linePoints, sparklineOrangePink]);

  return (
    <div className="space-y-6 animate-fade-in font-sans text-[#d4d4d4]">
      {/* BARRA SUPERIOR DE SELECTORES ESTILO GOOGLE AI STUDIO */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          {/* Badge Project */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252525] border border-[#333333] text-xs font-medium text-[#d4d4d4]">
            <span className="text-[#8c8c8c]">Proyecto</span>
            <span className="text-white font-semibold">Objetia Marketplace</span>
          </div>

          {/* Selector de Período / Año */}
          <div className="relative">
            <select
              value={stats?.year ?? ""}
              onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
              disabled={cargandoStats || !stats}
              style={{ color: '#ffffff', backgroundColor: '#252525' }}
              className="pl-3 pr-8 py-1.5 text-xs font-medium rounded-lg border border-[#333333] bg-[#252525] text-white focus:outline-none focus:border-[#87a9ff] cursor-pointer appearance-none transition"
            >
              {(stats?.years ?? []).map((y) => (
                <option key={y} value={y} className="bg-[#1e1e1e] text-white">Período Año {y}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              {cargandoStats ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#8c8c8c]" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-[#8c8c8c]" />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#8c8c8c]">
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          <span>Telemetría en tiempo real</span>
        </div>
      </div>

      {cargandoDashboard ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#87a9ff]" />
          <p className="text-xs text-[#8c8c8c]">Cargando métricas de la plataforma...</p>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 1. MINI WIDGETS MÉTRICAS (ESTILO IMAGEN 1 DE GOOGLE AI STUDIO) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* WIDGET 1: Total Facturado en Productos con Curva Naranja/Rosa */}
            <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[16px] p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#3d3d3d] transition-all">
              <div className="space-y-1">
                <span className="text-[12px] font-medium text-[#9aa0a6] block">
                  Vendido en productos (Año {stats?.year ?? ""})
                </span>
                <div className="text-[28px] sm:text-[32px] font-bold text-white tracking-tight tabular-nums">
                  <FormattedPrice price={resumen?.products_total ?? 0} />
                </div>
              </div>

              {/* Gráfico Sparkline Nativo SVG con Curva Suave y Punto Pulsante */}
              <div className="h-20 w-full mt-3 relative">
                <svg viewBox="0 0 560 140" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="gradient-line-hero" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ff8f42" />
                      <stop offset="100%" stopColor="#f06292" />
                    </linearGradient>
                    <linearGradient id="gradient-area-hero" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ff8f42" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#f06292" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Área debajo de la curva */}
                  {sparklineArea && <path d={sparklineArea} fill="url(#gradient-area-hero)" />}

                  {/* Línea base sutil */}
                  <line x1="0" y1="130" x2="560" y2="130" stroke="#2a2a2a" strokeWidth="1.5" strokeDasharray="3 3" />

                  {/* Curva continua suave */}
                  {sparklineOrangePink && (
                    <path
                      d={sparklineOrangePink}
                      fill="none"
                      stroke="url(#gradient-line-hero)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Puntos y Punto Final Destacado con Anillo (Estilo Imagen 1) */}
                  {linePoints.map((pt, i) => {
                    const isLast = i === linePoints.length - 1;
                    return (
                      <g key={i}>
                        {isLast ? (
                          <>
                            <circle cx={pt.x} cy={pt.y} r="6" fill="#1f1f1f" stroke="#ff8f42" strokeWidth="3" />
                            <circle cx={pt.x} cy={pt.y} r="2.5" fill="#ff8f42" />
                          </>
                        ) : (
                          <circle cx={pt.x} cy={pt.y} r="2.5" fill="#f06292" opacity="0.6" />
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* WIDGET 2: Total Órdenes con Barras Púrpuras y Línea Punteada (Estilo Imagen 1) */}
            <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[16px] p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#3d3d3d] transition-all">
              <div className="space-y-1">
                <span className="text-[12px] font-medium text-[#9aa0a6] block">
                  Total de órdenes completadas
                </span>
                <div className="text-[28px] sm:text-[32px] font-bold text-white tracking-tight tabular-nums">
                  {resumen?.orders_count ?? 0}
                </div>
              </div>

              {/* Gráfico de Barras Nativo CSS con Línea Base Punteada */}
              <div className="h-20 w-full mt-3 flex flex-col justify-end">
                {/* Barras mensuales */}
                <div className="flex items-end justify-between h-14 w-full gap-1.5 px-2">
                  {monthlyData.map((m, idx) => {
                    const maxOrders = Math.max(...monthlyData.map(d => d.orders_count), 1);
                    const heightPercent = m.orders_count > 0 ? Math.max(20, (m.orders_count / maxOrders) * 100) : 0;
                    const isCurrent = idx === monthlyData.length - 1;

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group/bar">
                        {heightPercent > 0 ? (
                          <div 
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-t-[4px] transition-all ${
                              isCurrent ? 'bg-[#7c4dff] shadow-[0_0_12px_rgba(124,77,255,0.5)]' : 'bg-[#7c4dff]/50 hover:bg-[#7c4dff]'
                            }`}
                            title={`${m.label}: ${m.orders_count} órdenes`}
                          />
                        ) : (
                          <div className="h-1 w-full bg-[#2a2a2a] rounded-full" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Línea Base Punteada estilo Google AI Studio */}
                <div className="w-full border-b border-dashed border-[#444444] mt-1.5" />
              </div>
            </div>

            {/* WIDGET 3: Ganancia Plataforma (10%) */}
            <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[16px] p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#3d3d3d] transition-all">
              <div className="space-y-1">
                <span className="text-[12px] font-medium text-[#9aa0a6] block">
                  Comisiones de la plataforma (10%)
                </span>
                <div className="text-[28px] sm:text-[32px] font-bold text-emerald-400 tracking-tight tabular-nums">
                  <FormattedPrice price={resumen?.commissions ?? 0} />
                </div>
              </div>

              {/* Mini Sparkline Verde Esmeralda */}
              <div className="h-20 w-full mt-3 relative">
                <svg viewBox="0 0 560 140" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="gradient-emerald" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Línea base */}
                  <line x1="0" y1="130" x2="560" y2="130" stroke="#2a2a2a" strokeWidth="1.5" strokeDasharray="3 3" />

                  {/* Sparkline Verde */}
                  {linePoints.length > 0 && (
                    <>
                      <path
                        d={generateSmoothPath(linePoints.map(p => ({
                          x: p.x,
                          y: 130 - (p.commissions / maxComision) * 100
                        })))}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <circle 
                        cx={linePoints[linePoints.length - 1].x} 
                        cy={130 - (linePoints[linePoints.length - 1].commissions / maxComision) * 100} 
                        r="5" 
                        fill="#1f1f1f" 
                        stroke="#10b981" 
                        strokeWidth="2.5" 
                      />
                    </>
                  )}
                </svg>
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* 2. TABLA DE LÍMITES Y CAPACIDAD (ESTILO IMAGEN 2 GOOGLE AI STUDIO) */}
          {/* ========================================================================= */}
          <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[16px] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-[14px] font-semibold text-white tracking-tight">
                    Métricas de Operación y Capacidad
                  </h4>
                  <Info className="h-3.5 w-3.5 text-[#8c8c8c]" />
                </div>
                <p className="text-[11px] text-[#8c8c8c] mt-0.5">
                  Rendimiento del marketplace en comparación con los parámetros del período
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#8c8c8c]">
                <span className="px-2 py-0.5 rounded bg-[#2a2a2a] text-[#87a9ff] font-mono text-[11px] border border-[#383838]">
                  En línea
                </span>
              </div>
            </div>

            {/* Filas de progreso estilo Google AI Studio */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="border-b border-[#2b2b2b] text-[#8c8c8c] font-medium text-[11px] uppercase tracking-wider">
                    <th className="pb-3 pr-4">Métrica</th>
                    <th className="pb-3 px-4">Categoría</th>
                    <th className="pb-3 px-4">Progreso / Volumen</th>
                    <th className="pb-3 px-4 text-right">Comisión</th>
                    <th className="pb-3 pl-4 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626] text-[#d4d4d4] font-normal text-[13px]">
                  {/* Fila 1: Artículos Vendidos */}
                  <tr className="hover:bg-[#252525]/60 transition">
                    <td className="py-3.5 pr-4 font-semibold text-white">Venta de Artículos</td>
                    <td className="py-3.5 px-4 text-[#8c8c8c]">Marketplace</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${Math.min(100, ((resumen?.products_total ?? 0) / Math.max(1, maxVenta)) * 100)}%` }} 
                            className="h-full bg-[#87a9ff] rounded-full"
                          />
                        </div>
                        <span className="text-xs text-[#8c8c8c] font-mono">
                          {formatearCompacto(resumen?.products_total ?? 0)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-emerald-400">
                      {formatearARS(resumen?.commissions ?? 0)}
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Activo
                      </span>
                    </td>
                  </tr>

                  {/* Fila 2: Logística y Envíos */}
                  <tr className="hover:bg-[#252525]/60 transition">
                    <td className="py-3.5 pr-4 font-semibold text-white">Logística & Envíos</td>
                    <td className="py-3.5 px-4 text-[#8c8c8c]">Operaciones</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${Math.min(100, ((resumen?.shipping_total ?? 0) / Math.max(1, maxVenta)) * 100)}%` }} 
                            className="h-full bg-[#f06292] rounded-full"
                          />
                        </div>
                        <span className="text-xs text-[#8c8c8c] font-mono">
                          {formatearCompacto(resumen?.shipping_total ?? 0)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-[#8c8c8c]">$0</td>
                    <td className="py-3.5 pl-4 text-right">
                      <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Correo Arg
                      </span>
                    </td>
                  </tr>

                  {/* Fila 3: Cuentas y Accesos */}
                  <tr className="hover:bg-[#252525]/60 transition">
                    <td className="py-3.5 pr-4 font-semibold text-white">Comunidad de Usuarios</td>
                    <td className="py-3.5 px-4 text-[#8c8c8c]">Cuentas</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${Math.min(100, ((adminDashboardData?.total_users ?? 0) / 100) * 100)}%` }} 
                            className="h-full bg-emerald-400 rounded-full"
                          />
                        </div>
                        <span className="text-xs text-[#8c8c8c] font-mono">
                          {adminDashboardData?.total_users ?? 0} usuarios
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-[#8c8c8c]">-</td>
                    <td className="py-3.5 pl-4 text-right">
                      <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        Registrados
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. TENDENCIAS DE USO Y RENDIMIENTO (ESTILO IMAGEN 2 GOOGLE AI STUDIO) */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-semibold text-white tracking-tight">
                Tendencias de Rendimiento Anual
              </h4>
              <span className="text-xs text-[#8c8c8c]">Año {stats?.year ?? ""}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* TARJETA 1: Gráfico de Línea con Indicador de Límite (Estilo Imagen 2 Izquierda) */}
              <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[16px] p-5 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#d4d4d4]">
                    Ventas mensuales de productos (ARS)
                  </span>
                  <Sliders className="h-3.5 w-3.5 text-[#8c8c8c]" />
                </div>

                {/* Lienzo SVG con líneas de nivel y Badge Limit */}
                <div className="relative h-48 w-full select-none">
                  {/* Badge Limit en el eje Y */}
                  <div className="absolute left-0 top-1/3 -translate-y-1/2 z-10 flex items-center gap-1">
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#ef4444] text-white rounded-[4px] uppercase tracking-wider shadow-xs">
                      Limit
                    </span>
                  </div>

                  <svg viewBox="0 0 560 180" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    {/* Líneas horizontales de referencia */}
                    <line x1="45" y1="20" x2="520" y2="20" stroke="#2b2b2b" strokeWidth="1" />
                    <text x="530" y="24" fill="#666666" fontSize="10" fontFamily="sans-serif">{formatearCompacto(maxVenta)}</text>

                    <line x1="45" y1="70" x2="520" y2="70" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="4 4" />
                    <text x="530" y="74" fill="#ef4444" fontSize="10" fontFamily="sans-serif">{formatearCompacto(maxVenta * 0.6)}</text>

                    <line x1="45" y1="120" x2="520" y2="120" stroke="#2b2b2b" strokeWidth="1" />
                    <text x="530" y="124" fill="#666666" fontSize="10" fontFamily="sans-serif">{formatearCompacto(maxVenta * 0.3)}</text>

                    <line x1="45" y1="160" x2="520" y2="160" stroke="#333333" strokeWidth="1.5" />
                    <text x="530" y="164" fill="#666666" fontSize="10" fontFamily="sans-serif">$0</text>

                    {/* Curva continua de ventas */}
                    {sparklineOrangePink && (
                      <path
                        d={sparklineOrangePink}
                        fill="none"
                        stroke="#87a9ff"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    )}

                    {/* Puntos interactivos con Tooltip */}
                    {linePoints.map((pt, i) => (
                      <g key={i} className="cursor-pointer">
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="4"
                          fill="#1f1f1f"
                          stroke="#87a9ff"
                          strokeWidth="2"
                          onMouseEnter={() => setActiveHoverPoint(pt)}
                          onMouseLeave={() => setActiveHoverPoint(null)}
                        />
                      </g>
                    ))}
                  </svg>

                  {/* Tooltip dinámico en hover */}
                  {activeHoverPoint && (
                    <div 
                      style={{ left: `${(activeHoverPoint.x / 560) * 100}%`, top: `${(activeHoverPoint.y / 180) * 100}%` }}
                      className="absolute -translate-x-1/2 -translate-y-12 bg-[#121214] border border-[#383838] px-2.5 py-1 rounded-lg text-xs font-semibold text-white shadow-xl pointer-events-none z-20 whitespace-nowrap"
                    >
                      <span className="text-[#87a9ff]">{activeHoverPoint.label}:</span> {formatearARS(activeHoverPoint.value)}
                    </div>
                  )}
                </div>

                {/* Etiquetas de meses en el eje X */}
                <div className="flex items-center justify-between text-[10px] text-[#666666] pt-1 px-4 font-mono">
                  {monthlyData.map((m, idx) => (
                    <span key={idx} className={m.products_total > 0 ? "text-[#d4d4d4] font-bold" : ""}>
                      {m.label.substring(0, 3)}
                    </span>
                  ))}
                </div>
              </div>

              {/* TARJETA 2: Gráfico de Comisiones y Órdenes (Estilo Imagen 2 Derecha) */}
              <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[16px] p-5 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#d4d4d4]">
                    Ganancia de la plataforma por mes (10%)
                  </span>
                  <Sliders className="h-3.5 w-3.5 text-[#8c8c8c]" />
                </div>

                {/* Lienzo SVG con líneas de nivel y Badge Limit */}
                <div className="relative h-48 w-full select-none">
                  {/* Badge Limit en el eje Y */}
                  <div className="absolute left-0 top-1/3 -translate-y-1/2 z-10 flex items-center gap-1">
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#ef4444] text-white rounded-[4px] uppercase tracking-wider shadow-xs">
                      Limit
                    </span>
                  </div>

                  <svg viewBox="0 0 560 180" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    <line x1="45" y1="20" x2="520" y2="20" stroke="#2b2b2b" strokeWidth="1" />
                    <text x="530" y="24" fill="#666666" fontSize="10" fontFamily="sans-serif">{formatearCompacto(maxComision)}</text>

                    <line x1="45" y1="70" x2="520" y2="70" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="4 4" />
                    <text x="530" y="74" fill="#ef4444" fontSize="10" fontFamily="sans-serif">{formatearCompacto(maxComision * 0.6)}</text>

                    <line x1="45" y1="120" x2="520" y2="120" stroke="#2b2b2b" strokeWidth="1" />
                    <text x="530" y="124" fill="#666666" fontSize="10" fontFamily="sans-serif">{formatearCompacto(maxComision * 0.3)}</text>

                    <line x1="45" y1="160" x2="520" y2="160" stroke="#333333" strokeWidth="1.5" />
                    <text x="530" y="164" fill="#666666" fontSize="10" fontFamily="sans-serif">$0</text>

                    {/* Barras de ganancia */}
                    {monthlyData.map((m, idx) => {
                      const x = 55 + idx * 38;
                      const barH = m.commissions > 0 ? (m.commissions / maxComision) * 140 : 2;
                      const y = 160 - barH;

                      return (
                        <g key={idx} className="group/bar">
                          <rect
                            x={x}
                            y={y}
                            width="20"
                            height={barH}
                            rx="3"
                            fill="#10b981"
                            opacity={m.commissions > 0 ? "0.9" : "0.2"}
                            className="hover:opacity-100 transition"
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Etiquetas de meses en el eje X */}
                <div className="flex items-center justify-between text-[10px] text-[#666666] pt-1 px-4 font-mono">
                  {monthlyData.map((m, idx) => (
                    <span key={idx} className={m.commissions > 0 ? "text-emerald-400 font-bold" : ""}>
                      {m.label.substring(0, 3)}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. FINANZAS Y GARANTÍAS */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            <h4 className="text-[14px] font-semibold text-white tracking-tight">
              Balances y Fondos del Sistema
            </h4>
            <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[16px] divide-y divide-[#262626]">
              {/* Retenido */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Retenido en Garantía</p>
                    <p className="text-[11px] text-[#8c8c8c]">Se libera a los vendedores tras 7 días de la entrega</p>
                  </div>
                </div>
                <div className="text-base sm:text-lg font-bold text-white tabular-nums">
                  <FormattedPrice price={adminDashboardData?.total_frozen_funds ?? 0} />
                </div>
              </div>

              {/* Disponible */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Disponible en Billeteras</p>
                    <p className="text-[11px] text-[#8c8c8c]">Saldo acumulado que los usuarios pueden solicitar retirar</p>
                  </div>
                </div>
                <div className="text-base sm:text-lg font-bold text-emerald-400 tabular-nums">
                  <FormattedPrice price={adminDashboardData?.total_available_funds ?? 0} />
                </div>
              </div>

              {/* Envíos */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Fondo de Envíos y Logística</p>
                    <p className="text-[11px] text-[#8c8c8c]">Recaudado para liquidaciones con la empresa postal</p>
                  </div>
                </div>
                <div className="text-base sm:text-lg font-bold text-white tabular-nums">
                  <FormattedPrice price={adminDashboardData?.total_shipping_volume ?? 0} />
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. REGISTRO DE VENTAS EN VIVO */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            <h4 className="text-[14px] font-semibold text-white tracking-tight">
              Registro de Operaciones en Vivo
            </h4>
            <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[16px] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-[#18181a] border-b border-[#2b2b2b] text-[#8c8c8c] font-medium text-[11px] uppercase tracking-wider">
                      <th className="p-4">Pedido</th>
                      <th className="p-4">Comprador</th>
                      <th className="p-4">Vendedor</th>
                      <th className="p-4">Artículo</th>
                      <th className="p-4 text-right">Total</th>
                      <th className="p-4 text-center">Estado</th>
                      <th className="p-4 text-right">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626] text-[#d4d4d4] font-normal text-[13px]">
                    {adminDashboardData?.all_sales && adminDashboardData.all_sales.length > 0 ? (
                      adminDashboardData.all_sales.map((sale) => {
                        const estado = ESTADOS_VENTA[sale.status] ?? { 
                          label: sale.status, 
                          className: "bg-[#2a2a2a] text-[#8c8c8c] border-[#383838]" 
                        };
                        return (
                          <tr key={sale.id} className="hover:bg-[#252525]/60 transition">
                            <td className="p-4 font-mono font-bold text-white">#{String(sale.id).padStart(5, "0")}</td>
                            <td className="p-4">{sale.buyer_name}</td>
                            <td className="p-4 text-[#8c8c8c]">{sale.seller_name}</td>
                            <td className="p-4 truncate max-w-[180px] text-white" title={sale.product_title}>{sale.product_title}</td>
                            <td className="p-4 text-right font-bold text-white tabular-nums">
                              <FormattedPrice price={sale.total_price} />
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-medium border ${estado.className}`}>
                                {estado.label}
                              </span>
                            </td>
                            <td className="p-4 text-[#8c8c8c] text-right whitespace-nowrap">
                              {new Date(sale.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-[#8c8c8c]">
                          No se registran ventas para el período seleccionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 6. GESTIÓN RÁPIDA DE ROLES */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            <h4 className="text-[14px] font-semibold text-white tracking-tight">
              Asignación Rápida de Roles
            </h4>
            <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[16px] p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#87a9ff]/10 text-[#87a9ff] border border-[#87a9ff]/20 flex-shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="text-xs text-[#8c8c8c] leading-relaxed">
                  Asigná rangos de acceso administrativo o moderación a cualquier cuenta registrada ingresando su correo electrónico.
                </p>
              </div>

              {msgAsignar && (
                <div className={`p-3 rounded-xl text-xs font-semibold border ${
                  msgAsignar.tipo === 'exito' 
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                    : 'bg-red-500/10 text-red-300 border-red-500/30'
                }`}>
                  {msgAsignar.texto}
                </div>
              )}

              <form onSubmit={handleAsignarRango} className="flex flex-col md:flex-row gap-3">
                <input
                  type="email"
                  required
                  placeholder="usuario@vamaar.com"
                  value={emailAsignar}
                  onChange={(e) => setEmailAsignar(e.target.value)}
                  style={{ color: '#ffffff', backgroundColor: '#18181a', caretColor: '#ffffff' }}
                  className="flex-grow px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white placeholder:text-[#666666] focus:outline-none focus:border-[#87a9ff] transition"
                />
                <div className="relative md:w-48">
                  <select
                    value={rolAsignar}
                    onChange={(e) => setRolAsignar(e.target.value)}
                    style={{ color: '#ffffff', backgroundColor: '#18181a' }}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff] cursor-pointer appearance-none pr-9 transition font-medium"
                  >
                    <option value="admin" className="bg-[#1e1e1e] text-white">Administrador</option>
                    <option value="moderator" className="bg-[#1e1e1e] text-white">Moderador</option>
                    <option value="client" className="bg-[#1e1e1e] text-white">Cliente Común</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <ChevronDown className="h-3.5 w-3.5 text-[#8c8c8c]" />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={cargandoAsignar}
                  className="px-5 py-2 bg-[#87a9ff] hover:bg-[#a5b4fc] text-[#121214] rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {cargandoAsignar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Asignar Rango"}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
