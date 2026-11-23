import sys
sys.path.insert(0,'/tmp/audit1')
from harness import *
from t1 import *
with sync_playwright() as p:
    br=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    env=Env(br);pg,errs,srv=env.new('desk');read(pg)
    pg.evaluate("window.scrollTo(0,1500)");pg.wait_for_timeout(600)
    print(pg.evaluate('[scrollY,v,pendingScroll]'))
    pg.evaluate("document.getElementById('v16').click()");print(pg.evaluate('[scrollY,v,selA]'));pg.evaluate("document.getElementById('openNote').click()");pg.wait_for_timeout(300);print(pg.evaluate('[scrollY,v,view,leave]'))
    pg.fill('#note','x');pg.click('#wDone');pg.wait_for_timeout(500);print(pg.evaluate('[scrollY,v,view,leave,pendingScroll]'))
    br.close()
