# AI131 x10 Action-Limit Failure Corpus Review

Datum: 2026-06-12

Branch: `codex/ai131-ai139-semantic-endwindow-optimization`

## Ziel

AI131 baut aus dem bestehenden AI123-x10-Inventar einen reproduzierbaren, redaction-safe Failure-Corpus. Das Paket nimmt keine Runtime-Änderung vor.

## Quelle und Methode

- Quelle: `docs/reviews/ai/ai123-x10-residual-cluster-inventory-2026-06-12.json`
- Corpus-Schema: `ai131-x10-action-limit-failure-corpus-v1`
- Git Head: `e393ed55`
- Umfang: alle Action-Limit-Spiele aus dem A-D-x10-Korpus
- Endfenster: letzte 60 Actions je Fall
- Redaction-Scan: gruen

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Action-Limit-Fälle | 21 |
| Endfenster-Actions | 1260 |
| Redaction-safe | 1 |

## Fälle pro Pair

| Pair | Fälle |
| --- | ---: |
| `C` | 7 |
| `B` | 6 |
| `D` | 5 |
| `A` | 3 |

## Dominante Seiten im Endfenster

| Seite | Fälle |
| --- | ---: |
| `runner` | 12 |
| `mixed` | 9 |

## Top-5-Ursachen

| Rang | Subcluster | Spiele | Bewertung |
| ---: | --- | ---: | --- |
| 1 | `runner_late_gain_credit_real_reserve` | 8 | Runner economy dominates the residual set, but the trace flags mostly show reserve, coverage, or affordability pressure rather than a safe better action. |
| 2 | `continue_chain_to_access` | 6 | Run-Mikroschritte koennen notwendige Progress-Schritte sein und duerfen nicht als Stall fehlklassifiziert werden. |
| 3 | `corp_late_gain_credit_real_rez_or_protection_reserve` | 5 | Corp economy windows remain tied to rez/protection reserve signals and need alternative evidence before runtime pressure. |
| 4 | `corp_late_gain_credit_no_safe_alternative` | 1 | Restursache bleibt nur mit side-safe Alternative und Outcome-Nachweis cutover-faehig. |
| 5 | `run_microstep_required` | 1 | Several action limits terminate inside necessary run microflow; these are not obvious no-progress loops. |

## Einzelkorpus

| Case | Pair | Seed | Punkte R/C | Dominanz | Hauptursache | Terminal | letzte Progress-Action | Actions seit Progress |
| --- | --- | --- | ---: | --- | --- | --- | ---: | ---: |
| `A-ai-v143-tuning-006` | A | ai-v143-tuning-006 | 2/0 | runner | `continue_chain_to_access` | corp/advance_card | 159 | 0 |
| `A-ai-v143-tuning-008` | A | ai-v143-tuning-008 | 5/2 | mixed | `corp_late_gain_credit_real_rez_or_protection_reserve` | runner/continue_run | 136 | 23 |
| `A-ai-v143-tuning-009` | A | ai-v143-tuning-009 | 0/3 | mixed | `runner_late_gain_credit_real_reserve` | corp/decline_rez | 157 | 2 |
| `B-ai-v143-tuning-001` | B | ai-v143-tuning-001 | 0/6 | mixed | `corp_late_gain_credit_real_rez_or_protection_reserve` | corp/resolve_choice | 141 | 18 |
| `B-ai-v143-tuning-003` | B | ai-v143-tuning-003 | 6/3 | mixed | `corp_late_gain_credit_real_rez_or_protection_reserve` | runner/pump_breaker | 155 | 4 |
| `B-ai-v143-tuning-005` | B | ai-v143-tuning-005 | 0/0 | runner | `runner_late_gain_credit_real_reserve` | runner/end_turn | 134 | 25 |
| `B-ai-v143-tuning-006` | B | ai-v143-tuning-006 | 3/3 | runner | `continue_chain_to_access` | runner/continue_run | 127 | 32 |
| `B-ai-v143-tuning-008` | B | ai-v143-tuning-008 | 3/0 | mixed | `runner_late_gain_credit_real_reserve` | runner/gain_credit | 128 | 31 |
| `B-ai-v143-tuning-009` | B | ai-v143-tuning-009 | 0/6 | mixed | `runner_late_gain_credit_real_reserve` | corp/gain_credit | 143 | 16 |
| `C-ai-v143-tuning-001` | C | ai-v143-tuning-001 | 5/3 | runner | `runner_late_gain_credit_real_reserve` | corp/advance_card | 159 | 0 |
| `C-ai-v143-tuning-002` | C | ai-v143-tuning-002 | 3/0 | runner | `continue_chain_to_access` | runner/trash_accessed_card | 159 | 0 |
| `C-ai-v143-tuning-004` | C | ai-v143-tuning-004 | 2/3 | mixed | `corp_late_gain_credit_real_rez_or_protection_reserve` | corp/rez_ice | 105 | 54 |
| `C-ai-v143-tuning-005` | C | ai-v143-tuning-005 | 3/0 | runner | `runner_late_gain_credit_real_reserve` | runner/resolve_choice | 155 | 4 |
| `C-ai-v143-tuning-006` | C | ai-v143-tuning-006 | 6/4 | runner | `runner_late_gain_credit_real_reserve` | runner/activated_card_ability | 156 | 3 |
| `C-ai-v143-tuning-007` | C | ai-v143-tuning-007 | 0/3 | mixed | `corp_late_gain_credit_real_rez_or_protection_reserve` | corp/mandatory_draw | 123 | 36 |
| `C-ai-v143-tuning-008` | C | ai-v143-tuning-008 | 2/0 | runner | `run_microstep_required` | runner/end_turn | 152 | 7 |
| `D-ai-v143-tuning-003` | D | ai-v143-tuning-003 | 6/2 | runner | `continue_chain_to_access` | runner/break_subroutine | 153 | 6 |
| `D-ai-v143-tuning-004` | D | ai-v143-tuning-004 | 6/3 | runner | `runner_late_gain_credit_real_reserve` | corp/end_turn | 117 | 42 |
| `D-ai-v143-tuning-006` | D | ai-v143-tuning-006 | 0/0 | mixed | `corp_late_gain_credit_no_safe_alternative` | runner/gain_credit | 22 | 137 |
| `D-ai-v143-tuning-008` | D | ai-v143-tuning-008 | 0/2 | runner | `continue_chain_to_access` | corp/end_turn | 142 | 17 |
| `D-ai-v143-tuning-010` | D | ai-v143-tuning-010 | 6/1 | runner | `continue_chain_to_access` | runner/gain_credit | 101 | 58 |

## Schlüsse

- Der weitere Optimierungsblock muss outcome- und zielbezogen arbeiten; die Top-Ursachen sind heterogen genug, dass ein pauschaler Malus wieder zu Seiteneffekten führen würde.
- Runner-Reserve- und Coverage-Fälle müssen über konkrete Progress-Fenster getrennt werden, nicht über den ausgewählten Action-Typ allein.
- Corp-Economy-Endfenster bleiben ohne side-safe Score-/Protection-Evidence keine robuste Runtime-Fix-Basis.

## Artefakt

- `docs/reviews/ai/ai131-x10-action-limit-failure-corpus-2026-06-12.json`

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai131-x10-action-limit-failure-corpus.ts`
- `git diff --check`
