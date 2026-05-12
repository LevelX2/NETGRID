# V1.9.12 Test Matrix

Stand: 2026-05-13
Status: draft-implementing

| Gate | Nachweis | Status |
| --- | --- | --- |
| Scope Freeze | Zielkartenliste in Plan/Requirements/Matrix | vorbereitet |
| Runtime Definitions | Alle 11 Zielkarten in Engine-Definitionsliste | WIP gruen |
| LegalAction Revalidation | Install, Purge, Recurring-Spend, Agenda-Counter | WIP gruen |
| Visibility | Counter sichtbar nur nach Side-/Zone-Vertrag | WIP gruen |
| Replay/StateHash | Counter, Purge und Recurring nach Replay identisch | WIP gruen |
| Scenario Pack | `data/scenarios/v1912-counter-virus-recurring-wip-smoke.json` | WIP vorhanden |
| Manifest | `data/manifests/card-implementation-manifest-1.9.12.json` | WIP vorhanden |
| Mechanics Coverage | `data/rules/mechanics-coverage-1.9.12.json` | WIP vorhanden |
| AI Hints | `data/ai/ai-card-hints-deck-legal-v1912.json` | WIP vorhanden |
| AI Smokes | `data/scenarios/ai-deck-legal-v1912-smokes.json` | WIP vorhanden |
| Catalog/Web | Release-IDs, manifest refs, visible Webclient-Version | WIP-No-Promotion-Guard gruen; finale Promotion offen |
| Full Checks | catalog, engine, ai, web, server, typecheck, test, lint, build | WIP gruen; Final-Gate-Wiederholung offen |

## WIP-Smokes

- Runner installiert Virus-/Recurring-Programme; Installation setzt erwartete Counter.
- Runner gibt Recurring-Credits fuer Run-/Programmkosten aus; Start-of-turn refreshed ohne Akkumulation.
- Corp purged nach drei Clicks; nur Virus-Counter werden entfernt.
- Scored Corp-Agenda erhaelt und nutzt Counter nur ueber typisierte LegalAction.
- Katalog-WIP-Guard prueft die elf V1.9.12-Artefaktkarten und verhindert vorzeitige `human_playable`-/`deck_legal`-/`ai_supported`-Promotion.
- Workspace-`test` ist nach Aktualisierung des veralteten V1.9.9-Webclient-Testankers auf den abgeschlossenen V1.9.11-Stand gruen.
