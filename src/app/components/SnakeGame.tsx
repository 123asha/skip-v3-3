import { useEffect, useRef } from 'react';

const COLS = 16;
const ROWS = 9;
const CELL = 45;   // 16×45=720, 9×45=405 — exactly matches panel
const R    = 16;   // ball radius: (CELL/2 − R) ≈ 6.5px gap from cell edge
const R_FOOD = 9;  // food is smaller
const INIT_LEN = 10;
const SPEED = 250;
const BG = '#f6f6f6';

type Dir = 'U' | 'D' | 'L' | 'R';
const DELTA: Record<Dir, [number, number]> = { U: [0,-1], D: [0,1], L: [-1,0], R: [1,0] };
const OPP:   Record<Dir, Dir>             = { U:'D', D:'U', L:'R', R:'L' };
const CW:    Record<Dir, Dir>             = { R:'D', D:'L', L:'U', U:'R' };
const CCW:   Record<Dir, Dir>             = { R:'U', U:'L', L:'D', D:'R' };

type Pt = { x: number; y: number };

function makeSnake(): Pt[] {
  const row = Math.floor(ROWS / 2);
  const startX = Math.min(INIT_LEN - 1, COLS - 2);
  return Array.from({ length: INIT_LEN }, (_, i) => ({ x: startX - i, y: row }));
}

function spawnFood(snake: Pt[]): Pt {
  const occ = new Set(snake.map(s => `${s.x},${s.y}`));
  let x: number, y: number;
  do {
    x = Math.floor(Math.random() * COLS);
    y = Math.floor(Math.random() * ROWS);
  } while (occ.has(`${x},${y}`));
  return { x, y };
}

function nextDir(snake: Pt[], dir: Dir): Dir {
  const head = snake[0];
  const occ = new Set(snake.slice(0, -1).map(s => `${s.x},${s.y}`));

  const safe = (d: Dir) => {
    const [dx, dy] = DELTA[d];
    const nx = head.x + dx, ny = head.y + dy;
    return nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !occ.has(`${nx},${ny}`);
  };

  if (safe(dir))      return dir;
  if (safe(CW[dir]))  return CW[dir];
  if (safe(CCW[dir])) return CCW[dir];
  return OPP[dir];
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number, alpha: number,
) {
  const g = ctx.createRadialGradient(
    cx - r * 0.32, cy - r * 0.32, r * 0.04,
    cx + r * 0.05, cy + r * 0.05, r,
  );
  g.addColorStop(0,    `rgba(255, 253, 244, ${alpha})`);
  g.addColorStop(0.18, `rgba(243, 238, 222, ${alpha})`);
  g.addColorStop(0.55, `rgba(226, 219, 199, ${alpha})`);
  g.addColorStop(1,    `rgba(198, 190, 168, ${alpha})`);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = COLS * CELL * dpr;
    canvas.height = ROWS * CELL * dpr;
    ctx.scale(dpr, dpr);

    let snake = makeSnake();
    let dir: Dir = 'R';
    let food: Pt = spawnFood(snake);
    let running = true;
    let raf: number;
    let lastTime = 0;
    let userDir: Dir | null = null;

    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R',
      };
      const d = map[e.key];
      if (!d) return;
      e.preventDefault();
      userDir = d;
    };
    window.addEventListener('keydown', onKey);

    function reset() {
      snake = makeSnake();
      dir   = 'R';
      food  = spawnFood(snake);
      userDir = null;
    }

    function step() {
      if (userDir && userDir !== OPP[dir]) {
        dir = userDir;
      } else {
        dir = nextDir(snake, dir);
      }
      userDir = null;
      const head = snake[0];
      const [dx, dy] = DELTA[dir];
      const nx = head.x + dx, ny = head.y + dy;

      if (
        nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS ||
        snake.some(s => s.x === nx && s.y === ny)
      ) {
        reset();
        return;
      }

      const ate = nx === food.x && ny === food.y;
      snake.unshift({ x: nx, y: ny });

      if (ate) {
        // eating shrinks: remove 2 from tail instead of 1
        snake.pop();
        if (snake.length > 1) snake.pop();
        food = spawnFood(snake);
      } else {
        snake.pop();
      }

      if (snake.length <= 2) {
        reset();
      }
    }

    function draw() {
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

      // Food
      drawBall(
        ctx,
        food.x * CELL + CELL / 2,
        food.y * CELL + CELL / 2,
        R_FOOD, 0.7,
      );

      // Snake body — head fully opaque, tail fades
      snake.forEach((seg, i) => {
        const alpha = 1 - (i / snake.length) * 0.45;
        drawBall(
          ctx,
          seg.x * CELL + CELL / 2,
          seg.y * CELL + CELL / 2,
          R, alpha,
        );
      });
    }

    function loop(time: number) {
      if (!running) return;
      if (time - lastTime > SPEED) { step(); lastTime = time; }
      draw();
      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
