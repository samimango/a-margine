/* Memoria: imparare a memoria con ripetizione dilazionata semplice (Leitner a intervalli).
   - «Impara a memoria» sul versetto/passo: salva riferimento e testo
   - schermata «Ripasso»: flashcard con parole nascoste (più nascoste quando si sa meglio), flip 3D, Difficile / Bene / Facile
   - elenco dei versetti salvati (con «Togli»), scheda «A memoria» in Oggi, riga nelle impostazioni
   Dati: margine.memoria.cards = [{id, b, c, from, to, ref, text, added, due (aaaa-mm-gg), iv (giorni), lvl, reps, last}]
   Intervalli: Difficile = domani e si riparte; Bene = 3 giorni poi ×2; Facile = 7 giorni poi ×2,5. */
import {registerFeature, ctx} from '../core/features.js';

const {store, ui, dom, icons, router, bible, covers} = ctx;
const {h, text, isoDay, reduceMotion} = dom;
const {icon} = icons;

{
  const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = new URL('../../css/f-memoria.css', import.meta.url).href;
  document.head.append(link);
  icons.registerIcons({
    'mem-cards': '<rect x="5" y="3.5" width="13" height="14" rx="2.3"/><path d="M8.5 20.5H17a2.5 2.5 0 0 0 2.5-2.5V8"/><path d="M9 8.5h5M9 11.5h3.5"/>',
    'mem-list': '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.8" cy="6.5" r="1" fill="currentColor"/><circle cx="4.8" cy="12" r="1" fill="currentColor"/><circle cx="4.8" cy="17.5" r="1" fill="currentColor"/>',
  });
}

const KEY = 'margine.memoria.cards';
const MAX_VERSES = 8, MAX_CHARS = 900;

/* ---------------------------------------------------------------- dati */
const addDays = (iso, n) => { const [y, m, d] = iso.split('-').map(Number); return isoDay(new Date(y, m - 1, d + n)); };
const diffDays = (a, b) => { const p = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); }; return Math.round((p(a) - p(b)) / 86400000); };
export const today = () => isoDay();
export function load() {
  return store.getJson(KEY, [], 'array').filter(c => c && typeof c.id === 'string' && typeof c.text === 'string' && typeof c.due === 'string');
}
const save = list => store.setJson(KEY, list);
export const dueCards = (list = load(), day = today()) => list.filter(c => c.due <= day).sort((a, z) => a.due.localeCompare(z.due) || a.added - z.added);
export function addCard(sel) {
  const list = load(), id = [sel.book, sel.ch, sel.from, sel.to].join('.');
  if (list.some(c => c.id === id)) return 'exists';
  const txt = (sel.text || '').replace(/\s+/g, ' ').trim();
  if (!txt) return 'notext';
  if (sel.to - sel.from + 1 > MAX_VERSES || txt.length > MAX_CHARS) return 'long';
  list.push({id, b: sel.book, c: sel.ch, from: sel.from, to: sel.to, ref: sel.ref, text: txt, added: Date.now(), due: today(), iv: 0, lvl: 0, reps: 0, last: 0});
  save(list); return 'ok';
}
export function removeCard(id) { const list = load(), old = list.find(c => c.id === id); save(list.filter(c => c.id !== id)); return old; }
export function restoreCard(card) { const list = load(); if (!list.some(c => c.id === card.id)) { list.push(card); save(list); } }

/* Intervallo che seguirebbe ogni valutazione */
export function nextInterval(card, grade) {
  const iv = card.iv || 0;
  if (grade === 'hard') return 1;
  if (grade === 'good') return iv < 3 ? 3 : Math.round(iv * 2);
  return iv < 7 ? 7 : Math.round(iv * 2.5);
}
export function rate(id, grade) {
  const list = load(), c = list.find(x => x.id === id); if (!c) return null;
  const iv = nextInterval(c, grade);
  c.lvl = grade === 'hard' ? 0 : (c.lvl || 0) + 1;
  c.iv = iv; c.due = addDays(today(), iv); c.reps = (c.reps || 0) + 1; c.last = Date.now();
  save(list); return c;
}
export function dueLabel(card, day = today()) {
  const d = diffDays(card.due, day);
  return d <= 0 ? 'oggi' : d === 1 ? 'domani' : 'tra ' + d + ' giorni';
}
const ivLabel = n => n === 1 ? 'domani' : 'tra ' + n + ' giorni';

/* ---------------------------------------------------------------- parole nascoste */
const SHORT = new Set('il lo la le gli i un uno una di a da in con su per tra fra e ed o ma che non si ci mi ti vi del dello della dei degli delle al allo alla ai agli alle dal dallo dalla dai dagli dalle nel nello nella nei negli nelle sul sullo sulla sui sugli sulle sono era ero hai ha ho è'.split(' '));
const FRACTIONS = [0.25, 0.4, 0.55, 0.7, 0.85];
export const fractionFor = card => FRACTIONS[Math.min(card.lvl || 0, FRACTIONS.length - 1)];
function rng(seedStr) {
  let a = 2166136261; for (const ch of seedStr) { a ^= ch.charCodeAt(0); a = Math.imul(a, 16777619); }
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
/* Spezza il testo in pezzi {pre, word, post, hide}. Parole brevi (<4 lettere) e articoli non si nascondono mai. */
export function pieces(card, seedExtra = '') {
  const tokens = card.text.split(/\s+/).filter(Boolean).map(tok => {
    const m = /^([^\p{L}\p{N}]*)([\p{L}\p{N}’'-]*[\p{L}\p{N}])?(.*)$/u.exec(tok);
    return m[2] ? {pre: m[1], word: m[2], post: m[3] || '', hide: false} : {pre: '', word: '', post: tok, hide: false};
  });
  const cand = tokens.map((t, i) => i).filter(i => { const w = tokens[i].word; return w.length >= 4 && !SHORT.has(w.toLowerCase()); });
  const want = cand.length ? Math.max(1, Math.round(cand.length * fractionFor(card))) : 0;
  const rand = rng(card.id + ':' + (card.reps || 0) + seedExtra);
  const order = cand.map(i => [rand(), i]).sort((a, z) => a[0] - z[0]).slice(0, want).map(x => x[1]);
  for (const i of order) tokens[i].hide = true;
  return tokens;
}
const hiddenCount = toks => toks.filter(t => t.hide).length;

/* ---------------------------------------------------------------- interfaccia */
let el, body;
const S = {view: 'review', queue: [], idx: 0, total: 0, flipped: false, done: 0, all: false};

function head({title, sub, right}) {
  return h('header', {class: 'f-memoria-head'},
    h('button', {class: 'f-memoria-ic', type: 'button', 'aria-label': 'Indietro', id: 'memBack', on: {click: () => router.back(router.previousId() && router.previousId() !== 'memoria' ? router.previousId() : 'oggi')}}, icon('back', 20, 2)),
    h('div', {class: 'f-memoria-ht'}, text('span', title, 'eyebrow'), sub ? text('b', sub) : null),
    right || h('span', {class: 'f-memoria-ic ph', 'aria-hidden': 'true'}));
}
function listButton(label) {
  return h('button', {class: 'f-memoria-ic', type: 'button', id: 'memToggle', 'aria-label': label, on: {click: () => { S.view = S.view === 'list' ? 'review' : 'list'; if (S.view === 'review') startSession(S.all); render(); }}}, icon(S.view === 'list' ? 'mem-cards' : 'mem-list', 20, 1.8));
}

function gapNode(t, onReveal) {
  const w = t.word;
  const b = h('button', {class: 'f-memoria-gap', type: 'button', 'aria-label': 'Parola nascosta: tocca per rivelare', style: {'--n': String(Math.max(3, w.length))}, on: {click: () => { b.classList.add('shown'); b.textContent = w; b.setAttribute('aria-label', w); b.disabled = true; onReveal?.(); }}});
  b.append(h('span', {class: 'f-memoria-gap-w', text: w, 'aria-hidden': 'true'}));
  return b;
}
function textBlock(toks, {interactive}) {
  const p = h('p', {class: 'f-memoria-text'});
  toks.forEach((t, i) => {
    if (i) p.append(' ');
    if (t.pre) p.append(t.pre);
    if (t.hide && interactive) p.append(gapNode(t)); else p.append(t.word);
    if (t.post) p.append(t.post);
  });
  return p;
}
const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);

/* ---- sessione di ripasso ---- */
function startSession(all = false) {
  const list = load();
  S.all = all; S.queue = (all ? list.slice().sort((a, z) => a.due.localeCompare(z.due)) : dueCards(list)).map(c => c.id);
  S.idx = 0; S.total = S.queue.length; S.flipped = false; S.done = 0;
}
function current() { return load().find(c => c.id === S.queue[S.idx]) || null; }

function renderReview() {
  const list = load();
  if (!list.length) {
    body.append(head({title: 'Ripasso', right: listButton('Elenco dei versetti')}),
      h('div', {class: 'f-memoria-empty'}, text('h2', 'Ancora niente a memoria', 'f-memoria-h2'),
        text('p', 'Tocca un versetto nel testo e scegli «Impara a memoria»: qui tornerà per i ripassi.', 'hint'),
        h('button', {class: 'btn primary', type: 'button', text: 'Vai alla lettura', on: {click: () => router.go('libreria')}})));
    return;
  }
  if (S.idx >= S.queue.length) { renderEnd(list); return; }
  const card = current(); if (!card) { S.idx++; renderReview(); return; }
  const toks = pieces(card), n = hiddenCount(toks), first = toks[0]?.word;
  const faceHead = (extra) => h('div', {class: 'f-memoria-fh'}, text('span', card.ref.toUpperCase(), 'eyebrow f-memoria-ref'), extra);
  const front = h('div', {class: 'f-memoria-face front'}, faceHead(text('span', plural(n, 'parola nascosta', 'parole nascoste'), 'f-memoria-tag')), h('div', {class: 'f-memoria-div', 'aria-hidden': 'true'}), textBlock(toks, {interactive: true}),
    h('div', {class: 'f-memoria-ff'}, h('span', {text: first ? 'Suggerimento: inizia con «' + first + '»' : ''}), h('span', {text: card.reps ? 'Visto ' + plural(card.reps, 'volta', 'volte') : 'Nuovo'})));
  const back = h('div', {class: 'f-memoria-face back', 'aria-hidden': 'true', inert: ''}, faceHead(text('span', 'Risposta', 'f-memoria-tag')), h('div', {class: 'f-memoria-div', 'aria-hidden': 'true'}),
    h('p', {class: 'f-memoria-text full', text: card.text}), h('div', {class: 'f-memoria-ff'}, h('span', {text: ''}), h('span', {text: card.reps ? 'Visto ' + plural(card.reps, 'volta', 'volte') : 'Nuovo'})));
  const flip = h('div', {class: 'f-memoria-flip', dataset: {flipped: 'false'}}, front, back);
  const show = h('button', {class: 'f-memoria-show', type: 'button', id: 'memShow', on: {click: doFlip}}, icon('copy', 18, 1.8), 'Mostra la risposta');
  const grade = g => h('button', {class: 'f-memoria-grade ' + g, type: 'button', dataset: {grade: g}, on: {click: () => onGrade(card.id, g)}},
    h('b', {text: {hard: 'Difficile', good: 'Bene', easy: 'Facile'}[g]}), h('small', {text: ivLabel(nextInterval(card, g))}));
  const grades = h('div', {class: 'f-memoria-grades', hidden: true}, text('div', 'Come ti è andata?', 'eyebrow f-memoria-q'), h('div', {class: 'f-memoria-gr'}, grade('hard'), grade('good'), grade('easy')));
  const segs = h('div', {class: 'f-memoria-segs', 'aria-hidden': 'true'}, ...Array.from({length: S.total}, (_, i) => h('i', {class: i < S.idx ? 'done' : i === S.idx ? 'cur' : ''})));
  body.append(head({title: S.all ? 'Ripasso libero' : 'Ripasso di oggi', sub: (S.idx + 1) + ' di ' + S.total, right: listButton('Elenco dei versetti')}), segs,
    h('div', {class: 'f-memoria-stage'}, flip), show, grades);
  function doFlip() {
    if (S.flipped) return; S.flipped = true;
    flip.dataset.flipped = 'true'; front.setAttribute('aria-hidden', 'true'); front.setAttribute('inert', ''); back.removeAttribute('aria-hidden'); back.removeAttribute('inert');
    show.hidden = true; grades.hidden = false;
    if (!reduceMotion()) grades.animate([{opacity: 0, transform: 'translateY(8px)'}, {opacity: 1, transform: 'none'}], {duration: 260, delay: 160, easing: 'ease-out', fill: 'backwards'});
    setTimeout(() => grades.querySelector('[data-grade="good"]')?.focus({preventScroll: true}), reduceMotion() ? 0 : 200);
  }
  setTimeout(() => show.focus({preventScroll: true}), 0);
}
function onGrade(id, g) {
  rate(id, g); S.done++; S.idx++; S.flipped = false; render();
}
function renderEnd(list) {
  const day = today(), tomorrow = list.filter(c => c.due === addDays(day, 1)).length;
  const next = list.filter(c => c.due > day).sort((a, z) => a.due.localeCompare(z.due))[0];
  body.append(head({title: 'Ripasso', sub: S.total ? 'Fatto' : 'Niente per oggi', right: listButton('Elenco dei versetti')}),
    h('div', {class: 'f-memoria-empty', id: 'memEnd'}, icon('check', 34, 1.8),
      text('h2', S.done ? 'Ripasso finito' : 'Niente da ripassare oggi', 'f-memoria-h2'),
      text('p', S.done ? plural(S.done, 'versetto ripassato', 'versetti ripassati') + (tomorrow ? ' · domani ne tornano ' + tomorrow : '') + '.' : next ? 'Il prossimo ripasso è ' + dueLabel(next) + '.' : '', 'hint'),
      h('button', {class: 'btn primary', type: 'button', id: 'memToday', text: 'Torna a Oggi', on: {click: () => router.go('oggi')}}),
      list.length ? h('button', {class: 'btn', type: 'button', id: 'memAgain', text: 'Ripassa tutto lo stesso', on: {click: () => { startSession(true); render(); }}}) : null));
}

/* ---- elenco ---- */
function renderList() {
  const list = load();
  const rows = h('div', {class: 'rows f-memoria-rows', id: 'memList'});
  for (const c of list.slice().sort((a, z) => a.due.localeCompare(z.due))) {
    const due = c.due <= today();
    rows.append(h('div', {class: 'f-memoria-item', dataset: {id: c.id}},
      h('div', {class: 'f-memoria-item-t'}, h('b', {text: c.ref}), h('small', {text: c.text}), h('span', {class: 'f-memoria-due' + (due ? ' now' : ''), text: 'Ripasso ' + dueLabel(c)})),
      h('button', {class: 'f-memoria-x', type: 'button', 'aria-label': 'Togli ' + c.ref + ' dalla memoria', on: {click: () => {
        const old = removeCard(c.id); render(); ui.toast('Tolto: ' + c.ref, () => { restoreCard(old); render(); });
      }}}, icon('trash', 18, 1.8))));
  }
  if (!list.length) rows.append(text('p', 'Nessun versetto salvato. Tocca un versetto nel testo e scegli «Impara a memoria».', 'empty'));
  const n = dueCards(list).length;
  body.append(head({title: 'A memoria', sub: plural(list.length, 'versetto', 'versetti'), right: listButton('Torna al ripasso')}),
    h('div', {class: 'f-memoria-listwrap'}, n ? h('button', {class: 'f-memoria-show', type: 'button', id: 'memGo', on: {click: () => { S.view = 'review'; startSession(false); render(); }}}, icon('mem-cards', 18, 1.8), 'Ripassa ora · ' + n) : null, rows));
}

function render() {
  if (!el) return;
  body.replaceChildren();
  if (S.view === 'list') renderList(); else renderReview();
  window.scrollTo(0, 0);
  const t = body.querySelector('.f-memoria-flip .front, .f-memoria-empty, .f-memoria-listwrap');
  void t;
}

/* ---- scheda in Oggi ---- */
function blankLine(toks) {
  const p = h('p', {class: 'f-memoria-home-t'});
  toks.forEach((t, i) => { if (i) p.append(' '); if (t.pre) p.append(t.pre); if (t.hide) p.append(h('span', {class: 'f-memoria-blank', style: {'--n': String(Math.max(3, t.word.length))}, 'aria-label': 'parola nascosta'})); else p.append(t.word); if (t.post) p.append(t.post); });
  return p;
}
function homeCard() {
  const list = load(); if (!list.length) return null;
  const due = dueCards(list), c = due[0] || list.slice().sort((a, z) => a.due.localeCompare(z.due))[0];
  const toks = pieces(c);
  const open = () => { S.view = 'review'; router.go('memoria', {view: due.length ? 'review' : 'list'}); };
  return h('div', {class: 'card f-memoria-home', id: 'memHome'},
    h('div', {class: 'f-memoria-home-h'}, text('span', 'A memoria', 'eyebrow f-memoria-home-e'), text('span', due.length ? 'oggi · ' + due.length : 'in ordine', 'f-memoria-home-n' + (due.length ? ' now' : ''))),
    due.length ? h('b', {class: 'f-memoria-home-r', text: c.ref}) : h('b', {class: 'f-memoria-home-r', text: 'Niente da ripassare oggi'}),
    due.length ? blankLine(toks) : text('p', 'Il prossimo ripasso è ' + dueLabel(c) + ' (' + c.ref + ').', 'f-memoria-home-t'),
    h('button', {class: 'f-memoria-home-go', type: 'button', id: 'memGoHome', on: {click: open}}, due.length ? 'Ripassa' : 'Elenco', icon('chev', 14, 2.4)));
}

registerFeature({
  id: 'memoria',
  screens: [{
    id: 'memoria', title: 'Ripasso', tab: 'oggi', tabbar: false,
    build(root) { el = root; root.classList.add('f-memoria-screen'); body = h('div', {class: 'col f-memoria-col'}); root.append(body);
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && router.currentId() === 'memoria' && !ctx.ui.sheetOpen()) { e.preventDefault(); document.getElementById('memBack')?.click(); } }); },
    show(params) { S.view = params?.view === 'list' ? 'list' : 'review'; startSession(false); render(); },
  }],
  verseActions: [{
    id: 'memoria', order: 35, label: 'Impara a memoria', icon: 'mem-cards',
    run(sel) {
      const r = addCard(sel);
      if (r === 'ok') ui.toast('Aggiunto a «A memoria»: ' + sel.ref, () => removeCard([sel.book, sel.ch, sel.from, sel.to].join('.')));
      else if (r === 'exists') ui.toast('È già nell’elenco «A memoria».');
      else if (r === 'long') ui.toast('Scegli un passo più breve (al massimo ' + MAX_VERSES + ' versetti).');
      else ui.toast('Il testo di questo passo non è ancora sul dispositivo.');
    },
  }],
  homeCards: [{id: 'memoria', order: 20, render: homeCard}],
  settings: [{id: 'memoria', section: 'Studio', order: 10, label: 'Imparare a memoria', icon: 'mem-cards',
    value: () => { const l = load(); return l.length ? plural(l.length, 'versetto', 'versetti') + ' · ' + dueCards(l).length + ' da ripassare oggi' : 'Nessun versetto salvato'; },
    onTap: () => router.go('memoria', {view: 'list'})}],
});
