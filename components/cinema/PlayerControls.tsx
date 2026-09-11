'use client';

import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SlidersHorizontal,
  Sparkles,
  Clapperboard,
} from 'lucide-react';
import { DirectorStyle, Beat } from '../../engine/types';
import { DIRECTOR_PRESETS } from '../../engine/director/presets';

interface PlayerControlsProps {
  visible: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextBeat: () => void;
  onPrevBeat: () => void;
  onRestart: () => void;
  onSeekBeat: (sceneIdx: number, beatIdx: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  currentSceneIndex: number;
  currentBeatIndex: number;
  totalScenes: number;
  currentSceneBeats: Beat[];
  beatProgress: number; // 0 to 1
  activeStyle: DirectorStyle;
  onSelectDirectorStyle: (styleId: string) => void;
  onExitCinema: () => void;
  currentAmbience?: string;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  visible,
  isPlaying,
  onTogglePlay,
  onNextBeat,
  onPrevBeat,
  onRestart,
  onSeekBeat,
  isFullscreen,
  onToggleFullscreen,
  isMuted,
  onToggleMute,
  currentSceneIndex,
  currentBeatIndex,
  totalScenes,
  currentSceneBeats,
  beatProgress,
  activeStyle,
  onSelectDirectorStyle,
  onExitCinema,
  currentAmbience,
}) => {
  const [showStyleMenu, setShowStyleMenu] = React.useState(false);

  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-40 transition-all duration-500 pointer-events-auto select-none ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
      }`}
    >
      {/* Top Scrubber & Chapter Bar */}
      <div className="max-w-4xl mx-auto px-6 mb-2">
        <div className="flex items-center gap-1.5 h-1.5 w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-md">
          {currentSceneBeats.map((beat, idx) => {
            const isPast = idx < currentBeatIndex;
            const isCurrent = idx === currentBeatIndex;
            return (
              <button
                key={`${beat.id}-${idx}`}
                onClick={() => onSeekBeat(currentSceneIndex, idx)}
                title={`${beat.type}: ${beat.rawText.slice(0, 30)}...`}
                className="relative h-full flex-1 transition-all rounded-full overflow-hidden group focus:outline-none"
              >
                <div
                  className={`h-full w-full transition-colors ${
                    isPast
                      ? 'bg-cinema-gold'
                      : isCurrent
                      ? 'bg-white/40'
                      : 'bg-white/10 group-hover:bg-white/20'
                  }`}
                />
                {isCurrent && (
                  <div
                    className="absolute inset-0 bg-cinema-gold transition-all duration-100 ease-linear origin-left"
                    style={{ transform: `scaleX(${beatProgress})` }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Glassmorphic Control Bar */}
      <div className="max-w-4xl mx-auto px-6 pb-6">
        <div className="bg-cinema-900/85 border border-white/10 backdrop-blur-xl rounded-2xl px-6 py-3.5 shadow-2xl flex items-center justify-between gap-4">
          {/* Left: Scene Info & Exit */}
          <div className="flex items-center gap-4">
            <button
              onClick={onExitCinema}
              className="text-xs font-mono tracking-widest text-cinema-400 hover:text-white uppercase transition-colors px-2.5 py-1 rounded-md hover:bg-white/5 flex items-center gap-1.5"
            >
              <Clapperboard className="w-3.5 h-3.5" />
              <span>Studio</span>
            </button>

            <div className="h-4 w-[1px] bg-white/10" />

            <div className="text-xs font-mono text-cinema-300 flex items-center gap-2">
              <div>
                <span className="text-cinema-amber font-semibold">
                  SCENE {(currentSceneIndex + 1).toString().padStart(2, '0')}
                </span>
                <span className="text-cinema-500"> / {totalScenes.toString().padStart(2, '0')}</span>
              </div>
              {currentAmbience && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-cinema-cyan">
                  <span>🎧</span>
                  <span>{currentAmbience.replace(/_/g, ' ')}</span>
                </span>
              )}
            </div>
          </div>

          {/* Center: Playback Controls */}
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={onRestart}
              title="Restart Film"
              className="p-2 text-cinema-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onPrevBeat}
              title="Previous Beat (Left Arrow)"
              className="p-2 text-cinema-300 hover:text-white transition-colors rounded-lg hover:bg-white/5 active:scale-95"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              className="p-3 bg-cinema-gold text-cinema-950 font-bold rounded-full hover:bg-amber-400 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={onNextBeat}
              title="Next Beat (Right Arrow)"
              className="p-2 text-cinema-300 hover:text-white transition-colors rounded-lg hover:bg-white/5 active:scale-95"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Audio, Director Style, Fullscreen */}
          <div className="flex items-center gap-2">
            {/* Director Style Popover Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowStyleMenu(!showStyleMenu)}
                title="Directorial Vision"
                className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-lg border border-cinema-500/20 hover:border-cinema-gold/40 text-cinema-300 hover:text-cinema-gold transition-colors bg-white/5"
              >
                <Sparkles className="w-3.5 h-3.5 text-cinema-gold" />
                <span className="hidden sm:inline">{activeStyle.name.split(' ')[0]}</span>
                <SlidersHorizontal className="w-3 h-3 text-cinema-400" />
              </button>

              {/* Styles Dropdown Menu */}
              {showStyleMenu && (
                <div className="absolute right-0 bottom-full mb-3 w-64 bg-cinema-900 border border-white/10 rounded-xl p-2 shadow-2xl backdrop-blur-2xl z-50 animate-fade-in">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-cinema-400 px-3 py-1.5 border-b border-white/5">
                    Directorial Style
                  </div>
                  <div className="space-y-1 mt-1">
                    {Object.values(DIRECTOR_PRESETS).map((preset) => {
                      const isSelected = preset.id === activeStyle.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => {
                            onSelectDirectorStyle(preset.id);
                            setShowStyleMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex flex-col ${
                            isSelected
                              ? 'bg-cinema-gold/15 text-cinema-gold font-medium'
                              : 'text-cinema-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className="font-semibold">{preset.name}</span>
                          <span className="text-[10px] text-cinema-400 line-clamp-1">{preset.tagline}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Audio Toggle */}
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="p-2 text-cinema-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-2 text-cinema-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
