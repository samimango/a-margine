/* Adattatore del backend (Google Apps Script). Un solo punto d'ingresso: call(metodo, dati).
   - Web App JSON: POST text/plain con {key, method, data} (niente preflight CORS)
   - Pagina ospitata da Apps Script (vecchio modo): google.script.run
   - Non configurato: l'app lavora in locale, call() rifiuta con code 'local'. */
import * as store from './store.js';
import {K} from './store.js';
import {emit} from './bus.js';

const RPC_TIMEOUT = 30000;
export const hasCloudRunner = () => Boolean(globalThis.google?.script?.run);

export function config() {
  const c = store.getJson(K.api, null, 'object');
  return c && typeof c.url === 'string' && typeof c.key === 'string' && validUrl(c.url) && validKey(c.key) ? {url: c.url, key: c.key} : null;
}
export function validUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname === 'script.google.com' && /\/macros\/s\/[\w-]+\/(exec|dev)$/.test(u.pathname) && !u.username && !u.password;
  } catch { return false; }
}
export const validKey = key => typeof key === 'string' && /^[A-Za-z0-9_-]{8,128}$/.test(key);
export const isConfigured = () => hasCloudRunner() || config() !== null;
export const mode = () => hasCloudRunner() ? 'cloud' : config() ? 'remote' : 'local';

export function setConfig(url, key) {
  url = String(url || '').trim(); key = String(key || '').trim();
  if (!validUrl(url)) throw Error('L’indirizzo non sembra quello di un Web App di Google (deve iniziare con https://script.google.com/macros/s/ e finire con /exec).');
  if (!validKey(key)) throw Error('La chiave non è valida: usa quella scritta nei log di Apps Script.');
  if (!store.setJson(K.api, {url, key})) throw Error('Non riesco a salvare le impostazioni su questo dispositivo.');
  emit('config:changed', {configured: true});
}
export function clearConfig() { store.remove(K.api); emit('config:changed', {configured: false}); }

/* «#setup=<url>|<chiave>» (anche con codifica %xx). Restituisce {url,key} o null. */
export function parseSetup(text) {
  let s = String(text || '').trim();
  if (s.startsWith('#')) s = s.slice(1);
  const m = /(?:^|&)setup=(.*)$/.exec(s);
  if (m) s = m[1];
  try { s = decodeURIComponent(s); } catch { /* resta com'è */ }
  const i = s.lastIndexOf('|');
  if (i < 1) return null;
  const url = s.slice(0, i).trim(), key = s.slice(i + 1).trim();
  return validUrl(url) && validKey(key) ? {url, key} : null;
}
export function setupLink() {
  const c = config();
  if (!c) return '';
  return location.origin + location.pathname + '#setup=' + encodeURIComponent(c.url + '|' + c.key);
}
/* Se l'indirizzo contiene #setup=… salva la configurazione e pulisce l'URL. Restituisce 'ok' | 'invalid' | null. */
export function consumeSetupHash() {
  if (!/^#setup=/.test(location.hash)) return null;
  let result = 'invalid';
  const cfg = parseSetup(location.hash);
  if (cfg) { try { setConfig(cfg.url, cfg.key); result = 'ok'; } catch { /* resta invalid */ } }
  try { history.replaceState(history.state, '', location.pathname + location.search); } catch { /* ok */ }
  return result;
}

function fail(message, code, status) { const e = Error(message); e.code = code; e.status = status; return e; }
/* Il servizio ha rifiutato i dati (non è un problema di rete) */
export const isInvalid = err => Boolean(err && (err.status === 400 || /non valid/i.test(String(err.message || err))));
export const isAuthError = err => Boolean(err && (err.code === 'auth' || err.status === 401));

export async function call(method, data, {timeout = RPC_TIMEOUT} = {}) {
  if (hasCloudRunner()) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(Error('Tempo scaduto.')), timeout);
      google.script.run.withSuccessHandler(r => { clearTimeout(t); resolve(r); }).withFailureHandler(e => { clearTimeout(t); reject(e); })[method](data);
    });
  }
  const cfg = config();
  if (!cfg) throw fail('Non collegato a Google.', 'local', 0);
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const t = setTimeout(() => ctl && ctl.abort(), timeout);
  try {
    const res = await fetch(cfg.url, {
      method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, credentials: 'omit', referrerPolicy: 'no-referrer',
      body: JSON.stringify({key: cfg.key, method, data}), signal: ctl ? ctl.signal : undefined,
    });
    if (!res.ok) throw fail('Servizio non disponibile.', 'server', res.status);
    let body;
    try { body = await res.json(); } catch { throw fail('Risposta non valida dal servizio.', 'server', 502); }
    if (!body || typeof body !== 'object') throw fail('Risposta non valida dal servizio.', 'server', 502);
    if (body.ok === false) throw fail(String(body.error || 'Errore del servizio.'), body.code || 'server', body.code === 'auth' ? 401 : body.code === 'invalid' ? 400 : 500);
    return body.data;
  } finally { clearTimeout(t); }
}
export const ping = () => call('ping', null, {timeout: 15000});
