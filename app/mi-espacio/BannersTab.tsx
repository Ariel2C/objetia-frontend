"use client";
import React, { useState, useEffect } from 'react';
import { GripVertical, Trash2, Check, X } from 'lucide-react';

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
  token: string | null;
  apiUrl: string;
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
    // Si el clic fue en un botón, input o checkbox, permitir su acción nativa sin iniciar arrastre
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
        const res = await fetch(`${apiUrl}/cms/banner/${banner.id}`, {
          method: "DELETE",
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('vamaar_token') || token}`
          }
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center border-b border-gray-200/50 pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Banners</h3>
          <p className="text-xs text-gray-500">Administra los banners publicitarios haciendo clic y arrastrando desde cualquier parte de la tarjeta.</p>
        </div>
        {tieneCambiosBanners && (
          <button 
            onClick={handlePublicarBanners}
            disabled={subiendoBanner}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {subiendoBanner ? "Subiendo..." : "Publicar Banners"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulario Añadir Banner */}
        <div className="lg:col-span-5 bg-white border border-gray-200/80 rounded-2xl p-5 space-y-4 shadow-sm h-fit">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-50 pb-2">Crear Nuevo Banner</h4>
          <form onSubmit={handleAgregarBorradorBanner} className="space-y-3.5">
            <div className="space-y-1">
              <label htmlFor="nuevoBannerTitulo" className="text-[10px] font-bold text-gray-500 uppercase">Título Principal</label>
              <input id="nuevoBannerTitulo" name="nuevoBannerTitulo" type="text" required value={nuevoBannerTitulo} onChange={(e) => setNuevoBannerTitulo(e.target.value)} placeholder="Ej: Renová tu living" className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 text-gray-800" />
            </div>
            <div className="space-y-1">
              <label htmlFor="nuevoBannerSubtitulo" className="text-[10px] font-bold text-gray-500 uppercase">Subtítulo Descriptivo</label>
              <input id="nuevoBannerSubtitulo" name="nuevoBannerSubtitulo" type="text" value={nuevoBannerSubtitulo} onChange={(e) => setNuevoBannerSubtitulo(e.target.value)} placeholder="Ej: Sillones premium seleccionados" className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 text-gray-800" />
            </div>
            <div className="space-y-1">
              <label htmlFor="nuevoBannerLink" className="text-[10px] font-bold text-gray-500 uppercase">Dirección de Destino (Link)</label>
              <select id="nuevoBannerLink" name="nuevoBannerLink" value={nuevoBannerLink} onChange={(e) => setNuevoBannerLink(e.target.value)} className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-white text-gray-800">
                <option value="/catalog">Catálogo de Productos</option>
                <option value="/products/favorites">Productos Favoritos</option>
                <option value="otro">URL Personalizada</option>
              </select>
              {nuevoBannerLink === "otro" && (
                <input id="nuevoBannerLinkPersonalizado" name="nuevoBannerLinkPersonalizado" type="text" required value={nuevoBannerLinkPersonalizado} onChange={(e) => setNuevoBannerLinkPersonalizado(e.target.value)} placeholder="Ej: /catalog?category=Mesas" className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 mt-2 text-gray-800" />
              )}
            </div>
            <div className="space-y-2 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Subir Archivos de Imagen</span>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col items-center justify-center p-3 border border-dashed border-gray-300 rounded-xl bg-white cursor-pointer hover:bg-gray-50 transition">
                  <span className="text-[9px] font-bold text-gray-600 text-center">{nuevoBannerArchivo ? nuevoBannerArchivo.name.slice(0, 10) + "..." : "Desktop (1920x432)"}</span>
                  <input type="file" accept="image/*" required={!nuevoBannerArchivo} onChange={(e) => { if (e.target.files) setNuevoBannerArchivo(e.target.files[0]); }} className="hidden" />
                </label>
                <label className="flex flex-col items-center justify-center p-3 border border-dashed border-gray-300 rounded-xl bg-white cursor-pointer hover:bg-gray-50 transition">
                  <span className="text-[9px] font-bold text-gray-600 text-center">{nuevoBannerArchivoMovil ? nuevoBannerArchivoMovil.name.slice(0, 10) + "..." : "Mobile (Opcional 1:1)"}</span>
                  <input type="file" accept="image/*" onChange={(e) => { if (e.target.files) setNuevoBannerArchivoMovil(e.target.files[0]); }} className="hidden" />
                </label>
              </div>
            </div>
            <button type="submit" className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition">Añadir al Borrador</button>
          </form>
        </div>

        {/* Banners Activos */}
        <div className="lg:col-span-7 bg-white border border-gray-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-50 pb-2">Banners Activos</h4>
          <div className="space-y-3">
            {bannerList.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">No hay banners activos. Agrega uno a la izquierda.</div>
            ) : (
              bannerList.map((banner, index) => (
                <div 
                  key={banner.id}
                  onPointerDown={(e) => handlePointerDown(index, e)}
                  onPointerEnter={() => handlePointerEnter(index)}
                  className={`flex items-center justify-between p-3 border rounded-xl transition-all duration-150 gap-4 select-none cursor-grab active:cursor-grabbing ${
                    draggedIndex === index 
                      ? 'border-2 border-purple-600 bg-purple-50/90 shadow-lg scale-[1.02] z-20' 
                      : 'border-gray-100 bg-white hover:border-purple-200 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <GripVertical className="h-5.5 w-5.5 text-gray-400" />
                    <div className="h-10 w-16 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                      <img src={banner.cloudfront_url} alt="" className="h-full w-full object-cover pointer-events-none" />
                    </div>
                    <div className="leading-tight">
                      <h5 className="text-xs font-bold text-gray-800">{banner.title}</h5>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{banner.link_url}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* TOGGLE WITH ICON PARA ESTADO ACTIVO / INACTIVO */}
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
                      <span className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        banner.is_active !== false ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}>
                        <span className={`pointer-events-none h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out flex items-center justify-center leading-none ${
                          banner.is_active !== false ? 'translate-x-5' : 'translate-x-0'
                        }`}>
                          {banner.is_active !== false ? (
                            <Check className="w-3 h-3 text-emerald-600 stroke-[3] shrink-0" />
                          ) : (
                            <X className="w-3 h-3 text-gray-400 stroke-[3] shrink-0" />
                          )}
                        </span>
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        banner.is_active !== false ? 'text-emerald-700' : 'text-gray-400'
                      }`}>
                        {banner.is_active !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </button>
                    <button 
                      onClick={() => handleEliminarBannerClick(banner)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-5.5 w-5.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
