import { gsap } from 'gsap';

// Chips in a row are linked like graph nodes (the dotted line across each gap
// is the chip's ::before, see CasesPage.module.css).
//
// settleChips — at rest the chips touch; once one is selected they all spread
// apart evenly (a dotted link in every gap) and stay so while any is selected;
// they close up again only when nothing is.
// bounceChips — the same push, but only for a moment (chips that don't stay
// selected one at a time).

// A single soft overshoot rather than a wobble
const EASE_OUT = 'back.out(1)';
const offsets = new WeakMap<HTMLElement, number[]>();
const running = new WeakMap<HTMLElement, gsap.core.Tween | gsap.core.Timeline>();

function draw(chips: HTMLElement[], dx: number[], inFlow = false) {
  chips.forEach((c, i) => {
    // Its link to the chip before it spans the gap plus the difference in
    // their offsets — so it stays attached at both ends
    const link = dx[i] - (i > 0 ? dx[i - 1] : 0);
    c.style.setProperty('--pull', `${link}px`);
    if (inFlow) {
      // A fixed-width row (the phone menu): the gap opens as a real margin
      // and the chips give way by shrinking, so the ends never move
      c.style.marginLeft = i > 0 && link ? `${link}px` : '';
    } else {
      c.style.transform = dx[i] ? `translateX(${dx[i]}px)` : '';
    }
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

export function settleChips(row: HTMLElement | null, activeIndex: number, inFlow = false) {
  if (!row) return;
  const chips = Array.from(row.children) as HTMLElement[];
  // Together at rest; once anything is picked, every gap opens by the same
  // step (a dotted link in each) and stays open — switching the pick moves
  // nothing, the chips never close up again while one is selected
  // (spread symmetrically about the row's middle, so a centred row stays centred)
  const mid = (chips.length - 1) / 2;
  const target = chips.map((_, i) => (activeIndex >= 0 ? (i - mid) * SPREAD : 0));
  const from = offsets.get(row) ?? chips.map(() => 0);
  const cur = from.slice();
  offsets.set(row, cur);
  if (reduced()) { cur.splice(0, cur.length, ...target); draw(chips, cur, inFlow); return; }
  running.get(row)?.kill();
  const state = { p: 0 };
  const tick = () => {
    for (let i = 0; i < chips.length; i++) cur[i] = from[i] + (target[i] - from[i]) * state.p;
    draw(chips, cur, inFlow);
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
