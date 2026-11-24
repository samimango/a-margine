"""Feature introduzioni: scheda nella pagina del libro."""
from harness import *

@test()
def introduzioni_scheda(env, dev):
    pg = env.new(dev)
    pg.evaluate("import('/js/core/router.js').then(r=>r.go('libro',{book:42}))")
    pg.wait_for_selector('.f-intro-card'); pg.wait_for_timeout(300)
    t = pg.inner_text('.f-intro').lower()
    for s in ['Il quarto Vangelo', 'Autore', 'Periodo', 'Per chi', 'Tema', 'Versetto chiave', 'Tradizione:', 'Altri studiosi:', 'Tradizione · gli studiosi ne discutono']:
        check(s.lower() in t, s)
    check(pg.evaluate('document.documentElement.scrollWidth<=innerWidth'), 'scroll orizzontale')
    h = pg.eval_on_selector('.f-intro-key', 'e=>e.getBoundingClientRect().height'); check(h >= 44, h)
    shot(pg, f'introduzioni_{dev}')
    pg.click('.f-intro-key'); pg.wait_for_selector('#scr-leggi:not([hidden])'); eq(lsj(pg, 'margine.pos'), [42, 20, 31])

@test('phone')
def introduzioni_temi_e_senza_studiosi(env, dev):
    pg = env.new(dev)
    for th in ['light', 'paper', 'dark']:
        pg.evaluate("t=>document.documentElement.dataset.theme=t", th)
        pg.evaluate("import('/js/core/router.js').then(r=>r.go('libro',{book:1}))"); pg.wait_for_selector('.f-intro-card'); pg.wait_for_timeout(200)
        shot(pg, f'introduzioni_{th}')
    # libro senza studiosi: nessun badge
    pg.evaluate("import('/js/core/router.js').then(r=>r.go('libro',{book:56}))"); pg.wait_for_timeout(400)
    check(pg.locator('.f-intro-card').count() == 1)
