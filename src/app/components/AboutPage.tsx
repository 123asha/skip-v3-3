import { useEffect, useRef } from 'react';
import s from './CasesPage.module.css';
import ContactForm from './ContactForm';
import FlowText, { type FlowStack } from './FlowText';
import { typo, TEXT_STYLE, H2_STYLE } from '../utils/typography';
import { SERVICES } from './ExpertiseSection2';
import { t } from '../i18n';

// /about-skip-design — the studio's text, set in the home headline's style.
// Not in the menu yet.
const TEXT = [
  'Мы создаём визуальные системы для быстрорастущих компаний. Не отдельные макеты, а набор правил, по которым бренд узнаётся, развивается и растёт вместе с бизнесом. Хорошая система работает как хорошая игра: правила простые, а возможностей внутри них много.',
  'В команде сильные специалисты: веб-, графические и продуктовые дизайнеры.',
  'Мы ценим ремесло и хард-скилы, потому что идея без точного исполнения остаётся просто идеей. На старте каждого проекта подключаем креативную пару: арт-директора и стратега. Вместе они правильно ставят задачу и находят смысловое ядро, из которого потом вырастает вся визуальная система.',
  'Почему Skip Design? Потому что мы пропускаем всё лишнее: случайные приёмы, решения ради решений. Убираем шум, пока не проявится суть.',
  'Мы привносим в работу лёгкость и юмор и отступаем от шаблонов, если так получится лучше. Мы уверены, что сильные решения рождаются не в напряжении, а в игре: в любопытстве, в готовности пробовать и в удовольствии от процесса. Лёгкость для нас не про поверхностность, а про свободу думать смелее.',
];
// Half a page column: the paragraphs' first-line indent
const COLUMN = 'calc((100vw - var(--page-sb, 0px) - 2 * var(--pad) - 4 * var(--gap)) / 10)';

// The balls the text runs around: they drop onto the gutter between the
// columns one after another as the page scrolls, and balance on each other
const STACK: FlowStack = {
  x: 0.5, floor: 0.62, radii: [0.17, 0.13, 0.1], lean: [0, 0.07, -0.06],
  xM: 0.66, floorM: 0.55, radiiM: [0.24, 0.18, 0.13],
};

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

  return (
    <div className={s.page} ref={pageRef} style={{ ...DARK, background: DARK['--c-bg'] } as React.CSSProperties}>
      <div className={s.body} style={{ position: 'relative', zIndex: 1, paddingTop: 'var(--inner-content-top)', paddingLeft: 'var(--pad)', paddingRight: 'var(--pad)', paddingBottom: 0 }}>
        
        {/* The text in two columns across the screen (one on a phone), run
            around the balls that drop into it as the page scrolls */}
        <FlowText
          paras={TEXT.map(p => ({ text: typo(t(p)) }))}
          stack={STACK}
          scrollRef={pageRef}
          columns={isMobile ? 1 : 2}
          style={{
            ...H2_STYLE, margin: 0,
            // The home headline: its size, leading and tracking (ScrollHero)
            fontSize: 'var(--hero-fs, min(var(--hero-size), 7.2vw))', lineHeight: 'var(--hero-lh, 0.8755)', letterSpacing: '-0.03em',
            ['--flow-indent' as string]: isMobile ? '33.333vw' : COLUMN,
            // Lowered so the tops of its lowercase letters meet those of the first line
            ['--flow-label-top' as string]: 'calc(var(--h2-size) * (var(--h2-lh) - 1) / 2 + 0.3 * var(--h2-size) - var(--text-size) * (var(--text-lh) - 1) / 2 - 0.3 * var(--text-size))',
          }}
        />
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
