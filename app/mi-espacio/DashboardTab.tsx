"use client";
import React, { useState, useEffect } from 'react';
import { Loader2, Users, TrendingUp, AlertTriangle, Truck, Percent, Lock, Wallet, ShieldCheck, ChevronDown, ShoppingBag, Receipt, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
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

// Formato compacto para ejes de gráficos: $48 mil, $1,2 M
const formatearCompacto = (val: number) => {
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} M`;
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toLocaleString('es-AR', { maximumFractionDigits: 0 })} mil`;
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
  paid: { label: "Pagado", className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  pending_payment: { label: "Pendiente", className: "bg-amber-50 text-amber-700 border-amber-100" },
  shipped: { label: "Enviado", className: "bg-blue-50 text-blue-700 border-blue-100" },
  delivered: { label: "Entregado", className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  cancelled: { label: "Cancelado", className: "bg-red-50 text-red-600 border-red-100" },
};

// Fila de métrica: etiqueta a la izquierda, valor a la derecha.
// Este formato apilado soporta importes largos sin romper el layout.
function MetricRow({
  icon: Icon,
  iconClass,
  label,
  description,
  value,
}: {
  icon: React.ElementType;
  iconClass: string;
  label: string;
  description?: string;
  value: React.ReactNode;
}) {
  return (
    <div className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
      <div className={`flex-shrink-0 p-2.5 rounded-xl ${iconClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-grow">
        <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">{label}</p>
        {description && <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{description}</p>}
      </div>
      <div className="flex-shrink-0 text-right text-lg sm:text-xl font-black text-gray-900 tabular-nums">
        {value}
      </div>
    </div>
  );
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

  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Panel de Control</h3>
        <p className="text-xs text-gray-500 mt-0.5">Estado general del marketplace de un vistazo.</p>
      </div>

      {cargandoDashboard ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Rendimiento por período */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-gray-400" /> Rendimiento
              </h4>
              {/* Selector de año */}
              <div className="relative">
                <select
                  value={stats?.year ?? ""}
                  onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
                  disabled={cargandoStats || !stats}
                  className="pl-3 pr-9 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-800 focus:outline-none focus:border-[#4F46E5] cursor-pointer appearance-none transition"
                >
                  {(stats?.years ?? []).map((y) => (
                    <option key={y} value={y}>Año {y}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                  {cargandoStats ? <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Tarjeta hero: vendido en productos del período */}
              <div className="lg:col-span-2 bg-gray-950 text-white rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between gap-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" /> Vendido en productos · {stats?.year ?? ""}
                  </p>
                  <div className="text-4xl sm:text-5xl font-black tracking-tight mt-2 break-all tabular-nums">
                    <FormattedPrice price={resumen?.products_total ?? 0} />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    Solo artículos, sin costos de envío. Incluye órdenes pagadas, despachadas y entregadas.
                  </p>
                </div>
                <div className="border-t border-white/10 pt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Percent className="h-3.5 w-3.5" /> Ganancia de la plataforma (10%)
                  </p>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums text-right">
                    <FormattedPrice price={resumen?.commissions ?? 0} />
                  </div>
                </div>
              </div>

              {/* Indicadores del período */}
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5 text-indigo-500" /> Ventas del año
                  </p>
                  <div className="text-3xl font-black text-gray-900 mt-1.5 tabular-nums">
                    {resumen?.orders_count ?? 0}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">órdenes concretadas</p>
                </div>
                <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5 text-emerald-500" /> Ticket promedio
                  </p>
                  <div className="text-2xl font-black text-gray-900 mt-1.5 tabular-nums">
                    <FormattedPrice price={resumen?.avg_ticket ?? 0} showCents={false} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">por artículo vendido</p>
                </div>
              </div>
            </div>

            {/* Gráfico: evolución mensual */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Evolución mensual · {stats?.year ?? ""}</h5>
                  <p className="text-[10px] text-gray-400 mt-0.5">Vendido en productos (sin envío) y ganancia de la plataforma por mes.</p>
                </div>
              </div>
              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={stats?.monthly ?? []} margin={{ top: 5, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9CA3AF", fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="ventas" tickFormatter={formatearCompacto} tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={70} />
                    <YAxis yAxisId="ganancia" orientation="right" tickFormatter={formatearCompacto} tick={{ fontSize: 10, fill: "#34D399" }} axisLine={false} tickLine={false} width={64} />
                    <Tooltip
                      formatter={(value: any, name: any) => [formatearARS(Number(value)), name]}
                      labelFormatter={(label) => `Mes: ${label}`}
                      contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12, fontWeight: 600 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                    <Bar yAxisId="ventas" dataKey="products_total" name="Vendido (sin envío)" fill="#111827" radius={[6, 6, 0, 0]} maxBarSize={34} />
                    <Bar yAxisId="ventas" dataKey="shipping_total" name="Envíos" fill="#D1D5DB" radius={[6, 6, 0, 0]} maxBarSize={34} />
                    <Line yAxisId="ganancia" type="monotone" dataKey="commissions" name="Ganancia (10%)" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              {/* Histórico total, chico y al pie */}
              <p className="text-[10px] text-gray-400 mt-3 border-t border-gray-50 pt-3">
                Histórico total: <strong className="text-gray-600">{formatearARS(stats?.all_time.products_total ?? 0)}</strong> vendido en productos ·{" "}
                <strong className="text-emerald-600">{formatearARS(stats?.all_time.commissions ?? 0)}</strong> de ganancia ·{" "}
                <strong className="text-gray-600">{stats?.all_time.orders_count ?? 0}</strong> órdenes desde el inicio.
              </p>
            </div>
          </section>

          {/* Indicadores generales de la plataforma */}
          <section className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-blue-500" /> Usuarios
              </p>
              <div className="text-3xl font-black text-gray-900 mt-1.5 tabular-nums">
                {adminDashboardData?.total_users ?? 0}
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">cuentas registradas</p>
            </div>
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className={`h-3.5 w-3.5 ${moderacionesPendientes > 0 ? "text-rose-500" : "text-gray-300"}`} /> Moderaciones
              </p>
              <div className={`text-3xl font-black mt-1.5 tabular-nums ${moderacionesPendientes > 0 ? "text-rose-600" : "text-gray-900"}`}>
                {moderacionesPendientes}
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">pendientes de revisión</p>
            </div>
          </section>

          {/* Finanzas: filas apiladas, una debajo de la otra */}
          <section className="space-y-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Finanzas</h4>
            <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm divide-y divide-gray-100">
              <MetricRow
                icon={Lock}
                iconClass="bg-amber-50 text-amber-600"
                label="Retenido en garantía"
                description="Se libera al vendedor 7 días después de la venta."
                value={<FormattedPrice price={adminDashboardData?.total_frozen_funds ?? 0} />}
              />
              <MetricRow
                icon={Wallet}
                iconClass="bg-emerald-50 text-emerald-600"
                label="Disponible en billeteras"
                description="Saldo que los vendedores pueden retirar."
                value={<FormattedPrice price={adminDashboardData?.total_available_funds ?? 0} />}
              />
              <MetricRow
                icon={Truck}
                iconClass="bg-orange-50 text-orange-600"
                label="Fondo de envíos"
                description="Recaudado para pagarle a Correo Argentino."
                value={<FormattedPrice price={adminDashboardData?.total_shipping_volume ?? 0} />}
              />
            </div>
          </section>

          {/* Ventas */}
          <section className="space-y-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Registro de ventas</h4>
            <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="p-4">Pedido</th>
                      <th className="p-4">Comprador</th>
                      <th className="p-4">Vendedor</th>
                      <th className="p-4">Artículo</th>
                      <th className="p-4 text-right">Total</th>
                      <th className="p-4 text-center">Estado</th>
                      <th className="p-4">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                    {adminDashboardData?.all_sales && adminDashboardData.all_sales.length > 0 ? (
                      adminDashboardData.all_sales.map((sale) => {
                        const estado = ESTADOS_VENTA[sale.status] ?? { label: sale.status, className: "bg-gray-50 text-gray-600 border-gray-100" };
                        return (
                          <tr key={sale.id} className="hover:bg-gray-50/60 transition">
                            <td className="p-4 font-mono font-bold text-gray-900">#{String(sale.id).padStart(5, "0")}</td>
                            <td className="p-4">{sale.buyer_name}</td>
                            <td className="p-4">{sale.seller_name}</td>
                            <td className="p-4 truncate max-w-[180px]" title={sale.product_title}>{sale.product_title}</td>
                            <td className="p-4 text-right font-bold text-gray-900">
                              <FormattedPrice price={sale.total_price} />
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${estado.className}`}>
                                {estado.label}
                              </span>
                            </td>
                            <td className="p-4 text-gray-400 whitespace-nowrap">{new Date(sale.created_at).toLocaleDateString()}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-10 text-center text-gray-400 font-semibold">
                          Todavía no hay ventas registradas en el marketplace.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Métricas Visuales y Rendimiento Real del Marketplace */}
          {(() => {
            const totalVentasRegistradas = adminDashboardData?.all_sales ? adminDashboardData.all_sales.length : 0;
            const ventasCompletadas = adminDashboardData?.all_sales ? adminDashboardData.all_sales.filter(s => s.status === 'paid' || s.status === 'delivered' || s.status === 'shipped').length : 0;
            const tasaEfectivaVentas = totalVentasRegistradas > 0 ? ((ventasCompletadas / totalVentasRegistradas) * 100).toFixed(1) : "0.0";
            const ticketPromedio = stats?.totals_year?.avg_ticket ?? 0;
            const ordenesPeriodo = stats?.totals_year?.orders_count ?? 0;

            return (
              <section className="space-y-3">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" /> Analíticas de Rendimiento en Tiempo Real
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Tasa Real de Efectividad en Ventas */}
                  <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tasa Real de Concreción</span>
                    <div className="text-2xl font-black text-purple-900">{tasaEfectivaVentas}%</div>
                    <p className="text-[10px] text-gray-400">
                      {ventasCompletadas} de {totalVentasRegistradas} órdenes pagadas o entregadas
                    </p>
                  </div>

                  {/* Ticket Promedio Real */}
                  <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Ticket Promedio por Venta</span>
                    <div className="text-2xl font-black text-emerald-600">
                      <FormattedPrice price={ticketPromedio} showCents={false} />
                    </div>
                    <p className="text-[10px] text-gray-400">Calculado sobre {ordenesPeriodo} operaciones del año</p>
                  </div>

                  {/* Volumen de Transacciones */}
                  <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Órdenes Procesadas</span>
                    <div className="text-2xl font-black text-blue-600">{totalVentasRegistradas} registros</div>
                    <p className="text-[10px] text-gray-400">Transacciones reales en base de datos</p>
                  </div>

                </div>
              </section>
            );
          })()}
        </>
      )}

      {/* Gestión de roles */}
      <section className="space-y-3">
        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Gestión de roles</h4>
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Asigná permisos de administrador o moderador a cualquier cuenta registrada ingresando su correo.
            </p>
          </div>

          {msgAsignar && (
            <div className={`p-3.5 rounded-xl text-xs font-bold border ${
              msgAsignar.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
            }`}>
              {msgAsignar.texto}
            </div>
          )}

          <form onSubmit={handleAsignarRango} className="flex flex-col md:flex-row gap-3">
            <input
              type="email"
              required
              placeholder="correo-usuario@vamaar.com"
              value={emailAsignar}
              onChange={(e) => setEmailAsignar(e.target.value)}
              className="flex-grow px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] text-slate-800 bg-white transition"
            />
            <div className="relative md:w-48">
              <select
                value={rolAsignar}
                onChange={(e) => setRolAsignar(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] font-semibold text-slate-700 bg-white cursor-pointer appearance-none pr-10 transition"
              >
                <option value="admin">Administrador</option>
                <option value="moderator">Moderador</option>
                <option value="client">Cliente Común</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            <button
              type="submit"
              disabled={cargandoAsignar}
              className="px-6 py-2.5 bg-[#4F46E5] hover:bg-[#4F46E5]/90 text-white rounded-lg text-sm font-semibold transition shadow-sm cursor-pointer disabled:opacity-50 active:scale-98"
            >
              {cargandoAsignar ? "Asignando..." : "Asignar"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
