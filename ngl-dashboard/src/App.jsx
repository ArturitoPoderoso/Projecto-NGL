import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { timeAgo } from './utils/timeAgo';
import UnfvLogo from './components/UnfvLogo';
import UnfvBuilding from './components/UnfvBuilding';
import { 
  Lock, 
  MessageSquare, 
  Copy, 
  Check, 
  Trash2, 
  Search, 
  Star,
  Sparkles,
  Share2,
  X,
  Instagram,
  Clock,
  KeyRound,
  AlertCircle
} from 'lucide-react';

const ICON_FORMATS = ['/icono.png', '/icono.jpg', '/icono.jpeg', '/icono.webp', '/icono.svg'];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('ngl_admin_auth') === 'true');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [verifyingPin, setVerifyingPin] = useState(false);

  // Estados de imágenes personalizadas
  const [escudoError, setEscudoError] = useState(false);
  const [facultadError, setFacultadError] = useState(false);
  const [iconFormatIdx, setIconFormatIdx] = useState(0);
  const [iconFailedAll, setIconFailedAll] = useState(false);

  // Datos de mensajes
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'favorites'
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ngl_favorites') || '[]');
    } catch {
      return [];
    }
  });

  // UI States
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [newestMessageId, setNewestMessageId] = useState(null);
  const [storyModalMessage, setStoryModalMessage] = useState(null);
  const [copiedStory, setCopiedStory] = useState(false);

  const audioContextRef = useRef(null);

  // Sonido de notificación Web Audio API
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn('Audio contextual bloqueado');
    }
  };

  const handleIconError = () => {
    if (iconFormatIdx < ICON_FORMATS.length - 1) {
      setIconFormatIdx((prev) => prev + 1);
    } else {
      setIconFailedAll(true);
    }
  };

  // 1. Desbloqueo del Dashboard exclusivamente mediante Supabase RPC (100% en Base de Datos)
  const handleUnlock = async (e) => {
    if (e) e.preventDefault();
    const cleanPass = pinInput.trim();
    if (!cleanPass) return;

    setVerifyingPin(true);
    setPinError(false);

    try {
      // Verificación directa y segura en la base de datos de Supabase
      // La contraseña NUNCA está en el código del frontend
      const { data, error } = await supabase.rpc('verificar_pin', { pin_ingresado: cleanPass });
      
      if (error) {
        console.error('Error al consultar verificar_pin en Supabase:', error);
        setPinError(true);
        return;
      }

      if (data === true) {
        setIsAuthenticated(true);
        sessionStorage.setItem('ngl_admin_auth', 'true');
        setPinError(false);
        setPinInput('');
      } else {
        setPinError(true);
      }
    } catch (err) {
      console.error('Error de conexión con Supabase:', err);
      setPinError(true);
    } finally {
      setVerifyingPin(false);
    }
  };

  const handleLock = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('ngl_admin_auth');
  };

  // 2. Cargar Mensajes de Supabase (Solo últimas 24 horas y limpieza automática)
  const fetchMensajes = async () => {
    setLoading(true);
    try {
      const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Limpieza en segundo plano de cualquier confesión expirada (> 24h) para no ocupar espacio
      supabase
        .from('mensajes')
        .delete()
        .lt('fecha_creacion', hace24Horas)
        .then(() => {})
        .catch(() => {});

      const { data, error } = await supabase
        .from('mensajes')
        .select('*')
        .gte('fecha_creacion', hace24Horas)
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      setMensajes(data || []);
    } catch (err) {
      console.error('Error cargando mensajes:', err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Supabase Realtime
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchMensajes();

    const channel = supabase
      .channel('public:mensajes:dashboard')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensajes' },
        (payload) => {
          setMensajes((prev) => [payload.new, ...prev]);
          setNewestMessageId(payload.new.id);
          playNotificationSound();
          setTimeout(() => setNewestMessageId(null), 5000);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'mensajes' },
        (payload) => {
          setMensajes((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .subscribe((status) => {
        setIsRealtimeActive(status === 'SUBSCRIBED');
      });

    // Polling de respaldo cada 4 segundos para garantizar recepción continua
    const pollInterval = setInterval(() => {
      fetchMensajes();
    }, 4000);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  // Toggle Favorito
  const toggleFavorite = (id) => {
    const updated = favorites.includes(id) 
      ? favorites.filter(favId => favId !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem('ngl_favorites', JSON.stringify(updated));
  };

  // Copiar Texto
  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Eliminar Mensaje
  const handleDeleteMessage = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta confesión de forma permanente?')) return;
    try {
      const { error } = await supabase
        .from('mensajes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setMensajes((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Error eliminando mensaje:', err);
      alert('No se pudo eliminar el mensaje.');
    }
  };

  // Filtrado
  const mensajesFiltrados = mensajes.filter((m) => {
    return !searchQuery.trim() || m.contenido?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // ========================================================
  // 1. PANTALLA DE BLOQUEO (CONTRASEÑA EN SUPABASE)
  // ========================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-[100dvh] w-full unfv-bg flex flex-col justify-between items-center px-4 py-4 sm:py-6 text-white relative overflow-y-auto select-none">
        
        {/* Decoraciones en esquinas (suaves en móvil para evitar sobrecarga) */}
        {!facultadError ? (
          <img 
            src="/facultad.png" 
            alt="Facultad UNFV" 
            onError={() => setFacultadError(true)}
            className="pointer-events-none z-0 fixed left-[-8px] bottom-1 sm:left-4 sm:bottom-2 md:left-8 md:bottom-4 w-28 sm:w-44 md:w-60 h-auto object-contain opacity-25 sm:opacity-90 transition-all select-none hidden xs:block" 
          />
        ) : (
          <UnfvBuilding className="pointer-events-none fixed left-[-10px] bottom-1 sm:left-4 sm:bottom-2 md:left-8 md:bottom-4 w-28 h-24 sm:w-40 sm:h-36 md:w-60 md:h-52 z-0 opacity-25 sm:opacity-90 transition-all hidden xs:block" />
        )}

        <div className="pointer-events-none z-0 fixed right-3 bottom-3 sm:right-6 sm:bottom-4 md:right-10 md:bottom-6 rotate-[-8deg] text-right opacity-25 sm:opacity-90 hidden xs:block">
          <span className="font-handwriting text-xl sm:text-3xl md:text-4xl font-bold text-[#f55f15] tracking-wide block drop-shadow-md leading-tight">
            Orgullo<br />Villarealino
          </span>
          <svg className="w-20 sm:w-28 md:w-36 h-3 sm:h-4 text-[#f55f15] mt-[-4px] ml-auto" viewBox="0 0 100 12" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
            <path d="M 5 6 Q 50 12 95 4" />
          </svg>
        </div>

        {/* Cabecera Lock */}
        <header className="w-full max-w-[420px] flex items-center justify-between z-10 pt-1 pb-3">
          {!escudoError ? (
            <img 
              src="/escudo.png" 
              alt="Escudo UNFV" 
              onError={() => setEscudoError(true)}
              className="h-12 sm:h-16 w-auto max-w-[170px] sm:max-w-[210px] object-contain drop-shadow-md select-none" 
            />
          ) : (
            <UnfvLogo />
          )}
          <div className="rotate-[-8deg]">
            <span className="font-handwriting text-2xl sm:text-3xl font-bold text-[#f55f15] tracking-wide block leading-tight text-right">
              Bandeja<br />Privada
            </span>
          </div>
        </header>

        {/* Tarjeta de Acceso con Contraseña Verificada en Base de Datos */}
        <main className="w-full max-w-[380px] my-auto py-3 z-10 animate-fade-in">
          <div className="bg-[#261e1b] border border-white/10 rounded-[28px] sm:rounded-[30px] p-5 sm:p-7 shadow-2xl shadow-black/90 text-center">
            
            {/* Avatar del usuario con borde naranja */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-[#110e0c] border-2 border-[#f55f15] p-0.5 flex items-center justify-center mb-4 shadow-lg overflow-hidden">
              {!iconFailedAll ? (
                <img 
                  src={ICON_FORMATS[iconFormatIdx]} 
                  alt="Icono" 
                  onError={handleIconError}
                  className="w-full h-full object-cover rounded-full" 
                />
              ) : (
                <span className="text-3xl">🤫</span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              @urracavillarrealina
            </h2>
            <p className="text-xs text-slate-400 mt-1 mb-5 sm:mb-6 flex items-center justify-center gap-1.5 font-medium">
              <Lock className="w-3.5 h-3.5 text-[#f55f15]" />
              <span>Bandeja Secreta de Confesiones UNFV</span>
            </p>

            {/* Input de Contraseña */}
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="relative">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="Escribe la contraseña..."
                  className={`w-full text-center tracking-wider text-base font-sans bg-black/60 border rounded-2xl py-3.5 px-4 text-white placeholder-slate-500 outline-none transition-all ${
                    pinError 
                      ? 'border-red-500 ring-2 ring-red-500/20' 
                      : 'border-white/15 focus:border-[#f55f15] focus:ring-2 focus:ring-[#f55f15]/30'
                  }`}
                  autoFocus
                />
              </div>

              {pinError && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 font-medium animate-shake">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Contraseña incorrecta. Inténtalo de nuevo.</span>
                </div>
              )}

              {/* Botón de desbloqueo */}
              <button
                type="submit"
                disabled={verifyingPin || !pinInput.trim()}
                className={`w-full py-3.5 px-6 rounded-full font-black text-white text-base transition-all shadow-lg shadow-orange-950/40 flex items-center justify-center gap-2 cursor-pointer ${
                  verifyingPin || !pinInput.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-[#f55f15] hover:bg-[#e04f08] active:scale-[0.98]'
                }`}
              >
                {verifyingPin ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verificando con Supabase...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Desbloquear Bandeja</span>
                  </>
                )}
              </button>
            </form>

            <p className="text-[11px] text-slate-400 mt-5 pt-3 border-t border-white/5 flex items-center justify-center gap-1.5">
              <span>🔒 Verificado en tabla</span>
              <code className="text-[#f55f15] font-mono">configuracion_admin</code>
            </p>
          </div>
        </main>

        <footer className="w-full text-center z-10 text-xs text-slate-500 pb-2">
          UNFV Confesiones • Panel Privado Protegido
        </footer>

        {/* Línea horizontal naranja fija en el borde inferior */}
        <div className="pointer-events-none fixed bottom-0 left-0 right-0 h-[2px] bg-[#f55f15] opacity-80 z-20" />
      </div>
    );
  }

  // ========================================================
  // 2. DASHBOARD PRINCIPAL (OPTIMIZADO 100% PARA CELULAR Y PC)
  // ========================================================
  return (
    <div className="min-h-[100dvh] w-full unfv-bg text-white flex flex-col justify-between relative overflow-x-hidden">
      
      {/* Elementos ambientales de esquinas (solo en tablet/PC para no obstruir celular) */}
      {!facultadError ? (
        <img 
          src="/facultad.png" 
          alt="Facultad UNFV" 
          onError={() => setFacultadError(true)}
          className="pointer-events-none z-0 fixed left-[-8px] bottom-1 sm:left-4 sm:bottom-2 md:left-8 md:bottom-4 w-28 sm:w-44 md:w-60 h-auto object-contain opacity-20 sm:opacity-50 md:opacity-75 transition-all select-none hidden sm:block" 
        />
      ) : (
        <UnfvBuilding className="pointer-events-none fixed left-[-10px] bottom-1 sm:left-4 sm:bottom-2 md:left-8 md:bottom-4 w-28 h-24 sm:w-40 sm:h-36 md:w-60 md:h-52 z-0 opacity-20 sm:opacity-50 md:opacity-75 transition-all hidden sm:block" />
      )}

      <div className="pointer-events-none z-0 fixed right-3 bottom-3 sm:right-6 sm:bottom-4 md:right-10 md:bottom-6 rotate-[-8deg] text-right opacity-20 sm:opacity-50 md:opacity-75 hidden sm:block">
        <span className="font-handwriting text-xl sm:text-3xl md:text-4xl font-bold text-[#f55f15] tracking-wide block drop-shadow-md leading-tight">
          Orgullo<br />Villarealino
        </span>
        <svg className="w-20 sm:w-28 md:w-36 h-3 sm:h-4 text-[#f55f15] mt-[-4px] ml-auto" viewBox="0 0 100 12" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
          <path d="M 5 6 Q 50 12 95 4" />
        </svg>
      </div>

      {/* NAVBAR UNIFICADO CON LOGO UNFV + ESTADO REALTIME COMPACTO */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0e0d0b]/95 border-b border-white/10 px-3.5 sm:px-8 py-2.5 sm:py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo UNFV y Título visible en cel */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {!escudoError ? (
              <img 
                src="/escudo.png" 
                alt="Escudo UNFV" 
                onError={() => setEscudoError(true)}
                className="h-9 sm:h-12 w-auto object-contain drop-shadow-sm select-none flex-shrink-0" 
              />
            ) : (
              <UnfvLogo />
            )}
            
            <div className="pl-2 sm:pl-2.5 border-l border-white/10 flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs sm:text-sm tracking-wide text-white truncate">
                  Bandeja Admin
                </span>
                <span className="bg-[#f55f15]/20 text-[#f55f15] border border-[#f55f15]/30 text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
                  UNFV
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] mt-0.5">
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${isRealtimeActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                <span className={isRealtimeActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 font-medium'}>
                  {isRealtimeActive ? 'En vivo' : 'Desconectado'}
                </span>
              </div>
            </div>
          </div>

          {/* Acciones de la barra */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleLock}
              className="flex items-center gap-1.5 text-xs font-bold bg-[#141210] hover:bg-red-500/20 hover:text-red-300 border border-white/10 hover:border-red-500/30 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-slate-300 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Bloquear panel / Cerrar sesión"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Bloquear</span>
            </button>
          </div>
        </div>
      </header>

      {/* CUERPO DEL DASHBOARD */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3.5 sm:px-8 py-4 sm:py-6 z-10">

        {/* CABECERA DE PERFIL RESPONSIVA */}
        <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pt-1">
          <div className="flex items-center gap-3">
            {/* Avatar del usuario (dimensiones estándar 48px en cel / 56px en PC) */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#110e0c] border-2 border-[#f55f15] p-0.5 flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
              {!iconFailedAll ? (
                <img 
                  src={ICON_FORMATS[iconFormatIdx]} 
                  alt="Icono" 
                  onError={handleIconError}
                  className="w-full h-full object-cover rounded-full" 
                />
              ) : (
                <span className="text-2xl">🤫</span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-lg sm:text-2xl text-white tracking-tight">
                  @urracavillarrealina
                </h2>
                <span className="text-[10px] sm:text-[11px] font-extrabold px-2 sm:px-2.5 py-0.5 rounded-full bg-[#f55f15] text-white shadow-sm">
                  UNFV
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
                Bandeja de confesiones en tiempo real
              </p>
            </div>
          </div>

          {/* Badges de Estado / Conteo (adaptable horizontalmente en cel) */}
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto mt-1 sm:mt-0">
            <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
              <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>Autoborrado 24h</span>
            </div>
            <div className="bg-white/5 border border-white/10 px-3.5 sm:px-4 py-1.5 rounded-full flex items-center gap-2">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Activas</span>
              <span className="text-base sm:text-lg font-black text-white">{mensajes.length}</span>
            </div>
          </div>
        </div>

        {/* BARRA: TODAS Y BUSCADOR (OPTIMIZADO EN MÓVIL) */}
        <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="px-3.5 py-2 rounded-full text-xs sm:text-sm font-extrabold bg-[#f55f15] text-white shadow-md flex items-center gap-2 w-fit">
              <MessageSquare className="w-4 h-4" />
              <span>Todas ({mensajes.length})</span>
            </div>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar en las confesiones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1c1715] border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-[15px] sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#f55f15] focus:ring-1 focus:ring-[#f55f15]"
            />
          </div>
        </div>

        {/* LISTADO DE TARJETAS NGL */}
        {loading && mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-11 h-11 border-4 border-[#f55f15]/20 border-t-[#f55f15] rounded-full animate-spin mb-3.5" />
            <p className="text-xs sm:text-sm text-slate-400">Cargando confesiones de Supabase...</p>
          </div>
        ) : mensajesFiltrados.length === 0 ? (
          <div className="bg-[#261e1b] border border-white/10 rounded-[26px] sm:rounded-[30px] p-6 sm:p-12 text-center max-w-md mx-auto my-6 shadow-xl">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-[#f55f15]/10 border border-[#f55f15]/30 flex items-center justify-center mb-4">
              <span className="text-2xl sm:text-3xl animate-bounce-subtle">🤫</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mb-1">
              {searchQuery ? 'No hay coincidencias' : 'Bandeja a la espera'}
            </h3>
            <p className="text-xs sm:text-xs text-slate-400 leading-relaxed mb-5">
              {searchQuery 
                ? 'Prueba buscando con otra palabra clave.'
                : 'Comparte tu link en Instagram o WhatsApp. En cuanto alguien envíe una confesión, aparecerá aquí como una tarjeta NGL en tiempo real.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-[#f55f15] hover:underline font-bold py-1 px-3 rounded-full bg-[#f55f15]/10"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5">
            {mensajesFiltrados.map((msg) => {
              const isNew = msg.id === newestMessageId;

              return (
                <article
                  key={msg.id}
                  className={`relative flex flex-col justify-between rounded-[22px] sm:rounded-[24px] overflow-hidden shadow-xl border transition-all duration-300 hover:shadow-2xl ${
                    isNew 
                      ? 'border-[#f55f15] ring-2 ring-[#f55f15] animate-slide-down' 
                      : 'border-white/10 hover:border-[#f55f15]/50'
                  }`}
                >
                  {isNew && (
                    <div className="absolute top-2 right-2 z-20 bg-white text-black font-black text-[9px] uppercase px-2 py-0.5 rounded-full shadow-md animate-pulse">
                      ¡Nueva!
                    </div>
                  )}

                  {/* Header de la tarjeta */}
                  <div className="bg-[#f55f15] px-3.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between text-black">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#110e0c] border border-white/20 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {!iconFailedAll ? (
                          <img 
                            src={ICON_FORMATS[iconFormatIdx]} 
                            alt="Urraca" 
                            onError={handleIconError} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="text-xs">🤫</span>
                        )}
                      </div>
                      <span className="font-extrabold text-xs tracking-tight truncate max-w-[140px] xs:max-w-[190px] sm:max-w-none">
                        @urracavillarrealina
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] sm:text-[10.5px] font-bold text-black/80 flex-shrink-0">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span>{timeAgo(msg.fecha_creacion)}</span>
                    </div>
                  </div>

                  {/* Cuerpo con texto de la confesión */}
                  <div className="bg-[#261e1b] p-3.5 sm:p-5 flex-1 flex flex-col justify-between">
                    <p className="text-white text-[15px] sm:text-lg font-bold leading-snug break-words whitespace-pre-wrap select-text mb-3 sm:mb-4">
                      {msg.contenido}
                    </p>

                    <div className="pt-2.5 sm:pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                      <button
                        onClick={() => setStoryModalMessage(msg)}
                        className="flex items-center gap-1.5 font-bold text-xs bg-[#f55f15]/20 hover:bg-[#f55f15] text-[#f55f15] hover:text-white px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-[#f55f15]/30 transition-all cursor-pointer active:scale-95"
                        title="Ver en formato historia de Instagram"
                      >
                        <Instagram className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Historia</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopyText(msg.id, msg.contenido)}
                          className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
                          title="Copiar texto"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 active:scale-90 transition-all cursor-pointer"
                          title="Eliminar confesión"
                        >
                          <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL: FORMATO HISTORIA DE INSTAGRAM (OPTIMIZADO PARA MÓVIL) */}
      {storyModalMessage && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setStoryModalMessage(null);
              setCopiedStory(false);
            }
          }}
          className="fixed inset-0 z-50 backdrop-blur-md bg-black/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
        >
          {/* RECUADRO BLANCO CON SCROLL SEGURO EN CELULAR */}
          <div className="bg-white rounded-[28px] sm:rounded-[36px] p-4 sm:p-7 max-w-sm sm:max-w-md w-full shadow-2xl border border-slate-100 relative my-auto max-h-[92dvh] flex flex-col justify-between overflow-y-auto">
            <button
              onClick={() => {
                setStoryModalMessage(null);
                setCopiedStory(false);
              }}
              className="absolute top-3.5 right-3.5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-90 transition-all cursor-pointer z-10"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-2 sm:mb-3 pt-1">
              <h3 className="font-black text-base sm:text-lg text-slate-900">Sticker para Historia</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Toma captura de pantalla o cópialo</p>
            </div>

            {/* CONTENEDOR DEL STICKER NGL CLÁSICO */}
            <div className="w-full rounded-[24px] sm:rounded-[34px] overflow-hidden shadow-2xl shadow-black/20 bg-white border-2 border-slate-800/40 my-2">
              
              {/* CABECERA CON DEGRADADO NARANJA */}
              <div className="bg-gradient-to-r from-[#f55f15] via-[#ff6a1a] to-[#ea580c] px-3.5 sm:px-6 py-3 sm:py-4 text-white relative flex items-center justify-center gap-2.5 sm:gap-4">
                
                {/* Icono de la Urraca a la izquierda */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 min-w-[40px] sm:min-w-[48px] max-w-[40px] sm:max-w-[48px] rounded-full bg-[#110e0c] border-2 border-white shadow-md overflow-hidden flex items-center justify-center flex-shrink-0">
                  {!iconFailedAll ? (
                    <img 
                      src={ICON_FORMATS[iconFormatIdx]} 
                      alt="Urraca" 
                      onError={handleIconError} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-lg sm:text-xl">🤫</span>
                  )}
                </div>

                {/* Textos del Encabezado NGL */}
                <div className="text-left flex flex-col justify-center">
                  <div className="text-[10px] sm:text-[12px] font-extrabold text-white/95 uppercase tracking-wide leading-tight">
                    Send me anonymous
                  </div>
                  <div className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-1.5 leading-tight drop-shadow-sm">
                    <span>Confessions</span>
                    <span className="text-amber-300 text-sm sm:text-base">😇</span>
                  </div>
                  <div className="mt-0.5 inline-flex items-center gap-1 bg-black/20 backdrop-blur-sm text-white font-bold text-[9.5px] sm:text-[10.5px] px-2 py-0.5 rounded-full border border-white/20 w-fit">
                    <span>@urracavillarrealina</span>
                  </div>
                </div>
              </div>

              {/* CUERPO BLANCO */}
              <div className="bg-white p-4 sm:p-8 min-h-[110px] sm:min-h-[140px] flex items-center justify-center text-center">
                <p className="text-black font-extrabold text-base sm:text-2xl leading-snug break-words whitespace-pre-wrap select-text w-full">
                  {storyModalMessage.contenido}
                </p>
              </div>
            </div>

            {/* Botones de acción dentro del modal en móvil */}
            <div className="mt-3 flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(storyModalMessage.contenido);
                  setCopiedStory(true);
                  setTimeout(() => setCopiedStory(false), 2000);
                }}
                className="flex-1 py-2.5 px-4 rounded-full font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                {copiedStory ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setStoryModalMessage(null);
                  setCopiedStory(false);
                }}
                className="py-2.5 px-4 rounded-full font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="w-full text-center z-10 text-[11px] sm:text-xs text-slate-500 py-3 border-t border-white/5 px-4">
        UNFV Confesiones • Panel de Administración en Tiempo Real
      </footer>

      {/* Línea fija decorativa inferior segura */}
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 h-[2px] bg-[#f55f15] opacity-80 z-20" />
    </div>
  );
}
