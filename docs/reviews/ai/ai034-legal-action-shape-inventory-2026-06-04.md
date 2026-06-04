# AI034 LegalAction Shape Inventory

Datum: 2026-06-04
Primärer Agent: `release-implementation-agent`
Status: `done`
Scope: statisches Inventar, keine Semantikprojektion, keine Codeänderung an Engine/AI/Shared

## Kurzfazit

AI034 inventarisiert die aktuelle `LegalAction`-Form aus Shared-Typen, Engine-Buildern, AI-DTO-Sanitizing und AI-Verbrauchspfaden. Der aktuelle Shared-`ActionType`-Katalog enthält 32 ActionTypes. Jede Inventar-Shape im JSON-Report enthält `actionType` und eine Payload-Key-Liste.

Der wichtigste Befund bleibt der aus AI019: Die Legalitätsoberfläche ist stabil, aber mehrere ziel-, ability- und kostenentscheidende Payload-Disambiguatoren gehen vor dem `AiDecisionInput` verloren oder sind nur indirekt verfügbar. Das ist kein Prozessblocker für AI034; diese Felder werden als Gaps für AI038 bis AI040 dokumentiert.

## Quellen

- `packages/shared/src/index.ts`
- `packages/shared/src/ability-payload.ts`
- `packages/engine/src/game/turn/action-builders.ts`
- `packages/engine/src/game/legal-actions.ts`
- `packages/engine/src/game/turn/runner-main-actions.ts`
- `packages/engine/src/game/turn/corp-main-actions.ts`
- `packages/engine/src/game/run/encounter-actions.ts`
- `packages/engine/src/game/access/access-actions.ts`
- `packages/ai/src/input-dto.ts`
- `packages/ai/src/index.ts`
- AI019: `docs/reviews/ai/ai019-legal-action-semantic-bridge-audit-2026-06-01.md`

## LegalAction-Kernform

`LegalAction` enthält:

- `actionId`, `side`, `type`, `label`
- `source: CardInstanceId | "basic_action" | "game_rule"`
- `timingPoint`
- `costs`
- `targetRequirements`
- optional `choiceRequirements`, `abilityRef`, `effectRef`, `resolvedEffects`
- `visibility`, `expiresAtStateVersion`
- optionales primitives `payload`

`PlayerAction` sendet danach `matchId`, `side`, `actionId`, `clientKnownStateVersion` sowie optionale `selectedTargets` und `selectedChoices`.

## ActionType-Inventar

Der Shared-Union-Katalog umfasst:

```text
mandatory_draw, gain_credit, draw_card, activated_card_ability, install_card,
play_event, play_operation, advance_card, score_agenda, start_run, jack_out,
rez_ice, decline_rez, pump_breaker, break_subroutine, continue_run, access_card,
steal_agenda, trash_accessed_card, trash_resource, decline_trash, remove_tag,
purge_virus_counters, purge_runner_virus_counters, forgo_action,
move_to_set_aside, move_to_removed_from_game, return_from_set_aside,
change_card_control, resolve_choice, trigger_ability, end_turn
```

Details je ActionType stehen im JSON-Report `docs/reviews/ai/ai034-legal-action-shape-inventory-2026-06-04.json`.

## Feldorte

| Frage | Aktueller Ort |
| --- | --- |
| Source | `LegalAction.source`; teils zusätzliche Payload-Felder wie `cardId`, `sourceDefinitionId`, `sourceCardIds`, `hiddenResourceSourceCardId` |
| Ability | `abilityRef`, `effectRef`, `payload.abilityFamily`, `payload.abilityId`, `payload.effectKind`, CardImplementation-/Legacy-Ability-Payloads |
| Target | `targetRequirements`, `choiceRequirements`, PlayerView-`pendingChoice`, `PlayerAction.selectedTargets`, `PlayerAction.selectedChoices`, Payload-Disambiguatoren |
| Choice | `choiceRequirements` auf der Action; konkrete Optionen in `PlayerView.pendingChoice` |
| Cost | `costs`; Zusatz-/variable Kosten teils in Payload-Feldern wie `accessTrashTotalCost`, `stealCost`, `variableRez*`, `paymentAmount` |
| Timing | `timingPoint`, `expiresAtStateVersion`; weitere Timingdetails teils nur aus GameState/Run-Kontext |
| X/Mode | `xValue`, `selectedSubtype`, `placement`, ability-spezifische Payload-Keys |

## AI-DTO-Verfügbarkeit

`packages/ai/src/input-dto.ts` kopiert `LegalAction` nicht tief, sondern nutzt eine positive Allowlist. Core-Felder wie `actionId`, `type`, `source`, `timingPoint`, `costs`, `targetRequirements`, `choiceRequirements`, `abilityRef`, `effectRef`, `resolvedEffects`, `visibility` und `expiresAtStateVersion` bleiben erhalten.

Payloads sind primitive-only und auf die erlaubten Keys begrenzt. Das schützt Hidden Info, lässt aber einige Engine-Disambiguatoren aus.

## Dokumentierte DTO-Verluste

Der JSON-Report enthält den Pflichtabschnitt `lostBetweenEngineAndAiDto`. Relevante Gaps:

- `selectedCardId` und `selectedSubtype`: Target-/Mode-Kontext für Install-/Subtype-Varianten.
- `subroutineId`, `subroutineIndexes`, `passedIceId`: TargetContext-Gaps in Run-/Breaker-Familien.
- `sourceCardIds`, `hiddenResourceSourceCardId`: Source-Binding-Gaps.
- `paymentAmount`, `variableRezKind`, `variableRezAdditionalCost`, `variableRezValue`: CostProfile-Gaps.
- `cardImplementationAbilityIndex`: Ability-Binding-Gap.

Diese Gaps werden nicht geraten. Spätere Steps müssen sie als `schema_gap`, `source_unresolved`, `ability_unresolved`, `target_context_unavailable` oder `cost_unknown` markieren, solange keine side-safe Projektion existiert.

## Keine Wirkung

AI034 hat keine Engine-, Shared-, AI-Runtime-, Planner-, Scoring-, Legalitäts-, UI- oder Hidden-Info-Wirkung. Es wurden nur Review-Artefakte und ein Check-Skript ergänzt.

Alle No-Effect-Flags bleiben `false`:

- Planner
- ActionScore
- PlanWeight
- Targeting-KI
- Engine
- Legalität
- Profil-/Default-Switch
- UI-Derivation
- Hidden-Info-Leak

## Verifikation

| Befehl | Ergebnis |
| --- | --- |
| `node scripts/check-ai034-legal-action-shape-inventory.mjs` | passed |
| `node scripts/check-ai028-r-netgrid-semantic-audit-pack-refresh.mjs` | passed |
| `node scripts/check-ai031-033-tactic-signal-taxonomy-finalization.mjs` | passed |
| `git diff --check` | passed |

Engine-Typecheck ist für AI034 nicht verpflichtend ausgeführt worden, weil keine Engine-Datei, kein Shared-Typ, kein LegalAction-Import und kein DTO-Typ geändert wurde.

## Nächster Step

`AI035 ActionSemanticCandidate Schema`.
