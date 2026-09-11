export type EnvironmentType = 'EXT' | 'INT' | 'EXT/INT' | 'INT/EXT';

export type TimeOfDay = 
  | 'DAY' 
  | 'NIGHT' 
  | 'EVENING' 
  | 'DAWN' 
  | 'DUSK' 
  | 'CONTINUOUS' 
  | 'LATER' 
  | 'MOMENTS LATER';

export type BeatType = 
  | 'SCENE_HEADING'
  | 'ACTION'
  | 'DIALOGUE'
  | 'TRANSITION'
  | 'PAUSE'
  | 'SOUND_CUE';

export type DeliveryType = 'NORMAL' | 'VOICE_OVER' | 'OFF_SCREEN';

export type TransitionType = 
  | 'CUT' 
  | 'FADE_OUT' 
  | 'FADE_IN' 
  | 'DISSOLVE' 
  | 'SMASH_CUT' 
  | 'MATCH_CUT';

export type AmbienceType =
  | 'rain_downpour'
  | 'thunderstorm'
  | 'wind_howling'
  | 'city_traffic'
  | 'cafe_ambience'
  | 'night_crickets'
  | 'forest_birds'
  | 'ocean_waves'
  | 'server_vault'
  | 'room_tone_intimate'
  | 'creepy_horror'
  | 'desert_winds'
  | 'silent';

export interface StoryboardFrame {
  id: string;
  sceneId: string;
  sceneNumber: number;
  prompt: string;
  imageUrl: string;
  cameraMotion:
    | 'slow_push_in'
    | 'pan_left'
    | 'pan_right'
    | 'tilt_up'
    | 'static_wide';
  caption?: string;
  isGenerating?: boolean;
  source?: 'ai_generated' | 'mcp_generated';
}

export interface SceneAmbienceGuess {
  sceneId: string;
  sceneNumber: number;
  ambience: AmbienceType;
  confidence: number; // 0 to 1
  rationale: string; // Explaining why the feedback loop selected this ambience
  secondaryLayer?: string;
  spotSFX: {
    beatId: string;
    sfx: string;
    triggerWord: string;
  }[];
}

export interface Beat {
  id: string;
  sceneId: string;
  sceneNumber: number;
  type: BeatType;
  rawText: string;
  durationSeconds: number;
  character?: string;
  delivery?: DeliveryType;
  parenthetical?: string;
  dialogueText?: string;
  actionText?: string;
  transitionType?: TransitionType;
  ambientCue?: AmbienceType | string;
  sfxCue?: string;
  visualIntensity?: number; // 0 to 1
  cameraMotion?: 'static' | 'pan_slow' | 'push_in' | 'shake' | 'float';
  lightingShift?: 'dim' | 'flicker' | 'lightning' | 'pulse' | 'normal';
}

export interface Scene {
  id: string;
  sceneNumber: number;
  heading: string;
  environment: EnvironmentType;
  location: string;
  timeOfDay: TimeOfDay;
  mood: string;
  characters: string[];
  beats: Beat[];
  rawLines: string[];
  summary?: string;
  ambience?: AmbienceType;
  ambienceRationale?: string;
  storyboardFrame?: StoryboardFrame;
}

export interface DirectorStyle {
  id: string;
  name: string;
  tagline: string;
  description: string;
  colorPalette: {
    background: string;
    ambientLight: string;
    accentColor: string;
    textPrimary: string;
    textSecondary: string;
    letterboxColor: string;
  };
  grainIntensity: number;
  vignetteStrength: number;
  particleType: 'rain' | 'dust' | 'fog' | 'neon' | 'none';
  particleIntensity: number;
  lightingPace: 'slow' | 'medium' | 'fast';
  audioStyle: 'lofi_melancholy' | 'noir_drone' | 'ambient_minimal' | 'cyber_synth' | 'tense_thriller';
  pacingMultiplier: number;
}

export interface CinemaDocument {
  id: string;
  title: string;
  author: string;
  logline?: string;
  rawScreenplay: string;
  directorStyle: string; // references DirectorStyle.id
  characters: string[];
  scenes: Scene[];
  createdAt: number;
  updatedAt: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentSceneIndex: number;
  currentBeatIndex: number;
  progress: number;
  speed: number;
  isMuted: boolean;
  volume: number;
  activeDirectorStyleId: string;
}
