/* Código que roda no navegador: consentimento, GA4, anúncios e eventos. */

export interface ClienteCfg {
  ga4Id: string;
  cfToken: string;
  ads: { provider: 'none' | 'adsense' | 'adsterra'; adsenseClient: string; adsterraDominio: string };
  form: { url: string; campo: string };
  whatsapp: string;
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    adsbygoogle?: unknown[];
    atOptions?: Record<string, unknown>;
    atalhoTrack: (evento: string, params?: Record<string, string>) => void;
  }
}

const CHAVE = 'atalho-consent';

export function lerCfg(): ClienteCfg {
  const el = document.getElementById('atalho-cfg');
  return JSON.parse(el?.textContent || '{}');
}

function lerStorage(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function gravarStorage(k: string, v: string) {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* modo privado ou bloqueado: segue sem salvar */
  }
}

function addScript(src: string, attrs: Record<string, string> = {}, alvo: HTMLElement = document.head) {
  return new Promise<void>((ok) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
    s.onload = () => ok();
    s.onerror = () => ok();
    alvo.appendChild(s);
  });
}

function carregarGA4(id: string) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', id, { anonymize_ip: true });
  addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
}

async function carregarAnuncios(cfg: ClienteCfg) {
  const slots = Array.from(document.querySelectorAll<HTMLElement>('.ad-slot'));
  if (!slots.length) return;
  if (cfg.ads.provider === 'adsense' && cfg.ads.adsenseClient) {
    await addScript(
      `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(cfg.ads.adsenseClient)}`,
      { crossorigin: 'anonymous' },
    );
    for (const _ of slots.filter((s) => s.querySelector('ins.adsbygoogle'))) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        /* ignora */
      }
    }
  }
  if (cfg.ads.provider === 'adsterra') {
    // Um bloco por vez: o invoke.js da Adsterra lê a variável global atOptions.
    for (const slot of slots) {
      const key = slot.dataset.key;
      if (!key) continue;
      window.atOptions = {
        key,
        format: 'iframe',
        height: Number(slot.dataset.h),
        width: Number(slot.dataset.w),
        params: {},
      };
      await addScript(`${cfg.ads.adsterraDominio}/${key}/invoke.js`, {}, slot);
    }
  }
}

export function iniciarSite() {
  const cfg = lerCfg();

  window.atalhoTrack = (evento, params = {}) => {
    try {
      window.gtag?.('event', evento, params);
    } catch {
      /* ignora */
    }
  };

  // Cloudflare Web Analytics não usa cookies: carrega direto se configurado.
  if (cfg.cfToken) {
    addScript('https://static.cloudflareinsights.com/beacon.min.js', {
      defer: '',
      'data-cf-beacon': JSON.stringify({ token: cfg.cfToken }),
    });
  }

  const ativar = () => {
    if (cfg.ga4Id) carregarGA4(cfg.ga4Id);
    if (cfg.ads.provider !== 'none') carregarAnuncios(cfg);
  };

  const banner = document.getElementById('consent');
  if (banner) {
    const escolha = lerStorage(CHAVE);
    if (escolha === 'aceito') ativar();
    else if (!escolha) banner.hidden = false;
    banner.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-consent]');
      if (!btn) return;
      const v = btn.dataset.consent!;
      gravarStorage(CHAVE, v);
      banner.hidden = true;
      if (v === 'aceito') ativar();
    });
  }

  // Eventos por atributo: <a data-track="whatsapp_click" data-track-loja="amazon">
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-track]');
    if (!el) return;
    const params: Record<string, string> = {};
    for (const [k, v] of Object.entries(el.dataset)) {
      if (k.startsWith('track') && k !== 'track' && v) params[k.slice(5).toLowerCase()] = v;
    }
    window.atalhoTrack(el.dataset.track!, params);
  });

  // Reabrir preferências de cookies (link no rodapé)
  document.querySelectorAll('[data-abrir-consent]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (banner) banner.hidden = false;
    }),
  );
}
