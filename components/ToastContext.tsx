"use client";
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
  saliendo?: boolean;
  creadoEn: number;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ToastContextType {
  notify: (type: ToastType, message: string, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | null>(null);

const DURACION_MS = 4000;

const ESTILOS: Record<ToastType, { borderClass: string; dotClass: string }> = {
  success: { 
    borderClass: "border-gray-800 hover:border-gray-700",
    dotClass: "bg-emerald-400"
  },
  error: { 
    borderClass: "border-gray-800 hover:border-gray-700",
    dotClass: "bg-rose-400"
  },
  info: { 
    borderClass: "border-gray-800 hover:border-gray-700",
    dotClass: "bg-sky-400"
  },
  warning: { 
    borderClass: "border-gray-800 hover:border-gray-700",
    dotClass: "bg-amber-400"
  },
};

function ToastItem({ toast, onCerrar }: { toast: Toast; onCerrar: (id: number) => void }) {
  const [segundosRestantes, setSegundosRestantes] = React.useState(() => {
    const transcurrido = Date.now() - toast.creadoEn;
    const restante = Math.max(1, Math.ceil((DURACION_MS - transcurrido) / 1000));
    return restante;
  });

  React.useEffect(() => {
    const intervalo = setInterval(() => {
      const transcurrido = Date.now() - toast.creadoEn;
      const restante = Math.max(1, Math.ceil((DURACION_MS - transcurrido) / 1000));
      setSegundosRestantes(restante);
    }, 250);

    return () => clearInterval(intervalo);
  }, [toast.creadoEn]);

  const estilo = ESTILOS[toast.type];

  return (
    <div
      role="status"
      style={{
        animation: toast.saliendo
          ? "va-toast-out 0.22s ease forwards"
          : "va-toast-in 0.3s var(--ease-spring) both",
      }}
      className={`pointer-events-auto relative flex items-center justify-between gap-4 px-5 py-3.5 sm:py-4 min-h-[50px] sm:min-h-[54px] w-fit max-w-[92vw] sm:max-w-2xl bg-[#131314]/95 backdrop-blur-md border ${estilo.borderClass} rounded-2xl shadow-2xl shadow-black/60 transition-all`}
    >
      {/* Mensaje en una sola línea */}
      <p className="text-[13.5px] sm:text-sm font-medium text-gray-200 whitespace-nowrap overflow-hidden text-ellipsis select-none leading-none">
        {toast.message}
      </p>

      {/* Acciones: segundos en texto limpio discreto + botón cerrar */}
      <div className="flex items-center gap-3 flex-shrink-0 pl-1 select-none">
        {/* Contador discreto: sin fondo, texto gris sutil */}
        <span className="text-[11.5px] font-mono text-gray-500 font-medium tabular-nums">
          {segundosRestantes}s
        </span>

        {/* Botón cerrar */}
        <button
          onClick={() => onCerrar(toast.id)}
          aria-label="Cerrar notificación"
          className="p-1 rounded-md text-gray-500 hover:text-gray-200 hover:bg-white/5 transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);

  const cerrar = useCallback((id: number) => {
    // Animamos la salida y luego removemos del DOM
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, saliendo: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 220);
  }, []);

  const notify = useCallback((type: ToastType, message: string, title?: string) => {
    const id = nextId.current++;
    const creadoEn = Date.now();
    setToasts((prev) => [...prev.slice(-3), { id, type, message, title, creadoEn }]);
    setTimeout(() => cerrar(id), DURACION_MS);
  }, [cerrar]);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  const resolverConfirm = (valor: boolean) => {
    confirmState?.resolve(valor);
    setConfirmState(null);
  };

  const success = useCallback((m: string, t?: string) => notify('success', m, t), [notify]);
  const error = useCallback((m: string, t?: string) => notify('error', m, t), [notify]);
  const info = useCallback((m: string, t?: string) => notify('info', m, t), [notify]);
  const warning = useCallback((m: string, t?: string) => notify('warning', m, t), [notify]);

  const api: ToastContextType = React.useMemo(() => ({
    notify,
    success,
    error,
    info,
    warning,
    confirm,
  }), [notify, success, error, info, warning, confirm]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Contenedor de notificaciones: abajo centrado */}
      <div
        aria-live="polite"
        className="fixed z-[9999999] bottom-6 left-0 right-0 flex flex-col gap-2.5 items-center pointer-events-none px-4"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onCerrar={cerrar} />
        ))}
      </div>

      {/* Modal de confirmación global */}
      {confirmState && (
        <div
          className="fixed inset-0 z-[9999999] bg-black/70 backdrop-blur-[4px] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => resolverConfirm(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full p-6 animate-scale-in"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl flex-shrink-0 ${confirmState.destructive ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"}`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  {confirmState.title || "¿Estás seguro?"}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mt-1">{confirmState.message}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => resolverConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition cursor-pointer"
              >
                {confirmState.cancelLabel || "Cancelar"}
              </button>
              <button
                onClick={() => resolverConfirm(true)}
                autoFocus
                className={`flex-1 px-4 py-2.5 rounded-xl text-white text-xs font-bold transition cursor-pointer shadow-sm ${
                  confirmState.destructive ? "bg-red-600 hover:bg-red-700" : "bg-gray-900 hover:bg-gray-800"
                }`}
              >
                {confirmState.confirmLabel || "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
