/* Impostazioni → Dati: esporta o copia tutte le meditazioni in testo semplice */
import {registerFeature} from '../core/features.js';
import * as notes from '../core/notes.js';
import {loadSections} from '../core/chapters.js';
import {copyToClipboard, toast} from '../core/ui.js';
import {colorNames, ref} from '../core/bible.js';
import {isoDay} from '../core/dom.js';
import {passageOf} from '../components/entry.js';

function notesText(ids) {
  const labels = notes.labels();
  const blocks = ids.map(id => {
    const r = notes.record(id), lines = [ref(id)];
    if (r.color != null) lines.push('Colore: ' + colorNames[r.color] + ' · ' + labels[r.color]);
    const txt = passageOf(id); if (txt) lines.push('Testo: ' + txt);
    lines.push('Meditazione:', r.note, '');
    return lines.join('\n');
  });
  return ['A margine · Meditazioni', 'Esportate il ' + isoDay(), '', ...blocks].join('\n');
}
/* Prima di esportare si recupera dalla cache il testo dei capitoli delle note */
const sectionsOf = ids => ids.filter(id => !id.startsWith('free.') && Number(id.split('.')[2]) >= 1).map(id => id.split('.').slice(0, 2).join('.'));

async function exportNotes() {
  const ids = notes.noteIds();
  if (!ids.length) { toast('Non ci sono meditazioni da esportare.'); return; }
  await loadSections(sectionsOf(ids));
  const url = URL.createObjectURL(new Blob([notesText(ids)], {type: 'text/plain;charset=utf-8'}));
  const a = document.createElement('a'); a.href = url; a.download = 'meditazioni-' + isoDay() + '.txt';
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('File scaricato');
}
async function copyNotes() {
  const ids = notes.noteIds();
  if (!ids.length) { toast('Non ci sono meditazioni da copiare.'); return; }
  await loadSections(sectionsOf(ids));
  toast(await copyToClipboard(notesText(ids)) ? 'Copiato negli appunti' : 'Copia non riuscita. Usa Esporta.');
}
registerFeature({
  id: 'esporta',
  settings: [
    {id: 'export', section: 'Dati', order: 10, label: 'Esporta le meditazioni', icon: 'download', onTap: exportNotes},
    {id: 'copyall', section: 'Dati', order: 20, label: 'Copia negli appunti', icon: 'copy', onTap: copyNotes},
  ],
});
