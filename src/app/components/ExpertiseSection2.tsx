import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MagneticDivider } from './MagneticDivider';
import { useMobile } from '../hooks/useMobile';
import { useRowReveal } from '../hooks/useRowReveal';
import { H2_STYLE, typo } from '../utils/typography';
import { PARA_GAP } from './CaseTemplatePage';
import PillButton from './PillButton';
import { ServiceBall } from './ServiceBall';
import { CircleArrow } from './CircleArrow';
import s from '../App.module.css';
import { LANG, t } from '../i18n';

interface ServiceItem { text: string; label?: string; hideNumber?: boolean; desc?: string }

// Descriptions carried over from the /services page where an equivalent item
// exists there; the rest are placeholders until real copy lands.
const PLACEHOLDER_DESC = 'Короткое описание услуги: что входит в работу, как мы её ведём и что получает команда на выходе. Текст-рыба — заменим на финальный.';

// Shared by "Лендинги и промо" and "Корпоративные сайты" until each gets its own.
const SITES_DESC = 'Неважно, это одностраничный лендинг или большой корпоративный сайт — для нас это один из главных носителей бренда и важная точка контакта с аудиторией.\n\nОбъединяем стратегию, дизайн и разработку в одном процессе, чтобы быстрее запускать проекты и сохранять качество на каждом этапе.';

const SERVICES: { category: string; groupLabel?: string; items: ServiceItem[] }[] = [
  {
    category: 'Брендинг',
    groupLabel: '✻',
    items: [
      {
        text: 'Исследования', label: 'Бренд-стратегия',
        desc: 'Бренд не сферический конь в вакууме: вокруг всегда есть контекст, в котором компания находится и развивается. Люди, рынок, тренды в индустрии — всё это влияет на восприятие.\n\nМы проведём исследование рынка, конкурентов и аудитории и поможем вам найти точки дифференциации, занять сильную позицию и стать понятнее людям.',
      },
      {
        text: 'Платформа бренда', hideNumber: true,
        desc: 'Бренд без платформы — набор случайных решений: продажи говорят одно, маркетинг делает другое, в продукте — третье. В итоге бренд выглядит и звучит как пять разных человек вместо одного.\n\nПоможем вам собрать все смыслы воедино и сформулировать суть: кто вы, почему это важно и чем вы отличаетесь от других. С платформой бренда вам будет проще последовательно и здраво принимать решения — от нейминга до изменений в продукте.',
      },
      {
        text: 'Нейминг и регистрация', hideNumber: true,
        desc: 'В название можно влюбиться на брейншторме, а после — выяснить, что оно конфликтует со стратегией или его невозможно зарегистрировать.\n\nПредложим вам варианты названий, сократим длинный список до короткого, проверим лингвистику и восприятие. Наш юрист проверит название по базам и проведёт регистрацию товарного знака до получения свидетельства.',
      },
      {
        text: 'Визуальная система', label: 'Фирменный стиль',
        desc: 'Фирменный стиль без системы превращается в набор случайных решений. Каждая новая задача по дизайну — баннер, презентация, упаковка — делается с нуля и зависит от вкуса конкретного дизайнера. Со временем бренд теряет цельность и узнаваемость.\n\nРазработаем для вас сильную визуальную концепцию, основанную на стратегической идее бренда, и соберём её в систему с понятными правилами. Команда сможет принимать дизайн-решения быстро и уверенно, а бренд останется узнаваемым на любом носителе.',
      },
      { text: 'Логотипы', hideNumber: true, desc: 'Для нас логотип не отдельный объект, а часть айдентики. Он должен жить в системе: работать вместе со шрифтами, цветом и графикой и оставаться узнаваемым в любом размере — от иконки приложения до вывески.\n\nСоздадим логотип, который станет органичной частью вашей визуальной системы. Поможем зарегистрировать его как товарный знак: у нас в команде есть юрист, который проверит знак по базам и доведёт регистрацию до получения свидетельства.' },
      {
        text: 'Шаблоны и инструменты', label: 'Автоматизация',
        desc: 'Поможем внедрить систему в повседневные процессы. Сначала изучим среду, в которой живёт ваш маркетинг, а затем подготовим шаблоны презентаций, постов, коммерческих предложений и других документов под те инструменты, в которых работает ваша команда. В работе используем искусственный интеллект, поэтому материалы готовятся быстрее.\n\nВ результате новые материалы создаются быстрее, а качество остаётся стабильным.',
      },
      { text: 'Дизайн-поддержка', hideNumber: true, desc: 'Когда бренд растёт, дизайн-задач становится больше: рекламные кампании, питч-деки, материалы для маркетинга. Нанимать отдельного специалиста под каждую задачу долго и дорого.\n\nВыделим под ваши задачи команду дизайнеров и менеджера. Вы получаете не одну компетенцию, а сразу несколько: под каждую задачу подключается дизайнер с нужной экспертизой. Результат — за 24–72 часа в зависимости от сложности задачи.\n\nМинимальный пакет — 40 часов в месяц, в них входит работа дизайнеров и менеджера.' },
    ],
  },
  {
    category: 'Веб',
    groupLabel: '◊',
    items: [
      { text: 'Информационная архитектура', label: 'Информационная архитектура', desc: PLACEHOLDER_DESC },
      { text: 'Прототипирование', hideNumber: true, desc: 'Сайт без продуманной структуры — это набор красивых блоков, которые не отвечают на вопросы посетителя и не ведут его к цели.\n\nСпроектируем прототип вместе со стратегом: учтём смыслы бренда и проанализируем ваш текущий сайт, если он есть. Для каждой страницы и каждого блока поставим задачу, чтобы в структуре не осталось ничего случайного.' },
      { text: 'Редактура', hideNumber: true, desc: 'При необходимости подключим редактора, который работает с текстами на русском и английском. Можем поддерживать ваш контент и дальше — в формате подряда.' },
      { text: 'Лендинги и промо', label: 'Веб-дизайн', desc: SITES_DESC },
      {
        text: 'Спецпроекты', hideNumber: true,
        desc: 'Разрабатываем нестандартные digital-форматы: промо-сайты, интерактивные истории и игровые механики.\n\nСобираем под каждую задачу отдельную систему визуальных и интерактивных решений, которая помогает выделиться и решить конкретную бизнес-задачу. Особое внимание уделяем нарративу.',
      },
      { text: 'Корпоративные сайты', hideNumber: true, desc: SITES_DESC },
      { text: 'No-code', label: 'Запуск и поддержка', desc: PLACEHOLDER_DESC },
      { text: 'Vibe-code', hideNumber: true, desc: PLACEHOLDER_DESC },
      { text: 'Поддержка', hideNumber: true, desc: PLACEHOLDER_DESC },
    ],
  },
  {
    category: 'Продукт',
    groupLabel: '⌘',
    items: [
      { text: 'Продуктовое видение', label: 'Product Vision', desc: 'Без общего видения продукт растёт во все стороны сразу: каждая команда тянет в свою, а бэклог превращается в список пожеланий.\n\nСформулируем product vision: для кого продукт, какую проблему он решает и каким должен стать через 2–3 года. Свяжем его с платформой бренда, чтобы продукт и коммуникация говорили об одном. С видением проще расставлять приоритеты и отказываться от лишнего.' },
      { text: 'Кастдевы', hideNumber: true, desc: 'Гипотезы о пользователях легко принять за факты — и потратить месяцы на фичи, которые никому не нужны.\n\nПроведём глубинные интервью с вашими клиентами и с теми, кто ещё не стал клиентом: составим гайд, найдём респондентов, поговорим и соберём выводы. Вы получите карту реальных задач, болей и мотивов аудитории — с цитатами и рекомендациями, что делать с продуктом и коммуникацией дальше.' },
      {
        text: 'Приложения и платформы', label: 'UX/UI',
        desc: 'Поможем запустить цифровой продукт. Спроектируем b2b-платформы и админки. Возьмём на себя повседневные задачи — структурно и по делу.',
      },
      {
        text: 'Дизайн-библиотеки и поддержка', hideNumber: true,
        desc: 'Создаём библиотеки в Figma, брендбуки и инструкции, которыми команда действительно пользуется в работе. Документируем принципы так, чтобы их понимали и люди, и ИИ-инструменты.',
      },
    ],
  },
];

// Sandbox copy of ExpertiseSection for /services-2 — the table can be folded
// and unfolded one level at a time, like the density zoom on the cases page.

/** Disclosure depth of the table, driven by the page's ⊕ ⊖ controls:
 *   0 — just the three category symbols side by side on a grey band
 *   1 — one row per category (Брендинг / Веб / Продукт)
 *   2 — categories + their sub-groups (Стратегия, Дизайн…) — the default view
 *   3 — every sub-group open, all services listed
 *   4 — everything open, service descriptions included */
export const EXPERTISE_LEVELS = 5;
export const EXPERTISE_DEFAULT_LEVEL = 2;

// «задать вопрос» under an open service description (services page): opens a
// Telegram chat with the studio, the message already typed — about this
// service, in the page's language
const TELEGRAM = 'skpdsgn';
// Where «задать вопрос» leads for now: the contact form at the page's foot.
// Switch to 'telegram' to open the prefilled chat instead (kept intact).
const ASK_GOES_TO: 'footer' | 'telegram' = 'footer';
function AskButton({ service }: { service: string }) {
  const name = t(service);
  const text = LANG === 'en'
    ? `Hi! I have a question about ${name}`
    : `Привет! У меня есть вопрос касательно услуги «${name}»`;
  // The site's grey pill (same flip on hover as every other button), in its
  // compact size. The wrapper keeps the click from reaching the row.
  return (
    <span onClick={e => e.stopPropagation()} style={{ display: 'inline-block', marginTop: 20 }}>
      <PillButton
        compact
        onClick={() => {
          if (ASK_GOES_TO === 'footer') document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          else window.open(`https://t.me/${TELEGRAM}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
        }}
      >задать вопрос</PillButton>
    </span>
  );
}

// The home heading over the table (non-breaking spaces keep the short words
// with their neighbours)
const HEADING = 'Готовим бренд к\u00A0росту: от\u00A0стратегической идеи до\u00A0визуальной системы';

/** Home → services: the sub-group clicked on the home table, opened on arrival */
const OPEN_KEY = 'svc-open';

// Phone: where a category's name starts (symbol column + its 12px gap) —
// sub-group names line up on it; services and descriptions step in from it
const MOB_L1 = 'calc(22.86px + 16px + 12px)';

export function ExpertiseSection2({ level = EXPERTISE_DEFAULT_LEVEL, onLevel, showHeading = false, onAllServices }: {
  level?: number;
  /** Clicking the level-0 symbols band asks the page to unfold one step */
  onLevel?: (level: number) => void;
  showHeading?: boolean;
  /** Home: nothing unfolds here — a sub-group (or the «все услуги» button
   *  under the table) leads to the services page, where a clicked sub-group
   *  arrives already open */
  onAllServices?: (groupKey?: string) => void;
} = {}) {
  const isMobile = useMobile();
  // Kept so the row code below reads the same as the original component —
  // at level 2 the services are hidden until their sub-group is opened.
  const showItems = level >= 3;

  // One easing/duration for every expand-collapse in this table.
  const EXPAND = '0.7s cubic-bezier(0.22, 1, 0.36, 1)';

  // At level 2 both layers still work as accordions: one sub-group open at a
  // time, one description open at a time. A level change resets them, so the
  // table always lands exactly on the requested depth.
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<string | null>(null);
  useEffect(() => { setOpenGroup(null); setOpenItem(null); }, [level]);
  // Services page: open the sub-group picked on the home table and bring it
  // into view (after the page transition has settled)
  useEffect(() => {
    if (onAllServices) return;
    let key: string | null = null;
    try { key = sessionStorage.getItem(OPEN_KEY); sessionStorage.removeItem(OPEN_KEY); } catch { /* storage blocked */ }
    if (!key) return;
    setOpenGroup(key);
    const t = window.setTimeout(() => {
      const el = rootRef.current?.querySelector<HTMLElement>(`[data-group-key="${key}"]`);
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.25;
      const lenis = (window as any).__lenis;
      if (lenis?.scrollTo) lenis.scrollTo(y, { duration: 1.2 });
      else window.scrollTo({ top: y, behavior: 'smooth' });
    }, 700);
    return () => clearTimeout(t);
  }, []);
  // Row under the cursor — drives the ⤴ affordance in the column before the text
  const [hoverRow, setHoverRow] = useState<string | null>(null);

  // Phone: a tapped row stays where the finger is. Opening one closes another
  // above it, and the rows would slide up under the tap — so while the
  // lists fold and unfold, the page is scrolled to hold the tapped row still
  // and the new list simply opens downward from it.
  const holdInPlace = (el: HTMLElement) => {
    let sc: HTMLElement | null = el.parentElement;
    while (sc && !/(auto|scroll)/.test(getComputedStyle(sc).overflowY)) sc = sc.parentElement;
    const scroller = sc ?? (document.scrollingElement as HTMLElement);
    const top0 = el.getBoundingClientRect().top;
    const until = performance.now() + 900;
    const step = () => {
      const d = el.getBoundingClientRect().top - top0;
      if (Math.abs(d) >= 0.5) scroller.scrollTop += d;
      if (performance.now() < until) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const toggleGroup = (key: string) => {
    setOpenGroup(prev => (prev === key ? null : key));
    setOpenItem(null);
  };
  // The service just closed — its ball stays a moment longer to fly back up
  const [leavingItem, setLeavingItem] = useState<string | null>(null);
  const leaveTimer = useRef(0);
  useEffect(() => () => clearTimeout(leaveTimer.current), []);
  const toggleItem = (key: string) => {
    if (openItem) {
      setLeavingItem(openItem);
      clearTimeout(leaveTimer.current);
      leaveTimer.current = window.setTimeout(() => setLeavingItem(null), 500);
    }
    setOpenItem(prev => (prev === key ? null : key));
  };

  const numberStyle: React.CSSProperties = {
    margin: 0,
    fontFamily: 'var(--font)',
    fontSize: 'var(--text-size)',
    lineHeight: 'var(--text-lh)',
    letterSpacing: 'var(--text-ls)',
    color: 'var(--c-text)',
  };

  const categoryStyle: React.CSSProperties = {
    margin: 0,
    fontFamily: 'var(--font)',
    fontSize: 'var(--text-size)',
    lineHeight: 'var(--text-lh)',
    letterSpacing: 'var(--text-ls)',
    color: 'var(--c-text)',
  };

  const itemStyle: React.CSSProperties = {
    margin: 0,
    fontFamily: 'var(--font)',
    fontSize: 'var(--text-size)',
    lineHeight: 'var(--text-lh)',
    letterSpacing: 'var(--text-ls)',
    color: 'var(--c-text)',
  };

  const rootRef = useRef<HTMLDivElement>(null);
  useRowReveal(rootRef, '[data-exp-row]');

  // The heading's words rise in once, when it scrolls into view
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const h = headingRef.current;
    if (!h) return;
    const words = Array.from(h.querySelectorAll<HTMLElement>('[data-h-word]'));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { gsap.set(words, { opacity: 1 }); return; }
    gsap.set(words, { opacity: 0, y: 18 });
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      gsap.to(words, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.05, clearProps: 'transform,willChange' });
    }, { threshold: 0.4 });
    io.observe(h);
    return () => io.disconnect();
  }, [showHeading]);

  return (
    <div ref={rootRef} className={s.section} style={{ marginTop: 'var(--space-xl)' }}>
      {showHeading && (
        <h2 ref={headingRef} style={{
          ...H2_STYLE,
          margin: 0,
          marginBottom: isMobile ? 40 : 60,
          // Desktop: never wider than two columns of the page grid
          maxWidth: isMobile ? '100%' : 'calc((100% - 4 * var(--gap)) / 5 * 2 + var(--gap))',
          textAlign: isMobile ? 'center' : undefined,
        }}>
          {/* Word by word, rising in as the heading scrolls into view — on the
              phone too. Translated first: the words are split after that. */}
          {t(HEADING).split(' ').map((w, k, arr) => (
            <span key={k}>
              <span data-h-word="" style={{ display: 'inline-block', opacity: 0, willChange: 'transform, opacity' }}>{w}</span>
              {k < arr.length - 1 ? ' ' : ''}
            </span>
          ))}
        </h2>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Level 0 — the whole table folded into one grey band carrying the
            three category symbols side by side. Clicking it unfolds a step. */}
        <div style={{ display: 'grid', gridTemplateRows: level === 0 ? '1fr' : '0fr', transition: `grid-template-rows ${EXPAND}` }}>
          <div style={{ overflow: 'hidden' }}>
            <div
              onClick={() => onLevel?.(1)}
              style={{
                display: 'flex',
                gap: 'var(--gap)',
                padding: '8px 0 12px',
                paddingLeft: '22.86px',
                background: 'var(--c-surface)',
                cursor: onLevel ? 'pointer' : undefined,
              }}
            >
              {SERVICES.map((svc, k) => (
                <p key={k} style={{ ...numberStyle }}>{svc.groupLabel ?? k + 1}</p>
              ))}
            </div>
          </div>
        </div>

        {SERVICES.map((service, i) => {
          // Sub-group key: a new group starts at every labelled item; items
          // without a label belong to the previous labelled item's group.
          // A labelled item also emits a label-only row above itself, so the
          // sub-group's name sits on its own line and its services list starts
          // on the next line down, in the same column.
          type Row = {
            header: boolean; isLabel?: boolean; text: string | null;
            itemIndex: string | number | null; groupKey: string;
            itemKey?: string; desc?: string;
          };
          // Every row is always rendered — service rows just collapse to zero
          // height when their group is closed, so opening/closing animates
          // instead of snapping rows in and out of the DOM.
          let currentGroup = 0;
          const rows: Row[] = [
            { header: true, text: null, itemIndex: null, groupKey: `${i}-header` },
          ];
          service.items.forEach((item, idx) => {
            if (item.label) {
              currentGroup = idx;
              rows.push({ header: false, isLabel: true, text: null, itemIndex: item.label, groupKey: `${i}-${currentGroup}` });
            }
            rows.push({
              header: false, text: item.text, itemIndex: '',
              groupKey: `${i}-${currentGroup}`, itemKey: `${i}-item-${idx}`, desc: item.desc,
            });
          });
          return (
          <div key={i}>
          {rows.map((row, j) => {
            // Divider (magnetic SVG line, same as the services page — avoids
            // the CSS-border jitter under the page's zoom scaling) sits at the
            // TOP of a row. Only sub-group rows carry one: category headers
            // don't, and the services inside an open group are grouped by that
            // silence rather than split by lines.
            const showDivider = !row.header && !row.itemKey && j >= 2;
            // Services (3rd level) get a full-width line above each of them —
            // the first one too, under its sub-group. Descriptions (4th level)
            // get none.
            const showItemDivider = !!row.itemKey && j >= 1;
            const rowBg = row.header ? 'var(--c-surface)' : 'transparent';
            // What each level shows (rows collapse to 0 height rather than
            // unmounting, so every level change animates):
            //   category rows from level 1, sub-group rows from level 2,
            //   services from level 3 — or at level 2 inside the opened group.
            const isRowVisible = row.header ? level >= 1
              : row.isLabel ? level >= 2
              : level >= 3 || (level === 2 && openGroup === row.groupKey);
            // Clicking a sub-group label expands its services list (collapsed
            // mode only); clicking a service expands its description in col 5.
            // Home: a sub-group leads to the services page instead of unfolding
            const isCollapsibleLabel = row.isLabel && !showItems && !onAllServices;
            const isLinkLabel = row.isLabel && !!onAllServices;
            const isExpandableItem = !!row.itemKey && !!row.desc && !onAllServices;
            const onRowClick = isLinkLabel
              ? () => { try { sessionStorage.setItem(OPEN_KEY, row.groupKey); } catch { /* storage blocked */ } onAllServices!(row.groupKey); }
              : isCollapsibleLabel
              ? () => toggleGroup(row.groupKey)
              : isExpandableItem
                ? () => toggleItem(row.itemKey!)
                : undefined;
            // Level 4 opens every description; below that, the clicked one
            const isItemOpen = !!row.itemKey && (level >= 4 || openItem === row.itemKey);
            const rowCursor = onRowClick ? 'pointer' : undefined;
            // While a block is open (a sub-group, or a service's description),
            // its category stays black and the other two categories — every
            // row and link in them — go grey. Only the text: the lines keep
            // their colour (see cellFade)
            const openCat = (openGroup ?? openItem)?.split('-')[0];
            const rowOpacity = openCat !== undefined && openCat !== String(i) ? 'var(--opacity-muted)' : 1;
            // Description panel — expands on click, in the 5th column. It
            // starts one line below the service title (same offset pattern the
            // sub-group labels use) and keeps a spacing-token gap underneath.
            const descPanel = row.desc ? (
              <div style={{ display: 'grid', gridTemplateRows: isItemOpen ? '1fr' : '0fr', transition: `grid-template-rows ${EXPAND}` }}>
                <div style={{ overflow: 'hidden' }}>
                  {/* Blank lines in `desc` become paragraph breaks */}
                  <div style={{
                    marginTop: 'calc(var(--text-size) * var(--text-lh) + 20px)',
                    paddingBottom: 32,
                  }}>
                    {row.desc.split('\n\n').map((para, k) => (
                      <p key={k} style={{ ...itemStyle, marginTop: k === 0 ? 0 : PARA_GAP }}>
                        {typo(para)}
                      </p>
                    ))}
                    {/* Services page only: ask about this very service */}
                    {!onAllServices && row.text && <AskButton service={row.text} />}
                  </div>
                </div>
              </div>
            ) : null;
            // Magnetic SVG line at the row's top edge — bends toward the cursor
            // on desktop ("скакалка"), flat/static on touch.
            const divider = showDivider ? (
              <MagneticDivider flat={isMobile} />
            ) : showItemDivider ? (
              // A service's line starts where its sub-group's name does (the
              // third column; on a phone the name's indent), not at the edge
              <MagneticDivider flat={isMobile} inset={isMobile ? MOB_L1 : 'calc((100% - 4 * var(--gap)) / 5 * 2 + 2 * var(--gap))'} />
            ) : null;
            // Hover affordance for a clickable row — placed by the caller, one
            // column to the left of whatever words the row carries.
            const arrow = (
              <span
                aria-hidden="true"
                style={{
                  ...itemStyle,
                  opacity: hoverRow === `${i}-${j}` ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                  pointerEvents: 'none',
                  flexShrink: 0,
                }}
              >{onAllServices ? <CircleArrow style={{ verticalAlign: '-0.15em' }} /> : '⤴'}</span>
            );
            // Dimming lives on the text cells, never on the row box — the
            // divider lines must keep their colour when a group opens.
            const cellFade = { opacity: rowOpacity as any, transition: `opacity ${EXPAND}` };
            // Phone: 20% more air, easier to tap
            const rowPadding = isMobile ? '10px 0 14px' : '8px 0 12px';
            const rowInner = isMobile ? (
              <div data-exp-row="" data-group-key={row.isLabel ? row.groupKey : undefined} onClick={onRowClick ? e => { if (!onAllServices) holdInPlace(e.currentTarget); onRowClick(); } : undefined} style={{ position: 'relative', background: rowBg, padding: rowPadding, cursor: rowCursor }}>
                {divider}
                {row.header ? (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', ...cellFade }}>
                    {/* Fixed-width symbol, so the category name starts at a set
                        indent (MOB_L1) that the rows below line up with */}
                    <p style={{ ...numberStyle, paddingLeft: '22.86px', width: 'calc(22.86px + 16px)', flexShrink: 0, boxSizing: 'border-box' }}>{service.groupLabel ?? i + 1}</p>
                    <p style={categoryStyle}>{service.category}</p>
                  </div>
                ) : row.isLabel ? (
                  // Sub-group name (Бренд-стратегия, Фирменный стиль…) — on the
                  // category name's line; a tappable one shows its arrow
                  <div style={{ ...cellFade, paddingLeft: MOB_L1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <p style={itemStyle}>{row.itemIndex}</p>
                    {/* Home: → at the row's end — it opens the services page */}
                    {onAllServices && <span aria-hidden="true" style={{ ...itemStyle, display: 'inline-flex' }}><CircleArrow /></span>}
                  </div>
                ) : (
                  // A service 20px further in, its description 20px more
                  <div style={{ ...cellFade, paddingLeft: `calc(${MOB_L1} + 20px)` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <p style={itemStyle}>{typo(row.text)}</p>
                    </div>
                    {/* Level with the service's own name — no extra indent */}
                    <div>{descPanel}</div>
                  </div>
                )}
              </div>
            ) : (
              <div
                data-exp-row=""
                data-group-key={row.isLabel ? row.groupKey : undefined}
                onClick={onRowClick}
                style={{
                  position: 'relative',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  columnGap: 'var(--gap)',
                  alignItems: 'start',
                  padding: rowPadding,
                  background: rowBg,
                  cursor: rowCursor,
                }}
                onMouseEnter={onRowClick && !isMobile ? () => setHoverRow(`${i}-${j}`) : undefined}
                onMouseLeave={onRowClick && !isMobile ? () => setHoverRow(null) : undefined}
              >
                {divider}
                <p style={{ ...numberStyle, paddingLeft: row.header ? '22.86px' : 0, ...cellFade }}>{row.header ? service.groupLabel ?? i + 1 : ''}</p>
                {/* The ⤴ always sits one step to the left of the words it belongs
                    to: sub-group labels live in col 3, so theirs stays in col 2;
                    services live in col 4, so theirs goes to the end of col 3. */}
                {row.header ? (
                  <p style={{ ...categoryStyle, gridColumn: '2 / 3', ...cellFade }}>{service.category}</p>
                ) : (
                  <div style={{ gridColumn: '2 / 3', display: 'flex', justifyContent: 'flex-end' }}>
                    {row.isLabel && onRowClick && arrow}
                  </div>
                )}
                <div style={{ gridColumn: '3 / 4', display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 10 }}>
                  <p style={{ ...numberStyle, ...cellFade }}>{row.itemIndex ?? ''}</p>
                  {!!row.itemKey && onRowClick && arrow}
                </div>
                <p style={{ ...itemStyle, gridColumn: '4 / 5', ...cellFade }}>{row.header ? '' : typo(row.text)}</p>
                <div style={{ gridColumn: '5 / 6', ...cellFade }}>{descPanel}</div>
                {/* Services page: a ball drops into the empty middle of an opened
                    service (columns 3–4, beside its description) and hovers.
                    Mounted only while open, so every opening drops it anew. */}
                {!onAllServices && !!row.itemKey && (openItem === row.itemKey || leavingItem === row.itemKey) && (
                  <div style={{
                    position: 'absolute', pointerEvents: 'none',
                    left: 'calc((100% - 4 * var(--gap)) / 5 * 2 + 2 * var(--gap))',
                    width: 'calc((100% - 4 * var(--gap)) / 5 * 2 + var(--gap))',
                    top: 'calc(var(--text-size) * var(--text-lh) + 28px)', bottom: 44,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ServiceBall leaving={openItem !== row.itemKey} />
                  </div>
                )}
              </div>
            );
            // Every row can fold now — categories, sub-groups and services —
            // each animating its own height as the level changes.
            return (
              <div
                key={j}
                style={{ display: 'grid', gridTemplateRows: isRowVisible ? '1fr' : '0fr', transition: `grid-template-rows ${EXPAND}` }}
              >
                <div style={{ overflow: 'hidden' }}>{rowInner}</div>
              </div>
            );
          })}
          </div>
          );
        })}
      </div>
      {onAllServices && (
        // Same visible gap as above «больше проектов» on the home page (76px
        // from the last line of text; the last row adds its own 12px padding).
        // Phone: nearer the table than the next block
        <div style={{ marginTop: isMobile ? 'var(--space-btn)' : 64, display: 'flex', justifyContent: isMobile ? 'center' : 'flex-start' }}>
          <PillButton onClick={() => onAllServices()}>все услуги</PillButton>
        </div>
      )}
    </div>
  );
}
