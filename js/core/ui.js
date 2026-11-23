/* Elementi di interfaccia condivisi: avvisi con «Annulla», fogli dal basso, popover. */
import {h, reduceMotion} from './dom.js';
import {icon} from './icons.js';
import {pushOverlay, popOverlay} from './router.js';
import {on} from './bus.js';

/* ---------- Avviso (resta circa 5 s; con undo mostra «Annulla») ---------- */
let toastTimer = 0, toastUndo = null, toastEl;
function ensureToast() {
  if (toastEl) return toastEl;
  toastEl = document.getElementById('toast');
  if (!toastEl) { toastEl = h('div', {class: 'toast', id: 'toast', role: 'status', hidden: true}); document.body.append(toastEl); }
  toastEl.replaceChildren(h('span', {id: 'toastMsg'}), h('span', {id: 'toastSep', 'aria-hidden': 'true', text: '·'}), h('button', {id: 'toastUndo', type: 'button', text: 'Annulla', on: {click: () => { const u = toastUndo; hideToast(); if (u) u(); }}}));
  return toastEl;
}
export function toast(msg, undo) {
  const el = ensureToast();
  clearTimeout(toastTimer);
  toastUndo = undo || null;
  el.querySelector('#toastMsg').textContent = msg;
  el.querySelector('#toastUndo').hidden = !undo;
  el.querySelector('#toastSep').hidden = !undo;
  el.hidden = false;
  toastTimer = setTimeout(hideToast, 5000);
}
export function hideToast() { clearTimeout(toastTimer); toastUndo = null; if (toastEl) toastEl.hidden = true; }
on('screen:before', hideToast);

/* ---------- Foglio dal basso ---------- */
let openSheetState = null;
/* sheet({title, build(body, api), onClose, tall}) → {el, body, close}. Esc, tocco fuori e Indietro lo chiudono. */
export function sheet({title = '', build, onClose, tall = false, label} = {}) {
  if (openSheetState) openSheetState.close();
  const opener = document.activeElement;
  const body = h('div', {class: 'sheet-body'});
  const titleId = 'sheetTitle' + Math.random().toString(36).slice(2, 7);
  const closeBtn = h('button', {class: 'roundbtn', type: 'button', 'aria-label': 'Chiudi'}, icon('close', 16, 2.2));
  const box = h('div', {class: 'sheet-box' + (tall ? ' tall' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId},
    h('div', {class: 'grab'}), h('div', {class: 'sheet-head'}, h('b', {id: titleId, text: title || label || ''}), closeBtn), body);
  const el = h('div', {class: 'sheet'}, box);
  document.body.append(el);
  let closed = false, token;
  const api = {el, body, box,
    close(fromPop) {
      if (closed) return; closed = true;
      el.remove(); openSheetState = null;
      document.removeEventListener('keydown', onKey, true);
      if (fromPop !== true) popOverlay(token);
      if (opener && opener.isConnected) try { opener.focus({preventScroll: true}); } catch { /* ok */ }
      try { onClose?.(); } catch (e) { console.error(e); }
    }};
  function onKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); api.close(); }
    else if (e.key === 'Tab') {   // il foglio è modale: il Tab resta al suo interno
      const items = [...box.querySelectorAll('button,input,select,textarea,a[href]')].filter(x => !x.disabled && !x.hidden);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (!box.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  closeBtn.addEventListener('click', () => api.close());
  el.addEventListener('click', e => { if (e.target === el) api.close(); });
  document.addEventListener('keydown', onKey, true);
  token = pushOverlay(api.close);
  openSheetState = api;
  build?.(body, api);
  if (!reduceMotion()) { box.animate([{transform: 'translateY(40px)', opacity: 0}, {transform: 'none', opacity: 1}], {duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)'}); el.animate([{opacity: 0}, {opacity: 1}], {duration: 180}); }
  (body.querySelector('[aria-current],[aria-pressed="true"]') || body.querySelector('button,input') || closeBtn).focus({preventScroll: true});
  return api;
}
export const closeSheet = () => openSheetState?.close();
export const sheetOpen = () => Boolean(openSheetState);

/* ---------- Popover ancorato a un elemento (es. scheda su una parola) ---------- */
let openPopover = null;
/* popover(anchor, build(body, api), {onClose}) → {el, close} */
export function popover(anchor, build, {onClose} = {}) {
  openPopover?.close();
  const el = h('div', {class: 'popover', role: 'dialog'});
  document.body.append(el);
  build?.(el, {close: () => api.close()});
  const place = () => {
    const r = anchor.getBoundingClientRect(), w = el.offsetWidth, hgt = el.offsetHeight, pad = 10;
    let left = Math.min(Math.max(pad, r.left + r.width / 2 - w / 2), innerWidth - w - pad);
    let top = r.bottom + 8;
    if (top + hgt > innerHeight - pad) top = Math.max(pad, r.top - hgt - 8);
    el.style.left = left + 'px'; el.style.top = top + 'px';
  };
  place();
  const onDown = e => { if (!el.contains(e.target)) api.close(); };
  const onKey = e => { if (e.key === 'Escape') api.close(); };
  const api = {el, close() { if (!el.isConnected) return; el.remove(); openPopover = null; document.removeEventListener('pointerdown', onDown, true); document.removeEventListener('keydown', onKey, true); removeEventListener('scroll', api.close); onClose?.(); }};
  setTimeout(() => { document.addEventListener('pointerdown', onDown, true); document.addEventListener('keydown', onKey, true); addEventListener('scroll', api.close, {passive: true, once: true}); }, 0);
  openPopover = api;
  return api;
}

/* ---------- Appunti: Clipboard API, poi il vecchio execCommand. Restituisce true se riuscito. ---------- */
export async function copyToClipboard(textValue) {
  try { await navigator.clipboard.writeText(textValue); return true; } catch { /* si prova il metodo vecchio */ }
  const ta = h('textarea', {readonly: '', style: 'position:fixed;opacity:0;left:-999px'});
  ta.value = textValue; document.body.append(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { /* ok */ }
  ta.remove();
  return ok;
}
