"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { getApiUrl } from '../../lib/config';
import { 
  Menu, X, Key, Users, Activity, FileText, Search, Trash2, 
  RefreshCw, ShieldAlert, CheckCircle2, XCircle, Crown, Shield, 
  Sliders, Database, Terminal, ChevronDown, ChevronUp, ChevronLeft, Bell, Settings, Copy, 
  ExternalLink, Layers, ArrowUpRight, Lock, Eye, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

interface UserData {
  id: number;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface SessionData {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string;
  user_role: string;
  ip_address: string;
  user_agent: string;
  is_active: boolean;
  created_at: string;
  last_activity: string;
}

interface LogData {
  id: number;
  user_id?: number;
  user_email?: string;
  action: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

interface OptionItem {
  value: string;
  label: string;
  sublabel?: string;
}

function CustomSelect({
  value,
  options,
  onChange,
  disabled
}: {
  value: string;
  options: OptionItem[];
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value.toLowerCase() === value.toLowerCase()) || options[0];

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="h-[30px] px-2.5 bg-[#1f1f1f] hover:bg-[#252525] border border-[#333333] rounded-[8px] text-[13px] leading-[18px] font-medium text-white flex items-center justify-between gap-2 focus:outline-none transition cursor-pointer disabled:opacity-40"
      >
        <span className="truncate">{selectedOption?.label || value}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-[#8c8c8c]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#8c8c8c]" />}
      </button>

      {open && (
        <div className="absolute left-0 mt-1 w-56 bg-[#1f1f1f] border border-[#262626] rounded-[10px] shadow-2xl z-50 p-1 space-y-0.5 animate-scale-in">
          {options.map((opt) => {
            const isSelected = opt.value.toLowerCase() === value.toLowerCase();
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`px-2.5 py-1.5 rounded-[6px] cursor-pointer transition flex flex-col justify-center ${
                  isSelected ? 'bg-[#323232] text-white' : 'hover:bg-[#2a2a2a] text-[#d4d4d4]'
                }`}
              >
                <span className="text-[13px] leading-[18px] font-medium text-white">{opt.label}</span>
                {opt.sublabel && (
                  <span className="text-[11px] leading-[14px] text-[#8c8c8c] font-normal">{opt.sublabel}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface RootTabProps {
  onVolverAMiEspacio?: () => void;
}

export default function RootTab({ onVolverAMiEspacio }: RootTabProps) {
  const { usuario, token } = useAuth();
  const toast = useToast();

  const [activeConsoleTab, setActiveConsoleTab] = useState<'users' | 'sessions' | 'logs' | 'keys'>('users');
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [sidebarOculto, setSidebarOculto] = useState(false);
  const [cargando, setCargando] = useState(true);

  // Filtros y estados
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  const [sessionsList, setSessionsList] = useState<SessionData[]>([]);
  const [sessionFilter, setSessionFilter] = useState<'todas' | 'activas' | 'revocadas'>('todas');
  const [logsList, setLogsList] = useState<LogData[]>([]);

  const esRoot = usuario && (usuario.role?.toLowerCase() === 'root' || usuario.role === 'ROOT');

  useEffect(() => {
    if (esRoot && token) {
      cargarDatos();
    }
  }, [token, esRoot, activeConsoleTab, roleFilter]);

  const usuariosFiltrados = usersList.filter(u => {
    if (roleFilter && u.role?.toLowerCase() !== roleFilter.toLowerCase()) return false;
    if (searchUser) {
      const q = searchUser.toLowerCase();
      const nameMatch = u.full_name?.toLowerCase().includes(q);
      const emailMatch = u.email?.toLowerCase().includes(q);
      if (!nameMatch && !emailMatch) return false;
    }
    return true;
  });

  const sesionesFiltradas = sessionsList.filter(s => {
    if (sessionFilter === 'activas') return s.is_active;
    if (sessionFilter === 'revocadas') return !s.is_active;
    return true;
  });

  const cargarDatos = async () => {
    setCargando(true);
    try {
      if (activeConsoleTab === 'users' || activeConsoleTab === 'keys') {
        let url = `${getApiUrl()}/root/users?limit=100`;
        if (searchUser) url += `&search=${encodeURIComponent(searchUser)}`;
        if (roleFilter) url += `&role=${roleFilter}`;

        const res = await fetch(url, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setUsersList(data.users || []);
      } else if (activeConsoleTab === 'sessions') {
        const res = await fetch(`${getApiUrl()}/root/sessions?limit=100`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setSessionsList(data.sessions || []);
      } else if (activeConsoleTab === 'logs') {
        const res = await fetch(`${getApiUrl()}/root/logs?limit=100`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setLogsList(data.logs || []);
      }
    } catch {
      toast.error("No pudimos conectar con la consola Root.");
    } finally {
      setCargando(false);
    }
  };

  const cambiarRol = async (userId: number, nuevoRol: string) => {
    try {
      const res = await fetch(`${getApiUrl()}/root/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: nuevoRol })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al modificar rol.");
      toast.success(data.message, "¡Rol actualizado!");
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || "Error al cambiar rol.");
    }
  };

  const eliminarUsuario = async (userId: number, userEmail: string) => {
    if (!confirm(`¿Eliminar definitivamente la cuenta ${userEmail}?`)) return;
    try {
      const res = await fetch(`${getApiUrl()}/root/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al eliminar.");
      toast.success(data.message, "Usuario eliminado");
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar usuario.");
    }
  };

  const revocarSesion = async (sessionId: number) => {
    try {
      const res = await fetch(`${getApiUrl()}/root/sessions/${sessionId}/revoke`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al revocar.");
      toast.success(data.message, "Sesión revocada");
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || "No se pudo revocar la sesión.");
    }
  };

  if (!esRoot) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center bg-[#121214] text-white rounded-3xl">
        <ShieldAlert className="h-12 w-12 text-red-500 mb-3 animate-pulse" />
        <h2 className="text-xl font-black">Acceso Restringido - Programador Root</h2>
        <p className="text-xs text-gray-400 max-w-xs mt-2">
          Esta consola está protegida exclusivamente para la cuenta de desarrollo Root del sistema.
        </p>
      </div>
    );
  }

  // Renderizador del Sidebar / Drawer de Navegación Lateral (Google AI Studio Theme)
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between text-[14px] leading-[21px] font-medium select-none bg-[#191919] p-4 space-y-6">
      <div className="space-y-6">
        {/* BRANDING CABECERA SIDEBAR */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2 cursor-pointer group">
            <span className="font-semibold text-[15px] tracking-tight text-white group-hover:text-blue-400 transition">
              Objetia
            </span>
            <ChevronDown className="h-4 w-4 text-[#8c8c8c]" />
          </div>

          <div className="flex items-center gap-1">
            {/* Botón Ocultar en Escritorio */}
            <button 
              onClick={() => setSidebarOculto(true)} 
              className="hidden lg:flex p-2 text-[#8c8c8c] hover:text-white hover:bg-[#252525] rounded-[10px] transition cursor-pointer"
              title="Ocultar menú lateral"
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>

            {/* Botón cerrar en móvil */}
            <button 
              onClick={() => setMenuMovilAbierto(false)} 
              className="lg:hidden text-[#8c8c8c] hover:text-white p-1 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN - GRUPO 1: SISTEMA */}
        <div className="space-y-1">
          <p className="px-2 text-[11px] font-semibold text-[#8c8c8c] uppercase tracking-wider mb-1.5">
            SISTEMA
          </p>
          <button
            onClick={() => { setActiveConsoleTab('users'); setMenuMovilAbierto(false); }}
            className={`w-full flex items-center gap-2.5 px-3 h-[36px] rounded-[12px] text-[14px] font-medium transition-colors text-left cursor-pointer ${
              activeConsoleTab === 'users' 
                ? 'bg-[#2a2a2a] text-[#ffffff]' 
                : 'text-[#8c8c8c] hover:bg-[#252525] hover:text-[#d4d4d4]'
            }`}
          >
            <Users className="h-4 w-4 text-current flex-shrink-0" />
            <span>Control de Usuarios</span>
          </button>
        </div>

        {/* NAVEGACIÓN - GRUPO 2: OBSERVAR */}
        <div className="space-y-1">
          <p className="px-2 text-[11px] font-semibold text-[#8c8c8c] uppercase tracking-wider mb-1.5">
            OBSERVAR
          </p>
          <button
            onClick={() => { setActiveConsoleTab('sessions'); setMenuMovilAbierto(false); }}
            className={`w-full flex items-center gap-2.5 px-3 h-[36px] rounded-[12px] text-[14px] font-medium transition-colors text-left cursor-pointer ${
              activeConsoleTab === 'sessions' 
                ? 'bg-[#2a2a2a] text-[#ffffff]' 
                : 'text-[#8c8c8c] hover:bg-[#252525] hover:text-[#d4d4d4]'
            }`}
          >
            <Activity className="h-4 w-4 text-current flex-shrink-0" />
            <span>Monitor de Sesiones</span>
          </button>

          <button
            onClick={() => { setActiveConsoleTab('logs'); setMenuMovilAbierto(false); }}
            className={`w-full flex items-center gap-2.5 px-3 h-[36px] rounded-[12px] text-[14px] font-medium transition-colors text-left cursor-pointer ${
              activeConsoleTab === 'logs' 
                ? 'bg-[#2a2a2a] text-[#ffffff]' 
                : 'text-[#8c8c8c] hover:bg-[#252525] hover:text-[#d4d4d4]'
            }`}
          >
            <Database className="h-4 w-4 text-current flex-shrink-0" />
            <span>Registros y Auditoría</span>
          </button>
        </div>
      </div>

      {/* FOOTER SIDEBAR - BARRA DE ÍCONOS Y PILL DE USUARIO ROOT */}
      <div className="pt-3 border-t border-[#262626] space-y-3">
        <div className="flex items-center justify-around text-[#8c8c8c]">
          <button title="Notificaciones" className="p-1.5 hover:text-white rounded-lg hover:bg-[#2a2a2a] transition">
            <Bell className="h-4 w-4 text-current" />
          </button>
          <button title="Configuración" className="p-1.5 hover:text-white rounded-lg hover:bg-[#2a2a2a] transition">
            <Settings className="h-4 w-4 text-current" />
          </button>
          <button title="Buscar" className="p-1.5 hover:text-white rounded-lg hover:bg-[#2a2a2a] transition">
            <Search className="h-4 w-4 text-current" />
          </button>
          <button title="Credenciales" className="p-1.5 hover:text-white rounded-lg hover:bg-[#2a2a2a] transition">
            <Key className="h-4 w-4 text-current" />
          </button>
        </div>

        {/* PILL PERFIL USUARIO GOOGLE AI STUDIO */}
        <div className="bg-[#252525] border border-[#333333] p-2 rounded-[12px] flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-amber-500 to-red-500 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
              {usuario.full_name?.charAt(0).toUpperCase() || 'R'}
            </div>
            <span className="text-[12px] font-medium text-[#d4d4d4] truncate">
              {usuario.email}
            </span>
          </div>
          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-[#3a3a3a] text-[#87a9ff] border border-[#87a9ff]/30 flex-shrink-0">
            PRO
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div 
      style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}
      className="min-h-screen bg-[#191919] text-[#d4d4d4] flex flex-col lg:flex-row border-none relative overflow-x-hidden"
    >
      
      {/* 1. SIDEBAR ESCRITORIO (Google AI Studio Theme) */}
      <aside 
        style={{
          width: sidebarOculto ? '0px' : '256px',
          opacity: sidebarOculto ? 0 : 1,
          transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        className="hidden lg:block bg-[#191919] border-r border-[#262626] flex-shrink-0 min-h-screen overflow-hidden"
      >
        <div className="w-64 h-full">
          {renderSidebarContent()}
        </div>
      </aside>

      {/* 2. DRAWER MÓVIL DESLIZABLE DESDE LA IZQUIERDA (Estilo Tercera Imagen) */}
      {menuMovilAbierto && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Fondo oscuro traslúcido */}
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-xs animate-fade-in"
            onClick={() => setMenuMovilAbierto(false)}
          />
          {/* Panel deslizante */}
          <div className="relative w-72 max-w-[80vw] bg-[#18181c] border-r border-[#26262e] h-full shadow-2xl z-10 animate-slide-right">
            {renderSidebarContent()}
          </div>
        </div>
      )}

      {/* 3. CONTENIDO PRINCIPAL WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#191919] text-[14px] leading-[20px] font-normal">
        
        {/* BARRA SUPERIOR DE ENCABEZADO */}
        <header className="p-3 sm:px-6 sm:py-4 border-b border-[#262626] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-4 bg-[#191919]">
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto min-w-0">
            {/* BOTÓN MENÚ HAMBURGUESA EN MÓVIL (Estilo Segunda Imagen) */}
            <button
              onClick={() => setMenuMovilAbierto(true)}
              className="lg:hidden p-1.5 sm:p-2 rounded-[10px] sm:rounded-[12px] bg-[#252525] text-[#d4d4d4] hover:text-white transition cursor-pointer flex-shrink-0"
              title="Abrir menú de navegación"
            >
              <Menu className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </button>

            {/* BOTÓN MOSTRAR SIDEBAR EN ESCRITORIO CUANDO ESTÁ OCULTO */}
            <button
              onClick={() => setSidebarOculto(false)}
              className={`hidden ${sidebarOculto ? 'lg:flex' : 'lg:hidden'} p-2 rounded-[12px] bg-[#252525] text-[#d4d4d4] hover:text-white hover:bg-[#323232] transition cursor-pointer flex-shrink-0`}
              title="Mostrar menú lateral"
            >
              <PanelLeftOpen className="h-5 w-5 text-current" />
            </button>

            <h1 className="text-[15px] sm:text-[20px] font-semibold text-[#d4d4d4] tracking-tight truncate">
              {activeConsoleTab === 'users' && "Control de Usuarios"}
              {activeConsoleTab === 'sessions' && "Monitor de Sesiones"}
              {activeConsoleTab === 'logs' && "Logs de Auditoría"}
              {activeConsoleTab === 'keys' && "Claves de API"}
            </h1>
          </div>

          {/* ACCIONES CABECERA (Reducidos en móvil sin scroll horizontal) */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap justify-start sm:justify-end">
            {onVolverAMiEspacio && (
              <button
                onClick={onVolverAMiEspacio}
                className="px-2.5 sm:px-3 h-[28px] sm:h-[32px] bg-[#252525] border border-[#87a9ff]/40 text-[#87a9ff] hover:text-white hover:bg-[#87a9ff]/20 rounded-[10px] sm:rounded-[12px] text-[11px] sm:text-[13px] font-medium transition flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="whitespace-nowrap">Volver a Mi Espacio</span>
              </button>
            )}

            <button
              onClick={cargarDatos}
              disabled={cargando}
              className="px-2.5 sm:px-3 h-[28px] sm:h-[32px] bg-[#252525] border border-[#333333] text-[#d4d4d4] rounded-[10px] sm:rounded-[12px] text-[11px] sm:text-[13px] font-medium hover:bg-[#323232] hover:text-white transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0 ${cargando ? 'animate-spin' : ''}`} />
              <span className="whitespace-nowrap">Actualizar</span>
            </button>

            <button
              onClick={() => toast.info("Consola en sincronía directa con PostgreSQL en AWS.", "Estado del Sistema")}
              className="px-2.5 sm:px-3.5 h-[28px] sm:h-[32px] bg-[#393f51] border border-[#454d63] text-white rounded-[10px] sm:rounded-[12px] text-[11px] sm:text-[13px] font-medium hover:bg-[#454d63] transition cursor-pointer flex items-center gap-1 whitespace-nowrap"
            >
              <Key className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">Acción Root</span>
            </button>
          </div>
        </header>

        {/* BARRA SECUNDARIA DE FILTROS & PILLS (Solo en Control de Usuarios) */}
        {activeConsoleTab === 'users' && (
          <div className="px-3 sm:px-6 py-2 border-b border-[#262626] flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 bg-[#1f1f1f]">
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              <span className="text-[12px] sm:text-[13px] font-medium text-[#8c8c8c] whitespace-nowrap mr-0.5">Agrupar por:</span>
              {[
                { id: '', label: 'Todos' },
                { id: 'client', label: 'Clientes' },
                { id: 'financial', label: 'Financial' },
                { id: 'admin', label: 'Admins' },
                { id: 'root', label: 'Root' },
              ].map((f) => {
                const isSelected = roleFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setRoleFilter(f.id)}
                    className={`px-2.5 sm:px-3 h-[25px] sm:h-[28px] rounded-full text-[11px] sm:text-[13px] font-medium transition cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#323232] text-[#ffffff] border border-[#555555]'
                        : 'bg-[#191919] text-[#8c8c8c] border border-transparent hover:bg-[#252525] hover:text-[#d4d4d4]'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* BUSCADOR OSCURO CON DROPDOWN */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8c8c8c]" />
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && cargarDatos()}
                  placeholder="Filtrar usuarios..."
                  className="w-full pl-8 pr-3 h-[32px] bg-[#191919] border border-[#262626] rounded-[12px] text-[13px] text-[#d4d4d4] focus:outline-none focus:border-[#87a9ff] transition"
                />
              </div>
            </div>
          </div>
        )}

        {/* BARRA SECUNDARIA DE FILTROS & PILLS (Monitor de Sesiones) */}
        {activeConsoleTab === 'sessions' && (
          <div className="px-3 sm:px-6 py-2 border-b border-[#262626] flex items-center justify-between gap-2.5 bg-[#1f1f1f]">
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              <span className="text-[12px] sm:text-[13px] font-medium text-[#8c8c8c] whitespace-nowrap mr-0.5">Estado:</span>
              {[
                { id: 'todas', label: 'Todas' },
                { id: 'activas', label: 'Activas' },
                { id: 'revocadas', label: 'Revocadas' },
              ].map((f) => {
                const isSelected = sessionFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setSessionFilter(f.id as any)}
                    className={`px-2.5 sm:px-3 h-[25px] sm:h-[28px] rounded-full text-[11px] sm:text-[13px] font-medium transition cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#323232] text-[#ffffff] border border-[#555555]'
                        : 'bg-[#191919] text-[#8c8c8c] border border-transparent hover:bg-[#252525] hover:text-[#d4d4d4]'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ÁREA DE CONTENIDO DINÁMICO */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto bg-[#191919]">

          {/* ============================================================================== */}
          {/* TAB 1: CONTROL DE USUARIOS */}
          {/* ============================================================================== */}
          {activeConsoleTab === 'users' && (
            <div className="space-y-4">
              
              {/* VISTA MÓVIL DE TARJETAS OSCURAS (Estilo Google AI Studio) */}
              <div className="block lg:hidden space-y-3">
                {usuariosFiltrados.map((u) => (
                  <div key={u.id} className="bg-[#1f1f1f] border border-[#262626] rounded-[12px] p-4 space-y-3 font-sans">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="h-8 w-8 rounded-full border border-[#87a9ff]/40 object-cover flex-shrink-0" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-[#2a2a2a] text-[#87a9ff] font-medium flex items-center justify-center text-[12px] flex-shrink-0">
                            {u.full_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[14px] font-medium text-[#87a9ff] truncate">{u.full_name}</p>
                          <p className="text-xs text-[#8c8c8c] font-sans truncate">{u.email}</p>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium uppercase flex-shrink-0 ${
                        u.role === 'root' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                        'bg-[#2a2a2a] text-[#8c8c8c] border border-[#333333]'
                      }`}>
                        {u.role}
                      </span>
                    </div>

                    <div className="text-xs text-[#8c8c8c] font-sans space-y-1 pt-2 border-t border-[#262626]">
                      <div className="flex justify-between items-center">
                        <span className="text-[#666666]">Creado:</span>
                        <span className="text-[#d4d4d4] font-sans">{new Date(u.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#262626] gap-2">
                      <div className="flex-1 min-w-0">
                        <CustomSelect
                          value={u.role}
                          disabled={u.id === usuario?.id}
                          options={[
                            { value: 'client', label: 'CLIENT', sublabel: 'Usuario comprador' },
                            { value: 'financial', label: 'FINANCIAL', sublabel: 'Administrador financiero' },
                            { value: 'admin', label: 'ADMIN', sublabel: 'Administrador CMS' },
                            { value: 'root', label: 'ROOT', sublabel: 'SuperAdmin Programador' }
                          ]}
                          onChange={(val) => cambiarRol(u.id, val)}
                        />
                      </div>

                      {u.id !== usuario?.id && (
                        <button
                          onClick={() => eliminarUsuario(u.id, u.email)}
                          className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-[10px] border border-red-500/30 transition flex-shrink-0 cursor-pointer"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* VISTA ESCRITORIO CON TABLA OSCURA (DevTools CSS Mat-Table) */}
              <div className="hidden lg:block bg-[#1f1f1f] border border-[#262626] rounded-[12px] overflow-hidden">
                <table className="w-full text-left text-[14px] leading-[20px] text-[#d4d4d4]">
                  <thead>
                    <tr className="bg-[#1f1f1f] border-b border-[#262626] text-[#8c8c8c] font-medium text-[14px] leading-[21px]">
                      <th className="px-4 py-3 font-medium text-left">Usuario</th>
                      <th className="px-4 py-3 font-medium text-left">Email</th>
                      <th className="px-4 py-3 font-medium text-left">Rol / Jerarquía</th>
                      <th className="px-4 py-3 font-medium text-left">Fecha Creación</th>
                      <th className="px-4 py-3 font-medium text-left">Rango & Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626]">
                    {usuariosFiltrados.map((u) => (
                      <tr key={u.id} className="hover:bg-[#252525] transition-colors">
                        <td className="px-4 py-3 font-medium text-[#d4d4d4] flex items-center gap-2">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover border border-[#87a9ff]/40" />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-[#2a2a2a] text-[#87a9ff] font-medium flex items-center justify-center text-[12px]">
                              {u.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                          <span className="text-[#87a9ff] font-medium hover:underline cursor-pointer text-[14px]">{u.full_name}</span>
                        </td>
                        <td className="px-4 py-3 text-[#d4d4d4] font-mono text-[13px]">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase ${
                            u.role === 'root' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                            u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                            'bg-[#2a2a2a] text-[#d4d4d4] border border-[#333333]'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#8c8c8c] font-mono text-[13px]">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-left">
                          <div className="inline-flex items-center gap-2">
                            <CustomSelect
                              value={u.role}
                              disabled={u.id === usuario?.id}
                              options={[
                                { value: 'client', label: 'CLIENT', sublabel: 'Usuario comprador' },
                                { value: 'financial', label: 'FINANCIAL', sublabel: 'Administrador financiero' },
                                { value: 'admin', label: 'ADMIN', sublabel: 'Administrador CMS' },
                                { value: 'root', label: 'ROOT', sublabel: 'SuperAdmin Programador' }
                              ]}
                              onChange={(val) => cambiarRol(u.id, val)}
                            />

                            {u.id !== usuario?.id && (
                              <button
                                onClick={() => eliminarUsuario(u.id, u.email)}
                                className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-[8px] transition"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ============================================================================== */}
          {/* TAB 2: MONITOR DE SESIONES */}
          {/* ============================================================================== */}
          {activeConsoleTab === 'sessions' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sesionesFiltradas.map((s) => (
                  <div key={s.id} className="bg-[#1f1f1f] border border-[#262626] rounded-[12px] p-4 space-y-3 font-sans">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-[#87a9ff] text-[14px]">{s.user_name}</p>
                        <p className="text-xs text-[#8c8c8c] font-sans">{s.user_email}</p>
                      </div>
                      {s.is_active ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          ACTIVA
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#2a2a2a] text-[#8c8c8c] border border-[#333333]">
                          REVOCADA
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-[#8c8c8c] border-t border-[#262626] pt-2 font-sans">
                      <p><span className="text-[#666666]">IP:</span> {s.ip_address || "127.0.0.1"}</p>
                      <p className="truncate" title={s.user_agent}><span className="text-[#666666]">Device:</span> {s.user_agent || "Web Browser"}</p>
                      <p><span className="text-[#666666]">Inicio:</span> {new Date(s.created_at).toLocaleString()}</p>
                    </div>

                    {s.is_active && (
                      <button
                        onClick={() => revocarSesion(s.id)}
                        className="w-full py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-[10px] text-xs font-medium border border-red-500/30 transition cursor-pointer mt-2"
                      >
                        Revocar Sesión
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================================== */}
          {/* TAB 3: LOGS DE AUDITORÍA */}
          {/* ============================================================================== */}
          {activeConsoleTab === 'logs' && (
            <div className="bg-[#1f1f1f] border border-[#262626] rounded-[12px] overflow-hidden p-4 space-y-3">
              <div className="space-y-2">
                {logsList.map((l) => (
                  <div key={l.id} className="p-3 bg-[#191919] border border-[#262626] rounded-[10px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 font-sans">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-[6px] text-[11px] font-medium uppercase ${
                          l.action === 'LOGIN' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                          l.action === 'CHANGE_ROLE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {l.action}
                        </span>
                        <span className="text-[#d4d4d4] font-medium text-xs">{l.user_email || `User #${l.user_id}`}</span>
                      </div>
                      <p className="text-[#8c8c8c] font-sans text-xs">{l.details}</p>
                    </div>
                    <div className="text-xs text-[#8c8c8c] font-sans text-left sm:text-right space-y-0.5">
                      <p>{new Date(l.created_at).toLocaleString()}</p>
                      {l.ip_address && <p>{l.ip_address}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================================== */}
          {/* TAB 4: CLAVES & STATUS API */}
          {/* ============================================================================== */}
          {activeConsoleTab === 'keys' && (
            <div className="space-y-4">
              <div className="bg-[#1c1c22] border border-[#2b2b34] rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-extrabold text-blue-400">Objetia Gemini API Key</h3>
                    <p className="text-xs text-gray-400">Decocircular Marketplace Key</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black rounded-full">
                    Nivel Gratuito
                  </span>
                </div>
                <div className="bg-[#141418] p-3 rounded-xl border border-[#26262e] font-mono text-xs text-gray-300 flex justify-between items-center">
                  <span>...L6Eg - Gemini API Key</span>
                  <button 
                    onClick={() => { navigator.clipboard.writeText("AIzaSy..."); toast.success("Clave copiada al portapapeles"); }}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
