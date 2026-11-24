/* Pagina di un libro: copertina grande, sezione, capitoli, schede delle feature (es. introduzione) e «Inizia a leggere» */
import {h, text} from '../core/dom.js';
import {icon} from '../core/icons.js';
import * as router from '../core/router.js';
import * as notes from '../core/notes.js';
import * as features from '../core/features.js';
import {coverSvg} from '../core/covers.js';
import * as chapters from '../core/chapters.js';
import {names, counts, sectionOf, testamentOf, testamentLabel, bookStyle} from '../core/bible.js';
import {openRef} from '../core/nav.js';

let el, body, cta, book = 42;

function render() {
  const st = bookStyle(book), sec = sectionOf(book), [pb, pc, pv] = notes.pos(), read = notes.readMap();
  body.replaceChildren();
  el.style.setProperty('--bk', st.c1); el.style.setProperty('--bk-ac', st.ac);
  const bg = h('div', {class: 'libro-bg'}); bg.innerHTML = coverSvg(book, {w: 390, h: 340, hero: true, r: 0, symx: 300, symy: 120, syms: 300});
  const hero = h('div', {class: 'libro-hero'}, bg, h('div', {class: 'libro-fade'}),
    h('button', {class: 'roundbtn onhero', id: 'libroBack', type: 'button', 'aria-label': 'Indietro', on: {click: () => router.back('libreria')}}, icon('back', 20, 2)),
    h('div', {class: 'libro-title'}, text('div', testamentLabel(testamentOf(book)) + ' · ' + sec.label, 'eyebrow'), h('h1', {text: names[book]}),
      h('p', {class: 'libro-sub', text: counts[book] + (counts[book] === 1 ? ' capitolo' : ' capitoli')})));
  const extra = features.bookCards(book).map(c => h('div', {class: 'book-card', dataset: {feature: c.id}}, c.node));
  const content = h('div', {class: 'col libro-content'}, ...extra);
  if (counts[book] > 1) {
    const grid = h('div', {class: 'grid', id: 'chapters'});
    for (let i = 1; i <= counts[book]; i++) {
      const b = h('button', {type: 'button', class: read[book + '.' + i] ? 'done' : '', text: String(i), 'aria-label': 'Capitolo ' + i + (read[book + '.' + i] ? ', letto' : ''), on: {click: () => { chapters.warm(book, i); openRef(book, i, 1); }}});
      if (pb === book && i === pc) b.setAttribute('aria-current', 'true');
      grid.append(b);
    }
    content.append(text('h2', 'Capitoli', 'sec'), grid);
  }
  body.append(hero, content);
  const reading = pb === book;
  const ch = reading ? pc : 1;
  cta.replaceChildren(icon('book', 18, 2), reading ? 'Continua · capitolo ' + pc + ',' + pv : 'Inizia a leggere' + (counts[book] > 1 ? ' · capitolo 1' : ''));
  cta.onclick = () => { chapters.warm(book, ch); openRef(book, ch, reading ? pv : 1); };
  chapters.warm(book, ch);   // il capitolo di «Continua» (o il primo) parte a scaldarsi appena si apre la pagina
}

export default {
  id: 'libro', tab: 'libreria', title: 'Libro', tabbar: false,
  build(root) {
    el = root; body = h('div', {class: 'libro-body'});
    cta = h('button', {class: 'cta', id: 'libroCta', type: 'button'});
    root.append(body, h('div', {class: 'cta-dock'}, cta));
  },
  show(params) { if (Number.isInteger(params.book)) book = params.book; render(); },
};
