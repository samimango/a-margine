/* Caricamento dei capitoli: cache IndexedDB prima, rete dopo, prefetch silenzioso di precedente e successivo,
   richieste in corso deduplicate. Database «margine-cache» (capitoli letti) e «margine-bibbia» (testo importato a mano):
   stessi nomi e formati dell'app precedente. */
import * as api from './api.js';
import {emit} from './bus.js';
import {counts, lapRef, step} from './bible.js';

/* testo noto di ogni versetto già visto in questa sessione (cache + rete + importato): «libro.cap.vers» → testo */
const known = {};
export let passages = {};
const sample = {'42.1.1': 'Nel principio era la Parola, e la Parola era con Dio, e la Parola era Dio.', '42.1.2': 'Essa era nel principio con Dio.'};
export const textOf = id => known[id] || passages[id] || sample[id] || '';
export const sampleText = () => sample;

/* ---- Parsing dell'HTML di LaParola.net ---- */
export function parseChapter(html, book, ch) {
  const doc = new DOMParser().parseFromString(html, 'text/html'), result = {};
  for (const p of doc.querySelectorAll('#brano p')) {
    let number = null;
    const walk = el => {
      if (el.nodeType === 3) { if (number) result[number] += el.textContent; return; }
      if (el.nodeType !== 1) return;
      if (el.matches('strong') && /^\d+$/.test(el.textContent.trim())) { number = book + '.' + ch + '.' + Number(el.textContent.trim()); result[number] = ''; return; }
      if (el.matches('br')) { if (number) result[number] += ' '; return; }
      el.childNodes.forEach(walk);
    };
    p.childNodes.forEach(walk);
  }
  for (const id of Object.keys(result)) result[id] = result[id].replace(/\s+/g, ' ').trim();
  if (!Object.values(result).some(Boolean)) throw Error('Capitolo non disponibile.');
  return result;
}

/* ---- Cache IndexedDB ---- */
let cacheDb;
function cacheOpen() {
  return cacheDb || (cacheDb = new Promise(resolve => {
    try {
      const req = indexedDB.open('margine-cache', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('chapters');
      req.onsuccess = () => resolve(req.result);
      req.onerror = req.onblocked = () => resolve(null);
    } catch { resolve(null); }
  }));
}
export async function cacheGet(section) {
  const db = await cacheOpen();
  if (!db) return null;
  return new Promise(resolve => {
    try {
      const req = db.transaction('chapters').objectStore('chapters').get(section);
      req.onsuccess = () => { const row = req.result; resolve(row && row.text && typeof row.text === 'object' && Object.keys(row.text).length ? row.text : null); };
      req.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}
async function cachePut(section, text) {
  const db = await cacheOpen();
  if (!db) return;
  try { db.transaction('chapters', 'readwrite').objectStore('chapters').put({text, saved: Date.now()}, section); } catch { /* ok */ }
}
/* Capitoli già in cache (chiavi «libro.cap»), per sapere cosa è disponibile offline */
export async function cachedSections() {
  const db = await cacheOpen();
  if (!db) return [];
  return new Promise(resolve => {
    try { const req = db.transaction('chapters').objectStore('chapters').getAllKeys(); req.onsuccess = () => resolve(req.result); req.onerror = () => resolve([]); } catch { resolve([]); }
  });
}

/* ---- API ---- */
const section = (b, c) => b + '.' + c;
/* Testo dalla cache locale (null se non presente). Aggiorna il testo noto. */
export async function cached(b, c) {
  const t = await cacheGet(section(b, c));
  if (t) Object.assign(known, t);
  return t;
}
/* Dalla rete (con cache e dedup). Rifiuta se non collegati o se la rete manca. */
const inflight = new Map();
export function fetchChapter(b, c) {
  const key = section(b, c);
  if (inflight.has(key)) return inflight.get(key);
  const p = (async () => {
    const html = await api.call('chapter', lapRef(b, c));
    const fresh = parseChapter(html, b, c);
    cachePut(key, fresh);
    Object.assign(known, fresh);
    return fresh;
  })().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
export const verseLimitOf = map => Math.max(0, ...Object.keys(map).map(id => Number(id.split('.')[2])));

/* Testo dei capitoli già letti per mostrare versetti di note e segnalibri di altri capitoli */
const tried = new Set();
export async function loadSections(list) {
  let changed = false;
  for (const s of new Set(list)) {
    if (tried.has(s)) continue;
    tried.add(s);
    const t = await cacheGet(s);
    if (t) { Object.assign(known, t); changed = true; }
  }
  return changed;
}
export const markTried = s => tried.add(s);

/* ---- Prefetch silenzioso: capitolo successivo e precedente, uno alla volta, solo se collegati e online ---- */
let prefetchTimer = 0, prefetchRun = 0;
export function prefetchAround(b, c, delay = 700) {
  clearTimeout(prefetchTimer);
  const run = ++prefetchRun;
  prefetchTimer = setTimeout(async () => {
    for (const d of [1, -1]) {
      if (run !== prefetchRun || !api.isConfigured() || navigator.onLine === false) return;
      const s = step(b, c, d);
      if (!s) continue;
      try { if (await cached(s[0], s[1])) continue; await fetchChapter(s[0], s[1]); emit('chapter:prefetched', {book: s[0], ch: s[1]}); } catch { /* silenzioso */ }
      await new Promise(r => setTimeout(r, 400));
    }
  }, delay);
}

/* ---- Testo importato a mano (database «margine-bibbia») ---- */
function importDb() { return new Promise((resolve, reject) => { const req = indexedDB.open('margine-bibbia', 1); req.onupgradeneeded = () => req.result.createObjectStore('testo'); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); }
export async function readPassages() {
  const db = await importDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction('testo').objectStore('testo').getAllKeys();
    req.onerror = () => { db.close(); reject(req.error); };
    req.onsuccess = () => {
      const tx = db.transaction('testo'), store = tx.objectStore('testo'), result = {};
      for (const k of req.result) { const r = store.get(k); r.onsuccess = () => Object.assign(result, r.result); }
      tx.oncomplete = () => { db.close(); resolve(result); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    };
  });
}
export async function loadPassages() { try { passages = await readPassages(); } catch { /* nessun testo importato */ } return passages; }
/* groups: Map «libro.cap» → {«libro.cap.vers»: testo} */
export async function importPassages(groups) {
  const db = await importDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction('testo', 'readwrite'), store = tx.objectStore('testo');
    for (const [chapter, data] of groups) { const req = store.get(chapter); req.onsuccess = () => store.put({...req.result, ...data}, chapter); }
    tx.oncomplete = resolve; tx.onabort = () => reject(tx.error || Error('Importazione interrotta.'));
  }).finally(() => db.close());
  await loadPassages();
}
export const chapterCount = b => counts[b];
