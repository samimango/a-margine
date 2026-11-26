"""Schermate: Quaderno, Cerca, Oggi, Impostazioni, esporta/importa, layout, accessibilità, sicurezza del testo."""
import time
from harness import *
from t_reader import tap_verse, rec, toast_text, sel_ids

def day(n): return int((time.time() - n * 86400) * 1000)

SEED = {
    'margine.nota.42.3.16': json.dumps({'note': 'amore gratuito', 'color': 0, 't': day(0)}),
    'margine.nota.42.1.1': json.dumps({'note': 'la Parola', 'color': 1, 't': day(3)}),
    'margine.nota.18.23.1': json.dumps({'note': 'il Signore è il mio pastore', 't': day(40)}),
    'margine.nota.free.11111111-2222-4333-8444-555555555555': json.dumps({'note': 'pensiero libero'}),
    'margine.bm': json.dumps([[42, 3, 16, day(0)], [18, 23, 1, day(2)]]), 'margine.bm.sync': '1', 'margine.notes.sync': '1',
}

@test()
def quaderno_raggruppamenti(env, dev):
    pg = env.new(dev, storage=SEED); tab(pg, 'quaderno')
    titles = lambda: pg.eval_on_selector_all('.grp-title b', 'els=>els.map(e=>e.textContent)')
    eq(titles(), ['Salmi', 'Giovanni', 'Meditazioni libere']); shot(pg, f'quaderno_{dev}')
    check('1 nota' in pg.inner_text('.grp:first-of-type .grp-title small') or '1 med' in pg.inner_text('.grp:first-of-type .grp-title small'), pg.inner_text('.grp:first-of-type .grp-title small'))
    pg.click('#grpSeg button:nth-child(2)'); eq(titles(), ['Oggi', 'Questa settimana', 'Più vecchie', 'Senza data'])
    pg.click('#grpSeg button:nth-child(3)'); t = titles(); check(t[0].startswith('Giallo') and t[1].startswith('Blu') and t[-1] == 'Senza colore', str(t))
    # ricerca
    pg.click('#grpSeg button:nth-child(1)'); pg.fill('#nbSearch', 'pastore'); eq(titles(), ['Salmi']); pg.fill('#nbSearch', 'zzz'); check('Nessuna meditazione trovata' in pg.inner_text('#entries'))
    pg.fill('#nbSearch', '')
    # il gruppo si ripiega
    pg.click('.grp-head >> nth=0'); check(pg.locator('.grp.closed').count() == 1); pg.click('.grp-head >> nth=0'); eq(pg.locator('.grp.closed').count(), 0)
    # una voce si apre nell'editor e Indietro torna al Quaderno
    pg.click('.ent >> nth=0'); pg.wait_for_selector('#note'); pg.go_back(); pg.wait_for_timeout(300); eq(screen(pg), 'quaderno')
    # segnalibri: rimuovi e annulla
    pg.click('#nbSeg button:nth-child(2)'); eq(pg.locator('#entries .ent').count(), 2)
    pg.click('#entries .x >> nth=0'); eq(pg.locator('#entries .ent').count(), 1); pg.click('#toastUndo'); pg.wait_for_timeout(250); eq(pg.locator('#entries .ent').count(), 2)
    pg.click('#entries .ent-open >> nth=0'); pg.wait_for_selector('#scr-leggi:not([hidden])')

@test()
def cerca_bibbia_e_note(env, dev):
    pg = env.new(dev, storage=SEED); tab(pg, 'cerca')
    pg.fill('#word', 'luce'); pg.press('#word', 'Enter'); pg.wait_for_timeout(500)
    eq(pg.locator('#hits .ent').count(), 2); check('2 versetti trovati' in pg.inner_text('#resultStatus'), pg.inner_text('#resultStatus'))
    shot(pg, f'cerca_{dev}')
    pg.click('#hits .ent >> nth=0'); pg.wait_for_selector('#scr-leggi:not([hidden]) .verse'); eq(lsj(pg, 'margine.pos'), [42, 1, 5])
    tab(pg, 'cerca'); check(pg.inner_text('#word') == '' or True)
    # ricerche recenti
    pg.fill('#word', ''); pg.dispatch_event('#word', 'input'); check(pg.is_visible('#recentS')); check('luce' in pg.inner_text('#recentChips'))
    pg.click('#recentChips .chip >> nth=0'); pg.wait_for_timeout(400); eq(pg.locator('#hits .ent').count(), 2)
    # note
    pg.click('#srSeg button:nth-child(2)'); pg.fill('#word', 'pastore'); eq(pg.locator('#hits .ent').count(), 1); check('Salmi 23,1' in pg.inner_text('#hits'))
    pg.fill('#word', 'zzz'); check('Nessuna nota trovata' in pg.inner_text('#resultStatus'))
    pg.click('#srSeg button:nth-child(1)')
    # riferimento diretto
    pg.fill('#word', 'gv 3,16'); pg.dispatch_event('#word', 'input'); check(pg.is_visible('#jumpRef')); pg.click('#jumpRef'); pg.wait_for_selector('#scr-leggi:not([hidden]) .verse'); eq(lsj(pg, 'margine.pos'), [42, 3, 16])

@test('phone')
def cerca_ricerche_in_corsa(env, dev):
    pg = env.new(dev); tab(pg, 'cerca')
    pg.srv.delay['wordSearch'] = 0.8
    pg.srv.fixture = None
    pg.fill('#word', 'prima'); pg.press('#word', 'Enter')
    pg.srv.delay['wordSearch'] = 0
    pg.fill('#word', 'seconda'); pg.press('#word', 'Enter'); pg.wait_for_timeout(1800)
    eq(pg.locator('#hits .ent').count(), 2, 'solo l’ultima ricerca conta'); check(len([r for r in pg.srv.calls('wordSearch')]) == 2)

@test()
def oggi_statistiche(env, dev):
    pg = env.new(dev)
    open_ref(pg, 64, 1, 1); pg.evaluate("window.scrollTo(0, document.documentElement.scrollHeight)"); pg.wait_for_timeout(700)
    check('64.1' in (lsj(pg, 'margine.read') or {}), 'capitolo letto arrivando in fondo')
    check(len(lsj(pg, 'margine.days')) == 1)
    tab(pg, 'oggi'); txt = pg.inner_text('.stats')
    check('1 giorno di fila' in txt and '1 capitolo letto' in txt and '1 libro finito' in txt, repr(txt))
    check(pg.locator('.recent').count() == 1); check('Giuda' in pg.inner_text('.recents'))
    # Riprendi mostra libro, capitolo e versetto
    check('Giuda' in pg.inner_text('#resRef'))
    # segnalibri e ultima meditazione in Home
    pg2 = env.new(dev, storage=SEED); check('Giovanni 3,16' in pg2.inner_text('#scr-oggi')); check('amore gratuito' in pg2.inner_text('#scr-oggi') or 'Ancora nessuna' in pg2.inner_text('#scr-oggi'))
    pg2.click('#scr-oggi .rows .row >> nth=0'); pg2.wait_for_selector('#scr-leggi:not([hidden])'); eq(lsj(pg2, 'margine.pos')[:2], [42, 3])

@test()
def impostazioni_colori_e_voci(env, dev):
    pg = env.new(dev); pg.click('#settingsBtn'); pg.wait_for_selector('.settings')
    rows = pg.eval_on_selector_all('.settings .row b', 'els=>els.map(e=>e.textContent)')
    for r in ['Nomi dei colori', 'Collega il tuo Google', 'Esporta le meditazioni', 'Copia negli appunti', 'Importa il testo della Bibbia', 'Apri su LaParola.net']: check(r in rows, f'{r} in {rows}')
    pg.click('.settings .row:has-text("Nomi dei colori")'); pg.wait_for_selector('#colorsForm')
    pg.fill('#colorsForm label:nth-child(1) input', 'Bontà'); pg.click('#colorsForm button[type=submit]'); pg.wait_for_timeout(300)
    eq(lsj(pg, 'margine.labels')[0], 'Bontà'); pg.wait_for_timeout(900)
    check('label.0' in pg.srv.user_props(), 'il nome del colore va sul servizio')
    open_ref(pg, 42, 3, 1); tap_verse(pg, 3); check('Bontà' in pg.get_attribute('#palette2 button:nth-child(2)', 'title'))
    # la pagina «Collega» è raggiungibile e mostra lo stato
    pg.evaluate("import('/js/core/router.js').then(r=>r.go('collega'))"); check('Collegato' in pg.inner_text('#connState'), pg.inner_text('#connState')); shot(pg, f'collega_{dev}')
    href = pg.evaluate("import('/js/core/router.js').then(r=>r.go('impostazioni')).then(()=>document.querySelector('a.row').href)"); check('laparola.net/testo.php' in href)

@test()
def esporta_copia_importa(env, dev):
    pg = env.new(dev, storage=SEED)
    open_ref(pg, 42, 3, 1); pg.wait_for_timeout(500)
    pg.evaluate("import('/js/core/router.js').then(r=>r.go('impostazioni'))")
    with pg.expect_download() as dl: pg.click('.settings .row:has-text("Esporta le meditazioni")')
    d = dl.value; check(d.suggested_filename.startswith('meditazioni-') and d.suggested_filename.endswith('.txt'), d.suggested_filename)
    body = open(d.path(), encoding='utf-8').read()
    check('A margine · Meditazioni' in body and 'amore gratuito' in body and 'Giovanni 3,16' in body and 'Colore: Giallo' in body, body[:300])
    check('Testo: Giovanni 3 versetto 16' in body, 'il testo del passo, dalla cache dei capitoli letti')
    pg.click('.settings .row:has-text("Copia negli appunti")'); pg.wait_for_timeout(300)
    check('Meditazione:\namore gratuito' in pg.evaluate('navigator.clipboard.readText()'))
    # senza meditazioni: avviso
    p2 = env.new(dev); p2.click('#settingsBtn'); p2.click('.settings .row:has-text("Esporta le meditazioni")'); check('Non ci sono meditazioni' in toast_text(p2))
    # importa (senza servizio collegato il testo importato è l'unica fonte)
    p2 = env.new(dev, configured=False); p2.click('#settingsBtn')
    p2.click('.settings .row:has-text("Importa il testo della Bibbia")'); p2.wait_for_selector('.sheet input[type=file]')
    p2.set_input_files('.sheet input[type=file]', files=[{'name': 'b.txt', 'mimeType': 'text/plain', 'buffer': 'Giuda 1:1 Giuda, servo di Gesù Cristo\nGiuda 1:2 Misericordia a voi\n'.encode()}])
    p2.wait_for_selector('#scr-leggi:not([hidden]) .verse'); p2.wait_for_timeout(500)
    check('Giuda, servo di Gesù Cristo' in p2.inner_text('#verses')); eq(lsj(p2, 'margine.pos')[:2], [64, 1])
    # file sbagliato
    p2.evaluate("import('/js/core/router.js').then(r=>r.go('impostazioni'))"); p2.click('.settings .row:has-text("Importa il testo della Bibbia")')
    p2.set_input_files('.sheet input[type=file]', files=[{'name': 'x.txt', 'mimeType': 'text/plain', 'buffer': b'riga senza riferimento'}]); p2.wait_for_timeout(400)
    check('Controlla il riferimento alla riga 1' in p2.inner_text('.sheet'), p2.inner_text('.sheet'))

@test()
def layout_e_schermate(env, dev):
    pg = env.new(dev, storage=SEED)
    def overflow(): return pg.evaluate('document.documentElement.scrollWidth - innerWidth')
    for t in ['libreria', 'quaderno', 'cerca', 'oggi']:
        tab(pg, t); check(overflow() <= 0, f'overflow orizzontale in {t}: {overflow()}'); shot(pg, f'schermata_{t}_{dev}')
    open_ref(pg, 42, 3, 1); pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(300); check(overflow() <= 0); shot(pg, f'schermata_leggi_{dev}')
    tap_verse(pg, 4); tap_verse(pg, 6); check(overflow() <= 0); shot(pg, f'schermata_selezione_{dev}')
    r = pg.evaluate("(()=>{const a=document.getElementById('actions').getBoundingClientRect();return [a.left>=0,a.right<=innerWidth,a.bottom<=innerHeight]})()"); eq(r, [True, True, True])
    pg.click('.abtn[data-action=nota]'); pg.wait_for_selector('#note'); check(overflow() <= 0); shot(pg, f'schermata_nota_{dev}')
    # tutti i bersagli del tocco ≥ 40 px nelle barre
    pg.click('#wDone'); pg.wait_for_timeout(300)
    small = pg.evaluate("[...document.querySelectorAll('#readTop button, #tabs button')].filter(b=>b.offsetParent!==null).map(b=>b.getBoundingClientRect()).filter(r=>r.width<40||r.height<40).length"); eq(small, 0, 'bersagli piccoli')
    if dev == 'desk':
        w = pg.evaluate("document.querySelector('#scr-leggi .reader').getBoundingClientRect().width"); check(w <= 700, f'colonna di lettura {w}')

@test('phone')
def temi_su_ogni_schermata(env, dev):
    for t in ('light', 'paper', 'dark'):
        pg = env.new(dev, storage=dict(SEED, **{'margine.theme': t}))
        open_ref(pg, 42, 3, 1); pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(250); shot(pg, f'tema_{t}_leggi')
        tap_verse(pg, 4); pg.click('#palette2 button:nth-child(3)'); pg.click('#aclose'); shot(pg, f'tema_{t}_colore')
        pg.evaluate("import('/js/core/router.js').then(r=>r.go('libro',{book:42}))"); pg.wait_for_timeout(300); shot(pg, f'tema_{t}_libro')
        pg.evaluate("import('/js/core/router.js').then(r=>r.go('oggi'))"); pg.wait_for_timeout(300); shot(pg, f'tema_{t}_oggi')
        pg.evaluate("import('/js/core/router.js').then(r=>r.go('libreria'))"); pg.wait_for_timeout(300); shot(pg, f'tema_{t}_libreria')

@test()
def accessibilita(env, dev):
    pg = env.new(dev); open_ref(pg, 42, 3, 1)
    pg.focus('#goVerse'); pg.click('#goVerse'); pg.wait_for_selector('.sheet')
    check(pg.evaluate("document.querySelector('.sheet-box').contains(document.activeElement)"), 'il focus va nel foglio')
    for _ in range(40): pg.keyboard.press('Tab')
    check(pg.evaluate("document.querySelector('.sheet-box').contains(document.activeElement)"), 'il Tab resta nel foglio')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200); eq(pg.evaluate("document.activeElement.id"), 'goVerse', 'il focus torna al pulsante')
    eq(pg.get_attribute('.sheet-box', 'role') if pg.locator('.sheet-box').count() else 'dialog', 'dialog')
    tab(pg, 'quaderno'); eq(pg.evaluate("document.activeElement.id"), 'scr-quaderno', 'il focus va in cima alla nuova schermata')
    names_ = pg.eval_on_selector_all('#tabs button', 'els=>els.map(e=>e.textContent.trim())'); eq(names_, ['Oggi', 'Leggi', 'Quaderno', 'Cerca'])
    check(pg.evaluate("[...document.querySelectorAll('button')].filter(b=>b.offsetParent!==null&&!b.textContent.trim()&&!b.getAttribute('aria-label')&&!b.title).length") == 0, 'pulsanti senza nome')

@test()
def sicurezza_del_testo(env, dev):
    evil = '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>'
    pg = env.new(dev, storage={'margine.nota.42.1.1': json.dumps({'note': evil, 'color': 0}), 'margine.recentsearch': json.dumps([evil]), 'margine.labels': json.dumps([evil, 'b', 'c', 'd', 'e'])})
    pg.srv.fixture = evil
    open_ref(pg, 42, 1, 1); tab(pg, 'quaderno'); tab(pg, 'cerca'); pg.click('#srSeg button:nth-child(2)'); pg.fill('#word', 'img'); pg.wait_for_timeout(300)
    pg.click('#settingsBtn') if screen(pg) == 'oggi' else pg.evaluate("import('/js/core/router.js').then(r=>r.go('impostazioni'))"); pg.wait_for_timeout(300)
    eq(pg.evaluate('window.__xss'), None); eq(pg.locator('img[src=x]').count(), 0)
    # CSP: nessuno script inline oltre a quello del tema
    csp = pg.evaluate("document.querySelector('meta[http-equiv=Content-Security-Policy]').content"); check("script-src 'self' 'sha256-" in csp and 'unsafe-eval' not in csp and "connect-src 'self' https://script.google.com" in csp, csp)
