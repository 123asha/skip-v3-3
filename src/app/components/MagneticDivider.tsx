import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

export function MagneticDivider({ color = 'var(--c-border)', active = false, dotted = false, flat = false }: { color?: string; active?: boolean; dotted?: boolean; flat?: boolean }) {
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

    const getD = () => {
      const r = svg.getBoundingClientRect();
      const w = r.width || 800;
      const cy = snap(r);
      return `M0,${cy} Q${w / 2},${cy + p1.current.y} ${w},${cy}`;
    };

    const render = () => {
      const d = getD();
      path.setAttribute('d', d);
      hit.setAttribute('d', d);
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
        if (bent) {
          // Match the stroke to the resting border, or the line visibly thins
          // out the moment the cursor picks it up.
          const bw = getComputedStyle(line).borderTopWidth;
          if (bw) path.style.strokeWidth = bw;
        }
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

    gsap.ticker.add(render);

    const onMove = (e: PointerEvent) => {
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
    };

    svg.addEventListener('pointermove', onMove as EventListener);
    svg.addEventListener('pointerleave', onLeave);

    return () => {
      gsap.ticker.remove(render);
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
        left: 0,
        width: '100%',
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
        left: 0,
        width: '100%',
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
        style={{ stroke: active ? 'var(--c-text)' : color, strokeWidth: '1', opacity: 0, transition: 'stroke 0.2s ease' }}
      />
      <path ref={hitRef}  d="" fill="none" stroke="transparent" strokeWidth={20} />
    </svg>
    </>
  );
}
