import { useEffect, useRef, useState } from 'react';
import { sound, SOUND_BUS } from './Sound';

/**
 * SoundIcon — flat horizontal line when sound is off, wavy/animated when on.
 * Tap toggles the global SOUND_BUS state. The line lives in an SVG so it
 * stays crisp at any zoom; the wave is animated via a path d-attribute
 * updated on every RAF when active.
 */
export default function SoundIcon({ width = 22 }: { width?: number }) {
  const pathRef = useRef<SVGPathElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => SOUND_BUS.subscribe(setOn), []);

  useEffect(() => {
    if (!on) {
      // Flat line — single update is enough
      if (pathRef.current) pathRef.current.setAttribute('d', flat(width));
      return;
    }
    let raf = 0;
    let t = 0;
    const tick = () => {
      t += 0.07;
      if (pathRef.current) pathRef.current.setAttribute('d', wave(width, t));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, width]);

  return (
    <button
      aria-label={on ? 'Выключить звук' : 'Включить звук'}
      onClick={() => sound.toggle()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        padding: 0,
        margin: 0,
        cursor: 'pointer',
        color: 'inherit',
        height: 12,
      }}
    >
      <svg width={width} height={12} viewBox={`0 0 ${width} 12`} fill="none">
        <path
          ref={pathRef}
          d={flat(width)}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </button>
  );
}

function flat(w: number) {
  return `M0 6 L${w} 6`;
}

/** Animated wave that travels left → right, amplitude ≈ 3 px. */
function wave(w: number, t: number) {
  const cy = 6;
  const steps = Math.max(8, Math.round(w));
  let d = `M0 ${cy}`;
  for (let i = 1; i <= steps; i++) {
    const x = (i / steps) * w;
    const y = cy + Math.sin(i * 0.6 + t) * 3 * Math.sin(i * 0.18 + t * 0.5);
    d += ` L${x.toFixed(1)} ${y.toFixed(2)}`;
  }
  return d;
}
