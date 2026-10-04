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
    Object.entries(DARK).forEach(([k, v]) => root.style.setProperty(k, v));
    document.body.style.background = DARK['--c-bg'];
    // Only our own properties go back — the app sets html's scroll lock itself
    return () => { Object.keys(DARK).forEach(k => root.style.removeProperty(k)); document.body.style.background = ''; };
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

  // Behind the text: one graph of lettered balls, as on the home page. As the
  // page scrolls its nodes drift into other formations and rewire themselves
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = canvasRef.current!, page = pageRef.current!;
    const ctx = cv.getContext('2d')!;
    const LETTERS = 'SKIPDESIGN'.split('');
    const N = LETTERS.length;
    let W = 0, H = 0, dpr = 1, R = 0, raf = 0;
    const pts = Array.from({ length: N }, () => ({ x: 0, y: 0 }));
    // Formations (unit square) and which nodes each one links
    const ring = (i: number) => ({ x: 0.5 + 0.34 * Math.cos(i / N * 6.283 - 1.57), y: 0.5 + 0.34 * Math.sin(i / N * 6.283 - 1.57) });
    const FORMS: { at: (i: number) => { x: number; y: number }; edges: [number, number][] }[] = [
      { at: ring, edges: Array.from({ length: N }, (_, i) => [i, (i + 1) % N] as [number, number]) },
      { at: i => ({ x: 0.1 + i * 0.8 / (N - 1), y: 0.5 + 0.22 * Math.sin(i * 0.9) }), edges: Array.from({ length: N - 1 }, (_, i) => [i, i + 1] as [number, number]) },
      { at: i => i === 0 ? { x: 0.5, y: 0.5 } : { x: 0.5 + 0.38 * Math.cos((i - 1) / (N - 1) * 6.283), y: 0.5 + 0.38 * Math.sin((i - 1) / (N - 1) * 6.283) }, edges: Array.from({ length: N - 1 }, (_, i) => [0, i + 1] as [number, number]) },
      { at: i => ({ x: 0.2 + (i % 4) * 0.2, y: 0.25 + Math.floor(i / 4) * 0.25 }), edges: [[0,1],[1,2],[2,3],[4,5],[5,6],[6,7],[8,9],[0,4],[4,8],[1,5],[5,9],[2,6],[3,7]] },
      { at: i => ({ x: 0.3 + 0.4 * (i % 2) + 0.05 * Math.sin(i), y: 0.1 + i * 0.8 / (N - 1) }), edges: Array.from({ length: N - 2 }, (_, i) => [i, i + 2] as [number, number]).concat([[0, 1], [N - 2, N - 1]]) },
    ];
    const size = () => {
      dpr = window.devicePixelRatio || 1; W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; R = Math.max(18, Math.min(W, H) * 0.045);
    };
    size();
    pts.forEach((p, i) => { const q = ring(i); p.x = q.x * W; p.y = q.y * H; });
    const tick = () => {
      const max = page.scrollHeight - page.clientHeight;
      const prog = max > 0 ? Math.min(1, Math.max(0, page.scrollTop / max)) : 0;
      const f = Math.min(FORMS.length - 1, Math.floor(prog * FORMS.length));
      const form = FORMS[f];
      pts.forEach((p, i) => {
        const q = form.at(i);
        p.x += (q.x * W - p.x) * 0.05; p.y += (q.y * H - p.y) * 0.05;
      });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.setLineDash([2, 11]);
      form.edges.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke(); });
      ctx.setLineDash([]);
      ctx.font = `${R * 1.1}px "CoFo Sans VF", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      pts.forEach((p, i) => {
        // A dark ball close to the page colour, but round: lit from the upper left,
        // a soft rim of light on the lower right, a drop of shade beneath
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(p.x + R * 0.1, p.y + R * 1.08, R * 0.8, R * 0.18, 0, 0, Math.PI * 2); ctx.fill();
        const g = ctx.createRadialGradient(p.x - R * 0.35, p.y - R * 0.4, R * 0.05, p.x, p.y, R * 1.05);
        g.addColorStop(0, '#4a4a4a'); g.addColorStop(0.45, '#262626'); g.addColorStop(0.85, '#141414'); g.addColorStop(1, '#0a0a0a');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, Math.PI * 2); ctx.fill();
        const rim = ctx.createRadialGradient(p.x + R * 0.5, p.y + R * 0.6, R * 0.5, p.x + R * 0.5, p.y + R * 0.6, R * 1.0);
        rim.addColorStop(0, 'rgba(255,255,255,0)'); rim.addColorStop(1, 'rgba(255,255,255,0.14)');
        ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, Math.PI * 2); ctx.fill();
        const hl = ctx.createRadialGradient(p.x - R * 0.4, p.y - R * 0.45, 0, p.x - R * 0.4, p.y - R * 0.45, R * 0.55);
        hl.addColorStop(0, 'rgba(255,255,255,0.38)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hl; ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillText(LETTERS[i], p.x, p.y + R * 0.06);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener('resize', size);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size); };
  }, []);

  return (
    <div className={s.page} ref={pageRef} style={{ ...DARK, background: DARK['--c-bg'] } as React.CSSProperties}>
      <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
      <div className={s.body} style={{ position: 'relative', zIndex: 1, paddingTop: 'var(--inner-content-top)', paddingLeft: 'var(--pad)', paddingRight: 'var(--pad)', paddingBottom: 0 }}>
        
        <h1 ref={textRef} style={{ ...H1, display: 'flex', flexDirection: 'column', gap: '0.8em', }}>
          {/* Each paragraph's first line starts on the page grid's second column */}
          {TEXT.map((p, i) => (
            <span key={i} style={{ textIndent: isMobile ? '33.333vw' : 'calc((100% - 4 * var(--gap)) / 5 + var(--gap))' }}>
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
