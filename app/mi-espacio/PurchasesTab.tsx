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
      <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl shadow-sm">
        <ShoppingBag className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <h4 className="text-sm font-bold text-gray-700">No has realizado compras</h4>
        <p className="text-xs text-gray-400 mt-1">Cuando compres algún artículo exclusivo, verás el estado de tu pedido acá.</p>
        <Link href="/catalog" className="inline-block mt-4 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition">
          Explorar catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Mis Compras</h3>
        <p className="text-xs text-gray-500">Historial transaccional y seguimiento logístico de tus pedidos.</p>
      </div>

      <div className="space-y-4">
        {purchases.map((compra) => (
          <div 
            key={compra.id}
            className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col md:flex-row md:items-center justify-between gap-5"
          >
            {/* Foto e Información del Producto */}
            <div className="flex items-center gap-4 flex-grow min-w-0">
              {compra.image_url ? (
                <img 
                  src={compra.image_url} 
                  alt={formatearTituloProducto(compra.product_title)} 
                  className="h-16 w-16 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                />
              ) : (
                <div className="h-16 w-16 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 flex-shrink-0">
                  <ShoppingBag className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider mb-1.5 inline-block">
                  Compra #{compra.id}
                </span>
                <h4 className="font-bold text-gray-800 text-sm truncate leading-snug">
                  {formatearTituloProducto(compra.product_title)}
                </h4>
                <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(compra.created_at).toLocaleDateString()}
                  </span>
                  <span className="font-bold text-gray-700">
                    Total: {formatearARS(compra.total_price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Información Logística / Tracking Correo Argentino */}
            <div className="flex flex-col md:items-end gap-2.5 flex-shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-gray-50">
              <div className="flex items-center gap-2">
                {compra.status === 'cancelled' ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : compra.status === 'pending_payment' ? (
                  <Clock className="h-4 w-4 text-amber-500" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                )}
                <span className={`text-xs font-bold ${(ESTADOS_COMPRA[compra.status] || { className: 'text-gray-700' }).className}`}>
                  {(ESTADOS_COMPRA[compra.status] || { label: compra.status }).label}
                </span>
              </div>
              
              {compra.tracking_number ? (
                <div className="space-y-2 w-full md:text-right">
                  <div className="flex items-center md:justify-end gap-1.5 text-xs text-gray-600 font-medium">
                    <Truck className="h-3.5 w-3.5 text-blue-500" />
                    <span>Correo Argentino: </span>
                    <span className="font-bold text-gray-800 font-mono">{compra.tracking_number}</span>
                  </div>
                  {compra.shipment_status && ESTADOS_ENVIO[compra.shipment_status] && (
                    <div className="flex md:justify-end">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        ["DELIVERED", "ARRIVED"].includes(compra.shipment_status)
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : compra.shipment_status === "LABEL_GENERATED"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : "bg-indigo-50 text-indigo-700 border-indigo-100"
                      }`}>
                        {ESTADOS_ENVIO[compra.shipment_status]}
                      </span>
                    </div>
                  )}
                  <Link 
                    href={`/shipping/tracking?number=${compra.tracking_number}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-[11px] font-bold transition w-full justify-center md:w-auto"
                  >
                    <span>Seguir Envío</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              ) : compra.status === 'pending_payment' ? (
                <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                  Esperando confirmación del pago
                </span>
              ) : compra.status === 'cancelled' ? (
                <span className="text-xs text-red-600 font-bold bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                  Compra cancelada
                </span>
              ) : (
                <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                  Procesando logística...
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
