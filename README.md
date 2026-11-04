# CIPHRO

**Crack the code. Reveal the fact.**

Jeden Tag vier Zahlencodes von Easy bis Impossible. Hinter jedem steckt ein kurzer, wahrer Fakt. Auf Deutsch und Englisch. Kein Konto, keine Werbung, kein Tracking.

Spielen: https://ciphro.eu/ · English: https://ciphro.eu/en/

Bis November 2026 hieß das Spiel NUMIGMA und lag unter `gr3hab.github.io/numfact`. Die alte Adresse (Repository `Gr3hab/numfact`) leitet nur noch hierher weiter und nimmt den Spielstand mit, siehe „Umzug“ unten.

## Dateien

| Datei | Inhalt | Öffentlich |
| --- | --- | --- |
| `index.html` | Das Spiel | ja |
| `fakten.js` | Alle Fakten, Deutsch und Englisch, mit ID, Thema und Quellen | ja |
| `kern.js` | Spiellogik: Codes, Tagesrätsel, Prüfungen | ja |
| `en/index.html` | Englischer Einstieg für geteilte Links (englische Vorschau in WhatsApp & Co.) | ja |
| `sw.js` | Offline-Hilfe: zuletzt geladene Fassung, wenn keine Verbindung da ist | ja |
| `fonts/` | Schriften (lokal, keine Anfragen an fremde Server) | ja |
| `og-de.png`, `og-en.png`, `icon*.png`, `manifest.webmanifest` | Vorschaubilder für geteilte Links (Deutsch und Englisch, gleiches Design), App-Icons, Home-Bildschirm-App. Alle erzeugt mit `_dev/grafik/render.js` | ja |
| `impressum.html`, `datenschutz.html`, `recht.css` | Impressum und Datenschutz (Deutsch, darunter Englisch). Verlinkt in den Einstellungen | ja |
| `CNAME` | Eigene Adresse `ciphro.eu` für GitHub Pages | ja |
| `_dev/` | Prüfseite, Tests, Redaktionsunterlagen, Nachweise | **nein** |

GitHub Pages veröffentlicht Ordner, die mit `_` beginnen, nicht. Die Prüfseite mit allen Lösungen und alles für die Redaktion liegt deshalb in `_dev/`.

**Was trotzdem öffentlich ist:** `fakten.js` muss abrufbar sein, damit das Spiel läuft. Darin stehen alle Sätze, auch die von künftigen Tagen. Wer gezielt in die Datei schaut, kann also vorab nachlesen. Für ein freundschaftliches Rätselspiel ist das bewusst so akzeptiert; die künftigen Lösungen sind nicht geheim, nur nicht mehr auf einer Seite zum Durchblättern. Eine tageweise Veröffentlichung ist in `_dev/KONZEPTE.md` beschrieben.

## Links zum Teilen

- `https://ciphro.eu/` öffnet das heutige Rätsel.
- `https://ciphro.eu/?n=4&m=easy` öffnet #4, Stufe Easy. `m` ist `easy`, `hard`, `mirror` oder `impossible`.
- `https://ciphro.eu/en/?n=4&m=easy` dasselbe auf Englisch. `?lang=en` funktioniert weiterhin.
- Alte Links auf `gr3hab.github.io/numfact/…` landen mit denselben Angaben hier.
- Ein Link auf ein Rätsel, das in der eigenen Zeitzone noch nicht erschienen ist, öffnet das heutige Rätsel mit einem Hinweis, wann es erscheint.
- Die Linkvorschau (WhatsApp & Co.) sagt auf Deutsch, was CIPHRO ist und dass es kostenlos ist, ohne Anmeldung und ohne Werbung. Das Bild `og-de.png` hat den deutschen Slogan „Knacke den Code. Entdecke den Fakt.“ `en/` hat eine eigene englische Vorschau mit `og-en.png`.

## Regeln für die Uhr

- Die Uhr startet mit „Start“. Vorher ist der Code nicht zu sehen.
- Sie läuft nur, solange der Code sichtbar ist. Sie steht, wenn ein Menü offen ist, der Tab im Hintergrund liegt, die App verlassen wird, die Pause-Taste gedrückt wurde oder ein anderer Tab dasselbe Rätsel übernimmt. Solange sie steht, ist der Code verdeckt.
- Nach dem Zurückkommen, Neuladen oder Wieder-Öffnen erscheint „Pausiert“ mit „Weiter“. Wechselt man selbst die Stufe oder Sprache, läuft die Uhr der neuen Stufe sofort.
- Jede Stufe und jede Sprache hat ihre eigene Uhr. Die Zeit wird alle 5 Sekunden und beim Verlassen gespeichert.
- Ergebnis, Stufen-Reiter, Teilen-Text und Statistik zeigen dieselbe, auf ganze Sekunden gerundete Zeit.

## Farben und Teilen

Im Ergebnis: 🟩 ohne Hilfe gelöst · 🟨 mit Tipp, Schlüssel oder Trennung · 🟥 aufgelöst. Einmal gelb bleibt gelb, auch wenn der aufgedeckte Buchstabe später überschrieben wird. Der Schlüssel bei Hard und Mirror kostet einen Tipp und gilt für genau den nächsten getippten Buchstaben; dessen Wort wird gelb. Die Zahlen bei Easy sind gratis und zählen nicht als Hilfe.

Geteilt werden nur Stufen, die tatsächlich gelöst wurden; aufgelöste und nicht gespielte fehlen. Die Ergebnisanzeige im Spiel bleibt vollständig.

Eine gelöste Stufe:
```
CIPHRO #4 · Easy ⏱ 4:04
🟩🟩🟩🟩🟩🟩🟩
Schlägst du meine Zeit? https://ciphro.eu/?n=4&m=easy
```
Mehrere gelöste Stufen:
```
CIPHRO #4
Easy ⏱ 4:04 🟩🟩🟩🟩🟩🟩🟩
Hard ⏱ 6:12 🟩🟨🟩🟩🟩
Schlägst du meine Zeiten? https://ciphro.eu/?n=4
```
Keine gelöst:
```
CIPHRO #4
Heute nicht geknackt 😅
Schaffst du's? https://ciphro.eu/?n=4
```

## Umzug von der alten Adresse

Der Browser speichert den Spielstand pro Adresse. Auf `ciphro.eu` wäre er ohne Hilfe leer. Deshalb:

1. Die alte Seite (`Gr3hab/numfact`) liest den Spielstand (`numfact.v2`), meldet ihre Offline-Hilfe ab und leitet sofort weiter: `https://ciphro.eu/` (oder `/en/`) mit denselben Angaben `?n=…&m=…` und dem Spielstand im Anker `#import=…` (Base64url von JSON). Ohne Spielstand nur `#moved`.
2. Der Anker geht nie an einen Server. CIPHRO übernimmt den Stand, entfernt den Anker sofort aus der Adresse und sagt einmal „NUMIGMA heißt jetzt CIPHRO. Dein Spielstand ist mitgekommen.“
3. Wer auf `ciphro.eu` schon gespielt hat, verliert nichts: Pro Tag und Stufe gilt, was weiter ist (gelöst vor aufgelöst vor angefangen vor offen), bei Gleichstand der Stand hier. Einstellungen von alt nur, wo hier noch keine gewählt ist.

Der Schlüssel `numfact.v2` bleibt, damit nichts umbenannt werden muss.

## Neue Fakten hinzufügen

Ausführlich in [`_dev/redaktion/ANLEITUNG.md`](_dev/redaktion/ANLEITUNG.md). Kurz:

1. In `fakten.js` **ganz unten** einen neuen Eintrag mit der nächsten ID anhängen (Deutsch, Englisch, Thema, Quelle).
2. Bestehende Fakten von Tagen, die schon erschienen sind, nie ändern, umsortieren oder löschen. Die Tests prüfen das.
3. Als Pull Request einreichen. Die Tests laufen automatisch, der Faktenbericht steht in der Zusammenfassung des Laufs.

Satzregeln: nur Buchstaben und Leerzeichen, am Ende ein Punkt. Keine Ziffern, Kommas, Bindestriche oder Apostrophe. Ä, Ö, Ü und ß nur im Deutschen.

## Tests

Im Ordner `_dev`: `npm ci`, `npx playwright install chromium`, dann `npm test`. Details in [`_dev/README.md`](_dev/README.md). Dieselben Tests laufen bei jedem Pull Request auf GitHub. Jeden Montag prüft GitHub außerdem, ob der Faktenvorrat noch mindestens 14 Tage reicht, und meldet sich sonst per Mail.
