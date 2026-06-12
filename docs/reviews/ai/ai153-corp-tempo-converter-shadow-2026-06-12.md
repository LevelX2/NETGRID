# AI153 Corp Scoreline/Tempo Converter Shadow

Datum: 2026-06-12

Branch: `codex/ai149-ai158-same-state-semantic-endgame`

## Ziel

AI153 bewertet Corp-Economy und Corp-Ability-Actions nur nach sichtbarer Konversion in Scoreline, Advance, Rez oder Protection. Es gibt keine generische Corp-Economy-Strafe und keine Runtime-Wirkung.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Corp-/mixed-Fälle | 20 |
| Assertions bestanden | 3/3 |
| Redaction-safe | 1 |

## Kategorien

| Kategorie | Fälle |
| --- | ---: |
| `advance_to_score` | 2 |
| `rez_or_install_protection` | 9 |
| `safe_scoreline_action` | 9 |

## Assertions

| Test | Erwartet | Erhalten | Ergebnis |
| --- | --- | --- | --- |
| Corporate Boon nur Scoreline-Progress bei sichtbarer Konversion | `action_gain_to_scoreline` | `action_gain_to_scoreline` | pass |
| Project Consultants / Management Shake-Up als Advancement-Tempo | `advance_to_score` | `advance_to_score` | pass |
| Pure Economy bleibt Reserve ohne Konversion | `reserve_without_visible_conversion` | `reserve_without_visible_conversion` | pass |

## Fälle

| Case | Subcluster | Score | Advance | Rez/Protection | Economy | Economy->Rez | Economy->Score | ActionGain | Opaque | Kategorie | Cutover |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| `A-ai-v143-tuning-006` | `continue_chain_to_access` | 0 | 2 | 7 | 19 | 1 | 0 | 0 | 0 | `rez_or_install_protection` | `shadow_only_needs_same_state_fixture` |
| `A-ai-v143-tuning-008` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 0 | 2 | 10 | 11 | 8 | 0 | 5 | 2 | `advance_to_score` | `shadow_only_needs_same_state_fixture` |
| `A-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | 0 | 0 | 9 | 16 | 4 | 0 | 3 | 1 | `rez_or_install_protection` | `shadow_only_needs_same_state_fixture` |
| `B-ai-v143-tuning-001` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 1 | 3 | 1 | 14 | 0 | 6 | 0 | 3 | `safe_scoreline_action` | `shadow_only_needs_same_state_fixture` |
| `B-ai-v143-tuning-003` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 0 | 0 | 9 | 13 | 11 | 0 | 13 | 4 | `rez_or_install_protection` | `shadow_only_needs_same_state_fixture` |
| `B-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | 0 | 0 | 4 | 15 | 12 | 0 | 0 | 4 | `rez_or_install_protection` | `shadow_only_needs_same_state_fixture` |
| `B-ai-v143-tuning-006` | `continue_chain_to_access` | 0 | 1 | 7 | 16 | 0 | 0 | 0 | 2 | `rez_or_install_protection` | `shadow_only_needs_same_state_fixture` |
| `B-ai-v143-tuning-008` | `runner_late_gain_credit_real_reserve` | 0 | 0 | 7 | 21 | 1 | 0 | 1 | 3 | `rez_or_install_protection` | `shadow_only_needs_same_state_fixture` |
| `B-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | 2 | 2 | 5 | 15 | 12 | 7 | 1 | 4 | `safe_scoreline_action` | `shadow_only_needs_same_state_fixture` |
| `C-ai-v143-tuning-001` | `runner_late_gain_credit_real_reserve` | 1 | 8 | 5 | 16 | 0 | 5 | 2 | 0 | `safe_scoreline_action` | `shadow_only_needs_same_state_fixture` |
| `C-ai-v143-tuning-002` | `continue_chain_to_access` | 0 | 2 | 5 | 14 | 8 | 0 | 1 | 1 | `advance_to_score` | `shadow_only_needs_same_state_fixture` |
| `C-ai-v143-tuning-004` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 1 | 2 | 9 | 17 | 11 | 1 | 2 | 2 | `safe_scoreline_action` | `shadow_only_needs_same_state_fixture` |
| `C-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | 0 | 0 | 11 | 21 | 13 | 0 | 0 | 3 | `rez_or_install_protection` | `shadow_only_needs_same_state_fixture` |
| `C-ai-v143-tuning-006` | `runner_late_gain_credit_real_reserve` | 2 | 5 | 7 | 9 | 0 | 3 | 6 | 9 | `safe_scoreline_action` | `shadow_only_needs_same_state_fixture` |
| `C-ai-v143-tuning-007` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 1 | 4 | 6 | 6 | 4 | 0 | 15 | 8 | `safe_scoreline_action` | `shadow_only_needs_same_state_fixture` |
| `D-ai-v143-tuning-003` | `continue_chain_to_access` | 2 | 7 | 2 | 3 | 0 | 2 | 0 | 2 | `safe_scoreline_action` | `shadow_only_needs_same_state_fixture` |
| `D-ai-v143-tuning-004` | `runner_late_gain_credit_real_reserve` | 2 | 3 | 3 | 16 | 0 | 3 | 0 | 0 | `safe_scoreline_action` | `shadow_only_needs_same_state_fixture` |
| `D-ai-v143-tuning-006` | `corp_late_gain_credit_no_safe_alternative` | 0 | 0 | 5 | 15 | 9 | 0 | 2 | 4 | `rez_or_install_protection` | `shadow_only_needs_same_state_fixture` |
| `D-ai-v143-tuning-008` | `continue_chain_to_access` | 2 | 3 | 4 | 10 | 0 | 3 | 0 | 2 | `safe_scoreline_action` | `shadow_only_needs_same_state_fixture` |
| `D-ai-v143-tuning-010` | `continue_chain_to_access` | 0 | 0 | 3 | 10 | 2 | 0 | 0 | 4 | `rez_or_install_protection` | `shadow_only_needs_same_state_fixture` |

## Schluss

Der Converter macht sichtbare Corp-Tempo-Konversionen unterscheidbar. Score, Advance und Protection bleiben starke Shadow-Signale; reine Economy bleibt Reserve, solange keine side-safe Konversion sichtbar ist. AI149 liefert weiter keinen same-state Cutover-Beweis.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai153-corp-tempo-converter-shadow.ts`
- `git diff --check`
