/* Progressi: schermata di statistiche calcolate dai dati locali del nucleo (margine.days, margine.read, note e colori).
   Raggiungibile dalle cifre in Oggi (le rende tappabili il nucleo se la schermata esiste) e da Impostazioni › Studio. Nessun dato nuovo salvato. */
import {registerFeature, ctx} from '../core/features.js';

const {store, notes, dom, icons, router, bible, bus} = ctx;
const {h, text, isoDay} = dom;
const {icon} = icons;
{
  const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = new URL('../../css/f-progressi.css', import.meta.url).href;
  document.head.append(link);
}
const TOTAL = bible.counts.reduce((a, b) => a + b, 0);       // 1189
const DAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'], DAY_NAMES = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'];
const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);

/* ---- calcoli (esportati per i test) ---- */
export function bestStreak(days) {
  const set = [...new Set(days)].sort(); let best = 0, run = 0, prev = null;
  for (const d of set) {
    const [y, m, dd] = d.split('-').map(Number), t = Date.UTC(y, m - 1, dd);
    run = prev !== null && t - prev === 86400000 ? run + 1 : 1; prev = t; best = Math.max(best, run);
  }
  return best;
}
export function weekDays(now = new Date()) {
  const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  return Array.from({length: 7}, (_, i) => isoDay(new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i)));
}
export function compute() {
  const days = store.getJson('margine.days', [], 'array').filter(d => typeof d === 'string');
  const read = notes.readMap(), perBook = new Array(bible.counts.length).fill(0);
  for (const k of Object.keys(read)) { const [b, c] = k.split('.').map(Number); if (b >= 0 && b < perBook.length && c >= 1 && c <= bible.counts[b]) perBook[b]++; }
  const chaptersRead = perBook.reduce((a, b) => a + b, 0);
  const finished = perBook.map((n, b) => n === bible.counts[b] ? b : -1).filter(b => b >= 0);
  let highlights = 0;
  for (const id of notes.annotated()) { if (notes.record(id).color == null || id.startsWith('free.')) continue; const [f, t] = bible.bounds(id); highlights += Number.isFinite(f) ? Math.max(1, (Number.isFinite(t) ? t : f) - f + 1) : 1; }
  const started = perBook.map((n, b) => ({b, n, total: bible.counts[b]})).filter(x => x.n > 0).sort((a, z) => z.n / z.total - a.n / a.total || z.n - a.n || a.b - z.b);
  return {days, week: weekDays(), streak: notes.streak(), best: Math.max(bestStreak(days), notes.streak()), chaptersRead, pct: chaptersRead / TOTAL, finished, started, meditations: notes.noteIds().length, highlights, totalDays: new Set(days).size};
}

/* ---- interfaccia ---- */
let el, body;
function ring(pct, label) {
  const r = 52, c = 2 * Math.PI * r, p = Math.min(1, pct);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 128 128'); svg.setAttribute('class', 'f-progressi-ring'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', label);
  const mk = (cls, extra) => { const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('cx', '64'); c.setAttribute('cy', '64'); c.setAttribute('r', String(r)); c.setAttribute('class', cls); for (const [k, v] of Object.entries(extra || {})) c.setAttribute(k, v); return c; };
  svg.append(mk('trk'), mk('val', {'stroke-dasharray': (c * p).toFixed(1) + ' ' + c.toFixed(1), transform: 'rotate(-90 64 64)'}));
  return svg;
}
function render() {
  if (!el) return;
  const d = compute(), today = isoDay();
  body.replaceChildren();
  const pctTxt = d.pct === 0 ? '0%' : d.pct < 0.01 ? '<1%' : Math.round(d.pct * 100) + '%';
  const set = new Set(d.days);
  body.append(
    h('section', {class: 'card f-progressi-card f-progressi-bible'}, ring(d.pct, 'Bibbia letta: ' + pctTxt),
      h('div', {class: 'f-progressi-ringtxt'}, h('b', {id: 'progPct', text: pctTxt}), h('small', {text: 'della Bibbia'})),
      h('div', {class: 'f-progressi-bible-t'}, text('span', 'Bibbia letta', 'eyebrow'), h('b', {id: 'progCh', text: plural(d.chaptersRead, 'capitolo', 'capitoli') + ' su ' + TOTAL}),
        h('small', {text: d.finished.length ? plural(d.finished.length, 'libro completato', 'libri completati') : 'Nessun libro completato per ora'}))),
    h('section', {class: 'card f-progressi-card'}, text('h2', 'Questa settimana', 'f-progressi-h'),
      h('div', {class: 'f-progressi-week', id: 'progWeek', role: 'list'}, ...d.week.map((day, i) => h('div', {class: 'f-progressi-day' + (set.has(day) ? ' on' : '') + (day === today ? ' today' : ''), role: 'listitem', 'aria-label': DAY_NAMES[i] + (set.has(day) ? ': letto' : ': non letto') + (day === today ? ' (oggi)' : ''), dataset: {day}},
        h('i', {}, set.has(day) ? icon('check', 14, 2.6) : null), h('span', {text: DAYS[i], 'aria-hidden': 'true'}))))),
    h('div', {class: 'f-progressi-two'},
      h('div', {class: 'card f-progressi-stat', id: 'progStreak'}, h('span', {class: 'f-progressi-ico flame'}, icon('flame', 16, 2)), h('b', {text: String(d.streak)}), h('small', {text: d.streak === 1 ? 'giorno di fila' : 'giorni di fila'})),
      h('div', {class: 'card f-progressi-stat', id: 'progBest'}, h('span', {class: 'f-progressi-ico'}, icon('check', 16, 2)), h('b', {text: String(d.best)}), h('small', {text: 'record di fila'}))),
    h('div', {class: 'f-progressi-two'},
      h('div', {class: 'card f-progressi-stat', id: 'progMed'}, h('span', {class: 'f-progressi-ico'}, icon('pen', 16, 2)), h('b', {text: String(d.meditations)}), h('small', {text: d.meditations === 1 ? 'meditazione' : 'meditazioni'})),
      h('div', {class: 'card f-progressi-stat', id: 'progHl'}, h('span', {class: 'f-progressi-ico'}, icon('text', 16, 2)), h('b', {text: String(d.highlights)}), h('small', {text: d.highlights === 1 ? 'versetto evidenziato' : 'versetti evidenziati'}))));
  if (d.finished.length) body.append(text('h2', 'Libri completati', 'sec'), h('div', {class: 'f-progressi-chips', id: 'progDone'}, ...d.finished.map(b => h('span', {class: 'f-progressi-chip', style: {'--bk': bible.bookStyle(b).c1}, text: bible.names[b]}))));
  body.append(text('h2', 'Per libro', 'sec'));
  if (!d.started.length) body.append(text('p', 'Quando leggerai un capitolo fino in fondo, il libro comparirà qui.', 'empty'));
  else body.append(h('div', {class: 'card f-progressi-books', id: 'progBooks'}, ...d.started.map(x => h('button', {class: 'f-progressi-book', type: 'button', dataset: {book: x.b}, 'aria-label': bible.names[x.b] + ': ' + x.n + ' capitoli su ' + x.total, on: {click: () => ctx.nav.openBook(x.b)}},
    h('span', {class: 'f-progressi-bn', text: bible.names[x.b]}), h('span', {class: 'f-progressi-bar', 'aria-hidden': 'true'}, h('i', {style: {width: Math.max(3, Math.round(x.n / x.total * 100)) + '%', background: bible.bookStyle(x.b).c1}})), h('span', {class: 'f-progressi-bc', text: x.n + '/' + x.total})))));
  body.append(text('p', 'Un capitolo conta come letto quando arrivi in fondo. I dati restano su questo dispositivo.', 'hint'));
}

registerFeature({
  id: 'progressi',
  screens: [{
    id: 'progressi', title: 'Progressi', tab: 'oggi',
    build(root) {
      el = root; body = h('div', {class: 'col f-progressi-col'});
      root.append(ctx.dom.h('header', {class: 'topbar glass'}, h('button', {class: 'tb-back', type: 'button', 'aria-label': 'Indietro', on: {click: () => router.back(router.previousId() && router.previousId() !== 'progressi' ? router.previousId() : 'oggi')}}, icon('back', 20, 2)), h('span', {class: 'tb-title', text: 'Progressi'}), h('span', {class: 'tb-right'})), body);
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && router.currentId() === 'progressi' && !ctx.ui.sheetOpen()) { e.preventDefault(); root.querySelector('.tb-back').click(); } });
      bus.on('notes:changed', () => { if (!el.hidden) render(); });
    },
    show() { render(); },
  }],
  settings: [{id: 'progressi', section: 'Studio', order: 20, label: 'Progressi', icon: 'flame',
    value: () => { const n = Object.keys(notes.readMap()).length; return plural(n, 'capitolo letto', 'capitoli letti') + ' · ' + notes.streak() + ' di fila'; },
    onTap: () => router.go('progressi')}],
});
