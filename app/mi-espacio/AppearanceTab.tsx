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
  Zap,
  Sliders,
  Eye,
  Info
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
  logoPreviaUrl?: string | null;
  setLogoPreviaUrl?: (val: string | null) => void;
  zoomLogo?: number;
  setZoomLogo?: React.Dispatch<React.SetStateAction<number>>;
  rotateLogo?: number;
  setRotateLogo?: React.Dispatch<React.SetStateAction<number>>;
  offsetX?: number;
  setOffsetX?: React.Dispatch<React.SetStateAction<number>>;
  offsetY?: number;
  setOffsetY?: React.Dispatch<React.SetStateAction<number>>;
  removerFondoBlanco?: boolean;
  setRemoverFondoBlanco?: (val: boolean) => void;
  toleranciaTransparencia?: number;
  setToleranciaTransparencia?: (val: number) => void;
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
  colorTextInput?: string;
  setColorTextInput?: (val: string) => void;
  handleEliminarLogoHistorial: (id: number) => void;
  apiUrl?: string;
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
    <div className="space-y-6 animate-fade-in font-sans text-[#d4d4d4]">
      
      {/* 1. CABECERA & CONTROLES ESTILO GOOGLE AI STUDIO */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          {/* Badge de Proyecto */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252525] border border-[#333333] text-xs font-medium text-[#d4d4d4]">
            <Sparkles className="h-3.5 w-3.5 text-[#87a9ff]" />
            <span className="text-[#8c8c8c]">Módulo</span>
            <span className="text-white font-semibold">Configuración de Apariencia Web</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252525] border border-[#333333] text-xs text-[#8c8c8c]">
            <Eye className="h-3.5 w-3.5 text-emerald-400" />
            <span>Renderizado CSS en tiempo real</span>
          </div>
        </div>

        {/* Botón Publicar Cambios */}
        {tieneCambiosMarca && (
          <button 
            onClick={handlePublicarMarca}
            className="px-4 py-1.5 bg-[#87a9ff] hover:bg-[#a5b4fc] text-[#121214] rounded-lg text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 animate-pulse"
          >
            <Check className="h-4 w-4 stroke-[2.5]" />
            Publicar Cambios Globales
          </button>
        )}
      </div>

      {/* 2. DISPOSICIÓN PRINCIPAL EN 2 COLUMNAS (CONTROLES A LA IZQ + VISTA PREVIA A LA DER) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMNA IZQUIERDA: CONTROLES DE CONFIGURACIÓN (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* SECCIÓN 1: IDENTIDAD Y MARCA */}
          <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[16px] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Type className="h-4 w-4 text-[#87a9ff]" />
                1. Identidad de Marca y Tipografía
              </h4>
              <span className="text-[10px] text-[#8c8c8c] font-mono">BRAND_CONFIG</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="inputBrandNameMaster" className="text-xs font-medium text-[#d4d4d4] block">
                  Nombre Comercial de la Marca
                </label>
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
                  style={{ color: '#ffffff', backgroundColor: '#18181a', caretColor: '#ffffff' }}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff] transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="selectFontFamilyMaster" className="text-xs font-medium text-[#d4d4d4] block">
                    Tipografía Principal
                  </label>
                  <select 
                    id="selectFontFamilyMaster"
                    name="selectFontFamilyMaster"
                    value={brandFontFamily}
                    onChange={(e) => { 
                      const val = e.target.value;
                      setBrandFontFamily(val);
                      notifyBrandingChange({ brandFontFamily: val });
                    }}
                    style={{ color: '#ffffff', backgroundColor: '#18181a' }}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff] cursor-pointer appearance-none transition"
                  >
                    <option value="Outfit" className="bg-[#1e1e1e] text-white">Outfit (Moderna & Elegante)</option>
                    <option value="Plus Jakarta Sans" className="bg-[#1e1e1e] text-white">Plus Jakarta Sans (Limpia Tech)</option>
                    <option value="Inter" className="bg-[#1e1e1e] text-white">Inter (Minimalista & Neutral)</option>
                    <option value="Montserrat" className="bg-[#1e1e1e] text-white">Montserrat (Geométrica)</option>
                    <option value="Poppins" className="bg-[#1e1e1e] text-white">Poppins (Redondeada)</option>
                    <option value="Cinzel" className="bg-[#1e1e1e] text-white">Cinzel (Alta Costura Luxury)</option>
                    <option value="Playfair Display" className="bg-[#1e1e1e] text-white">Playfair Display (Clásica)</option>
                    <option value="Space Grotesk" className="bg-[#1e1e1e] text-white">Space Grotesk (Tech Futurista)</option>
                    <option value="Roboto" className="bg-[#1e1e1e] text-white">Roboto (Sólida & Estable)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="selectFontSizeMaster" className="text-xs font-medium text-[#d4d4d4] block">
                    Tamaño Texto Logo Navbar
                  </label>
                  <select 
                    id="selectFontSizeMaster"
                    name="selectFontSizeMaster"
                    value={brandFontSize}
                    onChange={(e) => { 
                      const val = e.target.value;
                      setBrandFontSize(val);
                      notifyBrandingChange({ brandFontSize: val });
                    }}
                    style={{ color: '#ffffff', backgroundColor: '#18181a' }}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff] cursor-pointer appearance-none transition"
                  >
                    <option value="1.1rem" className="bg-[#1e1e1e] text-white">Chico (1.10rem)</option>
                    <option value="1.35rem" className="bg-[#1e1e1e] text-white">Mediano (1.35rem)</option>
                    <option value="1.5rem" className="bg-[#1e1e1e] text-white">Normal (1.50rem)</option>
                    <option value="1.75rem" className="bg-[#1e1e1e] text-white">Grande (1.75rem)</option>
                    <option value="2rem" className="bg-[#1e1e1e] text-white">Extra Grande (2.00rem)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: LOGOTIPO DE MARCA Y GALERÍA */}
          <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[16px] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-[#87a9ff]" />
                2. Logotipo Corporativo
              </h4>
              <span className="text-[10px] text-[#8c8c8c]">Formatos PNG/SVG recomendados</span>
            </div>

            <div className="flex flex-row overflow-x-auto gap-3 py-1 pr-2 custom-scrollbar">
              {/* Cargar Logo */}
              <label 
                className="relative flex-shrink-0 h-28 w-24 flex flex-col items-center justify-center border border-dashed border-[#444444] hover:border-[#87a9ff] rounded-xl cursor-pointer bg-[#18181a] hover:bg-[#252525] transition group"
              >
                <div className="p-2 bg-[#252525] group-hover:bg-[#87a9ff]/20 rounded-full text-[#87a9ff] transition-transform group-hover:scale-110">
                  <Upload className="h-4 w-4" />
                </div>
                <span className="text-[9px] font-bold text-[#8c8c8c] group-hover:text-white mt-2 uppercase tracking-wider">Subir</span>
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
                        className={`relative flex-shrink-0 h-28 w-24 flex flex-col justify-between items-center bg-[#18181a] border rounded-xl p-1.5 transition-all ${
                          esActivo ? 'border-[#87a9ff] shadow-[0_0_12px_rgba(135,169,255,0.2)]' : 'border-[#2b2b2b] hover:border-[#444444]'
                        }`}
                      >
                        <div className="h-16 w-full flex items-center justify-center p-1 bg-[#121214] rounded-lg overflow-hidden border border-[#262626]">
                          <img src={logo.logo_url} alt={logo.label} className="max-h-full max-w-full object-contain" />
                        </div>

                        <div className="w-full flex items-center justify-around gap-1 mt-1 bg-[#252525] rounded-lg p-1">
                          <button 
                            type="button"
                            onClick={() => { setLogoUrl(logo.logo_url); notifyBrandingChange({ logoUrl: logo.logo_url }); }}
                            title="Usar como logo activo"
                            className={`h-6 w-6 flex-shrink-0 flex items-center justify-center rounded-md border transition cursor-pointer ${
                              esActivo ? 'bg-[#87a9ff] border-[#87a9ff] text-[#121214]' : 'bg-[#18181a] border-[#333333] text-[#8c8c8c] hover:text-white'
                            }`}
                          >
                            <Check className="h-3 w-3 stroke-[3]" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleEliminarLogoHistorial(logo.id)}
                            title="Eliminar logo"
                            className="h-6 w-6 flex-shrink-0 flex items-center justify-center rounded-md border border-[#333333] bg-[#18181a] text-[#8c8c8c] hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
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

          {/* SECCIÓN 3: PROGRAMADOR DE CAMPAÑAS AUTOMÁTICAS */}
          <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[16px] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#87a9ff]" />
                3. Programador de Campañas Automáticas (Scheduler)
              </h4>
              <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border ${
                campanaProgramada ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[#252525] text-[#8c8c8c] border-[#383838]'
              }`}>
                {campanaProgramada ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <p className="text-xs text-[#8c8c8c] leading-relaxed">
              Programa eventos temáticos (Black Friday, Cyber Week) definiendo las fechas de vigencia. La plataforma cambiará los estilos automáticamente.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#d4d4d4] block">Nombre de la Campaña</label>
                <input 
                  type="text" 
                  value={campanaNombre}
                  onChange={(e) => { setCampanaNombre(e.target.value); setTieneCambiosMarca(true); }}
                  placeholder="Ej: Black Week 2026"
                  style={{ color: '#ffffff', backgroundColor: '#18181a', caretColor: '#ffffff' }}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#d4d4d4] block">Esquema Visual Promocional</label>
                <select
                  value={campanaEsquema}
                  onChange={(e) => { setCampanaEsquema(e.target.value); setTieneCambiosMarca(true); }}
                  style={{ color: '#ffffff', backgroundColor: '#18181a' }}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff] cursor-pointer appearance-none"
                >
                  <option value="dark-gold" className="bg-[#1e1e1e] text-white">Dark & Gold (Negro Mate & Dorado)</option>
                  <option value="light" className="bg-[#1e1e1e] text-white">Default Light (Blanco & Púrpura)</option>
                  <option value="warm" className="bg-[#1e1e1e] text-white">Warm Earth (Tonos Cálidos)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#d4d4d4] block">Fecha y Hora de Inicio</label>
                <input 
                  type="datetime-local"
                  value={campanaInicio}
                  onChange={(e) => { setCampanaInicio(e.target.value); setTieneCambiosMarca(true); }}
                  style={{ color: '#ffffff', backgroundColor: '#18181a', colorScheme: 'dark' }}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#d4d4d4] block">Fecha y Hora de Cierre</label>
                <input 
                  type="datetime-local"
                  value={campanaFin}
                  onChange={(e) => { setCampanaFin(e.target.value); setTieneCambiosMarca(true); }}
                  style={{ color: '#ffffff', backgroundColor: '#18181a', colorScheme: 'dark' }}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#2b2b2b]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={campanaProgramada}
                  onChange={(e) => { setCampanaProgramada(e.target.checked); setTieneCambiosMarca(true); }}
                  className="h-4 w-4 rounded border-[#444444] bg-[#18181a] text-[#87a9ff] focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-medium text-[#d4d4d4]">Habilitar conmutación automática</span>
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
                className="px-3 py-1.5 bg-[#252525] hover:bg-[#2e2e2e] text-[#87a9ff] border border-[#383838] rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
              >
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                Probar Tema en Simulador
              </button>
            </div>
          </div>

          {/* SECCIÓN 4: PALETA CROMÁTICA CORPORATIVA */}
          <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[16px] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2b2b2b] pb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Palette className="h-4 w-4 text-[#87a9ff]" />
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
                style={{ color: '#ffffff', backgroundColor: '#18181a' }}
                className="px-3 py-1.5 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none cursor-pointer"
              >
                <option value="light" className="bg-[#1e1e1e] text-white">Default Light</option>
                <option value="dark-gold" className="bg-[#1e1e1e] text-white">Dark & Gold</option>
                <option value="warm" className="bg-[#1e1e1e] text-white">Warm Earth</option>
              </select>
            </div>

            {/* Tarjetas Seleccionadoras de Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Primary Color */}
              <div 
                onClick={() => document.getElementById("master-color-primary")?.click()}
                className="bg-[#18181a] rounded-xl p-3 border border-[#2b2b2b] flex items-center justify-between hover:border-[#444444] transition cursor-pointer group"
              >
                <div>
                  <h5 className="text-xs font-semibold text-white">Color Primario</h5>
                  <p className="text-[10px] text-[#8c8c8c]">Botones y acentos</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#8c8c8c] uppercase">{colorPrimary}</span>
                  <div className="relative w-6 h-6 rounded-full border border-white/20 overflow-hidden shadow-xs" style={{ backgroundColor: colorPrimary }}>
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
                className="bg-[#18181a] rounded-xl p-3 border border-[#2b2b2b] flex items-center justify-between hover:border-[#444444] transition cursor-pointer group"
              >
                <div>
                  <h5 className="text-xs font-semibold text-white">Color Secundario</h5>
                  <p className="text-[10px] text-[#8c8c8c]">Badges y etiquetas</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#8c8c8c] uppercase">{colorSecondary}</span>
                  <div className="relative w-6 h-6 rounded-full border border-white/20 overflow-hidden shadow-xs" style={{ backgroundColor: colorSecondary }}>
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
                className="bg-[#18181a] rounded-xl p-3 border border-[#2b2b2b] flex items-center justify-between hover:border-[#444444] transition cursor-pointer group"
              >
                <div>
                  <h5 className="text-xs font-semibold text-white">Navbar Superior</h5>
                  <p className="text-[10px] text-[#8c8c8c]">Fondo de la barra</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#8c8c8c] uppercase">{colorNavbar}</span>
                  <div className="relative w-6 h-6 rounded-full border border-white/20 overflow-hidden shadow-xs" style={{ backgroundColor: colorNavbar }}>
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
                className="bg-[#18181a] rounded-xl p-3 border border-[#2b2b2b] flex items-center justify-between hover:border-[#444444] transition cursor-pointer group"
              >
                <div>
                  <h5 className="text-xs font-semibold text-white">Fondo General</h5>
                  <p className="text-[10px] text-[#8c8c8c]">Fondo del sitio web</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#8c8c8c] uppercase">{colorBackground}</span>
                  <div className="relative w-6 h-6 rounded-full border border-white/20 overflow-hidden shadow-xs" style={{ backgroundColor: colorBackground }}>
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
                className="bg-[#18181a] rounded-xl p-3 border border-[#2b2b2b] flex items-center justify-between hover:border-[#444444] transition cursor-pointer group"
              >
                <div>
                  <h5 className="text-xs font-semibold text-white">Títulos de Sección</h5>
                  <p className="text-[10px] text-[#8c8c8c]">Texto de módulos</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#8c8c8c] uppercase">{colorSectionTitle}</span>
                  <div className="relative w-6 h-6 rounded-full border border-white/20 overflow-hidden shadow-xs" style={{ backgroundColor: colorSectionTitle }}>
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
                className="bg-[#18181a] rounded-xl p-3 border border-[#2b2b2b] flex items-center justify-between hover:border-[#444444] transition cursor-pointer group"
              >
                <div>
                  <h5 className="text-xs font-semibold text-white">Hipervínculos</h5>
                  <p className="text-[10px] text-[#8c8c8c]">Links y ver más</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#8c8c8c] uppercase">{colorCatalogLink}</span>
                  <div className="relative w-6 h-6 rounded-full border border-white/20 overflow-hidden shadow-xs" style={{ backgroundColor: colorCatalogLink }}>
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
        <div className="lg:col-span-5 lg:sticky lg:top-4 space-y-4">
          <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[16px] p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Monitor className="h-4 w-4 text-[#87a9ff]" />
                Simulador en Tiempo Real
              </h4>

              {/* Selector de Dispositivo */}
              <div className="flex items-center bg-[#18181a] p-1 rounded-lg gap-1 border border-[#333333]">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                    previewDevice === 'desktop' ? 'bg-[#252525] text-[#87a9ff] border border-[#444444]' : 'text-[#8c8c8c] hover:text-white'
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                    previewDevice === 'mobile' ? 'bg-[#252525] text-[#87a9ff] border border-[#444444]' : 'text-[#8c8c8c] hover:text-white'
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* MOCKUP DEL SITIO WEB CON LOS ESTILOS SELECCIONADOS */}
            <div 
              className={`border border-[#2b2b2b] shadow-xl transition-all duration-300 mx-auto overflow-hidden rounded-2xl ${
                previewDevice === 'mobile' ? 'max-w-[260px]' : 'w-full'
              }`}
              style={{ backgroundColor: colorBackground }}
            >
              {/* Header Preview */}
              <div className="p-3 border-b border-white/10 flex items-center justify-between" style={{ backgroundColor: colorNavbar }}>
                <div className="flex items-center gap-2">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-6 w-auto object-contain" />
                  ) : (
                    <span className="h-6 w-6 rounded-lg bg-[#87a9ff] text-[#121214] flex items-center justify-center font-black text-xs">O</span>
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
                  <button className="px-3 py-1 bg-white text-gray-900 text-[10px] font-bold shadow-xs rounded-xl cursor-pointer">
                    Explorar
                  </button>
                </div>

                {/* Mini Product Card Preview */}
                <div className="p-3 bg-white/90 border border-gray-200/50 shadow-xs space-y-2 rounded-2xl">
                  <div className="h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center text-gray-300">
                    <ImageIcon className="h-8 w-8 opacity-40" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold uppercase" style={{ color: colorCatalogLink }}>Ver Catálogo &rarr;</span>
                    <h6 className="text-[11px] font-bold text-gray-800" style={{ color: colorSectionTitle }}>Sillón Sofá Velvet</h6>
                    <span className="text-xs font-black text-gray-900 block">$450.000</span>
                  </div>
                </div>

              </div>

              {/* Footer Preview */}
              <div className="p-3 bg-gray-950 text-gray-400 text-[9px] text-center border-t border-white/5 flex items-center justify-between">
                <span>© 2026 {brandName || 'Objetia'}</span>
                <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-400" /> Seguro</span>
              </div>
            </div>

            <p className="text-[10px] text-[#8c8c8c] text-center font-mono">
              Renderizado reactivo con CSS variables en tiempo real.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
