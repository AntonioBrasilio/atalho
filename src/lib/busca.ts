/* Busca instantânea no navegador (motor próprio sobre /search.json). */
import { lerCfg } from './cliente';
import { Motor, normalizar, type Doc, type Resultado } from './motor';

type Item = Doc;

const SELO: Record<Item['st'], string> = {
  confirmado: '✅ Confirmado',
  vazamento: '❓ Não confirmado',
  testando: '⏳ Testando',
};

let motorPromise: Promise<Motor> | null = null;
function carregarMotor() {
  motorPromise ??= fetch('/search.json')
    .then((r) => r.json())
    .then((dados: Doc[]) => new Motor(dados));
  return motorPromise;
}

const SETAS: Record<string, string> = { '↑': 'cima', '↓': 'baixo', '←': 'esquerda', '→': 'direita' };
const seqHtml = (seq: string) =>
  `<span class="seq-teclas" aria-label="${esc(seq.split(' ').map((x) => SETAS[x] ?? x).join(', '))}">${seq
    .split(' ')
    .map((x) => `<kbd aria-hidden="true">${esc(x)}</kbd>`)
    .join('')}</span>`;

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
      const lis = lista.querySelectorAll<HTMLLIElement>('li[role="option"]');
      lis.forEach((li, j) => li.setAttribute('aria-selected', String(j === i)));
      ativo = i;
      if (lis[i]) {
        input.setAttribute('aria-activedescendant', lis[i].id);
        lis[i].scrollIntoView({ block: 'nearest' });
      }
    };

    const aviso = form.querySelector<HTMLElement>('.busca-correcao')!;

    const render = (termo: string, certeiro: boolean, correcao?: string) => {
      aviso.hidden = !correcao;
      if (correcao) aviso.innerHTML = `Mostrando resultados para <strong>${esc(correcao)}</strong>`;
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
        .map((it, i) => {
          const meta = `<span class="meta-r"><span class="sel sel-${it.st}">${SELO[it.st]}</span><span class="cat">${esc(it.cn)}</span></span>`;
          if (i === 0)
            return `<li role="option" id="b${idx}-op0" aria-selected="false" class="top">
            <a href="${esc(it.u)}" tabindex="-1">
              <span class="rot">⚡ ${certeiro ? 'Resposta direta' : 'Melhor resposta'}</span>
              <strong>${esc(it.p)}</strong>
              <span class="r-cheia">${esc(it.r)}</span>
              ${it.cd ? seqHtml(it.cd) : ''}
              <span class="rodape-top">${meta}<span class="ver">Ver detalhes →</span></span>
            </a></li>`;
          return `<li role="option" id="b${idx}-op${i}" aria-selected="false">
            <a href="${esc(it.u)}" tabindex="-1">
              ${meta}
              <strong>${esc(it.p)}</strong>
              <span class="resumo">${esc(it.r)}</span>
            </a></li>`;
        })
        .join('');
      if (itens.length > 1)
        lista.children[0].insertAdjacentHTML('afterend', '<li class="sep" role="presentation">Outras respostas</li>');
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
        aviso.hidden = true;
        return;
      }
      const motor = await carregarMotor();
      const b = motor.buscar(termo, 7);
      itens = b.resultados.map((r: Resultado) => r.doc);
      if (input.value === termo) render(termo, b.certeiro, b.correcao);
    };

    input.addEventListener('focus', () => void carregarMotor(), { once: true });
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

    // Botões "pergunte assim": preenchem a 1ª busca e mostram a resposta na hora
    if (idx === 0) {
      document.addEventListener('click', (e) => {
        const b = (e.target as HTMLElement).closest<HTMLElement>('[data-q]');
        if (!b || e.defaultPrevented || (e as MouseEvent).ctrlKey || (e as MouseEvent).metaKey) return;
        e.preventDefault();
        input.value = b.dataset.q!;
        buscar();
        window.atalhoTrack?.('quick_question', { termo: b.dataset.q! });
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
