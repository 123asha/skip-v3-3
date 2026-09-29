import { gsap } from 'gsap';

// Chips in a row are linked like graph nodes (the dotted line across each gap
// is the chip's ::before, see CasesPage.module.css).
//
// settleChips — the selected chip pushes its next-door neighbours away until
// they touch the chip beyond (the whole gap); they spring there and stay while
// it's selected, and spring back when it isn't. The links stretch and shrink
// with them.
// bounceChips — the same push, but only for a moment (chips that don't stay
// selected one at a time).

// A single soft overshoot rather than a wobble
const EASE_OUT = 'back.out(1)';
const offsets = new WeakMap<HTMLElement, number[]>();
const running = new WeakMap<HTMLElement, gsap.core.Tween | gsap.core.Timeline>();

function draw(chips: HTMLElement[], dx: number[]) {
  chips.forEach((c, i) => {
    c.style.transform = dx[i] ? `translateX(${dx[i]}px)` : '';
    // Its link to the chip before it spans the gap plus the difference in
    // their offsets — so it stays attached at both ends
    c.style.setProperty('--pull', `${dx[i] - (i > 0 ? dx[i - 1] : 0)}px`);
  });
}

function pushFrom(row: HTMLElement, chips: HTMLElement[], at: number) {
  const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
  // Only a neighbour with another chip beyond it moves — up against that one
  return chips.map((_, i) => {
    const dir = Math.sign(i - at);
    return at >= 0 && Math.abs(i - at) === 1 && chips[i + dir] ? dir * gap : 0;
  });
}

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// A neighbour with nothing beyond it (an end chip) can't be pushed anywhere,
// so it just hops out this far and springs back
const HOP = 4;

export function settleChips(row: HTMLElement | null, activeIndex: number) {
  if (!row) return;
  const chips = Array.from(row.children) as HTMLElement[];
  const target = pushFrom(row, chips, activeIndex);
  const hop = chips.map((_, i) => {
    const dir = Math.sign(i - activeIndex);
    return activeIndex >= 0 && Math.abs(i - activeIndex) === 1 && !target[i] ? dir * HOP : 0;
  });
  const from = offsets.get(row) ?? chips.map(() => 0);
  const cur = from.slice();
  offsets.set(row, cur);
  if (reduced()) { cur.splice(0, cur.length, ...target); draw(chips, cur); return; }
  running.get(row)?.kill();
  const state = { p: 0, q: 0 };
  const tick = () => {
    for (let i = 0; i < chips.length; i++) {
      cur[i] = from[i] + (target[i] - from[i]) * state.p;
    }
    draw(chips, cur.map((x, i) => x + hop[i] * state.q));
  };
  running.set(row, gsap.timeline({ onUpdate: tick, onComplete: tick })
    .to(state, { p: 1, duration: 0.55, ease: EASE_OUT }, 0)
    .to(state, { q: 1, duration: 0.12, ease: 'power2.out' }, 0)
    .to(state, { q: 0, duration: 0.5, ease: 'power2.inOut' }, 0.12));
}

export function bounceChips(pressed: HTMLElement) {
  const row = pressed.parentElement;
  if (!row || reduced()) return;
  const chips = Array.from(row.children) as HTMLElement[];
  const amp = pushFrom(row, chips, chips.indexOf(pressed));
  const state = { p: 0 };
  const apply = () => draw(chips, amp.map(a => a * state.p));
  gsap.timeline({ onUpdate: apply, onComplete: apply })
    .to(state, { p: 1, duration: 0.12, ease: 'power2.out' })
    .to(state, { p: 0, duration: 0.5, ease: 'power2.inOut' });
}
