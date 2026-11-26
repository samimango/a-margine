/* Quaderno: meditazioni e segnalibri. Meditazioni raggruppate per libro, data o colore, con ricerca. */
import {h, text, noAutofill} from '../core/dom.js';
import {icon} from '../core/icons.js';
import * as notes from '../core/notes.js';
import * as chapters from '../core/chapters.js';
import {cover} from '../core/covers.js';
import {names, bmRef, colorNames} from '../core/bible.js';
import {openRef, openNote} from '../core/nav.js';
import {on} from '../core/bus.js';
import {segmented} from '../components/seg.js';
import {entryRow} from '../components/entry.js';
import * as ui from '../core/ui.js';

let el, D = {}, tab = 'notes', group = 'book', query = '';
const collapsed = new Set();

function dayBucket(t) {
  if (!t) return ['z', 'Senza data'];
  const now = new Date(), d = new Date(t), mid = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((mid(now) - mid(d)) / 864e5);
  if (days <= 0) return ['a', 'Oggi'];
  if (days === 1) return ['b', 'Ieri'];
  if (days < 7) return ['c', 'Questa settimana'];
  if (days < 31) return ['d', 'Questo mese'];
  return ['e', 'Più vecchie'];
}
function matching() {
  const q = query.trim().toLocaleLowerCase('it');
  return notes.noteIds().filter(id => !q || (notes.ref(id) + ' ' + notes.record(id).note).toLocaleLowerCase('it').includes(q));
}
function groupEntries(ids) {
  const groups = new Map();
  const put = (key, meta, id) => { if (!groups.has(key)) groups.set(key, {key, ...meta, ids: []}); groups.get(key).ids.push(id); };
  const byDate = (a, z) => (notes.record(z).t || 0) - (notes.record(a).t || 0);
  if (group === 'book') {
    for (const id of ids) {
      if (id.startsWith('free.')) put('free', {sort: 1000, title: 'Meditazioni libere'}, id);
      else { const b = Number(id.split('.')[0]); put('b' + b, {sort: b, title: names[b], book: b}, id); }
    }
  } else if (group === 'date') {
    for (const id of [...ids].sort(byDate)) { const [k, title] = dayBucket(notes.record(id).t); put(k, {sort: k.charCodeAt(0), title}, id); }
  } else {
    for (const id of ids) { const c = notes.record(id).color; put(c == null ? 'n' : 'c' + c, {sort: c == null ? 9 : c, title: c == null ? 'Senza colore' : colorNames[c] + ' · ' + notes.labels()[c], color: c}, id); }
  }
  const list = [...groups.values()].sort((a, z) => a.sort - z.sort);
  if (group !== 'date') for (const g of list) g.ids.sort(group === 'book' ? (a, z) => a.localeCompare(z, 'it', {numeric: true}) : byDate);
  return list;
}
function highlightCount(book) { return notes.annotated().filter(id => id.startsWith(book + '.') && notes.record(id).color != null).length; }

function renderNotes() {
  const box = D.entries; box.replaceChildren();
  const ids = matching();
  if (!ids.length) { box.append(text('p', query.trim() ? 'Nessuna meditazione trovata.' : 'Ancora nessuna meditazione. Premi «+ Nuova» per iniziare.', 'empty')); return; }
  const unknown = ids.filter(id => !id.startsWith('free.')).map(id => id.split('.').slice(0, 2).join('.'));
  chapters.loadSections(unknown).then(found => { if (found && el && !el.hidden && tab === 'notes') renderNotes(); });
  for (const g of groupEntries(ids)) {
    const open = !collapsed.has(g.key);
    const head = h('button', {class: 'grp-head', type: 'button', 'aria-expanded': String(open), on: {click: () => { open ? collapsed.add(g.key) : collapsed.delete(g.key); renderNotes(); }}},
      g.book !== undefined ? cover(g.book, {w: 34, h: 48, r: 3, title: false}) : g.color !== undefined ? h('i', {class: 'grp-dot', style: g.color == null ? {} : {'--dot': 'var(--d' + (g.color + 1) + ')'}}) : null,
      h('span', {class: 'grp-title'}, h('b', {text: g.title}), h('small', {text: g.ids.length + (g.ids.length === 1 ? ' nota' : ' note') + (g.book !== undefined && highlightCount(g.book) ? ' · ' + highlightCount(g.book) + ' evidenziati' : '')})),
      h('span', {class: 'grp-chev'}, icon('down', 18, 2)));
    const grp = h('section', {class: 'grp' + (open ? '' : ' closed')}, head);
    if (open) for (const id of g.ids) grp.append(entryRow(id, () => openNote(id, 'quaderno')));
    box.append(grp);
  }
}
function renderMarks() {
  const box = D.entries; box.replaceChildren();
  const list = notes.bookmarks();
  if (!list.length) { box.append(text('p', 'Nessun segnalibro. Tocca un versetto e premi «Segnalibro».', 'empty')); return; }
  chapters.loadSections(list.map(m => m[0] + '.' + m[1])).then(found => { if (found && el && !el.hidden && tab === 'marks') renderMarks(); });
  for (const m of list) {
    const t = chapters.textOf(m.slice(0, 3).join('.'));
    const row = h('div', {class: 'ent'}, h('i', {class: 'bm'}),
      h('button', {class: 'ent-open', type: 'button', on: {click: () => openRef(m[0], m[1], m[2])}}, h('strong', {text: bmRef(m)}), t ? h('span', {text: t}) : null),
      h('button', {class: 'x', type: 'button', 'aria-label': 'Togli segnalibro', on: {click: () => { notes.toggleBm(m[0], m[1], m[2]); ui.toast('Segnalibro rimosso', () => notes.toggleBm(m[0], m[1], m[2])); }}}, icon('close', 16, 2)));
    box.append(row);
  }
}
function render() {
  if (!el) return;
  segmented(D.nbSeg, [{value: 'notes', label: 'Meditazioni'}, {value: 'marks', label: 'Segnalibri'}], tab, v => { tab = v; render(); }, 'Sezione del quaderno');
  segmented(D.grpSeg, [{value: 'book', label: 'Per libro'}, {value: 'date', label: 'Per data'}, {value: 'color', label: 'Per colore'}], group, v => { group = v; render(); }, 'Raggruppa le meditazioni');
  D.grpSeg.hidden = tab !== 'notes'; D.compose.hidden = tab !== 'notes'; D.search.hidden = tab !== 'notes';
  if (tab === 'notes') renderNotes(); else renderMarks();
}

export default {
  id: 'quaderno', tab: 'quaderno', title: 'Quaderno',
  build(root) {
    el = root;
    D.nbSeg = h('div', {id: 'nbSeg'}); D.grpSeg = h('div', {id: 'grpSeg'}); D.entries = h('div', {id: 'entries'});
    D.compose = h('button', {class: 'pill-sm', id: 'compose', type: 'button', on: {click: () => openNote(null, 'quaderno')}}, icon('plus', 15, 2.2), 'Nuova');
    const input = noAutofill(h('input', {id: 'nbSearch', type: 'search', placeholder: 'Cerca nelle note', 'aria-label': 'Cerca nelle note', autocomplete: 'off', on: {input: () => { query = input.value; if (tab === 'notes') renderNotes(); }}}), 'ricerca-note');
    D.search = h('label', {class: 'searchbox'}, icon('search', 18, 1.8), input);
    root.append(h('div', {class: 'col'}, h('div', {class: 'head'}, h('h1', {class: 'big'}, 'Quaderno'), D.compose), D.search, D.nbSeg, D.grpSeg, D.entries));
    for (const evt of ['notes:changed', 'data:changed']) on(evt, () => { if (!el.hidden) render(); });
  },
  show(params = {}) { if (params.tab === 'marks' || params.tab === 'notes') tab = params.tab; render(); },
};
