/* Copertine dei libri generate in SVG: colore + simbolo derivano da bible.bookStyle(). Nessuna immagine esterna. */
import {names, bookStyle} from './bible.js';

let uid = 0;
const cache = new Map();

function sym(kind, ac) {
  const s = `stroke="${ac}" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"`;
  const f = `fill="${ac}"`;
  switch (kind) {
    case 'star': {
      const pts = [];
      for (let i = 0; i < 16; i++) { const r = i % 4 === 0 ? 34 : (i % 2 === 0 ? 22 : 7), a = -Math.PI / 2 + i * Math.PI / 8; pts.push((50 + r * Math.cos(a)).toFixed(1) + ',' + (46 + r * Math.sin(a)).toFixed(1)); }
      return `<g ${s}><polygon points="${pts.join(' ')}" fill="${ac}" fill-opacity=".18"/><circle cx="50" cy="46" r="40" stroke-opacity=".35" stroke-width="1.2"/><path d="M22 82 Q50 70 78 82" stroke-opacity=".6"/></g><g ${f}><circle cx="18" cy="22" r="1.6"/><circle cx="84" cy="30" r="1.3"/><circle cx="76" cy="12" r="1.1"/><circle cx="26" cy="70" r="1.2"/><circle cx="80" cy="66" r="1.5"/></g>`;
    }
    case 'waves': {
      let w = '';
      [44, 55, 66, 77].forEach((y, i) => { w += `<path d="M6 ${y} q11.5 -13 23 0 t23 0 t23 0 t23 0" stroke-opacity="${(1 - i * .17).toFixed(2)}"/>`; });
      return `<g ${s}>${w}</g><circle cx="50" cy="30" r="12" ${f} fill-opacity=".9"/><g stroke="${ac}" stroke-width="1.4" stroke-opacity=".5" stroke-linecap="round"><path d="M50 10v-4M34 16l-3-3M66 16l3-3M26 30h-5M74 30h5"/></g>`;
    }
    case 'lyre': return `<g ${s}><path d="M33 22 C20 32 20 62 36 76 L64 76 C80 62 80 32 67 22"/><path d="M30 22 H70"/><path d="M40 22V74M50 22V74M60 22V74" stroke-width="1.5"/><path d="M33 82H67"/><circle cx="32" cy="20" r="4"/><circle cx="68" cy="20" r="4"/></g>`;
    case 'scroll': return `<g ${s}><rect x="27" y="28" width="46" height="44" rx="2" fill="${ac}" fill-opacity=".12"/><rect x="20" y="23" width="11" height="54" rx="5.5"/><rect x="69" y="23" width="11" height="54" rx="5.5"/><path d="M36 40H64M36 48H60M36 56H64M36 64H54" stroke-width="1.6"/></g>`;
    case 'flame': {
      let rays = '';
      for (let i = 0; i < 20; i++) { const a = i * Math.PI / 10; rays += `<path d="M${(50 + 44 * Math.cos(a)).toFixed(1)} ${(50 + 44 * Math.sin(a)).toFixed(1)}L${(50 + 49 * Math.cos(a)).toFixed(1)} ${(50 + 49 * Math.sin(a)).toFixed(1)}"/>`; }
      return `<g ${s}><path d="M50 14 C58 30 74 40 74 58 C74 72 63 84 50 84 C37 84 26 72 26 58 C26 48 32 42 38 36 C38 44 42 48 46 48 C42 38 44 26 50 14 Z" fill="${ac}" fill-opacity=".16"/><path d="M50 52 C56 60 62 64 62 70 C62 77 56 80 50 80 C44 80 38 77 38 70 C38 64 46 60 50 52 Z" fill="${ac}" fill-opacity=".7" stroke="none"/><g stroke-opacity=".3" stroke-width="1.2">${rays}</g></g>`;
    }
    case 'column': return `<g ${s}><rect x="27" y="19" width="46" height="6" rx="1"/><path d="M32 25H68Q64 35 56 35H44Q36 35 32 25Z"/><circle cx="32" cy="31" r="4"/><circle cx="68" cy="31" r="4"/><rect x="40" y="35" width="20" height="40" fill="${ac}" fill-opacity=".12"/><path d="M45 38V74M50 38V74M55 38V74" stroke-width="1.2"/><rect x="34" y="75" width="32" height="5"/><rect x="29" y="80" width="42" height="6"/></g>`;
    case 'crown': {
      let rays = '';
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; rays += `<path d="M${(50 + 17 * Math.cos(a)).toFixed(1)} ${(33 + 17 * Math.sin(a)).toFixed(1)}L${(50 + 25 * Math.cos(a)).toFixed(1)} ${(33 + 25 * Math.sin(a)).toFixed(1)}"/>`; }
      return `<g ${s}><circle cx="50" cy="33" r="10" fill="${ac}" fill-opacity=".85"/>${rays}<path d="M28 88 L32 68 L41 78 L50 63 L59 78 L68 68 L72 88 Z" fill="${ac}" fill-opacity=".14"/><path d="M29 88H71"/></g><g ${f}><circle cx="32" cy="67" r="2.4"/><circle cx="68" cy="67" r="2.4"/><circle cx="50" cy="62" r="2.6"/></g>`;
    }
    case 'scales': return `<g ${s}><path d="M50 22V78"/><path d="M24 32H76"/><path d="M24 32L14 56M24 32L34 56M76 32L66 56M76 32L86 56" stroke-width="1.4"/><path d="M12 56H36Q24 70 12 56Z" fill="${ac}" fill-opacity=".2"/><path d="M64 56H88Q76 70 64 56Z" fill="${ac}" fill-opacity=".2"/><path d="M38 80H62"/><circle cx="50" cy="20" r="3"/></g>`;
    case 'tablets': return `<g ${s}><path d="M23 80V40Q23 22 36 22Q49 22 49 40V80Z" fill="${ac}" fill-opacity=".14"/><path d="M51 80V40Q51 22 64 22Q77 22 77 40V80Z" fill="${ac}" fill-opacity=".14"/><path d="M30 42H42M30 50H42M30 58H38M58 42H70M58 50H70M58 58H66" stroke-width="1.5"/></g>`;
    case 'tree': return `<g ${s}><path d="M50 82V54"/><ellipse cx="50" cy="38" rx="23" ry="21" fill="${ac}" fill-opacity=".14"/><path d="M50 62L38 48M50 56L62 44M50 46V30" stroke-width="1.6"/><path d="M30 82H70"/></g><g ${f}><circle cx="40" cy="32" r="2"/><circle cx="60" cy="30" r="2"/><circle cx="50" cy="22" r="2"/><circle cx="62" cy="44" r="2"/></g>`;
    case 'tent': return `<g ${s}><path d="M18 78L50 26L82 78Z" fill="${ac}" fill-opacity=".14"/><path d="M50 78V52L40 78"/><path d="M50 26V16"/><path d="M12 78H88"/></g>`;
    case 'dove': return `<g ${s}><path d="M20 58 C30 48 42 52 50 58 C52 42 66 30 82 30 C80 44 72 54 62 60 C68 68 64 76 52 76 C38 76 28 70 20 58Z" fill="${ac}" fill-opacity=".16"/><path d="M62 60C60 52 58 46 54 42" stroke-width="1.4"/><circle cx="76" cy="36" r="1.4" fill="${ac}"/><path d="M82 30L90 28"/><path d="M30 84 Q52 74 74 84" stroke-opacity=".5"/></g>`;
    default: return '';
  }
}

/* opts: {w,h,title:true,r:radius,hero:false (immagine larga senza cornice),tsize} → stringa SVG */
export function coverSvg(b, {w = 76, h = 108, title = true, r = 4, hero = false, tsize, symx, symy, syms} = {}) {
  const key = [b, w, h, title, r, hero, tsize, symx, symy, syms].join('|');
  if (cache.has(key)) return cache.get(key).replace(/__U__/g, 'c' + (++uid));
  const st = bookStyle(b), m = Math.min(w, h);
  const S = syms ?? m * (hero ? 0.95 : 0.5), X = symx ?? (hero ? w * 0.74 : w / 2), Y = symy ?? h * 0.4, sc = S / 100;
  const frame = w >= 60 && !hero;
  let o = `<svg xmlns="http://www.w3.org/2000/svg" class="cover-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" style="display:block;border-radius:${r}px">`;
  o += `<defs><linearGradient id="g__U__" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="${st.c1}"/><stop offset="1" stop-color="${st.c2}"/></linearGradient>`;
  o += `<radialGradient id="r__U__" cx="${(X / w).toFixed(2)}" cy="${(Y / h).toFixed(2)}" r=".6"><stop offset="0" stop-color="${st.ac}" stop-opacity=".30"/><stop offset="1" stop-color="${st.ac}" stop-opacity="0"/></radialGradient>`;
  o += `<pattern id="p__U__" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="4" height="1" fill="#fff" fill-opacity=".05"/></pattern>`;
  if (w >= 160) o += `<filter id="n__U__" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4"/><feColorMatrix type="saturate" values="0"/></filter>`;
  o += `</defs><rect width="${w}" height="${h}" fill="url(#g__U__)"/><rect width="${w}" height="${h}" fill="url(#p__U__)"/><rect width="${w}" height="${h}" fill="url(#r__U__)"/>`;
  if (w >= 160) o += `<rect width="${w}" height="${h}" filter="url(#n__U__)" opacity=".16" style="mix-blend-mode:overlay"/>`;
  o += `<g transform="translate(${(X - S / 2).toFixed(1)},${(Y - S / 2).toFixed(1)}) scale(${sc.toFixed(3)})" opacity="${hero ? 0.55 : 0.9}">${sym(st.sym, st.ac)}</g>`;
  if (frame) {
    const p = Math.max(4, w * 0.055);
    o += `<rect x="${p.toFixed(1)}" y="${p.toFixed(1)}" width="${(w - 2 * p).toFixed(1)}" height="${(h - 2 * p).toFixed(1)}" rx="${Math.max(1, r / 3).toFixed(1)}" fill="none" stroke="${st.ac}" stroke-opacity=".42" stroke-width="${Math.max(.6, w / 160).toFixed(2)}"/>`;
    o += `<rect x="${(p + 3).toFixed(1)}" y="${(p + 3).toFixed(1)}" width="${(w - 2 * p - 6).toFixed(1)}" height="${(h - 2 * p - 6).toFixed(1)}" rx="${Math.max(1, r / 4).toFixed(1)}" fill="none" stroke="${st.ac}" stroke-opacity=".18" stroke-width="${Math.max(.5, w / 220).toFixed(2)}"/>`;
  }
  if (title && !hero) {
    const fs = tsize || w * 0.092, ty = h - Math.max(10, h * 0.115);
    const name = names[b].toUpperCase().replace(/&/g, '&amp;');
    const long = name.length > 10, size = long ? fs * (10 / name.length) * 1.05 : fs;
    o += `<text x="${w / 2}" y="${ty.toFixed(1)}" text-anchor="middle" font-family="Cardo,'Crimson Text',Georgia,serif" font-size="${size.toFixed(1)}" letter-spacing="${(size * 0.16).toFixed(1)}" fill="${st.ac}" fill-opacity=".95">${name}</text>`;
    const ly = ty - fs * 1.5;
    o += `<g stroke="${st.ac}" stroke-opacity=".6" stroke-width=".7"><path d="M${(w * .36).toFixed(1)} ${ly.toFixed(1)}H${(w * .46).toFixed(1)}M${(w * .54).toFixed(1)} ${ly.toFixed(1)}H${(w * .64).toFixed(1)}"/></g><path d="M${w / 2} ${(ly - 2.2).toFixed(1)}l2.2 2.2l-2.2 2.2l-2.2 -2.2z" fill="${st.ac}" fill-opacity=".8"/>`;
  }
  o += '</svg>';
  cache.set(key, o);
  return o.replace(/__U__/g, 'c' + (++uid));
}
/* Elemento <span class="cover"> pronto da inserire */
export function cover(b, opts = {}) {
  const el = document.createElement('span');
  el.className = 'cover' + (opts.className ? ' ' + opts.className : '');
  el.innerHTML = coverSvg(b, opts);   // l'SVG è costruito solo da dati interni (nomi dei libri), mai da input utente
  return el;
}
