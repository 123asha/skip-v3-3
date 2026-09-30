// After `vite build`: every page with its own address gets its own
// dist/<path>/index.html — the app's shell with that page's title,
// description, canonical and share tags (from src/app/content/seo.ts), so
// crawlers read them without running the app and the address answers 200
// (not GitHub Pages' 404 fallback). Also writes sitemap.xml and robots.txt.
//
// Usage: node scripts/prerender.mjs [outDir]   (default: dist)
import { createServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

const outDir = process.argv[2] ?? 'dist';
const base = process.env.VITE_BASE ?? '/skip-design/';

const vite = await createServer({ base, server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' });
try {
  const { allPages } = await vite.ssrLoadModule('/src/app/content/seo.ts');
  const { SITE_URL, absUrl, pageUrl } = await vite.ssrLoadModule('/src/app/utils/pageMeta.ts');
  const shell = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const pages = allPages();

  for (const m of pages) {
    const url = pageUrl(m.path);
    const image = m.image ? absUrl(m.image) : null;
    const tags = [
      `<title>${esc(m.title)}</title>`,
      `<meta name="description" content="${esc(m.description)}" />`,
      m.noindex ? '<meta name="robots" content="noindex" />' : '',
      `<link rel="canonical" href="${esc(url)}" />`,
      `<meta property="og:type" content="${m.type ?? 'website'}" />`,
      '<meta property="og:site_name" content="Skip Design" />',
      `<meta property="og:title" content="${esc(m.title)}" />`,
      `<meta property="og:description" content="${esc(m.description)}" />`,
      `<meta property="og:url" content="${esc(url)}" />`,
      image ? `<meta property="og:image" content="${esc(image)}" />` : '',
      m.published ? `<meta property="article:published_time" content="${m.published}" />` : '',
      `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
      m.type === 'article' ? `<script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Article',
        headline: m.title.replace(/ — Skip Design$/, ''), description: m.description,
        datePublished: m.published, image: image ?? undefined, mainEntityOfPage: url,
        author: { '@type': 'Organization', name: 'Skip Design', url: SITE_URL + '/' },
        publisher: { '@type': 'Organization', name: 'Skip Design', url: SITE_URL + '/' },
      }).replace(/</g, '\\u003c')}</script>` : '',
    ].filter(Boolean).join('\n    ');

    // Drop the shell's own title / description / og / twitter tags, put these in
    const html = shell
      .replace(/<title>[\s\S]*?<\/title>\s*/, '')
      .replace(/<meta (name="description"|property="og:[^"]+"|name="twitter:[^"]+")[^>]*>\s*/g, '')
      .replace('</head>', `    ${tags}\n  </head>`);

    const file = m.path === '/' ? path.join(outDir, 'index.html') : path.join(outDir, m.path, 'index.html');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
  }

  const indexed = pages.filter(m => !m.noindex);
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    indexed.map(m => `  <url><loc>${esc(pageUrl(m.path))}</loc>${m.published ? `<lastmod>${m.published}</lastmod>` : ''}</url>`).join('\n') +
    '\n</urlset>\n');
  fs.writeFileSync(path.join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

  console.log(`prerender: ${pages.length} pages, sitemap with ${indexed.length} addresses → ${outDir}`);
} finally {
  await vite.close();
}
