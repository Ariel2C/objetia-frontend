import React from 'react';
import BannerCarousel from '../components/BannerCarousel';
import QuickCardsCarousel from '../components/QuickCardsCarousel';
import ProductCarousel from '../components/ProductCarousel';
import WelcomeBanner from '../components/WelcomeBanner';
import { getApiUrl } from '../lib/config';
import type { Producto, Banner, SeccionInicio, QuickAccessCard } from '../lib/types';

export const revalidate = 0;

// Data Fetching en tiempo real sin caché estático
async function getHomepageData(): Promise<{ 
  productos: Producto[]; 
  banners: Banner[]; 
  secciones: SeccionInicio[];
  quickCards: QuickAccessCard[];
}> {
  try {
    const apiURL = getApiUrl(); 
    
    const [resProducts, resLayout, resSections, resQuickCards] = await Promise.all([
      fetch(`${apiURL}/products/featured`, { cache: 'no-store' }),
      fetch(`${apiURL}/cms/layout/`, { cache: 'no-store' }),
      fetch(`${apiURL}/cms/sections/`, { cache: 'no-store' }),
      fetch(`${apiURL}/cms/quick-cards/`, { cache: 'no-store' })
    ]);

    if (!resProducts.ok || !resLayout.ok) throw new Error(`API respondió ${resProducts.status}/${resLayout.status}`);

    const layoutData = await resLayout.json();
    const secciones = resSections.ok ? await resSections.json() : [];
    const quickCards = resQuickCards.ok ? await resQuickCards.json() : [];
    
    return {
      productos: await resProducts.json(),
      banners: layoutData.carrusel_banners || [],
      secciones: secciones,
      quickCards: quickCards
    };
  } catch (error) {
    console.error("Error cargando datos de la home:", error);
    return { productos: [], banners: [], secciones: [], quickCards: [] };
  }
}


export default async function HomePage() {
  const { productos, banners, secciones, quickCards } = await getHomepageData();

  return (
    <div className="pb-16 bg-transparent">
      {/* ==============================================================================
          1. CARRUSEL DE BANNERS (CMS Dinámico)
          ============================================================================== */}
      <BannerCarousel banners={banners} />

      {/* ==============================================================================
          2. CARRUSEL DE TARJETAS DE ACCESO RÁPIDO (SUPERPUESTO AL PIE DEL BANNER HERO)
          Configurable desde Objetia Studio > Personalización
          ============================================================================== */}
      <QuickCardsCarousel cards={quickCards} />

      {/* BANNER PROMOCIONAL DE BIENVENIDA (Solo para no logueados) */}
      <WelcomeBanner />

      {/* ==============================================================================
          3. SECCIONES DE PRODUCTOS DINÁMICAS (Carruseles configurables)
          ============================================================================== */}
      {secciones && secciones.length > 0 ? (
        secciones.map((seccion) => (
          <ProductCarousel 
            key={seccion.id}
            title={seccion.title}
            categoryFilter={seccion.category_filter}
            productos={seccion.productos}
            className="mt-6"
          />
        ))
      ) : (
        <ProductCarousel 
          title="Destacados de la Semana"
          categoryFilter="Todos"
          productos={productos}
          className="mt-6"
        />
      )}
    </div>
  );
}
