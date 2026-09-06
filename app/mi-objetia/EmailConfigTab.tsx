"use client";
import React, { useState, useEffect } from 'react';
import { Mail, Check, AlertCircle, Send, ShieldCheck, Sparkles, RefreshCw, Key, Server, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { getApiUrl } from '../../lib/config';

export default function EmailConfigTab() {
  const { token } = useAuth();
  const toast = useToast();

  const [host, setHost] = useState("smtp.gmail.com");
  const [port, setPort] = useState(587);
  const [user, setUser] = useState("objetia.ar@gmail.com");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [fromEmail, setFromEmail] = useState("objetia.ar@gmail.com");
  const [projectName, setProjectName] = useState("Objetia");

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);

  // Prueba de envío
  const [testEmail, setTestEmail] = useState("objetia.ar@gmail.com");
  const [probando, setProbando] = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState<{ ok: boolean; message: string } | null>(null);

  const cargarConfiguracion = async () => {
    setCargando(true);
    try {
      const res = await fetch(`${getApiUrl()}/root/email-config`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setHost(data.host || "smtp.gmail.com");
        setPort(data.port || 587);
        setUser(data.user || "objetia.ar@gmail.com");
        if (data.password) {
          setPassword(data.password);
        }
        setFromEmail(data.from_email || data.user || "objetia.ar@gmail.com");
        setProjectName(data.project_name || "Objetia");
        setIsConfigured(data.is_configured);
        setHasPassword(data.has_password);
      }
    } catch (err) {
      console.error("Error al cargar config SMTP:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (token) {
      cargarConfiguracion();
    }
  }, [token]);

  const aplicarPreset = (tipo: 'gmail' | 'resend' | 'brevo') => {
    if (tipo === 'gmail') {
      setHost("smtp.gmail.com");
      setPort(587);
      setUser("objetia.ar@gmail.com");
      setFromEmail("objetia.ar@gmail.com");
      toast.info("Preset Gmail aplicado. Se configuró objetia.ar@gmail.com.");
    } else if (tipo === 'resend') {
      setHost("smtp.resend.com");
      setPort(587);
      setUser("resend");
      setFromEmail("onboarding@resend.dev");
      toast.info("Preset Resend cargado (3.000 emails/mes gratis).");
    } else if (tipo === 'brevo') {
      setHost("smtp-relay.brevo.com");
      setPort(587);
      toast.info("Preset Brevo cargado (300 emails/día gratis).");
    }
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const cleanPassword = password.trim().replace(/\s+/g, '');
      const res = await fetch(`${getApiUrl()}/root/email-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          host,
          port: Number(port),
          user: user.trim(),
          password: cleanPassword,
          from_email: fromEmail.trim(),
          project_name: projectName.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al guardar configuración.");

      toast.success("Configuración SMTP guardada correctamente en el servidor.", "Servidor de Emails");
      setPassword(cleanPassword);
      setIsConfigured(true);
      setHasPassword(true);
    } catch (err: any) {
      toast.error(err.message || "No se pudo guardar la configuración.");
    } finally {
      setGuardando(false);
    }
  };

  const handleProbarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes('@')) {
      toast.warning("Ingresa un email de destino válido para la prueba.");
      return;
    }
    setProbando(true);
    setResultadoPrueba(null);
    try {
      const cleanPassword = password.trim().replace(/\s+/g, '');
      const res = await fetch(`${getApiUrl()}/root/email-config/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          destination_email: testEmail.trim(),
          custom_config: {
            host: host.trim(),
            port: Number(port),
            user: user.trim(),
            password: cleanPassword || undefined,
            from_email: fromEmail.trim(),
            project_name: projectName.trim()
          }
        })
      });
      const data = await res.json();
      setResultadoPrueba(data);
      if (data.ok) {
        toast.success(data.message, "Prueba Exitosa");
      } else {
        toast.error(data.message, "Fallo de Envío");
      }
    } catch (err: any) {
      setResultadoPrueba({ ok: false, message: err.message || "Error al conectar con el servidor backend." });
    } finally {
      setProbando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 text-[#e3e3e3]">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#282a2c] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#282a2c] text-[#87a9ff]">
              <Mail className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold text-[#f1f3f4]">Servidor y Envío de Emails (SMTP)</h2>
          </div>
          <p className="text-xs text-[#9aa0a6] mt-1">
            Configuración para los emails automáticos de bienvenida ($5.000 de regalo), recuperación de contraseñas y notificaciones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="h-3.5 w-3.5" /> Servidor Activo y Guardado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <AlertCircle className="h-3.5 w-3.5" /> Sin Configurar
            </span>
          )}
        </div>
      </div>

      {/* PRESETS RECOMENDADOS */}
      <div className="bg-[#1e1f20] border border-[#333538] rounded-2xl p-4 sm:p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#87a9ff] flex items-center gap-1.5">
          <Sparkles className="h-4 w-4" /> Servidores Recomendados
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <button
            type="button"
            onClick={() => aplicarPreset('gmail')}
            className="p-3 bg-[#282a2c]/60 hover:bg-[#282a2c] border border-emerald-500/40 rounded-xl text-left transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white group-hover:text-[#87a9ff]">Google / Gmail (Activo)</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">100% Gratis</span>
            </div>
            <p className="text-[11px] text-[#9aa0a6] mt-1 leading-snug">
              Configurado con <strong>objetia.ar@gmail.com</strong> y clave de aplicación de 16 caracteres.
            </p>
          </button>

          <button
            type="button"
            onClick={() => aplicarPreset('resend')}
            className="p-3 bg-[#282a2c]/60 hover:bg-[#282a2c] border border-[#3c4043] hover:border-[#87a9ff]/40 rounded-xl text-left transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white group-hover:text-[#87a9ff]">Resend</span>
              <span className="text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded font-mono">3.000 / mes</span>
            </div>
            <p className="text-[11px] text-[#9aa0a6] mt-1 leading-snug">
              Excelente entregabilidad sin tarjeta. Creas una cuenta en resend.com y pegas tu API Key.
            </p>
          </button>

          <button
            type="button"
            onClick={() => aplicarPreset('brevo')}
            className="p-3 bg-[#282a2c]/60 hover:bg-[#282a2c] border border-[#3c4043] hover:border-[#87a9ff]/40 rounded-xl text-left transition cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white group-hover:text-[#87a9ff]">Brevo (Sendinblue)</span>
              <span className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded font-mono">300 / día</span>
            </div>
            <p className="text-[11px] text-[#9aa0a6] mt-1 leading-snug">
              Servidor SMTP robusto para correos transaccionales.
            </p>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORMULARIO DE PARÁMETROS SMTP */}
        <div className="lg:col-span-2 bg-[#1e1f20] border border-[#333538] rounded-2xl p-5 sm:p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#282a2c] pb-3">
            <Server className="h-4 w-4 text-[#87a9ff]" /> Credenciales del Servidor
          </h3>

          <form onSubmit={handleGuardar} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#c4c7c5] mb-1">Host SMTP</label>
                <input
                  type="text"
                  required
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="w-full bg-[#18181a] border border-[#3c4043] rounded-xl px-3 py-2.5 text-xs text-white placeholder-[#80868b] focus:border-[#87a9ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#c4c7c5] mb-1">Puerto</label>
                <input
                  type="number"
                  required
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  placeholder="587"
                  className="w-full bg-[#18181a] border border-[#3c4043] rounded-xl px-3 py-2.5 text-xs text-white placeholder-[#80868b] focus:border-[#87a9ff] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#c4c7c5] mb-1">Usuario / Email SMTP</label>
                <input
                  type="text"
                  required
                  value={user}
                  onChange={(e) => setUser(e.target.value.trim())}
                  placeholder="objetia.ar@gmail.com"
                  className="w-full bg-[#18181a] border border-[#3c4043] rounded-xl px-3 py-2.5 text-xs text-white placeholder-[#80868b] focus:border-[#87a9ff] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-[#c4c7c5]">Contraseña de Aplicación (16 dígitos)</label>
                  {hasPassword && (
                    <span className="text-[10px] text-emerald-400 font-bold">✓ Guardada</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={mostrarPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value.replace(/\s+/g, ''))}
                    placeholder="meqjlbcvqivbokzd"
                    className="w-full bg-[#18181a] border border-[#3c4043] rounded-xl pl-3 pr-10 py-2.5 text-xs text-white placeholder-[#80868b] focus:border-[#87a9ff] focus:outline-none font-mono tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-2.5 top-2.5 text-[#9aa0a6] hover:text-white p-0.5 cursor-pointer"
                    title={mostrarPassword ? "Ocultar" : "Mostrar"}
                  >
                    {mostrarPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-[#9aa0a6] mt-1">
                  Se eliminan automáticamente los espacios para que Gmail lo autentique sin error.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#c4c7c5] mb-1">Email Remitente (From)</label>
                <input
                  type="email"
                  required
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value.trim())}
                  placeholder="objetia.ar@gmail.com"
                  className="w-full bg-[#18181a] border border-[#3c4043] rounded-xl px-3 py-2.5 text-xs text-white placeholder-[#80868b] focus:border-[#87a9ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#c4c7c5] mb-1">Nombre Visible de la Marca</label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Objetia"
                  className="w-full bg-[#18181a] border border-[#3c4043] rounded-xl px-3 py-2.5 text-xs text-white placeholder-[#80868b] focus:border-[#87a9ff] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={guardando}
                className="px-5 py-2.5 bg-[#87a9ff] hover:bg-[#a8c7fa] text-[#131314] text-xs font-bold rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {guardando ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Guardando en Servidor...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Guardar Configuración
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* PANEL LATERAL DE PRUEBA EN VIVO */}
        <div className="bg-[#1e1f20] border border-[#333538] rounded-2xl p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#282a2c] pb-3">
              <Send className="h-4 w-4 text-emerald-400" /> Probar Envío en Vivo
            </h3>
            <p className="text-xs text-[#9aa0a6] leading-relaxed">
              Enviá un email de prueba directamente a tu casilla para verificar que llega a tu bandeja de entrada.
            </p>

            <form onSubmit={handleProbarEnvio} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-[#c4c7c5] mb-1">Enviar prueba a:</label>
                <input
                  type="email"
                  required
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="objetia.ar@gmail.com"
                  className="w-full bg-[#18181a] border border-[#3c4043] rounded-xl px-3 py-2.5 text-xs text-white placeholder-[#80868b] focus:border-[#87a9ff] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={probando}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {probando ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Enviando email a través de Gmail...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Enviar Email de Prueba
                  </>
                )}
              </button>
            </form>

            {resultadoPrueba && (
              <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                resultadoPrueba.ok 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  {resultadoPrueba.ok ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {resultadoPrueba.ok ? "¡Envío exitoso!" : "Error al conectar:"}
                </p>
                <p className="text-[11px] break-words">{resultadoPrueba.message}</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#282a2c] text-[11px] text-[#80868b] flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#87a9ff] shrink-0" />
            <span>Tus credenciales están guardadas de forma segura y permanente.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
