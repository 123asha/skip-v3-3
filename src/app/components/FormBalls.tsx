import { useEffect, useRef } from 'react';

/**
 * Balls that fall in the contact block (desktop). A tap on an empty spot drops
 * one — as does ten seconds of nothing happening there while the block is on
 * screen. Same look as the balls of the home hero (a soft white sphere with a
 * letter of SKIP DESIGN on it), and real-feeling physics: gravity, bounces off
 * the walls and the floor (each a little less lively than the last), rolling
 * that slows to a stop, balls knocking into one another. Tapping a ball kicks
 * it back up.
 */
const LETTERS = 'SKIPDESIGN';
const MAX_BALLS = 7;
const IDLE_MS = 10_000;

const G = 2300;            // px/s² — gravity
const WALL_E = 0.72;       // bounce off a side wall
const FLOOR_E = 0.62;      // bounce off the floor
const BALL_E = 0.7;        // bounce between balls
const ROLL = 1.1;          // rolling resistance on the floor (1/s)
const AIR = 0.05;          // air drag (1/s)

interface Ball {
  x: number; y: number; vx: number; vy: number; r: number;
  angle: number; still: number; el: HTMLDivElement;
}

export default function FormBalls({ hostRef }: { hostRef: React.RefObject<HTMLElement> }) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current, layer = layerRef.current;
    if (!host || !layer) return;
    const balls: Ball[] = [];
    let raf = 0;
    let last = 0;
    let visible = false;
    let lastActivity = performance.now();

    const radius = () => Math.max(50, Math.min(88, host.clientWidth * 0.045));

    const draw = (b: Ball) => {
      b.el.style.transform = `translate3d(${b.x - b.r}px, ${b.y - b.r}px, 0)`;
      const letter = b.el.firstElementChild as HTMLElement | null;
      if (letter) letter.style.transform = `rotate(${b.angle}rad)`;
    };

    const drop = (x?: number) => {
      const r = radius();
      const W = host.clientWidth;
      if (balls.length >= MAX_BALLS) {
        const old = balls.shift()!;
        old.el.remove();
      }
      const el = document.createElement('div');
      el.style.cssText = [
        'position:absolute', 'left:0', 'top:0', `width:${r * 2}px`, `height:${r * 2}px`,
        'border-radius:50%', 'display:flex', 'align-items:center', 'justify-content:center',
        'pointer-events:auto', 'cursor:pointer', 'will-change:transform', 'user-select:none',
        'background:radial-gradient(circle at 36% 30%, #ffffff 0%, #f3f3f3 42%, #e2e2e2 100%)',
        'box-shadow:inset -8px -12px 22px rgba(0,0,0,0.05), 0 12px 32px rgba(0,0,0,0.07)',
      ].join(';');
      const l = document.createElement('span');
      l.textContent = LETTERS[Math.floor(Math.random() * LETTERS.length)];
      l.style.cssText = `font-family:var(--font);font-size:${r * 1.05}px;font-weight:450;color:#dcdcdc;line-height:1;pointer-events:none;display:block;`;
      el.appendChild(l);
      layer.appendChild(el);
      const b: Ball = {
        x: Math.max(r, Math.min(W - r, x ?? W * (0.2 + Math.random() * 0.6))),
        y: -r * 1.2,
        vx: (Math.random() - 0.5) * 260,
        vy: 60,
        r, angle: (Math.random() - 0.5) * 1.2, still: 0, el,
      };
      el.addEventListener('pointerdown', e => {
        e.stopPropagation();
        // A kick: up and a little sideways, away from where it was hit
        const box = el.getBoundingClientRect();
        const off = (e.clientX - (box.left + box.width / 2)) / b.r;
        b.vy = -(900 + Math.random() * 300);
        b.vx += -off * 420 + (Math.random() - 0.5) * 160;
        b.still = 0;
        wake();
      });
      balls.push(b);
      draw(b);
      wake();
    };

    const step = (t: number) => {
      raf = 0;
      const dt = Math.min(0.033, (t - last) / 1000 || 0.016);
      last = t;
      const W = host.clientWidth, H = host.clientHeight;
      let moving = false;

      for (const b of balls) {
        // free flight
        b.vy += G * dt;
        const drag = Math.exp(-AIR * dt);
        b.vx *= drag; b.vy *= drag;
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // side walls
        if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx) * WALL_E; b.angle += b.vy * 0.0005; }
        else if (b.x + b.r > W) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * WALL_E; b.angle -= b.vy * 0.0005; }

        // floor
        let onFloor = false;
        if (b.y + b.r >= H) {
          b.y = H - b.r;
          if (b.vy > 55) { b.vy = -b.vy * FLOOR_E; }
          else { b.vy = 0; }
          onFloor = true;
          // rolling: friction eases the sideways speed down to nothing
          b.vx *= Math.exp(-ROLL * dt);
          if (Math.abs(b.vx) < 3) b.vx = 0;
        }
        // the letter turns as the ball rolls (v / r radians per second)
        b.angle += (b.vx / b.r) * dt;

        b.still = onFloor && Math.abs(b.vx) < 6 && Math.abs(b.vy) < 6 ? b.still + dt : 0;
        if (b.still < 0.5) moving = true;
      }

      // balls knocking into one another
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const a = balls[i], c = balls[j];
          const dx = c.x - a.x, dy = c.y - a.y;
          const min = a.r + c.r;
          const d2 = dx * dx + dy * dy;
          if (d2 >= min * min || d2 === 0) continue;
          const d = Math.sqrt(d2);
          const nx = dx / d, ny = dy / d;
          // push apart, half each
          const push = (min - d) / 2;
          a.x -= nx * push; a.y -= ny * push;
          c.x += nx * push; c.y += ny * push;
          // equal masses: swap the speed along the normal, with some loss
          const rel = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
          if (rel < 0) {
            const imp = -(1 + BALL_E) * rel / 2;
            a.vx -= imp * nx; a.vy -= imp * ny;
            c.vx += imp * nx; c.vy += imp * ny;
            a.still = 0; c.still = 0; moving = true;
          }
        }
      }

      balls.forEach(draw);
      if (moving && visible) raf = requestAnimationFrame(step);
    };

    function wake() {
      if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(step); }
    }

    // ── triggers ─────────────────────────────────────────────────────────
    const isEmptySpot = (t: EventTarget | null) => {
      if (!(t instanceof HTMLElement)) return false;
      // Anything that is a control, text or a ball is not «empty»
      if (t.closest('input, button, a, label, p, span, svg, [class*="contactCheckbox"], [class*="CircleInput"], [class*="root"]')) return false;
      return true;
    };
    const onDown = (e: PointerEvent) => {
      lastActivity = performance.now();
      if (isEmptySpot(e.target)) {
        const box = host.getBoundingClientRect();
        drop(e.clientX - box.left);
      }
    };
    const onActivity = () => { lastActivity = performance.now(); };
    host.addEventListener('pointerdown', onDown);
    host.addEventListener('keydown', onActivity, true);
    host.addEventListener('focusin', onActivity, true);
    host.addEventListener('input', onActivity, true);

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && e.intersectionRatio > 0.5;
      if (visible) { lastActivity = performance.now(); wake(); }
    }, { threshold: [0, 0.5, 1] });
    io.observe(host);

    // ten quiet seconds with the block on screen: a ball falls
    const idle = window.setInterval(() => {
      if (visible && performance.now() - lastActivity >= IDLE_MS) {
        lastActivity = performance.now();
        drop();
      }
    }, 1000);

    const onResize = () => wake();
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(idle);
      window.removeEventListener('resize', onResize);
      io.disconnect();
      host.removeEventListener('pointerdown', onDown);
      host.removeEventListener('keydown', onActivity, true);
      host.removeEventListener('focusin', onActivity, true);
      host.removeEventListener('input', onActivity, true);
      layer.replaceChildren();
    };
  }, [hostRef]);

  return <div ref={layerRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }} />;
}
