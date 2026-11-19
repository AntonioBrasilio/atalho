import type { CollectionEntry } from 'astro:content';
import { config } from '../config';

export type Resposta = CollectionEntry<'respostas'>;
export type Guia = CollectionEntry<'guias'>;
export type Status = Resposta['data']['status'];
export type Categoria = Resposta['data']['categoria'];

export const CATEGORIA_INFO: Record<Categoria, { nome: string; icone: string; descricao: string; paginaFixa?: string }> = {
  lancamento: { nome: 'Geral', icone: '📌', descricao: 'Duração, online e informações gerais do jogo.' },
  policia: { nome: 'Polícia', icone: '🚓', descricao: 'Estrelas de procurado e Perfil Criminal.' },
  dinheiro: { nome: 'Dinheiro', icone: '💰', descricao: 'Como ganhar, guardar e gastar dinheiro.' },
  mecanicas: { nome: 'Mecânicas', icone: '🕹️', descricao: 'O que dá e o que não dá para fazer.' },
  mapa: { nome: 'Mapa', icone: '🗺️', descricao: 'Regiões e lugares de Leonida.' },
  personagens: { nome: 'Personagens', icone: '👥', descricao: 'Protagonistas e elenco.' },
  missoes: { nome: 'Missões', icone: '🎯', descricao: 'Missões que não aparecem e dicas de progresso.' },
  trofeus: { nome: 'Troféus', icone: '🏆', descricao: 'Troféus e conquistas.', paginaFixa: '/gta6/trofeus/' },
  erros: { nome: 'Erros', icone: '🛠️', descricao: 'Tela preta, travamentos e soluções.', paginaFixa: '/gta6/erros/' },
  codigos: { nome: 'Códigos', icone: '🎮', descricao: 'Cheats: como ativar, desbloquear e alertas de golpe.', paginaFixa: '/gta6/codigos/' },
  veiculos: { nome: 'Veículos', icone: '🚗', descricao: 'Guardar, chamar, roubar, vender e carros raros.' },
  armas: { nome: 'Armas', icone: '🔫', descricao: 'Onde comprar e as melhores armas.' },
  segredos: { nome: 'Segredos', icone: '🔍', descricao: 'Easter eggs e curiosidades.' },
};

export const STATUS_INFO: Record<Status, { emoji: string; rotulo: string; curto: string; classe: string }> = {
  confirmado: { emoji: '✅', rotulo: 'Confirmado', curto: 'Confirmado', classe: 'ok' },
  vazamento: { emoji: '❓', rotulo: 'Não confirmado', curto: 'Não confirmado', classe: 'leak' },
  testando: { emoji: '⏳', rotulo: 'Ainda testando', curto: 'Testando', classe: 'test' },
};

const fmt = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** "dd/mm às hh:mm" no horário de Brasília */
export function formatarData(d: Date): string {
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.day}/${p.month} às ${p.hour}:${p.minute}`;
}

export const urlResposta = (slug: string) => `/gta6/r/${slug}/`;
export const urlCategoria = (c: Categoria) => `/gta6/c/${c}/`;
export const absUrl = (path: string) => new URL(path, config.siteUrl).toString();

const vazio = (u?: string) => !u || u.includes('[PREENCHER');

/** Monta o link de afiliado com a tag configurada. Retorna '' se o link ainda não foi preenchido. */
export function urlAfiliado(loja: 'amazon' | 'ml', url?: string): string {
  if (vazio(url)) return '';
  try {
    const u = new URL(url!);
    if (loja === 'amazon' && config.afiliados.amazonTag) u.searchParams.set('tag', config.afiliados.amazonTag);
    if (loja === 'ml' && config.afiliados.mercadoLivreId && config.afiliados.mercadoLivreParam)
      u.searchParams.set(config.afiliados.mercadoLivreParam, config.afiliados.mercadoLivreId);
    return u.toString();
  } catch {
    return '';
  }
}

/** Link do formulário de correção com o slug pré-preenchido. */
export function urlCorrecao(slug: string): string {
  const f = config.formularios;
  if (f.correcaoUrl) {
    const u = new URL(f.correcaoUrl);
    if (f.correcaoCampoSlug) {
      u.searchParams.set('usp', 'pp_url');
      u.searchParams.set(f.correcaoCampoSlug, slug);
    }
    return u.toString();
  }
  return `mailto:${config.emailContato}?subject=${encodeURIComponent('Correção: ' + slug)}`;
}

export const ordenarRecentes = (lista: Resposta[]) =>
  [...lista].sort((a, b) => b.data.atualizado_em.getTime() - a.data.atualizado_em.getTime());

/** 3–5 perguntas relacionadas: mesma categoria e tags em comum. */
export function relacionadas(atual: Resposta, todas: Resposta[], max = 5): Resposta[] {
  const tags = new Set(atual.data.tags);
  return todas
    .filter((r) => r.id !== atual.id && r.data.jogo === atual.data.jogo)
    .map((r) => ({
      r,
      score:
        (r.data.categoria === atual.data.categoria ? 3 : 0) +
        r.data.tags.filter((t) => tags.has(t)).length +
        (r.data.status === 'confirmado' ? 0.5 : 0),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((x) => x.r);
}

// ── JSON-LD ─────────────────────────────────────────────
export function ldBreadcrumb(itens: { nome: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: itens.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.nome,
      item: absUrl(it.url),
    })),
  };
}

export function ldFaq(qas: { pergunta: string; resposta: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qas.map((q) => ({
      '@type': 'Question',
      name: q.pergunta,
      acceptedAnswer: { '@type': 'Answer', text: q.resposta },
    })),
  };
}
