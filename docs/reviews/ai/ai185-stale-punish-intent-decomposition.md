# AI185 Stale Punish Intent Decomposition

Datum: 2026-06-13

Branch: `codex/ai181-ai190-signature-proof`

## Ziel

AI185 zerlegt den größten stale Intent-Cluster `corp.convert_tag_to_punish` in konkrete Ursachen.

## Punish-Semantik

On-Call Solo Team, Strike Force Kali, Scorched Earth, Urban Renewal und Solo Squad sind nur bei tatsächlich getaggtem Runner echte Punish-Payoffs. Ohne Tagfenster oder sichtbaren/legalen Payoff darf daraus kein generischer Punish-Bonus und kein Economy-Malus abgeleitet werden.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Fälle | 20 |
| Fälle mit Tagfenster-Evidence | 14 |
| Fälle mit sichtbarem Punish-Payoff | 0 |
| Scoreline-Ersatzfälle | 2 |
| Protection-Ersatzfälle | 4 |

| Root Cause | Fälle |
| --- | ---: |
| `missing_punish_payoff` | 11 |
| `missing_tag_window` | 6 |
| `protection_should_replace` | 1 |
| `scoreline_should_replace` | 2 |

## Fälle

| Case | Stale Count | Tagfenster | Payoff sichtbar | Scoreline besser | Protection besser | Root Cause |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `B-ai-v143-tuning-005` | 20 | 0 | 0 | 0 | 0 | `missing_tag_window` |
| `D-ai-v143-tuning-010` | 12 | 1 | 0 | 0 | 0 | `missing_punish_payoff` |
| `B-ai-v143-tuning-008` | 11 | 1 | 0 | 0 | 0 | `missing_punish_payoff` |
| `D-ai-v143-tuning-006` | 11 | 0 | 0 | 0 | 0 | `missing_tag_window` |
| `B-ai-v143-tuning-003` | 10 | 0 | 0 | 0 | 1 | `missing_tag_window` |
| `B-ai-v143-tuning-009` | 10 | 1 | 0 | 0 | 0 | `missing_punish_payoff` |
| `C-ai-v143-tuning-006` | 10 | 1 | 0 | 0 | 0 | `missing_punish_payoff` |
| `A-ai-v143-tuning-008` | 9 | 0 | 0 | 0 | 1 | `missing_tag_window` |
| `C-ai-v143-tuning-008` | 9 | 1 | 0 | 1 | 0 | `scoreline_should_replace` |
| `A-ai-v143-tuning-006` | 8 | 1 | 0 | 0 | 0 | `missing_punish_payoff` |
| `A-ai-v143-tuning-009` | 8 | 1 | 0 | 0 | 0 | `missing_punish_payoff` |
| `B-ai-v143-tuning-006` | 8 | 1 | 0 | 0 | 0 | `missing_punish_payoff` |
| `C-ai-v143-tuning-001` | 8 | 1 | 0 | 0 | 0 | `missing_punish_payoff` |
| `C-ai-v143-tuning-004` | 8 | 0 | 0 | 0 | 1 | `missing_tag_window` |
| `C-ai-v143-tuning-005` | 8 | 1 | 0 | 0 | 0 | `missing_punish_payoff` |
| `C-ai-v143-tuning-002` | 7 | 0 | 0 | 0 | 0 | `missing_tag_window` |
| `C-ai-v143-tuning-007` | 6 | 1 | 0 | 0 | 1 | `protection_should_replace` |
| `B-ai-v143-tuning-001` | 4 | 1 | 0 | 1 | 0 | `scoreline_should_replace` |
| `D-ai-v143-tuning-004` | 4 | 1 | 0 | 0 | 0 | `missing_punish_payoff` |
| `D-ai-v143-tuning-008` | 4 | 1 | 0 | 0 | 0 | `missing_punish_payoff` |

## Schluss

Der Cluster ist kein Runtime-Punish-Kandidat. Die dominierenden Ursachen sind fehlende Payoffs, fehlende Tagfenster und bessere Scoreline-/Protection-Ersatzpfade. Das stützt weiter ein No-Go für generische Punish-Gewichte.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai185-stale-punish-intent-decomposition.ts`
- `git diff --check`
