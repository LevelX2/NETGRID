# AI186 Coverage Candidate Signature Review

Datum: 2026-06-13

Branch: `codex/ai181-ai190-signature-proof`

## Ziel

AI186 prüft alle 13 Runner-Coverage-Fälle aus AI173 mit SemanticActionSignature und TargetIdentity.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Coverage-Fälle | 13 |
| Gate-positive Fälle | 0 |
| blockiert | 13 |
| Fälle mit Coverage-Signatur | 9 |
| Fälle mit TargetIdentity-Pass | 0 |

## Fälle

| Case | Pfad | Coverage-Alternativen | Signaturen | TargetIdentity | HardGates | Gate | Blocker |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| `A-ai-v143-tuning-006` | `no_solution_visible` | 0 | 0 | 0 | 0 | `blocked` | none |
| `A-ai-v143-tuning-009` | `visible_installable_solution` | 1 | 1 | 0 | 1 | `blocked` | `target_identity_unresolved_from_snapshot` |
| `B-ai-v143-tuning-006` | `draw_solution` | 3 | 3 | 0 | 0 | `blocked` | `target_blocked_by_hard_gate` |
| `B-ai-v143-tuning-008` | `draw_solution` | 2 | 2 | 0 | 1 | `blocked` | `target_blocked_by_hard_gate`, `target_identity_unresolved_from_snapshot` |
| `B-ai-v143-tuning-009` | `draw_solution` | 3 | 3 | 0 | 0 | `blocked` | `target_blocked_by_hard_gate` |
| `C-ai-v143-tuning-001` | `draw_solution` | 2 | 2 | 0 | 0 | `blocked` | `target_blocked_by_hard_gate` |
| `C-ai-v143-tuning-005` | `visible_installable_solution` | 2 | 2 | 0 | 0 | `blocked` | `target_blocked_by_hard_gate` |
| `C-ai-v143-tuning-006` | `no_solution_visible` | 0 | 0 | 0 | 0 | `blocked` | none |
| `C-ai-v143-tuning-008` | `visible_installable_solution` | 0 | 0 | 0 | 0 | `blocked` | none |
| `D-ai-v143-tuning-003` | `visible_installable_solution` | 6 | 6 | 0 | 1 | `blocked` | `server_target_missing`, `target_blocked_by_hard_gate` |
| `D-ai-v143-tuning-004` | `draw_solution` | 3 | 3 | 0 | 1 | `blocked` | `server_target_missing`, `target_blocked_by_hard_gate` |
| `D-ai-v143-tuning-008` | `visible_installable_solution` | 4 | 4 | 0 | 1 | `blocked` | `server_target_missing`, `target_blocked_by_hard_gate` |
| `D-ai-v143-tuning-010` | `no_solution_visible` | 0 | 0 | 0 | 0 | `blocked` | none |

## Schluss

Der frühere Coverage-Kandidat bleibt blockiert. Signaturen existieren für Coverage-Alternativen, aber die TargetIdentity ist für den candidate-path nicht stabil genug. Es wird kein generischer Draw-, Credit- oder Coverage-Malus abgeleitet.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai186-coverage-candidate-signature-review.ts`
- `git diff --check`
