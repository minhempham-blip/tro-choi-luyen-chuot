/**
 * Web Audio API synthesizer for child-friendly sound effects and background music.
 * Completely standalone - no external MP3/audio files needed.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isBgmPlaying = false;
  private bgmIntervalId: number | null = null;

  private isSoundEnabled = true;
  private isMusicEnabled = true;
  private sfxVolume = 0.7;
  private bgmVolume = 0.35;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public enableAudioOnUserGesture() {
    this.initContext();
    if (this.isMusicEnabled && !this.isBgmPlaying) {
      this.startBGM();
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.isSoundEnabled ? this.sfxVolume : 0, this.ctx.currentTime);
    }
  }

  public setBgmVolume(vol: number) {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(this.isMusicEnabled ? this.bgmVolume : 0, this.ctx.currentTime);
    }
  }

  public toggleSound(enabled?: boolean) {
    this.isSoundEnabled = enabled !== undefined ? enabled : !this.isSoundEnabled;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.isSoundEnabled ? this.sfxVolume : 0, this.ctx.currentTime);
    }
    return this.isSoundEnabled;
  }

  public toggleMusic(enabled?: boolean) {
    this.isMusicEnabled = enabled !== undefined ? enabled : !this.isMusicEnabled;
    if (this.isMusicEnabled) {
      if (!this.isBgmPlaying) this.startBGM();
    } else {
      this.stopBGM();
    }
    return this.isMusicEnabled;
  }

  public getSoundEnabled() { return this.isSoundEnabled; }
  public getMusicEnabled() { return this.isMusicEnabled; }

  // ---------------- SOUND EFFECTS ----------------

  /** Soft cheerful pop for hovering cards and items */
  public playPop() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /** Crisp click / tick for button presses */
  public playClick() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /** Double click distinct double tap */
  public playDblClick() {
    this.playClick();
    setTimeout(() => this.playPop(), 90);
  }

  /** Right-click sparkling tone */
  public playRightClick() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);
      gain.gain.setValueAtTime(0.15, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.12);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.12);
    });
  }

  /** Success chime (Ding!) */
  public playSuccess() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.25, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.25);
    });
  }

  /** Gentle boing for mistake (no harsh buzz!) */
  public playError() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /** Bubble pop sound */
  public playBubblePop() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.07);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  /** Mole whacking thud sound */
  public playWhack() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /** Egg crack & cute chirp */
  public playEggCrack() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    // Crack
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(500, now);
    osc1.frequency.exponentialRampToValueAtTime(180, now + 0.06);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.06);

    // Chirp
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(950, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(1600, now + 0.18);
    gain2.gain.setValueAtTime(0.2, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.22);
  }

  /** Smooth swoosh when dragging or dropping */
  public playSwoosh() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.07);
    osc.frequency.linearRampToValueAtTime(350, now + 0.14);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  /** Star chime played 1..10 in result screen */
  public playStarChime(index: number) {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const baseFreq = 440;
    // Ascending pentatonic/major scale steps
    const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 24];
    const semitones = scale[Math.min(scale.length - 1, Math.max(0, index))];
    const freq = baseFreq * Math.pow(2, semitones / 12);

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  /** Fanfare when completing an exercise */
  public playFanfare() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    // C4, E4, G4, C5 arpeggio, hold C5
    const chord = [
      { f: 523.25, t: 0.0, d: 0.12 },
      { f: 659.25, t: 0.12, d: 0.12 },
      { f: 783.99, t: 0.24, d: 0.14 },
      { f: 1046.5, t: 0.38, d: 0.6 }
    ];

    chord.forEach(({ f, t, d }) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + t);
      gain.gain.setValueAtTime(0.28, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + t);
      osc.stop(now + t + d);
    });
  }

  /** Scroll wheel tick */
  public playScrollTick() {
    if (!this.isSoundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  // ---------------- GENTLE BACKGROUND MUSIC (Looping Marimba Melody) ----------------
  public startBGM() {
    if (this.isBgmPlaying) return;
    this.initContext();
    if (!this.ctx || !this.bgmGain) return;

    this.isBgmPlaying = true;
    const notes = [
      261.63, 329.63, 392.00, 523.25, // C4, E4, G4, C5
      440.00, 392.00, 329.63, 261.63, // A4, G4, E4, C4
      293.66, 349.23, 440.00, 392.00, // D4, F4, A4, G4
      329.63, 293.66, 261.63, 392.00  // E4, D4, C4, G4
    ];

    let noteIndex = 0;
    const stepDuration = 360; // ms per beat

    const playNote = () => {
      if (!this.isBgmPlaying || !this.isMusicEnabled || !this.ctx || !this.bgmGain) return;
      const freq = notes[noteIndex];
      noteIndex = (noteIndex + 1) % notes.length;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(now);
      osc.stop(now + 0.35);
    };

    this.bgmIntervalId = window.setInterval(playNote, stepDuration);
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }
}

export const audioEngine = new AudioEngine();
