"use client";
import React from 'react';
import { 
  LayoutDashboard, 
  Palette, 
  Sliders, 
  Image as ImageIcon, 
  DollarSign, 
  UserCheck, 
  LogOut, 
  ShoppingBag, 
  TrendingUp, 
  Package, 
  LayoutGrid, 
  Terminal, 
  PanelLeftClose, 
  X,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  PlusCircle,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../components/AuthContext';

interface SidebarProps {
  tabActual: string;
  setTabActual: (tab: string) => void;
  esAdmin: boolean;
  esRoot?: boolean;
  logout: () => void;
  sidebarOculto?: boolean;
  setSidebarOculto?: (oculto: boolean) => void;
  menuMovilAbierto?: boolean;
  setMenuMovilAbierto?: (abierto: boolean) => void;
}

interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  isExternalLink?: boolean;
  href?: string;
  badge?: string;
  badgeColor?: string;
}

export default function Sidebar({
  tabActual,
  setTabActual,
  esAdmin,
  esRoot,
  logout,
  sidebarOculto = false,
  setSidebarOculto,
  menuMovilAbierto = false,
  setMenuMovilAbierto
}: SidebarProps) {
  const { usuario, tienePermiso } = useAuth();

  const tieneAccesoItem = (id: string) => {
    if (esRoot || tienePermiso('full_access')) return true;
    if (id === 'menu') return true;
    if (id === 'root') return tienePermiso('system') || tienePermiso('users') || tienePermiso('roles') || tienePermiso('permissions') || tienePermiso('sections') || tienePermiso('sessions') || tienePermiso('logs');
    if (id === 'dashboard') return tienePermiso('dashboard') || tienePermiso('admin_section') || esAdmin;
    if (id === 'moderation') return tienePermiso('moderation') || tienePermiso('manage_products') || esAdmin;
    if (id === 'appearance') return tienePermiso('appearance') || tienePermiso('cms') || esAdmin;
    if (id === 'campanas') return tienePermiso('campanas') || tienePermiso('cms') || esAdmin;
    if (id === 'secciones') return tienePermiso('secciones') || tienePermiso('cms') || esAdmin;
    if (id === 'banners') return tienePermiso('banners') || tienePermiso('cms') || esAdmin;
    if (id === 'billetera') return tienePermiso('billetera');
    if (id === 'publications') return tienePermiso('publications');
    if (id === 'purchases') return tienePermiso('purchases');
    if (id === 'sales') return tienePermiso('sales');
    if (id === 'vender') return tienePermiso('publications') || tienePermiso('sales');
    if (id === 'perfil') return tienePermiso('perfil') || true;
    return tienePermiso(id);
  };

  const itemsNavegacion: TabItem[] = [
    { id: "billetera", label: "Mi Billetera", icon: DollarSign },
    { id: "publications", label: "Mis Publicaciones", icon: Package },
    { id: "purchases", label: "Mis Compras", icon: ShoppingBag },
    { id: "sales", label: "Mis Ventas", icon: TrendingUp },
    { id: "perfil", label: "Mi Perfil", icon: UserCheck },
    { id: "vender", label: "Publicar Producto", icon: PlusCircle, isExternalLink: true, href: "/products/new" }
  ];

  const itemsVisibles = itemsNavegacion.filter(item => tieneAccesoItem(item.id));

  const cambiarTab = (item: TabItem) => {
    if (item.isExternalLink && item.href) {
      window.location.href = item.href;
      return;
    }
    setTabActual(item.id);
    if (setMenuMovilAbierto) setMenuMovilAbierto(false);
    window.history.pushState(null, '', `/mi-espacio?tab=${item.id}`);
  };

  // Obtener usuario del contexto o de localStorage como fallback inmediato
  const getStoredUser = () => {
    if (usuario) return usuario;
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('vamaar_user');
        if (raw) return JSON.parse(raw);
      } catch (e) {}
    }
    return null;
  };

  const currentUser = usuario || getStoredUser();
  const roleClean = (currentUser?.role || '').toLowerCase();
  const emailClean = (currentUser?.email || '').toLowerCase();

  const esUsuarioAdmin = Boolean(
    esRoot ||
    esAdmin ||
    roleClean === 'root' ||
    roleClean === 'admin' ||
    roleClean === 'administrador' ||
    roleClean.includes('root') ||
    roleClean.includes('admin') ||
    emailClean === 'root@objetia.com' ||
    emailClean === 'admin@vamaar.com' ||
    emailClean.includes('root') ||
    emailClean.includes('admin') ||
    tienePermiso('full_access') ||
    tienePermiso('admin_section') ||
    tienePermiso('dashboard') ||
    tienePermiso('system') ||
    tienePermiso('users') ||
    tienePermiso('roles') ||
    tienePermiso('permissions') ||
    tienePermiso('sections') ||
    tienePermiso('sessions') ||
    tienePermiso('logs')
  );

  const abrirAdminStudio = () => {
    if (setMenuMovilAbierto) setMenuMovilAbierto(false);
    setTabActual('dashboard');
    window.history.pushState(null, '', '/mi-espacio?tab=dashboard');
  };

  const esEsRoot = Boolean(
    esRoot ||
    roleClean === 'root' ||
    roleClean.includes('root') ||
    emailClean === 'root@objetia.com'
  );

  const badgeText = esEsRoot ? 'Root' : 'Admin';
  const badgeClasses = esEsRoot
    ? 'bg-amber-50 text-amber-800 border-amber-200 font-bold'
    : 'bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc] font-bold';

  const renderNavContent = () => (
    <div className="flex flex-col h-full justify-between">
      {/* Navegación Principal */}
      <div className="space-y-1.5 pt-8 select-none">
        {itemsVisibles.map((item) => {
          const Icono = item.icon;
          const activo = tabActual === item.id && !item.isExternalLink;

          return (
            <button
              key={item.id}
              onClick={() => cambiarTab(item)}
              className={`w-full flex items-center justify-between px-3.5 h-[42px] rounded-xl text-[13.5px] font-medium transition-all text-left cursor-pointer group ${
                activo
                  ? 'bg-[#e8f0fe] text-[#1a73e8] shadow-2xs font-semibold'
                  : 'text-[#3c4043] hover:bg-[#f1f3f4] hover:text-[#1f1f1f]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icono 
                  className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 ${
                    activo 
                      ? 'text-[#1a73e8]' 
                      : 'text-[#5f6368] group-hover:text-[#1f1f1f]'
                  }`} 
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge ? (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${item.badgeColor || 'bg-gray-100 text-gray-700'}`}>
                  {item.badge}
                </span>
              ) : item.isExternalLink ? (
                <ExternalLink className="h-3.5 w-3.5 text-[#9aa0a6] group-hover:text-[#5f6368]" />
              ) : activo ? (
                <span className="w-1.5 h-1.5 rounded-full bg-[#1a73e8]" />
              ) : null}
            </button>
          );
        })}

        {/* SECCIÓN OBJETIA STUDIO (Sólo para Administradores / Root) */}
        {esUsuarioAdmin && (
          <div className="pt-4 mt-4 border-t border-[#dadce0]">
            <button
              onClick={abrirAdminStudio}
              className="w-full flex items-center justify-between px-3.5 h-[42px] rounded-xl text-[13.5px] font-semibold text-[#202124] hover:bg-[#e8f0fe] hover:text-[#1a73e8] transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <ShieldCheck className={`h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                  esEsRoot ? 'text-amber-600' : 'text-[#1a73e8]'
                }`} />
                <span className="truncate">OBJETIA studio</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider border ${badgeClasses}`}>
                {badgeText}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* DRAWER MÓVIL (Off-canvas en Light Mode) */}
      {menuMovilAbierto && (
        <div className="fixed inset-0 z-[100] lg:hidden animate-fade-in">
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity" 
            onClick={() => setMenuMovilAbierto && setMenuMovilAbierto(false)} 
          />
          <div className="fixed inset-y-0 left-0 w-[280px] bg-white border-r border-[#dadce0] shadow-2xl flex flex-col p-4 z-10 animate-slide-right">
            {/* Cabecera Móvil */}
            <div className="flex items-center justify-end pb-2 border-b border-[#dadce0]/80">
              <button 
                onClick={() => setMenuMovilAbierto && setMenuMovilAbierto(false)}
                className="p-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] rounded-lg transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Menú Scroll */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
              {renderNavContent()}
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR ESCRITORIO (Deslizamiento físico a la izquierda sin deformación) */}
      <aside 
        className={`hidden lg:flex flex-col bg-white border-r border-[#dadce0] transition-all duration-300 ease-in-out select-none flex-shrink-0 w-64 p-4 min-h-[calc(100vh-58px)] overflow-y-auto custom-scrollbar ${
          sidebarOculto ? '-ml-64 pointer-events-none' : 'ml-0'
        }`}
      >
        {renderNavContent()}
      </aside>
    </>
  );
}
