/* Scorciatoie di navigazione usate da più schermate. */
import * as router from './router.js';
import * as notes from './notes.js';
import {names, counts, MAX_VERSE} from './bible.js';

/* Apre il lettore a libro/capitolo/versetto (e lo registra come posizione e tra i recenti) */
export function openRef(book, ch, vs, extra = {}) {
  book = Number(book);
  if (!Number.isInteger(book) || book < 0 || book >= names.length) return;
  ch = Math.min(Math.max(Number(ch) || 1, 1), counts[book]);
  vs = Math.min(Math.max(Number(vs) || 1, 1), MAX_VERSE);
  notes.setPos(book, ch, vs);
  notes.addRecent(book, ch);
  router.go('leggi', {fresh: true, book, ch, v: vs, ...extra});
}
export const openBook = book => router.go('libro', {book});
/* Editor della meditazione. id = id nota esistente, oppure null per una nuova; from = schermata a cui tornare */
export const openNote = (id, from) => router.go('nota', {id: id || null, from: from || router.currentId() || 'oggi'});
