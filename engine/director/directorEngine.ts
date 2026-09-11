import { CinemaDocument, Scene, Beat, DirectorStyle } from '../types';
import { DIRECTOR_PRESETS, DEFAULT_DIRECTOR_STYLE } from './presets';

export interface DirectedScene extends Scene {
  effectiveBackground: string;
  effectiveAmbientLight: string;
  hasRain: boolean;
  hasParticles: boolean;
}

export interface DirectedCinemaDocument extends CinemaDocument {
  style: DirectorStyle;
  scenes: DirectedScene[];
  totalRuntimeSeconds: number;
}

/**
 * Computes custom background gradient/color for a scene based on its time of day, environment,
 * and the chosen director style.
 */
function computeSceneEnvironmentColors(
  scene: Scene,
  style: DirectorStyle
): { background: string; ambientLight: string } {
  const { environment, timeOfDay } = scene;
  const isNight = timeOfDay === 'NIGHT';
  const isEvening = timeOfDay === 'EVENING' || timeOfDay === 'DUSK';
  const isDawn = timeOfDay === 'DAWN';

  if (style.id === 'noir_cold') {
    if (isNight) {
      return { background: '#04060a', ambientLight: '#0e1826' };
    }
    if (isEvening) {
      return { background: '#080b12', ambientLight: '#182436' };
    }
    return { background: '#0e121a', ambientLight: '#202a3a' };
  }

  if (style.id === 'minimal_a24') {
    return { background: '#07080a', ambientLight: '#12141a' };
  }

  if (style.id === 'dreamlike_ethereal') {
    if (isEvening || isNight) {
      return { background: '#0d0918', ambientLight: '#25163e' };
    }
    return { background: '#181224', ambientLight: '#3a2456' };
  }

  if (style.id === 'cyberpunk_neon') {
    return { background: '#03060a', ambientLight: '#0b1928' };
  }

  // Cinematic Realism default
  if (isNight) {
    return { background: '#070a10', ambientLight: '#121927' };
  }
  if (isEvening) {
    return { background: '#120d18', ambientLight: '#2a1a33' };
  }
  if (isDawn) {
    return { background: '#14121a', ambientLight: '#2e2030' };
  }
  return { background: '#0f141c', ambientLight: '#212d3e' };
}

/**
 * Applies creative directorial vision to the parsed Cinema Document.
 */
export function directScreenplay(
  doc: CinemaDocument,
  styleIdOrCustom?: string | DirectorStyle
): DirectedCinemaDocument {
  let style: DirectorStyle;
  if (typeof styleIdOrCustom === 'object') {
    style = styleIdOrCustom;
  } else if (typeof styleIdOrCustom === 'string' && DIRECTOR_PRESETS[styleIdOrCustom]) {
    style = DIRECTOR_PRESETS[styleIdOrCustom];
  } else {
    style = DIRECTOR_PRESETS[doc.directorStyle] || DEFAULT_DIRECTOR_STYLE;
  }

  let totalRuntime = 0;

  const directedScenes: DirectedScene[] = doc.scenes.map((scene) => {
    const { background, ambientLight } = computeSceneEnvironmentColors(scene, style);

    // Check if any beat or scene narrative mentions rain
    const hasRainKeyword = scene.heading.toLowerCase().includes('rain') ||
      scene.beats.some(b => b.ambientCue === 'rain' || (b.actionText && b.actionText.toLowerCase().includes('rain')));
    
    const hasRain = style.particleType === 'rain' || hasRainKeyword;
    const hasParticles = style.particleType !== 'none';

    // Enrich beats with directorial pacing
    const directedBeats: Beat[] = scene.beats.map((beat) => {
      const adjustedDuration = Math.round(beat.durationSeconds * style.pacingMultiplier * 10) / 10;
      totalRuntime += adjustedDuration;

      return {
        ...beat,
        durationSeconds: adjustedDuration,
      };
    });

    return {
      ...scene,
      effectiveBackground: background,
      effectiveAmbientLight: ambientLight,
      hasRain,
      hasParticles,
      beats: directedBeats,
    };
  });

  return {
    ...doc,
    style,
    scenes: directedScenes,
    totalRuntimeSeconds: Math.round(totalRuntime),
  };
}
