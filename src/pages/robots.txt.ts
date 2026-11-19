import type { APIRoute } from 'astro';
import { config } from '../config';

export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\nDisallow: /search.json\n\nSitemap: ${config.siteUrl}/sitemap-index.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
