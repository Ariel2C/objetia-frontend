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

const DURACION_MS = 4500;

const ESTILOS: Record<ToastType, { icon: React.ElementType; iconClass: string; barClass: string }> = {
  success: { icon: CheckCircle2, iconClass: "text-emerald-400", barClass: "bg-emerald-400" },
  error: { icon: XCircle, iconClass: "text-red-400", barClass: "bg-red-400" },
  info: { icon: Info, iconClass: "text-blue-400", barClass: "bg-blue-400" },
  warning: { icon: AlertTriangle, iconClass: "text-amber-400", barClass: "bg-amber-400" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);

  const cerrar = useCallback((id: number) => {
    // Primero animamos la salida y recién después quitamos el toast del DOM
    setToasts(prev => prev.map(t => t.id === id ? { ...t, saliendo: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 220);
  }, []);

  const notify = useCallback((type: ToastType, message: string, title?: string) => {
    const id = nextId.current++;
    setToasts(prev => [...prev.slice(-3), { id, type, message, title }]);
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
        className="fixed z-[100] bottom-6 left-0 right-0 flex flex-col gap-2.5 items-center pointer-events-none px-4"
      >
        {toasts.map((toast) => {
          const estilo = ESTILOS[toast.type];
          const Icono = estilo.icon;
          return (
            <div
              key={toast.id}
              role="status"
              style={{ animation: toast.saliendo ? 'va-toast-out 0.22s ease forwards' : 'va-toast-in 0.3s var(--ease-spring) both' }}
              className="pointer-events-auto relative overflow-hidden w-full sm:w-[380px] max-w-md bg-gray-900 border border-gray-700/60 rounded-2xl shadow-2xl shadow-black/40"
            >
              <div className="flex items-start gap-3 p-4 pr-10">
                <Icono className={`h-5 w-5 flex-shrink-0 mt-0.5 ${estilo.iconClass}`} />
                <div className="min-w-0">
                  {toast.title && (
                    <p className="text-sm font-bold text-white">{toast.title}</p>
                  )}
                  <p className="text-xs text-gray-300 leading-relaxed break-words">{toast.message}</p>
                </div>
              </div>
              <button
                onClick={() => cerrar(toast.id)}
                aria-label="Cerrar notificación"
                className="absolute top-3 right-3 p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {/* Barra de progreso del tiempo restante */}
              {!toast.saliendo && (
                <div
                  className={`absolute bottom-0 left-0 h-0.5 ${estilo.barClass} opacity-80`}
                  style={{ animation: `va-progress ${DURACION_MS}ms linear forwards` }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de confirmación global */}
      {confirmState && (
        <div
          className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 animate-fade-in"
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
