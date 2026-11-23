/* Barra in alto delle sotto-schermate (vetro): indietro · titolo · azioni */
import {h} from '../core/dom.js';
import {icon} from '../core/icons.js';
import * as router from '../core/router.js';

/* topbar({title, backTo:'oggi', backLabel?, onBack?, right:[nodi]}) */
export function topbar({title = '', backTo = 'oggi', backParams = {}, backLabel = '', onBack, right = [], id} = {}) {
  const back = h('button', {class: 'tb-back', type: 'button', 'aria-label': backLabel ? 'Indietro a ' + backLabel : 'Indietro', on: {click: () => onBack ? onBack() : router.back(backTo, backParams)}}, icon('back', 20, 2), backLabel ? h('span', {text: backLabel}) : null);
  return h('header', {class: 'topbar glass', id}, back, h('span', {class: 'tb-title', text: title}), h('span', {class: 'tb-right'}, right));
}
