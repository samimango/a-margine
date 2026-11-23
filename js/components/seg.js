/* Controllo a segmenti. segmented(box, [{value,label}], valoreAttuale, scegli) ridisegna il contenuto di box. */
import {h} from '../core/dom.js';
export function segmented(box, items, current, pick, label) {
  box.classList.add('seg'); box.setAttribute('role', 'group'); if (label) box.setAttribute('aria-label', label);
  box.replaceChildren(...items.map(it => h('button', {type: 'button', dataset: {t: it.value}, 'aria-pressed': String(it.value === current), on: {click: () => pick(it.value)}}, it.label)));
}
