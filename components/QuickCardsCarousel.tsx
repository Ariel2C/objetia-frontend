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

// 1. Ingresá a tu cuenta: Avatar de usuario y llave de acceso
function LoginIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" overflow="visible" className="w-20 h-20 sm:w-22 sm:h-22 md:w-[88px] md:h-[88px]" fill="none">
      <circle cx="44" cy="33" r="14" stroke="#2C2723" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 78 C19 59 31 53 44 53 C57 53 69 59 69 78" stroke="#2C2723" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <g transform="translate(13, 1) rotate(-18 63 48)">
        <circle cx="63" cy="38" r="8" stroke="#2C2723" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="63" y1="46" x2="63" y2="76" stroke="#2C2723" strokeWidth="4.2" strokeLinecap="round" />
        <line x1="63" y1="64" x2="71" y2="64" stroke="#2C2723" strokeWidth="4" strokeLinecap="round" />
        <line x1="63" y1="72" x2="69" y2="72" stroke="#2C2723" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// 2. Más vendidos: Bolsa de compras con estrella central limpia
function BestsellersIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" overflow="visible" className="w-20 h-20 sm:w-22 sm:h-22 md:w-[88px] md:h-[88px]" fill="none">
      <path d="M41 38 V28 C41 21.5 45 17 50 17 C55 17 59 21.5 59 28 V38" stroke="#2C2723" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M33 38 H67 C68.8 38 70.3 39.3 70.6 41.1 L75.8 79.1 C76.2 81.3 74.5 83 72.3 83 H27.7 C25.5 83 23.8 81.3 24.2 79.1 L29.4 41.1 C29.7 39.3 31.2 38 33 38 Z" stroke="#2C2723" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M50 49 L52.8 55.4 L59.7 55.9 L54.5 60.4 L56.1 67.2 L50 63.5 L43.9 67.2 L45.5 60.4 L40.3 55.9 L47.2 55.4 Z" stroke="#2C2723" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 3. Menos de $30.000: Etiqueta en diagonal con círculo '-' y signo '$'
function Under30kIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" overflow="visible" className="w-20 h-20 sm:w-22 sm:h-22 md:w-[88px] md:h-[88px]" fill="none">
      <path d="M44 28 H32 C27.5 28 24 31.5 24 36 V58 C24 61 25.5 63.5 27.5 65.5 L46.5 84.5 C49.5 87.5 54.5 87.5 57.5 84.5 L78.5 63.5 C81.5 60.5 81.5 55.5 78.5 52.5 L60 34" stroke="#2C2723" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="34" cy="38" r="4.5" stroke="#2C2723" strokeWidth="3.8" strokeLinecap="round" />
      <line x1="34" y1="24" x2="34" y2="31" stroke="#2C2723" strokeWidth="4.2" strokeLinecap="round" />
      <circle cx="68" cy="35" r="14" stroke="#2C2723" strokeWidth="4.2" fill="#FAF8F5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="61" y1="35" x2="75" y2="35" stroke="#2C2723" strokeWidth="4.2" strokeLinecap="round" />
      <path d="M48 44 V72 M41 50 C41 45 55 45 55 52 C55 60 41 59 41 66 C41 73 55 73 55 68" stroke="#2C2723" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 4. Medios de pago: Tarjeta con banda y escudo de seguridad con checkmark
function PaymentsIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" overflow="visible" className="w-20 h-20 sm:w-22 sm:h-22 md:w-[88px] md:h-[88px]" fill="none">
      <path d="M42 32 H22 C18.7 32 16 34.7 16 38 V72 C16 75.3 18.7 78 22 78 H74 C77.3 78 80 75.3 80 72 V58" stroke="#2C2723" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="44" x2="42" y2="44" stroke="#2C2723" strokeWidth="4.2" strokeLinecap="round" />
      <rect x="23" y="58" width="12" height="5" rx="2.5" fill="#2C2723" />
      <path d="M62 20 L81 26 V44 C81 55 72 64 62 68 C52 64 43 55 43 44 V26 Z" stroke="#2C2723" strokeWidth="4.2" fill="#FAF8F5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M53 43 L60 50 L72 37" stroke="#2C2723" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 5. Compra protegida: Escudo heráldico con gran checkmark
function SecureShoppingIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" overflow="visible" className="w-20 h-20 sm:w-22 sm:h-22 md:w-[88px] md:h-[88px]" fill="none">
      <path d="M50 18 L77 26 V50 C77 66 64 77 50 83 C36 77 23 66 23 50 V26 Z" stroke="#2C2723" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M38 51 L46 59 L63 41" stroke="#2C2723" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 6. En oferta: Sello de porcentaje '%' con líneas gruesas y chispa
function OffersIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" overflow="visible" className="w-20 h-20 sm:w-22 sm:h-22 md:w-[88px] md:h-[88px]" fill="none">
      <circle cx="48" cy="50" r="28" stroke="#2C2723" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="59" y1="37" x2="37" y2="63" stroke="#2C2723" strokeWidth="4.2" strokeLinecap="round" />
      <circle cx="42" cy="42" r="3.6" stroke="#2C2723" strokeWidth="3.6" />
      <circle cx="54" cy="58" r="3.6" stroke="#2C2723" strokeWidth="3.6" />
      <path d="M78 22 L80 27 L85 28.5 L80 30 L78 35 L76 30 L71 28.5 L76 27 Z" stroke="#2C2723" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
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
