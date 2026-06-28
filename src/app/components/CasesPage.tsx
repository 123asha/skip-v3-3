import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useMobile } from '../hooks/useMobile';
import { gsap } from 'gsap';
import s from './CasesPage.module.css';
import CaseCard, { CASE_AR_H as H, CASE_AR_V as V, type CaseCardAR as AR } from './CaseCard';
import ContactForm from './ContactForm';
import { asset, arSuffix } from '../utils/asset';

function img(path: string): { image: string; ar: AR } {
  return { image: asset(path), ar: arSuffix(path) === 'v' ? V : H };
}
import { useReveal } from '../hooks/useReveal';
import { sound } from '../sound/Sound';

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
  ar: AR;
  image: string;
  video?: string;
  title: string;
  desc: string;
  year: string;   // shown above the card
  href?: string; // own case page (defaults to the generic template)
}

const PROJECTS: Project[] = [
  { id: 1,  cats: ['branding', 'sites', 'interfaces'],       ...img('/case1-h.webp'), title: 'AEPlatform',     year: '2025', desc: 'Страница, которая приводит партнёров AliExpress' },
  { id: 2,  cats: ['branding', 'sites', 'instruments'],      ...img('/case2-v.webp'), title: 'Gate Legal',     year: '2024', desc: 'Помогли запуститься: от платформы бренда до сайта — за полтора месяца.' },
  { id: 3,  cats: ['branding', 'interfaces', 'instruments'], ...img('/case3-h.webp'), title: 'AEPlatform',     year: '2025', desc: 'Браузерное расширение для отображения affiliate-данных прямо на AliExpress' },
  { id: 4,  cats: ['branding', 'sites'],                     ...img('/case4-v.webp'), title: "Kon' Ogon'",    year: '2025', desc: 'Новогодний спецпроект для команды и комьюнити' },
  { id: 5,  cats: ['branding', 'sites', 'interfaces'],       ...img('/case5-v.webp'), title: 'Крипто', year: '2026', desc: 'Подготовили бренд-систему для запуска крипто-стартапа' },
  { id: 6,  cats: ['sites', 'interfaces', 'instruments'],    ...img('/case6-h.webp'), title: 'Gate Legal',     year: '2024', desc: 'Конструктор баннеров для ускорения разработки креативов к ежедневным постам' },
  { id: 7,  cats: ['branding', 'sites', 'instruments'],      ...img('/case1-h.webp'), title: 'Senior*s bar',   year: '2025', desc: 'Бар своей среды. Визуальный язык для офлайна и онлайна', href: '/Seniorsbar' },
  { id: 8,  cats: ['sites', 'interfaces'],                   ...img('/case2-v.webp'), title: 'Magic Moon',     year: '2024', desc: 'Трекер целей от Юрия Мурадяна, в котором визуал поддерживает философию продукта', video: asset('/magic-moon.mp4') },
  { id: 9,  cats: ['interfaces', 'instruments'],             ...img('/case3-h.webp'), title: 'AliExpress',     year: '2026', desc: 'Тысячи партнёров AliExpress в одном дашборде' },
  { id: 10, cats: ['sites', 'interfaces', 'instruments'],    ...img('/case4-v.webp'), title: 'Binaroom',       year: '2025', desc: '3D-проекты превращаются в сметы и КП за минуту' },
];

const TABS = [
  { key: 'branding', label: 'Брендинг' },
  { key: 'digital',  label: 'Диджитал' },
];

const DIGITAL_CATS = ['sites', 'interfaces', 'instruments'];


// ── Row configs: each card = 2 cols in 5-col grid ────────────────────────────
const CFG_GAP  = { a: '1 / 3', b: '4 / 6' };  // left card col 1-2, right col 4-5
const CFG_ADJ  = { a: '2 / 4', b: '4 / 6' };  // left card col 2-3, right col 4-5 (always aligned)

interface RowItem { project: Project; col: string; }
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
  const hs = shuffle(projects.filter(p => p.ar === H));
  const vs = shuffle(projects.filter(p => p.ar === V));
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

function buildScatterRows(projects: Project[], perRow: number, gridCols: number): Row[] {
  const items = interleaveHV(projects);
  const rows: Row[] = [];
  let lastDropped = new Set<number>();
  let lastVCol = -1; // which absolute column held a V card in the previous row
  for (let i = 0; i < items.length; i += perRow) {
    const chunk = items.slice(i, i + perRow);
    const numToDrop = Math.max(0, gridCols - chunk.length);
    const all = Array.from({ length: gridCols }, (_, k) => k + 1);
    const preferred = numToDrop > 0 ? shuffle(all.filter(c => !lastDropped.has(c))) : [];
    const pool = preferred.length >= numToDrop ? preferred : shuffle(all);
    const dropped = new Set(pool.slice(0, numToDrop));
    lastDropped = dropped;
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
      items: chunk.map((project, j) => ({ project, col: `${cols[j]} / ${cols[j] + 1}` })),
    });
  }
  return rows;
}

// Per zoom level: grid column count, cards per row, row gap, and the caption
// font size (shrinks with the grid so the labels stay proportional).
// Five steps, one column at a time: 3 → 4 → 5 → 6 → 7 columns. Each row keeps
// ONE empty column (cols − 1 cards) for the scattered look. 4 = biggest (3 cols).
const ZOOM_CFG: Record<number, { cols: number; perRow: number; rowGap: number | string; cap: string }> = {
  4: { cols: 3, perRow: 2, rowGap: 'var(--cases-row-gap, 120px)', cap: 'var(--text-size)' },
  3: { cols: 4, perRow: 3, rowGap: 100, cap: '13px' },
  2: { cols: 5, perRow: 4, rowGap: 80,  cap: '12px' },
  1: { cols: 6, perRow: 5, rowGap: 64,  cap: '10px' },
  0: { cols: 7, perRow: 6, rowGap: 48,  cap: '9px' },
};

// ── Mobile mixed-grid helper ─────────────────────────────────────────────────
// Cycle of 7: [half, half, FULL, half, half, half, half]
// Full-width appears at sequential index % 7 === 2 — never two in a row.
function mobileColSpan(idx: number): string {
  return idx % 7 === 2 ? '1 / -1' : 'auto';
}

// ── ProjectCard ───────────────────────────────────────────────────────────────
function ProjectCard({ ar, year, title, desc, image, video, onClick, servicesSize, metaSize }: Project & { onClick?: () => void; servicesSize?: string | number; metaSize?: string | number }) {
  return (
    <CaseCard ar={ar} title={title} desc={desc} services={year} servicesSize={servicesSize} metaSize={metaSize} image={image} video={video} onClick={onClick} />
  );
}

// ── CasesPage ─────────────────────────────────────────────────────────────────
export default function CasesPage({ onBack, onCaseClick, onNavigatePolicy, onGridMode, onGridCols }: Props) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>(() => buildRows(PROJECTS));
  const isMobile = useMobile();

  const gridRef    = useRef<HTMLDivElement>(null);
  const pageRef    = useRef<HTMLDivElement>(null);
  const formRef    = useRef<HTMLDivElement>(null);
  const [hideZoom, setHideZoom] = useState(false);
  // Scroll position to restore after a tab filter (so the page doesn't jump to
  // the top when the filtered list is shorter and the scroller collapses).
  const scrollRestoreRef = useRef<number | null>(null);

  useReveal(pageRef);
  const mountedRef = useRef(false);
  const [zoom, setZoom] = useState(4); // 4 = biggest (3 cols) … 0 = densest (7 cols)
  const zoomMountRef = useRef(false);

  const filteredProjects = activeTab === 'digital'
    ? PROJECTS.filter(p => p.cats.some(c => DIGITAL_CATS.includes(c)))
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

  // Hide zoom controls when the contact form scrolls into view
  useEffect(() => {
    const el = formRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setHideZoom(entry.isIntersecting),
      { root: pageRef.current, threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

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
        setZoom(z => Math.max(0, z - 1));
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom(z => Math.min(4, z + 1));
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

  // After a tab filter re-renders the grid, restore the scroll position we
  // captured in handleTab (runs before paint, so no visible jump).
  useLayoutEffect(() => {
    if (scrollRestoreRef.current != null && pageRef.current) {
      pageRef.current.scrollTop = scrollRestoreRef.current;
      scrollRestoreRef.current = null;
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

  // Animate cards in on zoom change (skip initial mount)
  useEffect(() => {
    if (!zoomMountRef.current) { zoomMountRef.current = true; return; }
    const cards = gridRef.current?.querySelectorAll<HTMLElement>('[data-case-card]');
    if (!cards?.length) return;
    gsap.set(cards, { opacity: 0, y: 16 });
    gsap.to(cards, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: { amount: 0.3, from: 'random' } });
  }, [zoom]);

  const handleTab = useCallback((key: string) => {
    // Remember where we are so the view doesn't jump to the top when the
    // filtered (often shorter) list collapses the scroll container.
    scrollRestoreRef.current = pageRef.current?.scrollTop ?? null;
    const next = key === activeTab ? null : key;
    setActiveTab(next);
    const filtered = next === 'digital'
      ? PROJECTS.filter(p => p.cats.some(c => DIGITAL_CATS.includes(c)))
      : next
        ? PROJECTS.filter(p => p.cats.includes(next))
        : PROJECTS;
    setRows(buildRows(filtered));
  }, [activeTab]);

  return (
    <div className={s.page} ref={pageRef}>
      <h1 className={s.title} data-reveal="">Кейсы</h1>

      {/* Grid density control — desktop only, fixed in the bottom-left corner.
          − = smaller cards (more per row), + = bigger. Default zoom (2) is biggest.
          Keyboard alternative: ⌘/Ctrl with + / − (handled in the effect above). */}
      {!isMobile && !hideZoom && (
        <div className={s.zoomBtns}>
          <div className={s.zoomRow}>
            <button
              className={s.zoomBtn}
              onClick={() => { sound.playZoom(-1); setZoom(z => Math.max(0, z - 1)); }}
              disabled={zoom === 0}
              aria-label="Мельче сетку"
            >−</button>
            <button
              className={s.zoomBtn}
              onClick={() => { sound.playZoom(1); setZoom(z => Math.min(4, z + 1)); }}
              disabled={zoom === 4}
              aria-label="Крупнее сетку"
            >+</button>
          </div>
          <span className={s.zoomHint}>или ⌘ / Ctrl + / −</span>
        </div>
      )}

      <div className={s.tabsBar} data-reveal="" data-reveal-delay="0.1">
        {/* Filter tabs — centered */}
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={s.tab}
            style={{ opacity: activeTab === tab.key ? 1 : activeTab ? 0.35 : 0.6 }}
            onClick={() => handleTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}

      </div>
      <div className={s.body}>
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
                  style={{ gridColumn: item.col, gridRow: rowIdx + 1, minWidth: 0 }}
                >
                  <ProjectCard {...item.project} servicesSize={ZOOM_CFG[zoom].cap} metaSize={ZOOM_CFG[zoom].cap} onClick={() => onCaseClick?.(item.project.href)} />
                </div>
              ))
            )
          )}
        </div>
      </div>

      <div ref={formRef}>
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
