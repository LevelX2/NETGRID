# AI039 TargetContext Projection

Datum: 2026-06-04
Primärer Agent: `release-implementation-agent`
Status: `done`
Scope: side-safe TargetContext aus explizit übergebenen Zielinformationen

## Kurzfazit

AI039 ergänzt `ActionTargetContext` im Builder. Zielkontext entsteht nur aus:

- `selectedTargetsByActionId`
- `availableTargetsByActionId`
- vorhandenen `LegalAction.targetRequirements`
- vorhandenen `LegalAction.choiceRequirements`

Der Builder rekonstruiert keine Zieloptionen aus Boardstate, `PlayerView`, Logs, Kartentexten oder Hidden Zones. Wenn die Engine nur Requirements, aber keine konkreten Ziele liefert, wird `target_context_unavailable` gesetzt.

## Statusregeln

| Fall | Ergebnis |
| --- | --- |
| Ausgewählte Ziele liegen side-safe vor | `selectedTargets` wird gefüllt, `availableTargetsStatus: "not_available"` |
| Engine-gelieferte Zieloptionen liegen vor | `availableTargets` wird gefüllt, `availableTargetsStatus: "engine_provided"` |
| Nur TargetRequirements/ChoiceRequirements liegen vor | `availableTargetsStatus: "target_context_unavailable"`, Issue `target_context_unavailable` |
| `engine_only` TargetRequirement | keine Ziel-ID-Projektion, `hiddenInfoPolicy: "hidden_info_blocked"`, Issue `hidden_info_blocked` |

`TargetProfileMatch` und `ConstraintResult` bleiben in AI039 leer und werden als Gap an AI041 weitergegeben.

## Keine Wirkung

AI039 erzeugt keine Legalität, bewertet keine Ziele, wählt kein Ziel, wählt keine Aktion, scored nichts und verändert keine Runtime-Entscheidung.

Alle No-Effect-Flags bleiben `false`.

## Verifikation

| Befehl | Ergebnis |
| --- | --- |
| `node scripts/check-ai039-target-context-projection.mjs` | passed |
| `corepack pnpm --filter @netgrid/ai typecheck` | passed |
| `corepack pnpm --filter @netgrid/ai test` | passed |
| `node scripts/check-ai028-r-netgrid-semantic-audit-pack-refresh.mjs` | passed |
| `node scripts/check-ai031-033-tactic-signal-taxonomy-finalization.mjs` | passed |
| `git diff --check` | passed |

## Nächster Step

`AI040 Action Cost and Timing Profiles`.
