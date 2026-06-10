# AI-FUP-R4 Test-Split-Vertrag

Stand: 2026-06-10
Status: abgeschlossen im Paket `AI-FUP-R4`
Branch: `codex/ai-source-followup-review-fixes`

## Ziel

Der AI-Testbestand soll nach der Source-Reorg keine fachlichen Verträge verlieren. `packages/ai/src/index.test.ts` bleibt ein bewusstes Integrationsnetz, neue oder nachgeschnittene Semantik-, Runtime- und Simulationstests sollen aber in passende fokussierte Testdateien statt in den Monolithen.

## Geprüfte Testflächen

| Testfläche | Umfang | Vertrag |
| --- | ---: | --- |
| `packages/ai/src/index.test.ts` | 467 `it`-Tests, 9 `describe`-Blöcke | öffentlicher AI-Paketvertrag, Side-safe AIInput, LegalActions-only-Auswahl, Hidden-Info-Redaction, Legacy-/Semantic-Modus-Integration, lange Regressionen |
| `packages/ai/src/action-semantic-candidate.test.ts` | 11 `it`-Tests | ActionSemanticCandidate-Projektion, Source-/Ability-Bindings, TargetContext, Card-Semantik-Join, Hidden-Info-Blocker |
| `packages/ai/src/actions/action-semantic-coverage.test.ts` | 3 `it`-Tests | Action-Typ-Coverage, zentrale BasicActions, reale Engine-LegalActions ohne Hidden-Payload-Leak |
| `packages/ai/src/semantic-ai-runtime-cutover.test.ts` | 37 `it`-Tests | Semantic-Runtime-Cutover, Runtime-vs-Legacy-Entscheidung, Debug-/Alternative-Vertrag |
| `packages/ai/src/action-doctrine-goal-diagnostics.test.ts` | 9 `it`-Tests | DeckDoctrine-/TacticalGoal-/ActionGoal-Diagnostik ohne produktive Auswahlwirkung |
| `packages/ai/src/simulation/simulation-harness.test.ts` | 2 `it`-Tests | Simulation-Harness-Entrypoints und deterministic selfplay harness |
| `packages/ai/src/simulation/v143-fixtures.test.ts` | 2 `it`-Tests | V1.4.3 Fixture-/Holdout-Vertrag |
| `packages/ai/src/simulation/benchmark-reports.test.ts` | 6 `it`-Tests | Benchmark-Report-, Gate-, Safety- und Redaction-Verträge |

## Bewertung

Keine Contract-Kategorie aus dem Review ist derzeit ungesichert:

- LegalActions-only und side-safe Input bleiben in `index.test.ts` und werden zusätzlich in `actions/action-semantic-coverage.test.ts` gegen reale Engine-LegalActions geprüft.
- Action-Identität, Definition-vs-Instanz-Bindings und Hidden-Info-Blocker liegen fokussiert in `action-semantic-candidate.test.ts`.
- Semantic-Runtime-Cutover und DecisionDebug-Verträge liegen fokussiert in `semantic-ai-runtime-cutover.test.ts`; `index.test.ts` behält die public API-Integration.
- Simulation-, Selfplay- und Benchmark-Regressionen liegen unter `packages/ai/src/simulation/`.
- Diagnostische Action-to-Goal- und TacticalGoal-Verträge bleiben in `action-doctrine-goal-diagnostics.test.ts` ohne produktive Auswahlwirkung.

## Bewusste Nicht-Änderung

Für R4 wurden keine neuen Tests in `index.test.ts` ergänzt. Das ist absichtlich: Die fehlenden Review-Folgeflächen sind bereits durch fokussierte Tests abgedeckt. Ein zusätzlicher Test im Monolithen hätte den bestehenden Split-Vertrag geschwächt.

## Zielorte für künftige Tests

- Neue ActionSemanticCandidate- und TargetContext-Regressionen: `packages/ai/src/action-semantic-candidate.test.ts` oder `packages/ai/src/actions/action-semantic-coverage.test.ts`.
- Neue Semantic-Runtime-Cutover-Regressionen: `packages/ai/src/semantic-ai-runtime-cutover.test.ts`.
- Neue Simulation-, Selfplay-, League- und Benchmark-Regressionen: `packages/ai/src/simulation/`.
- Neue diagnostische Taxonomie- oder Goal-Mapping-Regressionen: `packages/ai/src/action-doctrine-goal-diagnostics.test.ts`.
- Neue public API-Integrations- oder End-to-end-Entscheidungsverträge nur dann in `index.test.ts`, wenn keine stabilere Modulgrenze existiert.

## Verification

- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts`: siehe Paketabschluss.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/simulation-harness.test.ts`: siehe Paketabschluss.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/v143-fixtures.test.ts`: siehe Paketabschluss.
- `corepack pnpm --filter @netgrid/ai typecheck`: siehe Paketabschluss.
- `git diff --check`: siehe Paketabschluss.
