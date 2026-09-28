import { EN } from './i18n.en';

/**
 * Two languages, one set of components. The English site lives under
 * /en/ (…/skip-design/en/cases): the language is read from the address once,
 * and every Russian string is swapped for its English version from the
 * dictionary in i18n.en.ts — edit the copy there.
 *
 *   t(text)            — for text that gets split before it's shown (letter
 *                        balls, word-by-word reveals): translate it first.
 *   installTranslator  — everything else is translated as it lands in the
 *                        page (text and aria-label / placeholder / alt / title).
 */

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function currentPath(): string {
  // GitHub Pages' 404 stashes the real address until the app restores it
  const stashed = sessionStorage.getItem('ghpages_redirect');
  const full = stashed ? new URL(stashed, location.origin).pathname : location.pathname;
  return BASE && full.startsWith(BASE) ? full.slice(BASE.length) : full;
}

export const LANG: 'ru' | 'en' = /^\/en(\/|$)/.test(currentPath()) ? 'en' : 'ru';
/** Path prefix of the current language — '' for Russian, '/en' for English */
export const LANG_PREFIX = LANG === 'en' ? '/en' : '';

/** Drop the language prefix from an app path ('/en/cases' → '/cases') */
export function stripLang(path: string): string {
  return path.replace(/^\/en(?=\/|$)/, '') || '/';
}

/** Same page in the other language — for the /en ⇄ /ru switch */
export function otherLangHref(path: string): string {
  return BASE + (LANG === 'en' ? '' : '/en') + (path === '/' ? '/' : path);
}

// Compare texts regardless of the typographic non-breaking spaces and line
// breaks the components add
const norm = (s: string) => s.replace(/&nbsp;/g, ' ').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();

// Dictionary, keyed by normalised Russian. Multi-paragraph entries are also
// split into their paragraphs, since pages often show them one <p> each.
const DICT = new Map<string, string>();
for (const [ru, en] of Object.entries(EN)) {
  DICT.set(norm(ru), en);
  const rp = ru.split(/\n\s*\n/), ep = en.split(/\n\s*\n/);
  if (rp.length > 1 && rp.length === ep.length) rp.forEach((p, i) => DICT.set(norm(p), ep[i]));
}

export function t(text: string): string;
export function t(text: string | undefined | null): string | undefined | null;
export function t(text: string | undefined | null) {
  if (LANG !== 'en' || !text) return text;
  return DICT.get(norm(text)) ?? text;
}

const CYR = /[А-Яа-яЁё]/;
const ATTRS = ['aria-label', 'placeholder', 'alt', 'title'];

function translateNode(node: Node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const raw = node.nodeValue ?? '';
    if (!CYR.test(raw)) return;
    const en = DICT.get(norm(raw));
    if (en === undefined) return;
    const lead = raw.match(/^\s*/)![0], trail = raw.match(/\s*$/)![0];
    node.nodeValue = lead + en + trail;
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node as Element;
  if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v && CYR.test(v)) { const en = DICT.get(norm(v)); if (en !== undefined) el.setAttribute(a, en); }
  }
  el.childNodes.forEach(translateNode);
}

/** English only: translate the page now and whatever React renders later */
export function installTranslator() {
  if (LANG !== 'en') return;
  document.documentElement.lang = 'en';
  document.title = t(document.title) ?? document.title;
  translateNode(document.body);
  new MutationObserver(records => {
    for (const r of records) {
      if (r.type === 'characterData') translateNode(r.target);
      else if (r.type === 'attributes') translateNode(r.target);
      else r.addedNodes.forEach(translateNode);
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}
