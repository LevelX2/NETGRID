import { legalActionCreditCost } from "../../runtime/legal-action-credit-cost";
import { runnerCandidateSourceDefinitionId } from "../../runtime/runner-action-source-facts";
import { uniqueBy } from "../../runtime/collection";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";
import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { rolesForDeckDoctrineCard } from "../../deck-doctrine-card-roles";
import type {
  BreakerCapability,
  DeckCapabilityProfile,
} from "../../deck-capabilities";
import type { RunnerRunTargetEvaluation } from "../../runner-run-target-evaluation";
import { runnerEffectsProvideTopTrashRecovery } from "../../runner-canonical-hint-semantics";
import { runnerDrawTaxLiabilityProjection } from "../../runtime/runner-draw-tax-liability-score";
import { type RunnerHandRotationAssessment } from "../../runtime/runner-hand-rotation-assessment";
import { type RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";
import { visibleCardCoversRequiredCoverage } from "./runner-search-coverage-need";
import { runnerTerminalContestThreat } from "../../runtime/runner-terminal-contest-threat";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import { runnerBreakerCapabilityCoversRole } from "./coverage-card-facts";
import { coverageKindForPlanRole } from "./coverage-card-facts";
import type { RunnerCoverageServices } from "./coverage-services";
export function runnerCoverageGapIsTerminalRemoteThreat(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  if (evaluation.targetKind !== "remote") return false;
  const terminalThreat = runnerTerminalContestThreat(input);
  if (!terminalThreat) return false;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === evaluation.targetServerId,
  );
  const visiblyAdvancedRoot =
    server?.root.some(
      (card) =>
        (card.known === false || card.type === "agenda") &&
        (card.advancementCounters ?? 0) > 0,
    ) === true;
  const repeatedMatchpointRemote = terminalThreat.remoteServerIds.includes(
    evaluation.targetServerId,
  );
  if (!visiblyAdvancedRoot && !repeatedMatchpointRemote) {
    return false;
  }
  return (
    terminalThreat.kind === "opponent_matchpoint" || repeatedMatchpointRemote
  );
}

export function runnerUrgentRemoteCoverageConversionQuote(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  evaluation: RunnerRunTargetEvaluation,
  visibleAnswer: VisibleCard | undefined,
  answerInstallCost: number | undefined,
  installActionIds: readonly string[] | undefined,
  services: RunnerCoverageServices,
): RunnerCoverageGapSignal["sameTurnRunConversion"] | undefined {
  if (
    evaluation.targetKind !== "remote" ||
    !evaluation.scoreThreat ||
    evaluation.accessPayoffContestable === false ||
    (evaluation.pathPassability !== "blocked_missing_coverage" &&
      evaluation.pathPassability !== "blocked_unbreakable") ||
    !visibleAnswer ||
    !Number.isSafeInteger(answerInstallCost) ||
    (answerInstallCost ?? -1) < 0
  ) {
    return undefined;
  }
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === evaluation.targetServerId,
  );
  if (
    !server ||
    server.ice.length === 0 ||
    server.ice.some((ice) => !ice.known || ice.rezzed !== true)
  ) {
    return undefined;
  }
  const installRoute = runnerUrgentCoverageInstallProjection(
    input,
    visibleAnswer,
    answerInstallCost as number,
    installActionIds,
  );
  const runAction = input.legalActions.find(
    (action) => action.actionId === evaluation.actionId,
  );
  const runClickCost = runAction?.costs.reduce(
    (sum, cost) => sum + Math.max(0, cost.clicks ?? 0),
    0,
  );
  if (!installRoute || !runAction || !runClickCost || runClickCost <= 0) {
    return undefined;
  }
  const requiredClicksAfterFunding = installRoute.clickCost + runClickCost;
  if (input.playerView.own.clicks < requiredClicksAfterFunding) {
    return undefined;
  }
  const projectedPath = assessKnownRezzedIcePath(
    server.ice,
    [...(input.playerView.own.rig ?? []), visibleAnswer],
    Number.MAX_SAFE_INTEGER,
    server.root,
    input.playerView.opponent.credits,
  );
  const projectedKnownPathCost = projectedPath.visibleBreakCost ?? 0;
  if (
    !projectedPath.canReachAccess ||
    projectedPath.blocked ||
    (projectedPath.futureClicksLost ?? 0) > 0 ||
    !Number.isSafeInteger(projectedKnownPathCost) ||
    projectedKnownPathCost < 0
  ) {
    return undefined;
  }
  const requiredCreditsWithoutFloor =
    (answerInstallCost as number) +
    legalActionCreditCost(runAction) +
    projectedKnownPathCost;
  const remainingFundingClicks = Math.max(
    0,
    input.playerView.own.clicks - requiredClicksAfterFunding,
  );
  const fundingCanReach = (targetCredits: number): boolean =>
    targetCredits <= input.playerView.own.credits ||
    services.runnerExactFundingRouteContract(input, candidates, {
      demandId: `urgent-remote-coverage-projection:${evaluation.actionId}`,
      sourcePlanId: `runner.rig_and_coverage:urgent-remote-coverage-projection:${evaluation.targetServerId}`,
      purpose: "breaker_for_current_plan",
      priority: "current_foreground_plan",
      hardness: "hard",
      deadline: "end_of_current_turn",
      targetCredits,
      remainingClicks: remainingFundingClicks,
      evidence: [
        `urgent_remote_coverage_projection:${evaluation.targetServerId}`,
        `coverage_conversion_clicks_reserved:${requiredClicksAfterFunding}`,
      ],
    }).routeActionIds.length > 0;
  const postRunCreditFloor = fundingCanReach(requiredCreditsWithoutFloor + 1)
    ? 1
    : fundingCanReach(requiredCreditsWithoutFloor)
      ? 0
      : undefined;
  if (postRunCreditFloor === undefined) return undefined;
  const requiredCredits = requiredCreditsWithoutFloor + postRunCreditFloor;
  if (!Number.isSafeInteger(requiredCredits) || requiredCredits < 0) {
    return undefined;
  }
  return {
    targetRunActionId: evaluation.actionId,
    requiredCredits,
    requiredClicksAfterFunding,
    projectedKnownPathCost,
    postRunCreditFloor,
    installProjection: installRoute.projection,
  };
}

export function runnerUrgentCoverageInstallProjection(
  input: AiDecisionInput,
  visibleAnswer: VisibleCard,
  answerInstallCost: number,
  installActionIds: readonly string[] | undefined,
):
  | {
      clickCost: number;
      projection:
        | "current_legal_action"
        | "card_spec_requires_rematerialization";
    }
  | undefined {
  const currentRoute = (installActionIds ?? [])
    .flatMap((actionId) => {
      const action = input.legalActions.find(
        (candidate) => candidate.actionId === actionId,
      );
      if (!action) return [];
      const clickCost = action.costs.reduce(
        (sum, cost) => sum + Math.max(0, cost.clicks ?? 0),
        0,
      );
      return clickCost > 0 ? [{ actionId, clickCost }] : [];
    })
    .sort(
      (left, right) =>
        left.clickCost - right.clickCost ||
        left.actionId.localeCompare(right.actionId),
    )[0];
  if (currentRoute) {
    return {
      clickCost: currentRoute.clickCost,
      projection: "current_legal_action",
    };
  }

  const definition = visibleAnswer.definitionId
    ? CARD_DEFINITIONS_BY_ID[visibleAnswer.definitionId]
    : undefined;
  const memoryCost = definition?.memoryCost;
  const memoryUsed = input.playerView.own.memoryUsed;
  const memoryLimit = input.playerView.own.memoryLimit;
  const cardIsStillInHand = input.playerView.own.gripOrHq.some(
    (card) => card.instanceId === visibleAnswer.instanceId,
  );
  if (
    !cardIsStillInHand ||
    definition?.side !== "runner" ||
    definition.type !== "program" ||
    !Number.isSafeInteger(definition.installCost) ||
    definition.installCost !== answerInstallCost ||
    input.playerView.own.credits >= answerInstallCost ||
    !Number.isSafeInteger(memoryCost) ||
    !Number.isSafeInteger(memoryUsed) ||
    !Number.isSafeInteger(memoryLimit) ||
    (memoryUsed as number) + (memoryCost as number) > (memoryLimit as number)
  ) {
    return undefined;
  }
  return {
    clickCost: 1,
    projection: "card_spec_requires_rematerialization",
  };
}

export function runnerCoverageFundingActionIds(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  gapId: string,
  targetCredits: number | undefined,
  fundingGap: number | undefined,
  allowIncrementalProgress: boolean,
  requiredClicksAfterFunding = 1,
  services: RunnerCoverageServices,
): string[] {
  if (
    targetCredits === undefined ||
    fundingGap === undefined ||
    fundingGap <= 0
  ) {
    return [];
  }
  return services.runnerExactFundingRouteContract(input, candidates, {
    demandId: `${gapId}:fund-answer`,
    sourcePlanId: `runner.rig_and_coverage:${gapId}`,
    purpose: "breaker_for_current_plan",
    priority: "current_foreground_plan",
    hardness: "hard",
    deadline: "end_of_current_turn",
    targetCredits,
    remainingClicks: Math.max(
      0,
      input.playerView.own.clicks - requiredClicksAfterFunding,
    ),
    allowIncrementalProgress,
    allowStrategicExchange: !allowIncrementalProgress,
    evidence: [
      `coverage_gap:${gapId}`,
      `coverage_conversion_clicks_reserved:${requiredClicksAfterFunding}`,
    ],
  }).routeActionIds;
}

export function coverageSupportActionIds(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  deckCapabilities: DeckCapabilityProfile,
  requiredRole: RunnerCoverageGapSignal["requiredRole"],
  options: Readonly<{
    deckHasStackAnswerOverride?: boolean;
    targetDefinitionIdOverride?: string;
    handRotation?: RunnerHandRotationAssessment;
    terminalRemoteCoverageThreat?: boolean;
  }> = {},
): Pick<
  RunnerCoverageGapSignal,
  | "directSearchActionIds"
  | "directSearchChoiceBindings"
  | "rejectedSearchActionIds"
  | "searchEngineSetupActionIds"
  | "drawForAnswerActionIds"
> {
  const deckHasStackAnswer =
    options.deckHasStackAnswerOverride ??
    runnerDeckHasCoverageAnswer(deckCapabilities, requiredRole);
  const targetDefinitionId =
    options.targetDefinitionIdOverride ??
    runnerPreferredCoverageSearchDefinitionId(deckCapabilities, requiredRole);
  const targetBreaker = targetDefinitionId
    ? deckCapabilities.runner?.breakerInventory.find(
        (breaker) => breaker.cardId === targetDefinitionId,
      )
    : undefined;
  const recoveryBindings = candidates.flatMap((candidate) => {
    const target = runnerCoverageRecoveryTarget(input, candidate, requiredRole);
    return target ? [{ candidate, target }] : [];
  });
  const searchTools = (
    deckCapabilities.runner?.searchAccess.tools ?? []
  ).filter((tool) => tool.canSearchBreakers);
  const searchToolIds = new Set(searchTools.map((tool) => tool.cardId));
  const matchingStackSearchCandidates = candidates.filter((candidate) => {
    const sourceDefinitionId = runnerCandidateSourceDefinitionId(
      input,
      candidate,
    );
    return (
      sourceDefinitionId !== undefined &&
      searchToolIds.has(sourceDefinitionId) &&
      candidate.semanticActionType !== "install.card" &&
      runnerCoverageSearchTargetIsPayable(input, candidate, targetBreaker)
    );
  });
  const stackSearchCandidates = deckHasStackAnswer
    ? matchingStackSearchCandidates
    : [];
  const directSearchCandidates = uniqueBy(
    [
      ...stackSearchCandidates,
      ...recoveryBindings.map((binding) => binding.candidate),
    ],
    (candidate) => candidate.actionId,
  );
  const recoveryByActionId = new Map(
    recoveryBindings.map((binding) => [
      binding.candidate.actionId,
      binding.target,
    ]),
  );
  const matchingSearchActionIds = new Set([
    ...matchingStackSearchCandidates.map((candidate) => candidate.actionId),
    ...recoveryBindings.map((binding) => binding.candidate.actionId),
  ]);
  const searchEngineSetupCandidates = (
    deckHasStackAnswer ? candidates : []
  ).filter((candidate) => {
    const sourceDefinitionId = runnerCandidateSourceDefinitionId(
      input,
      candidate,
    );
    return (
      candidate.semanticActionType === "install.card" &&
      sourceDefinitionId !== undefined &&
      searchToolIds.has(sourceDefinitionId)
    );
  });
  const searchEngineSetupActionIds = new Set(
    searchEngineSetupCandidates.map((candidate) => candidate.actionId),
  );
  const cardDrawForAnswerCandidates = (
    deckHasStackAnswer ? candidates : []
  ).filter(
    (candidate) =>
      !matchingSearchActionIds.has(candidate.actionId) &&
      !searchEngineSetupActionIds.has(candidate.actionId) &&
      candidate.sourceKind === "card" &&
      (candidate.tagEffectProfile?.acuteTagRemoval !== true ||
        input.playerView.own.tags <= 0) &&
      (candidate.semanticActionType === "draw.card" ||
        (candidate.semanticActionType === "play.runner_event" &&
          (candidate.actionTacticSignals.includes("draw.card") ||
            candidate.actionTacticSignals.includes("setup.draw"))) ||
        (candidate.economyProjection?.cardsDrawn ?? 0) > 1),
  );
  const safeCardDrawForAnswerCandidates = cardDrawForAnswerCandidates.filter(
    (candidate) => {
      const action = input.legalActions.find(
        (legalAction) => legalAction.actionId === candidate.actionId,
      );
      return (
        action !== undefined &&
        runnerDrawTaxLiabilityProjection(input, action, candidate)
          .projectedTagsAdded === 0
      );
    },
  );
  const rejectedTaxedDrawExists =
    safeCardDrawForAnswerCandidates.length < cardDrawForAnswerCandidates.length;
  const safeBasicDrawSubstitutes = rejectedTaxedDrawExists
    ? candidates.filter((candidate) => {
        if (candidate.semanticActionType !== "draw.card") return false;
        const action = input.legalActions.find(
          (legalAction) => legalAction.actionId === candidate.actionId,
        );
        return (
          action?.type === "draw_card" &&
          action.source === "basic_action" &&
          runnerDrawTaxLiabilityProjection(input, action, candidate)
            .projectedTagsAdded === 0
        );
      })
    : [];
  const sideSafeRoleBasicDraws =
    deckHasStackAnswer &&
    (options.handRotation?.exactKnownNeedDrawAdmissible === true ||
      (options.terminalRemoteCoverageThreat === true &&
        options.handRotation?.stackHasCards === true)) &&
    directSearchCandidates.length === 0 &&
    searchEngineSetupCandidates.length === 0
      ? candidates.filter((candidate) => {
          if (candidate.semanticActionType !== "draw.card") return false;
          const action = input.legalActions.find(
            (legalAction) => legalAction.actionId === candidate.actionId,
          );
          return (
            action?.type === "draw_card" &&
            action.source === "basic_action" &&
            runnerDrawTaxLiabilityProjection(input, action, candidate)
              .projectedTagsAdded === 0
          );
        })
      : [];
  return {
    directSearchActionIds: directSearchCandidates.map(
      (candidate) => candidate.actionId,
    ),
    directSearchChoiceBindings: directSearchCandidates.flatMap((candidate) => {
      const legalAction = input.legalActions.find(
        (action) => action.actionId === candidate.actionId,
      );
      const sourceCardInstanceId =
        candidate.sourceCardInstanceId ?? legalAction?.source;
      const sourceDefinitionId = runnerCandidateSourceDefinitionId(
        input,
        candidate,
      );
      const recoveryTarget = recoveryByActionId.get(candidate.actionId);
      return sourceCardInstanceId && sourceDefinitionId
        ? [
            {
              actionId: candidate.actionId,
              sourceCardInstanceId,
              sourceDefinitionId,
              ...(recoveryTarget
                ? {
                    targetCardInstanceId: recoveryTarget.instanceId,
                    ...(recoveryTarget.definitionId
                      ? {
                          targetDefinitionId: recoveryTarget.definitionId,
                        }
                      : {}),
                  }
                : targetDefinitionId
                  ? { targetDefinitionId }
                  : {}),
            },
          ]
        : [];
    }),
    rejectedSearchActionIds: deckHasStackAnswer
      ? []
      : matchingStackSearchCandidates
          .filter((candidate) => !recoveryByActionId.has(candidate.actionId))
          .map((candidate) => candidate.actionId),
    searchEngineSetupActionIds: searchEngineSetupCandidates.map(
      (candidate) => candidate.actionId,
    ),
    drawForAnswerActionIds: [
      ...safeCardDrawForAnswerCandidates,
      ...safeBasicDrawSubstitutes,
      ...sideSafeRoleBasicDraws,
    ].map((candidate) => candidate.actionId),
  };
}

export function runnerCoverageSearchTargetIsPayable(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  targetBreaker: BreakerCapability | undefined,
): boolean {
  const installEffects = (candidate.functionalEffects ?? []).filter(
    (effect) =>
      effect.kind === "install" &&
      effect.scope === "installed_card" &&
      effect.target === "program",
  );
  if (installEffects.length === 0) return true;
  const installCostModes = new Set(
    installEffects.flatMap((effect) =>
      effect.installCost ? [effect.installCost] : [],
    ),
  );
  if (installCostModes.size !== 1) return false;
  if (installCostModes.has("free")) return true;
  if (
    !installCostModes.has("normal") ||
    targetBreaker?.installCost === undefined ||
    !Number.isSafeInteger(targetBreaker.installCost) ||
    targetBreaker.installCost < 0
  ) {
    return false;
  }
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  if (!action) return false;
  const sourceCreditCost = action.costs.reduce(
    (total, cost) => total + Math.max(0, cost.credits ?? 0),
    0,
  );
  return (
    input.playerView.own.credits >= sourceCreditCost + targetBreaker.installCost
  );
}

export function runnerPreferredCoverageSearchDefinitionId(
  deckCapabilities: DeckCapabilityProfile,
  requiredRole: RunnerCoverageGapSignal["requiredRole"],
): string | undefined {
  return (deckCapabilities.runner?.breakerInventory ?? [])
    .filter(
      (breaker) =>
        breaker.confidence === "high" &&
        breaker.quantityKnownInDeck > 0 &&
        breaker.locations.includes("in_deck") &&
        runnerBreakerCapabilityCoversRole(breaker, requiredRole),
    )
    .sort(
      (left, right) =>
        (left.installCost ?? Number.POSITIVE_INFINITY) -
          (right.installCost ?? Number.POSITIVE_INFINITY) ||
        left.cardId.localeCompare(right.cardId),
    )[0]?.cardId;
}

export function runnerCoverageRecoveryTarget(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  requiredRole: RunnerCoverageGapSignal["requiredRole"],
): VisibleCard | undefined {
  if (
    candidate.semanticActionType === "install.card" ||
    (candidate.actionType !== "play_event" &&
      candidate.actionType !== "activated_card_ability" &&
      candidate.actionType !== "trigger_ability")
  ) {
    return undefined;
  }
  const sourceDefinitionId = runnerCandidateSourceDefinitionId(
    input,
    candidate,
  );
  const hint = sourceDefinitionId
    ? AI_HINTS_BY_CARD.get(sourceDefinitionId)
    : undefined;
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  const declaredRecoveryKind =
    action?.payload?.cardImplementationEffectKind === "search_trash_to_grip"
      ? "search"
      : undefined;
  const recoveryKind = runnerEffectsProvideTopTrashRecovery(
    candidate.functionalEffects,
  )
    ? "top"
    : (declaredRecoveryKind ??
      (hint?.functionSignals?.includes("setup.card_recovery") === true ||
      hint?.functionSignals?.includes("setup.recovery") === true ||
      hint?.functionSignals?.includes("setup.temporary_program_install") ===
        true
        ? "search"
        : undefined));
  if (!recoveryKind) return undefined;
  const exactTargetCardId =
    typeof action?.payload?.targetCardId === "string"
      ? action.payload.targetCardId
      : typeof action?.payload?.cardImplementationTopTrashTargetId === "string"
        ? action.payload.cardImplementationTopTrashTargetId
        : undefined;
  const visibleHeapCards = input.playerView.own.heapOrArchives.filter(
    (card) => card.known,
  );
  const targets =
    recoveryKind === "top" || exactTargetCardId
      ? visibleHeapCards.filter((card) => card.instanceId === exactTargetCardId)
      : visibleHeapCards;
  return targets.find((card) =>
    visibleCardCoversRequiredCoverage(card, requiredRole, (cardId) =>
      rolesForDeckDoctrineCard(cardId ?? ""),
    ),
  );
}

export function runnerDeckHasCoverageAnswer(
  deckCapabilities: DeckCapabilityProfile,
  requiredRole: RunnerCoverageGapSignal["requiredRole"],
): boolean {
  const requiredCoverage = coverageKindForPlanRole(requiredRole);
  return (
    deckCapabilities.runner?.breakerInventory.some(
      (breaker) =>
        (breaker.coverage.includes(requiredCoverage) ||
          breaker.coverage.includes("universal")) &&
        breaker.quantityKnownInDeck > 0 &&
        (breaker.locations.includes("in_deck") ||
          breaker.locations.includes("in_hand")),
    ) ?? false
  );
}
