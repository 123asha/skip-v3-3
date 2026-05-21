import { useEffect, useRef } from 'react';

export const COLS = 16;
export const ROWS = 9;
export const CELL = 40;
const R = Math.round(CELL * 0.34);
const TICK = 550;
const BG = '#f6f6f6';
const FONT = `400 ${CELL * 0.38}px "CoFo Sans VF Trial", system-ui, sans-serif`;
const FONT_SM = `400 ${CELL * 0.28}px "CoFo Sans VF Trial", system-ui, sans-serif`;

const SHAPES: number[][][] = [
  [[1,1,1,1]],
  [[1,1],[1,1]],
  [[0,1,0],[1,1,1]],
  [[1,0],[1,1],[0,1]],
  [[0,1],[1,1],[1,0]],
  [[1,0],[1,0],[1,1]],
  [[0,1],[0,1],[1,1]],
];

type Piece = { shape: number[][]; x: number; y: number };

function rotate(s: number[][]): number[][] {
  return s[0].map((_, c) => s.map(row => row[c]).reverse());
}

function collides(board: number[][], p: Piece): boolean {
  for (let r = 0; r < p.shape.length; r++)
    for (let c = 0; c < p.shape[r].length; c++) {
      if (!p.shape[r][c]) continue;
      const x = p.x + c, y = p.y + r;
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y >= 0 && board[y][x]) return true;
    }
  return false;
}

function place(board: number[][], p: Piece): number[][] {
  const next = board.map(row => [...row]);
  p.shape.forEach((row, r) => row.forEach((cell, c) => {
    if (!cell) return;
    const y = p.y + r;
    if (y >= 0) next[y][p.x + c] = 1;
  }));
  return next;
}

function clearLines(board: number[][]): { board: number[][], cleared: number } {
  const kept = board.filter(row => !row.every(c => c));
  const cleared = ROWS - kept.length;
  const empty = Array.from({ length: cleared }, () => Array(COLS).fill(0));
  return { board: [...empty, ...kept], cleared };
}

function newPiece(): Piece {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  return { shape, x: Math.floor((COLS - shape[0].length) / 2), y: -shape.length };
}

export default function TetrisGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = COLS * CELL * dpr;
    canvas.height = ROWS * CELL * dpr;
    ctx.scale(dpr, dpr);

    let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    let current = newPiece();
    let score = 0;
    let gameOver = false;
    let raf = 0, lastTick = 0;

    function reset() {
      board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
      current = newPiece();
      score = 0;
      gameOver = false;
    }

    function tick() {
      if (gameOver) return;
      const moved = { ...current, y: current.y + 1 };
      if (!collides(board, moved)) {
        current = moved;
      } else {
        board = place(board, current);
        const { board: nb, cleared } = clearLines(board);
        board = nb;
        score += cleared * 100;
        const next = newPiece();
        if (collides(board, next)) { gameOver = true; setTimeout(reset, 600); }
        else { current = next; }
      }
    }

    function sphere(cx: number, cy: number, alpha = 1) {
      const grad = ctx.createRadialGradient(cx - R * 0.28, cy - R * 0.28, 0, cx, cy, R);
      grad.addColorStop(0, `rgba(68,64,58,${alpha})`);
      grad.addColorStop(1, `rgba(22,19,18,${alpha})`);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    function draw() {
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (board[r][c]) sphere(c * CELL + CELL / 2, r * CELL + CELL / 2);

      if (!gameOver) {
        current.shape.forEach((row, r) => row.forEach((cell, c) => {
          if (!cell) return;
          const py = current.y + r;
          if (py >= 0 && py < ROWS)
            sphere((current.x + c) * CELL + CELL / 2, py * CELL + CELL / 2);
        }));
      }

      // Score
      ctx.font = FONT;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(35,31,32,0.18)';
      ctx.fillText(`${score}`, COLS * CELL - 14, 14);

    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        const m = { ...current, x: current.x - 1 };
        if (!collides(board, m)) current = m;
      }
      if (e.key === 'ArrowRight') {
        const m = { ...current, x: current.x + 1 };
        if (!collides(board, m)) current = m;
      }
      if (e.key === 'ArrowDown') {
        const m = { ...current, y: current.y + 1 };
        if (!collides(board, m)) current = m;
      }
      if (e.key === 'ArrowUp') {
        const m = { ...current, shape: rotate(current.shape) };
        if (!collides(board, m)) current = m;
      }
    };
    window.addEventListener('keydown', onKey);

    function loop(ts: number) {
      raf = requestAnimationFrame(loop);
      if (ts - lastTick > TICK) { tick(); lastTick = ts; }
      draw();
    }

    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); };
  }, []);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />;
}
