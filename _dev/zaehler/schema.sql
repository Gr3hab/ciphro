-- CIPHRO-Zähler: eine Zeile pro Tag, Ereignis, Sprache, Stufe und Archiv ja/nein, darin nur die Anzahl.
-- Einmal in der D1-Konsole ausführen (siehe ANLEITUNG.md).
CREATE TABLE IF NOT EXISTS zaehler (
  datum    TEXT    NOT NULL CHECK (length(datum) = 10),
  ereignis TEXT    NOT NULL CHECK (ereignis IN ('aufruf', 'spieler', 'start', 'geloest', 'geteilt')),
  sprache  TEXT    NOT NULL CHECK (sprache IN ('de', 'en', 'fr', 'it')),
  stufe    TEXT    NOT NULL DEFAULT '' CHECK (stufe IN ('', 'easy', 'hard', 'mirror', 'impossible')),
  archiv   INTEGER NOT NULL DEFAULT 0 CHECK (archiv IN (0, 1)),
  anzahl   INTEGER NOT NULL DEFAULT 0 CHECK (anzahl >= 0),
  PRIMARY KEY (datum, ereignis, sprache, stufe, archiv)
);
