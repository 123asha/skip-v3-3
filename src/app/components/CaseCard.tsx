import { useState } from 'react';
import s from './CaseCard.module.css';

/**
 * Shared case card used on every page that lists cases.
 * Two variants only: horizontal 16/9 and vertical 3/4 (via the `ar` prop).
 *
 * On hover the top meta strip and the bottom description strip slide in;
 * between the image rectangle and the description there is a 10px gap.
 */
export type CaseCardAR = '16/9' | '3/4';

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

  return (
    <div
      className={s.card}
      style={{ aspectRatio: ar }}
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

      <div className={s.cardImage}>
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
