"""Editor ricco della meditazione: lampadina con domande guida, dettatura, salvataggio."""
from harness import *

FAKE_SR = """
window.__srStarts = 0;
window.SpeechRecognition = window.webkitSpeechRecognition = class { constructor(){ window.__sr = this; } start(){ window.__srStarts++; this.started = true; } stop(){ this.started = false; this.onend && this.onend(); } abort(){ this.started = false; } };
"""

def rec(pg, id): return lsj(pg, 'margine.nota.' + id)

def open_editor(pg):
    open_ref(pg, 42, 3, 1); tap_verse(pg, 16); pg.click('.abtn[data-action=nota]'); pg.wait_for_selector('.f-guida-area'); pg.wait_for_timeout(250)


@test()
def lampadina_e_domande(env, dev):
    pg = env.new(dev); open_editor(pg)
    eq(pg.get_attribute('.f-guida-area', 'id'), 'note')
    check(pg.evaluate("document.activeElement.id") == 'note', 'focus nel campo')
    check(not pg.is_visible('.f-guida-chips'), 'le domande sono nascoste')
    for sel in ['.f-guida-bulb', '.f-guida-mic']:
        r = pg.evaluate("s=>{const r=document.querySelector(s).getBoundingClientRect();return [r.width,r.height]}", sel); check(r[0] >= 44 and r[1] >= 44, f'{sel} {r}')
    pg.click('.f-guida-bulb'); eq(pg.get_attribute('.f-guida-bulb', 'aria-expanded'), 'true')
    eq(pg.locator('.f-guida-chip').count(), 3)
    tops = pg.eval_on_selector_all('.f-guida-chip', 'els=>els.map(e=>Math.round(e.getBoundingClientRect().top))'); eq(len(set(tops)), 1, 'una sola riga')
    right = pg.evaluate("document.querySelector('.f-guida-chips').scrollWidth <= document.querySelector('.f-guida-chips').clientWidth + 1"); check(right or dev == 'phone')
    shot(pg, f'guida_domande_{dev}')
    pg.click('.f-guida-chip >> nth=0'); pg.wait_for_timeout(300)
    eq(pg.input_value('#note'), 'Cosa dice? '); eq(rec(pg, '42.3.16')['note'], 'Cosa dice? ')
    pg.keyboard.type('Dio ama il mondo.'); pg.wait_for_timeout(250)
    pg.click('.f-guida-chip >> nth=2')
    eq(pg.input_value('#note'), 'Cosa dice? Dio ama il mondo.\n\nCosa cambia per me? '); check('Salvato' in pg.inner_text('#status'))
    eq(rec(pg, '42.3.16')['note'], 'Cosa dice? Dio ama il mondo.\n\nCosa cambia per me? ')
    pg.click('.f-guida-bulb'); check(not pg.is_visible('.f-guida-chips')); eq(pg.get_attribute('.f-guida-bulb', 'aria-expanded'), 'false')
    pg.click('#wDone'); pg.wait_for_timeout(300); check('Dio ama il mondo' in pg.inner_text('#v16'))


@test()
def microfono_senza_api(env, dev):
    pg = env.new(dev, init="delete window.SpeechRecognition; delete window.webkitSpeechRecognition;"); open_editor(pg)
    pg.click('.f-guida-mic'); pg.wait_for_timeout(150)
    check('microfono della tastiera' in pg.inner_text('.f-guida-hint'), pg.inner_text('.f-guida-hint'))
    eq(pg.evaluate("document.activeElement.id"), 'note'); eq(pg.get_attribute('.f-guida-mic', 'aria-pressed'), 'false')


@test()
def dettatura_con_api(env, dev):
    pg = env.new(dev, init=FAKE_SR); open_editor(pg)
    pg.fill('#note', 'Inizio'); pg.click('.f-guida-mic'); pg.wait_for_timeout(150)
    eq(pg.get_attribute('.f-guida-mic', 'aria-pressed'), 'true'); check('In ascolto' in pg.inner_text('.f-guida-hint'))
    eq(pg.evaluate('__sr.lang'), 'it-IT')
    pg.evaluate("__sr.onresult({resultIndex:0, results:[Object.assign([{transcript:'amo la tua parola'}],{isFinal:true})]})"); pg.wait_for_timeout(200)
    eq(pg.input_value('#note'), 'Inizio amo la tua parola'); eq(rec(pg, '42.3.16')['note'], 'Inizio amo la tua parola')
    pg.click('.f-guida-mic'); pg.wait_for_timeout(150); eq(pg.get_attribute('.f-guida-mic', 'aria-pressed'), 'false')
    pg.click('.f-guida-mic'); pg.evaluate("__sr.onerror({error:'not-allowed'})"); pg.wait_for_timeout(150)
    check('non consentito' in pg.inner_text('.f-guida-hint'), pg.inner_text('.f-guida-hint'))


@test('phone')
def tre_temi(env, dev):
    for theme in ['light', 'paper', 'dark']:
        pg = env.new(dev, storage={'margine.theme': theme}); open_editor(pg)
        pg.fill('#note', 'L’amore di Dio è un dono, non un premio.'); pg.click('.f-guida-bulb'); pg.wait_for_timeout(200)
        shot(pg, f'guida_{theme}'); env.close()
