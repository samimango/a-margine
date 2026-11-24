/* Collega il tuo Google: indirizzo del Web App + chiave, salvati su questo dispositivo. Anche con un link «#setup=…». */
import {h, text, noAutofill} from '../core/dom.js';
import {icon} from '../core/icons.js';
import * as router from '../core/router.js';
import * as api from '../core/api.js';
import * as ui from '../core/ui.js';
import {topbar} from '../components/topbar.js';
import {on} from '../core/bus.js';

let el, D = {};

function fillState() {
  const mode = api.mode(), cfg = api.config();
  D.state.textContent = mode === 'cloud' ? 'Questa pagina è ospitata da Google Apps Script: la sincronizzazione è già attiva.'
    : mode === 'remote' ? 'Collegato. Le tue note si sincronizzano con il tuo account Google.' : 'Non collegato. Le tue note restano solo su questo dispositivo.';
  D.url.value = cfg?.url || ''; D.key.value = cfg ? cfg.key : '';
  D.disconnect.hidden = !cfg; D.copyLink.hidden = !cfg;
  D.msg.textContent = '';
}
async function connect(e) {
  e.preventDefault();
  D.msg.textContent = 'Controllo il collegamento…';
  try { await api.checkConfig(D.url.value, D.key.value); }
  catch (err) {
    D.msg.textContent = api.isAuthError(err) ? 'La chiave non è accettata. Controlla di averla copiata per intero.'
      : /Web App di Google|chiave non è valida/.test(err.message) ? err.message : 'Non riesco a raggiungere il Web App. Controlla l’indirizzo e che sia pubblicato per «Chiunque».';
    return;
  }
  try { api.setConfig(D.url.value, D.key.value); } catch (err) { D.msg.textContent = err.message; return; }
  fillState(); ui.toast('Collegato a Google');
}
async function copyLink() {
  const link = api.setupLink();
  try { await navigator.clipboard.writeText(link); ui.toast('Link copiato'); } catch { D.link.hidden = false; D.link.value = link; D.link.select(); }
}

export default {
  id: 'collega', tab: 'oggi', title: 'Collega il tuo Google',
  build(root) {
    el = root;
    D.state = h('p', {class: 'hint', id: 'connState', role: 'status'});
    D.url = h('input', {id: 'cfgUrl', type: 'url', inputmode: 'url', autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false', placeholder: 'https://script.google.com/macros/s/…/exec', required: true}); noAutofill(D.url, 'collegamento-link');
    D.key = h('input', {id: 'cfgKey', type: 'password', autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false', placeholder: 'La chiave scritta nei log', required: true}); noAutofill(D.key, 'collegamento-chiave');
    D.msg = h('p', {class: 'hint', id: 'connMsg', role: 'status'});
    D.disconnect = h('button', {class: 'btn', id: 'cfgOff', type: 'button', text: 'Scollega', on: {click: () => { api.clearConfig(); fillState(); ui.toast('Scollegato. Le note restano su questo dispositivo.'); }}});
    D.copyLink = h('button', {class: 'btn', id: 'cfgCopy', type: 'button', text: 'Copia il link di configurazione', on: {click: copyLink}});
    D.link = h('input', {class: 'linkbox', readonly: true, hidden: true, 'aria-label': 'Link di configurazione'});
    const form = h('form', {id: 'cfgForm', class: 'cfg', autocomplete: 'off', on: {submit: connect}},
      h('label', {}, h('span', {text: 'Indirizzo del Web App'}), D.url), h('label', {}, h('span', {text: 'Chiave'}), D.key),
      h('div', {class: 'cf-btns'}, h('button', {class: 'btn primary', type: 'submit', text: 'Salva e controlla'}), D.disconnect), D.msg);
    root.append(topbar({title: 'Collega il tuo Google', backTo: 'impostazioni'}),
      h('div', {class: 'col'}, D.state,
        text('p', 'Le tue meditazioni, i colori e i segnalibri vengono salvati nel tuo account Google, così li ritrovi su ogni dispositivo. Servono due cose: l’indirizzo del tuo Web App e la chiave segreta generata da «setupKey» in Apps Script. Le istruzioni sono nel README.', 'lead'),
        form, h('div', {class: 'cf-btns'}, D.copyLink), D.link,
        text('p', 'Puoi anche aprire un link di configurazione che finisce con #setup=indirizzo|chiave: l’app lo salva e poi lo toglie dalla barra degli indirizzi.', 'hint')));
    on('config:changed', () => { if (!el.hidden) fillState(); });
  },
  show() { fillState(); },
};
