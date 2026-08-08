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

Im lokalen Deploymentprofil ist er ohne Maintenance-Session nur über die
tatsächliche Socket-Adresse `127.0.0.1` oder `::1` erreichbar; IPv4-mapped
IPv6-Loopback wird gleich behandelt. Das gilt ausschließlich für `GET` unter
`/api/storage/maintenance/analysis/*`, nicht für andere Maintenance-Routen.
Host- und Forwarded-Header begründen keine Freigabe. Außerhalb dieses lokalen
Loopback-Pfads bleibt die vorhandene Maintenance-Session erforderlich. Die
Änderung erweitert weder PlayerViews, WebSockets noch öffentliche Replays.

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
Bei Decision-Filtern bindet das Bundle Events an den StateVersion-Bereich der
ausgewählten Decisions, damit späte Kontexte nicht durch frühe Events verdrängt
werden.

Verfügbar sind Match-ID/Status/Versionen, öffentliche Events, ausgeführte
KI-Aktionen sowie die aktivierte redigierte Plan- und Why-not-Diagnostik.
LegalActions und actor-sichere State-Views sind verfügbar, wenn ein exakt
passender, hash-verifizierter Snapshot existiert.
Sie werden als heutige Engine-Rekonstruktion gekennzeichnet. Eigenständige
historische Engine-Quotes und eine getrennte Run-/ICE-Encounter-Projektion
bleiben weiterhin nur verfügbar, soweit sie bereits im Decision-Trace stehen;
für Corp-`rez_ice` liefert der Context zusätzlich einen heutigen Rez-Quote auf
dem exakten historischen Snapshot.

## Laufende Matches und SQLite

Der Storage materialisiert alle für das Bundle benötigten SQLite-Zeilen in
einer kurzen `BEGIN`/`COMMIT`-Read-Transaktion. JSON wird erst nach ihrem Ende
geparst und aufbereitet. Der Endpunkt schreibt nichts, erzeugt keine Kopie und
verwendet unverändert WAL, den gemeinsamen kurzen Busy-Timeout und die
bestehende typisierte `storage_temporarily_unavailable`-HTTP-Abbildung.

Für normale Analyse laufender NETGRID-Matches sollen Codex und andere lokale
Diagnosewerkzeuge die read-only API über `127.0.0.1` verwenden und nicht direkt
`netgrid.sqlite` öffnen. Direkter SQLite-Zugriff bleibt ein bewusst eingesetztes
Wartungs-/Sonderwerkzeug.

## Verifikation

- `corepack pnpm --filter @netgrid/server typecheck`
- fokussierter Maintenance-HTTP-/SQLite-Test für aktives und abgeschlossenes
  Match, Filter, fehlendes Match, Redaction und unveränderten Matchzustand
