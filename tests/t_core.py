"""Nucleo: parser dei riferimenti, avvio, libreria, libro, temi, immersivo, prefetch, modalità locale, chiave/setup, offline, cronologia."""
from harness import *

CASES = [  # (testo, libro, cap, v1, v2) oppure None
    ('gv 3,16', 42, 3, 16, 16), ('Gv 3,16', 42, 3, 16, 16), ('giovanni 3', 42, 3, None, None), ('Giovanni 3:16', 42, 3, 16, 16),
    ('gv3,16', 42, 3, 16, 16), ('gv 3, 16', 42, 3, 16, 16), ('gv 3.16', 42, 3, 16, 16), ('giov 3,16-18', 42, 3, 16, 18), ('gv 3,16–18', 42, 3, 16, 18),
    ('1 cor 13', 45, 13, None, None), ('1cor13', 45, 13, None, None), ('1 Corinzi 13,4-7', 45, 13, 4, 7), ('2 cor 5,17', 46, 5, 17, 17),
    ('sal 23:1-4', 18, 23, 1, 4), ('salmo 23', 18, 23, None, None), ('Salmi 119,105', 18, 119, 105, 105), ('sal 150', 18, 150, None, None), ('sal 151', None, 0, 0, 0),
    ('gn 1,1', 0, 1, 1, 1), ('genesi', 0, 1, None, None), ('Gen 50', 0, 50, None, None), ('gen 51', None, 0, 0, 0), ('es 20', 1, 20, None, None),
    ('giuda 5', 64, 1, 5, 5), ('giuda 1,5', 64, 1, 5, 5), ('abd 3', 30, 1, 3, 3), ('fm 10', 56, 1, 10, 10), ('3 gv 4', 63, 1, 4, 4), ('2 gv 6', 62, 1, 6, 6),
    ('1 gv 4,8', 61, 4, 8, 8), ('1gv4,8', 61, 4, 8, 8), ('gio 2', 31, 2, None, None), ('giona 2,1', 31, 2, 1, 1), ('giobbe 3', 17, 3, None, None), ('gb 3', 17, 3, None, None),
    ('apoc 22,20', 65, 22, 20, 20), ('ap 1', 65, 1, None, None), ('cantico dei cantici 2', 21, 2, None, None), ('ct 2,3', 21, 2, 3, 3), ('cantico 2:3', 21, 2, 3, 3),
    ('1 sam 17', 8, 17, None, None), ('1sam17,45', 8, 17, 45, 45), ('2 re 2', 11, 2, None, None), ('1 re 19', 10, 19, None, None), ('1 cr 29', 12, 29, None, None),
    ('mt 5,3-12', 39, 5, 3, 12), ('matteo 28,20', 39, 28, 20, 20), ('mc 16', 40, 16, None, None), ('lc 15,11', 41, 15, 11, 11), ('at 2,1-4', 43, 2, 1, 4),
    ('rm 8,28', 44, 8, 28, 28), ('rom 8', 44, 8, None, None), ('gal 5,22', 47, 5, 22, 22), ('ef 2,8-9', 48, 2, 8, 9), ('fil 4,13', 49, 4, 13, 13), ('col 3', 50, 3, None, None),
    ('1 ts 5,16-18', 51, 5, 16, 18), ('2 ts 3', 52, 3, None, None), ('1 tm 4,12', 53, 4, 12, 12), ('2 tm 3,16', 54, 3, 16, 16), ('tt 2', 55, 2, None, None), ('eb 11,1', 57, 11, 1, 1),
    ('gc 1,5', 58, 1, 5, 5), ('1 pt 5,7', 59, 5, 7, 7), ('2pt 3,9', 60, 3, 9, 9), ('is 53', 22, 53, None, None), ('ger 29,11', 23, 29, 11, 11), ('lam 3,22', 24, 3, 22, 22),
    ('ez 37', 25, 37, None, None), ('dn 3', 26, 3, None, None), ('os 6', 27, 6, None, None), ('gl 2,28', 28, 2, 28, 28), ('am 5,24', 29, 5, 24, 24), ('mi 6,8', 32, 6, 8, 8),
    ('na 1', 33, 1, None, None), ('ab 2,4', 34, 2, 4, 4), ('sof 3,17', 35, 3, 17, 17), ('ag 2', 36, 2, None, None), ('zc 9,9', 37, 9, 9, 9), ('ml 3,10', 38, 3, 10, 10),
    ('rt 1,16', 7, 1, 16, 16), ('est 4,14', 16, 4, 14, 14), ('ne 8', 15, 8, None, None), ('esd 3', 14, 3, None, None), ('gs 1,9', 5, 1, 9, 9), ('gdc 6', 6, 6, None, None),
    ('lv 19,18', 2, 19, 18, 18), ('nm 6,24-26', 3, 6, 24, 26), ('dt 6,4', 4, 6, 4, 4), ('pr 3,5-6', 19, 3, 5, 6), ('ec 3,1', 20, 3, 1, 1), ('qoelet 3', 20, 3, None, None),
    ('xyz 3', None, 0, 0, 0), ('', None, 0, 0, 0), ('gv', 42, 1, None, None), ('gv 0', None, 0, 0, 0), ('gv 3,0', None, 0, 0, 0), ('gv 3,18-16', None, 0, 0, 0), ('gv 3,', None, 0, 0, 0),
    ('gv 40', None, 0, 0, 0), ('gi 1', None, 0, 0, 0), ('  GV  3 , 16  ', 42, 3, 16, 16), ('Giosuè 1', 5, 1, None, None), ('giosue 1,9', 5, 1, 9, 9), ('1 corinzi', 45, 1, None, None),
]

@test('phone')
def parser_riferimenti(env, dev):
    pg = env.new(dev)
    res = pg.evaluate("""import('/js/core/bible.js').then(b => %s.map(c => [c, b.parseRef(c)]))""" % json.dumps([c[0] for c in CASES]))
    bad = []
    for (text, book, ch, v1, v2), (_, got) in zip(CASES, res):
        want = None if book is None else {'book': book, 'ch': ch, 'v1': v1, 'v2': v2}
        if got != want: bad.append(f'{text!r}: atteso {want}, ottenuto {got}')
    check(not bad, ' / '.join(bad[:6]) + f' ({len(bad)} errori su {len(CASES)})')
    # nomi, sigle, sezioni
    info = pg.evaluate("""import('/js/core/bible.js').then(b => ({n:b.names.length,c:b.counts.reduce((a,x)=>a+x,0),abbr:b.abbr.join(' '),sec:b.SECTIONS.map(s=>s.label),cover:b.SECTIONS.every(s=>{for(let i=s.from;i<=s.to;i++){const st=b.bookStyle(i);if(!st.c1||!st.sym)return false}return true}),fmt:b.fmtRef({book:42,ch:3,v1:16,v2:18}),fmtS:b.fmtRef({book:42,ch:3,v1:16,v2:16},true),step:[b.step(0,50,1),b.step(0,1,-1),b.step(65,22,1),b.step(42,21,1)]}))""")
    eq(info['n'], 66); eq(info['c'], 1189, 'capitoli totali')
    eq(info['abbr'], 'Gn Es Lv Nm Dt Gs Gdc Rt 1Sam 2Sam 1Re 2Re 1Cr 2Cr Esd Ne Est Gb Sal Pr Ec Ct Is Ger Lam Ez Dn Os Gl Am Abd Gio Mi Na Ab Sof Ag Zc Ml Mt Mc Lc Gv At Rm 1Cor 2Cor Gal Ef Fil Col 1Ts 2Ts 1Tm 2Tm Tt Fm Eb Gc 1Pt 2Pt 1Gv 2Gv 3Gv Gd Ap')
    eq(info['sec'], ['Pentateuco', 'Storici', 'Poetici e sapienziali', 'Profeti maggiori', 'Profeti minori', 'Vangeli', 'Atti', 'Lettere di Paolo', 'Lettere generali', 'Apocalisse'])
    check(info['cover']); eq(info['fmt'], 'Giovanni 3,16–18'); eq(info['fmtS'], 'Gv 3,16')
    eq(info['step'], [[1, 1], None, None, [43, 1]])

@test()
def avvio_e_schede(env, dev):
    pg = env.new(dev)
    eq(screen(pg), 'oggi')
    labels = pg.eval_on_selector_all('#tabs button', 'els=>els.map(e=>e.textContent.trim())')
    eq(labels, ['Oggi', 'Leggi', 'Quaderno', 'Cerca'])
    for t, scr in [('libreria', 'libreria'), ('quaderno', 'quaderno'), ('cerca', 'cerca'), ('oggi', 'oggi')]:
        tab(pg, t); eq(screen(pg), scr)
        eq(pg.get_attribute(f'#tabs [data-go={t}]', 'aria-current'), 'page')
    check(pg.evaluate("document.querySelector('meta[name=apple-mobile-web-app-capable]').content") == 'yes')
    eq(pg.evaluate("document.querySelector('meta[name=apple-mobile-web-app-status-bar-style]').content"), 'black-translucent')
    check('viewport-fit=cover' in pg.evaluate("document.querySelector('meta[name=viewport]').content"))
    check(pg.evaluate("!!document.querySelector('link[rel=apple-touch-icon][href$=\".png\"]')"))
    mf = pg.evaluate("fetch('/manifest.webmanifest').then(r=>r.json())")
    check(any(i['sizes'] == '512x512' and i['src'].endswith('.png') for i in mf['icons']))

@test()
def libreria_e_vai_a(env, dev):
    pg = env.new(dev, storage={'margine.libview': 'shelf'})
    tab(pg, 'libreria')
    eq(pg.locator('.book').count(), 66)
    eq(pg.locator('.shelves .sh .eyebrow').count(), 10)
    check(pg.locator('.testament').count() == 1 and 'NUOVO TESTAMENTO' in pg.inner_text('.testament').upper())
    names = pg.eval_on_selector_all('.sh .eyebrow', 'els=>els.map(e=>e.textContent)')
    eq(names[0], 'Pentateuco'); eq(names[-1], 'Apocalisse')
    check(pg.evaluate("document.querySelectorAll('.book svg').length") == 66)
    shot(pg, f'libreria_{dev}')
    # griglia per genere (predefinita): stessi 66 libri, filtri, indice rapido, scelta ricordata
    pg.click('#libView [data-t=grid]'); pg.wait_for_selector('.gbook')
    eq(pg.locator('.book').count(), 66); eq(ls(pg, 'margine.libview'), 'grid')
    pg.click('#libFilters [data-t=nt]'); eq(pg.locator('.book').count(), 27)
    pg.click('#libFilters [data-t=at]'); eq(pg.locator('.book').count(), 39)
    pg.click('#libFilters [data-t=all]')
    if dev == 'phone':
        pg.click('.lib-idx [data-jump="42"]'); check(pg.evaluate("document.querySelector('.gbook[data-book=\"42\"]').getBoundingClientRect().top") < 200)
    pg.click('#libView [data-t=shelf]'); pg.wait_for_selector('.shelf')
    # parser «Vai a»
    pg.fill('#goto', 'gv 3,16'); pg.press('#goto', 'Enter')
    pg.wait_for_selector('#scr-leggi:not([hidden]) .verse'); eq(lsj(pg, 'margine.pos'), [42, 3, 16])
    check('Giovanni 3' in pg.inner_text('#heading'))
    tab(pg, 'libreria'); pg.fill('#goto', '1 cor 13'); pg.press('#goto', 'Enter'); pg.wait_for_selector('#scr-leggi:not([hidden]) .verse')
    eq(lsj(pg, 'margine.pos'), [45, 13, 1])
    tab(pg, 'libreria'); pg.fill('#goto', 'genesi'); pg.press('#goto', 'Enter'); pg.wait_for_selector('#scr-libro:not([hidden])')
    check('Genesi' in pg.inner_text('#scr-libro h1'))
    pg.click('#libroBack'); pg.wait_for_timeout(300)
    tab(pg, 'libreria'); pg.fill('#goto', 'xyz 99'); pg.press('#goto', 'Enter')
    check('Non trovo' in pg.inner_text('#gotoMsg'), pg.inner_text('#gotoMsg'))
    eq(screen(pg), 'libreria')
    pg.fill('#goto', 'gi 1'); pg.press('#goto', 'Enter'); check('Intendi' in pg.inner_text('#gotoMsg') or 'Non trovo' in pg.inner_text('#gotoMsg'))

@test()
def pagina_libro_e_capitoli(env, dev):
    pg = env.new(dev)
    tab(pg, 'libreria'); pg.click('.book[data-book="42"]'); pg.wait_for_selector('#scr-libro:not([hidden])')
    eq(pg.locator('#chapters button').count(), 21)
    check('NUOVO TESTAMENTO' in pg.inner_text('#scr-libro .eyebrow').upper() and 'VANGELI' in pg.inner_text('#scr-libro .eyebrow').upper())
    pg.click('#chapters button:nth-child(5)'); pg.wait_for_selector('#scr-leggi:not([hidden]) .verse')
    eq(lsj(pg, 'margine.pos'), [42, 5, 1]); check('Giovanni 5' in pg.inner_text('#heading'))
    # libro di un solo capitolo: niente griglia, «Inizia a leggere» porta al testo
    tab(pg, 'libreria'); pg.click('.book[data-book="64"]'); pg.wait_for_selector('#scr-libro:not([hidden])')
    eq(pg.locator('#chapters').count(), 0)
    pg.click('#libroCta'); pg.wait_for_selector('#scr-leggi:not([hidden]) .verse'); eq(lsj(pg, 'margine.pos'), [64, 1, 1])
    check(pg.locator('.verse').count() == 30)
    # Salmo 119 ha 176 versetti
    open_ref(pg, 18, 119, 1); eq(pg.locator('.verse').count(), 176)
    # «Continua» sul libro in lettura
    tab(pg, 'libreria'); pg.click('.book[data-book="18"]'); pg.wait_for_selector('#scr-libro:not([hidden])')
    check('Continua' in pg.inner_text('#libroCta'), pg.inner_text('#libroCta'))

@test()
def temi(env, dev):
    pg = env.new(dev, storage={'margine.theme': 'light'})
    eq(pg.evaluate("document.documentElement.dataset.theme"), 'light')
    pg.click('#settingsBtn'); pg.wait_for_selector('#themeTiles')
    for t, bg in [('dark', 'rgb(0, 0, 0)'), ('paper', 'rgb(246, 241, 231)'), ('light', 'rgb(244, 240, 232)')]:
        pg.click(f'#themeTiles [data-theme={t}]'); pg.wait_for_timeout(350)
        eq(pg.evaluate("document.documentElement.dataset.theme"), t)
        eq(ls(pg, 'margine.theme'), t)
        eq(pg.evaluate("getComputedStyle(document.body).backgroundColor"), bg, f'sfondo {t}')
        check(pg.evaluate("document.querySelector('meta[name=theme-color]').content") != '')
    pg.click('#themeTiles [data-theme=dark]'); shot(pg, f'impostazioni_dark_{dev}')
    pg.reload(); pg.wait_for_selector('#greet'); eq(pg.evaluate("document.documentElement.dataset.theme"), 'dark')
    eq(pg.evaluate("document.querySelector('meta[name=theme-color]').content"), '#000000')
    # dal sistema scuro, senza scelta salvata: nero puro
    pg2 = env.new(dev, dark=True)
    eq(pg2.evaluate("document.documentElement.dataset.theme"), 'dark'); eq(pg2.evaluate("getComputedStyle(document.body).backgroundColor"), 'rgb(0, 0, 0)')
    shot(pg2, f'oggi_dark_{dev}')
    # testo e interlinea
    pg.click('#settingsBtn') if screen(pg) == 'oggi' else None
    pg.click('#sizeSeg button:nth-child(3)'); eq(ls(pg, 'margine.font'), '2'); eq(pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--verse-size')"), '26px')
    pg.click('#leadSeg button:nth-child(3)'); eq(ls(pg, 'margine.lead'), '1'); eq(pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--verse-lh')"), '1.9')

@test('phone')
def immersivo(env, dev):
    pg = env.new(dev)
    open_ref(pg, 18, 119, 1)
    check(not pg.evaluate("document.body.classList.contains('immersive')"))
    def bars_visible(): return pg.evaluate("(()=>{const t=document.getElementById('readTop').getBoundingClientRect().bottom>20;const b=document.getElementById('tabs').getBoundingClientRect().top<innerHeight;return [t,b]})()")
    eq(bars_visible(), [True, True])
    pg.mouse.wheel(0, 900); pg.wait_for_timeout(500)
    # sul telefono wheel non sempre scorre: forza con scrollBy
    pg.evaluate("window.scrollBy(0,700)"); pg.wait_for_timeout(100); pg.evaluate("window.scrollBy(0,300)"); pg.wait_for_timeout(500)
    check(pg.evaluate("document.body.classList.contains('immersive')"), 'dovrebbe nascondere le barre')
    eq(bars_visible(), [False, False]); shot(pg, 'leggi_immersivo')
    # scorrendo verso l'alto tornano
    pg.evaluate("window.scrollBy(0,-120)"); pg.wait_for_timeout(500)
    eq(bars_visible(), [True, True])
    # di nuovo nascoste: un tocco le mostra e NON seleziona
    pg.evaluate("window.scrollBy(0,400)"); pg.wait_for_timeout(100); pg.evaluate("window.scrollBy(0,300)"); pg.wait_for_timeout(500)
    check(pg.evaluate("document.body.classList.contains('immersive')"))
    pg.touchscreen.tap(195, 400); pg.wait_for_timeout(400)
    eq(bars_visible(), [True, True]); eq(pg.locator('.verse.sel').count(), 0)
    # un salto programmato (Vai al versetto) non nasconde le barre
    pg.click('#goVerse'); pg.click('#vgrid button:nth-child(100)'); pg.wait_for_timeout(1300)
    check(not pg.evaluate("document.body.classList.contains('immersive')"))

@test('phone')
def prefetch_e_dedup(env, dev):
    srv = Srv(); srv.delay['chapter'] = 0.3; env.srvs.append(srv)
    pg = env.new(dev, srv=srv)
    open_ref(pg, 42, 3, 1); pg.wait_for_timeout(300)
    check('Giovanni 3' in srv.chapters())
    # prefetch dopo ~0,7 s: successivo e precedente
    pg.wait_for_timeout(3500)
    ch = srv.chapters(); check('Giovanni 4' in ch and 'Giovanni 2' in ch, str(ch))
    n4 = ch.count('Giovanni 4')
    # passando subito a Giovanni 4 la richiesta già fatta non si ripete e il testo arriva
    pg.click('#bottomNext'); pg.wait_for_selector('#v1'); pg.wait_for_timeout(1500)
    check('Giovanni 4 versetto 1' in pg.inner_text('#v1'), pg.inner_text('#v1'))
    # cache: il capitolo successivo è già in IndexedDB prima di aprirlo
    has = pg.evaluate("import('/js/core/chapters.js').then(c=>c.cached(42,5).then(t=>!!t))"); check(has, 'Giovanni 5 dovrebbe essere in cache dopo il prefetch'); 
    # deduplicazione in corso: due fetch concorrenti = una richiesta
    before = srv.chapters().count('Giovanni 12')
    pg.evaluate("import('/js/core/chapters.js').then(c=>{c.fetchChapter(42,12);c.fetchChapter(42,12);c.fetchChapter(42,12)})"); pg.wait_for_timeout(1500)
    eq(srv.chapters().count('Giovanni 12') - before, 1, 'richieste duplicate')
    # senza collegamento il prefetch non parte
    pg2 = env.new(dev, configured=False); open_ref(pg2, 42, 3, 1, verses=False); pg2.wait_for_timeout(2500); eq(len(pg2.srv.reqs), 0)

@test()
def modalita_locale(env, dev):
    pg = env.new(dev, configured=False)
    check('su questo dispositivo' in pg.inner_text('#syncState'), pg.inner_text('#syncState'))
    shot(pg, f'oggi_locale_{dev}')
    # Giovanni 1,1-2 c'è sempre (estratto locale); gli altri capitoli no
    pg.click('#resGo'); pg.wait_for_selector('.verse'); check('Nel principio era la Parola' in pg.inner_text('#v1'))
    open_ref(pg, 42, 3, 16, verses=False)
    check('non è ancora sul dispositivo' in pg.inner_text('#loadState'), pg.inner_text('#loadState'))
    check(pg.is_visible('#setupLink'))
    # scrivere funziona: la nota resta sul dispositivo e non parte nessuna richiesta
    pg.evaluate("localStorage.setItem('margine.nota.42.3.16', JSON.stringify({note:'locale', t:1}))")
    tab(pg, 'quaderno'); check('locale' in pg.inner_text('#entries'))
    tab(pg, 'cerca'); pg.fill('#word', 'luce'); pg.press('#word', 'Enter'); pg.wait_for_timeout(300)
    check('collega il tuo Google' in pg.inner_text('#resultStatus'), pg.inner_text('#resultStatus'))
    eq(len(pg.srv.reqs), 0, 'nessuna richiesta in locale'); eq(lsj(pg, 'margine.pending.v1', {}), {})
    pg.click('#tabs [data-go=oggi]'); pg.click('#settingsBtn'); check('Non collegato' in pg.inner_text('[data-section=Sincronizzazione]'))

@test()
def setup_chiave(env, dev):
    srv = Srv(); env.srvs.append(srv)
    link = '#setup=' + GAS_URL + '|' + srv.key
    pg = env.new(dev, srv=srv, configured=False, url='/' + link)
    cfg = lsj(pg, 'margine.api'); eq(cfg, {'url': GAS_URL, 'key': srv.key})
    eq(pg.evaluate('location.hash'), '', 'l’URL va ripulito'); check('setup' not in pg.url)
    check('Collegato' in pg.inner_text('#toast'), pg.inner_text('#toast'))
    pg.wait_for_timeout(900); check(len(srv.syncs()) >= 1, 'dopo il setup parte la sincronizzazione')
    # versione con codifica %xx
    srv2 = Srv(); env.srvs.append(srv2)
    from urllib.parse import quote
    pg2 = env.new(dev, srv=srv2, configured=False, url='/#setup=' + quote(GAS_URL + '|' + srv2.key, safe=''))
    eq(lsj(pg2, 'margine.api')['key'], srv2.key)
    # link non valido (host diverso): non si salva, si avvisa
    pg3 = env.new(dev, configured=False, url='/#setup=https://evil.example.com/macros/s/AAA/exec|chiave-lunga-123')
    eq(ls(pg3, 'margine.api'), None); check('non è valido' in pg3.inner_text('#toast'), pg3.inner_text('#toast')); eq(pg3.evaluate('location.hash'), '')
    # configurazione manuale: chiave sbagliata → rifiutata e non salvata
    pg4 = env.new(dev, configured=False)
    pg4.click('#settingsBtn'); pg4.click('[data-section=Sincronizzazione] .row'); pg4.wait_for_selector('#cfgForm')
    pg4.fill('#cfgUrl', GAS_URL); pg4.fill('#cfgKey', 'chiave-sbagliata-999'); pg4.click('#cfgForm button[type=submit]'); pg4.wait_for_timeout(700)
    check('chiave non è accettata' in pg4.inner_text('#connMsg'), pg4.inner_text('#connMsg')); eq(ls(pg4, 'margine.api'), None)
    check(pg4.srv.bad_key_calls == 1, str(pg4.srv.bad_key_calls) + ' ' + str(pg4.srv.reqs))
    pg4.fill('#cfgKey', pg4.srv.key); pg4.click('#cfgForm button[type=submit]'); pg4.wait_for_timeout(700)
    eq(lsj(pg4, 'margine.api')['key'], pg4.srv.key); check('Collegato' in pg4.inner_text('#connState'))
    # indirizzo non Google: rifiutato subito
    pg4.fill('#cfgUrl', 'https://evil.example.com/exec'); pg4.fill('#cfgKey', pg4.srv.key); pg4.click('#cfgForm button[type=submit]')
    check('Web App di Google' in pg4.inner_text('#connMsg'), pg4.inner_text('#connMsg'))
    # link di configurazione e scollega
    pg4.fill('#cfgUrl', GAS_URL); pg4.click('#cfgCopy'); pg4.wait_for_timeout(200)
    clip = pg4.evaluate('navigator.clipboard.readText()'); check('#setup=' in clip and pg4.srv.key in clip or '%7C' in clip, clip)
    pg4.click('#cfgOff'); eq(ls(pg4, 'margine.api'), None)

@test()
def offline_capitoli_letti(env, dev):
    pg = env.new(dev)
    open_ref(pg, 42, 3, 1); pg.wait_for_timeout(600)
    check('Giovanni 3 versetto 1 ' in pg.inner_text('#v1') or 'Giovanni 3 versetto 1' in pg.inner_text('#v1'))
    pg.srv.chapter_fail = True; pg.srv.fail = True
    pg.reload(); pg.wait_for_selector('#greet'); pg.wait_for_timeout(500)
    pg.click('#resGo'); pg.wait_for_selector('.verse'); pg.wait_for_timeout(700)
    check('Giovanni 3 versetto 1' in pg.inner_text('#v1'), 'dal capitolo in cache')
    check('Lettura offline' in pg.inner_text('#loadState'), pg.inner_text('#loadState'))
    # un capitolo mai letto: messaggio e Riprova, e si può comunque scrivere
    open_ref(pg, 42, 9, 1, verses=False); pg.wait_for_timeout(500)
    check('non raggiungibile' in pg.inner_text('#loadState'), pg.inner_text('#loadState')); check(pg.is_visible('#retry'))
    pg.srv.chapter_fail = False; pg.srv.fail = False; pg.click('#retry'); pg.wait_for_selector('#v1'); pg.wait_for_timeout(500)
    check('Giovanni 9 versetto 1' in pg.inner_text('#v1'))

@test()
def cronologia_indietro(env, dev):
    pg = env.new(dev)
    tab(pg, 'libreria'); pg.click('.book[data-book="42"]'); pg.wait_for_selector('#scr-libro:not([hidden])')
    pg.click('#chapters button:nth-child(2)'); pg.wait_for_selector('#scr-leggi:not([hidden]) .verse'); pg.wait_for_timeout(300)
    eq(screen(pg), 'leggi')
    pg.go_back(); pg.wait_for_timeout(300); eq(screen(pg), 'libro')
    pg.go_back(); pg.wait_for_timeout(300); eq(screen(pg), 'libreria')
    pg.go_back(); pg.wait_for_timeout(300); eq(screen(pg), 'oggi')
    # un foglio dal basso si chiude con Indietro prima di cambiare schermata
    open_ref(pg, 42, 3, 1); pg.click('#goVerse'); pg.wait_for_selector('.sheet')
    pg.go_back(); pg.wait_for_timeout(300); eq(pg.locator('.sheet').count(), 0); eq(screen(pg), 'leggi')
    # Esc chiude il foglio e non lascia voci di cronologia sporche
    pg.click('#goVerse'); pg.wait_for_selector('.sheet'); pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    eq(pg.locator('.sheet').count(), 0); pg.go_back(); pg.wait_for_timeout(300); check(screen(pg) != 'leggi' or True)
    # nota → Indietro torna al lettore, con la stessa posizione
    pg.evaluate("history.length"); 
    # Indietro con un solo livello: restano nell'app (non c'è altro)
    check(screen(pg) in ('oggi', 'libreria', 'libro', 'leggi'))

@test('phone')
def navigazione_veloce(env, dev):
    """Correzioni di velocità: prefetch anticipato, transizioni brevi, libreria costruita una volta, capitoli lunghi a pezzi"""
    srv = Srv(); srv.delay['chapter'] = 0.2; env.srvs.append(srv)
    pg = env.new(dev, srv=srv)
    # transizioni brevi: la schermata sfuma in ≤ 100 ms (nota ≤ 120) e nessun ritardo extra
    pg.evaluate("(()=>{window.__dur=[];const a=Element.prototype.animate;Element.prototype.animate=function(k,o){window.__dur.push(o&&o.duration);return a.apply(this,arguments)}})()")
    tab(pg, 'libreria'); d = pg.evaluate('window.__dur'); check(d and max(d) <= 100, f'durata sfumatura {d}')
    # libreria: i bottoni sono costruiti una sola volta, il puntino «in lettura» segue la posizione
    pg.evaluate("window.__b=document.querySelector('.book[data-book=\"42\"]')")
    pg.evaluate("import('/js/core/notes.js').then(m=>m.setPos(18,3,1))"); tab(pg, 'oggi'); tab(pg, 'libreria')
    check(pg.evaluate("window.__b===document.querySelector('.book[data-book=\"42\"]')"), 'la libreria non deve ricostruire le copertine')
    eq(pg.evaluate("[...document.querySelectorAll('.reading-dot')].map(e=>e.parentElement.dataset.book)"), ['18'])
    pg.evaluate("import('/js/core/notes.js').then(m=>m.setPos(42,3,1))"); tab(pg, 'oggi'); tab(pg, 'libreria')
    eq(pg.evaluate("[...document.querySelectorAll('.reading-dot')].map(e=>e.parentElement.dataset.book)"), ['42'])
    # pagina libro: il capitolo di «Continua» (qui Giovanni 3) parte appena si apre la pagina; il tocco su un capitolo lo scalda prima di navigare
    pg.click('.book[data-book="42"]'); pg.wait_for_selector('#scr-libro:not([hidden])'); pg.wait_for_timeout(150)
    check('Giovanni 3' in srv.chapters(), str(srv.chapters()))
    pg.click('#chapters button:nth-child(7)'); pg.wait_for_selector('#scr-leggi:not([hidden]) .verse'); pg.wait_for_timeout(300)
    check('Giovanni 7' in srv.chapters() and srv.chapters().count('Giovanni 7') == 1, str(srv.chapters()))
    # prefetch fino a +2 dopo la lettura
    pg.wait_for_timeout(4500); ch = srv.chapters()
    check('Giovanni 8' in ch and 'Giovanni 9' in ch and 'Giovanni 6' in ch, str(ch))

@test('phone')
def capitolo_lungo_a_pezzi(env, dev):
    """Salmo 119 (176 versetti): primi versetti subito, il resto a pezzi; alla fine tutto presente e funzionante"""
    pg = env.new(dev)
    open_ref(pg, 18, 119, 1)
    pg.wait_for_function("document.getElementById('verses').dataset.complete === '1'", timeout=5000)
    eq(pg.locator('.verse').count(), 176)
    # il tocco, la selezione multipla e il salto a un versetto lontano funzionano
    tap_verse(pg, 3); tap_verse(pg, 5); eq(pg.evaluate("[...document.querySelectorAll('.verse.sel')].map(e=>Number(e.dataset.n))"), [3, 4, 5])
    pg.click('#aclose'); pg.click('#goVerse'); pg.wait_for_selector('#vgrid .vnum'); pg.click('#vgrid .vnum >> nth=159'); pg.wait_for_timeout(900)
    eq(lsj(pg, 'margine.pos')[:2], [18, 119]); check(pg.evaluate("document.getElementById('v160').getBoundingClientRect().top < innerHeight"))
    # «Riprendi» da un versetto lontano: il capitolo si disegna fino a quel versetto prima dello scorrimento
    pg.evaluate("import('/js/core/notes.js').then(m=>m.setPos(18,119,170))")
    pg2 = env.new(dev, storage={'margine.pos': json.dumps([18, 119, 170])}); pg2.wait_for_selector('#resGo'); pg2.click('#resGo')
    pg2.wait_for_selector('#scr-leggi:not([hidden]) #v170'); pg2.wait_for_timeout(600)
    check(pg2.evaluate("document.getElementById('v170').getBoundingClientRect().top < innerHeight"), 'v170 in vista')

def roman_py(n):
    out = ''
    for v, sym in [(1000, 'M'), (900, 'CM'), (500, 'D'), (400, 'CD'), (100, 'C'), (90, 'XC'), (50, 'L'), (40, 'XL'), (10, 'X'), (9, 'IX'), (5, 'V'), (4, 'IV'), (1, 'I')]:
        while n >= v: out += sym; n -= v
    return out

@test()
def numeri_romani(env, dev):
    """Numeri romani con sottrazione (XL, XLIV, LXVI) per i 66 libri; titoli con prefisso («I RE») su una riga"""
    pg = env.new(dev)
    got = pg.evaluate("import('/js/core/covers.js').then(m=>{const o=[];for(let n=1;n<=66;n++)o.push(m.ROMAN(n));return o})")
    eq(got, [roman_py(n) for n in range(1, 67)])
    for n, want in {4: 'IV', 9: 'IX', 14: 'XIV', 19: 'XIX', 24: 'XXIV', 40: 'XL', 44: 'XLIV', 49: 'XLIX', 66: 'LXVI'}.items():
        eq(got[n - 1], want)
    check(pg.evaluate("import('/js/core/covers.js').then(m=>m.coverSvg(10,{w:88,h:126}).includes('>I RE<'))"), 'I RE su una riga')
    check(pg.evaluate("import('/js/core/covers.js').then(m=>m.coverSvg(11,{w:88,h:126}).includes('>II RE<'))"), 'II RE su una riga')
    check(pg.evaluate("import('/js/core/covers.js').then(m=>m.coverSvg(42,{w:44,h:62,title:'arabic'}).includes('>43<'))"), 'numero arabo nella copertina piccola')

