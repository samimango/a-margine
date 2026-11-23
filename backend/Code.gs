/* A margine — backend Google Apps Script (file unico, pronto da incollare in Code.gs).
 *
 * Serve DUE modi di accesso agli stessi dati (UserProperties del proprietario, formato identico alla versione precedente):
 *   1. API JSON:  doPost(e)  con corpo text/plain  {"key":"…","method":"sync|chapter|wordSearch|ping","data":…}
 *      Risposta: {"ok":true,"data":…}  oppure  {"ok":false,"error":"…","code":"auth|invalid|server|setup"}
 *   2. Vecchio google.script.run: funzioni chapter(reference[,key]), sync(updates[,key]), wordSearch(query[,key]).
 *
 * SICUREZZA
 *   - Ogni chiamata richiede la chiave segreta, confrontata (a tempo costante) con la proprietà di script MARGINE_KEY.
 *   - Genera la chiave UNA volta eseguendo la funzione setupKey(): la trovi nei log (Visualizza → Log di esecuzione).
 *   - doGet non mostra dati: solo una pagina che dice di aprire l'app.
 *   - Pubblica come Web App: «Esegui come: me», «Chi ha accesso: Chiunque» (serve perché l'app su GitHub Pages possa chiamarla;
 *     senza la chiave nessuno ottiene o scrive nulla). Le funzioni per google.script.run accettano la chiave come secondo
 *     argomento, oppure vengono eseguite solo se a chiamare è il proprietario stesso.
 *
 * Il blocco «protocol.js» qui sotto è copiato IDENTICO da legacy/protocol.js (validazione dei campi e scambio con revisioni):
 * non modificarlo, o le note già salvate smettono di essere valide.
 */

// ===================== protocol.js (inizio) =====================
/* Shared protocol for the desktop preview and the private Google web app. */
function validField_(id, value) {
  if (/^label\.[0-4]$/.test(id)) return typeof value === 'string' && value.trim().length > 0 && value.length <= 40;
  const bm=/^bm\.(0|[1-9]\d?)\.([1-9]\d{0,2})\.([1-9]\d{0,2})$/.exec(id);
  if(bm){
    const [book,ch,verse]=bm.slice(1).map(Number);
    return book<=65&&ch<=150&&verse<=176&&(value===null||(Number.isSafeInteger(value)&&value>0));
  }
  const free=/^free\.[0-9a-f-]{36}\.(note|color)$/.exec(id);
  if(free)return fieldValue_(free[1],value);
  const med=/^(\d{1,2})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.([a-f0-9-]{36})\.(note|color)$/.exec(id);
  if(med){
    const [book,ch,from,to]=med.slice(1,5).map(Number);
    return book<66&&ch>=1&&ch<=150&&from<=to&&to<=176&&(from>0||to===0)&&fieldValue_(med[6],value);
  }
  const one=/^(0|[1-9]\d?)\.([1-9]\d{0,2})\.([1-9]\d{0,2})\.(note|color)$/.exec(id);
  if(!one)return false;
  const [book,ch,verse]=one.slice(1,4).map(Number);
  return book<=65&&ch<=150&&verse<=176&&fieldValue_(one[4],value);
}
/* Un campo è «note» (testo, al massimo 8 KB) oppure «color» (null oppure 0–4) */
function fieldValue_(field, value) {
  if (field === 'note') return typeof value === 'string' && encodedLength_(JSON.stringify(value)) <= 8000;
  return value === null || (Number.isInteger(value) && value >= 0 && value < 5);
}
function encodedLength_(text) { return encodeURIComponent(text).replace(/%[0-9a-f]{2}/gi, 'x').length; }
function exchange_(store, updates) {
  const conflicts = {};
  if (!Array.isArray(updates) || updates.length > 100) throw Error('Richiesta non valida.');
  for (const change of updates) {
    if (!change || typeof change !== 'object' || !validField_(change.id, change.value) || !Number.isInteger(change.rev) || change.rev < 0) throw Error('Valore o lunghezza della nota non validi.');
  }
  for (const {id, rev, value} of updates) {
    const old = store[id] || {rev:0};
    if (old.value === value) continue;
    if (old.rev !== rev) { conflicts[id] = true; continue; }
    store[id] = {rev:old.rev + 1, value};
  }
  return {state:store, conflicts};
}
function chapterUrl_(reference) {
  if (typeof reference !== 'string' || !/^[1-3A-Za-zÀ-ž][1-3A-Za-zÀ-ž ]{0,40}(?: [1-9][0-9]{0,2})?$/.test(reference)) throw Error('Riferimento non valido.');
  return 'https://www.laparola.net/js.php?q=' + encodeURIComponent(JSON.stringify({riferimento:reference, versione:'Riveduta 2020'}));
}

function searchUrl_(query){
  if(!query||typeof query.term!=='string'||!query.term.trim()||query.term.length>100||!Number.isInteger(query.start)||query.start<1||query.start>40000)throw Error('Ricerca non valida.');
  return 'https://www.laparola.net/inserire_ricerca.php?versione=Riveduta+2020&brano=Gen-Ap&frase='+encodeURIComponent(query.term.trim())+'&nBraniInizio='+query.start+'&nBraniFine='+(query.start+19);
}

// ===================== protocol.js (fine) =====================

const KEY_PROP = 'MARGINE_KEY';

/* ---------- Chiave segreta ---------- */
/* Eseguila una volta: crea la chiave (se manca) e la scrive nei log. Per cambiarla: resetKey(). */
function setupKey() {
  const props = PropertiesService.getScriptProperties();
  let key = props.getProperty(KEY_PROP);
  if (key) {
    Logger.log('La chiave esiste già. Se l’hai persa esegui resetKey() per crearne una nuova.');
  } else {
    key = Utilities.getUuid();
    props.setProperty(KEY_PROP, key);
    Logger.log('Chiave creata.');
  }
  logSetup_(key);
  return key;
}
function resetKey() {
  const key = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperty(KEY_PROP, key);
  Logger.log('Nuova chiave creata: i dispositivi già collegati devono ripetere la configurazione.');
  logSetup_(key);
  return key;
}
function logSetup_(key) {
  let url = '';
  try { url = ScriptApp.getService().getUrl(); } catch (e) { /* non ancora pubblicato */ }
  Logger.log('CHIAVE: ' + key);
  Logger.log(url ? 'INDIRIZZO DEL WEB APP: ' + url : 'Pubblica il progetto come Web App per ottenere l’indirizzo.');
  if (url) Logger.log('Link di configurazione: aggiungi all’indirizzo dell’app   #setup=' + url + '|' + key);
}
/* Confronto a tempo costante (la durata non dipende da quanti caratteri coincidono) */
function safeEqual_(a, b) {
  a = String(a == null ? '' : a); b = String(b == null ? '' : b);
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
function storedKey_() { return PropertiesService.getScriptProperties().getProperty(KEY_PROP) || ''; }
function keyOk_(key) {
  const stored = storedKey_();
  if (!stored) throw codeError_('Chiave non impostata: esegui setupKey() in Apps Script.', 'setup');
  return typeof key === 'string' && safeEqual_(key, stored);
}
function codeError_(message, code) { const e = new Error(message); e.code = code; return e; }

/* ---------- Pagina senza dati ---------- */
function doGet() {
  let link = '';
  const app = PropertiesService.getScriptProperties().getProperty('MARGINE_APP_URL');
  if (app && /^https:\/\/[\w.-]+\/[\w\/.-]*$/.test(app)) link = '<p><a href="' + app + '">Apri l’app</a></p>';
  return HtmlService.createHtmlOutput(
    '<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>A margine</title></head>' +
    '<body style="font:18px/1.5 Georgia,serif;max-width:30em;margin:15vh auto;padding:0 20px;color:#222"><h1 style="font-weight:600">A margine</h1>' +
    '<p>A margine si è spostata: apri l’app.</p>' + link + '</body></html>'
  ).setTitle('A margine').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* ---------- API JSON ---------- */
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents;
    if (typeof raw !== 'string' || raw.length > 1500000) return json_({ok: false, error: 'Richiesta non valida.', code: 'invalid'});
    let req;
    try { req = JSON.parse(raw); } catch (err) { return json_({ok: false, error: 'Richiesta non valida.', code: 'invalid'}); }
    if (!req || typeof req !== 'object') return json_({ok: false, error: 'Richiesta non valida.', code: 'invalid'});
    if (!keyOk_(req.key)) { Utilities.sleep(400); return json_({ok: false, error: 'Chiave non valida.', code: 'auth'}); }
    switch (req.method) {
      case 'ping': return json_({ok: true, data: {pong: true}});
      case 'sync': return json_({ok: true, data: syncImpl_(req.data)});
      case 'chapter': return json_({ok: true, data: chapterImpl_(req.data)});
      case 'wordSearch': return json_({ok: true, data: wordSearchImpl_(req.data)});
      default: return json_({ok: false, error: 'Metodo non valido.', code: 'invalid'});
    }
  } catch (err) {
    const msg = String(err && err.message || err);
    return json_({ok: false, error: msg, code: err && err.code || (/non valid/i.test(msg) ? 'invalid' : 'server')});
  }
}

/* ---------- Funzioni di lavoro (identiche alla versione precedente) ---------- */
function chapterImpl_(reference) {
  return JSON.parse(UrlFetchApp.fetch(chapterUrl_(reference)).getContentText());
}
function syncImpl_(updates) {
  const lock = LockService.getUserLock();
  lock.waitLock(10000);
  try {
    const props = PropertiesService.getUserProperties();
    const stored = props.getProperties();
    const store = {};
    for (const [key, json] of Object.entries(stored)) { try { store[key] = JSON.parse(json); } catch (e) {} }
    const result = exchange_(store, updates);
    const changed = {};
    for (const {id} of updates) {
      if (!store[id] || result.conflicts[id]) continue;
      const json = JSON.stringify(store[id]);
      if (stored[id] !== json) changed[id] = json;
    }
    if (Object.keys(changed).length) props.setProperties(changed);
    return result;
  } finally { lock.releaseLock(); }
}
function wordSearchImpl_(query) { return UrlFetchApp.fetch(searchUrl_(query)).getContentText(); }

/* ---------- Vecchio google.script.run ---------- */
/* Permesso se la chiave (secondo argomento) è giusta, oppure se a chiamare è il proprietario stesso */
function legacyAllowed_(key) {
  if (key !== undefined && key !== null) return keyOk_(key);
  try {
    const me = Session.getEffectiveUser().getEmail(), who = Session.getActiveUser().getEmail();
    return Boolean(me) && me === who;
  } catch (e) { return false; }
}
function legacyGuard_(key) { if (!legacyAllowed_(key)) throw Error('Non autorizzato.'); }
function chapter(reference, key) { legacyGuard_(key); return chapterImpl_(reference); }
function sync(updates, key) { legacyGuard_(key); return syncImpl_(updates); }
function wordSearch(query, key) { legacyGuard_(key); return wordSearchImpl_(query); }
