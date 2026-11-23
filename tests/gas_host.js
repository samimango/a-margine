// Esegue il VERO backend/Code.gs in un contesto Node con finti servizi Apps Script (Properties, Lock, ContentService, UrlFetchApp…).
// Comunicazione: una riga JSON in ingresso, una riga JSON in uscita (usato da tests/harness.py).
const vm = require('vm'), fs = require('fs'), path = require('path'), readline = require('readline');
const code = fs.readFileSync(path.join(__dirname, '..', 'backend', 'Code.gs'), 'utf8');

const scriptProps = {}, userProps = {}, logs = [];
const propsApi = store => ({
  getProperty: k => (k in store ? store[k] : null),
  setProperty: (k, v) => { store[k] = String(v); },
  getProperties: () => ({...store}),
  setProperties: o => { for (const [k, v] of Object.entries(o)) store[k] = String(v); },
});
let uuidN = 0, fetchFail = false, fetched = [], fixtures = {};
function chapterHtml(ref) {
  const m = /^(.+?)(?: (\d+))?$/.exec(ref);
  const n = m[1] === 'Salmi' && m[2] === '119' ? 176 : 30;
  let p = '';
  for (let i = 1; i <= n; i++) p += `<strong>${i}</strong>&nbsp;${ref} versetto ${i} di prova con parole abbastanza lunghe per andare a capo. `;
  return '<div id="brano"><h1>' + ref + '</h1><p>' + p + '</p></div>';
}
const sandbox = {
  console,
  Logger: {log: s => logs.push(String(s))},
  Utilities: {getUuid: () => 'aaaaaaaa-bbbb-4ccc-8ddd-' + String(++uuidN).padStart(12, '0'), sleep: () => {}},
  PropertiesService: {getScriptProperties: () => propsApi(scriptProps), getUserProperties: () => propsApi(userProps)},
  LockService: {getUserLock: () => ({waitLock() {}, releaseLock() {}})},
  ScriptApp: {getService: () => ({getUrl: () => 'https://script.google.com/macros/s/TESTDEPLOY/exec'})},
  Session: {getEffectiveUser: () => ({getEmail: () => 'owner@example.invalid'}), getActiveUser: () => ({getEmail: () => ''})},
  ContentService: {MimeType: {JSON: 'application/json'}, createTextOutput: t => ({text: t, mime: null, setMimeType(m) { this.mime = m; return this; }, getContent() { return this.text; }})},
  HtmlService: {createHtmlOutput: html => ({html, setTitle() { return this; }, addMetaTag() { return this; }, getContent() { return html; }})},
  UrlFetchApp: {fetch: url => {
    fetched.push(url);
    if (fetchFail) throw Error('Errore di rete simulato');
    for (const [sub, body] of Object.entries(fixtures)) if (url.includes(sub)) return {getContentText: () => body};
    if (url.includes('js.php')) { const q = JSON.parse(decodeURIComponent(url.split('q=')[1])); return {getContentText: () => JSON.stringify(chapterHtml(q.riferimento))}; }
    if (url.includes('inserire_ricerca')) return {getContentText: () => '<div id="brano"><h3>x</h3><p>2 versetti, in 2 versetti</p><h1>Giovanni 1:5</h1><p>la luce splende nelle tenebre</p><h1>Salmi 27:1</h1><p>Il Signore è la mia luce</p></div>'};
    throw Error('URL inatteso: ' + url);
  }},
};
vm.createContext(sandbox);
vm.runInContext(code, sandbox, {filename: 'Code.gs'});

const rl = readline.createInterface({input: process.stdin});
rl.on('line', line => {
  let out;
  try {
    const m = JSON.parse(line);
    switch (m.cmd) {
      case 'post': { const r = sandbox.doPost({postData: {contents: m.body}}); out = {text: r.getContent(), mime: r.mime}; break; }
      case 'get': { const r = sandbox.doGet({parameter: m.parameter || {}}); out = {html: r.getContent()}; break; }
      case 'run': { const fn = vm.runInContext(m.fn, sandbox); const ret = fn(...(m.args || [])); out = {ret: ret === undefined ? null : JSON.parse(JSON.stringify(ret))}; break; }
      case 'setProp': (m.scope === 'user' ? userProps : scriptProps)[m.k] = String(m.v); out = {}; break;
      case 'delProp': delete (m.scope === 'user' ? userProps : scriptProps)[m.k]; out = {}; break;
      case 'props': out = {script: {...scriptProps}, user: {...userProps}}; break;
      case 'logs': out = {logs: logs.splice(0)}; break;
      case 'fetchFail': fetchFail = Boolean(m.on); out = {}; break;
      case 'fixture': fixtures[m.sub] = m.body; out = {}; break;
      case 'fetched': out = {urls: fetched}; break;
      case 'protocolIdentical': { const legacy = fs.readFileSync(path.join(__dirname, '..', 'legacy', 'protocol.js'), 'utf8'); out = {same: code.includes(legacy)}; break; }
      default: out = {error: 'comando sconosciuto'};
    }
  } catch (e) { out = {error: String(e && e.message || e)}; }
  process.stdout.write(JSON.stringify(out) + '\n');
});
