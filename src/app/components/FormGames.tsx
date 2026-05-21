import { useEffect, useRef } from 'react';

const FG     = '#231f20';
const FG_DIM = '#231f20';
const W = 260;
const H = 150;

// ── Snake: food = letters of "skip design", snake shrinks on eat ──────────────
const SCOLS = 16, SROWS = 10, SCELL = W / SCOLS;
const FOOD_CHARS = ['S', 'K', 'I', 'P', 'D', 'E', 'S', 'I', 'G', 'N'];
const INIT_SNAKE = [
  {x:8,y:5},{x:7,y:5},{x:6,y:5},{x:5,y:5},
  {x:4,y:5},{x:3,y:5},{x:2,y:5},{x:1,y:5},
];

export function FormSnakeGame({ active, onFinish }: { active?: boolean; onFinish?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    // Set up high-DPI canvas — measure container after layout so we never end up
    // with an upscaled, blurry result.
    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const displayW = rect.width || W;
      const displayH = displayW * H / W;
      canvas.width  = Math.round(displayW * dpr);
      canvas.height = Math.round(displayH * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(canvas.width / W, canvas.height / H);
      ctx.imageSmoothingEnabled = false;
    };
    setupCanvas();
    const ro = new ResizeObserver(setupCanvas);
    ro.observe(canvas);

    type Pt  = { x: number; y: number };
    type Dir = 'U' | 'D' | 'L' | 'R';
    const DELTA: Record<Dir,[number,number]> = { U:[0,-1], D:[0,1], L:[-1,0], R:[1,0] };
    const OPP:   Record<Dir, Dir>            = { U:'D', D:'U', L:'R', R:'L' };
    const ARROW: Record<Dir, string>         = { U:'↑', D:'↓', L:'←', R:'→' };

    let snake: Pt[]      = INIT_SNAKE.map(p => ({ ...p }));
    let food: Pt         = { x: 12, y: 3 };
    let dir: Dir         = 'R';
    let queueDir: Dir    = 'R';
    let foodCharIdx      = 0;
    let playerControlled = false;
    let done             = false;
    let paused           = false;
    let mouseOn          = false;

    const spawnFood = () => {
      const occ = new Set(snake.map(s => `${s.x},${s.y}`));
      let x: number, y: number;
      do {
        x = Math.floor(Math.random() * SCOLS);
        y = Math.floor(Math.random() * SROWS);
      } while (occ.has(`${x},${y}`));
      food = { x, y };
    };

    const isSafe = (d: Dir, head: Pt, occ: Set<string>) => {
      const [dx, dy] = DELTA[d];
      const nx = head.x + dx, ny = head.y + dy;
      return nx >= 0 && nx < SCOLS && ny >= 0 && ny < SROWS
        && !occ.has(`${nx},${ny}`) && d !== OPP[dir];
    };

    const tick = () => {
      if (done || paused) return;
      const head = snake[0];
      const occ  = new Set(snake.slice(0, -1).map(s => `${s.x},${s.y}`));

      // AI
      if (!playerControlled) {
        const dx = food.x - head.x, dy = food.y - head.y;
        const want: Dir[] = [];
        if (dx > 0) want.push('R'); else if (dx < 0) want.push('L');
        if (dy > 0) want.push('D'); else if (dy < 0) want.push('U');
        const safe = want.filter(d => isSafe(d, head, occ));
        if (safe.length) queueDir = safe[0];
        else {
          const fallback = (['R','D','L','U'] as Dir[]).filter(d => isSafe(d, head, occ));
          if (fallback.length) queueDir = fallback[0];
        }
      }

      dir = queueDir;
      const [dx, dy] = DELTA[dir];
      const nh = { x: head.x + dx, y: head.y + dy };

      if (nh.x < 0 || nh.x >= SCOLS || nh.y < 0 || nh.y >= SROWS || occ.has(`${nh.x},${nh.y}`)) {
        snake = INIT_SNAKE.map(p => ({ ...p }));
        dir = 'R'; queueDir = 'R'; foodCharIdx = 0;
        playerControlled = false;
        spawnFood();
        return;
      }

      snake.unshift(nh);

      if (nh.x === food.x && nh.y === food.y) {
        foodCharIdx = (foodCharIdx + 1) % FOOD_CHARS.length;
        snake.pop();
        if (snake.length > 1) snake.pop();
        spawnFood();
      } else {
        snake.pop();
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Grid dots — denser (2× per axis) and thinner for an aesthetic, crisp look
      ctx.fillStyle = FG_DIM;
      const DOT_DENSITY = 2;
      const DOT_COLS = SCOLS * DOT_DENSITY;
      const DOT_ROWS = SROWS * DOT_DENSITY;
      const DOT_DX = W / DOT_COLS;
      const DOT_DY = H / DOT_ROWS;
      for (let x = 0; x < DOT_COLS; x++) {
        for (let y = 0; y < DOT_ROWS; y++) {
          ctx.beginPath();
          ctx.arc(x * DOT_DX + DOT_DX / 2, y * DOT_DY + DOT_DY / 2, 0.25, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const fillCentered = (text: string, cx: number, cy: number) => {
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'alphabetic';
        const m  = ctx.measureText(text);
        const dy = (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
        ctx.fillText(text, cx, cy + dy);
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'alphabetic';
      };

      // Food — outlined circle with letter
      const fx = food.x * SCELL + SCELL / 2;
      const fy = food.y * SCELL + SCELL / 2;
      ctx.strokeStyle = FG;
      ctx.lineWidth   = 1.2;
      ctx.beginPath();
      ctx.arc(fx, fy, SCELL * 0.44, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = FG;
      ctx.font      = `700 ${Math.round(SCELL * 0.52)}px "CoFo Sans VF", system-ui, sans-serif`;
      fillCentered(FOOD_CHARS[foodCharIdx], fx, fy);

      // Snake segments — all same size
      snake.forEach((seg, i) => {
        ctx.fillStyle = FG;
        ctx.beginPath();
        const r  = SCELL * 0.34;
        const sx = seg.x * SCELL + SCELL / 2;
        const sy = seg.y * SCELL + SCELL / 2;
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();

        if (i === 0) {
          ctx.fillStyle = '#ffffff';
          ctx.font      = `${Math.round(SCELL * 0.45)}px system-ui, sans-serif`;
          fillCentered(ARROW[dir], sx, sy);
        }
      });
    };

    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp:'U', ArrowDown:'D', ArrowLeft:'L', ArrowRight:'R',
      };
      if (map[e.key]) {
        queueDir = map[e.key];
        playerControlled = true;
        // Only prevent scroll when mouse is over the game
        if (mouseOn) e.preventDefault();
      }
    };

    const onMouseEnter = () => { mouseOn = true; paused = false; };
    const onMouseLeave = () => { mouseOn = false; paused = true; };

    canvas.addEventListener('mouseenter', onMouseEnter);
    canvas.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('keydown', onKey);

    draw();
    const id = setInterval(() => { tick(); draw(); }, 185);
    return () => {
      clearInterval(id);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('mouseenter', onMouseEnter);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      ro.disconnect();
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 'auto', display: 'block', cursor: 'default' }}
      title="Arrow keys to play"
    />
  );
}

// ── Bunny Runner: tiny bunny catches carrots, super-light form game ──────────
export function FormBunnyGame({ active, onFinish }: { active?: boolean; onFinish?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current!;
    const dpr = window.devicePixelRatio || 1;
    const displayW = canvas.offsetWidth || W;
    const displayH = displayW * H / W;
    canvas.width  = Math.round(displayW * dpr);
    canvas.height = Math.round(displayH * dpr);
    const ctx = canvas.getContext('2d')!;
    ctx.scale(canvas.width / W, canvas.height / H);

    const GROUND_Y = H - 16;
    let bunnyX = 30;
    let bunnyY = GROUND_Y;
    let velY = 0;
    let onGround = true;
    type Carrot = { x: number; y: number };
    let carrots: Carrot[] = [];
    let score = 0;
    let frame = 0;
    let done = false;
    let paused = false;
    let mouseOn = false;
    const WIN_SCORE = 5;

    const drawBunny = (x: number, y: number) => {
      ctx.fillStyle = FG;
      // body
      ctx.fillRect(x, y - 10, 12, 10);
      // ears
      ctx.fillRect(x + 1, y - 16, 2, 6);
      ctx.fillRect(x + 8, y - 16, 2, 6);
      // tail
      ctx.fillRect(x - 2, y - 5, 2, 2);
      // eye
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 8, y - 8, 1.5, 1.5);
    };

    const drawCarrot = (cx: number, cy: number) => {
      ctx.fillStyle = FG;
      // body — triangle-ish (using two rects)
      ctx.fillRect(cx, cy, 6, 8);
      ctx.fillRect(cx + 1, cy + 8, 4, 2);
      // leaf
      ctx.fillRect(cx + 1, cy - 2, 1.5, 2);
      ctx.fillRect(cx + 3.5, cy - 3, 1.5, 3);
    };

    const update = () => {
      if (done || paused) return;
      frame++;

      // Spawn carrots periodically
      if (frame % 80 === 0) {
        carrots.push({ x: W + 10, y: GROUND_Y - 10 - Math.random() * 20 });
      }

      // Move carrots left
      carrots = carrots.filter(c => {
        c.x -= 2;
        return c.x > -10;
      });

      // Physics: gravity, bunny falls when in air
      velY += 0.5;
      bunnyY += velY;
      if (bunnyY >= GROUND_Y) {
        bunnyY = GROUND_Y;
        velY = 0;
        onGround = true;
      }

      // Collision: bunny vs carrots
      for (const c of carrots) {
        if (c.x > bunnyX - 8 && c.x < bunnyX + 14 &&
            c.y > bunnyY - 16 && c.y < bunnyY) {
          c.x = -100; // mark for removal
          score++;
          if (score >= WIN_SCORE) { done = true; onFinish?.(); }
        }
      }
      carrots = carrots.filter(c => c.x > -10);
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Ground line
      ctx.fillStyle = FG_DIM;
      for (let x = 0; x < W; x += 6) {
        ctx.fillRect(x, GROUND_Y, 2, 1);
      }

      drawBunny(bunnyX, bunnyY);
      for (const c of carrots) drawCarrot(c.x, c.y);

      // Score on top right
      if (score > 0) {
        ctx.font = `400 13px "CoFo Sans VF", system-ui, sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(35,31,32,0.5)';
        ctx.fillText(`${score}/${WIN_SCORE}`, W - 10, 16);
        ctx.textAlign = 'left';
      }
    };

    const jump = () => {
      if (onGround && !done) {
        velY = -6;
        onGround = false;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        jump();
        if (mouseOn) e.preventDefault();
      }
    };
    const onClick = () => jump();
    const onMouseEnter = () => { mouseOn = true; paused = false; };
    const onMouseLeave = () => { mouseOn = false; paused = true; };

    window.addEventListener('keydown', onKey);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('mouseenter', onMouseEnter);
    canvas.addEventListener('mouseleave', onMouseLeave);

    let rafId: number;
    const loop = () => { update(); draw(); rafId = requestAnimationFrame(loop); };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('mouseenter', onMouseEnter);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer' }}
      title="Click or press Space/↑ to jump"
    />
  );
}

// ── Word Breaker: knock letters out of "skip design" ──────────────────────────
const BW = 260, BH = 150;
const PAD_W = 40, PAD_H = 3;
const BALL_R = 3.5;

export function FormBreakoutGame({ active, onFinish }: { active?: boolean; onFinish?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const displayW = rect.width || BW;
      const displayH = displayW * BH / BW;
      canvas.width  = Math.round(displayW * dpr);
      canvas.height = Math.round(displayH * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(canvas.width / BW, canvas.height / BH);
      ctx.imageSmoothingEnabled = false;
    };
    setupCanvas();
    const ro = new ResizeObserver(setupCanvas);
    ro.observe(canvas);

    const WORD = 'skip design';
    let FS = 42;
    ctx.font = `700 ${FS}px "CoFo Sans VF", system-ui, sans-serif`;
    while (ctx.measureText(WORD).width > BW * 0.91 && FS > 18) {
      FS--;
      ctx.font = `700 ${FS}px "CoFo Sans VF", system-ui, sans-serif`;
    }
    const FONT    = `700 ${FS}px "CoFo Sans VF", system-ui, sans-serif`;
    const TEXT_Y  = FS + 10;

    const totalW = ctx.measureText(WORD).width;
    let cx = (BW - totalW) / 2;
    type Letter = { x: number; w: number; alive: boolean; char: string };
    const letters: Letter[] = [];
    for (const ch of WORD) {
      const cw = ctx.measureText(ch).width;
      letters.push({ x: cx, w: cw, alive: ch !== ' ', char: ch });
      cx += cw;
    }

    const PAD_Y = BH - 10;
    let padX = BW / 2 - PAD_W / 2;
    let ball = { x: BW / 2, y: BH * 0.62, vx: 1.6, vy: -2.2 };
    let done   = false;
    let paused = false;
    let mouseOn = false;

    const onMove = (e: MouseEvent) => {
      const r  = canvas.getBoundingClientRect();
      padX = Math.max(0, Math.min(BW - PAD_W,
        (e.clientX - r.left) * (BW / r.width) - PAD_W / 2));
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  { padX = Math.max(0, padX - 8); if (mouseOn) e.preventDefault(); }
      if (e.key === 'ArrowRight') { padX = Math.min(BW - PAD_W, padX + 8); if (mouseOn) e.preventDefault(); }
    };

    const onMouseEnter = () => { mouseOn = true; paused = false; };
    const onMouseLeave = () => { mouseOn = false; paused = true; };

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseenter', onMouseEnter);
    canvas.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('keydown', onKey);

    const update = () => {
      if (done || paused) return;
      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.x - BALL_R < 0)  { ball.x = BALL_R;      ball.vx =  Math.abs(ball.vx); }
      if (ball.x + BALL_R > BW) { ball.x = BW - BALL_R; ball.vx = -Math.abs(ball.vx); }
      if (ball.y - BALL_R < 0)  { ball.y = BALL_R;      ball.vy =  Math.abs(ball.vy); }
      if (ball.y > BH + 16) {
        ball = { x: BW / 2, y: BH * 0.62, vx: 1.6, vy: -2.2 };
      }

      if (ball.y + BALL_R >= PAD_Y &&
          ball.y + BALL_R <= PAD_Y + PAD_H + 5 &&
          ball.x >= padX - 2 && ball.x <= padX + PAD_W + 2) {
        ball.vy = -Math.abs(ball.vy);
        ball.vx = ((ball.x - (padX + PAD_W / 2)) / (PAD_W / 2)) * 2.8;
      }

      const ltop = TEXT_Y - FS * 0.8;
      const lbot = TEXT_Y + FS * 0.18;
      for (const l of letters) {
        if (!l.alive || l.char === ' ') continue;
        if (ball.x + BALL_R > l.x && ball.x - BALL_R < l.x + l.w &&
            ball.y + BALL_R > ltop && ball.y - BALL_R < lbot) {
          l.alive = false;
          ball.vy = -ball.vy;
          if (!letters.some(lt => lt.alive && lt.char !== ' ')) {
            done = true;
            onFinish?.();
          }
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, BW, BH);

      // Letters
      ctx.font = FONT;
      for (const l of letters) {
        if (l.char === ' ') continue;
        if (l.alive) {
          ctx.fillStyle = FG;
          ctx.fillText(l.char, l.x, TEXT_Y);
        } else {
          ctx.fillStyle = FG;
          ctx.beginPath();
          ctx.arc(l.x + l.w / 2, TEXT_Y - FS * 0.32, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Paddle — no rounded corners
      ctx.fillStyle = FG;
      ctx.fillRect(padX, PAD_Y, PAD_W, PAD_H);

      // Ball
      ctx.fillStyle = FG;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
    };

    let rafId: number;
    const loop = () => { update(); draw(); rafId = requestAnimationFrame(loop); };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseenter', onMouseEnter);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('keydown', onKey);
      ro.disconnect();
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 'auto', display: 'block', cursor: 'none' }}
      title="Move mouse to control paddle"
    />
  );
}
