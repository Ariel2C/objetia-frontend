"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { apiFetch } from '../../lib/api';
import {
  Truck, Loader2, RefreshCw, ChevronRight, Package, Warehouse, Bike, Home, ExternalLink, FlaskConical
} from 'lucide-react';

interface EnvioSimulador {
  shipment_id: number;
  order_id: number;
  tracking_number: string;
  product_title: string;
  buyer_name: string;
  city: string | null;
  province: string | null;
  status: string;
  status_label: string;
  status_index: number;
  next_status: string | null;
  next_status_label: string | null;
  created_at: string;
}

const PASOS = [
  { code: 'LABEL_GENERATED', label: 'En preparación', Icono: Package },
  { code: 'DISPATCHED', label: 'Despachado', Icono: Warehouse },
  { code: 'IN_TRANSIT', label: 'En viaje', Icono: Truck },
  { code: 'OUT_FOR_DELIVERY', label: 'En reparto', Icono: Bike },
  { code: 'DELIVERED', label: 'Entregado', Icono: Home },
];

export default function SimuladorCorreoPage() {
  const { usuario, cargando } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [envios, setEnvios] = useState<EnvioSimulador[]>([]);
  const [cargandoEnvios, setCargandoEnvios] = useState(true);
  const [actualizando, setActualizando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEnvios = async () => {
    setCargandoEnvios(true);
    setError(null);
    try {
      const data = await apiFetch<EnvioSimulador[]>('/shipping/simulator/shipments');
      setEnvios(data);
    } catch (err: any) {
      setError(err.message || "No se pudieron cargar los envíos.");
    } finally {
      setCargandoEnvios(false);
    }
  };

  useEffect(() => {
    if (!cargando && !usuario) {
      router.push("/auth");
      return;
    }
    if (usuario) fetchEnvios();
  }, [usuario, cargando]);

  const handleCambiarEstado = async (envio: EnvioSimulador, nuevoEstado: string, label: string) => {
    setActualizando(envio.shipment_id);
    try {
      await apiFetch(
        `/shipping/simulator/${envio.shipment_id}/status?new_status=${nuevoEstado}`,
        { method: 'POST' }
      );
      toast.success(`${envio.tracking_number} ahora está "${label}".`, "Estado actualizado");
      await fetchEnvios();
    } catch (err: any) {
      toast.error(err.message || "No se pudo actualizar el estado.");
    } finally {
      setActualizando(null);
    }
  };

  if (cargando || (cargandoEnvios && envios.length === 0 && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in">
      {/* Encabezado del panel simulador */}
      <div className="mb-6 lg:mb-8 pb-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full mb-2">
            <FlaskConical className="h-3 w-3" /> Entorno de pruebas
          </span>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Simulador Correo Argentino</h1>
          <p className="text-sm text-gray-500 mt-1">
            Avanzá el estado de los envíos para simular la red logística. Cada cambio impacta en el seguimiento que ve el comprador.
          </p>
        </div>
        <button
          onClick={fetchEnvios}
          disabled={cargandoEnvios}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 hover:border-gray-400 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${cargandoEnvios ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm mb-8 font-semibold">
          ⚠️ {error}
        </div>
      )}

      {envios.length === 0 && !error ? (
        <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl shadow-sm max-w-2xl mx-auto">
          <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-700">No hay envíos registrados</h3>
          <p className="text-sm text-gray-400 mt-1">Cuando se concrete una compra, la guía de envío va a aparecer acá para simular su recorrido.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {envios.map((envio) => (
            <div key={envio.shipment_id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 animate-slide-up">
              {/* Datos del envío */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 uppercase tracking-wider">
                      Orden #{envio.order_id}
                    </span>
                    <span className="font-mono text-xs font-black text-gray-800">{envio.tracking_number}</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 mt-1 truncate">{envio.product_title}</h3>
                  <p className="text-[11px] text-gray-400">
                    Para {envio.buyer_name}{envio.city ? ` · ${envio.city}, ${envio.province}` : ""}
                  </p>
                </div>
                <Link
                  href={`/shipping/tracking?number=${envio.tracking_number}`}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-gray-900 transition"
                >
                  Ver como comprador <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              {/* Stepper de estados */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {PASOS.map((paso, idx) => {
                  const alcanzado = idx <= envio.status_index;
                  const esActual = idx === envio.status_index;
                  const esSiguiente = idx === envio.status_index + 1;
                  return (
                    <React.Fragment key={paso.code}>
                      {idx > 0 && (
                        <div className={`h-[2px] w-4 sm:w-8 flex-shrink-0 rounded ${alcanzado ? 'bg-emerald-500' : 'bg-gray-100'}`} />
                      )}
                      <button
                        onClick={() => !alcanzado && handleCambiarEstado(envio, paso.code, paso.label)}
                        disabled={alcanzado || actualizando === envio.shipment_id}
                        title={alcanzado ? paso.label : `Marcar como "${paso.label}"`}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition ${
                          esActual
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                            : alcanzado
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : esSiguiente
                                ? 'bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-50 cursor-pointer'
                                : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 cursor-pointer'
                        } disabled:cursor-default`}
                      >
                        <paso.Icono className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{paso.label}</span>
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Acción rápida: avanzar al siguiente estado */}
              {envio.next_status && (
                <button
                  onClick={() => handleCambiarEstado(envio, envio.next_status!, envio.next_status_label!)}
                  disabled={actualizando === envio.shipment_id}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition active:scale-95 cursor-pointer disabled:opacity-60"
                >
                  {actualizando === envio.shipment_id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  Avanzar a "{envio.next_status_label}"
                </button>
              )}
              {!envio.next_status && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <Home className="h-3.5 w-3.5" /> Envío entregado: recorrido completo
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
