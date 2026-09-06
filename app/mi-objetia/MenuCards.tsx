"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, 
  UserCheck, 
  ShoppingBag, 
  TrendingUp, 
  Package,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../components/AuthContext';

interface CardItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  isExternalLink?: boolean;
  href?: string;
  iconBg: string;
  iconColor: string;
  badge?: string;
}

interface MenuCardsProps {
  tabActual: string;
  setTabActual: (tab: string) => void;
  esAdmin: boolean;
  esRoot?: boolean;
  onSelectCard?: (tabId: string) => void;
  logout?: () => void;
}

export default function MenuCards({ tabActual, setTabActual, esAdmin, esRoot, onSelectCard }: MenuCardsProps) {
  const router = useRouter();
  const { tienePermiso } = useAuth();

  const clientCards: { titulo: string; items: CardItem[] }[] = [
    {
      titulo: "Servicios y Finanzas",
      items: [
        {
          id: "billetera",
          label: "Mi Billetera",
          description: "Consulta tu saldo disponible, retira fondos y revisa tu historial.",
          icon: DollarSign,
          iconBg: "bg-[#e8f0fe]",
          iconColor: "text-[#1a73e8]",
        },
        {
          id: "purchases",
          label: "Mis Compras",
          description: "Seguimiento de envíos, comprobantes y estado de pedidos.",
          icon: ShoppingBag,
          iconBg: "bg-[#fef7e0]",
          iconColor: "text-[#b06000]",
        },
        {
          id: "sales",
          label: "Mis Ventas",
          description: "Gestiona ventas realizadas, envíos de Correo y tus cobros.",
          icon: TrendingUp,
          iconBg: "bg-[#e6f4ea]",
          iconColor: "text-[#137333]",
        }
      ]
    },
    {
      titulo: "Catálogo y Publicaciones",
      items: [
        {
          id: "publications",
          label: "Mis Publicaciones",
          description: "Edita el inventario, actualiza precios o pausa tus productos.",
          icon: Package,
          iconBg: "bg-[#f3e8fd]",
          iconColor: "text-[#9333ea]",
        },
        {
          id: "vender",
          label: "Publicar Producto",
          description: "Crea una nueva publicación con fotos, variantes y envíos.",
          icon: PlusCircle,
          isExternalLink: true,
          href: "/products/new",
          iconBg: "bg-[#e8f0fe]",
          iconColor: "text-[#1a73e8]",
          badge: "Nuevo"
        }
      ]
    },
    {
      titulo: "Cuenta y Seguridad",
      items: [
        {
          id: "perfil",
          label: "Mi Perfil",
          description: "Edita tus datos personales, dirección de entrega y seguridad.",
          icon: UserCheck,
          iconBg: "bg-[#f1f3f4]",
          iconColor: "text-[#3c4043]",
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

  const grupos = clientCards.map(g => ({
    ...g,
    items: g.items.filter(item => itemPermitido(item.id))
  })).filter(g => g.items.length > 0);

  const handleClick = (item: CardItem) => {
    if (item.id === 'vender') {
      window.dispatchEvent(new CustomEvent('vamaar:open-vender-modal'));
      return;
    }
    if (item.isExternalLink && item.href) {
      router.push(item.href);
      return;
    }
    setTabActual(item.id);
    if (onSelectCard) {
      onSelectCard(item.id);
    }
    router.push(`/mi-objetia?tab=${item.id}`);
  };

  return (
    <div className="w-full space-y-8 select-none">
      {grupos.map((grupo) => (
        <div key={grupo.titulo} className="w-full space-y-3">
          <div className="flex items-center gap-2 px-1">
            <h3 className="text-xs font-bold text-[#5f6368] uppercase tracking-wider">
              {grupo.titulo}
            </h3>
            <div className="h-px flex-1 bg-[#dadce0]/60" />
          </div>
          
          {/* Grilla Google AI Studio Light Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {grupo.items.map((item) => {
              const Icono = item.icon;
              const esActivo = tabActual === item.id && !item.isExternalLink;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleClick(item)}
                  className={`group relative flex flex-col justify-between p-5 rounded-2xl bg-white border transition-all duration-200 cursor-pointer text-left ${
                    esActivo 
                      ? 'border-[#1a73e8] ring-2 ring-[#1a73e8]/20 shadow-sm' 
                      : 'border-[#dadce0] hover:border-[#bdc1c6] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${item.iconBg} ${item.iconColor}`}>
                        <Icono className="w-5 h-5 stroke-[1.8]" />
                      </div>

                      {item.badge ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]">
                          {item.badge}
                        </span>
                      ) : (
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9aa0a6] group-hover:text-[#1a73e8] group-hover:bg-[#e8f0fe] transition-colors">
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      )}
                    </div>

                    <h4 className="text-base font-semibold text-[#202124] group-hover:text-[#1a73e8] transition-colors">
                      {item.label}
                    </h4>

                    <p className="text-xs text-[#5f6368] mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#f1f3f4] flex items-center justify-between text-[11.5px] font-medium text-[#1a73e8] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Acceder</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
