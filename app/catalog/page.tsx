"use client";
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getApiUrl } from '../../lib/config';
import ProductCard from '../../components/ProductCard';
import SkeletonCard from '../../components/SkeletonCard';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  SlidersHorizontal, 
  X, 
  Menu as MenuIcon,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import type { Producto } from '../../lib/types';
import { trackSearchQuery } from '../../lib/analytics';

import { TAXONOMIA_OBJETIA, MATERIALES_OBJETIA, COLORES_OBJETIA } from '../../components/NewProductModal';

const COLOR_MAP: Record<string, string> = {
  "Madera natural": "#c29b61",
  "Negro": "#1a1a1a",
  "Blanco": "#ffffff",
  "Dorado / Bronce": "#c5a059",
  "Gris": "#808080",
  "Beige / Arena": "#e3dac9",
  "Marrón / Chocolate": "#5c3a21",
  "Verde": "#2e5a36",
  "Azul / Petróleo": "#1f456e",
  "Terracota / Óxido": "#b95c3b",
  "Multicolor / Otro": "linear-gradient(135deg, #e11d48, #eab308, #2563eb)",
};

const BASE_CATEGORIES = [
  "Todos",
  ...Object.keys(TAXONOMIA_OBJETIA)
];

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const categoryParam = searchParams.get('category');
  const subcategoryParam = searchParams.get('subcategory');
  const materialParam = searchParams.get('material');
  const colorParam = searchParams.get('color');
  const conditionParam = searchParams.get('condition');
  const searchParam = searchParams.get('search');
  const maxPriceParam = searchParams.get('max_price');
  const styleParam = searchParams.get('style');
  const sortParam = searchParams.get('sort');

  const [search, setSearch] = useState(searchParam || '');
  const [category, setCategory] = useState(categoryParam || 'Todos');
  const [subcategory, setSubcategory] = useState(subcategoryParam || 'Todas');
  const [material, setMaterial] = useState(materialParam || 'Todos');
  const [color, setColor] = useState(colorParam || 'Todos');
  const [condition, setCondition] = useState(conditionParam || 'Todas');

  const [productos, setProductos] = useState<Producto[]>([]);
  const [allSearchProducts, setAllSearchProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orden, setOrden] = useState(sortParam === 'newest' ? 'recientes' : 'relevantes');
  const [sidebarOculto, setSidebarOculto] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [materialAbierto, setMaterialAbierto] = useState(true);

  // Sincronizar parámetros de la URL si cambian externamente
  useEffect(() => {
    if (searchParam !== null && searchParam !== search) setSearch(searchParam);
    if (categoryParam !== null && categoryParam !== category) {
      setCategory(categoryParam);
      // Reset subcategory si cambia categoría desde URL
      if (!subcategoryParam) setSubcategory('Todas');
    }
    if (subcategoryParam !== null && subcategoryParam !== subcategory) setSubcategory(subcategoryParam);
    if (materialParam !== null && materialParam !== material) setMaterial(materialParam);
    if (colorParam !== null && colorParam !== color) setColor(colorParam);
    if (conditionParam !== null && conditionParam !== condition) setCondition(conditionParam);
    if (sortParam === 'newest') setOrden('recientes');
  }, [searchParam, categoryParam, subcategoryParam, materialParam, colorParam, conditionParam, sortParam]);

  const fetchProductos = async () => {
    setLoading(true);
    setError(null);
    try {
      const querySearch = new URLSearchParams();
      if (search.trim() !== '') querySearch.append('search', search.trim());
      if (category !== 'Todos') querySearch.append('category', category);
      if (subcategory !== 'Todas') querySearch.append('subcategory', subcategory);
      if (material !== 'Todos') querySearch.append('material', material);
      if (color !== 'Todos') querySearch.append('color', color);
      if (condition !== 'Todas') querySearch.append('condition', condition === 'Nuevo' ? 'new' : 'used');

      let sortBy = 'relevance';
      if (sortParam === 'newest' || orden === 'recientes') sortBy = 'newest';
      else if (orden === 'menor-precio') sortBy = 'price_asc';
      else if (orden === 'mayor-precio') sortBy = 'price_desc';
      querySearch.append('sort_by', sortBy);

      const resBase = await fetch(`${getApiUrl()}/products/?${querySearch.toString()}`);
      if (!resBase.ok) throw new Error("Error al cargar los productos del servidor.");
      const baseData: Producto[] = await resBase.json();
      setAllSearchProducts(baseData);

      if (search.trim().length >= 2) {
        trackSearchQuery(search.trim(), baseData.length);
      }

      let filteredData = baseData;

      // Filtro por precio máximo
      if (maxPriceParam) {
        const maxP = Number(maxPriceParam);
        if (!isNaN(maxP)) {
          filteredData = filteredData.filter(p => p.price <= maxP);
        }
      }

      // Filtro por estilo si viene por url
      if (styleParam) {
        const sNorm = styleParam.toLowerCase();
        filteredData = filteredData.filter(p => 
          (p as any).style?.toLowerCase() === sNorm ||
          p.title?.toLowerCase().includes(sNorm) ||
          p.category?.toLowerCase().includes(sNorm)
        );
      }

      // Ordenamiento
      if (orden === 'menor-precio') {
        filteredData = [...filteredData].sort((a, b) => a.price - b.price);
      } else if (orden === 'mayor-precio') {
        filteredData = [...filteredData].sort((a, b) => b.price - a.price);
      } else if (orden === 'recientes') {
        filteredData = [...filteredData].sort((a, b) => b.id - a.id);
      } else if (orden === 'relevantes') {
        filteredData = [...filteredData].sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0));
      }

      setProductos(filteredData);
    } catch (err: any) {
      setError(err.message || "No se pudo conectar con el catálogo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, [search, category, subcategory, material, color, condition, orden, maxPriceParam, styleParam, sortParam]);

  // Lista de subcategorías válidas para la categoría actual
  const subcategoriasDisponibles = useMemo(() => {
    if (category === 'Todos' || !TAXONOMIA_OBJETIA[category]) return [];
    return TAXONOMIA_OBJETIA[category];
  }, [category]);

  // CATEGORÍAS DINÁMICAS
  const categoriasDinamicas = useMemo(() => {
    return BASE_CATEGORIES;
  }, []);

  const actualizarURL = (nuevosFiltros: {
    category?: string;
    subcategory?: string;
    material?: string;
    color?: string;
    condition?: string;
    search?: string;
  }) => {
    const q = new URLSearchParams();
    const cat = nuevosFiltros.category ?? category;
    const sub = nuevosFiltros.subcategory ?? subcategory;
    const mat = nuevosFiltros.material ?? material;
    const col = nuevosFiltros.color ?? color;
    const cond = nuevosFiltros.condition ?? condition;
    const sea = nuevosFiltros.search ?? search;

    if (sea.trim()) q.append('search', sea.trim());
    if (cat !== 'Todos') q.append('category', cat);
    if (sub !== 'Todas') q.append('subcategory', sub);
    if (mat !== 'Todos') q.append('material', mat);
    if (col !== 'Todos') q.append('color', col);
    if (cond !== 'Todas') q.append('condition', cond);
    if (sortParam) q.append('sort', sortParam);

    const queryString = q.toString();
    router.push(queryString ? `/catalog?${queryString}` : '/catalog');
  };

  const conteoFiltrosActivos = useMemo(() => {
    let count = 0;
    if (category !== 'Todos') count++;
    if (subcategory !== 'Todas') count++;
    if (material !== 'Todos') count++;
    if (color !== 'Todos') count++;
    if (condition !== 'Todas') count++;
    if (search.trim()) count++;
    return count;
  }, [category, subcategory, material, color, condition, search]);

  const hayFiltrosActivos = conteoFiltrosActivos > 0;

  const handleSeleccionarCategoria = (cat: string) => {
    if (category === cat && cat !== 'Todos') {
      // Al volver a hacer click en la misma categoría activa, se repliega y se cierra
      setCategory('Todos');
      setSubcategory('Todas');
      actualizarURL({ category: 'Todos', subcategory: 'Todas' });
    } else {
      // Al hacer click se despliega y se activa
      setCategory(cat);
      setSubcategory('Todas');
      actualizarURL({ category: cat, subcategory: 'Todas' });
    }
  };

  const handleSeleccionarSubcategoria = (sub: string) => {
    const nuevaSub = subcategory === sub ? 'Todas' : sub;
    setSubcategory(nuevaSub);
    actualizarURL({ subcategory: nuevaSub });
  };

  const handleSeleccionarMaterial = (mat: string) => {
    setMaterial(mat);
    actualizarURL({ material: mat });
  };

  const handleSeleccionarColor = (col: string) => {
    setColor(col);
    actualizarURL({ color: col });
  };

  const handleSeleccionarCondicion = (cond: string) => {
    setCondition(cond);
    actualizarURL({ condition: cond });
  };

  const manejarBusqueda = (e: React.FormEvent) => {
    e.preventDefault();
    actualizarURL({ search });
  };

  const limpiarFiltros = () => {
    setSearch('');
    setCategory('Todos');
    setSubcategory('Todas');
    setMaterial('Todos');
    setColor('Todos');
    setCondition('Todas');
    router.push('/catalog');
  };

  // Contenido interno del Sidebar de Filtros (diseño idéntico a Mi Objetia)
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between overflow-hidden">
      {/* Cabecera del Sidebar alineada a 60px exactos como Mi Objetia */}
      <div className="h-[60px] min-h-[60px] flex items-center justify-between px-4 border-b border-[#dadce0] flex-shrink-0">
        <div className="flex items-center gap-2 px-1">
          <SlidersHorizontal className="h-4 w-4 text-[#1a73e8]" />
          <span className="font-bold text-[15px] tracking-tight text-[#202124]">
            Filtros
          </span>
          {hayFiltrosActivos && (
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-[#e8f0fe] text-[#1a73e8]">
              {conteoFiltrosActivos}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="text-xs text-[#1a73e8] hover:underline font-medium px-2 py-1 cursor-pointer"
            >
              Limpiar
            </button>
          )}
          {/* Botón cerrar en móvil */}
          <button 
            type="button"
            onClick={() => setMenuMovilAbierto(false)} 
            className="lg:hidden text-[#5f6368] hover:text-[#202124] p-1 rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Contenido scrolleable de Filtros con barra de scroll visible y estilizada */}
      <div 
        className="flex-1 overflow-y-auto light-scrollbar p-4 pb-28 sm:pb-32 space-y-5 select-none"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#dadce0 transparent' }}
      >
        
        {/* 1. Categorías & Subcategorías */}
        <div>
          <span className="text-[11px] font-bold text-[#5f6368] uppercase tracking-wider px-2 block mb-2">
            Categorías
          </span>
          <div className="space-y-1">
            {categoriasDinamicas.map((cat) => {
              const isCatActive = category === cat;
              return (
                <div key={cat} className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => handleSeleccionarCategoria(cat)}
                    className={`w-full flex items-center justify-between px-3.5 h-[38px] rounded-xl text-[13px] font-medium transition-all text-left cursor-pointer group ${
                      isCatActive
                        ? 'bg-[#e8f0fe] text-[#1a73e8] shadow-2xs font-semibold'
                        : 'text-[#3c4043] hover:bg-[#f1f3f4] hover:text-[#1f1f1f]'
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    {isCatActive && cat !== 'Todos' ? (
                      <ChevronDown className="h-3.5 w-3.5 text-[#1a73e8] flex-shrink-0" />
                    ) : isCatActive ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1a73e8]" />
                    ) : null}
                  </button>

                  {/* Subcategorías anidadas con diseño pulido */}
                  {isCatActive && cat !== 'Todos' && subcategoriasDisponibles.length > 0 && (
                    <div className="pl-2 pr-1 py-1 mt-0.5 mb-1.5 space-y-1 ml-3">
                      <button
                        type="button"
                        onClick={() => handleSeleccionarSubcategoria('Todas')}
                        className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer truncate ${
                          subcategory === 'Todas'
                            ? "bg-[#e8f0fe] text-[#1a73e8] font-semibold"
                            : "text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]"
                        }`}
                      >
                        • Todas en {cat}
                      </button>
                      {subcategoriasDisponibles.map((sub) => {
                        const isSubActive = subcategory === sub;
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => handleSeleccionarSubcategoria(sub)}
                            className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer truncate ${
                              isSubActive
                                ? "bg-[#e8f0fe] text-[#1a73e8] font-semibold"
                                : "text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]"
                            }`}
                            title={sub}
                          >
                            {sub}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Condición */}
        <div className="pt-4 border-t border-[#dadce0]">
          <span className="text-[11px] font-bold text-[#5f6368] uppercase tracking-wider px-2 block mb-2">
            Condición
          </span>
          <div className="grid grid-cols-3 gap-1.5 px-1">
            {["Todas", "Nuevo", "Usado"].map((cond) => (
              <button
                key={cond}
                type="button"
                onClick={() => handleSeleccionarCondicion(cond)}
                className={`py-1.5 px-2 text-xs rounded-xl text-center transition cursor-pointer border ${
                  condition === cond
                    ? "bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc] font-bold shadow-2xs"
                    : "bg-white text-[#3c4043] border-[#dadce0] hover:bg-[#f1f3f4]"
                }`}
              >
                {cond}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Color */}
        <div className="pt-4 border-t border-[#dadce0]">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-bold text-[#5f6368] uppercase tracking-wider">
              Color
            </span>
            {color !== 'Todos' && (
              <button
                type="button"
                onClick={() => handleSeleccionarColor('Todos')}
                className="text-[11px] text-[#1a73e8] hover:underline cursor-pointer"
              >
                Todos
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 px-1">
            {COLORES_OBJETIA.map((col) => {
              const bg = COLOR_MAP[col] || '#ccc';
              const isGradient = bg.startsWith('linear');
              const isWhite = col === 'Blanco';
              const isSelected = color === col;
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => handleSeleccionarColor(isSelected ? 'Todos' : col)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? "bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc] font-semibold shadow-2xs"
                      : "bg-white text-[#3c4043] border-[#dadce0] hover:bg-[#f1f3f4]"
                  }`}
                  title={col}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full inline-block flex-shrink-0 ${isWhite ? 'border border-gray-300' : ''}`}
                    style={isGradient ? { background: bg } : { backgroundColor: bg }}
                  />
                  <span className="truncate max-w-[95px]">{col}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Material */}
        <div className="pt-4 border-t border-[#dadce0]">
          <div className="flex items-center justify-between px-2 mb-2">
            <button
              type="button"
              onClick={() => setMaterialAbierto(!materialAbierto)}
              className="flex items-center gap-1.5 text-left cursor-pointer group select-none flex-1 py-0.5"
            >
              <span className="text-[11px] font-bold text-[#5f6368] uppercase tracking-wider group-hover:text-[#202124] transition-colors">
                Material
              </span>
              <ChevronDown 
                className={`h-3.5 w-3.5 text-[#5f6368] group-hover:text-[#202124] transition-transform duration-200 ${
                  materialAbierto ? 'rotate-180' : ''
                }`}
              />
              {!materialAbierto && material !== 'Todos' && (
                <span className="text-[11px] font-semibold text-[#1a73e8] bg-[#e8f0fe] px-2 py-0.5 rounded-lg truncate max-w-[120px]">
                  {material}
                </span>
              )}
            </button>
            {material !== 'Todos' && (
              <button
                type="button"
                onClick={() => handleSeleccionarMaterial('Todos')}
                className="text-[11px] text-[#1a73e8] hover:underline cursor-pointer flex-shrink-0 ml-2"
              >
                Limpiar
              </button>
            )}
          </div>
          {materialAbierto && (
            <div className="flex flex-wrap gap-1.5 px-1 animate-fade-in">
              {MATERIALES_OBJETIA.map((mat) => {
                const isSelected = material === mat;
                return (
                  <button
                    key={mat}
                    type="button"
                    onClick={() => handleSeleccionarMaterial(isSelected ? 'Todos' : mat)}
                    className={`inline-flex items-center px-2.5 py-1 text-xs rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? "bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc] font-semibold shadow-2xs"
                        : "bg-white text-[#3c4043] border-[#dadce0] hover:bg-[#f1f3f4]"
                    }`}
                    title={mat}
                  >
                    <span className="truncate">{mat}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Footer del Drawer en móvil */}
      <div className="p-4 border-t border-[#dadce0] bg-[#f8f9fa] flex gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => {
            limpiarFiltros();
            setMenuMovilAbierto(false);
          }}
          className="flex-1 py-2 px-3 border border-[#dadce0] text-xs font-semibold text-[#3c4043] bg-white rounded-xl hover:bg-[#f1f3f4] transition text-center cursor-pointer"
        >
          Limpiar
        </button>
        <button
          type="button"
          onClick={() => setMenuMovilAbierto(false)}
          className="flex-1 py-2 px-3 bg-[#1a73e8] text-white text-xs font-bold rounded-xl transition hover:bg-[#1557b0] text-center cursor-pointer shadow-xs"
        >
          Ver {productos.length} items
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans text-[#202124] antialiased">
      
      {/* Workspace Shell Google AI Studio Light (Igual a Mi Objetia) */}
      <div className="flex flex-1 overflow-hidden min-h-[calc(100vh-4rem)]">

        {/* DRAWER MÓVIL (Off-canvas en Light Mode) */}
        {menuMovilAbierto && (
          <div className="fixed inset-0 z-[100] lg:hidden animate-fade-in">
            <div 
              className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity" 
              onClick={() => setMenuMovilAbierto(false)} 
            />
            <div className="fixed inset-y-0 left-0 w-[290px] bg-white border-r border-[#dadce0] shadow-2xl flex flex-col z-10 animate-slide-right overflow-hidden">
              {renderSidebarContent()}
            </div>
          </div>
        )}

        {/* SIDEBAR ESCRITORIO (Deslizamiento físico a la izquierda idéntico a Mi Objetia) */}
        <aside 
          className={`hidden lg:flex flex-col bg-white border-r border-[#dadce0] transition-all duration-300 ease-in-out select-none flex-shrink-0 w-72 h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] overflow-hidden ${
            sidebarOculto ? '-ml-72 pointer-events-none' : 'ml-0'
          }`}
        >
          {renderSidebarContent()}
        </aside>

        {/* ÁREA PRINCIPAL DE CONTENIDO A LA DERECHA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          
          {/* TOP BAR / PANEL SUPERIOR GOOGLE AI STUDIO LIGHT (IDÉNTICO A MI OBJETIA) */}
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-[#dadce0] px-4 sm:px-6 h-[60px] min-h-[60px] flex items-center justify-between flex-shrink-0 gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Botón menú móvil para abrir filtros */}
              <button
                type="button"
                onClick={() => setMenuMovilAbierto(true)}
                className="lg:hidden p-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] rounded-lg transition cursor-pointer flex-shrink-0"
                title="Abrir filtros"
              >
                <MenuIcon className="h-5 w-5" />
              </button>

              {/* Botón animado colapsar/expandir sidebar */}
              <button
                type="button"
                onClick={() => setSidebarOculto(!sidebarOculto)}
                className="hidden lg:flex items-center justify-center w-10 h-10 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#f1f3f4] active:bg-[#e8f0fe] active:scale-95 rounded-xl transition-all cursor-pointer flex-shrink-0 group"
                title={sidebarOculto ? "Mostrar filtros" : "Ocultar filtros"}
                aria-label={sidebarOculto ? "Mostrar filtros" : "Ocultar filtros"}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 transition-transform duration-300 group-hover:scale-105"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line
                    x1="3"
                    y1="6"
                    x2={sidebarOculto ? "21" : "12"}
                    y2="6"
                    className="transition-all duration-300 ease-in-out"
                  />
                  <line
                    x1="3"
                    y1="12"
                    x2={sidebarOculto ? "21" : "9"}
                    y2="12"
                    className="transition-all duration-300 ease-in-out"
                  />
                  <line
                    x1="3"
                    y1="18"
                    x2={sidebarOculto ? "21" : "12"}
                    y2="18"
                    className="transition-all duration-300 ease-in-out"
                  />
                  <path
                    d="M 19 7 L 14 12 L 19 17"
                    className={`transition-all duration-300 ease-in-out ${
                      sidebarOculto
                        ? 'opacity-0 translate-x-2 pointer-events-none'
                        : 'opacity-100 translate-x-0'
                    }`}
                  />
                </svg>
              </button>

              {/* TÍTULO Y DESCRIPCIÓN DEL PANEL: CATÁLOGO DE PRODUCTOS */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm sm:text-base font-bold text-[#202124] leading-tight truncate">
                  Catálogo de Productos
                </span>
                <span className="hidden sm:inline text-[11px] text-[#5f6368] truncate leading-tight mt-0.5">
                  {loading 
                    ? "Cargando catálogo..." 
                    : `${productos.length} productos disponibles${category !== 'Todos' ? ` · ${category}` : ''}${subcategory !== 'Todas' ? ` · ${subcategory}` : ''}`}
                </span>
              </div>
            </div>

            {/* LADO DERECHO DEL HEADER: BÚSQUEDA Y ORDENAMIENTO */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Buscador Integrado */}
              <form onSubmit={manejarBusqueda} className="relative w-36 sm:w-56 md:w-64">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full bg-[#f1f3f4] focus:bg-white border border-transparent focus:border-[#dadce0] rounded-xl pl-8 sm:pl-9 pr-3 py-1.5 text-xs text-[#202124] placeholder-[#5f6368] focus:outline-none transition shadow-2xs"
                />
                <Search className="absolute left-2.5 sm:left-3 top-2 h-3.5 w-3.5 text-[#5f6368]" />
              </form>

              {/* Selector de Orden */}
              <div className="relative flex-shrink-0">
                <select
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                  className="bg-white border border-[#dadce0] hover:border-[#9aa0a6] rounded-xl pl-2.5 sm:pl-3 pr-7 py-1.5 text-xs font-semibold text-[#202124] focus:outline-none focus:border-[#1a73e8] cursor-pointer appearance-none shadow-2xs transition"
                >
                  <option value="relevantes">Más relevantes</option>
                  <option value="menor-precio">Menor precio</option>
                  <option value="mayor-precio">Mayor precio</option>
                  <option value="recientes">Más recientes</option>
                </select>
                <ChevronDown className="absolute right-2 top-2 h-3.5 w-3.5 text-[#5f6368] pointer-events-none" />
              </div>
            </div>
          </header>

          {/* CUERPO DE CONTENIDO CON PADDING Y PRODUCTOS DENTRO DE DIV BLANCO */}
          <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 space-y-4">
            
            {/* Chips de Filtros Activos */}
            {hayFiltrosActivos && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-[#5f6368] mr-1">Filtros:</span>
                {category !== 'Todos' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-white text-[#202124] border border-[#dadce0] rounded-xl shadow-2xs">
                    <span className="font-semibold">{category}</span>
                    <button
                      type="button"
                      onClick={() => handleSeleccionarCategoria('Todos')}
                      className="hover:text-red-600 text-[#5f6368] cursor-pointer"
                      title="Quitar categoría"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {subcategory !== 'Todas' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-white text-[#202124] border border-[#dadce0] rounded-xl shadow-2xs">
                    <span className="font-semibold">{subcategory}</span>
                    <button
                      type="button"
                      onClick={() => handleSeleccionarSubcategoria('Todas')}
                      className="hover:text-red-600 text-[#5f6368] cursor-pointer"
                      title="Quitar subcategoría"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {condition !== 'Todas' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-white text-[#202124] border border-[#dadce0] rounded-xl shadow-2xs">
                    <span className="font-semibold">{condition}</span>
                    <button
                      type="button"
                      onClick={() => handleSeleccionarCondicion('Todas')}
                      className="hover:text-red-600 text-[#5f6368] cursor-pointer"
                      title="Quitar condición"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {color !== 'Todos' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-white text-[#202124] border border-[#dadce0] rounded-xl shadow-2xs">
                    {COLOR_MAP[color] && (
                      <span
                        className={`w-2.5 h-2.5 rounded-full inline-block flex-shrink-0 ${color === 'Blanco' ? 'border border-gray-300' : ''}`}
                        style={COLOR_MAP[color].startsWith('linear') ? { background: COLOR_MAP[color] } : { backgroundColor: COLOR_MAP[color] }}
                      />
                    )}
                    <span className="font-semibold">{color}</span>
                    <button
                      type="button"
                      onClick={() => handleSeleccionarColor('Todos')}
                      className="hover:text-red-600 text-[#5f6368] cursor-pointer"
                      title="Quitar color"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {material !== 'Todos' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-white text-[#202124] border border-[#dadce0] rounded-xl shadow-2xs">
                    <span className="font-semibold">{material}</span>
                    <button
                      type="button"
                      onClick={() => handleSeleccionarMaterial('Todos')}
                      className="hover:text-red-600 text-[#5f6368] cursor-pointer"
                      title="Quitar material"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {search.trim() !== '' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-white text-[#202124] border border-[#dadce0] rounded-xl shadow-2xs">
                    <span>&ldquo;{search}&rdquo;</span>
                    <button
                      type="button"
                      onClick={() => { setSearch(''); actualizarURL({ search: '' }); }}
                      className="hover:text-red-600 text-[#5f6368] cursor-pointer"
                      title="Quitar búsqueda"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="text-xs text-[#1a73e8] hover:underline ml-1 cursor-pointer font-semibold"
                >
                  Limpiar todo
                </button>
              </div>
            )}

            {/* CONTENEDOR DIV BLANCO DE PRODUCTOS (ESTILO MI OBJETIA) */}
            <div className="bg-white border border-[#dadce0] rounded-2xl p-4 sm:p-6 shadow-2xs min-h-[450px]">
              
              {/* Mensaje de Error */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs mb-6 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Grilla o Estado Vacío */}
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4.5 animate-pulse">
                  {[...Array(10)].map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : productos.length === 0 ? (
                <div className="text-center py-24 px-4">
                  <div className="w-16 h-16 rounded-full bg-[#f1f3f4] flex items-center justify-center mx-auto mb-4 text-[#5f6368]">
                    <Filter className="h-8 w-8 text-[#5f6368]" />
                  </div>
                  <h3 className="text-base font-bold text-[#202124]">No se encontraron productos</h3>
                  <p className="text-xs text-[#5f6368] mt-1 max-w-sm mx-auto">
                    {search ? `No encontramos coincidencias para "${search}".` : 'Probá ajustando o limpiando los filtros seleccionados.'}
                  </p>
                  {hayFiltrosActivos && (
                    <button
                      type="button"
                      onClick={limpiarFiltros}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#1a73e8] text-white text-xs font-semibold rounded-xl hover:bg-[#1557b0] transition shadow-xs cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restablecer filtros
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4.5">
                  {productos.map((prod) => (
                    <div key={prod.id} className="transform hover:-translate-y-1 transition duration-300">
                      <ProductCard producto={prod} />
                    </div>
                  ))}
                </div>
              )}
            </div>

          </main>

        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={null}>
      <CatalogContent />
    </Suspense>
  );
}
