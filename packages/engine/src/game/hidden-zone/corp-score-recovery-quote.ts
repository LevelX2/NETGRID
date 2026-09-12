import type {
  CardDefinition,
  CorpScoreRecoveryQuote,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import type { CardCorpUtilityImplementation } from "../../ability-engine/definition-types";
import { onPlayAbilityBindingForDefinition } from "../../ability-engine/card-capability-binding";
import { fixedPlayCostCredits } from "../payment/play-cost";

/** Quote only unconditional, single-effect advancement operations in own Archives. */
export function quoteCorpScoreRecovery(
  state: GameState,
  action: LegalAction,
  utility: CardCorpUtilityImplementation | undefined,
  definitionFor: (state: GameState, id: string) => CardDefinition,
): CorpScoreRecoveryQuote | undefined {
  if (
    action.side !== "corp" ||
    action.type !== "play_operation" ||
    action.expiresAtStateVersion !== state.stateVersion ||
    !action.source ||
    !state.corp.hq.includes(action.source) ||
    utility?.kind !== "corp_archives_to_hq" ||
    (utility.maxSelections !== undefined && utility.maxSelections !== 1) ||
    utility.filter !== undefined
  )
    return undefined;
  const options: CorpScoreRecoveryQuote["options"][number][] = [];
  for (const cardId of state.corp.archives) {
    const instance = state.cardInstances[cardId];
    if (!instance || instance.owner !== "corp") continue;
    const definition = definitionFor(state, cardId);
    if (
      definition.type !== "operation" ||
      definition.playCost?.kind !== "fixed"
    )
      continue;
    const ability = onPlayAbilityBindingForDefinition(definition)?.ability;
    const effect = ability?.effects[0];
    if (
      !ability ||
      ability.condition ||
      ability.sourceDisposition ||
      ability.effects.length !== 1 ||
      effect?.kind !== "distribute_advancement_counters" ||
      effect.distribution !== "any_combination" ||
      !Number.isSafeInteger(effect.amount) ||
      effect.amount <= 0
    )
      continue;
    options.push({
      cardId,
      definitionId: definition.id,
      playClicks:
        ability.costs === "printed" ? 1 : 1 + ability.costs.additionalClicks,
      playCredits: fixedPlayCostCredits(definition),
      advancementAmount: effect.amount,
    });
  }
  return {
    schemaVersion: "corp-score-recovery-quote-v1",
    actionId: action.actionId,
    sourceCardId: action.source,
    stateVersion: state.stateVersion,
    options,
  };
}
