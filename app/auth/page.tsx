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
  const tokenParam = searchParams.get('token');
  const redirectUrl = searchParams.get('redirect') || '/';

  const [montado, setMontado] = useState(false);
  
  // Modos de vista: 'auth' (login/registro), 'vendedor_intro', 'forgot_password', 'reset_password'
  const [viewMode, setViewMode] = useState<'auth' | 'vendedor_intro' | 'forgot_password' | 'reset_password'>('auth');
  const [esLogin, setEsLogin] = useState(true);

  // Campos de formulario (Email con autocompletado por teclado/mouse al escribir @)
  const [emailInput, setEmailInput] = useState('');
  const [mostrarSugerenciasEmail, setMostrarSugerenciasEmail] = useState(false);
  const [indiceSeleccionadoEmail, setIndiceSeleccionadoEmail] = useState(0);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
  const [passwordRestablecida, setPasswordRestablecida] = useState(false);

  const dominiosSugeridos = ['@gmail.com', '@hotmail.com', '@outlook.com', '@yahoo.com', '@icloud.com'];

  useEffect(() => {
    setMontado(true);
    if (modeParam === 'reset_password' && tokenParam) {
      setViewMode('reset_password');
    } else if (modeParam === 'seller' || redirectUrl.includes('/products/new')) {
      setViewMode('vendedor_intro');
    } else if (modeParam === 'register') {
      setViewMode('auth');
      setEsLogin(false);
    } else if (modeParam === 'login') {
      setViewMode('auth');
      setEsLogin(true);
    }
  }, [modeParam, tokenParam, redirectUrl]);

  // Al escribir en el cuadro de texto de email: activa sugerencias ÚNICAMENTE si termina en @ (ej: marisa@)
  const manejarInputEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmailInput(val);

    // La lista SOLO se muestra cuando el texto termina exactamente en '@'
    // Si no tiene '@' o si el usuario sigue escribiendo cualquier letra después del '@' (ej: marisa@o o root@objetia.com), la lista desaparece inmediatamente.
    if (val.includes('@')) {
      const parts = val.split('@');
      const domainPart = parts[1];
      if (domainPart === '') {
        setMostrarSugerenciasEmail(true);
        setIndiceSeleccionadoEmail(0);
      } else {
        setMostrarSugerenciasEmail(false);
      }
    } else {
      setMostrarSugerenciasEmail(false);
    }
  };

  // Navegación con teclado (Flechas arriba/abajo y Enter)
  const manejarKeyDownEmail = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!mostrarSugerenciasEmail) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndiceSeleccionadoEmail((prev) => (prev + 1) % dominiosSugeridos.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndiceSeleccionadoEmail((prev) => (prev - 1 + dominiosSugeridos.length) % dominiosSugeridos.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (dominiosSugeridos[indiceSeleccionadoEmail]) {
        seleccionarDominioEmail(dominiosSugeridos[indiceSeleccionadoEmail]);
      }
    } else if (e.key === 'Escape') {
      setMostrarSugerenciasEmail(false);
    }
  };

  // Al hacer clic o presionar Enter en una sugerencia
  const seleccionarDominioEmail = (dominio: string) => {
    const prefix = emailInput.split('@')[0].trim();
    setEmailInput(`${prefix}${dominio}`);
    setMostrarSugerenciasEmail(false);
  };

  // Obtiene el email completo
  const obtenerEmailCompleto = (): string => {
    return emailInput.trim();
  };

  // Formulario principal Submit (Crear Cuenta / Ingresar)
  const manejarEnvioClasico = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeError(null);

    const emailFinal = obtenerEmailCompleto();

    if (!emailFinal || !emailFinal.includes('@')) {
      toast.warning("Por favor, ingresá un correo electrónico válido para continuar.");
      return;
    }

    if (!esLogin && !aceptoTerminos) {
      toast.warning("Para poder brindarte un servicio seguro, necesitamos que aceptes los Términos y Condiciones.");
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
        const nombre = datos.user?.full_name?.split(" ")[0] || "";
        const saludo = nombre ? `¡Qué alegría tenerte con nosotros, ${nombre}! Tu cuenta con Google ya está activa.` : "¡Qué alegría tenerte con nosotros! Tu cuenta con Google ya está activa.";
        toast.success(saludo);
        login(datos.access_token, datos.user);
        router.push(redirectUrl);
      } catch (error: any) {
        setMensajeError(error.message);
        toast.error(error.message || "Tuvimos un inconveniente al conectar con Google. Probemos de nuevo.");
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
        const nombre = datos.user?.full_name?.split(" ")[0] || "";
        const saludo = nombre ? `¡Hola de nuevo, ${nombre}! Qué lindo tenerte de vuelta.` : "¡Hola de nuevo! Qué lindo tenerte de vuelta.";
        toast.success(saludo);
        login(datos.access_token, datos.user);
        router.push(redirectUrl);
      } else {
        const nombre = datos.user?.full_name?.split(" ")[0] || "";
        const saludo = nombre ? `¡Qué alegría tenerte con nosotros, ${nombre}! Tu espacio ya está listo.` : "¡Qué alegría tenerte con nosotros! Tu espacio ya está listo.";
        toast.success(saludo);
        if (datos.access_token && datos.user) {
          login(datos.access_token, datos.user);
        }
        router.push(redirectUrl);
      }
    } catch (error: any) {
      let msg = error.message || "No pudimos completar la operación.";
      if (msg === "Failed to fetch") {
        msg = "No logramos conectar con el servidor o los datos ingresados no coinciden. Verificalos e intentemos otra vez.";
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
      toast.warning("Por favor, ingresá un correo electrónico válido para que podamos ayudarte.");
      return;
    }
    setCargando(true);
    setMensajeError(null);
    try {
      const resp = await fetch(`${getApiUrl()}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailFinal })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.detail || "No pudimos procesar la solicitud en este momento.");
      }
      setEnlaceEnviado(true);
      toast.success(`Ya te enviamos el enlace para restablecer tu clave a ${emailFinal}. Revisá tu bandeja de entrada o Spam.`);
    } catch (err: any) {
      toast.error(err.message || "Tuvimos un inconveniente al enviar el correo. Por favor, probá de nuevo en unos momentos.");
    } finally {
      setCargando(false);
    }
  };

  const manejarRestablecimientoPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeError(null);

    if (!tokenParam) {
      toast.error("Parece que el enlace no incluye el código de seguridad o está incompleto. Solicitá uno nuevo.");
      return;
    }

    if (password.length < 6) {
      toast.warning("Para cuidar la seguridad de tu cuenta, la contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      toast.warning("Las contraseñas no coinciden. Por favor, escribilas de nuevo para asegurarte.");
      return;
    }

    setCargando(true);
    try {
      const resp = await fetch(`${getApiUrl()}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenParam,
          new_password: password
        })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.detail || "No pudimos restablecer tu contraseña en este momento.");
      }
      setPasswordRestablecida(true);
      toast.success("¡Excelente! Tu nueva contraseña ya está activa. Podés ingresar a tu cuenta cuando quieras.");
    } catch (err: any) {
      setMensajeError(err.message || "Tuvimos un inconveniente al actualizar tu clave.");
      toast.error(err.message || "Tuvimos un inconveniente al actualizar tu clave. Si el enlace expiró, podés pedir uno nuevo.");
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
        setGoogleAvatarUrl(payloadDecoded.picture || null);
        setFullName(dataCheck.full_name || payloadDecoded.name || '');
        toast.info("Encontramos tu cuenta de Google en Objetia. Hacé clic en ingresar para entrar directamente.");
        return;
      }

      if (esLogin) {
        // Si el usuario intentó iniciar sesión pero NO existía la cuenta en la DB:
        toast.warning("Aún no tenés una cuenta creada con este correo de Google. ¡Completá el registro en un instante!");
        setEsLogin(false);
      }

      // 2. SI NO EXISTE Y ES REGISTRO: Carga los datos de Google para que complete el formulario
      setGoogleCuentaExiste(false);
      setGoogleCredential(credentialResponse.credential);
      setFullName(payloadDecoded.name || '');
      setEmailInput(googleEmail);
      setGoogleAvatarUrl(payloadDecoded.picture || null);

      toast.info("Completamos tus datos básicos desde Google. Solo resta aceptar los términos para finalizar.");
    } catch (err: any) {
      toast.error("No pudimos conectar con Google. Por favor, probemos de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  if (!montado) return null;

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F5F4EF]">
      <div className="max-w-md sm:max-w-lg w-full bg-[#FAF8F5] p-6 sm:p-8 rounded-[28px] shadow-[0_8px_32px_rgba(78,66,52,0.08)] border border-[#EAE5DC] space-y-6 relative overflow-hidden">
        
        {/* Cabecera de Marca Objetia */}
        <div className="flex flex-col items-center text-center space-y-1 pt-1">
          <Link href="/" className="inline-flex flex-col items-center group cursor-pointer">
            <div className="h-11 w-11 rounded-2xl bg-[#FAF0E6] border border-[#EAE5DC] group-hover:border-[#B88D65]/40 flex items-center justify-center text-[#B88D65] shadow-xs mb-1.5 transition-colors">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#534636] group-hover:text-[#B88D65] transition-colors">
              OBJETIA
            </span>
          </Link>
        </div>

        {/* ============================================================================== */}
        {/* VISTA 1: INTRODUCCIÓN PARA VENDEDOR NO REGISTRADO */}
        {/* ============================================================================== */}
        {viewMode === 'vendedor_intro' && (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-[#FAF0E6] border border-[#EAE5DC] flex items-center justify-center text-[#B88D65] shadow-sm">
              <Sparkles className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#2C2723] tracking-tight">
                Vendé en Objetia
              </h2>
              <p className="text-xs text-[#73675C] leading-relaxed max-w-xs mx-auto">
                Dale una nueva historia a eso que ya no usás. <br />
                <span className="font-semibold text-[#2C2723]">Publicar es simple y gratis.</span>
              </p>
            </div>

            <div className="space-y-4 pt-2 border-t border-[#EAE5DC]">
              <div className="bg-[#FAF0E6] p-4 rounded-2xl border border-[#EAE5DC] space-y-2">
                <p className="text-xs font-bold text-[#534636]">¿Ya tenés una cuenta?</p>
                <button
                  onClick={() => { setViewMode('auth'); setEsLogin(true); setGoogleCuentaExiste(false); }}
                  className="w-full py-3 bg-[#B88D65] hover:bg-[#A37953] text-white rounded-xl text-xs font-bold tracking-wider uppercase transition shadow-sm cursor-pointer"
                >
                  INGRESAR
                </button>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#EAE5DC] space-y-2">
                <p className="text-xs font-bold text-[#534636]">¿Sos nuevo por acá?</p>
                <button
                  onClick={() => { setViewMode('auth'); setEsLogin(false); setGoogleCuentaExiste(false); }}
                  className="w-full py-3 bg-[#2C2723] hover:bg-[#1A1614] text-white rounded-xl text-xs font-bold tracking-wider uppercase transition shadow-sm cursor-pointer"
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
              <div className="mx-auto h-12 w-12 rounded-xl bg-[#FAF0E6] border border-[#EAE5DC] text-[#B88D65] flex items-center justify-center">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-[#2C2723]">¿Olvidaste tu contraseña?</h2>
              <p className="text-xs text-[#73675C] leading-relaxed max-w-xs mx-auto">
                Te ayudamos a volver a tu cuenta. Ingresá tu email y te enviaremos un enlace para crear una nueva contraseña.
              </p>
            </div>

            {enlaceEnviado ? (
              <div className="bg-emerald-50/90 p-5 rounded-2xl border border-emerald-200 text-center space-y-3">
                <div className="mx-auto w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  ✓
                </div>
                <p className="text-sm font-bold text-emerald-950">¡Todo listo! Te enviamos las instrucciones</p>
                <p className="text-xs text-emerald-800 leading-relaxed max-w-xs mx-auto">
                  Revisá la bandeja de entrada de <span className="font-bold text-emerald-950">{obtenerEmailCompleto()}</span> (o tu carpeta de Spam) para restablecer tu clave en un clic.
                </p>
                <button
                  onClick={() => { setViewMode('auth'); setEsLogin(true); setEnlaceEnviado(false); }}
                  className="text-xs font-bold text-[#B88D65] hover:text-[#A37953] transition pt-2 block mx-auto cursor-pointer"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            ) : (
              <form onSubmit={manejarRecuperacionPassword} className="space-y-4">
                
                {/* CAMPO EMAIL CON DESPLEGABLE INTELIGENTE */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-[#534636] mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-[#A89F91]" />
                    <input 
                      type="email" 
                      required
                      value={emailInput}
                      onChange={manejarInputEmail}
                      onKeyDown={manejarKeyDownEmail}
                      placeholder="Tu correo electrónico"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E6E1DB] rounded-xl text-xs text-[#2C2723] placeholder:text-[#A89F91] focus:bg-white focus:border-[#B88D65] focus:ring-2 focus:ring-[#B88D65]/20 focus:outline-none transition font-medium"
                    />
                  </div>

                  {/* DESPLEGABLE DE SERVIDORES CON PREVIEW Y TECLADO/MOUSE */}
                  {mostrarSugerenciasEmail && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#EAE5DC] rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-scale-in">
                      {dominiosSugeridos.map((dom, index) => {
                        const prefix = emailInput.split('@')[0];
                        const fullEmailOption = `${prefix}${dom}`;
                        const esSeleccionado = index === indiceSeleccionadoEmail;

                        return (
                          <button
                            key={dom}
                            type="button"
                            onMouseEnter={() => setIndiceSeleccionadoEmail(index)}
                            onClick={() => seleccionarDominioEmail(dom)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-between ${
                              esSeleccionado 
                                ? 'bg-[#FAF0E6] text-[#A97950] font-bold shadow-2xs' 
                                : 'text-[#534636] font-semibold hover:bg-[#F5F4EF] hover:text-[#2C2723]'
                            }`}
                          >
                            <span>{fullEmailOption}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full py-3.5 bg-[#B88D65] hover:bg-[#A37953] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
                >
                  {cargando ? "ENVIANDO..." : "ENVIAR ENLACE"}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('auth')}
                    className="text-xs font-semibold text-[#73675C] hover:text-[#2C2723] transition cursor-pointer"
                  >
                    Volver
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ============================================================================== */}
        {/* VISTA 2B: RESTABLECER CONTRASEÑA CON TOKEN */}
        {/* ============================================================================== */}
        {viewMode === 'reset_password' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="mx-auto h-12 w-12 rounded-xl bg-[#FAF0E6] border border-[#EAE5DC] text-[#B88D65] flex items-center justify-center">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-[#2C2723]">Restablecé tu contraseña</h2>
              <p className="text-xs text-[#73675C] leading-relaxed max-w-xs mx-auto">
                Ingresá tu nueva clave segura para volver a entrar a tu cuenta.
              </p>
            </div>

            {mensajeError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl text-center">
                {mensajeError}
              </div>
            )}

            {passwordRestablecida ? (
              <div className="bg-emerald-50/90 p-5 rounded-2xl border border-emerald-200 text-center space-y-3">
                <div className="mx-auto w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  ✓
                </div>
                <p className="text-sm font-bold text-emerald-950">¡Tu nueva clave ya está lista!</p>
                <p className="text-xs text-emerald-800 leading-relaxed max-w-xs mx-auto">
                  Actualizamos tu contraseña de forma segura. Ya podés ingresar y seguir disfrutando de Objetia.
                </p>
                <button
                  onClick={() => { setViewMode('auth'); setEsLogin(true); setPassword(''); setConfirmPassword(''); }}
                  className="w-full py-3.5 bg-[#B88D65] hover:bg-[#A37953] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm hover:shadow-md cursor-pointer"
                >
                  INGRESAR A MI CUENTA
                </button>
              </div>
            ) : (
              <form onSubmit={manejarRestablecimientoPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#534636] mb-1">Nueva Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-[#A89F91]" />
                    <input 
                      type="password" 
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E6E1DB] rounded-xl text-xs text-[#2C2723] placeholder:text-[#A89F91] focus:bg-white focus:border-[#B88D65] focus:ring-2 focus:ring-[#B88D65]/20 focus:outline-none transition font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#534636] mb-1">Confirmar Nueva Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-[#A89F91]" />
                    <input 
                      type="password" 
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repetí la contraseña"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E6E1DB] rounded-xl text-xs text-[#2C2723] placeholder:text-[#A89F91] focus:bg-white focus:border-[#B88D65] focus:ring-2 focus:ring-[#B88D65]/20 focus:outline-none transition font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full py-3.5 bg-[#B88D65] hover:bg-[#A37953] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
                >
                  {cargando ? "GUARDANDO..." : "CAMBIAR CONTRASEÑA"}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setViewMode('auth'); setEsLogin(true); }}
                    className="text-xs font-semibold text-[#73675C] hover:text-[#2C2723] transition cursor-pointer"
                  >
                    Volver al login
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
            <div className="mx-auto h-14 w-14 rounded-2xl bg-[#FAF0E6] border border-[#EAE5DC] text-[#B88D65] flex items-center justify-center">
              <AlertCircle className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[#2C2723]">¡Tu cuenta ya existe!</h2>
              <p className="text-xs text-[#73675C] leading-relaxed max-w-xs mx-auto">
                El correo electrónico <span className="font-bold text-[#2C2723]">{emailInput}</span> ya está registrado en Objetia.
              </p>
            </div>

            {googleAvatarUrl && (
              <div className="flex items-center justify-center gap-3 p-3 bg-white rounded-2xl border border-[#EAE5DC] max-w-xs mx-auto">
                <img src={googleAvatarUrl} alt="Avatar" className="h-10 w-10 rounded-full border-2 border-[#B88D65] object-cover" />
                <div className="text-left text-xs">
                  <p className="font-bold text-[#2C2723]">{fullName}</p>
                  <p className="text-[11px] text-[#73675C]">{emailInput}</p>
                </div>
              </div>
            )}

            <div className="pt-2 space-y-3">
              <button
                onClick={() => {
                  setGoogleCuentaExiste(false);
                  setEsLogin(true);
                }}
                className="w-full py-3.5 bg-[#B88D65] hover:bg-[#A37953] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>INGRESAR A MI CUENTA</span>
              </button>

              <button
                onClick={() => setGoogleCuentaExiste(false)}
                className="text-xs font-semibold text-[#73675C] hover:text-[#2C2723] transition block mx-auto cursor-pointer"
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
          <div className="space-y-5 animate-fade-in">
            {/* SELECTOR SEGMENTADO DE PESTAÑAS TIPO PÍLDORA */}
            <div className="p-1 bg-[#EFECE6] rounded-2xl flex gap-1 border border-[#E6E1DB]">
              <button
                type="button"
                onClick={() => { setEsLogin(true); setGoogleCredential(null); setGoogleCuentaExiste(false); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  esLogin 
                    ? 'bg-white text-[#2C2723] shadow-xs' 
                    : 'text-[#73675C] hover:text-[#2C2723]'
                }`}
              >
                Ingresar
              </button>
              <button
                type="button"
                onClick={() => { setEsLogin(false); setGoogleCredential(null); setGoogleCuentaExiste(false); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  !esLogin 
                    ? 'bg-white text-[#2C2723] shadow-xs' 
                    : 'text-[#73675C] hover:text-[#2C2723]'
                }`}
              >
                Crear cuenta
              </button>
            </div>

            {/* CABECERA DINÁMICA */}
            <div className="text-center space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-[#2C2723] tracking-tight">
                {esLogin ? "Qué bueno verte de nuevo" : "Unite a la comunidad Objetia"}
              </h2>
              <p className="text-xs text-[#73675C]">
                {esLogin 
                  ? "Ingresá con tus datos para gestionar tu cuenta." 
                  : "Completá tus datos para comprar y vender sin límites."}
              </p>
            </div>

            {/* MENSAJE DE ERROR */}
            {mensajeError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl text-center">
                {mensajeError}
              </div>
            )}

            {/* FORMULARIO */}
            <form onSubmit={manejarEnvioClasico} className="space-y-3.5">
              
              {/* VÍA A: REGISTRO CON GOOGLE (SOLO MUESTRA TARJETA CON FOTO, NOMBRE Y EMAIL) */}
              {!esLogin && googleCredential ? (
                <div className="bg-[#FAF0E6] p-4 rounded-2xl border border-[#EAE5DC] flex items-center gap-3.5 animate-scale-in shadow-2xs">
                  {googleAvatarUrl && (
                    <img src={googleAvatarUrl} alt="Avatar Google" className="h-12 w-12 rounded-full border-2 border-[#B88D65] object-cover shadow-xs" />
                  )}
                  <div className="text-left text-xs">
                    <p className="font-bold text-[#2C2723] text-sm">{fullName}</p>
                    <p className="text-xs text-[#B88D65] font-semibold">{emailInput}</p>
                  </div>
                </div>
              ) : (
                /* VÍA B: REGISTRO O LOGIN CLÁSICO (MUESTRA TEXTBOXES) */
                <>
                  {/* 1. CAMPO NOMBRE */}
                  {!esLogin && (
                    <div>
                      <label className="block text-xs font-semibold text-[#534636] mb-1">Nombre</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-[#A89F91]" />
                        <input 
                          type="text" 
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Tu nombre completo"
                          className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E6E1DB] rounded-xl text-xs text-[#2C2723] placeholder:text-[#A89F91] focus:bg-white focus:border-[#B88D65] focus:ring-2 focus:ring-[#B88D65]/20 focus:outline-none transition font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. CAMPO EMAIL (CON AUTOCOMPLETADO POR TECLADO/MOUSE AL ESCRIBIR @) */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-[#534636] mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-[#A89F91]" />
                      <input 
                        type="email" 
                        required
                        value={emailInput}
                        onChange={manejarInputEmail}
                        onKeyDown={manejarKeyDownEmail}
                        placeholder="Tu correo electrónico"
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E6E1DB] rounded-xl text-xs text-[#2C2723] placeholder:text-[#A89F91] focus:bg-white focus:border-[#B88D65] focus:ring-2 focus:ring-[#B88D65]/20 focus:outline-none transition font-medium"
                      />
                    </div>

                    {/* MENU DESPLEGABLE DE SERVIDORES DE CORREO CON PREVIEW COMPLETO */}
                    {mostrarSugerenciasEmail && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#EAE5DC] rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-scale-in">
                        {dominiosSugeridos.map((dom, index) => {
                          const prefix = emailInput.split('@')[0];
                          const fullEmailOption = `${prefix}${dom}`;
                          const esSeleccionado = index === indiceSeleccionadoEmail;

                          return (
                            <button
                              key={dom}
                              type="button"
                              onMouseEnter={() => setIndiceSeleccionadoEmail(index)}
                              onClick={() => seleccionarDominioEmail(dom)}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-between ${
                                esSeleccionado 
                                  ? 'bg-[#FAF0E6] text-[#A97950] font-bold shadow-2xs' 
                                  : 'text-[#534636] font-semibold hover:bg-[#F5F4EF] hover:text-[#2C2723]'
                              }`}
                            >
                              <span>{fullEmailOption}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 3. CAMPO CONTRASEÑA */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-[#534636]">Contraseña</label>
                      {esLogin && (
                        <button
                          type="button"
                          onClick={() => setViewMode('forgot_password')}
                          className="text-[11px] font-semibold text-[#B88D65] hover:text-[#A37953] hover:underline cursor-pointer"
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-[#A89F91]" />
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Tu contraseña"
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E6E1DB] rounded-xl text-xs text-[#2C2723] placeholder:text-[#A89F91] focus:bg-white focus:border-[#B88D65] focus:ring-2 focus:ring-[#B88D65]/20 focus:outline-none transition font-medium"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 4. OPCIÓN DE CONEXIÓN CON GOOGLE */}
              {!googleCredential && (
                <div className="space-y-2 pt-2 border-t border-[#EAE5DC]">
                  <p className="text-[10.5px] font-semibold text-[#73675C] text-center uppercase tracking-wider">
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
                <div className="space-y-2 pt-2.5 border-t border-[#EAE5DC] text-xs">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      required
                      checked={aceptoTerminos}
                      onChange={(e) => setAceptoTerminos(e.target.checked)}
                      className="mt-0.5 rounded text-[#B88D65] focus:ring-[#B88D65] border-[#E6E1DB] cursor-pointer"
                    />
                    <span className="text-[11px] text-[#73675C] leading-tight">
                      Acepto los{" "}
                      <button
                        type="button"
                        onClick={() => setModalLegalAbierto('terminos')}
                        className="font-bold text-[#B88D65] hover:text-[#A37953] hover:underline cursor-pointer"
                      >
                        Términos y Condiciones
                      </button>{" "}
                      y la{" "}
                      <button
                        type="button"
                        onClick={() => setModalLegalAbierto('privacidad')}
                        className="font-bold text-[#B88D65] hover:text-[#A37953] hover:underline cursor-pointer"
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
                      className="mt-0.5 rounded text-[#B88D65] focus:ring-[#B88D65] border-[#E6E1DB] cursor-pointer"
                    />
                    <span className="text-[11px] text-[#73675C] leading-tight">
                      Quiero recibir novedades, nuevos ingresos y hallazgos de Objetia.
                    </span>
                  </label>
                </div>
              )}

              {/* 6. BOTÓN SUBMIT FINAL */}
              <button
                type="submit"
                disabled={cargando}
                className="w-full py-3.5 bg-[#B88D65] hover:bg-[#A37953] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                <span>{esLogin ? "INGRESAR" : "CREAR MI CUENTA"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

            </form>

            {/* PIE Y ALTERNANCIA LOGIN <-> REGISTRO */}
            <div className="text-center pt-2 border-t border-[#EAE5DC]">
              {esLogin ? (
                <p className="text-xs text-[#73675C] font-medium">
                  ¿Todavía no tenés cuenta?{" "}
                  <button 
                    onClick={() => { setEsLogin(false); setGoogleCredential(null); setGoogleCuentaExiste(false); }}
                    className="font-bold text-[#B88D65] hover:text-[#A37953] hover:underline cursor-pointer ml-1"
                  >
                    CREAR MI CUENTA
                  </button>
                </p>
              ) : (
                <p className="text-xs text-[#73675C] font-medium">
                  ¿Ya tenés una cuenta?{" "}
                  <button 
                    onClick={() => { setEsLogin(true); setGoogleCredential(null); setGoogleCuentaExiste(false); }}
                    className="font-bold text-[#B88D65] hover:text-[#A37953] hover:underline cursor-pointer ml-1"
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
      {/* MODAL FLOTANTE DE TÉRMINOS Y PRIVACIDAD */}
      {/* ============================================================================== */}
      {modalLegalAbierto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setModalLegalAbierto(null)}
        >
          <div 
            className="relative w-full max-w-lg bg-[#FAF8F5] rounded-3xl overflow-hidden shadow-2xl border border-[#EAE5DC] p-6 space-y-4 max-h-[85vh] flex flex-col text-[#2C2723] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-[#EAE5DC]">
              <h3 className="text-base font-bold text-[#2C2723] flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#B88D65]" />
                {modalLegalAbierto === 'terminos' ? "Términos y Condiciones (v1.0)" : "Política de Privacidad"}
              </h3>
              <button 
                onClick={() => setModalLegalAbierto(null)}
                className="text-[#73675C] hover:text-[#2C2723] p-1.5 rounded-full hover:bg-[#F0ECE6] transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto text-xs space-y-3 pr-1 text-[#534636] leading-relaxed">
              {modalLegalAbierto === 'terminos' ? (
                <>
                  <p className="font-bold text-[#2C2723]">1. Aceptación de los Términos</p>
                  <p>Al registrarse y crear una cuenta en Objetia, el usuario acepta de manera libre e incondicional los presentes Términos y Condiciones de Uso del Marketplace.</p>
                  <p className="font-bold text-[#2C2723]">2. Publicación de Productos y Reglas de la Comunidad</p>
                  <p>Cada publicación debe incluir fotografías reales del producto. Queda estrictamente prohibida la divulgación de datos de contacto externo (teléfonos, WhatsApp, redes sociales) en las imágenes o descripciones de los artículos.</p>
                  <p className="font-bold text-[#2C2723]">3. Auditoría de Seguridad y Modificaciones</p>
                  <p>Objetia almacena de forma inalterable la fecha, hora exacta y versión legal (v1.0) aceptada por cada cuenta registrada.</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-[#2C2723]">1. Protección de Datos Personales</p>
                  <p>En Objetia garantizamos la privacidad de tus datos de acuerdo con las normativas vigentes. La información recopilada se utiliza exclusivamente para validar transacciones, gestionar envíos y ofrecerte una experiencia personalizada.</p>
                  <p className="font-bold text-[#2C2723]">2. Comunicaciones y Preferencias</p>
                  <p>Podés gestionar tus preferencias de correo electrónico y novedades en cualquier momento desde tu panel de usuario en Mi Objetia.</p>
                </>
              )}
            </div>

            <div className="pt-2 border-t border-[#EAE5DC] text-right">
              <button
                type="button"
                onClick={() => setModalLegalAbierto(null)}
                className="px-5 py-2.5 bg-[#B88D65] hover:bg-[#A37953] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Entendido y Cerrar
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
        <div className="min-h-[85vh] flex items-center justify-center bg-[#F5F4EF]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B88D65]"></div>
        </div>
      }>
        <LoginContent />
      </Suspense>
    </GoogleOAuthProvider>
  );
}
