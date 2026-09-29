import ZoomControl from './ZoomControl';
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
import { playKnock } from '../utils/knock';
import DownRightArrow from './DownRightArrow';

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
const MATCH_POINTS: { sym: React.ReactNode; text: string }[] = [
  { sym: '⭆', text: 'клиентам — понятно, каким будет процесс и результат.' },
  { sym: <DownRightArrow />, text: 'пользователям — удобно и приятно взаимодействовать с продуктом или брендом.' },
  { sym: '⧉', text: 'разработчикам — не приходится тратить время, чтобы разобраться в логике макетов.' },
  { sym: '※', text: 'команде — не стыдно за результат, и хочется им поделиться.' },
];

// ── Intro description ───────────────────────────────────────────────────────
// Sits under the services table, on the site's 5-col grid: two text columns
// (cols 3–4, each at most 360px wide), the rest left empty. Stacks on mobile.

function IntroBlock() {
  const isMobile = useMobile();
  const P_GAP = PARA_GAP;
  // Same entrance as the four tiles below: paragraphs come up from below one
  // after another as the block scrolls in — both columns at once, top to bottom.
  const blockRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const block = blockRef.current;
    if (!block || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cols = Array.from(block.children).map(c => Array.from(c.children) as HTMLElement[]);
    gsap.set(cols.flat(), { opacity: 0, y: 60 });
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      cols.forEach(paras => gsap.to(paras, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.09, clearProps: 'transform,opacity' }));
    }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });
    io.observe(block);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={blockRef}
      data-title-release=""
      style={{
        padding: '0 var(--pad)',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, 1fr)',
        columnGap: 'var(--gap)',
        rowGap: isMobile ? 24 : 0,
        alignItems: 'start',
        marginTop: 'var(--space-xl)',
      }}
    >
      {/* Col 3 — credo + principles */}
      <div style={{ gridColumn: isMobile ? 'auto' : '3 / 4', maxWidth: 360 }}>
        {[CREDO, ...PRINCIPLES].map((para, i) => (
          <p key={i} style={{ ...ts, margin: 0, marginTop: i === 0 ? 0 : P_GAP }}>{typo(para)}</p>
        ))}
      </div>

      {/* Col 4 — the match points: symbol as a bullet, text to its right */}
      <div style={{ gridColumn: isMobile ? 'auto' : '4 / 5', maxWidth: 360 }}>
        {MATCH_POINTS.map(({ sym, text }, i) => (
          <p key={i} style={{ ...ts, margin: 0, marginTop: i === 0 ? 0 : P_GAP, display: 'flex', gap: 10 }}>
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
  'Бренд-смыслы и фирменный стиль для цифровых продуктов',
  'Дизайн-системы и инструменты для маркетинга',
  'Бренд-стратегия и позиционирование',
  'UX/UI поддержка цифрового продукта',
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

// How many balls fill a tile on hover — numbered 1…N instead of the hero's
// letters, otherwise built exactly like the hero's constellation balls: same
// radial shading, same letter-printed-on-a-sphere displacement filter.
const TILE_BALLS = 6;
// The largest ball's radius — the one shared sphere filter is sized for it;
// the smaller balls some tiles use sit well inside that region.
const BALL_R = 132;
const NS = 'http://www.w3.org/2000/svg';

// TileBalls: render animated falling numbered balls per tile on hover, built
// the same way as Constellation's balls (shading gradient + sphere-warp filter).
// ── A squashable balloon (дизайн tile) ──────────────────────────────────────
// A superellipse |x/a|^n + |y/b|^n = 1: n = 2 is a ball; as the pressure (n)
// rises it pushes out into the corners and turns into a soft cushion, while
// a and b stop at the walls it presses against — flat where it touches,
// round everywhere else, the way a blown-up balloon fills a box.
type BlobCell = { l: number; t: number; w: number; h: number };
const BLOB_N = 96;
function balloonPath(a: number, b: number, n: number) {
  const e = 2 / n;
  const p: [number, number][] = [];
  for (let k = 0; k < BLOB_N; k++) {
    const t = (k / BLOB_N) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
    p.push([a * Math.sign(c) * Math.abs(c) ** e, b * Math.sign(s) * Math.abs(s) ** e]);
  }
  // Closed Catmull-Rom through the samples — a smooth outline, no facets
  let d = `M${p[0][0].toFixed(2)},${p[0][1].toFixed(2)}`;
  for (let k = 0; k < BLOB_N; k++) {
    const p0 = p[(k - 1 + BLOB_N) % BLOB_N], p1 = p[k], p2 = p[(k + 1) % BLOB_N], p3 = p[(k + 2) % BLOB_N];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d + 'Z';
}

function TileBalls({ tileIndex, hovered }: { tileIndex: number; hovered: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const filterIdRef = useRef(`tile-sphere-${tileIndex}-${Math.random().toString(36).slice(2)}`);
  const filterReadyRef = useRef(false);
  const ballsRef = useRef<Array<{
    num: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    group: SVGGElement;
    /** система: the column this ball is held to, so the stacks stay plumb */
    lockX?: number;
    /** инструменты: where an unseen updraft holds this ball in mid-air */
    floatX?: number;
    floatY?: number;
    /** The numeral, turned as the ball rolls */
    text: SVGTextElement;
    /** How far the ball has rolled, radians */
    spin: number;
    /** Where it was drawn last frame — spin follows the real travel */
    drawnX: number;
    /** дизайн: drawn as a rect so it can inflate into a flat panel */
    shape?: SVGPathElement;
  }>>([]);
  const rafRef = useRef<number>();

  // Build the sphere-warp displacement filter once, sized for BALL_R — same
  // algorithm as the hero: a point at distance ρ from centre shows the flat
  // letter at arc length asin(ρ)/(π/2), so the middle swells and the rim wraps away.
  useEffect(() => {
    if (!svgRef.current || filterReadyRef.current) return;
    const svg = svgRef.current;
    const filterId = filterIdRef.current;
    const R = BALL_R;
    const defs = svg.querySelector('defs')!;
    const filter = document.createElementNS(NS, 'filter');
    filter.setAttribute('id', filterId);
    filter.setAttribute('filterUnits', 'userSpaceOnUse');
    filter.setAttribute('primitiveUnits', 'userSpaceOnUse');
    filter.setAttribute('colorInterpolationFilters', 'sRGB');
    filter.setAttribute('x', String(-R));
    filter.setAttribute('y', String(-R));
    filter.setAttribute('width', String(2 * R));
    filter.setAttribute('height', String(2 * R));

    const N = 128;
    const c = document.createElement('canvas'); c.width = N; c.height = N;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(N, N);
    const offs = new Float32Array(N * N * 2);
    let max = 0.001;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const u = (x + 0.5) / N * 2 - 1, v = (y + 0.5) / N * 2 - 1;
      const rho = Math.hypot(u, v);
      let k = 0;
      if (rho > 0 && rho < 1) k = (Math.asin(rho) / (Math.PI / 2)) / rho - 1;
      const j = (y * N + x) * 2;
      offs[j] = u * k * R; offs[j + 1] = v * k * R;
      max = Math.max(max, Math.abs(offs[j]), Math.abs(offs[j + 1]));
    }
    for (let n = 0; n < N * N; n++) {
      img.data[n * 4] = 128 + Math.round(offs[n * 2] / max * 127);
      img.data[n * 4 + 1] = 128 + Math.round(offs[n * 2 + 1] / max * 127);
      img.data[n * 4 + 2] = 128; img.data[n * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);

    const feImg = document.createElementNS(NS, 'feImage');
    feImg.setAttribute('preserveAspectRatio', 'none');
    feImg.setAttribute('result', 'map');
    feImg.setAttribute('x', String(-R)); feImg.setAttribute('y', String(-R));
    feImg.setAttribute('width', String(2 * R)); feImg.setAttribute('height', String(2 * R));
    feImg.setAttributeNS('http://www.w3.org/1999/xlink', 'href', c.toDataURL());
    feImg.setAttribute('href', c.toDataURL());

    const feMap = document.createElementNS(NS, 'feDisplacementMap');
    feMap.setAttribute('in', 'SourceGraphic');
    feMap.setAttribute('in2', 'map');
    feMap.setAttribute('xChannelSelector', 'R');
    feMap.setAttribute('yChannelSelector', 'G');
    feMap.setAttribute('scale', String(max * 255 / 127));

    filter.append(feImg, feMap);
    defs.appendChild(filter);
    filterReadyRef.current = true;
  }, []);

  useEffect(() => {
    if (!svgRef.current || !filterReadyRef.current) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    const R = BALL_R;

    if (hovered && ballsRef.current.length === 0) {
      // Same drop in every tile — only what's dropped, and where it ends up,
      // differs per step:
      //   стратегия   — six equal balls in a heap
      //   дизайн      — two balls drop, then inflate and flatten until they
      //                 fill the tile as two panels
      //   система     — six balls stacking into an exact 2 × 3 grid
      //   инструменты — one big ball that drops in and is caught mid-air a
      //                 little above the middle of the tile by an unseen updraft
      // Balls are sized to fill the tile, like the strategy heap.
      type Spec = { r: number; lockX?: number; float?: boolean; dropX?: number };
      let specs: Spec[];
      if (tileIndex === 1) {
        const rd = W * 0.24;
        specs = [{ r: rd, dropX: W / 2 - rd * 0.2 }, { r: rd, dropX: W / 2 + rd * 0.2 }];
      } else if (tileIndex === 2) {
        // Two balls span the full width, like the strategy heap's size
        const rg = W / 4;
        specs = Array.from({ length: 6 }, (_, i) => ({ r: rg, lockX: i % 2 === 0 ? W / 4 : (3 * W) / 4 }));
      } else if (tileIndex === 3) {
        specs = [{ r: Math.min(R, W * 0.42), float: true }];
      } else {
        specs = Array.from({ length: TILE_BALLS }, () => ({ r: R }));
      }
      for (let i = 0; i < specs.length; i++) {
        const { r, lockX, float, dropX } = specs[i];
        const seed = tileIndex * 97 + i;
        const x = lockX ?? dropX ?? (float ? W / 2 : r + pseudoRandom(seed) * Math.max(0, W - 2 * r));
        // система: stacked in reading order from the bottom up, so the grid
        // counts 1 2 / 3 4 / 5 6 upward once it lands
        // дизайн: the second ball follows the first from above the tile
        const y = lockX !== undefined
          ? r + H * 0.3 - Math.floor(i / 2) * 2.05 * r
          : dropX !== undefined
            ? r - i * 2.6 * r
            : r + pseudoRandom(seed + 0.33) * (H * 0.3);
        const vx = (pseudoRandom(seed + 0.67) - 0.5) * 200;
        const vy = -100 - pseudoRandom(seed + 0.9) * 50;

        // Barely-there shading lit from above — same formula as the hero
        const shadeId = `${filterIdRef.current}-shade-${i}`;
        const shade = document.createElementNS(NS, 'radialGradient');
        shade.setAttribute('id', shadeId);
        if (tileIndex === 1) {
          // The same light as every other ball, but tied to the shape's box
          // so it stretches with the balloon as it squashes
          shade.setAttribute('gradientUnits', 'objectBoundingBox');
          shade.setAttribute('cx', '0.5'); shade.setAttribute('cy', '0.325');
          shade.setAttribute('r', '0.725');
        } else {
          shade.setAttribute('gradientUnits', 'userSpaceOnUse');
          shade.setAttribute('cx', '0'); shade.setAttribute('cy', String(-r * 0.35));
          shade.setAttribute('r', String(r * 1.45));
        }
        for (const [o, col] of [['0', '#ffffff'], ['0.62', '#ffffff'], ['1', 'color-mix(in srgb, #ffffff 95.4%, #000)']]) {
          const st = document.createElementNS(NS, 'stop');
          st.setAttribute('offset', o); st.setAttribute('stop-color', col);
          shade.appendChild(st);
        }
        svg.querySelector('defs')!.appendChild(shade);

        let circle: SVGElement;
        let shape: SVGPathElement | undefined;
        if (tileIndex === 1) {
          // A soft outline rather than a circle, so it can squash (see balloonPath)
          shape = document.createElementNS(NS, 'path');
          shape.setAttribute('d', balloonPath(r, r, 2));
          circle = shape;
        } else {
          circle = document.createElementNS(NS, 'circle');
          circle.setAttribute('cx', '0'); circle.setAttribute('cy', '0');
          circle.setAttribute('r', String(r));
        }
        circle.setAttribute('fill', `url(#${shadeId})`);

        const text = document.createElementNS(NS, 'text');
        text.setAttribute('x', '0'); text.setAttribute('y', '0');
        text.setAttribute('dy', '0.35em');
        text.setAttribute('font-size', String(r * 1.4875));
        text.setAttribute('text-anchor', 'middle');
        // Knocked out of the ball in the tile's own surface colour — same
        // trick as the hero's lettering
        text.setAttribute('fill', 'var(--c-surface)');
        text.style.fontFamily = 'var(--font)';
        text.style.fontWeight = '500';
        text.style.userSelect = 'none';
        text.style.pointerEvents = 'none';
        // стратегия and система are numbered — the other tiles are plain spheres
        if (tileIndex === 0 || tileIndex === 2) text.textContent = String(i + 1);

        const face = document.createElementNS(NS, 'g');
        face.setAttribute('filter', `url(#${filterIdRef.current})`);
        face.appendChild(text);

        const group = document.createElementNS(NS, 'g');
        group.setAttribute('transform', `translate(${x},${y})`);
        group.append(circle, face);
        svg.appendChild(group);

        ballsRef.current.push({ num: i + 1, x, y, vx, vy, r, group, lockX, floatX: float ? x : undefined, floatY: float ? H * 0.42 : undefined, text, spin: 0, drawnX: x, shape });
      }
    } else if (!hovered && ballsRef.current.length > 0) {
      ballsRef.current.forEach(b => {
        b.group.remove();
        svg.querySelector(`#${filterIdRef.current}-shade-${b.num - 1}`)?.remove();
      });
      ballsRef.current = [];
    }
  }, [hovered, tileIndex]);

  useEffect(() => {
    if (!hovered || !svgRef.current) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    const balls = ballsRef.current;
    // Knock on real impacts only, a beat apart per ball, so a settling heap
    // doesn't rattle — same tap as the hero's balls and the buttons
    const lastKnock = new Map<object, number>();
    // The balls appear overlapping, and the first frames of pushing them
    // apart aren't impacts — stay quiet until they've actually fallen a bit
    const spawnedAt = performance.now();
    const knockFor = (b: object, speed: number) => {
      if (speed < 180) return;
      const now = performance.now();
      if (now - spawnedAt < 250) return;
      if (now - (lastKnock.get(b) ?? 0) < 90) return;
      lastKnock.set(b, now);
      playKnock(Math.min(1, speed / 900));
    };

    // дизайн and система read as sluggish next to the others at the same
    // physics step — speed their fall/settle up without touching the rest.
    const SPEED = tileIndex === 2 ? 2 : tileIndex === 1 ? 1.5 : 1;

    // дизайн: once the two balls have landed they blow up like two balloons
    // in a box — stacked if they landed one on the other, side by side if they
    // rolled apart. Each keeps to its half: it swells round, goes flat against
    // the walls and its neighbour, then the pressure pushes it into the
    // corners until the two fill the tile, corners soft (see balloonPath).
    const INFLATE_MS = 1700 / SPEED;
    const N_END = 7;                   // corner pressure at the end — soft cushion corners
    let inflateAt: number | null = null;
    let inflateDone = false;
    let restFrames = 0;
    type Cell = BlobCell;
    let plan: { b: typeof balls[number]; x0: number; y0: number; r0: number; cell: Cell }[] = [];
    const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
    const inflate = () => {
      const now = performance.now();
      if (inflateAt === null) {
        const still = balls.every(b => Math.abs(b.vx) < 25 && Math.abs(b.vy) < 25 && b.y > 0);
        restFrames = still ? restFrames + 1 : 0;
        if (restFrames < 6 && now - spawnedAt < 1800 / SPEED) return false;
        inflateAt = now;
        const [a, b] = balls;
        const stacked = Math.abs(a.y - b.y) >= Math.abs(a.x - b.x);
        const [first, second] = stacked ? (a.y < b.y ? [a, b] : [b, a]) : (a.x < b.x ? [a, b] : [b, a]);
        const cells: Cell[] = stacked
          ? [{ l: 0, t: 0, w: W, h: H / 2 }, { l: 0, t: H / 2, w: W, h: H / 2 }]
          : [{ l: 0, t: 0, w: W / 2, h: H }, { l: W / 2, t: 0, w: W / 2, h: H }];
        plan = [first, second].map((ball, k) => ({ b: ball, x0: ball.x, y0: ball.y, r0: ball.r, cell: cells[k] }));
      }
      if (inflateDone) return true;
      const t = Math.min(1, (now - inflateAt) / INFLATE_MS);
      plan.forEach(({ b, x0, y0, r0, cell }) => {
        // Air goes in fast, then slower as it presses on the walls
        const grow = 1 - (1 - Math.min(1, t / 0.6)) ** 2.2;
        const R = r0 + (Math.max(cell.w, cell.h) / 2 - r0) * grow;
        // Flat against whatever it touches: the walls and its neighbour
        const a = Math.min(R, cell.w / 2), bb = Math.min(R, cell.h / 2);
        // Then the pressure fills the corners, with a small springy wobble
        const q = clamp((t - 0.35) / 0.65, 0, 1);
        const n = (2 + (N_END - 2) * (1 - (1 - q) ** 3)) * (1 + 0.06 * Math.sin(t * Math.PI * 6) * (1 - t));
        // Stays where it landed until the walls push it to the middle
        const cx = clamp(x0, cell.l + a, cell.l + cell.w - a);
        const cy = clamp(y0, cell.t + bb, cell.t + cell.h - bb);
        b.group.setAttribute('transform', `translate(${cx},${cy})`);
        b.shape!.setAttribute('d', balloonPath(a, bb, Math.max(2, n)));
      });
      if (t >= 1) { inflateDone = true; playKnock(0.5); }
      return true;
    };

    const tick = () => {
      if (tileIndex === 1 && balls.length === 2 && inflate()) {
        if (!inflateDone) rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const GRAVITY = 600;
      const FRICTION = 0.99;
      const BOUNCE = 0.4;
      const dt = 0.016 * SPEED;

      balls.forEach(b => {
        b.vy += GRAVITY * dt;
        // The unseen updraft: cancels gravity and springs the ball toward its
        // hover spot, with a slow bob so it reads as held up by air
        if (b.floatY !== undefined) {
          const ty = b.floatY + Math.sin(performance.now() / 450) * 7;
          b.vy += (-GRAVITY - 40 * (b.y - ty) - 6 * b.vy) * dt;
          b.vx += (-18 * (b.x - b.floatX!) - 5 * b.vx) * dt;
        }
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.vx *= FRICTION;
        b.vy *= FRICTION;

        // Soft touches don't rebound — a resting ball would otherwise keep
        // micro-bouncing off the floor and walls and read as a tremble
        if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx) > 60 ? Math.abs(b.vx) * BOUNCE : 0; }
        if (b.x + b.r > W) { b.x = W - b.r; b.vx = Math.abs(b.vx) > 60 ? -Math.abs(b.vx) * BOUNCE : 0; }
        if (b.y + b.r > H) { knockFor(b, b.vy); b.y = H - b.r; b.vy = b.vy > 60 ? -b.vy * BOUNCE : 0; }
      });

      // Ball-ball collisions — pushed apart by weight (radius) and swapping
      // the along-normal velocity component, so they pile up like real balls
      // in a jar instead of stacking on top of each other. A few passes a
      // frame, so a settled pile stays firm instead of shuffling.
      for (let pass = 0; pass < 3; pass++)
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const a = balls[i], b = balls[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          const minDist = a.r + b.r;
          if (dist < minDist) {
            const nx = dx / dist, ny = dy / dist;
            // Equal balls split it half and half, exactly as before; a small
            // ball gives way to a big one
            const wa = b.r / minDist, wb = a.r / minDist;
            const overlap = minDist - dist;
            a.x -= nx * overlap * wa; a.y -= ny * overlap * wa;
            b.x += nx * overlap * wb; b.y += ny * overlap * wb;

            const rvx = b.vx - a.vx, rvy = b.vy - a.vy;
            const rel = rvx * nx + rvy * ny;
            if (rel < 0) {
              if (pass === 0) knockFor(a, -rel);
              // A real knock keeps its soft, springy give; a slow press
              // (balls resting on each other) is stopped outright, or gravity
              // keeps pushing them together and the pile trembles
              const imp = -rel > 60 ? -rel * BOUNCE : -rel;
              a.vx -= nx * imp * wa; a.vy -= ny * imp * wa;
              b.vx += nx * imp * wb; b.vy += ny * imp * wb;
            }
          }
        }
      }

      // система: every ball stays plumb in its column
      balls.forEach(b => {
        if (b.lockX !== undefined) { b.x = b.lockX; b.vx = 0; }
        if (Math.abs(b.vx) < 4) b.vx = 0;
        b.group.setAttribute('transform', `translate(${b.x},${b.y})`);
        // A sphere turns by the distance it travels over its radius — the
        // numeral rolls round with it instead of sliding along flat
        // (the distance it actually moved, not its speed — a ball pressed
        // against a wall is trying to go somewhere but isn't turning)
        b.spin += (b.x - b.drawnX) / b.r;
        b.drawnX = b.x;
        b.text.setAttribute('transform', `rotate(${(b.spin * 180) / Math.PI})`);
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
    >
      <defs />
    </svg>
  );
}

function Tile({ index, text, gap }: { index: number; text: string; gap: number }) {
  const isMobile = useMobile();
  const [hovered, setHovered] = useState(false);
  // Phones have no hover: the balls come in by themselves once the tile is
  // on screen — tile after tile, quickly
  const tileRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = tileRef.current;
    if (!isMobile || !el) return;
    let timer = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      timer = window.setTimeout(() => setHovered(true), index * 180);
    }, { threshold: 0.35 });
    io.observe(el);
    return () => { io.disconnect(); window.clearTimeout(timer); };
  }, [isMobile, index]);

  return (
    <div
      ref={tileRef}
      // Phone: square tiles
      style={{ position: 'relative', aspectRatio: isMobile ? '1/1' : '4/5', background: 'var(--c-surface)', overflow: 'hidden' }}
      onMouseEnter={isMobile ? undefined : () => { setHovered(true); playKnock(0.35); }}
      onMouseLeave={isMobile ? undefined : () => setHovered(false)}
    >
      {/* Animated falling balls — on hover (desktop) or on scroll-in (phone) */}
      <TileBalls tileIndex={index} hovered={hovered} />
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
          // Phone: the caption on the grid's second column, level with the
          // short title at the top
          ...(isMobile ? { left: 'calc(50% + var(--gap) / 2)', width: 'calc(50% - var(--gap) / 2 - 15px)', top: 15, bottom: 'auto' } : { width: `calc((4 * 100% - ${gap}px) / 5)` }),
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
  // The four tiles come up from below one after another, first to last, the
  // moment the row starts to scroll into view — quick, once. The section
  // itself doesn't fade in as a whole, or the tiles would sit behind that
  // reveal and appear late.
  const rowRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tiles = Array.from(row.children) as HTMLElement[];
    gsap.set(tiles, { opacity: 0, y: 60 });
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      gsap.to(tiles, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.09, clearProps: 'transform,opacity' });
    }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });
    io.observe(row);
    return () => io.disconnect();
  }, []);

  return (
    <div className={app.section}>
      {/* Section title — third column of the page grid, heading style */}
      <div data-reveal="" style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, 1fr)',
        columnGap: 'var(--gap)',
        marginBottom: 40,
      }}>
        <h2 style={{ ...H2_STYLE, margin: 0, gridColumn: isMobile ? 'auto' : '1 / 6' }}>Решения</h2>
      </div>

      <div
        ref={rowRef}
        style={{
          display: 'grid',
          // Phone: one tile per row, across the column
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          // Phone: on the two-column grid (its gutter)
          gap: isMobile ? 'var(--gap)' : GAP,
        }}
      >
      {TILES.map((text, i) => (
        <Tile key={i} index={i} text={text} gap={GAP} />
      ))}
      </div>
    </div>
  );
}

// The ⌘ ⊖ ⊕ control's spot above a table/grid: its left edge on the page's
const ZOOM_ABOVE: React.CSSProperties = {
  position: 'absolute', left: 'var(--pad)', zIndex: 2,
  fontFamily: 'var(--font)', fontSize: 'var(--text-size)', fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
  lineHeight: 'var(--text-lh)', letterSpacing: 'var(--text-ls)', color: 'var(--c-text)',
};

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
  // Phones have no ⊖ ⊕: the table shows the sub-groups (level 2); a tap
  // opens a sub-group's services, another a service's description
  useEffect(() => { if (isMobile) setLevel(2); }, [isMobile]);
  const unfold = () => setLevel(l => Math.min(EXPERTISE_LEVELS - 1, l + 1));
  // Level 0 (the table folded into a band of three symbols) is skipped —
  // folding stops at one row per category
  const fold   = () => setLevel(l => Math.max(1, l - 1));
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

      {/* Same table as the home page, but foldable one level at a time. It's
          the first block under the title now, so it carries the title →
          content gap (the title is absolutely positioned) in place of its own
          section spacing. */}
      <div style={{ display: 'flow-root', position: 'relative', marginTop: 'calc(var(--inner-content-top) - var(--space-xl))' }}>
        {/* ⌘ ⊖ ⊕ — top-left, ~40px above where the table starts (desktop;
            phones have no fold control). Folds/unfolds the table below. */}
        {!isMobile && (
          <div style={{ ...ZOOM_ABOVE, top: 'calc(var(--space-xl) - 40px - var(--text-size) * var(--text-lh))' }}>
            <ZoomControl
              inline
              minusLabel="Свернуть" plusLabel="Развернуть"
              minusDisabled={level <= 1} plusDisabled={level >= EXPERTISE_LEVELS - 1}
              onMinus={fold} onPlus={unfold}
            />
          </div>
        )}
        <ExpertiseSection2 level={level} showHeading={false} />
      </div>

      <IntroBlock />

      <TileBlocks />

      <div id="contact">
        <ContactForm variant="consult" onNavigatePolicy={onNavigatePolicy} onGridMode={onGridMode} />
      </div>
    </div>
  );
}
