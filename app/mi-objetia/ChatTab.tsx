"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { getApiUrl } from '../../lib/config';
import { apiFetch, getToken } from '../../lib/api';
import { formatearTituloProducto } from '../../lib/format';
import { 
  Send, 
  MessageSquare, 
  AlertCircle, 
  ShieldCheck, 
  ArrowLeft, 
  Trash2, 
  Loader2, 
  Search, 
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export interface Mensaje {
  id?: number;
  sender_id: number;
  message: string;
  was_moderated: boolean;
  is_deleted?: boolean;
  timestamp: string;
}

export interface ChatRoomItem {
  id: number;
  product_id: number;
  product_title: string;
  buyer_id: number;
  seller_id: number;
  buyer_name: string;
  seller_name: string;
  created_at: string;
  last_message_time?: string | null;
  unread_count?: number;
}

const parsearFechaMensaje = (fecha: string): Date => {
  if (!fecha) return new Date();
  let normalizada = fecha.trim();
  if (normalizada.includes(' ') && !normalizada.includes('T')) {
    normalizada = normalizada.replace(' ', 'T');
  }
  if (!normalizada.endsWith('Z') && !normalizada.includes('+')) {
    normalizada = `${normalizada}Z`;
  }
  const d = new Date(normalizada);
  return isNaN(d.getTime()) ? new Date(fecha) : d;
};

const formatFechaMensaje = (timestamp?: string | null): string => {
  if (!timestamp) return '';
  const date = parsearFechaMensaje(timestamp);
  const now = new Date();

  const esHoy =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const hora = date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (esHoy) {
    return `Hoy ${hora}`;
  } else {
    const diaMes = date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
    });
    return `${diaMes} ${hora}`;
  }
};

interface ChatTabProps {
  initialRoomId?: string | null;
}

export default function ChatTab({ initialRoomId }: ChatTabProps) {
  const { usuario } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ID de la sala activa (desde props o query param)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(
    () => initialRoomId || searchParams.get('room_id') || null
  );

  const [salas, setSalas] = useState<ChatRoomItem[]>([]);
  const [loadingSalas, setLoadingSalas] = useState(true);
  const [roomDetail, setRoomDetail] = useState<ChatRoomItem | null>(null);

  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [loadingMensajes, setLoadingMensajes] = useState(false);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Estados de conexión en tiempo real
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [conectado, setConectado] = useState(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Modal de confirmación estilizado
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Sincronizar selectedRoomId cuando cambia el query param en la URL
  useEffect(() => {
    const rId = searchParams.get('room_id');
    if (rId && rId !== selectedRoomId) {
      setSelectedRoomId(rId);
    }
  }, [searchParams]);

  // Cargar lista de salas
  const fetchSalas = async () => {
    if (!usuario || !usuario.id) return;
    try {
      const data = await apiFetch<ChatRoomItem[]>(`/chat/rooms/`);
      const items = Array.isArray(data) ? data : [];
      setSalas(items);

      // Si no hay sala seleccionada en móvil ni desktop, pero hay salas disponibles y estamos en pantalla grande
      if (!selectedRoomId && items.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 1024) {
        setSelectedRoomId(items[0].id.toString());
      }
    } catch (err) {
      console.error("Error al cargar salas de chat:", err);
    } finally {
      setLoadingSalas(false);
    }
  };

  useEffect(() => {
    fetchSalas();
  }, [usuario]);

  // Cargar detalle de la sala seleccionada
  useEffect(() => {
    if (!selectedRoomId || !usuario) {
      setRoomDetail(null);
      return;
    }

    const roomInList = salas.find(s => s.id.toString() === selectedRoomId);
    if (roomInList) {
      setRoomDetail(roomInList);
    } else {
      apiFetch<ChatRoomItem>(`/chat/rooms/${selectedRoomId}/`)
        .then(data => setRoomDetail(data))
        .catch(err => console.warn("Error cargando detalle de sala:", err));
    }
  }, [selectedRoomId, salas, usuario]);

  // Cargar historial de mensajes de la sala
  useEffect(() => {
    if (!selectedRoomId || !usuario || !usuario.id) {
      setMensajes([]);
      return;
    }

    setLoadingMensajes(true);
    apiFetch<Mensaje[]>(`/chat/rooms/${selectedRoomId}/messages/`)
      .then(data => {
        setMensajes(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Error al cargar historial:", err))
      .finally(() => setLoadingMensajes(false));
  }, [selectedRoomId, usuario]);

  // Marcar como leídos
  useEffect(() => {
    if (!selectedRoomId || !usuario || !usuario.id) return;
    apiFetch(`/chat/rooms/${selectedRoomId}/read/`, { method: 'POST' })
      .then(() => {
        window.dispatchEvent(new Event('chat_messages_read'));
        // Actualizar contador en la lista de salas local
        setSalas(prev => prev.map(s => s.id.toString() === selectedRoomId ? { ...s, unread_count: 0 } : s));
      })
      .catch(() => {});
  }, [selectedRoomId, usuario, mensajes.length]);

  // Conexión WebSocket en tiempo real + backoff
  useEffect(() => {
    if (!selectedRoomId || !usuario || !usuario.id) {
      setWs(null);
      setConectado(false);
      return;
    }

    let socket: WebSocket | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let reintentos = 0;
    let desmontado = false;

    const conectar = () => {
      const authToken = getToken();
      if (!authToken || desmontado) return;

      const apiURL = getApiUrl();
      const wsProtocol = apiURL.startsWith("https") ? "wss" : "ws";
      const wsHost = apiURL.replace(/^https?:\/\//, "");

      socket = new WebSocket(`${wsProtocol}://${wsHost}/chat/ws/${selectedRoomId}?token=${encodeURIComponent(authToken)}`);

      socket.onopen = () => {
        reintentos = 0;
        setConectado(true);
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          setMensajes((prev) => {
            const exists = prev.some((m) => m.id === msg.id);
            if (exists) {
              return prev.map((m) => m.id === msg.id ? msg : m);
            }
            return [...prev, msg];
          });
        } catch (err) {
          console.error("Error al procesar mensaje:", err);
        }
      };

      socket.onclose = (event) => {
        setConectado(false);
        if (desmontado || event.code === 4001 || event.code === 4003) return;
        reintentos += 1;
        const delay = Math.min(1000 * Math.pow(2, reintentos), 10000);
        timeoutId = setTimeout(conectar, delay);
      };

      socket.onerror = () => {
        setConectado(false);
      };

      setWs(socket);
    };

    conectar();

    return () => {
      desmontado = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (socket) {
        socket.onopen = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.onmessage = null;
        socket.close();
      }
    };
  }, [selectedRoomId, usuario]);

  // Polling de respaldo cada 4s si el WebSocket no está en estado OPEN
  useEffect(() => {
    if (!selectedRoomId || !usuario || !usuario.id || conectado) return;
    const interval = setInterval(async () => {
      try {
        const data = await apiFetch<Mensaje[]>(`/chat/rooms/${selectedRoomId}/messages/`);
        if (Array.isArray(data)) setMensajes(data);
      } catch {}
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedRoomId, usuario, conectado]);

  // Scroll automático SOLO del contenedor interno de mensajes (evita desplazar la página)
  const scrollToBottom = (smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  useEffect(() => {
    if (mensajes.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [mensajes]);

  // Enviar mensaje (híbrido WebSocket con fallback automático por HTTP)
  const handleEnviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    const texto = nuevoMensaje.trim();
    if (!texto || !selectedRoomId) return;

    if (ws && conectado && ws.readyState === WebSocket.OPEN) {
      ws.send(texto);
      setNuevoMensaje('');
    } else {
      setEnviando(true);
      try {
        const msg = await apiFetch<Mensaje>(`/chat/rooms/${selectedRoomId}/messages/`, {
          method: 'POST',
          body: JSON.stringify({ message: texto })
        });
        setMensajes((prev) => {
          const exists = prev.some((m) => m.id === msg.id);
          if (exists) return prev;
          return [...prev, msg];
        });
        setNuevoMensaje('');
      } catch (err: any) {
        toast.error(err.message || "Error al enviar el mensaje.");
      } finally {
        setEnviando(false);
      }
    }
  };

  // Eliminar mensaje
  const handleEliminarMensaje = (messageId: number) => {
    showConfirm(
      "Eliminar mensaje",
      "¿Seguro que querés eliminar este mensaje? Se reemplazará con 'Este mensaje fue eliminado'.",
      async () => {
        try {
          await apiFetch(`/chat/messages/${messageId}/`, { method: 'DELETE' });
          setMensajes(prev => prev.map(m => m.id === messageId ? { ...m, is_deleted: true, message: "Este mensaje fue eliminado" } : m));
        } catch {
          toast.error("No se pudo eliminar el mensaje.");
        }
      }
    );
  };

  // Eliminar sala de conversación
  const handleEliminarSala = () => {
    if (!selectedRoomId) return;
    showConfirm(
      "Eliminar conversación",
      "¿Querés eliminar esta conversación y todo su historial de mensajes?",
      async () => {
        try {
          await apiFetch(`/chat/rooms/${selectedRoomId}/`, { method: 'DELETE' });
          setSalas(prev => prev.filter(s => s.id.toString() !== selectedRoomId));
          setSelectedRoomId(null);
          router.replace("/mi-objetia?tab=chat");
          toast.success("Conversación eliminada.");
        } catch {
          toast.error("No se pudo eliminar la conversación.");
        }
      }
    );
  };

  // Filtrar salas por término de búsqueda
  const salasFiltradas = useMemo(() => {
    if (!filtroBusqueda.trim()) return salas;
    const term = filtroBusqueda.toLowerCase().trim();
    return salas.filter(s => 
      s.product_title.toLowerCase().includes(term) ||
      s.buyer_name.toLowerCase().includes(term) ||
      s.seller_name.toLowerCase().includes(term)
    );
  }, [salas, filtroBusqueda]);

  const esVendedor = roomDetail && usuario ? usuario.id === roomDetail.seller_id : false;
  const nombreOtro = roomDetail && usuario 
    ? (esVendedor ? roomDetail.buyer_name : roomDetail.seller_name).replace(/\s*\(.*?\)\s*/g, '')
    : "Conversación";

  return (
    <div className="bg-white rounded-2xl border border-[#dadce0] shadow-2xs overflow-hidden flex flex-col h-full w-full flex-1 min-h-0 font-sans antialiased">
      <div className="flex flex-1 overflow-hidden h-full">
        
        {/* ==================================================================== */}
        {/* COLUMNA IZQUIERDA: LISTADO DE CONVERSACIONES (ESTILO GOOGLE AI STUDIO) */}
        {/* ==================================================================== */}
        <aside className={`w-full lg:w-80 xl:w-[340px] flex-shrink-0 flex flex-col border-r border-[#dadce0] bg-[#ffffff] h-full ${
          selectedRoomId ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* Cabecera del panel de chats */}
          <div className="p-3.5 border-b border-[#dadce0] space-y-2.5 bg-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#202124] tracking-tight">Conversaciones</h3>
              </div>
              <span className="text-[11px] font-semibold text-[#5f6368] bg-[#f1f3f4] px-2 py-0.5 rounded-full">
                {salas.length}
              </span>
            </div>

            {/* Buscador de conversaciones */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#5f6368] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Buscar por producto o persona..."
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f8f9fa] focus:bg-white border border-[#dadce0] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]/20 rounded-xl text-[#202124] placeholder:text-[#80868b] transition outline-none"
              />
            </div>
          </div>

          {/* Lista scrolleable de conversaciones */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {loadingSalas ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
                <Loader2 className="w-5 h-5 text-[#1a73e8] animate-spin" />
                <span className="text-xs text-[#5f6368]">Cargando mensajes...</span>
              </div>
            ) : salasFiltradas.length === 0 ? (
              <div className="py-16 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-[#f1f3f4] text-[#5f6368] flex items-center justify-center mx-auto mb-2">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-[#202124]">
                  {filtroBusqueda ? "No se encontraron resultados" : "No tenés conversaciones aún"}
                </p>
                <p className="text-[11px] text-[#5f6368] mt-1 leading-snug">
                  {filtroBusqueda 
                    ? "Probá con otra palabra o limpiá el buscador."
                    : "Los chats se inician al consultar o vender un objeto publicado."}
                </p>
              </div>
            ) : (
              salasFiltradas.map((sala) => {
                const esMiVenta = usuario?.id === sala.seller_id;
                const nombreItem = (esMiVenta ? sala.buyer_name : sala.seller_name).replace(/\s*\(.*?\)\s*/g, '');
                const esSeleccionado = selectedRoomId === sala.id.toString();
                const tieneNoLeidos = (sala.unread_count || 0) > 0;

                return (
                  <div
                    key={sala.id}
                    onClick={() => {
                      setSelectedRoomId(sala.id.toString());
                      window.history.pushState(null, '', `/mi-objetia?tab=chat&room_id=${sala.id}`);
                    }}
                    className={`p-3 rounded-xl transition-all cursor-pointer text-left relative border ${
                      esSeleccionado
                        ? "bg-[#e8f0fe] border-[#d2e3fc] shadow-2xs"
                        : tieneNoLeidos
                          ? "bg-[#ffffff] border-[#dadce0] hover:bg-[#f8f9fa] shadow-2xs"
                          : "bg-white border-transparent hover:bg-[#f8f9fa] hover:border-[#dadce0]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${
                          esMiVenta 
                            ? "bg-[#fef7e0] text-[#b06000] border-[#feefc3]" 
                            : "bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc]"
                        }`}>
                          {esMiVenta ? "Venta" : "Compra"}
                        </span>
                        <span className="font-bold text-xs text-[#202124] truncate max-w-[140px]">
                          {nombreItem || "Usuario"}
                        </span>
                      </div>
                      
                      {tieneNoLeidos && (
                        <span className="h-2 w-2 rounded-full bg-[#1a73e8] flex-shrink-0 animate-pulse" />
                      )}
                    </div>

                    <p className={`text-xs truncate ${esSeleccionado || tieneNoLeidos ? "font-semibold text-[#202124]" : "text-[#5f6368]"}`}>
                      {formatearTituloProducto(sala.product_title)}
                    </p>

                    {sala.last_message_time && (
                      <div className="flex items-center justify-end mt-1 text-[10px] text-[#80868b]">
                        <span suppressHydrationWarning className="font-mono">
                          {formatFechaMensaje(sala.last_message_time)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ==================================================================== */}
        {/* COLUMNA DERECHA: CONVERSACIÓN ACTIVA (ESTILO GOOGLE AI STUDIO LIGHT) */}
        {/* ==================================================================== */}
        <main className={`flex-1 flex flex-col bg-[#f8f9fa]/50 h-full overflow-hidden ${
          !selectedRoomId ? 'hidden lg:flex' : 'flex'
        }`}>
          {selectedRoomId && roomDetail ? (
            <>
              {/* Encabezado de la conversación */}
              <div className="h-[60px] min-h-[60px] px-3.5 sm:px-5 border-b border-[#dadce0] bg-white flex items-center justify-between flex-shrink-0 gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* Botón Volver en Móvil */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRoomId(null);
                      window.history.pushState(null, '', `/mi-objetia?tab=chat`);
                    }}
                    className="lg:hidden p-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] rounded-lg transition"
                    title="Volver a la lista de chats"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="w-8 h-8 rounded-full bg-[#e8f0fe] text-[#1a73e8] font-bold text-xs flex items-center justify-center flex-shrink-0 border border-[#d2e3fc]">
                    {nombreOtro.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs sm:text-sm text-[#202124] truncate">
                        {nombreOtro}
                      </h4>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        esVendedor 
                          ? "bg-[#fef7e0] text-[#b06000] border-[#feefc3]" 
                          : "bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc]"
                      }`}>
                        {esVendedor ? "Tu comprador" : "Vendedor"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-[#5f6368] truncate">
                      <span className="truncate">Objeto: <strong>{formatearTituloProducto(roomDetail.product_title)}</strong></span>
                      <Link 
                        href={`/products/${roomDetail.product_id}`}
                        target="_blank"
                        className="inline-flex items-center text-[#1a73e8] hover:underline shrink-0 ml-1"
                        title="Ver publicación del producto"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Acciones de cabecera */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleEliminarSala}
                    className="p-1.5 text-[#5f6368] hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Eliminar conversación"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contenedor de mensajes */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 custom-scrollbar"
              >
                {loadingMensajes ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-5 h-5 text-[#1a73e8] animate-spin" />
                  </div>
                ) : mensajes.length === 0 ? (
                  <div className="text-center py-12 text-[#5f6368] text-xs">
                    Iniciá la conversación escribiendo un mensaje abajo.
                  </div>
                ) : (
                  mensajes.map((msg, idx) => {
                    const esMio = msg.sender_id === usuario?.id;
                    return (
                      <div 
                        key={msg.id || idx}
                        className={`flex flex-col group ${esMio ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-2xl relative shadow-2xs ${
                          esMio 
                            ? 'bg-[#1a73e8] text-white rounded-tr-xs' 
                            : 'bg-white text-[#202124] border border-[#dadce0] rounded-tl-xs'
                        }`}>
                          {msg.is_deleted ? (
                            <span className={`text-xs italic ${esMio ? 'text-white/70' : 'text-[#80868b]'}`}>
                              Este mensaje fue eliminado
                            </span>
                          ) : (
                            <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed select-text">
                              {msg.message}
                            </p>
                          )}

                          {/* Aviso de moderación */}
                          {msg.was_moderated && (
                            <div className={`mt-1.5 pt-1.5 flex items-center gap-1 text-[10px] font-medium border-t ${
                              esMio ? 'border-white/20 text-white/80' : 'border-[#dadce0] text-[#b06000]'
                            }`}>
                              <AlertCircle className="w-3 h-3" />
                              <span>Contenido ajustado según normas de seguridad</span>
                            </div>
                          )}

                          <div className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${
                            esMio ? 'text-white/75' : 'text-[#80868b]'
                          }`}>
                            <span suppressHydrationWarning className="font-mono">
                              {formatFechaMensaje(msg.timestamp)}
                            </span>
                            {esMio && !msg.is_deleted && msg.id && (
                              <button
                                type="button"
                                onClick={() => handleEliminarMensaje(msg.id!)}
                                className="opacity-0 group-hover:opacity-100 hover:text-white transition ml-1 cursor-pointer"
                                title="Eliminar este mensaje"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Barra de entrada de texto */}
              <form onSubmit={handleEnviarMensaje} className="p-2.5 sm:p-3 bg-white border-t border-[#dadce0] flex items-center gap-2 flex-shrink-0">
                <input
                  type="text"
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  placeholder={`Escribir un mensaje para ${nombreOtro}...`}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] placeholder:text-[#80868b] bg-[#f8f9fa] focus:bg-white transition"
                />

                <button
                  type="submit"
                  disabled={!nuevoMensaje.trim() || enviando}
                  className="h-10 px-4 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer flex-shrink-0 active:scale-98"
                >
                  {enviando ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Enviar</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#f8f9fa]">
              <div className="w-16 h-16 rounded-2xl bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center mb-3 shadow-2xs border border-[#d2e3fc]">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-[#202124]">Tus Conversaciones</h4>
              <p className="text-xs text-[#5f6368] mt-1.5 max-w-sm mx-auto leading-relaxed">
                Seleccioná una conversación del panel izquierdo para chatear en tiempo real con compradores o vendedores.
              </p>
            </div>
          )}
        </main>

      </div>

      {/* Modal de confirmación */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-[#dadce0] animate-scale-in">
            <h4 className="text-sm font-bold text-[#202124]">{confirmModal.title}</h4>
            <p className="text-xs text-[#5f6368] mt-2 leading-relaxed">{confirmModal.message}</p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-2 text-xs font-semibold text-[#5f6368] hover:bg-[#f1f3f4] rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition cursor-pointer shadow-xs"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
