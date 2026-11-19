import type { APIRoute } from 'astro';
import { respostasGta6 } from '../lib/dados';
import { urlResposta } from '../lib/util';

export const GET: APIRoute = async () => {
  const lista = (await respostasGta6()).map((r) => ({
    u: urlResposta(r.data.slug),
    p: r.data.pergunta,
    r: r.data.resposta_curta,
    st: r.data.status,
    c: r.data.categoria,
    t: r.data.tags,
    sn: r.data.sinonimos,
  }));
  return new Response(JSON.stringify(lista), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
