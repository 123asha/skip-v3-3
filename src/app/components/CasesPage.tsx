import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useMobile } from '../hooks/useMobile';
import { usePinchSteps } from '../hooks/usePinchSteps';
import { gsap } from 'gsap';
import s from './CasesPage.module.css';
import CaseCard, { CASE_AR_H as H, CASE_AR_V as V, type CaseCardAR as AR, isCaseRound } from './CaseCard';
import ContactForm from './ContactForm';
import { asset, arSuffix } from '../utils/asset';

function img(path: string): { image: string; ar: AR } {
  return { image: asset(path), ar: arSuffix(path) === 'v' ? V : H };
}
import { useReveal } from '../hooks/useReveal';

interface Props {
  onBack: () => void;
  onCaseClick?: (href?: string) => void;
  onNavigatePolicy?: () => void;
  onGridMode?: (on: boolean) => void;
  onGridCols?: (n: number) => void; // report current grid column count to the overlay
}

interface Project {
  id: number;
  cats: string[];
  /** Second-level tags, keyed by SUBTABS below. Placeholder values for now —
   *  swap them for the real ones per project. */
  subs?: string[];
  ar: AR;
  image: string;
  video?: string;
  title: string;
  desc: string;
  year: string;   // shown above the card
  href?: string; // own case page (defaults to the generic template)
}

const PROJECTS: Project[] = [
  { id: 1,  subs: ['strategy', 'design', 'uxui'], cats: ['branding', 'sites', 'interfaces'],       ...img('/case1-h.webp'), title: 'AEPlatform',     year: '2025', desc: 'Страница, которая приводит партнёров AliExpress' },
  { id: 2,  subs: ['strategy', 'design', 'architecture'], cats: ['branding', 'sites', 'instruments'],      ...img('/case2-v.webp'), title: 'Gate Legal',     year: '2024', desc: 'Помогли запуститься: от платформы бренда до сайта — за полтора месяца.' },
  { id: 3,  subs: ['design', 'tools', 'uxui'], cats: ['branding', 'interfaces', 'instruments'], ...img('/case3-h.webp'), title: 'AEPlatform',     year: '2025', desc: 'Браузерное расширение для отображения affiliate-данных прямо на AliExpress' },
  { id: 4,  subs: ['design', 'nocode'], cats: ['branding', 'sites'],                     ...img('/case4-v.webp'), title: "Kon' Ogon'",    year: '2025', desc: 'Новогодний спецпроект для команды и комьюнити' },
  { id: 5,  subs: ['strategy', 'design', 'uxui'], cats: ['branding', 'sites', 'interfaces'],       ...img('/case5-v.webp'), title: 'Крипто', year: '2026', desc: 'Подготовили бренд-систему для запуска крипто-стартапа' },
  { id: 6,  subs: ['tools', 'architecture', 'uxui'], cats: ['sites', 'interfaces', 'instruments'],    ...img('/case6-h.webp'), title: 'Gate Legal',     year: '2024', desc: 'Конструктор баннеров для ускорения разработки креативов к ежедневным постам' },
  { id: 7,  subs: ['strategy', 'design', 'tools'], cats: ['branding', 'sites', 'instruments'],      ...img('/case1-h.webp'), title: 'Senior*s bar',   year: '2025', desc: 'Бар своей среды. Визуальный язык для офлайна и онлайна', href: '/Seniorsbar' },
  { id: 8,  subs: ['design', 'uxui', 'productStrategy'], cats: ['sites', 'interfaces'],                   ...img('/case2-v.webp'), title: 'Magic Moon',     year: '2024', desc: 'Трекер целей от Юрия Мурадяна, в котором визуал поддерживает философию продукта', video: asset('/magic-moon.mp4') },
  { id: 9,  subs: ['tools', 'uxui'], cats: ['interfaces', 'instruments'],             ...img('/case3-h.webp'), title: 'AliExpress',     year: '2026', desc: 'Тысячи партнёров AliExpress в одном дашборде' },
  { id: 10, subs: ['architecture', 'nocode', 'uxui'], cats: ['sites', 'interfaces', 'instruments'],    ...img('/case4-v.webp'), title: 'Binaroom',       year: '2025', desc: '3D-проекты превращаются в сметы и КП за минуту' },
];

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

interface RowItem { project: Project; col: string; round?: boolean; }
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

// Hand-set shape sequence, left to right / top to bottom: square, circle,
// then four squares, circle, square — whatever comes after just falls back
// to the title-hash default (isCaseRound), same as every other page.
const POSITION_ROUND = [false, true, false, false, false, false, true, false];

function buildScatterRows(projects: Project[], perRow: number, gridCols: number): Row[] {
  const items = interleaveHV(projects);
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
    const vIdx = chunk.findIndex(p => p.ar === V);
    if (vIdx >= 0 && lastVCol >= 0 && cols[vIdx] === lastVCol) {
      cols = [...cols].reverse();
    }
    lastVCol = vIdx >= 0 ? cols[vIdx] : -1;

    rows.push({
      key: `z${perRow}r${rows.length}`,
      items: chunk.map((project, j) => ({
        project,
        col: `${cols[j]} / ${cols[j] + 1}`,
        round: POSITION_ROUND[i + j],
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
  // The biggest step keeps the old scattered look: 2 cards in a 3-column
  // row, one empty column landing at a random spot each row.
  5: { cols: 3, perRow: 2, rowGap: 'var(--cases-row-gap, 120px)', cap: 'var(--text-size)', showMeta: true },
  4: { cols: 4, perRow: 4, rowGap: 100, cap: 'var(--text-size)', showMeta: true },
  3: { cols: 5, perRow: 5, rowGap: 80,  cap: 'var(--text-size)', showMeta: false },
  2: { cols: 6, perRow: 6, rowGap: 64,  cap: 'var(--text-size)', showMeta: false },
  1: { cols: 7, perRow: 7, rowGap: 48,  cap: 'var(--text-size)', showMeta: false },
  0: { cols: 8, perRow: 8, rowGap: 24,  cap: 'var(--text-size)', showMeta: true, imagesOff: true },
};
const ZOOM_MAX = 5;
const ZOOM_MIN = 3; // one step denser than the default 4-col floor

// ── Mobile mixed-grid helper ─────────────────────────────────────────────────
// Cycle of 7: [half, half, FULL, half, half, half, half]
// Full-width appears at sequential index % 7 === 2 — never two in a row.
function mobileColSpan(idx: number): string {
  return idx % 7 === 2 ? '1 / -1' : 'auto';
}

// ── ProjectCard ───────────────────────────────────────────────────────────────
function ProjectCard({ ar, year, title, desc, image, video, onClick, servicesSize, metaSize, hideMeta, hideImage, round }: Project & { onClick?: () => void; servicesSize?: string | number; metaSize?: string | number; hideMeta?: boolean; hideImage?: boolean; round?: boolean }) {
  return (
    <CaseCard ar={ar} title={title} desc={desc} services={year} servicesSize={servicesSize} metaSize={metaSize} hideMeta={hideMeta} hideImage={hideImage} image={image} video={video} onClick={onClick} round={round} />
  );
}

// ── CasesPage ─────────────────────────────────────────────────────────────────
export default function CasesPage({ onBack, onCaseClick, onNavigatePolicy, onGridMode, onGridCols }: Props) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  // Sub-tags of the open category — multi-select
  const [activeSubs, setActiveSubs] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>(() => buildRows(PROJECTS));
  const isMobile = useMobile();

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
        gsap.fromTo(el, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', clearProps: 'transform,opacity' });
        return;
      }
      const now = el.getBoundingClientRect();
      gsap.fromTo(el,
        { x: (was.left - now.left) / pz, y: (was.top - now.top) / pz, scale: was.width / now.width, transformOrigin: '0 0' },
        { x: 0, y: 0, scale: 1, duration: 0.7, ease: 'power3.inOut', clearProps: 'transform' },
      );
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

  return (
    <div className={s.page} ref={pageRef}>
      {/* Kept for structure and screen readers, hidden on the page itself */}
      <h1
        className={s.title}
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >Проекты</h1>

      {/* The bar mirrors the card grid of the current zoom level, so the tabs
          start exactly on the third card column whatever the density. */}
      {/* Fixed bar — always visible, so it stays out of the scroll-reveal */}
      <div ref={tabsBarRef} className={s.tabsBar}>
        {/* Row 1 — categories, with the zoom hint trailing them */}
        <div className={s.tabsRow}>
          <div className={s.tabsBarInner}>
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
          {/* Zoom hint — bottom-left corner of the screen */}
          {!isMobile && (
            <span className={s.zoomHint}>
              <span className={s.zoomHintLabel}>⌘</span>
              <button
                className={s.zoomKey}
                aria-label="Плотнее"
                onClick={() => setZoom(z => Math.max(ZOOM_MIN, z - 1))}
              >⊖</button>
              <button
                className={s.zoomKey}
                aria-label="Крупнее"
                onClick={() => setZoom(z => Math.min(ZOOM_MAX, z + 1))}
              >⊕</button>
            </span>
          )}
        </div>

        {/* Row 2 — sub-tags of the open category. Collapses to nothing when no
            category is picked; several tags can be on at once. */}
        <div className={s.subRowWrap}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {(activeTab ? SUBTABS[activeTab] ?? [] : []).map(sub => (
                  <button
                    key={sub.key}
                    className={`${s.chip}${activeSubs.includes(sub.key) ? ` ${s.chipOn}` : ''}`}
                    onClick={() => handleSub(sub.key)}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div ref={tabsAnchorRef} />
      {/* paddingTop override: the shared .body padding-top already reserves
          space for the title, but here the tabsBar (with its own margin-top)
          sits between the title and body and already clears that space —
          so body only needs the smaller content gap, not the full offset. */}
      {/* The bar is fixed, so the grid clears it: nav baseline + one chip row
          + 100px of air. */}
      <div
        className={s.body}
        style={{ paddingTop: isMobile ? 150 : 'calc(var(--pad) + 26px + 100px)' }}
      >
        <div
          ref={gridRef}
          className={s.grid}
          style={
            isMobile
              ? { gridTemplateColumns: '1fr', rowGap: 'var(--cases-row-gap)' }
              : {
                  gridTemplateColumns: `repeat(${ZOOM_CFG[zoom].cols}, 1fr)`,
                  rowGap: ZOOM_CFG[zoom].rowGap,
                  alignItems: 'start',  // cards top-align in each row
                }
          }
        >
          {isMobile ? (
            // Mobile: flat list, layout controlled by mobileLayout toggle
            filteredProjects.map(project => (
              <div key={project.id} data-case-card="" style={{ minWidth: 0 }}>
                <ProjectCard {...project} onClick={() => onCaseClick?.(project.href)} />
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
                  <ProjectCard {...item.project} round={item.round} servicesSize={ZOOM_CFG[zoom].cap} metaSize={ZOOM_CFG[zoom].cap} hideMeta={!ZOOM_CFG[zoom].showMeta} hideImage={ZOOM_CFG[zoom].imagesOff} onClick={() => onCaseClick?.(item.project.href)} />
                </div>
              ))
            )
          )}
        </div>
      </div>

      <div>
        <ContactForm variant="consult" onNavigatePolicy={onNavigatePolicy} onGridMode={onGridMode} />
      </div>

      {/* Privacy link — mobile only, at the bottom of the page */}
      {isMobile && (
        <div style={{
          padding: 'var(--pad)',
          paddingBottom: 'calc(64px + var(--pad))',
          textAlign: 'center',
          opacity: 0.4,
          fontSize: 'var(--text-size)',
          fontFamily: 'var(--font)',
          fontWeight: 'var(--text-weight)',
          lineHeight: 'var(--text-lh)',
          letterSpacing: 'var(--text-ls)',
        }}>
          <a
            href="/policy"
            onClick={e => { e.preventDefault(); onNavigatePolicy?.(); }}
            style={{ textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px', color: 'inherit' }}
          >
            Политика конфиденциальности
          </a>
        </div>
      )}
    </div>
  );
}
