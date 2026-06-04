# AI044 DeckDoctrine v2 Diagnostic Schema

Datum: 2026-06-04
Primärer Agent: `release-implementation-agent`
Status: `done`
Scope: diagnostisches DeckDoctrine-v2-Readiness-Schema

## Kurzfazit

AI044 legt ein separates, nicht produktiv exportiertes Diagnostikmodul für DeckDoctrine-v2-Readiness an. Es liest ausschließlich vorhandene `ActionSemanticCandidate`-Felder und markiert readiness als `ready`, `partial` oder `blocked`.

Fehlende oder unsichere Felder werden nicht geraten. Sie erscheinen als `deckDoctrineGaps`, zum Beispiel `ability_unresolved`, `card_semantics_unavailable`, `strategy_support_missing`, `conditions_missing`, `risks_missing` oder `constraints_missing`.

## Schema

| Bereich | Quelle |
| --- | --- |
| Candidate Identity | `actionId`, `actionType`, `actorSide` |
| Projection Status | `primaryProjectionStatus`, `projectionIssues` |
| Hidden-Info Guard | `hardGates`, `projectionIssues` |
| Source/Card Context | `sourceKind`, `sourceCardId`, `cardContextSignals` |
| Ability Binding | `abilityId`, `abilityBindingMethod`, `projectionIssues` |
| Doctrine Support | `strategySupport`, `conditions`, `risks`, `constraints` |
| Gate Surface | `hardGates` |

## Grenzen

Das Modul wird nicht aus `packages/ai/src/index.ts`, `runner-plans.ts`, `corp-plans.ts` oder `input-dto.ts` importiert. Es gibt keine produktive Action-Auswahl, keine numerischen Action-Scores, keine Rangliste, keine Planner-Gewichte, keine Runtime-Anbindung, keine Legalitätserzeugung und keine Hidden-Info-Projektion.

## No-Effect-Flags

Alle No-Effect-Flags bleiben `false`: `planner`, `actionScore`, `planWeight`, `targetingAi`, `engine`, `legality`, `profileOrDefaultSwitch`, `uiDerivation`, `hiddenInfoLeak`.

## Verifikation

| Befehl | Erwartung |
| --- | --- |
| `node scripts/check-ai044-deck-doctrine-v2-diagnostic-schema.mjs` | Report, Codegrenzen und No-Effect-Gates gültig |
| `corepack pnpm --filter @netgrid/ai test -- action-doctrine-goal-diagnostics.test.ts` | Diagnostiktests grün |
