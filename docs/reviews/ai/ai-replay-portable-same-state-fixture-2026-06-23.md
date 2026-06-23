# AI Replay Portable Same-State Fixture

Stand: 2026-06-23

Activity: `act-2026-06-23-ai-replay-portable-same-state-fixture`

## Ergebnis

Der Coverage-Mapping-Fall aus der ersten AI-Replay-Mistake-Iteration ist repository-seitig als portables, redigiertes Near-Same-State-Fixture abgesichert.

Artefakte:

- `packages/ai/src/evaluation/replay-portable-fixtures.ts`
- `packages/ai/src/evaluation/replay-portable-fixtures.test.ts`

Das Fixture `ai-replay-coverage-run-gap-portable-v1` enthält nur:

- `PlayerView`
- `LegalActions`
- minimale sichtbare Server-, Hand- und Boardanker
- erwartete Action-Klasse `start_run`

Es enthält keine lokale SQLite, keine Match-ID, keine Trace-ID, keinen FullState, keine Hidden Cards, keine Decklisten und keine lokalen Pfade.

## Abweichung zum lokalen Original

Das Original `replay-case-509c7f2d5d6a49c2` bleibt ein lokaler SQLite-Same-State-Fall und wird nicht versioniert. Das portable Fixture ist deshalb bewusst ein `synthetic_near_same_state`: Es bildet die sichtbare Entscheidungsform ab, nicht den vollständigen gespeicherten Runtime-Zustand.

Der Test belegt:

- Die aktuelle Runner-KI wählt im portablen Fixture `start_run` auf R&D.
- Die Eingabe läuft ausschließlich über `chooseRunnerAction(input)` mit side-sicherer `PlayerView` und `LegalActions`.
- Die Negativkontrolle ohne `start_run`-LegalAction erzeugt keinen erfundenen Run.
- Redaction-Suche findet keine verbotenen Marker wie FullState, private Payloads, Tokens oder Deckorder.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/replay-portable-fixtures.test.ts --maxWorkers=1 --testTimeout=30000`
  - 1 Testdatei, 2 Tests grün.
- `corepack pnpm --filter @netgrid/ai typecheck`
  - grün.

## Vertragsprüfung

- Keine Engine-Änderung.
- Keine LegalAction-Erzeugung geändert.
- Keine Änderung an `applyAction`.
- Keine Änderung an Replay, StateHash oder Randomness.
- Keine Hidden-Info-Ausweitung.
- Keine neue Ranking-Gewichtung außerhalb des bereits vorhandenen Coverage-Mapping-Fixes.
