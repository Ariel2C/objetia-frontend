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
  CheckCircle2,
  LayoutGrid,
  Edit3,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  Tag,
  CreditCard,
  Flame,
  UserCheck
} from 'lucide-react';
import { getApiUrl } from '../../lib/config';
import { useToast } from '../../components/ToastContext';
import type { QuickAccessCard } from '../../lib/types';

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

const ICON_PRESETS = [
  { id: 'login', label: 'Acceso a Cuenta (Usuario)', desc: 'Avatar con destellos y ventana', icon: UserCheck },
  { id: 'bestsellers', label: 'Más Vendidos (Estrella/Bolsa)', desc: 'Bolsa de compras y estrella dorada', icon: Sparkles },
  { id: 'under_30k', label: 'Precios Bajos / $30k (Monedas)', desc: 'Monedas con indicador de rebaja', icon: Tag },
  { id: 'payments', label: 'Medios de Pago (Tarjeta/Billetera)', desc: 'Tarjeta y ondas contactless', icon: CreditCard },
  { id: 'secure_shopping', label: 'Compra Segura (Escudo/Caja)', desc: 'Paquete con escudo de garantía', icon: ShieldCheck },
  { id: 'offers', label: 'En Oferta (%)', desc: 'Insignia de descuento y destellos', icon: Flame },
];

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
  const toast = useToast();

  // Pestaña activa dentro de Personalización: 'tarjetas' | 'secciones'
  const [subTab, setSubTab] = useState<'tarjetas' | 'secciones'>('tarjetas');

  // Estado de Tarjetas Rápidas
  const [quickCardsList, setQuickCardsList] = useState<QuickAccessCard[]>([]);
  const [tieneCambiosTarjetas, setTieneCambiosTarjetas] = useState(false);
  const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);
  const [guardandoTarjetas, setGuardandoTarjetas] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  // Formulario para Crear / Editar Tarjeta
  const [editandoCardId, setEditandoCardId] = useState<number | null>(null);
  const [cardTitle, setCardTitle] = useState('');
  const [cardSubtitle, setCardSubtitle] = useState('');
  const [cardButtonText, setCardButtonText] = useState('');
  const [cardLinkUrl, setCardLinkUrl] = useState('');
  const [cardIconType, setCardIconType] = useState('login');
  const [cardImageUrl, setCardImageUrl] = useState('');

  const getAuthToken = () => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('token') || localStorage.getItem('vamaar_token') || '';
  };

  // Cargar tarjetas de la home desde el backend
  const cargarTarjetas = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${getApiUrl()}/cms/admin/quick-cards`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setQuickCardsList(data);
        }
      }
    } catch (e) {
      console.error("Error al cargar tarjetas de inicio:", e);
    }
  };

  useEffect(() => {
    cargarTarjetas();
  }, []);

  // Auto-cargar secciones si vienen vacías
  useEffect(() => {
    if (!seccionesList || seccionesList.length === 0) {
      const cargarSecciones = async () => {
        try {
          const token = getAuthToken();
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

  // Liberación global de puntero para Drag & Drop
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      setDraggedSectionIndex(null);
      setDraggedCardIndex(null);
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('mouseup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('mouseup', handleGlobalPointerUp);
    };
  }, []);

  // ============================================================================
  // DRAG & DROP PARA TARJETAS RÁPIDAS
  // ============================================================================
  const handleCardPointerDown = (index: number, e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, label, select')) return;
    setDraggedCardIndex(index);
  };

  const handleCardPointerEnter = (targetIndex: number) => {
    if (draggedCardIndex === null || draggedCardIndex === targetIndex) return;

    const items = [...quickCardsList];
    const [draggedItem] = items.splice(draggedCardIndex, 1);
    items.splice(targetIndex, 0, draggedItem);

    setDraggedCardIndex(targetIndex);
    setQuickCardsList(items);
    setTieneCambiosTarjetas(true);
  };

  // Guardar orden y estados de activación de Tarjetas Rápidas
  const handlePublicarTarjetas = async () => {
    setGuardandoTarjetas(true);
    try {
      const token = getAuthToken();
      const payload = {
        cards: quickCardsList.map(c => ({
          id: c.id,
          is_active: c.is_active !== false
        }))
      };

      const res = await fetch(`${getApiUrl()}/cms/admin/quick-cards/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Tarjetas rápidas de la Home actualizadas con éxito.");
        setTieneCambiosTarjetas(false);
      } else {
        toast.error("No se pudieron guardar los cambios de las tarjetas.");
      }
    } catch (e) {
      console.error("Error al guardar tarjetas:", e);
      toast.error("Error al conectar con el servidor.");
    } finally {
      setGuardandoTarjetas(false);
    }
  };

  // Guardar / Editar Tarjeta
  const handleGuardarTarjeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardTitle.trim()) {
      toast.error("El título de la tarjeta es obligatorio.");
      return;
    }

    const token = getAuthToken();
    const payload = {
      title: cardTitle.trim(),
      subtitle: cardSubtitle.trim() || null,
      button_text: cardButtonText.trim() || "Ver más",
      link_url: cardLinkUrl.trim() || "/",
      icon_type: cardIconType || "login",
      image_url: cardImageUrl.trim() || null
    };

    try {
      if (editandoCardId) {
        // Actualizar existente
        const res = await fetch(`${getApiUrl()}/cms/admin/quick-cards/${editandoCardId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          toast.success("Tarjeta actualizada con éxito.");
          limpiarFormularioCard();
          cargarTarjetas();
        } else {
          toast.error("No se pudo actualizar la tarjeta.");
        }
      } else {
        // Crear nueva
        const res = await fetch(`${getApiUrl()}/cms/admin/quick-cards`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ ...payload, orden: quickCardsList.length })
        });

        if (res.ok) {
          toast.success("Tarjeta agregada con éxito.");
          limpiarFormularioCard();
          cargarTarjetas();
        } else {
          toast.error("No se pudo crear la tarjeta.");
        }
      }
    } catch (err) {
      console.error("Error guardando tarjeta:", err);
      toast.error("Error de comunicación con el servidor.");
    }
  };

  const handleCargarEdicion = (card: QuickAccessCard) => {
    setEditandoCardId(card.id);
    setCardTitle(card.title || "");
    setCardSubtitle(card.subtitle || "");
    setCardButtonText(card.button_text || "");
    setCardLinkUrl(card.link_url || "");
    setCardIconType(card.icon_type || "login");
    setCardImageUrl(card.image_url || "");
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const limpiarFormularioCard = () => {
    setEditandoCardId(null);
    setCardTitle('');
    setCardSubtitle('');
    setCardButtonText('');
    setCardLinkUrl('');
    setCardIconType('login');
    setCardImageUrl('');
  };

  const handleEliminarTarjeta = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar esta tarjeta rápida?")) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`${getApiUrl()}/cms/admin/quick-cards/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        toast.success("Tarjeta eliminada con éxito.");
        setQuickCardsList(prev => prev.filter(c => c.id !== id));
        if (editandoCardId === id) limpiarFormularioCard();
      } else {
        toast.error("No se pudo eliminar la tarjeta.");
      }
    } catch (e) {
      console.error("Error al eliminar tarjeta:", e);
      toast.error("Error al conectar con el servidor.");
    }
  };

  const handleSubirImagenCustom = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoImagen(true);
    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${getApiUrl()}/cms/admin/quick-cards/upload-image`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (data.image_url) {
          setCardImageUrl(data.image_url);
          toast.success("Imagen subida con éxito.");
        }
      } else {
        toast.error("No se pudo subir la imagen.");
      }
    } catch (err) {
      console.error("Error subiendo imagen:", err);
      toast.error("Error al procesar la imagen.");
    } finally {
      setSubiendoImagen(false);
    }
  };

  // ============================================================================
  // DRAG & DROP PARA CARRUSELES DE SECCIONES
  // ============================================================================
  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    if (e.button !== 0) return;
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
  const cardsActivasCount = quickCardsList.filter(c => c.is_active !== false).length;

  return (
    <div className="space-y-6 animate-fade-in font-sans text-[#d4d4d4]">
      
      {/* 1. CABECERA & CONTROLES CON SELECTOR DE SUB-PESTAÑAS */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          {/* Selector de Pestañas: Tarjetas Rápidas vs Carruseles */}
          <div className="flex items-center bg-[#252525] p-1 rounded-xl border border-[#333333]">
            <button
              onClick={() => setSubTab('tarjetas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                subTab === 'tarjetas'
                  ? 'bg-[#87a9ff] text-[#121214] shadow-sm'
                  : 'text-[#8c8c8c] hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Tarjetas de Inicio ({quickCardsList.length})</span>
            </button>

            <button
              onClick={() => setSubTab('secciones')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                subTab === 'secciones'
                  ? 'bg-[#87a9ff] text-[#121214] shadow-sm'
                  : 'text-[#8c8c8c] hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Carruseles de Productos ({seccionesList.length})</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252525] border border-[#333333] text-xs text-[#8c8c8c]">
            <Eye className="h-3.5 w-3.5 text-emerald-400" />
            <span>Drag & Drop en vivo</span>
          </div>
        </div>

        {/* Botón Publicar Cambios según subpestaña */}
        {subTab === 'tarjetas' && tieneCambiosTarjetas && (
          <button 
            onClick={handlePublicarTarjetas}
            disabled={guardandoTarjetas}
            className="px-4 py-1.5 bg-[#87a9ff] hover:bg-[#a5b4fc] text-[#121214] rounded-lg text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 animate-pulse"
          >
            <Check className="h-4 w-4 stroke-[2.5]" />
            {guardandoTarjetas ? "Guardando..." : "Publicar Cambios de Tarjetas"}
          </button>
        )}

        {subTab === 'secciones' && tieneCambiosSecciones && (
          <button 
            onClick={handlePublicarSecciones}
            className="px-4 py-1.5 bg-[#87a9ff] hover:bg-[#a5b4fc] text-[#121214] rounded-lg text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 animate-pulse"
          >
            <Check className="h-4 w-4 stroke-[2.5]" />
            Publicar Cambios de Secciones
          </button>
        )}
      </div>

      {/* ==================================================================== */}
      {/* VISTA A: GESTIÓN DE TARJETAS DE ACCESO RÁPIDO (LA NUEVA FUNCIONALIDAD) */}
      {/* ==================================================================== */}
      {subTab === 'tarjetas' && (
        <div className="space-y-6">
          {/* MINI KPIS DE TARJETAS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[14px] p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-[#8c8c8c] block">Tarjetas Creadas</span>
                <div className="text-2xl font-bold text-white mt-0.5">{quickCardsList.length}</div>
              </div>
              <div className="p-2.5 bg-[#252525] text-[#87a9ff] rounded-xl border border-[#383838]">
                <LayoutGrid className="h-4 w-4" />
              </div>
            </div>

            <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[14px] p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-[#8c8c8c] block">Activas en la Home</span>
                <div className="text-2xl font-bold text-emerald-400 mt-0.5">{cardsActivasCount} en vivo</div>
              </div>
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>

            <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[14px] p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-[#8c8c8c] block">Ubicación</span>
                <div className="text-xs font-bold text-white mt-1">1° Lugar (Bajo Banners)</div>
              </div>
              <div className="p-2.5 bg-[#252525] text-amber-400 rounded-xl border border-[#383838]">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* CUERPO PRINCIPAL EN 2 COLUMNAS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Formulario Crear / Editar Tarjeta */}
            <div className="lg:col-span-5 bg-[#1f1f1f] border border-[#2b2b2b] rounded-[16px] p-5 space-y-4 shadow-sm h-fit">
              <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  {editandoCardId ? <Edit3 className="h-4 w-4 text-amber-400" /> : <Plus className="h-4 w-4 text-[#87a9ff]" />}
                  {editandoCardId ? "Editar Tarjeta Rápida" : "Nueva Tarjeta Rápida"}
                </h4>
                {editandoCardId && (
                  <button
                    type="button"
                    onClick={limpiarFormularioCard}
                    className="text-[10px] text-[#8c8c8c] hover:text-white underline cursor-pointer"
                  >
                    Cancelar Edición
                  </button>
                )}
              </div>

              <form onSubmit={handleGuardarTarjeta} className="space-y-3.5">
                {/* Título */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#d4d4d4] block">
                    Título de la Tarjeta
                  </label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ej: Ingresá a Mi Objetia, Más vendidos..." 
                    value={cardTitle} 
                    onChange={(e) => setCardTitle(e.target.value)} 
                    style={{ color: '#ffffff', backgroundColor: '#18181a', caretColor: '#ffffff' }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff] transition" 
                  />
                </div>

                {/* Subtítulo descriptivo */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#d4d4d4] block">
                    Subtítulo o Descripción Breve
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ej: Gestioná tus compras y ventas." 
                    value={cardSubtitle} 
                    onChange={(e) => setCardSubtitle(e.target.value)} 
                    style={{ color: '#ffffff', backgroundColor: '#18181a', caretColor: '#ffffff' }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff] transition" 
                  />
                </div>

                {/* Texto del Botón */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#d4d4d4] block">
                      Texto del Botón
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ej: Ingresar a tu cuenta" 
                      value={cardButtonText} 
                      onChange={(e) => setCardButtonText(e.target.value)} 
                      style={{ color: '#ffffff', backgroundColor: '#18181a', caretColor: '#ffffff' }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff] transition" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#d4d4d4] block">
                      Enlace de Destino (URL)
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ej: /catalog?sort=popular" 
                      value={cardLinkUrl} 
                      onChange={(e) => setCardLinkUrl(e.target.value)} 
                      style={{ color: '#ffffff', backgroundColor: '#18181a', caretColor: '#ffffff' }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff] transition font-mono text-[11px]" 
                    />
                  </div>
                </div>

                {/* Selector de Ilustración Vectorial / Dibujo */}
                <div className="space-y-2 pt-1 border-t border-[#262626]">
                  <label className="text-[11px] font-semibold text-[#87a9ff] block">
                    Dibujo del Medio (Estilo Objetia)
                  </label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {ICON_PRESETS.map((preset) => {
                      const IconComponent = preset.icon;
                      const seleccionado = cardIconType === preset.id && !cardImageUrl;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => { setCardIconType(preset.id); setCardImageUrl(''); }}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                            seleccionado
                              ? 'border-[#87a9ff] bg-[#87a9ff]/10 text-white shadow-xs'
                              : 'border-[#333333] bg-[#18181a] text-[#8c8c8c] hover:border-[#444444] hover:text-[#d4d4d4]'
                          }`}
                        >
                          <IconComponent className={`h-4 w-4 shrink-0 ${seleccionado ? 'text-[#87a9ff]' : 'text-[#8c8c8c]'}`} />
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold block truncate">{preset.label.split('(')[0]}</span>
                            <span className="text-[9px] text-[#666666] block truncate">{preset.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subir Dibujo / Imagen Propia Opcional */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-medium text-[#8c8c8c] block">
                    O subir imagen/dibujo personalizado (Opcional):
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <label className="flex items-center justify-center px-3 py-2 border border-dashed border-[#444444] hover:border-[#87a9ff] rounded-xl bg-[#18181a] cursor-pointer transition text-xs font-semibold text-[#8c8c8c] hover:text-white gap-2">
                      <Upload className="h-3.5 w-3.5 text-[#87a9ff]" />
                      <span>{subiendoImagen ? "Subiendo..." : "Subir Archivo"}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleSubirImagenCustom} 
                        className="hidden" 
                      />
                    </label>

                    {cardImageUrl && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#252525] border border-[#333333] text-[11px]">
                        <span className="text-emerald-400 font-bold">Imagen Asignada</span>
                        <button 
                          type="button" 
                          onClick={() => setCardImageUrl('')}
                          className="text-[#8c8c8c] hover:text-red-400 p-0.5"
                          title="Quitar imagen y usar dibujo vectorial"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botón de Enviar */}
                <button 
                  type="submit" 
                  className="w-full py-2.5 bg-[#87a9ff] hover:bg-[#a5b4fc] text-[#121214] rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-98 mt-2"
                >
                  {editandoCardId ? <Check className="h-4 w-4 stroke-[2.5]" /> : <Plus className="h-4 w-4 stroke-[2.5]" />}
                  {editandoCardId ? "Guardar Cambios de Tarjeta" : "Agregar Tarjeta a la Home"}
                </button>
              </form>
            </div>

            {/* Listado de Tarjetas con Drag & Drop */}
            <div className="lg:col-span-7 bg-[#1f1f1f] border border-[#2b2b2b] rounded-[16px] p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-[#87a9ff]" />
                  Tarjetas Activas en la Home ({quickCardsList.length})
                </h4>
                <span className="text-[10px] text-[#8c8c8c]">Arrastra para cambiar el orden</span>
              </div>

              <div className="space-y-2.5">
                {quickCardsList.length === 0 ? (
                  <div className="py-12 text-center text-[#8c8c8c] text-xs">
                    No hay tarjetas configuradas. Agregá una desde el formulario izquierdo.
                  </div>
                ) : (
                  quickCardsList.map((card, index) => (
                    <div 
                      key={card.id}
                      onPointerDown={(e) => handleCardPointerDown(index, e)}
                      onPointerEnter={() => handleCardPointerEnter(index)}
                      className={`flex items-center justify-between p-3.5 border rounded-xl transition-all duration-150 gap-4 select-none cursor-grab active:cursor-grabbing ${
                        draggedCardIndex === index 
                          ? 'border-[#87a9ff] bg-[#252525] shadow-[0_0_15px_rgba(135,169,255,0.25)] scale-[1.02] z-20' 
                          : editandoCardId === card.id
                            ? 'border-amber-500/50 bg-[#252525]'
                            : 'border-[#2b2b2b] bg-[#18181a] hover:border-[#383838]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="text-[#8c8c8c] hover:text-white">
                          <GripVertical className="h-4 w-4" />
                        </div>

                        {/* Miniatura del dibujo */}
                        <div className="h-10 w-10 rounded-lg bg-[#252525] border border-[#333333] flex items-center justify-center shrink-0 overflow-hidden">
                          {card.image_url ? (
                            <img src={card.image_url} alt="" className="h-full w-full object-contain" />
                          ) : (
                            <Sparkles className="h-4 w-4 text-[#87a9ff]" />
                          )}
                        </div>

                        <div className="leading-tight min-w-0">
                          <h5 className="text-xs font-bold text-white truncate">{card.title}</h5>
                          <span className="text-[10px] text-[#8c8c8c] block truncate">
                            {card.subtitle || "Sin descripción"} &bull; <span className="font-mono text-[9px] text-[#87a9ff]">{card.button_text}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Switch Activa / Inactiva */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={card.is_active !== false}
                          onClick={() => {
                            const items = [...quickCardsList];
                            items[index].is_active = items[index].is_active === false ? true : false;
                            setQuickCardsList(items);
                            setTieneCambiosTarjetas(true);
                          }}
                          className="flex items-center gap-1.5 cursor-pointer select-none"
                        >
                          <span className={`relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                            card.is_active !== false ? 'bg-emerald-500' : 'bg-[#333333]'
                          }`}>
                            <span className={`pointer-events-none h-3 w-3 transform rounded-full bg-white transition duration-200 ease-in-out flex items-center justify-center leading-none ${
                              card.is_active !== false ? 'translate-x-3' : 'translate-x-0'
                            }`} />
                          </span>
                        </button>

                        {/* Botón Editar */}
                        <button 
                          type="button"
                          onClick={() => handleCargarEdicion(card)}
                          className="p-1.5 text-[#8c8c8c] hover:text-[#87a9ff] hover:bg-[#87a9ff]/10 rounded-lg transition cursor-pointer"
                          title="Editar tarjeta"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        {/* Botón Eliminar */}
                        <button 
                          type="button"
                          onClick={() => handleEliminarTarjeta(card.id)} 
                          className="p-1.5 text-[#8c8c8c] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                          title="Eliminar tarjeta"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VISTA B: GESTIÓN DE CARRUSELES DE PRODUCTOS (EXISTENTE)               */}
      {/* ==================================================================== */}
      {subTab === 'secciones' && (
        <div className="space-y-6">
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
      )}

    </div>
  );
}
