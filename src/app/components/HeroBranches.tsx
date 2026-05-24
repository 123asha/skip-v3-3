import { useEffect, useRef, useState } from 'react';
import { TEXT_STYLE as ts } from '../utils/typography';
import { asset } from '../utils/asset';

/*
 * Dulcedo-style scroll slider — three full-screen background images stacked
 * in document flow (each one 100vh tall). The previous card naturally rises
 * out of the top as the next enters from the bottom — both move together
 * with the page scroll.
 *
 * A small "case-info" rectangle (matching the cube in ScrollHero) is pinned
 * at the centre of the viewport via `position: sticky` and updates its text
 * in lockstep with the currently visible card. The rectangle is reused
 * across the section so the visual feels continuous with the hero — the
 * panel shrinks into this bar at the end of the video, and the bar stays
 * put as the user scrolls through the three background images.
 */

type Branch = {
  name: string;
  href: string;
  image: string;
};

const BRANCHES: Branch[] = [
  { name: 'Стратегия', href: '#', image: asset('/2bg.webp') },
  { name: 'Брендинг',  href: '#', image: asset('/1.png')  },
  { name: 'Диджитал',  href: '#', image: asset('/3bg.webp') },
];

export default function HeroBranches() {
  const [activeIdx, setActiveIdx] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Track which card is most visible to drive the central rectangle text.
  useEffect(() => {
    const els = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!els.length) return;
    const visible = new Map<HTMLDivElement, number>();
    const obs = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          visible.set(e.target as HTMLDivElement, e.intersectionRatio);
        }
        // Pick the card with the largest intersection ratio
        let bestIdx = 0;
        let bestRatio = -1;
        els.forEach((el, i) => {
          const ratio = visible.get(el) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIdx = i;
          }
        });
        setActiveIdx(bestIdx);
      },
      { threshold: [0.25, 0.5, 0.75, 1] },
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section style={{ position: 'relative' }}>
      {/* Sticky rectangle overlay — pinned at viewport centre, no flow space. */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          marginBottom: '-100vh',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(220px, 18vw, 320px)',
            height: 56,
            background: '#e8e8e8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            gap: 20,
            pointerEvents: 'auto',
          }}
        >
          <span
            style={{
              ...ts,
              color: 'var(--c-text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              flex: 1,
              minWidth: 0,
            }}
          >
            {BRANCHES[activeIdx].name}
          </span>
          <a
            href={BRANCHES[activeIdx].href}
            style={{
              ...ts,
              color: 'var(--c-text)',
              textDecoration: 'underline',
              textDecorationStyle: 'dotted',
              textUnderlineOffset: '3px',
              whiteSpace: 'nowrap',
            }}
          >
            Перейти
          </a>
        </div>
      </div>

      {/* 3 background cards in flow — each 100vh, just the image. */}
      {BRANCHES.map((b, i) => (
        <div
          key={b.name}
          ref={el => { cardRefs.current[i] = el; }}
          style={{
            position: 'relative',
            height: '100vh',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <img
            src={b.image}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>
      ))}
    </section>
  );
}
