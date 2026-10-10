import { useEffect, useRef } from 'react';
import s from './CasesPage.module.css';
import ContactForm from './ContactForm';
import { H2_STYLE } from '../utils/typography';
import { InsightList } from './InsightList';
import { InsightLines } from './InsightLines';
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


        {/* The English site keeps the list */}
        {LANG === 'en' && <InsightList />}
        {/* Russian: the lined index — numbers, titles, dates on notebook rules */}
        {LANG !== 'en' && <InsightLines />}
        <ContactForm onNavigatePolicy={onNavigatePolicy} onGridMode={onGridMode} />
      </div>
    </div>
  );
}
