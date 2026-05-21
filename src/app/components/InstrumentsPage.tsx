import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import s from './CasesPage.module.css';
import { TEXT_STYLE as textStyle } from '../utils/typography';
import ContactForm from './ContactForm';
import { ToolsSection } from './ToolsSection';
import { MediaSection } from './MediaSection';
import CaseCard from './CaseCard';
import { PROJECTS } from './ProjectGallery';

const problems = [
  {
    n: '①',
    title: 'Бренд выглядит дешевле, чем стоит на самом деле',
    text: 'Компания ведёт проекты на миллионы, а презентация выглядит так, будто её собрал фрилансер за пять тысяч. Клиенты считывают это за секунду. Торгуются, занижают чек. Деньги уходят на пустом месте, потому что бренд не дотягивает до уровня бизнеса.',
  },
  {
    n: '②',
    title: 'Производить много несложно. Производить одинаково сложно.',
    text: 'Каждый пост, каждая презентация, каждое коммерческое собирается с нуля. Дизайнер на аутсорсе работает в своём стиле, маркетолог в своём, менеджер как умеет. Объёмы растут, а бренд выглядит как десять разных компаний под одной вывеской.',
  },
  {
    n: '③',
    title: 'Узнаваемость размывается',
    text: 'Клиент видит вас в соцсетях, потом на конференции, потом получает коммерческое предложение. И не понимает, что это одна и та же компания. Касания не складываются в единый образ, маркетинговый бюджет работает в треть силы.',
  },
  {
    n: '④',
    title: 'Масштабирование буксует',
    text: 'Новый рынок, новый продукт, новый человек в команде. Всё упирается в одно: нечего показать. Стандартов нет, каждый делает по-своему. С каждым следующим макетом бренд деградирует.',
  },
  {
    n: '⑤',
    title: 'Конкуренты с продуктом слабее выигрывают тендеры',
    text: 'Потому что у них «дизайн как у взрослых». В B2B первое визуальное впечатление часто весит больше, чем кейсы и опыт. Несправедливо, но так.',
  },
  {
    n: '⑥',
    title: 'Бренд застрял в прошлом',
    text: 'Клиенты, партнёры, инвесторы продолжают видеть ту маленькую компанию, которой вы были три года назад. Перерасти это восприятие без новой визуальной системы почти не получится.',
  },
];

const approach = [
  {
    n: '①',
    title: 'Стратегия и анализ в креативной паре',
    text: 'Дизайнер не сидит в углу один, рядом всегда стратег. У нас свои методики, и думаем о задаче системно: что за бизнес, на каком этапе, куда идёт, кто конкурирует. Смотрим на задачу с разных сторон, а не линейно. Без стратегии дизайн превращается в рисование.',
  },
  {
    n: '②',
    title: 'Находим простые решения для сложных задач',
    text: 'Маленькая правка коммерческого или быстрый баннер — стратег всё равно подключается. Берём задачу в контекст: что уже сделано, зачем, как это работает на бренд. Не делаем «одну ширму» в отрыве от остального.',
  },
  {
    n: '③',
    title: 'Системы и стандарты',
    text: 'Делаем решения, которые продолжают работать без нас. Гайды, шаблоны, правила. Чтобы новый дизайнер в команде или внешний подрядчик не ломал бренд, а продолжал его.',
  },
  {
    n: '④',
    title: 'Инструменты и автоматизация',
    text: 'Если задача повторяется, её проще автоматизировать, чем каждый раз делать руками. Разрабатываем плагины под ваши процессы. ИИ-инструменты используем без стеснения, но с головой: не подменяем мышление, а ускоряем рутину.',
  },
];

const CASES = [
  { id: 'c1', ar: '16/9' as const, title: 'Бренд банка данных',         tag: 'Брендинг' },
  { id: 'c2', ar: '3/4'  as const, title: 'Визуальная система стартапа', tag: 'Брендинг' },
  { id: 'c3', ar: '3/4'  as const, title: 'Нейминг IT-сервиса',          tag: 'Стратегия' },
];

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--heading-size)',
  fontWeight: 'var(--heading-weight)' as React.CSSProperties['fontWeight'],
  lineHeight: 'var(--heading-lh)',
  letterSpacing: 'var(--heading-ls)',
  color: 'var(--c-text)',
};

// ── Accordion block (first section — problems) ─────────────────────────────

function AccordionSection({ heading, items }: { heading: string; items: typeof problems }) {
  return (
    <div style={{ marginBottom: 80, display: 'flex', flexDirection: 'column' }}>
      {items.map((item, i) => (
        <div
          key={item.n}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 'var(--gap)',
            alignItems: 'start',
            borderTop: '1px solid var(--c-border)',
            paddingTop: 16,
            paddingBottom: 32,
          }}
        >
          {/* Col 1: section heading appears only on the first row */}
          <p style={textStyle}>{i === 0 ? heading : ''}</p>
          {/* Col 2: empty (the column gap before the title) */}
          <div />
          {/* Col 3: item title */}
          <p style={textStyle}>{item.title}</p>
          {/* Cols 4-5: full description (always visible — "развернутое описание сразу") */}
          <p style={{ ...textStyle, gridColumn: '4 / 6', opacity: 0.7 }}>{item.text}</p>
        </div>
      ))}
    </div>
  );
}

// ── Regular section (second block — approach) ──────────────────────────────

function Section({ heading, items }: { heading: string; items: { n: string; title: string; text: string }[] }) {
  return (
    <div style={{ marginBottom: 80, display: 'flex', flexDirection: 'column' }}>
      {items.map((item, i) => (
        <div
          key={item.n}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 'var(--gap)',
            alignItems: 'start',
            borderTop: '1px solid var(--c-border)',
            paddingTop: 16,
            paddingBottom: 32,
          }}
        >
          {/* Col 1: section heading appears only on the first row */}
          <p style={textStyle}>{i === 0 ? heading : ''}</p>
          {/* Col 2: empty */}
          <div />
          {/* Col 3: item title */}
          <p style={textStyle}>{item.title}</p>
          {/* Cols 4-5: full description */}
          <p style={{ ...textStyle, gridColumn: '4 / 6', opacity: 0.7 }}>{item.text}</p>
        </div>
      ))}
    </div>
  );
}

// ── Case card — uses the shared CaseCard component ────────────────────────

function ExCaseCard({ title, tag, ar }: { title: string; tag: string; ar: '16/9' | '3/4' }) {
  return <CaseCard ar={ar} title={title} desc={tag} />;
}

// ── Branding cycle card ────────────────────────────────────────────────────

const BRANDING_PROJECTS = [
  { name: "Senior's",                   image: '/1.png'   },
  { name: 'Magic moon от Юры Мурадяна', image: '/1.1.png' },
  { name: 'Gate Legal',                 image: '/2.png'   },
];

function BrandingCycleCard() {
  const [hovered, setHovered] = useState(false);
  const [idx,     setIdx]     = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const layerARef   = useRef<HTMLDivElement>(null);
  const layerBRef   = useRef<HTMLDivElement>(null);
  const activeRef   = useRef<'a' | 'b'>('a');
  const idxRef      = useRef(0);

  useEffect(() => {
    if (layerARef.current) layerARef.current.style.backgroundImage = `url(${BRANDING_PROJECTS[0].image})`;
    if (layerBRef.current) {
      layerBRef.current.style.backgroundImage = `url(${BRANDING_PROJECTS[1].image})`;
      gsap.set(layerBRef.current, { y: '100%' });
    }
  }, []);

  const advance = () => {
    const nextIdx  = (idxRef.current + 1) % BRANDING_PROJECTS.length;
    const outgoing = activeRef.current === 'a' ? layerARef.current : layerBRef.current;
    const incoming = activeRef.current === 'a' ? layerBRef.current : layerARef.current;
    if (!outgoing || !incoming) return;
    incoming.style.backgroundImage = `url(${BRANDING_PROJECTS[nextIdx].image})`;
    gsap.set(incoming, { y: '100%' });
    gsap.to(outgoing, { y: '-100%', duration: 0.55, ease: 'power3.inOut' });
    gsap.to(incoming, { y: '0%',   duration: 0.55, ease: 'power3.inOut' });
    activeRef.current = activeRef.current === 'a' ? 'b' : 'a';
    idxRef.current    = nextIdx;
    setIdx(nextIdx);
  };

  useEffect(() => {
    if (hovered) {
      intervalRef.current = setInterval(advance, 2000);
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [hovered]);

  return (
    <div
      className={s.card}
      style={{ aspectRatio: '16/9', cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={s.cardMeta} style={{ height: '36px', paddingTop: '10px' }}>
        <p className={s.cardMetaText} style={{ opacity: 1 }}>Брендинг</p>
      </div>
      <div className={s.cardImage} style={{ position: 'relative' }}>
        <div ref={layerARef} style={{ position: 'absolute', inset: 0, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div ref={layerBRef} style={{ position: 'absolute', inset: 0, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      </div>
      <div className={s.cardBottom} style={{ height: hovered ? '50px' : '0', paddingTop: hovered ? '20px' : '0', paddingBottom: hovered ? '10px' : '0', marginTop: hovered ? 10 : 0, transition: 'height 0.35s ease, padding 0.35s ease, margin-top 0.35s ease' }}>
        <p className={s.cardBottomText} style={{ opacity: hovered ? 1 : 0 }}>
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {BRANDING_PROJECTS[idx].name}
          </span>
          <span className={s.cardLink}>Перейти</span>
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function InstrumentsPage({ onNavigateCases, onNavigatePolicy, onGridMode }: { onNavigateCases?: () => void; onNavigatePolicy?: () => void; onGridMode?: (on: boolean) => void }) {
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
      <h1 className={s.title}>Подход</h1>
      <div className={s.body} style={{ paddingLeft: 20, paddingRight: 20 }}>

        <AccordionSection
          heading="Когда бизнес идёт вперёд, а дизайн стоит на месте"
          items={problems}
        />

        <Section heading="Как мы работаем" items={approach} />

        {/* ── Миссия ── */}
        <div style={{ marginTop: 200, marginBottom: 200, textAlign: 'center' }}>
          <p style={{ ...textStyle, margin: 0 }}>Наша миссия</p>
          <h1 style={{ ...headingStyle, margin: '10px 0 0' }}>
            Создавать решения, которые удивляют простотой формы.
          </h1>
        </div>

        {/* ── Инструменты (дублирует блок с главной) ── */}
        <ToolsSection />

        {/* ── Кейсы — те же, что в основном разделе кейсов (показываем первые 3) ── */}
        <div style={{ marginTop: 200, marginBottom: 200 }}>
          <div style={{ marginBottom: 40 }}>
            <p style={headingStyle}>Кейсы</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, rowGap: 60 }}>
            {PROJECTS.slice(0, 3).map(p => (
              <CaseCard key={p.id} ar={p.ar as '16/9' | '3/4'} title={p.title} desc={p.desc} image={p.image} />
            ))}
          </div>
        </div>

        {/* ── Медиа (дублирует блок с главной) ── */}
        <MediaSection />

        <ContactForm onNavigatePolicy={onNavigatePolicy} onGridMode={onGridMode} />

      </div>
    </div>
  );
}
