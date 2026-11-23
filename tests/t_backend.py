"""Backend: il VERO backend/Code.gs eseguito in Node con finti servizi Apps Script (nessun browser)."""
from harness import *

def fresh():
    h = Host(); return h
def post(h, key, method, data=None, raw=None):
    body = raw if raw is not None else json.dumps({'key': key, 'method': method, 'data': data})
    r = h.call(cmd='post', body=body); return json.loads(r['text']), r['mime']

@test('phone')
def chiave_e_log(env, dev):
    h = fresh()
    try:
        k = h.call(cmd='run', fn='setupKey')['ret']
        check(re.fullmatch(r'[0-9a-f-]{36}', k), k)
        logs = h.call(cmd='logs')['logs']; check(any('CHIAVE: ' + k in l for l in logs)); check(any('#setup=https://script.google.com/macros/s/TESTDEPLOY/exec|' + k in l for l in logs))
        eq(h.call(cmd='run', fn='setupKey')['ret'], k, 'la seconda esecuzione non cambia la chiave'); check(any('esiste già' in l for l in h.call(cmd='logs')['logs']))
        k2 = h.call(cmd='run', fn='resetKey')['ret']; check(k2 != k)
        r, _ = post(h, k, 'ping'); eq(r['code'], 'auth'); r, _ = post(h, k2, 'ping'); eq(r, {'ok': True, 'data': {'pong': True}})
        check(h.call(cmd='protocolIdentical')['same'], 'protocol.js incluso senza modifiche')
    finally: h.close()

@test('phone')
def autenticazione(env, dev):
    h = fresh()
    try:
        r, _ = post(h, 'x', 'ping'); eq(r['code'], 'setup', 'senza chiave impostata il servizio lo dice'); check('setupKey' in r['error'])
        h.call(cmd='setProp', scope='script', k='MARGINE_KEY', v=KEY)
        for bad in ['', 'x', KEY[:-1], KEY + 'x', KEY.upper(), None, 5, [KEY], {'a': 1}]:
            r, mime = post(h, bad, 'ping'); eq((r['ok'], r['code']), (False, 'auth'), repr(bad)); eq(mime, 'application/json')
        r, _ = post(h, None, 'ping', raw=json.dumps({'method': 'ping'})); eq(r['code'], 'auth', 'chiave assente')
        # dati di nessun tipo senza chiave
        r, _ = post(h, 'x', 'sync', [{'id': '42.3.16.note', 'rev': 0, 'value': 'segreto'}]); eq(r['code'], 'auth'); eq(h.call(cmd='props')['user'], {})
        r, _ = post(h, 'x', 'chapter', 'Giovanni 3'); eq(r['code'], 'auth'); eq(h.call(cmd='fetched')['urls'], [], 'nessuna richiesta esterna senza chiave')
        r, _ = post(h, 'x', 'wordSearch', {'term': 'a', 'start': 1}); eq(r['code'], 'auth')
        # richieste malformate
        for raw in ['', 'non json', '[]', 'null', '5', '"x"', '{', 'x' * 1600000]:
            r, _ = post(h, None, None, raw=raw); eq((r['ok'], r['code']), (False, 'invalid'), raw[:20])
        r, _ = post(h, KEY, 'cancellaTutto'); eq(r['code'], 'invalid'); r, _ = post(h, KEY, None); eq(r['code'], 'invalid')
        # il confronto non si ferma al primo carattere diverso: stesso lavoro per ogni lunghezza
        src = h.call(cmd='run', fn='safeEqual_', args=['abc', 'abc'])['ret']; eq(src, True)
        for a, b, exp in [('abc', 'abd', False), ('abc', 'abcd', False), ('', '', True), ('è', 'è', True), ('a', 'b', False)]: eq(h.call(cmd='run', fn='safeEqual_', args=[a, b])['ret'], exp, f'{a!r}/{b!r}')
        code = open(ROOT / 'backend' / 'Code.gs', encoding='utf-8').read()
        check('keyOk_(req.key)' in code and not re.search(r'(key|stored)\s*===?\s*(stored|key)', code.split('function keyOk_')[1].split('function codeError_')[0]), 'niente confronto diretto della chiave')
    finally: h.close()

@test('phone')
def sync_e_formato(env, dev):
    h = fresh(); h.call(cmd='setProp', scope='script', k='MARGINE_KEY', v=KEY)
    try:
        r, _ = post(h, KEY, 'sync', [{'id': '42.3.16.note', 'rev': 0, 'value': 'ciao'}, {'id': '42.3.16.color', 'rev': 0, 'value': 2}, {'id': 'label.1', 'rev': 0, 'value': 'Verde'}, {'id': 'bm.42.3.16', 'rev': 0, 'value': 1700000000000}])
        check(r['ok'] and not r['data']['conflicts'], str(r)); eq(r['data']['state']['42.3.16.note'], {'rev': 1, 'value': 'ciao'})
        u = h.call(cmd='props')['user']; eq(u['42.3.16.note'], '{"rev":1,"value":"ciao"}', 'stesso formato del vecchio servizio'); eq(set(u), {'42.3.16.note', '42.3.16.color', 'label.1', 'bm.42.3.16'})
        # conflitto: revisione vecchia
        r, _ = post(h, KEY, 'sync', [{'id': '42.3.16.note', 'rev': 0, 'value': 'altro'}]); eq(r['data']['conflicts'], {'42.3.16.note': True}); eq(r['data']['state']['42.3.16.note']['value'], 'ciao')
        eq(json.loads(h.call(cmd='props')['user']['42.3.16.note'])['value'], 'ciao', 'il conflitto non scrive')
        # rev giusta, stesso valore, valore nullo
        r, _ = post(h, KEY, 'sync', [{'id': '42.3.16.note', 'rev': 1, 'value': 'nuovo'}, {'id': '42.3.16.color', 'rev': 1, 'value': None}]); eq(r['data']['state']['42.3.16.note']['rev'], 2); eq(r['data']['state']['42.3.16.color'], {'rev': 2, 'value': None})
        r, _ = post(h, KEY, 'sync', []); check(len(r['data']['state']) == 4, 'una sincronizzazione vuota restituisce tutto')
        # valori non validi: l'intera richiesta è rifiutata e nulla viene scritto
        before = h.call(cmd='props')['user']
        for bad in [[{'id': 'x', 'rev': 0, 'value': 'a'}], [{'id': '42.3.16.note', 'rev': 0, 'value': 5}], [{'id': '42.3.16.color', 'rev': 5, 'value': 9}], [{'id': '99.1.1.note', 'rev': 0, 'value': 'a'}],
                    [{'id': 'label.7', 'rev': 0, 'value': 'a'}], [{'id': 'label.0', 'rev': 0, 'value': ''}], [{'id': '42.3.16.note', 'rev': -1, 'value': 'a'}], [{'id': '42.3.16.note', 'rev': 1.5, 'value': 'a'}],
                    [{'id': '42.3.16.note', 'rev': 0, 'value': 'a' * 9000}], [{'id': 'bm.42.3.16', 'rev': 0, 'value': -5}], 'no', {'a': 1}, [None], [{'id': '__proto__', 'rev': 0, 'value': 'a'}], [{'id': '1.1.1.note', 'rev': 0, 'value': 'a'}] * 101]:
            r, _ = post(h, KEY, 'sync', bad); eq((r['ok'], r['code']), (False, 'invalid'), str(bad)[:60])
        eq(h.call(cmd='props')['user'], before, 'nulla scritto dopo richieste non valide')
        # meditazioni libere e su più versetti
        fid = '11111111-2222-4333-8444-555555555555'
        r, _ = post(h, KEY, 'sync', [{'id': f'free.{fid}.note', 'rev': 0, 'value': 'libera'}, {'id': f'42.3.16.18.{fid}.note', 'rev': 0, 'value': 'intervallo'}]); check(r['ok'], str(r))
        # note con accenti e lunghezza al limite in byte
        r, _ = post(h, KEY, 'sync', [{'id': '1.1.1.note', 'rev': 0, 'value': 'è' * 3900}]); check(r['ok']); r, _ = post(h, KEY, 'sync', [{'id': '1.1.2.note', 'rev': 0, 'value': 'è' * 4100}]); eq(r['code'], 'invalid')
    finally: h.close()

@test('phone')
def capitolo_e_ricerca(env, dev):
    h = fresh(); h.call(cmd='setProp', scope='script', k='MARGINE_KEY', v=KEY)
    try:
        r, _ = post(h, KEY, 'chapter', 'Giovanni 3'); check(r['ok'] and 'Giovanni 3 versetto 30' in r['data'], str(r)[:100])
        check('laparola.net/js.php' in h.call(cmd='fetched')['urls'][-1])
        for bad in ['', '../x', 'Giovanni 3; drop', 'http://evil', 5, None, 'G' * 60]:
            r, _ = post(h, KEY, 'chapter', bad); eq((r['ok'], r['code']), (False, 'invalid'), repr(bad))
        n = len(h.call(cmd='fetched')['urls']); check(n == 1, 'solo la richiesta valida è uscita')
        r, _ = post(h, KEY, 'wordSearch', {'term': 'luce', 'start': 1}); check(r['ok'] and 'luce' in r['data'])
        for bad in [{'term': '', 'start': 1}, {'term': 'a', 'start': 0}, {'term': 'a', 'start': 1.5}, {'term': 'a' * 101, 'start': 1}, 'luce', None, {'term': 5, 'start': 1}, {'term': 'a', 'start': 50000}]:
            r, _ = post(h, KEY, 'wordSearch', bad); eq((r['ok'], r['code']), (False, 'invalid'), repr(bad))
        h.call(cmd='fetchFail', on=True); r, _ = post(h, KEY, 'chapter', 'Giovanni 3'); eq((r['ok'], r['code']), (False, 'server')); check('rete' in r['error'])
    finally: h.close()

@test('phone')
def vecchie_funzioni_e_pagina(env, dev):
    h = fresh(); h.call(cmd='setProp', scope='script', k='MARGINE_KEY', v=KEY)
    try:
        for fn, args in [('chapter', ['Giovanni 3']), ('sync', [[]]), ('wordSearch', [{'term': 'a', 'start': 1}])]:
            r = h.call(cmd='run', fn=fn, args=args); check('error' in r and 'Non autorizzato' in r['error'] or fn == 'sync' and False or 'Non autorizzato' in str(r), f'{fn} senza chiave e senza proprietario: {r}')
            r = h.call(cmd='run', fn=fn, args=args + ['sbagliata']); check('Non autorizzato' in str(r), fn)
            r = h.call(cmd='run', fn=fn, args=args + [KEY]); check('error' not in r, f'{fn} con la chiave: {r}')
        # pagina di cortesia
        g = h.call(cmd='get')['html']; check('apri l’app' in g and 'A margine' in g)
        check(not re.search(r'<script|42\.|rev|MARGINE_KEY|' + KEY, g), 'la pagina non contiene dati')
        h.call(cmd='setProp', scope='user', k='42.3.16.note', v='{"rev":1,"value":"segreto"}'); check('segreto' not in h.call(cmd='get')['html'])
        h.call(cmd='setProp', scope='script', k='MARGINE_APP_URL', v='https://utente.github.io/a-margine/'); check('href="https://utente.github.io/a-margine/"' in h.call(cmd='get')['html'])
        h.call(cmd='setProp', scope='script', k='MARGINE_APP_URL', v='javascript:alert(1)'); check('javascript' not in h.call(cmd='get')['html'], 'indirizzo non https ignorato')
        m = json.loads((ROOT / 'backend' / 'appsscript.json').read_text()); eq(m['webapp']['executeAs'], 'USER_DEPLOYING'); eq(m['webapp']['access'], 'ANYONE_ANONYMOUS')
    finally: h.close()

@test('phone')
def dati_legacy_restano_validi(env, dev):
    """Un archivio scritto dal vecchio servizio (stesso formato) si legge e si aggiorna senza migrazioni."""
    h = fresh(); h.call(cmd='setProp', scope='script', k='MARGINE_KEY', v=KEY)
    try:
        for k, v in {'42.3.16.note': '{"rev":3,"value":"vecchia"}', '42.3.16.color': '{"rev":1,"value":0}', 'label.0': '{"rev":1,"value":"Bontà"}', 'bm.42.3.16': '{"rev":2,"value":1700000000000}', 'spazzatura': 'non json'}.items(): h.call(cmd='setProp', scope='user', k=k, v=v)
        r, _ = post(h, KEY, 'sync', []); st = r['data']['state']; eq(st['42.3.16.note'], {'rev': 3, 'value': 'vecchia'}); check('spazzatura' not in st, 'le voci illeggibili sono ignorate')
        r, _ = post(h, KEY, 'sync', [{'id': '42.3.16.note', 'rev': 3, 'value': 'aggiornata'}]); eq(r['data']['state']['42.3.16.note']['rev'], 4)
        eq(h.call(cmd='props')['user']['spazzatura'], 'non json', 'non toccata')
    finally: h.close()
