# AI140 Same-State Challenger Proof

Datum: 2026-06-12

Branch: `codex/ai140-ai148-semantic-endgame-optimization`

## Ziel

AI140 prüft die 17 AI136-Verbesserungskandidaten gegen opt-in same-state Alternative-Snapshots. Ein historischer Challenger zählt nur dann als Cutover-tauglich, wenn am exakten Legacy-Entscheidungspunkt eine passende LegalAction-Alternative mit besserem Progress-Delta sichtbar ist.

## Methode

- AI136 liefert die historischen Verbesserungskandidaten.
- Der vollständige x10-Alternative-Probe `ai140-same-state-alternative-probe-2026-06-12.json` liefert redaction-safe Alternative-Snapshots.
- Geprüft wird nur `actionIndex === legacySelected.actionIndex`.
- Es wird keine Runtime-Entscheidung verändert.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| AI136-Verbesserungskandidaten | 17 |
| same-state Alternative matched | 0 |
| same-state legal better | 0 |
| missing target context | 0 |
| Redaction-safe | 1 |

## Kategorien

| Kategorie | Fälle |
| --- | ---: |
| `historical_only_not_legal_now` | 17 |

## Kandidaten

| Case | Subcluster | Legacy | historischer Challenger | same-state Snapshot | same-state Match | Kategorie | TargetContext |
| --- | --- | --- | --- | ---: | ---: | --- | --- |
| `A-ai-v143-tuning-006` | `continue_chain_to_access` | corp/advance_card/`no_progress_stale` | runner/continue_run/`progress_reachability_improved` | 1 | 0 | `historical_only_not_legal_now` | `scoreline_relevant` |
| `A-ai-v143-tuning-008` | `corp_late_gain_credit_real_rez_or_protection_reserve` | runner/continue_run/`progress_reachability_improved` | corp/rez_ice/`progress_server_protected` | 1 | 0 | `historical_only_not_legal_now` | `reachability_relevant` |
| `A-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | corp/decline_rez/`no_progress_plausible` | runner/trash_accessed_card/`progress_trash` | 1 | 0 | `historical_only_not_legal_now` | `protection_relevant` |
| `B-ai-v143-tuning-001` | `corp_late_gain_credit_real_rez_or_protection_reserve` | corp/resolve_choice/`no_progress_stale` | runner/trash_accessed_card/`progress_trash` | 1 | 0 | `historical_only_not_legal_now` | `protection_relevant` |
| `B-ai-v143-tuning-003` | `corp_late_gain_credit_real_rez_or_protection_reserve` | runner/pump_breaker/`progress_reachability_improved` | corp/rez_ice/`progress_server_protected` | 1 | 0 | `historical_only_not_legal_now` | `coverage_relevant` |
| `B-ai-v143-tuning-006` | `continue_chain_to_access` | runner/continue_run/`progress_reachability_improved` | runner/access_card/`progress_access` | 1 | 0 | `historical_only_not_legal_now` | `reachability_relevant` |
| `B-ai-v143-tuning-008` | `runner_late_gain_credit_real_reserve` | runner/gain_credit/`no_progress_plausible` | runner/install_card/`progress_coverage_install` | 1 | 0 | `historical_only_not_legal_now` | `scoreline_relevant` |
| `B-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | corp/gain_credit/`no_progress_stale` | runner/trash_accessed_card/`progress_trash` | 1 | 0 | `historical_only_not_legal_now` | `reachability_relevant` |
| `C-ai-v143-tuning-001` | `runner_late_gain_credit_real_reserve` | corp/advance_card/`no_progress_stale` | runner/steal_agenda/`progress_steal` | 1 | 0 | `historical_only_not_legal_now` | `scoreline_relevant` |
| `C-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | runner/resolve_choice/`no_progress_plausible` | runner/trash_accessed_card/`progress_trash` | 1 | 0 | `historical_only_not_legal_now` | `protection_relevant` |
| `C-ai-v143-tuning-006` | `runner_late_gain_credit_real_reserve` | runner/activated_card_ability/`progress_coverage_install` | runner/steal_agenda/`progress_steal` | 1 | 0 | `historical_only_not_legal_now` | `reachability_relevant` |
| `C-ai-v143-tuning-007` | `corp_late_gain_credit_real_rez_or_protection_reserve` | corp/mandatory_draw/`no_progress_stale` | runner/activated_card_ability/`progress_coverage_install` | 1 | 0 | `historical_only_not_legal_now` | `reachability_relevant` |
| `C-ai-v143-tuning-008` | `run_microstep_required` | runner/end_turn/`no_progress_plausible` | runner/access_card/`progress_access` | 1 | 0 | `historical_only_not_legal_now` | `reachability_relevant` |
| `D-ai-v143-tuning-003` | `continue_chain_to_access` | runner/break_subroutine/`progress_reachability_improved` | corp/score_agenda/`progress_score` | 1 | 0 | `historical_only_not_legal_now` | `reachability_relevant` |
| `D-ai-v143-tuning-004` | `runner_late_gain_credit_real_reserve` | corp/end_turn/`no_progress_stale` | runner/access_card/`progress_access` | 1 | 0 | `historical_only_not_legal_now` | `reachability_relevant` |
| `D-ai-v143-tuning-008` | `continue_chain_to_access` | corp/end_turn/`no_progress_stale` | corp/score_agenda/`progress_score` | 1 | 0 | `historical_only_not_legal_now` | `reachability_relevant` |
| `D-ai-v143-tuning-010` | `continue_chain_to_access` | runner/gain_credit/`no_progress_plausible` | runner/access_card/`progress_access` | 1 | 0 | `historical_only_not_legal_now` | `scoreline_relevant` |

## Schluss

AI140 belegt keine produktionsreife same-state Cutover-Freigabe. Die meisten AI136-Verbesserungen bleiben historische Hinweise oder haben am exakten Legacy-Entscheidungspunkt keinen passenden Alternative-Snapshot. Diese Fälle werden in AI141 nach TargetContext-Gaps weiter geprüft.

## Artefakte

- `docs/reviews/ai/ai140-same-state-alternative-probe-2026-06-12.json`
- `docs/reviews/ai/ai140-same-state-challenger-proof-2026-06-12.json`

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai140-same-state-alternative-probe-2026-06-12.json --seeds ai-v143-tuning-001,ai-v143-tuning-002,ai-v143-tuning-003,ai-v143-tuning-004,ai-v143-tuning-005,ai-v143-tuning-006,ai-v143-tuning-007,ai-v143-tuning-008,ai-v143-tuning-009,ai-v143-tuning-010 --max-actions 160 --max-findings 80 --include-action-alternatives --max-alternatives-per-finding 8`
- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai140-same-state-challenger-proof.ts`
- `git diff --check`
