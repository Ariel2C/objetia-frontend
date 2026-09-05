// components/Navbar.tsx
"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  ShoppingCart, 
  Heart, 
  Bell, 
  ChevronDown,
  Search
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
      const raw = sessionStorage.getItem(readIdsKey);
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
              texto: `Atención Administrador: Hay ${pendientesORechazados.length} producto(s) en revisión o rechazado(s) por la IA.`,
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
        const raw = sessionStorage.getItem(key);
        const current: (string | number)[] = raw ? JSON.parse(raw) : [];
        if (!current.includes(id)) {
          sessionStorage.setItem(key, JSON.stringify([...current, id]));
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
        sessionStorage.setItem(key, JSON.stringify(allIds));
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

  const iconBtnClass = "relative text-[#c4c7c5] hover:text-[#f1f3f4] hover:bg-[#282a2c] p-2 rounded-xl transition cursor-pointer flex items-center justify-center";

  if (isRootTab) return null;

  return (
    <nav className="bg-[#131314] border-b border-[#282a2c] sticky top-0 z-50 transition-colors duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-4">
          
          {/* LOGO DE MARCA */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl font-bold tracking-tight transition hover:opacity-95 flex items-center gap-2.5 group">
              <img 
                src={logoUrlState && logoUrlState !== "" && logoUrlState !== "https://" ? logoUrlState : "/objetia_logo.png"} 
                alt="Logo" 
                className="h-9 w-9 sm:h-10 sm:w-10 object-contain group-hover:scale-105 transition-transform" 
              />
              <span 
                style={{ 
                  fontFamily: `var(--font-family-brand, ${brandFontFamilyState})`,
                  fontSize: `var(--font-size-brand, ${brandFontSizeState})`
                }} 
                className="font-black tracking-wider uppercase leading-none text-[#f1f3f4]"
              >
                {brandNameState || 'OBJETIA'}
              </span>
            </Link>
          </div>

          {/* CUADRO DE BÚSQUEDA INTEGRADO ESTILO GOOGLE AI STUDIO */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <form onSubmit={handleNavbarSearch} className="flex items-center bg-[#1e1f20] border border-[#333538] hover:border-[#444746] focus-within:border-[#87a9ff] rounded-xl transition shadow-xs overflow-hidden">
              <div className="pl-3.5 pr-1 flex items-center text-[#9aa0a6]">
                <Search className="h-4 w-4" />
              </div>
              <input 
                type="text" 
                value={navbarSearch}
                onChange={(e) => setNavbarSearch(e.target.value)}
                placeholder="Buscar muebles, iluminación, decoración..." 
                className="w-full bg-transparent px-2.5 py-2 text-xs text-[#e3e3e3] placeholder-[#80868b] focus:outline-none"
              />
              {navbarSearch.trim() && (
                <button 
                  type="submit"
                  aria-label="Buscar"
                  className="px-3 py-1 mr-1 text-[11px] font-medium text-[#87a9ff] hover:text-[#a8c7fa] cursor-pointer"
                >
                  Buscar
                </button>
              )}
            </form>
          </div>

          {/* SECCIÓN USUARIO Y ACCIONES DE CABECERA */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* BOTÓN VENDER (ESTILO GOOGLE AI STUDIO ACCENT) */}
            {(!usuario || tienePermiso('sell_products') || tienePermiso('full_access') || usuario?.role === 'root') && (
              <button 
                onClick={handleBotonVender}
                className="inline-flex items-center justify-center bg-[#87a9ff] hover:bg-[#a8c7fa] text-[#131314] text-xs font-bold px-3.5 py-1.5 rounded-lg transition shadow-xs active:scale-98 cursor-pointer"
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
                  <Link href="/products/favorites" className={iconBtnClass} title="Mis Favoritos">
                    <Heart className="h-5 w-5" />
                    {favoritosCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center border border-[#131314] shadow-xs animate-pulse">
                        {favoritosCount}
                      </span>
                    )}
                  </Link>

                  {/* 2. CAMPANITA DE NOTIFICACIONES */}
                  <div className="relative" ref={notifRef}>
                    <button 
                      onClick={() => setNotifAbierto(!notifAbierto)}
                      aria-label="Notificaciones"
                      className={`${iconBtnClass} ${notifAbierto ? 'bg-[#282a2c] text-[#f1f3f4]' : ''} focus:outline-none`}
                      title="Notificaciones"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadNotifsCount > 0 && (
                        <span 
                          className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full text-[9px] font-bold text-[#131314] bg-[#87a9ff] border border-[#131314] flex items-center justify-center shadow-xs leading-none"
                        >
                          {unreadNotifsCount}
                        </span>
                      )}
                    </button>

                    {/* DROPDOWN NOTIFICACIONES - GOOGLE AI STUDIO DARK STYLE */}
                    {notifAbierto && (
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#1e1f20] border border-[#333538] rounded-2xl shadow-2xl shadow-black/60 z-50 overflow-hidden animate-scale-in origin-top-right">
                        {/* Cabecera estilo Google AI Studio */}
                        <div className="flex justify-between items-center px-4 py-3 border-b border-[#282a2c] bg-[#1e1f20]">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#e3e3e3]">Notificaciones</span>
                            {unreadNotifsCount > 0 && (
                              <span className="text-[10px] font-semibold bg-[#282a2c] text-[#87a9ff] px-1.5 py-0.5 rounded-md border border-[#3c4043]">
                                {unreadNotifsCount}
                              </span>
                            )}
                          </div>
                          {unreadNotifsCount > 0 && (
                            <button 
                              onClick={marcarTodasComoLeidas}
                              className="text-[11px] text-[#87a9ff] hover:text-[#a8c7fa] font-medium transition cursor-pointer"
                            >
                              Marcar leídas
                            </button>
                          )}
                        </div>

                        {/* Lista de Notificaciones estilo Google AI Studio Dark */}
                        <div className="p-2 space-y-1.5 max-h-[320px] overflow-y-auto custom-scrollbar">
                          {notificaciones.length === 0 ? (
                            <div className="py-8 text-center">
                              <p className="text-xs text-[#8e918f]">No tienes notificaciones pendientes</p>
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
                                    ? 'bg-[#1e1f20] hover:bg-[#282a2c]/60 border-transparent text-[#8e918f]' 
                                    : 'bg-[#282a2c]/50 hover:bg-[#282a2c] border-[#3c4043] text-[#e3e3e3]'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className={`text-[11px] font-semibold ${n.leida ? 'text-[#c4c7c5]' : 'text-white'}`}>
                                    {n.tipo === 'telefono' 
                                      ? 'Teléfono de contacto' 
                                      : n.tipo === 'direccion' 
                                      ? 'Dirección de entrega' 
                                      : n.tipo === 'moderacion'
                                      ? 'Moderación'
                                      : 'Aviso'}
                                  </span>
                                  <span className="text-[10px] text-[#8e918f] font-normal shrink-0">
                                    {n.fecha}
                                  </span>
                                </div>

                                <p className={`text-xs leading-relaxed mt-1.5 ${n.leida ? 'text-[#8e918f]' : 'text-[#c4c7c5]'}`}>
                                  {n.texto}
                                </p>

                                {n.link && (
                                  <div className="mt-2 pt-2 border-t border-[#333538] flex justify-end">
                                    <span className="text-[11px] font-medium text-[#87a9ff] hover:text-[#a8c7fa] transition">
                                      Completar en mi perfil
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
                  <Link href="/cart" className={iconBtnClass} title="Carrito">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center border border-[#131314] bg-emerald-500 shadow-xs animate-pulse">
                        {cartCount}
                      </span>
                    )}
                  </Link>

                  {/* 4. PERFIL / MUÑEQUITO CON DROPDOWN */}
                  <div className="relative" ref={dropdownRef}>
                    <button 
                      onClick={() => setMenuAbierto(!menuAbierto)}
                      className={`flex items-center gap-2 cursor-pointer focus:outline-none py-1 px-2 rounded-xl hover:bg-[#282a2c] transition group ${menuAbierto ? 'bg-[#282a2c]' : ''}`}
                      title={usuario.full_name || "Mi Perfil"}
                    >
                      <div className="relative shrink-0">
                        {usuario.avatar_url ? (
                          <img src={usuario.avatar_url} alt="Avatar" className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-[#3c4043] object-cover" />
                        ) : (
                          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[#282a2c] text-[#87a9ff] font-bold flex items-center justify-center border border-[#3c4043] text-xs">
                            {usuario.full_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium text-[#e3e3e3] max-w-[100px] sm:max-w-[140px] truncate">
                        {usuario.full_name || usuario.email?.split('@')[0]}
                      </span>
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform text-[#9aa0a6] shrink-0 ${menuAbierto ? 'rotate-180 text-white' : ''}`} />
                    </button>

                    {/* MENÚ DESPLEGABLE DE MI OBJETIA Y CONFIGURACIÓN - GOOGLE AI STUDIO DARK */}
                    {menuAbierto && (
                      <div className="absolute right-0 mt-2 w-64 bg-[#1e1f20] border border-[#333538] rounded-2xl shadow-2xl shadow-black/60 z-50 p-2 space-y-1.5 animate-scale-in origin-top-right">
                        {(usuario.role?.toLowerCase() === 'admin' || usuario.role?.toLowerCase() === 'administrador') && (
                          <div className="px-1 pt-0.5">
                            <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-[#282a2c] text-[#87a9ff] border border-[#3c4043]">
                              Administrador
                            </span>
                          </div>
                        )}
                        {(usuario.role?.toLowerCase() === 'root') && (
                          <div className="px-1 pt-0.5">
                            <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              Programador Root
                            </span>
                          </div>
                        )}

                        {/* Badge tipo botón: Mi OBJETIA con título y descripción */}
                        <Link 
                          href="/mi-objetia" 
                          onClick={() => setMenuAbierto(false)}
                          className="block p-3 rounded-xl bg-[#282a2c]/60 hover:bg-[#282a2c] border border-[#3c4043] hover:border-[#87a9ff]/40 transition group cursor-pointer text-left"
                        >
                          <div className="text-xs font-semibold text-white group-hover:text-[#87a9ff] transition-colors">
                            Mi OBJETIA
                          </div>
                          <p className="text-[11px] text-[#9aa0a6] leading-relaxed mt-1 group-hover:text-[#c4c7c5] transition-colors">
                            Gestioná tus compras, ventas, publicaciones y perfil personal.
                          </p>
                        </Link>

                        {/* Cerrar Sesión centrado abajo */}
                        <div className="pt-0.5">
                          <button 
                            onClick={() => { logout(); setMenuAbierto(false); router.push("/"); }}
                            className="w-full py-2 text-center text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                          >
                            Cerrar Sesión
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* ==================================================================== */
                /* USUARIO NO LOGUEADO / OFFLINE: MUESTRA CREA TU CUENTA E INGRESA */
                /* ==================================================================== */
                <div className="flex items-center space-x-3 text-xs font-medium">
                  <Link 
                    href="/auth?mode=register" 
                    className="text-[#87a9ff] hover:text-[#a8c7fa] transition font-semibold"
                  >
                    Crea tu cuenta
                  </Link>
                  <span className="text-[#3c4043]">|</span>
                  <Link 
                    href="/auth?mode=login" 
                    className="text-[#c4c7c5] hover:text-white transition"
                  >
                    Ingresa
                  </Link>
                </div>
              )
            )}

          </div>

        </div>
      </div>

      {/* SUB-BARRA DE MENÚ DE NAVEGACIÓN - GOOGLE AI STUDIO DARK */}
      {!pathname?.startsWith('/mi-objetia') && !pathname?.startsWith('/mi-espacio') && !pathname?.startsWith('/root') && (
        <div className="border-t border-[#282a2c] bg-[#18181a] hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2 py-1.5 text-xs font-medium text-[#9aa0a6]">
              
              {/* 1. Nuevos ingresos */}
              <Link href="/catalog?sort=newest" className="hover:text-white hover:bg-[#282a2c] px-3 py-1.5 rounded-lg transition flex items-center gap-1">
                Nuevos ingresos
              </Link>

              {/* 2. Descubrir (Dropdown) */}
              <div 
                className="relative" 
                onMouseEnter={() => setDescubrirAbierto(true)} 
                onMouseLeave={() => setDescubrirAbierto(false)}
              >
                <button className="hover:text-white hover:bg-[#282a2c] px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer">
                  <span>Descubrir</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${descubrirAbierto ? 'rotate-180 text-[#87a9ff]' : ''}`} />
                </button>

                {descubrirAbierto && (
                  <div className="absolute left-0 top-full w-56 bg-[#1e1f20] border border-[#333538] rounded-2xl shadow-2xl shadow-black/60 z-50 p-1.5 space-y-0.5 animate-scale-in origin-top-left">
                    <Link
                      href="/catalog?filter=selected"
                      className="block px-3 py-2 rounded-xl text-xs font-medium text-[#c4c7c5] hover:bg-[#282a2c] hover:text-white transition"
                    >
                      Seleccionados de Objetia
                    </Link>
                    <Link
                      href="/catalog?max_price=50000"
                      className="block px-3 py-2 rounded-xl text-xs font-medium text-[#c4c7c5] hover:bg-[#282a2c] hover:text-white transition"
                    >
                      Hallazgos por menos de $50.000
                    </Link>
                    <Link
                      href="/catalog?condition=used"
                      className="block px-3 py-2 rounded-xl text-xs font-medium text-[#c4c7c5] hover:bg-[#282a2c] hover:text-white transition"
                    >
                      Vintage & Usados Selección
                    </Link>
                    <Link
                      href="/catalog?sort=popular"
                      className="block px-3 py-2 rounded-xl text-xs font-medium text-[#c4c7c5] hover:bg-[#282a2c] hover:text-white transition"
                    >
                      Tendencias
                    </Link>
                  </div>
                )}
              </div>

              {/* 3. Decoración */}
              <Link href="/catalog?category=Adornos+y+Cuadros" className="hover:text-white hover:bg-[#282a2c] px-3 py-1.5 rounded-lg transition">
                Decoración
              </Link>

              {/* 4. Iluminación */}
              <Link href="/catalog?category=Iluminación" className="hover:text-white hover:bg-[#282a2c] px-3 py-1.5 rounded-lg transition">
                Iluminación
              </Link>

              {/* 5. Alfombras */}
              <Link href="/catalog?category=Alfombras" className="hover:text-white hover:bg-[#282a2c] px-3 py-1.5 rounded-lg transition">
                Alfombras
              </Link>

              {/* 6. Exterior */}
              <Link href="/catalog?category=Jardín+y+Exterior" className="hover:text-white hover:bg-[#282a2c] px-3 py-1.5 rounded-lg transition">
                Exterior
              </Link>

            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
