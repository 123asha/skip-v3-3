import { useRef, useEffect, useState, useCallback, Fragment } from 'react';
import { gsap } from 'gsap';
import Lenis from 'lenis';
import svgPaths from '../imports/Index/svg-3bjnx36a2y';
import { useReveal } from './utils/reveal';
import { asset } from './utils/asset';
import ScrollHero from './components/ScrollHero';
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
import s from './App.module.css';

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


const PRELOADER_LINES = ['дизайн', 'как', 'правила', 'игры'];
const DOT_R = 5;

// Logo dot path extracted for the preloader ball (index 4 in the svg paths)
const _svgAll = svgPaths.pb7e9300.match(/M[^M]+/g)!;
const LOGO_DOT_PATH = _svgAll[4];
// Tight bounds from actual path coords: x 32.56–37.25, y -0.064–4.648
const LOGO_DOT_VB = '32.5 -0.1 4.8 4.8';
// Custom dot shape for the preloader bounce animation
const DOT_SVG_PATH = 'M4.1039 0.455549C3.70433 0.0538952 3.13298 -0.0637445 2.56514 0.0308883C1.99631 0.125949 1.40685 0.435787 0.920048 0.925298C0.433272 1.41492 0.125334 2.00778 0.0307815 2.5799C-0.0634312 3.15115 0.0534589 3.7256 0.453 4.12756C0.852782 4.52912 1.42488 4.6482 1.9928 4.55327C2.5613 4.45795 3.15139 4.14814 3.63789 3.65886C4.12438 3.16946 4.43246 2.57611 4.52716 2.00425C4.6216 1.43309 4.50304 0.857676 4.1039 0.455549Z';
const DOT_SVG_VB = '0 0 5 5';

function Preloader({ onDone }: { onDone: () => void }) {
  const bgRef   = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const bg   = bgRef.current;
    const wrap = wrapRef.current;
    const wordSpans = Array.from(wrap?.querySelectorAll<HTMLElement>('[data-word]') ?? []);
    if (!bg || !wordSpans.length) return;

    gsap.set(wordSpans, { opacity: 0, y: 12 });

    const tl = gsap.timeline({ delay: 0.1 });

    // Слова появляются — плавный подъём с замедлением
    tl.to(wordSpans, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power3.out',
      stagger: (i: number) => [0, 0.12, 0.12, 0.24][i] ?? i * 0.12,
    });

    // Подъём и исчезновение — одновременно, как будто слова тянут страницу
    tl.to(wordSpans, {
      y: -32,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
      stagger: (i: number) => ([0, 0.05, 0.05, 0.10][i] ?? i * 0.05),
    }, '+=0.15');

    // Фон чуть-чуть поднимается и плавно растворяется
    tl.to(bg, {
      y: -20,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: onDone,
    }, '-=0.25');

    return () => { tl.kill(); };
  }, []);

  return (
    <div ref={bgRef} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--c-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column',
      gap: 14,
      pointerEvents: 'none',
    }}>
      <p ref={wrapRef} style={{
        fontFamily: 'var(--font)',
        fontSize: 'var(--text-size)',
        fontWeight: 'var(--text-weight)',
        letterSpacing: 'var(--text-ls)',
        lineHeight: 'var(--text-lh)',
        color: 'var(--c-text)',
        margin: 0,
      }}>
        {PRELOADER_LINES.map((line, i) => (
          <Fragment key={line}>
            <span data-word style={{ display: 'inline-block', opacity: 0, verticalAlign: 'top' }}>{line}</span>
            {i < PRELOADER_LINES.length - 1 && ' '}
          </Fragment>
        ))}
      </p>
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
  const [pathname, setPathname] = useState(() => stripBase(window.location.pathname));
  const KNOWN_PATHS = ['/', '/cases', '/instruments', '/expertiza', '/services', '/policy', '/index2', '/case-template', '/guide'];
  const page = pathname === '/cases' ? 'cases'
             : pathname === '/instruments' ? 'instruments'
             : (pathname === '/expertiza' || pathname === '/services') ? 'expertiza'
             : pathname === '/policy' ? 'policy'
             : pathname === '/index2' ? 'index2'
             : pathname === '/case-template' ? 'case-template'
             : pathname === '/guide' ? 'guide'
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
  const [gridVisible, setGridVisible] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
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
  const toolsRowsRef = useRef<HTMLDivElement>(null);

  useReveal(studioTextRef, { selector: 'p', fromY: 20, stagger: 0.09, duration: 0.6 }, preloaderDone);
  useReveal(clientLabelRef, { fromY: 12, duration: 0.45 }, preloaderDone);
  useReveal(clientNamesRef, { selector: 'p', fromX: 28, fromY: 0, stagger: 0.09, duration: 0.5, ease: 'power2.out' }, preloaderDone);
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

  useEffect(() => {
    const reduce = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const lenis = new Lenis({
      duration: reduce ? 0 : 0.7,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: !reduce,
      prevent: (node: Element) => !!node.closest('[data-lenis-prevent]'),
    });
    (window as any).__lenis = lenis;
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      (window as any).__lenis = null;
    };
  }, []);

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

  useEffect(() => {
    const logo = logoRef.current;
    const links = [casesLinkRef.current, expertizaLinkRef.current, toolsLinkRef.current].filter(Boolean);
    if (!logo || !links.length) return;
    gsap.set(logo, { opacity: 0, x: 10 });
    gsap.set(links, { opacity: 0, y: 8 });
  }, []);

  useEffect(() => {
    if (!preloaderDone) return;
    const logo = logoRef.current;
    const links = [casesLinkRef.current, expertizaLinkRef.current, toolsLinkRef.current].filter(Boolean);
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
    const allLinks = [casesLinkRef.current, toolsLinkRef.current, expertizaLinkRef.current].filter(Boolean);
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
    if (pathname === '/' && (was === '/cases' || was === '/instruments' || was === '/expertiza' || was === '/services' || was === '/policy' || was === '/case-template' || was === '/guide')) {
      requestAnimationFrame(() => {
        if (casesLinkRef.current) gsap.set(casesLinkRef.current, { opacity: 1 });
        if (toolsLinkRef.current) gsap.set(toolsLinkRef.current, { opacity: 1 });
        if (expertizaLinkRef.current) gsap.set(expertizaLinkRef.current, { opacity: 1 });
        if (mainRef.current) {
          gsap.fromTo(mainRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
        }
      });
    }
  }, [pathname]);

  return (
    <>
      {!preloaderDone && <Preloader onDone={() => setPreloaderDone(true)} />}

      {gridVisible && (
        <>
          <BunnyFollower />
          <div className={s.gridOverlay} aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className={s.gridCol} />)}
          </div>
        </>
      )}

      <nav className={s.nav}>
        {page !== 'home' && page !== 'index2' ? (
          <button className={s.navBack} onClick={handleBack}>← назад</button>
        ) : (
          <>
            <span ref={casesLinkRef as React.RefObject<HTMLSpanElement>}>
              <a href="/cases" className={s.navLink} onClick={handleCasesClick}>Кейсы</a>
            </span>
            <span ref={expertizaLinkRef as React.RefObject<HTMLSpanElement>} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <span className={s.navSep}>,&nbsp;</span>
              <a href="/services" className={s.navLink} onClick={handleExpertizaClick}>Услуги</a>
            </span>
            <span ref={toolsLinkRef as React.RefObject<HTMLSpanElement>} style={{ display: 'none' }}>
              <span className={s.navSep}>,&nbsp;</span>
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

      {/* Privacy links — bottom-left, appear when scrolled to page bottom */}
      <div style={{
        position: 'fixed',
        left: 'var(--pad)',
        bottom: 'var(--pad)',
        zIndex: 165,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        opacity: showPrivacy ? 0.4 : 0,
        transition: 'opacity 0.4s ease',
        pointerEvents: showPrivacy ? 'auto' : 'none',
        fontSize: 'var(--text-size)',
        fontFamily: 'var(--font)',
        fontWeight: 'var(--text-weight)',
        letterSpacing: 'var(--text-ls)',
        lineHeight: 'var(--text-lh)',
        color: 'var(--c-text)',
        userSelect: 'none',
      }}>
        <a href="/policy" onClick={e => { e.preventDefault(); navigate('/policy'); }} style={{ textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px', color: 'inherit' }}>Политика конфиденциальности</a>
      </div>

      {/* Fixed bottom: /en + time — bottom-left on index2, bottom-right elsewhere */}
      <div style={{
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
        <span style={{ color: 'inherit' }}><MoscowTime /> (GMT+3)</span>
        <a href="/en" style={{ color: 'inherit', textDecoration: 'none' }}>/en</a>
      </div>

      {/* Social icons — dark circles with white glyph inside.
          LinkedIn icon is just the letterform "in" — no surrounding box. */}
      <div style={{
        position: 'fixed',
        left: 'calc(var(--pad) + 4 * ((100% - 2 * var(--pad) - 4 * var(--gap)) / 5 + var(--gap)))',
        bottom: 'var(--pad)',
        zIndex: 200,
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
      }}>
        <a
          href="https://t.me/skipbot"
          target="_blank"
          rel="noreferrer"
          aria-label="Telegram"
          style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'var(--c-text)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', textDecoration: 'none',
            transition: 'opacity 0.2s ease',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: 'translate(-0.5px, 0.5px)' }}>
            <path d="M22 4 2.5 11.5l5.6 1.9 2.2 7 3.7-3.6 5.2 3.8L22 4Zm-5.3 4.6-8 7.2-2.5-.9 10.5-6.3Zm-6 9.2 1.2-3.6 6.4 4.7-3.4-1.5-4.2.4Z" fill="#fff" />
          </svg>
        </a>
        <a
          href="https://www.linkedin.com/company/skip-design"
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
          style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'var(--c-text)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', textDecoration: 'none',
            transition: 'opacity 0.2s ease',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6.94 5a2 2 0 1 1-4-.001 2 2 0 0 1 4 .001ZM7 8.48H3V21h4V8.48Zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68Z" fill="#fff"/>
          </svg>
        </a>
      </div>

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
        <ScrollHero
          mode={HERO_MODE}
          ready={preloaderDone}
          onNavigateExpertiza={(anchor) => navigateWithExit('/services' + (anchor ? '#' + anchor : ''))}
          onNavigateCases={() => navigateWithExit('/cases')}
        />

        <div id="studio" className={s.section} style={{ marginTop: 100 }}>
          <div className={s.studio}>
            <div ref={studioTextRef} className={s.grid5}>
              <p className={s.studioLabel}>Студия</p>
              <div />
              <p className={s.studioDesc}>Skip Design — бутиковая студия цифрового дизайна. Мы ценим человечность, здравый смысл и мастерство.</p>
              <div className={s.studioPhilosophy}>
                <p className={s.studioDesc}>Верим, что простота — не про упрощение, а смелость скипнуть лишнее, что мешает проявиться сути.</p>
                <div className={s.studioClients}>
                  <p ref={clientLabelRef} className={s.studioClientsLabel}>Нам доверяют проекты:</p>
                  <div ref={clientNamesRef} className={s.studioClientNames}>
                    <p>AliExpress</p><p>Юрий Мурадян</p><p>Gate Legal</p><p>Senior*s Bar</p>
                  </div>
                </div>
              </div>
              <div />
            </div>
          </div>
        </div>

        <div id="cases" style={{ marginTop: 200 }}>
          <ProjectGallery onCaseClick={() => navigateWithExit('/case-template')} />
        </div>

        <div data-section="media" className={s.fullVideo}>
          <video autoPlay muted loop playsInline>
            <source src={asset('/video2.mov')} type="video/mp4" />
          </video>
        </div>

        <ToolsSection />

        <MediaSection toolsRowsRef={toolsRowsRef} />

        <ContactForm onNavigatePolicy={() => navigateWithExit('/policy')} onGridMode={setGridVisible} />

        {/* MindMapBlock temporarily hidden — keep for later */}
        {/* <div className={s.section} style={{ marginTop: 200 }}>
          <MindMapBlock />
        </div> */}
      </div>
    </>
  );
}
