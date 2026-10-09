"""Turns game/station9.html (the web version) into www/index.html for the Android app:
local three.js instead of the CDN, and phone-to-phone multiplayer instead of the claude.ai room."""
import pathlib, re, sys
root = pathlib.Path(__file__).resolve().parent.parent
s = (root / 'game' / 'station9.html').read_text(encoding='utf-8')

def rep(old, new):
    global s
    if old not in s:
        sys.exit(f'build_web: pattern not found: {old[:70]}')
    s = s.replace(old, new, 1)

rep('"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"',
    '"three":"./lib/three.module.js","three/addons/":"./lib/addons/"')
rep('import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";', 'import * as THREE from "three";')
rep('<script type="importmap">', '<script src="lib/peerjs.min.js"></script>\n<script src="peer-room.js"></script>\n<script type="importmap">')
rep("const roomReady=(async()=>{try{if(window.claude&&window.claude.use){roomBase=await window.claude.use('room');}}catch(e){roomBase=null;}",
    "const roomReady=(async()=>{try{roomBase=peerRoomBase();}catch(e){roomBase=null;}")
rep("Mehrspieler läuft nur, wenn die Seite angemeldet in Claude geöffnet ist. Allein spielen geht immer.",
    "Mehrspieler konnte nicht geladen werden. Allein spielen geht immer.")
rep('Mehrspieler: Raum erstellen, Code an bis zu drei Freunde schicken. Sie brauchen Zugriff auf diese Seite.',
    'Mehrspieler: Raum erstellen, Code an bis zu drei Freunde schicken. Alle brauchen Internet.')
m = re.search(r'<title>.*?</title>', s)
title = m.group(0); s = s.replace(title, '', 1)
out = ('<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n'
       '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">\n'
       f'{title}\n<style>body{{margin:0}}</style>\n</head>\n<body>\n{s}\n</body>\n</html>\n')
(root / 'www' / 'index.html').write_text(out, encoding='utf-8')
print('www/index.html written')
