import { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { useMobile } from './hooks/useMobile';
import { gsap } from 'gsap';
import Lenis from 'lenis';
import svgPaths from '../imports/Index/svg-3bjnx36a2y';
import { useReveal } from './utils/reveal';
import { asset, videoAsset } from './utils/asset';
import { TEXT_STYLE as ts, H2_STYLE } from './utils/typography';
import ScrollHero from './components/ScrollHero';
import HeroBranches from './components/HeroBranches';
import ProjectGallery from './components/ProjectGallery';
import Footer from './components/Footer';
import CasesPage from './components/CasesPage';
import InstrumentsPage from './components/InstrumentsPage';
import ExpertizaPage from './components/ExpertizaPage';
import ExpertizaPage2 from './components/ExpertizaPage2';
import MindMapBlock from './components/MindMapBlock';
import PolicyPage from './components/PolicyPage';
import Index2Page from './components/Index2Page';
import CaseTemplatePage, { SENIORS_BAR } from './components/CaseTemplatePage';
import GuidePage from './components/GuidePage';
import MoscowTime from './components/MoscowTime';
import BunnyHero from './components/BunnyHero';
import BunnyFollower from './components/BunnyFollower';
import ContactForm from './components/ContactForm';
import { ToolsSection } from './components/ToolsSection';
import { MediaSection } from './components/MediaSection';
import { ExpertiseSection2 } from './components/ExpertiseSection2';
import LabPage from './components/LabPage';
import { SiteTitle } from './components/PageTitle';
import { FOOTER_SLOT_ID } from './components/ZoomControl';
import { LANG, LANG_PREFIX, stripLang, otherLangHref, t } from './i18n';

// Title of each section page (see SiteTitle), per path
function sectionTitleFor(path: string): string | null {
  const p = path.split(/[?#]/)[0].replace(/\/$/, '');
  if (p === '/cases') return 'Проекты Skip Design';
  if (p === '/services' || p === '/services-2' || p === '/expertiza') return 'Услуги Skip Design';
  if (p === '/lab') return 'Инсайты команды';
  return null;
}
import DesignSystemPage from './components/DesignSystemPage';
import ServiceDetailPage from './components/ServiceDetailPage';
import LinkFlip from './components/LinkFlip';
import PeopleVideoSlot, { type VideoConfig } from './components/PeopleVideoSlot';
import SoundIcon from './sound/SoundIcon';
import { sound } from './sound/Sound';
import PillButton from './components/PillButton';
import s from './App.module.css';

// Telegram + LinkedIn circles for the footer — one definition for the desktop
// corner and the mobile bar
function SocialLinks() {
  const circle: React.CSSProperties = {
    width: 24, height: 24, borderRadius: '50%',
    background: '#fff',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    color: '#000', textDecoration: 'none',
    transition: 'opacity 0.2s ease',
  };
  return (
    <>
      <a href="https://t.me/skpdsgn" target="_blank" rel="noreferrer" aria-label="Telegram" style={circle}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: 'translate(-0.5px, 0.5px)' }}>
          <path d="M22 4 2.5 11.5l5.6 1.9 2.2 7 3.7-3.6 5.2 3.8L22 4Zm-5.3 4.6-8 7.2-2.5-.9 10.5-6.3Zm-6 9.2 1.2-3.6 6.4 4.7-3.4-1.5-4.2.4Z" fill="#000" />
        </svg>
      </a>
      <a href="https://ru.linkedin.com/company/skipdesign" target="_blank" rel="noreferrer" aria-label="LinkedIn" style={circle}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: 'translateY(-1px)' }}>
          <path d="M6.94 5a2 2 0 1 1-4-.001 2 2 0 0 1 4 .001ZM7 8.48H3V21h4V8.48Zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68Z" fill="#000"/>
        </svg>
      </a>
    </>
  );
}

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
        fontSize: 'var(--text-size)',
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

  useEffect(() => {
    const bg = bgRef.current, vid = vidRef.current, stage = stageRef.current, text = textRef.current;
    if (!bg || !stage || !text) return;

    // Prefetch the first hero slide video while the preloader is on screen
    // so it's ready the moment the hero is revealed (no white flash).
    const prefetch = document.createElement('video');
    prefetch.src = import.meta.env.BASE_URL + 'seniors-bar.mp4';
    prefetch.preload = 'auto';
    prefetch.muted = true;
    prefetch.style.display = 'none';
    document.body.appendChild(prefetch);
    prefetch.load();
    const removePrefetch = () => { try { document.body.removeChild(prefetch); } catch {} };

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
      gsap.to(bg, { yPercent: -100, duration: 0.85, ease: 'power3.inOut', onComplete: () => { removePrefetch(); onGone(); } });
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

      const isMobileDevice = typeof window !== 'undefined'
        && (window.matchMedia?.('(max-width: 768px)').matches
          || window.matchMedia?.('(pointer: coarse)').matches);

      if (isMobileDevice) {
        // Mobile (esp. iOS Safari): scrubbing currentTime doesn't reliably
        // render frames, so just autoplay the muted, inline video. The curtain
        // lifts at ~2/3 of TARGET (hardCap below is the safety net).
        vid.play().catch(() => { /* autoplay blocked — curtain still lifts */ });
        window.setTimeout(doExit, TARGET * 1000 * (2 / 3));
      } else {
        let startT = 0;
        const drive = (t: number) => {
          if (!startT) startT = t;
          const dur = (vid.duration && isFinite(vid.duration)) ? vid.duration : 4.5;
          const frac = Math.min(1, (t - startT) / (TARGET * 1000));
          try { vid.currentTime = frac * dur; } catch { /* not seekable yet */ }
          // Start raising the preloader once the video reaches 55 % — earlier
          // trigger compensates for the React render-cycle delay so the hero bg
          // rises in sync with the preloader curtain. (doExit is idempotent.)
          if (frac >= 0.55) doExit();
          if (frac < 1) raf = requestAnimationFrame(drive);
        };
        const begin = () => { if (!raf) raf = requestAnimationFrame(drive); };
        if (vid.readyState >= 2) begin();
        else {
          vid.addEventListener('loadeddata', begin, { once: true });
          vid.addEventListener('canplay', begin, { once: true });
        }
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

    return () => { tl.kill(); window.clearTimeout(fallback); window.clearTimeout(hardCap); if (raf) cancelAnimationFrame(raf); gsap.killTweensOf(bg); removePrefetch(); };
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
            <source src={videoAsset('/video.mp4')} type="video/mp4" />
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
  const stripped = (_BASE && p.startsWith(_BASE)) ? p.slice(_BASE.length) : p;
  // Remove trailing slash (GitHub Pages 404 serves /cases/ → we need /cases)
  // …and the /en language prefix (see i18n)
  return stripLang(stripped.replace(/\/$/, '') || '/');
}

// Pages whose top area is a full-bleed cover/video — there the nav inverts
// itself; everywhere else it is plain text on the light background.
const INVERTED_NAV_PAGES = new Set(['home', 'index2', 'case-template', 'seniors']);

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
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const KNOWN_PATHS = ['/', '/cases', '/instruments', '/expertiza', '/services', '/services-2', '/policy', '/index2', '/case-template', '/Seniorsbar', '/guide', '/lab', '/system', '/brand', '/visual', '/digital'];
  const page = pathname === '/cases' ? 'cases'
             : pathname === '/instruments' ? 'instruments'
             : (pathname === '/expertiza' || pathname === '/services') ? 'expertiza'
             // Sandbox copy of the services page for trying ideas out
             : pathname === '/services-2' ? 'expertiza2'
             : pathname === '/policy' ? 'policy'
             : pathname === '/index2' ? 'index2'
             : pathname === '/case-template' ? 'case-template'
             : pathname === '/Seniorsbar' ? 'seniors'
             : pathname === '/guide' ? 'guide'
             : pathname === '/lab' ? 'lab'
             : pathname === '/system' ? 'system'
             : pathname === '/brand' ? 'svc-brand'
             : pathname === '/visual' ? 'svc-visual'
             : pathname === '/digital' ? 'svc-digital'
             : pathname === '/' ? 'home'
             : pathname === '/404' || !KNOWN_PATHS.includes(pathname) ? 'notfound'
             : 'home';

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, '', _BASE + LANG_PREFIX + path);
    setPathname(path);
  }, []);

  useEffect(() => {
    const handlePop = () => setPathname(stripBase(window.location.pathname));
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const [preloaderDone, setPreloaderDone] = useState(true);
  const [preloaderMounted, setPreloaderMounted] = useState(false);
  const [gridVisible, setGridVisible] = useState(false);
  // Column count for the grid overlay — driven by the cases page zoom (5 by default).
  const [overlayCols, setOverlayCols] = useState(5);
  const [showPrivacy, setShowPrivacy] = useState(false);
  // Width of the scrollbar reserved by sub-pages (.page has overflow-y:scroll).
  // The grid overlay is viewport-fixed, so on sub-pages it must add this on the
  // right to line up with content that lives inside the scrollbar gutter.
  // State (not a ref) so the measured width triggers a re-render — otherwise the
  // logo / grid overlay keep the stale 0 position until some other re-render
  // (e.g. toggling the grid) corrects them. useLayoutEffect → no visible flash.
  const [scrollbarW, setScrollbarW] = useState(0);
  useLayoutEffect(() => {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;overflow:scroll;width:50px;height:50px';
    document.body.appendChild(probe);
    setScrollbarW(probe.offsetWidth - probe.clientWidth);
    // Fixed page titles line up with the inner page's grid, which excludes
    // the page's own scrollbar gutter
    document.documentElement.style.setProperty('--page-sb', `${probe.offsetWidth - probe.clientWidth}px`);
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
  const heroClientTrackRef = useRef<HTMLDivElement>(null);
  const heroClientSetRef = useRef<HTMLDivElement>(null);
  const toolsRowsRef = useRef<HTMLDivElement>(null);
  const casesRevealRef = useRef<HTMLDivElement>(null);
  const introHeadingRef = useRef<HTMLHeadingElement>(null);

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

  // Trusted-by ticker — infinite vertical marquee. Content is rendered twice
  // back-to-back so the loop can jump from x:-cycle back to x:0 without a
  // visible seam. The loop distance must be EXACTLY one set's width plus the
  // track's own column-gap (the gap between set 1 and set 2) — using
  // track.scrollWidth/2 is only an approximation and produces a visible
  // stutter/snap at the loop point, since it doesn't precisely equal that.
  useEffect(() => {
    const track = heroClientTrackRef.current;
    const set0 = heroClientSetRef.current;
    if (!track || !set0) return;
    const PX_PER_SEC = 32;
    let tween: gsap.core.Tween | null = null;
    const start = () => {
      tween?.kill();
      const colGap = parseFloat(getComputedStyle(track).columnGap || '0');
      const cycle = set0.offsetWidth + colGap;
      if (!cycle) return;
      gsap.set(track, { x: 0 });
      tween = gsap.to(track, { x: -cycle, duration: cycle / PX_PER_SEC, ease: 'none', repeat: -1 });
    };
    start();
    window.addEventListener('resize', start, { passive: true });
    return () => { tween?.kill(); window.removeEventListener('resize', start); };
  }, []);
  useReveal(toolsRowsRef, { selector: `.${s.toolRow}`, fromY: 14, stagger: 0.08, duration: 0.55 }, preloaderDone);
  // Case cards just rise a little from below on scroll — NO opacity fade
  // (fade:false), so they stay fully visible and only slide up.
  useReveal(casesRevealRef, { selector: '[data-case-card]', fromY: 24, stagger: 0.06, duration: 0.55, fade: false }, preloaderDone);
  useReveal(introHeadingRef, { selector: 'span', fromY: 20, stagger: 0.12, duration: 0.6 }, preloaderDone);

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

  // Bootstrap saved sound preference, then UNLOCK the AudioContext on the first
  // user gesture (browsers require a gesture before audio can play). Sound is ON
  // by default — we only unlock here, never force-enable, so a user who muted
  // via the icon stays muted.
  useEffect(() => {
    sound.init();
    const unlockOnFirstClick = () => sound.unlock();
    window.addEventListener('pointerdown', unlockOnFirstClick, { once: true, passive: true });
    return () => window.removeEventListener('pointerdown', unlockOnFirstClick);
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


  // Sound is wired directly at the elements that use it: logo hover, client
  // hover ("нам доверяют"). No global listeners.

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

  // Lock all page scrolling while the preloader is on screen (home, first load).
  // Stops Lenis (desktop) and blocks native wheel / touch / scroll-keys so the
  // page can't move behind the curtain. Everything is restored once the
  // preloader has fully lifted away (preloaderMounted → false).
  useEffect(() => {
    if (!preloaderMounted) return;
    (window as any).__lenis?.stop();
    const blockEvent = (e: Event) => e.preventDefault();
    const SCROLL_KEYS = new Set([' ', 'Spacebar', 'PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp']);
    const blockKey = (e: KeyboardEvent) => { if (SCROLL_KEYS.has(e.key)) e.preventDefault(); };
    window.addEventListener('wheel', blockEvent, { passive: false });
    window.addEventListener('touchmove', blockEvent, { passive: false });
    window.addEventListener('keydown', blockKey);
    return () => {
      (window as any).__lenis?.start();
      window.removeEventListener('wheel', blockEvent);
      window.removeEventListener('touchmove', blockEvent);
      window.removeEventListener('keydown', blockKey);
    };
  }, [preloaderMounted]);

  // Designer mode (Cmd/Shift+G) makes sure sound is on (part of the "design
  // tools on" affordance). It no longer force-disables on exit — sound is ON
  // by default and otherwise controlled by the user via the icon.
  useEffect(() => {
    sound.unlock();
    if (gridVisible) sound.enable();
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

  // Page exit then navigate. Nav (Кейсы/Услуги/О нас) now stays fixed and
  // visible across every page, so it no longer fades with the page content.
  const navigateWithExit = useCallback((dest: string) => {
    // Already there (e.g. «Инсайты» clicked on the insights page): nothing
    // would come back in after the exit, so the page and title would stay
    // faded out — just stay put.
    if (dest === pathnameRef.current) return;
    // On a sub-page it is that page that has to fade out, not the home
    // wrapper underneath it — otherwise page-to-page jumps look abrupt while
    // home → page is animated.
    const subPage = document.querySelector('[class*="_page_"]') as HTMLElement | null;
    const exitEl = subPage ?? mainRef.current;
    if (!exitEl) { navigate(dest); return; }
    // Parts of the page that live at body level (the section title, see
    // SiteTitle; a case's pinned meta row, see PinnedInvert) are outside the
    // page layer — they leave with it all the same
    const floats = Array.from(document.querySelectorAll<HTMLElement>('body > h1[class*="titleCol2"], body > [data-page-float]'));
    gsap.to([exitEl, ...floats], {
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

  // Current section stays black, the rest go grey — only where the nav is
  // plain text (over a cover it inverts and every link stays white).
  // The nav inverts over everything now (white + difference), so the other
  // sections are dimmed with opacity instead of a grey colour.
  const navLinkStyle = (target: string): React.CSSProperties | undefined => {
    // The /services-2 sandbox counts as the services section
    // Case pages count as the projects section
    const section = page === 'expertiza2' ? 'expertiza'
      : page === 'case-template' || page === 'seniors' ? 'cases' : page;
    // Home and other pages with no current section: all three dark
    if (!['cases', 'expertiza', 'lab'].includes(section)) return undefined;
    // The site's standard muted grey. The nav blends by difference (white
    // text lands black on the light page), so the links carry the grey's
    // inverse — on the page it reads exactly as --c-text-muted.
    return section === target ? undefined : { color: 'var(--c-text-muted-inv)' };
  };
  // The menu is the page title on inner pages — heading size
  const navItemStyle = (target: string): React.CSSProperties => {
    const section = page === 'expertiza2' ? 'expertiza' : page;
    const own = navLinkStyle(target) ?? {};
    // Inner pages: all three items at heading size, the current one black
    // and the others grey (navLinkStyle); home keeps the small menu
    return true
      ? { ...own, textTransform: 'lowercase', fontFamily: 'var(--font-display)', fontSize: 'var(--heading-size)', fontWeight: 'var(--heading-weight)' as any, lineHeight: 'var(--heading-lh)', letterSpacing: 'var(--heading-ls)' }
      : own;
  };

  const handleCasesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (casesLinkRef.current) flyToTitle('Проекты', casesLinkRef.current, '/cases');
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
    if (pathname === '/' && (was === '/cases' || was === '/instruments' || was === '/expertiza' || was === '/services' || was === '/policy' || was === '/case-template' || was === '/Seniorsbar' || was === '/guide' || was === '/lab')) {
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

      {gridVisible && (
        <>
          {!isMobile && <BunnyFollower />}
          <div
            className={s.gridOverlay}
            aria-hidden="true"
            style={{
              gridTemplateColumns: `repeat(${overlayCols}, 1fr)`,
              // Sub-pages scroll inside .page → account for its scrollbar gutter
              ...(page !== 'home' && page !== 'index2'
                ? { paddingRight: `calc(var(--pad) + ${scrollbarW}px)` }
                : null),
            }}
          >
            {Array.from({ length: overlayCols }).map((_, i) => <div key={i} className={s.gridCol} />)}
          </div>
        </>
      )}

      {/* Inner pages lock the body scroll, so its scrollbar disappears and the
          viewport gets wider — without this the fixed nav jumps right by the
          scrollbar's width. Inner pages scroll inside .page instead, whose own
          gutter is the same width. */}
      {/* On a plain (non-inverted) page the current section stays black and
          the other links go grey. */}
      <nav
        className={s.nav}
        // One row on every page: the section links, then «Написать» — all on
        // one text baseline (the nav aligns its items by baseline), the pill's
        // top on the logo's top line. Inner pages add the scrollbar gutter
        // (see above) so the row sits identically on every page.
        // Desktop: at least one grid column wide (App.module.css)
        style={{
          right: `calc(var(--pad) + ${page !== 'home' && page !== 'index2' ? scrollbarW : 0}px)`,
          ['--nav-grid-sb' as any]: `${page !== 'home' && page !== 'index2' ? scrollbarW : 0}px`,
          ['--nav-sb' as any]: `${scrollbarW}px`,
        }}
      >
        <span ref={casesLinkRef as React.RefObject<HTMLSpanElement>} style={{ display: 'inline-flex' }}>
          <a href="/cases" className={s.navLink} style={navLinkStyle('cases')} onClick={handleCasesClick}>
            <LinkFlip flat>Проекты</LinkFlip>
          </a>
        </span>
        <span ref={expertizaLinkRef as React.RefObject<HTMLSpanElement>} style={{ display: 'inline-flex' }}>
          <a href="/services" className={s.navLink} style={navLinkStyle('expertiza')} onClick={handleExpertizaClick}>
            <LinkFlip flat>Услуги</LinkFlip>
          </a>
        </span>
        <span ref={labLinkRef as React.RefObject<HTMLSpanElement>} style={{ display: 'inline-flex' }}>
          <a href="/lab" className={s.navLink} style={navLinkStyle('lab')} onClick={handleLabClick}>
            <LinkFlip flat>Инсайты</LinkFlip>
          </a>
        </span>
        <span ref={toolsLinkRef as React.RefObject<HTMLSpanElement>} style={{ display: 'none' }}>
          <span className={s.navSep}>,</span>
          <a href="/instruments" className={s.navLink} onClick={handleInstrumentsClick}>Подход</a>
        </span>
        {/* «Написать» — the word turns into "telegram" on hover, which is
            where it leads */}
        <span className={s.navWrite} style={{ display: 'inline-flex' }}>
          <a
            href="https://t.me/skpdsgn"
            target="_blank"
            rel="noopener noreferrer"
            className={`${s.navLink} ${s.newProjectBtn}`}
            onMouseEnter={() => sound.play('hover')}
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            {/* Same shape and cube flip as every PillButton, at nav size.
                A black pill with white type. */}
            <span className={s.newProjectFlipInner}>
              {['Написать', 'Телеграм'].map((label, f) => (
                <span
                  key={f}
                  className={`${s.newProjectFace}${f ? ` ${s.newProjectFaceBottom}` : ''} ${s.navPill}`}
                  style={{
                    // Black pill with white type. The nav inverts itself
                    // (difference), so these are the pre-blend colours.
                    background: '#fff', color: '#000',
                    // Cube depth = half the pill's height
                    transform: f ? 'rotateX(-90deg) translateZ(14px)' : 'translateZ(14px)',
                  }}
                >{label}</span>
              ))}
            </span>
          </a>
        </span>
      </nav>

      {/* Home: the studio line, fixed and centred, on the menu's baseline.
          Desktop only — on a phone the menu takes the middle of the row. */}
      {page === 'home' && !isMobile && (
        <div style={{
          position: 'fixed',
          left: '50%',
          translate: '-50% 0',
          top: 'calc(var(--logo-top) + 6px)',
          zIndex: 200,
          fontFamily: 'var(--font)',
          fontSize: 'var(--text-size)',
          fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
          letterSpacing: 'var(--text-ls)',
          lineHeight: 'var(--text-lh)',
          color: '#fff',
          mixBlendMode: 'difference',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>Skip Design</div>
      )}

      <div
        ref={logoRef}
        className={s.logo}
        onClick={page !== 'home' ? handleBack : () => {
          const lenis = (window as any).__lenis;
          if (lenis) lenis.scrollTo(0, { duration: 1.2 });
          else window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        style={{
          cursor: 'pointer',
          // Sub-pages scroll inside .page (no document scrollbar), so the
          // viewport-fixed logo sits ~scrollbar-width too far right vs the home
          // page. Add the scrollbar width back so it lines up identically.
          ...(page !== 'home' && page !== 'index2'
            ? { right: `calc(var(--pad) - 10px + ${scrollbarW}px)` }
            : null),
        }}
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

      {/* Privacy link — second column of the grid (the «написать нам» button
          keeps the first one), revealed at the bottom of the page. */}
      {!isMobile && <div style={{
        position: 'fixed',
        // Second column of the grid, but never under the «написать нам» pill
        // (which is ~154px wide in the same corner) on narrower screens.
        left: 'max(calc(var(--pad) + 154px + 20px), calc(var(--pad) + (100vw - 2 * var(--pad) - 4 * var(--gap)) / 5 + var(--gap)))',
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

      {/* Fixed bottom: time — desktop only (mobile uses unified footer bar below) */}
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

      {/* Social icons — desktop only (mobile uses the footer bar below). The
          row is one text line tall, so the icons centre on the same line the
          footer's text sits on */}
      {!isMobile && <div style={{
        position: 'fixed',
        left: 'calc(var(--pad) + 4 * ((100% - 2 * var(--pad) - 4 * var(--gap)) / 5 + var(--gap)))',
        bottom: 'var(--pad)',
        height: 'calc(var(--text-size) * var(--text-lh))',
        zIndex: 200,
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        mixBlendMode: 'difference',
      }}>
        <SocialLinks />
      </div>}

      {/* Language switch — bottom-left corner, desktop (mobile keeps it in
          the footer bar) */}
      {!isMobile && <div style={{
        position: 'fixed',
        left: 'var(--pad)',
        bottom: 'var(--pad)',
        zIndex: 200,
        fontSize: 'var(--text-size)',
        fontFamily: 'var(--font)',
        fontWeight: 'var(--text-weight)',
        letterSpacing: 'var(--text-ls)',
        lineHeight: 'var(--text-lh)',
        color: '#fff',
        mixBlendMode: 'difference',
        // One row: language, then the home line or the page's own controls —
        // one gap, one text baseline
        display: 'flex',
        alignItems: 'baseline',
        gap: 16,
      }}>
        <a href={otherLangHref(pathname)} style={{ color: 'inherit', textDecoration: 'none', opacity: 0.35 }}>{LANG === 'en' ? '/ru' : '/en'}</a>
        {page === 'home' && <span style={{ pointerEvents: 'none' }}>{t('Дизайн, как правила игры')}</span>}
        {/* Pages put their ⌘ ⊖ ⊕ here (ZoomControl) */}
        <span id={FOOTER_SLOT_ID} style={{ display: 'contents' }} />
      </div>}

      {/* ── Mobile footer bar — the desktop corners in one row: language on
          the left, social + time on the right. One text line tall, pinned to
          the same bottom edge as the desktop footer; every item is centred on
          that line, so all the text shares one baseline. ── */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          left: 'var(--pad)',
          right: 'var(--pad)',
          bottom: 'var(--pad)',
          height: 'calc(var(--text-size) * var(--text-lh))',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
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
          <a href={otherLangHref(pathname)} style={{ color: 'inherit', textDecoration: 'none', opacity: 0.35, pointerEvents: 'auto' }}>{LANG === 'en' ? '/ru' : '/en'}</a>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', pointerEvents: 'auto' }}>
            <SocialLinks />
            <span><MoscowTime /> (GMT+3)</span>
          </div>
        </div>
      )}

      {page === 'cases' && <CasesPage
        onBack={handleBack}
        onCaseClick={(href) => navigateWithExit(href || '/case-template')}
        onNavigatePolicy={() => navigateWithExit('/policy')}
        onGridMode={setGridVisible}
        onGridCols={setOverlayCols}
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
      {page === 'expertiza2' && <ExpertizaPage2
        onNavigatePolicy={() => navigateWithExit('/policy')}
        onGridMode={setGridVisible}
      />}
      {page === 'lab' && <LabPage
        onNavigatePolicy={() => navigateWithExit('/policy')}
        onGridMode={setGridVisible}
      />}
      {sectionTitleFor(pathname) && (
        <SiteTitle
          key={sectionTitleFor(pathname)!}
          title={sectionTitleFor(pathname)!}
          releaseAt={page === 'expertiza' ? '[data-title-release]' : undefined}
        />
      )}
      {page === 'policy' && <PolicyPage />}
      {page === 'index2' && <Index2Page />}
      {page === 'case-template' && <CaseTemplatePage onNavigatePolicy={() => navigateWithExit('/policy')} onGridMode={setGridVisible} onNavigateCase={href => navigateWithExit(href)} />}
      {page === 'seniors' && <CaseTemplatePage data={SENIORS_BAR} onNavigatePolicy={() => navigateWithExit('/policy')} onGridMode={setGridVisible} onNavigateCase={href => navigateWithExit(href)} />}
      {page === 'guide' && <GuidePage />}
      {page === 'system' && <DesignSystemPage />}
      {page === 'svc-brand'   && <ServiceDetailPage serviceIdx={0} onBack={() => navigateWithExit('/services')} />}
      {page === 'svc-visual'  && <ServiceDetailPage serviceIdx={1} onBack={() => navigateWithExit('/services')} />}
      {page === 'svc-digital' && <ServiceDetailPage serviceIdx={2} onBack={() => navigateWithExit('/services')} />}
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
                  <p ref={clientLabelRef} className={s.studioClientsLabel}>Нам доверяют</p>
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

        <div id="cases" ref={casesRevealRef} style={{ marginTop: 'var(--space-xl)' }}>
          <ProjectGallery onCaseClick={(href) => navigateWithExit(href || '/case-template')} />
        </div>

        {/* Straight to the full list — same pill as «написать нам», in grey.
            100px under the last row of cases; the section below keeps the
            usual --space-xl gap of its own. */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}>
          <PillButton onClick={() => navigateWithExit('/cases')}>больше проектов</PillButton>
        </div>

        {/* Фреймворки section removed — its items now live as text rows inside
            «Материалы и инструменты» (MediaSection), per the unified list. */}
        {/* <ToolsSection /> */}

        {/* The same table as on /services — one source, so the two never drift */}
        <div>
          <ExpertiseSection2 showHeading />
        </div>

        {/* Trusted-by clients — moved below Cases */}
        <div
          className={s.section}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: isMobile ? 'var(--space-xs)' : 28,
            textAlign: 'center',
          }}
        >
          <p ref={heroClientLabelRef} style={{ ...ts, margin: 0 }}>Нам доверяют</p>
          <div
            style={{
              position: 'relative',
              // 2 of the 5 grid columns wide, centred (the flex parent centres it).
              width: isMobile ? '100%' : 'calc(2 / 5 * (100% - 4 * var(--gap)) + 1 * var(--gap))',
              // Taller than one line-height so descenders (g, p, у) aren't
              // clipped by the overflow that hides the off-screen names.
              height: isMobile ? 'calc(clamp(36px, 10vw, 56px) * 1.4)' : 'calc(var(--heading-size) * 1.4)',
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Edge masks — fade the ticker to white left and right */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0, left: 0, zIndex: 2, pointerEvents: 'none',
              width: isMobile ? 60 : 140,
              background: 'linear-gradient(to right, var(--c-bg), rgba(255,255,255,0))',
            }} />
            <div style={{
              position: 'absolute', top: 0, bottom: 0, right: 0, zIndex: 2, pointerEvents: 'none',
              width: isMobile ? 60 : 140,
              background: 'linear-gradient(to left, var(--c-bg), rgba(255,255,255,0))',
            }} />

            <div
              ref={heroClientTrackRef}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: isMobile ? 24 : 40,
                fontFamily: 'var(--font-display)',
                fontSize: isMobile ? 'clamp(36px, 10vw, 56px)' : 'var(--heading-size)',
                fontWeight: 'var(--heading-weight)' as React.CSSProperties['fontWeight'],
                lineHeight: 'var(--heading-lh)',
                letterSpacing: 'var(--heading-ls)',
                color: 'var(--c-text)',
                textAlign: 'center',
                willChange: 'transform',
              }}
            >
              {[0, 1].map(dup => (
                <div key={dup} ref={dup === 0 ? heroClientSetRef : undefined} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: isMobile ? 24 : 40 }}>
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
              ))}
            </div>
          </div>
        </div>

        {/* "+ новый проект" — sticky pill above the contact form.
            Fades to 0 the moment the form enters the viewport (driven by
            an IntersectionObserver on .contactWrap). */}

        {/* The contact form stays inside the sticky wrapper, so the button
            keeps its place all the way to the bottom of the page. */}
        <ContactForm onNavigatePolicy={() => navigateWithExit('/policy')} onGridMode={setGridVisible} />

        </div>{/* /newProjectStickyWrap */}

        {/* MindMapBlock temporarily hidden — keep for later */}
        {/* <div className={s.section} style={{ marginTop: 200 }}>
          <MindMapBlock />
        </div> */}
      </div>
    </>
  );
}
