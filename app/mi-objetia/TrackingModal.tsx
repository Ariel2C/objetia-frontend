"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Truck,
  Package,
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  Copy,
  RotateCw,
  Home,
  Bike,
  Warehouse,
  ShieldCheck,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

export interface TimelineStep {
  code: string;
  title: string;
  description: string | null;
  location: string | null;
  date: string | null;
  done: boolean;
  current: boolean;
}

export interface TrackingData {
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

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackingNumber: string | null;
  productTitle?: string | null;
  orderId?: number | string | null;
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
  return `${fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })} · ${fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs`;
};

export default function TrackingModal({
  isOpen,
  onClose,
  trackingNumber,
  productTitle,
  orderId
}: TrackingModalProps) {
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [copiado, setCopiado] = useState(false);

  const fetchTracking = useCallback(async (num: string) => {
    if (!num.trim()) return;
    setCargando(true);
    setErrorMsg(null);
    try {
      const data = await apiFetch<any>(`/orders/tracking/?number=${encodeURIComponent(num.toUpperCase().trim())}`);
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
    } catch (err: any) {
      setErrorMsg(err.detail || err.message || "No se pudo obtener la información de seguimiento de este paquete.");
      setTrackingData(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && trackingNumber) {
      fetchTracking(trackingNumber);
    } else {
      setTrackingData(null);
      setErrorMsg(null);
    }
  }, [isOpen, trackingNumber, fetchTracking]);

  // Manejador tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopiarGuia = () => {
    if (!trackingNumber) return;
    navigator.clipboard.writeText(trackingNumber);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  if (!isOpen) return null;

  const esEntregado = trackingData?.status === 'Entregado' || trackingData?.timeline?.some(t => t.code === 'DELIVERED' && t.done);
  const esEnCamino = trackingData?.status === 'En camino' || trackingData?.timeline?.some(t => ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DISPATCHED'].includes(t.code) && t.done);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
      <div 
        className="bg-white rounded-2xl border border-[#dadce0] shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================================================================= */}
        {/* CABECERA ESTILO GOOGLE AI STUDIO LIGHT */}
        {/* ================================================================= */}
        <div className="px-5 py-4 border-b border-[#edf0f2] flex items-center justify-between gap-3 bg-white">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#1a73e8] bg-[#e8f0fe] px-2.5 py-0.5 rounded-full border border-[#d2e3fc] inline-flex items-center gap-1.5">
                <Truck className="h-3 w-3" /> Correo Argentino
              </span>
              {orderId && (
                <span className="text-[11px] font-mono text-[#5f6368]">
                  Orden #{orderId}
                </span>
              )}
            </div>
            <h3 className="text-[15px] font-semibold text-[#202124] truncate">
              Seguimiento del paquete
            </h3>
            {productTitle && (
              <p className="text-[11px] text-[#5f6368] truncate max-w-sm sm:max-w-md">
                {productTitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {trackingNumber && (
              <button
                type="button"
                onClick={() => fetchTracking(trackingNumber)}
                disabled={cargando}
                className="p-2 text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] rounded-xl transition cursor-pointer disabled:opacity-40"
                title="Actualizar estado"
              >
                <RotateCw className={`h-4 w-4 ${cargando ? 'animate-spin text-[#1a73e8]' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] rounded-xl transition cursor-pointer"
              title="Cerrar ventana (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* BARRA DE GUÍA Y COPIAR */}
        {/* ================================================================= */}
        <div className="bg-[#f8f9fa] px-5 py-2.5 border-b border-[#edf0f2] flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[#5f6368] font-medium">Nº de Guía:</span>
            <span className="font-mono font-bold text-[#202124] bg-white px-2.5 py-0.5 rounded-lg border border-[#dadce0] tracking-wider truncate">
              {trackingNumber || "—"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopiarGuia}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition border cursor-pointer ${
              copiado
                ? 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]'
                : 'bg-white text-[#3c4043] border-[#dadce0] hover:bg-[#f1f3f4] hover:text-[#202124]'
            }`}
          >
            {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiado ? "¡Copiado!" : "Copiar guía"}</span>
          </button>
        </div>

        {/* ================================================================= */}
        {/* CONTENIDO DEL SEGUIMIENTO (SCROLLABLE) */}
        {/* ================================================================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {cargando && !trackingData ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#1a73e8] mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#202124]">Consultando servidor logístico...</p>
                <p className="text-[11px] text-[#5f6368]">Obteniendo los últimos movimientos de Correo Argentino</p>
              </div>
            </div>
          ) : errorMsg ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="text-xs font-semibold">No se pudo cargar el seguimiento</span>
              </div>
              <p className="text-xs text-red-600 pl-6">{errorMsg}</p>
            </div>
          ) : trackingData ? (
            <>
              {/* Tarjeta de Resumen de Estado Principal */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                esEntregado
                  ? 'bg-[#e8f8ef] border-[#ceead6] text-[#0f5132]'
                  : esEnCamino
                    ? 'bg-[#e8f0fe] border-[#d2e3fc] text-[#1a73e8]'
                    : 'bg-[#fef7e0] border-[#feefc3] text-[#8a5300]'
              }`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    esEntregado
                      ? 'bg-[#137333] text-white'
                      : esEnCamino
                        ? 'bg-[#1a73e8] text-white'
                        : 'bg-[#b06000] text-white'
                  }`}>
                    {esEntregado ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : esEnCamino ? (
                      <Truck className="w-5 h-5" />
                    ) : (
                      <Package className="w-5 h-5" />
                    )}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
                      Estado actual
                    </span>
                    <h4 className="text-sm font-bold truncate">
                      {trackingData.status || "En proceso logístico"}
                    </h4>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 hidden sm:block">
                  <span className="text-[10px] text-[#5f6368] block">Fecha de compra</span>
                  <span className="text-xs font-mono font-semibold text-[#202124]">
                    {trackingData.date}
                  </span>
                </div>
              </div>

              {/* Timeline de Pasos (Estilo Google AI Studio Light) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-semibold text-[#202124]">
                    Historial de eventos del Correo
                  </h5>
                  <span className="text-[10.5px] text-[#5f6368]">
                    {trackingData.timeline.filter(t => t.done).length} de {trackingData.timeline.length} etapas
                  </span>
                </div>

                <div className="relative pl-7 space-y-6 before:absolute before:left-[11px] before:top-2.5 before:bottom-2.5 before:w-[2px] before:bg-[#e8eaed]">
                  {trackingData.timeline.map((step) => {
                    const Icono = ICONOS_PASO[step.code] || Check;
                    const fecha = formatearFecha(step.date);

                    return (
                      <div key={step.code} className="relative">
                        {/* Nodo de estado */}
                        <span
                          className={`absolute -left-[27px] top-0.5 h-6 w-6 rounded-full flex items-center justify-center border transition-all ${
                            step.current
                              ? 'bg-[#1a73e8] border-[#1a73e8] text-white shadow-xs ring-4 ring-[#1a73e8]/20 scale-105'
                              : step.done
                                ? 'bg-[#202124] border-[#202124] text-white'
                                : 'bg-white border-[#dadce0] text-[#9aa0a6]'
                          }`}
                        >
                          <Icono className="h-3 w-3 stroke-[2.2]" />
                        </span>

                        {/* Detalle del paso */}
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h6
                              className={`text-xs font-semibold ${
                                step.current
                                  ? 'text-[#1a73e8]'
                                  : step.done
                                    ? 'text-[#202124]'
                                    : 'text-[#80868b]'
                              }`}
                            >
                              {step.title}
                            </h6>
                            {step.current && (
                              <span className="text-[9.5px] font-bold uppercase tracking-wider bg-[#1a73e8] text-white px-1.5 py-0.2 rounded">
                                En curso
                              </span>
                            )}
                          </div>

                          {step.description && step.done && (
                            <p className="text-[11px] text-[#5f6368] leading-tight">
                              {step.description}
                            </p>
                          )}

                          {step.done ? (
                            <div className="flex items-center gap-2 text-[10.5px] text-[#80868b] font-mono flex-wrap pt-0.5">
                              {fecha && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {fecha}
                                </span>
                              )}
                              {step.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {step.location}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-[#9aa0a6] block pt-0.5">
                              Pendiente
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tarjeta de Destino y Protección */}
              <div className="bg-[#f8f9fa] border border-[#edf0f2] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#202124] flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#1a73e8]" />
                    Dirección de Entrega
                  </span>
                  <span className="text-[11px] text-[#5f6368] flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#137333]" />
                    Garantía Objetia
                  </span>
                </div>

                <div className="text-xs text-[#3c4043] space-y-0.5 bg-white p-3 rounded-xl border border-[#edf0f2]">
                  <p className="font-semibold text-[#202124]">
                    {trackingData.recipient_name || "Destinatario"}
                  </p>
                  <p className="text-[#5f6368]">
                    {[
                      trackingData.street ? `${trackingData.street} ${trackingData.number_addr || ''}`.trim() : null,
                      trackingData.floor_dept ? `(${trackingData.floor_dept})` : null,
                      trackingData.city,
                      trackingData.province
                    ].filter(Boolean).join(', ')}
                    {trackingData.postal_code && (
                      <span className="font-mono ml-1 font-semibold text-[#202124]">
                        · CP {trackingData.postal_code}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* ================================================================= */}
        {/* PIE DEL MODAL */}
        {/* ================================================================= */}
        <div className="px-5 py-3.5 border-t border-[#edf0f2] bg-[#fafbfc] flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-[#5f6368]">
            <span>Logística oficial</span>
            <span className="font-semibold text-[#202124]">Correo Argentino Paq.ar</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#202124] hover:bg-black text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-2xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
