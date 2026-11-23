/* Leggi: lettura editoriale. Posizione precisa («Riprendi»), selezione di versetti toccando e trascinando,
   barra azioni, modalità immersiva, cambio capitolo, caricamento con cache e prefetch. */
import {h, text, reduceMotion} from '../core/dom.js';
import {icon, iconSvg, fleuron} from '../core/icons.js';
import * as router from '../core/router.js';
import * as notes from '../core/notes.js';
import * as sync from '../core/sync.js';
import * as api from '../core/api.js';
import * as chapters from '../core/chapters.js';
import * as features from '../core/features.js';
import * as theme from '../core/theme.js';
import * as ui from '../core/ui.js';
import {cover} from '../core/covers.js';
import {names, counts, abbr, bookStyle, step, colorNames} from '../core/bible.js';
import {openRef, openNote} from '../core/nav.js';
import {on, emit} from '../core/bus.js';
import {dots} from '../components/palette.js';
import {appearanceControls} from '../components/appearance.js';

const S = {b: 42, c: 1, v: 1};
let el, D = {}, chapterText = {}, requested = '', selA = null, selB = null, pendingScroll = true, leave = null;
let jumpV = null, scrollTimer, lastY = 0, quietUntil = 0, flashIds = new Set(), freshBm = null, suppressClick = false, readObserver = null;

const vk = n => [S.b, S.c, n].join('.');
const loaded = () => Object.keys(chapterText).length > 0;
const limit = () => loaded() ? chapters.verseLimitOf(chapterText) : 176;
const savePos = () => notes.setPos(S.b, S.c, S.v);
const isVisible = () => Boolean(el) && !el.hidden;

/* ---------- Azioni sul versetto del nucleo (le altre arrivano dalle feature) ---------- */
features.registerFeature({
  id: 'core-leggi',
  verseActions: [
    {id: 'nota', order: 10, label: 'Scrivi nota', icon: 'pen', primary: true, run: sel => openWriteSel(sel)},
    {id: 'segnalibro', order: 20, icon: 'bookmark', label: sel => notes.isBm(sel.book, sel.ch, sel.from) ? 'Togli segnalibro' : 'Segnalibro', run: sel => { toggleBmUndo(sel.book, sel.ch, sel.from); updateActions(); }},
  ],
});

/* ---------- Segnalibri con Annulla ---------- */
function toggleBmUndo(bk, ch, vs) {
  const wasOn = notes.isBm(bk, ch, vs);
  if (!wasOn) { freshBm = vs; setTimeout(() => { freshBm = null; }, 300); }
  notes.toggleBm(bk, ch, vs);
  if (wasOn) ui.toast('Segnalibro rimosso', () => notes.toggleBm(bk, ch, vs));
}

/* ---------- Disegno ---------- */
function renderHeader() {
  D.title.firstChild.textContent = names[S.b] + (counts[S.b] > 1 ? ' ' + S.c : '');
  D.bottomPrev.disabled = !step(S.b, S.c, -1);
  D.bottomNext.disabled = !step(S.b, S.c, 1);
  D.bmBtn.setAttribute('aria-pressed', String(notes.isBm(S.b, S.c, S.v)));
  const nxt = step(S.b, S.c, 1);
  D.nextCard.replaceChildren();
  if (nxt) D.nextCard.append(cover(nxt[0], {w: 40, h: 56, r: 3, title: false}), h('div', {class: 'next-body'}, text('small', 'Capitolo dopo', 'eyebrow'), h('b', {text: counts[nxt[0]] === 1 ? names[nxt[0]] : names[nxt[0]] + ' ' + nxt[1]})), icon('chev', 18, 2.2));
  const st = bookStyle(S.b);
  el.style.setProperty('--bk', st.c1); el.style.setProperty('--bk-ac', st.ac);
}
function renderChapHead() {
  const single = counts[S.b] === 1;
  D.chapHead.replaceChildren();
  const hasBm = notes.bookmarks().some(m => m[0] === S.b && m[1] === S.c);
  if (hasBm) { const r = h('span', {class: 'chap-ribbon', 'aria-hidden': 'true'}); r.innerHTML = '<svg viewBox="0 0 28 54" width="28" height="54"><path d="M0 0h28v54l-14-12L0 54z" fill="currentColor"/></svg>'; D.chapHead.append(r); }
  D.chapHead.append(single ? h('div', {class: 'chap-book solo', text: names[S.b]}) : h('div', {class: 'chap-book', text: names[S.b]}), single ? null : h('div', {class: 'chap-num', text: String(S.c)}));
  const fl = h('div', {class: 'chap-fleuron'}); fl.innerHTML = fleuron(48); D.chapHead.append(fl);
  for (const c of features.chapterHeader({book: S.b, ch: S.c, text: chapterText})) D.chapHead.append(h('div', {class: 'chap-slot', dataset: {feature: c.id}}, c.node));
}
function renderFooter() {
  D.footerSlots.replaceChildren(...features.chapterFooter({book: S.b, ch: S.c, text: chapterText}).map(c => h('div', {class: 'chap-slot', dataset: {feature: c.id}}, c.node)));
}
const boundsOf = id => { const [, , f, t] = id.split('.'); return [Number(f), Number(t ?? f)]; };

function renderText() {
  const section = S.b + '.' + S.c + '.', all = notes.annotated().filter(id => id.startsWith(section));
  const recs = new Map(), rec = id => { let r = recs.get(id); if (!r) { r = notes.record(id); recs.set(id, r); } return r; };
  const ids = new Set([...Object.keys(chapterText), ...Object.keys(chapters.sampleText()), ...Object.keys(chapters.passages), ...all.filter(id => id.split('.').length === 3)].filter(id => id.startsWith(section)));
  const rangeColor = {}, rangeNotes = new Map();
  for (const id of all.filter(id => id.split('.').length > 3)) {
    const r = rec(id), [f, t] = boundsOf(id);
    if (r.color != null) for (let n = f; n <= t; n++) if (rangeColor[n] == null) rangeColor[n] = r.color;
    if (r.note) { if (!rangeNotes.has(f)) rangeNotes.set(f, []); rangeNotes.get(f).push(id); }
  }
  const bms = new Set(notes.bookmarks().filter(m => m[0] === S.b && m[1] === S.c).map(m => m[2]));
  const decorate = features.hasDecorators();
  const frag = document.createDocumentFragment();
  for (const id of [...ids].sort((x, y) => Number(x.split('.')[2]) - Number(y.split('.')[2]))) {
    const vs = Number(id.split('.')[2]), item = rec(id);
    const line = h('span', {class: 'verse', id: 'v' + vs, role: 'button', tabindex: '0', dataset: {n: vs}});
    const inSel = selA !== null && vs >= selA && vs <= selB;
    line.classList.toggle('sel', inSel); line.setAttribute('aria-pressed', String(inSel));
    const color = item.color != null ? item.color : rangeColor[vs];
    if (color != null) line.dataset.c = color + 1;
    const body = chapters.textOf(id) || 'Versetto ' + vs;
    const words = h('span', {class: 't' + (flashIds.has(id) ? ' hl' : ''), text: body});
    if (bms.has(vs)) line.append(h('i', {class: 'rib' + (freshBm === vs ? ' new' : '')}));
    line.append(h('sup', {text: String(vs)}), words);
    if (decorate) features.decorateVerse(words, {book: S.b, ch: S.c, n: vs, id, text: body});
    if (item.note) line.append(h('em', {class: 'vnote', text: item.note}));
    for (const mid of rangeNotes.get(vs) || []) line.append(h('em', {class: 'vnote', text: notes.ref(mid) + ' · ' + rec(mid).note}));
    frag.append(line, document.createTextNode(' '));
  }
  D.verses.replaceChildren(frag);
  const sec = S.b + '.' + S.c + '.';
  D.availability.textContent = loaded() ? 'Riveduta 2020 © ADI-Media · Testo da LaParola.net' : Object.keys(chapters.passages).some(k => k.startsWith(sec)) ? 'Testo importato sul dispositivo.' : (S.b === 42 && S.c === 1 ? 'Estratto locale · Giovanni 1,1–2.' : '');
  updateActions(); doScroll();
}
function refresh() { if (!isVisible()) return; renderHeader(); renderChapHead(); renderText(); renderFooter(); }

/* Uno scorrimento deciso dal programma (salto a un versetto) non deve nascondere le barre */
function quiet(ms = 500) { quietUntil = Date.now() + ms; bars.show(); }

/* ---------- Posizione: scorrimento e «Riprendi» preciso ---------- */
function doScroll() {
  if (!pendingScroll || !isVisible()) return;
  const ready = loaded() || !api.isConfigured();
  if (S.v <= 1) { quiet(); window.scrollTo(0, 0); if (ready) pendingScroll = false; return; }
  if (!ready) return;
  /* se il versetto non esiste (testo con lacune) si resta all'inizio ma si riprende a registrare la posizione */
  const v = document.getElementById('v' + S.v);
  if (v) { quiet(); v.scrollIntoView({block: 'start'}); jumpV = S.v; }
  pendingScroll = false;
}
/* Dopo un salto in fondo al capitolo il versetto scelto può non arrivare in cima: finché lo si vede e non si scorre a mano, la posizione resta quella */
for (const evt of ['wheel', 'touchstart', 'mousedown', 'keydown']) addEventListener(evt, () => { jumpV = null; }, {passive: true, capture: true});
addEventListener('scroll', () => { clearTimeout(scrollTimer); scrollTimer = setTimeout(trackPos, 250); }, {passive: true});
const topEdge = () => (D.top && !document.body.classList.contains('immersive') ? D.top.getBoundingClientRect().bottom : 0) + 4;
function trackPos() {
  clearTimeout(scrollTimer);
  if (!isVisible() || pendingScroll || selA !== null) return;   // con una selezione attiva la posizione è quella del versetto scelto
  if (jumpV !== null) {
    const r = document.getElementById('v' + jumpV)?.getBoundingClientRect();
    if (r && r.bottom > 80 && r.top < innerHeight) return;
    jumpV = null;
  }
  /* il primo versetto che comincia sotto il bordo alto (le righe sono condivise tra versetti: la precisione è di una riga) */
  const edge = topEdge() - 6;
  let found = null;
  for (const v of D.verses.querySelectorAll('.verse')) {
    const first = v.getClientRects()[0];
    if (first && first.top >= edge) { found = Number(v.dataset.n); break; }
  }
  if (!found) { const all = D.verses.querySelectorAll('.verse'); if (all.length) found = Number(all[all.length - 1].dataset.n); }
  if (found && found !== S.v) { S.v = found; savePos(); D.bmBtn.setAttribute('aria-pressed', String(notes.isBm(S.b, S.c, S.v))); }
}
const flushPos = () => { if (!isVisible()) return; if (jumpV === null) trackPos(); savePos(); };
document.addEventListener('visibilitychange', () => { if (document.hidden) flushPos(); });
addEventListener('pagehide', flushPos);

/* ---------- Caricamento del capitolo ---------- */
function setLoad(msg, retry = false, link = false) { D.loadState.textContent = msg; D.retry.hidden = !retry; D.setupLink.hidden = !link; }
async function loadChapter() {
  const book = S.b, ch = S.c, section = book + '.' + ch;
  if (requested === section) return;
  requested = section; chapterText = {}; setLoad(api.isConfigured() ? 'Caricamento del capitolo…' : '');
  const cached = await chapters.cached(book, ch);
  if (requested !== section) return;
  if (cached) {
    chapterText = cached; setLoad(api.isConfigured() ? '' : 'Lettura offline.');
    if (S.v > limit()) S.v = limit();
    refresh(); emit('chapter:loaded', {book, ch, text: chapterText});
  }
  if (!api.isConfigured()) {
    if (!cached) setLoad('Questo capitolo non è ancora sul dispositivo. Collega il tuo Google per leggere da LaParola.net.', false, true);
    else chapters.prefetchAround(book, ch);
    return;
  }
  try {
    const fresh = await chapters.fetchChapter(book, ch);
    if (requested !== section) return;
    chapters.markTried(section); setLoad('');
    if (!cached || JSON.stringify(fresh) !== JSON.stringify(cached)) {
      chapterText = fresh;
      if (S.v > limit()) S.v = limit();
      refresh(); emit('chapter:loaded', {book, ch, text: chapterText});
    }
    chapters.prefetchAround(book, ch);
  } catch {
    if (requested !== section) return;
    if (cached) { setLoad('Lettura offline.'); return; }
    /* senza testo non c'è nulla a cui scorrere: si riprende comunque a registrare la posizione e al prossimo accesso si riprova */
    pendingScroll = false; requested = '';
    setLoad('Capitolo non raggiungibile. Puoi continuare a scrivere.', true);
  }
}
function turnChapter(d) { const s = step(S.b, S.c, d); if (s) openRef(s[0], s[1], 1); }

/* ---------- Selezione ---------- */
function selection() {
  if (selA === null) return null;
  const verses = [];
  for (let n = selA; n <= selB; n++) verses.push({n, text: chapters.textOf(vk(n))});
  const refText = names[S.b] + ' ' + S.c + ',' + selA + (selB > selA ? '–' + selB : '');
  return {book: S.b, ch: S.c, from: selA, to: selB, ref: refText, text: verses.map(x => x.text).filter(Boolean).join(' '), verses};
}
function paintSel() {
  for (const line of D.verses.querySelectorAll('.verse')) {
    const n = Number(line.dataset.n), on = selA !== null && n >= selA && n <= selB;
    line.classList.toggle('sel', on); line.setAttribute('aria-pressed', String(on));
  }
}
function setSelection(a, b) {
  selA = a; selB = b;
  if (selA !== null && S.v !== selA) { S.v = selA; savePos(); }
  paintSel(); paletteSel(); updateActions(); keepSelVisible();
  emit('selection:changed', {sel: selection()});
}
function tapVerse(n) {
  if (selA === null) setSelection(n, n);
  else if (selA === selB && n === selA) setSelection(null, null);
  else if (selA === selB) setSelection(Math.min(n, selA), Math.max(n, selA));
  else setSelection(n, n);
}
function keepSelVisible() {
  if (selA === null) return;
  requestAnimationFrame(() => {
    const last = document.getElementById('v' + selB), bar = D.actions;
    if (!last || bar.hidden) return;
    const over = last.getBoundingClientRect().bottom - (bar.getBoundingClientRect().top - 12);
    if (over > 0) window.scrollBy({top: over, behavior: reduceMotion() ? 'auto' : 'smooth'});
  });
}
function paletteSel() {
  const first = selA !== null ? notes.record(vk(selA)).color : null;
  dots(D.palette, first == null ? null : first, i => applyColor(i));
  D.cname.textContent = first != null ? colorNames[first] + ' · ' + notes.labels()[first] : 'Scegli un colore per evidenziare';
}
function applyColor(i) {
  if (selA === null) return;
  const same = i !== null && notes.record(vk(selA)).color === i, prev = [];
  for (let n = selA; n <= selB; n++) { const id = vk(n); prev.push([id, notes.record(id).color ?? null]); flashIds.add(id); }
  setTimeout(() => { flashIds = new Set(); }, 300);
  for (const [id] of prev) notes.saveNote(id, {color: same ? null : i}, true);
  refresh(); paletteSel();
  ui.toast('Colore cambiato', () => { for (const [id, old] of prev) notes.saveNote(id, {color: old}, true); refresh(); paletteSel(); });
}
function openWriteSel(sel) {
  const f = sel.from, t = sel.to;
  const id = f === t ? vk(f) : notes.annotated().find(k => k.startsWith(S.b + '.' + S.c + '.') && notes.record(k).note && notes.bounds(k)[0] === f && notes.bounds(k)[1] === t) || notes.newId(S.b, S.c, f, t);
  openNote(id, 'leggi');
}
function updateActions() {
  const on = selA !== null && isVisible();
  D.actions.hidden = !on;
  document.body.classList.toggle('has-actions', on);
  if (!on) { document.documentElement.style.setProperty('--actions-h', '0px'); return; }
  const sel = selection();
  D.aref.textContent = sel.ref;
  D.abtns.replaceChildren(...features.verseActions(sel).map(a => {
    const label = typeof a.label === 'function' ? a.label(sel) : a.label;
    return h('button', {class: 'abtn' + (a.primary ? ' p' : ''), type: 'button', dataset: {action: a.id}, 'aria-label': label, on: {click: () => { try { a.run(sel, features.ctx); } catch (e) { console.error(e); } }}}, a.icon ? icon(a.icon, 20, 1.8) : null, h('span', {text: label}));
  }));
  document.documentElement.style.setProperty('--actions-h', D.actions.offsetHeight + 'px');
}

/* Trascinamento: mouse subito, dito dopo una pressione prolungata (così scorrere resta scorrere) */
const verseOf = t => { const v = t?.closest?.('.verse'); return v ? Number(v.dataset.n) : null; };
const verseAtPoint = (x, y) => verseOf(document.elementFromPoint(x, y));
let drag = null, press = null, swipe = null, sliding = false;
function dragTo(n) { if (drag && n !== null) setSelection(Math.min(drag.start, n), Math.max(drag.start, n)); }
function bindGestures() {
  const box = D.verses;
  box.addEventListener('mousedown', e => { if (e.button !== 0) return; const n = verseOf(e.target); drag = n === null ? null : {start: n, moved: false}; });
  addEventListener('mousemove', e => {
    if (!drag || !(e.buttons & 1)) { if (drag && !(e.buttons & 1)) drag = null; return; }
    const n = verseAtPoint(e.clientX, e.clientY);
    if (n !== null && (n !== drag.start || drag.moved)) { drag.moved = true; dragTo(n); }
  });
  addEventListener('mouseup', () => { if (drag?.moved) { suppressClick = true; setTimeout(() => { suppressClick = false; }, 0); } drag = null; });
  box.addEventListener('touchstart', e => {
    swipe = e.touches.length === 1 ? {x: e.touches[0].clientX, y: e.touches[0].clientY} : null;
    clearTimeout(press?.timer); press = null;
    const n = e.touches.length === 1 ? verseOf(e.target) : null;
    if (n !== null) {
      const t = e.touches[0];
      press = {n, x: t.clientX, y: t.clientY, active: false, timer: setTimeout(() => { if (!press) return; press.active = true; swipe = null; drag = {start: press.n, moved: true}; setSelection(press.n, press.n); }, 380)};
    }
  }, {passive: true});
  box.addEventListener('touchmove', e => {
    if (!press) return;
    const t = e.touches[0];
    if (press.active) { e.preventDefault(); dragTo(verseAtPoint(t.clientX, t.clientY)); return; }
    if (Math.hypot(t.clientX - press.x, t.clientY - press.y) > 10) { clearTimeout(press.timer); press = null; }
  }, {passive: false});
  const endTouch = () => { clearTimeout(press?.timer); if (press?.active) { suppressClick = true; setTimeout(() => { suppressClick = false; }, 400); } press = null; drag = null; };
  box.addEventListener('touchcancel', () => { swipe = null; endTouch(); }, {passive: true});
  box.addEventListener('touchend', e => {
    const wasActive = press?.active; endTouch();
    const s = swipe; swipe = null;
    if (wasActive || !s || e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - s.x, dy = e.changedTouches[0].clientY - s.y;
    if (Math.abs(dx) < 70 || Math.abs(dx) <= Math.abs(dy) * 1.5) return;
    if (selA !== null) return;
    slideChapter(dx < 0 ? 1 : -1);
  }, {passive: true});
  box.addEventListener('contextmenu', e => e.preventDefault());
  box.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('verse')) { e.preventDefault(); tapVerse(Number(e.target.dataset.n)); } });
}
function slideChapter(d) {
  if (sliding || !step(S.b, S.c, d)) return;
  if (reduceMotion()) { turnChapter(d); return; }
  sliding = true;
  const box = D.verses, out = box.animate([{transform: 'translateX(0)', opacity: 1}, {transform: `translateX(${-d * 40}px)`, opacity: 0}], {duration: 160, easing: 'ease-out', fill: 'forwards'});
  out.finished.then(() => { out.cancel(); turnChapter(d); return box.animate([{transform: `translateX(${d * 40}px)`, opacity: 0}, {transform: 'translateX(0)', opacity: 1}], {duration: 200, easing: 'ease-out'}).finished; }).catch(() => {}).finally(() => { sliding = false; });
}

/* ---------- Immersivo: le barre si nascondono scorrendo in basso, tornano salendo o con un tocco ---------- */
const bars = {hide: () => document.body.classList.add('immersive'), show: () => document.body.classList.remove('immersive'), hidden: () => document.body.classList.contains('immersive')};
addEventListener('scroll', () => {
  const y = scrollY, dy = y - lastY; lastY = y;
  if (!isVisible()) return;
  if (Date.now() < quietUntil) { lastY = y; return; }
  if (y <= 80) bars.show();
  else if (dy > 6 && selA === null) bars.hide();
  else if (dy < -6) bars.show();
}, {passive: true});
function onReaderClick(e) {
  if (suppressClick) { e.preventDefault(); return; }
  if (e.target.closest('button, a, input, textarea, select, .actions, .rtop, .turn') && !e.target.closest('.verse')) return;
  if (bars.hidden() && selA === null) { bars.show(); return; }
  const n = verseOf(e.target);
  if (n !== null) { tapVerse(n); return; }
  if (selA === null && scrollY > 80 && e.target.closest('.reader')) bars.hide();
}

/* ---------- Fogli: vai al versetto, aspetto della lettura ---------- */
function openVerseSheet() {
  ui.sheet({title: 'Vai al versetto', build(body, sh) {
    const n = loaded() ? limit() : Math.max(0, ...[...Object.keys(chapters.passages), ...Object.keys(chapters.sampleText())].filter(id => id.startsWith(S.b + '.' + S.c + '.')).map(id => Number(id.split('.')[2])));
    const grid = h('div', {class: 'vgrid', id: 'vgrid'});
    if (!n) grid.append(text('p', 'Il testo del capitolo non è ancora disponibile.', 'empty'));
    for (let i = 1; i <= n; i++) grid.append(h('button', {class: 'vnum', type: 'button', text: String(i), 'aria-current': i === S.v ? 'true' : null, on: {click: () => { sh.close(); jumpVerse(i); }}}));
    body.append(grid);
  }});
}
function jumpVerse(n) {
  setSelection(null, null); S.v = n; pendingScroll = false; savePos(); renderHeader(); renderText();
  const v = document.getElementById('v' + n);
  if (v) { quiet(1000); v.scrollIntoView({block: 'start', behavior: reduceMotion() ? 'auto' : 'smooth'}); jumpV = n; }
}
function openTypoSheet() {
  ui.sheet({title: 'Aspetto della lettura', build(body) {
    appearanceControls(body);
    const extra = h('div', {class: 'reader-settings'});
    for (const it of features.readerSettingsItems()) { const box = h('div', {dataset: {feature: it.id}}); try { it.render(box, features.ctx); } catch (e) { console.error(e); } extra.append(box); }
    body.append(extra);
  }});
}

/* ---------- Schermata ---------- */
export default {
  id: 'leggi', tab: 'libreria', title: 'Leggi', manageScroll: true,
  build(root) {
    el = root;
    D.title = h('button', {class: 'rtitle', id: 'titleBtn', type: 'button', 'aria-label': 'Scegli libro e capitolo', on: {click: () => router.go('libro', {book: S.b})}}, h('span', {id: 'heading'}), icon('down', 14, 2.2));
    D.bmBtn = h('button', {class: 'ic', id: 'bmBtn', type: 'button', 'aria-label': 'Segnalibro qui', on: {click: () => toggleBmUndo(S.b, S.c, S.v)}}, icon('bookmark', 20, 1.8));
    D.top = h('header', {class: 'rtop glass', id: 'readTop'},
      h('button', {class: 'ic', id: 'readBack', type: 'button', 'aria-label': 'Indietro', on: {click: () => router.back(router.previousId() && router.previousId() !== 'leggi' ? router.previousId() : 'libreria')}}, icon('back', 20, 2)),
      D.title, h('span', {class: 'grow'}),
      h('button', {class: 'ic aa', id: 'typoBtn', type: 'button', 'aria-label': 'Aspetto della lettura', on: {click: openTypoSheet}}, icon('text', 20, 1.8)),
      h('button', {class: 'ic', id: 'goVerse', type: 'button', 'aria-label': 'Vai al versetto', on: {click: openVerseSheet}}, icon('grid', 19, 1.8)),
      D.bmBtn);
    D.loadState = h('p', {class: 'hint', id: 'loadState', role: 'status'});
    D.retry = h('button', {class: 'btn', id: 'retry', type: 'button', hidden: true, text: 'Riprova a caricare', on: {click: () => { requested = ''; loadChapter(); }}});
    D.setupLink = h('button', {class: 'btn', id: 'setupLink', type: 'button', hidden: true, text: 'Collega il tuo Google', on: {click: () => router.go('collega')}});
    D.chapHead = h('header', {class: 'chap-head', id: 'chapHead'});
    D.verses = h('div', {class: 'text', id: 'verses'});
    D.footerSlots = h('div', {class: 'chap-footer'});
    D.bottomPrev = h('button', {class: 'btn', id: 'bottomPrev', type: 'button', on: {click: () => turnChapter(-1)}}, icon('back', 16, 2), 'Precedente');
    D.nextCard = h('span', {class: 'next-inner'});
    D.bottomNext = h('button', {class: 'card nextcard', id: 'bottomNext', type: 'button', 'aria-label': 'Capitolo successivo', on: {click: () => turnChapter(1)}}, D.nextCard);
    D.availability = h('p', {class: 'hint', id: 'availability'});
    D.palette = h('div', {class: 'palette', id: 'palette2', role: 'group', 'aria-label': 'Colore del versetto'});
    D.cname = h('div', {class: 'cname', id: 'cname'});
    D.aref = h('span', {class: 'aref', id: 'aref'});
    D.abtns = h('div', {class: 'abtns'});
    D.actions = h('div', {class: 'actions glass', id: 'actions', hidden: true},
      h('div', {class: 'aTop'}, D.aref, h('button', {class: 'roundbtn', id: 'aclose', type: 'button', 'aria-label': 'Deseleziona', on: {click: () => { setSelection(null, null); }}}, icon('close', 16, 2.2))), D.palette, D.cname, D.abtns);
    D.turn = h('div', {class: 'turn'}, D.bottomPrev, D.bottomNext);
    root.append(D.top, h('div', {class: 'col reader'}, D.loadState, D.retry, D.setupLink, D.chapHead, D.verses, D.footerSlots, D.turn, D.availability), D.actions);
    bindGestures();
    root.addEventListener('click', onReaderClick);
    /* un capitolo si considera letto quando si arriva in fondo */
    if ('IntersectionObserver' in window) {
      readObserver = new IntersectionObserver(entries => { if (entries.some(en => en.isIntersecting) && loaded() && isVisible()) notes.markRead(S.b, S.c); }, {threshold: 0.6});
      readObserver.observe(D.turn);
    }
    for (const evt of ['notes:changed', 'data:changed']) on(evt, () => { if (isVisible()) { renderHeader(); renderChapHead(); renderText(); paletteSel(); } });
    on('theme:changed', () => { if (isVisible()) updateActions(); });
  },
  show(params, prev) {
    [S.b, S.c, S.v] = notes.pos();
    if (params.fresh || prev === 'nota') { selA = selB = null; }
    if (params.fresh) pendingScroll = true;
    notes.markDay();
    let restoreY = null;
    if (prev !== 'leggi' && !params.fresh && !pendingScroll) {
      if (leave && leave.sec === S.b + '.' + S.c && (loaded() || !api.isConfigured())) restoreY = leave.y; else pendingScroll = true;
    }
    bars.show();
    renderHeader(); renderChapHead(); paletteSel();
    if (requested !== S.b + '.' + S.c) { chapterText = {}; loadChapter(); }
    renderText(); renderFooter();
    if (restoreY !== null) { quiet(); window.scrollTo(0, restoreY); }
    lastY = scrollY;
  },
  hide() {
    if (jumpV === null) trackPos();
    savePos();
    leave = {sec: S.b + '.' + S.c, y: scrollY};
    bars.show();
    document.body.classList.remove('has-actions');
  },
};
