import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
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

// Temporary: render every card preview as a plain grey rectangle (no image/video)
// until the real card thumbnails are ready. Flip to false to restore images.
const PLACEHOLDER_PREVIEWS = true;

export interface CaseCardProps {
  ar: CaseCardAR;
  title: string;          // top meta label (project / case name)
  desc: string;           // bottom description text
  services?: string;      // caption ABOVE the card — the project year (e.g. "2025")
  servicesSize?: string | number; // font size for that caption (shrinks with the grid zoom)
  metaSize?: string | number; // font size for the bottom name + description (shrinks with the grid zoom)
  image?: string;         // optional image url (omit for plain placeholder)
  video?: string;         // optional hover video (desktop only — mobile shows image)
  onClick?: () => void;
  linkLabel?: string;     // defaults to "Перейти"
}

// Black "what was done" caption that sits 10px above the card image.
const servicesStyle: React.CSSProperties = {
  fontFamily: 'var(--font)',
  fontSize: 'var(--text-size)',
  fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
  lineHeight: 'var(--text-lh)',
  letterSpacing: 'var(--text-ls)',
  color: 'var(--c-text)',
  margin: 0,
  marginBottom: 10,
};

export default function CaseCard({
  ar, title, desc, services, servicesSize, metaSize, image: rawImage, video: rawVideo, onClick, linkLabel = 'Перейти',
}: CaseCardProps) {
  // Per-card caption style — size overridable so it scales with the grid zoom.
  const svcStyle: React.CSSProperties = servicesSize != null
    ? { ...servicesStyle, fontSize: servicesSize }
    : servicesStyle;
  // Bottom name + description — same proportional shrink as the grid zooms.
  const metaStyle: React.CSSProperties = metaSize != null ? { fontSize: metaSize } : {};
  // Force grey placeholder previews while PLACEHOLDER_PREVIEWS is on.
  const image = PLACEHOLDER_PREVIEWS ? undefined : rawImage;
  const video = PLACEHOLDER_PREVIEWS ? undefined : rawVideo;
  const [hovered, setHovered]  = useState(false);
  const isMobile = useMobile();
  const cardRef     = useRef<HTMLDivElement>(null);
  const titleRef    = useRef<HTMLParagraphElement>(null);
  const descRef     = useRef<HTMLParagraphElement>(null);
  const servicesRef = useRef<HTMLParagraphElement>(null);

  const isHorizontal = ar === CASE_AR_H;
  // Image height / width at rest (horizontal cards are a touch taller, 4/3).
  const restRatioHW = isHorizontal ? 3 / 4 : 6 / 5;

  // Fixed height = title row (+ 10px gap) + image + year row (+ 10px gap).
  // Desc uses grid-template-rows 0fr→1fr so no height measurement needed.
  const [cardH, setCardH] = useState<number | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const w = cardRef.current?.offsetWidth ?? 0;
      if (!w) return;
      const imgH   = w * restRatioHW;
      const titleH = titleRef.current?.offsetHeight ?? 0;
      const yearH  = servicesRef.current ? servicesRef.current.offsetHeight + 10 : 0;
      setCardH(Math.round(titleH + 10 + imgH + yearH));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [services, servicesSize, metaSize, restRatioHW]);

  // Description reveals word-by-word on hover (GSAP, same feel as the services
  // detail); hidden again when the pointer leaves.
  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    const words = el.querySelectorAll<HTMLElement>('[data-word]');
    if (!words.length) return;
    gsap.killTweensOf(words);
    if (hovered) {
      gsap.fromTo(words, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out', stagger: 0.02 });
    } else {
      gsap.to(words, { y: -10, opacity: 0, duration: 0.2, ease: 'power2.in' });
    }
  }, [hovered]);

  // ── Mobile: image, then a caption ROW below it — name left, description right
  //    (same layout as desktop, but the description is always visible since
  //    there's no hover on touch). ──
  if (isMobile) {
    return (
      <div className={s.card} onClick={onClick}>
        {services && <p style={svcStyle}>{services}</p>}
        <div className={s.cardImage} style={{ aspectRatio: ar, width: '100%', flex: 'none' }}>
          {image && <img src={image} alt={title} loading="lazy" />}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--gap)', alignItems: 'flex-start', paddingTop: 10 }}>
          <p className={`${s.cardMetaText} ${s.cardLink}`} style={{ margin: 0, ...metaStyle }}>{title}</p>
          <p className={s.cardMetaText} style={{ margin: 0, textAlign: 'left', ...metaStyle }}>{desc}</p>
        </div>
      </div>
    );
  }

  // ── Desktop: title top, image middle (flex:1), year (grey) bottom.
  //    Desc reveals beside title via grid-template-rows — no height measurement.
  return (
    <div
      ref={cardRef}
      className={s.card}
      style={{ height: cardH ?? undefined, display: 'flex', flexDirection: 'column', overflow: 'visible' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Title — at top */}
      <p ref={titleRef} className={`${s.cardMetaText} ${s.cardLink}`} style={{ margin: 0, paddingBottom: 10, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...metaStyle }}>{title}</p>

      {/* Image — flex:1 */}
      <div
        className={s.cardImage}
        style={cardH == null
          ? { aspectRatio: isHorizontal ? '4/3' : '5/6', width: '100%' }
          : { flex: 1, minHeight: 0, width: '100%', overflow: 'hidden' }}
      >
        {video && !isMobile && (
          <video
            src={video}
            muted
            playsInline
            loop
            ref={el => {
              if (!el) return;
              if (hovered) { el.currentTime = 0; el.play().catch(() => {}); }
              else { el.pause(); el.currentTime = 0; }
            }}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.4s ease',
              pointerEvents: 'none',
            }}
          />
        )}
        {image && (
          <img
            src={image}
            alt={title}
            loading="lazy"
            style={{
              objectPosition: 'top',
              transform: hovered ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1)',
            }}
          />
        )}
      </div>

      {/* Year + description — bottom row, baseline-aligned */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 'var(--gap)', alignItems: 'flex-end', paddingTop: 10, flexShrink: 0 }}>
        {services
          ? <p ref={servicesRef} className={s.cardMetaText} style={{ margin: 0, opacity: 'var(--opacity-muted)' as any, ...metaStyle }}>{services}</p>
          : <span ref={servicesRef} />
        }
        <div style={{ display: 'grid', gridTemplateRows: hovered ? '1fr' : '0fr', transition: 'grid-template-rows 0.35s ease', minWidth: 0 }}>
          <div style={{ overflow: 'hidden' }}>
            <p ref={descRef} className={s.cardMetaText} style={{ margin: 0, ...metaStyle }}>
              {desc.split(' ').map((w, i, arr) => (
                <span key={i}>
                  <span data-word style={{ display: 'inline-block', opacity: 0, willChange: 'transform' }}>{w}</span>
                  {i < arr.length - 1 ? ' ' : ''}
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
