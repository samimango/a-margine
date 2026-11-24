/* Registro delle funzioni (feature). Ogni funzione futura è un modulo js/features/<id>.js che chiama registerFeature(...).
   I punti d'aggancio (hook) sono dichiarativi: il nucleo li legge quando disegna le schermate.
   Un errore in un hook o in un modulo feature viene registrato in console ma non rompe l'app. Vedi ARCHITECTURE.md. */
import * as router from './router.js';
import * as store from './store.js';
import * as api from './api.js';
import * as bible from './bible.js';
import * as chapters from './chapters.js';
import * as notes from './notes.js';
import * as sync from './sync.js';
import * as ui from './ui.js';
import * as bus from './bus.js';
import * as dom from './dom.js';
import * as icons from './icons.js';
import * as covers from './covers.js';
import * as nav from './nav.js';
import * as theme from './theme.js';

/* Passato come ultimo argomento a ogni hook, e a onReady */
export const ctx = Object.freeze({router, store, api, bible, chapters, notes, sync, ui, bus, dom, icons, covers, nav, theme});

const registry = new Map();
const HOOKS = ['settings', 'verseActions', 'textDecorators', 'homeCards', 'bookCards', 'readerSettings', 'chapterHeader', 'chapterFooter', 'heroActions'];

export function registerFeature(def) {
  if (!def || typeof def.id !== 'string') throw Error('registerFeature: serve un id');
  if (registry.has(def.id)) { console.warn('feature già registrata:', def.id); return; }
  registry.set(def.id, def);
  for (const s of def.screens || []) router.defineScreen({...s, build: s.build && ((root, p) => s.build(root, ctx, p)), show: s.show && ((p, prev) => s.show(p, ctx, prev))});
  if (def.noteEditor && typeof def.noteEditor.mount !== 'function') console.error('noteEditor senza mount:', def.id);
}
export const features = () => [...registry.values()];

/* Raccoglie le voci di un hook da tutte le feature, ordinate per `order` (default 100) */
function collect(hook) {
  const out = [];
  for (const f of registry.values()) for (const item of f[hook] || []) out.push({...item, feature: f.id});
  return out.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}
function safe(fn, label, fallback) { try { return fn(); } catch (e) { console.error('feature', label, e); return fallback; } }

/* settings: [{id, section?='Altro', label, value?(ctx)->string, icon?, order?, onTap?(ctx), href?, render?(rowEl, ctx)}] */
export const settingsItems = () => collect('settings');
/* verseActions: [{id, label, icon, order?, when?(sel)->bool, run(sel, ctx)}] ; sel = {book,ch,from,to,ref,text,verses:[{n,text}]} */
export const verseActions = sel => collect('verseActions').filter(a => safe(() => a.when ? a.when(sel, ctx) : true, a.id, false));
/* textDecorators: [{id, order?, decorate(textEl, info, ctx)}] ; info = {book,ch,n,id,text} (chiamato per ogni versetto dopo il disegno) */
export function decorateVerse(textEl, info) { for (const d of collect('textDecorators')) safe(() => d.decorate(textEl, info, ctx), d.id); }
export const hasDecorators = () => collect('textDecorators').length > 0;
/* homeCards: [{id, order?, render(ctx)->Node|null}] */
export const homeCards = () => collect('homeCards').map(c => ({id: c.id, node: safe(() => c.render(ctx), c.id, null)})).filter(c => c.node);
/* bookCards: [{id, order?, render(book, ctx)->Node|null}] nella pagina di un libro */
export const bookCards = book => collect('bookCards').map(c => ({id: c.id, node: safe(() => c.render(book, ctx), c.id, null)})).filter(c => c.node);
/* readerSettings: [{id, order?, render(container, ctx)}] nel foglio «Aspetto della lettura» */
export const readerSettingsItems = () => collect('readerSettings');
/* chapterHeader / chapterFooter: [{id, order?, render({book,ch,text}, ctx)->Node|null}] sopra e sotto il testo del capitolo */
export const chapterHeader = info => collect('chapterHeader').map(c => ({id: c.id, node: safe(() => c.render(info, ctx), c.id, null)})).filter(c => c.node);
export const chapterFooter = info => collect('chapterFooter').map(c => ({id: c.id, node: safe(() => c.render(info, ctx), c.id, null)})).filter(c => c.node);
/* heroActions: [{id, label, icon, order?, run(ctx)}] pulsanti accanto a «Continua» nella card Riprendi */
export const heroActions = () => collect('heroActions');
/* noteEditor: {id, priority?, mount(box, api)} — vince la priorità più alta. api = {id (getter), text (testo iniziale), changed(testo) per salvare, setStatus(t), ctx};
   mount restituisce {setText?(t), focus?(), destroy?()}. Se nessuno è registrato si usa l'editor predefinito (textarea). */
export function noteEditorFor() {
  let best = null;
  for (const f of registry.values()) if (f.noteEditor && (!best || (f.noteEditor.priority ?? 1) > (best.priority ?? 1))) best = f.noteEditor;
  return best;
}

let readyDone = false;
export function runReady() {
  if (readyDone) return; readyDone = true;
  for (const f of registry.values()) if (f.onReady) safe(() => f.onReady(ctx), f.id);
}

/* Carica i moduli elencati in js/features/index.js: un modulo rotto viene saltato */
export async function loadFeatures(ids) {
  /* i moduli si scaricano tutti insieme (modulepreload) ma si eseguono in ordine: su rete lenta si paga un solo giro invece di uno per modulo */
  for (const id of ids) { const l = document.createElement('link'); l.rel = 'modulepreload'; l.href = new URL('../features/' + id + '.js', import.meta.url).href; document.head.append(l); }
  for (const id of ids) {
    try { await import('../features/' + id + '.js'); }
    catch (e) { console.error('feature non caricata:', id, e); }
  }
}
