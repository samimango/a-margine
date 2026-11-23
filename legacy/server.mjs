import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync, mkdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const dir = dirname(fileURLToPath(import.meta.url));
const api = vm.createContext({});
vm.runInContext(readFileSync(join(dir,'protocol.js'),'utf8'),api);
const data = process.env.MARGINE_DATA || join(process.env.LOCALAPPDATA || dir,'A-margine');
mkdirSync(data,{recursive:true});
const db = new DatabaseSync(join(data,'quaderno.sqlite'));
db.exec('CREATE TABLE IF NOT EXISTS notebook (id INTEGER PRIMARY KEY, data TEXT NOT NULL)');
const port = Number(process.env.MARGINE_PORT || 4389);
const origin = 'http://127.0.0.1:'+port;
const files = {'/':'index.html','/index.html':'index.html','/app.js':'app.js','/sync.js':'sync.js','/style.css':'style.css','/manifest.webmanifest':'manifest.webmanifest','/icon.svg':'icon.svg','/sw.js':'sw.js'};
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server = http.createServer(async(req,res)=>{
  const reply=(status,body,type='application/json')=>{res.writeHead(status,{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'});res.end(body)};
  if(req.headers.host !== '127.0.0.1:'+port) return reply(403,'{}');
  try {
    const path=(req.url||'/').split('?')[0];
    if((req.method==='GET'||req.method==='HEAD') && Object.hasOwn(files,path)){
      const file=files[path];
      return reply(200,req.method==='HEAD'?'':readFileSync(join(dir,file)),types[file.slice(file.lastIndexOf('.'))]||'text/plain');
    }
    if(req.method==='GET'||req.method==='HEAD')return reply(404,'{}');
    if(req.method!=='POST'||req.headers.origin!==origin||req.headers['content-type']!=='application/json')return reply(403,'{}');
    let raw='';for await(const part of req){raw+=part.toString('binary');if(raw.length>1500000)return reply(413,'{}')}
    const payload=JSON.parse(Buffer.from(raw,'binary').toString('utf8'));
    if(path==='/chapter'||path==='/wordSearch'){
      const search=path==='/wordSearch';
      const source=await fetch(search?api.searchUrl_(payload):api.chapterUrl_(payload),{signal:AbortSignal.timeout(14000)});
      if(!source.ok)return reply(502,'{}');
      return reply(200,JSON.stringify(search?await source.text():await source.json()));
    }
    if(path==='/sync'){
      db.exec('BEGIN IMMEDIATE');
      try{
        const row=db.prepare('SELECT data FROM notebook WHERE id=1').get();
        const result=api.exchange_(JSON.parse(row?.data||'{}'),payload);
        if(payload.length)db.prepare('INSERT OR REPLACE INTO notebook VALUES (1,?)').run(JSON.stringify(result.state));
        db.exec('COMMIT');return reply(200,JSON.stringify(result));
      }catch(e){db.exec('ROLLBACK');throw e}
    }
    reply(404,'{}');
  }catch{reply(400,'{}')}
});
server.on('error',err=>{console.error(err.code==='EADDRINUSE'?'La porta '+port+' è già in uso: il quaderno è forse già aperto.':String(err));process.exit(1)});
server.listen(port,'127.0.0.1');
