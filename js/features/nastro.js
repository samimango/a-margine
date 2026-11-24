/* Segnalibro a nastro: quando si aggiunge un segnalibro il nastro (e il segnetto sul versetto) scende con un lieve rimbalzo.
   Il nucleo disegna già i nastri; qui si ascolta l'evento notes:changed e si anima l'elemento nuovo. */
import {registerFeature} from '../core/features.js';

let known = new Set();
const keyOf = m => m[0] + '.' + m[1] + '.' + m[2];
const snapshot = ctx => new Set(ctx.notes.bookmarks().map(keyOf));

function bounce(el, px, ms) {
  if (!el?.animate) return;
  el.animate([
    {transform: `translateY(-${px}px)`, opacity: 0, offset: 0, easing: 'cubic-bezier(.3, 0, .6, 1)'},
    {transform: `translateY(${px * .1}px)`, opacity: 1, offset: .55, easing: 'ease-out'},
    {transform: `translateY(-${px * .05}px)`, offset: .78, easing: 'ease-in-out'},
    {transform: 'none', opacity: 1, offset: 1},
  ], {duration: ms});
}

registerFeature({
  id: 'nastro',
  onReady(ctx) {
    known = snapshot(ctx);
    ctx.bus.on('data:changed', () => { known = snapshot(ctx); });      // arrivi dalla sincronizzazione: nessuna animazione
    ctx.bus.on('notes:changed', () => {
      const now = snapshot(ctx), fresh = ctx.notes.bookmarks().filter(m => !known.has(keyOf(m)));
      known = now;
      if (!fresh.length || ctx.dom.reduceMotion()) return;
      const [b, c] = ctx.notes.pos();
      const here = fresh.filter(m => m[0] === b && m[1] === c);
      if (!here.length) return;
      /* il lettore si ridisegna nello stesso evento: si anima dopo, sugli elementi appena creati */
      setTimeout(() => {
        bounce(document.querySelector('.chap-ribbon'), 56, 620);
        for (const m of here) bounce(document.querySelector('#v' + m[2] + ' .rib'), 14, 520);
      }, 0);
    });
  },
});
