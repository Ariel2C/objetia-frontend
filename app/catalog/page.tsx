"use client";
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getApiUrl } from '../../lib/config';
import ProductCard from '../../components/ProductCard';
import SkeletonCard from '../../components/SkeletonCard';
import { Search, Filter, RefreshCw, ChevronDown } from 'lucide-react';
import type { Producto } from '../../lib/types';

const BASE_CATEGORIES = ["Todos", "Sillones", "Iluminación", "Mesas", "Adornos", "Otros"];

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const categoryParam = searchParams.get('category');
  const searchParam = searchParams.get('search');

  const [search, setSearch] = useState(searchParam || '');
  const [category, setCategory] = useState(categoryParam || 'Todos');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [allSearchProducts, setAllSearchProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orden, setOrden] = useState('relevantes');

  // Sincronizar parámetros de la URL si cambian externamente (ej: desde el buscador del Navbar)
  useEffect(() => {
    if (searchParam !== null && searchParam !== search) {
      setSearch(searchParam);
    }
    if (categoryParam !== null && categoryParam !== category) {
      setCategory(categoryParam);
    }
  }, [searchParam, categoryParam]);

  const fetchProductos = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Petición completa del resultado de búsqueda (sin filtro de categoría) para calcular las categorías dinámicas
      const querySearch = new URLSearchParams();
      if (search.trim() !== '') querySearch.append('search', search.trim());

      const resBase = await fetch(`${getApiUrl()}/products/?${querySearch.toString()}`);
      if (!resBase.ok) throw new Error("Error al cargar los productos del servidor.");
      const baseData: Producto[] = await resBase.json();
      setAllSearchProducts(baseData);

      // 2. Filtrar por categoría seleccionada
      let filteredData = baseData;
      if (category !== 'Todos') {
        filteredData = baseData.filter(p => p.category?.toLowerCase() === category.toLowerCase());
      }

      // 3. Ordenamiento local
      if (orden === 'menor-precio') {
        filteredData = [...filteredData].sort((a, b) => a.price - b.price);
      } else if (orden === 'mayor-precio') {
        filteredData = [...filteredData].sort((a, b) => b.price - a.price);
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
  }, [search, category, orden]);

  // CATEGORÍAS DINÁMICAS: solo muestra las categorías que existen en los resultados de la búsqueda
  const categoriasDinamicas = useMemo(() => {
    if (!search.trim()) return BASE_CATEGORIES;
    const setCats = new Set<string>();
    setCats.add("Todos");
    allSearchProducts.forEach(p => {
      if (p.category) setCats.add(p.category);
    });
    return Array.from(setCats);
  }, [search, allSearchProducts]);

  const manejarBusqueda = (e: React.FormEvent) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();
    if (search.trim()) queryParams.append('search', search.trim());
    if (category !== 'Todos') queryParams.append('category', category);
    router.push(`/catalog?${queryParams.toString()}`);
    fetchProductos();
  };

  const limpiarFiltros = () => {
    setSearch('');
    setCategory('Todos');
    router.push('/catalog');
  };

  return (
    <div className="w-full bg-gray-50/60 min-h-screen py-6 sm:py-8 animate-fade-in">
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Filtros Móviles */}
        <div className="lg:hidden mb-6 space-y-3">
          <form onSubmit={manejarBusqueda} className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full bg-white border border-gray-200 rounded-none pl-10 pr-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          </form>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {categoriasDinamicas.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-none text-xs font-bold transition cursor-pointer border uppercase tracking-wider ${
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

        {/* CONTENEDOR FLEX: FILTROS TRANSPARENTES Y DINÁMICOS A LA IZQUIERDA + CONTENIDO A LA DERECHA */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          
          {/* PANEL LATERAL DE FILTROS (ALINEADO A LA ALTURA DE LAS IMÁGENES DE PRODUCTO) */}
          <aside className="hidden lg:block w-[220px] flex-shrink-0 space-y-6 sticky top-24 select-none pt-12 lg:pt-14">
            {/* Bloque de Categorías Dinámicas */}
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-3 tracking-tight">
                Categorías
              </h3>
              <div className="flex flex-col space-y-1.5">
                {categoriasDinamicas.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`text-left text-sm sm:text-[14px] transition-colors cursor-pointer block py-1 ${
                      category === cat
                        ? "font-bold text-gray-900"
                        : "text-gray-600 hover:text-gray-900 font-normal"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Opción Limpiar Filtros */}
            {(search || category !== 'Todos') && (
              <div className="pt-2 border-t border-gray-200/70">
                <button 
                  type="button"
                  onClick={limpiarFiltros}
                  className="text-xs font-medium text-gray-500 hover:text-gray-900 cursor-pointer block"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </aside>

          {/* CONTENIDO PRINCIPAL: CABECERA CON CONTEO Y ORDENAMIENTO + GRILLA DE PRODUCTOS */}
          <main className="flex-1 w-full min-w-0">
            
            {/* Cabecera Superior: Título de Categoría/Búsqueda + Total de Resultados a la Izquierda | Ordenamiento a la Derecha */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3 border-b border-gray-200/80">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight uppercase" style={{ fontFamily: 'var(--font-family-brand, Outfit)' }}>
                  {search ? `Resultados para "${search}"` : (category === "Todos" ? "Catálogo Exclusivo" : category)}
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
