# AI123 x10 Residual Cluster Inventory

Datum: 2026-06-12

Branch: `codex/ai123-ai130-x10-residual-action-limit-sweep`

## Ziel

AI123 inventarisiert die 21 Action-Limit-Spiele aus dem A-D-x10-Korpus einzeln. Es nimmt keine Runtime-Änderung vor.

## Quelle und Methode

- Basisbefund: `docs/reviews/ai/ai120-residual-action-limit-a-d-10seed-2026-06-12.json`
- Reproduktion: Pair A-D, Seeds `ai-v143-tuning-001` bis `ai-v143-tuning-010`
- Max Actions: 160
- Offizielle Subcluster stammen aus dem bestehenden Trace-Mining-Classifier je Pair/Seed.
- Der zweite Subcluster, Dominanz und Action-Klassen werden aus dem letzten 60-Action-Endfenster abgeleitet.

## Gesamtergebnis

| Metrik | Wert |
| --- | ---: |
| Spiele | 40 |
| Action-Limit-Spiele | 21 |
| Neue Action-Limit-Fälle in Seeds 006-010 | 12 |

## x10 Subcluster gesamt

| Subcluster | Spiele |
| --- | ---: |
| `runner_late_gain_credit_real_reserve` | 9 |
| `corp_late_gain_credit_real_rez_or_protection_reserve` | 3 |
| `run_microstep_required` | 3 |
| `corp_late_gain_credit_no_safe_alternative` | 2 |
| `break_pump_required` | 1 |
| `continue_chain_to_access` | 1 |
| `late_draw_for_coverage_or_hand_goal` | 1 |
| `late_draw_without_coverage_or_hand_goal` | 1 |

## x10 Subcluster pro Pair

| Pair | Subcluster | Spiele |
| --- | --- | ---: |
| A | `late_draw_without_coverage_or_hand_goal` | 1 |
| A | `run_microstep_required` | 1 |
| A | `runner_late_gain_credit_real_reserve` | 1 |
| B | `runner_late_gain_credit_real_reserve` | 4 |
| B | `corp_late_gain_credit_real_rez_or_protection_reserve` | 2 |
| C | `runner_late_gain_credit_real_reserve` | 3 |
| C | `break_pump_required` | 1 |
| C | `corp_late_gain_credit_real_rez_or_protection_reserve` | 1 |
| C | `late_draw_for_coverage_or_hand_goal` | 1 |
| C | `run_microstep_required` | 1 |
| D | `corp_late_gain_credit_no_safe_alternative` | 2 |
| D | `continue_chain_to_access` | 1 |
| D | `run_microstep_required` | 1 |
| D | `runner_late_gain_credit_real_reserve` | 1 |

## Endfenster-Dominanz pro Seedbereich

| Seedbereich | Subcluster | Spiele |
| --- | --- | ---: |
| 001-005 | `runner_late_gain_credit_real_reserve` | 4 |
| 001-005 | `corp_late_gain_credit_real_rez_or_protection_reserve` | 3 |
| 001-005 | `continue_chain_to_access` | 2 |
| 006-010 | `continue_chain_to_access` | 4 |
| 006-010 | `runner_late_gain_credit_real_reserve` | 4 |
| 006-010 | `corp_late_gain_credit_real_rez_or_protection_reserve` | 2 |
| 006-010 | `corp_late_gain_credit_no_safe_alternative` | 1 |
| 006-010 | `run_microstep_required` | 1 |

## Endfenster-Dominanz gesamt

| Endfenster-Dominanz | Spiele |
| --- | ---: |
| `runner_late_gain_credit_real_reserve` | 8 |
| `continue_chain_to_access` | 6 |
| `corp_late_gain_credit_real_rez_or_protection_reserve` | 5 |
| `corp_late_gain_credit_no_safe_alternative` | 1 |
| `run_microstep_required` | 1 |

## Neue Fälle außerhalb x5

| Subcluster | Spiele |
| --- | ---: |
| `continue_chain_to_access` | 4 |
| `runner_late_gain_credit_real_reserve` | 4 |
| `corp_late_gain_credit_real_rez_or_protection_reserve` | 2 |
| `corp_late_gain_credit_no_safe_alternative` | 1 |
| `run_microstep_required` | 1 |

## Einzelinventar

| Pair | Seed | Punkte R/C | Dominanz | Dominanter Subcluster | Zweiter Subcluster | letzte Progress-Aktion | Action-Klassen im Endfenster |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| A | ai-v143-tuning-006 | 2/0 | runner | `continue_chain_to_access` | `corp_late_gain_credit_no_safe_alternative` | 159:corp/advance_card | Basic:9, Run:7, Ability:5, Draw:6, Install:9, Scoreline:2, Economy:14, Other:8 |
| A | ai-v143-tuning-008 | 5/2 | mixed | `corp_late_gain_credit_real_rez_or_protection_reserve` | `continue_chain_to_access` | 136:runner/trash_accessed_card | Basic:10, Run:10, Ability:8, Draw:3, Install:9, Scoreline:2, Economy:8, Other:10 |
| A | ai-v143-tuning-009 | 0/3 | mixed | `runner_late_gain_credit_real_reserve` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 157:runner/trash_accessed_card | Basic:8, Run:13, Ability:1, Install:7, Economy:16, Other:15 |
| B | ai-v143-tuning-001 | 0/6 | mixed | `corp_late_gain_credit_real_rez_or_protection_reserve` | `runner_late_gain_credit_without_funding_need` | 141:runner/trash_accessed_card | Basic:9, Run:14, Install:1, Scoreline:4, Economy:24, Other:8 |
| B | ai-v143-tuning-003 | 6/3 | mixed | `corp_late_gain_credit_real_rez_or_protection_reserve` | `runner_late_gain_credit_real_reserve` | 155:runner/install_card | Basic:9, Run:7, Ability:9, Draw:3, Install:6, Economy:10, Other:16 |
| B | ai-v143-tuning-005 | 0/0 | runner | `runner_late_gain_credit_real_reserve` | `corp_late_gain_credit_no_safe_alternative` | 134:runner/trash_accessed_card | Basic:11, Run:3, Ability:2, Draw:1, Install:3, Economy:28, Other:12 |
| B | ai-v143-tuning-006 | 3/3 | runner | `continue_chain_to_access` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 127:runner/install_card | Basic:8, Run:16, Draw:1, Install:9, Scoreline:1, Economy:15, Other:10 |
| B | ai-v143-tuning-008 | 3/0 | mixed | `runner_late_gain_credit_real_reserve` | `corp_late_gain_credit_no_safe_alternative` | 128:runner/trash_accessed_card | Basic:10, Run:6, Install:7, Economy:27, Other:10 |
| B | ai-v143-tuning-009 | 0/6 | mixed | `runner_late_gain_credit_real_reserve` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 143:runner/trash_accessed_card | Basic:10, Run:8, Ability:3, Install:3, Scoreline:3, Economy:22, Other:11 |
| C | ai-v143-tuning-001 | 5/3 | runner | `runner_late_gain_credit_real_reserve` | `access_pending` | 159:corp/advance_card | Basic:9, Run:10, Draw:2, Install:7, Scoreline:9, Economy:14, Other:9 |
| C | ai-v143-tuning-002 | 3/0 | runner | `continue_chain_to_access` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 159:runner/trash_accessed_card | Basic:7, Run:22, Draw:3, Install:6, Scoreline:2, Economy:11, Other:9 |
| C | ai-v143-tuning-004 | 2/3 | mixed | `corp_late_gain_credit_real_rez_or_protection_reserve` | `runner_late_gain_credit_real_reserve` | 105:corp/score_agenda | Basic:9, Run:9, Draw:5, Install:8, Scoreline:3, Economy:12, Other:14 |
| C | ai-v143-tuning-005 | 3/0 | runner | `runner_late_gain_credit_real_reserve` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 155:runner/trash_accessed_card | Basic:10, Run:3, Draw:4, Install:12, Economy:17, Other:14 |
| C | ai-v143-tuning-006 | 6/4 | runner | `runner_late_gain_credit_real_reserve` | `corp_late_gain_credit_real_rez_or_protection_reserve` | 156:runner/steal_agenda | Basic:9, Run:8, Ability:11, Install:7, Scoreline:6, Economy:9, Other:10 |
| C | ai-v143-tuning-007 | 0/3 | mixed | `corp_late_gain_credit_real_rez_or_protection_reserve` | `access_pending` | 123:runner/trash_accessed_card | Basic:11, Run:3, Ability:22, Install:4, Scoreline:5, Economy:6, Other:9 |
| C | ai-v143-tuning-008 | 2/0 | runner | `run_microstep_required` | `runner_late_gain_credit_real_reserve` | 152:runner/trash_accessed_card | Basic:8, Run:22, Ability:3, Install:5, Scoreline:1, Economy:9, Other:12 |
| D | ai-v143-tuning-003 | 6/2 | runner | `continue_chain_to_access` | `run_microstep_required` | 153:corp/advance_card | Basic:6, Run:35, Install:3, Scoreline:8, Economy:3, Other:5 |
| D | ai-v143-tuning-004 | 6/3 | runner | `runner_late_gain_credit_real_reserve` | `access_pending` | 117:corp/score_agenda | Basic:9, Run:18, Draw:1, Install:4, Scoreline:4, Economy:19, Other:5 |
| D | ai-v143-tuning-006 | 0/0 | mixed | `corp_late_gain_credit_no_safe_alternative` | `runner_late_gain_credit_real_reserve` | 22:runner/install_card | Basic:10, Run:7, Ability:3, Install:4, Economy:25, Other:11 |
| D | ai-v143-tuning-008 | 0/2 | runner | `continue_chain_to_access` | `runner_late_gain_credit_real_reserve` | 142:corp/score_agenda | Basic:9, Run:20, Draw:3, Install:4, Scoreline:4, Economy:13, Other:7 |
| D | ai-v143-tuning-010 | 6/1 | runner | `continue_chain_to_access` | `runner_late_gain_credit_real_reserve` | 101:runner/steal_agenda | Basic:8, Run:20, Install:2, Economy:17, Other:13 |

## Top-3-Restursachen

1. `runner_late_gain_credit_real_reserve` (9 Spiele): Runner economy dominates the residual set, but the trace flags mostly show reserve, coverage, or affordability pressure rather than a safe better action.
2. `corp_late_gain_credit_real_rez_or_protection_reserve` (3 Spiele): Corp economy windows remain tied to rez/protection reserve signals and need alternative evidence before runtime pressure.
3. `run_microstep_required` (3 Spiele): Several action limits terminate inside necessary run microflow; these are not obvious no-progress loops.

## Bewertung

- Der x10-Befund bleibt safety-orientiert: AI123 hat keine Runtime-Änderung vorgenommen.
- Die größte Restursache ist Runner-Reserve-Economy. Sie ist aber nicht automatisch ein Fehler, weil viele Endfenster Reserve-, Coverage- oder Affordability-Signale tragen.
- Die neuen Seeds 006-010 liefern zusätzliche Fälle und zeigen, dass der x5-Korpus den Rest nicht robust abdeckt.
- Direkte nächste Reviews: Pair-A-Late-Draw ohne Ziel (AI124), Runner-Reserve-Outcomes (AI125) und Corp-Endwindow-Economy (AI126).

## Artefakt

Detaildaten inklusive letzter 60 Actions je Action-Limit-Spiel:

- `docs/reviews/ai/ai123-x10-residual-cluster-inventory-2026-06-12.json`

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/analyze-ai123-x10-residual-clusters.ts`
- `git diff --check`
