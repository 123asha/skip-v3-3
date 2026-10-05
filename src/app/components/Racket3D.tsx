import { useEffect, useRef } from 'react';
import { sound } from '../sound/Sound';
import PillButton from './PillButton';

// 404 alternative (localhost only): a minimalist 3D racket and a ball in a
// bare room. The racket follows the pointer on the near plane; the ball flies
// back and forth, off the walls, the floor, the ceiling and the racket.
const BG = '#eaeaea';
const D = 1.35;            // camera distance in front of the near plane
const ZMAX = 3;            // the back wall
const BALL = 0.085;
const RACKET = 0.3;

export default function Racket3D({ onGoHome }: { onGoHome: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext('2d')!;
    let W = 0, H = 0, dpr = 1, S = 0, raf = 0;
    const size = () => {
      dpr = window.devicePixelRatio || 1;
      const box = cv.getBoundingClientRect();
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(box.width * dpr); cv.height = Math.round(box.height * dpr);
      S = Math.min(W, H * 1.15) * 0.42;
    };
    size();
    // Projection: world x∈[-1,1], y∈[-1,1], z∈[0,ZMAX] (0 = nearest, the racket's plane)
    const proj = (x: number, y: number, z: number) => {
      const k = D / (z + D);
      return { x: W / 2 + x * S * k, y: H * 0.52 - y * S * k, k };
    };

    const ball = { x: 0, y: 0.3, z: 2, vx: 0.006, vy: 0, vz: -0.022, spin: 0 };
    const racket = { x: 0, y: -0.3, px: 0, py: -0.3, vx: 0, vy: 0 };
    const target = { x: 0, y: -0.3 };
    let hitFlash = 0, missed = 0;
    const serve = () => { ball.x = (Math.random() - 0.5) * 1.2; ball.y = 0.4; ball.z = ZMAX - 0.2; ball.vx = (Math.random() - 0.5) * 0.02; ball.vy = 0.004; ball.vz = -0.02; };
    serve();

    const step = () => {
      racket.px = racket.x; racket.py = racket.y;
      racket.x += (target.x - racket.x) * 0.22; racket.y += (target.y - racket.y) * 0.22;
      racket.vx = racket.x - racket.px; racket.vy = racket.y - racket.py;
      ball.vy -= 0.00055;
      ball.x += ball.vx; ball.y += ball.vy; ball.z += ball.vz;
      const wall = 1 - BALL;
      if (ball.x > wall) { ball.x = wall; ball.vx = -Math.abs(ball.vx) * 0.95; }
      if (ball.x < -wall) { ball.x = -wall; ball.vx = Math.abs(ball.vx) * 0.95; }
      if (ball.y < -wall) { ball.y = -wall; ball.vy = Math.abs(ball.vy) * 0.9; }
      if (ball.y > wall) { ball.y = wall; ball.vy = -Math.abs(ball.vy) * 0.9; }
      if (ball.z > ZMAX) { ball.z = ZMAX; ball.vz = -Math.abs(ball.vz); sound.play('hover', 90); }
      // The racket's plane
      if (ball.vz < 0 && ball.z < 0.06 && ball.z > -0.12) {
        const dx = ball.x - racket.x, dy = ball.y - racket.y;
        if (Math.hypot(dx, dy) < RACKET + BALL) {
          ball.z = 0.06; ball.vz = Math.min(0.045, Math.abs(ball.vz) * 1.06 + 0.004);
          ball.vx = ball.vx * 0.4 + dx * 0.05 + racket.vx * 0.9;
          ball.vy = Math.max(0.006, ball.vy * 0.3 + dy * 0.04 + racket.vy * 0.9 + 0.012);
          ball.spin = racket.vx * 40;
          hitFlash = 1;
          sound.play('tap', 40);
        }
      }
      // Missed: the ball hangs just behind the racket for a moment, then a new one is served
      if (ball.z < -0.5) { ball.z = -0.5; ball.vz = 0; ball.vx *= 0.9; ball.vy *= 0.9; if (++missed > 45) { missed = 0; serve(); } }
      hitFlash *= 0.9;
    };

    const line = (a: ReturnType<typeof proj>, b: ReturnType<typeof proj>) => { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); };

    const draw = () => {
      ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
      // The room: the back wall and the four edges running to the front
      ctx.strokeStyle = 'rgba(0,0,0,0.16)'; ctx.lineWidth = 1.5;
      const c = (z: number) => [proj(-1, -1, z), proj(1, -1, z), proj(1, 1, z), proj(-1, 1, z)];
      const back = c(ZMAX), front = c(0);
      ctx.beginPath();
      back.forEach((p, i) => { i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }); ctx.closePath();
      back.forEach((p, i) => line(p, front[i]));
      ctx.stroke();
      // Depth cues for the ball: a shadow on the floor and a thin line down to it
      const fl = proj(ball.x, -1, ball.z), bp = proj(ball.x, ball.y, ball.z);
      ctx.fillStyle = 'rgba(0,0,0,0.10)';
      ctx.beginPath(); ctx.ellipse(fl.x, fl.y, BALL * S * fl.k * 1.3, BALL * S * fl.k * 0.32, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.beginPath(); ctx.moveTo(fl.x, fl.y); ctx.lineTo(bp.x, bp.y); ctx.stroke();
      // The ball (behind the racket when it is farther than the racket plane — it always is)
      const r = BALL * S * bp.k;
      const g = ctx.createRadialGradient(bp.x - r * 0.3, bp.y - r * 0.35, 0, bp.x - r * 0.15, bp.y - r * 0.2, r * 1.3);
      g.addColorStop(0, '#fdfdfd'); g.addColorStop(0.6, '#f4f4f4'); g.addColorStop(1, '#d9d9d9');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bp.x, bp.y, r, 0, Math.PI * 2); ctx.fill();
      // The racket on the near plane: a thin ring, a face a touch lighter, a handle; it tilts with its motion
      const rp = proj(racket.x, racket.y, 0);
      const R = RACKET * S * rp.k;
      ctx.save();
      ctx.translate(rp.x, rp.y);
      ctx.rotate(Math.max(-0.5, Math.min(0.5, racket.vx * 9)));
      const squash = 1 - Math.min(0.18, Math.abs(racket.vy) * 5);
      ctx.scale(1, squash);
      ctx.fillStyle = `rgba(255,255,255,${0.35 + hitFlash * 0.35})`;
      ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(R * 0.55, R * 0.8); ctx.lineTo(R * 1.15, R * 1.55); ctx.lineWidth = R * 0.12; ctx.lineCap = 'round'; ctx.stroke();
      ctx.restore();
    };

    const loop = () => { step(); draw(); raf = requestAnimationFrame(loop); };
    loop();

    const move = (e: PointerEvent) => {
      const box = cv.getBoundingClientRect();
      const nx = ((e.clientX - box.left) / box.width - 0.5) * 2, ny = ((e.clientY - box.top) / box.height - 0.52) * 2;
      target.x = Math.max(-0.95, Math.min(0.95, nx * (W / (2 * S)) * 0.92));
      target.y = Math.max(-0.95, Math.min(0.95, -ny * (H / (2 * S)) * 0.92));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('resize', size);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointermove', move); window.removeEventListener('resize', size); };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 160, background: BG, animation: 'pageIn 0.35s 0.05s ease both' }}>
      <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'none' }} />
      <div style={{
        position: 'absolute', top: 'var(--pad)', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--hero-fs, min(var(--hero-size), 7.2vw))',
        fontWeight: 'var(--heading-weight)' as React.CSSProperties['fontWeight'],
        lineHeight: 'var(--hero-lh, 0.8755)', letterSpacing: '-0.03em', color: 'var(--c-text)',
      }}>404</div>
      <div style={{ position: 'absolute', left: '50%', bottom: 'calc(var(--pad) + 60px)', transform: 'translateX(-50%)' }}>
        <PillButton variant="primary" onClick={onGoHome}>На главную</PillButton>
      </div>
    </div>
  );
}
