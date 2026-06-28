import { useEffect, useRef } from 'react';
import { sound } from '../sound/Sound';

const FG = '#231f20';

// ── Snake: food = letters of "skip design", snake avoids form area ────────────
const SCELL = 34; // cell size in CSS pixels
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

    let snake: Pt[]    = [];
    let food: Pt       = { x: 0, y: 0 };
    let dir: Dir       = 'R';
    let dirQueue: Dir[] = [];   // buffered player inputs
    let foodCharIdx    = 0;
    let playerControlled = false;
    let done   = false;
    let paused = false;   // autoplay by default — runs on its own (AI)
    let mouseOn = false;
    // Visual recoil — non-zero when snake just bumped a wall / the form
    let recoilTick = 0;

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
      // Keep food away from the 10 % border on each side
      const bx = Math.max(1, Math.round(SCOLS * 0.10));
      const by = Math.max(1, Math.round(SROWS * 0.10));
      const minX = bx, maxX = SCOLS - bx - 1;
      const minY = by, maxY = SROWS - by - 1;
      let x = 0, y = 0, tries = 0;
      do {
        x = minX + Math.floor(Math.random() * Math.max(1, maxX - minX + 1));
        y = minY + Math.floor(Math.random() * Math.max(1, maxY - minY + 1));
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
      dirQueue = [];
      playerControlled = false;
      foodCharIdx = 0;
      spawnFood();
    };

    setupCanvas();
    const ro = new ResizeObserver(setupCanvas);
    ro.observe(canvas);

    // Small kinetic shake when the snake bumps the form — matches FormCarrotGame
    const shakeForm = () => {
      const el = formRef?.current;
      if (!el) return;
      const start = performance.now();
      const dur = 220;
      const amp = 4;
      const tick = (now: number) => {
        const k = (now - start) / dur;
        if (k >= 1) { el.style.transform = ''; return; }
        const offset = Math.sin(k * Math.PI * 3) * amp * (1 - k);
        el.style.transform = `translateX(${offset}px)`;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

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
          dirQueue = [safe[0]];
        } else {
          const fallback = (['R','D','L','U'] as Dir[]).filter(d => isSafe(d, head, occ));
          if (fallback.length) dirQueue = [fallback[0]];
        }
      }

      // Dequeue the next player-buffered direction (or keep current)
      if (dirQueue.length) dir = dirQueue.shift()!;
      const [dx, dy] = DELTA[dir];
      const nh = { x: head.x + dx, y: head.y + dy };

      // Collision with form / wall / self: bounce off instead of resetting.
      // Snake stays in place for one tick and immediately changes direction.
      // This is the "bumping into the form" feeling — no game-over.
      if (!isOpen(nh.x, nh.y) || occ.has(`${nh.x},${nh.y}`)) {
        const fallback = (['R','D','L','U'] as Dir[]).filter(d => isSafe(d, head, occ));
        if (fallback.length) {
          const perp = fallback.find(d => d !== dir && d !== OPP[dir]);
          dirQueue = [perp || fallback[0]];
        }
        // Bigger visual recoil — head springs back from the wall noticeably
        recoilTick = 2.2;
        // Was it the form (forbidden) — not a wall or self? Shake it + knock.
        const hitForbidden = forbiddenSet.has(`${nh.x},${nh.y}`);
        if (hitForbidden) { shakeForm(); sound.play('snake'); }
        return;
      }
      recoilTick = 0;

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

      const R = (SCELL - 2) / 2; // 2px gap between adjacent circles

      // (Grid dots are drawn by the CSS background of .contactWrap — a single
      // 1px dot every 16px — so the snake no longer paints its own grid.)

      const ACCENT = FG; // black snake

      // Food — outlined circle + letter (purple to match snake)
      const fx = food.x * SCELL + SCELL / 2;
      const fy = food.y * SCELL + SCELL / 2;
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.arc(fx, fy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = ACCENT;
      ctx.font      = `700 ${Math.round(R * 1.1)}px "CoFo Sans VF", system-ui, sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(FOOD_CHARS[foodCharIdx], fx, fy);
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'alphabetic';

      // Recoil offset for the head — small visual nudge backwards on collision.
      // Capped lower than 0.5 so the recoiled head never overlaps the cell
      // immediately after it (snake[1]). Suppress entirely when snake[1]
      // sits directly behind the head (recoil would collide with body).
      const head = snake[0];
      const nextSeg = snake[1];
      const [rdx, rdy] = DELTA[dir];
      const recoilSuppressed = !!nextSeg
        && nextSeg.x === head.x - rdx
        && nextSeg.y === head.y - rdy;
      const recoilFactor = recoilSuppressed ? 0 : Math.min(0.35, recoilTick * 0.25);

      // Snake segments — purple circles
      snake.forEach((seg, i) => {
        let sx = seg.x * SCELL + SCELL / 2;
        let sy = seg.y * SCELL + SCELL / 2;
        if (i === 0 && recoilFactor > 0) {
          sx -= rdx * SCELL * recoilFactor;
          sy -= rdy * SCELL * recoilFactor;
        }
        ctx.fillStyle = ACCENT;
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

      // Decay recoil so it disappears within ~2 frames
      if (recoilTick > 0) recoilTick = Math.max(0, recoilTick - 0.5);
    };

    // ── Input ─────────────────────────────────────────────────────────────────

    const canvasInView = () => {
      const r = canvas.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    };
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp:'U', ArrowDown:'D', ArrowLeft:'L', ArrowRight:'R',
      };
      if (map[e.key]) {
        const d = map[e.key];
        // Reference direction: last buffered input, or current live direction
        const last = dirQueue.length ? dirQueue[dirQueue.length - 1] : dir;
        // Only queue if it's not a 180-degree reversal, and cap buffer at 2
        if (d !== OPP[last] && dirQueue.length < 2) {
          dirQueue.push(d);
        }
        playerControlled = true;
      }
      // Lock page scroll for arrows/space whenever the canvas is on-screen
      if (canvasInView() && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
        e.preventDefault();
      }
    };

    // Snake autoplays continuously; the mouse no longer pauses it, it just
    // tracks hover (kept for any hover-only behaviour).
    const onMouseEnter = () => { mouseOn = true; paused = false; };
    const onMouseLeave = () => { mouseOn = false; };

    canvas.addEventListener('mouseenter', onMouseEnter);
    canvas.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('keydown', onKey);

    draw();
    // 30% faster than the previous 260 ms step.
    // Only advance while the canvas is on-screen — the snake "lives" only
    // when it's in view; off-screen it freezes and resumes on scroll-back.
    const id = setInterval(() => {
      if (!canvasInView()) return;
      tick();
      draw();
    }, 182);

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
    const bunnyInView = () => {
      const r = canvas.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') jump();
      if (bunnyInView() && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
        e.preventDefault();
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
    const breakoutInView = () => {
      const r = canvas.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  { padX = Math.max(0, padX - 8); }
      if (e.key === 'ArrowRight') { padX = Math.min(BW - PAD_W, padX + 8); }
      if (breakoutInView() && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
        e.preventDefault();
      }
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
      // Form-rect collision: ball bounces off the form's bounding box.
      if (formRectGame) {
        const r = formRectGame;
        const inside = ball.x > r.x && ball.x < r.x + r.w && ball.y > r.y && ball.y < r.y + r.h;
        if (inside) {
          // Got past the wall somehow — eject toward the nearest edge.
          const dL = ball.x - r.x;
          const dR = (r.x + r.w) - ball.x;
          const dT = ball.y - r.y;
          const dB = (r.y + r.h) - ball.y;
          const m = Math.min(dL, dR, dT, dB);
          if      (m === dL) { ball.x = r.x - BALL_R;          ball.vx = -Math.abs(ball.vx); }
          else if (m === dR) { ball.x = r.x + r.w + BALL_R;    ball.vx =  Math.abs(ball.vx); }
          else if (m === dT) { ball.y = r.y - BALL_R;          ball.vy = -Math.abs(ball.vy); }
          else               { ball.y = r.y + r.h + BALL_R;    ball.vy =  Math.abs(ball.vy); }
        } else {
          const cx = Math.max(r.x, Math.min(ball.x, r.x + r.w));
          const cy = Math.max(r.y, Math.min(ball.y, r.y + r.h));
          const dx = ball.x - cx;
          const dy = ball.y - cy;
          if (dx * dx + dy * dy < BALL_R * BALL_R) {
            const penX = BALL_R - Math.abs(dx);
            const penY = BALL_R - Math.abs(dy);
            if (penX < penY) {
              ball.vx = dx >= 0 ? Math.abs(ball.vx) : -Math.abs(ball.vx);
              ball.x  = dx >= 0 ? cx + BALL_R : cx - BALL_R;
            } else {
              ball.vy = dy >= 0 ? Math.abs(ball.vy) : -Math.abs(ball.vy);
              ball.y  = dy >= 0 ? cy + BALL_R : cy - BALL_R;
            }
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

// ── Carrot bunny ─────────────────────────────────────────────────────────────
// Bunny stands under the form, on the ground. Press ↑ or Space and the bunny
// jumps. When its head bumps the form's bottom edge, a carrot pops out of the
// form's top (Mario-block style). 5 bumps wins.
export function FormCarrotGame({ active, formRef, onFinish }: { active?: boolean; formRef?: React.RefObject<HTMLElement>; onFinish?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

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
      formRectGame = {
        x: ((fr.left - cr.left) - cssOffX) / cssScale,
        y: ((fr.top  - cr.top ) - cssOffY) / cssScale,
        w: (fr.right - fr.left) / cssScale,
        h: (fr.bottom - fr.top) / cssScale,
      };
    };

    setupCanvas();
    const ro = new ResizeObserver(() => setupCanvas());
    ro.observe(canvas);
    if (formRef?.current) ro.observe(formRef.current);

    // Flying bunny — same sprite as the BunnyHero mascot, drawn pixel-by-pixel.
    // Sprite cells (10×12 for the body, 4×3 for each wing) map 1:1 to game units.
    const BUNNY_SPR: number[][] = [
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
    const W_UP: number[][] = [[0,1,1,0],[1,1,1,1],[0,1,1,0]];
    const W_DN: number[][] = [[0,0,1,0],[0,1,1,1],[1,1,0,0]];
    const C1 = '#1a1a1a', C2 = '#888', C3 = '#f6f6f6';
    const BMAP: Record<number, string> = { 1: C1, 2: C2, 3: C3 };
    const WMAP: Record<number, string> = { 1: C2 };
    const BUNNY_W_CELLS = 10;
    const BUNNY_H_CELLS = 12;

    const BUNNY_H = BUNNY_H_CELLS; // sprite height in game units (= cells)
    const BUNNY_W = BUNNY_W_CELLS; // sprite width in game units
    const GROUND_Y = BH - 2;       // bunny feet rest here
    let bunnyX = BW / 2 - BUNNY_W / 2;
    let bunnyY = GROUND_Y;
    let velY = 0;
    let onGround = true;
    let prevHeadY = bunnyY - BUNNY_H;
    let wt = 0;
    let bumps = 0;
    const WIN_BUMPS = 15;
    type Carrot = { x: number; y: number; vx: number; vy: number; rot: number; vrot: number; life: number };
    let carrots: Carrot[] = [];
    let done = false, paused = true, mouseOn = false;

    const drawSprite = (spr: number[][], ox: number, oy: number, map: Record<number, string>, flipX = false) => {
      for (let ry = 0; ry < spr.length; ry++) {
        const row = spr[ry];
        for (let rx = 0; rx < row.length; rx++) {
          const v = row[rx];
          if (!v) continue;
          const dx = flipX ? row.length - 1 - rx : rx;
          ctx.fillStyle = map[v];
          ctx.fillRect(ox + dx, oy + ry, 1, 1);
        }
      }
    };
    const drawBunny = (x: number, y: number) => {
      // y is feet-y; top of sprite is y - BUNNY_H
      const top = y - BUNNY_H;
      wt += 0.22;
      const wUp = onGround ? false : Math.sin(wt) > 0;
      const wing = wUp ? W_UP : W_DN;
      // Left wing at sprite (-3, +3); right wing at (+10, +3) flipped
      drawSprite(wing, x - 3, top + 3, WMAP, false);
      drawSprite(wing, x + BUNNY_W, top + 3, WMAP, true);
      drawSprite(BUNNY_SPR, x, top, BMAP, false);
    };
    // Pixel-art carrot in the same chunky style as the bunny sprite.
    // Black-and-white only: 1 = dark, 2 = mid grey, 3 = light highlight.
    const CARROT_SPR: number[][] = [
      [0,0,1,2,0,0,0],
      [0,1,2,1,2,0,0],
      [0,1,2,1,2,1,0],
      [0,0,2,1,2,1,0],
      [0,1,3,1,1,1,0],
      [0,1,1,3,1,1,0],
      [0,0,1,1,3,0,0],
      [0,0,1,1,1,0,0],
      [0,0,0,1,1,0,0],
      [0,0,0,0,1,0,0],
    ];
    const CARROT_CMAP: Record<number, string> = {
      1: '#1a1a1a', // body dark (matches bunny C1)
      2: '#888',    // mid grey (matches bunny C2)
      3: '#f6f6f6', // light highlight (matches bunny C3)
    };
    const CARROT_W = CARROT_SPR[0].length;
    const CARROT_H = CARROT_SPR.length;
    const drawCarrot = (cx: number, cy: number, rot = 0) => {
      ctx.save();
      ctx.translate(cx + CARROT_W / 2, cy + CARROT_H / 2);
      if (rot) ctx.rotate(rot);
      ctx.translate(-CARROT_W / 2, -CARROT_H / 2);
      drawSprite(CARROT_SPR, 0, 0, CARROT_CMAP, false);
      ctx.restore();
    };

    // Small kinetic shake when the bunny bumps the form.
    const shakeForm = () => {
      const el = formRef?.current;
      if (!el) return;
      const start = performance.now();
      const dur = 260;
      const amp = 6;
      const tick = (now: number) => {
        const k = (now - start) / dur;
        if (k >= 1) { el.style.transform = ''; return; }
        const offset = Math.sin(k * Math.PI * 3) * amp * (1 - k);
        el.style.transform = `translateY(${offset}px)`;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const jump = () => { if (onGround && !done) { velY = -3.4; onGround = false; } };
    const carrotInView = () => {
      const r = canvas.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') jump();
      if (carrotInView() && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    const onClick = () => jump();
    const onMouseEnter = () => { mouseOn = true; paused = false; };
    const onMouseLeave = () => { mouseOn = false; paused = true; };

    canvas.addEventListener('click', onClick);
    canvas.addEventListener('mouseenter', onMouseEnter);
    canvas.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('keydown', onKey);

    const update = () => {
      if (done || paused) return;
      computeFormRect();

      // Re-anchor bunny horizontally under the form (in case the form moved)
      if (formRectGame) bunnyX = formRectGame.x + formRectGame.w / 2 - BUNNY_W / 2;

      // Physics
      prevHeadY = bunnyY - BUNNY_H;
      velY += 0.18;
      bunnyY += velY;

      // Head bumps form bottom (sweep test: was below last frame, crossed it now)
      if (formRectGame && velY < 0) {
        const formBottom = formRectGame.y + formRectGame.h;
        const headY = bunnyY - BUNNY_H;
        const bunnyL = bunnyX, bunnyR = bunnyX + BUNNY_W;
        const horizOverlap = bunnyR > formRectGame.x && bunnyL < formRectGame.x + formRectGame.w;
        if (horizOverlap && prevHeadY > formBottom && headY <= formBottom) {
          // Stop the bunny at the form's bottom and bounce it back down
          bunnyY = formBottom + BUNNY_H;
          velY  = 1.0;
          // Pop several carrots flying upward & sideways above the form
          // (they sit on top of the form visually thanks to a higher z-index).
          const carrotsPerBump = 3 + Math.floor(Math.random() * 2); // 3–4 carrots
          for (let i = 0; i < carrotsPerBump; i++) {
            const cx = formRectGame.x + 4 + Math.random() * (formRectGame.w - 12);
            const cy = formRectGame.y - 4;
            const angleSpread = (i - (carrotsPerBump - 1) / 2) * 0.35;
            const speed = 3.4 + Math.random() * 1.2;
            carrots.push({
              x: cx,
              y: cy,
              vx: Math.sin(angleSpread) * speed,
              vy: -Math.cos(angleSpread) * speed,
              rot: 0,
              vrot: (Math.random() - 0.5) * 0.3,
              life: 110,
            });
          }
          shakeForm();
          bumps++;
          if (bumps >= WIN_BUMPS) { done = true; onFinish?.(); }
        }
      }

      // Ground
      if (bunnyY >= GROUND_Y) { bunnyY = GROUND_Y; velY = 0; onGround = true; }

      // Carrots: gravity + sideways drift + spin. They fall freely and only
      // disappear when they leave the bottom of the canvas — no longer killed
      // on the form's top edge.
      for (const c of carrots) {
        c.vy += 0.16;
        c.x  += c.vx;
        c.y  += c.vy;
        c.rot += c.vrot;
      }
      carrots = carrots.filter(c => c.y < BH + 40);
    };

    const draw = () => {
      ctx.clearRect(0, 0, BW, BH);
      drawBunny(bunnyX, bunnyY);
      for (const c of carrots) drawCarrot(c.x, c.y, c.rot);
    };

    let rafId: number;
    const loop = () => { update(); draw(); rafId = requestAnimationFrame(loop); };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('mouseenter', onMouseEnter);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('keydown', onKey);
      ro.disconnect();
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }}
      title="Space or ↑ to jump"
    />
  );
}
