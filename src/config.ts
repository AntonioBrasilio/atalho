/**
 * CONFIGURAÇÃO CENTRAL DO ATALHO
 * Tudo que você precisa mudar sem mexer no resto do código fica aqui.
 * Depois de editar, faça commit e push: a Netlify publica sozinha.
 */

export type ProvedorAds = 'none' | 'adsense' | 'adsterra';

export interface AdsterraBloco {
  /** "key" do bloco (aparece no código que a Adsterra te dá: atOptions.key) */
  key: string;
  width: number;
  height: number;
}

export const config = {
  // ── Identidade ───────────────────────────────────────────────
  siteName: 'Atalho',
  /** Domínio final, SEM barra no fim. Troque quando apontar seu domínio. */
  siteUrl: 'https://atalho-games.netlify.app',
  descricaoPadrao:
    'Respostas rápidas de games em 1 linha. Dúvidas de GTA 6 respondidas na hora, com selo de confiabilidade.',
  emailContato: 'contato@exemplo.com.br', // [PREENCHER]
  /** Nome do responsável pelo site (aparece na Política de Privacidade). */
  responsavel: '[PREENCHER: seu nome ou razão social]',

  // ── Analytics (deixe vazio para desativar) ───────────────────
  ga4Id: '', // ex.: 'G-XXXXXXXXXX'
  cloudflareAnalyticsToken: '', // token do Cloudflare Web Analytics (opcional)

  // ── Anúncios ─────────────────────────────────────────────────
  ads: {
    provider: 'none' as ProvedorAds,
    /** ex.: 'ca-pub-1234567890123456' */
    adsenseClient: '',
    adsenseSlots: { top: '', middle: '', bottom: '' },
    adsterraScripts: {
      top: { key: '', width: 320, height: 50 },
      middle: { key: '', width: 300, height: 250 },
      bottom: { key: '', width: 300, height: 250 },
    } as Record<'top' | 'middle' | 'bottom', AdsterraBloco>,
    /** Domínio do invoke.js que aparece no código do bloco Adsterra (confira no seu painel). */
    adsterraDominio: 'https://www.highperformanceformat.com',
    /**
     * Linhas do /ads.txt. Para AdSense o formato é:
     * 'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0'
     */
    adsTxt: [] as string[],
  },

  /** Caixa "Oferecido por" no topo do hub /gta6/ */
  patrocinador: {
    ativo: false,
    nome: '',
    url: '',
    texto: '',
  },

  // ── Afiliados ────────────────────────────────────────────────
  afiliados: {
    /** Tag da Amazon Associados, ex.: 'atalho-20' */
    amazonTag: '',
    /**
     * ID de afiliado do Mercado Livre. Prefira colar no guia o link já gerado
     * pelo painel de afiliados do ML; se preencher id + parâmetro abaixo,
     * o site acrescenta ?<param>=<id> nos links do ML.
     */
    mercadoLivreId: '',
    mercadoLivreParam: '', // [PREENCHER conforme o programa de afiliados do ML]
  },

  // ── Comunidade ───────────────────────────────────────────────
  whatsappChannelUrl: '', // ex.: 'https://whatsapp.com/channel/XXXX'
  discordUrl: '', // ex.: 'https://discord.gg/XXXX'

  // ── Produto digital ──────────────────────────────────────────
  produto: {
    nome: 'Guia Platina GTA 6',
    preco: 'R$ [PREENCHER]',
    checkoutUrl: '', // link Kiwify/Hotmart
    ativo: false,
  },

  // ── Formulários (Google Forms) ───────────────────────────────
  formularios: {
    /**
     * Correção: URL do "link pré-preenchido" do Google Forms SEM o valor.
     * ex.: 'https://docs.google.com/forms/d/e/XXXX/viewform'
     */
    correcaoUrl: '',
    /** Campo que recebe o slug, ex.: 'entry.123456789' */
    correcaoCampoSlug: '',
    /**
     * Busca sem resultado: URL de envio (termina em /formResponse).
     * ex.: 'https://docs.google.com/forms/d/e/XXXX/formResponse'
     */
    buscaSemResultadoUrl: '',
    /** Campo "termo", ex.: 'entry.987654321' */
    buscaSemResultadoCampo: '',
  },

  avisoFan: 'Site de fãs não oficial. Não afiliado à Rockstar Games ou Take-Two.',
} as const;

/** Jogos disponíveis no site. Para adicionar um jogo novo, inclua aqui e crie /src/pages/<jogo>/. */
export const jogos = [
  {
    id: 'gta6',
    nome: 'GTA 6',
    descricao: 'Lançamento, polícia, mapa, códigos, troféus e erros.',
    url: '/gta6/',
  },
] as const;
