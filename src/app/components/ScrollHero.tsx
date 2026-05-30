import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import VisualSystemsBoard from './VisualSystemsBoard';
import BunnyHero from './BunnyHero';
import MoscowTime from './MoscowTime';
import s from './ScrollHero.module.css';
import { TEXT_STYLE } from '../utils/typography';
import { asset } from '../utils/asset';
import { useMobile } from '../hooks/useMobile';


// Sidebar section items hidden for now — keep the export so dependents still
// type-check. Set to empty so nothing renders in the hero sidebar.
export const sections: { id: number; number: string; title: string; details: string[] }[] = [];

// ── Visual Systems grid board ─────────────────────────────────────────────────
// Center panel images — paired with BG_IMGS by index (3 cases in slide 2)
const BOARD_IMGS = [
  asset('/2.png'),
  asset('/2pic.png'),
  asset('/2c.png'),
];

// Gray block backgrounds — paired with BOARD_IMGS
const BG_IMGS = [
  asset('/1bg.webp'),
  asset('/2bg.webp'),
  asset('/3bg.webp'),
];

// VIDEO_PRELOADER: slides that are scroll-scrubbed videos instead of images.
// (Slide 1 is an image for now — 2.mp4 temporarily disabled.)
const SLIDE_VIDEO_SRC: Record<number, string> = {
  0: '/s1.mp4',
};

// Visual-systems case info — labels shown on the small rectangle.
// symbol: ASCII char shown bottom-left of the card.
const VS_CASES = [
  { name: 'Стратегия', anchor: 'brand',  symbol: '∴' },
  { name: 'Брендинг',  anchor: 'visual', symbol: '◈' },
  { name: 'Диджитал',  anchor: 'tools',  symbol: '⌘' },
];


const PX_PER_SEC = 143; // +50% — video section scrolls slower
export const PX_SLIDE = 800;
// Anchors matching SERVICE_IDS in ExpertizaPage
const SERVICE_ANCHORS = ['brand', 'visual', 'tools'] as const;
const BUNNY_DUR = 5;
const NUMBER_STACK_TOP_VH = 0.42;
const SLOT_H = 405;
const SLOT_GAP = 20;

const HEADLINE_LINES = [
  'Визуальные системы для',
  'быстрорастущих компаний',
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


// ── Mobile hero — full-screen autoplay video + headline + slider hint ───────
function MobileHero({ onNavigateCases, onNavigateExpertiza, onNavigateLab }: { onNavigateCases?: () => void; onNavigateExpertiza?: (anchor?: string) => void; onNavigateLab?: () => void }) {
  return (
    <div style={{
      position: 'relative',
      height: '100vh',
      width: '100%',
      overflow: 'hidden',
      background: 'var(--c-bg)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      {/* Background video — autoplay/muted/inline so iOS plays it without a tap.
          Preserves its native aspect ratio (object-fit: contain) and is centred
          horizontally; no stretching/cropping. Poster fills the frame while
          the source downloads. */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={BG_IMGS[0]}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          height: 'auto',
          maxHeight: '100%',
          objectFit: 'contain',
          zIndex: 0,
        }}
      >
        <source src={asset('/video.mp4')} type="video/mp4" />
      </video>
      {/* Headline — sits 80 px from the top */}
      <p style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        top: 80,
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--heading-size)',
        fontWeight: 'var(--heading-weight)',
        lineHeight: 'var(--heading-lh)',
        letterSpacing: '-0.03em',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        color: '#fff',
        mixBlendMode: 'difference',
        zIndex: 4,
        width: 'max-content',
        maxWidth: '90vw',
        whiteSpace: 'normal' as any,
      }}>
        {HEADLINE_LINES.map((line, i) => (
          <span key={i} style={{ display: 'block' }}>{line}</span>
        ))}
      </p>
      {/* Bottom links */}
      <div style={{
        position: 'absolute',
        bottom: 'var(--pad)',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 'var(--gap)',
        zIndex: 4,
        color: '#fff',
        mixBlendMode: 'difference',
        fontFamily: 'var(--font)',
        fontSize: 'var(--text-size)',
        lineHeight: 'var(--text-lh)',
        letterSpacing: 'var(--text-ls)',
        whiteSpace: 'nowrap',
      }}>
        <a href="#" onClick={e => { e.preventDefault(); onNavigateLab?.(); }}
          style={{ color: 'inherit', textDecoration: 'underline' }}>Skip Design</a>
        <a href="#" onClick={e => { e.preventDefault(); onNavigateCases?.(); }}
          style={{ color: 'inherit', textDecoration: 'underline' }}>Кейсы</a>
        <a href="#" onClick={e => { e.preventDefault(); onNavigateExpertiza?.(); }}
          style={{ color: 'inherit', textDecoration: 'underline' }}>Услуги</a>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Top-level wrapper — branches to mobile/desktop. Each branch is its own
// component so hooks order is stable across breakpoint changes (otherwise
// React would crash on resize across 768px).
type ScrollHeroProps = { mode: 'arcade' | 'bunny'; ready: boolean; skipVideoPhase?: boolean; onNavigateExpertiza?: (anchor?: string) => void; onNavigateCases?: () => void; onNavigateLab?: () => void };

// Single hero for all viewports — the same scroll-driven parallax + rectangle.
// Mobile-specific sizing lives inside applyProgress (panel width adapts to vw).
export default function ScrollHero(props: ScrollHeroProps) {
  return <ScrollHeroDesktop {...props} />;
}

function ScrollHeroDesktop({ mode, ready, skipVideoPhase, onNavigateExpertiza, onNavigateCases }: ScrollHeroProps) {
  const isMobile = useMobile(); // true on touch/narrow viewports

  const [activeSection, setActiveSection] = useState(-1);
  const [imgIdx, setImgIdx]               = useState(0);
  // Active background card during the post-video slider (0..BG_IMGS.length-1).
  // Drives the rectangle text. Updated from `applyProgress` via lastBgIdxRef.
  const [activeBgIdx, setActiveBgIdx]     = useState(0);

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
  const bgImgRefs   = useRef<(HTMLElement | null)[]>([null, null, null]);
  // VIDEO_PRELOADER: some slides are videos scrubbed by scroll (slide 0 = s1.mp4,
  // slide 1 = 2.mp4). Slide 2 stays an image.
  const slideVidRefs = useRef<(HTMLVideoElement | null)[]>([null, null, null]);
  // Measured width of the widest plate label (symbol + word) → tight pill width.
  const pillWRef = useRef(160);
  // Satellite images inside gray block — 4 columns, each double-buffered
  const satARef = useRef<(HTMLImageElement | null)[]>(Array(4).fill(null));
  const satBRef = useRef<(HTMLImageElement | null)[]>(Array(4).fill(null));
  const satIsARef = useRef<boolean[]>(Array(4).fill(true));
  const satIdxRef     = useRef(0);
  const lastImgIdxRef = useRef(0);
  const lastBgIdxRef  = useRef(0);

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

    if (!sections[activeSection]) return;
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


  // Rectangle (case-info cube) rotates between faces whenever the active
  // background slide changes. The slides themselves now scroll continuously
  // (no dwell), but the cube animates with its own GSAP tween so each face
  // has a brief moment of focus before flipping to the next one.
  useEffect(() => {
    const cube = caseCubeRef.current;
    if (cube) {
      gsap.to(cube, {
        rotateX: activeBgIdx * 90,
        duration: 0.65,
        ease: 'power3.inOut',
      });
    }
  }, [activeBgIdx]);

  useLayoutEffect(() => {
    reducedMotion.current = prefersReducedMotion();
    if (panelRef.current) gsap.set(panelRef.current, { xPercent: -50, yPercent: -50 });
    const nums   = numRefs.current.filter(Boolean) as HTMLDivElement[];
    const titles = blockRefs.current.filter(Boolean) as HTMLDivElement[];
    const hlSpans = headlineRef.current?.querySelectorAll<HTMLElement>('span');

    if (rightNumRef.current && sections.length > 0) {
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

  // Measure the widest plate label so the pill hugs it with 10px padding.
  useLayoutEffect(() => {
    const measurePill = () => {
      const els = stickyRef.current?.querySelectorAll<HTMLElement>('[data-plate]');
      if (!els?.length) return;
      let max = 0;
      els.forEach(e => { max = Math.max(max, e.scrollWidth); });
      if (max > 0) pillWRef.current = Math.ceil(max) + 26; // 10px left + 16px right
    };
    measurePill();
    // Re-measure once fonts are ready (label widths shift when the font loads)
    (document as any).fonts?.ready?.then?.(measurePill).catch?.(() => {});
    window.addEventListener('resize', measurePill, { passive: true });
    return () => window.removeEventListener('resize', measurePill);
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

    // 0. VIDEO_PRELOADER: the first screen rises up from below as a layered
    //    parallax — the background slide travels the full height + a subtle
    //    zoom-out settle (deepest layer), the headline rides in as its own
    //    foreground layer with more travel (below, step 3).
    if (skipVideoPhase && bgWrapRef.current) {
      tl.fromTo(bgWrapRef.current,
        { yPercent: 100, scale: 1.08 },
        { yPercent: 0, scale: 1, duration: 0.95, ease: 'power3.out', transformOrigin: 'center center' },
        0);
    }

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

    // 3. Headline — foreground parallax layer. With the preloader→hero rise it
    //    travels further and arrives slightly after the background slide.
    if (skipVideoPhase && hlSpans?.length) {
      tl.fromTo(hlSpans,
        { opacity: 0, y: 70 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' },
        0.18);
    } else {
      tl.to(hlSpans!, {
        opacity: 1, y: 0,
        duration: 0.5,
        stagger: 0.07,
        ease: 'power3.out',
      }, 0.28);
    }

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

    // After the video, three full-bleed background cards scroll past the
    // sticky frame. The single rectangle in the centre of the viewport stays
    // visible the whole way — its text updates as each background becomes
    // active. Each card gets PX_SLIDE of vertical scroll.
    const visualPx = BG_IMGS.length * PX_SLIDE;
    const sec0Px = () => window.innerWidth <= 768 ? BG_IMGS.length * 500 : visualPx;

    const setHeight = (dur: number) => {
      const isMob = window.innerWidth <= 768;
      const visPx = isMob ? BG_IMGS.length * 500 : visualPx;
      // VIDEO_PRELOADER: no video phase — height is just the slides.
      if (skipVideoPhase) {
        container.style.height = window.innerHeight + visPx + 'px';
        durationCache = dur;
        return;
      }
      const vPx   = isMob ? 280 : dur * PX_PER_SEC;
      container.style.height = window.innerHeight + vPx + visPx + 'px';
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

      // Video transition into the rectangle. The video element keeps its
      // natural aspect ratio and *physically rises* upward within the panel
      // (translateY). Combined with the panel's overflow:hidden the top of
      // the video clips out of view as it travels up — by gp 0.90 the
      // video has slid out the top, and the rectangle is empty.
      //   gp 0.55 → 0.90  video translates from 0% → -100% within panel
      //   gp 0.85 → 0.95  video opacity 1 → 0 (fades out as it leaves)
      //   gp 0.95 → 1.0   empty rectangle, then text fades in
      if (videoLayerRef.current) {
        let videoTY = 0;
        let videoOp = 1;
        if (gp <= 0.55) {
          videoTY = 0;
        } else if (gp < 0.90) {
          const t = (gp - 0.55) / 0.35;
          videoTY = -100 * t;
        } else {
          videoTY = -100;
        }
        if (gp >= 0.85 && gp < 0.95) {
          videoOp = 1 - (gp - 0.85) / 0.10;
        } else if (gp >= 0.95) {
          videoOp = 0;
        }
        videoLayerRef.current.style.transformOrigin = '';
        videoLayerRef.current.style.transform = `translate3d(0, ${videoTY}%, 0)`;
        videoLayerRef.current.style.opacity = String(videoOp);
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
      //   gp 0 → 0.85    holds at 900×506
      //   gp 0.85 → 1.0  shrinks to SMALL_W×56
      //   gp 1.0+        holds at SMALL_W×56
      {
        const vw = window.innerWidth;
        const isMobile = vw <= 768;
        const mobilePad = 10;
        // Desktop: 3 col widths only (no inter-col gaps): 3*(vw-120)/5
        const BASE_W  = isMobile ? Math.max(100, vw - mobilePad * 2) : Math.round(3 / 5 * (vw - 120));
        // Height proportional to 16:9 (same crop as original 900×506 source).
        const BASE_H  = Math.round(BASE_W * 506 / 900);
        // Tight pill that hugs the «symbol + word» with ~10 px padding
        // (measured from the widest label).
        const SMALL_W = Math.min(pillWRef.current, vw - mobilePad * 2);
        const SMALL_H = 42;
        const SHRINK_DUR   = 0.45;
        const easeOut = (t: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);

        let panelW: number;
        let panelH: number;

        if (gp < 1 - SHRINK_DUR) {
          panelW = BASE_W; panelH = BASE_H;
        } else if (gp <= 1.0) {
          const t = easeOut((gp - (1 - SHRINK_DUR)) / SHRINK_DUR);
          panelW = BASE_W + (SMALL_W - BASE_W) * t;
          panelH = BASE_H + (SMALL_H - BASE_H) * t;
        } else {
          panelW = SMALL_W; panelH = SMALL_H;
        }

        if (panelRef.current) {
          panelRef.current.style.width         = Math.round(panelW) + 'px';
          panelRef.current.style.height        = Math.round(panelH) + 'px';
          // Only make the panel clickable when it has fully shrunk into the small card
          panelRef.current.style.pointerEvents = gp >= 1.0 ? 'auto' : 'none';
          panelRef.current.style.cursor        = gp >= 1.0 ? 'pointer' : 'default';
        }

        // Text overlay appears only AFTER the video has faded out
        // (gp 0.95 → 1.0). Brief moment where the rectangle is empty
        // before the text fades in — matches the user's screenshot.
        let overlayOp = 0;
        if (gp > 0.95 && gp <= 1.0)  overlayOp = easeOut((gp - 0.95) / 0.05);
        else if (gp > 1.0)            overlayOp = 1;
        if (caseInfoRef.current) {
          caseInfoRef.current.style.opacity        = String(overlayOp);
          caseInfoRef.current.style.pointerEvents  = overlayOp > 0.5 ? 'auto' : 'none';
        }

        if (captionRef.current) {
          captionRef.current.style.opacity = String((1 - overlayOp) * 0.4);
        }
      }

      // Background wrap — fade in early, in sync with panel shrink (gp 0.80 → 0.95),
      // so the first case is visible by the time the panel becomes a small black bar.
      if (bgWrapRef.current) {
        // No opacity fade — the slide just rises from below into view.
        // bgWrap is always fully opaque; the upward translate (below) is
        // the only entrance signal.
        bgWrapRef.current.style.opacity = '1';
      }

      // Tape-strip — slides tile vertically, never overlap. Equal 0.5 gp slot each.
      // Slide 0 centered at gp=1.0, exits top by gp=1.5
      // Slide 1 enters at gp=1.0, centered at gp=1.5, exits top by gp=2.0
      // Tape-strip with dwell: each background slide lingers at center before transitioning.
      // Raw t (0→1 within gp 1→2) is remapped so 30% is dwell at center + 20% fast transition.
      // Layout: [dwell0=0.3] [trans0→1=0.2] [dwell1=0.3] [trans1→2=0.2] = 1.0
      {
        // Parallax restored — image (and the video slide) counter-translate
        // inside their slide so they scroll slower than the container.
        const PARALLAX = 0.35;
        const IMG_H_RATIO = 1.6;

        const rawT = Math.max(0, Math.min(1, gp - 1));
        // Slight dwell on slide 0 — the first 15 % of tape-strip range keeps
        // it centred, so the slide feels held briefly before flowing on.
        // Past the dwell, the remaining 85 % linearly maps to 0 → 1.
        // No dwell on any device — pure linear slide transitions
        const STICK = 0;
        const stickyT = rawT < STICK ? 0 : (rawT - STICK) / (1 - STICK);
        const stickyGp = 1 + stickyT; // 1.0→2.0

        // The rectangle no longer rotates between faces. Instead its single
        // face shows the currently-active background's name. With tape-strip
        // flow, slide i is centred at stickyT = i / (n-1), so we pick the
        // nearest centred slide (Math.round) — i.e. the text updates when
        // the next slide passes the halfway point of its transition.
        const nBg = BG_IMGS.length;
        const newBgIdx = Math.max(0, Math.min(nBg - 1, Math.round(stickyT * (nBg - 1))));
        if (newBgIdx !== lastBgIdxRef.current) {
          lastBgIdxRef.current = newBgIdx;
          setActiveBgIdx(newBgIdx);
        }

        // Tape-strip flow scroll (dulcedo-style): each slide moves up by
        // 100 % of the viewport per slide-step. Both adjacent slides are
        // visible during the transition (previous exits at the top while
        // the next enters from the bottom — moving together with the scroll).
        // With n = 3 slides, total travel range is `n - 1` slide-steps so
        // slide 0 starts at centre and slide n-1 lands at centre by stickyT = 1.
        const n = bgSlideRefs.current.length || 1;
        const totalSteps = Math.max(1, n - 1);

        // First-slide entrance: slide 0 rises from below (100 % down) in
        // lock-step with the video translating out of the panel (both run
        // over gp 0.55 → 0.90). bg top edge tracks video bottom edge so the
        // seam stays perfectly aligned through the whole transition; by
        // gp = 0.90 the video has fully exited and the bg sits centered.
        const entryT = gp < 0.55 ? 0 : gp >= 0.90 ? 1 : (gp - 0.55) / 0.35;
        const slide0EntryOffset = (1 - entryT) * 100;

        bgSlideRefs.current.forEach((el, i) => {
          if (!el) return;
          const yP = (i - stickyT * totalSteps) * 100 + (i === 0 ? slide0EntryOffset : 0);
          gsap.set(el, { yPercent: yP, opacity: 1, scale: 1 });

          // Parallax: the image inside each slide counter-translates a bit
          // so it appears to scroll slower than the slide container — when
          // the slide moves up the image lags behind. The image is rendered
          // 30 % taller than the slide (IMG_H_RATIO), so we can safely
          // translate by up to ±15 % within the slide without revealing the
          // empty edges.
          const imgEl = bgImgRefs.current[i];
          if (imgEl) {
            // Video slides stay at 1:1 (no inner parallax) so they aren't
            // oversized/blurry. Image slides keep the parallax counter-translate.
            const imgY = (skipVideoPhase && SLIDE_VIDEO_SRC[i]) ? 0 : (-yP * PARALLAX) / IMG_H_RATIO;
            gsap.set(imgEl, { yPercent: imgY });
          }
        });

        // Video slides — scrub currentTime by scroll. Slide i scrubs 0→duration
        // over its own active window: p_i = clamp(stickyT*totalSteps − i).
        slideVidRefs.current.forEach((vEl, i) => {
          if (!vEl || !vEl.duration || !isFinite(vEl.duration)) return;
          const p = Math.max(0, Math.min(1, stickyT * totalSteps - i));
          const t = p * vEl.duration;
          if (Math.abs(vEl.currentTime - t) > 0.03) {
            if (!vEl.paused) vEl.pause();
            vEl.currentTime = t;
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
      // VIDEO_PRELOADER: skip video phase — scrollY 0→visualPx maps directly to
      // gp 1.0→2.0 so the first background slide is centered at scrollY = 0.
      if (skipVideoPhase) {
        const s0 = sec0Px();
        const gp = 1 + Math.min(1, Math.max(0, window.scrollY) / s0);
        progressRef.current = gp;
        pendingGp = gp;
        scheduleApply();
        return;
      }
      const dur = mode === 'bunny' ? BUNNY_DUR : vid?.duration;
      if (!dur || !isFinite(dur)) {
        progressRef.current = 0;
        pendingGp = 0;
        scheduleApply();
        return;
      }
      const isMob = window.innerWidth <= 768;
      const sy = window.scrollY;
      const videoPx = isMob ? 280 : dur * PX_PER_SEC;

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
        // After video: 3 background cards over `visualPx` total. gp maps 1→2.
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

    // ── Velocity-driven slide seam bow (desktop only) ────────────────────
    // Magnitude of recent scroll velocity → CSS variable --slide-bow-v on
    // bgWrap. Each slide's top edge curves by that many pixels (border-
    // radius). Sign tracking flips which slide carries the curve so the
    // bow appears convex going down, concave going up.
    let lastY = window.scrollY;
    let bow   = 0;
    let dir = 0;
    const tickVel = isMobile ? () => {} : (() => {
      let raf = 0;
      const loop = () => {
        const y = window.scrollY;
        const dy = y - lastY;
        lastY = y;
        if (dy !== 0) dir = Math.sign(dy);
        const target = Math.min(200, Math.abs(dy) * 2.0);
        const ease = target > bow ? 0.45 : 0.12;
        bow += (target - bow) * ease;
        if (bgWrapRef.current) {
          bgWrapRef.current.style.setProperty('--slide-bow-v', `${bow.toFixed(1)}px`);
          bgWrapRef.current.style.setProperty('--slide-bow-dir', String(dir));
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(raf);
    })();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (rafId) cancelAnimationFrame(rafId);
      tickVel();
      applyRef.current = null;
    };
  }, [mode, isMobile]);

  useLayoutEffect(() => {
    applyRef.current?.(progressRef.current);
  }, [activeSection]);

  // ── Magnetic panel: while shrunk into the black case card, it follows the mouse cursor.
  //     Also fades the panel out when the mouse is over the top nav or the bottom footer
  //     so it doesn't obscure those clickable areas. ──
  useEffect(() => {
    // Touch devices have no mouse — skip the whole RAF loop to save battery/CPU.
    if (isMobile) return;

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

      // Mouse offset from viewport centre.
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const dx = mouseX - vw / 2;
      const dy = mouseY - vh / 2;
      // Magnet only inside the central 90 % zone of the slide (45 % to each
      // side of centre). Outside the zone the rectangle returns to the
      // centre — mouse position has no effect.
      const zoneW = vw * 0.5;
      const zoneH = vh * 0.5;
      const insideZone = Math.abs(dx) <= zoneW && Math.abs(dy) <= zoneH;
      const STRENGTH = 1.0; // 1:1 with the pointer
      // Sit the plate just to the RIGHT of the cursor (left edge ≈ cursor + 16).
      const pw = panelRef.current?.offsetWidth ?? 300;
      const bias = pw / 2 + 16;
      const targetX = insideZone ? (dx * STRENGTH + bias) * magnet : 0;
      const targetY = insideZone ? dy * STRENGTH * magnet : 0;
      offX += (targetX - offX) * 0.28;
      offY += (targetY - offY) * 0.28;

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
  }, [isMobile]);

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
      <div
        ref={stickyRef}
        className={s.sticky}
        style={{ cursor: 'pointer' }}
        onClick={() => {
          // The whole slide is clickable → /services page.
          if (progressRef.current >= 1.0) onNavigateExpertiza?.();
        }}
      >

        {/* Headline — line by line entrance */}
        <p
          ref={headlineRef}
          className={s.headline}
          style={{ color: activeBgIdx === 0 ? '#fff' : '#000', transition: 'color 0.35s ease' }}
        >
          {HEADLINE_LINES.map((line, i) => (
            <span key={i} style={{ display: 'block', opacity: 0 }}>
              {line}
            </span>
          ))}
        </p>




        {/* Background slides — full-bleed behind panel, scroll-driven.
            White (var(--c-bg)) wrapper — slide containers overlap each
            other vertically so the seams between them never reveal it. */}
        <div ref={bgWrapRef} style={{
          position: 'absolute', inset: '-30px',
          opacity: 0, pointerEvents: 'none', zIndex: 2,
          overflow: 'hidden',
        }}>
          {BG_IMGS.map((src, i) => (
            <div
              key={i}
              ref={el => { bgSlideRefs.current[i] = el; }}
              style={{
                position: 'absolute', inset: 0,
                willChange: 'transform',
                zIndex: i,
                overflow: 'hidden',
              }}
            >
              {skipVideoPhase && SLIDE_VIDEO_SRC[i] ? (
                // Video slide scrubbed by scroll (s1.mp4 / 2.mp4)
                <video
                  ref={el => { bgImgRefs.current[i] = el; slideVidRefs.current[i] = el; }}
                  src={asset(SLIDE_VIDEO_SRC[i])}
                  muted
                  playsInline
                  preload="auto"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', display: 'block' }}
                />
              ) : (
                <img
                  ref={el => { bgImgRefs.current[i] = el; }}
                  src={src}
                  style={{ position: 'absolute', top: '-30%', left: 0, width: '100%', height: '160%', objectFit: 'cover', willChange: 'transform' }}
                  alt=""
                />
              )}
            </div>
          ))}
        </div>

        {/* Panel: video / game — horizontally centered, clickable when small */}
        <div ref={panelRef} className={s.panel}
          onClick={() => {
            if (progressRef.current >= 1.0) onNavigateExpertiza?.();
          }}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            // Viewport-aware initial size — prevents overflow on narrow screens
            // before applyProgress sets explicit pixel dimensions on scroll.
            // Desktop: 3 col widths (= 60vw - 72px); mobile: near full-width.
            width: isMobile ? 'calc(100vw - 20px)' : 'calc(60vw - 72px)',
            aspectRatio: '900 / 506',
            zIndex: 5,
            pointerEvents: 'none',
            cursor: 'default',
          }}>
          <div ref={panelInnerRef} style={{ position: 'absolute', inset: 0 }}>
            {mode === 'bunny' ? (
              <BunnyHero activeSection={activeSection} />
            ) : (
              <>

                {/* Main video layer — hidden when VIDEO_PRELOADER experiment is active */}
                {!skipVideoPhase && (
                <div ref={videoLayerRef} style={{
                  position: 'absolute', inset: 0,
                  transform: 'translate3d(0, 0, 0)',
                  willChange: 'transform',
                }}>
                  <div className={s.panelLayer}>
                    <video
                      ref={vidRef}
                      playsInline
                      preload="auto"
                      muted
                      autoPlay
                    >
                      <source src={asset('/video.mp4')} type="video/mp4" />
                    </video>
                  </div>
                </div>
                )}

                {/* Case info — dark 3D prism, one face per slide. Rotates on imgIdx change. */}
                <div ref={caseInfoRef} style={{
                  position: 'absolute', inset: 0,
                  opacity: 0, pointerEvents: 'none',
                  zIndex: 10,
                  perspective: '1500px',
                }}>
                  {/* 3D-rotating cube with one face per VS_CASE. Rotation is
                      driven by `activeBgIdx` via the useEffect below — gsap
                      animates the cube to the next face whenever the active
                      background slide changes. */}
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
                          background: '#f6f6f6',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          padding: '10px',
                          color: 'var(--c-text)',
                          backfaceVisibility: 'hidden',
                          // translateZ = half of SMALL_H (42px) so the prism fits the bar
                          transform: `rotateX(${i * -90}deg) translateZ(21px)`,
                        }}
                      >
                        {/* Symbol + word only — no link */}
                        <div data-plate style={{ display: 'inline-flex', alignItems: 'center', gap: 10, width: 'max-content' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 'var(--text-size)',
                            lineHeight: 1,
                            color: 'var(--c-text)',
                          }}>{c.symbol}</span>
                          <span style={{
                            fontFamily: 'var(--font)',
                            fontSize: 'var(--text-size)',
                            fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
                            lineHeight: 'var(--text-lh)',
                            letterSpacing: 'var(--text-ls)',
                            color: 'var(--c-text)',
                            whiteSpace: 'nowrap',
                          }}>{c.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </>
            )}
          </div>
        </div>

        {/* Hidden caption ref — kept for opacity logic / refactor safety, but
            the text itself moved into the global Footer (`hi@skip.design`). */}
        <p ref={captionRef} style={{ display: 'none' }} aria-hidden="true" />

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
