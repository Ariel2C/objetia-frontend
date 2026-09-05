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
  ArrowRight,
  Receipt,
  CreditCard,
  Lock,
  Check
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
  frozen: "En garantía (7 días)",
  available: "Acreditado en disponible",
  completed: "Transferencia completada",
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

  // Estado para el modal de detalle de movimiento
  const [detalleTx, setDetalleTx] = useState<WalletTransaction | null>(null);

  const [transacciones, setTransacciones] = useState<WalletTransaction[]>([]);
  const [cargandoTx, setCargandoTx] = useState(false);

  // Cuentas de retiro (CBU / CVU / Alias) guardadas en BD y localStorage
  const [cuentasRecientes, setCuentasRecientes] = useState<string[]>([]);

  // 1. Cargar CBU/Alias guardado previamente en localStorage como respaldo inicial
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

  // 2. Cargar las cuentas de retiro guardadas en la base de datos (sincronizadas entre dispositivos)
  const cargarCuentasRecientes = async () => {
    try {
      const data = await apiFetch<{ accounts: string[] }>(`/wallet/payout-accounts/`);
      if (data && Array.isArray(data.accounts)) {
        setCuentasRecientes(data.accounts);
        // Si no había nada en input o el usuario entra desde otro dispositivo, tomar la más reciente
        if (data.accounts.length > 0) {
          setCbuCvu(prev => prev || data.accounts[0]);
        }
      }
    } catch (e) {
      // Fallback a localStorage si la petición falla
    }
  };

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
    cargarCuentasRecientes();
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

  // Manejo de cambio de monto con tope automático al máximo disponible
  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setErrorRetiro(null);
    if (!valStr) {
      setMontoRetiro("");
      return;
    }
    const valNum = parseFloat(valStr);
    if (!isNaN(valNum)) {
      if (valNum > balance.available) {
        // Pone automáticamente el número máximo que dispone
        setMontoRetiro(balance.available.toString());
        return;
      }
    }
    setMontoRetiro(valStr);
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
      setMontoRetiro(balance.available.toString());
      setErrorRetiro(`El monto supera tu saldo retirable disponible. Se ajustó a ${formatearARS(balance.available)}.`);
      return;
    }

    const cbuLimpio = cbuCvu.trim();
    if (!cbuLimpio) {
      setErrorRetiro("Ingresá un CBU, CVU o Alias bancario.");
      return;
    }

    setRetirando(true);
    try {
      const data = await apiFetch<{
        mensaje: string;
        balance_available: number;
        balance_frozen: number;
        recent_accounts?: string[];
      }>(
        `/wallet/withdraw/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: monto, cbu_cvu: cbuLimpio })
        }
      );

      // Guardar CBU/Alias en localStorage como respaldo local
      try {
        localStorage.setItem('vamaar_wallet_cbu_alias', cbuLimpio);
      } catch (e) {}

      // Actualizar la lista de cuentas recientes
      if (data.recent_accounts && Array.isArray(data.recent_accounts)) {
        setCuentasRecientes(data.recent_accounts);
      } else {
        setCuentasRecientes(prev => [cbuLimpio, ...prev.filter(c => c !== cbuLimpio)].slice(0, 3));
      }

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
  const pctRetirable = saldoParaCompras > 0 ? (balance.available / saldoParaCompras) * 100 : 0;
  const pctGarantia = saldoParaCompras > 0 ? (balance.frozen / saldoParaCompras) * 100 : 0;
  const ventasEnEspera = transacciones.filter(t => t.status === 'frozen' && t.amount > 0);

  // Obtener ícono específico según el tipo y estado de la transacción
  const getTransactionIcon = (tx: WalletTransaction) => {
    if (tx.status === 'frozen') {
      return Lock; // Candado para ventas retenidas en garantía
    }
    if (tx.type === 'sale_revenue') {
      return ArrowDownLeft; // Ingreso acreditado
    }
    if (tx.type === 'withdrawal') {
      return Landmark; // Retiro bancario
    }
    if (tx.type === 'purchase') {
      return ShoppingBag; // Compra con saldo
    }
    return Receipt;
  };

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* Tarjetas Métricas Google AI Studio Light con Estética Carbón */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1: Saldo total para compras */}
        <div className="bg-white border border-[#edf0f2] rounded-2xl p-5 sm:p-6 shadow-xs transition hover:border-[#dadce0] flex flex-col justify-between space-y-4">
          <div className="space-y-3">
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

          {/* Gráfico de Barra Horizontal de Distribución de Saldo */}
          <div className="pt-3 border-t border-[#edf0f2] space-y-2">
            {/* Barra tipo gráfico */}
            <div className="w-full h-2.5 rounded-full bg-[#edf0f2] overflow-hidden flex">
              {saldoParaCompras > 0 ? (
                <>
                  <div
                    style={{ width: `${pctRetirable}%` }}
                    className="h-full bg-[#00a650] transition-all duration-500"
                    title={`Disponible para retirar: ${formatearARS(balance.available)} (${pctRetirable.toFixed(0)}%)`}
                  />
                  <div
                    style={{ width: `${pctGarantia}%` }}
                    className="h-full bg-[#1a73e8] transition-all duration-500"
                    title={`En garantía: ${formatearARS(balance.frozen)} (${pctGarantia.toFixed(0)}%)`}
                  />
                </>
              ) : (
                <div className="w-full h-full bg-[#e8eaed]" />
              )}
            </div>

            {/* Leyenda del gráfico */}
            <div className="flex items-center justify-between text-xs font-medium pt-0.5 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00a650] flex-shrink-0" />
                <span className="text-[#5f6368]">Para retirar:</span>
                <span className="font-mono font-bold text-[#00a650]">
                  {cargandoBalance ? "..." : formatearARS(balance.available)}
                </span>
                {saldoParaCompras > 0 && (
                  <span className="text-[10.5px] text-[#80868b] font-mono">
                    ({pctRetirable.toFixed(0)}%)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1a73e8] flex-shrink-0" />
                <span className="text-[#5f6368]">En garantía:</span>
                <span className="font-mono font-bold text-[#1a73e8]">
                  {cargandoBalance ? "..." : formatearARS(balance.frozen)}
                </span>
                {saldoParaCompras > 0 && (
                  <span className="text-[10.5px] text-[#80868b] font-mono">
                    ({pctGarantia.toFixed(0)}%)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Retiros y Garantía (Combinada: primero disponible para retirar y abajo en garantía) */}
        <div className="bg-white border border-[#edf0f2] rounded-2xl p-5 sm:p-6 shadow-xs transition hover:border-[#dadce0] flex flex-col justify-between space-y-4">
          {/* Sección Superior: Disponible para retirar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#e8f8ef] border border-[#ceead6] flex items-center justify-center text-[#00a650]">
                  <Landmark className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider">
                  Disponible para retirar
                </span>
              </div>
              
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

            <div>
              <h4 className="text-2xl sm:text-3xl font-bold text-[#00a650] tracking-tight leading-none font-mono">
                {cargandoBalance ? "..." : formatearARS(balance.available)}
              </h4>
              <p className="text-xs text-[#5f6368] font-medium mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00a650]" />
                <span>Listo para transferir a tu CBU/CVU o Alias</span>
              </p>
            </div>
          </div>

          {/* Sección Inferior: En garantía */}
          <div className="pt-3 border-t border-[#edf0f2] flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#e8f0fe] border border-[#d2e3fc] flex items-center justify-center text-[#1a73e8]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider block">
                  En garantía (7 días)
                </span>
                <span className="text-[11px] text-[#80868b] block">
                  Se habilita para retiro a los 7 días de cada venta
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg sm:text-xl font-bold text-[#1a73e8] font-mono block">
                {cargandoBalance ? "..." : formatearARS(balance.frozen)}
              </span>
              <span className="text-[10px] font-mono text-[#80868b]">
                Retención temporal
              </span>
            </div>
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
              <div 
                key={tx.id} 
                onClick={() => setDetalleTx(tx)}
                className="py-3 flex items-center justify-between gap-3 first:pt-1 last:pb-1 cursor-pointer hover:bg-[#f8f9fa] -mx-2 px-2 rounded-xl transition"
              >
                <div>
                  <p className="text-xs font-semibold text-[#202124]">
                    Venta del {parsearFechaUTC(tx.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                  </p>
                  <p className="text-[11px] text-[#5f6368] font-medium mt-0.5">
                    {tiempoRestanteLiberacion(tx.available_at)} · se libera el {parsearFechaUTC(tx.available_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-[#5f6368] font-mono">
                    {formatearARS(tx.amount)}
                  </span>
                  <span className="block text-[10px] text-[#80868b]">
                    En garantía
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial de Movimientos */}
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
              const estaEnGarantia = tx.status === 'frozen';
              const estaAcreditado = tx.status === 'available' && esIngreso;
              const IconoTx = getTransactionIcon(tx);

              // Tono verde MercadoPago (#00a650) si es dinero efectivamente sumado y disponible
              const colorMonto = estaEnGarantia
                ? 'text-[#5f6368]' // En garantía no es ingreso todavía
                : esIngreso
                ? 'text-[#00a650]' // Verde MercadoPago para sumas acreditadas
                : 'text-[#202124]'; // Retiro o gasto en carbón

              return (
                <div 
                  key={tx.id} 
                  onClick={() => setDetalleTx(tx)}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-[#f8f9fa] -mx-2 px-2 rounded-xl transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border transition ${
                      estaEnGarantia
                        ? 'bg-[#f1f3f4] text-[#80868b] border-[#e8eaed]'
                        : estaAcreditado
                        ? 'bg-[#e8f8ef] text-[#00a650] border-[#bfe8cf]'
                        : 'bg-[#f1f3f4] text-[#202124] border-[#e8eaed]'
                    }`}>
                      <IconoTx className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#202124] truncate group-hover:text-[#000000]">
                        {LABEL_TIPO[tx.type] || tx.type}
                      </p>
                      <p className="text-[11px] mt-0.5 flex items-center gap-1.5 flex-wrap">
                        {/* Estado */}
                        <span className={`font-semibold ${
                          estaEnGarantia
                            ? 'text-[#80868b] bg-[#f1f3f4] px-1.5 py-0.2 rounded text-[10px]'
                            : estaAcreditado
                            ? 'text-[#00a650] bg-[#e8f8ef] px-1.5 py-0.2 rounded text-[10px]'
                            : 'text-[#202124]'
                        }`}>
                          {LABEL_ESTADO[tx.status] || tx.status}
                        </span>

                        {estaEnGarantia && tx.amount > 0 && (
                          <span className="text-[#80868b] text-[10.5px]">
                            · {tiempoRestanteLiberacion(tx.available_at)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Lado Derecho: Monto con Fecha abajo */}
                  <div className="text-right flex-shrink-0">
                    <span className={`text-sm font-bold font-mono ${colorMonto}`}>
                      {esIngreso ? '+' : ''}{formatearARS(tx.amount)}
                    </span>
                    <span className="block text-[10.5px] text-[#80868b] font-mono mt-0.5">
                      {parsearFechaUTC(tx.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE DETALLE DE TRANSACCIÓN */}
      {/* ========================================================================= */}
      {detalleTx && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative border border-[#edf0f2]">
            {/* Cabecera modal detalle */}
            <div className="flex items-center justify-between pb-2 border-b border-[#edf0f2]">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#202124]" />
                <h3 className="text-sm font-semibold text-[#202124]">
                  Comprobante de movimiento
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetalleTx(null)}
                className="p-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Monto destacado */}
            <div className="text-center py-2">
              <span className="text-[11px] text-[#5f6368] uppercase font-semibold block tracking-wider">
                {LABEL_TIPO[detalleTx.type] || detalleTx.type}
              </span>
              <h4 className={`text-2xl font-bold font-mono mt-1 ${
                detalleTx.status === 'frozen'
                  ? 'text-[#5f6368]'
                  : detalleTx.amount > 0
                  ? 'text-[#00a650]'
                  : 'text-[#202124]'
              }`}>
                {detalleTx.amount > 0 ? '+' : ''}{formatearARS(detalleTx.amount)}
              </h4>
              <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                detalleTx.status === 'frozen'
                  ? 'bg-[#f1f3f4] text-[#5f6368]'
                  : detalleTx.amount > 0
                  ? 'bg-[#e8f8ef] text-[#00a650]'
                  : 'bg-[#f1f3f4] text-[#202124]'
              }`}>
                {LABEL_ESTADO[detalleTx.status] || detalleTx.status}
              </span>
            </div>

            {/* Datos detallados */}
            <div className="bg-[#f8f9fa] border border-[#edf0f2] rounded-xl p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#5f6368]">Nº de Operación:</span>
                <span className="font-mono text-[#202124] font-semibold">#{detalleTx.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5f6368]">Fecha y hora:</span>
                <span className="font-mono text-[#202124]">
                  {parsearFechaUTC(detalleTx.created_at).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {detalleTx.status === 'frozen' && (
                <div className="flex items-center justify-between border-t border-[#edf0f2] pt-2">
                  <span className="text-[#5f6368]">Acreditación estimada:</span>
                  <span className="font-mono text-[#202124] font-semibold">
                    {parsearFechaUTC(detalleTx.available_at).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
              {detalleTx.marketplace_commission > 0 && (
                <div className="flex items-center justify-between border-t border-[#edf0f2] pt-2">
                  <span className="text-[#5f6368]">Comisión de plataforma:</span>
                  <span className="font-mono text-[#202124]">{formatearARS(detalleTx.marketplace_commission)}</span>
                </div>
              )}
              {detalleTx.destination_account && (
                <div className="flex items-center justify-between border-t border-[#edf0f2] pt-2">
                  <span className="text-[#5f6368]">Cuenta de destino:</span>
                  <span className="font-mono text-[#202124] font-semibold">{detalleTx.destination_account}</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-[#80868b] text-center">
              {detalleTx.status === 'frozen'
                ? "El dinero de tus ventas se retiene temporalmente durante el período de garantía de 7 días para proteger a comprador y vendedor."
                : "Operación procesada y registrada en tu billetera Objetia."}
            </p>

            <button
              type="button"
              onClick={() => setDetalleTx(null)}
              className="w-full py-2 bg-[#202124] hover:bg-[#000000] text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

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

              {/* Campo Monto con ajuste automático al máximo */}
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
                    onChange={handleMontoChange}
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

                {/* Últimas 3 cuentas utilizadas guardadas en la BD (sincronizadas entre dispositivos) */}
                {cuentasRecientes.length > 0 && (
                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#5f6368] font-medium">
                      <History className="w-3.5 h-3.5 text-[#5f6368]" />
                      <span>Últimas utilizadas (click para seleccionar):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cuentasRecientes.slice(0, 3).map((cuenta) => {
                        const seleccionada = cbuCvu.trim().toLowerCase() === cuenta.trim().toLowerCase();
                        return (
                          <button
                            key={cuenta}
                            type="button"
                            onClick={() => {
                              setCbuCvu(cuenta);
                              setErrorRetiro(null);
                            }}
                            className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
                              seleccionada
                                ? "bg-[#202124] text-white border-[#202124] shadow-xs"
                                : "bg-[#f8f9fa] text-[#202124] border-[#edf0f2] hover:border-[#dadce0] hover:bg-[#f1f3f4]"
                            }`}
                            title="Hacé click para usar esta cuenta"
                          >
                            <span>{cuenta}</span>
                            {seleccionada && <Check className="w-3 h-3 text-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <p className="text-[10.5px] text-[#80868b] mt-1.5">
                  Se sincroniza con tu cuenta para que esté disponible en cualquier dispositivo.
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

