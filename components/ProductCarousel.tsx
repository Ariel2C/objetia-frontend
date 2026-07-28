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
}

export default function ProductCarousel({ title, categoryFilter, productos }: ProductCarouselProps) {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 animate-slide-up">
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm relative group/carousel">
        
        {/* CABECERA: TÍTULO E INDICADORES DE PÁGINA */}
        <div className="flex justify-between items-baseline mb-4">
          <div className="flex items-baseline gap-3">
            <h2 
              className="text-base md:text-lg font-bold tracking-tight"
              style={{ color: 'var(--color-section-title, #111827)' }}
            >
              {title}
            </h2>
            <Link 
              href={`/catalog?category=${encodeURIComponent(categoryFilter || 'Todos')}`}
              className="text-xs font-bold hover:underline"
              style={{ color: 'var(--color-catalog-link, #3B82F6)' }}
            >
              Ver catálogo &rarr;
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
                      ? 'w-7 bg-[var(--color-secondary)]' 
                      : 'w-2.5 bg-gray-200'
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
              className="absolute left-0 top-1/2 -translate-y-1/2 -ml-6 z-20 p-3 rounded-full bg-white shadow-lg border border-gray-100 text-gray-700 hover:bg-gray-50 active:scale-95 transition opacity-0 group-hover/carousel:opacity-100 cursor-pointer hidden md:flex"
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
              className="absolute right-0 top-1/2 -translate-y-1/2 -mr-6 z-20 p-3 rounded-full bg-white shadow-lg border border-gray-100 text-gray-700 hover:bg-gray-50 active:scale-95 transition opacity-0 group-hover/carousel:opacity-100 cursor-pointer hidden md:flex"
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
