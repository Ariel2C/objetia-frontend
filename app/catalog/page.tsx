"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getApiUrl } from '../../lib/config';
import ProductCard from '../../components/ProductCard';
import SkeletonCard from '../../components/SkeletonCard';
import { Search, Filter, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react';
import type { Producto } from '../../lib/types';

const CATEGORIES = ["Todos", "Sillones", "Iluminación", "Mesas", "Adornos", "Otros"];

function CatalogContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const initialCategory = categoryParam && CATEGORIES.includes(categoryParam) ? categoryParam : 'Todos';

  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [error, setError] = useState<string | null>(null);
  const [orden, setOrden] = useState('relevantes');

  const fetchProductos = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (category !== 'Todos') queryParams.append('category', category);
      if (search.trim() !== '') queryParams.append('search', search.trim());

      const res = await fetch(`${getApiUrl()}/products/?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Error al cargar los productos del servidor.");
      let data = await res.json();

      // Ordenamiento local opcional
      if (orden === 'menor-precio') {
        data = [...data].sort((a, b) => a.price - b.price);
      } else if (orden === 'mayor-precio') {
        data = [...data].sort((a, b) => b.price - a.price);
      }

      setProductos(data);
    } catch (err: any) {
      setError(err.message || "No se pudo conectar con el catálogo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, [category, orden]);

  useEffect(() => {
    if (categoryParam && CATEGORIES.includes(categoryParam)) {
      setCategory(categoryParam);
    }
  }, [categoryParam]);

  const manejarBusqueda = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProductos();
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
            {CATEGORIES.map((cat) => (
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

        {/* CONTENEDOR FLEX: FILTROS COMPACTOS A LA IZQUIERDA (240px) + CONTENIDO A LA DERECHA */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          
          {/* PANEL LATERAL DE FILTROS (ALINEADO A LA ALTURA DE LAS IMÁGENES DE PRODUCTO) */}
          <aside className="hidden lg:block w-[220px] flex-shrink-0 space-y-6 sticky top-24 select-none pt-12 lg:pt-14">
            {/* Bloque de Categorías */}
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-3 tracking-tight">
                Categorías
              </h3>
              <div className="flex flex-col space-y-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`text-left text-sm sm:text-[14px] transition-colors cursor-pointer block py-1 ${
                      category === cat
                        ? "font-bold text-gray-900"
                        : "text-gray-700 hover:text-blue-600 hover:underline font-normal"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Buscador Rápido (Limpio y Sobrio) */}
            <div className="pt-3 border-t border-gray-200/70 space-y-2">
              <h4 className="text-sm font-bold text-gray-900">Búsqueda</h4>
              <form onSubmit={manejarBusqueda} className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full bg-white border border-gray-300 rounded-md pl-8 pr-2 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-gray-500 shadow-2xs"
                  />
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                {(search || category !== 'Todos') && (
                  <button 
                    type="button"
                    onClick={() => { setSearch(''); setCategory('Todos'); }}
                    className="text-xs font-medium text-blue-600 hover:underline cursor-pointer block mt-1"
                  >
                    Limpiar filtros
                  </button>
                )}
              </form>
            </div>
          </aside>

          {/* CONTENIDO PRINCIPAL: CABECERA CON CONTEO Y ORDENAMIENTO + GRILLA DE PRODUCTOS AMPLIA (4 COLUMNAS) */}
          <main className="flex-1 w-full min-w-0">
            
            {/* Cabecera Superior: Título de Categoría + Total de Resultados a la Izquierda | Ordenamiento a la Derecha */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3 border-b border-gray-200/80">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight uppercase" style={{ fontFamily: 'var(--font-family-brand, Outfit)' }}>
                  {category === "Todos" ? "Catálogo Exclusivo" : category}
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

            {/* Grilla de Productos de 4 Columnas con Spacing Armonioso (RÉPLICA DE LA SEGUNDA IMAGEN DE REFERENCIA) */}
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
                <p className="text-xs text-gray-400 mt-1">Intentá ajustando los filtros de búsqueda o categoría.</p>
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
