# Neue Fakten für NUMIGMA

Jeder Tag braucht vier Fakten. Sie stehen alle in `fakten.js` im Hauptordner, in beiden Sprachen.

## So sieht ein Eintrag aus

```js
{ id: 'n405', thema: 'weltall',
  de: ['Ein Tag auf dem Mars dauert etwas länger als bei uns.', 'Der Mars dreht sich in 24 Stunden und 37 Minuten einmal um sich selbst …'],
  en: ['A day on Mars is a little longer than a day on Earth.', 'Mars spins once in 24 hours and 37 minutes …'],
  quellen: [{ name: 'Wikipedia (en): Mars', url: 'https://en.wikipedia.org/wiki/Mars' }] },
```

- `id`: die nächste freie Nummer (die letzte ID in der Datei plus eins).
- `thema`: eines von `tiere`, `pflanzen`, `weltall`, `wissenschaft`, `koerper`, `geschichte`, `geografie`, `technik`, `kultur`, `oesterreich`.
- `de` und `en`: jeweils `[Satz, Erklärung]`. Derselbe Fakt in beiden Sprachen.
- `quellen`: mindestens eine echte, öffentlich abrufbare Quelle mit `https://`. Sie erscheint nach dem Lösen unter der Erklärung.

## Regeln für den Satz (das, was entschlüsselt wird)

- **Ohne Erklärung verständlich.** Laut vorlesen: Versteht jemand den Satz sofort? Gegenbeispiel aus #4: „Ein Zuckerwürfel Neutronenstern wiegt eine Milliarde Tonnen.“ Testspieler haben ihn nicht verstanden. Besser wäre gewesen: „Neutronensterne sind unglaublich schwer.“
- Nur Buchstaben und Leerzeichen, am Ende ein Punkt.
- Keine Ziffern, Kommas, Bindestriche, Apostrophe. Zahlen ausschreiben („vierzig“). Sätze mit Nebensatz so umbauen, dass kein Komma nötig ist.
- Ä, Ö, Ü und ß nur im Deutschen. Im Englischen auch kein „it's“ oder „Earth's“ („of the Earth“ schreiben).
- Kurz halten: am besten 25 bis 45 Buchstaben. Der zweitkürzeste Satz eines Tages wird Easy, der kürzeste Impossible.
- Keine sehr langen Wörter (mehr als etwa 16 Buchstaben, z. B. „Oberschenkelknochen“). Sie passen auf kleinen Handys nicht in eine Zeile. Die Prüfseite meldet das.
- Die Erklärung darf alles enthalten (Zahlen, Kommas). Sie sollte in zwei, drei Sätzen erklären, warum das stimmt.

## Regeln für den Inhalt

- **Nur geprüfte Fakten.** Vor dem Eintragen in mindestens einer verlässlichen Quelle nachlesen (Wikipedia mit Belegen, Museen, Universitäten, NASA, Behörden). Nie eine Quelle angeben, die man nicht selbst gelesen hat.
- Bei Superlativen genau sein: „ältester noch bestehender Zoo“ statt „ältester Zoo“, „kein Land hat mehr Seen“ statt „mehr Seen als der Rest der Welt“.
- Mythen sind gute Fakten, wenn die Auflösung belegt ist („Wikinger trugen keine Hörnerhelme“).
- An einem Tag sollen vier verschiedene Themen vorkommen. Nicht zwei Elefanten-Fakten hintereinander.
- Englisch soll natürlich klingen, nicht wörtlich übersetzt.

## Reihenfolge und veröffentlichte Rätsel

- Tag #n nimmt die Einträge 4n−3 bis 4n der Liste. **Neue Fakten immer ganz unten anhängen.**
- Ganz unten können geprüfte Fakten stehen, die noch keinen vollen Tag ergeben (Kommentar „noch kein voller Tag“). Neue Fakten kommen darunter, zusammen ergeben sie den nächsten Tag. Darauf achten, dass dieser Tag dann vier verschiedene Themen hat.
- Woher jeder Fakt stammt und was an welcher Stelle der Quelle steht, ist in `QUELLENPRUEFUNG.md` festgehalten. Neue Fakten dort ebenfalls eintragen.
- Einträge von Tagen, die schon erschienen sind, **nie umsortieren, löschen oder im Satz ändern**. Sonst ändern sich Rätsel, die Leute schon gespielt haben. Die automatischen Tests verhindern das.
- Ein Fehler in der Erklärung eines veröffentlichten Fakts darf korrigiert werden. Im Pull Request begründen und in `QUELLENPRUEFUNG.md` eintragen.
- Künftige Tage dürfen umgestellt werden, zum Beispiel für eine bessere Themenmischung. Der Faktenbericht im GitHub-Lauf listet jede Änderung am Fahrplan auf, damit nichts unbemerkt passiert.

## Prüfen

1. `_dev/tools/pruefen.html` im Browser öffnen (Doppelklick genügt). Sie zeigt Fehler, Hinweise, wie lange der Vorrat reicht und die kommenden Rätsel mit Lösungen. Die Seite wird nicht veröffentlicht.
2. Änderung als Pull Request einreichen. GitHub führt alle Tests aus und schreibt den Faktenbericht in die Zusammenfassung des Laufs.
3. Erst wenn alles grün ist, zusammenführen. Nach ein paar Minuten ist es live.

Belege schneller finden: `python3 _dev/tools/belege.py spec.json` lädt Wikipedia-Artikel und zeigt die Sätze, die zu Suchwörtern passen. Das Werkzeug ersetzt nicht das Lesen, es hilft nur beim Finden.

## Wenn der Vorrat knapp wird

Jeden Montag prüft GitHub, ob die Fakten noch mindestens 14 Tage reichen. Wenn nicht, schlägt der Lauf „Tests“ fehl und GitHub schickt eine E-Mail. Ist der Vorrat ganz aufgebraucht, wiederholt das Spiel frühere Tage der Reihe nach und sagt das offen („Wiederholung von #3“). Um die Wiederholung zu beenden: in `kern.js` unter `repeatGaps` den Zeitraum eintragen, in dem Wiederholungen liefen (zum Beispiel `[['2027-02-01', '2027-02-04']]`), dann neue Fakten unten anhängen. So bleiben die Wiederholungstage im Archiv unverändert und der nächste Tag bekommt die neuen Fakten. Wird das Eintragen vergessen, schlagen die Tests fehl.
