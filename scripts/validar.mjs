// Valida o build: páginas esperadas, search.json, sitemap e JSON-LD.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
let erros = 0;
const falha = (m) => { console.error('✗ ' + m); erros++; };
const ok = (m) => console.log('✓ ' + m);

const obrigatorias = [
  'index.html', '404.html', 'gta6/index.html', 'gta6/codigos/index.html', 'gta6/trofeus/index.html',
  'gta6/erros/index.html', 'comprar/index.html', 'comprar/ssd-ps5-gta6/index.html',
  'comprar/hd-externo-xbox/index.html', 'guia-platina/index.html', 'comunidade/index.html',
  'anuncie/index.html', 'sobre/index.html', 'privacidade/index.html', 'termos/index.html',
  'contato/index.html', 'search.json', 'robots.txt', 'ads.txt', 'rss.xml', 'sitemap-index.xml',
];
for (const f of obrigatorias) existsSync(join(DIST, f)) ? null : falha(`faltando ${f}`);
ok(`${obrigatorias.length} arquivos obrigatórios verificados`);

const busca = JSON.parse(readFileSync(join(DIST, 'search.json'), 'utf8'));
const respostas = readdirSync(join(DIST, 'gta6/r'));
busca.length === respostas.length ? ok(`search.json com ${busca.length} itens = ${respostas.length} páginas de resposta`) : falha('search.json e páginas divergem');
for (const it of busca) if (!existsSync(join(DIST, it.u, 'index.html'))) falha(`search.json aponta para página inexistente: ${it.u}`);

const sitemaps = readdirSync(DIST).filter((f) => f.startsWith('sitemap-') && f !== 'sitemap-index.xml');
const urls = sitemaps.flatMap((s) => [...readFileSync(join(DIST, s), 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]));
ok(`sitemap com ${urls.length} URLs`);
if (urls.some((u) => u.endsWith('/404/'))) falha('404 no sitemap');

function htmls(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? htmls(p) : p.endsWith('.html') ? [p] : [];
  });
}
let blocos = 0;
for (const p of htmls(DIST)) {
  const html = readFileSync(p, 'utf8');
  for (const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    blocos++;
    try {
      const ld = JSON.parse(m[1]);
      if (ld['@context'] !== 'https://schema.org' || !ld['@type']) falha(`${p}: JSON-LD sem @context/@type`);
      if (ld['@type'] === 'FAQPage' && !ld.mainEntity?.every((q) => q.name && q.acceptedAnswer?.text)) falha(`${p}: FAQPage incompleta`);
      if (ld['@type'] === 'BreadcrumbList' && !ld.itemListElement?.every((i) => i.item?.startsWith('http'))) falha(`${p}: Breadcrumb inválido`);
    } catch (e) {
      falha(`${p}: JSON-LD inválido (${e.message})`);
    }
  }
  if (!/<title>[^<]+<\/title>/.test(html)) falha(`${p}: sem <title>`);
  if (!/<link rel="canonical"/.test(html)) falha(`${p}: sem canonical`);
}
ok(`${htmls(DIST).length} páginas HTML, ${blocos} blocos JSON-LD válidos`);

if (erros) { console.error(`\n${erros} erro(s).`); process.exit(1); }
console.log('\nTudo certo.');
