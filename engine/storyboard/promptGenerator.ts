import { Scene, DirectorStyle } from '../types';

/**
 * Transforms a screenplay Scene into a high-aesthetic 2.39:1 cinematic diffusion prompt.
 */
export function generateStoryboardPrompt(scene: Scene, style?: DirectorStyle): string {
  const { heading, environment, location, timeOfDay, beats } = scene;

  // Extract key descriptive sentences from action beats
  const actionSnippets = beats
    .filter((b) => b.type === 'ACTION' && b.actionText)
    .map((b) => b.actionText!)
    .slice(0, 3)
    .join('. ');

  const characters = scene.characters.length > 0 ? `featuring ${scene.characters.join(' and ')}` : '';

  const styleModifier = style
    ? style.id === 'noir_cold'
      ? 'film noir style, moody cold cyan and amber rim lighting, heavy atmospheric rain, high contrast shadows'
      : style.id === 'minimal_a24'
      ? 'A24 indie cinema style, stark minimalist composition, wide negative space, natural low-key lighting'
      : style.id === 'dreamlike_ethereal'
      ? 'dreamlike ethereal cinematic haze, golden hour twilight violet glow, floating bokeh motes'
      : style.id === 'cyberpunk_neon'
      ? 'cyberpunk neon noir, wet asphalt reflections, glowing cyan and magenta signage, high-tech dystopian atmosphere'
      : 'cinematic 35mm film still, naturalistic lighting, Panavision anamorphic lens'
    : 'cinematic 35mm film still, Panavision anamorphic lens';

  return `Cinematic 2.39:1 anamorphic film still, ${heading}, ${location}, ${timeOfDay.toLowerCase()}, ${actionSnippets} ${characters}, ${styleModifier}, 8k resolution, photorealistic, dramatic composition, master shot --ar 21:9`.trim();
}
