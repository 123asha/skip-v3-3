import { useEffect, useRef } from 'react';
import { useMobile } from '../hooks/useMobile';
import s from './CasesPage.module.css';
import { MediaSection } from './MediaSection';
import { ToolsSection } from './ToolsSection';
import ContactForm from './ContactForm';
import { TEXT_STYLE as ts } from '../utils/typography';
import { useReveal } from '../hooks/useReveal';

export default function LabPage({
  onNavigatePolicy,
  onGridMode,
}: {
  onNavigatePolicy?: () => void;
  onGridMode?: (on: boolean) => void;
}) {
  const pageRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobile();

  useReveal(pageRef);

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

  return (
    <div className={s.page} ref={pageRef}>
      <h1 className={s.title} data-reveal="">Skip Design</h1>
      <div className={s.body} style={{ paddingLeft: 'var(--pad)', paddingRight: 'var(--pad)', paddingBottom: 0 }}>

        {/* Content cards — row 1: three items */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'var(--content-cols)',
            gap: 'var(--content-gap)',
            marginBottom: 20,
            alignItems: 'start',
          }}
        >
          {([
            {
              ar: '16/9',
              title: 'Написали статью о том, как ИИ генерирует метафоры',
              meta: 'май 2026',
              linkLabel: 'Workspace',
              href: 'https://workspace.ru/blog/kak-ii-generiruet-metafory/',
            },
            {
              ar: '5/6',
              title: 'Сделали конструктор миссии и выложили в открытом доступе',
              meta: 'Figma',
              linkLabel: 'открыть',
              href: 'https://vc.ru/marketing/2205037-konstruktor-missii-dlya-brenda',
            },
            {
              ar: '16/9',
              title: 'Арт-директор Аша и стратег Ксения провели открытый вебинар.',
              meta: 'Телеграм-канал',
              linkLabel: 'смотреть',
              href: 'https://t.me/skpdsgn',
            },
          ] as const).map((card, i) => (
            <div
              key={i}
              data-reveal=""
              data-reveal-delay={String(i * 0.08)}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <div style={{ aspectRatio: card.ar, background: 'var(--c-surface)', width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
                {/* Title — left, clamped to 2 lines */}
                <p style={{
                  ...ts,
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical' as React.CSSProperties['WebkitBoxOrient'],
                  overflow: 'hidden',
                }}>{card.title}</p>
                {/* Meta column — right: year (black, on top), link (gray, below) */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                  {card.meta && (
                    <p style={{ ...ts, margin: 0, textAlign: 'right', color: 'var(--c-text)' }}>{card.meta}</p>
                  )}
                  {card.href && card.linkLabel && (
                    <a
                      href={card.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ ...ts, color: 'rgba(35,31,32,0.4)', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' }}
                    >{card.linkLabel}</a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Intro text + telegram — mobile only, centred between the row of
            content cards above and the people block below (desktop keeps
            this text inside the people block's middle column). */}
        {isMobile && (
          <div
            data-reveal=""
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              alignItems: 'center',
              textAlign: 'center',
              marginTop: 40,
              marginBottom: 40,
            }}
          >
            <p style={{ ...ts, margin: 0, maxWidth: 'calc(2 / 3 * (100vw - 2 * var(--pad)))' }}>
              Skip&nbsp;Design&nbsp;— студия цифрового дизайна, которая любит своё дело. Мы ценим человечность, мастерство и здравый смысл.
            </p>
            <a
              href="https://t.me/skpdsgn"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...ts,
                color: 'var(--c-text)',
                textDecoration: 'underline',
                textDecorationStyle: 'dotted',
                textUnderlineOffset: '3px',
              }}
            >
              телеграм канал
            </a>
          </div>
        )}

        {/* People block — two portrait cards (1 col wide each) with a centred
            paragraph between. Photos are gray placeholders for now. Captions
            use the project's default text style (no new styles introduced). */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'var(--people-cols)',
            gap: 'var(--gap)',
            marginBottom: 'var(--space-xl)',
            alignItems: 'start',
          }}
        >
          {/* Left portrait — col 1 */}
          <div style={{ gridColumn: isMobile ? 'auto' : '1 / 2', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ aspectRatio: '4/5', background: 'var(--c-surface)', width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
              <p style={{ ...ts, margin: 0 }}>Елена Новикова</p>
              <p style={{ ...ts, margin: 0, textAlign: 'right' }}>
                опыт<br />8 лет
              </p>
            </div>
          </div>

          {/* Centred paragraph + telegram link — col 3 (desktop only) */}
          {!isMobile && (
            <div
              style={{
                gridColumn: '3 / 4',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 20,
                height: '100%',
                minHeight: '100%',
                textAlign: 'center',
              }}
            >
              <p style={{ ...ts, margin: 0 }}>
                Skip&nbsp;Design&nbsp;— студия цифрового дизайна, которая любит своё дело. Мы ценим человечность, мастерство и здравый смысл.
              </p>
              <a
                href="https://t.me/skpdsgn"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...ts,
                  color: 'var(--c-text)',
                  textDecoration: 'underline',
                  textDecorationStyle: 'dotted',
                  textUnderlineOffset: '3px',
                }}
              >
                телеграм канал
              </a>
            </div>
          )}

          {/* Right card — horizontal 16/9, col 5 */}
          <div style={{ gridColumn: isMobile ? 'auto' : '5 / 6', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ aspectRatio: '16/9', background: 'var(--c-surface)', width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
              <p style={{ ...ts, margin: 0 }}>Максим Кузнецов</p>
              <p style={{ ...ts, margin: 0, textAlign: 'right' }}>
                опыт<br />10 лет
              </p>
            </div>
          </div>
        </div>

        {/* Content cards — row 2: two items, below people block */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'var(--content-cols)',
            gap: 'var(--content-gap)',
            marginBottom: 'var(--space-xl)',
            alignItems: 'start',
          }}
        >
          {([
            {
              ar: '5/6',
              title: 'Рабочий стол арт-директора',
              meta: null as string | null,
              linkLabel: null as string | null,
              href: null as string | null,
            },
            {
              ar: '16/9',
              title: "Сделали спецпроект Kon' Ogon'",
              meta: null as string | null,
              linkLabel: 'перейти',
              href: 'https://workspace.ru/blog/kak-ii-generiruet-metafory/',
            },
          ]).map((card, i) => (
            <div
              key={i}
              data-reveal=""
              data-reveal-delay={String(i * 0.08)}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <div style={{ aspectRatio: card.ar, background: 'var(--c-surface)', width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
                <p style={{ ...ts, margin: 0 }}>{card.title}</p>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                  {card.meta && (
                    <p style={{ ...ts, margin: 0, textAlign: 'right', color: 'rgba(35,31,32,0.4)' }}>{card.meta}</p>
                  )}
                  {card.href && card.linkLabel && (
                    <a
                      href={card.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ ...ts, textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' }}
                    >{card.linkLabel}</a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ToolsSection ("Фреймворки") + MediaSection live just above the
            contact form. Both use the global `.section` class which adds its
            own 20px side padding — we cancel out the body's 20px inline
            padding with a negative margin so they span the full container
            width (matching the cards above). */}
        <div style={{ marginLeft: 'calc(-1 * var(--pad))', marginRight: 'calc(-1 * var(--pad))' }}>
          <ToolsSection />
          <MediaSection />
        </div>
        <ContactForm onNavigatePolicy={onNavigatePolicy} onGridMode={onGridMode} />
      </div>
    </div>
  );
}
