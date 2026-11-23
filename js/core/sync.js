/* Sincronizzazione per campo con revisioni e conflitti (logica collaudata dell'app precedente).
   Campi: «<id nota>.note», «<id nota>.color», «bm.<libro>.<cap>.<vers>», «label.<0-4>».
   Il formato di margine.pending.v1 / margine.snapshot.v1 e del servizio NON cambia. */
import * as store from './store.js';
import {K} from './store.js';
import * as api from './api.js';
import {emit, on} from './bus.js';
import {names, colorNames, defaultLabels, ref} from './bible.js';

let pending = store.getJson(K.pending, {}, 'object');
let snapshot = store.getJson(K.snapshot, {}, 'object');
let syncing = false, timer, knownConflicts = 0, state = '';
const NOTE_PREFIX = K.note;

export const connected = () => api.isConfigured();
export const statusText = () => state;
export const pendingMap = () => pending;
export const snapshotMap = () => snapshot;
function setState(text) { state = text; emit('sync:state', text); }

/* Mette in coda una modifica di un campo (solo se collegati: in locale i dati restano sul dispositivo
   e alla prima connessione partono tutti insieme con migrate()) */
export function stage(id, value) {
  if (!connected()) return;
  const prev = pending[id];
  pending[id] = {rev: prev?.rev ?? snapshot[id]?.rev ?? 0, value};
  if (prev?.conflict) pending[id].conflict = true;
  store.setJson(K.pending, pending);
  setState('Salvato sul dispositivo · In attesa di sincronizzazione');
  clearTimeout(timer); timer = setTimeout(synchronize, 600);
}

/* ---- Conflitti ---- */
export function conflicts() {
  const out = [];
  for (const [id, change] of Object.entries(pending)) {
    if (!change.conflict) continue;
    const other = snapshot[id];
    const isMark = id.startsWith('bm.');
    const describe = value => isMark ? (value == null ? 'Segnalibro tolto' : 'Segnalibro presente')
      : id.endsWith('.color') ? (colorNames[value] || 'Nessun colore')
      : id.startsWith('label.') ? String(value ?? '')
      : (String(value ?? '') || '(nota vuota)');
    const field = isMark ? 'Segnalibro · ' + names[id.split('.')[1]] + ' ' + id.split('.')[2] + ',' + id.split('.')[3]
      : id.startsWith('label.') ? 'Significato del colore'
      : ref(id.split('.').slice(0, -1).join('.'));
    out.push({id, field, mine: describe(change.value), theirs: describe(other?.value)});
  }
  return out;
}
export function resolveConflict(id, useLocal) {
  if (!pending[id]) return;
  if (useLocal) pending[id] = {value: pending[id].value, rev: snapshot[id]?.rev || 0};
  else delete pending[id];
  store.setJson(K.pending, pending);
  applySnapshot();
  synchronize();
  emit('sync:state', state);
}

/* ---- Applicazione dello stato condiviso ai dati locali ---- */
function applyBookmarks() {
  let list = store.getJson(K.bm, [], 'array');
  const map = new Map(list.map(m => [m[0] + '.' + m[1] + '.' + m[2], m]));
  for (const [id, entry] of Object.entries(snapshot)) {
    if (!id.startsWith('bm.') || pending[id]) continue;
    const k = id.slice(3);
    if (entry.value == null) map.delete(k);
    else { const [bk, ch, vs] = k.split('.').map(Number); if (Number.isInteger(bk) && bk >= 0 && bk < names.length) map.set(k, [bk, ch, vs, entry.value]); }
  }
  const json = JSON.stringify([...map.values()].sort((x, y) => (y[3] || 0) - (x[3] || 0)));
  if (json !== store.get(K.bm)) store.set(K.bm, json);
}
function recordOf(id) { return store.getJson(NOTE_PREFIX + id, {}, 'object'); }
export function applySnapshot() {
  applyBookmarks();
  const labels = (() => { const l = store.getJson(K.labels, null, 'array'); return l && l.length === 5 && l.every(x => typeof x === 'string' && x.trim()) ? l : [...defaultLabels]; })();
  for (const [id, entry] of Object.entries(snapshot)) {
    if (pending[id] || id.startsWith('bm.')) continue;
    if (id.startsWith('label.')) { const i = Number(id.slice(6)); if (i >= 0 && i < 5 && typeof entry.value === 'string' && entry.value.trim()) labels[i] = entry.value; continue; }
    const parts = id.split('.'), field = parts.pop(), verse = parts.join('.');
    if (field !== 'note' && field !== 'color') continue;
    const before = recordOf(verse);
    const item = {...before, [field]: entry.value};
    if (!item.note && item.color == null) { if (store.get(NOTE_PREFIX + verse) !== null) store.remove(NOTE_PREFIX + verse); continue; }
    if (before[field] !== entry.value) item.t = Date.now();
    const json = JSON.stringify(item);
    if (json !== store.get(NOTE_PREFIX + verse)) store.set(NOTE_PREFIX + verse, json);
  }
  store.setJson(K.labels, labels);
  emit('data:changed');
}

/* Registra la risposta del servizio per le modifiche inviate; true se lo stato condiviso è cambiato */
function absorb(batch, reply) {
  if (!reply || typeof reply !== 'object' || !reply.state || !reply.conflicts) throw Error('Risposta non valida.');
  for (const sent of batch) {
    const now = pending[sent.id];
    if (!now) continue;
    if (reply.conflicts[sent.id]) {
      const theirs = reply.state[sent.id]?.value;
      if (sent.id.startsWith('bm.') && (sent.value == null) === (theirs == null)) delete pending[sent.id];
      else now.conflict = true;
    } else if (now.value === sent.value) delete pending[sent.id];
    else now.rev = reply.state[sent.id]?.rev || 0;
  }
  const changed = JSON.stringify(snapshot) !== JSON.stringify(reply.state);
  snapshot = reply.state;
  store.setJson(K.snapshot, snapshot); store.setJson(K.pending, pending);
  return changed;
}

/* ---- Migrazioni alla prima connessione ---- */
function bookmarkList() { return store.getJson(K.bm, [], 'array').filter(m => Array.isArray(m) && names[m[0]]); }
export function migrateBookmarks() {
  if (!connected() || store.get(K.bmSync)) return;
  const base = Date.now();
  const list = bookmarkList().map((m, i) => [m[0], m[1], m[2], Number.isSafeInteger(m[3]) && m[3] > 0 ? m[3] : base - i]);
  if (!store.setJson(K.bm, list) || !store.set(K.bmSync, '1')) return;
  for (const m of list) { const id = 'bm.' + m[0] + '.' + m[1] + '.' + m[2]; if (!snapshot[id] && !pending[id]) stage(id, m[3]); }
}
function migrateNotes() {
  if (store.get(K.notesSync)) return;
  if (!store.set(K.notesSync, '1')) return;
  for (const key of store.keys(NOTE_PREFIX)) {
    const id = key.slice(NOTE_PREFIX.length), item = recordOf(id);
    if (item.note && !snapshot[id + '.note'] && !pending[id + '.note']) stage(id + '.note', item.note);
    if (item.color != null && !snapshot[id + '.color'] && !pending[id + '.color']) stage(id + '.color', item.color);
  }
  const labels = store.getJson(K.labels, null, 'array');
  if (labels && labels.length === 5) labels.forEach((text, i) => { if (text !== defaultLabels[i] && !snapshot['label.' + i] && !pending['label.' + i]) stage('label.' + i, text); });
}

export async function synchronize() {
  if (!connected() || syncing) return;
  syncing = true;
  const batch = Object.entries(pending).filter(([, p]) => !p.conflict && !p.bad).slice(0, 100).map(([id, item]) => ({id, rev: item.rev, value: item.value}));
  try {
    let changed = false;
    try { changed = absorb(batch, await api.call('sync', batch)); }
    catch (err) {
      if (!api.isInvalid(err) || !batch.length) throw err;
      /* Una sola modifica non valida blocca tutto il gruppo: le provo una per una e isolo quella rifiutata */
      for (const item of batch) {
        try { if (absorb([item], await api.call('sync', [item]))) changed = true; }
        catch (e2) { if (api.isInvalid(e2)) { if (pending[item.id]) pending[item.id].bad = true; } else throw e2; }
      }
      store.setJson(K.pending, pending);
    }
    if (!store.get(K.notesSync)) migrateNotes();
    if (changed) applySnapshot();
    const queue = Object.values(pending), nConf = queue.filter(p => p.conflict).length;
    if (nConf > knownConflicts) emit('sync:conflict', nConf);
    knownConflicts = nConf;
    setState(nConf ? 'Scegli quale modifica conservare.'
      : queue.some(p => p.bad) ? 'Alcune modifiche non sono accettate dal servizio e restano solo su questo dispositivo.'
      : queue.length ? 'Sincronizzazione in corso…'
      : 'Sincronizzato nel tuo account Google');
    emit('sync:done');
    if (queue.some(p => !p.conflict && !p.bad)) setTimeout(synchronize, 800);
  } catch (err) {
    setState(api.isAuthError(err) ? 'La chiave non è accettata dal servizio: controlla «Collega il tuo Google».'
      : Object.keys(pending).length ? 'Modifiche sul dispositivo · Sincronizzazione da riprovare' : 'Archivio condiviso non raggiungibile.');
  } finally { syncing = false; }
}

/* Da chiamare una volta all'avvio e dopo ogni cambio di configurazione */
export function init() {
  addEventListener('online', synchronize);
  addEventListener('focus', synchronize);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) synchronize(); });
  setInterval(() => { if (!document.hidden) synchronize(); }, 15000);
  on('config:changed', () => { if (connected()) { migrateBookmarks(); synchronize(); } else setState(''); });
  if (connected()) { migrateBookmarks(); synchronize(); }
}
