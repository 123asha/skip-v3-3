let _ctx: AudioContext | null = null;
export let muted = false;

// Safari requires user gesture to unlock AudioContext — do it on first interaction
if (typeof window !== 'undefined') {
  const unlock = () => {
    if (_ctx && _ctx.state === 'suspended') _ctx.resume();
    else if (!_ctx) { _ctx = new AudioContext(); _ctx.resume(); }
    window.removeEventListener('click', unlock);
    window.removeEventListener('touchend', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('click', unlock);
  window.addEventListener('touchend', unlock);
  window.addEventListener('keydown', unlock);
}

export function setMuted(val: boolean) {
  muted = val;
}

function getCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
  return _ctx;
}

/** Light bamboo / woodblock hit */
export function bamboo(freq = 700, vol = 0.1, dur = 0.08) {
  if (muted) return;
  try {
    const c = getCtx();
    const now = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    const f = c.createBiquadFilter();

    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = 5;

    osc.connect(f);
    f.connect(g);
    g.connect(c.destination);

    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + dur);
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.start(now);
    osc.stop(now + dur + 0.01);
  } catch (_) {}
}
