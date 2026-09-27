import { SOUND_BUS } from '../sound/Sound';

/** Ball-hit sound — the same tone as the site's button hover (sound.play
 *  'hover'): a sine around 660Hz with a small random spread, sliding down in
 *  pitch over a 70ms decay. Soft touches play a little quieter than hard
 *  hits. Silent when the site's sound icon is switched off. */
export function knock(ctx: AudioContext, strength: number) {
  if (!SOUND_BUS.on) return;
  const now = ctx.currentTime;
  const freq = 660 * (1 + (Math.random() * 2 - 1) * 0.1);
  const decay = 0.07;
  const gain = 0.22 * Math.min(1, 0.4 + Math.max(0, strength) * 0.8);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + decay);

  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + decay);

  osc.connect(g).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + decay + 0.02);
}

let shared: AudioContext | null = null;
/** One context for the whole page. Browsers keep it silent until the first
 *  click or key press on the page; after that every call is heard. */
export function playKnock(strength: number) {
  if (!shared) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    shared = new Ctx();
  }
  if (shared.state === 'suspended') shared.resume();
  if (shared.state !== 'running') return;
  knock(shared, strength);
}
