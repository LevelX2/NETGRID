# AI174 Corp Tag/Punish Stale Intent Review

Datum: 2026-06-13

Branch: `codex/ai170-ai180-opportunity-snapshots`

## Ziel

AI174 prüft die stale `corp.convert_tag_to_punish`-Intents aus AI172. Punish wird nur als realer Fortschritt behandelt, wenn ein echtes Tag-/Payoff-Fenster oder eine bessere Scoreline-Ersatzentscheidung sichtbar ist.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Punish-Stale-Fälle | 20 |

| Klasse | Fälle |
| --- | ---: |
| `missing_payoff` | 12 |
| `missing_tag` | 6 |
| `scoreline_should_replace` | 2 |

## Fälle

| Case | Subcluster | Stale Count | Snapshot-Alternativen | Klasse |
| --- | --- | ---: | ---: | --- |
| `B-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | 20 | 0 | `missing_tag` |
| `D-ai-v143-tuning-010` | `continue_chain_to_access` | 12 | 1 | `missing_payoff` |
| `B-ai-v143-tuning-008` | `runner_late_gain_credit_real_reserve` | 11 | 6 | `missing_payoff` |
| `D-ai-v143-tuning-006` | `corp_late_gain_credit_no_safe_alternative` | 11 | 0 | `missing_tag` |
| `B-ai-v143-tuning-003` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 10 | 0 | `missing_tag` |
| `B-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | 10 | 6 | `missing_payoff` |
| `C-ai-v143-tuning-006` | `runner_late_gain_credit_real_reserve` | 10 | 1 | `missing_payoff` |
| `A-ai-v143-tuning-008` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 9 | 0 | `missing_tag` |
| `C-ai-v143-tuning-008` | `run_microstep_required` | 9 | 6 | `scoreline_should_replace` |
| `A-ai-v143-tuning-006` | `continue_chain_to_access` | 8 | 1 | `missing_payoff` |
| `A-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | 8 | 6 | `missing_payoff` |
| `B-ai-v143-tuning-006` | `continue_chain_to_access` | 8 | 6 | `missing_payoff` |
| `C-ai-v143-tuning-001` | `runner_late_gain_credit_real_reserve` | 8 | 6 | `missing_payoff` |
| `C-ai-v143-tuning-004` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 8 | 0 | `missing_tag` |
| `C-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | 8 | 6 | `missing_payoff` |
| `C-ai-v143-tuning-002` | `continue_chain_to_access` | 7 | 0 | `missing_tag` |
| `C-ai-v143-tuning-007` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 6 | 6 | `missing_payoff` |
| `B-ai-v143-tuning-001` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 4 | 7 | `scoreline_should_replace` |
| `D-ai-v143-tuning-004` | `runner_late_gain_credit_real_reserve` | 4 | 6 | `missing_payoff` |
| `D-ai-v143-tuning-008` | `continue_chain_to_access` | 4 | 6 | `missing_payoff` |

## Schluss

Die auffällige Punish-Familie ist kein Beleg für einen sofortigen Punish-Cutover. In den Snapshots dominiert fehlender Payoff oder eine bessere Scoreline-/Protection-Ersatzrichtung. AI178 darf daraus keinen generischen Corp-Punish-Malus ableiten.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai174-corp-tag-punish-stale-intent-review.ts`
- `git diff --check`
