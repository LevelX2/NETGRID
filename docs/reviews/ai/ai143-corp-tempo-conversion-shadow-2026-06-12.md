# AI143 Corp Tempo Conversion Shadow

Datum: 2026-06-12

Branch: `codex/ai140-ai148-semantic-endgame-optimization`

## Ziel

AI143 bewertet Corp- und mixed-x10-Endfenster danach, ob Corp-Economy in Score, Advance, Rez oder Protection konvertiert. Das Paket bleibt shadow-only und führt keine Corp-Economy-Strafe ein.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| geprüfte Corp-/mixed-Fälle | 9 |
| Redaction-safe | 1 |

## Kategorien

| Kategorie | Fälle |
| --- | ---: |
| `advance_to_score` | 1 |
| `rez_meaningful_ice` | 4 |
| `safe_score` | 4 |

## Fälle

| Case | Subcluster | Score | Advance | Rez | Protection | Economy | Converted Economy | Kategorie | AI146 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| `A-ai-v143-tuning-008` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 0 | 2 | 2 | 8 | 7 | 5 | `advance_to_score` | `needs_same_state_proof_before_cutover` |
| `A-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | 0 | 0 | 2 | 7 | 5 | 4 | `rez_meaningful_ice` | `no_go` |
| `B-ai-v143-tuning-001` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 2 | 3 | 0 | 1 | 10 | 4 | `safe_score` | `needs_same_state_proof_before_cutover` |
| `B-ai-v143-tuning-003` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 0 | 0 | 3 | 5 | 12 | 5 | `rez_meaningful_ice` | `no_go` |
| `B-ai-v143-tuning-008` | `runner_late_gain_credit_real_reserve` | 0 | 0 | 1 | 4 | 12 | 10 | `rez_meaningful_ice` | `no_go` |
| `B-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | 3 | 2 | 2 | 4 | 9 | 2 | `safe_score` | `needs_same_state_proof_before_cutover` |
| `C-ai-v143-tuning-004` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 2 | 2 | 2 | 7 | 6 | 6 | `safe_score` | `needs_same_state_proof_before_cutover` |
| `C-ai-v143-tuning-007` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 2 | 4 | 2 | 6 | 7 | 6 | `safe_score` | `needs_same_state_proof_before_cutover` |
| `D-ai-v143-tuning-006` | `corp_late_gain_credit_no_safe_alternative` | 0 | 0 | 2 | 3 | 13 | 8 | `rez_meaningful_ice` | `no_go` |

## Schluss

Corp-Tempo-Conversion ist sichtbar, aber nicht als same-state Cutover belegt. Score-/Advance-Fälle werden als spätere Fixture-Priorität markiert. Reine Economy bleibt nicht automatisch falsch; ohne same-state Score-/Protection-Alternative bleibt sie ein No-Go für AI146.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai143-corp-tempo-conversion-shadow.ts`
- `git diff --check`
