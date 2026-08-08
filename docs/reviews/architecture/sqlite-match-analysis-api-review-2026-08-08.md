# SQLite-Match-Analysis-API

Stand: 2026-08-08
Status: umgesetzt

## Ausgangslage und Lösung

Laufende NETGRID-Matches schreiben in dieselbe lokale SQLite-Datei wie die
Diagnosedaten. Direkte externe SQLite-Reader sind deshalb kein normaler
Analysepfad. Die bestehende authentifizierte Maintenance-Control-Plane erhält
stattdessen einen begrenzten, read-only Match-Bundle-Endpunkt:

```text
GET /api/storage/maintenance/analysis/matches/:matchId/bundle
```

Er ist ausschließlich durch die vorhandene Maintenance-Session geschützt und
erweitert weder PlayerViews, WebSockets noch öffentliche Replays.

## Bundle-Vertrag

`netgrid-match-analysis-bundle-v1` enthält Matchmetadaten, gespeicherte
öffentliche Events, KI-Entscheidungsindex und – sofern nicht abgewählt – die
redigierten KI-Trace-Details. Die Filter `side`, `turn`, `fromDecision` und
`toDecision` begrenzen die Entscheidungstraces. `includeEvents=false` und
`includeDecisionTraces=false` lassen die jeweiligen Abschnitte aus. Events
sind auf 500, Entscheidungen auf 200 Einträge begrenzt; Begrenzungen stehen
in `diagnostics.warnings`.

Die Ereignistabelle speichert keine Turnnummer. Daher bleibt der Eventabschnitt
matchweit, während Turn- und Decision-Filter ausschließlich auf die exakt
gespeicherten KI-Trace-Spalten angewendet werden.

Verfügbar sind Match-ID/Status/Versionen, öffentliche Events, ausgeführte
KI-Aktionen sowie die aktivierte redigierte Plan- und Why-not-Diagnostik. Nicht
als belastbare historische Daten verfügbar sind LegalActions, eigenständige
Engine-Quotes, side-sichere Analyse-Snapshots sowie eine separate Run-/ICE-
Encounter-Projektion. Diese Lücken werden als `unavailableSections` sichtbar
gemacht und nicht rekonstruiert.

## Laufende Matches und SQLite

Der Storage materialisiert alle für das Bundle benötigten SQLite-Zeilen in
einer kurzen `BEGIN`/`COMMIT`-Read-Transaktion. JSON wird erst nach ihrem Ende
geparst und aufbereitet. Der Endpunkt schreibt nichts, erzeugt keine Kopie und
verwendet unverändert WAL, den gemeinsamen kurzen Busy-Timeout und die
bestehende typisierte `storage_temporarily_unavailable`-HTTP-Abbildung.

Für normale Analyse laufender NETGRID-Matches sollen Codex und andere
Diagnosewerkzeuge nicht direkt `netgrid.sqlite` öffnen. Sie sollen die private
lokale NETGRID-Analysis-/Maintenance-API verwenden. Direkter SQLite-Zugriff
bleibt ein bewusst eingesetztes Wartungs-/Sonderwerkzeug.

## Verifikation

- `corepack pnpm --filter @netgrid/server typecheck`
- fokussierter Maintenance-HTTP-/SQLite-Test für aktives und abgeschlossenes
  Match, Filter, fehlendes Match, Redaction und unveränderten Matchzustand
