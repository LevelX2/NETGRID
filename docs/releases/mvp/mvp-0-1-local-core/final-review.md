# MVP 0.1 Final Review

Stand: 2026-05-03T10:02:00+02:00  
Branch: `codex/mvp-0-1-requirements`

## Ergebnis

`MVP_0.1_done: true`

`ready_for_MVP_0.2: true`

MVP 0.1 ist als lokaler, privater Human-Runner-vs-Corp-KI-Stand umgesetzt und hat die geforderten Gates bestanden.

## Implementiert

- Reine TypeScript-Engine ohne React-, Netzwerk-, Datenbank- oder KI-Abhängigkeit.
- Deterministisches `createGame` mit Seed, RandomCounter und RandomDrawRecords.
- Versionierter GameState, StateVersion, EventLog, PublicEvents und StateHash.
- `getLegalActions`, `applyAction`, `getPlayerView`, `validateGameState`, `checkWinConditions`, `replayEvents`, `hashState`.
- PlayerAction-Revalidierung gegen Match, Seite, StateVersion und aktuelle LegalActions.
- Grundaktionen, Runner-/Corp-Zugfluss, Install, Event/Operation, Advance, Score und End Turn.
- Run-Kern mit ICE-Rez, Encounter, Breaker-Pump/Break, ungebrochener ETR-Subroutine, Breach/Access, Agenda-Steal und Asset-Trash-Pfad.
- Demo-Karten aus `data/cards/demo-cards.json` als `playable_mvp`-Konstanten im Shared-Paket.
- Einfache Corp-KI, die nur Corp PlayerView, PublicEvents und LegalActions verwendet.
- Next.js-Weboberfläche mit serverseitigem GameState und Runner-PlayerView-API.
- Tests für Engine, KI, Derived-Artefakte, Szenario-Fixtures und Client-Visibility-Vertrag.

## Gefundene und behobene Issues

| ID | Issue | Schwere | Fix | Status |
|---|---|---:|---|---|
| HRD-001 | Die erste Web-UI führte die Engine im Browser aus und hielt dadurch den vollständigen GameState clientseitig. | hoch | GameState in serverseitige Next-API `app/api/game/route.ts` verschoben; Browserseite nutzt nur `/api/game` und Runner-PlayerView. | fixed |
| HRD-002 | Nicht-trashbare R&D-Access-Karten ließen den Run offen. | mittel | Access auf nicht-trashbare Nicht-Agenda schließt den Run automatisch. | fixed |
| HRD-003 | Score-Aktion war bei 0 Clicks nicht mehr verfügbar. | mittel | Score-LegalActions werden vor Click-Aktionsprüfung angeboten. | fixed |
| HRD-004 | Root-Testskript nutzte direktes `pnpm`, das lokal nicht im PATH liegt. | niedrig | Root-Skripte nutzen `corepack pnpm ...`. | fixed |

## Gates

| Gate | Status | Nachweis |
|---|---|---|
| Dependencies | pass | `corepack pnpm install` |
| Lint | pass | `corepack pnpm lint` |
| Typecheck | pass | `corepack pnpm typecheck` |
| Tests | pass | `corepack pnpm test`, 18 Tests |
| Build | pass | `corepack pnpm build`, inklusive Next.js `/` und `/api/game` |
| Hidden Info | pass | Engine/View-Tests, Visibility-Vertragstest, API-Smoke ohne `cardInstances`, ohne hidden Corp-Titel |
| Replay/StateHash | pass | Engine Replay-Test reproduziert finalen StateHash |
| Corp-KI | pass | LegalAction- und 100-Step-Smoke-Test |
| Local Web | pass | `http://127.0.0.1:3000` antwortet; `/api/game` liefert nur PlayerView-Payload |

## Bekannte Einschränkungen

- Demo-Siegwert ist bewusst `agendaPointsToWin = 6`, weil das feste Corp-Demo-Deck genau 6 Agenda Points enthält.
- Kein Mulligan, Jack-out, Multiaccess, Tags, Trace, Damage, Viren, Hosting, Prevention, Replacement oder Interrupts.
- Persistenz ist für MVP 0.1 noch in-memory/serverlokal; MVP 0.2 muss Storage als eigenes Arbeitspaket konkretisieren.
- Die UI ist eine funktionale lokale Lern-/Debug-Oberfläche, keine polierte Plattform.

## Entscheidung

MVP 0.1 erfüllt die im Projekt definierten Gates. MVP 0.2 darf mit einer separaten Requirements-Phase beginnen. Die MVP-0.2-Implementierung darf erst nach daraus abgeleitetem `ready_for_implementation: true` starten.

