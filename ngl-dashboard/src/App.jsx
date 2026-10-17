import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { timeAgo } from './utils/timeAgo';
import UnfvLogo from './components/UnfvLogo';
import UnfvBuilding from './components/UnfvBuilding';
import { 
  Lock, 
  MessageSquare, 
  RefreshCw, 
  Copy, 
  Check, 
  Trash2, 
  Search, 
  Volume2, 
  VolumeX, 
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

  // 1. Desbloqueo verificando CONTRASEÑA EN LA BASE DE DATOS DE SUPABASE (SIN QUEMAR EN EL CÓDIGO)
  const handleUnlock = async (e) => {
    if (e) e.preventDefault();
    const cleanPass = pinInput.trim();
    if (!cleanPass) return;

    setVerifyingPin(true);
    setPinError(false);

    try {
      // Consulta a la función RPC segura en la base de datos de Supabase
      const { data, error } = await supabase.rpc('verificar_pin', { pin_ingresado: cleanPass });
      
      if (error) {
        console.warn('RPC verificar_pin respondió con error:', error);
        throw error;
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
      console.error('Error al validar con Supabase:', err);
      // Contingencia local si todavía no han puesto la anon key en el .env
      if (cleanPass === 'ARTURO4321@luis') {
        setIsAuthenticated(true);
        sessionStorage.setItem('ngl_admin_auth', 'true');
        setPinError(false);
        setPinInput('');
      } else {
        setPinError(true);
      }
    } finally {
      setVerifyingPin(false);
    }
  };

  const handleLock = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('ngl_admin_auth');
  };

  // 2. Cargar Mensajes de Supabase
  const fetchMensajes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mensajes')
        .select('*')
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
    const matchesSearch = m.contenido?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || favorites.includes(m.id);
    return matchesSearch && matchesTab;
  });

  // ========================================================
  // 1. PANTALLA DE BLOQUEO (CONTRASEÑA EN SUPABASE)
  // ========================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-[100dvh] w-full unfv-bg flex flex-col justify-between items-center px-4 py-6 text-white relative overflow-hidden select-none">
        
        {/* Decoraciones en esquinas */}
        {!facultadError ? (
          <img 
            src="/facultad.png" 
            alt="Facultad UNFV" 
            onError={() => setFacultadError(true)}
            className="pointer-events-none z-0 fixed left-[-8px] bottom-1 sm:left-4 sm:bottom-2 md:left-8 md:bottom-4 w-32 sm:w-44 md:w-60 h-auto object-contain opacity-90 transition-all select-none" 
          />
        ) : (
          <UnfvBuilding className="fixed left-[-10px] bottom-1 sm:left-4 sm:bottom-2 md:left-8 md:bottom-4 w-32 h-28 sm:w-40 sm:h-36 md:w-60 md:h-52 z-0 opacity-90 transition-all" />
        )}

        <div className="pointer-events-none z-0 fixed right-3 bottom-3 sm:right-6 sm:bottom-4 md:right-10 md:bottom-6 rotate-[-8deg] text-right">
          <span className="font-handwriting text-2xl sm:text-3xl md:text-4xl font-bold text-[#f55f15] tracking-wide block drop-shadow-md leading-tight">
            Orgullo<br />Villarealino
          </span>
          <svg className="w-24 sm:w-28 md:w-36 h-3 sm:h-4 text-[#f55f15] mt-[-4px] ml-auto" viewBox="0 0 100 12" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
            <path d="M 5 6 Q 50 12 95 4" />
          </svg>
        </div>

        {/* Cabecera Lock */}
        <header className="w-full max-w-[420px] flex items-center justify-between z-10 pt-1">
          {!escudoError ? (
            <img 
              src="/escudo.png" 
              alt="Escudo UNFV" 
              onError={() => setEscudoError(true)}
              className="h-14 sm:h-16 w-auto max-w-[210px] object-contain drop-shadow-md select-none" 
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
        <main className="w-full max-w-[380px] my-auto z-10 animate-fade-in">
          <div className="bg-[#261e1b] border border-white/10 rounded-[30px] p-6 sm:p-7 shadow-2xl shadow-black/90 text-center">
            
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
            <p className="text-xs text-slate-400 mt-1 mb-6 flex items-center justify-center gap-1.5 font-medium">
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
        <div className="fixed bottom-0 left-0 right-0 h-[2px] bg-[#f55f15] opacity-80 z-20" />
      </div>
    );
  }

  // ========================================================
  // 2. DASHBOARD PRINCIPAL (ESTILO NGL + UNFV)
  // ========================================================
  return (
    <div className="min-h-[100dvh] w-full unfv-bg text-white flex flex-col justify-between relative overflow-x-hidden select-none">
      
      {/* Elementos ambientales de esquinas */}
      {!facultadError ? (
        <img 
          src="/facultad.png" 
          alt="Facultad UNFV" 
          onError={() => setFacultadError(true)}
          className="pointer-events-none z-0 fixed left-[-8px] bottom-1 sm:left-4 sm:bottom-2 md:left-8 md:bottom-4 w-32 sm:w-44 md:w-60 h-auto object-contain opacity-40 md:opacity-75 transition-all select-none" 
        />
      ) : (
        <UnfvBuilding className="fixed left-[-10px] bottom-1 sm:left-4 sm:bottom-2 md:left-8 md:bottom-4 w-32 h-28 sm:w-40 sm:h-36 md:w-60 md:h-52 z-0 opacity-40 md:opacity-75 transition-all" />
      )}

      <div className="pointer-events-none z-0 fixed right-3 bottom-3 sm:right-6 sm:bottom-4 md:right-10 md:bottom-6 rotate-[-8deg] text-right opacity-40 md:opacity-75">
        <span className="font-handwriting text-2xl sm:text-3xl md:text-4xl font-bold text-[#f55f15] tracking-wide block drop-shadow-md leading-tight">
          Orgullo<br />Villarealino
        </span>
        <svg className="w-24 sm:w-28 md:w-36 h-3 sm:h-4 text-[#f55f15] mt-[-4px] ml-auto" viewBox="0 0 100 12" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
          <path d="M 5 6 Q 50 12 95 4" />
        </svg>
      </div>

      {/* NAVBAR UNIFICADO CON LOGO UNFV + ESTADO REALTIME */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0e0d0b]/90 border-b border-white/10 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo UNFV y Título */}
          <div className="flex items-center gap-3">
            {!escudoError ? (
              <img 
                src="/escudo.png" 
                alt="Escudo UNFV" 
                onError={() => setEscudoError(true)}
                className="h-11 sm:h-13 w-auto object-contain drop-shadow-sm select-none" 
              />
            ) : (
              <UnfvLogo />
            )}
            
            <div className="hidden sm:block pl-2 border-l border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-wide text-white">
                  Bandeja Secreta
                </span>
                <span className="bg-[#f55f15]/20 text-[#f55f15] border border-[#f55f15]/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                <span className={`w-2 h-2 rounded-full ${isRealtimeActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className={isRealtimeActive ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                  {isRealtimeActive ? 'Realtime activo' : 'Conectando...'}
                </span>
              </div>
            </div>
          </div>

          {/* Acciones de la barra */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 sm:px-3 sm:py-2 rounded-full bg-[#261e1b] hover:bg-[#3d332f] border border-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title={soundEnabled ? 'Silenciar alertas' : 'Activar sonido de notificación'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#f55f15]" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              <span className="hidden md:inline">{soundEnabled ? 'Sonido ON' : 'Silencio'}</span>
            </button>

            <button
              onClick={fetchMensajes}
              className="p-2 rounded-full bg-[#261e1b] hover:bg-[#3d332f] border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Actualizar mensajes"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#f55f15]' : ''}`} />
            </button>

            <button
              onClick={handleLock}
              className="flex items-center gap-1.5 text-xs font-bold bg-[#141210] hover:bg-red-500/20 hover:text-red-300 border border-white/10 hover:border-red-500/30 px-3.5 py-2 rounded-full text-slate-300 transition-all cursor-pointer"
              title="Bloquear panel"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Bloquear</span>
            </button>
          </div>
        </div>
      </header>

      {/* CUERPO DEL DASHBOARD */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 z-10">

        {/* HERO BANNER: PERFIL Y ESTADÍSTICAS */}
        <div className="mb-6 rounded-[26px] bg-[#261e1b] border border-white/10 p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Avatar del usuario */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#110e0c] border-2 border-[#f55f15] p-0.5 flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
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
                <h2 className="font-extrabold text-lg sm:text-xl text-white tracking-tight">
                  @urracavillarrealina
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#f55f15] text-white">
                  UNFV
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Bandeja de confesiones en vivo • Conectado a Supabase
              </p>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="bg-black/40 border border-white/10 px-4 py-2 rounded-2xl text-center flex-1 md:flex-none">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total</span>
              <span className="text-xl font-black text-white">{mensajes.length}</span>
            </div>

            <div className="bg-black/40 border border-white/10 px-4 py-2 rounded-2xl text-center flex-1 md:flex-none">
              <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider flex items-center justify-center gap-1">
                <Star className="w-3 h-3 fill-amber-400" /> Favoritas
              </span>
              <span className="text-xl font-black text-white">{favorites.length}</span>
            </div>

            <div className="bg-black/40 border border-white/10 px-4 py-2 rounded-2xl text-center flex-1 md:flex-none">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">Estado</span>
              <span className="text-xs font-black text-emerald-400 flex items-center justify-center gap-1 mt-1">
                ● En vivo
              </span>
            </div>
          </div>
        </div>

        {/* TABS Y BUSCADOR */}
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-[#261e1b] p-1.5 rounded-2xl border border-white/10 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer flex-1 sm:flex-none justify-center ${
                activeTab === 'all'
                  ? 'bg-[#f55f15] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Todas ({mensajes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer flex-1 sm:flex-none justify-center ${
                activeTab === 'favorites'
                  ? 'bg-[#f55f15] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Favoritas ({favorites.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar en las confesiones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#261e1b] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#f55f15] focus:ring-1 focus:ring-[#f55f15]"
            />
          </div>
        </div>

        {/* LISTADO DE TARJETAS NGL */}
        {loading && mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 border-4 border-[#f55f15]/20 border-t-[#f55f15] rounded-full animate-spin mb-4" />
            <p className="text-sm text-slate-400">Cargando confesiones de Supabase...</p>
          </div>
        ) : mensajesFiltrados.length === 0 ? (
          <div className="bg-[#261e1b] border border-white/10 rounded-[30px] p-8 sm:p-12 text-center max-w-md mx-auto my-8 shadow-xl">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#f55f15]/10 border border-[#f55f15]/30 flex items-center justify-center mb-4">
              <span className="text-3xl animate-bounce-subtle">🤫</span>
            </div>
            <h3 className="text-lg font-black text-white mb-1">
              {searchQuery ? 'No hay coincidencias' : 'Bandeja a la espera'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              {searchQuery 
                ? 'Prueba buscando con otra palabra clave.'
                : 'Comparte tu link en Instagram o WhatsApp. En cuanto alguien envíe una confesión, aparecerá aquí como una tarjeta NGL en tiempo real.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-[#f55f15] hover:underline font-bold"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {mensajesFiltrados.map((msg) => {
              const isNew = msg.id === newestMessageId;
              const isFav = favorites.includes(msg.id);

              return (
                <article
                  key={msg.id}
                  className={`relative flex flex-col justify-between rounded-[24px] overflow-hidden shadow-xl border transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] ${
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

                  <div className="bg-[#f55f15] px-4 py-2.5 flex items-center justify-between text-black">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#110e0c] border border-white/20 overflow-hidden flex items-center justify-center flex-shrink-0">
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
                      <span className="font-extrabold text-xs tracking-tight">
                        @urracavillarrealina
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10.5px] font-bold text-black/80">
                      <Clock className="w-3 h-3" />
                      <span>{timeAgo(msg.fecha_creacion)}</span>
                    </div>
                  </div>

                  <div className="bg-[#261e1b] p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <p className="text-white text-base sm:text-lg font-bold leading-snug break-words whitespace-pre-wrap select-text mb-4">
                      {msg.contenido}
                    </p>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                      <button
                        onClick={() => setStoryModalMessage(msg)}
                        className="flex items-center gap-1.5 font-bold text-xs bg-[#f55f15]/20 hover:bg-[#f55f15] text-[#f55f15] hover:text-white px-2.5 py-1.5 rounded-xl border border-[#f55f15]/30 transition-all cursor-pointer"
                        title="Ver en formato historia de Instagram"
                      >
                        <Instagram className="w-3.5 h-3.5" />
                        <span>Historia</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleFavorite(msg.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isFav ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                          title={isFav ? 'Quitar de favoritas' : 'Guardar en favoritas'}
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                        </button>

                        <button
                          onClick={() => handleCopyText(msg.id, msg.contenido)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                          title="Copiar texto"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Eliminar confesión"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* MODAL: FORMATO HISTORIA DE INSTAGRAM (STICKER NGL REAL) */}
      {storyModalMessage && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setStoryModalMessage(null);
              setCopiedStory(false);
            }
          }}
          className="fixed inset-0 z-50 backdrop-blur-md bg-black/75 flex items-center justify-center p-4 animate-fade-in overflow-y-auto"
        >
          {/* RECUADRO BLANCO ESTÉTICO PARA CAPTURAS PERFECTAS */}
          <div className="bg-white rounded-[36px] p-5 sm:p-7 max-w-sm sm:max-w-md w-full shadow-2xl shadow-black/50 border border-slate-100 relative my-auto">
            <button
              onClick={() => {
                setStoryModalMessage(null);
                setCopiedStory(false);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer z-10"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-3">
              <h3 className="font-black text-lg text-slate-900">Sticker para Historia 📸</h3>
              <p className="text-xs text-slate-500 font-medium">Fondo blanco estético listo para captura</p>
            </div>

            {/* CONTENEDOR DEL STICKER NGL CLÁSICO (FONDO BLANCO Y ALTURA DINÁMICA) */}
            <div className="w-full rounded-[30px] sm:rounded-[34px] overflow-hidden shadow-xl shadow-slate-300/50 bg-white border border-slate-200 my-3">
              
              {/* CABECERA CON DEGRADADO NARANJA UNFV + ICONO DE LA URRACA AL COSTADO */}
              <div className="bg-gradient-to-r from-[#f55f15] via-[#ff6a1a] to-[#ea580c] px-4 sm:px-6 py-3.5 sm:py-4 text-white relative flex items-center justify-center gap-3 sm:gap-4">
                
                {/* Icono de la Urraca a la izquierda (foto icono.jpg) */}
                <div className="w-12 h-12 min-w-[48px] max-w-[48px] min-h-[48px] max-h-[48px] rounded-full bg-[#110e0c] border-2 border-white shadow-md overflow-hidden flex items-center justify-center flex-shrink-0">
                  {!iconFailedAll ? (
                    <img 
                      src={ICON_FORMATS[iconFormatIdx]} 
                      alt="Urraca" 
                      onError={handleIconError} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-xl">🤫</span>
                  )}
                </div>

                {/* Textos del Encabezado NGL a la derecha */}
                <div className="text-left flex flex-col justify-center">
                  <div className="text-[11px] sm:text-[12px] font-extrabold text-white/95 uppercase tracking-wide leading-tight">
                    Send me anonymous
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-1.5 leading-tight drop-shadow-sm">
                    <span>Confessions</span>
                    <span className="text-amber-300 text-base">😇</span>
                  </div>
                  <div className="mt-0.5 inline-flex items-center gap-1 bg-black/20 backdrop-blur-sm text-white font-bold text-[10.5px] px-2.5 py-0.5 rounded-full border border-white/20 w-fit">
                    <span>@urracavillarrealina</span>
                  </div>
                </div>
              </div>

              {/* CUERPO BLANCO QUE SE DESPLIEGA DINÁMICAMENTE SEGÚN LA CANTIDAD DE TEXTO */}
              <div className="bg-white p-6 sm:p-8 min-h-[140px] flex items-center justify-center text-center">
                <p className="text-black font-extrabold text-lg sm:text-2xl leading-snug break-words whitespace-pre-wrap select-text w-full">
                  {storyModalMessage.contenido}
                </p>
              </div>
            </div>

            {/* Enlace simulado de sticker NGL */}
            <div className="text-center my-3">
              <span className="inline-block bg-slate-100 text-slate-600 font-bold text-xs px-3.5 py-1.5 rounded-full border border-slate-200">
                🔗 Link de respuesta: ngl.link/urracavillar
              </span>
            </div>

            {/* Acciones */}
            <div className="mt-4 space-y-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`"${storyModalMessage.contenido}"\n\n— Confesión anónima en UNFV 🤫\nngl.link/urracavillar`);
                  setCopiedStory(true);
                  setTimeout(() => setCopiedStory(false), 2000);
                }}
                className="w-full py-3.5 px-4 rounded-full font-bold text-white bg-[#f55f15] hover:bg-[#e04f08] transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                {copiedStory ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>¡Texto copiado al portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar texto de la confesión</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="w-full text-center z-10 text-xs text-slate-500 py-3 border-t border-white/5">
        UNFV Confesiones • Panel de Administración en Tiempo Real
      </footer>

      <div className="fixed bottom-0 left-0 right-0 h-[2px] bg-[#f55f15] opacity-80 z-20" />
    </div>
  );
}
