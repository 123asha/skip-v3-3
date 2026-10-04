import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import s from './CasesPage.module.css';
import ContactForm from './ContactForm';
import { typo, TEXT_STYLE } from '../utils/typography';
import { SERVICES } from './ExpertiseSection2';
import { t } from '../i18n';

// /about-skip-design — the old site's «Инфо» text, copied as is for now, all
// of it in the home headline's style. Not in the menu yet.
const TEXT = [
  'Верим, что простота — не про упрощение, а смелость скипнуть лишнее, что мешает проявиться сути.',
  'Философия',
  'Дизайн здравого смысла — это когда всё подчиняется логике формы. А значит — идее. В древних языках «форма», «слово» и «звук» были связаны между собой. Говорить — значит придавать форму, а форма смысла — дизайн.',
  'Мы любим, когда проект не кричит, а держит форму. И слово.',
  'Подход',
  'Skip Design — команда стратегов, дизайнеров и менеджеров. Мы верим в хард-скиллы, опыт и индивидуальность каждого специалиста. Это значит, что каждый делает свои задачи по-своему, но с ответственностью за общий результат.',
  'Один из наших принципов — привносить в работу лёгкость, юмор и отступать от шаблонов, если так получится лучший результат.',
  'Любим структуру и уважаем ясность. Поэтому делаем так, чтобы случился мэтч у всех, кто вовлечён в проект:',
  '⭆ клиентам — понятно, каким будет процесс и результат.',
  '⤷ пользователям — удобно и приятно взаимодействовать с продуктом или брендом.',
  '⧉ разработчикам — не приходится тратить время, чтобы разобраться в логике макетов.',
  '※ команде — не стыдно за результат, и хочется им поделиться.',
  'Результат, к которому мы стремимся — это когда сайт, интерфейс, бренд выглядят так, как будто по-другому и быть не могло. Когда без слов понятно, что проект сделан с вниманием к деталям и в точку.',
];

const DARK: Record<string, string> = {
  '--c-bg': '#0d0d0d', '--c-text': '#f2f2f2', '--c-surface': '#1c1c1c',
  '--c-border': '#2e2e2e', '--c-text-muted': '#7c7c7c', '--c-button': '#2a2a2a',
};

// The home headline: its size, leading and tracking (ScrollHero)
const H1: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--hero-fs, min(var(--hero-size), 7.2vw))',
  fontWeight: 'var(--heading-weight)' as React.CSSProperties['fontWeight'],
  lineHeight: 'var(--hero-lh, 0.8755)',
  letterSpacing: '-0.03em',
  color: 'var(--c-text)',
  margin: 0,
};

import { useMobile } from '../hooks/useMobile';

export default function AboutPage({ onNavigatePolicy, onGridMode }: { onNavigatePolicy?: () => void; onGridMode?: (on: boolean) => void }) {
  const pageRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobile();
  useEffect(() => {
    const mainLenis = (window as any).__lenis;
    if (mainLenis) mainLenis.stop();
    const el = pageRef.current!;
    const stopBubble = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener('wheel', stopBubble, { passive: true });
    return () => { el.removeEventListener('wheel', stopBubble); if (mainLenis) mainLenis.start(); };
  }, []);
  // The whole site goes dark while this page is open — footer, edges, banner
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute('style') ?? '';
    Object.entries(DARK).forEach(([k, v]) => root.style.setProperty(k, v));
    document.body.style.background = DARK['--c-bg'];
    return () => { root.setAttribute('style', prev); document.body.style.background = ''; };
  }, []);
  // Paragraphs rise in word by word as they scroll into view, and sink away
  // again as they leave; a shown paragraph is something the ball can land on
  const textRef = useRef<HTMLHeadingElement>(null);
  const shown = useRef(new Set<HTMLElement>());
  useEffect(() => {
    const paras = Array.from(textRef.current!.children) as HTMLElement[];
    const words = (p: HTMLElement) => p.querySelectorAll<HTMLElement>('[data-w]');
    paras.forEach(p => gsap.set(words(p), { yPercent: 60, opacity: 0 }));
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      const p = e.target as HTMLElement;
      gsap.killTweensOf(words(p));
      if (e.isIntersecting) {
        shown.current.add(p);
        gsap.to(words(p), { yPercent: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.025 });
      } else {
        shown.current.delete(p);
        gsap.to(words(p), { yPercent: 60, opacity: 0, duration: 0.4, ease: 'power2.in', stagger: 0.01 });
      }
    }), { root: pageRef.current, threshold: 0.25 });
    paras.forEach(p => io.observe(p));
    return () => io.disconnect();
  }, []);

  // A ball like the hero's rolls down the page, landing on the paragraphs
  // that are in view and dropping off their ends to the next
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = canvasRef.current!;
    const ctx = cv.getContext('2d')!;
    let W = 0, H = 0, dpr = 1, R = 0, raf = 0;
    const b = { x: 0, y: 0, vx: 0, vy: 0 };
    const size = () => {
      dpr = window.devicePixelRatio || 1; W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; R = Math.max(14, Math.min(W, H) * 0.028);
    };
    const drop = () => { b.x = W * (0.3 + Math.random() * 0.4); b.y = -R; b.vx = 1.2 + Math.random(); b.vy = 0; };
    size(); drop();
    const tick = () => {
      b.vy += 0.35; b.x += b.vx; b.y += b.vy;
      // Land on the top of the first line of every shown paragraph
      shown.current.forEach(p => {
        const r = p.getBoundingClientRect();
        const indent = parseFloat(getComputedStyle(p).textIndent) || 0;
        const left = r.left + indent, top = r.top + 4;
        if (b.x > left && b.x < r.right && b.vy > 0 && b.y + R > top && b.y + R - b.vy <= top + 12) {
          b.y = top - R;
          b.vy = b.vy > 3 ? -b.vy * 0.45 : 0;
          if (Math.abs(b.vx) < 1.2) b.vx = 1.2 * Math.sign(b.vx || 1);
        }
      });
      if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx); }
      if (b.x > W - R) { b.x = W - R; b.vx = -Math.abs(b.vx); }
      if (b.y - R > H) drop();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createRadialGradient(b.x - R * 0.15, b.y - R * 0.2, 0, b.x - R * 0.15, b.y - R * 0.2, R * 1.3);
      g.addColorStop(0, '#fdfdfd'); g.addColorStop(0.6, '#f0f0f0'); g.addColorStop(1, '#cfcfcf');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, Math.PI * 2); ctx.fill();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener('resize', size);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size); };
  }, []);

  return (
    <div className={s.page} ref={pageRef} style={{ ...DARK, background: DARK['--c-bg'] } as React.CSSProperties}>
      <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }} />
      <div className={s.body} style={{ paddingTop: 'var(--inner-content-top)', paddingLeft: 'var(--pad)', paddingRight: 'var(--pad)', paddingBottom: 0 }}>
        {/* Desktop: four columns wide, the fifth left empty */}
        <h1 ref={textRef} style={{ ...H1, display: 'flex', flexDirection: 'column', gap: '0.8em', width: isMobile ? undefined : 'calc((100% - 4 * var(--gap)) / 5 * 4 + 3 * var(--gap))' }}>
          {/* Each paragraph's first line starts on the page grid's second column */}
          {TEXT.map((p, i) => (
            <span key={i} style={{ textIndent: isMobile ? '33.333vw' : 'calc((100% - 3 * var(--gap)) / 4 + var(--gap))' }}>
              {typo(t(p)).split(' ').map((w, k) => <span key={k}><span data-w="" style={{ display: 'inline-block', textIndent: 0 }}>{w}</span>{' '}</span>)}
            </span>
          ))}
        </h1>
        {/* The services, plainly listed from the second column: each category,
            its services a step in under it */}
        <div style={{ marginTop: 'var(--space-xl)', marginLeft: isMobile ? 0 : 'calc((100% - 4 * var(--gap)) / 5 + var(--gap))' }}>
          {SERVICES.map(c => (
            <div key={c.category} style={{ marginBottom: 20 }}>
              <p style={{ ...TEXT_STYLE, margin: 0 }}>{t(c.category)}</p>
              <div style={{ paddingLeft: 20, marginTop: 6 }}>
                {c.items.map(it => <p key={it.text} style={{ ...TEXT_STYLE, margin: 0 }}>{t(it.text)}</p>)}
              </div>
            </div>
          ))}
        </div>
        <ContactForm noInvert onNavigatePolicy={onNavigatePolicy} onGridMode={onGridMode} />
      </div>
    </div>
  );
}
