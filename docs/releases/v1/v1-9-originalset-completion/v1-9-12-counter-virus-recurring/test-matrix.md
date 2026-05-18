# V1.9.12 Test Matrix

Stand: 2026-05-13
Status: final

| Gate | Nachweis | Status |
| --- | --- | --- |
| Scope Freeze | Zielkartenliste in Plan/Requirements/Matrix | vorbereitet |
| Runtime Definitions | Alle 11 Zielkarten in Engine-Definitionsliste | implementiert |
| LegalAction Revalidation | Install, Purge, Recurring-Spend, Agenda-Counter | implementiert |
| Visibility | Counter sichtbar nur nach Side-/Zone-Vertrag | implementiert |
| Replay/StateHash | Counter, Purge und Recurring nach Replay identisch | implementiert |
| Scenario Pack | `data/scenarios/v1912-counter-virus-recurring-release-smoke.json` | vorhanden |
| Manifest | `data/manifests/card-implementation-manifest-1.9.12.json` | finalisiert |
| Mechanics Coverage | `data/rules/mechanics-coverage-1.9.12.json` | finalisiert |
| AI Hints | `data/ai/ai-card-hints-deck-legal-v1912.json` | finalisiert |
| AI Smokes | `data/scenarios/ai-deck-legal-v1912-smokes.json` | finalisiert |
| Catalog/Web | Release-IDs, manifest refs, visible Webclient-Version | umgesetzt |
| Full Checks | catalog, engine, ai, web, server, typecheck, test, lint, build | gruen |

## WIP-Smokes

- Runner installiert Virus-/Recurring-Programme; Installation setzt erwartete Counter.
- Runner gibt Recurring-Credits fuer Run-/Programmkosten aus; Start-of-turn refreshed ohne Akkumulation.
- Corp purged nach drei Clicks; nur Virus-Counter werden entfernt.
- Scored Corp-Agenda erhaelt und nutzt Counter nur ueber typisierte LegalAction.
- Katalog-Gate prueft die elf V1.9.12-Artefaktkarten und bestaetigt `human_playable`, `deck_legal` und `ai_supported`.
- Workspace-`test` ist nach Aktualisierung des veralteten V1.9.9-Webclient-Testankers auf den abgeschlossenen V1.9.11-Stand gruen.
