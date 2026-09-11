'use client';

import React from 'react';
import { Beat, DirectorStyle } from '../../engine/types';

interface DialogueRendererProps {
  beat: Beat;
  style: DirectorStyle;
}

export const DialogueRenderer: React.FC<DialogueRendererProps> = ({ beat, style }) => {
  const { character, delivery, parenthetical, dialogueText } = beat;
  const isVO = delivery === 'VOICE_OVER';
  const isOS = delivery === 'OFF_SCREEN';

  // Different positioning and styles depending on delivery type
  return (
    <div
      className={`relative z-20 w-full max-w-3xl mx-auto px-6 py-4 transition-all duration-700 ${
        isVO
          ? 'animate-fade-in flex flex-col items-center text-center -translate-y-4'
          : isOS
          ? 'animate-fade-in flex flex-col items-start text-left pl-12 md:pl-16'
          : 'animate-fade-in flex flex-col items-center text-center'
      }`}
    >
      {/* Character Name & Delivery Badge */}
      <div className="flex items-center gap-2 mb-2 select-none">
        {isOS && (
          <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 rounded border border-cinema-500/40 bg-cinema-900/60 text-cinema-cyan flex items-center gap-1 font-mono">
            <span>◀</span> OFF SCREEN
          </span>
        )}

        <span
          className={`font-mono text-xs md:text-sm tracking-[0.25em] font-semibold uppercase ${
            isVO
              ? 'text-cinema-300 tracking-[0.35em] drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]'
              : 'text-cinema-amber tracking-[0.2em]'
          }`}
          style={{
            color: isVO ? style.colorPalette.textSecondary : style.colorPalette.accentColor,
          }}
        >
          {character}
        </span>

        {isVO && (
          <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full border border-cinema-400/20 bg-cinema-900/40 text-cinema-300 font-mono italic">
            VOICE OVER
          </span>
        )}
      </div>

      {/* Parenthetical (e.g. whispering, pause) */}
      {parenthetical && (
        <div className="text-xs md:text-sm italic text-cinema-400 mb-2 font-serif opacity-80">
          ({parenthetical})
        </div>
      )}

      {/* Dialogue Main Text */}
      <div
        className={`font-serif md:text-2xl text-xl leading-relaxed tracking-wide transition-all ${
          isVO
            ? 'italic font-light text-cinema-100 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]'
            : 'font-normal text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]'
        }`}
        style={{
          color: style.colorPalette.textPrimary,
        }}
      >
        &ldquo;{dialogueText}&rdquo;
      </div>
    </div>
  );
};
