// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { config } from './src/config.ts';

/** Fora do sitemap: 404, produto inativo e categorias cujo canonical é uma página fixa. */
const excluir = [
  '/404/',
  '/gta6/c/erros/',
  '/gta6/c/codigos/',
  '/gta6/c/trofeus/',
  ...(config.produto.ativo ? [] : ['/guia-platina/']),
];

export default defineConfig({
  site: config.siteUrl,
  trailingSlash: 'always',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [
    sitemap({
      filter: (page) => !excluir.some((p) => page.endsWith(p)),
    }),
  ],
});
