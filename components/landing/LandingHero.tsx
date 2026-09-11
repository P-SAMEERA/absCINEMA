'use client';

import React, { useState } from 'react';
import { soundEngine } from '../../engine/audio/soundEngine';
import { Film } from 'lucide-react';

interface LandingHeroProps {
  onEnterCinema: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onEnterCinema }) => {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isAnimating, setIsAnimating] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    });
  };

  const handleEnterClick = () => {
    setIsAnimating(true);
    if (soundEngine) {
      soundEngine.init();
      soundEngine.playProjectorStartSFX();
    }
    setTimeout(() => {
      onEnterCinema();
    }, 1200);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative w-screen h-screen overflow-hidden bg-[#060709] flex flex-col justify-between items-center select-none"
    >
      {/* Dynamic Ambient Parallax Glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-transform duration-700 ease-out opacity-25"
        style={{
          background: `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(229, 184, 105, 0.15) 0%, rgba(14, 24, 38, 0.4) 45%, transparent 75%)`,
        }}
      />

      {/* Film Grain Texture */}
      <div className="film-grain" />

      {/* Vignette */}
      <div className="cinema-vignette" />

      {/* Animated Top Letterbox Matte */}
      <div
        className={`w-full bg-black z-30 transition-all duration-1000 ease-in-out ${
          isAnimating ? 'h-[12vh]' : 'h-0'
        }`}
      />

      {/* Main Hero Typography */}
      <div className="relative z-20 flex flex-col items-center text-center px-6 my-auto">
        <div className="flex items-center gap-2 mb-6 opacity-80 animate-fade-in">
          <Film className="w-5 h-5 text-cinema-gold" />
          <span className="font-mono text-xs tracking-[0.4em] uppercase text-cinema-400">
            A Screenplay Experience Engine
          </span>
        </div>

        <h1
          className={`font-mono text-4xl sm:text-6xl md:text-7xl font-bold tracking-[0.35em] uppercase text-white transition-all duration-1000 ${
            isAnimating ? 'scale-110 tracking-[0.5em] opacity-0 blur-sm' : 'opacity-100'
          }`}
        >
          absCinema
        </h1>

        <p className="mt-4 font-serif text-lg md:text-xl text-cinema-300 italic tracking-widest font-light">
          stories deserve a screen.
        </p>

        <div className="w-12 h-[1px] bg-cinema-gold/30 my-10" />

        {/* Enter Cinema Button */}
        <button
          onClick={handleEnterClick}
          disabled={isAnimating}
          className="group relative px-8 py-3.5 rounded-full border border-cinema-gold/40 bg-cinema-900/50 hover:bg-cinema-gold text-cinema-gold hover:text-black font-mono text-xs tracking-[0.3em] uppercase font-semibold transition-all duration-300 shadow-2xl hover:shadow-amber-500/20 active:scale-95"
        >
          <span className="relative z-10 flex items-center gap-2">
            <span>ENTER CINEMA</span>
            <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </span>
        </button>
      </div>

      {/* Animated Bottom Letterbox Matte */}
      <div
        className={`w-full bg-black z-30 transition-all duration-1000 ease-in-out ${
          isAnimating ? 'h-[12vh]' : 'h-0'
        }`}
      />
    </div>
  );
};
