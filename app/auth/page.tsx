"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { getApiUrl, getGoogleClientId } from '../../lib/config';
import { Mail, Lock, User, ArrowRight, Check, X, ShieldCheck, FileText, Sparkles, KeyRound, AlertCircle, LogIn } from 'lucide-react';
import Link from 'next/link';

function LoginContent() {
  const { login } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const modeParam = searchParams.get('mode');
  const redirectUrl = searchParams.get('redirect') || '/';

  const [montado, setMontado] = useState(false);
  
  // Modos de vista: 'auth' (login/registro), 'vendedor_intro', 'forgot_password'
  const [viewMode, setViewMode] = useState<'auth' | 'vendedor_intro' | 'forgot_password'>('auth');
  const [esLogin, setEsLogin] = useState(true);

  // Campos de formulario (Email compuesto con Dropdown integrado)
  const [emailInput, setEmailInput] = useState('');
  const [emailDomain, setEmailDomain] = useState('@gmail.com');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [aceptoTerminos, setAceptoTerminos] = useState(false);
  const [quieroNovedades, setQuieroNovedades] = useState(true);

  // Estado para registro con Google
  const [googleCredential, setGoogleCredential] = useState<string | null>(null);
  const [googleAvatarUrl, setGoogleAvatarUrl] = useState<string | null>(null);
  const [googleCuentaExiste, setGoogleCuentaExiste] = useState<boolean>(false);
  
  // Modales legales (sin perder datos de inputs)
  const [modalLegalAbierto, setModalLegalAbierto] = useState<'terminos' | 'privacidad' | null>(null);

  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [enlaceEnviado, setEnlaceEnviado] = useState(false);

  const dominiosDisponibles = ['@gmail.com', '@hotmail.com', '@outlook.com', '@yahoo.com', '@icloud.com'];

  useEffect(() => {
    setMontado(true);
    if (modeParam === 'seller' || redirectUrl.includes('/products/new')) {
      setViewMode('vendedor_intro');
    } else if (modeParam === 'register') {
      setViewMode('auth');
      setEsLogin(false);
    } else if (modeParam === 'login') {
      setViewMode('auth');
      setEsLogin(true);
    }
  }, [modeParam, redirectUrl]);

  // Al cambiar la opción en el dropdown de email
  const manejarCambioDominio = (nuevoDominio: string) => {
    setEmailDomain(nuevoDominio);
    if (nuevoDominio === 'otro') return;

    const raw = emailInput.trim();
    if (!raw) return;
    const prefix = raw.split('@')[0].trim();
    if (prefix) {
      setEmailInput(`${prefix}${nuevoDominio}`);
    }
  };

  // Al escribir en el input de texto de email
  const manejarInputEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmailInput(val);

    if (emailDomain !== 'otro' && val.includes('@')) {
      const parts = val.split('@');
      if (parts[1]) {
        const domEncontrado = dominiosDisponibles.find(d => d.slice(1).toLowerCase() === parts[1].toLowerCase());
        if (domEncontrado) {
          setEmailDomain(domEncontrado);
        } else {
          setEmailDomain('otro');
        }
      }
    }
  };

  // Calcula el email completo final
  const obtenerEmailCompleto = (): string => {
    const raw = emailInput.trim();
    if (!raw) return '';
    if (emailDomain === 'otro' || raw.includes('@')) {
      return raw;
    }
    return `${raw}${emailDomain}`;
  };

  // Formulario principal Submit (Crear Cuenta / Ingresar)
  const manejarEnvioClasico = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeError(null);

    const emailFinal = obtenerEmailCompleto();

    if (!emailFinal || !emailFinal.includes('@')) {
      toast.warning("Ingresá un correo electrónico válido.");
      return;
    }

    if (!esLogin && !aceptoTerminos) {
      toast.warning("Debés aceptar los Términos y Condiciones para poder continuar.");
      return;
    }

    setCargando(true);

    // Registro confirmado con Google
    if (!esLogin && googleCredential) {
      try {
        const respuesta = await fetch(`${getApiUrl()}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            id_token: googleCredential,
            wants_newsletter: quieroNovedades,
            accepted_terms: aceptoTerminos
          })
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) {
          throw new Error(datos.detail || "Error al registrarse con Google.");
        }
        toast.success(`¡Bienvenido a Objetia, ${datos.user?.full_name?.split(" ")[0] || ""}!`, "¡Cuenta creada e inicio automático!");
        login(datos.access_token, datos.user);
        router.push(redirectUrl);
      } catch (error: any) {
        setMensajeError(error.message);
        toast.error(error.message || "Falló el registro con Google.");
      } finally {
        setCargando(false);
      }
      return;
    }

    // Registro o Login tradicional
    const endpoint = esLogin 
      ? `${getApiUrl()}/auth/login/classic` 
      : `${getApiUrl()}/auth/register`;

    try {
      let cuerpoPeticion;
      let encabezados: Record<string, string> = {};

      if (esLogin) {
        encabezados["Content-Type"] = "application/x-www-form-urlencoded";
        cuerpoPeticion = new URLSearchParams({
          username: emailFinal,
          password: password
        }).toString();
      } else {
        encabezados["Content-Type"] = "application/json";
        cuerpoPeticion = JSON.stringify({ 
          email: emailFinal, 
          password: password, 
          full_name: fullName.trim(),
          accepted_terms: aceptoTerminos,
          wants_newsletter: quieroNovedades
        });
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
        router.push(redirectUrl);
      } else {
        toast.success(`¡Bienvenido a Objetia, ${datos.user?.full_name?.split(" ")[0] || ""}!`, "¡Cuenta creada e inicio automático!");
        if (datos.access_token && datos.user) {
          login(datos.access_token, datos.user);
        }
        router.push(redirectUrl);
      }
    } catch (error: any) {
      let msg = error.message || "No pudimos completar la operación.";
      if (msg === "Failed to fetch") {
        msg = "Correo electrónico o contraseña incorrectos, o el servidor no respondió.";
      }
      setMensajeError(msg);
      toast.error(msg);
    } finally {
      setCargando(false);
    }
  };

  const manejarRecuperacionPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailFinal = obtenerEmailCompleto();
    if (!emailFinal || !emailFinal.includes('@')) {
      toast.warning("Ingresá un correo electrónico válido.");
      return;
    }
    setCargando(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      setEnlaceEnviado(true);
      toast.success("Te enviamos las instrucciones a tu correo electrónico.", "¡Enlace Enviado!");
    } catch {
      toast.error("No pudimos enviar el enlace de recuperación.");
    } finally {
      setCargando(false);
    }
  };

  // Al seleccionar el botón de Google
  const manejarExitoGoogle = async (credentialResponse: any) => {
    setCargando(true);
    setMensajeError(null);

    try {
      const tokenParts = credentialResponse.credential.split('.');
      const payloadDecoded = JSON.parse(atob(tokenParts[1]));
      const googleEmail = payloadDecoded.email;

      // 1. Verificar si el correo ya existe en la base de datos de Objetia
      const respCheck = await fetch(`${getApiUrl()}/auth/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: googleEmail })
      });
      const dataCheck = await respCheck.json();

      if (dataCheck.exists) {
        // SI YA EXISTE: Muestra pantalla limpia avisando que ya existe con botón de Ingresar
        setGoogleCuentaExiste(true);
        setEmailInput(googleEmail);
        setEmailDomain('otro');
        setGoogleAvatarUrl(payloadDecoded.picture || null);
        setFullName(dataCheck.full_name || payloadDecoded.name || '');
        toast.info("Este correo de Google ya se encuentra registrado. Ingresá a tu cuenta.", "Cuenta existente");
        return;
      }

      if (esLogin) {
        // Si el usuario intentó iniciar sesión pero NO existía la cuenta en la DB:
        toast.warning("No encontramos una cuenta registrada con este correo de Google. Por favor registrate primero.");
        setEsLogin(false);
      }

      // 2. SI NO EXISTE Y ES REGISTRO: Carga los datos de Google para que complete el formulario
      setGoogleCuentaExiste(false);
      setGoogleCredential(credentialResponse.credential);
      setFullName(payloadDecoded.name || '');
      setEmailInput(googleEmail);
      setEmailDomain('otro');
      setGoogleAvatarUrl(payloadDecoded.picture || null);

      toast.info("Datos de Google precargados. Aceptá los Términos para finalizar tu registro.", "¡Casi listo!");
    } catch (err: any) {
      toast.error("No pudimos conectar con Google. Intentá nuevamente.");
    } finally {
      setCargando(false);
    }
  };

  if (!montado) return null;

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100 space-y-6 relative overflow-hidden">
        
        {/* ============================================================================== */}
        {/* VISTA 1: INTRODUCCIÓN PARA VENDEDOR NO REGISTRADO */}
        {/* ============================================================================== */}
        {viewMode === 'vendedor_intro' && (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Sparkles className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                Vendé en Objetia
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                Dale una nueva historia a eso que ya no usás. <br />
                <span className="font-bold text-gray-900">Publicar es simple y gratis.</span>
              </p>
            </div>

            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-100 space-y-2">
                <p className="text-xs font-extrabold text-purple-900">¿Ya tenés una cuenta?</p>
                <button
                  onClick={() => { setViewMode('auth'); setEsLogin(true); setGoogleCuentaExiste(false); }}
                  className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-black tracking-wider uppercase transition shadow-sm cursor-pointer"
                >
                  INGRESAR
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
                <p className="text-xs font-extrabold text-gray-800">¿Sos nuevo por acá?</p>
                <button
                  onClick={() => { setViewMode('auth'); setEsLogin(false); setGoogleCuentaExiste(false); }}
                  className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-black tracking-wider uppercase transition shadow-sm cursor-pointer"
                >
                  CREAR MI CUENTA
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* VISTA 2: RECUPERAR CONTRASEÑA */}
        {/* ============================================================================== */}
        {viewMode === 'forgot_password' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="mx-auto h-12 w-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-gray-900">¿Olvidaste tu contraseña?</h2>
              <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                Te ayudamos a volver a tu cuenta. Ingresá tu email y te enviaremos un enlace para crear una nueva contraseña.
              </p>
            </div>

            {enlaceEnviado ? (
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-center space-y-3">
                <p className="text-xs font-extrabold text-emerald-900">¡Enlace enviado a {obtenerEmailCompleto()}!</p>
                <p className="text-[11px] text-emerald-700">Revisá tu bandeja de entrada o carpeta de Spam.</p>
                <button
                  onClick={() => { setViewMode('auth'); setEsLogin(true); setEnlaceEnviado(false); }}
                  className="text-xs font-bold text-purple-700 hover:underline pt-2 block mx-auto cursor-pointer"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            ) : (
              <form onSubmit={manejarRecuperacionPassword} className="space-y-4">
                
                {/* CAMPO EMAIL CON DROPDOWN INTEGRADO DENTRO DEL CUADRO DE TEXTO */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                  <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl focus-within:bg-white focus-within:border-purple-600 transition overflow-hidden shadow-2xs">
                    <div className="pl-3 text-gray-400 flex items-center">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input 
                      type={emailDomain === 'otro' ? "email" : "text"} 
                      required
                      value={emailInput}
                      onChange={manejarInputEmail}
                      placeholder={emailDomain === 'otro' ? "tuemail@dominio.com" : "tuemail"}
                      className="w-full pl-2.5 pr-2 py-2.5 bg-transparent text-xs text-gray-900 focus:outline-none font-medium"
                    />
                    <div className="border-l border-gray-200 bg-gray-100/90 px-2.5 py-2 flex items-center self-stretch">
                      <select
                        value={emailDomain}
                        onChange={(e) => manejarCambioDominio(e.target.value)}
                        className="bg-transparent text-xs font-extrabold text-purple-900 focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="@gmail.com">@gmail.com</option>
                        <option value="@hotmail.com">@hotmail.com</option>
                        <option value="@outlook.com">@outlook.com</option>
                        <option value="@yahoo.com">@yahoo.com</option>
                        <option value="@icloud.com">@icloud.com</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md cursor-pointer"
                >
                  {cargando ? "ENVIANDO..." : "ENVIAR ENLACE"}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('auth')}
                    className="text-xs font-bold text-gray-500 hover:text-gray-800 transition cursor-pointer"
                  >
                    Volver
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ============================================================================== */}
        {/* VISTA 3: CASO DE CUENTA GOOGLE YA EXISTENTE EN BASE DE DATOS */}
        {/* ============================================================================== */}
        {viewMode === 'auth' && googleCuentaExiste && (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <AlertCircle className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-gray-900">¡Tu cuenta ya existe!</h2>
              <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                El correo electrónico <span className="font-bold text-gray-900">{emailInput}</span> ya está registrado en Objetia.
              </p>
            </div>

            {googleAvatarUrl && (
              <div className="flex items-center justify-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 max-w-xs mx-auto">
                <img src={googleAvatarUrl} alt="Avatar" className="h-10 w-10 rounded-full border border-purple-400 object-cover" />
                <div className="text-left text-xs">
                  <p className="font-bold text-gray-900">{fullName}</p>
                  <p className="text-[11px] text-gray-500">{emailInput}</p>
                </div>
              </div>
            )}

            <div className="pt-2 space-y-3">
              <button
                onClick={() => {
                  setGoogleCuentaExiste(false);
                  setEsLogin(true);
                }}
                className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>INGRESAR A MI CUENTA</span>
              </button>

              <button
                onClick={() => setGoogleCuentaExiste(false)}
                className="text-xs font-bold text-gray-500 hover:text-gray-800 transition block mx-auto cursor-pointer"
              >
                Probar con otro correo
              </button>
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* VISTA 4: LOGIN / REGISTRO PRINCIPAL */}
        {/* ============================================================================== */}
        {viewMode === 'auth' && !googleCuentaExiste && (
          <div className="space-y-6 animate-fade-in">
            {/* CABECERA DINÁMICA */}
            <div className="text-center space-y-1">
              <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                {esLogin ? "Qué bueno verte de nuevo" : "¡Estás a un paso de formar parte de la comunidad Objetia!"}
              </h2>
              <p className="text-xs text-gray-500">
                {esLogin 
                  ? "Ingresá a tu cuenta para empezar a vender en Objetia." 
                  : "Creá tu cuenta de forma rápida y segura."}
              </p>
            </div>

            {/* MENSAJE DE ERROR */}
            {mensajeError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl text-center">
                {mensajeError}
              </div>
            )}

            {/* FORMULARIO */}
            <form onSubmit={manejarEnvioClasico} className="space-y-4">
              
              {/* VÍA A: REGISTRO CON GOOGLE (SOLO MUESTRA TARJETA CON FOTO, NOMBRE Y EMAIL) */}
              {!esLogin && googleCredential ? (
                <div className="bg-purple-50/80 p-4 rounded-2xl border border-purple-200 flex items-center gap-3.5 animate-scale-in shadow-2xs">
                  {googleAvatarUrl && (
                    <img src={googleAvatarUrl} alt="Avatar Google" className="h-12 w-12 rounded-full border-2 border-purple-500 object-cover shadow-xs" />
                  )}
                  <div className="text-left text-xs">
                    <p className="font-black text-purple-950 text-sm">{fullName}</p>
                    <p className="text-xs text-purple-700 font-medium">{emailInput}</p>
                  </div>
                </div>
              ) : (
                /* VÍA B: REGISTRO O LOGIN CLÁSICO (MUESTRA TEXTBOXES) */
                <>
                  {/* 1. CAMPO NOMBRE */}
                  {!esLogin && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Nombre</label>
                      <p className="text-[10px] text-gray-400 mb-1">Así te vamos a identificar dentro de Objetia (ej: Marisa)</p>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input 
                          type="text" 
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Marisa"
                          className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-purple-600 focus:outline-none transition font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. CAMPO EMAIL CON DROPDOWN INTEGRADO */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                    {!esLogin && (
                      <p className="text-[10px] text-gray-400 mb-1">Lo vas a usar para ingresar a tu cuenta</p>
                    )}
                    <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl focus-within:bg-white focus-within:border-purple-600 transition overflow-hidden shadow-2xs">
                      <div className="pl-3 text-gray-400 flex items-center">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input 
                        type={emailDomain === 'otro' ? "email" : "text"} 
                        required
                        value={emailInput}
                        onChange={manejarInputEmail}
                        placeholder={emailDomain === 'otro' ? "tuemail@dominio.com" : "tuemail"}
                        className="w-full pl-2.5 pr-2 py-2.5 bg-transparent text-xs text-gray-900 focus:outline-none font-medium"
                      />
                      <div className="border-l border-gray-200 bg-gray-100/90 px-2.5 py-2 flex items-center self-stretch">
                        <select
                          value={emailDomain}
                          onChange={(e) => manejarCambioDominio(e.target.value)}
                          className="bg-transparent text-xs font-extrabold text-purple-900 focus:outline-none cursor-pointer pr-1"
                        >
                          <option value="@gmail.com">@gmail.com</option>
                          <option value="@hotmail.com">@hotmail.com</option>
                          <option value="@outlook.com">@outlook.com</option>
                          <option value="@yahoo.com">@yahoo.com</option>
                          <option value="@icloud.com">@icloud.com</option>
                          <option value="otro">Otro</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 3. CAMPO CONTRASEÑA */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-gray-700">Contraseña</label>
                      {esLogin && (
                        <button
                          type="button"
                          onClick={() => setViewMode('forgot_password')}
                          className="text-[10px] font-bold text-purple-700 hover:underline cursor-pointer"
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                      )}
                    </div>
                    {!esLogin && (
                      <p className="text-[10px] text-gray-400 mb-1">Creá una contraseña</p>
                    )}
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Tu contraseña"
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-purple-600 focus:outline-none transition"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 4. OPCIÓN DE CONEXIÓN CON GOOGLE (SOLO SI NO TIENE TOKEN PRECARGADO) */}
              {!googleCredential && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <p className="text-[11px] font-bold text-gray-500 text-center uppercase tracking-wider">
                    {esLogin ? "O ingresá directamente con" : "O registrate con Google"}
                  </p>
                  <div className="flex flex-col items-center justify-center">
                    <GoogleLogin
                      onSuccess={manejarExitoGoogle}
                      onError={() => toast.error("Error al conectar con Google.")}
                      useOneTap={false}
                      shape="pill"
                      text={esLogin ? "signin_with" : "signup_with"}
                    />
                  </div>
                </div>
              )}

              {/* 5. CHECKBOXES LEGALES Y DE NEWSLETTER */}
              {!esLogin && (
                <div className="space-y-2 pt-3 border-t border-gray-100 text-xs">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      required
                      checked={aceptoTerminos}
                      onChange={(e) => setAceptoTerminos(e.target.checked)}
                      className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <span className="text-[11px] text-gray-600 leading-tight">
                      Acepto los{" "}
                      <button
                        type="button"
                        onClick={() => setModalLegalAbierto('terminos')}
                        className="font-bold text-purple-700 hover:underline cursor-pointer"
                      >
                        Términos y Condiciones
                      </button>{" "}
                      y la{" "}
                      <button
                        type="button"
                        onClick={() => setModalLegalAbierto('privacidad')}
                        className="font-bold text-purple-700 hover:underline cursor-pointer"
                      >
                        Política de Privacidad
                      </button>{" "}
                      de Objetia.
                    </span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={quieroNovedades}
                      onChange={(e) => setQuieroNovedades(e.target.checked)}
                      className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <span className="text-[11px] text-gray-600 leading-tight">
                      Quiero recibir novedades, nuevos ingresos y hallazgos de Objetia.
                    </span>
                  </label>
                </div>
              )}

              {/* 6. BOTÓN SUBMIT FINAL (CREAR MI CUENTA / INGRESAR) */}
              <button
                type="submit"
                disabled={cargando}
                className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                <span>{esLogin ? "INGRESAR" : "CREAR MI CUENTA"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

            </form>

            {/* PIE Y ALTERNANCIA LOGIN <-> REGISTRO */}
            <div className="text-center pt-2 border-t border-gray-100">
              {esLogin ? (
                <p className="text-xs text-gray-600 font-medium">
                  ¿Todavía no tenés cuenta?{" "}
                  <button 
                    onClick={() => { setEsLogin(false); setGoogleCredential(null); setGoogleCuentaExiste(false); }}
                    className="font-black text-purple-700 hover:underline cursor-pointer ml-1"
                  >
                    CREAR MI CUENTA
                  </button>
                </p>
              ) : (
                <p className="text-xs text-gray-600 font-medium">
                  ¿Ya tenés una cuenta?{" "}
                  <button 
                    onClick={() => { setEsLogin(true); setGoogleCredential(null); setGoogleCuentaExiste(false); }}
                    className="font-black text-purple-700 hover:underline cursor-pointer ml-1"
                  >
                    INGRESAR
                  </button>
                </p>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ============================================================================== */}
      {/* MODAL FLOTANTE DE TÉRMINOS Y PRIVACIDAD (SIN PERDER LO COMPLETADO) */}
      {/* ============================================================================== */}
      {modalLegalAbierto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setModalLegalAbierto(null)}
        >
          <div 
            className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 p-6 space-y-4 max-h-[85vh] flex flex-col text-gray-800 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                {modalLegalAbierto === 'terminos' ? "Términos y Condiciones (v1.0)" : "Política de Privacidad"}
              </h3>
              <button 
                onClick={() => setModalLegalAbierto(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto text-xs space-y-3 pr-1 text-gray-600 leading-relaxed">
              {modalLegalAbierto === 'terminos' ? (
                <>
                  <p className="font-bold text-gray-900">1. Aceptación de los Términos</p>
                  <p>Al registrarse y crear una cuenta en Objetia, el usuario acepta de manera libre e incondicional los presentes Términos y Condiciones de Uso del Marketplace.</p>
                  <p className="font-bold text-gray-900">2. Publicación de Productos y Reglas de la Comunidad</p>
                  <p>Cada publicación debe incluir fotografías reales del producto. Queda estrictamente prohibida la divulgación de datos de contacto externo (teléfonos, WhatsApp, redes sociales) en las imágenes o descripciones de los artículos.</p>
                  <p className="font-bold text-gray-900">3. Auditoría de Seguridad y Modificaciones</p>
                  <p>Objetia almacena de forma inalterable la fecha, hora exacta y versión legal (v1.0) aceptada por cada cuenta registrada.</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-gray-900">1. Protección de Datos Personales</p>
                  <p>En Objetia garantizamos la privacidad de tus datos de acuerdo con las normativas vigentes. La información recopilada se utiliza exclusivamente para validar transacciones, gestionar envíos y ofrecerte una experiencia personalizada.</p>
                  <p className="font-bold text-gray-900">2. Comunicaciones y Preferencias</p>
                  <p>Podés gestionar tus preferencias de correo electrónico y novedades en cualquier momento desde tu panel de usuario en Mi Espacio.</p>
                </>
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 text-right">
              <button
                type="button"
                onClick={() => setModalLegalAbierto(null)}
                className="px-5 py-2 bg-purple-700 text-white rounded-xl text-xs font-bold hover:bg-purple-800 transition cursor-pointer"
              >
                Entendido and Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuthPage() {
  const googleClientId = getGoogleClientId();

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Suspense fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      }>
        <LoginContent />
      </Suspense>
    </GoogleOAuthProvider>
  );
}
