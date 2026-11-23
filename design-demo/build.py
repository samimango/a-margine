import sys,importlib
sys.path.insert(0,'/tmp/demo4/src')
import css; importlib.reload(css)
mods=[]
for m in ['s1','s2','s4','s5','s9']:
    try: mods.append(importlib.import_module(m))
    except ImportError as e:
        if m in('s5','s9'): pass
        else: raise
from playwright.sync_api import sync_playwright
import os
pages=[]
def page(cols): return '<div class="page">'+''.join(cols)+'</div>'
P=[]
import s1,s2,s4
P1=[s1.s1(),s2.s2(),s2.s3(),s4.s4()]
try:
    import s5; P2=[s5.s5(),s5.s6(),s5.s7(),s5.s8()]
except ImportError: P2=None
try:
    import s9; P3=[s9.s9(),s9.s10(),s9.s11(),s9.s12()]
except ImportError: P3=None
html='<!DOCTYPE html><html><head><meta charset="utf-8"><style>'+css.CSS+'</style></head><body>'
pg=[p for p in (P1,P2,P3) if p]
for p in pg: html+=page(p)
open('/tmp/demo4/d.html','w').write(html)
with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pgx=b.new_page(viewport={'width':1950,'height':1100},device_scale_factor=1)
    pgx.goto('file:///tmp/demo4/d.html'); pgx.wait_for_timeout(600)
    pages_=pgx.query_selector_all('.page')
    for i,p in enumerate(pages_): p.screenshot(path=f'/tmp/demo4/demo-{i+1}.png')
    for i,p in enumerate(pgx.query_selector_all('.ph')): p.screenshot(path=f'/tmp/demo4/crops/{i+1}.png')
    b.close()
print('built',len(pages_))
