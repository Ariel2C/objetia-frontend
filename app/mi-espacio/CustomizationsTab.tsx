"use client";
import React, { useState, useEffect } from 'react';
import { 
  GripVertical, 
  Trash2, 
  Check, 
  X, 
  Sparkles, 
  Layers, 
  Plus, 
  Eye, 
  Sliders, 
  Filter,
  CheckCircle2
} from 'lucide-react';
import { getApiUrl } from '../../lib/config';

interface CustomizationsTabProps {
  tieneCambiosSecciones: boolean;
  handlePublicarSecciones: () => void;
  nuevoSeccionTitulo: string;
  setNuevoSeccionTitulo: (val: string) => void;
  nuevoSeccionCategoria: string;
  setNuevoSeccionCategoria: (val: string) => void;
  handleAgregarSeccion: (e: React.FormEvent) => void;
  seccionesList: any[];
  setSeccionesList: React.Dispatch<React.SetStateAction<any[]>>;
  setTieneCambiosSecciones: (val: boolean) => void;
  handleEliminarSeccion: (id: number) => void;
}

export default function CustomizationsTab({
  tieneCambiosSecciones,
  handlePublicarSecciones,
  nuevoSeccionTitulo,
  setNuevoSeccionTitulo,
  nuevoSeccionCategoria,
  setNuevoSeccionCategoria,
  handleAgregarSeccion,
  seccionesList,
  setSeccionesList,
  setTieneCambiosSecciones,
  handleEliminarSeccion
}: CustomizationsTabProps) {

  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);

  // Auto-cargar secciones desde el backend si la lista viene vacía
  useEffect(() => {
    if (!seccionesList || seccionesList.length === 0) {
      const cargarSecciones = async () => {
        try {
          const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('vamaar_token') || '') : '';
          const res = await fetch(`${getApiUrl()}/cms/admin/sections`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              setSeccionesList(data);
            }
          }
        } catch (e) {
          console.error("Error al autocargar secciones:", e);
        }
      };
      cargarSecciones();
    }
  }, []);

  // Escuchar la liberación global del puntero para garantizar que el mouse nunca quede bloqueado
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      setDraggedSectionIndex(null);
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
    setDraggedSectionIndex(index);
  };

  const handlePointerEnter = (targetIndex: number) => {
    if (draggedSectionIndex === null || draggedSectionIndex === targetIndex) return;

    const items = [...seccionesList];
    const [draggedItem] = items.splice(draggedSectionIndex, 1);
    items.splice(targetIndex, 0, draggedItem);

    setDraggedSectionIndex(targetIndex);
    setSeccionesList(items);
    setTieneCambiosSecciones(true);
  };

  const activasCount = seccionesList.filter(s => s.is_active !== false).length;

  return (
    <div className="space-y-6 animate-fade-in font-sans text-[#d4d4d4]">
      
      {/* 1. CABECERA & CONTROLES ESTILO GOOGLE AI STUDIO */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          {/* Badge de Proyecto */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252525] border border-[#333333] text-xs font-medium text-[#d4d4d4]">
            <Layers className="h-3.5 w-3.5 text-[#87a9ff]" />
            <span className="text-[#8c8c8c]">Módulo</span>
            <span className="text-white font-semibold">Personalización de Carruseles</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252525] border border-[#333333] text-xs text-[#8c8c8c]">
            <Eye className="h-3.5 w-3.5 text-emerald-400" />
            <span>Reordenamiento Drag & Drop en vivo</span>
          </div>
        </div>

        {/* Botón Publicar Cambios */}
        {tieneCambiosSecciones && (
          <button 
            onClick={handlePublicarSecciones}
            className="px-4 py-1.5 bg-[#87a9ff] hover:bg-[#a5b4fc] text-[#121214] rounded-lg text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 animate-pulse"
          >
            <Check className="h-4 w-4 stroke-[2.5]" />
            Publicar Cambios
          </button>
        )}
      </div>

      {/* 2. MINI KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[14px] p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#8c8c8c] block">Carruseles Creados</span>
            <div className="text-2xl font-bold text-white mt-0.5">{seccionesList.length}</div>
          </div>
          <div className="p-2.5 bg-[#252525] text-[#87a9ff] rounded-xl border border-[#383838]">
            <Layers className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[14px] p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#8c8c8c] block">Activos en la Home</span>
            <div className="text-2xl font-bold text-emerald-400 mt-0.5">{activasCount} en vivo</div>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[14px] p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#8c8c8c] block">Filtros Configurados</span>
            <div className="text-2xl font-bold text-amber-400 mt-0.5">
              {new Set(seccionesList.map(s => s.category_filter || 'Todos')).size} Categorías
            </div>
          </div>
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Filter className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* 3. DISPOSICIÓN PRINCIPAL EN 2 COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Formulario Nueva Sección */}
        <div className="lg:col-span-5 bg-[#1f1f1f] border border-[#2b2b2b] rounded-[16px] p-5 space-y-4 shadow-sm h-fit">
          <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#87a9ff]" />
              Crear Nuevo Carrusel
            </h4>
            <span className="text-[10px] text-[#8c8c8c] font-mono">SECTION_BUILDER</span>
          </div>

          <form onSubmit={handleAgregarSeccion} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="nuevoSeccionTitulo" className="text-xs font-medium text-[#d4d4d4] block">
                Título de la Sección
              </label>
              <input 
                id="nuevoSeccionTitulo" 
                name="nuevoSeccionTitulo" 
                type="text" 
                required 
                placeholder="Ej: Destacados de la Semana" 
                value={nuevoSeccionTitulo} 
                onChange={(e) => setNuevoSeccionTitulo(e.target.value)} 
                style={{ color: '#ffffff', backgroundColor: '#18181a', caretColor: '#ffffff' }}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff] transition" 
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="nuevoSeccionCategoria" className="text-xs font-medium text-[#d4d4d4] block">
                Filtrar por Categoría
              </label>
              <select 
                id="nuevoSeccionCategoria" 
                name="nuevoSeccionCategoria" 
                value={nuevoSeccionCategoria} 
                onChange={(e) => setNuevoSeccionCategoria(e.target.value)} 
                style={{ color: '#ffffff', backgroundColor: '#18181a' }}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff] cursor-pointer appearance-none transition"
              >
                <option value="Todos" className="bg-[#1e1e1e] text-white">Mostrar Todos (Sin Filtro)</option>
                <option value="Sillones" className="bg-[#1e1e1e] text-white">Sillones</option>
                <option value="Iluminación" className="bg-[#1e1e1e] text-white">Iluminación</option>
                <option value="Mesas" className="bg-[#1e1e1e] text-white">Mesas</option>
                <option value="Decoración" className="bg-[#1e1e1e] text-white">Decoración</option>
                <option value="Muebles" className="bg-[#1e1e1e] text-white">Muebles</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="w-full py-2.5 bg-[#87a9ff] hover:bg-[#a5b4fc] text-[#121214] rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-98"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              Añadir Sección
            </button>
          </form>
        </div>

        {/* Cola de Secciones con Drag & Drop */}
        <div className="lg:col-span-7 bg-[#1f1f1f] border border-[#2b2b2b] rounded-[16px] p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#87a9ff]" />
              Secciones Activas ({seccionesList.length})
            </h4>
            <span className="text-[10px] text-[#8c8c8c]">Arrastra para cambiar el orden</span>
          </div>

          <div className="space-y-2.5">
            {seccionesList.length === 0 ? (
              <div className="py-12 text-center text-[#8c8c8c] text-xs">
                No hay secciones configuradas. Agrega una desde el panel izquierdo.
              </div>
            ) : (
              seccionesList.map((sec, index) => (
                <div 
                  key={sec.id}
                  onPointerDown={(e) => handlePointerDown(index, e)}
                  onPointerEnter={() => handlePointerEnter(index)}
                  className={`flex items-center justify-between p-3.5 border rounded-xl transition-all duration-150 gap-4 select-none cursor-grab active:cursor-grabbing ${
                    draggedSectionIndex === index 
                      ? 'border-[#87a9ff] bg-[#252525] shadow-[0_0_15px_rgba(135,169,255,0.25)] scale-[1.02] z-20' 
                      : 'border-[#2b2b2b] bg-[#18181a] hover:border-[#383838]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-[#8c8c8c] hover:text-white">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="leading-tight">
                      <h5 className="text-xs font-bold text-white">{sec.title}</h5>
                      <span className="text-[9px] text-[#8c8c8c] uppercase tracking-wider font-mono">
                        Filtro: {sec.category_filter || 'Todos los Productos'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Switch Toggle Activo / Inactivo */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={sec.is_active !== false}
                      onClick={() => {
                        const items = [...seccionesList];
                        items[index].is_active = items[index].is_active === false ? true : false;
                        setSeccionesList(items);
                        setTieneCambiosSecciones(true);
                      }}
                      className="flex items-center gap-2 cursor-pointer group/toggle select-none"
                    >
                      <span className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        sec.is_active !== false ? 'bg-emerald-500' : 'bg-[#333333]'
                      }`}>
                        <span className={`pointer-events-none h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out flex items-center justify-center leading-none ${
                          sec.is_active !== false ? 'translate-x-4' : 'translate-x-0'
                        }`}>
                          {sec.is_active !== false ? (
                            <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3] shrink-0" />
                          ) : (
                            <X className="w-2.5 h-2.5 text-gray-500 stroke-[3] shrink-0" />
                          )}
                        </span>
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        sec.is_active !== false ? 'text-emerald-400' : 'text-[#8c8c8c]'
                      }`}>
                        {sec.is_active !== false ? 'Activa' : 'Inactiva'}
                      </span>
                    </button>

                    <button 
                      onClick={() => handleEliminarSeccion(sec.id)} 
                      className="p-1.5 text-[#8c8c8c] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                      title="Eliminar sección"
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
    </div>
  );
}
