"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, Truck, Search, Loader2, Package, Warehouse, Bike, Home } from 'lucide-react';
import Link from 'next/link';
import { getApiUrl } from '../../../lib/config';
import { getToken } from '../../../lib/api';

interface TimelineStep {
  code: string;
  title: string;
  description: string | null;
  location: string | null;
  date: string | null;
  done: boolean;
  current: boolean;
}

interface TrackingData {
  number: string;
  orderId: string;
  storeName: string;
  date: string;
  total: string;
  status: string;
  recipient_name?: string;
  street?: string;
  number_addr?: string;
  floor_dept?: string;
  postal_code?: string;
  city?: string;
  province?: string;
  timeline: TimelineStep[];
}

const ICONOS_PASO: Record<string, React.ComponentType<{ className?: string }>> = {
  CONFIRMED: Check,
  LABEL_GENERATED: Package,
  DISPATCHED: Warehouse,
  IN_TRANSIT: Truck,
  OUT_FOR_DELIVERY: Bike,
  DELIVERED: Home,
};

const formatearFecha = (iso: string | null) => {
  if (!iso) return null;
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return null;
  return `${fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })} - ${fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs`;
};

function TrackingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const trackingNumberParam = searchParams.get('number') || "";

  const [inputNumber, setInputNumber] = useState(trackingNumberParam);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);

  const fetchTrackingData = async (num: string) => {
    if (!num.trim()) return;
    setCargando(true);
    setErrorMsg(null);
    try {
      const authToken = getToken();
      if (!authToken) {
        setErrorMsg("Iniciá sesión para consultar el seguimiento de tu envío.");
        setTrackingData(null);
        setCargando(false);
        return;
      }
      // El seguimiento requiere sesión: solo el comprador o el vendedor pueden verlo
      const res = await fetch(`${getApiUrl()}/orders/tracking/?number=${num.toUpperCase().trim()}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTrackingData({
          number: data.number,
          orderId: data.order_id,
          storeName: data.store_name,
          date: data.date,
          total: data.total,
          status: data.status,
          recipient_name: data.recipient_name,
          street: data.street,
          number_addr: data.number_addr,
          floor_dept: data.floor_dept,
          postal_code: data.postal_code,
          city: data.city,
          province: data.province,
          timeline: data.timeline || []
        });
      } else {
        const errData = await res.json();
        setErrorMsg(errData.detail || "Guía de envío no encontrada en el sistema.");
        setTrackingData(null);
      }
    } catch (e) {
      setErrorMsg("Error de conexión al servidor de logística.");
      setTrackingData(null);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (trackingNumberParam) {
      fetchTrackingData(trackingNumberParam);
    }
  }, [trackingNumberParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNumber.trim()) return;
    router.push(`/shipping/tracking?number=${inputNumber.toUpperCase().trim()}`);
    fetchTrackingData(inputNumber);
  };

  const entregado = trackingData?.status === 'Entregado';

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-800 pb-12 font-sans select-none">
      {/* Botón de Retorno */}
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <Link href="/mi-objetia" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition">
          <ArrowLeft className="h-4 w-4" /> Volver a Mi Objetia
        </Link>
      </div>

      <main className="max-w-4xl mx-auto px-6 mt-4 space-y-6">
        {/* Buscador de Envíos */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Código de seguimiento</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Ej: CP123456789AR" 
              value={inputNumber}
              onChange={(e) => setInputNumber(e.target.value)}
              className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#4F46E5] font-mono font-bold"
            />
            <button 
              type="submit"
              disabled={cargando}
              className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm transition cursor-pointer flex items-center gap-1"
            >
              {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar
            </button>
          </form>
        </div>

        {errorMsg && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        {cargando && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {!cargando && trackingData && (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6 animate-fade-in">
            
            {/* Header: Pedido / Estado */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-black text-gray-900 tracking-tight">Pedido {trackingData.orderId}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    entregado ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    trackingData.status === 'En preparación' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  }`}>
                    {trackingData.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 font-medium">
                  <span>Tienda: <strong className="text-gray-600">{trackingData.storeName}</strong></span>
                  <span>Fecha: <strong className="text-gray-600">{trackingData.date}</strong></span>
                  <span>Total: <strong className="text-gray-600">{trackingData.total}</strong></span>
                </div>
              </div>
            </div>

            {/* Dos Columnas: Timeline vs Tarjetas de Info */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Columna Izquierda: Timeline estilo MercadoLibre */}
              <div className="md:col-span-6">
                <div className="relative pl-9 space-y-7 before:absolute before:left-[13px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                  {trackingData.timeline.map((step) => {
                    const Icono = ICONOS_PASO[step.code] || Check;
                    const fecha = formatearFecha(step.date);
                    return (
                      <div key={step.code} className="relative">
                        {/* Icono del Paso */}
                        <span className={`absolute -left-[36px] top-0 h-7 w-7 rounded-full flex items-center justify-center border transition-all ${
                          step.current
                            ? 'bg-[#4338CA] border-[#4338CA] text-white shadow-md scale-110'
                            : step.done
                              ? 'bg-[#5B8872] border-[#5B8872] text-white'
                              : 'bg-white border-gray-200 text-gray-300'
                        }`}>
                          <Icono className="h-3.5 w-3.5" />
                        </span>

                        {/* Texto del Paso */}
                        <div className="space-y-0.5">
                          <h4 className={`text-xs font-black tracking-tight ${
                            step.current ? 'text-[#4338CA]' : step.done ? 'text-gray-800' : 'text-gray-400'
                          }`}>
                            {step.title}
                          </h4>
                          {step.done && step.description && (
                            <p className="text-[11px] text-gray-500 leading-snug">{step.description}</p>
                          )}
                          <span className="text-[10px] text-gray-400 font-medium block">
                            {step.done
                              ? `${fecha || ""}${fecha && step.location ? " · " : ""}${step.location || ""}`
                              : "Pendiente"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Columna Derecha: Tarjetas de Información */}
              <div className="md:col-span-6 space-y-4">
                {/* Tarjeta de Envío */}
                <div className="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-5 space-y-3">
                  <div>
                    <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Envío</h4>
                    <p className="text-xs font-bold text-gray-800 mt-1">Correo Argentino</p>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Código de seguimiento</h5>
                    <p className="text-base font-black text-gray-900 font-mono tracking-wider mt-0.5">{trackingData.number}</p>
                  </div>
                </div>

                {/* Tarjeta de Dirección de Entrega */}
                <div className="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-5 space-y-2">
                  <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Dirección de entrega</h4>
                  <div className="text-xs text-gray-700 leading-relaxed font-semibold">
                    <p className="font-bold text-gray-900">{trackingData.recipient_name || "Comprador Vamaar"}</p>
                    <p className="mt-0.5">{trackingData.street || "Calle"} {trackingData.number_addr || ""}{trackingData.floor_dept ? `, ${trackingData.floor_dept}` : ""}</p>
                    <p>{trackingData.city || ""}, {trackingData.province || ""}{trackingData.postal_code ? `, ${trackingData.postal_code}` : ""}</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}
      </main>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TrackingContent />
    </Suspense>
  );
}
