-- CIPHRO-Zähler: eine Zeile pro Tag, Ereignis, Sprache, Stufe und Archiv ja/nein, darin nur die Anzahl.
-- Die Tabelle zaehler wurde am 07.11.2026 in der D1-Konsole angelegt. Die Tabellen besuche und merkmale (seit 22.11.2026)
-- legt der Worker beim ersten Bedarf selbst an (CREATE TABLE IF NOT EXISTS, gleicher Text wie hier).
CREATE TABLE IF NOT EXISTS zaehler (
  datum    TEXT    NOT NULL CHECK (length(datum) = 10),
  ereignis TEXT    NOT NULL CHECK (ereignis IN ('aufruf', 'spieler', 'start', 'geloest', 'geteilt')),
  sprache  TEXT    NOT NULL CHECK (sprache IN ('de', 'en', 'fr', 'it')),
  stufe    TEXT    NOT NULL DEFAULT '' CHECK (stufe IN ('', 'easy', 'hard', 'mirror', 'impossible')),
  archiv   INTEGER NOT NULL DEFAULT 0 CHECK (archiv IN (0, 1)),
  anzahl   INTEGER NOT NULL DEFAULT 0 CHECK (anzahl >= 0),
  PRIMARY KEY (datum, ereignis, sprache, stufe, archiv)
);

-- Seitenaufrufe aller Besucher (ohne Einwilligung, nur Tagessumme je Seite und grober Herkunft)
CREATE TABLE IF NOT EXISTS besuche (
    datum TEXT NOT NULL CHECK (length(datum) = 10),
    seite TEXT NOT NULL CHECK (seite IN ('start', 'de', 'en', 'fr', 'it')),
    herkunft TEXT NOT NULL,
    anzahl INTEGER NOT NULL DEFAULT 0 CHECK (anzahl >= 0),
    PRIMARY KEY (datum, seite, herkunft));

-- Mit Einwilligung: Gruppen für Spieltage, Serie und Lösungszeit (nie genaue Werte)
CREATE TABLE IF NOT EXISTS merkmale (
    datum TEXT NOT NULL CHECK (length(datum) = 10),
    art TEXT NOT NULL CHECK (art IN ('tage', 'serie', 'dauer')),
    sprache TEXT NOT NULL CHECK (sprache IN ('de', 'en', 'fr', 'it')),
    stufe TEXT NOT NULL DEFAULT '' CHECK (stufe IN ('', 'easy', 'hard', 'mirror', 'impossible')),
    wert TEXT NOT NULL,
    anzahl INTEGER NOT NULL DEFAULT 0 CHECK (anzahl >= 0),
    PRIMARY KEY (datum, art, sprache, stufe, wert));
