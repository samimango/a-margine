/* Elenco dei conflitti di sincronizzazione con i due pulsanti di scelta. Si ridisegna da solo quando cambia lo stato. */
import {h} from '../core/dom.js';
import * as sync from '../core/sync.js';
import {on} from '../core/bus.js';

export function renderConflicts(box) {
  box.replaceChildren();
  const list = sync.conflicts();
  box.hidden = !list.length;
  for (const c of list) {
    box.append(h('div', {class: 'conflict'},
      h('p', {class: 'cf-title', text: 'Modifiche contemporanee · ' + c.field}),
      h('p', {text: 'Sul dispositivo: ' + c.mine}), h('p', {text: 'Sincronizzato: ' + c.theirs}),
      h('div', {class: 'cf-btns'},
        h('button', {class: 'btn', type: 'button', text: 'Usa la mia modifica', on: {click: () => { sync.resolveConflict(c.id, true); renderConflicts(box); }}}),
        h('button', {class: 'btn', type: 'button', text: 'Usa quella sincronizzata', on: {click: () => { sync.resolveConflict(c.id, false); renderConflicts(box); }}}))));
  }
}
/* Collega un box ai cambiamenti di stato mentre è visibile */
export function liveConflicts(box) {
  renderConflicts(box);
  on('sync:state', () => { if (box.isConnected && !box.closest('[hidden]')) renderConflicts(box); });
  on('data:changed', () => { if (box.isConnected && !box.closest('[hidden]')) renderConflicts(box); });
  on('screen:show', () => { if (box.isConnected && !box.closest('[hidden]')) renderConflicts(box); });
}
