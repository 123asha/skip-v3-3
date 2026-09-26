import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import s from './CasesPage.module.css';
import app from '../App.module.css';
import { TEXT_STYLE as ts, H2_STYLE, typo } from '../utils/typography';
import ContactForm from './ContactForm';
import { MagneticDivider } from './MagneticDivider';
import { useReveal } from '../hooks/useReveal';
import { useMobile } from '../hooks/useMobile';
import LinkFlip from './LinkFlip';
import { ExpertiseSection2, EXPERTISE_LEVELS, EXPERTISE_DEFAULT_LEVEL } from './ExpertiseSection2';
import { PARA_GAP } from './CaseTemplatePage';
import { usePinchSteps } from '../hooks/usePinchSteps';

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

// ── Intro block ──────────────────────────────────────────────────────────────
// Sits under the services table, on the site's 5-col grid: two text columns on
// the right (cols 4–5), the left three left empty. Stacks on mobile.

const CREDO = 'Верим, что простота — не про упрощение, а смелость скипнуть лишнее, что мешает проявиться сути.';

const PRINCIPLES = [
  'Один из наших принципов — привносить в работу лёгкость, юмор и отступать от шаблонов, если так получится лучший результат.',
  'Любим структуру и уважаем ясность. Поэтому делаем так, чтобы случился мэтч у всех, кто вовлечён в проект:',
];

// Symbol works as the bullet for its line.
const MATCH_POINTS: { sym: string; text: string }[] = [
  { sym: '⭆', text: 'клиентам — понятно, каким будет процесс и результат.' },
  { sym: '⤷', text: 'пользователям — удобно и приятно взаимодействовать с продуктом или брендом.' },
  { sym: '⧉', text: 'разработчикам — не приходится тратить время, чтобы разобраться в логике макетов.' },
  { sym: '※', text: 'команде — не стыдно за результат, и хочется им поделиться.' },
];

// ── Intro description ───────────────────────────────────────────────────────
// First block under the title, on the site's 5-col grid: two text columns on
// the right (cols 4–5), the left three left empty. Stacks on mobile.

function IntroBlock() {
  const isMobile = useMobile();
  const P_GAP = PARA_GAP;

  return (
    <div
      data-reveal=""
      style={{
        padding: '0 var(--pad)',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, 1fr)',
        columnGap: 'var(--gap)',
        rowGap: isMobile ? 24 : 0,
        alignItems: 'start',
        // Title is absolutely positioned, so the first in-flow block carries
        // the whole title → content gap itself.
        marginTop: 'calc(var(--pad) + var(--heading-size) * var(--heading-lh) + var(--space-title))',
      }}
    >
      {/* Col 4 — credo + principles */}
      <div style={{ gridColumn: isMobile ? 'auto' : '4 / 5' }}>
        {[CREDO, ...PRINCIPLES].map((para, i) => (
          <p key={i} style={{ ...ts, margin: 0, marginTop: i === 0 ? 0 : P_GAP }}>{typo(para)}</p>
        ))}
      </div>

      {/* Col 5 — the match points: symbol as a bullet, text to its right */}
      <div style={{ gridColumn: isMobile ? 'auto' : '5 / 6' }}>
        {MATCH_POINTS.map(({ sym, text }, i) => (
          <p key={sym} style={{ ...ts, margin: 0, marginTop: i === 0 ? 0 : P_GAP, display: 'flex', gap: 10 }}>
            <span aria-hidden="true" style={{ flexShrink: 0 }}>{sym}</span>
            <span>{typo(text)}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

// ── Four-up blocks ───────────────────────────────────────────────────────────
// Four 4:5 tiles filling the row, 20px apart. Text sits bottom-left, 15px in,
// and is exactly one grid column wide: with tiles at (row − 3·gap)/4 and
// columns at (row − 4·gap)/5, one column === (4·tile − gap)/5.

// Kept to a similar length on purpose — each caption fills exactly two lines
// at one column wide, so the four tiles read as one row.
const TILES = [
  'Собираем смыслы до того, как начинаем рисовать формы',
  'Система важнее одной удачной картинки в презентации',
  'Проверяем решения на реальных носителях, а не в вакууме',
  'Оставляем шаблоны и инструменты, чтобы дизайн жил и не ломался',
];

// Step markers with their labels, top-left of each tile
const TILE_MARKS = [
  { sym: '①', label: 'стратегия' },
  { sym: '②', label: 'дизайн' },
  { sym: '③', label: 'система' },
  { sym: '④', label: 'инструменты' },
];

// Deterministic pseudo-random 0…1, seeded — same scatter every render/reload
function pseudoRandom(seed: number): number {
  const v = Math.sin(seed * 12.9898) * 43758.5453;
  return v - Math.floor(v);
}

// How many balls fill a tile on hover, and their scattered spot + size —
// numbered 1…N instead of the hero's letters.
const TILE_BALLS = 6;

// TileBalls: render animated falling numbered balls per tile on hover
function TileBalls({ index, tileIndex, hovered }: { index: number; tileIndex: number; hovered: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const defsRef = useRef<SVGDefsElement | null>(null);
  const ballsRef = useRef<Array<{
    num: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    el: SVGCircleElement;
    textEl: SVGTextElement;
  }>>([]);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const W = rect.width, H = rect.height;

    if (hovered && ballsRef.current.length === 0) {
      // Create defs if needed for gradient
      if (!defsRef.current) {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.appendChild(defs);
        defsRef.current = defs;
      }

      // Initialize balls at top, staggered
      for (let i = 0; i < TILE_BALLS; i++) {
        const seed = tileIndex * 97 + i;
        const r = 22 + pseudoRandom(seed + 0.25) * 13;
        const x = r + pseudoRandom(seed) * (W - 2 * r);
        const y = r + pseudoRandom(seed + 0.33) * (H * 0.3);
        const vx = (pseudoRandom(seed + 0.67) - 0.5) * 200;
        const vy = -100 - pseudoRandom(seed + 0.9) * 50;

        // Sphere shading gradient
        const gradId = `sphere-${tileIndex}-${i}`;
        const grad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        grad.setAttribute('id', gradId);
        grad.setAttribute('cx', '30%');
        grad.setAttribute('cy', '30%');
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#fff');
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', 'color-mix(in srgb, #fff 95.4%, #000)');
        grad.appendChild(stop1);
        grad.appendChild(stop2);
        defsRef.current!.appendChild(grad);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', String(x));
        circle.setAttribute('cy', String(y));
        circle.setAttribute('r', String(r));
        circle.setAttribute('fill', `url(#${gradId})`);
        circle.setAttribute('opacity', '1');
        svg.appendChild(circle);

        const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textEl.setAttribute('x', String(x));
        textEl.setAttribute('y', String(y));
        textEl.setAttribute('text-anchor', 'middle');
        textEl.setAttribute('dominant-baseline', 'central');
        textEl.setAttribute('font-family', 'var(--font)');
        textEl.setAttribute('font-weight', '600');
        textEl.setAttribute('font-size', String(r * 0.55));
        textEl.setAttribute('fill', 'var(--c-text)');
        textEl.setAttribute('pointer-events', 'none');
        textEl.textContent = String(i + 1);
        svg.appendChild(textEl);

        ballsRef.current.push({ num: i + 1, x, y, vx, vy, r, el: circle, textEl });
      }
    } else if (!hovered && ballsRef.current.length > 0) {
      // Clear balls when not hovered
      ballsRef.current.forEach(b => {
        b.el.remove();
        b.textEl.remove();
      });
      ballsRef.current = [];
      if (defsRef.current) {
        defsRef.current.innerHTML = '';
      }
    }
  }, [hovered, tileIndex]);

  useEffect(() => {
    if (!hovered || !svgRef.current) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    const balls = ballsRef.current;

    const tick = () => {
      const GRAVITY = 600;
      const FRICTION = 0.99;
      const BOUNCE = 0.4;

      balls.forEach(b => {
        b.vy += GRAVITY * 0.016;
        b.x += b.vx * 0.016;
        b.y += b.vy * 0.016;
        b.vx *= FRICTION;
        b.vy *= FRICTION;

        // Wall collisions
        if (b.x - b.r < 0) {
          b.x = b.r;
          b.vx = Math.abs(b.vx) * BOUNCE;
        }
        if (b.x + b.r > W) {
          b.x = W - b.r;
          b.vx = -Math.abs(b.vx) * BOUNCE;
        }

        // Floor collision
        if (b.y + b.r > H) {
          b.y = H - b.r;
          b.vy = -Math.abs(b.vy) * BOUNCE;
        }

        b.el.setAttribute('cx', String(b.x));
        b.el.setAttribute('cy', String(b.y));
        b.textEl.setAttribute('x', String(b.x));
        b.textEl.setAttribute('y', String(b.y));
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [hovered]);

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

function Tile({ index, text, gap }: { index: number; text: string; gap: number }) {
  const isMobile = useMobile();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ position: 'relative', aspectRatio: '4/5', background: 'var(--c-surface)', overflow: 'hidden' }}
      onMouseEnter={isMobile ? undefined : () => setHovered(true)}
      onMouseLeave={isMobile ? undefined : () => setHovered(false)}
    >
      {/* Animated falling balls on hover */}
      {!isMobile && <TileBalls tileIndex={index} index={index} hovered={hovered} />}
      <span
        style={{ ...ts, position: 'absolute', top: 15, left: 15, display: 'flex', gap: 8, zIndex: 1 }}
      >
        <span aria-hidden="true">{TILE_MARKS[index].sym}</span>
        <span>{TILE_MARKS[index].label}</span>
      </span>
      <p
        style={{
          ...ts,
          position: 'absolute',
          left: 15,
          bottom: 15,
          margin: 0,
          width: isMobile ? 'calc(100% - 30px)' : `calc((4 * 100% - ${gap}px) / 5)`,
          // Two lines everywhere, so a shorter caption still occupies the
          // same block and all four line up.
          minHeight: 'calc(2 * var(--text-size) * var(--text-lh))',
        }}
      >
        {typo(text)}
      </p>
    </div>
  );
}

function TileBlocks() {
  const isMobile = useMobile();
  const GAP = 20;
  // The four tiles come up one after another from below as the row scrolls
  // into view — quick, once
  const rowRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tiles = Array.from(row.children) as HTMLElement[];
    gsap.set(tiles, { opacity: 0, y: 40 });
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      gsap.to(tiles, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.07, clearProps: 'transform,opacity' });
    }, { threshold: 0.15 });
    io.observe(row);
    return () => io.disconnect();
  }, []);

  return (
    <div className={app.section} data-reveal="">
      {/* Section title — third column of the page grid, heading style */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, 1fr)',
        columnGap: 'var(--gap)',
        marginBottom: 40,
      }}>
        <h2 style={{ ...H2_STYLE, margin: 0, gridColumn: isMobile ? 'auto' : '1 / 6' }}>Как работаем</h2>
      </div>

      <div
        ref={rowRef}
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: GAP,
        }}
      >
      {TILES.map((text, i) => (
        <Tile key={i} index={i} text={text} gap={GAP} />
      ))}
      </div>
    </div>
  );
}

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

  // ── Table depth — folded/unfolded one level at a time with ⊖ ⊕, same
  //    controls and ⌘+ / ⌘− shortcuts as the density zoom on the cases page.
  const [level, setLevel] = useState(EXPERTISE_DEFAULT_LEVEL);

  // Scroll anchor to prevent screen jump when table height changes on fold/unfold.
  // Finds the table row nearest the viewport center, keeps it visually in place
  // during the 650ms reflow animation.
  const holdLevel = (next: number) => {
    const page = pageRef.current;
    const rows = page ? Array.from(page.querySelectorAll<HTMLElement>('[data-exp-row]')) : [];
    const mid = window.innerHeight / 2;
    let anchor: HTMLElement | null = null, bestDist = Infinity;
    for (const el of rows) {
      const r = el.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= window.innerHeight) continue;
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bestDist) { bestDist = d; anchor = el; }
    }
    const before = anchor?.getBoundingClientRect().top;
    setLevel(next);
    if (!anchor || before == null || !page) return;
    const start = performance.now();
    const tick = () => {
      const now = anchor!.getBoundingClientRect().top;
      const delta = now - before;
      if (Math.abs(delta) > 0.5) page.scrollTop += delta;
      if (performance.now() - start < 650) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const unfold = () => holdLevel(Math.min(EXPERTISE_LEVELS - 1, level + 1));
  // Level 0 (the table folded into a band of three symbols) is skipped —
  // folding stops at one row per category
  const fold   = () => holdLevel(Math.max(1, level - 1));
  // Trackpad pinch folds / unfolds a level, same as ⊖ ⊕
  usePinchSteps(unfold, fold, !isMobile);

  // ── Lenis + wheel isolation, and the ⌘+ / ⌘− shortcuts ──────────────────────
  useEffect(() => {
    const mainLenis = (window as any).__lenis;
    if (mainLenis) mainLenis.stop();

    const el = pageRef.current!;
    const stopBubble = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener('wheel', stopBubble, { passive: true });

    const onKey = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;
      if (e.key === '-') { e.preventDefault(); fold(); }
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); unfold(); }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      el.removeEventListener('wheel', stopBubble);
      window.removeEventListener('keydown', onKey);
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
      <h1 className={s.title} data-reveal="" data-reveal-y="4">Услуги</h1>

      <IntroBlock />

      {/* ⌘ ⊖ ⊕ — pinned bottom-left, same place and look as the density
          hint on the cases page. Folds/unfolds the table below. */}
      {!isMobile && (
        <div style={{ position: 'fixed', left: 'var(--pad)', bottom: 'var(--pad)', zIndex: 170 }}>
          <span className={s.zoomHint} style={{ position: 'static' }}>
            <span className={s.zoomHintLabel}>⌘</span>
            <button className={s.zoomKey} aria-label="Свернуть" onClick={fold}>⊖</button>
            <button className={s.zoomKey} aria-label="Развернуть" onClick={unfold}>⊕</button>
          </span>
        </div>
      )}

      {/* Same table as the home page, but foldable one level at a time. */}
      <ExpertiseSection2 level={level} showHeading={false} />

      <TileBlocks />

      <div id="contact">
        <ContactForm variant="consult" onNavigatePolicy={onNavigatePolicy} onGridMode={onGridMode} />
      </div>
    </div>
  );
}
