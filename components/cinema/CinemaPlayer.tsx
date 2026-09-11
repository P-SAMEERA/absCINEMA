'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CinemaDocument, Beat, TransitionType } from '../../engine/types';
import { directScreenplay, DirectedCinemaDocument } from '../../engine/director/directorEngine';
import { soundEngine } from '../../engine/audio/soundEngine';
import { VisualCanvas } from './VisualCanvas';
import { DialogueRenderer } from './DialogueRenderer';
import { ActionRenderer } from './ActionRenderer';
import { TransitionLayer } from './TransitionLayer';
import { PlayerControls } from './PlayerControls';
import { Film } from 'lucide-react';

interface CinemaPlayerProps {
  document: CinemaDocument;
  initialStyleId?: string;
  onExit: () => void;
}

export const CinemaPlayer: React.FC<CinemaPlayerProps> = ({
  document: initialDoc,
  initialStyleId,
  onExit,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Direct the screenplay with chosen style
  const [activeStyleId, setActiveStyleId] = useState<string>(
    initialStyleId || initialDoc.directorStyle || 'noir_cold'
  );
  const [directedDoc, setDirectedDoc] = useState<DirectedCinemaDocument>(() =>
    directScreenplay(initialDoc, activeStyleId)
  );

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentSceneIdx, setCurrentSceneIdx] = useState<number>(0);
  const [currentBeatIdx, setCurrentBeatIdx] = useState<number>(0);
  const [beatProgress, setBeatProgress] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Transitions
  const [activeTransition, setActiveTransition] = useState<TransitionType | null>(null);
  const [transitionVisible, setTransitionVisible] = useState<boolean>(false);

  // Audio & Fullscreen
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Auto-hide controls
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update directed document when style changes
  const handleSelectDirectorStyle = (styleId: string) => {
    setActiveStyleId(styleId);
    const updated = directScreenplay(initialDoc, styleId);
    setDirectedDoc(updated);

    if (soundEngine) {
      soundEngine.setMusicStyle(updated.style.audioStyle);
    }
  };

  const currentScene = directedDoc.scenes[currentSceneIdx] || directedDoc.scenes[0];
  const activeBeat: Beat | null = currentScene?.beats[currentBeatIdx] || null;

  // Sound cues synchronization
  useEffect(() => {
    if (!soundEngine || isCompleted) return;

    soundEngine.init();
    soundEngine.setMusicStyle(directedDoc.style.audioStyle);

    if (currentScene) {
      const amb = currentScene.ambience || (currentScene.hasRain ? 'rain_downpour' : 'room_tone_intimate');
      soundEngine.setAmbience(amb);
    }
  }, [currentSceneIdx, directedDoc, isCompleted]);

  // Beat-specific triggers (SFX, transitions)
  useEffect(() => {
    if (!activeBeat || !soundEngine) return;

    if (activeBeat.sfxCue) {
      soundEngine.triggerSFX(activeBeat.sfxCue);
    }

    if (activeBeat.type === 'TRANSITION' && activeBeat.transitionType) {
      setActiveTransition(activeBeat.transitionType);
      setTransitionVisible(true);
      const timer = setTimeout(() => {
        setTransitionVisible(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [activeBeat]);

  // Advance beat handler
  const advanceBeat = useCallback(() => {
    if (!currentScene) return;

    if (currentBeatIdx + 1 < currentScene.beats.length) {
      setCurrentBeatIdx((prev) => prev + 1);
      setBeatProgress(0);
    } else if (currentSceneIdx + 1 < directedDoc.scenes.length) {
      // Advance to next scene
      setCurrentSceneIdx((prev) => prev + 1);
      setCurrentBeatIdx(0);
      setBeatProgress(0);
    } else {
      // Film finished! Show credits
      setIsPlaying(false);
      setIsCompleted(true);
      if (soundEngine) {
        soundEngine.stopAll();
      }
    }
  }, [currentScene, currentBeatIdx, currentSceneIdx, directedDoc.scenes.length]);

  const prevBeat = useCallback(() => {
    if (currentBeatIdx > 0) {
      setCurrentBeatIdx((prev) => prev - 1);
      setBeatProgress(0);
    } else if (currentSceneIdx > 0) {
      const prevScene = directedDoc.scenes[currentSceneIdx - 1];
      setCurrentSceneIdx(currentSceneIdx - 1);
      setCurrentBeatIdx(Math.max(0, prevScene.beats.length - 1));
      setBeatProgress(0);
    }
  }, [currentBeatIdx, currentSceneIdx, directedDoc.scenes]);

  const seekBeat = (sceneIdx: number, beatIdx: number) => {
    setCurrentSceneIdx(sceneIdx);
    setCurrentBeatIdx(beatIdx);
    setBeatProgress(0);
    setIsCompleted(false);
  };

  const restartFilm = () => {
    setCurrentSceneIdx(0);
    setCurrentBeatIdx(0);
    setBeatProgress(0);
    setIsCompleted(false);
    setIsPlaying(true);
    if (soundEngine) {
      soundEngine.triggerSFX('projector_click');
    }
  };

  // Playback timer ticker
  useEffect(() => {
    if (!isPlaying || !activeBeat || isCompleted) return;

    const duration = activeBeat.durationSeconds * 1000;
    const intervalMs = 50;
    const stepRatio = intervalMs / duration;

    const timer = setInterval(() => {
      setBeatProgress((prev) => {
        const next = prev + stepRatio;
        if (next >= 1) {
          advanceBeat();
          return 0;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, activeBeat, advanceBeat, isCompleted]);

  // Fullscreen management
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Mouse activity auto-hide controls
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
      }
    }, 2500);
  };

  // Keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
        case 'ArrowRight':
          e.preventDefault();
          advanceBeat();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevBeat();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          setIsMuted((prev) => {
            const next = !prev;
            if (soundEngine) soundEngine.setMuted(next);
            return next;
          });
          break;
        case 'Escape':
          if (!document.fullscreenElement) {
            onExit();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [advanceBeat, prevBeat, onExit]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (soundEngine) {
        soundEngine.stopAll();
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-screen h-screen overflow-hidden bg-black text-white flex flex-col justify-between select-none cursor-default"
    >
      {/* 2.39:1 Cinema Matte Top Bar (Letterbox) */}
      <div
        className="w-full h-[8vh] md:h-[11vh] bg-black z-30 transition-all duration-700 flex items-center justify-between px-8"
        style={{ backgroundColor: directedDoc.style.colorPalette.letterboxColor }}
      >
        <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
          <Film className="w-4 h-4 text-cinema-gold" />
          <span className="font-mono text-xs tracking-[0.3em] uppercase text-cinema-400">
            {directedDoc.title}
          </span>
        </div>
        <div className="font-mono text-[10px] tracking-[0.25em] text-cinema-500 uppercase hidden sm:block">
          DIR. {directedDoc.style.name}
        </div>
      </div>

      {/* Center Cinematic Stage */}
      <div className="relative flex-1 w-full overflow-hidden flex items-center justify-center">
        {/* Living Storyboard Frame with Ken Burns Effect */}
        {currentScene?.storyboardFrame && (
          <div className="absolute inset-0 overflow-hidden z-5 pointer-events-none">
            <img
              key={currentScene.storyboardFrame.id || currentScene.id}
              src={currentScene.storyboardFrame.imageUrl}
              alt={currentScene.storyboardFrame.caption || currentScene.location}
              className={`w-full h-full object-cover transition-opacity duration-1000 opacity-95 ${
                currentScene.storyboardFrame.cameraMotion === 'slow_push_in'
                  ? 'scale-110 duration-[25000ms] transition-transform ease-out'
                  : currentScene.storyboardFrame.cameraMotion === 'pan_left'
                  ? 'translate-x-[-3%] duration-[25000ms] transition-transform ease-out scale-105'
                  : currentScene.storyboardFrame.cameraMotion === 'pan_right'
                  ? 'translate-x-[3%] duration-[25000ms] transition-transform ease-out scale-105'
                  : currentScene.storyboardFrame.cameraMotion === 'tilt_up'
                  ? 'translate-y-[-3%] duration-[25000ms] transition-transform ease-out scale-105'
                  : 'scale-100'
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
          </div>
        )}

        {/* Dynamic Visual Atmosphere Canvas */}
        <VisualCanvas
          style={directedDoc.style}
          activeBeat={activeBeat}
          hasRain={currentScene?.hasRain || false}
          hasParticles={currentScene?.hasParticles || false}
          ambientLight={currentScene?.effectiveAmbientLight || directedDoc.style.colorPalette.ambientLight}
          hasImage={!!currentScene?.storyboardFrame}
        />

        {/* Vintage Film Grain Filter */}
        <div className={directedDoc.style.id === 'noir_cold' ? 'film-grain-heavy' : 'film-grain'} />

        {/* Vignette Shadow Frame */}
        <div className="cinema-vignette" />

        {/* Cyberpunk Scanlines (if active style) */}
        {directedDoc.style.id === 'cyberpunk_neon' && (
          <div className="absolute inset-0 pointer-events-none z-35 cyber-scanlines opacity-40" />
        )}

        {/* Screenplay Content — Lower Third */}
        {!isCompleted && activeBeat && (
          <div className="absolute bottom-6 left-0 right-0 z-25 px-8 md:px-16">
            {activeBeat.type === 'DIALOGUE' ? (
              <DialogueRenderer beat={activeBeat} style={directedDoc.style} />
            ) : (
              <ActionRenderer beat={activeBeat} style={directedDoc.style} />
            )}
          </div>
        )}

        {/* End Credits Sequence */}
        {isCompleted && (
          <div className="relative z-30 flex flex-col items-center justify-center text-center px-6 animate-fade-in max-w-xl">
            <h1 className="font-mono text-3xl md:text-4xl font-bold tracking-[0.3em] uppercase text-cinema-gold mb-3">
              {directedDoc.title}
            </h1>
            <p className="font-mono text-xs tracking-[0.3em] text-cinema-400 uppercase mb-8">
              WRITTEN BY {directedDoc.author}
            </p>

            <div className="w-12 h-[1px] bg-white/20 mb-8" />

            <div className="space-y-4 font-mono text-xs tracking-[0.25em] text-cinema-300 uppercase mb-10">
              <div>
                <span className="text-cinema-500 block text-[10px] mb-1">DIRECTED & RENDERED BY</span>
                <span className="text-white font-semibold">absCinema ENGINE</span>
              </div>

              {directedDoc.characters.length > 0 && (
                <div>
                  <span className="text-cinema-500 block text-[10px] mb-1">FEATURING</span>
                  <span className="text-cinema-200">{directedDoc.characters.join(' · ')}</span>
                </div>
              )}

              <div>
                <span className="text-cinema-500 block text-[10px] mb-1">SOUNDTRACK</span>
                <span className="text-cinema-200">PROCEDURAL {directedDoc.style.audioStyle.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="text-sm font-mono tracking-[0.4em] uppercase text-white/40 mb-8">
              — THE END —
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={restartFilm}
                className="px-6 py-2.5 rounded-full bg-cinema-gold text-black font-mono text-xs tracking-widest uppercase font-semibold hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
              >
                Watch Again
              </button>
              <button
                onClick={onExit}
                className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs tracking-widest uppercase transition-all active:scale-95"
              >
                Back to Studio
              </button>
            </div>
          </div>
        )}

        {/* Transition Flash / Fade Layer */}
        <TransitionLayer type={activeTransition} active={transitionVisible} />
      </div>

      {/* 2.39:1 Cinema Matte Bottom Bar (Letterbox) */}
      <div
        className="w-full h-[8vh] md:h-[11vh] bg-black z-30 transition-all duration-700"
        style={{ backgroundColor: directedDoc.style.colorPalette.letterboxColor }}
      />

      {/* Auto-hiding HUD & Player Controls */}
      <PlayerControls
        visible={controlsVisible && !isCompleted}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((prev) => !prev)}
        onNextBeat={advanceBeat}
        onPrevBeat={prevBeat}
        onRestart={restartFilm}
        onSeekBeat={seekBeat}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        isMuted={isMuted}
        onToggleMute={() => {
          setIsMuted((prev) => {
            const next = !prev;
            if (soundEngine) soundEngine.setMuted(next);
            return next;
          });
        }}
        currentSceneIndex={currentSceneIdx}
        currentBeatIndex={currentBeatIdx}
        totalScenes={directedDoc.scenes.length}
        currentSceneBeats={currentScene?.beats || []}
        beatProgress={beatProgress}
        activeStyle={directedDoc.style}
        onSelectDirectorStyle={handleSelectDirectorStyle}
        onExitCinema={onExit}
        currentAmbience={currentScene?.ambience || 'room_tone_intimate'}
      />
    </div>
  );
};
