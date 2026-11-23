/* Comandi dell'aspetto (dimensione, interlinea, tema): usati dal foglio «Aspetto della lettura» e dalle Impostazioni */
import {h, text} from '../core/dom.js';
import * as theme from '../core/theme.js';
import {segmented} from './seg.js';

export function appearanceControls(box) {
  const sizeBox = h('div', {id: 'sizeSeg'}), leadBox = h('div', {id: 'leadSeg'}), themeBox = h('div', {class: 'theme-tiles', id: 'themeTiles'});
  const draw = () => {
    segmented(sizeBox, theme.sizeNames.map((label, i) => ({value: i, label})), theme.getSize(), i => { theme.setSize(i); draw(); }, 'Dimensione del testo');
    segmented(leadBox, [2, 0, 1].map(i => ({value: i, label: theme.leadNames[i]})), theme.getLead(), i => { theme.setLead(i); draw(); }, 'Interlinea');
    themeBox.replaceChildren(...theme.THEMES.map(t => h('button', {type: 'button', class: 'tile ' + t, 'aria-pressed': String(theme.currentTheme() === t), dataset: {theme: t}, on: {click: () => { theme.setTheme(t); draw(); }}},
      h('span', {class: 'tile-sw'}, h('b', {text: 'Aa'})), h('small', {text: theme.themeNames[t]}))));
  };
  draw();
  box.append(h('div', {class: 'typo-row'}, text('span', 'Dimensione', 'eyebrow'), sizeBox), h('div', {class: 'typo-row'}, text('span', 'Interlinea', 'eyebrow'), leadBox), h('div', {class: 'typo-row'}, text('span', 'Tema', 'eyebrow'), themeBox));
}
