// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import Navbar from '../components/Navbar';
import { AuthProvider } from '../components/AuthContext';
import { FavoritesProvider } from '../components/FavoritesContext';
import { ToastProvider } from '../components/ToastContext';
import { getApiUrl } from '../lib/config';
import ErrorVisualizer from '../components/ErrorVisualizer';
import Footer from '../components/Footer';
import AnnouncementBar from '../components/AnnouncementBar';
import PromoModal from '../components/PromoModal';

// Tipografía única de toda la webapp
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'Objetia | Decoración Premium Híbrida',
  description: 'Marketplace de grado empresarial de decoración de interiores nuevos y usados.',
};

// 1. Contrato de tipo estricto alineado con tu tabla 'store_branding' de PostgreSQL
interface BrandingResponse {
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_input_color: string;
  navbar_color: string;
  section_title_color: string;
  catalog_link_color: string;
  brand_font_family: string;
  brand_font_size: string;
  logo_url?: string;
}

// 2. Data Fetching en Servidor optimizado (ISR de 5 minutos)
async function getLiveBranding(): Promise<BrandingResponse> {
  try {
    const res = await fetch(`${getApiUrl()}/cms/layout/`, {
      cache: 'no-store',
      headers: { 
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      console.warn(`FastAPI respondió, pero con código de error: ${res.status}`);
      throw new Error();
    }

    const data = await res.json();
    const marca = data.marca || {};
    return {
      primary_color: marca.primary_color_hex || '#2C3E50',
      secondary_color: marca.secondary_color_hex || '#D4AF37',
      background_color: marca.background_color_hex || '#FAFAFA',
      text_input_color: marca.input_text_color_hex || '#111827',
      navbar_color: marca.navbar_color_hex || '#FFFFFF',
      section_title_color: marca.section_title_color_hex || '#111827',
      catalog_link_color: marca.catalog_link_color_hex || '#3B82F6',
      brand_font_family: marca.brand_font_family || 'Outfit',
      brand_font_size: marca.brand_font_size || '1.5rem',
      logo_url: marca.logo_cloudfront_url || ''
    };
  } catch (error) {
    return {
      primary_color: '#2C3E50',
      secondary_color: '#D4AF37',
      background_color: '#FAFAFA',
      text_input_color: '#111827',
      navbar_color: '#FFFFFF',
      section_title_color: '#111827',
      catalog_link_color: '#3B82F6',
      brand_font_family: 'Outfit',
      brand_font_size: '1.5rem',
      logo_url: ''
    };
  }
}


export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Resolvemos los estilos corporativos en Node.js antes de enviar el HTML al navegador
  const brandingDB = await getLiveBranding();

  return (
    <html lang="es" className={inter.variable}>
      <head>
        {/* Tipografías premium de diseño para la identidad corporativa de Objetia */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;600;800&family=Montserrat:wght@500;700;900&family=Outfit:wght@400;600;800;900&family=Playfair+Display:ital,wght@0,700;1,700&family=Plus+Jakarta+Sans:wght@400;600;800&family=Poppins:wght@500;700;900&family=Space+Grotesk:wght@600;700&family=Syne:wght@700;800&family=Roboto:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body
        style={{
          // Mapeamos las variables CSS nativas directo en tu body respetando tu patrón original
          '--color-primary': brandingDB.primary_color,
          '--color-secondary': brandingDB.secondary_color,
          '--bg-marketplace': brandingDB.background_color,
          '--color-text-input': brandingDB.text_input_color,
          '--bg-navbar': brandingDB.navbar_color,
          '--color-section-title': brandingDB.section_title_color,
          '--color-catalog-link': brandingDB.catalog_link_color,
          '--font-family-brand': brandingDB.brand_font_family,
          '--font-size-brand': brandingDB.brand_font_size,
          backgroundColor: 'var(--bg-marketplace)'
        } as React.CSSProperties}
        className="min-h-screen font-sans antialiased text-gray-900"
      >
        {/* 🌟 Proveedor de sesión global e inyección de la prop del Logo dinámico al menú */}
        <AuthProvider>
          <FavoritesProvider>
            <ToastProvider>
              <AnnouncementBar />
              <Navbar logoUrl={brandingDB.logo_url} />
              <PromoModal />
              {/* Visor de errores solo para desarrollo: no exponer detalles internos en producción */}
              {process.env.NODE_ENV === 'development' && <ErrorVisualizer />}
              <main className="pb-20 md:pb-0">{children}</main>
              <Footer />
            </ToastProvider>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
