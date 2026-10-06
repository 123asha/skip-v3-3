import { useEffect, useRef } from 'react';
import { sound } from '../sound/Sound';
import svgPaths from '../../imports/Index/svg-3bjnx36a2y';

// 404: a bare pinball table — two flippers, three round bumpers, the hero's
// white ball. ← → (or a tap / click on either half) work the flippers.
const BG = '#eaeaea';
const LINE = 'rgba(0,0,0,0.18)';

type Seg = { ax: number; ay: number; bx: number; by: number };

// The sticker's critter, pixel by pixel (W white, G grey, D dark)
const LOGO_PATHS = svgPaths.pb7e9300.match(/M[^M]+/g)!;
const LOGO: { path: Path2D; rule: CanvasFillRule }[] = [
  { path: new Path2D(LOGO_PATHS[1]), rule: 'nonzero' },
  { path: new Path2D(LOGO_PATHS[2]), rule: 'nonzero' },
  { path: new Path2D(LOGO_PATHS[4]), rule: 'nonzero' },
  { path: new Path2D(LOGO_PATHS[0] + LOGO_PATHS[3]), rule: 'evenodd' },
];

// The logo as a coverage mask for the sphere sticker
const MASK_W = 256, MASK_H = 156;
const LOGO_MASK: Uint8Array = (() => {
  const c = document.createElement('canvas'); c.width = MASK_W; c.height = MASK_H;
  const g = c.getContext('2d')!;
  const k = (MASK_W * 0.92) / 52.5283;
  g.translate(MASK_W / 2 - 26.264 * k, MASK_H / 2 - 16 * k); g.scale(k, k);
  g.fillStyle = '#000';
  LOGO.forEach(p => g.fill(p.path, p.rule));
  const px = g.getImageData(0, 0, MASK_W, MASK_H).data, out = new Uint8Array(MASK_W * MASK_H);
  for (let i = 0; i < out.length; i++) out[i] = px[i * 4 + 3];
  return out;
})();

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

// variant 'form': the same table behind the contact form — no bumpers, the
// lines barely there, a transparent field; the ball is bounced only by the
// screen's edges, the flippers and the text marked data-pin-obstacle.
// `dark`: drawn for a dark page (a dark ball, a white critter).
export function Pinball({ variant = 'page', dark = false }: { variant?: 'page' | 'form'; dark?: boolean } = {}) {
  const form = variant === 'form';
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext('2d')!;
    let W = 0, H = 0, R = 0, dpr = 1;
    let walls: Seg[] = [];
    let bumpers: { x: number; y: number; r: number; hit: number }[] = [];
    let flip: { px: number; py: number; len: number; dir: 1 | -1; a: number; up: boolean }[] = [];
    // Sounds only while the table is on screen
    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      // Only once the ticker's ball has dropped out (or there is none: phones)
      if (form && visible && !active && (homeFallen || !document.querySelector('[data-client-ball]'))) { serve(); active = true; }
    }, { threshold: 0.2 });
    io.observe(cv);
    const play = (kind: Parameters<typeof sound.play>[0], throttle?: number) => { if (visible && document.visibilityState === 'visible') sound.play(kind, throttle); };
    const ball = { x: 0, y: 0, vx: 0, vy: 0 };
    // Form variant: there is no ball of its own — the one from the «Нам доверяют»
    // section falls in (skip-ball-handoff), or, if the page was scrolled past
    // too fast, a new one is dropped from the top when the table comes into view
    let active = !form;
    let homeFallen = false;
    // Phone (form variant): no lines at all — the ball just rolls the way the
    // phone is tilted and bounces off the screen's edges and the text
    const phone = form && window.matchMedia('(max-width: 768px)').matches;
    let tiltX = 0, tiltY = 0, baseBeta: number | null = null;
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      if (baseBeta === null) baseBeta = e.beta;
      const clamp = (v: number) => Math.max(-60, Math.min(60, v));
      tiltX = Math.sin(clamp(e.gamma) * Math.PI / 180) * 0.5;
      tiltY = Math.sin(clamp(e.beta - baseBeta) * Math.PI / 180) * 0.5;
    };
    let askTilt: (() => void) | null = null;
    if (phone && 'DeviceOrientationEvent' in window) {
      const DOE = (window as any).DeviceOrientationEvent;
      if (typeof DOE?.requestPermission === 'function') {
        // iOS asks for the sensors on a first touch
        askTilt = () => {
          document.removeEventListener('touchend', askTilt!);
          DOE.requestPermission().then((r: string) => { if (r === 'granted') window.addEventListener('deviceorientation', onOrient); }).catch(() => {});
        };
        document.addEventListener('touchend', askTilt, { once: true });
      } else window.addEventListener('deviceorientation', onOrient);
    }
    // The ball's orientation (3×3, row-major): starts a little turned away
    let M = [0.9, 0, 0.436, 0, 1, 0, -0.436, 0, 0.9];
    // The ball turns the way it travels (like a rolling ball), the spin easing
    // towards that, so it carries on turning through the air instead of tumbling at random
    const w = [0, 0, 0];
    const spin = () => {
      w[0] += (-ball.vy / R * 0.55 - w[0]) * 0.06;
      w[1] += (ball.vx / R * 0.55 - w[1]) * 0.06;
      const wx = w[0], wy = w[1], wz = 0;
      const th = Math.hypot(wx, wy, wz); if (th < 1e-4) return;
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
      const fw = Math.min(W * (W < 600 ? 0.27 : 0.16), 200);           // flipper length
      const gap = R * 2.6;                           // drain between them
      const fy = H - Math.max(130, H * 0.2);
      const lx = W / 2 - gap / 2 - fw, rx = W / 2 + gap / 2 + fw;
      flip = phone ? [] : [
        { px: lx, py: fy, len: fw, dir: 1, a: REST, up: false },
        { px: rx, py: fy, len: fw, dir: -1, a: REST, up: false },
      ];
      // Side walls run down into the flippers' pivots
      walls = phone ? [] : [
        { ax: 0, ay: fy - (lx) * 0.55, bx: lx, by: fy },
        { ax: W, ay: fy - (W - rx) * 0.55, bx: rx, by: fy },
      ];
      const br = Math.max(26, Math.min(W, H) * 0.045);
      bumpers = form ? [] : [
        { x: W * 0.3, y: H * 0.3, r: br, hit: 0 },
        { x: W * 0.7, y: H * 0.3, r: br, hit: 0 },
        { x: W * 0.5, y: H * 0.62, r: br, hit: 0 },
      ];
    };
    const serve = () => { ball.x = W * (0.15 + Math.random() * 0.7); ball.y = R; ball.vx = (Math.random() - 0.5) * 6; ball.vy = Math.random() * 2; };

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
      if (vn < 0) {
        ball.vx -= (1 + bounce) * vn * nx; ball.vy -= (1 + bounce) * vn * ny;
        // A knock on a flipper, a softer tick on the walls
        if (vn < -2.5) play(kick ? 'logo' : 'hover', 90);
      }
      if (kick) { ball.vx += nx * kick * t; ball.vy += ny * kick * t; }
    };

    const step = () => {
      if (!active) return;
      if (phone) { ball.vx += tiltX; ball.vy += tiltY + 0.03; } else ball.vy += 0.2;
      ball.vx *= 0.999; ball.vy *= 0.999;
      const sp = Math.hypot(ball.vx, ball.vy);
      if (sp > 13) { ball.vx *= 13 / sp; ball.vy *= 13 / sp; }
      ball.x += ball.vx; ball.y += ball.vy;
      if (ball.x < R) { ball.x = R; if (ball.vx < -2) play('hover', 90); ball.vx = Math.abs(ball.vx) * 0.6; }
      if (ball.x > W - R) { ball.x = W - R; if (ball.vx > 2) play('hover', 90); ball.vx = -Math.abs(ball.vx) * 0.6; }
      walls.forEach(w => hitSeg(w, 0.4));
      flip.forEach(f => {
        const target = f.up ? UP : REST;
        const prev = f.a;
        f.a += Math.max(-0.22, Math.min(0.22, target - f.a));
        const swing = f.a - prev < 0 ? 9 : 0;
        hitSeg(flipSeg(f), 0.3, swing);
      });
      // Anything marked data-pin-obstacle on the page (the «На главную» button) is solid too
      const box = cv.getBoundingClientRect(), kx = W / box.width, ky = H / box.height;
      document.querySelectorAll<HTMLElement>('[data-pin-obstacle]').forEach(el => {
        const r = el.getBoundingClientRect();
        const l = (r.left - box.left) * kx, t = (r.top - box.top) * ky, rr = (r.right - box.left) * kx, bb = (r.bottom - box.top) * ky;
        const cx = Math.max(l, Math.min(ball.x, rr)), cy = Math.max(t, Math.min(ball.y, bb));
        let nx = ball.x - cx, ny = ball.y - cy, d = Math.hypot(nx, ny);
        if (d >= R) return;
        if (d === 0) { nx = 0; ny = -1; d = 1; }
        nx /= d; ny /= d;
        ball.x = cx + nx * R; ball.y = cy + ny * R;
        const vn = ball.vx * nx + ball.vy * ny;
        // Phone: a very hard hit on the form's heading nudges it clockwise a little — and the ball goes on falling
        if (phone && el.hasAttribute('data-pin-title') && vn < -6) {
          const now = performance.now();
          if (now - Number(el.dataset.hitAt || 0) > 700) {
            el.dataset.hitAt = String(now);
            const k = Math.min(3, Number(el.dataset.tilt || 0) + 1);
            el.dataset.tilt = String(k);
            el.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';
            el.style.transform = `translate(${k * 3}px, ${k * 2}px) rotate(${k * 2.5}deg)`;
            sound.play('logo', 80);
          }
          return;
        }
        if (vn < 0) {
          ball.vx -= 1.6 * vn * nx; ball.vy -= 1.6 * vn * ny;
          if (vn < -1.5) play('tap', 60);
        }
      });
      bumpers.forEach(b => {
        const dx = ball.x - b.x, dy = ball.y - b.y, d = Math.hypot(dx, dy);
        if (d < b.r + R && d > 0) {
          const nx = dx / d, ny = dy / d;
          ball.x = b.x + nx * (b.r + R); ball.y = b.y + ny * (b.r + R);
          const vn = ball.vx * nx + ball.vy * ny;
          ball.vx -= 2 * vn * nx; ball.vy -= 2 * vn * ny;
          ball.vx += nx * 1.4; ball.vy += ny * 1.4;
          b.hit = 1;
          play('tap', 60);
        }
        b.hit *= 0.9;
      });
      // The top edge bounces it back; a ball that drains off the bottom starts over from the top
      if (ball.y < R) { ball.y = R; ball.vy = Math.abs(ball.vy) * 0.6; }
      // The form's ball is never re-dropped: like on a phone it bounces off the bottom edge and keeps playing
      if (phone || form) { if (ball.y > H - R) { ball.y = H - R; ball.vy = -Math.abs(ball.vy) * 0.7 - 1; ball.vx *= 0.95; } }
      else if (ball.y - R > H) serve();
      spin();
    };

    // The logo wrapped onto the sphere: each pixel of the ball is traced back to
    // its point on the surface (undoing the ball's turn), and the logo is read there —
    // one sticker on each side
    const off = document.createElement('canvas');
    const stickerOnSphere = (inkLight: boolean) => {
      const sc = cv.width / W, n = Math.max(8, Math.round(2 * R * sc));
      if (off.width !== n) { off.width = off.height = n; }
      const oc = off.getContext('2d')!;
      const img = oc.createImageData(n, n), d = img.data;
      const ink = inkLight ? 242 : 22;
      const SA = 1.5, SB = SA * MASK_H / MASK_W;
      const h = n / 2;
      for (let py = 0; py < n; py++) for (let px = 0; px < n; px++) {
        const nx = (px + 0.5 - h) / h, ny = (py + 0.5 - h) / h, r2 = nx * nx + ny * ny;
        if (r2 >= 1) continue;
        const nz = Math.sqrt(1 - r2);
        const vx = M[0] * nx + M[3] * ny + M[6] * nz, vy = M[1] * nx + M[4] * ny + M[7] * nz, vz = M[2] * nx + M[5] * ny + M[8] * nz;
        for (const side of [1, -1]) {
          const sz = side * vz; if (sz <= 0.05) continue;
          const u = 0.5 + Math.atan2(side * vx, sz) / SA, v = 0.5 + Math.asin(vy) / SB;
          if (u < 0 || u >= 1 || v < 0 || v >= 1) continue;
          const a = LOGO_MASK[(Math.floor(v * MASK_H)) * MASK_W + Math.floor(u * MASK_W)];
          if (!a) continue;
          const o = (py * n + px) * 4;
          d[o] = d[o + 1] = d[o + 2] = ink; d[o + 3] = Math.min(255, a * Math.min(1, (sz - 0.05) * 5));
        }
      }
      oc.putImageData(img, 0, 0);
      ctx.drawImage(off, ball.x - R, ball.y - R, 2 * R, 2 * R);
    };

    const draw = () => {
      const drawBall = active;
      ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
      if (form) ctx.clearRect(0, 0, W, H); else { ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H); }
      const lineCol = form ? (dark ? 'rgba(255,255,255,0.26)' : 'rgba(0,0,0,0.26)') : '#000';
      ctx.strokeStyle = lineCol; ctx.lineWidth = 1.5; ctx.lineCap = 'butt';
      if (form) ctx.setLineDash([3, 8]);
      walls.forEach(w => { ctx.beginPath(); ctx.moveTo(w.ax, w.ay); ctx.lineTo(w.bx, w.by); ctx.stroke(); });
      ctx.strokeStyle = LINE;
      bumpers.forEach(b => {
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r + b.hit * 6, 0, Math.PI * 2); ctx.stroke();
      });
      // Flippers: the walls' own line carried on, same colour, same width, same plain end
      ctx.lineWidth = 1.5; ctx.lineCap = 'butt';
      ctx.strokeStyle = lineCol;
      flip.forEach(f => { const s = flipSeg(f); ctx.beginPath(); ctx.moveTo(s.ax, s.ay); ctx.lineTo(s.bx, s.by); ctx.stroke(); });
      ctx.setLineDash([]);
      if (!drawBall) return;
      // While the page end is inverted the ball is drawn pre-inverted, so it still reads white
      const dk = dark || (form && document.documentElement.hasAttribute('data-inverted'));
      // The hero's ball: bright base, glint up-left, faint rim shade
      const g = ctx.createRadialGradient(ball.x - R * 0.15, ball.y - R * 0.2, 0, ball.x - R * 0.15, ball.y - R * 0.2, R * 1.3);
      if (dk) { if (form) { g.addColorStop(0, '#424242'); g.addColorStop(0.6, '#2e2e2e'); g.addColorStop(1, '#1e1e1e'); } else { g.addColorStop(0, '#3a3a3a'); g.addColorStop(0.6, '#262626'); g.addColorStop(1, '#161616'); } } else if (form) { g.addColorStop(0, '#f5f5f5'); g.addColorStop(0.6, '#ececec'); g.addColorStop(1, '#dadada'); } else { g.addColorStop(0, '#fdfdfd'); g.addColorStop(0.6, '#f4f4f4'); g.addColorStop(1, '#e2e2e2'); }
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ball.x, ball.y, R, 0, Math.PI * 2); ctx.fill();
      const sg = ctx.createRadialGradient(ball.x - R * 0.4, ball.y - R * 0.48, 0, ball.x - R * 0.4, ball.y - R * 0.48, R * 0.7);
      sg.addColorStop(0, dk ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.85)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(ball.x, ball.y, R, 0, Math.PI * 2); ctx.fill();
      // The sticker: for the form the Skip logo, for the 404 the black-and-white
      // critter — laid on the ball's surface, turning with it
      if (form) {
        stickerOnSphere(dk);
      } else {
      // (the critter), no background, laid on the
      // ball's surface — it turns with the ball, so it often faces away
      const cols = CRITTER[0].length, rows = CRITTER.length, pp = 1.05 / cols;
      // One on each side of the ball (the second faces the opposite way)
      for (const side of [1, -1]) {
      const toScreen = (a: number, b: number) => {
        const l = Math.hypot(a, b, 1), v = [side * a / l, b / l, side / l];
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
        ctx.fillStyle = dark ? (c === 'W' ? '#f2f2f2' : c === 'G' ? '#8c8c8c' : '#161616') : (c === 'W' ? '#161616' : c === 'G' ? '#8c8c8c' : '#f6f6f6');
        ctx.globalAlpha = Math.min(1, (mid[2] - 0.1) * 4);
        ctx.beginPath();
        pts.forEach((q, k) => { const X = ball.x + q[0] * R, Y = ball.y + q[1] * R; k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
        ctx.closePath(); ctx.fill();
      }));
      ctx.globalAlpha = 1;
      }
      }
    };

    let raf = 0;
    const loop = () => { step(); step(); draw(); raf = requestAnimationFrame(loop); };
    layout(); serve(); loop();

    const set = (side: 0 | 1, up: boolean) => { flip[side].up = up; };
    const key = (up: boolean) => (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.('input, textarea, [contenteditable]')) return;
      if (e.key === 'ArrowLeft' || e.key === 'z' || e.key === 'Shift') set(0, up);
      if (e.key === 'ArrowRight' || e.key === '/' || e.key === 'm') set(1, up);
    };
    const kd = key(true), ku = key(false);
    const pd = (e: PointerEvent) => set(e.clientX < cv.getBoundingClientRect().width / 2 ? 0 : 1, true);
    const pu = () => { set(0, false); set(1, false); };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    if (!form) cv.addEventListener('pointerdown', pd);
    // In the form a press on the empty background (a click or a tap, phones
    // too) lifts the flipper on that side and nudges the ball, so it never sticks
    const host = cv.parentElement;
    const hostDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('a, button, input, textarea, select, label, [role=button]')) return;
      set(e.clientX < cv.getBoundingClientRect().width / 2 ? 0 : 1, true);
      // On the ball itself: it springs away from the finger; elsewhere a gentle nudge
      const box = cv.getBoundingClientRect();
      const px = (e.clientX - box.left) * (W / box.width), py = (e.clientY - box.top) * (H / box.height);
      const dx = ball.x - px, dy = ball.y - py, d = Math.hypot(dx, dy);
      if (d < R * 1.8) {
        const nx = d ? dx / d : 0, ny = d ? dy / d : -1;
        ball.vx += nx * 7; ball.vy += ny * 7 - 2;
        play('tap', 60);
      } else {
        ball.vy -= 4 + Math.random() * 2; ball.vx += (Math.random() - 0.5) * 5;
      }
    };
    if (form) host?.addEventListener('pointerdown', hostDown);
    window.addEventListener('pointerup', pu);
    const onHandoff = (e: Event) => {
      const d = (e as CustomEvent).detail as { x: number; y: number; vy: number; vx: number };
      const box = cv.getBoundingClientRect();
      ball.x = Math.max(R, Math.min(W - R, (d.x - box.left) * (W / box.width)));
      ball.y = Math.max(R, (d.y - box.top) * (H / box.height));
      ball.vx = d.vx; ball.vy = Math.min(13, d.vy * (H / box.height));
      active = true; homeFallen = true;
    };
    const onFallen = () => { homeFallen = true; if (form && visible && !active) { serve(); active = true; } };
    const onReturn = () => { active = false; homeFallen = false; };
    if (form) { window.addEventListener('skip-ball-handoff', onHandoff); window.addEventListener('skip-ball-return', onReturn); window.addEventListener('skip-ball-fallen', onFallen); }
    window.addEventListener('resize', layout);
    // The card around the form can change height after the first layout (fonts, the keyboard): re-fit so the ball never stretches
    const ro = new ResizeObserver(() => layout());
    ro.observe(cv);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      window.removeEventListener('deviceorientation', onOrient); if (askTilt) document.removeEventListener('touchend', askTilt);
      cv.removeEventListener('pointerdown', pd); if (form) host?.removeEventListener('pointerdown', hostDown); window.removeEventListener('pointerup', pu);
      window.removeEventListener('skip-ball-handoff', onHandoff); window.removeEventListener('skip-ball-return', onReturn); window.removeEventListener('skip-ball-fallen', onFallen);
      window.removeEventListener('resize', layout); ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} data-form-pinball={form ? '' : undefined} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: form ? undefined : 'none', pointerEvents: form ? 'none' : undefined, zIndex: 0 }} />;
}
