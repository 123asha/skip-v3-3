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

const EASE_OUT = 'elastic.out(0.8, 0.35)';   // spring, 20% softer than 1.0
const offsets = new WeakMap<HTMLElement, number[]>();
const running = new WeakMap<HTMLElement, gsap.core.Tween>();

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
  running.set(row, gsap.to(state, {
    p: 1, duration: 0.9, ease: EASE_OUT,
    onUpdate() {
      for (let i = 0; i < chips.length; i++) cur[i] = from[i] + (target[i] - from[i]) * state.p;
      draw(chips, cur);
    },
  }));
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
    .to(state, { p: 0, duration: 0.9, ease: EASE_OUT });
}
