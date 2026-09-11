import { Scene, AmbienceType, SceneAmbienceGuess, CinemaDocument } from '../types';

/**
 * Intelligent Ambience Director
 * Evaluates screenplay scenes and beats using natural language heuristics
 * to guess the exact ambient acoustic profile and spot sound effects.
 */

export function analyzeSceneAmbience(scene: Scene): SceneAmbienceGuess {
  const headingLower = scene.heading.toLowerCase();
  const locationLower = scene.location.toLowerCase();
  const allActionText = scene.beats
    .map((b) => (b.actionText || b.rawText || '').toLowerCase())
    .join(' ');
  const combined = `${headingLower} ${locationLower} ${allActionText}`;

  let ambience: AmbienceType = 'room_tone_intimate';
  let confidence = 0.7;
  let rationale = 'Default intimate room tone for enclosed scene.';

  // 1. Storm / Thunder
  if (combined.includes('thunder') || combined.includes('lightning') || combined.includes('storm')) {
    ambience = 'thunderstorm';
    confidence = 0.95;
    rationale = 'Detected storm, thunder or lightning cues in screenplay action.';
  }
  // 2. Rain Downpour
  else if (combined.includes('rain') || combined.includes('downpour') || combined.includes('wet tarmac') || combined.includes('puddles')) {
    ambience = 'rain_downpour';
    confidence = 0.92;
    rationale = 'Scene heading or action explicitly describes rainfall and wet conditions.';
  }
  // 3. Cafe / Diner / Coffee shop
  else if (
    locationLower.includes('diner') ||
    locationLower.includes('cafe') ||
    locationLower.includes('coffee') ||
    locationLower.includes('restaurant') ||
    locationLower.includes('bar')
  ) {
    ambience = 'cafe_ambience';
    confidence = 0.9;
    rationale = 'Interior cafe/diner setting with ambient social warmth and ceramic clatter.';
  }
  // 4. Server Vault / Sci-fi
  else if (
    locationLower.includes('server') ||
    locationLower.includes('vault') ||
    locationLower.includes('lab') ||
    locationLower.includes('cyber') ||
    combined.includes('optic fibres') ||
    combined.includes('conduit')
  ) {
    ambience = 'server_vault';
    confidence = 0.9;
    rationale = 'High-tech facility with electronic server whir and cooling fan acoustics.';
  }
  // 5. Ocean / Coast / Shore
  else if (
    locationLower.includes('beach') ||
    locationLower.includes('ocean') ||
    locationLower.includes('coast') ||
    locationLower.includes('dock') ||
    locationLower.includes('pier') ||
    combined.includes('waves')
  ) {
    ambience = 'ocean_waves';
    confidence = 0.92;
    rationale = 'Coastal/marine exterior with rhythmic tidal surf and water wash.';
  }
  // 6. Forest / Park / Woods
  else if (
    locationLower.includes('forest') ||
    locationLower.includes('woods') ||
    locationLower.includes('park') ||
    locationLower.includes('garden') ||
    combined.includes('trees')
  ) {
    ambience = 'forest_birds';
    confidence = 0.88;
    rationale = 'Outdoor natural greenery with canopy wind and wildlife.';
  }
  // 7. Desert / Wasteland
  else if (
    locationLower.includes('desert') ||
    locationLower.includes('wasteland') ||
    locationLower.includes('canyon') ||
    combined.includes('sand')
  ) {
    ambience = 'desert_winds';
    confidence = 0.85;
    rationale = 'Arid open wilderness with dry sweeping wind acoustics.';
  }
  // 8. Horror / Creepy
  else if (
    locationLower.includes('basement') ||
    locationLower.includes('crypt') ||
    locationLower.includes('ruins') ||
    combined.includes('creepy') ||
    combined.includes('blood') ||
    combined.includes('eerie')
  ) {
    ambience = 'creepy_horror';
    confidence = 0.85;
    rationale = 'Suspenseful or subterranean setting with low-end acoustic tension.';
  }
  // 9. City Traffic / Street
  else if (
    scene.environment === 'EXT' &&
    (locationLower.includes('street') ||
      locationLower.includes('road') ||
      locationLower.includes('alley') ||
      locationLower.includes('avenue') ||
      locationLower.includes('parking') ||
      locationLower.includes('bus stop'))
  ) {
    ambience = 'city_traffic';
    confidence = 0.86;
    rationale = 'Urban exterior with street-level background vehicle acoustics.';
  }
  // 10. Night Exterior Crickets
  else if (scene.environment === 'EXT' && (scene.timeOfDay === 'NIGHT' || scene.timeOfDay === 'EVENING')) {
    ambience = 'night_crickets';
    confidence = 0.82;
    rationale = 'Nocturnal exterior with cricket chirps and evening breeze.';
  }
  // 11. High Wind
  else if (combined.includes('wind') || combined.includes('gale') || locationLower.includes('rooftop')) {
    ambience = 'wind_howling';
    confidence = 0.84;
    rationale = 'Elevated or exposed setting with wind drafts.';
  }
  // 12. Interior Room Tone
  else if (scene.environment === 'INT') {
    ambience = 'room_tone_intimate';
    confidence = 0.8;
    rationale = 'Quiet indoor room tone with gentle electrical acoustics.';
  }

  // Spot SFX Detection across beats
  const spotSFX: SceneAmbienceGuess['spotSFX'] = [];
  scene.beats.forEach((beat) => {
    const text = (beat.actionText || beat.rawText || '').toLowerCase();

    if (text.includes('phone') && (text.includes('vibrat') || text.includes('ring'))) {
      spotSFX.push({ beatId: beat.id, sfx: 'phone_ring', triggerWord: 'phone' });
      beat.sfxCue = 'phone_ring';
    } else if (text.includes('bus passes') || text.includes('car speeds')) {
      spotSFX.push({ beatId: beat.id, sfx: 'bus_pass', triggerWord: 'vehicle' });
      beat.sfxCue = 'bus_pass';
    } else if (text.includes('footstep') || text.includes('walks') || text.includes('steps')) {
      spotSFX.push({ beatId: beat.id, sfx: 'footsteps', triggerWord: 'footsteps' });
      beat.sfxCue = 'footsteps';
    } else if (text.includes('door') && (text.includes('creak') || text.includes('slam') || text.includes('open'))) {
      spotSFX.push({ beatId: beat.id, sfx: 'door_creak', triggerWord: 'door' });
      beat.sfxCue = 'door_creak';
    } else if (text.includes('coffee') || text.includes('cup') || text.includes('glass')) {
      spotSFX.push({ beatId: beat.id, sfx: 'glass_clink', triggerWord: 'glass' });
      beat.sfxCue = 'glass_clink';
    } else if (text.includes('thunder') || text.includes('lightning')) {
      spotSFX.push({ beatId: beat.id, sfx: 'thunder_rumble', triggerWord: 'thunder' });
      beat.sfxCue = 'thunder_rumble';
    }
  });

  return {
    sceneId: scene.id,
    sceneNumber: scene.sceneNumber,
    ambience,
    confidence,
    rationale,
    spotSFX,
  };
}

/**
 * Runs the Ambience Feedback Loop across the entire screenplay.
 * Analyzes and enriches each scene with guessed ambiences and SFX schedules.
 */
export function enrichScreenplayAmbiences(doc: CinemaDocument): {
  enrichedDoc: CinemaDocument;
  guesses: SceneAmbienceGuess[];
} {
  const guesses: SceneAmbienceGuess[] = [];

  const updatedScenes = doc.scenes.map((scene) => {
    const guess = analyzeSceneAmbience(scene);
    guesses.push(guess);

    return {
      ...scene,
      ambience: scene.ambience || guess.ambience,
      ambienceRationale: guess.rationale,
    };
  });

  return {
    enrichedDoc: {
      ...doc,
      scenes: updatedScenes,
    },
    guesses,
  };
}
