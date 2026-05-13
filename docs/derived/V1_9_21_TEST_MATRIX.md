# V1.9.21 Test Matrix

Status: planned
Stand: 2026-05-13

| Bereich | Pflichtnachweis | Aktueller Stand |
| --- | --- | --- |
| Scope | Genau 6 Zielkarten | Catalog-WIP-Guard gruen |
| No-Promotion | Keine V1.9.21-Karte im Runtime-/AI-Releasepool vor Gate | Catalog-WIP-Guard gruen |
| Displaytext | Kein `WIP` im Runtime-Text; display-only dokumentiert | 6/6 Runtime-Definitionen gruen |
| Deterministischer Zufall | Seed, RandomCounter und RandomDrawRecords | Runtime-WIP; Engine-Resolver Folgearbeit |
| LegalAction/applyAction | Side, Timing, Quelle, Ziel, Kosten und Zufallsfenster revalidiert | Folgearbeit |
| Visibility | Keine Hidden-Info-Leaks ueber Zufallsereignisse | Folgearbeit |
| Replay/StateHash | Zufallsauflösung replay- und StateHash-stabil | Folgearbeit |
| AI | Hints, Smokes, legaler Fallback ohne Ergebnisvorwissen | Folgearbeit |
| Server/Web | Webclient-Version erst bei Abschluss | Folgearbeit |
| Full Checks | catalog, engine, ai, server, web, typecheck, test, lint, build | JSON, catalog 35, engine 266 und typecheck gruen; weitere Gates Folgearbeit |

## Mindestchecks im ersten WIP

- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`
