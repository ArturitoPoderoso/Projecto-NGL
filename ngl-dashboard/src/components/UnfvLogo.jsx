import React from 'react';

export default function UnfvLogo({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="w-[46px] h-[64px] border-[2px] border-[#a1abb5] rounded-lg p-1 flex flex-col items-center justify-between bg-black/50 shadow-md flex-shrink-0">
        <div className="w-full h-[2.5px] bg-[#a1abb5] rounded-full mt-0.5" />
        <svg viewBox="0 0 50 56" className="w-[30px] h-[34px] stroke-[#a1abb5] fill-none mt-1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="25,2 47,15 47,41 25,54 3,41 3,15" />
          <line x1="25" y1="16" x2="25" y2="46" strokeWidth="2" />
          <circle cx="25" cy="22" r="5" strokeWidth="2" />
          <path d="M 16 34 Q 25 40 34 34" strokeWidth="2" />
          <path d="M 18 44 L 25 41 L 32 44" strokeWidth="2" />
        </svg>
        <span className="text-[8px] font-extrabold tracking-[0.2em] text-[#e2e8f0] uppercase mb-0.5">
          PERÚ
        </span>
      </div>

      <div className="flex flex-col justify-center">
        <h1 
          className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-none font-sans"
          style={{
            textShadow: '-1.5px 0px 0px rgba(0, 220, 255, 0.95), 1.5px 0px 0px rgba(255, 95, 21, 0.95)'
          }}
        >
          UNFV
        </h1>
        <p className="text-[10.5px] font-semibold text-[#7ab3e0] leading-[1.15] mt-1 tracking-tight">
          Universidad Nacional<br />
          Federico Villarreal
        </p>
      </div>
    </div>
  );
}
