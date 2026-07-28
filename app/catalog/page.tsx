"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getApiUrl } from '../../lib/config';
import ProductCard from '../../components/ProductCard';
import SkeletonCard from '../../components/SkeletonCard';
import { Search, Filter, RefreshCw } from 'lucide-react';
import type { Producto } from '../../lib/types';

const CATEGORIES = ["Todos", "Sillones", "Iluminación", "Mesas", "Adornos", "Otros"];

function CatalogContent() {
  const searchParams = useSearchParams();
  // Respetar la categoría que llega por URL (ej: "Ver catálogo" desde la home)
  const categoryParam = searchParams.get('category');
  const initialCategory = categoryParam && CATEGORIES.includes(categoryParam) ? categoryParam : 'Todos';

  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [error, setError] = useState<string | null>(null);

  const fetchProductos = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (category !== 'Todos') queryParams.append('category', category);
      if (search.trim() !== '') queryParams.append('search', search.trim());

      const res = await fetch(`${getApiUrl()}/products/?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Error al cargar los productos del servidor.");
      const data = await res.json();
      setProductos(data);
    } catch (err: any) {
      setError(err.message || "No se pudo conectar con el catálogo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, [category]);

  // Sincronizar si el query param cambia con la página ya montada
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in">
      {/* Cabecera */}
      <div className="mb-6 lg:mb-10 text-center md:text-left">
        <h1 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
          Catálogo Exclusivo
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Explorá piezas únicas seleccionadas por nuestro equipo de diseño.
        </p>
      </div>

      {/* Filtros móviles: búsqueda + chips horizontales */}
      <div className="lg:hidden mb-6 space-y-3">
        <form onSubmit={manejarBusqueda} className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en el catálogo..."
            className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[var(--color-primary)] transition shadow-sm"
          />
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
        </form>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer border ${
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

      {/* Controles: Búsqueda y Filtros */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
        <div className="hidden lg:block lg:col-span-1 space-y-6">
          {/* Panel Lateral de Filtros (Glassmorphism) */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm sticky top-24">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-[var(--color-primary)]" /> Filtros de Búsqueda
            </h2>

            {/* Formulario de Búsqueda */}
            <form onSubmit={manejarBusqueda} className="mb-6">
              <label className="block text-[10px] font-extrabold uppercase text-gray-400 tracking-wider mb-2">Búsqueda rápida</label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ej: Sillón Chesterfield..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[var(--color-primary)] transition"
                />
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
              </div>
              <button 
                type="submit"
                style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
                className="w-full mt-3 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:brightness-110 transition active:scale-98 cursor-pointer shadow-sm"
              >
                Buscar
              </button>
            </form>

            {/* Categorías */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-gray-400 tracking-wider mb-3">Categorías</label>
              <div className="flex flex-col gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-between cursor-pointer ${
                      category === cat
                        ? "bg-[var(--color-secondary)]/10 text-gray-900 border border-[var(--color-secondary)]/30"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
                    }`}
                  >
                    <span>{cat}</span>
                    {category === cat && <span className="h-2 w-2 rounded-full bg-[var(--color-secondary)]" />}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => { setSearch(''); setCategory('Todos'); }}
              className="w-full mt-6 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="h-3 w-3" /> Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Listado de Productos */}
        <div className="lg:col-span-3">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm mb-6 font-semibold">
              ⚠️ Error: {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : productos.length === 0 ? (
            <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl shadow-sm">
              <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700">No se encontraron productos</h3>
              <p className="text-sm text-gray-400 mt-1">Intentá ajustando los filtros de búsqueda o categoría.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 stagger-children">
              {productos.map((prod) => (
                <div key={prod.id} className="transform hover:-translate-y-1 transition duration-300">
                  <ProductCard producto={prod} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// useSearchParams requiere un límite de Suspense en el App Router
export default function CatalogPage() {
  return (
    <Suspense fallback={null}>
      <CatalogContent />
    </Suspense>
  );
}
