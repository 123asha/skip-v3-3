import { useState, useRef, useEffect } from 'react';
import { useMobile } from '../hooks/useMobile';
import s from './ProjectGallery.module.css';
import CaseCard, { CASE_AR_H as H, CASE_AR_V as V, type CaseCardAR as AR, isCaseRound } from './CaseCard';
import { PROJECTS, type Project } from './CasesPage';
import { MagneticDivider } from './MagneticDivider';
import { asset, arSuffix, videoAsset } from '../utils/asset';
import { caseCategories } from '../utils/caseCategories';
import { driftTo } from '../utils/parallaxInertia';

// The same cases as the cases page — one list, so the home cards and the
// cases page always show (and open) the same projects
export { PROJECTS };

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
  let prevLeftWasV  = false;

  for (const { a, b, isHH } of shuffle(pairs)) {
    let cfg;
    if (isHH) { cfg = CFG_GAP; lastWasGap = true; }
    else { cfg = nextCfg(); }

    let left = Math.random() < 0.5 ? a : b;
    let right = left === a ? b : a;

    if (!isHH) {
      const vCard = left.ar === V ? left : right;
      const hCard = left.ar === V ? right : left;
      if (prevRightWasV && !prevLeftWasV) {
        left = vCard; right = hCard;
      } else if (prevLeftWasV && !prevRightWasV) {
        left = hCard; right = vCard;
      }
    }

    prevRightWasV = right.ar === V;
    prevLeftWasV  = left.ar === V;
    rows.push({ key: `r${rows.length}`, items: [{ project: left, col: cfg.a }, { project: right, col: cfg.b }] });
  }

  for (const p of [...hs, ...vs]) {
    rows.push({ key: `r${rows.length}`, items: [{ project: p, col: '2 / 4' }] });
  }

  return rows;
}

function ProjectCard({ project, onClick, aspect, scrubVideo, shape }: { project: Project; onClick?: () => void; aspect?: string; scrubVideo?: string; shape?: Shape }) {
  return (
    <CaseCard
      ar={shape === 'vertical' ? V : shape ? H : project.ar}
      aspect={aspect}
      scrubVideo={scrubVideo}
      title={project.title}
      desc={project.desc}
      services={caseCategories(project.cats)}
      image={project.image}
      preview={project.preview}
      video={project.video}
      onClick={onClick}
    />
  );
}

// ── Home layout: two cases, one across the full width, two more ──────────────
// Five cards in a fixed rhythm. The wide one is the only card that overrides
// its proportions — at the usual 4/3 a full-width preview would run past the
// screen.
const WIDE_ASPECT = '16/9';
// The wide card carries the flower, opening up as the page scrolls past it
const WIDE_VIDEO = '/flower2.mp4';

type Shape = 'vertical' | 'square';
interface Slot { project: Project; col: string; row: number; aspect?: string; scrubVideo?: string; shape?: Shape }

function buildHomeLayout(projects: Project[]): Slot[] {
  const pick = shuffle(projects);
  // Take the first project of the wanted orientation (any, if none left), so
  // each shape gets a shot that suits it
  const take = (ar?: AR) => {
    const i = ar ? pick.findIndex(p => p.ar === ar) : 0;
    return pick.splice(i < 0 ? 0 : i, 1)[0];
  };
  // The wide slot reads best with a horizontal shot
  const wide = take(H);
  // Fixed shape order: square, vertical · wide 16:9 · vertical, square
  const b = take(V), c = take(V), a = take(H), d = take(H);
  return [
    { project: a, col: '1 / 3', row: 1, shape: 'square' },
    { project: b, col: '3 / 5', row: 1, shape: 'vertical' },   // right next to the first, no empty column between
    { project: wide, col: '1 / 6', row: 2, aspect: WIDE_ASPECT, scrubVideo: videoAsset(WIDE_VIDEO) },
    // Third row mirrors the first: the pair side by side, shifted right,
    // with the first column left empty
    { project: c, col: '2 / 4', row: 3, shape: 'vertical' },
    { project: d, col: '4 / 6', row: 3, shape: 'square' },
  ];
}

export default function ProjectGallery({ onCaseClick }: { onCaseClick?: (href?: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [slots] = useState<Slot[]>(() => buildHomeLayout(PROJECTS));
  const isMobile = useMobile();

  // Scroll parallax — same as the cases grid: each picture drifts inside
  // its frame as it crosses the middle of the screen.
  useEffect(() => {
    const root = containerRef.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      root.querySelectorAll<HTMLElement>('[data-case-card] img').forEach(img => {
        const r = img.parentElement!.getBoundingClientRect();
        const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
        driftTo(img, p * 20, (el, v) => { el.style.translate = `0 ${v.toFixed(2)}%`; });
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={containerRef} className={s.root}>
      <div className={s.tabsBar}>
        <div className={s.tabsGroup}>
          <span className={s.tabsLabel}>Недавние проекты</span>
        </div>
      </div>

      <div
        className={s.grid}
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'var(--cases-cols)',
          columnGap: 'var(--gap)',
          rowGap: 'var(--cases-row-gap)',
          padding: '0 var(--pad)',
          // Cards in a row line up by their top edge, not their middles
          alignItems: 'start',
        }}
      >
        {slots.map(slot => (
          <div
            key={slot.project.id}
            data-case-card=""
            style={{
              gridColumn: isMobile ? 'auto' : slot.col,
              gridRow: isMobile ? 'auto' : slot.row,
              minWidth: 0,
            }}
          >
            <ProjectCard project={slot.project} aspect={slot.aspect} scrubVideo={slot.scrubVideo} shape={slot.shape} onClick={() => onCaseClick?.(slot.project.href)} />
          </div>
        ))}
      </div>
    </div>
  );
}
