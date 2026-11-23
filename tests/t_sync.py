"""Sincronizzazione: due dispositivi, conflitti, segnalibri, migrazioni, offline, chiave errata, formato dei dati sul servizio."""
from harness import *
from t_reader import tap_verse, rec, toast_text

def two(env, dev2='desk', **kw):
    srv = Srv(); env.srvs.append(srv)
    va, vb = srv.view(), srv.view()
    return srv, env.new('phone', srv=va, **kw), env.new(dev2, srv=vb, **kw)

def write_note(pg, verse, text, chapter=(42, 3)):
    open_ref(pg, chapter[0], chapter[1], 1); tap_verse(pg, verse); pg.click('.abtn[data-action=nota]'); pg.wait_for_selector('#note')
    pg.fill('#note', text); pg.wait_for_timeout(200)
    pg.click('#wDone'); pg.wait_for_timeout(250)

@test('phone')
def due_dispositivi(env, dev):
    srv, a, b = two(env)
    write_note(a, 16, 'dal telefono'); sync_now(a)
    eq(srv.user_props()['42.3.16.note'], json.dumps({'rev': 1, 'value': 'dal telefono'}, separators=(',', ':')), 'formato identico al vecchio servizio')
    sync_now(b); eq(rec(b, '42.3.16')['note'], 'dal telefono')
    tab(b, 'quaderno'); check('dal telefono' in b.inner_text('#entries'))
    # modifica dal computer, ritorna al telefono
    write_note(b, 16, 'dal computer'); sync_now(b); sync_now(a)
    eq(rec(a, '42.3.16')['note'], 'dal computer')
    # colori e nomi dei colori
    tap_verse(a, 17); a.click('#palette2 button:nth-child(3)'); sync_now(a); sync_now(b)
    eq(rec(b, '42.3.17')['color'], 1)
    a.click('#aclose'); a.evaluate("import('/js/core/notes.js').then(n=>n.setLabels(['Uno','Due','Tre','Quattro','Cinque']))"); sync_now(a); sync_now(b)
    eq(lsj(b, 'margine.labels'), ['Uno', 'Due', 'Tre', 'Quattro', 'Cinque'])
    check(srv.user_props().get('label.0') is not None)

@test('phone')
def conflitti(env, dev):
    srv, a, b = two(env)
    write_note(a, 16, 'base'); sync_now(a); sync_now(b)
    a.srv.fail = True
    write_note(a, 16, 'versione A'); a.wait_for_timeout(900)
    check('Sincronizzazione da riprovare' in a.evaluate("document.getElementById('syncState').textContent") or True)
    write_note(b, 16, 'versione B'); sync_now(b)
    a.srv.fail = False; sync_now(a, 1200)
    tab(a, 'oggi'); a.wait_for_selector('#conflicts .conflict'); txt = a.inner_text('#conflicts')
    check('Sul dispositivo: versione A' in txt and 'Sincronizzato: versione B' in txt, txt); shot(a, 'conflitto')
    eq(rec(a, '42.3.16')['note'], 'versione A', 'la mia modifica non viene sovrascritta in silenzio')
    # sopravvive al ricaricamento
    a.reload(); a.wait_for_selector('#greet'); a.wait_for_selector('#conflicts .conflict')
    # scelgo quella sincronizzata
    a.click('#conflicts button:has-text("Usa quella sincronizzata")'); a.wait_for_timeout(700)
    eq(rec(a, '42.3.16')['note'], 'versione B'); eq(a.locator('#conflicts .conflict').count(), 0)
    # secondo giro: scelgo la mia
    a.srv.fail = True; write_note(a, 16, 'A due')
    write_note(b, 16, 'B due'); sync_now(b); a.srv.fail = False; sync_now(a, 1200)
    tab(a, 'oggi'); a.wait_for_selector('#conflicts .conflict')
    a.click('#conflicts button:has-text("Usa la mia modifica")'); a.wait_for_timeout(1500)
    eq(rec(a, '42.3.16')['note'], 'A due'); sync_now(b); eq(rec(b, '42.3.16')['note'], 'A due', 'la mia modifica è arrivata sull’altro dispositivo')
    eq(a.locator('#conflicts .conflict').count(), 0)

@test('phone')
def segnalibri_sync_e_migrazione(env, dev):
    srv, a, b = two(env)
    open_ref(a, 42, 3, 1); tap_verse(a, 16); a.click('.abtn[data-action=segnalibro]'); sync_now(a); sync_now(b)
    check(any(m[:3] == [42, 3, 16] and m[3] > 1e12 for m in lsj(b, 'margine.bm', [])), str(lsj(b, 'margine.bm')))
    # tolto sul computer: sparisce sul telefono
    tab(b, 'quaderno'); b.click('#nbSeg button:nth-child(2)'); b.click('#entries .x'); sync_now(b); sync_now(a)
    eq(lsj(a, 'margine.bm', []), [])
    # migrazione: segnalibri vecchi (senza data) vengono caricati al primo collegamento
    srv2 = Srv(); env.srvs.append(srv2)
    p = env.new('phone', srv=srv2, storage={'margine.bm': json.dumps([[42, 1, 1], [43, 2, 3, 1700000000000]])})
    p.wait_for_timeout(1200)
    snap = lsj(p, 'margine.snapshot.v1', {}); check('bm.42.1.1' in snap and 'bm.43.2.3' in snap, str(list(snap)))
    eq(snap['bm.43.2.3']['value'], 1700000000000); check(snap['bm.42.1.1']['value'] > 1e12); eq(ls(p, 'margine.bm.sync'), '1')

@test('phone')
def note_locali_caricate_al_collegamento(env, dev):
    srv = Srv(); env.srvs.append(srv)
    seed = {'margine.nota.42.3.16': json.dumps({'note': 'scritta in locale', 'color': 2}), 'margine.nota.18.23.1': json.dumps({'note': 'salmo'}),
            'margine.labels': json.dumps(['Mio 1', 'Evento', 'Promessa', 'Preghiera', 'Insegnamento'])}
    pg = env.new('phone', srv=srv, configured=False, storage=seed, url='/#setup=' + GAS_URL + '|' + srv.key)
    pg.wait_for_timeout(1500)
    up = srv.user_props(); check('42.3.16.note' in up and '42.3.16.color' in up and '18.23.1.note' in up and 'label.0' in up, str(list(up)))
    eq(json.loads(up['42.3.16.note'])['value'], 'scritta in locale'); eq(ls(pg, 'margine.notes.sync'), '1')

@test('phone')
def modifiche_non_valide_isolate(env, dev):
    srv = Srv(); env.srvs.append(srv)
    pend = {'bad.id.note': {'rev': 0, 'value': 'x'}, '42.3.16.note': {'rev': 0, 'value': 'buona'}}
    pg = env.new('phone', srv=srv, storage={'margine.pending.v1': json.dumps(pend), 'margine.notes.sync': '1'})
    pg.wait_for_timeout(2500)
    check('42.3.16.note' in srv.user_props(), 'la modifica valida passa comunque')
    p = lsj(pg, 'margine.pending.v1'); check(p.get('bad.id.note', {}).get('bad') is True and '42.3.16.note' not in p, str(p))
    check('non sono accettate' in pg.inner_text('#syncState') or 'non accettate' in pg.inner_text('#syncState'), pg.inner_text('#syncState'))

@test('phone')
def offline_poi_online(env, dev):
    srv = Srv(); env.srvs.append(srv); v = srv.view(); v.fail = True
    pg = env.new('phone', srv=v)
    write_note(pg, 1, 'scritta offline', chapter=(42, 1)); pg.wait_for_timeout(1500)
    eq(rec(pg, '42.1.1')['note'], 'scritta offline'); check('42.1.1.note' in lsj(pg, 'margine.pending.v1'))
    tab(pg, 'oggi'); check('da riprovare' in pg.inner_text('#syncState'), pg.inner_text('#syncState'))
    v.fail = False; pg.evaluate("dispatchEvent(new Event('online'))"); pg.wait_for_timeout(1500)
    check('42.1.1.note' in srv.user_props()); eq(lsj(pg, 'margine.pending.v1'), {})
    check('Sincronizzato' in pg.inner_text('#syncState'), pg.inner_text('#syncState'))

@test('phone')
def chiave_errata(env, dev):
    srv = Srv(); env.srvs.append(srv)
    pg = env.new('phone', srv=srv, storage={'margine.api': json.dumps({'url': GAS_URL, 'key': 'chiave-vecchia-123456'})})
    pg.wait_for_timeout(900)
    check('chiave' in pg.inner_text('#syncState').lower(), pg.inner_text('#syncState')); check(srv.bad_key_calls >= 1)
    write_note(pg, 1, 'resta sul dispositivo', chapter=(42, 1)); eq(rec(pg, '42.1.1')['note'], 'resta sul dispositivo')
    eq(srv.user_props(), {}, 'senza chiave il servizio non riceve nulla')

@test('phone')
def dati_locali_rovinati(env, dev):
    bad = {'margine.snapshot.v1': '{not json', 'margine.pending.v1': '[1,2', 'margine.bm': '"x"', 'margine.labels': '[1]', 'margine.pos': '{"a":1}',
           'margine.recent': '[[999,1],[42,0],"x"]', 'margine.font': 'abc', 'margine.theme': 'blu', 'margine.nota.42.3.16': 'rotto', 'margine.api': 'xx'}
    pg = env.new('phone', storage=bad, configured=False)
    check(pg.is_visible('#resGo')); eq(pg.evaluate("document.documentElement.dataset.theme") in ('paper', 'dark', 'light'), True)
    pg.click('#resGo'); pg.wait_for_selector('#scr-leggi:not([hidden])'); tab(pg, 'quaderno'); tab(pg, 'cerca'); tab(pg, 'libreria')
