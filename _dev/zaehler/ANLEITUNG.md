# Anonymer Zähler für CIPHRO – Freigabe- und Betriebsanleitung

**Status:** Nur Entwurf in PR #10. Kein Worker/D1 angelegt, nicht produktiv, **nicht mergen oder deployen**, bevor die Freigabe für den Zähler selbst erteilt wurde. Für die vorhandene Website ist nichts zu tun.

Beantwortet die Frage „Haben wir überhaupt Nutzer?“, ohne Tracking: Das Spiel meldet nur, **dass** etwas passiert ist (Seite aufgerufen, erstes Rätsel des Tages begonnen, Stufe gestartet, Stufe gelöst, Ergebnis geteilt), mit Sprache, Stufe und Archiv ja/nein. Der Zähler speichert davon nur Tagessummen. Keine IP-Adresse, keine Kennung, kein Cookie.

| Datei | Inhalt |
|---|---|
| `worker.js` | Der Zähler (Cloudflare Worker). Nimmt Meldungen von ciphro.eu an und zeigt die Statistik. |
| `schema.sql` | Die eine Tabelle der Datenbank. |
| `wrangler.toml` | Nur für die Einrichtung über die Kommandozeile (statt Dashboard). |

Im Spiel steht der Gegenpart in `index.html` (Suche nach `countEvent`). **Standardmäßig aus:** Nach dem ersten gelösten oder aufgelösten Rätsel fragt das Spiel einmal „Dürfen wir anonym mitzählen?“ mit zwei gleichwertigen Knöpfen. Erst nach „Ja“ (oder dem Schalter in den Einstellungen) geht überhaupt eine Anfrage an den Zähler. Die Auswahl „Ja“ meldet auch den **bereits beendeten aktuellen Besuch samt Rätsel** nach; vor dem Ja wurde nichts übertragen. Bei „Nein“ gehen keine Anfragen ab. Die Entscheidung kann in den Einstellungen geändert werden. Gefragt und gezählt wird nur auf `ciphro.eu` (nie lokal, in Tests oder Vorschauen) und nie bei Global Privacy Control / Do Not Track.

**Kosten:** Für normale Nutzung soll das System innerhalb des kostenlosen Workers-/D1-Kontingents bleiben. Aktuelle Grenzen und eventuelle Preisänderungen **vor dem Deploy** bei [Workers](https://developers.cloudflare.com/workers/platform/pricing/) und [D1](https://developers.cloudflare.com/d1/platform/pricing/) prüfen. Eine Meldung benötigt einen Worker-Aufruf und eine D1-Schreiboperation. Bei sehr hoher Nutzung oder Missbrauch können Kontingente ausgeschöpft werden; das Spiel funktioniert trotzdem. **Kein kostenpflichtiges Upgrade ohne gesonderte Freigabe.**

## Einrichten – ausschließlich per Wrangler, nach Freigabe

Voraussetzung: Domain `ciphro.eu` in Cloudflare; Wrangler v4.36.0 oder neuer, Node.js 20+, Cloudflare-Konto mit Berechtigung für Worker, D1 und Custom Domain. Die Projektdateien liegen unter `_dev/zaehler`. **Dashboard-Hello-World und Code-Einfügen sind bewusst nicht empfohlen:** Neue Worker haben Workers Logs standardmäßig an; man könnte den Datenschutztext schon beim Einrichten verletzen.

1. Im Repository in den Ordner `_dev/zaehler` wechseln. `npx wrangler login` (falls nicht angemeldet).
2. `npx wrangler d1 create ciphro-zaehler` ausführen. Cloudflare gibt die echte `database_id` zurück.
3. **Nur** in `wrangler.toml` den Platzhalter `HIER-DIE-ID-DER-DATENBANK-EINTRAGEN` durch diese ID ersetzen. Die ID ist nicht geheim, aber die Datei muss zum echten Projekt passen. Nicht den Namen der bestehenden fremden Datenbanken verwenden.
4. Tabelle anlegen: `npx wrangler d1 execute ciphro-zaehler --remote --file=schema.sql`.
5. Die Konfiguration kontrollieren: `[observability] enabled = false`, zusätzlich `[observability.logs] enabled = false`, `invocation_logs = false` und `[observability.traces] enabled = false`. Außerdem müssen `EINGANG_LIMIT` und `ADMIN_LIMIT` als Rate-Limiting-Bindings enthalten sein.
6. `npx wrangler deploy` ausführen. Die Konfiguration legt den Worker mit der Domain `zaehler.ciphro.eu` an, ohne `workers.dev`-Adresse. **An diesem Punkt muss PR #10 bereits freigegeben und veröffentlicht sein – nicht vorzeitig ausführen.**
7. Ein **zufälliges Passwort von mindestens 24 Zeichen**, idealerweise 32–48, im Passwort-Manager generieren. Mit `npx wrangler secret put STATISTIK_SCHLUESSEL` am Prompt eingeben. Nicht als Kommandoargument, URL, GitHub-Datei oder Screenshot speichern.
8. **Nach jedem Deploy und nach dem Secret-Update im Cloudflare-Dashboard prüfen**, dass beim Worker die Logs, Invocation Logs und Traces wirklich aus sind. Alternativ die Worker-Settings über die Cloudflare-API `GET /accounts/{account_id}/workers/scripts/ciphro-zaehler/settings` auslesen und das `observability`-Objekt prüfen. **Falls das nicht nachweisbar aus ist, Freigabe abbrechen und Zähler nicht benutzen.** GitHub-Tests prüfen lediglich die Repo-Konfiguration, keine laufende Cloudflare-Einstellung.

Hinweis: Die Einstellung `workers_dev = false` und die Domainbindung verhindern nicht jeden direkten Netzwerkzugriff auf den Worker. Statistiken sind deshalb zusätzlich mit einem Passwort geschützt, und alle öffentlichen Meldungen werden geprüft und begrenzt.

## Prüfen, ob es läuft

- `https://zaehler.ciphro.eu/` zeigt 404 „Nicht gefunden“ (kein Fehler).
- ciphro.eu öffnen, ein Rätsel lösen und **vor** der Einwilligung in der Netzwerkansicht kontrollieren: **keine einzige Anfrage** an `zaehler.ciphro.eu`. Dann mit „Ja“ zustimmen. Die aktuelle Seite, der aktuelle Spielstart und die Lösung werden nun gemeldet. Nach einem weiteren Seitenaufruf kommen neue Ereignisse dazu.
- Danach `https://zaehler.ciphro.eu/statistik` öffnen. Benutzername beliebig, Passwort = der geheime Schlüssel. In der Statistik stehen die gemeldeten Aufrufe, Spieler, Starts und Lösungen; sie ist nicht öffentlich.
- `https://zaehler.ciphro.eu/statistik?format=csv` lädt die Zahlen als Tabelle für Excel.
- Von einem zweiten Browser „Nein“ klicken und bestätigen, dass **keine** Zähleranfrage erfolgt. GPC/DNT testen, dann ein Ja in den Einstellungen widerrufen. Test der Rate-Limits: viele Anfragen in kurzem Abstand erhalten HTTP 429; in der Datenbank werden nur Summen gespeichert.
- Unter `npx wrangler deploy --dry-run` und `npm test` (im Ordner `_dev`) vor jedem späteren Deploy die Konfiguration und die Tests prüfen.

Der Schlüssel steht nie in der Adresse, also auch nicht im Browserverlauf. Nicht weitergeben. Wer ihn hat, sieht die Zahlen (sonst nichts).

## Was die Zahlen bedeuten

| Spalte | Bedeutung |
|---|---|
| Aufrufe | Wie oft die Seite geöffnet wurde (auch Neuladen zählt). |
| Spieler | Wie viele Meldungen für den ersten Start eines Tagesrätsels je Sprache eingingen. **Keine eindeutigen Geräte oder Besucher.** Mehrere Sprachen/Geräte ergeben mehrere Meldungen. |
| DE, EN, FR, IT | Spieler je Sprache. |
| Archiv | Begonnene ältere Rätsel. |
| Start / Gelöst je Stufe | Wie oft Easy, Hard, Mirror, Impossible gestartet und gelöst wurden. |
| Geteilt | Wie oft „Ergebnis teilen“ getippt wurde. |

Die Zahlen sind Richtwerte: Gezählt wird nur mit Zustimmung und nach dem Ja. Die Frage erscheint erst nach dem ersten fertigen Rätsel; Gäste, die vorher abspringen, tauchen nicht auf. Wer einen zweiten Browser benutzt, kann doppelt zählen. **Fälschungen sind bei einem öffentlichen Endpoint ohne Nutzerkennung nicht vollständig verhinderbar.** Der Worker prüft Origin, Fetch-Metadaten, Payload-Typ, erlaubte Kombinationen und harte Größe (160 Bytes), begrenzt über Cloudflare das Volumen grob auf 1.200 Meldungen/Minute und 20 Statistikversuche/Minute **je Cloudflare-Standort**. Es gibt bewusst keine IP-, Session- oder Geräte-Kennung. Diese Limits sind nicht absolut; auch zulässige Meldungen können bei großem Ansturm abgewiesen werden. Bei Missbrauch Statistik aussetzen statt personenbezogene Verfolgung nachrüsten.

## Rechtliches (kurz)

Der Abschnitt „Anonymer Zähler“ in `datenschutz.html` (alle vier Sprachen) beschreibt das. Rechtsgrundlage für die optionale Erfassung ist **Einwilligung** (Art. 6 Abs. 1 lit. a DSGVO; TKG 2021), nicht berechtigtes Interesse. Es werden keine Zähler-Cookies, Kennungen oder IP-Adressen in D1 gespeichert. Cloudflare empfängt wie bei jedem HTTP-Request technisch eine IP-Adresse; deshalb müssen die **Workers Logs** sicher abgeschaltet bleiben und das Setup vor Produktivsetzung anhand des realen Cloudflare-Accounts überprüft werden. Keine Rechtsfreigabe durch diese Anleitung – bei Zweifeln zur DSGVO/TKG-Konformität juristisch prüfen lassen.
