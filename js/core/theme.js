/* Aspetto: tema (chiaro / carta / scuro), dimensione del testo, interlinea. Stesse chiavi dell'app precedente. */
import * as store from './store.js';
import {K} from './store.js';
import {emit} from './bus.js';

export const themeNames = {light: 'Chiaro', paper: 'Carta', dark: 'Scuro'};
export const THEMES = ['light', 'paper', 'dark'];
export const sizes = [20, 23, 26, 30], sizeNames = ['Piccolo', 'Medio', 'Grande', 'Enorme'];
/* indici 0 e 1 come nell'app precedente (Normale, Ampia); 2 = Stretta è nuova */
export const leads = [1.65, 1.9, 1.45], leadNames = ['Normale', 'Ampia', 'Stretta'];
const clampIdx = (v, n) => Math.min(Math.max(Math.trunc(Number(v)) || 0, 0), n - 1);

export function currentTheme() {
  const t = document.documentElement.dataset.theme;
  return THEMES.includes(t) ? t : (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'paper');
}
const META = {light: '#f4f0e8', paper: '#f6f1e7', dark: '#000000'};
export function setTheme(t) {
  if (!THEMES.includes(t)) return;
  document.documentElement.dataset.theme = t;
  store.set(K.theme, t);
  syncMeta();
  emit('theme:changed', t);
}
export function syncMeta() {
  const col = META[currentTheme()];
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => { m.content = col; m.removeAttribute('media'); });
}
export const getSize = () => clampIdx(store.get(K.font), sizes.length);
export const getLead = () => clampIdx(store.get(K.lead), leads.length);
export function setSize(i) { store.set(K.font, clampIdx(i, sizes.length)); applyAppearance(); emit('theme:changed'); }
export function setLead(i) { store.set(K.lead, clampIdx(i, leads.length)); applyAppearance(); emit('theme:changed'); }
export function applyAppearance() {
  const st = document.documentElement.style;
  st.setProperty('--verse-size', sizes[getSize()] + 'px');
  st.setProperty('--verse-lh', leads[getLead()]);
}
export function initTheme() {
  const stored = store.get(K.theme);
  document.documentElement.dataset.theme = THEMES.includes(stored) ? stored : (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'paper');
  syncMeta(); applyAppearance();
}
