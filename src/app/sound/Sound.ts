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
  tap:        { freq: 880, spread: 0.18, decay: 0.09, gain: 0.30, type: 'sine' },
  // Slightly lower & softer — used for hover-feedback (links, buttons)
  hover:      { freq: 660, spread: 0.10, decay: 0.07, gain: 0.22, type: 'sine' },
  // Brighter ping for typing
  type:       { freq: 1100, spread: 0.22, decay: 0.06, gain: 0.16, type: 'triangle' },
  // Logo / nav — slightly warmer
  logo:       { freq: 520, spread: 0.05, decay: 0.12, gain: 0.30, type: 'sine' },
  // Snake eats — quick double pop
  snake:      { freq: 700, spread: 0.30, decay: 0.06, gain: 0.24, type: 'triangle' },
};

type Listener = (on: boolean) => void;

class SoundBus {
  private listeners = new Set<Listener>();
  // Default ON — the user can opt out via the sound icon (persisted as '0').
  private _on = true;

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
  // Case hover: a bouncing rubber-ball "boink" fired as the pointer moves.
  private epic: { lastBounce: number } | null = null;

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

  /** Read saved preference on app boot. Default ON; only an explicit "0"
      from a previous visit (user muted via the icon) turns sound off. */
  init() {
    try {
      const saved = localStorage.getItem('sd_sound_on');
      if (saved === '0') SOUND_BUS.on = false;
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

  /** One rubber-ball "boink": a triangle tone that snaps up then bends down in
      pitch (the ball deforming) with a short decay, rounded by a low-pass so
      it's a bouncy boing rather than a click. Higher/livelier with more speed. */
  private bounce(strength: number) {
    if (!SOUND_BUS.on) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const s = Math.max(0, Math.min(1, strength));
    const f0 = 170 + Math.random() * 50 + s * 230;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f0 * 1.9, now);                  // snaps up…
    osc.frequency.exponentialRampToValueAtTime(f0, now + 0.06);   // …then bends down (rubbery boing)

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1300 + s * 900;                          // rounded, not clicky
    lp.Q.value = 1.0;

    const g = ctx.createGain();
    const peak = 0.16 + s * 0.18;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(peak, now + 0.004);       // sharp attack
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16 + Math.random() * 0.08); // quick decay

    osc.connect(lp).connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  /** Begin the case hover: the ball lands (one bounce). epicMove() then keeps
      it skipping as the pointer moves. */
  epicStart() {
    if (!SOUND_BUS.on) return;
    const ctx = this.getCtx();
    if (!ctx || this.epic) return;
    this.epic = { lastBounce: 0 };
    this.bounce(0.5);
  }

  /** Pointer movement bounces the ball: boinks fire on a throttle that tightens
      with speed, so faster movement = a quicker run of bounces. `intensity` 0–1. */
  epicMove(intensity: number) {
    const e = this.epic;
    if (!e) return;
    const v = Math.max(0, Math.min(1, intensity));
    const t = performance.now();
    const interval = 460 - v * 380; // ~80ms (fast) … 460ms (slow)
    if (t - e.lastBounce >= interval) {
      e.lastBounce = t;
      this.bounce(v);
    }
  }

  /** End the hover — bounce tails ring out on their own. */
  epicStop() {
    this.epic = null;
  }

  /** Directional "whoosh" for zoom in (dir=1) or zoom out (dir=-1).
      Pitch slides up for zoom-in, down for zoom-out — gives tactile sense of scale. */
  playZoom(dir: 1 | -1) {
    if (!SOUND_BUS.on) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const freqStart = dir === 1 ? 320 : 640;
    const freqEnd   = dir === 1 ? 640 : 320;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(freqEnd, now + 0.12);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
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
