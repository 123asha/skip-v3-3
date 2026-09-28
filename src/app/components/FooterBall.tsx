/** Three columns of the 5-col page grid — the ball's diameter */
export const FOOTER_BALL_D =
  'calc(3 * (100vw - var(--page-sb, 0px) - 2 * var(--pad) - 4 * var(--gap)) / 5 + 2 * var(--gap))';

const R = 100;

/**
 * One big ball behind the contact form, three columns wide. Instead of a
 * texture sliding across it (which read as odd stripes), the light itself
 * turns slowly round the sphere — the specular glint and the crescent
 * shadow orbit together at a fixed distance from the rim, the way a lamp
 * would look circling a still ball. Base shading stays put underneath.
 */
export function FooterBall() {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg viewBox="-100 -100 200 200" style={{ width: FOOTER_BALL_D, height: FOOTER_BALL_D, overflow: 'visible' }}>
        <defs>
          {/* Base sphere shading — soft and even, so the moving light reads
              clearly against it rather than fighting a second gradient */}
          <radialGradient id="footer-ball-base" gradientUnits="userSpaceOnUse" cx="0" cy="0" r={R * 1.05}>
            <stop offset="0" stopColor="#f2f2f2" />
            <stop offset="1" stopColor="#e2e2e2" />
          </radialGradient>
          {/* The specular glint — a tight bright spot */}
          <radialGradient id="footer-ball-specular" gradientUnits="userSpaceOnUse" cx={-R * 0.4} cy={-R * 0.48} r={R * 0.6}>
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          {/* The crescent — a soft shadow opposite the glint */}
          <radialGradient id="footer-ball-crescent" gradientUnits="userSpaceOnUse" cx={R * 0.42} cy={R * 0.5} r={R * 0.95}>
            <stop offset="0" stopColor="#000000" stopOpacity="0.20" />
            <stop offset="0.7" stopColor="#000000" stopOpacity="0.05" />
            <stop offset="1" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          {/* Contact shadow on the ground beneath the ball */}
          <radialGradient id="footer-ball-drop" gradientUnits="userSpaceOnUse" cx="0" cy={R * 0.98} r={R * 0.75}>
            <stop offset="0" stopColor="#000000" stopOpacity="0.10" />
            <stop offset="1" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <clipPath id="footer-ball-clip">
            <circle r={R} />
          </clipPath>
        </defs>

        <ellipse cx="0" cy={R * 0.98} rx={R * 0.68} ry={R * 0.14} fill="url(#footer-ball-drop)" />
        <circle r={R} fill="url(#footer-ball-base)" />

        {/* The light — glint + crescent — orbits slowly round the sphere,
            clipped to it so nothing pokes past the rim */}
        <g clipPath="url(#footer-ball-clip)">
          <g className="footer-ball-spin">
            <circle r={R} fill="url(#footer-ball-specular)" />
            <circle r={R} fill="url(#footer-ball-crescent)" />
          </g>
        </g>
      </svg>
      <style>{`
        .footer-ball-spin {
          transform-origin: 0 0;
          animation: footerBallSpin 10s linear infinite;
        }
        @keyframes footerBallSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .footer-ball-spin { animation: none; }
        }
      `}</style>
    </div>
  );
}
