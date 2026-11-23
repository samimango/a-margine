/* Avvio dell'app: tema → configurazione → router/schermate → feature → sincronizzazione → service worker */
import * as theme from './core/theme.js';
import * as api from './core/api.js';
import * as router from './core/router.js';
import * as sync from './core/sync.js';
import * as features from './core/features.js';
import * as chapters from './core/chapters.js';
import * as ui from './core/ui.js';
import featureList from './features/index.js';
import oggi from './screens/oggi.js';
import libreria from './screens/libreria.js';
import libro from './screens/libro.js';
import leggi from './screens/leggi.js';
import nota from './screens/nota.js';
import quaderno from './screens/quaderno.js';
import cerca from './screens/cerca.js';
import impostazioni from './screens/impostazioni.js';
import collega from './screens/collega.js';

theme.initTheme();
const setup = api.consumeSetupHash();      // «#setup=indirizzo|chiave»: salva e pulisce l'URL

router.initRouter({
  root: document.getElementById('screens'), nav: document.getElementById('tabs'),
  tabList: [{id: 'oggi', label: 'Oggi', icon: 'sun'}, {id: 'libreria', label: 'Leggi', icon: 'book'}, {id: 'quaderno', label: 'Quaderno', icon: 'note'}, {id: 'cerca', label: 'Cerca', icon: 'search'}],
});
for (const s of [oggi, libreria, libro, leggi, nota, quaderno, cerca, impostazioni, collega]) router.defineScreen(s);

await features.loadFeatures(featureList);
chapters.loadPassages();
sync.init();
router.go('oggi', {}, {push: false});
features.runReady();
if (setup === 'ok') ui.toast('Collegato a Google');
else if (setup === 'invalid') ui.toast('Il link di configurazione non è valido');
document.documentElement.classList.add('ready');

/* Service worker: guscio dell'app disponibile anche offline */
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !api.hasCloudRunner()) {
  addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      const ready = await navigator.serviceWorker.ready;
      const urls = performance.getEntriesByType('resource').map(r => r.name).filter(u => u.startsWith(location.origin));
      (ready.active || reg.active)?.postMessage({type: 'precache', urls: [location.href, ...urls]});
    } catch { /* senza service worker l'app funziona lo stesso */ }
  });
}
