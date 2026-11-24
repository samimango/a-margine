"""Memoria: aggiungere dal lettore, scheda in Oggi, ripasso con flip e valutazioni, intervalli, elenco e rimozione."""
import time
from harness import *
from t_reader import tap_verse

def wait_js(pg, expr, timeout=5000):
    t0 = time.time()
    while time.time() - t0 < timeout / 1000:
        if pg.evaluate(expr): return
        pg.wait_for_timeout(60)
    raise AssertionError('timeout: ' + expr[:90])

def cards(pg): return lsj(pg, 'margine.memoria.cards', [])
def card(id, due, **kw):
    d = {'id': id, 'b': 42, 'c': 3, 'from': int(id.split('.')[2]), 'to': int(id.split('.')[3]), 'ref': 'Giovanni 3,' + id.split('.')[2],
         'text': 'Poiché Iddio ha tanto amato il mondo, che ha dato il suo unigenito Figliuolo, affinché chiunque crede in lui non perisca, ma abbia vita eterna.',
         'added': 1, 'due': due, 'iv': 0, 'lvl': 0, 'reps': 0, 'last': 0}
    d.update(kw); return d
def seed(cs): return {'margine.memoria.cards': json.dumps(cs)}
def iso(n=0):
    import datetime; return (datetime.date.today() + datetime.timedelta(days=n)).isoformat()

@test()
def aggiungi_dal_lettore(env, dev):
    pg = env.new(dev); open_ref(pg, 42, 3, 1)
    tap_verse(pg, 16); tap_verse(pg, 17)
    pg.click('[data-action="memoria"]'); pg.wait_for_timeout(200)
    cs = cards(pg); eq(len(cs), 1); eq((cs[0]['ref'], cs[0]['from'], cs[0]['to'], cs[0]['due']), ('Giovanni 3,16–17', 16, 17, iso(0)))
    check('versetto 16' in cs[0]['text'] and 'versetto 17' in cs[0]['text'])
    check('Aggiunto' in pg.inner_text('#toast'))
    pg.click('[data-action="memoria"]'); pg.wait_for_timeout(150); check('già' in pg.inner_text('#toast')); eq(len(cards(pg)), 1)
    tap_verse(pg, 1)
    for n in range(2, 11): tap_verse(pg, 1); 
    pg.click('#toastUndo') if pg.is_visible('#toastUndo') else None

@test()
def scheda_oggi_e_ripasso(env, dev):
    pg = env.new(dev, storage=seed([card('42.3.16.16', iso(-1)), card('42.3.17.17', iso(0), ref='Giovanni 3,17'), card('42.3.18.18', iso(5), ref='Giovanni 3,18')]))
    pg.wait_for_selector('#memHome'); check('oggi · 2' in pg.inner_text('#memHome')); check(pg.locator('#memHome .f-memoria-blank').count() >= 1)
    check('Giovanni 3,16' in pg.inner_text('#memHome')); shot(pg, f'memoria_oggi_{dev}')
    pg.click('#memGoHome'); pg.wait_for_selector('.f-memoria-flip'); pg.wait_for_timeout(300)
    check('1 di 2' in pg.inner_text('.f-memoria-ht')); shot(pg, f'memoria_fronte_{dev}')
    gaps = pg.locator('.f-memoria-gap').count(); check(gaps >= 2, str(gaps))
    hidden_words = pg.eval_on_selector_all('.f-memoria-gap', 'e=>e.map(x=>x.querySelector(".f-memoria-gap-w").textContent)')
    check(all(len(w) >= 4 for w in hidden_words) and not set(w.lower() for w in hidden_words) & {'che', 'non', 'ha', 'il', 'in', 'lui'}, str(hidden_words))
    check(f'{gaps} parole nascoste' in pg.inner_text('.f-memoria-tag'))
    pg.click('.f-memoria-gap >> nth=0'); pg.wait_for_timeout(100)
    check(pg.locator('.f-memoria-gap.shown').count() == 1 and pg.inner_text('.f-memoria-gap.shown') == hidden_words[0])
    pg.click('#memShow'); pg.wait_for_timeout(1000); shot(pg, f'memoria_risposta_{dev}')
    eq(pg.get_attribute('.f-memoria-flip', 'data-flipped'), 'true'); check(pg.is_visible('.f-memoria-grades'))
    labels = pg.eval_on_selector_all('.f-memoria-grade', 'e=>e.map(x=>x.innerText.replace(/\\n/g," "))'); eq(labels, ['Difficile domani', 'Bene tra 3 giorni', 'Facile tra 7 giorni'])
    pg.click('[data-grade="good"]'); pg.wait_for_selector('.f-memoria-flip'); pg.wait_for_timeout(200)
    check('2 di 2' in pg.inner_text('.f-memoria-ht'))
    c = [x for x in cards(pg) if x['id'] == '42.3.16.16'][0]; eq((c['iv'], c['due'], c['lvl'], c['reps']), (3, iso(3), 1, 1))
    pg.click('#memShow'); pg.click('[data-grade="hard"]'); pg.wait_for_selector('#memEnd')
    c = [x for x in cards(pg) if x['id'] == '42.3.17.17'][0]; eq((c['iv'], c['due'], c['lvl']), (1, iso(1), 0))
    check('2 versetti ripassati' in pg.inner_text('#memEnd')); shot(pg, f'memoria_fine_{dev}')
    pg.click('#memToday'); wait_js(pg, "document.body.dataset.screen==='oggi'")
    check('in ordine' in pg.inner_text('#memHome') or 'Niente' in pg.inner_text('#memHome'))

@test()
def intervalli_crescenti(env, dev):
    pg = env.new(dev, storage=seed([card('42.3.16.16', iso(0), iv=3, lvl=1, reps=1)]))
    pg.click('#memGoHome'); pg.wait_for_selector('#memShow'); pg.click('#memShow')
    eq(pg.eval_on_selector_all('.f-memoria-grade small', 'e=>e.map(x=>x.textContent)'), ['domani', 'tra 6 giorni', 'tra 7 giorni'])
    pg.click('[data-grade="easy"]'); pg.wait_for_selector('#memEnd'); eq(cards(pg)[0]['iv'], 7)
    # più si sa, più si nasconde
    r = pg.evaluate("""import('/js/features/memoria.js').then(m=>[0,1,2,3,6].map(l=>{const c={id:'x',reps:0,lvl:l,text:'Nel principio era la Parola, e la Parola era con Dio, e la Parola era Dio. Tutte le cose sono state fatte per mezzo di lei.'};return m.pieces(c).filter(t=>t.hide).length}))""")
    check(r == sorted(r) and r[-1] > r[0], str(r))

@test()
def elenco_e_rimozione(env, dev):
    pg = env.new(dev, storage=seed([card('42.3.16.16', iso(0)), card('42.3.18.18', iso(5), ref='Giovanni 3,18')]))
    pg.click('#settingsBtn'); pg.wait_for_selector('[data-section="Studio"]'); check('2 versetti' in pg.inner_text('[data-section="Studio"]'))
    pg.click('[data-section="Studio"] .row:has-text("Imparare a memoria")'); pg.wait_for_selector('#memList'); eq(pg.locator('.f-memoria-item').count(), 2); shot(pg, f'memoria_elenco_{dev}')
    check('Ripasso domani' not in pg.inner_text('#memList') and 'Ripasso tra 5 giorni' in pg.inner_text('#memList'))
    pg.click('.f-memoria-x >> nth=0'); eq(pg.locator('.f-memoria-item').count(), 1); eq(len(cards(pg)), 1)
    pg.click('#toastUndo'); pg.wait_for_timeout(200); eq(pg.locator('.f-memoria-item').count(), 2)
    pg.click('.f-memoria-x >> nth=0'); pg.click('.f-memoria-x >> nth=0'); check('Ancora' in pg.inner_text('#scr-memoria') or 'Nessun versetto' in pg.inner_text('#memList'))
    pg.keyboard.press('Escape'); wait_js(pg, "document.body.dataset.screen!=='memoria'")

@test('phone')
def target_e_temi(env, dev):
    for th in ('light', 'paper', 'dark'):
        pg = env.new(dev, storage={**seed([card('42.3.16.16', iso(0))]), 'margine.theme': th})
        pg.click('#memGoHome'); pg.wait_for_selector('#memShow')
        small = pg.evaluate("[...document.querySelectorAll('#scr-memoria button')].filter(b=>b.offsetParent&&!b.classList.contains('f-memoria-gap')).map(b=>[b.className,b.getBoundingClientRect().height]).filter(x=>x[1]<43)")
        check(not small, str(small)); shot(pg, f'memoria_{th}')
        pg.click('#memShow'); pg.wait_for_timeout(900); shot(pg, f'memoria_{th}_risposta'); pg.context.close()
