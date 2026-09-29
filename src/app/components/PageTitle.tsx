import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import s from './CasesPage.module.css';

/**
 * The section pages' title («Проекты Skip Design», «Инсайты команды»…), rendered at body level
 * next to the nav (inside the inner page's scroll layer Chrome blends it
 * against a transparent backdrop: white on white). It leaves with the page
 * (App's page exit) and fades in with the next one.
 *
 * `releaseAt` — selector of a block that, once its first line rises to the
 * title's cap line, carries the title up and away with it.
 */
export function SiteTitle({ title: text, releaseAt }: { title: string; releaseAt?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const title = ref.current;
    if (!releaseAt || !title) return;
    const update = () => {
      const block = document.querySelector<HTMLElement>(releaseAt);
      if (!block) return;
      const fs = parseFloat(getComputedStyle(title).fontSize);
      // Cap line of the title (fixed) vs. cap line of the block's first text
      // line (body text: baseline 0.9375em below the box top, caps ≈ 0.7em)
      const bodyFs = parseFloat(getComputedStyle(block).fontSize);
      const titleCap = title.offsetTop + 0.1375 * fs;
      const blockCap = block.getBoundingClientRect().top + (0.9375 - 0.7) * bodyFs;
      title.style.translate = `0 ${Math.min(0, blockCap - titleCap)}px`;
    };
    update();
    // Capture: the inner page scrolls in its own container, not the window
    window.addEventListener('scroll', update, { capture: true, passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, { capture: true });
      window.removeEventListener('resize', update);
    };
  }, [releaseAt]);

  return createPortal(
    <h1 ref={ref} className={`${s.title} ${s.titleCol2}`}>{text}</h1>,
    document.body,
  );
}

/**
 * Up arrow under the section title, shown once an inner page is scrolled all
 * the way down; a click glides back to the top. Sits where the title's own
 * line box ends (layout position — on /cases the title itself has scrolled
 * away by then), centred like the title.
 */
export function ScrollTopArrow() {
  const [shown, setShown] = useState(false);
  const [top, setTop] = useState(0);
  const scroller = () => document.querySelector<HTMLElement>('[class*="_page_"]');
  useEffect(() => {
    const check = () => {
      const page = scroller();
      if (!page) { setShown(false); return; }
      setShown(page.scrollTop + page.clientHeight >= page.scrollHeight - 60);
      const title = document.querySelector<HTMLElement>('body > h1[class*="titleCol2"]');
      if (title) {
        const space = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--space-xs')) || 0;
        setTop(title.offsetTop + title.offsetHeight + space);
      }
    };
    check();
    window.addEventListener('scroll', check, { capture: true, passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check, { capture: true });
      window.removeEventListener('resize', check);
    };
  }, []);

  return createPortal(
    <button
      aria-label="Наверх"
      onClick={() => scroller()?.scrollTo({ top: 0, behavior: 'smooth' })}
      style={{
        position: 'fixed', left: '50%', top, zIndex: 199,
        width: 40, height: 40, borderRadius: '50%', border: 'none', padding: 0,
        background: 'var(--c-text)', color: '#fff', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: shown ? 1 : 0,
        transform: `translate(-50%, ${shown ? 0 : 8}px)`,
        pointerEvents: shown ? 'auto' : 'none',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true">
        <path d="M6 13V1M1 6l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>,
    document.body,
  );
}
