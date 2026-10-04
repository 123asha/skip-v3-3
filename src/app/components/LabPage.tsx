import { useEffect, useRef } from 'react';
import s from './CasesPage.module.css';
import { MediaSection } from './MediaSection';
import ContactForm from './ContactForm';
import { H2_STYLE, TEXT_STYLE, typo } from '../utils/typography';
import { INSIGHTS_LIST, isInternal } from '../content/insights';
import { goTo, siteHref } from '../utils/siteNav';
import { useMobile } from '../hooks/useMobile';

const MONTHS_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Top of the insights page: the articles as text, grouped under their month
// (titles stepped in under it), the groups flowing in two columns
function InsightList() {
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
      marginBottom: 'var(--space-xl)', columnCount: isMobile ? 1 : 2, columnGap: 'var(--gap)',
      // Desktop: the page grid's first two columns, one group-column each
      width: isMobile ? undefined : 'calc((100% - 4 * var(--gap)) / 5 * 2 + var(--gap))',
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
              style={{ ...TEXT_STYLE, display: 'block', padding: '3px 0 3px 20px', color: 'var(--c-text)', textDecoration: 'none' }}
            >{typo(it.desc)}</a>
          ))}
        </div>
      ))}
    </div>
  );
}
import { useReveal } from '../hooks/useReveal';
import { LANG } from '../i18n';

export default function LabPage({
  onNavigatePolicy,
  onGridMode,
}: {
  onNavigatePolicy?: () => void;
  onGridMode?: (on: boolean) => void;
}) {
  const pageRef = useRef<HTMLDivElement>(null);

  useReveal(pageRef);

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
      <div className={s.body} style={{ paddingTop: 'var(--inner-content-top)', paddingLeft: 'var(--pad)', paddingRight: 'var(--pad)', paddingBottom: 0 }}>


        {/* MediaSection (Инсайты) above the contact form — its own h2 is off,
            the page title already says "Инсайты". */}
        {/* flushTop — the page body already carries the title → content gap,
            so the section must not add its own on top of it. */}
        <InsightList />
        {/* The table below is the archive of every insight — Russian only:
            the English site shows just the cards */}
        {LANG !== 'en' && <>
        <h2 style={{ ...H2_STYLE, margin: '0 0 40px' }}>Архив</h2>
        <div style={{ marginLeft: 'calc(-1 * var(--pad))', marginRight: 'calc(-1 * var(--pad))' }}>
          {/* showZoom off here — InsightCards above already carries the
              page's one ⌘ ⊖ ⊕ control */}
          <MediaSection showHeading={false} flushTop bandHeader />
        </div>
        </>}
        <ContactForm onNavigatePolicy={onNavigatePolicy} onGridMode={onGridMode} />
      </div>
    </div>
  );
}
