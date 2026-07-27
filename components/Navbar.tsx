// components/Navbar.tsx
"use client";
import React, { useState, useEffect, useRef } from 'react';
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

  useEffect(() => {
    const handleBrandingUpdated = (e: any) => {
      if (e.detail) {
        if (e.detail.brandName !== undefined) setBrandNameState(e.detail.brandName);
        if (e.detail.logoUrl !== undefined) setLogoUrlState(e.detail.logoUrl);
        if (e.detail.brandFontSize !== undefined) setBrandFontSizeState(e.detail.brandFontSize);
        if (e.detail.brandFontFamily !== undefined) setBrandFontFamilyState(e.detail.brandFontFamily);
      }
    };
    window.addEventListener('branding_updated', handleBrandingUpdated);
    return () => window.removeEventListener('branding_updated', handleBrandingUpdated);
  }, []);

  const getStoredToken = () => localStorage.getItem('vamaar_token') || token;

  const fetchUnreadChatsCount = async () => {
    const authToken = getStoredToken();
    if (!usuario || !usuario.id || !authToken) {
      setUnreadChatsCount(0);
      return;
    }
    try {
      // El backend deriva el usuario del token JWT
      const res = await fetch(`${getApiUrl()}/chat/unread-count/`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
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
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
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
        // No consultar cuando la pestaña está en segundo plano
        if (document.visibilityState !== 'visible') return;
        fetchUnreadChatsCount();
        fetchCartCount();
      }, 15000);

      const handleRefresh = () => {
        fetchUnreadChatsCount();
      };
      const handleCartRefresh = () => {
        fetchCartCount();
      };
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
    if (logoUrl) {
      setLogoUrlState(logoUrl);
    }
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

  // Sin datos simulados: cuando exista el endpoint de notificaciones, cargarlas acá
  interface Notificacion { id: number; texto: string; leida: boolean; fecha: string; }
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  const unreadNotifsCount = notificaciones.filter(n => !n.leida).length;

  // Cerrar menú al hacer click afuera
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

  // Carga de favoritos desde localStorage
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

  return (
    <nav style={{ backgroundColor: 'var(--bg-navbar)' }} className="border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* LOGO DE MARCA Y TIPOGRAFÍA DINÁMICA */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl font-bold tracking-tight transition hover:opacity-95 flex items-center gap-2.5 group">
              <img 
                src={logoUrlState && logoUrlState !== "" && logoUrlState !== "https://" ? logoUrlState : "/objetia_logo.png"} 
                alt="Logo" 
                className="h-10 w-10 sm:h-11 sm:w-11 object-contain rounded-xl border border-purple-100 shadow-xs group-hover:scale-105 transition-transform" 
              />
              <span 
                style={{ 
                  fontFamily: `var(--font-family-brand, ${brandFontFamilyState})`,
                  fontSize: `var(--font-size-brand, ${brandFontSizeState})`
                }} 
                className="font-black tracking-wider text-purple-900 uppercase leading-none"
              >
                {brandNameState || 'OBJETIA'}
              </span>
            </Link>
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

            {/* BOTÓN FAVORITOS (Corazón con un indicador de punto único limpio) */}
            <Link href="/products/favorites" className="relative text-gray-500 hover:text-red-500 transition p-1 hidden md:block">
              <Heart className="h-5.5 w-5.5" />
              {favoritosCount > 0 && (
                <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse" />
              )}
            </Link>

            {/* BOTÓN CHAT */}
            <Link href="/chat" className="relative text-gray-500 hover:text-[var(--color-primary)] transition p-1 hidden md:block">
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
            <Link href="/cart" className="relative text-gray-500 hover:text-[var(--color-primary)] transition p-1 hidden md:block">
              <ShoppingCart className="h-5.5 w-5.5" />
              {cartCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center border border-white bg-red-500 animate-pulse"
                >
                  {cartCount}
                </span>
              )}
            </Link>

            {/* BOTÓN NOTIFICACIONES FUNCIONAL */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setNotifAbierto(!notifAbierto)}
                aria-label="Notificaciones"
                className="relative text-gray-500 hover:text-[var(--color-primary)] transition p-1 cursor-pointer focus:outline-none"
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
                          {usuario.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-semibold text-gray-700 hidden md:inline-block">
                        {usuario.full_name.split(" ")[0]} {usuario.full_name.split(" ")[1] || ""}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>

                    {/* MENÚ FLOTANTE DROPDOWN */}
                    {menuAbierto && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 p-2 overflow-hidden animate-scale-in origin-top-right">
                        
                        <button 
                          onClick={() => { setMenuAbierto(false); router.push("/mi-espacio"); }}
                          className="w-full text-left py-2 px-3 rounded-lg hover:bg-gray-50 font-bold text-xs text-gray-700 flex items-center gap-2 transition cursor-pointer"
                        >
                          <User className="h-4 w-4 text-gray-500" /> Mi Espacio
                        </button>

                        <hr className="border-gray-100 my-1" />

                        <button 
                          onClick={() => { setMenuAbierto(false); logout(); }}
                          className="w-full text-left py-2 px-3 rounded-lg hover:bg-red-50 font-bold text-xs text-red-500 flex items-center gap-2 transition cursor-pointer"
                        >
                          <LogOut className="h-4 w-4 text-[#4D5E4F]" /> Cerrar sesión
                        </button>

                      </div>
                    )}

                  </div>
                ) : (
                  <Link href="/auth" className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[var(--color-primary)] border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                    <User className="h-4 w-4" /> Ingresar
                  </Link>
                )
              )}
            </div>

            {/* Shimmer de carga para mitigar el flash de UI */}
            {cargando && (
              <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-xl hidden md:block" />
            )}

          </div>

        </div>
      </div>

      {/* BARRA DE NAVEGACIÓN INFERIOR PARA MÓVILES (ESTILO MERCADO LIBRE) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:hidden flex justify-around items-center h-16 px-2">
        <Link href="/" className="flex flex-col items-center justify-center flex-1 py-1 text-gray-500 hover:text-[var(--color-primary)] transition">
          <Home className="h-5 w-5" />
          <span className="text-[9px] font-extrabold mt-1">Inicio</span>
        </Link>
        
        <Link href="/catalog" className="flex flex-col items-center justify-center flex-1 py-1 text-gray-500 hover:text-[var(--color-primary)] transition">
          <Search className="h-5 w-5" />
          <span className="text-[9px] font-extrabold mt-1">Buscar</span>
        </Link>

        {usuario && (
          <Link href="/products/new" className="flex flex-col items-center justify-center flex-1 py-1 text-gray-500 hover:text-[var(--color-primary)] transition">
            <div className="h-8 w-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-md">
              <PlusCircle className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-[8px] font-extrabold mt-0.5">Vender</span>
          </Link>
        )}

        <Link href="/products/favorites" className="relative flex flex-col items-center justify-center flex-1 py-1 text-gray-500 hover:text-red-500 transition">
          <Heart className="h-5 w-5" />
          {favoritosCount > 0 && (
            <span className="absolute top-1 right-5 h-2 w-2 rounded-full bg-red-500 border border-white animate-pulse" />
          )}
          <span className="text-[9px] font-extrabold mt-1">Favoritos</span>
        </Link>

        <Link href="/chat" className="relative flex flex-col items-center justify-center flex-1 py-1 text-gray-500 hover:text-[var(--color-primary)] transition">
          <div className="relative">
            <MessageSquare className="h-5 w-5" />
            {unreadChatsCount > 0 && (
              <span 
                className="absolute -top-1.5 -right-2 h-4 w-4 rounded-full text-[8px] font-bold text-white flex items-center justify-center border border-white bg-red-500 animate-pulse"
              >
                {unreadChatsCount}
              </span>
            )}
          </div>
          <span className="text-[9px] font-extrabold mt-1">Chats</span>
         </Link>

        <Link href="/cart" className="relative flex flex-col items-center justify-center flex-1 py-1 text-gray-500 hover:text-[var(--color-primary)] transition">
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span 
                className="absolute -top-1.5 -right-2 h-4 w-4 rounded-full text-[8px] font-bold text-white flex items-center justify-center border border-white bg-red-500 animate-pulse"
              >
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[9px] font-extrabold mt-1">Carrito</span>
        </Link>

        <Link 
          href={usuario ? "/mi-espacio" : "/auth"} 
          className="flex flex-col items-center justify-center flex-1 py-1 text-gray-500 hover:text-[var(--color-primary)] transition"
        >
          {usuario ? (
            usuario.avatar_url ? (
              <img src={usuario.avatar_url} alt="Avatar" className="h-5.5 w-5.5 rounded-full object-cover border border-gray-200" />
            ) : (
              <div className="h-5.5 w-5.5 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-extrabold text-[9px] border border-gray-200">
                {usuario.full_name.charAt(0).toUpperCase()}
              </div>
            )
          ) : (
            <User className="h-5 w-5" />
          )}
          <span className="text-[9px] font-extrabold mt-1">{usuario ? "Mi Panel" : "Ingresar"}</span>
        </Link>
      </div>
    </nav>
  );
}
