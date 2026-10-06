/**
 * The page rolling over the top edge of the screen and going up out of sight.
 * Everything that climbs into the top band is laid along one cylinder — position,
 * depth and tilt all follow the same arc, with one shared vanishing point — so the
 * content reads as a single surface turning over a roll.
 *
 * Small pieces (rows, text) each turn about their own middle. Tall ones (cards) bend
 * continuously: the band is covered by a fixed set of thin slots, each tilted for its
 * height on the roll and holding a copy of the card that only slides as the page
 * scrolls; the card itself stays in place, clipped at the band. Copies are made ahead,
 * while the card is still below the band, so scrolling only moves transforms. All rects
 * are read first, then styles written, once a frame. Driven by the scroll of `root`.
 * Returns a cleanup.
 */
const SLOT = 10;   // px height of one slot of the band

type Layer = { box: HTMLDivElement; slots: HTMLDivElement[]; copies: HTMLElement[]; w: number; h: number; at: number; stale: boolean; mo: MutationObserver;
  moving: { o: HTMLElement; c: HTMLElement[] }[] };

export function attachTopCurl(root: HTMLElement, selector: string, opts: { zone?: number; shade?: boolean } = {}) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const zone = opts.zone ?? 0.13;
  // The curved part of the sheet is shaded: darker towards the turning edge
  const shade = document.createElement('div');
  shade.setAttribute('aria-hidden', 'true');
  shade.style.cssText = 'position:fixed;left:0;right:0;top:0;pointer-events:none;z-index:162;opacity:0;transition:opacity 0.2s;background:linear-gradient(to bottom, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.08) 55%, rgba(0,0,0,0) 100%)';
  if (opts.shade !== false) document.body.appendChild(shade);
  let raf = 0, later = 0;

  // Small pieces: their flat place on the page (in scroll coordinates), measured while
  // they are untransformed, so a frame never reads back its own tilt
  const flat = new WeakMap<HTMLElement, { top: number; left: number; w: number; h: number }>();
  const touched = new Set<HTMLElement>();
  const clear = (el: HTMLElement) => { el.style.transform = ''; el.style.opacity = ''; el.style.transformOrigin = ''; };

  // ── the copies of the tall pieces ──
  const layers = new Map<HTMLElement, Layer>();
  const dropLayer = (el: HTMLElement) => {
    const l = layers.get(el); if (!l) return;
    l.mo.disconnect(); l.box.remove(); layers.delete(el); el.style.clipPath = '';
  };
  // A copy of the card as it looks now: videos become a still of their current frame
  const copyOf = (el: HTMLElement, w: number, h: number) => {
    const c = el.cloneNode(true) as HTMLElement;
    c.removeAttribute('id');
    c.style.cssText += `;position:absolute;left:0;top:0;width:${w}px;height:${h}px;margin:0;transform:none;opacity:1;visibility:visible;clip-path:none`;
    // Images ready at once: a lazy copy would flash white while it decodes
    c.querySelectorAll('img').forEach(i => { i.loading = 'eager'; i.decoding = 'sync'; });
    const ov = el.querySelectorAll('video');
    c.querySelectorAll('video').forEach((v, i) => {
      const o = ov[i];
      const cnv = document.createElement('canvas');
      cnv.className = v.className; cnv.style.cssText = v.style.cssText;
      try { cnv.width = o.videoWidth || 2; cnv.height = o.videoHeight || 2; cnv.getContext('2d')?.drawImage(o, 0, 0); } catch { /* not ready: stays blank */ }
      v.replaceWith(cnv);
    });
    return c;
  };
  // A fresh copy would replay the card's running animations from the start: hold them where the original's are
  const syncAnims = (el: HTMLElement, c: HTMLElement) => {
    const src = [el, ...el.querySelectorAll('*')], dst = [c, ...c.querySelectorAll('*')];
    src.forEach((o, i) => {
      const oa = o.getAnimations(); if (!oa.length) return;
      const ca = dst[i]?.getAnimations() ?? [];
      oa.forEach((a, j) => { if (ca[j] && a.currentTime != null) ca[j].currentTime = a.currentTime; });
    });
  };
  const buildLayer = (el: HTMLElement, w: number, h: number, n: number) => {
    const box = document.createElement('div');
    box.setAttribute('aria-hidden', 'true');
    box.setAttribute('data-curl-layer', '');
    box.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;z-index:5';
    const slots: HTMLDivElement[] = [], copies: HTMLElement[] = [];
    for (let j = 0; j < n; j++) {
      const s = document.createElement('div');
      s.style.cssText = `position:absolute;left:0;top:0;overflow:hidden;width:${w}px;height:${SLOT + 2}px;pointer-events:none;display:none;transform-origin:50% ${SLOT / 2}px`;
      const c = copyOf(el, w, h);
      s.appendChild(c); box.appendChild(s);
      slots.push(s); copies.push(c);
    }
    // Inside the page, so the stylesheet's descendant rules still reach the copies,
    // but out of the card's own list, so the page's scripts don't take them for cards
    root.appendChild(box);
    copies.forEach(c => syncAnims(el, c));
    // When the card changes (a ball drops in, a slide turns) its copies are made again, a little later
    const mo = new MutationObserver(recs => {
      // Inline styles (our clip, the image parallax, the rise) are followed frame by frame instead
      if (recs.every(m => m.attributeName === 'style')) return;
      l.stale = true; onScroll();
    });
    mo.observe(el, { attributes: true, childList: true, subtree: true, characterData: true });
    // The pieces inside the card moved by inline style (parallax): their copies follow them every frame
    const all = [...el.querySelectorAll<HTMLElement>('*')];
    const allC = copies.map(c => [...c.querySelectorAll<HTMLElement>('*')]);
    const moving = all.flatMap((o, i) => (o.style.translate || o.style.transform) ? [{ o, c: allC.map(a => a[i]).filter(Boolean) }] : []);
    const l: Layer = { box, slots, copies, w, h, at: performance.now(), stale: false, mo, moving };
    layers.set(el, l);
    return l;
  };
  // (display, not visibility: the copy inside is explicitly visible and would show through)
  const hide = (s: HTMLElement) => { if (s.style.display !== 'none') s.style.display = 'none'; };

  const apply = () => {
    raf = 0;
    const vh = window.innerHeight, vw = window.innerWidth;
    const y0 = vh * zone;               // where the page starts to bend
    const Rc = y0;                      // the roll: its top is the top edge of the screen
    const P = 900;                      // the one perspective for everything
    const vx = vw / 2, vy = y0;         // the shared vanishing point
    const n = Math.ceil(y0 / SLOT);
    const st = root.scrollTop;
    shade.style.height = `${y0}px`;
    shade.style.opacity = st > 4 ? '1' : '0';
    const arc = (ex: number, ey: number) => {
      const th = Math.min((y0 - ey) / Rc, Math.PI / 2);
      const dy = (y0 - Rc * Math.sin(th)) - ey;
      const z = -Rc * (1 - Math.cos(th));
      const ox = vx - ex, oy = vy - ey;
      return {
        tf: `translate(${ox.toFixed(1)}px, ${oy.toFixed(1)}px) perspective(${P}px) translate(${(-ox).toFixed(1)}px, ${(-oy).toFixed(1)}px) translateY(${dy.toFixed(1)}px) translateZ(${z.toFixed(1)}px) rotateX(${((th * 180) / Math.PI).toFixed(2)}deg)`,
        op: Math.max(0, Math.min(1, (1.57 - th) / 0.25)),
      };
    };

    // 1 — read every rect
    const items: { el: HTMLElement; top: number; left: number; w: number; h: number }[] = [];
    root.querySelectorAll<HTMLElement>(selector).forEach(el => {
      if (el.closest('[data-curl-layer]')) return;      // our own copies
      if (el.parentElement?.closest(selector)) return;   // only the outermost match bends
      const f = touched.has(el) ? flat.get(el) : undefined;
      if (f) { items.push({ el, top: f.top - st, left: f.left, w: f.w, h: f.h }); return; }
      const r = el.getBoundingClientRect();
      if (r.height === 0 || r.bottom < -vh || r.top > vh * 2) return;
      flat.set(el, { top: r.top + st, left: r.left, w: r.width, h: r.height });
      items.push({ el, top: r.top, left: r.left, w: r.width, h: r.height });
    });

    // 2 — write
    const now = new Set<HTMLElement>();
    const seen = new Set<HTMLElement>();
    let built = 0;
    for (const { el, top, left, w, h } of items) {
      const bottom = top + h, ex = left + w / 2;
      if (h > 90) {
        seen.add(el);
        const W = Math.round(w), H = Math.round(h);
        let l = layers.get(el);
        if (l && (l.w !== W || l.h !== H || l.slots.length !== n)) { dropLayer(el); l = undefined; }
        if (l?.stale && !built) {
          if (performance.now() - l.at > 250) { dropLayer(el); l = undefined; }
          else if (!later) later = window.setTimeout(() => { later = 0; onScroll(); }, 260);
        }
        // Copies are made ahead, while the card is still below the band — one card a frame
        if (!l && top < y0 + vh * 0.6 && bottom > 0 && !built) { l = buildLayer(el, W, H, n); built++; }
        if (!l) continue;
        if (top >= y0 || bottom <= 0) {
          if (el.style.clipPath) el.style.clipPath = '';
          l.slots.forEach(hide);
          continue;
        }
        // The card itself shows only below the band; the slots carry what is in it
        l.moving.forEach(({ o, c }) => c.forEach(x => { x.style.translate = o.style.translate; x.style.transform = o.style.transform; }));
        el.style.clipPath = `inset(${(y0 - top).toFixed(1)}px -100vw -100vh -100vw)`;
        for (let j = 0; j < n; j++) {
          const sTop = y0 - (j + 1) * SLOT;   // slot j: the flat strip [sTop, sTop + SLOT] of the screen
          const s = l.slots[j];
          if (sTop + SLOT <= top || sTop >= bottom) { hide(s); continue; }
          const a = arc(ex, sTop + SLOT / 2);
          s.style.display = '';
          // Edge-on near the top a slot shrinks to a sliver: it reaches further down (under the
          // slot before it), so no seam opens between neighbours
          const th = Math.min((SLOT * (j + 0.5)) / Rc, Math.PI / 2);
          s.style.height = `${(SLOT + 2 + Math.min(60, SLOT * (1 / Math.max(Math.cos(th), 0.12) - 1))).toFixed(1)}px`;
          s.style.transform = `translate(${left.toFixed(1)}px, ${sTop.toFixed(1)}px) ${a.tf}`;
          s.style.opacity = String(a.op);
          l.copies[j].style.transform = `translateY(${(top - sTop).toFixed(1)}px)`;
        }
        continue;
      }
      const ey = top + h / 2;
      if (ey >= y0) continue;
      const a = arc(ex, ey);
      el.style.transformOrigin = '50% 50%';
      el.style.transform = a.tf;
      el.style.opacity = String(a.op);
      now.add(el);
    }
    touched.forEach(el => { if (!now.has(el)) clear(el); });
    touched.clear(); now.forEach(el => touched.add(el));
    // Copies of cards that went far away are let go
    layers.forEach((_, el) => { if (!seen.has(el)) dropLayer(el); });
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(apply); };
  const onResize = () => { touched.forEach(clear); touched.clear(); onScroll(); };
  root.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  apply();
  return () => {
    root.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    cancelAnimationFrame(raf); clearTimeout(later);
    touched.forEach(clear);
    layers.forEach((_, el) => dropLayer(el));
    shade.remove();
  };
}
