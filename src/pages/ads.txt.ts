import type { APIRoute } from 'astro';
import { config } from '../config';

/** Conteúdo vem de config.ads.adsTxt (uma linha por item). */
export const GET: APIRoute = () => {
  const linhas = config.ads.adsTxt.length ? config.ads.adsTxt : ['# Preencha config.ads.adsTxt em src/config.ts'];
  return new Response(linhas.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
