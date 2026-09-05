// components/Navbar.tsx
"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  ShoppingCart, 
  MessageSquare, 
  Heart, 
  LogOut, 
  User, 
  Bell, 
  ChevronDown,
  Search,
  PlusCircle,
  Sparkles,
  Shield,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { getApiUrl } from '../lib/config';

interface NavbarProps {
  logoUrl?: string;
}

export default function Navbar({ logoUrl }: NavbarProps) {
  const { usuario, logout, token, cargando, tienePermiso } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  const ADMIN_TABS = new Set([
    'root', 'admin', 'dashboard', 'moderation', 'appearance', 'campanas', 
    'secciones', 'banners', 'users', 'roles', 'permissions', 'sections', 
    'sessions', 'logs'
  ]);

  const esUsuarioAdmin = Boolean(
    usuario && (
      usuario.role?.toLowerCase() === 'admin' ||
      usuario.role?.toLowerCase() === 'administrador' ||
      usuario.role?.toLowerCase() === 'root' ||
      usuario.email?.toLowerCase() === 'admin@vamaar.com' ||
      tienePermiso('full_access') ||
      tienePermiso('admin_section') ||
      tienePermiso('dashboard') ||
      tienePermiso('appearance') ||
      tienePermiso('campanas') ||
      tienePermiso('secciones') ||
      tienePermiso('banners') ||
      tienePermiso('moderation') ||
      tienePermiso('system') ||
      tienePermiso('users') ||
      tienePermiso('roles') ||
      tienePermiso('permissions') ||
      tienePermiso('sections') ||
      tienePermiso('sessions') ||
      tienePermiso('logs')
    )
  );

  const isRootTab = pathname === '/root/dashboard' || ((pathname === '/mi-objetia' || pathname === '/mi-espacio') && tab && ADMIN_TABS.has(tab) && esUsuarioAdmin);

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [notifAbierto, setNotifAbierto] = useState(false);
  const [descubrirAbierto, setDescubrirAbierto] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [favoritosCount, setFavoritosCount] = useState(0);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  interface Notificacion {
    id: string | number;
    tipo: 'telefono' | 'direccion' | 'moderacion' | 'general';
    texto: string;
    leida: boolean;
    fecha: string;
    link?: string;
  }
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const unreadNotifsCount = notificaciones.filter(n => !n.leida).length;
  const [logoUrlState, setLogoUrlState] = useState(logoUrl || "");
  const [brandNameState, setBrandNameState] = useState("OBJETIA");
  const [brandFontSizeState, setBrandFontSizeState] = useState("1.5rem");
  const [brandFontFamilyState, setBrandFontFamilyState] = useState("Outfit");
  const [navBgColorState, setNavBgColorState] = useState("#FFFFFF");
  const [navbarSearch, setNavbarSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkBgColor = () => {
      const el = document.querySelector('nav');
      if (el) {
        const bg = window.getComputedStyle(el).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          setNavBgColorState(bg);
        }
      }
    };
    checkBgColor();
    const timer = setInterval(checkBgColor, 500);

    const handleBrandingUpdated = (e: any) => {
      if (e.detail) {
        if (e.detail.brandName !== undefined) setBrandNameState(e.detail.brandName);
        if (e.detail.logoUrl !== undefined) setLogoUrlState(e.detail.logoUrl);
        if (e.detail.brandFontSize !== undefined) setBrandFontSizeState(e.detail.brandFontSize);
        if (e.detail.brandFontFamily !== undefined) setBrandFontFamilyState(e.detail.brandFontFamily);
        if (e.detail.bgNavbar !== undefined) setNavBgColorState(e.detail.bgNavbar);
      }
      checkBgColor();
    };
    window.addEventListener('branding_updated', handleBrandingUpdated);
    return () => {
      clearInterval(timer);
      window.removeEventListener('branding_updated', handleBrandingUpdated);
    };
  }, []);

  const getStoredToken = () => localStorage.getItem('vamaar_token') || token;

  const fetchUnreadChatsCount = async () => {
    const authToken = getStoredToken();
    if (!usuario || !usuario.id || !authToken) {
      setUnreadChatsCount(0);
      return;
    }
    try {
      const res = await fetch(`${getApiUrl()}/chat/unread-count/`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.status === 401) {
        logout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUnreadChatsCount(data.unread_count);
      }
    } catch (err) {
      console.error("Error al obtener conteo de chats no leídos:", err);
    }
  };

  const fetchCartCount = async () => {
    const authToken = getStoredToken();
    if (!usuario || !usuario.id || !authToken) {
      setCartCount(0);
      return;
    }
    try {
      const res = await fetch(`${getApiUrl()}/cart/`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.status === 401) {
        logout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCartCount(data.length);
        }
      }
    } catch (err) {
      console.error("Error al obtener conteo del carrito:", err);
    }
  };

  const fetchUserNotifications = async () => {
    const authToken = getStoredToken();
    if (!usuario || !usuario.id || !authToken) {
      setNotificaciones([]);
      return;
    }

    const readIdsKey = `vamaar_read_notifs_${usuario.id}`;
    let readIds: (string | number)[] = [];
    try {
      const raw = localStorage.getItem(readIdsKey);
      if (raw) readIds = JSON.parse(raw);
    } catch {}

    const notifs: Notificacion[] = [];

    // 1. Notificación de Moderación (Admin)
    if (usuario.role === 'ADMIN') {
      try {
        const res = await fetch(`${getApiUrl()}/products/admin/moderation/`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          const pendientesORechazados = data.filter((p: any) => p.moderation_status === 'rejected' || p.moderation_status === 'pending');
          if (pendientesORechazados.length > 0) {
            notifs.push({
              id: 'admin_moderation',
              tipo: 'moderacion',
              texto: `⚠️ Atención Administrador: Hay ${pendientesORechazados.length} producto(s) en revisión o rechazado(s) por la IA.`,
              leida: readIds.includes('admin_moderation') || readIds.includes(999),
              fecha: "Reciente",
              link: "/mi-objetia?tab=moderation"
            });
          }
        }
      } catch (err) {
        console.error("Error al obtener moderación admin:", err);
      }
    }

    // 2. Verificar Teléfono de contacto
    const userPhone = (usuario as any).phone;
    if (!userPhone || !String(userPhone).trim()) {
      notifs.push({
        id: 'missing_phone',
        tipo: 'telefono',
        texto: 'Te falta completar tu número de teléfono. Agregalo para la gestión de tus compras y ventas.',
        leida: readIds.includes('missing_phone'),
        fecha: "Pendiente",
        link: "/mi-objetia?tab=perfil"
      });
    }

    // 3. Verificar Dirección de entrega
    try {
      const resAddresses = await fetch(`${getApiUrl()}/auth/addresses`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (resAddresses.ok) {
        const addressesData = await resAddresses.json();
        const hasAddresses = Array.isArray(addressesData) && addressesData.length > 0;
        if (!hasAddresses && !((usuario as any).street && (usuario as any).city)) {
          notifs.push({
            id: 'missing_address',
            tipo: 'direccion',
            texto: 'Te falta agregar tu dirección de entrega. Registrá tu domicilio para recibir envíos.',
            leida: readIds.includes('missing_address'),
            fecha: "Pendiente",
            link: "/mi-objetia?tab=perfil"
          });
        }
      } else {
        if (!((usuario as any).street && (usuario as any).city)) {
          notifs.push({
            id: 'missing_address',
            tipo: 'direccion',
            texto: 'Te falta agregar tu dirección de entrega. Registrá tu domicilio para recibir envíos.',
            leida: readIds.includes('missing_address'),
            fecha: "Pendiente",
            link: "/mi-objetia?tab=perfil"
          });
        }
      }
    } catch {
      if (!((usuario as any).street && (usuario as any).city)) {
        notifs.push({
          id: 'missing_address',
          tipo: 'direccion',
          texto: 'Te falta agregar tu dirección de entrega. Registrá tu domicilio para recibir envíos.',
          leida: readIds.includes('missing_address'),
          fecha: "Pendiente",
          link: "/mi-objetia?tab=perfil"
        });
      }
    }

    setNotificaciones(notifs);
  };

  useEffect(() => {
    if (!cargando) {
      fetchUnreadChatsCount();
      fetchCartCount();
      fetchUserNotifications();
      
      const interval = setInterval(() => {
        if (document.visibilityState !== 'visible') return;
        fetchUnreadChatsCount();
        fetchCartCount();
        fetchUserNotifications();
      }, 15000);

      const handleRefresh = () => fetchUnreadChatsCount();
      const handleCartRefresh = () => fetchCartCount();
      const handleProfileUpdated = () => fetchUserNotifications();
      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          fetchUnreadChatsCount();
          fetchCartCount();
          fetchUserNotifications();
        }
      };
      window.addEventListener('chat_messages_read', handleRefresh);
      window.addEventListener('cart_updated', handleCartRefresh);
      window.addEventListener('profile_updated', handleProfileUpdated);
      document.addEventListener('visibilitychange', handleVisibility);

      return () => {
        clearInterval(interval);
        window.removeEventListener('chat_messages_read', handleRefresh);
        window.removeEventListener('cart_updated', handleCartRefresh);
        window.removeEventListener('profile_updated', handleProfileUpdated);
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    }
  }, [usuario, cargando]);

  useEffect(() => {
    if (logoUrl) setLogoUrlState(logoUrl);
  }, [logoUrl]);

  useEffect(() => {
    const handleActualizarLogo = (e: any) => {
      if (e.detail && e.detail.logoUrl) {
        setLogoUrlState(e.detail.logoUrl);
      }
    };
    window.addEventListener("actualizar-logo-navbar" as any, handleActualizarLogo);
    return () => {
      window.removeEventListener("actualizar-logo-navbar" as any, handleActualizarLogo);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuAbierto(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const favs = localStorage.getItem("vamaar_favorites");
    if (favs) {
      try {
        const parsed = JSON.parse(favs);
        setFavoritosCount(Array.isArray(parsed) ? parsed.length : 0);
      } catch {
        setFavoritosCount(0);
      }
    }
  }, []);

  const marcarComoLeida = (id: string | number) => {
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    if (usuario) {
      try {
        const key = `vamaar_read_notifs_${usuario.id}`;
        const raw = localStorage.getItem(key);
        const current: (string | number)[] = raw ? JSON.parse(raw) : [];
        if (!current.includes(id)) {
          localStorage.setItem(key, JSON.stringify([...current, id]));
        }
      } catch {}
    }
  };

  const marcarTodasComoLeidas = () => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    if (usuario) {
      try {
        const key = `vamaar_read_notifs_${usuario.id}`;
        const allIds = notificaciones.map(n => n.id);
        localStorage.setItem(key, JSON.stringify(allIds));
      } catch {}
    }
  };

  const handleNavbarSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (navbarSearch.trim()) {
      router.push(`/catalog?search=${encodeURIComponent(navbarSearch.trim())}`);
    }
  };

  // Manejo del botón VENDER (Directo a /products/new si logueado, o /auth si offline)
  const handleBotonVender = () => {
    if (usuario) {
      router.push("/products/new");
    } else {
      router.push("/auth?redirect=/products/new");
    }
  };

  const esNavOscuro = useMemo(() => {
    if (!navBgColorState) return false;
    const val = navBgColorState.toLowerCase().trim();
    if (val === '#ffffff' || val === '#fff' || val === 'rgb(255, 255, 255)' || val === 'rgb(255,255,255)' || val === 'white' || val === 'transparent') {
      return false;
    }
    if (val.startsWith('rgb')) {
      const match = val.match(/\d+/g);
      if (match && match.length >= 3) {
        const r = parseInt(match[0]);
        const g = parseInt(match[1]);
        const b = parseInt(match[2]);
        const yiq = (r * 299 + g * 587 + b * 114) / 1000;
        return yiq < 220;
      }
    }
    let hex = val.replace('#', '').trim();
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const yiq = (r * 299 + g * 587 + b * 114) / 1000;
      return yiq < 220;
    }
    return true;
  }, [navBgColorState]);

  const iconClass = esNavOscuro 
    ? "relative text-white hover:text-gray-100 transition p-1 cursor-pointer" 
    : "relative text-gray-700 hover:text-gray-900 transition p-1 cursor-pointer";

  if (isRootTab) return null;

  return (
    <nav style={{ backgroundColor: 'var(--bg-navbar)' }} className="border-b border-gray-100/30 sticky top-0 z-50 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-4">
          
          {/* LOGO DE MARCA */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl font-bold tracking-tight transition hover:opacity-95 flex items-center gap-2.5 group">
              <img 
                src={logoUrlState && logoUrlState !== "" && logoUrlState !== "https://" ? logoUrlState : "/objetia_logo.png"} 
                alt="Logo" 
                className="h-10 w-10 sm:h-11 sm:w-11 object-contain group-hover:scale-105 transition-transform" 
              />
              <span 
                style={{ 
                  fontFamily: `var(--font-family-brand, ${brandFontFamilyState})`,
                  fontSize: `var(--font-size-brand, ${brandFontSizeState})`
                }} 
                className={`font-black tracking-wider uppercase leading-none ${
                  esNavOscuro ? "text-white drop-shadow-xs" : "text-gray-900"
                }`}
              >
                {brandNameState || 'OBJETIA'}
              </span>
            </Link>
          </div>

          {/* CUADRO DE BÚSQUEDA INTEGRADO */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <form onSubmit={handleNavbarSearch} className="flex items-stretch bg-white border border-gray-300 rounded-xl focus-within:border-purple-600 transition shadow-2xs">
              <input 
                type="text" 
                value={navbarSearch}
                onChange={(e) => setNavbarSearch(e.target.value)}
                placeholder="Buscar muebles, iluminación, decoración..." 
                className="w-full bg-transparent pl-3.5 pr-2 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none"
              />
              <div className="w-[1px] bg-gray-200 my-1.5" />
              <button 
                type="submit"
                aria-label="Buscar"
                className="px-3.5 flex items-center justify-center text-gray-500 hover:text-purple-700 transition cursor-pointer bg-transparent"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* SECCIÓN USUARIO Y ACCIONES DE CABECERA */}
          <div className="flex items-center space-x-4 sm:space-x-5">
            
            {/* BOTÓN VENDER (VISIBLE SOLO SI TIENE PERMISO DE VENTA O NO ESTÁ LOGUEADO) */}
            {(!usuario || tienePermiso('sell_products') || tienePermiso('full_access') || usuario?.role === 'root') && (
              <button 
                onClick={handleBotonVender}
                className="inline-flex items-center justify-center text-white text-xs font-extrabold px-4 py-2 rounded-xl transition shadow-xs hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: 'var(--color-primary, #2C3E50)' }}
              >
                Vender
              </button>
            )}

            {mounted && !cargando && (
              usuario ? (
                /* ==================================================================== */
                /* USUARIO LOGUEADO / ONLINE: APARICIÓN DE TODOS LOS ÍCONOS DE ACCIÓN */
                /* ==================================================================== */
                <>
                  {/* 1. FAVORITOS (CORAZÓN) */}
                  <Link href="/products/favorites" className={iconClass} title="Mis Favoritos">
                    <Heart className="h-5.5 w-5.5" />
                    {favoritosCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-white animate-pulse">
                        {favoritosCount}
                      </span>
                    )}
                  </Link>

                  {/* 2. CAMPANITA DE NOTIFICACIONES */}
                  <div className="relative" ref={notifRef}>
                    <button 
                      onClick={() => setNotifAbierto(!notifAbierto)}
                      aria-label="Notificaciones"
                      className={`${iconClass} focus:outline-none`}
                      title="Notificaciones"
                    >
                      <Bell className="h-5.5 w-5.5" />
                      {unreadNotifsCount > 0 && (
                        <span 
                          className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full text-[9px] font-semibold text-white flex items-center justify-center bg-[#1f1f1f] border-[1.5px] border-white shadow-2xs leading-none"
                        >
                          {unreadNotifsCount}
                        </span>
                      )}
                    </button>

                    {/* DROPDOWN NOTIFICACIONES - GOOGLE AI STUDIO LIGHT STYLE */}
                    {notifAbierto && (
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#dadce0] rounded-2xl shadow-xl shadow-black/8 z-50 overflow-hidden animate-scale-in origin-top-right">
                        {/* Cabecera estilo Google AI Studio */}
                        <div className="flex justify-between items-center px-4 py-3 border-b border-[#f1f3f4] bg-white">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#202124]">Notificaciones</span>
                            {unreadNotifsCount > 0 && (
                              <span className="text-[10px] font-medium bg-[#f1f3f4] text-[#3c4043] px-1.5 py-0.5 rounded-full border border-[#dadce0]/70">
                                {unreadNotifsCount}
                              </span>
                            )}
                          </div>
                          {unreadNotifsCount > 0 && (
                            <button 
                              onClick={marcarTodasComoLeidas}
                              className="text-[11px] text-[#1a73e8] hover:text-[#1557b0] font-medium transition cursor-pointer"
                            >
                              Marcar leídas
                            </button>
                          )}
                        </div>

                        {/* Lista de Notificaciones sin iconos */}
                        <div className="p-2 space-y-1.5 max-h-[320px] overflow-y-auto">
                          {notificaciones.length === 0 ? (
                            <div className="py-8 text-center">
                              <p className="text-xs text-[#5f6368]">No tienes notificaciones pendientes</p>
                            </div>
                          ) : (
                            notificaciones.map(n => (
                              <div 
                                key={n.id} 
                                onClick={() => {
                                  marcarComoLeida(n.id);
                                  if (n.link) {
                                    setNotifAbierto(false);
                                    router.push(n.link);
                                  }
                                }}
                                className={`p-3 rounded-xl transition cursor-pointer text-left border ${
                                  n.leida 
                                    ? 'bg-white hover:bg-[#f8f9fa] border-transparent' 
                                    : 'bg-[#fafafa] hover:bg-[#f5f5f5] border-[#e8eaed]'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    {!n.leida && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#1f1f1f] shrink-0" />
                                    )}
                                    <span className="text-[11px] font-semibold text-[#202124]">
                                      {n.tipo === 'telefono' 
                                        ? 'Teléfono de contacto' 
                                        : n.tipo === 'direccion' 
                                        ? 'Dirección de entrega' 
                                        : n.tipo === 'moderacion'
                                        ? 'Moderación'
                                        : 'Aviso'}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-[#70757a] font-normal shrink-0">
                                    {n.fecha}
                                  </span>
                                </div>

                                <p className="text-xs text-[#3c4043] leading-relaxed mt-1.5">
                                  {n.texto}
                                </p>

                                {n.link && (
                                  <div className="mt-2 pt-2 border-t border-[#f1f3f4] flex justify-end">
                                    <span className="text-[11px] font-medium text-[#1a73e8] hover:text-[#1557b0] transition">
                                      Completar en mi perfil &rarr;
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. CARRITO DE COMPRAS */}
                  <Link href="/cart" className={iconClass} title="Carrito">
                    <ShoppingCart className="h-5.5 w-5.5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center border border-white bg-red-500 animate-pulse">
                        {cartCount}
                      </span>
                    )}
                  </Link>

                  {/* 4. PERFIL / MUÑEQUITO CON DROPDOWN */}
                  <div className="relative" ref={dropdownRef}>
                    <button 
                      onClick={() => setMenuAbierto(!menuAbierto)}
                      className="flex items-center gap-1.5 cursor-pointer focus:outline-none p-1 rounded-xl hover:bg-gray-100/50 transition group"
                      title="Mi Perfil"
                    >
                      <div className="relative">
                        {usuario.avatar_url ? (
                          <img src={usuario.avatar_url} alt="Avatar" className="h-8 w-8 rounded-full border-2 border-emerald-500 object-cover shadow-xs" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center border-2 border-emerald-500 shadow-xs text-xs">
                            {usuario.full_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" title="En línea" />
                      </div>
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${esNavOscuro ? "text-gray-300" : "text-gray-600"} ${menuAbierto ? 'rotate-180' : ''}`} />
                    </button>

                    {/* MENÚ DESPLEGABLE DE MI OBJETIA Y CONFIGURACIÓN */}
                    {menuAbierto && (
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-scale-in origin-top-right">
                        <div className="px-3 py-2 border-b border-gray-50">
                          <p className="text-xs font-bold text-gray-900 truncate">{usuario.full_name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{usuario.email}</p>
                          {(usuario.role?.toLowerCase() === 'admin' || usuario.role?.toLowerCase() === 'administrador') && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-full bg-purple-100 text-purple-700">
                              Administrador
                            </span>
                          )}
                          {(usuario.role?.toLowerCase() === 'root') && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-full bg-amber-100 text-amber-800">
                              Programador Root
                            </span>
                          )}
                        </div>

                        <Link 
                          href="/mi-objetia" 
                          onClick={() => setMenuAbierto(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition"
                        >
                          <User className="h-4 w-4 text-purple-600" /> Mi OBJETIA
                        </Link>

                        <button 
                          onClick={() => { logout(); setMenuAbierto(false); router.push("/"); }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer text-left"
                        >
                          <LogOut className="h-4 w-4 text-red-400" /> Cerrar Sesión
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* ==================================================================== */
                /* USUARIO NO LOGUEADO / OFFLINE: MUESTRA CREA TU CUENTA E INGRESA */
                /* ==================================================================== */
                <div className="flex items-center space-x-3 text-xs font-extrabold">
                  <Link 
                    href="/auth?mode=register" 
                    className={`transition hover:underline ${
                      esNavOscuro ? "text-white hover:text-purple-200" : "text-purple-700 hover:text-purple-900"
                    }`}
                  >
                    Crea tu cuenta
                  </Link>
                  <span className={esNavOscuro ? "text-gray-400" : "text-gray-300"}>|</span>
                  <Link 
                    href="/auth?mode=login" 
                    className={`transition ${
                      esNavOscuro ? "text-gray-200 hover:text-white" : "text-gray-700 hover:text-purple-700"
                    }`}
                  >
                    Ingresa
                  </Link>
                </div>
              )
            )}

          </div>

        </div>
      </div>

      {/* SUB-BARRA DE MENÚ DE NAVEGACIÓN (Nuevos ingresos / Descubrir / Decoración / Iluminación / Alfombras / Exterior) - Se oculta en Mi Objetia y Consolas Root */}
      {!pathname?.startsWith('/mi-objetia') && !pathname?.startsWith('/mi-espacio') && !pathname?.startsWith('/root') && (
        <div className="border-t border-gray-100/60 bg-white/95 backdrop-blur-xs hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-8 py-2.5 text-xs font-extrabold tracking-wide text-gray-700">
              
              {/* 1. Nuevos ingresos */}
              <Link href="/catalog?sort=newest" className="hover:text-purple-700 transition flex items-center gap-1">
                Nuevos ingresos
              </Link>

              {/* 2. Descubrir (Dropdown) */}
              <div 
                className="relative" 
                onMouseEnter={() => setDescubrirAbierto(true)} 
                onMouseLeave={() => setDescubrirAbierto(false)}
              >
                <button className="hover:text-purple-700 transition flex items-center gap-1 cursor-pointer py-1">
                  <span>Descubrir</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${descubrirAbierto ? 'rotate-180 text-purple-700' : ''}`} />
                </button>

                {descubrirAbierto && (
                  <div className="absolute left-0 top-full w-64 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-scale-in origin-top-left">
                    <Link
                      href="/catalog?filter=selected"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition"
                    >
                      ⭐ Seleccionados de Objetia
                    </Link>
                    <Link
                      href="/catalog?max_price=50000"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition"
                    >
                      🏷️ Hallazgos por menos de $50.000
                    </Link>
                    <Link
                      href="/catalog?condition=used"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition"
                    >
                      📜 Vintage & Usados Selección
                    </Link>
                    <Link
                      href="/catalog?sort=popular"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition"
                    >
                      🔥 Tendencias
                    </Link>
                  </div>
                )}
              </div>

              {/* 3. Decoración */}
              <Link href="/catalog?category=Adornos+y+Cuadros" className="hover:text-purple-700 transition">
                Decoración
              </Link>

              {/* 4. Iluminación */}
              <Link href="/catalog?category=Iluminación" className="hover:text-purple-700 transition">
                Iluminación
              </Link>

              {/* 5. Alfombras */}
              <Link href="/catalog?category=Alfombras" className="hover:text-purple-700 transition">
                Alfombras
              </Link>

              {/* 6. Exterior */}
              <Link href="/catalog?category=Jardín+y+Exterior" className="hover:text-purple-700 transition">
                Exterior
              </Link>

            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
