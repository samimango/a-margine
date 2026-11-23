/* Livello dati del quaderno: meditazioni (note + colore), segnalibri, significati dei colori,
   posizione di lettura, capitoli recenti, statistiche. Tutto in localStorage con le chiavi dell'app precedente;
   ogni modifica passa da sync.stage() così parte verso Google quando l'app è collegata. */
import * as store from './store.js';
import {K} from './store.js';
import {names, counts, defaultLabels, MAX_VERSE, bounds, ref} from './bible.js';
import * as sync from './sync.js';
import {emit, on} from './bus.js';
import {uuid, isoDay} from './dom.js';
import * as api from './api.js';

export {bounds, ref};
export const prefix = K.note;

/* ---- Record di una nota: {note?, color?, t?}. «t» = ultima modifica su questo dispositivo (solo locale, non sincronizzato). ---- */
export function record(id) { return store.getJson(prefix + id, {}, 'object'); }
export const annotated = () => store.keys(prefix).map(k => k.slice(prefix.length));
export const noteIds = () => annotated().filter(id => record(id).note).sort((a, z) => a.localeCompare(z, 'it', {numeric: true}));
export const newId = (b, c, f, t) => [b, c, f, t, uuid()].join('.');
export const newFreeId = () => 'free.' + uuid();

/* ---- Significati dei colori ---- */
let labelCache = null;
on('data:changed', () => { labelCache = null; });
export function labels() {
  if (!labelCache) {
    const l = store.getJson(K.labels, null, 'array');
    labelCache = l && l.length === 5 && l.every(x => typeof x === 'string' && x.trim()) ? l : [...defaultLabels];
  }
  return labelCache;
}
export function setLabels(values) {
  const before = labels();
  if (!store.setJson(K.labels, values)) return false;
  values.forEach((value, i) => { if (value !== before[i]) sync.stage('label.' + i, value); });
  labelCache = null;
  emit('notes:changed');
  return true;
}

/* ---- Salvataggio. Restituisce 'ok' | 'limit' (oltre 8 KB) | 'storage' (non salvato) ---- */
export function saveNote(target, fields, quiet = false) {
  if (!target) return 'storage';
  if (api.isConfigured() && typeof fields.note === 'string' && new Blob([JSON.stringify(fields.note)]).size > 8000) return 'limit';
  const before = record(target), item = {...before, ...fields};
  const changed = Object.entries(fields).some(([f, v]) => (before[f] ?? (f === 'note' ? '' : null)) !== v);
  if (changed) item.t = Date.now();
  if (item.note || item.color != null) { if (!store.setJson(prefix + target, item)) return 'storage'; }
  else store.remove(prefix + target);
  if (item.note) store.set(K.lastMed, target);
  for (const [field, value] of Object.entries(fields)) {
    if ((before[field] ?? (field === 'note' ? '' : null)) !== value) sync.stage(target + '.' + field, value);
  }
  if (!quiet) emit('notes:changed');
  return 'ok';
}
export const lastMedId = () => store.get(K.lastMed);

/* ---- Segnalibri: [libro, cap, vers, timestamp] ---- */
export const bookmarks = () => store.getJson(K.bm, [], 'array').filter(m => Array.isArray(m) && names[m[0]]);
export const isBm = (bk, ch, vs) => bookmarks().some(m => m[0] === bk && m[1] === ch && m[2] === vs);
export function toggleBm(bk, ch, vs) {
  let list = bookmarks();
  const had = isBm(bk, ch, vs), stamp = Date.now();
  list = had ? list.filter(m => !(m[0] === bk && m[1] === ch && m[2] === vs)) : [[bk, ch, vs, stamp], ...list];
  store.setJson(K.bm, list);
  sync.stage('bm.' + bk + '.' + ch + '.' + vs, had ? null : stamp);
  emit('notes:changed');
  return !had;
}

/* ---- Posizione di lettura [libro, capitolo, versetto] ---- */
export function pos() {
  const p = store.getJson(K.pos, null, 'array');
  if (p) {
    const [x, y, z] = p.map(Number);
    if (Number.isInteger(x) && x >= 0 && x < counts.length && Number.isInteger(y) && y >= 1 && y <= counts[x] && Number.isInteger(z) && z >= 1 && z <= MAX_VERSE) return [x, y, z];
  }
  return [42, 1, 1];
}
export const setPos = (b, c, v) => store.setJson(K.pos, [b, c, v]);

/* ---- Letti di recente (ultimi 6 capitoli aperti) ---- */
export const recents = () => store.getJson(K.recent, [], 'array').filter(x => Array.isArray(x) && names[x[0]] && x[1] > 0);
export function addRecent(bk, ch) {
  const list = [[bk, ch], ...recents().filter(([x, y]) => !(x === bk && y === ch))].slice(0, 6);
  store.setJson(K.recent, list);
}

/* ---- Statistiche semplici (solo locali): giorni di lettura e capitoli letti ---- */
export function markDay() {
  const days = store.getJson(K.days, [], 'array'), today = isoDay();
  if (days[days.length - 1] === today) return;
  store.setJson(K.days, [...days.filter(d => d !== today), today].slice(-400));
}
export function streak() {
  const days = new Set(store.getJson(K.days, [], 'array'));
  let n = 0; const d = new Date();
  if (!days.has(isoDay(d))) d.setDate(d.getDate() - 1);       // oggi non è ancora finito: la serie conta da ieri
  while (days.has(isoDay(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
export function markRead(b, c) {
  const m = store.getJson(K.read, {}, 'object');
  if (m[b + '.' + c]) return;
  m[b + '.' + c] = Date.now();
  store.setJson(K.read, m);
  emit('notes:changed');
}
export const readMap = () => store.getJson(K.read, {}, 'object');
export function stats() {
  const m = readMap(), keys = Object.keys(m);
  let finished = 0;
  for (let b = 0; b < counts.length; b++) { let all = true; for (let c = 1; c <= counts[b]; c++) if (!m[b + '.' + c]) { all = false; break; } if (all) finished++; }
  return {streak: streak(), chapters: keys.length, books: finished};
}

/* ---- Ricerche recenti ---- */
export const recentSearches = () => store.getJson(K.recentSearch, [], 'array').filter(x => typeof x === 'string');
export function rememberSearch(term) {
  const t = term.trim(); if (!t) return;
  const low = t.toLocaleLowerCase('it');
  store.setJson(K.recentSearch, [t, ...recentSearches().filter(x => x.toLocaleLowerCase('it') !== low)].slice(0, 5));
}
