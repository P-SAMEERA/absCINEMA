import {
  CinemaDocument,
  Scene,
  Beat,
  EnvironmentType,
  TimeOfDay,
  DeliveryType,
  TransitionType,
} from '../types';
import { analyzeSceneAmbience } from '../director/ambienceIntelligence';
import { createStoryboardFrameForScene } from '../storyboard/storyboardProvider';

// Regex patterns for screenplay syntax
const SCENE_HEADING_REGEX = /^(INT\.\/EXT\.|EXT\.\/INT\.|INT\/EXT\.|EXT\/INT\.|INT\.|EXT\.|I\/E\.)\s+(.+?)(?:\s*[-—–]\s*(.+))?$/i;

const TRANSITION_REGEX = /^(CUT TO:|FADE IN:|FADE OUT\.|FADE OUT:|FADE TO BLACK\.|FADE TO BLACK:|DISSOLVE TO:|SMASH CUT TO:|SMASH CUT:|MATCH CUT TO:|JUMP CUT:|BACK TO:)$/i;

const CHARACTER_LINE_REGEX = /^([A-Z0-9\s_'.-]+?)(?:\s*\((V\.O\.|O\.S\.|CONT'D|OFF SCREEN|VOICE OVER|WHISPERING)\))?$/;

const PARENTHETICAL_REGEX = /^\((.+)\)$/;

interface ParseState {
  currentScene: Scene | null;
  currentSceneNumber: number;
  lastCharacter: string | null;
  lastDelivery: DeliveryType;
  lastParenthetical: string | null;
}

/**
 * Calculates natural cinematic reading duration in seconds.
 */
function calculateBeatDuration(text: string, type: Beat['type']): number {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  switch (type) {
    case 'SCENE_HEADING':
      return 3.2; // establishing shot time
    case 'TRANSITION':
      return 2.2;
    case 'DIALOGUE':
      // Average human speaking/reading rate ~130-150 wpm plus dramatic pauses
      return Math.max(2.8, Math.min(10, 1.8 + wordCount * 0.38));
    case 'ACTION':
      return Math.max(3.2, Math.min(10, 2.2 + wordCount * 0.34));
    case 'PAUSE':
      return 3.0;
    default:
      return 3.0;
  }
}

/**
 * Detects sensory cues, camera motions, and environmental hints from action text.
 */
function enrichActionSensory(text: string): {
  ambientCue?: string;
  sfxCue?: string;
  lightingShift?: Beat['lightingShift'];
  cameraMotion?: Beat['cameraMotion'];
  visualIntensity?: number;
} {
  const lower = text.toLowerCase();
  const result: ReturnType<typeof enrichActionSensory> = {
    visualIntensity: 0.5,
    cameraMotion: 'static',
    lightingShift: 'normal',
  };

  // Rain cues
  if (lower.includes('rain') || lower.includes('downpour') || lower.includes('storm')) {
    result.ambientCue = 'rain';
    result.sfxCue = 'rain_start';
    result.visualIntensity = 0.8;
  }

  // Vehicle / Bus cues
  if (lower.includes('bus passes') || lower.includes('bus arrives') || lower.includes('car speeds') || lower.includes('traffic')) {
    result.sfxCue = 'bus_pass';
    result.cameraMotion = 'pan_slow';
  }

  // Lighting cues
  if (lower.includes('lightning') || lower.includes('flash')) {
    result.lightingShift = 'lightning';
    result.sfxCue = 'thunder_rumble';
  } else if (lower.includes('flicker') || lower.includes('sparks')) {
    result.lightingShift = 'flicker';
  } else if (lower.includes('darkness') || lower.includes('shadows') || lower.includes('pitch black')) {
    result.lightingShift = 'dim';
  }

  // Camera dynamics
  if (lower.includes('close-up') || lower.includes('closer') || lower.includes('eyes widen')) {
    result.cameraMotion = 'push_in';
  } else if (lower.includes('suddenly') || lower.includes('explosion') || lower.includes('crashes')) {
    result.cameraMotion = 'shake';
    result.visualIntensity = 1.0;
  }

  return result;
}

/**
 * Normalizes environment string to standard EnvironmentType
 */
function normalizeEnvironment(raw: string): EnvironmentType {
  const upper = raw.toUpperCase().replace(/\./g, '');
  if (upper.includes('INT/EXT') || upper.includes('INTEXT')) return 'INT/EXT';
  if (upper.includes('EXT/INT') || upper.includes('EXTINT')) return 'EXT/INT';
  if (upper.startsWith('INT')) return 'INT';
  return 'EXT';
}

/**
 * Normalizes time of day string
 */
function normalizeTimeOfDay(raw?: string): TimeOfDay {
  if (!raw) return 'DAY';
  const upper = raw.toUpperCase().trim();
  if (upper.includes('NIGHT')) return 'NIGHT';
  if (upper.includes('EVENING')) return 'EVENING';
  if (upper.includes('DAWN') || upper.includes('SUNRISE')) return 'DAWN';
  if (upper.includes('DUSK') || upper.includes('SUNSET')) return 'DUSK';
  if (upper.includes('CONTINUOUS')) return 'CONTINUOUS';
  if (upper.includes('MOMENTS LATER')) return 'MOMENTS LATER';
  if (upper.includes('LATER')) return 'LATER';
  return 'DAY';
}

/**
 * Derives initial scene mood based on environment and time of day
 */
function inferSceneMood(env: EnvironmentType, time: TimeOfDay, location: string): string {
  const loc = location.toLowerCase();
  if (time === 'NIGHT' || time === 'EVENING') {
    if (env === 'EXT') return 'melancholic and moody';
    return 'intimate and quiet';
  }
  if (loc.includes('hospital') || loc.includes('alley') || loc.includes('basement')) {
    return 'tense';
  }
  if (loc.includes('cemetery') || loc.includes('ruins')) {
    return 'eerie';
  }
  return 'cinematic realism';
}

/**
 * Parse raw screenplay text into structured CinemaDocument.
 */
export function parseScreenplay(
  rawText: string,
  options?: {
    id?: string;
    title?: string;
    author?: string;
    directorStyle?: string;
  }
): CinemaDocument {
  const lines = rawText.split(/\r?\n/);
  const scenes: Scene[] = [];
  const characterSet = new Set<string>();

  const state: ParseState = {
    currentScene: null,
    currentSceneNumber: 0,
    lastCharacter: null,
    lastDelivery: 'NORMAL',
    lastParenthetical: null,
  };

  let beatCounter = 1;

  function ensureScene(): Scene {
    if (!state.currentScene) {
      state.currentSceneNumber++;
      state.currentScene = {
        id: `scene-${state.currentSceneNumber}`,
        sceneNumber: state.currentSceneNumber,
        heading: 'EXT. UNTITLED SCENE - DAY',
        environment: 'EXT',
        location: 'UNTITLED SCENE',
        timeOfDay: 'DAY',
        mood: 'cinematic',
        characters: [],
        beats: [],
        rawLines: [],
      };
      scenes.push(state.currentScene);
    }
    return state.currentScene;
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Skip empty lines
    if (!trimmed) {
      // Reset pending character speaker if consecutive blanks
      if (state.lastCharacter && i + 1 < lines.length && !lines[i + 1].trim()) {
        state.lastCharacter = null;
        state.lastParenthetical = null;
      }
      continue;
    }

    // 1. Check Scene Heading
    const sceneMatch = trimmed.match(SCENE_HEADING_REGEX);
    if (sceneMatch) {
      state.currentSceneNumber++;
      const envRaw = sceneMatch[1];
      const locRaw = sceneMatch[2]?.trim() || 'UNKNOWN';
      const timeRaw = sceneMatch[3]?.trim();

      const environment = normalizeEnvironment(envRaw);
      const timeOfDay = normalizeTimeOfDay(timeRaw);
      const location = locRaw.toUpperCase();
      const mood = inferSceneMood(environment, timeOfDay, location);

      const newScene: Scene = {
        id: `scene-${state.currentSceneNumber}`,
        sceneNumber: state.currentSceneNumber,
        heading: trimmed,
        environment,
        location,
        timeOfDay,
        mood,
        characters: [],
        beats: [],
        rawLines: [trimmed],
      };

      // Add scene establishing beat
      const headingBeat: Beat = {
        id: `beat-${beatCounter++}`,
        sceneId: newScene.id,
        sceneNumber: newScene.sceneNumber,
        type: 'SCENE_HEADING',
        rawText: trimmed,
        durationSeconds: calculateBeatDuration(trimmed, 'SCENE_HEADING'),
        ambientCue: environment === 'EXT' ? (timeOfDay === 'NIGHT' ? 'night_exterior' : 'day_exterior') : 'room_tone',
        cameraMotion: 'static',
        visualIntensity: 0.6,
      };

      newScene.beats.push(headingBeat);
      scenes.push(newScene);
      state.currentScene = newScene;
      state.lastCharacter = null;
      state.lastParenthetical = null;
      continue;
    }

    const activeScene = ensureScene();
    activeScene.rawLines.push(trimmed);

    // 2. Check Transition (e.g. CUT TO:, FADE OUT.)
    if (TRANSITION_REGEX.test(trimmed)) {
      let tType: TransitionType = 'CUT';
      const upper = trimmed.toUpperCase();
      if (upper.includes('FADE IN')) tType = 'FADE_IN';
      else if (upper.includes('FADE OUT') || upper.includes('FADE TO BLACK')) tType = 'FADE_OUT';
      else if (upper.includes('DISSOLVE')) tType = 'DISSOLVE';
      else if (upper.includes('SMASH')) tType = 'SMASH_CUT';
      else if (upper.includes('MATCH')) tType = 'MATCH_CUT';

      activeScene.beats.push({
        id: `beat-${beatCounter++}`,
        sceneId: activeScene.id,
        sceneNumber: activeScene.sceneNumber,
        type: 'TRANSITION',
        rawText: trimmed,
        durationSeconds: calculateBeatDuration(trimmed, 'TRANSITION'),
        transitionType: tType,
        sfxCue: tType === 'SMASH_CUT' ? 'smash_cut' : 'scene_whoosh',
      });
      state.lastCharacter = null;
      state.lastParenthetical = null;
      continue;
    }

    // 3. Check Parenthetical (e.g. (V.O.), (whispering), (smiling))
    const parenMatch = trimmed.match(PARENTHETICAL_REGEX);
    if (parenMatch && state.lastCharacter) {
      state.lastParenthetical = parenMatch[1];
      continue;
    }

    // 4. Check Character Name line
    const charMatch = trimmed.match(CHARACTER_LINE_REGEX);
    const isAllUpper = trimmed === trimmed.toUpperCase() && trimmed.length > 1 && !trimmed.endsWith('.');
    
    // Distinguish character line from all-caps action (character lines are short, usually centered)
    if (charMatch && isAllUpper && trimmed.length < 35) {
      let charName = charMatch[1].trim();
      let delivery: DeliveryType = 'NORMAL';

      const modifier = (charMatch[2] || '').toUpperCase();
      if (modifier.includes('V.O.') || modifier.includes('VOICE OVER')) {
        delivery = 'VOICE_OVER';
      } else if (modifier.includes('O.S.') || modifier.includes('OFF SCREEN')) {
        delivery = 'OFF_SCREEN';
      }

      // Strip any extra parentheticals from charName if matched
      charName = charName.replace(/\s*\(.*\)$/, '').trim();

      state.lastCharacter = charName;
      state.lastDelivery = delivery;
      state.lastParenthetical = null;

      characterSet.add(charName);
      if (!activeScene.characters.includes(charName)) {
        activeScene.characters.push(charName);
      }
      continue;
    }

    // 5. Dialogue line (if preceded by a character)
    if (state.lastCharacter) {
      const dialogueText = trimmed;
      const dialogueBeat: Beat = {
        id: `beat-${beatCounter++}`,
        sceneId: activeScene.id,
        sceneNumber: activeScene.sceneNumber,
        type: 'DIALOGUE',
        rawText: `${state.lastCharacter}: ${dialogueText}`,
        character: state.lastCharacter,
        delivery: state.lastDelivery,
        parenthetical: state.lastParenthetical || undefined,
        dialogueText,
        durationSeconds: calculateBeatDuration(dialogueText, 'DIALOGUE'),
        cameraMotion: state.lastDelivery === 'VOICE_OVER' ? 'float' : 'push_in',
        visualIntensity: state.lastDelivery === 'VOICE_OVER' ? 0.4 : 0.7,
      };

      activeScene.beats.push(dialogueBeat);
      // Reset parenthetical after dialogue block consumed
      state.lastParenthetical = null;
      continue;
    }

    // 6. Action block (Narrative description)
    const sensory = enrichActionSensory(trimmed);
    const actionBeat: Beat = {
      id: `beat-${beatCounter++}`,
      sceneId: activeScene.id,
      sceneNumber: activeScene.sceneNumber,
      type: 'ACTION',
      rawText: trimmed,
      actionText: trimmed,
      durationSeconds: calculateBeatDuration(trimmed, 'ACTION'),
      ambientCue: sensory.ambientCue,
      sfxCue: sensory.sfxCue,
      lightingShift: sensory.lightingShift,
      cameraMotion: sensory.cameraMotion,
      visualIntensity: sensory.visualIntensity,
    };

    activeScene.beats.push(actionBeat);
  }

  // Enrich each scene with intelligent ambience and initial storyboard keyframe
  scenes.forEach((scene) => {
    const guess = analyzeSceneAmbience(scene);
    scene.ambience = scene.ambience || guess.ambience;
    scene.ambienceRationale = guess.rationale;
    if (!scene.storyboardFrame) {
      scene.storyboardFrame = createStoryboardFrameForScene(scene);
    }
  });

  return {
    id: options?.id || `film-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    title: options?.title || 'Untitled Screenplay',
    author: options?.author || 'Anonymous Screenwriter',
    directorStyle: options?.directorStyle || 'noir_cold',
    characters: Array.from(characterSet),
    scenes,
    rawScreenplay: rawText,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
