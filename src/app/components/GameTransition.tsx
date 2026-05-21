import { useEffect, useRef } from 'react';

const CELL = 20;
const DURATION = 700;

type Particle = {
  sx: number; sy: number;   // source grid position
  x: number; y: number;     // current pixel position
  tx: number; ty: number;   // scatter target
  color: string;
  vx: number; vy: number;
};

interface Props {
  fromCanvas: HTMLCanvasElement | null;
  toColor: string;
  width: number;
  height: number;
  onDone: () => void;
}

export default function GameTransition({ fromCanvas, toColor, width, height, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = width;
    canvas.height = height;

    const cols = Math.floor(width / CELL);
    const rows = Math.floor(height / CELL);
    const particles: Particle[] = [];

    const sampleColor = (src: CanvasRenderingContext2D, srcW: number, srcH: number, c: number, r: number): string => {
      const px = Math.floor((c * CELL + CELL / 2) * (srcW / width));
      const py = Math.floor((r * CELL + CELL / 2) * (srcH / height));
      const i = (Math.min(py, srcH - 1) * srcW + Math.min(px, srcW - 1)) * 4;
      const d = src.getImageData(px, py, 1, 1).data;
      return `rgb(${d[0]},${d[1]},${d[2]})`;
    };

    // Create a particle for EVERY cell in the grid (consistent 30×17=510 particles)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let color = '#ffffff';

        if (fromCanvas) {
          const src = fromCanvas.getContext('2d');
          if (src) {
            const px = Math.floor((c * CELL + CELL / 2) * (fromCanvas.width / width));
            const py = Math.floor((r * CELL + CELL / 2) * (fromCanvas.height / height));
            const clampedPx = Math.min(px, fromCanvas.width - 1);
            const clampedPy = Math.min(py, fromCanvas.height - 1);
            const data = src.getImageData(clampedPx, clampedPy, 1, 1).data;
            color = `rgb(${data[0]},${data[1]},${data[2]})`;
          }
        }

        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3.5;

        particles.push({
          sx: c * CELL,
          sy: r * CELL,
          x: c * CELL,
          y: r * CELL,
          // Scatter to random positions nearby
          tx: c * CELL + (Math.random() - 0.5) * width * 1.4,
          ty: r * CELL + (Math.random() - 0.5) * height * 1.4,
          color,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        });
      }
    }

    const start = performance.now();
    let raf: number;

    function loop(now: number) {
      const t = Math.min((now - start) / DURATION, 1);
      // ease: accelerate out then decelerate in
      const easeOut = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      for (const p of particles) {
        // First half: scatter; second half: no extra velocity
        p.vx *= 0.88;
        p.vy *= 0.88;

        if (t < 0.5) {
          // Scatter phase: move towards scatter target
          p.x += (p.tx - p.x) * 0.06 + p.vx;
          p.y += (p.ty - p.y) * 0.06 + p.vy;
        } else {
          // Return phase: move back to original grid position
          p.x += (p.sx - p.x) * 0.1;
          p.y += (p.sy - p.y) * 0.1;
        }

        ctx.globalAlpha = 1;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, CELL - 2, CELL - 2);
      }

      if (t < 1) {
        raf = requestAnimationFrame(loop);
      } else {
        onDone();
      }
    }

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 10 }}
    />
  );
}
