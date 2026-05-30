import { useState } from 'react';
import { useMobile } from '../hooks/useMobile';
import s from './CaseCard.module.css';

/**
 * Shared case card used on every page that lists cases.
 * Two variants only: horizontal and vertical (via the `ar` prop).
 *
 * The aspect ratios live in a single place — `CASE_AR_H` / `CASE_AR_V`. Change
 * them here and every gallery, instruments block and case template picks up
 * the new value automatically.
 *
 * On hover the top meta strip and the bottom description strip slide in;
 * between the image rectangle and the description there is a 10px gap.
 */
export const CASE_AR_H = '16/9' as const;
export const CASE_AR_V = '5/6'  as const;
export type CaseCardAR = typeof CASE_AR_H | typeof CASE_AR_V;

export interface CaseCardProps {
  ar: CaseCardAR;
  title: string;          // top meta label (project / case name)
  desc: string;           // bottom description text
  image?: string;         // optional image url (omit for plain placeholder)
  onClick?: () => void;
  linkLabel?: string;     // defaults to "Перейти"
}

export default function CaseCard({
  ar, title, desc, image, onClick, linkLabel = 'Перейти',
}: CaseCardProps) {
  const [hovered, setHovered] = useState(false);
  const isMobile = useMobile();

  // ── Mobile: image at its natural AR, title + desc always visible below ──
  if (isMobile) {
    return (
      <div className={s.card} onClick={onClick}>
        <div className={s.cardImage} style={{ aspectRatio: ar, width: '100%', flex: 'none' }}>
          {image && <img src={image} alt={title} loading="lazy" />}
        </div>
        <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <p style={{ margin: 0, lineHeight: 'var(--text-lh)', letterSpacing: 'var(--text-ls)', fontSize: 'var(--text-size)' }}>{title}</p>
          <p style={{ margin: 0, lineHeight: 'var(--text-lh)', letterSpacing: 'var(--text-ls)', fontSize: 'var(--text-size)' }}>{desc}</p>
        </div>
      </div>
    );
  }

  // ── Desktop: hover-driven reveal ────────────────────────────────────────
  const isHorizontal = ar === CASE_AR_H;
  // Horizontal cards: image initially is taller (4/3) and becomes CASE_AR_H on hover.
  // Vertical cards: card outer is fixed to CASE_AR_V, image fills remaining space.
  const imageStyle: React.CSSProperties = isHorizontal
    ? { aspectRatio: hovered ? CASE_AR_H : '4/3', transition: 'aspect-ratio 0.3s ease', width: '100%' }
    : { flex: 1 };
  const cardStyle: React.CSSProperties = isHorizontal
    ? {}
    : { aspectRatio: ar };

  return (
    <div
      className={s.card}
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div
        className={s.cardMeta}
        style={{ height: hovered ? '36px' : '0', paddingTop: hovered ? '10px' : '0' }}
      >
        <p className={s.cardMetaText} style={{ opacity: hovered ? 1 : 0 }}>{title}</p>
      </div>

      <div className={s.cardImage} style={imageStyle}>
        {image && (
          <img
            src={image}
            alt={title}
            loading="lazy"
            style={{
              transform: hovered ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1)',
            }}
          />
        )}
      </div>

      <div
        className={s.cardBottom}
        style={{
          height: hovered ? '36px' : '0',
          paddingBottom: hovered ? '10px' : '0',
          marginTop: hovered ? 10 : 0,
        }}
      >
        <p className={s.cardBottomText} style={{ opacity: hovered ? 1 : 0 }}>
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {desc}
          </span>
          <span className={s.cardLink}>{linkLabel}</span>
        </p>
      </div>
    </div>
  );
}
