/* Impostazioni → Dati: importa il testo della Riveduta 2020 da un file TXT (un versetto per riga) */
import {registerFeature} from '../core/features.js';
import * as chapters from '../core/chapters.js';
import {sheet} from '../core/ui.js';
import {h} from '../core/dom.js';
import {names, counts, MAX_VERSE} from '../core/bible.js';
import {openRef} from '../core/nav.js';

async function importText(file) {
  const lines = (await file.text()).split(/\r?\n/), groups = new Map();
  for (const [i, line] of lines.entries()) {
    if (!line.trim()) continue;
    const m = line.trim().match(/^(.+?)\s+(\d+)[:,](\d+)\s+(.+)$/);
    const book = m ? names.findIndex(n => n.toLowerCase() === m[1].toLowerCase()) : -1;
    if (book < 0 || +m[2] < 1 || +m[2] > counts[book] || +m[3] < 1 || +m[3] > MAX_VERSE) throw Error('Controlla il riferimento alla riga ' + (i + 1) + '.');
    const chapter = book + '.' + Number(m[2]); if (!groups.has(chapter)) groups.set(chapter, {});
    const id = chapter + '.' + Number(m[3]); if (groups.get(chapter)[id]) throw Error('Versetto duplicato alla riga ' + (i + 1) + '.');
    groups.get(chapter)[id] = m[4];
  }
  if (!groups.size) throw Error('Il file è vuoto.');
  await chapters.importPassages(groups);
  openRef(...Object.keys(groups.values().next().value)[0].split('.'));
}
registerFeature({
  id: 'importa',
  settings: [{
    id: 'import', section: 'Dati', order: 30, label: 'Importa il testo della Bibbia', icon: 'upload',
    onTap() {
      sheet({title: 'Importa la Riveduta 2020', build(body, sh) {
        const input = h('input', {type: 'file', accept: '.txt,text/plain', 'aria-label': 'File della Riveduta 2020'});
        const msg = h('p', {role: 'status', class: 'hint'});
        input.onchange = async () => {
          if (!input.files.length) return; input.disabled = true;
          try { await importText(input.files[0]); sh.close(); } catch (err) { msg.textContent = err.message; } finally { input.disabled = false; input.value = ''; }
        };
        body.append(h('p', {text: 'Scegli un file TXT UTF-8 della tua copia, con un versetto per riga. I riferimenti presenti nel file aggiornano il testo locale.'}), h('pre', {text: 'Giovanni 1:1 Testo del versetto'}), input, msg);
      }});
    },
  }],
});
