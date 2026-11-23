# A margine — architettura

App statica (HTML + CSS + moduli ES, nessuna build, nessuna libreria) per leggere la Riveduta 2020 e tenere meditazioni.
Funziona da GitHub Pages e da iPhone con «Aggiungi a Home». Il servizio Google (Apps Script) è facoltativo: senza, l'app lavora in locale.

## Mappa dei file

```
index.html            guscio: meta iOS, CSP, script del tema (con hash), 4 CSS, #screens, #tabs, #toast
css/tokens.css        TUTTI i token (colori, temi light/paper/dark, tinte dei 5 colori, ombre, raggi, spazi)
css/base.css          barra scheda, barra alta, toast, foglio (sheet), popover
css/components.css    pulsanti, card, righe, segmenti, chip, palette colori
css/screens.css       stili delle singole schermate
js/main.js            avvio: tema, router, schermate, feature, sincronizzazione, service worker
js/core/              il NUCLEO (vedi sotto)
js/components/        pezzi di interfaccia condivisi (topbar, palette, seg, entry, conflitti, aspetto)
js/screens/           una schermata per file (oggi, libreria, libro, leggi, nota, quaderno, cerca, impostazioni, collega)
js/features/          funzioni aggiuntive: UN file per funzione + la riga in index.js
backend/Code.gs       backend Apps Script (un solo file, include legacy/protocol.js identico)
backend/appsscript.json
sw.js                 service worker (rete prima, cache di riserva, versione automatica)
tests/                Playwright + backend vero eseguito in Node (python3 tests/run.py)
legacy/ legacy-tests/ design-demo/   materiale di riferimento, non fa parte dell'app
```

### Nucleo (`js/core`)

| modulo | compito |
|---|---|
| `store.js` | localStorage sicuro (`K` = le chiavi) |
| `bus.js` | eventi: `screen:before`, `screen:show`, `notes:changed`, `data:changed`, `sync:state`, `sync:conflict`, `chapter:loaded`, `selection:changed`, `config:changed`, `theme:changed` |
| `api.js` | indirizzo e chiave del servizio, `call(method, data)`, `checkConfig`, link `#setup=` |
| `sync.js` | modifiche in attesa, revisioni, conflitti, istantanea; formato identico al vecchio servizio |
| `notes.js` | note, colori, segnalibri, posizione, recenti, giorni e statistiche |
| `chapters.js` | cache dei capitoli (IndexedDB), recupero con deduplica, precaricamento, testo importato |
| `bible.js` | nomi, sigle, conteggi, sezioni, tavolozze dei libri, `parseRef` / `findBook` / `fmtRef` |
| `router.js` | schermate, cronologia del browser, fogli, transizioni |
| `ui.js` | `toast`, `sheet`, `popover`, `copyToClipboard` |
| `features.js` | registro delle feature e hook |
| `theme.js`, `nav.js`, `dom.js`, `icons.js`, `covers.js` | tema/carattere, `openRef/openBook/openNote`, `h()`, icone, copertine SVG |

## Dati: non cambiano

- localStorage: `margine.pos`, `margine.nota.<id>`, `margine.bm`, `margine.labels`, `margine.theme`, `margine.font`, `margine.lead`, `margine.recent`, `margine.recentsearch`, `margine.lastmed`, `margine.pending.v1`, `margine.snapshot.v1`, `margine.notes.sync`, `margine.bm.sync`.
  Nuove, solo locali: `margine.api` ({url,key}), `margine.days`, `margine.read`. Le note hanno un campo locale `t` (data) mai inviato al servizio.
- IndexedDB: `margine-cache` / `chapters` e `margine-bibbia` / `testo`.
- Servizio: UserProperties, una voce per campo `{"rev":n,"value":v}` (id come `42.3.16.note`, `.color`, `bm.<l>.<c>.<v>`, `label.<i>`).
  Un file nuovo che salva dati NON deve usare queste chiavi: usi `margine.<nome-feature>.*`.

## Come si aggiunge una funzione

1. Crea `js/features/<nome>.js` che chiama `registerFeature({id: '<nome>', ...})`.
2. Aggiungi UNA riga `'<nome>',` in `js/features/index.js`.
3. Fine. Un modulo che dà errore viene saltato (console), l'app parte lo stesso.

Un agente che aggiunge una funzione tocca soltanto il proprio file e quella riga.

### Contratto di `registerFeature`

```js
import {registerFeature} from '../core/features.js';
registerFeature({
  id: 'esempio',                      // unico
  screens:        [{id, title, tab?, tabbar?, build(root, ctx, params), show?(params, ctx, prev), hide?}],
  settings:       [{id, section?, label, value?(ctx), icon?, order?, onTap?(ctx), href?, render?(rowEl, ctx)}],
  verseActions:   [{id, label, icon, order?, when?(sel, ctx), run(sel, ctx)}],      // barra azioni sulla selezione
  textDecorators: [{id, order?, decorate(textEl, {book,ch,n,id,text}, ctx)}],       // dopo il disegno di ogni versetto
  homeCards:      [{id, order?, render(ctx) -> Node|null}],                         // schermata Oggi
  bookCards:      [{id, order?, render(book, ctx) -> Node|null}],                   // pagina di un libro
  readerSettings: [{id, order?, render(container, ctx)}],                           // foglio «Aspetto della lettura»
  chapterHeader:  [{id, order?, render({book,ch,text}, ctx) -> Node|null}],
  chapterFooter:  [{id, order?, render({book,ch,text}, ctx) -> Node|null}],
  heroActions:    [{id, label, icon, order?, run(ctx)}],                            // accanto a «Continua»
  noteEditor:     {id, priority?, mount(box, api) -> {setText?, focus?, destroy?}}, // vince la priorità più alta
  onReady(ctx) {},
});
```

- `sel` = `{book, ch, from, to, ref, text, verses: [{n, text}]}` (capitolo a indici 0-based per il libro, versetti 1-based).
- Editor: `api = {id, text, changed(testo), setStatus(t), ctx}`. Chiama `changed` a ogni modifica: il nucleo salva, mette in coda e sincronizza. Senza editor registrato si usa la textarea predefinita.
- `ctx` (ultimo argomento di ogni hook) = `{router, store, api, bible, chapters, notes, sync, ui, bus, dom, icons, covers, nav, theme}`. Una feature importa i moduli del nucleo solo tramite `ctx` o `../core/...`, mai da altre feature.
- Un errore dentro un hook viene registrato in console e l'hook viene ignorato.

## Stile

- Mai colori, raggi, ombre o spazi scritti a mano in un file diverso da `css/tokens.css`: si usano le variabili (`--bg`, `--fg`, `--muted`, `--card`, `--line`, `--accent`, `--d1..5` e `--c1..5` per i colori dei versetti, `--bk` / `--accent-book` per il libro corrente).
- Stili di una nuova feature: classe con prefisso (`.f-<nome>-...`) e regole in un `<style>` creato dal modulo o in un nuovo file CSS caricato dal modulo con `<link>` (consentito dalla CSP: `style-src 'self' 'unsafe-inline'`).
- Testo dell'interfaccia in italiano, tono semplice, accenti corretti.

## File che NON si toccano (salvo incarico esplicito sul nucleo)

`index.html`, `sw.js`, `css/tokens.css`, `css/base.css`, `js/main.js`, tutto `js/core/`, `js/screens/leggi.js`, `js/screens/nota.js`, `backend/`, `legacy/`, `tests/harness.py`, `tests/gas_host.js`, `manifest.webmanifest`.
In particolare: `sync.js` e `backend/Code.gs` (compreso `protocol.js` incluso, che deve restare identico a `legacy/protocol.js`) definiscono il formato dei dati; cambiarli rompe i dispositivi già in uso.
I test nuovi si aggiungono come `tests/t_<nome>.py` (e un nome in `tests/run.py`).

## Backend

`backend/Code.gs` serve sia `google.script.run` (vecchie funzioni `chapter`, `sync`, `wordSearch`, con chiave o solo per il proprietario) sia `doPost` (JSON in `text/plain`, per evitare il preflight CORS):
`{key, method, data}` con `method` = `sync | chapter | wordSearch | ping`; risposta `{ok, data}` oppure `{ok:false, error, code}` (`auth`, `setup`, `invalid`, `server`).
La chiave sta in ScriptProperties `MARGINE_KEY` (si crea con `setupKey()`), confronto a tempo costante. `doGet` mostra solo una pagina di cortesia.

## Sicurezza e CSP

La CSP è nel `<meta>` di `index.html`: `script-src 'self'` + l'hash dell'unico script inline del tema. Se si modifica quello script, ricalcolare l'hash (sha256, base64). `connect-src` ammette solo l'origine dell'app e `https://script.google.com`.
Il testo che arriva dal servizio o dall'utente entra sempre con `textContent` / `h()`, mai con `innerHTML` (l'unica eccezione sono le copertine SVG generate dal codice).

## Test

`python3 tests/run.py [filtro]` — Chrome di sistema, telefono 390x844 con tocco e desktop 1280x800. Il backend vero gira in Node (`tests/gas_host.js`) dietro `page.route`; nessun server di sviluppo. Zero errori in console è parte del test. Gli screenshot finiscono in `tests/shots/`.
