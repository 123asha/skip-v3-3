import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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


  // Phone: the title lives inside the page's own scroll layer, so it scrolls
  // away natively — moving a pinned copy after the scroll made it shake in
  // iOS Safari
  const [host, setHost] = useState<Element>(document.body);
  useLayoutEffect(() => {
    if (window.innerWidth > 768) return;
    const page = document.querySelector('[class*="_page_"]');
    if (page) setHost(page);
  }, []);

  // Phone: publish the title's height (it may wrap), so the content starts
  // 40px under it (--inner-content-top, index.css)
  useEffect(() => {
    const title = ref.current;
    if (!title) return;
    const root = document.documentElement;
    const measure = () => root.style.setProperty('--m-title-h', `${title.offsetHeight}px`);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(title);
    return () => { ro.disconnect(); root.style.removeProperty('--m-title-h'); };
  }, [host]);   // re-measure once the title has moved into the page

  useEffect(() => {
    const title = ref.current;
    if (!releaseAt || !title || window.innerWidth <= 768) return;
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
    host,
  );
}

/**
 * Up arrow shown once an inner page is scrolled all the way down; a click
 * glides back to the top. Centred on the page, in the menu's row (phone:
 * just above the bottom menu). The section title, which sits in that spot on
 * some pages, steps aside while the arrow is there.
 */
export function ScrollTopArrow() {
  const [shown, setShown] = useState(false);
  const [pos, setPos] = useState<React.CSSProperties>({});
  const scroller = () => document.querySelector<HTMLElement>('[class*="_page_"]');
  useEffect(() => {
    const check = () => {
      const page = scroller();
      if (!page) { setShown(false); return; }
      const atEnd = page.scrollTop + page.clientHeight >= page.scrollHeight - 60;
      setShown(atEnd);
      const title = document.querySelector<HTMLElement>('body > h1[class*="titleCol2"]');
      // Desktop only — on a phone the arrow sits at the bottom, clear of it
      if (title) title.toggleAttribute('data-away', atEnd && window.innerWidth > 768);
      const pz = parseFloat(document.documentElement.style.zoom || '1') || 1;
      const sb = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--page-sb')) || 0;
      // Centre of the page's content width (its own scrollbar excluded)
      const cx = (document.documentElement.clientWidth / pz - sb) / 2;
      const nav = document.querySelector('nav')?.getBoundingClientRect();
      if (!nav) return;
      const h = nav.height / pz;
      // Phone: the menu is at the bottom — the arrow sits centred 10px above it
      // (the top bar's middle belongs to the language switch)
      setPos(window.innerWidth <= 768
        ? { top: nav.top / pz - 10 - h, left: cx - h / 2, width: h, height: h }
        : { top: nav.top / pz, left: cx - h / 2, width: h, height: h });
    };
    check();
    window.addEventListener('scroll', check, { capture: true, passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check, { capture: true });
      window.removeEventListener('resize', check);
      document.querySelector('body > h1[class*="titleCol2"]')?.removeAttribute('data-away');
    };
  }, []);

  return createPortal(
    <button
      aria-label="Наверх"
      onClick={() => scroller()?.scrollTo({ top: 0, behavior: 'smooth' })}
      style={{
        position: 'fixed', zIndex: 201,
        borderRadius: 4, border: 'none', padding: 0,
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
