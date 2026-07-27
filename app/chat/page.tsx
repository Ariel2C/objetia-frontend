"use client";
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { getApiUrl } from '../../lib/config';
import { apiFetch, getToken } from '../../lib/api';
import { formatearTituloProducto } from '../../lib/format';
import { Send, MessageSquare, AlertCircle, ShieldAlert, Wifi, WifiOff, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Mensaje {
  id?: number;
  sender_id: number;
  message: string;
  was_moderated: boolean;
  is_deleted?: boolean;
  timestamp: string;
}

function ChatContent() {
  const { usuario, token, cargando } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomIdParam = searchParams.get('room_id');

  const [ws, setWs] = useState<WebSocket | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [conectado, setConectado] = useState(false);
  const [errorConexion, setErrorConexion] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Formateador de tiempo relativo al estilo WhatsApp
  const formatRelativeTime = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const now = new Date();
      
      const dCalendar = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const nowCalendar = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const diffTime = nowCalendar.getTime() - dCalendar.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays === 1) {
        return "Ayer";
      } else {
        return `Hace ${diffDays} días`;
      }
    } catch (e) {
      return "";
    }
  };

  interface ChatRoomItem {
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
  const [salas, setSalas] = useState<ChatRoomItem[]>([]);
  const [loadingSalas, setLoadingSalas] = useState(false);
  const [roomDetail, setRoomDetail] = useState<ChatRoomItem | null>(null);

  // Modal de confirmación personalizado estilo WhatsApp
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

  // Redirección si no está autenticado
  useEffect(() => {
    if (!cargando && !usuario) {
      router.push("/auth");
    }
  }, [usuario, cargando]);

  // Cargar detalles de la sala actual
  useEffect(() => {
    if (!roomIdParam || !usuario || !usuario.id) {
      setRoomDetail(null);
      return;
    }
    const cargarDetalleSala = async () => {
      try {
        const data = await apiFetch<ChatRoomItem>(`/chat/rooms/${roomIdParam}/`);
        setRoomDetail(data);
      } catch (err) {
        console.error("Error al cargar detalles de la sala:", err);
      }
    };
    cargarDetalleSala();
  }, [roomIdParam, usuario]);

  // Cargar historial de mensajes de la sala
  useEffect(() => {
    if (!roomIdParam || !usuario || !usuario.id) return;
    const cargarHistorial = async () => {
      try {
        const data = await apiFetch<Mensaje[]>(`/chat/rooms/${roomIdParam}/messages/`);
        setMensajes(data);
      } catch (err) {
        console.error("Error al cargar historial de mensajes:", err);
      }
    };
    cargarHistorial();
  }, [roomIdParam, usuario]);

  // Cargar listado de salas activas del usuario (SIEMPRE se cargan en segundo plano para el Sidebar)
  useEffect(() => {
    if (!usuario || !usuario.id) return;
    const cargarSalas = async () => {
      setLoadingSalas(true);
      try {
        const data = await apiFetch<ChatRoomItem[]>(`/chat/rooms/`);
        setSalas(data);
      } catch (err) {
        console.error("Error al cargar salas de chat:", err);
      } finally {
        setLoadingSalas(false);
      }
    };
    cargarSalas();
  }, [usuario]);

  // Marcar mensajes como leídos al entrar o al recibir nuevos mensajes
  useEffect(() => {
    if (!roomIdParam || !usuario || !usuario.id) return;
    const marcarLeidos = async () => {
      try {
        await apiFetch(`/chat/rooms/${roomIdParam}/read/`, { method: 'POST' });
        window.dispatchEvent(new Event('chat_messages_read'));
      } catch (err) {
        console.error("Error al marcar como leídos:", err);
      }
    };
    marcarLeidos();
  }, [roomIdParam, usuario, mensajes.length]);

  // Conexión WebSocket autenticada por token, con reconexión automática (backoff)
  useEffect(() => {
    if (!roomIdParam || !usuario || !usuario.id) return;

    const roomId = parseInt(roomIdParam);
    if (isNaN(roomId)) return;

    let socket: WebSocket | null = null;
    let reintentos = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let desmontado = false;

    const conectar = () => {
      const authToken = getToken();
      if (!authToken || desmontado) return;

      const apiURL = getApiUrl();
      const wsProtocol = apiURL.startsWith("https") ? "wss" : "ws";
      const wsHost = apiURL.replace(/^https?:\/\//, "");

      // La identidad viaja en el token (query param), no en la URL
      socket = new WebSocket(`${wsProtocol}://${wsHost}/chat/ws/${roomId}?token=${encodeURIComponent(authToken)}`);

      socket.onopen = () => {
        reintentos = 0;
        setConectado(true);
        setErrorConexion(null);
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
          console.error("Error al procesar mensaje WebSocket:", err);
        }
      };

      socket.onclose = (event) => {
        setConectado(false);
        // 4001/4003: rechazo de autenticación/permiso, no reintentar
        if (desmontado || event.code === 4001 || event.code === 4003) {
          if (event.code === 4003) setErrorConexion("No tenés acceso a esta conversación.");
          return;
        }
        // Reconexión con backoff exponencial (máx ~15s)
        reintentos += 1;
        const delay = Math.min(1000 * Math.pow(2, reintentos), 15000);
        setErrorConexion("Conexión perdida. Reintentando...");
        timeoutId = setTimeout(conectar, delay);
      };

      socket.onerror = () => {
        setErrorConexion("Fallo en la comunicación en tiempo real con el servidor de chat.");
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
  }, [roomIdParam, usuario]);

  // Scroll automático
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const enviarMensaje = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ws || !nuevoMensaje.trim() || !conectado) return;

    ws.send(nuevoMensaje.trim());
    setNuevoMensaje('');
  };

  const handleEliminarMensaje = (messageId: number) => {
    if (!usuario || !usuario.id) return;
    showConfirm(
      "Eliminar mensaje", 
      "¿Seguro que querés eliminar este mensaje? Se reemplazará por el texto 'Este mensaje fue eliminado' para todos los participantes.",
      async () => {
        try {
          await apiFetch(`/chat/messages/${messageId}/`, { method: 'DELETE' });
        } catch (err) {
          console.error(err);
          toast.error("No se pudo eliminar el mensaje.");
        }
      }
    );
  };

  const handleEliminarConversacion = (roomId: number) => {
    if (!usuario || !usuario.id) return;
    showConfirm(
      "Eliminar conversación", 
      "¿Seguro que querés eliminar y vaciar esta conversación por completo? Esta acción no se puede deshacer.",
      async () => {
        try {
          await apiFetch(`/chat/rooms/${roomId}/`, { method: 'DELETE' });
          router.push("/chat");
        } catch (err) {
          console.error(err);
          toast.error("No se pudo eliminar la conversación.");
        }
      }
    );
  };

  const handleEliminarConversacionLista = (e: React.MouseEvent, roomId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!usuario || !usuario.id) return;
    showConfirm(
      "Eliminar conversación", 
      "¿Seguro que querés eliminar y vaciar esta conversación?",
      async () => {
        try {
          await apiFetch(`/chat/rooms/${roomId}/`, { method: 'DELETE' });
          setSalas((prev) => prev.filter((s) => s.id !== roomId));
        } catch (err) {
          console.error(err);
          toast.error("No se pudo eliminar la conversación.");
        }
      }
    );
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const nombreOtroRaw = roomDetail && usuario 
    ? (usuario.id === roomDetail.seller_id ? roomDetail.buyer_name : roomDetail.seller_name)
    : `Chat #${roomIdParam}`;

  const nombreOtro = nombreOtroRaw.replace(/\s*\(.*?\)\s*/g, '');
  const subtituloOtro = roomDetail ? `Producto: ${formatearTituloProducto(roomDetail.product_title)}` : "Cargando datos...";

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 lg:py-12 animate-fade-in">
      <div className="h-[calc(100vh-150px)] lg:h-[calc(100vh-180px)] min-h-[500px] bg-[#F3F3F3] flex flex-col lg:flex-row font-sans text-gray-800 antialiased rounded-3xl overflow-hidden shadow-md border border-gray-200/50">
        
        {/* PANEL LATERAL DE CONVERSACIONES: en móvil solo se ve cuando no hay sala abierta */}
        <aside className={`w-full lg:w-80 bg-[#EAEAEA] border-r border-gray-200/60 p-4 lg:p-6 flex-col justify-between flex-shrink-0 select-none h-full ${roomIdParam ? 'hidden lg:flex' : 'flex'}`}>
          <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center gap-2 px-3 pb-2 border-b border-gray-300/50">
              <MessageSquare className="h-4 w-4 text-[#5F6368]" />
              <h2 className="text-[15px] font-semibold text-[#202124] tracking-tight">Conversaciones</h2>
            </div>
            
            <div className="flex-grow overflow-y-auto pr-1 space-y-2.5 scrollbar-thin">
              {loadingSalas ? (
                <div className="flex justify-center py-12">
                  <div className="h-6 w-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : salas.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  No tenés chats activos.
                </div>
              ) : (
                salas.map((sala) => {
                  const esVendedor = usuario?.id === sala.seller_id;
                  const nombreOtroItem = esVendedor ? sala.buyer_name : sala.seller_name;
                  const tieneMensajesNuevos = sala.unread_count !== undefined && sala.unread_count > 0;
                  const esActivo = roomIdParam === sala.id.toString();
                  return (
                    <Link 
                      href={`/chat?room_id=${sala.id}`} 
                      key={sala.id}
                      className={`block p-3.5 rounded-xl transition duration-200 ${
                        esActivo
                          ? 'bg-[#DCDCDC] text-[#202124] border border-gray-300 shadow-sm'
                          : tieneMensajesNuevos 
                            ? 'bg-white border border-gray-100 animate-pulse-shadow font-semibold' 
                            : 'bg-white border border-gray-100 hover:border-[var(--color-primary)] shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-grow min-w-0">
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100 uppercase tracking-wider mb-1.5 inline-block">
                            {esVendedor ? "Venta" : "Compra"}
                          </span>
                          <h4 className="font-bold text-gray-800 text-xs truncate leading-snug">
                            {nombreOtroItem.replace(/\s*\(.*?\)\s*/g, '')}
                          </h4>
                          <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
                            {formatearTituloProducto(sala.product_title)}
                          </p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className="text-[8px] text-gray-400 font-bold bg-gray-50 px-1 py-0.5 rounded border border-gray-100">
                            {formatRelativeTime(sala.last_message_time) || "Sin msgs"}
                          </span>
                          {tieneMensajesNuevos && (
                            <span className="h-2 w-2 bg-[var(--color-secondary, #D4AF37)] rounded-full" />
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* ÁREA DE CONTENIDO (CHAT O PLACEHOLDER): en móvil solo se ve con una sala abierta */}
        <main className={`flex-grow flex-col h-full overflow-hidden bg-[#F3F3F3] ${roomIdParam ? 'flex' : 'hidden lg:flex'}`}>
          {roomIdParam ? (
            <div className="flex-grow flex flex-col h-full bg-[var(--bg-marketplace)] overflow-hidden">
              {/* Cabecera del Chat */}
              <div className="p-4 flex items-center justify-between text-white shadow-sm" style={{ backgroundColor: 'var(--color-primary)' }}>
                <div className="flex items-center gap-3">
                  <Link href="/chat" className="p-2 hover:bg-black/10 rounded-lg text-white transition lg:hidden">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                  <div>
                    <h2 className="font-bold text-white text-sm md:text-base leading-tight">{nombreOtro}</h2>
                    <span className="text-[10px] text-white/80 font-semibold block mt-0.5">{subtituloOtro}</span>
                  </div>
                </div>
                {roomDetail && (
                  <button 
                    onClick={() => handleEliminarConversacion(roomDetail.id)}
                    className="p-2 hover:bg-white/10 rounded-lg text-white transition cursor-pointer"
                    title="Borrar chat"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>

              {errorConexion && (
                <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{errorConexion}</span>
                </div>
              )}

              {/* Caja de Historial */}
              <div className="flex-grow flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/50">
                {mensajes.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <p className="text-xs text-gray-500 font-medium bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                      Iniciando conexión segura en tiempo real... Enviá un mensaje para comenzar.
                    </p>
                  </div>
                ) : (
                  mensajes.map((msg, index) => {
                    const esMio = msg.sender_id === usuario?.id;
                    const estaEliminado = msg.is_deleted || msg.message === "Este mensaje fue eliminado";
                    return (
                      <div 
                        key={msg.id ?? `tmp-${index}`} 
                        className={`flex items-center gap-2 ${esMio ? 'justify-end' : 'justify-start'} group`}
                      >
                        {esMio && msg.id && !msg.was_moderated && !estaEliminado && (
                          <button 
                            onClick={() => handleEliminarMensaje(msg.id!)}
                            className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition shadow-sm cursor-pointer flex-shrink-0"
                            title="Eliminar mensaje"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                        <div 
                          className={`max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-sm border ${
                            msg.was_moderated 
                              ? 'bg-red-50 border-red-200 text-red-700 flex items-start gap-2 rounded-tl-none'
                              : estaEliminado
                                ? 'bg-gray-100 border-gray-200 text-gray-400 italic rounded-2xl'
                                : esMio 
                                  ? 'text-white rounded-tr-none shadow-sm' 
                                  : 'bg-white border-gray-100 text-gray-800 rounded-tl-none shadow-sm'
                          }`}
                          style={esMio && !msg.was_moderated && !estaEliminado ? { 
                            backgroundColor: 'var(--color-primary)', 
                            borderColor: 'var(--color-primary)' 
                          } : {}}
                        >
                          {msg.was_moderated && <ShieldAlert className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />}
                          <div>
                            <p className="leading-relaxed">{msg.message}</p>
                            <span className={`block text-[8px] text-right mt-1.5 font-mono ${esMio ? 'text-white/70' : 'text-gray-400'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={scrollRef} />
              </div>

              {/* Input de Envío */}
              <form onSubmit={enviarMensaje} className="bg-white p-4 flex gap-2 border-t border-gray-200">
                <input
                  type="text"
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  placeholder="Escribí tu mensaje acá..."
                  disabled={!conectado}
                  className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400 transition disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!conectado || !nuevoMensaje.trim()}
                  style={{ backgroundColor: conectado ? 'var(--color-primary)' : '#9CA3AF' }}
                  className="p-3.5 rounded-xl text-white font-bold hover:brightness-105 active:scale-95 transition disabled:opacity-50 cursor-pointer flex items-center justify-center shadow-sm"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-gray-50/50">
              <MessageSquare className="h-12 w-12 text-gray-300 mb-4 animate-bounce" />
              <h3 className="text-base font-bold text-gray-800">Tus Conversaciones</h3>
              <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto">
                Seleccioná una conversación del panel lateral para empezar a chatear o ver el historial de mensajes.
              </p>
            </div>
          )}
        </main>

      </div>

      {/* Modal de Confirmación Estilo WhatsApp */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 animate-scale-in">
            <h3 className="text-base font-black text-gray-900 leading-tight">{confirmModal.title}</h3>
            <p className="text-xs text-gray-500 mt-2.5 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-2.5 justify-end mt-6">
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-700 text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-white text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ChatContent />
      {/* Estilos CSS Inline para Animación Exclusiva de Sombras Pulsantes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulseShadowOnly {
          0%, 100% {
            box-shadow: 0 0 4px rgba(249, 115, 22, 0.08);
          }
          50% {
            box-shadow: 0 0 10px rgba(249, 115, 22, 0.28);
          }
        }
        .animate-pulse-shadow {
          animation: pulseShadowOnly 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}} />
    </Suspense>
  );
}
