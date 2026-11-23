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
