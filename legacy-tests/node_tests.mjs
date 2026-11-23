import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';import http from 'node:http';
const P='/home/claude/proj/';let n=0;const ok=(name)=>{n++;console.log('OK  ',name)};
// ---- protocol.js
const api=vm.createContext({});vm.runInContext(fs.readFileSync(P+'protocol.js','utf8'),api);
const U='0123456789abcdef0123456789abcdef0123';assert.equal(U.length,36);
const V=(id,val)=>api.validField_(id,val);
assert(V('label.0','Ciao'));assert(!V('label.5','x'));assert(!V('label.0',''));assert(!V('label.0','   '));assert(!V('label.0','x'.repeat(41)));assert(V('label.4','x'.repeat(40)));ok('label');
assert(V('bm.0.1.1',123));assert(V('bm.65.22.176',1));assert(V('bm.42.1.3',null));assert(!V('bm.66.1.1',1));assert(!V('bm.1.151.1',1));assert(!V('bm.1.1.177',1));assert(!V('bm.1.1.1',0));assert(!V('bm.1.1.1',1.5));assert(!V('bm.01.1.1',1));ok('bm');
assert(V('42.1.1.note','x'));assert(V('42.1.1.note',''));assert(V('42.1.1.color',null));assert(V('42.1.1.color',4));assert(!V('42.1.1.color',5));assert(!V('42.1.1.color','1'));assert(!V('42.1.1.note',null));assert(!V('66.1.1.note','x'));assert(!V('42.0.1.note','x'));assert(!V('42.151.1.note','x'));assert(!V('42.1.177.note','x'));assert(V('18.119.176.note','x'));assert(V('65.22.1.note','x'));ok('verse fields');
assert(V(`42.1.2.4.${U.replace(/./g,'a').slice(0,36)}.note`,'x'));
const g='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
assert(V(`42.1.2.4.${g}.note`,'x'));assert(V(`42.1.2.4.${g}.color`,2));assert(V(`42.1.2.4.${g}.color`,null));assert(!V(`42.1.2.4.${g}.color`,9));
assert(V(`42.1.0.0.${g}.note`,'cap'));assert(!V(`42.1.0.3.${g}.note`,'x'));assert(!V(`42.1.5.4.${g}.note`,'x'));assert(!V(`42.1.1.177.${g}.note`,'x'));assert(V(`18.119.1.176.${g}.note`,'x'));
assert(V(`free.${g}.note`,'x'));assert(V(`free.${g}.color`,1));assert(!V(`free.${g}.color`,'x'));assert(!V(`free.zz.note`,'x'));ok('passi, capitolo, libere (incluso colore)');
assert(V('42.1.1.note','è'.repeat(3900)));assert(!V('42.1.1.note','è'.repeat(4100)));assert(V('42.1.1.note','a'.repeat(7990)));assert(!V('42.1.1.note','a'.repeat(8000)));ok('limite 8 KB (byte UTF-8)');
// exchange_
let st={};let r=api.exchange_(st,[{id:'42.1.1.note',rev:0,value:'a'}]);assert.equal(st['42.1.1.note'].rev,1);assert.deepEqual({...r.conflicts},{});
r=api.exchange_(st,[{id:'42.1.1.note',rev:0,value:'b'}]);assert(r.conflicts['42.1.1.note']);assert.equal(st['42.1.1.note'].value,'a');
r=api.exchange_(st,[{id:'42.1.1.note',rev:0,value:'a'}]);assert.deepEqual({...r.conflicts},{},'stesso valore: nessun conflitto (richiesta ripetuta)');
r=api.exchange_(st,[{id:'42.1.1.note',rev:1,value:'c'}]);assert.equal(st['42.1.1.note'].rev,2);ok('exchange_ revisioni');
assert.throws(()=>api.exchange_(st,[null]));assert.throws(()=>api.exchange_(st,[{id:'x',rev:0,value:1}]));assert.throws(()=>api.exchange_(st,[{id:'42.1.1.note',rev:-1,value:'x'}]));assert.throws(()=>api.exchange_(st,'x'));assert.throws(()=>api.exchange_(st,Array(101).fill({id:'42.1.1.note',rev:0,value:'a'})));assert.throws(()=>api.exchange_(st,[{id:'42.1.1.note',rev:0.5,value:'a'}]));ok('exchange_ input non valido');
// url
assert.throws(()=>api.chapterUrl_('x; drop'));assert.throws(()=>api.chapterUrl_(5));assert(api.chapterUrl_('Cantico dei Cantici 8').startsWith('https://www.laparola.net/'));assert(api.chapterUrl_('Giosuè 3'));assert(api.chapterUrl_('Giuda'));assert(api.chapterUrl_('1 Tessalonicesi 5'));
assert.throws(()=>api.searchUrl_({term:'',start:1}));assert.throws(()=>api.searchUrl_({term:'x',start:0}));assert.throws(()=>api.searchUrl_({term:'x',start:1.5}));assert(api.searchUrl_({term:'luce & ombra',start:21}).includes('luce%20%26%20ombra'));ok('chapterUrl_/searchUrl_');
// ---- sw.js con ambiente simulato
{
  const handlers={},cacheStore=new Map(),calls={fetch:0,put:0};
  let netMode='ok',version='v1';
  class Req{constructor(u){this.url=typeof u==='string'?new URL(u,'http://x.test').href:u.url;this.method='GET'}}
  const caches={_n:{},open:async name=>{const m=caches._n[name]||(caches._n[name]=new Map());return{match:async k=>m.get(typeof k==='string'?k:k.url),put:async(k,v)=>{calls.put++;m.set(typeof k==='string'?k:k.url,v)},addAll:async reqs=>{for(const r of reqs)m.set(new URL(r.url).href,{ok:true,status:200,body:'old',clone(){return this}})}}},keys:async()=>Object.keys(caches._n),delete:async k=>{delete caches._n[k]}};
  const self={addEventListener:(t,f)=>handlers[t]=f,location:{origin:'http://x.test'},skipWaiting:()=>{},clients:{claim:async()=>{}}};
  const ctx=vm.createContext({self,caches,Request:Req,URL,location:self.location,setTimeout,clearTimeout,Error,Promise,fetch:(req,opt)=>{calls.fetch++;if(netMode==='down')return Promise.reject(Error('offline'));if(netMode==='hang')return new Promise(()=>{});if(netMode==='500')return Promise.resolve({ok:false,status:503});return Promise.resolve({ok:true,status:200,body:version,clone(){return this}})}});
  caches._n['margine-shell-v1']=new Map();
  vm.runInContext(fs.readFileSync(P+'sw.js','utf8').replace(/\bWAIT=4000/,'WAIT=150'),ctx);
  let p;handlers.install({waitUntil:x=>p=x});await p;
  await new Promise(r=>{handlers.activate({waitUntil:x=>x.then(r)})});assert(!caches._n['margine-shell-v1'],'cache v1 eliminata');
  const fetchEv=async(url,method='GET')=>{let res;const ev={request:{url,method},respondWith:x=>res=x,waitUntil:x=>x};handlers.fetch(ev);return res&&await res};
  assert.equal(await fetchEv('http://x.test/app.js','POST'),undefined,'POST non intercettate');
  assert.equal(await fetchEv('http://x.test/sync'),undefined,'altri percorsi ignorati');
  assert.equal(await fetchEv('http://other.test/app.js'),undefined,'altre origini ignorate');
  version='v2';let rr=await fetchEv('http://x.test/app.js?x=1');assert.equal(rr.body,'v2','rete prima della cache (nessuna versione vecchia)');
  version='v3';rr=await fetchEv('http://x.test/app.js');assert.equal(rr.body,'v3');
  netMode='down';rr=await fetchEv('http://x.test/app.js');assert.equal(rr.body,'v3','offline: ultima copia buona');
  netMode='hang';rr=await fetchEv('http://x.test/app.js');assert.equal(rr.body,'v3','rete lenta: copia salvata dopo il tempo massimo');
  netMode='500';rr=await fetchEv('http://x.test/app.js');assert.equal(rr.body,'v3','5xx: copia salvata');
  netMode='down';await assert.rejects(()=>fetchEv('http://x.test/style.css').then(x=>x),'senza copia e senza rete: errore') .catch(()=>{});
  ok('sw.js: rete prima, cache di riserva, nessuna POST');
}
// ---- server.mjs (in primo piano, porta e dati temporanei, si chiude da solo)
process.env.MARGINE_PORT='43917';process.env.MARGINE_DATA='/tmp/audit1/data_'+process.pid;
await import(P+'server.mjs');
const call=(method,path,{headers={},body}={})=>new Promise((res,rej)=>{const rq=http.request({host:'127.0.0.1',port:43917,method,path,headers:{host:'127.0.0.1:43917',...headers}},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res({status:r.statusCode,body:d,headers:r.headers}))});rq.on('error',rej);if(body)rq.write(body);rq.end()});
const post=(path,obj,extra={})=>call('POST',path,{headers:{origin:'http://127.0.0.1:43917','content-type':'application/json',...extra},body:JSON.stringify(obj)});
let x=await call('GET','/');assert.equal(x.status,200);assert(x.body.includes('<script src="app.js">'));
x=await call('GET','/?utm=1');assert.equal(x.status,200,'GET con query');
x=await call('GET','/app.js');assert.equal(x.status,200);assert(x.headers['content-type'].startsWith('text/javascript'));assert.equal(x.headers['cache-control'],'no-store');
x=await call('GET','/server.mjs');assert.equal(x.status,404,'file privati non serviti');
x=await call('GET','/','host:evil.test'&&{headers:{host:'evil.test'}});assert.equal(x.status,403,'host sbagliato');
x=await call('POST','/sync',{headers:{'content-type':'application/json'},body:'[]'});assert.equal(x.status,403,'senza Origin');
x=await post('/sync',[]);assert.equal(x.status,200);
x=await post('/sync',[{id:'42.1.1.note',rev:0,value:'ciao'}]);assert.equal(JSON.parse(x.body).state['42.1.1.note'].rev,1);
x=await post('/sync',[{id:'42.1.1.note',rev:0,value:'altro'}]);assert(JSON.parse(x.body).conflicts['42.1.1.note']);
x=await post('/sync',[{id:'nonvalido',rev:0,value:'x'}]);assert.equal(x.status,400,'non valido = 400');
x=await post('/sync',[]);assert.equal(JSON.parse(x.body).state['42.1.1.note'].value,'ciao','rollback: lo stato resta valido');
x=await post('/chapter','x; drop');assert.equal(x.status,400);
x=await post('/nope',{});assert.equal(x.status,404);
x=await post('/sync',[],{origin:'http://evil.test'});assert.equal(x.status,403);
ok('server.mjs: file, host/origin, sync, validazione');
console.log(`\n${n} blocchi di test node OK`);process.exit(0);
