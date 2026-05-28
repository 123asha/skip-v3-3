import { useEffect, useRef, useState } from 'react';

/**
 * SectionSeam — a thin horizontal SVG curve that lives at the seam between
 * two stacked sections. As the page scrolls past the seam's natural position
 * it grows more oval (curvature ramps from 0 to ~24 px). Desktop only —
 * skipped on coarse-pointer / narrow viewports.
 *
 * Mount inside the page flow at the exact spot you want the seam to appear.
 * No layout impact: 1 px tall, full-bleed, overflow visible.
 */
export default function SectionSeam({ amplitude = 24 }: { amplitude?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [width, setWidth] = useState(0);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px), (pointer: coarse)');
    const apply = () => setEnabled(!mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const ro = new ResizeObserver(es => {
      for (const e of es) setWidth(e.contentRect.width);
    });
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !width) return;
    const el = wrapRef.current;
    const path = pathRef.current;
    if (!el || !path) return;

    let raf = 0;
    const render = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when seam is at viewport bottom; 1 when seam has passed the top.
      // Past the top → distance grows beyond 1 — clamp.
      const t = Math.max(0, Math.min(1, (vh - rect.top) / vh));
      // Ease so the bow grows fastest as the seam crosses centre.
      const eased = t * t * (3 - 2 * t);
      const amp = amplitude * eased;
      // Quadratic curve: bows downward (positive amp = pull centre down).
      path.setAttribute(
        'd',
        `M0 ${amp} Q${width / 2} ${-amp} ${width} ${amp}`,
      );
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(render); };
    render();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled, width, amplitude]);

  if (!enabled) return null;

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{
        position: 'relative',
        width: '100%',
        height: 1,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      <svg
        width="100%"
        height={amplitude * 2 + 4}
        viewBox={`0 ${-amplitude - 2} ${width || 1000} ${amplitude * 2 + 4}`}
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          left: 0,
          top: -(amplitude + 2),
          display: 'block',
        }}
      >
        <path
          ref={pathRef}
          d={`M0 0 L${width || 1000} 0`}
          fill="none"
          stroke="var(--c-border, rgba(35,31,32,0.12))"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
