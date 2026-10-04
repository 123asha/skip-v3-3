import { useEffect, useRef } from 'react';
import s from './CasesPage.module.css';
import ContactForm from './ContactForm';
import { typo } from '../utils/typography';
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

export default function AboutPage({ onNavigatePolicy, onGridMode }: { onNavigatePolicy?: () => void; onGridMode?: (on: boolean) => void }) {
  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mainLenis = (window as any).__lenis;
    if (mainLenis) mainLenis.stop();
    const el = pageRef.current!;
    const stopBubble = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener('wheel', stopBubble, { passive: true });
    return () => { el.removeEventListener('wheel', stopBubble); if (mainLenis) mainLenis.start(); };
  }, []);
  return (
    <div className={s.page} ref={pageRef} style={{
      // Dark page: the colour tokens flipped for everything inside
      background: '#0d0d0d',
      ['--c-bg' as string]: '#0d0d0d', ['--c-text' as string]: '#f2f2f2',
      ['--c-surface' as string]: '#1c1c1c', ['--c-border' as string]: '#2e2e2e',
      ['--c-text-muted' as string]: '#7c7c7c',
    } as React.CSSProperties}>
      <div className={s.body} style={{ paddingTop: 'var(--inner-content-top)', paddingLeft: 'var(--pad)', paddingRight: 'var(--pad)', paddingBottom: 0 }}>
        <h1 style={{ ...H1, display: 'flex', flexDirection: 'column', gap: '0.6em' }}>
          {TEXT.map((p, i) => <span key={i}>{typo(t(p))}</span>)}
        </h1>
        <ContactForm onNavigatePolicy={onNavigatePolicy} onGridMode={onGridMode} />
      </div>
    </div>
  );
}
