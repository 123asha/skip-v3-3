import { useState, useRef } from 'react';
import { useMobile } from '../hooks/useMobile';
import s from './ProjectGallery.module.css';
import CaseCard, { CASE_AR_H as H, CASE_AR_V as V, type CaseCardAR as AR, isCaseRound } from './CaseCard';
import { MagneticDivider } from './MagneticDivider';
import { asset, arSuffix, videoAsset } from '../utils/asset';

/** Returns { image, ar } — aspect ratio is inferred from the -h / -v filename suffix. */
function img(path: string): { image: string; ar: AR } {
  return { image: asset(path), ar: arSuffix(path) === 'v' ? V : H };
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
}

export const PROJECTS: Project[] = [
  { id: 1, cats: ['branding', 'sites', 'interfaces'],       ...img('/case1-h.webp'), title: 'Magic Moon',     year: '2024', desc: 'Трекер целей от Юрия Мурадяна, в котором визуал поддерживает философию продукта' },
  { id: 2, cats: ['branding', 'sites', 'instruments'],      ...img('/case2-v.webp'), title: 'Gate Legal',     year: '2024', desc: 'Помогли запуститься: от платформы бренда до сайта — за полтора месяца.' },
  { id: 3, cats: ['branding', 'interfaces', 'instruments'], ...img('/case3-h.webp'), title: 'AEPlatform',     year: '2025', desc: 'Браузерное расширение для отображения affiliate-данных прямо на AliExpress' },
  { id: 4, cats: ['branding', 'sites'],                     ...img('/case4-v.webp'), title: 'Skip Design',    year: '2025', desc: 'Новогодний спецпроект для команды и комьюнити' },
  { id: 5, cats: ['branding', 'sites', 'interfaces'],       ...img('/case5-v.webp'), title: 'Крипто', year: '2026', desc: 'Подготовили бренд-систему для запуска крипто-стартапа' },
  { id: 6, cats: ['sites', 'interfaces', 'instruments'],    ...img('/case6-h.webp'), title: 'Gate Legal',     year: '2024', desc: 'Конструктор баннеров для ускорения разработки креативов к ежедневным постам' },
];

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

function ProjectCard({ project, onClick, aspect, scrubVideo }: { project: Project; onClick?: () => void; aspect?: string; scrubVideo?: string }) {
  return (
    <CaseCard
      ar={project.ar}
      aspect={aspect}
      scrubVideo={scrubVideo}
      title={project.title}
      desc={project.desc}
      services={project.year}
      image={project.image}
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

interface Slot { project: Project; col: string; row: number; aspect?: string; scrubVideo?: string }

function buildHomeLayout(projects: Project[]): Slot[] {
  const pick = shuffle(projects);
  // The wide slot reads best with a horizontal shot
  const wideIdx = pick.findIndex(p => p.ar === H);
  const wide = pick.splice(wideIdx < 0 ? 0 : wideIdx, 1)[0];
  // Fixed shape rhythm around the wide video: square, circle · circle, square
  const order: boolean[] = [false, false, true, false]; // wanted roundness, a…d
  order.forEach((wantRound, i) => {
    if (isCaseRound(pick[i].title) === wantRound) return;
    const j = pick.findIndex((p, k) => k > i && isCaseRound(p.title) === wantRound);
    if (j !== -1) [pick[i], pick[j]] = [pick[j], pick[i]];
  });
  const [a, b, c, d] = pick;
  return [
    { project: a, col: '1 / 3', row: 1 },
    { project: b, col: '3 / 5', row: 1 },   // right next to the first, no empty column between
    { project: wide, col: '1 / 6', row: 2, aspect: WIDE_ASPECT, scrubVideo: videoAsset(WIDE_VIDEO) },
    // Third row mirrors the first: the pair side by side, shifted right,
    // with the first column left empty
    { project: c, col: '2 / 4', row: 3 },
    { project: d, col: '4 / 6', row: 3 },
  ];
}

export default function ProjectGallery({ onCaseClick }: { onCaseClick?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [slots] = useState<Slot[]>(() => buildHomeLayout(PROJECTS));
  const isMobile = useMobile();

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
            <ProjectCard project={slot.project} aspect={slot.aspect} scrubVideo={slot.scrubVideo} onClick={onCaseClick} />
          </div>
        ))}
      </div>
    </div>
  );
}
