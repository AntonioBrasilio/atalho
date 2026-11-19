import type { APIRoute } from 'astro';
import { respostasGta6 } from '../lib/dados';
import { CATEGORIA_INFO, urlResposta } from '../lib/util';
import { normalizar, type Doc } from '../lib/motor';

/** Palavras do texto completo (sem markdown, sem repetição) para a busca achar detalhes do corpo. */
function palavrasDoTexto(md = ''): string {
  const limpo = md
    .replace(/<[^>]+>/g, ' ')
    .replace(/\]\([^)]*\)/g, ' ')
    .replace(/[#*_>`|[\]-]/g, ' ');
  const vistas = new Set<string>();
  for (const w of normalizar(limpo).split(' ')) if (w.length >= 3 && !/^\d+$/.test(w)) vistas.add(w);
  return [...vistas].join(' ');
}

export const GET: APIRoute = async () => {
  const lista: Doc[] = (await respostasGta6()).map((r) => ({
    u: urlResposta(r.data.slug),
    p: r.data.pergunta,
    r: r.data.resposta_curta,
    st: r.data.status,
    c: r.data.categoria,
    cn: CATEGORIA_INFO[r.data.categoria].nome,
    t: r.data.tags,
    sn: r.data.sinonimos,
    k: palavrasDoTexto(r.body),
    ...(r.data.codigo ? { cd: r.data.codigo.sequencia } : {}),
    ...(r.data.destaque ? { d: 1 as const } : {}),
  }));
  return new Response(JSON.stringify(lista), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
