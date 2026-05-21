import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';

const CIRCLE_R = 5;
const MAX_DIST = 480;

const NODES = [
  { id: 0, xf: 0.08, yf: 0.38, label: 'конструктор миссии',                    href: '#' },
  { id: 1, xf: 0.22, yf: 0.72, label: 'критерии сильной метафоры',             href: '#' },
  { id: 2, xf: 0.37, yf: 0.22, label: 'пайплайн разработки концепции',         href: '#' },
  { id: 3, xf: 0.51, yf: 0.68, label: 'конструктор медиа баннеров',            href: '#' },
  { id: 4, xf: 0.64, yf: 0.28, label: 'гайд по tov',                          href: '#' },
  { id: 5, xf: 0.79, yf: 0.74, label: 'сторителлинг для продуктового сайта',   href: '#' },
];

export default function MindMapBlock() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1440, h: 380 });
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  const cursorLineRefs = useRef<(SVGLineElement | null)[]>([]);
  const rafRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => {
      setSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    obs.observe(el);
    setSize({ w: el.offsetWidth, h: el.offsetHeight });
    return () => obs.disconnect();
  }, []);

  // Cursor → node lines
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        NODES.forEach((node, i) => {
          const nx = node.xf * size.w;
          const ny = node.yf * size.h;
          const dist = Math.hypot(mx - nx, my - ny);
          const op = Math.max(0, 1 - dist / MAX_DIST) * 0.45;
          const line = cursorLineRefs.current[i];
          if (!line) return;
          line.setAttribute('x1', String(mx));
          line.setAttribute('y1', String(my));
          line.setAttribute('x2', String(nx));
          line.setAttribute('y2', String(ny));
          line.style.strokeOpacity = String(op);
        });
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(rafRef.current);
      cursorLineRefs.current.forEach(l => { if (l) l.style.strokeOpacity = '0'; });
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [size]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: 380, overflow: 'hidden' }}
    >
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
      >
        {NODES.map((node, i) => (
          <line
            key={`cl-${node.id}`}
            ref={el => { cursorLineRefs.current[i] = el; }}
            x1={0} y1={0}
            x2={node.xf * size.w} y2={node.yf * size.h}
            stroke="rgb(35,31,32)"
            strokeOpacity={0}
            strokeWidth={1}
          />
        ))}
      </svg>

      {/* Main nodes + hover labels */}
      {NODES.map(node => {
        const nx = node.xf * size.w;
        const ny = node.yf * size.h;
        const active = hoveredNode === node.id;
        // Place label to the right, flip left if near right edge
        const labelLeft = node.xf > 0.75;
        return (
          <div key={node.id} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
            {/* Clickable node dot */}
            <div
              style={{
                position: 'absolute',
                left: nx - CIRCLE_R,
                top: ny - CIRCLE_R,
                width: CIRCLE_R * 2,
                height: CIRCLE_R * 2,
                borderRadius: '50%',
                background: active ? 'rgb(35,31,32)' : 'var(--c-bg)',
                border: '1px solid rgba(35,31,32,0.35)',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, background 0.2s ease',
                transform: active ? 'scale(1.6)' : 'scale(1)',
                zIndex: 2,
                pointerEvents: 'auto',
              }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            />
            {/* Label — always visible, highlighted on hover */}
            <a
              href={node.href}
              style={{
                position: 'absolute',
                left: labelLeft ? undefined : nx + CIRCLE_R + 10,
                right: labelLeft ? size.w - nx + CIRCLE_R + 10 : undefined,
                top: ny - 8,
                fontSize: 'var(--text-size)',
                lineHeight: 'var(--text-lh)',
                color: 'var(--c-text)',
                opacity: active ? 1 : 0.4,
                textDecoration: active ? 'underline' : 'none',
                textDecorationStyle: 'dotted',
                textUnderlineOffset: '3px',
                whiteSpace: 'nowrap',
                pointerEvents: 'auto',
                zIndex: 3,
                transition: 'opacity 0.2s',
              }}
            >
              {node.label}
            </a>
          </div>
        );
      })}
    </div>
  );
}
