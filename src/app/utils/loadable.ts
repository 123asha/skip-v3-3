import { createElement, type ComponentType } from 'react';

/**
 * A page kept out of the main bundle. Unlike React.lazy it renders at once
 * (no Suspense flash) when its code is already here — and the app makes sure
 * it is: every page is fetched in the background once the first screen is
 * up, and a navigation waits for `preloadPages()` before switching.
 */
const all: (() => Promise<unknown>)[] = [];

export function loadable<P extends object>(load: () => Promise<{ default: ComponentType<P> }>) {
  let Comp: ComponentType<P> | null = null;
  let pending: Promise<unknown> | null = null;
  const preload = () => (pending ??= load().then(m => { Comp = m.default; }));
  all.push(preload);
  return function Loadable(props: P) {
    if (Comp) return createElement(Comp, props);
    throw preload();   // only if a page is shown before its code came: the Suspense above waits
  };
}

let ready: Promise<unknown> | null = null;
/** Every page's code; resolves at once when it is all here */
export const preloadPages = () => (ready ??= Promise.all(all.map(p => p())).catch(() => { ready = null; }));
