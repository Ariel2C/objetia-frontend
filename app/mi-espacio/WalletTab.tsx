"use client";
import React, { useState, useEffect } from 'react';
import { Loader2, Landmark, History } from 'lucide-react';
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
      <div>
        <h3 className="text-base font-semibold leading-7 text-slate-900">Billetera</h3>
        <p className="text-xs text-slate-500">
          El dinero de tus ventas se puede usar para comprar en Vamaar al instante; para retirarlo al banco hay que esperar 7 días desde cada venta.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saldo para compras</span>
          <h4 className="text-3xl font-black text-white leading-none">
            {cargandoBalance ? "Cargando..." : formatearARS(saldoParaCompras)}
          </h4>
          <span className="text-[10px] text-emerald-400 font-semibold">Usalo ya mismo para comprar dentro de la app</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Retirable ahora</span>
          <h4 className="text-3xl font-black text-slate-900 leading-none">
            {cargandoBalance ? "Cargando..." : formatearARS(balance.available)}
          </h4>
          <span className="text-[10px] text-emerald-600 font-semibold">Listo para transferir a tu CBU/CVU</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En espera (7 días)</span>
          <h4 className="text-3xl font-black text-slate-900 leading-none">
            {cargandoBalance ? "Cargando..." : formatearARS(balance.frozen)}
          </h4>
          <span className="text-[10px] text-slate-400 font-semibold">Ventas recientes: se habilitan para retiro a los 7 días</span>
        </div>
      </div>

      {/* Detalle por venta: cuánto falta para que se libere cada una */}
      {ventasEnEspera.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Próximas liberaciones</h4>
          <div className="divide-y divide-amber-200/40">
            {ventasEnEspera.map((tx) => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Venta del {parsearFechaUTC(tx.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                  </p>
                  <p className="text-[10px] text-amber-800 font-semibold">
                    {tiempoRestanteLiberacion(tx.available_at)} · se libera el {parsearFechaUTC(tx.available_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <span className="text-sm font-black text-slate-900">{formatearARS(tx.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario de Retiro */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Landmark className="h-4 w-4 text-slate-600" /> Retirar a mi banco
        </h4>
        <p className="text-[11px] text-slate-400 -mt-2">
          Solo se puede retirar el saldo "Retirable ahora". Lo que está en espera se habilita automáticamente a los 7 días de cada venta.
        </p>
        {msgRetiro && (
          <div className={`p-3 rounded-lg text-xs font-semibold border ${
            msgRetiro.tipo === 'exito'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {msgRetiro.texto}
          </div>
        )}
        <form onSubmit={handleRetirar} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">Monto (mín. $1.000)</label>
            <input
              type="number"
              min="1000"
              step="0.01"
              value={montoRetiro}
              onChange={(e) => setMontoRetiro(e.target.value)}
              placeholder="10000"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 bg-white"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">CBU / CVU / Alias</label>
            <input
              type="text"
              value={cbuCvu}
              onChange={(e) => setCbuCvu(e.target.value)}
              placeholder="0000003100010000000001 o mi.alias.mp"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 bg-white"
              required
            />
          </div>
          <button
            type="submit"
            disabled={retirando || balance.available <= 0}
            className="px-4 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {retirando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {retirando ? "Procesando..." : "Retirar"}
          </button>
        </form>
      </div>

      {/* Historial de Movimientos */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <History className="h-4 w-4 text-slate-600" /> Movimientos
        </h4>
        {cargandoTx ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : transacciones.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">Todavía no tenés movimientos en tu billetera.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {transacciones.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">{LABEL_TIPO[tx.type] || tx.type}</p>
                  <p className="text-[10px] text-slate-400">
                    {parsearFechaUTC(tx.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' · '}
                    {LABEL_ESTADO[tx.status] || tx.status}
                    {tx.status === 'frozen' && tx.amount > 0 && (
                      <span className="text-amber-700 font-semibold"> · {tiempoRestanteLiberacion(tx.available_at)} para retirar</span>
                    )}
                  </p>
                </div>
                <span className={`text-sm font-black ${tx.amount < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {tx.amount < 0 ? '-' : '+'}{formatearARS(Math.abs(tx.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
