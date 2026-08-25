"use client";
import React, { useState, useEffect } from 'react';
import { 
  GripVertical, 
  Trash2, 
  Check, 
  X, 
  Edit3, 
  Sparkles, 
  Image as ImageIcon, 
  Plus, 
  Eye, 
  Sliders, 
  Smartphone, 
  Monitor,
  CheckCircle2,
  Upload
} from 'lucide-react';
import { getApiUrl } from '../../lib/config';

interface BannersTabProps {
  tieneCambiosBanners: boolean;
  handlePublicarBanners: () => void;
  subiendoBanner: boolean;
  nuevoBannerTitulo: string;
  setNuevoBannerTitulo: (val: string) => void;
  nuevoBannerSubtitulo: string;
  setNuevoBannerSubtitulo: (val: string) => void;
  nuevoBannerLink: string;
  setNuevoBannerLink: (val: string) => void;
  nuevoBannerLinkPersonalizado: string;
  setNuevoBannerLinkPersonalizado: (val: string) => void;
  nuevoBannerArchivo: File | null;
  setNuevoBannerArchivo: (val: File | null) => void;
  nuevoBannerArchivoMovil: File | null;
  setNuevoBannerArchivoMovil: (val: File | null) => void;
  handleAgregarBorradorBanner: (e: React.FormEvent) => void;
  bannerList: any[];
  setBannerList: React.Dispatch<React.SetStateAction<any[]>>;
  setTieneCambiosBanners: (val: boolean) => void;
  showToast: (mensaje: string, tipo?: 'success' | 'error' | 'info') => void;
  token?: string | null;
  apiUrl?: string;
}

export default function BannersTab({
  tieneCambiosBanners,
  handlePublicarBanners,
  subiendoBanner,
  nuevoBannerTitulo,
  setNuevoBannerTitulo,
  nuevoBannerSubtitulo,
  setNuevoBannerSubtitulo,
  nuevoBannerLink,
  setNuevoBannerLink,
  nuevoBannerLinkPersonalizado,
  setNuevoBannerLinkPersonalizado,
  nuevoBannerArchivo,
  setNuevoBannerArchivo,
  nuevoBannerArchivoMovil,
  setNuevoBannerArchivoMovil,
  handleAgregarBorradorBanner,
  bannerList,
  setBannerList,
  setTieneCambiosBanners,
  showToast,
  token,
  apiUrl
}: BannersTabProps) {

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Modal para edición de Banners existentes
  const [bannerEditando, setBannerEditando] = useState<any | null>(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editSubtitulo, setEditSubtitulo] = useState('');
  const [editLink, setEditLink] = useState('/catalog');
  const [editArchivo, setEditArchivo] = useState<File | null>(null);

  // Auto-cargar banners desde el backend si la lista viene vacía
  useEffect(() => {
    if (!bannerList || bannerList.length === 0) {
      const cargarBanners = async () => {
        try {
          const activeToken = token || (typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('vamaar_token') || '') : '');
          const targetApi = apiUrl || getApiUrl();
          const res = await fetch(`${targetApi}/cms/admin/banners`, {
            headers: activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {}
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              setBannerList(data);
            }
          }
        } catch (e) {
          console.error("Error al autocargar banners:", e);
        }
      };
      cargarBanners();
    }
  }, []);

  const abrirModalEditarBanner = (banner: any) => {
    setBannerEditando(banner);
    setEditTitulo(banner.title || '');
    setEditSubtitulo(banner.subtitle || '');
    setEditLink(banner.link_url || '/catalog');
    setEditArchivo(null);
  };

  const handleGuardarEdicionBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerEditando) return;

    setBannerList(prev => prev.map(item => {
      if (item.id === bannerEditando.id) {
        const updated = {
          ...item,
          title: editTitulo,
          subtitle: editSubtitulo,
          link_url: editLink
        };
        if (editArchivo) {
          updated.file = editArchivo;
          updated.cloudfront_url = URL.createObjectURL(editArchivo);
        }
        return updated;
      }
      return item;
    }));

    setTieneCambiosBanners(true);
    showToast("Edición guardada en borrador. Hacé clic en 'Publicar Banners' para aplicar los cambios en la web.", "info");
    setBannerEditando(null);
  };

  // Escuchar la liberación global del puntero para garantizar que el mouse nunca quede bloqueado
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      setDraggedIndex(null);
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('mouseup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('mouseup', handleGlobalPointerUp);
    };
  }, []);

  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    if (e.button !== 0) return; // Solo clic primario
    const target = e.target as HTMLElement;
    if (target.closest('button, input, label, select')) return;
    setDraggedIndex(index);
  };

  const handlePointerEnter = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const items = [...bannerList];
    const [draggedItem] = items.splice(draggedIndex, 1);
    items.splice(targetIndex, 0, draggedItem);

    setDraggedIndex(targetIndex);
    setBannerList(items);
    setTieneCambiosBanners(true);
  };

  const handleEliminarBannerClick = async (banner: any) => {
    if (banner.file) {
      setBannerList(bannerList.filter(item => item.id !== banner.id));
    } else {
      try {
        const activeToken = token || (typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('vamaar_token') || '') : '');
        const targetApi = apiUrl || getApiUrl();
        const res = await fetch(`${targetApi}/cms/banner/${banner.id}`, {
          method: "DELETE",
          headers: activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {}
        });
        if (res.ok) {
          setBannerList(bannerList.filter(item => item.id !== banner.id));
          showToast("Banner eliminado con éxito.", "success");
        } else {
          showToast("Error al eliminar banner.", "error");
        }
      } catch (e) {
        showToast("Error al conectar con el servidor.", "error");
      }
    }
  };

  const bannersActivosCount = bannerList.filter(b => b.is_active !== false).length;

  return (
    <div className="space-y-6 animate-fade-in font-sans text-[#d4d4d4] pb-12">
      
      {/* 1. CABECERA & CONTROLES ESTILO GOOGLE AI STUDIO */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          {/* Badge de Proyecto */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252525] border border-[#333333] text-xs font-medium text-[#d4d4d4]">
            <ImageIcon className="h-3.5 w-3.5 text-[#87a9ff]" />
            <span className="text-[#8c8c8c]">Módulo</span>
            <span className="text-white font-semibold">Banners de Inicio (Hero)</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252525] border border-[#333333] text-xs text-[#8c8c8c]">
            <Eye className="h-3.5 w-3.5 text-emerald-400" />
            <span>Carrusel interactivo en vivo</span>
          </div>
        </div>

        {/* Botón Publicar Banners */}
        {tieneCambiosBanners && (
          <button 
            onClick={handlePublicarBanners}
            disabled={subiendoBanner}
            className="px-4 py-1.5 bg-[#87a9ff] hover:bg-[#a5b4fc] text-[#121214] rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 animate-pulse"
          >
            <Check className="h-4 w-4 stroke-[2.5]" />
            {subiendoBanner ? "Subiendo..." : "Publicar Banners"}
          </button>
        )}
      </div>

      {/* 2. MINI KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[14px] p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#8c8c8c] block">Banners Creados</span>
            <div className="text-2xl font-bold text-white mt-0.5">{bannerList.length}</div>
          </div>
          <div className="p-2.5 bg-[#252525] text-[#87a9ff] rounded-xl border border-[#383838]">
            <ImageIcon className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[14px] p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#8c8c8c] block">Activos en el Hero</span>
            <div className="text-2xl font-bold text-emerald-400 mt-0.5">{bannersActivosCount} en rotación</div>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[14px] p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#8c8c8c] block">Compatibilidad</span>
            <div className="text-2xl font-bold text-amber-400 mt-0.5">Desktop + Mobile</div>
          </div>
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Smartphone className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* 3. DISPOSICIÓN PRINCIPAL EN 2 COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Formulario Añadir Banner */}
        <div className="lg:col-span-5 bg-[#1f1f1f] border border-[#2b2b2b] rounded-[16px] p-5 space-y-4 shadow-sm h-fit">
          <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#87a9ff]" />
              Crear Nuevo Banner
            </h4>
            <span className="text-[10px] text-[#8c8c8c] font-mono">HERO_BUILDER</span>
          </div>

          <form onSubmit={handleAgregarBorradorBanner} className="space-y-3.5">
            <div className="space-y-1.5">
              <label htmlFor="nuevoBannerTitulo" className="text-xs font-medium text-[#d4d4d4] block">
                Título Principal (Opcional)
              </label>
              <input 
                id="nuevoBannerTitulo" 
                name="nuevoBannerTitulo" 
                type="text" 
                value={nuevoBannerTitulo} 
                onChange={(e) => setNuevoBannerTitulo(e.target.value)} 
                placeholder="Ej: Renová tu living" 
                style={{ color: '#ffffff', backgroundColor: '#18181a', caretColor: '#ffffff' }}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff] transition" 
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="nuevoBannerSubtitulo" className="text-xs font-medium text-[#d4d4d4] block">
                Subtítulo Descriptivo (Opcional)
              </label>
              <input 
                id="nuevoBannerSubtitulo" 
                name="nuevoBannerSubtitulo" 
                type="text" 
                value={nuevoBannerSubtitulo} 
                onChange={(e) => setNuevoBannerSubtitulo(e.target.value)} 
                placeholder="Ej: Sillones premium seleccionados" 
                style={{ color: '#ffffff', backgroundColor: '#18181a', caretColor: '#ffffff' }}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff] transition" 
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="nuevoBannerLink" className="text-xs font-medium text-[#d4d4d4] block">
                Dirección de Destino (Link)
              </label>
              <select 
                id="nuevoBannerLink" 
                name="nuevoBannerLink" 
                value={nuevoBannerLink} 
                onChange={(e) => setNuevoBannerLink(e.target.value)} 
                style={{ color: '#ffffff', backgroundColor: '#18181a' }}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff] cursor-pointer appearance-none transition"
              >
                <option value="/catalog" className="bg-[#1e1e1e] text-white">Catálogo de Productos</option>
                <option value="/products/favorites" className="bg-[#1e1e1e] text-white">Productos Favoritos</option>
                <option value="otro" className="bg-[#1e1e1e] text-white">URL Personalizada</option>
              </select>
              {nuevoBannerLink === "otro" && (
                <input 
                  id="nuevoBannerLinkPersonalizado" 
                  name="nuevoBannerLinkPersonalizado" 
                  type="text" 
                  required 
                  value={nuevoBannerLinkPersonalizado} 
                  onChange={(e) => setNuevoBannerLinkPersonalizado(e.target.value)} 
                  placeholder="Ej: /catalog?category=Mesas" 
                  style={{ color: '#ffffff', backgroundColor: '#18181a', caretColor: '#ffffff' }}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white mt-2 focus:outline-none focus:border-[#87a9ff]" 
                />
              )}
            </div>

            {/* Zona de Subida de Archivos */}
            <div className="space-y-2 border border-[#2b2b2b] rounded-xl p-3 bg-[#18181a]">
              <span className="text-[10px] font-medium text-[#8c8c8c] uppercase tracking-wider block">
                Archivos de Imagen
              </span>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col items-center justify-center p-3 border border-dashed border-[#444444] hover:border-[#87a9ff] rounded-xl bg-[#121214] cursor-pointer transition group">
                  <Upload className="h-4 w-4 text-[#87a9ff] mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold text-[#8c8c8c] group-hover:text-white text-center">
                    {nuevoBannerArchivo ? nuevoBannerArchivo.name.slice(0, 10) + "..." : "Desktop (1920x432)"}
                  </span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    required={!nuevoBannerArchivo} 
                    onChange={(e) => { if (e.target.files) setNuevoBannerArchivo(e.target.files[0]); }} 
                    className="hidden" 
                  />
                </label>

                <label className="flex flex-col items-center justify-center p-3 border border-dashed border-[#444444] hover:border-[#87a9ff] rounded-xl bg-[#121214] cursor-pointer transition group">
                  <Smartphone className="h-4 w-4 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold text-[#8c8c8c] group-hover:text-white text-center">
                    {nuevoBannerArchivoMovil ? nuevoBannerArchivoMovil.name.slice(0, 10) + "..." : "Mobile (1:1 Opcional)"}
                  </span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => { if (e.target.files) setNuevoBannerArchivoMovil(e.target.files[0]); }} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-2.5 bg-[#87a9ff] hover:bg-[#a5b4fc] text-[#121214] rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-98"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              Añadir al Borrador
            </button>
          </form>
        </div>

        {/* Banners Activos con Drag & Drop */}
        <div className="lg:col-span-7 bg-[#1f1f1f] border border-[#2b2b2b] rounded-[16px] p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#87a9ff]" />
              Banners Activos ({bannerList.length})
            </h4>
            <span className="text-[10px] text-[#8c8c8c]">Arrastra para ordenar</span>
          </div>

          <div className="space-y-2.5">
            {bannerList.length === 0 ? (
              <div className="py-12 text-center text-[#8c8c8c] text-xs">
                No hay banners activos. Agregá uno desde el panel izquierdo.
              </div>
            ) : (
              bannerList.map((banner, index) => (
                <div 
                  key={banner.id}
                  onPointerDown={(e) => handlePointerDown(index, e)}
                  onPointerEnter={() => handlePointerEnter(index)}
                  className={`flex items-center justify-between p-3 border rounded-xl transition-all duration-150 gap-3 select-none cursor-grab active:cursor-grabbing ${
                    draggedIndex === index 
                      ? 'border-[#87a9ff] bg-[#252525] shadow-[0_0_15px_rgba(135,169,255,0.25)] scale-[1.02] z-20' 
                      : 'border-[#2b2b2b] bg-[#18181a] hover:border-[#383838]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-[#8c8c8c] hover:text-white">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="h-10 w-16 bg-[#121214] border border-[#262626] rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                      <img 
                        src={
                          (() => {
                            const raw = banner.cloudfront_url || banner.image_url || banner.preview || "";
                            if (!raw || raw === "procesando..." || raw.includes("procesando...")) {
                              return "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=600";
                            }
                            if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) {
                              return raw;
                            }
                            const targetApi = apiUrl || getApiUrl();
                            return `${targetApi}${raw.startsWith("/") ? "" : "/"}${raw}`;
                          })()
                        } 
                        alt="" 
                        className="h-full w-full object-cover pointer-events-none" 
                      />
                    </div>
                    <div className="leading-tight">
                      <h5 className="text-xs font-bold text-white">{banner.title || 'Sin Título (Solo Imagen)'}</h5>
                      <span className="text-[9px] text-[#8c8c8c] uppercase tracking-wider font-mono block truncate max-w-[160px]">
                        {banner.link_url}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Switch Toggle Activo / Inactivo */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={banner.is_active !== false}
                      onClick={() => {
                        const list = [...bannerList];
                        list[index].is_active = list[index].is_active === false ? true : false;
                        setBannerList(list);
                        setTieneCambiosBanners(true);
                      }}
                      className="flex items-center gap-2 cursor-pointer group/toggle select-none"
                    >
                      <span className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        banner.is_active !== false ? 'bg-emerald-500' : 'bg-[#333333]'
                      }`}>
                        <span className={`pointer-events-none h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out flex items-center justify-center leading-none ${
                          banner.is_active !== false ? 'translate-x-4' : 'translate-x-0'
                        }`}>
                          {banner.is_active !== false ? (
                            <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3] shrink-0" />
                          ) : (
                            <X className="w-2.5 h-2.5 text-gray-500 stroke-[3] shrink-0" />
                          )}
                        </span>
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        banner.is_active !== false ? 'text-emerald-400' : 'text-[#8c8c8c]'
                      }`}>
                        {banner.is_active !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </button>

                    {/* Botón Editar */}
                    <button 
                      type="button"
                      onClick={() => abrirModalEditarBanner(banner)}
                      className="p-1.5 text-[#8c8c8c] hover:text-[#87a9ff] hover:bg-[#87a9ff]/10 rounded-lg cursor-pointer transition"
                      title="Editar banner"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    {/* Botón Eliminar */}
                    <button 
                      type="button"
                      onClick={() => handleEliminarBannerClick(banner)}
                      className="p-1.5 text-[#8c8c8c] hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer transition"
                      title="Eliminar banner"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL EMERGENTE PARA EDITAR BANNER OSCURO */}
      {bannerEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 w-full max-w-md space-y-4 shadow-2xl border border-[#333333] text-[#d4d4d4]">
            <div className="flex justify-between items-center border-b border-[#2b2b2b] pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-[#87a9ff]" /> Editar Banner
              </h4>
              <button onClick={() => setBannerEditando(null)} className="p-1 text-[#8c8c8c] hover:text-white rounded-lg cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicionBanner} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-[#8c8c8c] uppercase block">Título Principal (Opcional)</label>
                <input 
                  type="text" 
                  value={editTitulo} 
                  onChange={(e) => setEditTitulo(e.target.value)} 
                  placeholder="Sin título (Dejar vacío para solo imagen)" 
                  style={{ color: '#ffffff', backgroundColor: '#18181a', caretColor: '#ffffff' }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff]" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-[#8c8c8c] uppercase block">Subtítulo Descriptivo (Opcional)</label>
                <input 
                  type="text" 
                  value={editSubtitulo} 
                  onChange={(e) => setEditSubtitulo(e.target.value)} 
                  placeholder="Subtítulo opcional" 
                  style={{ color: '#ffffff', backgroundColor: '#18181a', caretColor: '#ffffff' }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff]" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-[#8c8c8c] uppercase block">Dirección de Destino (Link)</label>
                <input 
                  type="text" 
                  value={editLink} 
                  onChange={(e) => setEditLink(e.target.value)} 
                  placeholder="Ej: /catalog" 
                  style={{ color: '#ffffff', backgroundColor: '#18181a', caretColor: '#ffffff' }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white font-mono focus:outline-none focus:border-[#87a9ff]" 
                />
              </div>

              <div className="space-y-1 border border-[#2b2b2b] rounded-xl p-3 bg-[#18181a]">
                <label className="text-[10px] font-medium text-[#8c8c8c] uppercase block">Reemplazar Imagen (Opcional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => { if (e.target.files) setEditArchivo(e.target.files[0]); }} 
                  className="text-xs text-[#8c8c8c] file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#252525] file:text-[#87a9ff] hover:file:bg-[#2e2e2e] cursor-pointer" 
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#2b2b2b]">
                <button
                  type="button"
                  onClick={() => setBannerEditando(null)}
                  className="px-4 py-2 bg-[#252525] text-[#8c8c8c] hover:text-white rounded-xl text-xs font-medium transition cursor-pointer border border-[#333333]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#87a9ff] hover:bg-[#a5b4fc] text-[#121214] rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
