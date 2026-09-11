import { Scene, StoryboardFrame, DirectorStyle } from '../types';
import { generateStoryboardPrompt } from './promptGenerator';

// Curated cinematic stills mapping for instant visual beauty
const CURATED_SCENE_STILLS: Record<string, string> = {
  // Bus stop / Rain
  bus_stop: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1920&q=80',
  rain_street: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=1920&q=80',
  
  // Diner / Cafe
  diner: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1920&q=80',
  coffee_booth: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1920&q=80',

  // Cyberpunk / Alley
  cyberpunk_alley: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80',
  server_vault: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1920&q=80',

  // Interior 3 AM / Apartment
  apartment_night: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1920&q=80',
  window_night: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=1920&q=80',

  // Rooftop / Cityscape
  rooftop: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1920&q=80',
  city_night: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',

  // Nature / Exterior
  forest_fog: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80',
  ocean_dusk: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
};

/**
 * Finds the most atmospheric cinematic still based on scene keywords.
 */
function matchCuratedStill(scene: Scene): string {
  const loc = scene.location.toLowerCase();
  const heading = scene.heading.toLowerCase();
  const beatsText = scene.beats.map((b) => b.rawText.toLowerCase()).join(' ');
  const combined = `${loc} ${heading} ${beatsText}`;

  if (combined.includes('bus stop') || combined.includes('shelter')) {
    return CURATED_SCENE_STILLS.bus_stop;
  }
  if (combined.includes('diner') || combined.includes('booth') || combined.includes('coffee')) {
    return CURATED_SCENE_STILLS.diner;
  }
  if (combined.includes('server') || combined.includes('vault') || combined.includes('conduit')) {
    return CURATED_SCENE_STILLS.server_vault;
  }
  if (combined.includes('alley') || combined.includes('neon') || combined.includes('sector')) {
    return CURATED_SCENE_STILLS.cyberpunk_alley;
  }
  if (combined.includes('kitchen') || combined.includes('apartment') || combined.includes('bedroom')) {
    return CURATED_SCENE_STILLS.apartment_night;
  }
  if (combined.includes('rooftop')) {
    return CURATED_SCENE_STILLS.rooftop;
  }
  if (combined.includes('forest') || combined.includes('woods')) {
    return CURATED_SCENE_STILLS.forest_fog;
  }
  if (combined.includes('ocean') || combined.includes('beach')) {
    return CURATED_SCENE_STILLS.ocean_dusk;
  }
  if (combined.includes('rain')) {
    return CURATED_SCENE_STILLS.rain_street;
  }

  return CURATED_SCENE_STILLS.city_night;
}

/**
 * Generates an AI Image URL using Pollinations cinematic endpoint.
 */
export function getAIImageUrl(prompt: string): string {
  const cleanPrompt = encodeURIComponent(
    `${prompt}, cinematic film still, anamorphic 2.39:1, master cinematography, 8k, photorealistic, no text, no watermark`
  );
  return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1280&height=540&nologo=true&enhance=true`;
}

/**
 * Generates or resolves a StoryboardFrame for a scene.
 */
export function createStoryboardFrameForScene(
  scene: Scene,
  style?: DirectorStyle,
  forceAI = false
): StoryboardFrame {
  const prompt = generateStoryboardPrompt(scene, style);
  const imageUrl = forceAI ? getAIImageUrl(prompt) : matchCuratedStill(scene);

  const cameraMotions: StoryboardFrame['cameraMotion'][] = [
    'slow_push_in',
    'pan_left',
    'pan_right',
    'tilt_up',
    'static_wide',
  ];
  // Deterministic camera motion based on scene number
  const cameraMotion = cameraMotions[scene.sceneNumber % cameraMotions.length];

  return {
    id: `frame-${scene.id}-${Date.now()}`,
    sceneId: scene.id,
    sceneNumber: scene.sceneNumber,
    prompt,
    imageUrl,
    cameraMotion,
    caption: `${scene.heading} — ${scene.location}`,
  };
}
