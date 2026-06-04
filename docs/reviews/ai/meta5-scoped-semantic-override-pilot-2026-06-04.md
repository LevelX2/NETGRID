# META 5 Scoped Semantic Override Pilot

Stand: 2026-06-04
Status: complete

## Ziel

META 5 modelliert erstmals semantische Abweichungen von Legacy, aber nur test/internal und nur in engen Whitelist-Scopes. Es gibt keine produktive Aktivierung.

## Erlaubte Test-Scopes

- `runner_basic_economy_vs_draw`
- `corp_basic_economy`
- `runner_remove_tag_when_tagged`
- `corp_score_agenda_when_engine_legal_and_clear`
- `simple_hq_or_rnd_run_when_goal_evidence_ready`

## Blockierte Scopes

- `hidden_info_access_choices`
- `trace_boost_or_payment`
- `x_value_decisions`
- `damage_prevention`
- `multi_target_unresolved`
- `multi_ability_unresolved`
- `unrezzed_card_dependent_choice`

## Ergebnis

Der Pilot enthält 8 Fixtures:

- 5 erlaubte testinterne Override-Fixtures.
- 3 blockierte Fixtures für Hidden-Info, Trace-/Payment-Unsicherheit und Multi-Ability-Unresolved.
- Alle Divergenzen sind triagiert.
- `unsafeDivergenceCount = 0`.
- Keine Produktionsflags sind aktiv.

## Quality Gates

| Gate | Ergebnis |
| --- | --- |
| `overrideAllowedCount` | 5 |
| `unsafeDivergenceCount` | 0 |
| `illegalSemanticDecisionCount` | 0 |
| `hiddenInfoViolationCount` | 0 |
| `engineRejectCount` | 0 |
| Rollback tested | pass |
| All divergences triaged | pass |
| No production flag enabled | pass |

## Verifikation

```text
node scripts/check-meta5-scoped-semantic-override-pilot.mjs
corepack pnpm --filter @netgrid/ai test -- semantic-ai-core-meta.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

## Nächster Schritt

META 6 bereitet Stabilisierung, Scope Readiness, Trace Scrubber und Legacy-Freeze-Kriterien vor. Full Replacement und Legacy Removal bleiben ausgeschlossen.
