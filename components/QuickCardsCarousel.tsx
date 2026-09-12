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

// 1. Ingresá a tu cuenta: Avatar de usuario de autor con llave de acceso flotante
function LoginIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" overflow="visible" className="w-20 h-20 sm:w-22 sm:h-22 md:w-[88px] md:h-[88px]" fill="none">
      {/* Círculo de cabeza / perfil */}
      <circle cx="44" cy="36" r="12" stroke="#2C2723" strokeWidth="1.8" />
      {/* Hombros en arco suave */}
      <path d="M22 74 C22 58 32 52 44 52 C56 52 66 58 66 74" stroke="#2C2723" strokeWidth="1.8" strokeLinecap="round" />
      {/* Llave de acceso minimalista flotante */}
      <g transform="translate(18, 2) rotate(-15 62 48)">
        <circle cx="62" cy="40" r="7.5" stroke="#2C2723" strokeWidth="1.8" />
        <circle cx="62" cy="40" r="3" stroke="#2C2723" strokeWidth="1.3" />
        <line x1="62" y1="47.5" x2="62" y2="72" stroke="#2C2723" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="62" y1="63" x2="68" y2="63" stroke="#2C2723" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="62" y1="69" x2="67" y2="69" stroke="#2C2723" strokeWidth="1.8" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// 2. Más vendidos: Copa estilizada de trazo arquitectónico con estrella outline (Opción 3B)
function BestsellersIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" overflow="visible" className="w-20 h-20 sm:w-22 sm:h-22 md:w-[88px] md:h-[88px]" fill="none">
      {/* Copa estilizada de trazo fino arquitectónico */}
      <path d="M33 26 C35 50, 45 58, 48 66 L42 78 H58 L52 66 C55 58, 65 50, 67 26 Z" stroke="#2C2723" strokeWidth="1.8" strokeLinejoin="round" />
      {/* Asas geométricas flotantes en arco puro */}
      <path d="M28 32 A 11 11 0 0 0 28 48" stroke="#2C2723" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M72 32 A 11 11 0 0 1 72 48" stroke="#2C2723" strokeWidth="1.8" strokeLinecap="round" />
      {/* Boca superior */}
      <line x1="33" y1="26" x2="67" y2="26" stroke="#2C2723" strokeWidth="1.8" strokeLinecap="round" />
      {/* Estrella 100% contorno lineal sin relleno */}
      <path d="M50 35 L51.8 40.5 L57.5 40.5 L53 44 L54.8 49.5 L50 46 L45.2 49.5 L47 44 L42.5 40.5 L48.2 40.5 Z" stroke="#2C2723" strokeWidth="1.6" strokeLinejoin="round" />
      {/* Base minimalista */}
      <line x1="36" y1="84" x2="64" y2="84" stroke="#2C2723" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// 3. Menos de $30.000: Billetera de autor con billete y símbolo de ahorro
function Under30kIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" overflow="visible" className="w-20 h-20 sm:w-22 sm:h-22 md:w-[88px] md:h-[88px]" fill="none">
      {/* Billete emergiendo con símbolo de pesos */}
      <rect x="33" y="22" width="34" height="24" rx="3" stroke="#2C2723" strokeWidth="1.6" />
      <circle cx="50" cy="34" r="5.5" stroke="#2C2723" strokeWidth="1.4" />
      <path d="M50 30.5 V37.5 M48 32 C48 31 52 31 52 33 C52 35 48 35 48 37 C48 39 52 39 52 38" stroke="#2C2723" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Billetera / Tarjetero de autor */}
      <rect x="22" y="38" width="56" height="42" rx="6" stroke="#2C2723" strokeWidth="1.8" />
      <path d="M22 52 H78" stroke="#2C2723" strokeWidth="1.5" />
      {/* Solapa con remache */}
      <path d="M64 52 V66 C64 68 66 70 68 70 H78 V52 H64 Z" stroke="#2C2723" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="71" cy="61" r="2" stroke="#2C2723" strokeWidth="1.4" />
    </svg>
  );
}

// 4. Medios de pago: Dos tarjetas en abanico con chip EMV y ondas contactless
function PaymentsIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" overflow="visible" className="w-20 h-20 sm:w-22 sm:h-22 md:w-[88px] md:h-[88px]" fill="none">
      {/* Tarjeta posterior en ángulo */}
      <rect x="35" y="24" width="48" height="32" rx="4.5" transform="rotate(12 59 40)" stroke="#2C2723" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
      {/* Tarjeta frontal principal */}
      <g transform="rotate(-6 48 54)">
        <rect x="22" y="38" width="54" height="34" rx="4.5" stroke="#2C2723" strokeWidth="1.8" />
        {/* Chip EMV */}
        <rect x="29" y="46" width="9" height="7" rx="1.5" stroke="#2C2723" strokeWidth="1.4" />
        <line x1="33.5" y1="46" x2="33.5" y2="53" stroke="#2C2723" strokeWidth="1.2" />
        {/* Línea de relieve */}
        <line x1="29" y1="62" x2="54" y2="62" stroke="#2C2723" strokeWidth="1.5" strokeLinecap="round" />
        {/* Ondas contactless */}
        <path d="M64 45 C66 47 66 50 64 52" stroke="#2C2723" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M67 43 C70.5 46 70.5 51 67 54" stroke="#2C2723" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// 5. Compra protegida: Escudo heráldico de seguridad con pespunte punteado y checkmark
function SecureShoppingIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" overflow="visible" className="w-20 h-20 sm:w-22 sm:h-22 md:w-[88px] md:h-[88px]" fill="none">
      {/* Escudo heráldico */}
      <path d="M50 20 L72 28 V50 C72 64 61 74 50 80 C39 74 28 64 28 50 V28 Z" stroke="#2C2723" strokeWidth="1.8" strokeLinejoin="round" />
      {/* Pespunte interior */}
      <path d="M50 26 L66 32 V48 C66 59 57 67 50 72 C43 67 34 59 34 48 V32 Z" stroke="#2C2723" strokeWidth="1.2" strokeLinejoin="round" strokeDasharray="2.5 2.5" opacity="0.6" />
      {/* Checkmark */}
      <path d="M42 49 L47.5 54.5 L58 43" stroke="#2C2723" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 6. En oferta: Bolsa tote de boutique de compras con sello de % y chispa de autor
function OffersIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" overflow="visible" className="w-20 h-20 sm:w-22 sm:h-22 md:w-[88px] md:h-[88px]" fill="none">
      {/* Asas */}
      <path d="M41 34 C41 22 59 22 59 34" stroke="#2C2723" strokeWidth="1.8" strokeLinecap="round" />
      {/* Cuerpo de la bolsa */}
      <path d="M28 34 L33 80 H67 L72 34 Z" stroke="#2C2723" strokeWidth="1.8" strokeLinejoin="round" />
      {/* Pliegues laterales */}
      <line x1="36" y1="34" x2="39" y2="80" stroke="#2C2723" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <line x1="64" y1="34" x2="61" y2="80" stroke="#2C2723" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      {/* Sello % */}
      <circle cx="50" cy="57" r="11" stroke="#2C2723" strokeWidth="1.5" />
      <circle cx="46.5" cy="53.5" r="1.6" stroke="#2C2723" strokeWidth="1.3" />
      <line x1="53.5" y1="51" x2="46.5" y2="63" stroke="#2C2723" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="53.5" cy="60.5" r="1.6" stroke="#2C2723" strokeWidth="1.3" />
      {/* Chispa de diseño */}
      <path d="M75 28 L76 31 L79 32 L76 33 L75 36 L74 33 L71 32 L74 31 Z" stroke="#2C2723" strokeWidth="1" strokeLinejoin="round" />
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
