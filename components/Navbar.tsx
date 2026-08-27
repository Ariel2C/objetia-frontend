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

  const isRootTab = pathname === '/root/dashboard' || (pathname === '/mi-espacio' && tab && ADMIN_TABS.has(tab) && esUsuarioAdmin);

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [notifAbierto, setNotifAbierto] = useState(false);
  const [descubrirAbierto, setDescubrirAbierto] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [favoritosCount, setFavoritosCount] = useState(0);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
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

  const fetchAdminModerationCount = async () => {
    if (usuario?.role !== 'ADMIN') return;
    try {
      const authToken = localStorage.getItem("vamaar_token") || token;
      if (!authToken) return;
      const res = await fetch(`${getApiUrl()}/products/admin/moderation/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        const pendientesORechazados = data.filter((p: any) => p.moderation_status === 'rejected' || p.moderation_status === 'pending');
        if (pendientesORechazados.length > 0) {
          setNotificaciones([
            {
              id: 999,
              texto: `⚠️ Atención Administrador: Hay ${pendientesORechazados.length} producto(s) en revisión o rechazado(s) por la IA.`,
              leida: false,
              fecha: "Reciente",
              link: "/mi-espacio?tab=moderation"
            }
          ]);
        }
      }
    } catch (err) {
      console.error("Error al obtener moderación admin:", err);
    }
  };

  useEffect(() => {
    if (!cargando) {
      fetchUnreadChatsCount();
      fetchCartCount();
      fetchAdminModerationCount();
      
      const interval = setInterval(() => {
        if (document.visibilityState !== 'visible') return;
        fetchUnreadChatsCount();
        fetchCartCount();
        fetchAdminModerationCount();
      }, 15000);

      const handleRefresh = () => fetchUnreadChatsCount();
      const handleCartRefresh = () => fetchCartCount();
      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          fetchUnreadChatsCount();
          fetchCartCount();
          fetchAdminModerationCount();
        }
      };
      window.addEventListener('chat_messages_read', handleRefresh);
      window.addEventListener('cart_updated', handleCartRefresh);
      document.addEventListener('visibilitychange', handleVisibility);

      return () => {
        clearInterval(interval);
        window.removeEventListener('chat_messages_read', handleRefresh);
        window.removeEventListener('cart_updated', handleCartRefresh);
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

  interface Notificacion { id: number; texto: string; leida: boolean; fecha: string; link?: string; }
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const unreadNotifsCount = notificaciones.filter(n => !n.leida).length;

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

  const marcarTodasComoLeidas = () => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
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
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center border border-white"
                          style={{ backgroundColor: '#4D5E4F' }}
                        >
                          {unreadNotifsCount}
                        </span>
                      )}
                    </button>

                    {/* DROPDOWN NOTIFICACIONES */}
                    {notifAbierto && (
                      <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 p-4 space-y-3 animate-scale-in origin-top-right">
                        <div className="flex justify-between items-center text-xs pb-1 border-b border-gray-50">
                          <span className="font-extrabold text-gray-800">Notificaciones</span>
                          {unreadNotifsCount > 0 && (
                            <button 
                              onClick={marcarTodasComoLeidas}
                              className="text-[10px] text-[#4D5E4F] hover:underline font-bold"
                            >
                              Leer todas
                            </button>
                          )}
                        </div>
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {notificaciones.length === 0 ? (
                            <p className="text-[11px] text-gray-400 text-center py-4">No tienes notificaciones.</p>
                          ) : (
                            notificaciones.map(n => (
                              <div 
                                key={n.id} 
                                onClick={() => {
                                  if (n.link) {
                                    setNotifAbierto(false);
                                    router.push(n.link);
                                  }
                                }}
                                className={`p-2.5 rounded-xl text-[11px] leading-tight transition cursor-pointer ${
                                  n.leida ? 'bg-white text-gray-500' : 'bg-amber-50/90 text-amber-950 font-bold border-l-4 border-amber-500'
                                }`}
                              >
                                <p>{n.texto}</p>
                                <span className="text-[9px] text-amber-700/80 mt-1 block font-normal">{n.fecha}</span>
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

                    {/* MENÚ DESPLEGABLE DE MI ESPACIO Y CONFIGURACIÓN */}
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
                          href="/mi-espacio" 
                          onClick={() => setMenuAbierto(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition"
                        >
                          <User className="h-4 w-4 text-purple-600" /> Mi Espacio
                        </Link>

                        {esUsuarioAdmin && (
                          <Link 
                            href="/mi-espacio?tab=dashboard" 
                            onClick={() => setMenuAbierto(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-purple-800 hover:bg-purple-50 transition"
                          >
                            <ShieldCheck className="h-4 w-4 text-purple-600" /> Sección Administrador
                          </Link>
                        )}

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

      {/* SUB-BARRA DE MENÚ DE NAVEGACIÓN (Nuevos ingresos / Descubrir / Decoración / Iluminación / Alfombras / Exterior) - Se oculta en Mi Espacio y Consolas Root */}
      {!pathname?.startsWith('/mi-espacio') && !pathname?.startsWith('/root') && (
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
