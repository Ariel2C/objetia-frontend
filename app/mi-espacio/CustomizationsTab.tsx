"use client";
import React, { useState, useEffect } from 'react';
import { GripVertical, Trash2, Check, X } from 'lucide-react';

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center border-b border-gray-200/50 pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Personalización</h3>
          <p className="text-xs text-gray-500">Configura y ordena los carruseles de productos en la página principal.</p>
        </div>
        {tieneCambiosSecciones && (
          <button 
            onClick={handlePublicarSecciones}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            Publicar Cambios
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulario Nueva Sección */}
        <div className="lg:col-span-5 bg-white border border-gray-200/80 rounded-2xl p-5 space-y-4 shadow-sm h-fit">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-50 pb-2">Crear Nuevo Carrusel</h4>
          <form onSubmit={handleAgregarSeccion} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="nuevoSeccionTitulo" className="text-[10px] font-bold text-gray-500 uppercase">Título de la Sección</label>
              <input id="nuevoSeccionTitulo" name="nuevoSeccionTitulo" type="text" required placeholder="Ej: Destacados de la Semana" value={nuevoSeccionTitulo} onChange={(e) => setNuevoSeccionTitulo(e.target.value)} className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 text-gray-800" />
            </div>
            <div className="space-y-1">
              <label htmlFor="nuevoSeccionCategoria" className="text-[10px] font-bold text-gray-500 uppercase">Filtrar por Categoría</label>
              <select id="nuevoSeccionCategoria" name="nuevoSeccionCategoria" value={nuevoSeccionCategoria} onChange={(e) => setNuevoSeccionCategoria(e.target.value)} className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-white font-semibold cursor-pointer text-gray-800">
                <option value="Todos">Mostrar Todos (Sin Filtro)</option>
                <option value="Sillones">Sillones</option>
                <option value="Iluminación">Iluminación</option>
                <option value="Mesas">Mesas</option>
                <option value="Decoración">Decoración</option>
                <option value="Muebles">Muebles</option>
              </select>
            </div>
            <button type="submit" className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition">Añadir Sección</button>
          </form>
        </div>

        {/* Cola de Secciones */}
        <div className="lg:col-span-7 bg-white border border-gray-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-gray-50 pb-2">Secciones Activas</h4>
          <div className="space-y-3">
            {seccionesList.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">No hay secciones configuradas. Agrega una a la izquierda.</div>
            ) : (
              seccionesList.map((sec, index) => (
                <div 
                  key={sec.id}
                  onPointerDown={(e) => handlePointerDown(index, e)}
                  onPointerEnter={() => handlePointerEnter(index)}
                  className={`flex items-center justify-between p-3 border rounded-xl transition-all duration-150 gap-4 select-none cursor-grab active:cursor-grabbing ${
                    draggedSectionIndex === index 
                      ? 'border-2 border-purple-600 bg-purple-50/90 shadow-lg scale-[1.02] z-20' 
                      : 'border-gray-100 bg-white hover:border-purple-200 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <GripVertical className="h-5 w-5 text-gray-400" />
                    <div className="leading-tight">
                      <h5 className="text-xs font-bold text-gray-800">{sec.title}</h5>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Filtro: {sec.category_filter || 'Todos los Productos'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* TOGGLE WITH ICON PARA ESTADO ACTIVO / INACTIVO */}
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
                      <span className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        sec.is_active !== false ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}>
                        <span className={`pointer-events-none h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out flex items-center justify-center leading-none ${
                          sec.is_active !== false ? 'translate-x-5' : 'translate-x-0'
                        }`}>
                          {sec.is_active !== false ? (
                            <Check className="w-3 h-3 text-emerald-600 stroke-[3] shrink-0" />
                          ) : (
                            <X className="w-3 h-3 text-gray-400 stroke-[3] shrink-0" />
                          )}
                        </span>
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        sec.is_active !== false ? 'text-emerald-700' : 'text-gray-400'
                      }`}>
                        {sec.is_active !== false ? 'Activa' : 'Inactiva'}
                      </span>
                    </button>
                    <button onClick={() => handleEliminarSeccion(sec.id)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer">
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
