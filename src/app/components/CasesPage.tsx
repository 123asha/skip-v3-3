import { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import s from './CasesPage.module.css';
import CaseCard from './CaseCard';
import ContactForm from './ContactForm';

interface Props {
  onBack: () => void;
  onCaseClick?: () => void;
  onNavigatePolicy?: () => void;
  onGridMode?: (on: boolean) => void;
}

const H = '16/9' as const;
const V = '3/4' as const;
type AR = typeof H | typeof V;

interface Project {
  id: number;
  cats: string[];
  ar: AR;
  image: string;
  title: string;
  desc: string;
}

const LOCAL_IMGS = ['/1.png', '/1.1.png', '/2.png'];

const PROJECTS: Project[] = [
  { id: 1,  cats: ['branding', 'sites', 'interfaces'],       ar: H, image: LOCAL_IMGS[0], title: 'Брендинг AliExpress',  desc: 'Исследования рынка, категории и целевой аудитории.' },
  { id: 2,  cats: ['branding', 'sites', 'instruments'],      ar: H, image: LOCAL_IMGS[1], title: 'Gate Legal',           desc: 'Платформа бренда и визуальная идентичность' },
  { id: 3,  cats: ['branding', 'interfaces', 'instruments'], ar: V, image: LOCAL_IMGS[2], title: "Senior's Platform",    desc: 'Дизайн-система и интерфейсы' },
  { id: 4,  cats: ['branding', 'sites'],                     ar: V, image: LOCAL_IMGS[0], title: 'Юрий Мурадян',         desc: 'Персональный брендинг' },
  { id: 5,  cats: ['branding', 'sites', 'interfaces'],       ar: H, image: LOCAL_IMGS[1], title: 'Futura Digital',       desc: 'Нейминг и регистрация, платформа бренда' },
  { id: 6,  cats: ['sites', 'interfaces', 'instruments'],    ar: H, image: LOCAL_IMGS[2], title: 'Digital Experience',   desc: 'Исследования и автоматизация процессов' },
  { id: 7,  cats: ['branding', 'sites', 'instruments'],      ar: V, image: LOCAL_IMGS[0], title: 'Nova Brand',           desc: 'Визуальная идентичность и система' },
  { id: 8,  cats: ['sites', 'interfaces'],                   ar: V, image: LOCAL_IMGS[1], title: 'Orbit Studio',         desc: 'Концепция сайта и дизайн-библиотека' },
  { id: 9,  cats: ['interfaces', 'instruments'],             ar: V, image: LOCAL_IMGS[2], title: 'Interface Pro',        desc: 'Дизайн-система для мобильных приложений' },
  { id: 10, cats: ['sites', 'interfaces', 'instruments'],    ar: H, image: LOCAL_IMGS[0], title: 'Digital Platform',     desc: 'Веб-платформа и пользовательский опыт' },
];

const TABS = [
  { key: 'branding',    label: 'Брендинг'    },
  { key: 'sites',       label: 'Сайты'       },
  { key: 'interfaces',  label: 'UX/UI'       },
  { key: 'instruments', label: 'Инструменты' },
];

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

  for (const { a, b, isHH } of shuffle(pairs)) {
    let cfg;
    if (isHH) { cfg = CFG_GAP; lastWasGap = true; }
    else { cfg = nextCfg(); }

    let left = Math.random() < 0.5 ? a : b;
    let right = left === a ? b : a;

    // Prevent two consecutive rows with a vertical card on the right
    if (prevRightWasV && right.ar === V && left.ar !== V) {
      [left, right] = [right, left];
    }

    prevRightWasV = right.ar === V;
    rows.push({ key: `r${rows.length}`, items: [{ project: left, col: cfg.a }, { project: right, col: cfg.b }] });
  }

  // Solo leftovers (single excess card of one type)
  for (const p of [...hs, ...vs]) {
    rows.push({ key: `r${rows.length}`, items: [{ project: p, col: '2 / 4' }] });
  }

  return rows;
}

// ── ProjectCard ───────────────────────────────────────────────────────────────
function ProjectCard({ image, ar, title, desc, onClick }: Project & { onClick?: () => void }) {
  return (
    <CaseCard ar={ar} title={title} desc={desc} image={image} onClick={onClick} />
  );
}

// ── CasesPage ─────────────────────────────────────────────────────────────────
export default function CasesPage({ onBack, onCaseClick, onNavigatePolicy, onGridMode }: Props) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>(() => buildRows(PROJECTS));

  const gridRef    = useRef<HTMLDivElement>(null);
  const pageRef    = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  const [zoom, setZoom] = useState(2);
  const zoomMountRef = useRef(false);

  const filteredProjects = activeTab ? PROJECTS.filter(p => p.cats.includes(activeTab)) : PROJECTS;

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
    const next = key === activeTab ? null : key;
    setActiveTab(next);
    const filtered = next ? PROJECTS.filter(p => p.cats.includes(next)) : PROJECTS;
    setRows(buildRows(filtered));
  }, [activeTab]);

  return (
    <div className={s.page} ref={pageRef}>
      <h1 className={s.title}>Кейсы</h1>
      <div className={s.tabsBar}>
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
            zoom === 1 ? { gridTemplateColumns: 'repeat(3, 1fr)', rowGap: 80 } :
            zoom === 0 ? { gridTemplateColumns: 'repeat(4, 1fr)', rowGap: 60 } :
            undefined
          }
        >
          {zoom === 2 ? (
            rows.map((row, rowIdx) =>
              row.items.map(item => (
                <div
                  key={item.project.id}
                  data-case-card=""
                  style={{ gridColumn: item.col, gridRow: rowIdx + 1 }}
                >
                  <ProjectCard {...item.project} onClick={onCaseClick} />
                </div>
              ))
            )
          ) : (
            filteredProjects.map(project => (
              <div key={project.id} data-case-card="">
                <ProjectCard {...project} onClick={onCaseClick} />
              </div>
            ))
          )}
        </div>
      </div>

      <ContactForm onNavigatePolicy={onNavigatePolicy} onGridMode={onGridMode} />
    </div>
  );
}
