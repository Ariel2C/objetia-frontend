// components/Navbar.tsx
"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  MessageSquare, 
  Heart, 
  LogOut, 
  User, 
  Sliders, 
  Bell, 
  ChevronDown,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  Loader2,
  Home,
  Search,
  PlusCircle
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { getApiUrl } from '../lib/config';

interface NavbarProps {
  logoUrl?: string;
}

export default function Navbar({ logoUrl }: NavbarProps) {
  const { usuario, logout, token, cargando } = useAuth();
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [notifAbierto, setNotifAbierto] = useState(false);
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

  useEffect(() => {
    if (!cargando) {
      fetchUnreadChatsCount();
      fetchCartCount();
      
      const interval = setInterval(() => {
        if (document.visibilityState !== 'visible') return;
        fetchUnreadChatsCount();
        fetchCartCount();
      }, 15000);

      const handleRefresh = () => fetchUnreadChatsCount();
      const handleCartRefresh = () => fetchCartCount();
      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          fetchUnreadChatsCount();
          fetchCartCount();
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

  interface Notificacion { id: number; texto: string; leida: boolean; fecha: string; }
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

  const esNavOscuro = useMemo(() => {
    if (!navBgColorState) return false;
    const val = navBgColorState.toLowerCase().trim();
    // Si es blanco puro o transparente, usar íconos y texto oscuros por defecto
    if (val === '#ffffff' || val === '#fff' || val === 'rgb(255, 255, 255)' || val === 'rgb(255,255,255)' || val === 'white' || val === 'transparent') {
      return false;
    }
    // Si es rgb(r, g, b)
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
    // Cualquier otro color de fondo personalizado (ej: "black", "#000", "#111")
    return true;
  }, [navBgColorState]);

  const iconClass = esNavOscuro 
    ? "relative text-white hover:text-gray-100 transition p-1 cursor-pointer" 
    : "relative text-gray-700 hover:text-gray-900 transition p-1 cursor-pointer";

  return (
    <nav style={{ backgroundColor: 'var(--bg-navbar)' }} className="border-b border-gray-100/30 sticky top-0 z-50 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-4">
          
          {/* LOGO DE MARCA Y TIPOGRAFÍA DINÁMICA CON CONTRASTE ADAPTABLE */}
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

          {/* CUADRO DE BÚSQUEDA INTEGRADO CON DIVISOR EN EL NAVBAR */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <form onSubmit={handleNavbarSearch} className="flex items-stretch bg-white border border-gray-300 rounded-none focus-within:border-gray-500 transition shadow-2xs">
              <input 
                type="text" 
                value={navbarSearch}
                onChange={(e) => setNavbarSearch(e.target.value)}
                placeholder="Buscar muebles, iluminación, decoración..." 
                className="w-full bg-transparent pl-3.5 pr-2 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              />
              {/* DIVISOR VERTICAL INTERNO */}
              <div className="w-[1px] bg-gray-300 my-1.5" />
              <button 
                type="submit"
                aria-label="Buscar"
                className="px-3.5 flex items-center justify-center text-gray-500 hover:text-gray-900 transition cursor-pointer bg-transparent"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* MENÚ DE ACCIONES */}
          <div className="flex items-center space-x-6">
            
            {/* BOTÓN VENDER */}
            {!cargando && usuario && (
              <Link 
                href="/products/new" 
                className="hidden sm:inline-flex items-center justify-center text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Vender
              </Link>
            )}

            {/* BOTÓN FAVORITOS */}
            <Link href="/products/favorites" className={`${iconClass} hidden md:block`}>
              <Heart className="h-5.5 w-5.5" />
              {favoritosCount > 0 && (
                <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse" />
              )}
            </Link>

            {/* BOTÓN CHAT */}
            <Link href="/chat" className={`${iconClass} hidden md:block`}>
              <MessageSquare className="h-5.5 w-5.5" />
              {unreadChatsCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center border border-white bg-red-500 animate-pulse"
                >
                  {unreadChatsCount}
                </span>
              )}
            </Link>

            {/* BOTÓN CARRITO */}
            <Link href="/cart" className={`${iconClass} hidden md:block`}>
              <ShoppingCart className="h-5.5 w-5.5" />
              {cartCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center border border-white bg-red-500 animate-pulse"
                >
                  {cartCount}
                </span>
              )}
            </Link>

            {/* BOTÓN NOTIFICACIONES */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setNotifAbierto(!notifAbierto)}
                aria-label="Notificaciones"
                className={`${iconClass} focus:outline-none`}
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

              {/* DROPDOWN DE NOTIFICACIONES */}
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
                        <div key={n.id} className={`p-2.5 rounded-xl text-[11px] leading-tight transition ${n.leida ? 'bg-white text-gray-500' : 'bg-gray-50 text-gray-800 font-medium border-l-4 border-[#4D5E4F]'}`}>
                          <p>{n.texto}</p>
                          <span className="text-[9px] text-gray-400 mt-1 block">{n.fecha}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* BARRA DE PERFIL Y DROPDOWN (SOLO DESKTOP) */}
            <div className="hidden md:block">
              {!cargando && (
                usuario ? (
                  <div className="relative" ref={dropdownRef}>
                    
                    {/* BOTÓN DE PERFIL */}
                    <button 
                      onClick={() => setMenuAbierto(!menuAbierto)}
                      className="flex items-center gap-2 cursor-pointer focus:outline-none hover:opacity-90 transition p-1.5 rounded-xl"
                    >
                      {usuario.avatar_url ? (
                        <img src={usuario.avatar_url} alt="Avatar" className="h-8 w-8 rounded-full border border-gray-100 object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 font-extrabold border border-gray-200">
                          {usuario.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <span className={`text-xs font-bold ${esNavOscuro ? "text-white" : "text-gray-800"}`}>
                        {usuario.full_name?.split(" ")[0]}
                      </span>
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${esNavOscuro ? "text-gray-300" : "text-gray-500"} ${menuAbierto ? 'rotate-180' : ''}`} />
                    </button>

                    {/* MENÚ DESPLEGABLE DE PERFIL */}
                    {menuAbierto && (
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-scale-in origin-top-right">
                        <div className="px-3 py-2 border-b border-gray-50">
                          <p className="text-xs font-bold text-gray-900 truncate">{usuario.full_name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{usuario.email}</p>
                          {usuario.role === 'ADMIN' && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-full bg-purple-100 text-purple-700">
                              Administrador
                            </span>
                          )}
                        </div>

                        <Link 
                          href="/mi-espacio" 
                          onClick={() => setMenuAbierto(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-purple-700 transition"
                        >
                          <User className="h-4 w-4 text-gray-400" /> Mi Espacio
                        </Link>

                        <Link 
                          href="/products/favorites" 
                          onClick={() => setMenuAbierto(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-purple-700 transition md:hidden"
                        >
                          <Heart className="h-4 w-4 text-gray-400" /> Favoritos
                        </Link>

                        <Link 
                          href="/chat" 
                          onClick={() => setMenuAbierto(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-purple-700 transition md:hidden"
                        >
                          <MessageSquare className="h-4 w-4 text-gray-400" /> Mis Mensajes
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
                ) : (
                  <div className="flex items-center gap-2">
                    <Link 
                      href="/auth" 
                      className={`text-xs font-bold px-3 py-2 transition ${
                        esNavOscuro ? "text-white hover:text-gray-200" : "text-gray-700 hover:text-purple-700"
                      }`}
                    >
                      Ingresar
                    </Link>
                    <Link 
                      href="/auth" 
                      style={{ backgroundColor: 'var(--color-primary, #2C3E50)', color: '#FFFFFF' }}
                      className="text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs hover:opacity-90"
                    >
                      Registrarse
                    </Link>
                  </div>
                )
              )}
            </div>

          </div>

        </div>
      </div>
    </nav>
  );
}
