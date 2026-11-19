# Atalho: respostas rápidas de games

Site estático (Astro) com respostas curtas sobre games. A primeira área é **GTA 6** em `/gta6/`.
Mobile-first, sem backend, busca instantânea no navegador.

- Conteúdo: `src/content/respostas/*.md` (uma resposta por arquivo) e `src/content/guias/*.md`
- Configuração central: **`src/config.ts`** (anúncios, afiliados, GA4, WhatsApp, formulários, produto)
- Hospedagem: Netlify (build `npm run build`, saída `dist`), com deploy automático a cada push no GitHub

> Tudo marcado como **[PREENCHER]** precisa ser completado por você antes de publicar.

---

## a) Rodar localmente

Requisitos: Node.js 22.23 ou mais novo (recomendado 24).

```powershell
npm install
npm run dev
```

Abra http://localhost:4321. Outros comandos:

| Comando | O que faz |
|---|---|
| `npm run build` | Gera o site em `dist/` |
| `npm run preview` | Serve o `dist/` localmente |
| `npm run check` | Build + validação (páginas, search.json, sitemap, JSON-LD) |
| `npx astro check` | Checagem de tipos |

---

## b) Adicionar uma resposta nova em 2 minutos

1. Crie um arquivo em `src/content/respostas/` com o nome igual ao slug, por exemplo `onde-fica-a-praia-gta-6.md`.
2. Cole e edite:

```markdown
---
slug: "onde-fica-a-praia-gta-6"
jogo: gta6
pergunta: "Onde fica a praia no GTA 6?"
resposta_curta: "Resposta em 1 ou 2 frases, até 220 caracteres. Ela vira o destaque e a meta description."
categoria: mapa
tags: ["mapa", "praia"]
sinonimos: ["beira mar", "litoral"]
status: testando
fonte_nome: "Nome do site"
fonte_url: "https://exemplo.com/materia"
atualizado_em: 2026-11-20T14:30:00-03:00
destaque: false
---

Detalhes em markdown: passo a passo, listas, tabelas e links para outras respostas,
por exemplo [quanto espaço precisa](/gta6/r/quanto-espaco-gta-6-precisa/).
```

3. Faça commit e push. A Netlify publica em 1 a 2 minutos.

Os atalhos "Mais buscadas" da home ficam em `src/pages/index.astro` (lista `populares`). A contagem regressiva do lançamento fica em `src/components/StatusLancamento.astro` e vira "Já disponível" sozinha depois da data.

**Campos:**

| Campo | Valores |
|---|---|
| `categoria` | `lancamento`, `policia`, `dinheiro`, `mecanicas`, `mapa`, `personagens`, `missoes`, `trofeus`, `erros`, `codigos` |
| `status` | `confirmado` (✅), `vazamento` (🟡), `testando` (⏳) |
| `fontes_extras` | opcional, lista `- { nome: "Site", url: "https://..." }` |
| `afiliado_contextual` | opcional, slug de um guia de `/comprar/` (ex.: `ssd-ps5-gta6`) |
| `destaque` | `true` para aparecer nos destaques do hub |
| `codigo` | opcional, só para cheats confirmados (ver abaixo) |

O build **falha** se algum campo estiver errado (slug fora do padrão, resposta curta com mais de 220 caracteres, categoria inexistente…). A mensagem de erro diz qual arquivo e qual campo corrigir.

### Códigos (cheats)

A página `/gta6/codigos/` mostra duas tabelas, montadas a partir das respostas com `categoria: codigos` e o campo `codigo` preenchido:

- **Testados por nós:** `status: confirmado`. Só marque assim depois de testar no jogo.
- **Divulgados (ainda não testados):** `status: vazamento` ou `testando`.

Respostas sem o campo `codigo` (como "Cheats funcionam no GTA Online?") não entram nas tabelas.

```yaml
categoria: codigos
status: vazamento        # troque para confirmado depois de testar
codigo:
  plataforma: ambos      # ps5, xbox ou ambos
  sequencia: "↑ → ↓ ← ↑ ← ↓ →"
  efeito: "+$250.000"
```

### Respostas removidas

Ao apagar uma resposta, adicione uma linha em `public/_redirects` apontando o endereço antigo para uma página parecida (redirecionamento 301). Assim quem chega por link antigo ou pelo Google não cai na 404. O `npm run check` acusa qualquer link interno quebrado.

### Troféus

Edite `src/data/trofeus.json`. Enquanto a lista estiver vazia, a página mostra o `status`. Exemplo de item:

```json
{ "id": "primeiro-roubo", "nome": "Nome do troféu", "descricao": "Como desbloquear", "tipo": "bronze", "dica": "opcional" }
```

`tipo`: `bronze`, `prata`, `ouro` ou `platina`. O checklist salva o progresso no navegador da pessoa.

---

## c) Mudar o status e a data de uma resposta

Abra o `.md` da resposta e altere:

```yaml
status: confirmado
atualizado_em: 2026-11-19T00:15:00-03:00
```

- Use sempre o fuso `-03:00` (horário de Brasília).
- A home ordena "Respostas novas hoje" por `atualizado_em`, e o RSS também.
- Ao confirmar uma resposta que estava em teste, troque também a `resposta_curta` e os detalhes.

---

## d) Deploy na Netlify via GitHub

O repositório já tem `netlify.toml` (build `npm run build`, pasta `dist`, Node 24).

1. Suba o projeto para o GitHub (já feito, se você usou o repositório criado).
2. Em https://app.netlify.com → **Add new site → Import an existing project → GitHub**.
3. Escolha o repositório `atalho`. A Netlify lê o `netlify.toml`; não precisa mudar nada.
4. Clique em **Deploy**. Cada `git push` na branch `master` publica de novo.
5. Em **Site configuration → Change site name** você define o subdomínio `*.netlify.app`.

> Depois de definir o endereço final, atualize `siteUrl` em `src/config.ts`. Ele é usado no canonical, no sitemap, no RSS e no JSON-LD.

**Alternativa, Cloudflare Pages:** Workers & Pages → Create → Pages → Connect to Git → framework "Astro", build `npm run build`, saída `dist`, variável `NODE_VERSION=24`.

---

## e) Apontar um domínio .com.br (registro.br)

**Opção 1: DNS na Netlify (mais simples)**

1. Netlify → **Domain management → Add a domain** → digite `seudominio.com.br` → **Add domain**.
2. Clique em **Set up Netlify DNS**. A Netlify mostra 4 nameservers (ex.: `dns1.p01.nsone.net`).
3. No https://registro.br → **Meus domínios** → seu domínio → **Alterar servidores DNS** → cole os 4 nameservers → **Salvar**.
4. Aguarde a propagação (de minutos a algumas horas). O HTTPS (Let's Encrypt) é ativado sozinho.

**Opção 2: DNS no Cloudflare**

1. Cloudflare → **Add a domain** → plano Free. Copie os 2 nameservers informados.
2. Coloque esses nameservers no registro.br (mesmo caminho acima).
3. No Cloudflare, em DNS, crie:
   - `CNAME` `@` → `seu-site.netlify.app` (com proxy **desligado**, nuvem cinza)
   - `CNAME` `www` → `seu-site.netlify.app` (proxy desligado)
4. Na Netlify, adicione o domínio em **Domain management** para emitir o certificado.

Por fim, troque `siteUrl` em `src/config.ts` para `https://seudominio.com.br` e faça push.

---

## f) Ativar anúncios, afiliados, GA4 e formulários (`src/config.ts`)

### AdSense
```ts
ads: {
  provider: 'adsense',
  adsenseClient: 'ca-pub-1234567890123456',
  adsenseSlots: { top: '1111111111', middle: '2222222222', bottom: '3333333333' },
  adsTxt: ['google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0'],
}
```
Crie os blocos em AdSense → Anúncios → Por bloco de anúncios → **Display** e copie o `data-ad-slot` de cada um.

### Adsterra
```ts
ads: {
  provider: 'adsterra',
  adsterraScripts: {
    top: { key: 'abc123...', width: 320, height: 50 },
    middle: { key: '', width: 300, height: 250 },   // key vazia = bloco desligado
    bottom: { key: 'def456...', width: 300, height: 250 },
  },
  adsterraDominio: 'https://www.highperformanceformat.com', // confira no código do bloco
}
```
Use **apenas** formatos Banner/Native. Pop-under, Social Bar e redirecionamentos não são suportados de propósito.

**Regras já aplicadas no código:** no máximo 2 blocos por resposta (topo e fim), 1 no guia de compra (só no fim) e 0 em `/guia-platina/`, `/comunidade/` e páginas legais. Os scripts só carregam depois que a pessoa aceita os cookies.

### Patrocinador fixo no hub
```ts
patrocinador: { ativo: true, nome: 'Marca', url: 'https://...', texto: 'frase curta' }
```

### Afiliados
```ts
afiliados: { amazonTag: 'seutag-20', mercadoLivreId: '', mercadoLivreParam: '' }
```
- Amazon: cole no guia o link normal do produto; o site acrescenta `?tag=` sozinho.
- Mercado Livre: cole no guia o link **já gerado** no painel de afiliados do ML. Os campos `mercadoLivreId`/`mercadoLivreParam` só servem se o programa usar um parâmetro fixo na URL.
- Enquanto o link tiver `[PREENCHER]`, o botão aparece desativado como "em breve".

### GA4
```ts
ga4Id: 'G-XXXXXXXXXX'
```
Eventos enviados: `search`, `search_no_result`, `affiliate_click` (loja, guia), `whatsapp_click`, `product_click`, `correction_click`, `share` (slug, method), `copy_answer` (slug), `feedback` (slug, voto = sim/nao) e `filter_status` (status). O GA4 só carrega após o consentimento. Para ver os parâmetros nos relatórios, cadastre `termo`, `loja` e `guia` em Admin → Definições personalizadas.

`cloudflareAnalyticsToken` é opcional e não usa cookies.

### Formulário de busca sem resultado (Google Forms)
1. Crie um formulário com uma pergunta de resposta curta chamada **termo**.
2. Menu ⋮ → **Gerar link pré-preenchido** → digite `teste` → **Gerar link**. O link tem algo como `entry.123456789=teste`.
3. Configure:
```ts
formularios: {
  buscaSemResultadoUrl: 'https://docs.google.com/forms/d/e/SEU_ID/formResponse', // troque viewform por formResponse
  buscaSemResultadoCampo: 'entry.123456789',
  correcaoUrl: 'https://docs.google.com/forms/d/e/OUTRO_ID/viewform',
  correcaoCampoSlug: 'entry.987654321', // campo "página" do formulário de correção
}
```
Os termos chegam na planilha de respostas do formulário. O envio é silencioso e não trava a busca.

### WhatsApp, Discord e produto
```ts
whatsappChannelUrl: 'https://whatsapp.com/channel/...',
discordUrl: 'https://discord.gg/...',
produto: { nome: 'Guia Platina GTA 6', preco: 'R$ 19,90', checkoutUrl: 'https://pay.kiwify.com.br/...', ativo: true },
```
Com `produto.ativo = true`, a página `/guia-platina/` aparece no menu e no sitemap. Complete os textos `[PREENCHER]` em `src/pages/guia-platina.astro`.

---

## g) Checklist para aprovação no AdSense

- [ ] Domínio próprio (o AdSense não aprova subdomínio `*.netlify.app`).
- [ ] `siteUrl` atualizado em `src/config.ts`.
- [ ] `emailContato` e `responsavel` preenchidos (aparecem em Contato e Privacidade).
- [ ] Páginas Sobre, Contato, Privacidade e Termos no ar (já existem) e linkadas no rodapé.
- [ ] Conteúdo original suficiente: idealmente 30+ respostas com detalhes úteis, não só placeholders "testando".
- [ ] Nenhum `[PREENCHER]` visível nas páginas indexadas (guias, anuncie, guia-platina).
- [ ] Sem imagens, logos ou artes oficiais de terceiros.
- [ ] Sitemap enviado e páginas indexadas no Search Console (passo h).
- [ ] `ads.txt` com a linha do AdSense (`config.ads.adsTxt`) e acessível em `/ads.txt`.
- [ ] Banner de cookies funcionando (aparece quando `ga4Id` ou anúncios estão configurados).
- [ ] Antes da aprovação, deixe `provider: 'none'` e cole só o código de verificação, se o AdSense pedir, em `src/layouts/Base.astro`.
- [ ] Navegação simples e site rápido no celular.

---

## h) Enviar o sitemap no Google Search Console

1. Acesse https://search.google.com/search-console → **Adicionar propriedade**.
2. Escolha **Domínio** e digite `seudominio.com.br`.
3. Copie o registro TXT e crie-o no DNS (Netlify DNS ou Cloudflare) → **Verificar**.
4. Menu **Sitemaps** → digite `sitemap-index.xml` → **Enviar**.
5. Use **Inspeção de URL** para pedir a indexação das páginas mais importantes (home, `/gta6/`, respostas de lançamento).

O sitemap é gerado sozinho a cada build. Ele exclui a 404, o `/guia-platina/` inativo e as categorias que já têm página fixa.

---

## Estrutura

```
src/
  config.ts                 ← configuração central
  content.config.ts         ← schema (Zod) das respostas e guias
  content/respostas/*.md    ← uma resposta por arquivo
  content/guias/*.md        ← guias de compra
  data/trofeus.json         ← lista de troféus
  components/               ← Busca, Anuncio, BotaoAfiliado, Selo, etc.
  layouts/Base.astro        ← <head>, SEO, banner de cookies
  lib/                      ← utilitários, busca e scripts do navegador
  pages/                    ← rotas (/, /gta6/, /gta6/r/[slug]/, /comprar/…)
scripts/validar.mjs         ← validação do build
netlify.toml                ← build e cabeçalhos da Netlify
```

### Adicionar outro jogo no futuro
1. Inclua o jogo em `jogos` (`src/config.ts`) e no enum `jogo` de `src/content.config.ts`.
2. Copie `src/pages/gta6/` para `src/pages/<jogo>/` e troque o filtro `jogo === 'gta6'`.

---

Site de fãs não oficial. Não afiliado à Rockstar Games ou Take-Two.
