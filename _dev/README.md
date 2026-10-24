# _dev: Werkzeuge, Tests, Redaktion

Dieser Ordner wird von GitHub Pages **nicht** veröffentlicht (Ordner mit `_` am Anfang ignoriert Jekyll). Hier liegen die Prüfseite mit Lösungen und alles, was nur für die Pflege gebraucht wird. Die Fakten selbst (`fakten.js` im Hauptordner) sind dagegen öffentlich, weil das Spiel sie braucht.

| Pfad | Inhalt |
| --- | --- |
| `tools/pruefen.html` | Prüfseite: Fehler, Vorrat, kommende Rätsel mit Lösungen. Im Browser öffnen (Doppelklick) oder `npm run pruefen` |
| `tools/bericht.js` | Faktenbericht als Text (`npm run bericht`), auch in jedem GitHub-Lauf |
| `tools/server.js` | Kleiner Webserver wie GitHub Pages (`npm run serve`) |
| `tools/frozen.json` | Zuordnung von #1–#16 zum Zeitpunkt der Veröffentlichung |
| `tests/` | Automatische Tests (siehe unten) |
| `tests/veroeffentlicht-1-16.json` | Abzug der live gegangenen Rätsel #1–#16 (Deutsch und Englisch) |
| `redaktion/` | Anleitung für neue Fakten, Quellenprüfung |
| `nachweise/` | Bildschirmfotos vorher und nachher |

## Tests

```
cd _dev
npm ci
npx playwright install chromium
npm test
```

- `tests/daten.test.js`: Fakten (IDs, Themen, Satzregeln, Quellen, Kodierung), veröffentlichte Rätsel unverändert (Abzug #1–#16 und Vergleich mit `main` für alle Tage, die irgendwo auf der Welt schon live sind), gleiche Fakten in beiden Sprachen ab #17, kein Thema doppelt pro Tag, Verschlüsselung, Zeitzonen und Sommerzeit, Vorrat und Wiederholung.
- `tests/spiel.test.js`: im echten Browser (Chromium): Kurz-Einstieg und Erstbesuch über einen geteilten Link, Linkvorschau, Regelzeile, Links mit Nummer, Stufe und Sprache, Zeitzonen, Farben für Hilfe, alte Spielstände, Uhr und Pause, zwei Tabs, Teilen, Statistik und Serie, Tageswechsel, Vorrat erschöpft, Tastatur, Barrierefreiheit (axe), offline.
- `tests/layout.test.js`: 320 bis 1280 px, Hoch- und Querformat, Deutsch und Englisch: nichts ragt hinaus, nichts überlappt, Tasten und Zahlen darauf groß genug, Regelzeile nicht abgeschnitten, längste Wörter passen in eine Zeile.

Einzelne Teile: `npm run test:daten`, `npm run test:spiel`. Die Uhrzeit in den Browsertests ist fest (24. Oktober 2026, Wien), die Tests sind deshalb jeden Tag gleich.
