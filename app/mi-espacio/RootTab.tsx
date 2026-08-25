"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { getApiUrl } from '../../lib/config';
import { 
  Menu, X, Key, Users, Activity, FileText, Search, Trash2, Check,
  RefreshCw, ShieldAlert, CheckCircle2, XCircle, Crown, Shield, 
  Sliders, Database, Terminal, ChevronDown, ChevronUp, ChevronLeft, Bell, Settings, Copy, 
  ExternalLink, Layers, ArrowUpRight, Lock, Eye, PanelLeftClose, PanelLeftOpen,
  FolderTree, Folder, FolderOpen, Zap, Plus, ChevronRight, Edit3, ShieldCheck,
  LayoutDashboard, Palette, Calendar, Image as ImageIcon
} from 'lucide-react';

import DashboardTab from './DashboardTab';
import AppearanceTab from './AppearanceTab';
import BannersTab from './BannersTab';
import CustomizationsTab from './CustomizationsTab';
import CampaignsTab from './CampaignsTab';
import ModerationTab from './ModerationTab';

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

type ConsoleTabType = 'dashboard' | 'moderation' | 'appearance' | 'campanas' | 'secciones' | 'banners' | 'users' | 'roles' | 'permissions' | 'sections' | 'sessions' | 'logs' | 'keys';

interface RootTabProps {
  initialTab?: string;
  onVolverAMiEspacio?: () => void;
  msgAsignar?: any;
  emailAsignar?: string;
  setEmailAsignar?: (val: string) => void;
  rolAsignar?: string;
  setRolAsignar?: (val: string) => void;
  cargandoAsignar?: boolean;
  handleAsignarRango?: (e: React.FormEvent) => void;
  adminDashboardData?: any;
  cargandoDashboard?: boolean;
  tieneCambiosMarca?: boolean;
  setTieneCambiosMarca?: (val: boolean) => void;
  handlePublicarMarca?: () => void;
  brandName?: string;
  setBrandName?: (val: string) => void;
  brandFontFamily?: string;
  setBrandFontFamily?: (val: string) => void;
  brandFontSize?: string;
  setBrandFontSize?: (val: string) => void;
  logoHistory?: any[];
  setLogoHistory?: React.Dispatch<React.SetStateAction<any[]>>;
  logoUrl?: string;
  setLogoUrl?: (val: string) => void;
  logoPreviaUrl?: string | null;
  setLogoPreviaUrl?: (val: string | null) => void;
  zoomLogo?: number;
  setZoomLogo?: React.Dispatch<React.SetStateAction<number>>;
  rotateLogo?: number;
  setRotateLogo?: React.Dispatch<React.SetStateAction<number>>;
  offsetX?: number;
  setOffsetX?: React.Dispatch<React.SetStateAction<number>>;
  offsetY?: number;
  setOffsetY?: React.Dispatch<React.SetStateAction<number>>;
  removerFondoBlanco?: boolean;
  setRemoverFondoBlanco?: (val: boolean) => void;
  toleranciaTransparencia?: number;
  setToleranciaTransparencia?: (val: number) => void;
  colorPrimary?: string;
  setColorPrimary?: (val: string) => void;
  colorSecondary?: string;
  setColorSecondary?: (val: string) => void;
  colorBackground?: string;
  setColorBackground?: (val: string) => void;
  colorNavbar?: string;
  setColorNavbar?: (val: string) => void;
  colorSectionTitle?: string;
  setColorSectionTitle?: (val: string) => void;
  colorCatalogLink?: string;
  setColorCatalogLink?: (val: string) => void;
  colorTextInput?: string;
  setColorTextInput?: (val: string) => void;
  handleEliminarLogoHistorial?: (index: number) => void;
  tieneCambiosBanners?: boolean;
  handlePublicarBanners?: () => void;
  subiendoBanner?: boolean;
  nuevoBannerTitulo?: string;
  setNuevoBannerTitulo?: (val: string) => void;
  nuevoBannerSubtitulo?: string;
  setNuevoBannerSubtitulo?: (val: string) => void;
  nuevoBannerLink?: string;
  setNuevoBannerLink?: (val: string) => void;
  nuevoBannerLinkPersonalizado?: string;
  setNuevoBannerLinkPersonalizado?: (val: string) => void;
  nuevoBannerArchivo?: File | null;
  setNuevoBannerArchivo?: (val: File | null) => void;
  nuevoBannerArchivoMovil?: File | null;
  setNuevoBannerArchivoMovil?: (val: File | null) => void;
  handleAgregarBorradorBanner?: (e?: any) => void;
  bannerList?: any[];
  setBannerList?: React.Dispatch<React.SetStateAction<any[]>>;
  setTieneCambiosBanners?: (val: boolean) => void;
  showToast?: (mensaje: string, tipo?: 'success' | 'error' | 'info') => void;
  tieneCambiosSecciones?: boolean;
  handlePublicarSecciones?: () => void;
  nuevoSeccionTitulo?: string;
  setNuevoSeccionTitulo?: (val: string) => void;
  nuevoSeccionCategoria?: string;
  setNuevoSeccionCategoria?: (val: string) => void;
  handleAgregarSeccion?: (e?: any) => void;
  seccionesList?: any[];
  setSeccionesList?: React.Dispatch<React.SetStateAction<any[]>>;
  setTieneCambiosSecciones?: (val: boolean) => void;
  handleEliminarSeccion?: (id: number) => void;
}

export default function RootTab({
  initialTab,
  onVolverAMiEspacio,
  msgAsignar,
  emailAsignar,
  setEmailAsignar,
  rolAsignar,
  setRolAsignar,
  cargandoAsignar,
  handleAsignarRango,
  adminDashboardData,
  cargandoDashboard,
  tieneCambiosMarca,
  setTieneCambiosMarca,
  handlePublicarMarca,
  brandName,
  setBrandName,
  brandFontFamily,
  setBrandFontFamily,
  brandFontSize,
  setBrandFontSize,
  logoHistory,
  setLogoHistory,
  logoUrl,
  setLogoUrl,
  logoPreviaUrl,
  setLogoPreviaUrl,
  zoomLogo,
  setZoomLogo,
  rotateLogo,
  setRotateLogo,
  offsetX,
  setOffsetX,
  offsetY,
  setOffsetY,
  removerFondoBlanco,
  setRemoverFondoBlanco,
  toleranciaTransparencia,
  setToleranciaTransparencia,
  colorPrimary,
  setColorPrimary,
  colorSecondary,
  setColorSecondary,
  colorBackground,
  setColorBackground,
  colorNavbar,
  setColorNavbar,
  colorSectionTitle,
  setColorSectionTitle,
  colorCatalogLink,
  setColorCatalogLink,
  colorTextInput,
  setColorTextInput,
  handleEliminarLogoHistorial,
  tieneCambiosBanners,
  handlePublicarBanners,
  subiendoBanner,
  nuevoBannerTitulo,
  setNuevoBannerTitulo,
  nuevoBannerSubtitulo,
  setNuevoBannerSubtitulo,
  nuevoBannerLink,
  setNuevoBannerLink,
  nuevoBannerLinkPersonalizado,
  setNuevoBannerLinkPersonalizado,
  nuevoBannerArchivo,
  setNuevoBannerArchivo,
  nuevoBannerArchivoMovil,
  setNuevoBannerArchivoMovil,
  handleAgregarBorradorBanner,
  bannerList,
  setBannerList,
  setTieneCambiosBanners,
  showToast,
  tieneCambiosSecciones,
  handlePublicarSecciones,
  nuevoSeccionTitulo,
  setNuevoSeccionTitulo,
  nuevoSeccionCategoria,
  setNuevoSeccionCategoria,
  handleAgregarSeccion,
  seccionesList,
  setSeccionesList,
  setTieneCambiosSecciones,
  handleEliminarSeccion
}: RootTabProps) {
  const { usuario, token, tienePermiso } = useAuth();
  const toast = useToast();

  const [activeConsoleTab, setActiveConsoleTab] = useState<ConsoleTabType>(
    initialTab && initialTab !== 'admin' && initialTab !== 'root' ? (initialTab as ConsoleTabType) : 'dashboard'
  );
  const [seguridadMenuAbierto, setSeguridadMenuAbierto] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [sidebarOculto, setSidebarOculto] = useState(false);
  const [cargando, setCargando] = useState(true);

  // Bloquear el scroll del body principal mientras la Consola de Administración está abierta
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  interface SectionNode {
    id: number;
    code: string;
    name: string;
    category: string;
    description?: string;
    parent_code?: string;
    icon_name?: string;
    is_active: boolean;
    actions: { id: number; code: string; name: string; description?: string; is_active: boolean }[];
    children: SectionNode[];
  }

  const [sectionsTree, setSectionsTree] = useState<SectionNode[]>([]);
  const [flatSections, setFlatSections] = useState<{ id: number; code: string; name: string; category: string }[]>([]);
  const [expandedSectionCodes, setExpandedSectionCodes] = useState<Record<string, boolean>>({});

  const [modalSeccion, setModalSeccion] = useState<{
    id?: number;
    code: string;
    name: string;
    category: string;
    description: string;
    parent_code: string;
  } | null>(null);

  const [modalAccion, setModalAccion] = useState<{
    section_code: string;
    code: string;
    name: string;
    description: string;
  } | null>(null);

  const toggleExpandSection = (code: string) => {
    setExpandedSectionCodes(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const guardarSeccion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalSeccion || !modalSeccion.name.trim()) return;
    const codeClean = modalSeccion.id ? modalSeccion.code : modalSeccion.name.toLowerCase().trim().replace(/\s+/g, '_');

    try {
      if (!modalSeccion.id) {
        const res = await fetch(`${getApiUrl()}/root/sections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            code: codeClean,
            name: modalSeccion.name.trim(),
            category: modalSeccion.category.trim() || 'General',
            description: modalSeccion.description.trim(),
            parent_code: modalSeccion.parent_code || null
          })
        });
        const data = await res.json();
        if (res.ok) {
          toast.success(`Sección '${modalSeccion.name}' creada exitosamente.`);
          setModalSeccion(null);
          cargarDatos();
        } else {
          toast.error(data.detail || "Error al crear la sección.");
        }
      } else {
        const res = await fetch(`${getApiUrl()}/root/sections/${modalSeccion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            code: modalSeccion.code,
            name: modalSeccion.name.trim(),
            category: modalSeccion.category.trim() || 'General',
            description: modalSeccion.description.trim(),
            parent_code: modalSeccion.parent_code || null
          })
        });
        const data = await res.json();
        if (res.ok) {
          toast.success(`Sección '${modalSeccion.name}' actualizada.`);
          setModalSeccion(null);
          cargarDatos();
        } else {
          toast.error(data.detail || "Error al actualizar la sección.");
        }
      }
    } catch {
      toast.error("No se pudo conectar con el servidor.");
    }
  };

  const eliminarSeccion = async (id: number, name: string) => {
    try {
      const res = await fetch(`${getApiUrl()}/root/sections/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al eliminar sección.");
      toast.success(data.mensaje || `Sección '${name}' eliminada.`);
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar sección.");
    }
  };

  const guardarAccion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAccion || !modalAccion.name.trim()) return;
    const codeClean = modalAccion.name.toLowerCase().trim().replace(/\s+/g, '_');

    try {
      const res = await fetch(`${getApiUrl()}/root/sections/${modalAccion.section_code}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          code: codeClean,
          name: modalAccion.name.trim(),
          description: modalAccion.description.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Acción '${modalAccion.name}' creada exitosamente.`);
        setModalAccion(null);
        cargarDatos();
      } else {
        toast.error(data.detail || "Error al crear acción.");
      }
    } catch {
      toast.error("No se pudo conectar con el servidor.");
    }
  };

  const eliminarAccion = async (id: number, name: string) => {
    try {
      const res = await fetch(`${getApiUrl()}/root/actions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al eliminar acción.");
      toast.success(data.mensaje || `Acción '${name}' eliminada.`);
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar acción.");
    }
  };

  const renderSectionNode = (node: SectionNode, depth = 0) => {
    const isExpanded = expandedSectionCodes[node.code] ?? false;
    const hasChildren = node.children && node.children.length > 0;
    const hasActions = node.actions && node.actions.length > 0;

    return (
      <div key={node.code} className="font-sans text-xs select-none">
        {/* FILA DE SECCIÓN (CARPETA EN ÁRBOL ESTILO EXPLORADOR VS CODE) */}
        <div 
          style={{ paddingLeft: `${depth * 18 + 8}px` }}
          className="group py-1.5 pr-2 hover:bg-[#252525] rounded-[6px] flex items-center justify-between gap-2 transition-colors cursor-pointer"
        >
          <div 
            onClick={() => toggleExpandSection(node.code)}
            className="flex items-center gap-2 min-w-0 flex-1 py-0.5"
          >
            <span className="text-[#8c8c8c] hover:text-white transition flex-shrink-0">
              {isExpanded ? <ChevronDown className="h-4 w-4 text-[#cccccc]" /> : <ChevronRight className="h-4 w-4 text-[#8c8c8c]" />}
            </span>

            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-[#cccccc] fill-[#cccccc]/20 flex-shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-[#8c8c8c] flex-shrink-0" />
            )}

            <span className="text-[13px] text-[#cccccc] group-hover:text-white font-sans font-medium truncate">
              {node.name}
            </span>
            <span className="text-[10px] text-[#666666] font-mono">[{node.code}]</span>
          </div>

          {/* ACCIONES DE EDICIÓN Y CREACIÓN EN HOVER */}
          <div className="flex items-center gap-1 flex-shrink-0 opacity-80 group-hover:opacity-100 transition">
            <button
              type="button"
              onClick={() => setModalAccion({ section_code: node.code, code: '', name: '', description: '' })}
              className="p-1 text-[#8c8c8c] hover:text-[#87a9ff] hover:bg-[#333333] rounded transition cursor-pointer flex items-center gap-1 font-sans text-[11px]"
              title="Agregar Acción a esta sección"
            >
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">+ Acción</span>
            </button>

            <button
              type="button"
              onClick={() => setModalSeccion({
                id: node.id,
                code: node.code,
                name: node.name,
                category: node.category,
                description: node.description || '',
                parent_code: node.parent_code || ''
              })}
              className="p-1 text-[#8c8c8c] hover:text-white hover:bg-[#333333] rounded transition cursor-pointer font-sans text-[11px]"
              title="Editar sección"
            >
              Editar
            </button>

            <button
              type="button"
              onClick={() => eliminarSeccion(node.id, node.name)}
              className="p-1 text-[#8c8c8c] hover:text-red-400 hover:bg-[#333333] rounded transition cursor-pointer font-sans text-[11px]"
              title="Eliminar sección"
            >
              Eliminar
            </button>
          </div>
        </div>

        {/* NODOS HIJOS Y ACCIONES ESPECÍFICAS (CUANDO ESTÁ EXPANDIDO) */}
        {isExpanded && (
          <div className="space-y-0.5">
            {/* SECCIONES HIJAS */}
            {hasChildren && node.children.map((child) => renderSectionNode(child, depth + 1))}

            {/* ACCIONES DENTRO DE LA SECCIÓN (ARCHIVOS HOJAS DEL ÁRBOL) */}
            {hasActions && node.actions.map((act) => (
              <div 
                key={act.id} 
                style={{ paddingLeft: `${(depth + 1) * 18 + 26}px` }}
                className="group py-1 pr-2 hover:bg-[#252525] rounded-[6px] flex items-center justify-between gap-2 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileText className="h-3.5 w-3.5 text-[#87a9ff] flex-shrink-0" />
                  <span className="text-[12px] text-[#a0a0a0] group-hover:text-white font-sans truncate">
                    {act.name}
                  </span>
                  <span className="text-[9px] text-[#666666] font-mono">[{act.code}]</span>
                </div>

                <button
                  type="button"
                  onClick={() => eliminarAccion(act.id, act.name)}
                  className="p-1 text-[#666666] hover:text-red-400 hover:bg-[#333333] rounded transition cursor-pointer"
                  title="Eliminar acción"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Renderizador del Árbol de Secciones y Páginas con Checkboxes para la Selección de Permisos (Estilo Google AI Studio Tree View)
  const renderPermissionTreeNode = (node: SectionNode, depth = 0, parentNode?: SectionNode) => {
    const isChecked = isSectionChecked(node.code);
    const hasChildren = node.children && node.children.length > 0;
    const fullyChecked = hasChildren ? isParentSectionFullyChecked(node) : isChecked;
    const partiallyChecked = hasChildren ? isParentSectionPartiallyChecked(node) : false;
    const isExpanded = expandedSectionCodes[node.code] ?? true;

    return (
      <div key={node.code} className="font-sans select-none space-y-0.5">
        <div 
          style={{ paddingLeft: `${depth * 20 + 4}px` }}
          className="flex items-center gap-2 py-1 px-1.5 rounded-[6px] hover:bg-[#252525] group transition-colors cursor-pointer"
          onClick={() => {
            if (hasChildren) {
              toggleSectionInPermission(node);
            } else {
              toggleSingleSectionCode(node.code, parentNode);
            }
          }}
        >
          {/* Triángulo / Flecha de Colapso / Expansión (a la izquierda del checkbox) */}
          {hasChildren ? (
            <button 
              type="button"
              onClick={(e) => { 
                e.stopPropagation(); 
                toggleExpandSection(node.code); 
              }} 
              className="w-4 h-4 flex items-center justify-center text-[#8c8c8c] hover:text-white transition-colors cursor-pointer flex-shrink-0"
            >
              <span className={`text-[9px] transform transition-transform ${isExpanded ? 'rotate-90 text-[#d4d4d4]' : 'rotate-0 text-[#8c8c8c]'}`}>
                ▶
              </span>
            </button>
          ) : (
            <span className="w-4 flex-shrink-0" />
          )}

          {/* Checkbox con estados: Desmarcado, Marcado (check), e Indeterminado (cuadrado relleno en el centro) */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) {
                toggleSectionInPermission(node);
              } else {
                toggleSingleSectionCode(node.code, parentNode);
              }
            }}
            className={`w-4 h-4 rounded-[3px] border flex items-center justify-center flex-shrink-0 transition cursor-pointer ${
              fullyChecked
                ? 'bg-[#87a9ff] border-[#87a9ff] text-[#121212]'
                : partiallyChecked
                  ? 'bg-[#191919] border-[#87a9ff]'
                  : 'bg-[#191919] border-[#555555] group-hover:border-[#87a9ff]'
            }`}
          >
            {fullyChecked && <Check className="w-3 h-3 text-[#121212] stroke-[3]" />}
            {partiallyChecked && !fullyChecked && (
              <div className="w-2.5 h-2.5 bg-[#87a9ff] rounded-[1.5px]" />
            )}
          </div>

          {/* Etiqueta / Nombre de la Sección o Página */}
          <span 
            className={`text-[13px] font-normal leading-none pl-0.5 transition-colors ${
              fullyChecked 
                ? 'text-white font-medium' 
                : partiallyChecked 
                  ? 'text-[#e0e0e0]' 
                  : 'text-[#a0a0a0] group-hover:text-white'
            }`}
          >
            {node.name}
          </span>
        </div>

        {/* Nodos Hijos (Desplegable) */}
        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {node.children.map((child) => renderPermissionTreeNode(child, depth + 1, node))}
          </div>
        )}
      </div>
    );
  };

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
    target_section?: string;
  }

  // Estados Control de Rangos y Permisos
  const [modoVistaRango, setModoVistaRango] = useState<'lista' | 'formulario'>('lista');
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [appSections, setAppSections] = useState<{ code: string; name: string; category: string; description?: string }[]>([]);
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

  const [modoVistaPermiso, setModoVistaPermiso] = useState<'lista' | 'formulario'>('lista');
  const [modalEliminarPermiso, setModalEliminarPermiso] = useState<PermissionItem | null>(null);
  const [permisoForm, setPermisoForm] = useState<{
    dbId?: number;
    code: string;
    name: string;
    category: string;
    description: string;
    target_section: string;
    selectedSectionCodes: string[];
  }>({
    code: '',
    name: '',
    category: 'Gestión de Contenido',
    description: '',
    target_section: '',
    selectedSectionCodes: []
  });

  const abrirFormularioPermiso = (modo: 'crear' | 'editar', permiso?: PermissionItem) => {
    const rawTarget = permiso?.target_section || '';
    const parsedSections = rawTarget
      ? rawTarget.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
      : [];

    if (modo === 'editar' && permiso) {
      setPermisoForm({
        dbId: permiso.id,
        code: permiso.code,
        name: permiso.name,
        category: permiso.category || 'Gestión de Contenido',
        description: permiso.description || '',
        target_section: permiso.target_section || '',
        selectedSectionCodes: parsedSections
      });
    } else {
      setPermisoForm({
        code: '',
        name: '',
        category: 'Gestión de Contenido',
        description: '',
        target_section: '',
        selectedSectionCodes: []
      });
    }
    setModoVistaPermiso('formulario');
  };

  // Helper recursivo para obtener todos los códigos de un nodo de sección y sus descendientes
  const getAllChildSectionCodes = (node: SectionNode): string[] => {
    let codes = [node.code.toLowerCase()];
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        codes = codes.concat(getAllChildSectionCodes(child));
      }
    }
    return codes;
  };

  const isSectionChecked = (code: string) => {
    return (permisoForm.selectedSectionCodes || []).includes(code.toLowerCase());
  };

  const isParentSectionFullyChecked = (node: SectionNode): boolean => {
    const allCodes = getAllChildSectionCodes(node);
    const current = (permisoForm.selectedSectionCodes || []).map(c => c.toLowerCase());
    return allCodes.every(c => current.includes(c));
  };

  const isParentSectionPartiallyChecked = (node: SectionNode): boolean => {
    const allCodes = getAllChildSectionCodes(node);
    const current = (permisoForm.selectedSectionCodes || []).map(c => c.toLowerCase());
    const someChecked = allCodes.some(c => current.includes(c));
    return someChecked && !isParentSectionFullyChecked(node);
  };

  const toggleSectionInPermission = (node: SectionNode) => {
    const allCodes = getAllChildSectionCodes(node);
    const fullyChecked = isParentSectionFullyChecked(node);

    setPermisoForm(prev => {
      const current = (prev.selectedSectionCodes || []).map(c => c.toLowerCase());
      let next: string[];
      if (fullyChecked) {
        // Deseleccionar el padre y todos sus hijos
        next = current.filter(c => !allCodes.includes(c));
      } else {
        // Seleccionar el padre y todos sus hijos automáticamente
        next = Array.from(new Set([...current, ...allCodes]));
      }
      return {
        ...prev,
        selectedSectionCodes: next,
        target_section: next.join(',')
      };
    });
  };

  const toggleSingleSectionCode = (code: string, parentNode?: SectionNode) => {
    const cleanCode = code.toLowerCase();
    setPermisoForm(prev => {
      const current = (prev.selectedSectionCodes || []).map(c => c.toLowerCase());
      const exists = current.includes(cleanCode);
      let next = exists ? current.filter(c => c !== cleanCode) : [...current, cleanCode];

      // Sincronizar estado del nodo padre si corresponde
      if (parentNode) {
        const parentClean = parentNode.code.toLowerCase();
        const childCodes = (parentNode.children || []).map(c => c.code.toLowerCase());
        const allChildrenChecked = childCodes.length > 0 && childCodes.every(c => next.includes(c));
        if (allChildrenChecked && !next.includes(parentClean)) {
          next.push(parentClean);
        } else if (!allChildrenChecked && next.includes(parentClean)) {
          next = next.filter(c => c !== parentClean);
        }
      }

      return {
        ...prev,
        selectedSectionCodes: next,
        target_section: next.join(',')
      };
    });
  };

  const guardarPermisoForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permisoForm.name.trim()) {
      toast.error("Ingresa el nombre del permiso.");
      return;
    }
    const codeClean = permisoForm.dbId ? permisoForm.code : permisoForm.name.toLowerCase().trim().replace(/\s+/g, '_');
    const finalTarget = (permisoForm.selectedSectionCodes || []).join(',');

    try {
      if (!permisoForm.dbId) {
        // Crear nuevo permiso
        const res = await fetch(`${getApiUrl()}/root/permissions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            code: codeClean,
            name: permisoForm.name.trim(),
            category: permisoForm.category.trim() || 'Gestión de Contenido',
            description: permisoForm.description.trim(),
            target_section: finalTarget || null
          })
        });
        const data = await res.json();
        if (res.ok) {
          toast.success(`Permiso '${permisoForm.name}' creado exitosamente.`);
          setModoVistaPermiso('lista');
          cargarDatos();
        } else {
          toast.error(data.detail || "Error al crear el permiso.");
        }
      } else {
        // Editar permiso existente
        const res = await fetch(`${getApiUrl()}/root/permissions/${permisoForm.dbId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            code: permisoForm.code,
            name: permisoForm.name.trim(),
            category: permisoForm.category.trim() || 'Gestión de Contenido',
            description: permisoForm.description.trim(),
            target_section: finalTarget || null
          })
        });
        const data = await res.json();
        if (res.ok) {
          toast.success(`Permiso '${permisoForm.name}' actualizado.`);
          setModoVistaPermiso('lista');
          cargarDatos();
        } else {
          toast.error(data.detail || "Error al actualizar el permiso.");
        }
      }
    } catch {
      toast.error("No pudimos conectar con el servidor.");
    }
  };

  const confirmarEliminarPermiso = async () => {
    if (!modalEliminarPermiso) return;
    const { id: permId, name: permName } = modalEliminarPermiso;
    setModalEliminarPermiso(null);
    try {
      const res = await fetch(`${getApiUrl()}/root/permissions/${permId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al eliminar permiso.");
      toast.success(data.mensaje || `Permiso '${permName}' eliminado.`, "Éxito");
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar el permiso.");
    }
  };

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
      let activeIds: number[] = rango.permission_ids ? [...rango.permission_ids] : [];

      if (activeIds.length === 0 && rango.permissions && rango.permissions.length > 0 && allPermissions.length > 0) {
        const pNamesClean = (Array.isArray(rango.permissions) ? rango.permissions : [rango.permissions])
          .flatMap(p => String(p || '').split(','))
          .map(p => p.trim().toLowerCase())
          .filter(Boolean);

        activeIds = allPermissions
          .filter(perm =>
            pNamesClean.some(name =>
              name === perm.name.toLowerCase() ||
              name === perm.code.toLowerCase() ||
              perm.name.toLowerCase().includes(name) ||
              name.includes(perm.name.toLowerCase())
            )
          )
          .map(perm => perm.id);
      }

      setRangoForm({
        dbId: rango.dbId,
        code: rango.code || rango.id,
        name: rango.name,
        label: rango.label || rango.name,
        description: rango.description || '',
        level: rango.level || 10,
        selectedPermissionIds: activeIds
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
    
    const baseFiltros = [
      { id: '', label: 'Todos' },
      ...rangosList.map(r => ({ id: r.code.toLowerCase(), label: r.name }))
    ];

    const unicos = new Map();
    baseFiltros.forEach(item => {
      if (!unicos.has(item.id)) unicos.set(item.id, item);
    });

    return Array.from(unicos.values()).filter(f => f.id === '' || rolesPresentes.has(f.id));
  }, [usersList, searchUser, rangosList]);

  const roleSelectOptions = useMemo(() => {
    if (rangosList && rangosList.length > 0) {
      return rangosList.map(r => ({
        value: r.code,
        label: r.name,
        sublabel: r.label || r.description
      }));
    }
    return [
      { value: 'cliente', label: 'CLIENTE', sublabel: 'Usuario comprador' },
      { value: 'admin', label: 'ADMIN', sublabel: 'Administrador CMS' },
      { value: 'root', label: 'ROOT', sublabel: 'SuperAdmin Programador' }
    ];
  }, [rangosList]);

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
        const [resUsers, resRoles] = await Promise.all([
          fetch(`${getApiUrl()}/root/users?limit=200`, { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(`${getApiUrl()}/root/roles`, { headers: { "Authorization": `Bearer ${token}` } })
        ]);
        const dataUsers = await resUsers.json();
        const dataRoles = await resRoles.json();
        if (resUsers.ok) setUsersList(dataUsers.users || []);
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
      } else if (activeConsoleTab === 'roles' || activeConsoleTab === 'permissions') {
        const [resRoles, resPerms, resSecs, resTree] = await Promise.all([
          fetch(`${getApiUrl()}/root/roles`, { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(`${getApiUrl()}/root/permissions`, { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(`${getApiUrl()}/root/app-sections`, { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(`${getApiUrl()}/root/sections-tree`, { headers: { "Authorization": `Bearer ${token}` } })
        ]);
        const dataRoles = await resRoles.json();
        const dataPerms = await resPerms.json();
        const dataSecs = await resSecs.json();
        const dataTree = await resTree.json();

        if (resPerms.ok && dataPerms.permissions) {
          setAllPermissions(dataPerms.permissions);
        }

        if (resSecs.ok && dataSecs.sections) {
          setAppSections(dataSecs.sections);
        }

        if (resTree.ok && dataTree.tree) {
          setSectionsTree(dataTree.tree);
          setFlatSections(dataTree.raw_sections || []);
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
      } else if (activeConsoleTab === 'sections') {
        const resTree = await fetch(`${getApiUrl()}/root/sections-tree`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const dataTree = await resTree.json();
        if (resTree.ok && dataTree.tree) {
          setSectionsTree(dataTree.tree);
          setFlatSections(dataTree.raw_sections || []);
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
    if (usuario && usuario.id === userId) {
      toast.warning("No podés modificar el rango de tu propia cuenta ROOT activa.");
      return;
    }
    try {
      const res = await fetch(`${getApiUrl()}/root/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: nuevoRol })
      });
      if (res.status === 401) {
        toast.warning("Tu sesión de administrador ha expirado. Inicia sesión nuevamente.");
        window.dispatchEvent(new Event("vamaar:unauthorized"));
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al modificar rol.");
      toast.success(data.mensaje || data.message || "¡Rol actualizado!", "Éxito");
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || "Error al cambiar rol.");
    }
  };

  // Verificación dinámica de acceso a secciones y páginas según los permisos asignados
  const tienePermisoTab = (tab: string): boolean => {
    if (esRoot) return true;
    if (!usuario) return false;

    const userPerms = usuario.permissions || [];
    if (userPerms.includes('full_access')) return true;

    // Obtener los permisos del rol actual
    const rolesMatching = rangosList.find(r => r.code.toLowerCase() === usuario.role?.toLowerCase());
    const rolePermIds = rolesMatching?.permission_ids || [];

    const activePerms = allPermissions.filter(p => 
      rolePermIds.includes(p.id) || userPerms.includes(p.code.toLowerCase())
    );

    // Revisar si algún permiso tiene en target_section este tab o su categoría
    for (const p of activePerms) {
      if (!p.target_section) continue;
      const allowedSections = p.target_section.split(',').map(s => s.trim().toLowerCase());
      if (allowedSections.includes(tab.toLowerCase())) return true;
      
      // Herencia de grupo
      if (['appearance', 'campanas', 'secciones', 'banners'].includes(tab) && (allowedSections.includes('cms') || allowedSections.includes('gestion_de_contenido'))) return true;
      if (['dashboard', 'moderation'].includes(tab) && (allowedSections.includes('admin_section') || allowedSections.includes('admin'))) return true;
      if (['users', 'roles', 'permissions', 'sections', 'sessions', 'logs'].includes(tab) && allowedSections.includes('system')) return true;
    }

    // Default para rol admin mientras no existan restricciones explícitas
    if (usuario.role?.toLowerCase() === 'admin') {
      if (['dashboard', 'moderation', 'appearance', 'campanas', 'secciones', 'banners'].includes(tab)) {
        const hasExplicitRestrictions = activePerms.some(p => p.target_section && p.target_section.trim().length > 0);
        if (!hasExplicitRestrictions) return true;
      }
    }

    return false;
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
    <div className="flex flex-col h-full justify-between text-[14px] leading-[21px] font-medium select-none bg-[#191919] p-4 overflow-hidden">
      {/* BRANDING CABECERA SIDEBAR */}
      <div className="flex items-center justify-between pb-2 flex-shrink-0">
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

      {/* ÁREA DE ÍTEMS DE NAVEGACIÓN DESPLAZABLE */}
      <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-1 my-2">

        {/* NAVEGACIÓN - GRUPO 1: SECCIÓN ADMINISTRADOR */}
        <div className="space-y-1 font-sans">
          <p className="px-2 text-[11px] font-semibold text-[#8c8c8c] uppercase tracking-wider mb-1.5 font-sans">
            SECCIÓN ADMINISTRADOR
          </p>
          <button
            onClick={() => { setActiveConsoleTab('dashboard'); setMenuMovilAbierto(false); }}
            className={`w-full flex items-center gap-2.5 px-3 h-[36px] rounded-[12px] text-[14px] font-medium transition-colors text-left cursor-pointer font-sans ${
              activeConsoleTab === 'dashboard' 
                ? 'bg-[#2a2a2a] text-[#ffffff]' 
                : 'text-[#8c8c8c] hover:bg-[#252525] hover:text-[#d4d4d4]'
            }`}
          >
            <LayoutDashboard className="h-4 w-4 text-current flex-shrink-0" />
            <span>Panel de Control</span>
          </button>
          <button
            onClick={() => { setActiveConsoleTab('moderation'); setMenuMovilAbierto(false); }}
            className={`w-full flex items-center gap-2.5 px-3 h-[36px] rounded-[12px] text-[14px] font-medium transition-colors text-left cursor-pointer font-sans ${
              activeConsoleTab === 'moderation' 
                ? 'bg-[#2a2a2a] text-[#ffffff]' 
                : 'text-[#8c8c8c] hover:bg-[#252525] hover:text-[#d4d4d4]'
            }`}
          >
            <ShieldAlert className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <span>Productos en Revisión</span>
          </button>
        </div>

        {/* NAVEGACIÓN - GRUPO 2: GESTIÓN DE CONTENIDO */}
        <div className="space-y-1 font-sans">
          <p className="px-2 text-[11px] font-semibold text-[#8c8c8c] uppercase tracking-wider mb-1.5 font-sans">
            GESTIÓN DE CONTENIDO
          </p>
          <button
            onClick={() => { setActiveConsoleTab('appearance'); setMenuMovilAbierto(false); }}
            className={`w-full flex items-center gap-2.5 px-3 h-[36px] rounded-[12px] text-[14px] font-medium transition-colors text-left cursor-pointer font-sans ${
              activeConsoleTab === 'appearance' 
                ? 'bg-[#2a2a2a] text-[#ffffff]' 
                : 'text-[#8c8c8c] hover:bg-[#252525] hover:text-[#d4d4d4]'
            }`}
          >
            <Palette className="h-4 w-4 text-current flex-shrink-0" />
            <span>Apariencia Web</span>
          </button>
          <button
            onClick={() => { setActiveConsoleTab('campanas'); setMenuMovilAbierto(false); }}
            className={`w-full flex items-center gap-2.5 px-3 h-[36px] rounded-[12px] text-[14px] font-medium transition-colors text-left cursor-pointer font-sans ${
              activeConsoleTab === 'campanas' 
                ? 'bg-[#2a2a2a] text-[#ffffff]' 
                : 'text-[#8c8c8c] hover:bg-[#252525] hover:text-[#d4d4d4]'
            }`}
          >
            <Calendar className="h-4 w-4 text-current flex-shrink-0" />
            <span>Campañas y Eventos</span>
          </button>
          <button
            onClick={() => { setActiveConsoleTab('secciones'); setMenuMovilAbierto(false); }}
            className={`w-full flex items-center gap-2.5 px-3 h-[36px] rounded-[12px] text-[14px] font-medium transition-colors text-left cursor-pointer font-sans ${
              activeConsoleTab === 'secciones' 
                ? 'bg-[#2a2a2a] text-[#ffffff]' 
                : 'text-[#8c8c8c] hover:bg-[#252525] hover:text-[#d4d4d4]'
            }`}
          >
            <Sliders className="h-4 w-4 text-current flex-shrink-0" />
            <span>Personalización</span>
          </button>
          <button
            onClick={() => { setActiveConsoleTab('banners'); setMenuMovilAbierto(false); }}
            className={`w-full flex items-center gap-2.5 px-3 h-[36px] rounded-[12px] text-[14px] font-medium transition-colors text-left cursor-pointer font-sans ${
              activeConsoleTab === 'banners' 
                ? 'bg-[#2a2a2a] text-[#ffffff]' 
                : 'text-[#8c8c8c] hover:bg-[#252525] hover:text-[#d4d4d4]'
            }`}
          >
            <ImageIcon className="h-4 w-4 text-current flex-shrink-0" />
            <span>Banners de Inicio</span>
          </button>
        </div>

        {/* NAVEGACIÓN - GRUPO 3: PROGRAMADOR */}
        <div className="space-y-1 font-sans">
          <p className="px-2 text-[11px] font-semibold text-[#8c8c8c] uppercase tracking-wider mb-1.5 font-sans">
            PROGRAMADOR
          </p>
          <button
            onClick={() => { setActiveConsoleTab('users'); setMenuMovilAbierto(false); }}
            className={`w-full flex items-center gap-2.5 px-3 h-[36px] rounded-[12px] text-[14px] font-medium transition-colors text-left cursor-pointer font-sans ${
              activeConsoleTab === 'users' 
                ? 'bg-[#2a2a2a] text-[#ffffff]' 
                : 'text-[#8c8c8c] hover:bg-[#252525] hover:text-[#d4d4d4]'
            }`}
          >
            <Users className="h-4 w-4 text-current flex-shrink-0" />
            <span>Control de Usuarios</span>
          </button>

          {/* ACORDEÓN / ÁRBOL DE SEGURIDAD Y ACCESOS */}
          <div className="pt-1 font-sans">
            <button
              onClick={() => setSeguridadMenuAbierto(!seguridadMenuAbierto)}
              className="w-full flex items-center justify-between px-3 h-[36px] rounded-[12px] text-[14px] font-medium text-[#d4d4d4] hover:bg-[#252525] transition-colors cursor-pointer font-sans"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-[#87a9ff] flex-shrink-0" />
                <span>Seguridad y Accesos</span>
              </div>
              {seguridadMenuAbierto ? <ChevronDown className="h-3.5 w-3.5 text-[#8c8c8c]" /> : <ChevronRight className="h-3.5 w-3.5 text-[#8c8c8c]" />}
            </button>

            {seguridadMenuAbierto && (
              <div className="pl-3.5 mt-1 space-y-1 border-l border-[#262626] ml-4 font-sans">
                <button
                  onClick={() => { setActiveConsoleTab('roles'); setMenuMovilAbierto(false); }}
                  className={`w-full flex items-center gap-2 px-2.5 h-[32px] rounded-[8px] text-[13px] font-medium transition-colors text-left cursor-pointer font-sans ${
                    activeConsoleTab === 'roles' 
                      ? 'bg-[#2a2a2a] text-[#87a9ff]' 
                      : 'text-[#8c8c8c] hover:bg-[#252525] hover:text-[#d4d4d4]'
                  }`}
                >
                  <Sliders className="h-3.5 w-3.5 text-current flex-shrink-0" />
                  <span>Control de Rangos</span>
                </button>

                <button
                  onClick={() => { setActiveConsoleTab('permissions'); setMenuMovilAbierto(false); }}
                  className={`w-full flex items-center gap-2 px-2.5 h-[32px] rounded-[8px] text-[13px] font-medium transition-colors text-left cursor-pointer font-sans ${
                    activeConsoleTab === 'permissions' 
                      ? 'bg-[#2a2a2a] text-[#87a9ff]' 
                      : 'text-[#8c8c8c] hover:bg-[#252525] hover:text-[#d4d4d4]'
                  }`}
                >
                  <Key className="h-3.5 w-3.5 text-current flex-shrink-0" />
                  <span>Control de Permisos</span>
                </button>

                <button
                  onClick={() => { setActiveConsoleTab('sections'); setMenuMovilAbierto(false); }}
                  className={`w-full flex items-center gap-2 px-2.5 h-[32px] rounded-[8px] text-[13px] font-medium transition-colors text-left cursor-pointer font-sans ${
                    activeConsoleTab === 'sections' 
                      ? 'bg-[#2a2a2a] text-[#87a9ff]' 
                      : 'text-[#8c8c8c] hover:bg-[#252525] hover:text-[#d4d4d4]'
                  }`}
                >
                  <FolderTree className="h-3.5 w-3.5 text-current flex-shrink-0" />
                  <span>Secciones y Acciones</span>
                </button>
              </div>
            )}
          </div>

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
      className="h-full w-full bg-[#191919] text-[#d4d4d4] flex flex-col lg:flex-row border-none relative overflow-hidden"
    >
      
      {/* 1. SIDEBAR ESCRITORIO (Google AI Studio Theme) */}
      <aside 
        style={{
          width: sidebarOculto ? '0px' : '256px',
          opacity: sidebarOculto ? 0 : 1,
          transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        className="hidden lg:block bg-[#191919] border-r border-[#262626] flex-shrink-0 h-full overflow-hidden"
      >
        <div className="w-64 h-full flex flex-col">
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
      <main className="flex-1 flex flex-col min-w-0 h-full bg-[#191919] text-[14px] leading-[20px] font-normal overflow-hidden">
        
        {/* BARRA SUPERIOR DE ENCABEZADO */}
        <header className="p-3 sm:px-6 sm:py-4 border-b border-[#262626] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-4 bg-[#191919] flex-shrink-0">
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
              {activeConsoleTab === 'dashboard' && "Panel de Control"}
              {activeConsoleTab === 'moderation' && "Productos en Revisión"}
              {activeConsoleTab === 'appearance' && "Apariencia Web"}
              {activeConsoleTab === 'campanas' && "Campañas y Eventos"}
              {activeConsoleTab === 'secciones' && "Personalización de Secciones"}
              {activeConsoleTab === 'banners' && "Banners de Inicio"}
              {activeConsoleTab === 'users' && "Control de Usuarios"}
              {activeConsoleTab === 'roles' && (
                modoVistaRango === 'formulario'
                  ? (rangoForm.dbId ? `Editar Rango: ${rangoForm.name}` : "Crear Nuevo Rango")
                  : "Control de Rangos"
              )}
              {activeConsoleTab === 'permissions' && (
                modoVistaPermiso === 'formulario'
                  ? (permisoForm.dbId ? `Editar Permiso: ${permisoForm.name}` : "Crear Nuevo Permiso")
                  : "Control de Permisos"
              )}
              {activeConsoleTab === 'sections' && "Control de Secciones y Acciones"}
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
          <div className="px-3 sm:px-6 py-2 border-b border-[#262626] flex flex-row justify-between items-center gap-2.5 bg-[#1f1f1f]">
            {modoVistaRango === 'lista' ? (
              <button
                onClick={() => abrirFormularioRango('crear')}
                className="px-2.5 sm:px-3 h-[28px] sm:h-[32px] bg-[#252525] border border-[#333333] text-[#d4d4d4] rounded-[10px] sm:rounded-[12px] text-[11px] sm:text-[13px] font-medium hover:bg-[#323232] hover:text-white transition cursor-pointer whitespace-nowrap font-sans"
              >
                Nuevo Rango
              </button>
            ) : (
              <div className="flex items-center justify-between w-full gap-2">
                <button
                  type="button"
                  onClick={() => setModoVistaRango('lista')}
                  className="px-2.5 sm:px-3 h-[28px] sm:h-[32px] bg-[#252525] border border-[#333333] text-[#d4d4d4] rounded-[10px] sm:rounded-[12px] text-[11px] sm:text-[13px] font-medium hover:bg-[#323232] hover:text-white transition cursor-pointer flex items-center gap-1 whitespace-nowrap font-sans"
                >
                  <ChevronLeft className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Volver al listado de rangos</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModoVistaRango('lista')}
                    className="px-2.5 sm:px-3 h-[28px] sm:h-[32px] bg-[#252525] border border-[#333333] text-[#d4d4d4] rounded-[10px] sm:rounded-[12px] text-[11px] sm:text-[13px] font-medium hover:bg-[#323232] hover:text-white transition cursor-pointer whitespace-nowrap font-sans"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    form="rango-form-element"
                    className="px-3 sm:px-4 h-[28px] sm:h-[32px] bg-[#393f51] border border-[#454d63] text-white rounded-[10px] sm:rounded-[12px] text-[11px] sm:text-[13px] font-medium hover:bg-[#454d63] transition cursor-pointer whitespace-nowrap font-sans shadow-xs"
                  >
                    {rangoForm.dbId ? 'Guardar Cambios' : 'Crear Rango'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BARRA SECUNDARIA DE ACCIONES (Control de Permisos) */}
        {activeConsoleTab === 'permissions' && (
          <div className="px-3 sm:px-6 py-2 border-b border-[#262626] flex flex-row justify-between items-center gap-2.5 bg-[#1f1f1f]">
            {modoVistaPermiso === 'lista' ? (
              <button
                onClick={() => abrirFormularioPermiso('crear')}
                className="px-2.5 sm:px-3 h-[28px] sm:h-[32px] bg-[#252525] border border-[#333333] text-[#d4d4d4] rounded-[10px] sm:rounded-[12px] text-[11px] sm:text-[13px] font-medium hover:bg-[#323232] hover:text-white transition cursor-pointer whitespace-nowrap font-sans"
              >
                Nuevo Permiso
              </button>
            ) : (
              <div className="flex items-center justify-between w-full gap-2">
                <button
                  type="button"
                  onClick={() => setModoVistaPermiso('lista')}
                  className="px-2.5 sm:px-3 h-[28px] sm:h-[32px] bg-[#252525] border border-[#333333] text-[#d4d4d4] rounded-[10px] sm:rounded-[12px] text-[11px] sm:text-[13px] font-medium hover:bg-[#323232] hover:text-white transition cursor-pointer flex items-center gap-1 whitespace-nowrap font-sans"
                >
                  <ChevronLeft className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Volver al listado de permisos</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModoVistaPermiso('lista')}
                    className="px-2.5 sm:px-3 h-[28px] sm:h-[32px] bg-[#252525] border border-[#333333] text-[#d4d4d4] rounded-[10px] sm:rounded-[12px] text-[11px] sm:text-[13px] font-medium hover:bg-[#323232] hover:text-white transition cursor-pointer whitespace-nowrap font-sans"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    form="permiso-form-element"
                    className="px-3 sm:px-4 h-[28px] sm:h-[32px] bg-[#393f51] border border-[#454d63] text-white rounded-[10px] sm:rounded-[12px] text-[11px] sm:text-[13px] font-medium hover:bg-[#454d63] transition cursor-pointer whitespace-nowrap font-sans shadow-xs"
                  >
                    {permisoForm.dbId ? 'Guardar Cambios' : 'Crear Permiso'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BARRA SECUNDARIA DE ACCIONES (Control de Secciones y Acciones) */}
        {activeConsoleTab === 'sections' && (
          <div className="px-3 sm:px-6 py-2 border-b border-[#262626] flex flex-row justify-between items-center gap-2.5 bg-[#1f1f1f] flex-shrink-0">
            <button
              onClick={() => setModalSeccion({ code: '', name: '', category: 'General', description: '', parent_code: '' })}
              className="px-2.5 sm:px-3 h-[28px] sm:h-[32px] bg-[#252525] border border-[#333333] text-[#d4d4d4] rounded-[10px] sm:rounded-[12px] text-[11px] sm:text-[13px] font-medium hover:bg-[#323232] hover:text-white transition cursor-pointer flex items-center gap-1 font-sans"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nueva Sección</span>
            </button>
            <span className="text-xs text-[#8c8c8c] font-sans">Estructura Árbol Jerárquico</span>
          </div>
        )}

        {/* BARRA SECUNDARIA DE FILTROS & PILLS (Solo en Control de Usuarios) */}
        {activeConsoleTab === 'users' && (
          <div className="px-3 sm:px-6 py-2 border-b border-[#262626] flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 bg-[#1f1f1f] flex-shrink-0">
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
                    WebkitTextFillColor: '#ffffff',
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
          <div className="px-3 sm:px-6 py-2 border-b border-[#262626] flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 bg-[#1f1f1f] flex-shrink-0">
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
                    WebkitTextFillColor: '#ffffff',
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
          <div className="px-3 sm:px-6 py-2 border-b border-[#262626] flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 bg-[#1f1f1f] flex-shrink-0">
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
                    WebkitTextFillColor: '#ffffff',
                    backgroundColor: '#191919', 
                    caretColor: '#ffffff' 
                  }}
                  className="w-full pl-8 pr-3 h-[32px] bg-[#191919] border border-[#262626] rounded-[12px] text-white text-[13px] placeholder:text-[#8c8c8c] placeholder:opacity-100 focus:outline-none focus:border-[#87a9ff] transition font-sans caret-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* ÁREA DE CONTENIDO DINÁMICO CON SCROLLBAR FUNCIONAL */}
        <div className="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto bg-[#191919] custom-scrollbar">

          {/* GUARDA DE PERMISO PARA PÁGINAS PROTEGIDAS */}
          {!tienePermisoTab(activeConsoleTab) && (
            <div className="bg-[#1f1f1f] border border-[#262626] rounded-[16px] p-8 text-center space-y-4 max-w-md mx-auto my-12 font-sans shadow-xl animate-fade-in">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl w-fit mx-auto border border-amber-500/20">
                <Lock className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-white">Acceso Restringido por Permiso</h3>
              <p className="text-xs text-[#8c8c8c] leading-relaxed">
                Tu rol o permisos actuales no tienen autorización para acceder a la página de <strong className="text-[#d4d4d4]">{activeConsoleTab}</strong>.
              </p>
              <button
                onClick={() => setActiveConsoleTab('dashboard')}
                className="px-4 py-2 bg-[#252525] border border-[#383838] hover:bg-[#323232] text-[#87a9ff] rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Volver al Panel de Control
              </button>
            </div>
          )}

          {/* ============================================================================== */}
          {/* SECCIÓN ADMINISTRADOR / CMS TABS */}
          {/* ============================================================================== */}
          {tienePermisoTab(activeConsoleTab) && activeConsoleTab === 'dashboard' && (
            <div className="bg-[#1f1f1f] border border-[#262626] rounded-[12px] p-4 text-[#d4d4d4]">
              <DashboardTab 
                msgAsignar={msgAsignar || null}
                emailAsignar={emailAsignar || ""}
                setEmailAsignar={setEmailAsignar || (() => {})}
                rolAsignar={rolAsignar || "admin"}
                setRolAsignar={setRolAsignar || (() => {})}
                cargandoAsignar={cargandoAsignar || false}
                handleAsignarRango={handleAsignarRango || (() => {})}
                adminDashboardData={adminDashboardData || null}
                cargandoDashboard={cargandoDashboard || false}
              />
            </div>
          )}

          {tienePermisoTab(activeConsoleTab) && activeConsoleTab === 'moderation' && (
            <div className="bg-[#1f1f1f] border border-[#262626] rounded-[12px] p-4 text-[#d4d4d4]">
              <ModerationTab token={token || ""} />
            </div>
          )}

          {tienePermisoTab(activeConsoleTab) && activeConsoleTab === 'appearance' && (
            <div className="bg-[#1f1f1f] border border-[#262626] rounded-[12px] p-4 text-[#d4d4d4]">
              <AppearanceTab 
                tieneCambiosMarca={tieneCambiosMarca || false}
                setTieneCambiosMarca={setTieneCambiosMarca || (() => {})}
                handlePublicarMarca={handlePublicarMarca || (() => {})}
                brandName={brandName || "Vamaar"}
                setBrandName={setBrandName || (() => {})}
                brandFontFamily={brandFontFamily || "Outfit"}
                setBrandFontFamily={setBrandFontFamily || (() => {})}
                brandFontSize={brandFontSize || "1.5rem"}
                setBrandFontSize={setBrandFontSize || (() => {})}
                logoHistory={logoHistory || []}
                setLogoHistory={setLogoHistory || (() => {})}
                logoUrl={logoUrl || ""}
                setLogoUrl={setLogoUrl || (() => {})}
                logoPreviaUrl={logoPreviaUrl || null}
                setLogoPreviaUrl={setLogoPreviaUrl || (() => {})}
                zoomLogo={zoomLogo || 1}
                setZoomLogo={setZoomLogo || (() => {})}
                rotateLogo={rotateLogo || 0}
                setRotateLogo={setRotateLogo || (() => {})}
                offsetX={offsetX || 0}
                setOffsetX={setOffsetX || (() => {})}
                offsetY={offsetY || 0}
                setOffsetY={setOffsetY || (() => {})}
                removerFondoBlanco={removerFondoBlanco || false}
                setRemoverFondoBlanco={setRemoverFondoBlanco || (() => {})}
                toleranciaTransparencia={toleranciaTransparencia || 30}
                setToleranciaTransparencia={setToleranciaTransparencia || (() => {})}
                colorPrimary={colorPrimary || "#2C3E50"}
                setColorPrimary={setColorPrimary || (() => {})}
                colorSecondary={colorSecondary || "#D4AF37"}
                setColorSecondary={setColorSecondary || (() => {})}
                colorBackground={colorBackground || "#FAFAFA"}
                setColorBackground={setColorBackground || (() => {})}
                colorNavbar={colorNavbar || "#FFFFFF"}
                setColorNavbar={setColorNavbar || (() => {})}
                colorSectionTitle={colorSectionTitle || "#111827"}
                setColorSectionTitle={setColorSectionTitle || (() => {})}
                colorCatalogLink={colorCatalogLink || "#3B82F6"}
                setColorCatalogLink={setColorCatalogLink || (() => {})}
                colorTextInput={colorTextInput || "#111827"}
                setColorTextInput={setColorTextInput || (() => {})}
                handleEliminarLogoHistorial={handleEliminarLogoHistorial || (() => {})}
                apiUrl={getApiUrl()}
              />
            </div>
          )}

          {tienePermisoTab(activeConsoleTab) && activeConsoleTab === 'campanas' && (
            <div className="bg-[#1f1f1f] border border-[#262626] rounded-[12px] p-4 text-[#d4d4d4]">
              <CampaignsTab apiUrl={getApiUrl()} token={token} />
            </div>
          )}

          {tienePermisoTab(activeConsoleTab) && activeConsoleTab === 'secciones' && (
            <div className="bg-[#1f1f1f] border border-[#262626] rounded-[12px] p-4 text-[#d4d4d4]">
              <CustomizationsTab 
                tieneCambiosSecciones={tieneCambiosSecciones || false}
                handlePublicarSecciones={handlePublicarSecciones || (() => {})}
                nuevoSeccionTitulo={nuevoSeccionTitulo || ""}
                setNuevoSeccionTitulo={setNuevoSeccionTitulo || (() => {})}
                nuevoSeccionCategoria={nuevoSeccionCategoria || "Todos"}
                setNuevoSeccionCategoria={setNuevoSeccionCategoria || (() => {})}
                handleAgregarSeccion={handleAgregarSeccion || (() => {})}
                seccionesList={seccionesList || []}
                setSeccionesList={setSeccionesList || (() => {})}
                setTieneCambiosSecciones={setTieneCambiosSecciones || (() => {})}
                handleEliminarSeccion={handleEliminarSeccion || (() => {})}
              />
            </div>
          )}

          {tienePermisoTab(activeConsoleTab) && activeConsoleTab === 'banners' && (
            <div className="bg-[#1f1f1f] border border-[#262626] rounded-[12px] p-4 text-[#d4d4d4]">
              <BannersTab 
                tieneCambiosBanners={tieneCambiosBanners || false}
                handlePublicarBanners={handlePublicarBanners || (() => {})}
                subiendoBanner={subiendoBanner || false}
                nuevoBannerTitulo={nuevoBannerTitulo || ""}
                setNuevoBannerTitulo={setNuevoBannerTitulo || (() => {})}
                nuevoBannerSubtitulo={nuevoBannerSubtitulo || ""}
                setNuevoBannerSubtitulo={setNuevoBannerSubtitulo || (() => {})}
                nuevoBannerLink={nuevoBannerLink || "/catalog"}
                setNuevoBannerLink={setNuevoBannerLink || (() => {})}
                nuevoBannerLinkPersonalizado={nuevoBannerLinkPersonalizado || ""}
                setNuevoBannerLinkPersonalizado={setNuevoBannerLinkPersonalizado || (() => {})}
                nuevoBannerArchivo={nuevoBannerArchivo || null}
                setNuevoBannerArchivo={setNuevoBannerArchivo || (() => {})}
                nuevoBannerArchivoMovil={nuevoBannerArchivoMovil || null}
                setNuevoBannerArchivoMovil={setNuevoBannerArchivoMovil || (() => {})}
                handleAgregarBorradorBanner={handleAgregarBorradorBanner || (() => {})}
                bannerList={bannerList || []}
                setBannerList={setBannerList || (() => {})}
                setTieneCambiosBanners={setTieneCambiosBanners || (() => {})}
                showToast={showToast || (() => {})}
                token={token}
                apiUrl={getApiUrl()}
              />
            </div>
          )}

          {/* ============================================================================== */}
          {/* TAB 1: CONTROL DE USUARIOS */}
          {/* ============================================================================== */}
          {tienePermisoTab(activeConsoleTab) && activeConsoleTab === 'users' && (
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
                          options={roleSelectOptions}
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
          {tienePermisoTab(activeConsoleTab) && activeConsoleTab === 'roles' && (
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
                            {(Array.isArray(r.permissions) ? r.permissions : [r.permissions])
                              .flatMap(p => String(p || '').split(','))
                              .map(p => p.trim())
                              .filter(Boolean)
                              .map((permText, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded-[6px] bg-[#252525] text-[#d4d4d4] border border-[#333333] text-[11px] font-sans whitespace-nowrap">
                                  {permText}
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

                  <form id="rango-form-element" onSubmit={guardarRangoForm} className="space-y-4 text-xs font-sans">
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
                              className={`p-3 rounded-[10px] border transition cursor-pointer flex items-center gap-2.5 font-sans select-none ${
                                isChecked
                                  ? 'bg-[#87a9ff]/10 border-[#87a9ff]/50 text-white shadow-xs'
                                  : 'bg-[#191919] border-[#262626] text-[#8c8c8c] hover:bg-[#222222] hover:border-[#383838]'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-[4px] border flex items-center justify-center flex-shrink-0 transition-all ${
                                  isChecked
                                    ? 'bg-[#87a9ff] border-[#87a9ff] text-[#121212] shadow-xs'
                                    : 'bg-[#252525] border-[#383838] hover:border-[#555555]'
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3 text-[#121212] stroke-[3]" />}
                              </div>

                              <div className="min-w-0">
                                <p className={`text-xs font-medium ${isChecked ? 'text-white' : 'text-[#d4d4d4]'}`}>{perm.name}</p>
                                <p className="text-[11px] text-[#8c8c8c] truncate">{perm.description || perm.category}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ============================================================================== */}
          {/* TAB 1.3: CONTROL DE PERMISOS */}
          {/* ============================================================================== */}
          {tienePermisoTab(activeConsoleTab) && activeConsoleTab === 'permissions' && (
            <div className="space-y-4">
              {modoVistaPermiso === 'lista' ? (
                <div className="bg-[#1f1f1f] border border-[#262626] rounded-[12px] p-4 sm:p-5 space-y-4 font-sans">
                  <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                    <h2 className="text-sm font-bold text-[#87a9ff] uppercase tracking-wider">Catálogo de Permisos Registrados ({allPermissions.length})</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {allPermissions.map((perm) => {
                      const esBase = ["full_access", "manage_roles", "manage_users", "view_audit_logs", "manage_sessions"].includes(perm.code.toLowerCase());
                      return (
                        <div key={perm.id} className="p-3.5 bg-[#191919] border border-[#262626] rounded-[10px] space-y-2 font-sans flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2 py-0.5 rounded-[6px] bg-[#252525] text-[#87a9ff] border border-[#333333] text-[10px] font-medium uppercase tracking-wider">
                                {perm.category || "Sistema"}
                              </span>
                              <span className="text-[10px] text-[#666666] font-mono">{perm.code}</span>
                            </div>
                            <h3 className="text-xs font-bold text-white pt-1">{perm.name}</h3>
                            <p className="text-[11px] text-[#8c8c8c] leading-tight">{perm.description || "Sin descripción asignada."}</p>
                          </div>

                          <div className="pt-2 border-t border-[#262626] flex items-center justify-end gap-2">
                            <button
                              onClick={() => abrirFormularioPermiso('editar', perm)}
                              className="px-2.5 h-[26px] bg-[#252525] border border-[#333333] text-[#d4d4d4] hover:bg-[#323232] hover:text-white rounded-[6px] text-[11px] font-medium transition cursor-pointer font-sans"
                            >
                              Editar
                            </button>
                            <button
                              disabled={esBase}
                              onClick={() => setModalEliminarPermiso(perm)}
                              className="px-2.5 h-[26px] bg-[#252525] border border-[#333333] text-[#d4d4d4] hover:bg-[#323232] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-[6px] text-[11px] font-medium transition cursor-pointer font-sans"
                              title={esBase ? "Permiso base del sistema no eliminable" : "Eliminar permiso"}
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* FORMULARIO CREAR / EDITAR PERMISO */
                <div className="bg-[#1f1f1f] border border-[#262626] rounded-[12px] p-4 sm:p-6 space-y-5 font-sans">
                  <form id="permiso-form-element" onSubmit={guardarPermisoForm} className="space-y-4 text-xs font-sans">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#8c8c8c] mb-1 font-medium">Nombre del Permiso</label>
                        <input
                          type="text"
                          required
                          value={permisoForm.name}
                          onChange={(e) => setPermisoForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Ej: Gestionar Banners"
                          style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', backgroundColor: '#191919', caretColor: '#ffffff' }}
                          className="w-full px-3 h-[36px] bg-[#191919] border border-[#262626] rounded-[8px] text-white text-xs focus:outline-none focus:border-[#87a9ff] font-sans caret-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[#8c8c8c] mb-1 font-medium">Categoría (Ej: CMS, Sistema, Operaciones)</label>
                        <input
                          type="text"
                          value={permisoForm.category}
                          onChange={(e) => setPermisoForm(f => ({ ...f, category: e.target.value }))}
                          placeholder="Ej: CMS"
                          style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', backgroundColor: '#191919', caretColor: '#ffffff' }}
                          className="w-full px-3 h-[36px] bg-[#191919] border border-[#262626] rounded-[8px] text-white text-xs focus:outline-none focus:border-[#87a9ff] font-sans caret-white"
                        />
                      </div>
                    </div>

                    {/* ÁRBOL JERÁRQUICO INTERACTIVO PARA SELECCIONAR ACCESO A PÁGINAS Y SECCIONES */}
                    <div className="space-y-2 border border-[#2b2b2b] rounded-[12px] p-4 bg-[#18181a]">
                      <div className="flex items-center justify-between pb-2.5 border-b border-[#2b2b2b]">
                        <div className="flex items-center gap-2">
                          <FolderTree className="h-4 w-4 text-[#87a9ff]" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Páginas y Secciones Autorizadas
                          </span>
                        </div>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#252525] border border-[#383838] text-[#87a9ff] font-medium">
                          {(permisoForm.selectedSectionCodes || []).length} seleccionada(s)
                        </span>
                      </div>

                      <p className="text-[11px] text-[#8c8c8c]">
                        Al marcar un grupo principal (ej: <strong>Gestión de Contenido</strong>), se seleccionan automáticamente todas sus páginas interiores (Apariencia Web, Campañas y Eventos, Personalización, Banners de Inicio).
                      </p>

                      <div className="space-y-1 pt-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                        {sectionsTree.length === 0 ? (
                          <div className="py-6 text-center text-xs text-[#8c8c8c]">Cargando estructura de páginas...</div>
                        ) : (
                          sectionsTree.map((rootNode) => renderPermissionTreeNode(rootNode))
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#8c8c8c] mb-1 font-medium">Descripción Explicativa</label>
                      <textarea
                        rows={2}
                        value={permisoForm.description}
                        onChange={(e) => setPermisoForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Explicación detallada de la función que habilita este permiso..."
                        style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', backgroundColor: '#191919', caretColor: '#ffffff' }}
                        className="w-full p-2.5 bg-[#191919] border border-[#262626] rounded-[8px] text-white text-xs focus:outline-none focus:border-[#87a9ff] font-sans caret-white"
                      />
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ============================================================================== */}
          {/* TAB 1.4: CONTROL DE SECCIONES Y ACCIONES (VISTA EN ÁRBOL JERÁRQUICO / TREE VIEW) */}
          {/* ============================================================================== */}
          {tienePermisoTab(activeConsoleTab) && activeConsoleTab === 'sections' && (
            <div className="bg-[#1f1f1f] border border-[#262626] rounded-[12px] p-4 sm:p-5 space-y-4 font-sans">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <div>
                  <h2 className="text-sm font-bold text-[#87a9ff] uppercase tracking-wider flex items-center gap-2">
                    <FolderTree className="h-4 w-4 text-[#87a9ff]" />
                    <span>Estructura Árbol de Secciones y Acciones</span>
                  </h2>
                  <p className="text-[11px] text-[#8c8c8c] mt-0.5">
                    Configuración jerárquica de la plataforma y acciones específicas por sección (ej: Comprar vs Vender).
                  </p>
                </div>
              </div>

              {/* LISTADO DE NODOS EN ÁRBOL */}
              <div className="space-y-3">
                {sectionsTree.length === 0 ? (
                  <p className="text-xs text-[#8c8c8c] text-center py-8 font-sans">Cargando árbol de secciones...</p>
                ) : (
                  sectionsTree.map((rootNode) => renderSectionNode(rootNode))
                )}
              </div>
            </div>
          )}

          {/* ============================================================================== */}
          {/* TAB 2: MONITOR DE SESIONES */}
          {/* ============================================================================== */}
          {tienePermisoTab(activeConsoleTab) && activeConsoleTab === 'sessions' && (
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
          {tienePermisoTab(activeConsoleTab) && activeConsoleTab === 'logs' && (
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

      {/* MODAL ELIMINAR PERMISO */}
      {modalEliminarPermiso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-sans">
          <div className="bg-[#1f1f1f] border border-[#262626] rounded-[16px] p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-red-400" />
                <span>Confirmar Eliminación de Permiso</span>
              </h3>
              <button onClick={() => setModalEliminarPermiso(null)} className="text-[#8c8c8c] hover:text-white transition cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-[#d4d4d4] leading-relaxed">
              ¿Estás seguro de que deseas eliminar el permiso <span className="font-bold text-white">{modalEliminarPermiso.name}</span>? Se desvinculará automáticamente de todos los rangos activos.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262626]">
              <button
                onClick={() => setModalEliminarPermiso(null)}
                className="px-3.5 h-[32px] bg-[#252525] border border-[#333333] text-[#d4d4d4] hover:bg-[#323232] rounded-[8px] text-xs font-medium transition cursor-pointer font-sans"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminarPermiso}
                className="px-4 h-[32px] bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600/30 rounded-[8px] text-xs font-medium transition cursor-pointer font-sans"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR SECCIÓN */}
      {modalSeccion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-sans">
          <div className="bg-[#1f1f1f] border border-[#262626] rounded-[16px] p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderTree className="h-4.5 w-4.5 text-[#87a9ff]" />
                <span>{modalSeccion.id ? 'Editar Sección' : 'Nueva Sección en Árbol'}</span>
              </h3>
              <button onClick={() => setModalSeccion(null)} className="text-[#8c8c8c] hover:text-white transition cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={guardarSeccion} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#8c8c8c] mb-1 font-medium">Nombre de la Sección</label>
                <input
                  type="text"
                  required
                  value={modalSeccion.name}
                  onChange={(e) => setModalSeccion(s => s ? ({ ...s, name: e.target.value }) : null)}
                  placeholder="Ej: Mis Ventas"
                  style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', backgroundColor: '#191919', caretColor: '#ffffff' }}
                  className="w-full px-3 h-[36px] bg-[#191919] border border-[#262626] rounded-[8px] text-white text-xs focus:outline-none focus:border-[#87a9ff] font-sans caret-white"
                />
              </div>

              <div>
                <label className="block text-[#8c8c8c] mb-1 font-medium">Sección Padre (Jerarquía en Árbol)</label>
                <select
                  value={modalSeccion.parent_code}
                  onChange={(e) => setModalSeccion(s => s ? ({ ...s, parent_code: e.target.value }) : null)}
                  style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', backgroundColor: '#191919', caretColor: '#ffffff' }}
                  className="w-full px-3 h-[36px] bg-[#191919] border border-[#262626] rounded-[8px] text-white text-xs focus:outline-none focus:border-[#87a9ff] font-sans cursor-pointer"
                >
                  <option value="">-- Nodo Raíz Principal (Sin Padre) --</option>
                  {flatSections
                    .filter(s => !modalSeccion.id || s.id !== modalSeccion.id)
                    .map((s) => (
                      <option key={s.code} value={s.code} className="bg-[#191919] text-white">
                        {s.name} ({s.category}) - [{s.code}]
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8c8c8c] mb-1 font-medium">Categoría</label>
                  <input
                    type="text"
                    value={modalSeccion.category}
                    onChange={(e) => setModalSeccion(s => s ? ({ ...s, category: e.target.value }) : null)}
                    placeholder="Ej: Operaciones"
                    style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', backgroundColor: '#191919', caretColor: '#ffffff' }}
                    className="w-full px-3 h-[36px] bg-[#191919] border border-[#262626] rounded-[8px] text-white text-xs focus:outline-none focus:border-[#87a9ff] font-sans caret-white"
                  />
                </div>

                <div>
                  <label className="block text-[#8c8c8c] mb-1 font-medium">Código Interno</label>
                  <input
                    type="text"
                    disabled={Boolean(modalSeccion.id)}
                    value={modalSeccion.code || (modalSeccion.name ? modalSeccion.name.toLowerCase().replace(/\s+/g, '_') : '')}
                    onChange={(e) => setModalSeccion(s => s ? ({ ...s, code: e.target.value }) : null)}
                    placeholder="Auto-generado..."
                    style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', backgroundColor: '#191919', caretColor: '#ffffff' }}
                    className="w-full px-3 h-[36px] bg-[#191919] border border-[#262626] rounded-[8px] text-white text-xs focus:outline-none focus:border-[#87a9ff] font-sans caret-white disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#8c8c8c] mb-1 font-medium">Descripción Explicativa</label>
                <textarea
                  rows={2}
                  value={modalSeccion.description}
                  onChange={(e) => setModalSeccion(s => s ? ({ ...s, description: e.target.value }) : null)}
                  placeholder="Finalidad de esta sección..."
                  style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', backgroundColor: '#191919', caretColor: '#ffffff' }}
                  className="w-full p-2.5 bg-[#191919] border border-[#262626] rounded-[8px] text-white text-xs focus:outline-none focus:border-[#87a9ff] font-sans caret-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setModalSeccion(null)}
                  className="px-3.5 h-[32px] bg-[#252525] border border-[#333333] text-[#d4d4d4] hover:bg-[#323232] rounded-[8px] text-xs font-medium transition cursor-pointer font-sans"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 h-[32px] bg-[#393f51] border border-[#454d63] text-white rounded-[8px] text-xs font-medium hover:bg-[#454d63] transition cursor-pointer font-sans"
                >
                  {modalSeccion.id ? 'Guardar Cambios' : 'Crear Sección'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR ACCIÓN */}
      {modalAccion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-sans">
          <div className="bg-[#1f1f1f] border border-[#262626] rounded-[16px] p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="h-4.5 w-4.5 text-amber-400" />
                <span>Nueva Acción ({modalAccion.section_code})</span>
              </h3>
              <button onClick={() => setModalAccion(null)} className="text-[#8c8c8c] hover:text-white transition cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={guardarAccion} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#8c8c8c] mb-1 font-medium">Nombre de la Acción (Ej: Vender Artículos)</label>
                <input
                  type="text"
                  required
                  value={modalAccion.name}
                  onChange={(e) => setModalAccion(a => a ? ({ ...a, name: e.target.value }) : null)}
                  placeholder="Ej: Publicar y Vender C2C"
                  style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', backgroundColor: '#191919', caretColor: '#ffffff' }}
                  className="w-full px-3 h-[36px] bg-[#191919] border border-[#262626] rounded-[8px] text-white text-xs focus:outline-none focus:border-[#87a9ff] font-sans caret-white"
                />
              </div>

              <div>
                <label className="block text-[#8c8c8c] mb-1 font-medium">Descripción</label>
                <textarea
                  rows={2}
                  value={modalAccion.description}
                  onChange={(e) => setModalAccion(a => a ? ({ ...a, description: e.target.value }) : null)}
                  placeholder="Permite al usuario vender artículos..."
                  style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', backgroundColor: '#191919', caretColor: '#ffffff' }}
                  className="w-full p-2.5 bg-[#191919] border border-[#262626] rounded-[8px] text-white text-xs focus:outline-none focus:border-[#87a9ff] font-sans caret-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setModalAccion(null)}
                  className="px-3.5 h-[32px] bg-[#252525] border border-[#333333] text-[#d4d4d4] hover:bg-[#323232] rounded-[8px] text-xs font-medium transition cursor-pointer font-sans"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 h-[32px] bg-amber-600/30 border border-amber-500/50 text-amber-300 rounded-[8px] text-xs font-medium hover:bg-amber-600/40 transition cursor-pointer font-sans"
                >
                  Crear Acción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
