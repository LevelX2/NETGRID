import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";
import { type CorpPlanDomain } from "../../plans/corp-tactical-plan-contracts";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import {
  type EngineWindowResolution,
  type PlanSchedulerContext,
  type PlanSchedulerResult,
} from "../../plans/plan-scheduler";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { selectableChoiceOptions } from "../../runtime/choice-option";
import { corpArchivesToHqOperationProfile } from "../../runtime/corp-canonical-card-facts";
import { selectedCorpDiscardChoiceOptionIds } from "../../runtime/corp-discard-choice-selection";
import { corpHandDispositionScore } from "./hand-disposition-score";
import { discardOptionInstanceId } from "../../runtime/discard-choice-option";
import type { DiscardKeepScorer } from "../../runtime/discard-choice-selection";
import {
  selectedDiscardChoiceOptionIds,
  type DiscardChoiceKeepScore,
} from "../../runtime/discard-choice-selection";
import { type CorpHandManagementSignal } from "./hand-management-types";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { isExactScoreRecoveryChoiceOwner } from "../score/score-recovery-choice-owner";

export function bindSelectedCorpArchivesToHqChoiceContinuation(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
  candidates: readonly ActionSemanticCandidate[],
  discardKeepScore: DiscardKeepScorer | undefined,
): void {
  if (input.side !== "corp" || result.lane !== "plan") return;
  const selectedAction = input.legalActions.find(
    (action) => action.actionId === result.route.head.actionId,
  );
  const selectedCandidate = candidates.find(
    (candidate) => candidate.actionId === result.route.head.actionId,
  );
  const profile = corpArchivesToHqOperationProfile(
    selectedCandidate?.sourceDefinitionId,
  );
  if (!profile) return;

  const rootPlanInstanceId = result.portfolio.rootForegroundInstanceId;
  const executorInstanceId = result.portfolio.executorInstanceId;
  const executor = result.portfolio.instances.find(
    (instance) => instance.instanceId === executorInstanceId,
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?:
          | CorpPlanDomain["handManagement"][number]
          | CorpScoreProjectSignal;
      }
    | undefined;
  const signal = moduleState?.signal;
  const scoreSignal =
    moduleState?.kind === "score"
      ? (signal as CorpScoreProjectSignal)
      : undefined;
  const scoreBinding = scoreSignal?.recoveryChoiceBinding;
  const exactScoreOwner =
    executor?.moduleId === "corp.score_agenda" &&
    scoreSignal?.phase === "recover_score_support" &&
    scoreSignal.sameTurnCloseout === true &&
    scoreSignal.terminalScore === true &&
    scoreBinding?.stateVersion === input.playerView.stateVersion &&
    scoreBinding.sourceCardId === selectedCandidate?.sourceCardInstanceId;
  const source = selectedCandidate?.sourceCardInstanceId
    ? input.playerView.own.gripOrHq.find(
        (card) => card.instanceId === selectedCandidate.sourceCardInstanceId,
      )
    : undefined;
  const sourceDefinitionId = source?.definitionId;
  const exactOwningRoute =
    (exactScoreOwner ||
      (executor?.moduleId === "corp.hand_and_agenda_management" &&
        moduleState?.kind === "hand" &&
        signal?.phase === "resolve_hq_overflow")) &&
    executor.executionState === "executor" &&
    signal?.actionIds?.includes(result.route.head.actionId) === true &&
    rootPlanInstanceId !== undefined &&
    executorInstanceId !== undefined &&
    selectedAction?.side === "corp" &&
    selectedAction.type === "play_operation" &&
    selectedAction.source === selectedCandidate?.sourceCardInstanceId &&
    selectedAction.expiresAtStateVersion === input.playerView.stateVersion &&
    selectedCandidate?.sourceKind === "card" &&
    source?.known === true &&
    sourceDefinitionId === selectedCandidate.sourceDefinitionId &&
    selectedCandidate.sourceDefinitionId !== undefined &&
    result.portfolio.instances.some(
      (instance) =>
        instance.instanceId === rootPlanInstanceId && instance.side === "corp",
    );
  if (!exactOwningRoute || !selectedAction || !selectedCandidate) return;
  if (!discardKeepScore && !exactScoreOwner) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [selectedAction.actionId],
      owner: "plan_module",
      planInstanceId: executor.instanceId,
      stepId: result.route.head.stepId,
      removalCondition:
        "The Corp hand plan must provide its generic keep-value scorer before binding an Archives-to-HQ target.",
    });
  }
  const eligibleScoreCards = input.playerView.own.heapOrArchives.filter(
    (card) =>
      card.known &&
      typeof card.definitionId === "string" &&
      (profile.filterCardType === undefined ||
        card.type === profile.filterCardType),
  );
  const selection = exactScoreOwner
    ? profile.maxSelections === 1 &&
      scoreBinding &&
      eligibleScoreCards.some(
        (card) => card.instanceId === scoreBinding.recoveredCardId,
      )
      ? {
          eligibleCardInstanceIds: eligibleScoreCards.map(
            (card) => card.instanceId,
          ),
          selectedCardInstanceIds: [scoreBinding.recoveredCardId],
        }
      : undefined
    : selectedCorpArchivesToHqCards(input, profile, discardKeepScore!);
  if (!selection) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [selectedAction.actionId],
      owner: "continuation",
      planInstanceId: executor.instanceId,
      stepId: result.route.head.stepId,
      removalCondition:
        "Bind an Archives-to-HQ continuation only from complete canonical source effects and the exact current known Archives card set.",
    });
  }
  result.portfolio.selectedActionOrigin = {
    rootPlanInstanceId,
    executorInstanceId,
    selectedActionId: selectedAction.actionId,
    selectedAtStateVersion: input.playerView.stateVersion,
    immediateChoicePolicy: "select_bound_corp_archives_cards_to_hq",
    sourceCardInstanceId: source.instanceId,
    sourceCardDefinitionId: sourceDefinitionId!,
    selectionMode: profile.maxSelections === "all" ? "all" : "one",
    eligibleArchiveCardInstanceIds: selection.eligibleCardInstanceIds,
    selectedArchiveCardInstanceIds: selection.selectedCardInstanceIds,
  };
}

function selectedCorpArchivesToHqCards(
  input: AiDecisionInput,
  profile: NonNullable<ReturnType<typeof corpArchivesToHqOperationProfile>>,
  discardKeepScore: DiscardKeepScorer,
):
  | {
      eligibleCardInstanceIds: string[];
      selectedCardInstanceIds: string[];
    }
  | undefined {
  const eligible = input.playerView.own.heapOrArchives.filter(
    (card) =>
      card.known === true &&
      typeof card.definitionId === "string" &&
      (profile.filterCardType === undefined ||
        card.type === profile.filterCardType),
  );
  if (
    eligible.length === 0 ||
    new Set(eligible.map((card) => card.instanceId)).size !== eligible.length
  ) {
    return undefined;
  }
  const scoringInput: AiDecisionInput = {
    ...input,
    playerView: {
      ...input.playerView,
      own: {
        ...input.playerView.own,
        gripOrHq: [
          ...input.playerView.own.gripOrHq,
          ...eligible.filter(
            (archiveCard) =>
              !input.playerView.own.gripOrHq.some(
                (handCard) => handCard.instanceId === archiveCard.instanceId,
              ),
          ),
        ],
      },
    },
  };
  const ranked = eligible
    .map((card) => ({ card, score: discardKeepScore(scoringInput, card) }))
    .sort(compareCorpArchivesToHqCandidates);
  const selected =
    profile.maxSelections === "all"
      ? ranked
      : ranked.length > 0
        ? [ranked[0]!]
        : [];
  if (selected.length === 0) return undefined;
  return {
    eligibleCardInstanceIds: eligible.map((card) => card.instanceId),
    selectedCardInstanceIds: selected.map((entry) => entry.card.instanceId),
  };
}

function compareCorpArchivesToHqCandidates(
  left: { card: VisibleCard; score: DiscardChoiceKeepScore },
  right: { card: VisibleCard; score: DiscardChoiceKeepScore },
): number {
  return (
    corpArchiveRetentionRank(right.score.planDisposition) -
      corpArchiveRetentionRank(left.score.planDisposition) ||
    right.score.total - left.score.total ||
    (left.card.title ?? "").localeCompare(right.card.title ?? "", "de") ||
    left.card.instanceId.localeCompare(right.card.instanceId)
  );
}

function corpArchiveRetentionRank(
  disposition: DiscardChoiceKeepScore["planDisposition"],
): number {
  switch (disposition) {
    case "current_plan_route":
      return 5;
    case "support_for_need":
    case "campaign_hold":
      return 4;
    case "blocked_but_developable":
      return 2;
    case "assessment_unknown":
      return 1;
    case "redundant":
    case "currently_dead":
    case "discard_candidate":
    case undefined:
      return 0;
  }
}

export function corpDiscardWindowSignal(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  discardKeepScore: DiscardKeepScorer | undefined,
): CorpHandManagementSignal | undefined {
  const selection = corpHandChoiceSelection(
    input,
    candidates,
    discardKeepScore,
    "discard",
  );
  if (!selection) return undefined;
  const { choice, resolveAction } = selection;
  return {
    handPlanId: `discard-window:${choice.choiceId}:${input.playerView.stateVersion}`,
    phase: "discard_window",
    actionIds: [resolveAction.actionId],
    exactActionRoute: true,
    agendaCount: input.playerView.own.gripOrHq.filter(
      (card) =>
        card.known &&
        (card.type === "agenda" ||
          (card.definitionId !== undefined &&
            CARD_DEFINITIONS_BY_ID[card.definitionId]?.type === "agenda")),
    ).length,
    handSize: input.playerView.own.gripOrHq.length,
    maximumHandSize: input.playerView.own.maxHandSize,
    concretePurposeCode:
      "Resolve the current Corp overflow with the plan-bound lowest keep-value cards.",
    priorityClass: "P5",
    routeAllowed: true,
    discardChoiceBinding: {
      actionId: resolveAction.actionId,
      choiceId: choice.choiceId,
      observedAtStateVersion: input.playerView.stateVersion,
      selectedOptionIds: selection.selectedOptionIds,
      discardedCardInstanceIds: selection.selectedCardInstanceIds,
      retainedCardInstanceIds: selection.retainedCardInstanceIds,
      evidenceCodes: [
        "corp_discard_owned_by_hand_plan",
        "corp_discard_selection_bound_to_current_choice",
        "corp_discard_ranked_by_plan_protection_and_batch_exposure",
      ],
    },
    value: 1_000,
    evidenceCode: "corp_discard_owned_by_hand_plan",
  };
}

export function corpStrategicPlanningGroupDrawChoiceSignal(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  discardKeepScore: DiscardKeepScorer | undefined,
): CorpHandManagementSignal | undefined {
  const selection = corpHandChoiceSelection(
    input,
    candidates,
    discardKeepScore,
    "strategic_planning_group",
  );
  if (!selection) return undefined;
  const { choice, resolveAction } = selection;
  return {
    handPlanId: `spg-draw-filter:${choice.choiceId}:${input.playerView.stateVersion}`,
    phase: "draw_filter_window",
    actionIds: [resolveAction.actionId],
    exactActionRoute: true,
    agendaCount: input.playerView.own.gripOrHq.filter(
      (card) =>
        card.known &&
        (card.type === "agenda" ||
          (card.definitionId !== undefined &&
            CARD_DEFINITIONS_BY_ID[card.definitionId]?.type === "agenda")),
    ).length,
    handSize: input.playerView.own.gripOrHq.length,
    maximumHandSize: input.playerView.own.maxHandSize,
    concretePurposeCode:
      "Resolve Strategic Planning Group by bottoming the lowest keep-value card from the exact draw.",
    priorityClass: "P5",
    routeAllowed: true,
    drawFilterChoiceBinding: {
      actionId: resolveAction.actionId,
      choiceId: choice.choiceId,
      observedAtStateVersion: input.playerView.stateVersion,
      selectedOptionIds: selection.selectedOptionIds,
      bottomedCardInstanceIds: selection.selectedCardInstanceIds,
      retainedCardInstanceIds: selection.retainedCardInstanceIds,
      evidenceCodes: [
        "corp_spg_draw_filter_owned_by_hand_plan",
        "corp_spg_draw_filter_bound_to_current_choice",
        "corp_spg_draw_filter_ranked_by_generic_keep_value",
      ],
    },
    value: 1_000,
    evidenceCode: "corp_spg_draw_filter_owned_by_hand_plan",
  };
}

export function corpCorporateShuffleHqChoiceSignal(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  discardKeepScore: DiscardKeepScorer | undefined,
): CorpHandManagementSignal | undefined {
  const selection = corpHandChoiceSelection(
    input,
    candidates,
    discardKeepScore,
    "corporate_shuffle",
  );
  if (!selection) return undefined;
  const { choice, resolveAction } = selection;
  return {
    handPlanId: `corporate-shuffle-hq:${choice.choiceId}:${input.playerView.stateVersion}`,
    phase: "hq_shuffle_window",
    actionIds: [resolveAction.actionId],
    exactActionRoute: true,
    agendaCount: input.playerView.own.gripOrHq.filter(
      (card) =>
        card.known &&
        (card.type === "agenda" ||
          (card.definitionId !== undefined &&
            CARD_DEFINITIONS_BY_ID[card.definitionId]?.type === "agenda")),
    ).length,
    handSize: input.playerView.own.gripOrHq.length,
    maximumHandSize: input.playerView.own.maxHandSize,
    concretePurposeCode:
      "Complete Corporate Shuffle by returning the lowest keep-value HQ card to R&D.",
    priorityClass: "P5",
    routeAllowed: true,
    hqShuffleChoiceBinding: {
      actionId: resolveAction.actionId,
      choiceId: choice.choiceId,
      observedAtStateVersion: input.playerView.stateVersion,
      selectedOptionIds: selection.selectedOptionIds,
      shuffledCardInstanceIds: selection.selectedCardInstanceIds,
      retainedCardInstanceIds: selection.retainedCardInstanceIds,
      evidenceCodes: [
        "corp_corporate_shuffle_hq_owned_by_hand_plan",
        "corp_corporate_shuffle_hq_bound_to_current_choice",
        "corp_corporate_shuffle_hq_ranked_by_generic_keep_value",
      ],
    },
    value: 1_000,
    evidenceCode: "corp_corporate_shuffle_hq_owned_by_hand_plan",
  };
}

function corpHandChoiceSelection(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  discardKeepScore: DiscardKeepScorer | undefined,
  kind: "discard" | "strategic_planning_group" | "corporate_shuffle",
):
  | {
      choice: NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>;
      resolveAction: AiDecisionInput["legalActions"][number];
      selectedOptionIds: string[];
      selectedCardInstanceIds: string[];
      retainedCardInstanceIds: string[];
    }
  | undefined {
  const choice = input.playerView.pendingChoice;
  const sourceMatches =
    kind === "discard"
      ? choice?.source === "discard_phase"
      : kind === "strategic_planning_group"
        ? choice?.source.startsWith(
            "card_implementation.strategic_planning_group_draw:",
          ) === true
        : choice?.source.startsWith("classic.corporate_shuffle_hq_to_rd:") ===
          true;
  if (
    input.side !== "corp" ||
    choice?.kind !== "select_cards" ||
    !sourceMatches
  )
    return undefined;

  const resolveAction = input.legalActions.find(
    (action) => action.type === "resolve_choice",
  );
  const exactCandidate = resolveAction
    ? candidates.find(
        (candidate) =>
          candidate.actionId === resolveAction.actionId &&
          candidate.semanticActionType === "choice.resolve",
      )
    : undefined;
  const label =
    kind === "discard"
      ? "discard"
      : kind === "strategic_planning_group"
        ? "Strategic Planning Group"
        : "Corporate Shuffle";
  if (!resolveAction || !exactCandidate || !discardKeepScore) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: input.legalActions.map((action) => action.actionId),
      owner: "plan_module",
      removalCondition: `The Corp hand plan requires the exact ${label} LegalAction, semantic candidate, and generic keep-value scorer.`,
    });
  }
  const selectableOptions = selectableChoiceOptions(choice.options);
  const choiceCards =
    kind === "strategic_planning_group"
      ? selectableOptions.flatMap((option) =>
          option.card?.known && option.card.definitionId ? [option.card] : [],
        )
      : [];
  const scoringInput =
    kind === "strategic_planning_group"
      ? {
          ...input,
          playerView: {
            ...input.playerView,
            own: {
              ...input.playerView.own,
              gripOrHq: [
                ...input.playerView.own.gripOrHq,
                ...choiceCards.filter(
                  (card) =>
                    !input.playerView.own.gripOrHq.some(
                      (handCard) => handCard.instanceId === card.instanceId,
                    ),
                ),
              ],
            },
          },
        }
      : input;
  const knownHandByInstanceId = new Map(
    scoringInput.playerView.own.gripOrHq
      .filter((card) => card.known && card.definitionId)
      .map((card) => [card.instanceId, card]),
  );
  const optionInstanceIds = selectableOptions.map(discardOptionInstanceId);
  if (
    optionInstanceIds.some(
      (instanceId) => !instanceId || !knownHandByInstanceId.has(instanceId),
    )
  ) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [resolveAction.actionId],
      owner: "plan_module",
      removalCondition: `Bind a Corp ${label} choice only when every selectable option maps to a known card in the exact current choice or HQ PlayerView.`,
    });
  }
  const corpDiscardBatch =
    kind === "discard"
      ? selectedCorpDiscardChoiceOptionIds(
          scoringInput,
          choice,
          selectableOptions,
          discardKeepScore,
        )
      : undefined;
  if (kind === "discard" && !corpDiscardBatch) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [resolveAction.actionId],
      owner: "plan_module",
      removalCondition:
        "The Corp hand plan requires known agenda points for every agenda in the exact discard batch; unknown cleanup exposure must remain fail-closed.",
    });
  }
  const selectedOptionIds =
    corpDiscardBatch?.selectedOptionIds ??
    selectedDiscardChoiceOptionIds(
      scoringInput,
      choice,
      selectableOptions,
      (decisionInput, card) =>
        corpHandDispositionScore({
          input: decisionInput,
          card,
          destination:
            kind === "discard"
              ? "archives"
              : kind === "strategic_planning_group"
                ? "rd_bottom"
                : "rd_shuffle",
          baseKeepScore: discardKeepScore(decisionInput, card),
        }),
    );
  const selectedOptionIdSet = new Set(selectedOptionIds);
  const selectedCardInstanceIds = selectableOptions
    .filter((option) => selectedOptionIdSet.has(option.id))
    .map(discardOptionInstanceId)
    .filter((instanceId): instanceId is string => instanceId !== undefined);
  const selectedCardInstanceIdSet = new Set(selectedCardInstanceIds);
  return {
    choice,
    resolveAction,
    selectedOptionIds,
    selectedCardInstanceIds,
    retainedCardInstanceIds: optionInstanceIds.filter(
      (instanceId): instanceId is string =>
        instanceId !== undefined && !selectedCardInstanceIdSet.has(instanceId),
    ),
  };
}

export function resolvePlanBoundCorpArchivesToHqChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  const choice = context.input.playerView.pendingChoice;
  if (
    context.input.side !== "corp" ||
    !choice?.source.startsWith("v1922.corp_archives_to_hq:")
  ) {
    return undefined;
  }
  const origin = previous?.selectedActionOrigin;
  const executor = previous?.instances.find(
    (instance) =>
      instance.instanceId === origin?.executorInstanceId &&
      instance.executionState === "executor",
  );
  const root = previous?.instances.find(
    (instance) => instance.instanceId === origin?.rootPlanInstanceId,
  );
  const choiceActions = context.input.legalActions.filter(
    (action) => action.type === "resolve_choice",
  );
  const action = choiceActions.length === 1 ? choiceActions[0] : undefined;
  const [requirement] = action?.choiceRequirements ?? [];
  const optionIds = choice.options.map((option) => option.id);
  const originIsArchivesToHq =
    origin?.immediateChoicePolicy === "select_bound_corp_archives_cards_to_hq";
  const expectedChoiceSource = originIsArchivesToHq
    ? `v1922.corp_archives_to_hq:${origin.sourceCardInstanceId}:${context.input.playerView.stateVersion}`
    : undefined;
  const expectedChoiceId = originIsArchivesToHq
    ? `v1922_corp_archives_to_hq_${context.input.playerView.stateVersion}`
    : undefined;
  const optionCardInstanceIds = choice.options.map((option) => option.value);
  const exactOptionSet =
    originIsArchivesToHq &&
    optionCardInstanceIds.every(
      (cardId): cardId is string => typeof cardId === "string",
    ) &&
    optionCardInstanceIds.length ===
      origin.eligibleArchiveCardInstanceIds.length &&
    new Set(optionCardInstanceIds).size === optionCardInstanceIds.length &&
    optionCardInstanceIds.every((cardId) =>
      origin.eligibleArchiveCardInstanceIds.includes(cardId),
    );
  const expectedMinimum = originIsArchivesToHq
    ? origin.selectionMode === "all"
      ? 0
      : 1
    : undefined;
  const expectedMaximum = originIsArchivesToHq
    ? origin.selectionMode === "all"
      ? origin.eligibleArchiveCardInstanceIds.length
      : 1
    : undefined;
  const exactBinding =
    originIsArchivesToHq &&
    choice.side === "corp" &&
    choice.kind === "select_cards" &&
    choice.choiceId === expectedChoiceId &&
    choice.source === expectedChoiceSource &&
    choice.visibility === "hidden_info_barrier" &&
    choice.stateVersion === context.input.playerView.stateVersion &&
    choice.minSelections === expectedMinimum &&
    choice.maxSelections === expectedMaximum &&
    exactOptionSet &&
    previous !== undefined &&
    previous.side === "corp" &&
    previous.stateVersion === context.input.playerView.stateVersion - 1 &&
    origin.selectedAtStateVersion === previous.stateVersion &&
    previous.rootForegroundInstanceId === origin.rootPlanInstanceId &&
    previous.executorInstanceId === origin.executorInstanceId &&
    root !== undefined &&
    root.side === "corp" &&
    (executor?.moduleId === "corp.hand_and_agenda_management" ||
      isExactScoreRecoveryChoiceOwner(
        executor,
        origin,
        previous.stateVersion,
      )) &&
    action !== undefined &&
    action.side === "corp" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === context.input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === choice.minSelections &&
    requirement.maxSelections === choice.maxSelections &&
    requirement.optionIds.length === optionIds.length &&
    optionIds.every((optionId) => requirement.optionIds.includes(optionId));
  if (!exactBinding || !action || !previous || !origin) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: choiceActions.map(
        (legalAction) => legalAction.actionId,
      ),
      owner: "continuation",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
      removalCondition:
        "Resolve Corp Archives-to-HQ only from the immediately preceding hand or exact score-recovery executor, selected source operation and complete current Engine choice contract.",
    });
  }
  return {
    actionId: action.actionId,
    reasonCode: "plan_bound_corp_archives_to_hq_choice",
    origin: {
      rootPlanInstanceId: origin.rootPlanInstanceId,
      leafPlanInstanceId: origin.executorInstanceId,
      side: "corp",
      windowKind: "mandatory_choice",
      windowId: choice.choiceId,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
    },
  };
}
