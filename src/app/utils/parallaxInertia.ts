// A touch of inertia for the scroll parallax: each picture doesn't jump to its
// scroll-driven offset but closes a share of the gap every frame, so it
// trails the scroll slightly and settles smoothly.
//
// INERTIA — how much of the remaining gap is left each frame (60fps): small
// numbers are a light touch, close to 1 would be very floaty.
const INERTIA = 0.8;

const current = new WeakMap<HTMLElement, number>();
let raf = 0;
const targets = new Map<HTMLElement, { to: number; apply: (el: HTMLElement, v: number) => void }>();

function frame() {
  raf = 0;
  let moving = false;
  targets.forEach(({ to, apply }, el) => {
    const from = current.get(el) ?? to;
    const next = Math.abs(to - from) < 0.01 ? to : to + (from - to) * INERTIA;
    current.set(el, next);
    apply(el, next);
    if (next !== to) moving = true;
    else targets.delete(el);
  });
  if (moving) raf = requestAnimationFrame(frame);
}

/** Ease `el` towards offset `to`; `apply` writes the offset to the element. */
export function driftTo(el: HTMLElement, to: number, apply: (el: HTMLElement, v: number) => void) {
  targets.set(el, { to, apply });
  if (!current.has(el)) current.set(el, to);   // first time: no drift in from 0
  if (!raf) raf = requestAnimationFrame(frame);
}
