import React, { useState } from 'react';
import { supabase } from './lib/supabase';
import confetti from 'canvas-confetti';
import UnfvLogo from './components/UnfvLogo';
import UnfvBuilding from './components/UnfvBuilding';
import { 
  Send, 
  Lock, 
  CheckCircle2, 
  RotateCcw, 
  AlertCircle,
  X,
  ShieldCheck,
  FileText
} from 'lucide-react';

// Formatos soportados para la imagen "icono" (png, jpg, jpeg, webp, svg)
const ICON_FORMATS = ['/icono.png', '/icono.jpg', '/icono.jpeg', '/icono.webp', '/icono.svg'];

// Preguntas sugeridas para rotar con el dado 🎲 (estilo UNFV / NGL)
const VILLARREAL_PROMPTS = [
  '¿te gusta alguien en este momento?',
  '¿qué es lo que más te llama la atención de mí? 👀',
  '¿tienes un crush secreto conmigo? 🫣',
  '¿alguna vez te dio pena hablarme en la facultad?',
  'dime algo que nunca te atreviste a decirme en persona.',
  '¿con quién de la Villarreal saldrías sin pensarlo? 🤫',
  '¿cuál es tu anécdota favorita en la universidad? ✨',
  'una canción que te recuerde a mí 🎵',
];

export default function App() {
  const [promptIndex, setPromptIndex] = useState(0);
  const [contenido, setContenido] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [legalModal, setLegalModal] = useState(null); // 'terms' | 'privacy' | null

  // Estados para soportar imágenes personalizadas
  const [escudoError, setEscudoError] = useState(false);
  const [facultadError, setFacultadError] = useState(false);

  // Soporte dinámico para cualquier formato de "icono" (png, jpg, webp, svg)
  const [iconFormatIdx, setIconFormatIdx] = useState(0);
  const [iconFailedAll, setIconFailedAll] = useState(false);

  const handleIconError = () => {
    if (iconFormatIdx < ICON_FORMATS.length - 1) {
      setIconFormatIdx((prev) => prev + 1);
    } else {
      setIconFailedAll(true);
    }
  };

  const promptActual = VILLARREAL_PROMPTS[promptIndex];

  // Cambiar pregunta con el botón de dado 🎲
  const handleNextPrompt = () => {
    const nextIdx = (promptIndex + 1) % VILLARREAL_PROMPTS.length;
    setPromptIndex(nextIdx);
    setContenido('');
    setErrorMsg('');
  };

  // Enviar mensaje a Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    const textoFinal = contenido.trim() || promptActual;

    if (!textoFinal) {
      setErrorMsg('Por favor escribe algo antes de enviar.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase
        .from('mensajes')
        .insert([{ contenido: textoFinal }]);

      if (error) throw error;

      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f55f15', '#ff9800', '#ffffff', '#e04f08']
      });

      setEnviado(true);
    } catch (err) {
      console.error('Error al enviar:', err);
      setErrorMsg(err.message || 'No se pudo enviar la confesión. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEnviado(false);
    setContenido('');
    setErrorMsg('');
  };

  return (
    <div className="min-h-[100dvh] w-full unfv-bg flex flex-col justify-between items-center px-4 py-3 sm:py-6 md:py-8 text-white relative overflow-x-hidden select-none">
      
      {/* ======================================================== */}
      {/* 1. IMAGEN DE LA FACULTAD (ESQUINA INFERIOR IZQUIERDA) */}
      {/* Archivo: ngl-public/public/facultad.png */}
      {/* ======================================================== */}
      {!facultadError ? (
        <img 
          src="/facultad.png" 
          alt="Facultad UNFV" 
          onError={() => setFacultadError(true)}
          className="pointer-events-none z-0 fixed left-[-8px] bottom-1 sm:left-4 sm:bottom-2 md:left-8 md:bottom-4 w-32 sm:w-44 md:w-64 max-h-48 md:max-h-60 object-contain opacity-90 transition-all select-none" 
        />
      ) : (
        <UnfvBuilding className="fixed left-[-10px] bottom-1 sm:left-4 sm:bottom-2 md:left-8 md:bottom-4 w-32 h-28 sm:w-40 sm:h-36 md:w-60 md:h-52 z-0 opacity-90 transition-all" />
      )}

      {/* ======================================================== */}
      {/* 2. LEMA "ORGULLO VILLAREALINO" (ESQUINA INFERIOR DERECHA) */}
      {/* ======================================================== */}
      <div className="pointer-events-none z-0 fixed right-3 bottom-3 sm:right-6 sm:bottom-4 md:right-10 md:bottom-6 rotate-[-8deg] text-right transition-all">
        <span className="font-handwriting text-2xl sm:text-3xl md:text-4xl font-bold text-[#f55f15] tracking-wide block drop-shadow-md leading-tight">
          Orgullo<br />Villarealino
        </span>
        <svg className="w-24 sm:w-28 md:w-36 h-3 sm:h-4 text-[#f55f15] mt-[-4px] ml-auto" viewBox="0 0 100 12" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
          <path d="M 5 6 Q 50 12 95 4" />
        </svg>
      </div>

      {/* ======================================================== */}
      {/* CONTENEDOR CENTRAL (Móvil nativo + PC centrada) */}
      {/* ======================================================== */}
      <div className="w-full max-w-[420px] sm:max-w-[450px] md:max-w-[460px] mx-auto flex flex-col justify-between flex-1 z-10">

        {/* ======================================================== */}
        {/* CABECERA: IMAGEN ESCUDO.PNG + LEMA MANUSCRITO */}
        {/* Archivo: ngl-public/public/escudo.png */}
        {/* ======================================================== */}
        <header className="w-full flex items-center justify-between pt-1 pb-3 sm:pb-5">
          {!escudoError ? (
            <div className="flex items-center">
              <img 
                src="/escudo.png" 
                alt="Escudo UNFV" 
                onError={() => setEscudoError(true)}
                className="h-14 sm:h-16 md:h-20 w-auto max-w-[210px] sm:max-w-[260px] object-contain drop-shadow-md select-none" 
              />
            </div>
          ) : (
            <UnfvLogo />
          )}

          {/* Lema manuscrito: "Tu voz también importa" */}
          <div className="rotate-[-8deg] mr-1">
            <span className="font-handwriting text-2xl sm:text-3xl font-bold text-[#f55f15] tracking-wide block drop-shadow-sm leading-tight text-right">
              Tu voz<br />también<br />importa
            </span>
            <svg className="w-20 sm:w-24 h-3 sm:h-4 text-[#f55f15] mt-[-6px] ml-auto" viewBox="0 0 100 15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M 5 8 Q 50 14 95 6" />
            </svg>
          </div>
        </header>

        {/* ======================================================== */}
        {/* TARJETA NGL CENTRAL (NARANJA + CHOCOLATE) */}
        {/* ======================================================== */}
        <main className="w-full my-auto py-2">
          {!enviado ? (
            <div className="space-y-3.5 sm:space-y-4">
              
              {/* TARJETA DIVIDIDA (100% IGUAL AL SCREENSHOT) */}
              <div className="w-full rounded-[26px] sm:rounded-[30px] overflow-hidden shadow-2xl shadow-black/90 border border-white/5 transition-transform duration-300 hover:shadow-orange-950/20">
                
                {/* Cabecera de la Tarjeta: Naranja NGL */}
                <div className="bg-[#f55f15] px-4 sm:px-5 py-3 sm:py-3.5 flex items-center gap-3.5">
                  
                  {/* ======================================================== */}
                  {/* AVATAR / ICONO PERSONALIZADO: "icono.png" (o jpg, webp) */}
                  {/* Archivo: ngl-public/public/icono.png */}
                  {/* ======================================================== */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#110e0c] flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden border border-black/20">
                    {!iconFailedAll ? (
                      <img 
                        src={ICON_FORMATS[iconFormatIdx]} 
                        alt="Icono" 
                        onError={handleIconError}
                        className="w-full h-full object-cover select-none" 
                      />
                    ) : (
                      /* Fallback gráfico SVG del espía en caso de que no haya imagen */
                      <svg viewBox="0 0 36 36" className="w-7 h-7 sm:w-8 sm:h-8 fill-white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 6 15 C 8 15 11 13 18 13 C 25 13 28 15 30 15 C 32 15 32 13 28 12 C 26 10 24 5 18 5 C 12 5 10 10 8 12 C 4 13 4 15 6 15 Z" />
                        <circle cx="12" cy="22" r="4.5" />
                        <circle cx="24" cy="22" r="4.5" />
                        <rect x="15" y="20.5" width="6" height="3" rx="1.5" />
                        <path d="M 7 30 L 14 27 L 18 31 L 22 27 L 29 30 L 31 34 L 5 34 Z" opacity="0.9" />
                      </svg>
                    )}
                  </div>

                  {/* Nombre y subtítulo */}
                  <div className="leading-tight text-black">
                    <div className="font-extrabold text-[15px] sm:text-base tracking-tight">
                      @urracavillarrealina
                    </div>
                    <div className="text-[12px] sm:text-[13px] font-semibold text-black/90">
                      send me anonymous confessions
                    </div>
                  </div>
                </div>

                {/* Cuerpo de la Tarjeta: Café oscuro con textarea y dado */}
                <div className="bg-[#261e1b] p-4 sm:p-6 min-h-[180px] sm:min-h-[210px] flex flex-col justify-between relative">
                  <textarea
                    value={contenido}
                    onChange={(e) => {
                      setContenido(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    rows={4}
                    maxLength={500}
                    placeholder={promptActual}
                    className="w-full bg-transparent border-0 outline-none text-[#d4ccc7] placeholder-[#a69e99] text-base sm:text-xl font-bold leading-snug resize-none select-text focus:ring-0"
                    autoFocus
                  />

                  {/* Botón de Dado 🎲 en esquina inferior derecha */}
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={handleNextPrompt}
                      title="Cambiar pregunta"
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#3d332f] hover:bg-[#4a3e39] active:scale-90 transition-all flex items-center justify-center shadow-lg border border-white/5 cursor-pointer"
                    >
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-white rounded-md shadow-md flex items-center justify-center relative transform rotate-6 hover:rotate-12 transition-transform">
                        <span className="w-1.5 h-1.5 bg-[#f55f15] rounded-full absolute top-1 left-1" />
                        <span className="w-2 h-2 bg-[#f55f15] rounded-full" />
                        <span className="w-1.5 h-1.5 bg-black rounded-full absolute bottom-1 right-1" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Mensaje de error si ocurre */}
              {errorMsg && (
                <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-xs">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Candado: q&a anónimas */}
              <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-slate-200 font-medium pt-0.5">
                <span className="text-amber-400 text-sm">🔒</span>
                <span>q&a anónimas</span>
              </div>

              {/* Botón Principal: ¡Enviar! */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3.5 sm:py-4 px-6 rounded-full font-black text-white text-lg sm:text-xl tracking-wide bg-[#f55f15] hover:bg-[#e04f08] active:scale-[0.98] hover:shadow-orange-600/30 transition-all shadow-xl shadow-orange-950/40 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>¡Enviar!</span>
                )}
              </button>

            </div>
          ) : (
            /* Pantalla de Éxito */
            <div className="w-full rounded-[28px] bg-[#261e1b] border border-white/10 p-7 sm:p-8 shadow-2xl text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#f55f15]/20 border-2 border-[#f55f15] flex items-center justify-center mb-5">
                <CheckCircle2 className="w-8 h-8 text-[#f55f15]" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">¡Confesión Enviada! 🤫</h2>
              <p className="text-xs sm:text-sm text-slate-300 mb-6">
                Tu mensaje anónimo ha sido entregado a <strong>@urracavillarrealina</strong> con éxito y total privacidad.
              </p>
              <button
                onClick={handleReset}
                className="w-full py-3.5 px-6 rounded-full font-bold text-white bg-[#f55f15] hover:bg-[#e04f08] transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Enviar otra confesión</span>
              </button>
            </div>
          )}
        </main>

        {/* FOOTER: TERMS Y PRIVACY */}
        <footer className="w-full pt-3 pb-2 text-center z-10">
          <div className="flex items-center justify-center gap-3 text-xs text-[#8c837c] font-medium">
            <button
              type="button"
              onClick={() => setLegalModal('terms')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Terms
            </button>
            <span className="text-white/20">•</span>
            <button
              type="button"
              onClick={() => setLegalModal('privacy')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Privacy
            </button>
          </div>
        </footer>

      </div>

      {/* MODAL DE TÉRMINOS Y PRIVACIDAD */}
      {legalModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setLegalModal(null);
          }}
          className="fixed inset-0 z-50 backdrop-blur-md bg-black/80 flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-[#1c1614] border border-white/15 rounded-[28px] max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
            
            {/* Header del modal con pestañas */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLegalModal('terms')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    legalModal === 'terms'
                      ? 'bg-[#f55f15] text-white shadow-md'
                      : 'text-slate-400 hover:text-white bg-white/5'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Términos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLegalModal('privacy')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    legalModal === 'privacy'
                      ? 'bg-[#f55f15] text-white shadow-md'
                      : 'text-slate-400 hover:text-white bg-white/5'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Privacidad</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="p-5 overflow-y-auto text-xs text-slate-300 space-y-3.5 leading-relaxed">
              {legalModal === 'terms' ? (
                <>
                  <div className="p-2.5 rounded-xl bg-[#f55f15]/10 border border-[#f55f15]/30 text-amber-200">
                    <strong>⚠️ Descargo Institucional:</strong> Plataforma 100% estudiantil e independiente. NO oficial ni vinculada a la administración de la Universidad Nacional Federico Villarreal (UNFV).
                  </div>

                  <h4 className="font-extrabold text-white text-sm">1. Responsabilidad de Contenido</h4>
                  <p>
                    Esta plataforma es un canal técnico de entretenimiento estudiantil. La responsabilidad legal y moral de cada confesión recae exclusivamente en su autor.
                  </p>

                  <h4 className="font-extrabold text-white text-sm">2. Conductas Prohibidas</h4>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300">
                    <li>Difamación, calumnias o ataques al honor personal.</li>
                    <li>Divulgación no consentida de fotos íntimas, números o datos privados (doxxing).</li>
                    <li>Acoso escolar, amenazas o mensajes de odio.</li>
                  </ul>

                  <h4 className="font-extrabold text-white text-sm">3. Retiro Inmediato (Takedown)</h4>
                  <p>
                    Si alguna confesión te afecta, incomoda o vulnera tu intimidad, simplemente envía un mensaje o confesión por esta misma plataforma indicando qué mensaje deseas que se retire y será eliminado a la brevedad.
                  </p>
                </>
              ) : (
                <>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                    <strong>🔒 Garantía de Anonimato:</strong> No guardamos tu nombre, correo ni datos personales.
                  </div>

                  <h4 className="font-extrabold text-white text-sm">1. Sin Cuentas ni Registros</h4>
                  <p>
                    No necesitas iniciar sesión con Google ni registrar ningún correo. El envío de confesiones es directo e indetectable.
                  </p>

                  <h4 className="font-extrabold text-white text-sm">2. Datos Almacenados</h4>
                  <p>
                    Únicamente se almacena el texto del mensaje y la fecha/hora del envío en nuestra base de datos protegida. Ningún mensaje está asociado a tu identidad.
                  </p>

                  <h4 className="font-extrabold text-white text-sm">3. Protección de Datos (Perú)</h4>
                  <p>
                    En respeto a la Ley N° 29733 de Protección de Datos Personales, nos comprometemos a no comercializar ni difundir información privada.
                  </p>
                </>
              )}
            </div>

            {/* Footer con botón de cerrar */}
            <div className="p-3 border-t border-white/10 text-center bg-[#141210]">
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="w-full py-2.5 rounded-full font-bold text-white bg-[#f55f15] hover:bg-[#e04f08] transition-all text-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Línea horizontal naranja fija en el borde inferior de la pantalla */}
      <div className="fixed bottom-0 left-0 right-0 h-[2px] bg-[#f55f15] opacity-80 z-20" />
    </div>
  );
}
