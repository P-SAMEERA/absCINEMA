#!/usr/bin/env node
/**
 * absCinema MCP Server
 * JSON-RPC 2.0 over stdio — Model Context Protocol
 *
 * Tools:
 *  - generate_scene_storyboard  → AI image URL for a screenplay scene
 *  - analyze_screenplay_script  → deep narrative analysis of a screenplay
 *  - direct_ambience_soundscape → acoustic/ambience profile for a scene
 */

import { createInterface } from 'readline';

// ─── Helpers ────────────────────────────────────────────────────────────────

const send = (obj) => process.stdout.write(JSON.stringify(obj) + '\n');

const ok = (id, result) =>
  send({ jsonrpc: '2.0', id, result });

const err = (id, code, message) =>
  send({ jsonrpc: '2.0', id, error: { code, message } });

// ─── Tool Definitions ────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'generate_scene_storyboard',
    description:
      'Generate an AI storyboard frame image for a screenplay scene. Returns an image URL that can be shown as a cinematic still.',
    inputSchema: {
      type: 'object',
      properties: {
        scene_heading: {
          type: 'string',
          description: 'The slug line / scene heading, e.g. "EXT. ROOFTOP — NIGHT"',
        },
        scene_description: {
          type: 'string',
          description: 'Action lines or a brief description of the scene',
        },
        director_style: {
          type: 'string',
          description:
            'The cinematic style: noir_cold | golden_hour | cyberpunk_neon | dreamlike_ethereal | documentary_raw | thriller_pulse',
          enum: ['noir_cold', 'golden_hour', 'cyberpunk_neon', 'dreamlike_ethereal', 'documentary_raw', 'thriller_pulse'],
        },
        camera_motion: {
          type: 'string',
          description: 'Desired camera motion for Ken Burns effect',
          enum: ['static', 'slow_push_in', 'pan_left', 'pan_right', 'tilt_up'],
        },
      },
      required: ['scene_heading', 'scene_description'],
    },
  },
  {
    name: 'analyze_screenplay_script',
    description:
      'Perform a deep narrative analysis of a screenplay. Extracts characters, themes, emotional arc, scene types, pacing, and ambience recommendations.',
    inputSchema: {
      type: 'object',
      properties: {
        screenplay_text: {
          type: 'string',
          description: 'Full raw screenplay text to analyze',
        },
        analysis_depth: {
          type: 'string',
          description: 'How deep to analyze: quick (scene count + characters) | full (full narrative breakdown)',
          enum: ['quick', 'full'],
          default: 'full',
        },
      },
      required: ['screenplay_text'],
    },
  },
  {
    name: 'direct_ambience_soundscape',
    description:
      'Generate an acoustic/ambience profile for a screenplay scene. Returns the recommended AmbienceType and acoustic rationale.',
    inputSchema: {
      type: 'object',
      properties: {
        scene_heading: {
          type: 'string',
          description: 'Scene heading / slug line',
        },
        scene_description: {
          type: 'string',
          description: 'Action lines describing what happens in the scene',
        },
        time_of_day: {
          type: 'string',
          description: 'Time of day context (DAY, NIGHT, DUSK, DAWN, CONTINUOUS)',
        },
        int_ext: {
          type: 'string',
          description: 'Interior or exterior',
          enum: ['INT', 'EXT', 'INT/EXT'],
        },
      },
      required: ['scene_heading', 'scene_description'],
    },
  },
];

// ─── Tool Implementations ────────────────────────────────────────────────────

/**
 * Build a Pollinations.ai image URL from scene data + style
 */
function generateStoryboardImage({ scene_heading, scene_description, director_style, camera_motion }) {
  const stylePrompts = {
    noir_cold: 'film noir, black and white, high contrast shadows, 1940s cinematography, rain-slicked streets',
    golden_hour: 'golden hour cinematography, warm amber tones, lens flares, cinematic, anamorphic',
    cyberpunk_neon: 'cyberpunk aesthetic, neon lights, rain, futuristic city, blade runner style, teal and magenta',
    dreamlike_ethereal: 'ethereal dreamlike, soft bokeh, golden particles, impressionist, gentle warm tones',
    documentary_raw: 'documentary photography, natural light, candid, 35mm film grain, journalistic',
    thriller_pulse: 'psychological thriller, tense atmosphere, harsh shadows, cold blue tones, cinematic still',
  };

  const styleTag = stylePrompts[director_style] || stylePrompts.noir_cold;
  const sceneClean = scene_heading.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const descClean = scene_description.replace(/\n/g, ' ').slice(0, 200).trim();

  const prompt = encodeURIComponent(
    `Cinematic still frame. ${sceneClean}. ${descClean}. ${styleTag}. 16:9 aspect ratio, movie still, professional cinematography.`
  );

  const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1280&height=720&nologo=true&enhance=true&model=flux`;

  return {
    imageUrl,
    caption: sceneClean,
    cameraMotion: camera_motion || 'static',
    style: director_style || 'noir_cold',
    source: 'mcp_generated',
    prompt: decodeURIComponent(prompt),
  };
}

/**
 * Analyze a screenplay script — pure text NLP without calling any external API
 */
function analyzeScript({ screenplay_text, analysis_depth }) {
  const lines = screenplay_text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Scene headings
  const sceneHeadings = lines.filter((l) =>
    /^(INT|EXT|INT\/EXT|I\/E)[\.\s]/i.test(l)
  );

  // Characters (ALL CAPS lines without stage directions)
  const characterCandidates = lines.filter((l) =>
    /^[A-Z][A-Z\s]{2,}$/.test(l) && !l.includes('.') && l.length < 40
  );
  const characterFreq = {};
  characterCandidates.forEach((c) => {
    const name = c.replace(/\s*\(.*\)/, '').trim();
    characterFreq[name] = (characterFreq[name] || 0) + 1;
  });
  const characters = Object.entries(characterFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, lineCount: count }));

  // Scene types
  const intScenes = sceneHeadings.filter((h) => /^INT/i.test(h)).length;
  const extScenes = sceneHeadings.filter((h) => /^EXT/i.test(h)).length;

  // Time of day distribution
  const nightScenes = sceneHeadings.filter((h) => /NIGHT/i.test(h)).length;
  const dayScenes = sceneHeadings.filter((h) => /DAY/i.test(h)).length;

  // Dialogue vs action ratio
  const dialogueLines = lines.filter((l) => /^\s{4,}/.test(l) || (l.length < 60 && characterFreq[l.trim()])).length;
  const totalLines = lines.length;
  const dialogueRatio = Math.round((dialogueLines / totalLines) * 100);

  // Tone keywords
  const toneMap = {
    tension: ['gun', 'shot', 'blood', 'knife', 'scream', 'terror', 'fear', 'dark', 'dead'],
    romance: ['kiss', 'love', 'heart', 'touch', 'gaze', 'tender', 'whisper', 'hold'],
    comedy: ['laugh', 'funny', 'joke', 'silly', 'absurd', 'ridiculous'],
    drama: ['cry', 'tears', 'pain', 'suffer', 'loss', 'grief', 'alone'],
    action: ['run', 'chase', 'fight', 'explode', 'crash', 'sprint', 'dodge'],
  };

  const scriptLower = screenplay_text.toLowerCase();
  const toneScores = {};
  Object.entries(toneMap).forEach(([tone, words]) => {
    const score = words.reduce((s, w) => {
      const re = new RegExp(`\\b${w}`, 'g');
      return s + (scriptLower.match(re) || []).length;
    }, 0);
    toneScores[tone] = score;
  });

  const dominantTone = Object.entries(toneScores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'drama';

  // Ambience recommendations per scene
  const ambienceRecs = sceneHeadings.map((heading) => {
    const h = heading.toLowerCase();
    let ambience = 'room_tone_intimate';
    if (h.includes('rain') || h.includes('storm')) ambience = 'rain_downpour';
    else if (h.includes('night') && h.includes('ext')) ambience = 'city_traffic';
    else if (h.includes('forest') || h.includes('woods')) ambience = 'forest_birds';
    else if (h.includes('ocean') || h.includes('beach') || h.includes('sea')) ambience = 'ocean_waves';
    else if (h.includes('cafe') || h.includes('restaurant') || h.includes('diner')) ambience = 'cafe_ambience';
    else if (h.includes('office') || h.includes('server') || h.includes('lab')) ambience = 'server_vault';
    else if (h.includes('day') && h.includes('ext')) ambience = 'forest_birds';
    else if (h.includes('night')) ambience = 'night_crickets';
    return { heading, ambience };
  });

  const quickResult = {
    sceneCount: sceneHeadings.length,
    characters: characters.slice(0, 5),
    interiorScenes: intScenes,
    exteriorScenes: extScenes,
    dominantTone,
    wordCount: screenplay_text.split(/\s+/).length,
  };

  if (analysis_depth === 'quick') {
    return quickResult;
  }

  return {
    ...quickResult,
    characters,
    nightScenes,
    dayScenes,
    dialogueRatioPercent: dialogueRatio,
    toneScores,
    estimatedScreentimeMinutes: Math.round(sceneHeadings.length * 2.5),
    ambienceRecommendations: ambienceRecs,
    narrativeNotes: [
      `Script has ${sceneHeadings.length} scenes with ${intScenes} interiors and ${extScenes} exteriors.`,
      `Dominant tone detected: ${dominantTone}.`,
      `Night-heavy script: ${nightScenes > dayScenes ? 'YES — consider darker director styles.' : 'No.'}`,
      `Dialogue ratio: ${dialogueRatio}% — ${dialogueRatio > 50 ? 'dialogue-driven, use intimate ambiences.' : 'action-driven, use dynamic soundscapes.'}`,
    ],
  };
}

/**
 * Determine ambience profile for a single scene
 */
function directAmbienceSoundscape({ scene_heading, scene_description, time_of_day, int_ext }) {
  const h = (scene_heading + ' ' + scene_description).toLowerCase();
  const tod = (time_of_day || '').toLowerCase();
  const ie = (int_ext || '').toLowerCase();

  let ambience = 'room_tone_intimate';
  let confidence = 0.7;
  let rationale = '';

  // Rain / storm
  if (/rain|storm|thunder|downpour|wet|puddle|drizzle/.test(h)) {
    ambience = 'rain_downpour';
    confidence = 0.95;
    rationale = 'Rain and storm keywords detected in scene.';
  }
  // Horror
  else if (/horror|ghost|haunt|shadow|creep|supernatural|monster/.test(h)) {
    ambience = 'creepy_horror';
    confidence = 0.9;
    rationale = 'Horror/supernatural keywords detected.';
  }
  // Ocean / beach
  else if (/ocean|beach|sea|wave|shore|coast|harbor|pier|dock/.test(h)) {
    ambience = 'ocean_waves';
    confidence = 0.92;
    rationale = 'Water/ocean environment detected.';
  }
  // Forest / nature
  else if (/forest|woods|jungle|trees|birds|nature|park|meadow/.test(h)) {
    ambience = 'forest_birds';
    confidence = 0.88;
    rationale = 'Nature/forest environment detected.';
  }
  // Desert / open plains
  else if (/desert|sand|arid|wasteland|barren|dunes/.test(h)) {
    ambience = 'desert_winds';
    confidence = 0.9;
    rationale = 'Desert environment detected.';
  }
  // Café / social
  else if (/cafe|coffee|restaurant|diner|bar|pub|bistro|kitchen/.test(h)) {
    ambience = 'cafe_ambience';
    confidence = 0.87;
    rationale = 'Social/dining environment detected.';
  }
  // Tech / server room
  else if (/server|computer|lab|office|database|network|code|hack/.test(h)) {
    ambience = 'server_vault';
    confidence = 0.83;
    rationale = 'Tech/office environment detected.';
  }
  // City exterior
  else if (ie === 'ext' || /city|street|alley|road|downtown|urban|traffic/.test(h)) {
    if (tod === 'night' || /night/.test(h)) {
      ambience = 'city_traffic';
      confidence = 0.85;
      rationale = 'Urban exterior night scene.';
    } else {
      ambience = 'city_traffic';
      confidence = 0.78;
      rationale = 'Urban exterior scene.';
    }
  }
  // Night exterior with nature
  else if ((tod === 'night' || /night/.test(h)) && ie !== 'int') {
    ambience = 'night_crickets';
    confidence = 0.8;
    rationale = 'Night exterior scene — crickets/nocturnal sounds.';
  }
  // Wind / isolation
  else if (/wind|howl|storm|cold|isolated|alone|empty/.test(h)) {
    ambience = 'wind_howling';
    confidence = 0.82;
    rationale = 'Isolation/wind keywords detected.';
  }
  // Intimate interior
  else if (ie === 'int' || /interior|inside|room|bedroom|living|apartment/.test(h)) {
    ambience = 'room_tone_intimate';
    confidence = 0.75;
    rationale = 'Interior scene — intimate room tone.';
  }

  return {
    ambience,
    confidence: Math.round(confidence * 100),
    rationale,
    alternatives: getAlternativeAmbiences(ambience),
    sceneProfile: {
      heading: scene_heading,
      intExt: int_ext || (ie === 'int' ? 'INT' : 'EXT'),
      timeOfDay: time_of_day || tod || 'UNKNOWN',
    },
  };
}

function getAlternativeAmbiences(primary) {
  const alternatives = {
    rain_downpour: ['thunderstorm', 'wind_howling', 'city_traffic'],
    thunderstorm: ['rain_downpour', 'wind_howling', 'silent'],
    city_traffic: ['cafe_ambience', 'night_crickets', 'rain_downpour'],
    cafe_ambience: ['city_traffic', 'room_tone_intimate', 'forest_birds'],
    night_crickets: ['forest_birds', 'wind_howling', 'silent'],
    forest_birds: ['night_crickets', 'ocean_waves', 'desert_winds'],
    ocean_waves: ['forest_birds', 'wind_howling', 'rain_downpour'],
    server_vault: ['room_tone_intimate', 'city_traffic', 'silent'],
    room_tone_intimate: ['cafe_ambience', 'silent', 'server_vault'],
    creepy_horror: ['silent', 'wind_howling', 'thunderstorm'],
    desert_winds: ['wind_howling', 'silent', 'forest_birds'],
    wind_howling: ['rain_downpour', 'desert_winds', 'night_crickets'],
    silent: ['room_tone_intimate', 'night_crickets', 'desert_winds'],
  };
  return alternatives[primary] || ['room_tone_intimate', 'silent'];
}

// ─── MCP Protocol Handlers ───────────────────────────────────────────────────

function handleRequest(req) {
  const { id, method, params } = req;

  // initialize
  if (method === 'initialize') {
    return ok(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'abscinema-mcp', version: '1.0.0' },
    });
  }

  // initialized notification — no response needed
  if (method === 'notifications/initialized') return;

  // list tools
  if (method === 'tools/list') {
    return ok(id, { tools: TOOLS });
  }

  // call tool
  if (method === 'tools/call') {
    const { name, arguments: args } = params || {};

    try {
      let content;

      if (name === 'generate_scene_storyboard') {
        if (!args?.scene_heading || !args?.scene_description) {
          return err(id, -32602, 'scene_heading and scene_description are required');
        }
        const result = generateStoryboardImage(args);
        content = [{ type: 'text', text: JSON.stringify(result, null, 2) }];

      } else if (name === 'analyze_screenplay_script') {
        if (!args?.screenplay_text) {
          return err(id, -32602, 'screenplay_text is required');
        }
        const result = analyzeScript(args);
        content = [{ type: 'text', text: JSON.stringify(result, null, 2) }];

      } else if (name === 'direct_ambience_soundscape') {
        if (!args?.scene_heading || !args?.scene_description) {
          return err(id, -32602, 'scene_heading and scene_description are required');
        }
        const result = directAmbienceSoundscape(args);
        content = [{ type: 'text', text: JSON.stringify(result, null, 2) }];

      } else {
        return err(id, -32601, `Unknown tool: ${name}`);
      }

      return ok(id, { content, isError: false });

    } catch (e) {
      return ok(id, {
        content: [{ type: 'text', text: `Error: ${e.message}` }],
        isError: true,
      });
    }
  }

  // ping
  if (method === 'ping') {
    return ok(id, {});
  }

  return err(id, -32601, `Method not found: ${method}`);
}

// ─── stdin / stdout transport ────────────────────────────────────────────────

const rl = createInterface({ input: process.stdin, terminal: false });

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    const req = JSON.parse(trimmed);
    handleRequest(req);
  } catch {
    send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
  }
});

rl.on('close', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
