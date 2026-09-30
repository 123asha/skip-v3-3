import s from '../App.module.css';
import { sound } from '../sound/Sound';

/**
 * The site has exactly two buttons:
 *   primary   — the black pill («написать нам»)
 *   secondary — the grey pill («больше проектов», «Перейти»)
 *
 * Both are the same shape and both flip on hover (the cube rotation defined in
 * App.module.css), so hovering any button on the site feels identical.
 */
export default function PillButton({
  children, variant = 'secondary', href, onClick, icon, style, fullWidth, compact,
}: {
  /** The smaller pill (one text line + 8px / 9px) — same flip, less height */
  compact?: boolean;
  /** Stretch to the full width of its container */
  fullWidth?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  href?: string;
  onClick?: () => void;
  /** Optional leading glyph — rendered in a square slot before the label */
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const primary = variant === 'primary';

  const face: React.CSSProperties = {
    background: primary ? 'var(--c-text)' : 'var(--c-surface)',
    color: primary ? '#fff' : 'var(--c-text)',
    height: compact ? undefined : 44,
    paddingLeft: icon ? 0 : compact ? 14 : 16,
    paddingRight: compact ? 14 : 16,
    paddingTop: compact ? 8 : undefined,
    paddingBottom: compact ? 9 : 3,
    borderRadius: 4,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: icon ? 10 : 0,
    whiteSpace: 'nowrap',
    ...(fullWidth ? { width: '100%', boxSizing: 'border-box' as const } : null),
  };

  const inner = (
    <span className={s.newProjectFlipInner} style={fullWidth ? { width: '100%' } : undefined}>
      {[0, 1].map(f => (
        <span
          key={f}
          className={f === 0 ? s.newProjectFace : `${s.newProjectFace} ${s.newProjectFaceBottom}`}
          // Cube depth = half the pill's height (the CSS default suits 32px)
          style={compact ? { ...face, transform: f === 0 ? 'translateZ(18px)' : 'rotateX(-90deg) translateZ(18px)' } : face}
        >
          {icon && (
            <span style={{ width: 44, height: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {icon}
            </span>
          )}
          {children}
        </span>
      ))}
    </span>
  );

  const shared: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    padding: 0,
    margin: 0,
    cursor: 'pointer',
    fontFamily: 'var(--font)',
    fontSize: 'var(--text-size)',
    fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
    lineHeight: 'var(--text-lh)',
    letterSpacing: 'var(--text-ls)',
    textDecoration: 'none',
    display: 'inline-block',
    perspective: 'none',
    color: primary ? '#fff' : 'var(--c-text)',
    ...(fullWidth ? { display: 'block', width: '100%' } : null),
    ...style,
  };

  const hover = () => sound.play('hover');

  return href ? (
    <a
      className={s.newProjectBtn}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={hover}
      onClick={e => e.stopPropagation()}
      style={shared}
    >{inner}</a>
  ) : (
    <button className={s.newProjectBtn} onMouseEnter={hover} onClick={onClick} style={shared}>
      {inner}
    </button>
  );
}
