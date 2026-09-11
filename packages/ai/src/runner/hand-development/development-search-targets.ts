import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type { RunnerHandDevelopmentEvaluation } from "./hand-development-evaluation";
import type { DiscardKeepScorer } from "../../runtime/discard-choice-selection";
import { type DiscardChoiceKeepScore } from "../../runtime/discard-choice-selection";
import { runnerCandidateSourceDefinitionId } from "../../runtime/runner-action-source-facts";
import { runnerProgramSearchSourceCardInstanceId } from "../../runtime/runner-program-search-facts";
import type { RunnerDevelopmentInstallServices } from "./development-services";
import { type RunnerDevelopmentSignal } from "./development-types";

export function runnerEventInstallChoiceCommitment(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
  assessProgramInstallTarget: RunnerDevelopmentInstallServices["assessCard"],
): RunnerDevelopmentSignal["eventInstallChoiceCommitment"] | undefined {
  if (candidate.actionType !== "play_event") return undefined;
  const legalAction = input.legalActions.find(
    (action) => action.actionId === candidate.actionId,
  );
  const quote = legalAction?.payload;
  if (!quote?.runnerEventInstallChoiceQuoteSchemaVersion) return undefined;
  const targets = exactCommaSeparatedTokens(
    quote.runnerEventInstallChoiceQuoteSelectableTargetIds,
  );
  const allowedTypes = exactCommaSeparatedTokens(
    quote.runnerEventInstallChoiceQuoteAllowedTypes,
  );
  const exactQuote =
    quote.runnerEventInstallChoiceQuoteSchemaVersion ===
      "runner-event-install-choice-quote-v1" &&
    quote.runnerEventInstallChoiceQuoteComplete === true &&
    typeof quote.runnerEventInstallChoiceQuoteSourceCapabilityKey ===
      "string" &&
    quote.runnerEventInstallChoiceQuoteSourceCapabilityKey.length > 0 &&
    Number.isSafeInteger(quote.runnerEventInstallChoiceQuoteTemporaryCredits) &&
    Number(quote.runnerEventInstallChoiceQuoteTemporaryCredits) > 0 &&
    allowedTypes !== undefined &&
    allowedTypes.length > 0 &&
    allowedTypes.every((type) => type === "program" || type === "hardware") &&
    new Set(allowedTypes).size === allowedTypes.length &&
    targets !== undefined &&
    targets.length > 0 &&
    legalAction?.side === "runner" &&
    legalAction.type === "play_event" &&
    legalAction.expiresAtStateVersion === input.playerView.stateVersion &&
    candidate.sourceCardInstanceId === legalAction.payload?.cardId &&
    typeof candidate.sourceCardInstanceId === "string" &&
    typeof candidate.sourceDefinitionId === "string";
  if (!exactQuote) {
    throw new PlanResolutionFailure("invalid_plan_identity", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [candidate.actionId],
      owner: "plan_registry",
      removalCondition:
        "Admit an event-install development only from the Engine's exact current private target quote and canonical capability.",
    });
  }
  const quotedTargets = new Set(targets);
  const selectedTarget = handDevelopment.flatMap((evaluation) => {
    const visibleCard = input.playerView.own.gripOrHq.find(
      (card) => card.instanceId === evaluation.cardInstanceId,
    );
    if (
      !quotedTargets.has(evaluation.cardInstanceId) ||
      visibleCard === undefined ||
      visibleCard.known === false ||
      visibleCard.definitionId !== evaluation.definitionId ||
      !new Set<string>(allowedTypes).has(visibleCard.type ?? "")
    ) {
      return [];
    }
    const assessment = assessProgramInstallTarget(input, visibleCard);
    const selectedCards = assessment.selectedCandidates.flatMap((entry) =>
      entry.acceptable &&
      entry.card?.type === "program" &&
      typeof entry.card.instanceId === "string" &&
      Number.isInteger(entry.memoryCost) &&
      entry.memoryCost > 0
        ? [
            {
              cardInstanceId: entry.card.instanceId,
              memoryCost: entry.memoryCost,
            },
          ]
        : [],
    );
    const memoryFreed = selectedCards.reduce(
      (total, entry) => total + entry.memoryCost,
      0,
    );
    if (
      assessment.memoryRequired &&
      (visibleCard.type !== "program" ||
        !Number.isInteger(visibleCard.memoryCost) ||
        Number(visibleCard.memoryCost) <= 0 ||
        !assessment.canFreeRequiredMemory ||
        selectedCards.length === 0 ||
        memoryFreed < assessment.requiredMemoryToFree ||
        memoryFreed !== assessment.memoryFreedBySelectedCandidates)
    ) {
      return [];
    }
    return [{ evaluation, visibleCard, assessment, selectedCards }];
  })[0];
  if (!selectedTarget?.evaluation.definitionId) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [candidate.actionId],
      owner: "plan_registry",
      removalCondition:
        "The development plan must bind one exact visible target from the Engine-quoted event-install candidates before selecting the event.",
    });
  }
  return {
    sourceActionId: candidate.actionId,
    sourceCardInstanceId: candidate.sourceCardInstanceId!,
    sourceDefinitionId: candidate.sourceDefinitionId!,
    sourceCapabilityKey:
      quote.runnerEventInstallChoiceQuoteSourceCapabilityKey as string,
    targetCardInstanceId: selectedTarget.evaluation.cardInstanceId,
    targetDefinitionId: selectedTarget.evaluation.definitionId,
    ...(selectedTarget.assessment.memoryRequired
      ? {
          installMemorySacrificeBinding: {
            targetCardInstanceId: selectedTarget.evaluation.cardInstanceId,
            targetMemoryCost: selectedTarget.visibleCard.memoryCost!,
            requiredMemoryToFree:
              selectedTarget.assessment.requiredMemoryToFree,
            selectedCards: selectedTarget.selectedCards,
          },
        }
      : {}),
  };
}

function exactCommaSeparatedTokens(value: unknown): string[] | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined;
  const tokens = value.split(",");
  return tokens.every(
    (token) =>
      token.length > 0 && token.trim() === token && !token.includes("|"),
  ) && new Set(tokens).size === tokens.length
    ? tokens
    : undefined;
}

export function runnerCandidateExecutesHeapRecovery(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  const action = input.legalActions.find(
    (entry) => entry.actionId === candidate.actionId,
  );
  return (
    (candidate.actionType === "play_event" ||
      candidate.actionType === "activated_card_ability" ||
      candidate.actionType === "trigger_ability") &&
    action?.payload?.cardImplementationEffectKind === "search_trash_to_grip" &&
    runnerHeapRecoveryActionContract(input, candidate) !== undefined
  );
}

export function runnerCandidateExecutesTopHeapRecovery(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  const action = input.legalActions.find(
    (entry) => entry.actionId === candidate.actionId,
  );
  return (
    (candidate.actionType === "activated_card_ability" ||
      candidate.actionType === "trigger_ability") &&
    action?.payload?.cardImplementationEffectKind ===
      "move_top_trash_to_grip" &&
    runnerHeapRecoveryActionContract(input, candidate) !== undefined
  );
}

export function runnerHeapRecoveryActionContract(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
):
  | {
      searchFilter: "program" | "any_card";
      exactTargetCardId?: string;
    }
  | undefined {
  const action = input.legalActions.find(
    (entry) => entry.actionId === candidate.actionId,
  );
  if (
    action?.payload?.cardImplementationEffectKind === "search_trash_to_grip"
  ) {
    const searchFilter = action.payload.cardImplementationSearchFilter;
    return searchFilter === "program" || searchFilter === "any_card"
      ? { searchFilter }
      : undefined;
  }
  if (
    action?.payload?.cardImplementationEffectKind !== "move_top_trash_to_grip"
  )
    return undefined;
  const exactTargetCardId =
    typeof action.payload.cardImplementationTopTrashTargetId === "string"
      ? action.payload.cardImplementationTopTrashTargetId
      : typeof action.payload.targetCardId === "string"
        ? action.payload.targetCardId
        : undefined;
  return exactTargetCardId
    ? { searchFilter: "any_card", exactTargetCardId }
    : undefined;
}

export function runnerRecoverySearchCommitment(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  discardKeepScore: DiscardKeepScorer,
):
  | NonNullable<RunnerDevelopmentSignal["recoverySearchCommitment"]>
  | undefined {
  const action = input.legalActions.find(
    (entry) => entry.actionId === candidate.actionId,
  );
  const recoveryContract = runnerHeapRecoveryActionContract(input, candidate);
  const searchFilter = recoveryContract?.searchFilter;
  const sourceCardInstanceId = runnerProgramSearchSourceCardInstanceId(
    input,
    candidate,
  );
  const sourceDefinitionId = runnerCandidateSourceDefinitionId(
    input,
    candidate,
  );
  if (
    !recoveryContract ||
    (searchFilter !== "program" && searchFilter !== "any_card") ||
    !sourceCardInstanceId ||
    !sourceDefinitionId
  ) {
    return undefined;
  }
  const target = input.playerView.own.heapOrArchives
    .filter(
      (card) =>
        card.known === true &&
        typeof card.definitionId === "string" &&
        (searchFilter === "any_card" || card.type === "program") &&
        (recoveryContract.exactTargetCardId === undefined ||
          card.instanceId === recoveryContract.exactTargetCardId),
    )
    .map((card) => {
      const scoringInput = runnerRecoveryScoringInput(input, card, candidate);
      return {
        card,
        scoringInput,
        score: discardKeepScore(scoringInput, card),
      };
    })
    .filter(
      (entry) =>
        Number.isFinite(entry.score.total) &&
        (entry.score.total > 0 ||
          recoveryContract.exactTargetCardId !== undefined),
    )
    .filter((entry) => {
      const own = entry.scoringInput.playerView.own;
      if (own.gripOrHq.length <= own.maxHandSize) return true;
      if (own.maxHandSize <= 0) return false;
      const retainedThreshold = own.gripOrHq
        .filter((card) => card.instanceId !== entry.card.instanceId)
        .map((card) => ({
          card,
          score: discardKeepScore(entry.scoringInput, card),
        }))
        .sort(compareRunnerRecoverySearchTargets)[own.maxHandSize - 1];
      if (!retainedThreshold) return false;
      const targetRank = runnerRecoveryPlanDispositionRank(
        entry.score.planDisposition,
      );
      const retainedRank = runnerRecoveryPlanDispositionRank(
        retainedThreshold.score.planDisposition,
      );
      // A generic recovery must improve the retained hand, not pay to recover
      // a card that the same retention owner will discard again at cleanup.
      return (
        targetRank > retainedRank ||
        (targetRank === retainedRank &&
          entry.score.total > retainedThreshold.score.total)
      );
    })
    .sort(compareRunnerRecoverySearchTargets)[0]?.card;
  if (!target?.definitionId) return undefined;
  return {
    sourceCardInstanceId,
    sourceDefinitionId,
    searchFilter,
    targetCardInstanceId: target.instanceId,
    targetDefinitionId: target.definitionId,
    targetPurpose: "generic_heap_recovery",
    plannedAtStateVersion: input.playerView.stateVersion,
  };
}

function runnerRecoveryScoringInput(
  input: AiDecisionInput,
  target: VisibleCard,
  candidate: ActionSemanticCandidate,
): AiDecisionInput {
  return {
    ...input,
    playerView: {
      ...input.playerView,
      own: {
        ...input.playerView.own,
        gripOrHq: [
          ...input.playerView.own.gripOrHq.filter(
            (card) =>
              candidate.actionType !== "play_event" ||
              card.instanceId !== candidate.sourceCardInstanceId,
          ),
          target,
        ],
        heapOrArchives: input.playerView.own.heapOrArchives.filter(
          (card) => card.instanceId !== target.instanceId,
        ),
      },
    },
  };
}

function compareRunnerRecoverySearchTargets(
  left: { card: VisibleCard; score: DiscardChoiceKeepScore },
  right: { card: VisibleCard; score: DiscardChoiceKeepScore },
): number {
  return (
    runnerRecoveryPlanDispositionRank(right.score.planDisposition) -
      runnerRecoveryPlanDispositionRank(left.score.planDisposition) ||
    right.score.total - left.score.total ||
    (left.card.title ?? "").localeCompare(right.card.title ?? "", "de") ||
    left.card.instanceId.localeCompare(right.card.instanceId)
  );
}

function runnerRecoveryPlanDispositionRank(
  disposition: DiscardChoiceKeepScore["planDisposition"],
): number {
  switch (disposition) {
    case "current_plan_route":
      return 5;
    case "support_for_need":
    case "campaign_hold":
      return 4;
    case "blocked_but_developable":
      return 3;
    case "redundant":
      return 2;
    case "currently_dead":
    case "discard_candidate":
      return 1;
    case "assessment_unknown":
    case undefined:
      return 0;
  }
}
