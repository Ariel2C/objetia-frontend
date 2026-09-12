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
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  const tieneAccesoItem = (id: string) => {
    if (esRoot || tienePermiso('full_access')) return true;
    if (id === 'menu') return true;
    if (id === 'root') return tienePermiso('system') || tienePermiso('users') || tienePermiso('roles') || tienePermiso('permissions') || tienePermiso('sections') || tienePermiso('sessions') || tienePermiso('logs');
    if (id === 'dashboard') return tienePermiso('dashboard') || tienePermiso('admin_section') || esAdmin;
    if (id === 'moderation') return tienePermiso('moderation') || tienePermiso('manage_products') || esAdmin;
    if (id === 'appearance') return tienePermiso('appearance') || tienePermiso('cms') || esAdmin;
    if (id === 'campanas') return tienePermiso('campanas') || tienePermiso('cms') || esAdmin;
    if (id === 'secciones') return tienePermiso('secciones') || tienePermiso('cms') || esAdmin;
    if (id === 'billetera') return true;
    if (id === 'publications') return true;
    if (id === 'purchases') return true;
    if (id === 'sales') return true;
    if (id === 'chat') return true;
    if (id === 'vender') return true;
    if (id === 'perfil') return true;
    return tienePermiso(id);
  };

  const itemsNavegacion: TabItem[] = [
    { id: "billetera", label: "Mi Billetera", icon: DollarSign },
    { id: "publications", label: "Mis Publicaciones", icon: Package },
    { id: "purchases", label: "Mis Compras", icon: ShoppingBag },
    { id: "sales", label: "Mis Ventas", icon: TrendingUp },
    { id: "chat", label: "Mis Mensajes", icon: MessageSquare },
    { id: "perfil", label: "Mi Perfil", icon: UserCheck },
    { id: "vender", label: "Publicar Producto", icon: PlusCircle }
  ];

  const itemsVisibles = itemsNavegacion.filter(item => tieneAccesoItem(item.id));

  const cambiarTab = (item: TabItem) => {
    if (item.id === 'vender') {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vamaar:open-vender-modal'));
      }
      if (setMenuMovilAbierto) setMenuMovilAbierto(false);
      return;
    }
    if (item.href) {
      if (item.isExternalLink) {
        window.location.href = item.href;
      } else {
        router.push(item.href);
      }
      if (setMenuMovilAbierto) setMenuMovilAbierto(false);
      return;
    }
    setTabActual(item.id);
    if (setMenuMovilAbierto) setMenuMovilAbierto(false);
    window.history.pushState(null, '', `/mi-objetia?tab=${item.id}`);
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
    window.history.pushState(null, '', '/mi-objetia?tab=dashboard');
  };

  const esEsRoot = Boolean(
    roleClean === 'root' ||
    emailClean === 'root@objetia.com' ||
    (usuario && (usuario.role?.toLowerCase() === 'root' || usuario.email?.toLowerCase() === 'root@objetia.com'))
  );

  const badgeText = esEsRoot ? 'Root' : 'Admin';
  const badgeClasses = esEsRoot
    ? 'bg-[#FAF0E6] text-[#7B6858] border-[#EAE5DC] font-bold'
    : 'bg-[#FAF0E6] text-[#B88D65] border-[#EAE5DC] font-bold';

  const renderNavContent = () => (
    <div className="flex flex-col h-full justify-between overflow-hidden">
      {/* Cabecera con título Mi OBJETIA y línea divisoria inferior alineada con la topbar */}
      <div className="h-[60px] min-h-[60px] flex items-center justify-between px-4 border-b border-[#EAE5DC] flex-shrink-0">
        <span className="px-2 font-bold text-[16px] tracking-tight text-[#2C2723] font-sans">
          Mi OBJETIA
        </span>

        <div className="flex items-center gap-1">
          {/* Botón cerrar en móvil */}
          <button 
            onClick={() => setMenuMovilAbierto && setMenuMovilAbierto(false)} 
            className="lg:hidden text-[#7D756D] hover:text-[#2C2723] p-1 rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Navegación Principal */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-3 space-y-1.5 select-none">
        {itemsVisibles.map((item) => {
          const Icono = item.icon;
          const activo = tabActual === item.id && !item.isExternalLink;

          return (
            <button
              key={item.id}
              onClick={() => cambiarTab(item)}
              className={`w-full flex items-center justify-between px-3.5 h-[42px] rounded-xl text-[13.5px] transition-all text-left cursor-pointer group ${
                activo
                  ? 'bg-[#FAF0E6] text-[#B88D65] shadow-xs font-bold border border-[#EAE5DC]'
                  : 'text-[#534636] font-medium hover:bg-[#F2EFE9] hover:text-[#2C2723]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icono 
                  className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 ${
                    activo 
                      ? 'text-[#B88D65]' 
                      : 'text-[#7D756D] group-hover:text-[#2C2723]'
                  }`} 
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge ? (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${item.badgeColor || 'bg-[#FAF0E6] text-[#B88D65] border border-[#EAE5DC]'}`}>
                  {item.badge}
                </span>
              ) : item.isExternalLink ? (
                <ExternalLink className="h-3.5 w-3.5 text-[#7D756D] group-hover:text-[#2C2723]" />
              ) : activo ? (
                <span className="w-1.5 h-1.5 rounded-full bg-[#B88D65]" />
              ) : null}
            </button>
          );
        })}

        {/* SECCIÓN OBJETIA STUDIO (Sólo para Administradores / Root) */}
        {esUsuarioAdmin && (
          <div className="pt-4 mt-4 border-t border-[#EAE5DC]">
            <button
              onClick={abrirAdminStudio}
              className="w-full flex items-center justify-between px-3.5 h-[42px] rounded-xl text-[13.5px] font-semibold text-[#2C2723] hover:bg-[#FAF0E6] hover:text-[#B88D65] transition-all text-left cursor-pointer group border border-transparent hover:border-[#EAE5DC]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <ShieldCheck className={`h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                  esEsRoot ? 'text-amber-700' : 'text-[#B88D65]'
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
          <div className="fixed inset-y-0 left-0 w-[280px] bg-[#FAF8F5] border-r border-[#EAE5DC] shadow-2xl flex flex-col z-10 animate-slide-right overflow-hidden">
            {renderNavContent()}
          </div>
        </div>
      )}

      {/* SIDEBAR ESCRITORIO (Deslizamiento físico a la izquierda sin deformación) */}
      <aside 
        className={`hidden lg:flex flex-col bg-[#FAF8F5] border-r border-[#EAE5DC] transition-all duration-300 ease-in-out select-none flex-shrink-0 w-64 h-full min-h-[calc(100vh-64px)] overflow-hidden ${
          sidebarOculto ? '-ml-64 pointer-events-none' : 'ml-0'
        }`}
      >
        {renderNavContent()}
      </aside>
    </>
  );
}
