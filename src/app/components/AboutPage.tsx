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
  'Дизайн, как правила игры.',
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
  // The text comes in line by line as the page scrolls: a line rises into
  // place when it reaches the lower part of the screen, and sinks away again
  // when scrolled back below it
  const textRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const page = pageRef.current!;
    const words = Array.from(textRef.current!.querySelectorAll<HTMLElement>('[data-w]'));
    let lines: { els: HTMLElement[]; on: boolean }[] = [];
    const build = () => {
      const byTop = new Map<number, HTMLElement[]>();
      words.forEach(w => { const t = Math.round(w.offsetTop / 4); (byTop.get(t) ?? byTop.set(t, []).get(t)!).push(w); });
      lines = [...byTop.entries()].sort((a, b) => a[0] - b[0]).map(([, els]) => ({ els, on: false }));
      gsap.set(words, { yPercent: 70, opacity: 0 });
      check();
    };
    const check = () => {
      const edge = window.innerHeight * 0.88;
      lines.forEach(l => {
        const top = l.els[0].getBoundingClientRect().top - (parseFloat(String(gsap.getProperty(l.els[0], 'yPercent'))) || 0) * 0.01 * l.els[0].offsetHeight;
        const want = top < edge;
        if (want === l.on) return;
        l.on = want;
        gsap.killTweensOf(l.els);
        gsap.to(l.els, want
          ? { yPercent: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.015 }
          : { yPercent: 70, opacity: 0, duration: 0.35, ease: 'power2.in' });
      });
    };
    build();
    page.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', build);
    return () => { page.removeEventListener('scroll', check); window.removeEventListener('resize', build); };
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
      { at: i => ({ x: 0.06 + i * 0.88 / (N - 1), y: 0.5 + 0.22 * Math.sin(i * 0.9) }), edges: Array.from({ length: N - 1 }, (_, i) => [i, i + 1] as [number, number]) },
      { at: i => i === 0 ? { x: 0.5, y: 0.5 } : { x: 0.5 + 0.38 * Math.cos((i - 1) / (N - 1) * 6.283), y: 0.5 + 0.38 * Math.sin((i - 1) / (N - 1) * 6.283) }, edges: Array.from({ length: N - 1 }, (_, i) => [0, i + 1] as [number, number]) },
      { at: i => ({ x: 0.2 + (i % 4) * 0.2, y: 0.25 + Math.floor(i / 4) * 0.25 }), edges: [[0,1],[1,2],[2,3],[4,5],[5,6],[6,7],[8,9],[0,4],[4,8],[1,5],[5,9],[2,6],[3,7]] },
      { at: i => ({ x: 0.3 + 0.4 * (i % 2) + 0.05 * Math.sin(i), y: 0.1 + i * 0.8 / (N - 1) }), edges: Array.from({ length: N - 2 }, (_, i) => [i, i + 2] as [number, number]).concat([[0, 1], [N - 2, N - 1]]) },
    ];
    const size = () => {
      dpr = window.devicePixelRatio || 1; W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; R = Math.max(30, Math.min(W * 0.05, H * 0.09));
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
      pts.forEach((p, i) => {
        // A matte ping-pong ball in a tone near the page's: soft, diffuse light
        // from the upper left, no gloss and no hard highlight, the far side
        // sinking gently into shade
        const g = ctx.createRadialGradient(p.x - R * 0.3, p.y - R * 0.35, R * 0.1, p.x, p.y, R * 1.1);
        g.addColorStop(0, '#1d1d1d'); g.addColorStop(0.55, '#171717'); g.addColorStop(1, '#101010');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, Math.PI * 2); ctx.fill();
        const soft = ctx.createRadialGradient(p.x - R * 0.35, p.y - R * 0.4, 0, p.x - R * 0.35, p.y - R * 0.4, R * 0.9);
        soft.addColorStop(0, 'rgba(255,255,255,0.045)'); soft.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = soft; ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, Math.PI * 2); ctx.fill();
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
        
        <h1 ref={textRef} style={{ ...H1, display: 'flex', flexDirection: 'column', gap: '0.2em',
          // Desktop: the text sits on page columns 2–3
          ...(isMobile ? null : { marginLeft: 'calc((100% - 4 * var(--gap)) / 5 + var(--gap))', width: 'calc((100% - 4 * var(--gap)) / 5 * 2 + var(--gap))' }) }}>
          {/* Phone: each paragraph's first line starts a third in */}
          {TEXT.map((p, i) => (
            <span key={i} style={{ textIndent: isMobile ? '33.333vw' : 0 }}>
              {typo(t(p)).split(' ').map((w, k) => <span key={k}><span data-w="" style={{ display: 'inline-block', textIndent: 0 }}>{w}</span>{' '}</span>)}
            </span>
          ))}
        </h1>
        {/* «Наши услуги» on the third column, the list on the fourth */}
        <div style={{
          marginTop: 'var(--space-xl)',
          display: 'grid', columnGap: 'var(--gap)',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, minmax(0, 1fr))',
        }}>
          <h2 style={{ ...TEXT_STYLE, margin: 0, gridColumn: isMobile ? 'auto' : '3 / 4' }}>{t('Наши услуги')}</h2>
          <div style={{ gridColumn: isMobile ? 'auto' : '4 / 6', marginTop: isMobile ? 20 : 0 }}>
            {SERVICES.map(c => (
              <div key={c.category} style={{ marginBottom: 20 }}>
                <p style={{ ...TEXT_STYLE, margin: 0 }}>{t(c.category)}</p>
                <div style={{ paddingLeft: 20, marginTop: 6 }}>
                  {c.items.map(it => <p key={it.text} style={{ ...TEXT_STYLE, margin: 0 }}>{t(it.text)}</p>)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <ContactForm noInvert onNavigatePolicy={onNavigatePolicy} onGridMode={onGridMode} />
      </div>
    </div>
  );
}
