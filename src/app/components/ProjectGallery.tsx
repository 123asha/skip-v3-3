import { useState, useRef, useCallback } from 'react';
import { useMobile } from '../hooks/useMobile';
import s from './ProjectGallery.module.css';
import CaseCard, { CASE_AR_H as H, CASE_AR_V as V, type CaseCardAR as AR } from './CaseCard';
import { MagneticDivider } from './MagneticDivider';
import { asset, arSuffix } from '../utils/asset';

/** Returns { image, ar } — aspect ratio is inferred from the -h / -v filename suffix. */
function img(path: string): { image: string; ar: AR } {
  return { image: asset(path), ar: arSuffix(path) === 'v' ? V : H };
}

interface Project {
  id: number;
  cats: string[];
  ar: AR;
  image: string;
  title: string;
  desc: string;
}

export const PROJECTS: Project[] = [
  { id: 1, cats: ['branding', 'sites', 'interfaces'],       ...img('/case1-h.webp'), title: 'AliExpress',         desc: 'AE Platform: дизайн B2B-платформы для партнёров AliExpress' },
  { id: 2, cats: ['sites', 'interfaces', 'instruments'],    ...img('/case2-v.webp'), title: 'AE Platform',        desc: 'Редизайн браузерного расширения для AE Platform' },
  { id: 3, cats: ['branding', 'interfaces', 'instruments'], ...img('/case3-h.webp'), title: "Senior's Platform",  desc: 'Дизайн-система и интерфейсы' },
  { id: 4, cats: ['branding', 'sites', 'interfaces'],       ...img('/case4-v.webp'), title: 'Futura Digital',     desc: 'Нейминг и регистрация, платформа бренда' },
  { id: 5, cats: ['branding', 'sites', 'instruments'],      ...img('/case5-v.webp'), title: 'Юрий Мурадян',       desc: 'Персональный брендинг' },
  { id: 6, cats: ['sites', 'interfaces', 'instruments'],    ...img('/case6-h.webp'), title: 'Digital Experience', desc: 'Исследования и автоматизация процессов' },
];

const TABS = [
  { key: 'branding', label: 'Брендинг' },
  { key: 'digital',  label: 'Диджитал' },
];

const DIGITAL_CATS = ['sites', 'interfaces', 'instruments'];

// ── Row configs: each card = 2 cols in 5-col grid ────────────────────────────
const CFG_GAP = { a: '1 / 3', b: '4 / 6' };  // left card col 1-2, right col 4-5
const CFG_ADJ = { a: '2 / 4', b: '4 / 6' };  // left card col 2-3, right col 4-5

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

  while (hs.length && vs.length) {
    pairs.push({ a: hs.pop()!, b: vs.pop()!, isHH: false });
  }
  if (hs.length >= 2) pairs.push({ a: hs.pop()!, b: hs.pop()!, isHH: true });
  else if (vs.length >= 2) pairs.push({ a: vs.pop()!, b: vs.pop()!, isHH: false });

  const rows: Row[] = [];
  let lastWasGap = Math.random() < 0.5;
  const nextCfg = () => {
    if (!lastWasGap) { lastWasGap = true; return CFG_GAP; }
    lastWasGap = false; return CFG_ADJ;
  };

  let prevRightWasV = false;

  for (const { a, b, isHH } of shuffle(pairs)) {
    let cfg;
    if (isHH) { cfg = CFG_GAP; lastWasGap = true; }
    else { cfg = nextCfg(); }

    let left = Math.random() < 0.5 ? a : b;
    let right = left === a ? b : a;

    if (prevRightWasV && right.ar === V && left.ar !== V) {
      [left, right] = [right, left];
    }

    prevRightWasV = right.ar === V;
    rows.push({ key: `r${rows.length}`, items: [{ project: left, col: cfg.a }, { project: right, col: cfg.b }] });
  }

  for (const p of [...hs, ...vs]) {
    rows.push({ key: `r${rows.length}`, items: [{ project: p, col: '2 / 4' }] });
  }

  return rows;
}

function ProjectCard({ project, onClick }: { project: Project; onClick?: () => void }) {
  return (
    <CaseCard
      ar={project.ar}
      title={project.title}
      desc={project.desc}
      image={project.image}
      onClick={onClick}
    />
  );
}

export default function ProjectGallery({ onCaseClick }: { onCaseClick?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>(() => buildRows(PROJECTS));
  const isMobile = useMobile();

  const handleTab = useCallback((key: string) => {
    const next = key === activeTab ? null : key;
    setActiveTab(next);
    const filtered = next === 'digital'
      ? PROJECTS.filter(p => p.cats.some(c => DIGITAL_CATS.includes(c)))
      : next
        ? PROJECTS.filter(p => p.cats.includes(next))
        : PROJECTS;
    setRows(buildRows(filtered));

    // Скролл к началу блока кейсов после фильтрации
    const el = containerRef.current;
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY;
      const lenis = (window as any).__lenis;
      if (lenis) lenis.scrollTo(y, { duration: 0.8 });
      else window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [activeTab]);

  return (
    <div ref={containerRef} className={s.root}>
      <div className={s.tabsBar}>
        <div className={s.tabsGroup}>
          <span className={s.tabsLabel}>Сделали:</span>
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
      </div>

      <div
        className={s.grid}
        style={{
          display: 'grid',
          gridTemplateColumns: 'var(--cases-cols)',
          columnGap: 'var(--gap)',
          rowGap: 'var(--cases-row-gap)',
          padding: '0 var(--pad)',
          alignItems: 'center',
        }}
      >
        {rows.map((row, rowIdx) =>
          row.items.map(item => (
            <div
              key={item.project.id}
              style={{
                gridColumn: isMobile ? 'auto' : item.col,
                gridRow: isMobile ? 'auto' : rowIdx + 1,
                minWidth: 0,
              }}
            >
              <ProjectCard project={item.project} onClick={onCaseClick} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
