# AI132 Progress Delta Labeler Review

Datum: 2026-06-12

Branch: `codex/ai131-ai139-semantic-endwindow-optimization`

## Ziel

AI132 klassifiziert jede Action im AI131-x10-Endfenster mit einem Progress- oder No-Progress-Label und ergänzt 5/10/20-Action-Follow-up-Fenster. Das Paket bleibt shadow-only.

## Methode

- Quelle: `docs/reviews/ai/ai131-x10-action-limit-failure-corpus-2026-06-12.json`
- Schema: `ai132-progress-delta-labels-v1`
- Git Head: `82deec6d`
- Direkte Progress-Labels: Access, Trash, Steal, Score, Flatline, Coverage-Install, Reachability und Server-Protection.
- Economy wird nur als `progress_economy_converted` gezählt, wenn im 20-Action-Follow-up ein direkter Progress-Schritt sichtbar ist.
- Reserve-, Coverage-, Protection- und Affordability-Signale bleiben `no_progress_plausible`, wenn sie nicht direkt konvertieren.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Fälle | 21 |
| gelabelte Actions | 1260 |
| direkte/konvertierte Progress-Actions | 670 |
| stale No-Progress-Actions | 415 |
| stale Anteil | 0.3294 |
| Redaction-safe | 1 |

## Labelverteilung

| Label | Actions |
| --- | ---: |
| `no_progress_stale` | 415 |
| `progress_economy_converted` | 286 |
| `progress_reachability_improved` | 184 |
| `no_progress_plausible` | 175 |
| `progress_coverage_install` | 85 |
| `progress_access` | 47 |
| `progress_server_protected` | 26 |
| `progress_trash` | 18 |
| `progress_score` | 14 |
| `progress_steal` | 10 |

## Fälle

| Case | dominanter Subcluster | Labels im Endfenster | Terminal-Label |
| --- | --- | --- | --- |
| `A-ai-v143-tuning-006` | `continue_chain_to_access` | no_progress_stale:22, progress_economy_converted:19, no_progress_plausible:8, progress_reachability_improved:6, progress_coverage_install:3, progress_server_protected:1, progress_steal:1 | corp/advance_card -> `no_progress_stale` |
| `A-ai-v143-tuning-008` | `corp_late_gain_credit_real_rez_or_protection_reserve` | no_progress_stale:20, progress_economy_converted:11, no_progress_plausible:9, progress_coverage_install:8, progress_reachability_improved:6, progress_access:2, progress_server_protected:2, progress_steal:1, progress_trash:1 | runner/continue_run -> `progress_reachability_improved` |
| `A-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | no_progress_stale:21, progress_economy_converted:16, no_progress_plausible:8, progress_reachability_improved:7, progress_access:3, progress_trash:3, progress_server_protected:2 | corp/decline_rez -> `no_progress_plausible` |
| `B-ai-v143-tuning-001` | `corp_late_gain_credit_real_rez_or_protection_reserve` | no_progress_stale:27, progress_economy_converted:14, progress_reachability_improved:11, no_progress_plausible:4, progress_access:2, progress_score:1, progress_trash:1 | corp/resolve_choice -> `no_progress_stale` |
| `B-ai-v143-tuning-003` | `corp_late_gain_credit_real_rez_or_protection_reserve` | no_progress_stale:21, progress_economy_converted:13, no_progress_plausible:10, progress_reachability_improved:7, progress_coverage_install:6, progress_server_protected:3 | runner/pump_breaker -> `progress_reachability_improved` |
| `B-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | no_progress_plausible:20, no_progress_stale:20, progress_economy_converted:15, progress_access:1, progress_coverage_install:1, progress_reachability_improved:1, progress_server_protected:1, progress_trash:1 | runner/end_turn -> `no_progress_plausible` |
| `B-ai-v143-tuning-006` | `continue_chain_to_access` | no_progress_stale:17, progress_economy_converted:16, progress_reachability_improved:13, no_progress_plausible:8, progress_coverage_install:3, progress_access:2, progress_steal:1 | runner/continue_run -> `progress_reachability_improved` |
| `B-ai-v143-tuning-008` | `runner_late_gain_credit_real_reserve` | progress_economy_converted:21, no_progress_stale:17, no_progress_plausible:11, progress_coverage_install:4, progress_access:2, progress_reachability_improved:2, progress_trash:2, progress_server_protected:1 | runner/gain_credit -> `no_progress_plausible` |
| `B-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | no_progress_stale:22, progress_economy_converted:15, no_progress_plausible:10, progress_reachability_improved:4, progress_access:2, progress_score:2, progress_server_protected:2, progress_trash:2, progress_coverage_install:1 | corp/gain_credit -> `no_progress_stale` |
| `C-ai-v143-tuning-001` | `runner_late_gain_credit_real_reserve` | no_progress_stale:22, progress_economy_converted:16, no_progress_plausible:8, progress_reachability_improved:4, progress_access:3, progress_coverage_install:3, progress_trash:2, progress_score:1, progress_steal:1 | corp/advance_card -> `no_progress_stale` |
| `C-ai-v143-tuning-002` | `continue_chain_to_access` | progress_reachability_improved:18, progress_economy_converted:14, no_progress_stale:11, no_progress_plausible:7, progress_coverage_install:4, progress_access:2, progress_server_protected:2, progress_trash:2 | runner/trash_accessed_card -> `progress_trash` |
| `C-ai-v143-tuning-004` | `corp_late_gain_credit_real_rez_or_protection_reserve` | no_progress_stale:20, progress_economy_converted:17, progress_reachability_improved:9, no_progress_plausible:8, progress_coverage_install:3, progress_server_protected:2, progress_score:1 | corp/rez_ice -> `progress_server_protected` |
| `C-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | progress_economy_converted:21, no_progress_stale:20, no_progress_plausible:8, progress_coverage_install:6, progress_server_protected:2, progress_access:1, progress_reachability_improved:1, progress_trash:1 | runner/resolve_choice -> `no_progress_plausible` |
| `C-ai-v143-tuning-006` | `runner_late_gain_credit_real_reserve` | no_progress_stale:17, progress_coverage_install:14, no_progress_plausible:10, progress_economy_converted:9, progress_reachability_improved:6, progress_score:2, progress_access:1, progress_steal:1 | runner/activated_card_ability -> `progress_coverage_install` |
| `C-ai-v143-tuning-007` | `corp_late_gain_credit_real_rez_or_protection_reserve` | no_progress_stale:21, progress_coverage_install:21, no_progress_plausible:6, progress_economy_converted:6, progress_server_protected:2, progress_access:1, progress_reachability_improved:1, progress_score:1, progress_trash:1 | corp/mandatory_draw -> `no_progress_stale` |
| `C-ai-v143-tuning-008` | `run_microstep_required` | no_progress_stale:17, progress_reachability_improved:11, no_progress_plausible:9, progress_economy_converted:9, progress_access:6, progress_server_protected:3, progress_coverage_install:2, progress_trash:2, progress_steal:1 | runner/end_turn -> `no_progress_plausible` |
| `D-ai-v143-tuning-003` | `continue_chain_to_access` | progress_reachability_improved:27, no_progress_stale:20, progress_access:5, progress_economy_converted:3, progress_steal:3, progress_score:2 | runner/break_subroutine -> `progress_reachability_improved` |
| `D-ai-v143-tuning-004` | `runner_late_gain_credit_real_reserve` | no_progress_stale:20, progress_economy_converted:16, progress_reachability_improved:12, progress_access:6, no_progress_plausible:4, progress_score:2 | corp/end_turn -> `no_progress_stale` |
| `D-ai-v143-tuning-006` | `corp_late_gain_credit_no_safe_alternative` | no_progress_stale:19, progress_economy_converted:15, no_progress_plausible:11, progress_reachability_improved:7, progress_coverage_install:6, progress_server_protected:2 | runner/gain_credit -> `no_progress_plausible` |
| `D-ai-v143-tuning-008` | `continue_chain_to_access` | no_progress_stale:24, progress_reachability_improved:16, progress_economy_converted:10, no_progress_plausible:4, progress_access:4, progress_score:2 | corp/end_turn -> `no_progress_stale` |
| `D-ai-v143-tuning-010` | `continue_chain_to_access` | no_progress_stale:17, progress_reachability_improved:15, no_progress_plausible:12, progress_economy_converted:10, progress_access:4, progress_server_protected:1, progress_steal:1 | runner/gain_credit -> `no_progress_plausible` |

## Schlüsse

- AI132 trennt notwendige Run-Mikroschritte und sichtbaren Progress klar von echten stale Endfenster-Aktionen.
- Economy ist nicht automatisch Fortschritt; sie wird nur bei späterer sichtbarer Konversion als `progress_economy_converted` markiert.
- Das Labelset ist geeignet, AI133-AI136 mit Ziel- und Alternativbewertung zu speisen, ohne Runtime-Verhalten zu ändern.

## Artefakt

- `docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json`

## Verifikation

- `corepack pnpm --filter @netgrid/ai test -- progress-delta-labeler`
- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai132-progress-delta-labels.ts`
- `git diff --check`
