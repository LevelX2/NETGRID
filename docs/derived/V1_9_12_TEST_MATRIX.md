# V1.9.12 Test Matrix

Stand: 2026-05-12
Status: draft-implementing

| Gate | Nachweis | Status |
| --- | --- | --- |
| Scope Freeze | Zielkartenliste in Plan/Requirements/Matrix | vorbereitet |
| Runtime Definitions | Alle 11 Zielkarten in Engine-Definitionsliste | offen |
| LegalAction Revalidation | Install, Purge, Recurring-Spend, Agenda-Counter | offen |
| Visibility | Counter sichtbar nur nach Side-/Zone-Vertrag | offen |
| Replay/StateHash | Counter, Purge und Recurring nach Replay identisch | offen |
| Scenario Pack | `data/scenarios/v1912-counter-virus-recurring-smoke.json` | offen |
| Manifest | `data/manifests/card-implementation-manifest-1.9.12.json` | offen |
| Mechanics Coverage | `data/rules/mechanics-coverage-1.9.12.json` | offen |
| AI Hints | `data/ai/ai-card-hints-deck-legal-v1912.json` | offen |
| AI Smokes | `data/scenarios/ai-deck-legal-v1912-smokes.json` | offen |
| Catalog/Web | Release-IDs, manifest refs, visible Webclient-Version | offen |
| Full Checks | catalog, engine, ai, web, server, typecheck, test, lint, build | offen |

## WIP-Smokes

- Runner installiert Virus-/Recurring-Programme; Installation setzt erwartete Counter.
- Runner gibt Recurring-Credits fuer Run-/Programmkosten aus; Start-of-turn refreshed ohne Akkumulation.
- Corp purged nach drei Clicks; nur Virus-Counter werden entfernt.
- Scored Corp-Agenda erhaelt und nutzt Counter nur ueber typisierte LegalAction.

