"use client";
import React, { useState, useEffect } from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { useRouter } from 'next/navigation'; // 🌟 IMPORTACIÓN CRÍTICA NEXT.JS
import { getApiUrl, getGoogleClientId } from '../../lib/config';
// app/auth/page.tsx (o la ruta correspondiente a tu Login)


function LoginContent() {
  const { login } = useAuth();
  const toast = useToast();
  const router = useRouter(); // 🌟 Inicializamos el enrutador nativo de cliente
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  const [esLogin, setEsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const manejarEnvioClasico = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensajeError(null);

    const endpoint = esLogin 
      ? `${getApiUrl()}/auth/login/classic` 
      : `${getApiUrl()}/auth/register`;

    try {
      let cuerpoPeticion;
      let encabezados: Record<string, string> = {};

      if (esLogin) {
        encabezados["Content-Type"] = "application/x-www-form-urlencoded";
        cuerpoPeticion = new URLSearchParams({
          username: email,
          password: password
        }).toString();
      } else {
        encabezados["Content-Type"] = "application/json";
        cuerpoPeticion = JSON.stringify({ email, password, full_name: fullName });
      }

      const respuesta = await fetch(endpoint, {
        method: "POST",
        headers: encabezados,
        body: cuerpoPeticion
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.detail || "Error en el servidor.");
      }

      if (esLogin) {
        toast.success(`Hola de nuevo, ${datos.user?.full_name?.split(" ")[0] || ""}.`, "¡Inicio de sesión exitoso!");
        login(datos.access_token, datos.user);
        // El contexto ya quedó actualizado: navegación inmediata sin recarga dura
        router.push("/");
      } else {
        toast.success("Ya podés ingresar con tu correo y contraseña.", "¡Cuenta creada con éxito!");
        setEsLogin(true); 
        setEmail('');
        setPassword('');
      }
    } catch (error: any) {
      setMensajeError(error.message);
      toast.error(error.message || "No pudimos completar la operación.");
    } finally {
      setCargando(false);
    }
  };

  const manejarExitoGoogle = async (credentialResponse: any) => {
    setCargando(true);
    setMensajeError(null);

    try {
      const respuesta = await fetch(`${getApiUrl()}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: credentialResponse.credential })
      });
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.detail || "Error al autenticar con Google.");
      }

      toast.success("Conexión con Google exitosa. Redirigiendo...", "¡Bienvenido!");
      login(datos.access_token, datos.user);
      router.push("/");

    } catch (error: any) {
      setMensajeError(error.message);
      toast.error(error.message || "Error al autenticar con Google.");
    } finally {
      setCargando(false);
    }
  };

  if (!montado) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200 animate-slide-up">
        
        <div className="text-center mb-8">
          {/* Aplicamos tu variable de color primaria para el título de la marca de forma sutil */}
          <h2 className="text-3xl font-extrabold" style={{ color: 'var(--color-primary)' }}>
            {esLogin ? "Bienvenido a Vamaar" : "Crear una cuenta"}
          </h2>
          <p className="text-sm text-gray-500 mt-2">Accedé al marketplace de decoración premium</p>
        </div>

        {mensajeError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-semibold animate-slide-down">⚠️ {mensajeError}</div>}

        <div className="w-full flex justify-center mb-6">
          <GoogleLogin 
            onSuccess={manejarExitoGoogle}
            onError={() => setMensajeError("La autenticación con el proveedor de Google falló.")}
            theme="outline"
            size="large"
            text={esLogin ? "signin_with" : "signup_with"}
            shape="rectangular"
            width="300"
          />
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-gray-400 font-medium">O usar correo clásico</span></div>
        </div>

        <form onSubmit={manejarEnvioClasico} className="space-y-4">
          {!esLogin && (
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Nombre Completo</label>
              <input
                type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Correo Electrónico</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@vamaar.com"
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Contraseña</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400"
            />
          </div>

          {/* 🌟 INTEGRACIÓN SENIOR: El botón ahora adopta la identidad visual configurada por el administrador mediante '--color-secondary' */}
          <button
            type="submit" disabled={cargando}
            style={{ 
              backgroundColor: 'var(--color-secondary)',
              color: '#111827' // Forzamos un contraste legible y elegante de texto oscuro sobre el dorado/secundario
            }}
            className="w-full mt-6 font-bold rounded-lg transition py-3 shadow-md disabled:opacity-50 hover:brightness-105 active:brightness-95 cursor-pointer text-xs uppercase tracking-wider transition-all"
          >
            {cargando ? "Conectando..." : (esLogin ? "Iniciar Sesión" : "Crear Cuenta")}
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-gray-100 text-sm">
          <p className="text-gray-500 font-medium">
            {esLogin ? "¿No tenés una cuenta?" : "¿Ya tenés una cuenta?"}{' '}
            <button
              type="button"
              onClick={() => { setEsLogin(!esLogin); setMensajeError(null); }}
             
              style={{ color: 'var(--color-primary)' }}
              className="font-bold hover:underline cursor-pointer ml-1"
            >
              {esLogin ? "Registrate acá" : "Iniciá sesión acá"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}

// El proveedor de Google vive solo en esta página: evita que el script GSI
// se inicialice en cada navegación del resto de la app.
export default function LoginPage() {
  return (
    <GoogleOAuthProvider clientId={getGoogleClientId()}>
      <LoginContent />
    </GoogleOAuthProvider>
  );
}
