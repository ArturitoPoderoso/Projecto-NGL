import React from 'react';

// Copo de nieve vectorial reutilizable
export function SnowflakeIcon({ className = '', style = {} }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
      {/* Ramitas secundarias */}
      <polyline points="10 4 12 2 14 4" />
      <polyline points="10 20 12 22 14 20" />
      <polyline points="4 10 2 12 4 14" />
      <polyline points="20 10 22 12 20 14" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

// Decoración de nieve y copos idéntica a la imagen del sticker navideño
export function ChristmasStickerDecorations() {
  return (
    <>
      {/* Copos y puntos en la cabecera ROJA */}
      {/* Copo izquierdo en rojo */}
      <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-white/90 pointer-events-none">
        <SnowflakeIcon className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-sm animate-pulse" />
      </div>

      {/* Copo derecho en rojo */}
      <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-white/90 pointer-events-none">
        <SnowflakeIcon className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-sm animate-pulse" />
      </div>

      {/* Puntitos de nieve en cabecera roja */}
      <div className="absolute top-2.5 left-12 w-2 h-2 rounded-full bg-white opacity-80" />
      <div className="absolute bottom-2 left-6 w-1.5 h-1.5 rounded-full bg-white opacity-85" />
      <div className="absolute bottom-3 left-18 w-2.5 h-2.5 rounded-full bg-white opacity-70" />
      <div className="absolute top-2.5 right-14 w-2 h-2 rounded-full bg-white opacity-85" />
      <div className="absolute bottom-3 right-8 w-2 h-2 rounded-full bg-white opacity-80" />
    </>
  );
}

// Copos de nieve flotando sutilmente en el cuerpo BLANCO de la confesión
export function ChristmasWhiteBodyDecorations() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Copo superior izquierdo celeste/invernal */}
      <SnowflakeIcon className="absolute top-3 left-3 w-7 h-7 sm:w-8 sm:h-8 text-slate-300 opacity-60" />

      {/* Copo inferior izquierdo celeste/invernal */}
      <SnowflakeIcon className="absolute bottom-3 left-3 w-7 h-7 sm:w-8 sm:h-8 text-slate-300 opacity-60" />

      {/* Copo superior derecho celeste/invernal */}
      <SnowflakeIcon className="absolute top-3 right-3 w-7 h-7 sm:w-8 sm:h-8 text-slate-300 opacity-60" />

      {/* Copo inferior derecho celeste/invernal */}
      <SnowflakeIcon className="absolute bottom-3 right-3 w-7 h-7 sm:w-8 sm:h-8 text-slate-300 opacity-60" />

      {/* Puntitos suaves de nieve decorativos en el área blanca */}
      <div className="absolute top-1/2 left-4 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-300 opacity-50" />
      <div className="absolute top-2/3 left-8 w-1.5 h-1.5 rounded-full bg-slate-300 opacity-40" />
      <div className="absolute top-1/2 right-4 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-300 opacity-50" />
      <div className="absolute bottom-4 right-10 w-2 h-2 rounded-full bg-slate-300 opacity-40" />
    </div>
  );
}

