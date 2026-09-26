import { useEffect, useRef } from 'react';
import s from './CasesPage.module.css';
import { MediaSection } from './MediaSection';
import ContactForm from './ContactForm';
import { useReveal } from '../hooks/useReveal';

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
      <h1 className={s.title} data-reveal="" data-reveal-y="4">Инсайты</h1>
      <div className={s.body} style={{ paddingLeft: 'var(--pad)', paddingRight: 'var(--pad)', paddingBottom: 0 }}>


        {/* MediaSection (Инсайты) above the contact form — its own h2 is off,
            the page title already says "Инсайты". */}
        {/* flushTop — the page body already carries the title → content gap,
            so the section must not add its own on top of it. */}
        <div style={{ marginLeft: 'calc(-1 * var(--pad))', marginRight: 'calc(-1 * var(--pad))' }}>
          <MediaSection showHeading={false} flushTop showZoom />
        </div>
        <ContactForm onNavigatePolicy={onNavigatePolicy} onGridMode={onGridMode} />
      </div>
    </div>
  );
}
