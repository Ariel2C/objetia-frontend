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
  PlusCircle
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

  const renderNavList = () => (
    <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1 py-2 select-none">
      {itemsVisibles.map((item) => {
        const Icono = item.icon;
        const activo = tabActual === item.id && !item.isExternalLink;

        return (
          <button
            key={item.id}
            onClick={() => cambiarTab(item)}
            className={`w-full flex items-center justify-between px-3 h-[40px] rounded-xl text-[13.5px] font-medium transition-all text-left cursor-pointer group ${
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
            {renderNavList()}

            {/* Footer Usuario Móvil */}
            {usuario && (
              <div className="pt-3 border-t border-[#dadce0]/80 mt-auto space-y-2">
                <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-[#f8f9fa] border border-[#dadce0]/60">
                  <div className="w-8 h-8 rounded-full bg-[#e8f0fe] text-[#1a73e8] font-bold flex items-center justify-center text-xs flex-shrink-0">
                    {usuario.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#202124] truncate">{usuario.full_name}</p>
                    <p className="text-[10px] text-[#5f6368] truncate">{usuario.email}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SIDEBAR ESCRITORIO (Google AI Studio Light Rail) */}
      <aside 
        className={`hidden lg:flex flex-col justify-between bg-white border-r border-[#dadce0] transition-all duration-300 ease-in-out select-none flex-shrink-0 ${
          sidebarOculto ? 'w-0 opacity-0 overflow-hidden p-0 border-none pointer-events-none' : 'w-64 p-4 min-h-[calc(100vh-64px)]'
        }`}
      >
        {/* Lista de Navegación */}
        {renderNavList()}

        {/* Footer Usuario Desktop */}
        {usuario && (
          <div className="pt-3 border-t border-[#dadce0]/80 mt-auto flex-shrink-0 space-y-2">
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-[#f8f9fa] border border-[#dadce0]/70">
              <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-2xs">
                {usuario.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#202124] truncate leading-tight">{usuario.full_name}</p>
                <p className="text-[11px] text-[#5f6368] truncate leading-tight">{usuario.email}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 border border-red-100 transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 text-red-500" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
