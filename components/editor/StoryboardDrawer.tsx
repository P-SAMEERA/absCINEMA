'use client';

import React, { useState } from 'react';
import { Scene, StoryboardFrame, DirectorStyle } from '../../engine/types';
import {
  createStoryboardFrameForScene,
} from '../../engine/storyboard/storyboardProvider';
import {
  Sparkles,
  RefreshCw,
  Camera,
  Layers,
  Link,
} from 'lucide-react';

interface StoryboardDrawerProps {
  scenes: Scene[];
  style: DirectorStyle;
  onUpdateSceneFrame: (sceneIdx: number, frame: StoryboardFrame) => void;
  onBatchGenerateFrames: (forceAI: boolean) => void;
  onClose: () => void;
}

export const StoryboardDrawer: React.FC<StoryboardDrawerProps> = ({
  scenes,
  style,
  onUpdateSceneFrame,
  onBatchGenerateFrames,
  onClose,
}) => {
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  const [editingUrlIdx, setEditingUrlIdx] = useState<number | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');

  const handleRegenerateFrame = async (sceneIdx: number, forceAI: boolean) => {
    setLoadingIdx(sceneIdx);
    const scene = scenes[sceneIdx];

    try {
      const frame = createStoryboardFrameForScene(scene, style, forceAI);
      onUpdateSceneFrame(sceneIdx, frame);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingIdx(null);
    }
  };

  const handleSaveCustomUrl = (sceneIdx: number) => {
    if (!customUrlInput.trim()) return;
    const scene = scenes[sceneIdx];
    const existing = scene.storyboardFrame || createStoryboardFrameForScene(scene, style);
    onUpdateSceneFrame(sceneIdx, {
      ...existing,
      imageUrl: customUrlInput.trim(),
    });
    setEditingUrlIdx(null);
    setCustomUrlInput('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0c10] border-l border-white/10 p-6 overflow-y-auto w-full max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
        <div>
          <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-cinema-gold mb-1 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-cinema-gold" />
            <span>Living Storyboard Studio</span>
          </div>
          <h2 className="font-mono text-base font-bold uppercase text-white tracking-wider">
            Storyboard Keyframes
          </h2>
        </div>

        <button
          onClick={onClose}
          className="text-xs font-mono text-cinema-400 hover:text-white px-2 py-1 rounded bg-white/5"
        >
          Close
        </button>
      </div>

      {/* Action Banner */}
      <div className="bg-cinema-900/60 border border-white/5 rounded-xl p-4 mb-6">
        <p className="text-xs text-cinema-300 leading-relaxed mb-4">
          Transform your screenplay into cinematic visual frames. Cinema Mode displays these 2.39:1 keyframes with slow Ken Burns camera movement, dynamic lighting, and dialogue composited over the image.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onBatchGenerateFrames(true)}
            className="py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-cinema-gold text-cinema-950 font-mono text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-98 transition-all shadow-md shadow-amber-500/10"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>AI Storyboard</span>
          </button>

          <button
            onClick={() => onBatchGenerateFrames(false)}
            className="py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-cinema-200 font-mono text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all active:scale-98"
          >
            <Layers className="w-3.5 h-3.5 text-cinema-cyan" />
            <span>Curated Stills</span>
          </button>
        </div>
      </div>

      {/* Storyboard Frames List */}
      <div className="space-y-6 flex-1">
        {scenes.map((scene, idx) => {
          const frame = scene.storyboardFrame || createStoryboardFrameForScene(scene, style);
          const isLoading = loadingIdx === idx;

          return (
            <div
              key={scene.id}
              className="bg-cinema-950/80 border border-white/5 hover:border-white/15 rounded-xl overflow-hidden p-4 transition-all"
            >
              {/* Scene Number & Heading */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono tracking-widest uppercase text-cinema-gold font-semibold">
                  SCENE {String(scene.sceneNumber).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-mono text-cinema-400 uppercase">
                  {scene.heading}
                </span>
              </div>

              {/* 2.39:1 Keyframe Image Preview */}
              <div className="relative aspect-cinema w-full bg-cinema-900 rounded-lg overflow-hidden border border-white/10 mb-3 group">
                <img
                  src={frame.imageUrl}
                  alt={frame.caption || scene.location}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback on broken URL
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=1920&q=80';
                  }}
                />

                {/* Camera Motion Overlay Tag */}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-cinema-300 uppercase border border-white/10">
                  🎥 {frame.cameraMotion.replace(/_/g, ' ')}
                </div>

                {/* Loading Spinner */}
                {isLoading && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center gap-2 text-cinema-gold text-xs font-mono">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering frame...</span>
                  </div>
                )}
              </div>

              {/* Camera Motion Selector */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-mono uppercase text-cinema-500 shrink-0">
                  Camera:
                </span>
                <select
                  value={frame.cameraMotion}
                  onChange={(e) => {
                    onUpdateSceneFrame(idx, {
                      ...frame,
                      cameraMotion: e.target.value as StoryboardFrame['cameraMotion'],
                    });
                  }}
                  className="flex-1 bg-cinema-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-cinema-gold/40"
                >
                  <option value="slow_push_in">Slow Push-In (Zoom)</option>
                  <option value="pan_left">Pan Left</option>
                  <option value="pan_right">Pan Right</option>
                  <option value="tilt_up">Tilt Up</option>
                  <option value="static_wide">Static Wide Shot</option>
                </select>
              </div>

              {/* Action Buttons for Frame */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRegenerateFrame(idx, true)}
                  disabled={isLoading}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-cinema-gold font-mono text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors border border-white/5"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>AI Regenerate</span>
                </button>

                <button
                  onClick={() => setEditingUrlIdx(editingUrlIdx === idx ? null : idx)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cinema-400 hover:text-white transition-colors border border-white/5"
                  title="Custom Image URL"
                >
                  <Link className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Custom URL Input Box */}
              {editingUrlIdx === idx && (
                <div className="mt-3 pt-3 border-t border-white/5 flex gap-2 animate-fade-in">
                  <input
                    type="text"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="Paste image URL (https://...)"
                    className="flex-1 bg-cinema-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-cinema-gold/40"
                  />
                  <button
                    onClick={() => handleSaveCustomUrl(idx)}
                    className="px-3 py-1 bg-cinema-gold text-black rounded-lg text-xs font-mono font-semibold"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
