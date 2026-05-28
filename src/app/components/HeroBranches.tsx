import { asset } from '../utils/asset';

/*
 * Mobile-only scroll slider — three full-screen image slides stacked in
 * document flow (each 100vh). Title + "Перейти →" hint stack at the top of
 * each slide. Whole slide is one big <button> → navigates to /services.
 *
 * Native lazy loading keeps initial paint cheap. First slide is eager.
 */

const BRANCHES = [
  { name: 'Стратегия', image: asset('/1bg.webp') },
  { name: 'Брендинг',  image: asset('/2bg.webp') },
  { name: 'Диджитал',  image: asset('/3bg.webp') },
];

export default function HeroBranches({
  onNavigateExpertiza,
}: {
  onNavigateExpertiza?: (anchor?: string) => void;
}) {
  return (
    <section style={{ position: 'relative' }}>
      {BRANCHES.map((b, i) => (
        <button
          key={b.name}
          onClick={() => onNavigateExpertiza?.()}
          aria-label={`Перейти к разделу «${b.name}»`}
          style={{
            position: 'relative',
            display: 'block',
            height: '100vh',
            width: '100%',
            padding: 0,
            margin: 0,
            border: 'none',
            background: 'var(--c-surface)',
            cursor: 'pointer',
            overflow: 'hidden',
            color: '#fff',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          <img
            src={b.image}
            alt=""
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              pointerEvents: 'none',
            }}
          />

          {/* Title + "Перейти →" stacked, top-left */}
          <div
            style={{
              position: 'absolute',
              left: 'var(--pad)',
              top: 'var(--pad)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              color: '#fff',
              mixBlendMode: 'difference',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--heading-size)',
                fontWeight: 'var(--heading-weight)' as React.CSSProperties['fontWeight'],
                lineHeight: 'var(--heading-lh)',
                letterSpacing: 'var(--heading-ls)',
              }}
            >
              {b.name}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-size)',
                lineHeight: 'var(--text-lh)',
                letterSpacing: 'var(--text-ls)',
                textDecoration: 'underline',
                textDecorationStyle: 'dotted',
                textUnderlineOffset: '3px',
              }}
            >
              Перейти →
            </span>
          </div>
        </button>
      ))}
    </section>
  );
}
