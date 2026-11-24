/* Mappa interattiva di «Mondo della Bibbia»: mappa vettoriale disegnata (SVG, sempre disponibile offline) + piastrelle SENZA etichette (Esri World Shaded Relief; CARTO nolabels se c'è una chiave) quando c'è rete. I nomi sono SOLO i nostri, in italiano. Proiezione Web Mercator per tutto. Zoom/pan con dita (pointer events, pinch), rotella, tastiera.
   Nessuna libreria. Caricato solo quando serve (import dinamico da mondo.js). */
import {MEDITERRANEO, MARE_NERO, MAR_ROSSO, GOLFO_PERSICO, ISOLE, FIUMI, LAGHI, BASE, BASE_Z, WORLD, nx, ny, pathOf} from './mondo-geo.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const isDark = () => document.documentElement.dataset.theme === 'dark';
const retina = () => (window.devicePixelRatio || 1) > 1.2;
/* CARTO (voyager_nolabels / dark_nolabels) chiede ormai una chiave gratuita: senza, mette la scritta «API KEY REQUIRED» su ogni piastrella.
   Perciò di serie si usa Esri World Shaded Relief (rilievo, senza nomi, strade né confini). Con una chiave CARTO in localStorage
   («margine.mondo.cartokey») si passa alle piastrelle CARTO senza etichette. */
const cartoKey = () => { try { return localStorage.getItem('margine.mondo.cartokey') || ''; } catch { return ''; } };
const TILE_URL = (z, x, y) => cartoKey()
  ? `https://${'abcd'[(x + y) % 4]}.basemaps.cartocdn.com/rastertiles/${isDark() ? 'dark_nolabels' : 'voyager_nolabels'}/${z}/${x}/${y}${retina() ? '@2x' : ''}.png?key=${encodeURIComponent(cartoKey())}`
  : `https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/${z}/${y}/${x}`;
const ATTRIBUTION = () => cartoKey() ? '© OpenStreetMap contributors © CARTO' : 'Rilievo: Esri, USGS, NOAA';
const Z_MIN = 3.4, Z_MAX = 11, TILE_ZMIN = 5, TILE_ZMAX = 10, TILE_SHOW_FROM = 4.5;
/* nomi e posizioni dell'etichetta scritti a mano (le piastrelle non hanno testo); anchor 'l' = etichetta a destra del punto */
const NAME = {'mar-mediterraneo': 'Mar Mediterraneo\n(Mar Grande)', 'mar-morto': 'Mar Morto\n(Mar Salato)', 'samaria-regione': 'Samaria'};
const LABEL_AT = {giudea: {lat: 31.82, lon: 34.72}, canaan: {lat: 32.15, lon: 35.1}, 'mar-mediterraneo': {lat: 32.2, lon: 33.9}, giordano: {lat: 32.3, lon: 35.64, anchor: 'l'}, 'mar-morto': {lat: 31.3, lon: 35.74, anchor: 'l'}, 'mar-di-galilea': {lat: 32.62, lon: 35.62, anchor: 'l'}, galilea: {lat: 33.05, lon: 35.3}, filistia: {lat: 31.55, lon: 34.45}, negheb: {lat: 30.95, lon: 34.85}, moab: {lat: 31.3, lon: 35.85}, galaad: {lat: 32.2, lon: 35.82}, ammon: {lat: 31.85, lon: 36.05}, basan: {lat: 32.75, lon: 36.0}, decapoli: {lat: 32.45, lon: 35.75}};
const TIER1 = new Set(['gerusalemme']);
const TIER2 = new Set(['nazaret', 'betlemme', 'cafarnao', 'roma', 'damasco', 'antiochia-di-siria', 'efeso', 'corinto', 'atene', 'babilonia', 'ninive', 'menfi', 'alessandria', 'gerico', 'sichem', 'ebron', 'tiro', 'sidone', 'cesarea', 'betania', 'bersabea', 'giaffa', 'tarso', 'filippi', 'tessalonica', 'tiberiade', 'betel', 'silo', 'cana', 'ur-dei-caldei', 'caran']);
const BOUNDS = {x0: nx(-14), x1: nx(64), y0: ny(50), y1: ny(8)};
const BOOST = new Set(['gerusalemme', 'nazaret', 'betlemme', 'cafarnao', 'roma', 'damasco', 'antiochia-di-siria', 'efeso', 'corinto', 'atene', 'babilonia', 'ninive', 'menfi', 'sinai', 'mar-di-galilea', 'giordano',
  'mar-morto', 'mar-mediterraneo', 'egitto', 'galilea', 'giudea', 'samaria-regione', 'tarso', 'filippi', 'tessalonica', 'cesarea', 'gerico', 'sichem', 'ebron', 'betania', 'tiro', 'sidone', 'alessandria', 'cipro', 'creta', 'malta', 'patmos', 'ur-dei-caldei', 'caran', 'nilo', 'eufrate', 'monte-ermon', 'monte-carmelo', 'monte-tabor', 'bersabea', 'betel', 'silo', 'giaffa', 'mar-rosso', 'moab', 'edom', 'cana', 'tiberiade', 'siracusa']);
const LABEL_ONLY = new Set(['mar-di-galilea', 'mar-morto', 'mar-mediterraneo', 'mar-rosso', 'giordano', 'nilo', 'eufrate', 'tigri', 'fiume-chebar', 'torrente-arnon', 'torrente-iabboc', 'torrente-chison']);
const DOT_VAR = {città: 'var(--accent)', monte: 'var(--d3)', acqua: 'var(--d2)', luogo: 'var(--d1)', isola: 'var(--d5)', valle: 'var(--d3)'};

const svg = (tag, attrs = {}, ...kids) => { const e = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); e.append(...kids); return e; };
const el = (tag, cls, attrs = {}) => { const e = document.createElement(tag); if (cls) e.className = cls; for (const [k, v] of Object.entries(attrs)) k === 'text' ? e.textContent = v : e.setAttribute(k, v); return e; };
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

/* Periodo di un luogo dai suoi riferimenti: at / vangeli / atti */
export function periodsOf(place, bible) {
  const out = new Set();
  for (const r of place.riferimenti_chiave || []) {
    const p = bible.parseRef(r) || bible.parseRef(String(r).replace(/[-–]\d+,.*$/, ''));
    if (!p) continue;
    const id = bible.sectionOf(p.book)?.id;
    out.add(p.book < 39 ? 'at' : id === 'vangeli' ? 'vangeli' : 'atti');
  }
  return out;
}

export function createMap({places, bible, onSelect, reduceMotion = false}) {
  const view = {x: nx(35.2), y: ny(31.97), z: 6.9};
  let W = 0, H = 0, dirty = true, raf = 0, filter = {period: 'tutti', tipo: 'tutti'}, selected = null, layout = [], tileTimer = 0, anim = 0;
  const pointers = new Map();
  let gesture = null;
  const tiles = new Map();                         // chiave → img
  const tileState = {loaded: 0, errors: 0, failed: false};
  const meta = new Map();                          // id → {p, prio, per:Set, node, dot, lbl}

  /* ---------- struttura ---------- */
  const root = el('div', 'f-mondo-map', {role: 'application', tabindex: '0', 'aria-label': 'Mappa del mondo della Bibbia. Trascina per spostare, pizzica o usa più e meno per ingrandire.'});
  const hatch = svg('pattern', {id: 'f-mondo-hatch', width: '9', height: '9', patternUnits: 'userSpaceOnUse'}, svg('path', {d: 'M-1 10L10 -1M-1 1L1 -1M8 10L10 8', class: 'f-mondo-hatchline'}));
  const defs = svg('defs', {}, hatch);
  const land = svg('rect', {class: 'f-mondo-land', width: '100%', height: '100%'});
  const hatchRect = svg('rect', {class: 'f-mondo-hatchfill', width: '100%', height: '100%', fill: 'url(#f-mondo-hatch)'});
  const world = svg('g', {class: 'f-mondo-world'});
  const sea = d => svg('path', {d, class: 'f-mondo-sea'});
  world.append(sea(pathOf(MEDITERRANEO)), sea(pathOf(MARE_NERO)), sea(pathOf(MAR_ROSSO)), sea(pathOf(GOLFO_PERSICO)),
    ...ISOLE.map(pts => svg('path', {d: pathOf(pts), class: 'f-mondo-isle'})),
    ...Object.values(FIUMI).map(pts => svg('path', {d: pathOf(pts, false), class: 'f-mondo-river'})),
    ...Object.values(LAGHI).map(pts => svg('path', {d: pathOf(pts), class: 'f-mondo-lake'})));
  const draw = svg('svg', {class: 'f-mondo-draw', 'aria-hidden': 'true', focusable: 'false'}, defs, land, hatchRect, world);
  const tileBox = el('div', 'f-mondo-tiles', {'aria-hidden': 'true'});
  const ptsBox = el('div', 'f-mondo-pts');
  const mkBtn = (cls, label, txt) => { const b = el('button', 'f-mondo-btn ' + cls, {type: 'button', 'aria-label': label}); b.textContent = txt; return b; };
  const bPlus = mkBtn('plus', 'Ingrandisci', '+'), bMinus = mkBtn('minus', 'Riduci', '−'), bHome = mkBtn('home', 'Torna alla Terra Santa', '⌖');
  const ctl = el('div', 'f-mondo-ctl'); ctl.append(bPlus, bMinus, bHome);
  /* la riga con l'attribuzione e l'avviso sta SOTTO la mappa, non sopra: non copre mai i nomi */
  const attr = el('a', 'f-mondo-attr', {href: 'https://www.arcgis.com/home/item.html?id=9c5370d0b54f4de1b48a3792d7dbd62c', target: '_blank', rel: 'noopener noreferrer', hidden: ''});
  attr.textContent = ATTRIBUTION();
  const hint = el('span', 'f-mondo-offline', {hidden: '', role: 'status'}); hint.textContent = 'Mappa disegnata (senza rete)';
  const foot = el('div', 'f-mondo-foot', {hidden: ''}); foot.append(attr, hint);
  const wrap = el('div', 'f-mondo-wrap'); wrap.append(root, foot);
  root.append(draw, tileBox, ptsBox, ctl);

  /* ---------- punti ---------- */
  places.forEach((p, i) => {
    const per = periodsOf(p, bible);
    const prio = (BOOST.has(p.id) ? 100 : 0) + (p.riferimenti_chiave?.length || 0) * 3 + (p.tipo === 'città' ? 2 : 0) - (p.tipo === 'regione' ? 1 : 0) - i * 0.001;
    const labelOnly = p.tipo === 'regione' || LABEL_ONLY.has(p.id);
    const at = LABEL_AT[p.id], name = NAME[p.id] || p.nome_it, lines = name.split('\n');
    const tier = TIER1.has(p.id) ? 1 : TIER2.has(p.id) ? 2 : 3;
    const node = el('div', 'f-mondo-pt' + (p.tipo === 'regione' ? ' reg' : labelOnly ? ' wat' : ' t' + tier) + (at?.anchor === 'l' ? ' al' : ''), {hidden: '', 'data-id': p.id});
    node.style.setProperty('--pc', DOT_VAR[p.tipo] || 'var(--accent)');
    const dot = labelOnly ? null : el('i', 'f-mondo-dot' + (p.posizione_approssimata ? ' apx' : ''));
    const lbl = el('span', 'f-mondo-lbl', {text: name});
    if (dot) node.append(dot); node.append(lbl);
    ptsBox.append(node);
    const minZ = labelOnly ? 0 : BOOST.has(p.id) ? 0 : (p.riferimenti_chiave?.length || 0) >= 4 ? 7.6 : 8.6;
    const cw = p.tipo === 'regione' ? 9.4 : labelOnly ? 7 : tier === 1 ? 9.6 : tier === 2 ? 7.6 : 6.6;
    const maxLen = Math.max(...lines.map(l => l.length));
    meta.set(p.id, {p, prio, per, labelOnly, node, minZ, tier, left: at?.anchor === 'l', lh: lines.length * (p.tipo === 'regione' ? 18 : labelOnly ? 16 : tier === 1 ? 24 : tier === 2 ? 20 : 18), dx: tier === 1 ? 14 : tier === 2 ? 11 : 9,
      wx: nx(at?.lon ?? p.lon), wy: ny(at?.lat ?? p.lat), px: nx(p.lon), py: ny(p.lat), w: maxLen * cw + 10, vis: false});
  });
  const order = [...meta.values()].sort((a, b) => b.prio - a.prio);
  const allowed = m => (filter.period === 'tutti' || m.per.has(filter.period)) && (filter.tipo === 'tutti' || (filter.tipo === 'città' ? m.p.tipo === 'città' : filter.tipo === 'monti' ? m.p.tipo === 'monte' : filter.tipo === 'acque' ? m.p.tipo === 'acqua' : filter.tipo === 'regioni' ? m.p.tipo === 'regione' : true));

  /* ---------- rendering ---------- */
  const Wz = () => WORLD * 2 ** view.z;
  const toScreen = (wx, wy) => { const s = Wz(); return [(wx - view.x) * s + W / 2, (wy - view.y) * s + H / 2]; };
  const invalidate = () => { dirty = true; if (!raf) raf = requestAnimationFrame(frame); };

  function frame() {
    raf = 0; if (!dirty) return; dirty = false;
    if (!W || !H) return;
    const s = Wz(), k = s / BASE, tx = W / 2 - view.x * s, ty = H / 2 - view.y * s;
    world.setAttribute('transform', `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k})`);
    hatch.setAttribute('patternTransform', `translate(${(tx % 9).toFixed(2)} ${(ty % 9).toFixed(2)})`);
    layoutPoints(s);
    positionTiles(s);
    scheduleTiles();
  }

  function layoutPoints(s) {
    const placed = [], pad = 30, maxShown = Math.round(clamp(8 + (view.z - 3.4) * 10, 10, 110));
    layout = []; let shown = 0;
    const rectHit = (r) => placed.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]);
    const list = selected && meta.get(selected) ? [meta.get(selected), ...order.filter(m => m.p.id !== selected)] : order;
    for (const m of order) m.vis = false;
    for (const m of list) {
      const force = m.p.id === selected;
      let vis = false, sx = 0, sy = 0, lr = null, dr = null;
      if (force || (shown < maxShown && allowed(m) && view.z >= m.minZ && !(m.p.tipo === 'regione' && view.z > 9.6))) {
        [sx, sy] = toScreen(m.wx, m.wy);
        if (sx > -pad && sx < W + pad && sy > -pad && sy < H + pad) {
          const hh = m.lh / 2;
          lr = m.left ? [sx + 6, sy - hh, sx + 6 + m.w, sy + hh] : m.p.tipo === 'regione' || m.labelOnly ? [sx - m.w / 2, sy - hh, sx + m.w / 2, sy + hh] : [sx + m.dx, sy - hh, sx + m.dx + m.w, sy + hh];
          dr = m.labelOnly ? null : [sx - 7, sy - 7, sx + 7, sy + 7];
          const edge = lr[0] < 3 || lr[2] > W - 3 || lr[1] < 2 || lr[3] > H - 2;   // un'etichetta tagliata dal bordo non si mostra
          if (force) vis = true;
          else if (!(edge || rectHit(lr) || (dr && rectHit(dr)))) vis = true;
          else if (dr && !m.labelOnly && !rectHit(dr) && view.z >= 8.5) { lr = null; vis = true; }   // punto senza etichetta
        }
      }
      if (vis) {
        if (lr) placed.push(lr); if (dr) placed.push(dr);
        shown++;
        m.sx = sx; m.sy = sy; m.lr = lr; m.hasLabel = Boolean(lr);
        layout.push(m);
      }
      m.vis = vis;
    }
    for (const m of order) {
      const n = m.node;
      if (m.vis) {
        n.hidden = false; n.style.transform = `translate(${m.sx.toFixed(1)}px,${m.sy.toFixed(1)}px)`;
        n.classList.toggle('nolbl', !m.hasLabel);
        n.classList.toggle('sel', m.p.id === selected);
      } else if (!n.hidden) n.hidden = true;
    }
  }

  /* ---------- piastrelle OpenStreetMap ---------- */
  const online = () => navigator.onLine !== false && !tileState.failed;
  const tileZ = () => clamp(Math.round(view.z), TILE_ZMIN, TILE_ZMAX);
  const tilesWanted = () => view.z >= TILE_SHOW_FROM && online();

  function positionTiles(s) {
    const tx = W / 2 - view.x * s, ty = H / 2 - view.y * s;
    for (const [key, img] of tiles) {
      const [z, x, y] = key.split('/').map(Number), sc = 2 ** (view.z - z) * WORLD;
      img.style.transform = `translate(${(tx + x / 2 ** z * s).toFixed(2)}px,${(ty + y / 2 ** z * s).toFixed(2)}px)`;
      img.style.width = img.style.height = (sc + 0.6).toFixed(2) + 'px';
    }
  }
  function scheduleTiles() { clearTimeout(tileTimer); tileTimer = setTimeout(syncTiles, 140); }
  function syncTiles() {
    const want = tilesWanted();
    tileBox.hidden = !want;
    if (!want) { for (const img of tiles.values()) img.remove(); tiles.clear(); setTilesOn(false); hint.hidden = online(); footSync(); return; }
    if (!W || !H) return;
    const zi = tileZ(), n = 2 ** zi, s = Wz();
    const x0 = Math.floor((view.x - W / 2 / s) * n), x1 = Math.floor((view.x + W / 2 / s) * n), y0 = Math.floor((view.y - H / 2 / s) * n), y1 = Math.floor((view.y + H / 2 / s) * n);
    const need = new Set();
    for (let x = x0; x <= x1; x++) for (let y = Math.max(0, y0); y <= Math.min(n - 1, y1); y++) {
      const xx = ((x % n) + n) % n, key = zi + '/' + xx + '/' + y;
      need.add(key);
      if (!tiles.has(key)) {
        const img = el('img', 'f-mondo-tile', {alt: '', draggable: 'false', decoding: 'async', referrerpolicy: 'origin'});
        img.addEventListener('load', () => { tileState.loaded++; tileState.errors = 0; img.classList.add('ok'); setTilesOn(true); purge(); });
        img.addEventListener('error', () => { tileState.errors++; img.remove(); tiles.delete(key); if (!tileState.loaded && tileState.errors >= 3) { tileState.failed = true; syncTiles(); } });
        img.src = TILE_URL(zi, xx, y);
        tiles.set(key, img); tileBox.append(img);
      }
    }
    root._need = need;
    positionTiles(s);
    setTimeout(() => purge(true), 900);
  }
  /* toglie le piastrelle di zoom vecchi quando quelle nuove sono pronte (o dopo un po') */
  function purge(late) {
    const need = root._need; if (!need) return;
    const ready = [...need].every(k => tiles.get(k)?.classList.contains('ok'));
    if (!ready && late !== true) return;
    for (const [key, img] of tiles) if (!need.has(key)) { img.remove(); tiles.delete(key); }
  }
  function setTilesOn(on) {
    root.classList.toggle('tiles-on', on && online());
    attr.textContent = ATTRIBUTION(); attr.href = cartoKey() ? 'https://www.openstreetmap.org/copyright' : 'https://www.arcgis.com/home/item.html?id=9c5370d0b54f4de1b48a3792d7dbd62c';
    attr.hidden = !(on && online());
    hint.hidden = online();
    footSync();
  }
  function footSync() { foot.hidden = attr.hidden && hint.hidden; }
  /* cambio tema: le piastrelle chiare e scure sono diverse */
  const themeObs = new MutationObserver(() => { for (const img of tiles.values()) img.remove(); tiles.clear(); tileState.loaded = 0; syncTiles(); });
  themeObs.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
  function resetTiles() { tileState.failed = false; tileState.errors = 0; syncTiles(); invalidate(); }
  addEventListener('online', resetTiles);
  addEventListener('offline', () => { syncTiles(); });

  /* ---------- vista ---------- */
  function setView(x, y, z) {
    view.z = clamp(z, Z_MIN, Z_MAX);
    view.x = clamp(x, BOUNDS.x0, BOUNDS.x1); view.y = clamp(y, BOUNDS.y0, BOUNDS.y1);
    invalidate();
  }
  function zoomAt(sx, sy, dz) {
    const s0 = Wz(), wx = view.x + (sx - W / 2) / s0, wy = view.y + (sy - H / 2) / s0;
    const z = clamp(view.z + dz, Z_MIN, Z_MAX), s1 = WORLD * 2 ** z;
    setView(wx - (sx - W / 2) / s1, wy - (sy - H / 2) / s1, z);
  }
  function flyTo(lon, lat, z, instant) {
    cancelAnimationFrame(anim);
    const x1 = nx(lon), y1 = ny(lat), z1 = z ?? view.z;
    if (instant || reduceMotion || !W) { setView(x1, y1, z1); return; }
    const x0 = view.x, y0 = view.y, z0 = view.z, t0 = performance.now(), dur = 420;
    const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - (1 - k) ** 3; setView(x0 + (x1 - x0) * e, y0 + (y1 - y0) * e, z0 + (z1 - z0) * e); if (k < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  }
  const home = () => flyTo(35.2, 31.97, W < 500 ? 6.9 : 7.6);

  /* ---------- gesti ---------- */
  const pos = e => { const r = root.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  root.addEventListener('pointerdown', e => {
    if (e.target.closest('.f-mondo-ctl, .f-mondo-attr')) return;
    cancelAnimationFrame(anim);
    try { root.setPointerCapture(e.pointerId); } catch { /* ok */ }
    pointers.set(e.pointerId, pos(e));
    gesture = pointers.size === 1 ? {start: pos(e), t: performance.now(), moved: false} : {...(gesture || {}), moved: true, multi: true};
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; gesture.d = Math.hypot(a[0] - b[0], a[1] - b[1]); }
  });
  root.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    const p = pos(e), old = pointers.get(e.pointerId);
    pointers.set(e.pointerId, p);
    if (pointers.size === 1) {
      const dx = p[0] - old[0], dy = p[1] - old[1];
      if (!gesture.moved && Math.hypot(p[0] - gesture.start[0], p[1] - gesture.start[1]) > 7) gesture.moved = true;
      if (gesture.moved) { const s = Wz(); setView(view.x - dx / s, view.y - dy / s, view.z); }
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (gesture.d > 0 && d > 0) zoomAt(mx, my, Math.log2(d / gesture.d));
      gesture.d = d;
    }
  });
  const endPointer = e => {
    if (!pointers.has(e.pointerId)) return;
    const wasSingle = pointers.size === 1; pointers.delete(e.pointerId);
    try { root.releasePointerCapture(e.pointerId); } catch { /* ok */ }
    if (e.type === 'pointerup' && wasSingle && gesture && !gesture.moved && !gesture.multi && performance.now() - gesture.t < 600) tap(...pos(e));
    if (!pointers.size) gesture = null;
    else if (pointers.size === 1) { gesture = {...gesture, start: [...pointers.values()][0], moved: true, multi: true}; }
  };
  root.addEventListener('pointerup', endPointer); root.addEventListener('pointercancel', endPointer);
  root.addEventListener('wheel', e => { e.preventDefault(); const [x, y] = pos(e); zoomAt(x, y, -e.deltaY * (e.deltaMode ? 0.05 : 0.0022) * (e.ctrlKey ? 3 : 1)); }, {passive: false});
  root.addEventListener('dblclick', e => { if (e.target.closest('.f-mondo-ctl')) return; const [x, y] = pos(e); zoomAt(x, y, 1); });
  root.addEventListener('keydown', e => {
    const s = Wz(), step = 80 / s;
    const k = {ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step]}[e.key];
    if (k) { e.preventDefault(); setView(view.x + k[0], view.y + k[1], view.z); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomAt(W / 2, H / 2, 0.5); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomAt(W / 2, H / 2, -0.5); }
  });
  bPlus.addEventListener('click', () => flyTo(...centerLL(), view.z + 1));
  bMinus.addEventListener('click', () => flyTo(...centerLL(), view.z - 1));
  bHome.addEventListener('click', home);
  function centerLL() { return [view.x * 360 - 180, Math.atan(Math.sinh(Math.PI * (1 - 2 * view.y))) * 180 / Math.PI]; }

  /* tocco: il punto o l'etichetta più vicini */
  function tap(sx, sy) {
    let best = null, bd = 1e9;
    for (const m of layout) {
      let d = 1e9;
      if (!m.labelOnly) d = Math.hypot(m.sx - sx, m.sy - sy) - 0;
      if (m.lr && sx >= m.lr[0] - 6 && sx <= m.lr[2] + 6 && sy >= m.lr[1] - 10 && sy <= m.lr[3] + 10) d = Math.min(d, 8);
      if (d < 24 && d < bd) { bd = d; best = m; }
    }
    if (best) { select(best.p.id); onSelect?.(best.p); }
  }
  function select(id) { selected = id; invalidate(); }

  /* ---------- ridimensionamento ---------- */
  const ro = new ResizeObserver(() => { const r = root.getBoundingClientRect(); if (r.width === W && r.height === H) return; const first = !W; W = r.width; H = r.height; if (first && W) home(); invalidate(); });
  ro.observe(root);

  return {
    el: wrap,
    setFilter(f) { filter = {...filter, ...f}; invalidate(); },
    select, selectedId: () => selected,
    flyToPlace(id, z) { const m = meta.get(id); if (!m) return; selected = id; flyTo(m.p.lon, m.p.lat, z ?? Math.max(view.z, m.p.tipo === 'regione' ? 7 : 9)); },
    home, resize() { ro.disconnect(); ro.observe(root); const r = root.getBoundingClientRect(); if (r.width) { W = r.width; H = r.height; } invalidate(); syncTiles(); },
    retryTiles: resetTiles,
    view: () => ({...view}), state: () => ({tiles: tiles.size, loaded: tileState.loaded, failed: tileState.failed, shown: layout.length, tilesOn: root.classList.contains('tiles-on')}),
    setZoom(z) { setView(view.x, view.y, z); },
    destroy() { ro.disconnect(); themeObs.disconnect(); removeEventListener('online', resetTiles); },
  };
}
