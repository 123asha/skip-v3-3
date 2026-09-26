/** Dull bamboo knock, synthesised — no audio files. Shared by the hero
 *  constellation and the case cards so they sound like one material. */
export function knock(ctx: AudioContext, strength: number) {
  const now = ctx.currentTime;
  const dur = 0.12;
  const peak = 0.12 + Math.min(strength, 1) * 0.4;

  const bufferSize = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 260 + Math.random() * 90;
  bandpass.Q.value = 0.6;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 900;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0, now);
  noiseGain.gain.linearRampToValueAtTime(Math.min(peak, 0.55), now + 0.004);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

  noise.connect(bandpass).connect(lowpass).connect(noiseGain).connect(ctx.destination);
  noise.start(now);
  noise.stop(now + dur);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  const baseFreq = 170 + Math.random() * 40;
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.65, now + 0.06);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0, now);
  oscGain.gain.linearRampToValueAtTime(Math.min(peak * 0.45, 0.25), now + 0.004);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  osc.connect(oscGain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.1);
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
