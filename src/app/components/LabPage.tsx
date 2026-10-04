import { useEffect, useRef } from 'react';
import s from './CasesPage.module.css';
import { MediaSection } from './MediaSection';
import ContactForm from './ContactForm';
import { H2_STYLE, TEXT_STYLE, typo } from '../utils/typography';
import { INSIGHTS_LIST, isInternal } from '../content/insights';
import { goTo, siteHref } from '../utils/siteNav';
import { useMobile } from '../hooks/useMobile';

// Top of the insights page: just the articles as text — title, then date
function InsightList() {
  const isMobile = useMobile();
  return (
    <div style={{ marginBottom: 'var(--space-xl)' }}>
      {INSIGHTS_LIST.map((it, i) => (
        <a
          key={it.href ?? i}
          href={isInternal(it.href) ? siteHref(it.href!) : it.href}
          target={isInternal(it.href) ? undefined : '_blank'}
          rel={isInternal(it.href) ? undefined : 'noopener noreferrer'}
          onClick={isInternal(it.href) ? e => { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); goTo(it.href!); } : undefined}
          style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 'var(--gap)',
            padding: '6px 0', color: 'var(--c-text)', textDecoration: 'none',
          }}
        >
          <span style={{ ...TEXT_STYLE, paddingRight: isMobile ? 0 : 40 }}>{typo(it.desc)}</span>
          <span style={{ ...TEXT_STYLE, opacity: 'var(--opacity-muted)' as any }}>{it.shown}</span>
        </a>
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
