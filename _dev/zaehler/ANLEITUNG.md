# Anonymer Zähler für CIPHRO

Beantwortet die Frage „Haben wir überhaupt Nutzer?“, ohne Tracking: Das Spiel meldet nur, **dass** etwas passiert ist (Seite aufgerufen, erstes Rätsel des Tages begonnen, Stufe gestartet, Stufe gelöst, Ergebnis geteilt), mit Sprache, Stufe und Archiv ja/nein. Der Zähler speichert davon nur Tagessummen. Keine IP-Adresse, keine Kennung, kein Cookie.

| Datei | Inhalt |
|---|---|
| `worker.js` | Der Zähler (Cloudflare Worker). Nimmt Meldungen von ciphro.eu an und zeigt die Statistik. |
| `schema.sql` | Die eine Tabelle der Datenbank. |
| `wrangler.toml` | Nur für die Einrichtung über die Kommandozeile (statt Dashboard). |

Im Spiel steht der Gegenpart in `index.html` (Suche nach `countEvent`). **Standardmäßig aus:** Nach dem ersten gelösten oder aufgelösten Rätsel fragt das Spiel im Ergebnis einmal „Dürfen wir anonym mitzählen?“ mit zwei gleichwertigen Knöpfen. Erst nach „Ja“ (oder dem Schalter in den Einstellungen) geht überhaupt eine Anfrage an den Zähler. Gefragt und gezählt wird nur auf `ciphro.eu` (nie lokal, in Tests oder Vorschauen) und nie bei Global Privacy Control / Do Not Track.

**Kosten:** Der kostenlose Workers-Plan erlaubt 100.000 Aufrufe pro Tag, D1 kostenlos 100.000 geschriebene und 5 Millionen gelesene Zeilen pro Tag und 5 GB Speicher (Stand November 2026, [Workers](https://developers.cloudflare.com/workers/platform/pricing/), [D1](https://developers.cloudflare.com/d1/platform/pricing/)). Jede Meldung schreibt eine Zeile. Mit grob 5 Meldungen pro Spieler und Tag reicht das für rund 20.000 Spieler am Tag. Ist die Grenze erreicht, gehen weitere Meldungen an diesem Tag verloren; das Spiel merkt davon nichts.

## Einrichten im Cloudflare-Dashboard (einmalig, etwa 15 Minuten)

Voraussetzung: Die Domain `ciphro.eu` liegt schon bei Cloudflare (ist so, wegen DNS und E-Mail).

1. **Datenbank anlegen:** Dashboard → **D1 SQL database** → **Create Database** → Name `ciphro-zaehler` → **Create**.
2. **Tabelle anlegen:** In der neuen Datenbank den Reiter **Console** öffnen, den Inhalt von `schema.sql` einfügen, **Execute**.
3. **Worker anlegen:** **Workers & Pages** → **Create application** → **Start with Hello World!** → **Get started** → Name `ciphro-zaehler` → **Deploy**.
4. **Code einsetzen:** Im Worker auf **Edit code** (`</>`) → den ganzen Inhalt von `worker.js` hinein kopieren (den Beispielcode ersetzen) → **Deploy**. Zeigt der Editor nur **Save**: speichern, dann im Worker **Deployments** → in **Version History** **Deploy version** → **Deploy**.
5. **Datenbank verbinden:** Im Worker den Reiter **Bindings** → **Add binding** → **D1 database** → **Variable name** genau `DB`, Datenbank `ciphro-zaehler` → **Add binding**.
6. **Geheimen Schlüssel für die Statistik setzen:** Im Worker **Settings** → **Variables and Secrets** → **Add** → Typ **Secret**, Name `STATISTIK_SCHLUESSEL`, Wert: ein langes Zufallswort (z. B. aus einem Passwort-Manager, mindestens 20 Zeichen) → **Deploy**. Nur ihr kennt es.
7. **Adresse:** Im Worker **Settings** → **Domains & Routes** → **Add** → **Custom Domain** → `zaehler.ciphro.eu` → **Add Custom Domain**. Cloudflare legt den DNS-Eintrag selbst an.
8. **Protokolle aus:** Neue Worker haben laut Cloudflare die Beobachtung („Observability“, Workers Logs) standardmäßig eingeschaltet. Diese Protokolle enthalten Angaben zu jeder einzelnen Anfrage und werden drei Tage aufbewahrt. Damit die Datenschutzerklärung stimmt („keine einzelnen Aufrufe gespeichert“), im Worker unter **Settings** bzw. **Observability** die Workers Logs ausschalten. Den genauen Schalter beschreibt Cloudflare in der Doku nur für die Kommandozeile (`[observability] enabled = false`, steht so in `wrangler.toml`); falls ihr ihn im Dashboard nicht findet, sagt Bescheid.

## Prüfen, ob es läuft

- `https://zaehler.ciphro.eu/` zeigt „CIPHRO-Zähler“ (Fehlerseite 404, das ist richtig).
- ciphro.eu öffnen, ein Rätsel starten. Dann `https://zaehler.ciphro.eu/statistik` öffnen. Der Browser fragt nach Benutzername und Passwort: Benutzername beliebig, Passwort ist der geheime Schlüssel. Der heutige Tag hat mindestens einen Aufruf, einen Spieler und einen Start.
- `https://zaehler.ciphro.eu/statistik?format=csv` lädt die Zahlen als Tabelle für Excel.

Der Schlüssel steht nie in der Adresse, also auch nicht im Browserverlauf. Nicht weitergeben. Wer ihn hat, sieht die Zahlen (sonst nichts).

## Was die Zahlen bedeuten

| Spalte | Bedeutung |
|---|---|
| Aufrufe | Wie oft die Seite geöffnet wurde (auch Neuladen zählt). |
| Spieler | Wie viele Geräte an dem Tag das heutige Rätsel begonnen haben. Wer in zwei Sprachen oder auf zwei Geräten spielt, zählt doppelt. |
| DE, EN, FR, IT | Spieler je Sprache. |
| Archiv | Begonnene ältere Rätsel. |
| Start / Gelöst je Stufe | Wie oft Easy, Hard, Mirror, Impossible gestartet und gelöst wurden. |
| Geteilt | Wie oft „Ergebnis teilen“ getippt wurde. |

Die Zahlen sind ein Richtwert: Gezählt wird nur, wer zugestimmt hat (also deutlich weniger als alle Spieler), und wer es darauf anlegt, könnte falsche Meldungen schicken (es gibt bewusst keine Anmeldung).

## Rechtliches (kurz)

Der Abschnitt „Anonymer Zähler“ in `datenschutz.html` (alle vier Sprachen) beschreibt das. Rechtsgrundlage: berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO). Es werden keine Cookies gesetzt und keine Kennung gespeichert; das Spiel liest für den Zähler nur die eigene Einstellung „Anonym mitzählen“ und ob an diesem Tag schon eine Stufe begonnen wurde. Ob das nach § 165 TKG 2021 ganz ohne Einwilligung geht, ist eine Rechtsfrage; im Zweifel eine Fachperson fragen.
