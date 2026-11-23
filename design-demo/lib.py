import math
_uid=[0]
def uid():
    _uid[0]+=1; return f"u{_uid[0]}"

BOOKS={
 'gen':dict(n='Genesi',a='Gn',c1='#233252',c2='#0f182c',ac='#e6c880',sym='star',ch=50),
 'es':dict(n='Esodo',a='Es',c1='#35545c',c2='#1a2f36',ac='#d6e6e0',sym='waves',ch=40),
 'lev':dict(n='Levitico',a='Lv',c1='#b08030',c2='#7a5518',ac='#f6e6b8',sym='tablets',ch=27),
 'num':dict(n='Numeri',a='Nm',c1='#a95a3c',c2='#74381f',ac='#f4d8c2',sym='tent',ch=36),
 'deu':dict(n='Deuteronomio',a='Dt',c1='#4a5663',c2='#2a323c',ac='#dfe5ea',sym='scroll',ch=34),
 'sal':dict(n='Salmi',a='Sal',c1='#6d8062',c2='#43563b',ac='#eaf0d6',sym='lyre',ch=150),
 'pr':dict(n='Proverbi',a='Pr',c1='#b08030',c2='#7a5518',ac='#f6e6b8',sym='tree',ch=31),
 'gb':dict(n='Giobbe',a='Gb',c1='#4a5663',c2='#2a323c',ac='#dfe5ea',sym='scales',ch=42),
 'is':dict(n='Isaia',a='Is',c1='#b8882e',c2='#82601a',ac='#f8e9bc',sym='scroll',ch=66),
 'ger':dict(n='Geremia',a='Ger',c1='#70303c',c2='#47202a',ac='#efd2c0',sym='tablets',ch=52),
 'ez':dict(n='Ezechiele',a='Ez',c1='#35545c',c2='#1a2f36',ac='#d6e6e0',sym='flame',ch=48),
 'mt':dict(n='Matteo',a='Mt',c1='#722c39',c2='#461a24',ac='#f0d2b8',sym='scales',ch=28),
 'mc':dict(n='Marco',a='Mc',c1='#46525f',c2='#28313b',ac='#e0e6eb',sym='dove',ch=16),
 'lc':dict(n='Luca',a='Lc',c1='#6d8062',c2='#43563b',ac='#eaf0d6',sym='tree',ch=24),
 'gv':dict(n='Giovanni',a='Gv',c1='#b45c3a',c2='#7c3420',ac='#f6dcc4',sym='flame',ch=21),
 'at':dict(n='Atti',a='At',c1='#233252',c2='#0f182c',ac='#e6c880',sym='flame',ch=28),
 'rm':dict(n='Romani',a='Rm',c1='#4a5663',c2='#2a323c',ac='#dfe5ea',sym='column',ch=16),
 '1co':dict(n='1 Corinzi',a='1Co',c1='#b08030',c2='#7a5518',ac='#f6e6b8',sym='column',ch=16),
 'ef':dict(n='Efesini',a='Ef',c1='#722c39',c2='#461a24',ac='#f0d2b8',sym='scroll',ch=6),
 'ap':dict(n='Apocalisse',a='Ap',c1='#2c2314',c2='#120e07',ac='#cba653',sym='crown',ch=22),
}

def star_pts(cx,cy,R1,R2,n=8):
    pts=[]
    for i in range(n*2):
        r=R1 if i%2==0 else R2
        a=-math.pi/2+i*math.pi/n
        pts.append(f"{cx+r*math.cos(a):.1f},{cy+r*math.sin(a):.1f}")
    return " ".join(pts)

def sym(kind, ac):
    s=f'stroke="{ac}" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"'
    f=f'fill="{ac}"'
    if kind=='star':
        pts=[]
        for i in range(16):
            r=34 if i%4==0 else (22 if i%2==0 else 7)
            a=-math.pi/2+i*math.pi/8
            pts.append(f"{50+r*math.cos(a):.1f},{46+r*math.sin(a):.1f}")
        return (f'<g {s}><polygon points="{" ".join(pts)}" fill="{ac}" fill-opacity=".18"/><circle cx="50" cy="46" r="40" stroke-opacity=".35" stroke-width="1.2"/>'
                f'<path d="M22 82 Q50 70 78 82" stroke-opacity=".6"/></g><g {f}><circle cx="18" cy="22" r="1.6"/><circle cx="84" cy="30" r="1.3"/><circle cx="76" cy="12" r="1.1"/><circle cx="26" cy="70" r="1.2"/><circle cx="80" cy="66" r="1.5"/></g>')
    if kind=='waves':
        w=""
        for i,y in enumerate([44,55,66,77]):
            w+=f'<path d="M6 {y} q11.5 -13 23 0 t23 0 t23 0 t23 0" stroke-opacity="{1-i*.17:.2f}"/>'
        return f'<g {s}>{w}</g><circle cx="50" cy="30" r="12" {f} fill-opacity=".9"/><g stroke="{ac}" stroke-width="1.4" stroke-opacity=".5" stroke-linecap="round"><path d="M50 10v-4M34 16l-3-3M66 16l3-3M26 30h-5M74 30h5"/></g>'
    if kind=='lyre':
        return (f'<g {s}><path d="M33 22 C20 32 20 62 36 76 L64 76 C80 62 80 32 67 22"/><path d="M30 22 H70"/><path d="M40 22V74M50 22V74M60 22V74" stroke-width="1.5"/><path d="M33 82H67"/><circle cx="32" cy="20" r="4"/><circle cx="68" cy="20" r="4"/></g>')
    if kind=='scroll':
        return (f'<g {s}><rect x="27" y="28" width="46" height="44" rx="2" fill="{ac}" fill-opacity=".12"/><rect x="20" y="23" width="11" height="54" rx="5.5"/><rect x="69" y="23" width="11" height="54" rx="5.5"/>'
                f'<path d="M36 40H64M36 48H60M36 56H64M36 64H54" stroke-width="1.6"/></g>')
    if kind=='flame':
        rays="".join(f'<path d="M{50+44*math.cos(a):.1f} {50+44*math.sin(a):.1f}L{50+49*math.cos(a):.1f} {50+49*math.sin(a):.1f}"/>' for a in [i*math.pi/10 for i in range(20)])
        return (f'<g {s}><path d="M50 14 C58 30 74 40 74 58 C74 72 63 84 50 84 C37 84 26 72 26 58 C26 48 32 42 38 36 C38 44 42 48 46 48 C42 38 44 26 50 14 Z" fill="{ac}" fill-opacity=".16"/>'
                f'<path d="M50 52 C56 60 62 64 62 70 C62 77 56 80 50 80 C44 80 38 77 38 70 C38 64 46 60 50 52 Z" fill="{ac}" fill-opacity=".7" stroke="none"/><g stroke-opacity=".3" stroke-width="1.2">{rays}</g></g>')
    if kind=='column':
        fl="".join(f'<path d="M{x} 38V74" stroke-width="1.2"/>' for x in (45,50,55))
        return (f'<g {s}><rect x="27" y="19" width="46" height="6" rx="1"/><path d="M32 25H68Q64 35 56 35H44Q36 35 32 25Z"/><circle cx="32" cy="31" r="4"/><circle cx="68" cy="31" r="4"/>'
                f'<rect x="40" y="35" width="20" height="40" fill="{ac}" fill-opacity=".12"/>{fl}<rect x="34" y="75" width="32" height="5"/><rect x="29" y="80" width="42" height="6"/></g>')
    if kind=='crown':
        rays="".join(f'<path d="M{50+17*math.cos(a):.1f} {33+17*math.sin(a):.1f}L{50+25*math.cos(a):.1f} {33+25*math.sin(a):.1f}"/>' for a in [i*math.pi/6 for i in range(12)])
        return (f'<g {s}><circle cx="50" cy="33" r="10" fill="{ac}" fill-opacity=".85"/>{rays}<path d="M28 88 L32 68 L41 78 L50 63 L59 78 L68 68 L72 88 Z" fill="{ac}" fill-opacity=".14"/><path d="M29 88H71"/></g>'
                f'<g {f}><circle cx="32" cy="67" r="2.4"/><circle cx="68" cy="67" r="2.4"/><circle cx="50" cy="62" r="2.6"/></g>')
    if kind=='scales':
        return (f'<g {s}><path d="M50 22V78"/><path d="M24 32H76"/><path d="M24 32L14 56M24 32L34 56M76 32L66 56M76 32L86 56" stroke-width="1.4"/><path d="M12 56H36Q24 70 12 56Z" fill="{ac}" fill-opacity=".2"/><path d="M64 56H88Q76 70 64 56Z" fill="{ac}" fill-opacity=".2"/><path d="M38 80H62"/><circle cx="50" cy="20" r="3"/></g>')
    if kind=='tablets':
        return (f'<g {s}><path d="M23 80V40Q23 22 36 22Q49 22 49 40V80Z" fill="{ac}" fill-opacity=".14"/><path d="M51 80V40Q51 22 64 22Q77 22 77 40V80Z" fill="{ac}" fill-opacity=".14"/><path d="M30 42H42M30 50H42M30 58H38M58 42H70M58 50H70M58 58H66" stroke-width="1.5"/></g>')
    if kind=='tree':
        return (f'<g {s}><path d="M50 82V54"/><ellipse cx="50" cy="38" rx="23" ry="21" fill="{ac}" fill-opacity=".14"/><path d="M50 62L38 48M50 56L62 44M50 46V30" stroke-width="1.6"/><path d="M30 82H70"/></g><g {f}><circle cx="40" cy="32" r="2"/><circle cx="60" cy="30" r="2"/><circle cx="50" cy="22" r="2"/><circle cx="62" cy="44" r="2"/></g>')
    if kind=='tent':
        return (f'<g {s}><path d="M18 78L50 26L82 78Z" fill="{ac}" fill-opacity=".14"/><path d="M50 78V52L40 78" /><path d="M50 26V16"/><path d="M12 78H88"/></g>')
    if kind=='dove':
        return (f'<g {s}><path d="M20 58 C30 48 42 52 50 58 C52 42 66 30 82 30 C80 44 72 54 62 60 C68 68 64 76 52 76 C38 76 28 70 20 58Z" fill="{ac}" fill-opacity=".16"/><path d="M62 60C60 52 58 46 54 42" stroke-width="1.4"/><circle cx="76" cy="36" r="1.4" fill="{ac}"/><path d="M82 30L90 28" /><path d="M30 84 Q52 74 74 84" stroke-opacity=".5"/></g>')
    return ''

def cover(key,w,h,title=True,r=0,hero=False,shadow=False,symx=None,symy=None,syms=None,fade=False,frame=None,tsize=None):
    b=BOOKS[key]; i=uid()
    m=min(w,h)
    if syms is None: syms=m*(0.50 if not hero else 0.95)
    if symx is None: symx=w/2 if not hero else w*0.74
    if symy is None: symy=h*0.40 if not hero else h*0.40
    sc=syms/100
    if frame is None: frame = w>=60 and not hero
    o=f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" style="display:block;border-radius:{r}px;{"filter:drop-shadow(0 6px 10px rgba(0,0,0,.28));" if shadow else ""}">'
    o+=f'<defs><linearGradient id="g{i}" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="{b["c1"]}"/><stop offset="1" stop-color="{b["c2"]}"/></linearGradient>'
    o+=f'<radialGradient id="r{i}" cx="{symx/w:.2f}" cy="{symy/h:.2f}" r=".6"><stop offset="0" stop-color="{b["ac"]}" stop-opacity=".30"/><stop offset="1" stop-color="{b["ac"]}" stop-opacity="0"/></radialGradient>'
    o+=f'<filter id="n{i}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4"/><feColorMatrix type="saturate" values="0"/></filter>'
    o+=f'<pattern id="p{i}" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="4" height="1" fill="#fff" fill-opacity=".05"/></pattern>'
    if fade:
        o+=f'<linearGradient id="f{i}" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient><mask id="m{i}"><rect width="{w}" height="{h}" fill="url(#f{i})"/></mask>'
    o+='</defs>'
    if fade: o+=f'<g mask="url(#m{i})">'
    o+=f'<rect width="{w}" height="{h}" fill="url(#g{i})"/><rect width="{w}" height="{h}" fill="url(#p{i})"/><rect width="{w}" height="{h}" fill="url(#r{i})"/>'
    o+=f'<rect width="{w}" height="{h}" filter="url(#n{i})" opacity=".16" style="mix-blend-mode:overlay"/>'
    o+=f'<g transform="translate({symx-syms/2:.1f},{symy-syms/2:.1f}) scale({sc:.3f})" opacity="{0.9 if not hero else 0.55}">{sym(b["sym"],b["ac"])}</g>'
    if frame:
        p=max(4,w*0.055)
        o+=f'<rect x="{p:.1f}" y="{p:.1f}" width="{w-2*p:.1f}" height="{h-2*p:.1f}" rx="{max(1,r/3):.1f}" fill="none" stroke="{b["ac"]}" stroke-opacity=".42" stroke-width="{max(.6,w/160):.2f}"/>'
        o+=f'<rect x="{p+3:.1f}" y="{p+3:.1f}" width="{w-2*p-6:.1f}" height="{h-2*p-6:.1f}" rx="{max(1,r/4):.1f}" fill="none" stroke="{b["ac"]}" stroke-opacity=".18" stroke-width="{max(.5,w/220):.2f}"/>'
    if title and not hero:
        fs=tsize or w*0.092
        ty=h-max(10,h*0.115)
        o+=f'<text x="{w/2}" y="{ty:.1f}" text-anchor="middle" font-family="Cardo,serif" font-size="{fs:.1f}" letter-spacing="{fs*0.18:.1f}" fill="{b["ac"]}" fill-opacity=".95">{b["n"].upper()}</text>'
        ly=ty-fs*1.5
        o+=f'<g stroke="{b["ac"]}" stroke-opacity=".6" stroke-width=".7"><path d="M{w*.36:.1f} {ly:.1f}H{w*.46:.1f}M{w*.54:.1f} {ly:.1f}H{w*.64:.1f}"/></g><path d="M{w/2} {ly-2.2:.1f}l2.2 2.2l-2.2 2.2l-2.2 -2.2z" fill="{b["ac"]}" fill-opacity=".8"/>'
    if fade: o+='</g>'
    o+='</svg>'
    return o

ICONS={
 'sun':'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
 'book':'<path d="M3.5 5.5C6.5 4.5 9.5 4.8 12 6.5C14.5 4.8 17.5 4.5 20.5 5.5V19C17.5 18 14.5 18.3 12 20C9.5 18.3 6.5 18 3.5 19Z"/><path d="M12 6.5V20"/>',
 'note':'<path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4M8 12h8M8 16h5"/>',
 'search':'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
 'play':'<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>',
 'pause':'<rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor"/><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor"/>',
 'back':'<path d="M15 5l-7 7 7 7"/>',
 'chev':'<path d="M9 5l7 7-7 7"/>',
 'mic':'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/>',
 'bulb':'<path d="M9 17.5h6M10 20.5h4M12 3.5a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3.5z"/>',
 'check':'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
 'flame':'<path d="M12 3c1.5 3.5 5.5 5.5 5.5 10a5.5 5.5 0 0 1-11 0c0-2 1-3.5 2-4.5.2 1.8 1 2.8 2 3C9.5 8.5 10.5 5.5 12 3z"/>',
 'scale':'<path d="M12 4v15M6 20h12M4 8h16M4 8l-2.5 6a3 3 0 0 0 5 0zM20 8l-2.5 6a3 3 0 0 0 5 0z"/>',
 'map':'<path d="M9 4L3.5 6v14L9 18l6 2 5.5-2V4L15 6z"/><path d="M9 4v14M15 6v14"/>',
 'back15':'<path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4.5h4.5"/><text x="12" y="15.5" font-size="7.5" text-anchor="middle" fill="currentColor" stroke="none" font-family="Inter" font-weight="700">15</text>',
 'fwd15':'<path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v4.5h-4.5"/><text x="12" y="15.5" font-size="7.5" text-anchor="middle" fill="currentColor" stroke="none" font-family="Inter" font-weight="700">15</text>',
 'timer':'<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2M9.5 3h5"/>',
 'share':'<path d="M12 15V3.5M8 7l4-4 4 4M6 11H5v9h14v-9h-1"/>',
 'copy':'<rect x="8" y="8" width="11" height="12" rx="2"/><path d="M5 16V5a1 1 0 0 1 1-1h9"/>',
 'pen':'<path d="M4 20l1-4L16.5 4.5l3 3L8 19z"/>',
 'hand':'<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10M12 10V4.5a1.5 1.5 0 0 1 3 0V10M15 10V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.5-2L4 14a1.5 1.5 0 0 1 2.3-1.9L9 14"/>',
 'info':'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.1"/>',
 'speed':'<path d="M4 17a8 8 0 1 1 16 0M12 17l4-5"/>',
 'cards':'<rect x="5" y="6" width="14" height="14" rx="2"/><path d="M8 3h9a2 2 0 0 1 2 2"/>',
 'pin':'<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
 'clock':'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
 'person':'<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20c.8-4 3.8-6 7.5-6s6.7 2 7.5 6"/>',
 'ruler':'<path d="M3 15L15 3l6 6L9 21z"/><path d="M7 11l2 2M10 8l2 2M13 5l2 2" />',
 'wave':'<path d="M3 9c3-3 6 3 9 0s6 3 9 0M3 15c3-3 6 3 9 0s6 3 9 0"/>',
 'moon':'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
 'sparkle':'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
 'trash':'<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/>',
 'dots':'<circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/>',
 'bookmark':'<path d="M7 4h10v16l-5-4-5 4z"/>',
 'headphones':'<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3.5" y="14" width="4" height="6" rx="1.5"/><rect x="16.5" y="14" width="4" height="6" rx="1.5"/>',
 'repeat':'<path d="M4 11V9a3 3 0 0 1 3-3h12M16 3l3 3-3 3M20 13v2a3 3 0 0 1-3 3H5M8 21l-3-3 3-3"/>',
}
def ico(n,s=24,sw=1.8,style=''):
    return f'<svg viewBox="0 0 24 24" width="{s}" height="{s}" fill="none" stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" style="flex:none;{style}">{ICONS[n]}</svg>'

def fleuron(color='currentColor',w=40):
    return f'<svg viewBox="0 0 60 12" width="{w}" height="{w*0.2}" fill="none" stroke="{color}" stroke-width="1" stroke-linecap="round"><path d="M2 6H22M38 6H58"/><path d="M30 1.5 L33.5 6 L30 10.5 L26.5 6Z" fill="{color}" stroke="none"/><circle cx="24.5" cy="6" r="1" fill="{color}" stroke="none"/><circle cx="35.5" cy="6" r="1" fill="{color}" stroke="none"/></svg>'

def mapsvg(w,h,vb='0 0 360 300',sel=True,labels=True,dark=False,pins=True,id_=None):
    i=uid()
    land='#e7e0cd'; sea='#bccbc9'; sea2='#a9bdbb'; ink='#4b4536'
    o=f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="{vb}" preserveAspectRatio="xMidYMid slice" style="display:block">'
    o+=f'<defs><linearGradient id="s{i}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{sea2}"/><stop offset="1" stop-color="{sea}"/></linearGradient>'
    o+=f'<pattern id="h{i}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><rect width="5" height=".6" fill="#8a7b55" fill-opacity=".18"/></pattern>'
    o+=f'<filter id="n{i}"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="9"/><feColorMatrix type="saturate" values="0"/></filter></defs>'
    o+=f'<rect x="-20" y="-20" width="420" height="340" fill="{land}"/><rect x="-20" y="-20" width="420" height="340" fill="url(#h{i})"/>'
    # relief: soft hills
    for (x,y,rx,ry,op) in [(150,120,40,22,.10),(120,170,34,18,.10),(205,150,30,16,.08),(310,120,34,60,.08),(320,230,30,50,.08)]:
        o+=f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="#8a7b55" fill-opacity="{op}"/>'
    # sea
    coast="M-20 -20 H72 C74 40 80 70 76 100 C72 130 84 162 80 192 C76 224 60 256 38 322 H-20 Z"
    o+=f'<path d="{coast}" fill="url(#s{i})"/><path d="{coast}" fill="none" stroke="#7d8f86" stroke-width="1.2"/>'
    for k in range(3):
        o+=f'<path d="M{70-k*14-18} 10 C{74-k*14-18} 60 {82-k*14-18} 100 {78-k*14-18} 130 C{74-k*14-18} 170 {62-k*14-18} 220 {40-k*14-18} 300" fill="none" stroke="#ffffff" stroke-opacity=".28" stroke-width=".8"/>'
    # galilee
    o+=f'<path d="M222 50 C232 42 252 42 262 52 C268 60 262 72 252 80 C246 86 242 92 238 96 C230 92 226 84 224 74 C220 66 218 56 222 50Z" fill="{sea}" stroke="#7d8f86" stroke-width="1.2"/>'
    # jordan
    o+=f'<path d="M238 96 C226 112 250 126 242 148 C236 164 252 178 248 194" fill="none" stroke="#8ea6a7" stroke-width="2.4" stroke-linecap="round"/><path d="M238 96 C226 112 250 126 242 148 C236 164 252 178 248 194" fill="none" stroke="#c4d3d1" stroke-width="1" stroke-linecap="round"/>'
    # dead sea
    o+=f'<path d="M244 194 C257 190 268 202 266 226 C264 246 260 260 253 270 C244 260 240 238 242 216Z" fill="{sea}" stroke="#7d8f86" stroke-width="1.2"/>'
    if labels:
        o+=f'<g font-family="Crimson Text,serif" font-style="italic" fill="#56705f" font-size="12.5"><text x="14" y="120" transform="rotate(-82 24 120)" letter-spacing="1.5">Mar Mediterraneo</text></g>'
        o+=f'<g font-family="Crimson Text,serif" font-style="italic" fill="#56705f" font-size="11"><text x="266" y="62">Mar di</text><text x="266" y="74">Galilea</text><text x="272" y="236">Mar</text><text x="272" y="248">Morto</text><text x="214" y="132" fill="#6a8688" transform="rotate(70 214 132)" font-size="10.5">Giordano</text></g>'
        o+=f'<g font-family="Cardo,serif" fill="{ink}" fill-opacity=".38" font-size="10" letter-spacing="3"><text x="112" y="28">GALILEA</text><text x="108" y="148">GIUDEA</text></g>'
    if pins:
        P=[('Cafarnao',230,48,'l'),('Nazaret',186,76,'l'),('Gerusalemme',198,206,'l'),('Betlemme',200,232,'b')]
        for nm,x,y,pos in P:
            sel_=(nm=='Gerusalemme' and sel)
            if sel_:
                o+=f'<circle cx="{x}" cy="{y}" r="15" fill="#8e3a2b" fill-opacity=".14"/><circle cx="{x}" cy="{y}" r="9" fill="none" stroke="#8e3a2b" stroke-opacity=".55" stroke-width="1"/>'
            o+=f'<circle cx="{x}" cy="{y}" r="{5 if sel_ else 3.6}" fill="{"#8e3a2b" if sel_ else "#3f3a2c"}" stroke="#f7f2e6" stroke-width="1.8"/>'
            if labels:
                if nm=='Cafarnao': o+=f'<text x="{x-10}" y="{y-8}" text-anchor="end" font-family="Crimson Text,serif" font-weight="600" font-size="12.5" fill="#2e2a20">{nm}</text>'
                elif nm=='Nazaret': o+=f'<text x="{x-9}" y="{y+4}" text-anchor="end" font-family="Crimson Text,serif" font-weight="600" font-size="12.5" fill="#2e2a20">{nm}</text>'
                elif nm=='Gerusalemme': o+=f'<text x="{x-12}" y="{y+4}" text-anchor="end" font-family="Crimson Text,serif" font-weight="700" font-size="13.5" fill="#6d2a1e">{nm}</text>'
                else: o+=f'<text x="{x-8}" y="{y+16}" text-anchor="end" font-family="Crimson Text,serif" font-weight="600" font-size="12.5" fill="#2e2a20">{nm}</text>'
    o+=f'<rect x="-20" y="-20" width="420" height="340" filter="url(#n{i})" opacity=".12" style="mix-blend-mode:multiply"/>'
    o+='</svg>'
    return o
