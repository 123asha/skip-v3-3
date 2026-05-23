import { useEffect, useRef } from 'react';
import s from './CasesPage.module.css';
import { MediaSection } from './MediaSection';
import ContactForm from './ContactForm';
import { TEXT_STYLE as ts } from '../utils/typography';

export default function LabPage({
  onNavigatePolicy,
  onGridMode,
}: {
  onNavigatePolicy?: () => void;
  onGridMode?: (on: boolean) => void;
}) {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mainLenis = (window as any).__lenis;
    if (mainLenis) mainLenis.stop();
    const el = pageRef.current!;
    const stopBubble = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener('wheel', stopBubble, { passive: true });
    return () => {
      el.removeEventListener('wheel', stopBubble);
      if (mainLenis) mainLenis.start();
    };
  }, []);

  return (
    <div className={s.page} ref={pageRef}>
      <h1 className={s.title}>skip design</h1>
      <div className={s.body} style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 0 }}>

        {/* Team cards — three equal-width columns across the full container,
            20px gap between them. Each card keeps its own aspect ratio:
            1) horizontal 16/9 — Аша
            2) vertical 5/6   — Рузана
            3) vertical 5/6   — placeholder */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
            marginBottom: 120,
            alignItems: 'start',
          }}
        >
          {[
            { name: 'Аша Саакян',       role: 'Основатель\nАрт-директор', ar: '16/9' },
            { name: 'Рузана Пшигонова', role: 'Со-основатель\nCOO',       ar: '5/6'  },
            { name: 'Михаил Орлов',     role: 'Senior дизайнер',          ar: '5/6'  },
          ].map(member => (
            <div
              key={member.name}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <div style={{ aspectRatio: member.ar, background: 'var(--c-surface)', width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
                <p style={{ ...ts, margin: 0 }}>{member.name}</p>
                <p style={{ ...ts, margin: 0, textAlign: 'right', whiteSpace: 'pre-line' }}>{member.role}</p>
              </div>
            </div>
          ))}
        </div>

        {/* People block — two portrait cards (1 col wide each) with a centred
            paragraph between. Photos are gray placeholders for now. Captions
            use the project's default text style (no new styles introduced). */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 'var(--gap)',
            marginBottom: 200,
            alignItems: 'start',
          }}
        >
          {/* Left portrait — col 1 */}
          <div style={{ gridColumn: '1 / 2', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ aspectRatio: '4/5', background: 'var(--c-surface)', width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
              <p style={{ ...ts, margin: 0 }}>Анна Морозова</p>
              <p style={{ ...ts, margin: 0, textAlign: 'right' }}>
                опыт<br />8 лет
              </p>
            </div>
          </div>

          {/* Centred paragraph — col 3 */}
          <div
            style={{
              gridColumn: '3 / 4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: '100%',
            }}
          >
            <p style={{ ...ts, margin: 0, textAlign: 'center' }}>
              Skip&nbsp;Design&nbsp;— команда, которая превращает индивидуальность в устойчивый системный бренд.
            </p>
          </div>

          {/* Right portrait — col 5 */}
          <div style={{ gridColumn: '5 / 6', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ aspectRatio: '4/5', background: 'var(--c-surface)', width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
              <p style={{ ...ts, margin: 0 }}>Дмитрий Соколов</p>
              <p style={{ ...ts, margin: 0, textAlign: 'right' }}>
                опыт<br />10 лет
              </p>
            </div>
          </div>
        </div>

        <MediaSection />
        <ContactForm onNavigatePolicy={onNavigatePolicy} onGridMode={onGridMode} />
      </div>
    </div>
  );
}
