'use client';

import React, { useState } from 'react';
import { X, Cpu, Sparkles, Radio, FileText, Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { CinemaDocument, AmbienceType, StoryboardFrame } from '../../engine/types';
import { DIRECTOR_PRESETS } from '../../engine/director/presets';

interface McpHubDrawerProps {
  document: CinemaDocument;
  selectedStyleId: string;
  onUpdateSceneFrame: (sceneIdx: number, frame: StoryboardFrame) => void;
  onUpdateSceneAmbience: (sceneIdx: number, ambience: AmbienceType) => void;
  onClose: () => void;
}

type ToolStatus = 'idle' | 'running' | 'success' | 'error';

interface ToolResult {
  tool: string;
  status: ToolStatus;
  data?: unknown;
  error?: string;
}

// ─── MCP Client (calls our Next.js proxy) ────────────────────────────────────

async function callMcpTool(tool: string, args: Record<string, unknown>): Promise<unknown> {
  const res = await fetch('/api/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, args }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.result;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatusIcon: React.FC<{ status: ToolStatus }> = ({ status }) => {
  if (status === 'running') return <Loader2 className="w-3.5 h-3.5 animate-spin text-cinema-cyan" />;
  if (status === 'success') return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
  if (status === 'error') return <AlertCircle className="w-3.5 h-3.5 text-rose-400" />;
  return null;
};

const ResultBlock: React.FC<{ result: ToolResult }> = ({ result }) => {
  const [open, setOpen] = useState(false);
  if (result.status === 'idle' || result.status === 'running') return null;

  return (
    <div
      className={`mt-2 rounded-lg border text-xs font-mono overflow-hidden ${
        result.status === 'error'
          ? 'border-rose-500/30 bg-rose-950/20'
          : 'border-emerald-500/20 bg-emerald-950/10'
      }`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/5 transition-colors"
      >
        <span className={result.status === 'error' ? 'text-rose-300' : 'text-emerald-300'}>
          {result.status === 'error' ? '✗ Error' : '✓ Result'}
        </span>
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      {open && (
        <pre className="px-3 pb-3 text-[10px] text-cinema-300 overflow-auto max-h-64 whitespace-pre-wrap break-all">
          {result.status === 'error'
            ? result.error
            : JSON.stringify(result.data, null, 2)}
        </pre>
      )}
    </div>
  );
};

// ─── Main Drawer ─────────────────────────────────────────────────────────────

export const McpHubDrawer: React.FC<McpHubDrawerProps> = ({
  document,
  selectedStyleId,
  onUpdateSceneFrame,
  onUpdateSceneAmbience,
  onClose,
}) => {
  const [analyzeResult, setAnalyzeResult] = useState<ToolResult>({ tool: 'analyze', status: 'idle' });
  const [storyboardResults, setStoryboardResults] = useState<Record<number, ToolResult>>({});
  const [ambienceResults, setAmbienceResults] = useState<Record<number, ToolResult>>({});
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  const activeStyle = DIRECTOR_PRESETS[selectedStyleId] || DIRECTOR_PRESETS.noir_cold;

  // ── Analyze Script ──────────────────────────────────────────────────────────
  const handleAnalyzeScript = async () => {
    setAnalyzeResult({ tool: 'analyze', status: 'running' });
    try {
      const data = await callMcpTool('analyze_screenplay_script', {
        screenplay_text: document.rawScreenplay,
        analysis_depth: 'full',
      });
      setAnalyzeResult({ tool: 'analyze', status: 'success', data });
    } catch (e) {
      setAnalyzeResult({ tool: 'analyze', status: 'error', error: String(e) });
    }
  };

  // ── Generate Single Scene Frame via MCP ─────────────────────────────────────
  const handleGenerateFrame = async (sceneIdx: number) => {
    const scene = document.scenes[sceneIdx];
    if (!scene) return;

    setStoryboardResults((prev) => ({ ...prev, [sceneIdx]: { tool: 'storyboard', status: 'running' } }));
    try {
      const data = await callMcpTool('generate_scene_storyboard', {
        scene_heading: scene.heading,
        scene_description: scene.beats
          .filter((b) => b.type !== 'DIALOGUE' && b.type !== 'TRANSITION')
          .slice(0, 3)
          .map((b) => b.rawText)
          .join(' '),
        director_style: selectedStyleId,
        camera_motion: 'slow_push_in',
      }) as { imageUrl: string; caption: string; cameraMotion: string };

      setStoryboardResults((prev) => ({ ...prev, [sceneIdx]: { tool: 'storyboard', status: 'success', data } }));

      // Apply frame to scene
      onUpdateSceneFrame(sceneIdx, {
        id: `mcp-frame-${scene.id}`,
        imageUrl: data.imageUrl,
        caption: data.caption,
        cameraMotion: data.cameraMotion as StoryboardFrame['cameraMotion'],
        source: 'ai_generated',
      });
    } catch (e) {
      setStoryboardResults((prev) => ({ ...prev, [sceneIdx]: { tool: 'storyboard', status: 'error', error: String(e) } }));
    }
  };

  // ── Generate All Frames via MCP (sequential to avoid rate limits) ────────────
  const handleGenerateAllFrames = async () => {
    const scenes = document.scenes;
    setBatchProgress({ current: 0, total: scenes.length });
    for (let i = 0; i < scenes.length; i++) {
      await handleGenerateFrame(i);
      setBatchProgress({ current: i + 1, total: scenes.length });
      // Small delay to avoid hammering the image API
      await new Promise((r) => setTimeout(r, 400));
    }
    setBatchProgress(null);
  };

  // ── Get Ambience via MCP ─────────────────────────────────────────────────────
  const handleDirectAmbience = async (sceneIdx: number) => {
    const scene = document.scenes[sceneIdx];
    if (!scene) return;

    setAmbienceResults((prev) => ({ ...prev, [sceneIdx]: { tool: 'ambience', status: 'running' } }));
    try {
      const data = await callMcpTool('direct_ambience_soundscape', {
        scene_heading: scene.heading,
        scene_description: scene.beats
          .slice(0, 4)
          .map((b) => b.rawText)
          .join(' '),
        int_ext: scene.environment,
        time_of_day: scene.timeOfDay,
      }) as { ambience: AmbienceType; confidence: number; rationale: string };

      setAmbienceResults((prev) => ({ ...prev, [sceneIdx]: { tool: 'ambience', status: 'success', data } }));
      onUpdateSceneAmbience(sceneIdx, data.ambience);
    } catch (e) {
      setAmbienceResults((prev) => ({ ...prev, [sceneIdx]: { tool: 'ambience', status: 'error', error: String(e) } }));
    }
  };

  // ── Direct All Ambiences ─────────────────────────────────────────────────────
  const handleDirectAllAmbiences = async () => {
    for (let i = 0; i < document.scenes.length; i++) {
      await handleDirectAmbience(i);
    }
  };

  return (
    <div className="h-full flex flex-col bg-cinema-950/97 border-l border-white/8 backdrop-blur-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cinema-cyan" />
          <span className="font-mono text-xs font-bold tracking-widest uppercase text-cinema-cyan">MCP Studio</span>
          <span className="text-[10px] font-mono text-cinema-500 tracking-widest">· abscinema server</span>
        </div>
        <button onClick={onClose} className="p-1 text-cinema-400 hover:text-white transition-colors rounded hover:bg-white/5">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Server status badge */}
      <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] font-mono text-cinema-400">mcp-server/index.mjs · 3 tools</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">

        {/* ── Tool 1: Analyze Script ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-cinema-gold" />
            <span className="font-mono text-xs font-semibold text-white">analyze_screenplay_script</span>
            <StatusIcon status={analyzeResult.status} />
          </div>
          <p className="text-[10px] text-cinema-400 font-mono leading-relaxed">
            Deep NLP breakdown — characters, tone, pacing, ambience recs, estimated screentime.
          </p>
          <button
            onClick={handleAnalyzeScript}
            disabled={analyzeResult.status === 'running'}
            className="w-full py-2 px-3 rounded-lg bg-cinema-gold/10 border border-cinema-gold/20 hover:bg-cinema-gold/20 text-cinema-gold font-mono text-xs font-semibold tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {analyzeResult.status === 'running' ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing…</>
            ) : (
              'Analyze Script via MCP'
            )}
          </button>
          <ResultBlock result={analyzeResult} />
        </div>

        <div className="h-px bg-white/5" />

        {/* ── Tool 2: Generate All Storyboard Frames ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cinema-cyan" />
            <span className="font-mono text-xs font-semibold text-white">generate_scene_storyboard</span>
          </div>
          <p className="text-[10px] text-cinema-400 font-mono leading-relaxed">
            Generates AI storyboard frames via Pollinations for each scene, using the <span className="text-cinema-gold">{activeStyle.name}</span> vision.
          </p>

          {batchProgress && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-cinema-400">
                <span>Generating frames…</span>
                <span>{batchProgress.current} / {batchProgress.total}</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cinema-cyan rounded-full transition-all duration-300"
                  style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleGenerateAllFrames}
            disabled={!!batchProgress}
            className="w-full py-2 px-3 rounded-lg bg-cinema-cyan/10 border border-cinema-cyan/20 hover:bg-cinema-cyan/20 text-cinema-cyan font-mono text-xs font-semibold tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {batchProgress ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {batchProgress.current}/{batchProgress.total} frames…</>
            ) : (
              `Generate All ${document.scenes.length} Frames`
            )}
          </button>
        </div>

        <div className="h-px bg-white/5" />

        {/* ── Tool 3: Direct All Ambiences ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-violet-400" />
            <span className="font-mono text-xs font-semibold text-white">direct_ambience_soundscape</span>
          </div>
          <p className="text-[10px] text-cinema-400 font-mono leading-relaxed">
            Lets the MCP server analyze each scene and assign an acoustic ambience profile — all {document.scenes.length} scenes in one shot.
          </p>
          <button
            onClick={handleDirectAllAmbiences}
            className="w-full py-2 px-3 rounded-lg bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 text-violet-300 font-mono text-xs font-semibold tracking-widest uppercase transition-all flex items-center justify-center gap-2"
          >
            Direct All Ambiences via MCP
          </button>
        </div>

        <div className="h-px bg-white/5" />

        {/* ── Per-Scene Controls ── */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-cinema-500 border-b border-white/5 pb-1">
            Per-Scene MCP Actions
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {document.scenes.map((scene, idx) => {
              const sbStatus = storyboardResults[idx]?.status || 'idle';
              const ambStatus = ambienceResults[idx]?.status || 'idle';
              return (
                <div key={scene.id} className="bg-white/3 border border-white/6 rounded-lg px-3 py-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-cinema-300 truncate max-w-[60%]">
                      <span className="text-cinema-500 mr-1">{String(idx + 1).padStart(2, '0')}.</span>
                      {scene.heading}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleGenerateFrame(idx)}
                        disabled={sbStatus === 'running'}
                        title="Generate storyboard frame via MCP"
                        className="p-1 rounded hover:bg-cinema-cyan/10 text-cinema-cyan/60 hover:text-cinema-cyan transition-colors disabled:opacity-30"
                      >
                        {sbStatus === 'running' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : sbStatus === 'success' ? (
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDirectAmbience(idx)}
                        disabled={ambStatus === 'running'}
                        title="Direct ambience via MCP"
                        className="p-1 rounded hover:bg-violet-500/10 text-violet-400/60 hover:text-violet-400 transition-colors disabled:opacity-30"
                      >
                        {ambStatus === 'running' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : ambStatus === 'success' ? (
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Radio className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  {scene.storyboardFrame && (
                    <div className="flex items-center gap-1.5">
                      <img
                        src={scene.storyboardFrame.imageUrl}
                        alt={scene.storyboardFrame.caption}
                        className="w-12 h-7 object-cover rounded border border-white/10"
                        loading="lazy"
                      />
                      <span className="text-[9px] font-mono text-cinema-500 truncate">
                        {scene.storyboardFrame.source === 'mcp_generated' ? '⚡ MCP' : '◆ curated'}
                      </span>
                    </div>
                  )}
                  {scene.ambience && (
                    <span className="text-[9px] font-mono text-violet-300/70">
                      🎧 {scene.ambience.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
