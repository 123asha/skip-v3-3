import { useState, useEffect, useRef } from 'react';
import CaseCard, { CASE_AR_H as H, CASE_AR_V as V } from './CaseCard';
import { MagneticDivider } from './MagneticDivider';
import CircleInput from './CircleInput';
import PillInput from './PillInput';
import LinkFlip from './LinkFlip';
import MoscowTime from './MoscowTime';
import SnakeGame from './SnakeGame';
import BreakoutGame from './BreakoutGame';
import { MediaSection } from './MediaSection';
import s from './CasesPage.module.css';
import { TEXT_STYLE as ts, H2_STYLE as h2s } from '../utils/typography';

// ── Shared primitives ────────────────────────────────────────────────────────

const chip: React.CSSProperties = {
  ...ts,
  fontSize: '10px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  opacity: 0.35,
  marginBottom: 14,
};

const divLine: React.CSSProperties = {
  height: 1,
  background: 'var(--c-border)',
  margin: '0 0 56px',
};

const sectionHead: React.CSSProperties = {
  ...h2s,
  fontSize: 'clamp(13px,1.1vw,18px)',
  marginBottom: 40,
};

function Chip({ children }: { children: React.ReactNode }) {
  return <p style={chip}>{children}</p>;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 32, alignItems: 'start', marginBottom: 32 }}>
      <p style={{ ...ts, opacity: 0.4, margin: 0, paddingTop: 4 }}>{label}</p>
      <div>{children}</div>
    </div>
  );
}

function DemoBox({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ padding: '32px', background: 'var(--c-surface)', ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ n, title }: { n: string; title: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 'var(--gap)', marginBottom: 32 }}>
      <p style={{ ...ts, opacity: 0.35, margin: 0, paddingTop: 6 }}>{n}</p>
      <p style={{ ...sectionHead, gridColumn: '2/6', margin: 0 }}>{title}</p>
    </div>
  );
}

// ── Case-page block mockups (no real images needed) ───────────────────────────
const GAP4 = '4px';
const SIDE4 = '4px';

function ImgRect({ ar, src }: { ar: 'h' | 'v'; src?: string }) {
  return (
    <div style={{
      width: '100%',
      aspectRatio: ar === 'h' ? '16/9' : '5/8',
      background: src ? undefined : 'var(--c-surface)',
      border: '1px solid var(--c-border)',
      overflow: 'hidden',
    }}>
      {src && <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
    </div>
  );
}

function CaptionRow({ num, text }: { num: string; text: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: GAP4, padding: `0 ${SIDE4}`, marginTop: 10 }}>
      <div />
      <div />
      <p style={{ ...ts, opacity: 0.4, margin: 0 }}>{num}</p>
      <p style={{ ...ts, gridColumn: '4/6', margin: 0 }}>{text}</p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

export default function DesignSystemPage() {
  const [circleVal, setCircleVal] = useState('');
  const [pillVal, setPillVal] = useState('');
  const pageRef = useRef<HTMLDivElement>(null);

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

  const pad = 'var(--pad)';
  const col5: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 'var(--gap)' };

  return (
    <div className={s.page} ref={pageRef} style={{ padding: pad, paddingTop: 80, paddingBottom: 120 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 80 }}>
        <p style={{ ...ts, opacity: 0.35, marginBottom: 12 }}>skip.design / system</p>
        <h1 style={{ ...h2s, fontSize: 'var(--heading-size)', fontWeight: 'var(--heading-weight)' as any, lineHeight: 'var(--heading-lh)', letterSpacing: 'var(--heading-ls)', margin: 0 }}>
          Компоненты
        </h1>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          01 / АТОМЫ — мельчайшие UI-элементы
      ════════════════════════════════════════════════════════════════════════ */}
      <SectionTitle n="01 /" title="Атомы" />

      {/* LinkFlip */}
      <Row label="LinkFlip">
        <Chip>компонент · src/app/components/LinkFlip.tsx</Chip>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' as const }}>
          {['кейсы', 'услуги', 'студия', 'Skip Design'].map(w => (
            <a key={w} href="#" style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--h2-size)',
              textDecoration: 'underline',
              textDecorationStyle: 'dotted' as const,
              textUnderlineOffset: 3,
              color: 'var(--c-text)',
            }}>
              <LinkFlip>{w}</LinkFlip>
            </a>
          ))}
        </div>
      </Row>

      {/* MagneticDivider */}
      <Row label="MagneticDivider">
        <Chip>компонент · src/app/components/MagneticDivider.tsx</Chip>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {([
            { label: 'default — тянется за курсором', props: {} },
            { label: 'flat — статичная линия', props: { flat: true } },
            { label: 'dotted', props: { dotted: true } },
            { label: 'active — акцентный цвет', props: { active: true, color: 'var(--c-accent)' } },
          ] as const).map(({ label, props }) => (
            <div key={label}>
              <p style={{ ...ts, opacity: 0.3, fontSize: '11px', marginBottom: 6 }}>{label}</p>
              <MagneticDivider {...props} />
            </div>
          ))}
        </div>
      </Row>

      {/* MoscowTime */}
      <Row label="MoscowTime">
        <Chip>компонент · src/app/components/MoscowTime.tsx</Chip>
        <p style={{ ...ts, fontFamily: 'var(--font-mono)', margin: 0, fontSize: 'var(--h2-size)' }}>
          <MoscowTime />
        </p>
        <p style={{ ...ts, opacity: 0.35, marginTop: 8 }}>Двоеточие медленно мигает (раз в 2 с). Обновляется каждые 10 с.</p>
      </Row>

      {/* CircleInput */}
      <Row label="CircleInput">
        <Chip>компонент · src/app/components/CircleInput.tsx</Chip>
        <div style={{ maxWidth: 360 }}>
          <CircleInput placeholder="t.me/yourname" value={circleVal} onChange={setCircleVal} />
        </div>
        <p style={{ ...ts, opacity: 0.35, marginTop: 12 }}>Буквы набираются по одной в кружках. Используется в форме связи.</p>
      </Row>

      {/* PillInput */}
      <Row label="PillInput">
        <Chip>компонент · src/app/components/PillInput.tsx</Chip>
        <div style={{ maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PillInput placeholder="@telegram" value={pillVal} onChange={setPillVal} prefix="@" />
          <PillInput placeholder="email@company.com" value="" />
        </div>
        <p style={{ ...ts, opacity: 0.35, marginTop: 12 }}>Pill-инпут с префиксом-кружком или без. Вариант ContactForm.</p>
      </Row>

      <div style={divLine} />

      {/* ══════════════════════════════════════════════════════════════════════
          02 / КАРТОЧКИ КЕЙСОВ
      ════════════════════════════════════════════════════════════════════════ */}
      <SectionTitle n="02 /" title="Карточки кейсов" />
      <Chip>компонент · src/app/components/CaseCard.tsx</Chip>

      <div style={{ ...col5, marginBottom: 48, alignItems: 'start' }}>
        {/* H card — occupies 2 cols */}
        <div style={{ gridColumn: '1/3' }}>
          <p style={{ ...ts, opacity: 0.35, marginBottom: 10, fontSize: '11px' }}>H — 16/9 → рендер 4/3</p>
          <CaseCard ar={H} title="Senior*s Bar" desc="Бар своей среды. Визуальный язык для офлайна и онлайна." />
        </div>
        {/* V card — occupies 2 cols */}
        <div style={{ gridColumn: '4/6' }}>
          <p style={{ ...ts, opacity: 0.35, marginBottom: 10, fontSize: '11px' }}>V — 5/6</p>
          <CaseCard ar={V} title="Gate Legal" desc="Помогли запуститься: от платформы бренда до сайта — за полтора месяца." />
        </div>
      </div>

      <div style={{ marginBottom: 48 }}>
        <p style={{ ...ts, opacity: 0.35, marginBottom: 20, fontSize: '11px' }}>Паттерн ряда CFG_GAP — левая col 1/3, правая col 4/6 (пробел посередине)</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 'var(--gap)', alignItems: 'start' }}>
          <div style={{ gridColumn: '1/3' }}><CaseCard ar={H} title="AEPlatform" desc="Страница, которая приводит партнёров AliExpress" /></div>
          <div style={{ gridColumn: '4/6' }}><CaseCard ar={V} title="Kon' Ogon'" desc="Новогодний спецпроект для команды и комьюнити" /></div>
        </div>
      </div>

      <div style={{ marginBottom: 48 }}>
        <p style={{ ...ts, opacity: 0.35, marginBottom: 20, fontSize: '11px' }}>Паттерн ряда CFG_ADJ — левая col 2/4, правая col 4/6 (прилегают вправо)</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 'var(--gap)', alignItems: 'start' }}>
          <div style={{ gridColumn: '2/4' }}><CaseCard ar={V} title="Magic Moon" desc="Трекер целей, где визуал поддерживает философию продукта" /></div>
          <div style={{ gridColumn: '4/6' }}><CaseCard ar={H} title="Binaroom" desc="3D-проекты превращаются в сметы и КП за минуту" /></div>
        </div>
      </div>

      <div style={divLine} />

      {/* ══════════════════════════════════════════════════════════════════════
          03 / БЛОКИ КЕЙС-СТРАНИЦ
      ════════════════════════════════════════════════════════════════════════ */}
      <SectionTitle n="03 /" title="Блоки кейс-страниц" />
      <Chip>CaseTemplatePage · src/app/components/CaseTemplatePage.tsx</Chip>
      <p style={{ ...ts, opacity: 0.4, marginBottom: 40 }}>
        Каждая кейс-страница собирается из блоков типа <code>single</code> / <code>duo</code> / <code>text</code>.<br />
        Сетка: 4px gutters, 4px side margins. Нумерация (00/) — в col 3, текст — col 4/5.
      </p>

      {/* single H */}
      <div style={{ marginBottom: 52 }}>
        <p style={{ ...ts, opacity: 0.35, marginBottom: 12, fontSize: '11px' }}>single · ar: h · с подписью</p>
        <DemoBox style={{ padding: `${GAP4} ${SIDE4}` }}>
          <ImgRect ar="h" />
          <CaptionRow num="01/" text="Подпись к горизонтальной картинке — описание решения." />
        </DemoBox>
      </div>

      {/* single V */}
      <div style={{ marginBottom: 52 }}>
        <p style={{ ...ts, opacity: 0.35, marginBottom: 12, fontSize: '11px' }}>single · ar: v · без подписи</p>
        <DemoBox style={{ padding: `${GAP4} ${SIDE4}`, maxWidth: '40%' }}>
          <ImgRect ar="v" />
        </DemoBox>
      </div>

      {/* duo H+V */}
      <div style={{ marginBottom: 52 }}>
        <p style={{ ...ts, opacity: 0.35, marginBottom: 12, fontSize: '11px' }}>duo · left: v · right: h · с подписью справа</p>
        <DemoBox style={{ padding: `${GAP4} ${SIDE4}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '5fr 8fr', gap: GAP4 }}>
            <ImgRect ar="v" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: GAP4 }}>
              <ImgRect ar="h" />
              <CaptionRow num="00/" text="Ключевой образ — описание визуального решения для пары." />
            </div>
          </div>
        </DemoBox>
      </div>

      {/* duo V+V */}
      <div style={{ marginBottom: 52 }}>
        <p style={{ ...ts, opacity: 0.35, marginBottom: 12, fontSize: '11px' }}>duo · left: v · right: v</p>
        <DemoBox style={{ padding: `${GAP4} ${SIDE4}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: GAP4 }}>
            <ImgRect ar="v" />
            <ImgRect ar="v" />
          </div>
        </DemoBox>
      </div>

      {/* text block */}
      <div style={{ marginBottom: 52 }}>
        <p style={{ ...ts, opacity: 0.35, marginBottom: 12, fontSize: '11px' }}>text · текстовый блок (без картинки)</p>
        <DemoBox>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: GAP4 }}>
            <p style={{ ...ts, gridColumn: '4/6', margin: 0 }}>
              Баров в Тбилиси — тысячи. Наша задача была создать образ, который мгновенно считывается как «свой» для аудитории 30+, не объясняя, а показывая.
            </p>
          </div>
        </DemoBox>
      </div>

      {/* MetaRow / caption numbering */}
      <div style={{ marginBottom: 52 }}>
        <p style={{ ...ts, opacity: 0.35, marginBottom: 12, fontSize: '11px' }}>MetaRow — нумерация в col 3, текст в col 4/5</p>
        <DemoBox>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { n: '00/', t: 'Ключевой образ — буква S, прочитанная как знак кривой дороги.' },
              { n: '01/', t: 'Анимированный логотип в gif-формате для соцсетей.' },
              { n: '02/', t: 'Фоновые паттерны на базе рукописного модуля.' },
            ].map(({ n, t }) => (
              <div key={n} style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 'var(--gap)' }}>
                <div style={{ gridColumn: '3', opacity: 0.4 }}><p style={{ ...ts, margin: 0 }}>{n}</p></div>
                <p style={{ ...ts, gridColumn: '4/6', margin: 0 }}>{t}</p>
              </div>
            ))}
          </div>
        </DemoBox>
      </div>

      {/* Testimonial */}
      <div style={{ marginBottom: 52 }}>
        <p style={{ ...ts, opacity: 0.35, marginBottom: 12, fontSize: '11px' }}>Отзыв клиента</p>
        <DemoBox>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 'var(--gap)' }}>
            <div style={{ gridColumn: '4/6', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ ...h2s, fontSize: 'clamp(16px,1.8vw,28px)', margin: 0, fontStyle: 'italic' }}>
                «Здесь будет отзыв клиента о работе команды — пара предложений о результате.»
              </p>
              <p style={{ ...ts, opacity: 0.4, margin: 0 }}>Имя Фамилия, должность</p>
            </div>
          </div>
        </DemoBox>
      </div>

      <div style={divLine} />

      {/* ══════════════════════════════════════════════════════════════════════
          04 / МЕДИА-СЕКЦИЯ (Инсайты + Инструменты)
      ════════════════════════════════════════════════════════════════════════ */}
      <SectionTitle n="04 /" title="Медиа-секция (Инсайты / Инструменты)" />
      <Chip>компонент · src/app/components/MediaSection.tsx</Chip>
      <p style={{ ...ts, opacity: 0.4, marginBottom: 32 }}>
        Раскрывающийся список. Строка раскрывается кликом — показывает двухколоночный превью-текст.
      </p>
      <DemoBox style={{ padding: 0 }}>
        <MediaSection />
      </DemoBox>

      <div style={divLine} />

      {/* ══════════════════════════════════════════════════════════════════════
          05 / ФОРМА
      ════════════════════════════════════════════════════════════════════════ */}
      <SectionTitle n="05 /" title="Форма связи" />
      <Chip>компонент · src/app/components/ContactForm.tsx</Chip>
      <p style={{ ...ts, opacity: 0.4, marginBottom: 32 }}>
        Вариант <code>consult</code> — запрос на консультацию. Вариант <code>default</code> — стандартная форма. После отправки запускается мини-игра (FormGames).
      </p>
      <DemoBox>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 'var(--gap)', alignItems: 'start' }}>
          <div style={{ gridColumn: '4/6', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ ...h2s, fontSize: 'clamp(18px,2vw,28px)', margin: 0 }}>Начнём?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <PillInput placeholder="@telegram" value="" prefix="@" />
              <PillInput placeholder="email@company.com" value="" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ ...ts, fontFamily: 'var(--font-mono)' }}>+</span>
              </div>
              <p style={{ ...ts, opacity: 0.4, margin: 0 }}>новый проект</p>
            </div>
          </div>
        </div>
      </DemoBox>

      <div style={divLine} />

      {/* ══════════════════════════════════════════════════════════════════════
          06 / ВИЗУАЛЬНЫЕ СИСТЕМЫ
      ════════════════════════════════════════════════════════════════════════ */}
      <SectionTitle n="06 /" title="Визуальные системы" />
      <Chip>компонент · src/app/components/VisualSystemsBoard.tsx</Chip>
      <p style={{ ...ts, opacity: 0.4, marginBottom: 32 }}>
        Интерактивная доска — карточки визуальных систем с hover-анимацией.
      </p>
      <DemoBox style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--gap)', height: 260, overflow: 'hidden' }}>
        {['дизайн как правила игры', 'визуальные системы', 'для быстрорастущих'].map((label, i) => (
          <div key={i} style={{ background: 'var(--c-border)', aspectRatio: '4/3', display: 'flex', alignItems: 'flex-end', padding: 12 }}>
            <p style={{ ...ts, opacity: 0.5, margin: 0, fontSize: '11px' }}>{label}</p>
          </div>
        ))}
      </DemoBox>
      <p style={{ ...ts, opacity: 0.35, marginTop: 8 }}>VisualSystemsBoard · интерактивная доска с изображениями, меняющимися раз в секунду. <br/>Ссылка: <code>/lab</code> (встроена в LabPage).</p>

      <div style={divLine} />

      {/* ══════════════════════════════════════════════════════════════════════
          07 / ИГРЫ (форм-гейтинг после отправки)
      ════════════════════════════════════════════════════════════════════════ */}
      <SectionTitle n="07 /" title="Игры (форм-гейтинг)" />
      <Chip>SnakeGame · TetrisGame · BreakoutGame · src/app/components/</Chip>
      <p style={{ ...ts, opacity: 0.4, marginBottom: 32 }}>
        После отправки формы пользователь видит мини-игру вместо спиннера загрузки.
      </p>
      <div style={{ ...col5, alignItems: 'start' }}>
        <div style={{ gridColumn: '1/3' }}>
          <p style={{ ...ts, opacity: 0.35, marginBottom: 12, fontSize: '11px' }}>SnakeGame</p>
          <DemoBox style={{ padding: 0, height: 360, overflow: 'hidden' }}>
            <SnakeGame />
          </DemoBox>
        </div>
        <div style={{ gridColumn: '3/6' }}>
          <p style={{ ...ts, opacity: 0.35, marginBottom: 12, fontSize: '11px' }}>BreakoutGame</p>
          <DemoBox style={{ padding: 0, height: 360, overflow: 'hidden' }}>
            <BreakoutGame />
          </DemoBox>
        </div>
      </div>

      <div style={divLine} />

      {/* ══════════════════════════════════════════════════════════════════════
          08 / КОМПОНЕНТЫ ВНЕ КАТАЛОГА (full-page, не встраиваются inline)
      ════════════════════════════════════════════════════════════════════════ */}
      <SectionTitle n="08 /" title="Полноэкранные компоненты" />
      <p style={{ ...ts, opacity: 0.4, marginBottom: 40 }}>
        Эти компоненты занимают весь экран и не встраиваются inline. Доступны по своим маршрутам.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--gap)', rowGap: 40 }}>
        {[
          { file: 'ScrollHero.tsx',         route: '/',            desc: 'Главный хиро с вращающимся кубом, параллаксом слайдов и видео.' },
          { file: 'CasesPage.tsx',          route: '/cases',       desc: '5-колоночная сетка кейсов, 2 таба-фильтра, алгоритм рядов H+V.' },
          { file: 'ExpertizaPage.tsx',      route: '/services',    desc: 'Страница услуг — раскрывающиеся строки с описанием направлений.' },
          { file: 'ServiceDetailPage.tsx',  route: '/brand',       desc: 'Детальная страница услуги: hero, что входит, процесс, результат, кейсы.' },
          { file: 'LabPage.tsx',            route: '/lab',         desc: 'Страница студии — карточки команды, видео, intro-текст.' },
          { file: 'InstrumentsPage.tsx',    route: '/instruments', desc: 'Инструменты / фреймворки с hover-картинками.' },
          { file: 'CaseTemplatePage.tsx',   route: '/Seniorsbar',  desc: 'Шаблон кейс-страницы — блоки single/duo/text, MetaRow.' },
          { file: 'ProjectGallery.tsx',     route: 'inline',       desc: 'Галерея проектов с табами, используется внутри LabPage.' },
          { file: 'HeroBranches.tsx',       route: 'mobile',       desc: 'Мобильный хиро с ветками направлений (только mobile).' },
          { file: 'GuidePage.tsx',          route: '/guide',       desc: 'Гид/руководство — текстовая страница с оглавлением.' },
        ].map(({ file, route, desc }) => (
          <div key={file} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              aspectRatio: '16/10',
              background: 'var(--c-surface)',
              border: '1px solid var(--c-border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '14px 16px',
              boxSizing: 'border-box' as const,
            }}>
              <p style={{ ...ts, opacity: 0.3, margin: 0, fontSize: '10px', letterSpacing: '0.06em' }}>{route}</p>
              <p style={{ ...ts, fontFamily: 'var(--font-mono)', margin: 0, fontSize: '12px' }}>{file}</p>
            </div>
            <p style={{ ...ts, opacity: 0.5, margin: 0, fontSize: '13px', lineHeight: '1.5' }}>{desc}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
