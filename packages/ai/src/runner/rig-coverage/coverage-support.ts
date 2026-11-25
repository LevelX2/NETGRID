import { visibleRunnerPathTraceContext } from "../../run-analysis/trace-rules-profile-planning";
import { runnerFundingRouteCandidateIsMaterializable } from "../../plans/runner-funding-candidates";
import {
  actionClickCost,
  nonNegativeActionCreditCost,
} from "../../runtime/action-cost";
import {
  runnerPartialProgramSearchIsPayable,
  runnerPartialProgramSearchProfile,
} from "../../runtime/runner-partial-program-search-facts";
import { runnerCandidateExecutesProgramSearch } from "../../runtime/runner-program-search-facts";
import { runnerCandidateSourceDefinitionId } from "../../runtime/runner-action-source-facts";
import { uniqueBy } from "../../runtime/collection";
import { planningCardFactsByDefinitionId } from "@netgrid/cards/planning";
import type { AiDecisionInput, CardDefinitionId, VisibleCard } from "@netgrid/shared";
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
import { runnerTargetHasTerminalContestThreat } from "../../runtime/runner-terminal-contest-threat";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import { runnerRunPathCreditBudgetWithVisiblePools } from "../../run-analysis/visible-run-credit-budget";
import { runnerBreakerCapabilityCoversRole } from "./coverage-card-facts";
import { RUNNER_BREAKER_COVERAGE } from "../../plans/runner-coverage-contracts";
import type { RunnerCoverageServices } from "./coverage-services";
import { runnerDrawProjectionFor } from "../../actions/action-economy-projection";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { currentRunnerCoverageBankPayout } from "../credit-bank/credit-bank-coverage-funding";
export function runnerCoverageSearchLifecycleBinding(
  gap: RunnerCoverageGapSignal,
  candidates: readonly Pick<
    ActionSemanticCandidate,
    "actionId" | "functionalEffects"
  >[],
): RunnerCoverageGapSignal {
  if (
    gap.requesterPlanInstanceId &&
    gap.requesterNeedId &&
    gap.requesterModuleId &&
    gap.targetRunActionId
  )
    return gap;
  const rejected = new Set(
    candidates
      .filter(
        (candidate) =>
          gap.directSearchActionIds.includes(candidate.actionId) &&
          candidate.functionalEffects?.some(
            (effect) =>
              effect.kind === "delayed_penalty" &&
              effect.timing === "runner_turn" &&
              effect.target === "end_of_turn_bounce",
          ),
      )
      .map((candidate) => candidate.actionId),
  );
  if (rejected.size === 0) return gap;
  return {
    ...gap,
    directSearchActionIds: gap.directSearchActionIds.filter(
      (id) => !rejected.has(id),
    ),
    ...(gap.directSearchChoiceBindings !== undefined
      ? {
          directSearchChoiceBindings: gap.directSearchChoiceBindings.filter(
            (binding) => !rejected.has(binding.actionId),
          ),
        }
      : {}),
    rejectedSearchActionIds: [
      ...new Set([...(gap.rejectedSearchActionIds ?? []), ...rejected]),
    ],
    recoveryEvidenceCodes: [
      ...(gap.recoveryEvidenceCodes ?? []),
      ...[...rejected].map(
        (id) => `temporary_search_without_run_consumer:${id}`,
      ),
    ],
  };
}

export function runnerCoverageGapIsTerminalRemoteThreat(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  if (evaluation.targetKind !== "remote") return false;
  return runnerTargetHasTerminalContestThreat(input, evaluation.targetServerId);
}

export function runnerCoverageTraceContext(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
) {
  const maximumFundingStep = candidates.reduce(
    (maximum, candidate) =>
      runnerFundingRouteCandidateIsMaterializable(candidate)
        ? Math.max(maximum, candidate.economyProjection!.netLiquidCreditGain!)
        : maximum,
    0,
  );
  // A price comparison may quote breaker payments beyond current liquidity.
  // Trace abilities only spend credits possible before this turn's run.
  const maxFundingSteps = Math.max(1, input.playerView.own.clicks);
  return {
    ...visibleRunnerPathTraceContext(input),
    runnerTraceCreditLimit:
      input.playerView.own.credits + maximumFundingStep * maxFundingSteps,
  };
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
    (action) =>
      action.actionId === evaluation.actionId &&
      action.side === "runner" &&
      action.timingPoint === input.playerView.timingPoint &&
      action.expiresAtStateVersion === input.playerView.stateVersion,
  );
  if (!installRoute || !runAction) return undefined;
  const runClickCost = actionClickCost(runAction);
  const requiredClicksAfterFunding = installRoute.clickCost + runClickCost;
  if (input.playerView.own.clicks < requiredClicksAfterFunding) {
    return undefined;
  }
  const quoteLiquidity = Number.MAX_SAFE_INTEGER;
  const projectedPath = assessKnownRezzedIcePath(
    server.ice,
    [...(input.playerView.own.rig ?? []), visibleAnswer],
    runnerRunPathCreditBudgetWithVisiblePools(
      quoteLiquidity,
      input.playerView.own.rig ?? [],
      {
        excludeStealthCredits:
          server.statuses?.some(
            (status) =>
              status.kind === "run_payment_restriction" &&
              status.restriction === "runner_stealth_bit_payment_sources",
          ) === true,
      },
    ),
    server.root,
    input.playerView.opponent.credits,
    runnerCoverageTraceContext(input, candidates),
  );
  const projectedKnownPathCost = projectedPath.visibleBreakCost;
  if (
    !projectedPath.canReachAccess ||
    projectedPath.blocked ||
    (projectedPath.futureClicksLost ?? 0) > 0 ||
    projectedKnownPathCost === undefined ||
    !Number.isSafeInteger(projectedKnownPathCost) ||
    projectedKnownPathCost < 0
  ) {
    return undefined;
  }
  const remainingLiquidity =
    projectedPath.creditBudgetAfterPath?.traceEligibleCredits;
  if (
    remainingLiquidity === undefined ||
    !Number.isSafeInteger(remainingLiquidity) ||
    remainingLiquidity < 0 ||
    remainingLiquidity > quoteLiquidity
  ) {
    throw new PlanResolutionFailure("invalid_player_view_card_projection", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition:
        "Restore the complete current run-payment ledger before quoting urgent coverage funding.",
    });
  }
  // Restricted pools pay only their compatible quoted path steps. They cannot
  // fund the installation, the run action or the parent's post-run cash floor.
  const projectedKnownPathLiquidCost = quoteLiquidity - remainingLiquidity;
  const requiredCreditsWithoutFloor =
    (answerInstallCost as number) +
    nonNegativeActionCreditCost(runAction) +
    projectedKnownPathLiquidCost;
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
  const ordinaryCreditFloor = fundingCanReach(requiredCreditsWithoutFloor + 1)
    ? 1
    : fundingCanReach(requiredCreditsWithoutFloor)
      ? 0
      : undefined;
  const bankPayout =
    ordinaryCreditFloor === undefined &&
    remainingFundingClicks > 0 &&
    runnerCoverageGapIsTerminalRemoteThreat(input, evaluation)
      ? currentRunnerCoverageBankPayout(
          input,
          candidates,
          requiredCreditsWithoutFloor - input.playerView.own.credits,
        )
      : undefined;
  const bankCreditFloor = bankPayout
    ? Number(
        input.playerView.own.credits + bankPayout.payout >
          requiredCreditsWithoutFloor,
      )
    : undefined;
  const postRunCreditFloor = ordinaryCreditFloor ?? bankCreditFloor;
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
    ...(bankPayout ? { bankCashOutActionId: bankPayout.actionId } : {}),
    installProjection: installRoute.projection,
  };
}

function runnerUrgentCoverageInstallProjection(
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
      if (
        !action ||
        action.side !== "runner" ||
        action.type !== "install_card" ||
        action.timingPoint !== input.playerView.timingPoint ||
        action.expiresAtStateVersion !== input.playerView.stateVersion ||
        (action.payload?.cardId ?? action.source) !==
          visibleAnswer.instanceId ||
        nonNegativeActionCreditCost(action) !== answerInstallCost
      )
        return [];
      return [{ actionId, clickCost: actionClickCost(action) }];
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
    ? planningCardFactsByDefinitionId(visibleAnswer.definitionId)
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
  requiredEndTurnHandBuffer?: number,
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
    ...(requiredEndTurnHandBuffer !== undefined
      ? { requiredEndTurnHandBuffer }
      : {}),
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
    targetDefinitionIdOverride?: CardDefinitionId;
    handRotation?: Pick<
      RunnerHandRotationAssessment,
      "exactKnownNeedDrawAdmissible" | "stackHasCards"
    >;
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
  const deckHasDrawAnswer =
    deckHasStackAnswer ||
    (options.deckHasStackAnswerOverride === undefined &&
      runnerDeckHasHeapRecoveryDrawAnswer(
        input,
        deckCapabilities,
        requiredRole,
      ));
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
      (runnerCandidateExecutesProgramSearch(input, candidate) ||
        candidate.functionalEffects?.some(
          (effect) => effect.kind === "search" && effect.scope === "stack",
        ) === true) &&
      runnerPartialProgramSearchIsPayable(input, candidate) &&
      runnerCoverageSearchTargetIsPayable(
        input,
        candidate,
        targetBreaker,
        options.terminalRemoteCoverageThreat,
      )
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
    deckHasDrawAnswer ? candidates : []
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
        (candidate.economyProjection?.cardsDrawn ?? 0) > 0),
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
    deckHasDrawAnswer &&
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
    drawForAnswerActionIds: uniqueBy(
      [
        ...safeCardDrawForAnswerCandidates,
        ...safeBasicDrawSubstitutes,
        ...sideSafeRoleBasicDraws,
      ],
      (candidate) => candidate.actionId,
    )
      .filter((candidate) => {
        const action = input.legalActions.find(
          (legalAction) => legalAction.actionId === candidate.actionId,
        );
        if (!action)
          throw new PlanResolutionFailure("stale_or_future_action_reference", {
            side: input.side,
            stateVersion: input.playerView.stateVersion,
            timingPoint: input.playerView.timingPoint,
            legalActionTypes: input.legalActions.map((a) => a.type),
            unresolvedActionIds: [candidate.actionId],
            owner: "plan_module",
            removalCondition:
              "Bind coverage draw support to its current native LegalAction.",
          });
        return runnerDrawProjectionFor(action)?.projectedNetHandDelta !== 0;
      })
      .map((candidate) => candidate.actionId),
  };
}

function runnerDeckHasHeapRecoveryDrawAnswer(
  input: AiDecisionInput,
  deckCapabilities: DeckCapabilityProfile,
  requiredRole: RunnerCoverageGapSignal["requiredRole"],
): boolean {
  if (
    input.playerView.own.stackOrRdCount <= 0 ||
    !input.playerView.own.heapOrArchives.some(
      (card) =>
        card.known &&
        visibleCardCoversRequiredCoverage(card, requiredRole, (cardId) =>
          rolesForDeckDoctrineCard(cardId),
        ),
    )
  ) {
    return false;
  }
  return (
    deckCapabilities.runner?.searchAccess.tools.some((tool) => {
      if (tool.status !== "in_deck" || !tool.canSearchBreakers) return false;
      const effects = AI_HINTS_BY_CARD.get(tool.cardId)?.effects;
      return (
        effects?.some(
          (effect) =>
            effect.kind === "card_recovery" &&
            effect.scope === "heap" &&
            effect.target === "search_trash_to_grip",
        ) === true &&
        effects.some(
          (effect) =>
            effect.kind === "search" &&
            effect.scope === "heap" &&
            (effect.target === "program" || effect.target === "any_card"),
        )
      );
    }) ?? false
  );
}

export function runnerCoverageSearchTargetIsPayable(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  targetBreaker: BreakerCapability | undefined,
  terminalRemoteCoverageThreat = false,
): boolean {
  const installEffects = (candidate.functionalEffects ?? []).filter(
    (effect) =>
      effect.kind === "install" &&
      effect.scope === "installed_card" &&
      effect.target === "program",
  );
  const partialSearch = terminalRemoteCoverageThreat
    ? undefined
    : runnerPartialProgramSearchProfile(
        input,
        runnerCandidateSourceDefinitionId(input, candidate),
      );
  const acquisitionCost = partialSearch?.costPerTaken ?? 0;
  if (installEffects.length === 0 && acquisitionCost === 0) return true;
  if (installEffects.length > 0) {
    const installCostModes = new Set(
      installEffects.flatMap((effect) =>
        effect.installCost ? [effect.installCost] : [],
      ),
    );
    if (installCostModes.size !== 1) return false;
    if (installCostModes.has("free")) return true;
    if (!installCostModes.has("normal")) return false;
  }
  const installCost = targetBreaker?.installCost;
  if (
    installCost === undefined ||
    !Number.isSafeInteger(installCost) ||
    installCost < 0
  )
    return false;
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  if (!action) return false;
  const sourceCreditCost = nonNegativeActionCreditCost(action);
  return (
    input.playerView.own.credits >=
    sourceCreditCost + acquisitionCost + installCost
  );
}

export function runnerPreferredCoverageSearchDefinitionId(
  deckCapabilities: DeckCapabilityProfile,
  requiredRole: RunnerCoverageGapSignal["requiredRole"],
): number | undefined {
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
        (left.cardId - right.cardId),
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
      rolesForDeckDoctrineCard(cardId),
    ),
  );
}

export function runnerDeckHasCoverageAnswer(
  deckCapabilities: DeckCapabilityProfile,
  requiredRole: RunnerCoverageGapSignal["requiredRole"],
): boolean {
  const requiredCoverage = RUNNER_BREAKER_COVERAGE[requiredRole].deckKind;
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
