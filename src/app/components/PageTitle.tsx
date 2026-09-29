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
 * Up arrow shown once an inner page is scrolled all the way down; a click
 * glides back to the top. Desktop: in the menu's row, just left of it and as
 * tall as it. Phone (menu at the bottom): centred in the top bar, on the
 * logo's line.
 */
export function ScrollTopArrow() {
  const [shown, setShown] = useState(false);
  const [pos, setPos] = useState<React.CSSProperties>({});
  const scroller = () => document.querySelector<HTMLElement>('[class*="_page_"]');
  useEffect(() => {
    const check = () => {
      const page = scroller();
      if (!page) { setShown(false); return; }
      setShown(page.scrollTop + page.clientHeight >= page.scrollHeight - 60);
      const nav = document.querySelector('nav')?.getBoundingClientRect();
      if (!nav) return;
      if (window.innerWidth <= 768) {
        // Top bar: the logo's box is 6px from the top, 52px tall
        setPos({ top: 6 + (52 - 30) / 2, left: '50%', transform: 'translateX(-50%)' });
      } else {
        const pz = parseFloat(document.documentElement.style.zoom || '1') || 1;
        setPos({ top: nav.top / pz, left: (nav.left / pz) - 10 - nav.height / pz, width: nav.height / pz, height: nav.height / pz });
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
        position: 'fixed', zIndex: 201,
        width: 30, height: 30, borderRadius: 4, border: 'none', padding: 0,
        background: 'var(--c-text)', color: '#fff', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...pos,
        opacity: shown ? 1 : 0,
        translate: `0 ${shown ? 0 : -6}px`,
        pointerEvents: shown ? 'auto' : 'none',
        transition: 'opacity 0.3s ease, translate 0.3s ease',
      }}
    >
      <svg width="10" height="12" viewBox="0 0 12 14" fill="none" aria-hidden="true">
        <path d="M6 13V1M1 6l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>,
    document.body,
  );
}
