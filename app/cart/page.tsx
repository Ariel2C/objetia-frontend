"use client";
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '../../components/AuthContext';
import { apiFetch, getToken } from '../../lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trash2, Clock, ShieldCheck, CreditCard, Lock, ArrowRight, ShoppingBag, Loader2, Truck, AlertTriangle, Wallet, ExternalLink } from 'lucide-react';
import { useToast } from '../../components/ToastContext';
import Link from 'next/link';
import FormattedPrice from '../../components/FormattedPrice';
import { formatearTituloProducto } from '../../lib/format';

interface CartItem {
  id: number;
  title: string;
  price: number;
  category: string;
  reservation_ttl: number; // TTL en segundos
}

function CartContent() {
  const { usuario, token, cargando, logout } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusParam = searchParams.get('status');
  const orderIdParam = searchParams.get('order_id');

  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [confirmandoPago, setConfirmandoPago] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avisoReserva, setAvisoReserva] = useState<string | null>(null);
  const [checkoutCompletado, setCheckoutCompletado] = useState(false);
  const [orderInfo, setOrderInfo] = useState<{ id: number; price: number } | null>(null);
  const [pagoPendiente, setPagoPendiente] = useState(false);
  const [esperandoPago, setEsperandoPago] = useState<{ orderId: number; linkPago: string } | null>(null);
  const [verificandoManual, setVerificandoManual] = useState(false);
  const confirmacionIntentada = useRef(false);
  const pollingPagoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Estados para dirección de envío (Correo Argentino)
  const [recipientName, setRecipientName] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [floorDept, setFloorDept] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [calculandoEnvio, setCalculandoEnvio] = useState(false);

  // Saldo de la billetera Vamaar usable para comprar dentro de la app
  const [saldoBilletera, setSaldoBilletera] = useState<number>(0);
  const [pagandoConSaldo, setPagandoConSaldo] = useState(false);

  const fetchSaldoBilletera = async () => {
    try {
      const data = await apiFetch<{ balance_spendable?: number; balance_available: number; balance_frozen: number }>(`/wallet/balance/`);
      setSaldoBilletera(data.balance_spendable ?? (data.balance_available + data.balance_frozen));
    } catch {
      setSaldoBilletera(0);
    }
  };

  useEffect(() => {
    if (usuario) fetchSaldoBilletera();
  }, [usuario]);

  const handleCalcularEnvio = async (cp: string) => {
    if (cp.trim().length < 4 || items.length === 0) {
      setShippingCost(null);
      return;
    }
    setCalculandoEnvio(true);
    try {
      const data = await apiFetch<{ shipping_cost: number }>(
        `/orders/shipping-cost/?product_id=${items[0].id}&postal_code=${cp.toUpperCase().trim()}`,
        { auth: false }
      );
      setShippingCost(data.shipping_cost);
    } catch (e) {
      console.error("Error calculando envío:", e);
    } finally {
      setCalculandoEnvio(false);
    }
  };

  // Pre-completar datos de envío desde el perfil del usuario
  useEffect(() => {
    if (usuario) {
      const u = usuario as any;
      if (u.full_name) setRecipientName(u.full_name);
      if (u.street) setStreet(u.street);
      if (u.number) setNumber(u.number);
      if (u.floor_dept) setFloorDept(u.floor_dept);
      if (u.postal_code) {
        setPostalCode(u.postal_code);
        // Si hay items cargados en el carrito, cotizar
        if (items.length > 0) {
          handleCalcularEnvio(u.postal_code);
        }
      }
      if (u.city) setCity(u.city);
      if (u.province) setProvince(u.province);
    }
  }, [usuario, items.length]);

  const fetchCart = async () => {
    if (!getToken() && !token) return;
    setLoadingItems(true);
    setError(null);
    try {
      const data = await apiFetch<CartItem[]>(`/cart/`);
      setItems(data);
    } catch (err: any) {
      if (err.status === 401) {
        logout();
        return;
      }
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (!cargando && !usuario) {
      router.push("/auth");
      return;
    }
    fetchCart();
  }, [usuario, cargando]);

  // Listener para refrescar el carrito al foco/visibilidad
  useEffect(() => {
    const handleRecheck = () => {
      if (document.visibilityState === "visible") {
        fetchCart();
      }
    };
    window.addEventListener("focus", handleRecheck);
    document.addEventListener("visibilitychange", handleRecheck);
    return () => {
      window.removeEventListener("focus", handleRecheck);
      document.removeEventListener("visibilitychange", handleRecheck);
    };
  }, [usuario, token]);

  // Confirmar pago desde el servidor tras el redirect de Mercado Pago.
  // Maneja los tres estados: success (confirma con reintentos), pending y failure.
  useEffect(() => {
    if (!orderIdParam || !usuario || confirmacionIntentada.current) return;

    if (statusParam === 'failure') {
      confirmacionIntentada.current = true;
      setError("El pago fue rechazado o cancelado. No se te cobró nada: podés intentar nuevamente desde tu carrito.");
      router.replace('/cart');
      return;
    }

    if (statusParam === 'pending') {
      confirmacionIntentada.current = true;
      setPagoPendiente(true);
      router.replace('/cart');
      return;
    }

    if (statusParam !== 'success') return;
    confirmacionIntentada.current = true;

    const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const confirmarPagoServidor = async () => {
      setConfirmandoPago(true);
      setError(null);

      // El webhook de MP puede llegar antes o después del redirect: reintentamos
      // la confirmación algunas veces antes de dar un error definitivo.
      const MAX_INTENTOS = 4;
      let ultimoError: any = null;

      for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
        try {
          const data = await apiFetch<{ order_id: number; status: string }>(
            `/orders/confirm-payment/?order_id=${orderIdParam}`,
            { method: 'POST' }
          );
          const estado = await apiFetch<{ total_price: number }>(`/orders/status/?order_id=${data.order_id}`);
          setOrderInfo({ id: data.order_id, price: estado.total_price || 0.0 });
          setCheckoutCompletado(true);
          setItems([]);
          window.dispatchEvent(new Event('cart_updated'));
          ultimoError = null;
          break;
        } catch (err: any) {
          ultimoError = err;
          // 402: MP todavía no registró el pago aprobado; esperamos y reintentamos
          if (err.status === 402 && intento < MAX_INTENTOS) {
            await esperar(2500 * intento);
            continue;
          }
          break;
        }
      }

      if (ultimoError) {
        if (ultimoError.status === 402) {
          setPagoPendiente(true);
        } else {
          setError(ultimoError.message || "No pudimos verificar el pago de tu compra. Revisá 'Mis compras' en unos minutos.");
        }
      }

      setConfirmandoPago(false);
      // Limpiar la URL para evitar re-confirmación al actualizar
      router.replace('/cart');
    };
    confirmarPagoServidor();
  }, [statusParam, orderIdParam, usuario]);

  // Intervalo del temporizador en tiempo real para el TTL de la reserva
  useEffect(() => {
    if (items.length === 0) return;

    const interval = setInterval(() => {
      setItems((prevItems) => {
        const updated = prevItems
          .map((item) => ({
            ...item,
            reservation_ttl: item.reservation_ttl - 1,
          }))
          .filter((item) => item.reservation_ttl > 0); // Limpia automáticamente los expirados de la UI
        
        if (updated.length !== prevItems.length) {
          setAvisoReserva("La reserva de uno o más artículos expiró y fueron liberados. Si todavía los querés, volvé a agregarlos desde el catálogo.");
        }
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [items.length]);

  // Verifica contra el backend (que a su vez consulta a Mercado Pago) si la orden
  // ya tiene un pago aprobado. Devuelve true si se confirmó la compra.
  const verificarPagoOrden = async (orderId: number): Promise<boolean> => {
    try {
      const data = await apiFetch<{ order_id: number; status: string }>(
        `/orders/confirm-payment/?order_id=${orderId}`,
        { method: 'POST' }
      );
      const estado = await apiFetch<{ total_price: number }>(`/orders/status/?order_id=${data.order_id}`);
      detenerPollingConfirmacion();
      setEsperandoPago(null);
      setOrderInfo({ id: data.order_id, price: estado.total_price || 0.0 });
      setCheckoutCompletado(true);
      setItems([]);
      window.dispatchEvent(new Event('cart_updated'));
      return true;
    } catch (err: any) {
      // 402: MP todavía no registró el pago aprobado; seguimos esperando
      if (err?.status && err.status !== 402) {
        console.error("Error verificando el pago:", err);
      }
      return false;
    }
  };

  // Polling de confirmación: como en desarrollo local Mercado Pago no puede
  // redirigir automáticamente a localhost ni enviar webhooks, consultamos el
  // estado del pago cada unos segundos hasta que MP lo apruebe.
  const detenerPollingConfirmacion = () => {
    if (pollingPagoRef.current) {
      clearTimeout(pollingPagoRef.current);
      pollingPagoRef.current = null;
    }
  };

  const iniciarPollingConfirmacion = (orderId: number) => {
    detenerPollingConfirmacion();
    const INTERVALO_MS = 5000;
    const LIMITE_MS = 10 * 60 * 1000; // Igual al TTL de la reserva del carrito
    const inicio = Date.now();

    const intentar = async () => {
      const confirmado = await verificarPagoOrden(orderId);
      if (!confirmado && Date.now() - inicio < LIMITE_MS) {
        pollingPagoRef.current = setTimeout(intentar, INTERVALO_MS);
      }
    };
    pollingPagoRef.current = setTimeout(intentar, INTERVALO_MS);
  };

  useEffect(() => detenerPollingConfirmacion, []);

  const handleRemoverItem = async (productId: number) => {
    try {
      await apiFetch(`/cart/remove/${productId}`, { method: 'DELETE' });
      setItems(items.filter((item) => item.id !== productId));
      window.dispatchEvent(new Event('cart_updated'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckout = async (productId: number) => {
    setError(null);
    if (!recipientName.trim() || !street.trim() || !number.trim() || !postalCode.trim() || !city.trim() || !province.trim()) {
      setError("Por favor completá todos los campos obligatorios de la Dirección de Envío antes de realizar el pago.");
      return;
    }

    setLoadingItems(true);
    try {
      // El costo de envío lo calcula y valida el servidor a partir del código postal
      const queryParams = new URLSearchParams({
        product_id: productId.toString(),
        recipient_name: recipientName.trim(),
        street: street.trim(),
        number: number.trim(),
        floor_dept: floorDept.trim(),
        postal_code: postalCode.toUpperCase().trim(),
        city: city.trim(),
        province: province.trim()
      });

      const data = await apiFetch<any>(`/orders/checkout/?${queryParams.toString()}`, { method: 'POST' });

      const linkPago = data.init_point || data.sandbox_init_point;
      if (!linkPago || !data.order_id) {
        throw new Error("No se pudo obtener el enlace de pago de Mercado Pago.");
      }

      setLoadingItems(false);

      // Abrir el checkout de MP en una pestaña nueva: el modal (iframe) no puede
      // volver a localhost y dejaba la página bloqueada al cancelar.
      setEsperandoPago({ orderId: data.order_id, linkPago });
      iniciarPollingConfirmacion(data.order_id);
      const ventana = window.open(linkPago, '_blank');
      if (!ventana) {
        // Popup bloqueado por el navegador: navegamos en esta misma pestaña
        window.location.href = linkPago;
      }
    } catch (err: any) {
      setError(err.message || "Fallo en el servidor al procesar el pago.");
      setLoadingItems(false);
    }
  };

  const handleVerificarPagoManual = async () => {
    if (!esperandoPago) return;
    setVerificandoManual(true);
    const confirmado = await verificarPagoOrden(esperandoPago.orderId);
    setVerificandoManual(false);
    if (!confirmado) {
      toast.info("Mercado Pago todavía no registró el pago. Si ya pagaste, esperá unos segundos: lo detectamos automáticamente.");
    }
  };

  const handleCancelarEsperaPago = () => {
    detenerPollingConfirmacion();
    setEsperandoPago(null);
    fetchCart();
  };

  const handleCheckoutConSaldo = async (productId: number) => {
    setError(null);
    if (!recipientName.trim() || !street.trim() || !number.trim() || !postalCode.trim() || !city.trim() || !province.trim()) {
      setError("Por favor completá todos los campos obligatorios de la Dirección de Envío antes de realizar el pago.");
      return;
    }

    const item = items.find(i => i.id === productId);
    const totalEstimado = (item?.price || 0) + (shippingCost || 0);

    const confirmar = await toast.confirm({
      title: "Pagar con saldo Vamaar",
      message: `Se van a debitar ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(totalEstimado)} de tu billetera (producto + envío). ¿Confirmás la compra?`,
      confirmLabel: "Pagar con saldo",
    });
    if (!confirmar) return;

    setPagandoConSaldo(true);
    try {
      const queryParams = new URLSearchParams({
        product_id: productId.toString(),
        recipient_name: recipientName.trim(),
        street: street.trim(),
        number: number.trim(),
        floor_dept: floorDept.trim(),
        postal_code: postalCode.toUpperCase().trim(),
        city: city.trim(),
        province: province.trim()
      });

      const data = await apiFetch<{ order_id: number; total_pagado: number }>(
        `/orders/checkout-with-balance/?${queryParams.toString()}`,
        { method: 'POST' }
      );

      toast.success("La compra se pagó con tu saldo Vamaar.", "¡Compra exitosa!");
      setOrderInfo({ id: data.order_id, price: data.total_pagado });
      setCheckoutCompletado(true);
      setItems(prev => prev.filter(i => i.id !== productId));
      window.dispatchEvent(new Event('cart_updated'));
      fetchSaldoBilletera();
    } catch (err: any) {
      toast.error(err.message || "No se pudo completar el pago con saldo.");
    } finally {
      setPagandoConSaldo(false);
    }
  };

  const formatearTiempo = (segundos: number) => {
    if (segundos <= 0) return "Expirado";
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Pantalla de espera mientras el usuario paga en la pestaña de Mercado Pago
  if (esperandoPago && !checkoutCompletado) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="h-16 w-16 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Esperando tu pago</h1>
        <p className="text-sm text-gray-500 mt-3 leading-relaxed">
          Completá el pago en la pestaña de <strong>Mercado Pago</strong> que se abrió.
          Apenas se acredite lo detectamos automáticamente y vas a ver acá la confirmación
          de tu compra, sin necesidad de volver manualmente.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <button
            onClick={handleVerificarPagoManual}
            disabled={verificandoManual}
            className="px-6 py-3 bg-gray-950 text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-gray-800 transition active:scale-95 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {verificandoManual && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Ya pagué, verificar ahora
          </button>
          <a
            href={esperandoPago.linkPago}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 border border-gray-200 text-gray-700 rounded-2xl font-bold text-xs uppercase tracking-wider hover:border-gray-400 transition flex items-center justify-center gap-2"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Reabrir Mercado Pago
          </a>
        </div>
        <button
          onClick={handleCancelarEsperaPago}
          className="mt-5 text-xs font-bold text-gray-400 hover:text-gray-700 underline underline-offset-4 transition cursor-pointer"
        >
          Cancelar y volver al carrito
        </button>
      </div>
    );
  }

  if (confirmandoPago) {
    return (
      <div className="min-h-[calc(100vh-180px)] flex flex-col items-center justify-center text-center p-8 bg-gray-50/50">
        <Loader2 className="h-12 w-12 text-[var(--color-primary)] animate-spin mb-4" />
        <h3 className="text-base font-bold text-gray-800">Verificando tu pago</h3>
        <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
          Mercado Pago está confirmando la transacción. Aguardá unos instantes, estamos registrando tu orden de compra segura...
        </p>
      </div>
    );
  }

  // Pantalla de pago pendiente (MP puede demorar, ej. pago en efectivo o revisión)
  if (pagoPendiente) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="h-16 w-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pago en proceso</h1>
        <p className="text-sm text-gray-500 mt-3 leading-relaxed">
          Mercado Pago todavía está procesando tu pago. Apenas se acredite, tu orden se
          confirmará automáticamente y vas a poder verla en <strong>Mis compras</strong>.
          No es necesario que vuelvas a pagar.
        </p>
        <Link href="/purchases" className="inline-block mt-8 px-8 py-3.5 bg-gray-950 text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-gray-800 transition active:scale-95">
          Ver mis compras
        </Link>
      </div>
    );
  }

  if (cargando || (loadingItems && items.length === 0 && !checkoutCompletado)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Pantalla de Éxito de Compra
  if (checkoutCompletado && orderInfo) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">¡Compra Exitosa!</h1>
        <p className="text-sm text-gray-500 mt-2">
          El pago se procesó de forma segura y tu dinero queda en garantía hasta que recibas el producto. Le avisamos al vendedor para que prepare y despache tu compra: podés seguir el estado desde "Mis compras".
        </p>

        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 my-8 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">ID de Orden:</span>
            <span className="font-semibold text-gray-800">#{orderInfo.id}</span>
          </div>
          <div className="border-t border-gray-200 pt-3 flex justify-between text-base font-bold">
            <span className="text-gray-800">Total debitado (con envío):</span>
            <FormattedPrice price={orderInfo.price} className="text-emerald-700 text-base font-black" />
          </div>
        </div>

        <Link href="/catalog" className="inline-block px-8 py-3.5 bg-gray-950 text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-gray-800 transition active:scale-95">
          Seguir comprando
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce((acc, item) => acc + item.price, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in">
      <div className="mb-6 lg:mb-10 pb-4 border-b border-gray-100">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tu Carrito</h1>
        <p className="text-sm text-gray-500">Reservaciones temporales activas en la memoria del servidor.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm mb-8 font-semibold">
          ⚠️ Error: {error}
        </div>
      )}

      {avisoReserva && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-sm mb-8 font-semibold flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{avisoReserva}</span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl shadow-sm max-w-2xl mx-auto">
          <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-700">Tu carrito está vacío</h3>
          <p className="text-sm text-gray-400 mt-1">Los artículos que agregues se reservarán exclusivamente por 10 minutos.</p>
          <Link href="/catalog" className="inline-block mt-6 px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-gray-800 transition">
            Ver catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Listado de Productos Reservados */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div 
                key={item.id}
                className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:shadow-md transition duration-300 animate-slide-up"
              >
                <div className="flex-grow">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.category}</span>
                  <h3 className="text-sm font-bold text-gray-800 hover:text-[var(--color-primary)] transition line-clamp-1">
                    {formatearTituloProducto(item.title)}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <FormattedPrice price={item.price} className="text-base font-black text-gray-900" />
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                  {/* Temporizador TTL */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/50 text-xs font-bold animate-pulse">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatearTiempo(item.reservation_ttl)}</span>
                  </div>

                  <button 
                    onClick={() => handleRemoverItem(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Remover de mi carrito"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Formulario de Dirección de Envío */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-semibold leading-7 text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Truck className="h-5 w-5 text-slate-700" /> Dirección de Envío (Correo Argentino)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-slate-700 block mb-1">Nombre Completo del Destinatario *</label>
                  <input
                    type="text"
                    required
                    placeholder="Lucia Fernández"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] text-slate-800 bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Calle *</label>
                  <input
                    type="text"
                    required
                    placeholder="Av. Colón"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] text-slate-800 bg-white transition"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Número *</label>
                    <input
                      type="text"
                      required
                      placeholder="1234"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] text-slate-800 bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Piso/Depto</label>
                    <input
                      type="text"
                      placeholder="2° B"
                      value={floorDept}
                      onChange={(e) => setFloorDept(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] text-slate-800 bg-white transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Código Postal *</label>
                  <input
                    type="text"
                    required
                    placeholder="X5000"
                    value={postalCode}
                    onChange={(e) => {
                      setPostalCode(e.target.value);
                      if (e.target.value.trim().length >= 4) {
                        handleCalcularEnvio(e.target.value);
                      } else {
                        setShippingCost(null);
                      }
                    }}
                    onBlur={(e) => handleCalcularEnvio(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] text-slate-800 bg-white transition font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Ciudad / Localidad *</label>
                  <input
                    type="text"
                    required
                    placeholder="Córdoba"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] text-slate-800 bg-white transition"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-slate-700 block mb-1">Provincia *</label>
                  <input
                    type="text"
                    required
                    placeholder="Córdoba"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] text-slate-800 bg-white transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Checkout & Detalles Financieros */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6 sticky top-24">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-600" /> Resumen de Compra
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal de muebles:</span>
                  <FormattedPrice price={subtotal} className="font-semibold text-gray-800" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Costo de envío:</span>
                  {calculandoEnvio ? (
                    <span className="text-xs text-gray-400 animate-pulse">Calculando...</span>
                  ) : shippingCost !== null ? (
                    <FormattedPrice price={shippingCost} className="font-semibold text-gray-800" />
                  ) : (
                    <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Ingresá CP</span>
                  )}
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-bold">
                  <span className="text-gray-800">Total estimado:</span>
                  {shippingCost !== null ? (
                    <FormattedPrice price={subtotal + shippingCost} className="text-gray-950 text-base font-black" />
                  ) : (
                    <span className="text-gray-950 text-base font-black flex items-center gap-1">
                      <FormattedPrice price={subtotal} />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider relative -top-[0.2em]">+ envío</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Botón de Checkout Único (por Mueble ya que son piezas exclusivas) */}
              <div className="space-y-3">
                <p className="text-[10px] text-gray-400 leading-normal">
                  * Debido a la naturaleza exclusiva C2C de decoración, las compras se procesan de forma individual por artículo para gestionar su respectiva dirección de despacho.
                </p>
                {items.map((item) => {
                  const totalItem = item.price + (shippingCost || 0);
                  const alcanzaSaldo = shippingCost !== null && saldoBilletera >= totalItem;
                  return (
                    <div key={item.id} className="space-y-2">
                      <button
                        onClick={() => handleCheckout(item.id)}
                        disabled={shippingCost === null || calculandoEnvio || pagandoConSaldo}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-900 text-white font-semibold text-xs uppercase tracking-wider hover:bg-[var(--color-secondary)] hover:text-gray-900 transition active:scale-98 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>Pagar "{formatearTituloProducto(item.title).substring(0, 15)}..."</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      {alcanzaSaldo && (
                        <button
                          onClick={() => handleCheckoutConSaldo(item.id)}
                          disabled={pagandoConSaldo || calculandoEnvio}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-emerald-600 text-emerald-700 bg-emerald-50/50 font-semibold text-xs uppercase tracking-wider hover:bg-emerald-600 hover:text-white transition active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="flex items-center gap-1.5">
                            {pagandoConSaldo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                            Pagar con saldo Vamaar
                          </span>
                          <FormattedPrice price={saldoBilletera} className="text-[10px] font-bold normal-case" />
                        </button>
                      )}
                    </div>
                  );
                })}
                {saldoBilletera > 0 && shippingCost !== null && items.some(i => saldoBilletera < i.price + (shippingCost || 0)) && (
                  <p className="text-[10px] text-gray-400 leading-normal flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 flex-shrink-0" />
                    Tenés <FormattedPrice price={saldoBilletera} className="font-bold" /> de saldo Vamaar, pero no alcanza para cubrir el total con envío.
                  </p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 flex items-center gap-2.5 text-xs text-gray-400 leading-normal">
                <Lock className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Pago asegurado vía Mercado Pago. El dinero se retiene en Escrow para tu seguridad.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CartContent />
    </Suspense>
  );
}
