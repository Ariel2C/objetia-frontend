"use client";
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Truck, Calendar, ExternalLink, ShieldCheck, DollarSign, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';
import { getApiUrl } from '../../lib/config';
import { formatearTituloProducto } from '../../lib/format';

const formatearARS = (val: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

const ESTADOS_COMPRA: Record<string, { label: string; className: string }> = {
  pending_payment: { label: "Pago pendiente", className: "text-amber-700" },
  paid: { label: "Pago asegurado (Escrow)", className: "text-emerald-700" },
  shipped: { label: "En camino", className: "text-blue-700" },
  delivered: { label: "Entregado", className: "text-emerald-700" },
  cancelled: { label: "Cancelada", className: "text-red-700" },
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

  if (purchases.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-[#dadce0] rounded-2xl shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center mx-auto mb-3">
          <ShoppingBag className="h-6 w-6 stroke-[1.8]" />
        </div>
        <h4 className="text-sm font-bold text-[#202124]">No has realizado compras</h4>
        <p className="text-xs text-[#5f6368] mt-1 max-w-sm mx-auto">Cuando compres algún artículo exclusivo, verás el estado de tu pedido y el seguimiento acá.</p>
        <Link href="/catalog" className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-[#1a73e8] text-white rounded-xl text-xs font-semibold hover:bg-[#1557b0] transition shadow-2xs">
          Explorar catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {purchases.map((compra) => (
        <div 
          key={compra.id}
          className="bg-white border border-[#dadce0] rounded-2xl p-5 sm:p-6 shadow-xs hover:border-[#bdc1c6] hover:shadow-sm transition duration-200 flex flex-col md:flex-row md:items-center justify-between gap-5"
        >
          {/* Foto e Información del Producto */}
          <div className="flex items-center gap-4 flex-grow min-w-0">
            {compra.image_url ? (
              <img 
                src={compra.image_url} 
                alt={formatearTituloProducto(compra.product_title)} 
                className="h-16 w-16 rounded-xl object-cover border border-[#dadce0] flex-shrink-0"
              />
            ) : (
              <div className="h-16 w-16 bg-[#f8f9fa] border border-[#dadce0] rounded-xl flex items-center justify-center text-[#5f6368] flex-shrink-0">
                <ShoppingBag className="h-6 w-6" />
              </div>
            )}
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#137333] bg-[#e6f4ea] px-2 py-0.5 rounded-full border border-[#ceead6] uppercase tracking-wider mb-1.5 inline-block">
                Compra #{compra.id}
              </span>
              <h4 className="font-bold text-[#202124] text-sm truncate leading-snug">
                {formatearTituloProducto(compra.product_title)}
              </h4>
              <div className="flex items-center gap-4 mt-1.5 text-[11px] text-[#5f6368]">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(compra.created_at).toLocaleDateString()}
                </span>
                <span className="font-bold text-[#202124]">
                  Total: {formatearARS(compra.total_price)}
                </span>
              </div>
            </div>
          </div>

          {/* Información Logística / Tracking Correo Argentino */}
          <div className="flex flex-col md:items-end gap-2.5 flex-shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-[#f1f3f4]">
            <div className="flex items-center gap-2">
              {compra.status === 'cancelled' ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : compra.status === 'pending_payment' ? (
                <Clock className="h-4 w-4 text-amber-500" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-[#137333]" />
              )}
              <span className={`text-xs font-bold ${(ESTADOS_COMPRA[compra.status] || { className: 'text-[#3c4043]' }).className}`}>
                {(ESTADOS_COMPRA[compra.status] || { label: compra.status }).label}
              </span>
            </div>
            
            {compra.tracking_number ? (
              <div className="space-y-2 w-full md:text-right">
                <div className="flex items-center md:justify-end gap-1.5 text-xs text-[#3c4043] font-medium">
                  <Truck className="h-3.5 w-3.5 text-[#1a73e8]" />
                  <span>Correo Argentino: </span>
                  <span className="font-bold text-[#202124] font-mono">{compra.tracking_number}</span>
                </div>
                {compra.shipment_status && ESTADOS_ENVIO[compra.shipment_status] && (
                  <div className="flex md:justify-end">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      ["DELIVERED", "ARRIVED"].includes(compra.shipment_status)
                        ? "bg-[#e6f4ea] text-[#137333] border-[#ceead6]"
                        : compra.shipment_status === "LABEL_GENERATED"
                          ? "bg-[#fef7e0] text-[#b06000] border-[#feefc3]"
                          : "bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc]"
                    }`}>
                      {ESTADOS_ENVIO[compra.shipment_status]}
                    </span>
                  </div>
                )}
                <Link 
                  href={`/shipping/tracking?number=${compra.tracking_number}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc]/60 rounded-xl text-xs font-semibold transition w-full justify-center md:w-auto border border-[#d2e3fc]"
                >
                  <span>Seguir Envío</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            ) : compra.status === 'pending_payment' ? (
              <span className="text-xs text-amber-700 font-semibold bg-[#fef7e0] px-2.5 py-1 rounded-xl border border-[#feefc3]">
                Esperando confirmación del pago
              </span>
            ) : compra.status === 'cancelled' ? (
              <span className="text-xs text-red-700 font-semibold bg-red-50 px-2.5 py-1 rounded-xl border border-red-200">
                Compra cancelada
              </span>
            ) : (
              <span className="text-xs text-[#5f6368] font-semibold bg-[#f1f3f4] px-2.5 py-1 rounded-xl border border-[#dadce0]">
                Procesando logística...
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
