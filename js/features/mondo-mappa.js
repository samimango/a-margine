/* Mappa interattiva di «Mondo della Bibbia»: mappa vettoriale disegnata (SVG, sempre disponibile offline) + piastrelle SENZA etichette (Esri World Shaded Relief; CARTO nolabels se c'è una chiave) quando c'è rete. I nomi sono SOLO i nostri, in italiano. Proiezione Web Mercator per tutto. Zoom/pan con dita (pointer events, pinch), rotella, tastiera.
   Nessuna libreria. Caricato solo quando serve (import dinamico da mondo.js). */
import {MEDITERRANEO, MARE_NERO, MAR_ROSSO, GOLFO_PERSICO, FIUMI, LAGHI, AREE, BASE, WORLD, nx, ny, pathOf, levelBounds, labelCandidates} from './mondo-geo.js';
import {TERRA} from './mondo-terra.js';
/* costa vera (Natural Earth 1:50m): il mare è lo sfondo, la terra è un solo percorso con regola evenodd (i buchi sono laghi e mari interni) */
const LAND_D = TERRA.map(poly => poly.map(ring => pathOf(ring)).join('')).join('');
/* mari di sfondo usati solo per scegliere dove scrivere le etichette (non disegnati) */
const SEA = [MEDITERRANEO, MARE_NERO, MAR_ROSSO, GOLFO_PERSICO];
const AREA_POLY = Object.fromEntries(AREE.map(a => [a.id, a.poligono]));

/* un solo colore per livello: le aree di uno stesso livello si distinguono dal contorno, non dal colore */
const LV_COLOR = {terra: '#9a7a4c', tribu: '#6f7d58', regni: '#8a5d52', popoli: '#5d6b84'};
/* nodi delle aree: un nodo per (area, livello); id = id dell'area, con suffisso se compare in più livelli */
const AREA_NODES = [];
{ const cnt = {}; for (const a of AREE) for (const lv of a.livelli) { cnt[lv] = (cnt[lv] ?? -1) + 1; const first = lv === a.livelli[0];
    AREA_NODES.push({...a, id: first ? a.id : a.id + '-' + lv, areaId: a.id, livello: lv, tipo: 'regione', nome_it: a.nome, lat: a.ancora[1], lon: a.ancora[0], riferimenti_chiave: a.rif, color: LV_COLOR[lv]}); } }

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
/* rilievo: spento di default; la scelta resta in localStorage */
const RELIEF_KEY = 'margine.mondo.rilievo';
const reliefSaved = () => { try { return localStorage.getItem(RELIEF_KEY) === '1'; } catch { return false; } };
/* inquadratura iniziale: Israele antico (lon/lat del centro); lo zoom dipende dalla larghezza */
const HOME = {lon: 35.25, lat: 31.5};
const homeZ = w => w < 500 ? 7.5 : 7.6;
const KM_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000];
/* con un livello regionale attivo solo queste città si vedono (più Gerusalemme); le altre compaiono da zoom 8,2 */
/* importanza 1–5 per luogo: 5 Gerusalemme, 4 le città principali e i mari di base (visibili anche a riposo), 3 e sotto solo con lo zoom */
const IMP5 = new Set(['gerusalemme']);
const IMP4 = new Set(['betlemme', 'nazaret', 'cafarnao', 'gerico', 'ebron', 'cesarea', 'tiro', 'mar-mediterraneo', 'mar-morto', 'mar-di-galilea', 'giordano']);
/* zoom da cui un luogo di importanza 1–3 compare */
const IMP_ZOOM = {5: 0, 4: 0, 3: 7.6, 2: 8.6, 1: 9.4};
const MAIN_CITIES = {
  terra: ['nazaret', 'cafarnao', 'tiro', 'sidone', 'cesarea', 'betlemme'],
  tribu: ['sichem', 'silo', 'betel', 'gerico', 'ebron', 'bersabea'],
  regni: ['samaria-citta', 'sichem', 'betel', 'dan', 'ebron', 'damasco'],
  popoli: ['damasco', 'gaza', 'rabba-degli-ammoniti', 'tiro', 'sidone', 'cesarea'],
};
const CITY_ZOOM_FULL = 8.2;
/* nomi e posizioni dell'etichetta scritti a mano (le piastrelle non hanno testo); anchor 'l' = etichetta a destra del punto */
const NAME = {'mar-mediterraneo': 'Mar Mediterraneo\n(Mar Grande)', 'mar-morto': 'Mar Morto\n(Mar Salato)', 'mar-di-galilea': 'Mar di\nGalilea', iturea: 'Iturea e\nTraconitide', 'manasse-est': 'Manasse\n(est)', 'manasse-ovest': 'Manasse\n(ovest)', 'dan-nord': 'Dan\n(nord)', 'regno-israele': 'Regno di\nIsraele', 'regno-giuda': 'Regno di\nGiuda', 'aram': 'Aram\n(Damasco)'};
const LABEL_AT = {giudea: {lat: 31.82, lon: 34.72}, canaan: {lat: 32.15, lon: 35.1}, 'mar-mediterraneo': {lat: 31.9, lon: 33.85}, 'mar-rosso': {lat: 27.4, lon: 35.1, anchor: 'l'}, giordano: {lat: 32.3, lon: 35.64, anchor: 'l'}, 'mar-morto': {lat: 30.9, lon: 35.62, anchor: 'l'}, 'mar-di-galilea': {lat: 32.6, lon: 35.66, anchor: 'l'}, galilea: {lat: 33.05, lon: 35.3}, filistia: {lat: 31.55, lon: 34.45}, negheb: {lat: 30.95, lon: 34.85}, moab: {lat: 31.3, lon: 35.85}, galaad: {lat: 32.2, lon: 35.82}, ammon: {lat: 31.85, lon: 36.05}, basan: {lat: 32.75, lon: 36.0}, decapoli: {lat: 32.45, lon: 35.75}};
/* posizioni alternative per l'etichetta di un mare o di un lago, se la prima è occupata: la prima libera vince */
const LABEL_ALT = {'mar-di-galilea': [{lat: 32.45, lon: 35.66, anchor: 'l'}, {lat: 32.84, lon: 35.71, anchor: 'l'}]};
const TIER1 = new Set(['gerusalemme']);
const impOf = p => IMP5.has(p.id) ? 5 : IMP4.has(p.id) ? 4 : (p.tipo === 'città' && ((p.riferimenti_chiave?.length || 0) >= 4)) ? 3 : (p.riferimenti_chiave?.length || 0) >= 3 ? 2 : 1;
const TIER2 = new Set(['nazaret', 'betlemme', 'cafarnao', 'roma', 'damasco', 'antiochia-di-siria', 'efeso', 'corinto', 'atene', 'babilonia', 'ninive', 'menfi', 'alessandria', 'gerico', 'sichem', 'ebron', 'tiro', 'sidone', 'cesarea', 'betania', 'bersabea', 'giaffa', 'tarso', 'filippi', 'tessalonica', 'tiberiade', 'betel', 'silo', 'cana', 'ur-dei-caldei', 'caran']);
const BOUNDS = {x0: nx(-14), x1: nx(64), y0: ny(50), y1: ny(8)};
const BOOST = new Set(['gerusalemme', 'nazaret', 'betlemme', 'cafarnao', 'roma', 'damasco', 'antiochia-di-siria', 'efeso', 'corinto', 'atene', 'babilonia', 'ninive', 'menfi', 'sinai', 'mar-di-galilea', 'giordano',
  'mar-morto', 'mar-mediterraneo', 'egitto', 'galilea', 'giudea', 'samaria-regione', 'tarso', 'filippi', 'tessalonica', 'cesarea', 'gerico', 'sichem', 'ebron', 'betania', 'tiro', 'sidone', 'alessandria', 'cipro', 'creta', 'malta', 'patmos', 'ur-dei-caldei', 'caran', 'nilo', 'eufrate', 'monte-ermon', 'monte-carmelo', 'monte-tabor', 'bersabea', 'betel', 'silo', 'giaffa', 'mar-rosso', 'moab', 'edom', 'cana', 'tiberiade', 'siracusa']);
const LABEL_ONLY = new Set(['mar-di-galilea', 'mar-morto', 'mar-mediterraneo', 'mar-rosso', 'giordano', 'nilo', 'eufrate', 'tigri', 'fiume-chebar', 'torrente-arnon', 'torrente-iabboc', 'torrente-chison']);
const DOT_VAR = {città: 'var(--m-ink2)', monte: 'var(--m-ink2)', acqua: 'var(--m-river)', luogo: 'var(--m-ink2)', isola: 'var(--m-ink2)', valle: 'var(--m-ink2)'};
/* forma del simbolo per tipo: città cerchio pieno, monte triangolo, acqua goccia */
const KIND = {città: 'k-cit', monte: 'k-mon', acqua: 'k-acq', luogo: 'k-luo', isola: 'k-iso', valle: 'k-val'};

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
  const view = {x: nx(HOME.lon), y: ny(HOME.lat), z: homeZ(0)};
  let W = 0, H = 0, dirty = true, raf = 0, filter = {period: 'tutti', tipo: 'tutti'}, selected = null, layout = [], tileTimer = 0, anim = 0;
  const pointers = new Map();
  let gesture = null;
  const tiles = new Map();                         // chiave → img
  const tileState = {loaded: 0, errors: 0, failed: false};
  const meta = new Map();                          // id → {p, prio, per:Set, node, dot, lbl}
  const warmed = [];                               // immagini precaricate a basso zoom (tengono viva la cache del browser)

  /* ---------- struttura ---------- */
  const root = el('div', 'f-mondo-map', {role: 'application', tabindex: '0', 'aria-label': 'Mappa del mondo della Bibbia. Trascina per spostare, pizzica o usa più e meno per ingrandire.'});
  const sea0 = svg('rect', {class: 'f-mondo-seabg', width: '100%', height: '100%'});
  const world = svg('g', {class: 'f-mondo-world'});
  /* ordine di disegno: sfondo (mare), poi la terra con la sua costa, le aree (ritagliate sulla terra), fiumi e laghi.
     Le piastrelle del rilievo stanno tra lo sfondo e la terra: con il rilievo acceso la terra diventa semitrasparente */
  const clipId = 'f-mondo-clip', maskId = 'f-mondo-mask';
  const landP = svg('path', {d: LAND_D, class: 'f-mondo-land-p'});
  const shore = svg('path', {d: LAND_D, class: 'f-mondo-shore', 'clip-path': `url(#${clipId})`});
  const coast = svg('path', {d: LAND_D, class: 'f-mondo-coast'});
  /* maschera delle aree: terra (bianco) meno laghi e mari interni (nero). Con il Levante dettagliato si scambia il riquadro */
  const mBox = svg('rect', {fill: 'none'}), mLev = svg('path', {fill: 'none', 'fill-rule': 'evenodd'});
  const maskEl = svg('mask', {id: maskId, maskUnits: 'userSpaceOnUse', x: -BASE, y: -BASE, width: 3 * BASE, height: 3 * BASE},
    svg('path', {d: LAND_D, fill: '#fff', 'fill-rule': 'evenodd'}), mBox, mLev,
    ...Object.values(LAGHI).map(pts => svg('path', {d: pathOf(pts, true, true), fill: '#000'})));
  /* aree dei livelli: visibili solo quello attivo (CSS su data-livello); la più grande sta sotto */
  const areaEls = AREA_NODES.filter(a => a.poligono).map(a => svg('path', {d: pathOf(a.poligono, true, true), class: `f-mondo-area lv-${a.livello} certezza-${a.certezza}`, 'data-area': a.id, style: `--ac:${a.color}`}));
  world.append(landP, shore, coast, svg('g', {mask: `url(#${maskId})`}, ...areaEls),
    ...Object.values(FIUMI).map(pts => svg('path', {d: pathOf(pts, false, true), class: 'f-mondo-river'})),
    ...Object.values(LAGHI).map(pts => svg('path', {d: pathOf(pts, true, true), class: 'f-mondo-lake'})));
  /* livelli: sfondo e piastrelle sotto; sopra, terra, aree, fiumi e laghi, sempre visibili */
  const drawBase = svg('svg', {class: 'f-mondo-draw f-mondo-base', 'aria-hidden': 'true', focusable: 'false'}, sea0);
  const drawTop = svg('svg', {class: 'f-mondo-draw f-mondo-top', 'aria-hidden': 'true', focusable: 'false'}, svg('defs', {}, svg('clipPath', {id: clipId}, svg('path', {d: LAND_D, 'clip-rule': 'evenodd'})), maskEl), world);
  /* Levante a precisione maggiore: caricato in modo pigro (mondo-terra-levante.js) solo da zoom 7,5; sotto, resta la costa a 50m */
  const LEV_ZOOM = 7.5;
  let levReq = false, levEls = null, levOn = null;
  function loadLevante() {
    if (levReq) return; levReq = true;
    import('./mondo-terra-levante.js').then(({TERRA_LEVANTE, LEV_BOX}) => {
      const d = TERRA_LEVANTE.map(poly => poly.map(ring => pathOf(ring)).join('')).join('');
      const X0 = nx(LEV_BOX.x0) * BASE, X1 = nx(LEV_BOX.x1) * BASE, Y0 = ny(LEV_BOX.y1) * BASE, Y1 = ny(LEV_BOX.y0) * BASE;
      const box = svg('rect', {x: X0, y: Y0, width: X1 - X0, height: Y1 - Y0, class: 'f-mondo-seabg'});
      const lp = svg('path', {d, class: 'f-mondo-land-p'}), lc = svg('path', {d, class: 'f-mondo-coast'});
      const lclip = svg('clipPath', {id: 'f-mondo-clip-lev'}, svg('path', {d, 'clip-rule': 'evenodd'}));
      const ls = svg('path', {d, class: 'f-mondo-shore', 'clip-path': 'url(#f-mondo-clip-lev)'});
      drawTop.querySelector('defs').append(lclip);
      coast.after(box, ls, lp, lc);
      mBox.setAttribute('x', X0); mBox.setAttribute('y', Y0); mBox.setAttribute('width', X1 - X0); mBox.setAttribute('height', Y1 - Y0);
      mLev.setAttribute('d', d);
      levEls = [box, ls, lp, lc];
      setLev(Boolean(levOn));
      invalidate();
    }).catch(() => { /* senza il file resta la costa a 50m */ });
  }
  /* accende o spegne il Levante dettagliato (terra, costa, riquadro di mare e maschera delle aree) */
  function setLev(on) {
    levOn = on;
    if (!levEls) return;
    levEls.forEach(e => { e.style.display = on ? '' : 'none'; });
    mBox.setAttribute('fill', on ? '#000' : 'none'); mLev.setAttribute('fill', on ? '#fff' : 'none');
  }
  const tileBox = el('div', 'f-mondo-tiles', {'aria-hidden': 'true'});
  const ptsBox = el('div', 'f-mondo-pts');
  const mkBtn = (cls, label, txt) => { const b = el('button', 'f-mondo-btn ' + cls, {type: 'button', 'aria-label': label, title: label}); b.textContent = txt; return b; };
  const bPlus = mkBtn('plus', 'Ingrandisci', '+'), bMinus = mkBtn('minus', 'Riduci', '−'), bHome = mkBtn('home', 'Posizione iniziale: Terra Santa', '⌖');
  const ctl = el('div', 'f-mondo-ctl'); ctl.append(bHome, bMinus, bPlus);
  /* barra di scala in km, in basso a sinistra */
  const scale = el('div', 'f-mondo-scale', {'aria-hidden': 'true'}); const scaleBar = el('i'), scaleTxt = el('span'); scale.append(scaleBar, scaleTxt);
  /* la riga con l'attribuzione e l'avviso sta SOTTO la mappa, non sopra: non copre mai i nomi */
  const attr = el('a', 'f-mondo-attr', {href: 'https://www.arcgis.com/home/item.html?id=9c5370d0b54f4de1b48a3792d7dbd62c', target: '_blank', rel: 'noopener noreferrer', hidden: ''});
  attr.textContent = ATTRIBUTION();
  const hint = el('span', 'f-mondo-offline', {hidden: '', role: 'status'}); hint.textContent = 'Mappa disegnata (senza rete)';
  const foot = el('div', 'f-mondo-foot', {hidden: ''}); foot.append(attr, hint);
  const wrap = el('div', 'f-mondo-wrap'); wrap.append(root, foot);
  let relief = reliefSaved();
  const bRel = el('button', 'f-mondo-rel', {type: 'button', 'aria-pressed': String(relief), 'aria-label': 'Mostra il rilievo', title: 'Rilievo'}); bRel.textContent = 'Rilievo';
  root.classList.toggle('rilievo', relief);
  root.append(drawBase, tileBox, drawTop, ptsBox, scale, ctl, bRel);
  root.dataset.livello = 'nessuno';

  /* ---------- punti ---------- */
  const ITEMS = [...places.filter(p => p.tipo !== 'regione'), ...AREA_NODES];
  ITEMS.forEach((p, i) => {
    const per = p.livello ? new Set() : periodsOf(p, bible);
    const prio = p.livello ? -5 : (BOOST.has(p.id) ? 100 : 0) + (p.riferimenti_chiave?.length || 0) * 3 + (p.tipo === 'città' ? 2 : 0) - (p.tipo === 'regione' ? 1 : 0) - i * 0.001;
    const labelOnly = p.tipo === 'regione' || LABEL_ONLY.has(p.id);
    const at = p.livello ? null : LABEL_AT[p.id], name = NAME[p.id] || p.nome_it, lines = name.split('\n');
    const tier = TIER1.has(p.id) ? 1 : TIER2.has(p.id) ? 2 : 3;
    const kind = p.tipo === 'regione' ? 'reg' : labelOnly ? 'wat' : KIND[p.tipo] || 'k-cit';
    const node = el('div', `f-mondo-pt ${kind} t${labelOnly && p.tipo !== 'regione' ? 0 : tier}` + (at?.anchor === 'l' ? ' al' : '') + (p.livello ? ' lv-' + p.livello : ''), {hidden: '', 'data-id': p.id});
    node.style.setProperty('--pc', DOT_VAR[p.tipo] || 'var(--accent)');
    const dot = labelOnly ? null : el('i', 'f-mondo-dot' + (p.posizione_approssimata ? ' apx' : ''));
    const lbl = el('span', 'f-mondo-lbl', {text: name});
    if (dot) node.append(dot); node.append(lbl);
    ptsBox.append(node);
    /* la soglia di zoom sta in levelShown (per importanza), non qui */
    const minZ = 0, imp = p.livello ? 5 : impOf(p);
    const cw = p.tipo === 'regione' ? 10 : labelOnly ? 7 : tier === 1 ? 9.6 : tier === 2 ? 7.6 : 6.6;
    const maxLen = Math.max(...lines.map(l => l.length));
    /* prima l'ancora dell'area (di norma il centro migliore), poi gli altri punti interni */
    const cands = p.livello ? [[p.lon, p.lat], ...(AREA_POLY[p.areaId] ? labelCandidates(AREA_POLY[p.areaId], SEA) : [])] : null;
    meta.set(p.id, {p, cands, prio, per, labelOnly, node, minZ, imp, tier, left: at?.anchor === 'l', lh: lines.length * (p.tipo === 'regione' ? 18 : labelOnly ? 16 : tier === 1 ? 24 : tier === 2 ? 20 : 18), dx: tier === 1 ? 14 : tier === 2 ? 11 : 9,
      wx: nx(at?.lon ?? p.lon), wy: ny(at?.lat ?? p.lat), alts: (LABEL_ALT[p.id] || []).map(a => [nx(a.lon), ny(a.lat)]), px: nx(p.lon), py: ny(p.lat), w: maxLen * cw + 10, vis: false});
  });
  const order = [...meta.values()].sort((a, b) => b.prio - a.prio);
  /* a riposo (livello «Nessuno») compare per importanza: 5 e 4 sempre, 3–1 da uno zoom crescente.
     Con un livello regionale attivo restano visibili solo le sue città principali (le altre da zoom 8,2). */
  const levelShown = m => {
    if (m.p.livello) return true;
    if (filter.livello !== 'nessuno') return m.p.tipo !== 'città' || view.z >= CITY_ZOOM_FULL || m.p.id === 'gerusalemme' || (MAIN_CITIES[filter.livello] || []).includes(m.p.id);
    return view.z >= IMP_ZOOM[m.imp];
  };
  const allowed = m => m.p.livello ? m.p.livello === filter.livello : (filter.period === 'tutti' || m.per.has(filter.period)) && (filter.tipo === 'tutti' || (filter.tipo === 'città' ? m.p.tipo === 'città' : filter.tipo === 'monti' ? m.p.tipo === 'monte' : filter.tipo === 'acque' ? m.p.tipo === 'acqua' : true)) && levelShown(m);

  /* ---------- rendering ---------- */
  const Wz = () => WORLD * 2 ** view.z;
  const toScreen = (wx, wy) => { const s = Wz(); return [(wx - view.x) * s + W / 2, (wy - view.y) * s + H / 2]; };
  const invalidate = () => { dirty = true; if (!raf) raf = requestAnimationFrame(frame); };
  /* zone occupate dai controlli: le etichette non ci finiscono sopra */
  const reserved = () => W ? [[W - 8 - 132, H - 8 - 44, W - 8, H - 8], [12, H - 12 - 26, 162, H - 12], [8, 8, 90, 40]] : [];

  function frame() {
    raf = 0; if (!dirty) return; dirty = false;
    if (!W || !H) return;
    if (view.z >= LEV_ZOOM) { if (!levReq) loadLevante(); else if (levOn !== true && levEls) setLev(true); }
    else if (levOn && levEls) setLev(false);
    const s = Wz(), k = s / BASE, tx = W / 2 - view.x * s, ty = H / 2 - view.y * s;
    world.setAttribute('transform', `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k})`);
    layoutPoints(s);
    positionTiles(s);
    updateScale();
    scheduleTiles();
  }

  function layoutPoints(s) {
    const placed = reserved(), pad = 30, maxShown = Math.round(clamp(8 + (view.z - 3.4) * 10, 14, 110));
    layout = []; let shown = 0;
    const rectHit = (r) => placed.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]);
    /* con pochi nomi (Terra, Regni, Popoli) le aree prevalgono sulle città minori; con le tribù, molte, prevalgono le città */
    const areasFirst = true;
    const base = areasFirst
      ? [...order.filter(m => m.p.id === 'gerusalemme'), ...order.filter(m => m.p.livello), ...order.filter(m => !m.p.livello && m.p.id !== 'gerusalemme')]
      : [...order.filter(m => m.p.id === 'gerusalemme'), ...order.filter(m => !m.p.livello && m.p.id !== 'gerusalemme'), ...order.filter(m => m.p.livello)];
    const list = selected && meta.get(selected) ? [meta.get(selected), ...base.filter(m => m.p.id !== selected)] : base;
    for (const m of order) m.vis = false;
    for (const m of list) {
      const force = m.p.id === selected;
      let vis = false, sx = 0, sy = 0, lr = null, dr = null;
      if (m.p.livello) {
        /* un'area: il primo punto interno al poligono dove la sua etichetta sta libera (mai fuori dall'area) */
        if (allowed(m) && view.z >= m.minZ) {
          const hh = m.lh / 2, w2 = m.w / 2, Z = Wz();
          for (const [lo, la] of m.cands) {
            const cx = (nx(lo) - view.x) * Z + W / 2, cy = (ny(la) - view.y) * Z + H / 2;
            const r = [cx - w2, cy - hh, cx + w2, cy + hh];
            if (r[0] < 3 || r[2] > W - 3 || r[1] < 2 || r[3] > H - 2 || rectHit(r)) continue;
            sx = cx; sy = cy; lr = r; vis = true; break;
          }
        }
      } else if (force || (shown < maxShown && allowed(m) && view.z >= m.minZ && !(m.p.tipo === 'regione' && view.z > 9.6))) {
        [sx, sy] = toScreen(m.wx, m.wy);
        if (m.alts.length && !force) {
          /* se l'etichetta principale non ha posto, prova le alternative (l'ancora resta sul mare o sul lago) */
          for (const [ax, ay] of [[m.wx, m.wy], ...m.alts]) {
            const [tx, ty] = toScreen(ax, ay), r2 = [tx + 6, ty - m.lh / 2, tx + 6 + m.w, ty + m.lh / 2];
            if (!rectHit(r2) && r2[2] < W - 4) { sx = tx; sy = ty; break; }
          }
        }
        /* un nome di mare o di fiume non si taglia al bordo: se l'ancora è fuori vista, si riporta dentro */
        if (m.labelOnly && /^mar-(mediterraneo|morto|di-galilea)$/.test(m.p.id)) {   /* i mari si riportano dentro la vista; fiumi e altro fuori vista restano nascosti */
          const hh1 = m.lh / 2;
          sx = m.left ? clamp(sx, 4, W - m.w - 10) : clamp(sx, m.w / 2 + 4, W - m.w / 2 - 4);
          sy = clamp(sy, hh1 + 4, H - hh1 - 56);
        }
        if (sx > -pad && sx < W + pad && sy > -pad && sy < H + pad) {
          const hh = m.lh / 2;
          lr = m.left ? [sx + 6, sy - hh, sx + 6 + m.w, sy + hh] : m.p.tipo === 'regione' || m.labelOnly ? [sx - m.w / 2, sy - hh, sx + m.w / 2, sy + hh] : [sx + m.dx, sy - hh, sx + m.dx + m.w, sy + hh];
          dr = m.labelOnly ? null : [sx - 7, sy - 7, sx + 7, sy + 7];
          const edge = lr[0] < 3 || lr[2] > W - 3 || lr[1] < 2 || lr[3] > H - 2;   // un'etichetta tagliata dal bordo non si mostra
          if (force) vis = true;
          else if (!(edge || rectHit(lr) || (dr && rectHit(dr)))) vis = true;
        }
      }
      if (vis) {
        if (lr) placed.push(lr); if (dr) placed.push(dr);
        if (!m.p.livello) shown++;
        m.sx = sx; m.sy = sy; m.lr = lr; m.hasLabel = Boolean(lr);
        layout.push(m);
      }
      m.vis = vis;
    }
    for (const m of order) {
      const n = m.node;
      if (m.vis) {
        n.hidden = false;
        const tr = `translate(${m.sx.toFixed(1)}px,${m.sy.toFixed(1)}px)`;
        if (n._tr !== tr) { n.style.transform = tr; n._tr = tr; }
        n.classList.toggle('nolbl', !m.hasLabel);
        n.classList.toggle('sel', m.p.id === selected);
      } else if (!n.hidden) n.hidden = true;
    }
  }

  /* barra di scala: km per pixel alla latitudine del centro (Mercatore, cerchio massimo 40 075 km) */
  let scaleKey = '';
  function updateScale() {
    const lat = centerLL()[1];
    const kmpx = 40075.016 * Math.cos(lat * Math.PI / 180) / Wz();
    let L = KM_STEPS[0];
    for (const k of KM_STEPS) if (k / kmpx <= 110) L = k;
    const key = L + '|' + Math.round(L / kmpx);
    if (key === scaleKey) return;
    scaleKey = key;
    scaleBar.style.width = Math.round(L / kmpx) + 'px';
    scaleTxt.textContent = L + ' km';
  }

  /* ---------- piastrelle (Esri senza nomi, o CARTO con chiave) ---------- */
  const online = () => navigator.onLine !== false && !tileState.failed;
  const tileZ = () => clamp(Math.round(view.z), TILE_ZMIN, TILE_ZMAX);
  const tilesWanted = () => relief && view.z >= TILE_SHOW_FROM && online();

  function positionTiles(s) {
    const tx = W / 2 - view.x * s, ty = H / 2 - view.y * s;
    for (const [key, img] of tiles) {
      const [z, x, y] = key.split('/').map(Number), sc = 2 ** (view.z - z) * WORLD;
      const tr = `translate(${(tx + x / 2 ** z * s).toFixed(2)}px,${(ty + y / 2 ** z * s).toFixed(2)}px)`;
      if (img._tr !== tr) { img.style.transform = tr; img._tr = tr; }
      const sz = (sc + 0.6).toFixed(2) + 'px';
      if (img._sz !== sz) { img.style.width = img.style.height = sz; img._sz = sz; }
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
  /* a riposo, scalda la cache delle piastrelle dell'area biblica a zoom 5 e 7 (le due scale più usate) */
  function warmTiles() {
    if (!relief || !online() || cartoKey()) return;
    const idle = window.requestIdleCallback || (f => setTimeout(f, 300));
    idle(() => {
      for (const z of [5, 7]) {
        const n = 2 ** z, cx = Math.floor(nx(HOME.lon) * n), cy = Math.floor(ny(HOME.lat) * n);
        for (let x = cx - 2; x <= cx + 2; x++) for (let y = Math.max(0, cy - 2); y <= Math.min(n - 1, cy + 2); y++) {
          const im = new Image(); im.referrerPolicy = 'origin'; im.src = TILE_URL(z, ((x % n) + n) % n, y); warmed.push(im);
        }
      }
    }, {timeout: 4000});
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
  const home = () => flyTo(HOME.lon, HOME.lat, homeZ(W));
  /* zoom e centro che fanno riempire la mappa al livello: il massimo che racchiude tutte le sue aree */
  function fitLevel(lv) {
    const b = levelBounds(lv), padX = 36, padY = 36;
    const zx = Math.log2((W - padX) * 360 / (WORLD * Math.max(b.x1 - b.x0, 0.01)));
    const zy = Math.log2((H - padY) / (WORLD * Math.max(ny(b.y0) - ny(b.y1), 1e-4)));
    const cy = (ny(b.y0) + ny(b.y1)) / 2;
    return [(b.x0 + b.x1) / 2, Math.atan(Math.sinh(Math.PI * (1 - 2 * cy))) * 180 / Math.PI, clamp(Math.min(zx, zy), Z_MIN, Z_MAX)];
  }

  /* ---------- gesti ---------- */
  const pos = e => { const r = root.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  root.addEventListener('pointerdown', e => {
    if (e.target.closest('.f-mondo-ctl, .f-mondo-attr, .f-mondo-rel')) return;
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
  /* interruttore del rilievo: spento, le piastrelle non vengono richieste affatto */
  bRel.addEventListener('click', () => {
    relief = !relief;
    try { localStorage.setItem(RELIEF_KEY, relief ? '1' : '0'); } catch { /* ok */ }
    bRel.setAttribute('aria-pressed', String(relief));
    root.classList.toggle('rilievo', relief);
    tileState.failed = false; tileState.errors = 0; tileState.loaded = 0;
    for (const img of tiles.values()) img.remove();
    tiles.clear();
    if (relief) warmTiles();
    syncTiles(); invalidate();
  });
  function centerLL() { return [view.x * 360 - 180, Math.atan(Math.sinh(Math.PI * (1 - 2 * view.y))) * 180 / Math.PI]; }

  /* tocco: il punto o l'etichetta più vicini */
  function tap(sx, sy) {
    /* prima le aree: il nome di una regione, se toccato, vince su una città vicina */
    const area = layout.find(m => m.p.livello && m.lr && sx >= m.lr[0] - 6 && sx <= m.lr[2] + 6 && sy >= m.lr[1] - 8 && sy <= m.lr[3] + 8);
    if (area) { select(area.p.id); onSelect?.(area.p); return; }
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
  const ro = new ResizeObserver(() => { const r = root.getBoundingClientRect(); if (r.width === W && r.height === H) return; const first = !W; W = r.width; H = r.height; if (first && W) { view.z = homeZ(W); home(); } invalidate(); });
  ro.observe(root);
  setTimeout(warmTiles, 1500);

  return {
    el: wrap,
    setFilter(f) {
      const before = filter.livello;
      filter = {...filter, ...f}; root.dataset.livello = filter.livello || 'nessuno';
      /* cambiando livello si inquadra la sua area (lo zoom resta quello dell'utente se il livello è «Nessuno») */
      if (filter.livello !== before && filter.livello !== 'nessuno' && W) { const [lo, la, z] = fitLevel(filter.livello); flyTo(lo, la, z); }
      invalidate();
    },
    select, selectedId: () => selected,
    flyToPlace(id, z) { const m = meta.get(id); if (!m) return; selected = id; flyTo(m.p.lon, m.p.lat, z ?? Math.max(view.z, m.p.tipo === 'regione' ? 7 : 9)); },
    home, resize() { ro.disconnect(); ro.observe(root); const r = root.getBoundingClientRect(); if (r.width) { W = r.width; H = r.height; } invalidate(); syncTiles(); },
    retryTiles: resetTiles,
    view: () => ({...view}), state: () => ({tiles: tiles.size, loaded: tileState.loaded, failed: tileState.failed, shown: layout.length, tilesOn: root.classList.contains('tiles-on')}),
    setZoom(z) { setView(view.x, view.y, z); },
    destroy() { ro.disconnect(); themeObs.disconnect(); removeEventListener('online', resetTiles); },
  };
}
