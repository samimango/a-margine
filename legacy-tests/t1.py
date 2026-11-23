from harness import *
import json

def ls(pg,k): return pg.evaluate("k=>localStorage.getItem(k)",k)
def lsj(pg,k,d=None):
    v=ls(pg,k);return json.loads(v) if v else d
def read(pg):
    pg.click('#resGo');pg.wait_for_selector('#v1');pg.wait_for_timeout(150)
def open_ref(pg,b,c,v=1):
    pg.evaluate("([b,c,v])=>openRef(b,c,v)",[b,c,v]);pg.wait_for_timeout(250)
def sync_now(pg):
    pg.evaluate("synchronize()");pg.wait_for_timeout(400)
def view(pg):return pg.evaluate('view')
def tab(pg,t):pg.click(f'#tabs [data-go={t}]');pg.wait_for_timeout(150)

@test()
def boot_and_basic(env,dev):
    pg,errs,srv=env.new(dev)
    check(pg.inner_text('#resRef')=='Giovanni 1,1',pg.inner_text('#resRef'))
    read(pg)
    check(pg.inner_text('#heading')=='Giovanni 1','heading')
    check(pg.locator('#verses .verse').count()==30,'30 versetti')
    check(pg.get_attribute('#tabs [data-go=read]','aria-current')=='page','aria-current tab')
    check(srv.chap_reqs[-1]=='Giovanni 1',srv.chap_reqs)

@test()
def single_chapter_books(env,dev):
    pg,errs,srv=env.new(dev)
    for name in ['Abdia','Filemone','2 Giovanni','3 Giovanni','Giuda']:
        i=IDX[name];open_ref(pg,i,1,1)
        check(pg.inner_text('#heading')==name+' 1',name)
        check(srv.chap_reqs[-1]==name,(name,srv.chap_reqs[-1]))
    # selezione dal menù libri: tocca un libro con 1 capitolo apre direttamente
    pg.click('#titleBtn');pg.wait_for_selector('#books button')
    pg.click('#testSeg [data-t="1"]')
    pg.click('#books button:has-text("Filemone")');pg.wait_for_timeout(300)
    check(view(pg)=='read' and pg.inner_text('#heading')=='Filemone 1','Filemone dal menù')
    # Giuda -> avanti = Apocalisse 1; Apocalisse 22 = fine, avanti disabilitato
    open_ref(pg,IDX['Giuda'],1,1);pg.click('#next');pg.wait_for_timeout(300)
    check(pg.inner_text('#heading')=='Apocalisse 1','Giuda->Apoc')
    open_ref(pg,65,22,1);check(pg.is_disabled('#next') and pg.is_disabled('#bottomNext'),'ultimo cap: next disabilitato')
    open_ref(pg,0,1,1);check(pg.is_disabled('#prev') and pg.is_disabled('#bottomPrev'),'primo cap: prev disabilitato')
    pg.evaluate("turnChapter(-1)");check(pg.inner_text('#heading')=='Genesi 1','turn -1 su Genesi 1 non fa nulla')
    open_ref(pg,65,22,1);pg.evaluate("turnChapter(1)");check(pg.inner_text('#heading')=='Apocalisse 22','turn +1 su Apoc 22')
    # indietro dal primo di un libro: Esodo 1 -> Genesi 50
    open_ref(pg,1,1,1);pg.click('#prev');pg.wait_for_timeout(250)
    check(pg.inner_text('#heading')=='Genesi 50','Esodo1 prev')
    open_ref(pg,IDX['Giona'],1,1);pg.click('#prev');pg.wait_for_timeout(250)
    check(pg.inner_text('#heading')=='Abdia 1','Giona prev -> Abdia 1 (reference senza capitolo)')
    check(srv.chap_reqs[-1]=='Abdia',srv.chap_reqs[-1])

@test()
def salmi_119(env,dev):
    pg,errs,srv=env.new(dev)
    pg.click('#tabs [data-go=read]');pg.click('#titleBtn');pg.click('#testSeg [data-t="0"]');pg.click('#books button:has-text("Salmi")');pg.wait_for_selector('#chapters button')
    check(pg.locator('#chapters button').count()==150,'150 capitoli')
    pg.click('#chapters button:nth-child(119)');pg.wait_for_selector('#v176');pg.wait_for_timeout(200)
    check(pg.locator('#verses .verse').count()==176,'176 versetti')
    t=pg.evaluate("(()=>{const s=performance.now();for(let i=0;i<20;i++)renderText();return (performance.now()-s)/20})()")
    check(t<60,f'renderText troppo lento {t:.1f}ms')
    t2=pg.evaluate("(()=>{const s=performance.now();for(let i=0;i<20;i++)tapVerse(5+(i%2));return (performance.now()-s)/20})()")
    check(t2<15,f'tapVerse lento {t2:.1f}ms')
    pg.evaluate("selA=selB=null;renderText()")
    pg.click('#goVerse');pg.wait_for_selector('#vgrid button')
    check(pg.locator('#vgrid button').count()==176,'foglio 176')
    pg.click('#vgrid button:nth-child(176)');pg.wait_for_timeout(700)
    check(pg.evaluate('v')==176,'v=176')
    pos=lsj(pg,'margine.pos');check(pos==[18,119,176],pos)
    pg.reload();pg.wait_for_selector('#greet');check(pg.inner_text('#resRef')=='Salmi 119,176',pg.inner_text('#resRef'))
    open_ref(pg,18,150,1);check(pg.is_enabled('#next')and pg.inner_text('#heading')=='Salmi 150','Salmo 150 next verso Proverbi')
    pg.click('#next');pg.wait_for_timeout(250);check(pg.inner_text('#heading')=='Proverbi 1','Salmi150->Proverbi 1')

@test()
def selection_logic(env,dev):
    pg,errs,srv=env.new(dev);read(pg)
    pg.click('#v6');pg.click('#v3');pg.wait_for_timeout(100)
    check(pg.evaluate('[selA,selB]')==[3,6],'ordine inverso')
    check(pg.inner_text('#aref')=='Giovanni 1,3–6',pg.inner_text('#aref'))
    check(pg.locator('#verses .verse.sel').count()==4,'4 selezionati')
    check(pg.get_attribute('#v4','aria-pressed')=='true' and pg.get_attribute('#v7','aria-pressed')=='false','aria-pressed')
    pg.click('#v8');check(pg.evaluate('[selA,selB]')==[8,8],'terzo tap = nuova selezione')
    pg.click('#v8');check(pg.evaluate('selA')is None and pg.is_hidden('#actions'),'tap stesso = deseleziona')
    pg.click('#v2');pg.click('#aclose');check(pg.is_hidden('#actions'),'chiudi')
    # la posizione "Riprendi" segue il versetto toccato
    pg.click('#v9');check(lsj(pg,'margine.pos')==[42,1,9],lsj(pg,'margine.pos'))

@test()
def notes_and_colors(env,dev):
    pg,errs,srv=env.new(dev);read(pg)
    pg.click('#v4');pg.click('#v6');pg.click('#palette2 button:nth-child(4)');pg.wait_for_timeout(100)
    check([pg.get_attribute(f'#v{n}','data-c') for n in (4,5,6,7)]==['3','3','3',None],'colore su 4-6')
    check(pg.is_visible('#toast'),'toast Colore cambiato')
    pg.click('#toastUndo');pg.wait_for_timeout(100)
    check(pg.get_attribute('#v5','data-c')is None,'annulla colore')
    pg.click('#palette2 button:nth-child(4)');pg.click('#palette2 button:nth-child(4)');pg.wait_for_timeout(100)
    check(pg.get_attribute('#v5','data-c')is None,'secondo tap sullo stesso colore lo toglie')
    # nota su range
    pg.click('#openNote');pg.wait_for_selector('#write:not([hidden])')
    check(pg.inner_text('#wRef')=='Giovanni 1,4–6',pg.inner_text('#wRef'))
    check('versetto 4' in pg.inner_text('#wText') and 'versetto 6' in pg.inner_text('#wText'),'testo del passo')
    pg.fill('#note','Nota di passo');pg.wait_for_timeout(150)
    keys=[k for k in pg.evaluate("Object.keys(localStorage)") if k.startswith('margine.nota.42.1.4.6.')]
    check(len(keys)==1 and len(keys[0].split('.')[-1])==36,keys)
    pg.click('#palette button:nth-child(3)');pg.wait_for_timeout(100)
    rec=json.loads(ls(pg,keys[0]));check(rec=={'note':'Nota di passo','color':1},rec)
    pg.wait_for_timeout(1500)
    nid=keys[0][len('margine.nota.'):]
    check(nid+'.note' in srv.store and nid+'.color' in srv.store,'sync anche del colore di un passo (id a 5 parti): '+str(list(srv.store)))
    check(pg.inner_text('#syncState')!='Modifiche sul dispositivo · Sincronizzazione da riprovare','stato sync '+pg.inner_text('#syncState'))
    # tornare indietro: l'em del passo compare sul versetto 4
    pg.click('#wDone');pg.wait_for_selector('#read:not([hidden])');pg.wait_for_timeout(200)
    check('Nota di passo' in pg.inner_text('#v4'),'em di passo sul primo versetto')
    # nota vuota -> sparisce
    pg.click('#v4');pg.click('#v4');pg.click('#v6');
    pg.evaluate("selA=selB=null");pg.click('#v4');pg.click('#v6');pg.click('#openNote');pg.wait_for_selector('#note')
    check(pg.input_value('#note')=='Nota di passo','riapre la stessa nota del passo (stesso range)')
    pg.fill('#note','');pg.wait_for_timeout(100)
    rec=json.loads(ls(pg,keys[0]) or 'null');check(rec=={'note':'','color':1},rec)
    pg.click('#palette button:nth-child(1)');pg.wait_for_timeout(100)   # nessun colore
    check(ls(pg,keys[0]) is None,'nota vuota e senza colore: record rimosso')
    pg.click('#wDone')
    # versetto singolo
    pg.click('#v2');pg.click('#openNote');pg.fill('#note','Singola');pg.wait_for_timeout(100)
    check(json.loads(ls(pg,'margine.nota.42.1.2'))['note']=='Singola','nota singola')
    check(ls(pg,'margine.lastmed')=='42.1.2','lastmed')
    pg.click('#wDone');pg.wait_for_timeout(1500)
    check(srv.store['42.1.2.note']['value']=='Singola','sync singola')

@test()
def free_chapter_notes(env,dev):
    pg,errs,srv=env.new(dev);read(pg)
    tab(pg,'notebook');pg.click('#compose');pg.wait_for_selector('#write:not([hidden])')
    check(pg.is_visible('#attachLabel'),'select visibile')
    pg.select_option('#attach','free');pg.fill('#note','Libera');pg.wait_for_timeout(100)
    check(pg.is_hidden('#attachLabel'),'select nascosta dopo la scrittura')
    pg.click('#palette button:nth-child(2)');pg.wait_for_timeout(100)
    pg.click('#wDone');pg.wait_for_selector('#notebook:not([hidden])')
    # capitolo
    pg.click('#compose');pg.select_option('#attach','chapter');pg.fill('#note','Nota di capitolo');pg.wait_for_timeout(100)
    pg.click('#wDone');pg.wait_for_timeout(1600)
    keys=pg.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('margine.nota.'))")
    check(any(k.startswith('margine.nota.free.') for k in keys),keys)
    check(any(k.startswith('margine.nota.42.1.0.0.') for k in keys),keys)
    check(any(k.startswith('free.') and k.endswith('.color') for k in srv.store),'colore su nota libera sincronizzato '+str(list(srv.store)))
    check(any(k.startswith('42.1.0.0.') and k.endswith('.note') for k in srv.store),'nota di capitolo sincronizzata')
    txt=pg.inner_text('#entries')
    check('Meditazione libera' in txt and '42 ' not in txt and 'Giovanni 1 · Capitolo' in txt,txt)
    # aprire dal Quaderno la nota di capitolo: nessun testo di versetto, nessun "Leggi il passo" per le libere
    pg.click('#entries .ent:has-text("Libera")');pg.wait_for_selector('#note')
    check(pg.is_hidden('#readPassage') and pg.is_hidden('#wText'),'nota libera senza passo')
    pg.click('#wBack');pg.wait_for_selector('#notebook:not([hidden])')
    pg.click('#entries .ent:has-text("Capitolo")')
    check(pg.is_visible('#readPassage') and pg.is_hidden('#wText'),'nota di capitolo: bottone ma senza testo')
    pg.click('#readPassage');pg.wait_for_selector('#v1');check(view(pg)=='read' and pg.inner_text('#heading')=='Giovanni 1','leggi il passo di capitolo')

@test()
def other_chapter_text_and_export(env,dev):
    pg,errs,srv=env.new(dev)
    open_ref(pg,0,1,1)   # Genesi 1 in cache
    pg.click('#v2');pg.click('#openNote');pg.fill('#note','Nota Genesi');pg.click('#wDone')
    open_ref(pg,42,1,1);pg.wait_for_timeout(300)
    tab(pg,'notebook');pg.click('#entries .ent:has-text("Genesi 1,2")');pg.wait_for_selector('#note')
    pg.wait_for_function("document.getElementById('wText').textContent.includes('versetto 2')",timeout=3000)
    check('Genesi 1' in pg.inner_text('#wText'),pg.inner_text('#wText'))
    pg.click('#readPassage');pg.wait_for_selector('#v2');pg.wait_for_timeout(300)
    check(pg.inner_text('#heading')=='Genesi 1' and pg.evaluate('v')==2,'leggi il passo di altro libro')
    check(pg.evaluate("document.getElementById('v2').getBoundingClientRect().top")<200,'scroll al versetto 2')
    # esportazione con note di altri capitoli
    open_ref(pg,42,1,1);pg.click('#v3');pg.click('#openNote');pg.fill('#note','Nota Giovanni');pg.click('#wDone')
    tab(pg,'home')
    with pg.expect_download() as d:pg.click('#exportBtn')
    path=d.value.path();txt=open(path,encoding='utf8').read()
    check('Genesi 1,2' in txt and 'Genesi 1 versetto 2' in txt,'testo di altro capitolo in export:\n'+txt)
    check('Giovanni 1 versetto 3' in txt,txt)
    # reload: la nota di un altro capitolo deve comparire con testo anche nei segnalibri
    open_ref(pg,0,1,1);pg.click('#v5');pg.click('#bmSel');pg.click('#aclose')
    open_ref(pg,42,1,1);tab(pg,'notebook');pg.click('#nbSeg [data-t=marks]')
    pg.wait_for_function("document.querySelector('#entries').textContent.includes('versetto 5')",timeout=3000)
    check('Genesi 1,5' in pg.inner_text('#entries'),'segnalibro con testo')

@test()
def limit_8kb_and_labels(env,dev):
    pg,errs,srv=env.new(dev);read(pg)
    pg.click('#v1');pg.click('#openNote');pg.fill('#note','ok');pg.wait_for_timeout(100)
    pg.fill('#note','a'*9000);pg.wait_for_timeout(150)
    check('Limite' in pg.inner_text('#status') and pg.input_value('#note')=='ok','limite 8 KB '+pg.inner_text('#status'))
    pg.fill('#note','è'*3900);pg.wait_for_timeout(150)   # 3900*2=7800 byte + quote
    check(pg.input_value('#note')=='è'*3900,'7.8KB utf8 ok')
    pg.fill('#note','è'*4100);pg.wait_for_timeout(150)
    check(len(pg.input_value('#note'))==3900,'8.2KB utf8 rifiutato')
    pg.click('#wDone');pg.wait_for_timeout(1400)
    check(srv.store['42.1.1.note']['value']=='è'*3900,'server ha la nota da 7.8KB')
    # etichette
    tab(pg,'home');pg.click('#colorsBtn');pg.fill('#content label:nth-child(2) input','Promessa nuova');pg.click('#content button:has-text("Salva")');pg.wait_for_timeout(1200)
    check(srv.store['label.1']['value']=='Promessa nuova','label sync '+str(srv.store.get('label.1')))
    check(lsj(pg,'margine.labels')[1]=='Promessa nuova','label locale')
    read_btn=pg.click('#tabs [data-go=read]');pg.click('#v2');
    check('Promessa nuova' in pg.get_attribute('#palette2 button:nth-child(3)','title'),'palette usa la label')
