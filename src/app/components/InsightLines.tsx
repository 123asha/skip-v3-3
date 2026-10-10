import { INSIGHTS_GROUPED, isInternal } from '../content/insights';
import { goTo, siteHref } from '../utils/siteNav';
import { typo } from '../utils/typography';
import s from './InsightLines.module.css';

// Ruled-notebook index of the insights: the page is lined like a notebook,
// every line of text sits on its own rule. Grey numbers on the left (01, 02,
// and 02.1, 02.2 for the pieces that follow on from 02), the titles in the
// second column — the follow-ups half a column further in — and the date on
// the right. A blank line between groups; a few more blank lines close the list.

const MONTHS = ['янв.', 'февр.', 'марта', 'апр.', 'мая', 'июня', 'июля', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];

// 27.09.2026 → «27 сент.»; another year keeps it: «25 окт. 2025»
const shown = (date?: string, year?: string) => {
  if (!date) return year ?? '';
  const [d, m, y] = date.split('.').map(Number);
  return `${d} ${MONTHS[m - 1]}` + (y === new Date().getFullYear() ? '' : ` ${y}`);
};

type Item = (typeof INSIGHTS_GROUPED)[number];

function Row({ it, num, sub }: { it: Omit<Item, 'children'>; num: string; sub?: boolean }) {
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
    </a>
  );
}

export function InsightLines() {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className={s.list}>
      {INSIGHTS_GROUPED.map((it, i) => (
        <div key={it.slug ?? it.href ?? i} className={s.group} data-reveal="">
          <Row it={it} num={pad(i + 1)} />
          {it.children.map((c, k) => <Row key={c.slug ?? k} it={c} num={`${pad(i + 1)}.${k + 1}`} sub />)}
        </div>
      ))}
      {/* Blank lines under the last one, as on a notebook page */}
      <div className={s.tail} />
    </div>
  );
}
