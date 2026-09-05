"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getApiUrl } from '../lib/config';

interface Usuario {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  permissions?: string[];
}

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  login: (token: string, datosUsuario: Usuario) => void;
  logout: () => void;
  cargando: boolean;
  tienePermiso: (codigoPermiso: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Función auxiliar para decodificar el payload de un token JWT de forma nativa
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const verificarExpiracionToken = () => {
    const tokenGuardado = localStorage.getItem("vamaar_token");
    const usuarioGuardado = localStorage.getItem("vamaar_user");

    if (tokenGuardado && usuarioGuardado) {
      const decoded = decodeJWT(tokenGuardado);
      if (decoded && decoded.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime >= decoded.exp) {
          localStorage.removeItem("vamaar_token");
          localStorage.removeItem("vamaar_user");
          setToken(null);
          setUsuario(null);
        } else {
          try {
            setToken(tokenGuardado);
            // Mantener la misma referencia si el usuario no cambió: evita re-renders
            // y efectos en cascada cada vez que la ventana recupera el foco
            const nuevoUsuario = JSON.parse(usuarioGuardado);
            setUsuario(prev =>
              prev && JSON.stringify(prev) === JSON.stringify(nuevoUsuario) ? prev : nuevoUsuario
            );
          } catch (err) {
            localStorage.removeItem("vamaar_token");
            localStorage.removeItem("vamaar_user");
            setToken(null);
            setUsuario(null);
          }
        }
      } else {
        localStorage.removeItem("vamaar_token");
        localStorage.removeItem("vamaar_user");
        setToken(null);
        setUsuario(null);
      }
    } else {
      // React ignora el update si el valor no cambió, así que es seguro llamarlo siempre
      setToken(null);
      setUsuario(null);
    }
  };

  // Inicialización única: restaurar sesión, refrescar perfil y registrar listeners
  useEffect(() => {
    verificarExpiracionToken();
    setCargando(false);

    // Refrescar info de perfil real en segundo plano
    const tokenGuardado = localStorage.getItem("vamaar_token");
    if (tokenGuardado) {
      fetch(`${getApiUrl()}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${tokenGuardado}`
        }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error(`Respuesta ${res.status} de /auth/me`);
      })
      .then(data => {
        setUsuario(data);
        localStorage.setItem("vamaar_user", JSON.stringify(data));
      })
      .catch((err) => console.error("No se pudo refrescar el perfil:", err));
    }

    // Cierre de sesión unificado cuando cualquier request recibe un 401
    const handleUnauthorized = () => {
      localStorage.removeItem("vamaar_token");
      localStorage.removeItem("vamaar_user");
      setToken(null);
      setUsuario(null);
    };

    window.addEventListener("focus", verificarExpiracionToken);
    document.addEventListener("visibilitychange", verificarExpiracionToken);
    window.addEventListener("vamaar:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("focus", verificarExpiracionToken);
      document.removeEventListener("visibilitychange", verificarExpiracionToken);
      window.removeEventListener("vamaar:unauthorized", handleUnauthorized);
    };
  }, []);

  const login = (nuevoToken: string, datosUsuario: Usuario) => {
    setToken(nuevoToken);
    setUsuario(datosUsuario);
    localStorage.setItem("vamaar_token", nuevoToken);
    localStorage.setItem("vamaar_user", JSON.stringify(datosUsuario));

    // Refrescar permisos actualizados inmediatamente en segundo plano
    fetch(`${getApiUrl()}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${nuevoToken}`
      }
    })
    .then(res => {
      if (res.ok) return res.json();
      throw new Error(`Status ${res.status}`);
    })
    .then(fullData => {
      setUsuario(fullData);
      localStorage.setItem("vamaar_user", JSON.stringify(fullData));
    })
    .catch(() => {});
  };

  const tienePermiso = (codigoPermiso: string): boolean => {
    if (!usuario) return false;
    const userRoleClean = (usuario.role || '').toLowerCase();
    if (userRoleClean === 'root') return true;

    const perms = (usuario.permissions || []).map(p => p.toLowerCase());
    if (perms.includes('full_access')) return true;

    const target = codigoPermiso.toLowerCase();
    return perms.includes(target);
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem("vamaar_token");
    localStorage.removeItem("vamaar_user");
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, cargando, tienePermiso }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
}
