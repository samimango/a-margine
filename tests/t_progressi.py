"""Progressi: calcoli, schermata, accessi da Oggi (cifre) e da Impostazioni."""
import time
from harness import *

def iso(n=0):
    import datetime; return (datetime.date.today() + datetime.timedelta(days=n)).isoformat()
def seed(days, read, extra=None):
    d = {'margine.days': json.dumps(days), 'margine.read': json.dumps({k: 1 for k in read})}
    d.update(extra or {}); return d
def wait_js(pg, expr, timeout=5000):
    t0 = time.time()
    while time.time() - t0 < timeout / 1000:
        if pg.evaluate(expr): return
        pg.wait_for_timeout(60)
    raise AssertionError('timeout: ' + expr[:90])
READ = [f'42.{c}' for c in range(1, 22)] + [f'40.{c}' for c in range(1, 17)] + ['30.1'] + ['0.1', '0.2', '0.3']   # Giovanni 21/21, Marco 16/16, Abdia 1/1, Genesi 3/50
EXTRA = {'margine.nota.42.3.16': json.dumps({'note': 'amore', 'color': 0}), 'margine.nota.42.1.1.3.x': json.dumps({'color': 1}), 'margine.nota.42.1.2': json.dumps({'note': 'uno', 'color': 2})}

@test()
def calcoli_e_schermata(env, dev):
    days = [iso(-9), iso(-8), iso(-7), iso(-6), iso(-2), iso(-1), iso(0)]
    pg = env.new(dev, storage=seed(days, READ, EXTRA))
    pg.click('#scr-oggi .stats .stat >> nth=0'); pg.wait_for_selector('#progWeek'); pg.wait_for_timeout(300)
    eq(pg.evaluate('document.body.dataset.screen'), 'progressi')
    n = len(READ); pct = round(n / 1189 * 100)
    eq(pg.inner_text('#progPct'), f'{pct}%'); check(f'{n} capitoli su 1189' in pg.inner_text('#progCh'), pg.inner_text('#progCh'))
    t = pg.inner_text('.f-progressi-bible-t').replace('\n', ' '); check('3 libri completati' in t, t)
    eq(pg.inner_text('#progStreak b'), '3'); eq(pg.inner_text('#progBest b'), '4')
    eq(pg.inner_text('#progMed b'), '2'); eq(pg.inner_text('#progHl b'), '5')
    done = pg.eval_on_selector_all('#progDone .f-progressi-chip', 'e=>e.map(x=>x.textContent)'); eq(sorted(done), ['Abdia', 'Giovanni', 'Marco'])
    books = pg.eval_on_selector_all('.f-progressi-book .f-progressi-bn', 'e=>e.map(x=>x.textContent)'); eq(books[-1], 'Genesi'); eq(len(books), 4)
    check(pg.locator('.f-progressi-day.on').count() >= 1); check(pg.locator('.f-progressi-day.today.on').count() == 1)
    shot(pg, f'progressi_{dev}')
    pg.click('.f-progressi-book >> nth=3'); wait_js(pg, "document.body.dataset.screen==='libro'")

@test()
def accessi_e_vuoto(env, dev):
    pg = env.new(dev)
    # senza cifre la riga «giorni di fila» di Oggi è nascosta: si arriva a Progressi da Impostazioni › Studio, con la tastiera
    eq(pg.is_visible('#scr-oggi .stats'), False)
    pg.click('#settingsBtn'); pg.wait_for_selector('[data-section="Studio"] .row:has-text("Progressi")')
    pg.focus('[data-section="Studio"] .row:has-text("Progressi")'); pg.keyboard.press('Enter'); pg.wait_for_selector('#progWeek')
    check('0%' in pg.inner_text('#progPct')); check('Quando leggerai' in pg.inner_text('#scr-progressi')); eq(pg.locator('.f-progressi-book').count(), 0)
    pg.keyboard.press('Escape'); wait_js(pg, "document.body.dataset.screen==='impostazioni'")
    pg.click('[data-section="Studio"] .row:has-text("Progressi")'); pg.wait_for_selector('#progWeek')
    pg.click('#scr-progressi .tb-back'); wait_js(pg, "document.body.dataset.screen==='impostazioni'")

@test('phone')
def temi(env, dev):
    for th in ('light', 'paper', 'dark'):
        pg = env.new(dev, storage=seed([iso(-1), iso(0)], READ, {'margine.theme': th}))
        pg.click('#scr-oggi .stats .stat >> nth=0'); pg.wait_for_selector('#progWeek'); pg.wait_for_timeout(900); shot(pg, f'progressi_{th}')
        small = pg.evaluate("[...document.querySelectorAll('#scr-progressi button')].filter(b=>b.offsetParent).map(b=>b.getBoundingClientRect().height).filter(x=>x<43)"); check(not small, str(small))
        pg.context.close()

@test()
def calcolo_serie(env, dev):
    pg = env.new(dev)
    r = pg.evaluate("import('/js/features/progressi.js').then(m=>[m.bestStreak(['2026-01-01','2026-01-02','2026-01-04','2026-01-05','2026-01-06']),m.bestStreak([]),m.weekDays(new Date(2026,10,24))])")
    eq(r[0], 3); eq(r[1], 0); eq(r[2][0], '2026-11-23'); eq(r[2][6], '2026-11-29')
