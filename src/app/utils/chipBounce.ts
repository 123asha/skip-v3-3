import { gsap } from 'gsap';

// Chips in a row are linked like graph nodes (the dotted line across each gap
// is the chip's ::before, see CasesPage.module.css).
//
// settleChips — at rest the chips touch; the selected one pushes the others
// away from it (a dotted link opens on each side of it), they spring there and
// stay while it's selected, and close up again when nothing is.
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

// How far chips spread from the selected one — also the length of the
// dotted link that opens up between them (the row itself has no gap at rest)
const SPREAD = 12;

function pushFrom(_row: HTMLElement, chips: HTMLElement[], at: number) {
  // Every chip moves away from the selected one by the same step, so the rest
  // keep touching each other and only the selected chip's links open up
  return chips.map((_, i) => (at >= 0 ? Math.sign(i - at) * SPREAD : 0));
}

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function settleChips(row: HTMLElement | null, activeIndex: number) {
  if (!row) return;
  const chips = Array.from(row.children) as HTMLElement[];
  const target = pushFrom(row, chips, activeIndex);
  const from = offsets.get(row) ?? chips.map(() => 0);
  const cur = from.slice();
  offsets.set(row, cur);
  if (reduced()) { cur.splice(0, cur.length, ...target); draw(chips, cur); return; }
  running.get(row)?.kill();
  const state = { p: 0 };
  const tick = () => {
    for (let i = 0; i < chips.length; i++) cur[i] = from[i] + (target[i] - from[i]) * state.p;
    draw(chips, cur);
  };
  running.set(row, gsap.to(state, { p: 1, duration: 0.55, ease: EASE_OUT, onUpdate: tick, onComplete: tick }));
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
