# AI118 Corp Ability Alternative Evidence

Datum: 2026-06-12

Branch: `codex/ai115-ai122-residual-action-limit-evidence-sweep`

## Ziel

AI118 prüft den Corp-No-Safe-Alternative-Fall aus Pair D / `ai-v143-tuning-004` nicht als Fix, sondern als Semantik-Gap: Welche `activated_card_ability` stand wirklich als Alternative bereit, und ist sie Scoreline-, Protection- oder Tempo-Fortschritt?

## Artefakt

Detail:

- `docs/reviews/ai/ai118-corp-ability-alternative-evidence-detail-2026-06-12.json`

## Befund

In allen relevanten Corp-Credit-Fenstern steht dieselbe Ability-Alternative bereit:

| Action | Turn | Gewählt | Ability-Alternative | Rank | Score | Einstufung |
| ---: | ---: | --- | --- | ---: | ---: | --- |
| 118 | 15 | `gain_credit` | `Corporate Boon` | 2 | 6200 | `economy_only` |
| 131 | 17 | `gain_credit` | `Corporate Boon` | 2 | 6200 | `economy_only` |
| 132 | 17 | `gain_credit` | `Corporate Boon` | 2 | 6200 | `economy_only` |
| 133 | 17 | `gain_credit` | `Corporate Boon` | 2 | 6200 | `economy_only` |
| 142 | 19 | `gain_credit` | `Corporate Boon` | 2 | 6200 | `economy_only` |
| 143 | 19 | `gain_credit` | `Corporate Boon` | 2 | 6200 | `economy_only` |
| 157 | 21 | `gain_credit` | `Corporate Boon` | 2 | 6200 | `economy_only` |
| 158 | 21 | `gain_credit` | `Corporate Boon` | 2 | 6200 | `economy_only` |

Zusätzlich erscheint punktuell `Chance Observation` als `play_operation`, aber ebenfalls ohne dokumentierte Scoreline-, Remote-Protection- oder Rez-/ICE-Fortschrittsevidence.

## Klassifikation

- `Corporate Boon`: `economy_only`
- `Chance Observation`: `opaque_no_progress` für diesen Endfensterkontext

Nicht belegt:

- `scoreline_progress`
- `remote_protection`
- `rez_or_ice_progress`

## Schlussfolgerung

AI118 bestätigt die AI110-Entscheidung. Der Corp-Fall bleibt `corp_late_gain_credit_no_safe_alternative`; er ist kein enger Runtime-Fix-Kandidat für AI121.

Ein späterer Fix wäre erst vertretbar, wenn eine Ability-Alternative öffentlich/side-safe als Scoreline-, Protection- oder Rez-/ICE-Fortschritt klassifiziert ist. `Corporate Boon` ist hier nur eine Economy-Alternative und darf nicht als sichere Tempo-Aktion gegen Basic-Credit bevorzugt werden.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/ai118-generate-corp-ability.test.ts` temporär zur Artefakterzeugung
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`
