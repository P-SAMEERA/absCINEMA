import { AmbienceType } from '../types';

/**
 * absCinema Universal Procedural Sound Engine
 * Procedurally generates 12+ atmospheric soundscapes, score drones, and spot SFX
 * using the Web Audio API with zero external media files.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private activeAmbienceCleanups: Array<() => void> = [];
  private activeDroneCleanups: Array<() => void> = [];

  private isMuted: boolean = false;
  private currentAmbienceType: AmbienceType | 'none' = 'none';
  private currentMusicStyle: string | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.ambienceGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.ambienceGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(0.65, this.ctx.currentTime);

      this.ambienceGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  public async resume() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    if (muted) {
      this.masterGain.gain.setTargetAtTime(0, now, 0.05);
    } else {
      this.masterGain.gain.setTargetAtTime(0.7, now, 0.1);
    }
  }

  public setVolume(volume: number) {
    if (!this.ctx || !this.masterGain) return;
    const clamped = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : clamped, this.ctx.currentTime, 0.05);
  }

  // ==========================================
  // AMBIENCE ENGINE — 12 DIVERSE ENVIRONMENTS
  // ==========================================

  public setAmbience(type: AmbienceType | 'none') {
    if (this.currentAmbienceType === type) return;
    this.currentAmbienceType = type;

    this.stopAmbience();
    if (type === 'none' || type === 'silent' || !this.ctx || !this.ambienceGain) return;
    this.resume();

    switch (type) {
      case 'rain_downpour':
        this.startRainDownpour();
        break;
      case 'thunderstorm':
        this.startThunderstorm();
        break;
      case 'wind_howling':
        this.startWindHowling();
        break;
      case 'city_traffic':
        this.startCityTraffic();
        break;
      case 'cafe_ambience':
        this.startCafeAmbience();
        break;
      case 'night_crickets':
        this.startNightCrickets();
        break;
      case 'forest_birds':
        this.startForestBirds();
        break;
      case 'ocean_waves':
        this.startOceanWaves();
        break;
      case 'server_vault':
        this.startServerVault();
        break;
      case 'room_tone_intimate':
        this.startRoomToneIntimate();
        break;
      case 'creepy_horror':
        this.startCreepyHorror();
        break;
      case 'desert_winds':
        this.startDesertWinds();
        break;
      default:
        this.startRoomToneIntimate();
        break;
    }
  }

  // 1. Heavy Rain Downpour
  private startRainDownpour() {
    if (!this.ctx || !this.ambienceGain) return;
    const pinkNoise = this.createPinkNoiseNode();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.6, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.4, this.ctx.currentTime + 1.5);

    pinkNoise.source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambienceGain);
    pinkNoise.source.start();

    // Randomized droplet impacts
    const dropInterval = setInterval(() => {
      if (!this.ctx || !this.ambienceGain || this.currentAmbienceType !== 'rain_downpour') return;
      try {
        const osc = this.ctx.createOscillator();
        const dropGain = this.ctx.createGain();
        osc.frequency.setValueAtTime(1600 + Math.random() * 1400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, this.ctx.currentTime + 0.04);
        dropGain.gain.setValueAtTime(0.025, this.ctx.currentTime);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);
        osc.connect(dropGain);
        dropGain.connect(this.ambienceGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
      } catch {}
    }, 110);

    this.activeAmbienceCleanups.push(() => {
      clearInterval(dropInterval);
      try {
        gain.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.4);
        setTimeout(() => {
          pinkNoise.source.stop();
          pinkNoise.source.disconnect();
        }, 500);
      } catch {}
    });
  }

  // 2. Thunderstorm (Rain + Periodic Rolling Thunder)
  private startThunderstorm() {
    this.startRainDownpour();
    if (!this.ctx || !this.ambienceGain) return;

    // Periodic thunder strikes every 7-12 seconds
    const thunderInterval = setInterval(() => {
      if (this.currentAmbienceType !== 'thunderstorm') return;
      this.playThunderSFX();
    }, 8500);

    this.activeAmbienceCleanups.push(() => {
      clearInterval(thunderInterval);
    });
  }

  // 3. Howling Wind
  private startWindHowling() {
    if (!this.ctx || !this.ambienceGain) return;
    const noise = this.createWhiteNoiseNode();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(260, this.ctx.currentTime);
    filter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(180, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.35, this.ctx.currentTime + 2.0);

    noise.source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambienceGain);

    noise.source.start();
    lfo.start();

    this.activeAmbienceCleanups.push(() => {
      try {
        gain.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.4);
        setTimeout(() => {
          noise.source.stop();
          lfo.stop();
        }, 500);
      } catch {}
    });
  }

  // 4. City Traffic & Street Hum
  private startCityTraffic() {
    if (!this.ctx || !this.ambienceGain) return;
    const noise = this.createWhiteNoiseNode();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.28, this.ctx.currentTime + 1.5);

    noise.source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambienceGain);
    noise.source.start();

    // Occasional vehicle whooshes & distant horns
    const vehicleInterval = setInterval(() => {
      if (this.currentAmbienceType !== 'city_traffic' || !this.ctx || !this.ambienceGain) return;
      try {
        const osc = this.ctx.createOscillator();
        const hornGain = this.ctx.createGain();
        osc.frequency.setValueAtTime(320 + Math.random() * 40, this.ctx.currentTime);
        hornGain.gain.setValueAtTime(0.02, this.ctx.currentTime);
        hornGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.6);
        osc.connect(hornGain);
        hornGain.connect(this.ambienceGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.7);
      } catch {}
    }, 4500);

    this.activeAmbienceCleanups.push(() => {
      clearInterval(vehicleInterval);
      try {
        gain.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.4);
        setTimeout(() => {
          noise.source.stop();
        }, 500);
      } catch {}
    });
  }

  // 5. Warm Cafe & Coffee Shop Murmur
  private startCafeAmbience() {
    if (!this.ctx || !this.ambienceGain) return;
    const noise = this.createPinkNoiseNode();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(750, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 1.5);

    noise.source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambienceGain);
    noise.source.start();

    // Random ceramic cup / saucer clinks
    const clinkInterval = setInterval(() => {
      if (this.currentAmbienceType !== 'cafe_ambience' || !this.ctx || !this.ambienceGain) return;
      this.playGlassClinkSFX();
    }, 2800);

    this.activeAmbienceCleanups.push(() => {
      clearInterval(clinkInterval);
      try {
        gain.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.4);
        setTimeout(() => {
          noise.source.stop();
        }, 500);
      } catch {}
    });
  }

  // 6. Night Crickets
  private startNightCrickets() {
    if (!this.ctx || !this.ambienceGain) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.frequency.setValueAtTime(4500, this.ctx.currentTime);
    osc2.frequency.setValueAtTime(4850, this.ctx.currentTime);

    // Tremolo LFO for cricket chirping rhythm
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(14, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    const mainGain = this.ctx.createGain();
    mainGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    mainGain.gain.exponentialRampToValueAtTime(0.06, this.ctx.currentTime + 2.0);

    lfo.connect(lfoGain.gain);
    osc1.connect(mainGain);
    osc2.connect(mainGain);
    mainGain.connect(this.ambienceGain);

    osc1.start();
    osc2.start();
    lfo.start();

    this.activeAmbienceCleanups.push(() => {
      try {
        mainGain.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.3);
        setTimeout(() => {
          osc1.stop();
          osc2.stop();
          lfo.stop();
        }, 400);
      } catch {}
    });
  }

  // 7. Forest Birds & Canopy Breeze
  private startForestBirds() {
    if (!this.ctx || !this.ambienceGain) return;
    const noise = this.createPinkNoiseNode();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, this.ctx.currentTime + 1.5);

    noise.source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambienceGain);
    noise.source.start();

    // Procedural bird song whistles
    const birdInterval = setInterval(() => {
      if (this.currentAmbienceType !== 'forest_birds' || !this.ctx || !this.ambienceGain) return;
      try {
        const osc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        const baseFreq = 2600 + Math.random() * 800;
        osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(baseFreq + 400, this.ctx.currentTime + 0.08);
        osc.frequency.linearRampToValueAtTime(baseFreq - 200, this.ctx.currentTime + 0.16);

        bGain.gain.setValueAtTime(0.02, this.ctx.currentTime);
        bGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.22);

        osc.connect(bGain);
        bGain.connect(this.ambienceGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
      } catch {}
    }, 2200);

    this.activeAmbienceCleanups.push(() => {
      clearInterval(birdInterval);
      try {
        gain.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.4);
        setTimeout(() => {
          noise.source.stop();
        }, 500);
      } catch {}
    });
  }

  // 8. Ocean Waves & Coastal Surf
  private startOceanWaves() {
    if (!this.ctx || !this.ambienceGain) return;
    const noise = this.createPinkNoiseNode();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);

    // 8-second wave swells
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(250, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const waveGain = this.ctx.createGain();
    waveGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    waveGain.gain.exponentialRampToValueAtTime(0.3, this.ctx.currentTime + 2.0);

    noise.source.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(this.ambienceGain);

    noise.source.start();
    lfo.start();

    this.activeAmbienceCleanups.push(() => {
      try {
        waveGain.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.5);
        setTimeout(() => {
          noise.source.stop();
          lfo.stop();
        }, 600);
      } catch {}
    });
  }

  // 9. Server Vault & Cyberpunk Facility
  private startServerVault() {
    if (!this.ctx || !this.ambienceGain) return;
    const fan1 = this.ctx.createOscillator();
    const fan2 = this.ctx.createOscillator();
    fan1.frequency.setValueAtTime(120, this.ctx.currentTime);
    fan2.frequency.setValueAtTime(360, this.ctx.currentTime);

    const fanGain = this.ctx.createGain();
    fanGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

    fan1.connect(fanGain);
    fan2.connect(fanGain);
    fanGain.connect(this.ambienceGain);
    fan1.start();
    fan2.start();

    // High frequency fan hiss
    const noise = this.createWhiteNoiseNode();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1600, this.ctx.currentTime);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

    noise.source.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ambienceGain);
    noise.source.start();

    this.activeAmbienceCleanups.push(() => {
      try {
        fanGain.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.3);
        noiseGain.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.3);
        setTimeout(() => {
          fan1.stop();
          fan2.stop();
          noise.source.stop();
        }, 400);
      } catch {}
    });
  }

  // 10. Intimate Room Tone
  private startRoomToneIntimate() {
    if (!this.ctx || !this.ambienceGain) return;
    const osc = this.ctx.createOscillator();
    osc.frequency.setValueAtTime(60, this.ctx.currentTime);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.07, this.ctx.currentTime + 1.0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambienceGain);
    osc.start();

    this.activeAmbienceCleanups.push(() => {
      try {
        gain.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.2);
        setTimeout(() => osc.stop(), 300);
      } catch {}
    });
  }

  // 11. Creepy Horror Tension Drone
  private startCreepyHorror() {
    if (!this.ctx || !this.ambienceGain) return;
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(36, this.ctx.currentTime); // Low C#

    const tritoneOsc = this.ctx.createOscillator();
    tritoneOsc.type = 'sine';
    tritoneOsc.frequency.setValueAtTime(50.85, this.ctx.currentTime); // Dissonant tritone

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 2.0);

    subOsc.connect(filter);
    tritoneOsc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambienceGain);

    subOsc.start();
    tritoneOsc.start();

    this.activeAmbienceCleanups.push(() => {
      try {
        gain.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.5);
        setTimeout(() => {
          subOsc.stop();
          tritoneOsc.stop();
        }, 600);
      } catch {}
    });
  }

  // 12. Dry Desert Winds
  private startDesertWinds() {
    if (!this.ctx || !this.ambienceGain) return;
    const noise = this.createWhiteNoiseNode();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, this.ctx.currentTime + 2.0);

    noise.source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambienceGain);
    noise.source.start();

    this.activeAmbienceCleanups.push(() => {
      try {
        gain.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.4);
        setTimeout(() => noise.source.stop(), 500);
      } catch {}
    });
  }

  // Noise generator helpers
  private createWhiteNoiseNode() {
    const bufferSize = this.ctx!.sampleRate * 2;
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.1;
    }
    const source = this.ctx!.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return { source };
  }

  private createPinkNoiseNode() {
    const bufferSize = this.ctx!.sampleRate * 2;
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }
    const source = this.ctx!.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return { source };
  }

  private stopAmbience() {
    this.activeAmbienceCleanups.forEach((cleanup) => {
      try { cleanup(); } catch {}
    });
    this.activeAmbienceCleanups = [];
  }

  // ==========================================
  // PROCEDURAL SCORE & DRONES
  // ==========================================

  public setMusicStyle(style: 'lofi_melancholy' | 'noir_drone' | 'ambient_minimal' | 'cyber_synth' | 'tense_thriller' | 'none') {
    if (this.currentMusicStyle === style) return;
    this.currentMusicStyle = style;

    this.stopMusic();
    if (style === 'none' || !this.ctx || !this.musicGain) return;
    this.resume();

    if (style === 'noir_drone') {
      this.playDroneChords([73.42, 110.0, 174.61], 'sawtooth', 280, 0.16);
    } else if (style === 'lofi_melancholy') {
      this.playDroneChords([87.31, 130.81, 220.0, 329.63], 'sine', 600, 0.22);
    } else if (style === 'cyber_synth') {
      this.playDroneChords([55.0, 82.5, 165.0], 'sawtooth', 350, 0.2);
    } else if (style === 'ambient_minimal') {
      this.playDroneChords([65.41, 98.0], 'triangle', 200, 0.15);
    } else {
      this.playDroneChords([73.42, 110.0], 'sine', 300, 0.18);
    }
  }

  private playDroneChords(frequencies: number[], type: OscillatorType, filterCutoff: number, gainLevel: number) {
    if (!this.ctx || !this.musicGain) return;
    const oscillators: OscillatorNode[] = [];
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterCutoff, this.ctx.currentTime);

    const padGain = this.ctx.createGain();
    padGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    padGain.gain.exponentialRampToValueAtTime(gainLevel, this.ctx.currentTime + 3.0);

    frequencies.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq + (idx % 2 === 0 ? 0.3 : -0.3), this.ctx!.currentTime);
      osc.connect(filter);
      osc.start();
      oscillators.push(osc);
    });

    filter.connect(padGain);
    padGain.connect(this.musicGain);

    this.activeDroneCleanups.push(() => {
      try {
        padGain.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.8);
        setTimeout(() => {
          oscillators.forEach((o) => {
            try { o.stop(); o.disconnect(); } catch {}
          });
        }, 1200);
      } catch {}
    });
  }

  private stopMusic() {
    this.activeDroneCleanups.forEach((c) => {
      try { c(); } catch {}
    });
    this.activeDroneCleanups = [];
  }

  // ==========================================
  // SPOT SFX ENGINE
  // ==========================================

  public triggerSFX(cue: string) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    switch (cue) {
      case 'bus_pass':
        this.playBusPassSFX();
        break;
      case 'projector_click':
        this.playProjectorStartSFX();
        break;
      case 'thunder_rumble':
      case 'thunder':
        this.playThunderSFX();
        break;
      case 'scene_whoosh':
        this.playWhooshSFX();
        break;
      case 'smash_cut':
        this.playSmashCutSFX();
        break;
      case 'glass_clink':
        this.playGlassClinkSFX();
        break;
      case 'phone_ring':
        this.playPhoneRingSFX();
        break;
      case 'footsteps':
        this.playFootstepsSFX();
        break;
      case 'door_creak':
        this.playDoorCreakSFX();
        break;
      default:
        break;
    }
  }

  private playBusPassSFX() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 3.5;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, now);
    filter.frequency.exponentialRampToValueAtTime(380, now + 1.2);
    filter.frequency.exponentialRampToValueAtTime(90, now + 3.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.5, now + 1.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + 3.5);
  }

  public playProjectorStartSFX() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
    const clickGain = this.ctx.createGain();
    clickGain.gain.setValueAtTime(0.7, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(clickGain);
    clickGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);

    const motorOsc = this.ctx.createOscillator();
    motorOsc.type = 'sawtooth';
    motorOsc.frequency.setValueAtTime(40, now + 0.05);
    motorOsc.frequency.exponentialRampToValueAtTime(144, now + 0.6);
    const motorGain = this.ctx.createGain();
    motorGain.gain.setValueAtTime(0.001, now + 0.05);
    motorGain.gain.linearRampToValueAtTime(0.18, now + 0.5);
    motorGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
    motorOsc.connect(motorGain);
    motorGain.connect(this.sfxGain);
    motorOsc.start(now + 0.05);
    motorOsc.stop(now + 1.5);
  }

  private playThunderSFX() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 2.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 3.0);
  }

  private playWhooshSFX() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.6);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.65);
  }

  private playSmashCutSFX() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  private playGlassClinkSFX() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2800 + Math.random() * 400, now);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  private playPhoneRingSFX() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(850, now);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.85);
  }

  private playFootstepsSFX() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.08);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  private playDoorCreakSFX() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.4);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  public stopAll() {
    this.stopAmbience();
    this.stopMusic();
    this.currentAmbienceType = 'none';
    this.currentMusicStyle = null;
  }
}

export const soundEngine = typeof window !== 'undefined' ? new SoundEngine() : (null as unknown as SoundEngine);
