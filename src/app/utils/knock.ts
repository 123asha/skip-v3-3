import { SOUND_BUS, sharedAudio } from '../sound/Sound';

/** Ball-hit sound — the same tone as the site's button hover (sound.play
 *  'hover'): a sine around 594Hz (10% under the hover tap) with a small random spread, sliding down in
 *  pitch over a 70ms decay. Soft touches play a little quieter than hard
 *  hits. Silent when the site's sound icon is switched off. */
export function knock(ctx: AudioContext, strength: number) {
  if (!SOUND_BUS.on) return;
  const now = ctx.currentTime;
  const freq = 594 * (1 + (Math.random() * 2 - 1) * 0.1);
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

/** The site's one audio context (sound/Sound.ts) — kept awake by every tap. */
export function playKnock(strength: number) {
  const ctx = sharedAudio();
  if (!ctx) return;
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  if (ctx.state !== 'running') return;
  knock(ctx, strength);
}
