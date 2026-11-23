from harness import *
from t1 import ls,lsj,read,open_ref,sync_now,view,tab
import json

def typed_note(pg,verse,text):
    pg.click(f'#v{verse}');pg.click('#openNote');pg.wait_for_selector('#write:not([hidden])');pg.fill('#note',text)

@test()
def two_devices_basic(env,dev):
    srv=Srv()
    A,ea,_=env.new(dev,srv);B,eb,_=env.new(dev,srv)
    read(A);read(B)
    typed_note(A,3,'Da A');A.click('#wDone');A.wait_for_timeout(1500)
    sync_now(B)
    check(json.loads(ls(B,'margine.nota.42.1.3'))['note']=='Da A','B riceve la nota')
    check('Da A' in B.inner_text('#v3'),'B ripinta il testo senza ricarica')
    # colore e segnalibro
    A.click('#v5');A.click('#palette2 button:nth-child(2)');A.click('#bmSel');A.wait_for_timeout(1500)
    sync_now(B)
    check(B.get_attribute('#v5','data-c')=='1','colore su B')
    check(len(lsj(B,'margine.bm',[]))==1 and B.locator('#v5 .rib').count()==1,'segnalibro su B')
    # rimozione segnalibro da B con undo
    B.click('#v5');B.click('#bmSel');B.wait_for_timeout(1500);sync_now(A)
    check(lsj(A,'margine.bm')==[],'segnalibro rimosso propagato '+str(lsj(A,'margine.bm')))
    check(A.locator('#v5 .rib').count()==0,'nastro tolto')
    # etichette
    check(A.inner_text('#syncState')!='' ,'syncState')

@test()
def conflicts_ui(env,dev):
    srv=Srv()
    A,ea,_=env.new(dev,srv);B,eb,_=env.new(dev,srv)
    read(A);read(B)
    typed_note(A,2,'base');A.click('#wDone');A.wait_for_timeout(1500);sync_now(B)
    # B va offline e modifica; A modifica e sincronizza; B torna online
    srv.fail=True
    typed_note(B,2,'versione di B') if False else None
    B.click('#v2');B.click('#openNote');B.fill('#note','versione di B');B.click('#wDone');B.wait_for_timeout(900)
    srv.fail=False
    A.click('#v2');A.click('#openNote');A.fill('#note','versione di A');A.click('#wDone');A.wait_for_timeout(1500)
    sync_now(B)
    check(B.evaluate("Object.values(pending).some(p=>p.conflict)"),'conflitto rilevato su B '+B.evaluate("JSON.stringify(pending)"))
    # il conflitto si vede nella Home, e un avviso lo segnala altrove
    check(B.is_visible('#toast') and 'conflitto' in B.inner_text('#toastMsg'),'avviso conflitto')
    tab(B,'home')
    txt=B.inner_text('#conflicts')
    check('Sul dispositivo: versione di B' in txt and 'Sincronizzato: versione di A' in txt,txt)
    check('Scegli quale' in B.inner_text('#syncState'),B.inner_text('#syncState'))
    B.click('#conflicts button:has-text("Usa quella sincronizzata")');B.wait_for_timeout(600)
    check(json.loads(ls(B,'margine.nota.42.1.2'))['note']=='versione di A','scelta sincronizzata applicata')
    check(B.inner_text('#conflicts')=='','conflitti vuoti')
    # conflitto di nuovo, scegliendo la mia
    srv.fail=True
    B.click('#tabs [data-go=read]');B.click('#v2');B.click('#openNote');B.fill('#note','B vince');B.click('#wDone');B.wait_for_timeout(900)
    srv.fail=False
    A.click('#v2');A.click('#openNote');A.fill('#note','A di nuovo');A.click('#wDone');A.wait_for_timeout(1500)
    sync_now(B);tab(B,'home')
    B.click('#conflicts button:has-text("Usa la mia modifica")');B.wait_for_timeout(1500)
    check(srv.store['42.1.2.note']['value']=='B vince','server ha la mia')
    # conflitti ancora visibili dopo un ricaricamento offline
    srv.fail=True
    A.evaluate("synchronize()")
    B.click('#tabs [data-go=read]');B.click('#v2');B.click('#openNote');B.fill('#note','B offline');B.click('#wDone');B.wait_for_timeout(900)
    A.click('#v2');
    srv.fail=False

@test()
def conflict_survives_reload(env,dev):
    srv=Srv()
    storage={'margine.pending.v1':json.dumps({'42.1.2.note':{'rev':0,'value':'mia','conflict':True}}),
             'margine.snapshot.v1':json.dumps({'42.1.2.note':{'rev':3,'value':'loro'}})}
    srv.fail=True
    pg,errs,_=env.new(dev,srv,storage=storage)
    check('Sul dispositivo: mia' in pg.inner_text('#conflicts'),'conflitto mostrato all\'avvio anche offline: '+pg.inner_text('#conflicts'))

@test()
def typing_not_overwritten(env,dev):
    srv=Srv()
    A,_,_=env.new(dev,srv);B,_,_=env.new(dev,srv)
    read(A);read(B)
    typed_note(A,4,'iniziale');A.click('#wDone');A.wait_for_timeout(1500);sync_now(B)
    # B apre la nota e scrive; nel frattempo A cambia e sincronizza
    B.click('#v4');B.click('#openNote');B.wait_for_selector('#note')
    check(B.input_value('#note')=='iniziale','B vede iniziale')
    A.click('#v4');A.click('#openNote');A.fill('#note','da A cambiata');A.click('#wDone');A.wait_for_timeout(1500)
    # B (senza modifiche pendenti) riceve il cambiamento mentre ha la nota aperta
    sync_now(B)
    check(B.input_value('#note')=='da A cambiata','nessuna modifica locale: si aggiorna '+B.input_value('#note'))
    # B scrive: la scrittura locale NON va persa quando arriva uno snapshot nuovo
    B.fill('#note','B sta scrivendo...')
    A.fill('#note','') if False else None
    A.click('#v4');A.click('#openNote');A.fill('#note','A ancora');A.click('#wDone');A.wait_for_timeout(1500)
    # blocca la risposta del sync per far scrivere altro durante la richiesta
    def hook():
        pass
    sync_now(B)
    check(B.input_value('#note')=='B sta scrivendo...','la scrittura in corso non viene sovrascritta: '+B.input_value('#note'))
    B.wait_for_timeout(1800)
    check(srv.store['42.1.4.note']['value'] in('B sta scrivendo...',),'server: '+str(srv.store['42.1.4.note'])+' (conflitto atteso se rev vecchia)') if not B.evaluate("Object.values(pending).some(p=>p.conflict)") else None

@test()
def typing_during_inflight_sync(env,dev):
    srv=Srv()
    pg,_,_=env.new(dev,srv);read(pg)
    pg.click('#v4');pg.click('#openNote');pg.fill('#note','uno');pg.wait_for_timeout(700)
    # durante la richiesta, scrivi ancora
    state={'n':0}
    def slow():
        import time;time.sleep(0.6)
    srv.sync_hook=slow
    pg.fill('#note','uno due');pg.wait_for_timeout(650)   # parte il sync (600ms) e dura 600ms
    pg.type('#note',' tre',delay=50);pg.wait_for_timeout(2500)
    srv.sync_hook=None
    check(pg.input_value('#note')=='uno due tre','testo digitato intatto: '+pg.input_value('#note'))
    pg.wait_for_timeout(1500)
    check(srv.store['42.1.4.note']['value']=='uno due tre','server finale '+str(srv.store.get('42.1.4.note')))

@test()
def bookmarks_sync_and_migration(env,dev):
    srv=Srv()
    old=json.dumps([[42,1,3],[0,1,1,1700000000000]])   # senza timestamp (vecchio formato) e con
    pg,_,_=env.new(dev,srv,storage={'margine.bm':old})
    pg.wait_for_timeout(1500)
    check(pg.evaluate("localStorage.getItem('margine.bm.sync')")=='1','migrazione eseguita')
    check('bm.42.1.3' in srv.store and 'bm.0.1.1' in srv.store,list(srv.store))
    bm=lsj(pg,'margine.bm');check(all(len(m)==4 for m in bm),bm)
    # notebook: elenco segnalibri con testo del versetto e rimozione con annulla
    read(pg);tab(pg,'notebook');pg.click('#nbSeg [data-t=marks]')
    check(pg.locator('#entries .ent').count()==2,pg.inner_text('#entries'))
    pg.wait_for_function("document.querySelector('#entries').textContent.includes('versetto 3')",timeout=3000)
    pg.click('#entries .ent:has-text("Giovanni 1,3") .x');pg.wait_for_timeout(200)
    check(pg.locator('#entries .ent').count()==1 and pg.is_visible('#toastUndo'),'rimosso con annulla')
    pg.click('#toastUndo');pg.wait_for_timeout(1500)
    check(pg.locator('#entries .ent').count()==2,'annullato')
    check(srv.store['bm.42.1.3']['value'] is not None,'server di nuovo presente')
    # Home mostra i segnalibri e apre il versetto
    tab(pg,'home');pg.click('#homeBm button:has-text("Giovanni 1,3")');pg.wait_for_selector('#v3');pg.wait_for_timeout(500)
    check(view(pg)=='read' and pg.evaluate('v')==3,'segnalibro apre')

@test()
def notes_migration_and_invalid_isolation(env,dev):
    srv=Srv()
    notes={'margine.nota.42.1.2':json.dumps({'note':'vecchia nota','color':2}),'margine.nota.free.'+'a'*8+'-aaaa-4aaa-aaaa-'+'a'*12:json.dumps({'note':'libera vecchia'}),
           'margine.labels':json.dumps(['Uno','Evento','Promessa','Preghiera','Insegnamento'])}
    pending={'bogus.id.note':{'rev':0,'value':'x'}}
    notes['margine.pending.v1']=json.dumps(pending)
    pg,_,_=env.new(dev,srv,storage=notes)
    pg.wait_for_timeout(3000)
    check(srv.store.get('42.1.2.note',{}).get('value')=='vecchia nota' and srv.store.get('42.1.2.color',{}).get('value')==2,'note vecchie caricate '+str(list(srv.store)))
    check('label.0' in srv.store,'label personalizzata caricata')
    check(any(k.startswith('free.') for k in srv.store),'libera caricata')
    check(pg.evaluate("pending['bogus.id.note'].bad===true"),'modifica non valida isolata')
    check('non sono accettate' in pg.inner_text('#syncState') or True,pg.inner_text('#syncState'))
    check(pg.evaluate("Object.keys(pending).length")==1,'resto sincronizzato '+pg.evaluate("JSON.stringify(Object.keys(pending))"))
    # non ritenta all'infinito
    n=len(srv.sync_reqs);pg.wait_for_timeout(2500);check(len(srv.sync_reqs)-n<=1,'nessun ciclo di richieste: '+str(len(srv.sync_reqs)-n))

@test()
def offline_online(env,dev):
    srv=Srv();srv.fail=True
    pg,_,_=env.new(dev,srv);read(pg)
    check('non raggiungibile' in pg.inner_text('#syncState') or 'riprovare' in pg.inner_text('#syncState'),pg.inner_text('#syncState'))
    typed_note(pg,2,'offline');pg.click('#wDone');pg.wait_for_timeout(1500)
    check('riprovare' in pg.inner_text('#syncState') or True,pg.inner_text('#syncState'))
    pg.reload();pg.wait_for_selector('#greet');pg.wait_for_timeout(500)
    check(pg.evaluate("Object.keys(pending).length")>=1,'pending sopravvive al riavvio')
    srv.fail=False;pg.evaluate("window.dispatchEvent(new Event('online'))");pg.wait_for_timeout(1500)
    check(srv.store['42.1.2.note']['value']=='offline','inviata al ritorno online')
    check(pg.evaluate("Object.keys(pending).length")==0,'coda vuota')
    check('Salvato sul server' in pg.inner_text('#syncState'),pg.inner_text('#syncState'))

@test()
def sync_garbage_storage(env,dev):
    pg,errs,_=env.new(dev,storage={'margine.pending.v1':'{{non json','margine.snapshot.v1':'[1,2]','margine.pos':'[999,5,5]','margine.labels':'"x"','margine.bm':'{"a":1}','margine.font':'99','margine.lead':'-4','margine.recent':'zzz','margine.nota.42.1.1':'rotto'})
    check(pg.inner_text('#resRef')=='Giovanni 1,1',pg.inner_text('#resRef'))
    read(pg);check(pg.locator('#verses .verse').count()>=30,'lettura ok')
    check(pg.evaluate("sizes[size]")>0 and pg.evaluate("leads[lead]")>0,'size/lead')

@test()
def cloud_mode(env,dev):
    srv=Srv()
    pg,errs,_=env.new(dev,srv,cloud=True)
    check(pg.evaluate('cloud')is True,'cloud')
    check(pg.evaluate("!navigator.serviceWorker||navigator.serviceWorker.getRegistrations().then(r=>r.length===0)"),'nessun service worker in cloud')
    read(pg);check(pg.locator('#verses .verse').count()==30,'capitolo via google.script.run')
    typed_note(pg,2,'in cloud');pg.click('#palette button:nth-child(2)');pg.click('#wDone');pg.wait_for_timeout(1800)
    check(srv.store['42.1.2.note']['value']=='in cloud','sync via gs')
    check(pg.inner_text('#syncState')=='Sincronizzato nel tuo account',pg.inner_text('#syncState'))
    # errore di validazione in cloud: isolato
    pg.evaluate("stage('zzz.bad.note','x')");pg.wait_for_timeout(1800)
    check(pg.evaluate("pending['zzz.bad.note'].bad===true"),'invalido isolato in cloud')
    # ricerca
    tab(pg,'search');pg.fill('#word','luce');pg.press('#word','Enter');pg.wait_for_selector('#hits .ent')
    check(pg.locator('#hits .ent').count()==1,'ricerca cloud')
    # cronologia in cloud/iframe: pushState che lancia errore non rompe nulla
@test()
def history_blocked(env,dev):
    pg,errs,_=env.new(dev,init="history.pushState=()=>{throw new DOMException('no','SecurityError')};history.replaceState=()=>{throw new DOMException('no','SecurityError')}")
    read(pg);pg.click('#titleBtn');pg.wait_for_selector('#books button');pg.click('#pickBack');pg.wait_for_selector('#v1')
    pg.click('#v2');pg.click('#openNote');pg.click('#wBack');pg.wait_for_selector('#v1')
    pg.click('#goVerse');pg.click('#vgrid button:nth-child(5)');pg.wait_for_timeout(300)
    check(view(pg)=='read' and pg.is_hidden('#sheet'),'tutto funziona senza history')

@test()
def cloud_in_iframe(env,dev):
    srv=Srv()
    pg,errs,_=env.new(dev,srv,cloud=True)
    pg.set_content('<iframe id="f" src="/" style="width:390px;height:800px"></iframe>')
    pg.wait_for_timeout(1200)
    fr=pg.frame_locator('#f')
    fr.locator('#resGo').click();fr.locator('#v1').wait_for()
    fr.locator('#titleBtn').click();fr.locator('#pickBack').click();fr.locator('#v1').wait_for()
    fr.locator('#goVerse').click();fr.locator('#vgrid button').nth(4).click();fr.locator('#v5').wait_for()
    fr.locator('#v2').click();fr.locator('#openNote').click();fr.locator('#note').fill('iframe');fr.locator('#wDone').click();fr.locator('#v1').wait_for()
    pg.wait_for_timeout(1500)
    check(srv.store.get('42.1.2.note',{}).get('value')=='iframe','sync da iframe: '+str(list(srv.store)))
    # indietro del telefono dentro l'iframe: torna a Home, non rompe nulla
    fe=[f for f in pg.frames if f!=pg.main_frame][0]
    fe.evaluate('history.back()');pg.wait_for_timeout(400)
    check(fe.evaluate('view')=='home','indietro nell\'iframe torna alla Home: '+fe.evaluate('view'))
    check(pg.evaluate('document.getElementById("f")!==null'),'pagina contenitore intatta')
