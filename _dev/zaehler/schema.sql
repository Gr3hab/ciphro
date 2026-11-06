-- CIPHRO-Zähler: eine Zeile pro Tag, Ereignis, Sprache, Stufe und Archiv ja/nein, darin nur die Anzahl.
-- Einmal in der D1-Konsole ausführen (siehe ANLEITUNG.md).
CREATE TABLE IF NOT EXISTS zaehler (
  datum    TEXT    NOT NULL,             -- Tag in Wiener Zeit, z. B. 2026-11-08
  ereignis TEXT    NOT NULL,             -- aufruf, spieler, start, geloest, geteilt
  sprache  TEXT    NOT NULL,             -- de, en, fr, it
  stufe    TEXT    NOT NULL DEFAULT '',  -- easy, hard, mirror, impossible oder leer
  archiv   INTEGER NOT NULL DEFAULT 0,   -- 1 = älteres Rätsel aus dem Archiv
  anzahl   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (datum, ereignis, sprache, stufe, archiv)
);
