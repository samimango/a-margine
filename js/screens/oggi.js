/* Oggi: Riprendi, statistiche semplici, schede delle feature, letti di recente, segnalibri, ultima meditazione */
import {h, text, shortText} from '../core/dom.js';
import {icon} from '../core/icons.js';
import * as router from '../core/router.js';
import * as notes from '../core/notes.js';
import * as sync from '../core/sync.js';
import * as api from '../core/api.js';
import * as features from '../core/features.js';
import {cover, coverSvg} from '../core/covers.js';
import {names, counts, bmRef, ref, sectionOf, bookStyle} from '../core/bible.js';
import * as chapters from '../core/chapters.js';
import {openRef, openNote} from '../core/nav.js';
import {on} from '../core/bus.js';
import {liveConflicts, renderConflicts} from '../components/conflicts.js';

let el, parts = {};

function dateEyebrow() {
  const s = new Date().toLocaleDateString('it-IT', {weekday: 'long', day: 'numeric', month: 'long'});
  return s.charAt(0).toUpperCase() + s.slice(1);
}
const greeting = () => { const hr = new Date().getHours(); return hr < 12 ? 'Buongiorno' : hr < 18 ? 'Buon pomeriggio' : 'Buonasera'; };

function row(label, onclick, sub) {
  return h('button', {class: 'row', type: 'button', on: {click: onclick}}, h('span', {class: 'row-main'}, h('b', {text: label}), sub ? h('small', {text: sub}) : null), icon('chev', 16, 2.2));
}

function renderHero() {
  const [b, c, v] = notes.pos(), st = bookStyle(b);
  const box = parts.hero; box.replaceChildren();
  box.style.setProperty('--bk', st.c1); box.style.setProperty('--bk-ac', st.ac);
  const bg = h('div', {class: 'hero-bg'}); bg.innerHTML = coverSvg(b, {w: 358, h: 246, hero: true, r: 0, symx: 290, symy: 96, syms: 250});
  const qText = chapters.textOf(b + '.' + c + '.' + v);
  const quote = h('p', {class: 'hero-quote', text: qText ? '«' + shortText(qText, 150) + '»' : '', hidden: !qText});
  const sub = h('div', {class: 'hero-sub', text: 'Versetto ' + v});
  const bar = h('i'); const progress = h('div', {class: 'hero-progress', 'aria-hidden': 'true'}, bar);
  const actions = h('div', {class: 'hero-btns'},
    h('button', {class: 'pill primary', id: 'resGo', type: 'button', on: {click: () => openRef(b, c, v)}}, icon('book', 17, 2), 'Continua'),
    ...features.heroActions().map(a => h('button', {class: 'pill glass-btn', type: 'button', dataset: {heroAction: a.id}, on: {click: () => a.run(features.ctx)}}, a.icon ? icon(a.icon, 17, 2) : null, a.label)));
  box.append(bg, h('div', {class: 'hero-shade'}),
    h('div', {class: 'hero-top'}, h('span', {class: 'hero-cover'}, cover(b, {w: 78, h: 110, r: 5, tsize: 7})),
      h('div', {class: 'hero-head'}, text('div', 'Riprendi da qui', 'eyebrow'), h('div', {class: 'hero-title', id: 'resRef', text: names[b] + ' ' + c}), sub)),
    quote, actions, progress);
  const fill = map => {
    if (!map || !box.isConnected) return;
    const n = chapters.verseLimitOf(map);
    if (n) { sub.textContent = 'Versetto ' + v + ' di ' + n; bar.style.width = Math.min(100, Math.round(v / n * 100)) + '%'; }
    const t = map[b + '.' + c + '.' + v];
    if (t && !quote.textContent) { quote.textContent = '«' + shortText(t, 150) + '»'; quote.hidden = false; }
  };
  chapters.cached(b, c).then(fill);
}

function renderStats() {
  const s = notes.stats(), box = parts.stats; box.replaceChildren();
  /* le cifre aprono «Progressi» se la schermata esiste (arriva da una feature) */
  const tap = router.hasScreen('progressi');
  const card = (n, label, ic, color) => h(tap ? 'button' : 'div', tap ? {class: 'card stat tap', type: 'button', style: {'--sc': color}, 'aria-label': n + ' ' + label + '. Apri Progressi', on: {click: () => router.go('progressi')}} : {class: 'card stat', style: {'--sc': color}}, h('div', {class: 'stat-ic'}, icon(ic, 15, 2)), h('div', {class: 'stat-n', text: String(n)}), h('div', {class: 'stat-l', text: label}));
  box.append(card(s.streak, s.streak === 1 ? 'giorno di fila' : 'giorni di fila', 'flame', 'var(--terra)'), card(s.chapters, s.chapters === 1 ? 'capitolo letto' : 'capitoli letti', 'book', 'var(--sage)'), card(s.books, s.books === 1 ? 'libro finito' : 'libri finiti', 'bookmark', 'var(--ochre)'));
}

function renderCards() {
  parts.cards.replaceChildren(...features.homeCards().map(c => h('div', {class: 'home-card', dataset: {feature: c.id}}, c.node)));
}

function renderRecents() {
  const list = notes.recents(), box = parts.recent; box.replaceChildren();
  parts.recentBox.hidden = !list.length;
  const read = notes.readMap();
  for (const [bk, ch] of list) {
    const done = Boolean(read[bk + '.' + ch]);
    box.append(h('button', {class: 'card recent', type: 'button', on: {click: () => openRef(bk, ch, 1)}},
      cover(bk, {w: 40, h: 56, r: 3, title: false}),
      h('div', {class: 'recent-body'}, h('b', {text: counts[bk] === 1 ? names[bk] : names[bk] + ' ' + ch}), h('small', {text: done ? 'letto' : 'aperto di recente'}),
        h('div', {class: 'mini-progress'}, h('i', {style: {width: done ? '100%' : '0%', background: bookStyle(bk).c1}})))));
  }
}

function renderBookmarks() {
  const box = parts.bm; box.replaceChildren();
  const list = notes.bookmarks().slice(0, 4);
  if (!list.length) { box.append(text('p', 'Nessun segnalibro. Toccando un versetto puoi aggiungerne uno.', 'empty')); return; }
  for (const m of list) { const t = chapters.textOf(m.slice(0, 3).join('.')); box.append(row(bmRef(m), () => openRef(m[0], m[1], m[2]), t ? shortText(t, 70) : '')); }
}

function renderLastMed() {
  const last = notes.lastMedId(), box = parts.med; box.replaceChildren();
  if (last && notes.record(last).note) {
    box.append(h('button', {class: 'card med', type: 'button', on: {click: () => openNote(last, 'oggi')}}, text('small', ref(last), 'eyebrow'), h('p', {text: shortText(notes.record(last).note, 180)})));
  } else box.append(text('p', 'Ancora nessuna meditazione.', 'empty'));
}

function renderHint() {
  const mode = api.mode();
  parts.hint.textContent = mode === 'local'
    ? 'Le tue note restano su questo dispositivo. Per averle ovunque, collega il tuo Google dalle impostazioni.'
    : (sync.statusText() || 'Collegato al tuo Google');
  parts.hint.classList.toggle('subtle', mode === 'local');
}

export function render() {
  if (!el || el.hidden) return;
  parts.greet.textContent = greeting(); parts.date.textContent = dateEyebrow();
  renderHero(); renderStats(); renderCards(); renderRecents(); renderBookmarks(); renderLastMed(); renderHint(); renderConflicts(parts.conflicts);
}

export default {
  id: 'oggi', tab: 'oggi', title: 'Oggi',
  build(root) {
    el = root;
    parts = {
      date: text('div', '', 'eyebrow'), greet: h('h1', {class: 'big', id: 'greet'}),
      hero: h('div', {class: 'hero', id: 'hero'}), stats: h('div', {class: 'stats'}), cards: h('div', {class: 'home-cards'}),
      recent: h('div', {class: 'recents'}), bm: h('div', {class: 'rows'}), med: h('div'),
      hint: h('p', {class: 'hint', id: 'syncState', role: 'status'}), conflicts: h('div', {class: 'conflicts', id: 'conflicts', hidden: true}),
    };
    parts.recentBox = h('div', {hidden: true}, text('h2', 'Letti di recente', 'sec'), parts.recent);
    root.append(h('div', {class: 'col'},
      h('div', {class: 'oggi-head'}, h('div', {}, parts.date, parts.greet),
        h('button', {class: 'avatar', id: 'settingsBtn', type: 'button', 'aria-label': 'Impostazioni', on: {click: () => router.go('impostazioni')}}, icon('person', 20, 1.7))),
      parts.hero, parts.stats, parts.cards, parts.recentBox,
      text('h2', 'Segnalibri', 'sec'), parts.bm, text('h2', 'Ultima meditazione', 'sec'), parts.med, parts.hint, parts.conflicts));
    liveConflicts(parts.conflicts);
    /* aggiornamenti mirati: ridisegnare la card «Riprendi» mentre ci si tocca farebbe perdere il tocco */
    const live = fn => () => { if (el && !el.hidden) fn(); };
    on('sync:state', live(renderHint)); on('config:changed', live(renderHint));
    for (const evt of ['notes:changed', 'data:changed']) on(evt, live(() => { renderStats(); renderRecents(); renderBookmarks(); renderLastMed(); }));
    on('theme:changed', live(render));
  },
  show() { render(); },
};
