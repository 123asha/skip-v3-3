import { useState, useLayoutEffect, useEffect, useRef } from 'react';
import { usePinchSteps } from '../hooks/usePinchSteps';
import s from '../App.module.css';
import { MagneticDivider } from './MagneticDivider';
import { typo } from '../utils/typography';
import PillButton from './PillButton';
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
// Placeholder for the rest of an insight in the «Вся мысль» view, until the
// real articles are in
const FULL_PLACEHOLDER = [
  'Текст-рыба. Здесь будет продолжение мысли: как мы пришли к этому подходу, на каких проектах его проверяли и где он работает лучше всего. Абзац средней длины, чтобы оценить ритм колонки.',
  'Второй абзац рыбы. Разбираем пример из практики: исходная задача, первая гипотеза, что пошло не так и как её переформулировали. Детали и цифры появятся в финальной версии.',
  'Третий абзац рыбы — выводы и то, как применить подход в своей команде: с чего начать, какие вопросы задать, на что обратить внимание, чтобы не повторить наших ошибок.',
  'Короткий финальный абзац рыбы.',
];

const tools: { name: string; desc: string; year?: string; source?: string; href?: string; body?: [string, string]; full?: string[] }[] = [
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

export function ToolsList({ toolsRowsRef, showZoom = false }: {
  toolsRowsRef?: React.RefObject<HTMLDivElement> | null;
  /** ⌘ ⊕ ⊖ above the table, same control as on the services page */
  showZoom?: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  // Several rows can stay open at once — opening one no longer closes the rest
  const [expanded, setExpanded] = useState<number[]>([]);
  const toggleRow = (i: number) =>
    setExpanded(prev => (prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]));
  // Three depths, stepped with ⊕ ⊖ like the density zoom on the cases page:
  //   Коротко  — every row closed
  //   Средне   — every row open (two paragraphs side by side)
  //   Вся мысль — one insight read in full on the right, the rest a list
  //               on the left; clicking one in the list opens it instead
  const [full, setFull] = useState<number | null>(null);
  // Seamless switch between the table and the «Вся мысль» list: years and
  // titles are noted before the swap and glide from there into their new
  // places after it (FLIP)
  const flipSnap = useRef<Map<string, DOMRect> | null>(null);
  const snapFlip = () => {
    flipSnap.current = new Map([...document.querySelectorAll<HTMLElement>('[data-flip]')]
      .map(el => [el.dataset.flip!, el.getBoundingClientRect()]));
  };
  useLayoutEffect(() => {
    const prev = flipSnap.current;
    flipSnap.current = null;
    if (!prev) return;
    const pz = parseFloat(document.documentElement.style.zoom || '1') || 1;
    document.querySelectorAll<HTMLElement>('[data-flip]').forEach(el => {
      const was = prev.get(el.dataset.flip!);
      if (!was) return;
      const now = el.getBoundingClientRect();
      const dx = (was.left - now.left) / pz, dy = (was.top - now.top) / pz;
      if (Math.abs(dx) + Math.abs(dy) < 1) return;
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
        { duration: 650, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    });
  }, [full]);
  const unfold = () => {
    if (full !== null) return;
    if (expanded.length === tools.length) { snapFlip(); setFull(0); }
    else setExpanded(tools.map((_, i) => i));
  };
  const fold = () => {
    if (full !== null) { snapFlip(); setFull(null); setExpanded(tools.map((_, i) => i)); }
    else setExpanded([]);
  };
  // The key listener below is bound once — route it to the current handlers
  const zoomActs = useRef({ fold, unfold });
  zoomActs.current = { fold, unfold };
  // Trackpad pinch steps the depth, same as ⊕ ⊖
  usePinchSteps(unfold, fold, showZoom);

  // ⌘+ / ⌘− do the same as the two buttons, as on the cases and services pages
  useEffect(() => {
    if (!showZoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;
      if (e.key === '-') { e.preventDefault(); zoomActs.current.fold(); }
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomActs.current.unfold(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showZoom]);

  // Start of the grid's second column, where the cases page pins its hint
  const [col2Left, setCol2Left] = useState(0);
  useLayoutEffect(() => {
    if (!showZoom) return;
    const measure = () => {
      const page = document.querySelector('[class*="_page_"]') as HTMLElement | null;
      const width = page?.clientWidth ?? window.innerWidth;
      const cs = getComputedStyle(document.documentElement);
      const pad = parseFloat(cs.getPropertyValue('--pad'));
      const gap = parseFloat(cs.getPropertyValue('--gap'));
      setCol2Left(pad + (width - 2 * pad - 4 * gap) / 5 + gap);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [showZoom]);
  // Same duration / easing as the services table
  const EXPAND = '0.7s cubic-bezier(0.22, 1, 0.36, 1)';
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
        {typo(text)}
      </p>
      {showLink && href && (
        <PillButton href={href} style={{ marginTop: 20 }}>Перейти</PillButton>
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

  const zoomUI = !isMobile && showZoom && (
    <div style={{
      position: 'fixed', left: 'var(--pad)', bottom: 'var(--pad)', zIndex: 170,
      display: 'inline-flex', alignItems: 'center', gap: 6, ...headerStyle,
    }}>
      <span>⌘</span>
      <button onClick={fold} aria-label="Свернуть" style={{ font: 'inherit', color: 'inherit', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>⊖</button>
      <button onClick={unfold} aria-label="Развернуть" style={{ font: 'inherit', color: 'inherit', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>⊕</button>
    </div>
  );

  // ── Вся мысль ──────────────────────────────────────────────────────────────
  if (!isMobile && full !== null) {
    return (
      <div ref={toolsRowsRef ?? undefined} className={s.toolsList}>
        {zoomUI}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', columnGap: 'var(--gap)', paddingBottom: 12 }}>
          <p style={{ ...headerStyle, gridColumn: '1 / 3', display: 'flex', gap: 10 }}>
            <span style={{ width: '4ch' }}>Год</span><span>Название</span>
          </p>
          <p style={{ ...headerStyle, gridColumn: '3 / 5' }}>Вся мысль</p>
        </div>
        {/* Still a table: one row per insight, year and title side by side
            (10px apart). The open one carries its whole piece in its own row,
            one column, no «Перейти»; clicking another row opens that one. */}
        {tools.map((row, i) => {
          const open = i === full;
          const rb = row.body ?? BODY_PLACEHOLDER;
          const paragraphs = row.full ?? [rb[0], rb[1], ...FULL_PLACEHOLDER];
          return (
            <div
              key={i}
              onClick={() => setFull(i)}
              style={{
                position: 'relative', cursor: open ? 'default' : 'pointer', padding: '10px 0 12px',
                display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', columnGap: 'var(--gap)', alignItems: 'start',
              }}
            >
              <MagneticDivider />
              <p className={s.toolRowText} style={{
                gridColumn: '1 / 3', margin: 0, display: 'flex', gap: 10,
                opacity: (open ? 1 : 'var(--opacity-muted)') as any,
                transition: 'opacity 0.3s ease',
              }}>
                <span data-flip={`y${i}`} style={{ width: '4ch', flexShrink: 0, display: 'inline-block' }}>{row.year}</span>
                <span data-flip={`t${i}`} style={{ display: 'inline-block' }}>{typo(row.desc)}</span>
              </p>
              <div style={{ gridColumn: '3 / 5', display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.6s cubic-bezier(0.22, 1, 0.36, 1)' }}>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ paddingBottom: open ? 20 : 0, opacity: open ? 1 : 0, transition: 'opacity 0.4s ease' }}>
                    {paragraphs.map((para, k) => (
                      <p key={k} className={s.toolRowText} style={{ margin: 0, marginTop: k ? 12 : 0 }}>{typo(para)}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      ref={toolsRowsRef ?? undefined}
      className={s.toolsList}
      onMouseLeave={isMobile ? undefined : () => setHovered(null)}
    >
      {/* Table header — desktop only */}
      {/* Year (col 1) · type (col 2) · title and its previews (cols 3–5) */}
      {!isMobile && showZoom && (
        // ⌘ ⊕ ⊖ in the bottom-left corner, where the «написать нам» button
        // used to sit — same place as on the cases page.
        <div style={{
          position: 'fixed', left: 'var(--pad)', bottom: 'var(--pad)', zIndex: 170,
          display: 'inline-flex', alignItems: 'center', gap: 6, ...headerStyle,
        }}>
          <span>⌘</span>
          <button
            onClick={fold}
            aria-label="Свернуть все"
            style={{ font: 'inherit', color: 'inherit', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >⊖</button>
          <button
            onClick={unfold}
            aria-label="Раскрыть все"
            style={{ font: 'inherit', color: 'inherit', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >⊕</button>
        </div>
      )}
      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', columnGap: 'var(--gap)', paddingBottom: 12 }}>
          <p style={headerStyle}>Год</p>
          <p style={headerStyle}>Название</p>
          <p style={{ ...headerStyle, gridColumn: '3 / 6' }}>{expanded.length ? 'Средне' : 'Коротко'}</p>
        </div>
      )}
      {tools.map((tool, i) => {
        const isOpen = expanded.includes(i);
        const body = tool.body ?? BODY_PLACEHOLDER;
        const meta = tool.source ?? tool.year;
        // Hover dimming — applied per cell so the divider lines stay untouched.
        // An open row keeps full contrast: it is the one being read.
        const fade: React.CSSProperties = {
          opacity: (hovered !== null && hovered !== i && !isOpen ? 'var(--opacity-muted)' : 1) as any,
          transition: `opacity ${EXPAND}`,
        };
        return (
          <div
            key={i}
            className={s.toolRow}
            style={isMobile
              ? { cursor: 'pointer', position: 'relative', display: 'block', paddingTop: 16, touchAction: 'manipulation' }
              : { cursor: 'pointer', position: 'relative' }}
            onMouseEnter={isMobile ? undefined : () => setHovered(i)}
            onClick={() => toggleRow(i)}
          >
            {/* Divider keeps one constant colour everywhere — the hover dimming
                below sits on the text cells, never on the line. Flat on mobile
                so touch scroll can't bend it. */}
            <MagneticDivider flat={isMobile} />

            {isMobile ? (
              // Mobile: name (left) + year (right), title below, then the
              // expandable two-paragraph preview stacked full width.
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, ...fade }}>
                  <span className={s.toolRowText}>{tool.name}</span>
                  {tool.href && <span className={s.toolRowText} style={{ color: 'var(--c-text)', opacity: isOpen ? 1 : 'var(--opacity-muted)' as any, flexShrink: 0 }}>⤴</span>}
                </div>
                <p className={s.toolRowText} style={{ margin: 0, marginTop: 8, ...fade }}>{typo(tool.desc)}</p>
                <div style={{ ...fade, display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr', transition: `grid-template-rows ${EXPAND}, opacity ${EXPAND}` }}>
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
              // Desktop: year (col 1) | title+arrow (col 2) | type (col 4)
              <>
                <p className={s.toolRowText} style={{ gridColumn: '1', margin: 0, ...fade }}><span data-flip={`y${i}`} style={{ display: 'inline-block' }}>{tool.year}</span></p>
                {/* Type, with the hover glyph pinned to the column's right edge */}
                <div style={{ gridColumn: '2', display: 'flex', alignItems: 'baseline', ...fade }}>
                  <p className={s.toolRowText} style={{ margin: 0 }}><span data-flip={`t${i}`} style={{ display: 'inline-block' }}>{typo(tool.desc)}</span></p>
                  <span style={{ flex: 1 }} />
                  {tool.href && (
                    <span
                      className={`${s.toolRowText} ${s.toolRowTextRight}`}
                      style={{
                        color: 'var(--c-text)',
                        // Only a closed row offers to open — no arrow once it is open
                        opacity: !isOpen && hovered === i ? 1 : 0,
                        transition: 'opacity 0.2s ease',
                        flexShrink: 0,
                      }}
                    >⤴</span>
                  )}
                </div>
                {/* Short → medium: closed, the start of the article in one
                    column, two lines; opened, it runs on in the same place and
                    the next paragraph joins it on the same line, then «Перейти» */}
                <div style={{ gridColumn: '3 / 6', ...fade }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--gap)', alignItems: 'start' }}>
                    <p className={s.toolRowText} style={{
                      margin: 0, position: 'relative', zIndex: 2,
                      display: '-webkit-box', WebkitLineClamp: isOpen ? 4 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>{typo(body[0])}</p>
                    <p className={s.toolRowText} style={{
                      margin: 0,
                      display: '-webkit-box', WebkitLineClamp: isOpen ? 4 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      opacity: isOpen ? 1 : 0,
                      transition: `opacity ${EXPAND}`,
                      pointerEvents: isOpen ? undefined : 'none',
                    }}>{typo(body[1])}</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr', transition: `grid-template-rows ${EXPAND}` }}>
                    <div style={{ overflow: 'hidden' }}>
                      {tool.href && (
                        <div style={{ paddingTop: 20, paddingBottom: 20 }}>
                          <PillButton href={tool.href}>Перейти</PillButton>
                        </div>
                      )}
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

/** showHeading=false drops the section's own h2 — used where the page title
 *  already names the block (the Инсайты page). */
export function MediaSection({ toolsRowsRef, showHeading = true, flushTop = false, showZoom = false }: {
  toolsRowsRef?: React.RefObject<HTMLDivElement> | null;
  showHeading?: boolean;
  /** ⌘ ⊕ ⊖ over the table — unfolds and folds the rows one at a time */
  showZoom?: boolean;
  /** Drop the section's own top margin — for pages whose body already
   *  carries the title → content gap. */
  flushTop?: boolean;
}) {
  return (
    <div className={s.section} style={flushTop ? { marginTop: 0 } : undefined}>
      <div className={s.tools}>
        {showHeading && <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--heading-size)',
          fontWeight: 'var(--heading-weight)' as React.CSSProperties['fontWeight'],
          lineHeight: 'var(--heading-lh)',
          letterSpacing: 'var(--heading-ls)',
          color: 'var(--c-text)',
          margin: 0,
        }}>Экспертиза</h2>}
        <ToolsList toolsRowsRef={toolsRowsRef} showZoom={showZoom} />
      </div>
    </div>
  );
}
