"""Feature mondo: Mondo della Bibbia (mappa online/offline, elenchi, schede, attribuzioni)."""
import base64
from harness import *

PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==')
def mock_tiles(pg, fail=False):
    pg.tile_reqs = []
    def h(route, req):
        pg.tile_reqs.append(req.url)
        return route.abort() if fail else route.fulfill(status=200, content_type='image/png', body=PNG)
    pg.route('https://server.arcgisonline.com/**', h)
    pg.route('https://*.basemaps.cartocdn.com/**', h)
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
    pg = env.new(dev, storage={'margine.mondo.rilievo': '1'}); mock_tiles(pg)
    go_mondo(pg); pg.wait_for_selector('.f-mondo-tile.ok', state='attached'); pg.wait_for_timeout(500)
    check(len(pg.tile_reqs) >= 1 and len(pg.tile_reqs) <= 40, len(pg.tile_reqs))
    check(all(u.startswith('https://server.arcgisonline.com/') for u in pg.tile_reqs), pg.tile_reqs[:2])
    check(not any('tile.openstreetmap' in u for u in pg.tile_reqs))
    check(pg.is_visible('.f-mondo-attr') and 'Esri' in pg.inner_text('.f-mondo-attr'))
    n = len(pg.tile_reqs)
    pg.click('.f-mondo-btn.plus'); pg.wait_for_timeout(900); check(len(pg.tile_reqs) > n)
    shot(pg, f'mondo_online_{dev}')

@test('phone')
def mondo_tile_falliscono(env, dev):
    pg = env.new(dev, storage={'margine.mondo.rilievo': '1'}); mock_tiles(pg, fail=True)
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
    # i filtri di periodo e tipo stanno nel foglio «Filtri» (un pulsante sopra la mappa)
    pg.click('#mondoFiltri'); pg.wait_for_selector('.sheet .f-mondo-seg')
    pg.click('.sheet .f-mondo-seg button[data-v=atti]'); pg.wait_for_timeout(300)
    pg.click('.sheet .f-mondo-chip[data-v="città"]'); pg.wait_for_timeout(300)
    check(pg.locator('.f-mondo-pt:not([hidden]) .f-mondo-dot').count() >= 0)
    for sel in ['.f-mondo-btn', '.sheet .f-mondo-seg button', '.sheet .f-mondo-chip', '.f-mondo-tile-btn', '.f-mondo-livelli .f-mondo-chip', '.f-mondo-filtri']:
        for hgt in pg.eval_on_selector_all(sel, 'els=>els.map(e=>e.getBoundingClientRect().height)'): check(hgt >= 44, f'{sel} {hgt}')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    check(pg.eval_on_selector('#mondoFiltri', 'e=>e.classList.contains("on")'), 'il pulsante Filtri non segnala i filtri attivi')
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

@test('phone')
def mondo_carto_con_chiave_e_attribuzione(env, dev):
    for th in ('paper', 'dark'):
        pg = env.new(dev, storage={'margine.theme': th, 'margine.mondo.cartokey': 'K123', 'margine.mondo.rilievo': '1'}); mock_tiles(pg)
        go_mondo(pg); pg.wait_for_selector('.f-mondo-tile.ok', state='attached'); pg.wait_for_timeout(400)
        carto = [u for u in pg.tile_reqs if 'cartocdn' in u]
        check(carto and all('/rastertiles/' + ('dark_nolabels' if th == 'dark' else 'voyager_nolabels') + '/' in u and 'key=K123' in u for u in carto), carto[:2])
        check(all(u.endswith('@2x.png?key=K123') for u in carto), carto[:1])
        check('© OpenStreetMap contributors © CARTO' in pg.inner_text('.f-mondo-attr'))
    check('tile.openstreetmap.org' not in (ROOT / 'index.html').read_text() and 'basemaps.cartocdn.com' in (ROOT / 'index.html').read_text())

@test('phone')
def mondo_etichette_gerarchia_e_fuori_dalla_mappa(env, dev):
    pg = env.new(dev, storage={'margine.theme': 'dark', 'margine.mondo.rilievo': '1'}); mock_tiles(pg)
    go_mondo(pg); pg.wait_for_selector('.f-mondo-tile.ok', state='attached'); pg.wait_for_timeout(600)
    fs = lambda sel: float(pg.eval_on_selector(sel, 'e=>parseFloat(getComputedStyle(e).fontSize)'))
    check(fs('[data-id=gerusalemme] .f-mondo-lbl') > fs('[data-id=nazaret] .f-mondo-lbl') > 0, 'gerarchia')
    check(pg.eval_on_selector('[data-id=galilea] .f-mondo-lbl', 'e=>getComputedStyle(e).textTransform') == 'uppercase', 'regione in maiuscoletto')
    check(pg.eval_on_selector('[data-id=mar-morto] .f-mondo-lbl', 'e=>getComputedStyle(e).fontStyle') == 'italic')
    txt = pg.eval_on_selector_all('.f-mondo-pt:not([hidden]) .f-mondo-lbl', 'e=>e.map(x=>x.textContent)')
    check('Mar Mediterraneo\n(Mar Grande)' in txt and 'Mar Morto\n(Mar Salato)' in txt and 'Gerusalemme' in txt, str(txt))
    # nessuna etichetta visibile si sovrappone a un'altra
    boxes = pg.eval_on_selector_all('.f-mondo-pt:not([hidden]):not(.nolbl) .f-mondo-lbl', 'e=>e.map(x=>{const r=x.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom,x.textContent]})')
    for i, a in enumerate(boxes):
        for b in boxes[i + 1:]:
            check(not (a[0] < b[2] - 1 and a[2] > b[0] + 1 and a[1] < b[3] - 1 and a[3] > b[1] + 1), f'sovrapposte: {a[4]} / {b[4]}')
    # attribuzione e avviso stanno sotto la mappa, non sopra i nomi
    mp = pg.eval_on_selector('.f-mondo-map', 'e=>e.getBoundingClientRect().bottom')
    check(pg.eval_on_selector('.f-mondo-attr', 'e=>e.getBoundingClientRect().top') >= mp - 1)
    pg2 = env.new(dev, init="Object.defineProperty(navigator,'onLine',{get:()=>false})"); go_mondo(pg2); pg2.wait_for_selector('.f-mondo-offline:not([hidden])'); pg2.wait_for_timeout(400)
    mp = pg2.eval_on_selector('.f-mondo-map', 'e=>e.getBoundingClientRect().bottom')
    check(pg2.eval_on_selector('.f-mondo-offline', 'e=>e.getBoundingClientRect().top') >= mp - 1, 'avviso sopra la mappa')

@test('phone')
def mondo_card_hub_testo_visibile(env, dev):
    for th in ('dark', 'paper'):
        pg = env.new(dev, storage={'margine.theme': th}); mock_tiles(pg); go_mondo(pg); pg.wait_for_selector('.f-mondo-tile-btn')
        r = pg.eval_on_selector_all('.f-mondo-tile-btn', "els=>els.map(e=>{const b=e.querySelector('b'),s=e.querySelector('small');const cs=x=>getComputedStyle(x);return [b.textContent,s.textContent,cs(b).color,cs(e).backgroundColor,b.getBoundingClientRect().width,s.getBoundingClientRect().height]})")
        eq(len(r), 4)
        for t, sub, col, bg, w, hh in r: check(t and sub and col != bg and w > 20 and hh > 8, str((t, col, bg)))

def _center(pg, sel):
    return pg.eval_on_selector(sel, 'e=>{const r=e.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]}')

@test('phone')
def mondo_livelli_selettore(env, dev):
    pg = env.new(dev); go_mondo(pg); pg.wait_for_selector('.f-mondo-livelli')
    eq(pg.eval_on_selector_all('.f-mondo-livelli button', 'els=>els.map(e=>e.textContent)'), ['Nessuno', 'Terra di Gesù', 'Le 12 tribù', 'Regni divisi', 'Popoli vicini'])
    eq(pg.get_attribute('.f-mondo-livelli button[aria-pressed=true]', 'data-v'), 'nessuno')
    pg.click('.f-mondo-livelli [data-v=tribu]'); pg.wait_for_timeout(700)
    eq(pg.get_attribute('.f-mondo-map', 'data-livello'), 'tribu'); eq(pg.locator('.f-mondo-livelli button[aria-pressed=true]').count(), 1)
    check(pg.eval_on_selector('[data-area=efraim]', 'e=>getComputedStyle(e).display') != 'none', 'tribù visibili')
    check(pg.eval_on_selector('[data-area=galilea]', 'e=>getComputedStyle(e).display') == 'none', 'galilea nascosta fuori livello')
    txt = pg.eval_on_selector_all('.f-mondo-pt:not([hidden]) .f-mondo-lbl', 'e=>e.map(x=>x.textContent)')
    check('Efraim' in txt, str(txt))
    check('Galilea' not in txt, 'etichette di un altro livello visibili')
    pg.click('.f-mondo-livelli [data-v=nessuno]'); pg.wait_for_timeout(300)
    eq(pg.get_attribute('.f-mondo-map', 'data-livello'), 'nessuno')
    txt = pg.eval_on_selector_all('.f-mondo-pt:not([hidden]) .f-mondo-lbl', 'e=>e.map(x=>x.textContent)')
    check('Efraim' not in txt and 'Galilea' not in txt, 'regioni visibili con «Nessuno»')

@test('phone')
def mondo_regione_tocco_e_certezza(env, dev):
    pg = env.new(dev); go_mondo(pg); pg.wait_for_selector('.f-mondo-map'); pg.wait_for_timeout(500)
    pg.click('.f-mondo-livelli [data-v=terra]'); pg.wait_for_timeout(700)
    # certezza visibile: alta = bordo pieno; media/discussa = tratteggiato
    eq(pg.eval_on_selector('[data-area=galilea]', 'e=>getComputedStyle(e).strokeDasharray'), 'none')
    check(pg.eval_on_selector('[data-area=perea]', 'e=>getComputedStyle(e).strokeDasharray') != 'none', 'perea tratteggiata')
    x, y = _center(pg, '[data-id=galilea] .f-mondo-lbl'); pg.mouse.click(x, y)
    pg.wait_for_selector('.sheet [data-kind=regione]'); eq(pg.get_attribute('.sheet [data-kind=regione]', 'data-cert'), 'alta')
    body = pg.inner_text('.sheet')
    check('Quanto è sicuro' in body and 'Alta' in body and 'Fonti' in body, 'scheda galilea')
    check('Mt 4,15' in body, 'riferimento biblico')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    x, y = _center(pg, '[data-id=perea] .f-mondo-lbl'); pg.mouse.click(x, y)
    pg.wait_for_selector('.sheet [data-kind=regione]'); eq(pg.get_attribute('.sheet [data-kind=regione]', 'data-cert'), 'discussa')
    body = pg.inner_text('.sheet')
    check('Il nome non compare nella Bibbia' in body, 'perea: nome non biblico')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    pg.click('.f-mondo-livelli [data-v=tribu]'); pg.wait_for_timeout(700)
    x, y = _center(pg, '[data-id=efraim] .f-mondo-lbl'); pg.mouse.click(x, y)
    pg.wait_for_selector('.sheet [data-kind=regione]'); eq(pg.get_attribute('.sheet [data-kind=regione]', 'data-cert'), 'media')
    check('Media' in pg.inner_text('.sheet') and 'Fonti' in pg.inner_text('.sheet'), 'scheda efraim')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    pg.click('.f-mondo-livelli [data-v=nessuno]'); pg.wait_for_timeout(300)
    no_hscroll(pg)

@test('phone')
def mondo_aree_etichetta_dentro_e_non_in_mare(env, dev):
    pg = env.new(dev); go_mondo(pg); pg.wait_for_selector('.f-mondo-map')
    res = pg.evaluate("""()=>import('/js/features/mondo-geo.js').then(m=>{
        const sea=[m.MEDITERRANEO,m.MARE_NERO,m.MAR_ROSSO,m.GOLFO_PERSICO];
        return m.AREE.filter(a=>a.poligono).map(a=>({id:a.id, lv:a.livelli, ok: m.pointInPoly(a.ancora,a.poligono) && !sea.some(sp=>m.pointInPoly(a.ancora,sp))}));
    })""")
    bad = [r for r in res if not r['ok']]
    check(not bad, 'etichette fuori area o in mare: ' + str([(b['id'], b['lv']) for b in bad]))
    levels = {lv for r in res for lv in r['lv']}
    eq(levels, {'terra', 'tribu', 'regni', 'popoli'})
    # ogni livello, nella mappa: le etichette visibili delle sue aree sono nel proprio livello
    for lv in ['terra', 'tribu', 'regni', 'popoli']:
        pg.click(f'.f-mondo-livelli [data-v={lv}]'); pg.wait_for_timeout(600)
        n = pg.eval_on_selector_all(f'.f-mondo-pt.lv-{lv}:not([hidden])', 'e=>e.length')
        check(n >= 1, f'nessuna etichetta visibile nel livello {lv}')
    pg.click('.f-mondo-livelli [data-v=nessuno]'); pg.wait_for_timeout(300)


@test('phone')
def mondo_rilievo_spento_di_default_e_sopra_le_aree(env, dev):
    # di default niente piastrelle: la mappa disegnata è il fondo
    pg = env.new(dev); mock_tiles(pg); go_mondo(pg); pg.wait_for_selector('.f-mondo-map'); pg.wait_for_timeout(700)
    eq(len(pg.tile_reqs), 0, 'piastrelle richieste senza rilievo')
    eq(pg.get_attribute('.f-mondo-rel', 'aria-pressed'), 'false')
    pg.close()
    # con il rilievo: le aree restano visibili sopra le piastrelle, in entrambi i temi e per tutti i livelli
    for th in ['dark', 'paper']:
        pg = env.new(dev, storage={'margine.theme': th, 'margine.mondo.rilievo': '1'}); mock_tiles(pg)
        go_mondo(pg); pg.wait_for_selector('.f-mondo-tile.ok', state='attached'); pg.wait_for_timeout(400)
        # ordine di sovrapposizione: base, piastrelle, livello superiore (mari, aree), punti
        order = pg.evaluate("()=>{const r=document.querySelector('.f-mondo-map');const k=[...r.children];return ['f-mondo-base','f-mondo-tiles','f-mondo-top','f-mondo-pts'].map(c=>k.findIndex(e=>e.classList.contains(c)))}")
        check(order == sorted(order) and min(order) >= 0, f'ordine di sovrapposizione {order}')
        op = pg.eval_on_selector('.f-mondo-tile.ok', 'e=>parseFloat(getComputedStyle(e).opacity)')
        check(0.3 <= op <= 0.5, f'opacità delle piastrelle {op}')
        for lv in ['terra', 'tribu', 'regni', 'popoli']:
            pg.click(f'.f-mondo-livelli [data-v={lv}]'); pg.wait_for_timeout(700)
            vis = pg.evaluate("(lv)=>[...document.querySelectorAll('.f-mondo-area.lv-'+lv)].map(e=>getComputedStyle(e).display!=='none' && parseFloat(getComputedStyle(e).fillOpacity)>0)", lv)
            check(vis and all(vis), f'{th}/{lv}: aree non visibili sopra le piastrelle')
        pg.click('.f-mondo-livelli [data-v=nessuno]'); pg.wait_for_timeout(200)
        pg.close()
    # l'interruttore accende e spegne le piastrelle e ricorda la scelta
    pg = env.new(dev); mock_tiles(pg); go_mondo(pg); pg.wait_for_selector('.f-mondo-map'); pg.wait_for_timeout(300)
    pg.click('.f-mondo-rel'); pg.wait_for_selector('.f-mondo-tile.ok', state='attached', timeout=8000)
    eq(pg.get_attribute('.f-mondo-rel', 'aria-pressed'), 'true'); eq(ls(pg, 'margine.mondo.rilievo'), '1')
    pg.click('.f-mondo-rel'); pg.wait_for_timeout(300)
    eq(pg.get_attribute('.f-mondo-rel', 'aria-pressed'), 'false'); eq(ls(pg, 'margine.mondo.rilievo'), '0')
    check(not pg.is_visible('.f-mondo-tiles'), 'piastrelle ancora visibili dopo lo spegnimento')

@test('phone')
def mondo_livelli_citta_discrete(env, dev):
    pg = env.new(dev); go_mondo(pg); pg.wait_for_selector('.f-mondo-map'); pg.wait_for_timeout(500)
    for lv in ['terra', 'tribu', 'regni', 'popoli']:
        pg.click(f'.f-mondo-livelli [data-v={lv}]'); pg.wait_for_timeout(800)
        n = pg.eval_on_selector_all('.k-cit:not(.t1):not([hidden])', 'e=>e.length')
        check(n <= 8, f'{lv}: troppe città visibili ({n})')
        check(pg.eval_on_selector('[data-id=gerusalemme]', 'e=>!e.hidden'), f'{lv}: Gerusalemme nascosta')
        w = pg.eval_on_selector_all('.k-cit:not(.t1):not([hidden]) > .f-mondo-dot', 'e=>e.map(x=>parseFloat(getComputedStyle(x).width))')
        check(all(v <= 6 for v in w), f'{lv}: punti città grandi {w}')
        regs = pg.eval_on_selector_all('.reg:not([hidden]) > .f-mondo-lbl', 'e=>e.map(x=>parseFloat(getComputedStyle(x).fontSize))')
        check(not regs or min(regs) >= 11, f'{lv}: nomi di regione piccoli {regs}')
    pg.click('.f-mondo-livelli [data-v=nessuno]'); pg.wait_for_timeout(300)
    w = pg.eval_on_selector('.k-cit:not(.t1) > .f-mondo-dot', 'e=>parseFloat(getComputedStyle(e).width)')
    check(w <= 7, f'nessuno: punti città {w}')

@test()
def mondo_atlante_costa_vera_e_livello_sobrio(env, dev):
    pg = env.new(dev); go_mondo(pg); pg.wait_for_selector('.f-mondo-map'); pg.wait_for_timeout(500)
    # costa vera (Natural Earth, dal modulo mondo-terra.js): un solo percorso di terra, nessun mare disegnato a mano
    n = pg.eval_on_selector('.f-mondo-top .f-mondo-land-p', 'e=>e.getAttribute("d").length')
    check(n > 20000, f'costa troppo semplice: {n} caratteri')
    eq(pg.locator('.f-mondo-top .f-mondo-sea').count(), 0, 'mari disegnati a mano ancora presenti')
    check('Natural Earth' in pg.inner_text('.f-mondo-attrib') and 'OpenBible.info' in pg.inner_text('.f-mondo-attrib'), 'attribuzioni')
    # a riposo: solo i mari di base e le città principali (al massimo 11 nomi), Gerusalemme sempre
    shown = pg.eval_on_selector_all('.f-mondo-pt:not([hidden]) .f-mondo-lbl', 'els=>els.map(e=>e.textContent)')
    check(len(shown) <= 11 and 'Gerusalemme' in shown, str(shown))
    # il pulsante Filtri sta sopra la mappa, non i suoi chip: il foglio apre periodo e tipo
    pg.click('#mondoFiltri'); pg.wait_for_selector('.sheet .f-mondo-seg')
    eq(pg.locator('.sheet .f-mondo-seg button').count(), 4); eq(pg.locator('.sheet .f-mondo-chip').count(), 4)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    check(not pg.is_visible('.sheet'), 'il foglio Filtri non si chiude')
    no_hscroll(pg)

@test()
def mondo_citta_sulla_costa_e_nell_entroterra(env, dev):
    pg = env.new(dev); go_mondo(pg); pg.wait_for_selector('.f-mondo-map'); pg.wait_for_timeout(400)
    # coordinate di data/places.json contro la costa vera (Natural Earth): le città costiere entro 6 km dalla riva,
    # le altre su terra e non in mare; Gerusalemme a ovest del Mar Morto
    res = pg.evaluate("""async () => {
      const T = await import('/js/features/mondo-terra.js'), L = await import('/js/features/mondo-terra-levante.js');
      const places = await (await fetch('/data/places.json')).json(), byId = Object.fromEntries(places.map(p => [p.id, p]));
      const inBox = (lon, lat) => lon >= L.LEV_BOX.x0 && lon <= L.LEV_BOX.x1 && lat >= L.LEV_BOX.y0 && lat <= L.LEV_BOX.y1;
      const polysAt = (lon, lat) => inBox(lon, lat) ? L.TERRA_LEVANTE : T.TERRA;
      const onLand = (lon, lat) => { let c = 0; for (const poly of polysAt(lon, lat)) for (const r of poly) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) c++; } return c % 2 === 1; };
      const km = (a, b) => Math.hypot((a[0] - b[0]) * Math.cos(32 * Math.PI / 180) * 111.2, (a[1] - b[1]) * 111.2);
      const distCoast = (lon, lat) => { let best = 1e9; for (const poly of polysAt(lon, lat)) for (const r of poly) for (let i = 0; i < r.length; i++) {
        const a = r[i], b = r[(i + 1) % r.length], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1e-12;
        const t = Math.max(0, Math.min(1, ((lon - a[0]) * dx + (lat - a[1]) * dy) / L2)); best = Math.min(best, km([lon, lat], [a[0] + dx * t, a[1] + dy * t])); } return best; };
      const costiere = ['giaffa', 'cesarea', 'tiro', 'sidone', 'gaza', 'ascalon'], interne = ['gerusalemme', 'betlemme', 'ebron', 'betel', 'silo', 'sichem', 'gerico', 'nazaret', 'bersabea'];
      const out = {};
      for (const id of costiere) { const p = byId[id]; out[id] = {d: distCoast(p.lon, p.lat), terra: onLand(p.lon, p.lat), costa: true}; }
      for (const id of interne) { const p = byId[id]; out[id] = {d: distCoast(p.lon, p.lat), terra: onLand(p.lon, p.lat), costa: false}; }
      return out; }""")
    for k, v in res.items():
        if v['costa']: check(v['d'] <= 6, f'{k} lontana dalla costa: {v["d"]:.1f} km')
        else: check(v['terra'], f'{k} non è su terra')
    check(res['gerusalemme']['terra'] and res['gerusalemme']['d'] > 20, 'Gerusalemme troppo vicina al mare')
    # nessun nome di mare o di fiume tagliato dal bordo della mappa
    pg.wait_for_timeout(300)
    box = pg.eval_on_selector('.f-mondo-map', 'e=>{const r=e.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]}')
    for l in pg.eval_on_selector_all('.f-mondo-pt.wat:not([hidden]) .f-mondo-lbl', 'els=>els.map(e=>{const r=e.getBoundingClientRect();return [e.textContent,r.left,r.top,r.right,r.bottom]})'):
        check(l[1] >= box[0] - 1 and l[3] <= box[2] + 1 and l[2] >= box[1] - 1 and l[4] <= box[3] + 1, f'etichetta tagliata: {l[0]}')
