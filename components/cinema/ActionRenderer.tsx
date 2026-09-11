'use client';

import React from 'react';
import { Beat, DirectorStyle } from '../../engine/types';

interface ActionRendererProps {
  beat: Beat;
  style: DirectorStyle;
}

export const ActionRenderer: React.FC<ActionRendererProps> = ({ beat, style }) => {
  const isHeading = beat.type === 'SCENE_HEADING';

  if (isHeading) {
    return (
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-6 animate-fade-in">
        <div className="text-[11px] md:text-xs font-mono tracking-[0.4em] uppercase text-cinema-400 mb-2 opacity-70">
          SCENE {beat.sceneNumber.toString().padStart(3, '0')}
        </div>
        <h2
          className="font-mono text-lg md:text-2xl font-bold tracking-[0.25em] uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
          style={{ color: style.colorPalette.accentColor }}
        >
          {beat.rawText}
        </h2>
        <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-cinema-400/40 to-transparent mt-3" />
      </div>
    );
  }

  return (
    <div className="relative z-20 max-w-2xl mx-auto px-6 py-4 text-center animate-fade-in">
      <p
        className="font-serif md:text-xl text-lg leading-relaxed tracking-wider text-cinema-200 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] font-light"
        style={{ color: style.colorPalette.textPrimary }}
      >
        {beat.actionText || beat.rawText}
      </p>
    </div>
  );
};
