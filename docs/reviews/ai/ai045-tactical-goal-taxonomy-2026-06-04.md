# AI045 TacticalGoal Taxonomy

Datum: 2026-06-04
Primärer Agent: `release-implementation-agent`
Status: `done`
Scope: diagnostische TacticalGoal-Taxonomie

## Kurzfazit

AI045 definiert TacticalGoals nur als kontrollierte Taxonomie mit Lifecycle-State, Required-Candidate-Evidence und Blocker-Policy. Es werden keine produktiven Ziele aus Boardstate oder Doctrine erzeugt.

Die Taxonomie enthält 10 breite Zielgruppen: 5 für den Runner und 5 für die Corp. Unsichere Bereiche bleiben `blocked_by_gap`, bis ActionSemanticCandidate-Felder wie `targetContext`, `abilityId`, `strategySupport`, `conditions`, `risks` oder side-safe CardSemanticProfiles belastbar vorhanden sind.

## Zielgruppen

| Side | Goal-Families |
| --- | --- |
| Runner | `runner_economy_stabilize`, `runner_rig_setup`, `runner_central_pressure`, `runner_remote_contest`, `runner_survival` |
| Corp | `corp_economy_stabilize`, `corp_remote_score_window`, `corp_central_defense`, `corp_ice_tax`, `corp_tag_trace_punish` |

## Lifecycle

| State | Bedeutung |
| --- | --- |
| `proposed` | Ziel ist als Taxonomiebegriff definiert, aber nicht produktiv erzeugt |
| `evidence_ready` | reserviert für später vollständig belegte diagnostische Ziele |
| `blocked_by_gap` | Ziel bleibt durch dokumentierte Candidate-Gaps blockiert |
| `shadow_only` | reserviert für spätere Shadow-Fixtures |

## Grenzen

Es gibt keine produktive TacticalGoal-Generation, keine numerischen Action-Scores, keine Rangliste, keine Action-Auswahl, keine Planner-Gewichte, keine Runtime-Anbindung, keine Legalitätserzeugung und keine Hidden-Info-Projektion.

Numerische Prioritäten bleiben bewusst deferred. Die Taxonomie beschreibt nur Zielarten und Evidence-Anforderungen.

## No-Effect-Flags

Alle No-Effect-Flags bleiben `false`: `planner`, `actionScore`, `planWeight`, `targetingAi`, `engine`, `legality`, `profileOrDefaultSwitch`, `uiDerivation`, `hiddenInfoLeak`.

## Verifikation

| Befehl | Erwartung |
| --- | --- |
| `node scripts/check-ai045-tactical-goal-taxonomy.mjs` | Taxonomie, Grenzen und No-Effect-Gates gültig |
| `corepack pnpm --filter @netgrid/ai test -- action-doctrine-goal-diagnostics.test.ts` | Diagnostiktests grün |
