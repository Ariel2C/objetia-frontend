"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, FileText, Printer, Shield, Calendar, AlertCircle } from 'lucide-react';
import { getApiUrl } from '../../lib/config';
import { getToken } from '../../lib/api';
import { formatearTituloProducto } from '../../lib/format';

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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
        ⚠️ Error: {error}
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl shadow-sm">
        <TrendingUp className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <h4 className="text-sm font-bold text-gray-700">No has realizado ventas</h4>
        <p className="text-xs text-gray-400 mt-1">Cuando publiques un producto y lo compren, la información de despacho aparecerá acá.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Mis Ventas</h3>
        <p className="text-xs text-gray-500">Historial transaccional de ventas y gestión logística de despachos.</p>
      </div>

      <div className="space-y-4">
        {sales.map((venta) => (
          <div 
            key={venta.id}
            className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col md:flex-row md:items-center justify-between gap-5"
          >
            {/* Foto e Información del Producto */}
            <div className="flex items-center gap-4 flex-grow min-w-0">
              {venta.image_url ? (
                <img 
                  src={venta.image_url} 
                  alt={formatearTituloProducto(venta.product_title)} 
                  className="h-16 w-16 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                />
              ) : (
                <div className="h-16 w-16 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 flex-shrink-0">
                  <TrendingUp className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-wider mb-1.5 inline-block">
                  Venta #{venta.id}
                </span>
                <h4 className="font-bold text-gray-800 text-sm truncate leading-snug">
                  {formatearTituloProducto(venta.product_title)}
                </h4>
                <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(venta.created_at).toLocaleDateString()}
                  </span>
                  <span className="font-bold text-gray-700">
                    Cobrado: {formatearARS(venta.product_price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Impresión de Etiqueta / Logística Correo Argentino */}
            <div className="flex flex-col md:items-end gap-2.5 flex-shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-gray-50">
              <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                <span className={`h-2 w-2 rounded-full ${(ESTADOS_ORDEN[venta.status] || ESTADOS_ORDEN.pending_payment).dot}`} />
                <span className={`font-bold ${(ESTADOS_ORDEN[venta.status] || ESTADOS_ORDEN.pending_payment).color}`}>
                  {(ESTADOS_ORDEN[venta.status] || { label: venta.status }).label}
                </span>
              </div>
              
              {venta.tracking_number ? (
                <div className="space-y-2 w-full md:text-right">
                  <div className="text-[10px] text-gray-400">
                    Código de Seguimiento: <span className="font-mono font-bold text-gray-600">{venta.tracking_number}</span>
                  </div>
                  {venta.shipment_status && ESTADOS_ENVIO[venta.shipment_status] && (
                    <div className="flex md:justify-end">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        ["DELIVERED", "ARRIVED"].includes(venta.shipment_status)
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : venta.shipment_status === "LABEL_GENERATED"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : "bg-indigo-50 text-indigo-700 border-indigo-100"
                      }`}>
                        Envío: {ESTADOS_ENVIO[venta.shipment_status]}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row md:justify-end gap-2">
                    <button 
                      onClick={() => handleImprimirEtiqueta(venta)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-[11px] font-bold transition justify-center cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Imprimir Etiqueta</span>
                    </button>
                    <Link
                      href={`/shipping/tracking?number=${venta.tracking_number}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-[11px] font-bold transition justify-center"
                    >
                      Seguir Envío
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Pendiente de guía</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
