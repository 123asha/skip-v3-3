import { useEffect, useRef, type CSSProperties, type RefObject } from 'react';
import { gsap } from 'gsap';

// FlowText — text laid out by hand, word by word, so it can run around balls
// standing inside it. Every word is measured once; each frame the lines are
// rebuilt around the balls where they are now, so as a ball drops through the
// text the lines part around it and close up behind.
//
// The balls make one stack: as the page scrolls they fall in one after
// another, each landing on the one below and rocking until it finds its
// balance. Scrolling back, they lift away again, the top one first.

export type FlowStack = {
  // Desktop: the stack's centre across the text (0 — its left edge, 0.5 — the
  // gutter between the columns, 1 — the right edge), the floor the lowest ball
  // rests on (a share of the text's height), the radii from the bottom up (as
  // shares of one column's width), and how far each ball leans off the one
  // below at rest (radians)
  x: number; floor: number; radii: number[]; lean: number[];
  // Phone (one column): the same, the radii as shares of the column
  xM: number; floorM: number; radiiM: number[];
};

export type FlowPara = { text: string; label?: string };

type Ob = { cx: number; cy: number; r: number };
type Col = { x0: number; x1: number };
type Pos = { x: number; y: number };

// The stretch of [y0, y1] a ball takes across, padding included
function blocked(o: Ob, y0: number, y1: number): [number, number] | null {
  const dy = o.cy >= y0 && o.cy <= y1 ? 0 : Math.min(Math.abs(y0 - o.cy), Math.abs(y1 - o.cy));
  if (dy >= o.r) return null;
  const half = Math.sqrt(o.r * o.r - dy * dy);
  return [o.cx - half, o.cx + half];
}

// The free stretches of one line of a column, narrow leftovers dropped
function freeSegs(col: Col, y0: number, y1: number, obs: Ob[], minW: number): [number, number][] {
  const cuts = obs.map(o => blocked(o, y0, y1)).filter(Boolean) as [number, number][];
  cuts.sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  let x = col.x0;
  for (const [a, b] of cuts) {
    if (b <= x) continue;
    if (a >= col.x1) break;
    if (a > x) out.push([x, Math.min(a, col.x1)]);
    x = Math.max(x, b);
  }
  if (x < col.x1) out.push([x, col.x1]);
  return out.filter(([a, b]) => b - a >= minW);
}

type Metrics = { widths: number[]; paraStart: boolean[]; space: number; lh: number; fs: number; indent: number };

// Lays the words into the columns. Every column but the last holds at most
// `rows` lines; the last one runs on as long as it needs. Returns each word's
// place and the lines the last column used
function layout(m: Metrics, cols: Col[], rows: number, obs: Ob[]): { pos: Pos[]; lastRows: number } {
  const { widths, paraStart, space, lh, fs, indent } = m;
  const n = widths.length;
  const pos: Pos[] = new Array(n);
  const minW = fs * 1.6;
  let i = 0, c = 0, row = 0, guard = 0;
  while (i < n && guard++ < 5000) {
    if (c < cols.length - 1 && row >= rows) { c++; row = 0; }
    const col = cols[c];
    const y = row * lh;
    const segs = freeSegs(col, y, y + lh, obs, minW);
    let placedOnLine = 0;
    segLoop: for (const [s0, s1] of segs) {
      let x = s0;
      const start = i;
      while (i < n) {
        if (paraStart[i] && placedOnLine === 0) x = Math.max(x, col.x0 + indent);
        const w = widths[i];
        if (x + w > s1 + 0.5) break;
        pos[i] = { x, y };
        x += w + space;
        i++; placedOnLine++;
        // A paragraph ends the line
        if (i < n && paraStart[i]) break segLoop;
      }
      // A run held in by a ball on its right is set justified, so the ball
      // gets a clean edge on both sides
      const count = i - start;
      if (count > 1 && s1 < col.x1 - 1 && i < n) {
        const end = pos[i - 1].x + widths[i - 1];
        const extra = (s1 - end) / (count - 1);
        if (extra > 0 && extra < fs * 0.3) for (let k = 1; k < count; k++) pos[start + k].x += extra * k;
      }
    }
    // A word wider than the whole column goes in anyway, so nothing stalls
    if (placedOnLine === 0 && i < n && widths[i] > col.x1 - col.x0 - indent) {
      pos[i] = { x: col.x0, y }; i++;
    }
    row++;
  }
  // Anything left over (never expected) parks at the end of the last column
  for (; i < n; i++) pos[i] = { x: cols[cols.length - 1].x0, y: row * lh };
  return { pos, lastRows: c === cols.length - 1 ? row : 0 };
}

// Ball physics, in px and seconds
const G = 4200;          // gravity
const BOUNCE = 0.32;     // share of speed kept on a bounce
const K = 70, DAMP = 3.2; // the rocking: spring and damping
const RISE = 2600;       // how fast a ball lifts away

type Ball = {
  r: number;
  state: 'out' | 'falling' | 'resting' | 'leaving';
  x: number; y: number; vy: number;
  ang: number; angV: number;   // lean off the ball below (the lowest: roll)
  rest: number;                // time since it came to rest
};

export default function FlowText({
  paras, stack, scrollRef, columns, style,
}: {
  paras: FlowPara[];
  stack: FlowStack;
  scrollRef: RefObject<HTMLElement | null>;
  columns: number;               // 2 on desktop, 1 on a phone
  style?: CSSProperties;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const indentRef = useRef<HTMLSpanElement>(null);
  const spaceRef = useRef<HTMLSpanElement>(null);
  const ballRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shadowRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const words: { w: string; para: number; start: boolean }[] = [];
  paras.forEach((p, pi) => p.text.split(' ').filter(Boolean).forEach((w, k) => words.push({ w, para: pi, start: k === 0 })));
  const count = stack.radii.length;

  useEffect(() => {
    const box = boxRef.current!, page = scrollRef.current!;
    const wordEls = Array.from(box.querySelectorAll<HTMLElement>('[data-w]'));

    let m: Metrics | null = null;
    let cols: Col[] = [];
    let rows = 0;
    let X = 0, floor = 0;
    const balls: Ball[] = Array.from({ length: count }, () => ({ r: 0, state: 'out', x: 0, y: 0, vy: 0, ang: 0, angV: 0, rest: 0 }));
    const want = balls.map(() => false);
    const lean = (k: number) => (k === 0 ? 0 : stack.lean[k] ?? 0);
    const shown = wordEls.map(() => false);
    let pos: Pos[] = [];
    let raf = 0, last = 0;

    // Where ball k sits on the one below (or on the floor) at a given lean
    const seat = (k: number, ang: number) => {
      if (k === 0) return { x: X + ang * balls[0].r, y: floor - balls[0].r };
      const b = balls[k - 1], d = b.r + balls[k].r;
      return { x: b.x + Math.sin(ang) * d, y: b.y - Math.cos(ang) * d };
    };
    const pad = () => m!.fs * 0.4;
    const obstacles = (all: boolean): Ob[] => {
      if (all) {
        // The whole stack at rest — used to size the columns
        const saved = balls.map(b => ({ x: b.x, y: b.y }));
        const out = balls.map((b, k) => { const s = seat(k, lean(k)); b.x = s.x; b.y = s.y; return { cx: s.x, cy: s.y, r: b.r + pad() }; });
        balls.forEach((b, k) => { b.x = saved[k].x; b.y = saved[k].y; });
        return out;
      }
      return balls.filter(b => b.state !== 'out').map(b => ({ cx: b.x, cy: b.y, r: b.r + pad() }));
    };

    const measure = () => {
      const cs = getComputedStyle(box);
      const fs = parseFloat(cs.fontSize);
      const lh = parseFloat(cs.lineHeight) || fs * 0.8755;
      const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gap')) || 20;
      const W = box.clientWidth;
      const gutter = gap * 2;
      const cw = columns === 1 ? W : (W - gutter * (columns - 1)) / columns;
      cols = Array.from({ length: columns }, (_, k) => ({ x0: k * (cw + gutter), x1: k * (cw + gutter) + cw }));
      m = {
        widths: wordEls.map(el => el.offsetWidth),
        paraStart: words.map(w => w.start),
        space: spaceRef.current!.offsetWidth,
        lh, fs,
        indent: indentRef.current!.offsetWidth,
      };
      // The columns' height: as short as the text allows — first with no
      // balls, to know where the floor goes, then again with the stack in
      const fits = (r: number, obs: Ob[]) => layout(m!, cols, r, obs).lastRows <= r;
      const shortest = (obs: Ob[]) => {
        let lo = 1, hi = words.length + 50;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (fits(mid, obs)) hi = mid; else lo = mid + 1; }
        return lo;
      };
      const rows0 = columns === 1 ? layout(m, cols, 0, []).lastRows : shortest([]);
      X = (columns === 1 ? stack.xM : stack.x) * W;
      floor = (columns === 1 ? stack.floorM : stack.floor) * rows0 * lh;
      balls.forEach((b, k) => {
        b.r = (columns === 1 ? stack.radiiM[k] : stack.radii[k]) * cw;
        const el = ballRefs.current[k];
        if (el) { el.style.width = el.style.height = b.r * 2 + 'px'; }
      });
      rows = columns === 1 ? 0 : shortest(obstacles(true));
      // Balls already down settle into their new seats
      balls.forEach((b, k) => { if (b.state === 'resting') { const s = seat(k, b.ang); b.x = s.x; b.y = s.y; } });
      relayout();
      check();
    };

    const relayout = () => {
      if (!m) return;
      const res = layout(m, cols, rows, obstacles(false));
      pos = res.pos;
      pos.forEach((p, k) => { const el = wordEls[k]; el.style.left = p.x + 'px'; el.style.top = p.y + 'px'; });
      const textRows = columns === 1 ? res.lastRows : Math.max(rows, res.lastRows);
      box.style.height = Math.max(textRows * m.lh, floor) + 'px';
      // The paragraph's heading stands in its first line's indent
      paras.forEach((p, pi) => {
        const el = labelRefs.current[pi]; if (!el) return;
        const at = pos[words.findIndex(w => w.para === pi)];
        const col = cols.find(c => at.x >= c.x0 - 1 && at.x <= c.x1) ?? cols[0];
        el.style.left = col.x0 + 'px'; el.style.top = at.y + 'px';
      });
      balls.forEach((b, k) => {
        const el = ballRefs.current[k]; if (!el) return;
        el.style.transform = `translate(${b.x - b.r}px, ${b.y - b.r}px)`;
        el.style.visibility = b.state === 'out' ? 'hidden' : 'visible';
      });
      // A soft shadow on the floor, darker as the lowest ball comes down
      const sh = shadowRef.current, b0 = balls[0];
      if (sh) {
        const near = b0.state === 'out' ? 0 : Math.max(0, 1 - (floor - b0.r - b0.y) / 600);
        sh.style.width = b0.r * 2.2 + 'px';
        sh.style.transform = `translate(${X - b0.r * 1.1}px, ${floor - b0.r * 0.12}px) scale(${0.5 + near * 0.5})`;
        sh.style.opacity = String(near * 0.9);
      }
    };

    // The balls drop in one by one as the floor comes up the screen; each
    // waits for the one below to settle first
    const check = () => {
      if (!m) return;
      const vh = window.innerHeight;
      const top = box.getBoundingClientRect().top;
      const floorOnScreen = top + floor;
      balls.forEach((_, k) => { want[k] = floorOnScreen < vh * (0.95 - 0.1 * k); });
      // Words rise into place a line at a time as they reach the lower part
      // of the screen, and sink away again below it
      const edge = vh * 0.88;
      pos.forEach((p, k) => {
        if (!p) return;
        const on = top + p.y < edge;
        if (on === shown[k]) return;
        shown[k] = on;
        const el = wordEls[k];
        gsap.killTweensOf(el);
        gsap.to(el, on
          ? { yPercent: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: (p.x / box.clientWidth) * 0.25 }
          : { yPercent: 70, opacity: 0, duration: 0.35, ease: 'power2.in' });
      });
      if (!raf) { last = 0; raf = requestAnimationFrame(tick); }
    };

    const step = (dt: number) => {
      const screenTop = -box.getBoundingClientRect().top;   // the screen's top, in the text's px
      let busy = false;
      balls.forEach((b, k) => {
        const below = balls[k - 1];
        // Start falling once wanted, the ball below has settled, and nothing above is still in
        if (b.state === 'out' && want[k] && (k === 0 || (below.state === 'resting' && below.rest > 0.25))) {
          const s = seat(k, lean(k));
          b.state = 'falling'; b.x = s.x; b.y = screenTop - b.r - 40; b.vy = 0; b.ang = lean(k); b.angV = 0;
        }
        // Lift away when no longer wanted — the top ones go first
        if ((b.state === 'resting' || b.state === 'falling') && !want[k] && balls.slice(k + 1).every(a => a.state === 'out' || a.state === 'leaving')) {
          b.state = 'leaving'; b.vy = -RISE * 0.3;
        }
        if (b.state === 'falling') {
          busy = true;
          b.vy += G * dt; b.y += b.vy * dt;
          const s = seat(k, b.ang);
          b.x = s.x;
          if (b.y >= s.y) {
            b.y = s.y;
            b.vy = -b.vy * BOUNCE;
            if (Math.abs(b.vy) < 120) {
              // Landed: it rocks on the ball below, and gives that one a nudge
              b.state = 'resting'; b.rest = 0; b.vy = 0;
              const side = Math.random() < 0.5 ? -1 : 1;
              b.angV += side * (k === 0 ? 0.5 : 1.7);
              if (below) below.angV -= side * 0.45;
            }
          }
        } else if (b.state === 'resting') {
          b.rest += dt;
          b.angV += (-K * (b.ang - lean(k)) - DAMP * b.angV) * dt;
          b.ang += b.angV * dt;
          const s = seat(k, b.ang);
          b.x = s.x; b.y = s.y;
          if (Math.abs(b.angV) > 0.002 || Math.abs(b.ang - lean(k)) > 0.001) busy = true;
        } else if (b.state === 'leaving') {
          busy = true;
          b.vy -= RISE * 3 * dt; b.y += b.vy * dt;
          if (b.y < screenTop - b.r - 60) b.state = 'out';
        }
        if (b.state === 'out' && want[k]) busy = true;   // still waiting its turn
      });
      return busy;
    };

    const tick = (t: number) => {
      raf = 0;
      const dt = last ? Math.min(1 / 30, (t - last) / 1000) : 1 / 60;
      last = t;
      const busy = m ? step(dt) : false;
      relayout();
      if (busy) raf = requestAnimationFrame(tick);
    };

    gsap.set(wordEls, { yPercent: 70, opacity: 0 });
    let alive = true;
    document.fonts.ready.then(() => { if (alive) measure(); });
    const ro = new ResizeObserver(() => measure());
    ro.observe(box);
    page.addEventListener('scroll', check, { passive: true });
    return () => {
      alive = false;
      ro.disconnect();
      page.removeEventListener('scroll', check);
      cancelAnimationFrame(raf);
      gsap.killTweensOf(wordEls);
    };
    // The text and the stack are fixed for the page's life
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns]);

  const hidden: CSSProperties = { position: 'absolute', visibility: 'hidden', whiteSpace: 'pre', left: 0, top: 0 };
  return (
    <div ref={boxRef} style={{ ...style, position: 'relative' }}>
      <span ref={spaceRef} style={{ ...hidden, display: 'inline-block' }}>{' '}</span>
      <span ref={indentRef} style={{ ...hidden, display: 'block', width: 'var(--flow-indent)' }} />
      <div ref={shadowRef} aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, height: 24, opacity: 0, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(0,0,0,0.85), rgba(0,0,0,0))', pointerEvents: 'none' }} />
      {Array.from({ length: count }, (_, k) => (
        <div key={k} ref={el => { ballRefs.current[k] = el; }} aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, visibility: 'hidden', borderRadius: '50%', pointerEvents: 'none', zIndex: 1, ...BALL }} />
      ))}
      {paras.map((p, pi) => p.label && (
        <span key={'l' + pi} ref={el => { labelRefs.current[pi] = el; }} style={{ position: 'absolute', whiteSpace: 'nowrap', ...LABEL }}>{p.label}</span>
      ))}
      {words.map((w, k) => (
        <span key={k} data-w="" style={{ position: 'absolute', left: 0, top: 0, display: 'inline-block', whiteSpace: 'pre' }}>{w.w}</span>
      ))}
    </div>
  );
}

// A convex ball: lit from the upper left, a soft core shadow on the lower
// right and a faint bounce light along its bottom edge
const BALL: CSSProperties = {
  background: [
    'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 22%)',
    'radial-gradient(circle at 50% 120%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%)',
    'radial-gradient(circle at 38% 34%, #f4f4f4 0%, #d9d9d9 30%, #a3a3a3 62%, #5c5c5c 88%, #3a3a3a 100%)',
  ].join(', '),
  boxShadow: 'inset -0.06em -0.08em 0.3em rgba(0,0,0,0.25)',
};

// The part's heading, set by the page through CSS variables
const LABEL: CSSProperties = {
  fontFamily: 'var(--font)', fontSize: 'var(--text-size)', fontWeight: 'var(--text-weight)' as CSSProperties['fontWeight'],
  lineHeight: 'var(--text-lh)', letterSpacing: 'var(--text-ls)',
  marginTop: 'var(--flow-label-top, 0px)',
};
