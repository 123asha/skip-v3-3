import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import s from './CasesPage.module.css';
import { TEXT_STYLE as ts, H2_STYLE as h2s } from '../utils/typography';
import { MagneticDivider } from './MagneticDivider';
import CaseCard, { CASE_AR_H as H, CASE_AR_V as V } from './CaseCard';
import { SERVICES } from './ExpertizaPage';
import { useReveal } from '../hooks/useReveal';

// ── Per-service enrichment ───────────────────────────────────────────────────

const PROCESS: Record<number, { n: string; title: string; text: string }[]> = {
  0: [
    { n: '01/', title: 'Анализ', text: 'Изучаем бизнес, рынок и аудиторию. Находим точки дифференциации — то, от чего зависит позиция.' },
    { n: '02/', title: 'Стратегическая сессия', text: 'Работаем вместе с командой клиента: проверяем гипотезы, выбираем направление, выстраиваем архитектуру смыслов.' },
    { n: '03/', title: 'Платформа', text: 'Формулируем суть бренда: миссию, позиционирование, тон голоса и архитектуру сообщений.' },
    { n: '04/', title: 'Итерации и передача', text: 'Дорабатываем по обратной связи, финализируем документ. Объясняем команде как использовать платформу.' },
  ],
  1: [
    { n: '01/', title: 'Аудит', text: 'Проверяем, что уже есть. Фиксируем, что работает, а что мешает целостному восприятию.' },
    { n: '02/', title: 'Концепция', text: 'Создаём 2–3 визуальных направления. Показываем на реальных носителях, а не на абстрактных мудбордах.' },
    { n: '03/', title: 'Финализация системы', text: 'Прорабатываем выбранное направление до полной системы: логотип, цвет, типографика, сетка, паттерны.' },
    { n: '04/', title: 'Библиотека и передача', text: 'Собираем Figma-библиотеку и брендбук. Обучаем команду — система живёт без нас.' },
  ],
  2: [
    { n: '01/', title: 'Исследование', text: 'Анализируем CJM, конкурентов и точки трений. Формулируем задачу до начала рисования.' },
    { n: '02/', title: 'Прототип', text: 'Быстрые каркасы сценариев в Figma. Проверяем логику до детального дизайна.' },
    { n: '03/', title: 'UI и дизайн-система', text: 'Финальный дизайн в компонентной библиотеке. Разработчик получает готовую систему, а не набор экранов.' },
    { n: '04/', title: 'Запуск', text: 'Помогаем передать в разработку, проверяем реализацию, доводим до запуска.' },
  ],
};

const OUTCOMES: Record<number, string[]> = {
  0: ['Платформа бренда', 'Позиционирование', 'Архитектура сообщений', 'Нейминг', 'Регистрация ТЗ', 'Тон голоса'],
  1: ['Логотип и знак', 'Цвет и типографика', 'Паттерны', 'Figma-библиотека', 'Брендбук', 'Шаблоны'],
  2: ['Лендинг', 'Продуктовый сайт', 'Интерфейс / приложение', 'Дизайн-система', 'Спецпроект', 'Промо'],
};

// ── Shared primitives ────────────────────────────────────────────────────────

const GAP = 'var(--gap)';
const PAD = 'var(--pad)';

function grid5(extra?: React.CSSProperties): React.CSSProperties {
  return { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: GAP, ...extra };
}

function Divider() {
  return <div style={{ padding: `0 ${PAD}`, margin: '64px 0' }}><MagneticDivider /></div>;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ ...ts, fontFamily: 'var(--font-mono)', opacity: 0.4, margin: 0 }}>{children}</p>
  );
}

// ── Expandable service item row ──────────────────────────────────────────────

function ItemRow({ item, svc, open, onToggle, idx }: {
  item: typeof SERVICES[0]['items'][0];
  svc: typeof SERVICES[0];
  open: boolean;
  onToggle: () => void;
  idx: number;
}) {
  const bodyRef  = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    if (bodyRef.current) setHeight(bodyRef.current.scrollHeight);
  }, [item]);

  // word-by-word reveal on open
  useEffect(() => {
    if (!bodyRef.current || !open) return;
    const words = bodyRef.current.querySelectorAll<HTMLElement>('[data-word]');
    gsap.fromTo(words, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out', stagger: 0.007 });
  }, [open]);

  return (
    <div
      data-reveal=""
      data-reveal-delay={`${idx * 0.05}`}
      style={{ padding: `0 ${PAD}`, cursor: 'pointer' }}
      onClick={onToggle}
    >
      <div style={{ padding: '20px 0', borderBottom: '1px solid var(--c-border)' }}>
        <div style={grid5({ alignItems: 'start' })}>
          {/* col 1-2 empty */}
          <div />
          <div />
          {/* col 3 — number */}
          <p style={{ ...ts, opacity: 0.35, margin: 0 }}>{String(idx + 1).padStart(2, '0')}/</p>
          {/* col 4-5 — label + expand icon */}
          <div style={{ gridColumn: '4/6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p style={{ ...ts, margin: 0 }}>{item.label}</p>
            <span style={{ ...ts, opacity: 0.4, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.25s ease', flexShrink: 0, marginLeft: 16 }}>+</span>
          </div>
        </div>

        {/* Body — slides open */}
        <div style={{ overflow: 'hidden', height: open ? height : 0, transition: 'height 0.35s cubic-bezier(0.4,0,0.2,1)' }}>
          <div ref={bodyRef} style={{ paddingTop: 20, paddingBottom: 4 }}>
            <div style={grid5({ alignItems: 'start' })}>
              <div /><div /><div />
              <div style={{ gridColumn: '4/6', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {item.paragraphs.map((p, pi) => (
                  <p key={pi} style={{ ...ts, margin: 0, maxWidth: 440 }}>
                    {p.split(' ').map((w, wi, arr) => (
                      <span key={wi}>
                        <span data-word style={{ display: 'inline-block', willChange: 'transform' }}>{w}</span>
                        {wi < arr.length - 1 ? ' ' : ''}
                      </span>
                    ))}
                  </p>
                ))}
                {item.examples && item.examples.length > 0 && (
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const, marginTop: 4 }}>
                    {item.examples.map(ex => (
                      <a
                        key={ex.label}
                        href={ex.href}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ ...ts, fontFamily: 'var(--font-mono)', textDecoration: 'underline', textDecorationStyle: 'dotted' as const, textUnderlineOffset: '3px', opacity: 0.6 }}
                      >
                        {ex.label} ↗
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ServiceDetailPage({ serviceIdx = 0, onBack }: { serviceIdx?: 0 | 1 | 2; onBack?: () => void }) {
  const svc     = SERVICES[serviceIdx];
  const process = PROCESS[serviceIdx];
  const outcomes = OUTCOMES[serviceIdx];
  const [openId, setOpenId] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useReveal(pageRef);

  useEffect(() => {
    const lenis = (window as any).__lenis;
    if (lenis) lenis.stop();
    const el = pageRef.current!;
    const stopBubble = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener('wheel', stopBubble, { passive: true });
    return () => {
      el.removeEventListener('wheel', stopBubble);
      if (lenis) lenis.start();
    };
  }, []);

  return (
    <div className={s.page} ref={pageRef}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: `calc(${PAD} + var(--text-size) * var(--text-lh) + 20px) ${PAD} 0` }}>
        <div style={grid5({ alignItems: 'end', paddingBottom: 48 })}>
          {/* Big muted number — col 1 */}
          <div style={{ gridColumn: '1/3', alignSelf: 'start', paddingTop: 8 }}>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(80px, 10vw, 140px)',
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              opacity: 0.07,
              margin: 0,
              userSelect: 'none',
            }}>
              {svc.number}
            </p>
          </div>

          {/* col 3 — section meta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 6 }}>
            <Label>Услуга</Label>
            <Label>{serviceIdx === 0 ? 'Стратегия' : serviceIdx === 1 ? 'Дизайн' : 'Диджитал'}</Label>
          </div>

          {/* col 4-5 — title + intro */}
          <div style={{ gridColumn: '4/6', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--heading-size)',
              fontWeight: 'var(--heading-weight)' as any,
              lineHeight: 'var(--heading-lh)',
              letterSpacing: 'var(--heading-ls)',
              margin: 0,
              whiteSpace: 'pre-line',
            }} data-reveal="">
              {svc.title}
            </h1>
            <p style={{ ...ts, opacity: 0.55, maxWidth: 360, margin: 0 }} data-reveal="" data-reveal-delay="0.1">
              {serviceIdx === 0
                ? 'Строим основу для принятия любых решений о бренде. Всё, что дальше, вырастает отсюда.'
                : serviceIdx === 1
                  ? 'Создаём системы, которые продолжают работать без нас. Последовательность без усилий.'
                  : 'Проектируем цифровые продукты, которые решают задачи бизнеса. Сайты, интерфейсы, спецпроекты.'}
            </p>
          </div>
        </div>
      </div>

      <Divider />

      {/* ── Что входит ───────────────────────────────────────────────────── */}
      <div style={{ padding: `0 ${PAD}`, marginBottom: 16 }}>
        <div style={grid5()}>
          <div /><div />
          <div />
          <p style={{ ...h2s, gridColumn: '4/6', margin: 0, marginBottom: 32 }} data-reveal="">Что входит</p>
        </div>
      </div>

      {svc.items.map((item, i) => (
        <ItemRow
          key={item.id}
          item={item}
          svc={svc}
          idx={i}
          open={openId === item.id}
          onToggle={() => setOpenId(openId === item.id ? null : item.id)}
        />
      ))}

      <Divider />

      {/* ── Как работаем ─────────────────────────────────────────────────── */}
      <div style={{ padding: `0 ${PAD}` }}>
        <div style={grid5({ marginBottom: 48 })}>
          <div /><div /><div />
          <p style={{ ...h2s, gridColumn: '4/6', margin: 0 }} data-reveal="">Как работаем</p>
        </div>

        {process.map((step, i) => (
          <div
            key={step.n}
            data-reveal=""
            data-reveal-delay={`${i * 0.06}`}
            style={{ ...grid5({ paddingBottom: 32, alignItems: 'start' }) }}
          >
            <div /><div />
            <p style={{ ...ts, opacity: 0.35, margin: 0 }}>{step.n}</p>
            <div style={{ gridColumn: '4/6', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ ...ts, margin: 0, fontWeight: 500 }}>{step.title}</p>
              <p style={{ ...ts, opacity: 0.6, margin: 0, maxWidth: 400 }}>{step.text}</p>
            </div>
          </div>
        ))}
      </div>

      <Divider />

      {/* ── Результат ────────────────────────────────────────────────────── */}
      <div style={{ padding: `0 ${PAD}` }}>
        <div style={grid5({ marginBottom: 40 })}>
          <div /><div /><div />
          <p style={{ ...h2s, gridColumn: '4/6', margin: 0 }} data-reveal="">Что получите</p>
        </div>

        <div style={grid5({ alignItems: 'start', marginBottom: 0 })}>
          <div /><div /><div />
          <div style={{ gridColumn: '4/6', display: 'flex', flexWrap: 'wrap' as const, gap: 10 }}>
            {outcomes.map((o, i) => (
              <div
                key={o}
                data-reveal=""
                data-reveal-delay={`${i * 0.04}`}
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--c-border)',
                  borderRadius: 40,
                  ...ts,
                  opacity: 0.75,
                }}
              >
                {o}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Divider />

      {/* ── Связанные кейсы ──────────────────────────────────────────────── */}
      <div style={{ padding: `0 ${PAD}` }}>
        <div style={grid5({ marginBottom: 40 })}>
          <div /><div /><div />
          <p style={{ ...h2s, gridColumn: '4/6', margin: 0 }} data-reveal="">Связанные кейсы</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: GAP, alignItems: 'start' }}>
          <div style={{ gridColumn: '1/3' }} data-reveal="">
            <CaseCard ar={H} title="Senior*s Bar" services="2025" desc="Бар своей среды. Визуальный язык для офлайна и онлайна." />
          </div>
          <div style={{ gridColumn: '4/6' }} data-reveal="" data-reveal-delay="0.1">
            <CaseCard ar={V} title="Gate Legal" services="2024" desc="Помогли запуститься: от платформы бренда до сайта — за полтора месяца." />
          </div>
        </div>
      </div>

      <Divider />

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: `0 ${PAD} 120px` }}>
        <div style={grid5({ alignItems: 'center' })}>
          <div /><div />
          <p style={{ ...ts, opacity: 0.35, margin: 0 }}>Начнём?</p>
          <div style={{ gridColumn: '4/6', display: 'flex', flexDirection: 'column', gap: 16 }} data-reveal="">
            <p style={{ ...h2s, fontSize: 'clamp(20px,2.5vw,40px)', margin: 0 }}>
              {svc.ctaLabel.charAt(0).toUpperCase() + svc.ctaLabel.slice(1)}
            </p>
            <p style={{ ...ts, opacity: 0.55, margin: 0, maxWidth: 360 }}>
              Расскажите о задаче — обсудим, подберём формат работы и оценим.
            </p>
            <a
              href="/cases"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                marginTop: 8,
                ...ts,
                fontFamily: 'var(--font-mono)',
                textDecoration: 'underline',
                textDecorationStyle: 'dotted' as const,
                textUnderlineOffset: '3px',
              }}
            >
              написать → hi@skip.design
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}
