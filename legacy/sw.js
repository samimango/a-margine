'use strict';
/* Guscio dell'app: prima la rete (così un file cambiato arriva subito), la copia salvata solo se la rete manca o è lenta. */
const CACHE='margine-shell-v2';
const SHELL=['/','/index.html','/style.css','/app.js','/sync.js','/icon.svg','/manifest.webmanifest'];
const WAIT=4000;
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
function fromNetwork(req){
  return new Promise((resolve,reject)=>{
    const t=setTimeout(()=>reject(Error('timeout')),WAIT);
    fetch(req,{cache:'no-cache'}).then(res=>{clearTimeout(t);resolve(res)},err=>{clearTimeout(t);reject(err)});
  });
}
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==location.origin||!SHELL.includes(url.pathname))return;
  const key=new Request(url.origin+url.pathname);
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE),hit=await cache.match(key);
    try{
      const res=await fromNetwork(req);
      if(res.ok){e.waitUntil(cache.put(key,res.clone()));return res}
      return hit&&res.status>=500?hit:res;
    }catch(err){
      if(hit)return hit;
      throw err;
    }
  })());
});
