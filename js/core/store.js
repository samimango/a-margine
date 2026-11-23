/* localStorage sicuro: ogni chiamata è protetta (Safari in navigazione privata, quota piena, ecc.).
   Le chiavi sono quelle dell'app precedente (margine.*): i dati esistenti restano validi. */

export function get(key, fallback = null) {
  try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch { return fallback; }
}
export function set(key, value) {
  try { localStorage.setItem(key, String(value)); return true; } catch { return false; }
}
export function remove(key) {
  try { localStorage.removeItem(key); return true; } catch { return false; }
}
/* Legge JSON; `kind` = 'object' | 'array' | undefined (qualsiasi). Se il tipo non torna si restituisce fallback. */
export function getJson(key, fallback, kind) {
  try {
    const x = JSON.parse(localStorage.getItem(key));
    if (x === null || x === undefined) return fallback;
    if (kind === 'object') return typeof x === 'object' && !Array.isArray(x) ? x : fallback;
    if (kind === 'array') return Array.isArray(x) ? x : fallback;
    return x;
  } catch { return fallback; }
}
export function setJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
export function keys(prefix = '') {
  try { return Object.keys(localStorage).filter(k => k.startsWith(prefix)); } catch { return []; }
}

/* Chiavi note (compatibili con la versione precedente) */
export const K = {
  pos: 'margine.pos',               // [libro, capitolo, versetto]
  note: 'margine.nota.',            // prefisso: margine.nota.<id> -> {note,color,t?}
  bm: 'margine.bm',                 // [[libro,cap,vers,timestamp],…]
  labels: 'margine.labels',         // 5 significati dei colori
  theme: 'margine.theme',           // light | paper | dark
  font: 'margine.font',             // indice dimensione testo
  lead: 'margine.lead',             // indice interlinea
  recent: 'margine.recent',         // ultimi capitoli aperti
  recentSearch: 'margine.recentsearch',
  lastMed: 'margine.lastmed',
  pending: 'margine.pending.v1',
  snapshot: 'margine.snapshot.v1',
  notesSync: 'margine.notes.sync',
  bmSync: 'margine.bm.sync',
  api: 'margine.api',               // {url,key} del Web App Google (nuovo)
  days: 'margine.days',             // giorni di lettura (nuovo, solo locale)
  read: 'margine.read',             // capitoli letti (nuovo, solo locale)
};
