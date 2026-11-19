import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { config } from '../config';
import { respostasGta6 } from '../lib/dados';
import { urlResposta } from '../lib/util';

export const GET: APIRoute = async () => {
  const lista = (await respostasGta6()).slice(0, 50);
  return rss({
    title: `${config.siteName}: respostas novas`,
    description: config.descricaoPadrao,
    site: config.siteUrl,
    customData: '<language>pt-BR</language>',
    items: lista.map((r) => ({
      title: r.data.pergunta,
      description: r.data.resposta_curta,
      link: urlResposta(r.data.slug),
      pubDate: r.data.atualizado_em,
      categories: [r.data.categoria],
    })),
  });
};
