/* Dati e utilità sulla Bibbia: nomi, sigle, capitoli, sezioni, stile delle copertine, parser dei riferimenti.
   Gli indici dei libri (0–65) sono quelli dell'app precedente e NON devono cambiare: sono salvati negli id delle note. */

export const names = 'Genesi|Esodo|Levitico|Numeri|Deuteronomio|Giosuè|Giudici|Rut|1 Samuele|2 Samuele|1 Re|2 Re|1 Cronache|2 Cronache|Esdra|Neemia|Ester|Giobbe|Salmi|Proverbi|Ecclesiaste|Cantico dei Cantici|Isaia|Geremia|Lamentazioni|Ezechiele|Daniele|Osea|Gioele|Amos|Abdia|Giona|Michea|Naum|Abacuc|Sofonia|Aggeo|Zaccaria|Malachia|Matteo|Marco|Luca|Giovanni|Atti|Romani|1 Corinzi|2 Corinzi|Galati|Efesini|Filippesi|Colossesi|1 Tessalonicesi|2 Tessalonicesi|1 Timoteo|2 Timoteo|Tito|Filemone|Ebrei|Giacomo|1 Pietro|2 Pietro|1 Giovanni|2 Giovanni|3 Giovanni|Giuda|Apocalisse'.split('|');
export const counts = [50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22];
export const abbr = 'Gn Es Lv Nm Dt Gs Gdc Rt 1Sam 2Sam 1Re 2Re 1Cr 2Cr Esd Ne Est Gb Sal Pr Ec Ct Is Ger Lam Ez Dn Os Gl Am Abd Gio Mi Na Ab Sof Ag Zc Ml Mt Mc Lc Gv At Rm 1Cor 2Cor Gal Ef Fil Col 1Ts 2Ts 1Tm 2Tm Tt Fm Eb Gc 1Pt 2Pt 1Gv 2Gv 3Gv Gd Ap'.split(' ');
export const MAX_VERSE = 176;
export const colorNames = ['Giallo', 'Blu', 'Verde', 'Rosa', 'Viola'];
export const defaultLabels = ['Com’è Dio', 'Evento', 'Promessa', 'Preghiera', 'Insegnamento'];

export const isBook = b => Number.isInteger(b) && b >= 0 && b < names.length;
export const testamentOf = b => b < 39 ? 0 : 1;

/* ---------- Sezioni ---------- */
export const SECTIONS = [
  {id: 'pentateuco', label: 'Pentateuco', from: 0, to: 4},
  {id: 'storici', label: 'Storici', from: 5, to: 16},
  {id: 'poetici', label: 'Poetici e sapienziali', from: 17, to: 21},
  {id: 'profeti-maggiori', label: 'Profeti maggiori', from: 22, to: 26},
  {id: 'profeti-minori', label: 'Profeti minori', from: 27, to: 38},
  {id: 'vangeli', label: 'Vangeli', from: 39, to: 42},
  {id: 'atti', label: 'Atti', from: 43, to: 43},
  {id: 'paolo', label: 'Lettere di Paolo', from: 44, to: 56},
  {id: 'generali', label: 'Lettere generali', from: 57, to: 64},
  {id: 'apocalisse', label: 'Apocalisse', from: 65, to: 65},
];
export const sectionOf = b => SECTIONS.find(s => b >= s.from && b <= s.to);
export const testamentLabel = t => t ? 'Nuovo Testamento' : 'Antico Testamento';

/* ---------- Stile: colore d'accento e simbolo per libro ---------- */
export const PALETTES = {
  n: {name: 'blu notte',   c1: '#233252', c2: '#0f182c', ac: '#e6c880'},
  t: {name: 'petrolio',    c1: '#35545c', c2: '#1a2f36', ac: '#d6e6e0'},
  o: {name: 'ocra',        c1: '#b08030', c2: '#7a5518', ac: '#f6e6b8'},
  r: {name: 'terracotta',  c1: '#b45c3a', c2: '#7c3420', ac: '#f6dcc4'},
  s: {name: 'ardesia',     c1: '#4a5663', c2: '#2a323c', ac: '#dfe5ea'},
  g: {name: 'salvia',      c1: '#6d8062', c2: '#43563b', ac: '#eaf0d6'},
  d: {name: 'oro antico',  c1: '#a8833a', c2: '#6e5420', ac: '#f4e2ae'},
  b: {name: 'bordeaux',    c1: '#722c39', c2: '#461a24', ac: '#f0d2b8'},
  k: {name: 'notte',       c1: '#2c2314', c2: '#120e07', ac: '#cba653'},
};
/* palette:simbolo per ognuno dei 66 libri */
const STYLE = ('n:star t:waves o:tablets r:tent s:scroll s:column b:scales g:tree d:lyre d:crown o:crown r:flame n:scroll n:column t:scroll s:column b:crown ' +
  's:scales g:lyre o:tree d:scales b:dove d:scroll b:tablets s:flame t:flame n:star b:tree o:flame g:scales s:column t:waves g:scroll r:column n:scroll o:flame d:column n:star r:flame ' +
  'b:scales s:dove g:tree r:flame n:flame s:column o:column o:scroll r:scroll b:scroll g:scroll t:scroll n:scroll n:scroll d:scroll d:scroll s:scroll g:scroll t:tablets o:scales s:column s:crown r:dove r:tree r:scroll b:flame k:crown').split(' ');
export const SYMBOLS = ['star', 'waves', 'tablets', 'tent', 'scroll', 'column', 'scales', 'tree', 'lyre', 'crown', 'flame', 'dove'];
export function bookStyle(b) {
  const [p, sym] = (STYLE[b] || 'r:flame').split(':');
  return {...PALETTES[p], palette: p, sym};
}

/* ---------- Id delle note: «libro.cap.da.a[.uuid]» o «free.<uuid>» ---------- */
export function bounds(id) { const [, , from, to] = id.split('.'); return [Number(from), Number(to ?? from)]; }
export function ref(id) {
  if (id.startsWith('free.')) return 'Meditazione libera';
  const [book, ch, start, end] = id.split('.');
  const base = names[book] + ' ' + ch;
  if (start === '0') return base + ' · Capitolo';
  return base + ',' + start + (end && end !== start ? '–' + end : '');
}
export const shortRefOfId = id => {
  if (id.startsWith('free.')) return 'Libera';
  const [book, ch, start, end] = id.split('.');
  if (start === '0') return abbr[book] + ' ' + ch;
  return abbr[book] + ' ' + ch + ',' + start + (end && end !== start ? '–' + end : '');
};
export const bmRef = m => names[m[0]] + ' ' + m[1] + ',' + m[2];
/* Riferimento nella forma usata da LaParola.net per un capitolo */
export const lapRef = (b, c) => counts[b] === 1 ? names[b] : names[b] + ' ' + c;

/* Capitolo successivo/precedente; null ai due estremi della Bibbia */
export function step(b, c, d) {
  let book = b, ch = c + d;
  if (ch > counts[b]) { book++; ch = 1; }
  if (ch < 1) { book--; if (book >= 0) ch = counts[book]; }
  return book >= 0 && book < names.length ? [book, ch] : null;
}

/* ---------- Parser dei riferimenti («gv 3,16», «1 cor 13», «sal 23:1-4») ---------- */
export const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[.\s'’]/g, '');
const EXTRA = {
  0: 'gen genesi', 1: 'esodo', 2: 'lev levitico', 3: 'num numeri', 4: 'deut deuteronomio', 5: 'gios giosue', 6: 'giud giudici', 7: 'rut',
  8: '1sa 1samuele', 9: '2sa 2samuele', 10: '1regni 1r', 11: '2regni 2r', 12: '1cron 1cronache', 13: '2cron 2cronache', 14: 'esdra', 15: 'nee neemia', 16: 'ester',
  17: 'giobbe', 18: 'salmo salmi sl', 19: 'prov proverbi', 20: 'eccl ecclesiaste qo qoelet', 21: 'cant cantico canticodeicantici', 22: 'isaia', 23: 'geremia', 24: 'lamentazioni',
  25: 'ezechiele', 26: 'dan daniele', 27: 'osea', 28: 'gioele', 29: 'amos', 30: 'abdia', 31: 'giona', 32: 'mic michea', 33: 'naum', 34: 'abacuc', 35: 'sofonia', 36: 'aggeo',
  37: 'zac zaccaria', 38: 'mal malachia', 39: 'matt matteo', 40: 'mar marco', 41: 'luc luca', 42: 'giov giovanni', 43: 'atti', 44: 'rom romani', 45: '1co 1corinzi', 46: '2co 2corinzi',
  47: 'galati', 48: 'efesini', 49: 'filippesi', 50: 'colossesi', 51: '1tes 1tessalonicesi', 52: '2tes 2tessalonicesi', 53: '1tim 1timoteo', 54: '2tim 2timoteo', 55: 'tito',
  56: 'filem filemone', 57: 'ebr ebrei', 58: 'giac giacomo', 59: '1pi 1pietro', 60: '2pi 2pietro', 61: '1giov 1giovanni', 62: '2giov 2giovanni', 63: '3giov 3giovanni', 64: 'giuda', 65: 'apoc apocalisse',
};
const ALIAS = new Map();
names.forEach((n, i) => {
  for (const a of [norm(n), norm(abbr[i]), ...EXTRA[i].split(' ')]) if (!ALIAS.has(a)) ALIAS.set(a, i);
});
const NAMES_NORM = names.map(norm);

/* Libro da un testo («gv», «1 cor», «giov», «cantico»); -1 se non c'è o è ambiguo */
export function findBook(text) {
  const q = norm(text);
  if (!q) return -1;
  if (ALIAS.has(q)) return ALIAS.get(q);
  if (q.length < 3 && !/^[123]/.test(q)) return -1;
  if (q.length < 4 && /^[123]/.test(q)) return -1;
  const hits = NAMES_NORM.map((n, i) => n.startsWith(q) ? i : -1).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
}
/* Elenco di libri che iniziano come il testo (per i suggerimenti) */
export function matchBooks(text, max = 6) {
  const q = norm(text);
  if (!q) return [];
  const out = new Set();
  if (ALIAS.has(q)) out.add(ALIAS.get(q));
  names.forEach((n, i) => { if (NAMES_NORM[i].startsWith(q) || norm(abbr[i]) === q) out.add(i); });
  return [...out].slice(0, max);
}
const REF_RE = /^\s*((?:[123]\s*)?[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ.'’ ]*?)\s*(?:(\d{1,3})(?:\s*[,:.]\s*(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?)?)?\s*$/;
/* → {book, ch, v1, v2} oppure null. v1/v2 sono null se non indicati; v2 vale sempre v1 se non c'è un intervallo. */
export function parseRef(text) {
  const m = REF_RE.exec(String(text || ''));
  if (!m) return null;
  const book = findBook(m[1]);
  if (book < 0) return null;
  let ch = m[2] === undefined ? null : Number(m[2]);
  let v1 = m[3] === undefined ? null : Number(m[3]);
  let v2 = m[4] === undefined ? null : Number(m[4]);
  if (counts[book] === 1 && ch !== null && v1 === null) { v1 = ch; ch = 1; }   // «Giuda 5» = versetto 5
  if (ch === null) ch = 1;
  if (ch < 1 || ch > counts[book]) return null;
  if (v1 !== null && (v1 < 1 || v1 > MAX_VERSE)) return null;
  if (v2 !== null && (v2 < (v1 ?? 1) || v2 > MAX_VERSE)) return null;
  return {book, ch, v1, v2: v1 === null ? null : (v2 ?? v1)};
}
export function fmtRef(r, short = false) {
  const name = short ? abbr[r.book] : names[r.book];
  let s = name + ' ' + r.ch;
  if (r.v1 != null) s += ',' + r.v1 + (r.v2 != null && r.v2 !== r.v1 ? '–' + r.v2 : '');
  return s;
}
