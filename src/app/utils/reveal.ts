import { useEffect, RefObject } from 'react';
import { gsap } from 'gsap';

interface RevealOptions {
  /** child selector — если нужно анимировать дочерние элементы */
  selector?: string;
  fromX?: number;
  fromY?: number;
  stagger?: number;
  duration?: number;
  ease?: string;
  delay?: number;
  threshold?: number;
}

/**
 * Единая система появления элементов при скролле.
 * IntersectionObserver → GSAP. Срабатывает один раз.
 */
export function useReveal(
  ref: RefObject<Element | null>,
  options: RevealOptions = {},
  enabled = true
) {
  // Always initialise elements to hidden on mount
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { selector, fromX = 0, fromY = 18 } = options;
    const targets: Element[] | NodeListOf<Element> = selector
      ? el.querySelectorAll(selector)
      : [el];
    gsap.set(targets, { opacity: 0, x: fromX, y: fromY });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set up the observer only once enabled is true
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const {
      selector,
      fromX = 0,
      fromY = 18,
      stagger = 0,
      duration = 0.6,
      ease = 'power3.out',
      delay = 0,
      threshold = 0.25,
    } = options;

    const targets: Element[] | NodeListOf<Element> = selector
      ? el.querySelectorAll(selector)
      : [el];

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        gsap.to(targets, { opacity: 1, x: 0, y: 0, duration, stagger, ease, delay });
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
