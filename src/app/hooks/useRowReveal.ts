import { useEffect, type RefObject } from 'react';
import { gsap } from 'gsap';

/** Table rows rise into place one after another as they scroll into view:
 *  each row fades up from a little below, and rows arriving together follow
 *  each other top to bottom. Once per row. */
export function useRowReveal(rootRef: RefObject<HTMLElement | null>, selector: string) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rows = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (!rows.length) return;
    gsap.set(rows, { opacity: 0, y: 18 });
    const io = new IntersectionObserver(entries => {
      const arriving = entries
        .filter(e => e.isIntersecting)
        .map(e => e.target as HTMLElement)
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      arriving.forEach((row, i) => {
        io.unobserve(row);
        gsap.to(row, {
          opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: i * 0.06,
          clearProps: 'transform,opacity',
        });
      });
    }, { threshold: 0, rootMargin: '0px 0px -4% 0px' });
    rows.forEach(r => io.observe(r));
    return () => io.disconnect();
  }, [rootRef, selector]);
}
