'use client';

import React, { useRef, useState } from 'react';
import { autoFormatScreenplay } from '../../engine/parser/autoFormat';
import { SAMPLE_SCRIPTS } from '../../engine/samples/sampleScripts';
import {
  Wand2,
  Download,
  Upload,
  BookOpen,
  HelpCircle,
  FileText,
  User,
  Scissors,
} from 'lucide-react';

interface ScreenplayEditorProps {
  rawText: string;
  onChangeText: (text: string) => void;
  title: string;
  onChangeTitle: (title: string) => void;
  author: string;
  onChangeAuthor: (author: string) => void;
  onLoadSample: (sampleId: string) => void;
}

export const ScreenplayEditor: React.FC<ScreenplayEditorProps> = ({
  rawText,
  onChangeText,
  title,
  onChangeTitle,
  author,
  onChangeAuthor,
  onLoadSample,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [showSamples, setShowSamples] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [formatNotice, setFormatNotice] = useState(false);

  // Quick insertion helpers
  const insertElement = (template: string, cursorOffset: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = rawText.substring(0, start);
    const after = rawText.substring(end);

    // Add newline before if not already at line start
    const prefix = before.length > 0 && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : '';
    const newContent = before + prefix + template + '\n\n' + after;

    onChangeText(newContent);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + prefix.length + cursorOffset;
      textarea.setSelectionRange(newPos, newPos);
    }, 10);
  };

  const handleAutoFormat = () => {
    const formatted = autoFormatScreenplay(rawText);
    onChangeText(formatted);
    setFormatNotice(true);
    setTimeout(() => setFormatNotice(false), 2500);
  };

  const handleExportTxt = () => {
    const blob = new Blob([rawText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}.fountain`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onChangeText(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Keyboard shortcut handler for textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key cycling / indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      const updated = val.substring(0, start) + '    ' + val.substring(end);
      onChangeText(updated);
      setTimeout(() => {
        textarea.setSelectionRange(start + 4, start + 4);
      }, 0);
    }

    // Ctrl + Enter: Insert new Scene Heading
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      insertElement('EXT. LOCATION - NIGHT\n', 5);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#08090c] relative">
      {/* Top Editor Toolbar */}
      <div className="border-b border-white/5 bg-cinema-900/40 px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        {/* Title & Author */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            className="bg-transparent font-mono text-sm md:text-base font-bold text-cinema-gold focus:outline-none focus:border-b border-cinema-gold/40 px-1 py-0.5"
            placeholder="Untitled Screenplay"
          />
          <span className="text-cinema-600 text-xs font-mono">•</span>
          <input
            type="text"
            value={author}
            onChange={(e) => onChangeAuthor(e.target.value)}
            className="bg-transparent font-mono text-xs text-cinema-400 focus:outline-none focus:border-b border-white/20 px-1 py-0.5"
            placeholder="Author Name"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick Screenplay Element Buttons */}
          <div className="hidden lg:flex items-center gap-1 mr-2 border-r border-white/10 pr-2">
            <button
              onClick={() => insertElement('EXT. LOCATION - EVENING', 5)}
              className="text-[11px] font-mono px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-cinema-300 hover:text-white transition-colors flex items-center gap-1"
              title="Insert Scene Heading (Ctrl+Enter)"
            >
              <FileText className="w-3 h-3 text-cinema-cyan" />
              <span>Scene</span>
            </button>
            <button
              onClick={() => insertElement('CHARACTER NAME\nDialogue line goes here.', 0)}
              className="text-[11px] font-mono px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-cinema-300 hover:text-white transition-colors flex items-center gap-1"
              title="Insert Character & Dialogue"
            >
              <User className="w-3 h-3 text-cinema-amber" />
              <span>Dialogue</span>
            </button>
            <button
              onClick={() => insertElement('CUT TO:', 7)}
              className="text-[11px] font-mono px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-cinema-300 hover:text-white transition-colors flex items-center gap-1"
              title="Insert Transition"
            >
              <Scissors className="w-3 h-3 text-cinema-crimson" />
              <span>Cut</span>
            </button>
          </div>

          {/* Auto Format */}
          <button
            onClick={handleAutoFormat}
            className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-cinema-200 hover:text-cinema-gold transition-colors flex items-center gap-1.5"
            title="Auto-format casual dialogue (e.g. 'rishi: where are you going?')"
          >
            <Wand2 className="w-3.5 h-3.5 text-cinema-gold" />
            <span>Auto-Format</span>
          </button>

          {/* Samples Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSamples(!showSamples)}
              className="text-xs font-mono px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-cinema-300 hover:text-white transition-colors flex items-center gap-1.5"
              title="Load Classic Sample Screenplays"
            >
              <BookOpen className="w-3.5 h-3.5 text-cinema-400" />
              <span className="hidden sm:inline">Samples</span>
            </button>

            {showSamples && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-cinema-900 border border-white/10 rounded-xl p-2 shadow-2xl z-50 animate-fade-in">
                <div className="text-[10px] font-mono uppercase tracking-widest text-cinema-400 px-3 py-1.5 border-b border-white/5">
                  Pre-Loaded Screenplays
                </div>
                <div className="space-y-1 mt-1">
                  {SAMPLE_SCRIPTS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        onLoadSample(s.id);
                        setShowSamples(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/5 text-cinema-200 hover:text-cinema-gold transition-colors flex flex-col"
                    >
                      <span className="font-semibold">{s.title}</span>
                      <span className="text-[10px] text-cinema-400 line-clamp-1">{s.logline}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Import / Export */}
          <label className="text-xs font-mono px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-cinema-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import</span>
            <input type="file" accept=".txt,.fountain" onChange={handleImportFile} className="hidden" />
          </label>

          <button
            onClick={handleExportTxt}
            className="text-xs font-mono px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-cinema-300 hover:text-white transition-colors flex items-center gap-1.5"
            title="Download Fountain/Text Script"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Shortcuts Help */}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="p-1.5 text-cinema-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            title="Keyboard Shortcuts"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Auto-format notice */}
      {formatNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-cinema-gold text-black font-mono text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg animate-fade-in">
          ✓ Screenplay structured and formatted!
        </div>
      )}

      {/* Shortcuts modal dialog */}
      {showShortcuts && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-cinema-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-cinema-gold mb-4">
              Screenplay Shortcuts & Syntax
            </h3>
            <div className="space-y-3 font-mono text-xs text-cinema-300">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white font-semibold">Ctrl + Enter</span>
                <span className="text-cinema-400">Insert new Scene Heading</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white font-semibold">Tab</span>
                <span className="text-cinema-400">Indent 4 spaces</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white font-semibold">SCENE HEADING</span>
                <span className="text-cinema-400">EXT. / INT. LOCATION - TIME</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white font-semibold">VOICE OVER</span>
                <span className="text-cinema-400">CHARACTER (V.O.)</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white font-semibold">OFF SCREEN</span>
                <span className="text-cinema-400">CHARACTER (O.S.)</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white font-semibold">TRANSITION</span>
                <span className="text-cinema-400">CUT TO: / FADE IN: / DISSOLVE TO:</span>
              </div>
            </div>
            <button
              onClick={() => setShowShortcuts(false)}
              className="mt-6 w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-mono text-xs uppercase tracking-widest transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Screenplay Writing Sheet (Courier 12pt / Classic Hollywood layout) */}
      <div className="flex-1 overflow-y-auto px-4 md:px-12 py-8 flex justify-center bg-[#07080a]">
        <div className="w-full max-w-3xl bg-[#0c0d12] border border-white/5 shadow-2xl rounded-xl p-8 md:p-14 min-h-[90vh] flex flex-col">
          <textarea
            ref={textareaRef}
            value={rawText}
            onChange={(e) => onChangeText(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className="w-full flex-1 bg-transparent font-screenplay text-cinema-100 text-sm md:text-base leading-relaxed tracking-wide focus:outline-none resize-none selection:bg-cinema-gold selection:text-black"
            placeholder={`EXT. BUS STOP — EVENING\n\nRain falls across the empty road.\n\nRISHI sits alone beneath the shelter.\n\nRISHI (V.O.)\nMaybe some things are better left unsaid.\n\nA bus passes.\n\nCUT TO:`}
          />
        </div>
      </div>
    </div>
  );
};
