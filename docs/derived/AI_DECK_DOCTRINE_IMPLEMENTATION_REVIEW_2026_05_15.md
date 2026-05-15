# AI Deck Doctrine Implementation Review

Stand: 2026-05-15  
Status: erster Corp-MVP umgesetzt

## Umgesetzter Scope

- Neue deterministische Deck-Doktrin-Projektion aus eigenem Decksnapshot, Runtime-Karten, Rollenmanifest und AI-Hints.
- Gemeinsamer Shared-Typ `AiDeckDoctrineProfile` und optionaler `ownDeckDoctrine`-Input für KI-Entscheidungen.
- Corp-Archetypen: `rush`, `glacier`, `tag_pressure`, `asset_remote`, `operation_economy`, `central_defense`.
- Runner-Profilgenerator ist vorbereitet, aber noch nicht in Runner-Planentscheidungen gewichtet.
- Corp-Planbewertung nutzt Doktrin-Gewichte als bounded Bonus.
- Bestehende Agenda-Schutzlogik bleibt stärker als die neue Rush-Doktrin.
- Corp-Setup-Mulligan bewertet Start-Hände nach ICE, Economy, Agenda-Last, Remote-Plan und Doktrin-Passung.
- Multiplayer-Server übergibt beim KI-Zug nur den privaten Snapshot der aktiven KI-Seite an `buildAiDecisionInput`.
- `DecisionDebug` enthält nur aggregierte Doktrin-Tags, Confidence, Risk Flags und Evidenz, keine Deckliste oder Deckreihenfolge.

## Geänderte Hauptartefakte

- `packages/ai/src/deck-doctrine.ts`: Profilgenerator und Corp-Mulligan-Bewertung.
- `packages/ai/src/index.ts`: Doctrine-Erzeugung im KI-Input, Setup-Mulligan-Auswahl, Debug-Zusammenfassung und Exports.
- `packages/ai/src/corp-plans.ts`: planbezogener Doctrine-Bonus und redigierte Plan-Debugdaten.
- `packages/shared/src/index.ts`: gemeinsamer Doctrine-Typ und optionaler KI-Input.
- `apps/server/src/multiplayer.ts`: Snapshot-Übergabe für die aktive KI-Seite.
- `packages/ai/src/index.test.ts`: Regressionen für Profilgenerator, Plan-Gewichtung, Agenda-Schutz und Mulligan.

## Verifikation

Grün:

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai test -- --runInBand`
- `corepack pnpm --filter @netgrid/server typecheck`
- `corepack pnpm typecheck`
- `corepack pnpm lint`

Teilweise grün:

- `corepack pnpm test`: alle Workspace-Pakettests sind grün (`shared`, `catalog`, `engine`, `decks`, `ai`, `server`, `web`). Der nachgelagerte Spezifikationstest `tests/specs/visibility-contract.test.ts` fällt weiterhin auf die bestehende Web-Text-Erwartung `Meine Decks` in `apps/web/app/page.tsx`; dieser Fehler liegt außerhalb des KI-Doctrine-Slices.

## Offene Punkte

- Runner-Doktrin ist nur vorbereitet und muss in einem späteren Slice in Runner-Pläne einfließen.
- Selfplay-Metriken für nackte Agenda-Installs, verpasste Score-Fenster und Economy-Stalls sind noch Planungs-/Analysearbeit.
- Doctrine-Gewichte sind heuristisch und sollten erst nach Replay-/Selfplay-Auswertung weiter optimiert werden.
