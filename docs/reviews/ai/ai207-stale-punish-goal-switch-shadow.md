# AI207 Stale Punish Goal Switch Shadow

Datum: 2026-06-14

Branch: `codex/ai201-ai212-witness-proof`

## Ziel

AI207 uebersetzt den groessten stale-Punish-Cluster in eine Shadow-Zielwechselentscheidung. Es gibt keinen Corp-Economy-Malus, keine Runtime-Gewichte und keine produktive Wirkung.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Stale-Punish-Faelle | 20 |
| Punish bleibt moeglich | 0 |
| Punish deaktiviert | 20 |
| Scoreline-Switches | 2 |
| Protection-Switches | 4 |
| Economy-Conversion-Switches | 14 |
| Runtime-Effekte | 0 |

## Replacement Goals

| Goal | Count |
| --- | ---: |
| `corp.shadow_switch_to_economy_conversion` | 14 |
| `corp.shadow_switch_to_protection` | 4 |
| `corp.shadow_switch_to_scoreline` | 2 |

## Cases

| Case | Root Cause | Tagged Window | Payoff legal/payable | Shadow Goal | Punish enabled |
| --- | --- | --- | --- | --- | --- |
| `B-ai-v143-tuning-005` | `missing_tag_window` | no | no | `corp.shadow_switch_to_economy_conversion` | no |
| `D-ai-v143-tuning-010` | `missing_punish_payoff` | yes | no | `corp.shadow_switch_to_economy_conversion` | no |
| `B-ai-v143-tuning-008` | `missing_punish_payoff` | yes | no | `corp.shadow_switch_to_economy_conversion` | no |
| `D-ai-v143-tuning-006` | `missing_tag_window` | no | no | `corp.shadow_switch_to_economy_conversion` | no |
| `B-ai-v143-tuning-003` | `missing_tag_window` | no | no | `corp.shadow_switch_to_protection` | no |
| `B-ai-v143-tuning-009` | `missing_punish_payoff` | yes | no | `corp.shadow_switch_to_economy_conversion` | no |
| `C-ai-v143-tuning-006` | `missing_punish_payoff` | yes | no | `corp.shadow_switch_to_economy_conversion` | no |
| `A-ai-v143-tuning-008` | `missing_tag_window` | no | no | `corp.shadow_switch_to_protection` | no |
| `C-ai-v143-tuning-008` | `scoreline_should_replace` | yes | no | `corp.shadow_switch_to_scoreline` | no |
| `A-ai-v143-tuning-006` | `missing_punish_payoff` | yes | no | `corp.shadow_switch_to_economy_conversion` | no |
| `A-ai-v143-tuning-009` | `missing_punish_payoff` | yes | no | `corp.shadow_switch_to_economy_conversion` | no |
| `B-ai-v143-tuning-006` | `missing_punish_payoff` | yes | no | `corp.shadow_switch_to_economy_conversion` | no |
| `C-ai-v143-tuning-001` | `missing_punish_payoff` | yes | no | `corp.shadow_switch_to_economy_conversion` | no |
| `C-ai-v143-tuning-004` | `missing_tag_window` | no | no | `corp.shadow_switch_to_protection` | no |
| `C-ai-v143-tuning-005` | `missing_punish_payoff` | yes | no | `corp.shadow_switch_to_economy_conversion` | no |
| `C-ai-v143-tuning-002` | `missing_tag_window` | no | no | `corp.shadow_switch_to_economy_conversion` | no |
| `C-ai-v143-tuning-007` | `protection_should_replace` | yes | no | `corp.shadow_switch_to_protection` | no |
| `B-ai-v143-tuning-001` | `scoreline_should_replace` | yes | no | `corp.shadow_switch_to_scoreline` | no |
| `D-ai-v143-tuning-004` | `missing_punish_payoff` | yes | no | `corp.shadow_switch_to_economy_conversion` | no |
| `D-ai-v143-tuning-008` | `missing_punish_payoff` | yes | no | `corp.shadow_switch_to_economy_conversion` | no |

## Schluss

AI207 erzeugt eine konkrete Shadow-Entscheidung fuer stale Punish-Intents: Ohne reales Tag-/Payoff-Fenster wird Punish deaktiviert und auf Scoreline, Protection oder Economy-Conversion umgeschaltet. Der Stand bleibt shadow-only.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai207-stale-punish-goal-switch-shadow.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/stale-punish-goal-switch-shadow.test.ts`
- `corepack pnpm --filter @netgrid/ai run typecheck`
- `git diff --check`
