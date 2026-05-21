import { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { sections } from './ScrollHero';
import VisualSystemsBoard from './VisualSystemsBoard';
import VisualSystemsCards from './VisualSystemsCards';

const PX_SLIDE = 800;
const SLIDES = 3;

const HEADLINE_LINES = [
  'Визуальные системы,',
  'в которых бренд держит',
  'форму при росте',
];

export default function Index2Page() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollPx, setScrollPx] = useState(0);

  useEffect(() => {
    const mainLenis = (window as any).__lenis;
    if (mainLenis) mainLenis.stop();
    const prev = document.documentElement.style.overflowY;
    document.documentElement.style.overflowY = 'hidden';

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const lenis = new Lenis({
      wrapper: containerRef.current!,
      content: contentRef.current!,
      duration: reduce ? 0 : 0.7,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: !reduce,
    });

    lenis.on('scroll', ({ scroll }: { scroll: number }) => setScrollPx(scroll));

    let rafId = 0;
    const tick = (t: number) => { lenis.raf(t); rafId = requestAnimationFrame(tick); };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      if (mainLenis) mainLenis.start();
      document.documentElement.style.overflowY = prev;
    };
  }, []);

  // gp: 0 → 3, обозначает прогресс по слайдам
  const gp = Math.min(SLIDES, scrollPx / PX_SLIDE);
  const totalScrollH = PX_SLIDE * SLIDES + (typeof window !== 'undefined' ? window.innerHeight : 800);

  // Положение центральной панели по X (в % от ширины viewport)
  // gp=0: панель на левой стороне (-25%)
  // gp=1: панель в центре (0%)
  // gp=2: панель уходит вправо (+30%) — раскрывается слайд 3
  let panelTx = 0;
  if (gp <= 1) panelTx = -25 + 25 * gp;             // -25% → 0%
  else if (gp <= 2) panelTx = 0 + 35 * (gp - 1);     // 0% → 35%
  else panelTx = 35;

  // Видео-слайд (1) видим в gp [0,1], постепенно уходит
  const slide1Opacity = gp < 1 ? 1 : gp < 1.3 ? 1 - (gp - 1) / 0.3 : 0;
  // Visual Systems (2) появляется в gp ~ 0.8, виден до ~2
  const slide2Opacity = gp < 0.8 ? 0 : gp < 1 ? (gp - 0.8) / 0.2 : gp < 1.9 ? 1 : gp < 2.1 ? 1 - (gp - 1.9) / 0.2 : 0;
  // Slide 3 раскрывается с gp ~ 1.8
  const slide3Opacity = gp < 1.8 ? 0 : gp < 2.1 ? (gp - 1.8) / 0.3 : 1;

  // Карточки на фоне видимы во время slide 2
  const cardsVisible = gp > 0.9 && gp < 2.1;

  // Подсветка табов снизу
  const labelActive = (i: number) => {
    if (gp >= i + 0.5) return 1;          // полностью «зажжён»
    if (gp >= i) return 0.7 + (gp - i) * 0.6; // плавно загорается
    return 0.3;                            // ждёт
  };
  const labelX = (i: number) => {
    // Каждая следующая «выезжает» слева
    if (gp >= i) return 0;
    if (gp >= i - 0.5) return (i - gp) * 40;
    return 40;
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--c-bg)',
        overflow: 'hidden',
        zIndex: 160,
        animation: 'pageIn 0.35s 0.05s ease both',
      }}
    >
      <div ref={contentRef} style={{ height: totalScrollH }}>
        <div style={{
          position: 'sticky',
          top: 0,
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
        }}>
          {/* Карточки на фоне для слайда «Визуальные системы» */}
          <VisualSystemsCards visible={cardsVisible} />

          {/* Headline */}
          <p
            style={{
              position: 'absolute',
              left: 'calc(var(--pad) - 3px)',
              top: 'calc(var(--pad) + var(--text-size) * var(--text-lh) + 20px)',
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--heading-size)',
              fontWeight: 'var(--heading-weight)' as React.CSSProperties['fontWeight'],
              lineHeight: 'var(--heading-lh)',
              letterSpacing: 'var(--heading-ls)',
              width: '38%',
              margin: 0,
              whiteSpace: 'pre-line',
            }}
          >
            {HEADLINE_LINES.join('\n')}
          </p>

          {/* Полоса по центру (статичная) */}
          <div style={{
            position: 'absolute',
            left: 'var(--pad)',
            right: 'var(--pad)',
            top: '50%',
            height: 1,
            background: 'rgba(0, 0, 0, 0.1)',
            pointerEvents: 'none',
          }} />

          {/* Центральная панель: горизонтально сдвигается по скроллу */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 720,
            height: 405,
            marginLeft: -360,
            marginTop: -202,
            transform: `translateX(${panelTx}%)`,
            transition: 'transform 0.05s linear',
            overflow: 'hidden',
            background: '#f6f6f6',
          }}>
            {/* Слой 1: видео */}
            <div style={{ position: 'absolute', inset: 0, opacity: slide1Opacity, transition: 'opacity 0.3s ease' }}>
              <video autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}>
                <source src="/video.mp4" type="video/mp4" />
              </video>
            </div>
            {/* Слой 2: VisualSystemsBoard */}
            <div style={{ position: 'absolute', inset: 0, opacity: slide2Opacity, transition: 'opacity 0.3s ease' }}>
              <VisualSystemsBoard />
            </div>
            {/* Слой 3: третий контент */}
            <div style={{ position: 'absolute', inset: 0, opacity: slide3Opacity, transition: 'opacity 0.3s ease', background: '#000' }}>
              <video autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}>
                <source src="/video.mp4" type="video/mp4" />
              </video>
            </div>
          </div>

          {/* Табы снизу — горизонтально, тянутся слева направо */}
          <div style={{
            position: 'absolute',
            left: 'var(--pad)',
            right: 'var(--pad)',
            bottom: 'var(--pad)',
            display: 'flex',
            gap: 40,
            alignItems: 'flex-end',
          }}>
            {sections.map((sec, i) => {
              const opacity = labelActive(i);
              const tx = labelX(i);
              return (
                <div
                  key={sec.id}
                  style={{
                    flex: 1,
                    opacity,
                    transform: `translateX(${tx}px)`,
                    transition: 'opacity 0.4s ease, transform 0.4s ease',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    gap: 6,
                    alignItems: 'baseline',
                    marginBottom: 8,
                    fontFamily: 'var(--font)',
                    fontSize: 'var(--text-size)',
                    lineHeight: 'var(--text-lh)',
                    letterSpacing: 'var(--text-ls)',
                  }}>
                    <span>{sec.number}</span>
                    <span style={{ whiteSpace: 'pre-line', fontFamily: 'var(--font-display)', fontSize: 'var(--heading-size)', fontWeight: 'var(--heading-weight)' as React.CSSProperties['fontWeight'], lineHeight: 'var(--heading-lh)', letterSpacing: 'var(--heading-ls)' }}>
                      {sec.title}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    fontFamily: 'var(--font)',
                    fontSize: 'var(--text-size)',
                    lineHeight: 'var(--text-lh)',
                    letterSpacing: 'var(--text-ls)',
                  }}>
                    {sec.details.map(d => <p key={d} style={{ margin: 0 }}>{d}</p>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
