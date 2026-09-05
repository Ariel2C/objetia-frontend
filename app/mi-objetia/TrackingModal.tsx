"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  Loader2,
  ShoppingBag
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
  productImage?: string | null;
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
  productImage,
  orderId
}: TrackingModalProps) {
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[99999] flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl border border-[#dadce0] shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================================================================= */}
        {/* 1. CABECERA: SEGUIMIENTO DE PAQUETE ABAJO DE CORREO ARGENTINO */}
        {/* ================================================================= */}
        <div className="px-5 py-4 border-b border-[#edf0f2] flex items-center justify-between gap-3 bg-white">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1a73e8] bg-[#e8f0fe] px-2.5 py-0.5 rounded-full border border-[#d2e3fc] inline-flex items-center gap-1.5 w-fit">
              <Truck className="h-3 w-3" /> Correo Argentino
            </span>
            <h3 className="text-base sm:text-lg font-bold text-[#202124] leading-tight">
              Seguimiento de paquete
            </h3>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {trackingNumber && (
              <button
                type="button"
                onClick={() => fetchTracking(trackingNumber)}
                disabled={cargando}
                className="p-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] rounded-lg transition cursor-pointer disabled:opacity-40"
                title="Actualizar estado"
              >
                <RotateCw className={`h-4 w-4 ${cargando ? 'animate-spin text-[#1a73e8]' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] rounded-lg transition cursor-pointer"
              title="Cerrar ventana (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* CUERPO PRINCIPAL DEL MODAL (SCROLLABLE) */}
        {/* ================================================================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">

          {/* =============================================================== */}
          {/* 2. EL PRODUCTO CON LA IMAGEN EN UN CÍRCULO */}
          {/* =============================================================== */}
          <div className="bg-[#f8f9fa] border border-[#edf0f2] rounded-xl p-3.5 flex items-center gap-3.5">
            {/* Imagen en un círculo */}
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-xs flex-shrink-0 bg-white flex items-center justify-center">
              {productImage ? (
                <img
                  src={productImage}
                  alt={productTitle || "Producto"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ShoppingBag className="w-6 h-6 text-[#5f6368]" />
              )}
            </div>

            {/* Información del producto y orden */}
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {orderId && (
                  <span className="text-[10px] font-mono font-bold text-[#1a73e8] bg-[#e8f0fe] px-2 py-0.2 rounded">
                    Orden #{orderId}
                  </span>
                )}
                {trackingData?.status && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-full ${
                    trackingData.status === 'Entregado'
                      ? 'bg-[#e8f8ef] text-[#00a650] border border-[#ceead6]'
                      : 'bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]'
                  }`}>
                    {trackingData.status}
                  </span>
                )}
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-[#202124] truncate leading-tight">
                {productTitle || "Artículo adquirido en Objetia"}
              </h4>
              {trackingData?.date && (
                <p className="text-[11px] text-[#5f6368]">
                  Fecha de pedido: <strong className="font-mono text-[#202124]">{trackingData.date}</strong>
                </p>
              )}
            </div>
          </div>

          {/* =============================================================== */}
          {/* 3. NRO DE GUÍA CON COPIAR A LA DERECHA */}
          {/* =============================================================== */}
          <div className="bg-[#f8f9fa] px-4 py-2.5 rounded-xl border border-[#edf0f2] flex items-center justify-between gap-2 flex-wrap text-xs">
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

          {/* =============================================================== */}
          {/* 4. HISTORIAL DE EVENTOS DEL CORREO CON CANTIDAD DE ETAPAS */}
          {/* =============================================================== */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-semibold text-[#202124]">
                Historial de eventos del Correo
              </h5>
              {trackingData && (
                <span className="text-[10.5px] font-mono font-medium text-[#5f6368]">
                  {trackingData.timeline.filter(t => t.done).length} de {trackingData.timeline.length} etapas
                </span>
              )}
            </div>

            {/* ESTADOS DE CARGA / ERROR */}
            {cargando && !trackingData ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#1a73e8] mx-auto" />
                <p className="text-xs font-semibold text-[#202124]">Consultando servidor logístico...</p>
                <p className="text-[11px] text-[#5f6368]">Obteniendo los últimos movimientos de Correo Argentino</p>
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
              /* =========================================================== */
              /* 5. LAS ETAPAS DENTRO DE TARJETAS CON MUESCA CIRCULAR */
              /* =========================================================== */
              <div className="space-y-3">
                {trackingData.timeline.map((step, idx) => {
                  const Icono = ICONOS_PASO[step.code] || Check;
                  const fecha = formatearFecha(step.date);
                  const isFirst = idx === 0;
                  const isLast = idx === trackingData.timeline.length - 1;
                  const isDelivered = trackingData.status === 'Entregado' || step.code === 'DELIVERED';
                  const isStepCurrent = step.current && !isDelivered && !isLast;

                  const bgLineClass = isStepCurrent
                    ? 'bg-[#1a73e8]'
                    : step.done
                      ? 'bg-[#202124]'
                      : 'bg-[#dadce0]';

                  return (
                    <div 
                      key={step.code} 
                      className={`relative rounded-xl border transition-all flex items-stretch overflow-visible ${
                        isStepCurrent
                          ? 'bg-white border-[#dadce0] shadow-xs ring-2 ring-[#1a73e8]/20'
                          : step.done
                            ? 'bg-[#f8f9fa] hover:bg-white border-[#dadce0]'
                            : 'bg-[#fafbfc] border-[#dadce0]/70 opacity-80'
                      }`}
                    >
                      {/* LADO IZQUIERDO: SOCKET CIRCULAR CON EL CAMINO ABIERTO Y LA LÍNEA VERTICAL CONECTORA (SEGÚN CROQUIS) */}
                      <div className="relative w-16 flex-shrink-0 flex items-center justify-center self-stretch">
                        
                        {/* Camino superior (canal abierto que interrumpe el borde de la tarjeta para que no toque la línea) */}
                        {!isFirst && (
                          <div 
                            className={`absolute left-1/2 -translate-x-1/2 w-[14px] bg-white border-l-[1.5px] border-r-[1.5px] z-[2] transition-colors ${
                              isStepCurrent || step.done
                                ? 'border-[#dadce0]'
                                : 'border-[#dadce0]/70'
                            }`}
                            style={{
                              top: '-1px',
                              bottom: 'calc(50% + 24px)',
                            }}
                          />
                        )}

                        {/* Camino inferior (canal abierto que interrumpe el borde de la tarjeta para que no toque la línea) */}
                        {!isLast && (
                          <div 
                            className={`absolute left-1/2 -translate-x-1/2 w-[14px] bg-white border-l-[1.5px] border-r-[1.5px] z-[2] transition-colors ${
                              isStepCurrent || step.done
                                ? 'border-[#dadce0]'
                                : 'border-[#dadce0]/70'
                            }`}
                            style={{
                              top: 'calc(50% + 24px)',
                              bottom: '-1px',
                            }}
                          />
                        )}

                        {/* Cavidad / Socket circular concéntrico (50px) con borde gris claro */}
                        <div 
                          className={`absolute w-[50px] h-[50px] rounded-full border-[1.5px] bg-white z-[1] transition-colors ${
                            isStepCurrent || step.done
                              ? 'border-[#dadce0]'
                              : 'border-[#dadce0]/70'
                          }`}
                          style={{
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                          }}
                        >
                          {/* Abertura superior del socket hacia el camino */}
                          {!isFirst && (
                            <div className="absolute -top-[1.5px] left-1/2 -translate-x-1/2 w-[13px] h-[3px] bg-white z-[2]" />
                          )}
                          {/* Abertura inferior del socket hacia el camino */}
                          {!isLast && (
                            <div className="absolute -bottom-[1.5px] left-1/2 -translate-x-1/2 w-[13px] h-[3px] bg-white z-[2]" />
                          )}
                        </div>

                        {/* Línea vertical superior conectora (3px) que entra por el centro del camino y se une al icono */}
                        {!isFirst && (
                          <div 
                            className={`absolute left-1/2 -translate-x-1/2 w-[3px] z-[3] ${
                              step.done ? 'bg-[#202124]' : isStepCurrent ? 'bg-[#1a73e8]' : 'bg-[#dadce0]'
                            }`}
                            style={{
                              top: '-15px',
                              bottom: '50%',
                            }}
                          />
                        )}

                        {/* Línea vertical inferior conectora (3px) que sale desde el icono por el centro del camino */}
                        {!isLast && (
                          <div 
                            className={`absolute left-1/2 -translate-x-1/2 w-[3px] z-[3] ${bgLineClass}`}
                            style={{
                              top: '50%',
                              bottom: '-15px',
                            }}
                          />
                        )}

                        {/* Ícono redondo interior concéntrico (39px, unido a la línea, sin tocar la cavidad) */}
                        <div 
                          className={`relative w-[39px] h-[39px] rounded-full flex items-center justify-center border-2 transition-all z-[4] ${
                            isStepCurrent
                              ? 'bg-[#1a73e8] border-[#1a73e8] text-white shadow-sm ring-2 ring-[#1a73e8]/20 scale-105'
                              : step.done
                                ? 'bg-[#202124] border-[#202124] text-white'
                                : 'bg-white border-[#dadce0] text-[#9aa0a6]'
                          }`}
                        >
                          <Icono className="h-4 w-4 stroke-[2.2]" />
                        </div>
                      </div>

                      {/* LADO DERECHO: CONTENIDO DE LA ETAPA */}
                      <div className="space-y-1 min-w-0 flex-1 p-3.5 sm:p-4 pl-1 sm:pl-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h6
                            className={`text-xs sm:text-sm font-bold leading-tight ${
                              isStepCurrent
                                ? 'text-[#1a73e8]'
                                : step.done
                                  ? 'text-[#202124]'
                                  : 'text-[#80868b]'
                            }`}
                          >
                            {step.title}
                          </h6>
                          {isStepCurrent && (
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
                            Pendiente de procesamiento
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* =============================================================== */}
          {/* DIRECCIÓN DE ENTREGA AL FINAL */}
          {/* =============================================================== */}
          {trackingData && (
            <div className="bg-[#f8f9fa] border border-[#edf0f2] rounded-xl p-3.5 space-y-2">
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

              <div className="text-xs text-[#3c4043] space-y-0.5 bg-white p-3 rounded-lg border border-[#edf0f2]">
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
          )}
        </div>

        {/* ================================================================= */}
        {/* PIE DEL MODAL */}
        {/* ================================================================= */}
        <div className="px-5 py-3 border-t border-[#edf0f2] bg-[#fafbfc] flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-[#5f6368]">
            <span>Logística oficial</span>
            <span className="font-semibold text-[#202124]">Correo Argentino Paq.ar</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#202124] hover:bg-black text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-2xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
