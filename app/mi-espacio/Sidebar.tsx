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
  Settings,
  ShoppingBag,
  TrendingUp,
  Package,
  LayoutGrid,
  Terminal,
  Crown
} from 'lucide-react';

interface SidebarProps {
  tabActual: string;
  setTabActual: (tab: string) => void;
  esAdmin: boolean;
  esRoot?: boolean;
  logout: () => void;
}

interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  soloAdmin?: boolean;
  soloRoot?: boolean;
}

const GRUPOS: { titulo: string; soloAdmin?: boolean; soloRoot?: boolean; items: TabItem[] }[] = [
  {
    titulo: "Navegación",
    items: [
      { id: "menu", label: "Menú de Tarjetas", icon: LayoutGrid },
    ],
  },
  {
    titulo: "Programador Root",
    soloRoot: true,
    items: [
      { id: "root", label: "Panel Programador", icon: Terminal },
    ],
  },
  {
    titulo: "Gestión General",
    soloAdmin: true,
    items: [
      { id: "dashboard", label: "Panel de Control", icon: LayoutDashboard },
      { id: "appearance", label: "Apariencia", icon: Palette },
      { id: "secciones", label: "Personalización", icon: Sliders },
      { id: "banners", label: "Banners publicitarios", icon: ImageIcon },
    ],
  },
  {
    titulo: "Mi Cuenta",
    items: [
      { id: "billetera", label: "Billetera", icon: DollarSign },
      { id: "publications", label: "Mis Publicaciones", icon: Package },
      { id: "purchases", label: "Mis Compras", icon: ShoppingBag },
      { id: "sales", label: "Mis Ventas", icon: TrendingUp },
      { id: "perfil", label: "Mi Perfil", icon: UserCheck },
    ],
  },
];

import { useAuth } from '../../components/AuthContext';

export default function Sidebar({ tabActual, setTabActual, esAdmin, esRoot, logout }: SidebarProps) {
  const { tienePermiso } = useAuth();

  const gruposVisibles = GRUPOS.filter(g => {
    if (g.soloRoot) return esRoot || tienePermiso('manage_roles') || tienePermiso('full_access') || tienePermiso('system');
    if (g.soloAdmin) return esAdmin || tienePermiso('full_access') || tienePermiso('admin_section') || tienePermiso('cms');
    return true;
  }).map(g => ({
    ...g,
    items: g.items.filter(item => {
      if (item.id === 'root') return esRoot || tienePermiso('manage_roles') || tienePermiso('manage_users') || tienePermiso('system');
      if (item.id === 'dashboard') return esAdmin || tienePermiso('full_access') || tienePermiso('manage_roles') || tienePermiso('dashboard') || tienePermiso('admin_section');
      if (item.id === 'appearance') return esAdmin || tienePermiso('manage_branding') || tienePermiso('full_access') || tienePermiso('appearance') || tienePermiso('cms');
      if (item.id === 'secciones') return esAdmin || tienePermiso('manage_branding') || tienePermiso('full_access') || tienePermiso('secciones') || tienePermiso('cms');
      if (item.id === 'banners') return esAdmin || tienePermiso('manage_banners') || tienePermiso('full_access') || tienePermiso('banners') || tienePermiso('cms');
      if (item.id === 'billetera') return tienePermiso('wallet_access') || tienePermiso('billetera') || tienePermiso('mi_espacio') || tienePermiso('full_access') || esRoot;
      if (item.id === 'publications') return tienePermiso('sell_products') || tienePermiso('publications') || tienePermiso('mi_espacio') || tienePermiso('full_access') || esRoot;
      if (item.id === 'purchases') return tienePermiso('buy_products') || tienePermiso('purchases') || tienePermiso('mi_espacio') || tienePermiso('full_access') || esRoot;
      if (item.id === 'sales') return tienePermiso('sell_products') || tienePermiso('sales') || tienePermiso('mi_espacio') || tienePermiso('full_access') || esRoot;
      if (item.id === 'perfil') return tienePermiso('perfil') || tienePermiso('mi_espacio') || tienePermiso('full_access') || true;
      return tienePermiso(item.id) || tienePermiso('full_access') || esRoot;
    })
  }));
  const todosLosItems = gruposVisibles.flatMap(g => g.items);

  const cambiarTab = (id: string) => {
    setTabActual(id);
    window.history.pushState(null, '', `/mi-espacio?tab=${id}`);
  };

  return (
    <>
      {/* MÓVIL: barra de pestañas horizontal deslizable */}
      <div className="lg:hidden bg-[#EAEAEA] border-b border-gray-200/60 px-3 py-2.5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none' }}>
          {todosLosItems.map((item) => {
            const Icono = item.icon;
            const activo = tabActual === item.id;
            return (
              <button
                key={item.id}
                onClick={() => cambiarTab(item.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition cursor-pointer border ${
                  activo
                    ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                    : 'bg-white text-[#5F6368] border-gray-200 hover:border-gray-400'
                }`}
              >
                <Icono className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={logout}
            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition cursor-pointer border bg-white text-red-500 border-red-200 hover:bg-red-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">Salir</span>
          </button>
        </div>
      </div>

      {/* DESKTOP: sidebar vertical */}
      <aside className="hidden lg:flex w-64 bg-[#EAEAEA] border-r border-gray-200/60 p-6 flex-col justify-between flex-shrink-0 select-none">
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-3 pb-2 border-b border-gray-300/50">
            <Settings className="h-4 w-4 text-[#5F6368]" />
            <h2 className="text-[15px] font-semibold text-[#202124] tracking-tight">Configuración</h2>
          </div>

          <nav className="space-y-6">
            {gruposVisibles.map((grupo, gIdx) => (
              <div key={grupo.titulo} className={`space-y-1.5 ${gIdx > 0 ? 'pt-2 border-t border-gray-300/40' : ''}`}>
                <div className="flex items-center gap-1.5 px-3 pb-1 border-b border-gray-300/30">
                  <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">{grupo.titulo}</span>
                </div>
                {grupo.items.map((item) => {
                  const Icono = item.icon;
                  const activo = tabActual === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => cambiarTab(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13.5px] transition text-left cursor-pointer ${
                        activo
                          ? 'bg-purple-700 text-white font-medium shadow-sm'
                          : 'text-[#5F6368] hover:bg-gray-200/50 font-normal'
                      }`}
                    >
                      <Icono className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div className="border-t border-gray-300 pt-4 mt-6">
          <button 
            onClick={logout} 
            className="w-full py-2 border border-red-200 hover:bg-red-50 text-red-500 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
