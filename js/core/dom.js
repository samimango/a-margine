/* Helper DOM minimi. Mai innerHTML con testo dell'utente: si usa sempre textContent. */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* h('button', {class:'x', on:{click:fn}, 'aria-label':'..'}, 'testo', altroNodo)
   props come stringa = classe. Chiavi speciali: class, text, dataset, style (oggetto o stringa), on, hidden. */
export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (typeof props === 'string') el.className = props;
  else if (props && typeof props === 'object' && !(props instanceof Node) && !Array.isArray(props)) {
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'style') { if (typeof v === 'string') el.style.cssText = v; else for (const [p, x] of Object.entries(v)) p.startsWith('--') ? el.style.setProperty(p, x) : (el.style[p] = x); }
      else if (k === 'on') for (const [evt, fn] of Object.entries(v)) el.addEventListener(evt, fn);
      else if (k === 'hidden') el.hidden = Boolean(v);
      else el.setAttribute(k, v === true ? '' : v);
    }
  } else if (props !== undefined && props !== null) kids.unshift(props);
  append(el, kids);
  return el;
}
function append(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k === null || k === undefined || k === false) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}
export const text = (tag, t, cls) => h(tag, {class: cls, text: t});

export function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ch => {
    const r = Math.random() * 16 | 0; return (ch === 'x' ? r : r & 3 | 8).toString(16);
  });
}
export const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export function shortText(t, n) {
  t = String(t || '');
  if (t.length <= n) return t;
  const cut = t.slice(0, n), sp = cut.lastIndexOf(' ');
  return (sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:.–-]+$/, '') + '…';
}
export const isoDay = (d = new Date()) => { const p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };

/* Campi di testo libero: Safari/iOS non deve proporre «Compila automaticamente» (contatti, indirizzi).
   autocomplete="off" da solo non basta: serve anche un name neutro (mai nome/indirizzo/email/telefono) e gli attributi sotto.
   kind 'note' = testo da scrivere (correzione e dettatura restano attive); 'search' = ricerche, codici, nomi brevi. Restituisce l'elemento. */
export function noAutofill(el, name, kind = 'search') {
  const a = {autocomplete: 'off', name, 'data-form-type': 'other', 'data-lpignore': 'true', 'data-1p-ignore': ''};
  if (kind === 'note') Object.assign(a, {autocorrect: 'on', autocapitalize: 'sentences', spellcheck: 'true'});
  else Object.assign(a, {autocorrect: 'off', autocapitalize: 'none', spellcheck: 'false'});
  for (const [k, v] of Object.entries(a)) el.setAttribute(k, v);
  return el;
}
