// Telegram + LinkedIn circles for the footer — one definition for the desktop
// corner and the phone footer
export default function SocialLinks({ onLight = false, size = 24 }: {
  /** Circle diameter, px (the icons scale with it) */
  size?: number;
  /** Drawn plainly on the light page (dark circles) instead of for the
   *  difference-blended corners (white circles that invert to dark) */
  onLight?: boolean;
} = {}) {
  const circle: React.CSSProperties = {
    width: size, height: size, borderRadius: '50%',
    background: onLight ? 'var(--c-text)' : '#fff',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    color: onLight ? '#fff' : '#000', textDecoration: 'none',
    transition: 'opacity 0.2s ease',
  };
  return (
    <>
      <a href="https://t.me/skpdsgn" target="_blank" rel="noreferrer" aria-label="Telegram" style={circle}>
        <svg width={13 * size / 24} height={13 * size / 24} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: 'translate(-0.5px, 0.5px)' }}>
          <path d="M22 4 2.5 11.5l5.6 1.9 2.2 7 3.7-3.6 5.2 3.8L22 4Zm-5.3 4.6-8 7.2-2.5-.9 10.5-6.3Zm-6 9.2 1.2-3.6 6.4 4.7-3.4-1.5-4.2.4Z" fill="currentColor" />
        </svg>
      </a>
      <a href="https://ru.linkedin.com/company/skipdesign" target="_blank" rel="noreferrer" aria-label="LinkedIn" style={circle}>
        <svg width={13 * size / 24} height={13 * size / 24} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: 'translateY(-1px)' }}>
          <path d="M6.94 5a2 2 0 1 1-4-.001 2 2 0 0 1 4 .001ZM7 8.48H3V21h4V8.48Zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68Z" fill="currentColor"/>
        </svg>
      </a>
    </>
  );
}
