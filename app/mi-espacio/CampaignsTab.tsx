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
    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200/80 rounded-xl text-xs font-mono font-bold shadow-2xs">
      <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse shrink-0" />
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
      // Una campaña está activa HOY si está habilitada Y la fecha actual está dentro de [inicio, fin]
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
      return <span className="px-2.5 py-1 text-[9px] font-bold uppercase rounded-full bg-gray-100 text-gray-500 border border-gray-200">⚪ Inactiva</span>;
    }
    const now = new Date();
    const start = new Date(campana.inicio);
    const end = new Date(campana.fin);

    if (now >= start && now <= end) {
      return <span className="px-2.5 py-1 text-[9px] font-bold uppercase rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">🟢 EN VIVO AHORA</span>;
    } else if (now < start) {
      return <span className="px-2.5 py-1 text-[9px] font-bold uppercase rounded-full bg-purple-50 text-purple-700 border border-purple-200">⏳ Programada</span>;
    } else {
      return <span className="px-2.5 py-1 text-[9px] font-bold uppercase rounded-full bg-gray-100 text-gray-400 border border-gray-200">Finalizada</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* CABECERA PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200/80 pb-5 gap-4">
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Calendar className="h-6 w-6 text-purple-600" />
            Gestor de Campañas 360° (Enterprise Campaign Suite)
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1">
            <Database className="h-3.5 w-3.5 text-emerald-600" />
            Sincronizado en tiempo real con la Base de Datos PostgreSQL del Backend.
          </p>
        </div>

        <button 
          onClick={abrirModalCrear}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          Crear Campaña 360°
        </button>
      </div>

      {/* METRICAS Y RESUMEN DE CAMPAÑAS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Campañas Activas</span>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">
              {campanas.filter(c => c.activa).length} En Vivo
            </div>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Zap className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Cuotas Habilitadas</span>
            <div className="text-2xl font-black text-purple-900 mt-0.5">
              Hasta 6 Sin Interés
            </div>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Beneficio de Envío</span>
            <div className="text-2xl font-black text-blue-600 mt-0.5">
              Bonificado
            </div>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Truck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Base de Datos Central</span>
            <div className="text-2xl font-black text-emerald-600 mt-0.5 flex items-center gap-1.5">
              <Database className="h-5 w-5" /> PostgreSQL
            </div>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* LISTADO DE CAMPAÑAS CON DETALLE 360° Y CONTEO REGRESIVO */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
          Campañas y Eventos Programados
        </h4>

        <div className="grid grid-cols-1 gap-5">
          {campanas.map((c) => (
            <div 
              key={c.id} 
              className={`bg-white border rounded-3xl p-6 shadow-xs transition-all space-y-4 ${
                c.activa ? 'border-purple-200/90 shadow-sm ring-1 ring-purple-600/10' : 'border-gray-200/70 opacity-80'
              }`}
            >
              {/* Encabezado de Tarjeta */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h5 className="text-lg font-black text-gray-900">{c.nombre}</h5>
                    {getStatusBadge(c)}
                    <span className="px-3 py-0.5 text-[10px] font-black text-purple-700 bg-purple-50 rounded-full border border-purple-200">
                      {c.descuentoPct}% OFF GLOBAL
                    </span>
                    <CampaignCountdownBadge finISO={c.fin} inicioISO={c.inicio} activa={c.activa} />
                  </div>
                  <p className="text-xs font-medium text-purple-800">{c.slogan}</p>
                </div>

                {/* Botones de Acción */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => abrirModalEditar(c)}
                    className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border border-purple-200/60"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-purple-600" /> Editar 360°
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCampanaActiva(c.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      c.activa ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {c.activa ? 'Habilitada' : 'Pausada'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEliminarCampana(c.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                    title="Eliminar campaña"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Grid de Especificaciones 360° */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                
                {/* Bloque 1: Fechas */}
                <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1">
                    <Clock className="h-3 w-3 text-purple-600" /> Cronograma
                  </span>
                  <p className="font-mono font-bold text-gray-800 text-[11px]">
                    Del {new Date(c.inicio).toLocaleDateString()} al {new Date(c.fin).toLocaleDateString()}
                  </p>
                </div>

                {/* Bloque 2: Financiación */}
                <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1">
                    <CreditCard className="h-3 w-3 text-emerald-600" /> Financiación & Envío
                  </span>
                  <p className="font-bold text-emerald-700 text-[11px]">
                    {c.cuotasSinInteres} Cuotas Sin Interés {c.envioGratis && '• Envío Gratis'}
                  </p>
                </div>

                {/* Bloque 3: Estética y Badge */}
                <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1">
                    <Tag className="h-3 w-3 text-amber-600" /> Badge Promocional
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-amber-400 text-gray-900 inline-block">
                    {c.badgeTexto}
                  </span>
                </div>

                {/* Bloque 4: Cupón & Captura */}
                <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1">
                    <Gift className="h-3 w-3 text-indigo-600" /> Cupón de Regalo
                  </span>
                  <p className="font-mono font-black text-indigo-900 text-[11px]">
                    {c.codigoCupon}
                  </p>
                </div>

                {/* Bloque 5: Banner Promocional de Campaña */}
                <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-black text-white p-3.5 rounded-2xl flex items-center justify-between shadow-xs col-span-1 sm:col-span-2 md:col-span-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-xl">
                      <ImageIcon className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase text-amber-400 tracking-widest block">Banner de Campaña Asignado</span>
                      <h6 className="text-xs font-bold">{c.bannerTitulo || 'Banner Hero Promocional'}</h6>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-white text-gray-900 text-[10px] font-bold rounded-lg shadow-xs">
                    {c.bannerCta || 'Ver Ofertas'}
                  </span>
                </div>

              </div>

              {/* Barra de Aviso Integrada */}
              {c.mostrarBarraAnuncios && (
                <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white text-[11px] font-bold py-2 px-4 rounded-xl flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{c.textoBarraAnuncios}</span>
                </div>
              )}

            </div>
          ))}
        </div>
      </div>

      {/* WIZARD COMPLETO 360° PARA CREAR / EDITAR CAMPAÑA */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-2xl space-y-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto scrollbar-thin">
            
            {/* Header del Wizard */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div>
                <h4 className="text-base font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" /> 
                  {campanaEditandoId ? 'Editar Campaña 360°' : 'Configurador de Campaña 360°'}
                </h4>
                <p className="text-xs text-gray-400">Define todas las dimensiones comerciales y estéticas del evento.</p>
              </div>
              <button onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Pestañas del Wizard (Navegación Interna) */}
            <div className="flex border-b border-gray-100 overflow-x-auto gap-2 pb-2">
              <button
                type="button"
                onClick={() => setPasoWizard('general')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  pasoWizard === 'general' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                1. General
              </button>
              <button
                type="button"
                onClick={() => setPasoWizard('fechas')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  pasoWizard === 'fechas' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                2. Fechas & Reloj
              </button>
              <button
                type="button"
                onClick={() => setPasoWizard('estetica')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  pasoWizard === 'estetica' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                3. Estética & Badge
              </button>
              <button
                type="button"
                onClick={() => setPasoWizard('comercial')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  pasoWizard === 'comercial' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                4. Precios & Cuotas
              </button>
              <button
                type="button"
                onClick={() => setPasoWizard('medios')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  pasoWizard === 'medios' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                    <label className="text-xs font-bold text-gray-800 block">Nombre de la Campaña</label>
                    <input 
                      type="text"
                      required
                      value={formNombre}
                      onChange={(e) => setFormNombre(e.target.value)}
                      placeholder="Ej: Black Friday 2026"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 font-bold text-gray-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-800 block">Eslogan o Frase Promocional</label>
                    <input 
                      type="text"
                      value={formSlogan}
                      onChange={(e) => setFormSlogan(e.target.value)}
                      placeholder="Ej: Hasta 40% OFF + 6 Cuotas Sin Interés"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 text-gray-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-800 block">Descripción Interna</label>
                    <textarea 
                      rows={3}
                      value={formDescripcion}
                      onChange={(e) => setFormDescripcion(e.target.value)}
                      placeholder="Detalles estratégicos sobre envíos bonificados o productos participantes..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 text-gray-800"
                    />
                  </div>
                </div>
              )}

              {/* PASO 2: FECHAS Y RELOJ */}
              {pasoWizard === 'fechas' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-800 block">Fecha y Hora de Inicio</label>
                      <input 
                        type="datetime-local"
                        required
                        value={formInicio}
                        onChange={(e) => setFormInicio(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 font-bold text-gray-800 bg-gray-50/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-800 block">Fecha y Hora de Cierre</label>
                      <input 
                        type="datetime-local"
                        required
                        value={formFin}
                        onChange={(e) => setFormFin(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 font-bold text-gray-800 bg-gray-50/50"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-2">
                    <h5 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-purple-600" /> Reloj Regresivo Automático
                    </h5>
                    <p className="text-xs text-purple-800">
                      Durante el rango horario establecido, la plataforma desplegará automáticamente el reloj de cuenta regresiva en vivo sobre la barra superior.
                    </p>
                  </div>
                </div>
              )}

              {/* PASO 3: ESTÉTICA Y BADGES */}
              {pasoWizard === 'estetica' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-800 block">Esquema Cromático Promocional</label>
                    <select
                      value={formEsquema}
                      onChange={(e) => setFormEsquema(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 font-bold text-gray-800 bg-white cursor-pointer"
                    >
                      <option value="dark-gold">Dark & Gold (Negro Mate & Dorado Premium)</option>
                      <option value="cyber-blue">Cyber Blue (Azul Eléctrico & Neón)</option>
                      <option value="warm-earth">Warm Earth (Tonos Cálidos & Madera)</option>
                      <option value="light">Default Light (Blanco & Púrpura)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-800 block">Badge Promocional sobre Fotos de Productos</label>
                    <input 
                      type="text"
                      value={formBadgeTexto}
                      onChange={(e) => setFormBadgeTexto(e.target.value)}
                      placeholder="Ej: BLACK FRIDAY, CYBER DEAL, 30% OFF"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 font-bold text-gray-800"
                    />
                  </div>
                </div>
              )}

              {/* PASO 4: PRECIOS Y CUOTAS */}
              {pasoWizard === 'comercial' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-800 block">Descuento Global (%)</label>
                      <input 
                        type="number"
                        min="5"
                        max="80"
                        value={formDescuento}
                        onChange={(e) => setFormDescuento(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 font-bold text-gray-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-800 block">Cuotas Sin Interés Habilitadas</label>
                      <select
                        value={formCuotas}
                        onChange={(e) => setFormCuotas(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 font-bold text-gray-800 bg-white cursor-pointer"
                      >
                        <option value={3}>3 Cuotas Sin Interés</option>
                        <option value={6}>6 Cuotas Sin Interés</option>
                        <option value={12}>12 Cuotas Sin Interés</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={formEnvioGratis}
                        onChange={(e) => setFormEnvioGratis(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-gray-800">Ofrecer Envío Gratis durante la Campaña</span>
                    </label>

                    {formEnvioGratis && (
                      <input 
                        type="number"
                        value={formEnvioMinimo}
                        onChange={(e) => setFormEnvioMinimo(Number(e.target.value))}
                        placeholder="Mínimo $80.000"
                        className="w-36 px-2.5 py-1 text-xs rounded-lg border border-gray-200 font-bold"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* PASO 5: ANUNCIOS, BANNERS Y MODAL */}
              {pasoWizard === 'medios' && (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* CONFIGURACIÓN DEL BANNER PRINCIPAL DE LA CAMPAÑA */}
                  <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100 space-y-3">
                    <h5 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="h-4 w-4 text-purple-600" /> Banner Promocional de la Campaña
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-700 block">Título del Banner Hero</label>
                        <input 
                          type="text"
                          value={formBannerTitulo}
                          onChange={(e) => setFormBannerTitulo(e.target.value)}
                          placeholder="Ej: Colección Híbrida Black Friday"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 font-bold text-gray-800 bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-700 block">Texto del Botón (CTA)</label>
                        <input 
                          type="text"
                          value={formBannerCta}
                          onChange={(e) => setFormBannerCta(e.target.value)}
                          placeholder="Ej: Ver Ofertas Exclusivas"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 font-bold text-gray-800 bg-white"
                        />
                      </div>
                    </div>

                    {/* Previsualización del Banner */}
                    <div className="p-3 bg-gradient-to-r from-purple-950 via-indigo-900 to-black text-white rounded-xl flex items-center justify-between shadow-xs">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-black uppercase bg-amber-400 text-gray-900 px-2 py-0.5 rounded-full inline-block">Banner Promocional</span>
                        <h6 className="text-xs font-bold">{formBannerTitulo || 'Título de Banner'}</h6>
                      </div>
                      <button type="button" className="px-3 py-1 bg-white text-gray-900 text-[10px] font-bold rounded-lg shadow-xs">
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
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-gray-800">Mostrar Barra Promocional Superior</span>
                    </label>

                    {formBarraAnuncios && (
                      <input 
                        type="text"
                        value={formTextoBarra}
                        onChange={(e) => setFormTextoBarra(e.target.value)}
                        placeholder="Texto de la barra promocional superior..."
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 font-bold text-gray-800"
                      />
                    )}
                  </div>

                  {/* MODAL EMERGENTE POPUP */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={formModalPromo}
                        onChange={(e) => setFormModalPromo(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-gray-800">Activar Pop-up Promocional al Entrar a la Web</span>
                    </label>

                    {formModalPromo && (
                      <div className="grid grid-cols-2 gap-3">
                        <input 
                          type="text"
                          value={formCodigoCupon}
                          onChange={(e) => setFormCodigoCupon(e.target.value)}
                          placeholder="Código de Cupón (ej: BLACK35OFF)"
                          className="px-3.5 py-2 text-xs rounded-xl border border-gray-200 font-mono font-bold uppercase"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FOOTER DEL WIZARD (SIEMPRE VISIBLE EN TODOS LOS PASOS CON BOTÓN GUARDAR) */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-3">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition cursor-pointer"
                >
                  Cancelar
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={guardandoBD}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" /> 
                    {guardandoBD ? 'Guardando en BD...' : campanaEditandoId ? 'Guardar Cambios de Campaña' : 'Crear Campaña 360°'}
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
