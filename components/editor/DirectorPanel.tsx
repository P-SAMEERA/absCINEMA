'use client';

import React from 'react';
import { DirectorStyle } from '../../engine/types';
import { DIRECTOR_PRESETS } from '../../engine/director/presets';
import {
  Play,
  Sparkles,
  Volume2,
  CloudRain,
  Wind,
  Activity,
  Camera,
  Radio,
} from 'lucide-react';

interface DirectorPanelProps {
  selectedStyle: DirectorStyle;
  onSelectStyle: (styleId: string) => void;
  onLaunchCinema: () => void;
  onOpenStoryboard?: () => void;
  onOpenAmbience?: () => void;
  estimatedRuntimeSeconds: number;
}

export const DirectorPanel: React.FC<DirectorPanelProps> = ({
  selectedStyle,
  onSelectStyle,
  onLaunchCinema,
  onOpenStoryboard,
  onOpenAmbience,
  estimatedRuntimeSeconds,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}m ${remainder.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="flex flex-col h-full bg-cinema-900/60 border-l border-white/5 backdrop-blur-md p-4 overflow-y-auto">
      {/* Primary Launch Action */}
      <button
        onClick={onLaunchCinema}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-cinema-amber via-cinema-gold to-amber-500 text-cinema-950 font-mono font-bold tracking-[0.2em] text-xs uppercase flex items-center justify-center gap-2 hover:brightness-110 active:scale-98 transition-all shadow-xl shadow-amber-500/20 mb-4 group"
      >
        <Play className="w-4 h-4 fill-current transition-transform group-hover:scale-110" />
        <span>Watch in Cinema Mode</span>
      </button>

      {/* Storyboard & Ambience Feedback Quick Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button
          onClick={onOpenStoryboard}
          className="p-2.5 rounded-xl bg-cinema-950/80 hover:bg-white/10 border border-white/10 text-cinema-300 hover:text-white transition-all flex flex-col items-center text-center gap-1 group"
        >
          <Camera className="w-4 h-4 text-cinema-gold transition-transform group-hover:scale-110" />
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
            Storyboards
          </span>
        </button>

        <button
          onClick={onOpenAmbience}
          className="p-2.5 rounded-xl bg-cinema-950/80 hover:bg-white/10 border border-white/10 text-cinema-300 hover:text-white transition-all flex flex-col items-center text-center gap-1 group"
        >
          <Radio className="w-4 h-4 text-cinema-cyan transition-transform group-hover:scale-110" />
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
            Ambience AI
          </span>
        </button>
      </div>

      {/* Runtime & Specs */}
      <div className="bg-cinema-950/60 border border-white/5 rounded-xl p-3.5 mb-6">
        <div className="text-[10px] font-mono tracking-widest uppercase text-cinema-500 mb-1">
          Estimated Runtime
        </div>
        <div className="font-mono text-xl font-bold text-cinema-gold">
          {formatTime(estimatedRuntimeSeconds)}
        </div>
        <div className="text-[11px] text-cinema-400 font-mono mt-1 flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-cinema-cyan" />
          <span>Pacing: {selectedStyle.pacingMultiplier}x ({selectedStyle.lightingPace})</span>
        </div>
      </div>

      {/* Creative Directorial Presets */}
      <div className="mb-6">
        <div className="text-xs font-mono tracking-[0.2em] uppercase text-cinema-300 font-semibold mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cinema-gold" />
          <span>Directorial Vision</span>
        </div>

        <div className="space-y-2">
          {Object.values(DIRECTOR_PRESETS).map((preset) => {
            const isSelected = preset.id === selectedStyle.id;

            return (
              <button
                key={preset.id}
                onClick={() => onSelectStyle(preset.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-cinema-gold/10 border-cinema-gold/40 shadow-lg shadow-amber-500/5'
                    : 'border-white/5 bg-cinema-950/40 hover:bg-white/5 text-cinema-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-mono text-xs font-semibold ${
                      isSelected ? 'text-cinema-gold' : 'text-cinema-200'
                    }`}
                  >
                    {preset.name}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-cinema-gold animate-pulse" />
                  )}
                </div>

                <p className="text-[11px] text-cinema-400 line-clamp-2 leading-relaxed mb-2">
                  {preset.description}
                </p>

                {/* Micro tags */}
                <div className="flex items-center gap-2 pt-1 border-t border-white/5 text-[10px] font-mono text-cinema-500">
                  <span className="flex items-center gap-1">
                    {preset.particleType === 'rain' && <CloudRain className="w-3 h-3 text-cyan-400" />}
                    {preset.particleType === 'dust' && <Wind className="w-3 h-3 text-amber-300" />}
                    {preset.particleType === 'neon' && <Sparkles className="w-3 h-3 text-pink-400" />}
                    <span className="capitalize">{preset.particleType}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-cinema-400" />
                    <span>{preset.audioStyle.replace('_', ' ')}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
