import { cardImplementationForDefinitionId } from "@netgrid/engine";
import { expect } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { buildAiDecisionInputDto } from "../../input-dto";

/** Explicit current-rule countermodel; never a repaired historical checkpoint. */
export function currentRuleTagRemovalCounterInput(
  historical: AiDecisionInputWithDeckCapabilities,
): AiDecisionInputWithDeckCapabilities {
  const input = structuredClone(historical);
  for (const action of input.legalActions) {
    if (action.payload?.cardImplementationEffectKind !== "remove_tags") continue;
    expect(action.payload.cardImplementationTagAmount).toBeUndefined();
    const source = input.playerView.own.gripOrHq.find(c => c.instanceId === action.payload?.cardId);
    if (!source?.definitionId) throw new Error("countermodel_source_missing");
    const effects = cardImplementationForDefinitionId(source.definitionId)?.abilities
      ?.filter(a => a.kind === "on_play")
      .flatMap(a => a.effects)
      .filter(e => e.kind === "remove_tags");
    if (effects?.length !== 1) throw new Error("countermodel_tag_effect_not_unique");
    const effect = effects[0]!;
    action.payload.cardImplementationTagMode = effect.mode;
    action.payload.cardImplementationTagAmount = effect.mode === "all" ? "all" : effect.amount!;
  }
  input.playerView.legalActions = input.legalActions;
  return { ...input, ...buildAiDecisionInputDto(input) };
}
