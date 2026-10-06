/**
 * The page rolling over the top edge of the screen and going up out of sight.
 * Everything that climbs into the top band is laid along one cylinder — position,
 * depth and tilt all follow the same arc, with one shared vanishing point — so the
 * content reads as a single surface turning over a roll. Small pieces (rows, text)
 * each turn about their own middle; tall ones (cards) are cut into thin strips, each
 * strip following the arc at its own height, so a card bends continuously like a sheet.
 * Driven by the scroll of `root`; elements are re-read on every frame. Returns a cleanup.
 */
const SLICES = 12;

export function attachTopCurl(root: HTMLElement, selector: string, opts: { zone?: number } = {}) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const zone = opts.zone ?? 0.13;
  // The curved part of the sheet is shaded: darker towards the turning edge
  const shade = document.createElement('div');
  shade.setAttribute('aria-hidden', 'true');
  shade.style.cssText = 'position:fixed;left:0;right:0;top:0;pointer-events:none;z-index:162;opacity:0;transition:opacity 0.2s';
  document.body.appendChild(shade);
  let raf = 0;
  const touched = new Set<HTMLElement>();
  const clear = (el: HTMLElement) => { el.style.transform = ''; el.style.opacity = ''; el.style.transformOrigin = ''; el.style.visibility = ''; };

  // Strips of the tall pieces: one fixed layer per piece, built while it is bending
  const layers = new Map<HTMLElement, { box: HTMLDivElement; strips: HTMLDivElement[] }>();
  const dropLayer = (el: HTMLElement) => {
    const l = layers.get(el); if (!l) return;
    l.box.remove(); layers.delete(el); el.style.visibility = '';
  };
  const buildLayer = (el: HTMLElement, r: DOMRect) => {
    const box = document.createElement('div');
    box.setAttribute('aria-hidden', 'true');
    box.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;z-index:161';
    const strips: HTMLDivElement[] = [];
    const sh = r.height / SLICES;
    for (let k = 0; k < SLICES; k++) {
      const strip = document.createElement('div');
      strip.style.cssText = `position:absolute;overflow:hidden;left:${r.left}px;width:${r.width}px;top:${r.top + k * sh}px;height:${sh + 1}px;pointer-events:none;will-change:transform`;
      const clone = el.cloneNode(true) as HTMLElement;
      clone.style.cssText += `;position:absolute;left:0;top:${-k * sh}px;width:${r.width}px;height:${r.height}px;margin:0;transform:none;opacity:1;visibility:visible`;
      strip.appendChild(clone);
      box.appendChild(strip); strips.push(strip);
    }
    document.body.appendChild(box);
    const l = { box, strips }; layers.set(el, l); return l;
  };

  const apply = () => {
    raf = 0;
    const vh = window.innerHeight, vw = window.innerWidth;
    const y0 = vh * zone;               // where the page starts to bend
    const Rc = y0;                      // the roll: its top is the top edge of the screen, so the page goes over it and up out of sight
    const P = 900;                      // the one perspective for everything
    const vx = vw / 2, vy = y0;         // the shared vanishing point
    shade.style.height = `${y0}px`;
    shade.style.background = 'linear-gradient(to bottom, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.08) 55%, rgba(0,0,0,0) 100%)';
    shade.style.opacity = root.scrollTop > 4 ? '1' : '0';
    // The arc: the transform and opacity for a piece whose middle sits at (ex, ey) on the flat page
    const arc = (ex: number, ey: number) => {
      const u = y0 - ey;
      const th = Math.min(u / Rc, Math.PI / 2);
      const dy = (y0 - Rc * Math.sin(th)) - ey;
      const z = -Rc * (1 - Math.cos(th));
      const ox = vx - ex, oy = vy - ey;
      return {
        tf: `translate(${ox.toFixed(1)}px, ${oy.toFixed(1)}px) perspective(${P}px) translate(${(-ox).toFixed(1)}px, ${(-oy).toFixed(1)}px) translateY(${dy.toFixed(1)}px) translateZ(${z.toFixed(1)}px) rotateX(${((th * 180) / Math.PI).toFixed(1)}deg)`,
        op: Math.max(0, Math.min(1, (1.57 - th) / 0.25)),
      };
    };
    const now = new Set<HTMLElement>();
    root.querySelectorAll<HTMLElement>(selector).forEach(el => {
      // Only the outermost match bends; whatever sits inside it is carried along
      if (el.parentElement?.closest(selector)) return;
      const r = el.getBoundingClientRect();
      if (r.height === 0) return;
      const ex = r.left + r.width / 2;
      if (r.height > 90) {
        // A tall piece (a card): bent in strips once any part of it is in the band
        if (r.top + r.height / SLICES / 2 >= y0) { dropLayer(el); return; }
        const l = layers.get(el) ?? buildLayer(el, r);
        const sh = r.height / SLICES;
        l.strips.forEach((strip, k) => {
          const ey = r.top + (k + 0.5) * sh;
          strip.style.left = `${r.left}px`; strip.style.top = `${r.top + k * sh}px`;
          if (ey >= y0) { strip.style.transform = ''; strip.style.opacity = '1'; return; }
          const a = arc(ex, ey);
          strip.style.transformOrigin = '50% 50%';
          strip.style.transform = a.tf; strip.style.opacity = String(a.op);
        });
        el.style.visibility = 'hidden';
        now.add(el);
        return;
      }
      const ey = r.top + r.height / 2;
      if (ey >= y0) return;
      const a = arc(ex, ey);
      el.style.transformOrigin = '50% 50%';
      el.style.transform = a.tf;
      el.style.opacity = String(a.op);
      now.add(el);
    });
    touched.forEach(el => { if (!now.has(el)) { clear(el); dropLayer(el); } });
    layers.forEach((_, el) => { if (!now.has(el)) dropLayer(el); });
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
    layers.forEach((_, el) => dropLayer(el));
    shade.remove();
  };
}
