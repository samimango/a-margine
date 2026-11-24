/* Ascolta: lettura ad alta voce con Web Speech API (speechSynthesis), pensata per iPhone Safari.
   - un versetto per voce (senza numeri), spezzato su ; : se lungo; pausa naturale tra i versetti
   - scelta della voce con preferenza per le voci «migliorate» (Premium, Enhanced, Siri, Neural…) e locali
   - evidenziazione del versetto nel lettore (classe sul .verse), mini-player in vetro, foglio «Ascolta»
   - rimedi ai difetti noti di iOS: cancel() prima di ogni lettura, riferimento forte all'utterance (altrimenti onend non arriva),
     sblocco con una voce muta nel gesto dell'utente, cane da guardia se onend non arriva, ripresa dopo visibilitychange.
   Pausa = si ferma e si riparte dall'inizio della frase corrente: pause()/resume() su iOS e Android non sono affidabili.
   Dati: margine.ascolta.rate | .voice | .next */
import {registerFeature, ctx} from '../core/features.js';

const {store, notes, chapters, bible, ui, bus, dom, icons, covers, router, nav, api} = ctx;
const {h, text, reduceMotion} = dom;
const {icon} = icons;

/* stile (caricato dal modulo) e icone proprie (prefisso asc-) */
{
  const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = new URL('../../css/f-ascolta.css', import.meta.url).href;
  document.head.append(link);
  icons.registerIcons({
    'asc-headphones': '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3.5" y="14" width="4" height="6.5" rx="1.6"/><rect x="16.5" y="14" width="4" height="6.5" rx="1.6"/>',
    'asc-play': '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>',
    'asc-pause': '<rect x="6.5" y="5" width="3.8" height="14" rx="1.2" fill="currentColor"/><rect x="13.7" y="5" width="3.8" height="14" rx="1.2" fill="currentColor"/>',
    'asc-prev': '<path d="M6 5.5v13"/><path d="M18.5 5.8v12.4L9 12z" fill="currentColor"/>',
    'asc-next': '<path d="M18 5.5v13"/><path d="M5.5 5.8v12.4L15 12z" fill="currentColor"/>',
    'asc-speed': '<path d="M4.5 17a8 8 0 1 1 15 0"/><path d="M12 13l4-4"/>',
    'asc-timer': '<circle cx="12" cy="13.5" r="7"/><path d="M12 10v4l2.5 1.5M9.5 3.5h5"/>',
    'asc-voice': '<path d="M4 10v4h3.5L12 18V6L7.5 10z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  });
}

const KEY = {rate: 'margine.ascolta.rate', voice: 'margine.ascolta.voice', next: 'margine.ascolta.next'};
const BASE_RATE = 0.95, SPEEDS = [0.8, 1, 1.2, 1.5], VERSE_PAUSE = 350, PART_PAUSE = 140, MAX_PART = 170;
const synth = () => ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window ? window.speechSynthesis : null);
export const supported = () => Boolean(synth());
const fmtSpeed = s => String(s).replace('.', ',') + '×';

/* ---------------------------------------------------------------- voci */
const QUALITY = [[/premium/i, 130], [/enhanced|migliorata|potenziata/i, 120], [/siri/i, 110], [/neural|natural|online|wavenet/i, 100]];
const PREFERRED = ['federica', 'alice', 'luca', 'paola', 'emma', 'elsa', 'isabella', 'silvia', 'cosimo', 'diego', 'giorgio'];
export function qualityOf(v) { const s = v.name + ' ' + (v.voiceURI || ''); return QUALITY.find(([re]) => re.test(s))?.[1] || 0; }
function scoreOf(v) {
  let s = qualityOf(v);
  if (v.localService) s += 20;
  const i = PREFERRED.findIndex(n => v.name.toLowerCase().includes(n));
  if (i >= 0) s += 30 - i;
  return s;
}
export function itVoices() {
  const s = synth(); if (!s) return [];
  let list = []; try { list = s.getVoices() || []; } catch { /* ok */ }
  return list.filter(v => /^it([-_]|$)/i.test(v.lang || '')).sort((a, z) => scoreOf(z) - scoreOf(a) || a.name.localeCompare(z.name, 'it'));
}
/* Su iOS le voci arrivano in ritardo: si riprova a intervalli e si ascolta voiceschanged */
let voicesPromise = null;
export function loadVoices(timeout = 4000) {
  if (itVoices().length) return Promise.resolve(itVoices());
  if (voicesPromise) return voicesPromise;
  voicesPromise = new Promise(resolve => {
    const s = synth(); if (!s) { resolve([]); return; }
    const t0 = Date.now(); let timer;
    const finish = () => { clearTimeout(timer); s.removeEventListener?.('voiceschanged', check); voicesPromise = null; resolve(itVoices()); };
    const check = () => { if (itVoices().length || Date.now() - t0 > timeout) finish(); else { clearTimeout(timer); timer = setTimeout(check, 150); } };
    s.addEventListener?.('voiceschanged', check);
    check();
  });
  return voicesPromise;
}
const voiceKey = v => v.voiceURI || v.name;
export function chosenVoice() {
  const list = itVoices(), saved = store.getJson(KEY.voice, null, 'object');
  return (saved && list.find(v => voiceKey(v) === saved.uri || v.name === saved.name)) || list[0] || null;
}
function saveVoice(v) { store.setJson(KEY.voice, {uri: voiceKey(v), name: v.name}); emitState(); }
const voiceTag = v => qualityOf(v) >= 100 ? (/premium/i.test(v.name) ? 'Premium' : /enhanced|migliorata/i.test(v.name) ? 'Migliorata' : 'Alta qualità') : v.localService ? 'Su questo dispositivo' : 'Online';

/* ---------------------------------------------------------------- testo da leggere */
const SUBS = [
  [/\bv{1,2}\.\s*(\d)/g, (m, d) => 'versetto ' + d],
  [/\bSig\.(?=\s)/g, 'Signore'], [/\becc\./gi, 'eccetera'], [/\bcfr\./gi, 'confronta'], [/\bes\./gi, 'per esempio'], [/\bcap\.\s*(\d)/gi, (m, d) => 'capitolo ' + d],
  [/\bS\.\s/g, 'San '],
  [/[«»“”"]/g, ''], [/[‘’]/g, '\''], [/\s*[—–]\s*/g, ', '], [/\s*\(\s*/g, ', '], [/\s*\)\s*/g, ', '],
  [/\[[^\]]*\]/g, ''],
  [/\b[A-ZÀ-Ý]{3,}\b/g, w => w.charAt(0) + w.slice(1).toLowerCase()],       // SIGNORE → Signore (altrimenti letto lettera per lettera)
  [/\s+/g, ' '],
];
export function speakable(t) {
  let s = String(t || '');
  for (const [re, to] of SUBS) s = s.replace(re, to);
  return s.replace(/(,\s*){2,}/g, ', ').replace(/^[,\s]+|[,\s]+$/g, '').replace(/\s+([,.;:!?])/g, '$1').trim();
}
/* un versetto lungo si spezza su ; : poi su virgole, poi sugli spazi: evita gli utterance lunghi che bloccano iOS */
export function splitParts(t, max = MAX_PART) {
  const s = speakable(t); if (!s) return [];
  const pieces = s.split(/(?<=[;:])\s+/);
  const out = [];
  const pushLong = piece => {
    if (piece.length <= max) { out.push(piece); return; }
    let cur = '';
    for (const word of piece.split(/(?<=,)\s+|\s+/)) {
      if (cur && (cur + ' ' + word).length > max) { out.push(cur); cur = word; } else cur = cur ? cur + ' ' + word : word;
    }
    if (cur) out.push(cur);
  };
  let acc = '';
  for (const p of pieces) {
    if (acc && (acc + ' ' + p).length <= max) acc += ' ' + p;
    else { if (acc) pushLong(acc); acc = p; }
  }
  if (acc) pushLong(acc);
  return out.filter(Boolean);
}

/* ---------------------------------------------------------------- stato */
const P = {state: 'idle', b: 0, c: 1, verses: [], i: 0, parts: [], k: 0, run: 0, retries: 0, u: null, wd: 0, gap: 0, timerEnd: 0, timerMin: 0, timerId: 0, loading: false};
const listeners = new Set();
const emitState = () => { for (const fn of [...listeners]) { try { fn(); } catch (e) { console.error(e); } } };
const getRate = () => { const r = Number(store.get(KEY.rate)); return SPEEDS.includes(r) ? r : 1; };
const nextOn = () => store.get(KEY.next, '1') !== '0';
const active = () => P.state === 'playing' || P.state === 'paused' || P.loading;
export const isActive = active;
const verseOf = () => P.verses[P.i] || null;
const chapLabel = () => bible.lapRef(P.b, P.c);

async function loadVerses(b, c) {
  const sec = b + '.' + c + '.';
  let map = await chapters.cached(b, c);
  if (!map && api.isConfigured()) { try { map = await chapters.fetchChapter(b, c); } catch { map = null; } }
  const ids = new Set([...Object.keys(map || {}), ...Object.keys(chapters.sampleText()), ...Object.keys(chapters.passages)].filter(id => id.startsWith(sec)));
  return [...ids].map(id => ({n: Number(id.split('.')[2]), text: chapters.textOf(id)})).filter(v => v.text).sort((a, z) => a.n - z.n);
}

/* ---- voce muta nel gesto dell'utente: sblocca speechSynthesis su iOS ---- */
let unlocked = false;
function unlock() {
  const s = synth(); if (!s) return;
  s.cancel();
  if (unlocked) return; unlocked = true;
  try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; s.speak(u); } catch { /* ok */ }
}

/* ---- evidenziazione nel lettore ---- */
function readerShows() {
  const scr = document.getElementById('scr-leggi');
  if (!scr || scr.hidden) return false;
  const [b, c] = notes.pos();
  return b === P.b && c === P.c;
}
function highlight(scroll = true) {
  document.querySelectorAll('.f-ascolta-now').forEach(e => e.classList.remove('f-ascolta-now'));
  const v = verseOf();
  if (!v || !active() || !readerShows()) return;
  const el = document.querySelector('#scr-leggi #v' + v.n);
  if (!el) return;
  el.classList.add('f-ascolta-now');
  if (!scroll) return;
  const r = el.getBoundingClientRect();
  if (r.top < 90 || r.bottom > innerHeight - 170) el.scrollIntoView({block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth'});
}

/* ---- motore ---- */
function cancelSpeech() { const s = synth(); clearTimeout(P.wd); clearTimeout(P.gap); P.u = null; try { s?.cancel(); } catch { /* ok */ } }
function stopAll() {
  P.run++; cancelSpeech(); clearTimeout(P.timerId); P.timerEnd = 0; P.timerMin = 0;
  P.state = 'idle'; P.loading = false; P.verses = []; P.parts = [];
  document.body.classList.remove('f-ascolta-on');
  highlight(false); emitState();
}
export const stop = () => stopAll();

function setVerse(i) {
  P.i = i; P.k = 0; P.retries = 0;
  P.parts = splitParts(verseOf()?.text);
  highlight(); emitState();
  if (!P.parts.length) { advance(P.run); return; }
  speakPart();
}
function speakPart() {
  const s = synth(), run = P.run; if (!s || P.state !== 'playing') return;
  if (P.k >= P.parts.length) { advance(run); return; }
  const txt = P.parts[P.k], mult = getRate();
  const u = new SpeechSynthesisUtterance(txt), voice = chosenVoice();
  if (voice) u.voice = voice;
  u.lang = voice?.lang || 'it-IT'; u.rate = Math.min(2, BASE_RATE * mult); u.pitch = 1; u.volume = 1;
  P.u = u;                                   // riferimento forte: senza, iOS/Chrome possono perdere onend
  let done = false;
  const finish = () => {
    if (done || run !== P.run) return; done = true; clearTimeout(P.wd);
    P.k++; P.retries = 0;
    if (P.k >= P.parts.length) advance(run);
    else P.gap = setTimeout(() => { if (run === P.run && P.state === 'playing') speakPart(); }, PART_PAUSE / mult);
  };
  u.onend = finish;
  u.onerror = e => { if (done || run !== P.run) return; if (e && (e.error === 'canceled' || e.error === 'interrupted')) return; finish(); };
  const estimate = Math.max(5000, txt.length / (13 * u.rate) * 1000 * 1.8 + 3000);
  clearTimeout(P.wd);
  P.wd = setTimeout(() => {       // onend non è mai arrivato (blocco di iOS): si riprova la stessa frase, poi si salta
    if (done || run !== P.run) return; done = true;
    cancelSpeech();
    if (++P.retries > 2) { P.retries = 0; P.k++; }
    P.gap = setTimeout(() => { if (run === P.run && P.state === 'playing') speakPart(); }, 120);
  }, estimate);
  try { s.speak(u); } catch (e) { console.error(e); }
}
function advance(run) {
  if (run !== P.run) return;
  clearTimeout(P.gap);
  P.gap = setTimeout(async () => {
    if (run !== P.run || P.state !== 'playing') return;
    if (P.i + 1 < P.verses.length) { setVerse(P.i + 1); return; }
    /* fine capitolo */
    const nx = bible.step(P.b, P.c, 1);
    if (!nextOn() || !nx) { finishAll(run, nx ? 'Lettura finita.' : 'Lettura finita: era l’ultimo capitolo.'); return; }
    P.loading = true; emitState();
    const verses = await loadVerses(nx[0], nx[1]);
    if (run !== P.run) return;
    P.loading = false;
    if (!verses.length) { finishAll(run, 'Il capitolo dopo non è disponibile offline.'); return; }
    P.b = nx[0]; P.c = nx[1]; P.verses = verses;
    if (router.currentId() === 'leggi') nav.openRef(P.b, P.c, 1);
    setVerse(0);
  }, VERSE_PAUSE / getRate());
}
function finishAll(run, msg) { if (run !== P.run) return; stopAll(); ui.toast(msg); }

/* Avvia dal versetto n del capitolo (b, c). Va chiamata dentro un gesto dell'utente. */
export async function start(b, c, n = 1, {openSheet = false} = {}) {
  if (!supported()) { ui.toast('Questo browser non può leggere ad alta voce.'); return; }
  unlock();
  const run = ++P.run;
  clearTimeout(P.gap); clearTimeout(P.wd);
  P.b = b; P.c = c; P.state = 'idle'; P.loading = true; P.verses = [];
  document.body.classList.add('f-ascolta-on');
  emitState();
  if (openSheet) openPlayerSheet();
  const [verses] = await Promise.all([loadVerses(b, c), loadVoices(1500)]);
  if (run !== P.run) return;
  P.loading = false;
  if (!verses.length) { stopAll(); ui.toast('Il testo di questo capitolo non è ancora sul dispositivo.'); return; }
  P.verses = verses; P.state = 'playing';
  const idx = verses.findIndex(v => v.n >= n);
  setVerse(idx < 0 ? 0 : idx);
}
export function pause() { if (P.state !== 'playing') return; P.run++; cancelSpeech(); P.state = 'paused'; emitState(); }
export function resume() { if (P.state !== 'paused') return; P.state = 'playing'; P.k = Math.max(0, P.k); speakPart(); emitState(); }
export const toggle = () => { if (P.state === 'playing') pause(); else if (P.state === 'paused') resume(); };
function jump(i) {
  if (!P.verses.length) return;
  i = Math.max(0, Math.min(P.verses.length - 1, i));
  const was = P.state; P.run++; cancelSpeech(); P.state = 'playing';
  setTimeout(() => { if (P.state === 'playing') setVerse(i); }, 60);   // iOS: dopo cancel() serve un respiro
  if (was === 'paused') emitState();
}
export const nextVerse = () => { if (P.i + 1 < P.verses.length) jump(P.i + 1); else { const nx = bible.step(P.b, P.c, 1); if (nx) start(nx[0], nx[1], 1); } };
export const prevVerse = () => { if (P.i > 0) jump(P.i - 1); else { const pv = bible.step(P.b, P.c, -1); if (pv) start(pv[0], pv[1], 1); } };
function setRate(mult) {
  store.set(KEY.rate, mult); emitState();
  if (P.state === 'playing') jump(P.i);    // riparte dal versetto con la nuova velocità
}
function setTimer(min) {
  clearTimeout(P.timerId); P.timerMin = min; P.timerEnd = min ? Date.now() + min * 60000 : 0;
  if (min) P.timerId = setTimeout(timerDone, min * 60000);
  emitState();
}
function timerDone() { if (!active()) return; stopAll(); ui.toast('Timer scaduto: lettura fermata.'); }
const timerLeft = () => P.timerEnd ? Math.max(0, Math.ceil((P.timerEnd - Date.now()) / 60000)) : 0;

/* iOS: in background la voce si ferma. Al ritorno si riprende dalla frase corrente */
document.addEventListener('visibilitychange', () => {
  if (document.hidden || !active()) return;
  if (P.timerEnd && Date.now() >= P.timerEnd) { timerDone(); return; }
  if (P.state === 'playing') { const s = synth(); if (s && !s.speaking) { P.run++; cancelSpeech(); setTimeout(() => { if (P.state === 'playing') { P.k = Math.min(P.k, Math.max(0, P.parts.length - 1)); speakPart(); } }, 120); } }
  highlight(false);
});
addEventListener('pagehide', () => { try { synth()?.cancel(); } catch { /* ok */ } });

/* ---------------------------------------------------------------- interfaccia */
const estMinutes = () => {
  const chars = P.verses.slice(P.i).reduce((n, v) => n + v.text.length, 0);
  return Math.max(0, Math.round(chars / (14 * BASE_RATE * getRate()) / 60));
};
const title = () => P.verses.length || P.loading ? chapLabel() : '';
const verseLabel = () => P.loading && !P.verses.length ? 'Preparo la lettura…' : 'Versetto ' + (verseOf()?.n ?? 1);

/* ---- mini-player ---- */
let mini;
function buildMini() {
  if (mini) return;
  const playBtn = h('button', {class: 'f-ascolta-btn', type: 'button', dataset: {act: 'toggle'}, on: {click: toggle}});
  const info = h('button', {class: 'f-ascolta-mini-open', type: 'button', 'aria-label': 'Apri Ascolta', on: {click: () => openPlayerSheet()}});
  mini = h('div', {class: 'f-ascolta-mini glass', id: 'ascoltaMini', role: 'region', 'aria-label': 'Lettura ad alta voce', hidden: true},
    info, playBtn,
    h('button', {class: 'f-ascolta-btn', type: 'button', 'aria-label': 'Versetto successivo', dataset: {act: 'next'}, on: {click: nextVerse}}, icon('asc-next', 20, 1.8)),
    h('button', {class: 'f-ascolta-btn', type: 'button', 'aria-label': 'Ferma la lettura', dataset: {act: 'stop'}, on: {click: stop}}, icon('close', 18, 2.2)));
  mini._info = info; mini._play = playBtn;
  document.body.append(mini);
}
function updateMini() {
  buildMini();
  const show = active() && !sheetApi && router.currentId() !== 'nota';
  mini.hidden = !show;
  if (!show) return;
  mini._info.replaceChildren(covers.cover(P.b, {w: 34, h: 48, r: 4, title: false}), h('span', {class: 'f-ascolta-mini-t'}, h('b', {text: title() || 'Ascolta'}), h('small', {text: verseLabel()})));
  const playing = P.state === 'playing' || P.loading;
  mini._play.replaceChildren(icon(playing ? 'asc-pause' : 'asc-play', 22, 1.8));
  mini._play.setAttribute('aria-label', playing ? 'Pausa' : 'Riprendi');
}

/* ---- elenco voci (usato nel foglio e nelle impostazioni) ---- */
function voiceList(box, onPick) {
  const draw = () => {
    const list = itVoices(), cur = chosenVoice();
    box.replaceChildren();
    if (!list.length) { box.append(text('p', 'Nessuna voce italiana trovata su questo dispositivo. Sul telefono arrivano a volte con un po’ di ritardo: riprova tra un momento.', 'hint')); return; }
    for (const v of list) {
      const on = cur && voiceKey(cur) === voiceKey(v);
      box.append(h('div', {class: 'f-ascolta-voice' + (on ? ' on' : ''), dataset: {voice: v.name}},
        h('button', {class: 'f-ascolta-voice-pick', type: 'button', 'aria-pressed': String(Boolean(on)), on: {click: () => { saveVoice(v); draw(); onPick?.(v); }}},
          h('span', {class: 'f-ascolta-check', 'aria-hidden': 'true'}, on ? icon('check', 16, 2.4) : null),
          h('span', {class: 'f-ascolta-voice-t'}, h('b', {text: v.name}), h('small', {text: voiceTag(v) + ' · ' + (v.lang || '').replace('_', '-')}))),
        h('button', {class: 'f-ascolta-try', type: 'button', 'aria-label': 'Prova la voce ' + v.name, text: 'Prova', on: {click: () => trySample(v)}})));
    }
  };
  draw();
  const refresh = () => { if (box.isConnected) draw(); };
  const s = synth(); s?.addEventListener?.('voiceschanged', refresh);
  loadVoices().then(refresh);
  return draw;
}
function trySample(v) {
  const s = synth(); if (!s) return;
  const wasPlaying = P.state === 'playing'; if (wasPlaying) pause();
  unlock(); s.cancel();
  const u = new SpeechSynthesisUtterance('Il Signore è il mio pastore: nulla mi manca.');
  u.voice = v; u.lang = v.lang || 'it-IT'; u.rate = BASE_RATE * getRate(); u.pitch = 1;
  P.u = u;
  setTimeout(() => s.speak(u), 60);
}

/* ---- foglio «Ascolta» ---- */
let sheetApi = null, sheetUpdate = null;
function openPlayerSheet() {
  if (!active()) return;
  sheetApi = ui.sheet({
    title: 'Ascolta', tall: true, label: 'Ascolta',
    build(body, sh) {
      sh.el.classList.add('f-ascolta-sheet', 'theme-dark-scope');
      body.classList.add('f-ascolta-body');
      const view = h('div', {class: 'f-ascolta-view'}), voices = h('div', {class: 'f-ascolta-voices', hidden: true});
      body.append(view, voices);
      const coverBox = h('div', {class: 'f-ascolta-cover'});
      const t = h('h2', {class: 'f-ascolta-title'}), sub = h('p', {class: 'f-ascolta-sub'});
      const prev = h('p', {class: 'f-ascolta-line dim'}), cur = h('p', {class: 'f-ascolta-line cur', 'aria-live': 'off'}), nxt = h('p', {class: 'f-ascolta-line dim'});
      const range = h('input', {type: 'range', class: 'f-ascolta-range', min: '1', max: '1', step: '1', value: '1', 'aria-label': 'Versetto'});
      const tl = h('span'), tr = h('span');
      const pp = h('button', {class: 'f-ascolta-big', type: 'button', on: {click: toggle}});
      const speed = h('div', {class: 'f-ascolta-seg', role: 'group', 'aria-label': 'Velocità'});
      const timerSeg = h('div', {class: 'f-ascolta-seg', role: 'group', 'aria-label': 'Timer di spegnimento'});
      const timerNote = h('small', {class: 'f-ascolta-note'});
      const voiceName = h('b'), voiceBtn = h('button', {class: 'f-ascolta-pillrow', type: 'button', id: 'ascoltaVoiceBtn', on: {click: () => { view.hidden = true; voices.hidden = false; voices.querySelector('button')?.focus(); }}}, icon('asc-voice', 18, 1.8), h('span', {class: 'f-ascolta-pill-t'}, text('small', 'Voce', 'f-ascolta-k'), voiceName), icon('chev', 16, 2.2));
      const nextSw = h('button', {class: 'f-ascolta-switch', type: 'button', role: 'switch', id: 'ascoltaNext', on: {click: () => { store.set(KEY.next, nextOn() ? '0' : '1'); emitState(); }}}, h('span', {class: 'f-ascolta-sw-t'}, h('b', {text: 'Continua al capitolo dopo'}), h('small', {text: 'Alla fine passa al capitolo successivo'})), h('i', {class: 'f-ascolta-knob', 'aria-hidden': 'true'}));
      range.addEventListener('input', () => { tl.textContent = 'Versetto ' + (P.verses[Number(range.value) - 1]?.n ?? ''); });
      range.addEventListener('change', () => jump(Number(range.value) - 1));
      view.append(coverBox, t, sub, h('div', {class: 'f-ascolta-lines'}, prev, cur, nxt),
        h('div', {class: 'f-ascolta-prog'}, range, h('div', {class: 'f-ascolta-times'}, tl, tr)),
        h('div', {class: 'f-ascolta-ctl'}, h('button', {class: 'f-ascolta-sk', type: 'button', 'aria-label': 'Versetto precedente', id: 'ascoltaPrev', on: {click: prevVerse}}, icon('asc-prev', 24, 1.8)), pp,
          h('button', {class: 'f-ascolta-sk', type: 'button', 'aria-label': 'Versetto successivo', id: 'ascoltaNextV', on: {click: nextVerse}}, icon('asc-next', 24, 1.8))),
        h('div', {class: 'f-ascolta-row'}, h('span', {class: 'f-ascolta-k'}, icon('asc-speed', 16, 1.8), 'Velocità'), speed),
        voiceBtn,
        h('div', {class: 'f-ascolta-row'}, h('span', {class: 'f-ascolta-k'}, icon('asc-timer', 16, 1.8), 'Timer'), timerSeg), timerNote, nextSw);
      /* elenco voci in una vista interna */
      const back = h('button', {class: 'f-ascolta-back', type: 'button', on: {click: () => { voices.hidden = true; view.hidden = false; voiceBtn.focus(); }}}, icon('back', 18, 2), 'Indietro');
      const vbox = h('div', {class: 'f-ascolta-voicebox'});
      voices.append(back, text('h3', 'Voce per la lettura', 'f-ascolta-h3'), vbox, text('p', HELP, 'hint'));
      voiceList(vbox, () => update());

      function update() {
        if (!sh.el.isConnected) return;
        const v = verseOf(), total = P.verses.length;
        coverBox.replaceChildren(covers.cover(P.b, {w: 128, h: 182, r: 8}));
        const st = bible.bookStyle(P.b); sh.el.style.setProperty('--bk', st.c1); sh.el.style.setProperty('--bk-ac', st.ac);
        t.textContent = title() || 'Ascolta'; sub.textContent = total ? 'Versetto ' + v.n + ' di ' + P.verses[total - 1].n + ' · Riveduta' : verseLabel();
        prev.textContent = P.verses[P.i - 1] ? P.verses[P.i - 1].n + ' ' + P.verses[P.i - 1].text : ''; cur.textContent = v ? v.n + ' ' + v.text : ''; nxt.textContent = P.verses[P.i + 1] ? P.verses[P.i + 1].n + ' ' + P.verses[P.i + 1].text : '';
        range.max = String(Math.max(1, total)); range.value = String(P.i + 1); range.disabled = !total;
        range.setAttribute('aria-valuetext', v ? 'Versetto ' + v.n : '');
        tl.textContent = v ? 'Versetto ' + v.n : ''; tr.textContent = total ? 'circa ' + Math.max(1, estMinutes()) + ' min' : '';
        const playing = P.state === 'playing' || P.loading;
        pp.replaceChildren(icon(playing ? 'asc-pause' : 'asc-play', 30, 1.8)); pp.setAttribute('aria-label', playing ? 'Pausa' : 'Riprendi'); pp.dataset.state = P.state;
        speed.replaceChildren(...SPEEDS.map(s => h('button', {type: 'button', dataset: {speed: s}, 'aria-pressed': String(getRate() === s), text: fmtSpeed(s), on: {click: () => setRate(s)}})));
        timerSeg.replaceChildren(...[[0, 'No'], [15, '15'], [30, '30'], [60, '60']].map(([m, l]) => h('button', {type: 'button', dataset: {timer: m}, 'aria-pressed': String(P.timerMin === m), 'aria-label': m ? m + ' minuti' : 'Nessun timer', text: m ? l + ' min' : l, on: {click: () => setTimer(m)}})));
        timerNote.textContent = P.timerEnd ? 'Si ferma tra circa ' + timerLeft() + ' min' : '';
        nextSw.setAttribute('aria-checked', String(nextOn()));
        const cv = chosenVoice(); voiceName.textContent = cv ? cv.name : 'Predefinita del dispositivo';
        if (!active()) sh.close();
      }
      sheetUpdate = update; listeners.add(update); update();
    },
    onClose() { listeners.delete(sheetUpdate); sheetUpdate = null; sheetApi = null; emitState(); },
  });
  emitState();
}

const HELP = 'Per una voce più naturale scarica una voce migliorata: Impostazioni iPhone › Accessibilità › Contenuto letto › Voci › Italiano.';

/* ---- impostazioni ---- */
function openVoiceSheet() {
  ui.sheet({title: 'Voce per la lettura', build(body) {
    const box = h('div', {class: 'f-ascolta-voicebox'});
    body.append(box, text('p', HELP, 'hint'));
    voiceList(box);
  }});
}
function settingsRow(row) {
  const val = h('small'), btn = h('button', {class: 'row f-ascolta-setrow', id: 'ascoltaVoceRow', type: 'button', on: {click: openVoiceSheet}},
    h('span', {class: 'row-ic'}, icon('asc-voice', 18, 1.8)), h('span', {class: 'row-main'}, h('b', {text: 'Voce per la lettura'}), val), icon('chev', 16, 2.2));
  const fill = () => { const v = chosenVoice(); val.textContent = supported() ? (v ? v.name + ' · ' + voiceTag(v) : 'Predefinita del dispositivo') : 'Non disponibile in questo browser'; };
  fill(); loadVoices().then(fill);
  const live = () => { if (row.isConnected) fill(); else listeners.delete(live); };
  listeners.add(live);
  row.append(btn, text('p', HELP, 'hint f-ascolta-help'));
}

/* ---- scorciatoie dal lettore ---- */
function startFromPos() { const [b, c, v] = notes.pos(); start(b, c, v, {openSheet: true}); }

registerFeature({
  id: 'ascolta',
  heroActions: [{id: 'ascolta', label: 'Ascolta', icon: 'asc-headphones', order: 10, run: () => startFromPos()}],
  verseActions: [{id: 'ascolta', label: 'Ascolta da qui', icon: 'asc-headphones', order: 25, when: () => supported(), run: sel => start(sel.book, sel.ch, sel.from)}],
  settings: [{id: 'ascolta-voce', section: 'Ascolto', order: 10, label: 'Voce per la lettura', render: settingsRow}],
  textDecorators: [{id: 'ascolta', order: 90, decorate(textEl, info) {
    if (active() && info.book === P.b && info.ch === P.c && verseOf()?.n === info.n) textEl.parentNode?.classList.add('f-ascolta-now');
  }}],
  onReady() {
    buildMini();
    loadVoices();                                                 // le voci iOS arrivano in ritardo: si parte presto
    listeners.add(updateMini);
    bus.on('screen:show', () => { updateMini(); setTimeout(() => highlight(false), 60); });
    bus.on('chapter:loaded', () => setTimeout(() => highlight(false), 30));
    bus.on('notes:changed', () => setTimeout(() => highlight(false), 30));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheetApi && mini && !mini.hidden && mini.contains(document.activeElement)) mini._info.blur(); });
    updateMini();
  },
});
