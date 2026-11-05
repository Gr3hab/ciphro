# Neue Fakten für CIPHRO

Jeder Tag braucht vier Fakten. Sie stehen alle in `fakten.js` im Hauptordner, in allen vier Sprachen: Deutsch, Englisch, Französisch, Italienisch.

## So sieht ein Eintrag aus

```js
{ id: 'n405', thema: 'weltall',
  de: ['Ein Tag auf dem Mars dauert etwas länger als bei uns.', 'Der Mars dreht sich in 24 Stunden und 37 Minuten einmal um sich selbst …'],
  en: ['A day on Mars is a little longer than a day on Earth.', 'Mars spins once in 24 hours and 37 minutes …'],
  fr: ['Une journée sur Mars dure un peu plus que chez nous.', 'Mars fait un tour sur elle-même en 24 heures et 37 minutes …'],
  it: ['Un giorno su Marte dura poco più che da noi.', 'Marte compie un giro su se stesso in 24 ore e 37 minuti …'],
  quellen: [{ name: 'Wikipedia (en): Mars', url: 'https://en.wikipedia.org/wiki/Mars' }] },
```

- `id`: die nächste freie Nummer (die letzte ID in der Datei plus eins).
- `thema`: eines von `tiere`, `pflanzen`, `weltall`, `wissenschaft`, `koerper`, `geschichte`, `geografie`, `technik`, `kultur`, `oesterreich`.
- `de`, `en`, `fr`, `it`: jeweils `[Satz, Erklärung]`. Derselbe Fakt in allen Sprachen. Fehlt eine Sprache, meldet die Prüfseite einen Fehler.
- `quellen`: mindestens eine echte, öffentlich abrufbare Quelle mit `https://`. Sie erscheint nach dem Lösen unter der Erklärung.

## Regeln für den Satz (das, was entschlüsselt wird)

- **Ohne Erklärung verständlich.** Laut vorlesen: Versteht jemand den Satz sofort? Gegenbeispiel aus #4: „Ein Zuckerwürfel Neutronenstern wiegt eine Milliarde Tonnen.“ Testspieler haben ihn nicht verstanden. Besser wäre gewesen: „Neutronensterne sind unglaublich schwer.“
- Nur Buchstaben und Leerzeichen, am Ende ein Punkt.
- Keine Ziffern, Kommas, Bindestriche, Apostrophe. Zahlen ausschreiben („vierzig“). Sätze mit Nebensatz so umbauen, dass kein Komma nötig ist.
- **Kein Ä, Ö, Ü und kein ß, auch nicht im Deutschen** (seit #9, 29. Oktober 2026). Im Spiel gibt es nur die 26 Buchstaben A bis Z. Umformulieren: „mehr als“ statt „über“, „sehr groß“ oder „riesig“ statt „größte“ nur, wenn es weiter stimmt. In der Erklärung sind Umlaute erlaubt. Die Prüfseite meldet einen Fehler, wenn ein Satz ab #9 einen Umlaut hat.
- Im Englischen kein „it's“ oder „Earth's“ („of the Earth“ schreiben).
- **Französisch und Italienisch:** Akzente sind im Satz erlaubt (é, è, à, ç, œ …), im Code fallen sie weg wie im Kreuzworträtsel (É → E, Œ → OE). Apostrophe und Bindestriche gehen auch hier nicht, also Sätze ohne Elision bauen: „La mer ne gèle que …“ statt „L’eau de mer …“, „en Islande“ statt „d’Islande“, „di acqua“ statt „d’acqua“, „ottantotto“ statt „quatre-vingt-huit“ (Zahlen mit Bindestrich umgehen). Wörter wie „arc-en-ciel“ oder „États-Unis“ umschreiben („aux USA“). In der Erklärung ist alles erlaubt, dort typografische Apostrophe (’) verwenden.
- Französisch und Italienisch brauchen oft mehr Wörter. Für Easy gilt trotzdem höchstens 8, also knapp formulieren („Le miel ne se gâte pratiquement jamais.“).
- Kurz halten: am besten 25 bis 45 Buchstaben. Der zweitkürzeste Satz eines Tages wird Easy, der kürzeste Impossible.
- **Easy ist der Einstieg:** Der Easy-Satz soll 5 bis 7 Wörter haben, höchstens 8, in jeder Sprache. Bei mehr meldet die Prüfseite einen Fehler. Dann einen der vier Fakten dieses Tages gegen einen mit weniger Wörtern tauschen. Gute Easy-Sätze sind auch ohne Vorwissen sofort klar.
- Keine sehr langen Wörter (mehr als etwa 16 Buchstaben, z. B. „Oberschenkelknochen“). Sie passen auf kleinen Handys nicht in eine Zeile. Die Prüfseite meldet das.
- Die Erklärung darf alles enthalten (Zahlen, Kommas). Sie sollte in zwei, drei Sätzen erklären, warum das stimmt.

## Regeln für den Inhalt

- **Nur geprüfte Fakten.** Vor dem Eintragen in mindestens einer verlässlichen Quelle nachlesen (Wikipedia mit Belegen, Museen, Universitäten, NASA, Behörden). Nie eine Quelle angeben, die man nicht selbst gelesen hat.
- Bei Superlativen genau sein: „ältester noch bestehender Zoo“ statt „ältester Zoo“, „kein Land hat mehr Seen“ statt „mehr Seen als der Rest der Welt“.
- Mythen sind gute Fakten, wenn die Auflösung belegt ist („Wikinger trugen keine Hörnerhelme“).
- An einem Tag sollen vier verschiedene Themen vorkommen. Nicht zwei Elefanten-Fakten hintereinander.
- Englisch, Französisch und Italienisch sollen natürlich klingen, nicht wörtlich übersetzt. Der Inhalt muss aber genau derselbe bleiben.

## Reihenfolge und veröffentlichte Rätsel

- Tag #n nimmt die Einträge 4n−3 bis 4n der Liste. **Neue Fakten immer ganz unten anhängen.**
- Ganz unten können geprüfte Fakten stehen, die noch keinen vollen Tag ergeben (Kommentar „noch kein voller Tag“). Neue Fakten kommen darunter, zusammen ergeben sie den nächsten Tag. Darauf achten, dass dieser Tag dann vier verschiedene Themen hat.
- Woher jeder Fakt stammt und was an welcher Stelle der Quelle steht, ist in `QUELLENPRUEFUNG.md` festgehalten. Neue Fakten dort ebenfalls eintragen.
- Einträge von Tagen, die schon erschienen sind, **nie umsortieren, löschen oder im Satz ändern**. Sonst ändern sich Rätsel, die Leute schon gespielt haben. Die automatischen Tests verhindern das.
- Ein Fehler in der Erklärung eines veröffentlichten Fakts darf korrigiert werden. Im Pull Request begründen und in `QUELLENPRUEFUNG.md` eintragen.
- Künftige Tage dürfen umgestellt werden, zum Beispiel für eine bessere Themenmischung oder kürzere Easy-Sätze (so geschehen am 25. Oktober 2026 für #17 bis #106 und am 28. Oktober 2026 ab #9: nur noch Sätze ohne Umlaute). Der Faktenbericht im GitHub-Lauf listet jede Änderung am Fahrplan auf, damit nichts unbemerkt passiert.

## Prüfen

1. `_dev/tools/pruefen.html` im Browser öffnen (Doppelklick genügt). Sie zeigt Fehler, Hinweise, wie lange der Vorrat reicht und die kommenden Rätsel mit Lösungen. Die Seite wird nicht veröffentlicht.
2. Änderung als Pull Request einreichen. GitHub führt alle Tests aus und schreibt den Faktenbericht in die Zusammenfassung des Laufs.
3. Erst wenn alles grün ist, zusammenführen. Nach ein paar Minuten ist es live.

Belege schneller finden: `python3 _dev/tools/belege.py spec.json` lädt Wikipedia-Artikel und zeigt die Sätze, die zu Suchwörtern passen. Das Werkzeug ersetzt nicht das Lesen, es hilft nur beim Finden.

## Geparkte Fakten mit Umlaut

In `_dev/redaktion/geparkt-umlaute.js` liegen geprüfte Fakten, deren deutscher Satz Ä, Ö, Ü oder ß enthält. Sie wurden am 28. Oktober 2026 aus dem Fahrplan genommen, nicht gelöscht. Das Spiel lädt diese Datei nicht. So kommt ein Fakt zurück:

1. Den deutschen Satz ohne Umlaut umformulieren. Bedeutung und Quelle müssen weiter passen, der englische Satz sagt dasselbe.
2. Französisch und Italienisch ergänzen (`fr`, `it`) nach den Regeln oben. Die geparkten Fakten haben nur Deutsch und Englisch.
3. Den ganzen Eintrag mit seiner ID in `fakten.js` ganz unten anhängen und in der geparkten Datei löschen.
4. Im Ordner `_dev`: `npm test`.

Seit der Umstellung reicht der Vorrat bis 14. Dezember 2026. Umformulierte Fakten verlängern ihn.

## Wenn der Vorrat knapp wird

Jeden Montag prüft GitHub, ob die Fakten noch mindestens 14 Tage reichen. Wenn nicht, schlägt der Lauf „Tests“ fehl und GitHub schickt eine E-Mail. Ist der Vorrat ganz aufgebraucht, wiederholt das Spiel frühere Tage der Reihe nach und sagt das offen („Wiederholung von #3“). Um die Wiederholung zu beenden: in `kern.js` unter `repeatGaps` den Zeitraum eintragen, in dem Wiederholungen liefen (zum Beispiel `[['2027-02-01', '2027-02-04']]`), dann neue Fakten unten anhängen. So bleiben die Wiederholungstage im Archiv unverändert und der nächste Tag bekommt die neuen Fakten. Wird das Eintragen vergessen, schlagen die Tests fehl.
