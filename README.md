# NUMIGMA

**Crack the code. Reveal the fact.**

Jeden Tag vier Zahlencodes von Easy bis Impossible. Hinter jedem steckt ein kurzer, wahrer Fakt. Auf Deutsch und Englisch. Kein Konto, keine Werbung, kein Tracking.

Spielen: https://gr3hab.github.io/numfact/ · English: https://gr3hab.github.io/numfact/en/

## Dateien

| Datei | Inhalt | Öffentlich |
| --- | --- | --- |
| `index.html` | Das Spiel | ja |
| `fakten.js` | Alle Fakten, Deutsch und Englisch, mit ID, Thema und Quellen | ja |
| `kern.js` | Spiellogik: Codes, Tagesrätsel, Prüfungen | ja |
| `en/index.html` | Englischer Einstieg für geteilte Links (englische Vorschau in WhatsApp & Co.) | ja |
| `sw.js` | Offline-Hilfe: zuletzt geladene Fassung, wenn keine Verbindung da ist | ja |
| `fonts/` | Schriften (lokal, keine Anfragen an fremde Server) | ja |
| `og.png`, `icon*.png`, `manifest.webmanifest` | Vorschaubild, App-Icons, Home-Bildschirm-App | ja |
| `_dev/` | Prüfseite, Tests, Redaktionsunterlagen, Nachweise | **nein** |

GitHub Pages veröffentlicht Ordner, die mit `_` beginnen, nicht. Die Prüfseite mit allen Lösungen und alles für die Redaktion liegt deshalb in `_dev/`.

**Was trotzdem öffentlich ist:** `fakten.js` muss abrufbar sein, damit das Spiel läuft. Darin stehen alle Sätze, auch die von künftigen Tagen. Wer gezielt in die Datei schaut, kann also vorab nachlesen. Für ein freundschaftliches Rätselspiel ist das bewusst so akzeptiert; die künftigen Lösungen sind nicht geheim, nur nicht mehr auf einer Seite zum Durchblättern. Eine tageweise Veröffentlichung ist in `_dev/KONZEPTE.md` beschrieben.

## Links zum Teilen

- `…/numfact/` öffnet das heutige Rätsel (alte Links funktionieren weiter).
- `…/numfact/?n=4&m=easy` öffnet #4, Stufe Easy. `m` ist `easy`, `hard`, `mirror` oder `impossible`.
- `…/numfact/en/?n=4&m=easy` dasselbe auf Englisch. `?lang=en` funktioniert weiterhin.
- Ein Link auf ein Rätsel, das in der eigenen Zeitzone noch nicht erschienen ist, öffnet das heutige Rätsel mit einem Hinweis, wann es erscheint.

## Regeln für die Uhr

- Die Uhr startet mit „Start“. Vorher ist der Code nicht zu sehen.
- Sie läuft nur, solange der Code sichtbar ist. Sie steht, wenn ein Menü offen ist, der Tab im Hintergrund liegt, die App verlassen wird, ⏸ gedrückt wurde oder ein anderer Tab dasselbe Rätsel übernimmt. Solange sie steht, ist der Code verdeckt.
- Nach dem Zurückkommen, Neuladen oder Wieder-Öffnen erscheint „Pausiert“ mit „Weiter“. Wechselt man selbst die Stufe oder Sprache, läuft die Uhr der neuen Stufe sofort.
- Jede Stufe und jede Sprache hat ihre eigene Uhr. Die Zeit wird alle 5 Sekunden und beim Verlassen gespeichert.
- Ergebnis, Stufen-Reiter, Teilen-Text und Statistik zeigen dieselbe, auf ganze Sekunden gerundete Zeit.

## Farben und Teilen

Im Ergebnis: 🟩 ohne Hilfe gelöst · 🟨 mit Tipp, Schlüssel oder Trennung · 🟥 aufgelöst. Einmal gelb bleibt gelb, auch wenn der aufgedeckte Buchstabe später überschrieben wird. Der Schlüssel bei Hard und Mirror kostet einen Tipp und gilt für genau den nächsten getippten Buchstaben; dessen Wort wird gelb. Die Zahlen bei Easy sind gratis und zählen nicht als Hilfe.

Geteilt werden nur Stufen, die tatsächlich gelöst wurden; aufgelöste und nicht gespielte fehlen. Die Ergebnisanzeige im Spiel bleibt vollständig.

Eine gelöste Stufe:
```
NUMIGMA #4 · Easy ⏱ 4:04
🟩🟩🟩🟩🟩🟩🟩
Schlägst du meine Zeit? https://gr3hab.github.io/numfact/?n=4&m=easy
```
Mehrere gelöste Stufen:
```
NUMIGMA #4
Easy ⏱ 4:04 🟩🟩🟩🟩🟩🟩🟩
Hard ⏱ 6:12 🟩🟨🟩🟩🟩
Schlägst du meine Zeiten? https://gr3hab.github.io/numfact/?n=4
```
Keine gelöst:
```
NUMIGMA #4
Heute nicht geknackt 😅
Schaffst du's? https://gr3hab.github.io/numfact/?n=4
```

## Neue Fakten hinzufügen

Ausführlich in [`_dev/redaktion/ANLEITUNG.md`](_dev/redaktion/ANLEITUNG.md). Kurz:

1. In `fakten.js` **ganz unten** einen neuen Eintrag mit der nächsten ID anhängen (Deutsch, Englisch, Thema, Quelle).
2. Bestehende Fakten von Tagen, die schon erschienen sind, nie ändern, umsortieren oder löschen. Die Tests prüfen das.
3. Als Pull Request einreichen. Die Tests laufen automatisch, der Faktenbericht steht in der Zusammenfassung des Laufs.

Satzregeln: nur Buchstaben und Leerzeichen, am Ende ein Punkt. Keine Ziffern, Kommas, Bindestriche oder Apostrophe. Ä, Ö, Ü und ß nur im Deutschen.

## Tests

Im Ordner `_dev`: `npm ci`, `npx playwright install chromium`, dann `npm test`. Details in [`_dev/README.md`](_dev/README.md). Dieselben Tests laufen bei jedem Pull Request auf GitHub. Jeden Montag prüft GitHub außerdem, ob der Faktenvorrat noch mindestens 14 Tage reicht, und meldet sich sonst per Mail.
