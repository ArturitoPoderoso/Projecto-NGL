import React from 'react';

/**
 * Ilustración arquitectónica de la Torre y Edificio UNFV
 * 100% idéntica a la imagen de referencia (Image 2):
 * - Torre central con antena vertical y 3 columnas punteadas de ventanas.
 * - Pabellón izquierdo dividido en 3 pisos horizontales.
 * - Pabellón derecho dividido en 3 pisos horizontales.
 * - Árbol con follaje circular punteado (dashed) y tronco vertical.
 * - Doble línea de suelo en la base.
 */
export default function UnfvBuilding({ className = '' }) {
  return (
    <div className={`pointer-events-none select-none ${className}`}>
      <svg 
        viewBox="0 0 240 200" 
        className="w-full h-full stroke-[#e05a18] fill-none" 
        strokeWidth="2.2" 
        strokeLinecap="square"
        strokeLinejoin="miter"
      >
        {/* ========================================= */}
        {/* 1. LÍNEAS DE SUELO (DOBLE BASE) */}
        {/* ========================================= */}
        <line x1="20" y1="184" x2="228" y2="184" strokeWidth="2.2" />
        <line x1="20" y1="188" x2="228" y2="188" strokeWidth="2.2" />

        {/* ========================================= */}
        {/* 2. TORRE CENTRAL */}
        {/* ========================================= */}
        {/* Antena / Aguja superior centrada */}
        <line x1="98" y1="22" x2="98" y2="38" strokeWidth="2.4" />

        {/* Rectángulo de la torre central */}
        <rect x="68" y="38" width="60" height="146" strokeWidth="2.2" />

        {/* Banda / cornisa superior de la torre */}
        <line x1="68" y1="50" x2="128" y2="50" strokeWidth="2.2" />

        {/* 3 Columnas verticales de ventanas punteadas/discontinuas */}
        <line x1="83" y1="56" x2="83" y2="178" strokeDasharray="5, 6" strokeWidth="2.2" />
        <line x1="98" y1="56" x2="98" y2="178" strokeDasharray="5, 6" strokeWidth="2.2" />
        <line x1="113" y1="56" x2="113" y2="178" strokeDasharray="5, 6" strokeWidth="2.2" />

        {/* ========================================= */}
        {/* 3. PABELLÓN IZQUIERDO (3 PISOS) */}
        {/* ========================================= */}
        {/* Contorno del pabellón izquierdo */}
        <rect x="44" y="98" width="24" height="86" strokeWidth="2.2" />
        {/* Divisiones de piso */}
        <line x1="44" y1="127" x2="68" y2="127" strokeWidth="2.2" />
        <line x1="44" y1="156" x2="68" y2="156" strokeWidth="2.2" />

        {/* ========================================= */}
        {/* 4. PABELLÓN DERECHO (3 PISOS) */}
        {/* ========================================= */}
        {/* Contorno del pabellón derecho */}
        <rect x="128" y="110" width="48" height="74" strokeWidth="2.2" />
        {/* Divisiones de piso */}
        <line x1="128" y1="135" x2="176" y2="135" strokeWidth="2.2" />
        <line x1="128" y1="160" x2="176" y2="160" strokeWidth="2.2" />

        {/* ========================================= */}
        {/* 5. ÁRBOL CON FOLLAJE CIRCULAR PUNTEADO */}
        {/* ========================================= */}
        {/* Follaje punteado/discontinuo */}
        <circle cx="190" cy="168" r="11" strokeDasharray="3.5, 3.5" strokeWidth="2.2" />
        {/* Tronco vertical del árbol */}
        <line x1="190" y1="168" x2="190" y2="184" strokeWidth="2.2" />
      </svg>
    </div>
  );
}
