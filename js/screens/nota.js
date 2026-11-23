/* Editor della meditazione. Semplice (textarea) ma sostituibile: una feature con `noteEditor` (priorità maggiore) prende il suo posto. */
import {h, text} from '../core/dom.js';
import {icon} from '../core/icons.js';
import * as router from '../core/router.js';
import * as notes from '../core/notes.js';
import * as chapters from '../core/chapters.js';
import * as features from '../core/features.js';
import * as ui from '../core/ui.js';
import {names} from '../core/bible.js';
import {openRef} from '../core/nav.js';
import {on} from '../core/bus.js';
import {dots} from '../components/palette.js';
import {topbar} from '../components/topbar.js';

let el, D = {}, activeId = null, from = 'oggi', editorHandle = null, editorApi = null, curBook = 42, curCh = 1, curV = 1;

const isVisible = () => Boolean(el) && !el.hidden;
function currentText() { return activeId ? notes.record(activeId).note || '' : ''; }

/* L'id si decide alla prima scrittura se la nota è nuova (libera, versetto o capitolo) */
function ensureId() {
  if (activeId) return true;
  const mode = D.attach.value;
  activeId = mode === 'free' ? notes.newFreeId() : mode === 'chapter' ? notes.newId(curBook, curCh, 0, 0) : notes.newId(curBook, curCh, curV, curV);
  D.attachLabel.hidden = true; head(); return true;
}
function onInput(value) {
  if (!ensureId()) return;
  const r = notes.saveNote(activeId, {note: value});
  if (r === 'limit') { editorHandle?.setText?.(currentText()); setStatus('Limite raggiunto (8 KB).'); }
  else if (r === 'storage') setStatus('Non salvato. Copia la nota.');
  else setStatus('Salvato');
}
function setStatus(t) { D.status.textContent = t; }

function head() {
  D.wRef.textContent = activeId ? notes.ref(activeId) : 'Nuova meditazione';
  let t = '';
  if (activeId && !activeId.startsWith('free.')) {
    const [bk, ch, f, to] = activeId.split('.'), first = Number(f), last = Number(to ?? f);
    for (let n = first; n > 0 && n <= last; n++) t += chapters.textOf(bk + '.' + ch + '.' + n) + ' ';
    /* nota di un altro capitolo: il testo si prende dalla cache dei capitoli già letti */
    if (!t.trim() && first > 0) { const id = activeId; chapters.loadSections([bk + '.' + ch]).then(found => { if (found && activeId === id && isVisible()) head(); }); }
  }
  D.wText.textContent = t.trim(); D.wText.hidden = !t.trim();
  D.readPassage.hidden = !activeId || activeId.startsWith('free.');
}
function drawPalette() {
  const cur = activeId ? notes.record(activeId).color : null;
  dots(D.palette, cur == null ? null : cur, i => {
    if (!ensureId()) return;
    const id = activeId, old = notes.record(id).color ?? null;
    notes.saveNote(id, {color: i === cur ? null : i});
    ui.toast('Colore cambiato', () => { notes.saveNote(id, {color: old}); drawPalette(); });
    drawPalette();
  });
}
/* Contratto dell'editor (anche per quelli delle feature): mount(box, api) → {setText?(t), focus?(), destroy?()}
   api = {id (getter), text (testo iniziale), changed(testo) → salva, setStatus(t), ctx} */
function defaultEditor(box, api) {
  const area = h('textarea', {id: 'note', enterkeyhint: 'enter', placeholder: 'Cosa ti colpisce?', 'aria-label': 'Meditazione', on: {input: () => api.changed(area.value)}});
  area.value = api.text; box.append(area);
  return {setText: t => { area.value = t; }, focus: () => area.focus({preventScroll: true})};
}
function mountEditor() {
  editorHandle?.destroy?.(); editorHandle = null; D.editorBox.replaceChildren();
  editorApi = {get id() { return activeId; }, text: currentText(), changed: onInput, setStatus, ctx: features.ctx};
  const custom = features.noteEditorFor();
  if (custom) { try { editorHandle = custom.mount(D.editorBox, editorApi) || {}; } catch (e) { console.error('noteEditor', e); editorHandle = null; D.editorBox.replaceChildren(); } }
  if (!editorHandle || !D.editorBox.firstChild) editorHandle = defaultEditor(D.editorBox, editorApi);
}

export default {
  id: 'nota', tab: 'quaderno', title: 'Meditazione', tabbar: false,
  build(root) {
    el = root;
    D.attach = h('select', {id: 'attach', 'aria-label': 'Scrivi su'});
    D.attachLabel = h('label', {id: 'attachLabel', hidden: true}, 'Scrivi su', D.attach);
    D.wRef = h('b', {id: 'wRef'}); D.wText = h('span', {id: 'wText'});
    D.readPassage = h('button', {class: 'link', id: 'readPassage', type: 'button', hidden: true, text: 'Leggi il passo', on: {click: () => { if (!activeId || activeId.startsWith('free.')) return; const [bk, ch, f] = activeId.split('.'); openRef(bk, ch, Number(f) || 1); }}});
    D.editorBox = h('div', {class: 'editor-box', id: 'editorBox'});
    D.palette = h('div', {class: 'palette', id: 'palette', role: 'group', 'aria-label': 'Colore della meditazione'});
    D.status = h('span', {id: 'status', role: 'status'});
    const done = h('button', {class: 'done', id: 'wDone', type: 'button', text: 'Fatto', on: {click: () => router.back(from === 'nota' ? 'quaderno' : from)}});
    root.append(topbar({title: 'Meditazione', onBack: () => router.back(from), right: [done], id: 'wTop'}),
      h('div', {class: 'col wr'}, D.attachLabel, h('div', {class: 'quote'}, D.wRef, D.wText, D.readPassage), D.editorBox),
      h('div', {class: 'wbar glass'}, D.palette, D.status));
    on('data:changed', () => { if (isVisible() && activeId) { const t = currentText(); editorHandle?.setText?.(t); drawPalette(); } });
  },
  show(params) {
    activeId = params.id || null; from = params.from || 'oggi';
    [curBook, curCh, curV] = notes.pos();
    D.attachLabel.hidden = Boolean(activeId);
    if (!activeId) D.attach.replaceChildren(new Option('Meditazione libera', 'free'), new Option(names[curBook] + ' ' + curCh + ',' + curV, 'verse'), new Option(names[curBook] + ' ' + curCh + ' · Capitolo', 'chapter'));
    setStatus(''); head(); drawPalette(); mountEditor();
    editorHandle?.focus?.();
  },
};
