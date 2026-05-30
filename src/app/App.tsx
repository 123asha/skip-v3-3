import { useRef, useEffect, useState, useCallback } from 'react';
import { useMobile } from './hooks/useMobile';
import { gsap } from 'gsap';
import Lenis from 'lenis';
import svgPaths from '../imports/Index/svg-3bjnx36a2y';
import { useReveal } from './utils/reveal';
import { asset } from './utils/asset';
import { TEXT_STYLE as ts } from './utils/typography';
import ScrollHero from './components/ScrollHero';
import HeroBranches from './components/HeroBranches';
import ProjectGallery from './components/ProjectGallery';
import Footer from './components/Footer';
import CasesPage from './components/CasesPage';
import InstrumentsPage from './components/InstrumentsPage';
import ExpertizaPage from './components/ExpertizaPage';
import MindMapBlock from './components/MindMapBlock';
import PolicyPage from './components/PolicyPage';
import Index2Page from './components/Index2Page';
import CaseTemplatePage from './components/CaseTemplatePage';
import GuidePage from './components/GuidePage';
import MoscowTime from './components/MoscowTime';
import BunnyHero from './components/BunnyHero';
import BunnyFollower from './components/BunnyFollower';
import ContactForm from './components/ContactForm';
import { ToolsSection } from './components/ToolsSection';
import { MediaSection } from './components/MediaSection';
import LabPage from './components/LabPage';
import LinkFlip from './components/LinkFlip';
import PeopleVideoSlot, { type VideoConfig } from './components/PeopleVideoSlot';
import SoundIcon from './sound/SoundIcon';
import { sound } from './sound/Sound';
import s from './App.module.css';

// ── People-block: client → video configuration ───────────────────────────────
// Each client maps to a unique (src, objectPosition) pair for both card slots.
// With only two video files available, we vary position to differentiate frames.
const PEOPLE_CLIENTS = ['AliExpress', 'Юрий Мурадян', 'Gate Legal', 'Senior*s Bar'] as const;
type PeopleClient = typeof PEOPLE_CLIENTS[number];

const CLIENT_VIDEOS: Record<PeopleClient, { left: VideoConfig; right: VideoConfig }> = {
  'AliExpress':   { left: { src: '/video.mp4', pos: '50% 50%'  }, right: { src: '/video.mp4', pos: '50% 0%'   } },
  'Юрий Мурадян': { left: { src: '/video.mp4', pos: '50% 0%'   }, right: { src: '/video.mp4', pos: '50% 100%' } },
  'Gate Legal':   { left: { src: '/video.mp4', pos: '0% 50%'   }, right: { src: '/video.mp4', pos: '100% 50%' } },
  'Senior*s Bar': { left: { src: '/video.mp4', pos: '50% 100%' }, right: { src: '/video.mp4', pos: '50% 0%'   } },
};
const DEFAULT_PEOPLE_VIDEOS = {
  left:  { src: '/video.mp4', pos: '50% 50%' } as VideoConfig,
  right: { src: '/video.mp4', pos: '50% 50%' } as VideoConfig,
};

function ScrollHint() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useRef(false);
  const gone = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });

    const onMove = (e: MouseEvent) => {
      if (gone.current) return;
      xTo(e.clientX + 16);
      yTo(e.clientY + 6);
      if (!shown.current) {
        shown.current = true;
        gsap.to(el, { opacity: 0.35, duration: 0.5, ease: 'power2.out' });
      }
    };

    const dismiss = () => {
      if (gone.current) return;
      gone.current = true;
      gsap.to(el, { opacity: 0, duration: 0.3, ease: 'power2.in' });
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('wheel', dismiss, { once: true, passive: true });
    window.addEventListener('scroll', dismiss, { once: true, passive: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('wheel', dismiss);
      window.removeEventListener('scroll', dismiss);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        opacity: 0,
        fontSize: '11px',
        letterSpacing: '0.08em',
        color: 'var(--c-text)',
        userSelect: 'none',
      }}
    >
      scroll
    </div>
  );
}

const HERO_MODE: 'arcade' | 'bunny' = 'arcade';


// ── VIDEO_PRELOADER EXPERIMENT (local only, not deployed) ────────────────────
// video.mp4 = 8.9s. At playbackRate=2 it lasts ~4.45s.
// GSAP timeline is stretched to match (~4.3s total).
// After done → hero scrolls to first background slide (skips video phase).
const VIDEO_PRELOADER = true;

function Preloader({ onReveal, onGone }: { onReveal: () => void; onGone: () => void }) {
  const bgRef   = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const vidRef  = useRef<HTMLVideoElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  // Magnetic cursor caption — "кликни, чтобы включить звук". Follows the
  // pointer with eased lag (same mechanic as the snake/scroll hint), fades in
  // on first move, fades out on the first click (sound enabled).
  useEffect(() => {
    const el = hintRef.current;
    if (!el) return;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    let shown = false, gone = false;
    const onMove = (e: MouseEvent) => {
      if (gone) return;
      xTo(e.clientX + 16);
      yTo(e.clientY + 14);
      if (!shown) { shown = true; gsap.to(el, { opacity: 0.55, duration: 0.4, ease: 'power2.out' }); }
    };
    const dismiss = () => { if (gone) return; gone = true; gsap.to(el, { opacity: 0, duration: 0.3, ease: 'power2.in' }); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('pointerdown', dismiss, { once: true });
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('pointerdown', dismiss); };
  }, []);

  useEffect(() => {
    const bg = bgRef.current, vid = vidRef.current, stage = stageRef.current, text = textRef.current;
    if (!bg || !stage || !text) return;

    // The preloader holds until the video has played fully at natural speed.
    // It exits exactly when the video reaches its end.
    let exited = false;
    let fallback = 0;
    const doExit = () => {
      if (exited) return;
      exited = true;
      window.clearTimeout(fallback);
      // onReveal triggers the hero entrance (first screen rises from below);
      // the preloader rises up and out at the same time.
      onReveal();
      gsap.to(bg, { yPercent: -100, duration: 0.85, ease: 'power3.inOut', onComplete: onGone });
    };

    // Autoplay is unreliable (browsers reject muted play() with AbortError),
    // so we DRIVE the video manually: advance currentTime over TARGET seconds
    // via rAF. Works regardless of autoplay policy. Video is encoded with
    // dense keyframes so seeking is smooth.
    const TARGET = 2.0; // seconds — on-screen play length
    let raf = 0;
    if (vid) {
      vid.muted = true;
      vid.playsInline = true;
      let startT = 0;
      const drive = (t: number) => {
        if (!startT) startT = t;
        const dur = (vid.duration && isFinite(vid.duration)) ? vid.duration : 4.5;
        const frac = Math.min(1, (t - startT) / (TARGET * 1000));
        try { vid.currentTime = frac * dur; } catch { /* not seekable yet */ }
        if (frac < 1) raf = requestAnimationFrame(drive);
        else doExit();
      };
      const begin = () => { if (!raf) raf = requestAnimationFrame(drive); };
      if (vid.readyState >= 2) begin();
      else {
        vid.addEventListener('loadeddata', begin, { once: true });
        vid.addEventListener('canplay', begin, { once: true });
      }
    }
    // Hard safety cap if the video never becomes seekable
    const hardCap = window.setTimeout(doExit, 6000);

    // Rolling-text reveal (à la demos.gsap.com/demo/rolling-text): each glyph
    // is masked and rolls up from below into place, cascading left → right.
    const rolls = Array.from(text.querySelectorAll<HTMLElement>('[data-roll]'));

    gsap.set(stage, { opacity: 0, scale: 0.94, transformOrigin: 'center center' });
    gsap.set(rolls, { yPercent: 110 });

    const tl = gsap.timeline({ delay: 0.25 });
    // 1. Video appears
    tl.to(stage, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }, 0);
    // 2. Glyphs roll up into view, staggered
    tl.to(rolls, { yPercent: 0, duration: 0.55, ease: 'power3.out', stagger: 0.03 }, 0.3);

    return () => { tl.kill(); window.clearTimeout(fallback); window.clearTimeout(hardCap); if (raf) cancelAnimationFrame(raf); gsap.killTweensOf(bg); };
  }, []);

  return (
    <div ref={bgRef} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--c-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
      willChange: 'transform',
    }}>
      <div ref={stageRef} style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        {/* Video — small, centred (no zoom; fills its box) */}
        <div style={{ width: 'min(86vw, 360px)', aspectRatio: '900 / 506', overflow: 'hidden' }}>
          <video ref={vidRef} muted playsInline preload="auto"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', background: 'var(--c-surface)' }}>
            <source src={asset('/video.mp4')} type="video/mp4" />
          </video>
        </div>

        {/* One line below the video — words flip in (LinkFlip style) */}
        <div ref={textRef} style={{
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-size)',
          fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
          letterSpacing: 'var(--text-ls)',
          lineHeight: 1.2,
          color: 'var(--c-text)',
        }}>
          {Array.from('дизайн как правила игры').map((ch, i) =>
            ch === ' ' ? (
              <span key={i} style={{ display: 'inline-block', width: '0.32em' }} />
            ) : (
              <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', lineHeight: 1.2 }}>
                <span data-roll style={{ display: 'inline-block' }}>{ch}</span>
              </span>
            ),
          )}
        </div>
      </div>

      {/* Magnetic cursor caption — main font, follows the pointer */}
      <div
        ref={hintRef}
        style={{
          position: 'fixed', top: 0, left: 0, zIndex: 10000,
          pointerEvents: 'none', opacity: 0, whiteSpace: 'nowrap',
          fontFamily: 'var(--font)',
          fontSize: 'var(--text-size)',
          fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
          letterSpacing: 'var(--text-ls)',
          lineHeight: 1,
          color: 'var(--c-text)',
        }}
      >
        включить звук
      </div>
    </div>
  );
}

// ── 404 page — flying bunny with "Перейти на главную" link ────────────────────
function NotFoundPage({ onGoHome }: { onGoHome: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 160,
      background: 'var(--c-bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 40,
      animation: 'pageIn 0.35s 0.05s ease both',
    }}>
      {/* Flying bunny — BunnyHero in idle/float mode */}
      <div style={{ width: 480, height: 270, overflow: 'hidden' }}>
        <BunnyHero activeSection={-1} />
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--heading-size)',
        fontWeight: 'var(--heading-weight)' as React.CSSProperties['fontWeight'],
        lineHeight: 'var(--heading-lh)',
        letterSpacing: 'var(--heading-ls)',
        color: 'var(--c-text)',
      }}>404</div>
      <button
        onClick={onGoHome}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          fontFamily: 'var(--font)',
          fontSize: 'var(--text-size)',
          fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
          lineHeight: 'var(--text-lh)',
          letterSpacing: 'var(--text-ls)',
          color: 'var(--c-text)',
          textDecoration: 'underline',
          textDecorationStyle: 'dotted',
          textUnderlineOffset: '3px',
        }}
      >Перейти на главную</button>
    </div>
  );
}

// Split the logo SVG into animatable groups
const logoPaths = (() => {
  const all = svgPaths.pb7e9300.match(/M[^M]+/g)!;
  // order: 0=P_OUTER, 1=S, 2=K, 3=P_INNER, 4=DOT
  return {
    s:   all[1],
    k:   all[2],
    dot: all[4],
    p:   all[0] + all[3],
  };
})();

// ── Password gate — site is hidden behind a simple password ────────────────────
const SITE_PASSWORD = '3454';
function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [val, setVal] = useState('');
  const [shake, setShake] = useState(false);
  const submit = () => {
    if (val.trim() === SITE_PASSWORD) {
      try { sessionStorage.setItem('skip-unlocked', '1'); } catch {}
      onUnlock();
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'var(--c-bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 16,
      fontFamily: 'var(--font)',
    }}>
      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--heading-size)',
        fontWeight: 'var(--heading-weight)' as React.CSSProperties['fontWeight'],
        lineHeight: 'var(--heading-lh)',
        letterSpacing: 'var(--heading-ls)',
        color: 'var(--c-text)',
        margin: 0,
      }}>скип</p>
      <input
        type="password"
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="пароль"
        style={{
          background: 'transparent',
          border: '1px solid var(--c-text)',
          color: 'var(--c-text)',
          padding: '10px 16px',
          fontFamily: 'var(--font)',
          fontSize: 'var(--text-size)',
          lineHeight: 'var(--text-lh)',
          letterSpacing: 'var(--text-ls)',
          outline: 'none',
          width: 200,
          textAlign: 'center',
          transition: 'transform 0.1s',
          transform: shake ? 'translateX(4px)' : 'translateX(0)',
          animation: shake ? 'gateShake 0.4s' : undefined,
        }}
      />
      <style>{`@keyframes gateShake {
        10%, 90% { transform: translateX(-2px); }
        20%, 80% { transform: translateX( 3px); }
        30%, 50%, 70% { transform: translateX(-5px); }
        40%, 60% { transform: translateX( 5px); }
      }`}</style>
      <button
        onClick={submit}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          fontFamily: 'var(--font)',
          fontSize: 'var(--text-size)',
          color: 'var(--c-text)',
          textDecoration: 'underline',
          textDecorationStyle: 'dotted',
          textUnderlineOffset: '3px',
        }}
      >войти</button>
    </div>
  );
}

export default function App() {
  return <AppInner />;
}

// Strip the Vite base path (/skip-design) from the browser pathname so
// the app's internal router always sees paths starting with '/'.
const _BASE = import.meta.env.BASE_URL.replace(/\/$/, ''); // e.g. '/skip-design' or ''
function stripBase(p: string): string {
  if (_BASE && p.startsWith(_BASE)) return p.slice(_BASE.length) || '/';
  return p;
}

function AppInner() {
  const [pathname, setPathname] = useState(() => {
    // GitHub Pages SPA: 404.html stores the intended path in sessionStorage.
    const redirect = sessionStorage.getItem('ghpages_redirect');
    if (redirect) {
      sessionStorage.removeItem('ghpages_redirect');
      // Push the real URL without reloading so the browser history is clean.
      window.history.replaceState(null, '', redirect);
    }
    return stripBase(window.location.pathname);
  });
  const KNOWN_PATHS = ['/', '/cases', '/instruments', '/expertiza', '/services', '/policy', '/index2', '/case-template', '/guide', '/lab'];
  const page = pathname === '/cases' ? 'cases'
             : pathname === '/instruments' ? 'instruments'
             : (pathname === '/expertiza' || pathname === '/services') ? 'expertiza'
             : pathname === '/policy' ? 'policy'
             : pathname === '/index2' ? 'index2'
             : pathname === '/case-template' ? 'case-template'
             : pathname === '/guide' ? 'guide'
             : pathname === '/lab' ? 'lab'
             : pathname === '/' ? 'home'
             : pathname === '/404' || !KNOWN_PATHS.includes(pathname) ? 'notfound'
             : 'home';

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, '', _BASE + path);
    setPathname(path);
  }, []);

  useEffect(() => {
    const handlePop = () => setPathname(stripBase(window.location.pathname));
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const [preloaderDone, setPreloaderDone] = useState(() => stripBase(window.location.pathname) !== '/');
  // Preloader stays mounted through its rise-up exit; unmounts only when fully gone.
  const [preloaderMounted, setPreloaderMounted] = useState(() => stripBase(window.location.pathname) === '/');
  const [gridVisible, setGridVisible] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [formInView, setFormInView] = useState(false);
  // Width of the scrollbar reserved by sub-pages (.page has overflow-y:scroll).
  // The grid overlay is viewport-fixed, so on sub-pages it must add this on the
  // right to line up with content that lives inside the scrollbar gutter.
  const scrollbarWRef = useRef(0);
  useEffect(() => {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;overflow:scroll;width:50px;height:50px';
    document.body.appendChild(probe);
    scrollbarWRef.current = probe.offsetWidth - probe.clientWidth;
    probe.remove();
  }, []);
  // Mobile: track when the hero video phase ends (scroll > 280px) so the button fades
  const [mobileVideoOver, setMobileVideoOver] = useState(false);
  const sRef   = useRef<SVGGElement>(null);
  const kRef   = useRef<SVGGElement>(null);
  const dotRef = useRef<SVGGElement>(null);
  const pRef   = useRef<SVGGElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  // Reveal refs
  const studioTextRef = useRef<HTMLDivElement>(null);
  const clientLabelRef = useRef<HTMLParagraphElement>(null);
  const clientNamesRef = useRef<HTMLDivElement>(null);
  /* People-block (above the studio section) — same reveal pattern as the
     studio's "Нам доверяют проекты" line by line. */
  const heroClientLabelRef = useRef<HTMLParagraphElement>(null);
  const heroClientNamesRef = useRef<HTMLDivElement>(null);
  const toolsRowsRef = useRef<HTMLDivElement>(null);

  /* People-block: hover on a client name swaps the left/right videos with
     a slide-up transition (PeopleVideoSlot handles the animation). */
  const isMobile = useMobile();
  const [hoveredClient, setHoveredClient] = useState<string | null>(null);
  const peopleVideos = hoveredClient && (hoveredClient in CLIENT_VIDEOS)
    ? CLIENT_VIDEOS[hoveredClient as PeopleClient]
    : DEFAULT_PEOPLE_VIDEOS;

  useReveal(studioTextRef, { selector: 'p', fromY: 20, stagger: 0.09, duration: 0.6 }, preloaderDone);
  useReveal(clientLabelRef, { fromY: 12, duration: 0.45 }, preloaderDone);
  useReveal(clientNamesRef, { selector: 'p', fromX: 28, fromY: 0, stagger: 0.09, duration: 0.5, ease: 'power2.out' }, preloaderDone);
  useReveal(heroClientLabelRef, { fromY: 12, duration: 0.45 }, preloaderDone);
  useReveal(heroClientNamesRef, { selector: 'p', fromX: 0, fromY: 24, stagger: 0.09, duration: 0.55, ease: 'power3.out' }, preloaderDone);
  useReveal(toolsRowsRef, { selector: `.${s.toolRow}`, fromY: 14, stagger: 0.08, duration: 0.55 }, preloaderDone);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      const prev = window.history.scrollRestoration;
      window.history.scrollRestoration = 'manual';
      window.scrollTo(0, 0);
      return () => { window.history.scrollRestoration = prev; };
    }
  }, []);

  // Reset privacy visibility on page change
  useEffect(() => { setShowPrivacy(false); }, [pathname]);

  // Detect scroll-to-bottom on both the main page (window) and inner fixed pages
  useEffect(() => {
    const onScroll = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t === document || t === document.documentElement || t === document.body) {
        const scrolled = window.scrollY + window.innerHeight;
        setShowPrivacy(scrolled >= document.documentElement.scrollHeight - 120);
      } else if (t && t.scrollHeight) {
        setShowPrivacy(t.scrollTop + t.clientHeight >= t.scrollHeight - 120);
      }
    };
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => document.removeEventListener('scroll', onScroll, { capture: true });
  }, []);

  // Bootstrap saved sound preference + ENABLE audio on first click anywhere.
  useEffect(() => {
    sound.init();
    const enableOnFirstClick = () => sound.enable();
    window.addEventListener('pointerdown', enableOnFirstClick, { once: true, passive: true });
    return () => window.removeEventListener('pointerdown', enableOnFirstClick);
  }, []);

  // Fade the sticky "+ новый проект" pill when the contact form is in view.
  // Mobile: track when hero video phase ends (scroll > 280px = mobile videoPx)
  useEffect(() => {
    if (!isMobile || page !== 'home') { setMobileVideoOver(false); return; }
    const onScroll = () => setMobileVideoOver(window.scrollY > 280);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [isMobile, page]);

  // Watches the contactWrap element on the home page only.
  useEffect(() => {
    if (page !== 'home') { setFormInView(false); return; }
    // Wait a tick so the contact form is mounted.
    let cancelled = false;
    const wire = () => {
      if (cancelled) return;
      const form = document.querySelector('[class*="contactWrap"]');
      if (!form) { window.requestAnimationFrame(wire); return; }
      const obs = new IntersectionObserver(
        ([entry]) => setFormInView(entry.isIntersecting),
        // Positive bottom margin expands the root downward — the button
        // starts fading while the form is still well below the viewport.
        // Note: rootMargin only accepts px or %, not vh, so we convert.
        { rootMargin: `0px 0px ${Math.round(window.innerHeight * 0.7)}px 0px`, threshold: 0 },
      );
      obs.observe(form);
      return () => obs.disconnect();
    };
    const cleanup = wire();
    return () => { cancelled = true; if (cleanup) cleanup(); };
  }, [page]);

  // Global sound triggers (desktop only — touch devices skip).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(pointer: coarse)').matches) return;

    // Case cards: sustained "epic" drone that reacts to mouse movement —
    // louder + more vibrato the faster you move over the card.
    let curCard: Element | null = null;
    let lastX = 0, lastY = 0;
    const onPointerMove = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      const card = t?.closest('[data-case-card]') ?? null;
      if (card) {
        if (card !== curCard) { curCard = card; sound.epicStart(); }
        const speed = Math.min(1, Math.hypot(e.clientX - lastX, e.clientY - lastY) / 36);
        sound.epicMove(speed);
      } else if (curCard) {
        curCard = null;
        sound.epicStop();
      }
      lastX = e.clientX; lastY = e.clientY;
    };
    const onInput = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) {
        sound.play('type');
      }
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('input', onInput, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('input', onInput);
      sound.epicStop();
    };
  }, []);

  useEffect(() => {
    // Skip Lenis on mobile / coarse pointer devices entirely.
    // Reason: on touch we want native momentum scroll — Lenis adds wheel
    // listeners + a RAF loop that can delay touch events while heavy
    // initial paint (images, videos, fonts) is decoding. Programmatic
    // navigation falls back to window.scrollTo (handled at call sites
    // that check `window.__lenis`).
    const isTouch = typeof window !== 'undefined'
      && (window.matchMedia?.('(max-width: 768px)').matches
        || window.matchMedia?.('(pointer: coarse)').matches);
    if (isTouch) return;

    const reduce = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const lenis = new Lenis({
      // duration 0 = no inertia, native scroll speed (no magnetic effect)
      duration: 0,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: !reduce,
      smoothTouch: false,
      prevent: (node: Element) => !!node.closest('[data-lenis-prevent]'),
    });
    (window as any).__lenis = lenis;
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Recalculate scroll limit after fonts/images load so the page never
    // stops short. Lenis v1 doesn't auto-resize — we need to trigger it.
    const resize = () => lenis.resize();
    window.addEventListener('load', resize);

    // Observe both body AND documentElement (some children resize without
    // changing body's box; documentElement always reflects the total).
    const ro = new ResizeObserver(resize);
    ro.observe(document.body);
    ro.observe(document.documentElement);

    // Catch late layout shifts (canvas mounts, fonts metrics, lazy images
    // that don't reserve space). The page on first load can grow by 500+ px
    // after the initial measure — without these fallbacks Lenis caps scroll
    // short of the contact form bottom.
    const t1 = window.setTimeout(resize, 100);
    const t2 = window.setTimeout(resize, 600);
    const t3 = window.setTimeout(resize, 1500);

    return () => {
      gsap.ticker.remove(raf);
      window.removeEventListener('load', resize);
      ro.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      lenis.destroy();
      (window as any).__lenis = null;
    };
  }, []);

  // Designer mode (Cmd/Shift+G) auto-toggles sound — the bamboo feedback
  // is part of the "design tools on" affordance. Outside designer mode,
  // the user can still flip sound manually via the icon.
  useEffect(() => {
    sound.unlock();
    if (gridVisible) sound.enable();
    else sound.disable();
  }, [gridVisible]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.shiftKey) && e.code === 'KeyG') {
        e.preventDefault();
        setGridVisible(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const casesLinkRef = useRef<HTMLElement>(null);
  const toolsLinkRef = useRef<HTMLElement>(null);
  const expertizaLinkRef = useRef<HTMLElement>(null);
  const labLinkRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const logo = logoRef.current;
    const links = [casesLinkRef.current, expertizaLinkRef.current, labLinkRef.current, toolsLinkRef.current].filter(Boolean);
    if (!logo || !links.length) return;
    gsap.set(logo, { opacity: 0, x: 10 });
    gsap.set(links, { opacity: 0, y: 8 });
  }, []);

  useEffect(() => {
    if (!preloaderDone) return;
    const logo = logoRef.current;
    const links = [casesLinkRef.current, expertizaLinkRef.current, labLinkRef.current, toolsLinkRef.current].filter(Boolean);
    if (!logo || !links.length) return;

    const tl = gsap.timeline();
    tl.to(logo, { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out' }, 0)
      .to(links, { opacity: 1, y: 0, duration: 0.4, stagger: 0.07, ease: 'power3.out' }, 0);

    return () => { tl.kill(); };
  }, [preloaderDone]);

  // Line-by-line page exit: stagger visible text elements upward
  const exitPageLines = (onDone: () => void) => {
    if (!mainRef.current) { onDone(); return; }
    const viewport = { top: 0, bottom: window.innerHeight };
    // Collect all direct text nodes visible in viewport
    const candidates = Array.from(
      mainRef.current.querySelectorAll<HTMLElement>('span[style], p, h1, h2, h3, a')
    ).filter(el => {
      const r = el.getBoundingClientRect();
      return r.bottom > viewport.top && r.top < viewport.bottom && r.height > 0;
    });
    if (!candidates.length) { onDone(); return; }
    gsap.to(candidates, {
      y: 36,
      opacity: 0,
      duration: 0.3,
      ease: 'power3.in',
      stagger: { amount: 0.18, from: 'start' },
      onComplete: onDone,
    });
  };

  // Page exit then navigate
  const navigateWithExit = useCallback((dest: string) => {
    if (!mainRef.current) { navigate(dest); return; }
    const allLinks = [casesLinkRef.current, toolsLinkRef.current, expertizaLinkRef.current, labLinkRef.current].filter(Boolean);
    gsap.to(allLinks, { opacity: 0, duration: 0.2, ease: 'power2.in' });
    gsap.to(mainRef.current, {
      opacity: 0,
      y: 20,
      duration: 0.35,
      ease: 'power3.in',
      onComplete: () => {
        navigate(dest);
        // If we're navigating BACK to home, restore the main wrapper —
        // otherwise it stays at opacity 0 from the exit animation and the page looks blank.
        if (dest === '/' && mainRef.current) {
          gsap.set(mainRef.current, { opacity: 1, y: 0 });
          gsap.to(allLinks, { opacity: 1, duration: 0.2 });
        }
      },
    });
  }, [navigate]);

  // Safety net: any time we land on the home page, make sure the main wrapper is fully visible.
  useEffect(() => {
    if (page === 'home' && mainRef.current) {
      gsap.set(mainRef.current, { opacity: 1, y: 0 });
    }
  }, [page]);

  // Lock body scroll when an inner page overlay is open so iOS Safari
  // directs touch-scroll to the overlay's own overflow container.
  useEffect(() => {
    const isInner = page !== 'home' && page !== 'index2';
    document.documentElement.style.overflow = isInner ? 'hidden' : '';
    document.body.style.overflow = isInner ? 'hidden' : '';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [page]);

  const flyToTitle = (_label: string, _linkEl: HTMLAnchorElement, dest: string) => {
    navigateWithExit(dest);
  };

  const handleCasesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (casesLinkRef.current) flyToTitle('Кейсы', casesLinkRef.current, '/cases');
    else navigate('/cases');
  };

  const handleInstrumentsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (toolsLinkRef.current) flyToTitle('Инструменты', toolsLinkRef.current, '/instruments');
    else navigate('/instruments');
  };

  const handleLabClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (labLinkRef.current) flyToTitle('Skip Design', labLinkRef.current, '/lab');
    else navigate('/lab');
  };

  const handleExpertizaClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (expertizaLinkRef.current) flyToTitle('Услуги', expertizaLinkRef.current, '/services');
    else navigate('/services');
  };

  const handleBack = () => {
    navigate('/');
  };

  const prevPath = useRef(pathname);
  useEffect(() => {
    const was = prevPath.current;
    prevPath.current = pathname;
    if (pathname === '/' && (was === '/cases' || was === '/instruments' || was === '/expertiza' || was === '/services' || was === '/policy' || was === '/case-template' || was === '/guide' || was === '/lab')) {
      requestAnimationFrame(() => {
        if (casesLinkRef.current) gsap.set(casesLinkRef.current, { opacity: 1 });
        if (toolsLinkRef.current) gsap.set(toolsLinkRef.current, { opacity: 1 });
        if (expertizaLinkRef.current) gsap.set(expertizaLinkRef.current, { opacity: 1 });
        if (labLinkRef.current) gsap.set(labLinkRef.current, { opacity: 1 });
        if (mainRef.current) {
          gsap.fromTo(mainRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
        }
      });
    }
  }, [pathname]);

  return (
    <>
      {preloaderMounted && (
        <Preloader
          onReveal={() => setPreloaderDone(true)}
          onGone={() => setPreloaderMounted(false)}
        />
      )}

      {gridVisible && (
        <>
          {!isMobile && <BunnyFollower />}
          <div
            className={s.gridOverlay}
            aria-hidden="true"
            style={
              // Sub-pages scroll inside .page → account for its scrollbar gutter
              page !== 'home' && page !== 'index2'
                ? { paddingRight: `calc(var(--pad) + ${scrollbarWRef.current}px)` }
                : undefined
            }
          >
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className={s.gridCol} />)}
          </div>
        </>
      )}

      <nav className={s.nav}>
        {page !== 'home' && page !== 'index2' ? (
          <button className={s.navBack} onClick={handleBack}>← назад</button>
        ) : (
          <>
            <span ref={labLinkRef as React.RefObject<HTMLSpanElement>} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <a href="/lab" className={s.navLink} onClick={handleLabClick}>
                <LinkFlip>Skip Design</LinkFlip>
              </a>
            </span>
            <span ref={casesLinkRef as React.RefObject<HTMLSpanElement>} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <span className={s.navSep}>,</span>
              <a href="/cases" className={s.navLink} onClick={handleCasesClick}>
                <LinkFlip>кейсы</LinkFlip>
              </a>
            </span>
            <span ref={expertizaLinkRef as React.RefObject<HTMLSpanElement>} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <span className={s.navSep}>,</span>
              <a href="/services" className={s.navLink} onClick={handleExpertizaClick}>
                <LinkFlip>услуги</LinkFlip>
              </a>
            </span>
            <span ref={toolsLinkRef as React.RefObject<HTMLSpanElement>} style={{ display: 'none' }}>
              <span className={s.navSep}>,</span>
              <a href="/instruments" className={s.navLink} onClick={handleInstrumentsClick}>Подход</a>
            </span>
          </>
        )}
      </nav>

      <div
        ref={logoRef}
        className={s.logo}
        onClick={page !== 'home' ? handleBack : () => {
          const lenis = (window as any).__lenis;
          if (lenis) lenis.scrollTo(0, { duration: 1.2 });
          else window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => {
          sound.play('logo');
          const refs = [dotRef.current, sRef.current, kRef.current, pRef.current];
          gsap.killTweensOf(refs);
          gsap.to(dotRef.current, { y: -2,   duration: 0.18, ease: 'power2.out' });
          gsap.to(sRef.current,   { x: -2,   duration: 0.18, ease: 'power2.out' });
          gsap.to(kRef.current,   { x: -1.5, duration: 0.18, ease: 'power2.out' });
          gsap.to(pRef.current,   { x: 2,    duration: 0.18, ease: 'power2.out' });
        }}
        onMouseLeave={() => {
          const refs = [dotRef.current, sRef.current, kRef.current, pRef.current];
          gsap.killTweensOf(refs);
          gsap.to(dotRef.current, { y: 0, duration: 0.22, ease: 'power3.out' });
          gsap.to(sRef.current,   { x: 0, duration: 0.22, ease: 'power3.out' });
          gsap.to(kRef.current,   { x: 0, duration: 0.22, ease: 'power3.out' });
          gsap.to(pRef.current,   { x: 0, duration: 0.22, ease: 'power3.out' });
        }}
      >
        <svg fill="none" preserveAspectRatio="none" viewBox="0 0 52.5283 32" overflow="visible" style={{ overflow: 'visible' }}>
          <g ref={sRef}><path d={logoPaths.s} fill="#ffffff" /></g>
          <g ref={kRef}><path d={logoPaths.k} fill="#ffffff" /></g>
          <g ref={dotRef}><path d={logoPaths.dot} fill="#ffffff" /></g>
          <g ref={pRef}><path d={logoPaths.p} fill="#ffffff" fillRule="evenodd" /></g>
        </svg>
      </div>

      <Footer />

      {/* "Обсудить проект" — fixed-bottom only on /index2 (legacy).
          On / (home) it lives inside the page flow as a sticky element, so
          it disappears naturally once the contact form is reached. */}
      {page === 'index2' && preloaderDone && (
        <button
          className={s.newProjectBtn}
          style={{
            position: 'fixed',
            left: 'var(--pad)',
            bottom: 'var(--pad)',
            zIndex: 160,
            mixBlendMode: 'difference',
            background: 'transparent',
            border: 'none',
            borderRadius: 0,
            padding: 0,
            cursor: 'pointer',
            fontFamily: 'var(--font)',
            fontSize: 'var(--text-size)',
            fontWeight: 'var(--text-weight)',
            letterSpacing: 'var(--text-ls)',
            lineHeight: 'var(--text-lh)',
            color: '#000',
            textDecoration: 'none',
            opacity: showPrivacy ? 0 : 1,
            pointerEvents: showPrivacy ? 'none' : 'auto',
            transition: 'opacity 0.3s ease',
            display: 'inline-block',
            perspective: '500px',
          }}
          onClick={() => {
            const el = document.querySelector('[class*="contactWrap"]') as HTMLElement;
            const lenis = (window as any).__lenis;
            if (el && lenis) lenis.scrollTo(el, { duration: 1.2, offset: -40 });
            else if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          {/* Flip-inner — rotates the whole pill on hover.
              Both faces always contain "+ новый проект" so the wrapper is
              wide enough for the bottom face. On the front face the "+" is
              opacity:0 (invisible but occupies layout space), so no width
              jump occurs during the cube rotation. */}
          <span className={s.newProjectFlipInner}>
            <span
              className={s.newProjectFace}
              style={{ background: '#fff', padding: '9px 8px 11px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}
            >
              <span className={s.newProjectPlusGhost} aria-hidden="true">+</span>
              новый проект
            </span>
            <span
              className={`${s.newProjectFace} ${s.newProjectFaceBottom}`}
              style={{ background: '#fff', padding: '9px 8px 11px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}
            >
              <span style={{ marginRight: 6 }}>+</span>
              новый проект
            </span>
          </span>
        </button>
      )}

      {/* Privacy links — bottom-left, appear when scrolled to page bottom (desktop only) */}
      {!isMobile && <div style={{
        position: 'fixed',
        left: 'var(--pad)',
        bottom: 'var(--pad)',
        zIndex: 165,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        opacity: showPrivacy ? 0.7 : 0,
        transition: 'opacity 0.4s ease',
        pointerEvents: showPrivacy ? 'auto' : 'none',
        fontSize: 'var(--text-size)',
        fontFamily: 'var(--font)',
        fontWeight: 'var(--text-weight)',
        letterSpacing: 'var(--text-ls)',
        lineHeight: 'var(--text-lh)',
        color: '#fff',
        mixBlendMode: 'difference',
        userSelect: 'none',
      }}>
        <a href="/policy" onClick={e => { e.preventDefault(); navigate('/policy'); }} style={{ textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px', color: 'inherit' }}>Политика конфиденциальности</a>
      </div>}

      {/* Fixed bottom: /en + time — desktop only (mobile uses unified footer bar below) */}
      {!isMobile && <div style={{
        position: 'fixed',
        ...(page === 'index2'
          ? { left: 'var(--pad)' }
          : { right: 'var(--pad)' }),
        bottom: 'var(--pad)',
        zIndex: 200,
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        fontSize: 'var(--text-size)',
        fontFamily: 'var(--font)',
        fontWeight: 'var(--text-weight)',
        letterSpacing: 'var(--text-ls)',
        lineHeight: 'var(--text-lh)',
        color: '#fff',
        mixBlendMode: 'difference',
        pointerEvents: 'auto',
        userSelect: 'none',
      }}>
        <SoundIcon />
        <span style={{ color: 'inherit' }}><MoscowTime /> (GMT+3)</span>
        <a href="/en" style={{ color: 'inherit', textDecoration: 'none' }}>/en</a>
      </div>}

      {/* hi@skip.design — desktop only (on mobile it would overlap the
          centred "новый проект" sticky button which sits at the same y) */}
      {!isMobile && <button
        onClick={(e) => {
          const text = 'hi@skip.design';
          const el = e.currentTarget;
          const showTip = (msg: string) => {
            el.textContent = msg;
            window.setTimeout(() => { el.textContent = text; }, 1200);
          };
          const fallback = () => {
            try {
              const ta = document.createElement('textarea');
              ta.value = text;
              ta.style.position = 'fixed';
              ta.style.opacity = '0';
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              document.body.removeChild(ta);
              showTip('скопировано');
            } catch { /* swallow */ }
          };
          if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text).then(
              () => showTip('скопировано'),
              () => fallback(),
            );
          } else {
            fallback();
          }
        }}
        style={{
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 'var(--pad)',
          zIndex: 200,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          fontFamily: 'var(--font)',
          fontSize: 'var(--text-size)',
          fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
          letterSpacing: 'var(--text-ls)',
          lineHeight: 'var(--text-lh)',
          color: '#fff',
          mixBlendMode: 'difference',
          textDecoration: 'underline',
          textDecorationStyle: 'dotted',
          textUnderlineOffset: '3px',
          whiteSpace: 'nowrap',
          transition: 'opacity 0.2s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >hi@skip.design</button>}

      {/* Social icons — desktop only (mobile uses unified footer bar below) */}
      {!isMobile && <div style={{
        position: 'fixed',
        left: 'calc(var(--pad) + 4 * ((100% - 2 * var(--pad) - 4 * var(--gap)) / 5 + var(--gap)))',
        bottom: 'var(--pad)',
        zIndex: 200,
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        mixBlendMode: 'difference',
      }}>
        <a
          href="https://t.me/skipbot"
          target="_blank"
          rel="noreferrer"
          aria-label="Telegram"
          style={{
            width: 24, height: 24, borderRadius: '50%',
            background: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#000', textDecoration: 'none',
            transition: 'opacity 0.2s ease',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: 'translate(-0.5px, 0.5px)' }}>
            <path d="M22 4 2.5 11.5l5.6 1.9 2.2 7 3.7-3.6 5.2 3.8L22 4Zm-5.3 4.6-8 7.2-2.5-.9 10.5-6.3Zm-6 9.2 1.2-3.6 6.4 4.7-3.4-1.5-4.2.4Z" fill="#000" />
          </svg>
        </a>
        <a
          href="https://www.linkedin.com/company/skip-design"
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
          style={{
            width: 24, height: 24, borderRadius: '50%',
            background: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#000', textDecoration: 'none',
            transition: 'opacity 0.2s ease',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6.94 5a2 2 0 1 1-4-.001 2 2 0 0 1 4 .001ZM7 8.48H3V21h4V8.48Zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68Z" fill="#000"/>
          </svg>
        </a>
      </div>}

      {/* ── Mobile footer bar — single unified block ──────────────────────────
          All bottom-fixed items consolidated into one flex row on touch screens.
          Left: social links. Right: time + /en. */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--pad)',
          color: '#fff',
          mixBlendMode: 'difference',
          pointerEvents: 'none',
          userSelect: 'none',
          fontSize: 'var(--text-size)',
          fontFamily: 'var(--font)',
          fontWeight: 'var(--text-weight)',
          letterSpacing: 'var(--text-ls)',
          lineHeight: 'var(--text-lh)',
        }}>
          {/* Left: privacy policy */}
          <a
            href="/policy"
            onClick={e => { e.preventDefault(); navigateWithExit('/policy'); }}
            style={{ color: 'inherit', textDecoration: 'none', opacity: 0.5, pointerEvents: 'auto', whiteSpace: 'nowrap' }}
          >
            Политика конфиденциальности
          </a>
          {/* Right: social icons + time + /en */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', pointerEvents: 'auto' }}>
            <a href="https://t.me/skipbot" target="_blank" rel="noreferrer" aria-label="Telegram"
              style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: '#000', textDecoration: 'none' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: 'translate(-0.5px, 0.5px)' }}>
                <path d="M22 4 2.5 11.5l5.6 1.9 2.2 7 3.7-3.6 5.2 3.8L22 4Zm-5.3 4.6-8 7.2-2.5-.9 10.5-6.3Zm-6 9.2 1.2-3.6 6.4 4.7-3.4-1.5-4.2.4Z" fill="#000" />
              </svg>
            </a>
            <a href="https://www.linkedin.com/company/skip-design" target="_blank" rel="noreferrer" aria-label="LinkedIn"
              style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: '#000', textDecoration: 'none' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6.94 5a2 2 0 1 1-4-.001 2 2 0 0 1 4 .001ZM7 8.48H3V21h4V8.48Zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68Z" fill="#000"/>
              </svg>
            </a>
            <span><MoscowTime /> (GMT+3)</span>
            <a href="/en" style={{ color: 'inherit', textDecoration: 'none' }}>/en</a>
          </div>
        </div>
      )}

      {page === 'cases' && <CasesPage
        onBack={handleBack}
        onCaseClick={() => navigateWithExit('/case-template')}
        onNavigatePolicy={() => navigateWithExit('/policy')}
        onGridMode={setGridVisible}
      />}
      {page === 'instruments' && <InstrumentsPage
        onNavigateCases={() => navigateWithExit('/cases')}
        onNavigatePolicy={() => navigateWithExit('/policy')}
        onGridMode={setGridVisible}
      />}
      {page === 'expertiza' && <ExpertizaPage
        onNavigatePolicy={() => navigateWithExit('/policy')}
        onGridMode={setGridVisible}
      />}
      {page === 'lab' && <LabPage
        onNavigatePolicy={() => navigateWithExit('/policy')}
        onGridMode={setGridVisible}
      />}
      {page === 'policy' && <PolicyPage />}
      {page === 'index2' && <Index2Page />}
      {page === 'case-template' && <CaseTemplatePage onNavigatePolicy={() => navigateWithExit('/policy')} onGridMode={setGridVisible} />}
      {page === 'guide' && <GuidePage />}
      {page === 'notfound' && <NotFoundPage onGoHome={() => navigateWithExit('/')} />}

      <div
        ref={mainRef}
        className={s.page}
        style={{ visibility: page === 'home' ? 'visible' : 'hidden' }}
      >
        {/* Sticky-CTA range — wraps everything from the hero down to the
            media section. The "+ новый проект" button (a sticky child near
            the end) glues to the viewport bottom for this entire range. */}
        <div className={s.newProjectStickyWrap}>

        <ScrollHero
          mode={HERO_MODE}
          ready={preloaderDone}
          skipVideoPhase={VIDEO_PRELOADER}
          onNavigateExpertiza={(anchor) => navigateWithExit('/services' + (anchor ? '#' + anchor : ''))}
          onNavigateCases={() => navigateWithExit('/cases')}
          onNavigateLab={() => navigateWithExit('/lab')}
        />

        {/* HeroBranches removed — ScrollHero now runs on every viewport and
            already includes the 3-slide sticky section. */}


        {/* Old #studio block removed — its content lives in the people block above. */}
        {false && (
        <div id="studio" className={s.section} style={{ marginTop: 100 }}>
          <div className={s.studio}>
            <div ref={studioTextRef} className={s.grid5}>
              <p className={s.studioLabel}>Студия</p>
              <div />
              <p className={s.studioDesc}>Skip Design — бутиковая студия цифрового дизайна. Верим, что простота — не про упрощение, а смелость скипнуть лишнее, что мешает проявиться сути.</p>
              <div className={s.studioPhilosophy}>
                <div className={s.studioClients}>
                  <p ref={clientLabelRef} className={s.studioClientsLabel}>Нам доверяют проекты:</p>
                  <div ref={clientNamesRef} className={s.studioClientNames}>
                    {['AliExpress', 'Юрий Мурадян', 'Gate Legal', 'Senior*s Bar'].map(name => (
                      <p
                        key={name}
                        style={{ position: 'relative', margin: 0, cursor: 'pointer' }}
                        onMouseEnter={e => {
                          const logo = e.currentTarget.querySelector('[data-client-logo]') as HTMLElement | null;
                          if (logo) { logo.style.opacity = '1'; logo.style.transform = 'translateX(0)'; }
                        }}
                        onMouseLeave={e => {
                          const logo = e.currentTarget.querySelector('[data-client-logo]') as HTMLElement | null;
                          if (logo) { logo.style.opacity = '0'; logo.style.transform = 'translateX(-8px)'; }
                        }}
                      >
                        {/* Logo placeholder — absolutely positioned to the LEFT of
                            the brand name. Sits outside the line box so the name
                            text doesn't shift when the logo appears. Square
                            ≈ heading line height. */}
                        <span
                          data-client-logo
                          aria-hidden="true"
                          style={{
                            position: 'absolute',
                            right: '100%',
                            top: 0,
                            marginRight: 16,
                            width: 'calc(var(--heading-size) * var(--heading-lh))',
                            height: 'calc(var(--heading-size) * var(--heading-lh))',
                            background: 'var(--c-surface)',
                            opacity: 0,
                            transform: 'translateX(-8px)',
                            transition: 'opacity 0.25s ease, transform 0.25s ease',
                            pointerEvents: 'none',
                          }}
                        />
                        {name}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
              <div />
            </div>
          </div>
        </div>
        )}

        {/* People block — on desktop: 5-col (video · · text · · video)
            on mobile: text-only (videos hidden — heavy autoplay assets that
            slow initial touch-scroll and add little on a small screen). */}
        <div
          className={s.section}
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, 1fr)',
            gap: 'var(--gap)',
            marginTop: 'var(--space-xl)',
            alignItems: 'center',
          }}
        >
          {/* Left video removed — desktop people block now: empty col 1,
              centred text in col 3, right video in col 5. */}

          {/* Desktop layout — description spans the top row across cols 2-4,
              the second row holds the client list (col 3) + the image (col 5).
              The grid row's align-items:center then vertically centres the
              image on just the list, not the description. */}
          {!isMobile && (
          <>
            <p
              style={{
                ...ts,
                gridColumn: '1 / -1',
                gridRow: '1',
                margin: 0,
                marginBottom: 40,
                marginLeft: 'auto',
                marginRight: 'auto',
                textAlign: 'center',
                maxWidth: '440px',
              }}
            >
              Skip&nbsp;Design&nbsp;— студия цифрового дизайна. Верим, что простота — не про упрощение, а смелость скипнуть лишнее, что мешает проявиться суть.
            </p>
            <div
              style={{
                gridColumn: '3 / 4',
                gridRow: '2',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 40,
                textAlign: 'center',
              }}
            >
              <p ref={heroClientLabelRef} style={{ ...ts, margin: 0 }}>Нам доверяют проекты:</p>
              <div ref={heroClientNamesRef} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--heading-size)',
                fontWeight: 'var(--heading-weight)' as React.CSSProperties['fontWeight'],
                lineHeight: 'var(--heading-lh)',
                letterSpacing: 'var(--heading-ls)',
                color: 'var(--c-text)',
                textAlign: 'center',
              }}>
                {PEOPLE_CLIENTS.map(name => (
                  <p
                    key={name}
                    style={{ margin: 0, fontSize: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    onMouseEnter={() => { setHoveredClient(name); sound.play('hover'); }}
                    onMouseLeave={() => setHoveredClient(null)}
                  >
                    <LinkFlip>{name}</LinkFlip>
                  </p>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: '5 / 6', gridRow: '2', alignSelf: 'center' }}>
              <PeopleVideoSlot config={peopleVideos.right} aspectRatio="16/9" />
            </div>
          </>
          )}

          {/* Mobile-only: studio description + clients below videos */}
          {isMobile && (
            <div style={{ gridColumn: '1 / -1', marginTop: 'var(--space-xs)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', textAlign: 'center', alignItems: 'center' }}>
              <p style={{ ...ts, margin: 0, maxWidth: 'calc(2 / 3 * (100vw - 2 * var(--pad)))' }}>
                Skip&nbsp;Design&nbsp;— студия цифрового дизайна. Верим, что простота — не про упрощение, а смелость скипнуть лишнее.
              </p>
              <p ref={heroClientLabelRef} style={{ ...ts, margin: 0 }}>Нам доверяют проекты:</p>
              <div ref={heroClientNamesRef} style={{
                display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(36px, 10vw, 56px)',
                fontWeight: 'var(--heading-weight)' as React.CSSProperties['fontWeight'],
                lineHeight: 'var(--heading-lh)', letterSpacing: 'var(--heading-ls)',
              }}>
                {PEOPLE_CLIENTS.map(name => (
                  <p key={name} style={{ margin: 0, fontSize: 'inherit' }}>{name}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div id="cases" style={{ marginTop: 'var(--space-xl)' }}>
          <ProjectGallery onCaseClick={() => navigateWithExit('/case-template')} />
        </div>

        <ToolsSection />

        <MediaSection toolsRowsRef={toolsRowsRef} />

        {/* "+ новый проект" — sticky pill above the contact form.
            Fades to 0 the moment the form enters the viewport (driven by
            an IntersectionObserver on .contactWrap). */}
        <button
          className={s.newProjectBtn}
          style={isMobile ? {
            // Mobile: fixed below the hero video rect (not sticky).
            // bottom mirrors the h1 top offset so spacing is symmetrical.
            position: 'fixed',
            bottom: 'calc(36px + var(--pad) + 90px)',  // 36px footer + pad + ~h1 top
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 60,
            mixBlendMode: 'difference',
            background: 'transparent',
            border: 'none',
            borderRadius: 0,
            padding: 0,
            margin: 0,
            cursor: mobileVideoOver ? 'default' : 'pointer',
            opacity: mobileVideoOver ? 0 : 1,
            pointerEvents: mobileVideoOver ? 'none' : 'auto',
            transition: 'opacity 0.35s ease',
            fontFamily: 'var(--font)',
            fontSize: 'var(--text-size)',
            fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
            letterSpacing: 'var(--text-ls)',
            lineHeight: 'var(--text-lh)',
            color: '#000',
            textDecoration: 'none',
            display: 'inline-block',
            perspective: '500px',
            whiteSpace: 'nowrap',
          } : {
            position: 'sticky',
            bottom: 'var(--pad)',
            left: 'var(--pad)',
            zIndex: 60,
            mixBlendMode: 'difference',
            background: 'transparent',
            border: 'none',
            borderRadius: 0,
            padding: 0,
            margin: 0,
            marginTop: 'calc(-1 * var(--text-size) * var(--text-lh) - 20px)',
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
            perspective: '500px',
            alignSelf: 'flex-start',
          }}
          onMouseEnter={() => sound.play('logo')}
          onClick={() => {
            const el = document.querySelector('[class*="contactWrap"]') as HTMLElement;
            const lenis = (window as any).__lenis;
            if (el && lenis) lenis.scrollTo(el, { duration: 1.2, offset: -40 });
            else if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span className={s.newProjectFlipInner}>
            <span
              className={s.newProjectFace}
              style={{ background: '#fff', padding: '9px 8px 11px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}
            >
              <span className={s.newProjectPlusGhost} aria-hidden="true">+</span>
              новый проект
            </span>
            <span
              className={`${s.newProjectFace} ${s.newProjectFaceBottom}`}
              style={{ background: '#fff', padding: '9px 8px 11px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}
            >
              <span style={{ marginRight: 6 }}>+</span>
              новый проект
            </span>
          </span>
        </button>

        </div>{/* /newProjectStickyWrap */}

        <ContactForm onNavigatePolicy={() => navigateWithExit('/policy')} onGridMode={setGridVisible} />

        {/* MindMapBlock temporarily hidden — keep for later */}
        {/* <div className={s.section} style={{ marginTop: 200 }}>
          <MindMapBlock />
        </div> */}
      </div>
    </>
  );
}
