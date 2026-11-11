# CIPHRO

**Crack the code. Reveal the fact.**

Jeden Tag vier Zahlencodes von Easy bis Impossible. Hinter jedem steckt ein kurzer, wahrer Fakt. Auf Deutsch, Englisch, Französisch und Italienisch. Kein Konto, keine Werbung, kein Tracking (nur ein anonymer Zähler, wenn du zustimmst, siehe unten).

Spielen: https://ciphro.eu/ · English: https://ciphro.eu/en/ · Français: https://ciphro.eu/fr/ · Italiano: https://ciphro.eu/it/

Bis November 2026 hieß das Spiel NUMIGMA und lag unter `gr3hab.github.io/numfact`. Die alte Adresse (Repository `Gr3hab/numfact`) leitet nur noch hierher weiter und nimmt den Spielstand mit, siehe „Umzug“ unten.

## Dateien

| Datei | Inhalt | Öffentlich |
| --- | --- | --- |
| `index.html` | Das Spiel (Startseite, wählt die Sprache selbst) | ja |
| `fakten.js` | Alle Fakten auf Deutsch, Englisch, Französisch und Italienisch, mit ID, Thema und Quellen | ja |
| `kern.js` | Spiellogik: Codes, Tagesrätsel, Prüfungen | ja |
| `de/`, `en/`, `fr/`, `it/` | Das Spiel je Sprache, für Suchmaschinen und geteilte Links (eigener Titel, eigene Vorschau). **Erzeugt** aus `index.html` mit `_dev/tools/sprachseiten.js`, nicht von Hand ändern | ja |
| `sitemap.xml`, `robots.txt`, `404.html` | Für Suchmaschinen: Liste aller Sprachseiten, Erlaubnis zum Durchsuchen, Seite für unbekannte Adressen. `sitemap.xml` ist erzeugt | ja |
| `429c7c….txt` | IndexNow-Schlüssel: Damit meldet `.github/workflows/indexnow.yml` Änderungen an Bing und Co. Öffentlich, das ist so vorgesehen | ja |
| `sw.js` | Offline-Hilfe: zuletzt geladene Fassung, wenn keine Verbindung da ist | ja |
| `fonts/` | Schriften (lokal, keine Anfragen an fremde Server) | ja |
| `og-de.png`, `og-en.png`, `og-fr.png`, `og-it.png`, `icon*.png`, `manifest.webmanifest` | Vorschaubilder für geteilte Links (je Sprache, gleiches Design), App-Icons, Home-Bildschirm-App. Alle erzeugt mit `_dev/grafik/render.js` | ja |
| `impressum.html`, `datenschutz.html`, `recht.css` | Impressum und Datenschutz (Deutsch, darunter Englisch, Französisch, Italienisch). Verlinkt in den Einstellungen | ja |
| `CNAME` | Eigene Adresse `ciphro.eu` für GitHub Pages | ja |
| `_dev/` | Prüfseite, Tests, Redaktionsunterlagen, Nachweise, Code des anonymen Zählers (`_dev/zaehler/`, läuft bei Cloudflare) | **nein** |

GitHub Pages veröffentlicht Ordner, die mit `_` beginnen, nicht. Die Prüfseite mit allen Lösungen und alles für die Redaktion liegt deshalb in `_dev/`.

**Was trotzdem öffentlich ist:** `fakten.js` muss abrufbar sein, damit das Spiel läuft. Darin stehen alle Sätze, auch die von künftigen Tagen. Wer gezielt in die Datei schaut, kann also vorab nachlesen. Für ein freundschaftliches Rätselspiel ist das bewusst so akzeptiert; die künftigen Lösungen sind nicht geheim, nur nicht mehr auf einer Seite zum Durchblättern. Eine tageweise Veröffentlichung ist in `_dev/KONZEPTE.md` beschrieben.

## Suchmaschinen

- Jede Sprache hat eine feste Adresse: `ciphro.eu/de/`, `/en/`, `/fr/`, `/it/`. Dort erscheint das Spiel immer in dieser Sprache, mit eigenem Titel und eigener Beschreibung. Die Startseite `ciphro.eu/` wählt die Sprache selbst (gespeicherte Wahl, sonst Browsersprache) und ist für Suchmaschinen die Seite für alle anderen Sprachen („x-default“).
- Alle Seiten verweisen aufeinander (`hreflang`), jede hat `canonical` auf sich selbst. Archivlinks mit `?n=` zählen deshalb nicht als eigene Seiten.
- Ein kurzer Text in der Sprache steht fest in der Seite. Ihn lesen auch Suchmaschinen, die kein JavaScript ausführen. Sobald das Spiel startet, ersetzt es den Text.
- Nach jeder Änderung an `index.html`: im Ordner `_dev` `node tools/sprachseiten.js` ausführen. Die Tests schlagen fehl, solange die Sprachseiten veraltet sind. Titel, Beschreibungen und Vorschau-Texte stehen in `_dev/tools/sprachseiten.js`, der Titel im Browser zusätzlich als `pageTitle` in `index.html` (ein Test prüft, dass beide gleich sind).
- Nach jeder Veröffentlichung meldet `.github/workflows/indexnow.yml` die fünf Adressen an IndexNow (Bing, Yandex, Seznam, Naver, Yep). Google nimmt daran nicht teil und liest die Sitemap.

## Links zum Teilen

- `https://ciphro.eu/` öffnet das heutige Rätsel.
- `https://ciphro.eu/?n=4&m=easy` öffnet #4, Stufe Easy. `m` ist `easy`, `hard`, `mirror` oder `impossible`.
- `https://ciphro.eu/en/?n=4&m=easy` dasselbe auf Englisch, `fr/` auf Französisch, `it/` auf Italienisch, `de/` immer auf Deutsch. `?lang=en` (oder `fr`, `it`) auf der Startseite funktioniert weiterhin.
- Alte Links auf `gr3hab.github.io/numfact/…` landen mit denselben Angaben hier.
- Ein Link auf ein Rätsel, das in der eigenen Zeitzone noch nicht erschienen ist, öffnet das heutige Rätsel mit einem Hinweis, wann es erscheint.
- Die Linkvorschau (WhatsApp & Co.) sagt auf Deutsch, was CIPHRO ist und dass es kostenlos ist, ohne Anmeldung und ohne Werbung. Das Bild `og-de.png` hat den deutschen Slogan „Knacke den Code. Entdecke den Fakt.“ `en/`, `fr/` und `it/` haben eine eigene Vorschau in ihrer Sprache (`og-en.png`, `og-fr.png`, `og-it.png`).

## Regeln für die Uhr

- Die Uhr startet mit „Start“. Vorher ist der Code nicht zu sehen.
- Sie läuft nur, solange der Code sichtbar ist. Sie steht, wenn ein Menü offen ist, der Tab im Hintergrund liegt, die App verlassen wird, die Pause-Taste gedrückt wurde oder ein anderer Tab dasselbe Rätsel übernimmt. Solange sie steht, ist der Code verdeckt.
- Nach dem Zurückkommen, Neuladen oder Wieder-Öffnen erscheint „Pausiert“ mit „Weiter“. Wechselt man selbst die Stufe oder Sprache, läuft die Uhr der neuen Stufe sofort.
- Jede Stufe und jede Sprache hat ihre eigene Uhr. Die Zeit wird alle 5 Sekunden und beim Verlassen gespeichert.
- Ergebnis, Teilen-Text und Statistik zeigen die Zeit auf Hundertstel (`1:24,97`, auf Englisch `1:24.97`). Uhr und Stufen-Reiter zeigen ganze Sekunden. Beide schneiden ab statt zu runden, deshalb passt die Uhr immer zum genauen Wert (`1:24` → `1:24,97`).

## Farben und Teilen

Im Ergebnis: 🟩 ohne Hilfe gelöst · 🟨 mit Tipp, Schlüssel oder Trennung · 🟥 aufgelöst. Einmal gelb bleibt gelb, auch wenn der aufgedeckte Buchstabe später überschrieben wird. Die Zahlen auf der Tastatur („Schlüssel“) sind bei Easy und Hard gratis, standardmäßig an und zählen nicht als Hilfe. Ausschalten gilt für beide Stufen und bleibt gespeichert (Knopf „Schlüssel“ oder Einstellungen). Bei Mirror kostet der Schlüssel einen Tipp und gilt für genau den nächsten getippten Buchstaben; dessen Wort wird gelb. Bei Impossible gibt es keinen.

⭐ hinter der Zeit (Ergebnis und geteilter Text): Easy oder Hard gelöst, ohne dass die Zahlen in diesem Rätsel je zu sehen waren. Wer sie unterwegs einblendet, wird vorher gefragt. Rätsel, die vor dieser Regel begonnen wurden, bekommen keinen Stern.

Geteilt werden nur Stufen, die tatsächlich gelöst wurden; aufgelöste und nicht gespielte fehlen. Die Ergebnisanzeige im Spiel bleibt vollständig.

Eine gelöste Stufe:
```
CIPHRO #4 · Easy ⏱ 4:04,37
🟩🟩🟩🟩🟩🟩🟩
🔥 Serie: 3 Tage
Schlägst du meine Zeit? https://ciphro.eu/?n=4&m=easy
```
Die Zeile mit der Serie steht nur ab 2 Tagen in Folge und nie bei Archivrätseln.
Mehrere gelöste Stufen: je Stufe eine Zeile mit der Zeit, darunter die Kästchen allein. So bricht WhatsApp sie am Handy nicht um (ab #19 hat jeder Satz höchstens 8 Wörter, also höchstens 8 Kästchen):
```
CIPHRO #4
Easy ⏱ 4:04,37
🟩🟩🟩🟩🟩🟩🟩
Hard ⏱ 6:12,05
🟩🟨🟩🟩🟩
Schlägst du meine Zeiten? https://ciphro.eu/?n=4
```
Keine gelöst:
```
CIPHRO #4
Heute nicht geknackt 😅
Schaffst du's? https://ciphro.eu/?n=4
```

## Anonymer Zähler

CIPHRO kann mitzählen, wie oft gespielt wird, ohne jemanden zu erkennen, **aber nur mit Zustimmung**: Standardmäßig aus; nach dem ersten fertigen Rätsel fragt das Spiel einmal „Dürfen wir anonym mitzählen?“ (Ja und Nein gleichwertig, später in den Einstellungen änderbar). Mit Ja meldet es nur Ereignis (Seite aufgerufen, erstes Rätsel des Tages begonnen, Stufe gestartet, Stufe gelöst, geteilt), Sprache, Stufe und Archiv ja/nein an `https://zaehler.ciphro.eu/z`. Ein Cloudflare Worker zählt daraus Tagessummen in einer D1-Datenbank. Keine IP-Adresse, keine Kennung, kein Cookie. Nur auf `ciphro.eu`, nie bei Global Privacy Control / Do Not Track. Code, Einrichtung und wie man die Zahlen ansieht: [`_dev/zaehler/ANLEITUNG.md`](_dev/zaehler/ANLEITUNG.md). Beschrieben in `datenschutz.html`.

## Besucherzahlen (Cloudflare)

Unabhängig vom Zähler: `ciphro.eu` läuft über Cloudflare als Zwischenstation (Proxy, „orange Wolke“) vor GitHub Pages. Cloudflare zählt die Aufrufe auf dem Server mit, ohne Cookie und ohne Skript im Spiel. Ansehen: Cloudflare → ciphro.eu → Analytics & Logs → Web Traffic (eindeutige Besucher, Anfragen, Datenmenge; im Gratis-Tarif keine Seitenaufrufe, Bots sind nicht herausgerechnet). Damit das so bleibt, müssen in Cloudflare **aus** sein: Email Address Obfuscation (fügt sonst ein Skript ein), die automatische Einrichtung von Web Analytics (fügt sonst ein Messskript ein) und alles, was Cookies setzt. SSL-Modus „Full“, nicht „Flexible“ (sonst Umleitungsschleife) und nicht „Full (strict)“ (GitHub kann sein Zertifikat hinter dem Proxy nicht erneuern). Beschrieben in `datenschutz.html`.

## Umzug von der alten Adresse

Der Browser speichert den Spielstand pro Adresse. Auf `ciphro.eu` wäre er ohne Hilfe leer. Deshalb:

1. Die alte Seite (`Gr3hab/numfact`) liest den Spielstand (`numfact.v2`), meldet ihre Offline-Hilfe ab und leitet sofort weiter: `https://ciphro.eu/` (oder `/en/`) mit denselben Angaben `?n=…&m=…` und dem Spielstand im Anker `#import=…` (Base64url von JSON). Ohne Spielstand nur `#moved`.
2. Der Anker geht nie an einen Server. CIPHRO übernimmt den Stand, entfernt den Anker sofort aus der Adresse und sagt einmal „NUMIGMA heißt jetzt CIPHRO. Dein Spielstand ist mitgekommen.“
3. Wer auf `ciphro.eu` schon gespielt hat, verliert nichts: Pro Tag und Stufe gilt, was weiter ist (gelöst vor aufgelöst vor angefangen vor offen), bei Gleichstand der Stand hier. Einstellungen von alt nur, wo hier noch keine gewählt ist.

Der Schlüssel `numfact.v2` bleibt, damit nichts umbenannt werden muss.

## Neue Fakten hinzufügen

Ausführlich in [`_dev/redaktion/ANLEITUNG.md`](_dev/redaktion/ANLEITUNG.md). Kurz:

1. In `fakten.js` **ganz unten** einen neuen Eintrag mit der nächsten ID anhängen (Deutsch, Englisch, Französisch, Italienisch, Thema, Quelle).
2. Bestehende Fakten von Tagen, die schon erschienen sind, nie ändern, umsortieren oder löschen. Die Tests prüfen das.
3. Als Pull Request einreichen. Die Tests laufen automatisch, der Faktenbericht steht in der Zusammenfassung des Laufs.

Satzregeln: nur Buchstaben und Leerzeichen, am Ende ein Punkt. Keine Ziffern, Kommas, Bindestriche oder Apostrophe. Seit #9 nur A bis Z, auch im Deutschen kein Ä, Ö, Ü, ß. Seit #19 (8. November 2026) in allen vier Sprachen nur A bis Z, also auch im Französischen und Italienischen keine Akzente, und höchstens 8 Wörter pro Satz. Der Fahrplan reicht bis 31. Dezember 2026 (#72).

## Tests

Im Ordner `_dev`: `npm ci`, `npx playwright install chromium`, dann `npm test`. Details in [`_dev/README.md`](_dev/README.md). Dieselben Tests laufen bei jedem Pull Request auf GitHub. Jeden Montag prüft GitHub außerdem, ob der Faktenvorrat noch mindestens 14 Tage reicht, und meldet sich sonst per Mail.
