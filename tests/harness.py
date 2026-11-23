"""Harness dei test: Playwright + Chromium, file serviti dal disco, backend simulato eseguendo il VERO backend/Code.gs (tests/gas_host.js)."""
import json, os, re, subprocess, mimetypes, sys, time, traceback
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
HERE = Path(__file__).resolve().parent
SHOTS = HERE / 'shots'
SHOTS.mkdir(exist_ok=True)
GAS_URL = 'https://script.google.com/macros/s/TESTDEPLOY/exec'
KEY = 'test-key-0123456789'
NAMES = 'Genesi|Esodo|Levitico|Numeri|Deuteronomio|Giosuè|Giudici|Rut|1 Samuele|2 Samuele|1 Re|2 Re|1 Cronache|2 Cronache|Esdra|Neemia|Ester|Giobbe|Salmi|Proverbi|Ecclesiaste|Cantico dei Cantici|Isaia|Geremia|Lamentazioni|Ezechiele|Daniele|Osea|Gioele|Amos|Abdia|Giona|Michea|Naum|Abacuc|Sofonia|Aggeo|Zaccaria|Malachia|Matteo|Marco|Luca|Giovanni|Atti|Romani|1 Corinzi|2 Corinzi|Galati|Efesini|Filippesi|Colossesi|1 Tessalonicesi|2 Tessalonicesi|1 Timoteo|2 Timoteo|Tito|Filemone|Ebrei|Giacomo|1 Pietro|2 Pietro|1 Giovanni|2 Giovanni|3 Giovanni|Giuda|Apocalisse'.split('|')
IDX = {n: i for i, n in enumerate(NAMES)}


class Host:
    def __init__(s):
        s.p = subprocess.Popen(['node', str(HERE / 'gas_host.js')], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    def call(s, **msg):
        s.p.stdin.write(json.dumps(msg) + '\n'); s.p.stdin.flush()
        return json.loads(s.p.stdout.readline())
    def close(s):
        try: s.p.stdin.close(); s.p.wait(5)
        except Exception: s.p.kill()


class Srv:
    """Il «servizio Google»: backend vero (Code.gs) + opzioni di guasto + registro delle richieste."""
    def __init__(s, key=KEY):
        s.host = Host(); s.key = key
        s.host.call(cmd='setProp', scope='script', k='MARGINE_KEY', v=key)
        s.fail = False; s.chapter_fail = False; s.reqs = []; s.delay = {}; s.sync_hook = None; s.bad_key_calls = 0
    def calls(s, method): return [r for r in s.reqs if r.get('method') == method]
    def chapters(s): return [r['data'] for r in s.calls('chapter')]
    def syncs(s): return s.calls('sync')
    def user_props(s): return s.host.call(cmd='props')['user']
    def handle(s, body):
        try: req = json.loads(body)
        except Exception: req = {}
        s.reqs.append(req)
        m = req.get('method')
        if s.fail: return None
        if m == 'chapter' and s.chapter_fail: return None
        if s.delay.get(m): time.sleep(s.delay[m])
        if m == 'sync' and s.sync_hook: s.sync_hook()
        r = s.host.call(cmd='post', body=body)
        if '"code":"auth"' in r['text']: s.bad_key_calls += 1
        return r['text']
    def close(s): s.host.close()


def cors(status=200, body='', ctype='application/json'):
    return dict(status=status, body=body, content_type=ctype + '; charset=utf-8', headers={'Access-Control-Allow-Origin': '*'})


def make_handler(srv):
    def handler(route, req):
        url = req.url
        if url.startswith(GAS_URL):
            if req.method != 'POST': return route.fulfill(**cors(200, '<p>A margine si è spostata: apri l’app.</p>', 'text/html'))
            text = srv.handle(req.post_data or '')
            if text is None: return route.abort()
            return route.fulfill(**cors(200, text))
        if 'fonts.googleapis.com' in url: return route.fulfill(status=200, content_type='text/css', body='')
        if 'fonts.gstatic.com' in url: return route.abort()
        if url.startswith('http://localhost'):
            path = url.replace('http://localhost', '').split('?')[0].split('#')[0]
            f = ROOT / (path.lstrip('/') or 'index.html')
            if f.is_file():
                ct = {'.js': 'text/javascript', '.mjs': 'text/javascript', '.webmanifest': 'application/manifest+json'}.get(f.suffix) or mimetypes.guess_type(str(f))[0] or 'text/plain'
                return route.fulfill(status=200, content_type=ct, body=f.read_bytes(), headers={'Cache-Control': 'no-store'})
            return route.fulfill(status=404, body='')
        return route.fulfill(status=404, body='')
    return handler


IGNORE = ('Failed to load resource', 'ERR_FAILED', 'fonts.g')
PHONE = dict(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True)
DESK = dict(viewport={'width': 1280, 'height': 800})


class Env:
    def __init__(s, br):
        s.br = br; s.ctxs = []; s.errs = []; s.srvs = []
    def new(s, device='phone', srv=None, configured=True, storage=None, dark=False, init=None, sw='block', url='/', wait='#greet', locale='it-IT'):
        own = srv is None
        srv = srv or Srv()
        if own: s.srvs.append(srv)
        c = s.br.new_context(service_workers=sw, color_scheme='dark' if dark else 'light', accept_downloads=True, permissions=['clipboard-read', 'clipboard-write'], locale=locale, timezone_id='Europe/Zurich', **(PHONE if device == 'phone' else DESK))
        s.ctxs.append(c)
        pg = c.new_page(); pg.set_default_timeout(5000)
        errs = []; s.errs.append(errs); pg.errs = errs; pg.srv = srv; pg.ctx = c
        pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
        pg.on('console', lambda m: errs.append('CONSOLE ' + m.type + ': ' + m.text) if m.type in ('error', 'warning') and not any(x in m.text for x in IGNORE) else None)
        c.route('**/*', make_handler(srv))
        seed = dict(storage or {})
        if configured and 'margine.api' not in seed: seed['margine.api'] = json.dumps({'url': GAS_URL, 'key': srv.key})
        if seed:
            pg.add_init_script('if(!sessionStorage.__seeded){sessionStorage.__seeded=1;' + ';'.join(f'localStorage.setItem({json.dumps(k)},{json.dumps(v)})' for k, v in seed.items()) + '}')
        if init: pg.add_init_script(init)
        pg.goto('http://localhost' + url)
        if wait: pg.wait_for_selector(wait); pg.wait_for_timeout(250)
        return pg
    def close(s):
        for c in s.ctxs:
            try: c.close()
            except Exception: pass
        for v in s.srvs: v.close()
        s.ctxs = []; s.errs = []; s.srvs = []


TESTS = []
def test(*devs):
    def deco(fn):
        TESTS.append((fn.__name__, fn, devs or ('phone', 'desk'))); return fn
    return deco


# ---- helpers comuni ----
def ls(pg, k): return pg.evaluate('k=>localStorage.getItem(k)', k)
def lsj(pg, k, d=None):
    v = ls(pg, k)
    return json.loads(v) if v else d
def tab(pg, name):
    pg.evaluate("document.body.classList.remove('immersive')"); pg.wait_for_timeout(320)   # un tocco mostra le barre
    pg.click(f'#tabs [data-go={name}]'); pg.wait_for_timeout(200)
def screen(pg): return pg.evaluate('document.body.dataset.screen')
def open_ref(pg, b, c, v=1, verses=True):
    """Apre il lettore passando dalla Libreria (campo «Vai a»)"""
    tab(pg, 'libreria'); pg.fill('#goto', f'{NAMES[b]} {c},{v}'); pg.press('#goto', 'Enter')
    pg.wait_for_selector('#scr-leggi:not([hidden]) .verse' if verses else '#scr-leggi:not([hidden])'); pg.wait_for_timeout(200)
def sync_now(pg, wait=700):
    pg.evaluate('import("/js/core/sync.js").then(m=>m.synchronize())'); pg.wait_for_timeout(wait)
def eval_mod(pg, mod, expr):
    return pg.evaluate(f'import("/js/core/{mod}.js").then(m=>{expr})')
def shot(pg, name): pg.screenshot(path=str(SHOTS / f'{name}.png'))
def check(cond, msg=''):
    if not cond: raise AssertionError(msg or 'condizione falsa')
def eq(a, b, msg=''):
    if a != b: raise AssertionError(f'{msg} atteso {b!r}, ottenuto {a!r}')
def hidden(pg, sel): return pg.evaluate('s=>{const e=document.querySelector(s);return !e||e.hidden||e.offsetParent===null&&getComputedStyle(e).position!=="fixed"}', sel)


def run(only=None):
    ok = fail = 0; failures = []
    with sync_playwright() as pw:
        br = pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for name, fn, devs in TESTS:
            if only and not any(o in name for o in only): continue
            for dev in devs:
                env = Env(br); t0 = time.time()
                try:
                    fn(env, dev)
                    errs = [e for lst in env.errs for e in lst]
                    if errs: raise AssertionError('errori in console: ' + ' | '.join(errs[:4]))
                    print(f'  PASS {name} [{dev}] {time.time()-t0:.1f}s'); ok += 1
                except Exception as e:
                    fr = [f for f in traceback.extract_tb(e.__traceback__) if f.filename.startswith(str(HERE)) and f.filename != __file__]
                    where = f'{Path(fr[-1].filename).name}:{fr[-1].lineno}  {fr[-1].line}' if fr else ''
                    print(f'  FAIL {name} [{dev}]: {str(e).splitlines()[0] if str(e) else ""}\n       {where}'); fail += 1; failures.append(f'{name}[{dev}]')
                    try:
                        for i, c in enumerate(env.ctxs):
                            for j, p in enumerate(c.pages): p.screenshot(path=str(SHOTS / f'FAIL_{name}_{dev}_{i}{j}.png'))
                    except Exception: pass
                finally: env.close()
        br.close()
    print(f'\n{ok} passati, {fail} falliti' + (': ' + ', '.join(failures) if failures else ''))
    return 1 if fail else 0


def tap_verse(pg, n):
    """Tocca il versetto n al centro della sua PRIMA riga (i versetti sono in linea e possono andare a capo)"""
    pg.evaluate('n=>document.getElementById("v"+n).scrollIntoView({block:"center"})', n)
    pg.wait_for_timeout(120)
    if pg.evaluate('document.body.classList.contains("immersive")'):
        pg.evaluate('document.body.classList.remove("immersive")')
    r = pg.evaluate('n=>{const r=document.getElementById("v"+n).getClientRects()[0];return [r.left+Math.min(r.width/2,40),r.top+r.height/2]}', n)
    pg.mouse.click(r[0], r[1]); pg.wait_for_timeout(150)
