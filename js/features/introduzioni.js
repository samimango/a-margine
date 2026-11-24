/* Feature «introduzioni»: scheda sobria nella pagina di ogni libro (hook bookCards): sottotitolo, introduzione e righe
   Autore / Periodo / Luoghi / Per chi / Tema / Versetto chiave. La tradizione è dichiarata come tale; le ipotesi degli studiosi
   vengono dopo, in discreto. Dati da data/books.json, caricati una sola volta. */
import {registerFeature} from '../core/features.js';

let booksP = null, cssDone = false;
const load = () => booksP ??= fetch(new URL('../../data/books.json', import.meta.url)).then(r => { if (!r.ok) throw Error('books ' + r.status); return r.json(); }).catch(e => { booksP = null; throw e; });
function ensureCss() {
  if (cssDone) return; cssDone = true;
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = new URL('../../css/f-introduzioni.css', import.meta.url).href; document.head.append(l);
}

registerFeature({
  id: 'introduzioni',
  bookCards: [{id: 'introduzioni', order: 10, render(book, ctx) {
    ensureCss();
    const {h} = ctx.dom;
    const box = h('section', {class: 'f-intro', 'aria-label': 'Introduzione al libro', 'data-book': book});
    load().then(all => {
      const b = all[book];
      if (!b) { box.remove(); return; }
      box.replaceChildren(...build(b, book, ctx));
    }).catch(e => { console.error('introduzioni', e); box.remove(); });
    return box;
  }}],
  onReady() { const idle = window.requestIdleCallback || (f => setTimeout(f, 3000)); setTimeout(() => idle(() => load().catch(() => {}), {timeout: 8000}), 6000); },
});

function build(b, book, ctx) {
  const {h} = ctx.dom, {icon} = ctx.icons;
  const out = [];
  if (b.sottotitolo) out.push(h('p', {class: 'f-intro-sub', text: b.sottotitolo}));
  if (b.intro) out.push(h('p', {class: 'f-intro-text', text: b.intro}));
  const rows = [];
  const row = (label, ...kids) => rows.push(h('div', {class: 'f-intro-row'}, h('span', {class: 'f-intro-k', text: label}), h('div', {class: 'f-intro-v'}, ...kids)));
  const dual = (label, o) => {
    if (!o || !o.tradizione) return;
    if (o.studiosi) row(label, h('p', {class: 'f-intro-trad'}, h('b', {text: 'Tradizione: '}), o.tradizione),
      h('p', {class: 'f-intro-alt', text: 'Altri studiosi: ' + o.studiosi}),
      h('span', {class: 'f-intro-badge'}, icon('info', 13, 2), 'Tradizione · gli studiosi ne discutono'));
    else row(label, h('p', {text: o.tradizione}));
  };
  dual('Autore', b.autore); dual('Periodo', b.periodo);
  if (b.luoghi) row(/\(scrittura\)|\(tradizione\)/.test(b.luoghi) ? 'Scritto a' : 'Luoghi', h('p', {text: b.luoghi}));
  if (b.destinatari) row('Per chi', h('p', {text: b.destinatari}));
  if (b.tema) row('Tema', h('p', {text: b.tema}));
  const p = b.versetto_chiave && ctx.bible.parseRef(b.versetto_chiave.includes(',') ? ctx.bible.names[book] + ' ' + b.versetto_chiave : ctx.bible.names[book] + ' ' + b.versetto_chiave);
  if (p) {
    const label = ctx.bible.abbr[book] + ' ' + p.ch + (p.v1 ? ',' + p.v1 : '');
    row('Versetto chiave', h('button', {class: 'f-intro-key', type: 'button', 'aria-label': 'Apri ' + ctx.bible.names[book] + ' ' + p.ch + ',' + (p.v1 || 1), on: {click: () => ctx.nav.openRef(book, p.ch, p.v1 || 1)}}, label, icon('chev', 14, 2.2)));
  }
  if (rows.length) out.push(h('div', {class: 'card f-intro-card'}, ...rows));
  return out;
}
