import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const CATEGORIAS = [
  'lancamento',
  'policia',
  'dinheiro',
  'mecanicas',
  'mapa',
  'personagens',
  'missoes',
  'trofeus',
  'erros',
  'codigos',
] as const;

export const STATUS = ['confirmado', 'vazamento', 'testando'] as const;

const respostas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/respostas' }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug deve ser kebab-case'),
    jogo: z.enum(['gta6']),
    pergunta: z.string().min(5),
    resposta_curta: z.string().min(5).max(220),
    categoria: z.enum(CATEGORIAS),
    tags: z.array(z.string()).default([]),
    sinonimos: z.array(z.string()).default([]),
    status: z.enum(STATUS),
    fonte_url: z.url().optional(),
    fonte_nome: z.string().optional(),
    fontes_extras: z.array(z.object({ nome: z.string(), url: z.url() })).default([]),
    atualizado_em: z.coerce.date(),
    afiliado_contextual: z.string().optional(),
    destaque: z.boolean().default(false),
    /** Só para respostas de códigos: preencha para entrar na tabela de /gta6/codigos/ */
    codigo: z
      .object({
        plataforma: z.enum(['ps5', 'xbox']),
        sequencia: z.string(),
        efeito: z.string(),
      })
      .optional(),
  }),
});

const guias = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guias' }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    titulo: z.string(),
    descricao: z.string().max(220),
    resumo: z.string(),
    atualizado_em: z.coerce.date(),
    escolhas: z
      .array(
        z.object({
          tipo: z.enum(['Mais barato', 'Custo-benefício', 'Melhor']),
          nome: z.string(),
          especificacao: z.string(),
          amazon_url: z.string().default(''),
          ml_url: z.string().default(''),
        }),
      )
      .length(3),
    faq: z.array(z.object({ pergunta: z.string(), resposta: z.string() })).default([]),
  }),
});

export const collections = { respostas, guias };
