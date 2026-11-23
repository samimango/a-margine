/* Azione sul versetto: copia il testo selezionato con il riferimento */
import {registerFeature} from '../core/features.js';
import {copyToClipboard, toast} from '../core/ui.js';

registerFeature({
  id: 'copia',
  verseActions: [{
    id: 'copia', order: 30, label: 'Copia', icon: 'copy',
    async run(sel) {
      const body = sel.text ? '«' + sel.text + '»\n' : '';
      const ok = await copyToClipboard(body + sel.ref + ' (Riveduta 2020)');
      toast(ok ? 'Copiato negli appunti' : 'Copia non riuscita');
    },
  }],
});
