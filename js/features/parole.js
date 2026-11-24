/* Parole toccabili: nel testo dei versetti le misure, i luoghi e i personaggi noti diventano parole con una sottolineatura
   punteggiata; un tocco apre una scheda (popover) con spiegazione e rimandi. Dati: data/measures.json, places.json, people.json.
   Impostazioni (localStorage): margine.parole.misure (predefinito sì), .luoghi (no), .personaggi (no). I comandi stanno nella feature «aspetto». */
import {registerFeature} from '../core/features.js';

const KEY = {misure: 'margine.parole.misure', luoghi: 'margine.parole.luoghi', personaggi: 'margine.parole.personaggi'};
const DEFAULT = {misure: true, luoghi: false, personaggi: false};
const FILE = {misure: 'measures.json', luoghi: 'places.json', personaggi: 'people.json'};
const ORDER = ['misure', 'luoghi', 'personaggi'];          // in caso di forma uguale vince il primo tipo
const CLASS = {misure: 'f-parole-misura', luoghi: 'f-parole-luogo', personaggi: 'f-parole-persona'};
const KIND = {misure: 'misura', luoghi: 'luogo', personaggi: 'personaggio'};

/* Parole che nel testo italiano sono anche parole comuni, o nomi che indicano persone o luoghi diversi: non si sottolineano da sole */
const STOP = new Set(['giuda', 'maria', 'giovanni', 'giacomo', 'erode', 'giuseppe', 'filippo', 'mare', 'fiume', 'mezzogiorno', 'medi', 'siri', 'ai', 'on',
  'gesù', 'gesù di nazaret', 'cristo', 'messia', 'dito', 'dita', 'braccio', 'braccia', 'tesa', 'tese', 'orgia', 'misura', 'misure', 'sea', 'bat', 'log', 'cab',
  'coro', 'cori', 'espiazione', 'trombe', 'capanne', 'azzimi']);

let ctxRef = null, cfg = null, compiled = null, pop = null, lastDown = {a: null, t: 0};
const DATA = {misure: null, luoghi: null, personaggi: null};
const loading = {};

const norm = s => s.toLowerCase().replace(/\s+/g, ' ').replace(/’/g, "'");
const isUpper = ch => ch !== ch.toLowerCase();
const settings = () => cfg || (cfg = Object.fromEntries(ORDER.map(t => { const v = ctxRef.store.get(KEY[t]); return [t, v === null ? DEFAULT[t] : v === '1']; })));

function formsOf(type, e) {
  if (type === 'misure') return e.parole || [];
  if (type === 'luoghi') return [...new Set([e.nome_it, ...(e.forme || [])])];
  return [...new Set([e.nome, ...(e.forme || [])])];
}

/* Una sola espressione regolare per l'insieme dei tipi attivi, compilata una volta (e rifatta solo se cambiano le impostazioni o i dati) */
function compile() {
  const cfgNow = settings(), active = ORDER.filter(t => cfgNow[t] && DATA[t]);
  if (!active.length) return null;
  const key = active.join();
  if (compiled && compiled.key === key) return compiled;
  const map = new Map(), amb = new Set(), forms = [];
  for (const t of active) for (const e of DATA[t]) for (const f of formsOf(t, e)) {
    if (!f || f.includes('(')) continue;
    const k = norm(f);
    if (STOP.has(k)) continue;
    const old = map.get(k);
    if (old) { if (old.type === t && old.entry !== e) amb.add(k); continue; }    // lo stesso nome per due persone/luoghi: ambiguo
    map.set(k, {type: t, entry: e, cap: isUpper(f[0])}); forms.push(f);
  }
  for (const k of amb) map.delete(k);
  const src = forms.filter(f => map.has(norm(f))).sort((a, b) => b.length - a.length)
    .map(f => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+').replace(/['’]/g, "['’]")).join('|');
  compiled = {key, map, re: new RegExp('(?<![\\p{L}\\p{N}_])(?:' + src + ')(?![\\p{L}\\p{N}_])', 'giu')};
  return compiled;
}

function load(type) {
  if (DATA[type]) return Promise.resolve(true);
  if (!loading[type]) loading[type] = fetch(new URL('../../data/' + FILE[type], import.meta.url))
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(d => { if (Array.isArray(d)) DATA[type] = d; compiled = null; return Boolean(DATA[type]); })
    .catch(() => { loading[type] = null; return false; });
  return loading[type];
}
/* Dopo un cambiamento (impostazioni o dati arrivati) si ridisegna il testo del lettore */
async function refresh() {
  cfg = null; compiled = null;
  const need = ORDER.filter(t => settings()[t] && !DATA[t]);
  if (need.length) await Promise.all(need.map(load));
  ctxRef.bus.emit('notes:changed');
}

/* ---------- Disegno nel testo ---------- */
function decorate(textEl) {
  const c = compile();
  if (!c) return;
  const walker = document.createTreeWalker(textEl, NodeFilter.SHOW_TEXT), nodes = [];
  while (walker.nextNode()) if (!walker.currentNode.parentElement.closest('.f-parole-w')) nodes.push(walker.currentNode);
  let any = false;
  for (const node of nodes) {
    const s = node.nodeValue;
    c.re.lastIndex = 0;
    let m, last = 0, frag = null;
    while ((m = c.re.exec(s))) {
      const hit = c.map.get(norm(m[0]));
      if (!hit || (hit.cap && !isUpper(m[0][0]))) continue;
      frag ||= document.createDocumentFragment();
      if (m.index > last) frag.append(s.slice(last, m.index));
      const w = document.createElement('span');
      w.className = 'f-parole-w ' + CLASS[hit.type];
      w.textContent = m[0];
      w.setAttribute('role', 'button'); w.tabIndex = 0; w.setAttribute('aria-haspopup', 'dialog');
      w.setAttribute('aria-label', m[0] + ', ' + KIND[hit.type] + ': apri la scheda');
      w.dataset.t = hit.type; w.dataset.id = hit.entry.id;
      frag.append(w); last = m.index + m[0].length;
    }
    if (frag) { if (last < s.length) frag.append(s.slice(last)); node.replaceWith(frag); any = true; }
  }
  if (any) {
    /* il tocco sulla parola apre la scheda e NON seleziona il versetto: si ferma qui, prima del gestore del lettore */
    const open = e => {
      const w = e.target.closest?.('.f-parole-w');
      if (!w) return;
      if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      e.stopPropagation(); e.preventDefault();
      openCard(w);
    };
    textEl.addEventListener('click', open);
    textEl.addEventListener('keydown', open);
  }
}

/* ---------- Scheda ---------- */
const SVG = {
  misure: '<path d="M12 4v15M7 19h10M5 7h14M5 7l-2.5 6a3.2 3.2 0 0 0 5 0zM19 7l-2.5 6a3.2 3.2 0 0 0 5 0z"/>',
  luoghi: '<path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0C5.5 15.4 12 21 12 21z"/><circle cx="12" cy="10" r="2.4"/>',
};
const svg = (name, size = 22) => { const t = document.createElement('template'); t.innerHTML = `<svg class="ic-svg" aria-hidden="true" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${SVG[name]}</svg>`; return t.content.firstChild; };
const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);

function refChips(list, api) {
  const {h} = ctxRef.dom, {bible, nav} = ctxRef;
  return h('div', {class: 'f-parole-refs'}, (list || []).map(r => {
    const p = bible.parseRef(r);
    if (!p) return h('span', {class: 'f-parole-ref plain', text: r});
    return h('button', {type: 'button', class: 'f-parole-ref', 'aria-label': 'Apri ' + bible.fmtRef(p), text: r, on: {click: () => { api.close(); nav.openRef(p.book, p.ch, p.v1 || 1); }}});
  }));
}

function card(type, e, api) {
  const {h} = ctxRef.dom, field = (label, body) => body ? h('div', {class: 'f-parole-field'}, h('span', {class: 'f-parole-label', text: label}), body) : null;
  const p = (t, cls) => t ? h('p', {class: cls || 'f-parole-text', text: t}) : null;
  let eyebrow, title, sub, av, body;
  if (type === 'misure') {
    eyebrow = 'Misura · ' + e.categoria; title = cap1(e.parole[0]); av = svg('misure');
    body = [
      p(e.valore, 'f-parole-big'), p(e.intervallo ? 'Tra ' + e.intervallo : '', 'f-parole-sub'),
      e.equivalenze ? h('div', {class: 'f-parole-chips'}, e.equivalenze.split(';').map(x => x.trim()).filter(Boolean).map(x => h('span', {class: 'f-parole-chip', text: x}))) : null,
      field('Oggi', p(e.oggi)), field('Dove compare', e.riferimenti?.length ? refChips(e.riferimenti, api) : null), p(e.nota, 'f-parole-note'),
    ];
  } else if (type === 'luoghi') {
    eyebrow = 'Luogo · ' + e.tipo; title = e.nome_it; av = svg('luoghi');
    const map = ctxRef.router.hasScreen('mondo') ? h('button', {type: 'button', class: 'f-parole-map', text: 'Mostra sulla mappa ›', on: {click: () => { api.close(); try { ctxRef.router.go('mondo', {luogo: e.id}); } catch (err) { console.warn('mondo', err); } }}}) : null;
    body = [p(e.descrizione), field('Dove compare', e.riferimenti_chiave?.length ? refChips(e.riferimenti_chiave, api) : null), map];
  } else {
    eyebrow = 'Personaggio'; title = e.nome; sub = [e.ruolo, e.periodo].filter(Boolean).join(' · ');
    av = h('span', {class: 'f-parole-initial', text: e.nome.charAt(0)});
    body = [p(e.sintesi), p(e.famiglia, 'f-parole-note'), field('Passi', e.passi_chiave?.length ? refChips(e.passi_chiave, api) : null)];
  }
  return h('div', {class: 'f-parole-card ' + CLASS[type]},
    h('div', {class: 'f-parole-head'}, h('span', {class: 'f-parole-av'}, av),
      h('div', {class: 'f-parole-titles'}, h('span', {class: 'f-parole-eyebrow', text: eyebrow}), h('b', {class: 'f-parole-title', text: title}), sub ? h('small', {text: sub}) : null),
      h('button', {type: 'button', class: 'f-parole-x', 'aria-label': 'Chiudi la scheda', on: {click: () => api.close()}}, ctxRef.icons.icon('close', 16, 2.2))),
    ...body);
}

function openCard(anchor) {
  /* un tocco sulla parola della scheda aperta la chiude (lo fa già il tocco «fuori»): il click che segue non deve riaprirla */
  if (lastDown.a === anchor && performance.now() - lastDown.t < 500) { lastDown = {a: null, t: 0}; return; }
  const type = anchor.dataset.t, e = DATA[type]?.find(x => x.id === anchor.dataset.id);
  if (!e) return;
  const down = ev => { if (anchor.contains(ev.target)) lastDown = {a: anchor, t: performance.now()}; };
  document.addEventListener('pointerdown', down, true);
  pop = ctxRef.ui.popover(anchor, (box, api) => {
    box.classList.add('f-parole-pp');
    box.setAttribute('aria-label', anchor.textContent);
    box.append(card(type, e, api));
    box.tabIndex = -1;
  }, {onClose: () => { document.removeEventListener('pointerdown', down, true); pop = null; if (anchor.isConnected) try { anchor.focus({preventScroll: true}); } catch { /* ok */ } }});
  pop.el.focus({preventScroll: true});
}

/* ---------- Stile ---------- */
const CSS = `
.f-parole-w { --tone: var(--dim); position: relative; cursor: pointer; border-radius: 3px; text-decoration: underline dotted; text-decoration-thickness: 1.4px; text-underline-offset: .24em;
  text-decoration-color: color-mix(in srgb, var(--tone) 62%, transparent); -webkit-touch-callout: none; transition: background-color .15s; }
.f-parole-w::after { content: ''; position: absolute; inset: -8px -4px; }
.f-parole-w:hover, .f-parole-w:focus-visible { background-color: color-mix(in srgb, var(--tone) 14%, transparent); }
.f-parole-misura { --tone: var(--d1); } .f-parole-luogo { --tone: var(--accent); } .f-parole-persona { --tone: var(--d2); }
.popover.f-parole-pp { width: min(360px, calc(100% - 20px)); padding: 16px; border-radius: var(--r-card); max-height: min(72dvh, 520px); overflow: auto; overscroll-behavior: contain; outline: none; }
.f-parole-card { --tone: var(--d1); display: flex; flex-direction: column; gap: 12px; }
.f-parole-card.f-parole-luogo { --tone: var(--accent); } .f-parole-card.f-parole-persona { --tone: var(--d2); }
.f-parole-head { display: flex; align-items: flex-start; gap: 12px; }
.f-parole-av { width: 44px; height: 44px; flex: none; border-radius: var(--r-sm); display: flex; align-items: center; justify-content: center; color: var(--tone); background: color-mix(in srgb, var(--tone) 16%, var(--card)); }
.f-parole-initial { font: 600 21px var(--serif-head); }
.f-parole-titles { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; padding-top: 1px; }
.f-parole-eyebrow { font: 600 10.5px/1.2 var(--sans); letter-spacing: .14em; text-transform: uppercase; color: var(--tone); }
.f-parole-title { font: 600 22px/1.15 var(--serif-head); letter-spacing: -.01em; }
.f-parole-titles small { font: 400 13px/1.35 var(--sans); color: var(--dim); }
.f-parole-x { width: var(--hit); height: var(--hit); margin: -6px -8px 0 0; flex: none; display: inline-flex; align-items: center; justify-content: center; color: var(--dim); border-radius: 50%; }
.f-parole-big { margin: 0; font: 600 21px/1.25 var(--serif-head); }
.f-parole-sub { margin: -6px 0 0; font: 400 13px var(--sans); color: var(--dim); }
.f-parole-text { margin: 0; font: 400 16px/1.5 var(--serif-read); }
.f-parole-note { margin: 0; font: italic 400 14px/1.45 var(--serif-read); color: var(--dim); }
.f-parole-chips, .f-parole-refs { display: flex; flex-wrap: wrap; gap: 6px; }
.f-parole-chip { padding: 6px 11px; border-radius: var(--r-pill); background: var(--chip); font: 500 12.5px/1.25 var(--sans); }
.f-parole-field { display: flex; flex-direction: column; gap: 5px; }
.f-parole-label { font: 600 10.5px var(--sans); letter-spacing: .14em; text-transform: uppercase; color: var(--dim); }
.f-parole-ref { position: relative; min-height: 34px; padding: 0 13px; border-radius: var(--r-pill); display: inline-flex; align-items: center; background: color-mix(in srgb, var(--tone) 14%, var(--card)); color: var(--ink); font: 600 13px var(--sans); }
.f-parole-ref:not(.plain)::after { content: ''; position: absolute; inset: -5px -2px; }
.f-parole-ref.plain { min-height: 0; padding: 5px 11px; font-weight: 500; }
.f-parole-map { min-height: var(--hit); display: flex; align-items: center; padding: 0 2px; border-top: 1px solid var(--line); margin-top: 2px; color: var(--accent); font: 600 15px var(--sans); }
`;
function ensureStyle() { if (!document.getElementById('f-parole-css')) { const s = document.createElement('style'); s.id = 'f-parole-css'; s.textContent = CSS; document.head.append(s); } }

registerFeature({
  id: 'parole',
  textDecorators: [{id: 'parole', order: 50, decorate: (textEl, info, ctx) => { ctxRef = ctx; decorate(textEl, info); }}],
  onReady(ctx) {
    ctxRef = ctx; ensureStyle();
    ctx.bus.on('parole:settings', refresh);
    const on = ORDER.filter(t => settings()[t]);
    if (on.length) Promise.all(on.map(load)).then(() => ctx.bus.emit('notes:changed'));
  },
});
ensureStyle();
