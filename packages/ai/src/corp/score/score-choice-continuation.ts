import { visibleBreakerEncounterQuote } from "@netgrid/engine";
import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";
import { corpScoredAgendaIceMarkDefenseTarget } from "../../plans/corp-defense-domain-signals";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { type PlanSchedulerResult } from "../../plans/plan-scheduler";
import {
  corpScoredAgendaFreeRezProfile,
  corpScoredAgendaHqShuffleProfile,
  corpScoredAgendaIceMarkProfile,
} from "../../runtime/corp-canonical-card-facts";
import type { DiscardKeepScorer } from "../../runtime/discard-choice-selection";
import { isFiniteNonNegativeInteger } from "../../runtime/exact-action-cost-facts";
import { visibleInstalledCard } from "../../runtime/visible-action-facts";
import { corpHandDispositionScore } from "../hand-management/hand-disposition-score";
export function bindSelectedCorpScoreChoiceContinuation(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
  discardKeepScore: DiscardKeepScorer | undefined,
): void {
  if (result.lane !== "plan") return;
  const continuationFamily =
    result.route.head.semanticActionType === "score.agenda"
      ? "corp_scored_agenda_on_score"
      : [
            "score_conversion.move_advancement",
            "score_conversion.place_advancement",
          ].includes(result.route.head.semanticActionType)
        ? "corp_advancement_counter"
        : undefined;
  if (continuationFamily === undefined) {
    return;
  }
  const executor = result.portfolio.instances.find(
    (instance) =>
      instance.instanceId === result.portfolio.executorInstanceId &&
      instance.moduleId === "corp.score_agenda",
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: {
          agendaInstanceId?: unknown;
          fundingGap?: unknown;
          advancementCounterChoiceBinding?: {
            kind?: unknown;
            sourceCardId?: unknown;
            targetCardId?: unknown;
            amount?: unknown;
            placements?: unknown;
          };
        };
        choiceContinuation?: {
          family?: unknown;
          selectedActionId?: unknown;
          selectedAtStateVersion?: unknown;
          targetCardId?: unknown;
          sourceCardId?: unknown;
          amount?: unknown;
          placements?: unknown;
          freeRezChoiceBinding?: unknown;
          iceMarkChoiceBinding?: unknown;
          hqAgendaShuffleChoiceBinding?: unknown;
        };
      }
    | undefined;
  const targetCardId =
    typeof moduleState?.signal?.agendaInstanceId === "string"
      ? moduleState.signal.agendaInstanceId
      : undefined;
  const selectedAction = input.legalActions.find(
    (action) => action.actionId === result.route.head.actionId,
  );
  const exactScoreAction =
    continuationFamily !== "corp_scored_agenda_on_score" ||
    (selectedAction?.type === "score_agenda" &&
      selectedAction.source === targetCardId &&
      selectedAction.payload?.cardId === targetCardId);
  const moveBinding = moduleState?.signal?.advancementCounterChoiceBinding;
  const exactMoveBinding =
    result.route.head.semanticActionType !==
      "score_conversion.move_advancement" ||
    (moveBinding?.kind === "move_advancement" &&
      typeof moveBinding.sourceCardId === "string" &&
      moveBinding.sourceCardId.length > 0 &&
      moveBinding.targetCardId === targetCardId &&
      typeof moveBinding.amount === "number" &&
      Number.isInteger(moveBinding.amount) &&
      moveBinding.amount > 0);
  const exactPlacementBinding =
    result.route.head.semanticActionType !==
      "score_conversion.place_advancement" ||
    moveBinding === undefined ||
    (moveBinding.kind === "place_advancement" &&
      Array.isArray(moveBinding.placements) &&
      moveBinding.placements.length > 0);
  if (
    !executor ||
    moduleState?.kind !== "score" ||
    !targetCardId ||
    !exactScoreAction ||
    !exactMoveBinding ||
    !exactPlacementBinding
  ) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "continuation",
      removalCondition:
        "A selected Corp score or advancement-conversion action must belong to the resident score executor and expose its exact agenda target.",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
    });
  }
  const sourceDefinitionId = selectedAction?.source
    ? visibleInstalledCard(input, selectedAction.source)?.definitionId
    : undefined;
  const freeRezProfile =
    continuationFamily === "corp_scored_agenda_on_score"
      ? corpScoredAgendaFreeRezProfile(sourceDefinitionId)
      : undefined;
  const freeRezTarget = freeRezProfile
    ? corpScoredAgendaFreeRezTarget(input)
    : undefined;
  const iceMarkProfile =
    continuationFamily === "corp_scored_agenda_on_score"
      ? corpScoredAgendaIceMarkProfile(sourceDefinitionId)
      : undefined;
  const iceMarkTarget = iceMarkProfile
    ? corpScoredAgendaIceMarkDefenseTarget({
        input,
        sourceAgendaId: targetCardId,
        targetPurpose: iceMarkProfile.targetPurpose,
        targetPreferences: iceMarkProfile.targetPreferences,
      })
    : undefined;
  const hqShuffleProfile =
    continuationFamily === "corp_scored_agenda_on_score"
      ? corpScoredAgendaHqShuffleProfile(sourceDefinitionId)
      : undefined;
  const scoredAgendaPoints =
    selectedAction?.source !== undefined
      ? (visibleInstalledCard(input, selectedAction.source)?.agendaPoints ??
        (sourceDefinitionId
          ? CARD_DEFINITIONS_BY_ID[sourceDefinitionId]?.agendaPoints
          : undefined) ??
        0)
      : 0;
  const hqAgendaShuffleChoiceBinding = hqShuffleProfile
    ? corpScoredAgendaHqShuffleChoiceBinding({
        input: corpPostScoreHandDispositionInput(input, scoredAgendaPoints),
        profile: hqShuffleProfile,
        fundingGap:
          typeof moduleState.signal?.fundingGap === "number" &&
          Number.isFinite(moduleState.signal.fundingGap)
            ? Math.max(0, moduleState.signal.fundingGap)
            : 0,
        discardKeepScore,
      })
    : undefined;
  moduleState.choiceContinuation = {
    family: continuationFamily,
    selectedActionId: result.route.head.actionId,
    selectedAtStateVersion: input.playerView.stateVersion,
    targetCardId,
    ...(moveBinding?.kind === "move_advancement"
      ? {
          sourceCardId: moveBinding.sourceCardId,
          amount: moveBinding.amount,
        }
      : {}),
    ...(moveBinding?.kind === "place_advancement" &&
    Array.isArray(moveBinding.placements)
      ? { placements: moveBinding.placements }
      : {}),
    ...(freeRezProfile && freeRezTarget
      ? {
          freeRezChoiceBinding: {
            sourceCapabilityId: freeRezProfile.sourceCapabilityId,
            targetPurpose: freeRezProfile.targetPurpose,
            targetCardId: freeRezTarget.card.instanceId,
            targetDefinitionId: freeRezTarget.card.definitionId,
            selectedVariantId: freeRezTarget.selectedVariantId,
            selectedOptionId: `rez_${freeRezTarget.card.instanceId}_${freeRezTarget.selectedVariantId}`,
          },
        }
      : {}),
    ...(iceMarkProfile && iceMarkTarget
      ? {
          iceMarkChoiceBinding: {
            sourceCapabilityId: iceMarkProfile.sourceCapabilityId,
            targetPurpose: iceMarkProfile.targetPurpose,
            targetCardId: iceMarkTarget.instanceId,
            targetDefinitionId: iceMarkTarget.definitionId,
          },
        }
      : {}),
    ...(hqAgendaShuffleChoiceBinding ? { hqAgendaShuffleChoiceBinding } : {}),
  };
}

function corpPostScoreHandDispositionInput(
  input: AiDecisionInput,
  scoredAgendaPoints: number,
): AiDecisionInput {
  if (scoredAgendaPoints <= 0) return input;
  return {
    ...input,
    playerView: {
      ...input.playerView,
      own: {
        ...input.playerView.own,
        agendaPoints: input.playerView.own.agendaPoints + scoredAgendaPoints,
      },
    },
  };
}

function corpScoredAgendaHqShuffleChoiceBinding(params: {
  input: AiDecisionInput;
  profile: NonNullable<ReturnType<typeof corpScoredAgendaHqShuffleProfile>>;
  fundingGap: number;
  discardKeepScore: DiscardKeepScorer | undefined;
}): {
  sourceCapabilityId: string;
  creditPerAgendaPoint: number;
  selectedCardInstanceIds: string[];
} {
  const agendaCards = params.input.playerView.own.gripOrHq.filter(
    (card) => card.known && card.type === "agenda",
  );
  if (agendaCards.length === 0) {
    return {
      sourceCapabilityId: params.profile.sourceCapabilityId,
      creditPerAgendaPoint: params.profile.creditPerAgendaPoint,
      selectedCardInstanceIds: [],
    };
  }
  if (!params.discardKeepScore) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: params.input.side,
      stateVersion: params.input.playerView.stateVersion,
      timingPoint: params.input.playerView.timingPoint,
      legalActionTypes: params.input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition:
        "The Corp score plan requires the strategic hand scorer before it can bind an optional scored-agenda HQ disposition.",
    });
  }
  const ranked = agendaCards
    .map((card) => ({
      card,
      disposition: corpHandDispositionScore({
        input: params.input,
        card,
        destination: "rd_shuffle",
        baseKeepScore: params.discardKeepScore!(params.input, card),
      }),
    }))
    .sort(
      (left, right) =>
        left.disposition.destinationAdjustment -
          right.disposition.destinationAdjustment ||
        left.card.instanceId.localeCompare(right.card.instanceId),
    );
  let remainingFundingGap = params.fundingGap;
  const selectedCardInstanceIds: string[] = [];
  for (const candidate of ranked) {
    const protectedByCurrentScoreLine = candidate.disposition.evidence.some(
      (code) =>
        code === "corp_hand_destination_matchpoint_protected" ||
        code === "corp_hand_destination_current_plan_protected",
    );
    const agendaPoints =
      candidate.card.agendaPoints ??
      (candidate.card.definitionId
        ? CARD_DEFINITIONS_BY_ID[candidate.card.definitionId]?.agendaPoints
        : undefined) ??
      0;
    const creditGain = agendaPoints * params.profile.creditPerAgendaPoint;
    const fundingCreditValue = Math.min(remainingFundingGap, creditGain) * 60;
    const dispositionIsProductive =
      candidate.disposition.destinationAdjustment < 0 ||
      (remainingFundingGap > 0 &&
        candidate.disposition.destinationAdjustment - fundingCreditValue < 0);
    if (protectedByCurrentScoreLine || !dispositionIsProductive) continue;
    selectedCardInstanceIds.push(candidate.card.instanceId);
    remainingFundingGap = Math.max(0, remainingFundingGap - creditGain);
  }
  return {
    sourceCapabilityId: params.profile.sourceCapabilityId,
    creditPerAgendaPoint: params.profile.creditPerAgendaPoint,
    selectedCardInstanceIds,
  };
}

function corpScoredAgendaFreeRezTarget(input: AiDecisionInput):
  | Readonly<{
      card: VisibleCard;
      selectedVariantId: string;
      rezCredits: number;
    }>
  | undefined {
  return input.playerView.servers
    .flatMap((server) =>
      server.ice.map((card) => ({ card, serverId: server.id })),
    )
    .filter(
      ({ card, serverId }) =>
        card.known === true &&
        card.type === "ice" &&
        card.rezzed === false &&
        typeof card.definitionId === "string" &&
        card.definitionId.length > 0 &&
        card.effectiveRezCostQuote?.context === "installed" &&
        card.effectiveRezCostQuote.cardId === card.instanceId &&
        card.effectiveRezCostQuote.targetServerId === serverId &&
        card.effectiveRezCostQuote.projectedServerId === serverId &&
        card.effectiveRezCostQuote.expiresAtStateVersion ===
          input.playerView.stateVersion &&
        card.effectiveRezCostQuote.complete === true &&
        isFiniteNonNegativeInteger(card.effectiveRezCostQuote.finalCredits),
    )
    .map(({ card }) => {
      const quote = card.effectiveRezCostQuote;
      if (quote?.complete !== true) return undefined;
      const selectedVariantId = corpScoredAgendaFreeRezVariantId(input, card);
      return selectedVariantId
        ? { card, selectedVariantId, rezCredits: quote.finalCredits }
        : undefined;
    })
    .filter(
      (
        target,
      ): target is Readonly<{
        card: VisibleCard;
        selectedVariantId: string;
        rezCredits: number;
      }> => target !== undefined,
    )
    .sort(
      (left, right) =>
        right.rezCredits - left.rezCredits ||
        left.card.instanceId.localeCompare(right.card.instanceId),
    )[0];
}

function corpScoredAgendaFreeRezVariantId(
  input: AiDecisionInput,
  ice: VisibleCard,
): string | undefined {
  const quote = ice.effectiveRezCostQuote;
  if (quote?.complete !== true) return undefined;
  if (quote.costKind === "fixed") return "fixed";
  const parameter = quote.variableParameter;
  if (parameter.kind === "alternate_subtype") {
    const baseBreakable = corpScoredAgendaIceSubtypeIsBreakable(
      input,
      ice,
      parameter.baseSubtypes,
    );
    const alternateBreakable = corpScoredAgendaIceSubtypeIsBreakable(
      input,
      ice,
      parameter.alternateSubtypes,
    );
    const alternateAdditionalCost =
      parameter.alternateSubtypesFinalCredits -
      parameter.baseSubtypesFinalCredits;
    return baseBreakable &&
      !alternateBreakable &&
      isFiniteNonNegativeInteger(alternateAdditionalCost) &&
      alternateAdditionalCost <= input.playerView.own.credits
      ? "alternate_subtype:alternate"
      : "alternate_subtype:base";
  }
  if (parameter.kind === "paid_end_the_run_subroutines") {
    const minimumAdditionalCost =
      parameter.minSubroutinesFinalCredits - quote.finalCredits;
    const firstEndTheRunAdditionalCost =
      parameter.firstEndTheRunFinalCredits - quote.finalCredits;
    if (
      !isFiniteNonNegativeInteger(minimumAdditionalCost) ||
      minimumAdditionalCost > input.playerView.own.credits
    ) {
      return undefined;
    }
    const selectedSubroutineCount =
      isFiniteNonNegativeInteger(firstEndTheRunAdditionalCost) &&
      firstEndTheRunAdditionalCost <= input.playerView.own.credits
        ? parameter.firstEndTheRunSubroutineCount
        : parameter.minSubroutines;
    return isFiniteNonNegativeInteger(selectedSubroutineCount)
      ? `paid_end_the_run_subroutines:${selectedSubroutineCount}`
      : undefined;
  }
  if (
    !isFiniteNonNegativeInteger(parameter.additionalCreditsPerValue) ||
    parameter.additionalCreditsPerValue <= 0 ||
    !isFiniteNonNegativeInteger(parameter.minValue) ||
    !isFiniteNonNegativeInteger(parameter.maxValue) ||
    parameter.minValue > parameter.maxValue
  ) {
    return undefined;
  }
  const affordableValue = Math.floor(
    input.playerView.own.credits / parameter.additionalCreditsPerValue,
  );
  if (affordableValue < parameter.minValue) return undefined;
  return `x_strength:${Math.max(
    parameter.minValue,
    Math.min(parameter.maxValue, affordableValue),
  )}`;
}

function corpScoredAgendaIceSubtypeIsBreakable(
  input: AiDecisionInput,
  ice: VisibleCard,
  subtypes: readonly string[],
): boolean {
  if (!ice.definitionId) return false;
  const definition = CARD_DEFINITIONS_BY_ID[ice.definitionId];
  const subroutines = (definition?.subroutines ?? []).map((subroutine) => ({
    id: subroutine.id,
    type: subroutine.type,
    ...(subroutine.breakTags
      ? { breakTags: subroutine.breakTags.slice() }
      : {}),
  }));
  return (input.playerView.opponent.rig ?? []).some((breaker) => {
    if (!breaker.definitionId || breaker.known === false) return false;
    const quote = visibleBreakerEncounterQuote({
      breakerDefinitionId: breaker.definitionId,
      breakerInstanceId: breaker.instanceId,
      breakerStrength: breaker.strength ?? 0,
      ...(breaker.selectedTargetCardId
        ? { selectedTargetCardId: breaker.selectedTargetCardId }
        : {}),
      ...(breaker.selectedSubtype
        ? { selectedSubtype: breaker.selectedSubtype }
        : {}),
      ...(breaker.randomRunStrengthState
        ? { randomRunStrengthState: breaker.randomRunStrengthState }
        : {}),
      iceDefinitionId: ice.definitionId!,
      iceInstanceId: ice.instanceId,
      iceSubtypes: subtypes,
      subroutines,
    });
    return quote?.coverageStatus === "full";
  });
}
