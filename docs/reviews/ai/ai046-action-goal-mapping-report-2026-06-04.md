# AI046 Action-to-Goal Mapping Report

Datum: 2026-06-04
Primärer Agent: `release-implementation-agent`
Status: `done`
Scope: diagnostische Action-to-Goal-Kreuztabelle

## Kurzfazit

AI046 verbindet `ActionSemanticCandidate` und die AI045-`TacticalGoal`-Taxonomie nur diagnostisch. Der Builder erzeugt eine Kreuztabelle in Eingabereihenfolge: Candidate-Reihenfolge mal Goal-Reihenfolge.

Es wird nichts sortiert, nichts gerankt, nichts numerisch bewertet und keine Action ausgewählt.

## Statusmodell

| Status | Bedeutung |
| --- | --- |
| `compatible` | Required Candidate Evidence ist vorhanden und kein Blocker greift |
| `blocked` | ein dokumentierter Blocker greift, zum Beispiel `hidden_info_blocked` |
| `unknown` | Required Candidate Evidence fehlt; es wird keine Passung geraten |
| `not_applicable` | Candidate-Side und Goal-Side passen nicht zusammen |

## Fixture-Ergebnis

Der AI046-Testkorpus nutzt drei side-safe beziehungsweise bewusst geblockte Candidates gegen zehn TacticalGoals:

```text
candidateFixtureCount: 3
tacticalGoalCount: 10
totalMappings: 30
compatible: 3
blocked: 2
unknown: 10
notApplicable: 15
```

Hidden-Info-Fälle bleiben `blocked` und enthalten Removal Conditions. Fehlende Felder wie `actionTacticSignals` oder `targetContext` werden als `unknown` markiert.

## Grenzen

Es gibt keine produktive Action-to-Goal-Matching-Wirkung, keine numerischen Action-Scores, keine Rangliste, keine Action-Auswahl, keine Planner-Gewichte, keine Runtime-Anbindung, keine Legalitätserzeugung und keine Hidden-Info-Projektion.

## No-Effect-Flags

Alle No-Effect-Flags bleiben `false`: `planner`, `actionScore`, `planWeight`, `targetingAi`, `engine`, `legality`, `profileOrDefaultSwitch`, `uiDerivation`, `hiddenInfoLeak`.

## Verifikation

| Befehl | Erwartung |
| --- | --- |
| `node scripts/check-ai046-action-goal-mapping-report.mjs` | Mapping-Report, Grenzen und No-Effect-Gates gültig |
| `corepack pnpm --filter @netgrid/ai test -- action-doctrine-goal-diagnostics.test.ts` | Diagnostiktests grün |
