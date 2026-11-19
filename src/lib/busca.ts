/* Busca instantânea no navegador (Fuse.js sobre /search.json). */
import type Fuse from 'fuse.js';
import { lerCfg } from './cliente';

interface Item {
  u: string; // url
  p: string; // pergunta
  r: string; // resposta curta
  st: 'confirmado' | 'vazamento' | 'testando';
  c: string; // categoria
  t: string[]; // tags
  sn: string[]; // sinônimos
}

const SELO: Record<Item['st'], string> = {
  confirmado: '✅ Confirmado',
  vazamento: '🟡 Não oficial',
  testando: '⏳ Testando',
};

const CATEGORIA: Record<string, string> = {
  lancamento: 'Geral',
  policia: 'Polícia',
  dinheiro: 'Dinheiro',
  mecanicas: 'Mecânicas',
  mapa: 'Mapa',
  personagens: 'Personagens',
  missoes: 'Missões',
  trofeus: 'Troféus',
  erros: 'Erros',
  codigos: 'Códigos',
  veiculos: 'Veículos',
  armas: 'Armas',
  segredos: 'Segredos',
};

let fusePromise: Promise<Fuse<Item>> | null = null;
function carregarFuse() {
  fusePromise ??= Promise.all([import('fuse.js'), fetch('/search.json').then((r) => r.json())]).then(
    ([mod, dados]) =>
      new mod.default<Item>(dados as Item[], {
        keys: [
          { name: 'p', weight: 0.5 },
          { name: 'sn', weight: 0.25 },
          { name: 't', weight: 0.15 },
          { name: 'r', weight: 0.1 },
        ],
        ignoreDiacritics: true,
        isCaseSensitive: false,
        ignoreLocation: true,
        threshold: 0.4,
        minMatchCharLength: 2,
      }),
  );
  return fusePromise;
}

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const termosEnviados = new Set<string>();

function enviarSemResultado(termo: string) {
  const cfg = lerCfg();
  const t = normalizar(termo);
  if (t.length < 3 || termosEnviados.has(t)) return;
  termosEnviados.add(t);
  window.atalhoTrack?.('search_no_result', { termo: t });
  if (!cfg.form?.url || !cfg.form?.campo) return;
  const body = new URLSearchParams({ [cfg.form.campo]: termo.trim() });
  // no-cors: não bloqueia a interface e não precisa de resposta
  fetch(cfg.form.url, { method: 'POST', mode: 'no-cors', body }).catch(() => {});
}

export function iniciarBuscas() {
  document.querySelectorAll<HTMLFormElement>('form[data-busca]').forEach((form, idx) => {
    if (form.dataset.pronto) return;
    form.dataset.pronto = '1';
    const input = form.querySelector<HTMLInputElement>('input[type="search"]')!;
    const lista = form.querySelector<HTMLUListElement>('[role="listbox"]')!;
    const vazio = form.querySelector<HTMLElement>('.busca-vazio')!;
    let ativo = -1;
    let itens: Item[] = [];
    let timer: number | undefined;
    let timerEvento: number | undefined;

    const fechar = () => {
      lista.hidden = true;
      vazio.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      ativo = -1;
    };

    const marcar = (i: number) => {
      const lis = lista.querySelectorAll<HTMLLIElement>('li');
      lis.forEach((li, j) => li.setAttribute('aria-selected', String(j === i)));
      ativo = i;
      if (lis[i]) {
        input.setAttribute('aria-activedescendant', lis[i].id);
        lis[i].scrollIntoView({ block: 'nearest' });
      }
    };

    const render = (termo: string) => {
      if (!itens.length) {
        lista.hidden = true;
        lista.innerHTML = '';
        vazio.hidden = false;
        input.setAttribute('aria-expanded', 'false');
        clearTimeout(timerEvento);
        timerEvento = window.setTimeout(() => enviarSemResultado(termo), 1200);
        return;
      }
      vazio.hidden = true;
      lista.innerHTML = itens
        .map(
          (it, i) => `<li role="option" id="b${idx}-op${i}" aria-selected="false">
            <a href="${esc(it.u)}" tabindex="-1">
              <span class="meta-r"><span class="sel sel-${it.st}">${SELO[it.st]}</span><span class="cat">${esc(CATEGORIA[it.c] ?? '')}</span></span>
              <strong>${esc(it.p)}</strong>
              <span class="resumo">${esc(it.r)}</span>
            </a></li>`,
        )
        .join('');
      lista.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      ativo = -1;
      clearTimeout(timerEvento);
      timerEvento = window.setTimeout(() => window.atalhoTrack?.('search', { termo: normalizar(termo) }), 1200);
    };

    const buscar = async () => {
      const termo = input.value;
      if (normalizar(termo).length < 2) {
        fechar();
        return;
      }
      const fuse = await carregarFuse();
      itens = fuse.search(termo, { limit: 8 }).map((r) => r.item);
      if (input.value === termo) render(termo);
    };

    input.addEventListener('focus', () => void carregarFuse(), { once: true });
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = window.setTimeout(buscar, 120);
    });
    input.addEventListener('keydown', (e) => {
      const n = itens.length;
      if (e.key === 'ArrowDown' && !lista.hidden) {
        e.preventDefault();
        marcar((ativo + 1) % n);
      } else if (e.key === 'ArrowUp' && !lista.hidden) {
        e.preventDefault();
        marcar((ativo - 1 + n) % n);
      } else if (e.key === 'Escape') {
        if (lista.hidden && vazio.hidden) input.value = '';
        fechar();
      }
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearTimeout(timer);
      await buscar();
      const alvo = itens[ativo >= 0 ? ativo : 0];
      if (alvo && !lista.hidden) {
        window.atalhoTrack?.('search', { termo: normalizar(input.value) });
        location.href = alvo.u;
      }
    });
    document.addEventListener('click', (e) => {
      if (!form.contains(e.target as Node)) fechar();
    });

    // Atalho de teclado: "/" foca a primeira busca da página
    if (idx === 0) {
      document.addEventListener('keydown', (e) => {
        const alvo = e.target as HTMLElement;
        if (e.key !== '/' || alvo.closest('input, textarea, [contenteditable]')) return;
        e.preventDefault();
        input.focus();
      });
    }

    // Link de busca: ?q=termo
    if (idx === 0) {
      const q = new URLSearchParams(location.search).get('q');
      if (q) {
        input.value = q;
        buscar();
      }
    }
  });
}
