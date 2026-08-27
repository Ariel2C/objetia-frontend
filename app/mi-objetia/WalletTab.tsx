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
  Wallet
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

// El backend guarda las fechas en UTC sin zona horaria: se la agregamos para
// que el navegador las convierta bien a hora local.
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
  const [montoRetiro, setMontoRetiro] = useState("");
  const [cbuCvu, setCbuCvu] = useState("");
  const [retirando, setRetirando] = useState(false);
  const [msgRetiro, setMsgRetiro] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const [transacciones, setTransacciones] = useState<WalletTransaction[]>([]);
  const [cargandoTx, setCargandoTx] = useState(false);

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

  const handleRetirar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgRetiro(null);
    const monto = parseFloat(montoRetiro);
    if (isNaN(monto) || monto <= 0) {
      setMsgRetiro({ tipo: 'error', texto: "Ingresá un monto válido." });
      return;
    }
    setRetirando(true);
    try {
      const data = await apiFetch<{ mensaje: string; balance_available: number; balance_frozen: number }>(
        `/wallet/withdraw/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: monto, cbu_cvu: cbuCvu })
        }
      );
      setMsgRetiro({ tipo: 'exito', texto: data.mensaje || "Retiro procesado con éxito." });
      toast.success(data.mensaje || "Tu retiro fue procesado con éxito.", "Retiro exitoso");
      setMontoRetiro("");
      setCbuCvu("");
      onBalanceUpdate?.(data.balance_available, data.balance_frozen);
      cargarTransacciones();
    } catch (err: any) {
      setMsgRetiro({ tipo: 'error', texto: err.message || "No se pudo procesar el retiro." });
    } finally {
      setRetirando(false);
    }
  };

  const saldoParaCompras = balance.available + balance.frozen;

  // Ventas cuyo dinero todavía está en el período de garantía de 7 días
  const ventasEnEspera = transacciones.filter(t => t.status === 'frozen' && t.amount > 0);

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* 3 Tarjetas Métricas Google AI Studio Light */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Saldo total para compras */}
        <div className="bg-white border border-[#dadce0] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs relative overflow-hidden transition hover:border-[#bdc1c6]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e8f0fe] border border-[#d2e3fc] flex items-center justify-center text-[#1a73e8]">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider">Saldo para compras</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]">Inmediato</span>
          </div>
          <div>
            <h4 className="text-2xl sm:text-3xl font-extrabold text-[#202124] tracking-tight leading-none">
              {cargandoBalance ? "..." : formatearARS(saldoParaCompras)}
            </h4>
            <p className="text-xs text-[#137333] font-medium mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#137333]" />
              <span>Disponible para comprar dentro de la app</span>
            </p>
          </div>
        </div>

        {/* Card 2: Retirable ahora */}
        <div className="bg-white border border-[#dadce0] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs transition hover:border-[#bdc1c6]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e6f4ea] border border-[#ceead6] flex items-center justify-center text-[#137333]">
                <Landmark className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider">Retirable ahora</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">Banco</span>
          </div>
          <div>
            <h4 className="text-2xl sm:text-3xl font-extrabold text-[#202124] tracking-tight leading-none">
              {cargandoBalance ? "..." : formatearARS(balance.available)}
            </h4>
            <p className="text-xs text-[#137333] font-medium mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#137333]" />
              <span>Listo para transferir a tu CBU/CVU</span>
            </p>
          </div>
        </div>

        {/* Card 3: En espera */}
        <div className="bg-white border border-[#dadce0] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs transition hover:border-[#bdc1c6]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#fef7e0] border border-[#feefc3] flex items-center justify-center text-[#b06000]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider">En garantía (7 días)</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fef7e0] text-[#b06000] border border-[#feefc3]">Garantía</span>
          </div>
          <div>
            <h4 className="text-2xl sm:text-3xl font-extrabold text-[#202124] tracking-tight leading-none">
              {cargandoBalance ? "..." : formatearARS(balance.frozen)}
            </h4>
            <p className="text-xs text-[#5f6368] font-medium mt-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#b06000]" />
              <span>Se habilita para retiro a los 7 días de cada venta</span>
            </p>
          </div>
        </div>
      </div>

      {/* Detalle por venta: cuánto falta para que se libere cada una */}
      {ventasEnEspera.length > 0 && (
        <div className="bg-white border border-[#feefc3] rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#b06000] uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#b06000]" />
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
                  <p className="text-xs font-bold text-[#202124]">
                    Venta del {parsearFechaUTC(tx.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                  </p>
                  <p className="text-[11px] text-[#b06000] font-medium mt-0.5">
                    {tiempoRestanteLiberacion(tx.available_at)} · se libera el {parsearFechaUTC(tx.available_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <span className="text-sm font-extrabold text-[#202124]">{formatearARS(tx.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario de Retiro */}
      <div className="bg-white border border-[#dadce0] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h4 className="text-sm font-bold text-[#202124] flex items-center gap-2">
            <Landmark className="h-4 w-4 text-[#1a73e8]" /> Retirar a cuenta bancaria
          </h4>
          <p className="text-xs text-[#5f6368] mt-0.5">
            Solo se puede retirar el saldo "Retirable ahora". Las transferencias se acreditan en tu cuenta bancaria o billetera virtual.
          </p>
        </div>

        {msgRetiro && (
          <div className={`p-3.5 rounded-xl text-xs font-semibold border ${
            msgRetiro.tipo === 'exito'
              ? 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {msgRetiro.texto}
          </div>
        )}

        <form onSubmit={handleRetirar} className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-end">
          <div>
            <label className="text-xs font-semibold text-[#3c4043] block mb-1.5">Monto a retirar (mín. $1.000)</label>
            <input
              type="number"
              min="1000"
              step="0.01"
              value={montoRetiro}
              onChange={(e) => setMontoRetiro(e.target.value)}
              placeholder="Ej: 10000"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] bg-[#f8f9fa] focus:bg-white transition"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#3c4043] block mb-1.5">CBU / CVU / Alias</label>
            <input
              type="text"
              value={cbuCvu}
              onChange={(e) => setCbuCvu(e.target.value)}
              placeholder="0000003100010000000001 o mi.alias"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] bg-[#f8f9fa] focus:bg-white transition"
              required
            />
          </div>
          <button
            type="submit"
            disabled={retirando || balance.available <= 0}
            className="px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl text-xs font-semibold shadow-2xs transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer h-[42px]"
          >
            {retirando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {retirando ? "Procesando..." : "Solicitar Retiro"}
          </button>
        </form>
      </div>

      {/* Historial de Movimientos */}
      <div className="bg-white border border-[#dadce0] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-[#202124] flex items-center gap-2">
            <History className="h-4 w-4 text-[#1a73e8]" /> Historial de Movimientos
          </h4>
          <span className="text-xs text-[#5f6368] font-medium">
            {transacciones.length} {transacciones.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {cargandoTx ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[#1a73e8]" />
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
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      esIngreso 
                        ? 'bg-[#e6f4ea] text-[#137333]' 
                        : 'bg-[#f1f3f4] text-[#5f6368]'
                    }`}>
                      <IconoTx className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#202124] truncate">{LABEL_TIPO[tx.type] || tx.type}</p>
                      <p className="text-[11px] text-[#5f6368] mt-0.5">
                        {parsearFechaUTC(tx.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {' · '}
                        <span className={`font-semibold ${
                          tx.status === 'available' || tx.status === 'completed'
                            ? 'text-[#137333]'
                            : 'text-[#b06000]'
                        }`}>
                          {LABEL_ESTADO[tx.status] || tx.status}
                        </span>
                        {tx.status === 'frozen' && tx.amount > 0 && (
                          <span className="text-[#b06000] font-semibold"> · {tiempoRestanteLiberacion(tx.available_at)}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-extrabold flex-shrink-0 ${esIngreso ? 'text-[#137333]' : 'text-[#202124]'}`}>
                    {esIngreso ? '+' : ''}{formatearARS(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
