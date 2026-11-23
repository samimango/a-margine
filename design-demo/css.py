CSS='''
:root{--sans:"Inter",sans-serif;--serif:"Crimson Text",Georgia,serif;--lora:"Lora",Georgia,serif;--card:"Cardo",serif;
--terra:#b45c3a;--sage:#6d8062;--night:#233252;--ochre:#b8882e;--bord:#722c39;--gold:#a8833a;--slate:#4a5663;--anno:#cf4a2a}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#dcdcdf;font-family:var(--sans);-webkit-font-smoothing:antialiased}
.page{width:1950px;padding:70px 60px 56px;background:#dcdcdf;display:flex;gap:70px;align-items:flex-start;position:relative}
.col{display:flex;flex-direction:column;align-items:center;gap:30px;width:390px;flex:none}
.cap{width:390px;text-align:center}
.cap b{display:block;font:600 21px var(--sans);color:#1d1d1f;letter-spacing:-.01em}
.cap span{display:block;font:400 15px/1.4 var(--sans);color:#5e5e63;margin-top:6px}
.cap i{font-style:normal;font:600 12px var(--sans);color:#8a8a90;letter-spacing:.12em;display:block;margin-bottom:6px}
.ph{width:390px;height:844px;border-radius:54px;overflow:hidden;position:relative;color:var(--ink);background:var(--bg);
 box-shadow:0 0 0 3px #3a3a3d,0 0 0 11px #0a0a0a,0 0 0 12px #55555a,0 40px 70px -20px rgba(0,0,0,.45);flex:none}
.light{--bg:#f4f0e8;--card:#fffdf9;--ink:#1d1a16;--dim:#7a7368;--line:rgba(60,45,20,.11);--glass:rgba(250,246,238,.66);--chip:#ebe5d8}
.paper{--bg:#f6f1e7;--card:#fffdf9;--ink:#221d16;--dim:#857d6e;--line:rgba(60,45,20,.12);--glass:rgba(250,245,234,.7);--chip:#ece5d4}
.dark{--bg:#000;--card:#101010;--ink:#f3efe8;--dim:#8c877d;--line:rgba(255,255,255,.1);--glass:rgba(28,28,28,.62);--chip:#1b1b1b}
.st{position:absolute;top:0;left:0;right:0;height:54px;display:flex;justify-content:space-between;align-items:center;padding:6px 34px 0 42px;font:600 16.5px var(--sans);z-index:30;color:var(--ink)}
.st .r{display:flex;gap:6px;align-items:center}
.island{position:absolute;top:11px;left:50%;transform:translateX(-50%);width:120px;height:34px;border-radius:20px;background:#000;z-index:40}
.home{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:134px;height:5px;border-radius:3px;background:var(--ink);opacity:.85;z-index:40}
.glass{background:var(--glass);backdrop-filter:blur(26px) saturate(1.7);-webkit-backdrop-filter:blur(26px) saturate(1.7)}
.tabbar{position:absolute;left:18px;right:18px;bottom:26px;height:62px;border-radius:31px;display:flex;align-items:center;justify-content:space-around;padding:0 8px;z-index:20;box-shadow:0 14px 34px -10px rgba(40,25,5,.35),inset 0 0 0 .6px rgba(255,255,255,.55),0 0 0 .6px var(--line)}
.dark .tabbar{box-shadow:0 14px 34px -10px #000,inset 0 0 0 .6px rgba(255,255,255,.16)}
.tab{display:flex;flex-direction:column;align-items:center;gap:2px;font:600 10px var(--sans);color:var(--dim);width:78px;height:48px;justify-content:center;border-radius:24px;letter-spacing:.01em}
.tab.on{color:var(--ink);background:rgba(60,40,10,.09)}
.dark .tab.on{background:rgba(255,255,255,.12)}
.lg{font:600 34px/1.05 var(--lora);letter-spacing:-.015em}
.eyebrow{font:600 10.5px var(--sans);letter-spacing:.16em;text-transform:uppercase;color:var(--dim)}
.sc{font-variant-caps:all-small-caps;letter-spacing:.09em;font-feature-settings:"smcp","c2sc"}
.sh{margin:0 18px;display:flex;align-items:baseline;justify-content:space-between}
.sh b{font:600 19px var(--lora);letter-spacing:-.01em}
.sh span{font:500 12.5px var(--sans);color:var(--dim)}
.card{background:var(--card);border-radius:22px;box-shadow:0 1px 0 rgba(255,255,255,.7) inset,0 0 0 .6px var(--line),0 10px 24px -14px rgba(60,40,10,.28)}
.anno{position:absolute;z-index:60;display:flex;align-items:center;gap:5px;padding:4px 9px 4px 7px;border-radius:9px;background:#201c18;color:#fff;font:600 10.5px/1.15 var(--sans);letter-spacing:.01em;box-shadow:0 4px 12px rgba(0,0,0,.28);white-space:nowrap}
.anno:before{content:"";width:6px;height:6px;border-radius:50%;background:var(--anno);flex:none}
.anno.l{background:#fff;color:#201c18;box-shadow:0 4px 12px rgba(0,0,0,.2),0 0 0 .6px rgba(0,0,0,.15)}
.ghost{position:absolute;border:1.5px dashed var(--anno);border-radius:22px;z-index:55;pointer-events:none}
.arrow{position:absolute;z-index:58;pointer-events:none}
.pill{height:42px;border-radius:21px;display:flex;align-items:center;justify-content:center;gap:7px;font:600 14.5px var(--sans)}
.tog{width:44px;height:26px;border-radius:13px;background:#d8d2c4;position:relative;flex:none}
.tog:after{content:"";position:absolute;top:2px;left:2px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 2px 4px rgba(0,0,0,.25)}
.tog.on{background:#5f7a52}.tog.on:after{left:20px}
'''
