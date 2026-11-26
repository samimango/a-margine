"""Ascolta: voce (scelta, prova), lettura con speechSynthesis finto, evidenziazione, pausa, capitolo dopo, foglio, impostazioni."""
import time
from harness import *
from t_reader import tap_verse

MOCK = """(()=>{
 const voices=[
  {name:'Samantha',lang:'en-US',voiceURI:'sam',localService:true,default:false},
  {name:'Google italiano',lang:'it-IT',voiceURI:'gi',localService:false,default:false},
  {name:'Alice',lang:'it-IT',voiceURI:'alice',localService:true,default:false},
  {name:'Federica (Migliorata)',lang:'it-IT',voiceURI:'fed-enh',localService:true,default:false}];
 const ls={}; let list=[]; window.__spoken=[]; window.__cancels=0; window.__speakMs=40; window.__hang=false; window.__noStart=false; window.__syncSpeaks=[]; window.__inClick=false;
 document.addEventListener('click',()=>{window.__inClick=true;setTimeout(()=>{window.__inClick=false},0)},true);
 class U{constructor(t){this.text=t;this.rate=1;this.pitch=1;this.volume=1;this.voice=null;this.lang=''}}
 let cur=null,timer=0,queue=[];
 const syn={speaking:false,paused:false,pending:false,getVoices:()=>list,
  addEventListener(e,f){(ls[e]=ls[e]||[]).push(f)},removeEventListener(e,f){ls[e]=(ls[e]||[]).filter(x=>x!==f)},
  speak(u){window.__syncSpeaks.push(Boolean(window.__inClick));queue.push(u);if(!cur)next()},
  cancel(){window.__cancels++;clearTimeout(timer);queue=[];const c=cur;cur=null;syn.speaking=false;if(c&&c.onerror)setTimeout(()=>c.onerror({error:'canceled'}),0)},
  pause(){syn.paused=true},resume(){syn.paused=false}};
 function next(){cur=queue.shift();if(!cur){syn.speaking=false;return}syn.speaking=true;
  if(cur.volume!==0)window.__spoken.push({text:cur.text,voice:cur.voice&&cur.voice.name,rate:cur.rate,pitch:cur.pitch,lang:cur.lang});
  const c=cur; if(!window.__noStart&&c.onstart)setTimeout(()=>c.onstart({}),5); if(window.__hang&&!c.text.startsWith('Giovanni, ')&&!c.text.startsWith('Salmi, '))return;
  timer=setTimeout(()=>{if(cur!==c)return;cur=null;c.onend&&c.onend({});next()},window.__speakMs)}
 Object.defineProperty(window,'speechSynthesis',{value:syn,configurable:true});window.SpeechSynthesisUtterance=U;
 setTimeout(()=>{list=voices;(ls.voiceschanged||[]).forEach(f=>f({}))},300);
})()"""

def wait_js(pg, expr, timeout=5000):
    """wait_for_function usa eval e la CSP dell'app lo vieta: si interroga la pagina a intervalli"""
    t0 = time.time()
    while time.time() - t0 < timeout / 1000:
        if pg.evaluate(expr): return
        pg.wait_for_timeout(60)
    raise AssertionError('timeout: ' + expr[:90])

def spoken(pg): return pg.evaluate('window.__spoken')
def cls_verse(pg): return pg.evaluate("[...document.querySelectorAll('.f-ascolta-now')].map(e=>Number(e.dataset.n))")
def new(env, dev, **kw): return env.new(dev, init=MOCK, **kw)
def settings(pg):
    pg.click('#settingsBtn'); pg.wait_for_selector('#ascoltaVoceRow')

@test()
def voce_elenco_scelta_prova(env, dev):
    pg = new(env, dev); settings(pg)
    check('Voce per la lettura' in pg.inner_text('#ascoltaVoceRow'))
    check('Impostazioni iPhone › Accessibilità › Contenuto letto › Voci › Italiano' in pg.inner_text('[data-section="Ascolto"]'))
    wait_js(pg, "document.querySelector('#ascoltaVoceRow small').textContent.includes('Federica')")
    pg.click('#ascoltaVoceRow'); pg.wait_for_selector('.f-ascolta-voice')
    names = pg.eval_on_selector_all('.f-ascolta-voice-t b', 'e=>e.map(x=>x.textContent)')
    eq(names, ['Federica (Migliorata)', 'Alice', 'Google italiano'], 'ordine delle voci (Samantha esclusa)')
    check('Migliorata' in pg.inner_text('.f-ascolta-voice >> nth=0 >> small'))
    eq(pg.locator('.f-ascolta-voice.on').count(), 1)
    shot(pg, f'ascolta_voci_{dev}')
    pg.click('[aria-label="Prova la voce Alice"]'); pg.wait_for_timeout(300)
    eq(spoken(pg)[-1]['voice'], 'Alice'); check('pastore' in spoken(pg)[-1]['text'])
    pg.click('.f-ascolta-voice[data-voice="Alice"] .f-ascolta-voice-pick'); pg.wait_for_timeout(100)
    eq(lsj(pg, 'margine.ascolta.voice')['name'], 'Alice')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    check('Alice' in pg.inner_text('#ascoltaVoceRow'))
    for b in pg.query_selector_all('.f-ascolta-try') or []: pass

@test('phone')
def voce_target_44(env, dev):
    pg = new(env, dev); settings(pg); pg.wait_for_timeout(400); pg.click('#ascoltaVoceRow'); pg.wait_for_selector('.f-ascolta-voice')
    small = pg.evaluate("[...document.querySelectorAll('.f-ascolta-sheet .sheet-box button, .sheet-box .f-ascolta-voice button')].filter(b=>b.offsetParent).map(b=>[b.textContent.trim()||b.getAttribute('aria-label'),b.getBoundingClientRect().height]).filter(x=>x[1]<43)")
    check(not [s for s in small if s[0] not in ('Chiudi',)], str(small))

@test()
def lettura_avanza_evidenzia_pausa(env, dev):
    pg = new(env, dev); open_ref(pg, 42, 3, 1)
    tap_verse(pg, 2); pg.click('[data-action="ascolta"]'); pg.wait_for_selector('#ascoltaMini:not([hidden])')
    wait_js(pg, 'window.__spoken.length>=2')
    eq(spoken(pg)[0]['text'], 'Giovanni, capitolo 3', 'annuncio sincrono nel gesto')
    s = spoken(pg)[1]
    eq(s['voice'], 'Federica (Migliorata)'); eq(s['lang'], 'it-IT'); eq(s['pitch'], 1); check(abs(s['rate'] - 0.92) < 1e-6, str(s['rate']))
    check(s['text'].startswith('Giovanni 3 versetto 2'), s['text']); check(not s['text'].startswith('2 '), 'niente numero del versetto')
    wait_js(pg, "document.querySelector('#v3.f-ascolta-now')"); eq(cls_verse(pg), [3])
    check('Giovanni 3' in pg.inner_text('#ascoltaMini'))
    shot(pg, f'ascolta_lettore_{dev}')
    # pausa
    pg.click('#ascoltaMini [data-act=toggle]'); pg.wait_for_timeout(250)
    eq(pg.get_attribute('#ascoltaMini [data-act=toggle]', 'aria-label'), 'Riprendi'); n = len(spoken(pg)); pg.wait_for_timeout(900)
    eq(len(spoken(pg)), n, 'in pausa non parla')
    pg.click('#ascoltaMini [data-act=toggle]'); wait_js(pg, f'window.__spoken.length>{n}')
    eq(pg.get_attribute('#ascoltaMini [data-act=toggle]', 'aria-label'), 'Pausa')
    # versetto successivo
    pg.click('#ascoltaMini [data-act=next]'); pg.wait_for_timeout(250)
    check(len(cls_verse(pg)) == 1 and cls_verse(pg)[0] >= 5, str(cls_verse(pg)))
    # stop
    pg.click('#ascoltaMini [data-act=stop]'); pg.wait_for_timeout(200)
    check(pg.evaluate("document.getElementById('ascoltaMini').hidden")); eq(cls_verse(pg), [])
    n = len(spoken(pg)); pg.wait_for_timeout(500); eq(len(spoken(pg)), n)

@test('phone')
def capitolo_dopo_e_interruttore(env, dev):
    pg = new(env, dev); open_ref(pg, 42, 3, 29)
    pg.evaluate("window.__speakMs=15")
    tap_verse(pg, 29); pg.click('[data-action="ascolta"]')
    wait_js(pg, "window.__spoken.some(s=>s.text.startsWith('Giovanni 4 versetto 1 '))", timeout=9000)
    wait_js(pg, "document.querySelector('#scr-leggi #v2.f-ascolta-now')", timeout=9000)   # la pausa tra versetti è variabile: si attende, non si dorme
    eq(lsj(pg, 'margine.pos')[:2], [42, 4], 'il lettore segue il capitolo')
    pg.click('#ascoltaMini [data-act=stop]')
    # senza «continua al capitolo dopo» si ferma alla fine
    pg2 = new(env, dev, storage={'margine.ascolta.next': '0', 'margine.pos': json.dumps([42, 3, 29])})
    pg2.evaluate("window.__speakMs=15"); open_ref(pg2, 42, 3, 29); tap_verse(pg2, 29); pg2.click('[data-action="ascolta"]')
    wait_js(pg2, "document.getElementById('ascoltaMini').hidden", timeout=9000)
    check(not any(s['text'].startswith('Giovanni 4') for s in spoken(pg2)))
    check('Lettura finita' in pg2.inner_text('#toast'))

@test()
def foglio_ascolta_controlli(env, dev):
    pg = new(env, dev); open_ref(pg, 42, 3, 1); tab(pg, 'oggi')
    pg.wait_for_selector('.hero-btns .pill.glass-btn'); check('Ascolta' in pg.inner_text('.hero-btns'))
    pg.click('.hero-btns .pill.glass-btn'); pg.wait_for_selector('.f-ascolta-sheet .f-ascolta-cover .cover'); pg.wait_for_timeout(500)
    bg = pg.evaluate("getComputedStyle(document.querySelector('.f-ascolta-sheet .sheet-box')).backgroundColor"); eq(bg, 'rgb(0, 0, 0)', 'nero puro')
    check('Giovanni 3' in pg.inner_text('.f-ascolta-title')); check(pg.is_hidden('#ascoltaMini'))
    shot(pg, f'ascolta_foglio_{dev}')
    # velocità
    pg.click('[data-speed="1.5"]'); wait_js(pg, "window.__spoken.length && window.__spoken[window.__spoken.length-1].rate>1.3")
    eq(ls(pg, 'margine.ascolta.rate'), '1.5'); eq(pg.get_attribute('[data-speed="1.5"]', 'aria-pressed'), 'true')
    check(abs(spoken(pg)[-1]['rate'] - 0.92 * 1.5) < 1e-6)
    # timer
    pg.click('[data-timer="15"]'); check('Si ferma tra circa 15 min' in pg.inner_text('.f-ascolta-note'))
    pg.click('[data-timer="0"]'); check(pg.inner_text('.f-ascolta-note') == '')
    # interruttore capitolo dopo
    eq(pg.get_attribute('#ascoltaNext', 'aria-checked'), 'true'); pg.click('#ascoltaNext'); eq(pg.get_attribute('#ascoltaNext', 'aria-checked'), 'false'); eq(ls(pg, 'margine.ascolta.next'), '0')
    # versetto successivo / precedente dal foglio
    pg.evaluate('window.__speakMs=400')   # versetti lunghi: la lettura automatica non avanza durante il test
    pg.click('#ascoltaNextV'); pg.wait_for_timeout(300)
    n1 = pg.input_value('.f-ascolta-range'); pg.click('#ascoltaPrev'); pg.wait_for_timeout(300)
    check(int(pg.input_value('.f-ascolta-range')) < int(n1))
    # scelta voce dalla vista interna
    pg.click('#ascoltaVoiceBtn'); pg.wait_for_selector('.f-ascolta-voices:not([hidden]) .f-ascolta-voice')
    pg.click('.f-ascolta-voice[data-voice="Alice"] .f-ascolta-voice-pick'); pg.click('.f-ascolta-back'); check('Alice' in pg.inner_text('#ascoltaVoiceBtn'))
    # Esc chiude il foglio, resta il mini-player
    pg.keyboard.press('Escape'); pg.wait_for_selector('#ascoltaMini:not([hidden])'); check(pg.locator('.f-ascolta-sheet').count() == 0)
    shot(pg, f'ascolta_mini_oggi_{dev}')
    # riapre dal mini-player e ferma da Pausa
    pg.click('#ascoltaMini .f-ascolta-mini-open'); pg.wait_for_selector('.f-ascolta-sheet'); pg.click('.f-ascolta-big'); pg.wait_for_timeout(200)
    eq(pg.get_attribute('.f-ascolta-big', 'aria-label'), 'Riprendi')

@test('phone')
def temi_foglio_e_mini(env, dev):
    for th in ('light', 'paper', 'dark'):
        pg = new(env, dev, storage={'margine.theme': th}); open_ref(pg, 42, 3, 1); tab(pg, 'oggi')
        pg.click('.hero-btns .pill.glass-btn'); pg.wait_for_selector('.f-ascolta-sheet .cover'); pg.wait_for_timeout(400)
        eq(pg.evaluate("getComputedStyle(document.querySelector('.f-ascolta-sheet .sheet-box')).backgroundColor"), 'rgb(0, 0, 0)')
        shot(pg, f'ascolta_foglio_{th}')
        pg.keyboard.press('Escape'); pg.wait_for_selector('#ascoltaMini:not([hidden])'); shot(pg, f'ascolta_mini_{th}')
        pg.context.close()

@test()
def ripresa_dopo_visibilitychange(env, dev):
    pg = new(env, dev); open_ref(pg, 42, 3, 1); tap_verse(pg, 4)
    pg.evaluate("window.__hang=true"); pg.click('[data-action="ascolta"]'); wait_js(pg, 'window.__spoken.length>=2')
    first = spoken(pg)[1]['text']; n = len(spoken(pg))
    pg.evaluate("window.__hang=false; window.__noStart=false; window.__syncSpeaks=[]; speechSynthesis.speaking=false; document.dispatchEvent(new Event('visibilitychange'))")
    wait_js(pg, f'window.__spoken.length>{n}'); eq(spoken(pg)[n]['text'], first, 'riprende dalla stessa frase')

@test()
def testo_da_leggere_e_pezzi(env, dev):
    pg = new(env, dev)
    r = pg.evaluate("""import('/js/features/ascolta.js').then(m=>({
      a: m.speakable('Sig. SIGNORE disse (v. 5): «Vieni» — presto'),
      b: m.splitParts('Poiché Dio ha tanto amato il mondo; che ha dato il suo unigenito Figliuolo: affinché chiunque crede in lui non perisca, ma abbia vita eterna, e '+'parola '.repeat(60)),
      c: m.splitParts('Breve versetto.'), d: m.splitParts('')}))""")
    check('SIGNORE' not in r['a'] and 'Signore' in r['a'] and 'versetto 5' in r['a'] and '«' not in r['a'], r['a'])
    check(len(r['b']) >= 3 and all(len(x) <= 240 for x in r['b']), str([len(x) for x in r['b']]))
    check(r['b'][0][-1] in ';:' and len(r['b'][0]) > 60, r['b'][0]); eq(r['c'], ['Breve versetto.']); eq(r['d'], [])

@test('phone')
def senza_speech_non_si_rompe(env, dev):
    pg = env.new(dev, init="delete window.speechSynthesis; Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true}); window.SpeechSynthesisUtterance=undefined;")
    pg.wait_for_selector('.hero-btns .pill.glass-btn'); pg.click('.hero-btns .pill.glass-btn'); pg.wait_for_timeout(300)
    check('non può leggere' in pg.inner_text('#toast')); settings(pg); check('Non disponibile' in pg.inner_text('#ascoltaVoceRow'))


def silent_toast(pg): return pg.is_visible('#toast') and 'togli il silenzioso' in pg.inner_text('#toast')
def sync_ok(pg): return pg.evaluate('window.__syncSpeaks')

@test('phone')
def prima_speak_sincrona_in_ogni_percorso(env, dev):
    pg = new(env, dev); open_ref(pg, 42, 3, 1)
    # 1) azione sul versetto
    tap_verse(pg, 2); pg.click('[data-action="ascolta"]'); wait_js(pg, 'window.__syncSpeaks.length>=1')
    check(sync_ok(pg)[0] is True, 'versetto: speak() fuori dal gesto'); pg.click('#ascoltaMini [data-act=stop]')
    # 2) pulsante cuffie in Leggi (a metà capitolo: la scelta del menu è il gesto)
    pg.evaluate('window.__syncSpeaks=[]'); pg.click('#topAct-ascolta'); pg.click('#ascoltaChoice [data-from=here]'); wait_js(pg, 'window.__syncSpeaks.length>=1')
    check(sync_ok(pg)[0] is True, 'cuffie: speak() fuori dal gesto'); pg.click('#ascoltaMini [data-act=stop]') if pg.is_visible('#ascoltaMini') else None
    # 3) Oggi (pagina nuova: da capo il menu non serve)
    pg3 = new(env, dev); open_ref(pg3, 42, 3, 1); tab(pg3, 'oggi'); pg3.evaluate('window.__syncSpeaks=[]')
    pg3.click('.hero-btns .pill.glass-btn'); wait_js(pg3, 'window.__syncSpeaks.length>=1')
    check(sync_ok(pg3)[0] is True, 'Oggi: speak() fuori dal gesto')
    # le voci possono non essere ancora caricate: parla comunque in it-IT
    pg2 = env.new(dev, init=MOCK.replace("setTimeout(()=>{list=voices;", "setTimeout(()=>{list=voices;window.__late=1;").replace("},300);", "},60000);"))
    open_ref(pg2, 42, 3, 1); tap_verse(pg2, 2); pg2.click('[data-action="ascolta"]'); wait_js(pg2, 'window.__spoken.length>=2')
    eq(spoken(pg2)[0]['lang'], 'it-IT'); check(spoken(pg2)[0]['voice'] in (None, ''), str(spoken(pg2)[0]))
    eq(spoken(pg2)[1]['lang'], 'it-IT')

@test('phone')
def cuffie_capitolo_intero_e_menu(env, dev):
    pg = new(env, dev); open_ref(pg, 42, 3, 1)
    box = pg.eval_on_selector('#topAct-ascolta', 'e=>{const r=e.getBoundingClientRect();return [r.width,r.height]}')
    check(box[0] >= 44 and box[1] >= 44, str(box)); eq(pg.get_attribute('#topAct-ascolta', 'aria-label'), 'Ascolta il capitolo')
    check(pg.evaluate("document.documentElement.scrollWidth<=innerWidth+1")); shot(pg, f'ascolta_leggi_cuffie_{dev}')
    # all'inizio: parte dal versetto 1 e apre il foglio, senza menu
    pg.click('#topAct-ascolta'); pg.wait_for_selector('.f-ascolta-sheet'); check(pg.locator('#ascoltaChoice').count() == 0)
    wait_js(pg, 'window.__spoken.length>=2'); check(spoken(pg)[1]['text'].startswith('Giovanni 3 versetto 1'), spoken(pg)[1]['text'])
    pg.keyboard.press('Escape'); pg.wait_for_selector('#ascoltaMini:not([hidden])'); pg.click('#ascoltaMini [data-act=stop]')
    # a metà capitolo: mini-menu con due scelte
    pg2 = new(env, dev); open_ref(pg2, 42, 3, 5)
    pg2.click('#topAct-ascolta'); pg2.wait_for_selector('#ascoltaChoice')
    txt = pg2.inner_text('#ascoltaChoice'); check('Dall’inizio del capitolo' in txt and 'Da qui (v. 5)' in txt, txt)
    for b in pg2.query_selector_all('#ascoltaChoice button'):
        bb = b.bounding_box(); check(bb['height'] >= 44, str(bb))
    shot(pg2, f'ascolta_menu_{dev}')
    pg2.click('#ascoltaChoice [data-from=here]'); pg2.wait_for_selector('.f-ascolta-sheet'); wait_js(pg2, 'window.__spoken.length>=2')
    check(spoken(pg2)[1]['text'].startswith('Giovanni 3 versetto 5'), spoken(pg2)[1]['text'])
    # «Ricomincia il capitolo» dal foglio
    pg2.click('#ascoltaRestart'); wait_js(pg2, "window.__spoken.some((s,i)=>i>1&&s.text.startsWith('Giovanni 3 versetto 1 '))")
    check('togli il silenzioso' in pg2.inner_text('.f-ascolta-silent'))
    shot(pg2, f'ascolta_foglio_aiuto_{dev}')
    # da capo: «Dall'inizio» dal menu
    pg3 = new(env, dev); open_ref(pg3, 42, 3, 7); pg3.click('#topAct-ascolta'); pg3.wait_for_selector('#ascoltaChoice')
    pg3.click('#ascoltaChoice [data-from=start]'); wait_js(pg3, 'window.__spoken.length>=2')
    check(spoken(pg3)[1]['text'].startswith('Giovanni 3 versetto 1 '), spoken(pg3)[1]['text'])
    # Oggi offre lo stesso menu quando non si è all'inizio
    pg4 = new(env, dev); open_ref(pg4, 42, 3, 9); tab(pg4, 'oggi'); pg4.click('.hero-btns .pill.glass-btn'); pg4.wait_for_selector('#ascoltaChoice')
    check('Da qui (v. 9)' in pg4.inner_text('#ascoltaChoice'))

@test('phone')
def avviso_se_onstart_non_arriva(env, dev):
    pg = new(env, dev); open_ref(pg, 42, 3, 1)
    pg.evaluate('window.__noStart=true'); tap_verse(pg, 2); pg.click('[data-action="ascolta"]')
    pg.wait_for_timeout(1500); check(not silent_toast(pg), 'troppo presto')
    wait_js(pg, "document.getElementById('toast').textContent.includes('Non senti nulla? Su iPhone togli il silenzioso (tasto laterale) e alza il volume.')", timeout=3000)
    shot(pg, f'ascolta_avviso_silenzioso_{dev}')
    # una volta per sessione: un secondo avvio non lo ripete
    pg.click('#ascoltaMini [data-act=stop]'); pg.wait_for_timeout(5500)
    tap_verse(pg, 3); pg.click('[data-action="ascolta"]'); pg.wait_for_timeout(2600)
    check(not silent_toast(pg), 'ripetuto')
    # con onstart regolare non compare
    pg2 = new(env, dev); open_ref(pg2, 42, 3, 1); tap_verse(pg2, 2); pg2.click('[data-action="ascolta"]'); pg2.wait_for_timeout(2600)
    check(not silent_toast(pg2))

@test('phone')
def onend_mancante_non_blocca(env, dev):
    pg = new(env, dev); open_ref(pg, 42, 3, 1); tap_verse(pg, 2)
    pg.evaluate('window.__hang=true'); pg.click('[data-action="ascolta"]'); wait_js(pg, 'window.__spoken.length>=2')
    # pausa e ripresa con onend che non arriva
    pg.click('#ascoltaMini [data-act=toggle]'); pg.wait_for_timeout(200); eq(pg.get_attribute('#ascoltaMini [data-act=toggle]', 'aria-label'), 'Riprendi')
    n = len(spoken(pg)); pg.click('#ascoltaMini [data-act=toggle]'); wait_js(pg, f'window.__spoken.length>{n}')
    eq(spoken(pg)[n]['text'], spoken(pg)[n - 1]['text'], 'riprende dalla stessa frase')
    # versetto successivo con onend che non arriva
    v0 = cls_verse(pg)[0]; pg.click('#ascoltaMini [data-act=next]'); pg.wait_for_timeout(400)
    check(cls_verse(pg)[0] > v0, str(cls_verse(pg)))


def mock_voices(js):
    """Stessa finta speechSynthesis di MOCK, con un elenco di voci diverso"""
    a = MOCK.index('const voices=['); b = MOCK.index('];', a) + 2
    return MOCK[:a] + 'const voices=[' + js + '];' + MOCK[b:]

RANK = """{name:'Alice',lang:'it-IT',voiceURI:'com.apple.voice.compact.it-IT.Alice',localService:true,default:false},
  {name:'Luca',lang:'it-IT',voiceURI:'com.apple.voice.enhanced.it-IT.Luca',localService:true,default:false},
  {name:'Google italiano',lang:'it-IT',voiceURI:'gi',localService:false,default:false},
  {name:'Microsoft Elsa Online (Natural)',lang:'it-IT',voiceURI:'els',localService:false,default:false},
  {name:'eSpeak Italian',lang:'it',voiceURI:'espeak-it',localService:true,default:false}"""

@test('phone')
def ordine_voci_per_qualita(env, dev):
    pg = env.new(dev, init=mock_voices(RANK)); settings(pg)
    wait_js(pg, "document.querySelector('#ascoltaVoceRow small').textContent.includes('Luca')")
    names = pg.evaluate("import('/js/features/ascolta.js').then(m=>m.itVoices().map(v=>v.name))")
    eq(names, ['Luca', 'Microsoft Elsa Online (Natural)', 'Google italiano', 'Alice'], 'Premium/Enhanced, poi Natural, Google, compact ultima; eSpeak esclusa')
    check(pg.evaluate("import('/js/features/ascolta.js').then(m=>m.hasEnhancedVoice())"))
    pg.click('#ascoltaVoceRow'); pg.wait_for_selector('.f-ascolta-voice')
    check('Compatta' in pg.inner_text('.f-ascolta-voice[data-voice="Alice"]'), 'etichetta della compact')
    check(pg.locator('#ascoltaTip').count() == 0, 'con Luca enhanced niente riquadro')

@test('phone')
def senza_premium_mostra_come_scaricarla(env, dev):
    voci = RANK.replace("{name:'Luca',lang:'it-IT',voiceURI:'com.apple.voice.enhanced.it-IT.Luca',localService:true,default:false},", "")
    pg = env.new(dev, init=mock_voices(voci)); settings(pg)
    wait_js(pg, "document.querySelector('#ascoltaVoceRow small').textContent.includes('Elsa')")
    check(not pg.evaluate("import('/js/features/ascolta.js').then(m=>m.hasEnhancedVoice())"))
    pg.click('#ascoltaVoceRow'); pg.wait_for_selector('#ascoltaTip')
    tip = pg.inner_text('#ascoltaTip')
    check('Impostazioni › Accessibilità › Contenuto letto › Voci › Italiano' in tip and 'Premium' in tip and 'Avanzata' in tip and 'riapri' in tip, tip)
    check('Per una voce più naturale' in tip)
    check(pg.locator('#ascoltaTip ~ .f-ascolta-voice').count() >= 1, 'il riquadro sta sopra l’elenco')
    shot(pg, f'ascolta_voce_senza_premium_{dev}')

@test('phone')
def testo_preparato_per_la_lettura(env, dev):
    pg = new(env, dev)
    r = pg.evaluate("""import('/js/features/ascolta.js').then(m=>({
      a: m.speakable('Gv 3,16 e 1Gv 4,8; Sal 23'),
      b: m.speakable('Il Salmo XXIII¹ dice*: vv. 3-5 (cfr. Rm 8,28) e poi [nota] Gesù Cr. parlò. Nel 30 d.C. e ca. 5 anni a.C.'),
      c: m.splitParts('Vide che era buono, e disse: «Sia la luce». E fu sera e fu mattina, un giorno. ' + 'lunga frase senza punti che continua ancora '.repeat(8)),
    }))""")
    eq(r['a'], 'Giovanni 3, versetto 16 e Primo Giovanni 4, versetto 8; Salmo 23', 'sigle dei libri con capitolo e versetto')
    check('XXIII' not in r['b'] and '¹' not in r['b'] and '*' not in r['b'] and '[' not in r['b'] and '(' not in r['b'], r['b'])
    check('versetti 3 a 5' in r['b'] and 'Gesù Cristo' in r['b'] and 'dopo Cristo' in r['b'] and 'avanti Cristo' in r['b'] and 'circa 5' in r['b'], r['b'])
    check(all(len(x) <= 240 for x in r['c']) and len(r['c']) >= 2, str([len(x) for x in r['c']]))
    check(r['c'][0].endswith('.') or r['c'][0].endswith(';') or r['c'][0].endswith(':') or r['c'][0].endswith(','), r['c'][0])
