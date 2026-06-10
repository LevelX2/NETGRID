# AI-SEM-4 Semantik-Invariant-Checks

Stand: 2026-06-10
Status: abgeschlossen im Paket `AI-SEM-4`
Branch: `codex/ai-source-followup-review-fixes`

## Ziel

Die neue ActionSemanticCandidate-Semantik soll prüfbar bleiben, ohne aus Signalen, StrategySupportPairs oder TargetProfiles produktive KI-Wirkung, neue Legalität oder Hidden-Info-Nutzung abzuleiten.

## Umsetzung

Neu ergänzt:

- `packages/ai/src/actions/action-semantic-invariants.ts`
- `packages/ai/src/actions/action-semantic-invariants.test.ts`

Der Validator ist bewusst diagnostisch:

- `scope: "diagnostic_only"`
- `productiveUseAllowed: false`
- `noEffectFlags`: `no_runtime_scoring`, `no_action_selection`, `no_legal_action_generation`, `no_hidden_info_projection`

## Gesicherte Invarianten

- Keine reinen Typ-/Subtyp-/Namenssignale als Action-Semantik.
- `StrategySupportPair` muss `strategyId`, `role`, `confidence` und `evidence` enthalten.
- Support-only-Signale dürfen keine `StrategySupportPairs` erzeugen.
- Matched `TargetProfiles` dürfen keine Hidden-Info-Evidence tragen.
- Test-/Fixture-Profile werden in Produktions-Checks als Fehler markiert.
- Der neue Validator wird nicht aus `index.ts`, `runtime/semantic-runtime.ts` oder `runtime/semantic-choice-ranking.ts` importiert.

## Bewusste Grenzen

- Keine Runtime-Auswahländerung.
- Keine neue Verwendung von TargetProfiles im Scoring.
- Keine DeckDoctrine-v2-Produktivaktivierung.
- Keine Änderung an Engine, LegalActions, `applyAction`, Replay, StateHash oder Randomness.
- Keine Änderung an Legacy- oder No-Candidate-Fallback.

## Verification

- `corepack pnpm --filter @netgrid/ai exec vitest run src/actions/action-semantic-invariants.test.ts`: siehe Paketabschluss.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/action-semantic-candidate.test.ts src/actions/action-semantic-coverage.test.ts src/action-doctrine-goal-diagnostics.test.ts`: siehe Paketabschluss.
- `corepack pnpm --filter @netgrid/ai typecheck`: siehe Paketabschluss.
- `git diff --check`: siehe Paketabschluss.
