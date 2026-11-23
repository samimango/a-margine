'use strict';
const cloud = Boolean(window.google?.script?.run);
const connected = cloud || location.protocol !== 'file:';
const pendingKey = 'margine.pending.v1';
const snapshotKey = 'margine.snapshot.v1';
function readJson(key, fallback) {
  try { const x = JSON.parse(localStorage.getItem(key)); return x && typeof x === 'object' && !Array.isArray(x) ? x : fallback; } catch { return fallback; }
}
function writeJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
let pending = readJson(pendingKey, {});
let snapshot = readJson(snapshotKey, {});
let syncing = false, timer, knownConflictsShown = 0;
const RPC_TIMEOUT = 30000;
function rpc(method, data) {
  if (cloud) return new Promise((resolve,reject)=>{
    const t=setTimeout(()=>reject(Error('Tempo scaduto.')),RPC_TIMEOUT);
    google.script.run.withSuccessHandler(r=>{clearTimeout(t);resolve(r)}).withFailureHandler(e=>{clearTimeout(t);reject(e)})[method](data);
  });
  const ctl=typeof AbortController==='function'?new AbortController():null,t=setTimeout(()=>ctl&&ctl.abort(),RPC_TIMEOUT);
  return fetch('/'+method,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:ctl?ctl.signal:undefined}).then(r=>{
    if(!r.ok){const e=Error('Servizio non disponibile.');e.status=r.status;throw e}return r.json();
  }).finally(()=>clearTimeout(t));
}
/* Il servizio ha rifiutato i dati (non un problema di rete): HTTP 400 in locale, messaggio di validazione su Google */
const isInvalid=err=>Boolean(err&&(err.status===400||/non valid/i.test(String(err.message||err))));
function stage(id,value) {
  if(!connected)return;
  const prev=pending[id];
  pending[id] = {rev:prev?.rev ?? snapshot[id]?.rev ?? 0, value};
  if(prev?.conflict)pending[id].conflict=true;
  writeJson(pendingKey,pending);
  $('syncState').textContent='Salvato sul dispositivo · In attesa di sincronizzazione';
  clearTimeout(timer);timer=setTimeout(synchronize,600);
}
function showConflicts() {
  const box=$('conflicts');box.replaceChildren();
  for (const [id,change] of Object.entries(pending)) {
    if(!change.conflict)continue;
    const other=snapshot[id];
    const isMark=id.startsWith('bm.');
    const describe=value=>isMark?(value==null?'Segnalibro tolto':'Segnalibro presente'):id.endsWith('.color')?(colorNames[value]||'Nessun colore'):id.startsWith('label.')?String(value??''):(String(value??'')||'(nota vuota)');
    const field=isMark?'Segnalibro · '+names[id.split('.')[1]]+' '+id.split('.')[2]+','+id.split('.')[3]:id.startsWith('label.')?'Significato del colore':ref(id.split('.').slice(0,-1).join('.'));
    box.append(node('p','Modifiche contemporanee · '+field),node('p','Sul dispositivo: '+describe(change.value)),node('p','Sincronizzato: '+describe(other?.value)));
    for(const local of [true,false]){
      const btn=node('button',local?'Usa la mia modifica':'Usa quella sincronizzata');
      btn.onclick=()=>{
        if(local)pending[id]={value:pending[id].value,rev:snapshot[id]?.rev||0};
        else delete pending[id];
        writeJson(pendingKey,pending);applySnapshot();showConflicts();synchronize();
      };box.append(btn);
    }
  }
}
function applyBookmarks() {
  let list;try{list=JSON.parse(localStorage.getItem('margine.bm')||'[]')}catch{list=[]}
  if(!Array.isArray(list))list=[];
  const map=new Map(list.map(m=>[m[0]+'.'+m[1]+'.'+m[2],m]));
  for(const [id,entry] of Object.entries(snapshot)){
    if(!id.startsWith('bm.')||pending[id])continue;
    const k=id.slice(3);
    if(entry.value==null)map.delete(k);
    else{const [bk,ch,vs]=k.split('.').map(Number);if(Number.isInteger(bk)&&bk>=0&&bk<names.length)map.set(k,[bk,ch,vs,entry.value])}
  }
  const json=JSON.stringify([...map.values()].sort((x,y)=>(y[3]||0)-(x[3]||0)));
  try{if(json!==localStorage.getItem('margine.bm'))localStorage.setItem('margine.bm',json)}catch{}
}
function applySnapshot() {
  applyBookmarks();
  for(const [id,entry] of Object.entries(snapshot)){
    if(pending[id]||id.startsWith('bm.'))continue;
    if(id.startsWith('label.')){const i=Number(id.slice(6));if(i>=0&&i<labels.length&&typeof entry.value==='string'&&entry.value.trim())labels[i]=entry.value;continue}
    const parts=id.split('.'),field=parts.pop(),verse=parts.join('.');
    if(field!=='note'&&field!=='color')continue;
    const item={...record(verse),[field]:entry.value};
    try{
      if(!item.note&&item.color==null){if(localStorage.getItem(prefix+verse)!==null)localStorage.removeItem(prefix+verse)}
      else{const json=JSON.stringify(item);if(json!==localStorage.getItem(prefix+verse))localStorage.setItem(prefix+verse,json)}
    }catch{}
  }
  writeJson('margine.labels',labels);
  if(activeNote&&!$('write').hidden){
    const text=record(activeNote).note||'';
    if($('note').value!==text)$('note').value=text;
  }
  refresh();
}
/* Registra la risposta del servizio per le modifiche inviate; restituisce true se lo stato condiviso è cambiato */
function absorb(batch,reply) {
  if(!reply||typeof reply!=='object'||!reply.state||!reply.conflicts)throw Error('Risposta non valida.');
  for(const sent of batch){
    const now=pending[sent.id];
    if(!now)continue;
    if(reply.conflicts[sent.id]){
      const theirs=reply.state[sent.id]?.value;
      if(sent.id.startsWith('bm.')&&(sent.value==null)===(theirs==null))delete pending[sent.id];
      else now.conflict=true;
    }
    else if(now.value===sent.value)delete pending[sent.id];
    else now.rev=reply.state[sent.id]?.rev || 0;
  }
  const changed=JSON.stringify(snapshot)!==JSON.stringify(reply.state);
  snapshot=reply.state;
  writeJson(snapshotKey,snapshot);writeJson(pendingKey,pending);
  return changed;
}
/* Prima sincronizzazione riuscita: carica sul servizio le note e i colori già presenti solo su questo dispositivo */
function migrateNotes() {
  if(localStorage.getItem('margine.notes.sync'))return;
  try{localStorage.setItem('margine.notes.sync','1')}catch{return}
  for(const id of annotated()){
    const item=record(id);
    if(item.note&&!snapshot[id+'.note']&&!pending[id+'.note'])stage(id+'.note',item.note);
    if(item.color!=null&&!snapshot[id+'.color']&&!pending[id+'.color'])stage(id+'.color',item.color);
  }
  labels.forEach((text,i)=>{if(text!==defaultLabels[i]&&!snapshot['label.'+i]&&!pending['label.'+i])stage('label.'+i,text)});
}
async function synchronize() {
  if(!connected||syncing)return;
  syncing=true;
  const batch=Object.entries(pending).filter(([,p])=>!p.conflict&&!p.bad).slice(0,100).map(([id,item])=>({id,rev:item.rev,value:item.value}));
  try{
    let changed=false;
    try{changed=absorb(batch,await rpc('sync',batch))}
    catch(err){
      if(!isInvalid(err)||!batch.length)throw err;
      /* Una sola modifica non valida blocca tutto il gruppo: le provo una per una e isolo quella rifiutata */
      for(const item of batch){
        try{if(absorb([item],await rpc('sync',[item])))changed=true}
        catch(e2){if(isInvalid(e2)){if(pending[item.id])pending[item.id].bad=true}else throw e2}
      }
      writeJson(pendingKey,pending);
    }
    if(!localStorage.getItem('margine.notes.sync')){migrateNotes()}
    if(changed)applySnapshot();
    showConflicts();
    const queue=Object.values(pending),conflicts=queue.filter(p=>p.conflict).length;
    if(conflicts>knownConflictsShown&&typeof notify==='function'&&view!=='home')notify('Ci sono modifiche in conflitto: le trovi nella Home.');
    knownConflictsShown=conflicts;
    $('syncState').textContent=conflicts?'Scegli quale modifica conservare.':queue.some(p=>p.bad)?'Alcune modifiche non sono accettate dal servizio e restano solo su questo dispositivo.':queue.length?'Sincronizzazione in corso…':cloud?'Sincronizzato nel tuo account':'Salvato sul server di questo PC';
    if(queue.some(p=>!p.conflict&&!p.bad))setTimeout(synchronize,800);
  }catch{$('syncState').textContent=Object.keys(pending).length?'Modifiche sul dispositivo · Sincronizzazione da riprovare':'Archivio condiviso non raggiungibile.'}
  finally{syncing=false}
}
window.addEventListener('online',synchronize);
window.addEventListener('focus',synchronize);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)synchronize()});
setInterval(()=>{if(!document.hidden)synchronize()},15000);

if('serviceWorker' in navigator && location.protocol.startsWith('http') && !cloud){
  window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(()=>{})});
}
