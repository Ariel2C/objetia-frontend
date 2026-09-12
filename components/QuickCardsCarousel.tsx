"use client";
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { QuickAccessCard } from '../lib/types';

// ==============================================================================
// ILUSTRACIONES VECTORIALES EXCLUSIVAS DE OBJETIA (SIN FONDO CIRCULAR, GRAN ESCALA)
// ==============================================================================

// 1. Ingresá a tu cuenta: Dispositivo móvil con tarjeta de perfil, avatar cálido y llave de acceso
function LoginIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="5 5 95 95" overflow="visible" className="w-22 h-22 sm:w-24 sm:h-24 md:w-[96px] md:h-[96px]" fill="none">
  {/* Smartphone / Dispositivo móvil de acceso */}
  <rect x="25" y="16" width="46" height="74" rx="8" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.1" />
  
  {/* Altavoz / notch superior */}
  <rect x="42" y="21" width="12" height="2.5" rx="1.25" fill="#362C24" />

  {/* Pantalla interior con tarjeta de perfil */}
  <rect x="30" y="28" width="36" height="54" rx="5" fill="#F8F6F2" stroke="#E2DACF" strokeWidth="1.2" />

  {/* Círculo de avatar en tono caramelo */}
  <circle cx="48" cy="45" r="12" fill="#D69760" stroke="#362C24" strokeWidth="2" />
  
  {/* Silueta de usuario dentro del avatar */}
  <circle cx="48" cy="42" r="4.2" fill="#FFFFFF" />
  <path d="M40.5 53 C41.5 48.5 44 47.5 48 47.5 C52 47.5 54.5 48.5 55.5 53" fill="#FFFFFF" />

  {/* Líneas de autenticación / bienvenida */}
  <rect x="37" y="62" width="22" height="3" rx="1.5" fill="#362C24" />
  <rect x="41" y="68" width="14" height="2.5" rx="1.25" fill="#C48B5E" />

  {/* Llave dorada flotante de acceso a la derecha */}
  <g transform="rotate(-25 72 48)">
    {/* Cabeza de la llave */}
    <circle cx="70" cy="44" r="8.5" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.1" />
    <circle cx="70" cy="44" r="4.2" fill="#D69760" stroke="#362C24" strokeWidth="1.5" />
    {/* Cuerpo y dientes de la llave */}
    <path d="M78.5 44 H95" stroke="#362C24" strokeWidth="2.1" strokeLinecap="round" />
    <path d="M89 44 V49" stroke="#362C24" strokeWidth="2.1" strokeLinecap="round" />
    <path d="M93 44 V50" stroke="#362C24" strokeWidth="2.1" strokeLinecap="round" />
  </g>

  {/* Destellos de bienvenida / seguridad */}
  <path d="M82 22 L83.5 17 L85 22 L90 23.5 L85 25 L83.5 30 L82 25 L77 23.5 Z" fill="#D69760" stroke="#362C24" strokeWidth="1.2" />
  <path d="M19 40 L20 36 L21 40 L25 41 L21 42 L20 46 L19 42 L15 41 Z" fill="#D69760" stroke="#362C24" strokeWidth="1.2" />
</svg>
  );
}

// 2. Más vendidos: Trofeo de victoria con estrella central, base pedestal y cintas de gala
function BestsellersIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="5 5 95 95" overflow="visible" className="w-22 h-22 sm:w-24 sm:h-24 md:w-[96px] md:h-[96px]" fill="none">
  {/* Cintas decorativas de premiación detrás del trofeo */}
  <path d="M37 66 L25 82 L35 79 L42 84 L39 68" fill="#C48B5E" stroke="#362C24" strokeWidth="2" strokeLinejoin="round" />
  <path d="M68 66 L80 82 L70 79 L63 84 L66 68" fill="#C48B5E" stroke="#362C24" strokeWidth="2" strokeLinejoin="round" />

  {/* Asas laterales del trofeo */}
  <path d="M34 32 C21 32 20 48 33 52" fill="none" stroke="#362C24" strokeWidth="2.5" strokeLinecap="round" />
  <path d="M71 32 C84 32 85 48 72 52" fill="none" stroke="#362C24" strokeWidth="2.5" strokeLinecap="round" />

  {/* Base pedestal del trofeo */}
  <path d="M47 62 L45 74 H60 L58 62" fill="#D69760" stroke="#362C24" strokeWidth="2" strokeLinejoin="round" />
  <rect x="37" y="74" width="31" height="11" rx="3" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.1" />
  <rect x="42" y="78" width="21" height="3" rx="1.5" fill="#C48B5E" />

  {/* Copa principal del trofeo */}
  <path d="M32 23 H73 V38 C73 53 62 62 52.5 62 C43 62 32 53 32 38 Z" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.1" strokeLinejoin="round" />
  
  {/* Franja superior y cuerpo cálido de la copa */}
  <path d="M33 30 H72 V38 C72 51 61.5 60 52.5 60 C43.5 60 33 51 33 38 Z" fill="#D69760" />

  {/* Estrella de 5 puntas prominente en el centro */}
  <path d="M52.5 34 L54.8 40.5 L61.5 40.7 L56.2 44.7 L58.2 51.2 L52.5 47.3 L46.8 51.2 L48.8 44.7 L43.5 40.7 L50.2 40.5 Z" fill="#FFFFFF" stroke="#362C24" strokeWidth="1.8" strokeLinejoin="round" />

  {/* Borde superior de la copa */}
  <rect x="30" y="21" width="45" height="5" rx="2.5" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.1" />

  {/* Destellos de campeón / más vendido */}
  <path d="M52.5 10 L54 6 L55.5 10 L59.5 11.5 L55.5 13 L54 17 L52.5 13 L48.5 11.5 Z" fill="#D69760" stroke="#362C24" strokeWidth="1.2" />
  <path d="M21 24 L22 20 L23 24 L27 25 L23 26 L22 30 L21 26 L17 25 Z" fill="#D69760" stroke="#362C24" strokeWidth="1.2" />
  <path d="M83 24 L84 20 L85 24 L89 25 L85 26 L84 30 L83 26 L79 25 Z" fill="#D69760" stroke="#362C24" strokeWidth="1.2" />
</svg>
  );
}

// 3. Menos de $30.000: Alcancía / Cerdito de ahorro moderno con gran moneda $ en tono miel
function Under30kIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="5 5 95 95" overflow="visible" className="w-22 h-22 sm:w-24 sm:h-24 md:w-[96px] md:h-[96px]" fill="none">
  {/* Alcancía / Piggy Bank estilizada moderna */}
  {/* Patitas */}
  <rect x="31" y="70" width="8" height="12" rx="3" fill="#FFFFFF" stroke="#362C24" strokeWidth="2" />
  <rect x="58" y="70" width="8" height="12" rx="3" fill="#FFFFFF" stroke="#362C24" strokeWidth="2" />

  {/* Cola en rulito */}
  <path d="M22 51 C17 50 16 43 20 41 C22 40 25 43 23 46" fill="none" stroke="#362C24" strokeWidth="2" strokeLinecap="round" />

  {/* Oreja */}
  <path d="M60 33 C61 24 70 26 69 35 Z" fill="#D69760" stroke="#362C24" strokeWidth="2" strokeLinejoin="round" />

  {/* Cuerpo redondeado del cerdito */}
  <ellipse cx="48" cy="54" rx="27" ry="21" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.1" />

  {/* Franja decorativa cálida orgánica en el cuerpo */}
  <path d="M38 41 C44 40 54 44 57 56 C59 64 56 71 52 74 C41 74 30 67 27 59 C25 53 29 44 38 41 Z" fill="#EDE0D2" />

  {/* Ojo sonriente */}
  <path d="M64 47 C65.5 45.5 67.5 45.5 69 47" fill="none" stroke="#362C24" strokeWidth="2.1" strokeLinecap="round" />

  {/* Hocico */}
  <rect x="70" y="47" width="9" height="15" rx="4.5" fill="#D69760" stroke="#362C24" strokeWidth="2" />
  <circle cx="73.5" cy="52.5" r="1.2" fill="#362C24" />
  <circle cx="73.5" cy="56.5" r="1.2" fill="#362C24" />

  {/* Ranura para la moneda en la espalda */}
  <rect x="42" y="32.5" width="13" height="3" rx="1.5" fill="#362C24" />

  {/* Gran moneda dorada $ cayendo en la ranura */}
  <g transform="translate(0, -2)">
    {/* Aura / borde blanco para separar de la alcancía */}
    <circle cx="48.5" cy="23" r="13.5" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.1" />
    <circle cx="48.5" cy="23" r="10.5" fill="#D69760" stroke="#362C24" strokeWidth="1.2" />
    
    {/* Símbolo de pesos $ nítido */}
    <path d="M48.5 16 V30 M45 19.5 C45 17.5 51.5 17.5 51.5 21 C51.5 25.5 45.5 24 45.5 27 C45.5 30 52 30 52 27" fill="none" stroke="#FFFFFF" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
  </g>

  {/* Destellos de ahorro */}
  <path d="M22 28 L23 24 L24 28 L28 29 L24 30 L23 34 L22 30 L18 29 Z" fill="#D69760" stroke="#362C24" strokeWidth="1.2" />
  <path d="M83 34 L84.5 29 L86 34 L91 35.5 L86 37 L84.5 42 L83 37 L78 35.5 Z" fill="#D69760" stroke="#362C24" strokeWidth="1.2" />
</svg>
  );
}

// 4. Medios de pago: Tarjeta de crédito contactless con chip EMV sobre terminal de pago POS
function PaymentsIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="5 5 95 95" overflow="visible" className="w-22 h-22 sm:w-24 sm:h-24 md:w-[96px] md:h-[96px]" fill="none">
  {/* Terminal de cobro / Datáfono (POS) en la base */}
  <rect x="32" y="44" width="45" height="42" rx="6" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.1" />
  
  {/* Ranura y pantalla de la terminal */}
  <rect x="39" y="51" width="31" height="15" rx="3" fill="#D69760" stroke="#362C24" strokeWidth="1.5" />
  {/* Monto / líneas simuladas en pantalla */}
  <rect x="43" y="55" width="14" height="2" rx="1" fill="#FFFFFF" />
  <rect x="43" y="60" width="23" height="2" rx="1" fill="#FFFFFF" />
  
  {/* Teclado numérico de la terminal */}
  <circle cx="43" cy="73" r="1.8" fill="#362C24" />
  <circle cx="50" cy="73" r="1.8" fill="#362C24" />
  <circle cx="57" cy="73" r="1.8" fill="#362C24" />
  <circle cx="64" cy="73" r="1.8" fill="#362C24" />
  <circle cx="43" cy="79" r="1.8" fill="#362C24" />
  <circle cx="50" cy="79" r="1.8" fill="#362C24" />
  <circle cx="57" cy="79" r="1.8" fill="#362C24" />
  <circle cx="64" cy="79" r="1.8" fill="#362C24" />

  {/* Tarjeta de crédito sobrevolando (Tap to Pay / Contactless) */}
  <g transform="rotate(-18 48 30)">
    {/* Cuerpo de la tarjeta de crédito */}
    <rect x="22" y="16" width="52" height="32" rx="4.5" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.1" />
    
    {/* Banda decorativa cálida de la tarjeta */}
    <path d="M23 28 H73 V43.5 C73 46 71 47.5 68.5 47.5 H26.5 C24 47.5 23 46 23 43.5 Z" fill="#C48B5E" />

    {/* Chip EMV dorado */}
    <rect x="29" y="22" width="9" height="7" rx="1.5" fill="#D69760" stroke="#362C24" strokeWidth="1.2" />

    {/* Ondas contactless de pago sin contacto */}
    <path d="M60 21 C62 23 62 26 60 28" fill="none" stroke="#362C24" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M63.5 19 C66.5 22.5 66.5 27 63.5 30.5" fill="none" stroke="#362C24" strokeWidth="1.5" strokeLinecap="round" />
  </g>

  {/* Ondas de conexión entre tarjeta y terminal */}
  <path d="M22 47 C20 43 20 38 23 34" fill="none" stroke="#D69760" strokeWidth="2" strokeLinecap="round" />
  <path d="M17 49 C14 42 14 35 18 29" fill="none" stroke="#D69760" strokeWidth="2" strokeLinecap="round" />

  {/* Destello de pago confirmado */}
  <path d="M83 26 L84.5 21 L86 26 L91 27.5 L86 29 L84.5 34 L83 29 L78 27.5 Z" fill="#D69760" stroke="#362C24" strokeWidth="1.2" />
</svg>
  );
}

// 5. Compra protegida: Paquete de entrega sellado con escudo de seguridad, checkmark y detalle botánico
function SecureShoppingIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="5 5 95 95" overflow="visible" className="w-22 h-22 sm:w-24 sm:h-24 md:w-[96px] md:h-[96px]" fill="none">
  {/* Paquete de entrega / Caja de envío en perspectiva frontal */}
  <rect x="22" y="38" width="46" height="42" rx="4" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.1" />
  
  {/* Solapas superiores de la caja */}
  <path d="M22 48 H68" stroke="#362C24" strokeWidth="1.5" />
  {/* Cinta de sellado kraft en tono toffee */}
  <rect x="41" y="38" width="8" height="42" fill="#D69760" stroke="#362C24" strokeWidth="1.5" />

  {/* Etiqueta de envío con código de barras */}
  <rect x="27" y="55" width="11" height="15" rx="1.5" fill="#EDE0D2" stroke="#362C24" strokeWidth="1" />
  <path d="M29 59 H36 M29 63 H34 M29 67 H36" stroke="#362C24" strokeWidth="1" strokeLinecap="round" />

  {/* Escudo de seguridad en primer plano a la derecha */}
  <g transform="translate(42, 34)">
    {/* Sombra / contorno grueso del escudo */}
    <path d="M22 6 L38 12 V28 C38 38 29 45 22 49 C15 45 6 38 6 28 V12 Z" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.3" strokeLinejoin="round" />
    
    {/* Relleno cálido del escudo */}
    <path d="M22 9 L35 14 V27 C35 35 28 41 22 45 C16 41 9 35 9 27 V14 Z" fill="#D69760" stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round" />

    {/* Tilde / Checkmark de compra protegida */}
    <path d="M16 26 L20.5 30.5 L28.5 20" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </g>

  {/* Ramita botánica orgánica en verde salvia */}
  <g transform="translate(12, 20)">
    <path d="M14 36 C14 26 21 18 29 14" fill="none" stroke="#78886D" strokeWidth="2" strokeLinecap="round" />
    <path d="M19 25 C15 22 17 18 21 21 C22 23 21 26 19 25 Z" fill="#78886D" stroke="#362C24" strokeWidth="1" />
    <path d="M25 18 C23 13 28 12 29 16 C29 18 27 19 25 18 Z" fill="#78886D" stroke="#362C24" strokeWidth="1" />
  </g>

  {/* Destellos de protección */}
  <path d="M83 22 L84.5 17 L86 22 L91 23.5 L86 25 L84.5 30 L83 25 L78 23.5 Z" fill="#D69760" stroke="#362C24" strokeWidth="1.2" />
</svg>
  );
}

// 6. En oferta: Bolsa boutique de compras con sello de % de descuento, etiqueta flash y destellos
function OffersIllustration() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="5 5 95 95" overflow="visible" className="w-22 h-22 sm:w-24 sm:h-24 md:w-[96px] md:h-[96px]" fill="none">
  {/* Bolsa de compras de boutique (Shopping Bag) */}
  {/* Manijas de la bolsa */}
  <path d="M37 32 C37 20 49 20 49 32" fill="none" stroke="#362C24" strokeWidth="2.2" strokeLinecap="round" />

  {/* Cuerpo de la bolsa */}
  <path d="M26 32 L31 78 H65 L70 32 Z" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.1" strokeLinejoin="round" />

  {/* Pliegue lateral / diseño cálido de la bolsa */}
  <path d="M31 32 L35 78 H58 L54 32 Z" fill="#D69760" />

  {/* Sello circular con % prominente en la bolsa */}
  <circle cx="44.5" cy="53" r="10" fill="#FFFFFF" stroke="#362C24" strokeWidth="1.8" />
  <circle cx="41.5" cy="49" r="1.8" fill="#C48B5E" />
  <path d="M47 47 L42 59" stroke="#362C24" strokeWidth="2" strokeLinecap="round" />
  <circle cx="47.5" cy="57" r="1.8" fill="#C48B5E" />

  {/* Gran etiqueta de descuento colgante en ángulo a la derecha */}
  <g transform="rotate(22 68 52)">
    {/* Hilo de la etiqueta */}
    <path d="M54 26 C57 21 62 18 67 22" fill="none" stroke="#362C24" strokeWidth="1.5" strokeDasharray="2.5 2.5" />

    {/* Etiqueta de precio */}
    <path d="M56 26 H78 L90 38 L68 60 L56 48 Z" fill="#FFFFFF" stroke="#362C24" strokeWidth="2.1" strokeLinejoin="round" />
    <path d="M58 28 H76 L86 38 L68 56 L58 46 Z" fill="#C48B5E" />
    <circle cx="63" cy="33" r="2.8" fill="#FFFFFF" stroke="#362C24" strokeWidth="1.5" />

    {/* Relámpago / Rayo de Oferta Flash */}
    <path d="M72 34 L66 43 H72 L68 52 L78 41 H72 Z" fill="#FFFFFF" stroke="#362C24" strokeWidth="1.3" strokeLinejoin="round" />
  </g>

  {/* Destellos de rebaja */}
  <path d="M19 28 L20 24 L21 28 L25 29 L21 30 L20 34 L19 30 L15 29 Z" fill="#D69760" stroke="#362C24" strokeWidth="1.2" />
  <path d="M84 20 L85.5 15 L87 20 L92 21.5 L87 23 L85.5 28 L84 23 L79 21.5 Z" fill="#D69760" stroke="#362C24" strokeWidth="1.2" />
  <path d="M21 68 L22 65 L23 68 L26 69 L23 70 L22 73 L21 70 L18 69 Z" fill="#D69760" stroke="#362C24" strokeWidth="1.2" />
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

  // Tarjetas por defecto si no vienen cargadas desde la BD
  const defaultCards: QuickAccessCard[] = [
    {
      id: 1,
      title: "Ingresá a tu cuenta",
      subtitle: "Gestioná tus compras, ventas y mensajes.",
      icon_type: "login",
      button_text: "Ingresá a tu cuenta",
      link_url: "/auth?mode=login",
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
            href={card.link_url}
            onClick={(e) => handleCardClick(e, card)}
            className="w-[148px] sm:w-[164px] md:w-[180px] min-h-[246px] sm:min-h-[256px] flex-shrink-0 snap-start bg-[#FAF8F5] border border-[#EAE5DC] hover:border-[#B88D65]/50 rounded-[22px] p-3.5 sm:p-4 shadow-[0_4px_16px_rgba(78,66,52,0.06)] hover:shadow-[0_8px_24px_rgba(78,66,52,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between items-center text-center group/card cursor-pointer select-none"
          >
            {/* 1. Dibujo / Ilustración Exclusiva Objetia (Sin fondo circular y ampliada) */}
            <div className="h-[96px] sm:h-[104px] w-full flex items-center justify-center transition-transform duration-300 group-hover/card:scale-105">
              <CardIllustration 
                iconType={card.icon_type} 
                imageUrl={card.image_url} 
                title={card.title} 
              />
            </div>

            {/* 2. Título y Descripción de la Tarjeta */}
            <div className="my-1 flex flex-col items-center justify-center w-full px-1">
              <h3 className="text-xs sm:text-[13px] font-semibold text-[#2C2723] group-hover/card:text-[#A97950] transition-colors leading-snug tracking-tight text-center line-clamp-1">
                {card.title}
              </h3>
              {card.subtitle && (
                <p className="text-[10.5px] sm:text-[11px] text-[#73675C] leading-snug text-center line-clamp-2 mt-1 min-h-[26px]">
                  {card.subtitle}
                </p>
              )}
            </div>

            {/* 3. Botón Píldora */}
            <div className="w-full py-1.5 sm:py-2 px-2 rounded-full bg-[#B88D65] group-hover/card:bg-[#A37953] text-white text-[10px] sm:text-[11px] font-medium text-center transition-colors shadow-2xs">
              <span className="truncate block">{card.button_text || "Ver más"}</span>
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
