import { asset } from '../utils/asset';
import { ARTICLES } from './insightArticles';

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

// A template article with every kind of block — to see how each one looks
const SAMPLE: Insight = {
  name: 'Статья',
  slug: 'primer',
  draft: true,
  desc: 'Пример статьи: все блоки, которые можно использовать',
  date: '30.09.2026',
  source: 'Skip Design',
  cover: asset('/preview-case2.webp'),
  body: [
    'Короткий вводный абзац: о чём статья и почему мы взялись за эту тему.',
    'Второй абзац — главный вывод, который читатель унесёт с собой.',
  ],
  blocks: [
    { type: 'p', text: 'Вводный абзац. Бренд не сферический конь в вакууме: вокруг всегда есть контекст, в котором компания находится и развивается. Люди, рынок, тренды в индустрии — всё это влияет на восприятие.' },
    { type: 'p', text: 'Второй абзац рыбы. Разбираем пример из практики: исходная задача, первая гипотеза, что пошло не так и как её переформулировали.' },
    { type: 'h2', text: 'Заголовок второго уровня' },
    { type: 'p', text: 'Абзац под заголовком. Здесь будет продолжение мысли: как мы пришли к этому подходу, на каких проектах его проверяли и где он работает лучше всего.' },
    { type: 'image', src: asset('/cases/seniors/1.webp'), shape: 'vertical', caption: 'Подпись к картинке — серым, как сноски в таблицах' },
    { type: 'h3', text: 'Заголовок третьего уровня' },
    { type: 'ul', items: ['Первый пункт маркированного списка', 'Второй пункт — чуть длиннее, чтобы посмотреть, как переносится строка внутри пункта', 'Третий пункт'] },
    { type: 'ol', items: ['Первый шаг', 'Второй шаг', 'Третий шаг'] },
    { type: 'quote', text: '«Бренд без платформы — набор случайных решений: продажи говорят одно, маркетинг делает другое, в продукте — третье.»', author: 'Имя Фамилия, должность' },
    { type: 'gallery', items: [
      { src: asset('/cases/seniors/2.webp'), shape: 'square' },
      { src: asset('/cases/seniors/4.webp'), shape: 'square' },
    ], caption: 'Галерея: две картинки в ряд' },
    { type: 'table', head: ['Критерий', 'Вопрос', 'Оценка'], rows: [
      ['Ясность', 'Понятно ли, о чём речь, с первого взгляда?', '1–5'],
      ['Уникальность', 'Не использует ли эту метафору кто-то ещё?', '1–5'],
      ['Гибкость', 'Можно ли развивать её в разных носителях?', '1–5'],
    ] },
    { type: 'note', text: 'Сноска: мелкий серый текст с пояснением или источником данных.' },
    { type: 'divider' },
    { type: 'code', text: 'Промпт для проверки метафоры:\nОцени метафору по шкале от 1 до 5\nпо каждому из критериев выше.' },
    { type: 'video', src: asset('/cases/seniors/3.mp4'), shape: 'square', caption: 'Видео — играет само, без звука' },
    { type: 'p', text: 'Финальный абзац рыбы — выводы и то, как применить подход в своей команде.' },
  ],
};

const INSIGHTS: Insight[] = [
  SAMPLE,
  {
    name: 'Статья',
    desc: 'Что делает метафору сильной?',
    date: '23.09.2026',
    source: 'Дизайн-кабак',
    slug: 'chto-delaet-metaforu-silnoj',
    cover: asset('/flower2.mp4'),
    body: [
      'Когда нет метафоры, любая концепция рассыпается. Поэтому мы уделяем им особое внимание.',
      'Сильная метафора опирается на общий дух и состояние вещей, заставляет чувствовать и действовать, укоренена в телесном опыте.',
    ],
  },
  {
    name: 'Статья',
    desc: 'Конструктор миссии: как сформулировать цели для бизнеса',
    date: '06.04.2026',
    source: 'VC',
    slug: 'konstruktor-missii-kak-sformulirovat-celi-dlya-biznesa',
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
    body: [
      'На этот вопрос поможет ответить product vision.',
      'Product vision полезен даже маленьким командам: он помогает сверяться с целью, держать фокус и расставлять приоритеты.',
    ],
  },
  {
    name: 'Фреймворк',
    desc: 'Конструктор миссии',
    year: '2026',
    date: '12.03.2026',
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
    body: [
      'Когда нет метафоры, любая концепция рассыпается. Получается набор приёмов, которые не держат форму.',
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
  if (a) { i.blocks = a.blocks; i.cover = i.cover ?? a.cover; }
}

const SORTED = [...INSIGHTS]
  .filter(i => !i.draft || import.meta.env.DEV)
  .sort((a, b) => dateKey(b) - dateKey(a));

/** Insights newest first, with their shown date and where each one leads */
export const INSIGHTS_LIST = SORTED.map(i => ({ ...i, href: insightPath(i), shown: shownDate(i) }));

/** An internal article by its slug (drafts included — they open by address) */
export const insightBySlug = (slug: string) => INSIGHTS.find(i => i.slug === slug && i.blocks);
