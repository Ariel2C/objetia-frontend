"use client";
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getApiUrl } from '../../lib/config';
import ProductCard from '../../components/ProductCard';
import SkeletonCard from '../../components/SkeletonCard';
import { Search, Filter, RefreshCw, ChevronDown, SlidersHorizontal, X, ChevronRight } from 'lucide-react';
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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
    setCategory(cat);
    setSubcategory('Todas');
    actualizarURL({ category: cat, subcategory: 'Todas' });
  };

  const handleSeleccionarSubcategoria = (sub: string) => {
    setSubcategory(sub);
    actualizarURL({ subcategory: sub });
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

  return (
    <div className="w-full bg-gray-50/60 min-h-screen py-6 sm:py-8 animate-fade-in">
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Filtros Móviles: Barra Superior */}
        <div className="lg:hidden mb-5 space-y-2.5">
          <form onSubmit={manejarBusqueda} className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full bg-white border border-gray-200 rounded-none pl-10 pr-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 transition"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          </form>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border transition cursor-pointer flex-shrink-0 ${
                hayFiltrosActivos
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-800 border-gray-200 hover:border-gray-400"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filtros {conteoFiltrosActivos > 0 ? `(${conteoFiltrosActivos})` : ''}</span>
            </button>

            <div className="flex gap-1.5 overflow-x-auto pb-1 -mr-4 pr-4">
              {categoriasDinamicas.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSeleccionarCategoria(cat)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-none text-xs font-bold transition cursor-pointer border uppercase tracking-wider ${
                    category === cat
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal / Drawer Móvil de Filtros */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-fade-in">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-gray-900" />
                  <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Filtros</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1 text-gray-500 hover:text-gray-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 space-y-5">
                {/* Categoría */}
                <div>
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => handleSeleccionarCategoria(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-none p-2 text-xs font-medium text-gray-800 focus:outline-none focus:border-gray-900 cursor-pointer"
                  >
                    {categoriasDinamicas.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subcategoría */}
                {category !== 'Todos' && subcategoriasDisponibles.length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block mb-1.5">
                      Subcategoría
                    </label>
                    <select
                      value={subcategory}
                      onChange={(e) => handleSeleccionarSubcategoria(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-none p-2 text-xs font-medium text-gray-800 focus:outline-none focus:border-gray-900 cursor-pointer"
                    >
                      <option value="Todas">Todas las subcategorías</option>
                      {subcategoriasDisponibles.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Condición */}
                <div>
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block mb-1.5">
                    Condición
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {["Todas", "Nuevo", "Usado"].map((cond) => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => handleSeleccionarCondicion(cond)}
                        className={`py-1.5 px-1 text-xs border text-center transition cursor-pointer ${
                          condition === cond
                            ? "bg-gray-900 text-white border-gray-900 font-semibold"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                      Color
                    </label>
                    {color !== 'Todos' && (
                      <button
                        type="button"
                        onClick={() => handleSeleccionarColor('Todos')}
                        className="text-[11px] text-gray-400 hover:text-gray-700 cursor-pointer"
                      >
                        Todos
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1">
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
                          className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs border transition cursor-pointer ${
                            isSelected
                              ? "bg-gray-900 text-white border-gray-900 font-medium shadow-xs"
                              : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full inline-block flex-shrink-0 ${isWhite ? 'border border-gray-300' : ''}`}
                            style={isGradient ? { background: bg } : { backgroundColor: bg }}
                          />
                          <span className="truncate max-w-[100px]">{col}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Material */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                      Material
                    </label>
                    {material !== 'Todos' && (
                      <button
                        type="button"
                        onClick={() => handleSeleccionarMaterial('Todos')}
                        className="text-[11px] text-gray-400 hover:text-gray-700 cursor-pointer"
                      >
                        Todos
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      value={material}
                      onChange={(e) => handleSeleccionarMaterial(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-none pl-3 pr-8 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:border-gray-900 cursor-pointer appearance-none shadow-xs"
                    >
                      <option value="Todos">Todos los materiales</option>
                      {MATERIALES_OBJETIA.map((mat) => (
                        <option key={mat} value={mat}>
                          {mat}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Footer Drawer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    limpiarFiltros();
                    setMobileFiltersOpen(false);
                  }}
                  className="flex-1 py-2 px-3 border border-gray-300 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 transition text-center cursor-pointer"
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex-1 py-2 px-3 bg-gray-900 text-white text-xs font-bold tracking-wider uppercase transition hover:bg-black text-center cursor-pointer"
                >
                  Ver {productos.length} items
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONTENEDOR FLEX: FILTROS A LA IZQUIERDA + CONTENIDO A LA DERECHA */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          
          {/* PANEL LATERAL DE FILTROS DESKTOP */}
          <aside className="hidden lg:block w-[230px] flex-shrink-0 space-y-5 sticky top-24 select-none pt-2">
            {/* Cabecera Sidebar Filtros */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-gray-800" />
                <h2 className="text-xs font-bold text-gray-900 tracking-wider uppercase">Filtros</h2>
              </div>
              {hayFiltrosActivos && (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="text-[11px] text-gray-500 hover:text-gray-900 cursor-pointer font-medium underline"
                >
                  Limpiar todo
                </button>
              )}
            </div>

            {/* 1. Categorías Dinámicas & Subcategorías */}
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                Categoría
              </h3>
              <div className="flex flex-col space-y-0.5">
                {categoriasDinamicas.map((cat) => {
                  const isCatActive = category === cat;
                  return (
                    <div key={cat} className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => handleSeleccionarCategoria(cat)}
                        className={`text-left text-xs transition-colors cursor-pointer py-1 px-1.5 flex items-center justify-between rounded-none ${
                          isCatActive
                            ? "font-bold text-gray-900 bg-gray-100"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-normal"
                        }`}
                      >
                        <span className="truncate">{cat}</span>
                        {isCatActive && cat !== 'Todos' && (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-700 flex-shrink-0" />
                        )}
                      </button>

                      {/* Subcategorías dependientes cuando la categoría está activa */}
                      {isCatActive && cat !== 'Todos' && subcategoriasDisponibles.length > 0 && (
                        <div className="pl-2.5 pr-1 py-1 mt-0.5 mb-1 space-y-0.5 border-l-2 border-gray-900 ml-1.5">
                          <button
                            type="button"
                            onClick={() => handleSeleccionarSubcategoria('Todas')}
                            className={`text-left text-[11px] transition-colors cursor-pointer py-0.5 px-1 block w-full truncate ${
                              subcategory === 'Todas'
                                ? "font-bold text-gray-900 bg-gray-100"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium"
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
                                className={`text-left text-[11px] transition-colors cursor-pointer py-0.5 px-1 block w-full truncate ${
                                  isSubActive
                                    ? "font-bold text-gray-900 bg-gray-100"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
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
            <div className="pt-3.5 border-t border-gray-200">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                Condición
              </h3>
              <div className="grid grid-cols-3 gap-1">
                {["Todas", "Nuevo", "Usado"].map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => handleSeleccionarCondicion(cond)}
                    className={`py-1.5 px-1 text-xs border text-center transition cursor-pointer ${
                      condition === cond
                        ? "bg-gray-900 text-white border-gray-900 font-semibold"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 font-normal"
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Color */}
            <div className="pt-3.5 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Color
                </h3>
                {color !== 'Todos' && (
                  <button
                    type="button"
                    onClick={() => handleSeleccionarColor('Todos')}
                    className="text-[11px] text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    Todos
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1 max-h-[160px] overflow-y-auto pr-1">
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
                      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs border transition cursor-pointer ${
                        isSelected
                          ? "bg-gray-900 text-white border-gray-900 font-semibold shadow-xs"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                      }`}
                      title={col}
                    >
                      <span
                        className={`w-2 h-2 rounded-full inline-block flex-shrink-0 ${isWhite ? 'border border-gray-300' : ''}`}
                        style={isGradient ? { background: bg } : { backgroundColor: bg }}
                      />
                      <span className="truncate max-w-[85px]">{col}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Material */}
            <div className="pt-3.5 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Material
                </h3>
                {material !== 'Todos' && (
                  <button
                    type="button"
                    onClick={() => handleSeleccionarMaterial('Todos')}
                    className="text-[11px] text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    Todos
                  </button>
                )}
              </div>
              <div className="relative">
                <select
                  value={material}
                  onChange={(e) => handleSeleccionarMaterial(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-none pl-2.5 pr-7 py-1.5 text-xs font-medium text-gray-800 focus:outline-none focus:border-gray-900 cursor-pointer appearance-none shadow-xs"
                >
                  <option value="Todos">Todos los materiales</option>
                  {MATERIALES_OBJETIA.map((mat) => (
                    <option key={mat} value={mat}>
                      {mat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </aside>

          {/* CONTENIDO PRINCIPAL: CABECERA CON CONTEO Y ORDENAMIENTO + GRILLA DE PRODUCTOS */}
          <main className="flex-1 w-full min-w-0">
            
            {/* Cabecera Superior */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-gray-200/80">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight uppercase" style={{ fontFamily: 'var(--font-family-brand, Outfit)' }}>
                  {search ? `Resultados para "${search}"` : (
                    category === "Todos"
                      ? "Catálogo Exclusivo"
                      : (subcategory !== 'Todas' ? `${category} · ${subcategory}` : category)
                  )}
                </h1>
                <span className="text-xs text-gray-500 font-medium">
                  {loading ? "Cargando..." : `${productos.length} resultados`}
                </span>
              </div>

              {/* Selector de Ordenamiento */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-xs text-gray-500 font-medium">Ordenar por</span>
                <div className="relative">
                  <select
                    value={orden}
                    onChange={(e) => setOrden(e.target.value)}
                    className="bg-white border border-gray-200 rounded-none pl-3 pr-8 py-1.5 text-xs font-semibold text-gray-800 focus:outline-none focus:border-gray-400 cursor-pointer appearance-none shadow-xs"
                  >
                    <option value="relevantes">Más relevantes</option>
                    <option value="menor-precio">Menor precio</option>
                    <option value="mayor-precio">Mayor precio</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Chips de Filtros Activos */}
            {hayFiltrosActivos && (
              <div className="flex flex-wrap items-center gap-1.5 mb-4">
                <span className="text-xs font-semibold text-gray-500 mr-1">Filtros:</span>
                {category !== 'Todos' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-white text-gray-800 border border-gray-200 shadow-xs">
                    <span>Cat: <strong className="font-semibold">{category}</strong></span>
                    <button
                      type="button"
                      onClick={() => handleSeleccionarCategoria('Todos')}
                      className="hover:text-red-600 ml-0.5 cursor-pointer text-gray-400"
                      title="Quitar filtro categoría"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {subcategory !== 'Todas' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-white text-gray-800 border border-gray-200 shadow-xs">
                    <span>Subcat: <strong className="font-semibold">{subcategory}</strong></span>
                    <button
                      type="button"
                      onClick={() => handleSeleccionarSubcategoria('Todas')}
                      className="hover:text-red-600 ml-0.5 cursor-pointer text-gray-400"
                      title="Quitar filtro subcategoría"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {condition !== 'Todas' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-white text-gray-800 border border-gray-200 shadow-xs">
                    <span>Condición: <strong className="font-semibold">{condition}</strong></span>
                    <button
                      type="button"
                      onClick={() => handleSeleccionarCondicion('Todas')}
                      className="hover:text-red-600 ml-0.5 cursor-pointer text-gray-400"
                      title="Quitar filtro condición"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {color !== 'Todos' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-white text-gray-800 border border-gray-200 shadow-xs">
                    <span>Color: <strong className="font-semibold">{color}</strong></span>
                    <button
                      type="button"
                      onClick={() => handleSeleccionarColor('Todos')}
                      className="hover:text-red-600 ml-0.5 cursor-pointer text-gray-400"
                      title="Quitar filtro color"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {material !== 'Todos' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-white text-gray-800 border border-gray-200 shadow-xs">
                    <span>Material: <strong className="font-semibold">{material}</strong></span>
                    <button
                      type="button"
                      onClick={() => handleSeleccionarMaterial('Todos')}
                      className="hover:text-red-600 ml-0.5 cursor-pointer text-gray-400"
                      title="Quitar filtro material"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {search.trim() !== '' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-white text-gray-800 border border-gray-200 shadow-xs">
                    <span>&ldquo;{search}&rdquo;</span>
                    <button
                      type="button"
                      onClick={() => { setSearch(''); actualizarURL({ search: '' }); }}
                      className="hover:text-red-600 ml-0.5 cursor-pointer text-gray-400"
                      title="Quitar búsqueda"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="text-xs text-gray-500 hover:text-gray-900 underline ml-2 cursor-pointer font-medium"
                >
                  Limpiar todos
                </button>
              </div>
            )}

            {/* Grilla de Productos */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-none text-xs mb-6 font-semibold">
                ⚠️ Error: {error}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-2.5 sm:gap-3 animate-pulse">
                {[...Array(8)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : productos.length === 0 ? (
              <div className="text-center py-20 bg-white border border-gray-200 rounded-none shadow-xs">
                <Filter className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-700">No se encontraron productos</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {search ? `No encontramos coincidencias para "${search}".` : 'Intentá ajustando los filtros de búsqueda.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-2.5 sm:gap-3">
                {productos.map((prod) => (
                  <div key={prod.id} className="transform hover:-translate-y-1 transition duration-300">
                    <ProductCard producto={prod} />
                  </div>
                ))}
              </div>
            )}

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
