"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../components/AuthContext';
import { getApiUrl } from '../../../lib/config';
import { useRouter } from 'next/navigation';
import ProductCard from '../../../components/ProductCard';
import SkeletonCard from '../../../components/SkeletonCard';
import { Heart, ArrowLeft, ShoppingBag } from 'lucide-react';
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
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mis Favoritos</h1>
        <p className="text-sm text-gray-500">Artículos exclusivos que guardaste para seguir de cerca.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm mb-8 font-semibold">
          ⚠️ Error: {error}
        </div>
      )}

      {favoritos.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl shadow-sm max-w-2xl mx-auto">
          <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-700">Aún no guardaste favoritos</h3>
          <p className="text-sm text-gray-400 mt-1">Explorá el catálogo e iniciá tu colección personal haciendo clic en el corazón.</p>
          <Link href="/catalog" className="inline-block mt-6 px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-gray-800 transition">
            Buscar artículos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 stagger-children">
          {favoritos.map((prod) => (
            <div key={prod.id} className="transform hover:-translate-y-1 transition duration-300">
              <ProductCard producto={prod} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
