"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../components/AuthContext';
import { useToast } from '../../../components/ToastContext';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '../../../lib/config';
import { ShieldAlert, Users, Activity, FileText, Search, Trash2, RefreshCw, LogOut, CheckCircle2, XCircle, Crown, Lock, Shield } from 'lucide-react';

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

export default function RootDashboardPage() {
  const { usuario, token } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'users' | 'sessions' | 'logs'>('users');
  const [cargando, setCargando] = useState(true);

  // Estados de Usuarios
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  // Estados de Sesiones y Logs
  const [sessionsList, setSessionsList] = useState<SessionData[]>([]);
  const [logsList, setLogsList] = useState<LogData[]>([]);

  const esRoot = usuario && (usuario.role?.toLowerCase() === 'root' || usuario.role === 'ROOT');

  useEffect(() => {
    if (!token) {
      router.push('/auth?mode=login');
      return;
    }
    if (esRoot) {
      cargarDatos();
    }
  }, [token, esRoot, activeTab]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      if (activeTab === 'users') {
        let url = `${getApiUrl()}/root/users?limit=100`;
        if (searchUser) url += `&search=${encodeURIComponent(searchUser)}`;
        if (roleFilter) url += `&role=${roleFilter}`;

        const res = await fetch(url, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setUsersList(data.users || []);
      } else if (activeTab === 'sessions') {
        const res = await fetch(`${getApiUrl()}/root/sessions?limit=100`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setSessionsList(data.sessions || []);
      } else if (activeTab === 'logs') {
        const res = await fetch(`${getApiUrl()}/root/logs?limit=100`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setLogsList(data.logs || []);
      }
    } catch {
      toast.error("No pudimos cargar los datos del panel Root.");
    } finally {
      setCargando(false);
    }
  };

  // Cambiar rol de usuario
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

  // Eliminar usuario
  const eliminarUsuario = async (userId: number, userEmail: string) => {
    if (!confirm(`¿Estás seguro de eliminar permanentemente al usuario ${userEmail}? Esta acción no se puede deshacer.`)) return;

    try {
      const res = await fetch(`${getApiUrl()}/root/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al eliminar usuario.");
      toast.success(data.message, "Usuario eliminado");
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || "No se pudo eliminar al usuario.");
    }
  };

  // Revocar sesión remotamente
  const revocarSesion = async (sessionId: number) => {
    try {
      const res = await fetch(`${getApiUrl()}/root/sessions/${sessionId}/revoke`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al revocar sesión.");
      toast.success(data.message, "Sesión revocada");
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || "No se pudo revocar la sesión.");
    }
  };

  if (!esRoot) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-4 shadow-lg">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-black text-gray-900">Acceso Restringido - Programador Root</h1>
        <p className="text-xs text-gray-500 max-w-sm mt-2">
          Esta sección está protegida exclusivamente para la cuenta de mantenimiento Root del sistema.
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition cursor-pointer"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* CABECERA PRINCIPAL DEL PANEL ROOT */}
        <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-gray-900 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-amber-400" />
              <h1 className="text-2xl font-black tracking-tight">Panel de Control Root & Auditoría</h1>
            </div>
            <p className="text-xs text-amber-200/80">
              Consola del programador para control de usuarios, permisos, sesiones y logs de seguridad.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-2xl border border-amber-500/30 text-xs">
            <Shield className="h-4 w-4 text-amber-400" />
            <span className="font-extrabold text-amber-100">{usuario?.email} (ROOT)</span>
          </div>
        </div>

        {/* PESTAÑAS DE NAVEGACIÓN */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
                activeTab === 'users' ? 'bg-amber-900 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="h-4 w-4" />
              Control de Usuarios ({usersList.length})
            </button>

            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
                activeTab === 'sessions' ? 'bg-amber-900 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Activity className="h-4 w-4" />
              Monitor de Sesiones ({sessionsList.length})
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer ${
                activeTab === 'logs' ? 'bg-amber-900 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText className="h-4 w-4" />
              Logs de Auditoría ({logsList.length})
            </button>
          </div>

          <button
            onClick={cargarDatos}
            disabled={cargando}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* TAB 1: CONTROL DE USUARIOS */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden space-y-4 p-6">
            
            {/* BARRA DE BÚSQUEDA Y FILTRO */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center pb-2 border-b border-gray-100">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && cargarDatos()}
                  placeholder="Buscar por nombre o email..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-amber-600 focus:outline-none transition"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <select
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value); }}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-extrabold text-gray-700 focus:outline-none cursor-pointer"
                >
                  <option value="">Todos los Roles</option>
                  <option value="root">ROOT (Programador)</option>
                  <option value="admin">ADMIN (Administrador)</option>
                  <option value="financial">FINANCIAL (Finanzas)</option>
                  <option value="client">CLIENT (Cliente)</option>
                </select>

                <button
                  onClick={cargarDatos}
                  className="px-4 py-2 bg-amber-900 text-white rounded-xl text-xs font-bold hover:bg-amber-950 transition cursor-pointer"
                >
                  Filtrar
                </button>
              </div>
            </div>

            {/* TABLA DE USUARIOS */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-extrabold uppercase border-b border-gray-100">
                    <th className="p-3">Usuario</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Rango / Rol</th>
                    <th className="p-3">Fecha Registro</th>
                    <th className="p-3 text-right">Acciones de Rango</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-3 font-bold text-gray-900 flex items-center gap-2">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-amber-100 text-amber-900 font-black flex items-center justify-center text-[10px]">
                            {u.full_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <span>{u.full_name}</span>
                      </td>
                      <td className="p-3 text-gray-600 font-medium">{u.email}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          u.role === 'root' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                          u.role === 'admin' ? 'bg-purple-100 text-purple-900' :
                          u.role === 'financial' ? 'bg-emerald-100 text-emerald-900' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="p-3 text-right space-x-2">
                        <select
                          value={u.role}
                          disabled={u.id === usuario?.id}
                          onChange={(e) => cambiarRol(u.id, e.target.value)}
                          className="px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="client">CLIENT (Cliente)</option>
                          <option value="financial">FINANCIAL (Finanzas)</option>
                          <option value="admin">ADMIN (Admin)</option>
                          <option value="root">ROOT (Programador)</option>
                        </select>

                        {u.id !== usuario?.id && (
                          <button
                            onClick={() => eliminarUsuario(u.id, u.email)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
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

        {/* TAB 2: MONITOR DE SESIONES */}
        {activeTab === 'sessions' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-6 space-y-4">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Sesiones de Usuario Registradas</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-extrabold uppercase border-b border-gray-100">
                    <th className="p-3">ID Sesión</th>
                    <th className="p-3">Usuario</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Dispositivo / User-Agent</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Fecha Inicio</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sessionsList.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-3 font-mono font-bold text-gray-400">#{s.id}</td>
                      <td className="p-3">
                        <p className="font-bold text-gray-900">{s.user_name}</p>
                        <p className="text-[10px] text-gray-400">{s.user_email}</p>
                      </td>
                      <td className="p-3 font-mono text-gray-600">{s.ip_address || "127.0.0.1"}</td>
                      <td className="p-3 text-gray-500 max-w-xs truncate" title={s.user_agent}>
                        {s.user_agent || "Navegador Web Standard"}
                      </td>
                      <td className="p-3">
                        {s.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" /> Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gray-100 text-gray-500">
                            <XCircle className="h-3 w-3" /> Revocada
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-gray-400">{new Date(s.created_at).toLocaleString()}</td>
                      <td className="p-3 text-right">
                        {s.is_active && (
                          <button
                            onClick={() => revocarSesion(s.id)}
                            className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Revocar
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

        {/* TAB 3: HISTORIAL DE LOGS DE AUDITORÍA */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-6 space-y-4">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Historial de Eventos & Seguridad (Audit Logs)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-extrabold uppercase border-b border-gray-100">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Acción</th>
                    <th className="p-3">Usuario / Email</th>
                    <th className="p-3">Detalle</th>
                    <th className="p-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logsList.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-3 text-gray-400 font-mono">{new Date(l.created_at).toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          l.action === 'LOGIN' ? 'bg-blue-100 text-blue-800' :
                          l.action === 'CHANGE_ROLE' ? 'bg-amber-100 text-amber-900' :
                          l.action === 'DELETE_USER' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {l.action}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-gray-800">{l.user_email || `User #${l.user_id}`}</td>
                      <td className="p-3 text-gray-600 leading-snug">{l.details || "-"}</td>
                      <td className="p-3 font-mono text-gray-400">{l.ip_address || "127.0.0.1"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
