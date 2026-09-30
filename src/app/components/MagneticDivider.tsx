import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

/** `inset` — where the line starts, as a CSS length from the row's left edge */
export function MagneticDivider({ color = 'var(--c-border)', active = false, dotted = false, flat = false, inset }: { color?: string; active?: boolean; dotted?: boolean; flat?: boolean; inset?: string }) {
  const svgRef  = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const hitRef  = useRef<SVGPathElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const p1      = useRef({ y: 0 });
  const live    = useRef(false);

  useEffect(() => {
    const svg  = svgRef.current!;
    const path = pathRef.current!;
    const hit  = hitRef.current!;
    const line = lineRef.current;
    const CY   = 0;   // line sits on the element's top edge

    // Put every line on the same device-pixel phase. Row heights are
    // fractional (16px × 1.2 line-height) and the site scales itself with
    // `zoom`, so otherwise each line lands on a different fraction of a pixel
    // and gets rasterised differently — neighbouring dividers then read as
    // different greys even though the stroke is identical.
    const snap = (rect: DOMRect) => {
      const dpr = window.devicePixelRatio || 1;
      // The svg is 40 CSS px tall by attribute; its measured height gives the
      // page's current scale, which local path coordinates go through.
      const scale = rect.height ? rect.height / 20 : 1;
      const screenY = rect.top + CY * scale;
      const aligned = Math.round(screenY * dpr) / dpr;
      return CY + (aligned - screenY) / scale;
    };

    // The bent stroke has to cover exactly the device pixels the resting 1px
    // border does, or the line visibly thins the moment the cursor picks it
    // up. A border is snapped down to whole device pixels (never below one)
    // and hangs below the row's top edge; a stroke is centred on its path and
    // keeps its fractional width. So: same whole-pixel thickness, and the
    // path lowered by half of it.
    let strokeW = 1;
    const getD = () => {
      const r = svg.getBoundingClientRect();
      const w = (r.width || 800);
      const dpr = window.devicePixelRatio || 1;
      const scale = r.height ? r.height / 20 : 1;
      strokeW = Math.max(1, Math.floor(scale * dpr + 1e-3)) / (scale * dpr);
      const lw = w / scale;
      const cy = snap(r) + strokeW / 2;
      return `M0,${cy} Q${lw / 2},${cy + p1.current.y} ${lw},${cy}`;
    };

    let lastD = '';
    const render = () => {
      const d = getD();
      // Written only when it changed — a fresh `d` every frame dirties the
      // layout, and the next divider's measurement then pays for it
      if (d !== lastD) {
        lastD = d;
        path.setAttribute('d', d);
        hit.setAttribute('d', d);
      }
      // At rest the line is drawn as a plain 1px block, not as an SVG stroke:
      // the page scales itself with `zoom`, and a scaled stroke lands on ~1.6
      // device pixels, which the rasteriser rounds differently line by line —
      // that is what made neighbouring dividers read as different greys. A
      // block element goes through one and the same rounding everywhere. The
      // stroke takes over only while the cursor bends the line.
      // Hand over to the SVG stroke only once the line is visibly bent. Both
      // layers cross-fade (see their CSS transition), so the divider never
      // blinks out while the elastic settles back to straight.
      const bent = Math.abs(p1.current.y) > 0.5;
      if (line) {
        line.style.opacity = bent ? '0' : '1';
        path.style.opacity = bent ? '1' : '0';
        if (bent) path.style.strokeWidth = `${strokeW}`;
        if (!bent) {
          // Only the position is snapped here — the thickness is a plain 1px
          // CSS border (see the element below), which the browser rounds the
          // same way for every divider on the page.
          const r = svg.getBoundingClientRect();
          const scale = r.height ? r.height / 20 : 1;   // page `zoom`
          const dpr = window.devicePixelRatio || 1;
          const offset = (Math.round(r.top * dpr) / dpr - r.top) / scale;
          line.style.transform = `translateY(${offset}px)`;
        }
      }

    };

    // flat mode — no cursor interaction, but the line still has to be
    // re-snapped as the page scrolls under it.
    if (flat) {
      render();
      let frame = 0;
      const onScroll = () => {
        if (frame) return;
        frame = requestAnimationFrame(() => { frame = 0; render(); });
      };
      window.addEventListener('scroll', onScroll, { passive: true, capture: true });
      window.addEventListener('resize', onScroll);
      return () => {
        if (frame) cancelAnimationFrame(frame);
        window.removeEventListener('scroll', onScroll, true);
        window.removeEventListener('resize', onScroll);
      };
    }

    // Per-frame work only while the line is actually moving (the cursor has
    // it, or the elastic is settling). At rest it is re-measured on scroll and
    // resize alone — dozens of dividers each measuring themselves every frame
    // made the whole page heavy to scroll.
    let ticking = false;
    const tickRender = () => {
      render();
      if (!live.current && Math.abs(p1.current.y) < 0.01 && !gsap.isTweening(p1.current)) {
        gsap.ticker.remove(tickRender);
        ticking = false;
      }
    };
    const wake = () => { if (!ticking) { ticking = true; gsap.ticker.add(tickRender); } };
    let restFrame = 0;
    const onRestScroll = () => {
      if (ticking || restFrame) return;
      restFrame = requestAnimationFrame(() => { restFrame = 0; render(); });
    };
    render();
    window.addEventListener('scroll', onRestScroll, { passive: true, capture: true });
    window.addEventListener('resize', onRestScroll);

    const onMove = (e: PointerEvent) => {
      wake();
      const rect = svg.getBoundingClientRect();
      const svgY = e.clientY - rect.top;

      if (!live.current && e.target === hit) {
        live.current = true;
        gsap.killTweensOf(p1.current);
      }

      if (live.current) {
        p1.current.y = Math.max(-6, Math.min(6, (svgY - CY) * 1.0));
      }
    };

    const onLeave = () => {
      live.current = false;
      gsap.to(p1.current, { y: 0, duration: 0.9, ease: 'elastic.out(1, 0.3)' });
      wake();
    };

    svg.addEventListener('pointermove', onMove as EventListener);
    svg.addEventListener('pointerleave', onLeave);

    return () => {
      gsap.ticker.remove(tickRender);
      if (restFrame) cancelAnimationFrame(restFrame);
      window.removeEventListener('scroll', onRestScroll, true);
      window.removeEventListener('resize', onRestScroll);
      svg.removeEventListener('pointermove', onMove as EventListener);
      svg.removeEventListener('pointerleave', onLeave);
    };
  }, [flat]);

  return (
    <>
    {/* Resting line — a plain 1px block (see render() for why) */}
    <div
      ref={lineRef}
      aria-hidden="true"
      style={{
        // Explicit: the phone table's «hide the empty spacer divs» rule
        // (App.module.css) would otherwise hide this line too
        display: 'block',
        position: 'absolute',
        top: 0,
        left: inset ?? 0,
        width: inset ? `calc(100% - ${inset})` : '100%',
        height: 0,
        // 1px CSS border, not a 1px box: with the page's `zoom` the browser
        // rounds border widths uniformly, so every divider ends up the same
        // thickness. A scaled box (or an SVG stroke) rounds per element and
        // the lines start to look uneven.
        borderTop: `1px solid ${active ? 'var(--c-text)' : color}`,
        // No opacity fade on the hand-over to the SVG stroke: mid cross-fade
        // both layers sit at half strength and the line flashes lighter
        transition: 'border-color 0.2s ease',
        pointerEvents: 'none',
      }}
    />
    <svg
      ref={svgRef}
      style={{
        // Sits on the row's own top edge and only covers the upper half of the
        // gap, so the rest of the row stays a plain click target for the row
        // itself — the next row's divider never steals clicks from this one.
        position: 'absolute',
        top: 0,
        left: inset ?? 0,
        width: inset ? `calc(100% - ${inset})` : '100%',
        height: 20,
        overflow: 'visible',
        pointerEvents: flat ? 'none' : 'all',
        zIndex: 1,
      }}
      aria-hidden="true"
    >
      <path
        ref={pathRef}
        d=""
        fill="none"
        strokeLinecap={dotted ? 'round' : undefined}
        strokeDasharray={dotted ? '0.1 4' : undefined}
        // Whole device pixels, like the resting border: an anti-aliased curve
        // spreads the same ink over more rows and the line reads thinner and
        // lighter the moment it bends
        shapeRendering={dotted ? undefined : 'crispEdges'}
        style={{ stroke: active ? 'var(--c-text)' : color, strokeWidth: '1', opacity: 0, transition: 'stroke 0.2s ease' }}
      />
      <path ref={hitRef}  d="" fill="none" stroke="transparent" strokeWidth={20} />
    </svg>
    </>
  );
}
