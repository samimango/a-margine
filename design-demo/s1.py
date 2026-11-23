from lib import *
SB='<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx=".8"/><rect x="5" y="5.5" width="3" height="6.5" rx=".8"/><rect x="10" y="3" width="3" height="9" rx=".8"/><rect x="15" y="0" width="3" height="12" rx=".8"/></svg><svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor"><path d="M8.5 2.3c2.3 0 4.4.9 6 2.4l1-1.1A9.9 9.9 0 0 0 8.5.8 9.900 9.900 0 0 0 1.500 3.600l1 1.100a8.400 8.400 0 0 1 6-2.400zm0 3.700c1.300 0 2.500.5 3.400 1.300l1-1.100a6.800 6.800 0 0 0-8.800 0l1 1.100c.9-.8 2.100-1.300 3.400-1.300zm0 3.600a2.400 2.400 0 0 0-1.600.6L8.500 12l1.600-1.800a2.400 2.400 0 0 0-1.600-.6z"/></svg><svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="22" height="12" rx="3.500" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="19" height="9" rx="2.200" fill="currentColor"/><path d="M24.200 4.500v4c.8-.3 1.400-1.100 1.400-2s-.6-1.700-1.400-2z" fill="currentColor" opacity=".45"/></svg>'
def phone(theme,inner,tab=None,cls='',style='',home=True,status=True):
    t=''
    if tab:
        items=[('Oggi','sun'),('Leggi','book'),('Quaderno','note'),('Cerca','search')]
        t='<div class="tabbar glass">'+''.join(f'<div class="tab{" on" if n==tab else ""}">{ico(i,22,1.7)}<span>{n}</span></div>' for n,i in items)+'</div>'
    s=f'<div class="st"><span>9:41</span><span class="r">{SB}</span></div>' if status else ''
    return f'<div class="ph {theme} {cls}" style="{style}"><div class="island"></div>{s}{inner}{t}{"<div class=home></div>" if home else ""}</div>'
def col(n,title,line,ph):
    return f'<div class="col">{ph}<div class="cap"><i>{n}</i><b>{title}</b><span>{line}</span></div></div>'

# ---------- 1 OGGI
def s1():
    hero=f'''<div style="position:absolute;left:16px;right:16px;top:124px;height:246px;border-radius:28px;overflow:hidden;box-shadow:0 22px 36px -18px rgba(124,52,32,.7),0 0 0 .6px rgba(0,0,0,.2)">
      <div style="position:absolute;inset:0">{cover('gv',358,246,hero=True,frame=False,symx=290,symy=96,syms=250)}</div>
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 35%,rgba(40,14,6,.55))"></div>
      <div style="position:absolute;left:18px;top:18px;display:flex;gap:14px;align-items:flex-end">
        <div style="margin-bottom:-4px;border-radius:5px;box-shadow:0 0 0 1px rgba(255,235,215,.45)">{cover('gv',78,110,r=5,shadow=True,tsize=7)}</div>
        <div style="color:#fbeadb;padding-bottom:4px"><div style="font:600 10px var(--sans);letter-spacing:.16em;opacity:.75">RIPRENDI DA QUI</div>
        <div style="font:600 29px/1.05 var(--lora);margin:6px 0 4px;letter-spacing:-.01em">Giovanni 3</div>
        <div style="font:500 12.5px var(--sans);opacity:.8">Versetto 16 · 4 min rimasti</div></div></div>
      <div style="position:absolute;left:18px;right:18px;top:132px;color:#fff6ec;font:italic 400 16.5px/1.35 var(--serif);text-shadow:0 1px 8px rgba(60,20,8,.5)">«Poiché Iddio ha tanto amato il mondo, che ha dato il suo unigenito Figliuolo…»</div>
      <div style="position:absolute;left:18px;right:18px;top:184px;display:flex;gap:9px">
        <div class="pill" style="flex:1;background:#fbf0e3;color:#5c2a18;box-shadow:0 6px 14px -6px rgba(0,0,0,.4)">{ico('book',17,2)}Continua</div>
        <div class="pill glass" style="width:112px;color:#fff;background:rgba(255,255,255,.18);box-shadow:inset 0 0 0 .6px rgba(255,255,255,.4)">{ico('headphones',17,2)}Ascolta</div></div>
      <div style="position:absolute;left:18px;right:18px;top:236px;height:3px;border-radius:2px;background:rgba(255,255,255,.25)"><div style="width:14%;height:100%;border-radius:2px;background:#fbf0e3"></div></div>
    </div>'''
    head=f'''<div style="position:absolute;left:20px;right:20px;top:64px;display:flex;justify-content:space-between;align-items:flex-end">
      <div><div class="eyebrow">Lunedì 23 novembre</div><div class="lg" style="margin-top:5px;font-size:35px">Buonasera</div></div>
      <div style="width:40px;height:40px;border-radius:50%;background:#e8dfcc;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 .6px var(--line)">{ico('person',20,1.7,'color:#8a6a2a')}</div></div>'''
    def stat(n,l,ic,col_,extra=''):
        return f'<div class="card" style="flex:1;padding:11px 12px 10px;border-radius:18px"><div style="display:flex;justify-content:space-between;align-items:center;color:{col_}">{ico(ic,15,2)}{extra}</div><div style="font:600 27px/1 var(--lora);margin-top:7px;color:var(--ink)">{n}</div><div style="font:500 11px var(--sans);color:var(--dim);margin-top:2px">{l}</div></div>'
    dots=''.join(f'<i style="width:4px;height:4px;border-radius:2px;background:{"#b45c3a" if k<6 else "#d9cfba"}"></i>' for k in range(7))
    stats=f'<div style="position:absolute;left:16px;right:16px;top:384px;display:flex;gap:8px">{stat("12","giorni di fila","flame","#b45c3a",f"<span style=display:flex;gap:2px>{dots}</span>")}{stat("148","capitoli letti","book","#6d8062")}{stat("5","libri finiti","bookmark","#b8882e")}</div>'
    mem=f'''<div class="card" style="position:absolute;left:16px;top:480px;width:172px;height:156px;padding:14px;overflow:hidden">
      <div style="display:flex;justify-content:space-between;align-items:center"><span class="eyebrow" style="color:#b45c3a">A memoria</span><span style="font:600 10.5px var(--sans);color:var(--dim)">oggi · 1</span></div>
      <div style="font:600 12px var(--sans);margin-top:8px;color:var(--ink)">Giovanni 1,5</div>
      <div style="font:400 15px/1.34 var(--serif);margin-top:3px;color:#3a342a">La luce splende nelle tenebre, e le <span style="display:inline-block;width:46px;border-bottom:1.5px solid #b45c3a;vertical-align:-2px"></span> non l’hanno <span style="display:inline-block;width:40px;border-bottom:1.5px solid #b45c3a;vertical-align:-2px"></span></div>
      <div style="position:absolute;left:14px;bottom:12px;font:600 12.5px var(--sans);color:#b45c3a;display:flex;align-items:center;gap:2px">Ripassa{ico('chev',13,2.2)}</div></div>'''
    mond=f'''<div class="card" style="position:absolute;left:198px;top:480px;width:176px;height:156px;overflow:hidden;padding:0">
      {mapsvg(176,156,'125 30 190 150')}
      <div style="position:absolute;inset:auto 0 0 0;height:66px;background:linear-gradient(0deg,rgba(247,242,230,.97) 40%,rgba(247,242,230,0))"></div>
      <div style="position:absolute;left:14px;right:12px;bottom:11px"><div class="eyebrow" style="color:#8e3a2b">Esplora</div><div style="font:600 15.5px var(--lora);margin-top:1px;color:#221d16">Mondo della Bibbia</div></div></div>'''
    def rec(k,t,p,w):
        return f'<div class="card" style="flex:none;width:172px;height:76px;padding:10px;display:flex;gap:11px;align-items:center;border-radius:18px">{cover(k,40,56,r=3,shadow=True,title=False)}<div style="flex:1"><div style="font:600 14.5px var(--lora)">{t}</div><div style="font:500 11px var(--sans);color:var(--dim);margin:1px 0 7px">{p}</div><div style="height:3px;border-radius:2px;background:#e6dfcf"><div style="height:100%;width:{w}%;border-radius:2px;background:{BOOKS[k]["c1"]}"></div></div></div></div>'
    recent=f'''<div class="sh" style="position:absolute;left:0;right:0;top:652px"><b>Letti di recente</b><span>Tutti ›</span></div>
      <div style="position:absolute;left:16px;top:690px;display:flex;gap:10px;width:600px">{rec('sal','Salmi 23','ieri · 6 versetti',100)}{rec('rm','Romani 8','sabato · 39 versetti',62)}{rec('gen','Genesi 1','giovedì',100)}</div>'''
    # annotations
    an=f'''<div class="anno" style="left:44px;top:398px;display:none"></div><div class="anno" style="left:174px;top:136px;z-index:62">si espande a tutto schermo</div>
      <div class="ghost" style="left:8px;top:124px;width:374px;height:262px;border-radius:32px;z-index:55"></div>
      <div class="anno l" style="left:232px;top:374px;z-index:62;transform:translateY(-50%)">i numeri contano da 0</div>
      <div class="anno" style="left:96px;top:740px;z-index:61">la pillola scivola tra le schede</div>'''
    return col('1','Oggi','Cruscotto a card: riprendi, serie, ripasso, mappa e ultime letture.',phone('light',head+hero+stats+mem+mond+recent+an,tab='Oggi'))
