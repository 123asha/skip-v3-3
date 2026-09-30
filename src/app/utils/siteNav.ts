import { LANG_PREFIX } from '../i18n';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Full address of a site path — base and language prefix included */
export const siteHref = (path: string) => BASE + LANG_PREFIX + path;

/**
 * Open a page of the site without reloading: the app's router follows the
 * address on popstate (the same hand-over the case category chips use).
 */
export function goTo(path: string) {
  window.history.pushState({}, '', siteHref(path));
  window.dispatchEvent(new PopStateEvent('popstate'));
}
