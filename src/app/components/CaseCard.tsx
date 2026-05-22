import { useState } from 'react';
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

  const isHorizontal = ar === CASE_AR_H;
  // Horizontal cards: image initially is taller (4/3) and becomes CASE_AR_H on hover.
  //                   The card outer has no fixed aspect-ratio — it grows to fit.
  // Vertical cards (CASE_AR_V): unchanged — card outer is fixed to CASE_AR_V,
  //                              image fills the space left after meta/bottom
  //                              appear on hover.
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
        {image && <img src={image} alt={title} />}
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
