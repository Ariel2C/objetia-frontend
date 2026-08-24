"use client";
import React, { useState, useEffect, useMemo } from 'react';
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
  const [dropUp, setDropUp] = useState(false);
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

  const toggleOpen = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 220);
    }
    setOpen(!open);
  };

  const selectedOption = options.find(o => o.value.toLowerCase() === value.toLowerCase()) || options[0];

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className="h-[30px] w-[115px] px-2.5 bg-[#1f1f1f] hover:bg-[#252525] border border-[#333333] rounded-[8px] text-[13px] leading-[18px] font-medium text-white flex items-center justify-between gap-2 focus:outline-none transition cursor-pointer disabled:opacity-40"
      >
        <span className="truncate">{selectedOption?.label || value}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-[#8c8c8c]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#8c8c8c]" />}
      </button>

      {open && (
        <div className={`absolute left-0 w-56 bg-[#1f1f1f] border border-[#262626] rounded-[10px] shadow-2xl z-[100] p-1 space-y-0.5 animate-scale-in ${
          dropUp ? 'bottom-full mb-1' : 'top-full mt-1'
        }`}>
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

  const [activeConsoleTab, setActiveConsoleTab] = useState<'users' | 'roles' | 'sessions' | 'logs' | 'keys'>('users');
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [sidebarOculto, setSidebarOculto] = useState(false);
  const [cargando, setCargando] = useState(true);

  // Filtros y estados
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [usersPage, setUsersPage] = useState(1);
  const USERS_PER_PAGE = 10;

  interface RoleItem {
    id: string;
    dbId?: number;
    code: string;
    name: string;
    label: string;
    description: string;
    level: number;
    badgeColor: string;
    permission_ids?: number[];
    permissions: string[];
  }

  interface PermissionItem {
    id: number;
    code: string;
    name: string;
    category: string;
    description?: string;
  }

  // Estados Control de Rangos y Permisos
  const [modoVistaRango, setModoVistaRango] = useState<'lista' | 'formulario'>('lista');
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [rangosList, setRangosList] = useState<RoleItem[]>([
    {
      id: 'root',
      code: 'root',
      name: 'ROOT',
      label: 'SuperAdmin Programador',
      description: 'Acceso total sin restricciones al sistema, base de datos, sesiones, logs y variables de entorno.',
      level: 100,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      permissions: ['Acceso Total Root', 'Control de Rangos', 'Control de Usuarios']
    },
    {
      id: 'admin',
      code: 'admin',
      name: 'ADMIN',
      label: 'Administrador CMS',
      description: 'Administración de contenido, moderación de productos, catálogos, banners y branding.',
      level: 50,
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      permissions: ['Moderación de Productos', 'Gestión de Banners', 'Branding & Apariencia']
    },
    {
      id: 'cliente',
      code: 'cliente',
      name: 'CLIENTE',
      label: 'Usuario Comprador / Vendedor',
      description: 'Perfil estándar de usuario para comprar, publicar productos C2C y gestionar billetera.',
      level: 10,
      badgeColor: 'bg-[#2a2a2a] text-[#8c8c8c] border-[#333333]',
      permissions: ['Comprar Productos', 'Publicar Venta C2C', 'Mi Billetera']
    }
  ]);

  const [modalEliminarRango, setModalEliminarRango] = useState<RoleItem | null>(null);

  const [rangoForm, setRangoForm] = useState<{
    dbId?: number;
    code: string;
    name: string;
    label: string;
    description: string;
    level: number;
    selectedPermissionIds: number[];
  }>({
    code: '',
    name: '',
    label: '',
    description: '',
    level: 10,
    selectedPermissionIds: []
  });

  const [sessionsList, setSessionsList] = useState<SessionData[]>([]);
  const [sessionFilter, setSessionFilter] = useState<'todas' | 'activas' | 'revocadas'>('todas');
  const [searchSessionEmail, setSearchSessionEmail] = useState('');
  const [sessionPage, setSessionPage] = useState(1);
  const SESSIONS_PER_PAGE = 10;

  const [logsList, setLogsList] = useState<LogData[]>([]);
  const [searchLogEmail, setSearchLogEmail] = useState('');
  const [logEventFilter, setLogEventFilter] = useState('');
  const [logPage, setLogPage] = useState(1);
  const LOGS_PER_PAGE = 10;

  const esRoot = Boolean(usuario && (usuario.role?.toLowerCase() === 'root' || usuario.role === 'ROOT'));

  useEffect(() => {
    if (esRoot && token) {
      cargarDatos();
    }
  }, [token, esRoot, activeConsoleTab]);

  const abrirFormularioRango = (modo: 'crear' | 'editar', rango?: RoleItem) => {
    if (modo === 'editar' && rango) {
      setRangoForm({
        dbId: rango.dbId,
        code: rango.code || rango.id,
        name: rango.name,
        label: rango.label || rango.name,
        description: rango.description || '',
        level: rango.level || 10,
        selectedPermissionIds: rango.permission_ids || []
      });
    } else {
      setRangoForm({
        code: '',
        name: '',
        label: '',
        description: '',
        level: 10,
        selectedPermissionIds: []
      });
    }
    setModoVistaRango('formulario');
  };

  const togglePermissionId = (permId: number) => {
    setRangoForm(prev => {
      const exists = prev.selectedPermissionIds.includes(permId);
      return {
        ...prev,
        selectedPermissionIds: exists
          ? prev.selectedPermissionIds.filter(id => id !== permId)
          : [...prev.selectedPermissionIds, permId]
      };
    });
  };

  const guardarRangoForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rangoForm.name.trim()) {
      toast.error("Ingresa el nombre del rango.");
      return;
    }
    const codeClean = rangoForm.dbId ? rangoForm.code : rangoForm.name.toLowerCase().trim().replace(/\s+/g, '_');

    try {
      if (!rangoForm.dbId) {
        // Crear nuevo rango
        const res = await fetch(`${getApiUrl()}/root/roles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            code: codeClean,
            name: rangoForm.name.toUpperCase().trim(),
            label: rangoForm.label.trim() || rangoForm.name.trim(),
            description: rangoForm.description.trim(),
            level: Number(rangoForm.level) || 10,
            badge_color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
            permission_ids: rangoForm.selectedPermissionIds
          })
        });
        const data = await res.json();
        if (res.ok) {
          toast.success(`Rango ${rangoForm.name.toUpperCase()} guardado exitosamente.`);
          setModoVistaRango('lista');
          cargarDatos();
        } else {
          toast.error(data.detail || "Error al guardar el rango.");
        }
      } else {
        // Editar rango existente
        const res = await fetch(`${getApiUrl()}/root/roles/${rangoForm.dbId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            code: rangoForm.code,
            name: rangoForm.name.toUpperCase().trim(),
            label: rangoForm.label.trim() || rangoForm.name.trim(),
            description: rangoForm.description.trim(),
            level: Number(rangoForm.level) || 10,
            badge_color: 'bg-[#2a2a2a] text-[#8c8c8c] border-[#333333]',
            permission_ids: rangoForm.selectedPermissionIds
          })
        });
        const data = await res.json();
        if (res.ok) {
          toast.success(`Rango '${rangoForm.name.toUpperCase()}' actualizado.`);
          setModoVistaRango('lista');
          cargarDatos();
        } else {
          toast.error(data.detail || "Error al actualizar el rango.");
        }
      }
    } catch {
      toast.error("No pudimos conectar con el servidor.");
    }
  };

  const eliminarRango = async (rango: RoleItem) => {
    try {
      if (rango?.dbId) {
        const res = await fetch(`${getApiUrl()}/root/roles/${rango.dbId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.detail || "No se puede eliminar el rango.");
          return;
        }
      }
      setRangosList(prev => prev.filter(r => r.id !== rango.id));
      toast.success("Rango eliminado de la base de datos.");
    } catch {
      toast.error("Error de conexión al eliminar rango.");
    } finally {
      setModalEliminarRango(null);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchUser(val);
    setRoleFilter('');
    setUsersPage(1);
  };

  const rolesDisponiblesEnTabla = useMemo(() => {
    const usuariosSegunBusqueda = usersList.filter(u => {
      if (!searchUser) return true;
      const q = searchUser.toLowerCase();
      return u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    });

    const rolesPresentes = new Set(usuariosSegunBusqueda.map(u => {
      const r = u.role?.toLowerCase();
      return (r === 'client' || r === 'cliente') ? 'cliente' : r;
    }).filter(Boolean));
    
    const todosLosFiltros = [
      { id: '', label: 'Todos' },
      { id: 'cliente', label: 'Clientes' },
      { id: 'admin', label: 'Admins' },
      { id: 'root', label: 'Root' },
    ];

    return todosLosFiltros.filter(f => f.id === '' || rolesPresentes.has(f.id));
  }, [usersList, searchUser]);

  const usuariosFiltrados = usersList.filter(u => {
    if (roleFilter) {
      const uRole = (u.role?.toLowerCase() === 'client' || u.role?.toLowerCase() === 'cliente') ? 'cliente' : u.role?.toLowerCase();
      if (uRole !== roleFilter.toLowerCase()) return false;
    }
    if (searchUser) {
      const q = searchUser.toLowerCase();
      const nameMatch = u.full_name?.toLowerCase().includes(q);
      const emailMatch = u.email?.toLowerCase().includes(q);
      if (!nameMatch && !emailMatch) return false;
    }
    return true;
  });

  const totalUserPages = Math.max(1, Math.ceil(usuariosFiltrados.length / USERS_PER_PAGE));
  const usuariosPaginados = useMemo(() => {
    const start = (usersPage - 1) * USERS_PER_PAGE;
    return usuariosFiltrados.slice(start, start + USERS_PER_PAGE);
  }, [usuariosFiltrados, usersPage, USERS_PER_PAGE]);

  const sesionesFiltradas = sessionsList.filter(s => {
    if (sessionFilter === 'activas' && !s.is_active) return false;
    if (sessionFilter === 'revocadas' && s.is_active) return false;
    if (searchSessionEmail) {
      const q = searchSessionEmail.toLowerCase();
      const emailMatch = s.user_email?.toLowerCase().includes(q);
      const nameMatch = s.user_name?.toLowerCase().includes(q);
      const ipMatch = s.ip_address?.toLowerCase().includes(q);
      if (!emailMatch && !nameMatch && !ipMatch) return false;
    }
    return true;
  });

  const totalSessionPages = Math.max(1, Math.ceil(sesionesFiltradas.length / SESSIONS_PER_PAGE));
  const sesionesPaginadas = useMemo(() => {
    const start = (sessionPage - 1) * SESSIONS_PER_PAGE;
    return sesionesFiltradas.slice(start, start + SESSIONS_PER_PAGE);
  }, [sesionesFiltradas, sessionPage, SESSIONS_PER_PAGE]);

  const eventosDisponiblesEnLogs = useMemo(() => {
    const acciones = new Set(logsList.map(l => l.action).filter(Boolean));
    const list: OptionItem[] = [{ value: '', label: 'Todos los eventos' }];
    acciones.forEach(act => {
      list.push({ value: act, label: act });
    });
    return list;
  }, [logsList]);

  const logsFiltrados = useMemo(() => {
    return logsList.filter(l => {
      if (logEventFilter && l.action.toLowerCase() !== logEventFilter.toLowerCase()) return false;
      if (searchLogEmail) {
        const q = searchLogEmail.toLowerCase();
        const emailMatch = l.user_email?.toLowerCase().includes(q);
        const detailsMatch = l.details?.toLowerCase().includes(q);
        if (!emailMatch && !detailsMatch) return false;
      }
      return true;
    });
  }, [logsList, logEventFilter, searchLogEmail]);

  const totalLogPages = Math.max(1, Math.ceil(logsFiltrados.length / LOGS_PER_PAGE));
  const logsPaginados = useMemo(() => {
    const start = (logPage - 1) * LOGS_PER_PAGE;
    return logsFiltrados.slice(start, start + LOGS_PER_PAGE);
  }, [logsFiltrados, logPage, LOGS_PER_PAGE]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      if (activeConsoleTab === 'users' || activeConsoleTab === 'keys') {
        const res = await fetch(`${getApiUrl()}/root/users?limit=200`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setUsersList(data.users || []);
      } else if (activeConsoleTab === 'roles') {
        const [resRoles, resPerms] = await Promise.all([
          fetch(`${getApiUrl()}/root/roles`, { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(`${getApiUrl()}/root/permissions`, { headers: { "Authorization": `Bearer ${token}` } })
        ]);
        const dataRoles = await resRoles.json();
        const dataPerms = await resPerms.json();

        if (resPerms.ok && dataPerms.permissions) {
          setAllPermissions(dataPerms.permissions);
        }

        if (resRoles.ok && dataRoles.roles) {
          const rolesMapeados = dataRoles.roles.map((r: any) => ({
            id: r.code,
            dbId: r.id,
            code: r.code,
            name: r.name,
            label: r.label,
            description: r.description || '',
            level: r.level,
            badgeColor: r.badge_color,
            permission_ids: r.permission_ids || [],
            permissions: Array.isArray(r.permissions)
              ? r.permissions
              : (r.permissions ? String(r.permissions).split(',').map((p: string) => p.trim()) : [])
          }));
          setRangosList(rolesMapeados);
        }
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

  const [modalEliminarUser, setModalEliminarUser] = useState<{ id: number; email: string } | null>(null);

  const confirmarEliminarUsuario = async () => {
    if (!modalEliminarUser) return;
    const { id: userId, email: userEmail } = modalEliminarUser;
    setModalEliminarUser(null);
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

          <button
            onClick={() => { setActiveConsoleTab('roles'); setMenuMovilAbierto(false); }}
            className={`w-full flex items-center gap-2.5 px-3 h-[36px] rounded-[12px] text-[14px] font-medium transition-colors text-left cursor-pointer ${
              activeConsoleTab === 'roles' 
                ? 'bg-[#2a2a2a] text-[#ffffff]' 
                : 'text-[#8c8c8c] hover:bg-[#252525] hover:text-[#d4d4d4]'
            }`}
          >
            <Sliders className="h-4 w-4 text-current flex-shrink-0" />
            <span>Control de Rangos</span>
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
              {usuario?.full_name?.charAt(0).toUpperCase() || 'R'}
            </div>
            <span className="text-[12px] font-medium text-[#d4d4d4] truncate">
              {usuario?.email || 'root@objetia.com'}
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
              {activeConsoleTab === 'roles' && "Control de Rangos"}
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

        {/* BARRA SECUNDARIA DE ACCIONES (Control de Rangos) */}
        {activeConsoleTab === 'roles' && (
          <div className="px-3 sm:px-6 py-2 border-b border-[#262626] flex flex-row justify-start items-center gap-2.5 bg-[#1f1f1f]">
            {modoVistaRango === 'lista' ? (
              <button
                onClick={() => abrirFormularioRango('crear')}
                className="px-2.5 sm:px-3 h-[28px] sm:h-[32px] bg-[#252525] border border-[#333333] text-[#d4d4d4] rounded-[10px] sm:rounded-[12px] text-[11px] sm:text-[13px] font-medium hover:bg-[#323232] hover:text-white transition cursor-pointer whitespace-nowrap font-sans"
              >
                Nuevo Rango
              </button>
            ) : (
              <button
                onClick={() => setModoVistaRango('lista')}
                className="px-2.5 sm:px-3 h-[28px] sm:h-[32px] bg-[#252525] border border-[#333333] text-[#d4d4d4] rounded-[10px] sm:rounded-[12px] text-[11px] sm:text-[13px] font-medium hover:bg-[#323232] hover:text-white transition cursor-pointer flex items-center gap-1 whitespace-nowrap font-sans"
              >
                <ChevronLeft className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Volver</span>
              </button>
            )}
          </div>
        )}

        {/* BARRA SECUNDARIA DE FILTROS & PILLS (Solo en Control de Usuarios) */}
        {activeConsoleTab === 'users' && (
          <div className="px-3 sm:px-6 py-2 border-b border-[#262626] flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 bg-[#1f1f1f]">
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              <span className="text-[12px] sm:text-[13px] font-medium text-[#8c8c8c] whitespace-nowrap mr-0.5">Agrupar por:</span>
              {rolesDisponiblesEnTabla.map((f) => {
                const isSelected = roleFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setRoleFilter(f.id);
                      setUsersPage(1);
                    }}
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
                  onChange={handleSearchChange}
                  placeholder="Filtrar usuarios..."
                  style={{ 
                    color: '#ffffff', 
                    WebkitTextFillColor: searchUser ? '#ffffff' : undefined,
                    backgroundColor: '#191919', 
                    caretColor: '#ffffff' 
                  }}
                  className="w-full pl-8 pr-3 h-[32px] bg-[#191919] border border-[#262626] rounded-[12px] text-white text-[13px] placeholder:text-[#8c8c8c] placeholder:opacity-100 focus:outline-none focus:border-[#87a9ff] transition font-sans caret-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* BARRA SECUNDARIA DE FILTROS & PILLS (Monitor de Sesiones) */}
        {activeConsoleTab === 'sessions' && (
          <div className="px-3 sm:px-6 py-2 border-b border-[#262626] flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 bg-[#1f1f1f]">
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
                    onClick={() => {
                      setSessionFilter(f.id as any);
                      setSessionPage(1);
                    }}
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

            {/* BUSCADOR DE SESIONES POR EMAIL */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8c8c8c]" />
                <input
                  type="text"
                  value={searchSessionEmail}
                  onChange={(e) => {
                    setSearchSessionEmail(e.target.value);
                    setSessionPage(1);
                  }}
                  placeholder="Buscar por email..."
                  style={{ 
                    color: '#ffffff', 
                    WebkitTextFillColor: searchSessionEmail ? '#ffffff' : undefined,
                    backgroundColor: '#191919', 
                    caretColor: '#ffffff' 
                  }}
                  className="w-full pl-8 pr-3 h-[32px] bg-[#191919] border border-[#262626] rounded-[12px] text-white text-[13px] placeholder:text-[#8c8c8c] placeholder:opacity-100 focus:outline-none focus:border-[#87a9ff] transition font-sans caret-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* BARRA SECUNDARIA DE FILTROS & BUSCADOR (Logs de Auditoría) */}
        {activeConsoleTab === 'logs' && (
          <div className="px-3 sm:px-6 py-2 border-b border-[#262626] flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 bg-[#1f1f1f]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] sm:text-[13px] font-medium text-[#8c8c8c] whitespace-nowrap">Agrupar por:</span>
              <CustomSelect
                value={logEventFilter || ''}
                options={eventosDisponiblesEnLogs}
                onChange={(val) => {
                  setLogEventFilter(val);
                  setLogPage(1);
                }}
              />
            </div>

            {/* BUSCADOR DE LOGS POR EMAIL */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8c8c8c]" />
                <input
                  type="text"
                  value={searchLogEmail}
                  onChange={(e) => {
                    setSearchLogEmail(e.target.value);
                    setLogPage(1);
                  }}
                  placeholder="Buscar por email..."
                  style={{ 
                    color: '#ffffff', 
                    WebkitTextFillColor: searchLogEmail ? '#ffffff' : undefined,
                    backgroundColor: '#191919', 
                    caretColor: '#ffffff' 
                  }}
                  className="w-full pl-8 pr-3 h-[32px] bg-[#191919] border border-[#262626] rounded-[12px] text-white text-[13px] placeholder:text-[#8c8c8c] placeholder:opacity-100 focus:outline-none focus:border-[#87a9ff] transition font-sans caret-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* ÁREA DE CONTENIDO DINÁMICO */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto bg-[#191919]">

          {/* ============================================================================== */}
          {/* TAB 1: CONTROL DE USUARIOS */}
          {/* ============================================================================== */}
          {activeConsoleTab === 'users' && (
            <div className="bg-[#1f1f1f] border border-[#262626] rounded-[12px] overflow-visible p-4 space-y-3">
              <div className="space-y-2">
                {usuariosPaginados.length === 0 ? (
                  <p className="text-xs text-[#8c8c8c] text-center py-6 font-sans">No se encontraron usuarios registrados.</p>
                ) : (
                  usuariosPaginados.map((u) => (
                    <div key={u.id} className="p-3 bg-[#191919] border border-[#262626] rounded-[10px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-sans">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="h-6 w-6 rounded-full border border-[#87a9ff]/40 object-cover flex-shrink-0" />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-[#2a2a2a] text-[#87a9ff] font-medium flex items-center justify-center text-[11px] flex-shrink-0 font-sans">
                              {u.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                          <p className="text-[14px] font-medium text-[#87a9ff] truncate">{u.full_name}</p>
                          <span className="text-xs text-[#8c8c8c] font-sans truncate">({u.email})</span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium uppercase flex-shrink-0 ${
                            u.role === 'root' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                            u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                            'bg-[#2a2a2a] text-[#8c8c8c] border border-[#333333]'
                          }`}>
                            {u.role}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-[#8c8c8c] font-sans">
                          <span className="text-[#666666]">Creado:</span>
                          <span suppressHydrationWarning className="text-[#8c8c8c] font-sans">{new Date(u.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
                        <span className="text-xs text-[#8c8c8c] font-sans whitespace-nowrap">Cambiar rango:</span>
                        <CustomSelect
                          value={u.role === 'client' ? 'cliente' : u.role}
                          disabled={u.id === usuario?.id}
                          options={[
                            { value: 'cliente', label: 'CLIENTE', sublabel: 'Usuario comprador' },
                            { value: 'admin', label: 'ADMIN', sublabel: 'Administrador CMS' },
                            { value: 'root', label: 'ROOT', sublabel: 'SuperAdmin Programador' }
                          ]}
                          onChange={(val) => cambiarRol(u.id, val)}
                        />

                        <button
                          disabled={u.id === usuario?.id}
                          onClick={() => setModalEliminarUser({ id: u.id, email: u.email })}
                          className="w-[72px] h-[28px] bg-[#252525] border border-[#333333] text-[#d4d4d4] hover:bg-[#323232] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#252525] disabled:hover:text-[#d4d4d4] rounded-[8px] text-xs font-medium transition cursor-pointer flex-shrink-0 whitespace-nowrap shadow-xs font-sans flex items-center justify-center"
                          title={u.id === usuario?.id ? "No puedes eliminar tu propia cuenta" : "Eliminar usuario"}
                        >
                          Eliminar
                        </button>
                      </div>

                    </div>
                  ))
                )}
              </div>

              {/* CONTROLES DE PAGINACIÓN */}
              {totalUserPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-[#262626] text-xs text-[#8c8c8c] font-sans">
                  <span>
                    Mostrando {usuariosPaginados.length} de {usuariosFiltrados.length} usuarios (Página {usersPage} de {totalUserPages})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={usersPage <= 1}
                      onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                      className="px-3 h-[28px] bg-[#252525] border border-[#333333] text-[#d4d4d4] rounded-[8px] hover:bg-[#323232] disabled:opacity-40 disabled:hover:bg-[#252525] transition cursor-pointer font-sans"
                    >
                      Anterior
                    </button>
                    <span className="text-[#d4d4d4] font-medium font-sans">
                      {usersPage} / {totalUserPages}
                    </span>
                    <button
                      disabled={usersPage >= totalUserPages}
                      onClick={() => setUsersPage(p => Math.min(totalUserPages, p + 1))}
                      className="px-3 h-[28px] bg-[#252525] border border-[#333333] text-[#d4d4d4] rounded-[8px] hover:bg-[#323232] disabled:opacity-40 disabled:hover:bg-[#252525] transition cursor-pointer font-sans"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================================== */}
          {/* TAB: CONTROL DE RANGOS */}
          {/* ============================================================================== */}
          {activeConsoleTab === 'roles' && (
            <div>
              {modoVistaRango === 'lista' ? (
                /* VISTA LISTA DE TARJETAS DE RANGOS */
                <div className="bg-[#1f1f1f] border border-[#262626] rounded-[12px] overflow-hidden p-4 space-y-3 font-sans">
                  <div className="space-y-2">
                    {rangosList.map((r) => (
                      <div key={r.id} className="p-3.5 bg-[#191919] border border-[#262626] rounded-[10px] space-y-2.5 font-sans">
                        
                        {/* SUBFILA 1: Nombre del Rango, Etiqueta y Acciones */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            <p className="text-[14px] font-bold text-[#87a9ff] truncate">{r.name}</p>
                            <span className="text-xs text-[#8c8c8c] font-sans truncate">({r.label})</span>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => abrirFormularioRango('editar', r)}
                              className="px-3 h-[28px] bg-[#252525] border border-[#333333] text-[#d4d4d4] hover:bg-[#323232] hover:text-white rounded-[8px] text-xs font-medium transition cursor-pointer font-sans"
                            >
                              Editar
                            </button>
                            <button
                              disabled={['root', 'admin', 'cliente', 'client'].includes(r.code?.toLowerCase() || r.id?.toLowerCase())}
                              onClick={() => setModalEliminarRango(r)}
                              className="w-[72px] h-[28px] bg-[#252525] border border-[#333333] text-[#d4d4d4] hover:bg-[#323232] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#252525] disabled:hover:text-[#d4d4d4] rounded-[8px] text-xs font-medium transition cursor-pointer flex items-center justify-center font-sans"
                              title={['root', 'admin', 'cliente', 'client'].includes(r.code?.toLowerCase() || r.id?.toLowerCase()) ? "Rango del sistema no eliminable" : "Eliminar rango"}
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>

                        {/* SUBFILA 2: Descripción y Permisos */}
                        <div className="pt-2 border-t border-[#262626] space-y-1.5 text-xs text-[#8c8c8c]">
                          <p className="text-[#d4d4d4] font-sans">{r.description}</p>
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5 font-sans">
                            <span className="text-[#666666] font-medium font-sans">Permisos:</span>
                            {r.permissions.map((p, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-[6px] bg-[#252525] text-[#d4d4d4] border border-[#333333] text-[11px] font-sans">
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* VISTA PÁGINA DE FORMULARIO DE CREACIÓN / EDICIÓN (SIN MODAL) */
                <div className="bg-[#1f1f1f] border border-[#262626] rounded-[12px] p-4 sm:p-6 space-y-5 font-sans">
                  {/* ENCABEZADO FORMULARIO */}
                  <div className="pb-3 border-b border-[#262626]">
                    <h2 className="text-base font-bold text-white">
                      {rangoForm.dbId ? `Editar Rango: ${rangoForm.name}` : 'Crear Nuevo Rango'}
                    </h2>
                  </div>

                  <form onSubmit={guardarRangoForm} className="space-y-4 text-xs font-sans">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#8c8c8c] mb-1 font-medium">Nombre Visible del Rango</label>
                        <input
                          type="text"
                          required
                          value={rangoForm.name}
                          onChange={(e) => setRangoForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Ej: ADMINISTRADOR GENERAL"
                          style={{ 
                            color: '#ffffff', 
                            WebkitTextFillColor: '#ffffff',
                            backgroundColor: '#191919', 
                            caretColor: '#ffffff' 
                          }}
                          className="w-full px-3 h-[36px] bg-[#191919] border border-[#262626] rounded-[8px] text-white text-xs focus:outline-none focus:border-[#87a9ff] font-sans caret-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[#8c8c8c] mb-1 font-medium">Etiqueta / Título Descriptivo</label>
                        <input
                          type="text"
                          value={rangoForm.label}
                          onChange={(e) => setRangoForm(f => ({ ...f, label: e.target.value }))}
                          placeholder="Ej: Administrador General del Sistema"
                          style={{ 
                            color: '#ffffff', 
                            WebkitTextFillColor: '#ffffff',
                            backgroundColor: '#191919', 
                            caretColor: '#ffffff' 
                          }}
                          className="w-full px-3 h-[36px] bg-[#191919] border border-[#262626] rounded-[8px] text-white text-xs focus:outline-none focus:border-[#87a9ff] font-sans caret-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#8c8c8c] mb-1 font-medium">Descripción Funcional</label>
                      <textarea
                        rows={2}
                        value={rangoForm.description}
                        onChange={(e) => setRangoForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Descripción de tareas y ámbito de este rango..."
                        style={{ 
                          color: '#ffffff', 
                          WebkitTextFillColor: '#ffffff',
                          backgroundColor: '#191919', 
                          caretColor: '#ffffff' 
                        }}
                        className="w-full p-2.5 bg-[#191919] border border-[#262626] rounded-[8px] text-white text-xs focus:outline-none focus:border-[#87a9ff] font-sans caret-white"
                      />
                    </div>

                    {/* SECCIÓN DE PERMISOS ASIGNADOS CON CHECKBOXES */}
                    <div className="pt-3 border-t border-[#262626] space-y-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                        <h3 className="text-xs font-bold text-[#87a9ff] uppercase tracking-wider">Permisos Asignados al Rango</h3>
                        <span className="text-xs text-[#8c8c8c]">
                          {rangoForm.selectedPermissionIds.length} de {allPermissions.length} permisos activos
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {allPermissions.map((perm) => {
                          const isChecked = rangoForm.selectedPermissionIds.includes(perm.id);
                          return (
                            <div
                              key={perm.id}
                              onClick={() => togglePermissionId(perm.id)}
                              className={`p-3 rounded-[10px] border transition cursor-pointer flex items-start gap-2.5 font-sans ${
                                isChecked
                                  ? 'bg-[#87a9ff]/10 border-[#87a9ff]/50 text-white'
                                  : 'bg-[#191919] border-[#262626] text-[#8c8c8c] hover:border-[#444444]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="mt-0.5 h-4 w-4 rounded accent-[#87a9ff] cursor-pointer"
                              />
                              <div className="min-w-0">
                                <p className={`text-xs font-medium ${isChecked ? 'text-white' : 'text-[#d4d4d4]'}`}>{perm.name}</p>
                                <p className="text-[11px] text-[#8c8c8c] truncate">{perm.description || perm.category}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* BOTONES DE ACCIÓN FORMULARIO */}
                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#262626]">
                      <button
                        type="button"
                        onClick={() => setModoVistaRango('lista')}
                        className="px-4 h-[34px] bg-[#252525] border border-[#333333] text-[#d4d4d4] hover:bg-[#323232] rounded-[8px] text-xs font-medium transition cursor-pointer font-sans"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 h-[34px] bg-[#393f51] border border-[#454d63] text-white hover:bg-[#454d63] rounded-[8px] text-xs font-medium transition cursor-pointer font-sans shadow-xs"
                      >
                        {rangoForm.dbId ? 'Guardar Cambios' : 'Crear Rango'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ============================================================================== */}
          {/* TAB 2: MONITOR DE SESIONES */}
          {/* ============================================================================== */}
          {activeConsoleTab === 'sessions' && (
            <div className="bg-[#1f1f1f] border border-[#262626] rounded-[12px] overflow-hidden p-4 space-y-3">
              <div className="space-y-2">
                {sesionesPaginadas.length === 0 ? (
                  <p className="text-xs text-[#8c8c8c] text-center py-6 font-sans">No se encontraron sesiones registradas.</p>
                ) : (
                  sesionesPaginadas.map((s) => (
                    <div key={s.id} className="p-3 bg-[#191919] border border-[#262626] rounded-[10px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-sans">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-[#87a9ff] text-[14px]">{s.user_name}</p>
                          <span className="text-xs text-[#8c8c8c] font-sans">({s.user_email})</span>
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

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8c8c8c] font-sans">
                          <p><span className="text-[#666666]">IP:</span> {s.ip_address || "127.0.0.1"}</p>
                          <p className="truncate max-w-xs sm:max-w-md" title={s.user_agent}><span className="text-[#666666]">Device:</span> {s.user_agent || "Web Browser"}</p>
                          <p suppressHydrationWarning><span className="text-[#666666]">Inicio:</span> {new Date(s.created_at).toLocaleString()}</p>
                        </div>
                      </div>

                      {s.is_active && (
                        <button
                          onClick={() => revocarSesion(s.id)}
                          className="px-3 h-[28px] bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-[8px] text-xs font-medium border border-red-500/30 transition cursor-pointer flex-shrink-0 whitespace-nowrap"
                        >
                          Revocar Sesión
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* CONTROLES DE PAGINACIÓN */}
              {totalSessionPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-[#262626] text-xs text-[#8c8c8c] font-sans">
                  <span>
                    Mostrando {sesionesPaginadas.length} de {sesionesFiltradas.length} sesiones (Página {sessionPage} de {totalSessionPages})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={sessionPage <= 1}
                      onClick={() => setSessionPage(p => Math.max(1, p - 1))}
                      className="px-3 h-[28px] bg-[#252525] border border-[#333333] text-[#d4d4d4] rounded-[8px] hover:bg-[#323232] disabled:opacity-40 disabled:hover:bg-[#252525] transition cursor-pointer font-sans"
                    >
                      Anterior
                    </button>
                    <span className="text-[#d4d4d4] font-medium font-sans">
                      {sessionPage} / {totalSessionPages}
                    </span>
                    <button
                      disabled={sessionPage >= totalSessionPages}
                      onClick={() => setSessionPage(p => Math.min(totalSessionPages, p + 1))}
                      className="px-3 h-[28px] bg-[#252525] border border-[#333333] text-[#d4d4d4] rounded-[8px] hover:bg-[#323232] disabled:opacity-40 disabled:hover:bg-[#252525] transition cursor-pointer font-sans"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================================== */}
          {/* TAB 3: LOGS DE AUDITORÍA */}
          {/* ============================================================================== */}
          {activeConsoleTab === 'logs' && (
            <div className="bg-[#1f1f1f] border border-[#262626] rounded-[12px] overflow-hidden p-4 space-y-3">
              <div className="space-y-2">
                {logsPaginados.length === 0 ? (
                  <p className="text-xs text-[#8c8c8c] text-center py-6 font-sans">No se encontraron registros de auditoría.</p>
                ) : (
                  logsPaginados.map((l) => (
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
                        <p suppressHydrationWarning>{new Date(l.created_at).toLocaleString()}</p>
                        {l.ip_address && <p>{l.ip_address}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* CONTROLES DE PAGINACIÓN */}
              {totalLogPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-[#262626] text-xs text-[#8c8c8c] font-sans">
                  <span>
                    Mostrando {logsPaginados.length} de {logsFiltrados.length} registros (Página {logPage} de {totalLogPages})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={logPage <= 1}
                      onClick={() => setLogPage(p => Math.max(1, p - 1))}
                      className="px-3 h-[28px] bg-[#252525] border border-[#333333] text-[#d4d4d4] rounded-[8px] hover:bg-[#323232] disabled:opacity-40 disabled:hover:bg-[#252525] transition cursor-pointer font-sans"
                    >
                      Anterior
                    </button>
                    <span className="text-[#d4d4d4] font-medium font-sans">
                      {logPage} / {totalLogPages}
                    </span>
                    <button
                      disabled={logPage >= totalLogPages}
                      onClick={() => setLogPage(p => Math.min(totalLogPages, p + 1))}
                      className="px-3 h-[28px] bg-[#252525] border border-[#333333] text-[#d4d4d4] rounded-[8px] hover:bg-[#323232] disabled:opacity-40 disabled:hover:bg-[#252525] transition cursor-pointer font-sans"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
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

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {modalEliminarUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#1f1f1f] border border-[#262626] rounded-[16px] p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 bg-red-500/10 rounded-full border border-red-500/30 flex-shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-[16px] sm:text-[18px] font-semibold text-white">¿Eliminar Usuario?</h3>
            </div>

            <p className="text-xs sm:text-sm text-[#d4d4d4] font-sans leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente la cuenta de{' '}
              <strong className="text-white font-semibold">{modalEliminarUser.email}</strong>? Esta acción no se puede deshacer.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262626]">
              <button
                onClick={() => setModalEliminarUser(null)}
                className="px-3.5 h-[32px] bg-[#252525] border border-[#333333] text-[#d4d4d4] hover:text-white hover:bg-[#323232] rounded-[10px] text-xs font-medium transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminarUsuario}
                className="px-4 h-[32px] bg-[#393f51] border border-[#454d63] text-white hover:bg-red-600 hover:border-red-500 rounded-[10px] text-xs font-medium transition cursor-pointer shadow-xs"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}



      {/* MODAL CONFIRMAR ELIMINAR RANGO */}
      {modalEliminarRango && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-[#1f1f1f] border border-[#333333] rounded-[16px] max-w-sm w-full p-5 space-y-4 shadow-2xl text-left animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trash2 className="h-4.5 w-4.5 text-red-400" />
                <span>Eliminar Rango</span>
              </h3>
              <button onClick={() => setModalEliminarRango(null)} className="text-[#8c8c8c] hover:text-white transition cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-[#d4d4d4] leading-relaxed">
              ¿Estás seguro de que deseas eliminar el rango <span className="font-bold text-white">{modalEliminarRango.name}</span>? Esta acción no se puede deshacer.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262626]">
              <button
                onClick={() => setModalEliminarRango(null)}
                className="px-3.5 h-[32px] bg-[#252525] border border-[#333333] text-[#d4d4d4] hover:bg-[#323232] rounded-[8px] text-xs font-medium transition cursor-pointer font-sans"
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminarRango(modalEliminarRango)}
                className="px-4 h-[32px] bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600/30 rounded-[8px] text-xs font-medium transition cursor-pointer font-sans"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
