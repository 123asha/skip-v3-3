import type { PageMeta } from '../content/seo';

/**
 * The site's public address, without a trailing slash. The GitHub Pages build
 * (base /skip-design/) lives under 123asha.github.io; the root-path build is
 * the skip.design domain. VITE_SITE_URL overrides both.
 */
export const SITE_URL: string = (import.meta.env.VITE_SITE_URL as string | undefined)
  ?? (import.meta.env.BASE_URL === '/' ? 'https://skip.design' : 'https://123asha.github.io/skip-design');

/** Absolute address of a file in the public folder */
export const absUrl = (path: string) => SITE_URL + path;

/** Absolute address of a page — with the trailing slash its prerendered
 *  folder is served at (hosts redirect the bare form there) */
export const pageUrl = (path: string) => SITE_URL + (path === '/' ? '/' : path.replace(/\/$/, '') + '/');

function setMeta(attr: 'name' | 'property', key: string, value: string | undefined) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!value) { el?.remove(); return; }
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', value);
}

/** Title, description, canonical and share tags for the page being shown */
export function applyPageMeta(m: PageMeta) {
  document.title = m.title;
  const url = pageUrl(m.path);
  const image = m.image ? absUrl(m.image) : undefined;
  setMeta('name', 'description', m.description);
  setMeta('name', 'robots', m.noindex ? 'noindex' : undefined);
  setMeta('property', 'og:type', m.type ?? 'website');
  setMeta('property', 'og:title', m.title);
  setMeta('property', 'og:description', m.description);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:image', image);
  setMeta('property', 'article:published_time', m.published);
  setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
  link.href = url;
}
