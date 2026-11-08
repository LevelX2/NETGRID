import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { exactImmediateHandDelta } from "../actions/action-candidate-facts";

export type CurrentSelfDamageOutcome = {
  handCountDelta: number;
  handCapacityDelta: number;
  forgetHandIdentities: true;
};

/** The source-card economy delta deliberately excludes the separate damage cost. */
export function currentSelfDamageOutcome(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): CurrentSelfDamageOutcome | undefined {
  const payload = action.payload;
  const damage = candidate.costProfile.selfDamage?.[0];
  const sourceDelta = exactImmediateHandDelta(candidate);
  if (
    input.side !== "runner" ||
    action.side !== "runner" ||
    action.type !== "play_event" ||
    candidate.stateVersion !== input.playerView.stateVersion ||
    action.expiresAtStateVersion !== candidate.stateVersion ||
    candidate.actionId !== action.actionId ||
    candidate.sourceCardInstanceId !== action.source ||
    !input.playerView.own.gripOrHq.some(
      (c) => c.instanceId === action.source,
    ) ||
    candidate.costProfile.selfDamage?.length !== 1 ||
    !damage ||
    !Number.isSafeInteger(damage.amount) ||
    typeof damage.amount !== "number" ||
    damage.amount <= 0 ||
    damage.type === "unknown" ||
    payload?.damageAmount !== damage.amount ||
    payload.damageType !== damage.type ||
    payload.preventableDamage === true ||
    !(
      payload.damageCannotBePrevented === true ||
      payload.unpreventableDamage === true ||
      payload.preventableDamage === false
    ) ||
    sourceDelta === undefined
  )
    return undefined;

  const handCountDelta = sourceDelta - damage.amount;
  const handCapacityDelta =
    damage.type === "core" || damage.type === "brain" ? -damage.amount : 0;
  if (
    !Number.isSafeInteger(handCountDelta) ||
    input.playerView.own.gripOrHq.length + handCountDelta < 0 ||
    input.playerView.own.maxHandSize + handCapacityDelta < 0
  )
    return undefined;
  return { handCountDelta, handCapacityDelta, forgetHandIdentities: true };
}
