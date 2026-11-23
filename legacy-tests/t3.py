from harness import *
from t1 import ls,lsj,read,open_ref,sync_now,view,tab
import json,time

def swipe(pg,dx,dy=0):
    pg.evaluate("""([dx,dy])=>{const el=document.getElementById('verses');const mk=(x,y)=>new Touch({identifier:1,target:el,clientX:x,clientY:y});
      el.dispatchEvent(new TouchEvent('touchstart',{touches:[mk(200,400)],bubbles:true}));
      el.dispatchEvent(new TouchEvent('touchend',{changedTouches:[mk(200+dx,400+dy)],touches:[],bubbles:true}))}""",[dx,dy])

@test('phone')
def position_scroll_swipe_reload(env,dev):
    pg,_,srv=env.new(dev);read(pg)
    pg.evaluate("window.scrollTo(0,1400)");pg.wait_for_timeout(600)
    pos=lsj(pg,'margine.pos');check(pos[2]>5,f'scorrendo salva {pos}')
    v=pos[2]
    pg.reload();pg.wait_for_selector('#greet');check(pg.inner_text('#resRef')==f'Giovanni 1,{v}',pg.inner_text('#resRef'))
    pg.click('#resGo');pg.wait_for_selector(f'#v{v}');pg.wait_for_timeout(600)
    check(pg.evaluate("document.getElementById('v'+v).getBoundingClientRect().top")<200,'riprende al versetto')
    # nessuna deriva dopo ripetuti ricaricamenti
    for i in range(2):
        pg.reload();pg.wait_for_selector('#greet');pg.click('#resGo');pg.wait_for_selector('#v1');pg.wait_for_timeout(700)
    check(lsj(pg,'margine.pos')[2]==v,'nessuna deriva: '+str(lsj(pg,'margine.pos'))+' atteso '+str(v))
    # swipe: capitolo successivo salva posizione v=1
    swipe(pg,-150);pg.wait_for_timeout(700)
    check(pg.inner_text('#heading')=='Giovanni 2' and lsj(pg,'margine.pos')==[42,2,1],('swipe',pg.inner_text('#heading'),lsj(pg,'margine.pos')))
    swipe(pg,150);pg.wait_for_timeout(700)
    check(pg.inner_text('#heading')=='Giovanni 1','swipe indietro')
    swipe(pg,150,200);pg.wait_for_timeout(500);check(pg.inner_text('#heading')=='Giovanni 1','swipe diagonale ignorato')
    # chiusura immediata dopo lo scroll: pagehide salva
    pg.evaluate("window.scrollTo(0,2000)");pg.wait_for_timeout(50)
    pg.evaluate("window.dispatchEvent(new Event('pagehide'))")
    check(lsj(pg,'margine.pos')[2]>10,'pagehide salva '+str(lsj(pg,'margine.pos')))

@test()
def return_to_read_keeps_place(env,dev):
    pg,_,srv=env.new(dev);read(pg)
    pg.evaluate("window.scrollTo(0,1500)");pg.wait_for_timeout(600)
    y0=pg.evaluate('scrollY');v0=pg.evaluate('v')
    tab(pg,'notebook');tab(pg,'read');pg.wait_for_timeout(300)
    check(abs(pg.evaluate('scrollY')-y0)<5,f'posizione di scorrimento ripristinata {pg.evaluate("scrollY")} vs {y0}')
    pg.evaluate("document.getElementById('titleBtn').click()");pg.click('#pickBack');pg.wait_for_timeout(300)
    check(abs(pg.evaluate('scrollY')-y0)<5,'ripristino dopo scelta libro annullata')
    # dopo "Fatto" da una nota
    pg.evaluate(f"document.getElementById('v{v0+2}').click()");y0=pg.evaluate('scrollY');pg.evaluate("document.getElementById('openNote').click()");pg.fill('#note','x');pg.click('#wDone');pg.wait_for_timeout(300)
    check(abs(pg.evaluate('scrollY')-y0)<5,'ripristino dopo Scrivi '+str(pg.evaluate('scrollY')))
    # cambiare capitolo non deve ripristinare lo scroll del precedente
    pg.click('#next');pg.wait_for_timeout(400)
    check(pg.evaluate('scrollY')<50,'nuovo capitolo parte dall\'inizio')

@test()
def load_failure_still_tracks(env,dev):
    srv=Srv();srv.chapter_fail=True
    pg,_,_=env.new(dev,srv,storage={'margine.pos':json.dumps([42,3,10])})
    pg.click('#resGo');pg.wait_for_timeout(600)
    check(pg.is_visible('#retry'),'riprova visibile')
    check(pg.evaluate('pendingScroll')is False,'pendingScroll sbloccato dopo errore')
    srv.chapter_fail=False;n=len(srv.chap_reqs)
    pg.evaluate("window.dispatchEvent(new Event('online'))");pg.wait_for_selector('#v10');pg.wait_for_timeout(300)
    check(len(srv.chap_reqs)==n+1,'riprova all\'online')
    # riapertura dello stesso capitolo dopo errore ritenta
    srv.chapter_fail=True;open_ref(pg,42,4,1);pg.wait_for_timeout(300);srv.chapter_fail=False
    open_ref(pg,42,4,1);pg.wait_for_selector('#v30');check(srv.chap_reqs[-1]=='Giovanni 4','ritenta alla riapertura')

@test()
def cache_vs_network_race(env,dev):
    srv=Srv()
    pg,_,_=env.new(dev,srv);read(pg)
    srv.chapters['Giovanni 2']=chap_html('Giovanni 2',10)
    open_ref(pg,42,2,1);pg.wait_for_timeout(300);check(pg.locator('#verses .verse').count()==10,'10 versetti')
    # cambio rapido: 3 -> 4 -> 5, risposta in ordine, deve vincere l'ultimo
    for c in (3,4,5):pg.evaluate(f"openRef(42,{c},1)")
    pg.wait_for_timeout(600)
    check(pg.inner_text('#heading')=='Giovanni 5' and 'Giovanni 5 versetto 1' in pg.inner_text('#v1'),pg.inner_text('#v1')[:60])
    # cache: ora capitolo 2 viene da cache e poi aggiornato dalla rete
    srv.chapters['Giovanni 2']=chap_html('Giovanni 2',12)
    open_ref(pg,42,2,1);pg.wait_for_timeout(500)
    check(pg.locator('#verses .verse').count()==12,'aggiornato dalla rete dopo la cache')

@test()
def history_flow(env,dev):
    pg,_,_=env.new(dev)
    check(view(pg)=='home','home')
    tab(pg,'read');pg.click('#titleBtn');pg.wait_for_selector('#books button');pg.click('#testSeg [data-t="0"]');pg.click('#books button:has-text("Salmi")');pg.wait_for_selector('#chapters button')
    check(pg.evaluate('trail.slice()')==['home','read','pick','chap'],pg.evaluate('trail.slice()'))
    pg.go_back();pg.wait_for_timeout(250);check(view(pg)=='pick','back da chap -> pick '+view(pg))
    pg.go_back();pg.wait_for_timeout(250);check(view(pg)=='read','back da pick -> read')
    pg.go_back();pg.wait_for_timeout(250);check(view(pg)=='home','back da read -> home')
    # in-app back button usa la cronologia (nessun accumulo)
    tab(pg,'read');pg.click('#titleBtn');pg.click('#pickBack');pg.wait_for_selector('#v1');pg.wait_for_timeout(300)
    check(pg.evaluate('trail.slice()')==['home','read'],'pickBack non accumula: '+str(pg.evaluate('trail.slice()')))
    # tabs ripetuti sulla stessa schermata non accumulano voci
    n=pg.evaluate('history.length')
    for i in range(3):tab(pg,'read')
    check(pg.evaluate('history.length')==n,'stessa schermata: replaceState')
    # cambio capitolo non accumula
    pg.click('#next');pg.wait_for_timeout(300);pg.click('#next');pg.wait_for_timeout(300)
    check(pg.evaluate('history.length')==n,'capitoli non accumulano voci')
    # scrivi: back del telefono chiude Scrivi tornando alla lettura
    pg.click('#v2');pg.click('#openNote');pg.fill('#note','x');pg.go_back();pg.wait_for_timeout(300)
    check(view(pg)=='read','back da Scrivi')
    # foglio versetto: back lo chiude restando in lettura
    pg.click('#goVerse');pg.wait_for_selector('#sheet:not([hidden])');pg.go_back();pg.wait_for_timeout(300)
    check(pg.is_hidden('#sheet') and view(pg)=='read','back chiude il foglio')
    pg.click('#goVerse');pg.click('#sheetClose');pg.wait_for_timeout(300)
    check(pg.is_hidden('#sheet') and view(pg)=='read' and pg.evaluate('trail.slice()')==['home','read'],'chiusura foglio con X: '+str(pg.evaluate('trail.slice()')))
    pg.click('#goVerse');pg.click('#vgrid button:nth-child(7)');pg.wait_for_timeout(600)
    check(pg.evaluate('v')==7 and pg.evaluate('trail.slice()')==['home','read'],'salto versetto non accumula')
    # Leggi il passo: Indietro torna a Scrivi->origine
    tab(pg,'notebook');pg.click('#compose');pg.select_option('#attach','verse');pg.fill('#note','abc');pg.wait_for_timeout(100)
    pg.click('#readPassage');pg.wait_for_selector('#v1');pg.wait_for_timeout(300)
    pg.go_back();pg.wait_for_timeout(300);check(view(pg)=='notebook','back da Leggi il passo torna al quaderno (via Scrivi)')

@test()
def a11y_focus_esc(env,dev):
    pg,_,_=env.new(dev)
    read(pg)
    check(pg.evaluate("document.activeElement.id")=='read','focus sulla schermata Leggi')
    tab(pg,'search');check(pg.evaluate("document.activeElement.id")=='search','focus Cerca')
    tab(pg,'read');pg.click('#goVerse');pg.wait_for_selector('#sheet:not([hidden])')
    check(pg.evaluate("document.getElementById('sheet').contains(document.activeElement)"),'focus nel foglio')
    pg.keyboard.press('Shift+Tab');check(pg.evaluate("document.getElementById('sheet').contains(document.activeElement)"),'tab trap')
    pg.keyboard.press('Escape');pg.wait_for_timeout(300)
    check(pg.is_hidden('#sheet') and pg.evaluate("document.activeElement.id")=='goVerse','Esc chiude il foglio e riporta il focus')
    pg.click('#typoBtn');check(pg.get_attribute('#typoBtn','aria-expanded')=='true','typo aperto')
    pg.keyboard.press('Escape');check(pg.is_hidden('#typo') and pg.get_attribute('#typoBtn','aria-expanded')=='false','Esc chiude Aa')
    # aria-pressed bookmark
    pg.click('#bmBtn');pg.wait_for_timeout(100);check(pg.get_attribute('#bmBtn','aria-pressed')=='true','bm pressed')
    pg.click('#bmBtn');check(pg.get_attribute('#bmBtn','aria-pressed')=='false','bm unpressed')
    for t in ('home','read','search','notebook'):
        tab(pg,t);check(pg.locator('#tabs [aria-current=page]').count()==1 and pg.get_attribute(f'#tabs [data-go={t}]','aria-current')=='page',t)
    pg.click('#nbSeg [data-t=marks]');check(pg.get_attribute('#nbSeg [data-t=marks]','aria-pressed')=='true' and pg.get_attribute('#nbSeg [data-t=notes]','aria-pressed')=='false','seg')

@test()
def security_xss(env,dev):
    srv=Srv()
    evil='<img src=x onerror="window.__pwn=1"><script>window.__pwn=2</script>'
    srv.chapters['Giovanni 1']=chap_html('Giovanni 1',3,extra=evil)
    srv.chapters['Giovanni 2']='<div id="brano"><p><strong>1</strong>&lt;img src=x onerror=window.__pwn=3&gt; <b>grassetto</b> <img src=x onerror="window.__pwn=4"></p></div>'
    srv.search_html='<div id="brano"><h3>x</h3><p>1 versetti, in 1 versetti</p><h1>&lt;img src=x onerror=window.__pwn=5&gt; 1:1</h1><p><img src=x onerror="window.__pwn=6">testo&lt;b&gt;</p><h1>Strano 9:9</h1><p>js</p></div>'
    pg,_,_=env.new(dev,srv);read(pg)
    open_ref(pg,42,2,1);pg.wait_for_timeout(300)
    check('<img' in pg.inner_text('#v1') and pg.locator('#verses img').count()==0,'testo come testo '+pg.inner_text('#v1'))
    tab(pg,'search');pg.fill('#word','luce');pg.press('#word','Enter');pg.wait_for_selector('#hits .ent')
    check(pg.locator('#hits img,#hits script,#verses script').count()==0,'nessun elemento iniettato')
    check(pg.locator('#hits a').count()==2 and all(h.startswith('https://www.laparola.net/') for h in pg.eval_on_selector_all('#hits a','e=>e.map(x=>x.href)')),'link esterni verso laparola')
    pg.wait_for_timeout(500);check(pg.evaluate('window.__pwn')is None,'nessuno script eseguito')
    # note con HTML
    pg.click('#tabs [data-go=read]');pg.click('#v1');pg.click('#openNote');pg.fill('#note','<b>x</b><img src=x onerror="window.__pwn=7">');pg.click('#wDone');pg.wait_for_timeout(300)
    check(pg.locator('#verses em img,#verses em b').count()==0 and pg.evaluate('window.__pwn')is None,'nota con html resta testo')
    # etichette con html
    pg.evaluate("labels[0]='<img src=x onerror=window.__pwn=8>';refresh()");tab(pg,'notebook');pg.wait_for_timeout(200)
    check(pg.evaluate('window.__pwn')is None and pg.locator('#filters img').count()==0,'label')

@test()
def import_file(env,dev):
    pg,_,_=env.new(dev)
    pg.click('#importBtn');pg.wait_for_selector('#content input[type=file]')
    pg.set_input_files('#content input[type=file]',files=[{'name':'b.txt','mimeType':'text/plain','buffer':'Giovanni 3:16 Perché Dio ha tanto amato <img src=x onerror=window.__pwn=1> il mondo\nGenesi 1:1 In principio\n'.encode()}])
    pg.wait_for_function("view==='read'",timeout=3000);pg.wait_for_timeout(300)
    check(pg.evaluate('window.__pwn')is None,'import non esegue html')
    pg.click('#importBtn') if False else None
    # file con errore
    tab(pg,'home');pg.click('#importBtn');pg.wait_for_selector('#content input[type=file]')
    pg.set_input_files('#content input[type=file]',files=[{'name':'b.txt','mimeType':'text/plain','buffer':'Libro Falso 1:1 x\n'.encode()}])
    pg.wait_for_function("document.querySelector('#content [role=status]').textContent.length>0");check('riga 1' in pg.inner_text('#content [role=status]'),'errore riga')
    pg.set_input_files('#content input[type=file]',files=[{'name':'b.txt','mimeType':'text/plain','buffer':'Giovanni 1:177 x\n'.encode()}])
    pg.wait_for_timeout(300);check('riga 1' in pg.inner_text('#content [role=status]'),'versetto 177 rifiutato')
    pg.keyboard.press('Escape')

@test()
def search_race_and_notes(env,dev):
    srv=Srv();srv.search_delay={'lento':1.2}
    pg,_,_=env.new(dev,srv)
    tab(pg,'search')
    pg.fill('#word','lento');pg.press('#word','Enter');pg.wait_for_timeout(100)
    pg.click('#srSeg [data-t=notes]');pg.wait_for_timeout(1700)
    check(pg.locator('#hits .ent').count()==0 and pg.get_attribute('#srSeg [data-t=notes]','aria-pressed')=='true','risposta tardiva non appare nella scheda note: '+pg.inner_text('#resultStatus'))
    pg.click('#srSeg [data-t=bible]');pg.wait_for_selector('#hits .ent');check(pg.locator('#hits .ent').count()==2,'ricerca ripetuta')
    pg.click('#hits .ent:has-text("Giovanni 1:5")');pg.wait_for_selector('#v5');pg.wait_for_timeout(400)
    check(view(pg)=='read' and pg.inner_text('#heading')=='Giovanni 1' and pg.evaluate('v')==5,'apre risultato')
    # ricerca note
    pg.click('#v2');pg.click('#openNote');pg.fill('#note','la mia luce interiore');pg.click('#wDone')
    tab(pg,'search');pg.click('#srSeg [data-t=notes]');pg.fill('#word','LUCE');pg.wait_for_timeout(200)
    check('1 trovate' in pg.inner_text('#resultStatus'),pg.inner_text('#resultStatus'))
    pg.click('#hits .ent');pg.wait_for_selector('#note');check(pg.input_value('#note')=='la mia luce interiore','apre nota')
    pg.click('#wBack');pg.wait_for_timeout(300);check(view(pg)=='search','back a Cerca')
    # ricerche recenti
    pg.fill('#word','');pg.wait_for_timeout(100);check(pg.is_visible('#recentS'),'recenti')

@test()
def desktop_phone_layout_smoke(env,dev):
    pg,_,_=env.new(dev);read(pg)
    pg.click('#v3');pg.click('#v5');pg.wait_for_timeout(100)
    check(pg.is_visible('#actions'),'barra azioni')
    pg.click('#tabs [data-go=home]');check(pg.is_hidden('#actions'),'azioni nascoste fuori da Leggi')
