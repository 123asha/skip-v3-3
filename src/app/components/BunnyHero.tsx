import { useEffect, useRef } from 'react';
import { COLS, ROWS, CELL } from './TetrisGame';

const P = 4;
const CW = COLS * CELL; // 640
const CH = ROWS * CELL; // 360
const GW = CW / P;      // 160
const GH = CH / P;      // 90

const BG  = '#f6f6f6';
const C1  = '#1a1a1a';
const C2  = '#888888';
const C3  = '#cccccc';
const C4  = '#dedad5';

type Spr = number[][];
type Map = Record<number, string>;

const BUNNY: Spr = [
  [0,0,1,0,0,0,0,1,0,0],
  [0,0,1,2,0,0,2,1,0,0],
  [0,0,1,2,0,0,2,1,0,0],
  [0,1,1,1,0,0,1,1,1,0],
  [0,1,1,1,1,1,1,1,1,0],
  [1,1,1,3,1,1,3,1,1,1],
  [1,1,1,1,1,1,1,1,1,1],
  [1,1,2,1,1,1,1,2,1,1],
  [0,1,1,1,2,2,1,1,1,0],
  [0,1,1,1,1,1,1,1,1,0],
  [0,0,1,1,0,0,1,1,0,0],
  [0,0,1,1,0,0,1,1,0,0],
];
const BMAP: Map = { 1: C1, 2: C2, 3: BG };
const W_UP: Spr = [[0,1,1,0],[1,1,1,1],[0,1,1,0]];
const W_DN: Spr = [[0,0,1,0],[0,1,1,1],[1,1,0,0]];
const WMAP: Map = { 1: C2 };

const CARROT: Spr = [
  [0,0,1,1,0,0],
  [0,1,1,1,1,0],
  [0,1,1,1,1,0],
  [1,1,1,1,1,1],
  [1,1,1,1,1,1],
  [0,1,1,1,1,0],
  [0,0,1,1,0,0],
  [0,0,2,2,0,0],
  [0,2,2,2,2,0],
  [2,2,0,0,2,2],
];
const CMAP: Map = { 1: C1, 2: C2 };

const SKULL: Spr = [
  [0,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1],
  [1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1],
  [1,1,1,2,2,1,1,1],
  [0,1,2,1,1,2,1,0],
  [0,1,1,1,1,1,1,0],
  [0,0,1,0,0,1,0,0],
];
const SMAP: Map = { 1: C1, 2: BG };

const bgItems = [
  { x:14,  y:7,  type:'cloud', s:1.5, v:0 },
  { x:92,  y:14, type:'cloud', s:1.0, v:1 },
  { x:46,  y:52, type:'hill',  s:1.2, v:0 },
  { x:132, y:8,  type:'cloud', s:1.3, v:2 },
  { x:8,   y:42, type:'hill',  s:1.0, v:0 },
  { x:102, y:60, type:'hill',  s:0.9, v:0 },
];
const mgItems = [
  { x:22, s:1.0 }, { x:70, s:0.8 }, { x:115, s:1.1 },
  { x:150, s:0.85 }, { x:44, s:0.7 },
];

export default function BunnyHero({ activeSection }: { activeSection: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef(activeSection);

  useEffect(() => { sectionRef.current = activeSection; }, [activeSection]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = CW * dpr;
    canvas.height = CH * dpr;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;

    function drawSprite(spr: Spr, ox: number, oy: number, map: Map, flipX = false) {
      spr.forEach((row, ry) => {
        row.forEach((v, rx) => {
          if (!v) return;
          const dx = flipX ? row.length - 1 - rx : rx;
          ctx.fillStyle = map[v];
          ctx.fillRect((Math.round(ox) + dx) * P, (Math.round(oy) + ry) * P, P, P);
        });
      });
    }

    function drawCloud(x: number, y: number, s: number, v = 0) {
      ctx.fillStyle = C4;
      const shapes: number[][][] = [
        [[0,0,7,2],[2,-3,9,4],[9,0,6,2]],
        [[0,1,4,2],[1,-2,5,3],[4,0,3,2]],
        [[-1,0,8,2],[2,-4,11,5],[10,0,5,2]],
      ];
      shapes[v].forEach(([dx,dy,w,h]) => {
        ctx.fillRect((x+dx*s)*P, (y+dy*s)*P, w*s*P, h*s*P);
      });
    }
    function drawHill(x: number, y: number, s: number) {
      ctx.fillStyle = C4;
      for (let i = 0; i < 8; i++) {
        const h = Math.round((4 - Math.abs(i - 3.5) * 0.9) * s);
        ctx.fillRect((x + i * s) * P, y * P, s * P, h * P);
      }
    }
    function drawFloatBush(x: number, y: number, s: number) {
      ctx.fillStyle = C4;
      ([[0,0,4,2],[1,-2,5,2],[2,-3,3,2]] as number[][]).forEach(([dx,dy,w,h]) => {
        ctx.fillRect((x+dx*s)*P, (y+dy*s)*P, w*s*P, h*s*P);
      });
    }

    function drawBg(bgOff: number, mgOff: number) {
      bgItems.forEach(item => {
        const x = ((item.x - bgOff * 0.12) % GW + GW) % GW;
        const v = (item as any).v ?? 0;
        if (item.type === 'cloud') drawCloud(x, item.y, item.s, v);
        else drawHill(x, item.y, item.s);
        if (x > GW - 26) {
          if (item.type === 'cloud') drawCloud(x - GW, item.y, item.s, v);
          else drawHill(x - GW, item.y, item.s);
        }
      });
      mgItems.forEach((item, idx) => {
        const x = ((item.x - mgOff * 0.38) % (GW + 20) + GW + 20) % (GW + 20) - 10;
        const y = 8 + idx * 16;
        drawFloatBush(x, y, item.s);
      });
    }

    let frame = 0, score = 0;
    let bgOff = 0, mgOff = 0;
    let rafId = 0, running = true;
    const keys = new Set<string>();
    let pointerDown = false;
    let physicsActive = false;
    let knockbackX = 0;
    let wasHolding = false;
    let prevSection = -1;
    // Interaction: O mouth on hover over clickables, eye-direction toward nearby links
    let mouthO = false;
    let eyeTargetX = 0;
    let eyeTargetY = 0;
    let eyeX = 0;
    let eyeY = 0;

    type Carrot   = { px: number; py: number; vx: number; vy: number; attracted: boolean };
    type Obstacle = { px: number; py: number; vx: number; vy: number };
    type Spark    = { px: number; py: number; ox: number; oy: number; t: number; life: number };

    let carrots: Carrot[]   = [];
    let obstacles: Obstacle[] = [];
    let sparks: Spark[]     = [];

    const B = { py: GH / 2 - 6, vy: 0, tilt: 0, wt: 0, flapping: false };
    let bunnyDrawX = GW / 2 - 5;

    function spawnSpark(px: number, py: number) {
      [[-1,-1],[1,-1],[-1,1],[1,1],[0,-2],[0,2],[-2,0],[2,0]].forEach(([ox,oy]) => {
        sparks.push({ px, py, ox, oy, t: 0, life: 10 });
      });
    }

    function drawMagnetLines(bx: number, by: number) {
      ctx.save();
      ctx.strokeStyle = C1; ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
      carrots.forEach(c => {
        if (!c.attracted) return;
        if (Math.hypot(bx - c.px, by - c.py) > 3) {
          ctx.globalAlpha = 0.11;
          ctx.beginPath();
          ctx.moveTo((c.px + 3) * P, (c.py + 5) * P);
          ctx.lineTo(bx * P, by * P);
          ctx.stroke();
        }
      });
      ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.restore();
    }

    function drawBunny() {
      B.wt += 0.22;
      const wUp = B.flapping || Math.sin(B.wt) > 0;
      const wing = wUp ? W_UP : W_DN;
      ctx.save();
      const cx = (bunnyDrawX + 5) * P;
      const cy = (B.py + 6) * P;
      ctx.translate(cx, cy);
      const tTilt = B.vy * 0.045;
      B.tilt += (tTilt - B.tilt) * 0.10;
      ctx.rotate(B.tilt);
      ctx.translate(-cx, -cy);
      drawSprite(wing, bunnyDrawX - 3, B.py + 3, WMAP, false);
      drawSprite(wing, bunnyDrawX + 10, B.py + 3, WMAP, true);
      drawSprite(BUNNY, bunnyDrawX, B.py, BMAP, false);

      // Smooth-track eye direction first so we can use the offsets for both
      // the normal and the surprised eye renders below.
      eyeX += (eyeTargetX - eyeX) * 0.20;
      eyeY += (eyeTargetY - eyeY) * 0.20;
      const offX = Math.round(eyeX * (P * 0.5));
      const offY = Math.round(eyeY * (P * 0.5));

      if (mouthO) {
        // ── SURPRISE expression (over links/clickables): wide eyes + big round mouth ──

        // Mouth: 2 cells × 2 cells (8×8 px) outer ring with 6×6 hollow center
        ctx.fillStyle = C1;
        ctx.fillRect((bunnyDrawX + 4) * P, (B.py + 8) * P, 2 * P, 2 * P);
        const mx = (bunnyDrawX + 4) * P;
        const my = (B.py + 8) * P;
        ctx.fillStyle = C2;
        ctx.fillRect(mx, my, 2 * P, 2 * P);
        ctx.fillStyle = BG;
        ctx.fillRect(mx + 1, my + 1, 2 * P - 2, 2 * P - 2);

        // Wide-open eyes: 1 cell wide × 2 cells tall (overrides the original 1×1)
        ctx.fillStyle = C1;
        ctx.fillRect((bunnyDrawX + 3) * P, (B.py + 5) * P, P, P);
        ctx.fillRect((bunnyDrawX + 6) * P, (B.py + 5) * P, P, P);
        ctx.fillStyle = BG;
        ctx.fillRect((bunnyDrawX + 3) * P + offX, (B.py + 5) * P + offY, P, 2 * P);
        ctx.fillRect((bunnyDrawX + 6) * P + offX, (B.py + 5) * P + offY, P, 2 * P);
      } else if (offX !== 0 || offY !== 0) {
        // Normal eyes — only shifted in the link's direction
        ctx.fillStyle = C1;
        ctx.fillRect((bunnyDrawX + 3) * P, (B.py + 5) * P, P, P);
        ctx.fillRect((bunnyDrawX + 6) * P, (B.py + 5) * P, P, P);
        ctx.fillStyle = BG;
        ctx.fillRect((bunnyDrawX + 3) * P + offX, (B.py + 5) * P + offY, P, P);
        ctx.fillRect((bunnyDrawX + 6) * P + offX, (B.py + 5) * P + offY, P, P);
      }

      ctx.restore();
    }

    function loop() {
      if (!running) return;
      const section = sectionRef.current;
      frame++;

      if (section < 1 && prevSection >= 1) {
        carrots = []; obstacles = []; sparks = []; score = 0;
      }
      prevSection = section;

      const spd = (1 + Math.floor(score / 8) * 0.08) * (section >= 2 ? 1.7 : 1);

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, CW, CH);

      if (section >= 0) {
        bgOff += spd; mgOff += spd;
      }
      drawBg(bgOff, mgOff);

      const holding = keys.has(' ') || keys.has('ArrowUp') || pointerDown;
      B.flapping = holding;

      if (section >= 0) {
        if (!physicsActive) {
          physicsActive = true;
          B.py = GH / 2 - 6; B.vy = 0;
          bunnyDrawX = 30;
        }
        if (holding && !wasHolding) {
          B.vy -= 0.80;
        } else if (holding) {
          B.vy -= 0.18;
        }
        wasHolding = holding;
        B.vy += 0.16;
        B.vy *= 0.985;
        B.vy = Math.max(-4.5, Math.min(B.vy, 4));
        B.py += B.vy;
        if (B.py < 0)          { B.py = 0;        B.vy *= 0.5; }
        if (B.py > GH - 14)    { B.py = GH - 14;  B.vy *= 0.5; }
        knockbackX *= 0.82;
        bunnyDrawX += knockbackX;
        bunnyDrawX += ((holding ? 33 : 28) - bunnyDrawX) * 0.07;
      } else {
        physicsActive = false;
        wasHolding = false;
        knockbackX = 0;
        B.py = GH / 2 - 6 + Math.sin(frame * 0.04) * 1.5;
        B.vy = 0; B.tilt = 0;
        bunnyDrawX = GW / 2 - 5;
      }

      const bx = bunnyDrawX + 5;
      const by = B.py + 6;

      if (section >= 2) drawMagnetLines(bx, by);
      drawBunny();

      if (section >= 1) {
        const cGap = Math.max(45, 80 - Math.floor(score / 5) * 3);
        const oGap = Math.max(65, 110 - Math.floor(score / 5) * 4);
        if (frame % cGap === 0) carrots.push({
          px: GW + 4, py: 2 + Math.random() * (GH - 14),
          vx: -(0.5 + Math.random() * 0.4), vy: (Math.random() - 0.5) * 0.3, attracted: false,
        });
        if (frame % oGap === 0) obstacles.push({
          px: GW + 4, py: 4 + Math.random() * (GH - 12),
          vx: -(0.45 + Math.random() * 0.3), vy: (Math.random() - 0.5) * 0.25,
        });
      }

      carrots = carrots.filter(c => {
        const dx = bx - c.px, dy = by - c.py, dist = Math.hypot(dx, dy);
        if (section >= 2 && dist < 30) {
          c.attracted = true;
          c.px += (bx - c.px) * 0.09;
          c.py += (by - c.py) * 0.09;
        } else {
          c.px += c.vx; c.py += c.vy;
        }
        if (dist < 4) { spawnSpark(Math.round(c.px+3), Math.round(c.py+5)); score++; return false; }
        if (c.px < -8) return false;
        drawSprite(CARROT, Math.round(c.px), Math.round(c.py), CMAP);
        return true;
      });

      obstacles = obstacles.filter(o => {
        const dx = bx - o.px, dy = by - o.py, dist = Math.hypot(dx, dy);
        if (section === 1 && dist < 9 && dist > 0.1) {
          B.vy -= (dy / dist) * 3.5;
          B.vy = Math.max(-4.5, Math.min(B.vy, 4));
          knockbackX -= 6;
        }
        if (section >= 2 && dist < 32 && dist > 0.5) {
          const f = 0.06 * (1 - dist / 32);
          o.vx -= (dx / dist) * f * 8;
          o.vy -= (dy / dist) * f * 8;
        }
        o.vx = Math.max(o.vx, -2.5);
        o.px += o.vx; o.py += o.vy;
        if (o.py < 0)       { o.py = 0;       o.vy *= -0.6; }
        if (o.py > GH - 10) { o.py = GH - 10; o.vy *= -0.6; }
        if (o.px < -10) return false;
        drawSprite(SKULL, Math.round(o.px), Math.round(o.py), SMAP);
        return true;
      });

      sparks = sparks.filter(s => {
        s.t++; s.life--;
        if (s.life <= 0) return false;
        ctx.globalAlpha = s.life / 10;
        ctx.fillStyle = C1;
        ctx.fillRect((s.px + s.ox * s.t * 0.35) * P, (s.py + s.oy * s.t * 0.35) * P, P, P);
        ctx.globalAlpha = 1;
        return true;
      });

      if (section >= 1 && score > 0) {
        ctx.font = `400 15px "CoFo Sans VF Trial", system-ui, sans-serif`;
        ctx.textAlign = 'right'; ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(35,31,32,0.35)';
        ctx.fillText(`${score}`, CW - 14, 14);
      }

      rafId = requestAnimationFrame(loop);
    }

    const onKeyDown = (e: KeyboardEvent) => keys.add(e.key);
    const onKeyUp   = (e: KeyboardEvent) => keys.delete(e.key);
    const onPtrDown = () => { pointerDown = true; };
    const onPtrUp   = () => { pointerDown = false; };

    const PROXIMITY = 40; // px
    const onMouseMove = (e: MouseEvent) => {
      const cnv = canvasRef.current;
      if (!cnv) { mouthO = false; eyeTargetX = 0; eyeTargetY = 0; return; }

      // 1. Is the mouse OVER a clickable? (anchor, button, cursor:pointer)
      const hit = document.elementFromPoint(e.clientX, e.clientY) as Element | null;
      let onClickable = false;
      let node: Element | null = hit;
      while (node && node !== document.body) {
        const tag = node.tagName.toLowerCase();
        if (tag === 'a' || tag === 'button') { onClickable = true; break; }
        try {
          const cs = window.getComputedStyle(node);
          if (cs.cursor === 'pointer') { onClickable = true; break; }
        } catch {}
        node = node.parentElement;
      }
      mouthO = onClickable;

      // 2. Find nearest link within PROXIMITY of the mouse
      const candidates = document.querySelectorAll('a, button, [role="button"]');
      let closest: { cx: number; cy: number; d: number } | null = null;
      candidates.forEach(link => {
        const r = link.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return;
        const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
        const dy = Math.max(r.top  - e.clientY, 0, e.clientY - r.bottom);
        const d  = Math.hypot(dx, dy);
        if (d < PROXIMITY && (!closest || d < closest.d)) {
          closest = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, d };
        }
      });

      if (closest) {
        // Direction from bunny screen-position to link
        const rect = cnv.getBoundingClientRect();
        const sX = rect.width / CW;
        const sY = rect.height / CH;
        const bunnyScreenX = rect.left + (bunnyDrawX + 5) * P * sX;
        const bunnyScreenY = rect.top  + (B.py + 6) * P * sY;
        const dx = (closest as { cx: number; cy: number; d: number }).cx - bunnyScreenX;
        const dy = (closest as { cx: number; cy: number; d: number }).cy - bunnyScreenY;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
          eyeTargetX = dx / dist;
          eyeTargetY = dy / dist;
        }
      } else {
        eyeTargetX = 0;
        eyeTargetY = 0;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    canvas.addEventListener('pointerdown', onPtrDown);
    window.addEventListener('pointerup',   onPtrUp);

    loop();

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('pointerdown', onPtrDown);
      window.removeEventListener('pointerup',   onPtrUp);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />;
}
