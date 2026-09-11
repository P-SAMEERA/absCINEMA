'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CinemaDocument, AmbienceType, StoryboardFrame } from '../engine/types';
import {
  getStoredFilms,
  saveFilm,
  deleteFilm,
  createNewFilm,
  getActiveFilmId,
  setActiveFilmId,
} from '../lib/storage';
import { parseScreenplay } from '../engine/parser/screenplayParser';
import { directScreenplay } from '../engine/director/directorEngine';
import { enrichScreenplayAmbiences } from '../engine/director/ambienceIntelligence';
import { createStoryboardFrameForScene } from '../engine/storyboard/storyboardProvider';
import { DIRECTOR_PRESETS } from '../engine/director/presets';
import { SAMPLE_SCRIPTS } from '../engine/samples/sampleScripts';

import { LandingHero } from '../components/landing/LandingHero';
import { FilmLibrary } from '../components/landing/FilmLibrary';
import { ScreenplayEditor } from '../components/editor/ScreenplayEditor';
import { SceneOutline } from '../components/editor/SceneOutline';
import { DirectorPanel } from '../components/editor/DirectorPanel';
import { StoryboardDrawer } from '../components/editor/StoryboardDrawer';
import { AmbienceDrawer } from '../components/editor/AmbienceDrawer';
import { McpHubDrawer } from '../components/editor/McpHubDrawer';
import { CinemaPlayer } from '../components/cinema/CinemaPlayer';
import { Film, ArrowLeft, Camera, Radio, Cpu } from 'lucide-react';

type AppView = 'LANDING' | 'LIBRARY' | 'STUDIO' | 'CINEMA';
type StudioDrawer = 'NONE' | 'STORYBOARDS' | 'AMBIENCE' | 'MCP';

export default function AbsCinemaApp() {
  const [view, setView] = useState<AppView>('LANDING');
  const [activeDrawer, setActiveDrawer] = useState<StudioDrawer>('NONE');
  const [films, setFilms] = useState<CinemaDocument[]>([]);
  const [activeFilm, setActiveFilm] = useState<CinemaDocument | null>(null);

  // Studio local edit states
  const [editorText, setEditorText] = useState<string>('');
  const [editorTitle, setEditorTitle] = useState<string>('');
  const [editorAuthor, setEditorAuthor] = useState<string>('');
  const [selectedStyleId, setSelectedStyleId] = useState<string>('noir_cold');
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);

  // Overrides for scenes (ambiences, frames)
  const [customSceneAmbiences, setCustomSceneAmbiences] = useState<Record<string, AmbienceType>>({});
  const [customSceneFrames, setCustomSceneFrames] = useState<Record<string, StoryboardFrame>>({});

  // Initial load
  useEffect(() => {
    const loaded = getStoredFilms();
    setFilms(loaded);

    const activeId = getActiveFilmId();
    if (activeId) {
      const found = loaded.find((f) => f.id === activeId);
      if (found) {
        setActiveFilm(found);
        setEditorText(found.rawScreenplay);
        setEditorTitle(found.title);
        setEditorAuthor(found.author);
        setSelectedStyleId(found.directorStyle || 'noir_cold');
      }
    } else if (loaded.length > 0) {
      const first = loaded[0];
      setActiveFilm(first);
      setEditorText(first.rawScreenplay);
      setEditorTitle(first.title);
      setEditorAuthor(first.author);
      setSelectedStyleId(first.directorStyle || 'noir_cold');
    }
  }, []);

  // Parse editor text live into structured CinemaDocument
  const liveParsedDoc: CinemaDocument = useMemo(() => {
    if (!editorText) {
      return (
        activeFilm || {
          id: 'temp',
          title: editorTitle || 'Untitled',
          author: editorAuthor || 'Anonymous',
          directorStyle: selectedStyleId,
          characters: [],
          scenes: [],
          rawScreenplay: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
      );
    }

    const parsed = parseScreenplay(editorText, {
      title: editorTitle,
      author: editorAuthor,
      directorStyle: selectedStyleId,
    });

    if (activeFilm) {
      parsed.id = activeFilm.id;
    }

    // Apply custom scene overrides (ambiences, storyboard frames)
    parsed.scenes.forEach((scene) => {
      if (customSceneAmbiences[scene.id]) {
        scene.ambience = customSceneAmbiences[scene.id];
      }
      if (customSceneFrames[scene.id]) {
        scene.storyboardFrame = customSceneFrames[scene.id];
      }
    });

    return parsed;
  }, [
    editorText,
    editorTitle,
    editorAuthor,
    selectedStyleId,
    activeFilm,
    customSceneAmbiences,
    customSceneFrames,
  ]);

  // Directed doc for runtime estimation
  const directedDoc = useMemo(() => {
    return directScreenplay(liveParsedDoc, selectedStyleId);
  }, [liveParsedDoc, selectedStyleId]);

  // Auto-save debouncer
  useEffect(() => {
    if (!activeFilm || !editorText) return;

    const timer = setTimeout(() => {
      const updated: CinemaDocument = {
        ...liveParsedDoc,
        id: activeFilm.id,
        rawScreenplay: editorText,
        title: editorTitle,
        author: editorAuthor,
        directorStyle: selectedStyleId,
        updatedAt: Date.now(),
      };
      saveFilm(updated);
      setFilms((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    }, 800);

    return () => clearTimeout(timer);
  }, [editorText, editorTitle, editorAuthor, selectedStyleId, liveParsedDoc, activeFilm]);

  // Handlers
  const handleOpenStudio = (film: CinemaDocument) => {
    setActiveFilm(film);
    setActiveFilmId(film.id);
    setEditorText(film.rawScreenplay);
    setEditorTitle(film.title);
    setEditorAuthor(film.author);
    setSelectedStyleId(film.directorStyle || 'noir_cold');
    setActiveDrawer('NONE');
    setView('STUDIO');
  };

  const handleLaunchCinemaFromLibrary = (film: CinemaDocument) => {
    handleOpenStudio(film);
    setView('CINEMA');
  };

  const handleCreateFilm = () => {
    const newDoc = createNewFilm(`Film #${String(films.length + 1).padStart(3, '0')}`);
    setFilms((prev) => [newDoc, ...prev]);
    handleOpenStudio(newDoc);
  };

  const handleDeleteFilm = (filmId: string) => {
    deleteFilm(filmId);
    setFilms((prev) => prev.filter((f) => f.id !== filmId));
    if (activeFilm?.id === filmId) {
      setActiveFilm(null);
    }
  };

  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_SCRIPTS.find((s) => s.id === sampleId);
    if (!sample) return;

    setEditorText(sample.script);
    setEditorTitle(sample.title);
    setEditorAuthor(sample.author);
    setSelectedStyleId(sample.directorStyle);
    setCustomSceneAmbiences({});
    setCustomSceneFrames({});

    if (activeFilm) {
      const updated: CinemaDocument = {
        ...activeFilm,
        title: sample.title,
        author: sample.author,
        directorStyle: sample.directorStyle,
        rawScreenplay: sample.script,
      };
      saveFilm(updated);
      setActiveFilm(updated);
    }
  };

  // Ambience intelligence feedback loop
  const handleRunAmbienceFeedbackLoop = () => {
    const { enrichedDoc } = enrichScreenplayAmbiences(liveParsedDoc);
    const updatedAmbiences: Record<string, AmbienceType> = {};
    enrichedDoc.scenes.forEach((s) => {
      if (s.ambience) {
        updatedAmbiences[s.id] = s.ambience;
      }
    });
    setCustomSceneAmbiences((prev) => ({ ...prev, ...updatedAmbiences }));
  };

  const handleUpdateSceneAmbience = (sceneIdx: number, ambience: AmbienceType) => {
    const scene = liveParsedDoc.scenes[sceneIdx];
    if (!scene) return;
    setCustomSceneAmbiences((prev) => ({
      ...prev,
      [scene.id]: ambience,
    }));
  };

  // Storyboard handlers
  const handleUpdateSceneFrame = (sceneIdx: number, frame: StoryboardFrame) => {
    const scene = liveParsedDoc.scenes[sceneIdx];
    if (!scene) return;
    setCustomSceneFrames((prev) => ({
      ...prev,
      [scene.id]: frame,
    }));
  };

  const handleBatchGenerateFrames = (forceAI: boolean) => {
    const activeStyle = DIRECTOR_PRESETS[selectedStyleId] || DIRECTOR_PRESETS.noir_cold;
    const newFrames: Record<string, StoryboardFrame> = {};
    liveParsedDoc.scenes.forEach((scene) => {
      newFrames[scene.id] = createStoryboardFrameForScene(scene, activeStyle, forceAI);
    });
    setCustomSceneFrames((prev) => ({ ...prev, ...newFrames }));
  };

  // 1. Landing View
  if (view === 'LANDING') {
    return (
      <LandingHero
        onEnterCinema={() => {
          setView('LIBRARY');
        }}
      />
    );
  }

  // 2. Cinema View (Pure Experience Mode)
  if (view === 'CINEMA') {
    return (
      <CinemaPlayer
        document={liveParsedDoc}
        initialStyleId={selectedStyleId}
        onExit={() => setView('STUDIO')}
      />
    );
  }

  // 3. Film Library View
  if (view === 'LIBRARY') {
    return (
      <FilmLibrary
        films={films}
        onPlayFilm={handleLaunchCinemaFromLibrary}
        onEditFilm={handleOpenStudio}
        onCreateFilm={handleCreateFilm}
        onDeleteFilm={handleDeleteFilm}
        onBackToLanding={() => setView('LANDING')}
      />
    );
  }

  // 4. Studio View (Screenplay Editor + Outline + Director Panel + Storyboards + Ambience Feedback)
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#07080a] text-cinema-100">
      {/* Studio Header */}
      <header className="h-12 border-b border-white/5 bg-cinema-950/80 backdrop-blur-md px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('LIBRARY')}
            className="text-xs font-mono text-cinema-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Vault</span>
          </button>

          <div className="h-4 w-[1px] bg-white/10" />

          <div className="flex items-center gap-1.5">
            <Film className="w-4 h-4 text-cinema-gold" />
            <span className="font-mono text-xs font-bold tracking-widest uppercase text-white">
              Studio
            </span>
          </div>
        </div>

        {/* Center: Title & Studio Quick Tabs */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-cinema-300 tracking-wider hidden sm:inline font-semibold">
            {editorTitle}
          </span>

          <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5">
            <button
              onClick={() => setActiveDrawer('NONE')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                activeDrawer === 'NONE'
                  ? 'bg-cinema-gold text-black font-semibold'
                  : 'text-cinema-400 hover:text-white'
              }`}
            >
              Script
            </button>

            <button
              onClick={() => setActiveDrawer('STORYBOARDS')}
              className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1 transition-colors ${
                activeDrawer === 'STORYBOARDS'
                  ? 'bg-cinema-gold text-black font-semibold'
                  : 'text-cinema-400 hover:text-white'
              }`}
            >
              <Camera className="w-3 h-3" />
              <span>Storyboards</span>
            </button>

            <button
              onClick={() => setActiveDrawer('AMBIENCE')}
              className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1 transition-colors ${
                activeDrawer === 'AMBIENCE'
                  ? 'bg-cinema-gold text-black font-semibold'
                  : 'text-cinema-400 hover:text-white'
              }`}
            >
              <Radio className="w-3 h-3" />
              <span>Ambience AI</span>
            </button>

            <button
              onClick={() => setActiveDrawer('MCP')}
              className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1 transition-colors ${
                activeDrawer === 'MCP'
                  ? 'bg-cinema-cyan text-black font-semibold'
                  : 'text-cinema-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3 h-3" />
              <span>MCP</span>
            </button>
          </div>
        </div>

        {/* Right: Quick Launch Cinema */}
        <button
          onClick={() => setView('CINEMA')}
          className="px-4 py-1.5 rounded-lg bg-cinema-gold hover:bg-amber-400 text-cinema-950 font-mono text-xs font-bold tracking-widest uppercase flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10 active:scale-95"
        >
          <span>Cinema Mode</span>
          <span>▶</span>
        </button>
      </header>

      {/* Main Studio Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Column: Scene Outline */}
        <div className="w-64 hidden md:block h-full">
          <SceneOutline
            scenes={liveParsedDoc.scenes}
            activeSceneIndex={activeSceneIndex}
            onSelectScene={(idx) => setActiveSceneIndex(idx)}
          />
        </div>

        {/* Center Column: Screenplay Editor */}
        <div className="flex-1 h-full overflow-hidden">
          <ScreenplayEditor
            rawText={editorText}
            onChangeText={setEditorText}
            title={editorTitle}
            onChangeTitle={setEditorTitle}
            author={editorAuthor}
            onChangeAuthor={setEditorAuthor}
            onLoadSample={handleLoadSample}
          />
        </div>

        {/* Right Column: Creative Director Panel (Default) */}
        {activeDrawer === 'NONE' && (
          <div className="w-80 hidden lg:block h-full">
            <DirectorPanel
              selectedStyle={DIRECTOR_PRESETS[selectedStyleId] || DIRECTOR_PRESETS.noir_cold}
              onSelectStyle={setSelectedStyleId}
              onLaunchCinema={() => setView('CINEMA')}
              onOpenStoryboard={() => setActiveDrawer('STORYBOARDS')}
              onOpenAmbience={() => setActiveDrawer('AMBIENCE')}
              estimatedRuntimeSeconds={directedDoc.totalRuntimeSeconds}
            />
          </div>
        )}

        {/* Storyboard Drawer */}
        {activeDrawer === 'STORYBOARDS' && (
          <div className="w-full max-w-lg h-full absolute right-0 top-0 bottom-0 z-40 animate-fade-in shadow-2xl">
            <StoryboardDrawer
              scenes={liveParsedDoc.scenes}
              style={DIRECTOR_PRESETS[selectedStyleId] || DIRECTOR_PRESETS.noir_cold}
              onUpdateSceneFrame={handleUpdateSceneFrame}
              onBatchGenerateFrames={handleBatchGenerateFrames}
              onClose={() => setActiveDrawer('NONE')}
            />
          </div>
        )}

        {/* Ambience Feedback Loop Drawer */}
        {activeDrawer === 'AMBIENCE' && (
          <div className="w-full max-w-md h-full absolute right-0 top-0 bottom-0 z-40 animate-fade-in shadow-2xl">
            <AmbienceDrawer
              scenes={liveParsedDoc.scenes}
              onUpdateSceneAmbience={handleUpdateSceneAmbience}
              onRunFeedbackLoop={handleRunAmbienceFeedbackLoop}
              onClose={() => setActiveDrawer('NONE')}
            />
          </div>
        )}

        {/* MCP Studio Drawer */}
        {activeDrawer === 'MCP' && (
          <div className="w-full max-w-md h-full absolute right-0 top-0 bottom-0 z-40 animate-fade-in shadow-2xl">
            <McpHubDrawer
              document={liveParsedDoc}
              selectedStyleId={selectedStyleId}
              onUpdateSceneFrame={handleUpdateSceneFrame}
              onUpdateSceneAmbience={handleUpdateSceneAmbience}
              onClose={() => setActiveDrawer('NONE')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
