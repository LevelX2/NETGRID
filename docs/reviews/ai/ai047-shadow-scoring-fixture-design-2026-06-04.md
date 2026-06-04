# AI047 Shadow-only Scoring Fixture Design

Datum: 2026-06-04
Primärer Agent: `release-implementation-agent`
Status: `done`
Scope: Shadow-only Fixture- und Gate-Design, keine Bewertungsausführung

## Kurzfazit

AI047 definiert den sicheren Bewertungsrahmen für spätere Shadow-Reports. Es wird kein produktives Scoring gebaut. Es gibt keine Action-Auswahl, keine Planner-Gewichte, keine Runtime-Anbindung, keine Engine- oder Legalitätsänderung und keine Hidden-Info-Projektion.

Der Fixture-Korpus enthält 14 Szenarien: 7 Runner-Szenarien und 7 Corp-Szenarien. Die Top-Gaps aus der Action-Semantik-Brücke bleiben explizite Blocker: `target_context_unavailable`, `ability_unresolved` und `card_semantics_unavailable`.

## Fixture-Korpus

| Side | Szenarien |
| --- | --- |
| Runner | Economy stabilisieren, Rig Setup / Install Program, Central Pressure, Remote Contest, Survival, Access-Entscheidung, Run-Fortsetzung |
| Corp | Economy stabilisieren, Remote Score Window, Central Defense, ICE Tax / Rez Window, Tag/Trace/Punish, Advance/Score, Ambush/Access-Punish |

## Erlaubte Inputs

Erlaubt sind nur vorhandene, side-safe Diagnostikfelder: `semanticActionType`, `cardContextSignals`, `actionTacticSignals`, `strategySupport`, `conditions`, `risks`, `constraints`, `costProfile`, `timingProfile`, engine-provided `targetContext`, `boardContext`, `hardGates`, TacticalGoal-Evidence und DeckDoctrine-v2-Readiness.

Verboten bleiben Full GameState, gegnerische Hidden-Karten, nicht side-safe rekonstruierte Ziele, nicht engine-provided Target-Optionen, Legacy-PlanRoles als Wahrheit und frei geratene Scores.

## Hard-Gates

Vor jeder späteren Bewertung gelten harte Gates:

- `engine_legal_action`
- `hidden_info`
- `side_visibility`
- `runtime_no_effect`
- `target_context` für target-sensitive Ziele
- `ability_resolution` für Multi-Ability-Card-Scoring
- `cost_known` für kostensensitive Bewertung
- `timing_known` für timingsensitive Bewertung

Wenn ein benötigtes Gate unknown oder blocked ist, darf der Candidate im Shadow-Report erscheinen, aber nur mit `scoreStatus: blocked_by_gap` oder `blocked_by_gate`.

## Score-Draft-Schema

Das Schema bleibt Entwurf und report-only. Es enthält Candidate, Scenario, `scoreStatus`, Goal-Matches, Hard-Gate-Ergebnisse und Evidence-Listen. Live-Score-, Runtime-Rank- und Selected-Action-Felder sind verboten.

## Nächster Step

AI048 darf darauf aufbauend einen report-only Shadow-Ordering-Report erzeugen. Auch dort bleiben produktive Auswahl, Runtime-Wirkung und Planner-Gewichte verboten.

## Verifikation

| Befehl | Erwartung |
| --- | --- |
| `node scripts/check-ai047-shadow-scoring-fixture-design.mjs` | Report, Fixture-Korpus, Hard-Gates und No-Effect-Gates gültig |
| `corepack pnpm --filter @netgrid/ai test -- shadow-scoring-diagnostics.test.ts` | Diagnostiktests grün |
