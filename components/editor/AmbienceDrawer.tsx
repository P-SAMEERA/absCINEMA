'use client';

import React, { useState } from 'react';
import { Scene, AmbienceType } from '../../engine/types';
import { soundEngine } from '../../engine/audio/soundEngine';
import {
  Volume2,
  Square,
  Sparkles,
  Info,
  Radio,
} from 'lucide-react';

interface AmbienceDrawerProps {
  scenes: Scene[];
  onUpdateSceneAmbience: (sceneIdx: number, ambience: AmbienceType) => void;
  onRunFeedbackLoop: () => void;
  onClose: () => void;
}

const ALL_AMBIENCES: { id: AmbienceType; label: string; desc: string }[] = [
  { id: 'rain_downpour', label: 'Rain Downpour', desc: 'Heavy rain on asphalt & puddle droplets' },
  { id: 'thunderstorm', label: 'Thunderstorm', desc: 'Downpour with rolling thunder strikes' },
  { id: 'wind_howling', label: 'Howling Wind', desc: 'Whistling gusts & drafty winter wind' },
  { id: 'city_traffic', label: 'City Traffic', desc: 'Urban tire hum, vehicle sweeps & horns' },
  { id: 'cafe_ambience', label: 'Cafe & Diner', desc: 'Social murmur, cup clinks & espresso steam' },
  { id: 'night_crickets', label: 'Night Crickets', desc: 'Evening breeze & chirping nocturnal crickets' },
  { id: 'forest_birds', label: 'Forest & Birds', desc: 'Canopy wind & wild bird song trills' },
  { id: 'ocean_waves', label: 'Ocean Waves', desc: 'Rhythmic tidal surf crashing & foam wash' },
  { id: 'server_vault', label: 'Server Vault', desc: 'High-tech server fan whine & drive seek clicks' },
  { id: 'room_tone_intimate', label: 'Intimate Room', desc: 'Quiet interior room tone with gentle 60Hz warmth' },
  { id: 'creepy_horror', label: 'Horror Drone', desc: 'Sub-bass tension drone & dissonant friction' },
  { id: 'desert_winds', label: 'Desert Winds', desc: 'Dry sweeping wind across open wasteland' },
  { id: 'silent', label: 'Complete Silence', desc: 'Dead silence with zero ambient noise' },
];

export const AmbienceDrawer: React.FC<AmbienceDrawerProps> = ({
  scenes,
  onUpdateSceneAmbience,
  onRunFeedbackLoop,
  onClose,
}) => {
  const [playingAmbience, setPlayingAmbience] = useState<AmbienceType | null>(null);

  const handleTogglePreview = (type: AmbienceType) => {
    if (playingAmbience === type) {
      if (soundEngine) soundEngine.setAmbience('none');
      setPlayingAmbience(null);
    } else {
      if (soundEngine) {
        soundEngine.init();
        soundEngine.setAmbience(type);
      }
      setPlayingAmbience(type);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0c10] border-l border-white/10 p-6 overflow-y-auto w-full max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
        <div>
          <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-cinema-gold mb-1 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cinema-gold animate-pulse" />
            <span>AI Director Feedback Loop</span>
          </div>
          <h2 className="font-mono text-base font-bold uppercase text-white tracking-wider">
            Ambience Intelligence
          </h2>
        </div>

        <button
          onClick={onClose}
          className="text-xs font-mono text-cinema-400 hover:text-white px-2 py-1 rounded bg-white/5"
        >
          Close
        </button>
      </div>

      {/* Description & Action */}
      <div className="bg-cinema-900/60 border border-white/5 rounded-xl p-4 mb-6">
        <p className="text-xs text-cinema-300 leading-relaxed mb-4">
          absCinema analyzes your screenplay's locations, times, and sensory action lines to automatically schedule the exact acoustic environment and spot sound effects.
        </p>

        <button
          onClick={onRunFeedbackLoop}
          className="w-full py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-cinema-gold font-mono text-xs font-semibold tracking-widest uppercase flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <Sparkles className="w-3.5 h-3.5 text-cinema-gold" />
          <span>Re-Analyze Scene Ambiences</span>
        </button>
      </div>

      {/* Scene Ambience Cards List */}
      <div className="space-y-4 flex-1">
        {scenes.map((scene, idx) => {
          const currentAmb = scene.ambience || 'room_tone_intimate';
          const isPreviewing = playingAmbience === currentAmb;

          // Spot SFX count
          const spotSfxBeats = scene.beats.filter((b) => b.sfxCue);

          return (
            <div
              key={scene.id}
              className="bg-cinema-950/80 border border-white/5 hover:border-white/15 rounded-xl p-4 transition-all"
            >
              {/* Scene Number & Heading */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono tracking-widest uppercase text-cinema-gold font-semibold">
                  SCENE {String(scene.sceneNumber).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-mono text-cinema-400 uppercase">
                  {scene.environment} · {scene.timeOfDay}
                </span>
              </div>

              <div className="font-mono text-xs font-bold text-white mb-2 line-clamp-1">
                {scene.location}
              </div>

              {/* AI Guessed Rationale */}
              {scene.ambienceRationale && (
                <div className="flex items-start gap-1.5 text-[11px] text-cinema-400 bg-white/5 rounded-lg p-2 mb-3 leading-relaxed">
                  <Info className="w-3.5 h-3.5 text-cinema-cyan shrink-0 mt-0.5" />
                  <span>{scene.ambienceRationale}</span>
                </div>
              )}

              {/* Ambience Selector & Preview Button */}
              <div className="flex items-center gap-2 mb-3">
                <select
                  value={currentAmb}
                  onChange={(e) => onUpdateSceneAmbience(idx, e.target.value as AmbienceType)}
                  className="flex-1 bg-cinema-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cinema-gold/40"
                >
                  {ALL_AMBIENCES.map((amb) => (
                    <option key={amb.id} value={amb.id}>
                      {amb.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => handleTogglePreview(currentAmb)}
                  title={isPreviewing ? 'Stop Audition' : 'Preview Soundscape'}
                  className={`p-2 rounded-lg border transition-colors ${
                    isPreviewing
                      ? 'bg-cinema-gold text-black border-cinema-gold'
                      : 'bg-white/5 hover:bg-white/10 text-cinema-300 border-white/10'
                  }`}
                >
                  {isPreviewing ? <Square className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Spot SFX scheduled */}
              {spotSfxBeats.length > 0 && (
                <div className="pt-2 border-t border-white/5">
                  <span className="text-[10px] font-mono uppercase text-cinema-500 block mb-1">
                    Scheduled Spot SFX ({spotSfxBeats.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {spotSfxBeats.map((b) => (
                      <span
                        key={b.id}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/40 text-cinema-amber border border-amber-800/30"
                      >
                        ⚡ {b.sfxCue}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
