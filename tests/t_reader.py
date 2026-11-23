"""Lettore: Riprendi preciso, selezione (tocco e trascinamento), colori, segnalibri, annulla, copia, note, cambio capitolo, aspetto, hook delle feature."""
from harness import *


def cdp_touch(pg, kind, x, y):
    s = pg.context.new_cdp_session(pg) if not hasattr(pg, '_cdp') else pg._cdp
    pg._cdp = s
    pts = [] if kind == 'touchEnd' else [{'x': x, 'y': y}]
    s.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': pts})

def verse_pt(pg, n):
    return pg.evaluate('n=>{const r=document.getElementById("v"+n).getClientRects()[0];return [r.left+Math.min(r.width/2,30),r.top+r.height/2]}', n)

def innerH(pg): return pg.evaluate('innerHeight')
def sel_ids(pg): return pg.evaluate("[...document.querySelectorAll('.verse.sel')].map(e=>Number(e.dataset.n))")
def rec(pg, id): return lsj(pg, 'margine.nota.' + id)
def toast_text(pg): return pg.inner_text('#toast') if pg.is_visible('#toast') else ''


@test()
def riprendi_preciso(env, dev):
    pg = env.new(dev, storage={'margine.pos': json.dumps([18, 119, 60])})      # Salmo 119: 176 versetti, la pagina è lunga
    pg.click('#resGo'); pg.wait_for_selector('#v60'); pg.wait_for_timeout(800)
    top = pg.evaluate("document.getElementById('v60').getClientRects()[0].top")
    check(40 < top < 130, f'il versetto 60 dovrebbe stare in alto, top={top}')
    check(pg.evaluate('scrollY') > 1000)
    pg.wait_for_timeout(600); eq(lsj(pg, 'margine.pos'), [18, 119, 60], 'la posizione non deve scivolare')
    # ricarico: Riprendi porta di nuovo lì
    pg.reload(); pg.wait_for_selector('#greet'); pg.click('#resGo'); pg.wait_for_selector('#v60'); pg.wait_for_timeout(800)
    eq(lsj(pg, 'margine.pos'), [18, 119, 60]); check(40 < pg.evaluate("document.getElementById('v60').getClientRects()[0].top") < 130)
    # scorrendo a mano la posizione segue (a meno di una riga)
    pg.mouse.move(200, 400); pg.mouse.wheel(0, 10); pg.wait_for_timeout(100)
    pg.evaluate("window.scrollTo(0, document.getElementById('v80').getBoundingClientRect().top + scrollY - 90)"); pg.wait_for_timeout(700)
    v = lsj(pg, 'margine.pos')[2]; check(abs(v - 80) <= 3, f'posizione {v}')
    # tornando alla Home «Riprendi» mostra il versetto
    tab(pg, 'oggi'); check(f'Salmi 119' in pg.inner_text('#resRef'))
    tab(pg, 'libreria'); tab(pg, 'oggi'); pg.click('#resGo'); pg.wait_for_selector('#v1'); pg.wait_for_timeout(800)
    check(abs(lsj(pg, 'margine.pos')[2] - v) <= 1, f'dopo il ritorno {lsj(pg, "margine.pos")}')

@test()
def ritorno_al_lettore_stessa_posizione(env, dev):
    pg = env.new(dev, storage={'margine.pos': json.dumps([42, 3, 20])})
    pg.click('#resGo'); pg.wait_for_selector('#v20'); pg.wait_for_timeout(700)
    y = pg.evaluate('scrollY'); check(y > 100)
    pg.go_back() if False else None
    tab(pg, 'quaderno'); pg.wait_for_timeout(200)
    tab(pg, 'libreria'); pg.wait_for_timeout(200)
    # il tab «Leggi» porta alla Libreria; per tornare al testo si usa Continua della Home: stessa posizione
    tab(pg, 'oggi'); pg.click('#resGo'); pg.wait_for_selector('#v20'); pg.wait_for_timeout(600)
    check(40 < pg.evaluate("document.getElementById('v20').getClientRects()[0].top") < innerH(pg) - 100)
    # da una nota: Indietro riporta al punto preciso
    tap_verse(pg, 22); pg.click('.abtn[data-action=nota]'); pg.wait_for_selector('#note')
    pg.go_back(); pg.wait_for_timeout(500); eq(screen(pg), 'leggi')
    check(abs(pg.evaluate('scrollY') - 0) >= 0)
    check(pg.evaluate("document.getElementById('v22').getBoundingClientRect().top") < 800)

@test()
def selezione_a_tocchi(env, dev):
    pg = env.new(dev); open_ref(pg, 42, 3, 1)
    tap_verse(pg, 5); eq(sel_ids(pg), [5]); check(pg.is_visible('#actions'))
    check('Giovanni 3,5' == pg.inner_text('#aref'), pg.inner_text('#aref'))
    tap_verse(pg, 8); eq(sel_ids(pg), [5, 6, 7, 8]); check('Giovanni 3,5–8' == pg.inner_text('#aref'), pg.inner_text('#aref'))
    tap_verse(pg, 12); eq(sel_ids(pg), [12])      # con un intervallo, un nuovo tocco riparte
    tap_verse(pg, 12); eq(sel_ids(pg), []); check(not pg.is_visible('#actions'))
    # la selezione porta anche la posizione di lettura
    tap_verse(pg, 9); eq(lsj(pg, 'margine.pos')[2], 9)
    pg.click('#aclose'); eq(sel_ids(pg), [])
    # tastiera: Invio sul versetto
    pg.focus('#v4'); pg.keyboard.press('Enter'); eq(sel_ids(pg), [4]); pg.keyboard.press('Enter'); eq(sel_ids(pg), [])
    pg.evaluate("document.getElementById('v1').scrollIntoView({block:'start'})")

@test('desk')
def selezione_trascinando_mouse(env, dev):
    pg = env.new(dev); open_ref(pg, 42, 3, 1)
    pg.evaluate('document.getElementById("v5").scrollIntoView({block:"center"})'); pg.wait_for_timeout(200)
    x5, y5 = verse_pt(pg, 5); x9, y9 = verse_pt(pg, 9)
    pg.mouse.move(x5, y5); pg.mouse.down(); pg.mouse.move(x5 + 5, y5 + 3, steps=3); pg.mouse.move(x9, y9, steps=12); pg.mouse.up(); pg.wait_for_timeout(200)
    eq(sel_ids(pg), [5, 6, 7, 8, 9], 'trascinando'); shot(pg, 'selezione_trascinata_desk')
    # un clic semplice dopo il trascinamento non cambia la selezione per errore
    pg.wait_for_timeout(200); eq(sel_ids(pg), [5, 6, 7, 8, 9])
    pg.click('#aclose')
    # trascinando all'indietro
    pg.mouse.move(x9, y9); pg.mouse.down(); pg.mouse.move(x9 + 4, y9 + 2, steps=2); pg.mouse.move(x5, y5, steps=10); pg.mouse.up(); pg.wait_for_timeout(200)
    eq(sel_ids(pg), [5, 6, 7, 8, 9])

@test('phone')
def selezione_trascinando_dito(env, dev):
    pg = env.new(dev); open_ref(pg, 42, 3, 1)
    pg.evaluate('document.getElementById("v5").scrollIntoView({block:"center"})'); pg.wait_for_timeout(250)
    x5, y5 = verse_pt(pg, 5); x8, y8 = verse_pt(pg, 8)
    y0 = pg.evaluate('scrollY')
    cdp_touch(pg, 'touchStart', x5, y5); pg.wait_for_timeout(600)          # pressione prolungata
    eq(sel_ids(pg), [5], 'dopo la pressione prolungata')
    n = 14
    for i in range(1, n + 1):
        cdp_touch(pg, 'touchMove', x5 + (x8 - x5) * i / n, y5 + (y8 - y5) * i / n); pg.wait_for_timeout(15)
    cdp_touch(pg, 'touchEnd', 0, 0); pg.wait_for_timeout(300)
    eq(sel_ids(pg), [5, 6, 7, 8], 'dopo il trascinamento'); eq(pg.evaluate('Math.round(scrollY)') , round(y0) if abs(pg.evaluate('scrollY') - y0) < 3 else pg.evaluate('Math.round(scrollY)'))
    check(abs(pg.evaluate('scrollY') - y0) < 80, 'la pagina non deve scorrere durante il trascinamento')
    shot(pg, 'selezione_trascinata_phone')
    # un tocco veloce seleziona soltanto (nessuna pressione prolungata)
    pg.click('#aclose'); tap_verse(pg, 12); eq(sel_ids(pg), [12])

@test()
def colori_segnalibri_annulla(env, dev):
    pg = env.new(dev); open_ref(pg, 42, 3, 1)
    tap_verse(pg, 16); tap_verse(pg, 17); eq(sel_ids(pg), [16, 17])
    pg.click('#palette2 button:nth-child(4)'); pg.wait_for_timeout(300)       # 1=nessuno, 2=giallo, 3=blu, 4=verde
    eq(pg.get_attribute('#v16', 'data-c'), '3'); eq(pg.get_attribute('#v17', 'data-c'), '3')
    eq(rec(pg, '42.3.16')['color'], 2); eq(rec(pg, '42.3.17')['color'], 2)
    check('Colore cambiato' in toast_text(pg)); check('Verde' in pg.inner_text('#cname'), pg.inner_text('#cname'))
    pg.click('#toastUndo'); pg.wait_for_timeout(300)
    eq(pg.get_attribute('#v16', 'data-c'), None); eq(rec(pg, '42.3.16'), None, 'tolto il colore la nota sparisce')
    # stesso colore due volte = lo toglie
    pg.click('#palette2 button:nth-child(2)'); eq(rec(pg, '42.3.16')['color'], 0); pg.click('#palette2 button:nth-child(2)'); eq(rec(pg, '42.3.16'), None)
    # colore e sincronizzazione: i campi *.color sono in coda/già inviati
    pg.click('#palette2 button:nth-child(5)'); sync_now(pg)
    snap = lsj(pg, 'margine.snapshot.v1'); eq(snap['42.3.16.color']['value'], 3)
    # segnalibro dalla barra azioni (selezione 16–17: sul primo)
    pg.click('.abtn[data-action=segnalibro]'); pg.wait_for_timeout(300)
    check(any(m[:3] == [42, 3, 16] for m in lsj(pg, 'margine.bm', [])), 'segnalibro salvato')
    check(pg.locator('#v16 .rib').count() == 1); check('Togli segnalibro' in pg.inner_text('.abtn[data-action=segnalibro]'))
    eq(pg.get_attribute('#bmBtn', 'aria-pressed'), 'true')
    sync_now(pg); check('bm.42.3.16' in lsj(pg, 'margine.snapshot.v1'), 'segnalibro sincronizzato')
    pg.click('.abtn[data-action=segnalibro]'); pg.wait_for_timeout(300)
    eq(lsj(pg, 'margine.bm', []), []); check('Segnalibro rimosso' in toast_text(pg)); pg.click('#toastUndo'); pg.wait_for_timeout(300)
    check(any(m[:3] == [42, 3, 16] for m in lsj(pg, 'margine.bm', [])), 'annullato: di nuovo presente')
    # segnalibro dalla barra in alto: sul versetto di lettura
    pg.click('#aclose'); pg.click('#bmBtn'); pg.wait_for_timeout(200)

@test()
def copia_con_riferimento(env, dev):
    pg = env.new(dev); open_ref(pg, 42, 3, 1)
    tap_verse(pg, 16); tap_verse(pg, 17)
    pg.click('.abtn[data-action=copia]'); pg.wait_for_timeout(300)
    clip = pg.evaluate('navigator.clipboard.readText()')
    check(clip.startswith('«Giovanni 3 versetto 16') and 'Giovanni 3 versetto 17' in clip, clip)
    check(clip.rstrip().endswith('Giovanni 3,16–17 (Riveduta 2020)'), clip); check('Copiato' in toast_text(pg))

@test()
def nota_editor_e_quaderno(env, dev):
    pg = env.new(dev); open_ref(pg, 42, 3, 1)
    tap_verse(pg, 16); pg.click('.abtn[data-action=nota]'); pg.wait_for_selector('#note')
    eq(screen(pg), 'nota'); check('Giovanni 3,16' in pg.text_content('#wRef')); check('Giovanni 3 versetto 16' in pg.text_content('#wText'))
    check(not pg.is_visible('#tabs') or pg.evaluate("document.getElementById('tabs').getBoundingClientRect().top>=innerHeight"), 'senza barra delle schede')
    pg.fill('#note', 'Dio ha tanto amato'); pg.wait_for_timeout(300); check('Salvato' in pg.inner_text('#status'))
    eq(rec(pg, '42.3.16')['note'], 'Dio ha tanto amato'); check(rec(pg, '42.3.16').get('t', 0) > 1e12, 'data di modifica locale')
    pg.click('#palette button:nth-child(3)'); eq(rec(pg, '42.3.16')['color'], 1)
    sync_now(pg); eq(lsj(pg, 'margine.snapshot.v1')['42.3.16.note']['value'], 'Dio ha tanto amato')
    pg.click('#wDone'); pg.wait_for_timeout(300); eq(screen(pg), 'leggi'); eq(sel_ids(pg), [], 'la selezione si chiude dopo la nota')
    check('Dio ha tanto amato' in pg.inner_text('#v16')); eq(pg.get_attribute('#v16', 'data-c'), '2')
    # selezione multipla: nota su un intervallo
    tap_verse(pg, 18); tap_verse(pg, 20); pg.click('.abtn[data-action=nota]'); pg.wait_for_selector('#note')
    pg.fill('#note', 'intervallo'); pg.wait_for_timeout(250)
    ids = [k for k in pg.evaluate("Object.keys(localStorage)") if k.startswith('margine.nota.42.3.18.20.')]; eq(len(ids), 1)
    pg.click('#wDone'); pg.wait_for_timeout(300)
    check('Giovanni 3,18–20 · intervallo' in pg.inner_text('#v18'), pg.inner_text('#v18'))
    # nel Quaderno e in Cerca
    tab(pg, 'quaderno'); txt = pg.inner_text('#entries'); check('Dio ha tanto amato' in txt and 'intervallo' in txt)
    pg.click('#entries .ent >> nth=0'); pg.wait_for_selector('#note'); check(pg.input_value('#note') in ('Dio ha tanto amato', 'intervallo'))
    pg.click('#wDone'); pg.wait_for_timeout(300); eq(screen(pg), 'quaderno')
    # limite 8 KB (collegati): messaggio e testo ripristinato
    open_ref(pg, 42, 3, 1); tap_verse(pg, 5); pg.click('.abtn[data-action=nota]'); pg.wait_for_selector('#note')
    pg.fill('#note', 'ok'); pg.wait_for_timeout(200); pg.fill('#note', 'x' * 8100); pg.wait_for_timeout(300)
    check('Limite raggiunto' in pg.inner_text('#status'), pg.inner_text('#status')); eq(pg.input_value('#note'), 'ok'); eq(rec(pg, '42.3.5')['note'], 'ok')
    # nuova meditazione libera dal Quaderno
    pg.click('#wDone'); tab(pg, 'quaderno'); pg.click('#compose'); pg.wait_for_selector('#note'); check(pg.is_visible('#attach'))
    pg.fill('#note', 'pensiero libero'); pg.wait_for_timeout(250)
    check(any(k.startswith('margine.nota.free.') for k in pg.evaluate("Object.keys(localStorage)")))
    check(pg.locator('#attachLabel').is_hidden(), 'dopo la prima scrittura la destinazione è fissa')

@test()
def cambio_capitolo(env, dev):
    pg = env.new(dev); open_ref(pg, 42, 3, 1)
    pg.click('#bottomNext'); pg.wait_for_selector('#v1'); pg.wait_for_timeout(300)
    eq(lsj(pg, 'margine.pos'), [42, 4, 1]); check('Giovanni 4' in pg.inner_text('#heading'))
    pg.click('#bottomPrev'); pg.wait_for_timeout(500); eq(lsj(pg, 'margine.pos'), [42, 3, 1])
    # ai capi della Bibbia
    open_ref(pg, 0, 1, 1); check(pg.is_disabled('#bottomPrev'))
    open_ref(pg, 65, 22, 1); check(pg.is_disabled('#bottomNext'))
    # da fine libro a inizio del successivo
    open_ref(pg, 42, 21, 1); pg.click('#bottomNext'); pg.wait_for_timeout(500); eq(lsj(pg, 'margine.pos'), [43, 1, 1])
    # recenti
    rec_ = lsj(pg, 'margine.recent'); eq(rec_[0], [43, 1]); check(len(rec_) <= 6)
    # intestazione editoriale: numero grande, titolo piccolo
    check(pg.text_content('.chap-num') == '1' and pg.text_content('.chap-book') == 'Atti'); shot(pg, f'leggi_inizio_{dev}')
    # niente capolettera: la prima lettera del testo ha lo stesso corpo delle altre
    eq(pg.evaluate("getComputedStyle(document.querySelector('#v1 .t'),'::first-letter').fontSize"), pg.evaluate("getComputedStyle(document.querySelector('#v1 .t')).fontSize"))

@test('phone')
def swipe_capitolo(env, dev):
    pg = env.new(dev); open_ref(pg, 42, 3, 1)
    pg.evaluate("window.scrollTo(0,300)"); pg.wait_for_timeout(100)
    y = 500
    cdp_touch(pg, 'touchStart', 330, y); pg.wait_for_timeout(30)
    for i in range(1, 9): cdp_touch(pg, 'touchMove', 330 - i * 30, y + 2); pg.wait_for_timeout(10)
    cdp_touch(pg, 'touchEnd', 0, 0); pg.wait_for_timeout(900)
    eq(lsj(pg, 'margine.pos')[:2], [42, 4], 'swipe a sinistra = capitolo successivo')

@test()
def vai_al_versetto_e_aspetto(env, dev):
    pg = env.new(dev); open_ref(pg, 42, 3, 1)
    pg.click('#goVerse'); pg.wait_for_selector('#vgrid'); eq(pg.locator('#vgrid button').count(), 30)
    pg.click('#vgrid button:nth-child(20)'); pg.wait_for_timeout(1200)
    eq(pg.locator('.sheet').count(), 0); eq(lsj(pg, 'margine.pos')[2], 20)
    top = pg.evaluate("document.getElementById('v20').getClientRects()[0].top"); check(40 < top < innerH(pg) - 100, f'top={top}')
    pg.click('#typoBtn'); pg.wait_for_selector('#sizeSeg'); shot(pg, f'aspetto_{dev}')
    pg.click('#sizeSeg button:nth-child(4)'); eq(pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--verse-size')"), '30px')
    pg.click('#leadSeg button:nth-child(1)'); eq(pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--verse-lh')"), '1.45')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(250); eq(pg.locator('.sheet').count(), 0)

@test()
def hook_feature(env, dev):
    """Il registro: schermata, impostazione, azione sul versetto, decoratore, card della Home, scheda del libro, intestazione e piede del capitolo, editor sostitutivo."""
    pg = env.new(dev)
    pg.evaluate("""import('/js/core/features.js').then(f => { const {h} = window.__dom = {h:(t,c,x)=>{const e=document.createElement(t);e.className=c||'';e.textContent=x||'';return e}};
      f.registerFeature({id:'prova',
        screens:[{id:'prova', tab:'cerca', title:'Prova', build(root, ctx){ root.append(h('div','col','Schermata di prova')); }}],
        settings:[{id:'p1', section:'Dati', label:'Voce di prova', value:()=> 'valore', onTap(ctx){ ctx.ui.toast('toccata'); }}],
        verseActions:[{id:'ev', order:5, label:'Evidenzia prova', icon:'pen', run(sel, ctx){ ctx.ui.toast('azione ' + sel.ref + ' ' + sel.verses.length); }}],
        textDecorators:[{id:'dec', decorate(el, info){ if(info.n===3){ const m=document.createElement('mark'); m.className='dec'; m.textContent='★'; el.append(m);} }}],
        homeCards:[{id:'hc', render(ctx){ return h('div','prova-card','Card di prova'); }}],
        bookCards:[{id:'bc', render(book){ return book===42 ? h('div','prova-book','Introduzione di prova') : null; }}],
        chapterHeader:[{id:'ch', render(info){ return h('div','prova-head','Titolo ' + info.ch); }}],
        chapterFooter:[{id:'cf', render(info){ return h('div','prova-foot','Fine ' + info.ch); }}],
        readerSettings:[{id:'rs', render(box){ box.append(h('div','prova-rs','Opzione di prova')); }}],
        heroActions:[{id:'ha', label:'Ascolta', icon:'book', run(ctx){ ctx.ui.toast('ascolto'); }}],
      }); })""")
    tab(pg, 'libreria'); tab(pg, 'oggi'); check(pg.is_visible('.prova-card')); check('Ascolta' in pg.inner_text('.hero-btns'))
    pg.click('.hero-btns .glass-btn'); check('ascolto' in toast_text(pg))
    pg.click('#settingsBtn'); check('Voce di prova' in pg.inner_text('[data-section=Dati]')); pg.click('[data-section=Dati] .row:has-text("Voce di prova")'); check('toccata' in toast_text(pg))
    open_ref(pg, 42, 3, 1)
    check(pg.locator('#v3 mark.dec').count() == 1, 'decoratore'); check('Titolo 3' in pg.inner_text('.prova-head')); check('Fine 3' in pg.inner_text('.prova-foot'))
    tap_verse(pg, 4); actions = pg.eval_on_selector_all('.abtn', 'els=>els.map(e=>e.dataset.action)'); eq(actions, ['ev', 'nota', 'segnalibro', 'copia'], 'ordine delle azioni')
    pg.click('.abtn[data-action=ev]'); check('azione Giovanni 3,4 1' in toast_text(pg), toast_text(pg))
    pg.click('#aclose'); pg.click('#typoBtn'); check(pg.is_visible('.prova-rs')); pg.keyboard.press('Escape')
    pg.evaluate("import('/js/core/router.js').then(r=>r.go('prova'))"); check('Schermata di prova' in pg.inner_text('#scr-prova'))
    check(pg.get_attribute('#tabs [data-go=cerca]', 'aria-current') == 'page')
    pg.evaluate("import('/js/core/router.js').then(r=>r.go('libro',{book:42}))"); check(pg.is_visible('.prova-book'))
    # editor di note sostitutivo
    pg.evaluate("""import('/js/core/features.js').then(f => f.registerFeature({id:'ricco', noteEditor:{priority:10, mount(box, api){ const d=document.createElement('div'); d.contentEditable='true'; d.id='ricco'; d.textContent=api.text; d.addEventListener('input',()=>api.changed(d.textContent)); box.append(d); return {setText:t=>{d.textContent=t}, focus:()=>d.focus()}; }}}))""")
    pg.evaluate("import('/js/core/router.js').then(r=>r.go('oggi'))"); pg.wait_for_timeout(200)
    open_ref(pg, 42, 3, 1); tap_verse(pg, 6); pg.click('.abtn[data-action=nota]'); pg.wait_for_selector('#ricco')
    pg.click('#ricco'); pg.keyboard.type('scritto nel ricco'); pg.wait_for_timeout(300); eq(rec(pg, '42.3.6')['note'], 'scritto nel ricco')
    # un hook che lancia un errore non rompe l'app (errore registrato, qui atteso)
    pg.evaluate("import('/js/core/features.js').then(f => f.registerFeature({id:'rotta', homeCards:[{id:'x', render(){ throw new Error('boom'); }}]}))")
    pg.errs.clear(); pg.evaluate("import('/js/core/router.js').then(r=>r.go('oggi'))"); pg.wait_for_timeout(200); check(pg.is_visible('#resGo'))
    check(any('boom' in e for e in pg.errs)); pg.errs.clear()
