# V1.9.15 Test Matrix

Stand: 2026-05-13
Status: draft-implementing

| Gate | Nachweis | Status |
| --- | --- | --- |
| Scope Freeze | Zielkartenliste in Plan/Requirements/Matrix | vorbereitet |
| Runtime Definitions | Alle 14 Zielkarten in Runtime-Definitionsliste | teilweise: 14/14 WIP-Definitionen, nicht promotet |
| LegalAction Revalidation | Run-Start, Access, Multiaccess, Ambush, Kosten, Timing | offen |
| Visibility | Access-/Hidden-Zone-/Ambush-Payloads side-sicher | offen |
| Replay/StateHash | Run- und Access-Queue nach Replay identisch | offen |
| Scenario Pack | `data/scenarios/v1915-run-access-multiaccess-smoke.json` | offen |
| Manifest | `data/manifests/card-implementation-manifest-1.9.15.json` | offen |
| Mechanics Coverage | `data/rules/mechanics-coverage-1.9.15.json` | offen |
| AI Hints | `data/ai/ai-card-hints-deck-legal-v1915.json` | offen |
| AI Smokes | `data/scenarios/ai-deck-legal-v1915-smokes.json` | offen |
| Catalog/Web | Release-IDs, manifest refs, sichtbare Webclient-Version | teilweise: 14er-WIP-Zielmenge mit No-Promotion-Guard |
| Full Checks | catalog, engine, ai, web, server, typecheck, test, lint, build | teilweise: catalog, engine und typecheck gruen |

## Ziel-Smokes

- Runner-Events koennen legale Runs starten und Access-Folgen ausloesen.
- Multiaccess bleibt deterministisch und side-sicher.
- Ambush-/ICE-Folgen werden nur im legalen Encounter-/Access-Kontext ausgeloest.
- Katalog-Gate verhindert Promotion vor Manifest-/AI-/Scenario-Abdeckung.
