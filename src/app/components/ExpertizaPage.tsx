import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import s from './CasesPage.module.css';
import { TEXT_STYLE as ts, H2_STYLE } from '../utils/typography';
import ContactForm from './ContactForm';
import { MagneticDivider } from './MagneticDivider';
import { useReveal } from '../hooks/useReveal';
import { useMobile } from '../hooks/useMobile';

// ── Service data ──────────────────────────────────────────────────────────────

export type ServiceItem = {
  id: string;
  label: string;
  heading: string;
  paragraphs: string[];
  examples?: { label: string; href: string }[];
};

export type Service = {
  number: string;
  title: string;
  items: ServiceItem[];
  ctaLabel: string;
};

export const SERVICES: Service[] = [
  {
    number: '①',
    title: 'Бренд-\nстратегия',
    ctaLabel: 'получить кп от стратега',
    items: [
      {
        id: 'brand-platform',
        label: 'платформа бренда',
        heading: 'Платформа бренда',
        paragraphs: [
          'Бренд без платформы — набор случайных решений: продажи говорят одно, маркетинг делает другое, в продукте — третье. В итоге бренд выглядит и звучит как пять разных человек вместо одного.',
          'Мы собираем воедино все смыслы и формулируем суть: кто вы, почему это важно и чем отличаетесь от других. Платформа бренда помогает последовательно и здраво принимать решения: от нейминга до изменений в продукте.',
        ],
        examples: [
          { label: 'конструктор миссии', href: 'https://vc.ru/marketing/2205037-konstruktor-missii-dlya-brenda' },
          { label: 'критерии метафор', href: 'https://workspace.ru/blog/kak-ii-generiruet-metafory/' },
        ],
      },
      {
        id: 'research',
        label: 'исследование',
        heading: 'Исследование',
        paragraphs: [
          'Бренд не сферический конь в вакууме: вокруг всегда есть контекст, в котором компания находится и развивается. Люди, рынок, тренды в индустрии — всё это влияет на восприятие.',
          'Мы проводим исследование рынка, конкурентов и аудитории. Это помогает бренду определить точки дифференциации, занять сильную позицию и быть понятным людям.',
        ],
        examples: [
          { label: 'карта категории', href: '#' },
          { label: 'портрет аудитории', href: '#' },
        ],
      },
      {
        id: 'naming',
        label: 'нейминг и регистрация',
        heading: 'Нейминг и регистрация',
        paragraphs: [
          'В название можно влюбиться на брейншторме, а после — выяснить, что оно конфликтует со стратегией или его невозможно зарегистрировать.',
          'Мы генерируем варианты, отсеиваем лонги до шорт-листов, проверяем лингвистику и восприятие. Дальше юрист проверяет по базам и ведёт регистрацию товарного знака до свидетельства.',
        ],
        examples: [
          { label: 'словарь смыслов', href: '#' },
          { label: 'тест на регистрацию', href: '#' },
          { label: 'фонетический тест', href: '#' },
        ],
      },
    ],
  },
  {
    number: '②',
    title: 'Визуальные\nсистемы',
    ctaLabel: 'получить кп от арт-директора',
    items: [
      {
        id: 'identity',
        label: 'фирменный стиль',
        heading: 'Фирменный стиль',
        paragraphs: [
          'Проектируем визуальную систему: логотип, цвет, типографику, паттерны, фотостиль. Всё, что формирует узнаваемость бренда.',
          'Разрабатываем не отдельные элементы, а систему — с логикой, правилами и примерами применения.',
        ],
        examples: [
          { label: 'логотип-конструктор', href: '#' },
          { label: 'тон голоса', href: '#' },
        ],
      },
      {
        id: 'guides',
        label: 'библиотеки и гайды',
        heading: 'Библиотеки и гайды',
        paragraphs: [
          'Создаём компонентные библиотеки в Figma и брендбуки, которыми команда пользуется каждый день.',
          'Гайды пишем под реальные задачи: как сделать пост, презентацию, баннер — не теория, а рабочий инструмент.',
        ],
        examples: [
          { label: 'figma-библиотека', href: '#' },
        ],
      },
      {
        id: 'templates',
        label: 'инструменты',
        heading: 'Инструменты',
        paragraphs: [
          'Разрабатываем шаблоны презентаций, постов, коммерческих предложений и других документов в фирменном стиле.',
          'Конструкторы позволяют маркетологам самостоятельно собирать материалы, не нарушая бренд.',
        ],
        examples: [
          { label: 'шаблоны презентаций', href: '#' },
          { label: 'конструктор баннеров', href: '#' },
          { label: 'ии-ускоритель', href: '#' },
        ],
      },
    ],
  },
  {
    number: '③',
    title: 'Цифровой\nдизайн',
    ctaLabel: 'получить кп от продакта',
    items: [
      {
        id: 'sites',
        label: 'лендинги и сайты',
        heading: 'Лендинги и сайты',
        paragraphs: [
          'Проектируем и разрабатываем сайты: от лендингов до сложных продуктовых страниц.',
          'Дизайн и разработка внутри одной команды — без потерь при передаче.',
        ],
        examples: [
          { label: 'лендинг для стартапа', href: '#' },
          { label: 'продуктовый сайт', href: '#' },
        ],
      },
      {
        id: 'interfaces',
        label: 'интерфейсы',
        heading: 'Интерфейсы',
        paragraphs: [
          'Проектируем пользовательские интерфейсы для веб-приложений, мобильных продуктов и B2B-платформ.',
          'От исследования и прототипа до готовой дизайн-системы с компонентами в Figma.',
        ],
        examples: [
          { label: 'b2b-платформа', href: '#' },
          { label: 'мобильное приложение', href: '#' },
          { label: 'дизайн-система', href: '#' },
        ],
      },
      {
        id: 'special',
        label: 'спецпроекты',
        heading: 'Спецпроекты',
        paragraphs: [
          'Делаем нестандартные digital-форматы: промо-сайты, интерактивные истории, конфигураторы и игровые механики.',
          'Каждый спецпроект — отдельная задача с собственной механикой и визуальным языком.',
        ],
        examples: [
          { label: 'промо-сайт', href: '#' },
          { label: 'интерактивная история', href: '#' },
        ],
      },
    ],
  },
];

// ── Shared styles ─────────────────────────────────────────────────────────────

// ts = TEXT_STYLE from shared typography (imported above)
const h2Style: React.CSSProperties = { ...H2_STYLE, whiteSpace: 'pre-line' };

// ── Anchor IDs — must match SERVICE_ANCHORS in ScrollHero ────────────────────
export const SERVICE_IDS = ['brand', 'visual', 'tools'] as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExpertizaPage({ onNavigatePolicy, onGridMode }: { onNavigatePolicy?: () => void; onGridMode?: (on: boolean) => void }) {
  const pageRef    = useRef<HTMLDivElement>(null);
  const rowRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const panelRef   = useRef<HTMLDivElement>(null);   // single outer sticky panel
  const contentRef = useRef<HTMLDivElement>(null);   // content wrapper inside the outer panel
  const prevIdRef  = useRef<string | null>(null);
  // Keep last non-null item so the content stays in DOM during the close animation
  const lastItemRef = useRef<ServiceItem | null>(null);
  const isMobile   = useMobile();

  useReveal(pageRef);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredSvcIdx, setHoveredSvcIdx] = useState<number | null>(null);

  const anySelected   = !!selectedId;
  const selectedSvcIdx = selectedId
    ? SERVICES.findIndex(svc => svc.items.some(i => i.id === selectedId))
    : -1;
  const selectedItem = selectedId
    ? SERVICES.flatMap(svc => svc.items).find(i => i.id === selectedId) ?? null
    : null;

  if (selectedItem) lastItemRef.current = selectedItem;
  const renderedItem = selectedItem ?? lastItemRef.current;
  const renderedSvcIdx = selectedSvcIdx >= 0
    ? selectedSvcIdx
    : (renderedItem
        ? SERVICES.findIndex(svc => svc.items.some(i => i.id === renderedItem!.id))
        : -1);

  // ── Animate content swap inside the outer panel on selection change ─────────
  useEffect(() => {
    const prev = prevIdRef.current;
    const curr = selectedId;
    prevIdRef.current = curr;

    const content = contentRef.current;
    if (!content) return;
    const els = Array.from(content.querySelectorAll<HTMLElement>('[data-anim]'));

    if (!curr) {
      // Closing — fade out content
      gsap.killTweensOf(els);
      gsap.to(els, { opacity: 0, y: -5, duration: 0.2, stagger: 0.025, ease: 'power2.in' });
      return;
    }

    // Opening fresh or switching between items — fade new content in
    gsap.killTweensOf(els);
    gsap.set(els, { opacity: 0, y: 8 });
    gsap.to(els, {
      opacity: 1, y: 0,
      duration: 0.35,
      stagger: 0.07,
      ease: 'power3.out',
      delay: prev ? 0.12 : 0.30,
    });
  }, [selectedId]);

  // ── Scroll to hash anchor on mount (e.g. /services#brand) ─────────────────
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const idx = (SERVICE_IDS as readonly string[]).indexOf(hash);
    if (idx < 0) return;
    // Delay so the page entrance animation finishes first
    const timer = setTimeout(() => {
      const row  = rowRefs.current[idx];
      const page = pageRef.current;
      if (!row || !page) return;
      const navEl     = document.querySelector('nav');
      const navBottom = navEl ? navEl.getBoundingClientRect().bottom : 20;
      const rowTop    = page.scrollTop + row.getBoundingClientRect().top - page.getBoundingClientRect().top;
      page.scrollTo({ top: rowTop - navBottom - 20, behavior: 'smooth' });
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // ── Lenis + wheel isolation ─────────────────────────────────────────────────
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

  // ── Scroll to the very top of the services page when a service is opened ──
  // (so the user always sees all 3 services + the gray panel from the start).
  const handleItemClick = (id: string, _svcIdx: number) => {
    const wasSelected = selectedId === id;
    setSelectedId(prev => prev === id ? null : id);
    if (wasSelected) return;
    const page = pageRef.current;
    if (!page) return;
    page.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={s.page} ref={pageRef}>
      <h1 className={s.title} data-reveal="">Услуги</h1>
      <div className={s.body} style={{ paddingLeft: 'var(--pad)', paddingRight: 'var(--pad)', paddingBottom: 0 }}>

        {/* ── Service rows (left) + outer panel (right on desktop / below on mobile) ──
            Desktop: side-by-side flex; details panel sticks to the viewport.
            Mobile: column stack; the panel slides in below the services list. */}
        {/* Desktop: plain full-width list; the detail panel is a fixed overlay
            on the right so the list never shrinks/shifts when it opens. */}
        <div style={isMobile ? {
          display: 'flex',
          flexDirection: 'column',
          gap: anySelected ? 16 : 0,
        } : {}}>

          {/* Services list — always full width, never shrinks */}
          <div style={{ minWidth: 0, width: '100%' }}>
            {SERVICES.map((svc, svcIdx) => {
              const itemButtons = svc.items.map(item => {
                const isSelected = selectedId === item.id;
                const isDimmed   = anySelected && !isSelected;
                return (
                  <button
                    key={item.id}
                    className={[
                      isSelected ? 'link-l1' : 'link-l2',
                      isDimmed   ? 'link-l2-dim' : '',
                    ].filter(Boolean).join(' ')}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      textAlign: 'left', display: 'block',
                      fontFamily: 'var(--font)',
                      fontSize: 'var(--text-size)',
                      fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
                      lineHeight: 'var(--text-lh)',
                      letterSpacing: 'var(--text-ls)',
                    }}
                    onClick={() => handleItemClick(item.id, svcIdx)}
                  >
                    {item.label}
                  </button>
                );
              });

              // Mobile: 2-col layout — number + title in col 1, items list in col 2.
              // Flat divider line (no magnetic effect on touch — and identical
              // to the "Как работаем" divider so all on-page rules look the same).
              if (isMobile) {
                return (
                  <div
                    key={svc.number}
                    id={SERVICE_IDS[svcIdx]}
                    ref={el => { rowRefs.current[svcIdx] = el; }}
                    style={{ position: 'relative', paddingTop: 16, paddingBottom: 24, opacity: 1, transform: 'none' }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--c-text)', opacity: 0.12 }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ ...h2Style, margin: 0 }}>{svc.title}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {itemButtons}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={svc.number}
                  id={SERVICE_IDS[svcIdx]}
                  ref={el => { rowRefs.current[svcIdx] = el; }}
                  data-reveal=""
                  data-reveal-delay={String(svcIdx * 0.08)}
                  onMouseEnter={() => setHoveredSvcIdx(svcIdx)}
                  onMouseLeave={() => setHoveredSvcIdx(null)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: 'var(--gap)',
                    position: 'relative',
                    paddingTop: 16,
                    paddingBottom: 32,
                    alignItems: 'start',
                  }}
                >
                  <MagneticDivider active={hoveredSvcIdx === svcIdx} />
                  <p style={{ ...ts, gridColumn: '1' }}>{svc.number}</p>
                  {/* When the detail panel is open, the title + items shift one
                      column to the left so the panel (right ~40%) doesn't cover them. */}
                  <p style={{ ...h2Style, gridColumn: anySelected ? '2' : '3', transition: 'none' }}>{svc.title}</p>
                  <div style={{ gridColumn: anySelected ? '3' : '4', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {itemButtons}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail panel — desktop: 40 % wide sticky on the right;
              mobile: full-width inline, slides in below the services list. */}
          <div
            ref={panelRef}
            style={isMobile ? {
              width: '100%',
              maxHeight: anySelected ? 2000 : 0,
              overflow: 'hidden',
              background: 'var(--c-surface)',
              transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            } : {
              // Desktop: fixed overlay on the right — doesn't affect list layout.
              position: 'fixed',
              top: 0,
              right: 0,
              height: '100vh',
              width: anySelected ? '40vw' : 0,
              overflow: 'hidden',
              background: 'var(--c-surface)',
              zIndex: 60,
              pointerEvents: anySelected ? 'auto' : 'none',
              transition: 'width 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div
              ref={contentRef}
              style={isMobile ? {
                padding: '20px',
                width: '100%',
                boxSizing: 'border-box',
              } : {
                padding: '20px 20px 40px 20px',
                width: '40vw',
                maxWidth: '40vw',
                height: '100%',
                overflowY: 'auto',
                boxSizing: 'border-box',
              }}
            >
              {renderedItem && renderedSvcIdx >= 0 && (
                <>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: 20,
                    alignItems: 'start',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <p data-anim="" style={h2Style}>{renderedItem.heading}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {renderedItem.paragraphs.map((p, i) => (
                          <p key={i} data-anim="" style={ts}>{p}</p>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {renderedItem.examples && renderedItem.examples.length > 0 && (
                        <>
                          <p data-anim="" style={ts}>Примеры</p>
                          {renderedItem.examples.map((ex, idx) => (
                            <a
                              key={ex.href}
                              data-anim=""
                              href={ex.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                ...ts,
                                textDecoration: 'underline',
                                textDecorationStyle: 'dotted',
                                textUnderlineOffset: '3px',
                              }}
                            >
                              [{idx + 1}] {ex.label}
                            </a>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  <a
                    data-anim=""
                    href="#"
                    style={{
                      display: 'block',
                      marginTop: 40,
                      ...ts,
                      textDecoration: 'underline',
                      textDecorationStyle: 'dotted',
                      textUnderlineOffset: '3px',
                    }}
                  >
                    {SERVICES[renderedSvcIdx].ctaLabel}
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Как работаем ─────────────────────────────────────────────────── */}
        <div style={{ marginTop: isMobile ? 80 : 200 }}>
          <h2 style={{ ...H2_STYLE, marginBottom: isMobile ? 24 : 40 }} data-reveal="">Как работаем</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 'var(--gap)' }} data-reveal-stagger="">
            {([
              {
                num: '①',
                title: 'Заявка',
                text: (
                  <>
                    Пишете нам на{' '}
                    <a href="mailto:hi@skip.design" style={{ ...ts, textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' }}>hi@skip.design</a>
                    {' '}или оставляете{' '}
                    <a
                      href="#contact"
                      style={{ ...ts, textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' }}
                      onClick={e => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}
                    >контакт в форме</a>
                    .<br />Отвечаем с 11 до 20 по Москве
                  </>
                ),
              },
              { num: '②', title: 'Знакомство',              text: 'Назначаем встречу — разбираемся в задаче и рассказываем о процессе. На встречу придут специалисты, с которыми вы дальше будете работать.' },
              { num: '③', title: 'Коммерческое предложение', text: 'Собираем предложение и примеры под вашу задачу. Расскажем о видении и ответим на все вопросы.' },
              { num: '④', title: 'Договор и старт работ',    text: 'Согласовываем условия, составляем роадмап и подписываем договор' },
            ] as const).map((step, i) => (
              <div key={i} style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ height: '1px', background: 'var(--c-text)', opacity: 0.12, marginBottom: 4 }} />
                <p style={{ ...ts, margin: 0, opacity: 0.4 }}>{step.num}</p>
                <p style={{ ...ts, margin: 0 }}>{step.title}</p>
                <p style={{ ...ts, margin: 0, opacity: 0.55 }}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div id="contact">
        <ContactForm variant="consult" onNavigatePolicy={onNavigatePolicy} onGridMode={onGridMode} />
      </div>
    </div>
  );
}
