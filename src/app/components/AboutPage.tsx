import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import s from './CasesPage.module.css';
import ContactForm from './ContactForm';
import { typo, TEXT_STYLE, H2_STYLE } from '../utils/typography';
import { SERVICES } from './ExpertiseSection2';
import { t } from '../i18n';

// /about-skip-design — the old site's «Инфо» text, copied as is for now, all
// of it in the home headline's style. Not in the menu yet.
const PARTS: { title: string; paras: string[] }[] = [
  {
    title: 'Skip Design',
    paras: [
      'Дизайн, как правила игры.',
      'Верим, что простота — не про упрощение, а смелость скипнуть лишнее, что мешает проявиться сути.',
    ],
  },
  {
    title: 'Философия',
    paras: [
      'Дизайн здравого смысла — это когда всё подчиняется логике формы. А значит — идее. В древних языках «форма», «слово» и «звук» были связаны между собой. Говорить — значит придавать форму, а форма смысла — дизайн.',
      'Мы любим, когда проект не кричит, а держит форму. И слово.',
    ],
  },
  {
    title: 'Подход',
    paras: [
      'Skip Design — команда стратегов, дизайнеров и менеджеров. Мы верим в хард-скиллы, опыт и индивидуальность каждого специалиста. Это значит, что каждый делает свои задачи по-своему, но с ответственностью за общий результат.',
      'Один из наших принципов — привносить в работу лёгкость, юмор и отступать от шаблонов, если так получится лучший результат.',
      'Любим структуру и уважаем ясность. Поэтому делаем так, чтобы случился мэтч у всех, кто вовлечён в проект:',
      '⭆ клиентам — понятно, каким будет процесс и результат.',
      '⤷ пользователям — удобно и приятно взаимодействовать с продуктом или брендом.',
      '⧉ разработчикам — не приходится тратить время, чтобы разобраться в логике макетов.',
      '※ команде — не стыдно за результат, и хочется им поделиться.',
      'Результат, к которому мы стремимся — это когда сайт, интерфейс, бренд выглядят так, как будто по-другому и быть не могло. Когда без слов понятно, что проект сделан с вниманием к деталям и в точку.',
    ],
  },
];
// For now the page keeps only the last part («Подход» — the principles)
const SHOWN = PARTS.slice(2);
const TEXT = SHOWN.flatMap(x => x.paras);
// Half a page column: the paragraphs' first-line indent
const COLUMN = 'calc((100vw - var(--page-sb, 0px) - 2 * var(--pad) - 4 * var(--gap)) / 10)';

const DARK: Record<string, string> = {
  '--c-bg': '#0d0d0d', '--c-text': '#f2f2f2', '--c-surface': '#1c1c1c',
  '--c-border': '#2e2e2e', '--c-text-muted': '#7c7c7c', '--c-button': '#2a2a2a',
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
    root.setAttribute('data-dark', '');
    // Only our own properties go back — the app sets html's scroll lock itself
    return () => { Object.keys(DARK).forEach(k => root.style.removeProperty(k)); document.body.style.background = ''; root.removeAttribute('data-dark'); };
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
      // Lines are told apart by column and top; the left column reads first
      const byLine = new Map<number, HTMLElement[]>();
      words.forEach(w => {
        const para = w.closest('[data-p]') as HTMLElement;
        const box = para.parentElement as HTMLElement;
        const col = window.innerWidth > 768 ? (w.getBoundingClientRect().left - box.getBoundingClientRect().left > box.clientWidth / 2 ? 1 : 0) : 0;
        const key = Number(para.dataset.p) * 100000 + col * 50000 + Math.round(w.offsetTop / 6);
        (byLine.get(key) ?? byLine.set(key, []).get(key)!).push(w);
      });
      lines = [...byLine.entries()].sort((a, b) => a[0] - b[0]).map(([, els]) => ({ els, on: false }));
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
  const servicesRef = useRef<HTMLDivElement>(null);
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
    // Past the services list — once only about 30% of it is still in view at the top —
    // every ball drops out of the graph and settles in a row along the bottom;
    // scrolling back up, they rise into the formation again
    const vel = pts.map(() => ({ vy: 0, vx: 0 }));
    let fallen = false;
    const tick = () => {
      const tbl = servicesRef.current?.getBoundingClientRect();
      const shouldFall = !!tbl && tbl.height > 0 && tbl.bottom < tbl.height * 0.3;
      if (shouldFall && !fallen) {
        fallen = true;
        vel.forEach(v => { v.vy = Math.random() * 2; v.vx = (Math.random() - 0.5) * 4; });
      } else if (!shouldFall && fallen) fallen = false;
      const max = page.scrollHeight - page.clientHeight;
      const prog = max > 0 ? Math.min(1, Math.max(0, page.scrollTop / max)) : 0;
      const f = Math.min(FORMS.length - 1, Math.floor(prog * FORMS.length));
      const form = FORMS[f];
      if (fallen) {
        const slot = (i: number) => W * (0.08 + 0.84 * (i + 0.5) / N);
        pts.forEach((p, i) => {
          const v = vel[i];
          v.vy += 0.55; p.y += v.vy; p.x += v.vx; v.vx *= 0.985;
          // The row along the bottom: each ball drifts to its slot as it comes to rest
          if (p.y > H - R) { p.y = H - R; v.vy = -v.vy * 0.38; if (Math.abs(v.vy) < 1.2) v.vy = 0; v.vx += (slot(i) - p.x) * 0.012; }
          p.x = Math.max(R, Math.min(W - R, p.x));
        });
      } else pts.forEach((p, i) => {
        const q = form.at(i);
        p.x += (q.x * W - p.x) * 0.05; p.y += (q.y * H - p.y) * 0.05;
      });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.setLineDash([2, 11]);
      if (!fallen) form.edges.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke(); });
      ctx.setLineDash([]);
      // Outlines only: the links stop at the rings, the inside stays empty
      ctx.globalCompositeOperation = 'destination-out';
      pts.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1.5; ctx.setLineDash([2, 7]); ctx.lineCap = 'round';
      pts.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, Math.PI * 2); ctx.stroke(); });
      ctx.setLineDash([]);
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
        
        {/* Three parts: the text three columns wide (2–4) in H2, first lines indented
            by a column, each part's heading (plain text size) standing in that indent */}
        <div ref={textRef} style={{ ...TEXT_STYLE, margin: 0, fontWeight: 'var(--text-weight)' as React.CSSProperties['fontWeight'] }}>
          {(() => {
            let n = 0;
            return SHOWN.map(part => (
              <section key={part.title} style={{
                display: 'grid', columnGap: 'var(--gap)', marginBottom: isMobile ? 32 : 48,
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, minmax(0, 1fr))',
              }}>
                <div data-cols="" style={{ gridColumn: isMobile ? 'auto' : '2 / 5' }}>
                  {part.paras.map((p, pi) => (
                    <p key={n} data-p={n++} style={{
                      // The home headline: its size, leading and tracking (ScrollHero)
                      ...H2_STYLE, margin: 0,
                      fontSize: 'var(--hero-fs, min(var(--hero-size), 7.2vw))', lineHeight: 'var(--hero-lh, 0.8755)', letterSpacing: '-0.03em', position: 'relative', textIndent: isMobile ? '33.333vw' : COLUMN }}>
                      {/* The part's heading stands in the first paragraph's indent */}
                      {pi === 0 && <span style={{ ...TEXT_STYLE, position: 'absolute', left: 0, textIndent: 0, lineHeight: 'var(--text-lh)',
                        // Lowered so the tops of its lowercase letters meet those of the first H2 line
                        top: 'calc(var(--h2-size) * (var(--h2-lh) - 1) / 2 + 0.3 * var(--h2-size) - var(--text-size) * (var(--text-lh) - 1) / 2 - 0.3 * var(--text-size))' }}>{t(part.title)}</span>}
                      {typo(t(p)).split(' ').map((w, k) => <span key={k}><span data-w="" style={{ display: 'inline-block', textIndent: 0 }}>{w}</span>{' '}</span>)}
                    </p>
                  ))}
                </div>
              </section>
            ));
          })()}
        </div>
        {/* «Наши услуги» on the third column, the list on the fourth */}
        <div ref={servicesRef} style={{
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
