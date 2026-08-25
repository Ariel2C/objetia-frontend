"use client";
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Zap, 
  Sparkles, 
  Check, 
  Plus, 
  Trash2, 
  Clock, 
  Eye, 
  Palette,
  Tag,
  ArrowRight,
  Sliders,
  AlertCircle,
  Truck,
  CreditCard,
  Layers,
  Image as ImageIcon,
  Megaphone,
  Gift,
  Layout,
  Percent,
  CheckCircle2,
  X,
  Edit3,
  ChevronRight,
  ChevronLeft,
  Database
} from 'lucide-react';

interface Campana360 {
  id: number;
  nombre: string;
  slogan: string;
  inicio: string;
  fin: string;
  esquema: string;
  descuentoPct: number;
  cuotasSinInteres: number;
  envioGratis: boolean;
  envioGratisMinimo: number;
  badgeTexto: string;
  mostrarBarraAnuncios: boolean;
  textoBarraAnuncios: string;
  mostrarModalPromo: boolean;
  codigoCupon: string;
  alcanceCategorias: string;
  bannerUrl: string;
  bannerTitulo: string;
  bannerCta: string;
  activa: boolean;
  descripcion: string;
}

function CampaignCountdownBadge({ finISO, inicioISO, activa }: { finISO: string; inicioISO: string; activa: boolean }) {
  const [tiempoTexto, setTiempoTexto] = useState('');

  useEffect(() => {
    const calcular = () => {
      const now = Date.now();
      const start = new Date(inicioISO).getTime();
      const end = new Date(finISO).getTime();

      if (!activa) {
        setTiempoTexto('Campaña Desactivada');
        return;
      }

      if (now < start) {
        const diff = start - now;
        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        setTiempoTexto(`Comienza en ${dias}d ${horas}h`);
      } else if (now >= start && now <= end) {
        const diff = end - now;
        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diff % (1000 * 60)) / 1000);
        if (dias > 0) {
          setTiempoTexto(`Quedan ${dias}d ${horas}h ${minutos}m`);
        } else {
          setTiempoTexto(`Termina en ${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`);
        }
      } else {
        setTiempoTexto('Campaña Finalizada');
      }
    };

    calcular();
    const interval = setInterval(calcular, 1000);
    return () => clearInterval(interval);
  }, [finISO, inicioISO, activa]);

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-[#251e15] text-amber-300 border border-amber-900/60 rounded-xl text-xs font-mono font-bold shadow-2xs">
      <Clock className="h-3.5 w-3.5 text-amber-400 animate-pulse shrink-0" />
      <span>{tiempoTexto}</span>
    </div>
  );
}

interface CampaignsTabProps {
  apiUrl?: string;
  token?: string | null;
}

export default function CampaignsTab({ apiUrl, token }: CampaignsTabProps) {
  const [campanas, setCampanas] = useState<Campana360[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('objetia_all_campaigns');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error("Error al cargar campañas desde localStorage:", e);
      }
    }
    return [
      {
        id: 1,
        nombre: "Black Friday 2026",
        slogan: "Venta Nocturna Especial con hasta 40% OFF",
        inicio: "2026-11-20T00:00",
        fin: "2026-11-27T23:59",
        esquema: "dark-gold",
        descuentoPct: 35,
        cuotasSinInteres: 6,
        envioGratis: true,
        envioGratisMinimo: 80000,
        badgeTexto: "BLACK FRIDAY",
        mostrarBarraAnuncios: true,
        textoBarraAnuncios: "🔥 BLACK FRIDAY: Hasta 40% OFF + 6 Cuotas Sin Interés + Envíos Gratis",
        mostrarModalPromo: true,
        codigoCupon: "BLACK35OFF",
        alcanceCategorias: "todas",
        bannerUrl: "/objetia_logo.png",
        bannerTitulo: "Colección Híbrida Black Friday",
        bannerCta: "Ver Ofertas Exclusivas",
        activa: true,
        descripcion: "Campaña global de fin de año con estética Dark & Gold, 6 cuotas sin interés y envíos bonificados."
      },
      {
        id: 2,
        nombre: "Cyber Week Tech & Deco",
        slogan: "Semana de tecnología en iluminación y mobiliario",
        inicio: "2026-12-01T00:00",
        fin: "2026-12-07T23:59",
        esquema: "cyber-blue",
        descuentoPct: 25,
        cuotasSinInteres: 3,
        envioGratis: true,
        envioGratisMinimo: 100000,
        badgeTexto: "CYBER DEAL",
        mostrarBarraAnuncios: true,
        textoBarraAnuncios: "⚡ CYBER WEEK: 25% OFF en Iluminación y Muebles Inteligentes",
        mostrarModalPromo: false,
        codigoCupon: "CYBER25",
        alcanceCategorias: "iluminacion",
        bannerUrl: "/objetia_logo.png",
        bannerTitulo: "Cyber Decoración 2026",
        bannerCta: "Explorar Iluminación",
        activa: false,
        descripcion: "Descuentos focalizados en iluminación de autor y mobiliario moderno."
      }
    ];
  });

  const [guardandoBD, setGuardandoBD] = useState(false);

  // Sincronización global y persistencia en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('objetia_all_campaigns', JSON.stringify(campanas));
      } catch (e) {
        console.error("Error al guardar campañas en localStorage:", e);
      }

      const now = Date.now();
      const activa = campanas.find(c => {
        if (!c.activa) return false;
        const start = new Date(c.inicio).getTime();
        const end = new Date(c.fin).getTime();
        return now >= start && now <= end;
      });

      if (activa) {
        localStorage.setItem('objetia_active_campaign', JSON.stringify(activa));
        window.dispatchEvent(new CustomEvent('objetia_campaign_changed', { detail: activa }));
        
        if (activa.esquema === "dark-gold") {
          document.body.style.setProperty('--color-primary', '#111827');
          document.body.style.setProperty('--color-secondary', '#D4AF37');
          document.body.style.setProperty('--bg-marketplace', '#111827');
          document.body.style.setProperty('--bg-navbar', '#1F2937');
          document.body.style.setProperty('--color-section-title', '#FFFFFF');
          document.body.style.setProperty('--color-catalog-link', '#D4AF37');
        } else if (activa.esquema === "cyber-blue") {
          document.body.style.setProperty('--color-primary', '#0F172A');
          document.body.style.setProperty('--color-secondary', '#06B6D4');
          document.body.style.setProperty('--bg-marketplace', '#0F172A');
          document.body.style.setProperty('--bg-navbar', '#1E293B');
          document.body.style.setProperty('--color-section-title', '#F8FAFC');
          document.body.style.setProperty('--color-catalog-link', '#38BDF8');
        } else {
          document.body.style.setProperty('--color-primary', '#4F46E5');
          document.body.style.setProperty('--color-secondary', '#F59E0B');
          document.body.style.setProperty('--bg-marketplace', '#FAFAFA');
          document.body.style.setProperty('--bg-navbar', '#FFFFFF');
          document.body.style.setProperty('--color-section-title', '#111827');
          document.body.style.setProperty('--color-catalog-link', '#3B82F6');
        }
      } else {
        localStorage.removeItem('objetia_active_campaign');
        window.dispatchEvent(new CustomEvent('objetia_campaign_changed', { detail: null }));
      }
    }
  }, [campanas]);

  // Función para sincronizar con la base de datos central PostgreSQL
  const guardarEnBaseDeDatos = async () => {
    setGuardandoBD(true);
    try {
      const activeToken = token || localStorage.getItem('vamaar_token');
      const targetApiUrl = apiUrl || (typeof window !== 'undefined' ? window.location.origin : '');

      if (activeToken && targetApiUrl) {
        const activa = campanas.find(c => c.activa);
        await fetch(`${targetApiUrl}/cms/branding`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${activeToken}`
          },
          body: JSON.stringify({
            brand_name: "Objetia",
            primary_color: activa?.esquema === 'dark-gold' ? '#111827' : '#4F46E5',
            secondary_color: activa?.esquema === 'dark-gold' ? '#D4AF37' : '#F59E0B',
            background_color: activa?.esquema === 'dark-gold' ? '#111827' : '#FAFAFA',
            navbar_color: activa?.esquema === 'dark-gold' ? '#1F2937' : '#FFFFFF',
            section_title_color: activa?.esquema === 'dark-gold' ? '#FFFFFF' : '#111827',
            catalog_link_color: activa?.esquema === 'dark-gold' ? '#D4AF37' : '#3B82F6'
          })
        });
      }
    } catch (err) {
      console.error("Sincronización BD:", err);
    } finally {
      setGuardandoBD(false);
    }
  };

  // Modal 360 Configurator States
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pasoWizard, setPasoWizard] = useState<'general' | 'fechas' | 'estetica' | 'comercial' | 'medios'>('general');
  const [campanaEditandoId, setCampanaEditandoId] = useState<number | null>(null);

  // Form State
  const [formNombre, setFormNombre] = useState('');
  const [formSlogan, setFormSlogan] = useState('');
  const [formInicio, setFormInicio] = useState('');
  const [formFin, setFormFin] = useState('');
  const [formEsquema, setFormEsquema] = useState('dark-gold');
  const [formDescuento, setFormDescuento] = useState(20);
  const [formCuotas, setFormCuotas] = useState(3);
  const [formEnvioGratis, setFormEnvioGratis] = useState(true);
  const [formEnvioMinimo, setFormEnvioMinimo] = useState(75000);
  const [formBadgeTexto, setFormBadgeTexto] = useState('OFERTA ESPECIAL');
  const [formBarraAnuncios, setFormBarraAnuncios] = useState(true);
  const [formTextoBarra, setFormTextoBarra] = useState('🔥 Venta Especial: Descuentos y Cuotas Sin Interés');
  const [formModalPromo, setFormModalPromo] = useState(true);
  const [formCodigoCupon, setFormCodigoCupon] = useState('OBJETIA20');
  const [formCategorias, setFormCategorias] = useState('todas');
  const [formBannerTitulo, setFormBannerTitulo] = useState('Colección Exclusiva');
  const [formBannerCta, setFormBannerCta] = useState('Comprar Ahora');
  const [formDescripcion, setFormDescripcion] = useState('');

  const abrirModalCrear = () => {
    setCampanaEditandoId(null);
    setFormNombre('');
    setFormSlogan('');
    setFormInicio('2026-11-20T00:00');
    setFormFin('2026-11-27T23:59');
    setFormEsquema('dark-gold');
    setFormDescuento(30);
    setFormCuotas(6);
    setFormEnvioGratis(true);
    setFormEnvioMinimo(80000);
    setFormBadgeTexto('PROMO EXCLUSIVA');
    setFormBarraAnuncios(true);
    setFormTextoBarra('🔥 Evento Promocional: Hasta 30% OFF + 6 Cuotas Sin Interés');
    setFormModalPromo(true);
    setFormCodigoCupon('OBJETIA30');
    setFormCategorias('todas');
    setFormBannerTitulo('Colección Promocional');
    setFormBannerCta('Explorar Catálogo');
    setFormDescripcion('Campaña completa de ventas integradas.');
    setPasoWizard('general');
    setModalAbierto(true);
  };

  const abrirModalEditar = (c: Campana360) => {
    setCampanaEditandoId(c.id);
    setFormNombre(c.nombre);
    setFormSlogan(c.slogan);
    setFormInicio(c.inicio);
    setFormFin(c.fin);
    setFormEsquema(c.esquema);
    setFormDescuento(c.descuentoPct);
    setFormCuotas(c.cuotasSinInteres);
    setFormEnvioGratis(c.envioGratis);
    setFormEnvioMinimo(c.envioGratisMinimo);
    setFormBadgeTexto(c.badgeTexto);
    setFormBarraAnuncios(c.mostrarBarraAnuncios);
    setFormTextoBarra(c.textoBarraAnuncios);
    setFormModalPromo(c.mostrarModalPromo);
    setFormCodigoCupon(c.codigoCupon);
    setFormCategorias(c.alcanceCategorias);
    setFormBannerTitulo(c.bannerTitulo);
    setFormBannerCta(c.bannerCta);
    setFormDescripcion(c.descripcion);
    setPasoWizard('general');
    setModalAbierto(true);
  };

  const handleGuardarCampana = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre || !formInicio || !formFin) return;

    if (campanaEditandoId !== null) {
      setCampanas(prev => prev.map(c => c.id === campanaEditandoId ? {
        ...c,
        nombre: formNombre,
        slogan: formSlogan,
        inicio: formInicio,
        fin: formFin,
        esquema: formEsquema,
        descuentoPct: Number(formDescuento),
        cuotasSinInteres: Number(formCuotas),
        envioGratis: formEnvioGratis,
        envioGratisMinimo: Number(formEnvioMinimo),
        badgeTexto: formBadgeTexto,
        mostrarBarraAnuncios: formBarraAnuncios,
        textoBarraAnuncios: formTextoBarra,
        mostrarModalPromo: formModalPromo,
        codigoCupon: formCodigoCupon,
        alcanceCategorias: formCategorias,
        bannerTitulo: formBannerTitulo,
        bannerCta: formBannerCta,
        descripcion: formDescripcion
      } : c));
    } else {
      const nueva: Campana360 = {
        id: Date.now(),
        nombre: formNombre,
        slogan: formSlogan,
        inicio: formInicio,
        fin: formFin,
        esquema: formEsquema,
        descuentoPct: Number(formDescuento),
        cuotasSinInteres: Number(formCuotas),
        envioGratis: formEnvioGratis,
        envioGratisMinimo: Number(formEnvioMinimo),
        badgeTexto: formBadgeTexto,
        mostrarBarraAnuncios: formBarraAnuncios,
        textoBarraAnuncios: formTextoBarra,
        mostrarModalPromo: formModalPromo,
        codigoCupon: formCodigoCupon,
        alcanceCategorias: formCategorias,
        bannerUrl: "/objetia_logo.png",
        bannerTitulo: formBannerTitulo,
        bannerCta: formBannerCta,
        activa: true,
        descripcion: formDescripcion || "Campaña 360° programada."
      };
      setCampanas([nueva, ...campanas]);
    }
    guardarEnBaseDeDatos();
    setModalAbierto(false);
  };

  const handleEliminarCampana = (id: number) => {
    setCampanas(prev => prev.filter(c => c.id !== id));
  };

  const toggleCampanaActiva = (id: number) => {
    setCampanas(prev => prev.map(c => c.id === id ? { ...c, activa: !c.activa } : c));
  };

  const getStatusBadge = (campana: Campana360) => {
    if (!campana.activa) {
      return <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-[#252525] text-[#8c8c8c] border border-[#383838]">Pausada</span>;
    }
    const now = new Date();
    const start = new Date(campana.inicio);
    const end = new Date(campana.fin);

    if (now >= start && now <= end) {
      return <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">En Vivo Ahora</span>;
    } else if (now < start) {
      return <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-[#87a9ff]/10 text-[#87a9ff] border border-[#87a9ff]/20">Programada</span>;
    } else {
      return <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-[#252525] text-[#666666] border border-[#333333]">Finalizada</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans text-[#d4d4d4]">
      
      {/* 1. CABECERA & ACCIONES ESTILO GOOGLE AI STUDIO */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          {/* Badge de Módulo */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252525] border border-[#333333] text-xs font-medium text-[#d4d4d4]">
            <Calendar className="h-3.5 w-3.5 text-[#87a9ff]" />
            <span className="text-[#8c8c8c]">Módulo</span>
            <span className="text-white font-semibold">Campañas y Eventos 360°</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252525] border border-[#333333] text-xs text-[#8c8c8c]">
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            <span>Sincronizado con PostgreSQL</span>
          </div>
        </div>

        {/* Botón Crear Campaña */}
        <button 
          onClick={abrirModalCrear}
          className="px-4 py-1.5 bg-[#87a9ff] hover:bg-[#a5b4fc] text-[#121214] rounded-lg text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          Crear Campaña 360°
        </button>
      </div>

      {/* 2. MÉTRICAS KPI ESTILO GOOGLE AI STUDIO */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        {/* KPI 1: Activas */}
        <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[14px] p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#8c8c8c] block">Campañas Activas</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {campanas.filter(c => c.activa).length} En Vivo
            </div>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Zap className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 2: Cuotas */}
        <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[14px] p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#8c8c8c] block">Financiación Máxima</span>
            <div className="text-2xl font-bold text-white mt-1">
              Hasta 6 Cuotas
            </div>
          </div>
          <div className="p-2.5 bg-[#87a9ff]/10 text-[#87a9ff] rounded-xl border border-[#87a9ff]/20">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 3: Envío Gratis */}
        <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[14px] p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#8c8c8c] block">Beneficio de Envío</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">
              Bonificado
            </div>
          </div>
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Truck className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 4: Base de Datos */}
        <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-[14px] p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#8c8c8c] block">Persistencia Central</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
              <Database className="h-5 w-5" /> PostgreSQL
            </div>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* 3. LISTADO DE CAMPAÑAS 360° */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Campañas y Eventos Programados
          </h4>
          <span className="text-xs text-[#8c8c8c]">{campanas.length} eventos configurados</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {campanas.map((c) => (
            <div 
              key={c.id} 
              className={`bg-[#1f1f1f] border rounded-[16px] p-5 transition-all space-y-4 ${
                c.activa ? 'border-[#383838] shadow-[0_4px_20px_rgba(0,0,0,0.3)]' : 'border-[#262626] opacity-75'
              }`}
            >
              {/* Encabezado de Tarjeta */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#2b2b2b] pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h5 className="text-base font-bold text-white">{c.nombre}</h5>
                    {getStatusBadge(c)}
                    <span className="px-2.5 py-0.5 text-[10px] font-bold text-[#87a9ff] bg-[#87a9ff]/10 rounded-full border border-[#87a9ff]/20">
                      {c.descuentoPct}% OFF GLOBAL
                    </span>
                    <CampaignCountdownBadge finISO={c.fin} inicioISO={c.inicio} activa={c.activa} />
                  </div>
                  <p className="text-xs text-[#8c8c8c]">{c.slogan}</p>
                </div>

                {/* Botones de Acción */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => abrirModalEditar(c)}
                    className="px-3 py-1.5 bg-[#252525] hover:bg-[#2e2e2e] text-[#87a9ff] rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 border border-[#383838]"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-[#87a9ff]" /> Editar 360°
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCampanaActiva(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                      c.activa ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' : 'bg-[#252525] text-[#8c8c8c] border-[#383838] hover:bg-[#2e2e2e]'
                    }`}
                  >
                    {c.activa ? 'Habilitada' : 'Pausada'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEliminarCampana(c.id)}
                    className="p-1.5 text-[#8c8c8c] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                    title="Eliminar campaña"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Grid de Especificaciones 360° */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                
                {/* Bloque 1: Fechas */}
                <div className="bg-[#18181a] p-3 rounded-xl border border-[#262626] space-y-1">
                  <span className="text-[10px] font-medium text-[#8c8c8c] uppercase tracking-wider flex items-center gap-1">
                    <Clock className="h-3 w-3 text-[#87a9ff]" /> Cronograma
                  </span>
                  <p className="font-mono font-semibold text-white text-[11px]">
                    Del {new Date(c.inicio).toLocaleDateString()} al {new Date(c.fin).toLocaleDateString()}
                  </p>
                </div>

                {/* Bloque 2: Financiación */}
                <div className="bg-[#18181a] p-3 rounded-xl border border-[#262626] space-y-1">
                  <span className="text-[10px] font-medium text-[#8c8c8c] uppercase tracking-wider flex items-center gap-1">
                    <CreditCard className="h-3 w-3 text-emerald-400" /> Financiación & Envío
                  </span>
                  <p className="font-semibold text-emerald-400 text-[11px]">
                    {c.cuotasSinInteres} Cuotas Sin Interés {c.envioGratis && '• Envío Gratis'}
                  </p>
                </div>

                {/* Bloque 3: Estética y Badge */}
                <div className="bg-[#18181a] p-3 rounded-xl border border-[#262626] space-y-1">
                  <span className="text-[10px] font-medium text-[#8c8c8c] uppercase tracking-wider flex items-center gap-1">
                    <Tag className="h-3 w-3 text-amber-400" /> Badge Promocional
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-amber-400 text-[#121214] inline-block font-mono">
                    {c.badgeTexto}
                  </span>
                </div>

                {/* Bloque 4: Cupón & Captura */}
                <div className="bg-[#18181a] p-3 rounded-xl border border-[#262626] space-y-1">
                  <span className="text-[10px] font-medium text-[#8c8c8c] uppercase tracking-wider flex items-center gap-1">
                    <Gift className="h-3 w-3 text-indigo-400" /> Cupón de Regalo
                  </span>
                  <p className="font-mono font-bold text-white text-[11px]">
                    {c.codigoCupon}
                  </p>
                </div>

                {/* Bloque 5: Banner Promocional de Campaña */}
                <div className="bg-[#18181a] border border-[#2b2b2b] text-white p-3.5 rounded-xl flex items-center justify-between col-span-1 sm:col-span-2 md:col-span-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#252525] rounded-lg text-amber-400">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[8px] font-bold uppercase text-amber-400 tracking-widest block">Banner Promocional</span>
                      <h6 className="text-xs font-semibold">{c.bannerTitulo || 'Banner Hero Promocional'}</h6>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-[#252525] text-[#87a9ff] border border-[#383838] text-[10px] font-bold rounded-lg">
                    {c.bannerCta || 'Ver Ofertas'}
                  </span>
                </div>

              </div>

              {/* Barra de Aviso Integrada */}
              {c.mostrarBarraAnuncios && (
                <div className="bg-[#252525] border border-[#333333] text-[#d4d4d4] text-[11px] font-medium py-2 px-4 rounded-xl flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{c.textoBarraAnuncios}</span>
                </div>
              )}

            </div>
          ))}
        </div>
      </div>

      {/* 4. WIZARD MODAL 360° OSCURO ESTILO GOOGLE AI STUDIO */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 sm:p-7 w-full max-w-2xl space-y-6 shadow-2xl border border-[#333333] max-h-[90vh] overflow-y-auto custom-scrollbar text-[#d4d4d4]">
            
            {/* Header del Wizard */}
            <div className="flex justify-between items-center border-b border-[#2b2b2b] pb-4">
              <div>
                <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#87a9ff]" /> 
                  {campanaEditandoId ? 'Editar Campaña 360°' : 'Configurador de Campaña 360°'}
                </h4>
                <p className="text-xs text-[#8c8c8c] mt-0.5">Define todas las dimensiones comerciales y estéticas del evento.</p>
              </div>
              <button onClick={() => setModalAbierto(false)} className="p-1 text-[#8c8c8c] hover:text-white rounded-lg cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Pestañas del Wizard (Navegación Interna) */}
            <div className="flex border-b border-[#2b2b2b] overflow-x-auto gap-2 pb-2 custom-scrollbar">
              <button
                type="button"
                onClick={() => setPasoWizard('general')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  pasoWizard === 'general' ? 'bg-[#87a9ff] text-[#121214] font-bold' : 'bg-[#18181a] text-[#8c8c8c] hover:text-white border border-[#333333]'
                }`}
              >
                1. General
              </button>
              <button
                type="button"
                onClick={() => setPasoWizard('fechas')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  pasoWizard === 'fechas' ? 'bg-[#87a9ff] text-[#121214] font-bold' : 'bg-[#18181a] text-[#8c8c8c] hover:text-white border border-[#333333]'
                }`}
              >
                2. Fechas & Reloj
              </button>
              <button
                type="button"
                onClick={() => setPasoWizard('estetica')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  pasoWizard === 'estetica' ? 'bg-[#87a9ff] text-[#121214] font-bold' : 'bg-[#18181a] text-[#8c8c8c] hover:text-white border border-[#333333]'
                }`}
              >
                3. Estética & Badge
              </button>
              <button
                type="button"
                onClick={() => setPasoWizard('comercial')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  pasoWizard === 'comercial' ? 'bg-[#87a9ff] text-[#121214] font-bold' : 'bg-[#18181a] text-[#8c8c8c] hover:text-white border border-[#333333]'
                }`}
              >
                4. Precios & Cuotas
              </button>
              <button
                type="button"
                onClick={() => setPasoWizard('medios')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  pasoWizard === 'medios' ? 'bg-[#87a9ff] text-[#121214] font-bold' : 'bg-[#18181a] text-[#8c8c8c] hover:text-white border border-[#333333]'
                }`}
              >
                5. Anuncios & Banner
              </button>
            </div>

            <form onSubmit={handleGuardarCampana} className="space-y-5">
              
              {/* PASO 1: GENERAL */}
              {pasoWizard === 'general' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#d4d4d4] block">Nombre de la Campaña</label>
                    <input 
                      type="text"
                      required
                      value={formNombre}
                      onChange={(e) => setFormNombre(e.target.value)}
                      placeholder="Ej: Black Friday 2026"
                      style={{ color: '#ffffff', backgroundColor: '#18181a', caretColor: '#ffffff' }}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#d4d4d4] block">Eslogan o Frase Promocional</label>
                    <input 
                      type="text"
                      value={formSlogan}
                      onChange={(e) => setFormSlogan(e.target.value)}
                      placeholder="Ej: Hasta 40% OFF + 6 Cuotas Sin Interés"
                      style={{ color: '#ffffff', backgroundColor: '#18181a', caretColor: '#ffffff' }}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#d4d4d4] block">Descripción Interna</label>
                    <textarea 
                      rows={3}
                      value={formDescripcion}
                      onChange={(e) => setFormDescripcion(e.target.value)}
                      placeholder="Detalles estratégicos sobre envíos bonificados o productos participantes..."
                      style={{ color: '#ffffff', backgroundColor: '#18181a', caretColor: '#ffffff' }}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff]"
                    />
                  </div>
                </div>
              )}

              {/* PASO 2: FECHAS Y RELOJ */}
              {pasoWizard === 'fechas' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#d4d4d4] block">Fecha y Hora de Inicio</label>
                      <input 
                        type="datetime-local"
                        required
                        value={formInicio}
                        onChange={(e) => setFormInicio(e.target.value)}
                        style={{ color: '#ffffff', backgroundColor: '#18181a', colorScheme: 'dark' }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#d4d4d4] block">Fecha y Hora de Cierre</label>
                      <input 
                        type="datetime-local"
                        required
                        value={formFin}
                        onChange={(e) => setFormFin(e.target.value)}
                        style={{ color: '#ffffff', backgroundColor: '#18181a', colorScheme: 'dark' }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#18181a] rounded-xl border border-[#2b2b2b] space-y-1.5">
                    <h5 className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-[#87a9ff]" /> Reloj Regresivo Automático
                    </h5>
                    <p className="text-xs text-[#8c8c8c]">
                      Durante el rango horario establecido, la plataforma desplegará automáticamente el reloj de cuenta regresiva en vivo sobre la barra superior.
                    </p>
                  </div>
                </div>
              )}

              {/* PASO 3: ESTÉTICA Y BADGES */}
              {pasoWizard === 'estetica' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#d4d4d4] block">Esquema Cromático Promocional</label>
                    <select
                      value={formEsquema}
                      onChange={(e) => setFormEsquema(e.target.value)}
                      style={{ color: '#ffffff', backgroundColor: '#18181a' }}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff] cursor-pointer"
                    >
                      <option value="dark-gold" className="bg-[#1e1e1e] text-white">Dark & Gold (Negro Mate & Dorado Premium)</option>
                      <option value="cyber-blue" className="bg-[#1e1e1e] text-white">Cyber Blue (Azul Eléctrico & Neón)</option>
                      <option value="warm-earth" className="bg-[#1e1e1e] text-white">Warm Earth (Tonos Cálidos & Madera)</option>
                      <option value="light" className="bg-[#1e1e1e] text-white">Default Light (Blanco & Púrpura)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#d4d4d4] block">Badge Promocional sobre Fotos</label>
                    <input 
                      type="text"
                      value={formBadgeTexto}
                      onChange={(e) => setFormBadgeTexto(e.target.value)}
                      placeholder="Ej: BLACK FRIDAY, CYBER DEAL, 30% OFF"
                      style={{ color: '#ffffff', backgroundColor: '#18181a', caretColor: '#ffffff' }}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff]"
                    />
                  </div>
                </div>
              )}

              {/* PASO 4: PRECIOS Y CUOTAS */}
              {pasoWizard === 'comercial' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#d4d4d4] block">Descuento Global (%)</label>
                      <input 
                        type="number"
                        min="5"
                        max="80"
                        value={formDescuento}
                        onChange={(e) => setFormDescuento(Number(e.target.value))}
                        style={{ color: '#ffffff', backgroundColor: '#18181a', caretColor: '#ffffff' }}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#d4d4d4] block">Cuotas Sin Interés Habilitadas</label>
                      <select
                        value={formCuotas}
                        onChange={(e) => setFormCuotas(Number(e.target.value))}
                        style={{ color: '#ffffff', backgroundColor: '#18181a' }}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff] cursor-pointer"
                      >
                        <option value={3} className="bg-[#1e1e1e] text-white">3 Cuotas Sin Interés</option>
                        <option value={6} className="bg-[#1e1e1e] text-white">6 Cuotas Sin Interés</option>
                        <option value={12} className="bg-[#1e1e1e] text-white">12 Cuotas Sin Interés</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-[#18181a] rounded-xl border border-[#2b2b2b]">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={formEnvioGratis}
                        onChange={(e) => setFormEnvioGratis(e.target.checked)}
                        className="h-4 w-4 rounded border-[#444444] bg-[#18181a] text-[#87a9ff] focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-[#d4d4d4]">Ofrecer Envío Gratis durante la Campaña</span>
                    </label>

                    {formEnvioGratis && (
                      <input 
                        type="number"
                        value={formEnvioMinimo}
                        onChange={(e) => setFormEnvioMinimo(Number(e.target.value))}
                        placeholder="Mínimo $80.000"
                        style={{ color: '#ffffff', backgroundColor: '#252525', caretColor: '#ffffff' }}
                        className="w-36 px-2.5 py-1 text-xs rounded-lg border border-[#333333] bg-[#252525] text-white font-bold"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* PASO 5: ANUNCIOS, BANNERS Y MODAL */}
              {pasoWizard === 'medios' && (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* CONFIGURACIÓN DEL BANNER PRINCIPAL DE LA CAMPAÑA */}
                  <div className="p-4 bg-[#18181a] rounded-xl border border-[#2b2b2b] space-y-3">
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="h-4 w-4 text-[#87a9ff]" /> Banner Promocional de la Campaña
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-[#8c8c8c] block">Título del Banner Hero</label>
                        <input 
                          type="text"
                          value={formBannerTitulo}
                          onChange={(e) => setFormBannerTitulo(e.target.value)}
                          placeholder="Ej: Colección Híbrida Black Friday"
                          style={{ color: '#ffffff', backgroundColor: '#252525', caretColor: '#ffffff' }}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-[#333333] bg-[#252525] text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-[#8c8c8c] block">Texto del Botón (CTA)</label>
                        <input 
                          type="text"
                          value={formBannerCta}
                          onChange={(e) => setFormBannerCta(e.target.value)}
                          placeholder="Ej: Ver Ofertas Exclusivas"
                          style={{ color: '#ffffff', backgroundColor: '#252525', caretColor: '#ffffff' }}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-[#333333] bg-[#252525] text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Previsualización del Banner */}
                    <div className="p-3 bg-[#121214] border border-[#333333] text-white rounded-xl flex items-center justify-between shadow-xs">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-black uppercase bg-amber-400 text-[#121214] px-2 py-0.5 rounded-full inline-block">Banner Promocional</span>
                        <h6 className="text-xs font-semibold">{formBannerTitulo || 'Título de Banner'}</h6>
                      </div>
                      <button type="button" className="px-3 py-1 bg-[#87a9ff] text-[#121214] text-[10px] font-bold rounded-lg shadow-xs cursor-pointer">
                        {formBannerCta || 'Ver Ofertas'}
                      </button>
                    </div>
                  </div>

                  {/* BARRA SUPERIOR PROMOCIONAL */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={formBarraAnuncios}
                        onChange={(e) => setFormBarraAnuncios(e.target.checked)}
                        className="h-4 w-4 rounded border-[#444444] bg-[#18181a] text-[#87a9ff] focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-[#d4d4d4]">Mostrar Barra Promocional Superior</span>
                    </label>

                    {formBarraAnuncios && (
                      <input 
                        type="text"
                        value={formTextoBarra}
                        onChange={(e) => setFormTextoBarra(e.target.value)}
                        placeholder="Texto de la barra promocional superior..."
                        style={{ color: '#ffffff', backgroundColor: '#18181a', caretColor: '#ffffff' }}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white focus:outline-none focus:border-[#87a9ff]"
                      />
                    )}
                  </div>

                  {/* MODAL EMERGENTE POPUP */}
                  <div className="space-y-2 pt-2 border-t border-[#2b2b2b]">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={formModalPromo}
                        onChange={(e) => setFormModalPromo(e.target.checked)}
                        className="h-4 w-4 rounded border-[#444444] bg-[#18181a] text-[#87a9ff] focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-[#d4d4d4]">Activar Pop-up Promocional al Entrar a la Web</span>
                    </label>

                    {formModalPromo && (
                      <div className="grid grid-cols-2 gap-3">
                        <input 
                          type="text"
                          value={formCodigoCupon}
                          onChange={(e) => setFormCodigoCupon(e.target.value)}
                          placeholder="Código de Cupón (ej: BLACK35OFF)"
                          style={{ color: '#ffffff', backgroundColor: '#18181a', caretColor: '#ffffff' }}
                          className="px-3.5 py-2 text-xs rounded-xl border border-[#333333] bg-[#18181a] text-white font-mono font-bold uppercase focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FOOTER DEL WIZARD (SIEMPRE VISIBLE EN TODOS LOS PASOS CON BOTÓN GUARDAR) */}
              <div className="flex items-center justify-between pt-4 border-t border-[#2b2b2b] gap-3">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 bg-[#252525] text-[#8c8c8c] hover:text-white rounded-lg text-xs font-medium transition cursor-pointer border border-[#333333]"
                >
                  Cancelar
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={guardandoBD}
                    className="px-5 py-2 bg-[#87a9ff] hover:bg-[#a5b4fc] text-[#121214] rounded-lg text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" /> 
                    {guardandoBD ? 'Guardando en BD...' : campanaEditandoId ? 'Guardar Cambios' : 'Crear Campaña 360°'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
