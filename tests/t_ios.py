"""Campi di testo senza riempimento automatico di Safari; passi lunghi accorciati nel Quaderno, in Cerca, in Oggi e nell'editor della nota."""
from harness import *
from t_parole import fixture

LONG = {n: ('Così parla il Signore degli eserciti: considerate bene la vostra condotta, voi che abitate in case rivestite di legno mentre questa casa è in rovina. ' * 1 + str(n)) for n in range(1, 13)}
NOTE = 'Una meditazione molto lunga. ' * 40


def long_page(env, dev):
    srv = Srv(); env.srvs.append(srv); fixture(srv, 'Aggeo', 1, LONG)
    st = {'margine.nota.36.1.4.11': json.dumps({'note': NOTE, 'color': 1, 't': '2026-11-20T10:00:00Z'}), 'margine.lastmed': '36.1.4.11'}
    pg = env.new(dev, srv=srv, storage=st)
    open_ref(pg, 36, 1, 4); pg.wait_for_selector('#v4'); pg.wait_for_timeout(300)
    return pg


def attrs(pg, sel): return pg.evaluate("s=>{const e=document.querySelector(s);return e&&{ac:e.getAttribute('autocomplete'),name:e.getAttribute('name'),ft:e.getAttribute('data-form-type'),ph:e.placeholder||'',cap:e.getAttribute('autocapitalize'),corr:e.getAttribute('autocorrect'),sp:e.getAttribute('spellcheck')}}", sel)


def lines(pg, sel): return pg.evaluate("s=>{const e=document.querySelector(s);const lh=parseFloat(getComputedStyle(e).lineHeight);return Math.round(e.getBoundingClientRect().height/lh)}", sel)


@test()
def campi_senza_autofill(env, dev):
    pg = env.new(dev)
    bad = ('nome', 'name', 'address', 'indirizzo', 'email', 'tel', 'phone', 'contact', 'contatt')
    def ok(sel, note=False):
        a = attrs(pg, sel); check(a, 'manca ' + sel)
        eq(a['ac'], 'off', sel); eq(a['ft'], 'other', sel); check(a['name'] and not any(b in a['name'].lower() for b in bad), f'{sel} name={a["name"]}')
        if note: eq((a['cap'], a['corr'], a['sp']), ('sentences', 'on', 'true'), sel)
        else: eq(a['corr'], 'off', sel)
    tab(pg, 'libreria'); ok('#goto')
    tab(pg, 'cerca'); ok('#word')
    tab(pg, 'quaderno'); ok('#nbSearch')
    pg.evaluate("import('/js/core/router.js').then(r=>r.go('collega'))"); pg.wait_for_selector('#cfgUrl'); ok('#cfgUrl'); ok('#cfgKey')
    pg.evaluate("import('/js/core/router.js').then(r=>r.go('impostazioni'))"); pg.wait_for_timeout(200)
    pg.click('.row:has-text("Nomi dei colori")'); pg.wait_for_selector('.colors-form')
    check(pg.locator('.colors-form input').count() == 5)
    for i in range(5): ok(f'.colors-form label:nth-of-type({i+1}) input')
    pg.evaluate("import('/js/core/router.js').then(r=>r.go('nota',{id:'free.x',from:'oggi'}))"); pg.wait_for_selector('#note'); ok('#note', True)
    check(pg.locator('#note').evaluate("e=>!e.closest('form')"), 'la nota non sta in un form')


@test()
def passi_lunghi_accorciati(env, dev):
    pg = long_page(env, dev)
    # editor: passo a 3 righe, «Mostra tutto» / «Mostra meno», spazio per scrivere in vista
    pg.evaluate("import('/js/core/router.js').then(r=>r.go('nota',{id:'36.1.4.11',from:'quaderno'}))"); pg.wait_for_selector('#note'); pg.wait_for_timeout(300)
    eq(lines(pg, '#wText'), 3, 'passo su 3 righe'); check(pg.is_visible('#wMore')); check('tutto' in pg.inner_text('#wMore'))
    check(pg.evaluate("document.getElementById('note').getBoundingClientRect().top < innerHeight - 120"), 'la textarea è subito visibile')
    pg.click('#wMore'); check(lines(pg, '#wText') > 3); check('meno' in pg.inner_text('#wMore'))
    pg.click('#wMore'); eq(lines(pg, '#wText'), 3)
    shot(pg, f'nota_passo_lungo_{dev}')
    # Quaderno: passo 2 righe, meditazione 4 righe
    pg.click('#wDone'); pg.wait_for_timeout(300); tab(pg, 'quaderno'); pg.wait_for_selector('.scr:not([hidden]) .ent-quote')
    eq(lines(pg, '.scr:not([hidden]) .ent-quote'), 2, 'passo su 2 righe'); eq(lines(pg, '.scr:not([hidden]) .ent-note'), 4, 'nota su 4 righe')
    shot(pg, f'quaderno_passo_lungo_{dev}')
    pg.click('.ent >> nth=0'); pg.wait_for_selector('#note'); check(pg.input_value('#note').startswith('Una meditazione'))
    # Cerca → Le mie note
    pg.click('#wDone'); tab(pg, 'cerca'); pg.click('#srTabNotes') if pg.locator('#srTabNotes').count() else pg.click('text=Le mie note')
    pg.fill('#word', 'meditazione'); pg.press('#word', 'Enter'); pg.wait_for_timeout(400)   # in Cerca le righe non mostrano il passo, solo la meditazione
    eq(lines(pg, '.scr:not([hidden]) .ent-note'), 4)
    # Oggi: Ultima meditazione
    tab(pg, 'oggi'); pg.wait_for_selector('#scr-oggi .card.med p'); check(lines(pg, '#scr-oggi .card.med p') <= 4, 'Ultima meditazione al massimo 4 righe')
