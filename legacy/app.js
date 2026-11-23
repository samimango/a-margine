'use strict';
const $ = id => document.getElementById(id);
const names = 'Genesi|Esodo|Levitico|Numeri|Deuteronomio|Giosuè|Giudici|Rut|1 Samuele|2 Samuele|1 Re|2 Re|1 Cronache|2 Cronache|Esdra|Neemia|Ester|Giobbe|Salmi|Proverbi|Ecclesiaste|Cantico dei Cantici|Isaia|Geremia|Lamentazioni|Ezechiele|Daniele|Osea|Gioele|Amos|Abdia|Giona|Michea|Naum|Abacuc|Sofonia|Aggeo|Zaccaria|Malachia|Matteo|Marco|Luca|Giovanni|Atti|Romani|1 Corinzi|2 Corinzi|Galati|Efesini|Filippesi|Colossesi|1 Tessalonicesi|2 Tessalonicesi|1 Timoteo|2 Timoteo|Tito|Filemone|Ebrei|Giacomo|1 Pietro|2 Pietro|1 Giovanni|2 Giovanni|3 Giovanni|Giuda|Apocalisse'.split('|');
const counts = [50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22];
const colorNames=['Giallo','Blu','Verde','Rosa','Viola'];
const defaultLabels=['Com’è Dio','Evento','Promessa','Preghiera','Insegnamento'];
const labels=(()=>{try{const l=JSON.parse(localStorage.getItem('margine.labels'));if(Array.isArray(l)&&l.length===5&&l.every(x=>typeof x==='string'&&x.trim()))return l}catch{}return [...defaultLabels]})();
const prefix='margine.nota.';
let [b,c,v]=(()=>{try{const p=JSON.parse(localStorage.getItem('margine.pos'));if(Array.isArray(p)){const [x,y,z]=p.map(Number);if(Number.isInteger(x)&&x>=0&&x<counts.length&&Number.isInteger(y)&&y>=1&&y<=counts[x]&&Number.isInteger(z)&&z>=1&&z<=176)return [x,y,z]}}catch{}return [42,1,1]})();
let passages={}, chapterText={}, cachedText={}, requested='', colorFilter='', selA=null, selB=null, activeNote=null, pendingScroll=true, leave=null;
let view='home', writeFrom='read', pickT=b<39?0:1, pickedBook=b, nbTab='notes', srTab='bible';
const sample={'42.1.1':'Nel principio era la Parola, e la Parola era con Dio, e la Parola era Dio.','42.1.2':'Essa era nel principio con Dio.'};
const uuid=()=>crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,ch=>{const r=Math.random()*16|0;return(ch==='x'?r:r&3|8).toString(16)});
const vk=n=>[b,c,n].join('.');
const key=()=>[b,c,v].join('.');
function record(id){try{const r=JSON.parse(localStorage.getItem(prefix+id));return r&&typeof r==='object'?r:{}}catch{return{}}}
const textOf=id=>chapterText[id]||passages[id]||cachedText[id]||sample[id]||'';
function node(tag,text){const el=document.createElement(tag);el.textContent=text;return el}
function ref(id){
  if(id.startsWith('free.'))return 'Meditazione libera';
  const [book,ch,start,end]=id.split('.');
  const base=names[book]+' '+ch;
  if(start==='0')return base+' · Capitolo';
  return base+','+start+(end&&end!==start?'–'+end:'');
}
function bounds(id){const [, ,from,to]=id.split('.');return [Number(from),Number(to??from)]}
function annotated(){return Object.keys(localStorage).filter(k=>k.startsWith(prefix)).map(k=>k.slice(prefix.length))}
function chapterLimit(){return Object.keys(chapterText).length?Math.max(...Object.keys(chapterText).map(id=>Number(id.split('.')[2]))):176}
function savePos(){try{localStorage.setItem('margine.pos',JSON.stringify([b,c,v]))}catch{}}
/* Testo dei capitoli già letti (cache offline) per mostrare i versetti di note e segnalibri di altri capitoli */
const triedSections=new Set();
async function loadSections(list){
  let changed=false;
  for(const s of new Set(list)){
    if(triedSections.has(s))continue;
    triedSections.add(s);
    const t=await cacheGet(s);
    if(t){Object.assign(cachedText,t);changed=true}
  }
  return changed;
}

/* Segnalibri (sincronizzati: campo bm.<libro>.<cap>.<versetto> = timestamp, oppure null se tolto) */
function bookmarks(){try{const l=JSON.parse(localStorage.getItem('margine.bm')||'[]');return Array.isArray(l)?l.filter(m=>Array.isArray(m)&&names[m[0]]):[]}catch{return []}}
const isBm=(bk,ch,vs)=>bookmarks().some(m=>m[0]===bk&&m[1]===ch&&m[2]===vs);
function toggleBm(bk,ch,vs){
  let list=bookmarks();const had=isBm(bk,ch,vs),stamp=Date.now();
  list=had?list.filter(m=>!(m[0]===bk&&m[1]===ch&&m[2]===vs)):[[bk,ch,vs,stamp],...list];
  try{localStorage.setItem('margine.bm',JSON.stringify(list))}catch{}
  stage('bm.'+bk+'.'+ch+'.'+vs,had?null:stamp);
  refresh();
}
const bmRef=m=>names[m[0]]+' '+m[1]+','+m[2];
function migrateBookmarks(){
  if(!connected||localStorage.getItem('margine.bm.sync'))return;
  const base=Date.now();
  const list=bookmarks().map((m,i)=>[m[0],m[1],m[2],Number.isSafeInteger(m[3])&&m[3]>0?m[3]:base-i]);
  try{localStorage.setItem('margine.bm',JSON.stringify(list));localStorage.setItem('margine.bm.sync','1')}catch{return}
  for(const m of list){const id='bm.'+m[0]+'.'+m[1]+'.'+m[2];if(!snapshot[id]&&!pending[id])stage(id,m[3])}
}
migrateBookmarks();

/* Salvataggio */
function saveNote(target,fields,quiet){
  if(!target)return false;
  if(connected&&typeof fields.note==='string'&&new Blob([JSON.stringify(fields.note)]).size>8000){
    $('note').value=record(target).note||'';$('status').textContent='Limite raggiunto (8 KB).';return false;
  }
  const before=record(target),item={...before,...fields};
  try{
    if(item.note||item.color!=null)localStorage.setItem(prefix+target,JSON.stringify(item));
    else localStorage.removeItem(prefix+target);
    if(item.note)localStorage.setItem('margine.lastmed',target);
    $('status').textContent='Salvato';
  }catch{$('status').textContent='Non salvato. Copia la nota.';return false}
  for(const [field,value] of Object.entries(fields)){if((before[field]??(field==='note'?'':null))!==value)stage(target+'.'+field,value)}
  if(!quiet)refresh();
  return true;
}

/* Navigazione tra le schermate. `trail` rispecchia la cronologia del browser: il tasto Indietro del telefono torna alla schermata precedente
   e dalla Home esce dall'app. Con Apps Script la pagina è in un iframe: se pushState non è permesso si prosegue senza cronologia. */
const views=['home','read','pick','chap','write','notebook','search'];
const tabOf={home:'home',read:'read',pick:'read',chap:'read',write:'read',notebook:'notebook',search:'search'};
const trail=['home'];let histOk=true,navSeq=0;
try{history.scrollRestoration='manual'}catch{}
function go(next,push=true){
  hideToast();navSeq++;
  const prev=view;
  if(prev==='read'&&next!=='read'){if(jumpV===null)trackPos();leave={sec:b+'.'+c,y:scrollY}}
  view=next;
  for(const id of views)$(id).hidden=id!==next;
  document.querySelectorAll('#tabs [data-go]').forEach(t=>{if(t.dataset.go===tabOf[next])t.setAttribute('aria-current','page');else t.removeAttribute('aria-current')});
  $('tabs').hidden=next==='write';
  if(push&&histOk){
    try{
      if(next===prev)history.replaceState({v:next,i:trail.length-1},'');
      else{trail.push(next);history.pushState({v:next,i:trail.length-1},'')}
    }catch{histOk=false}
  }
  let restoreY=null;
  if(next==='read'&&prev!=='read'&&!pendingScroll){
    if(leave&&leave.sec===b+'.'+c&&(Object.keys(chapterText).length||!connected))restoreY=leave.y;else pendingScroll=true;
  }
  if(next!=='read')window.scrollTo(0,0);
  if(prev!==next)enter(next);
  if(next==='read')$('readTop').classList.remove('away');
  if(next==='search')renderRecentS();
  refresh();updateActions();
  if(next==='pick')renderPick();
  if(next==='read'){if(restoreY!==null)window.scrollTo(0,restoreY);else doScroll()}
  if(prev!==next&&next!=='write')focusScreen(next);
}
/* Dopo il cambio di schermata il focus va in cima alla nuova schermata (lettori di schermo e tastiera) */
function focusScreen(name){
  const el=$(name);
  if(!el)return;
  el.tabIndex=-1;el.style.outline='none';
  try{el.focus({preventScroll:true})}catch{}
}
/* Torna indietro: se la schermata richiesta è quella precedente usa la cronologia, altrimenti vi passa direttamente */
function back(target){
  if(histOk&&trail.length>1&&trail[trail.length-2]===target){
    const seq=navSeq;history.back();
    setTimeout(()=>{if(navSeq===seq)go(target)},400);
  }else go(target);
}
window.addEventListener('popstate',e=>{
  const s=e.state,i=Number.isInteger(s?.i)?s.i:0;
  if(!$('sheet').hidden)closeSheet(true);
  let target=trail[i]||s?.v||'home';
  if(target==='sheet')target=s?.v&&s.v!=='sheet'?s.v:'read';
  if(target==='write')target=['notebook','home','search'].includes(writeFrom)?writeFrom:'read';
  trail.length=i;trail[i]=target;
  if(!views.includes(target))target='home';
  if(target===view){updateActions();return}
  go(target,false);
});
try{history.replaceState({v:'home',i:0},'')}catch{histOk=false}
function refresh(){
  if(view==='read'){renderText();renderHeader()}
  else if(view==='home')renderHome();
  else if(view==='notebook')renderNotebook();
  else if(view==='search'&&srTab==='notes')renderNoteSearch();
  if(view==='read'||view==='write')palette();
}
function openRef(book,ch,vs){
  book=Number(book);
  if(!Number.isInteger(book)||book<0||book>=names.length)return;
  ch=Math.min(Math.max(Number(ch)||1,1),counts[book]);
  const same=book===b&&ch===c;
  b=book;c=ch;v=Math.min(Math.max(Number(vs)||1,1),176);selA=selB=null;pendingScroll=true;savePos();addRecent(b,c);
  if(!same||requested!==b+'.'+c)loadChapter();
  go('read');
}
function turnChapter(d){
  let book=b,chapter=c+d;
  if(chapter>counts[b]){book++;chapter=1}
  if(chapter<1){book--;if(book>=0)chapter=counts[book]}
  if(book>=0&&book<names.length)openRef(book,chapter,1);
}
function doScroll(){
  if(!pendingScroll||view!=='read')return;
  const loaded=Object.keys(chapterText).length>0||!connected;
  if(v<=1){window.scrollTo(0,0);if(loaded)pendingScroll=false;return}
  if(!loaded)return;
  /* se il versetto non esiste (testo con lacune) si resta all'inizio ma si riprende a registrare la posizione */
  const el=$('v'+v);
  if(el){el.scrollIntoView({block:'start'});jumpV=v}
  pendingScroll=false;
}
/* Dopo un salto (Riprendi, Vai al versetto) in fondo al capitolo il versetto scelto può non arrivare in cima: finché lo si vede e non si scorre a mano, la posizione resta quella */
let scrollTimer,jumpV=null;
for(const evt of ['wheel','touchstart','mousedown','keydown'])addEventListener(evt,()=>{jumpV=null},{passive:true,capture:true});
addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(trackPos,250)},{passive:true});
function trackPos(){
  clearTimeout(scrollTimer);
  if(view!=='read'||pendingScroll)return;
  if(jumpV!==null){
    const r=$('v'+jumpV)?.getBoundingClientRect();
    if(r&&r.bottom>80&&r.top<innerHeight)return;
    jumpV=null;
  }
  let found=null;
  for(const el of $('verses').children){if(el.getBoundingClientRect().bottom>80){found=Number(el.dataset.n);break}}
  if(found&&found!==v){v=found;savePos();renderHeader()}
}
/* Prima che la pagina venga chiusa o nascosta si salva subito la posizione */
const flushPos=()=>{if(jumpV===null)trackPos();savePos()};
document.addEventListener('visibilitychange',()=>{if(document.hidden)flushPos()});
addEventListener('pagehide',flushPos);

/* Home */
function renderHome(){
  const h=new Date().getHours();
  $('greet').textContent=h<12?'Buongiorno':h<18?'Buon pomeriggio':'Buonasera';
  $('resRef').textContent=names[b]+' '+c+','+v;
  const t=textOf(key());$('resText').textContent=t;$('resText').hidden=!t;
  const box=$('homeBm');box.replaceChildren();
  const list=bookmarks().slice(0,4);
  if(!list.length)box.append(node('p','Nessun segnalibro. Toccando un versetto puoi aggiungerne uno.'));
  for(const m of list){
    const btn=node('button',bmRef(m));btn.className='row';btn.append(node('span','›'));
    btn.onclick=()=>openRef(m[0],m[1],m[2]);box.append(btn);
  }
  const rec=recents(),recBox=$('homeRecent');recBox.replaceChildren();$('recentBox').hidden=!rec.length;
  for(const [bk,ch] of rec){const btn=node('button',counts[bk]===1?names[bk]:names[bk]+' '+ch);btn.className='row';btn.append(node('span','›'));btn.onclick=()=>openRef(bk,ch,1);recBox.append(btn)}
  const last=localStorage.getItem('margine.lastmed'),med=$('lastMed');med.replaceChildren();
  if(last&&record(last).note){
    const btn=node('button','');btn.className='med';btn.append(node('small',ref(last)),document.createTextNode(shortText(record(last).note,180)));
    btn.onclick=()=>openWrite(last,'home');med.append(btn);
  }else med.append(node('p','Ancora nessuna meditazione.'));
  $('textSize').replaceChildren(document.createTextNode('Dimensione del testo'),node('span',sizeNames[size]));
  $('themeBtn').replaceChildren(document.createTextNode('Tema'),node('span',themeNames[currentTheme()]));
  showConflicts();
  $('source').href='https://www.laparola.net/testo.php?'+new URLSearchParams({riferimento:names[b]+' '+c+':'+v,'versioni[]':'Riveduta 2020'});
}

/* Lettura */
function renderHeader(){
  $('heading').textContent=names[b]+' '+c;
  $('prev').disabled=$('bottomPrev').disabled=b===0&&c===1;
  $('next').disabled=$('bottomNext').disabled=b===names.length-1&&c===counts[b];
  $('bmBtn').setAttribute('aria-pressed',isBm(b,c,v));
}
function renderText(){
  const section=b+'.'+c+'.',all=annotated().filter(id=>id.startsWith(section));
  const recs=new Map(),rec=id=>{let r=recs.get(id);if(!r){r=record(id);recs.set(id,r)}return r};
  const ids=new Set([...Object.keys(chapterText),...Object.keys(sample),...Object.keys(passages),...all.filter(id=>id.split('.').length===3)].filter(id=>id.startsWith(section)));
  const rangeColor={},rangeNotes=new Map();
  for(const id of all.filter(id=>id.split('.').length>3)){
    const r=rec(id),[f,t]=bounds(id);
    if(r.color!=null)for(let n=f;n<=t;n++)if(rangeColor[n]==null)rangeColor[n]=r.color;
    if(r.note){if(!rangeNotes.has(f))rangeNotes.set(f,[]);rangeNotes.get(f).push(id)}
  }
  const bms=new Set(bookmarks().filter(m=>m[0]===b&&m[1]===c).map(m=>m[2]));
  const frag=document.createDocumentFragment();
  for(const id of [...ids].sort((x,y)=>Number(x.split('.')[2])-Number(y.split('.')[2]))){
    const vs=Number(id.split('.')[2]),item=rec(id),line=node('button','');
    line.className='verse';line.id='v'+vs;line.dataset.n=vs;line.setAttribute('aria-label','Versetto '+vs+': '+(textOf(id)||''));
    const inSel=selA!==null&&vs>=selA&&vs<=selB;
    line.classList.toggle('sel',inSel);line.setAttribute('aria-pressed',inSel);
    const color=item.color!=null?item.color:rangeColor[vs];
    if(color!=null)line.dataset.c=color+1;
    const words=node('span',textOf(id)||'Versetto '+vs);words.className='t'+(flashIds.has(id)?' hl':'');
    if(bms.has(vs)){const r=document.createElement('i');r.className='rib'+(freshBm===vs?' new':'');line.append(r)}
    line.append(node('sup',vs),words);
    if(item.note)line.append(node('em',item.note));
    for(const mid of rangeNotes.get(vs)||[])line.append(node('em',ref(mid)+' · '+rec(mid).note));
    frag.append(line);
  }
  $('verses').replaceChildren(frag);
  $('availability').textContent=Object.keys(chapterText).length?'Riveduta 2020 © ADI-Media · Testo da LaParola.net':Object.keys(passages).some(k=>k.startsWith(section))?'Testo importato sul dispositivo.':(b===42&&c===1?'Estratto locale · Giovanni 1,1–2.':'');
  updateActions();doScroll();
}
$('verses').addEventListener('click',e=>{const line=e.target.closest('.verse');if(line)tapVerse(Number(line.dataset.n))});
function shortText(t,n){t=String(t||'');if(t.length<=n)return t;const cut=t.slice(0,n),sp=cut.lastIndexOf(' ');return (sp>n*0.6?cut.slice(0,sp):cut).replace(/[\s,;:.–-]+$/,'')+'…'}
function themeMeta(){const col={light:'#ffffff',dark:'#000000',paper:'#f6f1e7'}[currentTheme()]||'#ffffff';document.querySelectorAll('meta[name="theme-color"]').forEach(m=>{m.content=col;m.removeAttribute('media')})}
function keepSelVisible(){if(selA===null)return;requestAnimationFrame(()=>{const last=$('v'+selB),bar=$('actions');if(!last||bar.hidden)return;const over=last.getBoundingClientRect().bottom-(bar.getBoundingClientRect().top-12);if(over>0)window.scrollBy({top:over,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'})})}
function paintSel(){
  for(const line of $('verses').children){
    const on=selA!==null&&Number(line.dataset.n)>=selA&&Number(line.dataset.n)<=selB;
    line.classList.toggle('sel',on);line.setAttribute('aria-pressed',on);
  }
}
function tapVerse(n){
  if(selA===null)selA=selB=n;
  else if(selA===selB&&n===selA)selA=selB=null;
  else if(selA===selB){selB=Math.max(n,selA);selA=Math.min(n,selA)}
  else selA=selB=n;
  if(selA!==null&&v!==selA){v=selA;savePos()}
  paintSel();palette();updateActions();keepSelVisible();
}
function selRef(){return names[b]+' '+c+','+selA+(selB>selA?'–'+selB:'')}
function updateActions(){
  const on=selA!==null&&view==='read';
  $('actions').hidden=!on;
  document.body.classList.toggle('has-actions',on);
  if(!on){document.documentElement.style.setProperty('--bar-h','0px');return}
  $('aref').textContent=selRef();
  $('bmSel').textContent=isBm(b,c,selA)?'Togli segnalibro':'Segnalibro';
  document.documentElement.style.setProperty('--bar-h',$('actions').offsetHeight+'px');
}
function dots(box,current,pick){
  box.replaceChildren();
  const none=node('button','–');none.className='none';none.title='Nessun colore';none.setAttribute('aria-label','Nessun colore');
  none.setAttribute('aria-pressed',current==null);none.onclick=()=>pick(null);box.append(none);
  labels.forEach((label,i)=>{
    const btn=node('button','');btn.style.setProperty('--c','var(--d'+(i+1)+')');
    btn.title=colorNames[i]+' · '+label;btn.setAttribute('aria-label',colorNames[i]+' · '+label);
    btn.setAttribute('aria-pressed',current===i);btn.onclick=()=>pick(i);box.append(btn);
  });
}
function palette(){
  const first=selA!==null?record(vk(selA)).color:null;
  dots($('palette2'),first==null?null:first,i=>applyColor(i));
  $('cname').textContent=first!=null?colorNames[first]+' · '+labels[first]:'Scegli un colore per evidenziare';
  const cur=activeNote?record(activeNote).color:null;
  dots($('palette'),cur==null?null:cur,i=>{
    if(!ensureId())return;
    const id=activeNote,old=record(id).color??null;
    saveNote(id,{color:i===cur?null:i});
    notify('Colore cambiato',()=>saveNote(id,{color:old}));
  });
}
function applyColor(i){
  if(selA===null)return;
  const same=i!==null&&record(vk(selA)).color===i;
  const prev=[];
  for(let n=selA;n<=selB;n++){const id=vk(n);prev.push([id,record(id).color??null]);flashIds.add(id)}
  setTimeout(()=>{flashIds=new Set()},300);
  for(const [id] of prev)saveNote(id,{color:same?null:i},true);
  refresh();
  notify('Colore cambiato',()=>{for(const [id,old] of prev)saveNote(id,{color:old},true);refresh()});
}

/* Scrittura */
function newId(f,t){return [b,c,f,t,uuid()].join('.')}
function openWriteSel(){
  const f=selA,t=selB;
  let id=f===t?vk(f):annotated().find(k=>k.startsWith(b+'.'+c+'.')&&record(k).note&&bounds(k)[0]===f&&bounds(k)[1]===t)||newId(f,t);
  openWrite(id,'read');
}
function openWrite(id,from){
  activeNote=id;writeFrom=from||view;
  $('attachLabel').hidden=Boolean(id);
  if(!id)$('attach').replaceChildren(new Option('Meditazione libera','free'),new Option(ref(key()),'verse'),new Option(names[b]+' '+c+' · Capitolo','chapter'));
  $('note').value=id?record(id).note||'':'';$('status').textContent='';
  writeHead();go('write');
  $('note').focus({preventScroll:true});
}
function writeHead(){
  $('wRef').textContent=activeNote?ref(activeNote):'Nuova meditazione';
  let text='';
  if(activeNote&&!activeNote.startsWith('free.')){
    const [bk,ch,f,t]=activeNote.split('.'),first=Number(f),last=Number(t??f);
    for(let n=first;n>0&&n<=last;n++){const vid=bk+'.'+ch+'.'+n;text+=(passages[vid]||chapterText[vid]||cachedText[vid]||sample[vid]||'')+' '}
    /* nota di un altro capitolo: il testo si prende dalla cache dei capitoli già letti */
    if(!text.trim()&&first>0){const id=activeNote;loadSections([bk+'.'+ch]).then(found=>{if(found&&activeNote===id&&view==='write')writeHead()})}
  }
  $('wText').textContent=text.trim();$('wText').hidden=!text.trim();
  $('readPassage').hidden=!activeNote||activeNote.startsWith('free.');
}
function ensureId(){
  if(activeNote)return true;
  const mode=$('attach').value;
  activeNote=mode==='free'?'free.'+uuid():mode==='chapter'?newId(0,0):newId(v,v);
  $('attachLabel').hidden=true;writeHead();return true;
}
$('note').oninput=()=>{if(ensureId())saveNote(activeNote,{note:$('note').value})};
$('wDone').onclick=$('wBack').onclick=()=>{selA=selB=null;const f=writeFrom==='write'?'read':writeFrom;back(f==='notebook'||f==='home'||f==='search'?f:'read')};
$('readPassage').onclick=()=>{if(!activeNote||activeNote.startsWith('free.'))return;const [bk,ch,f]=activeNote.split('.');openRef(bk,ch,Number(f)||1)};
$('openNote').onclick=()=>openWriteSel();
$('bmSel').onclick=()=>{toggleBmUndo(b,c,selA);updateActions()};
$('aclose').onclick=()=>{selA=selB=null;renderText();updateActions()};
$('bmBtn').onclick=()=>toggleBmUndo(b,c,v);

/* Scegli libro e capitolo */
function renderPick(){
  document.querySelectorAll('#testSeg button').forEach(x=>x.setAttribute('aria-pressed',Number(x.dataset.t)===pickT));
  const box=$('books');box.replaceChildren();
  for(let i=pickT?39:0;i<(pickT?66:39);i++){
    const btn=node('button',names[i]);btn.className='row';
    if(i===b)btn.style.fontWeight='700';
    btn.append(node('span',counts[i]+(counts[i]===1?' capitolo':' capitoli')+' ›'));
    btn.onclick=()=>{pickedBook=i;if(counts[i]===1)openRef(i,1,1);else{renderChapters();go('chap')}};box.append(btn);
  }
}
function renderChapters(){
  $('chapTitle').textContent=names[pickedBook];
  const box=$('chapters');box.replaceChildren();
  for(let i=1;i<=counts[pickedBook];i++){
    const btn=node('button',i);if(pickedBook===b&&i===c)btn.setAttribute('aria-current','true');
    btn.onclick=()=>openRef(pickedBook,i,1);box.append(btn);
  }
}
document.querySelectorAll('#testSeg button').forEach(x=>x.onclick=()=>{pickT=Number(x.dataset.t);renderPick()});
$('titleBtn').onclick=()=>{pickT=b<39?0:1;go('pick')};
$('pickBack').onclick=()=>back('read');
$('chapBack').onclick=()=>back('pick');

/* Quaderno */
function entryRow(id,onclick){
  const item=record(id),btn=node('button','');btn.className='ent';
  const dot=document.createElement('i');if(item.color!=null)dot.style.setProperty('--dot','var(--d'+(item.color+1)+')');
  const body=document.createElement('div');body.append(node('strong',ref(id)),node('span',item.note));
  btn.append(dot,body);btn.onclick=onclick;return btn;
}
function renderNotebook(){
  document.querySelectorAll('#nbSeg button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.t===nbTab));
  $('compose').hidden=nbTab!=='notes';
  const chips=$('filters');chips.replaceChildren();chips.hidden=nbTab!=='notes';
  const box=$('entries');box.replaceChildren();
  if(nbTab==='marks'){
    const list=bookmarks();
    if(!list.length)box.append(node('p','Nessun segnalibro. Tocca un versetto e premi «Segnalibro».'));
    else if(list.some(m=>!textOf(m.slice(0,3).join('.'))))loadSections(list.map(m=>m[0]+'.'+m[1])).then(found=>{if(found&&view==='notebook'&&nbTab==='marks')renderNotebook()});
    for(const m of list){
      const row=document.createElement('div');row.className='ent';
      const dot=document.createElement('i');dot.className='bm';
      const open=node('button','');open.append(node('strong',bmRef(m)));
      const t=textOf(m.slice(0,3).join('.'));if(t)open.append(node('span',t));
      open.onclick=()=>openRef(m[0],m[1],m[2]);
      const x=node('button','×');x.className='x';x.setAttribute('aria-label','Togli segnalibro');x.onclick=()=>toggleBmUndo(m[0],m[1],m[2]);
      row.append(dot,open,x);box.append(row);
    }
    return;
  }
  for(const [value,label] of [['','Tutti'],...labels.map((text,i)=>[String(i),text])]){
    const chip=node('button','');chip.className='chip';
    if(value!==''){const dot=node('i','');dot.style.setProperty('--dot','var(--d'+(Number(value)+1)+')');chip.append(dot)}
    chip.append(document.createTextNode(label));chip.setAttribute('aria-pressed',value===colorFilter);
    chip.onclick=()=>{colorFilter=value;renderNotebook()};chips.append(chip);
  }
  const ids=annotated().filter(id=>{const r=record(id);return r.note&&(colorFilter===''||r.color===Number(colorFilter))}).sort((a,z)=>a.localeCompare(z,'it',{numeric:true}));
  if(!ids.length)box.append(node('p',colorFilter!==''?'Nessuna meditazione con questo colore.':'Ancora nessuna meditazione. Premi «+ Nuova» per iniziare.'));
  for(const id of ids)box.append(entryRow(id,()=>openWrite(id,'notebook')));
}
document.querySelectorAll('#nbSeg button').forEach(x=>x.onclick=()=>{nbTab=x.dataset.t;renderNotebook()});
$('compose').onclick=()=>openWrite(null,'notebook');

/* Cerca */
let searchRun=0,searchTerm='',nextStart=1;
function renderNoteSearch(){
  const q=$('word').value.trim().toLocaleLowerCase('it'),box=$('hits');box.replaceChildren();
  $('moreHits').hidden=true;
  if(!q){$('resultStatus').textContent='Scrivi una parola per cercare nelle tue note.';return}
  const ids=annotated().filter(id=>record(id).note&&(ref(id)+' '+record(id).note).toLocaleLowerCase('it').includes(q)).sort((a,z)=>a.localeCompare(z,'it',{numeric:true}));
  $('resultStatus').textContent=ids.length?ids.length+' trovate':'Nessuna nota trovata.';
  for(const id of ids)box.append(entryRow(id,()=>openWrite(id,'search')));
}
document.querySelectorAll('#srSeg button').forEach(x=>x.onclick=()=>{
  srTab=x.dataset.t;searchRun++;document.querySelectorAll('#srSeg button').forEach(y=>y.setAttribute('aria-pressed',y===x));
  $('hits').replaceChildren();$('moreHits').hidden=true;$('resultStatus').textContent='';
  if(srTab==='notes')renderNoteSearch();else if($('word').value.trim())searchBible(false);
});
async function searchBible(append){
  const term=append?searchTerm:$('word').value.trim();
  if(!term)return;
  const run=++searchRun;
  if(!append){searchTerm=term;nextStart=1;$('hits').replaceChildren()}
  $('moreHits').hidden=true;$('resultStatus').textContent='Ricerca in corso…';
  try{
    const html=await rpc('wordSearch',{term,start:nextStart});
    if(run!==searchRun)return;
    const doc=new DOMParser().parseFromString(html,'text/html');
    const headings=Array.from(doc.querySelectorAll('#brano h1'));
    const summary=doc.querySelector('h3 + p')?.textContent||'';
    const total=Number(summary.match(/in (\d+) versett/i)?.[1])||0;
    for(const h of headings){
      const reference=h.textContent.trim(),snippet=h.nextElementSibling?.textContent||'';
      const m=reference.match(/^(.+?)\s+(?:(\d+):)?(\d+)$/);
      const norm=s=>s.toLocaleLowerCase('it').replace(/\s+/g,'');
      const book=m?names.findIndex(n=>norm(n)===norm(m[1])):-1;
      const el=book<0?document.createElement('a'):node('button','');
      el.className='ent';const dot=document.createElement('i'),body=document.createElement('div');
      body.append(node('strong',reference),node('span',snippet));el.append(dot,body);
      if(book<0){el.href='https://www.laparola.net/testo.php?'+new URLSearchParams({riferimento:reference,'versioni[]':'Riveduta 2020'});el.target='_blank';el.rel='noopener noreferrer'}
      else el.onclick=()=>openRef(book,Number(m[2]||1),Number(m[3]));
      $('hits').append(el);
    }
    nextStart+=headings.length;
    $('resultStatus').textContent=headings.length||append?(total?total+' versetti trovati · ':'')+$('hits').children.length+' visualizzati':'Nessun versetto trovato.';
    $('moreHits').hidden=!headings.length||(total?nextStart>total:headings.length<20);
  }catch{
    if(run!==searchRun)return;
    $('resultStatus').textContent=connected?'Ricerca non disponibile. Riprova fra poco.':'Per cercare nella Bibbia avvia «Apri il quaderno» dalla cartella del progetto.';$('moreHits').hidden=!append;
  }
}
$('wordForm').onsubmit=e=>{e.preventDefault();rememberSearch($('word').value);if(srTab==='bible')searchBible(false);else renderNoteSearch();renderRecentS()};
$('word').oninput=()=>{if(srTab==='notes')renderNoteSearch();renderRecentS()};
$('moreHits').onclick=()=>searchBible(true);

/* Home: impostazioni */
function openDialog(title){$('content').replaceChildren(node('h2',title));$('dialog').showModal()}
$('colorsBtn').onclick=()=>{
  openDialog('I miei colori');const form=node('form','');form.style.display='block';
  const inputs=labels.map((value,i)=>{const lab=node('label',colorNames[i]),input=node('input','');input.value=value;input.required=true;input.maxLength=40;lab.append(input);form.append(lab);return input});
  form.append(node('button','Salva'));$('content').append(form);
  form.onsubmit=e=>{e.preventDefault();const values=inputs.map(el=>el.value.trim());if(values.some(x=>!x))return;try{localStorage.setItem('margine.labels',JSON.stringify(values))}catch{}values.forEach((value,i)=>{if(value!==labels[i])stage('label.'+i,value)});labels.splice(0,5,...values);refresh();$('dialog').close()};
};
function database(){return new Promise((resolve,reject)=>{const req=indexedDB.open('margine-bibbia',1);req.onupgradeneeded=()=>req.result.createObjectStore('testo');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function readPassages(){const db=await database();return new Promise((resolve,reject)=>{const req=db.transaction('testo').objectStore('testo').getAllKeys();req.onerror=()=>{db.close();reject(req.error)};req.onsuccess=()=>{const tx=db.transaction('testo'),store=tx.objectStore('testo'),result={};for(const k of req.result){const r=store.get(k);r.onsuccess=()=>Object.assign(result,r.result)}tx.oncomplete=()=>{db.close();resolve(result)};tx.onerror=()=>{db.close();reject(tx.error)}}})}
async function importText(file){
  const lines=(await file.text()).split(/\r?\n/), groups=new Map();
  for(const [i,line] of lines.entries()){
    if(!line.trim())continue;
    const m=line.trim().match(/^(.+?)\s+(\d+)[:,](\d+)\s+(.+)$/);
    const book=m?names.findIndex(n=>n.toLowerCase()===m[1].toLowerCase()):-1;
    if(book<0||+m[2]<1||+m[2]>counts[book]||+m[3]<1||+m[3]>176)throw Error('Controlla il riferimento alla riga '+(i+1)+'.');
    const chapter=book+'.'+Number(m[2]);if(!groups.has(chapter))groups.set(chapter,{});
    const id=chapter+'.'+Number(m[3]);if(groups.get(chapter)[id])throw Error('Versetto duplicato alla riga '+(i+1)+'.');
    groups.get(chapter)[id]=m[4];
  }
  if(!groups.size)throw Error('Il file è vuoto.');
  const db=await database();await new Promise((resolve,reject)=>{
    const tx=db.transaction('testo','readwrite'),store=tx.objectStore('testo');
    for(const [chapter,data] of groups){const req=store.get(chapter);req.onsuccess=()=>store.put({...req.result,...data},chapter)}
    tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||Error('Importazione interrotta.'));
  }).finally(()=>db.close());
  passages=await readPassages();const id=Object.keys(groups.values().next().value)[0];openRef(...id.split('.'));
}
$('importBtn').onclick=()=>{
  openDialog('Importa la Riveduta 2020');const p=node('p','Scegli un file TXT UTF-8 della tua copia, con un versetto per riga. I riferimenti presenti nel file aggiornano il testo locale.');
  const example=node('pre','Giovanni 1:1 Testo del versetto');const input=node('input','');input.type='file';input.accept='.txt,text/plain';input.setAttribute('aria-label','File della Riveduta 2020');
  const msg=node('p','');msg.setAttribute('role','status');$('content').append(p,example,input,msg);
  input.onchange=async()=>{if(!input.files.length)return;input.disabled=true;try{await importText(input.files[0]);$('dialog').close();refresh()}catch(err){msg.textContent=err.message}finally{input.disabled=false;input.value=''}};
};
const sizes=[20,23,26,30],sizeNames=['Piccolo','Medio','Grande','Molto grande'];
const leads=[1.65,1.9],leadNames=['Normale','Ampia'],themeNames={light:'Chiaro',dark:'Scuro',paper:'Carta'},nextTheme={light:'dark',dark:'paper',paper:'light'};
let size=Math.min(Math.max(Math.trunc(Number(localStorage.getItem('margine.font')))||0,0),sizes.length-1);
let lead=Math.min(Math.max(Math.trunc(Number(localStorage.getItem('margine.lead')))||0,0),leads.length-1);
function applySize(){const st=document.documentElement.style;st.setProperty('--verse-size',sizes[size]+'px');st.setProperty('--verse-lh',leads[lead])}
$('textSize').onclick=()=>{size=(size+1)%sizes.length;try{localStorage.setItem('margine.font',size)}catch{}applySize();refresh()};
$('themeBtn').onclick=()=>{
  const root=document.documentElement;
  root.dataset.theme=nextTheme[currentTheme()];
  try{localStorage.setItem('margine.theme',root.dataset.theme)}catch{}
  themeMeta();refresh();
};
themeMeta();
applySize();

/* Caricamento del capitolo */
function parseChapter(html,book,ch){
  const doc=new DOMParser().parseFromString(html,'text/html'),result={};
  for(const p of doc.querySelectorAll('#brano p')){
    let number=null;
    const walk=el=>{
      if(el.nodeType===3){if(number)result[number]+=el.textContent;return}
      if(el.nodeType!==1)return;
      if(el.matches('strong') && /^\d+$/.test(el.textContent.trim())){
        number=book+'.'+ch+'.'+Number(el.textContent.trim());result[number]='';return;
      }
      if(el.matches('br')){if(number)result[number]+=' ';return}
      el.childNodes.forEach(walk);
    };
    p.childNodes.forEach(walk);
  }
  for(const id of Object.keys(result))result[id]=result[id].replace(/\s+/g,' ').trim();
  if(!Object.values(result).some(Boolean))throw Error('Capitolo non disponibile.');
  return result;
}
/* Cache dei capitoli per la lettura offline (database separato: margine-cache) */
let cacheDb;
function cacheOpen(){
  return cacheDb||(cacheDb=new Promise(resolve=>{
    try{
      const req=indexedDB.open('margine-cache',1);
      req.onupgradeneeded=()=>req.result.createObjectStore('chapters');
      req.onsuccess=()=>resolve(req.result);
      req.onerror=req.onblocked=()=>resolve(null);
    }catch{resolve(null)}
  }));
}
async function cacheGet(section){
  const db=await cacheOpen();
  if(!db)return null;
  return new Promise(resolve=>{
    try{
      const req=db.transaction('chapters').objectStore('chapters').get(section);
      req.onsuccess=()=>{const row=req.result;resolve(row&&row.text&&typeof row.text==='object'&&Object.keys(row.text).length?row.text:null)};
      req.onerror=()=>resolve(null);
    }catch{resolve(null)}
  });
}
async function cachePut(section,text){
  const db=await cacheOpen();
  if(!db)return;
  try{db.transaction('chapters','readwrite').objectStore('chapters').put({text,saved:Date.now()},section)}catch{}
}
async function loadChapter(){
  const book=b,ch=c,section=book+'.'+ch;
  if(requested===section)return;
  requested=section;chapterText={};$('retry').hidden=true;
  if(connected)$('loadState').textContent='Caricamento del capitolo…';
  const cached=await cacheGet(section);
  if(requested!==section)return;
  if(cached){
    chapterText=cached;
    $('loadState').textContent=connected?'':'Lettura offline.';
    if(v>chapterLimit())v=chapterLimit();
    refresh();
    if(view==='write')writeHead();
  }
  if(!connected){
    if(!cached)$('loadState').textContent='Per leggere da LaParola, avvia «Apri il quaderno» dalla cartella del progetto.';
    return;
  }
  try{
    const reference=counts[book]===1?names[book]:names[book]+' '+ch;
    const html=await rpc('chapter',reference);
    if(requested!==section)return;
    const fresh=parseChapter(html,book,ch);
    cachePut(section,fresh);
    Object.assign(cachedText,fresh);triedSections.add(section);
    $('loadState').textContent='';
    if(!cached||JSON.stringify(fresh)!==JSON.stringify(cached)){
      chapterText=fresh;
      if(v>chapterLimit())v=chapterLimit();
      refresh();
      if(view==='write')writeHead();
    }
  }catch{
    if(requested!==section)return;
    if(cached){$('loadState').textContent='Lettura offline.';return}
    /* senza testo non c'è nulla a cui scorrere: si riprende comunque a registrare la posizione e al prossimo accesso si riprova */
    pendingScroll=false;requested='';
    $('loadState').textContent='Capitolo non raggiungibile. Puoi continuare a scrivere.';$('retry').hidden=false;
  }
}
$('retry').onclick=()=>{requested='';loadChapter()};
addEventListener('online',()=>{if(view==='read'&&!$('retry').hidden)loadChapter()});
$('prev').onclick=()=>turnChapter(-1);$('next').onclick=()=>turnChapter(1);
$('bottomPrev').onclick=()=>turnChapter(-1);$('bottomNext').onclick=()=>turnChapter(1);
$('resGo').onclick=()=>openRef(b,c,v);
document.querySelectorAll('#tabs [data-go]').forEach(t=>t.onclick=()=>{selA=selB=null;go(t.dataset.go)});

/* ===== Funzioni aggiuntive: annulla, versetti, tipografia, recenti, esporta, ricerche, gesti ===== */
let flashIds=new Set(), freshBm=null, toastTimer=0, toastUndo=null, swipe=null, sliding=false, lastY=0;
const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function currentTheme(){const t=document.documentElement.dataset.theme;return t||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light')}
function enter(name){
  if(reduceMotion())return;
  const el=$(name);
  if(name==='write')el.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'none'}],{duration:200,easing:'ease-out'});
  else el.animate([{opacity:0},{opacity:1}],{duration:180,easing:'ease-out'});
}

/* Avviso con Annulla (ogni avviso resta circa 5 s) */
function notify(msg,undo){
  clearTimeout(toastTimer);
  toastUndo=undo||null;
  $('toastMsg').textContent=msg;
  $('toastUndo').hidden=!undo;
  $('toastSep').hidden=!undo;
  const write=!$('write').hidden,desk=matchMedia('(min-width:900px)').matches;
  const base=write?'env(safe-area-inset-bottom)':desk?'0px':'calc(var(--tab) + env(safe-area-inset-bottom))';
  const act=$('actions').hidden?0:$('actions').offsetHeight+8;
  const wb=write?$('write').querySelector('.wbar').offsetHeight:0;
  $('toast').style.bottom=`calc(${base} + ${(desk?24:12)+act+wb}px)`;
  $('toast').hidden=false;
  toastTimer=setTimeout(hideToast,5000);
}
function hideToast(){clearTimeout(toastTimer);toastUndo=null;$('toast').hidden=true}
$('toastUndo').onclick=()=>{const u=toastUndo;hideToast();if(u)u()};
function toggleBmUndo(bk,ch,vs){
  const wasOn=isBm(bk,ch,vs);
  if(!wasOn){freshBm=vs;setTimeout(()=>{freshBm=null},300)}
  toggleBm(bk,ch,vs);
  if(wasOn)notify('Segnalibro rimosso',()=>toggleBm(bk,ch,vs));
}

/* Letti di recente (ultimi 6 capitoli aperti) */
function recents(){try{return JSON.parse(localStorage.getItem('margine.recent')||'[]').filter(x=>Array.isArray(x)&&names[x[0]]&&x[1]>0)}catch{return[]}}
function addRecent(bk,ch){
  const list=[[bk,ch],...recents().filter(([x,y])=>!(x===bk&&y===ch))].slice(0,6);
  try{localStorage.setItem('margine.recent',JSON.stringify(list))}catch{}
}

/* Vai al versetto */
function verseCount(){
  if(Object.keys(chapterText).length)return chapterLimit();
  const section=b+'.'+c+'.';
  return Math.max(0,...[...Object.keys(passages),...Object.keys(sample)].filter(id=>id.startsWith(section)).map(id=>Number(id.split('.')[2])));
}
let sheetOpener=null;
function openSheet(){
  const n=verseCount(),box=$('vgrid');box.replaceChildren();
  sheetOpener=document.activeElement;
  if(!n)box.append(node('p','Il testo del capitolo non è ancora disponibile.'));
  for(let i=1;i<=n;i++){const bt=node('button',String(i));bt.className='vnum';if(i===v)bt.setAttribute('aria-current','true');bt.onclick=()=>jumpVerse(i);box.append(bt)}
  $('sheet').hidden=false;
  if(histOk){try{trail.push('sheet');history.pushState({v:view,i:trail.length-1},'')}catch{histOk=false;trail.pop()}}
  (box.querySelector('[aria-current]')||box.querySelector('button')||$('sheetClose')).focus({preventScroll:true});
}
function closeSheet(fromPop){
  if($('sheet').hidden)return;
  $('sheet').hidden=true;
  if(fromPop!==true&&trail[trail.length-1]==='sheet'){trail.pop();try{history.back()}catch{}}
  if(sheetOpener&&sheetOpener.isConnected)sheetOpener.focus({preventScroll:true});
  sheetOpener=null;
}
function jumpVerse(n){
  closeSheet();selA=selB=null;v=n;pendingScroll=false;savePos();renderHeader();renderText();
  const el=$('v'+n);
  if(el){el.scrollIntoView({block:'start',behavior:reduceMotion()?'auto':'smooth'});jumpV=n}
}
$('goVerse').onclick=openSheet;
$('sheetClose').onclick=closeSheet;
$('sheet').onclick=e=>{if(e.target===$('sheet'))closeSheet()};
addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(!$('sheet').hidden)closeSheet();
    else if(!$('typo').hidden){$('typo').hidden=true;$('typoBtn').setAttribute('aria-expanded','false');$('typoBtn').focus({preventScroll:true})}
  }else if(e.key==='Tab'&&!$('sheet').hidden){
    /* il foglio è modale: il Tab resta al suo interno */
    const items=[...$('sheet').querySelectorAll('button')];
    if(!items.length)return;
    const first=items[0],last=items[items.length-1];
    if(!$('sheet').contains(document.activeElement)){e.preventDefault();first.focus()}
    else if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
});

/* Tipografia: pannello Aa */
function segButtons(box,texts,current,pick){
  box.replaceChildren(...texts.map((text,i)=>{const bt=node('button',text);bt.setAttribute('aria-pressed',String(i===current));bt.onclick=()=>pick(i);return bt}));
}
function renderTypo(){
  segButtons($('sizeSeg'),sizeNames,size,i=>{size=i;try{localStorage.setItem('margine.font',i)}catch{}applySize();renderTypo()});
  segButtons($('leadSeg'),leadNames,lead,i=>{lead=i;try{localStorage.setItem('margine.lead',i)}catch{}applySize();renderTypo()});
}
$('typoBtn').onclick=()=>{const open=$('typo').hidden;$('typo').hidden=!open;$('typoBtn').setAttribute('aria-expanded',String(open));if(open)renderTypo()};

/* Cambio capitolo con swipe orizzontale */
function slideChapter(d){
  if(sliding||(d>0?$('next').disabled:$('prev').disabled))return;
  if(reduceMotion()){turnChapter(d);return}
  sliding=true;
  const box=$('verses'),out=box.animate([{transform:'translateX(0)',opacity:1},{transform:`translateX(${-d*40}px)`,opacity:0}],{duration:160,easing:'ease-out',fill:'forwards'});
  out.finished.then(()=>{
    out.cancel();turnChapter(d);
    return box.animate([{transform:`translateX(${d*40}px)`,opacity:0},{transform:'translateX(0)',opacity:1}],{duration:200,easing:'ease-out'}).finished;
  }).catch(()=>{}).finally(()=>{sliding=false});
}
const versesBox=$('verses');
versesBox.addEventListener('touchstart',e=>{swipe=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null},{passive:true});
versesBox.addEventListener('touchcancel',()=>{swipe=null},{passive:true});
versesBox.addEventListener('touchend',e=>{
  const s=swipe;swipe=null;
  if(!s||e.changedTouches.length!==1)return;
  const dx=e.changedTouches[0].clientX-s.x,dy=e.changedTouches[0].clientY-s.y;
  if(Math.abs(dx)<70||Math.abs(dx)<=Math.abs(dy)*1.5)return;
  if(selA!==null||String(getSelection()).trim())return;
  slideChapter(dx<0?1:-1);
},{passive:true});

/* Barra in alto di Leggi: si nasconde scorrendo in basso, torna salendo */
addEventListener('scroll',()=>{
  const y=scrollY,dy=y-lastY;lastY=y;
  if(view!=='read')return;
  const bar=$('readTop');
  if(y<=80)bar.classList.remove('away');
  else if(dy>6)bar.classList.add('away');
  else if(dy<-6)bar.classList.remove('away');
},{passive:true});

/* Cerca: ultime ricerche */
function recentSearches(){try{return JSON.parse(localStorage.getItem('margine.recentsearch')||'[]').filter(x=>typeof x==='string')}catch{return[]}}
function rememberSearch(term){
  const t=term.trim();if(!t)return;
  const low=t.toLocaleLowerCase('it');
  const list=[t,...recentSearches().filter(x=>x.toLocaleLowerCase('it')!==low)].slice(0,5);
  try{localStorage.setItem('margine.recentsearch',JSON.stringify(list))}catch{}
}
function renderRecentS(){
  const list=recentSearches(),wrap=$('recentS'),show=!$('word').value.trim()&&list.length>0;
  wrap.hidden=!show;
  if(!show)return;
  $('recentChips').replaceChildren(...list.map(term=>{
    const bt=node('button',term);bt.className='chip';
    bt.onclick=()=>{$('word').value=term;$('wordForm').requestSubmit()};
    return bt;
  }));
}

/* Esporta e copia le meditazioni */
function passageOf(id){
  if(id.startsWith('free.'))return '';
  const [bk,ch,f,t]=id.split('.');
  if(!(Number(f)>=1))return '';
  const parts=[];
  for(let n=Number(f);n<=Number(t??f);n++){const tx=textOf(bk+'.'+ch+'.'+n);if(tx)parts.push(tx)}
  return parts.join(' ');
}
function noteIds(){return annotated().filter(id=>record(id).note).sort((a,z)=>a.localeCompare(z,'it',{numeric:true}))}
function isoDay(){const d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())}
function notesText(ids){
  const blocks=ids.map(id=>{
    const r=record(id),lines=[ref(id)];
    if(r.color!=null)lines.push('Colore: '+colorNames[r.color]+' · '+labels[r.color]);
    const txt=passageOf(id);if(txt)lines.push('Testo: '+txt);
    lines.push('Meditazione:',r.note,'');
    return lines.join('\n');
  });
  return ['A margine · Meditazioni','Esportate il '+isoDay(),'',...blocks].join('\n');
}
/* Prima di esportare si recupera dalla cache il testo dei capitoli delle note che non sono quello aperto */
const sectionsOf=ids=>ids.filter(id=>!id.startsWith('free.')&&Number(id.split('.')[2])>=1).map(id=>id.split('.').slice(0,2).join('.'));
async function exportNotes(){
  const ids=noteIds();
  if(!ids.length){notify('Non ci sono meditazioni da esportare.');return}
  await loadSections(sectionsOf(ids));
  const url=URL.createObjectURL(new Blob([notesText(ids)],{type:'text/plain;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='meditazioni-'+isoDay()+'.txt';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  notify('File scaricato');
}
async function copyNotes(){
  const ids=noteIds();
  if(!ids.length){notify('Non ci sono meditazioni da copiare.');return}
  await loadSections(sectionsOf(ids));
  const text=notesText(ids);
  let ok=false;
  try{await navigator.clipboard.writeText(text);ok=true}catch{}
  if(!ok){
    const ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';
    document.body.append(ta);ta.select();
    try{ok=document.execCommand('copy')}catch{}
    ta.remove();
  }
  notify(ok?'Copiato negli appunti':'Copia non riuscita. Usa Esporta.');
}
$('exportBtn').onclick=exportNotes;
$('copyBtn').onclick=copyNotes;

loadChapter();
readPassages().then(data=>{passages=data;refresh()}).catch(()=>{});
document.querySelectorAll('#srSeg button').forEach(y=>y.setAttribute('aria-pressed',y.dataset.t===srTab));
go('home',false);
synchronize();
