import { useEffect, useRef } from 'react';

// 404: a bare pinball table — two flippers, three round bumpers, the hero's
// white ball. ← → (or a tap / click on either half) work the flippers.
const BG = '#eaeaea';
const LINE = 'rgba(0,0,0,0.18)';

type Seg = { ax: number; ay: number; bx: number; by: number };

// The sticker's critter, pixel by pixel (W white, G grey, D dark)
const CRITTER = [
  '....W.....W....',
  '....WG....WG...',
  '....WWWWWWWW...',
  '..G.WWWWWWWW.G.',
  '.GGGWWWWWWWWGGG',
  'G...WDWWWWDW..G',
  '....WWWWWWWW...',
  '....WGWWWWGW...',
  '....WWWGGWWW...',
  '.....WWWWWW....',
  '.....WW..WW....',
  '.....WW..WW....',
];

export function Pinball() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext('2d')!;
    let W = 0, H = 0, R = 0, dpr = 1;
    let walls: Seg[] = [];
    let bumpers: { x: number; y: number; r: number; hit: number }[] = [];
    let flip: { px: number; py: number; len: number; dir: 1 | -1; a: number; up: boolean }[] = [];
    const ball = { x: 0, y: 0, vx: 0, vy: 0 };
    // The ball's orientation (3×3, row-major): starts a little turned away
    let M = [0.9, 0, 0.436, 0, 1, 0, -0.436, 0, 0.9];
    const spin = () => {
      // Rolls with its motion, plus a slow tumble of its own about every axis
      const wx = ball.vy / R * 0.9 + 0.011, wy = -ball.vx / R * 0.9 + 0.017, wz = 0.007;
      const th = Math.hypot(wx, wy, wz); if (!th) return;
      const k = [wx / th, wy / th, wz / th], c = Math.cos(th), sn = Math.sin(th), v = 1 - c;
      const Rm = [
        c + k[0] * k[0] * v, k[0] * k[1] * v - k[2] * sn, k[0] * k[2] * v + k[1] * sn,
        k[1] * k[0] * v + k[2] * sn, c + k[1] * k[1] * v, k[1] * k[2] * v - k[0] * sn,
        k[2] * k[0] * v - k[1] * sn, k[2] * k[1] * v + k[0] * sn, c + k[2] * k[2] * v,
      ];
      const N = new Array(9).fill(0);
      for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) for (let m = 0; m < 3; m++) N[r * 3 + q] += Rm[r * 3 + m] * M[m * 3 + q];
      M = N;
    };

    const REST = 0.5, UP = -0.45;
    const layout = () => {
      dpr = window.devicePixelRatio || 1;
      W = cv.clientWidth; H = cv.clientHeight;
      // The page may be scaled with CSS zoom: the bitmap follows what is on screen
      const box = cv.getBoundingClientRect();
      cv.width = Math.round(box.width * dpr); cv.height = Math.round(box.height * dpr);
      R = Math.max(24, Math.min(W, H) * 0.05);
      const fw = Math.min(W * 0.16, 200);           // flipper length
      const gap = R * 2.6;                           // drain between them
      const fy = H - Math.max(130, H * 0.2);
      const lx = W / 2 - gap / 2 - fw, rx = W / 2 + gap / 2 + fw;
      flip = [
        { px: lx, py: fy, len: fw, dir: 1, a: REST, up: false },
        { px: rx, py: fy, len: fw, dir: -1, a: REST, up: false },
      ];
      // Side walls run down into the flippers' pivots
      walls = [
        { ax: 0, ay: fy - (lx) * 0.55, bx: lx, by: fy },
        { ax: W, ay: fy - (W - rx) * 0.55, bx: rx, by: fy },
      ];
      const br = Math.max(26, Math.min(W, H) * 0.045);
      bumpers = [
        { x: W * 0.3, y: H * 0.3, r: br, hit: 0 },
        { x: W * 0.7, y: H * 0.3, r: br, hit: 0 },
        { x: W * 0.5, y: H * 0.62, r: br, hit: 0 },
      ];
    };
    const serve = () => { ball.x = W * (0.3 + Math.random() * 0.4); ball.y = R; ball.vx = (Math.random() - 0.5) * 3; ball.vy = 0; };

    const flipSeg = (f: typeof flip[0]): Seg => ({
      ax: f.px, ay: f.py,
      bx: f.px + Math.cos(f.a) * f.len * f.dir, by: f.py + Math.sin(f.a) * f.len,
    });

    // Push the ball out of a segment and bounce it; `kick` adds the flipper's swing
    const hitSeg = (s: Seg, bounce: number, kick = 0) => {
      const dx = s.bx - s.ax, dy = s.by - s.ay;
      const t = Math.max(0, Math.min(1, ((ball.x - s.ax) * dx + (ball.y - s.ay) * dy) / (dx * dx + dy * dy)));
      const cx = s.ax + dx * t, cy = s.ay + dy * t;
      let nx = ball.x - cx, ny = ball.y - cy;
      const d = Math.hypot(nx, ny);
      if (d >= R || d === 0) return;
      nx /= d; ny /= d;
      ball.x = cx + nx * R; ball.y = cy + ny * R;
      const vn = ball.vx * nx + ball.vy * ny;
      if (vn < 0) { ball.vx -= (1 + bounce) * vn * nx; ball.vy -= (1 + bounce) * vn * ny; }
      if (kick) { ball.vx += nx * kick * t; ball.vy += ny * kick * t; }
    };

    const step = () => {
      ball.vy += 0.256;
      ball.vx *= 0.999; ball.vy *= 0.999;
      const sp = Math.hypot(ball.vx, ball.vy);
      if (sp > 21) { ball.vx *= 21 / sp; ball.vy *= 21 / sp; }
      ball.x += ball.vx; ball.y += ball.vy;
      if (ball.x < R) { ball.x = R; ball.vx = Math.abs(ball.vx) * 0.6; }
      if (ball.x > W - R) { ball.x = W - R; ball.vx = -Math.abs(ball.vx) * 0.6; }
      walls.forEach(w => hitSeg(w, 0.4));
      flip.forEach(f => {
        const target = f.up ? UP : REST;
        const prev = f.a;
        f.a += Math.max(-0.35, Math.min(0.35, target - f.a));
        const swing = f.a - prev < 0 ? 17.6 : 0;
        hitSeg(flipSeg(f), 0.3, swing);
      });
      bumpers.forEach(b => {
        const dx = ball.x - b.x, dy = ball.y - b.y, d = Math.hypot(dx, dy);
        if (d < b.r + R && d > 0) {
          const nx = dx / d, ny = dy / d;
          ball.x = b.x + nx * (b.r + R); ball.y = b.y + ny * (b.r + R);
          const vn = ball.vx * nx + ball.vy * ny;
          ball.vx -= 2 * vn * nx; ball.vy -= 2 * vn * ny;
          ball.vx += nx * 3.2; ball.vy += ny * 3.2;
          b.hit = 1;
        }
        b.hit *= 0.9;
      });
      // Never leaves the screen: the top and the bottom edge bounce it back
      if (ball.y < R) { ball.y = R; ball.vy = Math.abs(ball.vy) * 0.6; }
      if (ball.y > H - R) { ball.y = H - R; ball.vy = -Math.abs(ball.vy) * 0.75 - 6; }
      spin();
    };

    const draw = () => {
      ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
      walls.forEach(w => { ctx.beginPath(); ctx.moveTo(w.ax, w.ay); ctx.lineTo(w.bx, w.by); ctx.stroke(); });
      bumpers.forEach(b => {
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r + b.hit * 6, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      flip.forEach(f => { const s = flipSeg(f); ctx.beginPath(); ctx.moveTo(s.ax, s.ay); ctx.lineTo(s.bx, s.by); ctx.stroke(); });
      // The hero's ball: bright base, glint up-left, faint rim shade
      const g = ctx.createRadialGradient(ball.x - R * 0.15, ball.y - R * 0.2, 0, ball.x - R * 0.15, ball.y - R * 0.2, R * 1.3);
      g.addColorStop(0, '#fdfdfd'); g.addColorStop(0.6, '#f4f4f4'); g.addColorStop(1, '#e2e2e2');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ball.x, ball.y, R, 0, Math.PI * 2); ctx.fill();
      const sg = ctx.createRadialGradient(ball.x - R * 0.4, ball.y - R * 0.48, 0, ball.x - R * 0.4, ball.y - R * 0.48, R * 0.7);
      sg.addColorStop(0, 'rgba(255,255,255,0.85)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(ball.x, ball.y, R, 0, Math.PI * 2); ctx.fill();
      // The sticker: the black-and-white critter, no background, laid on the
      // ball's surface — it turns with the ball, so it often faces away
      const cols = CRITTER[0].length, rows = CRITTER.length, pp = 1.05 / cols;
      const toScreen = (a: number, b: number) => {
        const l = Math.hypot(a, b, 1), v = [a / l, b / l, 1 / l];
        return [
          M[0] * v[0] + M[1] * v[1] + M[2] * v[2],
          M[3] * v[0] + M[4] * v[1] + M[5] * v[2],
          M[6] * v[0] + M[7] * v[1] + M[8] * v[2],
        ];
      };
      CRITTER.forEach((row, y) => [...row].forEach((c, x) => {
        if (c === '.') return;
        const a0 = (x - cols / 2) * pp, b0 = (y - rows / 2) * pp;
        const mid = toScreen(a0 + pp / 2, b0 + pp / 2);
        if (mid[2] < 0.1) return;
        const pts = [[a0, b0], [a0 + pp, b0], [a0 + pp, b0 + pp], [a0, b0 + pp]].map(([a, b]) => toScreen(a, b));
        ctx.fillStyle = c === 'W' ? '#161616' : c === 'G' ? '#8c8c8c' : '#f6f6f6';
        ctx.globalAlpha = Math.min(1, (mid[2] - 0.1) * 4);
        ctx.beginPath();
        pts.forEach((q, k) => { const X = ball.x + q[0] * R, Y = ball.y + q[1] * R; k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
        ctx.closePath(); ctx.fill();
      }));
      ctx.globalAlpha = 1;
    };

    let raf = 0;
    const loop = () => { step(); step(); draw(); raf = requestAnimationFrame(loop); };
    layout(); serve(); loop();

    const set = (side: 0 | 1, up: boolean) => { flip[side].up = up; };
    const key = (up: boolean) => (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'z' || e.key === 'Shift') set(0, up);
      if (e.key === 'ArrowRight' || e.key === '/' || e.key === 'm') set(1, up);
    };
    const kd = key(true), ku = key(false);
    const pd = (e: PointerEvent) => set(e.clientX < cv.getBoundingClientRect().width / 2 ? 0 : 1, true);
    const pu = () => { set(0, false); set(1, false); };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    cv.addEventListener('pointerdown', pd); window.addEventListener('pointerup', pu);
    window.addEventListener('resize', layout);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      cv.removeEventListener('pointerdown', pd); window.removeEventListener('pointerup', pu);
      window.removeEventListener('resize', layout);
    };
  }, []);

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none' }} />;
}
