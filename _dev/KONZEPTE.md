# Konzepte und Bewertungen (nicht umgesetzt)

Diese Punkte aus dem Relaunch-Auftrag sind bewusst nur bewertet, nicht gebaut.

## Nutzungsdaten ohne Tracking (Vorschlag)

Heute misst NUMIGMA nichts. Das bleibt so, bis jemand eine konkrete Frage hat, die nur Zahlen beantworten können.

Falls es einmal nötig wird, in dieser Reihenfolge:

1. **Gar nichts im Spiel messen, sondern fragen.** Ein Link „Feedback“ zu einem Formular, freiwillig, ohne Pflichtfelder.
2. **Zählen ohne Personenbezug.** Ein selbst gehosteter, cookieloser Zähler (z. B. GoatCounter oder Plausible Community Edition) zählt nur Seitenaufrufe und „Rätsel gelöst“ pro Tag und Stufe. Keine IP-Speicherung, keine Wiedererkennung, kein Fingerprinting. Ehrlicher Satz in den Einstellungen.
3. **Nicht machen:** Google Analytics, Werbe-Pixel, Session-Recording, Einzelnutzer-Verläufe. Das widerspräche „kein Tracking“ und verlangt in der EU eine Einwilligung.

Hinweis: Schon heute lädt die Seite keine fremden Schriften mehr (früher Google Fonts). Damit gehen beim Spielen keine Daten an Dritte.

## Ideen aus P2, bewertet

| Idee | Bewertung | Empfehlung |
|---|---|---|
| Entspannter Modus ohne Zeitdruck | Sinnvoll für Ältere und Gelegenheitsspieler. Einfach: Uhr ausblenden, Zeit wird nicht geteilt und zählt nicht für Bestzeiten. | Als nächstes Feature, klein und risikoarm. |
| Persönliche Meilensteine („10 Codes ohne Hilfe“) | Nett, aber erzeugt Druck und Text. | Später, nur wenige und ruhig gestaltet. |
| Herausforderungen unter Freunden | Der Link mit Nummer und Stufe ist bereits die Herausforderung. Mehr bräuchte einen Server. | Nicht ohne Server. Der jetzige Link genügt. |
| Hilfe bei wiederkehrenden Buchstaben (gleiche Zahl = gleicher Buchstabe automatisch) | Würde Easy und Hard stark vereinfachen und das Spielprinzip ändern. | Höchstens als einschaltbare Hilfe, die gelb zählt. |
| Dezente Erinnerung | Ohne Server nur als Kalendereintrag oder über die Home-Bildschirm-App möglich. Push braucht einen Server. | Nicht jetzt. |
| Optional „Zum Home-Bildschirm hinzufügen“ | Geht bereits (Manifest, Icons). Ein eigener Hinweis wäre aufdringlich. | Höchstens einmalig nach dem dritten gelösten Tag. |
| Weitere Sprachen | Technisch vorbereitet (Fakten mit IDs, Texte getrennt). Aufwand ist die Redaktion: jeder Fakt muss in jeder Sprache geprüft werden. | Erst wenn Deutsch und Englisch stabil Nachschub haben. |
| Freiwillige Unterstützung | Ein schlichter Link („Kaffee spendieren“) in den Einstellungen wäre vertretbar. | Nicht im Spielablauf, keine bezahlten Tipps oder Auflösungen. |

## Was öffentlich ist (Lösungen)

Die Prüfseite mit allen Lösungen liegt jetzt in `_dev/` und wird nicht mehr veröffentlicht. `fakten.js` dagegen muss öffentlich sein, damit das Spiel funktioniert, und enthält alle Sätze, auch künftige. Wer gezielt hineinschaut, kann vorab nachlesen. Das ist eine Eigenschaft der jetzigen Bauweise (alles statisch, ohne Server), kein neuer Fehler.

- **Gewählt: pragmatisch.** Für ein kostenloses, freundschaftliches Rätselspiel genügt es, dass es keine Seite zum Durchblättern der Lösungen mehr gibt. Nirgends wird behauptet, künftige Lösungen seien geheim.
- **Alternative: tageweise veröffentlichen.** Nur Fakten bis heute (plus ein Tag Puffer wegen der Zeitzonen) liegen öffentlich, der Rest bleibt im Repository außerhalb der Seite und wird täglich per GitHub Actions nachgeschoben. Kosten: mehr bewegliche Teile, ein täglicher Automatik-Lauf, der nicht ausfallen darf, und künftige Rätsel sind offline nicht vorab verfügbar. Lohnt sich erst, wenn Spoiler wirklich ein Problem werden (z. B. bei Bestenlisten).
- Leichtes Verschleiern (z. B. Base64) wäre billig, hält aber niemanden ab, der sucht, und erschwert die Pflege von Hand. Nicht empfohlen.

## Entscheidungen und offene Punkte

- **Easy-Zahlen standardmäßig an (entschieden am 24. Oktober 2026):** Wer den Link zum ersten Mal bekommt, kann sofort loslegen, ohne das Alphabet durchzuzählen. Die Zahlen sind bei Easy kostenlos, zählen nicht als Hilfe und lassen sich abschalten; das bleibt gespeichert. Mehr Herausforderung bieten Hard, Mirror und Impossible.
- **Englische Tage #1–#16:** Die Zuordnung von Fakt zu Stufe weicht an sechs dieser Tage zwischen Deutsch und Englisch ab, weil sie so veröffentlicht wurde. Ab #17 ist sie in beiden Sprachen gleich.
- **Name des Repositorys:** Die Adresse lautet weiter `…/numfact/`. Eine Umbenennung in `numigma` würde alle bisherigen Links brechen (GitHub leitet Pages-Adressen nicht weiter).
- **Zahlen 0–9 für Jahreszahlen:** Würde neue Rätselarten ermöglichen, ändert aber die Regeln aller Stufen. Nicht umgesetzt.
