import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { AI_HINTS_BY_CARD } from "../../ai-hints";

export type CorpActionIceRezSupportLiability =
  | "bounded"
  | "temporary"
  | "installment";

export function definitionHasActionIceRezSupport(
  definitionId: string,
): boolean {
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  return (
    hint?.side === "corp" &&
    hint.effects?.some(
      (effect) =>
        effect.kind === "rez" &&
        effect.scope === "ice" &&
        effect.timing === "action",
    ) === true &&
    hint.targetProfiles?.some(
      (profile) =>
        "kind" in profile &&
        profile.kind === "use_target" &&
        profile.targetType === "installed_ice",
    ) === true
  );
}

export function actionIceRezSupportLiability(
  definitionId: string,
): CorpActionIceRezSupportLiability | undefined {
  if (!definitionHasActionIceRezSupport(definitionId)) return undefined;
  const tacticSignals = new Set(
    AI_HINTS_BY_CARD.get(definitionId)?.tacticSignals ?? [],
  );
  if (
    tacticSignals.has("ice.corp_temporary_rez") &&
    tacticSignals.has("risk.temporary_rez_liability")
  ) {
    return "temporary";
  }
  if (
    tacticSignals.has("ice.corp_installment_rez") &&
    tacticSignals.has("risk.term_counter_payment_liability")
  ) {
    return "installment";
  }
  return "bounded";
}

/** Only a complete, current Engine quote proves that this direct target is empty.
 * Incomplete/choice-dependent quotes are not evidence of an empty encounter.
 * This does not certify a speculative future effect on another ICE layer.
 */
export function corpIceRezSupportTargetHasNoCurrentEffect(
  input: AiDecisionInput,
  ice: VisibleCard,
  serverId: string,
): boolean {
  const post = ice.effectivePostRezRunQuote;
  return (
    post?.complete === true &&
    post.context === "installed_post_rez" &&
    post.cardId === ice.instanceId &&
    post.iceDefinitionId === ice.definitionId &&
    post.targetServerId === serverId &&
    post.projectedServerId === serverId &&
    post.expiresAtStateVersion === input.playerView.stateVersion &&
    post.effectiveRunQuote.iceInstanceId === ice.instanceId &&
    post.effectiveRunQuote.iceDefinitionId === ice.definitionId &&
    post.effectiveRunQuote.subroutines.length === 0 &&
    (post.effectiveRunQuote.conditionalEncounterEffects?.length ?? 0) === 0 &&
    post.paidEncounterDefense === undefined &&
    !(post.creditGainOnRez && post.creditGainOnRez.creditGain > 0)
  );
}

export function corpIceRezSupportEmptyTargetDispositionEvidence(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): string | undefined {
  if (
    candidate.actionType !== "play_operation" ||
    !candidate.sourceDefinitionId ||
    !definitionHasActionIceRezSupport(candidate.sourceDefinitionId)
  ) {
    return undefined;
  }
  const action = input.legalActions.find(
    (a) => a.actionId === candidate.actionId,
  );
  if (
    action?.type !== "play_operation" ||
    action.side !== "corp" ||
    action.source !== candidate.sourceCardInstanceId ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.timingPoint !== input.playerView.timingPoint ||
    typeof action.payload?.targetCardId !== "string"
  ) return undefined;
  for (const server of input.playerView.servers) {
    const ice = server.ice.find(
      (i) => i.instanceId === action.payload!.targetCardId,
    );
    if (
      ice?.known && ice.type === "ice" && !ice.rezzed &&
      corpIceRezSupportTargetHasNoCurrentEffect(input, ice, server.id)
    ) {
      return `corp_rez_support_empty_current_effect:${server.id}:${ice.instanceId}`;
    }
  }
  return undefined;
}
