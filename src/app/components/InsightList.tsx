import { TEXT_STYLE, typo } from '../utils/typography';
import { INSIGHTS_LIST, isInternal } from '../content/insights';
import { goTo, siteHref } from '../utils/siteNav';
import { useMobile } from '../hooks/useMobile';
import { LANG } from '../i18n';

const MONTHS_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// The articles as text: the year in the page grid's first column, the
// months (titles stepped in under each) in one column beside it
export function InsightList({ current, flush }: { current?: string; flush?: boolean } = {}) {
  const isMobile = useMobile();
  const names = LANG === 'en' ? MONTHS_EN : MONTHS_RU;
  const years: { year: string; months: { label: string; items: typeof INSIGHTS_LIST }[] }[] = [];
  for (const it of INSIGHTS_LIST) {
    const [, m, y] = (it.date ?? '').split('.');
    const year = y ?? it.year ?? '';
    const label = m ? names[Number(m) - 1] : '';
    let yg = years[years.length - 1];
    if (!yg || yg.year !== year) { yg = { year, months: [] }; years.push(yg); }
    const last = yg.months[yg.months.length - 1];
    if (last && last.label === label) last.items.push(it);
    else yg.months.push({ label, items: [it] });
  }
  // Tracks in % of the list's box, which spans the page's full content width
  const col = 'calc((100% - 4 * var(--gap)) / 5)';
  return (
    <div style={{ marginBottom: flush ? 0 : 'var(--space-xl)' }}>
      {years.map(yg => (
        <div key={yg.year} style={{
          // Year, then its months a step in, then the titles a step further —
          // all in the page grid's first column
          width: isMobile ? undefined : col, 
          marginBottom: 20,
        }}>
          <p style={{ ...TEXT_STYLE, margin: '0 0 20px' }}>{yg.year}</p>
          <div style={{ paddingLeft: 20 }}>
            {yg.months.map(g => (
              <div key={g.label} style={{ marginBottom: 20 }}>
                {g.label && <p style={{ ...TEXT_STYLE, margin: '0 0 20px' }}>{g.label}</p>}
                {g.items.map((it, i) => (
                  <a
                    key={it.href ?? i}
                    href={isInternal(it.href) ? siteHref(it.href!) : it.href}
                    target={isInternal(it.href) ? undefined : '_blank'}
                    rel={isInternal(it.href) ? undefined : 'noopener noreferrer'}
                    onClick={isInternal(it.href) ? e => { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); goTo(it.href!); } : undefined}
                    data-insight-link=""
                    style={{ ...TEXT_STYLE, pointerEvents: 'auto', display: 'block', padding: '3px 0 3px 20px', color: 'var(--c-text)', opacity: current && it.slug !== current ? 'var(--opacity-muted)' as any : 1, textDecoration: 'none', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}
                  >{typo(it.desc)}</a>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
