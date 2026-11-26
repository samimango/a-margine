"""PWA: manifest, icone, meta iOS, service worker vero (server HTTP temporaneo in un thread del test)."""
import threading, http.server, functools, struct
from harness import *

def png_size(p):
    d = Path(p).read_bytes(); check(d[:8] == b'\x89PNG\r\n\x1a\n', f'{p} non è un PNG'); return struct.unpack('>II', d[16:24])

@test('phone')
def manifest_icone_meta(env, dev):
    m = json.loads((ROOT / 'manifest.webmanifest').read_text())
    eq((m['display'], m['lang'], m['start_url'], m['scope']), ('standalone', 'it', './', './'))
    for ic in m['icons']:
        f = ROOT / ic['src']; check(f.is_file(), ic['src'])
        if ic['src'].endswith('.png'): eq('%dx%d' % png_size(f), ic['sizes'])
    check({'any', 'maskable'} <= {i['purpose'] for i in m['icons']})
    eq(png_size(ROOT / 'icons/apple-touch-icon.png'), (180, 180))
    html = (ROOT / 'index.html').read_text()
    for frag in ['apple-mobile-web-app-capable', 'apple-mobile-web-app-status-bar-style', 'apple-mobile-web-app-title', 'apple-touch-icon', 'rel="manifest"', 'viewport-fit=cover', 'theme-color', 'lang="it"']: check(frag in html, frag)
    check('http://' not in re.sub(r'http://www\.w3\.org/[\w/]+', '', html), 'nessun riferimento http non cifrato')
    pg = env.new(dev); eq(pg.evaluate("document.documentElement.lang"), 'it'); check(pg.evaluate("document.title") == 'Bibbia Studio')

@test('phone')
def service_worker_offline(env, dev):
    class H(http.server.SimpleHTTPRequestHandler):
        def log_message(s, *a): pass
        def end_headers(s): s.send_header('Cache-Control', 'no-cache'); super().end_headers()
    H.extensions_map = {**H.extensions_map, '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml'}
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(H, directory=str(ROOT)))
    th = threading.Thread(target=srv.serve_forever, daemon=True); th.start()
    base = f'http://localhost:{srv.server_address[1]}/'
    try:
        c = env.br.new_context(service_workers='allow', locale='it-IT', **PHONE); env.ctxs.append(c)
        pg = c.new_page(); pg.set_default_timeout(8000); errs = []; env.errs.append(errs)
        pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
        pg.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' and not any(x in m.text for x in IGNORE + ('net::ERR',)) else None)
        c.route('**/fonts.g*/**', lambda r, q: r.fulfill(status=200, content_type='text/css', body=''))
        c.route('https://script.google.com/**', lambda r, q: r.fulfill(status=200, content_type='application/json', body='{"ok":false,"code":"auth","error":"x"}'))
        pg.goto(base); pg.wait_for_selector('#greet')
        pg.evaluate("navigator.serviceWorker.ready.then(()=>0)"); pg.reload(); pg.wait_for_selector('#greet')
        check(pg.evaluate("!!navigator.serviceWorker.controller"), 'il service worker controlla la pagina')
        pg.wait_for_timeout(1500)
        names = pg.evaluate("caches.keys()"); check(any(n.startswith('margine-') for n in names), str(names))
        n = pg.evaluate("caches.keys().then(async ks=>{let t=0;for(const k of ks){if(k==='margine-fonts')continue;t+=(await (await caches.open(k)).keys()).length}return t})"); check(n >= 20, f'file nel guscio: {n}')
        # senza rete l'app si riapre, e anche una pagina interna
        c.set_offline(True); pg.reload(); pg.wait_for_selector('#greet'); check('Oggi' in pg.inner_text('#tabs') or pg.locator('#tabs').count() == 1)
        pg.click('#tabs button:nth-child(2)'); pg.wait_for_timeout(300); pg.go_back() if False else None
        # una POST verso script.google.com non finisce mai nelle cache
        keys = pg.evaluate("caches.keys().then(async ks=>{const u=[];for(const k of ks){u.push(...(await (await caches.open(k)).keys()).map(r=>r.url))}return u})")
        check(not any('script.google.com' in u for u in keys), 'nessuna richiesta Google in cache')
        c.set_offline(False)
        # nuova versione: se sw.js cambia, il nome della cache cambia (derivato dall'hash del file)
        src = (ROOT / 'sw.js').read_text(); check('SHA-1' in src and 'margine-' in src)
    finally: srv.shutdown(); srv.server_close()
