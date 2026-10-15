"use client";
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '../../components/AuthContext';
import { apiFetch, getToken } from '../../lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Trash2, Clock, ShieldCheck, CreditCard, Lock, ArrowRight, ShoppingBag, 
  Loader2, Truck, AlertTriangle, Wallet, ExternalLink, Gift, Check, 
  MapPin, Plus, Edit2, ArrowLeft, ChevronRight, CheckCircle2, Sparkles, Tag 
} from 'lucide-react';
import { useToast } from '../../components/ToastContext';
import Link from 'next/link';
import FormattedPrice from '../../components/FormattedPrice';
import { formatearTituloProducto } from '../../lib/format';

export interface UserAddress {
  id: number;
  title: string;
  street: string;
  number: string;
  floor_dept?: string | null;
  postal_code?: string | null;
  city: string;
  province: string;
  is_default: boolean;
  lat?: number | null;
  lng?: number | null;
}

interface CartItem {
  id: number;
  title: string;
  price: number;
  category: string;
  image_url?: string;
  availability?: 'AVAILABLE' | 'IN_CHECKOUT' | 'SOLD' | 'PAUSED';
  price_at_add?: number;
  price_changed?: boolean;
  added_at?: string;
  reservation_ttl?: number;
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
  const [esperandoPago, setEsperandoPago] = useState<{ orderId: number; linkPago: string; productId: number } | null>(null);
  const [verificandoManual, setVerificandoManual] = useState(false);
  const confirmacionIntentada = useRef(false);
  const pollingPagoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Control de flujo de pasos: 'carrito' (revisar artículos) o 'checkout' (seleccionar dirección y pago)
  const [pasoActual, setPasoActual] = useState<'carrito' | 'checkout'>('carrito');

  // Costos de envío calculados individualmente para cada artículo { [productId]: number }
  const [shippingCosts, setShippingCosts] = useState<Record<number, number>>({});
  const [calculandoEnvios, setCalculandoEnvios] = useState(false);
  const [activePostalCode, setActivePostalCode] = useState<string>("");

  // Control del cupón de bienvenida primera compra
  const [aplicarCuponBienvenida, setAplicarCuponBienvenida] = useState<boolean>(true);

  // Estados para dirección de envío (Correo Argentino)
  const [recipientName, setRecipientName] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [floorDept, setFloorDept] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");

  // Direcciones guardadas del usuario
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | 'manual' | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showManualAddressForm, setShowManualAddressForm] = useState(false);

  // Saldo de la billetera Vamaar/Objetia
  const [saldoBilletera, setSaldoBilletera] = useState<number>(0);
  const [pagandoConSaldo, setPagandoConSaldo] = useState(false);
  const [comprasPreviasCount, setComprasPreviasCount] = useState<number | null>(null);

  const fetchSaldoBilletera = async () => {
    try {
      const data = await apiFetch<{ balance_spendable?: number; balance_available: number; balance_frozen: number }>(`/wallet/balance/`);
      setSaldoBilletera(data.balance_spendable ?? (data.balance_available + data.balance_frozen));
    } catch {
      setSaldoBilletera(0);
    }
  };

  const fetchComprasPrevias = async () => {
    try {
      const data = await apiFetch<any[]>(`/orders/my-orders/`);
      setComprasPreviasCount(Array.isArray(data) ? data.length : 0);
    } catch {
      setComprasPreviasCount(0);
    }
  };

  /**
   * Calcula el costo de envío individual para CADA producto del carrito
   * usando el código postal de destino proporcionado.
   */
  const handleCalcularEnvios = async (cp: string, currentItems?: CartItem[]) => {
    const activeItems = currentItems ?? items;
    const cleanCp = cp.toUpperCase().trim();
    if (cleanCp.length < 4 || activeItems.length === 0) {
      setShippingCosts({});
      return;
    }
    setCalculandoEnvios(true);
    try {
      const resultados = await Promise.all(
        activeItems.map(async (item) => {
          try {
            const data = await apiFetch<{ shipping_cost: number }>(
              `/orders/shipping-cost/?product_id=${item.id}&postal_code=${cleanCp}`,
              { auth: false }
            );
            return { id: item.id, cost: data.shipping_cost };
          } catch (e) {
            console.error(`Error calculando envío para item ${item.id}:`, e);
            return { id: item.id, cost: null };
          }
        })
      );
      const newCosts: Record<number, number> = {};
      resultados.forEach((r) => {
        if (r.cost !== null) {
          newCosts[r.id] = r.cost;
        }
      });
      setShippingCosts(newCosts);
    } finally {
      setCalculandoEnvios(false);
    }
  };

  /**
   * Aplica una dirección guardada. Si el código postal difiere del que se usó
   * previamente para calcular el envío, se vuelven a calcular los envíos de todos los artículos.
   */
  const applyAddress = (addr: UserAddress) => {
    setSelectedAddressId(addr.id);
    setShowManualAddressForm(false);
    setStreet(addr.street || "");
    setNumber(addr.number || "");
    setFloorDept(addr.floor_dept || "");
    setCity(addr.city || "");
    setProvince(addr.province || "");

    const newCp = (addr.postal_code || "").toUpperCase().trim();
    setPostalCode(newCp);

    if (newCp && newCp !== activePostalCode) {
      setActivePostalCode(newCp);
      handleCalcularEnvios(newCp);
      toast.info(`Recalculando envíos para el código postal ${newCp}...`);
    } else if (!newCp) {
      setShippingCosts({});
    }
  };

  const handleSelectManualAddress = () => {
    setSelectedAddressId('manual');
    setShowManualAddressForm(true);
    setStreet("");
    setNumber("");
    setFloorDept("");
    setPostalCode("");
    setCity("");
    setProvince("");
    setShippingCosts({});
    setActivePostalCode("");
  };

  const fetchAddresses = async () => {
    if (!getToken() && !token) return;
    setLoadingAddresses(true);
    try {
      const data = await apiFetch<UserAddress[]>('/auth/addresses');
      const addrs = Array.isArray(data) ? data : [];
      setSavedAddresses(addrs);

      if (addrs.length > 0) {
        // Encontrar la dirección predeterminada
        const def = addrs.find(a => a.is_default) || addrs[0];
        setSelectedAddressId(def.id);
        setStreet(def.street || "");
        setNumber(def.number || "");
        setFloorDept(def.floor_dept || "");
        setCity(def.city || "");
        setProvince(def.province || "");
        const cp = (def.postal_code || "").toUpperCase().trim();
        setPostalCode(cp);
        if (cp) {
          setActivePostalCode(cp);
          handleCalcularEnvios(cp);
        }
      } else {
        setSelectedAddressId('manual');
        setShowManualAddressForm(true);
        const u = usuario as any;
        if (u) {
          if (u.street) setStreet(u.street);
          if (u.number) setNumber(u.number);
          if (u.floor_dept) setFloorDept(u.floor_dept);
          if (u.postal_code) {
            const cp = u.postal_code.toUpperCase().trim();
            setPostalCode(cp);
            setActivePostalCode(cp);
            handleCalcularEnvios(cp);
          }
          if (u.city) setCity(u.city);
          if (u.province) setProvince(u.province);
        }
      }
    } catch (err) {
      console.warn("Error cargando direcciones en carrito:", err);
      setSelectedAddressId('manual');
      setShowManualAddressForm(true);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (usuario) {
      const u = usuario as any;
      if (u.full_name && !recipientName) {
        setRecipientName(u.full_name);
      }
      fetchSaldoBilletera();
      fetchComprasPrevias();
      fetchAddresses();
    }
  }, [usuario]);

  // Si los items se cargan o cambian, y ya tenemos un CP activo, calcular envíos
  useEffect(() => {
    if (items.length > 0 && activePostalCode && activePostalCode.trim().length >= 4 && !calculandoEnvios) {
      const faltanCalcular = items.some(item => typeof shippingCosts[item.id] !== 'number');
      if (faltanCalcular) {
        handleCalcularEnvios(activePostalCode, items);
      }
    }
  }, [items, activePostalCode]);

  const fetchCart = async () => {
    if (!getToken() && !token) return;
    setLoadingItems(true);
    setError(null);
    try {
      const data = await apiFetch<CartItem[]>(`/cart/`);
      const enriched = await Promise.all(
        (data || []).map(async (item) => {
          if (!item.image_url) {
            try {
              const prod = await apiFetch<any>(`/products/${item.id}`);
              const img = (prod.images && prod.images.length > 0) ? prod.images[0] : (prod.image_url || '');
              return { ...item, image_url: img };
            } catch {
              return item;
            }
          }
          return item;
        })
      );
      setItems(enriched);
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

  // Confirmar pago desde el servidor tras el redirect de Mercado Pago
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
      router.replace('/cart');
    };
    confirmarPagoServidor();
  }, [statusParam, orderIdParam, usuario]);

  // El carrito es persistente: los artículos se mantienen en PostgreSQL sin expirar solos.

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
      if (err?.status && err.status !== 402) {
        console.error("Error verificando el pago:", err);
      }
      return false;
    }
  };

  const detenerPollingConfirmacion = () => {
    if (pollingPagoRef.current) {
      clearTimeout(pollingPagoRef.current);
      pollingPagoRef.current = null;
    }
  };

  const iniciarPollingConfirmacion = (orderId: number) => {
    detenerPollingConfirmacion();
    const INTERVALO_MS = 5000;
    const LIMITE_MS = 10 * 60 * 1000;
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
      setItems(prev => prev.filter((item) => item.id !== productId));
      setShippingCosts(prev => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      window.dispatchEvent(new Event('cart_updated'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleContinuarACompra = () => {
    setError(null);
    const articulosDisponibles = items.filter(i => (i.availability ?? 'AVAILABLE') === 'AVAILABLE');
    if (articulosDisponibles.length === 0) {
      setError("No tenés artículos disponibles para comprar en este momento. Si alguno está en proceso de compra por otro comprador o agotado, podés esperar unos minutos o quitarlo del carrito.");
      return;
    }
    setPasoActual('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVolverAlCarrito = () => {
    setPasoActual('carrito');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckout = async (productId: number) => {
    setError(null);
    if (!recipientName.trim() || !street.trim() || !number.trim() || !postalCode.trim() || !city.trim() || !province.trim()) {
      setError("Por favor completá todos los campos obligatorios de la Dirección de Envío antes de realizar el pago.");
      return;
    }

    setLoadingItems(true);
    try {
      const queryParams = new URLSearchParams({
        product_id: productId.toString(),
        recipient_name: recipientName.trim(),
        street: street.trim(),
        number: number.trim(),
        floor_dept: floorDept.trim(),
        postal_code: postalCode.toUpperCase().trim(),
        city: city.trim(),
        province: province.trim(),
        apply_welcome_coupon: (aplicarCuponBienvenida && calificaRegalo5k).toString()
      });

      const data = await apiFetch<any>(`/orders/checkout/?${queryParams.toString()}`, { method: 'POST' });

      const linkPago = data.init_point || data.sandbox_init_point;
      if (!linkPago || !data.order_id) {
        throw new Error("No se pudo obtener el enlace de pago de Mercado Pago.");
      }

      setLoadingItems(false);
      setEsperandoPago({ orderId: data.order_id, linkPago, productId });
      iniciarPollingConfirmacion(data.order_id);
      const ventana = window.open(linkPago, '_blank');
      if (!ventana) {
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

  const handleCancelarEsperaPago = async () => {
    detenerPollingConfirmacion();
    if (esperandoPago) {
      try {
        await apiFetch(`/orders/cancel-checkout/${esperandoPago.productId}`, { method: 'POST' });
      } catch (e) {
        console.error("Error liberando checkout lock:", e);
      }
    }
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
    const itemShipping = shippingCosts[productId] || 0;
    const descuentoEstimado = (aplicarCuponBienvenida && calificaRegalo5k) ? 5000 : 0;
    const totalEstimado = Math.max(0, (item?.price || 0) + itemShipping - descuentoEstimado);

    const confirmar = await toast.confirm({
      title: "Pagar con saldo Objetia",
      message: `Se van a debitar ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(totalEstimado)} de tu billetera (producto + envío${descuentoEstimado > 0 ? ' con descuento de cupón' : ''}). ¿Confirmás la compra?`,
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
        province: province.trim(),
        apply_welcome_coupon: (aplicarCuponBienvenida && calificaRegalo5k).toString()
      });

      const data = await apiFetch<{ order_id: number; total_pagado: number }>(
        `/orders/checkout-with-balance/?${queryParams.toString()}`,
        { method: 'POST' }
      );

      toast.success("La compra se pagó con tu saldo Objetia.", "¡Compra exitosa!");
      setOrderInfo({ id: data.order_id, price: data.total_pagado });
      setCheckoutCompletado(true);
      setItems(prev => prev.filter(i => i.id !== productId));
      setShippingCosts(prev => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
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
        <Link href="/mi-objetia" className="inline-block mt-8 px-8 py-3.5 bg-gray-950 text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-gray-800 transition active:scale-95">
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

  // Cálculos financieros basados en los artículos disponibles para compra
  const articulosDisponibles = items.filter(i => (i.availability ?? 'AVAILABLE') === 'AVAILABLE');
  const subtotal = articulosDisponibles.reduce((acc, item) => acc + item.price, 0);
  const totalEnvios = articulosDisponibles.reduce((acc, item) => acc + (shippingCosts[item.id] || 0), 0);
  const todosEnviosCalculados = articulosDisponibles.length > 0 && articulosDisponibles.every(item => typeof shippingCosts[item.id] === 'number');

  // Lógica del cupón primera compra ($5.000 de regalo para compras >= $50.000)
  const esPrimeraCompra = Boolean(usuario && (comprasPreviasCount === 0 || comprasPreviasCount === null));
  const calificaRegalo5k = esPrimeraCompra && subtotal >= 50000;
  const descuentoBienvenida = (calificaRegalo5k && aplicarCuponBienvenida) ? 5000 : 0;
  const totalFinal = Math.max(0, subtotal + totalEnvios - descuentoBienvenida);

  // Dirección predeterminada para feedback visual
  const defaultAddress = savedAddresses.find(a => a.is_default) || savedAddresses[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in">
      
      {/* HEADER Y BREADCRUMB / STEPPER */}
      <div className="mb-6 lg:mb-8 pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Checkout Objetia
            </span>
            <span className="text-gray-300">/</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              {pasoActual === 'carrito' ? '1. Revisar Artículos' : '2. Envío y Pago'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {pasoActual === 'carrito' ? 'Tu carrito' : 'Dirección de envío y pago'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {pasoActual === 'carrito' 
              ? `${items.length} ${items.length === 1 ? 'artículo en tu carrito.' : 'artículos en tu carrito.'}` 
              : 'Elegí dónde recibir tus objetos y completá tu compra segura.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pasoActual === 'checkout' ? (
            <button
              onClick={handleVolverAlCarrito}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a los artículos</span>
            </button>
          ) : (
            <Link
              href="/catalog"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition cursor-pointer"
            >
              <span>+ Seguir explorando</span>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm mb-6 font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {avisoReserva && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm mb-6 font-semibold flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{avisoReserva}</span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-20 px-4 bg-white border border-gray-200 rounded-2xl shadow-xs max-w-xl mx-auto">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400">
            <ShoppingBag className="h-6 w-6 stroke-[1.5]" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
            Por ahora, está vacío.
          </h3>
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
            Podés agregar varios artículos únicos al carrito y coordinar su envío en un solo lugar.
          </p>
          <Link 
            href="/catalog" 
            className="inline-flex items-center gap-2 mt-7 px-7 py-3 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xs hover:shadow cursor-pointer"
          >
            Descubrir objetos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ============================================================== */}
          {/* COLUMNA PRINCIPAL IZQUIERDA: PASO 1 (CARRITO) O PASO 2 (ENVÍO) */}
          {/* ============================================================== */}
          <div className="lg:col-span-2 space-y-6">

            {/* PASO 1: VISTA DE ARTÍCULOS EN EL CARRITO */}
            {pasoActual === 'carrito' && (
              <div className="space-y-3">
                {items.map((item) => {
                  const isAvailable = (item.availability ?? 'AVAILABLE') === 'AVAILABLE';
                  const isInCheckout = item.availability === 'IN_CHECKOUT';
                  const isSold = item.availability === 'SOLD';
                  const isPaused = item.availability === 'PAUSED';

                  return (
                    <div 
                      key={item.id}
                      className={`border rounded-xl p-3 sm:p-4 shadow-xs flex items-center justify-between gap-3 sm:gap-4 transition duration-200 animate-slide-up ${
                        !isAvailable ? 'bg-gray-50/70 border-gray-200 opacity-80' : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* 1. Foto */}
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.title} 
                            className={`w-full h-full object-cover ${!isAvailable ? 'grayscale' : ''}`}
                          />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-gray-400" />
                        )}
                      </div>

                      {/* 2. Titulo */}
                      <div className="flex-1 min-w-0">
                        {item.category && (
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block truncate">
                            {item.category}
                          </span>
                        )}
                        <h3 className="text-sm font-semibold text-gray-900 truncate" title={item.title}>
                          {formatearTituloProducto(item.title)}
                        </h3>
                        {isInCheckout && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                            <Clock className="w-3 h-3 text-amber-600 animate-pulse shrink-0" />
                            <span className="truncate">En proceso de compra por otro usuario</span>
                          </span>
                        )}
                        {isSold && (
                          <span className="text-[11px] font-medium text-red-600 block">
                            Vendido
                          </span>
                        )}
                        {isPaused && (
                          <span className="text-[11px] font-medium text-gray-500 block">
                            Pausado
                          </span>
                        )}
                        {item.price_changed && item.price_at_add && (
                          <span className="text-[10px] text-blue-600 block">
                            Precio actualizado (antes ${item.price_at_add.toLocaleString('es-AR')})
                          </span>
                        )}
                      </div>

                      {/* 3. Precio */}
                      <div className="shrink-0 text-right">
                        <FormattedPrice price={item.price} className="text-sm sm:text-base font-bold text-gray-900" />
                      </div>

                      {/* 4. Boton para eliminar */}
                      <div className="shrink-0">
                        <button 
                          onClick={() => handleRemoverItem(item.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Remover del carrito"
                          aria-label="Remover del carrito"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* PASO 2: SELECCIÓN DE DIRECCIÓN DE ENVÍO Y RECALCULO AUTOMÁTICO */}
            {pasoActual === 'checkout' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Selector de Direcciones */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-indigo-600" /> 
                      Elegí la dirección de envío
                    </h3>
                    <Link
                      href="/mi-objetia"
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1"
                    >
                      <span>Gestionar mis direcciones</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Nombre Completo del Destinatario */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Nombre Completo del Destinatario *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Lucia Fernández"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-800 bg-white transition placeholder:text-gray-400"
                    />
                  </div>

                  {/* Listado de direcciones guardadas */}
                  {loadingAddresses ? (
                    <div className="flex items-center justify-center py-6 text-gray-400 text-xs gap-2 border border-gray-100 rounded-xl bg-gray-50/50">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                      <span>Cargando tus direcciones guardadas...</span>
                    </div>
                  ) : savedAddresses.length > 0 ? (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-700">
                          Seleccioná una dirección para recibir tus compras:
                        </label>
                        {selectedAddressId !== 'manual' && (
                          <button
                            type="button"
                            onClick={() => setShowManualAddressForm(!showManualAddressForm)}
                            className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>{showManualAddressForm ? "Ocultar edición" : "Modificar campos"}</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {savedAddresses.map((addr) => {
                          const isSelected = selectedAddressId === addr.id;
                          return (
                            <div
                              key={addr.id}
                              onClick={() => applyAddress(addr)}
                              className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between text-left relative ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-50/30 shadow-xs'
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <span className="text-xs font-bold text-gray-900 truncate">
                                    {addr.title || "Dirección"}
                                  </span>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {addr.is_default && (
                                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                        Predeterminada
                                      </span>
                                    )}
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                      isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 bg-white'
                                    }`}>
                                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                    </div>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-800 font-medium leading-snug">
                                  {addr.street} {addr.number} {addr.floor_dept ? `(${addr.floor_dept})` : ''}
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                  {addr.city}, {addr.province} {addr.postal_code ? `· CP ${addr.postal_code}` : ''}
                                </p>
                              </div>
                            </div>
                          );
                        })}

                        {/* Opción para usar otra dirección */}
                        <div
                          onClick={handleSelectManualAddress}
                          className={`p-4 rounded-xl border-2 border-dashed transition cursor-pointer flex flex-col items-center justify-center min-h-[96px] text-center ${
                            selectedAddressId === 'manual'
                              ? 'border-indigo-600 bg-indigo-50/30 text-indigo-700'
                              : 'border-gray-300 hover:border-gray-400 bg-gray-50/50 text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          <Plus className="w-4 h-4 mb-1 text-indigo-600" />
                          <span className="text-xs font-bold">Usar otra dirección</span>
                          <span className="text-[10px] text-gray-400">Ingresar datos manualmente</span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Formulario de campos de dirección */}
                  {(showManualAddressForm || selectedAddressId === 'manual' || savedAddresses.length === 0) && (
                    <div className={`space-y-4 pt-3 ${savedAddresses.length > 0 ? 'border-t border-gray-100 mt-3' : ''}`}>
                      {savedAddresses.length > 0 && selectedAddressId === 'manual' && (
                        <div className="flex items-center justify-between bg-amber-50/70 border border-amber-200/80 px-3 py-2 rounded-lg text-xs text-amber-800">
                          <span>Ingresando una dirección alternativa para este envío.</span>
                          <button
                            type="button"
                            onClick={() => {
                              const def = savedAddresses.find(a => a.is_default) || savedAddresses[0];
                              if (def) applyAddress(def);
                            }}
                            className="font-semibold text-amber-900 underline hover:no-underline ml-2 cursor-pointer"
                          >
                            Volver a mis direcciones
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-700 block mb-1">Calle *</label>
                          <input
                            type="text"
                            required
                            placeholder="Av. Colón"
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                            className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-900 text-gray-800 bg-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-semibold text-gray-700 block mb-1">Número *</label>
                            <input
                              type="text"
                              required
                              placeholder="1234"
                              value={number}
                              onChange={(e) => setNumber(e.target.value)}
                              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-900 text-gray-800 bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-700 block mb-1">Piso/Depto</label>
                            <input
                              type="text"
                              placeholder="2° B"
                              value={floorDept}
                              onChange={(e) => setFloorDept(e.target.value)}
                              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-900 text-gray-800 bg-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 block mb-1">Código Postal *</label>
                          <input
                            type="text"
                            required
                            placeholder="X5000"
                            value={postalCode}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              setPostalCode(val);
                              if (val.trim().length >= 4) {
                                if (val.trim() !== activePostalCode) {
                                  setActivePostalCode(val.trim());
                                  handleCalcularEnvios(val.trim());
                                }
                              } else {
                                setShippingCosts({});
                              }
                            }}
                            className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-900 text-gray-800 bg-white font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 block mb-1">Ciudad / Localidad *</label>
                          <input
                            type="text"
                            required
                            placeholder="Córdoba"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-900 text-gray-800 bg-white"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-semibold text-gray-700 block mb-1">Provincia *</label>
                          <input
                            type="text"
                            required
                            placeholder="Córdoba"
                            value={province}
                            onChange={(e) => setProvince(e.target.value)}
                            className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-900 text-gray-800 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Desglose de despacho individual por artículo */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-indigo-600" />
                      Artículos a despachar a esta dirección ({items.length})
                    </h4>
                    {calculandoEnvios && (
                      <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1 animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Actualizando costos de envío...
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-gray-100">
                    {items.map((item) => {
                      const costItem = shippingCosts[item.id];
                      return (
                        <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="truncate pr-3">
                            <span className="font-semibold text-gray-800 block truncate">
                              {formatearTituloProducto(item.title)}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              Precio: <FormattedPrice price={item.price} />
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            {typeof costItem === 'number' ? (
                              <div className="font-semibold text-gray-900">
                                Envío: <FormattedPrice price={costItem} />
                              </div>
                            ) : (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Sin cotizar
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* ============================================================== */}
          {/* COLUMNA LATERAL DERECHA: RESUMEN FINANCIERO Y ACCIONES DE PAGO */}
          {/* ============================================================== */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-6 sticky top-24">
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-700" /> Resumen de compra
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Productos ({items.length}):</span>
                  <FormattedPrice price={subtotal} className="font-semibold text-gray-900" />
                </div>

                {/* ========================================================== */}
                {/* CUPÓN DE DESCUENTO POR PRIMERA COMPRA ($5.000 REGALO)     */}
                {/* ========================================================== */}
                {calificaRegalo5k && (
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-950">
                          Cupón Primera Compra ($5.000)
                        </span>
                      </div>
                      
                      {/* Switch interactivo para aplicar o no el cupón */}
                      <label className="relative inline-flex items-center cursor-pointer" title="Activar o desactivar cupón de primera compra">
                        <input
                          type="checkbox"
                          checked={aplicarCuponBienvenida}
                          onChange={(e) => setAplicarCuponBienvenida(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between text-xs text-emerald-800 pt-1.5 border-t border-emerald-200/60">
                      <span>{aplicarCuponBienvenida ? "Descuento aplicado" : "Guardado para otra compra"}</span>
                      <span className="font-mono font-bold">
                        {aplicarCuponBienvenida ? "-$5.000" : "$0"}
                      </span>
                    </div>
                  </div>
                )}

                {/* INCENTIVO SI ES PRIMERA COMPRA PERO NO ALCANZÓ $50.000 */}
                {esPrimeraCompra && subtotal > 0 && subtotal < 50000 && (
                  <div className="p-3 bg-purple-50/60 border border-purple-200/70 rounded-xl text-xs text-purple-900 leading-snug space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-purple-900">
                      <Gift className="h-4 w-4 text-purple-600" />
                      <span>¡Tenés $5.000 de regalo!</span>
                    </div>
                    <p className="text-[11px] text-purple-700">
                      Sumá <FormattedPrice price={50000 - subtotal} className="font-bold text-purple-900" /> más a tu carrito para activar tu cupón de bienvenida.
                    </p>
                  </div>
                )}

                {/* ENVÍOS TOTALES */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Envíos (Correo Argentino):</span>
                  {calculandoEnvios ? (
                    <span className="text-xs text-indigo-600 animate-pulse font-semibold">Calculando...</span>
                  ) : todosEnviosCalculados ? (
                    <FormattedPrice price={totalEnvios} className="font-semibold text-gray-900" />
                  ) : (
                    <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {activePostalCode ? "Calculando..." : "Ingresá CP"}
                    </span>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-3 flex justify-between text-base font-bold">
                  <span className="text-gray-900">Total:</span>
                  {todosEnviosCalculados ? (
                    <FormattedPrice price={totalFinal} className="text-gray-950 text-base font-black" />
                  ) : (
                    <span className="text-gray-950 text-base font-black flex items-center gap-1">
                      <FormattedPrice price={Math.max(0, subtotal - descuentoBienvenida)} />
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider relative -top-[0.2em]">+ envíos</span>
                    </span>
                  )}
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              {pasoActual === 'carrito' ? (
                <div className="space-y-3">
                  <button
                    onClick={handleContinuarACompra}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gray-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-black transition active:scale-[0.99] cursor-pointer shadow-xs"
                  >
                    <span>Continuar compra</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="text-[10px] text-gray-400 text-center leading-normal">
                    Podrás elegir la dirección de destino antes de realizar el pago seguro.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] text-gray-400 leading-normal">
                    * Debido a la naturaleza exclusiva C2C de Objetia, cada objeto se despacha de forma independiente con su propia etiqueta de Correo Argentino.
                  </p>

                  {items.map((item) => {
                    const costItem = shippingCosts[item.id] || 0;
                    const totalItem = item.price + costItem;
                    const alcanzaSaldo = shippingCosts[item.id] !== undefined && saldoBilletera >= totalItem;
                    const isAvailable = (item.availability ?? 'AVAILABLE') === 'AVAILABLE';
                    const isInCheckout = item.availability === 'IN_CHECKOUT';

                    return (
                      <div key={item.id} className="space-y-2 pt-2 border-t border-gray-100 first:border-t-0 first:pt-0">
                        <button
                          onClick={() => handleCheckout(item.id)}
                          disabled={!isAvailable || !todosEnviosCalculados || calculandoEnvios || pagandoConSaldo}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-black transition active:scale-[0.99] cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="truncate pr-2">
                            {isInCheckout 
                              ? "En proceso de pago por otro usuario"
                              : !isAvailable 
                              ? "Artículo no disponible"
                              : items.length === 1 
                              ? "Pagar con Mercado Pago" 
                              : `Comprar: ${formatearTituloProducto(item.title).substring(0, 16)}...`}
                          </span>
                          {isAvailable && <FormattedPrice price={totalItem} className="text-xs font-mono normal-case shrink-0" />}
                        </button>

                        {alcanzaSaldo && isAvailable && (
                          <button
                            onClick={() => handleCheckoutConSaldo(item.id)}
                            disabled={pagandoConSaldo || calculandoEnvios}
                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-emerald-600 text-emerald-700 bg-emerald-50/60 font-bold text-xs uppercase tracking-wider hover:bg-emerald-600 hover:text-white transition active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="flex items-center gap-1.5">
                              {pagandoConSaldo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wallet className="h-3.5 w-3.5" />}
                              Pagar con saldo Objetia
                            </span>
                            <FormattedPrice price={saldoBilletera} className="text-[10px] font-bold normal-case" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {saldoBilletera > 0 && todosEnviosCalculados && items.some(i => saldoBilletera < i.price + (shippingCosts[i.id] || 0)) && (
                    <p className="text-[10px] text-gray-500 leading-normal flex items-center gap-1.5 pt-2">
                      <Wallet className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                      Tenés <FormattedPrice price={saldoBilletera} className="font-semibold text-gray-700" /> de saldo Objetia disponible.
                    </p>
                  )}
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 flex items-center gap-2.5 text-xs text-gray-500 leading-normal">
                <Lock className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Pago asegurado vía Mercado Pago. El dinero se retiene en garantía hasta recibir tu objeto.</span>
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
