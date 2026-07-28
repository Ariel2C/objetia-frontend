"use client";
import React, { useState, useEffect } from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { useRouter } from 'next/navigation';
import { getApiUrl, getGoogleClientId } from '../../lib/config';
import { Mail, Lock, User } from 'lucide-react';

function LoginContent() {
  const { login } = useAuth();
  const toast = useToast();
  const router = useRouter();
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

      toast.success("Conexión con Google exitosa. Redirigiendo...", "¡Bienvenido a Objetia!");
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
    <div className="min-h-[85vh] flex items-start justify-center px-4 pt-8 sm:pt-12 md:pt-16 pb-16 bg-gray-50/50">
      <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-none shadow-xl border border-gray-200 animate-slide-up relative">
        
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase" style={{ fontFamily: 'var(--font-family-brand, Outfit)' }}>
            {esLogin ? "Bienvenido a Objetia" : "Crear tu cuenta en Objetia"}
          </h2>
          <p className="text-xs text-gray-500 mt-1.5 font-medium">
            {esLogin ? "Ingresá a tu cuenta para gestionar tus compras y ventas" : "Unite a la comunidad de decoración premium de Argentina"}
          </p>
        </div>

        {mensajeError && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-none text-xs font-semibold animate-slide-down">
            ⚠️ {mensajeError}
          </div>
        )}

        {/* Botón de Google OAuth */}
        <div className="w-full flex justify-center mb-5">
          <GoogleLogin 
            onSuccess={manejarExitoGoogle}
            onError={() => setMensajeError("La autenticación con el proveedor de Google falló.")}
            theme="outline"
            size="large"
            text={esLogin ? "signin_with" : "signup_with"}
            shape="rectangular"
            width="320"
          />
        </div>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-white px-3 text-gray-400 font-extrabold">O continuar con correo</span></div>
        </div>

        <form onSubmit={manejarEnvioClasico} className="space-y-4">
          {!esLogin && (
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-none pl-10 pr-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@objetia.com.ar"
                className="w-full bg-gray-50/50 border border-gray-200 rounded-none pl-10 pr-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-gray-50/50 border border-gray-200 rounded-none pl-10 pr-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit" disabled={cargando}
            style={{ 
              backgroundColor: 'var(--color-primary, #2C3E50)',
              color: '#FFFFFF'
            }}
            className="w-full mt-5 font-bold rounded-none transition py-3 shadow-md disabled:opacity-50 hover:opacity-95 active:scale-[0.99] cursor-pointer text-xs uppercase tracking-wider transition-all"
          >
            {cargando ? "Conectando..." : (esLogin ? "Iniciar Sesión" : "Crear Cuenta")}
          </button>
        </form>

        <div className="text-center mt-6 pt-5 border-t border-gray-100 text-xs">
          <p className="text-gray-500 font-medium">
            {esLogin ? "¿No tenés una cuenta?" : "¿Ya tenés una cuenta?"}{' '}
            <button
              type="button"
              onClick={() => { setEsLogin(!esLogin); setMensajeError(null); }}
              className="font-bold text-gray-900 hover:underline cursor-pointer ml-1"
            >
              {esLogin ? "Registrate acá" : "Iniciá sesión acá"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <GoogleOAuthProvider clientId={getGoogleClientId()}>
      <LoginContent />
    </GoogleOAuthProvider>
  );
}
