import { useEffect, useRef } from 'react';

const P = 5;

const BUNNY: number[][] = [
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
// White palette — no blend mode, drop-shadow outline handles contrast on any bg.
// 3 (eye holes) intentionally omitted → transparent pixels on canvas.
const BMAP: Record<number, string> = { 1: '#ffffff', 2: '#cccccc' };
const W_UP: number[][] = [[0,1,1,0],[1,1,1,1],[0,1,1,0]];
const W_DN: number[][] = [[0,0,1,0],[0,1,1,1],[1,1,0,0]];
const WMAP: Record<number, string> = { 1: '#bbbbbb' };

// Canvas: bunny 10 cols + 3-col wing on each side + margins → 20 cols × 18 rows
const CW = 20 * P; // 100px
const CH = 18 * P; // 90px

// Bunny x-offset inside canvas (leaves 5 cols for left wing + margin)
const BX = 5;

export default function BunnyFollower() {
  const divRef    = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pos = useRef({ x: -999, y: -999 });
  const tgt = useRef({ x: -999, y: -999 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;
    const dpr    = window.devicePixelRatio || 1;
    canvas.width  = CW * dpr;
    canvas.height = CH * dpr;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;

    function drawSprite(
      spr: number[][], ox: number, oy: number,
      map: Record<number, string>, flipX = false,
    ) {
      spr.forEach((row, ry) => {
        row.forEach((v, rx) => {
          if (!v || !map[v]) return;
          const dx = flipX ? row.length - 1 - rx : rx;
          ctx.fillStyle = map[v];
          ctx.fillRect((ox + dx) * P, (oy + ry) * P, P, P);
        });
      });
    }

    let frame = 0, wt = 0;
    let rafId: number;
    let running = true;

    function loop() {
      if (!running) return;
      frame++;
      wt += 0.18;

      // Spring toward mouse target
      pos.current.x += (tgt.current.x - pos.current.x) * 0.12;
      pos.current.y += (tgt.current.y - pos.current.y) * 0.12;

      // Position div so cursor appears at bunny's center-top
      if (divRef.current) {
        divRef.current.style.transform =
          `translate(${((pos.current.x - CW / 2) | 0)}px, ${((pos.current.y - 22) | 0)}px)`;
      }

      // Gentle vertical bob
      const py = 1 + Math.sin(frame * 0.055) * 1.4;

      // Tilt proportional to vertical velocity
      const velY = (tgt.current.y - pos.current.y) * 0.05;
      const tilt  = Math.max(-0.28, Math.min(0.28, velY * 0.06));

      ctx.clearRect(0, 0, CW, CH);

      ctx.save();
      const pivX = (BX + 5) * P;
      const pivY = (py + 6) * P;
      ctx.translate(pivX, pivY);
      ctx.rotate(tilt);
      ctx.translate(-pivX, -pivY);

      const wUp = Math.sin(wt) > 0;
      drawSprite(wUp ? W_UP : W_DN, BX - 3, py + 3, WMAP, false);
      drawSprite(wUp ? W_UP : W_DN, BX + 10, py + 3, WMAP, true);
      drawSprite(BUNNY, BX, py, BMAP, false);

      ctx.restore();

      rafId = requestAnimationFrame(loop);
    }

    const onMove = (e: MouseEvent) => {
      if (pos.current.x === -999) pos.current = { x: e.clientX, y: e.clientY };
      tgt.current = { x: e.clientX, y: e.clientY };

      // Detect purple background (#8382fc = rgb(131,130,252)) under cursor.
      // pointerEvents:none on the div means elementFromPoint returns the element behind it.
      const el = document.elementFromPoint(e.clientX, e.clientY);
      let node: Element | null = el;
      let onPurple = false;
      while (node && node !== document.body) {
        if (window.getComputedStyle(node).backgroundColor.includes('131, 130, 252')) {
          onPurple = true;
          break;
        }
        node = node.parentElement;
      }
      if (divRef.current) {
        (divRef.current.style as any).mixBlendMode = onPurple ? 'normal' : 'difference';
      }
    };

    window.addEventListener('mousemove', onMove);
    loop();

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <div
      ref={divRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9991,
        willChange: 'transform',
        transform: 'translate(-999px, -999px)',
        mixBlendMode: 'difference',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: CW,
          height: CH,
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}
