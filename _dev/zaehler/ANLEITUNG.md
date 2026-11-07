# Anonymer Zähler für CIPHRO – Freigabe- und Betriebsanleitung

**Status (07.11.2026):** Cloudflare-Worker `ciphro-zaehler`, EU-D1-Datenbank und `zaehler.ciphro.eu` sind im Cloudflare-Konto der Betreiber (das Konto, in dem auch ciphro.eu liegt) eingerichtet. Der produktive Spielcode erhält den Zähler mit PR #10. Normale Besucher müssen dafür nichts installieren; für Wartung siehe unten.

Beantwortet die Frage „Haben wir überhaupt Nutzer?“, ohne Tracking: Das Spiel meldet nur, **dass** etwas passiert ist (Seite aufgerufen, erstes Rätsel des Tages begonnen, Stufe gestartet, Stufe gelöst, Ergebnis geteilt), mit Sprache, Stufe und Archiv ja/nein. Der Zähler speichert davon nur Tagessummen. Keine IP-Adresse, keine Kennung, kein Cookie.

| Datei | Inhalt |
|---|---|
| `worker.js` | Der Zähler (Cloudflare Worker). Nimmt Meldungen von ciphro.eu an und zeigt die Statistik. |
| `schema.sql` | Die eine Tabelle der Datenbank. |
| `wrangler.toml` | Reproduzierbare Konfiguration für spätere Wartungsdeployments. |

Im Spiel steht der Gegenpart in `index.html` (Suche nach `countEvent`). **Standardmäßig aus:** Nach dem ersten gelösten oder aufgelösten Rätsel fragt das Spiel einmal „Dürfen wir anonym mitzählen?“ mit zwei gleichwertigen Knöpfen. Erst nach „Ja“ (oder dem Schalter in den Einstellungen) geht überhaupt eine Anfrage an den Zähler. Die Auswahl „Ja“ meldet auch den **bereits beendeten aktuellen Besuch samt Rätsel** nach; vor dem Ja wurde nichts übertragen. Bei „Nein“ gehen keine Anfragen ab. Die Entscheidung kann in den Einstellungen geändert werden. Gefragt und gezählt wird nur auf `ciphro.eu` (nie lokal, in Tests oder Vorschauen) und nie bei Global Privacy Control / Do Not Track.

**Kosten:** Für normale Nutzung soll das System innerhalb des kostenlosen Workers-/D1-Kontingents bleiben. Aktuelle Grenzen und eventuelle Preisänderungen **vor dem Deploy** bei [Workers](https://developers.cloudflare.com/workers/platform/pricing/) und [D1](https://developers.cloudflare.com/d1/platform/pricing/) prüfen. Eine Meldung benötigt einen Worker-Aufruf und eine D1-Schreiboperation. Bei sehr hoher Nutzung oder Missbrauch können Kontingente ausgeschöpft werden; das Spiel funktioniert trotzdem. **Kein kostenpflichtiges Upgrade ohne gesonderte Freigabe.**

## Bereits eingerichtete Infrastruktur und sichere Wartung

Die Ersteinrichtung erfolgte am 07.11.2026 über die Cloudflare-API im bestehenden Cloudflare-Konto. **Nicht erneut anlegen:**

- **Worker:** `ciphro-zaehler`, Custom Domain `zaehler.ciphro.eu`; `workers.dev` und Preview-Adressen deaktiviert.
- **D1:** `ciphro-zaehler`, ID `a0779429-8730-45bf-be7c-364c9ad77a52`, **Jurisdiktion `eu`** (Datenbank läuft und speichert ausschließlich in der EU). Die Tabelle aus `schema.sql` ist angelegt.
- **Bindings:** `DB`, `EINGANG_LIMIT` (1.200/60 s je Standort), `ADMIN_LIMIT` (20/60 s je Standort), Secret `STATISTIK_SCHLUESSEL`.
- **Schlüssel:** Ein zufälliger, 64 Zeichen langer Statistikschlüssel wurde als Cloudflare-Secret eingerichtet. Er gehört in den Passwortmanager der Betreiber, **nie** in GitHub, die URL oder den Quelltext. Bei Verlust kann er über `npx wrangler secret put STATISTIK_SCHLUESSEL` neu gesetzt werden; das rotiert den Schlüssel.

Für spätere Änderungen: Node.js 20+, Wrangler v4.36.0 oder neuer und Berechtigung für das **richtige** Konto vorausgesetzt.

1. In `_dev/zaehler` wechseln, `npx wrangler whoami` prüfen; falls erforderlich `npx wrangler login` mit dem Cloudflare-Konto, in dem ciphro.eu liegt.
2. Im Ordner `_dev` `npm test` ausführen. Im Zählerordner `npx wrangler deploy --dry-run` ausführen. D1-ID, EU-Datenbank, Rate-Limits und deaktivierte Logs im `wrangler.toml` kontrollieren.
3. Nur nach Releasefreigabe `npx wrangler deploy` ausführen. **Kein zweites `d1 create`, kein erneutes `schema.sql` und kein neues Secret beim gewöhnlichen Code-Deploy.**
4. **Nach jedem Deploy** unter Cloudflare Worker-Einstellungen prüfen, dass Workers Logs, Invocation Logs, Traces sowie Logpush/Tail-Consumers aus sind. Die dazu passende API ist `GET /accounts/{account_id}/workers/scripts/ciphro-zaehler/script-settings` (nicht die allgemeine `/settings`-Antwort). Bei der Einrichtung am 07.11.2026 antwortete dieses Feld mit `observability: null` für den deaktivierten Zähler; ein anderer Worker im selben Konto lieferte bei aktivierter Protokollierung ausdrücklich `observability.enabled: true`. Die abgeschalteten Einstellungen wurden zusätzlich mit `PATCH .../script-settings` gesetzt.
5. Falls die tatsächlichen Cloudflare-Einstellungen Logs/Traces aktiv zeigen oder ihre Deaktivierung nicht nachvollziehbar ist: **nicht weiter produktiv betreiben**, bis das korrigiert ist. Die GitHub-Tests können nur die Konfigurationsdatei prüfen.

**Hinweis:** Cloudflare erhält bei HTTP-Verbindungen technisch IP-Adressen. Die EU-Jurisdiktion bezieht sich auf **D1-Speicherung und -Verarbeitung**, nicht automatisch auf alle Cloudflare-Edge-Verbindungen. Neue Worker haben laut Cloudflare-Dokumentation Logs standardmäßig an; daher keine manuellen Dashboard-Hello-World-Deployments verwenden.

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
