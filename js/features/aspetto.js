/* Aspetto della lettura, parte «Nel testo»: interruttori salvati in localStorage (margine.parole.*).
   Sottolinea misure (sì) / luoghi (no) / personaggi (no) governano la feature «parole»; numeri dei versetti e intestazione del capitolo agiscono con una classe su <html>. */
import {registerFeature} from '../core/features.js';

const ROWS = [
  {id: 'numeri', key: 'margine.parole.numeri', def: true, label: 'Numeri dei versetti'},
  {id: 'titoletto', key: 'margine.parole.titoletto', def: true, label: 'Intestazione del capitolo'},
  {id: 'misure', key: 'margine.parole.misure', def: true, label: 'Sottolinea misure', sample: 'talento', tone: 'misura'},
  {id: 'luoghi', key: 'margine.parole.luoghi', def: false, label: 'Sottolinea luoghi', sample: 'Betania', tone: 'luogo'},
  {id: 'personaggi', key: 'margine.parole.personaggi', def: false, label: 'Sottolinea personaggi', sample: 'Abramo', tone: 'persona'},
];
const read = (store, r) => { const v = store.get(r.key); return v === null ? r.def : v === '1'; };

function applyClasses(store) {
  const root = document.documentElement;
  root.classList.toggle('f-aspetto-no-num', !read(store, ROWS[0]));
  root.classList.toggle('f-aspetto-no-head', !read(store, ROWS[1]));
}

const CSS = `
html.f-aspetto-no-num .verse sup { display: none; }
html.f-aspetto-no-head .chap-head .chap-book, html.f-aspetto-no-head .chap-head .chap-num, html.f-aspetto-no-head .chap-head .chap-fleuron { display: none; }
.f-aspetto { margin-top: 4px; }
.f-aspetto .eyebrow { display: block; margin-bottom: 8px; }
.f-aspetto-rows { background: var(--card); border-radius: var(--r-md); box-shadow: var(--shadow-card); overflow: hidden; }
.f-aspetto-row { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 48px; padding: 0 16px; text-align: left; }
.f-aspetto-row + .f-aspetto-row { border-top: 1px solid var(--line); }
.f-aspetto-label { flex: none; font: 500 15px var(--sans); }
.f-aspetto-sample { --tone: var(--dim); flex: 1; min-width: 0; font: 400 13.5px var(--serif-read); text-decoration: underline dotted; text-underline-offset: .24em; text-decoration-color: color-mix(in srgb, var(--tone) 70%, transparent); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-decoration-thickness: 1.4px; }
.f-aspetto-spacer { flex: 1; }
.f-aspetto-sample.misura { --tone: var(--d1); } .f-aspetto-sample.luogo { --tone: var(--accent); } .f-aspetto-sample.persona { --tone: var(--d2); }
.f-aspetto-sw { position: relative; flex: none; width: 51px; height: 31px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--dim) 38%, transparent); transition: background-color .2s; margin-left: auto; }
.f-aspetto-sw::before { content: ''; position: absolute; left: 2px; top: 2px; width: 27px; height: 27px; border-radius: 50%; background: var(--card); box-shadow: 0 0 0 .6px var(--line), 0 2px 4px color-mix(in srgb, var(--ink) 25%, transparent); transition: transform .22s cubic-bezier(.3, 1.4, .5, 1); }
.f-aspetto-sw::after { content: ''; position: absolute; inset: -8px -4px; }
.f-aspetto-row[aria-checked="true"] .f-aspetto-sw { background: var(--accent); }
.f-aspetto-row[aria-checked="true"] .f-aspetto-sw::before { transform: translateX(20px); }
.f-aspetto-row:focus-visible { outline-offset: -2px; }
`;
function ensureStyle() { if (!document.getElementById('f-aspetto-css')) { const s = document.createElement('style'); s.id = 'f-aspetto-css'; s.textContent = CSS; document.head.append(s); } }

registerFeature({
  id: 'aspetto',
  onReady(ctx) { ensureStyle(); applyClasses(ctx.store); },
  readerSettings: [{
    id: 'aspetto', order: 20,
    render(box, ctx) {
      ensureStyle();
      const {h} = ctx.dom, {store, bus} = ctx;
      const rows = h('div', {class: 'f-aspetto-rows'});
      for (const r of ROWS) {
        const labelId = 'f-aspetto-l-' + r.id;
        const row = h('button', {type: 'button', role: 'switch', class: 'f-aspetto-row', 'aria-checked': String(read(store, r)), 'aria-labelledby': labelId, dataset: {key: r.id},
          on: {click: () => {
            const on = row.getAttribute('aria-checked') !== 'true';
            store.set(r.key, on ? '1' : '0'); row.setAttribute('aria-checked', String(on));
            applyClasses(store);
            if (r.sample) bus.emit('parole:settings', {id: r.id, on});    // la feature «parole» ridisegna il testo
          }}},
          h('span', {class: 'f-aspetto-label', id: labelId, text: r.label}),
          r.sample ? h('span', {class: 'f-aspetto-sample ' + r.tone, 'aria-hidden': 'true', text: r.sample}) : h('span', {class: 'f-aspetto-spacer'}),
          h('span', {class: 'f-aspetto-sw', 'aria-hidden': 'true'}));
        rows.append(row);
      }
      box.append(h('div', {class: 'f-aspetto'}, h('span', {class: 'eyebrow', text: 'Nel testo'}), rows));
    },
  }],
});
ensureStyle();
