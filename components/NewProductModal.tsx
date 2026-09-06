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

export const TAXONOMIA_OBJETIA: Record<string, string[]> = {
  "Iluminación": [
    "Lámparas de techo y colgantes",
    "Veladores y lámparas de mesa",
    "Lámparas de pie",
    "Apliques de pared",
    "Iluminación de exterior",
    "Otras luces"
  ],
  "Sillones": [
    "Sillones de 2 o más cuerpos",
    "Sillones individuales y poltronas",
    "Chaiselongues y esquineros",
    "Futones y sofá camas",
    "Puffs y banquetas tapizadas"
  ],
  "Mesas": [
    "Mesas de comedor",
    "Mesas ratonas y de centro",
    "Mesas auxiliares y laterales",
    "Escritorios y mesas de trabajo",
    "Mesas de luz",
    "Barras y mesas altas"
  ],
  "Sillas": [
    "Sillas de comedor",
    "Sillas de oficina y ergonómicas",
    "Banquetas y taburetes",
    "Sillas mecedoras",
    "Sillas plegables y apilables"
  ],
  "Placards y Armarios": [
    "Placards y roperos",
    "Cómodas y cajoneras",
    "Zapateros",
    "Armarios auxiliares"
  ],
  "Camas y Respaldos": [
    "Respaldos de cama",
    "Camas y sommiers",
    "Mesas de noche integradas",
    "Cunas y camas infantiles"
  ],
  "Estanterías": [
    "Bibliotecas y estanterías altas",
    "Estantes flotantes y de pared",
    "Modulares y divisores de ambiente"
  ],
  "Espejos": [
    "Espejos de pared",
    "Espejos de pie y cuerpo entero",
    "Espejos con marco de madera / diseño",
    "Espejos circulares y orgánicos"
  ],
  "Vajilleros y Racks": [
    "Racks de TV y centros de entretenimiento",
    "Vajilleros y aparadores",
    "Bahiuts y consolas de entrada",
    "Vitrinas"
  ],
  "Jardín y Exterior": [
    "Juegos de living exterior",
    "Mesas y sillas de jardín",
    "Reposeras y camastros",
    "Macetas y pedestales"
  ],
  "Adornos y Cuadros": [
    "Cuadros y marcos",
    "Esculturas y objetos de diseño",
    "Jarrones y floreros",
    "Relojes de pared",
    "Candelabros y porta velas"
  ]
};

export const MATERIALES_OBJETIA = [
  "Madera maciza",
  "Hierro / Metal",
  "Vidrio / Cristal",
  "Cerámica / Mármol",
  "Cuero natural / Cuero ecológico",
  "Tela / Tapizado / Lino",
  "Fibras naturales / Ratán / Mimbre",
  "Melamina / Enchapado",
  "Bronce / Cobre",
  "Plástico / Acrílico",
  "Otro material"
];

export const COLORES_OBJETIA = [
  "Madera natural",
  "Negro",
  "Blanco",
  "Dorado / Bronce",
  "Gris",
  "Beige / Arena",
  "Marrón / Chocolate",
  "Verde",
  "Azul / Petróleo",
  "Terracota / Óxido",
  "Multicolor / Otro"
];

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
  const [mostrarRecomendaciones, setMostrarRecomendaciones] = useState(false);

  // --- FOTO PRINCIPAL (Paso 1) ---
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [primaryPreview, setPrimaryPreview] = useState<string | null>(null);
  const [analizandoPrincipal, setAnalizandoPrincipal] = useState(false);
  const [principalAnalizada, setPrincipalAnalizada] = useState(false);
  const primaryInputRef = useRef<HTMLInputElement>(null);

  // --- FOTOS SECUNDARIAS (Paso 1b - Máx. 10 fotos en total contando la principal) ---
  const [secundarias, setSecundarias] = useState<SecondaryPhotoState[]>([]);
  const secondaryInputRef = useRef<HTMLInputElement>(null);

  // --- FORMULARIO PRODUCTO ---
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Iluminación");
  const [subcategory, setSubcategory] = useState("Lámparas de techo y colgantes");
  const [material, setMaterial] = useState("Madera maciza");
  const [color, setColor] = useState("Madera natural");
  const [condition, setCondition] = useState("USED"); // USED or NEW
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [price, setPrice] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [stock, setStock] = useState("1");

  const handleCategoryChange = (nuevaCat: string) => {
    setCategory(nuevaCat);
    const subcats = TAXONOMIA_OBJETIA[nuevaCat] || [];
    if (subcats.length > 0) {
      setSubcategory(subcats[0]);
    } else {
      setSubcategory("");
    }
  };

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
    if (primaryPreview && primaryPreview.startsWith("blob:")) URL.revokeObjectURL(primaryPreview);
    secundarias.forEach(s => URL.revokeObjectURL(s.preview));
    setPrimaryFile(null);
    setPrimaryPreview(null);
    setSecundarias([]);
    setPrincipalAnalizada(false);
    setAnalizandoPrincipal(false);
    setTitle("");
    setCategory("Iluminación");
    setSubcategory("Lámparas de techo y colgantes");
    setMaterial("Madera maciza");
    setColor("Madera natural");
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

    if (primaryPreview && primaryPreview.startsWith("blob:")) URL.revokeObjectURL(primaryPreview);
    const newPreview = URL.createObjectURL(file);
    setPrimaryFile(file);
    setPrimaryPreview(newPreview);
    setPrincipalAnalizada(false);
    setAnalizandoPrincipal(true);
    setErrorSubmit(null);

    // Comprimir en cliente para que la subida sea ultra-rápida y ligera
    try {
      const fileOptim = await comprimirImagenCliente(file);
      await analizarFotoPrincipal(fileOptim);
    } catch (optErr) {
      console.warn("Aviso en compresión de imagen previa:", optErr);
      await analizarFotoPrincipal(file);
    }
  };

  const analizarFotoPrincipal = async (file: File) => {
    setAnalizandoPrincipal(true);
    setErrorSubmit(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const headers: Record<string, string> = {};
      const tokenSesion = localStorage.getItem("vamaar_token") || token;
      if (tokenSesion) {
        headers["Authorization"] = `Bearer ${tokenSesion}`;
      }

      const res = await fetch(`${getApiUrl()}/products/analyze-primary-photo`, {
        method: "POST",
        headers,
        body: formData
      });

      if (!res.ok) {
        toast.info("Foto cargada con éxito. Podés ingresar los datos a continuación.");
        setPrincipalAnalizada(true);
        return;
      }

      const data = await res.json();

      if (data.ai_analyzed) {
        if (data.title) setTitle(data.title);
        if (data.category && TAXONOMIA_OBJETIA[data.category]) {
          setCategory(data.category);
          const subcats = TAXONOMIA_OBJETIA[data.category];
          if (data.subcategory && subcats.includes(data.subcategory)) {
            setSubcategory(data.subcategory);
          } else if (subcats.length > 0) {
            setSubcategory(subcats[0]);
          }
        }
        if (data.material) setMaterial(data.material);
        if (data.color) setColor(data.color);
        if (data.description) setDescription(data.description);
        if (data.tags) setTags(data.tags);
        if (data.weight_kg) setWeight(String(data.weight_kg));
        if (data.height_cm) setHeight(String(data.height_cm));
        if (data.width_cm) setWidth(String(data.width_cm));
        if (data.length_cm) setLength(String(data.length_cm));
        toast.success("Foto cargada y datos iniciales listos.");
      } else {
        toast.info("Foto cargada con éxito.");
      }

      setPrincipalAnalizada(true);
    } catch (err: any) {
      console.warn("Aviso al analizar foto principal:", err);
      toast.info("Foto cargada. Podés ingresar los datos de tu objeto en el siguiente paso.");
      setPrincipalAnalizada(true);
    } finally {
      setAnalizandoPrincipal(false);
    }
  };

  const eliminarFotoPrincipal = () => {
    if (primaryPreview && primaryPreview.startsWith("blob:")) URL.revokeObjectURL(primaryPreview);
    setPrimaryFile(null);
    setPrimaryPreview(null);
    setPrincipalAnalizada(false);
    setAnalizandoPrincipal(false);
  };

  // --- 2. PROCESAR FOTOS SECUNDARIAS (HASTA 10 FOTOS EN TOTAL) ---
  const handleSecondaryFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const nuevosArchivos = Array.from(e.target.files);
    
    const espacioDisponible = 10 - (1 + secundarias.length);
    if (espacioDisponible <= 0) {
      toast.warning("Se permite un máximo de 10 fotografías por publicación.");
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
      if (subcategory) dataForm.append("subcategory", subcategory);
      if (material) dataForm.append("material", material);
      if (color) dataForm.append("color", color);
      if (tags) dataForm.append("tags", tags);
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
      
      // Limpiar formulario y cerrar modal
      resetFormulario();
      onClose();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vamaar:refresh-publications'));
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/mi-objetia?tab=publications&scroll=lista-publicaciones");
      }

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
              
              {/* Encabezado Paso 1 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#dadce0]">
                <div>
                  <h3 className="text-base font-bold text-[#202124]">Mostranos tu objeto</h3>
                  <p className="text-xs text-[#5f6368] mt-0.5 leading-relaxed">
                    Hacé que tu objeto se haga notar. Una buena foto puede hacer la diferencia a la hora de vender. Mirá nuestras recomendaciones antes de subir las tuyas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarRecomendaciones(true)}
                  className="self-start sm:self-center px-3.5 py-1.5 rounded-lg border border-[#dadce0] bg-white hover:bg-[#f8f9fa] text-[#1a73e8] hover:text-[#174ea6] text-xs font-semibold tracking-wide transition shadow-2xs cursor-pointer flex-shrink-0"
                >
                  Ver recomendaciones
                </button>
              </div>

              {/* Foto Principal de Portada */}
              <div className="bg-[#f8f9fa] border-2 border-dashed border-[#dadce0] rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#202124] flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-[#1a73e8]" />
                      Foto de Portada (Obligatoria)
                    </h4>
                    <p className="text-[11px] text-[#5f6368] mt-0.5">
                      Elegí la foto que mejor represente tu objeto y mostralo completo con buena luz.
                    </p>
                  </div>
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
                      <p className="text-xs font-bold text-[#202124]">Hacé clic para seleccionar la Foto de Portada</p>
                      <p className="text-[11px] text-[#80868b] mt-0.5">JPG, PNG o WEBP (Máx. 8 MB)</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-3 sm:p-4 border border-[#dadce0] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <img
                        src={primaryPreview}
                        alt="Foto Principal"
                        className="h-20 w-20 object-cover rounded-xl border border-[#dadce0] flex-shrink-0 bg-[#f8f9fa]"
                      />
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
                          Foto de portada cargada
                          {principalAnalizada && <CheckCircle2 className="h-4 w-4 text-[#137333]" />}
                        </p>
                        <p className="text-[11px] text-[#5f6368] truncate max-w-[200px]">{primaryFile?.name}</p>

                        {analizandoPrincipal ? (
                          <div className="flex items-center gap-1.5 text-xs text-[#1a73e8] font-semibold mt-1">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Identificando detalles de tu objeto...
                          </div>
                        ) : principalAnalizada ? (
                          <div className="flex items-center gap-1 text-[10.5px] text-[#137333] font-semibold bg-[#e6f4ea] px-2 py-0.5 rounded-md border border-[#ceead6]">
                            <Check className="h-3 w-3" /> Datos iniciales listos
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

              {/* Fotos Secundarias (hasta 10 en total) */}
              {primaryFile && (
                <div className="space-y-3 pt-3 border-t border-[#edf0f2]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#202124]">
                        Fotos adicionales (Máximo 10 fotos en total)
                      </h4>
                      <p className="text-[11px] text-[#5f6368] mt-0.5">
                        Mostrá distintos ángulos, detalles de materiales, terminaciones o marcas de uso.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#1a73e8] bg-[#e8f0fe] px-2.5 py-0.5 rounded-lg border border-[#d2e3fc]">
                      {1 + secundarias.length} / 10 Fotos
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
                    {1 + secundarias.length < 10 && (
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
                        <span className="text-[11px] font-bold text-[#5f6368]">+ Agregar fotos</span>
                      </div>
                    )}
                  </div>

                  {/* Recomendación amigable si hay menos de 4 fotos (no bloqueante) */}
                  {1 + secundarias.length < 4 && (
                    <div className="p-3 bg-[#e8f0fe]/50 border border-[#d2e3fc] rounded-xl text-xs text-[#1a73e8] flex items-start gap-2">
                      <Info className="h-4 w-4 text-[#1a73e8] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-[#174ea6]">Recomendación de Objetia:</p>
                        <p className="text-[11px] text-[#3c4043] mt-0.5">
                          Sugerimos subir al menos 4 fotos (mostrando detalles, ángulos y marcas) para generar mayor confianza en los compradores y encontrar interesado más rápido.
                        </p>
                      </div>
                    </div>
                  )}
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

              {/* Categoría y Subcategoría Dinámica */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#202124] block">Categoría *</label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/15 text-[#202124] bg-white cursor-pointer appearance-none pr-10 transition font-medium"
                    >
                      {Object.keys(TAXONOMIA_OBJETIA).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#80868b] pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#202124] block">Subcategoría *</label>
                  <div className="relative">
                    <select
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/15 text-[#202124] bg-white cursor-pointer appearance-none pr-10 transition font-medium"
                    >
                      {(TAXONOMIA_OBJETIA[category] || []).map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                    <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#80868b] pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Material Principal y Color Predominante */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#202124] block">Material Principal *</label>
                  <div className="relative">
                    <select
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/15 text-[#202124] bg-white cursor-pointer appearance-none pr-10 transition font-medium"
                    >
                      {MATERIALES_OBJETIA.map((mat) => (
                        <option key={mat} value={mat}>{mat}</option>
                      ))}
                    </select>
                    <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#80868b] pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#202124] block">Color Predominante *</label>
                  <div className="relative">
                    <select
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/15 text-[#202124] bg-white cursor-pointer appearance-none pr-10 transition font-medium"
                    >
                      {COLORES_OBJETIA.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#80868b] pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Condición */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#202124] block">Condición del Objeto *</label>
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

              {/* Desglose Financiero de Ganancia en Vivo */}
              {(parseFloat(price) || 0) > 0 && (
                <div className="bg-[#f8f9fa] rounded-xl p-3.5 border border-[#dadce0] space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#5f6368]">
                    <span>Precio publicado (al comprador):</span>
                    <span className="font-semibold text-[#202124]">$ {(parseFloat(price) || 0).toLocaleString("es-AR")}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#5f6368]">
                    <span>Comisión por servicio Objetia (10%):</span>
                    <span className="text-[#c5221f] font-medium">- $ {Math.round((parseFloat(price) || 0) * 0.10).toLocaleString("es-AR")}</span>
                  </div>
                  <div className="pt-2 border-t border-[#dadce0] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#202124]">Recibís en tu cuenta / billetera:</span>
                    <span className="text-sm font-extrabold text-[#137333]">$ {Math.max(0, Math.round((parseFloat(price) || 0) * 0.90)).toLocaleString("es-AR")}</span>
                  </div>
                </div>
              )}

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
          {/* ------------------------------------------------------------- */}
          {/* PASO 4: REVISIÓN PREVIA Y EDICIÓN MODULAR */}
          {/* ------------------------------------------------------------- */}
          {pasoActual === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h4 className="text-sm font-bold text-[#202124]">
                    Revisión de tu publicación
                  </h4>
                  <p className="text-xs text-[#5f6368]">
                    Verificá que todo esté correcto antes de poner el objeto a la venta.
                  </p>
                </div>
                <span className="text-[11px] font-semibold bg-[#e8f0fe] text-[#1a73e8] px-2.5 py-1 rounded-full">
                  Paso final
                </span>
              </div>

              {/* CARD 1: FOTOS */}
              <div className="bg-white p-4 rounded-xl border border-[#dadce0] shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-[#f1f3f4] text-[#202124] text-xs font-bold flex items-center justify-center">1</span>
                    <h5 className="text-xs font-bold text-[#202124] uppercase tracking-wide">
                      Fotografías ({1 + secundarias.filter(s => s.status === 'ok').length})
                    </h5>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPasoActual(1)}
                    className="text-xs font-semibold text-[#1a73e8] hover:text-[#1557b0] hover:underline flex items-center gap-1"
                  >
                    Editar fotos
                  </button>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                  {primaryPreview && (
                    <div className="relative flex-shrink-0">
                      <img
                        src={primaryPreview}
                        alt="Portada"
                        className="h-16 w-16 object-cover rounded-lg border-2 border-[#1a73e8]"
                      />
                      <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-[#1a73e8] text-white px-1 py-0.2 rounded">
                        Portada
                      </span>
                    </div>
                  )}
                  {secundarias.filter(s => s.status === 'ok').map((sec, idx) => (
                    <img
                      key={sec.id || idx}
                      src={sec.preview}
                      alt={`Foto ${idx + 2}`}
                      className="h-16 w-16 object-cover rounded-lg border border-[#dadce0] flex-shrink-0"
                    />
                  ))}
                </div>
              </div>

              {/* CARD 2: DETALLES Y TAXONOMÍA */}
              <div className="bg-white p-4 rounded-xl border border-[#dadce0] shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-[#f1f3f4] text-[#202124] text-xs font-bold flex items-center justify-center">2</span>
                    <h5 className="text-xs font-bold text-[#202124] uppercase tracking-wide">
                      Detalles y Atributos
                    </h5>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPasoActual(2)}
                    className="text-xs font-semibold text-[#1a73e8] hover:text-[#1557b0] hover:underline flex items-center gap-1"
                  >
                    Editar detalles
                  </button>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[11px] text-[#5f6368] block">Título</span>
                    <p className="font-semibold text-[#202124] text-sm">{title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[11px] text-[#5f6368] block">Categoría & Subcategoría</span>
                      <p className="font-medium text-[#202124]">{category}{subcategory ? ` › ${subcategory}` : ''}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#5f6368] block">Condición</span>
                      <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md mt-0.5 ${
                        condition === 'NEW' ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-[#f1f3f4] text-[#202124]'
                      }`}>
                        {condition === 'NEW' ? 'Nuevo' : 'Usado'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-[#5f6368] block">Material principal</span>
                      <p className="font-medium text-[#202124]">{material}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#5f6368] block">Color predominante</span>
                      <p className="font-medium text-[#202124]">{color}</p>
                    </div>
                  </div>
                  {description && (
                    <div className="pt-1">
                      <span className="text-[11px] text-[#5f6368] block">Descripción</span>
                      <p className="font-normal text-[#3c4043] line-clamp-3 bg-[#f8f9fa] p-2 rounded-lg border border-[#edf0f2] mt-0.5 text-[11.5px] leading-relaxed">
                        {description}
                      </p>
                    </div>
                  )}
                  {tags && (
                    <div>
                      <span className="text-[11px] text-[#5f6368] block">Etiquetas</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {tags.split(',').map((t, i) => (
                          <span key={i} className="text-[10.5px] bg-[#f1f3f4] text-[#5f6368] px-2 py-0.5 rounded-full">
                            #{t.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 3: PRECIO Y LOGÍSTICA */}
              <div className="bg-white p-4 rounded-xl border border-[#dadce0] shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-[#f1f3f4] text-[#202124] text-xs font-bold flex items-center justify-center">3</span>
                    <h5 className="text-xs font-bold text-[#202124] uppercase tracking-wide">
                      Precio, Stock y Logística
                    </h5>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPasoActual(3)}
                    className="text-xs font-semibold text-[#1a73e8] hover:text-[#1557b0] hover:underline flex items-center gap-1"
                  >
                    Editar precio
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#f8f9fa] border border-[#edf0f2]">
                    <span className="text-[11px] text-[#5f6368] block">Precio al comprador</span>
                    <p className="text-sm font-bold text-[#202124] mt-0.5">
                      $ {parseFloat(price || '0').toLocaleString("es-AR")}
                    </p>
                    <span className="text-[10.5px] text-[#5f6368]">Comisión Objetia (10%): -${Math.round(parseFloat(price || '0') * 0.10).toLocaleString("es-AR")}</span>
                    <p className="text-xs font-bold text-[#137333] mt-1 pt-1 border-t border-[#dadce0]">
                      Recibís: ${Math.max(0, Math.round(parseFloat(price || '0') * 0.90)).toLocaleString("es-AR")}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#f8f9fa] border border-[#edf0f2] flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] text-[#5f6368] block">Unidades disponibles</span>
                      <p className="text-sm font-bold text-[#202124] mt-0.5">{stock} unidad(es)</p>
                    </div>
                    <div className="pt-1.5 border-t border-[#dadce0]">
                      <span className="text-[11px] text-[#5f6368] block">Paquetería Correo Argentino</span>
                      <p className="text-[11px] font-medium text-[#3c4043]">{weight} kg · {height}x{width}x{length} cm</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AVISO INFORMATIVO FINAL */}
              <div className="p-3 bg-[#f8f9fa] rounded-xl border border-[#edf0f2] text-center">
                <p className="text-xs text-[#5f6368]">
                  Al presionar <span className="font-bold text-[#202124]">Publicar Objeto Ahora</span>, tu publicación se creará y quedará visible inmediatamente para la comunidad de Objetia.
                </p>
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

        {/* ================================================================= */}
        {/* MODAL: VER RECOMENDACIONES DE FOTOGRAFÍA (SIN ÍCONOS) */}
        {/* ================================================================= */}
        {mostrarRecomendaciones && (
          <div className="fixed inset-0 z-[100000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden animate-scale-in">
              <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#202124]">Hacé que tu objeto se luzca</h3>
                  <p className="text-xs text-[#5f6368] mt-1 leading-relaxed">
                    Las buenas fotos generan confianza, muestran mejor lo que estás vendiendo y pueden aumentar tus posibilidades de encontrar comprador. Con estos simples tips, ya estás listo para empezar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarRecomendaciones(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-[#3c4043] leading-relaxed">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-[#202124] text-xs">Aprovechá la luz natural</h4>
                  <p className="text-[#5f6368]">Siempre que puedas, sacá las fotos durante el día y en un lugar bien iluminado. Evitá luces muy amarillas, sombras fuertes o fotos oscuras.</p>
                </div>

                <div className="space-y-0.5">
                  <h4 className="font-bold text-[#202124] text-xs">Mostralo completo</h4>
                  <p className="text-[#5f6368]">Asegurate de que el objeto entre entero en la foto y dejá un poco de espacio alrededor. Para la portada, elegí la foto que mejor lo represente. Del fondo nos ocupamos nosotros.</p>
                </div>

                <div className="space-y-0.5">
                  <h4 className="font-bold text-[#202124] text-xs">Mostrá distintos ángulos</h4>
                  <p className="text-[#5f6368]">Una sola foto puede dejar dudas. Sacá fotos de frente, de costado, de atrás y desde cualquier ángulo que ayude a conocer mejor el objeto.</p>
                </div>

                <div className="space-y-0.5">
                  <h4 className="font-bold text-[#202124] text-xs">Los detalles también cuentan</h4>
                  <p className="text-[#5f6368]">Acercate a materiales, texturas, terminaciones, etiquetas, firmas o cualquier característica que haga especial a tu objeto.</p>
                </div>

                <div className="space-y-0.5">
                  <h4 className="font-bold text-[#202124] text-xs">Ayudá a imaginarlo</h4>
                  <p className="text-[#5f6368]">Además de las medidas que vas a completar después, una foto en contexto puede ayudar a entender su tamaño y proporciones.</p>
                </div>

                <div className="space-y-0.5">
                  <h4 className="font-bold text-[#202124] text-xs">Mostralo tal cual es</h4>
                  <p className="text-[#5f6368]">Si tiene una marca, desgaste, rayón o algún detalle, fotografialo. Mostrarlo genera confianza y ayuda a que quien compra sepa exactamente qué va a recibir.</p>
                </div>

                <div className="p-3.5 bg-[#f8f9fa] border border-[#dadce0] rounded-xl space-y-2 mt-2">
                  <h5 className="font-bold text-[#202124] text-xs">Para tener en cuenta</h5>
                  <ul className="space-y-1 text-[#5f6368] text-[11px]">
                    <li>• Fotos nítidas y con buena luz</li>
                    <li>• El objeto completo</li>
                    <li>• Diferentes ángulos</li>
                    <li>• Fotos de los detalles</li>
                    <li>• Una foto en contexto</li>
                    <li>• Marcas o imperfecciones visibles</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-[#f8f9fa] border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-center sm:text-left">
                  <p className="text-xs font-bold text-[#202124]">¿Listo para mostrarlo?</p>
                  <p className="text-[11px] text-[#5f6368]">Nosotros nos ocupamos de que la portada tenga la estética Objetia.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarRecomendaciones(false);
                    primaryInputRef.current?.click();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-xs cursor-pointer flex-shrink-0"
                >
                  Subir mis fotos
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
