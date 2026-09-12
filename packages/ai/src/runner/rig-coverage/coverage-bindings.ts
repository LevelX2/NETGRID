import {
  type AiDecision,
  type AiDecisionInput,
  type VisibleCard,
} from "@netgrid/shared";
import { type RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";
import { type PlanSchedulerResult } from "../../plans/plan-scheduler";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { planInstanceIdForProposal } from "../../plans/plan-instance";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { selectResidentPlanPortfolioExecutor } from "../../plans/resident-plan-portfolio";
import type { RunnerProgramInstallTrashAssessment } from "../../runtime/runner-program-install-trash-policy";
import { preserveCoveragePaymentAncestry } from "./coverage-payment-ancestry";
export function preserveSelectedRunnerCoverageBindingAcrossPaymentStep(
  input: AiDecisionInput,
  result: Extract<PlanSchedulerResult, { lane: "plan" }>,
  previous: ResidentPlanPortfolio | undefined,
  pending: NonNullable<
    ResidentPlanPortfolio["pendingRunnerCostPenaltySupportOrigin"]
  >,
): void {
  const previousExecutor = previous?.instances.find(
    (instance) => instance.instanceId === pending.executorInstanceId,
  );
  if (previousExecutor?.moduleId !== "runner.rig_and_coverage") return;
  let nextExecutor = result.portfolio.instances.find(
    (instance) => instance.instanceId === pending.executorInstanceId,
  );
  const previousState = previousExecutor.moduleState as
    | {
        kind?: unknown;
        phase?: unknown;
        selectedSearchActionId?: unknown;
        selectedSearchStateVersion?: unknown;
        gap?: {
          requiredRole?: unknown;
          targetServerId?: unknown;
          targetRunActionId?: unknown;
          installActionIds?: unknown;
          drawForAnswerActionIds?: unknown;
          directSearchChoiceBindings?: Array<{
            actionId?: unknown;
            sourceCardInstanceId?: unknown;
            sourceDefinitionId?: unknown;
            targetCardInstanceId?: unknown;
            targetDefinitionId?: unknown;
          }>;
        };
      }
    | undefined;
  const previousBindings =
    previousState?.gap?.directSearchChoiceBindings?.filter(
      (binding) => binding.actionId === pending.originalActionId,
    ) ?? [];
  const previousBinding =
    previousBindings.length === 1 ? previousBindings[0] : undefined;
  const previousInstallActionIds = Array.isArray(
    previousState?.gap?.installActionIds,
  )
    ? previousState.gap.installActionIds.filter(
        (actionId): actionId is string => typeof actionId === "string",
      )
    : [];
  const previousCoverageExecutorIsPreservable =
    previous?.side === "runner" &&
    (previousExecutor.executionState === "executor" ||
      previousExecutor.executionState === "preempted") &&
    previousState?.kind === "coverage";
  const previousDrawOriginIsExact =
    previousCoverageExecutorIsPreservable &&
    previousState.phase === "draw_for_answer" &&
    Array.isArray(previousState.gap?.drawForAnswerActionIds) &&
    previousState.gap.drawForAnswerActionIds.includes(pending.originalActionId);
  const previousInstallOriginIsExact =
    previousCoverageExecutorIsPreservable &&
    previousState.phase === "install_answer" &&
    previousInstallActionIds.includes(pending.originalActionId);
  const previousSearchOriginIsExact =
    previousCoverageExecutorIsPreservable &&
    previousState.phase === "search_answer" &&
    previousState.selectedSearchActionId === pending.originalActionId &&
    previousState.selectedSearchStateVersion ===
      pending.selectedAtStateVersion &&
    previousBinding !== undefined;
  if (
    !nextExecutor &&
    (previousInstallOriginIsExact ||
      previousSearchOriginIsExact ||
      previousDrawOriginIsExact)
  ) {
    const preservedExecutor = structuredClone(previousExecutor);
    preservedExecutor.executionState = "preempted";
    preservedExecutor.portfolioRole = "background";
    result.portfolio.instances.push(preservedExecutor);
    nextExecutor = preservedExecutor;
  }
  const nextState = nextExecutor?.moduleState as typeof previousState;
  const exactActionBinding =
    (previousInstallOriginIsExact || previousDrawOriginIsExact) &&
    nextExecutor?.moduleId === "runner.rig_and_coverage" &&
    nextState?.kind === "coverage" &&
    nextState.phase === previousState.phase &&
    previousState.gap?.requiredRole === nextState.gap?.requiredRole;
  if (exactActionBinding && nextExecutor && nextState) {
    preserveCoveragePaymentAncestry(
      input,
      previous!,
      result.portfolio,
      pending,
    );
    nextExecutor.moduleState = {
      ...nextState,
      gap: structuredClone(previousState.gap),
    };
    return;
  }
  const exactSearchBinding =
    previousSearchOriginIsExact &&
    nextExecutor?.moduleId === "runner.rig_and_coverage" &&
    nextState?.kind === "coverage" &&
    nextState.phase === "search_answer" &&
    previousState.gap?.requiredRole === nextState.gap?.requiredRole;
  if (!nextExecutor || !nextState || !exactSearchBinding) {
    throw new PlanResolutionFailure("invalid_support_graph", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [pending.originalActionId],
      owner: "support_graph",
      planInstanceId: pending.executorInstanceId,
      stepId: pending.sourceStepId,
      removalCondition:
        "Carry the exact selected coverage search, install or draw action and its unchanged coverage binding through every intervening payment-support step.",
    });
  }
  preserveCoveragePaymentAncestry(input, previous!, result.portfolio, pending);
  nextExecutor.moduleState = {
    ...nextState,
    gap: structuredClone(previousState.gap),
    selectedSearchActionId: pending.originalActionId,
    selectedSearchStateVersion: pending.selectedAtStateVersion,
  };
}

export function bindSelectedCoverageSearchAction(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
): void {
  const continuation =
    result.lane === "engine_window" &&
    result.diagnostics.some(
      (diagnostic) =>
        diagnostic.code ===
        "plan_bound_runner_cost_penalty_support_continuation",
    )
      ? result.portfolio?.pendingRunnerCostPenaltySupportOrigin
      : undefined;
  if (result.lane === "engine_window" && !continuation) return;
  const portfolio = result.portfolio;
  if (!portfolio) return;
  const executorInstanceId =
    result.lane === "plan"
      ? portfolio.executorInstanceId
      : continuation!.executorInstanceId;
  const executor = portfolio.instances.find(
    (instance) =>
      instance.instanceId === executorInstanceId &&
      instance.moduleId === "runner.rig_and_coverage",
  );
  if (!executor) return;
  const moduleState = executor.moduleState as
    | {
        kind?: unknown;
        phase?: unknown;
        gap?: {
          directSearchActionIds?: Array<unknown>;
          directSearchChoiceBindings?: Array<{
            actionId?: unknown;
            targetCardInstanceId?: unknown;
          }>;
          rejectedSearchActionIds?: Array<unknown>;
        };
        selectedSearchActionId?: unknown;
        selectedSearchStateVersion?: unknown;
      }
    | undefined;
  if (moduleState?.kind !== "coverage") {
    return;
  }
  const selectedActionId =
    result.lane === "plan" ? result.route.head.actionId : result.actionId;
  const selectedStateVersion =
    result.lane === "plan"
      ? result.route.head.stateVersion
      : input.playerView.stateVersion;
  const selectedStepId =
    result.lane === "plan"
      ? result.route.head.stepId
      : continuation!.sourceStepId;
  const selectedActionIsSearch =
    moduleState.gap?.directSearchActionIds?.includes(selectedActionId) ===
      true ||
    moduleState.gap?.rejectedSearchActionIds?.includes(selectedActionId) ===
      true ||
    moduleState.gap?.directSearchChoiceBindings?.some(
      (binding) => binding.actionId === selectedActionId,
    ) === true;
  if (!selectedActionIsSearch && moduleState.phase !== "search_answer") return;
  const exactBindings =
    moduleState.gap?.directSearchChoiceBindings?.filter(
      (binding) => binding.actionId === selectedActionId,
    ) ?? [];
  const exactContinuationBinding =
    result.lane === "plan" ||
    (continuation!.originalActionId === selectedActionId &&
      result.origin.rootPlanInstanceId === continuation!.rootPlanInstanceId &&
      result.origin.leafPlanInstanceId === continuation!.executorInstanceId &&
      moduleState.selectedSearchActionId === selectedActionId &&
      moduleState.selectedSearchStateVersion ===
        continuation!.selectedAtStateVersion);
  if (
    moduleState.phase !== "search_answer" ||
    exactBindings.length !== 1 ||
    !exactContinuationBinding
  ) {
    throw new PlanResolutionFailure("invalid_support_graph", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [selectedActionId],
      owner: "support_graph",
      planInstanceId: executor.instanceId,
      stepId: selectedStepId,
      removalCondition:
        "Persist exactly one coverage-search choice binding for the selected LegalAction and its exact Engine continuation before its choice window can open.",
    });
  }
  executor.moduleState = {
    ...moduleState,
    selectedSearchActionId: selectedActionId,
    selectedSearchStateVersion: selectedStateVersion,
  };
  if (continuation) {
    // Payment support may temporarily execute under Economy. The exact
    // original search must regain its resident executor before its choice
    // chain reads the prebound target and memory-sacrifice contract.
    const resumed = selectResidentPlanPortfolioExecutor({
      portfolio,
      selectedExecutorInstanceId: executor.instanceId,
      timingPoint: input.playerView.timingPoint,
      reason: "executor_selected",
    });
    if (resumed.rootForegroundInstanceId !== continuation.rootPlanInstanceId) {
      throw new PlanResolutionFailure("invalid_support_graph", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map((action) => action.type),
        unresolvedActionIds: [selectedActionId],
        owner: "support_graph",
        planInstanceId: executor.instanceId,
        stepId: selectedStepId,
        removalCondition:
          "Resume the exact preserved coverage search only under its original root and intact support ancestry.",
      });
    }
    result.portfolio = resumed;
  }
}

export function bindSelectedRunnerCoverageSearchChoiceContinuation(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
  decision: AiDecision,
  assessCard: (
    input: AiDecisionInput,
    card: VisibleCard,
  ) => RunnerProgramInstallTrashAssessment,
): void {
  const choice = input.playerView.pendingChoice;
  const portfolio = result.portfolio;
  if (
    input.side !== "runner" ||
    !choice ||
    choice.kind !== "select_cards" ||
    (!choice.source.startsWith("p3_38.search_stack_install:") &&
      !choice.source.startsWith(
        "card_implementation.pro018_stack_install_run_cleanup:",
      )) ||
    !portfolio
  ) {
    return;
  }
  const executor = portfolio.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      instance.moduleId === "runner.rig_and_coverage" &&
      instance.executionState === "executor",
  );
  if (!executor) return;
  const moduleState = executor.moduleState as
    | {
        kind?: unknown;
        phase?: unknown;
        selectedSearchActionId?: unknown;
        selectedSearchStateVersion?: unknown;
        gap?: {
          requesterPlanInstanceId?: unknown;
          requesterNeedId?: unknown;
          directSearchChoiceBindings?: Array<{
            actionId?: unknown;
            sourceCardInstanceId?: unknown;
            sourceDefinitionId?: unknown;
            targetCardInstanceId?: unknown;
            targetDefinitionId?: unknown;
            installMemorySacrificeBinding?: unknown;
          }>;
        };
      }
    | undefined;
  const selectedChoices = decision.selectedChoices as
    | { choiceId?: unknown; selectedOptionIds?: unknown }
    | undefined;
  const selectedOptionIds =
    Array.isArray(selectedChoices?.selectedOptionIds) &&
    selectedChoices.selectedOptionIds.every(
      (optionId): optionId is string => typeof optionId === "string",
    )
      ? selectedChoices.selectedOptionIds
      : [];
  const selectedOption =
    selectedOptionIds.length === 1
      ? choice.options.find(
          (option) =>
            option.id === selectedOptionIds[0] && option.selectable !== false,
        )
      : undefined;
  const selectedTarget = selectedOption?.card;
  const bindings = moduleState?.gap?.directSearchChoiceBindings?.filter(
    (binding) =>
      binding.actionId === moduleState.selectedSearchActionId &&
      binding.sourceCardInstanceId === choice.sourceCardInstanceId &&
      binding.sourceDefinitionId === choice.sourceCardDefinitionId &&
      binding.targetDefinitionId === selectedTarget?.definitionId &&
      (binding.targetCardInstanceId === undefined ||
        binding.targetCardInstanceId === selectedTarget?.instanceId),
  );
  const binding = bindings?.length === 1 ? bindings[0] : undefined;
  const root = portfolio.instances.find(
    (instance) =>
      instance.instanceId === portfolio.rootForegroundInstanceId &&
      instance.portfolioRole === "foreground",
  );
  const exactCoverageExecutorOwnership =
    portfolio.rootForegroundInstanceId === executor.instanceId ||
    (root !== undefined &&
      executor.parentInstanceId === root.instanceId &&
      typeof executor.parentNeedId === "string" &&
      root.openNeedIds.includes(executor.parentNeedId) &&
      moduleState?.gap?.requesterPlanInstanceId === root.instanceId &&
      moduleState.gap.requesterNeedId === executor.parentNeedId);
  const exactChoice =
    result.lane === "engine_window" &&
    decision.actionId === result.actionId &&
    selectedChoices?.choiceId === choice.choiceId &&
    choice.side === "runner" &&
    choice.stateVersion === input.playerView.stateVersion &&
    selectedTarget?.known !== false &&
    selectedTarget?.type === "program" &&
    typeof selectedTarget?.instanceId === "string" &&
    typeof selectedTarget.definitionId === "string" &&
    portfolio.side === "runner" &&
    portfolio.executorInstanceId === executor.instanceId &&
    exactCoverageExecutorOwnership &&
    moduleState?.kind === "coverage" &&
    moduleState.phase === "search_answer" &&
    typeof moduleState.selectedSearchActionId === "string" &&
    typeof moduleState.selectedSearchStateVersion === "number" &&
    moduleState.selectedSearchStateVersion === portfolio.stateVersion &&
    binding !== undefined;
  if (!exactChoice || !selectedTarget || !binding) {
    throw new PlanResolutionFailure("invalid_support_graph", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [decision.actionId ?? "missing_decision_action"],
      owner: "support_graph",
      planInstanceId: executor.instanceId,
      removalCondition:
        "Bind a direct stack-search target only from the exact coverage executor, selected search action and current hidden Engine choice.",
    });
  }
  const assessment = assessCard(input, selectedTarget);
  const selectedCards = assessment.selectedCandidates.flatMap((candidate) =>
    candidate.acceptable &&
    candidate.card?.type === "program" &&
    typeof candidate.card.instanceId === "string" &&
    Number.isInteger(candidate.memoryCost) &&
    candidate.memoryCost > 0
      ? [
          {
            cardInstanceId: candidate.card.instanceId,
            memoryCost: candidate.memoryCost,
          },
        ]
      : [],
  );
  const memoryFreed = selectedCards.reduce(
    (total, card) => total + card.memoryCost,
    0,
  );
  if (
    assessment.memoryRequired &&
    (typeof selectedTarget.memoryCost !== "number" ||
      !Number.isInteger(selectedTarget.memoryCost) ||
      selectedTarget.memoryCost <= 0 ||
      !assessment.canFreeRequiredMemory ||
      selectedCards.length === 0 ||
      memoryFreed < assessment.requiredMemoryToFree ||
      memoryFreed !== assessment.memoryFreedBySelectedCandidates)
  ) {
    throw new PlanResolutionFailure("invalid_support_graph", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [decision.actionId ?? "missing_decision_action"],
      owner: "support_graph",
      planInstanceId: executor.instanceId,
      removalCondition:
        "Continue a coverage stack install only after the exact visible target has a sufficient prebound acceptable program-sacrifice set.",
    });
  }
  const boundTarget = {
    ...binding,
    targetCardInstanceId: selectedTarget.instanceId,
    resolvedSearchChoice: {
      choiceId: choice.choiceId,
      choiceSource: choice.source,
      stateVersion: input.playerView.stateVersion,
    },
    ...(assessment.memoryRequired
      ? {
          installMemorySacrificeBinding: {
            targetCardInstanceId: selectedTarget.instanceId,
            targetMemoryCost: selectedTarget.memoryCost!,
            requiredMemoryToFree: assessment.requiredMemoryToFree,
            selectedCards,
          },
        }
      : {}),
  };
  executor.moduleState = {
    ...moduleState,
    selectedSearchStateVersion: input.playerView.stateVersion,
    gap: {
      ...moduleState.gap,
      directSearchChoiceBindings:
        moduleState.gap?.directSearchChoiceBindings?.map((candidate) =>
          candidate === binding ? boundTarget : candidate,
        ),
    },
  };
  portfolio.stateVersion = input.playerView.stateVersion;
}

export function bindRunnerCoverageSearchProgramTrashSacrifices<
  T extends { coverageGaps: RunnerCoverageGapSignal[] },
>(
  input: AiDecisionInput,
  domain: T,
  assessCard: (
    input: AiDecisionInput,
    card: VisibleCard,
  ) => RunnerProgramInstallTrashAssessment,
): T {
  return {
    ...domain,
    coverageGaps: domain.coverageGaps.map((gap) => {
      const rejectedActionIds = new Set(gap.rejectedSearchActionIds ?? []);
      const memoryRejectedActionIds = new Set(
        gap.programInstallMemoryRejectedActionIds ?? [],
      );
      const bindings = gap.directSearchChoiceBindings?.flatMap((binding) => {
        const target = binding.targetCardInstanceId
          ? input.playerView.own.heapOrArchives.find(
              (card) =>
                card.known !== false &&
                card.instanceId === binding.targetCardInstanceId &&
                card.definitionId === binding.targetDefinitionId &&
                card.type === "program",
            )
          : undefined;
        if (!target) return [binding];
        const assessment = assessCard(input, target);
        if (!assessment.memoryRequired) return [binding];
        const selectedCards = assessment.selectedCandidates.flatMap(
          (candidate) =>
            candidate.acceptable &&
            candidate.card?.type === "program" &&
            typeof candidate.card.instanceId === "string" &&
            Number.isInteger(candidate.memoryCost) &&
            candidate.memoryCost > 0
              ? [
                  {
                    cardInstanceId: candidate.card.instanceId,
                    memoryCost: candidate.memoryCost,
                  },
                ]
              : [],
        );
        const memoryFreed = selectedCards.reduce(
          (total, card) => total + card.memoryCost,
          0,
        );
        if (
          !assessment.canFreeRequiredMemory ||
          selectedCards.length === 0 ||
          memoryFreed < assessment.requiredMemoryToFree ||
          memoryFreed !== assessment.memoryFreedBySelectedCandidates
        ) {
          rejectedActionIds.add(binding.actionId);
          memoryRejectedActionIds.add(binding.actionId);
          return [];
        }
        return [
          {
            ...binding,
            installMemorySacrificeBinding: {
              targetCardInstanceId: target.instanceId,
              requiredMemoryToFree: assessment.requiredMemoryToFree,
              selectedCards,
            },
          },
        ];
      });
      const acceptedActionIds = new Set(
        bindings?.map((binding) => binding.actionId) ?? [],
      );
      return {
        ...gap,
        directSearchActionIds: gap.directSearchActionIds.filter(
          (actionId) =>
            !rejectedActionIds.has(actionId) &&
            (gap.directSearchChoiceBindings === undefined ||
              acceptedActionIds.has(actionId)),
        ),
        ...(bindings ? { directSearchChoiceBindings: bindings } : {}),
        ...(memoryRejectedActionIds.size > 0
          ? {
              programInstallMemoryRejectedActionIds: [
                ...memoryRejectedActionIds,
              ].sort((left, right) => left.localeCompare(right)),
            }
          : {}),
        rejectedSearchActionIds: [...rejectedActionIds].sort((left, right) =>
          left.localeCompare(right),
        ),
      };
    }),
  };
}

export function reconcileRunnerCoverageRequesterBindings(params: {
  coverageGaps: readonly RunnerCoverageGapSignal[];
  centralPressure: readonly { pressureId: string; supportNeedId?: string }[];
  remoteContests: readonly { contestId: string; supportNeedId?: string }[];
}): RunnerCoverageGapSignal[] {
  const acceptedRequesterBindings = new Set([
    ...params.centralPressure.flatMap((signal) =>
      signal.supportNeedId
        ? [
            `${planInstanceIdForProposal({
              moduleId: "runner.pressure_central",
              dedupeKey: signal.pressureId,
            })}\u0000${signal.supportNeedId}`,
          ]
        : [],
    ),
    ...params.remoteContests.flatMap((signal) =>
      signal.supportNeedId
        ? [
            `${planInstanceIdForProposal({
              moduleId: "runner.contest_remote",
              dedupeKey: signal.contestId,
            })}\u0000${signal.supportNeedId}`,
          ]
        : [],
    ),
  ]);
  return params.coverageGaps.map((gap) => {
    const exactBinding =
      gap.requesterPlanInstanceId && gap.requesterNeedId
        ? `${gap.requesterPlanInstanceId}\u0000${gap.requesterNeedId}`
        : undefined;
    if (
      !gap.requesterPlanInstanceId ||
      (exactBinding && acceptedRequesterBindings.has(exactBinding))
    ) {
      return gap;
    }
    const {
      requesterModuleId: _requesterModuleId,
      requesterPlanInstanceId: _requesterPlanInstanceId,
      requesterNeedId: _requesterNeedId,
      ...independentGap
    } = gap;
    return independentGap;
  });
}
