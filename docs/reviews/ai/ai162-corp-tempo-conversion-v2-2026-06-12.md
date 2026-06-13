# AI162 Corp Tempo Conversion v2

Datum: 2026-06-12

Branch: `codex/ai159-ai169-endgame-opportunity`

## Ziel

AI162 übersetzt Corp-Economy und Tempo in konkrete Konversionspfade: Scoreline, Advance, Protection, Extra-Action, Economy-Conversion oder Punish-Stale. Es gibt keine Runtime-Wirkung und keine pauschale Corp-Credit-Strafe.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Corp-/mixed-Fälle | 20 |

## Pfade

| Pfad | Fälle |
| --- | ---: |
| `rez_or_install_protection_available` | 11 |
| `scoreline_available` | 9 |

## Fälle

| Case | Subcluster | Scoreline | Advance | Protection | ActionGain | Economy->Score | Economy->Protection | Punish Intent | Pfad | Effektklasse | Cutover |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| `A-ai-v143-tuning-006` | `continue_chain_to_access` | 0 | 0 | 1 | 0 | 0 | 1 | 1 | `rez_or_install_protection_available` | Rez or install protection | `shadow_only_needs_opportunity_proof` |
| `A-ai-v143-tuning-008` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 0 | 0 | 1 | 1 | 0 | 1 | 1 | `rez_or_install_protection_available` | Rez or install protection | `shadow_only_needs_opportunity_proof` |
| `A-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | 0 | 0 | 1 | 1 | 0 | 1 | 1 | `rez_or_install_protection_available` | Rez or install protection | `shadow_only_needs_opportunity_proof` |
| `B-ai-v143-tuning-001` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 1 | 1 | 1 | 0 | 1 | 0 | 1 | `scoreline_available` | Score agenda | `shadow_only_needs_opportunity_proof` |
| `B-ai-v143-tuning-003` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 0 | 0 | 1 | 1 | 0 | 1 | 1 | `rez_or_install_protection_available` | Rez or install protection | `shadow_only_needs_opportunity_proof` |
| `B-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | 0 | 0 | 1 | 0 | 0 | 1 | 0 | `rez_or_install_protection_available` | Rez or install protection | `shadow_only_needs_opportunity_proof` |
| `B-ai-v143-tuning-006` | `continue_chain_to_access` | 0 | 0 | 1 | 0 | 0 | 0 | 1 | `rez_or_install_protection_available` | Rez or install protection | `shadow_only_needs_opportunity_proof` |
| `B-ai-v143-tuning-008` | `runner_late_gain_credit_real_reserve` | 0 | 0 | 1 | 1 | 0 | 1 | 0 | `rez_or_install_protection_available` | Rez or install protection | `shadow_only_needs_opportunity_proof` |
| `B-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | 1 | 1 | 1 | 1 | 1 | 1 | 0 | `scoreline_available` | Score agenda | `shadow_only_needs_opportunity_proof` |
| `C-ai-v143-tuning-001` | `runner_late_gain_credit_real_reserve` | 1 | 1 | 1 | 1 | 1 | 0 | 1 | `scoreline_available` | Score agenda | `shadow_only_needs_opportunity_proof` |
| `C-ai-v143-tuning-002` | `continue_chain_to_access` | 0 | 0 | 1 | 1 | 0 | 1 | 1 | `rez_or_install_protection_available` | Rez or install protection | `shadow_only_needs_opportunity_proof` |
| `C-ai-v143-tuning-004` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | `scoreline_available` | Score agenda | `shadow_only_needs_opportunity_proof` |
| `C-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | 0 | 0 | 1 | 0 | 0 | 1 | 0 | `rez_or_install_protection_available` | Rez or install protection | `shadow_only_needs_opportunity_proof` |
| `C-ai-v143-tuning-006` | `runner_late_gain_credit_real_reserve` | 1 | 1 | 1 | 1 | 1 | 0 | 1 | `scoreline_available` | Score agenda | `shadow_only_needs_opportunity_proof` |
| `C-ai-v143-tuning-007` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 1 | 1 | 1 | 1 | 0 | 1 | 0 | `scoreline_available` | Score agenda | `shadow_only_needs_opportunity_proof` |
| `D-ai-v143-tuning-003` | `continue_chain_to_access` | 1 | 1 | 1 | 0 | 1 | 0 | 0 | `scoreline_available` | Score agenda | `shadow_only_needs_opportunity_proof` |
| `D-ai-v143-tuning-004` | `runner_late_gain_credit_real_reserve` | 1 | 1 | 1 | 0 | 1 | 0 | 0 | `scoreline_available` | Score agenda | `shadow_only_needs_opportunity_proof` |
| `D-ai-v143-tuning-006` | `corp_late_gain_credit_no_safe_alternative` | 0 | 0 | 1 | 1 | 0 | 1 | 0 | `rez_or_install_protection_available` | Rez or install protection | `shadow_only_needs_opportunity_proof` |
| `D-ai-v143-tuning-008` | `continue_chain_to_access` | 1 | 1 | 1 | 0 | 1 | 0 | 0 | `scoreline_available` | Score agenda | `shadow_only_needs_opportunity_proof` |
| `D-ai-v143-tuning-010` | `continue_chain_to_access` | 0 | 0 | 1 | 0 | 0 | 1 | 0 | `rez_or_install_protection_available` | Rez or install protection | `shadow_only_needs_opportunity_proof` |

## Schluss

Corp-Tempo ist weiterhin sichtbar, aber nicht cutoverfähig. Besonders Punish bleibt nur dann Fortschritt, wenn ein reales Tag-/Damage-Fenster vorhanden ist; andernfalls ist es stale und muss in Ladder/Lookahead als Blocker erscheinen.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai162-corp-tempo-conversion-v2.ts`
- `git diff --check`
