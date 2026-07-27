"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from '../lib/api';

interface FavoritesContextType {
  esFavorito: (productId: number) => boolean;
  /** Alterna el favorito con UI optimista. Devuelve el estado final o null si falló. */
  toggleFavorito: (productId: number) => Promise<boolean | null>;
}

const FavoritesContext = createContext<FavoritesContextType>({
  esFavorito: () => false,
  toggleFavorito: async () => null,
});

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const [favoritos, setFavoritos] = useState<Set<number>>(new Set());

  // Cargar los IDs de favoritos al iniciar sesión; limpiar al cerrarla
  useEffect(() => {
    if (!usuario) {
      setFavoritos(new Set());
      return;
    }
    let cancelado = false;
    apiFetch<number[]>('/products/favorites/ids')
      .then((ids) => {
        if (!cancelado) setFavoritos(new Set(ids));
      })
      .catch(() => {
        /* Sin favoritos disponibles: los corazones quedan sin marcar */
      });
    return () => {
      cancelado = true;
    };
  }, [usuario]);

  const esFavorito = useCallback((productId: number) => favoritos.has(productId), [favoritos]);

  const toggleFavorito = useCallback(async (productId: number): Promise<boolean | null> => {
    // UI optimista: reflejar el cambio de inmediato en todas las tarjetas
    let estadoPrevio = false;
    setFavoritos((prev) => {
      estadoPrevio = prev.has(productId);
      const next = new Set(prev);
      if (estadoPrevio) next.delete(productId);
      else next.add(productId);
      return next;
    });

    try {
      const data = await apiFetch<{ favorito: boolean }>(`/products/${productId}/favorite`, { method: 'POST' });
      // Reconciliar con la respuesta real del backend
      setFavoritos((prev) => {
        const next = new Set(prev);
        if (data.favorito) next.add(productId);
        else next.delete(productId);
        return next;
      });
      return data.favorito;
    } catch (err) {
      // Revertir la UI optimista
      setFavoritos((prev) => {
        const next = new Set(prev);
        if (estadoPrevio) next.add(productId);
        else next.delete(productId);
        return next;
      });
      throw err;
    }
  }, []);

  return (
    <FavoritesContext.Provider value={{ esFavorito, toggleFavorito }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);
