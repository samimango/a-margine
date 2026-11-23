from lib import *
from s1 import phone,col

def shelf(title,n,keys,extra=''):
    cs=''.join(f'<div style="flex:none;width:76px"><div style="{'transform:translateY(-9px) scale(1.09) rotate(-2.5deg);filter:drop-shadow(0 14px 14px rgba(40,50,30,.4));position:relative;z-index:5' if k=="sal" else ""}">{cover(k,76,110,r=4,shadow=True,tsize=7.2)}</div><div style="font:600 11.5px var(--sans);margin-top:8px;color:var(--ink)">{BOOKS[k]["n"]}</div><div style="font:500 10.5px var(--sans);color:var(--dim)">{BOOKS[k]["ch"]} capitoli</div></div>' for k in keys)
    return f'''<div style="margin-bottom:12px"><div class="sh" style="margin-bottom:12px"><b class="sc" style="font:600 15px var(--lora);letter-spacing:.1em;font-variant-caps:all-small-caps">{title}</b><span>{n}</span></div>
    <div style="display:flex;gap:11px;padding:0 18px;width:520px">{cs}</div>
    <div style="height:7px;margin:-3px 14px 0;border-radius:0 0 4px 4px;background:linear-gradient(180deg,rgba(90,60,20,.22),rgba(90,60,20,0));position:relative;z-index:0"></div></div>'''

def s2():
    head=f'''<div style="padding:62px 20px 0"><div class="lg" style="font-size:35px">Libreria</div></div>
    <div style="margin:14px 18px 0;height:44px;border-radius:14px;background:#e9e2d2;display:flex;align-items:center;gap:9px;padding:0 13px;color:#8a8170;font:500 15.5px var(--sans)">{ico('search',18,2)}<span>Vai a… <span style="color:#3a342a">gv 3,16</span></span><span style="margin-left:auto;font:600 11px var(--sans);background:#f9f5ec;border-radius:7px;padding:4px 8px;color:#6a604d;box-shadow:0 0 0 .6px var(--line)">Invio</span></div>'''
    body=f'''<div style="position:absolute;left:0;right:0;top:160px;overflow:hidden;height:690px">
      <div style="padding-top:2px">{shelf('Pentateuco','5 libri',['gen','es','lev','num','deu'])}
      {shelf('Poetici e sapienziali','5 libri',['gb','sal','pr','is','ger'])}
      <div style="margin:2px 18px 14px;height:36px;display:flex;align-items:center;gap:10px"><div style="flex:1;height:1px;background:var(--line)"></div><span class="eyebrow" style="letter-spacing:.2em">Nuovo Testamento</span><div style="flex:1;height:1px;background:var(--line)"></div></div>
      {shelf('Vangeli','4 libri',['mt','mc','lc','gv'])}</div></div>'''
    # lifted cover (gv) at last shelf: highlight via annotation
    an=f'''<div class="anno" style="left:112px;top:446px;z-index:62">a molla: si solleva al tocco</div>
    <div class="anno l" style="left:20px;top:396px;display:none"></div>'''
    return col('2','Libreria','Una scaffalatura di copertine: ogni libro ha il suo colore e il suo simbolo.',phone('light',head+body+an,tab='Leggi'))

# ---------- 3 INTRO
def s3():
    cov=f'''<div style="position:absolute;left:0;top:0;width:390px;height:380px">{cover('gv',390,380,hero=True,frame=False,symx=282,symy=170,syms=330,fade=False)}
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.18) 0,rgba(0,0,0,0) 22%,rgba(244,240,232,0) 52%,rgba(244,240,232,.85) 82%,#f4f0e8 100%)"></div></div>'''
    nav=f'''<div class="glass" style="position:absolute;left:16px;top:62px;width:38px;height:38px;border-radius:19px;display:flex;align-items:center;justify-content:center;color:#fff;background:rgba(255,255,255,.2);z-index:25;box-shadow:inset 0 0 0 .6px rgba(255,255,255,.4)">{ico('back',20,2.2)}</div>
    <div class="glass" style="position:absolute;right:16px;top:62px;width:38px;height:38px;border-radius:19px;display:flex;align-items:center;justify-content:center;color:#fff;background:rgba(255,255,255,.2);z-index:25;box-shadow:inset 0 0 0 .6px rgba(255,255,255,.4)">{ico('dots',20,2)}</div>'''
    titl=f'''<div style="position:absolute;left:22px;right:22px;top:196px;color:#fff6ec;z-index:3"><div class="eyebrow" style="color:#f6dcc4;opacity:.85">Nuovo Testamento · Vangeli</div>
      <div style="font:600 41px/1.04 var(--lora);letter-spacing:-.02em;margin-top:8px">Vangelo secondo<br>Giovanni</div></div>'''
    intro=f'''<div style="position:absolute;left:22px;right:22px;top:332px;z-index:3"><div style="display:flex;align-items:center;gap:10px;margin-bottom:9px"><div style="width:26px;height:1.5px;background:#b45c3a"></div><span class="eyebrow" style="color:#b45c3a">Il quarto Vangelo</span></div>
      <div style="font:400 17.5px/1.42 var(--serif);color:#2c261d">Un racconto di segni e di parole, costruito attorno a una domanda: chi è Gesù? Si apre con il Prologo, un inno alla Parola fatta carne.</div></div>'''
    def row(l,v,note=''):
        return f'<div style="display:flex;gap:14px;padding:11px 0;border-top:.6px solid var(--line)"><div style="width:76px;flex:none;font:600 10.5px/1.6 var(--sans);letter-spacing:.12em;text-transform:uppercase;color:var(--dim)">{l}</div><div style="flex:1;font:500 14.5px/1.35 var(--sans)">{v}{note}</div></div>'
    note='<div style="display:inline-flex;align-items:center;gap:5px;margin-top:6px;padding:3px 9px 3px 7px;border-radius:9px;background:#f0e6cf;color:#7a5a1c;font:600 10.5px var(--sans)">'+ico('info',12,2)+'Tradizione · gli studiosi ne discutono</div>'
    card=f'''<div class="card" style="position:absolute;left:16px;right:16px;top:446px;padding:4px 16px 4px;border-radius:24px;z-index:3">
      {row('Autore','Giovanni, figlio di Zebedeo — <span style="color:var(--dim)">secondo la tradizione</span>','<br>'+note).replace('border-top:.6px solid var(--line)','')}
      {row('Periodo','Circa 90–100 d.C.')}
      {row('Scritto a','Efeso <span style="color:var(--dim)">(tradizione)</span>')}
      {row('Per chi','Comunità cristiane di lingua greca')}
      {row('Tema','Credere in Gesù, Figlio di Dio, per avere la vita <span style="color:var(--dim)">(20,31)</span>')}
    </div>'''
    ch=lambda n,t:f'<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-top:.6px solid var(--line)"><span style="font:600 17px var(--lora);width:24px;color:#b45c3a">{n}</span><span style="font:500 14.5px var(--sans);flex:1">{t}</span>{ico("chev",15,2,"color:#b9b09e")}</div>'
    bar=f'''<div class="glass" style="position:absolute;left:0;right:0;bottom:0;height:104px;z-index:20;border-top:.6px solid var(--line)"><div class="pill" style="position:absolute;left:18px;right:18px;top:14px;height:50px;border-radius:25px;background:#b45c3a;color:#fff6ec;font-size:15.5px;box-shadow:0 10px 20px -8px rgba(124,52,32,.65)">{ico('book',18,2)}Inizia a leggere · capitolo 1</div></div>'''
    an=f'''<div class="anno" style="right:14px;top:130px;z-index:61">parallasse: la copertina scorre più piano</div>
    <svg class="arrow" style="left:340px;top:150px" width="30" height="52" viewBox="0 0 30 52" fill="none" stroke="#cf4a2a" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 5"><path d="M15 4V46"/><path d="M8 38l7 9 7-9" stroke-dasharray="0"/></svg>'''
    return col('3','Introduzione al libro','Autore, periodo e tema in una scheda sobria; la tradizione è dichiarata come tale.',phone('light',cov+nav+titl+intro+card+bar+an,home=True))
