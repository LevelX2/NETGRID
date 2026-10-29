import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
  VisibleCorpIcePostRezRunQuote,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";

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
  operation?: LegalAction,
): boolean {
  const post =
    operation?.payload?.operationFreeRezRunQuoteJson !== undefined
      ? boundOperationFreeRezQuote(input, operation)
      : ice.effectivePostRezRunQuote;
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
  )
    return undefined;
  for (const server of input.playerView.servers) {
    const ice = server.ice.find(
      (i) => i.instanceId === action.payload!.targetCardId,
    );
    if (
      ice?.known &&
      ice.type === "ice" &&
      !ice.rezzed &&
      corpIceRezSupportTargetHasNoCurrentEffect(input, ice, server.id, action)
    ) {
      return `corp_rez_support_empty_current_effect:${server.id}:${ice.instanceId}`;
    }
  }
  return undefined;
}

function boundOperationFreeRezQuote(
  input: AiDecisionInput,
  action: LegalAction,
): VisibleCorpIcePostRezRunQuote | undefined {
  const invalid = () =>
    new PlanResolutionFailure("missing_action_semantics", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: [action.type],
      unresolvedActionIds: [action.actionId],
      owner: "action_semantics",
      removalCondition:
        "Supply the canonical operationFreeRezRunQuoteJson with exact source, action, target, costs and current StateVersion.",
    });
  let decoded: unknown;
  try {
    decoded = JSON.parse(
      action.payload!.operationFreeRezRunQuoteJson as string,
    );
  } catch {
    throw invalid();
  }
  const quote = decoded as {
    operationActionId?: unknown;
    sourceCardId?: unknown;
    sourceDefinitionId?: unknown;
    stateVersion?: unknown;
    counterType?: unknown;
    counterAmount?: unknown;
    creditCost?: unknown;
    postRez?: VisibleCorpIcePostRezRunQuote;
  } | null;
  const source = input.playerView.own.gripOrHq.find(
    (c) => c.instanceId === action.source,
  );
  if (
    !quote ||
    typeof quote !== "object" ||
    !source?.known ||
    source.type !== "operation" ||
    action.side !== "corp" ||
    action.type !== "play_operation" ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.timingPoint !== input.playerView.timingPoint ||
    quote.operationActionId !== action.actionId ||
    quote.sourceCardId !== action.source ||
    quote.sourceDefinitionId !== source?.definitionId ||
    quote.stateVersion !== input.playerView.stateVersion ||
    (quote.counterType !== "term" && quote.counterType !== "kludge") ||
    quote.counterAmount !==
      (quote.counterType === "term"
        ? action.payload?.targetRezCost
        : action.payload?.xValue) ||
    quote.creditCost !==
      action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0) ||
    quote.postRez?.cardId !== action.payload?.targetCardId ||
    quote.postRez?.iceDefinitionId !== action.payload?.targetDefinitionId
  )
    throw invalid();
  const post = quote.postRez;
  if (!post || typeof post.complete !== "boolean") throw invalid();
  if (post.complete) {
    const effect = post.effectiveRunQuote,
      income = post.creditGainOnRez;
    if (
      !effect ||
      !Array.isArray(effect.subroutines) ||
      (effect.conditionalEncounterEffects !== undefined &&
        !Array.isArray(effect.conditionalEncounterEffects)) ||
      (income !== undefined &&
        (!income ||
          ![income.creditsBefore, income.creditGain, income.creditsAfter].every(
            (n) => Number.isSafeInteger(n) && n >= 0,
          ) ||
          income.creditsBefore !==
            input.playerView.own.credits - Number(quote.creditCost) ||
          income.creditsBefore + income.creditGain !== income.creditsAfter))
    )
      throw invalid();
  }
  return quote.postRez;
}
