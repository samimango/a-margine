import json,os,re,subprocess,mimetypes,time,traceback,sys
from playwright.sync_api import sync_playwright
P='/home/claude/proj/'
NAMES='Genesi|Esodo|Levitico|Numeri|Deuteronomio|Giosuè|Giudici|Rut|1 Samuele|2 Samuele|1 Re|2 Re|1 Cronache|2 Cronache|Esdra|Neemia|Ester|Giobbe|Salmi|Proverbi|Ecclesiaste|Cantico dei Cantici|Isaia|Geremia|Lamentazioni|Ezechiele|Daniele|Osea|Gioele|Amos|Abdia|Giona|Michea|Naum|Abacuc|Sofonia|Aggeo|Zaccaria|Malachia|Matteo|Marco|Luca|Giovanni|Atti|Romani|1 Corinzi|2 Corinzi|Galati|Efesini|Filippesi|Colossesi|1 Tessalonicesi|2 Tessalonicesi|1 Timoteo|2 Timoteo|Tito|Filemone|Ebrei|Giacomo|1 Pietro|2 Pietro|1 Giovanni|2 Giovanni|3 Giovanni|Giuda|Apocalisse'.split('|')
IDX={n:i for i,n in enumerate(NAMES)}

class Proto:
    def __init__(s):
        s.p=subprocess.Popen(['node','/tmp/audit1/proto_proc.js'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,text=True)
    def call(s,store,updates):
        s.p.stdin.write(json.dumps({'store':store,'updates':updates})+'\n');s.p.stdin.flush()
        return json.loads(s.p.stdout.readline())
    def close(s):
        try:s.p.stdin.close();s.p.wait(5)
        except Exception:s.p.kill()
PROTO=Proto()

def verses_in(ref):
    m=re.match(r'^(.+?)(?: (\d+))?$',ref)
    name,ch=m.group(1),m.group(2)
    if name=='Salmi' and ch=='119':return 176
    if name in('Abdia','Filemone','2 Giovanni','3 Giovanni','Giuda'):return {'Abdia':21,'Filemone':25,'2 Giovanni':13,'3 Giovanni':15,'Giuda':25}[name]
    return 30
def chap_html(ref,n=None,extra=''):
    n=n or verses_in(ref)
    return '<div id="brano"><p>'+''.join(f'<strong>{i}</strong>{ref} versetto {i} di prova con parole abbastanza lunghe per andare a capo. ' for i in range(1,n+1))+extra+'</p></div>'

class Srv:
    """Stato condiviso tra più dispositivi: archivio /sync + opzioni di guasto."""
    def __init__(s):
        s.store={};s.fail=False;s.chapter_fail=False;s.log=[];s.chap_reqs=[];s.sync_reqs=[];s.chapters={};s.search_html=None;s.sync_hook=None;s.search_delay={}
        s.errors=[]
    def handle_sync(s,updates):
        s.sync_reqs.append(updates)
        r=PROTO.call(s.store,updates)
        if 'error' in r: return None,r['error']
        s.store=r['ok']['state']
        return r['ok'],None

def make_handler(srv,page_ref=None):
    def handler(route,req):
        u=req.url.replace('http://app.test','').split('?')[0]
        if req.method=='POST':
            body=req.post_data
            if u=='/chapter':
                ref=json.loads(body);srv.chap_reqs.append(ref)
                if srv.chapter_fail:return route.abort()
                html=srv.chapters.get(ref) or chap_html(ref)
                return route.fulfill(status=200,content_type='application/json',body=json.dumps(html))
            if u=='/wordSearch':
                q=json.loads(body)
                if srv.search_delay.get(q['term']):time.sleep(srv.search_delay[q['term']])
                html=srv.search_html or '<div id="brano"><h3>x</h3><p>3 versetti, in 3 versetti</p><h1>Giovanni 1:5</h1><p>la luce splende</p><h1>Salmi 27:1</h1><p>Il Signore è la mia luce</p></div>'
                return route.fulfill(status=200,content_type='application/json',body=json.dumps(html))
            if u=='/sync':
                if srv.fail:return route.abort()
                if srv.sync_hook:srv.sync_hook()
                r,err=srv.handle_sync(json.loads(body))
                if err:return route.fulfill(status=400,content_type='application/json',body='{}')
                return route.fulfill(status=200,content_type='application/json',body=json.dumps(r))
        if u.startswith('https://fonts'):return route.abort()
        f=P+(u.lstrip('/') or 'index.html')
        if os.path.isfile(f):return route.fulfill(status=200,content_type=mimetypes.guess_type(f)[0] or 'text/plain',body=open(f,'rb').read())
        route.fulfill(status=404,body='')
    return handler

GS_INIT="""
(()=>{
  window.__gsCalls=[];
  const mk=(ok,fail)=>new Proxy({},{get:(_,m)=>m==='withSuccessHandler'?(f=>mk(f,fail)):m==='withFailureHandler'?(f=>mk(ok,f)):(arg=>{window.__gsCalls.push(m);window.__gs(m,JSON.stringify(arg)).then(r=>{if(r&&r.__err)(fail||(()=>{}))({message:r.__err});else(ok||(()=>{}))(JSON.parse(r))},e=>(fail||(()=>{}))(e))})});
  window.google={script:{run:mk(null,null)}};
})();
"""

class Env:
    def __init__(s,br):
        s.br=br;s.ctxs=[];s.errs=[]
    def new(s,device='phone',srv=None,cloud=False,storage=None,dark=False,init=None,sw='block',ctx=None):
        srv=srv or Srv()
        if device=='phone':kw=dict(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True)
        else:kw=dict(viewport={'width':1280,'height':800})
        c=s.br.new_context(service_workers=sw,color_scheme='dark' if dark else 'light',accept_downloads=True,**kw)
        s.ctxs.append(c)
        pg=c.new_page();pg.set_default_timeout(4000);errs=[];s.errs.append(errs)
        pg.on('pageerror',lambda e:errs.append('PAGEERROR '+str(e)))
        pg.on('console',lambda m:errs.append('CONSOLE '+m.text) if m.type in('error','warning') and 'fonts' not in m.text and 'Failed to load' not in m.text and 'ERR_FAILED' not in m.text else None)
        c.route('**/*',make_handler(srv))
        if cloud:
            def gs(method,payload):
                arg=json.loads(payload)
                if method=='chapter':
                    srv.chap_reqs.append(arg)
                    if srv.chapter_fail:return {'__err':'Errore'}
                    return json.dumps(srv.chapters.get(arg) or chap_html(arg))
                if method=='wordSearch':
                    return json.dumps(srv.search_html or '<div id="brano"><h3>x</h3><p>1 versetti, in 1 versetti</p><h1>Giovanni 1:5</h1><p>la luce splende</p></div>')
                if method=='sync':
                    if srv.fail:return {'__err':'Servizio non raggiungibile'}
                    r,err=srv.handle_sync(arg)
                    if err:return {'__err':err}
                    return json.dumps(r)
                return {'__err':'metodo sconosciuto'}
            pg.expose_function('__gs',gs)
            pg.add_init_script(GS_INIT)
        if storage:
            pg.add_init_script('if(!sessionStorage.__seeded){sessionStorage.__seeded=1;'+';'.join(f'localStorage.setItem({json.dumps(k)},{json.dumps(v)})' for k,v in storage.items())+'}')
        if init:pg.add_init_script(init)
        pg.goto('http://app.test/');pg.wait_for_selector('#greet');pg.wait_for_timeout(250)
        return pg,errs,srv
    def close(s):
        for c in s.ctxs:
            try:c.close()
            except Exception:pass
        s.ctxs=[];s.errs=[]

RESULTS=[];TESTS=[]
def test(*devs):
    def deco(fn):
        TESTS.append((fn.__name__,fn,devs or ('phone','desk')));return fn
    return deco
def check(cond,msg):
    if not cond:raise AssertionError(msg)
def run(only=None):
    with sync_playwright() as p:
        br=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        for name,fn,devs in TESTS:
            if only and not any(o in name for o in only):continue
            for dev in devs:
                env=Env(br);t=time.time()
                try:
                    fn(env,dev)
                    bad=[e for lst in env.errs for e in lst]
                    if bad:raise AssertionError('errori console/pageerror: '+' | '.join(bad[:4]))
                    RESULTS.append((name,dev,'OK',round(time.time()-t,1),''))
                except Exception as ex:
                    RESULTS.append((name,dev,'FAIL',round(time.time()-t,1),(str(ex).split('Call log')[0]+' @'+' '.join(f'{f.name}:{f.lineno}' for f in traceback.extract_tb(ex.__traceback__) if f.filename.endswith(('t1.py','t2.py','t3.py'))))[:400]))
                finally:env.close()
        br.close()
    PROTO.close()
    fails=[r for r in RESULTS if r[2]!='OK']
    for r in RESULTS:print(f'{r[2]:4} {r[0]:34} {r[1]:5} {r[3]:5}s {r[4]}')
    print(f'\n{len(RESULTS)-len(fails)}/{len(RESULTS)} OK')
    return 1 if fails else 0
