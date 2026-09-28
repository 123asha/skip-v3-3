import { useEffect, useRef } from 'react';

/** Three columns of the 5-col page grid — the ball's diameter */
export const FOOTER_BALL_D =
  'calc(3 * (100vw - var(--page-sb, 0px) - 2 * var(--pad) - 4 * var(--gap)) / 5 + 2 * var(--gap))';

const R = 100;

/**
 * One big ball behind the contact form, three columns wide. Bright, soft
 * shading — a wide highlight near the top, a gentle rim shadow, nothing
 * heavy or flat. The light itself turns round the sphere as the page is
 * scrolled (not on its own): the glint and its rim shadow rotate together
 * by an amount tied to how far the page has moved, and simply stay put
 * the rest of the time.
 */
export function FooterBall() {
  const lightRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let angle = 0;
    let lastY = window.scrollY;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      // A full page-height of scroll turns the light about one full turn
      angle = (angle + dy * 0.6) % 360;
      if (lightRef.current) lightRef.current.style.transform = `rotate(${angle}deg)`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg viewBox="-100 -100 200 200" style={{ width: FOOTER_BALL_D, height: FOOTER_BALL_D, overflow: 'visible' }}>
        <defs>
          {/* Base sphere shading — bright and airy, barely darkening toward
              the rim so nothing reads as heavy */}
          <radialGradient id="footer-ball-base" gradientUnits="userSpaceOnUse" cx={-R * 0.15} cy={-R * 0.2} r={R * 1.3}>
            <stop offset="0" stopColor="#fdfdfd" />
            <stop offset="0.6" stopColor="#f4f4f4" />
            <stop offset="1" stopColor="#e9e9e9" />
          </radialGradient>
          {/* The specular glint — a soft bright spot */}
          <radialGradient id="footer-ball-specular" gradientUnits="userSpaceOnUse" cx={-R * 0.4} cy={-R * 0.48} r={R * 0.7}>
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          {/* The rim shadow — light and thin, just enough to read as a curve */}
          <radialGradient id="footer-ball-crescent" gradientUnits="userSpaceOnUse" cx={R * 0.45} cy={R * 0.5} r={R * 0.95}>
            <stop offset="0" stopColor="#000000" stopOpacity="0.10" />
            <stop offset="0.75" stopColor="#000000" stopOpacity="0.02" />
            <stop offset="1" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          {/* Contact shadow on the ground beneath the ball */}
          <radialGradient id="footer-ball-drop" gradientUnits="userSpaceOnUse" cx="0" cy={R * 0.98} r={R * 0.75}>
            <stop offset="0" stopColor="#000000" stopOpacity="0.08" />
            <stop offset="1" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <clipPath id="footer-ball-clip">
            <circle r={R} />
          </clipPath>
        </defs>

        <ellipse cx="0" cy={R * 0.98} rx={R * 0.68} ry={R * 0.14} fill="url(#footer-ball-drop)" />
        <circle r={R} fill="url(#footer-ball-base)" />

        {/* The light — glint + rim shadow — turns with the scroll, clipped
            to the sphere so nothing pokes past the edge */}
        <g clipPath="url(#footer-ball-clip)">
          <g ref={lightRef} style={{ transformOrigin: '0 0' }}>
            <circle r={R} fill="url(#footer-ball-specular)" />
            <circle r={R} fill="url(#footer-ball-crescent)" />
          </g>
        </g>
      </svg>
    </div>
  );
}
