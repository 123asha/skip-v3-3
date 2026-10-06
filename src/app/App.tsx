import { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
import CaseTemplatePage, { SENIORS_BAR, BINAROOM, AE_PLUGIN, AE_PLATFORM, AE_LANDING } from './components/CaseTemplatePage';

// Case pages that run on the case template, by address
const CASE_PAGES: Record<string, any> = {
  '/binaroom': BINAROOM,
  '/plugin-aliexpress': AE_PLUGIN,
  '/ae-platform': AE_PLATFORM,
  '/aliexpress-landing': AE_LANDING,
};
import GuidePage from './components/GuidePage';
import MoscowTime from './components/MoscowTime';
import AboutPage from './components/AboutPage';
import Racket3D from './components/Racket3D';
import ClientBall from './components/ClientBall';
import BunnyFollower from './components/BunnyFollower';
import ContactForm from './components/ContactForm';
import { ToolsSection } from './components/ToolsSection';
import { MediaSection } from './components/MediaSection';
import { ExpertiseSection2 } from './components/ExpertiseSection2';
import { CircleArrow } from './components/CircleArrow';
import LabPage from './components/LabPage';
import CookieNotice from './components/CookieNotice';
import InsightPage from './components/InsightPage';
import { insightBySlug } from './content/insights';
import { pageMetaFor } from './content/seo';
import { applyPageMeta } from './utils/pageMeta';
import { SiteTitle } from './components/PageTitle';
import { FOOTER_SLOT_ID } from './components/ZoomControl';
import { LANG, LANG_PREFIX, stripLang, otherLangHref, t } from './i18n';

// Title of each section page (see SiteTitle), per path
function sectionTitleFor(path: string): string | null {
  const p = path.split(/[?#]/)[0].replace(/\/$/, '');
  if (p === '/cases') return 'Проекты Skip Design';
  if (p === '/services' || p === '/services-2' || p === '/expertiza') return 'Услуги и решения студии';
  if (p === '/insights' || p === '/lab') return 'Инсайты команды';
  if (p === '') return 'Skip Design';
  if (p === '/about-skip-design') return 'Skip Design';
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
import SocialLinks from './components/SocialLinks';


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
// Picture shown in a circle under the «Нам доверяют» ticker while a client's
// name is hovered — the preview of that client's case
const CLIENT_PICTURES: Record<PeopleClient, string> = {
  'AliExpress':   '/preview-ae-platform.webp',
  'Юрий Мурадян': '/preview-case1.webp',
  'Gate Legal':   '/preview-gate-legal.avif',
  'Senior*s Bar': '/preview-seniors.webp',
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
const INVERTED_NAV_PAGES = new Set(['home', 'index2', 'case-template', 'seniors', 'binaroom']);

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
  const KNOWN_PATHS = ['/', '/cases', '/instruments', '/expertiza', '/services', '/services-2', '/policy', '/index2', '/case-template', '/Seniorsbar', ...Object.keys(CASE_PAGES), '/guide', '/lab', '/insights', '/system', '/brand', '/visual', '/digital', '/about-skip-design'];
  const page = pathname === '/cases' ? 'cases'
             : pathname === '/instruments' ? 'instruments'
             : (pathname === '/expertiza' || pathname === '/services') ? 'expertiza'
             // Sandbox copy of the services page for trying ideas out
             : pathname === '/services-2' ? 'expertiza2'
             : pathname === '/policy' ? 'policy'
             : pathname === '/index2' ? 'index2'
             : pathname === '/case-template' ? 'case-template'
             : pathname === '/Seniorsbar' ? 'seniors'
             : CASE_PAGES[pathname] ? 'binaroom'
             : pathname === '/guide' ? 'guide'
             : pathname === '/about-skip-design' ? 'about'
             // /lab is the old address of the insights page — still opens it
             : pathname === '/insights' || pathname === '/lab' ? 'lab'
             // An insight's own article page (unknown slugs fall through to 404)
             : pathname.startsWith('/insights/') && insightBySlug(pathname.slice(10)) ? 'insight'
             : pathname === '/system' ? 'system'
             : pathname === '/brand' ? 'svc-brand'
             : pathname === '/visual' ? 'svc-visual'
             : pathname === '/digital' ? 'svc-digital'
             : pathname === '/' ? 'home'
             : pathname === '/404' || !KNOWN_PATHS.includes(pathname) ? 'notfound'
             : 'home';

  // Phone: a tap on any link or button (menu, «Написать», pills…) clicks
  // with the same sound a desktop hover gets
  useEffect(() => {
    const onTap = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      if ((e.target as Element | null)?.closest?.('a, button')) sound.play('hover');
    };
    window.addEventListener('pointerdown', onTap, { capture: true, passive: true });
    return () => window.removeEventListener('pointerdown', onTap, true);
  }, []);

  // Search / share tags for the page on screen (content/seo.ts)
  useEffect(() => { { const m = pageMetaFor(pathname); applyPageMeta({ ...m, title: t(m.title), description: t(m.description) }); } }, [pathname]);

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
  // The window's own scrollbar right now (the home page's). While a section
  // page opens, the home page's scrollbar can linger for a moment next to the
  // inner page's; fixed items that add the inner page's gutter subtract this,
  // so they never shift twice and jump back.
  const [winSb, setWinSb] = useState(0);
  useLayoutEffect(() => {
    const el = document.documentElement;
    const measure = () => {
      const w = Math.max(0, window.innerWidth - el.clientWidth);
      // Also as a CSS variable, written right here: the observer runs before
      // the frame is painted, while a state update lands a frame later — and
      // for that one frame the header would sit a scrollbar's width off
      el.style.setProperty('--win-sb', `${w}px`);
      setWinSb(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
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
  const heroClientBoxRef = useRef<HTMLDivElement>(null);
  const toolsRowsRef = useRef<HTMLDivElement>(null);
  const casesRevealRef = useRef<HTMLDivElement>(null);
  const introHeadingRef = useRef<HTMLHeadingElement>(null);

  /* People-block: hover on a client name swaps the left/right videos with
     a slide-up transition (PeopleVideoSlot handles the animation). */
  const isMobile = useMobile();
  const [hoveredClient, setHoveredClient] = useState<string | null>(null);
  const clientBallAnchor = useRef<HTMLDivElement>(null);
  // The circle keeps the last picture while it fades out
  const lastClientRef = useRef<PeopleClient | null>(null);
  if (hoveredClient && hoveredClient in CLIENT_PICTURES) lastClientRef.current = hoveredClient as PeopleClient;
  const clientPicture = lastClientRef.current;
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
  // Always runs on its own; it can also be grabbed and dragged either way
  // (mouse or finger), and a flick coasts a little before the drift takes
  // over again. The position wraps by exactly one cycle, so no seam shows.
  useEffect(() => {
    const track = heroClientTrackRef.current;
    const set0 = heroClientSetRef.current;
    const box = heroClientBoxRef.current;
    if (!track || !set0 || !box) return;
    const PX_PER_SEC = 32;
    let cycle = 0;
    let x = 0;
    let fling = 0;            // px/s left over from a drag, decays to 0
    let dragging = false;
    let lastX = 0;
    let lastT = 0;
    const measure = () => {
      const colGap = parseFloat(getComputedStyle(track).columnGap || '0');
      cycle = set0.offsetWidth + colGap;
    };
    const apply = () => {
      if (cycle) x = ((x % cycle) - cycle) % cycle;   // keep x in (-cycle, 0]
      gsap.set(track, { x });
    };
    const tick = (_t: number, dtMs: number) => {
      const dt = Math.min(dtMs, 64) / 1000;
      x -= PX_PER_SEC * dt;                 // the drift never stops
      if (!dragging && fling) {
        x += fling * dt;
        fling *= Math.pow(0.04, dt);        // ~96% of the fling gone per second
        if (Math.abs(fling) < 2) fling = 0;
      }
      apply();
    };
    const onDown = (e: PointerEvent) => {
      dragging = true;
      fling = 0;
      lastX = e.clientX;
      lastT = performance.now();
      box.setPointerCapture(e.pointerId);
      box.style.cursor = 'grabbing';
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      const dx = e.clientX - lastX;
      x += dx;
      // Flick speed, capped so a jerky move can't send it flying
      fling = Math.max(-1500, Math.min(1500, dx / Math.max(8, now - lastT) * 1000));
      lastX = e.clientX;
      lastT = now;
      apply();
    };
    const onUp = () => {
      dragging = false;
      box.style.cursor = '';
      // A pause before letting go means no flick
      if (performance.now() - lastT > 80) fling = 0;
    };
    measure();
    apply();
    gsap.ticker.add(tick);
    box.addEventListener('pointerdown', onDown);
    box.addEventListener('pointermove', onMove);
    box.addEventListener('pointerup', onUp);
    box.addEventListener('pointercancel', onUp);
    window.addEventListener('resize', measure, { passive: true });
    return () => {
      gsap.ticker.remove(tick);
      box.removeEventListener('pointerdown', onDown);
      box.removeEventListener('pointermove', onMove);
      box.removeEventListener('pointerup', onUp);
      box.removeEventListener('pointercancel', onUp);
      window.removeEventListener('resize', measure);
    };
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

  // Phone home page: no pinch zoom (and no double-tap zoom). The viewport
  // meta covers Android; iOS Safari ignores user-scalable=no, so its gesture
  // events and two-finger moves are cancelled as well. Restored on leaving.
  useEffect(() => {
    if (!isMobile || page !== 'home') return;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    const prev = meta?.getAttribute('content') ?? null;
    meta?.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    const html = document.documentElement;
    const prevTouch = html.style.touchAction;
    html.style.touchAction = 'pan-x pan-y';
    const stopGesture = (e: Event) => e.preventDefault();
    const stopTwoFinger = (e: TouchEvent) => { if (e.touches.length > 1) e.preventDefault(); };
    document.addEventListener('gesturestart', stopGesture, { passive: false } as any);
    document.addEventListener('gesturechange', stopGesture, { passive: false } as any);
    document.addEventListener('touchmove', stopTwoFinger, { passive: false });
    return () => {
      if (meta && prev !== null) meta.setAttribute('content', prev);
      html.style.touchAction = prevTouch;
      document.removeEventListener('gesturestart', stopGesture);
      document.removeEventListener('gesturechange', stopGesture);
      document.removeEventListener('touchmove', stopTwoFinger);
    };
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
      // A mostly sideways swipe is the browser's (the trackpad's two-finger
      // back / forward) — Lenis leaves it alone
      virtualScroll: (d: { deltaX: number; deltaY: number }) => Math.abs(d.deltaX) <= Math.abs(d.deltaY),
    } as any);
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
  // A layout effect, and the window's scrollbar re-measured on the spot: the
  // header's right edge depends on both, and done after paint the home
  // scrollbar vanished one frame before --win-sb caught up — the menu jumped
  // a scrollbar's width and back.
  useLayoutEffect(() => {
    const isInner = page !== 'home' && page !== 'index2';
    const el = document.documentElement;
    el.style.overflow = isInner ? 'hidden' : '';
    document.body.style.overflow = isInner ? 'hidden' : '';
    el.style.setProperty('--win-sb', `${Math.max(0, window.innerWidth - el.clientWidth)}px`);
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
  // The section the menu marks as current
  const navSection = page === 'expertiza2' ? 'expertiza'
    : page === 'case-template' || page === 'seniors' || page === 'binaroom' ? 'cases' : page === 'insight' ? 'lab' : page;
  // Phone: the menu links are chips — the current one spreads the others
  // from it, like the filter chips (utils/chipBounce)
  const navLinksRef = useRef<HTMLSpanElement>(null);
  // Phone: on the projects and case pages the menu tucks away while scrolling
  // down (never at the very end of a page); scrolling up a little brings it
  // back (index.css, data-nav-hidden)
  useEffect(() => {
    const root = document.documentElement;
    if (!isMobile) { root.removeAttribute('data-nav-hidden'); return; }
    const hideOnDown = page === 'cases' || page === 'case-template' || page === 'seniors' || page === 'binaroom' || page === 'insight';
    let last = 0;
    const onScroll = (e: Event) => {
      // Inner pages scroll their own layer; the home page scrolls the window
      const el = e.target instanceof HTMLElement && e.target.className.toString().includes('_page_')
        ? e.target : (e.target === document || e.target === window ? document.scrollingElement as HTMLElement : null);
      if (!el) return;
      // iOS rubber-bands past both ends — clamp, and skip small moves, or
      // the menu flips back and forth
      const max = el.scrollHeight - el.clientHeight;
      const y = Math.max(0, Math.min(max, el.scrollTop));
      const atEnd = y >= max - 2;
      // Once the contact form's start is on screen: the menu stays out and the
      // filter chips above it go (index.css / CasesPage.module.css)
      const form = document.querySelector('[class*="contactWrap"]');
      const formShown = !!form && form.getBoundingClientRect().top < window.innerHeight * 0.85;
      root.toggleAttribute('data-form-view', formShown);
      if (!atEnd && Math.abs(y - last) < 16) { if (formShown) root.removeAttribute('data-nav-hidden'); return; }
      const down = y > last;
      // At the very end the menu stays: the footer keeps its own room above it
      root.toggleAttribute('data-nav-hidden', hideOnDown && !atEnd && !formShown && down && y > 80);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => { window.removeEventListener('scroll', onScroll, { capture: true }); root.removeAttribute('data-nav-hidden'); root.removeAttribute('data-form-view'); };
  }, [isMobile, page]);
  const navLinkStyle = (target: string): React.CSSProperties | undefined => {
    // The /services-2 sandbox counts as the services section
    // Case pages count as the projects section
    const section = page === 'expertiza2' ? 'expertiza'
      : page === 'case-template' || page === 'seniors' || page === 'binaroom' ? 'cases' : page === 'insight' ? 'lab' : page;
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
    if (labLinkRef.current) flyToTitle('Skip Design', labLinkRef.current, '/insights');
    else navigate('/insights');
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
    if (pathname === '/' && (was === '/cases' || was === '/instruments' || was === '/expertiza' || was === '/services' || was === '/policy' || was === '/case-template' || was === '/Seniorsbar' || was === '/binaroom' || was === '/guide' || was === '/lab' || was === '/insights' || was.startsWith('/insights/'))) {
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

  // Right-hand gutter of the page grid that fixed header items must add: the
  // inner pages' own scrollbar gutter, minus any window scrollbar still there
  // Monitors 1720px and wider: «Написать» as a black button
  const [wideDesk, setWideDesk] = useState(() => window.innerWidth >= 1720);
  useEffect(() => {
    const on = () => setWideDesk(window.innerWidth >= 1720);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  const navSb = page !== 'home' && page !== 'index2' ? `max(0px, ${scrollbarW}px - var(--win-sb, 0px))` : '0px';

  return (
    <>

      {/* The column grid overlay is a desktop tool — never drawn on a phone,
          whichever page or control asks for it */}
      {gridVisible && !isMobile && (
        <>
          <BunnyFollower />
          <div
            className={s.gridOverlay}
            aria-hidden="true"
            style={{
              // Phone: always the two-column grid
              gridTemplateColumns: `repeat(${isMobile ? 2 : overlayCols}, 1fr)`,
              // Sub-pages scroll inside .page → account for its scrollbar gutter
              ...(page !== 'home' && page !== 'index2'
                ? { paddingRight: `calc(var(--pad) + ${scrollbarW}px)` }
                : null),
            }}
          >
            {Array.from({ length: isMobile ? 2 : overlayCols }).map((_, i) => <div key={i} className={s.gridCol} />)}
          </div>
        </>
      )}

      {/* Inner pages lock the body scroll, so its scrollbar disappears and the
          viewport gets wider — without this the fixed nav jumps right by the
          scrollbar's width. Inner pages scroll inside .page instead, whose own
          gutter is the same width. */}
      {/* On a plain (non-inverted) page the current section stays black and
          the other links go grey. */}
      {/* Phone: progressive blur under the bottom menu (App.module.css) */}
      <div className={s.menuBlur} aria-hidden="true"><div /><div /><div /></div>
      <nav
        className={`${s.nav} ${s.navBoxed}`}
        // One row on every page: the section links, then «Написать» — all on
        // one text baseline (the nav aligns its items by baseline), the pill's
        // top on the logo's top line. Inner pages add the scrollbar gutter
        // (see above) so the row sits identically on every page.
        style={{
          right: `calc(var(--pad) + ${navSb})`,
          // The gutter the page grid leaves on the right — the same amount the
          // row is shifted by, so its width is exactly the 5th column
          ['--nav-sb' as any]: navSb,
        }}
      >
        {/* The section links share one grey box; «Написать» stands apart */}
        <span ref={navLinksRef} className={s.navLinks}>
          {/* Phone only: «Главная» first, so the chips fill the row */}
          {isMobile && (
            <span style={{ display: 'inline-flex' }}>
              <a href="/" className={s.navLink} data-current={navSection === 'home' ? '' : undefined} style={navLinkStyle('home')} onClick={e => { e.preventDefault(); if (page !== 'home') handleBack(); }}>
                <LinkFlip flat>Главная</LinkFlip>
              </a>
            </span>
          )}
          <span ref={casesLinkRef as React.RefObject<HTMLSpanElement>} style={{ display: 'inline-flex' }}>
            <a href="/cases" className={s.navLink} data-current={navSection === 'cases' ? '' : undefined} style={navLinkStyle('cases')} onClick={handleCasesClick}>
              <LinkFlip flat>Проекты</LinkFlip>
            </a>
          </span>
          <span ref={expertizaLinkRef as React.RefObject<HTMLSpanElement>} style={{ display: 'inline-flex' }}>
            <a href="/services" className={s.navLink} data-current={navSection === 'expertiza' ? '' : undefined} style={navLinkStyle('expertiza')} onClick={handleExpertizaClick}>
              <LinkFlip flat>Услуги</LinkFlip>
            </a>
          </span>
          <span ref={labLinkRef as React.RefObject<HTMLSpanElement>} style={{ display: 'inline-flex' }}>
            <a href="/insights" className={s.navLink} data-current={navSection === 'lab' ? '' : undefined} style={navLinkStyle('lab')} onClick={handleLabClick}>
              <LinkFlip flat>Инсайты</LinkFlip>
            </a>
          </span>
          <span ref={toolsLinkRef as React.RefObject<HTMLSpanElement>} style={{ display: 'none' }}>
            <span className={s.navSep}>,</span>
            <a href="/instruments" className={s.navLink} onClick={handleInstrumentsClick}>Подход</a>
          </span>
        </span>
        {/* «Написать» — the word turns into "telegram" on hover, which is
            where it leads */}
        {(() => { const writeEl = (<span className={s.navWrite} style={{ display: 'inline-flex' }}>
          {/* Desktop: a plain link like its neighbours, the ↗ saying it
              leaves the site. Phone keeps the black pill. */}
          {!isMobile ? (
            <a
              href="https://t.me/skpdsgn"
              target="_blank"
              rel="noopener noreferrer"
              className={`${s.navLink} ${s.writeLink}`}
              onMouseEnter={() => sound.play('hover')}
              // Wide monitors (1720px+): a black button
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'baseline', gap: '0.3em', whiteSpace: 'nowrap',
                ...(wideDesk ? { background: 'var(--c-text)', color: '#fff', padding: '8px 14px 9px', borderRadius: 4, alignItems: 'center' } : null) }}
            >
              {/* The arrow first, then the word — centred on the box */}
              {/* Wide monitors' black button: a plain arrow, no circle */}
              {wideDesk
                ? <span aria-hidden="true" className={s.writeArrow}>→</span>
                : <CircleArrow style={{ alignSelf: 'center', position: 'relative', top: 0 }} />}
              <LinkFlip flat>Написать</LinkFlip>
            </a>
          ) : (
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
                    // (on a phone it lives outside the menu: its own colours)
                    background: isMobile ? 'var(--c-text)' : '#fff', color: isMobile ? 'var(--c-bg)' : '#000',
                    ...(isMobile ? { padding: '8px 14px 9px' } : null),
                    // Cube depth = half the pill's height
                    transform: f ? 'rotateX(-90deg) translateZ(18px)' : 'translateZ(18px)',
                  }}
                >{label}</span>
              ))}
            </span>
          </a>
          )}
        </span>);
          // Phone: rendered at body level, not inside the bottom menu — a fixed
          // element inside the moving (tucking) menu jittered on iOS while scrolling
          return isMobile ? createPortal(writeEl, document.body) : writeEl; })()}
      </nav>


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
            ? { right: `calc(var(--pad) - 10px + ${navSb})` }
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
        // Touch: a tap fires the hover but never a mouse-leave, so the letters
        // stayed spread — on a touch release they settle back after a beat
        // (a timer, not a delayed tween: the emulated mouse-enter that follows
        // the touch kills the letters' tweens)
        onTouchEnd={() => {
          window.setTimeout(() => {
            const refs = [dotRef.current, sRef.current, kRef.current, pRef.current];
            gsap.killTweensOf(refs);
            gsap.to(refs, { x: 0, y: 0, duration: 0.22, ease: 'power3.out' });
          }, 350);
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
        opacity: 'var(--opacity-muted)' as any,
        transition: 'opacity 0.4s ease',
        pointerEvents: 'auto',
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
        <span style={{ color: 'inherit', opacity: 'var(--opacity-muted)' as any }}><MoscowTime /> (GMT+3)</span>
      </div>}

      {/* hi@skip.design — desktop only (on mobile it would overlap the
          centred "новый проект" sticky button which sits at the same y) */}
      {!isMobile && <button
        data-footer-mail=""
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
          // Grey like the rest of the footer text; clicking copies the address
          opacity: 'var(--opacity-muted)' as any,
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = 'var(--opacity-muted)')}
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
        {(page === 'home' || !isMobile) && <span style={{ pointerEvents: 'none', opacity: 'var(--opacity-muted)' as any }}>{t('Дизайн, как правила игры')}</span>}
        {/* Pages put their ⌘ ⊖ ⊕ here (ZoomControl) */}
        <span id={FOOTER_SLOT_ID} style={{ display: 'contents' }} />
      </div>}

      {/* ── Phone header: the logo, the language switch right beside it
          (centred on the logo's line), «Написать» in the top right corner
          (.navWrite, App.module.css). The menu chips are pinned at the bottom
          (.nav); time and social are the page's last line (MobileFooter). ── */}
      {isMobile && (
        <>
          <div
            style={{
              position: 'fixed', zIndex: 200,
              // Right of the logo (its box: 10px−10px from the edge, 72.5px
              // wide; top 6px, 52px tall), centred on its line
              left: 'calc(var(--m-head-x) - 10px + 72.5px + 6px)', top: 6, height: 52,
              display: 'flex', alignItems: 'center', gap: 8,
              color: '#fff', mixBlendMode: 'difference',
              transform: 'translateZ(0)',   // own layer — steady while scrolling (iOS)
              fontSize: 'var(--text-size)', fontFamily: 'var(--font)', fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
              letterSpacing: 'var(--text-ls)', lineHeight: 'var(--text-lh)',
            }}
          >
            {/* The sound switch beside the logo (the language moved to the
                page's last line, MobileFooter) */}
            <SoundIcon />
          </div>
          {/* «Skip Design» in the middle of the header on every page, on the
              logo's line */}
          {(
            <div style={{
              position: 'fixed', zIndex: 200, left: 0, right: 0, top: 6, height: 52,
              display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
              transform: 'translateZ(0)',
              color: '#fff', mixBlendMode: 'difference',
              fontSize: 'var(--text-size)', fontFamily: 'var(--font)', fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'],
              letterSpacing: 'var(--text-ls)', lineHeight: 'var(--text-lh)',
            }}>Skip Design</div>
          )}
        </>
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
      {page === 'insight' && <InsightPage
        key={pathname}
        slug={pathname.slice(10)}
        onNavigatePolicy={() => navigateWithExit('/policy')}
        onGridMode={setGridVisible}
      />}
      {page === 'about' && <AboutPage
        onNavigatePolicy={() => navigateWithExit('/policy')}
        onGridMode={setGridVisible}
      />}
      {page === 'lab' && <LabPage
        onNavigatePolicy={() => navigateWithExit('/policy')}
        onGridMode={setGridVisible}
      />}
      {/* Home: «Skip Design» in the same place and style — desktop only, on
          a phone the menu takes that row */}
      {sectionTitleFor(pathname) && !(page === 'home' && isMobile) && (
        <SiteTitle
          // By path, not title: the page exit fades the title out, so even the
          // same title has to come back fresh on the next page
          key={pathname}
          // Phone: without «Skip Design» — the header already says it
          title={isMobile
            ? (page === 'cases' ? 'Проекты студии' : sectionTitleFor(pathname)!.replace(/\s*Skip Design$/, ''))
            : sectionTitleFor(pathname)!}
        />
      )}
      {/* Up arrow at the very end of inner pages — switched off for now
          (ScrollTopArrow in PageTitle.tsx) */}
      {page === 'policy' && <PolicyPage />}
      {/* First visit: the cookie notice, until «Хорошо» */}
      <CookieNotice onPolicy={() => navigateWithExit('/policy')} />
      {page === 'index2' && <Index2Page />}
      {page === 'case-template' && <CaseTemplatePage onNavigatePolicy={() => navigateWithExit('/policy')} onGridMode={setGridVisible} onNavigateCase={href => navigateWithExit(href)} />}
      {page === 'seniors' && <CaseTemplatePage data={SENIORS_BAR} onNavigatePolicy={() => navigateWithExit('/policy')} onGridMode={setGridVisible} onNavigateCase={href => navigateWithExit(href)} />}
      {page === 'binaroom' && <CaseTemplatePage key={pathname} data={CASE_PAGES[pathname]} onNavigatePolicy={() => navigateWithExit('/policy')} onGridMode={setGridVisible} onNavigateCase={href => navigateWithExit(href)} />}
      {page === 'guide' && <GuidePage />}
      {page === 'system' && <DesignSystemPage />}
      {page === 'svc-brand'   && <ServiceDetailPage serviceIdx={0} onBack={() => navigateWithExit('/services')} />}
      {page === 'svc-visual'  && <ServiceDetailPage serviceIdx={1} onBack={() => navigateWithExit('/services')} />}
      {page === 'svc-digital' && <ServiceDetailPage serviceIdx={2} onBack={() => navigateWithExit('/services')} />}
      {page === 'notfound' && <Racket3D onGoHome={() => navigateWithExit('/')} />}

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
          onNavigateLab={() => navigateWithExit('/insights')}
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

        {/* Phone: the same gap under the hero as between the cases */}
        <div id="cases" ref={casesRevealRef} style={{ marginTop: isMobile ? 'var(--cases-row-gap)' : 'var(--space-xl)' }}>
          <ProjectGallery onCaseClick={(href) => navigateWithExit(href || '/case-template')} />
        </div>

        {/* Straight to the full list — same pill as «написать нам», in grey.
            100px under the last row of cases; the section below keeps the
            usual --space-xl gap of its own. */}
        {/* Phone: --space-btn — half the gap to the next block (see index.css) */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: isMobile ? 'var(--space-btn)' : 100 }}>
          <PillButton onClick={() => navigateWithExit('/cases')}>Больше проектов</PillButton>
        </div>

        {/* Фреймворки section removed — its items now live as text rows inside
            «Материалы и инструменты» (MediaSection), per the unified list. */}
        {/* <ToolsSection /> */}

        {/* The same table as on /services — one source, so the two never drift */}
        <div>
          <ExpertiseSection2
            showHeading
            onAllServices={() => {
              if (expertizaLinkRef.current) flyToTitle('Услуги', expertizaLinkRef.current, '/services');
              else navigate('/services');
            }}
          />
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
            ref={heroClientBoxRef}
            style={{
              position: 'relative',
              // Grab-and-drag (see the ticker effect); vertical swipes still scroll
              cursor: 'grab',
              userSelect: 'none',
              touchAction: 'pan-y',
              // 2 of the 5 grid columns wide, plus 20%, centred (the flex parent centres it).
              width: isMobile ? '100%' : 'calc(1.2 * (2 / 5 * (100% - 4 * var(--gap)) + 1 * var(--gap)))',
              // Taller than one line-height so descenders (g, p, у) aren't
              // clipped by the overflow that hides the off-screen names.
              height: 'calc(var(--heading-size) * 1.4)',
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
                fontSize: 'var(--heading-size)',   // the heading style on every screen
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
          {/* Hovered client's picture — a circle 70% of a grid column wide just
              under the names. Zero-height anchor, so it never moves the page. */}
          {!isMobile && (
            <div style={{ position: 'relative', width: '100%', height: 0 }}>
              {/* The ping-pong ball's place: a box 70% of a grid column wide under the names */}
              <div
                ref={clientBallAnchor}
                aria-hidden="true"
                style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 'calc((100vw - 2 * var(--pad) - 4 * var(--gap)) / 5 * 0.7)',
                  aspectRatio: '1 / 1', pointerEvents: 'none',
                }}
              />
              <ClientBall anchor={clientBallAnchor} hovered={hoveredClient} />
            </div>
          )}
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
