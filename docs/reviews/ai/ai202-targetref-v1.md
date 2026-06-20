# AI202 TargetRef v1

Datum: 2026-06-14

Branch: `codex/ai201-ai212-witness-proof`

## Ziel

AI202 macht TargetIdentity als `TargetRef v1` first-class. Der Vertrag ersetzt keine Engine-Legalitaet, sondern beschreibt bereits vorhandene oder Candidate-path-Ziele side-safe und replay-vorbereitend.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| CandidatePathBindings | 103 |
| TargetRefs complete/irrelevant | 33 |
| TargetRefs blocked | 70 |
| Hidden-blocked | 0 |
| AI183/AI184 Kandidaten | 9 |
| AI183/AI184 complete/irrelevant | 8 |
| Redaction safe | 1 |

## AI183/AI184 Kandidaten

| Quelle | Case | Familie | Action | Identity v2 | TargetRef | Vollstaendig | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AI173 | `A-ai-v143-tuning-009` | `runner_coverage` | `install_card` | `installedOwnCard:actorKnownRef:wall_of_static` | `ownInstalled:actorKnownRef:wall_of_static` | yes | none |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `resolve_choice` | `choice:unknown` | `choice:unknown` | no | `choice_option_missing` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `gain_credit` | `none` | `none` | yes | none |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `draw_card` | `none` | `none` | yes | none |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `install_card` | `installedOwnCard:actorKnownRef:wall_of_static` | `ownInstalled:actorKnownRef:wall_of_static` | yes | none |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `end_turn` | `none` | `none` | yes | none |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `advance_card` | `installedOwnCard:actorKnownRef:corporate_war` | `ownInstalled:actorKnownRef:corporate_war` | yes | none |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `draw_card` | `none` | `none` | yes | none |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `end_turn` | `none` | `none` | yes | none |

## Redaction-Regeln

| Regel |
| --- |
| server targets use public server ids only |
| ice targets use public server id plus position, not card instance ids |
| ownInstalled targets use actor-safe refs only |
| choice targets require side-safe choice and option ids |
| access targets use server plus access context, not hidden card identity |
| abilitySource targets use side-safe source definition id and ability id |
| hidden targets become hidden_blocked |
| unprojected targets become unknown_unprojected with a blocker |

## Blocker

| Blocker | Count |
| --- | ---: |
| `choice_option_missing` | 2 |
| `server_target_missing` | 6 |
| `target_blocked_by_hard_gate` | 60 |
| `target_identity_unresolved` | 2 |

## Schluss

TargetRef v1 deckt Server-, ICE-, actor-known-, Choice-, Access- und AbilitySource-Ziele strukturiert ab. Die drei frueheren AI183/AI184-Kandidaten erhalten entweder einen vollstaendigen `TargetRef` oder einen praezisen Blocker; die haeufigsten Restblocker bleiben hard-gate- und server-/choice-bezogene fehlende Zielprojektionen.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai202-targetref-v1.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/target-ref.test.ts src/legalaction-witness.test.ts`
- `corepack pnpm --filter @netgrid/ai run typecheck`
- `git diff --check`
