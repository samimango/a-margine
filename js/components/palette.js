/* Riga di pallini per i 5 colori (+ «nessun colore»), usata dalla barra azioni del lettore e dall'editor nota */
import {h} from '../core/dom.js';
import {colorNames} from '../core/bible.js';
import * as notes from '../core/notes.js';

export function dots(box, current, pick) {
  box.replaceChildren();
  const none = h('button', {class: 'none', type: 'button', title: 'Nessun colore', 'aria-label': 'Nessun colore', 'aria-pressed': String(current == null), on: {click: () => pick(null)}}, '–');
  box.append(none);
  notes.labels().forEach((label, i) => {
    box.append(h('button', {type: 'button', style: {'--c': 'var(--d' + (i + 1) + ')'}, title: colorNames[i] + ' · ' + label, 'aria-label': colorNames[i] + ' · ' + label, 'aria-pressed': String(current === i), on: {click: () => pick(i)}}));
  });
}
