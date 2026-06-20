# AI192 TargetIdentity v2 fÃ¼r Candidate-Pfade

Datum: 2026-06-14

Branch: `codex/ai191-ai200-binding-replay-proof`

## Ziel

AI192 wertet die AI191-`CandidatePathBinding`-EintrÃ¤ge mit einem Candidate-spezifischen TargetIdentity-v2-Vertrag aus. Der Resolver leitet nur aus bereits redigierter Snapshot-/Binding-Evidence ab und blockiert fehlende Server-, Choice- oder Hidden-Info-Ziele weiter.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| CandidatePathBindings | 103 |
| vollstÃ¤ndig oder irrelevant | 33 |
| vollstÃ¤ndig | 12 |
| irrelevant | 21 |
| hidden-info-blockiert | 0 |
| unresolved-blockiert | 70 |
| PlayerAction-Ziel erforderlich | 82 |
| candidate-path ready for PlayerAction | 21 |
| AI177 complete/irrelevant | 8 |

## AI177-Kandidaten

| Quelle | Case | Familie | Action | Vorher | TargetIdentity v2 | Status | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AI173 | `A-ai-v143-tuning-009` | `runner_coverage` | `install_card` | `unknown_target` | `installedOwnCard:actorKnownRef:wall_of_static` | `complete` | none |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `resolve_choice` | `choice:unknown` | `choice:unknown` | `blocked_unresolved` | `choice_option_missing` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `gain_credit` | `none` | `none` | `irrelevant` | none |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `draw_card` | `none` | `none` | `irrelevant` | none |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `install_card` | `unknown_target` | `installedOwnCard:actorKnownRef:wall_of_static` | `complete` | none |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `end_turn` | `none` | `none` | `irrelevant` | none |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `advance_card` | `unknown_target` | `installedOwnCard:actorKnownRef:corporate_war` | `complete` | none |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `draw_card` | `none` | `none` | `irrelevant` | none |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `end_turn` | `none` | `none` | `irrelevant` | none |

## Blocker

| Blocker | Count |
| --- | ---: |
| `choice_option_missing` | 2 |
| `server_target_missing` | 6 |
| `target_blocked_by_hard_gate` | 60 |
| `target_identity_unresolved_from_snapshot` | 2 |

## Schluss

TargetIdentity v2 erhÃ¶ht die fachliche PrÃ¤zision: No-target-Aktionen werden als `none` erkannt und actor-known Kartenpfade kÃ¶nnen aus redigierten `sourceDefinitionId`-Werten beschrieben werden. FÃ¼r echte Run-/Choice-Candidate-Pfade bleiben fehlende Server- und Option-IDs blockierend. Es gibt weiterhin keine Runtime-Wirkung.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai192-target-identity-v2-candidate-paths.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/target-identity-resolver.test.ts`
- `corepack pnpm --filter @netgrid/ai run typecheck`
- `git diff --check`
