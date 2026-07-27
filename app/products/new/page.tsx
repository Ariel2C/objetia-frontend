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
  Plus, 
  Loader2, 
  AlertTriangle,
  ArrowRight,
  ChevronDown
} from "lucide-react";

export default function NewProductPage() {
  const { usuario, token, cargando } = useAuth();
  const router = useRouter();
  const toast = useToast();

  // --- PASOS DEL WIZARD ---
  const [pasoActual, setPasoActual] = useState(1); // 1: Info, 2: Fotos, 3: Detalles, 4: Revisión

  // --- ESTADOS DEL FORMULARIO ---
  // Paso 1: Info
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Sillones y Sofás");
  const [condition, setCondition] = useState("USED"); // USED or NEW
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [stock, setStock] = useState("1");

  // Paso 2: Fotos
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Paso 3: Detalles (Embalaje)
  const [weight, setWeight] = useState("1.0");
  const [height, setHeight] = useState("15");
  const [width, setWidth] = useState("15");
  const [length, setLength] = useState("15");

  // Estados de carga e interfaz
  const [cargandoCopilot, setCargandoCopilot] = useState(false);
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

  // --- GESTIÓN DE DRAG & DROP FOTOS ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const procesarArchivos = (filesList: FileList) => {
    const nuevosArchivos = Array.from(filesList).filter(file => file.type.startsWith("image/"));
    
    if (images.length + nuevosArchivos.length > 8) {
      toast.warning("La plataforma permite un máximo de 8 imágenes por producto.");
      return;
    }

    const nuevosFiles = [...images, ...nuevosArchivos];
    setImages(nuevosFiles);

    const previews = nuevosArchivos.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...previews]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      procesarArchivos(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      procesarArchivos(e.target.files);
    }
  };

  const removerImagen = (index: number) => {
    const nuevosFiles = [...images];
    nuevosFiles.splice(index, 1);
    setImages(nuevosFiles);

    const nuevasPreviews = [...imagePreviews];
    URL.revokeObjectURL(nuevasPreviews[index]);
    nuevasPreviews.splice(index, 1);
    setImagePreviews(nuevasPreviews);
  };

  // --- AYUDANTE DE IA (COPILOT) ---
  // Si hay fotos cargadas, la IA las analiza para describir lo que realmente se ve.
  const handleCopilotoIA = async () => {
    if (!title) {
      toast.info("Escribí un título antes de redactar con IA.");
      return;
    }
    setCargandoCopilot(true);
    setErrorSubmit(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("category", category);
      formData.append("condition", condition.toLowerCase());
      images.slice(0, 3).forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch(`${getApiUrl()}/products/copilot`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("vamaar_token") || token}`
        },
        body: formData
      });

      if (res.status === 401) {
        toast.warning("Tu sesión expiró. Iniciá sesión nuevamente.");
        window.location.href = "/auth";
        return;
      }

      if (!res.ok) throw new Error("Fallo al obtener la sugerencia de la IA.");

      const data = await res.json();
      setDescription(data.description);
      if (data.vision) {
        toast.success("La IA analizó tus fotos y redactó la descripción. Revisala y ajustala a tu gusto.");
      } else if (images.length > 0) {
        toast.warning("No se pudo analizar las fotos (servicio de visión no disponible): se generó una descripción básica.");
      } else {
        toast.info("Descripción básica generada. Tip: subí las fotos primero para que la IA describa el producto real.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error al contactar con el Copiloto de IA.");
    } finally {
      setCargandoCopilot(false);
    }
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

  // --- NAVEGACIÓN Y VALIDACIÓN ---
  const irAlSiguiente = () => {
    setErrorSubmit(null);
    if (pasoActual === 1) {
      if (images.length === 0) {
        setErrorSubmit("Sube al menos 1 fotografía de tu mueble o decoración.");
        return;
      }
      setPasoActual(2);
    } else if (pasoActual === 2) {
      if (!title.trim()) {
        setErrorSubmit("Escribe el nombre del producto.");
        return;
      }
      if (!description.trim()) {
        setErrorSubmit("Falta la descripción: escribila o generala con IA a partir de tus fotos.");
        return;
      }
      if (!price || parseFloat(price) <= 0) {
        setErrorSubmit("El precio debe ser un número positivo.");
        return;
      }
      if (!stock || parseInt(stock) <= 0) {
        setErrorSubmit("El stock debe ser al menos 1.");
        return;
      }
      setPasoActual(3);
    } else if (pasoActual === 3) {
      if (!weight || parseFloat(weight) <= 0) {
        setErrorSubmit("Ingresa un peso de embalaje válido.");
        return;
      }
      if (!height || parseInt(height) <= 0 || !width || parseInt(width) <= 0 || !length || parseInt(length) <= 0) {
        setErrorSubmit("Ingresa dimensiones de embalaje válidas.");
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
      dataForm.append("description", description);
      dataForm.append("stock", stock);
      dataForm.append("weight_kg", weight);
      dataForm.append("height_cm", height);
      dataForm.append("width_cm", width);
      dataForm.append("length_cm", length);

      images.forEach((file) => {
        dataForm.append("files", file);
      });

      const res = await fetch(`${getApiUrl()}/products/create/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${tokenSesion}`
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

      toast.success("Tu publicación fue recibida y está en revisión automática.", "¡Producto enviado!");

      setTimeout(() => {
        router.push("/mi-espacio?tab=publications");
      }, 1500);

    } catch (err: any) {
      setPublicando(false);
      setErrorSubmit(err.message || "Ocurrió un error de red al contactar con el servidor.");
      toast.error(err.message || "No se pudo publicar el producto.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 select-none animate-fade-in">
      {/* Botón Volver */}
      <div className="mb-4">
        <Link href="/mi-espacio" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition">
          <ChevronLeft className="h-4 w-4" /> Cancelar y salir
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
        
        {/* CABECERA Y STEPPER HEADER */}
        <div className="space-y-6">
          <div>
            <h1 className="text-base font-semibold leading-7 text-slate-900">Publicar producto</h1>
          </div>

          {/* Línea de Pasos */}
          <div className="relative flex items-center justify-between w-full max-w-lg mx-auto px-4 mt-4">
            {/* Barra de progreso de fondo */}
            <div className="absolute left-8 right-8 top-4 h-[2px] bg-slate-100 z-0 flex w-[84%] sm:w-[88%]">
              <div 
                className="h-full bg-[#4F46E5] transition-all duration-300" 
                style={{ width: `${((pasoActual - 1) / 3) * 100}%` }}
              />
            </div>

            {/* Paso 1: Fotos */}
            <div className="flex flex-col items-center gap-2 relative z-10">
              <span className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                pasoActual > 1 
                  ? "bg-[#4F46E5] border-[#4F46E5] text-white text-xs font-bold" 
                  : pasoActual === 1 
                    ? "bg-white border-[#4F46E5] text-[#4F46E5] flex items-center justify-center" 
                    : "bg-white border-slate-200"
              }`}>
                {pasoActual > 1 ? (
                  "✓"
                ) : pasoActual === 1 ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#4F46E5]" />
                ) : null}
              </span>
              <span 
                className="text-sm font-medium transition-colors duration-300"
                style={{
                  color: pasoActual === 1 ? "#4F46E5" : pasoActual > 1 ? "oklch(21% 0.034 264.665)" : "oklch(60% 0.02 264.665)"
                }}
              >
                Fotos
              </span>
            </div>

            {/* Paso 2: Info */}
            <div className="flex flex-col items-center gap-2 relative z-10">
              <span className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                pasoActual > 2 
                  ? "bg-[#4F46E5] border-[#4F46E5] text-white text-xs font-bold" 
                  : pasoActual === 2 
                    ? "bg-white border-[#4F46E5] text-[#4F46E5] flex items-center justify-center" 
                    : "bg-white border-slate-200"
              }`}>
                {pasoActual > 2 ? (
                  "✓"
                ) : pasoActual === 2 ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#4F46E5]" />
                ) : null}
              </span>
              <span 
                className="text-sm font-medium transition-colors duration-300"
                style={{
                  color: pasoActual === 2 ? "#4F46E5" : pasoActual > 2 ? "oklch(21% 0.034 264.665)" : "oklch(60% 0.02 264.665)"
                }}
              >
                Info
              </span>
            </div>

            {/* Paso 3: Detalles */}
            <div className="flex flex-col items-center gap-2 relative z-10">
              <span className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                pasoActual > 3 
                  ? "bg-[#4F46E5] border-[#4F46E5] text-white text-xs font-bold" 
                  : pasoActual === 3 
                    ? "bg-white border-[#4F46E5] text-[#4F46E5] flex items-center justify-center" 
                    : "bg-white border-slate-200"
              }`}>
                {pasoActual > 3 ? (
                  "✓"
                ) : pasoActual === 3 ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#4F46E5]" />
                ) : null}
              </span>
              <span 
                className="text-sm font-medium transition-colors duration-300"
                style={{
                  color: pasoActual === 3 ? "#4F46E5" : pasoActual > 3 ? "oklch(21% 0.034 264.665)" : "oklch(60% 0.02 264.665)"
                }}
              >
                Detalles
              </span>
            </div>

            {/* Paso 4: Revisión */}
            <div className="flex flex-col items-center gap-2 relative z-10">
              <span className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                pasoActual === 4 
                  ? "bg-white border-[#4F46E5] text-[#4F46E5] flex items-center justify-center" 
                  : "bg-white border-slate-200"
              }`}>
                {pasoActual === 4 ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#4F46E5]" />
                ) : null}
              </span>
              <span 
                className="text-sm font-medium transition-colors duration-300"
                style={{
                  color: pasoActual === 4 ? "#4F46E5" : "oklch(60% 0.02 264.665)"
                }}
              >
                Revisión
              </span>
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

        {/* --- CONTENIDO PRINCIPAL POR PASO --- */}
        <div className="mt-6">
          
          {/* PASO 2: INFORMACIÓN BÁSICA */}
          {pasoActual === 2 && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 block">Nombre del producto *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Lámpara de mesa Nórdica"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] font-normal text-slate-800 bg-white transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 block">Categoría *</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] font-normal text-slate-800 bg-white cursor-pointer appearance-none pr-10 transition"
                  >
                    <option value="Sillones y Sofás">Sillones y Sofás</option>
                    <option value="Mesas y Escritorios">Mesas y Escritorios</option>
                    <option value="Sillas y Bancos">Sillas y Bancos</option>
                    <option value="Almacenamiento">Almacenamiento</option>
                    <option value="Iluminación">Iluminación</option>
                    <option value="Decoración">Decoración</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <ChevronDown className="h-4 w-4 text-gray-405" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-700 block">Descripción *</label>
                  <button
                    type="button"
                    onClick={handleCopilotoIA}
                    disabled={cargandoCopilot || images.length === 0}
                    title={images.length === 0 ? "Subí al menos una foto para que la IA pueda analizarla" : "La IA analiza tus fotos y redacta la descripción"}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100/80 px-2.5 py-1 rounded-md transition border border-purple-200 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {cargandoCopilot ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-700" /> Analizando fotos...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-purple-600" /> Generar con IA desde las fotos
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    rows={4}
                    maxLength={500}
                    placeholder="Generá la descripción con IA a partir de tus fotos, o escribila a mano..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] font-normal leading-relaxed text-slate-800 bg-white transition"
                  />
                  <span className="absolute bottom-2.5 right-2.5 text-[10px] text-slate-400 font-semibold bg-white px-1">
                    {description.length}/500
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  La IA describe materiales, colores, estilo y estado según lo que se ve en las fotos que subiste en el paso anterior.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 block">Precio (ARS) *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="$ 48.900"
                    value={priceDisplay}
                    onChange={handlePrecioChange}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] font-medium text-slate-800 bg-white transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 block">Stock disponible *</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    placeholder="5"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] font-medium text-slate-800 bg-white transition"
                  />
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <label className="text-sm font-medium text-slate-700 block">Condición del artículo *</label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input 
                      type="radio" 
                      name="condition"
                      value="NEW"
                      checked={condition === "NEW"}
                      onChange={() => setCondition("NEW")}
                      className="h-4 w-4 border-gray-300 text-[#4F46E5] focus:ring-[#4F46E5] cursor-pointer"
                    />
                    <span className="text-sm text-slate-800 font-medium">Sin Uso (Nuevo)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input 
                      type="radio" 
                      name="condition"
                      value="USED"
                      checked={condition === "USED"}
                      onChange={() => setCondition("USED")}
                      className="h-4 w-4 border-gray-300 text-[#4F46E5] focus:ring-[#4F46E5] cursor-pointer"
                    />
                    <span className="text-sm text-slate-800 font-medium">Usado único</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* PASO 1: CARGA DE FOTOS */}
          {pasoActual === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-base font-semibold leading-7 text-slate-900">Fotos del Artículo</h2>
              
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[180px] ${
                  dragActive 
                    ? "border-[#4F46E5] bg-slate-50" 
                    : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
                }`}
              >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden" 
                />
                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  Arrastra tus imágenes aquí o <span className="text-[#4F46E5] underline">explora tus archivos</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Límite de 8 fotos. Formatos soportados: JPG, PNG, WebP.</p>
              </div>

              {/* Previews en Grid */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shadow-sm group">
                      <img 
                        src={preview} 
                        alt={`Preview ${index}`} 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removerImagen(index)}
                        className="absolute top-1.5 right-1.5 p-1.5 bg-white/95 text-slate-500 rounded-full hover:text-red-600 shadow-sm hover:bg-white transition cursor-pointer"
                      >
                        <X className="h-3 w-3 stroke-[3]" />
                      </button>
                    </div>
                  ))}
                  {imagePreviews.length < 8 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-355 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600 bg-slate-50/50 transition cursor-pointer"
                    >
                      <Plus className="h-5 w-5" />
                      <span className="text-[10px] font-semibold tracking-wider">Añadir</span>
                    </button>
                  )}
                </div>
              )}

            </div>
          )}

          {/* PASO 3: DETALLES DE EMBALAJE (Logística) */}
          {pasoActual === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-amber-50/60 border border-amber-250 p-4 rounded-xl text-xs text-amber-800 leading-relaxed font-medium">
                ⚠️ Las medidas de embalaje son obligatorias y se utilizan para cotizar automáticamente la etiqueta de envío de Correo Argentino. Por favor sé lo más preciso posible.
              </div>

              <h2 className="text-base font-semibold leading-7 text-slate-900">Medidas de Embalaje</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block text-center">Peso (kg)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0.1"
                    required
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] font-medium text-center transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block text-center">Alto (cm)</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] font-medium text-center transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block text-center">Ancho (cm)</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] font-medium text-center transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block text-center">Largo (cm)</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] font-medium text-center transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PASO 4: REVISIÓN DE PUBLICACIÓN */}
          {pasoActual === 4 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-base font-semibold leading-7 text-slate-900">Revisar publicación</h2>
              
              <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-5 md:p-6 space-y-4 shadow-sm">
                <div className="flex gap-4">
                  {imagePreviews[0] && (
                    <img 
                      src={imagePreviews[0]} 
                      alt="Miniatura" 
                      className="h-16 w-16 object-cover rounded-lg border border-slate-200"
                    />
                  )}
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{category}</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5 line-clamp-1">{formatearTituloProducto(title)}</h3>
                    <p className="text-base font-bold text-[#4F46E5] mt-1">${parseFloat(price || "0").toLocaleString('es-AR')}</p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-medium text-slate-700">
                  <div>
                    <span className="text-slate-450 block text-[11px] font-bold uppercase tracking-wider">Condición</span>
                    <span>{condition === 'NEW' ? 'Sin Uso (Nuevo)' : 'Usado único'}</span>
                  </div>
                  <div>
                    <span className="text-slate-450 block text-[11px] font-bold uppercase tracking-wider">Stock a vender</span>
                    <span>{stock} unidades</span>
                  </div>
                  <div>
                    <span className="text-slate-450 block text-[11px] font-bold uppercase tracking-wider">Imágenes</span>
                    <span>{images.length} fotos cargadas</span>
                  </div>
                  <div>
                    <span className="text-slate-450 block text-[11px] font-bold uppercase tracking-wider">Medidas de envío</span>
                    <span>{weight}kg / {height}x{width}x{length} cm</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-1">
                  <span className="text-slate-450 block text-[11px] font-bold uppercase tracking-wider">Reseña del objeto</span>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{description}</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* --- PANEL DE BOTONES (Atrás / Siguiente) --- */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
          {pasoActual > 1 && (
            <button
              type="button"
              onClick={irAlAtras}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-semibold transition cursor-pointer text-center select-none shadow-sm active:scale-98"
            >
              Atrás
            </button>
          )}

          {pasoActual < 4 ? (
            <button
              type="button"
              onClick={irAlSiguiente}
              className="px-6 py-2.5 bg-[#4F46E5] hover:bg-[#4F46E5]/90 text-white rounded-lg text-sm font-semibold transition shadow-sm cursor-pointer flex items-center justify-center gap-1 select-none active:scale-98"
            >
              Siguiente <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublicarProducto}
              disabled={publicando}
              className="px-6 py-2.5 bg-[#4F46E5] hover:bg-[#4F46E5]/90 text-white rounded-lg text-sm font-semibold transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5 select-none active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {publicando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Publicando...
                </>
              ) : (
                "Publicar Artículo"
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
