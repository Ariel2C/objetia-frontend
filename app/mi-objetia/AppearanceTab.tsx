"use client";
import React from 'react';
import { 
  Sparkles, 
  Check, 
  Upload, 
  Trash2, 
  Image as ImageIcon,
  Info
} from 'lucide-react';

interface AppearanceTabProps {
  tieneCambiosMarca?: boolean;
  setTieneCambiosMarca?: (val: boolean) => void;
  handlePublicarMarca?: () => void;
  brandName?: string;
  setBrandName?: (val: string) => void;
  brandFontFamily?: string;
  setBrandFontFamily?: (val: string) => void;
  brandFontSize?: string;
  setBrandFontSize?: (val: string) => void;
  logoHistory?: any[];
  setLogoHistory?: React.Dispatch<React.SetStateAction<any[]>>;
  logoUrl?: string;
  setLogoUrl?: (val: string) => void;
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
  colorPrimary?: string;
  setColorPrimary?: (val: string) => void;
  colorSecondary?: string;
  setColorSecondary?: (val: string) => void;
  colorBackground?: string;
  setColorBackground?: (val: string) => void;
  colorNavbar?: string;
  setColorNavbar?: (val: string) => void;
  colorSectionTitle?: string;
  setColorSectionTitle?: (val: string) => void;
  colorCatalogLink?: string;
  setColorCatalogLink?: (val: string) => void;
  colorTextInput?: string;
  setColorTextInput?: (val: string) => void;
  handleEliminarLogoHistorial?: (id: number) => void;
  apiUrl?: string;
  [key: string]: any;
}

export default function AppearanceTab({
  tieneCambiosMarca = false,
  setTieneCambiosMarca = () => {},
  handlePublicarMarca = () => {},
  logoHistory = [],
  setLogoHistory = () => {},
  logoUrl = '',
  setLogoUrl = () => {},
  handleEliminarLogoHistorial = () => {}
}: AppearanceTabProps) {

  const notifyBrandingChange = (updates: { logoUrl?: string }) => {
    setTieneCambiosMarca(true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('branding_updated', { detail: updates }));
    }
  };

  // Filtrar duplicados y ordenar por id descendente
  const uniqueLogos: any[] = [];
  const seenUrls = new Set();
  logoHistory.forEach(item => {
    if (item.logo_url && !seenUrls.has(item.logo_url)) {
      seenUrls.add(item.logo_url);
      uniqueLogos.push(item);
    }
  });
  uniqueLogos.sort((a, b) => b.id - a.id);

  return (
    <div className="space-y-6 animate-fade-in font-sans text-[#d4d4d4] max-w-5xl">
      
      {/* CABECERA & CONTROLES */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          {/* Badge de Módulo */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252525] border border-[#333333] text-xs font-medium text-[#d4d4d4]">
            <Sparkles className="h-3.5 w-3.5 text-[#87a9ff]" />
            <span className="text-[#8c8c8c]">Módulo</span>
            <span className="text-white font-semibold">Logotipo Corporativo</span>
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

      {/* SECCIÓN PRINCIPAL: LOGOTIPO CORPORATIVO */}
      <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[16px] p-6 space-y-6">
        
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2b2b2b] pb-4">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-[#87a9ff]" />
              Logotipo Corporativo
            </h4>
            <p className="text-xs text-[#8c8c8c] mt-1">
              Sube y gestiona el logotipo que se mostrará en la barra superior de navegación y en toda la plataforma.
            </p>
          </div>
          <span className="text-[11px] text-[#8c8c8c] bg-[#18181a] px-2.5 py-1 rounded-md border border-[#333333]">
            Formatos recomendados: PNG o SVG transparente
          </span>
        </div>

        {/* LOGO ACTIVO ACTUAL */}
        <div className="bg-[#18181a] border border-[#2b2b2b] rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-20 w-32 flex items-center justify-center p-2 bg-[#121214] rounded-lg border border-[#2e2e32] shadow-inner overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo Activo" className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="text-center">
                  <ImageIcon className="h-6 w-6 text-[#555] mx-auto mb-1" />
                  <span className="text-[10px] text-[#666]">Sin logo activo</span>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Logo Activo</span>
                {logoUrl && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                    En uso
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8c8c8c] mt-1">
                {logoUrl 
                  ? 'Este logotipo está configurado como la imagen oficial de tu marca.' 
                  : 'Aún no has seleccionado un logotipo para tu tienda.'}
              </p>
            </div>
          </div>

          {/* Subir archivo directo */}
          <label 
            className="flex items-center gap-2 px-4 py-2 bg-[#252525] hover:bg-[#303030] text-white border border-[#3a3a3a] hover:border-[#87a9ff] rounded-xl text-xs font-medium cursor-pointer transition shadow-xs"
          >
            <Upload className="h-4 w-4 text-[#87a9ff]" />
            <span>Subir nuevo logo</span>
            <input 
              id="inputUploadLogoDirect"
              name="inputUploadLogoDirect"
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
        </div>

        {/* GALERÍA / HISTORIAL DE LOGOS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider">
              Historial de Logotipos
            </h5>
            <span className="text-[11px] text-[#8c8c8c]">
              {uniqueLogos.length} {uniqueLogos.length === 1 ? 'disponible' : 'disponibles'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {/* Tarjeta para Subir */}
            <label 
              className="h-36 flex flex-col items-center justify-center border border-dashed border-[#444444] hover:border-[#87a9ff] rounded-xl cursor-pointer bg-[#18181a] hover:bg-[#252525] transition group p-3 text-center"
            >
              <div className="p-2.5 bg-[#252525] group-hover:bg-[#87a9ff]/20 rounded-full text-[#87a9ff] transition-transform group-hover:scale-110 mb-2">
                <Upload className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-semibold text-[#8c8c8c] group-hover:text-white">Subir Logotipo</span>
              <span className="text-[9px] text-[#555] mt-1">PNG, SVG o JPG</span>
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

            {/* Listado de Logos */}
            {uniqueLogos.map((logo) => {
              const esActivo = logoUrl === logo.logo_url;
              return (
                <div 
                  key={logo.id}
                  className={`relative h-36 flex flex-col justify-between bg-[#18181a] border rounded-xl p-2.5 transition-all ${
                    esActivo 
                      ? 'border-[#87a9ff] ring-1 ring-[#87a9ff]/40 shadow-[0_0_12px_rgba(135,169,255,0.15)]' 
                      : 'border-[#2b2b2b] hover:border-[#444444]'
                  }`}
                >
                  {/* Badge Activo */}
                  {esActivo && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[8px] font-bold bg-[#87a9ff] text-[#121214] rounded">
                      ACTIVO
                    </span>
                  )}

                  <div className="h-20 w-full flex items-center justify-center p-2 bg-[#121214] rounded-lg overflow-hidden border border-[#262626]">
                    <img src={logo.logo_url} alt={logo.label || "Logo"} className="max-h-full max-w-full object-contain" />
                  </div>

                  <div className="w-full flex items-center gap-1.5 mt-2">
                    <button 
                      type="button"
                      onClick={() => { 
                        setLogoUrl(logo.logo_url); 
                        notifyBrandingChange({ logoUrl: logo.logo_url }); 
                      }}
                      title={esActivo ? "Logo activo" : "Usar como logo activo"}
                      className={`flex-1 py-1 px-2 text-[10px] font-bold rounded-lg border transition cursor-pointer flex items-center justify-center gap-1 ${
                        esActivo 
                          ? 'bg-[#87a9ff] border-[#87a9ff] text-[#121214]' 
                          : 'bg-[#252525] border-[#333333] text-[#8c8c8c] hover:text-white hover:border-[#555]'
                      }`}
                    >
                      <Check className="h-3 w-3 stroke-[3]" />
                      <span>{esActivo ? 'Activo' : 'Elegir'}</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => handleEliminarLogoHistorial(logo.id)}
                      title="Eliminar logo del historial"
                      className="h-7 w-7 flex-shrink-0 flex items-center justify-center rounded-lg border border-[#333333] bg-[#252525] text-[#8c8c8c] hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nota informativa */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#18181a] border border-[#2b2b2b] text-[#8c8c8c] text-xs">
          <Info className="h-4 w-4 text-[#87a9ff] flex-shrink-0 mt-0.5" />
          <span>
            Los cambios se guardan localmente para previsualización inmediata. Haz clic en <strong>Publicar Cambios Globales</strong> en la parte superior para hacerlos permanentes para todos los usuarios.
          </span>
        </div>

      </div>
    </div>
  );
}
