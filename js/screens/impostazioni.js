/* Impostazioni: aspetto, nomi dei colori, collegamento a Google + voci registrate dalle feature (per sezione) */
import {h, text} from '../core/dom.js';
import {icon} from '../core/icons.js';
import * as router from '../core/router.js';
import * as notes from '../core/notes.js';
import * as sync from '../core/sync.js';
import * as api from '../core/api.js';
import * as features from '../core/features.js';
import * as ui from '../core/ui.js';
import {names, colorNames} from '../core/bible.js';
import {on} from '../core/bus.js';
import {topbar} from '../components/topbar.js';
import {appearanceControls} from '../components/appearance.js';
import {liveConflicts} from '../components/conflicts.js';

let el, body;

function colorsSheet() {
  ui.sheet({title: 'I miei colori', build(box, sh) {
    const form = h('form', {class: 'colors-form', id: 'colorsForm'});
    const inputs = notes.labels().map((value, i) => {
      const input = h('input', {value, required: true, maxlength: '40', 'aria-label': colorNames[i]});
      form.append(h('label', {}, h('i', {class: 'dot', style: {'--dot': 'var(--d' + (i + 1) + ')'}}), h('span', {text: colorNames[i]}), input));
      return input;
    });
    form.append(h('button', {class: 'btn primary', type: 'submit', text: 'Salva'}));
    form.addEventListener('submit', e => { e.preventDefault(); const values = inputs.map(x => x.value.trim()); if (values.some(x => !x)) return; notes.setLabels(values); sh.close(); });
    box.append(form);
  }});
}
function row({label, value, icon: ic, onTap, href, render}) {
  if (render) { const r = h('div', {class: 'row custom'}); render(r, features.ctx); return r; }
  const kids = [ic ? h('span', {class: 'row-ic'}, icon(ic, 18, 1.8)) : null, h('span', {class: 'row-main'}, h('b', {text: label}), value ? h('small', {text: value}) : null), href ? icon('ext', 16, 2) : icon('chev', 16, 2.2)];
  return href ? h('a', {class: 'row', href, target: '_blank', rel: 'noopener noreferrer'}, ...kids) : h('button', {class: 'row', type: 'button', on: {click: () => { try { onTap?.(features.ctx); } catch (e) { console.error(e); } }}}, ...kids);
}
function render() {
  if (!el) return;
  body.replaceChildren();
  const [b, c, v] = notes.pos();
  const mode = api.mode();
  const sections = new Map();
  const add = (section, item) => { if (!sections.has(section)) sections.set(section, []); sections.get(section).push(item); };
  add('Colori', {id: 'colors', label: 'Nomi dei colori', value: notes.labels().join(' · '), onTap: colorsSheet, icon: 'pen'});
  add('Sincronizzazione', {id: 'google', label: 'Collega il tuo Google', value: mode === 'local' ? 'Non collegato · le note restano su questo dispositivo' : (sync.statusText() || 'Collegato'), onTap: () => router.go('collega'), icon: 'cloud'});
  for (const it of features.settingsItems()) add(it.section || 'Altro', {...it, label: it.label, value: typeof it.value === 'function' ? it.value(features.ctx) : it.value});
  add('Altro', {id: 'source', label: 'Apri su LaParola.net', href: 'https://www.laparola.net/testo.php?' + new URLSearchParams({riferimento: names[b] + ' ' + c + ':' + v, 'versioni[]': 'Riveduta 2020'}), icon: 'ext'});
  const order = ['Aspetto', 'Colori', 'Sincronizzazione', 'Dati'];
  const keys = [...sections.keys()].sort((a, z) => { const ia = order.indexOf(a), iz = order.indexOf(z); return (ia < 0 ? 50 : ia) - (iz < 0 ? 50 : iz) || (a === 'Altro') - (z === 'Altro') || a.localeCompare(z, 'it'); });
  const appear = h('div', {class: 'appearance'}); appearanceControls(appear);
  body.append(text('h2', 'Aspetto', 'sec'), appear);
  for (const k of keys) body.append(text('h2', k, 'sec'), h('div', {class: 'rows', dataset: {section: k}}, ...sections.get(k).map(row)));
  const conflicts = h('div', {class: 'conflicts', hidden: true}); liveConflicts(conflicts);
  body.append(conflicts);
}

export default {
  id: 'impostazioni', tab: 'oggi', title: 'Impostazioni',
  build(root) {
    el = root; body = h('div', {class: 'col settings'});
    root.append(topbar({title: 'Impostazioni', backTo: 'oggi'}), body);
    for (const evt of ['sync:state', 'config:changed', 'data:changed']) on(evt, () => { if (!el.hidden) render(); });
  },
  show() { render(); },
};
