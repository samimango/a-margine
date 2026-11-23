from lib import *
from s1 import phone,col
from s4 import vn
TXT='font:400 19.5px/1.56 var(--serif);color:#2a241b'
CW=['#d6a83c','#c9654a','#7d9470','#6b7f98','#9a4a5a']
def s5():
    head=f'''<div style="position:absolute;left:0;right:0;top:66px;text-align:center"><div class="eyebrow" style="letter-spacing:.32em;color:#a89a7c">Matteo · 25</div></div>
    <div style="position:absolute;left:28px;right:28px;top:100px;text-align:center"><div style="display:flex;justify-content:center">{fleuron('#b8a47a',70)}</div><div style="font:600 14px var(--serif);font-variant-caps:all-small-caps;letter-spacing:.2em;color:#7a6e57;margin-top:9px">La parabola dei talenti</div></div>'''
    body=f'''<div style="position:absolute;left:28px;right:28px;top:174px;{TXT}">{vn(14)}Poiché avverrà come di un uomo il quale, partendo per un viaggio, chiamò i suoi servitori e affidò loro i suoi beni; {vn(15)}e a uno diede cinque <span id="w" style="background:rgba(184,136,46,.26);border-bottom:2px solid #b8882e;border-radius:3px;padding:0 1px">talenti</span>, a un altro due, a un altro uno, a ciascuno secondo la sua capacità; e partì.</div>'''
    pop=f'''<div style="position:absolute;left:18px;top:392px;width:354px;z-index:50;filter:drop-shadow(0 22px 28px rgba(60,40,10,.34))">
      <div style="position:absolute;left:127px;top:-8px;width:18px;height:18px;background:#fffdf9;transform:rotate(45deg);border-radius:3px"></div>
      <div style="position:relative;background:#fffdf9;border-radius:24px;padding:18px 18px 0;box-shadow:0 0 0 .6px rgba(60,45,20,.12)">
        <div style="display:flex;align-items:center;gap:12px"><div style="width:42px;height:42px;border-radius:14px;background:#f1e3c0;color:#8a6414;display:flex;align-items:center;justify-content:center">{ico('scale',24,1.7)}</div>
          <div style="flex:1"><div class="eyebrow" style="color:#8a6414">Misura · peso e valore</div><div style="font:600 24px/1.1 var(--lora);margin-top:2px">Talento</div></div>
          <div style="font:600 11px var(--sans);color:#8a8170;background:#efe9db;border-radius:9px;padding:4px 8px">Mt 25</div></div>
        <div style="margin-top:14px;font:600 25px/1.15 var(--lora);letter-spacing:-.01em;color:#201a12">≈ 34 kg d’argento</div>
        <div style="font:500 14.5px/1.4 var(--sans);color:#6a604d;margin-top:3px">circa 20 anni di paga di un operaio</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:14px;font:600 11.5px var(--sans);color:#5b5444">
          <span style="background:#f1e9d6;border-radius:9px;padding:6px 10px">1 talento</span><span>=</span><span style="background:#f1e9d6;border-radius:9px;padding:6px 10px">60 mine</span><span>=</span><span style="background:#f1e9d6;border-radius:9px;padding:6px 10px">6.000 denari</span></div>
        <div style="margin:16px -18px 0;border-top:.6px solid rgba(60,45,20,.13);height:50px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;font:600 14px var(--sans);color:#8e3a2b"><span style="display:flex;align-items:center;gap:7px">{ico('map',18,1.8)}Mondo della Bibbia</span>{ico('chev',16,2.2)}</div>
      </div></div>'''
    ghost='''<div class="ghost" style="left:98px;top:352px;width:112px;height:34px;border-radius:14px;z-index:55"></div>
    <div class="anno" style="left:222px;top:350px;z-index:62">a molla: nasce dalla parola</div>
    <div class="anno l" style="left:222px;top:376px;z-index:62">0,6× → 1,04× → 1×</div>'''
    pers=f'''<div class="glass" style="position:absolute;left:18px;right:18px;top:668px;height:78px;border-radius:24px;z-index:21;display:flex;align-items:center;gap:14px;padding:0 16px;box-shadow:0 14px 30px -12px rgba(40,25,5,.38),0 0 0 .6px rgba(60,45,20,.12);background:rgba(255,252,245,.8)">
      <div style="width:46px;height:46px;border-radius:50%;background:#4a5663;display:flex;align-items:center;justify-content:center;font:600 22px var(--lora);color:#e8edf0;box-shadow:inset 0 0 0 2px #fff6">A</div>
      <div style="flex:1"><div class="eyebrow" style="color:#4a5663;margin-bottom:1px">Personaggio</div><div style="font:600 17px var(--lora)">Abramo</div><div style="font:500 12px var(--sans);color:var(--dim)">Padre dei credenti · Gn 12</div></div>{ico('chev',16,2.2,'color:#9a917f')}</div>
      <div class="anno l" style="left:116px;top:640px;z-index:62">oppure: scheda personaggio</div>'''
    # dim overlay beneath popover (soft)
    return col('5','Tocca una parola','Una misura antica diventa chiara: peso, valore e un rimando al Mondo della Bibbia.',phone('paper',head+body+'<div style="position:absolute;inset:0;background:rgba(30,20,5,.0)"></div>'+pop+ghost+pers))

def s6():
    ban=f'''<div class="glass" style="position:absolute;left:18px;right:18px;top:62px;height:50px;border-radius:25px;display:flex;align-items:center;gap:12px;padding:0 18px;z-index:21;font:600 12.5px/1.3 var(--sans);color:#3a3226;box-shadow:0 8px 20px -10px rgba(40,25,5,.35),0 0 0 .6px rgba(60,45,20,.12)">{ico('hand',19,1.8,'color:#b45c3a')}Tieni premuto e trascina<br>per selezionare più versetti</div>'''
    tool=f'''<div style="position:absolute;left:22px;top:122px;height:44px;border-radius:22px;background:#231f1a;display:flex;align-items:center;gap:14px;padding:0 16px;z-index:21;box-shadow:0 12px 24px -8px rgba(0,0,0,.5);color:#f3efe8">{ico('copy',19,1.8)}<span style="display:flex;gap:7px">{''.join(f'<i style="width:19px;height:19px;border-radius:50%;background:{c};display:block;box-shadow:inset 0 0 0 1px rgba(255,255,255,.25)"></i>' for c in CW)}</span>{ico('pen',19,1.8)}{ico('share',19,1.8)}</div>
    <div style="position:absolute;left:44px;top:164px;width:14px;height:14px;background:#231f1a;transform:rotate(45deg);z-index:20;border-radius:3px"></div>'''
    H='background:rgba(180,92,58,.2);border-radius:3px;-webkit-box-decoration-break:clone;box-decoration-break:clone;padding:2px 0'
    hs='<i style="position:relative;display:inline-block;width:0;height:0"><b style="position:absolute;left:-1px;top:-18px;width:2px;height:24px;background:#b45c3a"></b><b style="position:absolute;left:-5px;top:-24px;width:10px;height:10px;border-radius:50%;background:#b45c3a"></b></i>'
    he='<i style="position:relative;display:inline-block;width:0;height:0"><b style="position:absolute;left:-1px;top:-18px;width:2px;height:24px;background:#b45c3a"></b><b style="position:absolute;left:-5px;top:4px;width:10px;height:10px;border-radius:50%;background:#b45c3a"></b></i>'
    body=f'''<div style="position:absolute;left:28px;right:28px;top:196px;{TXT.replace('19.5px/1.56','18.5px/1.52')}"><span style="{H}">{hs}{vn(15)}affinché chiunque crede in lui abbia vita eterna.</span>
      <span style="{H}"> {vn(16)}Poiché Iddio ha tanto amato il mondo, che ha dato il suo unigenito Figliuolo, affinché chiunque crede in lui non perisca, ma abbia vita eterna.</span>
      <span style="{H}"> {vn(17)}Poiché Iddio non ha mandato il suo Figliuolo nel mondo per giudicare il mondo, ma perché il mondo sia salvato per mezzo di lui.{he}</span></div>'''
    chip=lambda t:f'<span style="flex:none;height:30px;border-radius:15px;padding:0 10px;display:flex;align-items:center;font:600 11.5px var(--sans);color:#5b4410;background:#f3e7c6;box-shadow:inset 0 0 0 .6px rgba(138,100,20,.3)">{t}</span>'
    ed=f'''<div class="card" style="position:absolute;left:14px;right:14px;top:512px;padding:14px 14px 12px;border-radius:24px;z-index:10;box-shadow:0 18px 34px -14px rgba(60,40,10,.4),0 0 0 .6px var(--line)">
      <div style="display:flex;align-items:center;justify-content:space-between"><div style="display:flex;align-items:center;gap:10px"><span class="eyebrow" style="color:#b45c3a">Nota · Gv 3,15–17</span></div>
        <div style="display:flex;align-items:center;gap:10px"><span style="display:flex;gap:6px">{''.join(f'<i style="width:18px;height:18px;border-radius:50%;background:{c};display:block;{"box-shadow:0 0 0 2px #fffdf9,0 0 0 3.5px "+c if k==1 else ""}"></i>' for k,c in enumerate(CW))}</span>
        <span style="width:30px;height:30px;border-radius:15px;background:#f3e7c6;color:#8a6414;display:flex;align-items:center;justify-content:center">{ico('bulb',17,1.9)}</span></div></div>
      <div style="font:400 18px/1.4 var(--serif);margin:12px 0 12px;color:#2a241b;min-height:50px">L’amore di Dio è un dono, non un premio. Non devo meritarlo<span style="display:inline-block;width:2px;height:19px;background:#b45c3a;vertical-align:-3px;margin-left:1px"></span></div>
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:12px">{chip('Cosa dice?')}{chip('Cosa significa?')}{chip('Cosa cambia per me?')}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;border-top:.6px solid var(--line);padding-top:11px">
        <div style="display:flex;align-items:center;gap:10px"><span style="position:relative;width:38px;height:38px;border-radius:19px;background:#231f1a;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 5px rgba(180,92,58,.16),0 0 0 11px rgba(180,92,58,.07)">{ico('mic',19,1.9)}</span><span style="font:500 12px var(--sans);color:var(--dim);margin-left:8px">Detta la nota</span></div>
        <div class="pill" style="height:36px;padding:0 20px;background:#b45c3a;color:#fff6ec;font-size:13.5px">Salva</div></div></div>'''
    an=f'''<div class="anno" style="left:176px;top:588px;display:none"></div>
    <div class="anno" style="left:206px;top:476px;z-index:62;display:none"></div>
    <div class="anno" style="left:28px;top:468px;z-index:62">la nota si apre sotto il versetto, senza cambiare schermata</div>
    <div class="anno l" style="left:150px;top:742px;z-index:62">una riga sola: la guida resta discreta</div>'''
    return col('6','Nota e guida allo studio','Selezione multipla con maniglie; la lampadina offre tre domande in una riga.',phone('paper',ban+tool+body+ed+an))

def s7():
    back=f'''<div style="position:absolute;inset:0;background:#f6f1e7"><div style="position:absolute;left:28px;right:28px;top:90px;{TXT};opacity:.9">{vn(16)}Poiché Iddio ha tanto amato il mondo, che ha dato il suo unigenito Figliuolo, affinché chiunque crede in lui non perisca, ma abbia vita eterna.</div></div><div style="position:absolute;inset:0;background:rgba(20,14,6,.42);z-index:2"></div>'''
    def tog(l,on,sample=''):
        return f'<div style="display:flex;align-items:center;height:42px;padding:0 16px;border-top:.6px solid var(--line)"><span style="flex:1;font:500 14.5px var(--sans);display:flex;align-items:center;gap:8px">{l}{sample}</span><i class="tog{" on" if on else ""}"></i></div>'
    smp=lambda c,st: f'<span style="font:400 15px var(--serif);border-bottom:{st};border-color:{c};padding-bottom:0;line-height:1.1"><span style="border-bottom:1.5px {st.split()[1]} {c}">Aa</span></span>'
    u=lambda c,t:f'<span style="font:600 12.5px var(--serif);color:#6a604d;border-bottom:1.5px dotted {c};line-height:1.2">{t}</span>'
    sw=lambda bg,lab,sel,inner='':f'<div style="width:78px;text-align:center"><div style="width:58px;height:58px;border-radius:50%;margin:0 auto;background:{bg};position:relative;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(0,0,0,.14){",0 0 0 3px #faf7f0,0 0 0 5px #b45c3a" if sel else ""}">{inner}</div><div style="font:{"700" if sel else "500"} 11.5px var(--sans);margin-top:8px;color:{"#1d1a16" if sel else "#7a7368"}">{lab}</div></div>'
    lines='<div style="position:absolute;left:14px;right:14px;top:19px;height:2px;background:#bbb;border-radius:1px;box-shadow:0 7px 0 #bbb,0 14px 0 #bbb"></div>'
    sheet=f'''<div style="position:absolute;left:0;right:0;top:96px;bottom:0;border-radius:30px 30px 0 0;background:#faf7f0;z-index:10;box-shadow:0 -20px 50px rgba(0,0,0,.35)">
      <div style="width:38px;height:5px;border-radius:3px;background:#d3ccbc;margin:8px auto 0"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 22px 0"><div style="width:44px"></div><div style="font:600 18px var(--lora)">Aspetto della lettura</div><div style="font:600 15px var(--sans);color:#b45c3a;width:44px;text-align:right">Fine</div></div>
      <div style="padding:16px 18px 0">
        <div style="background:#fff;border-radius:18px;padding:12px 16px 14px;box-shadow:0 0 0 .6px var(--line)"><div style="display:flex;justify-content:space-between;font:600 10.5px var(--sans);letter-spacing:.14em;color:var(--dim);text-transform:uppercase"><span>Dimensione</span><span>19 pt</span></div>
          <div style="display:flex;align-items:center;gap:14px;margin-top:8px"><span style="font:500 14px var(--serif)">Aa</span><div style="flex:1;height:30px;position:relative"><div style="position:absolute;left:0;right:0;top:13px;height:4px;border-radius:2px;background:#e4ddcd"></div><div style="position:absolute;left:0;width:58%;top:13px;height:4px;border-radius:2px;background:#b45c3a"></div><div style="position:absolute;left:calc(58% - 14px);top:1px;width:28px;height:28px;border-radius:50%;background:#fff;box-shadow:0 3px 8px rgba(0,0,0,.3),0 0 0 .6px rgba(0,0,0,.1)"></div></div><span style="font:500 27px/1 var(--serif)">Aa</span></div></div>
        <div style="display:flex;gap:10px;margin-top:10px">
          <div style="flex:1;border-radius:18px;background:#fff;padding:10px 14px;box-shadow:0 0 0 2px #b45c3a;display:flex;align-items:center;gap:12px"><span style="font:500 34px/1 var(--serif);color:#2a241b">Aa</span><div><div style="font:600 14px var(--sans)">Libro</div><div style="font:400 11px var(--sans);color:var(--dim)">Crimson</div></div></div>
          <div style="flex:1;border-radius:18px;background:#fff;padding:10px 14px;box-shadow:0 0 0 .6px var(--line);display:flex;align-items:center;gap:12px"><span style="font:500 30px/1 var(--sans);color:#2a241b">Aa</span><div><div style="font:600 14px var(--sans)">Moderno</div><div style="font:400 11px var(--sans);color:var(--dim)">Inter</div></div></div></div>
        <div style="display:flex;gap:4px;margin-top:10px;background:#ece6d7;border-radius:13px;padding:3px">
          {''.join(f'<div style="flex:1;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:8px;font:600 12.5px var(--sans);{"background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.16)" if k==1 else "color:#7a7368"}"><span style="display:flex;flex-direction:column;gap:{g}px"><i style="display:block;width:16px;height:1.8px;background:currentColor"></i><i style="display:block;width:16px;height:1.8px;background:currentColor"></i><i style="display:block;width:16px;height:1.8px;background:currentColor"></i></span>{t}</div>' for k,(t,g) in enumerate([('Stretta',2),('Normale',3.5),('Ampia',5.5)]))}</div>
        <div style="display:flex;justify-content:space-between;margin:16px 0 0">
          {sw('#fff','Chiaro',False,lines)}{sw('#f6f1e7','Carta',True,lines.replace('#bbb','#c9bda2'))}{sw('#000','Scuro',False,lines.replace('#bbb','#555'))}{sw('linear-gradient(110deg,#f6f1e7 50%,#000 50%)','Sera auto',False,'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#b8882e">'+ico('moon',22,1.9,'color:#e8d9aa;margin-left:14px')+'</div>')}</div>
        <div style="margin-top:14px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 0 0 .6px var(--line)">
          {tog('Numeri dei versetti',True).replace('border-top:.6px solid var(--line)','')}{tog('Capolettera',True)}{tog('Titoletti di sezione',True)}{tog('Note nel testo',True)}
          {tog('Sottolinea misure',True,u('#b8882e','talento'))}{tog('Sottolinea luoghi',True,u('#8e3a2b','Betania'))}{tog('Sottolinea personaggi',False,u('#4a5663','Abramo'))}</div>
      </div></div>'''
    return col('7','Impostazioni di lettura','Foglio dal basso: testo, carattere, interlinea, tema e sottolineature a scelta.',phone('paper',back+sheet,home=True))

def s8():
    head='<div style="position:absolute;left:20px;right:20px;top:62px"><div class="lg" style="font-size:33px">Mondo della Bibbia</div></div>'
    mp=f'''<div style="position:absolute;left:16px;right:16px;top:116px;height:360px;border-radius:26px;overflow:hidden;box-shadow:0 18px 30px -16px rgba(60,40,10,.45),0 0 0 .6px rgba(60,45,20,.25)">{mapsvg(358,360,'30 15 300 290')}
      <div style="position:absolute;left:12px;top:12px;display:flex;gap:6px"><span class="glass" style="height:28px;border-radius:14px;padding:0 11px;display:flex;align-items:center;font:600 11.5px var(--sans);background:rgba(250,246,238,.75)">Tempo di Gesù</span></div>
      <div class="glass" style="position:absolute;right:12px;top:12px;width:28px;height:28px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(250,246,238,.75)">{ico('search',15,2)}</div>
      <div style="position:absolute;left:12px;width:226px;bottom:12px;height:54px;border-radius:18px;background:rgba(255,253,249,.94);display:flex;align-items:center;gap:12px;padding:0 14px;box-shadow:0 8px 20px -8px rgba(0,0,0,.35)"><div style="width:34px;height:34px;border-radius:11px;background:#f3dcd4;color:#8e3a2b;display:flex;align-items:center;justify-content:center">{ico('pin',19,1.9)}</div><div style="flex:1"><div style="font:600 15.5px var(--lora)">Gerusalemme</div><div style="font:500 11.5px var(--sans);color:var(--dim)">Città del tempio</div></div>{ico('chev',15,2.2,'color:#9a917f')}</div></div>
    <div class="anno" style="left:20px;top:162px;z-index:62">i punti pulsano all’apertura</div>'''
    def card(ic,t,l,c,bg,inner=''):
        return f'<div class="card" style="padding:13px 14px;height:96px;position:relative;overflow:hidden;border-radius:20px"><div style="width:32px;height:32px;border-radius:11px;background:{bg};color:{c};display:flex;align-items:center;justify-content:center">{ico(ic,18,1.8)}</div><div style="font:600 15px var(--lora);margin-top:8px">{t}</div><div style="font:500 11.5px/1.35 var(--sans);color:var(--dim);margin-top:1px">{l}</div>{inner}</div>'
    cards=f'''<div style="position:absolute;left:16px;right:16px;top:492px;display:grid;grid-template-columns:1fr 1fr;gap:10px">
      {card('pin','Luoghi','Città, monti e mari','#8e3a2b','#f3dcd4')}
      {card('scale','Misure e monete','Talento, siclo, cubito','#8a6414','#f1e3c0')}
      {card('clock','Il tempo','Ore del giorno e feste','#4a5663','#e2e7eb')}
      {card('person','Personaggi','Da Abramo a Paolo','#4d6444','#e0e9d8')}</div>
      <div style="position:absolute;left:0;right:0;top:724px;text-align:center;font:500 10.5px var(--sans);color:#9a917f">Dati luoghi: OpenBible.info (CC BY)</div>'''
    return col('8','Mondo della Bibbia','Una mappa disegnata per l’app, con luoghi, misure, tempo e personaggi.',phone('light',head+mp+cards,tab='Leggi'))
