"use client";
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import type { Producto } from '../lib/types';

interface ProductCarouselProps {
  title: string;
  categoryFilter?: string | null;
  productos: Producto[];
  className?: string;
}

export default function ProductCarousel({ title, categoryFilter, productos, className }: ProductCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Calcular la cantidad de páginas dinámicamente según el ancho de pantalla
  const updatePagesInfo = () => {
    const container = containerRef.current;
    if (!container || productos.length === 0) return;

    const containerWidth = container.clientWidth;
    const scrollWidth = container.scrollWidth;

    // Calcular cuántas páginas reales caben
    const pages = Math.ceil(scrollWidth / containerWidth);
    setTotalPages(pages || 1);

    // Actualizar visibilidad de flechas
    setShowLeftArrow(container.scrollLeft > 10);
    setShowRightArrow(container.scrollLeft + containerWidth < scrollWidth - 10);
  };

  useEffect(() => {
    updatePagesInfo();
    window.addEventListener('resize', updatePagesInfo);
    return () => window.removeEventListener('resize', updatePagesInfo);
  }, [productos]);

  // Manejar el deslizamiento manual/táctil para actualizar los puntitos/segmentos
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const scrollWidth = container.scrollWidth;
    const maxScroll = scrollWidth - containerWidth;
    
    const pages = Math.ceil(scrollWidth / containerWidth) || 1;
    
    let pageIndex = 0;
    if (maxScroll > 0) {
      // Mapear linealmente la posición del scroll al total de páginas correspondientes
      pageIndex = Math.round((container.scrollLeft / maxScroll) * (pages - 1));
    }
    
    setCurrentPage(pageIndex);
    setShowLeftArrow(container.scrollLeft > 10);
    setShowRightArrow(container.scrollLeft + containerWidth < scrollWidth - 10);
  };

  // Navegación por flechas
  const scroll = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const scrollAmount = direction === 'left' ? -containerWidth : containerWidth;
    
    container.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  };

  if (!productos || productos.length === 0) return null;

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-slide-up ${className || 'mt-6'}`}>
      <div className="bg-[#FAF8F5] border border-[#EAE5DC] rounded-3xl p-5 sm:p-6 shadow-[0_4px_24px_rgba(78,66,52,0.06)] relative group/carousel">
        
        {/* CABECERA: TÍTULO E INDICADORES DE PÁGINA */}
        <div className="flex justify-between items-baseline mb-4">
          <div className="flex items-baseline gap-3">
            <h2 
              className="text-base md:text-lg font-bold tracking-tight text-[#2C2723]"
            >
              {title}
            </h2>
            <Link 
              href={`/catalog?category=${encodeURIComponent(categoryFilter || 'Todos')}`}
              className="text-xs font-bold text-[#B88D65] hover:text-[#A37953] hover:underline"
            >
              Ver catálogo
            </Link>
          </div>

          {/* INDICADOR DE PÁGINAS: SEGMENTOS DE LÍNEA HORIZONTAL */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, index) => (
                <div 
                  key={index}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    index === currentPage 
                      ? 'w-7 bg-[#B88D65]' 
                      : 'w-2.5 bg-[#EAE5DC]'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* CONTENEDOR DESLIZABLE */}
        <div className="relative">
          
          {/* Flecha Izquierda */}
          {showLeftArrow && (
            <button 
              type="button"
              onClick={() => scroll('left')}
              aria-label="Ver productos anteriores"
              className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 sm:-ml-5 z-20 p-2.5 sm:p-3 rounded-full bg-[#FAF8F5] shadow-md border border-[#EAE5DC] text-[#5C4A3A] hover:bg-white active:scale-95 transition opacity-0 group-hover/carousel:opacity-100 cursor-pointer hidden md:flex items-center justify-center"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {/* Flecha Derecha */}
          {showRightArrow && (
            <button 
              type="button"
              onClick={() => scroll('right')}
              aria-label="Ver más productos"
              className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 sm:-mr-5 z-20 p-2.5 sm:p-3 rounded-full bg-[#FAF8F5] shadow-md border border-[#EAE5DC] text-[#5C4A3A] hover:bg-white active:scale-95 transition opacity-0 group-hover/carousel:opacity-100 cursor-pointer hidden md:flex items-center justify-center"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* CINTA DE PRODUCTOS: reutiliza ProductCard para no duplicar lógica ni diseño */}
          <div 
            ref={containerRef}
            onScroll={handleScroll}
            className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 no-scrollbar"
            style={{ scrollbarWidth: 'none' }}
          >
            {productos.map((producto, index) => (
              <div 
                key={producto.id} 
                className="flex-shrink-0 w-[46%] sm:w-[calc(33.33%-10px)] md:w-[calc(25%-12px)] lg:w-[calc(20%-13px)] xl:w-[calc(16.66%-14px)] snap-start"
              >
                <ProductCard producto={producto} priority={index < 5} />
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
