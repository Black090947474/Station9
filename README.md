# Station 9

Koop-Horror im verlassenen Krankenhaus für 1–4 Spieler. Findet die Sicherungen, werft den Generator an,
sucht die vier Akten mit dem Ausgangscode und entkommt dem Ding, das euch jagt.

## App installieren (Android)

1. Auf dem Handy die Seite **Releases → „Station 9 – neueste Version“** öffnen.
2. **Station9.apk** herunterladen und öffnen.
3. Wenn Android fragt: Installation aus dieser Quelle erlauben.

Die App baut sich bei jeder Änderung automatisch neu (Reiter **Actions**).

## Zusammen spielen

Einer tippt **Raum erstellen** und schickt den Code (z. B. `s9-4821`) an bis zu drei Freunde.
Die geben ihn ein und tippen **Beitreten**. Alle brauchen Internet. Die Handys verbinden sich direkt miteinander.

## Steuerung

- Linker Daumen: laufen
- Rechter Daumen: umsehen
- **E**: aufheben, benutzen, Mitspieler wiederbeleben (gedrückt halten)
- **Renn**: rennen (Ausdauer) · **Lampe**: Taschenlampe an/aus

## Aufbau

- `game/station9.html` – das Spiel (gleiche Datei wie die Web-Version)
- `tools/build_web.py` – macht daraus `www/index.html` für die App
- `www/peer-room.js` – Mehrspieler über direkte Verbindung (PeerJS)
- `android-overrides/` – Vollbild, Querformat und App-Icon
- `.github/workflows/build-apk.yml` – baut die APK und stellt sie unter Releases bereit
