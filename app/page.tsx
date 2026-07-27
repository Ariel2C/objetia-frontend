// app/page.tsx
import React from 'react';
import BannerCarousel from '../components/BannerCarousel';
import ProductCarousel from '../components/ProductCarousel';
import { getApiUrl } from '../lib/config';
import type { Producto, Banner, SeccionInicio } from '../lib/types';

export const revalidate = 0;

// Data Fetching en tiempo real sin caché estático
async function getHomepageData(): Promise<{ productos: Producto[]; banners: Banner[]; secciones: SeccionInicio[] }> {
  try {
    const apiURL = getApiUrl(); 
    
    const [resProducts, resLayout, resSections] = await Promise.all([
      fetch(`${apiURL}/products/featured`, { cache: 'no-store' }),
      fetch(`${apiURL}/cms/layout/`, { cache: 'no-store' }),
      fetch(`${apiURL}/cms/sections/`, { cache: 'no-store' })
    ]);

    if (!resProducts.ok || !resLayout.ok) throw new Error(`API respondió ${resProducts.status}/${resLayout.status}`);

    const layoutData = await resLayout.json();
    const secciones = resSections.ok ? await resSections.json() : [];
    
    return {
      productos: await resProducts.json(),
      banners: layoutData.carrusel_banners || [],
      secciones: secciones
    };
  } catch (error) {
    console.error("Error cargando datos de la home:", error);
    return { productos: [], banners: [], secciones: [] };
  }
}


export default async function HomePage() {
  const { productos, banners, secciones } = await getHomepageData();

  return (
    <div className="pb-16 bg-gray-50/30">
      {/* ==============================================================================
          1. CARRUSEL DE BANNERS (CMS Dinámico)
          ============================================================================== */}
      <BannerCarousel banners={banners} />

      {/* ==============================================================================
          2. SECCIONES DE PRODUCTOS DINÁMICAS (Carruseles configurables)
          ============================================================================== */}
      {secciones && secciones.length > 0 ? (
        secciones.map((seccion) => (
          <ProductCarousel 
            key={seccion.id}
            title={seccion.title}
            categoryFilter={seccion.category_filter}
            productos={seccion.productos}
          />
        ))
      ) : (
        // Fallback si no hay secciones cargadas en la base de datos
        <ProductCarousel 
          title="Destacados de la Semana"
          categoryFilter="Todos"
          productos={productos}
        />
      )}
    </div>
  );
}
