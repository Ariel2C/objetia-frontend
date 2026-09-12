"use client";
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from './AuthContext';
import type { QuickAccessCard } from '../lib/types';

// ==============================================================================
// ILUSTRACIONES VECTORIALES EXCLUSIVAS DE OBJETIA (SIN FONDO CIRCULAR, GRAN ESCALA)
// ==============================================================================

// 1. Ingresá a tu cuenta: Dispositivo móvil con tarjeta de perfil (sin color, sin llave)
function LoginIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" overflow="visible" className="w-22 h-22 sm:w-24 sm:h-24 md:w-[96px] md:h-[96px]" fill="none">
      {/* Smartphone / Dispositivo móvil de acceso */}
      <rect x="27" y="15" width="46" height="70" rx="8" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.1" />
      
      {/* Altavoz / notch superior */}
      <rect x="44" y="20" width="12" height="2.5" rx="1.25" fill="#362C24" />

      {/* Pantalla interior con tarjeta de perfil */}
      <rect x="32" y="26" width="36" height="52" rx="5" fill="#FFFFFF" stroke="#362C24" strokeWidth="1.2" />

      {/* Círculo de avatar */}
      <circle cx="50" cy="43" r="12" fill="#FFFFFF" stroke="#362C24" strokeWidth="2" />
      
      {/* Silueta de usuario dentro del avatar */}
      <circle cx="50" cy="40" r="4.2" fill="#362C24" />
      <path d="M42.5 51 C43.5 46.5 46 45.5 50 45.5 C54 45.5 56.5 46.5 57.5 51" fill="#FFFFFF" stroke="#362C24" strokeWidth="1.5" />

      {/* Líneas de autenticación / bienvenida */}
      <rect x="39" y="60" width="22" height="3" rx="1.5" fill="#362C24" />
      <rect x="43" y="66" width="14" height="2.5" rx="1.25" fill="#362C24" />
    </svg>
  );
}

// 2. Más vendidos: Trofeo de victoria con estrella central, base pedestal y cintas (sin color)
function BestsellersIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="5 5 95 95" overflow="visible" className="w-22 h-22 sm:w-24 sm:h-24 md:w-[96px] md:h-[96px]" fill="none">
      {/* Cintas decorativas de premiación detrás del trofeo */}
      <path d="M37 66 L25 82 L35 79 L42 84 L39 68" fill="#FFFFFF" stroke="#362C24" strokeWidth="2" strokeLinejoin="round" />
      <path d="M68 66 L80 82 L70 79 L63 84 L66 68" fill="#FFFFFF" stroke="#362C24" strokeWidth="2" strokeLinejoin="round" />

      {/* Asas laterales del trofeo */}
      <path d="M34 32 C21 32 20 48 33 52" fill="none" stroke="#362C24" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M71 32 C84 32 85 48 72 52" fill="none" stroke="#362C24" strokeWidth="2.5" strokeLinecap="round" />

      {/* Base pedestal del trofeo */}
      <path d="M47 62 L45 74 H60 L58 62" fill="#FFFFFF" stroke="#362C24" strokeWidth="2" strokeLinejoin="round" />
      <rect x="37" y="74" width="31" height="11" rx="3" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.1" />
      <line x1="43" y1="79.5" x2="62" y2="79.5" stroke="#362C24" strokeWidth="1.8" strokeLinecap="round" />

      {/* Copa principal del trofeo */}
      <path d="M32 23 H73 V38 C73 53 62 62 52.5 62 C43 62 32 53 32 38 Z" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.1" strokeLinejoin="round" />

      {/* Estrella de 5 puntas prominente en el centro */}
      <path d="M52.5 34 L54.8 40.5 L61.5 40.7 L56.2 44.7 L58.2 51.2 L52.5 47.3 L46.8 51.2 L48.8 44.7 L43.5 40.7 L50.2 40.5 Z" fill="#FFFFFF" stroke="#362C24" strokeWidth="1.8" strokeLinejoin="round" />

      {/* Borde superior de la copa */}
      <rect x="30" y="21" width="45" height="5" rx="2.5" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.1" />
    </svg>
  );
}

// 3. Menos de $30.000: Alcancía / Cerdito de ahorro con moneda $ (sin color)
function Under30kIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="5 5 95 95" overflow="visible" className="w-22 h-22 sm:w-24 sm:h-24 md:w-[96px] md:h-[96px]" fill="none">
      {/* Patitas */}
      <rect x="31" y="70" width="8" height="12" rx="3" fill="#FFFFFF" stroke="#362C24" strokeWidth="2" />
      <rect x="58" y="70" width="8" height="12" rx="3" fill="#FFFFFF" stroke="#362C24" strokeWidth="2" />

      {/* Cola en rulito */}
      <path d="M22 51 C17 50 16 43 20 41 C22 40 25 43 23 46" fill="none" stroke="#362C24" strokeWidth="2" strokeLinecap="round" />

      {/* Oreja */}
      <path d="M60 33 C61 24 70 26 69 35 Z" fill="#FFFFFF" stroke="#362C24" strokeWidth="2" strokeLinejoin="round" />

      {/* Cuerpo redondeado del cerdito */}
      <ellipse cx="48" cy="54" rx="27" ry="21" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.1" />

      {/* Ojo sonriente */}
      <path d="M64 47 C65.5 45.5 67.5 45.5 69 47" fill="none" stroke="#362C24" strokeWidth="2.1" strokeLinecap="round" />

      {/* Hocico */}
      <rect x="70" y="47" width="9" height="15" rx="4.5" fill="#FFFFFF" stroke="#362C24" strokeWidth="2" />
      <circle cx="73.5" cy="52.5" r="1.2" fill="#362C24" />
      <circle cx="73.5" cy="56.5" r="1.2" fill="#362C24" />

      {/* Ranura para la moneda en la espalda */}
      <rect x="42" y="32.5" width="13" height="3" rx="1.5" fill="#362C24" />

      {/* Gran moneda $ cayendo en la ranura */}
      <g transform="translate(0, -2)">
        <circle cx="48.5" cy="23" r="13.5" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.1" />
        <circle cx="48.5" cy="23" r="10.5" fill="#FFFFFF" stroke="#362C24" strokeWidth="1.2" />
        <path d="M48.5 16 V30 M45 19.5 C45 17.5 51.5 17.5 51.5 21 C51.5 25.5 45.5 24 45.5 27 C45.5 30 52 30 52 27" fill="none" stroke="#362C24" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

// 4. Medios de pago: Tarjeta contactless con terminal POS (sin color)
function PaymentsIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="5 5 95 95" overflow="visible" className="w-22 h-22 sm:w-24 sm:h-24 md:w-[96px] md:h-[96px]" fill="none">
      {/* Terminal de cobro / POS en la base */}
      <rect x="32" y="44" width="45" height="42" rx="6" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.1" />
      
      {/* Ranura y pantalla de la terminal */}
      <rect x="39" y="51" width="31" height="15" rx="3" fill="#FFFFFF" stroke="#362C24" strokeWidth="1.5" />
      <rect x="43" y="55" width="14" height="2" rx="1" fill="#362C24" />
      <rect x="43" y="60" width="23" height="2" rx="1" fill="#362C24" />
      
      {/* Teclado numérico de la terminal */}
      <circle cx="43" cy="73" r="1.8" fill="#362C24" />
      <circle cx="50" cy="73" r="1.8" fill="#362C24" />
      <circle cx="57" cy="73" r="1.8" fill="#362C24" />
      <circle cx="64" cy="73" r="1.8" fill="#362C24" />
      <circle cx="43" cy="79" r="1.8" fill="#362C24" />
      <circle cx="50" cy="79" r="1.8" fill="#362C24" />
      <circle cx="57" cy="79" r="1.8" fill="#362C24" />
      <circle cx="64" cy="79" r="1.8" fill="#362C24" />

      {/* Tarjeta de crédito sobrevolando */}
      <g transform="rotate(-18 48 30)">
        <rect x="22" y="16" width="52" height="32" rx="4.5" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.1" />
        <rect x="29" y="22" width="9" height="7" rx="1.5" fill="#FFFFFF" stroke="#362C24" strokeWidth="1.2" />
        <path d="M60 21 C62 23 62 26 60 28" fill="none" stroke="#362C24" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M63.5 19 C66.5 22.5 66.5 27 63.5 30.5" fill="none" stroke="#362C24" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// 5. Compra protegida: Paquete de entrega sellado con escudo y checkmark (sin color)
function SecureShoppingIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="5 5 95 95" overflow="visible" className="w-22 h-22 sm:w-24 sm:h-24 md:w-[96px] md:h-[96px]" fill="none">
      {/* Paquete de entrega / Caja de envío */}
      <rect x="22" y="38" width="46" height="42" rx="4" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.1" />
      <path d="M22 48 H68" stroke="#362C24" strokeWidth="1.5" />
      <rect x="41" y="38" width="8" height="42" fill="#FFFFFF" stroke="#362C24" strokeWidth="1.5" />

      {/* Etiqueta de envío con código de barras */}
      <rect x="27" y="55" width="11" height="15" rx="1.5" fill="#FFFFFF" stroke="#362C24" strokeWidth="1" />
      <path d="M29 59 H36 M29 63 H34 M29 67 H36" stroke="#362C24" strokeWidth="1" strokeLinecap="round" />

      {/* Escudo de seguridad en primer plano a la derecha */}
      <g transform="translate(42, 34)">
        <path d="M22 6 L38 12 V28 C38 38 29 45 22 49 C15 45 6 38 6 28 V12 Z" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.3" strokeLinejoin="round" />
        <path d="M16 26 L20.5 30.5 L28.5 20" fill="none" stroke="#362C24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Ramita botánica */}
      <g transform="translate(12, 20)">
        <path d="M14 36 C14 26 21 18 29 14" fill="none" stroke="#362C24" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M19 25 C15 22 17 18 21 21 C22 23 21 26 19 25 Z" fill="#FFFFFF" stroke="#362C24" strokeWidth="1" />
        <path d="M25 18 C23 13 28 12 29 16 C29 18 27 19 25 18 Z" fill="#FFFFFF" stroke="#362C24" strokeWidth="1" />
      </g>
    </svg>
  );
}

// 6. En oferta: Bolsa de compras con sello de % de descuento y etiqueta (sin color)
function OffersIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="5 5 95 95" overflow="visible" className="w-22 h-22 sm:w-24 sm:h-24 md:w-[96px] md:h-[96px]" fill="none">
      {/* Manijas de la bolsa */}
      <path d="M37 32 C37 20 49 20 49 32" fill="none" stroke="#362C24" strokeWidth="2.2" strokeLinecap="round" />

      {/* Cuerpo de la bolsa */}
      <path d="M26 32 L31 78 H65 L70 32 Z" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.1" strokeLinejoin="round" />

      {/* Sello circular con % prominente en la bolsa */}
      <circle cx="44.5" cy="53" r="10" fill="#FFFFFF" stroke="#362C24" strokeWidth="1.8" />
      <circle cx="41.5" cy="49" r="1.8" fill="#362C24" />
      <path d="M47 47 L42 59" stroke="#362C24" strokeWidth="2" strokeLinecap="round" />
      <circle cx="47.5" cy="57" r="1.8" fill="#362C24" />

      {/* Gran etiqueta de descuento colgante en ángulo a la derecha */}
      <g transform="rotate(22 68 52)">
        <path d="M54 26 C57 21 62 18 67 22" fill="none" stroke="#362C24" strokeWidth="1.5" strokeDasharray="2.5 2.5" />
        <path d="M56 26 H78 L90 38 L68 60 L56 48 Z" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.1" strokeLinejoin="round" />
        <circle cx="63" cy="33" r="2.8" fill="#FFFFFF" stroke="#362C24" strokeWidth="1.5" />
        <path d="M72 34 L66 43 H72 L68 52 L78 41 H72 Z" fill="#FFFFFF" stroke="#362C24" strokeWidth="1.3" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

// Mapa de ilustraciones por tipo
function CardIllustration({ iconType, imageUrl, title }: { iconType?: string | null; imageUrl?: string | null; title: string }) {
  if (imageUrl && imageUrl.trim() !== "" && imageUrl !== "null") {
    return (
      <div className="h-22 w-22 sm:h-24 sm:w-24 md:h-[96px] md:w-[96px] flex items-center justify-center overflow-hidden rounded-xl">
        <img src={imageUrl} alt={title} className="max-h-full max-w-full object-contain" />
      </div>
    );
  }

  switch (iconType) {
    case 'login':
      return <LoginIllustration />;
    case 'bestsellers':
      return <BestsellersIllustration />;
    case 'under_30k':
      return <Under30kIllustration />;
    case 'payments':
      return <PaymentsIllustration />;
    case 'secure_shopping':
      return <SecureShoppingIllustration />;
    case 'offers':
      return <OffersIllustration />;
    default:
      return <LoginIllustration />;
  }
}

// ==============================================================================
// COMPONENTE PRINCIPAL: CARRUSEL DE TARJETAS DE ACCESO RÁPIDO
// ==============================================================================
interface QuickCardsCarouselProps {
  cards?: QuickAccessCard[];
}

export default function QuickCardsCarousel({ cards }: QuickCardsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { usuario } = useAuth();
  const router = useRouter();

  // Tarjetas por defecto si no vienen cargadas desde la BD
  const defaultCards: QuickAccessCard[] = [
    {
      id: 1,
      title: "Ingresá a mi objetia",
      subtitle: "Gestioná tus compras, ventas y mensajes.",
      icon_type: "login",
      button_text: "Ingresá a mi objetia",
      link_url: "/mi-objetia",
      orden: 0,
      is_active: true
    },
    {
      id: 2,
      title: "Más vendidos",
      subtitle: "Explorá las piezas más elegidas y en tendencia.",
      icon_type: "bestsellers",
      button_text: "Ver más",
      link_url: "/catalog?sort=popular",
      orden: 1,
      is_active: true
    },
    {
      id: 3,
      title: "Menos de $30.000",
      subtitle: "Descubrí objetos de diseño a precios accesibles.",
      icon_type: "under_30k",
      button_text: "Ver productos",
      link_url: "/catalog?max_price=30000",
      orden: 2,
      is_active: true
    },
    {
      id: 4,
      title: "Medios de pago",
      subtitle: "Pagá tus compras de forma rápida y segura.",
      icon_type: "payments",
      button_text: "Ver medios",
      link_url: "#medios-de-pago",
      orden: 3,
      is_active: true
    },
    {
      id: 5,
      title: "Compra protegida",
      subtitle: "Tu compra y envíos están 100% protegidos.",
      icon_type: "secure_shopping",
      button_text: "Cómo funciona",
      link_url: "#compra-protegida",
      orden: 4,
      is_active: true
    },
    {
      id: 6,
      title: "En oferta",
      subtitle: "Oportunidades únicas con descuentos especiales.",
      icon_type: "offers",
      button_text: "Ver ofertas",
      link_url: "/catalog?on_sale=true",
      orden: 5,
      is_active: true
    }
  ];

  const displayCards = cards && cards.length > 0 ? cards : defaultCards;

  const getCardLink = (card: QuickAccessCard) => {
    if (card.icon_type === 'login' || card.id === 1 || card.link_url === '/mi-objetia' || card.link_url.startsWith('/auth')) {
      return usuario ? '/mi-objetia' : '/auth?mode=login&redirect=/mi-objetia';
    }
    return card.link_url;
  };

  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [displayCards]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = 300;
    const target = direction === 'left' ? container.scrollLeft - scrollAmount : container.scrollLeft + scrollAmount;
    container.scrollTo({ left: target, behavior: 'smooth' });
  };

  const handleCardClick = (e: React.MouseEvent, card: QuickAccessCard) => {
    if (card.icon_type === 'login' || card.id === 1 || card.link_url === '/mi-objetia' || card.link_url.startsWith('/auth')) {
      e.preventDefault();
      if (usuario) {
        router.push('/mi-objetia');
      } else {
        router.push('/auth?mode=login&redirect=/mi-objetia');
      }
    } else if (card.link_url === '#compra-protegida') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('abrir-modal-footer', { detail: 'compra_protegida' }));
    } else if (card.link_url === '#medios-de-pago') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('abrir-modal-footer', { detail: 'preguntas' }));
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-20 -mt-16 sm:-mt-20 md:-mt-28 lg:-mt-32 mb-8 animate-slide-up group/quickcards">
      {/* Botón Flecha Izquierda */}
      {canScrollLeft && (
        <button 
          type="button"
          onClick={() => handleScroll('left')}
          aria-label="Ver tarjetas anteriores"
          className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 sm:-ml-5 z-30 p-2.5 rounded-full bg-[#FAF8F5] shadow-md border border-[#EAE5DC] text-[#5C4A3A] hover:bg-white active:scale-95 transition opacity-0 group-hover/quickcards:opacity-100 cursor-pointer hidden md:flex items-center justify-center"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Contenedor Deslizable de Tarjetas */}
      <div
        ref={scrollContainerRef}
        onScroll={updateScrollButtons}
        className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto no-scrollbar scrollbar-none py-3 px-1 scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {displayCards.map((card) => (
          <Link
            key={card.id}
            href={getCardLink(card)}
            onClick={(e) => handleCardClick(e, card)}
            className="w-[148px] sm:w-[164px] md:w-[180px] flex-shrink-0 snap-start bg-[#FAF8F5] border border-[#EAE5DC] hover:border-[#B88D65]/50 rounded-[22px] p-4 sm:p-5 shadow-[0_4px_16px_rgba(78,66,52,0.06)] hover:shadow-[0_8px_24px_rgba(78,66,52,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center group/card cursor-pointer select-none"
          >
            {/* 1. Dibujo / Ilustración Exclusiva Objetia (Sin fondo circular y ampliada) */}
            <div className="h-[96px] sm:h-[104px] w-full flex items-center justify-center transition-transform duration-300 group-hover/card:scale-105 mb-2">
              <CardIllustration 
                iconType={card.icon_type} 
                imageUrl={card.image_url} 
                title={card.title} 
              />
            </div>

            {/* 2. Título y Descripción de la Tarjeta */}
            <div className="flex flex-col items-center justify-center w-full px-1">
              <h3 className="text-xs sm:text-[13px] font-semibold text-[#2C2723] group-hover/card:text-[#A97950] transition-colors leading-snug tracking-tight text-center line-clamp-1">
                {card.title}
              </h3>
              {card.subtitle && (
                <p className="text-[10.5px] sm:text-[11px] text-[#73675C] leading-snug text-center line-clamp-2 mt-1 min-h-[26px]">
                  {card.subtitle}
                </p>
              )}
            </div>

            </Link>
        ))}
      </div>

      {/* Botón Flecha Derecha */}
      {canScrollRight && (
        <button 
          type="button"
          onClick={() => handleScroll('right')}
          aria-label="Ver más tarjetas"
          className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 sm:-mr-5 z-30 p-2.5 rounded-full bg-[#FAF8F5] shadow-md border border-[#EAE5DC] text-[#5C4A3A] hover:bg-white active:scale-95 transition opacity-0 group-hover/quickcards:opacity-100 cursor-pointer hidden md:flex items-center justify-center"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
