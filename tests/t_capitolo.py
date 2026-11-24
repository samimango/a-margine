"""Fine capitolo (sigillo «Letto», capitolo dopo, ultimo capitolo) e animazione del nastro."""
from harness import *
from t_parole import fixture, MT25


def wait_on(pg, timeout=5000):
    """wait_for_function usa eval e la CSP dell'app lo vieta: si interroga la pagina a intervalli"""
    for _ in range(timeout // 60):
        if pg.evaluate("Boolean(document.querySelector('.f-fine.on'))"): return
        pg.wait_for_timeout(60)
    raise AssertionError('timeout: .f-fine.on')


def to_bottom(pg):
    pg.evaluate("document.querySelector('.f-fine')?.scrollIntoView({block:'center'})"); pg.wait_for_timeout(250)


def page(env, dev, **kw):
    srv = Srv(); env.srvs.append(srv)
    fixture(srv, 'Matteo', 25, MT25)
    pg = env.new(dev, srv=srv, **kw); open_ref(pg, 39, 25, 1); pg.wait_for_selector('.f-fine', state='attached'); return pg


@test()
def sigillo_si_stampa_e_segna_letto(env, dev):
    pg = page(env, dev)
    if dev == 'phone':
        eq(pg.evaluate("getComputedStyle(document.querySelector('.f-fine-seal')).opacity"), '0', 'prima di arrivare in fondo il sigillo non c’è')
        eq(lsj(pg, 'margine.read', {}), {})
    to_bottom(pg)
    wait_on(pg); pg.wait_for_timeout(1000)
    check('39.25' in lsj(pg, 'margine.read', {}), 'capitolo segnato come letto')
    eq(pg.evaluate("getComputedStyle(document.querySelector('.f-fine-seal')).opacity"), '1')
    check('Capitolo letto' in pg.inner_text('.f-fine-label'))
    shot(pg, f'capitolo_finito_{dev}')
    # capitolo dopo
    check('Matteo 26' in pg.inner_text('.f-fine-next')); check(pg.evaluate("document.querySelector('.f-fine-next .cover svg')!==null"))
    pg.click('.f-fine-next'); pg.wait_for_timeout(500); eq(lsj(pg, 'margine.pos'), [39, 26, 1]); check('Matteo 26' in pg.inner_text('#heading'))


@test('phone')
def animazione_e_movimento_ridotto(env, dev):
    pg = page(env, dev)
    pg.evaluate("document.querySelector('.f-fine').scrollIntoView({block:'center'})")
    wait_on(pg)
    n = pg.evaluate("document.querySelector('.f-fine-seal').getAnimations().length"); check(n >= 1, 'animazione a molla in corso')
    env.close()
    pg = env.new(dev, srv=None); pg.emulate_media(reduced_motion='reduce')
    open_ref(pg, 42, 3, 1); pg.wait_for_selector('.f-fine', state='attached'); to_bottom(pg); wait_on(pg)
    eq(pg.evaluate("document.querySelector('.f-fine-seal').getAnimations().length"), 0, 'senza animazioni con movimento ridotto')


@test()
def ultimo_capitolo_di_apocalisse(env, dev):
    pg = env.new(dev); open_ref(pg, 65, 22, 1); pg.wait_for_selector('.f-fine', state='attached'); to_bottom(pg)
    check('Hai finito la Bibbia' in pg.inner_text('.f-fine-label')); check('ultima pagina' in pg.inner_text('.f-fine-end'))
    eq(pg.locator('.f-fine-next').count(), 0)
    shot(pg, f'capitolo_apocalisse_{dev}')
    pg.click('.f-fine-end .btn.primary'); pg.wait_for_timeout(500); eq(lsj(pg, 'margine.pos'), [0, 1, 1])


@test('phone')
def tre_temi(env, dev):
    for theme in ['light', 'paper', 'dark']:
        pg = page(env, dev, storage={'margine.theme': theme}); to_bottom(pg); pg.wait_for_timeout(1000); shot(pg, f'capitolo_{theme}'); env.close()


@test()
def nastro_scende_con_rimbalzo(env, dev):
    pg = page(env, dev)
    pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(300)
    pg.click('#bmBtn'); pg.wait_for_timeout(60)
    n = pg.evaluate("document.querySelector('.chap-ribbon')?.getAnimations().length"); check(n and n >= 1, f'animazione del nastro: {n}')
    pg.wait_for_timeout(900); eq(pg.evaluate("document.querySelector('.chap-ribbon').getAnimations().length"), 0)
    # togliere il segnalibro non anima
    pg.click('#bmBtn'); pg.wait_for_timeout(60); eq(pg.evaluate("document.querySelector('.chap-ribbon')===null"), True)
