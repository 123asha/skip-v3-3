/**
 * Lightweight ping/bamboo-tap sound system — Web Audio API only, no asset files.
 * Each tap is a short percussive tone with random pitch variation around a
 * base frequency, so repeated triggers (e.g. typing in the form) don't feel
 * monotonous. Disabled on coarse-pointer / touch devices and on `prefers-reduced-motion`.
 *
 * Usage:
 *   import { sound, SOUND_BUS } from './sound/Sound';
 *   sound.play('tap');           // single bamboo hit
 *   sound.toggle();              // mute / unmute
 *   SOUND_BUS.subscribe(on => …) // for the UI icon
 */

type ToneOpts = {
  /** Hertz */
  freq: number;
  /** Random ± fraction added to freq per call (0–1) */
  spread?: number;
  /** Decay seconds */
  decay?: number;
  /** Peak gain (0–1) */
  gain?: number;
  /** "sine" | "triangle" | "square" | "sawtooth" */
  type?: OscillatorType;
};

const PRESETS: Record<string, ToneOpts> = {
  // Soft bamboo / wood block tap — high mid pitch, fast decay
  tap:        { freq: 880, spread: 0.18, decay: 0.08, gain: 0.18, type: 'sine' },
  // Slightly lower & softer — used for hover-feedback (links, buttons)
  hover:      { freq: 660, spread: 0.10, decay: 0.06, gain: 0.10, type: 'sine' },
  // Brighter ping for typing
  type:       { freq: 1100, spread: 0.22, decay: 0.05, gain: 0.10, type: 'triangle' },
  // Logo / nav — slightly warmer
  logo:       { freq: 520, spread: 0.05, decay: 0.10, gain: 0.14, type: 'sine' },
  // Snake eats — quick double pop
  snake:      { freq: 700, spread: 0.30, decay: 0.05, gain: 0.16, type: 'triangle' },
};

type Listener = (on: boolean) => void;

class SoundBus {
  private listeners = new Set<Listener>();
  // Default OFF — opt-in via the sound icon or designer mode.
  private _on = false;

  get on() { return this._on; }
  set on(v: boolean) {
    if (this._on === v) return;
    this._on = v;
    try { localStorage.setItem('sd_sound_on', v ? '1' : '0'); } catch { /* ignore */ }
    this.listeners.forEach(l => l(v));
  }

  subscribe(l: Listener) {
    this.listeners.add(l);
    l(this._on);
    return () => { this.listeners.delete(l); };
  }
}

export const SOUND_BUS = new SoundBus();

class SoundEngine {
  private ctx: AudioContext | null = null;
  private lastByType: Record<string, number> = {};
  // Sustained warm "festival" pad for case hover — reacts to mouse movement.
  private epic: {
    master: GainNode; oscs: OscillatorNode[]; lp: BiquadFilterNode;
  } | null = null;

  private getCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (this.ctx) return this.ctx;
    const Ctor = (window.AudioContext ?? (window as any).webkitAudioContext) as
      | (typeof AudioContext)
      | undefined;
    if (!Ctor) return null;
    this.ctx = new Ctor();
    return this.ctx;
  }

  toggle() { SOUND_BUS.on = !SOUND_BUS.on; if (SOUND_BUS.on) this.unlock(); }
  enable() { SOUND_BUS.on = true; this.unlock(); }
  disable() { SOUND_BUS.on = false; }

  /** iOS / Safari requires a user gesture before any sound plays. */
  unlock() {
    const ctx = this.getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  /** Read saved preference on app boot. Default OFF; only explicit "1"
      from a previous visit (or designer mode) turns sound on. */
  init() {
    try {
      const saved = localStorage.getItem('sd_sound_on');
      if (saved === '1') SOUND_BUS.on = true;
    } catch { /* ignore */ }
  }

  play(kind: keyof typeof PRESETS, throttleMs = 35) {
    if (!SOUND_BUS.on) return;
    const ctx = this.getCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const wall = performance.now();
    const last = this.lastByType[kind] ?? 0;
    if (wall - last < throttleMs) return; // dedupe rapid hover-triggers
    this.lastByType[kind] = wall;

    const p = PRESETS[kind];
    const spread = p.spread ?? 0.1;
    const freq = p.freq * (1 + (Math.random() * 2 - 1) * spread);
    const decay = p.decay ?? 0.08;
    const gain = p.gain ?? 0.15;

    const osc = ctx.createOscillator();
    osc.type = p.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, now);
    // Tiny pitch slide down — wood-tap character
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + decay);

    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + decay + 0.02);
  }

  /** Pair of taps in quick succession — used for the snake eat moment. */
  playDouble(kind: keyof typeof PRESETS) {
    if (!SOUND_BUS.on) return;
    this.play(kind, 0);
    setTimeout(() => this.play(kind, 0), 70);
  }

  /** Start a long, sustained "epic" background drone (a low fifth — 2 notes)
      while hovering a case card. Mouse movement then bends the pitch up and
      slightly muffles it via epicMove() — the drone "warps" with motion. */
  epicStart() {
    if (!SOUND_BUS.on) return;
    const ctx = this.getCtx();
    if (!ctx || this.epic) return;
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.05, now + 0.9); // slow epic swell

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1700; // dark/cinematic by default
    lp.Q.value = 0.6;
    master.connect(lp).connect(ctx.destination);

    // Low open fifth — A2 + E3 — sustained, cinematic
    const freqs = [110.0, 164.81];
    const oscs: OscillatorNode[] = freqs.map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? 'sawtooth' : 'sine'; // a little harmonic body on the root
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = i === 0 ? 0.22 : 0.6;
      o.connect(g).connect(master);
      o.start(now);
      return o;
    });

    this.epic = { master, oscs, lp };
  }

  /** Mouse movement warps the drone: pitch bends up + a touch of muffle,
      proportional to pointer speed, then glides back when still. `intensity` 0–1. */
  epicMove(intensity: number) {
    const e = this.epic;
    if (!e) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const v = Math.max(0, Math.min(1, intensity));

    // Pitch bends up to +5 semitones (500 cents) with speed, then eases back.
    e.oscs.forEach(o => {
      o.detune.cancelScheduledValues(now);
      o.detune.setTargetAtTime(v * 500, now, 0.08);
      o.detune.setTargetAtTime(0, now + 0.18, 0.5);
    });
    // Slight muffle while moving — filter dips, then recovers.
    e.lp.frequency.cancelScheduledValues(now);
    e.lp.frequency.setTargetAtTime(1700 - v * 700, now, 0.08);
    e.lp.frequency.setTargetAtTime(1700, now + 0.25, 0.6);
  }

  /** Fade out + stop the bed. */
  epicStop() {
    const e = this.epic;
    if (!e) return;
    this.epic = null;
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    e.master.gain.cancelScheduledValues(now);
    e.master.gain.setTargetAtTime(0.0001, now, 0.3);
    const stopAt = now + 1.4;
    e.oscs.forEach(o => { try { o.stop(stopAt); } catch { /* already stopped */ } });
  }

  /** Soft, "epic" ambient swell — an open fifth/octave chord with slow attack
      and long release at very low volume. One-shot version. */
  playEpic(throttleMs = 700) {
    if (!SOUND_BUS.on) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const wall = performance.now();
    if (wall - (this.lastByType['epic'] ?? 0) < throttleMs) return;
    this.lastByType['epic'] = wall;

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.045, now + 0.4);   // soft swell in
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);  // long release
    master.connect(ctx.destination);

    // Open, cinematic interval — root, fifth, octave
    const freqs = [196, 294, 392]; // G3 · D4 · G4
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      const g = ctx.createGain();
      g.gain.setValueAtTime(i === 0 ? 1 : 0.55, now);
      osc.connect(g).connect(master);
      osc.start(now);
      osc.stop(now + 1.9);
    });
  }
}

export const sound = new SoundEngine();
