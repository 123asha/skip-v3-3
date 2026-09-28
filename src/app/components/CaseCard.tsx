import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useMobile } from '../hooks/useMobile';
import { typo } from '../utils/typography';
import s from './CaseCard.module.css';
import { t } from '../i18n';

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
export const CASE_AR_V = '4/5'  as const;
export type CaseCardAR = typeof CASE_AR_H | typeof CASE_AR_V;

// Temporary: render every card preview as a plain grey rectangle (no image/video)
// until the real card thumbnails are ready. Flip to false to restore images.
const PLACEHOLDER_PREVIEWS = true;

// Temporary: hide the grey category tags (services) at rest — just the title
// shows, and the description still reveals on hover as before. Flip to true
// to bring the tags back.
const SHOW_CATEGORY_TAGS = false;

// Case previews are squares and 4:5 rectangles only for now — no circles.
// Flip to true to bring the round previews back.
const ROUND_PREVIEWS = false;

// Some previews round, the rest square — picked from the title so a case
// keeps its shape across reloads and pages. Exported so a gallery can balance
// how many round cards land in the same row before it hands out the props.
export function isCaseRound(title: string): boolean {
  return [...title].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0) % 2 === 0;
}

export interface CaseCardProps {
  ar: CaseCardAR;
  title: string;          // top meta label (project / case name)
  desc: string;           // bottom description text
  showCats?: boolean;     // grey categories in the description's spot, even with SHOW_CATEGORY_TAGS off
  services?: string;      // caption ABOVE the card — the project year (e.g. "2025")
  servicesSize?: string | number; // font size for that caption (shrinks with the grid zoom)
  metaSize?: string | number; // font size for the bottom name + description (shrinks with the grid zoom)
  image?: string;         // optional image url (omit for plain placeholder)
  preview?: string;       // real preview — shown even while PLACEHOLDER_PREVIEWS is on
  video?: string;         // optional hover video (desktop only — mobile shows image)
  onClick?: () => void;
  linkLabel?: string;     // defaults to "Перейти"
  hideMeta?: boolean;     // dense grids (>4 cols): drop the title + description
  hideImage?: boolean;    // densest grid: no preview at all, the card is text only
  /** Override the preview's proportions (e.g. a full-width card that would be
   *  far too tall at the usual 4/3) */
  aspect?: string;
  /** Clip scrubbed by the scroll instead of a still — the card's travel
   *  through the viewport maps onto the clip's timeline, so it opens up as the
   *  page moves. Desktop only; touch gets plain autoplay. */
  scrubVideo?: string;
  /** Force round or square instead of the title-hash default — used where a
   *  page needs to control exactly how many/which cards are round */
  round?: boolean;
}

// Black "what was done" caption that sits 10px above the card image.
const servicesStyle: React.CSSProperties = {
  fontFamily: 'var(--font)',
  fontSize: 'var(--text-size)',
  fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
  lineHeight: 'var(--text-lh)',
  letterSpacing: 'var(--text-ls)',
  color: 'var(--c-text)',
  marginTop: 0,
  marginLeft: 0,
  marginRight: 0,
  marginBottom: 10,
};

export default function CaseCard({
  ar, title, desc, services, showCats, servicesSize, metaSize, image: rawImage, preview, video: rawVideo, onClick, linkLabel = 'Перейти', hideMeta = false, hideImage = false, aspect, scrubVideo, round,
}: CaseCardProps) {
  // Per-card caption style — size overridable so it scales with the grid zoom.
  const svcStyle: React.CSSProperties = servicesSize != null
    ? { ...servicesStyle, fontSize: servicesSize }
    : servicesStyle;
  // Bottom name + description — same proportional shrink as the grid zooms.
  const metaStyle: React.CSSProperties = metaSize != null ? { fontSize: metaSize } : {};
  // Force grey placeholder previews while PLACEHOLDER_PREVIEWS is on.
  // A real preview, when a case has one, shows even over the placeholders
  const image = preview ?? (PLACEHOLDER_PREVIEWS ? undefined : rawImage);
  const video = PLACEHOLDER_PREVIEWS ? undefined : rawVideo;
  const [hovered, setHovered]  = useState(false);
  const isMobile = useMobile();
  const cardRef     = useRef<HTMLDivElement>(null);
  const titleRef    = useRef<HTMLParagraphElement>(null);
  const descRef     = useRef<HTMLParagraphElement>(null);
  const servicesRef = useRef<HTMLParagraphElement>(null);
  const catsRef     = useRef<HTMLParagraphElement>(null);

  const isHorizontal = ar === CASE_AR_H;
  // For now every preview is round, wherever cases are listed
  // The flagship (a card given its own proportions, e.g. the full-width one)
  // always keeps those instead of round/square.
  const isRound = !aspect && (round ?? (ROUND_PREVIEWS && isCaseRound(title)));

  // No fixed card height: the image always keeps its aspect ratio and the
  // description row always reserves its space (only its text fades in on
  // hover), so the image never shrinks and the card never changes height.

  // Description reveals line by line, each line rising from below. Words are
  // grouped by their laid-out offsetTop, so a whole line moves as one — no
  // left-to-right sweep inside it. In: top line first. Out: bottom line first,
  // so the text leaves the way it arrived, in reverse.
  const LINE_REVEAL = { duration: 0.4, ease: 'power3.out' };
  const LINE_STAGGER = 0.08;   // seconds between consecutive lines
  const LINE_Y = 12;           // px — how far below a line rests when hidden

  // Resting state — set once (and after the copy or layout changes) so every
  // tween can run as a plain `to()`. Interrupting a hover then picks up from
  // wherever the words are instead of snapping back to the start.
  useLayoutEffect(() => {
    const el = descRef.current;
    if (!el) return;
    const words = el.querySelectorAll<HTMLElement>('[data-word]');
    if (!words.length) return;
    gsap.set(words, { y: LINE_Y, opacity: 0 });
  }, [desc]);

  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    const words = Array.from(el.querySelectorAll<HTMLElement>('[data-word]'));
    if (!words.length) return;
    gsap.killTweensOf(words);

    // Group words into visual lines (offsetTop ignores our transforms)
    const byLine = new Map<number, HTMLElement[]>();
    words.forEach(w => {
      const top = Math.round(w.offsetTop);
      const line = byLine.get(top);
      if (line) line.push(w);
      else byLine.set(top, [w]);
    });
    const lines = [...byLine.entries()].sort((a, b) => a[0] - b[0]).map(([, ws]) => ws);

    // The grey categories make way: up and out as the first line rises in,
    // back down once the description has gone
    const cats = catsRef.current;
    if (cats) {
      gsap.killTweensOf(cats);
      const muted = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--opacity-muted')) || 0.4;
      // Rise up and out as the description comes in; back down once it's gone
      gsap.killTweensOf(cats);
      gsap.to(cats, hovered
        ? { y: -LINE_Y, opacity: 0, ...LINE_REVEAL, duration: 0.3 }
        : { y: 0, opacity: muted, ...LINE_REVEAL, delay: lines.length * LINE_STAGGER });
    }

    lines.forEach((line, i) => {
      const delay = (hovered ? i : lines.length - 1 - i) * LINE_STAGGER;
      gsap.to(line, {
        y: hovered ? 0 : LINE_Y,
        opacity: hovered ? 1 : 0,
        ...LINE_REVEAL,
        delay,
        overwrite: 'auto',
      });
    });
  }, [hovered]);

  // ── Mobile: image, then a caption ROW below it — name left, description right
  //    (same layout as desktop, but the description is always visible since
  //    there's no hover on touch). ──
  if (isMobile) {
    return (
      <div className={s.card} onClick={onClick}>
        {services && <p style={svcStyle}>{services}</p>}
        <div className={s.cardImage} style={{ aspectRatio: ar, width: '100%', flex: 'none', ...(PLACEHOLDER_PREVIEWS ? { background: 'var(--c-surface)' } : null) }}>
          {image && <img src={image} alt={title} loading="lazy" />}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--gap)', alignItems: 'flex-start', paddingTop: 10 }}>
          <p className={s.cardMetaText} style={{ margin: 0, textAlign: 'left', ...metaStyle }}>{typo(desc)}</p>
          <p className={`${s.cardMetaText} ${s.cardLink}`} style={{ margin: 0, ...metaStyle }}>{title}</p>
        </div>
      </div>
    );
  }

  // ── Desktop: year on top, image (fixed aspect ratio), then title + desc.
  //    The image never resizes — the desc row keeps its space at all times.
  return (
    <div
      ref={cardRef}
      className={s.card}
      style={{ display: 'flex', flexDirection: 'column', overflow: 'visible' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Year — at top */}
      {/* The flagship (a card given its own proportions) is just the big
          picture — no year, no title, no description */}
      {/* On a full preview the categories live in the description's spot
          instead (below); up here only when that spot isn't shown */}
      {SHOW_CATEGORY_TAGS && services && !aspect && (hideMeta || hideImage) && <p ref={servicesRef} className={s.cardMetaText} style={{ margin: 0, paddingBottom: hideImage ? 4 : 10, flexShrink: 0, opacity: 'var(--opacity-muted)' as any, ...metaStyle }}>{services}</p>}

      {/* Image — always its own aspect ratio, never squeezed by the desc.
          Dropped entirely on the densest grid: the card is text only. */}
      {!hideImage && (
        <div
          className={`${s.cardImage}${isRound ? ` ${s.cardRound}` : ''}${aspect ? ` ${s.cardWide}` : ''}${!isRound && !aspect && !isHorizontal ? ` ${s.cardTall}` : ''}`}
          style={{ aspectRatio: aspect ?? (isHorizontal ? '4/3' : '4/5'), width: '100%', flexShrink: 0, ...(PLACEHOLDER_PREVIEWS ? { background: 'var(--c-surface)' } : null) }}
        >
          {scrubVideo && !PLACEHOLDER_PREVIEWS && (
            <video
              src={scrubVideo}
              muted
              playsInline
              preload="auto"
              autoPlay
              loop
              // Above the still: the looping clip is the preview here.
              // Sized the same 12%-oversize as the still image below it (see
              // .cardImage img in the CSS module) so it fully covers that
              // image — same edges, nothing of the still peeking round it.
              style={{ position: 'absolute', left: '-6%', top: '-6%', width: '112%', height: '112%', objectFit: 'cover', zIndex: 1 }}
            />
          )}
          {/* No hover video: the preview never swaps to another picture */}
          {image && (
            <img
              src={image}
              alt={title}
              loading="lazy"
              style={{
                objectPosition: 'center',
              }}
            />
          )}
        </div>

      )}

      {/* Title + description — bottom row, top-aligned so the title lines up
          with the description's first line regardless of how many lines the
          description wraps to.
          Title column has a floor (minmax) so short-but-not-tiny names like
          "AliExpress" / "Senior*s bar" don't get ellipsis-truncated on the
          narrower cards in the scattered grid. */}
      {/* The title always shows; on dense grids (hideMeta) only the
          description column is dropped, since the card gets too narrow.
          Without a preview the card is a plain entry — no hover copy, and the
          year sits right above the title. */}
      {!aspect && <div style={{ display: 'grid', gridTemplateColumns: hideMeta || hideImage ? '1fr' : 'minmax(90px, 1fr) minmax(0, 3fr)', gap: 'var(--gap)', alignItems: 'flex-start', paddingTop: hideImage ? 0 : 10, flexShrink: 0 }}>
        <p ref={titleRef} className={`${s.cardMetaText} ${s.cardLink}`} style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...metaStyle }}>{title}</p>
        {/* Space is always reserved — only the words fade/slide in on hover
            (see the GSAP effect above), so nothing around this shifts. */}
        {/* No clipping wrapper — the lines simply fade in as they rise, so
            nothing reads as cut off by an invisible box. */}
        {!hideMeta && !hideImage && (
          <div style={{ minWidth: 0 }}>
            <div style={{ position: 'relative' }}>
              {/* At rest the description's spot shows the categories, grey;
                  on hover the description rises in and pushes them up and out */}
              {(SHOW_CATEGORY_TAGS || showCats) && services && (
                <p ref={catsRef} className={s.cardMetaText} style={{ margin: 0, position: 'absolute', left: 0, top: 0, opacity: 'var(--opacity-muted)' as any, pointerEvents: 'none', ...metaStyle }}>{services}</p>
              )}
              <p ref={descRef} className={s.cardMetaText} style={{ margin: 0, ...metaStyle }}>
                {typo(t(desc)).split(' ').map((w, i, arr) => (
                  <span key={i}>
                    <span data-word style={{ display: 'inline-block', opacity: 0, willChange: 'transform' }}>{w}</span>
                    {i < arr.length - 1 ? ' ' : ''}
                  </span>
                ))}
              </p>
            </div>
          </div>
        )}
      </div>}
    </div>
  );
}
