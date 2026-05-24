import { useEffect, useRef } from 'react';

const CELL     = 28;   // grid cell size px
const R        = 5;    // snake segment radius
const INIT_LEN = 6;
const SPEED    = 220;  // ms per step
const BG       = '#f6f6f6';
const SNAKE_COLOR = 'rgba(35, 31, 32,';  // --c-text base, alpha appended

type Dir = 'U' | 'D' | 'L' | 'R';
const DELTA: Record<Dir, [number, number]> = { U:[0,-1], D:[0,1], L:[-1,0], R:[1,0] };
const OPP:   Record<Dir, Dir>              = { U:'D', D:'U', L:'R', R:'L' };
const CW:    Record<Dir, Dir>              = { R:'D', D:'L', L:'U', U:'R' };
const CCW:   Record<Dir, Dir>              = { R:'U', U:'L', L:'D', D:'R' };

type Pt = { x: number; y: number };

function makeSnake(cols: number, rows: number): Pt[] {
  const row = Math.floor(rows / 2);
  const startX = Math.min(INIT_LEN - 1, cols - 2);
  return Array.from({ length: INIT_LEN }, (_, i) => ({ x: startX - i, y: row }));
}

function spawnFood(snake: Pt[], cols: number, rows: number): Pt {
  const occ = new Set(snake.map(s => `${s.x},${s.y}`));
  let x: number, y: number;
  do {
    x = Math.floor(Math.random() * cols);
    y = Math.floor(Math.random() * rows);
  } while (occ.has(`${x},${y}`));
  return { x, y };
}

function nextDir(snake: Pt[], dir: Dir, cols: number, rows: number): Dir {
  const head = snake[0];
  const occ = new Set(snake.slice(0, -1).map(s => `${s.x},${s.y}`));
  const safe = (d: Dir) => {
    const [dx, dy] = DELTA[d];
    const nx = head.x + dx, ny = head.y + dy;
    return nx >= 0 && nx < cols && ny >= 0 && ny < rows && !occ.has(`${nx},${ny}`);
  };
  if (safe(dir))      return dir;
  if (safe(CW[dir]))  return CW[dir];
  if (safe(CCW[dir])) return CCW[dir];
  return OPP[dir];
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;

    // Fit grid to container
    const W = canvas.offsetWidth  || 720;
    const H = canvas.offsetHeight || 405;
    const cols = Math.floor(W / CELL);
    const rows = Math.floor(H / CELL);

    canvas.width  = cols * CELL * dpr;
    canvas.height = rows * CELL * dpr;
    ctx.scale(dpr, dpr);

    let snake = makeSnake(cols, rows);
    let dir: Dir = 'R';
    let food: Pt = spawnFood(snake, cols, rows);
    let running = true;
    let raf: number;
    let lastTime = 0;
    let userDir: Dir | null = null;

    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = { ArrowUp:'U', ArrowDown:'D', ArrowLeft:'L', ArrowRight:'R' };
      const d = map[e.key];
      if (!d) return;
      e.preventDefault();
      userDir = d;
    };
    window.addEventListener('keydown', onKey);

    function reset() {
      snake = makeSnake(cols, rows);
      dir   = 'R';
      food  = spawnFood(snake, cols, rows);
      userDir = null;
    }

    function step() {
      if (userDir && userDir !== OPP[dir]) dir = userDir;
      else dir = nextDir(snake, dir, cols, rows);
      userDir = null;

      const [dx, dy] = DELTA[dir];
      const nx = snake[0].x + dx;
      const ny = snake[0].y + dy;

      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows || snake.some(s => s.x === nx && s.y === ny)) {
        reset(); return;
      }

      const ate = nx === food.x && ny === food.y;
      snake.unshift({ x: nx, y: ny });
      if (ate) {
        snake.pop();
        if (snake.length > 1) snake.pop();
        food = spawnFood(snake, cols, rows);
      } else {
        snake.pop();
      }
      if (snake.length <= 2) reset();
    }

    function draw() {
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, cols * CELL, rows * CELL);

      // Food — same radius as snake, outline only
      const fx = food.x * CELL + CELL / 2;
      const fy = food.y * CELL + CELL / 2;
      ctx.beginPath();
      ctx.arc(fx, fy, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(35, 31, 32, 0.85)';
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      // Snake — fully black circles
      snake.forEach((seg) => {
        ctx.beginPath();
        ctx.arc(seg.x * CELL + CELL / 2, seg.y * CELL + CELL / 2, R, 0, Math.PI * 2);
        ctx.fillStyle = `${SNAKE_COLOR} 1)`;
        ctx.fill();
      });
    }

    function loop(time: number) {
      if (!running) return;
      if (time - lastTime > SPEED) { step(); lastTime = time; }
      draw();
      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
