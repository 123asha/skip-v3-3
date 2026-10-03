import { createPortal } from 'react-dom';
import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useMobile } from '../hooks/useMobile';
import { usePinchSteps } from '../hooks/usePinchSteps';
import { gsap } from 'gsap';
import s from './CasesPage.module.css';
import ZoomControl from './ZoomControl';
import CaseCard, { CASE_AR_H as H, CASE_AR_V as V, type CaseCardAR as AR, isCaseRound } from './CaseCard';
import ContactForm from './ContactForm';
import { asset, arSuffix } from '../utils/asset';

function img(path: string): { image: string; ar: AR } {
  return { image: asset(path), ar: arSuffix(path) === 'v' ? V : H };
}
import { useReveal } from '../hooks/useReveal';
import { bounceChips, settleChips } from '../utils/chipBounce';
import { driftTo } from '../utils/parallaxInertia';

interface Props {
  onBack: () => void;
  onCaseClick?: (href?: string) => void;
  onNavigatePolicy?: () => void;
  onGridMode?: (on: boolean) => void;
  onGridCols?: (n: number) => void; // report current grid column count to the overlay
}

export interface Project {
  /** Real preview shown even while the rest are grey placeholders */
  preview?: string;
  id: number;
  cats: string[];
  /** Second-level tags, keyed by SUBTABS below. Placeholder values for now —
   *  swap them for the real ones per project. */
  subs?: string[];
  ar: AR;
  image: string;
  video?: string;
  /** A looping clip shown as the preview */
  clip?: string;
  title: string;
  desc: string;
  year: string;   // shown above the card
  href?: string; // own case page (defaults to the generic template)
  /** Pictures to flip through inside the preview on the biggest (two-column)
   *  grid — only cases that have them; the first is the preview itself */
  slides?: string[];
}

export const PROJECTS: Project[] = [
  { id: 1, preview: asset('/preview-case2.webp'), subs: ['strategy', 'design', 'uxui'], cats: ['branding'],       ...img('/case1-h.webp'), title: 'Magic Moon',     year: '2025', desc: 'Брендинг для приложения по трекингу целей и медитаций' },
  { id: 2, preview: asset('/preview-case1.webp'), subs: ['strategy', 'design', 'architecture'], cats: ['interfaces'],      ...img('/case2-v.webp'), title: 'Magic Moon App',     year: '2024', desc: 'Трекер целей от Юрия Мурадяна, в котором визуал поддерживает философию продукта', video: asset('/magic-moon.mp4') },
  { id: 3, preview: asset('/preview-ae-platform.webp'),  subs: ['design', 'tools', 'uxui'], cats: ['interfaces'], ...img('/case3-h.webp'), title: 'AE Platform',     year: '2025', desc: 'Тысячи партнёров AliExpress в одной B2B-платформе AE Platform', href: '/ae-platform' },
  { id: 4, preview: asset('/preview-case4.webp'), subs: ['design', 'nocode'], cats: ['interfaces'],                     ...img('/case4-v.webp'), title: 'Плагин AliExpress',    year: '2025', desc: 'Браузерное расширение для отображения affiliate-данных прямо на AliExpress', href: '/plugin-aliexpress' },
  { id: 5, preview: asset('/preview-keys.jpg'),  subs: ['strategy', 'design', 'uxui'], cats: ['branding', 'interfaces'],       ...img('/case5-v.webp'), title: 'Coming soon', clip: asset('/coming-soon.mp4'), year: '2026', desc: 'Брендинг и конструктор фирменной графики для социального проекта' },
  { id: 6, preview: asset('/preview-app.jpg'),  subs: ['tools', 'architecture', 'uxui'], cats: ['sites', 'interfaces', 'instruments'],    ...img('/case6-h.webp'), title: 'Gate Legal',     year: '2024', desc: 'Конструктор баннеров для ускорения разработки креативов к ежедневным постам' },
  { id: 7, preview: asset('/preview-seniors.webp'), slides: ['/preview-seniors.webp', '/cases/seniors/1.webp', '/cases/seniors/2.webp', '/cases/seniors/4.webp', '/cases/seniors/5.webp', '/cases/seniors/6.webp'].map(asset),  subs: ['strategy', 'design', 'tools'], cats: ['branding', 'sites', 'instruments'],      ...img('/case1-h.webp'), title: 'Senior*s bar',   year: '2025', desc: 'Бар своей среды. Визуальный язык для офлайна и онлайна', href: '/Seniorsbar' },
  { id: 8, preview: asset('/preview-gate-legal.avif'),  subs: ['design', 'uxui', 'productStrategy'], cats: ['branding', 'sites', 'instruments'],                   ...img('/case2-v.webp'), title: 'Gate Legal',     year: '2024', desc: 'Помогли запуститься' },
  { id: 9, preview: asset('/preview-landing.webp'),  subs: ['tools', 'uxui'], cats: ['branding', 'sites', 'interfaces'],             ...img('/case3-h.webp'), title: 'Лендинг AliExpress',     year: '2026', desc: 'Страница, которая приводит партнёров AliExpress', href: '/aliexpress-landing' },
  { id: 10, preview: asset('/preview-binaroom.avif'), subs: ['architecture', 'nocode', 'uxui'], cats: ['sites', 'interfaces', 'instruments'],    ...img('/case4-v.webp'), title: 'Binaroom',       year: '2025', desc: '3D-проекты превращаются в сметы и КП за минуту', href: '/binaroom' },
  { id: 11, preview: asset('/preview-case4.webp'), subs: ['design', 'nocode'], cats: ['branding', 'sites'], ...img('/case4-v.webp'), title: "Kon' Ogon'", year: '2025', desc: 'Новогодний спецпроект Конь Огонь от студии Skip Design' },
];

// Grey category line in each card's description spot (gives way on hover): the case's filter categories, one or
// two, comma-separated
const CAT_LABEL: Record<string, string> = { branding: 'Брендинг', sites: 'Веб', interfaces: 'Продукт' };
// Always in the site's order: Брендинг, Веб, Продукт
const CAT_ORDER = ['branding', 'sites', 'interfaces'];
export const catLine = (cats?: string[]) => (cats ?? []).filter(c => CAT_LABEL[c])
  .sort((a, b) => CAT_ORDER.indexOf(a) - CAT_ORDER.indexOf(b)).map(c => CAT_LABEL[c]).slice(0, 2).join(', ');

// Tabs mirror the three categories of the services table.
const TABS = [
  { key: 'branding',   label: 'Брендинг' },
  { key: 'web',        label: 'Веб' },
  { key: 'interfaces', label: 'Продукт' },
];

// "Веб" covers site-ish work; kept as a list so a project tagged with any of
// them shows under that tab.
const WEB_CATS = ['sites', 'instruments'];

// Second filter row — appears under the tabs once a category is picked.
// Multi-select: a project shows if it carries ANY of the chosen tags.
// Temporary: second filter row switched off — flip to true to bring it back.
const SHOW_SUBTABS = false;

const SUBTABS: Record<string, { key: string; label: string }[]> = {
  branding: [
    { key: 'strategy', label: 'Стратегия' },
    { key: 'design',   label: 'Дизайн' },
    { key: 'tools',    label: 'Инструменты' },
  ],
  web: [
    { key: 'architecture', label: 'Архитектура' },
    { key: 'design',       label: 'Дизайн' },
    { key: 'nocode',       label: 'Нокод, вайбкод' },
  ],
  interfaces: [
    { key: 'productStrategy', label: 'Стратегия' },
    { key: 'uxui',            label: 'UX/UI' },
  ],
};


// ── Row configs: each card = 2 cols in 5-col grid ────────────────────────────
const CFG_GAP  = { a: '1 / 3', b: '4 / 6' };  // left card col 1-2, right col 4-5
const CFG_ADJ  = { a: '2 / 4', b: '4 / 6' };  // left card col 2-3, right col 4-5 (always aligned)

interface RowItem { project: Project; col: string; round?: boolean; ar?: AR; }
interface Row { key: string; items: RowItem[]; }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRows(projects: Project[]): Row[] {
  const hs = shuffle(projects.filter(p => p.ar === H));
  const vs = shuffle(projects.filter(p => p.ar === V));

  type Pair = { a: Project; b: Project; isHH: boolean };
  const pairs: Pair[] = [];

  // Pair H+V first — this produces 0 same-type rows when counts match
  while (hs.length && vs.length) {
    pairs.push({ a: hs.pop()!, b: vs.pop()!, isHH: false });
  }

  // At most ONE same-type pair from the excess
  if (hs.length >= 2) pairs.push({ a: hs.pop()!, b: hs.pop()!, isHH: true });
  else if (vs.length >= 2) pairs.push({ a: vs.pop()!, b: vs.pop()!, isHH: false });

  // Shuffle row order for visual variety
  const rows: Row[] = [];
  let lastWasGap = Math.random() < 0.5;
  const nextCfg = () => {
    if (!lastWasGap) { lastWasGap = true; return CFG_GAP; }
    lastWasGap = false; return CFG_ADJ;
  };

  let prevRightWasV = false;
  let prevLeftWasV  = false;

  for (const { a, b, isHH } of shuffle(pairs)) {
    let cfg;
    if (isHH) { cfg = CFG_GAP; lastWasGap = true; }
    else { cfg = nextCfg(); }

    let left = Math.random() < 0.5 ? a : b;
    let right = left === a ? b : a;

    // For H+V pairs: put the V card on whichever side did NOT have V last row.
    if (!isHH) {
      const vCard = left.ar === V ? left : right;
      const hCard = left.ar === V ? right : left;
      if (prevRightWasV && !prevLeftWasV) {
        left = vCard; right = hCard;       // V goes left
      } else if (prevLeftWasV && !prevRightWasV) {
        left = hCard; right = vCard;       // V goes right
      }
      // both or neither V last row → keep random
    }

    prevRightWasV = right.ar === V;
    prevLeftWasV  = left.ar === V;
    rows.push({ key: `r${rows.length}`, items: [{ project: left, col: cfg.a }, { project: right, col: cfg.b }] });
  }

  // Solo leftovers (single excess card of one type)
  for (const p of [...hs, ...vs]) {
    rows.push({ key: `r${rows.length}`, items: [{ project: p, col: '2 / 4' }] });
  }

  return rows;
}

// ── Denser zoom levels ───────────────────────────────────────────────────────
// Same "scatter" feel as buildRows, but more cards per row. Each card spans ONE
// column (proportions untouched) inside a grid that has one MORE column than the
// cards in the row, so a single empty column lands at a random spot every row →
// the gaps stay irregular. Cards top-align in the row (set on the grid).
function pickColumns(gridCols: number, count: number): number[] {
  const all = Array.from({ length: gridCols }, (_, i) => i + 1);
  const drop = new Set(shuffle(all).slice(0, Math.max(0, gridCols - count)));
  return all.filter(c => !drop.has(c));
}

// Same ordering PRINCIPLE as the original buildRows: shuffle H and V separately,
// then interleave them so the sequence alternates aspect ratios — horizontal and
// vertical cards stay mixed and never cluster, exactly like before.
function interleaveHV(projects: Project[]): Project[] {
  // No shuffling — the same list order every time, so the page always shows
  // the same layout instead of a fresh shuffle per load.
  const hs = projects.filter(p => p.ar === H);
  const vs = projects.filter(p => p.ar === V);
  const out: Project[] = [];
  let takeH = hs.length >= vs.length; // start with the bigger pile
  while (hs.length || vs.length) {
    if (takeH && hs.length) out.push(hs.pop()!);
    else if (!takeH && vs.length) out.push(vs.pop()!);
    else out.push((hs.length ? hs : vs).pop()!);
    takeH = !takeH;
  }
  return out;
}

// Only one circle on the page — the second case of the second row, at every
// density; every other card is square or 4:5 (never the title-hash default,
// which would scatter more circles).
const ROUND_ROW = 1, ROUND_COL = 1;

// (Magic Moon, AE Platform, Плагин AliExpress, then Magic Moon App)
const LEAD_IDS = [1, 3, 4, 2];
// Always last on the page
const LAST_IDS = [10];
// Cases pinned to a place in the list (1-based): Coming soon 4th, Senior*s bar 5th,
// Magic Moon App 6th, Gate Legal 7th, Kon' Ogon' 8th
const FIXED_POS: Record<number, number> = { 5: 4, 7: 5, 2: 6, 8: 7, 11: 8 };
// The page order: lead cases first, the rest, Binaroom last, pinned ones in their place
function orderCases<T extends { id: number }>(list: T[]): T[] {
  const out = [...list.filter(p => !LAST_IDS.includes(p.id)), ...list.filter(p => LAST_IDS.includes(p.id))];
  // placed in order of their positions, so each lands exactly where it is asked
  Object.entries(FIXED_POS).sort((a, b) => a[1] - b[1]).forEach(([id, pos]) => {
    const i = out.findIndex(p => p.id === Number(id));
    if (i < 0) return;
    const [p] = out.splice(i, 1);
    out.splice(Math.min(pos - 1, out.length), 0, p);
  });
  return out;
}
// Shapes on this page that differ from the case's own: the first case stands
// vertical, the third is square (the home page keeps their usual shapes)
const LEAD_AR: Record<number, AR> = { 1: V, 4: H, 3: V, 11: V };

function buildScatterRows(projects: Project[], perRow: number, gridCols: number): Row[] {
  // The four lead cases (the ones on the home page) open the page, in their
  // own order; the rest follow as interleaved
  const mixed = interleaveHV(projects);
  const lead = LEAD_IDS.map(id => mixed.find(p => p.id === id)).filter((p): p is Project => !!p);
  const rest = mixed.filter(p => !LEAD_IDS.includes(p.id));
  // Binaroom closes the list
  const items = orderCases([...lead, ...rest]);
  const rows: Row[] = [];
  let lastVCol = -1; // which absolute column held a V card in the previous row
  for (let i = 0; i < items.length; i += perRow) {
    const chunk = items.slice(i, i + perRow);
    const numToDrop = Math.max(0, gridCols - chunk.length);
    const all = Array.from({ length: gridCols }, (_, k) => k + 1);
    // Deterministic instead of random: cycle which column(s) are dropped one
    // step per row, so the same page always lays out the same way, but the
    // gap still moves row to row instead of repeating in the same spot.
    const dropped = new Set<number>();
    for (let d = 0; d < numToDrop; d++) {
      dropped.add(1 + (rows.length + d) % gridCols);
    }
    let cols = all.filter(c => !dropped.has(c));

    // If a V card would land in the same column as last row's V card, reverse
    // the column assignment to move it to the other slot.
    const vIdx = chunk.findIndex(p => (LEAD_AR[p.id] ?? p.ar) === V);
    if (vIdx >= 0 && lastVCol >= 0 && cols[vIdx] === lastVCol) {
      cols = [...cols].reverse();
    }
    lastVCol = vIdx >= 0 ? cols[vIdx] : -1;

    rows.push({
      key: `z${perRow}r${rows.length}`,
      items: chunk.map((project, j) => ({
        project,
        col: `${cols[j]} / ${cols[j] + 1}`,
        // A card's shape belongs to the card, not to the grid: it is worked out
        // from its place in the list (three to a row — the reference layout:
        // second row vertical · circle · vertical), so the same card keeps
        // its proportions at every number of columns
        round: Math.floor((i + j) / 3) === 1 && (i + j) % 3 === 1,
        ar: LEAD_AR[project.id] ?? (Math.floor((i + j) / 3) === 1 && (i + j) % 3 !== 1 ? V : undefined),
      })),
    });
  }
  return rows;
}

// Per zoom level: grid column count, cards per row, row gap, and the caption
// font size (shrinks with the grid so the labels stay proportional).
// Five steps, one column at a time: 3 → 4 → 5 → 6 → 7 columns. Every column is
// filled — no dropped/empty slots. 4 = biggest (3 cols).
// Caption text never shrinks with the grid — instead, past 4 columns the
// cards get too narrow for meta, so title + description are dropped entirely.
// One step past the densest grid the previews go too: level 0 drops the images
// and leaves the list as plain text.
const ZOOM_CFG: Record<number, { cols: number; perRow: number; rowGap: number | string; cap: string; showMeta: boolean; imagesOff?: boolean }> = {
  // The biggest view: two cases a row
  6: { cols: 2, perRow: 2, rowGap: 'var(--cases-row-gap, 120px)', cap: 'var(--text-size)', showMeta: true },
  5: { cols: 3, perRow: 3, rowGap: 'var(--cases-row-gap, 120px)', cap: 'var(--text-size)', showMeta: true },
  4: { cols: 4, perRow: 4, rowGap: 100, cap: 'var(--text-size)', showMeta: true },
  3: { cols: 5, perRow: 5, rowGap: 80,  cap: 'var(--text-size)', showMeta: false },
  2: { cols: 6, perRow: 6, rowGap: 64,  cap: 'var(--text-size)', showMeta: false },
  1: { cols: 7, perRow: 7, rowGap: 48,  cap: 'var(--text-size)', showMeta: false },
  0: { cols: 8, perRow: 8, rowGap: 24,  cap: 'var(--text-size)', showMeta: true, imagesOff: true },
};
const ZOOM_MAX = 6;
const ZOOM_MIN = 3; // one step denser than the default 4-col floor

// ── Mobile mixed-grid helper ─────────────────────────────────────────────────
// Cycle of 7: [half, half, FULL, half, half, half, half]
// Full-width appears at sequential index % 7 === 2 — never two in a row.
function mobileColSpan(idx: number): string {
  return idx % 7 === 2 ? '1 / -1' : 'auto';
}

// ── ProjectCard ───────────────────────────────────────────────────────────────
function ProjectCard({ ar, cats, title, desc, image, preview, clip, video, slides, onClick, servicesSize, metaSize, hideMeta, hideImage, round, stackMeta, hideCats, tall, slider }: Project & { slider?: boolean; hideCats?: boolean; tall?: boolean; onClick?: () => void; servicesSize?: string | number; metaSize?: string | number; hideMeta?: boolean; hideImage?: boolean; round?: boolean; stackMeta?: boolean }) {
  return (
    <CaseCard ar={ar} title={title} desc={desc} services={hideCats ? undefined : catLine(cats)} showCats servicesSize={servicesSize} metaSize={metaSize} hideMeta={hideMeta} hideImage={hideImage} image={image} preview={preview} clip={clip} video={video} onClick={onClick} round={round} stackMeta={stackMeta} tall={tall} slides={slider ? slides : undefined} />
  );
}

// ── CasesPage ─────────────────────────────────────────────────────────────────
export default function CasesPage({ onBack, onCaseClick, onNavigatePolicy, onGridMode, onGridCols }: Props) {
  // A case page's chip may hand over a category to open with
  const [activeTab, setActiveTab] = useState<string | null>(() => {
    try {
      const t = sessionStorage.getItem('casesTag');
      sessionStorage.removeItem('casesTag');
      return t;
    } catch { return null; }
  });
  // The selected category pushes its neighbours up against the next chip and
  // keeps them there (utils/chipBounce)
  const tabsRowRef = useRef<HTMLDivElement>(null);

  // Sub-tags of the open category — multi-select
  const [activeSubs, setActiveSubs] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>(() => buildRows(PROJECTS));
  const isMobile = useMobile();
  // Phone: one card per row or two (⊖ denser, ⊕ bigger)
  const [mobCols, setMobCols] = useState<1 | 2>(1);
  useEffect(() => {
    // Phone: already spaced and linked (CSS) — no spread
    settleChips(tabsRowRef.current, isMobile ? -1 : TABS.findIndex(t => t.key === activeTab));
  }, [activeTab, isMobile]);

  // ── Phone: the category chips come out of «Проекты» ───────────────────
  // On arrival they start on the «Проекты» chip in the bottom menu, small,
  // and travel up to their places.
  useEffect(() => {
    const row = tabsRowRef.current;
    if (!isMobile || !row) return;
    const chips = Array.from(row.children) as HTMLElement[];
    const hub = () => document.querySelector<HTMLElement>('nav a[href="/cases"]');
    // Out of «Проекты»: each chip starts on the hub, small, and rises into place
    const h = hub()?.getBoundingClientRect();
    if (h && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      chips.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const dx = h.left + h.width / 2 - (r.left + r.width / 2);
        const dy = h.top + h.height / 2 - (r.top + r.height / 2);
        const st = { p: 0 };
        const apply = () => {
          const k = 1 - st.p;
          c.style.translate = `${dx * k}px ${dy * k}px`;
          c.style.scale = String(0.5 + 0.5 * st.p);
          c.style.opacity = String(Math.min(1, st.p * 2));
        };
        apply();
        gsap.to(st, { p: 1, duration: 0.6, delay: 0.1 + i * 0.07, ease: 'back.out(1)', onUpdate: apply,
          onComplete: () => { c.style.translate = ''; c.style.scale = ''; c.style.opacity = ''; } });
      });
    }
  }, [isMobile]);

  const gridRef    = useRef<HTMLDivElement>(null);
  const pageRef    = useRef<HTMLDivElement>(null);
  // Set on a tab click: the filtered list is shown from its start — scrolled so
  // the tabs bar sits at the top of the viewport, the state the reader is
  // already in when they use the tabs.
  const scrollTopRef = useRef(false);
  // Zero-height marker right AFTER the tabs bar: the bar is sticky, so its own
  // offsetTop travels with the scroll, while the marker stays put in the flow.
  const tabsAnchorRef = useRef<HTMLDivElement>(null);
  const tabsBarRef = useRef<HTMLDivElement>(null);
  // Left edge of the active category chip, so the sub-tag row can line up
  // under it instead of being centred on its own.
  const [subOffset, setSubOffset] = useState(0);
  // Scroll offset that puts the tabs bar against the top edge.
  const tabsOffset = () => {
    const anchor = tabsAnchorRef.current;
    const bar = tabsBarRef.current;
    if (!anchor || !bar) return 0;
    return Math.max(0, anchor.offsetTop - bar.offsetHeight);
  };

  useReveal(pageRef);

  // Cards rise into place from below as they scroll into view, each once.
  // The card's content moves, not the card box — the box is what the zoom
  // FLIP animates, and the two mustn't fight over one transform.
  useEffect(() => {
    const page = pageRef.current;
    if (!page || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(entries => {
      const incoming = entries.filter(e => e.isIntersecting).map(e => e.target as HTMLElement);
      incoming.forEach(el => { io.unobserve(el); el.dataset.risen = 'done'; });
      gsap.to(incoming.map(el => el.firstElementChild), { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 });
    }, { rootMargin: '0px 0px -8% 0px' });
    page.querySelectorAll<HTMLElement>('[data-case-card]').forEach(el => {
      const inner = el.firstElementChild as HTMLElement | null;
      if (!inner || el.dataset.risen === 'done') return;
      if (!el.dataset.risen) {
        // First sight: on screen already → just leave it; below → hide it
        if (el.getBoundingClientRect().top < window.innerHeight) { el.dataset.risen = 'done'; return; }
        el.dataset.risen = 'wait';
        gsap.set(inner, { opacity: 0, y: 60 });
      }
      io.observe(el);   // still waiting (also after a re-render)
    });
    return () => io.disconnect();
  });
  // Light parallax: each preview slides a little against its frame as the
  // page moves (the picture is already 12% larger than its mask). Uses the
  // `translate` property so it never fights the hover hop's transform.
  // Also: the page title scrolls away with the page, while the filter tabs
  // ride up and stay pinned on the logo's line.
  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = getComputedStyle(document.documentElement);
    const textSize = parseFloat(root.getPropertyValue('--text-size'));
    void textSize;
    // The big current menu item stays pinned above the tabs, so they keep
    // their place under it instead of rising to the logo line
    const tabsPinTop = Infinity;
    let tabsStart: number | null = null;
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      if (!still) page.querySelectorAll<HTMLElement>('[data-case-card] img').forEach(img => {
        const r = img.parentElement!.getBoundingClientRect();
        const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
        driftTo(img, p * 8, (el, v) => { el.style.translate = `0 ${v.toFixed(2)}%`; });
        // The frame stays put against its caption — the gap to the title
        // never changes on scroll
      });
      const bar = tabsBarRef.current;
      if (bar) {
        if (tabsStart === null) tabsStart = bar.offsetTop;
        const lift = Math.min(page.scrollTop, Math.max(0, tabsStart - tabsPinTop));
        bar.style.translate = `0 ${-lift}px`;
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    page.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      page.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Hovering a case (while not scrolling) turns every other preview into a
  // plain grey frame — only the pictures, the captions stay as they are.
  useEffect(() => {
    const page = pageRef.current, grid = gridRef.current;
    if (!page || !grid) return;
    let scrolling = false, t = 0, dwell = 0;
    let hot: HTMLElement | null = null;
    // The others go grey only after the pointer has rested on one case for
    // 5 s without scrolling; any move to another case or scroll restarts it
    const apply = () => {
      clearTimeout(dwell);
      delete grid.dataset.focus;
      if (!hot || scrolling) return;
      const card = hot;
      dwell = window.setTimeout(() => {
        if (hot === card && !scrolling) { grid.dataset.focus = ''; card.dataset.hot = ''; }
      }, 5000);
    };
    const onOver = (e: MouseEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('[data-case-card]');
      if (card === hot) return;
      if (hot) delete hot.dataset.hot;
      hot = card;
      apply();
    };
    const onLeave = () => { if (hot) delete hot.dataset.hot; hot = null; apply(); };
    const onScroll = () => {
      scrolling = true; apply();
      clearTimeout(t);
      t = window.setTimeout(() => { scrolling = false; apply(); }, 180);
    };
    grid.addEventListener('mouseover', onOver);
    grid.addEventListener('mouseleave', onLeave);
    page.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      grid.removeEventListener('mouseover', onOver);
      grid.removeEventListener('mouseleave', onLeave);
      page.removeEventListener('scroll', onScroll);
      clearTimeout(t);
      clearTimeout(dwell);
    };
  }, []);

  const mountedRef = useRef(false);
  const [zoom, setZoomRaw] = useState(5); // default: the 3-column view
  // Every zoom change first notes where each card sits, so the re-laid grid
  // can glide cards from their old spot and size into the new ones (FLIP).
  const flipRef = useRef<Map<string, DOMRect> | null>(null);
  const setZoom = (next: (z: number) => number) => {
    const cards = gridRef.current?.querySelectorAll<HTMLElement>('[data-case-card]');
    if (cards?.length) flipRef.current = new Map([...cards].map(el => [el.dataset.id ?? '', el.getBoundingClientRect()]));
    setZoomRaw(next);
  }; // default: 4 cols. 5 = biggest (3 cols) … 0 = 8 cols, text only
  // Trackpad pinch steps the density just like ⊕ ⊖
  usePinchSteps(() => setZoom(z => Math.min(ZOOM_MAX, z + 1)), () => setZoom(z => Math.max(ZOOM_MIN, z - 1)), !isMobile);
  const zoomMountRef = useRef(false);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const filteredProjects = activeTab === 'web'
    ? PROJECTS.filter(p => p.cats.some(c => WEB_CATS.includes(c)))
    : activeTab
      ? PROJECTS.filter(p => p.cats.includes(activeTab))
      : PROJECTS;

  // Rows to render on desktop — scattered at every zoom level, rebuilt when the
  // tab or zoom changes (`rows` in deps re-shuffles on tab filter).
  const desktopRows = useMemo(() => {
    const { perRow, cols } = ZOOM_CFG[zoom];
    return buildScatterRows(filteredProjects, perRow, cols);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, rows, activeTab]);

  // Keep the global column overlay in sync with the current grid density, and
  // reset it back to the default 5 columns when leaving the page.
  useEffect(() => { onGridCols?.(isMobile ? 5 : ZOOM_CFG[zoom].cols); }, [zoom, isMobile, onGridCols]);
  useEffect(() => () => onGridCols?.(5), [onGridCols]);

  useEffect(() => {
    const mainLenis = (window as any).__lenis;
    if (mainLenis) mainLenis.stop();

    const el = pageRef.current!;
    const stopBubble = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener('wheel', stopBubble, { passive: true });

    const onKey = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;
      if (e.key === '-') {
        e.preventDefault();
        setZoom(z => Math.max(ZOOM_MIN, z - 1));
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom(z => Math.min(ZOOM_MAX, z + 1));
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      el.removeEventListener('wheel', stopBubble);
      window.removeEventListener('keydown', onKey);
      if (mainLenis) mainLenis.start();
    };
  }, []);

  // Cards enter from bottom on mount
  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll<HTMLElement>('[data-case-card]');
    if (!cards?.length) return;
    gsap.set(cards, { y: 50, opacity: 0 });
    gsap.to(cards, {
      y: 0, opacity: 1, duration: 0.5, ease: 'power3.out',
      stagger: { amount: 0.4, from: 'start' }, delay: 0.1,
    });
  }, []);

  // After a tab filter re-renders the grid, glide up to the tabs bar rather
  // than snapping there.
  useLayoutEffect(() => {
    if (scrollTopRef.current && pageRef.current) {
      pageRef.current.scrollTo({ top: tabsOffset(), behavior: 'smooth' });
      scrollTopRef.current = false;
    }
  }, [rows, activeTab]);

  // Card stagger on tab change only (skip initial mount)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    const cards = gridRef.current?.querySelectorAll<HTMLElement>('[data-case-card]');
    if (!cards?.length) return;
    gsap.set(cards, { opacity: 0, y: 16 });
    gsap.to(cards, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: 'power3.out',
      stagger: { amount: 0.3, from: 'random' },
    });
  }, [rows]);

  // Zoom change: each card glides from where it was, at its old size, into
  // its new place — the grid reflows smoothly instead of popping.
  useLayoutEffect(() => {
    const prev = flipRef.current;
    flipRef.current = null;
    if (!prev) return;
    // Zooming from down at the footer would change nothing you can see —
    // glide back up to the grid so the new density is right there
    const grid = gridRef.current;
    if (grid && pageRef.current && grid.getBoundingClientRect().bottom < window.innerHeight * 0.5) {
      pageRef.current.scrollTo({ top: tabsOffset(), behavior: 'smooth' });
    }
    // Page runs under CSS zoom: rects are screen px, transforms are layout px
    const pz = parseFloat(document.documentElement.style.zoom || '1') || 1;
    grid?.querySelectorAll<HTMLElement>('[data-case-card]').forEach(el => {
      const was = prev.get(el.dataset.id ?? '');
      gsap.killTweensOf(el);
      if (!was) {
        const m = el.querySelector<HTMLElement>('[data-card-meta]');
        if (m) m.style.scale = '';
        gsap.fromTo(el, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', clearProps: 'transform,opacity' });
        return;
      }
      const now = el.getBoundingClientRect();
      // The card is scaled from its old width, which would blow the caption's
      // type up (or shrink it) and then snap it back. The caption carries the
      // inverse scale all the way, so its type stays the size it ends up at.
      const meta = el.querySelector<HTMLElement>('[data-card-meta]');
      const keepType = () => {
        if (!meta) return;
        const sc = Number(gsap.getProperty(el, 'scaleX')) || 1;
        meta.style.transformOrigin = '0 0';
        meta.style.scale = String(1 / sc);
      };
      gsap.fromTo(el,
        { x: (was.left - now.left) / pz, y: (was.top - now.top) / pz, scale: was.width / now.width, transformOrigin: '0 0' },
        { x: 0, y: 0, scale: 1, duration: 0.7, ease: 'power3.inOut', clearProps: 'transform', onUpdate: keepType,
          onComplete: () => { if (meta) { meta.style.scale = ''; meta.style.transformOrigin = ''; } } },
      );
      keepType();
    });
  }, [zoom]);

  // Category + any number of its sub-tags. A project passes when it is in the
  // category AND carries at least one of the picked sub-tags (none picked =
  // the whole category).
  const applyFilters = (tab: string | null, subs: string[]) => {
    const inTab = !tab
      ? PROJECTS
      : tab === 'web'
        ? PROJECTS.filter(p => p.cats.some(c => WEB_CATS.includes(c)))
        : PROJECTS.filter(p => p.cats.includes(tab));
    const filtered = subs.length
      ? inTab.filter(p => p.subs?.some(t => subs.includes(t)))
      : inTab;
    setRows(buildRows(filtered));
  };

  const handleTab = useCallback((key: string) => {
    // Always show the filtered list from its start, tabs bar at the top edge.
    scrollTopRef.current = true;
    const next = key === activeTab ? null : key;
    setActiveTab(next);
    setActiveSubs([]);
    applyFilters(next, []);
  }, [activeTab]);

  // Left edge of the grid's second column — where the zoom hint starts
  const [col2Left, setCol2Left] = useState(0);

  useLayoutEffect(() => {
    const bar = tabsBarRef.current;
    if (!bar) return;
    const measure = () => {
      const active = bar.querySelector<HTMLElement>('[data-tab-active="true"]');
      const subRow = bar.querySelector<HTMLElement>('[data-sub-row]');
      const zoom = parseFloat(document.documentElement.style.zoom || '1') || 1;
      setSubOffset(
        active && subRow
          ? (active.getBoundingClientRect().left - subRow.getBoundingClientRect().left) / zoom
          : 0,
      );

      const page = pageRef.current;
      if (page) {
        const cs = getComputedStyle(document.documentElement);
        const pad = parseFloat(cs.getPropertyValue('--pad'));
        const gap = parseFloat(cs.getPropertyValue('--gap'));
        const colW = (page.clientWidth - 2 * pad - 4 * gap) / 5;
        setCol2Left(pad + colW + gap);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [activeTab, zoom]);

  const handleSub = (key: string) => {
    scrollTopRef.current = true;
    const next = activeSubs.includes(key)
      ? activeSubs.filter(k => k !== key)
      : [...activeSubs, key];
    setActiveSubs(next);
    applyFilters(activeTab, next);
  };

  // The filter chips sit centred under the page title (desktop: their top one
  // --space-xs below the title's baseline — measured from the text, not the
  // line box, whose empty descender room would add to the gap; phone: the
  // fixed row in CSS). As the page scrolls the title goes up with it, and the
  // chips follow until they reach the top — the nav's line on desktop, just
  // under the top bar on a phone — where they stay.
  useLayoutEffect(() => {
    const bar = tabsBarRef.current;
    const page = pageRef.current;
    if (!bar || !page) return;
    let baseTop = 0;
    let stickTop = 0;
    const getTitle = () => document.querySelector<HTMLElement>('body > h1[class*="titleCol2"]');
    const pz = () => parseFloat(document.documentElement.style.zoom || '1') || 1;
    const follow = () => {
      const y = page.scrollTop;
      const title = getTitle();
      if (title && !isMobile) title.style.translate = `0 ${-y}px`;
      if (!isMobile) bar.style.top = `${Math.max(stickTop, baseTop - y)}px`;
    };
    const place = () => {
      const title = getTitle();
      if (!title) return;
      const root = getComputedStyle(document.documentElement);
      // Measure with the title back in place
      title.style.translate = '';
      bar.style.top = '';
      if (isMobile) {
        // Phone: the chips live at the bottom, over the menu (CSS) — only the
        // title rides up with the page
        bar.style.left = '';
        baseTop = -Infinity;
        stickTop = -Infinity;
      } else {
        const spaceXs = parseFloat(root.getPropertyValue('--space-xs')) || 0;
        const t = title.getBoundingClientRect();
        const b = bar.getBoundingClientRect();
        const m = document.createElement('span');
        m.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
        title.appendChild(m);
        const baseline = m.getBoundingClientRect().bottom;
        m.remove();
        bar.style.left = `${(t.left + t.width / 2 - b.width / 2) / pz()}px`;
        baseTop = baseline / pz() + spaceXs;
        // Centred on the nav row
        const nav = document.querySelector('nav')?.getBoundingClientRect();
        stickTop = nav ? (nav.top + (nav.height - b.height) / 2) / pz() : 0;
      }
      follow();
    };
    place();
    const title = getTitle();
    const ro = new ResizeObserver(place);
    if (title) ro.observe(title);
    page.addEventListener('scroll', follow, { passive: true });
    window.addEventListener('resize', place);
    document.fonts?.ready.then(place);
    return () => {
      ro.disconnect();
      page.removeEventListener('scroll', follow);
      window.removeEventListener('resize', place);
      bar.style.left = '';
      bar.style.top = '';
    };
  }, [isMobile]);

  return (
    <div className={s.page} ref={pageRef}>
      {/* Same spot as the Услуги / Инсайты titles — the fixed 5-col page
          grid, not the zoomable card grid, so density changes don't move it */}

      {/* The bar mirrors the card grid of the current zoom level, so the tabs
          start exactly on the third card column whatever the density. */}
      {/* Fixed bar — always visible, so it stays out of the scroll-reveal */}
      {/* Portalled to <body>: fixed on screen, it stays put while the page
          itself slides out on a section change */}
      {createPortal(
      // data-page-float: leaves with the page on a section change, like the title
      <div ref={tabsBarRef} data-page-float="" className={`${s.tabsBar} ${s.pageFloat}`}>
        {/* Row — just the categories now; the zoom hint moved to the
            bottom-left corner, beside the language switch */}
        <div className={s.tabsRow}>
          <div ref={tabsRowRef} className={s.tabsBarInner}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                data-tab-active={activeTab === tab.key}
                className={`${s.chip}${activeTab === tab.key ? ` ${s.chipOn}` : ''}`}
                onClick={() => handleTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3 — sub-tags of the open category. Collapses to nothing when no
            category is picked; several tags can be on at once. */}
        {SHOW_SUBTABS && <div className={s.subRowWrap}>
          <div>
            {/* Chips rise into place from below as the row opens */}
            <div
              data-sub-row
              className={s.subRow}
              style={{
                opacity: activeTab ? 1 : 0,
                transform: activeTab ? 'translateY(0)' : 'translateY(10px)',
                pointerEvents: activeTab ? 'auto' : 'none',
              }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--chip-gap)' }}>
                {(activeTab ? SUBTABS[activeTab] ?? [] : []).map(sub => (
                  <button
                    key={sub.key}
                    className={`${s.chip}${activeSubs.includes(sub.key) ? ` ${s.chipOn}` : ''}`}
                    onClick={e => { bounceChips(e.currentTarget); handleSub(sub.key); }}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>}
      </div>, document.body)}
      <div ref={tabsAnchorRef} />
      {/* paddingTop override: the shared .body padding-top already reserves
          space for the title, but here the tabsBar (with its own margin-top)
          sits between the title and body and already clears that space —
          so body only needs the smaller content gap, not the full offset. */}
      {/* The bar is fixed, so the grid clears it: nav baseline + one chip row
          + 100px of air. */}
      <div
        className={s.body}
        style={{ paddingTop: 'var(--inner-content-top)' }}
      >
        {/* Phone: both column counts under the title, circled «1» and «2» —
            the current one dark, the other grey; tap to switch */}
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, margin: '0 0 32px' }}>
            {([1, 2] as const).map(n => (
              <button
                key={n}
                aria-label={n === 1 ? 'Одна колонка' : 'Две колонки'}
                aria-pressed={mobCols === n}
                onClick={() => {
                  if (n === mobCols) return;
                  // Soft switch: the grid fades out, re-lays itself, fades back in
                  const grid = document.querySelector<HTMLElement>('[data-mob-cols]');
                  if (!grid) { setMobCols(n); return; }
                  gsap.killTweensOf(grid);
                  gsap.to(grid, { opacity: 0, y: 10, duration: 0.18, ease: 'power2.in', onComplete: () => {
                    setMobCols(n);
                    requestAnimationFrame(() => gsap.fromTo(grid, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', clearProps: 'transform' }));
                  } });
                }}
                style={{ background: 'none', border: 'none', padding: 4, margin: -4, color: mobCols === n ? 'var(--c-text)' : 'var(--c-text-muted)', cursor: 'pointer', display: 'flex', transition: 'color 0.2s' }}
              >
                <svg width="24" height="24" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1" />
                  {/* Centred by a fixed shift (dy), not dominant-baseline — iOS Safari
                      places «central» differently and the digit sat off-centre */}
                  <text x="8" y="8" dy="0.35em" textAnchor="middle" fill="currentColor" fontSize="7.5" fontFamily="var(--font)" style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}>{n}</text>
                </svg>
              </button>
            ))}
          </div>
        )}
        {/* ⌘ ⊖ ⊕ — top-left, ~40px above the first row (desktop) */}
        {!isMobile && (
          <div style={{
            position: 'relative', height: 0, zIndex: 2,
            fontFamily: 'var(--font)', fontSize: 'var(--text-size)', fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
            lineHeight: 'var(--text-lh)', letterSpacing: 'var(--text-ls)', color: 'var(--c-text)',
          }}>
            <div style={{ position: 'absolute', left: 'var(--pad)', bottom: 40 }}>
              <ZoomControl
                inline
                minusLabel="Плотнее" plusLabel="Крупнее"
                minusDisabled={zoom <= ZOOM_MIN} plusDisabled={zoom >= ZOOM_MAX}
                onMinus={() => setZoom(z => Math.max(ZOOM_MIN, z - 1))}
                onPlus={() => setZoom(z => Math.min(ZOOM_MAX, z + 1))}
              />
            </div>
          </div>
        )}
        <div
          ref={gridRef}
          className={s.grid}
          data-mob-cols={isMobile ? mobCols : undefined}
          style={
            isMobile
              ? { gridTemplateColumns: `repeat(${mobCols}, 1fr)`, columnGap: 'var(--gap)', rowGap: 'var(--cases-row-gap)', alignItems: 'start' }
              : {
                  gridTemplateColumns: `repeat(${ZOOM_CFG[zoom].cols}, 1fr)`,
                  rowGap: ZOOM_CFG[zoom].rowGap,
                  alignItems: 'start',  // cards top-align in each row
                }
          }
        >
          {isMobile ? (
            // Mobile: flat list, layout controlled by mobileLayout toggle
            orderCases(filteredProjects).map(project => (
              <div key={project.id} data-case-card="" style={{ minWidth: 0 }}>
                {/* Two columns: the caption stacks (name over description) */}
                {/* Phone: every preview 4:5, one or two a row; no category line */}
                <ProjectCard {...project} ar={V} tall hideCats stackMeta={mobCols === 2} slider={mobCols === 1} onClick={() => onCaseClick?.(project.href)} />
              </div>
            ))
          ) : (
            // Desktop: scattered rows at every zoom level (cards keep their
            // proportions; empty columns keep the layout irregular).
            desktopRows.map((row, rowIdx) =>
              row.items.map(item => (
                <div
                  key={item.project.id}
                  data-case-card=""
                  data-id={item.project.id}
                  style={{ gridColumn: item.col, gridRow: rowIdx + 1, minWidth: 0 }}
                >
                  <ProjectCard {...item.project} ar={item.ar ?? item.project.ar} round={item.round} servicesSize={ZOOM_CFG[zoom].cap} metaSize={ZOOM_CFG[zoom].cap} hideMeta={!ZOOM_CFG[zoom].showMeta} hideImage={ZOOM_CFG[zoom].imagesOff} slider={zoom === ZOOM_MAX} onClick={() => onCaseClick?.(item.project.href)} />
                </div>
              ))
            )
          )}
        </div>
      </div>

      <div>
        <ContactForm variant="consult" onNavigatePolicy={onNavigatePolicy} onGridMode={onGridMode} />
      </div>

    </div>
  );
}
