/* Riga del quaderno / dei risultati: pallino colore, riferimento, data, testo della nota */
import {h} from '../core/dom.js';
import * as notes from '../core/notes.js';
import {ref} from '../core/bible.js';
import {textOf} from '../core/chapters.js';

export function dateLabel(t) {
  if (!t) return '';
  const d = new Date(t), now = new Date(), days = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
  if (days === 0) return 'oggi';
  if (days === 1) return 'ieri';
  return d.toLocaleDateString('it-IT', {day: 'numeric', month: 'short', ...(d.getFullYear() !== now.getFullYear() ? {year: 'numeric'} : {})});
}
export function passageOf(id) {
  if (id.startsWith('free.')) return '';
  const [bk, ch, f, t] = id.split('.');
  if (!(Number(f) >= 1)) return '';
  const parts = [];
  for (let n = Number(f); n <= Number(t ?? f); n++) { const tx = textOf(bk + '.' + ch + '.' + n); if (tx) parts.push(tx); }
  return parts.join(' ');
}
export function entryRow(id, onclick, {showQuote = true} = {}) {
  const item = notes.record(id), btn = h('button', {class: 'ent', type: 'button', on: {click: onclick}});
  const dot = h('i'); if (item.color != null) dot.style.setProperty('--dot', 'var(--d' + (item.color + 1) + ')');
  const quote = showQuote ? passageOf(id) : '';
  btn.append(dot, h('div', {class: 'ent-body'},
    h('div', {class: 'ent-head'}, h('strong', {text: ref(id)}), h('time', {text: dateLabel(item.t)})),
    quote ? h('em', {class: 'ent-quote', text: '«' + quote + '»'}) : null,
    h('span', {class: 'ent-note', text: item.note || ''})));
  return btn;
}
