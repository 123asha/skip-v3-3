import { asset } from '../utils/asset';
import { ARTICLES } from './insightArticles';

// The English site (/en/…) reads the articles in English. Worked out here
// rather than taken from i18n, which needs a browser — the prerender runs
// this file without one.
const IS_EN = (() => {
  try {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const stashed = sessionStorage.getItem('ghpages_redirect');
    const full = stashed ? new URL(stashed, location.origin).pathname : location.pathname;
    return /^\/en(\/|$)/.test(base && full.startsWith(base) ? full.slice(base.length) : full);
  } catch { return false; }
})();

/**
 * Insights — the articles on the «Инсайты» page (cards + archive table).
 *
 * An insight is either
 *   - external: `href` leads to the piece on another site (new tab), or
 *   - internal: no `href`, a `slug` and `blocks` — its own page at /insights/<slug>.
 * `draft` ones are listed only in local development; their page still opens
 * by its address.
 */

/** One block of an internal article — the same set as the editor's «/» menu */
export type Block =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'quote'; text: string; author?: string }
  | { type: 'code'; text: string }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'divider' }
  /** Pictures are square or 4:5; an article's own charts and schemes keep
   *  their proportions ('auto', with the width / height `ratio`) */
  | { type: 'image'; src: string; shape?: 'square' | 'vertical' | 'auto'; ratio?: number; caption?: string }
  | { type: 'video'; src: string; shape?: 'square' | 'vertical'; caption?: string }
  | { type: 'gif'; src: string; shape?: 'square' | 'vertical'; caption?: string }
  | { type: 'gallery'; items: { src: string; shape?: 'square' | 'vertical' }[]; caption?: string }
  /** Grey fine print — like the notes under the tables */
  | { type: 'note'; text: string };

// `date` — publication date, DD.MM.YYYY
export type Insight = {
  name: string; desc: string; year?: string; date?: string; source?: string;
  href?: string;
  body?: [string, string]; full?: string[];
  slug?: string; blocks?: Block[]; cover?: string; draft?: boolean;
  /** The slug of the insight this one follows on from — listed under it as 02.1, 02.2… */
  parent?: string;
};

// DD.MM.YYYY (or just the year) → sortable number
const dateKey = (t: Insight) => {
  const [d, m, y] = (t.date ?? `01.01.${t.year ?? '0'}`).split('.').map(Number);
  return y * 10000 + m * 100 + d;
};

// Shown date: the current year is dropped (03.06), other years keep two
// digits (12.11.25)
export const shownDate = (t: Insight) => {
  if (!t.date) return t.year;
  const [d, m, y] = t.date.split('.');
  return Number(y) === new Date().getFullYear() ? `${d}.${m}` : `${d}.${m}.${y.slice(-2)}`;
};

/** Where an insight leads: its own page for internal ones, else the outside link */
export const insightPath = (t: Insight) => t.href ?? (t.slug ? `/insights/${t.slug}` : undefined);
export const isInternal = (href?: string) => !!href && href.startsWith('/');

const INSIGHTS: Insight[] = [
  {
    name: 'Статья',
    desc: 'Конструктор миссии: как сформулировать цели для бизнеса',
    date: '06.04.2026',
    source: 'VC',
    slug: 'konstruktor-missii-kak-sformulirovat-celi-dlya-biznesa',
    parent: 'konstruktor-missii-brenda',
    body: [
      'Потестировали конструктор миссии на двух больших компаниях, одном психотерапевте и одном музыкальном дуэте.',
      'Через любой подход можно прийти к одним и тем же смыслам, но в разной обёртке. Делимся наблюдениями.',
    ],
  },
  {
    name: 'Статья',
    desc: 'Зачем стартапу стратегия, если всё постоянно меняется',
    date: '27.09.2026',
    source: 'Дизайн-кабак',
    slug: 'zachem-startapu-strategiya',
    body: [
      '«Рано думать о стратегии, давайте проверять гипотезы» — так думает почти каждый стартап.',
      'Сейчас запустить продукт просто: за пару недель навайбкодить MVP, запустить рекламу и даже получить первых пользователей. И на этом этапе может казаться, что о стратегии думать рано.',
    ],
  },
  {
    name: 'Статья',
    desc: 'Как смыслы бренда становятся продуктовыми решениями',
    date: '23.09.2026',
    source: 'Дизайн-кабак',
    slug: 'kak-smysly-brenda-stanovyatsya-produktovymi-resheniyami',
    cover: asset('/brand-balls.mp4'),
    body: [
      'Компания потратила несколько месяцев и бюджет на ребрендинг. Сделали красивую презентацию с миссией, видением, ценностями.',
      'Все полюбовались и отдали в отдел маркетинга. А продукт живёт своей жизнью.',
    ],
  },
  {
    name: 'Статья',
    desc: 'Что делает метафору сильной?',
    date: '23.09.2026',
    source: 'Дизайн-кабак',
    slug: 'chto-delaet-metaforu-silnoj',
    parent: 'kak-ii-generiruet-metafory',
    cover: asset('/flower2.mp4'),
    body: [
      'Когда нет метафоры, любая концепция рассыпается. Поэтому мы уделяем ей особое внимание.',
      'Сильная метафора опирается на общий дух и состояние вещей, заставляет чувствовать и действовать, укоренена в телесном опыте.',
    ],
  },
  {
    name: 'Статья',
    desc: 'В чём разница между product vision и brand vision',
    date: '16.09.2026',
    source: 'Дизайн-кабак',
    slug: 'raznica-mezhdu-product-vision-i-brand-vision',
    cover: asset('/media/insights/brand-product-vision.mp4'),
    body: [
      'Их легко перепутать, потому что оба говорят о будущем. Но отвечают на разные вопросы.',
      'Brand vision — куда мы хотим прийти как бренд через 2–5 лет. Product vision — каким должен стать продукт, чтобы это будущее стало возможным.',
    ],
  },
  {
    name: 'Статья',
    desc: 'Что должно измениться в жизни человека благодаря вашему продукту?',
    date: '16.09.2026',
    source: 'Дизайн-кабак',
    slug: 'chto-dolzhno-izmenitsya-v-zhizni-cheloveka-blagodarya-produktu',
    parent: 'raznica-mezhdu-product-vision-i-brand-vision',
    body: [
      'На этот вопрос поможет ответить product vision.',
      'Product vision полезен даже маленьким командам: он помогает сверяться с целью, держать фокус и расставлять приоритеты.',
    ],
  },
  {
    name: 'Фреймворк',
    desc: 'Конструктор миссии',
    year: '2025',
    date: '25.10.2025',
    source: 'VC',
    slug: 'konstruktor-missii-brenda',
    body: [
      'В основе конструктора — идея, что к ответу на вопрос «Почему мы этим занимаемся?» можно прийти четырьмя разными путями.',
      'Поиск миссии бренда часто превращается в гонку за идеальной фразой, как у Nike или Apple. Команды попадают в ловушку: штурмят, креативят, запираются в переговорках, чтобы найти те самые вдохновляющие слова.',
    ],
  },
  {
    name: 'Статья',
    desc: 'Критерии для проверки идей',
    year: '2026',
    date: '02.04.2026',
    source: 'Workspace',
    slug: 'prompt-dlya-proverki-metafory',
    parent: 'kak-ii-generiruet-metafory',
    body: [
      'Собрали критерии, по которым проверяем метафоры, и промпт, чтобы проверять их вместе с ИИ.',
      'В Skip Design мы используем собственную методологию. Каждый критерий — вопрос, который проверяет метафору по шкале от 1 до 5.',
    ],
  },
  {
    name: 'Статья',
    desc: 'Как ИИ генерирует метафоры',
    year: '2026',
    date: '21.04.2026',
    source: 'Workspace',
    slug: 'kak-ii-generiruet-metafory',
    body: [
      '5 нейросетей, 3 индустрии, 150 метафор — выясняем, почему повсюду архитекторы, дирижёры и навигаторы.',
      'В этой статье мы говорим «метафора», но не как средство языка и приём в тексте на лендинге, а шире. Метафора помогает быстро передать суть через знакомый образ и задаёт фрейм — рамку, которая определяет, как мы воспринимаем реальность и принимаем решения.',
    ],
  },
  {
    name: 'Памятка',
    desc: 'Памятка по юридическим документам',
    year: '2026',
    date: '15.05.2026',
    source: 'VC',
    slug: 'yuridicheskie-dokumenty-dlya-sajtov-i-prilozhenij',
    body: [
      'Получилась практическая памятка для продуктовых команд, дизайнеров и фаундеров.',
      'Когда запускают сайт, приложение или бота, про юридическую часть часто вспоминают в последнюю очередь — уже после релиза.',
    ],
  },
  {
    name: 'Статья',
    desc: 'Почему не все бренды могут использовать ИИ',
    year: '2026',
    date: '03.06.2026',
    source: 'Workspace',
    slug: 'pochemu-ne-vse-brendy-mogut-ispolzovat-ii',
    body: [
      'Объясняем на примере трёх классических ограничений «быстро — качественно — дёшево», почему одни бренды могут использовать ИИ, а другие — нет.',
      'Если переложить модель на терминологию брендинга, она помогает понять, на чём бренд делает главный акцент и что именно обещает своим клиентам.',
    ],
  },
];

// Each carried-over article: its blocks and first picture from ARTICLES
for (const i of INSIGHTS) {
  const a = i.slug ? ARTICLES[i.slug] : undefined;
  // (the article's own first picture isn't used as the cover — cards without
  // a cover set here show the logo placeholder)
  if (a) { i.blocks = a.blocks; }
}

/** The English site: the carried-over articles in English (called by i18n's loadLang, before the first render) */
export function applyEnglishArticles(en: Record<string, { title: string; body: [string, string]; blocks: Block[] }>) {
  if (!IS_EN) return;
  // (the list below is made of copies, so it gets the English too)
  for (const i of [...INSIGHTS, ...INSIGHTS_LIST]) {
    const e = i.slug ? en[i.slug] : undefined;
    if (e) { i.blocks = e.blocks; i.desc = e.title; i.body = e.body; }
  }
}

const SORTED = [...INSIGHTS]
  .filter(i => !i.draft || import.meta.env.DEV)
  .sort((a, b) => dateKey(b) - dateKey(a));

/** Insights newest first, with their shown date and where each one leads */
// A short article (under ~1500 characters of text) is listed as a note
const textLength = (i: Insight) => (i.blocks ?? []).reduce((n, b: any) => n + (b.text?.length ?? 0) + (b.items?.join('').length ?? 0), 0)
  + (i.full ?? []).join('').length + (i.body ?? []).join('').length;
const kind = (i: Insight) => i.name === 'Статья' && textLength(i) < 1500 ? 'Заметка' : i.name;
export const INSIGHTS_LIST = SORTED.map(i => ({ ...i, name: kind(i), href: insightPath(i), shown: shownDate(i) }));

/** The list grouped for the lined index: each insight with the ones that
 *  follow on from it right under it. A group stands where its newest member
 *  would; inside a group the follow-ups go newest first */
export const INSIGHTS_GROUPED = (() => {
  const top = INSIGHTS_LIST.filter(i => !i.parent || !INSIGHTS_LIST.some(p => p.slug === i.parent));
  const kids = (i: typeof top[number]) => INSIGHTS_LIST.filter(k => k.parent && k.parent === i.slug);
  const newest = (i: typeof top[number]) => Math.max(dateKey(i), ...kids(i).map(dateKey));
  return [...top].sort((a, b) => newest(b) - newest(a)).map(i => ({ ...i, children: kids(i) }));
})();

/** An internal article by its slug (drafts included — they open by address) */
export const insightBySlug = (slug: string) => INSIGHTS.find(i => i.slug === slug && i.blocks);
