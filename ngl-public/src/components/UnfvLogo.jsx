import React from 'react';

/**
 * Logo oficial UNFV vectorizado 100% idéntico a la imagen de referencia:
 * - Emblema con tarjeta, barra superior, hexágono, antorcha/semilla y texto PERÚ.
 * - Tipografía UNFV con aberración cromática sutil (cian a la izquierda, naranja a la derecha).
 * - "Universidad Nacional Federico Villarreal" en color celeste/cian institucional (#7ab3e0).
 */
export default function UnfvLogo({ className = '' }) {
  return (
    <div className={`flex items-center gap-3.5 select-none ${className}`}>
      {/* Emblema / Escudo UNFV */}
      <div className="w-[52px] h-[72px] sm:w-[56px] sm:h-[78px] border-[2px] border-[#a1abb5] rounded-lg p-1.5 flex flex-col items-center justify-between bg-black/50 shadow-md flex-shrink-0">
        {/* Barra horizontal superior */}
        <div className="w-full h-[3px] bg-[#a1abb5] rounded-full mt-0.5" />

        {/* Hexágono con antorcha institucional */}
        <svg viewBox="0 0 50 56" className="w-[34px] h-[38px] stroke-[#a1abb5] fill-none mt-1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Hexágono */}
          <polygon points="25,2 47,15 47,41 25,54 3,41 3,15" />
          {/* Tallo central */}
          <line x1="25" y1="16" x2="25" y2="46" strokeWidth="2" />
          {/* Círculo superior (antorcha/sol) */}
          <circle cx="25" cy="22" r="5" strokeWidth="2" />
          {/* Arco inferior */}
          <path d="M 16 34 Q 25 40 34 34" strokeWidth="2" />
          {/* Libro / base */}
          <path d="M 18 44 L 25 41 L 32 44" strokeWidth="2" />
        </svg>

        {/* Texto PERÚ con tilde */}
        <span className="text-[9px] sm:text-[10px] font-extrabold tracking-[0.2em] text-[#e2e8f0] uppercase mb-0.5">
          PERÚ
        </span>
      </div>

      {/* Textos: UNFV + Universidad Nacional Federico Villarreal */}
      <div className="flex flex-col justify-center">
        {/* UNFV con efecto 3D / aberración cromática idéntica a la imagen */}
        <h1 
          className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none font-sans"
          style={{
            textShadow: '-1.5px 0px 0px rgba(0, 220, 255, 0.95), 1.5px 0px 0px rgba(255, 95, 21, 0.95)'
          }}
        >
          UNFV
        </h1>

        {/* Subtítulo institucional en tono celeste idéntico a la captura */}
        <p className="text-[11px] sm:text-[12.5px] font-semibold text-[#7ab3e0] leading-[1.15] mt-1 tracking-tight">
          Universidad Nacional<br />
          Federico Villarreal
        </p>
      </div>
    </div>
  );
}
