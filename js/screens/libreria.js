/* Libreria: Griglia per genere | Scaffale per sezione, filtri, «Continua a leggere», indice rapido, campo «Vai a».
   I bottoni dei libri (copertina inclusa) sono costruiti una sola volta: il cambio di vista li sposta soltanto;
   show() aggiorna solo lo stato (percentuale, barra, segnalibro «in lettura»). */
import {h, text, noAutofill} from '../core/dom.js';
import {icon} from '../core/icons.js';
import * as notes from '../core/notes.js';
import * as store from '../core/store.js';
import {cover, GENRES, tintOf} from '../core/covers.js';
import {names, counts, SECTIONS, testamentLabel, parseRef, matchBooks} from '../core/bible.js';
import {openRef, openBook} from '../core/nav.js';
import {segmented} from '../components/seg.js';

const VIEW_KEY = 'margine.libview';   // 'grid' | 'shelf'
const FILTERS = [{value: 'all', label: 'Tutti'}, {value: 'at', label: 'Antico T.'}, {value: 'nt', label: 'Nuovo T.'}, {value: 'recent', label: 'Recenti'}];
const INDEX = [[0, 'Gn'], [1, 'Es'], [18, 'Sal'], [22, 'Is'], [39, 'Mt'], [42, 'Gv'], [43, 'At'], [44, 'Rm'], [65, 'Ap']];
const btns = new Map();   // libro → bottone, costruiti una sola volta
let el, msg, input, shelves, viewSeg, filterBox, cont, contBook = -1, idx, view = 'grid', filter = 'all', stamp = '';

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

/* percentuale letta per libro + mappa di lettura */
function progress() {
  const readMap = notes.readMap(), done = new Array(counts.length).fill(0);
  for (const k in readMap) { const [bk, ch] = k.split('.').map(Number); if (bk in done && ch >= 1 && ch <= counts[bk]) done[bk]++; }
  return done;
}
const pctOf = (done, b) => Math.round(done[b] / counts[b] * 100);

function recentBooks(cb) {
  const out = [cb];
  for (const [bk] of notes.recents()) if (!out.includes(bk)) out.push(bk);
  return out.slice(0, 12);
}

/* un solo passaggio: testo di stato (percentuale, barra, «in lettura») per ogni libro */
function updateState() {
  const [cb] = notes.pos(), done = progress();
  for (const [b, btn] of btns) {
    const pct = pctOf(done, b), dot = btn.querySelector('.reading-dot');
    btn.setAttribute('aria-label', names[b] + ', ' + counts[b] + (counts[b] === 1 ? ' capitolo' : ' capitoli') + ', letto al ' + pct + '%' + (b === cb ? ', in lettura' : ''));
    btn.querySelector('small em').textContent = pct + '%';
    btn.querySelector('.book-bar i').style.width = pct + '%';
    if (b === cb && !dot) btn.append(h('i', {class: 'reading-dot', title: 'In lettura'}));
    else if (b !== cb && dot) dot.remove();
  }
}

function buildButtons() {
  for (const s of SECTIONS) {
    for (let b = s.from; b <= s.to; b++) {
      const st = tintOf(b);
      const btn = h('button', {class: 'book gbook', type: 'button', role: 'listitem', dataset: {book: b}, on: {click: () => openBook(b)}},
        cover(b, {w: 88, h: 126, r: 5}), h('b', {text: names[b]}),
        h('small', {}, h('span', {text: counts[b] + ' cap.'}), h('em')),
        h('span', {class: 'book-bar', 'aria-hidden': 'true', style: {'--bk': st}}, h('i')));
      btns.set(b, btn);
    }
  }
}

function layout(cb) {
  const frag = document.createDocumentFragment();
  if (view === 'shelf') {
    let lastT = -1;
    for (const s of SECTIONS) {
      const t = s.from < 39 ? 0 : 1;
      if (t !== lastT) { if (t === 1) frag.append(h('div', {class: 'testament'}, h('span', {text: testamentLabel(1)}))); lastT = t; }
      const row = h('div', {class: 'shelf', role: 'list'});
      for (let b = s.from; b <= s.to; b++) row.append(btns.get(b));
      frag.append(h('section', {class: 'section'}, h('div', {class: 'sh'}, text('span', s.label, 'eyebrow'), text('span', s.to - s.from + 1 + (s.to === s.from ? ' libro' : ' libri'), 'count')), row));
    }
    return frag;
  }
  const groups = filter === 'recent' ? [{label: 'Letti di recente', list: recentBooks(cb)}]
    : GENRES.map(g => ({label: g.label, list: Array.from({length: g.to - g.from + 1}, (_, i) => g.from + i).filter(b => filter === 'all' || (filter === 'at') === (b < 39))})).filter(g => g.list.length);
  for (const g of groups) {
    frag.append(h('section', {class: 'gsec'}, h('h2', {class: 'g-head'}, h('span', {text: g.label}), h('em', {text: String(g.list.length)})), h('div', {class: 'gbooks'}, ...g.list.map(b => btns.get(b)))));
  }
  return frag;
}

function renderIndex(visible) {
  idx.replaceChildren(...INDEX.filter(([b]) => visible.has(b)).map(([b, l]) => h('button', {type: 'button', class: 'lib-idx-b', 'aria-label': 'Vai a ' + names[b], dataset: {jump: b}, on: {click: () => { el.querySelector('.gbook[data-book="' + b + '"]')?.scrollIntoView({block: 'start'}); }}}, l)));
  idx.hidden = view !== 'grid' || filter === 'recent';
}

function renderContinue() {
  const [b, c, v] = notes.pos();
  if (contBook !== b) {   // la copertina si ricostruisce solo quando cambia il libro
    contBook = b;
    cont.replaceChildren(cover(b, {w: 44, h: 62, r: 3, title: 'arabic'}), h('span', {class: 'cont-t'}), icon('chev', 18, 2));
  }
  cont.querySelector('.cont-t').replaceChildren(text('small', 'Continua a leggere', 'eyebrow'), h('b', {text: names[b] + ' ' + c + ',' + v}));
  cont.onclick = () => openRef(b, c, v);
}

function render(force) {
  const [cb] = notes.pos(), key = [view, filter, cb, notes.recents().length].join('|');
  renderContinue();
  if (!force && key === stamp) { updateState(); return; }
  stamp = key;
  shelves.className = 'shelves ' + (view === 'grid' ? 'is-grid' : 'is-shelf');
  filterBox.hidden = view !== 'grid';
  shelves.replaceChildren(layout(cb));
  renderIndex(new Set([...shelves.querySelectorAll('.gbook')].map(x => +x.dataset.book)));
  updateState();
}

function setView(v) { view = v; store.set(VIEW_KEY, v); drawSwitch(); render(true); window.scrollTo(0, 0); }
function setFilter(f) { filter = f; drawSwitch(); render(true); window.scrollTo(0, 0); }
function drawSwitch() {
  segmented(viewSeg, [{value: 'grid', label: 'Griglia'}, {value: 'shelf', label: 'Scaffale'}], view, setView, 'Modalità libreria');
  segmented(filterBox, FILTERS, filter, setFilter, 'Filtro libri');
  filterBox.className = 'lib-filters'; viewSeg.classList.add('lib-seg');
}

export default {
  id: 'libreria', tab: 'libreria', title: 'Libreria',
  build(root) {
    el = root;
    view = store.get(VIEW_KEY, 'grid') === 'shelf' ? 'shelf' : 'grid';
    input = h('input', {id: 'goto', type: 'search', enterkeyhint: 'go', autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false', placeholder: 'Vai a… gv 3,16', 'aria-label': 'Vai a un riferimento'}); noAutofill(input, 'riferimento-biblico');
    msg = h('p', {class: 'hint', id: 'gotoMsg', role: 'status'});
    shelves = h('div', {class: 'shelves'});
    viewSeg = h('div', {id: 'libView'}); filterBox = h('div', {id: 'libFilters'});
    cont = h('button', {class: 'lib-cont', type: 'button', id: 'libCont'});
    idx = h('nav', {class: 'lib-idx', 'aria-label': 'Indice rapido dei libri'});
    const form = h('form', {class: 'searchbox', id: 'gotoForm', autocomplete: 'off', on: {submit: e => { e.preventDefault(); goTo(input.value); }}}, icon('search', 18, 1.8), input, h('button', {class: 'mini', type: 'submit', text: 'Invio'}));
    root.append(h('div', {class: 'col'}, h('div', {class: 'lib-top'}, h('h1', {class: 'big'}, 'Libreria'), viewSeg), form, msg, cont, filterBox, shelves), idx);
    buildButtons();
    drawSwitch();
    render(true);
  },
  show() { msg.textContent = ''; input.value = ''; render(); },
};
