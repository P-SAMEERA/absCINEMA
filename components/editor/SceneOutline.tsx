'use client';

import React from 'react';
import { Scene } from '../../engine/types';
import { Clock, Users } from 'lucide-react';

interface SceneOutlineProps {
  scenes: Scene[];
  activeSceneIndex: number;
  onSelectScene: (idx: number) => void;
}

export const SceneOutline: React.FC<SceneOutlineProps> = ({
  scenes,
  activeSceneIndex,
  onSelectScene,
}) => {
  return (
    <div className="flex flex-col h-full bg-cinema-900/60 border-r border-white/5 backdrop-blur-md">
      <div className="px-4 py-3.5 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-xs font-mono tracking-[0.2em] uppercase text-cinema-300 font-semibold">
          Scenes ({scenes.length})
        </h3>
        <span className="text-[10px] font-mono text-cinema-500 uppercase">Outline</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {scenes.map((scene, idx) => {
          const isSelected = idx === activeSceneIndex;
          const isExt = scene.environment === 'EXT';

          return (
            <button
              key={`${scene.id}-${idx}`}
              onClick={() => onSelectScene(idx)}
              className={`w-full text-left p-3 rounded-xl transition-all border group ${
                isSelected
                  ? 'bg-cinema-gold/10 border-cinema-gold/30 text-white shadow-lg shadow-amber-500/5'
                  : 'border-transparent hover:bg-white/5 text-cinema-300 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                    isExt
                      ? 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
                      : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                  }`}
                >
                  {scene.environment}
                </span>

                <div className="flex items-center gap-1 text-[10px] font-mono text-cinema-400">
                  <Clock className="w-3 h-3 text-cinema-500" />
                  <span>{scene.timeOfDay}</span>
                </div>
              </div>

              <div className="font-mono text-xs font-semibold tracking-wide text-cinema-100 line-clamp-1 mb-1.5">
                {scene.location}
              </div>

              <div className="flex items-center justify-between text-[10px] text-cinema-400 font-mono mb-1.5">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-cinema-500" />
                  <span>{scene.characters.length} chars</span>
                </span>
                <span>{scene.beats.length} beats</span>
              </div>

              {scene.ambience && (
                <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-cinema-500">
                  <span className="text-cinema-cyan flex items-center gap-1 line-clamp-1">
                    <span>🎧</span>
                    <span>{scene.ambience.replace(/_/g, ' ')}</span>
                  </span>
                  {scene.storyboardFrame && <span title="Storyboard ready">🖼️</span>}
                </div>
              )}
            </button>
          );
        })}

        {scenes.length === 0 && (
          <div className="text-center py-8 text-cinema-500 text-xs font-mono">
            No scenes detected.
            <br />
            Type <span className="text-cinema-amber">EXT.</span> or <span className="text-cinema-amber">INT.</span> to create one.
          </div>
        )}
      </div>
    </div>
  );
};
