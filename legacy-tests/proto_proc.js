// Esegue il vero protocol.js (come server.mjs) per il mock di /sync: una riga JSON in ingresso, una in uscita.
const vm=require('vm'),fs=require('fs'),rl=require('readline').createInterface({input:process.stdin});
const api=vm.createContext({});vm.runInContext(fs.readFileSync('/home/claude/proj/protocol.js','utf8'),api);
rl.on('line',line=>{
  const {store,updates}=JSON.parse(line);
  try{const r=api.exchange_(store,updates);process.stdout.write(JSON.stringify({ok:JSON.parse(JSON.stringify(r))})+'\n')}
  catch(e){process.stdout.write(JSON.stringify({error:String(e.message||e)})+'\n')}
});
