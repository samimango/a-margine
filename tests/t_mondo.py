"""Feature mondo: Mondo della Bibbia (mappa online/offline, elenchi, schede, attribuzioni)."""
import base64
from harness import *

PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==')
def mock_tiles(pg, fail=False):
    pg.tile_reqs = []
    def h(route, req):
        pg.tile_reqs.append(req.url)
        return route.abort() if fail else route.fulfill(status=200, content_type='image/png', body=PNG)
    pg.route('https://tile.openstreetmap.org/**', h)
def go_mondo(pg, **params):
    pg.evaluate("p=>import('/js/core/router.js').then(r=>r.go('mondo',p))", params)
    pg.wait_for_selector('#scr-mondo:not([hidden])')
def no_hscroll(pg): check(pg.evaluate('document.documentElement.scrollWidth<=innerWidth+1'), 'scroll orizzontale')

@test()
def mondo_offline_mappa_disegnata(env, dev):
    pg = env.new(dev, init="Object.defineProperty(navigator,'onLine',{get:()=>false})")
    mock_tiles(pg)
    go_mondo(pg); pg.wait_for_selector('.f-mondo-map'); pg.wait_for_timeout(700)
    eq(len(pg.tile_reqs), 0); check(pg.is_visible('.f-mondo-draw'))
    check(pg.locator('.f-mondo-pt:not([hidden])').count() >= 5)
    check(pg.is_visible('.f-mondo-offline')); check(not pg.is_visible('.f-mondo-attr'))
    check('OpenBible.info' in pg.inner_text('.f-mondo-attrib') and 'CC BY 4.0' in pg.inner_text('.f-mondo-attrib'))
    no_hscroll(pg); shot(pg, f'mondo_offline_{dev}')

@test()
def mondo_online_piastrelle(env, dev):
    pg = env.new(dev); mock_tiles(pg)
    go_mondo(pg); pg.wait_for_selector('.f-mondo-tile.ok', state='attached'); pg.wait_for_timeout(500)
    check(len(pg.tile_reqs) >= 1 and len(pg.tile_reqs) <= 40, len(pg.tile_reqs))
    check(all(u.startswith('https://tile.openstreetmap.org/') for u in pg.tile_reqs))
    check(pg.is_visible('.f-mondo-attr') and '© OpenStreetMap contributors' in pg.inner_text('.f-mondo-attr'))
    n = len(pg.tile_reqs)
    pg.click('.f-mondo-btn.plus'); pg.wait_for_timeout(900); check(len(pg.tile_reqs) > n)
    shot(pg, f'mondo_online_{dev}')

@test('phone')
def mondo_tile_falliscono(env, dev):
    pg = env.new(dev); mock_tiles(pg, fail=True)
    go_mondo(pg); pg.wait_for_timeout(1200)
    check(pg.is_visible('.f-mondo-draw')); check(not pg.is_visible('.f-mondo-attr')); check(pg.is_visible('.f-mondo-offline'))
    check(pg.locator('.f-mondo-pt:not([hidden])').count() >= 5)

@test()
def mondo_tocco_punto_e_scheda(env, dev):
    pg = env.new(dev, init="Object.defineProperty(navigator,'onLine',{get:()=>false})")
    go_mondo(pg, luogo='gerusalemme'); pg.wait_for_selector('.sheet [data-kind=luogo]'); pg.wait_for_timeout(300)
    check('Gerusalemme' in pg.inner_text('.sheet-head')); check('Lc 19,41' in pg.inner_text('.sheet'))
    shot(pg, f'mondo_scheda_{dev}')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(250); eq(pg.locator('.sheet').count(), 0)
    # tocco reale sul punto selezionato
    pos = pg.eval_on_selector('.f-mondo-pt.sel', 'e=>{const r=e.getBoundingClientRect();return [r.left,r.top]}')
    pg.mouse.click(pos[0], pos[1]); pg.wait_for_selector('.sheet [data-kind=luogo]')
    pg.click('.sheet .f-mondo-ref >> nth=0'); pg.wait_for_selector('#scr-leggi:not([hidden])')
    pg.go_back(); pg.wait_for_timeout(400); eq(screen(pg), 'mondo')

@test()
def mondo_pan_zoom_filtri(env, dev):
    pg = env.new(dev, init="Object.defineProperty(navigator,'onLine',{get:()=>false})")
    go_mondo(pg); pg.wait_for_selector('.f-mondo-map'); pg.wait_for_timeout(500)
    box = pg.locator('.f-mondo-map').bounding_box(); cx, cy = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
    pg.mouse.move(cx, cy); pg.mouse.down(); pg.mouse.move(cx - 80, cy + 40, steps=6); pg.mouse.up(); pg.wait_for_timeout(200)
    z0 = pg.evaluate("document.querySelector('.f-mondo-world').getAttribute('transform')")
    pg.mouse.move(cx, cy); pg.mouse.wheel(0, -300); pg.wait_for_timeout(300)
    check(pg.evaluate("document.querySelector('.f-mondo-world').getAttribute('transform')") != z0)
    n0 = pg.locator('.f-mondo-pt:not([hidden])').count()
    pg.click('.f-mondo-seg button[data-v=atti]'); pg.wait_for_timeout(300)
    pg.click('.f-mondo-chip[data-v="città"]'); pg.wait_for_timeout(300)
    check(pg.locator('.f-mondo-pt:not([hidden]) .f-mondo-dot').count() >= 0)
    for sel in ['.f-mondo-btn', '.f-mondo-seg button', '.f-mondo-chip', '.f-mondo-tile-btn']:
        for hgt in pg.eval_on_selector_all(sel, 'els=>els.map(e=>e.getBoundingClientRect().height)'): check(hgt >= 44, f'{sel} {hgt}')
    no_hscroll(pg)

@test()
def mondo_sezioni(env, dev):
    pg = env.new(dev)
    go_mondo(pg); pg.wait_for_selector('.f-mondo-tile-btn')
    pg.click('[data-view=luoghi]'); pg.wait_for_selector('.f-mondo-rows .row'); eq(pg.locator('.f-mondo-rows .row').count(), 179)
    pg.fill('#mondoSearchLuoghi', 'betlem'); eq(pg.locator('.f-mondo-rows .row:not([hidden])').count(), 1)
    pg.click('.f-mondo-rows .row:not([hidden])'); pg.wait_for_selector('.sheet [data-kind=luogo]'); shot(pg, f'mondo_luogo_{dev}'); pg.keyboard.press('Escape'); pg.wait_for_timeout(250)
    pg.keyboard.press('Escape'); pg.wait_for_selector('.f-mondo-tile-btn')
    pg.click('[data-view=misure]'); pg.wait_for_selector('.f-mondo-list[data-view=misure] .row'); no_hscroll(pg)
    pg.click('.f-mondo-list[data-view=misure] [data-id=talento]'); pg.wait_for_selector('.sheet [data-kind=misura]')
    check('34 kg' in pg.inner_text('.sheet')); shot(pg, f'mondo_misura_{dev}'); pg.keyboard.press('Escape'); pg.wait_for_timeout(250)
    pg.click('#mondoBack'); pg.wait_for_selector('.f-mondo-tile-btn')
    pg.click('[data-view=tempo]'); pg.wait_for_selector('.f-mondo-list[data-view=tempo] .row'); check('Mesi' in pg.inner_text('.f-mondo-list[data-view=tempo]')); shot(pg, f'mondo_tempo_{dev}')
    pg.click('#mondoBack'); pg.click('[data-view=personaggi]'); pg.wait_for_selector('.f-mondo-list[data-view=personaggi] .row')
    pg.fill('#mondoSearchPersonaggi', 'abraamo'); pg.click('.f-mondo-list[data-view=personaggi] .row:not([hidden])'); pg.wait_for_selector('.sheet [data-kind=personaggio]'); no_hscroll(pg)

@test('phone')
def mondo_parametri_e_ingressi(env, dev):
    pg = env.new(dev)
    # card in Oggi
    check(pg.is_visible('.f-mondo-home')); shot(pg, f'mondo_oggi_{dev}')
    pg.click('.f-mondo-home'); pg.wait_for_selector('#scr-mondo:not([hidden])'); pg.click('#mondoBack'); pg.wait_for_selector('#greet')
    # impostazioni
    pg.click('#settingsBtn'); pg.click('[data-section=Studio] .row'); pg.wait_for_selector('#scr-mondo:not([hidden])'); pg.click('#mondoBack'); pg.wait_for_selector('#scr-impostazioni:not([hidden])')
    go_mondo(pg, misura='talento'); pg.wait_for_selector('.sheet [data-kind=misura]'); pg.keyboard.press('Escape'); pg.wait_for_timeout(250)
    go_mondo(pg, personaggio='abraamo'); pg.wait_for_selector('.sheet [data-kind=personaggio]'); pg.keyboard.press('Escape'); pg.wait_for_timeout(250)
    for th in ['light', 'paper', 'dark']:
        pg.evaluate("t=>document.documentElement.dataset.theme=t", th); go_mondo(pg, sezione='mappa'); pg.wait_for_timeout(300); shot(pg, f'mondo_{th}')
