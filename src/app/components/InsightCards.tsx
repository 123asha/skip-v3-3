import { createPortal } from 'react-dom';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useMobile } from '../hooks/useMobile';
import { usePinchSteps } from '../hooks/usePinchSteps';
import { asset } from '../utils/asset';
import { typo } from '../utils/typography';
import { INSIGHTS_LIST } from './MediaSection';
import cs from './CaseCard.module.css';

// Same density steps as the cases grid: 3 columns (biggest, default) down to
// 6 (densest). Zoom level rises toward the biggest cards, like the cases page.
const ZOOM_MIN = 0, ZOOM_MAX = 3;
const COLS_AT = [6, 5, 4, 3]; // index = zoom level

// Stand-in pictures until each article has its own — cycled over the cards
const PICS = [
  '/preview-phone.webp', '/preview-pocket.avif', '/preview-ultra.webp', '/preview-keys.jpg',
  '/preview-app.jpg', '/preview-storefront.webp', '/preview-coffee.webp', '/preview-stickers.webp',
].map(asset);

/**
 * Insights page: the articles as a grid of round cards above the table — like
 * the cases grid, but every preview a circle. Cards rise in as they scroll into
 * view, and the picture inside each circle drifts against its frame as the
 * page moves (a light parallax). The date sits centred, grey, above the ring;
 * the caption underneath only shows on hover, also centred.
 */
export function InsightCards() {
  const isMobile = useMobile();
  const gridRef = useRef<HTMLDivElement>(null);
  // Density control — same ⊕ ⊖ / pinch / ⌘± pattern as the cases grid.
  const [zoom, setZoomRaw] = useState(2); // default: 4 columns
  // Every zoom change first notes where each card sits, so the re-laid grid
  // can glide cards from their old spot and size into the new ones (FLIP).
  const flipRef = useRef<Map<string, DOMRect> | null>(null);
  const setZoom = (next: (z: number) => number) => {
    const cards = gridRef.current?.querySelectorAll<HTMLElement>('[data-insight-card]');
    if (cards?.length) flipRef.current = new Map([...cards].map(el => [el.dataset.id ?? '', el.getBoundingClientRect()]));
    setZoomRaw(next);
  };
  const bigger = () => setZoom(z => Math.min(ZOOM_MAX, z + 1));
  const denser = () => setZoom(z => Math.max(ZOOM_MIN, z - 1));
  usePinchSteps(bigger, denser, !isMobile);
  useEffect(() => {
    if (isMobile) return;
    const onKey = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;
      if (e.key === '-') { e.preventDefault(); denser(); }
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); bigger(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobile]);
  const cols = isMobile ? 2 : COLS_AT[zoom];

  // Rise in from below, each once — the cards already on screen stay put
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cards = Array.from(grid.children) as HTMLElement[];
    const below = cards.filter(c => c.getBoundingClientRect().top >= window.innerHeight);
    // Load parallax: each picture settles inside its circle as the card
    // appears (separate `translate`, so the scroll parallax on `transform`
    // keeps working on top of it)
    const settle = (els: HTMLElement[]) => gsap.fromTo(
      els.map(c => c.querySelector<HTMLElement>('[data-parallax]')).filter(Boolean),
      { translate: '0 3%' },
      { translate: '0 0%', duration: 0.6, ease: 'power1.out', stagger: 0.03 },
    );
    // Starts at once, alongside the rise-in — no separate delay to wait out
    settle(cards.filter(c => !below.includes(c)));
    gsap.set(below.map(c => c.firstElementChild), { opacity: 0, y: 60 });
    const io = new IntersectionObserver(entries => {
      const incoming = entries.filter(e => e.isIntersecting).map(e => e.target as HTMLElement);
      incoming.forEach(el => io.unobserve(el));
      gsap.to(incoming.map(el => el.firstElementChild), { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 });
      settle(incoming);
    }, { rootMargin: '0px 0px -8% 0px' });
    below.forEach(c => io.observe(c));
    return () => io.disconnect();
  }, []);

  // Zoom change: each card glides from where it was, at its old size, into
  // its new place (same as the cases page's density control).
  useLayoutEffect(() => {
    const prev = flipRef.current;
    flipRef.current = null;
    if (!prev) return;
    const pz = parseFloat(document.documentElement.style.zoom || '1') || 1;
    gridRef.current?.querySelectorAll<HTMLElement>('[data-insight-card]').forEach(el => {
      const was = prev.get(el.dataset.id ?? '');
      gsap.killTweensOf(el);
      if (!was) return;
      const now = el.getBoundingClientRect();
      gsap.fromTo(el,
        { x: (was.left - now.left) / pz, y: (was.top - now.top) / pz, scale: was.width / now.width, transformOrigin: '0 0' },
        { x: 0, y: 0, scale: 1, duration: 0.7, ease: 'power3.inOut', clearProps: 'transform' },
      );
    });
  }, [zoom]);

  // Parallax: the picture is larger than its circle and slides against it
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const pics = Array.from(grid.querySelectorAll<HTMLElement>('[data-parallax]'));
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      pics.forEach(img => {
        const r = img.parentElement!.getBoundingClientRect();
        const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
        img.style.transform = `translate3d(0, ${(p * 26).toFixed(2)}%, 0)`;
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Hovering an insight (while not scrolling) turns every other preview into
  // a plain grey circle — same 5s-dwell behaviour as the cases grid.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    let scrolling = false, t = 0, dwell = 0;
    let hot: HTMLElement | null = null;
    const apply = () => {
      clearTimeout(dwell);
      delete grid.dataset.focus;
      if (!hot || scrolling) return;
      const card = hot;
      dwell = window.setTimeout(() => {
        if (hot === card && !scrolling) { grid.dataset.focus = ''; card.dataset.hot = ''; }
      }, 5000);
    };
    const onOver = (e: MouseEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('[data-insight-card]');
      if (card === hot) return;
      if (hot) delete hot.dataset.hot;
      hot = card;
      apply();
    };
    const onLeave = () => { if (hot) delete hot.dataset.hot; hot = null; apply(); };
    const onScroll = () => {
      scrolling = true; apply();
      clearTimeout(t);
      t = window.setTimeout(() => { scrolling = false; apply(); }, 180);
    };
    grid.addEventListener('mouseover', onOver);
    grid.addEventListener('mouseleave', onLeave);
    // Capture phase — catches scroll on the inner `.page` scroller too
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => {
      grid.removeEventListener('mouseover', onOver);
      grid.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('scroll', onScroll, { capture: true });
      clearTimeout(t);
      clearTimeout(dwell);
    };
  }, []);

  return (
    <>
    {/* Portalled: stays fixed while the page slides out */}
    {!isMobile && createPortal(
      <div className="zoomPill" style={{
        position: 'fixed', top: 'calc(var(--logo-top) + 6px)', left: 'calc(var(--pad) + 3 * ((100% - var(--page-sb, 0px) - 2 * var(--pad) - 4 * var(--gap)) / 5 + var(--gap)))', zIndex: 200,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontFamily: 'var(--font)', fontSize: 'var(--text-size)', lineHeight: 'var(--text-lh)',
      }}>
        <span style={{ marginRight: 6 }}>⌘</span>
        <button disabled={zoom <= ZOOM_MIN} onClick={denser} aria-label="Плотнее" style={{ font: 'inherit', color: 'inherit', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>⊖</button>
        <button disabled={zoom >= ZOOM_MAX} onClick={bigger} aria-label="Крупнее" style={{ font: 'inherit', color: 'inherit', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>⊕</button>
      </div>, document.body
    )}
    <div
      ref={gridRef}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        columnGap: 'var(--gap)',
        rowGap: isMobile ? 40 : 80,
        alignItems: 'start',
        marginBottom: 'var(--space-xl)',
      }}
    >
      {INSIGHTS_LIST.map((it, i) => (
        <a
          key={it.href ?? i}
          data-insight-card=""
          data-id={it.href ?? String(i)}
          href={it.href}
          target="_blank"
          rel="noopener noreferrer"
          className="insightCard"
          onMouseEnter={e => { e.currentTarget.querySelector('video')?.play().catch(() => {}); }}
          onMouseLeave={e => { e.currentTarget.querySelector('video')?.pause(); }}
          style={{ display: 'block', color: 'inherit', textDecoration: 'none', textAlign: 'center' }}
        >
          <div>
            <p className={cs.cardMetaText} style={{ margin: '0 0 10px', textAlign: 'center', opacity: 'var(--opacity-muted)' as any }}>{it.shown}</p>
            <div style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: '50%', overflow: 'hidden', background: 'var(--c-surface)' }}>
              {i === 0 ? (
                // First insight: a looping clip instead of a still — it plays
                // only while the card is hovered
                <video
                  data-parallax=""
                  src={asset('/brand-balls.mp4')}
                  muted loop playsInline preload="auto"
                  style={{ position: 'absolute', left: '-30%', top: '-30%', width: '160%', height: '160%', objectFit: 'cover', willChange: 'transform' }}
                />
              ) : (
                <img
                  data-parallax=""
                  src={PICS[i % PICS.length]}
                  alt=""
                  loading="lazy"
                  style={{ position: 'absolute', left: '-30%', top: '-30%', width: '160%', height: '160%', objectFit: 'cover', willChange: 'transform' }}
                />
              )}
            </div>
            <p className={`${cs.cardMetaText} insightCardCaption`} style={{ margin: '10px auto 0', maxWidth: 'calc((100vw - var(--page-sb, 0px) - 2 * var(--pad) - 4 * var(--gap)) / 5)', textAlign: 'center', transition: 'opacity 0.25s ease' }}>
              {typo(it.desc)}
            </p>
          </div>
        </a>
      ))}
    </div>
    </>
  );
}
