"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Palette, 
  Sliders, 
  Image as ImageIcon, 
  DollarSign, 
  UserCheck, 
  ShoppingBag, 
  TrendingUp, 
  Package,
  PlusCircle,
  MessageSquare,
  Heart,
  Calendar,
  ShieldAlert,
  Terminal,
  Crown
} from 'lucide-react';

interface CardItem {
  id: string;
  label: string;
  icon: React.ElementType;
  isExternalLink?: boolean;
  href?: string;
  iconColor?: string;
}

interface MenuCardsProps {
  tabActual: string;
  setTabActual: (tab: string) => void;
  esAdmin: boolean;
  esRoot?: boolean;
  onSelectCard?: (tabId: string) => void;
  logout?: () => void;
}

import { useAuth } from '../../components/AuthContext';

export default function MenuCards({ tabActual, setTabActual, esAdmin, esRoot, onSelectCard }: MenuCardsProps) {
  const router = useRouter();
  const { tienePermiso } = useAuth();

  const tieneAccesoAdmin = esAdmin || tienePermiso('manage_roles') || tienePermiso('manage_products') || tienePermiso('manage_banners') || tienePermiso('full_access');

  // Tarjetas para Administradores
  const adminCards: { titulo: string; items: CardItem[] }[] = [
    {
      titulo: "Administración",
      items: [
        ...((esRoot || tienePermiso('manage_roles') || tienePermiso('manage_users')) ? [{
          id: "root",
          label: "Panel Programador",
          icon: Terminal,
          iconColor: "text-amber-500 font-extrabold"
        }] : []),
        ...(esAdmin || tienePermiso('full_access') ? [{
          id: "dashboard",
          label: "Panel de control",
          icon: LayoutDashboard,
          iconColor: "text-purple-700"
        }] : []),
        ...(esAdmin || tienePermiso('manage_branding') || tienePermiso('full_access') ? [{
          id: "appearance",
          label: "Apariencia web",
          icon: Palette,
          iconColor: "text-purple-700"
        }] : []),
        ...(esAdmin || tienePermiso('manage_branding') || tienePermiso('full_access') ? [{
          id: "campanas",
          label: "Campañas y Eventos",
          icon: Calendar,
          iconColor: "text-purple-700"
        }] : []),
        ...(esAdmin || tienePermiso('manage_branding') || tienePermiso('full_access') ? [{
          id: "secciones",
          label: "Personalización",
          icon: Sliders,
          iconColor: "text-purple-700"
        }] : []),
        ...(esAdmin || tienePermiso('manage_products') || tienePermiso('full_access') ? [{
          id: "moderation",
          label: "Productos en revisión",
          icon: ShieldAlert,
          iconColor: "text-amber-600"
        }] : []),
        ...(esAdmin || tienePermiso('manage_banners') || tienePermiso('full_access') ? [{
          id: "banners",
          label: "Banners inicio",
          icon: ImageIcon,
          iconColor: "text-purple-700"
        }] : []),
      ]
    },
    {
      titulo: "Mi Cuenta",
      items: [
        {
          id: "billetera",
          label: "Mi billetera",
          icon: DollarSign,
          iconColor: "text-purple-700"
        },
        {
          id: "publications",
          label: "Mis publicaciones",
          icon: Package,
          iconColor: "text-purple-700"
        },
        {
          id: "purchases",
          label: "Mis compras",
          icon: ShoppingBag,
          iconColor: "text-purple-700"
        },
        {
          id: "sales",
          label: "Mis ventas",
          icon: TrendingUp,
          iconColor: "text-purple-700"
        },
        {
          id: "perfil",
          label: "Mi perfil",
          icon: UserCheck,
          iconColor: "text-purple-700"
        },
        {
          id: "vender",
          label: "Publicar producto",
          icon: PlusCircle,
          isExternalLink: true,
          href: "/products/new",
          iconColor: "text-purple-700"
        }
      ]
    }
  ];

  // Tarjetas para Mi Espacio
  const clientCards: { titulo: string; items: CardItem[] }[] = [
    {
      titulo: "Mi Espacio",
      items: [
        {
          id: "billetera",
          label: "Mi billetera",
          icon: DollarSign,
          iconColor: "text-purple-700"
        },
        {
          id: "publications",
          label: "Mis publicaciones",
          icon: Package,
          iconColor: "text-purple-700"
        },
        {
          id: "purchases",
          label: "Mis compras",
          icon: ShoppingBag,
          iconColor: "text-purple-700"
        },
        {
          id: "sales",
          label: "Mis ventas",
          icon: TrendingUp,
          iconColor: "text-purple-700"
        },
        {
          id: "perfil",
          label: "Mi perfil",
          icon: UserCheck,
          iconColor: "text-purple-700"
        },
        {
          id: "vender",
          label: "Publicar producto",
          icon: PlusCircle,
          isExternalLink: true,
          href: "/products/new",
          iconColor: "text-purple-700"
        }
      ]
    }
  ];

  const itemPermitido = (id: string) => {
    if (esRoot || tienePermiso('full_access')) return true;
    if (id === 'billetera') return tienePermiso('billetera');
    if (id === 'publications') return tienePermiso('publications');
    if (id === 'purchases') return tienePermiso('purchases');
    if (id === 'sales') return tienePermiso('sales');
    if (id === 'vender') return tienePermiso('publications') || tienePermiso('sales');
    if (id === 'perfil') return tienePermiso('perfil') || true;
    return tienePermiso(id);
  };

  const gruposRaw = clientCards;
  const grupos = gruposRaw.map(g => ({
    ...g,
    items: g.items.filter(item => itemPermitido(item.id))
  })).filter(g => g.items.length > 0);

  const handleClick = (item: CardItem) => {
    if (item.isExternalLink && item.href) {
      router.push(item.href);
      return;
    }
    setTabActual(item.id);
    if (onSelectCard) {
      onSelectCard(item.id);
    }
    router.push(`/mi-espacio?tab=${item.id}`);
  };

  return (
    <div className="w-full space-y-5 sm:space-y-7 py-2">
      {grupos.map((grupo) => (
        <div key={grupo.titulo} className="w-full space-y-2.5 sm:space-y-3.5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
            {grupo.titulo}
          </h3>
          
          {/* Grilla responsiva compacta con tarjetas más chicas */}
          <div className="grid grid-cols-3 min-[480px]:grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2.5 sm:gap-3.5">
            {grupo.items.map((item) => {
              const Icono = item.icon;
              const esActivo = tabActual === item.id && !item.isExternalLink;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleClick(item)}
                  className={`group relative flex flex-col items-center justify-center p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white transition-all duration-200 cursor-pointer select-none aspect-square border border-gray-100/90 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 active:scale-[0.96] ${
                    esActivo ? 'ring-2 ring-purple-600/30 border-purple-200' : ''
                  }`}
                >
                  {/* Ícono súper ampliado xl */}
                  <div className={`flex items-center justify-center mb-0.5 sm:mb-1 transition-transform duration-200 group-hover:scale-110 ${item.iconColor || 'text-purple-700'}`}>
                    <Icono className="w-9.5 h-9.5 sm:w-11 sm:h-11 stroke-[1.4]" />
                  </div>

                  {/* Texto ampliado y destacado */}
                  <span className="text-[11.5px] sm:text-sm font-bold text-center leading-tight tracking-tight text-gray-800 group-hover:text-purple-700 line-clamp-2">
                    {item.label}
                  </span>

                  {/* Punto discreto si está activo */}
                  {esActivo && (
                    <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-1.5 w-1.5 rounded-full bg-purple-600 shadow-sm animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
