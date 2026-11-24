/* Schermate, cronologia del browser e transizioni.
   `trail` rispecchia la cronologia: il tasto Indietro del telefono torna alla schermata precedente e dalla prima esce dall'app.
   Se pushState non è permesso (iframe) si prosegue senza cronologia. */
import {emit} from './bus.js';
import {h, reduceMotion} from './dom.js';
import {icon} from './icons.js';

/* definizione di schermata:
   {id, tab?:'<id scheda>', tabbar?:false, manageScroll?:true,
    build(root,params) -> una sola volta, show(params,prev) -> a ogni apertura, hide(next) -> quando si esce} */
const screens = new Map();
let tabs = [], rootEl, navEl, current = null, currentParams = {};
const trail = [{id: 'oggi', params: {}}];
let histOk = true, navSeq = 0;
try { history.scrollRestoration = 'manual'; } catch { /* ok */ }

export const defineScreen = def => { screens.set(def.id, {...def, el: null, built: false}); };
export const hasScreen = id => screens.has(id);
export const current_ = () => current;
export const currentId = () => current;
export const currentParams_ = () => currentParams;
export const previousId = () => { const t = trail[trail.length - 2]; return t && !t.overlay ? t.id : null; };

function ensureBuilt(def, params) {
  if (def.built) return;
  def.el = h('section', {class: 'scr', id: 'scr-' + def.id, hidden: true, 'aria-label': def.title || def.id, dataset: {screen: def.id}});
  rootEl.append(def.el);
  def.built = true;
  def.build?.(def.el, params);
}
export const screenEl = id => screens.get(id)?.el || null;

/* Un history.back() lanciato da un foglio che si chiude arriva come popstate DOPO: una go() fatta subito dopo verrebbe annullata.
   Finché quel popstate è atteso, le navigazioni restano in coda e partono appena è stato gestito. */
let popsPending = 0, queued = [], popGuard = 0;
function flushQueued() { const q = queued; queued = []; for (const a of q) go(...a); }
export function go(next, params = {}, opts = {}) {
  if (popsPending > 0) { queued.push([next, params, opts]); return; }
  goNow(next, params, opts);
}
function goNow(next, params = {}, {push = true} = {}) {
  let def = screens.get(next);
  if (!def) { next = 'oggi'; def = screens.get('oggi'); params = {}; }
  const prev = current;
  emit('screen:before', {from: prev, to: next});
  navSeq++;
  ensureBuilt(def, params);
  if (prev && prev !== next) { try { screens.get(prev)?.hide?.(next); } catch (e) { console.error(e); } }
  current = next; currentParams = params;
  for (const [id, d] of screens) if (d.el) d.el.hidden = id !== next;
  document.body.dataset.screen = next;
  document.body.classList.toggle('no-tabbar', def.tabbar === false);
  const activeTab = def.tab ?? next;
  tabs.forEach((t, i) => {
    const btn = navEl.children[i + 1];
    if (t.id === activeTab) { btn.setAttribute('aria-current', 'page'); navEl.style.setProperty('--i', i); navEl.classList.remove('none'); }
    else btn.removeAttribute('aria-current');
  });
  if (!tabs.some(t => t.id === activeTab)) navEl.classList.add('none');
  if (push && histOk) {
    try {
      if (next === prev) history.replaceState({v: next, i: trail.length - 1}, '');
      else { trail.push({id: next, params}); history.pushState({v: next, i: trail.length - 1}, ''); }
      trail[trail.length - 1] = {id: next, params};
    } catch { histOk = false; }
  }
  if (!def.manageScroll) window.scrollTo(0, 0);
  if (prev !== next && !reduceMotion()) {
    def.el.animate(next === 'nota' ? [{opacity: 0, transform: 'translateY(18px)'}, {opacity: 1, transform: 'none'}] : [{opacity: 0}, {opacity: 1}], {duration: next === 'nota' ? 220 : 180, easing: 'ease-out'});
  }
  try { def.show?.(params, prev); } catch (e) { console.error(e); }
  emit('screen:show', {id: next, params, prev});
  if (prev !== next && next !== 'nota') focusScreen(def.el);
}
/* Dopo il cambio di schermata il focus va in cima alla nuova schermata (lettori di schermo e tastiera) */
function focusScreen(el) {
  el.tabIndex = -1; el.style.outline = 'none';
  try { el.focus({preventScroll: true}); } catch { /* ok */ }
}
/* Torna indietro: se la schermata richiesta è quella precedente usa la cronologia, altrimenti vi passa direttamente */
export function back(target = 'oggi', params = {}) {
  const p = trail[trail.length - 2];
  if (histOk && trail.length > 1 && p && !p.overlay && p.id === target) {
    const seq = navSeq; history.back();
    setTimeout(() => { if (navSeq === seq) go(target, params); }, 400);
  } else go(target, params);
}

/* Livelli sovrapposti (fogli dal basso, ecc.): il tasto Indietro li chiude prima di cambiare schermata */
export function pushOverlay(close) {
  const token = {overlay: true, close};
  if (!histOk) return token;
  try { trail.push(token); history.pushState({v: current, i: trail.length - 1}, ''); } catch { histOk = false; trail.pop(); }
  return token;
}
export function popOverlay(token) {
  if (trail[trail.length - 1] === token) {
    trail.pop();
    try { history.back(); popsPending++; clearTimeout(popGuard); popGuard = setTimeout(() => { popsPending = 0; flushQueued(); }, 600); } catch { /* ok */ }
  }
}

function onPop(e) {
  const wasMine = popsPending > 0;
  if (wasMine) { popsPending--; if (!popsPending) clearTimeout(popGuard); }
  try { handlePop(e); } finally { if (!popsPending) flushQueued(); }
}
function handlePop(e) {
  const s = e.state, i = Number.isInteger(s?.i) ? s.i : 0;
  while (trail.length > i + 1) { const t = trail.pop(); if (t.overlay) { try { t.close(true); } catch (err) { console.error(err); } } }
  let entry = trail[i];
  if (!entry || entry.overlay) entry = {id: s?.v || 'oggi', params: {}};
  trail.length = i; trail[i] = entry;
  if (!screens.has(entry.id)) entry = {id: 'oggi', params: {}};
  if (entry.id === current) return;
  const p = {...entry.params}; if (p.fresh) { delete p.fresh; p.restored = true; }
  goNow(entry.id, p, {push: false});
}

/* tabList: [{id,label,icon}] ; nav: elemento <nav> */
export function initRouter({root, nav, tabList}) {
  rootEl = root; navEl = nav; tabs = tabList;
  navEl.replaceChildren(h('span', {class: 'tabpill', 'aria-hidden': 'true'}));
  tabs.forEach(t => {
    navEl.append(h('button', {type: 'button', dataset: {go: t.id}, on: {click: () => { if (current === t.id || screens.get(current)?.tab === t.id && current === t.id) { window.scrollTo({top: 0, behavior: reduceMotion() ? 'auto' : 'smooth'}); } else go(t.id); }}}, icon(t.icon, 22, 1.7), h('span', {text: t.label})));
  });
  navEl.style.setProperty('--n', tabs.length);
  addEventListener('popstate', onPop);
  try { history.replaceState({v: 'oggi', i: 0}, ''); } catch { histOk = false; }
}
export const tabButton = id => navEl.querySelector(`[data-go="${id}"]`);
