"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  Printer, 
  Calendar, 
  AlertCircle, 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Package, 
  Loader2, 
  ShoppingBag
} from 'lucide-react';
import { getApiUrl } from '../../lib/config';
import { getToken } from '../../lib/api';
import { formatearTituloProducto } from '../../lib/format';
import TrackingModal from './TrackingModal';

const formatearARS = (val: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

const ESTADOS_ORDEN: Record<string, { label: string; color: string; dot: string }> = {
  pending_payment: { label: "Pago pendiente", color: "text-amber-700", dot: "bg-amber-500" },
  paid: { label: "Pago acreditado", color: "text-emerald-700", dot: "bg-emerald-500" },
  shipped: { label: "Despachado", color: "text-blue-700", dot: "bg-blue-500" },
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

interface SaleItem {
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
  recipient_name?: string | null;
  street?: string | null;
  number?: string | null;
  floor_dept?: string | null;
  postal_code?: string | null;
  city?: string | null;
  province?: string | null;
}

interface SalesTabProps {
  token: string | null;
}

export default function SalesTab({ token }: SalesTabProps) {
  const [sales, setSales] = useState<SaleItem[]>([]);
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
    productImage?: string | null;
    orderId?: number | string | null;
  }>({
    isOpen: false,
    trackingNumber: null,
    productTitle: null,
    productImage: null,
    orderId: null,
  });

  const fetchSales = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiUrl()}/orders/sales/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('vamaar_token') || token}`
        }
      });
      if (!res.ok) throw new Error("No se pudo obtener el historial de ventas.");
      const data = await res.json();
      setSales(data);
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [token]);

  // Imprime la etiqueta REAL generada por el backend (con los datos del envío).
  // Si el backend no está disponible, cae al render local con los datos de la venta.
  const handleImprimirEtiqueta = async (sale: SaleItem) => {
    if (sale.tracking_number) {
      try {
        const res = await fetch(`${getApiUrl()}/orders/label/${sale.tracking_number}`, {
          headers: { 'Authorization': `Bearer ${getToken() || token || ''}` }
        });
        if (res.ok) {
          const html = await res.text();
          const printWindow = window.open("", "_blank");
          if (!printWindow) return;
          printWindow.document.write(html);
          printWindow.document.close();
          return;
        }
      } catch (e) {
        console.error("No se pudo obtener la etiqueta del servidor:", e);
      }
    }
    handleSimularImpresionEtiqueta(sale);
  };

  const handleSimularImpresionEtiqueta = (sale: SaleItem) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Etiqueta de Envío - Correo Argentino</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
              padding: 20px; 
              background-color: #fff;
              color: #000; 
            }
            .label-card { 
              width: 380px; 
              border: 2px solid #000; 
              border-radius: 12px;
              padding: 18px; 
              margin: auto; 
              box-sizing: border-box;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              border-bottom: 2px solid #000; 
              padding-bottom: 8px; 
            }
            .brand-name {
              font-weight: 800;
              font-size: 13px;
              color: #111;
            }
            .marketplace-name {
              font-weight: 900;
              font-size: 12px;
              color: #555;
              border-bottom: 1.5px solid #000;
            }
            .recipient-info {
              margin-top: 14px;
              font-size: 12px;
              line-height: 1.4;
            }
            .recipient-label {
              font-weight: 800;
              font-size: 13px;
              margin-bottom: 4px;
            }
            .recipient-details {
              font-weight: 500;
            }
            .barcode-box { 
              margin-top: 18px; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center;
            }
            .barcode-bars {
              width: 100%;
              height: 55px;
              background: repeating-linear-gradient(90deg, #000, #000 3px, #fff 3px, #fff 8px);
            }
            .barcode-text { 
              font-family: "Courier New", Courier, monospace; 
              font-size: 14px; 
              font-weight: 900; 
              letter-spacing: 2px;
              margin-top: 6px;
            }
            .footer {
              margin-top: 18px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            .correo-logo {
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .correo-circle {
              width: 18px;
              height: 18px;
              border-radius: 50%;
              border: 2px solid #003366;
              position: relative;
            }
            .correo-circle::after {
              content: "";
              position: absolute;
              top: 7px;
              left: 4px;
              width: 12px;
              height: 2px;
              background-color: #003366;
            }
            .correo-text {
              font-size: 10px;
              font-weight: 900;
              color: #003366;
              line-height: 1;
            }
            .qr-mock {
              width: 45px;
              height: 45px;
              background-color: #eee;
              border: 1px solid #ccc;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 2px;
              padding: 3px;
              box-sizing: border-box;
            }
            .qr-block {
              background-color: #000;
            }
            .meta-info {
              font-size: 9px;
              color: #777;
              margin-top: 12px;
              text-align: left;
              line-height: 1.3;
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="header">
              <span class="brand-name">🛋️ Vamaar Muebles</span>
              <span class="marketplace-name">vamaar</span>
            </div>
            
            <div class="recipient-info">
              <div class="recipient-label">Para:</div>
              <div class="recipient-details">
                <strong>${sale.recipient_name || "Comprador Vamaar"}</strong><br>
                ${sale.street || "Calle Falsa"} ${sale.number || "123"}${sale.floor_dept ? `, ${sale.floor_dept}` : ""}<br>
                ${sale.city || "Ciudad"}, ${sale.province || "Provincia"}, ${sale.postal_code || ""}
              </div>
            </div>
            
            <div class="barcode-box">
              <div class="barcode-bars"></div>
              <div class="barcode-text">${sale.tracking_number}</div>
            </div>
            
            <div class="footer">
              <div class="correo-logo">
                <div class="correo-circle"></div>
                <div class="correo-text">Correo<br>Argentino</div>
              </div>
              
              <div class="qr-mock">
                <div class="qr-block"></div>
                <div></div>
                <div class="qr-block"></div>
                <div class="qr-block"></div>
                <div class="qr-block"></div>
                <div></div>
                <div></div>
                <div class="qr-block"></div>
                <div class="qr-block"></div>
              </div>
            </div>
            
            <div class="meta-info">
              Etiqueta generada<br>
              ${new Date(sale.created_at).toLocaleDateString()} - ${new Date(sale.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} por Vamaar
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Contadores para badges de filtro
  const todasCount = sales.length;
  const porDespacharCount = sales.filter(v => ['pending_payment', 'paid'].includes(v.status) && !v.tracking_number).length;
  const enCaminoCount = sales.filter(v => v.status === 'shipped' || (v.tracking_number && v.shipment_status !== 'DELIVERED')).length;
  const entregadasCount = sales.filter(v => v.status === 'delivered' || v.shipment_status === 'DELIVERED').length;

  // Filtrado por búsqueda y categoría
  const ventasFiltradas = useMemo(() => {
    let list = sales;

    // Filtro por estado
    if (filtroEstado === 'pending') {
      list = list.filter(v => ['pending_payment', 'paid'].includes(v.status) && !v.tracking_number);
    } else if (filtroEstado === 'shipped') {
      list = list.filter(v => v.status === 'shipped' || (v.tracking_number && v.shipment_status !== 'DELIVERED'));
    } else if (filtroEstado === 'delivered') {
      list = list.filter(v => v.status === 'delivered' || v.shipment_status === 'DELIVERED');
    }

    // Filtro por texto de búsqueda
    const q = busqueda.trim().toLowerCase();
    if (!q) return list;

    return list.filter(v => {
      const matchTitulo = (v.product_title || '').toLowerCase().includes(q);
      const matchId = v.id.toString().includes(q) || `#${v.id}`.includes(q);
      const matchGuia = (v.tracking_number || '').toLowerCase().includes(q);
      const matchComprador = (v.recipient_name || '').toLowerCase().includes(q);
      const matchCiudad = (v.city || '').toLowerCase().includes(q);
      const matchProvincia = (v.province || '').toLowerCase().includes(q);
      return matchTitulo || matchId || matchGuia || matchComprador || matchCiudad || matchProvincia;
    });
  }, [sales, busqueda, filtroEstado]);

  // Paginación
  const totalPaginas = Math.ceil(ventasFiltradas.length / elementosPorPagina) || 1;

  const ventasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * elementosPorPagina;
    return ventasFiltradas.slice(inicio, inicio + elementosPorPagina);
  }, [ventasFiltradas, paginaActual, elementosPorPagina]);

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
      {/* Tarjeta Contenedora Principal (Estilo Direcciones de Entrega en Mi Perfil) */}
      <div className="bg-white border border-[#edf0f2] rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs w-full">
        {/* Cabecera con Título, Subtítulo y Buscador a Nivel del Título */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#edf0f2] pb-3">
          <div>
            <h4 className="text-[14px] font-semibold text-[#202124]">
              Gestión de ventas
            </h4>
            <p className="text-[11px] text-[#5f6368]">
              Seguimiento de pedidos cobrados, estado de envíos e impresión de etiquetas
            </p>
          </div>

          {/* Buscador a la derecha a nivel del título */}
          <div className="relative w-full md:w-72 lg:w-80 flex-shrink-0">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b] pointer-events-none" />
            <input
              type="text"
              value={busqueda}
              onChange={handleBusquedaChange}
              placeholder="Buscar por producto, #orden, guía o comprador..."
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

          {/* Badge: Por despachar */}
          <button
            type="button"
            onClick={() => cambiarFiltro('pending')}
            className={`px-3 h-[30px] rounded-[8px] text-[12px] font-medium transition flex items-center gap-1.5 cursor-pointer border whitespace-nowrap ${
              filtroEstado === 'pending'
                ? 'bg-[#202124] border-[#202124] text-white shadow-xs'
                : 'bg-white border-[#e8eaed] text-[#3c4043] hover:bg-[#f8f9fa] hover:text-[#202124] hover:border-[#dadce0]'
            }`}
          >
            <span>Por despachar</span>
            <span className={`px-1.5 py-0.2 rounded text-[10.5px] font-mono font-semibold ${
              filtroEstado === 'pending' ? 'bg-white/20 text-white' : 'bg-[#f1f3f4] text-[#5f6368]'
            }`}>
              {porDespacharCount}
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

        {/* Contenido: Estado de carga, errores o lista de ventas */}
        {loading ? (
          <div className="p-12 text-center text-[#5f6368] flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#1a73e8]" />
            <span className="text-xs">Cargando tus ventas...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold">
            ⚠️ Error: {error}
          </div>
        ) : sales.length === 0 ? (
          /* Estado vacío general */
          <div className="p-8 sm:p-12 rounded-2xl border border-dashed border-[#dadce0] bg-[#f8f9fa] text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h5 className="text-sm font-bold text-[#202124]">Aún no has realizado ventas</h5>
              <p className="text-xs text-[#5f6368] max-w-md mx-auto">
                Cuando publiques tus productos y los compradores concreten compras, acá vas a gestionar los despachos, imprimir etiquetas y seguir el envío.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('vamaar:open-vender-modal'))}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#202124] hover:bg-[#000000] text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              Publicar un Producto
            </button>
          </div>
        ) : ventasFiltradas.length === 0 ? (
          /* Estado sin resultados para la búsqueda actual */
          <div className="p-8 rounded-2xl border border-dashed border-[#dadce0] bg-[#f8f9fa] text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#f1f3f4] text-[#5f6368] flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#202124]">No encontramos ventas que coincidan</p>
              <p className="text-xs text-[#5f6368]">
                Probá buscando con otro término, número de venta o limpiando el buscador.
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
          /* Lista de Tarjetas de Ventas (Estilo Direcciones de Entrega) */
          <div className="space-y-3">
            {ventasPaginadas.map((venta) => (
              <div
                key={venta.id}
                className="p-4 sm:p-5 rounded-2xl border border-[#edf0f2] bg-[#f8f9fa] hover:border-[#dadce0] hover:bg-white transition-all shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Foto e Información Principal */}
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  {/* Miniatura del producto */}
                  {venta.image_url ? (
                    <img
                      src={venta.image_url}
                      alt={formatearTituloProducto(venta.product_title)}
                      className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover border border-[#e8eaed] bg-white flex-shrink-0 shadow-2xs"
                    />
                  ) : (
                    <div className="h-16 w-16 sm:h-20 sm:w-20 bg-white border border-[#e8eaed] rounded-xl flex items-center justify-center text-[#80868b] flex-shrink-0">
                      <Package className="h-7 w-7" />
                    </div>
                  )}

                  {/* Datos del producto y del comprador */}
                  <div className="space-y-1 min-w-0 flex-1">
                    {/* Badges de estado superior */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-[#1a73e8] bg-[#e8f0fe] px-2 py-0.5 rounded-full border border-[#d2e3fc] uppercase tracking-wider">
                        Venta #{venta.id}
                      </span>

                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-[#e8eaed]">
                        <span className={`h-1.5 w-1.5 rounded-full ${(ESTADOS_ORDEN[venta.status] || ESTADOS_ORDEN.pending_payment).dot}`} />
                        <span className={(ESTADOS_ORDEN[venta.status] || ESTADOS_ORDEN.pending_payment).color}>
                          {(ESTADOS_ORDEN[venta.status] || { label: venta.status }).label}
                        </span>
                      </span>

                      <span className="text-[11px] text-[#5f6368] flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(venta.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Título de la publicación */}
                    <h5 className="text-sm font-bold text-[#202124] truncate leading-tight">
                      {formatearTituloProducto(venta.product_title)}
                    </h5>

                    {/* Domicilio de entrega (Estilo tarjeta de direcciones de entrega) */}
                    {(venta.recipient_name || venta.street || venta.city) && (
                      <div className="flex items-center gap-1.5 text-xs text-[#3c4043] flex-wrap">
                        <MapPin className="h-3.5 w-3.5 text-[#1a73e8] flex-shrink-0" />
                        <span className="font-semibold text-[#202124]">
                          {venta.recipient_name || "Comprador"}
                        </span>
                        <span className="text-[#5f6368]">·</span>
                        <span className="text-[#5f6368]">
                          {[
                            venta.street ? `${venta.street} ${venta.number || ''}`.trim() : null,
                            venta.floor_dept ? `(${venta.floor_dept})` : null,
                            venta.city,
                            venta.province
                          ].filter(Boolean).join(', ')}
                          {venta.postal_code && (
                            <span className="font-mono ml-1">· CP {venta.postal_code}</span>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Monto cobrado */}
                    <div className="text-xs pt-0.5">
                      <span className="text-[#5f6368]">Cobrado: </span>
                      <span className="font-mono font-bold text-[#00a650]">
                        {formatearARS(venta.product_price)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lado Derecho: Logística Correo Argentino y Botones */}
                <div className="flex flex-col sm:flex-row lg:flex-col lg:items-end justify-between sm:items-center gap-2.5 flex-shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-[#e8eaed]">
                  {venta.tracking_number ? (
                    <div className="space-y-1.5 w-full sm:w-auto lg:text-right">
                      <div className="text-[11px] text-[#5f6368]">
                        Guía Correo:{" "}
                        <button
                          type="button"
                          onClick={() => setTrackingModalData({
                            isOpen: true,
                            trackingNumber: venta.tracking_number,
                            productTitle: formatearTituloProducto(venta.product_title),
                            productImage: venta.image_url || null,
                            orderId: venta.id
                          })}
                          className="font-mono font-bold text-[#202124] bg-white px-2 py-0.5 rounded border border-[#e8eaed] hover:border-[#202124] transition cursor-pointer"
                          title="Hacé clic para ver el seguimiento del paquete"
                        >
                          {venta.tracking_number}
                        </button>
                      </div>

                      {venta.shipment_status && ESTADOS_ENVIO[venta.shipment_status] && (
                        <div className="flex lg:justify-end">
                          <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${
                            ["DELIVERED", "ARRIVED"].includes(venta.shipment_status)
                              ? "bg-[#e8f8ef] text-[#00a650] border-[#ceead6]"
                              : venta.shipment_status === "LABEL_GENERATED"
                                ? "bg-[#fef7e0] text-[#b06000] border-[#feefc3]"
                                : "bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc]"
                          }`}>
                            Envío: {ESTADOS_ENVIO[venta.shipment_status]}
                          </span>
                        </div>
                      )}

                      {/* Botones de acción alineados */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleImprimirEtiqueta(venta)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#202124] hover:bg-[#000000] text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
                          title="Imprimir etiqueta de Correo Argentino"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>Imprimir Etiqueta</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTrackingModalData({
                            isOpen: true,
                            trackingNumber: venta.tracking_number,
                            productTitle: formatearTituloProducto(venta.product_title),
                            productImage: venta.image_url || null,
                            orderId: venta.id
                          })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#202124] hover:bg-[#f1f3f4] border border-[#dadce0] rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer"
                          title="Ver seguimiento de envío"
                        >
                          <Package className="h-3.5 w-3.5 text-[#1a73e8]" />
                          <span>Seguir Envío</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold bg-[#fef7e0] px-3 py-1.5 rounded-xl border border-[#feefc3]">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span>Pendiente de guía de envío</span>
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
              Mostrando {Math.min((paginaActual - 1) * elementosPorPagina + 1, ventasFiltradas.length)} a {Math.min(paginaActual * elementosPorPagina, ventasFiltradas.length)} de {ventasFiltradas.length} ventas
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
        productImage={trackingModalData.productImage}
        orderId={trackingModalData.orderId}
      />
    </div>
  );
}
