from lib import *
from s1 import phone,col
TXT='font:400 19.5px/1.56 var(--serif);color:#2a241b'
def vn(n): return f'<sup style="font:600 9.5px var(--sans);color:#b9a98a;margin-right:3px;vertical-align:5px;letter-spacing:.02em">{n}</sup>'
def s4():
    ribbon=f'''<svg style="position:absolute;right:44px;top:50px;z-index:35;filter:drop-shadow(0 6px 5px rgba(80,20,10,.3))" width="30" height="96" viewBox="0 0 30 96"><defs><linearGradient id="rb" x1="0" x2="1"><stop offset="0" stop-color="#8f2a24"/><stop offset=".5" stop-color="#b13a2f"/><stop offset="1" stop-color="#8a2822"/></linearGradient></defs><path d="M0 0H30V96L15 82L0 96Z" fill="url(#rb)"/><path d="M4 0V88M26 0V88" stroke="#e8a090" stroke-opacity=".25" stroke-width=".8"/></svg>
    <div class="anno" style="right:84px;top:82px;z-index:61">animato: scende dall’alto con un lieve rimbalzo</div>
    <svg class="arrow" style="right:56px;top:96px;z-index:61" width="12" height="30" viewBox="0 0 12 30" fill="none" stroke="#cf4a2a" stroke-width="2" stroke-linecap="round"><path d="M6 2V26M2 21l4 6 4-6"/></svg>'''
    head=f'''<div style="position:absolute;left:0;right:0;top:66px;text-align:center"><div class="eyebrow" style="letter-spacing:.32em;color:#a89a7c">Giovanni</div></div>
    <div style="position:absolute;left:28px;right:28px;top:96px;text-align:center">
      <div style="font:600 118px/0.9 var(--serif);color:#b45c3a;letter-spacing:-.02em;font-feature-settings:'lnum'">1</div>
      <div style="display:flex;justify-content:center;margin-top:2px">{fleuron('#b8a47a',92)}</div>
      <div style="font:600 14px var(--serif);font-variant-caps:all-small-caps;letter-spacing:.2em;color:#7a6e57;margin-top:12px">La Parola fatta carne</div></div>'''
    body=f'''<div style="position:absolute;left:28px;right:28px;top:318px;{TXT}">
      <div style="float:left;font:600 86px/70px var(--serif);color:#b45c3a;margin:7px 9px 0 -2px;padding-top:2px">N</div>
      <span style="font-feature-settings:'smcp';font-variant-caps:all-small-caps;letter-spacing:.04em">el principio</span> era la Parola, e la Parola era con Dio, e la Parola era Dio.
      {vn(2)}Essa era nel principio con Dio. {vn(3)}Ogni cosa è stata fatta per mezzo di lei; e senza di lei neppure una delle cose fatte è stata fatta.
      <span style="background:linear-gradient(180deg,transparent 8%,rgba(214,168,60,.38) 8%,rgba(214,168,60,.38) 96%,transparent 96%);border-radius:3px;padding:2px 0;-webkit-box-decoration-break:clone;box-decoration-break:clone">{vn(4)}In lei era la vita; e la vita era la luce degli uomini;</span>
      {vn(5)}la luce splende nelle tenebre, e le tenebre non l’hanno ricevuta.</div>
      <div style="position:absolute;left:28px;right:28px;top:612px;text-align:center;color:#c2b393;letter-spacing:.6em;font:400 14px var(--serif);">· · ·</div>
      <div style="position:absolute;left:28px;right:28px;top:640px;{TXT}">{vn(28)}Queste cose avvennero in <span style="border-bottom:1.5px dotted rgba(142,58,43,.55);padding-bottom:1px">Betania</span>, di là dal Giordano, dove Giovanni battezzava.</div>
      <div class="anno l" style="left:36px;top:742px;z-index:61">luoghi: sottolineatura punteggiata, appena visibile</div>
      <div style="position:absolute;left:0;right:0;bottom:24px;text-align:center;font:600 10px var(--sans);letter-spacing:.14em;color:#b3a688;display:none">GIOVANNI 1 · 3 MIN</div>'''
    ann2=f'''<div class="anno" style="left:34px;top:790px;display:none"></div>
    <div style="position:absolute;left:0;right:0;top:786px;display:flex;justify-content:center"><div class="anno" style="position:static">immersivo: barre nascoste, un tocco le mostra</div></div>'''
    return col('4','Lettura editoriale','Capolettera, titoletto in maiuscoletto, numeri discreti, segnalibro a nastro.',phone('paper',ribbon+head+body+ann2))
