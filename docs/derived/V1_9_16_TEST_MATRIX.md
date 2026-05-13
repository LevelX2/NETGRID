# V1.9.16 Test Matrix

Stand: 2026-05-13
Status: implementing_wip_engine_smoke

| Gate | Nachweis | Status |
| --- | --- | --- |
| Scope Freeze | Zielkartenliste in Plan/Requirements/Matrix | vorbereitet |
| Runtime Definitions | Alle 16 Zielkarten in Runtime-Definitionsliste | WIP: 16/16 Definitionen, nicht promotet |
| LegalAction Revalidation | Installation, Hosting, Trace/Link, Stealth/Recurring, Destroy | WIP: Installation, Trace/Link, Stealth/Recurring und Fragmentation-Storm-Destroy-Smoke gruen; Hosting offen |
| Visibility | Hosting-/Destroy-/Trace-Payloads side-sicher | WIP: Trace-Choice side-sicher; Hosting offen |
| Replay/StateHash | Hosted Lifecycle und Destroy nach Replay identisch | WIP: Fragmentation-Storm-Erfolg/Misserfolg replay-stabil; Hosted Lifecycle offen |
| Scenario Pack | `data/scenarios/v1916-program-subtype-hosting-stealth-smoke.json` | WIP angelegt |
| Manifest | `data/manifests/card-implementation-manifest-1.9.16.json` | WIP angelegt |
| Mechanics Coverage | `data/rules/mechanics-coverage-1.9.16.json` | WIP angelegt |
| AI Hints | `data/ai/ai-card-hints-deck-legal-v1916.json` | offen |
| AI Smokes | `data/scenarios/ai-deck-legal-v1916-smokes.json` | offen |
| Catalog/Web | Release-IDs, manifest refs, sichtbare Webclient-Version | WIP: No-Promotion-Guard |
| Full Checks | catalog, engine, ai, web, server, typecheck, test, lint, build | Teilcheck: engine 231, catalog 30, typecheck pass |

## Ziel-Smokes

- Alle 16 Zielkarten haben Runtime-Definitionen, bleiben aber bis zum Gate nicht release-promotet.
- Runner-Programme und Hardware installieren legal und respektieren MU/Installkosten.
- Link-Karten beeinflussen Trace nur aus oeffentlichen installierten Karten. Nachweis: Engine-Smoke mit Baedeker's Net Map plus Access through Alpha.
- Stealth-/Recurring-Karten refreshen deterministisch. Nachweis: Engine-Smoke mit Invisibility plus Raven Microcyb Eagle.
- Fragmentation Storm nutzt bestehende Trace-, installed-card-trash- und Damage-Pfade. Nachweis: Engine-Smoke fuer Trace-Erfolg und Trace-Misserfolg; Programm-Trash und Net Damage sind erfolgsgebunden und beide Branches replayen zum finalen StateHash.
