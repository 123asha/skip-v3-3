import { INSIGHTS_LIST, insightBySlug, type Insight } from './insights';

/**
 * Search / share metadata for every page with its own address: the title,
 * the description, the preview picture. Used twice:
 *   - in the browser, App sets the <head> tags on every page change;
 *   - at build time, scripts/prerender.mjs writes each page its own
 *     index.html carrying these tags (so crawlers see them without running
 *     the app, and get a 200 instead of GitHub Pages' 404 fallback), plus
 *     sitemap.xml and robots.txt.
 */

export type PageMeta = {
  path: string;
  title: string;
  description: string;
  /** Site path of the share picture (public folder), if any */
  image?: string;
  type?: 'website' | 'article';
  /** ISO date, articles only */
  published?: string;
  /** Kept out of search (drafts) */
  noindex?: boolean;
};

const SITE = 'Skip Design';

const SECTIONS: PageMeta[] = [
  { path: '/', title: 'Skip Design. Дизайн, как правила игры.', description: 'Бренд-стратегия, визуальные системы и цифровой дизайн для быстрорастущих компаний.' },
  { path: '/cases', title: `Проекты — ${SITE}`, description: 'Проекты студии Skip Design: брендинг, сайты и цифровые продукты — от стратегии до визуальной системы.' },
  { path: '/services', title: `Услуги и решения — ${SITE}`, description: 'Исследования, платформа бренда, нейминг, визуальные системы, сайты и продуктовый дизайн: что делает студия Skip Design и как.' },
  { path: '/insights', title: `Инсайты — ${SITE}`, description: 'Статьи, фреймворки и памятки студии Skip Design о бренд-стратегии, продукте, метафорах и ИИ в дизайне.' },
  { path: '/about', title: `О студии — ${SITE}`, description: 'Skip Design — команда стратегов, дизайнеров и менеджеров: как мы работаем и во что верим.' },
  { path: '/Seniorsbar', title: `Senior*s bar — кейс ${SITE}`, description: 'Кейс студии Skip Design: бренд и сайт для бара Senior*s в Тбилиси.' },
  { path: '/plugin-aliexpress', title: `Плагин AliExpress — кейс ${SITE}`, description: 'Кейс студии Skip Design: обновили дизайн плагина AE Platform для продавцов-участников партнёрской программы AliExpress.' },
  { path: '/ae-platform', title: `AE Platform — кейс ${SITE}`, description: 'Кейс студии Skip Design: обновили дизайн B2B-платформы AE Platform для продавцов-участников партнёрской программы AliExpress.' },
  { path: '/aliexpress-landing', title: `AliExpress B2B — кейс ${SITE}`, description: 'Кейс студии Skip Design: дизайн лендинга B2B-платформы AE Platform, который презентует продукт и формирует доверие к бренду.' },
  { path: '/binaroom', title: `Binaroom — кейс ${SITE}`, description: 'Кейс студии Skip Design: дизайн платформы, которая превращает 3D-проекты в сметы и коммерческие предложения и помогает управлять документооборотом.' },
  { path: '/policy', title: `Политика конфиденциальности — ${SITE}`, description: 'Политика обработки персональных данных на сайте студии Skip Design.' },
];

// DD.MM.YYYY → YYYY-MM-DD
const iso = (d?: string) => {
  if (!d) return undefined;
  const [dd, mm, yy] = d.split('.');
  return `${yy}-${mm}-${dd}`;
};

// The article's opening, as plain text of about 160 characters, cut on a word
const lead = (i: Insight) => {
  const first = i.blocks?.find(b => b.type === 'p');
  const raw = (first && 'text' in first ? first.text : i.body?.[0]) ?? i.desc;
  const text = raw.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\s+/g, ' ').trim();
  if (text.length <= 160) return text;
  return text.slice(0, 157).replace(/\s+\S*$/, '') + '…';
};

const articleMeta = (i: Insight): PageMeta => ({
  path: `/insights/${i.slug}`,
  title: `${i.desc} — ${SITE}`,
  description: lead(i),
  // Site path of the cover (strip the build's base, the page adds its own)
  image: i.cover && !i.cover.endsWith('.mp4') ? i.cover.replace(import.meta.env.BASE_URL, '/') : undefined,
  type: 'article',
  published: iso(i.date),
  noindex: i.draft,
});

/** Every page with its own address — for the prerender and the sitemap */
export function allPages(): PageMeta[] {
  const articles = INSIGHTS_LIST.filter(i => i.slug && i.blocks).map(articleMeta);
  // The draft template article too (it opens by address), kept out of search
  const draft = insightBySlug('primer');
  return [...SECTIONS, ...articles, ...(draft && !articles.some(a => a.path.endsWith('/primer')) ? [articleMeta(draft)] : [])];
}

/** The metadata for an address the app is showing (falls back to the home page's) */
export function pageMetaFor(path: string): PageMeta {
  const p = path.replace(/\/$/, '') || '/';
  const alias = p === '/lab' ? '/insights' : p === '/expertiza' ? '/services' : p === '/about-skip-design' ? '/about' : p;
  if (alias.startsWith('/insights/')) {
    const i = insightBySlug(alias.slice('/insights/'.length));
    if (i) return articleMeta(i);
  }
  return SECTIONS.find(s => s.path === alias) ?? { ...SECTIONS[0], path: p };
}
