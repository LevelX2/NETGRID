# V1.9.16 Test Matrix

Stand: 2026-05-13
Status: draft-implementing

| Gate | Nachweis | Status |
| --- | --- | --- |
| Scope Freeze | Zielkartenliste in Plan/Requirements/Matrix | vorbereitet |
| Runtime Definitions | Alle 16 Zielkarten in Runtime-Definitionsliste | WIP: 16/16 Definitionen, nicht promotet |
| LegalAction Revalidation | Installation, Hosting, Trace/Link, Stealth/Recurring, Destroy | offen |
| Visibility | Hosting-/Destroy-/Trace-Payloads side-sicher | offen |
| Replay/StateHash | Hosted Lifecycle und Destroy nach Replay identisch | offen |
| Scenario Pack | `data/scenarios/v1916-program-subtype-hosting-stealth-smoke.json` | offen |
| Manifest | `data/manifests/card-implementation-manifest-1.9.16.json` | offen |
| Mechanics Coverage | `data/rules/mechanics-coverage-1.9.16.json` | offen |
| AI Hints | `data/ai/ai-card-hints-deck-legal-v1916.json` | offen |
| AI Smokes | `data/scenarios/ai-deck-legal-v1916-smokes.json` | offen |
| Catalog/Web | Release-IDs, manifest refs, sichtbare Webclient-Version | WIP: No-Promotion-Guard |
| Full Checks | catalog, engine, ai, web, server, typecheck, test, lint, build | offen |

## Ziel-Smokes

- Alle 16 Zielkarten haben Runtime-Definitionen, bleiben aber bis zum Gate nicht release-promotet.
- Runner-Programme und Hardware installieren legal und respektieren MU/Installkosten.
- Link-Karten beeinflussen Trace nur aus oeffentlichen installierten Karten.
- Stealth-/Recurring-Karten refreshen deterministisch.
- Fragmentation Storm nutzt bestehende Trace-, installed-card-trash- und Damage-Pfade.
