"use client";
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { QuickAccessCard } from '../lib/types';

// ==============================================================================
// ILUSTRACIONES VECTORIALES AL ESTILO DE OBJETIA (MODERNAS, LIMPIAS Y PREMIUM)
// ==============================================================================

function LoginIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 drop-shadow-sm">
      <defs>
        <linearGradient id="grad-login-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8f0fe" />
          <stop offset="100%" stopColor="#d2e3fc" />
        </linearGradient>
        <linearGradient id="grad-login-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#87a9ff" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      {/* Fondo circular suave */}
      <circle cx="60" cy="60" r="48" fill="url(#grad-login-bg)" />
      {/* Ventana de navegación estilizada */}
      <rect x="28" y="32" width="64" height="52" rx="10" fill="#ffffff" stroke="#c7d7f7" strokeWidth="2.5" />
      <path d="M28 44H92" stroke="#e8f0fe" strokeWidth="2" />
      <circle cx="37" cy="38" r="2" fill="#ef4444" />
      <circle cx="43" cy="38" r="2" fill="#f59e0b" />
      <circle cx="49" cy="38" r="2" fill="#10b981" />
      {/* Avatar de usuario central con acento Objetia */}
      <circle cx="60" cy="56" r="10" fill="url(#grad-login-accent)" />
      <path d="M44 76C44 68.5 51.5 67 60 67C68.5 67 76 68.5 76 76" stroke="url(#grad-login-accent)" strokeWidth="3" strokeLinecap="round" />
      {/* Destello sutil */}
      <circle cx="84" cy="34" r="3" fill="#87a9ff" />
    </svg>
  );
}

function BestsellersIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 drop-shadow-sm">
      <defs>
        <linearGradient id="grad-best-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#fee2e2" />
        </linearGradient>
        <linearGradient id="grad-best-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="48" fill="url(#grad-best-bg)" opacity="0.8" />
      {/* Bolsa de compras de diseño */}
      <path d="M38 46H82L86 86H34L38 46Z" fill="#ffffff" stroke="#fcd34d" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M48 46V36C48 30.5 53.5 26 60 26C66.5 26 72 30.5 72 36V46" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
      {/* Estrella insignia de los más vendidos */}
      <path d="M60 52L63.5 61H73L65.5 66.5L68.5 76L60 70.5L51.5 76L54.5 66.5L47 61H56.5L60 52Z" fill="url(#grad-best-accent)" />
      {/* Destellos dorados */}
      <circle cx="82" cy="40" r="2.5" fill="#f59e0b" />
      <circle cx="36" cy="74" r="2" fill="#ea580c" />
    </svg>
  );
}

function Under30kIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 drop-shadow-sm">
      <defs>
        <linearGradient id="grad-price-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ecfdf5" />
          <stop offset="100%" stopColor="#d1fae5" />
        </linearGradient>
        <linearGradient id="grad-price-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="48" fill="url(#grad-price-bg)" />
      {/* Monedas e insignia de precio bajo */}
      <rect x="32" y="70" width="56" height="14" rx="7" fill="#ffffff" stroke="#a7f3d0" strokeWidth="2.5" />
      <rect x="36" y="58" width="48" height="14" rx="7" fill="#ffffff" stroke="#a7f3d0" strokeWidth="2.5" />
      {/* Medalla central con símbolo $ y flecha abajo */}
      <circle cx="60" cy="48" r="20" fill="url(#grad-price-accent)" />
      <text x="60" y="52" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="bold" fontFamily="sans-serif">$</text>
      {/* Flecha hacia abajo indicando rebaja */}
      <circle cx="75" cy="36" r="8" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
      <path d="M75 32V40M75 40L72.5 37.5M75 40L77.5 37.5" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PaymentsIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 drop-shadow-sm">
      <defs>
        <linearGradient id="grad-pay-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eff6ff" />
          <stop offset="100%" stopColor="#e0e7ff" />
        </linearGradient>
        <linearGradient id="grad-pay-card" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="48" fill="url(#grad-pay-bg)" />
      {/* Tarjeta de fondo */}
      <rect x="40" y="32" width="52" height="34" rx="8" fill="#93c5fd" opacity="0.6" transform="rotate(8 40 32)" />
      {/* Tarjeta principal frontal */}
      <rect x="28" y="44" width="64" height="42" rx="9" fill="url(#grad-pay-card)" stroke="#ffffff" strokeWidth="2" />
      {/* Chip de tarjeta */}
      <rect x="36" y="54" width="12" height="10" rx="3" fill="#fde047" />
      <line x1="36" y1="59" x2="48" y2="59" stroke="#ca8a04" strokeWidth="1" />
      {/* Ondas contactless */}
      <path d="M54 55C56 57 56 61 54 63" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M57 52C60 55 60 63 57 66" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
      {/* Barra de numeración decorativa */}
      <rect x="36" y="74" width="28" height="4" rx="2" fill="#ffffff" opacity="0.8" />
    </svg>
  );
}

function SecureShoppingIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 drop-shadow-sm">
      <defs>
        <linearGradient id="grad-sec-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f0fdf4" />
          <stop offset="100%" stopColor="#dcfce7" />
        </linearGradient>
        <linearGradient id="grad-sec-shield" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="48" fill="url(#grad-sec-bg)" />
      {/* Paquete / Caja de entrega limpia */}
      <rect x="32" y="42" width="56" height="46" rx="8" fill="#ffffff" stroke="#bbf7d0" strokeWidth="2.5" />
      <path d="M32 54H88" stroke="#dcfce7" strokeWidth="2" />
      <path d="M60 42V88" stroke="#dcfce7" strokeWidth="2" />
      {/* Escudo protector con check verde */}
      <path d="M74 34L60 28L46 34V46C46 56 52 64 60 67C68 64 74 56 74 46V34Z" fill="url(#grad-sec-shield)" stroke="#ffffff" strokeWidth="2" />
      <path d="M54 48L58 52L67 43" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OffersIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 drop-shadow-sm">
      <defs>
        <linearGradient id="grad-offer-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff1f2" />
          <stop offset="100%" stopColor="#ffe4e6" />
        </linearGradient>
        <linearGradient id="grad-offer-badge" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="48" fill="url(#grad-offer-bg)" />
      {/* Etiqueta de descuento inclinada */}
      <path d="M34 50L60 24L86 50L60 76L34 50Z" fill="#ffffff" stroke="#fecdd3" strokeWidth="2.5" />
      <circle cx="60" cy="36" r="4" fill="#f43f5e" />
      {/* Insignia central % */}
      <circle cx="60" cy="64" r="22" fill="url(#grad-offer-badge)" stroke="#ffffff" strokeWidth="2" />
      <text x="60" y="70" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="black" fontFamily="sans-serif">%</text>
      {/* Destello de oportunidad */}
      <path d="M84 32L86 38L92 40L86 42L84 48L82 42L76 40L82 38L84 32Z" fill="#f43f5e" />
    </svg>
  );
}

// Mapa de ilustraciones por tipo
function CardIllustration({ iconType, imageUrl, title }: { iconType?: string | null; imageUrl?: string | null; title: string }) {
  if (imageUrl && imageUrl.trim() !== "" && imageUrl !== "null") {
    return (
      <div className="h-20 w-20 flex items-center justify-center overflow-hidden rounded-xl">
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

  // Tarjetas por defecto si no vienen cargadas desde la BD
  const defaultCards: QuickAccessCard[] = [
    {
      id: 1,
      title: "Ingresá a Mi Objetia",
      subtitle: "Gestioná tus compras, ventas y mensajes.",
      icon_type: "login",
      button_text: "Ingresar a tu cuenta",
      link_url: "/auth?mode=login",
      orden: 0,
      is_active: true
    },
    {
      id: 2,
      title: "Más vendidos",
      subtitle: "Explorá las piezas más elegidas y en tendencia.",
      icon_type: "bestsellers",
      button_text: "Ver más vendidos",
      link_url: "/catalog?sort=popular",
      orden: 1,
      is_active: true
    },
    {
      id: 3,
      title: "Menos de $30.000",
      subtitle: "Descubrí objetos de diseño a precios accesibles.",
      icon_type: "under_30k",
      button_text: "Mostrar productos",
      link_url: "/catalog?max_price=30000",
      orden: 2,
      is_active: true
    },
    {
      id: 4,
      title: "Medios de pago",
      subtitle: "Pagá tus compras de forma rápida y segura.",
      icon_type: "payments",
      button_text: "Conocer medios de pago",
      link_url: "#medios-de-pago",
      orden: 3,
      is_active: true
    },
    {
      id: 5,
      title: "Compra segura",
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
      link_url: "/catalog?discount=true",
      orden: 5,
      is_active: true
    }
  ];

  const displayCards = (cards && cards.length > 0) ? cards : defaultCards;

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
    const cardWidth = 205; // Ancho más angosto de tarjeta + gap
    const scrollAmount = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleCardClick = (e: React.MouseEvent, card: QuickAccessCard) => {
    if (card.link_url === '#compra-protegida') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('abrir-modal-footer', { detail: 'compra_protegida' }));
    } else if (card.link_url === '#medios-de-pago') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('abrir-modal-footer', { detail: 'preguntas' }));
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-20 -mt-16 sm:-mt-20 md:-mt-28 lg:-mt-32 mb-8 animate-slide-up group/quickcards">
      {/* Botón Flecha Izquierda: Idéntico al de ProductCarousel */}
      {canScrollLeft && (
        <button 
          type="button"
          onClick={() => handleScroll('left')}
          aria-label="Ver tarjetas anteriores"
          className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 sm:-ml-5 z-30 p-3 rounded-full bg-white shadow-lg border border-gray-100 text-gray-700 hover:bg-gray-50 active:scale-95 transition opacity-0 group-hover/quickcards:opacity-100 cursor-pointer hidden md:flex items-center justify-center"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Contenedor Deslizable de Tarjetas */}
      <div
        ref={scrollContainerRef}
        onScroll={updateScrollButtons}
        className="flex items-stretch gap-3 sm:gap-3.5 overflow-x-auto no-scrollbar scrollbar-none py-2 px-1 scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {displayCards.map((card) => (
          <Link
            key={card.id}
            href={card.link_url}
            onClick={(e) => handleCardClick(e, card)}
            className="w-[165px] sm:w-[180px] md:w-[195px] flex-shrink-0 snap-start bg-white border border-[#eaeaea] hover:border-[#87a9ff]/50 rounded-2xl p-3 sm:p-4 shadow-[0_4px_18px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_26px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between items-center text-center group/card cursor-pointer block select-none"
          >
            {/* Título de la Tarjeta */}
            <div className="min-h-[38px] flex items-center justify-center w-full">
              <h3 className="text-[13px] sm:text-[14px] font-bold text-[#1f2937] group-hover/card:text-[#1a73e8] transition-colors leading-snug tracking-tight line-clamp-2">
                {card.title}
              </h3>
            </div>

            {/* Ilustración Central al estilo Objetia (Más compacta) */}
            <div className="my-1.5 h-20 w-20 flex items-center justify-center transition-transform duration-300 group-hover/card:scale-105">
              <CardIllustration 
                iconType={card.icon_type} 
                imageUrl={card.image_url} 
                title={card.title} 
              />
            </div>

            {/* Subtítulo o Descripción Breve */}
            <div className="min-h-[30px] flex items-center justify-center px-0.5 mb-2.5 w-full">
              <p className="text-[10.5px] sm:text-[11px] text-[#6b7280] leading-tight line-clamp-2">
                {card.subtitle || ""}
              </p>
            </div>

            {/* Botón de Acción integrado a la tarjeta */}
            <div className="w-full py-2 px-2.5 rounded-xl text-[11px] font-bold text-[#1a73e8] bg-[#f0f4fd] group-hover/card:bg-[#1a73e8] group-hover/card:text-white border border-[#d2e3fc]/60 transition-all duration-200 flex items-center justify-center gap-1 shadow-2xs">
              <span className="truncate">{card.button_text || "Ingresar"}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Botón Flecha Derecha: Idéntico al de ProductCarousel */}
      {canScrollRight && (
        <button 
          type="button"
          onClick={() => handleScroll('right')}
          aria-label="Ver más tarjetas"
          className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 sm:-mr-5 z-30 p-3 rounded-full bg-white shadow-lg border border-gray-100 text-gray-700 hover:bg-gray-50 active:scale-95 transition opacity-0 group-hover/quickcards:opacity-100 cursor-pointer hidden md:flex items-center justify-center"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
