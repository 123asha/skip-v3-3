import { useEffect, useRef } from 'react';
import { useMobile } from '../hooks/useMobile';
import s from './CasesPage.module.css';
import { MediaSection } from './MediaSection';
import { ToolsSection } from './ToolsSection';
import ContactForm from './ContactForm';
import { TEXT_STYLE as ts } from '../utils/typography';
import { asset } from '../utils/asset';
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

        {/* Content cards — row 1: social / link cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'var(--content-cols)',
            gap: 'var(--content-gap)',
            marginBottom: 40,
            alignItems: 'start',
          }}
        >
          {([
            {
              ar: '16/9',
              title: 'Следите за событиями студии Skip Design',
              meta: 'Телеграм',
              linkLabel: 'подписаться',
              href: 'https://t.me/skpdsgn',
              image: asset('/lab/SkipDesign-TG.png'),
            },
            {
              ar: '5/6',
              title: 'Смотрите наши проекты',
              meta: 'Behance',
              linkLabel: 'смотреть',
              href: 'https://www.behance.net/skipdesign',
              image: asset('/lab/SkipDesign-BE.png'),
            },
            {
              ar: '16/9',
              title: 'Записи наших вебинаров',
              meta: 'YouTube',
              linkLabel: 'смотреть',
              href: 'https://www.youtube.com/@skipdesign',
              image: asset('/lab/SkipDesign-YTB.png'),
            },
          ] as const).map((card, i) => (
            <div
              key={i}
              data-reveal=""
              data-reveal-delay={String(i * 0.08)}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              {(card as { image?: string }).image ? (
                <img
                  src={(card as { image?: string }).image}
                  alt={card.title}
                  loading="lazy"
                  style={{ aspectRatio: card.ar, width: '100%', objectFit: 'cover', display: 'block', background: 'var(--c-surface)' }}
                />
              ) : (
                <div style={{ aspectRatio: card.ar, background: 'var(--c-surface)', width: '100%' }} />
              )}
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
                {/* Meta — source name as link if href exists */}
                <div style={{ flexShrink: 0 }}>
                  {card.meta && card.href ? (
                    <a
                      href={card.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ ...ts, margin: 0, textAlign: 'right', color: 'var(--c-text)', opacity: 'var(--opacity-muted)' as any, textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px', display: 'block' }}
                    >{card.meta}</a>
                  ) : card.meta ? (
                    <p style={{ ...ts, margin: 0, textAlign: 'right', color: 'var(--c-text)' }}>{card.meta}</p>
                  ) : null}
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
              Skip&nbsp;Design&nbsp;— студия цифрового дизайна. Скипаем все, что мешает проявиться суть.
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
          {/* Workspace card — col 1 */}
          <div style={{ gridColumn: isMobile ? 'auto' : '1 / 2', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <img
              src={asset('/lab/SkipDesign-ws.png')}
              alt="Workspace"
              loading="lazy"
              style={{ aspectRatio: '4/5', width: '100%', objectFit: 'cover', display: 'block', background: 'var(--c-surface)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
              <p style={{ ...ts, margin: 0 }}>Делимся экспертными статьями</p>
              <a
                href="https://workspace.ru"
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...ts, flexShrink: 0, textAlign: 'right', color: 'var(--c-text)', opacity: 'var(--opacity-muted)' as any, textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' }}
              >Workspace</a>
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
                Skip&nbsp;Design&nbsp;— студия цифрового дизайна. Скипаем все, что мешает проявиться суть.
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

          {/* Figma card — col 5 */}
          <div style={{ gridColumn: isMobile ? 'auto' : '5 / 6', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <img
              src={asset('/lab/SkipDesign-fg.png')}
              alt="Figma"
              loading="lazy"
              style={{ aspectRatio: '16/9', width: '100%', objectFit: 'cover', display: 'block', background: 'var(--c-surface)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
              <p style={{ ...ts, margin: 0 }}>Наше сообщество в Figma</p>
              <a
                href="https://www.figma.com/@skipdesign"
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...ts, flexShrink: 0, textAlign: 'right', color: 'var(--c-text)', opacity: 'var(--opacity-muted)' as any, textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' }}
              >Figma</a>
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
              title: 'Мы в LinkedIn',
              meta: 'LinkedIn',
              linkLabel: 'подписаться',
              href: 'https://www.linkedin.com/company/skipdesign',
              image: asset('/lab/SkipDesign-Linked.png'),
            },
            {
              ar: '16/9',
              title: 'Офис в Санкт-Петербурге, м. Московская',
              meta: null as string | null,
              linkLabel: null as string | null,
              href: null as string | null,
              image: asset('/lab/SkipDesign-address.png'),
            },
          ] as const).map((card, i) => (
            <div
              key={i}
              data-reveal=""
              data-reveal-delay={String(i * 0.08)}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              {(card as { image?: string }).image ? (
                <img
                  src={(card as { image?: string }).image}
                  alt={card.title}
                  loading="lazy"
                  style={{ aspectRatio: card.ar, width: '100%', objectFit: 'cover', display: 'block', background: 'var(--c-surface)' }}
                />
              ) : (
                <div style={{ aspectRatio: card.ar, background: 'var(--c-surface)', width: '100%' }} />
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
                <p style={{ ...ts, margin: 0 }}>{card.title}</p>
                <div style={{ flexShrink: 0 }}>
                  {card.meta && card.href ? (
                    <a
                      href={card.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ ...ts, margin: 0, textAlign: 'right', color: 'var(--c-text)', opacity: 'var(--opacity-muted)' as any, textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px', display: 'block' }}
                    >{card.meta}</a>
                  ) : card.meta ? (
                    <p style={{ ...ts, margin: 0, textAlign: 'right' }}>{card.meta}</p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* MediaSection (Инсайты) above the contact form. */}
        <div style={{ marginLeft: 'calc(-1 * var(--pad))', marginRight: 'calc(-1 * var(--pad))' }}>
          <MediaSection />
        </div>
        <ContactForm onNavigatePolicy={onNavigatePolicy} onGridMode={onGridMode} />
      </div>
    </div>
  );
}
