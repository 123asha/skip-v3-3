import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import s from './CasesPage.module.css';
import { TEXT_STYLE as ts, H2_STYLE } from '../utils/typography';
import ContactForm from './ContactForm';
import { MagneticDivider } from './MagneticDivider';
import { useReveal } from '../hooks/useReveal';
import { useMobile } from '../hooks/useMobile';
import LinkFlip from './LinkFlip';

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
    ctaLabel: 'обсудить со стратегом',
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
    ctaLabel: 'обсудить с арт-директором',
    items: [
      {
        id: 'identity',
        label: 'фирменный стиль',
        heading: 'Фирменный стиль',
        paragraphs: [
          'Фирменный стиль без системы превращается в набор случайных решений. Со временем бренд теряет цельность, а каждая новая задача требует придумывать всё заново.',
          'Мы создаём визуальную систему бренда: определяем ключевую идею и правила, которые помогают команде принимать дизайн-решения последовательно и уверенно.',
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
          'Создаём библиотеки в Figma, брендбуки и инструкции, которыми команда действительно пользуется в работе.',
          'Документируем принципы так, чтобы их понимали и люди, но и ИИ-инструменты.',
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
          'Помогаем внедрить систему в повседневные процессы. Разрабатываем шаблоны презентаций, постов, коммерческих предложений и других документов в фирменном стиле.',
          'В результате новые материалы создаются быстрее, а качество остаётся стабильным.',
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
    ctaLabel: 'обсудить с командой',
    items: [
      {
        id: 'sites',
        label: 'лендинги и сайты',
        heading: 'Лендинги и сайты',
        paragraphs: [
          'Неважно, это одностраничный лендинг или большой корпоративный сайт — для нас это один из главных носителей бренда и важная точка контакта с аудиторией.',
          'Объединяем стратегию, дизайн и разработку в одном процессе, чтобы быстрее запускать проекты и сохранять качество на каждом этапе.',
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
          'Поможем запустить цифровой продукт. Спроектируем b2b-платформы и админки.',
          'Возьмём на себя повседневные задачи — структурно и по делу.',
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
          'Разрабатываем нестандартные digital-форматы: промо-сайты, интерактивные истории и игровые механики.',
          'Собираем под каждую задачу отдельную систему визуальных и интерактивных решений, которая помогает выделиться и решить конкретную бизнес-задачу. Особое внимание уделяем нарративу.',
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

/** Detail content (paragraphs · CTA) for an opened service item. On mount —
    i.e. every time a new item is selected — the copy reveals word-by-word with
    a GSAP stagger (each word rises + fades in), then the CTA link follows.
    Used both inline in the selected desktop row and inside the mobile panel. */
function ServiceDetail({ item, svc }: { item: ServiceItem; svc: Service }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const words = el.querySelectorAll<HTMLElement>('[data-word]');
      const cta = el.querySelector<HTMLElement>('[data-cta]');
      const tl = gsap.timeline();
      tl.fromTo(
        words,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, ease: 'power3.out', stagger: 0.006 },
      );
      if (cta) {
        tl.fromTo(cta, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power3.out' }, '-=0.15');
      }
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Examples column hidden for now — the text just stretches, max 440px. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 440 }}>
        {item.paragraphs.map((p, pi) => (
          <p key={pi} style={ts}>
            {p.split(' ').map((w, wi, arr) => (
              <span key={wi}>
                <span data-word style={{ display: 'inline-block', willChange: 'transform' }}>{w}</span>
                {wi < arr.length - 1 ? ' ' : ''}
              </span>
            ))}
          </p>
        ))}
      </div>
      <a
        href="#"
        data-cta
        style={{ display: 'block', marginTop: 20, marginBottom: 40, ...ts, textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' }}
      >
        {svc.ctaLabel}
      </a>
    </div>
  );
}

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
  // Mobile panel height — measured from the content so it animates to the
  // exact height (no abrupt snap from transitioning to a fixed 2000px).
  const [panelMaxH, setPanelMaxH] = useState(0);

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

  // Measure the mobile panel content so it animates to its exact height
  // (smooth open/close instead of snapping to a fixed max-height).
  useLayoutEffect(() => {
    if (!isMobile) return;
    setPanelMaxH(anySelected && contentRef.current ? contentRef.current.scrollHeight : 0);
  }, [selectedId, isMobile]);

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
    // Toggle selection. The detail now renders inline at the selected row, so
    // no scroll jump is needed — the page scrolls normally.
    setSelectedId(prev => prev === id ? null : id);
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
          gap: 0,
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
                        <p style={{ ...ts, margin: 0 }}>{svc.title}</p>
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
                  {/* Number col1, title col2, items col3, detail (when this svc is
                      selected) inline at col4-6 — aligned to this row's top. */}
                  <p style={{ ...ts, gridColumn: '1' }}>{svc.number}</p>
                  <p style={{ ...ts, gridColumn: '2' }}>{svc.title}</p>
                  <div style={{ gridColumn: '3', display: 'flex', flexDirection: 'column', gap: 4, position: 'relative', zIndex: 2 }}>
                    {itemButtons}
                  </div>
                  {selectedSvcIdx === svcIdx && selectedItem && (
                    <div
                      key={selectedId}
                      style={{
                        gridColumn: '4 / 6',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <ServiceDetail item={selectedItem} svc={svc} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Detail panel — MOBILE ONLY: full-width, slides in below the list.
              (Desktop renders the detail inline at the selected row, col 4-6.) */}
          {isMobile && (
            <div
              ref={panelRef}
              style={{
                width: '100%',
                maxHeight: panelMaxH,
                overflow: 'hidden',
                background: 'var(--c-surface)',
                transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div ref={contentRef} style={{ padding: '20px', width: '100%', boxSizing: 'border-box' }}>
                {renderedItem && renderedSvcIdx >= 0 && (
                  <ServiceDetail key={renderedItem.id} item={renderedItem} svc={SERVICES[renderedSvcIdx]} />
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Как работаем ─── (temporarily hidden) ──────────────────────────── */}
        {false && (
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
        )}

      </div>

      <div id="contact">
        <ContactForm variant="consult" onNavigatePolicy={onNavigatePolicy} onGridMode={onGridMode} />
      </div>
    </div>
  );
}
