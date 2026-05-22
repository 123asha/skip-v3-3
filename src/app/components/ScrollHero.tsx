import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import VisualSystemsBoard from './VisualSystemsBoard';
import BunnyHero from './BunnyHero';
import MoscowTime from './MoscowTime';
import s from './ScrollHero.module.css';
import { TEXT_STYLE } from '../utils/typography';
import { asset } from '../utils/asset';


export const sections = [
  {
    id: 1,
    number: '①',
    title: 'Бренд-\nстратегия',
    details: [
      'платформа бренда, нейминг',
    ],
  },
  {
    id: 2,
    number: '②',
    title: 'Визуальные\nсистемы',
    details: [],
  },
];

// ── Visual Systems grid board ─────────────────────────────────────────────────
// Center panel images — paired with BG_IMGS by index (3 cases in slide 2)
const BOARD_IMGS = [
  asset('/2.png'),
  asset('/2pic.png'),
  asset('/2c.png'),
];

// Gray block backgrounds — paired with BOARD_IMGS
const BG_IMGS = [
  asset('/1.png'),
  asset('/2bg.png'),
  asset('/3bg.png'),
];

// Visual-systems case info — labels shown on the small black rectangle
const VS_CASES = [
  { name: 'Magic Moon от Юря Мурадян', href: '#' },
  { name: 'Senior* Bar',               href: '#' },
  { name: 'AliExpress B2B',            href: '#' },
];


const PX_PER_SEC = 95;
export const PX_SLIDE = 800;
// Anchors matching SERVICE_IDS in ExpertizaPage
const SERVICE_ANCHORS = ['brand', 'visual', 'tools'] as const;
const BUNNY_DUR = 5;
const NUMBER_STACK_TOP_VH = 0.42;
const SLOT_H = 405;
const SLOT_GAP = 20;

const HEADLINE_LINES = [
  'Визуальные системы для',
  'растущих команд',
];

// ── easings ─────────────────────────────────────────────────────────────────
function sm(t: number): number {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  return c * c * (3 - 2 * c);
}

// ── label state functions ───────────────────────────────────────────────────
function getNumberOpacity(i: number, gp: number): number {
  if (gp <= 0) return 0.4;
  const t = gp - i;
  if (t < 0)    return 0.4;
  if (t <= 0.7) return 1;
  if (t <= 1.0) return 1 - 0.6 * sm((t - 0.7) / 0.3);
  return 0.4;
}

function getTitleOpacity(i: number, gp: number): number {
  if (gp <= 0) return 0.4;
  const t = gp - i;
  if (t < 0)    return 0.4;
  if (t <= 0.7) return 1;
  if (t <= 1.0) return 1 - 0.6 * sm((t - 0.7) / 0.3);
  return 0.4;
}


// ── reduced-motion guard ────────────────────────────────────────────────────
const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};


// ───────────────────────────────────────────────────────────────────────────
export default function ScrollHero({ mode, ready, onNavigateExpertiza, onNavigateCases }: { mode: 'arcade' | 'bunny'; ready: boolean; onNavigateExpertiza?: (anchor?: string) => void; onNavigateCases?: () => void }) {
  const [activeSection, setActiveSection] = useState(-1);
  const [imgIdx, setImgIdx]               = useState(0);

  const containerRef  = useRef<HTMLDivElement>(null);
  const stickyRef     = useRef<HTMLDivElement>(null);
  const vidRef        = useRef<HTMLVideoElement>(null);
  const panelRef      = useRef<HTMLDivElement>(null);
  const panelInnerRef = useRef<HTMLDivElement>(null);
  const headlineRef   = useRef<HTMLParagraphElement>(null);
  const videoLayerRef = useRef<HTMLDivElement>(null);
  const slotRefs      = useRef<(HTMLDivElement | null)[]>(Array(3).fill(null));
  const numRefs        = useRef<(HTMLDivElement | null)[]>(Array(sections.length).fill(null));
  const blockRefs      = useRef<(HTMLDivElement | null)[]>(Array(sections.length).fill(null));
  const detRefs        = useRef<(HTMLDivElement | null)[]>(Array(sections.length).fill(null));
  const sectionItemRefs     = useRef<(HTMLDivElement | null)[]>(Array(sections.length).fill(null));
  const sectionNaturalTopY  = useRef<number[]>(Array(sections.length).fill(0));
  const sectionItemHeight   = useRef<number[]>(Array(sections.length).fill(0));
  // Heights measured at max font (32px) — used for stable stick positions
  const finalHeightRef      = useRef<number[]>(Array(sections.length).fill(32));

  const detailsShownRef = useRef<boolean[]>(Array(sections.length).fill(false));
  const progressRef     = useRef(0);
  const lastActiveRef   = useRef(-1);
  const reducedMotion   = useRef(false);
  const applyRef        = useRef<((gp: number) => void) | null>(null);
  const entranceDoneRef = useRef(false);

  const captionRef    = useRef<HTMLParagraphElement>(null);
  const caseInfoRef     = useRef<HTMLDivElement>(null);
  const caseCubeRef     = useRef<HTMLDivElement>(null);
  const rightNumRef   = useRef<HTMLDivElement>(null);
  const rightNumFirst = useRef(true);
  const grayBlockRef  = useRef<HTMLDivElement>(null);
  // Background slides — 3 divs, one per BG_IMGS, driven by scroll
  const bgWrapRef   = useRef<HTMLDivElement>(null);
  const bgSlideRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const bgImgRefs   = useRef<(HTMLImageElement | null)[]>([null, null, null]);
  // Satellite images inside gray block — 4 columns, each double-buffered
  const satARef = useRef<(HTMLImageElement | null)[]>(Array(4).fill(null));
  const satBRef = useRef<(HTMLImageElement | null)[]>(Array(4).fill(null));
  const satIsARef = useRef<boolean[]>(Array(4).fill(true));
  const satIdxRef     = useRef(0);
  const lastImgIdxRef = useRef(0);

  // Seed satellite images on mount
  useEffect(() => {
    const COUNT = 4;
    for (let i = 0; i < COUNT; i++) {
      const a = satARef.current[i];
      const b = satBRef.current[i];
      if (a) { a.src = BOARD_IMGS[i % BOARD_IMGS.length]; gsap.set(a, { opacity: 1 }); }
      if (b) { b.src = BOARD_IMGS[(i + 1) % BOARD_IMGS.length]; gsap.set(b, { opacity: 0 }); }
    }
  }, []);

  // Animate right-side section number on slide change
  useEffect(() => {
    if (rightNumFirst.current) { rightNumFirst.current = false; return; }
    const el = rightNumRef.current;
    if (!el) return;

    if (activeSection < 0) {
      gsap.to(el, { opacity: 0, duration: 0.2, ease: 'power2.in' });
      return;
    }

    const num = sections[activeSection].number;
    if (el.textContent === num) {
      gsap.to(el, { opacity: 1, duration: 0.25, ease: 'power2.out' });
      return;
    }

    gsap.to(el, {
      opacity: 0, duration: 0.15, ease: 'power2.in',
      onComplete: () => {
        if (!el) return;
        el.textContent = num;
        gsap.to(el, { opacity: 1, duration: 0.25, ease: 'power2.out' });
      },
    });
  }, [activeSection]);


  // Case-info as a 3D rotating prism — each case is a face. As imgIdx changes,
  // the cube rotates 90° around the X-axis to bring the next face forward.
  useEffect(() => {
    const cube = caseCubeRef.current;
    if (cube) {
      gsap.to(cube, {
        rotateX: imgIdx * 90,
        duration: 0.65,
        ease: 'power3.inOut',
      });
    }
  }, [imgIdx]);

  useLayoutEffect(() => {
    reducedMotion.current = prefersReducedMotion();
    if (panelRef.current) gsap.set(panelRef.current, { xPercent: -50, yPercent: -50 });
    const nums   = numRefs.current.filter(Boolean) as HTMLDivElement[];
    const titles = blockRefs.current.filter(Boolean) as HTMLDivElement[];
    const hlSpans = headlineRef.current?.querySelectorAll<HTMLElement>('span');

    if (rightNumRef.current) {
      rightNumRef.current.textContent = sections[0].number;
      gsap.set(rightNumRef.current, { opacity: 0 });
    }

    if (reducedMotion.current) {
      if (hlSpans?.length) gsap.set(hlSpans, { opacity: 1, y: 0 });
      if (nums.length)   gsap.set(nums,   { opacity: 0.4, y: 0 });
      if (titles.length) gsap.set(titles, { opacity: 0.4, y: 0 });
      if (captionRef.current) gsap.set(captionRef.current, { opacity: 0.4, y: 0 });
      entranceDoneRef.current = true;
      return;
    }
    if (panelRef.current) gsap.set(panelRef.current, { clipPath: 'inset(100% 0 0 0)' });
    if (nums.length)   gsap.set(nums,   { opacity: 0, y: 24 });
    if (titles.length) gsap.set(titles, { opacity: 0, y: 24 });
    if (hlSpans?.length) gsap.set(hlSpans, { opacity: 0, y: 24 });
    if (captionRef.current) gsap.set(captionRef.current, { opacity: 0, y: 0 });
    // Init bg slides: tape-strip — slide i stacked at yP = i × 100 (below the frame)
    bgSlideRefs.current.forEach((el, i) => {
      if (el) gsap.set(el, { yPercent: i * 100, scale: 1 });
    });
    // Init image parallax offsets to match slide yP (counter-translate)
    bgImgRefs.current.forEach((img, i) => {
      if (img) gsap.set(img, { yPercent: (-i * 100 * 0.15) / 1.3, scale: 1 });
    });
    // Clear any prior wrap transform (was set by older tape-strip code)
    if (bgWrapRef.current) {
      gsap.set(bgWrapRef.current, { clearProps: 'transform' });
    }
  }, []);

  // Measure natural top-Y, default height, and final height (at 32px font)
  useLayoutEffect(() => {
    const measure = () => {
      sectionItemRefs.current.forEach((el, i) => {
        if (!el) return;
        const numEl   = numRefs.current[i] as HTMLElement | null;
        const blockEl = blockRefs.current[i] as HTMLElement | null;
        const savedT  = el.style.transform;
        el.style.transform = 'none';

        // Natural position at default font
        const rect = el.getBoundingClientRect();
        sectionNaturalTopY.current[i] = rect.top;
        sectionItemHeight.current[i]  = rect.height;

        finalHeightRef.current[i] = el.offsetHeight;

        el.style.transform = savedT;
      });
    };
    measure();
    window.addEventListener('resize', measure, { passive: true });
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    if (!ready || reducedMotion.current) return;
    const nums    = numRefs.current.filter(Boolean) as HTMLDivElement[];
    const titles  = blockRefs.current.filter(Boolean) as HTMLDivElement[];
    const hlSpans = headlineRef.current?.querySelectorAll<HTMLElement>('span');

    // ── Entrance: bottom → top, sequential ──────────────────────────────────
    // Layout order top→bottom: headline · panel · caption · section titles
    // Animation order:         section titles → caption → panel → headline

    const tl = gsap.timeline({ delay: 0.05 });

    // 1. Section titles — bottommost, animate first
    tl.to(nums,   { opacity: 0.4, y: 0, duration: 0.5, stagger: 0.07, ease: 'power3.out' }, 0);
    tl.to(titles, { opacity: 0.4, y: 0, duration: 0.5, stagger: 0.07, ease: 'power3.out' }, 0);

    // 2. Panel — center, sweeps up
    tl.to(panelRef.current, {
      clipPath: 'inset(0% 0 0 0)',
      duration: 0.5,
      ease: 'power4.out',
      onComplete: () => {
        if (panelRef.current) panelRef.current.style.clipPath = '';
        entranceDoneRef.current = true;
        applyRef.current?.(progressRef.current);
      },
    }, 0.14);

    // 3. Headline — topmost
    tl.to(hlSpans!, {
      opacity: 1, y: 0,
      duration: 0.5,
      stagger: 0.07,
      ease: 'power3.out',
    }, 0.28);

    // 4. Caption — fades in last (just opacity, no y), after the video/panel appears
    tl.to(captionRef.current, { opacity: 0.4, duration: 0.5, ease: 'power2.out' }, 0.55);

    return () => { tl.kill(); };
  }, [ready]);

  useEffect(() => {
    if (activeSection < 0) return;
    const block = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    };
    window.addEventListener('keydown', block, { capture: true });
    return () => window.removeEventListener('keydown', block, { capture: true });
  }, [activeSection]);


  useEffect(() => {
    (window as any).__videoEl = vidRef.current;
    return () => { (window as any).__videoEl = null; };
  }, []);

  useEffect(() => {
    (window as any).__scrollToSection = (idx: number) => {
      const dur = mode === 'bunny' ? BUNNY_DUR : (vidRef.current?.duration || 5);
      const videoPx = dur * PX_PER_SEC;
      const visualPx = BG_IMGS.length * PX_SLIDE;
      const target =
        idx === 0 ? videoPx + 10 :
        idx === 1 ? videoPx + visualPx + 10 :
        videoPx + visualPx + (idx - 1) * PX_SLIDE + 10;
      const lenis = (window as any).__lenis;
      if (lenis) lenis.scrollTo(target, { duration: 1.4 });
      else window.scrollTo({ top: target, behavior: 'smooth' });
    };
  }, [mode]);

  // ── Main scroll engine ────────────────────────────────────────────────────
  useEffect(() => {
    const vid = mode === 'arcade' ? vidRef.current : null;
    const container = containerRef.current;
    if (!container) return;

    let rafId = 0;
    let pendingGp: number | null = null;
    let durationCache = mode === 'bunny' ? BUNNY_DUR : 5;
    let videoSeekTarget = -1;

    // After the video, every sub-slide (3 cases + 1 tools = 4 sub-slides)
    // gets PX_SLIDE pixels of scroll so the scroll experience is uniform.
    const visualPx = BG_IMGS.length * PX_SLIDE;   // total px for visual-systems (3 cases)
    const sec0Px = () => visualPx;

    const setHeight = (dur: number) => {
      // After the video: only the visual-systems section (no separate tools slide)
      container.style.height =
        window.innerHeight + dur * PX_PER_SEC + visualPx + 'px';
      durationCache = dur;
    };

    if (mode === 'bunny') {
      setHeight(BUNNY_DUR);
    } else {
      setHeight(5);
      if (vid) {
        const onMeta = () => setHeight(vid.duration);
        vid.addEventListener('loadedmetadata', onMeta);
        if (vid.readyState >= 1) setHeight(vid.duration);
        vid.addEventListener('error', () => setHeight(10), { once: true });
      }
    }

    const applyProgress = (gp: number) => {
      const entranceDone = entranceDoneRef.current;
      const vh = window.innerHeight;
      const VIDEO_STICK = 0.65;

      const dividerY = vh / 2;
      let accumY = dividerY;

      for (let i = 0; i < sections.length; i++) {
        const numEl    = numRefs.current[i];
        const blockEl  = blockRefs.current[i];
        const detEl    = detRefs.current[i];
        const el       = sectionItemRefs.current[i];
        const rawT = gp - i;
        const clampedT = i === 0
          ? Math.min(1, Math.max(0, rawT / 0.25))
          : Math.min(1, Math.max(0, (rawT + 0.4) / 0.4));

        if (numEl && entranceDone) {
          numEl.style.opacity = String(getNumberOpacity(i, gp));
        }
        if (blockEl && entranceDone) {
          blockEl.style.opacity = String(getTitleOpacity(i, gp));
        }

        if (detEl) {
          const shouldShow = rawT >= 0.48 && rawT < 1.25;
          if (shouldShow && !detailsShownRef.current[i]) {
            detailsShownRef.current[i] = true;
            const items = Array.from(detEl.querySelectorAll<HTMLElement>('p'));
            gsap.killTweensOf(items);
            gsap.fromTo(items,
              { opacity: 0, y: 8 },
              { opacity: 1, y: 0, duration: 0.35, stagger: 0.08, ease: 'power3.out' }
            );
          } else if (!shouldShow && detailsShownRef.current[i]) {
            detailsShownRef.current[i] = false;
            const items = Array.from(detEl.querySelectorAll<HTMLElement>('p'));
            gsap.killTweensOf(items);
            gsap.to(items, { opacity: 0, y: -4, duration: 0.18, stagger: 0.03, ease: 'power2.in' });
          }
        }
        if (el) {
          const naturalY = sectionNaturalTopY.current[i];
          const delta = accumY - naturalY;
          const translateY = delta * sm(clampedT);
          const minTranslate = dividerY - naturalY;
          el.style.transform = `translateY(${Math.max(translateY, minTranslate)}px)`;
        }
        accumY += (finalHeightRef.current[i] || 24) + 20;
      }

      // Main video slide — sticks while brand strategy rises, then lifts
      if (videoLayerRef.current) {
        let videoTY = 0;
        if (gp > 0 && gp < 1) {
          const vp = Math.max(0, Math.min(1, (gp - VIDEO_STICK) / (1 - VIDEO_STICK)));
          videoTY = -100 * vp;
        } else if (gp >= 1) {
          videoTY = -100;
        }
        videoLayerRef.current.style.transform = `translate3d(0, ${videoTY}%, 0)`;
      }


      // Slots: match video stick so snake arrives in sync with video lifting
      {
        const SLOT_STICK = 0.65;
        let tapeOffset: number;
        if (gp <= 0) {
          tapeOffset = SLOT_H;
        } else if (gp <= 1) {
          const sp = Math.max(0, Math.min(1, (gp - SLOT_STICK) / (1 - SLOT_STICK)));
          tapeOffset = SLOT_H * (1 - sp);
        } else {
          tapeOffset = -Math.min(1, gp - 1) * (SLOT_H + SLOT_GAP);
        }
        for (let i = 0; i < 2; i++) {
          const el = slotRefs.current[i];
          if (el) el.style.transform = `translate3d(0, ${tapeOffset + i * (SLOT_H + SLOT_GAP)}px, 0)`;
        }
      }

      // Panel size:
      //   gp 0 → 0.85     720×405  (brand-strategy video)
      //   gp 0.85 → 1.0   shrinks to 320×56  (magnetic snap as video slides off)
      //   gp 1.0+          holds at 320×56   (small black rectangle — cases cycle)
      {
        const BASE_W  = 900;
        const BASE_H  = 506;
        const SMALL_W = 520;
        const SMALL_H = 56;
        const SHRINK_DUR = 0.15;
        const easeOut = (t: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);

        let panelW = BASE_W;
        let panelH = BASE_H;

        if (gp > 1 - SHRINK_DUR && gp <= 1.0) {
          const t = easeOut((gp - (1 - SHRINK_DUR)) / SHRINK_DUR);
          panelW = BASE_W + (SMALL_W - BASE_W) * t;
          panelH = BASE_H + (SMALL_H - BASE_H) * t;
        } else if (gp > 1.0) {
          panelW = SMALL_W;
          panelH = SMALL_H;
        }

        if (panelRef.current) {
          panelRef.current.style.width  = Math.round(panelW) + 'px';
          panelRef.current.style.height = Math.round(panelH) + 'px';
        }

        let overlayOp = 0;
        if (gp > 1 - SHRINK_DUR && gp <= 1.0)  overlayOp = easeOut((gp - (1 - SHRINK_DUR)) / SHRINK_DUR);
        else if (gp > 1.0)                       overlayOp = 1;
        if (caseInfoRef.current) {
          caseInfoRef.current.style.opacity        = String(overlayOp);
          caseInfoRef.current.style.pointerEvents  = overlayOp > 0.5 ? 'auto' : 'none';
        }

        if (captionRef.current) {
          captionRef.current.style.top = `calc(50% + ${Math.round(panelH) / 2 + 10}px)`;
          captionRef.current.style.opacity = String((1 - overlayOp) * 0.4);
        }
      }

      // Background wrap — fade in at gp 1.0, stays visible after (sticky scrolls away naturally)
      if (bgWrapRef.current) {
        let bgOp = 0;
        if      (gp < 1.0)  bgOp = 0;
        else if (gp < 1.10) bgOp = sm((gp - 1.0) / 0.10);
        else                bgOp = 1;
        bgWrapRef.current.style.opacity = String(bgOp);
      }

      // Tape-strip — slides tile vertically, never overlap. Equal 0.5 gp slot each.
      // Slide 0 centered at gp=1.0, exits top by gp=1.5
      // Slide 1 enters at gp=1.0, centered at gp=1.5, exits top by gp=2.0
      // Slide 2 enters at gp=1.5, centered at gp=2.0 (lands when section ends)
      // Inside each slide the image lags the slide motion → parallax depth.
      // Image is 130% tall, top -15% — has ±15% slide-height of headroom for the parallax shift.
      {
        const PARALLAX = 0.15; // lag factor: image moves at (1 - 0.15) of slide speed
        const IMG_H_RATIO = 1.3; // image height = 130% of slide height

        bgSlideRefs.current.forEach((el, i) => {
          if (!el) return;
          const yP = (i - (gp - 1.0) * 2) * 100;
          gsap.set(el, { yPercent: yP, scale: 1 });

          const imgEl = bgImgRefs.current[i];
          if (imgEl) {
            // Counter-translate the image so it lags the slide.
            // yPercent on image is relative to image height — convert from slide-height units.
            const imgY = (-yP * PARALLAX) / IMG_H_RATIO;
            gsap.set(imgEl, { yPercent: imgY });
          }
        });
      }

    };

    const computeAndApply = () => {
      rafId = 0;
      if (pendingGp === null) return;
      const gp = pendingGp;
      pendingGp = null;
      applyProgress(gp);

      const newActive = gp <= 0 ? -1 : Math.min(Math.floor(gp), sections.length - 1);
      if (newActive !== lastActiveRef.current) {
        lastActiveRef.current = newActive;
        setActiveSection(newActive);
      }

      // Image pair: 3 cases in visual-systems section (gp 1→2 split into thirds)
      const newImgIdx = gp < 1 ? 0 : Math.min(BOARD_IMGS.length - 1, Math.floor((gp - 1) * BOARD_IMGS.length));
      if (newImgIdx !== lastImgIdxRef.current) {
        lastImgIdxRef.current = newImgIdx;
        setImgIdx(newImgIdx);
      }
    };

    const scheduleApply = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(computeAndApply);
    };

    const handleScroll = () => {
      const dur = mode === 'bunny' ? BUNNY_DUR : vid?.duration;
      if (!dur || !isFinite(dur)) {
        progressRef.current = 0;
        pendingGp = 0;
        scheduleApply();
        return;
      }
      const sy = window.scrollY;
      const videoPx = dur * PX_PER_SEC;

      let gp: number;
      if (sy <= 0) {
        gp = 0;
        if (vid && videoSeekTarget !== 0) { vid.currentTime = 0; videoSeekTarget = 0; }
      } else if (sy < videoPx) {
        gp = sy / videoPx; // 0→1 in parallel with video
        if (mode === 'arcade' && vid) {
          const t = (sy / videoPx) * dur;
          if (Math.abs(vid.currentTime - t) > 0.08) { vid.currentTime = t; videoSeekTarget = t; }
        }
      } else {
        if (mode === 'arcade' && vid && Math.abs(vid.currentTime - dur) > 0.1) {
          vid.currentTime = dur; videoSeekTarget = dur;
        }
        // Visual systems: 3 sub-slides over `visualPx` total. After that we just clamp at gp=2.
        const s0 = sec0Px();
        const svc = sy - videoPx;
        gp = 1 + Math.min(1, svc / s0);
      }

      progressRef.current = gp;
      pendingGp = gp;
      scheduleApply();
    };

    const handleResize = () => { setHeight(durationCache); handleScroll(); };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    applyRef.current = applyProgress;
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (rafId) cancelAnimationFrame(rafId);
      applyRef.current = null;
    };
  }, [mode]);

  useLayoutEffect(() => {
    applyRef.current?.(progressRef.current);
  }, [activeSection]);

  // ── Magnetic panel: while shrunk into the black case card, it follows the mouse cursor.
  //     Also fades the panel out when the mouse is over the top nav or the bottom footer
  //     so it doesn't obscure those clickable areas. ──
  useEffect(() => {
    let rafId   = 0;
    let running = true;
    let mouseX  = window.innerWidth  / 2;
    let mouseY  = window.innerHeight / 2;
    let offX    = 0;
    let offY    = 0;
    let opacity = 1;
    let targetOpacity = 1;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      // Detect if mouse is over the nav or footer — if so, hide the small rectangle
      // so the links underneath are usable.
      const hit = document.elementFromPoint(e.clientX, e.clientY) as Element | null;
      let overUI = false;
      let node: Element | null = hit;
      while (node && node !== document.body) {
        const tag = node.tagName.toLowerCase();
        if (tag === 'nav') { overUI = true; break; }
        const cls = typeof (node as HTMLElement).className === 'string' ? (node as HTMLElement).className : '';
        if (cls.includes('footer') || cls.includes('Footer')) { overUI = true; break; }
        node = node.parentElement;
      }
      targetOpacity = overUI ? 0 : 1;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const tick = () => {
      if (!running) return;
      // Magnet activates as soon as the rectangle becomes small (gp 1.0).
      const gp = progressRef.current;
      const magnet = gp >= 1.0 ? 1 : 0;

      const targetX = (mouseX - window.innerWidth  / 2) * magnet;
      const targetY = (mouseY - window.innerHeight / 2) * magnet;
      offX += (targetX - offX) * 0.20;
      offY += (targetY - offY) * 0.20;

      // Only fade out when the panel is small (so the brand-strategy video at gp 0-1 stays visible).
      const wantOpacity = magnet ? targetOpacity : 1;
      opacity += (wantOpacity - opacity) * 0.20;

      if (panelRef.current) {
        gsap.set(panelRef.current, { x: offX, y: offY, opacity });
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  const handleSectionClick = useCallback((idx: number) => {
    const dur = mode === 'bunny' ? BUNNY_DUR : (vidRef.current?.duration || 5);
    const videoPx = dur * PX_PER_SEC;
    const visualPx = BG_IMGS.length * PX_SLIDE;
    // Scroll to gp ≈ idx+0.55: clicked section is risen+details shown, next hasn't started
    const target =
      idx === 0 ? videoPx * 0.55 :
      idx === 1 ? videoPx + visualPx * 0.55 :
      videoPx + visualPx + (idx - 2 + 0.55) * PX_SLIDE;
    const lenis = (window as any).__lenis;
    if (lenis) lenis.scrollTo(target, { duration: 1.0 });
    else window.scrollTo({ top: target, behavior: 'smooth' });
  }, [mode]);

  return (
    <div id="hero" ref={containerRef} className={s.container}>
      <div ref={stickyRef} className={s.sticky}>

        {/* Headline — line by line entrance */}
        <p ref={headlineRef} className={s.headline}>
          {HEADLINE_LINES.map((line, i) => (
            <span key={i} style={{ display: 'block', opacity: 0 }}>
              {line}
            </span>
          ))}
        </p>




        {/* Background slides — scroll-driven, въезжают снизу + scale */}
        <div ref={bgWrapRef} style={{
          position: 'absolute', inset: '-30px',
          opacity: 0, pointerEvents: 'none', zIndex: 2,
          overflow: 'hidden',
        }}>
          {BG_IMGS.map((src, i) => (
            <div
              key={i}
              ref={el => { bgSlideRefs.current[i] = el; }}
              style={{ position: 'absolute', inset: 0, willChange: 'transform', zIndex: i, overflow: 'hidden' }}
            >
              <img
                ref={el => { bgImgRefs.current[i] = el; }}
                src={src}
                style={{ position: 'absolute', top: '-15%', left: 0, width: '100%', height: '130%', objectFit: 'cover', willChange: 'transform' }}
                alt=""
              />
            </div>
          ))}
        </div>

        {/* Panel: video / game — horizontally centered, clickable to navigate to service */}
        <div ref={panelRef} className={s.panel}
          onClick={() => {
            if (activeSection === 1) {
              onNavigateCases?.();
            } else {
              onNavigateExpertiza?.(SERVICE_ANCHORS[Math.max(0, activeSection)]);
            }
          }}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 900,
            height: 506,
            zIndex: 5,
            cursor: 'pointer',
          }}>
          <div ref={panelInnerRef} style={{ position: 'absolute', inset: 0 }}>
            {mode === 'bunny' ? (
              <BunnyHero activeSection={activeSection} />
            ) : (
              <>

                {/* Main video layer — slides out upward as gp approaches 1 */}
                <div ref={videoLayerRef} style={{
                  position: 'absolute', inset: 0,
                  transform: 'translate3d(0, 0, 0)',
                  willChange: 'transform',
                }}>
                  <div className={s.panelLayer}>
                    <video ref={vidRef} playsInline preload="auto" muted>
                      <source src={asset('/video.mp4')} type="video/mp4" />
                    </video>
                  </div>
                </div>

                {/* Case info — dark 3D prism, one face per slide. Rotates on imgIdx change. */}
                <div ref={caseInfoRef} style={{
                  position: 'absolute', inset: 0,
                  opacity: 0, pointerEvents: 'none',
                  zIndex: 10,
                  perspective: '1500px',
                }}>
                  <div ref={caseCubeRef} style={{
                    position: 'absolute', inset: 0,
                    transformStyle: 'preserve-3d',
                    willChange: 'transform',
                  }}>
                    {VS_CASES.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          position: 'absolute', inset: 0,
                          background: '#000',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0 20px',
                          gap: 16,
                          color: '#fff',
                          backfaceVisibility: 'hidden',
                          // Each face is at i × -90° around X and pushed out by half the small
                          // panel height so the prism's depth matches the visible bar height.
                          transform: `rotateX(${i * -90}deg) translateZ(28px)`,
                        }}
                      >
                        <span style={{
                          fontFamily: 'var(--font)',
                          fontSize: 'var(--text-size)',
                          fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
                          lineHeight: 'var(--text-lh)',
                          letterSpacing: 'var(--text-ls)',
                          color: '#fff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          display: 'inline-block',
                          flex: 1,
                          minWidth: 0,
                        }}>{c.name}</span>
                        <a
                          href={c.href}
                          onClick={e => e.stopPropagation()}
                          style={{
                            fontFamily: 'var(--font)',
                            fontSize: 'var(--text-size)',
                            fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
                            lineHeight: 'var(--text-lh)',
                            letterSpacing: 'var(--text-ls)',
                            color: '#fff',
                            textDecoration: 'underline',
                            textDecorationStyle: 'dotted',
                            textUnderlineOffset: '3px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >Перейти</a>
                      </div>
                    ))}
                  </div>
                </div>

              </>
            )}
          </div>
        </div>

        {/* Caption below centered panel */}
        <p ref={captionRef} style={{
          ...TEXT_STYLE,
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          top: 'calc(50% + 202.5px + 10px)',
          opacity: 0.4,
          pointerEvents: 'none',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          zIndex: 5,
          color: '#fff',
          mixBlendMode: 'difference',
        }}>дизайн как правила игры</p>

        {/* Bottom-left: section titles — width = 1 column, no numbers */}
        <div style={{
          position: 'absolute',
          left: 'var(--pad)',
          bottom: 'var(--pad)',
          width: 'calc((100% - 2*var(--pad) - 4*var(--gap)) / 5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          zIndex: 6,
          pointerEvents: 'none',
          userSelect: 'none',
          color: '#fff',
          mixBlendMode: 'difference',
        }}>
          {sections.map((sec, i) => (
            <div
              key={sec.id}
              ref={(el) => { sectionItemRefs.current[i] = el; }}
              style={{ position: 'relative', willChange: 'transform', pointerEvents: 'auto', cursor: 'pointer' }}
              onClick={() => handleSectionClick(i)}
            >
              {/* Hidden anchor for GSAP entrance animation (keeps numRefs wired) */}
              <span
                ref={(el) => { numRefs.current[i] = el; }}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', userSelect: 'none' }}
                aria-hidden="true"
              />
              <span
                ref={(el) => { blockRefs.current[i] = el; }}
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--h2-size)',
                  fontWeight: 'var(--h2-weight)' as React.CSSProperties['fontWeight'],
                  lineHeight: 'var(--h2-lh)',
                  letterSpacing: 'var(--h2-ls)',
                  opacity: 0,
                  willChange: 'opacity',
                  whiteSpace: 'pre-line',
                }}
              >{sec.title}</span>
              <div
                ref={(el) => { detRefs.current[i] = el; }}
                style={{
                  position: 'absolute', top: '100%', left: 0,
                  paddingTop: '5px',
                  opacity: 0, willChange: 'opacity', pointerEvents: 'none',
                }}
              >
                {sec.details.map(d => (
                  <p key={d} style={TEXT_STYLE}>{d}</p>
                ))}
              </div>
            </div>
          ))}
        </div>


        {/* rightNumRef — hidden anchor, kept for scroll engine logic */}
        <div ref={rightNumRef} style={{ display: 'none' }} />


      </div>
    </div>
  );
}
