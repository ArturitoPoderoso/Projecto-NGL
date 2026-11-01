import React, { useMemo, useState } from 'react';

// ========================================================
// 1. EFECTO NIEVE CAYENDO (Limpio, ligero, 60 FPS)
// ========================================================
export function SnowFallingEffect() {
  const flakes = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      left: `${(i * 4.1 + Math.random() * 3).toFixed(1)}%`,
      size: Math.floor(Math.random() * 7) + 5, // 5px a 12px
      duration: (Math.random() * 5 + 6).toFixed(1) + 's',
      delay: -(Math.random() * 10).toFixed(1) + 's',
      opacity: (Math.random() * 0.4 + 0.35).toFixed(2),
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
      {flakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute rounded-full bg-white animate-snow pointer-events-none"
          style={{
            left: flake.left,
            top: '-20px',
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            animationDuration: flake.duration,
            animationDelay: flake.delay,
            filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))',
          }}
        />
      ))}
    </div>
  );
}

// ========================================================
// 2. GUIRNALDA SUPERIOR (/navidad-top.png)
// En PC y Móvil: centrado arriba, ancho que acompaña a la tarjeta
// max-w-[540px], con altura proporcional sin recortes feos.
// ========================================================
export function ChristmasTopGarland() {
  const [hasImage, setHasImage] = useState(true);

  if (!hasImage) return null;

  return (
    <div className="fixed top-0 left-0 right-0 pointer-events-none z-[5] select-none flex justify-center">
      <img
        src="/navidad-top.png"
        alt="Guirnalda navideña superior"
        onError={() => setHasImage(false)}
        className="w-full max-w-[500px] sm:max-w-[540px] md:max-w-[560px] h-auto object-contain opacity-95 drop-shadow-lg"
      />
    </div>
  );
}

// ========================================================
// 3. GUIRNALDA INFERIOR (/navidad-bottom.png)
// Centrada abajo, tamaño armónico (max-w-[440px] en PC y w-[90%] en móvil),
// luce completa con sus esferas y piñas sin tapar nada.
// ========================================================
export function ChristmasBottomGarland() {
  const [hasImage, setHasImage] = useState(true);

  if (!hasImage) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-[5] select-none flex justify-center">
      <img
        src="/navidad-bottom.png"
        alt="Decoración navideña inferior"
        onError={() => setHasImage(false)}
        className="w-[85%] max-w-[380px] sm:max-w-[420px] md:max-w-[440px] h-auto object-contain drop-shadow-2xl"
      />
    </div>
  );
}

// ========================================================
// 4. GORRITO DE SANTA (/gorro-santa.png)
// Tamaño calibrado y ajustado sobre la esquina de la urraca
// ========================================================
export function SantaHatOverlay({ className = '' }) {
  const [hasImage, setHasImage] = useState(true);

  if (!hasImage) return null;

  return (
    <div className={`pointer-events-none select-none z-20 ${className}`}>
      <img
        src="/gorro-santa.png"
        alt="Gorro de Santa"
        onError={() => setHasImage(false)}
        className="w-full h-full object-contain drop-shadow-md"
      />
    </div>
  );
}
