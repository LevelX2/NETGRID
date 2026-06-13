# AI161 Coverage Path Solver v2

Datum: 2026-06-12

Branch: `codex/ai159-ai169-endgame-opportunity`

## Ziel

AI161 trennt Runner-Coverage-Fälle nach konkreten side-safe Pfadtypen. Kartenpfade wie Self-Modifying Code, Temple Microcode Outlet, The Short Circuit und klassische Breaker werden nur als sichtbare oder suchbare Pfadklassen dokumentiert; es wird nicht über unbekannte Stackinhalte geraten.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Coverage-Fälle | 15 |
| Assertions bestanden | 4/4 |
| Opportunity-Kandidaten | 10 |

## Pfadtypen

| Pfad | Fälle |
| --- | ---: |
| `economy_before_install` | 5 |
| `visible_installable_solution` | 10 |

## Assertions

| Test | Erwartet | Erhalten | Ergebnis |
| --- | --- | --- | --- |
| sichtbar installierbare Coverage > Credit | `visible_installable_solution` | `visible_installable_solution` | pass |
| Suchaktion > Draw bei side-safe Suchziel | `search_solution` | `search_solution` | pass |
| Credit korrekt bei Kostenpfad | `economy_before_install` | `economy_before_install` | pass |
| Draw korrekt ohne installierbare/suchbare Option | `draw_solution` | `draw_solution` | pass |

## Fälle

| Case | Subcluster | Missing ICE Type | Install | Search | Draw | Economy | Pfad | Beispiele | Opportunity |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- |
| `A-ai-v143-tuning-006` | `continue_chain_to_access` | `reachability` | 1 | 1 | 0 | 0 | `visible_installable_solution` | classic breaker or visible Proteus breaker install | `candidate_needs_opportunity_legal_snapshot` |
| `A-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | `unknown_or_mixed` | 0 | 0 | 0 | 1 | `economy_before_install` | credit only if install or run cost is concrete | `no_go_missing_snapshot` |
| `B-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | `unknown_or_mixed` | 1 | 0 | 0 | 0 | `visible_installable_solution` | classic breaker or visible Proteus breaker install | `candidate_needs_opportunity_legal_snapshot` |
| `B-ai-v143-tuning-006` | `continue_chain_to_access` | `reachability` | 1 | 1 | 0 | 0 | `visible_installable_solution` | classic breaker or visible Proteus breaker install | `candidate_needs_opportunity_legal_snapshot` |
| `B-ai-v143-tuning-008` | `runner_late_gain_credit_real_reserve` | `unknown_or_mixed` | 1 | 1 | 0 | 0 | `visible_installable_solution` | classic breaker or visible Proteus breaker install | `candidate_needs_opportunity_legal_snapshot` |
| `B-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | `unknown_or_mixed` | 1 | 1 | 0 | 0 | `visible_installable_solution` | classic breaker or visible Proteus breaker install | `candidate_needs_opportunity_legal_snapshot` |
| `C-ai-v143-tuning-001` | `runner_late_gain_credit_real_reserve` | `unknown_or_mixed` | 1 | 1 | 0 | 0 | `visible_installable_solution` | classic breaker or visible Proteus breaker install | `candidate_needs_opportunity_legal_snapshot` |
| `C-ai-v143-tuning-002` | `continue_chain_to_access` | `reachability` | 1 | 1 | 0 | 0 | `visible_installable_solution` | classic breaker or visible Proteus breaker install | `candidate_needs_opportunity_legal_snapshot` |
| `C-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | `unknown_or_mixed` | 1 | 1 | 0 | 0 | `visible_installable_solution` | classic breaker or visible Proteus breaker install | `candidate_needs_opportunity_legal_snapshot` |
| `C-ai-v143-tuning-006` | `runner_late_gain_credit_real_reserve` | `unknown_or_mixed` | 1 | 1 | 0 | 0 | `visible_installable_solution` | classic breaker or visible Proteus breaker install | `candidate_needs_opportunity_legal_snapshot` |
| `C-ai-v143-tuning-008` | `run_microstep_required` | `reachability` | 1 | 1 | 0 | 0 | `visible_installable_solution` | classic breaker or visible Proteus breaker install | `candidate_needs_opportunity_legal_snapshot` |
| `D-ai-v143-tuning-003` | `continue_chain_to_access` | `reachability` | 0 | 0 | 0 | 1 | `economy_before_install` | credit only if install or run cost is concrete | `no_go_missing_snapshot` |
| `D-ai-v143-tuning-004` | `runner_late_gain_credit_real_reserve` | `unknown_or_mixed` | 0 | 0 | 0 | 1 | `economy_before_install` | credit only if install or run cost is concrete | `no_go_missing_snapshot` |
| `D-ai-v143-tuning-008` | `continue_chain_to_access` | `reachability` | 0 | 0 | 0 | 1 | `economy_before_install` | credit only if install or run cost is concrete | `no_go_missing_snapshot` |
| `D-ai-v143-tuning-010` | `continue_chain_to_access` | `reachability` | 0 | 0 | 0 | 1 | `economy_before_install` | credit only if install or run cost is concrete | `no_go_missing_snapshot` |

## Schluss

Coverage-Pfade sind konkreter trennbar, aber AI159 zeigt keine verwertbaren Opportunity-LegalAction-Snapshots. Daher bleiben installierbare und suchbare Pfade Kandidaten für Fixture-Aufbau, nicht für Runtime-Cutover.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai161-coverage-path-solver-v2.ts`
- `git diff --check`
