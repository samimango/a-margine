from lib import *
from s1 import phone,col
from s5 import CW

def s9():
    head=f'''<div style="position:absolute;left:20px;right:20px;top:64px;display:flex;align-items:center;justify-content:space-between"><div class="glass" style="width:36px;height:36px;border-radius:18px;display:flex;align-items:center;justify-content:center;background:#ece6d7;box-shadow:inset 0 0 0 .6px var(--line)">{ico('back',19,2.2)}</div>
      <div style="text-align:center"><div class="eyebrow">Ripasso di oggi</div><div style="font:600 17px var(--lora);margin-top:2px">3 di 8</div></div><div style="width:36px;height:36px;border-radius:18px;display:flex;align-items:center;justify-content:center;color:#b45c3a">{ico('flame',22,1.8)}</div></div>
      <div style="position:absolute;left:24px;right:24px;top:122px;height:4px;border-radius:2px;background:#e3dccb;display:flex;gap:3px"><i style="flex:2;background:#b45c3a;border-radius:2px"></i><i style="flex:1;background:#b45c3a;border-radius:2px;opacity:.45"></i><i style="flex:5"></i></div>'''
    bl=lambda w:f'<span style="display:inline-block;width:{w}px;height:22px;vertical-align:-4px;margin:0 2px;border-radius:5px;background:repeating-linear-gradient(135deg,rgba(180,92,58,.16) 0 4px,rgba(180,92,58,.07) 4px 8px);border-bottom:2px solid #b45c3a"></span>'
    stack=f'''<div style="position:absolute;left:34px;right:34px;top:158px;height:416px;border-radius:30px;background:#e3d6bd;transform:rotate(4.5deg) translate(6px,8px);box-shadow:0 0 0 .6px var(--line)"></div>
    <div style="position:absolute;left:30px;right:30px;top:158px;height:416px;border-radius:30px;background:#eadfca;transform:rotate(-2.5deg) translate(-4px,5px);box-shadow:0 0 0 .6px var(--line)"></div>
    <div class="card" style="position:absolute;left:24px;right:24px;top:154px;height:416px;border-radius:30px;padding:26px 26px;box-shadow:0 30px 44px -22px rgba(80,50,15,.5),0 0 0 .6px var(--line)">
      <div style="display:flex;justify-content:space-between;align-items:center"><span class="eyebrow" style="color:#b45c3a">Giovanni 3,16</span><span style="font:600 11px var(--sans);color:#8a8170;background:#f0e9d9;border-radius:9px;padding:4px 9px">3 parole nascoste</span></div>
      <div style="display:flex;justify-content:center;margin:22px 0 16px">{fleuron('#c2b08a',70)}</div>
      <div style="font:400 25.5px/1.7 var(--serif);color:#2a241b;text-align:left">«Poiché Iddio ha tanto {bl(58)} il mondo, che ha dato il suo {bl(96)} Figliuolo, affinché chiunque crede in lui non {bl(68)}, ma abbia vita eterna.»</div>
      <div style="position:absolute;left:26px;right:26px;bottom:22px;display:flex;align-items:center;justify-content:space-between;color:#9a917f;font:500 12px var(--sans)"><span style="display:flex;align-items:center;gap:6px">{ico('bulb',15,1.9)}Suggerimento: inizia con A…</span><span>Visto 4 volte</span></div></div>
    <div class="anno" style="left:86px;top:566px;z-index:62">si capovolge in 3D · 0° → 90° → 180°</div>
    <svg class="arrow" style="left:306px;top:514px;z-index:62" width="70" height="44" viewBox="0 0 70 44" fill="none" stroke="#cf4a2a" stroke-width="2" stroke-linecap="round"><path d="M6 36C20 8 50 4 64 20M54 22l11 0 -4 -10"/></svg>'''
    btn=f'''<div class="pill" style="position:absolute;left:24px;right:24px;top:608px;height:54px;border-radius:27px;background:#231f1a;color:#f6efe2;font-size:16px;box-shadow:0 14px 24px -10px rgba(0,0,0,.5)">{ico('cards',19,1.9)}Mostra la risposta</div>'''
    def r(t,c,bg,iv,fg):
        return f'<div style="flex:1;height:64px;border-radius:20px;background:{bg};color:{fg};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;box-shadow:inset 0 0 0 .6px rgba(0,0,0,.08)"><b style="font:600 15px var(--sans)">{t}</b><span style="font:500 11px var(--sans);opacity:.7">{iv}</span></div>'
    rat=f'''<div style="position:absolute;left:24px;right:24px;top:684px"><div style="text-align:center;font:600 10.5px var(--sans);letter-spacing:.14em;color:var(--dim);margin-bottom:10px">COME TI È ANDATA?</div><div style="display:flex;gap:9px">{r('Difficile','','#f1d9d0','domani','#7a2e1c')}{r('Bene','','#e1e8d6','tra 3 giorni','#3d5733')}{r('Facile','','#f2e5bf','tra 7 giorni','#6b4d0e')}</div></div>'''
    return col('9','Imparare a memoria','Un versetto alla volta: parole nascoste, ripasso a intervalli e tre valutazioni.',phone('light',head+stack+btn+rat))

def s10():
    cov=f'''<div style="position:absolute;left:0;right:0;top:60px;text-align:center"><div style="width:38px;height:5px;border-radius:3px;background:#444;margin:0 auto 14px"></div></div>
    <div style="position:absolute;left:50%;top:88px;transform:translateX(-50%);width:210px;height:260px;border-radius:12px;box-shadow:0 30px 60px -8px rgba(180,92,58,.55),0 0 90px rgba(180,92,58,.28)">{cover('gv',210,260,r=12,tsize=18)}</div>
    <div class="ghost" style="left:60px;top:80px;width:270px;height:300px;border-radius:18px;z-index:55;display:none"></div>
    <div class="anno" style="left:90px;top:380px;z-index:62;display:none"></div>'''
    title=f'''<div style="position:absolute;left:26px;right:26px;top:366px;display:flex;align-items:flex-end;justify-content:space-between"><div><div style="font:600 27px/1.1 var(--lora)">Giovanni 3</div><div style="font:500 13px var(--sans);color:var(--dim);margin-top:4px">Versetto 5 di 36 · Riveduta</div></div>
      <div style="width:36px;height:36px;border-radius:18px;background:#1c1c1c;display:flex;align-items:center;justify-content:center;color:#ddd">{ico('dots',20,2)}</div></div>'''
    verses=f'''<div style="position:absolute;left:26px;right:26px;top:432px;font:400 17px/1.5 var(--serif)">
      <div style="color:#5b574f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><sup style="font:600 9px var(--sans);margin-right:3px;vertical-align:5px">4</sup>Nessuno può fare questi segni, se Dio non è con lui.</div>
      <div style="margin:5px -10px;padding:8px 10px;border-radius:12px;background:rgba(214,168,60,.17);box-shadow:inset 0 0 0 .6px rgba(214,168,60,.4);color:#f6ecd6"><sup style="font:600 9px var(--sans);margin-right:3px;vertical-align:5px;color:#d6a83c">16</sup>Poiché Iddio ha tanto amato il mondo, che ha dato il suo unigenito Figliuolo, affinché chiunque crede in lui non perisca, ma abbia vita eterna.</div>
      <div style="color:#5b574f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><sup style="font:600 9px var(--sans);margin-right:3px;vertical-align:5px">17</sup>Poiché Iddio non ha mandato il suo Figliuolo nel mondo…</div></div>'''
    scr=f'''<div style="position:absolute;left:26px;right:26px;top:646px"><div style="height:4px;border-radius:2px;background:#2a2a2a;position:relative"><div style="width:34%;height:100%;border-radius:2px;background:#f3efe8"></div><div style="position:absolute;left:34%;top:-4px;width:12px;height:12px;border-radius:6px;background:#fff;margin-left:-6px"></div></div>
      <div style="display:flex;justify-content:space-between;font:500 11px var(--sans);color:var(--dim);margin-top:9px"><span>1:12</span><span>−2:23</span></div></div>
    <div style="position:absolute;left:0;right:0;top:688px;display:flex;align-items:center;justify-content:center;gap:34px;color:#f3efe8">{ico('back15',34,1.6)}<div style="width:70px;height:70px;border-radius:35px;background:#f3efe8;color:#000;display:flex;align-items:center;justify-content:center">{ico('pause',32,0)}</div>{ico('fwd15',34,1.6)}</div>
    <div style="position:absolute;left:20px;right:20px;top:772px;display:flex;align-items:center;gap:8px;font:600 12.5px var(--sans)">
      <div style="height:36px;border-radius:18px;background:#1b1b1b;padding:0 13px;display:flex;align-items:center;gap:6px;box-shadow:inset 0 0 0 .6px #333">{ico('speed',16,1.8)}1,0×</div>
      <div style="flex:1;height:36px;border-radius:18px;background:#1b1b1b;padding:0 14px;display:flex;align-items:center;gap:7px;box-shadow:inset 0 0 0 .6px #333"><span style="width:7px;height:7px;border-radius:50%;background:#7fa070"></span>Federica · migliorata<span style="margin-left:auto;color:#8c877d">{ico('chev',14,2.2)}</span></div>
      <div style="width:36px;height:36px;border-radius:18px;background:#1b1b1b;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 .6px #333">{ico('timer',17,1.8)}</div></div>'''
    an=f'''<div class="anno l" style="right:20px;top:108px;z-index:62">la copertina respira piano con la voce</div>
    <div class="anno" style="left:26px;top:520px;display:none"></div>
    <div class="anno" style="right:18px;top:432px;z-index:62;display:none"></div>'''
    return col('10','Ascolta','Lettura ad alta voce su nero puro: il versetto che suona resta evidenziato.',phone('dark',cov+title+verses+scr+an))

def s11():
    top=f'''<div style="position:absolute;left:28px;right:28px;top:96px;font:400 19.5px/1.56 var(--serif);color:#2a241b;-webkit-mask-image:linear-gradient(180deg,rgba(0,0,0,.18),#000 95%);mask-image:linear-gradient(180deg,rgba(0,0,0,.18),#000 95%)"><sup style="font:600 9.5px var(--sans);color:#b9a98a;margin-right:3px;vertical-align:5px">51</sup>E gli disse: «In verità, in verità vi dico che vedrete il cielo aperto, e gli angeli di Dio salire e scendere sopra il Figliuol dell’uomo».</div>
    <div style="position:absolute;left:0;right:0;top:226px;display:flex;justify-content:center">{fleuron('#b8a47a',100)}</div>'''
    seal=f'''<svg style="position:absolute;left:50%;top:268px;margin-left:-72px;filter:drop-shadow(0 14px 14px rgba(124,52,32,.38))" width="144" height="144" viewBox="0 0 144 144"><defs><path id="ci" d="M72 72m-52 0a52 52 0 1 1 104 0a52 52 0 1 1-104 0"/><radialGradient id="sg" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#c8693f"/><stop offset="1" stop-color="#8e3a22"/></radialGradient></defs>
      <circle cx="72" cy="72" r="68" fill="url(#sg)"/><circle cx="72" cy="72" r="64" fill="none" stroke="#f6dcc4" stroke-opacity=".5" stroke-width="1"/><circle cx="72" cy="72" r="38" fill="none" stroke="#f6dcc4" stroke-opacity=".5" stroke-width="1"/>
      <text font-family="Cardo,serif" font-size="12.5" textLength="322" lengthAdjust="spacing" fill="#f6dcc4"><textPath href="#ci" startOffset="0">CAPITOLO LETTO ✦ GIOVANNI 1 ✦</textPath></text>
      <path d="M52 74l14 14 28-32" fill="none" stroke="#fbeadb" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>'''
    frames=''.join(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{s}px;height:{s}px;border-radius:50%;border:1.5px dashed #cf4a2a;opacity:{o}"></div><div style="position:absolute;left:{x}px;top:{y+s+3}px;width:{s}px;text-align:center;font:600 9.5px var(--sans);color:#cf4a2a">{l}</div>' for x,y,s,o,l in [(34,290,30,.6,'0,3×'),(26,346,46,.8,'1,3×'),(31,410,36,1,'1×')])
    an=f'''<div class="ghost" style="left:112px;top:262px;width:166px;height:156px;border-radius:50%;display:none"></div>
    <div style="position:absolute;left:24px;top:296px;display:flex;flex-direction:column;align-items:center;gap:0"></div>
    <div class="anno" style="left:50%;margin-left:-168px;top:508px;z-index:62">il sigillo si stampa · a molla 1,3× → 0,95× → 1×</div>'''
    txt=f'''<div style="position:absolute;left:0;right:0;top:432px;text-align:center"><div style="font:600 31px/1.1 var(--lora);letter-spacing:-.01em">Capitolo letto</div><div style="font:500 13.5px var(--sans);color:var(--dim);margin-top:7px">51 versetti · 6 minuti · 13° giorno di fila</div></div>'''
    nxt=f'''<div class="card" style="position:absolute;left:16px;right:16px;top:560px;height:104px;padding:14px;display:flex;align-items:center;gap:16px;border-radius:26px;box-shadow:0 20px 34px -16px rgba(124,52,32,.5),0 0 0 .6px var(--line)">
      {cover('gv',58,82,r=4,shadow=True,tsize=6)}<div style="flex:1"><div class="eyebrow" style="color:#b45c3a">Capitolo dopo</div><div style="font:600 25px/1.15 var(--lora);margin-top:4px">Giovanni 2 ›</div><div style="font:500 12.5px var(--sans);color:var(--dim);margin-top:2px">Le nozze di Cana · 3 min</div></div>
      <div style="width:42px;height:42px;border-radius:21px;background:#b45c3a;color:#fff6ec;display:flex;align-items:center;justify-content:center">{ico('chev',20,2.4)}</div></div>
    <div style="position:absolute;left:16px;right:16px;top:682px;display:flex;gap:9px"><div class="pill" style="flex:1;height:46px;background:#ece5d4;color:#3a3226">{ico('pen',17,1.9)}Scrivi una nota</div><div class="pill" style="flex:1;height:46px;background:#ece5d4;color:#3a3226">{ico('bookmark',17,1.9)}Segnalibro</div></div>'''
    return col('11','Capitolo finito','Un sigillo «Letto» si stampa a fine capitolo; il prossimo è a un tocco.',phone('paper',top+seal+txt+nxt+an+frames))

def s12():
    head=f'''<div style="padding:62px 20px 0"><div class="lg" style="font-size:35px">Quaderno</div></div>
    <div style="margin:12px 18px 0;height:42px;border-radius:13px;background:#e9e2d2;display:flex;align-items:center;gap:9px;padding:0 13px;color:#8a8170;font:500 15px var(--sans)">{ico('search',18,2)}Cerca nelle note</div>
    <div style="margin:12px 18px 0;display:flex;background:#e9e2d2;border-radius:11px;padding:3px;font:600 12.5px var(--sans);text-align:center"><div style="flex:1;padding:7px;border-radius:9px;background:#fffdf9;box-shadow:0 1px 3px rgba(0,0,0,.14)">Per libro</div><div style="flex:1;padding:7px;color:#7a7368">Per data</div><div style="flex:1;padding:7px;color:#7a7368">Per colore</div></div>'''
    def grp(k,sub):
        return f'<div style="display:flex;align-items:center;gap:12px;margin:18px 18px 10px">{cover(k,32,46,r=3,shadow=True,title=False)}<div style="flex:1"><div style="font:600 19px var(--lora)">{BOOKS[k]["n"]}</div><div style="font:500 11.5px var(--sans);color:var(--dim)">{sub}</div></div><div style="width:28px;height:28px;border-radius:14px;background:#ece5d4;display:flex;align-items:center;justify-content:center;color:#7a7368">{ico("chev",14,2.2,"transform:rotate(90deg)")}</div></div>'
    def note(c,ref,verse,txt,d):
        return f'<div class="card" style="margin:0 16px 8px;border-radius:18px;padding:12px 14px 12px 18px;position:relative;overflow:hidden"><i style="position:absolute;left:0;top:0;bottom:0;width:5px;background:{c}"></i><div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font:600 14.5px var(--lora)">{ref}</b><span style="font:500 11px var(--sans);color:var(--dim)">{d}</span></div><div style="font:italic 400 13.5px/1.35 var(--serif);color:#7a7368;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{verse}</div><div style="font:500 14px/1.38 var(--sans);margin-top:5px">{txt}</div></div>'
    body=f'''<div style="position:absolute;left:0;right:0;top:186px">
      {grp('gv','3 note · 2 evidenziati')}
      {note(CW[1],'Gv 3,16','«Poiché Iddio ha tanto amato il mondo…»','L’amore di Dio è un dono, non un premio. Non devo meritarlo.','oggi')}
      {note(CW[0],'Gv 1,1–5','«Nel principio era la Parola…»','Il prologo come una porta: tutto parte dalla Parola.','ven')}
      {grp('sal','2 note')}
      {note(CW[2],'Sal 23,1–2','«Il Signore è il mio pastore, nulla mi mancherà»','Nessuna paura nella valle.','12 nov')}
      {grp('mt','1 nota')}
      {note(CW[4],'Mt 25,14–15','«A uno diede cinque talenti…»','Un talento: circa 20 anni di paga.','3 nov')}</div>'''
    an=f'''<div class="anno" style="left:166px;top:210px;z-index:62">il gruppo si ripiega a molla</div>'''
    return col('12','Quaderno','Le note raggruppate per libro, con la copertina come intestazione.',phone('light',head+body+an,tab='Quaderno'))
