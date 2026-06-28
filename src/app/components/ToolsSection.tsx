import { useState } from 'react';
import { useMobile } from '../hooks/useMobile';
import s from '../App.module.css';
import { asset } from '../utils/asset';

export const TOOL_TEXT: React.CSSProperties = {
  fontFamily: 'var(--font)',
  fontSize: 'var(--text-size)',
  fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
  lineHeight: 'var(--text-lh)',
  letterSpacing: 'var(--text-ls)',
  color: 'var(--c-text)',
};

export const TOOL_CARDS: { label: string; caseTitle: string; ar: '16/9' | '1/1'; href?: string; image?: string }[] = [
  { label: 'Конструктор миссии',   caseTitle: 'На вопрос «Почему мы этим занимаемся?» можно прийти четырьмя разными путями.', ar: '16/9', href: 'https://vc.ru/marketing/2205037-konstruktor-missii-dlya-brenda', image: asset('/framework-1.webp') },
  { label: 'Метод метафор',        caseTitle: 'Критерии для работы с сильными метафорами + промпт',                          ar: '1/1',  href: 'https://workspace.ru/blog/prompt-dlya-proverki-metafory-s-pomoschyu-ii/' },
  { label: 'Конструктор баннеров', caseTitle: 'Плагин, делающий баннеры по бренд-киту компании Gate Legal',                  ar: '1/1',  image: asset('/framework-3.png') },
  { label: 'Памятка',              caseTitle: 'Памятка по юридическим документам на сайтах, приложениях и в коммуникациях',  ar: '16/9', href: 'https://vc.ru/marketing/2784990-yuridicheskie-dokumenty-dlya-saytov-i-prilozheniy', image: asset('/framework-4.png') },
];

export function ToolCard({ label, caseTitle, ar, href, image }: { label: string; caseTitle: string; ar: '16/9' | '1/1'; href?: string; image?: string }) {
  const [hovered, setHovered] = useState(false);
  // 2 lines + 10px top padding — height the description reveal expands to.
  const descH = 'calc(2 * var(--text-size) * var(--text-lh) + 10px)';

  // Label is a dotted-underline link only when there's a real URL (opens in a
  // new tab); without a URL it's plain text — no underline.
  const labelStyle: React.CSSProperties = href
    ? { ...TOOL_TEXT, marginTop: 10, textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px', cursor: 'pointer', display: 'block', color: 'inherit' }
    : { ...TOOL_TEXT, marginTop: 10 };

  return (
    <div
      style={{ cursor: href ? 'pointer' : 'default' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Aspect-ratio wrapper — grey rect + description share the total height;
          on hover the rect shrinks and the description expands below it. */}
      <div style={{ aspectRatio: ar, display: 'flex', flexDirection: 'column' }}>
        {/* Rect — flex: 1, shrinks as the description expands. Clips the image;
            on hover the image zooms in slightly (the block doesn't scale). */}
        <div style={{ flex: 1, background: 'var(--c-surface)', overflow: 'hidden', position: 'relative' }}>
          {image && (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transform: hovered ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1)',
            }} />
          )}
        </div>

        {/* Description — expands from the bottom, pushing the rect up */}
        <div style={{
          height: hovered ? descH : 0,
          overflow: 'hidden',
          transition: 'height 0.35s ease',
        }}>
          <p style={{
            ...TOOL_TEXT,
            paddingTop: 10,
            paddingRight: 10,
            transform: hovered ? 'translateY(0)' : 'translateY(10px)',
            opacity: hovered ? 1 : 0,
            transition: 'transform 0.35s ease, opacity 0.25s ease',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as React.CSSProperties['WebkitBoxOrient'],
          }}>{caseTitle}</p>
        </div>
      </div>

      {/* Label — dotted-underline link when there's a URL, else plain text */}
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" style={labelStyle}>{label}</a>
      ) : (
        <p style={labelStyle}>{label}</p>
      )}
    </div>
  );
}

export function ToolsSection() {
  const isMobile = useMobile();
  return (
    <div id="tools" className={s.section}>
      <div className={s.tools}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--heading-size)',
          fontWeight: 'var(--heading-weight)' as React.CSSProperties['fontWeight'],
          lineHeight: 'var(--heading-lh)',
          letterSpacing: 'var(--heading-ls)',
          color: 'var(--c-text)',
        }}>Фреймворки</p>

        {isMobile ? (
          // Mobile: horizontal swipe carousel.
          // Bleeds only to the RIGHT (off-screen) for the swipe-peek, while the
          // first card keeps the page's left margin so it lines up with the
          // "Фреймворки" heading instead of sitting flush against the edge.
          <div
            style={{
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollSnapType: 'x proximity',
              scrollbarWidth: 'none',
              marginRight: 'calc(-1 * var(--pad))',
              width: 'calc(100% + var(--pad))',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 'var(--gap)',
                paddingRight: 'var(--pad)',
              }}
            >
              {TOOL_CARDS.map(c => (
                <div
                  key={c.label}
                  style={{
                    flex: '0 0 45%',
                    minWidth: 0,
                    scrollSnapAlign: 'start',
                  }}
                >
                  <ToolCard {...c} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--gap)',
            alignItems: 'start',
          }}>
            {TOOL_CARDS.map(c => (
              <ToolCard key={c.label} {...c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
