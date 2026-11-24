/* Fine del capitolo: un sigillo «Letto» che si «stampa» con una molla quando il fondo entra nella vista,
   segna il capitolo come letto e propone il capitolo dopo (o, in Apocalisse 22, un saluto finale). */
import {registerFeature} from '../core/features.js';

const stamped = new Set();          // capitoli già stampati in questa sessione: al ridisegno non si ripete l'animazione
let io = null;

/* Sigillo originale: bordo a festone, due anelli, scritta al centro */
function sealSvg() {
  let d = '';
  for (let i = 0; i <= 240; i++) {
    const a = i / 240 * Math.PI * 2, r = 53 + 2.2 * Math.cos(a * 30);
    d += (i ? 'L' : 'M') + (60 + r * Math.cos(a)).toFixed(2) + ' ' + (60 + r * Math.sin(a)).toFixed(2);
  }
  const t = document.createElement('template');
  t.innerHTML = `<svg class="f-fine-svg" aria-hidden="true" focusable="false" viewBox="0 0 120 120" width="112" height="112">
    <path class="f-fine-edge" d="${d}Z"/>
    <circle class="f-fine-ring" cx="60" cy="60" r="44"/>
    <circle class="f-fine-dash" cx="60" cy="60" r="39.5"/>
    <path class="f-fine-fill" d="M54 46.5l4 4 8-8.5"/>
    <text class="f-fine-word" x="61" y="68" text-anchor="middle">LETTO</text>
    <path class="f-fine-star" d="M60 78.5l2 3.2-2 3.2-2-3.2z"/>
  </svg>`;
  return t.content.firstChild;
}

function render(info, ctx) {
  const {book, ch, text} = info;
  if (!text || !Object.keys(text).length) return null;          // il testo non è ancora arrivato: il nucleo ridisegna a capitolo caricato
  io?.disconnect(); io = null;
  const {h, reduceMotion} = ctx.dom, {bible, notes, nav, router} = ctx;
  const key = book + '.' + ch, title = bible.lapRef(book, ch), next = bible.step(book, ch, 1);
  const already = stamped.has(key) || Boolean(notes.readMap?.()[key]);

  const ripple = h('span', {class: 'f-fine-ripple', 'aria-hidden': 'true'});
  const seal = h('span', {class: 'f-fine-seal'}, sealSvg());
  const label = h('div', {class: 'f-fine-label', role: 'status'}, h('b', {text: next ? 'Capitolo letto' : 'Hai finito la Bibbia'}), h('small', {text: title}));
  const block = h('div', {class: 'f-fine' + (already ? ' on' : '')}, h('div', {class: 'f-fine-stamp'}, h('span', {class: 'f-fine-wrap'}, ripple, seal), label));

  if (next) {
    block.append(h('button', {type: 'button', class: 'card f-fine-next', dataset: {next: '1'}, 'aria-label': 'Capitolo dopo: ' + bible.lapRef(next[0], next[1]), on: {click: () => nav.openRef(next[0], next[1], 1)}},
      ctx.covers.cover(next[0], {w: 40, h: 56, r: 3, title: false}),
      h('span', {class: 'f-fine-nb'}, h('span', {class: 'eyebrow', text: 'Capitolo dopo'}), h('b', {text: bible.lapRef(next[0], next[1])})),
      ctx.icons.icon('chev', 18, 2.2)));
  } else {
    block.append(h('div', {class: 'f-fine-end'},
      h('p', {text: 'Sei arrivato all’ultima pagina. Il libro si chiude con una preghiera: vieni, Signore Gesù. Grazie per il cammino fatto.'}),
      h('div', {class: 'f-fine-btns'},
        h('button', {type: 'button', class: 'btn primary', text: 'Ricomincia da Genesi', on: {click: () => nav.openRef(0, 1, 1)}}),
        h('button', {type: 'button', class: 'btn', text: 'Rileggi le tue note', on: {click: () => router.go('quaderno')}}))));
  }

  const play = () => {
    stamped.add(key);
    block.classList.add('on');
    if (typeof notes.markRead === 'function') notes.markRead(book, ch);
    if (reduceMotion() || !seal.animate) return;
    seal.animate([
      {opacity: 0, transform: 'rotate(-20deg) scale(2.1)', offset: 0, easing: 'cubic-bezier(.55, 0, .9, .45)'},
      {opacity: 1, transform: 'rotate(-6deg) scale(.86)', offset: .42, easing: 'ease-out'},
      {transform: 'rotate(-9.5deg) scale(1.07)', offset: .7, easing: 'ease-in-out'},
      {opacity: 1, transform: 'rotate(-8deg) scale(1)', offset: 1},
    ], {duration: 720});
    ripple.animate([{opacity: .55, transform: 'scale(.7)'}, {opacity: 0, transform: 'scale(1.7)'}], {duration: 760, delay: 300, easing: 'ease-out', fill: 'backwards'});
  };
  if (already) { if (typeof notes.markRead === 'function' && !notes.readMap?.()[key]) notes.markRead(book, ch); }
  else if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { io?.disconnect(); io = null; play(); } }, {threshold: 0.6});
    io.observe(block);
  } else play();
  return block;
}

const CSS = `
.f-fine { display: flex; flex-direction: column; align-items: center; gap: 18px; padding: 26px 0 4px; border-top: 1px solid var(--line); }
.f-fine-stamp { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.f-fine-wrap { position: relative; width: 112px; height: 112px; display: block; }
.f-fine-seal { position: absolute; inset: 0; display: block; color: var(--accent-book); opacity: 0; transform: rotate(-8deg); }
.f-fine.on .f-fine-seal { opacity: 1; }
.f-fine-ripple { position: absolute; inset: 4px; border-radius: 50%; box-shadow: 0 0 0 2px var(--accent-book); opacity: 0; pointer-events: none; }
.f-fine-svg { display: block; overflow: visible; }
.f-fine-edge { fill: color-mix(in srgb, var(--accent-book) 11%, var(--bg)); stroke: currentColor; stroke-width: 1.5; stroke-linejoin: round; }
.f-fine-ring { fill: none; stroke: currentColor; stroke-width: 1.3; }
.f-fine-dash { fill: none; stroke: currentColor; stroke-width: 1; stroke-dasharray: 1.2 3.4; stroke-linecap: round; opacity: .7; }
.f-fine-fill { fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; transform: translate(0, -1px); }
.f-fine-word { fill: currentColor; font: 600 17px var(--serif-head); letter-spacing: .2em; }
.f-fine-star { fill: currentColor; opacity: .8; }
.f-fine-label { text-align: center; display: flex; flex-direction: column; gap: 2px; opacity: 0; transform: translateY(4px); transition: opacity .4s .35s, transform .4s .35s; }
.f-fine.on .f-fine-label { opacity: 1; transform: none; }
.f-fine-label b { font: 600 18px var(--serif-head); }
.f-fine-label small { font: 500 12.5px var(--sans); color: var(--dim); }
.f-fine-next { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 14px; text-align: left; }
.f-fine-nb { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.f-fine-nb b { font: 600 18px var(--serif-head); }
.f-fine-next > .ic-svg { color: var(--accent-book); }
.f-fine-end { text-align: center; max-width: 30em; }
.f-fine-end p { margin: 0 0 14px; font: italic 400 17px/1.5 var(--serif-read); color: var(--dim); }
.f-fine-btns { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
`;
function ensureStyle() { if (!document.getElementById('f-fine-css')) { const s = document.createElement('style'); s.id = 'f-fine-css'; s.textContent = CSS; document.head.append(s); } }
ensureStyle();

registerFeature({id: 'capitolo-finito', chapterFooter: [{id: 'capitolo-finito', order: 10, render}]});
