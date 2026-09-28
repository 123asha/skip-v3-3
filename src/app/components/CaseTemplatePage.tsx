import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMobile } from '../hooks/useMobile';
import s from './CasesPage.module.css';
import app from '../App.module.css';
import { TEXT_STYLE as textStyle, H2_STYLE as h2Style, typo } from '../utils/typography';
import { CASE_AR_H, CASE_AR_V } from './CaseCard';
import LinkFlip from './LinkFlip';
import { sound } from '../sound/Sound';
import { MagneticDivider } from './MagneticDivider';
import PillButton from './PillButton';
import { asset } from '../utils/asset';
import { usePinchSteps } from '../hooks/usePinchSteps';

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--heading-size)',
  fontWeight: 'var(--heading-weight)' as React.CSSProperties['fontWeight'],
  lineHeight: 'var(--heading-lh)',
  letterSpacing: 'var(--heading-ls)',
  color: 'var(--c-text)',
};

const TEAM: { name: string; role: string }[] = [
  { name: 'Аша Саакян',       role: 'арт-директор' },
  { name: 'Рузана Пшигонова', role: 'дизайнер' },
  { name: 'Кирилл Жуков',     role: 'разработчик' },
  { name: 'Елена Новикова',   role: 'стратег' },
];

// ── Image (real src) or grey placeholder. A .mp4/.webm src plays as a muted
//    looping video (used for converted GIFs). ──────────────────────────────────
function Img({ ar, src, style, round }: { ar: string; src?: string; style?: React.CSSProperties; round?: boolean }) {
  const isVideo = !!src && /\.(mp4|webm)$/i.test(src);
  const fill: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
  return (
    <div data-case-img="" style={{ aspectRatio: round ? '1 / 1' : ar, borderRadius: round ? '50%' : undefined, background: 'var(--c-surface)', width: '100%', overflow: 'hidden', ...style }}>
      {src && (isVideo
        ? <video src={src} autoPlay muted loop playsInline style={fill} />
        : <img src={src} alt="" loading="lazy" style={fill} />)}
    </div>
  );
}

// ── Meta / caption row ───────────────────────────────────────────────────────
// 5-col grid on the page's normal grid. The number sits at viewport centre+4px,
// the description in columns 4–5. On mobile: number centred, text 4px below it
// with marginLeft = 1/3 viewport.
/**
 * Sticky + inverted, done at body level. A `position: sticky` row blended by
 * difference inside the page's own scroll layer renders white on white in
 * Chrome, so the row stays in the flow only as an invisible placeholder and a
 * body-level copy tracks it: at its place until it reaches `top`, then held
 * there — the same inversion the nav and section titles use.
 */
function PinnedInvert({ placeholderRef, children }: { placeholderRef: React.RefObject<HTMLDivElement>; children: React.ReactNode }) {
  const floatRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const update = () => {
      const ph = placeholderRef.current, fl = floatRef.current;
      if (!ph || !fl) return;
      const pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pad')) || 0;
      // Rects come back in screen px under the page's CSS zoom; the fixed
      // copy's left/top/width are layout px, so undo the zoom
      const pz = parseFloat(document.documentElement.style.zoom || '1') || 1;
      const r = ph.getBoundingClientRect();
      fl.style.left = `${r.left / pz}px`;
      fl.style.width = `${r.width / pz}px`;
      fl.style.top = `${Math.max(pad, r.top / pz)}px`;
    };
    update();
    window.addEventListener('scroll', update, { capture: true, passive: true });
    window.addEventListener('resize', update);
    const ro = new ResizeObserver(update);
    if (placeholderRef.current) ro.observe(placeholderRef.current);
    return () => {
      window.removeEventListener('scroll', update, { capture: true });
      window.removeEventListener('resize', update);
      ro.disconnect();
    };
  }, [placeholderRef]);
  return createPortal(
    <div
      ref={floatRef}
      data-page-float=""
      className={s.pageFloat}
      style={{ position: 'fixed', zIndex: 199, color: '#fff', mixBlendMode: 'difference' }}
    >{children}</div>,
    document.body,
  );
}

function MetaRow({
  col1, col2, num, text, col2IsTitle,
}: { col1?: React.ReactNode; col2?: string; num?: string; text: string; col2IsTitle?: boolean }) {
  const mob = useMobile();
  if (mob) {
    // Phone: the same caption grid as the case cards — name on the left,
    // the year (grey) and the text on the right
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(90px, 1fr) minmax(0, 3fr)', gap: 'var(--gap)', alignItems: 'start' }}>
        <div>
          {col1 && <p style={{ ...textStyle, margin: 0 }}>{col1}</p>}
          {col2 && (col2IsTitle
            ? <h1 style={{ ...textStyle, margin: 0 }}>{col2}</h1>
            : <p style={{ ...textStyle, margin: 0 }}>{col2}</p>)}
        </div>
        <div style={{ minWidth: 0 }}>
          {num && <p style={{ ...textStyle, opacity: 'var(--opacity-muted)', margin: 0 }}>{num}</p>}
          {text.split('\n\n').map((para, k) => (
            <p key={k} style={{ ...textStyle, margin: 0, marginTop: k === 0 ? 0 : PARA_GAP }}>{typo(para)}</p>
          ))}
        </div>
      </div>
    );
  }
  // No side margins — the row sits on the case page's own grid (4px side
  // padding), the same one the images and copy column use, so every column
  // edge lines up down the page.
  return (
    <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--gap)', alignItems: 'start' }}>
      {col1 && <p style={{ ...textStyle, gridColumn: '1', margin: 0 }}>{col1}</p>}
      {/* The case name lives here — the cover carries no centred title */}
      {col2 && (col2IsTitle
        ? <h1 style={{ ...textStyle, gridColumn: '2', margin: 0, color: 'inherit' }}>{col2}</h1>
        : <p style={{ ...textStyle, gridColumn: '2', margin: 0, color: 'inherit' }}>{col2}</p>)}
      {/* Year — always centred on the page, whatever else the row carries */}
      {num && <p style={{ ...textStyle, opacity: 'var(--opacity-muted)', position: 'absolute', left: '50%', top: 0, margin: 0, transform: 'translateX(-50%)', whiteSpace: 'nowrap', color: 'inherit' }}>{num}</p>}
      {/* Exactly one column wide — no loose max-width that straddles the grid */}
      <div style={{ gridColumn: '4 / 5' }}>
        {text.split('\n\n').map((para, k) => (
          <p key={k} style={{ ...textStyle, margin: 0, marginTop: k === 0 ? 0 : PARA_GAP, color: 'inherit' }}>{typo(para)}</p>
        ))}
      </div>
    </div>
  );
}

// Block wrapper — spacing to the NEXT block: 20px normally, +32px (= 52px) when
// the block ends with a caption.
function Block({ caption, children }: { caption?: boolean; children: React.ReactNode }) {
  return <div style={{ marginBottom: caption ? 52 : 4 }}>{children}</div>;
}

// Case-page grid is its own: 4px column gutters + 4px side margins (header /
// footer keep the global --pad; this only governs the case blocks).
const GAP = '4px';
const SIDE = '4px';
const ZOOM_EASE = '0.6s cubic-bezier(0.22, 1, 0.36, 1)';

// Gap between paragraphs inside one text block — same value site-wide.
export const PARA_GAP = 10;

// ── Per-case data ────────────────────────────────────────────────────────────
// Everything that differs between cases lives here. The `blocks` array drives
// the body layout — image placeholders for now until real assets land.
// `title` is the heading shown to the LEFT of its description in the copy
// column (Контекст / Стратегия / Дизайн …).
export type CaseBlock =
  // one image (full width / single column); optional caption below it
  | { kind: 'single'; ar: 'h' | 'v'; title?: string; caption?: string; src?: string }
  // two images side by side; optional caption (and extra text-only paragraph)
  | { kind: 'duo'; left: 'h' | 'v'; right: 'h' | 'v'; title?: string; caption?: string; belowTitle?: string; belowText?: string; leftSrc?: string; rightSrc?: string }
  // text-only block (no image)
  | { kind: 'text'; title?: string; text: string };

export interface CaseData {
  /** Buttons under the copy column — outbound links for this case */
  links?: { label: string; href: string }[];
  /** This case's own route — used by the teaser that closes the previous case */
  href?: string;
  title: string;     // cover heading
  year: string;      // intro meta number (shown instead of "00/")
  /** Categories this case belongs to — rendered as chips, at most three:
   *  Брендинг · Веб · Продукт */
  tags: string[];
  industry: string;  // meta col 2
  intro: string;     // meta description text
  coverVideo?: string; // if set, the cover plays this video instead of a flat colour
  blocks: CaseBlock[];
  team: { name: string; role: string }[];
  testimonial?: { quote: string; name: string; phrase: string }; // omit to hide
}

// Reading order of the cases — the last block of one case shows the next one
const CASES: CaseData[] = [];

const DEFAULT_TESTIMONIAL = {
  quote: '«Здесь будет отзыв клиента о работе команды над проектом — пара предложений о результате.»',
  name: 'Имя Фамилия, должность',
  phrase: 'Одна фраза о сотрудничестве.',
};

const CAP = 'Подпись к блоку — короткое описание решения.';

const GATE_LEGAL: CaseData = {
  href: '/case-template',
  // Placeholder links — swap for the real ones per case
  links: [
    { label: 'behance', href: 'https://behance.net' },
    { label: 'сайт', href: 'https://example.com' },
  ],
  title: 'Gate Legal',
  year: '2026',
  tags: ['Брендинг', 'Веб'],
  industry: 'Финтех',
  intro: 'Краткое описание проекта и ключевых задач. Что было сделано, каких результатов достигли.',
  blocks: [
    { kind: 'single', ar: 'h' },
    {
      kind: 'single', ar: 'h',
      title: 'Контекст',
      caption: 'Рынок приложений для саморазвития перегрет. Продукты выглядят одинаково из-за ассоциаций первого уровня — космос, луна, звёзды. Другая проблема — восприятие приложений-трекеров, которые работают по принципу «сделай или умри». Это приводит к выгоранию и чувству вины. Даже если человек скачивает приложение, то потом забрасывает.\n\nMagic Moon — приложение, которое объединяет целеполагание, медитации и ментальные практики. Продукт работал с тёплой аудиторией, которая хорошо знает основателя — Юру Мурадяна. Задача — масштабироваться, а значит выйти на холодную аудиторию. Для этого приложению нужно самодостаточное позиционирование и визуальный язык, который вызовет доверие и не скатится в ощущение «очередное приложение с гороскопами».',
    },
    { kind: 'duo', left: 'v', right: 'v' },
    {
      kind: 'duo', left: 'v', right: 'v',
      title: 'Стратегия',
      caption: 'Инсайт из анализа глубинных интервью, вокруг которого строится продукт: людям не нужен ещё один пинок. Они ищут поддержку и хотят выбирать: прислушиваться к советам или нет.\n\nМиссия Magic Moon — создавать новую культуру достижения целей. Другой путь к большим мечтам: без жёстких трекеров и насилия над собой.',
    },
    { kind: 'duo', left: 'h', right: 'v' },
    {
      kind: 'duo', left: 'v', right: 'h',
      title: 'Дизайн',
      caption: 'Стать ежедневным ритуалом для людей, которые выбирают путь к мечте через гармонию с собой.',
    },
    {
      kind: 'duo', left: 'v', right: 'h',
      title: 'Разработка',
      caption: 'Метафора бренда — лунный цветок. Цветок раскрывается постепенно, его нельзя заставить расти быстрее, за ним важно ухаживать. Лунный — потому что растёт в особых условиях и в своём ритме.',
    },
  ],
  team: TEAM,
  testimonial: DEFAULT_TESTIMONIAL,
};

// Senior*s images live in public/cases/seniors/ (1.webp … 12.webp).
const si = (n: number) => asset(`/cases/seniors/${n}.webp`);

const SEN_CAPS = {
  c00:   'Баров в Тбилиси десятки, и каждый сезон закрываются старые и открываются новые, а конкуренция за гостей — огромная. Хорошие напитки и классная атмосфера — база, этим невозможно выделиться.\n\nЕщё одна проблема — название. Senior’s читается как бар для сеньоров — для пенсионеров или только для разработчиков. Реальная аудитория бара шире, но название сужает и может отпугнуть людей из креативных индустрий.',
  below: 'Боль аудитории не в том, что некуда пойти в пятницу вечером. Боль — одиночество, изоляция и потеря старых социальных связей после переезда. Это меняет задачу: искать точку отстройки не через меню и атмосферу, а через отношения.\n\nСуть бренда — бар своей среды. Это коммьюнити-бар, в котором экспаты находят своих. Место, где случайный разговор может стать началом дружбы. Митапы, диджей-сеты, нетворкинг, ивенты — то, из-за чего хочется зайти в бар в любой день.',
  c01:   'Ключевой образ бренда — звезда и её путеводный свет — заметный ориентир, к которому хочется вернуться.',
  c02:   'Буква S и лучевая композиция построены на одной оси: лучи задают ритм, а S движется вместе с ними. Так возникает естественная связь между образом света и знаком бренда.',
  c03:   'В фонах используется тот же лучевой ритм: это и маяк, и центр притяжения, вокруг которого выстраиваются все элементы. Световые лучи могут быть длиннее или короче, задавая нужные темп и настроение.',
  c04:   'Айдентика превращает ключевую идею бренда в цельную и современную визуальную систему: в основе каждого элемента — точка света, с которой всё начинается.',
  c05:   'Система живая, тёплая и динамичная. С ней Senior*s ещё отчётливее звучит как место своего света, оставаясь визуально понятным и эмоционально близким своему сообществу.',
};

export const SENIORS_BAR: CaseData = {
  href: '/Seniorsbar',
  title: 'Senior*s Bar',
  year: '2025',
  tags: ['Брендинг'],
  industry: 'ХоРеКа',
  intro: 'Бар своей среды. Визуальный язык для офлайна и онлайна.',
  coverVideo: asset('/seniors.mp4'),
  blocks: [
    // Copy column — same four-step template as every other case
    { kind: 'text', title: 'Контекст',  text: SEN_CAPS.c00 },
    { kind: 'text', title: 'Стратегия', text: SEN_CAPS.below },
    { kind: 'text', title: 'Дизайн',    text: [SEN_CAPS.c01, SEN_CAPS.c02, SEN_CAPS.c03].join('\n\n') },
    { kind: 'text', title: 'Результат', text: [SEN_CAPS.c04, SEN_CAPS.c05].join('\n\n') },
    // Image stack
    { kind: 'duo', left: 'v', right: 'h', leftSrc: si(1), rightSrc: si(2) },
    { kind: 'single', ar: 'h', src: asset('/cases/seniors/3.mp4') },
    { kind: 'single', ar: 'h', src: si(4) },
    { kind: 'duo', left: 'v', right: 'h', leftSrc: si(5), rightSrc: si(6) },
    { kind: 'single', ar: 'h', src: si(7) },
    { kind: 'single', ar: 'h', src: si(8) },
    { kind: 'duo', left: 'v', right: 'v', leftSrc: si(9), rightSrc: si(10) },
    { kind: 'single', ar: 'h', src: si(12) },
    { kind: 'single', ar: 'h', src: si(11) },
    { kind: 'single', ar: 'h', src: si(13) },
  ],

  team: TEAM,
  // testimonial omitted — not shown on the Senior*s page.
};

// Reading order of the cases — the last block of one case shows the next one
CASES.push(GATE_LEGAL, SENIORS_BAR);

export default function CaseTemplatePage({ onNavigatePolicy, onGridMode, onNavigateCase, data = GATE_LEGAL }: { onNavigatePolicy?: () => void; onGridMode?: (on: boolean) => void; onNavigateCase?: (href: string) => void; data?: CaseData }) {
  // The case that follows this one — its meta strip closes the page
  const nextCase = CASES[(CASES.findIndex(c => c.title === data.title) + 1) % CASES.length];
  // …and it has to land exactly where that case's own strip sits under its
  // cover, so clicking through leaves it in place and only the cover appears
  // above it. The cover is 84vh (70vh on mobile), so the strip's top must be
  // that far down the screen once the page is scrolled to the end — which
  // means leaving the remainder of the screen below it as padding.

  const pageRef = useRef<HTMLDivElement>(null);
  const coverVidRef = useRef<HTMLVideoElement>(null);
  const [hoveredTeam, setHoveredTeam] = useState<number | null>(null);
  // Copy column behaves like the services table: one entry open at a time,
  // the first one open on load.
  const [openCopy, setOpenCopy] = useState(0);
  const [hoveredCopy, setHoveredCopy] = useState(-1);
  // Height of the type/industry row — the sticky year+intro row is pulled up by
  // exactly this much so all four meta items start on the same line, however
  // many lines the first one wraps to.
  const typesRef = useRef<HTMLDivElement>(null);
  const [typesH, setTypesH] = useState(0);
  // Height of the sticky meta row — the copy column sticks 40px below it.
  const metaRef = useRef<HTMLDivElement>(null);
  const [metaH, setMetaH] = useState(0);
  useLayoutEffect(() => {
    const el = typesRef.current;
    if (!el) return;
    const measure = () => setTypesH(el.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = metaRef.current;
    if (!el) return;
    const measure = () => setMetaH(el.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const [formInView, setFormInView] = useState(false);
  const isMobile = useMobile();

  // ── Reading width, stepped with ⊖ ⊕ (and ⌘− / ⌘+, trackpad pinch) ─────────
  //   0 — images on the left, the copy column on the right (default)
  //   1 — the copy folds away to the right and the images take the full width
  const [caseZoom, setCaseZoom] = useState(0);
  // Widening the images column reflows every picture below it, so the page's
  // height changes under a fixed scrollTop and whatever was on screen jumps.
  // Instead: note which picture is currently in view, switch the zoom level,
  // then correct scrollTop every frame through the transition so that same
  // picture stays exactly where it was.
  const holdInView = (next: number) => {
    const page = pageRef.current;
    const pics = page ? Array.from(page.querySelectorAll<HTMLElement>('[data-case-img]')) : [];
    const mid = window.innerHeight / 2;
    let anchor: HTMLElement | null = null, bestDist = Infinity;
    for (const el of pics) {
      const r = el.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= window.innerHeight) continue;
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bestDist) { bestDist = d; anchor = el; }
    }
    const before = anchor?.getBoundingClientRect().top;
    setCaseZoom(next);
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
  const zoomIn  = () => holdInView(1);
  const zoomOut = () => holdInView(0);
  usePinchSteps(zoomIn, zoomOut, !isMobile);
  useEffect(() => {
    if (isMobile) return;
    const onKey = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;
      if (e.key === '-') { e.preventDefault(); zoomOut(); }
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomIn(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobile]);

  const nextRef = useRef<HTMLDivElement>(null);
  const [nextPad, setNextPad] = useState(0);
  useLayoutEffect(() => {
    const el = nextRef.current;
    if (!el) return;
    const measure = () => {
      const coverFrac = isMobile ? 0.70 : 0.84;
      // Same line the strip's text sits on at the top of a case: cover + its
      // 10px gap. The strip carries its own top padding (--pad) above the
      // text, so its box starts that much higher.
      const pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pad')) || 0;
      const target = window.innerHeight * coverFrac + 10 - pad;
      setNextPad(Math.max(0, window.innerHeight - target - el.offsetHeight));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [isMobile, nextCase]);

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

  // Cover video — scrubs with scroll on desktop (like the home hero); mobile
  // autoplays since iOS can't render a scrubbed paused video.
  useEffect(() => {
    if (isMobile) return;
    const page = pageRef.current;
    const vid = coverVidRef.current;
    if (!page || !vid) return;
    const onScroll = () => {
      const dur = vid.duration;
      if (!dur || !isFinite(dur)) return;
      const coverH = window.innerHeight * 0.84; // cover = 84vh on desktop
      const p = Math.max(0, Math.min(1, page.scrollTop / coverH));
      const t = p * dur;
      if (Math.abs(vid.currentTime - t) > 0.03) {
        if (!vid.paused) vid.pause();
        vid.currentTime = t;
      }
    };
    page.addEventListener('scroll', onScroll, { passive: true });
    const seek0 = () => { try { vid.currentTime = 0; } catch { /* not seekable yet */ } };
    if (vid.readyState >= 1) seek0(); else vid.addEventListener('loadedmetadata', seek0, { once: true });
    return () => page.removeEventListener('scroll', onScroll);
  }, [isMobile]);

  // Fade the "+ новый проект" button once the contact form scrolls into view.
  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;
    const form = root.querySelector('[class*="contactWrap"]');
    if (!form) return;
    const obs = new IntersectionObserver(([e]) => setFormInView(e.isIntersecting), { root, threshold: 0.05 });
    obs.observe(form);
    return () => obs.disconnect();
  }, []);

  return (
    // No sideways scroll ever — the zoom step's slide-out must not flash a bar
    <div ref={pageRef} className={s.page} style={{ overflowX: 'hidden' }}>
      {/* ── First screen: cover + intro meta 10px under it. The body below
            keeps its distance so the image blocks still start on the next
            screen. ─────────────────────────────────────────────────────── */}
      <div>
        <div style={{ position: 'relative', width: '100%', height: isMobile ? '70vh' : '84vh', overflow: 'hidden' }}>
          {data.coverVideo ? (
            <video
              ref={coverVidRef}
              src={data.coverVideo}
              muted playsInline preload="auto"
              autoPlay={isMobile} loop={isMobile}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: 'var(--c-surface)' }} />
          )}
        </div>
      </div>

      {/* Categories — the site's chips, in a row */}
      <div ref={typesRef} style={{ padding: '0 var(--pad)', marginTop: 10 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {data.tags.map(t => (
            <span key={t} className={s.chip}>{t}</span>
          ))}
        </div>
      </div>

      {/* Year + intro — pulled up by one line so all four meta items start on
          the same row under the cover; from there these two stick to the top
          of the viewport, on the nav's baseline, for the rest of the case. */}
      {/* In-flow placeholder (keeps the layout and the measured height); the
          visible, inverted row is PinnedInvert's body-level copy of it */}
      {/* Phone: no pinning — the row simply follows the chips, 10px below
          them, like a card's caption under its picture */}
      <div
        ref={metaRef}
        aria-hidden={isMobile ? undefined : true}
        style={{
          position: 'relative',
          padding: '0 var(--pad)',
          marginTop: isMobile ? 10 : -typesH,
          visibility: isMobile ? 'visible' : 'hidden',
        }}
      >
        <MetaRow col2={data.title} col2IsTitle num={data.year} text={data.intro} />
      </div>
      {!isMobile && (
        <PinnedInvert placeholderRef={metaRef}>
          <div style={{ padding: '0 var(--pad)' }}>
            <MetaRow col2={data.title} col2IsTitle num={data.year} text={data.intro} />
          </div>
        </PinnedInvert>
      )}

      <div style={{
        padding: 'var(--pad)',
        // Push the body past the first screen — with the meta row's own height
        // on top of this, nothing of the copy column or the image stack peeks
        // out from under the cover. Reduced to bring title/description higher.
        // Phone: the regular section spacing
        marginTop: isMobile ? 'var(--space-xl)' : 'calc(100svh - 75vh)',
      }}>

        {/* ── Body ─────────────────────────────────────────────────────────
              Desktop: images stack on the LEFT, narrowed to three of the
              page's five columns; every caption and text block is collected
              on the RIGHT, in columns 4–5, flowing across two text columns.
              Mobile keeps the old single-file order (image → its caption). ── */}
        {(() => {
          const images: React.ReactNode[] = [];
          const copy: React.ReactNode[] = [];

          // One copy entry — heading in the left half of the copy area, its
          // description in the right half. Titled entries collapse like the
          // rows of the services table (same easing, one open at a time);
          // an untitled paragraph just always shows.
          const EXPAND = '0.7s cubic-bezier(0.22, 1, 0.36, 1)';
          let copyIdx = 0;

          const pushCopy = (key: string, text: string, title?: string) => {
            const idx = title ? copyIdx++ : -1;
            const isOpen = idx < 0 || openCopy === idx;
            copy.push(
              // Click target is the whole row — padding and the empty half of a
              // collapsed row included.
              <div
                key={key}
                onClick={title ? () => setOpenCopy(idx) : undefined}
                onMouseEnter={title && !isMobile ? () => setHoveredCopy(idx) : undefined}
                onMouseLeave={title && !isMobile ? () => setHoveredCopy(-1) : undefined}
                style={{
                  position: 'relative',
                  paddingTop: 12,
                  paddingBottom: 12,
                  cursor: title ? 'pointer' : undefined,
                }}
              >
                {idx > 0 && <MagneticDivider flat={isMobile} />}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    columnGap: 'var(--gap)',
                    rowGap: isMobile ? 8 : 0,
                    alignItems: 'start',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <p style={{
                      ...textStyle,
                      margin: 0,
                      opacity: isOpen ? 1 : 'var(--opacity-muted)' as any,
                      transition: `opacity ${EXPAND}`,
                    }}>{title ? typo(title) : ''}</p>
                    {/* Hover affordance — at the right edge of the heading
                        column; the open entry doesn't need it. */}
                    {title && !isMobile && !isOpen && (
                      <span
                        aria-hidden="true"
                        style={{
                          ...textStyle,
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          opacity: hoveredCopy === idx ? 1 : 0,
                          transition: 'opacity 0.2s ease',
                          pointerEvents: 'none',
                        }}
                      >⤴</span>
                    )}
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    transition: `grid-template-rows ${EXPAND}`,
                  }}>
                    <div style={{ overflow: 'hidden' }}>
                      {/* Starts one line below the heading, like the services
                          table; blank lines in the copy become paragraphs
                          10px apart (PARA_GAP). */}
                      <div style={{
                        marginTop: isMobile ? 0 : 'calc(var(--text-size) * var(--text-lh))',
                        paddingBottom: 8,
                      }}>
                        {text.split('\n\n').map((para, k) => (
                          <p key={k} style={{ ...textStyle, margin: 0, marginTop: k === 0 ? 0 : PARA_GAP }}>{typo(para)}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>,
            );
          };

          // Every third picture down the page is shown as a circle
          let imgCount = 0;
          const nextRound = () => ++imgCount % 3 === 0;
          data.blocks.forEach((b, i) => {
            if (b.kind === 'text') {
              pushCopy(`t${i}`, b.text, b.title);
              return;
            }
            if (b.kind === 'single') {
              images.push(
                <Block key={i}>
                  <Img ar={b.ar === 'h' ? CASE_AR_H : CASE_AR_V} src={b.src} round={nextRound()} />
                </Block>,
              );
              if (b.caption) pushCopy(`c${i}`, b.caption, b.title);
              return;
            }
            // duo — its two images, stacked like every other block
            const leftAr  = b.left  === 'h' ? CASE_AR_H : CASE_AR_V;
            const rightAr = b.right === 'h' ? CASE_AR_H : CASE_AR_V;
            // Left column is a single stack — a duo's two images simply follow
            // each other vertically instead of sitting side by side.
            images.push(
              <Block key={i}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Img ar={leftAr} src={b.leftSrc} round={nextRound()} />
                  <Img ar={rightAr} src={b.rightSrc} round={nextRound()} />
                </div>
              </Block>,
            );
            if (b.caption) pushCopy(`c${i}`, b.caption, b.title);
            if (b.belowText) pushCopy(`b${i}`, b.belowText, b.belowTitle);
          });

          // Mobile: the copy block first (first entry open, the rest just
          // headings), then every image stacked underneath.
          if (isMobile) {
            return (
              <>
                <div style={{ marginBottom: 40 }}>
                  {copy}
                  <div style={{ marginTop: 40, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    <PillButton
                      onClick={() => {
                        const el = document.querySelector('[data-case-credits]') as HTMLElement | null;
                        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >скипнуть</PillButton>
                    {data.links?.map(l => (
                      <PillButton key={l.href} href={l.href}>{l.label}</PillButton>
                    ))}
                  </div>
                </div>
                {images}
              </>
            );
          }

          return (
            // No clipping here — the images bleed past this box to the page
            // edges; the page itself refuses sideways scroll instead
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              {/* Images keep the case page's own 4px bleed on the left. Default
                  width = 3 of the 5 grid columns; zoomed in = the whole row,
                  bleeding the same 4px on the right too. */}
              <div style={{
                flex: 'none',
                marginLeft: `calc(-1 * var(--pad) + ${SIDE})`,
                width: caseZoom
                  ? `calc(100% + 2 * (var(--pad) - ${SIDE}))`
                  : `calc((100% - 4 * var(--gap)) * 3 / 5 + 2 * var(--gap) + var(--pad) - ${SIDE})`,
                transition: `width ${ZOOM_EASE}`,
              }}>{images}</div>
              {/* Copy sticks 40px under the meta row while the images scroll
                  past; zoomed in, it folds away to the right */}
              <div style={{
                flex: 'none',
                width: caseZoom ? 0 : 'calc((100% - 4 * var(--gap)) * 2 / 5 + var(--gap))',
                marginLeft: caseZoom ? 0 : 'var(--gap)',
                opacity: caseZoom ? 0 : 1,
                transform: caseZoom ? 'translateX(40px)' : 'none',
                overflow: 'hidden',
                pointerEvents: caseZoom ? 'none' : undefined,
                transition: `width ${ZOOM_EASE}, margin-left ${ZOOM_EASE}, opacity 0.35s ease, transform ${ZOOM_EASE}`,
                position: 'sticky',
                top: `calc(var(--pad) + ${metaH}px + 40px)`,
                alignSelf: 'flex-start',
              }}>
               {/* Fixed-width inner block, so the copy slides out whole
                   instead of reflowing into an ever-narrower column */}
               <div style={{ width: 'calc((100vw - 2 * var(--pad) - 4 * var(--gap)) * 2 / 5 + var(--gap))' }}>
                {copy}
                {/* Skip the read-through, plus this case's outbound links */}
                <div style={{ marginTop: 40, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <PillButton
                    onClick={() => {
                      const el = document.querySelector('[data-case-credits]') as HTMLElement | null;
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  >скипнуть</PillButton>
                  {data.links?.map(l => (
                    <PillButton key={l.href} href={l.href}>{l.label}</PillButton>
                  ))}
                </div>
               </div>
              </div>
            </div>
          );
        })()}

        {/* ⌘ ⊖ ⊕ — bottom-left, same control as on the other pages */}
        {!isMobile && (
          <span className={s.zoomHint}>
            <button className={s.zoomKey} aria-label="Описание" onClick={zoomOut}>⊖</button>
            <button className={s.zoomKey} aria-label="Только картинки" onClick={zoomIn}>⊕</button>
          </span>
        )}

        {/* ── Credits. Desktop: centred, 40px gap under label, 20px between names.
              Mobile: left-aligned at 1/3 vw, role appears LEFT of the name. ── */}
        <div data-case-credits style={{
          marginTop: 120,
          display: 'flex', flexDirection: 'column', gap: 40,
          ...(isMobile
            ? { alignItems: 'flex-start', paddingLeft: 'calc(33.333vw - var(--pad) + 4px)', textAlign: 'left' }
            : { alignItems: 'center', textAlign: 'center' }),
        }}>
          <p style={{ ...textStyle, margin: 0 }}>Над проектом работали:</p>
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 20,
            alignItems: isMobile ? 'flex-start' : 'center',
            ...headingStyle,
            textAlign: isMobile ? 'left' : 'center',
          }}>
            {data.team.map(({ name, role }, i) => (
              <p
                key={i}
                style={{ position: 'relative', margin: 0, fontSize: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}
                onMouseEnter={() => { setHoveredTeam(i); sound.play('hover'); }}
                onMouseLeave={() => setHoveredTeam(null)}
                onTouchStart={() => { setHoveredTeam(hoveredTeam === i ? null : i); sound.play('hover'); }}
              >
                <LinkFlip flat>{name}</LinkFlip>
                {/* role — desktop: top-right; mobile: top-left of the name */}
                <span style={{
                  ...textStyle,
                  lineHeight: 1,
                  position: 'absolute',
                  ...(isMobile
                    ? { right: 'calc(100% + 8px)', bottom: '100%' }
                    : { left: 'calc(100% + 8px)', bottom: '100%' }),
                  transform: 'translateY(0.55em)',
                  whiteSpace: 'nowrap',
                  opacity: hoveredTeam === i ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                  pointerEvents: 'none',
                }}>{role}</span>
              </p>
            ))}
          </div>
        </div>

        {/* ── Testimonial — only when the case provides one. Quote is h2; below
              it a small avatar circle + name/role + one phrase. ── */}
        {data.testimonial && (
        <div style={{ marginTop: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <p style={{ ...h2Style, margin: 0, maxWidth: 820 }}>
            {data.testimonial.quote}
          </p>
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {/* photo placeholder */}
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--c-surface)' }} />
            <p style={{ ...textStyle, margin: 0 }}>{data.testimonial.name}</p>
            <p style={{ ...textStyle, margin: 0, opacity: 'var(--opacity-muted)' }}>{data.testimonial.phrase}</p>
          </div>
        </div>
        )}

      </div>

      {/* "+ новый проект" — sticky pill, hidden on case pages for now. */}
      {false && (
      <button
        className={app.newProjectBtn}
        style={{
          position: 'sticky',
          bottom: 'var(--pad)',
          marginLeft: 'var(--pad)',
          marginTop: 'calc(-1 * var(--text-size) * var(--text-lh) - 20px)',
          zIndex: 60,
          mixBlendMode: 'difference',
          background: 'transparent',
          border: 'none',
          borderRadius: 0,
          padding: 0,
          cursor: formInView ? 'default' : 'pointer',
          opacity: formInView ? 0 : 1,
          pointerEvents: formInView ? 'none' : 'auto',
          transition: 'opacity 0.35s ease',
          fontFamily: 'var(--font)',
          fontSize: 'var(--text-size)',
          fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
          letterSpacing: 'var(--text-ls)',
          lineHeight: 'var(--text-lh)',
          color: '#000',
          textDecoration: 'none',
          display: 'inline-block',
          perspective: 'none',
          alignSelf: 'flex-start',
        }}
        onMouseEnter={() => sound.play('hover')}
        onClick={() => {
          const el = pageRef.current?.querySelector('[class*="contactWrap"]') as HTMLElement | null;
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        <span className={app.newProjectFlipInner}>
          <span className={app.newProjectFace} style={{ background: '#fff', padding: '9px 12px 11px 12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>
            <span className={app.newProjectPlusGhost} aria-hidden="true">+</span>
            новый проект
          </span>
          <span className={`${app.newProjectFace} ${app.newProjectFaceBottom}`} style={{ background: '#fff', padding: '9px 12px 11px 12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>
            <span style={{ marginRight: 6 }}>+</span>
            новый проект
          </span>
        </span>
      </button>
      )}

      {/* Closing block — the next case starts here: its chips, name, year and
          intro, exactly the strip that sits under a cover, but without the
          cover itself. Clicking it opens that case. */}
      <div
        ref={nextRef}
        onClick={() => {
          if (!nextCase.href) return;
          // The strip stays put while the rest of the page leaves: a copy is
          // pinned at body level at the same spot (outside the exiting page),
          // and fades once the next case — whose meta row lands right here —
          // has come in.
          const el = nextRef.current;
          if (el) {
            const r = el.getBoundingClientRect();
            const pz = parseFloat(document.documentElement.style.zoom || '1') || 1;
            const copy = el.cloneNode(true) as HTMLElement;
            Object.assign(copy.style, {
              position: 'fixed', left: `${r.left / pz}px`, top: `${r.top / pz}px`, width: `${r.width / pz}px`,
              margin: '0', zIndex: '195', pointerEvents: 'none', transition: 'opacity 0.4s ease',
            });
            document.body.appendChild(copy);
            el.style.visibility = 'hidden';
            // Once the next case is in, glide onto its meta row, then hand over
            window.setTimeout(() => {
              const meta = document.querySelector<HTMLElement>('body > [data-page-float]');
              const to = meta ? meta.getBoundingClientRect().top / pz : null;
              copy.style.transition = 'top 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease 0.4s';
              if (to !== null) copy.style.top = `${to}px`;
              copy.style.opacity = '0';
            }, 650);
            window.setTimeout(() => copy.remove(), 1500);
          }
          onNavigateCase?.(nextCase.href);
        }}
        style={{ marginTop: 'var(--space-xl)', cursor: onNavigateCase ? 'pointer' : undefined }}
      >
        {/* Category chips sit in the first column of the same line as the
            name, year and intro — like the meta row at the top of a case */}
        <div style={{ padding: 'var(--pad)' }}>
          <MetaRow
            col1={
              <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 5 }}>
                {nextCase.tags.map(t => <span key={t} className={s.chip}>{t}</span>)}
              </span>
            }
            col2={nextCase.title}
            num={nextCase.year}
            text={nextCase.intro}
          />
        </div>
      </div>
      {/* Keeps the strip above at the cover's height when scrolled to the end */}
      <div style={{ height: nextPad }} />
    </div>
  );
}
