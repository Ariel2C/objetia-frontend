"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  Truck, 
  Calendar, 
  ExternalLink, 
  ShieldCheck, 
  DollarSign, 
  Clock, 
  XCircle,
  Package,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { getApiUrl } from '../../lib/config';
import { formatearTituloProducto } from '../../lib/format';
import TrackingModal from './TrackingModal';

const formatearARS = (val: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

const ESTADOS_COMPRA: Record<string, { label: string; color: string; dot: string }> = {
  pending_payment: { label: "Pago pendiente", color: "text-amber-700", dot: "bg-amber-500" },
  paid: { label: "Pago asegurado (Escrow)", color: "text-emerald-700", dot: "bg-emerald-500" },
  shipped: { label: "En camino", color: "text-blue-700", dot: "bg-blue-500" },
  delivered: { label: "Entregado", color: "text-emerald-700", dot: "bg-emerald-600" },
  cancelled: { label: "Cancelada", color: "text-red-700", dot: "bg-red-500" },
};

// Estados del envío en la red de Correo Argentino (ShipmentStatus del backend)
const ESTADOS_ENVIO: Record<string, string> = {
  LABEL_GENERATED: "En preparación",
  DISPATCHED: "Despachado",
  IN_TRANSIT: "En viaje",
  OUT_FOR_DELIVERY: "En reparto",
  DELIVERED: "Entregado",
  ARRIVED: "Entregado",
};

interface PurchaseItem {
  id: number;
  product_id: number;
  product_title: string;
  product_price: number;
  total_price: number;
  shipping_cost: number;
  status: string;
  image_url: string;
  created_at: string;
  tracking_number: string | null;
  shipment_status: string | null;
  shipping_label_url: string | null;
}

interface PurchasesTabProps {
  token: string | null;
}

export default function PurchasesTab({ token }: PurchasesTabProps) {
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para búsqueda, filtros y paginación
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'all' | 'pending' | 'shipped' | 'delivered'>('all');
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 5;

  // Estado del modal de seguimiento en tiempo real
  const [trackingModalData, setTrackingModalData] = useState<{
    isOpen: boolean;
    trackingNumber: string | null;
    productTitle?: string | null;
    orderId?: number | string | null;
  }>({
    isOpen: false,
    trackingNumber: null,
    productTitle: null,
    orderId: null,
  });

  const fetchPurchases = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiUrl()}/orders/purchases/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('vamaar_token') || token}`
        }
      });
      if (!res.ok) throw new Error("No se pudo obtener el historial de compras.");
      const data = await res.json();
      setPurchases(data);
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [token]);

  // Contadores para badges de filtro
  const todasCount = purchases.length;
  const enPreparacionCount = purchases.filter(c => ['pending_payment', 'paid'].includes(c.status) && !c.tracking_number).length;
  const enCaminoCount = purchases.filter(c => c.status === 'shipped' || (c.tracking_number && c.shipment_status !== 'DELIVERED')).length;
  const entregadasCount = purchases.filter(c => c.status === 'delivered' || c.shipment_status === 'DELIVERED').length;

  // Filtrado por búsqueda y categoría
  const comprasFiltradas = useMemo(() => {
    let list = purchases;

    // Filtro por estado
    if (filtroEstado === 'pending') {
      list = list.filter(c => ['pending_payment', 'paid'].includes(c.status) && !c.tracking_number);
    } else if (filtroEstado === 'shipped') {
      list = list.filter(c => c.status === 'shipped' || (c.tracking_number && c.shipment_status !== 'DELIVERED'));
    } else if (filtroEstado === 'delivered') {
      list = list.filter(c => c.status === 'delivered' || c.shipment_status === 'DELIVERED');
    }

    // Filtro por texto de búsqueda
    const q = busqueda.trim().toLowerCase();
    if (!q) return list;

    return list.filter(c => {
      const matchTitulo = (c.product_title || '').toLowerCase().includes(q);
      const matchId = c.id.toString().includes(q) || `#${c.id}`.includes(q);
      const matchGuia = (c.tracking_number || '').toLowerCase().includes(q);
      return matchTitulo || matchId || matchGuia;
    });
  }, [purchases, busqueda, filtroEstado]);

  // Paginación
  const totalPaginas = Math.ceil(comprasFiltradas.length / elementosPorPagina) || 1;

  const comprasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * elementosPorPagina;
    return comprasFiltradas.slice(inicio, inicio + elementosPorPagina);
  }, [comprasFiltradas, paginaActual, elementosPorPagina]);

  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
    setPaginaActual(1);
  };

  const cambiarFiltro = (filtro: 'all' | 'pending' | 'shipped' | 'delivered') => {
    setFiltroEstado(filtro);
    setPaginaActual(1);
  };

  return (
    <div className="animate-fade-in select-none w-full">
      {/* Tarjeta Contenedora Principal (Estilo Direcciones de Entrega y Ventas) */}
      <div className="bg-white border border-[#edf0f2] rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs w-full">
        {/* Cabecera con Título, Subtítulo y Buscador a Nivel del Título */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#edf0f2] pb-3">
          <div>
            <h4 className="text-[14px] font-semibold text-[#202124]">
              Gestión de compras
            </h4>
            <p className="text-[11px] text-[#5f6368]">
              Seguimiento de pedidos, estados de entrega y comprobantes
            </p>
          </div>

          {/* Buscador a la derecha a nivel del título */}
          <div className="relative w-full md:w-72 lg:w-80 flex-shrink-0">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b] pointer-events-none" />
            <input
              type="text"
              value={busqueda}
              onChange={handleBusquedaChange}
              placeholder="Buscar por producto, #orden o guía..."
              className="w-full pl-9 pr-8 h-[36px] text-xs rounded-xl border border-[#e8eaed] bg-[#f8f9fa] text-[#202124] placeholder-[#80868b] focus:outline-none focus:border-[#202124] focus:bg-white transition"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => { setBusqueda(''); setPaginaActual(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#80868b] hover:text-[#202124] p-0.5 cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Fila de Filtros "Agrupa por" */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-[#5f6368] mr-1">
            Agrupa por:
          </span>

          {/* Badge: Todas */}
          <button
            type="button"
            onClick={() => cambiarFiltro('all')}
            className={`px-3 h-[30px] rounded-[8px] text-[12px] font-medium transition flex items-center gap-1.5 cursor-pointer border whitespace-nowrap ${
              filtroEstado === 'all'
                ? 'bg-[#202124] border-[#202124] text-white shadow-xs'
                : 'bg-white border-[#e8eaed] text-[#3c4043] hover:bg-[#f8f9fa] hover:text-[#202124] hover:border-[#dadce0]'
            }`}
          >
            <span>Todas</span>
            <span className={`px-1.5 py-0.2 rounded text-[10.5px] font-mono font-semibold ${
              filtroEstado === 'all' ? 'bg-white/20 text-white' : 'bg-[#f1f3f4] text-[#5f6368]'
            }`}>
              {todasCount}
            </span>
          </button>

          {/* Badge: En preparación */}
          <button
            type="button"
            onClick={() => cambiarFiltro('pending')}
            className={`px-3 h-[30px] rounded-[8px] text-[12px] font-medium transition flex items-center gap-1.5 cursor-pointer border whitespace-nowrap ${
              filtroEstado === 'pending'
                ? 'bg-[#202124] border-[#202124] text-white shadow-xs'
                : 'bg-white border-[#e8eaed] text-[#3c4043] hover:bg-[#f8f9fa] hover:text-[#202124] hover:border-[#dadce0]'
            }`}
          >
            <span>En preparación</span>
            <span className={`px-1.5 py-0.2 rounded text-[10.5px] font-mono font-semibold ${
              filtroEstado === 'pending' ? 'bg-white/20 text-white' : 'bg-[#f1f3f4] text-[#5f6368]'
            }`}>
              {enPreparacionCount}
            </span>
          </button>

          {/* Badge: En camino */}
          <button
            type="button"
            onClick={() => cambiarFiltro('shipped')}
            className={`px-3 h-[30px] rounded-[8px] text-[12px] font-medium transition flex items-center gap-1.5 cursor-pointer border whitespace-nowrap ${
              filtroEstado === 'shipped'
                ? 'bg-[#202124] border-[#202124] text-white shadow-xs'
                : 'bg-white border-[#e8eaed] text-[#3c4043] hover:bg-[#f8f9fa] hover:text-[#202124] hover:border-[#dadce0]'
            }`}
          >
            <span>En camino</span>
            <span className={`px-1.5 py-0.2 rounded text-[10.5px] font-mono font-semibold ${
              filtroEstado === 'shipped' ? 'bg-white/20 text-white' : 'bg-[#f1f3f4] text-[#5f6368]'
            }`}>
              {enCaminoCount}
            </span>
          </button>

          {/* Badge: Entregadas */}
          <button
            type="button"
            onClick={() => cambiarFiltro('delivered')}
            className={`px-3 h-[30px] rounded-[8px] text-[12px] font-medium transition flex items-center gap-1.5 cursor-pointer border whitespace-nowrap ${
              filtroEstado === 'delivered'
                ? 'bg-[#202124] border-[#202124] text-white shadow-xs'
                : 'bg-white border-[#e8eaed] text-[#3c4043] hover:bg-[#f8f9fa] hover:text-[#202124] hover:border-[#dadce0]'
            }`}
          >
            <span>Entregadas</span>
            <span className={`px-1.5 py-0.2 rounded text-[10.5px] font-mono font-semibold ${
              filtroEstado === 'delivered' ? 'bg-white/20 text-white' : 'bg-[#f1f3f4] text-[#5f6368]'
            }`}>
              {entregadasCount}
            </span>
          </button>
        </div>

        {/* Contenido: Carga, errores o lista de compras */}
        {loading ? (
          <div className="p-12 text-center text-[#5f6368] flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#1a73e8]" />
            <span className="text-xs">Cargando tus compras...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold">
            ⚠️ Error: {error}
          </div>
        ) : purchases.length === 0 ? (
          /* Estado vacío general */
          <div className="p-8 sm:p-12 rounded-2xl border border-dashed border-[#dadce0] bg-[#f8f9fa] text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div className="space-y-1">
              <h5 className="text-sm font-bold text-[#202124]">No has realizado compras aún</h5>
              <p className="text-xs text-[#5f6368] max-w-md mx-auto">
                Cuando compres algún artículo exclusivo de la plataforma, verás el estado de tu pedido, guía de Correo y el seguimiento en tiempo real acá.
              </p>
            </div>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#202124] hover:bg-[#000000] text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              Explorar catálogo
            </Link>
          </div>
        ) : comprasFiltradas.length === 0 ? (
          /* Estado sin resultados para la búsqueda actual */
          <div className="p-8 rounded-2xl border border-dashed border-[#dadce0] bg-[#f8f9fa] text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#f1f3f4] text-[#5f6368] flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#202124]">No encontramos compras que coincidan</p>
              <p className="text-xs text-[#5f6368]">
                Probá buscando con otro término, número de orden o limpiando el buscador.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setBusqueda(''); setFiltroEstado('all'); setPaginaActual(1); }}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#202124] bg-white border border-[#dadce0] hover:bg-[#f1f3f4] transition cursor-pointer shadow-2xs"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          /* Lista de Tarjetas de Compras (Estilo Direcciones de Entrega y Ventas) */
          <div className="space-y-3">
            {comprasPaginadas.map((compra) => (
              <div
                key={compra.id}
                className="p-4 sm:p-5 rounded-2xl border border-[#edf0f2] bg-[#f8f9fa] hover:border-[#dadce0] hover:bg-white transition-all shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Foto e Información Principal */}
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  {/* Miniatura del producto */}
                  {compra.image_url ? (
                    <img
                      src={compra.image_url}
                      alt={formatearTituloProducto(compra.product_title)}
                      className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover border border-[#e8eaed] bg-white flex-shrink-0 shadow-2xs"
                    />
                  ) : (
                    <div className="h-16 w-16 sm:h-20 sm:w-20 bg-white border border-[#e8eaed] rounded-xl flex items-center justify-center text-[#80868b] flex-shrink-0">
                      <ShoppingBag className="h-7 w-7" />
                    </div>
                  )}

                  {/* Datos del producto y estado */}
                  <div className="space-y-1 min-w-0 flex-1">
                    {/* Badges de estado superior */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-[#137333] bg-[#e6f4ea] px-2 py-0.5 rounded-full border border-[#ceead6] uppercase tracking-wider">
                        Compra #{compra.id}
                      </span>

                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-[#e8eaed]">
                        <span className={`h-1.5 w-1.5 rounded-full ${(ESTADOS_COMPRA[compra.status] || { dot: 'bg-gray-400' }).dot}`} />
                        <span className={(ESTADOS_COMPRA[compra.status] || { color: 'text-[#3c4043]' }).color}>
                          {(ESTADOS_COMPRA[compra.status] || { label: compra.status }).label}
                        </span>
                      </span>

                      <span className="text-[11px] text-[#5f6368] flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(compra.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Título de la publicación */}
                    <h5 className="text-sm font-bold text-[#202124] truncate leading-tight">
                      {formatearTituloProducto(compra.product_title)}
                    </h5>

                    {/* Garantía de protección al comprador */}
                    <div className="flex items-center gap-1.5 text-xs text-[#5f6368]">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#137333] flex-shrink-0" />
                      <span>Protegido con Garantía Objetia (7 días)</span>
                    </div>

                    {/* Total pagado */}
                    <div className="text-xs pt-0.5">
                      <span className="text-[#5f6368]">Total pagado: </span>
                      <span className="font-mono font-bold text-[#202124]">
                        {formatearARS(compra.total_price)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lado Derecho: Estado del Envío, Guía y Acciones */}
                <div className="flex flex-col sm:flex-row lg:flex-col lg:items-end justify-between sm:items-center gap-2.5 flex-shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-[#e8eaed]">
                  {compra.tracking_number ? (
                    <div className="space-y-1.5 w-full sm:w-auto lg:text-right">
                      <div className="flex items-center lg:justify-end gap-1.5 text-[11px] text-[#5f6368]">
                        <Truck className="h-3.5 w-3.5 text-[#1a73e8]" />
                        <span>Correo Argentino:</span>
                        <button
                          type="button"
                          onClick={() => setTrackingModalData({
                            isOpen: true,
                            trackingNumber: compra.tracking_number,
                            productTitle: formatearTituloProducto(compra.product_title),
                            orderId: compra.id
                          })}
                          className="font-mono font-bold text-[#202124] bg-white px-2 py-0.5 rounded border border-[#e8eaed] hover:border-[#202124] transition cursor-pointer"
                          title="Hacé clic para ver el seguimiento del paquete"
                        >
                          {compra.tracking_number}
                        </button>
                      </div>

                      {compra.shipment_status && ESTADOS_ENVIO[compra.shipment_status] && (
                        <div className="flex lg:justify-end">
                          <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${
                            ["DELIVERED", "ARRIVED"].includes(compra.shipment_status)
                              ? "bg-[#e8f8ef] text-[#00a650] border-[#ceead6]"
                              : compra.shipment_status === "LABEL_GENERATED"
                                ? "bg-[#fef7e0] text-[#b06000] border-[#feefc3]"
                                : "bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc]"
                          }`}>
                            Envío: {ESTADOS_ENVIO[compra.shipment_status]}
                          </span>
                        </div>
                      )}

                      {/* Botón de seguimiento con modal */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setTrackingModalData({
                            isOpen: true,
                            trackingNumber: compra.tracking_number,
                            productTitle: formatearTituloProducto(compra.product_title),
                            orderId: compra.id
                          })}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#202124] hover:bg-[#000000] text-white rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer"
                          title="Ver seguimiento del paquete en tiempo real"
                        >
                          <Package className="h-3.5 w-3.5" />
                          <span>Seguir Envío</span>
                        </button>
                      </div>
                    </div>
                  ) : compra.status === 'pending_payment' ? (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold bg-[#fef7e0] px-3 py-1.5 rounded-xl border border-[#feefc3]">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span>Esperando confirmación del pago</span>
                    </div>
                  ) : compra.status === 'cancelled' ? (
                    <div className="flex items-center gap-1.5 text-xs text-red-700 font-semibold bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Compra cancelada</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-[#5f6368] font-semibold bg-white px-3 py-1.5 rounded-xl border border-[#dadce0]">
                      <Package className="h-4 w-4 text-[#80868b]" />
                      <span>Vendedor preparando el paquete</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación estilo Google AI Studio */}
        {totalPaginas > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#f1f3f4]">
            <span className="text-xs text-[#5f6368]">
              Mostrando {Math.min((paginaActual - 1) * elementosPorPagina + 1, comprasFiltradas.length)} a {Math.min(paginaActual * elementosPorPagina, comprasFiltradas.length)} de {comprasFiltradas.length} compras
            </span>

            <div className="flex items-center gap-1 self-center sm:self-auto">
              <button
                type="button"
                onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                disabled={paginaActual === 1}
                className="p-1.5 rounded-lg border border-[#e8eaed] text-[#5f6368] hover:bg-[#f8f9fa] hover:text-[#202124] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
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
                        ? 'bg-[#202124] text-white'
                        : 'text-[#5f6368] hover:bg-[#f8f9fa] hover:text-[#202124]'
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
                className="p-1.5 rounded-lg border border-[#e8eaed] text-[#5f6368] hover:bg-[#f8f9fa] hover:text-[#202124] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                title="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Seguimiento de Envío (Estilo Google AI Studio Light) */}
      <TrackingModal
        isOpen={trackingModalData.isOpen}
        onClose={() => setTrackingModalData(prev => ({ ...prev, isOpen: false }))}
        trackingNumber={trackingModalData.trackingNumber}
        productTitle={trackingModalData.productTitle}
        orderId={trackingModalData.orderId}
      />
    </div>
  );
}
