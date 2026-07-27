"use client";
import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  Upload, 
  Trash2, 
  Palette, 
  Type, 
  Image as ImageIcon,
  Smartphone,
  Monitor,
  Heart,
  ShoppingCart,
  ShieldCheck,
  Calendar,
  Zap
} from 'lucide-react';

interface AppearanceTabProps {
  tieneCambiosMarca: boolean;
  setTieneCambiosMarca: (val: boolean) => void;
  handlePublicarMarca: () => void;
  brandName: string;
  setBrandName: (val: string) => void;
  brandFontFamily: string;
  setBrandFontFamily: (val: string) => void;
  brandFontSize: string;
  setBrandFontSize: (val: string) => void;
  logoHistory: any[];
  setLogoHistory: React.Dispatch<React.SetStateAction<any[]>>;
  logoUrl: string;
  setLogoUrl: (val: string) => void;
  logoPreviaUrl: string | null;
  setLogoPreviaUrl: (val: string | null) => void;
  zoomLogo: number;
  setZoomLogo: React.Dispatch<React.SetStateAction<number>>;
  rotateLogo: number;
  setRotateLogo: React.Dispatch<React.SetStateAction<number>>;
  offsetX: number;
  setOffsetX: React.Dispatch<React.SetStateAction<number>>;
  offsetY: number;
  setOffsetY: React.Dispatch<React.SetStateAction<number>>;
  removerFondoBlanco: boolean;
  setRemoverFondoBlanco: (val: boolean) => void;
  toleranciaTransparencia: number;
  setToleranciaTransparencia: (val: number) => void;
  colorPrimary: string;
  setColorPrimary: (val: string) => void;
  colorSecondary: string;
  setColorSecondary: (val: string) => void;
  colorBackground: string;
  setColorBackground: (val: string) => void;
  colorNavbar: string;
  setColorNavbar: (val: string) => void;
  colorSectionTitle: string;
  setColorSectionTitle: (val: string) => void;
  colorCatalogLink: string;
  setColorCatalogLink: (val: string) => void;
  colorTextInput: string;
  setColorTextInput: (val: string) => void;
  handleEliminarLogoHistorial: (id: number) => void;
  apiUrl: string;
}

export default function AppearanceTab({
  tieneCambiosMarca,
  setTieneCambiosMarca,
  handlePublicarMarca,
  brandName,
  setBrandName,
  brandFontFamily,
  setBrandFontFamily,
  brandFontSize,
  setBrandFontSize,
  logoHistory,
  setLogoHistory,
  logoUrl,
  setLogoUrl,
  colorPrimary,
  setColorPrimary,
  colorSecondary,
  setColorSecondary,
  colorBackground,
  setColorBackground,
  colorNavbar,
  setColorNavbar,
  colorSectionTitle,
  setColorSectionTitle,
  colorCatalogLink,
  setColorCatalogLink,
  handleEliminarLogoHistorial
}: AppearanceTabProps) {

  // Estado local para vista previa interactiva
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Estados para Programación de Campañas Automáticas (Campaign Scheduler)
  const [campanaNombre, setCampanaNombre] = useState('Black Friday 2026');
  const [campanaInicio, setCampanaInicio] = useState('2026-11-20T00:00');
  const [campanaFin, setCampanaFin] = useState('2026-11-27T23:59');
  const [campanaEsquema, setCampanaEsquema] = useState('dark-gold');
  const [campanaProgramada, setCampanaProgramada] = useState(true);

  const notifyBrandingChange = (updates: { brandName?: string; logoUrl?: string; brandFontFamily?: string; brandFontSize?: string }) => {
    setTieneCambiosMarca(true);
    if (typeof window !== 'undefined') {
      if (updates.brandFontFamily) {
        document.body.style.setProperty('--font-family-brand', updates.brandFontFamily);
      }
      if (updates.brandFontSize) {
        document.body.style.setProperty('--font-size-brand', updates.brandFontSize);
      }
      window.dispatchEvent(new CustomEvent('branding_updated', { detail: updates }));
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* CABECERA PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200/80 pb-5 gap-4">
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-purple-600" />
            Configurador de Apariencia
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Personaliza la identidad corporativa, nombre de marca, logotipo, tipografía y paleta de colores en tiempo real.
          </p>
        </div>

        {tieneCambiosMarca && (
          <button 
            onClick={handlePublicarMarca}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4 stroke-[3]" />
            Publicar Cambios Globales
          </button>
        )}
      </div>

      {/* DISPOSICIÓN PRINCIPAL EN 2 COLUMNAS (CONTROLES A LA IZQ + VISTA PREVIA A LA DER) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA: CONTROLES DE CONFIGURACIÓN (7 COLS) */}
        <div className="lg:col-span-7 space-y-7">
          
          {/* SECCIÓN 1: IDENTIDAD Y MARCA */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
              <Type className="h-4 w-4 text-purple-600" />
              1. Identidad de Marca y Tipografía
            </h4>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="inputBrandNameMaster" className="text-xs font-bold text-gray-800 block">Nombre Comercial de la Marca</label>
                <input 
                  id="inputBrandNameMaster"
                  name="inputBrandNameMaster"
                  type="text" 
                  value={brandName}
                  onChange={(e) => { 
                    const val = e.target.value;
                    setBrandName(val);
                    notifyBrandingChange({ brandName: val });
                  }}
                  placeholder="Ej: Objetia"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600/20 font-bold text-gray-900 bg-gray-50/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="selectFontFamilyMaster" className="text-xs font-bold text-gray-800 block">Tipografía Principal</label>
                  <select 
                    id="selectFontFamilyMaster"
                    name="selectFontFamilyMaster"
                    value={brandFontFamily}
                    onChange={(e) => { 
                      const val = e.target.value;
                      setBrandFontFamily(val);
                      notifyBrandingChange({ brandFontFamily: val });
                    }}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600/20 bg-white font-bold text-gray-800 cursor-pointer"
                  >
                    <option value="Outfit">Outfit (Moderna & Elegante)</option>
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans (Limpia Tech)</option>
                    <option value="Inter">Inter (Minimalista & Neutral)</option>
                    <option value="Montserrat">Montserrat (Geométrica Corporativa)</option>
                    <option value="Poppins">Poppins (Redondeada Moderna)</option>
                    <option value="Cinzel">Cinzel (Alta Costura Luxury)</option>
                    <option value="Playfair Display">Playfair Display (Clásica Elegante)</option>
                    <option value="Cormorant Garamond">Cormorant Garamond (Editorial)</option>
                    <option value="Space Grotesk">Space Grotesk (Tech Futurista)</option>
                    <option value="Syne">Syne (Avant-Garde Artística)</option>
                    <option value="Roboto">Roboto (Sólida & Estable)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="selectFontSizeMaster" className="text-xs font-bold text-gray-800 block">Tamaño Texto Logo Navbar</label>
                  <select 
                    id="selectFontSizeMaster"
                    name="selectFontSizeMaster"
                    value={brandFontSize}
                    onChange={(e) => { 
                      const val = e.target.value;
                      setBrandFontSize(val);
                      notifyBrandingChange({ brandFontSize: val });
                    }}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600/20 bg-white font-bold text-gray-800 cursor-pointer"
                  >
                    <option value="1.1rem">Chico (1.10rem)</option>
                    <option value="1.35rem">Mediano (1.35rem)</option>
                    <option value="1.5rem">Normal (1.50rem)</option>
                    <option value="1.75rem">Grande (1.75rem)</option>
                    <option value="2rem">Extra Grande (2.00rem)</option>
                    <option value="2.25rem">Gigante (2.25rem)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: LOGOTIPO DE MARCA Y GALERÍA */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
              <ImageIcon className="h-4 w-4 text-purple-600" />
              2. Logotipo Corporativo
            </h4>

            <div className="flex flex-row overflow-x-auto gap-4 py-2 pr-2 scrollbar-thin">
              {/* Cargar Logo */}
              <label 
                className="relative flex-shrink-0 h-28 w-24 flex flex-col items-center justify-center border-2 border-dashed border-purple-200 hover:border-purple-500 rounded-xl cursor-pointer bg-purple-50/20 hover:bg-purple-50/60 transition group"
              >
                <div className="p-2 bg-purple-100 rounded-full text-purple-700 group-hover:scale-110 transition-transform">
                  <Upload className="h-4 w-4" />
                </div>
                <span className="text-[8px] font-black text-purple-800 mt-1.5 uppercase tracking-wider">Subir Image</span>
                <input 
                  id="inputUploadLogoMaster"
                  name="inputUploadLogoMaster"
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const objectUrl = URL.createObjectURL(file);
                      const draftItem = { id: -Date.now(), logo_url: objectUrl, label: "Nuevo Logo", file: file };
                      setLogoHistory(prev => [draftItem, ...prev]);
                      setLogoUrl(objectUrl);
                      notifyBrandingChange({ logoUrl: objectUrl });
                    }
                  }}
                  className="hidden"
                />
              </label>

              {/* Lista de Logos */}
              {(() => {
                const uniqueLogos: any[] = [];
                const seenUrls = new Set();
                logoHistory.forEach(item => {
                  if (item.logo_url && !seenUrls.has(item.logo_url)) {
                    seenUrls.add(item.logo_url);
                    uniqueLogos.push(item);
                  }
                });

                return uniqueLogos
                  .sort((a, b) => b.id - a.id)
                  .map((logo) => {
                    const esActivo = logoUrl === logo.logo_url;
                    return (
                      <div 
                        key={logo.id}
                        className={`relative flex-shrink-0 h-28 w-24 flex flex-col justify-between items-center bg-white border rounded-xl p-1.5 transition-all ${
                          esActivo ? 'border-2 border-purple-600 shadow-sm ring-2 ring-purple-600/10' : 'border-gray-100 hover:border-gray-300'
                        }`}
                      >
                        <div className="h-16 w-full flex items-center justify-center p-1 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                          <img src={logo.logo_url} alt={logo.label} className="max-h-full max-w-full object-contain" />
                        </div>

                        <div className="w-full flex items-center justify-around gap-1 mt-1 bg-gray-50 rounded-lg p-1">
                          <button 
                            type="button"
                            onClick={() => { setLogoUrl(logo.logo_url); notifyBrandingChange({ logoUrl: logo.logo_url }); }}
                            title="Usar como logo activo"
                            className={`h-6 w-6 flex-shrink-0 flex items-center justify-center rounded-md border transition cursor-pointer ${
                              esActivo ? 'bg-purple-600 border-purple-600 text-white shadow-xs' : 'bg-white border-gray-200 text-gray-400 hover:text-purple-600'
                            }`}
                          >
                            <Check className="h-3 w-3 stroke-[3]" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleEliminarLogoHistorial(logo.id)}
                            title="Eliminar logo"
                            className="h-6 w-6 flex-shrink-0 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  });
              })()}
            </div>
          </div>

          {/* SECCIÓN 3: PROGRAMADOR DE CAMPAÑAS AUTOMÁTICAS (CALENDAR SCHEDULER) */}
          <div className="bg-white border border-purple-200/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                3. Programador de Campañas Automáticas (Campaign Scheduler)
              </h4>
              <span className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-full border ${
                campanaProgramada ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}>
                {campanaProgramada ? '🟢 Programador Activo' : '⚪ Programador Inactivo'}
              </span>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Programa eventos temáticos (Black Friday, Cyber Week, Venta Nocturna) definiendo las fechas exactas de inicio y fin. La plataforma conmutará automáticamente la estética sin intervención manual.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-800 block">Nombre de la Campaña</label>
                <input 
                  type="text"
                  value={campanaNombre}
                  onChange={(e) => { setCampanaNombre(e.target.value); setTieneCambiosMarca(true); }}
                  placeholder="Ej: Black Week 2026"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 font-bold text-gray-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-800 block">Esquema Visual Promocional</label>
                <select
                  value={campanaEsquema}
                  onChange={(e) => { setCampanaEsquema(e.target.value); setTieneCambiosMarca(true); }}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 font-bold text-gray-800 bg-white cursor-pointer"
                >
                  <option value="dark-gold">Dark & Gold (Negro Mate & Dorado)</option>
                  <option value="light">Default Light (Blanco & Púrpura)</option>
                  <option value="warm">Warm Earth (Tonos Cálidos)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-800 block">Fecha y Hora de Inicio</label>
                <input 
                  type="datetime-local"
                  value={campanaInicio}
                  onChange={(e) => { setCampanaInicio(e.target.value); setTieneCambiosMarca(true); }}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 font-bold text-gray-800 bg-gray-50/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-800 block">Fecha y Hora de Cierre</label>
                <input 
                  type="datetime-local"
                  value={campanaFin}
                  onChange={(e) => { setCampanaFin(e.target.value); setTieneCambiosMarca(true); }}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 font-bold text-gray-800 bg-gray-50/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={campanaProgramada}
                  onChange={(e) => { setCampanaProgramada(e.target.checked); setTieneCambiosMarca(true); }}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-700">Habilitar conmutación automática</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setTieneCambiosMarca(true);
                  if (campanaEsquema === "dark-gold") {
                    setColorPrimary("#111827");
                    setColorSecondary("#D4AF37");
                    setColorBackground("#111827");
                    setColorNavbar("#1F2937");
                    setColorSectionTitle("#FFFFFF");
                    setColorCatalogLink("#D4AF37");
                  }
                }}
                className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
              >
                <Zap className="h-3.5 w-3.5" />
                Probar Tema en Vivo
              </button>
            </div>
          </div>

          {/* SECCIÓN 4: PALETA CROMÁTICA CORPORATIVA */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Palette className="h-4 w-4 text-purple-600" />
                4. Paleta de Colores Corporativa
              </h4>

              {/* Temas Rápidos */}
              <select 
                id="selectPresetThemesMaster"
                name="selectPresetThemesMaster"
                onChange={(e) => {
                  const opt = e.target.value;
                  setTieneCambiosMarca(true);
                  if (opt === "light") {
                    setColorPrimary("#2C3E50");
                    setColorSecondary("#D4AF37");
                    setColorBackground("#FAFAFA");
                    setColorNavbar("#FFFFFF");
                    setColorSectionTitle("#111827");
                    setColorCatalogLink("#3B82F6");
                  } else if (opt === "dark-gold") {
                    setColorPrimary("#111827");
                    setColorSecondary("#D4AF37");
                    setColorBackground("#111827");
                    setColorNavbar("#1F2937");
                    setColorSectionTitle("#FFFFFF");
                    setColorCatalogLink("#D4AF37");
                  } else if (opt === "warm") {
                    setColorPrimary("#5C4033");
                    setColorSecondary("#C0C0C0");
                    setColorBackground("#FDFBF7");
                    setColorNavbar("#FDFBF7");
                    setColorSectionTitle("#5C4033");
                    setColorCatalogLink("#5C4033");
                  }
                }}
                className="px-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-none bg-white font-bold text-gray-800 cursor-pointer shadow-2xs"
              >
                <option value="light">Esquema: Default Light</option>
                <option value="dark-gold">Esquema: Dark & Gold</option>
                <option value="warm">Esquema: Warm Earth</option>
              </select>
            </div>

            {/* Tarjetas Seleccionadoras de Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Primary Color */}
              <div 
                onClick={() => document.getElementById("master-color-primary")?.click()}
                className="bg-gray-50/60 rounded-xl p-3.5 border border-gray-200/70 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer group"
              >
                <div>
                  <h5 className="text-xs font-bold text-gray-900">Color Primario</h5>
                  <p className="text-[10px] text-gray-400 font-medium">Botones y acentos</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-gray-600 uppercase">{colorPrimary}</span>
                  <div className="relative w-7 h-7 rounded-full shadow-xs border-2 border-white ring-1 ring-gray-200 overflow-hidden" style={{ backgroundColor: colorPrimary }}>
                    <input 
                      id="master-color-primary"
                      name="master-color-primary"
                      type="color" 
                      value={colorPrimary} 
                      onChange={(e) => { setColorPrimary(e.target.value); setTieneCambiosMarca(true); }} 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                    />
                  </div>
                </div>
              </div>

              {/* Secondary Color */}
              <div 
                onClick={() => document.getElementById("master-color-secondary")?.click()}
                className="bg-gray-50/60 rounded-xl p-3.5 border border-gray-200/70 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer group"
              >
                <div>
                  <h5 className="text-xs font-bold text-gray-900">Color Secundario</h5>
                  <p className="text-[10px] text-gray-400 font-medium">Badges y etiquetas</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-gray-600 uppercase">{colorSecondary}</span>
                  <div className="relative w-7 h-7 rounded-full shadow-xs border-2 border-white ring-1 ring-gray-200 overflow-hidden" style={{ backgroundColor: colorSecondary }}>
                    <input 
                      id="master-color-secondary"
                      name="master-color-secondary"
                      type="color" 
                      value={colorSecondary} 
                      onChange={(e) => { setColorSecondary(e.target.value); setTieneCambiosMarca(true); }} 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                    />
                  </div>
                </div>
              </div>

              {/* Navbar Color */}
              <div 
                onClick={() => document.getElementById("master-color-navbar")?.click()}
                className="bg-gray-50/60 rounded-xl p-3.5 border border-gray-200/70 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer group"
              >
                <div>
                  <h5 className="text-xs font-bold text-gray-900">Navbar Superior</h5>
                  <p className="text-[10px] text-gray-400 font-medium">Fondo de la barra</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-gray-600 uppercase">{colorNavbar}</span>
                  <div className="relative w-7 h-7 rounded-full shadow-xs border-2 border-white ring-1 ring-gray-200 overflow-hidden" style={{ backgroundColor: colorNavbar }}>
                    <input 
                      id="master-color-navbar"
                      name="master-color-navbar"
                      type="color" 
                      value={colorNavbar} 
                      onChange={(e) => { setColorNavbar(e.target.value); setTieneCambiosMarca(true); }} 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                    />
                  </div>
                </div>
              </div>

              {/* Background Color */}
              <div 
                onClick={() => document.getElementById("master-color-bg")?.click()}
                className="bg-gray-50/60 rounded-xl p-3.5 border border-gray-200/70 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer group"
              >
                <div>
                  <h5 className="text-xs font-bold text-gray-900">Fondo General</h5>
                  <p className="text-[10px] text-gray-400 font-medium">Fondo del sitio web</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-gray-600 uppercase">{colorBackground}</span>
                  <div className="relative w-7 h-7 rounded-full shadow-xs border-2 border-white ring-1 ring-gray-200 overflow-hidden" style={{ backgroundColor: colorBackground }}>
                    <input 
                      id="master-color-bg"
                      name="master-color-bg"
                      type="color" 
                      value={colorBackground} 
                      onChange={(e) => { setColorBackground(e.target.value); setTieneCambiosMarca(true); }} 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                    />
                  </div>
                </div>
              </div>

              {/* Section Titles Color */}
              <div 
                onClick={() => document.getElementById("master-color-section-title")?.click()}
                className="bg-gray-50/60 rounded-xl p-3.5 border border-gray-200/70 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer group"
              >
                <div>
                  <h5 className="text-xs font-bold text-gray-900">Títulos de Sección</h5>
                  <p className="text-[10px] text-gray-400 font-medium">Texto de módulos</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-gray-600 uppercase">{colorSectionTitle}</span>
                  <div className="relative w-7 h-7 rounded-full shadow-xs border-2 border-white ring-1 ring-gray-200 overflow-hidden" style={{ backgroundColor: colorSectionTitle }}>
                    <input 
                      id="master-color-section-title"
                      name="master-color-section-title"
                      type="color" 
                      value={colorSectionTitle} 
                      onChange={(e) => { setColorSectionTitle(e.target.value); setTieneCambiosMarca(true); }} 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                    />
                  </div>
                </div>
              </div>

              {/* Catalog Link Color */}
              <div 
                onClick={() => document.getElementById("master-color-catalog-link")?.click()}
                className="bg-gray-50/60 rounded-xl p-3.5 border border-gray-200/70 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer group"
              >
                <div>
                  <h5 className="text-xs font-bold text-gray-900">Hipervínculos</h5>
                  <p className="text-[10px] text-gray-400 font-medium">Links y ver más</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-gray-600 uppercase">{colorCatalogLink}</span>
                  <div className="relative w-7 h-7 rounded-full shadow-xs border-2 border-white ring-1 ring-gray-200 overflow-hidden" style={{ backgroundColor: colorCatalogLink }}>
                    <input 
                      id="master-color-catalog-link"
                      name="master-color-catalog-link"
                      type="color" 
                      value={colorCatalogLink} 
                      onChange={(e) => { setColorCatalogLink(e.target.value); setTieneCambiosMarca(true); }} 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: SIMULADOR VISTA PREVIA EN TIEMPO REAL (5 COLS STICKY) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Monitor className="h-4 w-4 text-purple-600" />
                Simulador en Tiempo Real
              </h4>

              {/* Selector de Dispositivo */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition ${previewDevice === 'desktop' ? 'bg-white text-purple-700 shadow-xs' : 'text-gray-500'}`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition ${previewDevice === 'mobile' ? 'bg-white text-purple-700 shadow-xs' : 'text-gray-500'}`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* MOCKUP DEL SITIO WEB CON LOS ESTILOS SELECCIONADOS */}
            <div 
              className={`border border-gray-200 shadow-md transition-all duration-300 mx-auto overflow-hidden bg-white rounded-2xl ${
                previewDevice === 'mobile' ? 'max-w-[260px]' : 'w-full'
              }`}
              style={{ backgroundColor: colorBackground }}
            >
              {/* Header Preview */}
              <div className="p-3 border-b border-gray-200/50 flex items-center justify-between" style={{ backgroundColor: colorNavbar }}>
                <div className="flex items-center gap-2">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-6 w-auto object-contain" />
                  ) : (
                    <span className="h-6 w-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-black text-xs">O</span>
                  )}
                  <span 
                    className="font-extrabold tracking-wider" 
                    style={{ 
                      fontFamily: brandFontFamily, 
                      fontSize: brandFontSize || '1.35rem', 
                      color: colorSectionTitle 
                    }}
                  >
                    {brandName || 'OBJETIA'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Heart className="h-3.5 w-3.5 text-gray-400" />
                  <ShoppingCart className="h-3.5 w-3.5 text-gray-400" />
                </div>
              </div>

              {/* Contenido Preview */}
              <div className="p-4 space-y-4">
                
                {/* Mini Hero Card */}
                <div 
                  className="p-4 text-white shadow-xs space-y-2 rounded-2xl"
                  style={{ backgroundColor: colorPrimary }}
                >
                  <span className="text-[8px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full inline-block">Novedad</span>
                  <h5 className="text-xs font-bold leading-tight" style={{ fontFamily: brandFontFamily }}>{campanaNombre}</h5>
                  <button className="px-3 py-1 bg-white text-gray-900 text-[10px] font-bold shadow-xs rounded-xl">
                    Explorar
                  </button>
                </div>

                {/* Mini Product Card Preview */}
                <div className="p-3 bg-white border border-gray-100 shadow-xs space-y-2 rounded-2xl">
                  <div className="h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center text-gray-300">
                    <ImageIcon className="h-8 w-8 opacity-40" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-gray-400 uppercase" style={{ color: colorCatalogLink }}>Ver Catálogo &rarr;</span>
                    <h6 className="text-[11px] font-bold text-gray-800" style={{ color: colorSectionTitle }}>Sillón Sofá Velvet</h6>
                    <span className="text-xs font-black text-gray-900 block">$450.000</span>
                  </div>
                </div>

              </div>

              {/* Footer Preview */}
              <div className="p-3 bg-gray-900 text-gray-400 text-[9px] text-center border-t border-gray-800 flex items-center justify-between">
                <span>© 2026 {brandName || 'Objetia'}</span>
                <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-400" /> Seguro</span>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 text-center font-medium">
              Esta simulación se actualiza automáticamente a medida que modificas cualquier valor.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
