import { useEffect, useRef } from 'react';
import s from './CasesPage.module.css';
import ContactForm from './ContactForm';
import { MagneticDivider } from './MagneticDivider';
import { TEXT_STYLE as textStyle, H2_STYLE as h2Style, typo } from '../utils/typography';
import { useMobile } from '../hooks/useMobile';
import { insightBySlug, shownDate, type Block } from '../content/insights';
import { InsightCards } from './InsightCards';
import { goTo, siteHref } from '../utils/siteNav';

/**
 * An insight's own article page (/insights/<slug>). Only the site's existing type:
 *   - the title at the home headline size, section headings at heading size,
 *     subheadings at --h3-size (between the body text and the headings);
 *   - everything else plain text, black or grey (dates, sources, captions,
 *     notes);
 *   - tables drawn like the case credits (grey header band, hairlines);
 *   - pictures square or 4:5 only.
 * Desktop: one centred column two grid columns wide — date, title and the
 * article all share its width. No entrance animation: it is for reading.
 * Under the article, the three latest other insights.
 * Phone: one column the width of the page.
 */

const muted: React.CSSProperties = { ...textStyle, color: 'var(--c-text-muted)' };

// The home headline exactly: its size, its own tighter leading and tracking
// (ScrollHero; phones: the heading size, via --hero-fs / --hero-lh)
// The article's title in the site's H2; everything else one text size
const titleStyle: React.CSSProperties = { ...h2Style };

// Whatever needs marking out gets a grey marker under the words
const marker: React.CSSProperties = {
  background: 'var(--c-surface)', padding: '1px 4px', margin: '0 -4px',
  boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone',
};

const AR = { square: '1 / 1', vertical: '4 / 5' } as const;

// Text with [label](url) links in it: the links dotted-underlined like the
// site's other inline links, the rest through the typographer
const linkStyle: React.CSSProperties = { color: 'inherit', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' };
// **words** — what used to be bold — get the grey marker instead
function marked(text: string, key: number): React.ReactNode {
  const bits = text.split(/\*\*([^*]+)\*\*/);
  if (bits.length === 1) return <span key={key}>{typo(text)}</span>;
  return <span key={key}>{bits.map((b, k) => k % 2 ? <mark key={k} style={{ ...marker, color: 'inherit' }}>{typo(b)}</mark> : typo(b))}</span>;
}
function rich(text: string): React.ReactNode {
  const parts = text.split(/\[([^\]]+)\]\((https?:[^)\s]+)\)/);
  if (parts.length === 1) return marked(text, 0);
  return parts.map((part, k) => k % 3 === 1
    ? <a key={k} href={parts[k + 1]} target="_blank" rel="noopener noreferrer" style={linkStyle}>{part}</a>
    : k % 3 === 2 ? null : marked(part, k));
}

function Media({ src, shape = 'vertical', ratio, video }: { src: string; shape?: 'square' | 'vertical' | 'auto'; ratio?: number; video?: boolean }) {
  const fill: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
  return (
    <div style={{ aspectRatio: shape === 'auto' ? String(ratio ?? 16 / 9) : AR[shape], width: '100%', overflow: 'hidden', background: 'var(--c-surface)' }}>
      {video || /\.(mp4|webm)$/i.test(src)
        ? <video src={src} autoPlay muted loop playsInline style={fill} />
        : <img src={src} alt="" loading="lazy" style={fill} />}
    </div>
  );
}

function Caption({ text }: { text?: string }) {
  return text ? <p style={{ ...muted, margin: '10px 0 0' }}>{rich(text)}</p> : null;
}

// Space above each kind of block (the first block of the article gets none)
const SPACE_ABOVE: Record<Block['type'], number | string> = {
  p: 'var(--space-xs)', ul: 'var(--space-xs)', ol: 'var(--space-xs)', note: 'var(--space-xs)',
  h2: 'var(--space-md)', h3: 'var(--space-sm)',
  quote: 'var(--space-md)', code: 'var(--space-sm)', table: 'var(--space-sm)', divider: 'var(--space-md)',
  image: 'var(--space-sm)', video: 'var(--space-sm)', gif: 'var(--space-sm)', gallery: 'var(--space-sm)',
};
// …and what follows a heading sits closer to it
const AFTER_HEADING = { h2: 'var(--space-sm)', h3: 'var(--space-xs)' } as const;

function BlockView({ b }: { b: Block }) {
  switch (b.type) {
    case 'h2': return <h2 style={{ ...textStyle, margin: 0 }}>{typo(b.text)}</h2>;
    case 'h3': return <h3 style={{ ...textStyle, margin: 0 }}>{rich(b.text)}</h3>;
    case 'p': return <p style={{ ...textStyle, margin: 0 }}>{rich(b.text)}</p>;
    case 'note': return <p style={{ ...muted, margin: 0 }}>{rich(b.text)}</p>;
    case 'ul':
    case 'ol': {
      const List = b.type;
      return (
        <List style={{ ...textStyle, margin: 0, paddingLeft: '1.2em', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {b.items.map((it, k) => <li key={k} style={{ paddingLeft: '0.2em' }}>{rich(it)}</li>)}
        </List>
      );
    }
    case 'quote':
      // A marked-out passage: plain text, just grey
      return (
        <figure style={{ margin: 0 }}>
          <blockquote style={{ ...muted, margin: 0 }}>{rich(b.text)}</blockquote>
          {b.author && <figcaption style={{ ...muted, marginTop: 10 }}>{b.author}</figcaption>}
        </figure>
      );
    case 'code':
      return (
        // Code (prompts and the like): monospaced, a size smaller, on a grey field
        <pre style={{
          margin: 0, padding: '16px 20px', background: 'var(--c-surface)', color: 'var(--c-text)',
          ...textStyle,
          whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
        }}>{b.text}</pre>
      );
    case 'table': {
      const cols = `repeat(${b.head.length}, minmax(0, 1fr))`;
      return (
        <div>
          {/* Grey header band, then hairlines between rows — none above the
              first row or under the last (the case credits table) */}
          <div style={{ display: 'grid', gridTemplateColumns: cols, columnGap: 'var(--gap)', padding: '8px 10px 12px', margin: '0 -10px', background: 'var(--c-surface)' }}>
            {b.head.map((h, k) => <p key={k} style={{ ...textStyle, margin: 0 }}>{h}</p>)}
          </div>
          {b.rows.map((r, k) => (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: cols, columnGap: 'var(--gap)', padding: '10px 0', borderTop: k === 0 ? 'none' : '1px solid var(--c-border)' }}>
              {r.map((c, j) => <p key={j} style={{ ...textStyle, margin: 0 }}>{rich(c)}</p>)}
            </div>
          ))}
        </div>
      );
    }
    case 'divider':
      return <div style={{ position: 'relative', height: 1 }}><MagneticDivider /></div>;
    case 'image':
    case 'gif':
    case 'video':
      return <div><Media src={b.src} shape={b.shape} ratio={b.type === 'image' ? b.ratio : undefined} video={b.type === 'video'} /><Caption text={b.caption} /></div>;
    case 'gallery':
      return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 4, alignItems: 'start' }}>
            {b.items.map((it, k) => <Media key={k} src={it.src} shape={it.shape} />)}
          </div>
          <Caption text={b.caption} />
        </div>
      );
  }
}

export default function InsightPage({
  slug,
  onNavigatePolicy,
  onGridMode,
}: {
  slug: string;
  onNavigatePolicy?: () => void;
  onGridMode?: (on: boolean) => void;
}) {
  const isMobile = useMobile();
  const pageRef = useRef<HTMLDivElement>(null);
  const article = insightBySlug(slug)!;

  // The page scrolls its own layer — the home page's smooth scroll waits
  useEffect(() => {
    const mainLenis = (window as any).__lenis;
    if (mainLenis) mainLenis.stop();
    const el = pageRef.current!;
    const stopBubble = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener('wheel', stopBubble, { passive: true });
    return () => {
      el.removeEventListener('wheel', stopBubble);
      if (mainLenis) mainLenis.start();
    };
  }, []);

  // Desktop widths in page-grid columns (5 columns, --gap between them)
  const cols = (n: number) => `calc((100% - 4 * var(--gap)) / 5 * ${n} + ${n - 1} * var(--gap))`;
  // Desktop: the list takes column 1, the article from column 2
  const column: React.CSSProperties = isMobile ? {} : { width: cols(2), marginLeft: 'auto', marginRight: 'auto' };

  const blocks = article.blocks ?? [];

  return (
    <div className={s.page} ref={pageRef}>
      <div style={{
        // Same start as the other inner pages' content
        paddingTop: 'var(--inner-content-top)',
        paddingLeft: 'var(--pad)', paddingRight: 'var(--pad)',
      }}>
        <div style={{ position: 'relative' }}>
        {/* Just the date in grey, the title under it — the column's width */}
        <header style={column}>
          <h1 style={{ ...titleStyle, margin: 0, position: 'relative' }}>
            {/* ← back to the insights, hanging one gap left of the title */}
            <a
              href={siteHref('/insights')}
              aria-label="Все инсайты"
              onClick={e => { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); goTo('/insights'); }}
              style={{ ...textStyle, color: 'var(--c-text)', textDecoration: 'none', position: isMobile ? 'static' : 'absolute', display: isMobile ? 'block' : undefined, marginBottom: isMobile ? 10 : 0, right: 'calc(100% + var(--gap))', top: '0.35em' }}
            >←</a>
            {typo(article.desc)}
          </h1>
        </header>

        <article style={{ marginTop: 40 }}>
          <div style={column}>
            {(() => { let depth = 0; return blocks.map((b, k) => {
              const prev = blocks[k - 1];
              // Headings are plain text; what follows one steps in under it
              // (20px under a heading, 40px under a subheading)
              const indent = b.type === 'h2' ? 0 : b.type === 'h3' ? (depth ? 20 : 0) : depth;
              if (b.type === 'h2') depth = 20;
              else if (b.type === 'h3') depth = indent + 20;
              const top = k === 0 ? 0
                : prev && (prev.type === 'h2' || prev.type === 'h3') ? AFTER_HEADING[prev.type]
                : SPACE_ABOVE[b.type];
              return <div key={k} style={{ marginTop: top, paddingLeft: indent }}><BlockView b={b} /></div>;
            }); })()}
          </div>
        </article>
        </div>

        {/* The three newest other insights — the insights page's own cards */}
        <section style={{ marginTop: 'var(--space-xl)' }}>
          <h2 style={{ ...h2Style, margin: '0 0 40px' }}>Другие инсайты</h2>
          <InsightCards exclude={slug} limit={3} flushBottom />
        </section>

        <ContactForm onNavigatePolicy={onNavigatePolicy} onGridMode={onGridMode} />
      </div>
    </div>
  );
}
