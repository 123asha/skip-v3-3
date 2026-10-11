import { INSIGHTS_GROUPED, isInternal } from '../content/insights';
import { goTo, siteHref } from '../utils/siteNav';
import { typo } from '../utils/typography';
import s from './InsightLines.module.css';

// Index of the insights in two columns: down the left one and on into the
// right. Grey numbers (01, 02, and 02.1, 02.2 for the pieces that follow on
// from 02), then the titles — the follow-ups a little further in — and the
// date on the right. A blank line between groups. The newest insight stands
// opened, its opening lines under the title.

const MONTHS = ['янв.', 'февр.', 'марта', 'апр.', 'мая', 'июня', 'июля', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];

// 27.09.2026 → «27 сент.»; another year keeps it: «25 окт. 2025»
const shown = (date?: string, year?: string) => {
  if (!date) return year ?? '';
  const [d, m, y] = date.split('.').map(Number);
  return `${d} ${MONTHS[m - 1]}` + (y === new Date().getFullYear() ? '' : ` ${y}`);
};

type Item = (typeof INSIGHTS_GROUPED)[number];

// `open` — shown opened: its opening lines under the title, and «Читать»
function Row({ it, num, sub, open }: { it: Omit<Item, 'children'>; num: string; sub?: boolean; open?: boolean }) {
  const href = it.href;
  const inner = isInternal(href);
  return (
    <a
      className={s.line}
      data-sub={sub ? '' : undefined}
      href={inner ? siteHref(href!) : href}
      target={inner ? undefined : '_blank'}
      rel={inner ? undefined : 'noopener noreferrer'}
      onClick={inner ? e => { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); goTo(href!); } : undefined}
    >
      <span className={s.num}>{num}</span>
      <span className={s.name}>{typo(it.desc)}</span>
      <span className={s.date}>{shown(it.date, it.year)}</span>
      {open && it.body && (
        <span className={s.lead}>
          {it.body.map((p, k) => <span key={k} className={s.para}>{typo(p)}</span>)}
          <span className={s.read}>Читать</span>
        </span>
      )}
    </a>
  );
}

export function InsightLines() {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className={s.list}>
      {INSIGHTS_GROUPED.map((it, i) => (
        <div key={it.slug ?? it.href ?? i} className={s.group} data-reveal="">
          {/* The newest one stands opened */}
          <Row it={it} num={pad(i + 1)} open={i === 0} />
          {it.children.map((c, k) => <Row key={c.slug ?? k} it={c} num={`${pad(i + 1)}.${k + 1}`} sub />)}
        </div>
      ))}
    </div>
  );
}
