// app/mi-espacio/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, LayoutGrid, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { getApiUrl } from '../../lib/config';

import MenuCards from './MenuCards';
import DashboardTab from './DashboardTab';
import AppearanceTab from './AppearanceTab';
import BannersTab from './BannersTab';
import CustomizationsTab from './CustomizationsTab';
import WalletTab from './WalletTab';
import ProfileTab from './ProfileTab';
import PurchasesTab from './PurchasesTab';
import SalesTab from './SalesTab';
import PublicationsTab from './PublicationsTab';
import CampaignsTab from './CampaignsTab';
import ModerationTab from './ModerationTab';
import RootTab from './RootTab';

const TABS_VALIDOS = new Set([
  "menu", "dashboard", "appearance", "campanas", "secciones", "banners",
  "billetera", "perfil", "purchases", "sales", "publications", "moderation", "root"
]);

export default function MiEspacioPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      }
    >
      <MiEspacioContent />
    </React.Suspense>
  );
}

function MiEspacioContent() {
  const { usuario, token, logout, cargando } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabDesdeUrl = searchParams.get("tab");

  // Redirigir a login si no hay sesión
  useEffect(() => {
    if (!cargando && !usuario) {
      router.push("/auth");
    }
  }, [usuario, cargando]);

  // Tab actual seleccionado
  const [tabActual, setTabActual] = useState(() =>
    tabDesdeUrl && TABS_VALIDOS.has(tabDesdeUrl) ? tabDesdeUrl : "menu"
  );

  // Sincronizar el tab cuando el usuario usa los botones Atrás / Adelante del navegador
  useEffect(() => {
    const tabValida = tabDesdeUrl && TABS_VALIDOS.has(tabDesdeUrl) ? tabDesdeUrl : "menu";
    setTabActual(tabValida);
  }, [tabDesdeUrl]);

  // --- ESTADOS DE BILLETERA (CLIENT) ---
  const [balance, setBalance] = useState({ available: 0, frozen: 0 });
  const [cargandoBalance, setCargandoBalance] = useState(false);

  // --- ESTADOS DE BRANDING/CMS (ADMIN) ---
  const [brandName, setBrandName] = useState("Vamaar");
  const [colorPrimary, setColorPrimary] = useState("#2C3E50");
  const [colorSecondary, setColorSecondary] = useState("#D4AF37");
  const [colorBackground, setColorBackground] = useState("#FAFAFA");
  const [colorTextInput, setColorTextInput] = useState("#111827");
  const [colorNavbar, setColorNavbar] = useState("#FFFFFF");
  const [colorSectionTitle, setColorSectionTitle] = useState("#111827");
  const [colorCatalogLink, setColorCatalogLink] = useState("#3B82F6");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoArchivo, setLogoArchivo] = useState<File | null>(null);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [tieneCambiosMarca, setTieneCambiosMarca] = useState(false);

  // --- ESTADOS DE LOGO Y MARCA AVANZADO ---
  const [logoHistory, setLogoHistory] = useState<any[]>([]);
  const [brandFontFamily, setBrandFontFamily] = useState("Outfit");
  const [brandFontSize, setBrandFontSize] = useState("1.5rem");

  // --- ESTADOS DE LOGO CROPPER (ADMIN) ---
  const [logoPreviaUrl, setLogoPreviaUrl] = useState<string | null>(null);
  const [zoomLogo, setZoomLogo] = useState(1);
  const [rotateLogo, setRotateLogo] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [removerFondoBlanco, setRemoverFondoBlanco] = useState(false);
  const [toleranciaTransparencia, setToleranciaTransparencia] = useState<number>(30);

  // --- ESTADOS DE BANNERS (ADMIN) ---
  const [bannerList, setBannerList] = useState<any[]>([]);
  const [tieneCambiosBanners, setTieneCambiosBanners] = useState(false);
  const [nuevoBannerTitulo, setNuevoBannerTitulo] = useState("");
  const [nuevoBannerSubtitulo, setNuevoBannerSubtitulo] = useState("");
  const [nuevoBannerArchivo, setNuevoBannerArchivo] = useState<File | null>(null);
  const [nuevoBannerArchivoMovil, setNuevoBannerArchivoMovil] = useState<File | null>(null);
  const [nuevoBannerLink, setNuevoBannerLink] = useState("/catalog");
  const [nuevoBannerLinkPersonalizado, setNuevoBannerLinkPersonalizado] = useState("");
  const [subiendoBanner, setSubiendoBanner] = useState(false);

  // --- ESTADOS DE SECCIONES (ADMIN) ---
  const [seccionesList, setSeccionesList] = useState<any[]>([]);
  const [nuevoSeccionTitulo, setNuevoSeccionTitulo] = useState("");
  const [nuevoSeccionCategoria, setNuevoSeccionCategoria] = useState("Todos");
  const [tieneCambiosSecciones, setTieneCambiosSecciones] = useState(false);

  // Notificaciones unificadas: delega en el sistema global de toasts
  const toast = useToast();
  const showToast = (mensaje: string, tipo: 'success' | 'error' | 'info' = 'info') => {
    toast.notify(tipo, mensaje);
  };

  // --- ESTADO DE ASIGNAR ROL (ADMIN) ---
  const [emailAsignar, setEmailAsignar] = useState("");
  const [rolAsignar, setRolAsignar] = useState("admin");
  const [cargandoAsignar, setCargandoAsignar] = useState(false);
  const [msgAsignar, setMsgAsignar] = useState<{ tipo: 'exito' | 'error', texto: string } | null>(null);

  // --- ESTADO DEL DASHBOARD REAL (ADMIN) ---
  const [adminDashboardData, setAdminDashboardData] = useState<any>(null);
  const [cargandoDashboard, setCargandoDashboard] = useState(false);

  const fetchAdminDashboard = async () => {
    setCargandoDashboard(true);
    try {
      const res = await fetch(`${getApiUrl()}/orders/admin/dashboard/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('vamaar_token') || token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminDashboardData(data);
      }
    } catch (e) {
      console.error("Error al cargar dashboard admin:", e);
    } finally {
      setCargandoDashboard(false);
    }
  };

  useEffect(() => {
    const esAdminCheck = usuario && (usuario.role?.toLowerCase() === "admin" || usuario.email?.toLowerCase() === "admin@vamaar.com");
    if (tabActual === "dashboard" && esAdminCheck) {
      fetchAdminDashboard();
    }
  }, [tabActual, usuario, token]);

  // Cargar saldo de billetera (usuarios no administradores arrancan en su billetera)
  const tabInicializado = React.useRef(false);
  useEffect(() => {
    const esAdminCheck = usuario && (usuario.role?.toLowerCase() === "admin" || usuario.email?.toLowerCase() === "admin@vamaar.com");
    if (usuario && !esAdminCheck) {
      // Solo fijar el tab por defecto la primera vez: si el usuario ya navegó
      // a otra pestaña, no pisarla cuando la ventana recupera el foco
      if (!tabInicializado.current) {
        tabInicializado.current = true;
        // Respetar ?tab=... (p. ej. al publicar un producto → Mis Publicaciones)
        if (tabDesdeUrl && TABS_VALIDOS.has(tabDesdeUrl)) {
          setTabActual(tabDesdeUrl);
        } else {
          setTabActual("menu");
        }
      }
      const fetchBalance = async () => {
        setCargandoBalance(true);
        try {
          const res = await fetch(`${getApiUrl()}/wallet/balance/`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('vamaar_token') || token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setBalance({
              available: data.balance_available || 0,
              frozen: data.balance_frozen || 0
            });
          }
        } catch (err) {
          console.error("Error al cargar saldo:", err);
        } finally {
          setCargandoBalance(false);
        }
      };
      fetchBalance();
    }
  }, [usuario, token]);

  // Cargar historial de logos (Admin)
  const cargarHistorialLogos = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/cms/logo/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('vamaar_token') || token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setLogoHistory(data || []);
      }
    } catch (e) {
      console.error("Error al cargar historial de logos:", e);
    }
  };

  const handleEliminarLogoHistorial = async (id: number) => {
    if (id < 0) {
      setLogoHistory(prev => prev.filter(logo => logo.id !== id));
      setLogoUrl(prevUrl => {
        const remaining = logoHistory.filter(logo => logo.id !== id);
        if (remaining.length > 0) {
          return remaining[0].logo_url;
        }
        return "";
      });
      showToast("Borrador de logo descartado.", "info");
      return;
    }

    const confirmar = await toast.confirm({
      title: "Eliminar logotipo",
      message: "Se eliminará de forma permanente este logotipo del historial. ¿Continuar?",
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!confirmar) return;

    try {
      const res = await fetch(`${getApiUrl()}/cms/logo/${id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('vamaar_token') || token}`
        }
      });
      if (res.ok) {
        showToast("Logo eliminado del historial con éxito.", "success");
        setLogoUrl(prevUrl => {
          const deletedItem = logoHistory.find(item => item.id === id);
          if (deletedItem && deletedItem.logo_url === prevUrl) {
            const remaining = logoHistory.filter(item => item.id !== id);
            return remaining.length > 0 ? remaining[0].logo_url : "";
          }
          return prevUrl;
        });
        cargarHistorialLogos();
      } else {
        showToast("Error al eliminar el logo del servidor.", "error");
      }
    } catch (e) {
      showToast("Error al conectar con el servidor.", "error");
    }
  };

  // Cargar datos CMS (Admin)
  useEffect(() => {
    if (usuario && usuario.role?.toLowerCase() === "admin") {
      const fetchCMS = async () => {
        try {
          const res = await fetch(`${getApiUrl()}/cms/layout/`);
          if (res.ok) {
            const data = await res.json();
            const marca = data.marca || {};
            setBrandName(marca.brand_name || "Vamaar");
            setColorPrimary(marca.primary_color_hex || "#2C3E50");
            setColorSecondary(marca.secondary_color_hex || "#D4AF37");
            setColorBackground(marca.background_color_hex || "#FAFAFA");
            setColorTextInput(marca.input_text_color_hex || "#111827");
            setColorNavbar(marca.navbar_color_hex || "#FFFFFF");
            setColorSectionTitle(marca.section_title_color_hex || "#111827");
            setColorCatalogLink(marca.catalog_link_color_hex || "#3B82F6");
            setLogoUrl(marca.logo_cloudfront_url || "");
            setBrandFontFamily(marca.brand_font_family || "Outfit");
            setBrandFontSize(marca.brand_font_size || "1.5rem");
            
            cargarHistorialLogos();

            const resBanners = await fetch(`${getApiUrl()}/cms/admin/banners`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('vamaar_token') || token}`
              }
            });
            if (resBanners.ok) {
              const list = await resBanners.json();
              setBannerList(list || []);
            }
          }
        } catch (err) {
          console.error("Error al cargar CMS:", err);
        }
      };
      fetchCMS();
    }
  }, [usuario, token]);

  const handleAgregarBorradorBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoBannerArchivo) {
      showToast("Por favor selecciona una imagen para el banner.", "error");
      return;
    }

    const objectUrl = URL.createObjectURL(nuevoBannerArchivo);
    const nuevo = {
      id: Date.now() + Math.random(),
      title: nuevoBannerTitulo || "",
      subtitle: nuevoBannerSubtitulo || "",
      link_url: nuevoBannerLink === "otro" ? nuevoBannerLinkPersonalizado : nuevoBannerLink,
      cloudfront_url: objectUrl,
      is_active: true,
      file: nuevoBannerArchivo,
      mobile_file: nuevoBannerArchivoMovil
    };

    setBannerList([...bannerList, nuevo]);
    setNuevoBannerTitulo("");
    setNuevoBannerSubtitulo("");
    setNuevoBannerLink("/catalog");
    setNuevoBannerLinkPersonalizado("");
    setNuevoBannerArchivo(null);
    setNuevoBannerArchivoMovil(null);
    setTieneCambiosBanners(true);
  };

  // --- HANDLERS DE SECCIONES API ---
  const cargarSeccionesAdmin = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/cms/admin/sections`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('vamaar_token') || token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSeccionesList(data || []);
      }
    } catch (err) {
      console.error("Error al cargar secciones:", err);
    }
  };

  const handleAgregarSeccion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoSeccionTitulo) return;
    try {
      const res = await fetch(`${getApiUrl()}/cms/sections`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('vamaar_token') || token}`
        },
        body: JSON.stringify({
          title: nuevoSeccionTitulo,
          category_filter: nuevoSeccionCategoria === "Todos" ? null : nuevoSeccionCategoria
        })
      });
      if (res.ok) {
        showToast("Sección agregada con éxito.", "success");
        setNuevoSeccionTitulo("");
        setNuevoSeccionCategoria("Todos");
        cargarSeccionesAdmin();
      } else {
        showToast("Error al crear la sección.", "error");
      }
    } catch (err) {
      showToast("Error de conexión al crear sección.", "error");
    }
  };

  const handleEliminarSeccion = async (id: number) => {
    try {
      const res = await fetch(`${getApiUrl()}/cms/sections/${id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('vamaar_token') || token}`
        }
      });
      if (res.ok) {
        showToast("Sección eliminada con éxito.", "success");
        cargarSeccionesAdmin();
      } else {
        showToast("Error al eliminar sección.", "error");
      }
    } catch (err) {
      showToast("Error de conexión al eliminar sección.", "error");
    }
  };

  const handlePublicarSecciones = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/cms/sections/reorder`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('vamaar_token') || token}`
        },
        body: JSON.stringify({
          sections: seccionesList.map(s => ({ id: s.id, is_active: s.is_active !== false }))
        })
      });
      if (res.ok) {
        showToast("Secciones publicadas e integradas a producción.", "success");
        setTieneCambiosSecciones(false);
        cargarSeccionesAdmin();
      } else {
        showToast("Error al guardar orden de secciones.", "error");
      }
    } catch (err) {
      showToast("Error de conexión al reordenar secciones.", "error");
    }
  };

  useEffect(() => {
    const esAdminCheck = usuario && (usuario.role?.toLowerCase() === "admin" || usuario.email?.toLowerCase() === "admin@vamaar.com");
    if (tabActual === "secciones" && esAdminCheck) {
      cargarSeccionesAdmin();
    }
  }, [tabActual, usuario]);

  const handlePublicarMarca = async () => {
    try {
      let finalLogoUrl = logoUrl;

      const activeDraft = logoHistory.find(item => item.logo_url === logoUrl && item.id < 0);
      if (activeDraft && activeDraft.file) {
        setSubiendoLogo(true);
        const formData = new FormData();
        formData.append("file", activeDraft.file);
        const resLogo = await fetch(`${getApiUrl()}/cms/branding/logo/`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem('vamaar_token') || token}`
          },
          body: formData
        });
        if (resLogo.ok) {
          const logoData = await resLogo.json();
          finalLogoUrl = logoData.logo_url || logoUrl;
          setLogoUrl(finalLogoUrl);
        } else {
          console.error("Fallo al subir archivo de logo borrador.");
          showToast("Fallo al subir el logotipo a AWS S3.", "error");
          setSubiendoLogo(false);
          return;
        }
        setSubiendoLogo(false);
      }

      const res = await fetch(`${getApiUrl()}/cms/branding`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('vamaar_token') || token}`
        },
        body: JSON.stringify({
          brand_name: brandName,
          primary_color: colorPrimary,
          secondary_color: colorSecondary,
          background_color: colorBackground,
          input_text_color: colorTextInput,
          navbar_color: colorNavbar,
          section_title_color: colorSectionTitle,
          catalog_link_color: colorCatalogLink,
          brand_font_family: brandFontFamily,
          brand_font_size: brandFontSize,
          logo_url: finalLogoUrl
        })
      });
      if (res.ok) {
        setTieneCambiosMarca(false);
        setLogoArchivo(null);
        showToast("¡Identidad visual publicada con éxito en la web!", "success");
        
        document.body.style.setProperty('--color-primary', colorPrimary);
        document.body.style.setProperty('--color-secondary', colorSecondary);
        document.body.style.setProperty('--bg-marketplace', colorBackground);
        document.body.style.setProperty('--color-text-input', colorTextInput);
        document.body.style.setProperty('--bg-navbar', colorNavbar);
        document.body.style.setProperty('--color-section-title', colorSectionTitle);
        document.body.style.setProperty('--color-catalog-link', colorCatalogLink);
        document.body.style.setProperty('--font-family-brand', brandFontFamily);
        document.body.style.setProperty('--font-size-brand', brandFontSize);
        
        cargarHistorialLogos();
        
        const event = new CustomEvent("actualizar-logo-navbar", { detail: { logoUrl: finalLogoUrl } });
        window.dispatchEvent(event);
        router.refresh();
      } else {
        showToast("Error al actualizar la marca.", "error");
      }
    } catch (err) {
      showToast("Error de conexión al guardar cambios de marca.", "error");
    }
  };

  const handlePublicarBanners = async () => {
    setSubiendoBanner(true);
    let huboErrores = false;
    try {
      // Subir los borradores nuevos: el backend devuelve el ID real de cada banner creado
      const idsReales: { tempId: any; realId: number }[] = [];
      for (const item of bannerList) {
        if (item.file) {
          const formData = new FormData();
          formData.append("title", item.title || "");
          formData.append("subtitle", item.subtitle || "");
          formData.append("link_url", item.link_url || "");
          formData.append("file", item.file);
          if (item.mobile_file) {
            formData.append("mobile_file", item.mobile_file);
          }
          formData.append("orden", "0");

          const res = await fetch(`${getApiUrl()}/cms/banner/upload/`, {
            method: "POST",
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('vamaar_token') || token}`
            },
            body: formData
          });
          if (res.ok) {
            const data = await res.json();
            if (data.banner_id) {
              idsReales.push({ tempId: item.id, realId: data.banner_id });
            }
          } else {
            huboErrores = true;
            showToast(`No se pudo subir el banner "${item.title || 'sin título'}".`, "error");
          }
        } else if (item.id && typeof item.id === 'number' && item.id > 0) {
          // Actualizar banner existente en la base de datos PostgreSQL
          await fetch(`${getApiUrl()}/cms/banner/${item.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              'Authorization': `Bearer ${localStorage.getItem('vamaar_token') || token}`
            },
            body: JSON.stringify({
              title: item.title || "",
              subtitle: item.subtitle || "",
              link_url: item.link_url || "/catalog",
              is_active: item.is_active !== false
            })
          });
        }
      }

      // Reordenar usando IDs reales (los existentes ya tienen id de DB; los nuevos usan el id devuelto)
      const orderedBanners = bannerList
        .map(b => {
          const nuevo = idsReales.find(m => m.tempId === b.id);
          const realId = nuevo ? nuevo.realId : (b.file ? null : b.id);
          return realId != null ? { id: realId, is_active: b.is_active !== false } : null;
        })
        .filter(item => item !== null);

      if (orderedBanners.length > 0) {
        const resReorder = await fetch(`${getApiUrl()}/cms/banner/reorder`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${localStorage.getItem('vamaar_token') || token}`
          },
          body: JSON.stringify({ banners: orderedBanners })
        });
        if (!resReorder.ok) {
          huboErrores = true;
          showToast("No se pudo guardar el orden de los banners.", "error");
        }
      }

      setTieneCambiosBanners(false);
      if (huboErrores) {
        showToast("Algunos banners no se publicaron. Revisá la lista e intentá de nuevo.", "error");
      } else {
        showToast("¡Cola de banners procesada y publicada en la web con éxito!", "success");
      }
      
      // Recargar la lista real desde el servidor (las imágenes pueden seguir procesándose unos segundos)
      const reloadRes = await fetch(`${getApiUrl()}/cms/admin/banners`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('vamaar_token') || token}`
        }
      });
      if (reloadRes.ok) {
        const reloadData = await reloadRes.json();
        setBannerList(reloadData || []);
      }
    } catch (err) {
      showToast("Error al publicar la cola de banners.", "error");
    } finally {
      setSubiendoBanner(false);
    }
  };

  const handleAsignarRango = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailAsignar) return;
    setCargandoAsignar(true);
    setMsgAsignar(null);

    try {
      const res = await fetch(`${getApiUrl()}/auth/assign-role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('vamaar_token') || token}`
        },
        body: JSON.stringify({
          email: emailAsignar,
          role: rolAsignar
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMsgAsignar({ tipo: 'exito', texto: data.mensaje || "Rol asignado correctamente." });
        setEmailAsignar("");
      } else {
        setMsgAsignar({ tipo: 'error', texto: data.detail || "Error al asignar rol." });
      }
    } catch (err) {
      setMsgAsignar({ tipo: 'error', texto: "Error al conectar con el servidor." });
    } finally {
      setCargandoAsignar(false);
    }
  };

  const formatearARS = (val: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val).replace("ARS", "$");
  };

  if (cargando || !usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  const esAdmin = usuario && (usuario.role?.toLowerCase() === "admin" || usuario.email?.toLowerCase() === "admin@vamaar.com" || usuario.role?.toLowerCase() === "root");
  const esRoot = usuario && (usuario.role?.toLowerCase() === "root" || usuario.role === "ROOT");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-10 animate-fade-in font-sans text-gray-800 antialiased">
      {/* ÁREA DE CONTENIDO PRINCIPAL BASADA EN MENÚ DE TARJETAS */}
      <main className="w-full space-y-6">
        
        {/* LINK DE NAVEGACIÓN CUANDO UN TAB DE SECCIÓN ESTÁ ACTIVO */}
        {tabActual !== "menu" && (
          <div className="mb-2 sm:mb-4">
            <button 
              onClick={() => {
                setTabActual("menu");
                router.push('/mi-espacio?tab=menu');
              }}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#2C3E50] hover:text-purple-700 transition cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Volver a mi espacio</span>
            </button>
          </div>
        )}

        {/* TAB: MENÚ DE TARJETAS (Navegación principal exclusiva) */}
        {tabActual === "menu" && (
          <div className="space-y-6 animate-fade-in">
            {/* CABECERA VIOLETA DE BIENVENIDA */}
            <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  ¡Hola, {usuario.full_name.split(' ')[0]}!
                </h1>
              </div>
            </div>

            {/* GRILLA DE TARJETAS EXCLUSIVA */}
            <MenuCards 
              tabActual={tabActual} 
              setTabActual={setTabActual} 
              esAdmin={esAdmin} 
              esRoot={esRoot}
              logout={logout}
            />
          </div>
        )}
        
        {/* TAB: PANEL DE CONTROL (DASHBOARD) - Solo administradores */}
        {tabActual === "dashboard" && esAdmin && (
          <DashboardTab 
            msgAsignar={msgAsignar}
            emailAsignar={emailAsignar}
            setEmailAsignar={setEmailAsignar}
            rolAsignar={rolAsignar}
            setRolAsignar={setRolAsignar}
            cargandoAsignar={cargandoAsignar}
            handleAsignarRango={handleAsignarRango}
            adminDashboardData={adminDashboardData}
            cargandoDashboard={cargandoDashboard}
          />
        )}

        {/* TAB: APARIENCIA (BRANDING/CMS) */}
        {tabActual === "appearance" && esAdmin && (
          <AppearanceTab 
            tieneCambiosMarca={tieneCambiosMarca}
            setTieneCambiosMarca={setTieneCambiosMarca}
            handlePublicarMarca={handlePublicarMarca}
            brandName={brandName}
            setBrandName={setBrandName}
            brandFontFamily={brandFontFamily}
            setBrandFontFamily={setBrandFontFamily}
            brandFontSize={brandFontSize}
            setBrandFontSize={setBrandFontSize}
            logoHistory={logoHistory}
            setLogoHistory={setLogoHistory}
            logoUrl={logoUrl}
            setLogoUrl={setLogoUrl}
            logoPreviaUrl={logoPreviaUrl}
            setLogoPreviaUrl={setLogoPreviaUrl}
            zoomLogo={zoomLogo}
            setZoomLogo={setZoomLogo}
            rotateLogo={rotateLogo}
            setRotateLogo={setRotateLogo}
            offsetX={offsetX}
            setOffsetX={setOffsetX}
            offsetY={offsetY}
            setOffsetY={setOffsetY}
            removerFondoBlanco={removerFondoBlanco}
            setRemoverFondoBlanco={setRemoverFondoBlanco}
            toleranciaTransparencia={toleranciaTransparencia}
            setToleranciaTransparencia={setToleranciaTransparencia}
            colorPrimary={colorPrimary}
            setColorPrimary={setColorPrimary}
            colorSecondary={colorSecondary}
            setColorSecondary={setColorSecondary}
            colorBackground={colorBackground}
            setColorBackground={setColorBackground}
            colorNavbar={colorNavbar}
            setColorNavbar={setColorNavbar}
            colorSectionTitle={colorSectionTitle}
            setColorSectionTitle={setColorSectionTitle}
            colorCatalogLink={colorCatalogLink}
            setColorCatalogLink={setColorCatalogLink}
            colorTextInput={colorTextInput}
            setColorTextInput={setColorTextInput}
            handleEliminarLogoHistorial={handleEliminarLogoHistorial}
            apiUrl={getApiUrl()}
          />
        )}

        {/* TAB: CAMPAÑAS Y EVENTOS (ADMIN) */}
        {tabActual === "campanas" && esAdmin && (
          <CampaignsTab 
            apiUrl={getApiUrl()}
            token={token}
          />
        )}
        {tabActual === "banners" && esAdmin && (
          <BannersTab 
            tieneCambiosBanners={tieneCambiosBanners}
            handlePublicarBanners={handlePublicarBanners}
            subiendoBanner={subiendoBanner}
            nuevoBannerTitulo={nuevoBannerTitulo}
            setNuevoBannerTitulo={setNuevoBannerTitulo}
            nuevoBannerSubtitulo={nuevoBannerSubtitulo}
            setNuevoBannerSubtitulo={setNuevoBannerSubtitulo}
            nuevoBannerLink={nuevoBannerLink}
            setNuevoBannerLink={setNuevoBannerLink}
            nuevoBannerLinkPersonalizado={nuevoBannerLinkPersonalizado}
            setNuevoBannerLinkPersonalizado={setNuevoBannerLinkPersonalizado}
            nuevoBannerArchivo={nuevoBannerArchivo}
            setNuevoBannerArchivo={setNuevoBannerArchivo}
            nuevoBannerArchivoMovil={nuevoBannerArchivoMovil}
            setNuevoBannerArchivoMovil={setNuevoBannerArchivoMovil}
            handleAgregarBorradorBanner={handleAgregarBorradorBanner}
            bannerList={bannerList}
            setBannerList={setBannerList}
            setTieneCambiosBanners={setTieneCambiosBanners}
            showToast={showToast}
            token={token}
            apiUrl={getApiUrl()}
          />
        )}

        {/* TAB: SECCIONES (CUSTOMIZATIONS) */}
        {tabActual === "secciones" && esAdmin && (
          <CustomizationsTab 
            tieneCambiosSecciones={tieneCambiosSecciones}
            handlePublicarSecciones={handlePublicarSecciones}
            nuevoSeccionTitulo={nuevoSeccionTitulo}
            setNuevoSeccionTitulo={setNuevoSeccionTitulo}
            nuevoSeccionCategoria={nuevoSeccionCategoria}
            setNuevoSeccionCategoria={setNuevoSeccionCategoria}
            handleAgregarSeccion={handleAgregarSeccion}
            seccionesList={seccionesList}
            setSeccionesList={setSeccionesList}
            setTieneCambiosSecciones={setTieneCambiosSecciones}
            handleEliminarSeccion={handleEliminarSeccion}
          />
        )}

        {/* TAB: BILLETERA (CLIENTE COMÚN) */}
        {tabActual === "billetera" && (
          <WalletTab 
            cargandoBalance={cargandoBalance}
            balance={balance}
            formatearARS={formatearARS}
            onBalanceUpdate={(available, frozen) => setBalance({ available, frozen })}
          />
        )}

        {/* TAB: PERFIL (CLIENT) */}
        {tabActual === "perfil" && (
          <ProfileTab />
        )}

        {/* TAB: MIS COMPRAS */}
        {tabActual === "purchases" && (
          <PurchasesTab 
            token={token}
          />
        )}

        {/* TAB: MIS VENTAS */}
        {tabActual === "sales" && (
          <SalesTab 
            token={token}
          />
        )}

        {/* TAB: MIS PUBLICACIONES */}
        {tabActual === "publications" && (
          <PublicationsTab 
            token={token}
          />
        )}

        {/* TAB: MODERACIÓN DE PRODUCTOS (ADMIN) */}
        {tabActual === "moderation" && (
          <ModerationTab 
            token={token || ""}
          />
        )}

        {/* TAB: PANEL DE PROGRAMADOR ROOT (TEMA GOOGLE AI STUDIO - PANTALLA COMPLETA 100vw x 100vh) */}
        {tabActual === "root" && esRoot && (
          <div className="fixed inset-0 z-50 bg-[#121214] w-screen h-screen overflow-hidden flex flex-col animate-fade-in">
            <RootTab onVolverAMiEspacio={() => {
              setTabActual("menu");
              router.push('/mi-espacio?tab=menu');
            }} />
          </div>
        )}

      </main>
    </div>
  );
}
