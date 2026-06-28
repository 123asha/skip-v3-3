import { useState } from 'react';
import s from '../App.module.css';
import { MagneticDivider } from './MagneticDivider';
import { useMobile } from '../hooks/useMobile';

// Placeholder body shown when a row is expanded — two short paragraphs (one per
// column), roughly three lines each. Replace per-item via the optional `body`
// field once real copy lands.
const BODY_PLACEHOLDER: [string, string] = [
  'Короткий вводный абзац: о чём материал и почему мы взялись за эту тему. Буквально пара предложений.',
  'Второй абзац — главный вывод и что из этого можно применить у себя. Тоже совсем коротко.',
];

// "Инсайты": published articles (with a year) + our own tools / frameworks
// (no year, sometimes no external link), all in one media-style list. Each row
// expands on click to reveal a two-paragraph preview.
const tools: { name: string; desc: string; year?: string; source?: string; href?: string; body?: [string, string] }[] = [
  {
    name: 'Фреймворк',
    desc: 'Конструктор миссии',
    year: '2026',
    source: 'VC',
    href: 'https://vc.ru/marketing/2205037-konstruktor-missii-dlya-brenda',
    body: [
      'В основе конструктора — идея, что к ответу на вопрос «Почему мы этим занимаемся?» можно прийти четырьмя разными путями.',
      'Поиск миссии бренда часто превращается в гонку за идеальной фразой, как у Nike или Apple. Команды попадают в ловушку: штурмят, креативят, запираются в переговорках, чтобы найти те самые вдохновляющие слова.',
    ],
  },
  {
    name: 'Статья',
    desc: 'Критерии для проверки идей',
    year: '2026',
    source: 'Workspace',
    href: 'https://workspace.ru/blog/prompt-dlya-proverki-metafory-s-pomoschyu-ii/',
    body: [
      'Когда нет метафоры, любая концепция рассыпается. Получается набор приёмов, которые не держат форму.',
      'В Skip Design мы используем собственную методологию. Каждый критерий — вопрос, который проверяет метафору по шкале от 1 до 5.',
    ],
  },
  {
    name: 'Статья',
    desc: 'Как ИИ генерирует метафоры',
    year: '2026',
    source: 'Workspace',
    href: 'https://workspace.ru/blog/kak-ii-generiruet-metafory/',
    body: [
      '5 нейросетей, 3 индустрии, 150 метафор — выясняем, почему повсюду архитекторы, дирижёры и навигаторы.',
      'В этой статье мы говорим «метафора», но не как средство языка и приём в тексте на лендинге, а шире. Метафора помогает быстро передать суть через знакомый образ и задаёт фрейм — рамку, которая определяет, как мы воспринимаем реальность и принимаем решения.',
    ],
  },
  {
    name: 'Памятка',
    desc: 'Памятка по юридическим документам',
    year: '2026',
    source: 'VC',
    href: 'https://vc.ru/marketing/2784990-yuridicheskie-dokumenty-dlya-saytov-i-prilozheniy',
    body: [
      'Получилась практическая памятка для продуктовых команд, дизайнеров и фаундеров.',
      'Когда запускают сайт, приложение или бота, про юридическую часть часто вспоминают в последнюю очередь — уже после релиза.',
    ],
  },
  {
    name: 'Статья',
    desc: 'Почему не все бренды могут использовать ИИ',
    year: '2026',
    source: 'Workspace',
    href: 'https://workspace.ru/blog/pochemu-odni-brendy-mogut-ispolzovat-ii-drugie-net/',
    body: [
      'Объясняем на примере трёх классических ограничений «быстро — качественно — дёшево», почему одни бренды могут использовать ИИ, а другие — нет.',
      'Если переложить модель на терминологию брендинга, она помогает понять, на чём бренд делает главный акцент и что именно обещает своим клиентам.',
    ],
  },
];

export function ToolsList({ toolsRowsRef }: { toolsRowsRef?: React.RefObject<HTMLDivElement> | null }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const isMobile = useMobile();

  // A preview paragraph capped at 4 lines. When it links to an article the text
  // is clamped to 3 lines and a grey "Читать" sits on the 4th line; without a
  // link it simply clamps to 4 lines. The link stays grey always (no row-hover
  // brighten) and stops propagation so it doesn't toggle the row.
  // showLink — show "Перейти" under this paragraph (only the second one).
  // The link sits 20px below the text.
  const Preview = ({ text, href, col, showLink }: { text: string; href?: string; col?: string; showLink?: boolean }) => (
    <div style={{ gridColumn: col, minWidth: 0 }}>
      <p
        className={s.toolRowText}
        style={{
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {text}
      </p>
      {showLink && href && (
        <a
          className={s.toolRowText}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'inline-block',
            marginTop: 20,
            color: 'var(--c-text)',
            opacity: 'var(--opacity-muted)',
            textDecoration: 'underline',
            textDecorationStyle: 'dotted',
            cursor: 'pointer',
          }}
        >
          Перейти
        </a>
      )}
    </div>
  );

  const headerStyle: React.CSSProperties = {
    opacity: 'var(--opacity-muted)' as any,
    fontFamily: 'var(--font)',
    fontSize: 'var(--text-size)',
    lineHeight: 'var(--text-lh)',
    letterSpacing: 'var(--text-ls)',
    margin: 0,
  };

  return (
    <div
      ref={toolsRowsRef ?? undefined}
      className={s.toolsList}
      onMouseLeave={isMobile ? undefined : () => setHovered(null)}
    >
      {/* Table header — desktop only */}
      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', columnGap: 'var(--gap)', paddingBottom: 12 }}>
          <p style={headerStyle}>Год</p>
          <p style={headerStyle}>Тип</p>
          <p style={{ ...headerStyle, gridColumn: '3 / 6' }}>Название</p>
        </div>
      )}
      {tools.map((tool, i) => {
        const isOpen = expanded === i;
        const body = tool.body ?? BODY_PLACEHOLDER;
        const meta = tool.source ?? tool.year;
        return (
          <div
            key={i}
            className={s.toolRow}
            style={isMobile
              ? { cursor: 'pointer', position: 'relative', display: 'block', paddingTop: 16, touchAction: 'manipulation',
                  opacity: hovered !== null && hovered !== i ? 'var(--opacity-muted)' as any : 1,
                  transition: 'opacity 0.2s ease' }
              : { cursor: 'pointer', position: 'relative',
                  opacity: hovered !== null && hovered !== i ? 'var(--opacity-muted)' as any : 1,
                  transition: 'opacity 0.2s ease' }}
            onMouseEnter={isMobile ? undefined : () => setHovered(i)}
            onClick={() => setExpanded(isOpen ? null : i)}
          >
            {/* Always-dark divider — flat on mobile so touch scroll can't bend it */}
            <MagneticDivider color="var(--c-text)" active={hovered === i} flat={isMobile} />

            {isMobile ? (
              // Mobile: name (left) + year (right), title below, then the
              // expandable two-paragraph preview stacked full width.
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                  <span className={s.toolRowText}>{tool.name}</span>
                  {tool.href && <span className={s.toolRowText} style={{ color: 'var(--c-text)', opacity: isOpen ? 1 : 'var(--opacity-muted)' as any, flexShrink: 0 }}>⤴</span>}
                </div>
                <p className={s.toolRowText} style={{ margin: 0, marginTop: 8 }}>{tool.desc}</p>
                <div style={{ display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr', transition: 'grid-template-rows 0.4s ease' }}>
                  <div style={{ overflow: 'hidden' }}>
                    {/* Block is 2/3 screen width, right-aligned */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12 }}>
                      <div style={{ width: 'calc(2/3 * 100%)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <Preview text={body[0]} />
                        <Preview text={body[1]} href={tool.href} showLink />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Desktop: year (col 1) | type+arrow (col 2) | desc (cols 3–5)
              <>
                <p className={s.toolRowText} style={{ gridColumn: '1', margin: 0 }}>{tool.year}</p>
                <div style={{ gridColumn: '2', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <p className={s.toolRowText} style={{ margin: 0 }}>{tool.name}</p>
                  {tool.href && <span className={`${s.toolRowText} ${s.toolRowTextRight}`} style={{ color: 'var(--c-text)', opacity: isOpen ? 1 : 'var(--opacity-muted)' as any, flexShrink: 0 }}>⤴</span>}
                </div>
                <p className={s.toolRowText} style={{ gridColumn: '3 / 6', margin: 0, position: 'relative', zIndex: 2 }}>{tool.desc}</p>
                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr', transition: 'grid-template-rows 0.4s ease' }}>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--gap)', paddingTop: 16, paddingBottom: 20, alignItems: 'start' }}>
                      <Preview text={body[0]} col="3" />
                      <Preview text={body[1]} href={tool.href} col="4" showLink />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function MediaSection({ toolsRowsRef }: { toolsRowsRef?: React.RefObject<HTMLDivElement> | null }) {
  return (
    <div className={s.section}>
      <div className={s.tools}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--heading-size)',
          fontWeight: 'var(--heading-weight)' as React.CSSProperties['fontWeight'],
          lineHeight: 'var(--heading-lh)',
          letterSpacing: 'var(--heading-ls)',
          color: 'var(--c-text)',
          margin: 0,
        }}>Инсайты</h2>
        <ToolsList toolsRowsRef={toolsRowsRef} />
      </div>
    </div>
  );
}
