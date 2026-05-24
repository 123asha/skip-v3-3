import { useEffect, useRef } from 'react';
import s from './CasesPage.module.css';
import { MediaSection } from './MediaSection';
import { ToolsSection } from './ToolsSection';
import ContactForm from './ContactForm';
import { TEXT_STYLE as ts } from '../utils/typography';
import CaseCard, { CASE_AR_H as H, CASE_AR_V as V } from './CaseCard';
import { asset } from '../utils/asset';
import { useReveal } from '../hooks/useReveal';

const LAB_CASES = [
  { ar: H, title: 'Брендинг AliExpress',  desc: 'Исследования рынка, категории и целевой аудитории.',  image: asset('/case1.png'), col: '1 / 3', row: 1 },
  { ar: V, title: 'Gate Legal',            desc: 'Платформа бренда и визуальная идентичность',           image: asset('/case2.png'), col: '4 / 6', row: 1 },
  { ar: V, title: "Senior's Platform",     desc: 'Дизайн-система и интерфейсы',                         image: asset('/case3.png'), col: '2 / 4', row: 2 },
  { ar: H, title: 'Юрий Мурадян',          desc: 'Персональный брендинг',                               image: asset('/case4.png'), col: '4 / 6', row: 2 },
  { ar: H, title: 'Futura Digital',        desc: 'Нейминг и регистрация, платформа бренда',              image: asset('/case5.png'), col: '1 / 3', row: 3 },
  { ar: V, title: 'Nova Brand',            desc: 'Визуальная идентичность и система',                   image: asset('/case6.png'), col: '4 / 6', row: 3 },
] as const;

export default function LabPage({
  onNavigatePolicy,
  onGridMode,
}: {
  onNavigatePolicy?: () => void;
  onGridMode?: (on: boolean) => void;
}) {
  const pageRef = useRef<HTMLDivElement>(null);

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
      <div className={s.body} style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 0 }}>

        {/* Content cards — row 1: three items */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
            marginBottom: 20,
            alignItems: 'start',
          }}
        >
          {([
            {
              ar: '16/9',
              title: 'Написали статью о том, как ИИ генерирует метафоры',
              source: 'Workspace',
              sourceHref: 'https://workspace.ru/blog/kak-ii-generiruet-metafory/',
              linkLabel: 'май 2026',
              href: 'https://workspace.ru/blog/kak-ii-generiruet-metafory/',
            },
            {
              ar: '5/6',
              title: 'Сделали конструктор миссии и выложили в открытом доступе',
              source: 'Figma',
              sourceHref: null,
              linkLabel: 'открыть',
              href: 'https://vc.ru/marketing/2205037-konstruktor-missii-dlya-brenda',
            },
            {
              ar: '16/9',
              title: 'Арт-директор Аша и стратег Ксения провели открытый вебинар.',
              source: 'Телеграм-канал',
              sourceHref: null,
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
                <p style={{ ...ts, margin: 0 }}>{card.title}</p>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                  {card.source && (
                    card.sourceHref
                      ? <a href={card.sourceHref} target="_blank" rel="noopener noreferrer" style={{ ...ts, margin: 0, textAlign: 'right', color: 'var(--c-text-muted, rgba(35,31,32,0.4))', textDecoration: 'none' }}>{card.source}</a>
                      : <p style={{ ...ts, margin: 0, textAlign: 'right' }}>{card.source}</p>
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

        {/* People block — two portrait cards (1 col wide each) with a centred
            paragraph between. Photos are gray placeholders for now. Captions
            use the project's default text style (no new styles introduced). */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 'var(--gap)',
            marginBottom: 120,
            alignItems: 'start',
          }}
        >
          {/* Left portrait — col 1 */}
          <div style={{ gridColumn: '1 / 2', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ aspectRatio: '4/5', background: 'var(--c-surface)', width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
              <p style={{ ...ts, margin: 0 }}>Елена Новикова</p>
              <p style={{ ...ts, margin: 0, textAlign: 'right' }}>
                опыт<br />8 лет
              </p>
            </div>
          </div>

          {/* Centred paragraph + telegram link — col 3 */}
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
              Skip&nbsp;Design&nbsp;— команда дизайнеров и стратегов, которые любят свое дело. Мы ценим человечность, мастерство и здравый смысл.
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

          {/* Right card — horizontal 16/9, col 5 */}
          <div style={{ gridColumn: '5 / 6', display: 'flex', flexDirection: 'column', gap: 10 }}>
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
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
            marginBottom: 120,
            alignItems: 'start',
          }}
        >
          {([
            {
              ar: '5/6',
              title: 'Рабочий стол арт-директора',
              source: null,
              linkLabel: null,
              href: null,
            },
            {
              ar: '16/9',
              title: "Сделали спецпроект Kon' Ogon'",
              source: null,
              linkLabel: 'перейти',
              href: 'https://workspace.ru/blog/kak-ii-generiruet-metafory/',
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
                <p style={{ ...ts, margin: 0 }}>{card.title}</p>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                  {card.source && <p style={{ ...ts, margin: 0, textAlign: 'right' }}>{card.source}</p>}
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

        {/* Cases block — 5-col staggered grid, same layout as CasesPage */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 'var(--gap)',
            rowGap: 80,
            marginBottom: 120,
          }}
        >
          {LAB_CASES.map((c, i) => (
            <div key={i} data-reveal="" data-reveal-delay={String(i * 0.07)} style={{ gridColumn: c.col, gridRow: c.row }}>
              <CaseCard ar={c.ar} title={c.title} desc={c.desc} image={c.image} />
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
