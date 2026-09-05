"use client";
import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  Landmark, 
  History, 
  ShoppingBag, 
  ShieldCheck, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  TrendingUp,
  Wallet,
  X,
  ArrowRight
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useToast } from '../../components/ToastContext';
import type { WalletTransaction } from '../../lib/types';

interface WalletTabProps {
  cargandoBalance: boolean;
  balance: { available: number; frozen: number };
  formatearARS: (val: number) => string;
  onBalanceUpdate?: (available: number, frozen: number) => void;
}

const LABEL_TIPO: Record<string, string> = {
  sale_revenue: "Ingreso por venta",
  withdrawal: "Retiro a cuenta bancaria",
  purchase: "Compra con saldo",
};

const LABEL_ESTADO: Record<string, string> = {
  frozen: "En garantía",
  available: "Disponible",
  completed: "Completado",
};

const parsearFechaUTC = (fecha: string) => {
  const iso = fecha.endsWith('Z') || fecha.includes('+') ? fecha : `${fecha}Z`;
  return new Date(iso);
};

const tiempoRestanteLiberacion = (availableAt: string): string => {
  const diff = parsearFechaUTC(availableAt).getTime() - Date.now();
  if (diff <= 0) return "Liberación en proceso";
  const dias = Math.floor(diff / 86400000);
  if (dias >= 1) return `Falta${dias === 1 ? '' : 'n'} ${dias} ${dias === 1 ? 'día' : 'días'}`;
  const horas = Math.ceil(diff / 3600000);
  return `Faltan ${horas} h`;
};

export default function WalletTab({ cargandoBalance, balance, formatearARS, onBalanceUpdate }: WalletTabProps) {
  const toast = useToast();
  
  // Estado para el modal de retiro
  const [modalRetiroAbierto, setModalRetiroAbierto] = useState(false);
  const [montoRetiro, setMontoRetiro] = useState("");
  const [cbuCvu, setCbuCvu] = useState("");
  const [retirando, setRetirando] = useState(false);
  const [errorRetiro, setErrorRetiro] = useState<string | null>(null);

  const [transacciones, setTransacciones] = useState<WalletTransaction[]>([]);
  const [cargandoTx, setCargandoTx] = useState(false);

  // Cargar CBU/Alias guardado previamente en localStorage
  useEffect(() => {
    try {
      const savedCbu = localStorage.getItem('vamaar_wallet_cbu_alias');
      if (savedCbu) {
        setCbuCvu(savedCbu);
      }
    } catch (e) {
      // Ignorar si localStorage no está disponible
    }
  }, []);

  const cargarTransacciones = async () => {
    setCargandoTx(true);
    try {
      const data = await apiFetch<WalletTransaction[]>(`/wallet/transactions/`);
      setTransacciones(data);
    } catch (err) {
      console.error("Error al cargar movimientos:", err);
    } finally {
      setCargandoTx(false);
    }
  };

  useEffect(() => {
    cargarTransacciones();
  }, []);

  const abrirModalRetiro = () => {
    setErrorRetiro(null);
    setMontoRetiro("");
    setModalRetiroAbierto(true);
  };

  const cerrarModalRetiro = () => {
    if (retirando) return;
    setModalRetiroAbierto(false);
    setErrorRetiro(null);
  };

  const setMontoMaximo = () => {
    if (balance.available > 0) {
      setMontoRetiro(balance.available.toString());
      setErrorRetiro(null);
    }
  };

  const handleRetirar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorRetiro(null);

    const monto = parseFloat(montoRetiro);
    if (isNaN(monto) || monto <= 0) {
      setErrorRetiro("Ingresá un monto válido.");
      return;
    }

    if (monto < 1000) {
      setErrorRetiro("El monto mínimo de retiro es de $1.000.");
      return;
    }

    if (monto > balance.available) {
      setErrorRetiro(`El monto supera tu saldo retirable disponible (${formatearARS(balance.available)}).`);
      return;
    }

    const cbuLimpio = cbuCvu.trim();
    if (!cbuLimpio) {
      setErrorRetiro("Ingresá un CBU, CVU o Alias bancario.");
      return;
    }

    setRetirando(true);
    try {
      const data = await apiFetch<{ mensaje: string; balance_available: number; balance_frozen: number }>(
        `/wallet/withdraw/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: monto, cbu_cvu: cbuLimpio })
        }
      );

      // Guardar CBU/Alias en localStorage para futuros retiros
      try {
        localStorage.setItem('vamaar_wallet_cbu_alias', cbuLimpio);
      } catch (e) {}

      toast.success(data.mensaje || "Tu retiro fue procesado con éxito.", "Retiro exitoso");
      onBalanceUpdate?.(data.balance_available, data.balance_frozen);
      setModalRetiroAbierto(false);
      setMontoRetiro("");
      cargarTransacciones();
    } catch (err: any) {
      setErrorRetiro(err.message || "No se pudo procesar el retiro.");
    } finally {
      setRetirando(false);
    }
  };

  const saldoParaCompras = balance.available + balance.frozen;
  const ventasEnEspera = transacciones.filter(t => t.status === 'frozen' && t.amount > 0);

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* 3 Tarjetas Métricas Google AI Studio Light con Estética Carbón */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Saldo total para compras */}
        <div className="bg-white border border-[#edf0f2] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs relative overflow-hidden transition hover:border-[#dadce0]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#f1f3f4] border border-[#e8eaed] flex items-center justify-center text-[#202124]">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider">Saldo para compras</span>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[6px] bg-[#f1f3f4] text-[#202124] border border-[#e8eaed]">
              Inmediato
            </span>
          </div>
          <div>
            <h4 className="text-2xl sm:text-3xl font-bold text-[#202124] tracking-tight leading-none font-mono">
              {cargandoBalance ? "..." : formatearARS(saldoParaCompras)}
            </h4>
            <p className="text-xs text-[#5f6368] font-medium mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3c4043]" />
              <span>Disponible para comprar dentro de la app</span>
            </p>
          </div>
        </div>

        {/* Card 2: Retirable ahora con Link para Retirar */}
        <div className="bg-white border border-[#edf0f2] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs transition hover:border-[#dadce0]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#f1f3f4] border border-[#e8eaed] flex items-center justify-center text-[#202124]">
                <Landmark className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider">Retirable ahora</span>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[6px] bg-[#f1f3f4] text-[#202124] border border-[#e8eaed]">
              Banco
            </span>
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <h4 className="text-2xl sm:text-3xl font-bold text-[#202124] tracking-tight leading-none font-mono">
                {cargandoBalance ? "..." : formatearARS(balance.available)}
              </h4>
              
              {/* Link para retirar fondos */}
              <button
                type="button"
                onClick={abrirModalRetiro}
                disabled={balance.available <= 0}
                className="text-xs font-semibold text-[#202124] hover:text-[#000000] underline underline-offset-4 flex items-center gap-1 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
              >
                <span>Retirar fondos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-[#5f6368] font-medium mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3c4043]" />
              <span>Listo para transferir a tu CBU/CVU o Alias</span>
            </p>
          </div>
        </div>

        {/* Card 3: En espera */}
        <div className="bg-white border border-[#edf0f2] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs transition hover:border-[#dadce0]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#f1f3f4] border border-[#e8eaed] flex items-center justify-center text-[#202124]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider">En garantía (7 días)</span>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[6px] bg-[#f1f3f4] text-[#5f6368] border border-[#e8eaed]">
              Garantía
            </span>
          </div>
          <div>
            <h4 className="text-2xl sm:text-3xl font-bold text-[#202124] tracking-tight leading-none font-mono">
              {cargandoBalance ? "..." : formatearARS(balance.frozen)}
            </h4>
            <p className="text-xs text-[#5f6368] font-medium mt-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#5f6368]" />
              <span>Se habilita para retiro a los 7 días de cada venta</span>
            </p>
          </div>
        </div>
      </div>

      {/* Detalle por venta: cuánto falta para que se libere cada una */}
      {ventasEnEspera.length > 0 && (
        <div className="bg-white border border-[#edf0f2] rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-[#202124] uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#202124]" />
              <span>Próximas liberaciones de fondos</span>
            </h4>
            <span className="text-[11px] font-semibold text-[#5f6368]">
              {ventasEnEspera.length} {ventasEnEspera.length === 1 ? 'venta en garantía' : 'ventas en garantía'}
            </span>
          </div>
          <div className="divide-y divide-[#f1f3f4]">
            {ventasEnEspera.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between gap-3 first:pt-1 last:pb-1">
                <div>
                  <p className="text-xs font-semibold text-[#202124]">
                    Venta del {parsearFechaUTC(tx.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                  </p>
                  <p className="text-[11px] text-[#5f6368] font-medium mt-0.5">
                    {tiempoRestanteLiberacion(tx.available_at)} · se libera el {parsearFechaUTC(tx.available_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <span className="text-sm font-semibold text-[#202124] font-mono">{formatearARS(tx.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial de Movimientos (Botones y Colores Carbón Google AI Studio) */}
      <div className="bg-white border border-[#edf0f2] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-[#202124] flex items-center gap-2">
            <History className="h-4 w-4 text-[#202124]" /> Historial de Movimientos
          </h4>
          <span className="text-xs text-[#5f6368] font-medium">
            {transacciones.length} {transacciones.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {cargandoTx ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[#202124]" />
          </div>
        ) : transacciones.length === 0 ? (
          <p className="text-xs text-[#5f6368] text-center py-8">Todavía no tenés movimientos en tu billetera.</p>
        ) : (
          <div className="divide-y divide-[#f1f3f4]">
            {transacciones.map((tx) => {
              const esIngreso = tx.amount > 0;
              const IconoTx = tx.type === 'sale_revenue' 
                ? ArrowDownLeft 
                : tx.type === 'withdrawal' 
                  ? ArrowUpRight 
                  : ShoppingBag;

              return (
                <div key={tx.id} className="py-3.5 flex items-center justify-between gap-3 hover:bg-[#f8f9fa] -mx-2 px-2 rounded-xl transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#f1f3f4] text-[#202124] border border-[#e8eaed]">
                      <IconoTx className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#202124] truncate">{LABEL_TIPO[tx.type] || tx.type}</p>
                      <p className="text-[11px] text-[#5f6368] mt-0.5">
                        {parsearFechaUTC(tx.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {' · '}
                        <span className="font-semibold text-[#202124]">
                          {LABEL_ESTADO[tx.status] || tx.status}
                        </span>
                        {tx.status === 'frozen' && tx.amount > 0 && (
                          <span className="text-[#5f6368]"> · {tiempoRestanteLiberacion(tx.available_at)}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold flex-shrink-0 text-[#202124] font-mono">
                    {esIngreso ? '+' : ''}{formatearARS(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE RETIRO DE FONDOS (ESTILO GOOGLE AI STUDIO CARBÓN) */}
      {/* ========================================================================= */}
      {modalRetiroAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative border border-[#edf0f2]">
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between pb-2 border-b border-[#edf0f2]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#202124] text-white flex items-center justify-center">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#202124]">
                    Retirar fondos
                  </h3>
                  <p className="text-[11px] text-[#5f6368]">
                    Transferencia a tu cuenta bancaria o billetera virtual
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={cerrarModalRetiro}
                disabled={retirando}
                className="p-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mensaje de error si hubiese */}
            {errorRetiro && (
              <div className="p-3 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{errorRetiro}</span>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleRetirar} className="space-y-4">
              {/* Información de disponibilidad */}
              <div className="bg-[#f8f9fa] border border-[#edf0f2] rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs text-[#5f6368]">Saldo retirable:</span>
                <span className="text-sm font-bold text-[#202124] font-mono">
                  {formatearARS(balance.available)}
                </span>
              </div>

              {/* Campo Monto */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#202124]">
                    Monto a retirar
                  </label>
                  <button
                    type="button"
                    onClick={setMontoMaximo}
                    className="text-[11px] font-semibold text-[#202124] hover:underline cursor-pointer"
                  >
                    Usar máximo ({formatearARS(balance.available)})
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#5f6368]">
                    $
                  </span>
                  <input
                    type="number"
                    min="1000"
                    max={balance.available}
                    step="0.01"
                    value={montoRetiro}
                    onChange={(e) => {
                      setMontoRetiro(e.target.value);
                      setErrorRetiro(null);
                    }}
                    placeholder="Mínimo $1.000"
                    className="w-full pl-7 pr-3.5 py-2 text-sm rounded-xl border border-[#e8eaed] focus:outline-none focus:border-[#202124] text-[#202124] bg-white font-mono transition"
                    required
                  />
                </div>
              </div>

              {/* Campo CBU / CVU / Alias */}
              <div>
                <label className="text-xs font-semibold text-[#202124] block mb-1.5">
                  CBU, CVU o Alias bancario
                </label>
                <input
                  type="text"
                  value={cbuCvu}
                  onChange={(e) => {
                    setCbuCvu(e.target.value);
                    setErrorRetiro(null);
                  }}
                  placeholder="Ej: 0000003100010000000001 o mi.alias"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#e8eaed] focus:outline-none focus:border-[#202124] text-[#202124] bg-white font-mono transition"
                  required
                />
                <p className="text-[10.5px] text-[#80868b] mt-1">
                  Se recordará automáticamente para que no tengas que volver a ingresarlo.
                </p>
              </div>

              {/* Botones de acción del modal */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#edf0f2]">
                <button
                  type="button"
                  onClick={cerrarModalRetiro}
                  disabled={retirando}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] transition cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={retirando || balance.available <= 0}
                  className="px-4 py-2 bg-[#202124] hover:bg-[#000000] text-white rounded-xl text-xs font-medium shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {retirando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  <span>{retirando ? "Procesando retiro..." : "Confirmar retiro"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

