# V1.9.21 Test Matrix

Status: planned
Stand: 2026-05-13

| Bereich | Pflichtnachweis | Aktueller Stand |
| --- | --- | --- |
| Scope | Genau 6 Zielkarten | Catalog-WIP-Guard gruen |
| No-Promotion | Keine V1.9.21-Karte im Runtime-/AI-Releasepool vor Gate | Catalog-WIP-Guard gruen |
| Displaytext | Kein `WIP` im Runtime-Text; display-only dokumentiert | 6/6 Runtime-Definitionen gruen |
| Deterministischer Zufall | Seed, RandomCounter und RandomDrawRecords | Initial gruen fuer 6/6 Zielkarten: Asset, Upgrade, Runner-Programm, Event und Resource erzeugen deterministische Wuerfelproben mit `RandomDrawRecords` |
| LegalAction/applyAction | Side, Timing, Quelle, Ziel, Kosten und Zufallsfenster revalidiert | Initial gruen fuer 6/6 Zielkarten: Quellen und Wrong-Side sind abgedeckt, `Schlaghund` zusaetzlich stale State |
| Visibility | Keine Hidden-Info-Leaks ueber Zufallsereignisse | Initial gruen fuer 6/6 Zielkarten: PublicEvents enthalten nur oeffentliche Zufallsmetadaten |
| Replay/StateHash | Zufallsauflösung replay- und StateHash-stabil | Initial gruen fuer 6/6 Zielkarten: Replay/StateHash und RandomDrawRecords stabil |
| AI | Hints, Smokes, legaler Fallback ohne Ergebnisvorwissen | Draft-Artefakte angelegt und `ai` gruen; keine AI-Promotion |
| Server/Web | Webclient-Version erst bei Abschluss | Folgearbeit |
| Full Checks | catalog, engine, ai, server, web, typecheck, test, lint, build | JSON, catalog 35, engine 271, ai 85 und typecheck gruen; Server/Web/Test/Lint/Build Folgearbeit |

## Mindestchecks im ersten WIP

- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`
