"""Parole toccabili (misure, luoghi, personaggi) e interruttori «Nel testo» dell'Aspetto della lettura."""
from harness import *
from urllib.parse import quote

MT25 = {
    15: 'E a uno diede cinque talenti, a un altro due, a un altro uno; a ciascuno secondo la sua capacità; e partì. Talentoso non conta.',
    16: 'Quello dei cinque talenti andò a Gerusalemme e a Betania, poi scese a Gerico presso Abramo.',
    17: 'Maria e Giovanni parlarono con Giacomo ed Erode; Giuda ascoltò. Mosè e Davide, Pietro e Paolo.',
    18: 'Pagò cento denari per una misura di grano e un cubito di stoffa. Il mare era calmo e il dito indicava il cielo.',
    19: 'Dopo molto tempo, il padrone di quei servitori tornò.',
}


def fixture(srv, book, ch, verses):
    html = '<div id="brano"><h1>%s %d</h1><p>' % (book, ch) + ''.join('<strong>%d</strong>&nbsp;%s ' % (n, t) for n, t in verses.items()) + '</p></div>'
    srv.host.call(cmd='fixture', sub=quote('"riferimento":"%s %d"' % (book, ch), safe=''), body=json.dumps(html))


def page(env, dev, verses=None, book='Matteo', b=39, ch=25, **kw):
    srv = Srv(); env.srvs.append(srv)
    fixture(srv, book, ch, verses or MT25)
    pg = env.new(dev, srv=srv, **kw)
    open_ref(pg, b, ch, 15)
    pg.wait_for_selector('#v15'); pg.wait_for_timeout(300)
    return pg


def words(pg, kind): return pg.eval_on_selector_all('.f-parole-w.f-parole-' + kind, 'els=>els.map(e=>e.textContent)')
def set_switch(pg, key, on):
    pg.click('#typoBtn'); pg.wait_for_selector('.f-aspetto-row')
    cur = pg.get_attribute(f'.f-aspetto-row[data-key={key}]', 'aria-checked') == 'true'
    if cur != on: pg.click(f'.f-aspetto-row[data-key={key}]')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(250)


@test()
def misure_sottolineate_per_impostazione_predefinita(env, dev):
    pg = page(env, dev)
    w = words(pg, 'misura'); eq(w, ['talenti', 'talenti', 'denari', 'cubito'], 'solo misure intere; «misura», «dito», «Talentoso» no')
    eq(pg.locator('.f-parole-luogo, .f-parole-persona').count(), 0, 'luoghi e personaggi spenti di serie')
    eq(pg.evaluate("document.querySelector('#v15 .t').textContent"), MT25[15], 'il testo non cambia')
    check(pg.evaluate("getComputedStyle(document.querySelector('.f-parole-w')).textDecorationLine") == 'underline')
    # tocco: scheda, e il versetto NON si seleziona
    pg.click('.f-parole-misura >> nth=0'); pg.wait_for_selector('.popover.f-parole-pp')
    eq(pg.locator('.verse.sel').count(), 0, 'il tocco sulla parola non seleziona il versetto'); check(not pg.is_visible('#actions'))
    txt = pg.inner_text('.popover'); check('Talento' in txt and '34 kg' in txt and 'OGGI' in txt.upper() and 'Mt 25,15' in txt, txt)
    eq(pg.evaluate("document.activeElement.classList.contains('popover')"), True, 'il focus entra nella scheda')
    shot(pg, f'parole_misura_{dev}')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
    eq(pg.locator('.popover').count(), 0); check(pg.evaluate("document.activeElement.classList.contains('f-parole-w')"), 'il focus torna sulla parola')
    # tastiera: Invio apre la scheda
    pg.keyboard.press('Enter'); pg.wait_for_selector('.popover.f-parole-pp'); eq(pg.locator('.verse.sel').count(), 0)
    pg.keyboard.press('Escape')
    # il tocco sul resto del versetto continua a selezionare
    tap_verse(pg, 19); eq(pg.evaluate("[...document.querySelectorAll('.verse.sel')].map(e=>Number(e.dataset.n))"), [19])


@test()
def riferimenti_tappabili_e_chiusura(env, dev):
    pg = page(env, dev)
    pg.click('.f-parole-misura >> nth=0'); pg.wait_for_selector('.popover.f-parole-pp')
    pg.click('.popover .f-parole-ref >> text=Es 38,25'); pg.wait_for_selector('#scr-leggi:not([hidden]) .verse'); pg.wait_for_timeout(400)
    eq(lsj(pg, 'margine.pos'), [1, 38, 25]); eq(pg.locator('.popover').count(), 0, 'la scheda si chiude aprendo un passo')
    # tocco fuori chiude
    open_ref(pg, 39, 25, 15); pg.click('.f-parole-misura >> nth=1'); pg.wait_for_selector('.popover')
    pg.mouse.click(5, 300); pg.wait_for_timeout(200); eq(pg.locator('.popover').count(), 0)
    # secondo tocco sulla stessa parola = chiude
    pg.click('.f-parole-misura >> nth=1'); pg.wait_for_selector('.popover'); pg.wait_for_timeout(350)
    pg.click('.f-parole-misura >> nth=1'); pg.wait_for_timeout(250); eq(pg.locator('.popover').count(), 0)


@test()
def interruttori_luoghi_personaggi_e_ambigui(env, dev):
    pg = page(env, dev)
    pg.click('#typoBtn'); pg.wait_for_selector('.f-aspetto-row')
    eq(pg.locator('.f-aspetto-row').count(), 5)
    state = {k: pg.get_attribute(f'.f-aspetto-row[data-key={k}]', 'aria-checked') for k in ['numeri', 'titoletto', 'misure', 'luoghi', 'personaggi']}
    eq(state, {'numeri': 'true', 'titoletto': 'true', 'misure': 'true', 'luoghi': 'false', 'personaggi': 'false'})
    check(all(pg.get_attribute(f'.f-aspetto-row[data-key={k}]', 'aria-labelledby') for k in state), 'etichette accessibili')
    shot(pg, f'aspetto_nel_testo_{dev}')
    pg.click('.f-aspetto-row[data-key=luoghi]'); pg.click('.f-aspetto-row[data-key=personaggi]'); pg.wait_for_timeout(500)
    eq(ls(pg, 'margine.parole.luoghi'), '1'); eq(ls(pg, 'margine.parole.personaggi'), '1')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    eq(words(pg, 'luogo'), ['Gerusalemme', 'Betania', 'Gerico'])
    eq(words(pg, 'persona'), ['Abramo', 'Mosè', 'Davide', 'Pietro', 'Paolo'], 'Maria, Giovanni, Giacomo, Erode, Giuda sono ambigui: non sottolineati')
    eq(pg.evaluate("document.querySelector('#v17 .t').textContent"), MT25[17])
    # scheda luogo: niente pulsante mappa se la schermata 'mondo' non c'è
    pg.click('.f-parole-luogo >> nth=0'); pg.wait_for_selector('.popover.f-parole-pp')
    t = pg.inner_text('.popover'); check('GERUSALEMME' in t.upper() and 'LUOGO' in t.upper() and '2Sam 5,6' in t, t)
    if not pg.evaluate("import('/js/core/router.js').then(r=>r.hasScreen('mondo'))"): eq(pg.locator('.f-parole-map').count(), 0)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    # con la schermata 'mondo' il pulsante appare e porta lì con il parametro luogo
    if not pg.evaluate("import('/js/core/router.js').then(r=>r.hasScreen('mondo'))"):
        pg.evaluate("""import('/js/core/features.js').then(f => f.registerFeature({id:'mondo-prova', screens:[{id:'mondo', title:'Mondo', build(root){ root.textContent='Mondo di prova'; }}]}))""")
    pg.click('.f-parole-luogo >> nth=0'); pg.wait_for_selector('.f-parole-map')
    shot(pg, f'parole_luogo_{dev}')
    pg.click('.f-parole-map'); pg.wait_for_timeout(300); eq(screen(pg), 'mondo')
    eq(pg.evaluate("import('/js/core/router.js').then(r=>r.currentParams_().luogo)"), 'gerusalemme')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    pg.evaluate("import('/js/core/nav.js').then(n=>n.openRef(39,25,15))"); pg.wait_for_selector('.f-parole-persona'); pg.wait_for_timeout(300)
    # scheda personaggio
    pg.click('.f-parole-persona >> nth=0'); pg.wait_for_selector('.popover.f-parole-pp')
    t = pg.inner_text('.popover'); check('Abramo' in t and 'Gn 12' in t.replace('Gn 12,1', 'Gn 12') or 'Gn' in t, t); shot(pg, f'parole_persona_{dev}')
    pg.keyboard.press('Escape')
    # spegnere misure: spariscono; riaccendere: tornano; persiste dopo il ricaricamento
    set_switch(pg, 'misure', False); eq(pg.locator('.f-parole-misura').count(), 0)
    pg.reload(); pg.wait_for_selector('#greet'); open_ref(pg, 39, 25, 15); pg.wait_for_timeout(500)
    eq(pg.locator('.f-parole-misura').count(), 0); eq(len(words(pg, 'luogo')), 3)


@test()
def numeri_e_intestazione(env, dev):
    pg = page(env, dev)
    check(pg.is_visible('#v15 sup')); check(pg.is_visible('.chap-num'))
    set_switch(pg, 'numeri', False); check(not pg.is_visible('#v15 sup'), 'numeri nascosti'); eq(ls(pg, 'margine.parole.numeri'), '0')
    set_switch(pg, 'titoletto', False); check(not pg.is_visible('.chap-num') and not pg.is_visible('.chap-fleuron'), 'intestazione nascosta')
    pg.reload(); pg.wait_for_selector('#greet'); open_ref(pg, 39, 25, 15); pg.wait_for_timeout(300)
    check(not pg.is_visible('#v15 sup') and not pg.is_visible('.chap-num'), 'persistono')
    set_switch(pg, 'numeri', True); set_switch(pg, 'titoletto', True); check(pg.is_visible('#v15 sup') and pg.is_visible('.chap-num'))


@test('phone')
def salmo_119_resta_fluido(env, dev):
    verses = {n: f'Versetto {n}: un talento, Gerusalemme e Abramo; denari e cubiti, Betania. Parole abbastanza lunghe per andare a capo nel testo.' for n in range(1, 177)}
    pg = page(env, dev, verses, book='Salmi', b=18, ch=119, storage={'margine.parole.luoghi': '1', 'margine.parole.personaggi': '1'})
    pg.wait_for_selector('#v176', state='attached')
    eq(pg.locator('.f-parole-w').count(), 176 * 6)
    ms = pg.evaluate("""import('/js/core/features.js').then(f => { const t0 = performance.now(); for (let i = 0; i < 176; i++) { const el = document.createElement('span'); el.textContent = 'Versetto un talento, Gerusalemme e Abramo; denari e cubiti, Betania. Parole abbastanza lunghe.'; f.decorateVerse(el, {book: 18, ch: 119, n: i, id: 'x', text: ''}); } return performance.now() - t0; })""")
    check(ms < 250, f'176 versetti decorati in {ms:.0f} ms')


@test('phone')
def tre_temi_con_scheda(env, dev):
    for theme in ['light', 'paper', 'dark']:
        pg = page(env, dev, storage={'margine.theme': theme, 'margine.parole.luoghi': '1', 'margine.parole.personaggi': '1'})
        shot(pg, f'parole_testo_{theme}')
        pg.click('.f-parole-misura >> nth=0'); pg.wait_for_selector('.popover.f-parole-pp'); pg.wait_for_timeout(200)
        shot(pg, f'parole_scheda_{theme}')
        pg.keyboard.press('Escape')
        box = pg.evaluate("(()=>{const r=document.querySelector('.f-parole-w').getBoundingClientRect();return [r.height]})()")
        env.close()
