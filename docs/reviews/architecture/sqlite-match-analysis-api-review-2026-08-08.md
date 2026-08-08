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

Der Bundle-Endpunkt bleibt für die Matchübersicht begrenzt. Für eine tiefe,
exakt gebundene Diagnose steht zusätzlich
`GET /api/storage/maintenance/analysis/matches/:matchId/decisions/:decisionIndex`
bereit. Er materialisiert den zugehörigen Trace, den exakt gleichversionierten
Snapshot und einen kleinen Eventbereich, beendet den SQLite-Read und erzeugt
danach im RAM die actor-sichere historische State-View und LegalActions.

Verfügbar sind Match-ID/Status/Versionen, öffentliche Events, ausgeführte
KI-Aktionen sowie die aktivierte redigierte Plan- und Why-not-Diagnostik. Nicht
als belastbare historische Daten verfügbar sind LegalActions und actor-sichere
State-Views, wenn ein exakt passender, hash-verifizierter Snapshot existiert.
Sie werden als heutige Engine-Rekonstruktion gekennzeichnet. Eigenständige
historische Engine-Quotes und eine getrennte Run-/ICE-Encounter-Projektion
bleiben weiterhin nur verfügbar, soweit sie bereits im Decision-Trace stehen.

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
