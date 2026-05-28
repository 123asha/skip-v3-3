import { useState } from 'react';
import { useMobile } from '../hooks/useMobile';
import s from '../App.module.css';

export const TOOL_TEXT: React.CSSProperties = {
  fontFamily: 'var(--font)',
  fontSize: 'var(--text-size)',
  fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
  lineHeight: 'var(--text-lh)',
  letterSpacing: 'var(--text-ls)',
  color: 'var(--c-text)',
};

export const TOOL_CARDS: { label: string; caseTitle: string; ar: '16/9' | '1/1' }[] = [
  { label: 'Конструктор миссии',   caseTitle: 'На вопрос «Почему мы этим занимаемся?» можно прийти четырьмя разными путями.', ar: '16/9' },
  { label: 'Метод метафор',        caseTitle: 'Критерии для работы с сильными метафорами',                                     ar: '1/1'  },
  { label: 'Конструктор баннеров', caseTitle: 'Плагин, делающий баннеры по бренд-киту компании',                              ar: '1/1'  },
  { label: 'ИИ-ускоритель',        caseTitle: 'Автоматизируем рутину — плагины, шаблоны и ИИ-инструменты под ваши процессы', ar: '16/9' },
];

export function ToolCard({ label, caseTitle, ar }: { label: string; caseTitle: string; ar: '16/9' | '1/1' }) {
  const [hovered, setHovered] = useState(false);
  // 2 lines + 10px top padding
  const descH = 'calc(2 * var(--text-size) * var(--text-lh) + 10px)';

  return (
    <div
      style={{ cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Aspect-ratio wrapper — grey rect + description share the same total height */}
      <div style={{ aspectRatio: ar, display: 'flex', flexDirection: 'column' }}>
        {/* Grey rect — flex: 1, shrinks naturally as description expands */}
        <div style={{ flex: 1, background: 'var(--c-surface)' }} />

        {/* Description — expands from bottom, pushing rect up */}
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

      {/* Label — always 10px below, styled as link */}
      <p style={{
        ...TOOL_TEXT,
        marginTop: 10,
        textDecoration: 'underline',
        textDecorationStyle: 'dotted',
        textUnderlineOffset: '3px',
        cursor: 'pointer',
      }}>{label}</p>
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
          // Outer div: scroll container stretched to full viewport width via
          // negative margin so it escapes the section's --pad padding.
          // Inner div: flex row with paddingLeft = --pad so the first card
          // aligns exactly with the "Фреймворки" heading above.
          <div
            style={{
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              marginLeft: 'calc(-1 * var(--pad))',
              width: 'calc(100% + 2 * var(--pad))',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 'var(--gap)',
                paddingLeft: 'var(--pad)',
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
