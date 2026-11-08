import type { AiDecisionInput, PublicGameEvent } from "@netgrid/shared";
import { RUNTIME_CARDS } from "../../ai-hints";
import { classifyTagPunishPayoffFromOntology } from "../../tag-punish-ontology-consumer";

/** Belief-supported preparation for the next Corp turn, never a claim about HQ contents. */
export function observedAffordableOperationPunishRisk(
  input: AiDecisionInput,
  history: readonly PublicGameEvent[],
): boolean {
  if (
    input.side !== "runner" ||
    input.playerView.activeSide !== "runner" ||
    input.playerView.opponent.handCount <= 0
  )
    return false;
  return history.some((event) => {
    if (event.type !== "access_card") return false;
    const id = event.publicPayload.cardDefinitionId;
    if (typeof id !== "string") return false;
    const card = RUNTIME_CARDS[id];
    const cost = card?.playCost;
    const profile = classifyTagPunishPayoffFromOntology(id);
    return (
      card?.type === "operation" &&
      cost?.kind === "fixed" &&
      Number.isSafeInteger(cost.credits) &&
      cost.credits >= 0 &&
      cost.credits <= input.playerView.opponent.credits &&
      profile?.requiresRunnerTagged === true &&
      profile.payoffKinds.includes("damage")
    );
  });
}
