import { TEXT_STYLE, typo } from '../utils/typography';
import { INSIGHTS_LIST, isInternal } from '../content/insights';
import { goTo, siteHref } from '../utils/siteNav';
import { useMobile } from '../hooks/useMobile';
import { LANG } from '../i18n';

const MONTHS_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Top of the insights page: the articles as text, grouped under their month
// (titles stepped in under it), the groups flowing in two columns
export function InsightList({ oneColumn, current }: { oneColumn?: boolean; current?: string } = {}) {
  const isMobile = useMobile();
  const groups: { label: string; items: typeof INSIGHTS_LIST }[] = [];
  for (const it of INSIGHTS_LIST) {
    const [, m, y] = (it.date ?? '').split('.');
    const names = LANG === 'en' ? MONTHS_EN : MONTHS_RU;
    const label = m ? `${names[Number(m) - 1]}${Number(y) !== new Date().getFullYear() ? ` ${y}` : ''}` : (it.year ?? '');
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(it);
    else groups.push({ label, items: [it] });
  }
  return (
    <div style={{
      marginBottom: oneColumn ? 0 : 'var(--space-xl)', columnCount: isMobile || oneColumn ? 1 : 2, columnGap: 'var(--gap)',
      // Desktop: the page grid's first two columns, one group-column each
      width: isMobile || oneColumn ? undefined : 'calc((100% - 4 * var(--gap)) / 5 * 2 + var(--gap))',
    }}>
      {groups.map(g => (
        <div key={g.label} style={{ breakInside: 'avoid', marginBottom: 32 }}>
          <p style={{ ...TEXT_STYLE, margin: '0 0 6px', opacity: 'var(--opacity-muted)' as any }}>{g.label}</p>
          {g.items.map((it, i) => (
            <a
              key={it.href ?? i}
              href={isInternal(it.href) ? siteHref(it.href!) : it.href}
              target={isInternal(it.href) ? undefined : '_blank'}
              rel={isInternal(it.href) ? undefined : 'noopener noreferrer'}
              onClick={isInternal(it.href) ? e => { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); goTo(it.href!); } : undefined}
              data-insight-link=""
              style={{ ...TEXT_STYLE, display: 'block', padding: '3px 0 3px 20px', color: 'var(--c-text)', opacity: current && it.slug !== current ? 'var(--opacity-muted)' as any : 1, textDecoration: 'none', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}
            >{typo(it.desc)}</a>
          ))}
        </div>
      ))}
    </div>
  );
}
