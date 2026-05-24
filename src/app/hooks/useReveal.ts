/**
 * useReveal — GSAP scroll-entrance animations for pages with custom scroll
 * containers (ExpertizaPage, CasesPage, LabPage).
 *
 * Usage:
 *   1. Call useReveal(pageRef) inside the page component.
 *   2. Add data-reveal to any element you want to animate in.
 *   3. Optionally add data-reveal-delay="0.1" for per-element delay offset.
 *   4. For staggered groups add data-reveal-stagger to the parent — its direct
 *      children animate in sequence automatically.
 */
import { useEffect, RefObject } from 'react';
import { gsap } from 'gsap';

const Y      = 22;       // px — vertical travel
const DUR    = 0.52;     // seconds
const EASE   = 'power3.out';
const THRESH = 0.12;     // fraction visible before trigger fires

export function useReveal(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    // ── Collect targets ───────────────────────────────────────────────────
    const singles  = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    const groups   = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal-stagger]'));
    const children = groups.flatMap(g =>
      Array.from(g.children).map(c => c as HTMLElement)
    );

    const all = [...singles, ...children];
    if (!all.length) return;

    gsap.set(all, { opacity: 0, y: Y });

    // ── Observer ──────────────────────────────────────────────────────────
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;

          // Per-element delay (data-reveal-delay) or auto stagger for children
          let delay = parseFloat(el.dataset.revealDelay ?? '0');

          // If the element is a child inside a stagger group, use its index
          if (!el.dataset.reveal && !el.dataset.revealDelay) {
            const parent = el.parentElement;
            if (parent) {
              const idx = Array.from(parent.children).indexOf(el);
              delay = idx * 0.1;
            }
          }

          gsap.to(el, { opacity: 1, y: 0, duration: DUR, ease: EASE, delay });
          obs.unobserve(el);
        });
      },
      { root, threshold: THRESH },
    );

    all.forEach(el => obs.observe(el));

    return () => obs.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
