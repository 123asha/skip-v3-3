import { useEffect, useRef } from 'react';
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
