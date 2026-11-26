/* Copertine dei libri in SVG, edizione classica: solo tipografia. Niente icone, simboli, scene o ornamenti centrali.
   Otto tinte profonde, una per genere; ±4% di luminosità per libro. Tela con tessitura fine, doppio filetto, dorso a nervature.
   Nessuna immagine esterna: tutto il markup è costruito solo da dati interni (nomi dei libri), mai da input utente. */
import {names, abbr} from './bible.js';

export const GENRES = [
  {id: 'legge', label: 'Legge', from: 0, to: 4, c: '#1f2c4d'},            // blu notte
  {id: 'storia', label: 'Storia', from: 5, to: 16, c: '#5e1f2b'},          // bordeaux
  {id: 'poesia', label: 'Poesia e sapienza', short: 'Poesia', from: 17, to: 21, c: '#1c4a3e'},   // verde bottiglia
  {id: 'profeti', label: 'Profeti', from: 22, to: 38, c: '#6e5019'},        // ocra scuro
  {id: 'vangeli', label: 'Vangeli', from: 39, to: 42, c: '#43274b'},       // prugna
  {id: 'atti', label: 'Atti', from: 43, to: 43, c: '#384450'},             // ardesia
  {id: 'lettere', label: 'Lettere', from: 44, to: 64, c: '#173f47'},       // petrolio
  {id: 'apocalisse', label: 'Apocalisse', from: 65, to: 65, c: '#27272c'}, // antracite
];
export const genreOf = b => GENRES.find(g => b >= g.from && b <= g.to) || GENRES[0];
const ACCENT = '#d9bd7e';   // oro opaco: unico accento
const INK = '#f1e8d4';      // avorio per i titoli
const SERIF = `Cardo,'Crimson Text',Georgia,serif`;
const WIDTH = .78;          // larghezza media di una maiuscola con spaziatura, in em
/* abbreviazioni usate solo quando il titolo intero non sta leggibile sulla copertina */
const SHORT = {'Deuteronomio': 'Deut.', 'Lamentazioni': 'Lam.', 'Ecclesiaste': 'Eccl.', 'Tessalonicesi': 'Tess.', 'Apocalisse': 'Apoc.', 'Filippesi': 'Filipp.', 'Cantico dei Cantici': 'Cantico'};

const cache = new Map();
let uid = 0;
const f1 = n => +n.toFixed(1), f2 = n => +n.toFixed(2);
export const ROMAN = n => { let r = ''; for (const [v, s] of [[50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (n >= v) { r += s; n -= v; } return r; };

/* k da -.04 a +.04: schiarisce (k>0) o scurisce (k<0) il colore esadecimale */
function tone(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const ch = sh => { const c = (n >> sh) & 255; return Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k)); };
  return '#' + [16, 8, 0].map(sh => Math.max(0, Math.min(255, ch(sh))).toString(16).padStart(2, '0')).join('');
}
const variant = b => ((b * 7) % 9 - 4) / 100;   // ±4% per libro, deterministico

/* colore di fondo del libro, usato anche da barre e indicatori fuori dalla copertina */
export const tintOf = b => tone(genreOf(b).c, variant(b));

/* righe del titolo: maiuscole, spezzate in due solo se lunghe e con una parola di separazione */
function splitLines(name) {
  const up = name.toUpperCase(), words = up.split(' ');
  if (up.length <= 10 || words.length < 2) return [up];
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' '), z = words.slice(i).join(' ');
    const m = Math.max(a.length, z.length);
    if (!best || m < best.m) best = {m, lines: [a, z]};
  }
  return best.lines;
}
/* dimensione e righe: se il titolo intero resta sotto la soglia, usa l'abbreviazione */
function layoutTitle(b, avail, maxSize, minSize) {
  let name = names[b], prefix = '';
  const m = name.match(/^([123]) (.+)$/);
  if (m) { prefix = ROMAN(+m[1]) + ' '; name = m[2]; }
  /* con il prefisso («I RE», «II CORINZI») il titolo sta su una sola riga, anche abbreviato */
  const fit = lines => avail / (Math.max(...lines.map(l => l.length)) * WIDTH);
  let lines = prefix ? [(prefix + name).toUpperCase()] : splitLines(name), size = Math.min(maxSize, fit(lines));
  if (size < minSize && SHORT[name]) { lines = [prefix + SHORT[name].toUpperCase()]; size = Math.min(maxSize, fit(lines)); }
  return {prefix: '', lines, size};
}

/* opts: {w,h,title,r,hero,symx,symy,syms} → stringa SVG. Il titolo appare sempre; il genere solo da 100 px in su. */
export function coverSvg(b, {w = 76, h = 108, title = true, r = 4, hero = false, symx, symy, syms} = {}) {
  const mini = title === 'arabic';   // copertina piccola: solo il numero arabo grande
  const key = [b, w, h, title, r, hero, symx, symy, syms].join('|');
  if (cache.has(key)) return cache.get(key).replace(/__U__/g, 'c' + (++uid));
  const g = genreOf(b), c1 = tintOf(b), c2 = tone(g.c, variant(b) - .16), num = ROMAN(b + 1);
  let o = `<svg xmlns="http://www.w3.org/2000/svg" class="cover-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" style="display:block;border-radius:${r}px">`;
  o += `<defs><linearGradient id="g__U__" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`;
  o += `<pattern id="t__U__" width="3" height="3" patternUnits="userSpaceOnUse"><path d="M0 .5H3M.5 0V3" stroke="#fff" stroke-opacity=".035" stroke-width=".5" fill="none"/></pattern>`;
  o += `<linearGradient id="v__U__" x1="0" y1="0" x2="0" y2="1"><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".24"/></linearGradient>`;
  o += `<linearGradient id="s__U__" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".38"/><stop offset=".72" stop-color="#000" stop-opacity=".08"/><stop offset=".93" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>`;
  o += `</defs><rect width="${w}" height="${h}" fill="url(#g__U__)"/><rect width="${w}" height="${h}" fill="url(#t__U__)"/><rect width="${w}" height="${h}" fill="url(#v__U__)"/>`;

  if (hero) {   // sfondo largo: solo il numero romano, grande e tenue, a destra
    const S = Math.min(syms ?? 1e9, w * .8, h * 1.2), X = Math.min(symx ?? w * .72, w - S / 2 - 6), Y = Math.max(symy ?? h * .45, S * .3);
    o += `<text x="${f2(X)}" y="${f2(Y + S * .2)}" text-anchor="middle" font-family="${SERIF}" font-size="${f2(S * .62)}" fill="${ACCENT}" fill-opacity=".14">${num}</text>`;
    o += '</svg>';
    cache.set(key, o);
    return o.replace(/__U__/g, 'c' + (++uid));
  }

  const spw = f1(Math.max(5, w * .12)), fw = w - spw, cx = spw + fw / 2, lw = Math.max(.4, w / 200);
  /* fronte: doppio filetto */
  const p = f1(fw * .085), gi = f1(Math.max(1.6, fw * .03));
  o += `<rect x="${f1(spw + p)}" y="${p}" width="${f1(fw - 2 * p)}" height="${f1(h - 2 * p)}" fill="none" stroke="${ACCENT}" stroke-opacity=".85" stroke-width="${f2(lw)}"/>`;
  o += `<rect x="${f1(spw + p + gi)}" y="${f1(p + gi)}" width="${f1(fw - 2 * (p + gi))}" height="${f1(h - 2 * (p + gi))}" fill="none" stroke="${ACCENT}" stroke-opacity=".5" stroke-width="${f2(lw * .6)}"/>`;
  if (mini) {   // numero arabo grande al centro della fronte
    const ms = fw * .5;
    o += `<text x="${f2(cx)}" y="${f2(h * .5 + ms * .34)}" text-anchor="middle" font-family="${SERIF}" font-weight="700" font-size="${f2(ms)}" fill="${INK}">${b + 1}</text>`;
  }
  if (title === true) {
    const inner = fw - 2 * (p + gi), avail = inner - fw * .1;
    const ns = Math.min(fw * .11, 10), ny = h * .2;
    o += `<text x="${f2(cx)}" y="${f2(ny)}" text-anchor="middle" font-family="${SERIF}" font-size="${f2(ns)}" letter-spacing="${f2(ns * .15)}" fill="${ACCENT}" fill-opacity=".95">${num}</text>`;
    o += `<rect x="${f2(cx - fw * .1)}" y="${f2(h * .25)}" width="${f2(fw * .2)}" height="${f2(Math.max(.4, lw * .6))}" fill="${ACCENT}" fill-opacity=".7"/>`;
    const L = layoutTitle(b, avail, fw * .22, w * .08);
    const lines = (L.prefix ? [{t: L.prefix, s: L.size * .7}] : []).concat(L.lines.map(t => ({t, s: L.size})));
    const total = lines.reduce((x, l) => x + l.s * 1.22, 0);
    let y = h * .5 - total / 2;
    for (const l of lines) {
      const base = y + l.s * 1.22 * .78;
      o += `<text x="${f2(cx)}" y="${f2(base)}" text-anchor="middle" font-family="${SERIF}" font-weight="700" font-size="${f2(l.s)}" letter-spacing="${f2(l.s * .06)}" fill="${INK}">${l.t}</text>`;
      y += l.s * 1.22;
    }
    if (w >= 100) {   // genere in piccole maiuscole, solo sulle copertine grandi
      const gl = (g.short || g.label).toUpperCase(), gs = w * .05;
      o += `<rect x="${f2(cx - fw * .12)}" y="${f2(h * .8)}" width="${f2(fw * .24)}" height="${f2(Math.max(.4, lw * .5))}" fill="${ACCENT}" fill-opacity=".6"/>`;
      o += `<text x="${f2(cx)}" y="${f2(h * .8 + gs * 2.1)}" text-anchor="middle" font-family="${SERIF}" font-weight="700" font-size="${f2(gs)}" letter-spacing="${f2(gs * .2)}" fill="${ACCENT}">${gl}</text>`;
    }
  }

  /* dorso: nervature a coppie, sigla in verticale, cerniera */
  o += `<rect width="${spw}" height="${h}" fill="url(#s__U__)"/>`;
  for (const y of [.1, .16, .84, .9]) o += `<rect x="${f1(spw * .18)}" y="${f1(h * y)}" width="${f1(spw * .64)}" height="${f2(lw * .8)}" fill="${ACCENT}" fill-opacity=".75"/>`;
  const sg = (abbr[b] || '').toUpperCase(), fs = Math.min(spw * .55, h * .5 / (sg.length * .8));
  o += `<text transform="translate(${f1(spw * .5)} ${f1(h * .5)}) rotate(-90)" x="0" y="${f2(fs * .34)}" text-anchor="middle" font-family="${SERIF}" font-weight="700" font-size="${f2(fs)}" letter-spacing="${f2(fs * .1)}" fill="${ACCENT}" fill-opacity=".9">${sg}</text>`;
  o += `<rect x="${f2(spw - .6)}" width=".6" height="${h}" fill="#000" fill-opacity=".35"/><rect x="${spw}" width=".5" height="${h}" fill="#fff" fill-opacity=".12"/>`;
  o += '</svg>';
  cache.set(key, o);
  return o.replace(/__U__/g, 'c' + (++uid));
}

/* Elemento <span class="cover"> pronto da inserire (ombra e bordo chiaro li dà il CSS) */
export function cover(b, opts = {}) {
  const el = document.createElement('span');
  el.className = 'cover' + (opts.className ? ' ' + opts.className : '');
  el.style.borderRadius = (opts.r ?? 4) + 'px';
  el.innerHTML = coverSvg(b, opts);
  return el;
}
