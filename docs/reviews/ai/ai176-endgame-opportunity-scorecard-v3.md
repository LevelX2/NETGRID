# AI176 Endgame Opportunity Scorecard v3

Datum: 2026-06-13

Branch: `codex/ai170-ai180-opportunity-snapshots`

## Ziel

AI176 erweitert die Endgame-Scorecard um Opportunity-, Snapshot- und Intent-Metriken. Die Scorecard zeigt nicht nur Action-Limits, sondern ob ein Runtime-Cutover belegbar ist.

## Scorecard

| Metrik | Zähler/Nenner | Rate | Hinweis |
| --- | ---: | ---: | --- |
| `opportunity_snapshot_available_rate` | 17/19 | 89.5% | AI170 requested snapshot coverage. |
| `same_state_better_rate` | 0/17 | 0.0% | No Runtime-eligible same-state better candidate has passed the gate yet. |
| `target_context_missing_rate` | 2/17 | 11.8% | AI159 target-context-missing cases before AI170 instrumentation. |
| `stale_intent_rate` | 27/122 | 22.1% | AI151/AI172 stale intents against intent-memory records. |
| `stale_punish_intent_rate` | 20/27 | 74.1% | Share of stale intents in corp tag/punish. |
| `coverage_path_solved_rate` | 1/13 | 7.7% | Coverage solver shadow candidates before AI177 gate. |
| `corp_tempo_conversion_solved_rate` | 2/17 | 11.8% | Corp tempo solver shadow candidates before AI177 gate. |
| `lookahead_candidate_rate` | 7/10 | 70.0% | AI165 static lookahead proxy wins. |
| `runtime_cutover_eligibility_count` | 0/1 | 0.0% | AI177/AI178 have not yet approved a Runtime candidate. |
| `action_limit_rate_x5` | 11/20 | 55.0% | Baseline x5 action-limit rate. |
| `action_limit_rate_x10` | 23/40 | 57.5% | Current x10 action-limit rate with snapshot instrumentation. |

## Schluss

Die Snapshot-Verfügbarkeit ist deutlich besser als in AI159, aber Runtime-Cutover ist weiterhin nicht freigegeben. AI173 und AI175 liefern nur shadow-only Kandidaten. Erst AI177 kann daraus gate-positive Kandidaten machen; bis dahin bleibt `runtime_cutover_eligibility_count` bei 0.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai176-endgame-opportunity-scorecard-v3.ts`
- `git diff --check`
