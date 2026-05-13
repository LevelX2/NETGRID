# V1.9.16 Test Matrix

Stand: 2026-05-13
Status: release_promoted

| Gate | Nachweis | Status |
| --- | --- | --- |
| Scope Freeze | Zielkartenliste in Plan/Requirements/Matrix | vorbereitet |
| Runtime Definitions | Alle 16 Zielkarten in Runtime-Definitionsliste | gruen: 16/16 Definitionen, release-promotet |
| LegalAction Revalidation | Installation, Hosting, Trace/Link, Stealth/Recurring, Destroy | gruen: Installation, Hosting, Trace/Link, Stealth/Recurring und Fragmentation-Storm-Destroy |
| Visibility | Hosting-/Destroy-/Trace-Payloads side-sicher | gruen: Trace-Choice und Host-/Hosted-References side-sicher |
| Replay/StateHash | Hosted Lifecycle und Destroy nach Replay identisch | gruen: Fragmentation Storm Erfolg/Misserfolg und Hosted Lifecycle replay-stabil |
| Scenario Pack | `data/scenarios/v1916-program-subtype-hosting-stealth-smoke.json` | release-promotet |
| Manifest | `data/manifests/card-implementation-manifest-1.9.16.json` | release-promotet |
| Mechanics Coverage | `data/rules/mechanics-coverage-1.9.16.json` | release-promotet |
| AI Hints | `data/ai/ai-card-hints-deck-legal-v1916.json` | release-promotet |
| AI Smokes | `data/scenarios/ai-deck-legal-v1916-smokes.json` | release-promotet |
| Catalog/Web | Release-IDs, manifest refs, sichtbare Webclient-Version | gruen: Runtime-/AI-Pool 242 Karten, Webclient `V1.9.16` |
| Full Checks | catalog, engine, ai, web, server, typecheck, test, lint, build | gruen: engine 232, catalog 31, ai 85, web 76, server 72, typecheck, test, lint, build |

## Ziel-Smokes

- Alle 16 Zielkarten haben Runtime-Definitionen und sind release-promotet.
- Runner-Programme und Hardware installieren legal und respektieren MU/Installkosten.
- Link-Karten beeinflussen Trace nur aus oeffentlichen installierten Karten. Nachweis: Engine-Smoke mit Baedeker's Net Map plus Access through Alpha.
- Stealth-/Recurring-Karten refreshen deterministisch. Nachweis: Engine-Smoke mit Invisibility plus Raven Microcyb Eagle.
- Fragmentation Storm nutzt bestehende Trace-, installed-card-trash- und Damage-Pfade. Nachweis: Engine-Smoke fuer Trace-Erfolg und Trace-Misserfolg; Programm-Trash und Net Damage sind erfolgsgebunden und beide Branches replayen zum finalen StateHash.
- Imp hostet Bakdoor ueber explizites `hostOnCardId`; Fragmentation Storm trasht den Daemon und kaskadiert die gehostete Karte replay-/StateHash-stabil.
- KI-Artefakte sind als `ai_supported` promotet; AI-Paketcheck ist grün.
