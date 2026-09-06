"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getApiUrl } from '../lib/config';
import { formatearTituloProducto } from '../lib/format';
import {
  X,
  Upload,
  Sparkles,
  Loader2,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Trash2,
  Image as ImageIcon,
  Tag,
  Check,
  Package,
  DollarSign,
  Info,
  Scale
} from 'lucide-react';

interface SecondaryPhotoState {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "ok" | "error";
  reason?: string;
}

const MAX_IA_SCANS_PER_SESSION = 3;

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NewProductModal({ isOpen, onClose, onSuccess }: NewProductModalProps) {
  const { usuario, token, cargando, tienePermiso } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [mounted, setMounted] = useState(false);

  // --- PASOS DEL WIZARD (1: Fotos, 2: Info, 3: Medidas & Precio, 4: Revisión) ---
  const [pasoActual, setPasoActual] = useState(1);

  // --- CONTADOR DE ESCANEOS CON IA ---
  const [scanCount, setScanCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("vamaar_ia_scans_count");
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  // --- FOTO PRINCIPAL (Paso 1) ---
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [primaryPreview, setPrimaryPreview] = useState<string | null>(null);
  const [analizandoPrincipal, setAnalizandoPrincipal] = useState(false);
  const [principalAnalizada, setPrincipalAnalizada] = useState(false);
  const primaryInputRef = useRef<HTMLInputElement>(null);

  // --- FOTOS SECUNDARIAS (Paso 1b - Máx. 5 fotos en total contando la principal) ---
  const [secundarias, setSecundarias] = useState<SecondaryPhotoState[]>([]);
  const secondaryInputRef = useRef<HTMLInputElement>(null);

  // --- FORMULARIO PRODUCTO ---
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Iluminación");
  const [condition, setCondition] = useState("USED"); // USED or NEW
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [price, setPrice] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [stock, setStock] = useState("1");

  // --- EMBALAJE Y ENVÍO (Correo Argentino) ---
  const [weight, setWeight] = useState("2.5");
  const [height, setHeight] = useState("40");
  const [width, setWidth] = useState("25");
  const [length, setLength] = useState("25");

  // ESTADOS DE CARGA E INTERFAZ
  const [errorSubmit, setErrorSubmit] = useState<string | null>(null);
  const [publicando, setPublicando] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Manejador tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !publicando) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, publicando, onClose]);

  // Reset del formulario cuando se cierra
  const resetFormulario = () => {
    setPasoActual(1);
    if (primaryPreview) URL.revokeObjectURL(primaryPreview);
    secundarias.forEach(s => URL.revokeObjectURL(s.preview));
    setPrimaryFile(null);
    setPrimaryPreview(null);
    setSecundarias([]);
    setPrincipalAnalizada(false);
    setAnalizandoPrincipal(false);
    setTitle("");
    setCategory("Iluminación");
    setCondition("USED");
    setDescription("");
    setTags("");
    setPrice("");
    setPriceDisplay("");
    setStock("1");
    setWeight("2.5");
    setHeight("40");
    setWidth("25");
    setLength("25");
    setErrorSubmit(null);
    setPublicando(false);
  };

  const handleCerrar = () => {
    if (publicando) return;
    onClose();
  };

  // --- 1. PROCESAR FOTO PRINCIPAL DE PORTADA ---
  const handlePrimaryFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("El archivo debe ser una imagen (JPG, PNG, WEBP).");
      return;
    }

    if (primaryPreview) URL.revokeObjectURL(primaryPreview);
    const newPreview = URL.createObjectURL(file);
    setPrimaryFile(file);
    setPrimaryPreview(newPreview);
    setPrincipalAnalizada(false);
    setErrorSubmit(null);

    // Límite de escaneos automáticos por sesión
    if (scanCount >= MAX_IA_SCANS_PER_SESSION) {
      toast.info("Alcanzaste el límite de 3 análisis automáticos por sesión. Ingresá los datos manualmente.");
      setPrincipalAnalizada(true);
      return;
    }

    const newCount = scanCount + 1;
    setScanCount(newCount);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("vamaar_ia_scans_count", String(newCount));
    }

    await analizarFotoPrincipal(file);
  };

  const analizarFotoPrincipal = async (file: File) => {
    setAnalizandoPrincipal(true);
    setErrorSubmit(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${getApiUrl()}/products/analyze-primary-photo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("vamaar_token") || token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Error al analizar la foto principal.");
      }

      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.category) setCategory(data.category);
      if (data.description) setDescription(data.description);
      if (data.tags) setTags(data.tags);
      if (data.weight_kg) setWeight(String(data.weight_kg));
      if (data.height_cm) setHeight(String(data.height_cm));
      if (data.width_cm) setWidth(String(data.width_cm));
      if (data.length_cm) setLength(String(data.length_cm));

      setPrincipalAnalizada(true);
      toast.success("¡Foto analizada con IA! Datos auto-completados exitosamente.");
    } catch (err: any) {
      console.error(err);
      setErrorSubmit(err.message || "No se pudo realizar el análisis de la foto principal.");
      toast.error(err.message || "Error al escanear la foto principal.");
      setPrincipalAnalizada(true);
    } finally {
      setAnalizandoPrincipal(false);
    }
  };

  const eliminarFotoPrincipal = () => {
    if (primaryPreview) URL.revokeObjectURL(primaryPreview);
    setPrimaryFile(null);
    setPrimaryPreview(null);
    setPrincipalAnalizada(false);
  };

  // --- 2. PROCESAR FOTOS SECUNDARIAS Y OCR EN TIEMPO REAL ---
  const handleSecondaryFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const nuevosArchivos = Array.from(e.target.files).filter(f => f.type.startsWith("image/"));
    
    const espacioDisponible = 5 - (1 + secundarias.length);
    if (espacioDisponible <= 0) {
      toast.warning("Se permite un máximo de 5 fotografías por publicación.");
      return;
    }

    const archivosAceptados = nuevosArchivos.slice(0, espacioDisponible);
    const nuevasItems: SecondaryPhotoState[] = archivosAceptados.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      status: "pending"
    }));

    setSecundarias(prev => [...prev, ...nuevasItems]);
    nuevasItems.forEach(item => verificarOcrFoto(item));
  };

  const verificarOcrFoto = async (item: SecondaryPhotoState) => {
    try {
      const formData = new FormData();
      formData.append("file", item.file);

      const res = await fetch(`${getApiUrl()}/products/check-photo-ocr`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("vamaar_token") || token}`
        },
        body: formData
      });

      if (!res.ok) {
        setSecundarias(prev =>
          prev.map(s => (s.id === item.id ? { ...s, status: "error", reason: "Error al validar la foto" } : s))
        );
        return;
      }

      const data = await res.json();
      if (data.ok) {
        setSecundarias(prev =>
          prev.map(s => (s.id === item.id ? { ...s, status: "ok" } : s))
        );
      } else {
        setSecundarias(prev =>
          prev.map(s => (s.id === item.id ? { ...s, status: "error", reason: data.reason } : s))
        );
        toast.error(`Foto rechazada: ${data.reason}`);
      }
    } catch (err: any) {
      setSecundarias(prev =>
        prev.map(s => (s.id === item.id ? { ...s, status: "error", reason: "Error de red" } : s))
      );
    }
  };

  const eliminarFotoSecundaria = (id: string) => {
    setSecundarias(prev => {
      const item = prev.find(s => s.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter(s => s.id !== id);
    });
  };

  // --- FORMATEADOR DE PRECIO ---
  const handlePrecioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const numbersOnly = rawVal.replace(/\D/g, "");
    if (!numbersOnly) {
      setPriceDisplay("");
      setPrice("");
      return;
    }
    const parsedNum = parseInt(numbersOnly, 10);
    setPrice(numbersOnly);
    setPriceDisplay(`$ ${parsedNum.toLocaleString("es-AR")}`);
  };

  // --- VALIDACIÓN Y NAVEGACIÓN ---
  const irAlSiguiente = () => {
    setErrorSubmit(null);
    if (pasoActual === 1) {
      if (!primaryFile) {
        setErrorSubmit("Debes subir la foto principal de tu producto.");
        return;
      }
      if (analizandoPrincipal) {
        setErrorSubmit("Esperá a que termine el análisis de la foto principal.");
        return;
      }
      const hayFotosConError = secundarias.some(s => s.status === "error");
      if (hayFotosConError) {
        setErrorSubmit("Debes eliminar las fotografías rechazadas antes de continuar.");
        return;
      }
      const hayFotosPendientes = secundarias.some(s => s.status === "pending");
      if (hayFotosPendientes) {
        setErrorSubmit("Esperá a que termine la verificación de las fotos secundarias.");
        return;
      }
      setPasoActual(2);
    } else if (pasoActual === 2) {
      if (!title.trim()) {
        setErrorSubmit("Escribe el título comercial del producto.");
        return;
      }
      if (!description.trim()) {
        setErrorSubmit("Ingresa una descripción para tu producto.");
        return;
      }
      setPasoActual(3);
    } else if (pasoActual === 3) {
      if (!price || parseFloat(price) <= 0) {
        setErrorSubmit("El precio debe ser mayor a $0.");
        return;
      }
      if (!stock || parseInt(stock) <= 0) {
        setErrorSubmit("Ingresa un stock disponible de al menos 1.");
        return;
      }
      if (!weight || parseFloat(weight) <= 0) {
        setErrorSubmit("Ingresa un peso válido de embalaje.");
        return;
      }
      setPasoActual(4);
    }
  };

  const irAlAtras = () => {
    setErrorSubmit(null);
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
    }
  };

  // --- COMPRESOR DE IMÁGENES EN EL CLIENTE ---
  const comprimirImagenCliente = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (file.size <= 300 * 1024) {
        resolve(file);
        return;
      }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const fileComprimido = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(fileComprimido);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            0.8
          );
        } else {
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
      img.src = url;
    });
  };

  // --- SUBMIT REAL AL BACKEND ---
  const handlePublicarProducto = async () => {
    setErrorSubmit(null);
    setPublicando(true);

    try {
      const tokenSesion = localStorage.getItem("vamaar_token") || token;
      const dataForm = new FormData();
      dataForm.append("title", formatearTituloProducto(title));
      dataForm.append("price", price);
      dataForm.append("category", category);
      dataForm.append("condition", condition.toLowerCase());

      const descripcionFinal = tags.trim()
        ? `${description.trim()}\n\nEtiquetas: ${tags.trim()}`
        : description.trim();

      dataForm.append("description", descripcionFinal);
      dataForm.append("stock", stock);
      dataForm.append("weight_kg", weight);
      dataForm.append("height_cm", height);
      dataForm.append("width_cm", width);
      dataForm.append("length_cm", length);

      // Comprimir foto principal
      if (primaryFile) {
        const primaryOptim = await comprimirImagenCliente(primaryFile);
        dataForm.append("files", primaryOptim);
      }

      // Comprimir fotos secundarias en paralelo
      const fotosAprobadas = secundarias.filter(sec => sec.status === "ok");
      const secundariasOptims = await Promise.all(
        fotosAprobadas.map(sec => comprimirImagenCliente(sec.file))
      );
      secundariasOptims.forEach(fOpt => {
        dataForm.append("files", fOpt);
      });

      const res = await fetch(`${getApiUrl()}/products/create/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenSesion}`
        },
        body: dataForm
      });

      if (res.status === 401) {
        toast.warning("Tu sesión expiró. Iniciá sesión de nuevo.");
        window.location.href = "/auth";
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Error al registrar la publicación.");
      }

      toast.success("Tu publicación fue recibida y está activa en el catálogo.", "¡Producto publicado!");
      
      // Cerrar modal y limpiar
      onClose();
      resetFormulario();
      onSuccess?.();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vamaar:refresh-publications'));
      }

      // Redirigir a Mis Publicaciones con scroll automático hacia la lista
      router.push("/mi-objetia?tab=publications&scroll=lista-publicaciones");
      router.refresh();

    } catch (err: any) {
      setPublicando(false);
      setErrorSubmit(err.message || "Ocurrió un error al enviar el producto al servidor.");
      toast.error(err.message || "No se pudo publicar el producto.");
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-[2px] animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !publicando) handleCerrar();
      }}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-2xl border border-[#dadce0] shadow-2xl shadow-black/15 overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ================================================================= */}
        {/* 1. CABECERA: TÍTULO Y BOTÓN DE CIERRE (GOOGLE AI STUDIO LIGHT) */}
        {/* ================================================================= */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#edf0f2] flex items-center justify-between gap-3 bg-white">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-[#202124] truncate flex items-center gap-2">
              <Package className="h-4 w-4 text-[#1a73e8]" />
              Publicar un Producto
            </h3>
            <p className="text-[11px] text-[#5f6368] truncate">
              Completá los datos para publicar tu artículo en el catálogo de Objetia
            </p>
          </div>

          <button
            type="button"
            onClick={handleCerrar}
            disabled={publicando}
            className="p-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] rounded-full transition cursor-pointer flex-shrink-0"
            title="Cerrar ventana"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ================================================================= */}
        {/* 2. STEPPER HORIZONTAL: 4 PASOS */}
        {/* ================================================================= */}
        <div className="px-5 sm:px-6 py-3 bg-[#f8f9fa] border-b border-[#edf0f2] select-none">
          <div className="flex items-center justify-between max-w-lg mx-auto relative">
            
            {/* Línea conectora de fondo */}
            <div className="absolute left-6 right-6 top-3.5 h-[2px] bg-[#dadce0] -z-0">
              <div 
                className="h-full bg-[#1a73e8] transition-all duration-300"
                style={{ width: `${((pasoActual - 1) / 3) * 100}%` }}
              />
            </div>

            {/* Paso 1: Fotos */}
            <div className="flex flex-col items-center gap-1 relative z-10">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all border ${
                pasoActual > 1 
                  ? 'bg-[#1a73e8] border-[#1a73e8] text-white shadow-xs' 
                  : pasoActual === 1 
                    ? 'bg-white border-2 border-[#1a73e8] text-[#1a73e8] ring-4 ring-[#1a73e8]/15 font-black' 
                    : 'bg-white border-[#dadce0] text-[#80868b]'
              }`}>
                {pasoActual > 1 ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : "1"}
              </span>
              <span className={`text-[10.5px] font-semibold ${pasoActual === 1 ? 'text-[#1a73e8]' : 'text-[#5f6368]'}`}>
                Fotos
              </span>
            </div>

            {/* Paso 2: Info */}
            <div className="flex flex-col items-center gap-1 relative z-10">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all border ${
                pasoActual > 2 
                  ? 'bg-[#1a73e8] border-[#1a73e8] text-white shadow-xs' 
                  : pasoActual === 2 
                    ? 'bg-white border-2 border-[#1a73e8] text-[#1a73e8] ring-4 ring-[#1a73e8]/15 font-black' 
                    : 'bg-white border-[#dadce0] text-[#80868b]'
              }`}>
                {pasoActual > 2 ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : "2"}
              </span>
              <span className={`text-[10.5px] font-semibold ${pasoActual === 2 ? 'text-[#1a73e8]' : 'text-[#5f6368]'}`}>
                Información
              </span>
            </div>

            {/* Paso 3: Precio & Envío */}
            <div className="flex flex-col items-center gap-1 relative z-10">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all border ${
                pasoActual > 3 
                  ? 'bg-[#1a73e8] border-[#1a73e8] text-white shadow-xs' 
                  : pasoActual === 3 
                    ? 'bg-white border-2 border-[#1a73e8] text-[#1a73e8] ring-4 ring-[#1a73e8]/15 font-black' 
                    : 'bg-white border-[#dadce0] text-[#80868b]'
              }`}>
                {pasoActual > 3 ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : "3"}
              </span>
              <span className={`text-[10.5px] font-semibold ${pasoActual === 3 ? 'text-[#1a73e8]' : 'text-[#5f6368]'}`}>
                Precio & Envío
              </span>
            </div>

            {/* Paso 4: Revisión */}
            <div className="flex flex-col items-center gap-1 relative z-10">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all border ${
                pasoActual === 4 
                  ? 'bg-white border-2 border-[#1a73e8] text-[#1a73e8] ring-4 ring-[#1a73e8]/15 font-black' 
                  : 'bg-white border-[#dadce0] text-[#80868b]'
              }`}>
                4
              </span>
              <span className={`text-[10.5px] font-semibold ${pasoActual === 4 ? 'text-[#1a73e8]' : 'text-[#5f6368]'}`}>
                Publicar
              </span>
            </div>

          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. CUERPO SCROLLEABLE DEL MODAL */}
        {/* ================================================================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-white">
          
          {/* Alerta de Error */}
          {errorSubmit && (
            <div className="bg-[#fce8e6] border border-[#fad2cf] text-[#c5221f] px-3.5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold animate-fade-in">
              <AlertTriangle className="h-4 w-4 text-[#c5221f] flex-shrink-0" />
              <span>{errorSubmit}</span>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* PASO 1: FOTOS */}
          {/* ------------------------------------------------------------- */}
          {pasoActual === 1 && (
            <div className="space-y-5 animate-fade-in">
              
              {/* Foto Principal */}
              <div className="bg-[#f8f9fa] border-2 border-dashed border-[#dadce0] rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#202124] flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-[#1a73e8]" />
                      1. Foto Principal (Obligatoria)
                    </h4>
                    <p className="text-[11px] text-[#5f6368] mt-0.5">
                      Subí una foto nítida donde el producto se aprecie completo. La IA la analizará automáticamente.
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#1a73e8] bg-[#e8f0fe] px-2 py-0.5 rounded-full border border-[#d2e3fc]">
                    <Sparkles className="h-3 w-3" /> Auto-análisis IA
                  </span>
                </div>

                {!primaryPreview ? (
                  <div
                    onClick={() => primaryInputRef.current?.click()}
                    className="bg-white rounded-xl p-6 sm:p-8 text-center cursor-pointer border border-[#dadce0] hover:border-[#1a73e8] transition space-y-2 group"
                  >
                    <input
                      ref={primaryInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePrimaryFileSelect}
                      className="hidden"
                    />
                    <div className="h-10 w-10 rounded-full bg-[#e8f0fe] flex items-center justify-center mx-auto text-[#1a73e8] group-hover:scale-110 transition-transform">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#202124]">Hacé clic para seleccionar la Foto Principal</p>
                      <p className="text-[11px] text-[#80868b] mt-0.5">JPG, PNG o WEBP (Máx. 8 MB)</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-3 sm:p-4 border border-[#dadce0] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <img
                        src={primaryPreview}
                        alt="Foto Principal"
                        className="h-20 w-20 object-cover rounded-xl border border-[#dadce0] flex-shrink-0"
                      />
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
                          Foto Principal Cargada
                          {principalAnalizada && <CheckCircle2 className="h-4 w-4 text-[#137333]" />}
                        </p>
                        <p className="text-[11px] text-[#5f6368] truncate max-w-[200px]">{primaryFile?.name}</p>

                        {analizandoPrincipal ? (
                          <div className="flex items-center gap-1.5 text-xs text-[#1a73e8] font-bold mt-1">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Escaneando con IA...
                          </div>
                        ) : principalAnalizada ? (
                          <div className="flex items-center gap-1 text-[10.5px] text-[#137333] font-semibold bg-[#e6f4ea] px-2 py-0.5 rounded-md border border-[#ceead6]">
                            <Sparkles className="h-3 w-3" /> Datos autocompletados
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={eliminarFotoPrincipal}
                      className="p-1.5 text-[#5f6368] hover:text-[#c5221f] hover:bg-[#fce8e6] rounded-lg transition flex items-center gap-1 text-xs font-semibold self-end sm:self-center cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Cambiar foto
                    </button>
                  </div>
                )}
              </div>

              {/* Fotos Secundarias */}
              {primaryFile && (
                <div className="space-y-3 pt-3 border-t border-[#edf0f2]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#202124]">
                        2. Fotos Secundarias (Máx. 5 fotos en total)
                      </h4>
                      <p className="text-[11px] text-[#5f6368] mt-0.5">
                        Subí fotos adicionales mostrando detalles, ángulos y terminaciones.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#1a73e8] bg-[#e8f0fe] px-2.5 py-0.5 rounded-lg border border-[#d2e3fc]">
                      {1 + secundarias.length} / 5 Fotos
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Portada en la grilla */}
                    <div className="relative bg-[#f8f9fa] rounded-xl border-2 border-[#1a73e8] p-2 text-center flex flex-col items-center justify-between">
                      <img src={primaryPreview!} alt="Portada" className="h-20 w-full object-cover rounded-lg" />
                      <span className="mt-1.5 px-2 py-0.2 text-[9px] font-bold bg-[#1a73e8] text-white rounded-full uppercase">
                        Portada
                      </span>
                    </div>

                    {/* Fotos Secundarias */}
                    {secundarias.map(item => (
                      <div key={item.id} className="relative bg-[#f8f9fa] rounded-xl border border-[#dadce0] p-2 flex flex-col justify-between items-center text-center space-y-1.5">
                        <img src={item.preview} alt="Secundaria" className="h-20 w-full object-cover rounded-lg" />

                        {item.status === "pending" && (
                          <div className="w-full flex items-center justify-center gap-1 text-[9.5px] font-bold text-[#b06000] bg-[#fef7e0] border border-[#fce8b2] py-0.5 rounded">
                            <Loader2 className="h-3 w-3 animate-spin text-[#b06000]" />
                            <span>Verificando...</span>
                          </div>
                        )}

                        {item.status === "ok" && (
                          <div className="w-full flex items-center justify-center gap-1 text-[9.5px] font-bold text-[#137333] bg-[#e6f4ea] border border-[#ceead6] py-0.5 rounded">
                            <Check className="h-3 w-3" />
                            <span>Aceptada</span>
                          </div>
                        )}

                        {item.status === "error" && (
                          <div className="w-full flex flex-col items-center gap-0.5 text-[9.5px] font-bold text-[#c5221f] bg-[#fce8e6] border border-[#fad2cf] p-1 rounded">
                            <span>Rechazada</span>
                            <button
                              type="button"
                              onClick={() => eliminarFotoSecundaria(item.id)}
                              className="mt-0.5 px-1.5 py-0.2 bg-[#c5221f] text-white rounded text-[8.5px]"
                            >
                              Eliminar
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => eliminarFotoSecundaria(item.id)}
                          className="absolute top-1 right-1 p-1 bg-white/90 text-[#5f6368] hover:text-[#c5221f] rounded-full shadow-xs transition cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    {/* Botón añadir más fotos */}
                    {1 + secundarias.length < 5 && (
                      <div
                        onClick={() => secondaryInputRef.current?.click()}
                        className="bg-[#f8f9fa] border-2 border-dashed border-[#dadce0] rounded-xl p-3 text-center cursor-pointer hover:border-[#1a73e8] hover:bg-[#e8f0fe]/20 transition flex flex-col items-center justify-center gap-1.5 h-28"
                      >
                        <input
                          ref={secondaryInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleSecondaryFilesSelect}
                          className="hidden"
                        />
                        <Upload className="h-4 w-4 text-[#80868b]" />
                        <span className="text-[11px] font-bold text-[#5f6368]">Añadir foto</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* PASO 2: INFORMACIÓN BÁSICA */}
          {/* ------------------------------------------------------------- */}
          {pasoActual === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#202124] block">Título del Producto *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Juego de 2 Veladores de Noche en Madera Maciza"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/15 text-[#202124] bg-white transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#202124] block">Categoría *</label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/15 text-[#202124] bg-white cursor-pointer appearance-none pr-10 transition"
                    >
                      <option value="Iluminación">Iluminación</option>
                      <option value="Sillones">Sillones</option>
                      <option value="Mesas">Mesas</option>
                      <option value="Sillas">Sillas</option>
                      <option value="Placards y Armarios">Placards y Armarios</option>
                      <option value="Camas y Respaldos">Camas y Respaldos</option>
                      <option value="Estanterías">Estanterías</option>
                      <option value="Espejos">Espejos</option>
                      <option value="Vajilleros y Racks">Vajilleros y Racks</option>
                      <option value="Jardín y Exterior">Jardín y Exterior</option>
                      <option value="Adornos y Cuadros">Adornos y Cuadros</option>
                    </select>
                    <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#80868b] pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#202124] block">Condición *</label>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setCondition('USED')}
                      className={`flex-1 py-2 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                        condition === 'USED' 
                          ? 'border-[#202124] bg-[#202124] text-white shadow-xs' 
                          : 'border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f8f9fa] hover:text-[#202124]'
                      }`}
                    >
                      Usado
                    </button>
                    <button
                      type="button"
                      onClick={() => setCondition('NEW')}
                      className={`flex-1 py-2 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                        condition === 'NEW' 
                          ? 'border-[#202124] bg-[#202124] text-white shadow-xs' 
                          : 'border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f8f9fa] hover:text-[#202124]'
                      }`}
                    >
                      Nuevo
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#202124] block">Descripción Comercial *</label>
                <textarea 
                  rows={3}
                  required
                  placeholder="Detalles del producto, materiales, estado y terminaciones..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/15 text-[#202124] bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#202124] flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-[#1a73e8]" />
                  Tags y Palabras Clave
                </label>
                <input 
                  type="text" 
                  placeholder="Ej: velador, madera, noche, dormitorio, luz cálida"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/15 text-[#202124] bg-white transition"
                />
                <p className="text-[10.5px] text-[#80868b]">Separar por comas. Facilitan que tu producto aparezca en búsquedas y filtros.</p>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* PASO 3: PRECIO, STOCK Y EMBALAJE */}
          {/* ------------------------------------------------------------- */}
          {pasoActual === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#202124] block">Precio de Venta (ARS) *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="$ 0"
                    value={priceDisplay}
                    onChange={handlePrecioChange}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/15 font-bold text-[#202124] bg-white transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#202124] block">Stock Disponible *</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/15 text-[#202124] bg-white transition"
                  />
                </div>
              </div>

              {/* Embalaje Correo Argentino */}
              <div className="bg-[#f8f9fa] p-4 rounded-xl border border-[#edf0f2] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
                    <Scale className="h-3.5 w-3.5 text-[#1a73e8]" />
                    Datos de Embalaje y Envíos (Correo Argentino)
                  </h4>
                  <span className="text-[10px] font-mono text-[#5f6368]">Dimensiones estimadas</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="space-y-0.5">
                    <label className="text-[10.5px] font-semibold text-[#5f6368] block">Peso (kg) *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#dadce0] font-semibold text-[#202124] bg-white focus:outline-none focus:border-[#1a73e8]"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[10.5px] font-semibold text-[#5f6368] block">Alto (cm) *</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#dadce0] font-semibold text-[#202124] bg-white focus:outline-none focus:border-[#1a73e8]"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[10.5px] font-semibold text-[#5f6368] block">Ancho (cm) *</label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#dadce0] font-semibold text-[#202124] bg-white focus:outline-none focus:border-[#1a73e8]"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[10.5px] font-semibold text-[#5f6368] block">Largo (cm) *</label>
                    <input
                      type="number"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#dadce0] font-semibold text-[#202124] bg-white focus:outline-none focus:border-[#1a73e8]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* PASO 4: REVISIÓN */}
          {/* ------------------------------------------------------------- */}
          {pasoActual === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-[#f8f9fa] p-4 rounded-xl border border-[#edf0f2] space-y-3">
                <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider">
                  Resumen de tu Publicación
                </h4>

                <div className="flex items-start gap-3.5">
                  {primaryPreview && (
                    <img src={primaryPreview} alt="Portada" className="h-20 w-20 object-cover rounded-xl border border-[#dadce0] flex-shrink-0" />
                  )}
                  <div className="space-y-1 min-w-0">
                    <h5 className="text-xs sm:text-sm font-bold text-[#202124] truncate">{title}</h5>
                    <p className="text-xs text-[#1a73e8] font-bold">$ {parseFloat(price).toLocaleString("es-AR")}</p>
                    <p className="text-[11px] text-[#5f6368]">{category} · {condition === 'NEW' ? 'Nuevo' : 'Usado'} · {stock} disponible(s)</p>
                    <p className="text-[10.5px] text-[#80868b]">{1 + secundarias.filter(s => s.status === 'ok').length} fotos adjuntas verificadas</p>
                  </div>
                </div>

                <div className="text-xs text-[#5f6368] space-y-1 pt-2 border-t border-[#edf0f2]">
                  <p><span className="font-semibold text-[#202124]">Descripción:</span> {description}</p>
                  {tags && <p><span className="font-semibold text-[#202124]">Etiquetas:</span> {tags}</p>}
                  <p><span className="font-semibold text-[#202124]">Envío Correo Argentino:</span> {weight} kg · {height}x{width}x{length} cm</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ================================================================= */}
        {/* 4. PIE STICKY: BOTONES ATRÁS, SIGUIENTE / CONFIRMAR */}
        {/* ================================================================= */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-[#edf0f2] bg-[#f8f9fa] flex items-center justify-between rounded-b-2xl">
          {pasoActual > 1 ? (
            <button
              type="button"
              onClick={irAlAtras}
              disabled={publicando}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#5f6368] hover:text-[#202124] hover:bg-[#edf0f2] rounded-lg transition cursor-pointer"
            >
              Atrás
            </button>
          ) : (
            <div />
          )}

          {pasoActual < 4 ? (
            <button
              type="button"
              onClick={irAlSiguiente}
              className="px-5 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              Siguiente <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublicarProducto}
              disabled={publicando}
              className="px-6 py-2 bg-[#137333] hover:bg-[#0d652d] text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {publicando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {publicando ? "Publicando..." : "Confirmar y Publicar"}
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
