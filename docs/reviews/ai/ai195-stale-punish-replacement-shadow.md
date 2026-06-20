# AI195 Stale Punish Replacement Shadow v1

Datum: 2026-06-14

Branch: `codex/ai191-ai200-binding-replay-proof`

## Ziel

AI195 leitet aus den AI185-Stale-Punish-FÃ¤llen einen reinen Shadow-Zielwechsel ab. Es wird kein Score, kein Runtime-Pfad und keine generische Corp-Economy-Strafe geÃ¤ndert.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Stale-Punish-FÃ¤lle | 20 |
| PrimÃ¤rfÃ¤lle ohne reales Punish-Fenster | 17 |
| Replacement-Kandidaten | 17 |
| wiederholte Replacement-Zieltypen | 3 |
| Runtime-Wirkungen | 0 |

## Replacement-Ziele

| Ziel | Count |
| --- | ---: |
| `corp.replace_stale_punish_with_economy_conversion` | 11 |
| `corp.replace_stale_punish_with_protection` | 4 |
| `corp.replace_stale_punish_with_scoreline` | 2 |
| `no_replacement_candidate` | 3 |

## FÃ¤lle

| Case | Root Cause | Tagfenster | Payoff sichtbar | Scoreline besser | Protection besser | Shadow-Ziel |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| `B-ai-v143-tuning-005` | `missing_tag_window` | 0 | 0 | 0 | 0 | `corp.replace_stale_punish_with_economy_conversion` |
| `D-ai-v143-tuning-010` | `missing_punish_payoff` | 1 | 0 | 0 | 0 | `corp.replace_stale_punish_with_economy_conversion` |
| `B-ai-v143-tuning-008` | `missing_punish_payoff` | 1 | 0 | 0 | 0 | `corp.replace_stale_punish_with_economy_conversion` |
| `D-ai-v143-tuning-006` | `missing_tag_window` | 0 | 0 | 0 | 0 | `corp.replace_stale_punish_with_economy_conversion` |
| `B-ai-v143-tuning-003` | `missing_tag_window` | 0 | 0 | 0 | 1 | `corp.replace_stale_punish_with_protection` |
| `B-ai-v143-tuning-009` | `missing_punish_payoff` | 1 | 0 | 0 | 0 | `corp.replace_stale_punish_with_economy_conversion` |
| `C-ai-v143-tuning-006` | `missing_punish_payoff` | 1 | 0 | 0 | 0 | `corp.replace_stale_punish_with_economy_conversion` |
| `A-ai-v143-tuning-008` | `missing_tag_window` | 0 | 0 | 0 | 1 | `corp.replace_stale_punish_with_protection` |
| `C-ai-v143-tuning-008` | `scoreline_should_replace` | 1 | 0 | 1 | 0 | `corp.replace_stale_punish_with_scoreline` |
| `A-ai-v143-tuning-006` | `missing_punish_payoff` | 1 | 0 | 0 | 0 | `no_replacement_candidate` |
| `A-ai-v143-tuning-009` | `missing_punish_payoff` | 1 | 0 | 0 | 0 | `corp.replace_stale_punish_with_economy_conversion` |
| `B-ai-v143-tuning-006` | `missing_punish_payoff` | 1 | 0 | 0 | 0 | `no_replacement_candidate` |
| `C-ai-v143-tuning-001` | `missing_punish_payoff` | 1 | 0 | 0 | 0 | `corp.replace_stale_punish_with_economy_conversion` |
| `C-ai-v143-tuning-004` | `missing_tag_window` | 0 | 0 | 0 | 1 | `corp.replace_stale_punish_with_protection` |
| `C-ai-v143-tuning-005` | `missing_punish_payoff` | 1 | 0 | 0 | 0 | `corp.replace_stale_punish_with_economy_conversion` |
| `C-ai-v143-tuning-002` | `missing_tag_window` | 0 | 0 | 0 | 0 | `corp.replace_stale_punish_with_economy_conversion` |
| `C-ai-v143-tuning-007` | `protection_should_replace` | 1 | 0 | 0 | 1 | `corp.replace_stale_punish_with_protection` |
| `B-ai-v143-tuning-001` | `scoreline_should_replace` | 1 | 0 | 1 | 0 | `corp.replace_stale_punish_with_scoreline` |
| `D-ai-v143-tuning-004` | `missing_punish_payoff` | 1 | 0 | 0 | 0 | `corp.replace_stale_punish_with_economy_conversion` |
| `D-ai-v143-tuning-008` | `missing_punish_payoff` | 1 | 0 | 0 | 0 | `no_replacement_candidate` |

## Schluss

AI195 findet wiederholte Shadow-Zielwechsel, vor allem Economy-Conversion fÃ¼r Stale-Punish ohne reales Payoff-Fenster sowie Scoreline-/Protection-Ersatz, wenn AI185 dafÃ¼r explizite Evidenz liefert. Das bleibt Diagnose; kein Punish-Bonus und kein Economy-Malus werden produktiv geÃ¤ndert.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai195-stale-punish-replacement-shadow.ts`
- `git diff --check`
