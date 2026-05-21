import { useEffect, useRef } from 'react';
import s from './CasesPage.module.css';
import { TEXT_STYLE as textStyle, BODY_LONG_STYLE as bodyLongStyle } from '../utils/typography';

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--heading-size)',
  fontWeight: 'var(--heading-weight)' as React.CSSProperties['fontWeight'],
  lineHeight: 'var(--heading-lh)',
  letterSpacing: 'var(--heading-ls)',
  color: 'var(--c-text)',
};

const row: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: 'var(--gap)',
  alignItems: 'start',
  borderTop: '1px solid var(--c-border)',
  paddingTop: 16,
  paddingBottom: 32,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 80 }}>
      <p style={{ ...textStyle, marginBottom: 40 }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  );
}

const colors = [
  { name: '--c-text',       value: '#231f20',                  desc: 'Основной текст' },
  { name: '--c-bg',         value: '#ffffff',                  desc: 'Фон страниц' },
  { name: '--c-surface',    value: '#f6f6f6',                  desc: 'Поверхности, карточки' },
  { name: '--c-accent',     value: '#8382fc',                  desc: 'Акцент' },
  { name: '--c-border',     value: 'rgba(35, 31, 32, 0.12)',   desc: 'Границы, разделители' },
  { name: '--opacity-muted', value: '0.4',                     desc: 'Серый/приглушённый текст — ссылки L2, подписи, вторичные элементы' },
];

const spacings = [
  { name: '--pad',  value: '20px', desc: 'Внешние отступы страницы (left / right / top / bottom)' },
  { name: '--gap',  value: '20px', desc: 'Промежуток между колонками сетки' },
  { name: '4px',    value: '4px',  desc: 'Микро-промежутки внутри пунктов списка' },
  { name: '8–12px', value: '8–12px', desc: 'Между связанными элементами (например, чипы)' },
  { name: '40px',   value: '40px', desc: 'Между подзаголовком и контентом блока' },
  { name: '60px',   value: '60px', desc: 'Между маленькими блоками' },
  { name: '80px',   value: '80px', desc: 'Между крупными блоками' },
  { name: '120px',  value: '120px', desc: 'Row-gap в сетке кейсов' },
  { name: '200px',  value: '200px', desc: 'Низ страницы (padding-bottom у .body)' },
];

export default function GuidePage() {
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
      <h1 className={s.title}>Гайд</h1>
      <div className={s.body} style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 200 }}>

        {/* ── Шрифты ────────────────────────────────────────────────── */}
        <Section title="Иерархия шрифтов">

          <div style={row}>
            <p style={textStyle}>H1 / Heading</p>
            <p style={{ ...headingStyle, gridColumn: '2 / 4' }}>Заголовок страницы</p>
            <div style={{ gridColumn: '4 / 6', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={textStyle}>font-family: CoFo Sans VF</p>
              <p style={textStyle}>font-size: clamp(40px, 2.857vw, 54px) — переменная --heading-size</p>
              <p style={textStyle}>font-weight: 454 — переменная --heading-weight</p>
              <p style={textStyle}>line-height: 0.81 — переменная --heading-lh</p>
              <p style={textStyle}>letter-spacing: -0.02em — переменная --heading-ls</p>
            </div>
          </div>

          <div style={row}>
            <p style={textStyle}>Body / Text</p>
            <p style={{ ...textStyle, gridColumn: '2 / 4' }}>Весь маленький текст: абзацы, описания, маленькие заголовки, ссылки, теги, табы, инпуты, подписи к слайдеру</p>
            <div style={{ gridColumn: '4 / 6', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={textStyle}>font-family: CoFo Sans Semi-Mono VF — переменная --font</p>
              <p style={textStyle}>font-size: clamp(12px, 1.143vw, 20px) — переменная --text-size</p>
              <p style={textStyle}>font-weight: 465 — переменная --text-weight</p>
              <p style={textStyle}>line-height: 1 — переменная --text-lh</p>
              <p style={textStyle}>letter-spacing: -0.02em — переменная --text-ls</p>
            </div>
          </div>

          <div style={row}>
            <p style={textStyle}>Body Long</p>
            <p style={{ ...bodyLongStyle, gridColumn: '2 / 4' }}>Длинные описания, лонгриды, политики конфиденциальности и любые места, где текст читается абзацами. Увеличенный межстрочный интервал улучшает читаемость.</p>
            <div style={{ gridColumn: '4 / 6', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={textStyle}>font-family: CoFo Sans Semi-Mono VF — как у Body</p>
              <p style={textStyle}>font-size: var(--text-size) — как у Body</p>
              <p style={textStyle}>line-height: 1.6 — расширенный (Body: 1)</p>
              <p style={textStyle}>Импорт: BODY_LONG_STYLE из utils/typography</p>
              <p style={textStyle}>Применяется: PolicyPage, расширенные описания</p>
            </div>
          </div>

        </Section>

        {/* ── Цвета ─────────────────────────────────────────────────── */}
        <Section title="Цвета">
          {colors.map(c => (
            <div key={c.name} style={row}>
              <p style={textStyle}>{c.name}</p>
              <div style={{ gridColumn: '2 / 4', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, background: c.value, border: '1px solid var(--c-border)' }} />
                <p style={textStyle}>{c.value}</p>
              </div>
              <p style={{ ...textStyle, gridColumn: '4 / 6' }}>{c.desc}</p>
            </div>
          ))}
        </Section>

        {/* ── Сетка ─────────────────────────────────────────────────── */}
        <Section title="Сетка">
          <div style={row}>
            <p style={textStyle}>Колонки</p>
            <p style={{ ...textStyle, gridColumn: '2 / 4' }}>5 равных колонок (1fr × 5)</p>
            <p style={{ ...textStyle, gridColumn: '4 / 6' }}>grid-template-columns: repeat(5, 1fr)</p>
          </div>
          <div style={row}>
            <p style={textStyle}>Промежуток</p>
            <p style={{ ...textStyle, gridColumn: '2 / 4' }}>20px между колонками</p>
            <p style={{ ...textStyle, gridColumn: '4 / 6' }}>column-gap: var(--gap)</p>
          </div>
          <div style={row}>
            <p style={textStyle}>Внешний отступ</p>
            <p style={{ ...textStyle, gridColumn: '2 / 4' }}>20px слева и справа от сетки</p>
            <p style={{ ...textStyle, gridColumn: '4 / 6' }}>padding: 0 var(--pad)</p>
          </div>
          <div style={{ ...row, gridTemplateColumns: 'repeat(5, 1fr)' }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ background: 'var(--c-surface)', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={textStyle}>{i}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Вертикальные отступы ──────────────────────────────────── */}
        <Section title="Вертикальные отступы">
          {spacings.map(sp => (
            <div key={sp.name} style={row}>
              <p style={textStyle}>{sp.name}</p>
              <p style={{ ...textStyle, gridColumn: '2 / 4' }}>{sp.value}</p>
              <p style={{ ...textStyle, gridColumn: '4 / 6' }}>{sp.desc}</p>
            </div>
          ))}
        </Section>

        {/* ── Ссылки ────────────────────────────────────────────────── */}
        <Section title="Ссылки">
          <div style={row}>
            <p style={textStyle}>Стандартная</p>
            <p style={{ ...textStyle, gridColumn: '2 / 4' }}>
              <a href="#" onClick={e => e.preventDefault()}>обычная ссылка</a>
            </p>
            <p style={{ ...textStyle, gridColumn: '4 / 6' }}>color: inherit; text-decoration: underline dotted; text-underline-offset: 3px</p>
          </div>
          <div style={row}>
            <p style={textStyle}>В тексте</p>
            <p style={{ ...textStyle, gridColumn: '2 / 4' }}>
              Текст со ссылкой <span style={{ textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' }}>Читать</span> или <span style={{ textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' }}>Перейти</span>
            </p>
            <p style={{ ...textStyle, gridColumn: '4 / 6' }}>Span с теми же стилями — для тегов внутри текста</p>
          </div>
          <div style={row}>
            <p style={textStyle}>Tab (фильтр)</p>
            <p style={{ ...textStyle, gridColumn: '2 / 4' }}>
              <button style={{ ...textStyle, textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px', cursor: 'pointer', padding: 0, background: 'none', border: 'none' }}>Брендинг</button>
            </p>
            <p style={{ ...textStyle, gridColumn: '4 / 6' }}>Активный: opacity 1. Неактивные при активной табе: 0.35. Состояние по умолчанию: 0.6</p>
          </div>
        </Section>

        {/* ── Правила ───────────────────────────────────────────────── */}
        <Section title="Правила и паттерны">
          <div style={row}>
            <p style={textStyle}>Hover карточки</p>
            <p style={{ ...textStyle, gridColumn: '2 / 4' }}>Заголовок сверху + описание снизу появляются на наведение</p>
            <p style={{ ...textStyle, gridColumn: '4 / 6' }}>height: 0 → 36px; opacity: 0 → 1; transition 0.3s ease</p>
          </div>
          <div style={row}>
            <p style={textStyle}>Hover строки</p>
            <p style={{ ...textStyle, gridColumn: '2 / 4' }}>Соседи получают opacity 0.3, активная строка получает чёрную верхнюю границу</p>
            <p style={{ ...textStyle, gridColumn: '4 / 6' }}>transition: opacity 0.3s ease, border-top-color 0.2s ease</p>
          </div>
          <div style={row}>
            <p style={textStyle}>Aspect-ratio карточек</p>
            <p style={{ ...textStyle, gridColumn: '2 / 4' }}>H: 16/9 — для горизонтальных. V: 3/4 — для вертикальных</p>
            <p style={{ ...textStyle, gridColumn: '4 / 6' }}>В сетке кейсов чередуются H+V парами с двумя раскладками: с зазором (1/3 + 4/6) и плотная (2/4 + 4/6)</p>
          </div>
          <div style={row}>
            <p style={textStyle}>Лого</p>
            <p style={{ ...textStyle, gridColumn: '2 / 4' }}>Position: fixed справа сверху, mix-blend-mode: difference</p>
            <p style={{ ...textStyle, gridColumn: '4 / 6' }}>Виден на любом фоне за счёт инверсии цвета</p>
          </div>
          <div style={row}>
            <p style={textStyle}>Скролл</p>
            <p style={{ ...textStyle, gridColumn: '2 / 4' }}>На главной — Lenis smooth scroll. На внутренних — нативный, .page как position: fixed</p>
            <p style={{ ...textStyle, gridColumn: '4 / 6' }}>Внутренние страницы покрывают весь viewport через width: 100vw — html-скроллбар визуально перекрыт</p>
          </div>
        </Section>

      </div>
    </div>
  );
}
