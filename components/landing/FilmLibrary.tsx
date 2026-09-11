'use client';

import React from 'react';
import { CinemaDocument } from '../../engine/types';
import { DIRECTOR_PRESETS } from '../../engine/director/presets';
import { Film, Play, Edit3, Trash2, Plus, Clock, Users, Sparkles } from 'lucide-react';

interface FilmLibraryProps {
  films: CinemaDocument[];
  onPlayFilm: (film: CinemaDocument) => void;
  onEditFilm: (film: CinemaDocument) => void;
  onCreateFilm: () => void;
  onDeleteFilm: (filmId: string) => void;
  onBackToLanding: () => void;
}

export const FilmLibrary: React.FC<FilmLibraryProps> = ({
  films,
  onPlayFilm,
  onEditFilm,
  onCreateFilm,
  onDeleteFilm,
  onBackToLanding,
}) => {
  return (
    <div className="min-h-screen bg-[#07080a] text-cinema-100 flex flex-col relative overflow-x-hidden">
      {/* Film Grain Texture */}
      <div className="film-grain" />

      {/* Top Navigation */}
      <header className="border-b border-white/5 bg-cinema-950/60 backdrop-blur-md px-6 md:px-12 py-4 flex items-center justify-between z-20">
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-2 group focus:outline-none"
        >
          <Film className="w-5 h-5 text-cinema-gold transition-transform group-hover:rotate-12" />
          <span className="font-mono text-sm md:text-base font-bold tracking-[0.3em] uppercase text-white">
            absCinema
          </span>
        </button>

        <button
          onClick={onCreateFilm}
          className="px-4 py-2 rounded-lg bg-cinema-gold text-cinema-950 font-mono text-xs font-bold tracking-widest uppercase flex items-center gap-1.5 hover:bg-amber-400 active:scale-95 transition-all shadow-lg shadow-amber-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Create Film</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-10 z-20">
        {/* Section Header */}
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <div className="text-xs font-mono tracking-[0.3em] uppercase text-cinema-500 mb-1">
              Screenplay Vault
            </div>
            <h2 className="font-mono text-2xl md:text-3xl font-bold tracking-[0.2em] uppercase text-white">
              Your Films
            </h2>
          </div>
          <span className="text-xs font-mono text-cinema-400">
            {films.length} {films.length === 1 ? 'project' : 'projects'}
          </span>
        </div>

        {/* Films Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create New Film Card */}
          <button
            onClick={onCreateFilm}
            className="group min-h-[260px] border border-dashed border-white/10 hover:border-cinema-gold/40 rounded-2xl p-6 bg-cinema-900/20 hover:bg-cinema-900/40 transition-all flex flex-col items-center justify-center text-center focus:outline-none"
          >
            <div className="w-12 h-12 rounded-full border border-white/10 group-hover:border-cinema-gold/40 flex items-center justify-center text-cinema-400 group-hover:text-cinema-gold transition-colors mb-4 group-hover:scale-110">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-mono text-sm font-semibold tracking-widest uppercase text-cinema-300 group-hover:text-white">
              Create New Film
            </span>
            <span className="text-xs text-cinema-500 font-mono mt-1">
              Start writing or import a screenplay
            </span>
          </button>

          {/* Existing Films */}
          {films.map((film, index) => {
            const style = DIRECTOR_PRESETS[film.directorStyle] || DIRECTOR_PRESETS.noir_cold;

            return (
              <div
                key={`${film.id}-${index}`}
                className="bg-cinema-900/50 border border-white/5 hover:border-white/15 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between group"
              >
                {/* Visual Header / Poster Preview */}
                <div
                  className="h-32 w-full relative overflow-hidden flex flex-col justify-between p-4"
                  style={{
                    background: `linear-gradient(135deg, ${style.colorPalette.ambientLight}, #060709)`,
                  }}
                >
                  <div className="flex items-center justify-between z-10">
                    <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-black/60 text-cinema-gold border border-cinema-gold/20">
                      Film #{String(index + 1).padStart(3, '0')}
                    </span>

                    <span className="text-[10px] font-mono tracking-widest uppercase text-cinema-300 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded">
                      <Sparkles className="w-3 h-3 text-cinema-gold" />
                      {style.name.split(' ')[0]}
                    </span>
                  </div>

                  <div className="z-10">
                    <h3 className="font-mono text-lg font-bold text-white tracking-wider line-clamp-1 group-hover:text-cinema-gold transition-colors">
                      {film.title}
                    </h3>
                    <p className="text-xs text-cinema-400 font-mono line-clamp-1">
                      by {film.author}
                    </p>
                  </div>

                  {/* Gradient shadow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-cinema-900/90 to-transparent" />
                </div>

                {/* Details Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-cinema-300 font-serif italic line-clamp-2 mb-4 leading-relaxed">
                    {film.logline || 'A cinematic screenplay ready for performance.'}
                  </p>

                  <div className="flex items-center justify-between text-xs font-mono text-cinema-400 border-t border-white/5 pt-3 mb-4">
                    <span className="flex items-center gap-1">
                      <Film className="w-3.5 h-3.5 text-cinema-500" />
                      <span>{film.scenes.length} scenes</span>
                    </span>

                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-cinema-500" />
                      <span>{film.characters.length} characters</span>
                    </span>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onPlayFilm(film)}
                      className="flex-1 py-2.5 rounded-xl bg-cinema-gold hover:bg-amber-400 text-cinema-950 font-mono text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/10 active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Cinema</span>
                    </button>

                    <button
                      onClick={() => onEditFilm(film)}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-cinema-300 hover:text-white transition-colors"
                      title="Edit in Studio"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteFilm(film.id)}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-950/40 text-cinema-500 hover:text-rose-400 transition-colors"
                      title="Delete Film"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
