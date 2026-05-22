import { useEffect, useRef } from 'react';

const FG = '#231f20';

// ── Snake: food = letters of "skip design", snake avoids form area ────────────
const SCELL = 40; // cell size in CSS pixels — circles are 40px diameter
const FOOD_CHARS = ['S', 'K', 'I', 'P', 'D', 'E', 'S', 'I', 'G', 'N'];

export function FormSnakeGame({
  active,
  formRef,
  onFinish,
}: {
  active?: boolean;
  formRef?: React.RefObject<HTMLElement>;
  onFinish?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    // ── Mutable game state (declared before setupCanvas so it can reset them) ──
    type Pt  = { x: number; y: number };
    type Dir = 'U' | 'D' | 'L' | 'R';
    const DELTA: Record<Dir, [number, number]> = { U:[0,-1], D:[0,1], L:[-1,0], R:[1,0] };
    const OPP:   Record<Dir, Dir>              = { U:'D', D:'U', L:'R', R:'L' };
    const ARROW: Record<Dir, string>           = { U:'↑', D:'↓', L:'←', R:'→' };

    let SCOLS = 1, SROWS = 1, W = SCELL, H = SCELL;
    let forbiddenSet = new Set<string>();

    let snake: Pt[]   = [];
    let food: Pt      = { x: 0, y: 0 };
    let dir: Dir      = 'R';
    let queueDir: Dir = 'R';
    let foodCharIdx   = 0;
    let playerControlled = false;
    let done   = false;
    let paused = true;
    let mouseOn = false;

    // ── Helpers ───────────────────────────────────────────────────────────────

    const isOpen = (x: number, y: number) =>
      x >= 0 && x < SCOLS && y >= 0 && y < SROWS && !forbiddenSet.has(`${x},${y}`);

    const computeForbidden = () => {
      forbiddenSet = new Set<string>();
      if (!formRef?.current) return;
      const canvasRect = canvas.getBoundingClientRect();
      const formRect   = formRef.current.getBoundingClientRect();
      const fL = formRect.left   - canvasRect.left;
      const fT = formRect.top    - canvasRect.top;
      const fR = formRect.right  - canvasRect.left;
      const fB = formRect.bottom - canvasRect.top;
      for (let cx = Math.floor(fL / SCELL); cx < Math.ceil(fR / SCELL); cx++) {
        for (let cy = Math.floor(fT / SCELL); cy < Math.ceil(fB / SCELL); cy++) {
          if (cx >= 0 && cx < SCOLS && cy >= 0 && cy < SROWS) {
            forbiddenSet.add(`${cx},${cy}`);
          }
        }
      }
    };

    const makeInitSnake = (): Pt[] => {
      // Find a valid starting row in the right portion of the canvas
      const midY = Math.floor(SROWS / 2);
      for (let dy = 0; dy <= SROWS; dy++) {
        for (const sign of [1, -1]) {
          const y = midY + sign * Math.ceil(dy / 2);
          if (y < 0 || y >= SROWS) continue;
          // Find rightmost open x
          for (let x = SCOLS - 1; x >= 0; x--) {
            if (!isOpen(x, y)) continue;
            // Build snake going left from here
            const seg: Pt[] = [];
            for (let i = 0; i < 8; i++) {
              const sx = x - i;
              if (!isOpen(sx, y)) break;
              seg.push({ x: sx, y });
            }
            if (seg.length >= 3) return seg;
          }
        }
      }
      // Absolute fallback
      for (let x = SCOLS - 1; x >= 0; x--) {
        for (let y = 0; y < SROWS; y++) {
          if (isOpen(x, y)) return [{ x, y }];
        }
      }
      return [{ x: 0, y: 0 }];
    };

    const spawnFood = () => {
      const occ = new Set(snake.map(s => `${s.x},${s.y}`));
      let x = 0, y = 0, tries = 0;
      do {
        x = Math.floor(Math.random() * SCOLS);
        y = Math.floor(Math.random() * SROWS);
        tries++;
        if (tries > 2000) break;
      } while (!isOpen(x, y) || occ.has(`${x},${y}`));
      food = { x, y };
    };

    // ── Canvas setup — called on mount and resize ─────────────────────────────

    const setupCanvas = () => {
      const dpr  = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      W = Math.max(rect.width,  SCELL);
      H = Math.max(rect.height, SCELL);
      SCOLS = Math.max(1, Math.floor(W / SCELL));
      SROWS = Math.max(1, Math.floor(H / SCELL));
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = false;
      computeForbidden();
      // Reset snake to a valid position in the new grid
      snake    = makeInitSnake();
      dir      = 'R';
      queueDir = 'R';
      playerControlled = false;
      foodCharIdx = 0;
      spawnFood();
    };

    setupCanvas();
    const ro = new ResizeObserver(setupCanvas);
    ro.observe(canvas);

    // ── Game logic ────────────────────────────────────────────────────────────

    const isSafe = (d: Dir, head: Pt, occ: Set<string>) => {
      const [dx, dy] = DELTA[d];
      const nx = head.x + dx, ny = head.y + dy;
      return isOpen(nx, ny) && !occ.has(`${nx},${ny}`) && d !== OPP[dir];
    };

    const tick = () => {
      if (done || paused) return;
      const head = snake[0];
      const occ  = new Set(snake.slice(0, -1).map(s => `${s.x},${s.y}`));

      // AI pathfinding (when player hasn't taken over)
      if (!playerControlled) {
        const dx = food.x - head.x, dy = food.y - head.y;
        const want: Dir[] = [];
        if (dx > 0) want.push('R'); else if (dx < 0) want.push('L');
        if (dy > 0) want.push('D'); else if (dy < 0) want.push('U');
        const safe = want.filter(d => isSafe(d, head, occ));
        if (safe.length) {
          queueDir = safe[0];
        } else {
          const fallback = (['R','D','L','U'] as Dir[]).filter(d => isSafe(d, head, occ));
          if (fallback.length) queueDir = fallback[0];
        }
      }

      dir = queueDir;
      const [dx, dy] = DELTA[dir];
      const nh = { x: head.x + dx, y: head.y + dy };

      // Collision = reset (walls, self, forbidden)
      if (!isOpen(nh.x, nh.y) || occ.has(`${nh.x},${nh.y}`)) {
        snake    = makeInitSnake();
        dir      = 'R'; queueDir = 'R'; foodCharIdx = 0;
        playerControlled = false;
        spawnFood();
        return;
      }

      snake.unshift(nh);
      if (nh.x === food.x && nh.y === food.y) {
        foodCharIdx = (foodCharIdx + 1) % FOOD_CHARS.length;
        if (snake.length > 1) snake.pop();
        if (snake.length > 1) snake.pop();
        spawnFood();
      } else {
        snake.pop();
      }
    };

    // ── Draw ─────────────────────────────────────────────────────────────────

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      const R = SCELL / 2 - 2; // circle radius ≈ 18px (diameter ≈ 36px, fits 40px cell)

      // (Grid dots are drawn by the CSS background of .contactWrap — a single
      // 1px dot every 16px — so the snake no longer paints its own grid.)

      // Food — outlined circle + letter
      const fx = food.x * SCELL + SCELL / 2;
      const fy = food.y * SCELL + SCELL / 2;
      ctx.strokeStyle = FG;
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.arc(fx, fy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = FG;
      ctx.font      = `700 ${Math.round(R * 1.1)}px "CoFo Sans VF", system-ui, sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(FOOD_CHARS[foodCharIdx], fx, fy);
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'alphabetic';

      // Snake segments
      snake.forEach((seg, i) => {
        const sx = seg.x * SCELL + SCELL / 2;
        const sy = seg.y * SCELL + SCELL / 2;
        ctx.fillStyle = FG;
        ctx.beginPath();
        ctx.arc(sx, sy, R, 0, Math.PI * 2);
        ctx.fill();
        if (i === 0) {
          ctx.fillStyle    = '#fff';
          ctx.font         = `${Math.round(R * 0.9)}px system-ui, sans-serif`;
          ctx.textAlign    = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(ARROW[dir], sx, sy);
          ctx.textAlign    = 'left';
          ctx.textBaseline = 'alphabetic';
        }
      });
    };

    // ── Input ─────────────────────────────────────────────────────────────────

    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp:'U', ArrowDown:'D', ArrowLeft:'L', ArrowRight:'R',
      };
      if (map[e.key]) {
        queueDir = map[e.key];
        playerControlled = true;
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
  }, [active, formRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block', cursor: 'default' }}
      title="Arrow keys to play"
    />
  );
}

// ── Bunny Runner (kept for reference) ─────────────────────────────────────────
const BW_B = 260, BH_B = 150;
export function FormBunnyGame({ active, onFinish }: { active?: boolean; onFinish?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current!;
    const dpr = window.devicePixelRatio || 1;
    const displayW = canvas.offsetWidth || BW_B;
    const displayH = displayW * BH_B / BW_B;
    canvas.width  = Math.round(displayW * dpr);
    canvas.height = Math.round(displayH * dpr);
    const ctx = canvas.getContext('2d')!;
    ctx.scale(canvas.width / BW_B, canvas.height / BH_B);
    const GROUND_Y = BH_B - 16;
    let bunnyX = 30, bunnyY = GROUND_Y, velY = 0, onGround = true;
    type Carrot = { x: number; y: number };
    let carrots: Carrot[] = [];
    let score = 0, frame = 0, done = false, paused = false, mouseOn = false;
    const WIN_SCORE = 5;
    const drawBunny = (x: number, y: number) => {
      ctx.fillStyle = FG;
      ctx.fillRect(x, y - 10, 12, 10);
      ctx.fillRect(x + 1, y - 16, 2, 6);
      ctx.fillRect(x + 8, y - 16, 2, 6);
      ctx.fillRect(x - 2, y - 5, 2, 2);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 8, y - 8, 1.5, 1.5);
    };
    const drawCarrot = (cx: number, cy: number) => {
      ctx.fillStyle = FG;
      ctx.fillRect(cx, cy, 6, 8);
      ctx.fillRect(cx + 1, cy + 8, 4, 2);
      ctx.fillRect(cx + 1, cy - 2, 1.5, 2);
      ctx.fillRect(cx + 3.5, cy - 3, 1.5, 3);
    };
    const update = () => {
      if (done || paused) return;
      frame++;
      if (frame % 80 === 0) carrots.push({ x: BW_B + 10, y: GROUND_Y - 10 - Math.random() * 20 });
      carrots = carrots.filter(c => { c.x -= 2; return c.x > -10; });
      velY += 0.5; bunnyY += velY;
      if (bunnyY >= GROUND_Y) { bunnyY = GROUND_Y; velY = 0; onGround = true; }
      for (const c of carrots) {
        if (c.x > bunnyX - 8 && c.x < bunnyX + 14 && c.y > bunnyY - 16 && c.y < bunnyY) {
          c.x = -100; score++;
          if (score >= WIN_SCORE) { done = true; onFinish?.(); }
        }
      }
      carrots = carrots.filter(c => c.x > -10);
    };
    const draw = () => {
      ctx.clearRect(0, 0, BW_B, BH_B);
      ctx.fillStyle = 'rgba(35,31,32,0.2)';
      for (let x = 0; x < BW_B; x += 6) ctx.fillRect(x, GROUND_Y, 2, 1);
      drawBunny(bunnyX, bunnyY);
      for (const c of carrots) drawCarrot(c.x, c.y);
    };
    const jump = () => { if (onGround && !done) { velY = -6; onGround = false; } };
    const onKey = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'ArrowUp') { jump(); if (mouseOn) e.preventDefault(); } };
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
  return <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer' }} title="Click or ↑ to jump" />;
}

// ── Word Breaker ───────────────────────────────────────────────────────────────
const BW = 260, BH = 150;
const PAD_W = 40, PAD_H = 3;
const BALL_R = 3.5;

export function FormBreakoutGame({ active, formRef, onFinish }: { active?: boolean; formRef?: React.RefObject<HTMLElement>; onFinish?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    // Uniform-scale letterbox so the game space stays BW×BH no matter what
    // shape the canvas takes. Stored at module-scope so collision math can
    // re-use them.
    let cssScale = 1, cssOffX = 0, cssOffY = 0;
    let formRectGame: { x: number; y: number; w: number; h: number } | null = null;

    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const displayW = rect.width  || BW;
      const displayH = rect.height || BH;
      canvas.width  = Math.round(displayW * dpr);
      canvas.height = Math.round(displayH * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // Uniform scale with letterboxing — preserves aspect, no text stretch
      cssScale = Math.min(displayW / BW, displayH / BH);
      cssOffX  = (displayW - BW * cssScale) / 2;
      cssOffY  = (displayH - BH * cssScale) / 2;
      const pxScale = cssScale * dpr;
      ctx.translate(cssOffX * dpr, cssOffY * dpr);
      ctx.scale(pxScale, pxScale);
      ctx.imageSmoothingEnabled = false;
      computeFormRect();
    };

    const computeFormRect = () => {
      if (!formRef?.current) { formRectGame = null; return; }
      const cr = canvas.getBoundingClientRect();
      const fr = formRef.current.getBoundingClientRect();
      const fL = fr.left - cr.left, fT = fr.top    - cr.top;
      const fR = fr.right - cr.left, fB = fr.bottom - cr.top;
      formRectGame = {
        x: (fL - cssOffX) / cssScale,
        y: (fT - cssOffY) / cssScale,
        w: (fR - fL) / cssScale,
        h: (fB - fT) / cssScale,
      };
    };

    setupCanvas();
    const ro = new ResizeObserver(() => { setupCanvas(); });
    ro.observe(canvas);
    if (formRef?.current) ro.observe(formRef.current);

    const WORD = 'skip design';
    // Bigger background text — start large, shrink only if it overflows ~98% of BW
    let FS = 72;
    ctx.font = `700 ${FS}px "CoFo Sans VF", system-ui, sans-serif`;
    while (ctx.measureText(WORD).width > BW * 0.98 && FS > 24) {
      FS--;
      ctx.font = `700 ${FS}px "CoFo Sans VF", system-ui, sans-serif`;
    }
    const FONT   = `700 ${FS}px "CoFo Sans VF", system-ui, sans-serif`;
    const TEXT_Y = FS + 10;

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
    // Spawn ball on the side (just inside the left wall) heading down-right, so it
    // doesn't immediately slam into the centred form.
    const spawnBall = () => ({ x: BALL_R + 6, y: BH * 0.18, vx: 1.6, vy: 2.0 });
    let ball = spawnBall();
    let done = false, paused = false, mouseOn = false;

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      // Convert mouse position into game coords (account for letterbox offset)
      const gameX = ((e.clientX - r.left) - cssOffX) / cssScale;
      padX = Math.max(0, Math.min(BW - PAD_W, gameX - PAD_W / 2));
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
      computeFormRect();
      ball.x += ball.vx; ball.y += ball.vy;
      if (ball.x - BALL_R < 0)  { ball.x = BALL_R;      ball.vx =  Math.abs(ball.vx); }
      if (ball.x + BALL_R > BW) { ball.x = BW - BALL_R; ball.vx = -Math.abs(ball.vx); }
      if (ball.y - BALL_R < 0)  { ball.y = BALL_R;      ball.vy =  Math.abs(ball.vy); }
      if (ball.y > BH + 16) ball = spawnBall();
      if (ball.y + BALL_R >= PAD_Y && ball.y + BALL_R <= PAD_Y + PAD_H + 5 &&
          ball.x >= padX - 2 && ball.x <= padX + PAD_W + 2) {
        ball.vy = -Math.abs(ball.vy);
        ball.vx = ((ball.x - (padX + PAD_W / 2)) / (PAD_W / 2)) * 2.8;
      }
      const ltop = TEXT_Y - FS * 0.8, lbot = TEXT_Y + FS * 0.18;
      for (const l of letters) {
        if (!l.alive || l.char === ' ') continue;
        if (ball.x + BALL_R > l.x && ball.x - BALL_R < l.x + l.w &&
            ball.y + BALL_R > ltop && ball.y - BALL_R < lbot) {
          l.alive = false; ball.vy = -ball.vy;
          if (!letters.some(lt => lt.alive && lt.char !== ' ')) { done = true; onFinish?.(); }
        }
      }
      // Form-rect collision: ball bounces off the form's bounding box (treated
      // as a solid AABB inside the play area).
      if (formRectGame) {
        const r = formRectGame;
        const cx = Math.max(r.x, Math.min(ball.x, r.x + r.w));
        const cy = Math.max(r.y, Math.min(ball.y, r.y + r.h));
        const dx = ball.x - cx;
        const dy = ball.y - cy;
        if (dx * dx + dy * dy < BALL_R * BALL_R) {
          // Decide which side: bigger penetration axis flips that velocity
          const penX = BALL_R - Math.abs(dx);
          const penY = BALL_R - Math.abs(dy);
          if (penX < penY) {
            ball.vx = dx >= 0 ? Math.abs(ball.vx) : -Math.abs(ball.vx);
            ball.x  = (dx >= 0 ? cx + BALL_R : cx - BALL_R);
          } else {
            ball.vy = dy >= 0 ? Math.abs(ball.vy) : -Math.abs(ball.vy);
            ball.y  = (dy >= 0 ? cy + BALL_R : cy - BALL_R);
          }
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, BW, BH);
      ctx.font = FONT;
      for (const l of letters) {
        if (l.char === ' ') continue;
        if (l.alive) { ctx.fillStyle = FG; ctx.fillText(l.char, l.x, TEXT_Y); }
        else { ctx.fillStyle = FG; ctx.beginPath(); ctx.arc(l.x + l.w / 2, TEXT_Y - FS * 0.32, 2.2, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.fillStyle = FG;
      ctx.fillRect(padX, PAD_Y, PAD_W, PAD_H);
      ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2); ctx.fill();
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
      style={{ width: '100%', height: '100%', display: 'block', cursor: 'none' }}
      title="Move mouse to control paddle"
    />
  );
}
