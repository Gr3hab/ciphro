# NUMIGMA

**Crack the code. Reveal the fact.**

Jeden Tag vier Zahlencodes von Easy bis Impossible. Hinter jedem steckt ein kurzer, wahrer Fakt. Auf Deutsch und Englisch.

Spielen: https://gr3hab.github.io/numfact/ · English: https://gr3hab.github.io/numfact/?lang=en

## Dateien

| Datei | Inhalt |
| --- | --- |
| `index.html` | Das Spiel |
| `fakten.js` | Deutsche Fakten, vier pro Tag, in Fahrplan-Reihenfolge |
| `facts-en.js` | Englische Fakten, gleiche Reihenfolge wie `fakten.js` |
| `kern.js` | Spiellogik (Codes, Tagesrätsel, Prüfungen) |
| `pruefen.html` | Prüfseite: Fehler in den Fakten, kommende Tage, bis wann die Fakten reichen |
| `og.png`, `icon*.png`, `manifest.webmanifest` | Vorschaubild, App-Icons, Home-Bildschirm-App |

## Neue Fakten hinzufügen

1. `fakten.js` öffnen, Stift-Symbol, neue Zeilen **ganz unten** anhängen.
2. Dieselben Fakten in derselben Reihenfolge in `facts-en.js` auf Englisch anhängen.
3. „Commit changes“. Nach ein paar Minuten ist es live.
4. `pruefen.html` öffnen und kontrollieren, ob alles grün ist.

Regeln für den Satz (`t`): nur Buchstaben und Leerzeichen, am Ende ein Punkt. Keine Ziffern, Kommas, Bindestriche oder Apostrophe. Im Deutschen sind Ä, Ö, Ü und ß erlaubt, im Englischen nicht. Bestehende Fakten nie umsortieren oder löschen, sonst ändern sich Rätsel, die schon gespielt wurden.

Die Fakten reichen derzeit bis **30. November 2026**.
