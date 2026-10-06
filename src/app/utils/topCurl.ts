/**
 * The page bending away over a roll at the top: everything that climbs into the top
 * band of the screen is laid along one cylinder — its position, its depth and its
 * tilt all follow the same arc, and all share one vanishing point, so the content reads
 * as a single surface curling back rather than as separate pieces. Driven by the
 * scroll of `root`; elements are re-read on every frame (rows that open and close are
 * picked up). Returns a cleanup.
 */
export function attachTopCurl(root: HTMLElement, selector: string, opts: { zone?: number } = {}) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const zone = opts.zone ?? 0.13;
  // The curved part of the sheet is shaded: darker towards the turning edge
  const shade = document.createElement('div');
  shade.setAttribute('aria-hidden', 'true');
  shade.style.cssText = 'position:fixed;left:0;right:0;top:0;pointer-events:none;z-index:150;opacity:0;transition:opacity 0.2s';
  document.body.appendChild(shade);
  let raf = 0;
  const touched = new Set<HTMLElement>();
  const clear = (el: HTMLElement) => { el.style.transform = ''; el.style.opacity = ''; el.style.transformOrigin = ''; };
  const apply = () => {
    raf = 0;
    const vh = window.innerHeight, vw = window.innerWidth;
    const y0 = vh * zone;               // where the page starts to bend
    const Rc = y0 / 1.5;                // radius of the roll: a quarter turn and a bit across the band
    const P = 900;                     // the one perspective for everything
    const vx = vw / 2, vy = y0;         // the shared vanishing point
    shade.style.height = `${y0}px`;
    shade.style.background = 'linear-gradient(to bottom, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.08) 55%, rgba(0,0,0,0) 100%)';
    shade.style.opacity = root.scrollTop > 4 ? '1' : '0';
    const now = new Set<HTMLElement>();
    root.querySelectorAll<HTMLElement>(selector).forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.height === 0) return;
      const ey = r.top + r.height / 2;
      if (ey >= y0) return;
      const u = y0 - ey;                // arc length along the page
      const th = Math.min(u / Rc, 1.7);
      const dy = (y0 - Rc * Math.sin(th)) - ey;   // where the arc puts it, relative to where it sits
      const z = -Rc * (1 - Math.cos(th));
      const ex = r.left + r.width / 2;
      const ox = vx - ex, oy = vy - ey;
      el.style.transformOrigin = '50% 50%';
      el.style.transform = `translate(${ox.toFixed(1)}px, ${oy.toFixed(1)}px) perspective(${P}px) translate(${(-ox).toFixed(1)}px, ${(-oy).toFixed(1)}px) translateY(${dy.toFixed(1)}px) translateZ(${z.toFixed(1)}px) rotateX(${((th * 180) / Math.PI).toFixed(1)}deg)`;
      // The sheet stays solid as it turns; only once it has gone over the roll does it vanish
      el.style.opacity = String(Math.max(0, Math.min(1, (1.65 - th) / 0.4)));
      now.add(el);
    });
    touched.forEach(el => { if (!now.has(el)) clear(el); });
    touched.clear(); now.forEach(el => touched.add(el));
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(apply); };
  root.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  apply();
  return () => {
    root.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    cancelAnimationFrame(raf);
    touched.forEach(clear);
    shade.remove();
  };
}
