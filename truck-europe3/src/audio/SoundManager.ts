export class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Engine audio nodes
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private oscSub: OscillatorNode | null = null;
  private turboOsc: OscillatorNode | null = null;
  private turboGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineRunning: boolean = false;

  // Rain audio
  private rainNode: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;

  private lastIndicatorTick = 0;
  private lastFootstepTime = 0;

  // Horn nodes
  private hornOsc1: OscillatorNode | null = null;
  private hornOsc2: OscillatorNode | null = null;
  private hornGain: GainNode | null = null;

  constructor() {
    // Initialized lazily on user gesture
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.engineGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.setupEngineSynth();
      this.setupRainSynth();
    } catch (e) {
      console.warn('AudioContext initialization failed:', e);
    }
  }

  public triggerHaptic(pattern: number | number[] = 25) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignored if device does not support haptics
      }
    }
  }

  private setupEngineSynth() {
    if (!this.ctx || !this.engineGain) return;

    // Sub-bass rumble
    this.oscSub = this.ctx.createOscillator();
    this.oscSub.type = 'triangle';
    this.oscSub.frequency.setValueAtTime(32, this.ctx.currentTime);

    // Primary combustion harmonics
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = 'sawtooth';
    this.osc1.frequency.setValueAtTime(65, this.ctx.currentTime);

    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'sawtooth';
    this.osc2.frequency.setValueAtTime(130, this.ctx.currentTime);

    // Lowpass filter to muffle raw saw into deep diesel chug
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(280, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    // Turbo whistle
    this.turboOsc = this.ctx.createOscillator();
    this.turboOsc.type = 'sine';
    this.turboOsc.frequency.setValueAtTime(1200, this.ctx.currentTime);

    this.turboGain = this.ctx.createGain();
    this.turboGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.turboOsc.connect(this.turboGain);
    this.turboGain.connect(this.masterGain!);

    // Connect engine nodes
    this.oscSub.connect(this.engineFilter);
    this.osc1.connect(this.engineFilter);
    this.osc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);

    this.oscSub.start();
    this.osc1.start();
    this.osc2.start();
    this.turboOsc.start();
  }

  private setupRainSynth() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
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
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
      b6 = white * 0.115926;
    }

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.rainNode = this.ctx.createBufferSource();
    this.rainNode.buffer = buffer;
    this.rainNode.loop = true;
    this.rainNode.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
    this.rainNode.start();
  }

  public setEngineRunning(running: boolean) {
    this.engineRunning = running;
    if (!this.ctx || !this.engineGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const targetGain = running ? 0.35 : 0;
    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.2);

    if (running) {
      this.playIgnitionSound();
      this.triggerHaptic([40, 60, 80]);
    } else {
      if (this.turboGain) this.turboGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    }
  }

  public updateEngine(rpm: number, throttle: number, speedKmh: number) {
    if (!this.ctx || !this.engineRunning || !this.osc1 || !this.osc2 || !this.oscSub || !this.engineFilter || !this.turboGain || !this.turboOsc) return;

    const baseFreq = 30 + (rpm / 2500) * 80;
    this.oscSub.frequency.setTargetAtTime(baseFreq * 0.5, this.ctx.currentTime, 0.05);
    this.osc1.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.05);
    this.osc2.frequency.setTargetAtTime(baseFreq * 2, this.ctx.currentTime, 0.05);

    const filterCutoff = 220 + (rpm / 2500) * 900 + throttle * 350;
    this.engineFilter.frequency.setTargetAtTime(filterCutoff, this.ctx.currentTime, 0.05);

    const turboTargetGain = throttle > 0.3 && rpm > 1200 ? (throttle * 0.08 * (rpm / 2200)) : 0.0001;
    const turboFreq = 1100 + (rpm / 2500) * 2200;
    this.turboOsc.frequency.setTargetAtTime(turboFreq, this.ctx.currentTime, 0.08);
    this.turboGain.gain.setTargetAtTime(turboTargetGain, this.ctx.currentTime, 0.1);

    const targetGain = 0.25 + (throttle * 0.25) + (Math.min(speedKmh, 100) / 100) * 0.15;
    this.engineGain?.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);
  }

  public playIgnitionSound() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const starterOsc = this.ctx.createOscillator();
    const starterGain = this.ctx.createGain();
    starterOsc.type = 'sawtooth';
    starterOsc.frequency.setValueAtTime(140, now);
    starterOsc.frequency.exponentialRampToValueAtTime(320, now + 0.5);

    starterGain.gain.setValueAtTime(0.2, now);
    starterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    starterOsc.connect(starterGain);
    starterGain.connect(this.sfxGain);

    starterOsc.start(now);
    starterOsc.stop(now + 0.6);
  }

  public playAirBrake() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.6);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + 0.5);
    filter.Q.setValueAtTime(1.8, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    this.triggerHaptic(30);
  }

  public playDoorSound(open: boolean) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(open ? 180 : 260, now);
    osc.frequency.exponentialRampToValueAtTime(open ? 80 : 50, now + 0.18);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.22);
    this.triggerHaptic([30, 40]);
  }

  public playFootstep() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    if (now - this.lastFootstepTime < 0.28) return;
    this.lastFootstepTime = now;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90 + Math.random() * 20, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playSeatAdjustSound() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.1);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.13);
    this.triggerHaptic(15);
  }

  public playGearShift() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.09);
    this.triggerHaptic(20);
  }

  public playIndicatorTick() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    if (now - this.lastIndicatorTick < 0.25) return;
    this.lastIndicatorTick = now;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.03);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  public startHorn() {
    if (!this.ctx || !this.sfxGain || this.hornGain) return;
    const now = this.ctx.currentTime;

    this.hornGain = this.ctx.createGain();
    this.hornGain.gain.setValueAtTime(0.001, now);
    this.hornGain.gain.linearRampToValueAtTime(0.45, now + 0.05);

    this.hornOsc1 = this.ctx.createOscillator();
    this.hornOsc1.type = 'sawtooth';
    this.hornOsc1.frequency.setValueAtTime(349.23, now);

    this.hornOsc2 = this.ctx.createOscillator();
    this.hornOsc2.type = 'sawtooth';
    this.hornOsc2.frequency.setValueAtTime(440.00, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);

    this.hornOsc1.connect(filter);
    this.hornOsc2.connect(filter);
    filter.connect(this.hornGain);
    this.hornGain.connect(this.sfxGain);

    this.hornOsc1.start(now);
    this.hornOsc2.start(now);
    this.triggerHaptic(50);
  }

  public stopHorn() {
    if (!this.ctx || !this.hornGain) return;
    const now = this.ctx.currentTime;
    this.hornGain.gain.linearRampToValueAtTime(0.001, now + 0.08);

    setTimeout(() => {
      if (this.hornOsc1) {
        this.hornOsc1.stop();
        this.hornOsc1.disconnect();
        this.hornOsc1 = null;
      }
      if (this.hornOsc2) {
        this.hornOsc2.stop();
        this.hornOsc2.disconnect();
        this.hornOsc2 = null;
      }
      this.hornGain = null;
    }, 100);
  }

  public playHitchSound() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.3);

    setTimeout(() => {
      this.playAirBrake();
    }, 150);
    this.triggerHaptic([60, 40, 60]);
  }

  public setRainVolume(active: boolean) {
    if (!this.ctx || !this.rainGain) return;
    const target = active ? 0.3 : 0;
    this.rainGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.5);
  }

  public playJobSuccess() {
    if (!this.ctx || !this.sfxGain) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, index) => {
      setTimeout(() => {
        if (!this.ctx || !this.sfxGain) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.42);
      }, index * 110);
    });
    this.triggerHaptic([50, 50, 100, 100]);
  }

  public playButtonClick() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
    this.triggerHaptic(10);
  }

  public setMasterVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : vol, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }
}
