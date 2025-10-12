import type { APIRoute } from 'astro';

const siteRoot = (import.meta.env.SITE || 'https://sitcon.org').replace(/\/$/, '');
const basePath = import.meta.env.BASE_URL || '/hoc/';
const site = siteRoot + (basePath.startsWith('/') ? basePath : '/' + basePath).replace(/\/$/, '');

const pages = [
  '/',
  '/', // index
];

export const get: APIRoute = async () => {
  const urls = pages
    .map((path) => {
      const loc = new URL(path, site).toString();
      return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
