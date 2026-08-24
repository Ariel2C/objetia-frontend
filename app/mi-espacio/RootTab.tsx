"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { getApiUrl } from '../../lib/config';
import { 
  Menu, X, Key, Users, Activity, FileText, Search, Trash2, 
  RefreshCw, ShieldAlert, CheckCircle2, XCircle, Crown, Shield, 
  Sliders, Database, Terminal, ChevronDown, Bell, Settings, Copy, 
  ExternalLink, Layers, ArrowUpRight, Lock, Eye
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

export default function RootTab() {
  const { usuario, token } = useAuth();
  const toast = useToast();

  const [activeConsoleTab, setActiveConsoleTab] = useState<'users' | 'sessions' | 'logs' | 'keys'>('users');
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);

  // Filtros y estados
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  const [sessionsList, setSessionsList] = useState<SessionData[]>([]);
  const [logsList, setLogsList] = useState<LogData[]>([]);

  const esRoot = usuario && (usuario.role?.toLowerCase() === 'root' || usuario.role === 'ROOT');

  useEffect(() => {
    if (esRoot && token) {
      cargarDatos();
    }
  }, [token, esRoot, activeConsoleTab]);

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
    <div className="flex flex-col h-full justify-between text-xs select-none">
      <div className="space-y-6">
        {/* BRANDING CABECERA SIDEBAR */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 cursor-pointer group">
            <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-blue-400 transition">
              Objetia AI Studio
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </div>
          {/* Botón cerrar en móvil */}
          <button 
            onClick={() => setMenuMovilAbierto(false)} 
            className="lg:hidden text-gray-400 hover:text-white p-1 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* NAVEGACIÓN - GRUPO 1: PROYECTO & USUARIOS */}
        <div className="space-y-1 px-2">
          <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            Proyecto
          </p>
          <button
            onClick={() => { setActiveConsoleTab('users'); setMenuMovilAbierto(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition text-left ${
              activeConsoleTab === 'users' ? 'bg-[#2b2b34] text-white shadow-xs' : 'text-gray-400 hover:bg-[#222228] hover:text-gray-200'
            }`}
          >
            <Users className="h-4 w-4 text-blue-400" />
            <span>Control de Usuarios</span>
          </button>

          <button
            onClick={() => { setActiveConsoleTab('keys'); setMenuMovilAbierto(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition text-left ${
              activeConsoleTab === 'keys' ? 'bg-[#2b2b34] text-white shadow-xs' : 'text-gray-400 hover:bg-[#222228] hover:text-gray-200'
            }`}
          >
            <Key className="h-4 w-4 text-amber-400" />
            <span>Claves de API & Status</span>
          </button>
        </div>

        {/* NAVEGACIÓN - GRUPO 2: USO & FACTURACIÓN */}
        <div className="space-y-1 px-2">
          <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            Uso y Monitoreo
          </p>
          <button
            onClick={() => { setActiveConsoleTab('sessions'); setMenuMovilAbierto(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition text-left ${
              activeConsoleTab === 'sessions' ? 'bg-[#2b2b34] text-white shadow-xs' : 'text-gray-400 hover:bg-[#222228] hover:text-gray-200'
            }`}
          >
            <Activity className="h-4 w-4 text-emerald-400" />
            <span>Monitor de Sesiones</span>
          </button>
        </div>

        {/* NAVEGACIÓN - GRUPO 3: OBSERVAR */}
        <div className="space-y-1 px-2">
          <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            Observar
          </p>
          <button
            onClick={() => { setActiveConsoleTab('logs'); setMenuMovilAbierto(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition text-left ${
              activeConsoleTab === 'logs' ? 'bg-[#2b2b34] text-white shadow-xs' : 'text-gray-400 hover:bg-[#222228] hover:text-gray-200'
            }`}
          >
            <Database className="h-4 w-4 text-purple-400" />
            <span>Logs de Auditoría</span>
          </button>
        </div>
      </div>

      {/* FOOTER SIDEBAR - BARRA DE ÍCONOS Y PILL DE USUARIO ROOT */}
      <div className="p-3 border-t border-[#26262e] space-y-3">
        <div className="flex items-center justify-around text-gray-400">
          <button title="Notificaciones" className="p-1.5 hover:text-white rounded-lg hover:bg-[#26262e] transition">
            <Bell className="h-4 w-4" />
          </button>
          <button title="Configuración" className="p-1.5 hover:text-white rounded-lg hover:bg-[#26262e] transition">
            <Settings className="h-4 w-4" />
          </button>
          <button title="Buscar" className="p-1.5 hover:text-white rounded-lg hover:bg-[#26262e] transition">
            <Search className="h-4 w-4" />
          </button>
          <button title="Credenciales" className="p-1.5 hover:text-white rounded-lg hover:bg-[#26262e] transition">
            <Key className="h-4 w-4" />
          </button>
        </div>

        {/* PILL PERFIL USUARIO GOOGLE AI STUDIO */}
        <div className="bg-[#1c1c22] border border-[#2a2a34] p-2 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-amber-500 to-red-500 text-white font-black text-[10px] flex items-center justify-center flex-shrink-0">
              {usuario.full_name?.charAt(0).toUpperCase() || 'R'}
            </div>
            <span className="text-[11px] font-semibold text-gray-200 truncate">
              {usuario.email}
            </span>
          </div>
          <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-[#2b2b34] text-blue-400 border border-blue-500/30 flex-shrink-0">
            PRO
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[85vh] bg-[#121214] text-[#e3e3e8] rounded-3xl overflow-hidden flex flex-col lg:flex-row border border-[#222228] shadow-2xl relative">
      
      {/* 1. SIDEBAR ESCRITORIO (Google AI Studio Theme) */}
      <aside className="hidden lg:block w-64 bg-[#18181c] border-r border-[#26262e] flex-shrink-0 min-h-[750px]">
        {renderSidebarContent()}
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
      <main className="flex-1 flex flex-col min-w-0 bg-[#121214]">
        
        {/* BARRA SUPERIOR DE ENCABEZADO */}
        <header className="p-4 sm:p-6 border-b border-[#222228] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#141418]">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* BOTÓN MENÚ HAMBURGUESA EN MÓVIL (Estilo Segunda Imagen) */}
            <button
              onClick={() => setMenuMovilAbierto(true)}
              className="lg:hidden p-2 rounded-xl bg-[#22222a] text-gray-300 hover:text-white hover:bg-[#2b2b35] transition cursor-pointer"
              title="Abrir menú de navegación"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                {activeConsoleTab === 'users' && "Control de Usuarios"}
                {activeConsoleTab === 'sessions' && "Monitor de Sesiones"}
                {activeConsoleTab === 'logs' && "Logs de Auditoría"}
                {activeConsoleTab === 'keys' && "Claves de API"}
              </h1>
            </div>
          </div>

          {/* ACCIONES CABECERA */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={cargarDatos}
              disabled={cargando}
              className="px-3 py-2 bg-[#22222a] border border-[#33333e] text-gray-300 rounded-xl text-xs font-bold hover:bg-[#2d2d38] hover:text-white transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${cargando ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>

            <button
              onClick={() => toast.info("Consola en sincronía directa con PostgreSQL en AWS.", "Estado del Sistema")}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-black tracking-wide hover:from-blue-500 hover:to-indigo-500 transition shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Key className="h-3.5 w-3.5" />
              <span>Acción Root</span>
            </button>
          </div>
        </header>

        {/* BARRA SEGUNDARIA DE FILTROS & PILLS (Google AI Studio Theme) */}
        <div className="px-4 sm:px-6 py-3 border-b border-[#1e1e24] flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-[#16161a]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-semibold">Agrupar por:</span>
            <button 
              onClick={() => setRoleFilter('')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                roleFilter === '' ? 'bg-[#2b2b36] text-white border border-blue-500/40' : 'bg-[#1c1c22] text-gray-400 hover:bg-[#25252e]'
              }`}
            >
              • Todos
            </button>
            <button 
              onClick={() => setRoleFilter('root')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                roleFilter === 'root' ? 'bg-[#2b2b36] text-white border border-amber-500/40' : 'bg-[#1c1c22] text-gray-400 hover:bg-[#25252e]'
              }`}
            >
              Root
            </button>
            <button 
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                roleFilter === 'admin' ? 'bg-[#2b2b36] text-white border border-purple-500/40' : 'bg-[#1c1c22] text-gray-400 hover:bg-[#25252e]'
              }`}
            >
              Admins
            </button>
          </div>

          {/* BUSCADOR OSCURO CON DROPDOWN */}
          <div className="flex items-center gap-2">
            {activeConsoleTab === 'users' && (
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && cargarDatos()}
                  placeholder="Filtrar usuarios..."
                  className="w-full pl-8 pr-3 py-1.5 bg-[#1c1c22] border border-[#2b2b34] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            )}
          </div>
        </div>

        {/* ÁREA DE CONTENIDO DINÁMICO */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">

          {/* ============================================================================== */}
          {/* TAB 1: CONTROL DE USUARIOS */}
          {/* ============================================================================== */}
          {activeConsoleTab === 'users' && (
            <div className="space-y-4">
              
              {/* VISTA MÓVIL DE TARJETAS OSCURAS (Como en la Segunda Imagen) */}
              <div className="block lg:hidden space-y-3">
                {usersList.map((u) => (
                  <div key={u.id} className="bg-[#1c1c22] border border-[#2b2b34] rounded-2xl p-4 space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="h-8 w-8 rounded-full border border-blue-500/40 object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-[#2a2a35] text-blue-400 font-bold flex items-center justify-center text-xs">
                            {u.full_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-extrabold text-blue-400">{u.full_name}</p>
                          <p className="text-[10px] text-gray-400">{u.email}</p>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                        u.role === 'root' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                        'bg-gray-800 text-gray-300'
                      }`}>
                        {u.role}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-400 space-y-1 pt-2 border-t border-[#26262e]">
                      <div className="flex justify-between">
                        <span>Creado:</span>
                        <span className="text-gray-200">{new Date(u.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <select
                        value={u.role}
                        disabled={u.id === usuario?.id}
                        onChange={(e) => cambiarRol(u.id, e.target.value)}
                        className="bg-[#22222a] border border-[#33333e] text-xs font-bold text-gray-200 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                      >
                        <option value="client">CLIENT</option>
                        <option value="financial">FINANCIAL</option>
                        <option value="admin">ADMIN</option>
                        <option value="root">ROOT</option>
                      </select>

                      {u.id !== usuario?.id && (
                        <button
                          onClick={() => eliminarUsuario(u.id, u.email)}
                          className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* VISTA ESCRITORIO CON TABLA OSCURA (Como en la Primera Imagen) */}
              <div className="hidden lg:block bg-[#18181c] border border-[#26262e] rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead>
                    <tr className="bg-[#1c1c22] text-gray-400 font-extrabold uppercase border-b border-[#26262e]">
                      <th className="p-3.5">Usuario</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Rol / Jerarquía</th>
                      <th className="p-3.5">Fecha Creación</th>
                      <th className="p-3.5 text-right">Rango & Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222228]">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-[#1f1f26] transition">
                        <td className="p-3.5 font-bold text-white flex items-center gap-2">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover border border-blue-500/40" />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-[#2a2a35] text-blue-400 font-black flex items-center justify-center text-[10px]">
                              {u.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                          <span className="text-blue-400 hover:underline cursor-pointer">{u.full_name}</span>
                        </td>
                        <td className="p-3.5 text-gray-300 font-mono">{u.email}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            u.role === 'root' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                            u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                            'bg-gray-800 text-gray-300 border border-gray-700'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3.5 text-gray-400 font-mono">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="p-3.5 text-right space-x-2">
                          <select
                            value={u.role}
                            disabled={u.id === usuario?.id}
                            onChange={(e) => cambiarRol(u.id, e.target.value)}
                            className="px-2.5 py-1 bg-[#22222a] border border-[#33333e] rounded-lg text-xs font-bold text-gray-200 focus:outline-none cursor-pointer disabled:opacity-40"
                          >
                            <option value="client">CLIENT</option>
                            <option value="financial">FINANCIAL</option>
                            <option value="admin">ADMIN</option>
                            <option value="root">ROOT</option>
                          </select>

                          {u.id !== usuario?.id && (
                            <button
                              onClick={() => eliminarUsuario(u.id, u.email)}
                              className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
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
                {sessionsList.map((s) => (
                  <div key={s.id} className="bg-[#1c1c22] border border-[#2b2b34] rounded-2xl p-4 space-y-3 shadow-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-extrabold text-blue-400 text-sm">{s.user_name}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{s.user_email}</p>
                      </div>
                      {s.is_active ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          ACTIVA
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-gray-800 text-gray-400">
                          REVOCADA
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-gray-400 border-t border-[#26262e] pt-2 font-mono">
                      <p><span className="text-gray-500">IP:</span> {s.ip_address || "127.0.0.1"}</p>
                      <p className="truncate" title={s.user_agent}><span className="text-gray-500">Device:</span> {s.user_agent || "Web Browser"}</p>
                      <p><span className="text-gray-500">Inicio:</span> {new Date(s.created_at).toLocaleString()}</p>
                    </div>

                    {s.is_active && (
                      <button
                        onClick={() => revocarSesion(s.id)}
                        className="w-full py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold border border-red-500/30 transition cursor-pointer mt-2"
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
            <div className="bg-[#18181c] border border-[#26262e] rounded-2xl overflow-hidden p-4 space-y-3">
              <div className="space-y-2">
                {logsList.map((l) => (
                  <div key={l.id} className="p-3 bg-[#1c1c22] border border-[#2b2b34] rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-mono">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          l.action === 'LOGIN' ? 'bg-blue-500/20 text-blue-300' :
                          l.action === 'CHANGE_ROLE' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-purple-500/20 text-purple-300'
                        }`}>
                          {l.action}
                        </span>
                        <span className="text-gray-200 font-bold">{l.user_email || `User #${l.user_id}`}</span>
                      </div>
                      <p className="text-gray-400 font-sans text-xs">{l.details}</p>
                    </div>
                    <div className="text-[10px] text-gray-500 text-right">
                      <p>{new Date(l.created_at).toLocaleString()}</p>
                      <p>{l.ip_address}</p>
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
