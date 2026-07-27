"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Banner } from '../lib/types';
import { getApiUrl } from '../lib/config';

export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play cada 5s
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  if (!banners || banners.length === 0) {
    return (
      <div 
        className="relative w-full aspect-square md:aspect-[1920/432] bg-contain bg-no-repeat bg-center bg-black flex items-center shadow-inner"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1200)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-white">
          <h1 className="text-2xl md:text-5xl font-extrabold tracking-tight max-w-2xl leading-tight">
            Renová tus Espacios con Piezas Únicas
          </h1>
          <p className="mt-2 md:mt-4 text-xs md:text-xl max-w-xl text-gray-200">
            Artículos de decoración premium, nuevos y usados seleccionados por curadores.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-square md:aspect-[1920/432] overflow-hidden shadow-inner bg-black">
      {/* CONTENEDOR DE DESLIZAMIENTO (SLIDER) */}
      <div 
        className="flex h-full transition-transform duration-500 ease-in-out" 
        style={{ 
          transform: `translateX(-${currentIndex * (100 / banners.length)}%)`, 
          width: `${banners.length * 100}%` 
        }}
      >
        {banners.map((banner, index) => {
          const apiURL = getApiUrl();
          const isProcessing = !banner.cloudfront_url && !banner.image_url;
          
          const resolveUrl = (rawUrl?: string) => {
            if (!rawUrl || rawUrl === "procesando..." || rawUrl.includes("procesando...")) {
              return "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1200";
            }
            if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
              return rawUrl;
            }
            return `${apiURL}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
          };

          const bgImageDesktop = resolveUrl(banner.cloudfront_url || banner.image_url);
          const bgImageMobile = resolveUrl(banner.mobile_cloudfront_url || banner.image_url) || bgImageDesktop;

          const SlideContent = (
            <div className="h-full w-full flex items-center relative overflow-hidden bg-black">
              {/* Picture Tag para diseño responsivo */}
              <picture className="absolute inset-0 w-full h-full">
                <source media="(max-width: 768px)" srcSet={encodeURI(bgImageMobile)} />
                <img 
                  src={encodeURI(bgImageDesktop)} 
                  alt={banner.title || "Banner"} 
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  className="w-full h-full object-cover object-center"
                />
              </picture>

              {/* Efecto oscurecido (overlay) del lado del texto solo si está habilitado el título o subtítulo */}
              {(banner.title || banner.subtitle) && (
                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent z-10" />
              )}
              
              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-white z-20">
                {banner.title && (
                  <h1 className="text-2xl md:text-5xl font-extrabold tracking-tight max-w-2xl leading-tight">
                    {banner.title}
                  </h1>
                )}
                {banner.subtitle && (
                  <p className="mt-2 md:mt-4 text-xs md:text-xl max-w-xl text-gray-200 font-medium">
                    {banner.subtitle}
                  </p>
                )}
              </div>
            </div>
          );

          // Todo el banner es clickeable si tiene un link_url configurado
          return banner.link_url && banner.link_url !== "#" ? (
            <Link 
              href={banner.link_url} 
              key={banner.id} 
              className="h-full block cursor-pointer flex-shrink-0"
              style={{ width: `${100 / banners.length}%` }}
            >
              {SlideContent}
            </Link>
          ) : (
            <div 
              key={banner.id} 
              className="h-full flex-shrink-0"
              style={{ width: `${100 / banners.length}%` }}
            >
              {SlideContent}
            </div>
          );
        })}
      </div>

      {/* DOTS DE NAVEGACIÓN (PUNTOS DEL MEDIO) */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Ir al banner ${index + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                index === currentIndex ? 'w-6 bg-[var(--color-secondary)]' : 'w-2.5 bg-white/50 hover:bg-white'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
