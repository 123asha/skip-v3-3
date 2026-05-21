import { useEffect, useRef } from 'react';

const COLS = 16;
const ROWS = 9;
const CELL = 40;
const W = COLS * CELL;
const H = ROWS * CELL;

const BRICK_R = 13;
const BRICK_ROWS = 4;
const PAD_W = 90;
const PAD_H = 12;
const PAD_R = PAD_H / 2;
const PAD_SPEED = 9;
const BALL_R = 7;
const BG = '#f6f6f6';
const FONT = `400 ${CELL * 0.38}px "CoFo Sans VF Trial", system-ui, sans-serif`;
const FONT_SM = `400 ${CELL * 0.28}px "CoFo Sans VF Trial", system-ui, sans-serif`;

export default function BreakoutGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const DRAMA = [
      [0, 1,1,0, 1,1,0, 0,1,0, 1,0,1, 0,1,0],
      [0, 1,0,1, 1,1,1, 1,0,1, 1,1,1, 1,0,1],
      [0, 1,0,1, 1,1,0, 1,1,1, 1,0,1, 1,1,1],
      [0, 1,1,0, 1,0,1, 1,0,1, 1,0,1, 1,0,1],
    ];
    const makeBricks = () =>
      Array.from({ length: BRICK_ROWS }, (_, r) =>
        Array.from({ length: COLS }, (_, c) => ({
          cx: c * CELL + CELL / 2, cy: 24 + r * CELL + CELL / 2,
          alive: DRAMA[r][c] === 1,
        }))
      );

    let bricks = makeBricks();
    let padX = W / 2 - PAD_W / 2;
    let ballX = W / 2, ballY = H - 90;
    let vx = 3.2, vy = -4;
    let score = 0;
    let lives = 3;
    let gameOver = false;
    let raf: number, running = true;
    const keys = new Set<string>();

    function reset() {
      bricks = makeBricks();
      padX = W / 2 - PAD_W / 2;
      ballX = W / 2; ballY = H - 90;
      vx = 3.2; vy = -4;
      score = 0; lives = 3; gameOver = false;
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      padX = Math.max(0, Math.min(W - PAD_W, (e.clientX - rect.left) * (W / rect.width) - PAD_W / 2));
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.preventDefault();
      keys.add(e.key);
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key);

    canvas.addEventListener('mousemove', onMove);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);

    function sphere(cx: number, cy: number, r: number) {
      const grad = ctx.createRadialGradient(cx - r * 0.28, cy - r * 0.28, 0, cx, cy, r);
      grad.addColorStop(0, 'rgba(68,64,58,1)');
      grad.addColorStop(1, 'rgba(22,19,18,1)');
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = grad; ctx.fill();
    }

    function roundRect(x: number, y: number, w: number, h: number, r: number) {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
    }

    function draw() {
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      for (const row of bricks)
        for (const b of row)
          if (b.alive) sphere(b.cx, b.cy, BRICK_R);

      const padY = H - PAD_H - 14;
      roundRect(padX, padY, PAD_W, PAD_H, PAD_R);
      ctx.fillStyle = 'rgba(35,31,32,0.85)'; ctx.fill();

      sphere(ballX, ballY, BALL_R);

      // lives — small dots
      ctx.fillStyle = 'rgba(35,31,32,0.18)';
      for (let l = 0; l < lives; l++) {
        ctx.beginPath();
        ctx.arc(16 + l * 14, 20, 4, 0, Math.PI * 2);
        ctx.fill();
      }

    }

    function update() {
      if (gameOver) return;
      if (keys.has('ArrowLeft'))  padX = Math.max(0, padX - PAD_SPEED);
      if (keys.has('ArrowRight')) padX = Math.min(W - PAD_W, padX + PAD_SPEED);

      ballX += vx; ballY += vy;

      if (ballX - BALL_R < 0)  { ballX = BALL_R; vx = Math.abs(vx); }
      if (ballX + BALL_R > W)  { ballX = W - BALL_R; vx = -Math.abs(vx); }
      if (ballY - BALL_R < 0)  { ballY = BALL_R; vy = Math.abs(vy); }

      const padY = H - PAD_H - 14;
      if (ballY + BALL_R >= padY && ballY + BALL_R <= padY + PAD_H + BALL_R &&
          ballX >= padX - BALL_R && ballX <= padX + PAD_W + BALL_R) {
        vy = -Math.abs(vy);
        vx = ((ballX - (padX + PAD_W / 2)) / (PAD_W / 2)) * 5;
      }

      if (ballY > H + 20) {
        lives--;
        if (lives <= 0) { gameOver = true; setTimeout(reset, 600); return; }
        ballX = W / 2; ballY = H - 90;
        vx = (Math.random() - 0.5) * 6; vy = -4;
      }

      for (const row of bricks) {
        for (const b of row) {
          if (!b.alive) continue;
          const dx = ballX - b.cx, dy = ballY - b.cy;
          if (Math.sqrt(dx * dx + dy * dy) < BALL_R + BRICK_R) {
            b.alive = false; score += 10;
            const a = Math.atan2(dy, dx), dot = vx * Math.cos(a) + vy * Math.sin(a);
            vx -= 2 * dot * Math.cos(a); vy -= 2 * dot * Math.sin(a);
          }
        }
      }

      if (bricks.flat().every(b => !b.alive)) { bricks = makeBricks(); }
    }

    function loop() {
      if (!running) return;
      update(); draw();
      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);
    return () => {
      running = false; cancelAnimationFrame(raf);
      canvas.removeEventListener('mousemove', onMove);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />;
}
