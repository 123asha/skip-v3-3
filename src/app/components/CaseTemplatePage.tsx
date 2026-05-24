import { useEffect, useRef } from 'react';
import s from './CasesPage.module.css';
import { TEXT_STYLE as textStyle } from '../utils/typography';
import ContactForm from './ContactForm';
import { CASE_AR_H, CASE_AR_V } from './CaseCard';

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--heading-size)',
  fontWeight: 'var(--heading-weight)' as React.CSSProperties['fontWeight'],
  lineHeight: 'var(--heading-lh)',
  letterSpacing: 'var(--heading-ls)',
  color: 'var(--c-text)',
};

const TEAM = ['Аша Саакян', 'Рузана Пшигонова', 'Кирилл Жуков', 'Елена Новикова'];

function ImagePlaceholder({ aspectRatio, style }: { aspectRatio: string; style?: React.CSSProperties }) {
  return (
    <div style={{ aspectRatio, background: 'var(--c-surface)', width: '100%', ...style }} />
  );
}

export default function CaseTemplatePage({ onNavigatePolicy, onGridMode }: { onNavigatePolicy?: () => void; onGridMode?: (on: boolean) => void }) {
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
    <div
      ref={pageRef}
      className={s.page}
    >
      <h1 className={s.title}>Название проекта</h1>

      <div>
        <div style={{ paddingTop: 140, paddingLeft: 'var(--pad)', paddingRight: 'var(--pad)' }}>

          {/* ── Block 1: horizontal image ── */}
          <div style={{ marginTop: 40 }}>
            <ImagePlaceholder aspectRatio={CASE_AR_H} />
          </div>

          {/* Block 1 description — last 2 cols */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 'var(--gap)',
            marginTop: 20,
          }}>
            <div style={{ gridColumn: '4 / 6' }}>
              <p style={textStyle}>
                Краткое описание проекта и ключевых задач. Что было сделано, каких результатов достигли.
              </p>
            </div>
          </div>

          {/* ── Block 2: two vertical images ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 80 }}>
            <ImagePlaceholder aspectRatio={CASE_AR_V} />
            <ImagePlaceholder aspectRatio={CASE_AR_V} />
          </div>

          {/* Block 2 description — last 2 cols */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 'var(--gap)',
            marginTop: 20,
          }}>
            <div style={{ gridColumn: '4 / 6' }}>
              <p style={textStyle}>
                Описание деталей визуального решения и подхода к разработке дизайн-системы.
              </p>
            </div>
          </div>

          {/* ── Next case ── */}
          <div style={{ marginTop: 80 }}>
            <p style={{ ...textStyle, opacity: 0.4, marginBottom: 20 }}>Следующий кейс</p>
            <a
              href="#"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                aspectRatio: CASE_AR_H,
                background: 'var(--c-surface)',
                textDecoration: 'none',
                overflow: 'hidden',
                maxWidth: 'calc((100% - var(--gap) * 4) / 5 * 2 + var(--gap))',
              }}
            >
              <div style={{ padding: '20px 20px 0' }}>
                <p style={textStyle}>Название следующего кейса</p>
              </div>
              <div style={{ padding: '0 20px 20px' }}>
                <p style={{ ...textStyle, textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' }}>Перейти</p>
              </div>
            </a>
          </div>

          {/* ── Credits ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 'var(--gap)',
            marginTop: 80,
          }}>
            <div style={{ gridColumn: '4 / 5', display: 'flex', flexDirection: 'column', gap: 0 }}>
              <p style={{ ...textStyle, marginBottom: 16 }}>Над проектом работали:</p>
              {TEAM.map((name, i) => (
                <p key={i} style={headingStyle}>{name}</p>
              ))}
            </div>
          </div>

        </div>
      </div>

      <ContactForm onNavigatePolicy={onNavigatePolicy} onGridMode={onGridMode} />
    </div>
  );
}
