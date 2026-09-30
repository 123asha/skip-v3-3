import { useEffect, useId } from 'react';
import { playKnock } from '../utils/knock';

const R = 100;

/**
 * One ball for the empty middle of an opened service row: it drops in from
 * above, bounces to rest and then hovers there, its ground shadow breathing
 * with it. Shaded like the footer ball (bright, soft, no letter). The motion
 * is plain CSS (see `svcBall*` in styles/index.css); reduced-motion users get
 * the ball standing still. `leaving` — the row is closing: the ball flies back
 * up the way it came.
 */
export function ServiceBall({ leaving = false }: { leaving?: boolean }) {
  const id = useId().replace(/:/g, '');
  // A knock on each landing — timed to the drop keyframes (svcBallDrop, 1.1s:
  // the first hit at 45%, the smaller second bounce at 84%). Same sound as the
  // balls in the service tiles.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t1 = window.setTimeout(() => playKnock(0.8), 495);
    const t2 = window.setTimeout(() => playKnock(0.25), 924);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div className={`svcBall${leaving ? ' svcBallLeaving' : ''}`} aria-hidden="true">
      <svg className="svcBallShadow" viewBox="-100 -20 200 40">
        <defs>
          <radialGradient id={`${id}-drop`} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#000" stopOpacity="0.07" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="0" cy="0" rx="70" ry="14" fill={`url(#${id}-drop)`} />
      </svg>
      <svg className="svcBallBody" viewBox="-100 -100 200 200">
        <defs>
          <radialGradient id={`${id}-base`} gradientUnits="userSpaceOnUse" cx={-R * 0.15} cy={-R * 0.2} r={R * 1.3}>
            <stop offset="0" stopColor="#fdfdfd" />
            <stop offset="0.6" stopColor="#f4f4f4" />
            <stop offset="1" stopColor="#e9e9e9" />
          </radialGradient>
          <radialGradient id={`${id}-spec`} gradientUnits="userSpaceOnUse" cx={-R * 0.4} cy={-R * 0.48} r={R * 0.7}>
            <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-rim`} gradientUnits="userSpaceOnUse" cx={R * 0.45} cy={R * 0.5} r={R * 0.95}>
            <stop offset="0" stopColor="#000" stopOpacity="0.10" />
            <stop offset="0.75" stopColor="#000" stopOpacity="0.02" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle r={R} fill={`url(#${id}-base)`} />
        <circle r={R} fill={`url(#${id}-spec)`} />
        <circle r={R} fill={`url(#${id}-rim)`} />
      </svg>
    </div>
  );
}
