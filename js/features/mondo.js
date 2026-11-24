/* Feature «mondo»: schermata «Mondo della Bibbia» (mappa, luoghi, misure e monete, il tempo, personaggi).
   Raggiungibile da: card in Oggi, riga nelle impostazioni, e da altre feature con  ctx.router.go('mondo', params).

   PARAMETRI della schermata 'mondo' (tutti facoltativi):
     {luogo: '<id luogo>'}        apre la mappa centrata sul luogo e la sua scheda (id come in data/places.json, es. 'gerusalemme')
     {misura: '<id misura>'}      apre la scheda di una misura/moneta/ora/mese/festa (id come in data/measures.json, es. 'talento')
     {personaggio: '<id>'}        apre la scheda di un personaggio (id come in data/people.json, es. 'abramo')
     {sezione: 'luoghi'|'misure'|'tempo'|'personaggi'|'mappa'}   apre direttamente una sezione
     {from: '<id schermata>'}     schermata a cui tornare con «Indietro» (default: quella da cui si arriva)
   Esempio:  ctx.router.go('mondo', {luogo: 'betania', from: 'leggi'})
   Dati caricati una sola volta (fetch di data/*.json) e solo quando servono; CSS e mappa in moduli caricati al primo uso. */
import {registerFeature} from '../core/features.js';
import {nx, ny, MEDITERRANEO, LAGHI, FIUMI} from './mondo-geo.js';

const FEATURE = 'mondo';
const cache = {};
const load = name => cache[name] ??= fetch(new URL(`../../data/${name}.json`, import.meta.url)).then(r => { if (!r.ok) throw Error(name + ' ' + r.status); return r.json(); }).catch(e => { delete cache[name]; throw e; });
let cssDone = false;
function ensureCss() {
  if (cssDone) return; cssDone = true;
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = new URL('../../css/f-mondo.css', import.meta.url).href; document.head.append(l);
}

const TIPO = {città: 'Città', regione: 'Regione', acqua: 'Acque', monte: 'Monte', luogo: 'Luogo', isola: 'Isola', valle: 'Valle'};
const CAT = {peso: 'Pesi', moneta: 'Monete', lunghezza: 'Lunghezze', capacità: 'Capacità'};
const CAT_ONE = {peso: 'Peso', moneta: 'Moneta', lunghezza: 'Lunghezza', capacità: 'Capacità', tempo: 'Tempo'};
const MESI = ['nisan', 'iyyar', 'sivan', 'elul', 'tishri', 'bul', 'kislev', 'tevet', 'shevat', 'adar'];
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const mName = m => cap(m.parole[0]);
const SVGNS = 'http://www.w3.org/2000/svg';
const ICONS = {
  pin: 'M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11zM12 12.2a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8z',
  scale: 'M12 4v16M6 20h12M5 7h14M5 7l-2.5 6a3 3 0 0 0 5 0L5 7zM19 7l-2.5 6a3 3 0 0 0 5 0L19 7z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.2 2',
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c.8-4 3.7-6 7.5-6s6.7 2 7.5 6',
  map: 'M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4zM9 4v14M15 6v14',
};
function ico(name, size = 20) {
  const s = document.createElementNS(SVGNS, 'svg');
  for (const [k, v] of Object.entries({width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', class: 'ic-svg'})) s.setAttribute(k, v);
  const p = document.createElementNS(SVGNS, 'path'); p.setAttribute('d', ICONS[name]); s.append(p); return s;
}

/* ---------- anteprima della mappa (card in Oggi): SVG disegnato dal codice, nessun dato da caricare ---------- */
function previewSvg(w, h) {
  const c = [35.4, 32.3], pxdeg = 100, sc = pxdeg * 360;
  const X = lon => ((nx(lon) - nx(c[0])) * sc + w / 2).toFixed(1), Y = lat => ((ny(lat) - ny(c[1])) * sc + h / 2).toFixed(1);
  const poly = (pts, close = true) => pts.map(([lo, la], i) => (i ? 'L' : 'M') + X(lo) + ' ' + Y(la)).join('') + (close ? 'Z' : '');
  const city = [['Cafarnao', 35.575, 32.881, 1], ['Nazaret', 35.298, 32.702, -1], ['Gerusalemme', 35.234, 31.777, 1], ['Betlemme', 35.208, 31.704, -1]];
  const dots = city.map(([n, lo, la, side]) => `<circle cx="${X(lo)}" cy="${Y(la)}" r="3.6" class="f-mondo-pvdot${n === 'Gerusalemme' ? ' main' : ''}"/><text x="${(Number(X(lo)) + side * 8).toFixed(1)}" y="${(Number(Y(la)) + 4).toFixed(1)}" text-anchor="${side > 0 ? 'start' : 'end'}" class="f-mondo-pvl">${n}</text>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><rect width="${w}" height="${h}" class="f-mondo-land"/>` +
    `<path d="${poly(MEDITERRANEO)}" class="f-mondo-sea"/><path d="${poly(LAGHI.galilea)}" class="f-mondo-lake"/><path d="${poly(LAGHI.morto)}" class="f-mondo-lake"/><path d="${poly(FIUMI.giordano, false)}" class="f-mondo-river"/>${dots}</svg>`;
}

/* ---------- riferimenti biblici tappabili ---------- */
function parseRefLoose(ctx, r) { const p = ctx.bible.parseRef(r) || ctx.bible.parseRef(String(r).replace(/[-–]\d+,.*$/, '')); return p; }

registerFeature({
  id: FEATURE,
  homeCards: [{id: 'mondo', order: 60, render(ctx) {
    ensureCss();
    const {h} = ctx.dom;
    const pv = h('span', {class: 'f-mondo-homeprev'}); pv.innerHTML = previewSvg(358, 172);
    return h('button', {class: 'card f-mondo-home', type: 'button', 'aria-label': 'Esplora il Mondo della Bibbia', on: {click: () => ctx.router.go('mondo', {from: 'oggi'})}},
      pv, h('span', {class: 'f-mondo-homebar'}, h('span', {class: 'f-mondo-homet'}, h('small', {class: 'eyebrow', text: 'Esplora'}), h('b', {text: 'Mondo della Bibbia'}), h('i', {text: 'Mappa, luoghi, misure, tempo e personaggi'})), h('span', {class: 'f-mondo-go'}, 'Esplora', ctx.icons.icon('chev', 15, 2.2))));
  }}],
  settings: [{id: 'mondo', section: 'Studio', label: 'Mondo della Bibbia', value: 'Mappa, luoghi, misure, tempo e personaggi', icon: 'grid', order: 10, onTap: ctx => ctx.router.go('mondo', {from: 'impostazioni'})}],
  screens: [{id: 'mondo', title: 'Mondo della Bibbia', tab: 'oggi', build: buildScreen, show: showScreen}],
  onReady() {
    /* a riposo scalda la cache dei dati, così «Mondo» funziona anche senza rete */
    /* non prima di 6 s dall'avvio (e a riposo): su rete lenta non deve contendere la banda al primo capitolo */
    const idle = window.requestIdleCallback || (f => setTimeout(f, 3500));
    setTimeout(() => idle(() => { for (const n of ['places', 'measures', 'people']) load(n).catch(() => {}); }, {timeout: 8000}), 6000);
  },
});

/* ============================== schermata ============================== */
const S = {ctx: null, root: null, body: null, title: null, view: 'hub', backTo: 'oggi', leaving: false, map: null, mapLoading: null, filter: {period: 'tutti', tipo: 'tutti'}, places: null, byId: {}, measures: null, people: null, el: {}, pending: null};

function buildScreen(root, ctx) {
  ensureCss();
  const {h} = ctx.dom, {icon} = ctx.icons;
  S.ctx = ctx; S.root = root;
  S.title = h('span', {class: 'tb-title', text: 'Mondo della Bibbia'});
  const back = h('button', {class: 'tb-back', id: 'mondoBack', type: 'button', 'aria-label': 'Indietro', on: {click: goBack}}, icon('back', 20, 2));
  S.body = h('div', {class: 'col f-mondo-col'});
  root.append(h('header', {class: 'topbar glass'}, back, S.title, h('span', {class: 'tb-right'})), S.body);
  S.el.hub = buildHub();
  S.body.append(S.el.hub);
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || S.root.hidden || S.view === 'hub' || ctx.ui.sheetOpen()) return;
    showView('hub');
  });
}
function goBack() {
  if (S.view !== 'hub') { showView('hub'); return; }
  S.ctx.router.back(S.backTo || 'oggi');
}
function showView(v) {
  S.view = v;
  for (const [k, e] of Object.entries(S.el)) e.hidden = k !== v;
  if (v !== 'hub' && !S.el[v]) { S.el[v] = buildList(v); S.body.append(S.el[v]); S.el[v].hidden = false; }
  S.title.textContent = {hub: 'Mondo della Bibbia', luoghi: 'Luoghi', misure: 'Misure e monete', tempo: 'Il tempo', personaggi: 'Personaggi'}[v];
  window.scrollTo(0, 0);
  if (v === 'hub') requestAnimationFrame(() => S.map?.resize());
}

async function showScreen(params, prev) {
  if (params.from) S.backTo = params.from;
  else if (!S.leaving && prev && prev !== 'mondo') S.backTo = prev;
  S.leaving = false;
  const wantMap = Boolean(params.luogo) || params.sezione === 'mappa' || (!params.misura && !params.personaggio && !params.sezione);
  if (params.sezione && params.sezione !== 'mappa' && S.view !== params.sezione) showView(params.sezione);
  else if (wantMap && S.view !== 'hub') showView('hub');
  else if (S.view === 'hub') showView('hub');
  if (S.view === 'hub') ensureMap();
  try {
    if (params.luogo) {
      await ensureMap();
      const p = S.byId[params.luogo];
      if (p) { S.map?.flyToPlace(p.id); setTimeout(() => openPlace(p), 60); }
    } else if (params.misura) {
      const ms = await load('measures'); S.measures = ms;
      const m = ms.find(x => x.id === params.misura);
      if (m) { showView(m.categoria === 'tempo' ? 'tempo' : 'misure'); setTimeout(() => openMeasure(m), 60); }
    } else if (params.personaggio) {
      const ps = await load('people'); S.people = ps;
      const p = ps.find(x => x.id === params.personaggio);
      if (p) { showView('personaggi'); setTimeout(() => openPerson(p), 60); }
    }
  } catch (e) { console.error('mondo', e); }
}

/* ---------- hub: filtri, mappa, riquadri, attribuzioni ---------- */
function buildHub() {
  const {h} = S.ctx.dom;
  const periods = [['tutti', 'Tutti', 'Tutti i periodi'], ['at', 'Antico T.', 'Antico Testamento'], ['vangeli', 'Vangeli', 'Vangeli'], ['atti', 'Atti e lettere', 'Atti e lettere']];
  const types = [['tutti', 'Tutti'], ['città', 'Città'], ['monti', 'Monti'], ['acque', 'Acque'], ['regioni', 'Regioni']];
  const seg = h('div', {class: 'seg f-mondo-seg', role: 'group', 'aria-label': 'Periodo'});
  const chips = h('div', {class: 'f-mondo-chips', role: 'group', 'aria-label': 'Tipo di luogo'});
  const sync = () => {
    seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === S.filter.period)));
    chips.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === S.filter.tipo)));
    S.map?.setFilter(S.filter);
  };
  for (const [v, l, aria] of periods) seg.append(h('button', {type: 'button', 'data-v': v, 'aria-label': aria, text: l, on: {click: () => { S.filter.period = v; sync(); }}}));
  const DOT = {città: 'var(--accent)', monti: 'var(--d3)', acque: 'var(--d2)', regioni: 'var(--dim)'};
  for (const [v, l] of types) chips.append(h('button', {type: 'button', class: 'f-mondo-chip', 'data-v': v, on: {click: () => { S.filter.tipo = v; sync(); }}}, h('span', {}, DOT[v] ? h('i', {style: '--pc:' + DOT[v], 'aria-hidden': 'true'}) : null, l)));
  S.syncFilters = sync;
  S.mapSlot = h('div', {class: 'f-mondo-slot', id: 'mondoMapSlot'}, h('p', {class: 'f-mondo-loading', text: 'Carico la mappa…'}));
  const tile = (view, ic, title, sub) => h('button', {class: 'card f-mondo-tile-btn', type: 'button', 'data-view': view, on: {click: () => showView(view)}},
    h('span', {class: 'f-mondo-tic'}, ico(ic, 20)), h('b', {text: title}), h('small', {text: sub}));
  const el = h('div', {class: 'f-mondo-hub'},
    h('h1', {class: 'big f-mondo-h1', text: 'Mondo della Bibbia'}), seg, chips, S.mapSlot,
    h('div', {class: 'f-mondo-grid'}, tile('luoghi', 'pin', 'Luoghi', 'Città, monti e mari'), tile('misure', 'scale', 'Misure e monete', 'Talento, siclo, cubito'), tile('tempo', 'clock', 'Il tempo', 'Ore del giorno e feste'), tile('personaggi', 'person', 'Personaggi', 'Da Adamo a Paolo')),
    footer());
  sync();
  return el;
}

function footer() {
  const {h} = S.ctx.dom;
  const a = (href, t) => h('a', {href, target: '_blank', rel: 'noopener noreferrer', text: t});
  return h('p', {class: 'f-mondo-attrib'}, 'Dati sui luoghi: ', a('https://www.openbible.info/geo/', 'OpenBible.info (Bible Geocoding Data)'), ', ', a('https://creativecommons.org/licenses/by/4.0/', 'CC BY 4.0'),
    '. Mappa: disegnata per l’app; con la rete, ', a('https://www.openstreetmap.org/copyright', '© OpenStreetMap contributors'), '.');
}

function ensureMap() {
  if (S.map) { S.map.resize(); return Promise.resolve(); }
  return S.mapLoading ||= makeMap();
}
async function makeMap() {
  const {h} = S.ctx.dom;
  try {
    const [mod, places] = await Promise.all([import('./mondo-mappa.js'), load('places')]);
    S.places = places; S.byId = Object.fromEntries(places.map(p => [p.id, p]));
    S.map = mod.createMap({places, bible: S.ctx.bible, reduceMotion: S.ctx.dom.reduceMotion(), onSelect: p => openPlace(p)});
    S.mapSlot.replaceChildren(S.map.el);
    S.map.setFilter(S.filter);
    S.map.resize();
  } catch (e) {
    console.error('mondo: mappa non disponibile', e);
    S.mapSlot.replaceChildren(h('p', {class: 'f-mondo-loading', text: 'La mappa non è disponibile: i dati non sono stati caricati. Riprova con la rete attiva.'}));
  } finally { S.mapLoading = null; }
}

/* ---------- elenchi ---------- */
const searchBox = (ph, onInput, id) => {
  const {h} = S.ctx.dom;
  const input = h('input', {type: 'search', placeholder: ph, 'aria-label': ph, autocomplete: 'off', id, enterkeyhint: 'search'}); S.ctx.dom.noAutofill(input, 'ricerca-' + id);
  input.addEventListener('input', () => onInput(input.value));
  return [h('label', {class: 'searchbox'}, S.ctx.icons.icon('search', 18, 1.8), input), input];
};

function buildList(v) {
  const {h} = S.ctx.dom, {norm} = S.ctx.bible;
  const box = h('div', {class: 'f-mondo-list', 'data-view': v});
  const status = h('p', {class: 'hint f-mondo-status', role: 'status'});
  const body = h('div', {class: 'f-mondo-body'}, h('p', {class: 'f-mondo-loading', text: 'Carico i dati…'}));
  box.append(body);
  const fail = e => { console.error('mondo', e); body.replaceChildren(h('p', {class: 'f-mondo-loading', text: 'Dati non disponibili: riprova con la rete attiva.'})); };
  const done = () => box.append(footer());
  if (v === 'luoghi') load('places').then(ps => {
    S.places = ps; S.byId = Object.fromEntries(ps.map(p => [p.id, p]));
    const rows = h('div', {class: 'rows f-mondo-rows'});
    const items = ps.map(p => {
      const key = norm([p.nome_it, ...(p.forme || [])].join(' '));
      const r = h('button', {class: 'row', type: 'button', 'data-id': p.id, on: {click: () => openPlace(p)}}, h('span', {class: 'row-main'}, h('b', {text: p.nome_it}), h('small', {text: TIPO[p.tipo] + (p.riferimenti_chiave?.[0] ? ' · ' + p.riferimenti_chiave[0] : '') + (p.posizione_approssimata ? ' · posizione approssimata' : '')})), S.ctx.icons.icon('chev', 16, 2.2));
      return {p, key, r};
    });
    rows.append(...items.map(i => i.r));
    const [sb] = searchBox('Cerca un luogo', q => {
      const n = norm(q); let c = 0;
      for (const i of items) { const ok = !n || i.key.includes(n); i.r.hidden = !ok; if (ok) c++; }
      status.textContent = n ? (c ? c + (c === 1 ? ' luogo trovato' : ' luoghi trovati') : 'Nessun luogo trovato.') : '';
    }, 'mondoSearchLuoghi');
    body.replaceChildren(sb, status, rows); done();
  }).catch(fail);
  else if (v === 'misure') load('measures').then(ms => {
    S.measures = ms; body.replaceChildren();
    for (const cat of ['peso', 'moneta', 'lunghezza', 'capacità']) {
      const list = ms.filter(m => m.categoria === cat); if (!list.length) continue;
      body.append(h('h2', {class: 'sec', text: CAT[cat]}), h('div', {class: 'rows'}, ...list.map(m => measureRow(m))));
    }
    done();
  }).catch(fail);
  else if (v === 'tempo') load('measures').then(ms => {
    S.measures = ms; body.replaceChildren();
    const t = ms.filter(m => m.categoria === 'tempo');
    const groups = [
      ['Ore del giorno', t.filter(m => m.id.startsWith('ora-'))],
      ['Vigilie della notte e giorni', t.filter(m => m.id === 'vigilie' || m.id.startsWith('giorno-'))],
      ['Mesi', t.filter(m => m.id.startsWith('mese-')).sort((a, b) => MESI.indexOf(a.id.slice(5)) - MESI.indexOf(b.id.slice(5)))],
      ['Feste e anni sacri', t.filter(m => !/^(ora-|mese-|giorno-)/.test(m.id) && m.id !== 'vigilie')],
    ];
    for (const [title, list] of groups) if (list.length) body.append(h('h2', {class: 'sec', text: title}), h('div', {class: 'rows'}, ...list.map(m => measureRow(m))));
    done();
  }).catch(fail);
  else if (v === 'personaggi') load('people').then(ps => {
    S.people = ps;
    const rows = h('div', {class: 'rows f-mondo-rows'});
    const items = ps.map(p => {
      const key = norm([p.nome, ...(p.forme || []), p.ruolo].join(' '));
      const r = h('button', {class: 'row', type: 'button', 'data-id': p.id, on: {click: () => openPerson(p)}}, h('span', {class: 'f-mondo-av', 'aria-hidden': 'true', text: p.nome.charAt(0)}),
        h('span', {class: 'row-main'}, h('b', {text: p.nome}), h('small', {text: p.ruolo + (p.periodo ? ' · ' + p.periodo : '')})), S.ctx.icons.icon('chev', 16, 2.2));
      return {key, r};
    });
    rows.append(...items.map(i => i.r));
    const [sb] = searchBox('Cerca un personaggio', q => {
      const n = norm(q); let c = 0;
      for (const i of items) { const ok = !n || i.key.includes(n); i.r.hidden = !ok; if (ok) c++; }
      status.textContent = n ? (c ? c + (c === 1 ? ' personaggio trovato' : ' personaggi trovati') : 'Nessun personaggio trovato.') : '';
    }, 'mondoSearchPersonaggi');
    body.replaceChildren(sb, status, rows); done();
  }).catch(fail);
  return box;
}

function measureRow(m) {
  const {h} = S.ctx.dom;
  return h('button', {class: 'row', type: 'button', 'data-id': m.id, on: {click: () => openMeasure(m)}}, h('span', {class: 'row-main'}, h('b', {text: mName(m)}), h('small', {text: m.valore})), S.ctx.icons.icon('chev', 16, 2.2));
}

/* ============================== schede (fogli) ============================== */
function refChips(refs, sh) {
  const {h} = S.ctx.dom;
  const box = h('div', {class: 'f-mondo-refs'});
  for (const r of refs || []) {
    const p = parseRefLoose(S.ctx, r);
    if (!p) { box.append(h('span', {class: 'f-mondo-ref off', text: r})); continue; }
    box.append(h('button', {class: 'f-mondo-ref', type: 'button', 'aria-label': 'Apri ' + r, text: r, on: {click: () => { sh.close(); S.leaving = true; S.ctx.nav.openRef(p.book, p.ch, p.v1 || 1); }}}));
  }
  return box;
}
const kv = (k, v) => { const {h} = S.ctx.dom; return v ? h('div', {class: 'f-mondo-kv'}, h('span', {class: 'eyebrow', text: k}), h('p', {text: v})) : null; };

function openPlace(p) {
  const {h} = S.ctx.dom;
  S.ctx.ui.sheet({title: p.nome_it, build(body, sh) {
    const where = S.view === 'hub' && S.map;
    body.append(h('div', {class: 'f-mondo-card', 'data-kind': 'luogo', 'data-id': p.id},
      h('p', {class: 'eyebrow'}, 'Luogo · ' + TIPO[p.tipo]),
      p.posizione_approssimata ? h('p', {class: 'f-mondo-apx'}, h('span', {class: 'f-mondo-badge', text: 'Posizione approssimata'}), h('span', {text: ' Il punto sulla mappa è indicativo.'})) : null,
      h('p', {class: 'f-mondo-desc', text: p.descrizione}),
      p.forme && p.forme.length > 1 ? kv('Altre forme del nome', p.forme.filter(f => f !== p.nome_it).join(', ')) : null,
      h('h3', {class: 'f-mondo-h3', text: 'Nella Bibbia'}), refChips(p.riferimenti_chiave, sh),
      h('div', {class: 'f-mondo-acts'}, h('button', {class: 'btn primary f-mondo-showmap', type: 'button', on: {click: () => { sh.close(); showView('hub'); ensureMap().then(() => { S.map?.flyToPlace(p.id); window.scrollTo(0, 0); }); }}}, ico('map', 18), where ? 'Centra sulla mappa' : 'Mostra sulla mappa'))));
  }});
}
function openMeasure(m) {
  const {h} = S.ctx.dom;
  S.ctx.ui.sheet({title: mName(m), build(body, sh) {
    body.append(h('div', {class: 'f-mondo-card', 'data-kind': 'misura', 'data-id': m.id},
      h('p', {class: 'eyebrow'}, (m.categoria === 'tempo' ? 'Il tempo' : 'Misura · ' + CAT_ONE[m.categoria])),
      h('p', {class: 'f-mondo-big', text: m.valore}),
      m.intervallo ? h('p', {class: 'f-mondo-sub', text: 'Intervallo: ' + m.intervallo}) : null,
      kv('Equivalenze', m.equivalenze && m.equivalenze !== '—' ? m.equivalenze : ''), kv('Oggi', m.oggi), kv('Nota', m.nota),
      m.riferimenti?.length ? h('h3', {class: 'f-mondo-h3', text: 'Nella Bibbia'}) : null, m.riferimenti?.length ? refChips(m.riferimenti, sh) : null,
      m.parole.length > 1 ? h('p', {class: 'hint', text: 'Si trova anche come: ' + m.parole.join(', ') + '.'}) : null));
  }});
}
function openPerson(p) {
  const {h} = S.ctx.dom;
  S.ctx.ui.sheet({title: p.nome, build(body, sh) {
    body.append(h('div', {class: 'f-mondo-card', 'data-kind': 'personaggio', 'data-id': p.id},
      h('p', {class: 'eyebrow'}, 'Personaggio · ' + p.ruolo), p.periodo ? h('p', {class: 'f-mondo-sub', text: p.periodo}) : null,
      h('p', {class: 'f-mondo-desc', text: p.sintesi}), kv('Famiglia', p.famiglia),
      h('h3', {class: 'f-mondo-h3', text: 'Passi chiave'}), refChips(p.passi_chiave, sh)));
  }});
}
