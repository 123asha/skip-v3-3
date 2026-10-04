import { useEffect, useRef } from 'react';
import s from './CasesPage.module.css';
import { MediaSection } from './MediaSection';
import ContactForm from './ContactForm';
import { H2_STYLE } from '../utils/typography';
import { InsightList } from './InsightList';
import { useMobile } from '../hooks/useMobile';

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
        {/* The insights as a table (Russian); the English site keeps the list */}
        {LANG === 'en' && <InsightList />}
        {LANG !== 'en' && <>
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
