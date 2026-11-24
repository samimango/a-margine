/* Libreria: scaffalature di copertine per sezione + campo «Vai a» con il parser dei riferimenti */
import {h, text, noAutofill} from '../core/dom.js';
import {icon} from '../core/icons.js';
import * as notes from '../core/notes.js';
import {cover} from '../core/covers.js';
import {names, counts, SECTIONS, testamentLabel, parseRef, matchBooks} from '../core/bible.js';
import {openRef, openBook} from '../core/nav.js';

let el, msg, input, shelves;
const btns = new Map();   // libro → bottone, costruiti una sola volta: show() aggiorna solo il puntino «in lettura»

function goTo(textValue) {
  const q = textValue.trim();
  if (!q) { msg.textContent = ''; return; }
  const r = parseRef(q);
  if (r) {
    msg.textContent = '';
    const hasNumber = /\d/.test(q.replace(/^[123]\s*/, ''));   // «Genesi» apre la pagina del libro, «gv 3» il lettore
    if (!hasNumber) openBook(r.book); else openRef(r.book, r.ch, r.v1 ?? 1);
    return;
  }
  const hits = matchBooks(q.replace(/[\d,:.\s–-]+$/, ''));
  if (hits.length === 1) { msg.textContent = ''; openBook(hits[0]); return; }
  msg.textContent = hits.length > 1 ? 'Intendi ' + hits.map(i => names[i]).slice(0, 3).join(', ') + '? Scrivi un po’ di più.' : 'Non trovo «' + q + '». Prova con «gv 3,16» o «1 cor 13».';
}

function markReading() {
  const [cb] = notes.pos();
  for (const [b, btn] of btns) {
    const dot = btn.querySelector('.reading-dot');
    if (b === cb && !dot) btn.append(h('i', {class: 'reading-dot', title: 'In lettura'}));
    else if (b !== cb && dot) dot.remove();
  }
}

function render() {
  shelves.replaceChildren();
  let lastT = -1;
  for (const s of SECTIONS) {
    const t = s.from < 39 ? 0 : 1;
    if (t !== lastT) { if (t === 1) shelves.append(h('div', {class: 'testament'}, h('span', {text: testamentLabel(1)}))); lastT = t; }
    const row = h('div', {class: 'shelf', role: 'list'});
    for (let b = s.from; b <= s.to; b++) {
      const btn = h('button', {class: 'book', type: 'button', role: 'listitem', dataset: {book: b}, 'aria-label': names[b] + ', ' + counts[b] + (counts[b] === 1 ? ' capitolo' : ' capitoli'), on: {click: () => openBook(b)}},
        cover(b, {w: 76, h: 108, r: 4}), h('b', {text: names[b]}), h('small', {text: counts[b] + (counts[b] === 1 ? ' capitolo' : ' capitoli')}));
      btns.set(b, btn); row.append(btn);
    }
    shelves.append(h('section', {class: 'section'}, h('div', {class: 'sh'}, text('span', s.label, 'eyebrow'), text('span', s.to - s.from + 1 + (s.to === s.from ? ' libro' : ' libri'), 'count')), row));
  }
}

export default {
  id: 'libreria', tab: 'libreria', title: 'Libreria',
  build(root) {
    el = root;
    input = h('input', {id: 'goto', type: 'search', enterkeyhint: 'go', autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false', placeholder: 'Vai a… gv 3,16', 'aria-label': 'Vai a un riferimento'}); noAutofill(input, 'riferimento-biblico');
    msg = h('p', {class: 'hint', id: 'gotoMsg', role: 'status'});
    shelves = h('div', {class: 'shelves'});
    const form = h('form', {class: 'searchbox', id: 'gotoForm', autocomplete: 'off', on: {submit: e => { e.preventDefault(); goTo(input.value); }}}, icon('search', 18, 1.8), input, h('button', {class: 'mini', type: 'submit', text: 'Invio'}));
    root.append(h('div', {class: 'col'}, h('h1', {class: 'big'}, 'Libreria'), form, msg, shelves));
    render(); markReading();
  },
  show() { msg.textContent = ''; input.value = ''; markReading(); },
};
