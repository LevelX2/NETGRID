import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { unresolvedChoiceFailure } from "../../runtime/plan-bound-choice-contract";
import { corpStartDrawAgendaSearchServerId } from "../score/score-start-draw-need";
import type { CorpHandManagementSignal } from "./hand-management-types";

export function corpOptionalStartDrawSignal(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): CorpHandManagementSignal | undefined {
  const choice = input.playerView.pendingChoice;
  if (
    input.side !== "corp" ||
    !choice?.source.startsWith("scored_agenda.start_draw_choice:")
  )
    return undefined;
  const action = input.legalActions.find(
    (a) =>
      a.type === "resolve_choice" &&
      a.choiceRequirements?.[0]?.choiceId === choice.choiceId,
  );
  if (!action) return undefined;
  const quote = choice.corpStartDrawQuote;
  const own = input.playerView.own;
  if (
    !quote ||
    quote.observedAtStateVersion !== input.playerView.stateVersion ||
    choice.source !==
      `scored_agenda.start_draw_choice:${quote.sourceCardInstanceId}:${quote.observedAtStateVersion}` ||
    ![
      quote.additionalDrawCount,
      quote.committedDrawCount,
      quote.mandatoryDrawCount,
    ].every((n) => Number.isSafeInteger(n) && n > 0) ||
    quote.committedDrawCount < quote.mandatoryDrawCount ||
    ![own.stackOrRdCount, own.maxHandSize].every(
      (n) => Number.isSafeInteger(n) && n >= 0,
    ) ||
    !candidates.some(
      (c) =>
        c.actionId === action.actionId &&
        c.semanticActionType === "choice.resolve",
    )
  ) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "The Hand owner requires the exact Engine start-draw quote, including mandatory and already committed draws.",
    );
  }
  const projectedHand = own.gripOrHq.length + quote.committedDrawCount;
  const hasCapacity =
    projectedHand + quote.additionalDrawCount <= own.maxHandSize;
  // Preserve two further turns at the currently quoted mandatory draw rate.
  const preservesHorizon =
    own.stackOrRdCount - quote.committedDrawCount - quote.additionalDrawCount >=
    2 * quote.mandatoryDrawCount;
  const searchServerId = corpStartDrawAgendaSearchServerId(input);
  const lowHand = projectedHand <= 2;
  const selectedOptionId =
    hasCapacity && preservesHorizon && (lowHand || searchServerId !== undefined)
      ? "draw"
      : "skip";
  const reason = !hasCapacity
    ? "no_hand_capacity"
    : !preservesHorizon
      ? "preserve_draw_horizon"
      : lowHand
        ? "refill_low_hand"
        : searchServerId
          ? `agenda_search:${searchServerId}`
          : "no_concrete_draw_need";
  return {
    handPlanId: `optional-start-draw:${choice.choiceId}`,
    phase: "optional_start_draw_window",
    actionIds: [action.actionId],
    exactActionRoute: true,
    agendaCount: own.gripOrHq.filter(
      (card) => card.known && card.type === "agenda",
    ).length,
    handSize: own.gripOrHq.length,
    maximumHandSize: own.maxHandSize,
    concretePurposeCode: `corp_optional_start_draw:${reason}`,
    optionalStartDrawChoiceBinding: {
      actionId: action.actionId,
      choiceId: choice.choiceId,
      observedAtStateVersion: input.playerView.stateVersion,
      selectedOptionId,
    },
    value: 1000,
    evidenceCode: `corp_optional_start_draw:${selectedOptionId}:${reason}`,
  };
}
