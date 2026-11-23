/* Piccolo bus di eventi. Eventi del nucleo:
   screen:before {from,to} · screen:show {id,params} · notes:changed · data:changed (dopo una sincronizzazione)
   sync:state · chapter:loaded {book,ch,text} · selection:changed {sel|null} · config:changed · theme:changed */
const map = new Map();
export function on(evt, fn) {
  if (!map.has(evt)) map.set(evt, new Set());
  map.get(evt).add(fn);
  return () => off(evt, fn);
}
export function off(evt, fn) { map.get(evt)?.delete(fn); }
export function emit(evt, detail) {
  for (const fn of [...(map.get(evt) || [])]) {
    try { fn(detail); } catch (e) { console.error('bus', evt, e); }
  }
}
