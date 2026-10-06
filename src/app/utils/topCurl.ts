/**
 * The page rolling over the top edge of the screen and going up out of sight.
 * Everything that climbs into the top band is laid along one cylinder — position,
 * depth and tilt all follow the same arc, with one shared vanishing point — so the
 * content reads as a single surface turning over a roll. Small pieces (rows, text)
 * each turn about their own middle; tall ones (cards) are cut into thin strips, each
 * strip following the arc at its own height, so a card bends continuously like a sheet.
 * Driven by the scroll of `root`; elements are re-read on every frame. Returns a cleanup.
 */
const STRIP = 8;   // px height of one strip of a tall piece

export function attachTopCurl(root: HTMLElement, selector: string, opts: { zone?: number; shade?: boolean } = {}) {
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

  // Strips of the tall pieces: one fixed layer per piece, built while it is bending.
  // Only the part already in the band is cut into thin strips (made when first needed);
  // everything below it is one flat piece, so a tall card costs a few clones, not hundreds.
  type Layer = { box: HTMLDivElement; strips: (HTMLDivElement | null)[]; rest: HTMLDivElement; restClone: HTMLElement; sh: number; n: number };
  const layers = new Map<HTMLElement, Layer>();
  const dropLayer = (el: HTMLElement) => {
    const l = layers.get(el); if (!l) return;
    l.box.remove(); layers.delete(el); el.style.visibility = '';
  };
  const cloneOf = (el: HTMLElement, r: DOMRect, top: number) => {
    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.cssText += `;position:absolute;left:0;top:${top}px;width:${r.width}px;height:${r.height}px;margin:0;transform:none;opacity:1;visibility:visible`;
    return clone;
  };
  // A fresh copy would replay the card's running animations (the balls dropping in) from the
  // start: once it is in the page, hold them where the original's are
  const syncAnims = (el: HTMLElement, clone: HTMLElement) => {
    const src = [el, ...el.querySelectorAll('*')], dst = [clone, ...clone.querySelectorAll('*')];
    src.forEach((o, i) => {
      const oa = o.getAnimations(), ca = dst[i]?.getAnimations() ?? [];
      oa.forEach((a, j) => { if (ca[j] && a.currentTime != null) ca[j].currentTime = a.currentTime; });
    });
  };
  const buildLayer = (el: HTMLElement, r: DOMRect) => {
    const box = document.createElement('div');
    box.setAttribute('aria-hidden', 'true');
    box.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;z-index:5';
    const sh = STRIP, n = Math.ceil(r.height / sh);
    const rest = document.createElement('div');
    // Cut only along its top edge, so whatever hangs out of the card below or to the sides stays
    rest.style.cssText = `position:absolute;clip-path:inset(0 -100vw -100vh -100vw);left:${r.left}px;width:${r.width}px;pointer-events:none`;
    const restClone = cloneOf(el, r, 0);
    rest.appendChild(restClone); box.appendChild(rest);
    // Beside the original, so the stylesheet's descendant rules still reach the clones
    (el.parentElement ?? document.body).appendChild(box);
    syncAnims(el, restClone);
    const l: Layer = { box, strips: new Array(n).fill(null), rest, restClone, sh, n }; layers.set(el, l); return l;
  };
  const strip = (el: HTMLElement, l: Layer, r: DOMRect, k: number) => {
    let st = l.strips[k];
    if (!st) {
      st = document.createElement('div');
      st.style.cssText = `position:absolute;overflow:hidden;left:${r.left}px;width:${r.width}px;height:${l.sh + 1}px;pointer-events:none;will-change:transform`;
      const c = cloneOf(el, r, -k * l.sh);
      st.appendChild(c);
      l.box.appendChild(st); l.strips[k] = st;
      syncAnims(el, c);
    }
    return st;
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
    shade.style.opacity = opts.shade !== false && root.scrollTop > 4 ? '1' : '0';
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
        // A tall piece (a card): bent in strips once its top reaches the band
        if (r.top + STRIP / 2 >= y0) { dropLayer(el); return; }
        const l = layers.get(el) ?? buildLayer(el, r);
        // k0: the first strip still flat (below the band); it and all after it are the one flat piece
        const k0 = Math.min(l.n, Math.max(0, Math.ceil((y0 - r.top) / l.sh - 0.5)));
        for (let k = 0; k < l.n; k++) {
          const st = l.strips[k];
          if (k >= k0) { if (st) st.style.display = 'none'; continue; }
          const sp = strip(el, l, r, k);
          sp.style.display = ''; sp.style.left = `${r.left}px`; sp.style.top = `${r.top + k * l.sh}px`;
          const ey = r.top + (k + 0.5) * l.sh;
          const a = arc(ex, ey);
          sp.style.transformOrigin = '50% 50%';
          sp.style.transform = a.tf; sp.style.opacity = String(a.op);
        }
        l.rest.style.display = k0 >= l.n ? 'none' : '';
        l.rest.style.left = `${r.left}px`; l.rest.style.top = `${r.top + k0 * l.sh}px`;
        l.rest.style.height = `${r.height - k0 * l.sh}px`;
        l.restClone.style.top = `${-k0 * l.sh}px`;
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
