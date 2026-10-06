import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { SERVICES } from './ExpertiseSection2';
import { playKnock } from '../utils/knock';

// Services page: once the services table has almost scrolled away, the balls
// of its closed services (one per service whose ball isn't showing) tumble
// out of its bottom edge, scatter across the screen and settle at the bottom
// of the block below (children) — tied together by dashed links, as the
// letter balls are on the home page. Look: the service balls' own shading.
// Scrolled back up past the table, they're cleared, ready to fall again.

const TOTAL = SERVICES.reduce((n, s) => n + s.items.length, 0);

type Ball = { x: number; y: number; vx: number; vy: number; r: number; born: number; knockAt: number; on: boolean };

export default function TableBallRain({ table, children }: { table: RefObject<HTMLElement | null>; children: ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const w = wrap.current, cv = cvRef.current;
    if (!w || !cv || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = cv.getContext('2d')!;
    const root = (w.closest('[class*="_page_"]') as HTMLElement | null) ?? window;
    let W = 0, H = 0, TOP = 0, floor = 0, spawnY = 0, dpr = 1, R = 24;
    let balls: Ball[] = [];
    let links: [number, number, number][] = [];   // a, b, rest length
    let fallen = false, raf = 0, still = 0;

    // Canvas: from a little above the table's bottom edge down to the next block's top
    const layout = () => {
      const wr = w.getBoundingClientRect();
      const zk = wr.width / (w.offsetWidth || 1) || 1;          // CSS zoom
      const tb = table.current?.getBoundingClientRect();
      const next = w.nextElementSibling as HTMLElement | null;
      const floorY = ((next ? next.getBoundingClientRect().top : wr.bottom) - wr.top) / zk;
      const above = tb ? (wr.top - tb.bottom) / zk : 0;            // table bottom → this block's top
      TOP = Math.max(0, above) + 160;
      W = w.offsetWidth; H = TOP + floorY;
      floor = H; spawnY = TOP - Math.max(0, above);
      R = Math.max(15, Math.min(30, W * 0.018));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.style.top = `${-TOP}px`; cv.style.height = `${H}px`;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      balls.forEach(b => { b.x = Math.min(W - b.r, Math.max(b.r, b.x)); b.y = Math.min(floor - b.r, b.y); });
      draw(performance.now());
    };

    const spawn = () => {
      const open = table.current?.querySelectorAll('.svcBall:not(.svcBallLeaving)').length ?? 0;
      const n = Math.max(0, TOTAL - open);
      const now = performance.now();
      const tw = table.current ? table.current.offsetWidth : W;
      const x0 = (W - tw) / 2;
      balls = Array.from({ length: n }, (_, i) => ({
        x: x0 + tw * (0.08 + Math.random() * 0.84), y: spawnY - R,
        vx: (Math.random() - 0.5) * 16, vy: -(2 + Math.random() * 6),
        r: R * (0.8 + Math.random() * 0.35), born: now + i * 45, knockAt: 0, on: false,
      }));
      // Links: each ball to one of the few before it (a loose chain) and now and then a second
      links = [];
      for (let i = 1; i < n; i++) {
        const j = Math.max(0, i - 1 - Math.floor(Math.random() * 3));
        links.push([i, j, R * (3 + Math.random() * 2.5)]);
        if (i > 3 && Math.random() < 0.35) links.push([i, Math.floor(Math.random() * (i - 1)), R * (4 + Math.random() * 3)]);
      }
      fallen = true; still = 0; start();
    };
    const clear = () => { balls = []; links = []; fallen = false; draw(performance.now()); };

    const step = (now: number) => {
      const live = balls.filter(b => (b.on ||= now >= b.born));
      for (const b of live) {
        b.vy += 0.42;
        b.x += b.vx; b.y += b.vy;
        if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.6; }
        if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.6; }
        if (b.y > floor - b.r) {
          b.y = floor - b.r;
          if (b.vy > 2.2 && now - b.knockAt > 120) { playKnock(Math.min(1, b.vy / 14)); b.knockAt = now; }
          b.vy = Math.abs(b.vy) < 1 ? 0 : -b.vy * 0.42;
          b.vx *= 0.9;
        }
        if (b.y >= floor - b.r - 0.5) b.vx *= 0.97;
      }
      // Dashed links pull a little when stretched, like the home page's
      for (const [i, j, rest] of links) {
        const a = balls[i], b = balls[j];
        if (!a.on || !b.on) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
        if (d <= rest) continue;
        const f = (d - rest) * 0.0025, fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      }
      // Ball against ball
      for (let i = 0; i < live.length; i++) for (let k = i + 1; k < live.length; k++) {
        const a = live[i], b = live[k];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = a.r + b.r;
        if (d >= m || d === 0) continue;
        const nx = dx / d, ny = dy / d, push = (m - d) / 2;
        a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
        const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (rv < 0) { const j = -rv * 0.75; a.vx -= nx * j; a.vy -= ny * j; b.vx += nx * j; b.vy += ny * j; }
      }
      const moving = live.length < balls.length || live.some(b => Math.abs(b.vx) > 0.05 || Math.abs(b.vy) > 0.05);
      still = moving ? 0 : still + 1;
    };

    const draw = (now: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // Links first, under the balls: short round dashes, faded in once both ends are out
      ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.setLineDash([0.1, 11]);
      for (const [i, j] of links) {
        const a = balls[i], b = balls[j];
        if (!a.on || !b.on) continue;
        const t = Math.min(1, (now - Math.max(a.born, b.born) - 250) / 500);
        if (t <= 0) continue;
        ctx.strokeStyle = `rgba(0,0,0,${0.28 * t})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.setLineDash([]);
      for (const b of balls) {
        if (!b.on) continue;
        const { x, y, r } = b;
        // a soft contact shadow, stronger the nearer the floor
        const hgt = floor - (y + r), sa = Math.max(0, 1 - hgt / (r * 4)) * 0.09;
        if (sa > 0.002) {
          const sg = ctx.createRadialGradient(x, floor, 0, x, floor, r * 1.1);
          sg.addColorStop(0, `rgba(0,0,0,${sa})`); sg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.save(); ctx.translate(x, floor); ctx.scale(1, 0.22); ctx.translate(-x, -floor);
          ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(x, floor, r * 1.1, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
        // the service ball: bright soft base, glint up-left, faint rim shade down-right
        const base = ctx.createRadialGradient(x - r * 0.15, y - r * 0.2, 0, x - r * 0.15, y - r * 0.2, r * 1.3);
        base.addColorStop(0, '#fdfdfd'); base.addColorStop(0.6, '#f4f4f4'); base.addColorStop(1, '#e9e9e9');
        ctx.fillStyle = base; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        const spec = ctx.createRadialGradient(x - r * 0.4, y - r * 0.48, 0, x - r * 0.4, y - r * 0.48, r * 0.7);
        spec.addColorStop(0, 'rgba(255,255,255,0.85)'); spec.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = spec; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        const rim = ctx.createRadialGradient(x + r * 0.45, y + r * 0.5, 0, x + r * 0.45, y + r * 0.5, r * 0.95);
        rim.addColorStop(0, 'rgba(0,0,0,0.10)'); rim.addColorStop(0.75, 'rgba(0,0,0,0.02)'); rim.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
    };

    const tick = (now: number) => {
      step(now); draw(now);
      raf = still > 90 ? 0 : requestAnimationFrame(tick);   // everything at rest: stop until needed
    };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };

    // Almost past the table → they fall; back above it → cleared
    const onScroll = () => {
      const tb = table.current?.getBoundingClientRect();
      if (!tb) return;
      const vh = window.innerHeight;
      if (!fallen && tb.bottom < vh * 0.45 && tb.bottom > -vh * 0.5) { layout(); spawn(); }
      else if (fallen && tb.bottom > vh) clear();
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver(layout);
    ro.observe(w);
    window.addEventListener('resize', layout);
    layout(); onScroll();
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', layout);
      ro.disconnect();
    };
  }, [table]);

  return (
    <div ref={wrap} style={{ position: 'relative' }}>
      {children}
      <canvas ref={cvRef} aria-hidden="true" style={{ position: 'absolute', left: 0, width: '100%', pointerEvents: 'none', zIndex: 1 }} />
    </div>
  );
}
