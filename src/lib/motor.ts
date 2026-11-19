/**
 * Motor de busca do Atalho (sem dependências, roda no navegador e no build).
 *
 * Como funciona, em ordem:
 * 1. Normaliza (minúsculas, sem acento, sem pontuação) e tira palavras vazias ("como", "o", "gta", "6"...).
 * 2. Reduz cada palavra ao radical ("carros", "carro" → "carr"; "guardei", "guardar" → "guard").
 * 3. Expande gírias e sinônimos ("grana" → dinheiro, "xit" → cheat, "tira" → polícia).
 * 4. Corrige erros de digitação (distância de edição) e completa a palavra que ainda está sendo digitada.
 * 5. Pontua cada resposta por campo (pergunta > sinônimos > tags > resposta > texto), com peso pela raridade
 *    da palavra (IDF), bônus para frases inteiras e forte preferência por respostas que cobrem todas as palavras.
 */

export interface Doc {
  u: string; // url
  p: string; // pergunta
  r: string; // resposta curta
  st: 'confirmado' | 'vazamento' | 'testando';
  c: string; // categoria
  cn: string; // nome da categoria
  t: string[]; // tags
  sn: string[]; // sinônimos
  k: string; // palavras do texto completo (normalizadas, sem repetição)
  cd?: string; // sequência do cheat, se houver
  d?: 1; // destaque
}

export interface Resultado {
  doc: Doc;
  score: number;
  cobertura: number;
}

export interface Busca {
  resultados: Resultado[];
  /** true quando o 1º resultado é claramente a resposta certa. */
  certeiro: boolean;
  /** Termo corrigido, quando houve correção de digitação. */
  correcao?: string;
}

export const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, ' ')
    .trim();

const STOP = new Set(
  (
    'a o as os um uma uns umas de do da dos das no na nos nas em num numa pra pro pras pros para por pelo pela ' +
    'pelos pelas com e ou que q qual quais como cmo onde aonde quando quanto quanta quantos quantas eu meu minha ' +
    'meus minhas me mim voce vc vcs tu se ao aos e eh ser esta ta to estou isso esse essa este ai la aqui ' +
    'tem ter tenho tinha ha jogo game gta 6 vi gta6 gtavi alguem sabe favor ja so mais muito mt mto consigo ' +
    'posso pode da dar faz fazer fazendo coisa'
  ).split(' '),
);

// Do mais longo para o mais curto: corta só um sufixo.
const SUFIXOS = [
  'amentos', 'imentos', 'amento', 'imento', 'mente', 'acoes', 'icoes', 'acao', 'icao', 'ando', 'endo', 'indo',
  'aram', 'eram', 'iram', 'ados', 'idos', 'adas', 'idas', 'ado', 'ido', 'ada', 'ida', 'oes', 'aes', 'ais', 'eis',
  'eus', 'ens', 'ao', 'ar', 'er', 'ir', 'ou', 'ei', 'eu', 'am', 'em', 'as', 'es', 'os', 'is', 'al', 'a', 'e', 'o', 's',
];

export function radical(w: string): string {
  if (w.length <= 3 || /\d/.test(w)) return w;
  for (const s of SUFIXOS) if (w.endsWith(s) && w.length - s.length >= 3) return w.slice(0, -s.length);
  return w;
}

/** Grupos de sinônimos e gírias. Qualquer palavra do grupo puxa as outras com peso menor. */
const GRUPOS: string[][] = [
  ['dinheiro', 'grana', 'money', 'bufunfa', 'cash', 'dindin', 'dolar', 'dolares', 'rico', 'conto'],
  ['carro', 'veiculo', 'auto', 'possante', 'nave', 'automovel', 'car', 'moto', 'motocicleta'],
  ['policia', 'tira', 'tiras', 'cana', 'viatura', 'pm', 'swat', 'cop', 'gambe', 'policial'],
  ['procurado', 'estrela', 'wanted', 'heat', 'perseguicao', 'nivel'],
  ['cheat', 'codigo', 'manha', 'macete', 'trapaca', 'senha', 'truque', 'hack', 'xit', 'chit', 'xiti', 'xeat', 'chiti', 'cheet'],
  ['salvar', 'save', 'gravar', 'salvo', 'progresso', 'autosave'],
  ['guardar', 'estacionar', 'registrar', 'deixar'],
  ['garagem', 'garage', 'vaga', 'estacionamento'],
  ['arma', 'pistola', 'fuzil', 'metralhadora', 'escopeta', 'sniper', 'rifle', 'shotgun', 'revolver', 'faca', 'doze', 'oitao'],
  ['municao', 'bala', 'ammo', 'cartucho', 'pente'],
  ['vida', 'colete', 'armadura', 'saude', 'health', 'blindagem'],
  ['erro', 'bug', 'crash', 'travando', 'travar', 'trava', 'congelou', 'congelando', 'fechando', 'crashando', 'travou', 'buga', 'bugou', 'preta'],
  ['fps', 'desempenho', 'performance', 'lag', 'engasgando', 'stuttering', 'travadinha', 'lento', 'grafico'],
  ['trofeu', 'conquista', 'achievement', 'platina', 'platinar'],
  ['missao', 'quest', 'historia', 'campanha', 'capitulo'],
  ['roupa', 'visual', 'cabelo', 'tatuagem', 'aparencia', 'barba', 'barbearia', 'look'],
  ['celular', 'telefone', 'phone', 'smartphone', 'app', 'aplicativo'],
  ['tunar', 'tuning', 'personalizar', 'modificar', 'oficina', 'customizar', 'pintar', 'rebaixar'],
  ['gasolina', 'combustivel', 'abastecer', 'posto', 'tanque'],
  ['infinito', 'infinita', 'ilimitado', 'ilimitada', 'unlimited', 'eterno', 'max', 'maximo'],
  ['raro', 'secreto', 'escondido', 'exclusivo', 'unico', 'especial', 'classico'],
  ['ganhar', 'conseguir', 'farmar', 'arrumar', 'faturar', 'juntar'],
  ['roubar', 'furtar', 'assaltar', 'roubo', 'assalto', 'robar', 'pegar'],
  ['vender', 'venda', 'desmanche', 'revender'],
  ['comprar', 'compra', 'adquirir', 'loja'],
  ['chamar', 'pedir', 'recuperar', 'sumiu', 'cade'],
  ['fugir', 'despistar', 'escapar', 'baixar', 'tirar', 'zerar', 'perder'],
  ['morrer', 'morte', 'morri', 'wasted', 'preso', 'busted', 'prender', 'hospital'],
  ['mapa', 'map', 'regiao', 'cidade', 'lugar'],
  ['rapido', 'rapida', 'facil', 'rapidinho', 'ligeiro'],
  ['viagem', 'teleporte', 'taxi', 'teletransporte', 'fast', 'travel'],
  ['radio', 'musica', 'som', 'trilha', 'soundtrack'],
  ['mergulho', 'mergulhar', 'tesouro', 'naufragio'],
  ['segredo', 'easter', 'egg', 'misterio', 'curiosidade', 'bigfoot'],
  ['colecionavel', 'coletavel', 'carta', 'relogio', '100%'],
  ['clima', 'tempo', 'chuva', 'sol', 'weather'],
  ['casa', 'apartamento', 'imovel', 'propriedade', 'safehouse', 'mansao'],
  ['ps5', 'playstation', 'ps', 'play', 'sony'],
  ['xbox', 'series', 'microsoft'],
  ['academia', 'malhar', 'treinar', 'musculo', 'forte', 'gordo', 'magro'],
  ['online', 'multiplayer', 'amigos', 'coop'],
  ['lista', 'todos', 'todas', 'tudo'],
  ['personagem', 'protagonista', 'boneco'],
];

const SIN = new Map<string, Set<string>>();
/** Forma canônica (1º radical do grupo), usada para comparar frases: "xit de grana" = "cheat de dinheiro". */
const CANON = new Map<string, string>();
for (const g of GRUPOS) {
  const rads = g.map(radical);
  for (const r of rads) {
    if (!CANON.has(r)) CANON.set(r, rads[0]);
    const s = SIN.get(r) ?? new Set<string>();
    rads.forEach((x) => x !== r && s.add(x));
    SIN.set(r, s);
  }
}
const RAD_CHEAT = radical('cheat');
const RAD_LISTA = radical('lista');
const RAD_INFINITO = radical('infinito');
const canon = (r: string) => CANON.get(r) ?? r;

function palavras(s: string): string[] {
  return normalizar(s).split(' ').filter(Boolean);
}
function radicais(s: string): string[] {
  return palavras(s)
    .filter((w) => !STOP.has(w))
    .map((w) => canon(radical(w)));
}

/** Distância de edição com transposição (OSA), com corte antecipado. */
function distancia(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const m = a.length;
  const n = b.length;
  let ant2: number[] = [];
  let ant = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    let menor = i;
    for (let j = 1; j <= n; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(ant[j] + 1, cur[j - 1] + 1, ant[j - 1] + custo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, ant2[j - 2] + 1);
      cur[j] = v;
      if (v < menor) menor = v;
    }
    if (menor > max) return max + 1;
    ant2 = ant;
    ant = cur;
  }
  return ant[n];
}

const PESO = { p: 3, sn: 2.6, t: 2, cn: 1.3, r: 1.2, k: 0.45 } as const;

interface DocIdx {
  doc: Doc;
  termos: Map<string, number>;
  frases: string[]; // pergunta e sinônimos como sequência de radicais "a b c"
}

export class Motor {
  private docs: DocIdx[];
  private idf = new Map<string, number>();
  private vocab: string[];
  private exibir = new Map<string, string>(); // radical → palavra original para "Mostrando resultados para"

  constructor(lista: Doc[]) {
    this.docs = lista.map((doc) => {
      const termos = new Map<string, number>();
      const add = (txt: string, w: number) => {
        for (const pal of palavras(txt)) {
          if (STOP.has(pal)) continue;
          const r = radical(pal);
          if (!this.exibir.has(r) && w >= PESO.t) this.exibir.set(r, pal);
          if ((termos.get(r) ?? 0) < w) termos.set(r, w);
        }
      };
      add(doc.k, PESO.k);
      add(doc.r, PESO.r);
      add(doc.cn, PESO.cn);
      doc.t.forEach((x) => add(x, PESO.t));
      doc.sn.forEach((x) => add(x, PESO.sn));
      add(doc.p, PESO.p);
      const frases = [doc.p, ...doc.sn, ...doc.t].map((x) => radicais(x).join(' ')).filter(Boolean);
      return { doc, termos, frases };
    });
    const df = new Map<string, number>();
    for (const d of this.docs) for (const t of d.termos.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    const N = this.docs.length;
    for (const [t, n] of df) this.idf.set(t, Math.log(1 + (N - n + 0.5) / (n + 0.5)));
    this.vocab = [...df.keys()];
    for (const t of this.vocab) if (!this.exibir.has(t)) this.exibir.set(t, t);
  }

  /** Candidatos para uma palavra da busca: radical → peso (1 = exato). */
  private candidatos(pal: string, ultima: boolean): { mapa: Map<string, number>; corrigida?: string } {
    const mapa = new Map<string, number>();
    const put = (r: string, w: number) => {
      if ((mapa.get(r) ?? 0) < w) mapa.set(r, w);
    };
    const r = radical(pal);
    let corrigida: string | undefined;
    const conhecido = this.idf.has(r) || SIN.has(r);
    if (this.idf.has(r)) put(r, 1);
    SIN.get(r)?.forEach((s) => put(s, 0.7));

    // Completa a palavra que ainda está sendo digitada ("gar" → garagem)
    if (ultima && pal.length >= 2) {
      for (const v of this.vocab) if (v !== r && v.startsWith(pal)) put(v, pal.length >= 4 ? 0.85 : 0.6);
    }

    // Corrige erro de digitação quando a palavra não existe
    if (!conhecido && pal.length >= 4) {
      const max = pal.length >= 7 ? 2 : 1;
      let melhor = max + 1;
      let alvo = '';
      for (const v of [...this.vocab, ...SIN.keys()]) {
        const d = distancia(r, v, max);
        if (d > max) continue;
        const w = d === 1 ? 0.8 : 0.55;
        if (this.idf.has(v)) put(v, w);
        SIN.get(v)?.forEach((s) => put(s, w * 0.7));
        if (d < melhor) {
          melhor = d;
          alvo = v;
        }
      }
      if (alvo) corrigida = this.exibir.get(alvo) ?? alvo;
    }
    return { mapa, corrigida };
  }

  buscar(consulta: string, limite = 8): Busca {
    const todas = palavras(consulta);
    let pals = todas.filter((w) => !STOP.has(w));
    if (!pals.length) pals = todas.filter((w) => w.length > 1 && !['gta', '6', 'vi'].includes(w));
    // Busca vazia ou só "gta 6": mostra os destaques
    if (!pals.length)
      return {
        resultados: this.docs.filter((d) => d.doc.d).slice(0, limite).map((d) => ({ doc: d.doc, score: 1, cobertura: 0 })),
        certeiro: false,
      };
    pals = [...new Set(pals)].slice(0, 10);

    const terminouComEspaco = /\s$/.test(consulta);
    let houveCorrecao = false;
    const qs = pals.map((p, i) => {
      const c = this.candidatos(p, i === pals.length - 1 && !terminouComEspaco);
      if (c.corrigida) houveCorrecao = true;
      return { pal: p, rad: radical(p), ...c };
    });
    const frase = qs.map((q) => canon(q.rad)).join(' ');
    const temCheat = qs.some((q) => canon(q.rad) === RAD_CHEAT || canon(q.rad) === RAD_INFINITO);
    const temLista = qs.some((q) => q.rad === RAD_LISTA);

    const res: Resultado[] = [];
    for (const d of this.docs) {
      let soma = 0;
      let cobertos = 0;
      for (const q of qs) {
        let melhor = 0;
        for (const [rad, w] of q.mapa) {
          const campo = d.termos.get(rad);
          if (!campo) continue;
          const v = w * campo * (this.idf.get(rad) ?? 0);
          if (v > melhor) melhor = v;
        }
        if (melhor > 0) cobertos++;
        soma += melhor;
      }
      if (!cobertos) continue;
      const cobertura = cobertos / qs.length;
      let score = soma * (0.35 + 0.65 * cobertura * cobertura);

      // Frase inteira na pergunta/sinônimos e pares de palavras na ordem certa
      if (qs.length > 1) {
        if (d.frases.some((f) => f === frase)) score *= 1.9;
        else if (d.frases.some((f) => ` ${f} `.includes(` ${frase} `))) score *= 1.5;
        else {
          let pares = 0;
          for (let i = 0; i < qs.length - 1; i++) {
            const par = `${canon(qs[i].rad)} ${canon(qs[i + 1].rad)}`;
            if (d.frases.some((f) => ` ${f} `.includes(` ${par} `))) pares++;
          }
          score *= 1 + 0.25 * pares;
        }
      } else if (d.frases.some((f) => f === frase)) score *= 1.4;

      // Intenção
      if (temCheat && d.doc.c === 'codigos') score *= 1.25;
      if (temLista && d.doc.u.includes('lista')) score *= 1.3;
      if (d.doc.d) score *= 1.06;
      if (d.doc.st === 'confirmado') score *= 1.03;

      res.push({ doc: d.doc, score, cobertura });
    }
    res.sort((a, b) => b.score - a.score);
    const topo = res[0];
    if (!topo) return { resultados: [], certeiro: false };

    const corte = topo.score * 0.22;
    const minCobertura = qs.length >= 3 ? 0.5 : qs.length === 2 ? 0.5 : 1;
    const resultados = res.filter((x) => x.score >= corte && x.cobertura >= minCobertura).slice(0, limite);
    const seg = resultados[1];
    const certeiro = !!resultados.length && topo.cobertura === 1 && (!seg || topo.score >= seg.score * 1.18);
    const correcao = houveCorrecao
      ? qs.map((q) => q.corrigida ?? q.pal).join(' ')
      : undefined;
    return { resultados, certeiro, correcao };
  }
}
