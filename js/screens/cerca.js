/* Cerca: nella Bibbia (LaParola.net) e nelle mie note. Un riferimento come «gv 3,16» porta direttamente al passo. */
import {h, text} from '../core/dom.js';
import {icon} from '../core/icons.js';
import * as notes from '../core/notes.js';
import * as api from '../core/api.js';
import * as router from '../core/router.js';
import {names, norm, parseRef, fmtRef} from '../core/bible.js';
import {openRef, openNote} from '../core/nav.js';
import {segmented} from '../components/seg.js';
import {entryRow} from '../components/entry.js';
import {on} from '../core/bus.js';

let el, D = {}, srTab = 'bible', searchRun = 0, searchTerm = '', nextStart = 1;

function renderRecent() {
  const list = notes.recentSearches(), show = !D.word.value.trim() && list.length > 0;
  D.recentBox.hidden = !show;
  if (!show) return;
  D.recentChips.replaceChildren(...list.map(term => h('button', {class: 'chip', type: 'button', text: term, on: {click: () => { D.word.value = term; D.form.requestSubmit(); }}})));
}
function refShortcut() {
  D.jump.replaceChildren();
  const r = parseRef(D.word.value);
  if (!r || (r.v1 === null && !/\d/.test(D.word.value.replace(/^[123]\s*/, '')))) return;
  D.jump.append(h('button', {class: 'ent jump', id: 'jumpRef', type: 'button', on: {click: () => openRef(r.book, r.ch, r.v1 ?? 1)}}, h('i', {class: 'bm'}), h('div', {class: 'ent-body'}, h('strong', {text: 'Vai a ' + fmtRef(r)}), h('span', {text: 'Apri il passo nel lettore'}))));
}
function renderNoteSearch() {
  const q = D.word.value.trim().toLocaleLowerCase('it'), box = D.hits; box.replaceChildren(); D.more.hidden = true;
  if (!q) { D.status.textContent = 'Scrivi una parola per cercare nelle tue note.'; return; }
  const ids = notes.annotated().filter(id => notes.record(id).note && (notes.ref(id) + ' ' + notes.record(id).note).toLocaleLowerCase('it').includes(q)).sort((a, z) => a.localeCompare(z, 'it', {numeric: true}));
  D.status.textContent = ids.length ? ids.length + ' trovate' : 'Nessuna nota trovata.';
  for (const id of ids) box.append(entryRow(id, () => openNote(id, 'cerca'), {showQuote: false}));
}
async function searchBible(append) {
  const term = append ? searchTerm : D.word.value.trim();
  if (!term) return;
  const run = ++searchRun;
  if (!append) { searchTerm = term; nextStart = 1; D.hits.replaceChildren(); }
  D.more.hidden = true; D.status.textContent = 'Ricerca in corso…';
  try {
    const html = await api.call('wordSearch', {term, start: nextStart});
    if (run !== searchRun) return;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const headings = Array.from(doc.querySelectorAll('#brano h1'));
    const summary = doc.querySelector('h3 + p')?.textContent || '';
    const total = Number(summary.match(/in (\d+) versett/i)?.[1]) || 0;
    for (const hd of headings) {
      const reference = hd.textContent.trim(), snippet = hd.nextElementSibling?.textContent || '';
      const m = reference.match(/^(.+?)\s+(?:(\d+):)?(\d+)$/);
      const book = m ? names.findIndex(n => norm(n) === norm(m[1])) : -1;
      const body = h('div', {class: 'ent-body'}, h('div', {class: 'ent-head'}, h('strong', {text: reference})), h('span', {text: snippet}));
      const item = book < 0 ? h('a', {class: 'ent', href: 'https://www.laparola.net/testo.php?' + new URLSearchParams({riferimento: reference, 'versioni[]': 'Riveduta 2020'}), target: '_blank', rel: 'noopener noreferrer'}, h('i'), body)
        : h('button', {class: 'ent', type: 'button', on: {click: () => openRef(book, Number(m[2] || 1), Number(m[3]))}}, h('i'), body);
      D.hits.append(item);
    }
    nextStart += headings.length;
    D.status.textContent = headings.length || append ? (total ? total + ' versetti trovati · ' : '') + D.hits.children.length + ' visualizzati' : 'Nessun versetto trovato.';
    D.more.hidden = !headings.length || (total ? nextStart > total : headings.length < 20);
  } catch {
    if (run !== searchRun) return;
    D.status.textContent = api.isConfigured() ? 'Ricerca non disponibile. Riprova fra poco.' : 'Per cercare nella Bibbia collega il tuo Google dalle impostazioni.';
    D.more.hidden = !append;
  }
}
function draw() {
  segmented(D.seg, [{value: 'bible', label: 'Bibbia'}, {value: 'notes', label: 'Le mie note'}], srTab, v => {
    srTab = v; searchRun++; D.hits.replaceChildren(); D.more.hidden = true; D.status.textContent = '';
    draw(); if (srTab === 'notes') renderNoteSearch(); else if (D.word.value.trim()) searchBible(false);
  }, 'Dove cercare');
}

export default {
  id: 'cerca', tab: 'cerca', title: 'Cerca',
  build(root) {
    el = root;
    D.word = h('input', {id: 'word', required: true, maxlength: '100', type: 'search', enterkeyhint: 'search', autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false', placeholder: 'Una parola, per esempio luce', 'aria-label': 'Cerca',
      on: {input: () => { if (srTab === 'notes') renderNoteSearch(); renderRecent(); refShortcut(); }}});
    D.form = h('form', {class: 'searchbox', id: 'wordForm', on: {submit: e => { e.preventDefault(); notes.rememberSearch(D.word.value); if (srTab === 'bible') searchBible(false); else renderNoteSearch(); renderRecent(); }}}, icon('search', 18, 1.8), D.word);
    D.seg = h('div', {id: 'srSeg'}); D.status = h('p', {class: 'hint', id: 'resultStatus', role: 'status'}); D.hits = h('div', {id: 'hits'}); D.jump = h('div', {id: 'jump'});
    D.more = h('button', {class: 'link', id: 'moreHits', type: 'button', hidden: true, text: 'Altri risultati', on: {click: () => searchBible(true)}});
    D.recentChips = h('div', {class: 'chips', id: 'recentChips'});
    D.recentBox = h('div', {id: 'recentS', hidden: true}, text('h2', 'Ricerche recenti', 'sec'), D.recentChips);
    root.append(h('div', {class: 'col'}, h('h1', {class: 'big'}, 'Cerca'), D.form, D.jump, D.recentBox, D.seg, D.status, D.hits, D.more));
    draw();
    for (const evt of ['notes:changed', 'data:changed']) on(evt, () => { if (!el.hidden && srTab === 'notes') renderNoteSearch(); });
  },
  show() { renderRecent(); refShortcut(); if (srTab === 'notes') renderNoteSearch(); },
};
