import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

export function MagneticDivider({ color = 'var(--c-border)', active = false, dotted = false }: { color?: string; active?: boolean; dotted?: boolean }) {
  const svgRef  = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const hitRef  = useRef<SVGPathElement>(null);
  const p1      = useRef({ y: 0 });
  const live    = useRef(false);

  useEffect(() => {
    const svg  = svgRef.current!;
    const path = pathRef.current!;
    const hit  = hitRef.current!;
    const CY   = 20;

    const getD = () => {
      const w = svg.getBoundingClientRect().width || 800;
      return `M0,${CY} Q${w / 2},${CY + p1.current.y} ${w},${CY}`;
    };

    const render = () => {
      const d = getD();
      path.setAttribute('d', d);
      hit.setAttribute('d', d);
    };

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
  }, []);

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'absolute',
        top: -20,
        left: 0,
        width: '100%',
        height: 40,
        overflow: 'visible',
        pointerEvents: 'all',
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
        style={{ stroke: active ? 'var(--c-text)' : color, strokeWidth: '1', transition: 'stroke 0.2s ease' }}
      />
      <path ref={hitRef}  d="" fill="none" stroke="transparent" strokeWidth={40} />
    </svg>
  );
}
