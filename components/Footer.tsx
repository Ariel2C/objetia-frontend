"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { getApiUrl } from '../lib/config';
import { 
  Mail, 
  ArrowRight, 
  Check, 
  X,
  ShieldCheck,
  HelpCircle,
  FileText
} from 'lucide-react';
import { useToast } from './ToastContext';

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
    </svg>
  );
}

function TwitterIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function YoutubeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

type ModalType = 'preguntas' | 'como_funciona' | 'sobre_objetia' | 'compra_protegida' | 'terminos' | 'privacidad' | null;

interface FooterProps {
  logoUrl?: string;
}

export default function Footer({ logoUrl }: FooterProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams?.get('tab');
  const toast = useToast();

  const [logoUrlState, setLogoUrlState] = useState(logoUrl || "");
  const [brandNameState, setBrandNameState] = useState("OBJETIA");
  const [emailNovedades, setEmailNovedades] = useState('');
  const [suscrito, setSuscrito] = useState(false);
  const [cargandoNewsletter, setCargandoNewsletter] = useState(false);
  const [modalActivo, setModalActivo] = useState<ModalType>(null);

  const isRootTab = pathname === '/root/dashboard' || ((pathname === '/mi-objetia' || pathname === '/mi-espacio') && tab === 'root');
  const isChatTab = (pathname === '/mi-objetia' || pathname === '/mi-espacio') && tab === 'chat';

  useEffect(() => {
    if (logoUrl) setLogoUrlState(logoUrl);
  }, [logoUrl]);

  useEffect(() => {
    if (!logoUrlState) {
      fetch(`${getApiUrl()}/cms/layout/`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          const logo = data?.marca?.logo_cloudfront_url;
          if (logo) setLogoUrlState(logo);
          if (data?.marca?.brand_name) setBrandNameState(data.marca.brand_name);
        })
        .catch(() => {});
    }

    const handleBrandingUpdated = (e: any) => {
      if (e.detail) {
        if (e.detail.logoUrl !== undefined) setLogoUrlState(e.detail.logoUrl);
        if (e.detail.brandName !== undefined) setBrandNameState(e.detail.brandName);
      }
    };
    const handleActualizarLogo = (e: any) => {
      if (e.detail?.logoUrl) {
        setLogoUrlState(e.detail.logoUrl);
      }
    };

    window.addEventListener('branding_updated', handleBrandingUpdated);
    window.addEventListener('actualizar-logo-navbar' as any, handleActualizarLogo);

    return () => {
      window.removeEventListener('branding_updated', handleBrandingUpdated);
      window.removeEventListener('actualizar-logo-navbar' as any, handleActualizarLogo);
    };
  }, []);

  if (isRootTab || isChatTab) return null;

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailNovedades.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast.error('Por favor, ingresá un correo electrónico válido.');
      return;
    }

    setCargandoNewsletter(true);
    setTimeout(() => {
      setCargandoNewsletter(false);
      setSuscrito(true);
      setEmailNovedades('');
      toast.success('¡Te suscribiste con éxito a las novedades de Objetia!');
    }, 600);
  };

  return (
    <>
      <footer className="bg-[#121316] text-[#9aa0a6] border-t border-[#23252a] pt-14 pb-12 mt-16 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-[#23252a]">
            
            {/* ==================================================================== */}
            {/* COLUMNA 1: MARCA Y SUSCRIPCIÓN A NOVEDADES (5 cols en lg)            */}
            {/* ==================================================================== */}
            <div className="lg:col-span-5 space-y-4">
              <Link href="/" className="inline-flex items-center gap-2.5 group">
                <img
                  src={logoUrlState && logoUrlState !== "" && logoUrlState !== "https://" ? logoUrlState : "/objetia_logo.png"}
                  alt={brandNameState || "Objetia"}
                  className="h-9 w-9 sm:h-10 sm:w-10 object-contain group-hover:scale-105 transition-transform"
                />
                <span 
                  className="text-xl font-extrabold tracking-widest text-white uppercase"
                  style={{ fontFamily: 'var(--font-family-brand, Outfit)' }}
                >
                  {brandNameState || 'OBJETIA'}
                </span>
              </Link>

              <p className="text-xs text-[#9aa0a6] leading-relaxed max-w-sm">
                Plataforma de diseño de interiores, mobiliario y objetos exclusivos para conectar espacios con estilo propio.
              </p>

              {/* Formulario de novedades */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-white mb-2">Recibí novedades y promociones</p>
                {suscrito ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    <span>¡Gracias por suscribirte! Ya sos parte de nuestra comunidad.</span>
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="space-y-2 max-w-md">
                    <div className="flex items-center bg-[#1a1b1e] border border-[#3c4043] focus-within:border-[#87a9ff] focus-within:ring-1 focus-within:ring-[#87a9ff]/30 rounded-xl p-1 transition-all">
                      <div className="pl-3 pr-2 text-[#9aa0a6]">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={emailNovedades}
                        onChange={(e) => setEmailNovedades(e.target.value)}
                        placeholder="Tu correo electrónico"
                        className="w-full bg-transparent text-xs text-white placeholder:text-[#5f6368] focus:outline-none py-2"
                      />
                      <button
                        type="submit"
                        disabled={cargandoNewsletter}
                        className="px-3.5 py-2 bg-white hover:bg-[#e3e3e3] text-[#121316] rounded-lg text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        <span>Suscribirme</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10.5px] text-[#5f6368]">
                      Sin spam. Podés darte de baja en cualquier momento.
                    </p>
                  </form>
                )}
              </div>
            </div>

            {/* ==================================================================== */}
            {/* COLUMNA 2: AYUDA (2 cols en lg)                                      */}
            {/* ==================================================================== */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Ayuda</h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <button 
                    type="button"
                    onClick={() => setModalActivo('preguntas')} 
                    className="text-[#9aa0a6] hover:text-white transition text-left cursor-pointer"
                  >
                    Preguntas frecuentes
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setModalActivo('como_funciona')} 
                    className="text-[#9aa0a6] hover:text-white transition text-left cursor-pointer"
                  >
                    Cómo comprar y vender
                  </button>
                </li>
                <li>
                  <Link href="/shipping/tracking" className="text-[#9aa0a6] hover:text-white transition block">
                    Seguimiento de envíos
                  </Link>
                </li>
                <li>
                  <Link href="/simulador-correo" className="text-[#9aa0a6] hover:text-white transition block">
                    Simulador de envíos
                  </Link>
                </li>
                <li>
                  <Link href="/mi-objetia?tab=chat" className="text-[#9aa0a6] hover:text-white transition block">
                    Contacto y soporte
                  </Link>
                </li>
              </ul>
            </div>

            {/* ==================================================================== */}
            {/* COLUMNA 3: INFORMACIÓN (2 cols en lg)                                */}
            {/* ==================================================================== */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Información</h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <button 
                    type="button"
                    onClick={() => setModalActivo('sobre_objetia')} 
                    className="text-[#9aa0a6] hover:text-white transition text-left cursor-pointer"
                  >
                    Sobre Objetia
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setModalActivo('compra_protegida')} 
                    className="text-[#9aa0a6] hover:text-white transition text-left cursor-pointer"
                  >
                    Compra protegida
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setModalActivo('terminos')} 
                    className="text-[#9aa0a6] hover:text-white transition text-left cursor-pointer"
                  >
                    Términos y condiciones
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setModalActivo('privacidad')} 
                    className="text-[#9aa0a6] hover:text-white transition text-left cursor-pointer"
                  >
                    Política de privacidad
                  </button>
                </li>
              </ul>
            </div>

            {/* ==================================================================== */}
            {/* COLUMNA 4: REDES (3 cols en lg)                                      */}
            {/* ==================================================================== */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Redes</h4>
              <p className="text-xs text-[#9aa0a6] leading-relaxed">
                Seguinos para descubrir tendencias de diseño, espacios inspiradores y nuevos objetos exclusivos.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-[#1a1b1e] border border-[#3c4043] flex items-center justify-center text-[#9aa0a6] hover:text-white hover:border-[#87a9ff] hover:bg-[#202227] transition cursor-pointer"
                  aria-label="Instagram"
                  title="Instagram"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-[#1a1b1e] border border-[#3c4043] flex items-center justify-center text-[#9aa0a6] hover:text-white hover:border-[#87a9ff] hover:bg-[#202227] transition cursor-pointer"
                  aria-label="Facebook"
                  title="Facebook"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-[#1a1b1e] border border-[#3c4043] flex items-center justify-center text-[#9aa0a6] hover:text-white hover:border-[#87a9ff] hover:bg-[#202227] transition cursor-pointer"
                  aria-label="Twitter / X"
                  title="Twitter / X"
                >
                  <TwitterIcon className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-[#1a1b1e] border border-[#3c4043] flex items-center justify-center text-[#9aa0a6] hover:text-white hover:border-[#87a9ff] hover:bg-[#202227] transition cursor-pointer"
                  aria-label="YouTube"
                  title="YouTube"
                >
                  <YoutubeIcon className="w-4 h-4" />
                </a>
              </div>
            </div>

          </div>

          {/* ==================================================================== */}
          {/* BARRA INFERIOR DE COPYRIGHT                                         */}
          {/* ==================================================================== */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5f6368]">
            <p>© 2026 Objetia. Todos los derechos reservados.</p>
            <div className="flex items-center gap-6 text-[11.5px]">
              <button 
                type="button" 
                onClick={() => setModalActivo('terminos')} 
                className="hover:text-[#9aa0a6] transition cursor-pointer"
              >
                Términos
              </button>
              <button 
                type="button" 
                onClick={() => setModalActivo('privacidad')} 
                className="hover:text-[#9aa0a6] transition cursor-pointer"
              >
                Privacidad
              </button>
              <button 
                type="button" 
                onClick={() => setModalActivo('compra_protegida')} 
                className="hover:text-[#9aa0a6] transition cursor-pointer"
              >
                Garantía
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ==================================================================== */}
      {/* MODAL INFORMATIVO Y LEGAL                                            */}
      {/* ==================================================================== */}
      {modalActivo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#18191c] border border-[#3c4043] rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col p-6 shadow-2xl relative text-white">
            <div className="flex items-center justify-between pb-4 border-b border-[#2d3035]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {modalActivo === 'preguntas' && <HelpCircle className="w-4 h-4 text-[#87a9ff]" />}
                {modalActivo === 'como_funciona' && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                {modalActivo === 'sobre_objetia' && <FileText className="w-4 h-4 text-[#87a9ff]" />}
                {modalActivo === 'compra_protegida' && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                {modalActivo === 'terminos' && <FileText className="w-4 h-4 text-[#87a9ff]" />}
                {modalActivo === 'privacidad' && <FileText className="w-4 h-4 text-[#87a9ff]" />}

                {modalActivo === 'preguntas' && 'Preguntas Frecuentes'}
                {modalActivo === 'como_funciona' && 'Cómo Comprar y Vender'}
                {modalActivo === 'sobre_objetia' && 'Sobre Objetia'}
                {modalActivo === 'compra_protegida' && 'Programa de Compra Protegida'}
                {modalActivo === 'terminos' && 'Términos y Condiciones (v1.0)'}
                {modalActivo === 'privacidad' && 'Política de Privacidad'}
              </h3>
              <button
                type="button"
                onClick={() => setModalActivo(null)}
                className="text-[#9aa0a6] hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 text-xs space-y-3.5 pr-2 text-[#c4c7c5] leading-relaxed">
              {modalActivo === 'preguntas' && (
                <>
                  <div>
                    <p className="font-bold text-white mb-1">¿Cómo realizo una compra en Objetia?</p>
                    <p>Podés explorar el catálogo, agregar tus objetos de diseño al carrito y abonar de forma segura con Mercado Pago mediante tarjeta de crédito, débito o dinero en cuenta.</p>
                  </div>
                  <div>
                    <p className="font-bold text-white mb-1">¿Cómo cobro por mis ventas?</p>
                    <p>El dinero de tus ventas se acredita en tu billetera digital de Objetia. Al cumplirse el período de garantía y entrega, podés retirarlo sin costo a tu cuenta bancaria (CBU/CVU).</p>
                  </div>
                  <div>
                    <p className="font-bold text-white mb-1">¿Cómo se realizan los envíos?</p>
                    <p>Contamos con integración con servicios de logística oficiales. Podés simular las tarifas y seguir cada paquete con el número de seguimiento en tiempo real.</p>
                  </div>
                </>
              )}

              {modalActivo === 'como_funciona' && (
                <>
                  <div>
                    <p className="font-bold text-white mb-1">1. Para Compradores</p>
                    <p>Encontrá muebles y piezas singulares seleccionadas. Tu pago queda protegido en garantía hasta que recibas el producto y confirmes su estado.</p>
                  </div>
                  <div>
                    <p className="font-bold text-white mb-1">2. Para Vendedores</p>
                    <p>Publicá tus objetos con fotos reales y descripción detallada. Una vez realizada la venta, despachás el producto con la etiqueta provista y recibís tus ingresos en tu billetera.</p>
                  </div>
                  <div>
                    <p className="font-bold text-white mb-1">3. Chat en Tiempo Real</p>
                    <p>Comunicate de forma directa y privada entre comprador y vendedor para coordinar cualquier duda del producto antes y después de comprar.</p>
                  </div>
                </>
              )}

              {modalActivo === 'sobre_objetia' && (
                <>
                  <p><strong>Objetia</strong> es el marketplace curado dedicado a la decoración, mobiliario y piezas de autor en Argentina.</p>
                  <p>Nuestra misión es conectar a apasionados por el buen diseño con objetos con historia, calidad artesanal y valor estético duradero, fomentando el comercio transparente y la economía circular de alta gama.</p>
                </>
              )}

              {modalActivo === 'compra_protegida' && (
                <>
                  <p className="font-bold text-white">Garantía Objetia de 7 Días</p>
                  <p>Tu dinero no se entrega al vendedor de inmediato. Queda bajo custodia segura de Objetia hasta 7 días posteriores a la recepción confirmada del paquete.</p>
                  <p>Si el artículo no coincide con las fotos o presenta algún desperfecto no informado, podés iniciar un reclamo y gestionar la devolución con reembolso total.</p>
                </>
              )}

              {modalActivo === 'terminos' && (
                <>
                  <p className="font-bold text-white">1. Aceptación de los Términos</p>
                  <p>Al registrarse y operar en Objetia, el usuario acepta de manera libre e incondicional los presentes Términos y Condiciones de Uso de la plataforma.</p>
                  <p className="font-bold text-white">2. Publicación de Productos y Reglas</p>
                  <p>Cada publicación debe contener fotos reales del producto. Queda estrictamente prohibida la divulgación de datos de contacto externos (teléfonos, redes sociales) en las imágenes o descripciones.</p>
                  <p className="font-bold text-white">3. Responsabilidad y Operaciones</p>
                  <p>Objetia proporciona la intermediación y el soporte de garantía para asegurar transacciones fiables entre las partes.</p>
                </>
              )}

              {modalActivo === 'privacidad' && (
                <>
                  <p className="font-bold text-white">1. Protección de Datos Personales</p>
                  <p>Garantizamos la privacidad y seguridad de tus datos. La información personal se utiliza exclusivamente para validar operaciones, procesar pagos y gestionar despachos.</p>
                  <p className="font-bold text-white">2. Comunicaciones y Preferencias</p>
                  <p>Podés gestionar tus preferencias de correo electrónico o cancelar tu suscripción a novedades en cualquier momento desde tu panel o mediante el enlace provisto.</p>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-[#2d3035] flex justify-end">
              <button
                type="button"
                onClick={() => setModalActivo(null)}
                className="px-4 py-2 bg-white hover:bg-[#e3e3e3] text-[#121316] rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
