"use client";
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { QuickAccessCard } from '../lib/types';

// ==============================================================================
// ILUSTRACIONES VECTORIALES ORGÁNICAS LINE-ART (ESTILO OBJETIA MINIMALISTA)
// ==============================================================================

function LoginIllustration() {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="#A97950" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className="w-14 h-14 sm:w-16 sm:h-16">
      {/* Contorno de cabeza / rostro orgánico */}
      <path d="M48 18 C41 18 36 23 36 31 C36 37 40 42 44 45 C44 47 43 50 42 53" />
      {/* Mano estilizada en la mejilla */}
      <path d="M47 38 C49 32 53 28 57 32 C59 34 60 38 59 43 C58 46 56 49 57 55 L58 64" />
      {/* Hombro derecho */}
      <path d="M58 52 C61 54 65 59 66 65" />
      {/* Hombro izquierdo y cuello */}
      <path d="M42 53 C37 55 30 60 27 68" />
      {/* Clavícula y pecho sutil */}
      <path d="M42 60 C46 63 51 62 53 59" />
      {/* Ceja / rasgo facial minimalista */}
      <path d="M38 31 C42 33 47 35 51 36" />
    </svg>
  );
}

function BestsellersIllustration() {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="#A97950" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className="w-14 h-14 sm:w-16 sm:h-16">
      {/* Esferas en las 3 puntas de la corona */}
      <circle cx="32" cy="35" r="2.8" />
      <circle cx="50" cy="22" r="2.8" />
      <circle cx="68" cy="35" r="2.8" />
      {/* Cuerpo de la corona */}
      <path d="M32 38 L40 50 L50 25 L60 50 L68 38 L63 67 L37 67 Z" />
      {/* Estrella central de 5 puntas */}
      <path d="M50 49 L52 54 L56.5 54.5 L53 57.5 L54 62 L50 59.5 L46 62 L47 57.5 L43.5 54.5 L48 54 Z" />
      {/* Línea de base flotante */}
      <path d="M36 74 H64" />
    </svg>
  );
}

function Under30kIllustration() {
  return (
    <svg viewBox="0 0 100 100" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-14 h-14 sm:w-16 sm:h-16">
      {/* Copa del árbol orgánica en verde salvia */}
      <path d="M37 48 C33 46 31 41 32 36 C33 31 37 27 42 27 C44 22 50 19 55 21 C60 22 63 26 63 30 C67 31 70 35 69 40 C68 44 65 47 61 48" stroke="#738268" strokeWidth="2.3" />
      {/* Hojitas o frutos cayendo */}
      <circle cx="57" cy="28" r="1.3" fill="#738268" />
      <circle cx="61" cy="33" r="1.3" fill="#738268" />
      {/* Tronco y ramas en terracota */}
      <path d="M47 48 V56 C47 60 44 64 42 72" stroke="#A97950" strokeWidth="2.3" />
      <path d="M47 56 C50 60 52 65 53 72" stroke="#A97950" strokeWidth="2.3" />
      {/* Suelo */}
      <path d="M33 72 H57" stroke="#A97950" strokeWidth="2.2" />
      {/* Moneda con signo $ */}
      <circle cx="68" cy="60" r="13" stroke="#A97950" strokeWidth="2.3" fill="#FAF8F5" />
      <path d="M68 53 V67 M65 56 C65 54 71 54 71 57 C71 61 65 60 65 64 C65 67 71 67 71 64" stroke="#A97950" strokeWidth="2" />
    </svg>
  );
}

function PaymentsIllustration() {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="#A97950" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className="w-14 h-14 sm:w-16 sm:h-16">
      {/* Tarjeta de crédito */}
      <rect x="44" y="26" width="46" height="30" rx="5" />
      <path d="M44 34 H90" />
      <path d="M70 47 H78" strokeWidth="1.8" />
      {/* Mano sujetando la tarjeta desde la izquierda */}
      <path d="M16 48 C24 48 30 43 36 38 C41 34 47 36 50 42 C51 46 45 48 39 49" />
      {/* Dedos bajo la tarjeta */}
      <path d="M44 49 C47 52 47 57 44 60 C42 62 38 61 38 56" />
      <path d="M48 52 C51 55 51 60 48 63 C46 65 42 64 42 59" />
      <path d="M52 55 C55 58 55 63 52 66 C50 68 46 66 45 62" />
      {/* Parte inferior de la muñeca / palma */}
      <path d="M16 64 C25 64 32 64 38 59" />
    </svg>
  );
}

function SecureShoppingIllustration() {
  return (
    <svg viewBox="0 0 100 100" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-14 h-14 sm:w-16 sm:h-16">
      {/* Arco / Gancho del candado */}
      <path d="M37 45 V34 C37 25 43 20 50 20 C57 20 63 25 63 34 V45" stroke="#A97950" strokeWidth="2.3" />
      {/* Cuerpo del candado */}
      <rect x="30" y="44" width="40" height="32" rx="7" stroke="#A97950" strokeWidth="2.3" fill="#FAF8F5" />
      {/* Cerradura / Keyhole */}
      <circle cx="50" cy="56" r="3.5" stroke="#A97950" strokeWidth="2.2" />
      <path d="M49 59.5 L48 66 H52 L51 59.5" stroke="#A97950" strokeWidth="2" />
      {/* Hoja botánica orgánica en verde salvia sobre la esquina */}
      <path d="M58 76 C58 76 58 64 69 54 C78 54 80 64 80 64 C80 64 78 76 69 76 C62 76 58 76 58 76 Z" stroke="#738268" strokeWidth="2.3" fill="#FAF8F5" />
      <path d="M58 76 L72 61" stroke="#738268" strokeWidth="2" />
    </svg>
  );
}

function OffersIllustration() {
  return (
    <svg viewBox="0 0 100 100" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-14 h-14 sm:w-16 sm:h-16">
      {/* Pétalo central del tulipán */}
      <path d="M50 20 C45 28 45 41 50 50 C55 41 55 28 50 20 Z" stroke="#A97950" strokeWidth="2.3" />
      {/* Pétalo izquierdo */}
      <path d="M50 50 C40 48 35 37 36 28 C40 23 45 26 50 30" stroke="#A97950" strokeWidth="2.3" />
      {/* Pétalo derecho */}
      <path d="M50 50 C60 48 65 37 64 28 C60 23 55 26 50 30" stroke="#A97950" strokeWidth="2.3" />
      {/* Tallo en verde salvia */}
      <path d="M50 50 V76" stroke="#738268" strokeWidth="2.3" />
      {/* Hoja izquierda */}
      <path d="M50 67 C41 67 34 60 33 51 C41 52 48 58 50 67 Z" stroke="#738268" strokeWidth="2.3" />
      {/* Hoja derecha */}
      <path d="M50 67 C59 67 66 60 67 51 C59 52 52 58 50 67 Z" stroke="#738268" strokeWidth="2.3" />
    </svg>
  );
}

// Mapa de ilustraciones por tipo
function CardIllustration({ iconType, imageUrl, title }: { iconType?: string | null; imageUrl?: string | null; title: string }) {
  if (imageUrl && imageUrl.trim() !== "" && imageUrl !== "null") {
    return (
      <div className="h-14 w-14 sm:h-16 sm:w-16 flex items-center justify-center overflow-hidden rounded-xl">
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
      title: "Ingresá a tu cuenta",
      subtitle: "",
      icon_type: "login",
      button_text: "Ingresá a tu cuenta",
      link_url: "/auth?mode=login",
      orden: 0,
      is_active: true
    },
    {
      id: 2,
      title: "Más vendidos",
      subtitle: "",
      icon_type: "bestsellers",
      button_text: "Ver más",
      link_url: "/catalog?sort=popular",
      orden: 1,
      is_active: true
    },
    {
      id: 3,
      title: "Menos de $30.000",
      subtitle: "",
      icon_type: "under_30k",
      button_text: "Ver productos",
      link_url: "/catalog?max_price=30000",
      orden: 2,
      is_active: true
    },
    {
      id: 4,
      title: "Medios de pago",
      subtitle: "",
      icon_type: "payments",
      button_text: "Ver medios",
      link_url: "#medios-de-pago",
      orden: 3,
      is_active: true
    },
    {
      id: 5,
      title: "Compra protegida",
      subtitle: "",
      icon_type: "secure_shopping",
      button_text: "Cómo funciona",
      link_url: "#compra-protegida",
      orden: 4,
      is_active: true
    },
    {
      id: 6,
      title: "En oferta",
      subtitle: "",
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
    const cardWidth = 175; // Ancho de tarjeta + gap
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
      {/* Botón Flecha Izquierda: Estilo Armónico Orgánico */}
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
            href={card.link_url}
            onClick={(e) => handleCardClick(e, card)}
            className="w-[138px] sm:w-[152px] md:w-[168px] aspect-[4/5] flex-shrink-0 snap-start bg-[#FAF8F5] border border-[#EAE5DC] hover:border-[#B88D65]/50 rounded-[22px] p-3.5 sm:p-4 shadow-[0_4px_16px_rgba(78,66,52,0.06)] hover:shadow-[0_8px_24px_rgba(78,66,52,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between items-center text-center group/card cursor-pointer select-none"
          >
            {/* 1. Dibujo / Ilustración Line-Art Orgánica */}
            <div className="flex-1 w-full flex items-center justify-center transition-transform duration-300 group-hover/card:scale-105">
              <CardIllustration 
                iconType={card.icon_type} 
                imageUrl={card.image_url} 
                title={card.title} 
              />
            </div>

            {/* 2. Título de la Tarjeta */}
            <div className="my-1.5 flex items-center justify-center w-full min-h-[26px]">
              <h3 className="text-xs sm:text-[13px] font-semibold text-[#2C2723] group-hover/card:text-[#A97950] transition-colors leading-snug tracking-tight text-center line-clamp-1">
                {card.title}
              </h3>
            </div>

            {/* 3. Botón Píldora en Tono Tostado Suave */}
            <div className="w-full py-1.5 sm:py-2 px-2 rounded-full bg-[#B88D65] group-hover/card:bg-[#A37953] text-white text-[10px] sm:text-[11px] font-medium text-center transition-colors shadow-2xs">
              <span className="truncate block">{card.button_text || "Ver más"}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Botón Flecha Derecha: Estilo Armónico Orgánico */}
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
