// app/products/new/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../components/AuthContext";
import { useToast } from "../../../components/ToastContext";
import { getApiUrl } from "../../../lib/config";
import { formatearTituloProducto } from "../../../lib/format";
import { 
  ChevronLeft, 
  Upload, 
  X, 
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
  Check
} from "lucide-react";

interface SecondaryPhotoState {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "ok" | "error";
  reason?: string;
}

const MAX_IA_SCANS_PER_SESSION = 3;

export default function NewProductPage() {
  const { usuario, token, cargando } = useAuth();
  const router = useRouter();
  const toast = useToast();

  // --- PASOS DEL WIZARD ---
  const [pasoActual, setPasoActual] = useState(1); // 1: Fotos, 2: Info, 3: Medidas & Precio, 4: Revisión

  // --- CONTADOR DE ESCANEOS CON IA (Persistente en sessionStorage) ---
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

  // Escudo de autenticación
  useEffect(() => {
    if (!cargando && !usuario) {
      router.push("/auth");
    }
  }, [usuario, cargando, router]);

  if (cargando || !usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

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

    // Verificar límite estricto de escaneos por sesión
    if (scanCount >= MAX_IA_SCANS_PER_SESSION) {
      toast.info("Has alcanzado el límite de 3 análisis automáticos de fotos por sesión. Ingresá la información del producto manualmente.");
      setPrincipalAnalizada(true);
      return;
    }

    // Incrementar contador y guardar en sessionStorage para evitar bypass con F5
    const newCount = scanCount + 1;
    setScanCount(newCount);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("vamaar_ia_scans_count", String(newCount));
    }

    // Auto-analizar foto principal con IA
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
      toast.success("¡Foto principal analizada con IA! Datos auto-completados exitosamente.");
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
    
    // Máximo 5 fotos en total (1 principal + 4 secundarias)
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

    // Ejecutar verificación OCR para cada nueva foto
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

  // --- FORMATEADOR DE PRECIO EN CALIENTE ---
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

  // --- VALIDACIÓN Y NAVEGACIÓN DE PASOS ---
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

  // --- COMPRESOR ULTRA-RÁPIDO EN EL NAVEGADOR ---
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

      // Comprimir foto principal en tiempo récord
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
      router.push("/mi-espacio?tab=publications");
      router.refresh();

    } catch (err: any) {
      setPublicando(false);
      setErrorSubmit(err.message || "Ocurrió un error al enviar el producto al servidor.");
      toast.error(err.message || "No se pudo publicar el producto.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 select-none animate-fade-in">
      {/* Botón Volver */}
      <div className="mb-4">
        <Link href="/mi-espacio" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition">
          <ChevronLeft className="h-4 w-4" /> Cancelar y salir
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
        
        {/* CABECERA Y STEPPER */}
        <div className="space-y-6">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Publicar un Producto</h1>
            <p className="text-xs text-slate-500 mt-1">
              Subí primero la foto principal de tu mueble o decoración para auto-completar los datos.
            </p>
          </div>

          {/* Línea de Pasos */}
          <div className="relative flex items-center justify-between w-full max-w-lg mx-auto px-2 mt-4">
            <div className="absolute left-6 right-6 top-4 h-[2px] bg-slate-100 z-0 w-[84%]">
              <div 
                className="h-full bg-purple-600 transition-all duration-300" 
                style={{ width: `${((pasoActual - 1) / 3) * 100}%` }}
              />
            </div>

            {/* Paso 1: Fotos */}
            <div className="flex flex-col items-center gap-1.5 relative z-10">
              <span className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                pasoActual > 1 ? "bg-purple-600 border-purple-600 text-white" : pasoActual === 1 ? "bg-white border-purple-600 text-purple-600" : "bg-white border-slate-200 text-slate-400"
              }`}>
                {pasoActual > 1 ? "✓" : "1"}
              </span>
              <span className={`text-xs font-semibold ${pasoActual === 1 ? "text-purple-600" : "text-slate-500"}`}>Fotos</span>
            </div>

            {/* Paso 2: Info */}
            <div className="flex flex-col items-center gap-1.5 relative z-10">
              <span className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                pasoActual > 2 ? "bg-purple-600 border-purple-600 text-white" : pasoActual === 2 ? "bg-white border-purple-600 text-purple-600" : "bg-white border-slate-200 text-slate-400"
              }`}>
                {pasoActual > 2 ? "✓" : "2"}
              </span>
              <span className={`text-xs font-semibold ${pasoActual === 2 ? "text-purple-600" : "text-slate-500"}`}>Información</span>
            </div>

            {/* Paso 3: Medidas & Precio */}
            <div className="flex flex-col items-center gap-1.5 relative z-10">
              <span className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                pasoActual > 3 ? "bg-purple-600 border-purple-600 text-white" : pasoActual === 3 ? "bg-white border-purple-600 text-purple-600" : "bg-white border-slate-200 text-slate-400"
              }`}>
                {pasoActual > 3 ? "✓" : "3"}
              </span>
              <span className={`text-xs font-semibold ${pasoActual === 3 ? "text-purple-600" : "text-slate-500"}`}>Precio & Envío</span>
            </div>

            {/* Paso 4: Revisión */}
            <div className="flex flex-col items-center gap-1.5 relative z-10">
              <span className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                pasoActual === 4 ? "bg-white border-purple-600 text-purple-600" : "bg-white border-slate-200 text-slate-400"
              }`}>
                4
              </span>
              <span className={`text-xs font-semibold ${pasoActual === 4 ? "text-purple-600" : "text-slate-500"}`}>Publicar</span>
            </div>
          </div>
        </div>

        {/* ALERTA DE ERROR */}
        {errorSubmit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-semibold animate-fade-in mt-4">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span>{errorSubmit}</span>
          </div>
        )}

        {/* --- PASO 1: FOTO PRINCIPAL Y FOTOS SECUNDARIAS --- */}
        {pasoActual === 1 && (
          <div className="space-y-8 animate-fade-in">
            
            {/* SECCIÓN 1: FOTO PRINCIPAL DE PORTADA */}
            <div className="bg-purple-50/50 border-2 border-dashed border-purple-200 rounded-2xl p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-purple-600" />
                    1. Foto Principal (Obligatoria)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Subí una foto donde el producto se aprecie completo y nítido (ej: si es un velador de dormitorio, que se vean los dos).
                  </p>
                </div>
              </div>

              {!primaryPreview ? (
                <div
                  onClick={() => primaryInputRef.current?.click()}
                  className="bg-white rounded-xl p-8 text-center cursor-pointer border border-purple-200 hover:border-purple-500 transition space-y-3 group"
                >
                  <input
                    ref={primaryInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePrimaryFileSelect}
                    className="hidden"
                  />
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto text-purple-600 group-hover:scale-110 transition-transform">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Hacé clic para seleccionar la Foto Principal</p>
                    <p className="text-[11px] text-slate-400 mt-1">Formato JPG, PNG o WEBP (Máx. 8 MB)</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-4 border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <img
                      src={primaryPreview}
                      alt="Foto Principal"
                      className="h-24 w-24 object-cover rounded-xl border border-slate-200 flex-shrink-0"
                    />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        Foto Principal Cargada
                        {principalAnalizada && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{primaryFile?.name}</p>

                      {analizandoPrincipal ? (
                        <div className="flex items-center gap-1.5 text-xs text-purple-700 font-bold mt-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Escaneando foto...
                        </div>
                      ) : principalAnalizada ? (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          ✨ Información extraída exitosamente
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={eliminarFotoPrincipal}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
                    >
                      <Trash2 className="h-4 w-4" /> Cambiar foto
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN 2: GALERÍA DE FOTOS SECUNDARIAS CON OCR EN TIEMPO REAL */}
            {primaryFile && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      2. Fotos Secundarias (Máximo 5 fotos en total)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Subí fotos adicionales mostrando detalles, ángulos y terminaciones.
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                    {1 + secundarias.length} / 5 Fotos
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* FOTO PRINCIPAL DENTRO DE LA GRILLA */}
                  <div className="relative bg-slate-50 rounded-xl border-2 border-purple-500 p-2 text-center flex flex-col items-center justify-between">
                    <img src={primaryPreview!} alt="Portada" className="h-24 w-full object-cover rounded-lg" />
                    <span className="mt-2 px-2 py-0.5 text-[9px] font-extrabold bg-purple-600 text-white rounded-full uppercase">
                      Portada
                    </span>
                  </div>

                  {/* FOTOS SECUNDARIAS */}
                  {secundarias.map(item => (
                    <div key={item.id} className="relative bg-slate-50 rounded-xl border border-slate-200 p-2 flex flex-col justify-between items-center text-center space-y-2">
                      <img src={item.preview} alt="Secundaria" className="h-24 w-full object-cover rounded-lg" />

                      {/* INDICADOR OCR EN TIEMPO REAL CON NOMBRES EXACTOS */}
                      {item.status === "pending" && (
                        <div className="w-full flex items-center justify-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 py-1 rounded-lg">
                          <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
                          <span>Verificando foto...</span>
                        </div>
                      )}

                      {item.status === "ok" && (
                        <div className="w-full flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 py-1 rounded-lg">
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span>Foto aceptada</span>
                        </div>
                      )}

                      {item.status === "error" && (
                        <div className="w-full flex flex-col items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 p-1 rounded-lg">
                          <div className="flex items-center gap-1">
                            <XCircle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
                            <span>Foto rechazada</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => eliminarFotoSecundaria(item.id)}
                            className="mt-0.5 px-2 py-0.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-[9px] flex items-center gap-1"
                          >
                            <Trash2 className="h-2.5 w-2.5" /> Eliminar foto
                          </button>
                        </div>
                      )}

                      {/* BOTÓN BASURA DE ESQUINA */}
                      <button
                        type="button"
                        onClick={() => eliminarFotoSecundaria(item.id)}
                        className="absolute top-1 right-1 p-1 bg-white/90 text-slate-600 hover:text-red-600 rounded-full shadow-xs transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* BOTÓN AÑADIR MÁS FOTOS */}
                  {1 + secundarias.length < 5 && (
                    <div
                      onClick={() => secondaryInputRef.current?.click()}
                      className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/30 transition flex flex-col items-center justify-center gap-2 h-36"
                    >
                      <input
                        ref={secondaryInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleSecondaryFilesSelect}
                        className="hidden"
                      />
                      <Upload className="h-5 w-5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-600">Añadir otra foto</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- PASO 2: INFORMACIÓN BÁSICA DEL PRODUCTO --- */}
        {pasoActual === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 block">Título del Producto *</label>
              <input 
                type="text" 
                required
                placeholder="Ej: Juego de 2 Veladores de Noche en Madera Maciza"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-normal text-slate-800 bg-white transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 block">Categoría *</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-normal text-slate-800 bg-white cursor-pointer appearance-none pr-10 transition"
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
                  <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 block">Condición *</label>
                <div className="flex items-center gap-3 pt-1">
                  <label className={`flex-1 p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition ${condition === 'USED' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 text-slate-600'}`}>
                    <input type="radio" name="condition" value="USED" checked={condition === 'USED'} onChange={() => setCondition('USED')} className="hidden" />
                    Usado
                  </label>
                  <label className={`flex-1 p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition ${condition === 'NEW' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 text-slate-600'}`}>
                    <input type="radio" name="condition" value="NEW" checked={condition === 'NEW'} onChange={() => setCondition('NEW')} className="hidden" />
                    Nuevo
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 block">Descripción Comercial *</label>
              <textarea 
                rows={4}
                required
                placeholder="Describí los detalles del producto, materiales, estado y terminaciones..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-normal text-slate-800 bg-white transition"
              />
            </div>

            {/* ETIQUETAS / TAGS DE BÚSQUEDA */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-purple-600" />
                Tags y Palabras Clave para Filtros y Búsqueda
              </label>
              <input 
                type="text" 
                placeholder="Ej: velador, madera, noche, dormitorio, luz cálida, par"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-normal text-slate-800 bg-white transition"
              />
              <p className="text-[11px] text-slate-400">Separar por comas. Estas etiquetas ayudan a que tu producto aparezca en los filtros de la izquierda.</p>
            </div>
          </div>
        )}

        {/* --- PASO 3: PRECIO, STOCK Y DATOS DE EMBALAJE (CORREO ARGENTINO) --- */}
        {pasoActual === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 block">Precio de Venta (ARS) *</label>
                <input 
                  type="text" 
                  required
                  placeholder="$ 0"
                  value={priceDisplay}
                  onChange={handlePrecioChange}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-extrabold text-slate-900 bg-white transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 block">Stock Disponible *</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-normal text-slate-800 bg-white transition"
                />
              </div>
            </div>

            {/* SECCIÓN EMBALAJE DE ENVÍO */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Datos de Embalaje y Envíos (Calculador Correo Argentino)
              </h3>
              <p className="text-xs text-slate-500">
                La IA estimó las medidas iniciales a partir de tu foto. Podés ajustarlas si querés precisión exacta.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block">Peso (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 font-bold text-slate-800 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block">Alto (cm) *</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 font-bold text-slate-800 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block">Ancho (cm) *</label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 font-bold text-slate-800 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block">Largo (cm) *</label>
                  <input
                    type="number"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 font-bold text-slate-800 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- PASO 4: REVISIÓN Y PUBLICACIÓN --- */}
        {pasoActual === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-purple-50/40 p-5 rounded-2xl border border-purple-100 space-y-4">
              <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider">Resumen de tu Publicación</h3>

              <div className="flex items-start gap-4">
                {primaryPreview && (
                  <img src={primaryPreview} alt="Portada" className="h-20 w-20 object-cover rounded-xl border border-slate-200" />
                )}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">{title}</h4>
                  <p className="text-xs text-purple-700 font-extrabold">$ {parseFloat(price).toLocaleString("es-AR")}</p>
                  <p className="text-xs text-slate-500">{category} | {condition === 'NEW' ? 'Nuevo' : 'Usado'}</p>
                  <p className="text-[11px] text-slate-400">{1 + secundarias.filter(s => s.status === 'ok').length} fotos adjuntas y verificadas</p>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-purple-100/60">
                <p><span className="font-bold">Descripción:</span> {description}</p>
                {tags && <p><span className="font-bold">Tags:</span> {tags}</p>}
                <p><span className="font-bold">Envío estimado:</span> {weight} kg | {height}x{width}x{length} cm</p>
              </div>
            </div>
          </div>
        )}

        {/* CONTROLES DE BOTONES INFERIORES */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {pasoActual > 1 ? (
            <button
              type="button"
              onClick={irAlAtras}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
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
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              Siguiente <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublicarProducto}
              disabled={publicando}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              {publicando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {publicando ? "Publicando..." : "Confirmar y Publicar"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
