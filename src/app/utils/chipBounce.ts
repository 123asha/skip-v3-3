import { gsap } from 'gsap';

// Chips in a row are linked like graph nodes (the dotted line across each gap
// is the chip's ::before, see CasesPage.module.css). Pressing one knocks its
// next-door neighbours away until they touch the chip beyond (the whole gap),
// and they spring back, the links stretching and shrinking with them.

export function bounceChips(pressed: HTMLElement) {
  const row = pressed.parentElement;
  if (!row || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const chips = Array.from(row.children) as HTMLElement[];
  const at = chips.indexOf(pressed);
  if (at < 0) return;
  // How far each chip moves at the peak: only the next-door ones, away from
  // the pressed chip, by the full gap — right up against their other neighbour
  const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
  const amp = chips.map((_, i) => (Math.abs(i - at) === 1 ? Math.sign(i - at) * gap : 0));
  const state = { p: 0 };
  const apply = () => {
    chips.forEach((c, i) => {
      const dx = amp[i] * state.p;
      c.style.transform = dx ? `translateX(${dx}px)` : '';
      // Its link to the chip before it spans the gap plus the difference in
      // their offsets — so it stays attached at both ends
      const prev = i > 0 ? amp[i - 1] * state.p : 0;
      c.style.setProperty('--pull', `${dx - prev}px`);
    });
  };
  gsap.killTweensOf(state);
  gsap.timeline({ onUpdate: apply, onComplete: apply })
    .to(state, { p: 1, duration: 0.12, ease: 'power2.out' })
    .to(state, { p: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)' });
}
