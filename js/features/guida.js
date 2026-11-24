/* Editor della meditazione «ricco»: area di scrittura curata, lampadina con UNA riga di domande guida, dettatura.
   Contratto: noteEditor.mount(box, api) → {setText, focus, destroy}; api.changed(testo) a ogni modifica. */
import {registerFeature} from '../core/features.js';

const QUESTIONS = ['Cosa dice?', 'Cosa significa?', 'Cosa cambia per me?'];
const HINT = 'Detta la nota';
const KEYBOARD_HINT = 'Usa il microfono della tastiera per dettare';
const SVG = {
  bulb: '<path d="M9.5 18h5M10.2 21h3.6M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6"/>',
  stop: '<rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor"/>',
};
const svg = (name, size = 20) => { const t = document.createElement('template'); t.innerHTML = `<svg class="ic-svg" aria-hidden="true" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${SVG[name]}</svg>`; return t.content.firstChild; };

function mount(box, api) {
  const {h} = api.ctx.dom;
  let hintTimer = 0, rec = null, listening = false;
  const area = h('textarea', {id: 'note', class: 'f-guida-area', enterkeyhint: 'enter', placeholder: 'Cosa ti colpisce?', 'aria-label': 'Meditazione', on: {input: () => api.changed(area.value)}});
  api.ctx.dom.noAutofill(area, 'meditazione-testo', 'note'); area.value = api.text;

  const chips = h('div', {class: 'f-guida-chips', id: 'f-guida-chips', role: 'group', 'aria-label': 'Domande guida', hidden: true},
    QUESTIONS.map(q => h('button', {type: 'button', class: 'f-guida-chip', text: q, on: {click: () => insertQuestion(q)}})));
  const bulb = h('button', {type: 'button', class: 'f-guida-bulb', 'aria-label': 'Domande guida', 'aria-expanded': 'false', 'aria-controls': 'f-guida-chips', title: 'Domande guida', on: {click: toggleChips}}, svg('bulb', 22));
  const micIcon = h('span', {class: 'f-guida-micic'}, svg('mic'));
  const mic = h('button', {type: 'button', class: 'f-guida-mic', 'aria-label': 'Detta la nota', 'aria-pressed': 'false', on: {click: onMic}}, micIcon);
  const hint = h('span', {class: 'f-guida-hint', role: 'status', 'aria-live': 'polite', text: HINT});
  const root = h('div', {class: 'f-guida'}, h('div', {class: 'f-guida-card'}, area, chips, h('div', {class: 'f-guida-bar'}, mic, hint, bulb)));
  box.append(root);

  function setHint(t, ms = 0) {
    clearTimeout(hintTimer); hint.textContent = t; hint.classList.toggle('on', t !== HINT);
    if (ms) hintTimer = setTimeout(() => setHint(listening ? 'In ascolto…' : HINT), ms);
  }
  function toggleChips() {
    const open = chips.hidden;
    chips.hidden = !open; bulb.setAttribute('aria-expanded', String(open)); bulb.classList.toggle('on', open);
  }
  function put(value) {
    area.value = value;
    area.focus({preventScroll: true});
    area.setSelectionRange(value.length, value.length);
    area.scrollTop = area.scrollHeight;
    api.changed(area.value);
  }
  /* la domanda comincia un nuovo paragrafo */
  function insertQuestion(q) {
    const base = area.value.replace(/\s+$/, '');
    put((base ? base + '\n\n' : '') + q + ' ');
  }

  /* Dettatura: solo dove esiste un'API affidabile; altrimenti si guida verso il microfono della tastiera */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function stopListening() { listening = false; mic.setAttribute('aria-pressed', 'false'); mic.classList.remove('on'); mic.setAttribute('aria-label', 'Detta la nota'); try { rec?.stop(); } catch { /* ok */ } rec = null; setHint(HINT); }
  function onMic() {
    if (!SR) { area.focus(); setHint(KEYBOARD_HINT, 7000); return; }
    if (listening) { stopListening(); return; }
    let r;
    try { r = new SR(); } catch { area.focus(); setHint(KEYBOARD_HINT, 7000); return; }
    const pos = area.selectionStart ?? area.value.length;
    const pre = area.value.slice(0, pos), post = area.value.slice(area.selectionEnd ?? pos);
    let said = '';
    const compose = () => { const sep = pre && !/\s$/.test(pre) && said ? ' ' : ''; return pre + sep + said + (post && said && !/^\s/.test(post) ? ' ' : '') + post; };
    r.lang = 'it-IT'; r.interimResults = true; r.continuous = true;
    r.onresult = ev => {
      let interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) said += (said && !/\s$/.test(said) ? ' ' : '') + t.trim(); else interim += t;
      }
      if (said) { area.value = compose(); api.changed(area.value); }
      setHint(interim ? 'In ascolto… ' + interim.trim() : 'In ascolto…');
    };
    r.onerror = ev => {
      if (ev.error === 'no-speech' || ev.error === 'aborted') return;
      stopListening(); setHint(ev.error === 'not-allowed' || ev.error === 'service-not-allowed' ? 'Microfono non consentito. ' + KEYBOARD_HINT : 'Dettatura non disponibile. ' + KEYBOARD_HINT, 7000);
    };
    r.onend = () => { if (listening) stopListening(); };
    rec = r; listening = true;
    mic.setAttribute('aria-pressed', 'true'); mic.classList.add('on'); mic.setAttribute('aria-label', 'Ferma la dettatura');
    setHint('In ascolto…');
    try { r.start(); } catch { stopListening(); setHint(KEYBOARD_HINT, 7000); }
  }
  return {
    setText: t => { if (area.value !== t) area.value = t; },
    focus: () => area.focus({preventScroll: true}),
    destroy() { clearTimeout(hintTimer); listening = false; try { rec?.abort?.(); } catch { /* ok */ } rec = null; },
  };
}

const CSS = `
.f-guida-card { background: var(--card); border-radius: var(--r-card); box-shadow: var(--shadow-card); padding: 6px 16px 10px; }
.editor-box .f-guida-area { display: block; width: 100%; min-height: 34dvh; padding: 12px 0 6px; border: 0; background: transparent; resize: none; outline: none; font: 400 20px/1.55 var(--serif-read); color: var(--ink); }
.editor-box .f-guida-area::placeholder { color: var(--dim); opacity: .8; }
.f-guida-chips { display: flex; flex-wrap: nowrap; gap: 5px; overflow-x: auto; padding: 8px 0 10px; border-top: 1px solid var(--line); scrollbar-width: none; }
.f-guida-chips::-webkit-scrollbar { display: none; }
.f-guida-chip { position: relative; flex: none; height: 38px; padding: 0 8px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--d1) 22%, var(--card)); box-shadow: inset 0 0 0 .6px color-mix(in srgb, var(--d1) 45%, transparent); font: 500 12px var(--sans); white-space: nowrap; }
.f-guida-chip::after { content: ''; position: absolute; inset: -4px -2px; }
.f-guida-bar { display: flex; align-items: center; gap: 10px; border-top: 1px solid var(--line); padding-top: 8px; margin-top: 2px; }
.f-guida-chips:not([hidden]) + .f-guida-bar { margin-top: 0; }
.f-guida-mic, .f-guida-bulb { flex: none; width: var(--hit); height: var(--hit); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; transition: background-color .2s, color .2s; }
.f-guida-mic { background: var(--ink); color: var(--bg); }
.f-guida-mic.on { background: var(--accent); color: var(--accent-ink); animation: f-guida-pulse 1.4s ease-in-out infinite; }
.f-guida-bulb { color: var(--dim); background: var(--chip); }
.f-guida-bulb.on { color: var(--accent); background: color-mix(in srgb, var(--d1) 24%, var(--card)); }
.f-guida-hint { flex: 1; min-width: 0; font: 500 13px/1.3 var(--sans); color: var(--dim); }
.f-guida-hint.on { color: var(--ink); }
@keyframes f-guida-pulse { 50% { box-shadow: 0 0 0 7px color-mix(in srgb, var(--accent) 22%, transparent); } }
`;
function ensureStyle() { if (!document.getElementById('f-guida-css')) { const s = document.createElement('style'); s.id = 'f-guida-css'; s.textContent = CSS; document.head.append(s); } }
ensureStyle();

/* priorità 5: sopra l'editor predefinito (1); un editor ancora più specifico può sostituirlo */
registerFeature({id: 'guida', noteEditor: {id: 'guida', priority: 5, mount}});
