"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../components/AuthContext';
import { useFavorites } from '../../../components/FavoritesContext';
import { getApiUrl } from '../../../lib/config';
import { useRouter } from 'next/navigation';
import ProductCard from '../../../components/ProductCard';
import SkeletonCard from '../../../components/SkeletonCard';
import { Heart, Compass } from 'lucide-react';
import Link from 'next/link';

interface Producto {
  id: number;
  title: string;
  category: string;
  price: number;
  condition: 'USED' | 'NEW';
  image_url: string;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
}

export default function FavoritesPage() {
  const { usuario, token, cargando, logout } = useAuth();
  const { toggleFavorito } = useFavorites();
  const router = useRouter();

  const [favoritos, setFavoritos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavoritos = async () => {
    if (!token && !localStorage.getItem('vamaar_token')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiUrl()}/products/favorites`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('vamaar_token') || token}`
        }
      });
      if (res.status === 401) {
        logout();
        return;
      }
      if (!res.ok) throw new Error("No se pudieron cargar tus favoritos.");
      const data = await res.json();
      setFavoritos(data);
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuitarFavorito = async (id: number) => {
    try {
      await toggleFavorito(id);
      setFavoritos(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!cargando && !usuario) {
      router.push("/auth");
      return;
    }
    fetchFavoritos();
  }, [usuario, cargando]);

  if (cargando || (loading && favoritos.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in">
      <div className="mb-6 lg:mb-10 pb-4 border-b border-gray-100">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Mis Favoritos</h1>
        <p className="text-sm text-gray-500 mt-1">Objetos que guardaste para seguir de cerca.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm mb-8 font-semibold">
          ⚠️ Error: {error}
        </div>
      )}

      {favoritos.length === 0 ? (
        <div className="text-center py-20 px-4 bg-white border border-gray-100 rounded-3xl shadow-xs max-w-xl mx-auto">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
            <Heart className="h-6 w-6 stroke-[1.5]" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
            Guardá acá esos objetos que no querés perder de vista.
          </h3>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
            Cuando encuentres algo que te guste, tocá ♡ y lo dejamos acá para vos.
          </p>
          <Link 
            href="/catalog" 
            className="inline-flex items-center gap-2 mt-7 px-7 py-3 bg-gray-900 text-white rounded-full font-bold text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xs hover:shadow"
          >
            <Compass className="h-4 w-4" />
            Descubrir objetos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 stagger-children">
          {favoritos.map((prod) => {
            const isSold = prod.status === 'SOLD';
            return (
              <div key={prod.id} className="relative group transform hover:-translate-y-1 transition duration-300">
                <ProductCard producto={prod} />
                {isSold && (
                  <div className="absolute inset-0 bg-white/94 backdrop-blur-xs p-4 flex flex-col items-center justify-center text-center z-30 border border-gray-100 animate-fade-in">
                    {/* Botón para remover de favoritos */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleQuitarFavorito(prod.id);
                      }}
                      className="absolute top-2.5 right-2.5 p-1.5 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors cursor-pointer"
                      title="Quitar de favoritos"
                      aria-label="Quitar de favoritos"
                    >
                      <Heart className="h-3.5 w-3.5 fill-current" />
                    </button>

                    <span className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-full bg-stone-100 text-stone-600 border border-stone-200 mb-3">
                      Objeto vendido
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug max-w-[200px]">
                      Este objeto ya empezó una nueva historia.
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-500 mt-1 max-w-[200px] leading-relaxed">
                      Pero siempre hay algo nuevo por descubrir.
                    </p>
                    <Link
                      href={prod.category ? `/catalog?category=${encodeURIComponent(prod.category)}` : '/catalog'}
                      className="mt-4 px-3.5 py-1.5 bg-gray-900 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-black transition-all shadow-xs"
                    >
                      Seguir explorando
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
