import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { rolesForDeckDoctrineCard } from "../../deck-doctrine-card-roles";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import {
  type EngineWindowResolution,
  type PlanSchedulerContext,
  type PlanSchedulerResult,
} from "../../plans/plan-scheduler";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { type RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";
import type { RequiredCapabilityKind } from "../../plans/tactical-plan-types";
import { extractAiFeatures } from "../../runtime/ai-features";
import { selectableChoiceOptions } from "../../runtime/choice-option";
import { runnerCandidateSourceDefinitionId } from "../../runtime/runner-action-source-facts";
import {
  runnerCandidateExecutesProgramSearch,
  runnerProgramSearchSourceCardInstanceId,
} from "../../runtime/runner-program-search-facts";
import { selectedSearchChoiceOptionIds } from "../../runtime/search-choice-option";
import { runnerHeapRecoveryActionContract } from "./development-search-targets";
import type { RunnerDevelopmentInstallServices } from "./development-services";
import { type RunnerDevelopmentSignal } from "./development-types";

export function resolvePlanBoundRunnerDelayedProgramSearchChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  const choice = context.input.playerView.pendingChoice;
  if (
    context.input.side !== "runner" ||
    !choice?.source.startsWith(
      "card_implementation.pro018_stack_install_run_cleanup:",
    )
  ) {
    return undefined;
  }
  const origin = previous?.selectedActionOrigin;
  const root = previous?.instances.find(
    (instance) => instance.instanceId === origin?.rootPlanInstanceId,
  );
  const executor = previous?.instances.find(
    (instance) =>
      instance.instanceId === origin?.executorInstanceId &&
      (instance.executionState === "executor" ||
        instance.executionState === "preempted"),
  );
  const developmentState = executor?.moduleState as
    | { kind?: unknown; signal?: RunnerDevelopmentSignal }
    | undefined;
  const developmentSignal = developmentState?.signal;
  const coverageState = executor?.moduleState as
    | {
        kind?: unknown;
        phase?: unknown;
        selectedSearchActionId?: unknown;
        selectedSearchStateVersion?: unknown;
        gap?: {
          directSearchChoiceBindings?: Array<{
            actionId?: unknown;
            sourceCardInstanceId?: unknown;
            sourceDefinitionId?: unknown;
          }>;
        };
      }
    | undefined;
  const action =
    context.input.legalActions.length === 1
      ? context.input.legalActions[0]
      : undefined;
  const requirement = action?.choiceRequirements?.[0];
  const optionIds = choice.options.map((option) => option.id);
  const exactDevelopmentBinding =
    executor?.moduleId === "runner.develop_board_and_hand" &&
    developmentState?.kind === "development" &&
    developmentSignal?.phase === "execute" &&
    developmentSignal.developmentId === `card:${choice.sourceCardInstanceId}` &&
    developmentSignal.definitionId === choice.sourceCardDefinitionId &&
    developmentSignal.actionIds.includes(origin?.selectedActionId ?? "") &&
    origin?.selectedAtStateVersion === previous?.stateVersion;
  const coverageBindings =
    coverageState?.gap?.directSearchChoiceBindings?.filter(
      (binding) =>
        binding.actionId === coverageState.selectedSearchActionId &&
        binding.sourceCardInstanceId === choice.sourceCardInstanceId &&
        binding.sourceDefinitionId === choice.sourceCardDefinitionId,
    ) ?? [];
  const exactCoverageBinding =
    executor?.moduleId === "runner.rig_and_coverage" &&
    coverageState?.kind === "coverage" &&
    coverageState.phase === "search_answer" &&
    coverageState.selectedSearchActionId === origin?.selectedActionId &&
    coverageState.selectedSearchStateVersion === previous?.stateVersion &&
    coverageBindings.length === 1;
  const exactBinding =
    previous?.side === "runner" &&
    previous.stateVersion === context.input.playerView.stateVersion - 1 &&
    previous.rootForegroundInstanceId === origin?.rootPlanInstanceId &&
    previous.executorInstanceId === origin?.executorInstanceId &&
    root !== undefined &&
    executor !== undefined &&
    (exactDevelopmentBinding || exactCoverageBinding) &&
    choice.side === "runner" &&
    choice.kind === "select_cards" &&
    choice.visibility === "hidden_info_barrier" &&
    choice.stateVersion === context.input.playerView.stateVersion &&
    choice.cardSearchPresentation?.sourceZone === "stack" &&
    choice.cardSearchPresentation.selectableFilter === "program" &&
    choice.cardSearchPresentation.destination === "install_program" &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    action?.side === "runner" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === context.input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === optionIds.length &&
    optionIds.every((optionId) => requirement.optionIds.includes(optionId));
  if (!exactBinding || !action || !previous || !origin || !root || !executor) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: context.input.legalActions.map(
        (legalAction) => legalAction.actionId,
      ),
      owner: "continuation",
      removalCondition:
        "Resolve a delayed program-search target only from its exact resident Runner development or coverage root, executor, source event and current private Engine choice.",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
    });
  }
  return {
    actionId: action.actionId,
    reasonCode: "plan_bound_runner_delayed_program_search_choice",
    origin: {
      rootPlanInstanceId: root.instanceId,
      leafPlanInstanceId: executor.instanceId,
      side: "runner",
      windowKind: "mandatory_choice",
      windowId: choice.choiceId,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
    },
  };
}

export function bindSelectedRunnerDelayedProgramSearchChoice(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
  assessTarget: RunnerDevelopmentInstallServices["assessCard"],
): void {
  const choice = input.playerView.pendingChoice;
  if (
    input.side !== "runner" ||
    result.lane !== "engine_window" ||
    !result.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "plan_bound_runner_delayed_program_search_choice",
    ) ||
    !choice?.source.startsWith(
      "card_implementation.pro018_stack_install_run_cleanup:",
    ) ||
    !result.portfolio
  ) {
    return;
  }
  const executor = result.portfolio.instances.find(
    (instance) => instance.instanceId === result.origin.leafPlanInstanceId,
  );
  if (executor?.moduleId === "runner.rig_and_coverage") {
    const coverageState = executor.moduleState as {
      kind?: unknown;
      phase?: unknown;
      selectedSearchActionId?: unknown;
      selectedSearchStateVersion?: unknown;
      gap?: {
        requiredRole?: unknown;
        directSearchChoiceBindings?: Array<{
          actionId?: unknown;
          sourceCardInstanceId?: unknown;
          sourceDefinitionId?: unknown;
          targetCardInstanceId?: unknown;
          targetDefinitionId?: unknown;
        }>;
      };
    };
    const bindings = coverageState.gap?.directSearchChoiceBindings?.filter(
      (binding) =>
        binding.actionId === coverageState.selectedSearchActionId &&
        binding.sourceCardInstanceId === choice.sourceCardInstanceId &&
        binding.sourceDefinitionId === choice.sourceCardDefinitionId,
    );
    const binding = bindings?.length === 1 ? bindings[0] : undefined;
    const action = input.legalActions.find(
      (legalAction) => legalAction.actionId === result.actionId,
    );
    const selectedOptionIds = selectedSearchChoiceOptionIds(
      choice,
      selectableChoiceOptions(choice.options),
      {
        features: extractAiFeatures(input, {
          rolesForCardId: (definitionId) =>
            definitionId ? rolesForDeckDoctrineCard(definitionId) : [],
          buildServerFeatures: () => new Map(),
        }),
        rolesForCardId: (definitionId) =>
          definitionId ? rolesForDeckDoctrineCard(definitionId) : [],
        effectsForCardId: (definitionId) =>
          definitionId
            ? (AI_HINTS_BY_CARD.get(definitionId)?.effects ?? [])
            : [],
        requiredCoverage: coverageState.gap
          ?.requiredRole as RequiredCapabilityKind,
        ...(typeof binding?.targetCardInstanceId === "string"
          ? { preferredCardInstanceId: binding.targetCardInstanceId }
          : {}),
        ...(typeof binding?.targetDefinitionId === "string"
          ? { preferredCardDefinitionId: binding.targetDefinitionId }
          : {}),
      },
    );
    const selectedOption =
      selectedOptionIds?.length === 1
        ? choice.options.find((option) => option.id === selectedOptionIds[0])
        : undefined;
    const exactCoverageBinding =
      coverageState.kind === "coverage" &&
      coverageState.phase === "search_answer" &&
      typeof coverageState.selectedSearchActionId === "string" &&
      typeof coverageState.selectedSearchStateVersion === "number" &&
      binding !== undefined &&
      action?.type === "resolve_choice" &&
      selectedOption?.card?.known !== false &&
      selectedOption?.card?.type === "program" &&
      typeof selectedOption.card.instanceId === "string" &&
      typeof selectedOption.card.definitionId === "string";
    if (!exactCoverageBinding || !binding || !selectedOption?.card) {
      throw new PlanResolutionFailure("commitment_invalidated", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map(
          (legalAction) => legalAction.type,
        ),
        unresolvedActionIds: action ? [action.actionId] : [],
        owner: "continuation",
        planInstanceId: executor.instanceId,
        removalCondition:
          "The resident Runner coverage plan must preserve its exact search source and bind one visible program target before resolving the delayed Engine choice.",
      });
    }
    const boundTarget = {
      ...binding,
      targetCardInstanceId: selectedOption.card.instanceId,
      targetDefinitionId: selectedOption.card.definitionId,
    };
    executor.moduleState = {
      ...coverageState,
      selectedSearchStateVersion: input.playerView.stateVersion,
      gap: {
        ...coverageState.gap,
        directSearchChoiceBindings:
          coverageState.gap?.directSearchChoiceBindings?.map((candidate) =>
            candidate === binding ? boundTarget : candidate,
          ),
      },
    };
    result.portfolio.stateVersion = input.playerView.stateVersion;
    return;
  }
  if (executor?.moduleId !== "runner.develop_board_and_hand") return;
  const moduleState = executor?.moduleState as
    | { kind?: unknown; signal?: RunnerDevelopmentSignal }
    | undefined;
  const signal = moduleState?.signal;
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === result.actionId,
  );
  const selectableOptions = selectableChoiceOptions(choice.options);
  const selectedOptionIds = selectedSearchChoiceOptionIds(
    choice,
    selectableOptions,
    {
      features: extractAiFeatures(input, {
        rolesForCardId: (definitionId) =>
          definitionId ? rolesForDeckDoctrineCard(definitionId) : [],
        buildServerFeatures: () => new Map(),
      }),
      rolesForCardId: (definitionId) =>
        definitionId ? rolesForDeckDoctrineCard(definitionId) : [],
      effectsForCardId: (definitionId) =>
        definitionId ? (AI_HINTS_BY_CARD.get(definitionId)?.effects ?? []) : [],
    },
  );
  const selectedOption =
    selectedOptionIds?.length === 1
      ? selectableOptions.find((option) => option.id === selectedOptionIds[0])
      : undefined;
  const selectedCard = selectedOption?.card;
  const assessment = selectedCard
    ? assessTarget(input, selectedCard)
    : undefined;
  const selectedCards = assessment?.selectedCandidates.flatMap((candidate) =>
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
  const memoryFreed = selectedCards?.reduce(
    (total, card) => total + card.memoryCost,
    0,
  );
  const exactBinding =
    executor !== undefined &&
    moduleState?.kind === "development" &&
    signal?.phase === "execute" &&
    signal.developmentId === `card:${choice.sourceCardInstanceId}` &&
    signal.definitionId === choice.sourceCardDefinitionId &&
    action?.type === "resolve_choice" &&
    action.side === "runner" &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    selectedOption !== undefined &&
    selectedCard?.known !== false &&
    selectedCard?.type === "program" &&
    typeof selectedCard.instanceId === "string" &&
    typeof selectedCard.definitionId === "string" &&
    assessment !== undefined &&
    (!assessment.memoryRequired ||
      (Number.isInteger(selectedCard.memoryCost) &&
        Number(selectedCard.memoryCost) > 0 &&
        assessment.canFreeRequiredMemory &&
        (selectedCards?.length ?? 0) > 0 &&
        memoryFreed === assessment.memoryFreedBySelectedCandidates &&
        memoryFreed >= assessment.requiredMemoryToFree));
  if (!exactBinding || !executor || !signal || !action || !selectedCard) {
    throw new PlanResolutionFailure("commitment_invalidated", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: action ? [action.actionId] : [],
      owner: "continuation",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
      removalCondition:
        "The resident Runner development plan must bind one exact visible delayed program-search target and any required acceptable MU sacrifice before choice resolution.",
    });
  }
  signal.phase = "resolve_delayed_program_search_choice";
  signal.semanticActionTypes = ["choice.resolve"];
  signal.actionIds = [action.actionId];
  signal.evidenceCode =
    "runner_delayed_program_search_target_bound_by_development_plan";
  signal.delayedProgramSearchChoiceBinding = {
    choiceId: choice.choiceId,
    choiceSource: choice.source,
    actionId: action.actionId,
    sourceCardInstanceId: choice.sourceCardInstanceId!,
    sourceDefinitionId: choice.sourceCardDefinitionId!,
    sourceStateVersion: input.playerView.stateVersion,
    selectedOptionId: selectedOption.id,
    targetCardInstanceId: selectedCard.instanceId,
    targetDefinitionId: selectedCard.definitionId!,
    ...(assessment!.memoryRequired
      ? {
          installMemorySacrificeBinding: {
            targetCardInstanceId: selectedCard.instanceId,
            targetMemoryCost: selectedCard.memoryCost!,
            requiredMemoryToFree: assessment!.requiredMemoryToFree,
            selectedCards: selectedCards!,
          },
        }
      : {}),
  };
  result.portfolio.stateVersion = input.playerView.stateVersion;
}

export function resolvePlanBoundRunnerEventInstallMemoryChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  const choice = context.input.playerView.pendingChoice;
  if (
    context.input.side !== "runner" ||
    !choice?.source.startsWith("runner.program_install_memory:nonsearch:")
  ) {
    return undefined;
  }
  const sourceParts = choice.source.split(":");
  const targetCardInstanceId = sourceParts[2];
  const originalChoiceId = decodeURIComponent(sourceParts[4] ?? "");
  const originalChoiceSource = decodeURIComponent(sourceParts[5] ?? "");
  const executor = previous?.instances.find(
    (instance) =>
      instance.instanceId === previous.executorInstanceId &&
      (instance.moduleId === "runner.develop_board_and_hand" ||
        instance.moduleId === "runner.rig_and_coverage") &&
      instance.executionState === "executor",
  );
  const root = previous?.instances.find(
    (instance) => instance.instanceId === previous.rootForegroundInstanceId,
  );
  const moduleState = executor?.moduleState as
    | { kind?: unknown; signal?: RunnerDevelopmentSignal }
    | undefined;
  const signal = moduleState?.signal;
  const commitment = signal?.eventInstallChoiceCommitment;
  const binding = signal?.eventInstallChoiceBinding;
  const delayedBinding = signal?.delayedProgramSearchChoiceBinding;
  const activeBinding = binding ?? delayedBinding;
  const sacrifice =
    commitment?.installMemorySacrificeBinding ??
    delayedBinding?.installMemorySacrificeBinding;
  const boundTargetCardInstanceId =
    commitment?.targetCardInstanceId ?? delayedBinding?.targetCardInstanceId;
  const coverageState = executor?.moduleState as
    | {
        kind?: string;
        phase?: string;
        selectedSearchActionId?: string;
        selectedSearchStateVersion?: number;
        gap?: RunnerCoverageGapSignal;
      }
    | undefined;
  const coverageBindings =
    coverageState?.gap?.directSearchChoiceBindings?.filter(
      (candidate) =>
        candidate.actionId === coverageState.selectedSearchActionId &&
        candidate.resolvedSearchChoice?.choiceId === originalChoiceId &&
        candidate.resolvedSearchChoice.choiceSource === originalChoiceSource &&
        candidate.resolvedSearchChoice.stateVersion ===
          previous?.stateVersion &&
        candidate.targetCardInstanceId === targetCardInstanceId &&
        candidate.installMemorySacrificeBinding?.targetCardInstanceId ===
          targetCardInstanceId,
    );
  const exactCoverageBinding =
    executor?.moduleId === "runner.rig_and_coverage" &&
    coverageState?.kind === "coverage" &&
    coverageState.phase === "search_answer" &&
    coverageState.selectedSearchStateVersion === previous?.stateVersion &&
    coverageBindings?.length === 1;
  const action =
    context.input.legalActions.length === 1
      ? context.input.legalActions[0]
      : undefined;
  const requirement = action?.choiceRequirements?.[0];
  const optionIds = choice.options.map((option) => option.id);
  const exactBinding =
    sourceParts.length === 6 &&
    sourceParts[0] === "runner.program_install_memory" &&
    sourceParts[1] === "nonsearch" &&
    typeof targetCardInstanceId === "string" &&
    previous?.side === "runner" &&
    previous.stateVersion === context.input.playerView.stateVersion - 1 &&
    previous.rootForegroundInstanceId === root?.instanceId &&
    previous.executorInstanceId === executor?.instanceId &&
    (exactCoverageBinding ||
      (moduleState?.kind === "development" &&
        (signal?.phase === "resolve_event_install_choice" ||
          signal?.phase === "resolve_delayed_program_search_choice") &&
        activeBinding?.sourceStateVersion === previous.stateVersion &&
        activeBinding.choiceId === originalChoiceId &&
        activeBinding.choiceSource === originalChoiceSource &&
        activeBinding.targetCardInstanceId === targetCardInstanceId &&
        boundTargetCardInstanceId === targetCardInstanceId &&
        sacrifice?.targetCardInstanceId === targetCardInstanceId)) &&
    choice.side === "runner" &&
    choice.kind === "select_cards" &&
    choice.visibility === "hidden_info_barrier" &&
    choice.stateVersion === context.input.playerView.stateVersion &&
    choice.minSelections >= 1 &&
    choice.maxSelections === choice.options.length &&
    action?.side === "runner" &&
    action.type === "resolve_choice" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === context.input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === choice.minSelections &&
    requirement.maxSelections === choice.maxSelections &&
    requirement.optionIds.length === optionIds.length &&
    optionIds.every((optionId) => requirement.optionIds.includes(optionId));
  if (!exactBinding || !action || !previous || !executor || !root) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: context.input.legalActions.map(
        (legalAction) => legalAction.actionId,
      ),
      owner: "continuation",
      removalCondition:
        "Resolve program-install memory pressure only from the immediately preceding Runner development or coverage executor, its exact search/install choice, prebound target and sacrifice, and the current Engine choice contract.",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
    });
  }
  return {
    actionId: action.actionId,
    reasonCode: "plan_bound_runner_event_install_memory_choice",
    origin: {
      rootPlanInstanceId: root.instanceId,
      leafPlanInstanceId: executor.instanceId,
      side: "runner",
      windowKind: "mandatory_choice",
      windowId: choice.choiceId,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
    },
  };
}

export function bindSelectedRunnerProgramInstallTrashChoiceContinuation(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
  assessInstall: RunnerDevelopmentInstallServices["assessAction"],
): void {
  if (input.side !== "runner" || result.lane !== "plan") return;
  const selectedAction = input.legalActions.find(
    (action) => action.actionId === result.route.head.actionId,
  );
  if (
    selectedAction?.side !== "runner" ||
    selectedAction.type !== "install_card" ||
    (selectedAction.payload?.runnerProgramTrashBeforeInstall !== true &&
      !/(?:^|\.)runner_program_trash_before_install(?:\.|$)/.test(
        selectedAction.actionId,
      ))
  ) {
    return;
  }
  const executor = result.portfolio.instances.find(
    (instance) => instance.instanceId === result.portfolio.executorInstanceId,
  );
  const sourceCardInstanceId =
    typeof selectedAction.payload?.cardId === "string"
      ? selectedAction.payload.cardId
      : undefined;
  const assessment = assessInstall(input, selectedAction);
  const selectedCards = assessment?.selectedCandidates.map((candidate) => ({
    cardInstanceId: candidate.card?.instanceId,
    memoryCost: candidate.memoryCost,
    acceptable: candidate.acceptable,
  }));
  const exactSelectedCards =
    selectedCards !== undefined &&
    selectedCards.length > 0 &&
    selectedCards.every(
      (candidate) =>
        typeof candidate.cardInstanceId === "string" &&
        candidate.cardInstanceId.length > 0 &&
        Number.isInteger(candidate.memoryCost) &&
        candidate.memoryCost > 0 &&
        candidate.acceptable,
    ) &&
    new Set(selectedCards.map((candidate) => candidate.cardInstanceId)).size ===
      selectedCards.length;
  const memoryFreed =
    selectedCards?.reduce(
      (total, candidate) => total + candidate.memoryCost,
      0,
    ) ?? 0;
  if (
    !executor ||
    !result.portfolio.rootForegroundInstanceId ||
    !sourceCardInstanceId ||
    assessment?.memoryRequired !== true ||
    assessment.canFreeRequiredMemory !== true ||
    !Number.isInteger(assessment.requiredMemoryToFree) ||
    assessment.requiredMemoryToFree <= 0 ||
    !exactSelectedCards ||
    memoryFreed < assessment.requiredMemoryToFree ||
    memoryFreed !== assessment.memoryFreedBySelectedCandidates
  ) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [result.route.head.actionId],
      owner: "continuation",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
      stepId: result.route.head.stepId,
      removalCondition:
        "A Runner plan may select a program-trash install only after binding an exact acceptable installed-program sacrifice set that frees the Engine-quoted memory deficit.",
    });
  }
  result.portfolio.selectedActionOrigin = {
    rootPlanInstanceId: result.portfolio.rootForegroundInstanceId!,
    executorInstanceId: executor.instanceId,
    selectedActionId: selectedAction.actionId,
    selectedAtStateVersion: input.playerView.stateVersion,
    immediateChoicePolicy: "resolve_runner_program_trash_before_install",
    sourceCardInstanceId,
    requiredMemoryToFree: assessment.requiredMemoryToFree,
    selectedCards: selectedCards.map((candidate) => ({
      cardInstanceId: candidate.cardInstanceId!,
      memoryCost: candidate.memoryCost,
    })),
  };
  result.diagnostics.push({
    stage: "route",
    code: "runner_program_trash_choice_bound",
    instanceId: executor.instanceId,
    moduleId: executor.moduleId,
  });
}

export function resolvePlanBoundRunnerProgramTrashChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  const choice = context.input.playerView.pendingChoice;
  if (
    context.input.side !== "runner" ||
    choice?.continuation?.family !== "runner_program_trash_before_install"
  ) {
    return undefined;
  }
  const origin = previous?.selectedActionOrigin;
  const bound =
    origin?.immediateChoicePolicy ===
    "resolve_runner_program_trash_before_install";
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
  const exactBinding =
    bound &&
    previous !== undefined &&
    previous.side === "runner" &&
    previous.stateVersion + 1 === context.input.playerView.stateVersion &&
    origin.selectedAtStateVersion === previous.stateVersion &&
    origin.selectedActionId === choice.continuation.originActionId &&
    origin.sourceCardInstanceId === choice.sourceCardInstanceId &&
    choice.continuation.sourceCardInstanceId === origin.sourceCardInstanceId &&
    choice.continuation.createdAtStateVersion ===
      context.input.playerView.stateVersion &&
    choice.stateVersion === context.input.playerView.stateVersion &&
    choice.kind === "select_cards" &&
    choice.visibility === "hidden_info_barrier" &&
    previous.rootForegroundInstanceId === origin.rootPlanInstanceId &&
    previous.executorInstanceId === origin.executorInstanceId &&
    root !== undefined &&
    executor !== undefined &&
    action !== undefined &&
    action.side === "runner" &&
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
        "Resolve a program-trash install choice only from the immediately preceding Runner plan executor, exact selected install action and current Engine choice contract.",
    });
  }
  return {
    actionId: action.actionId,
    reasonCode: "plan_bound_runner_program_trash_choice",
    origin: {
      rootPlanInstanceId: origin.rootPlanInstanceId,
      leafPlanInstanceId: origin.executorInstanceId,
      side: "runner",
      windowKind: "mandatory_choice",
      windowId: choice.choiceId,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
    },
  };
}

export function bindRunnerDevelopmentSearchEngineContinuation(
  input: AiDecisionInput,
  result: Extract<PlanSchedulerResult, { lane: "engine_window" }>,
  pending: NonNullable<
    ResidentPlanPortfolio["pendingRunnerCostPenaltySupportOrigin"]
  >,
): void {
  const portfolio = result.portfolio;
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === pending.executorInstanceId &&
      instance.moduleId === "runner.develop_board_and_hand",
  );
  const state = executor?.moduleState as
    | { kind?: unknown; signal?: RunnerDevelopmentSignal }
    | undefined;
  const commitments = [
    state?.signal?.programSearchCommitment,
    state?.signal?.recoverySearchCommitment,
  ].filter((commitment) => commitment !== undefined);
  if (commitments.length === 0) return;
  const commitment = commitments[0]!;
  const exactContinuation =
    commitments.length === 1 &&
    state?.kind === "development" &&
    state.signal?.phase === "execute" &&
    executor?.executionState === "executor" &&
    portfolio?.rootForegroundInstanceId === pending.rootPlanInstanceId &&
    portfolio?.executorInstanceId === pending.executorInstanceId &&
    result.origin.rootPlanInstanceId === pending.rootPlanInstanceId &&
    result.origin.leafPlanInstanceId === pending.executorInstanceId &&
    result.actionId === pending.originalActionId &&
    commitment.selectedActionId === pending.originalActionId &&
    commitment.plannedAtStateVersion === pending.selectedAtStateVersion &&
    commitment.selectedAtStateVersion === pending.selectedAtStateVersion &&
    commitment.engineContinuationAtStateVersion === undefined &&
    input.playerView.stateVersion > pending.selectedAtStateVersion;
  if (!exactContinuation) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [pending.originalActionId],
      owner: "continuation",
      planInstanceId: pending.executorInstanceId,
      stepId: pending.sourceStepId,
      removalCondition:
        "Bind a development search continuation only to its unchanged selected action, source, target and executor after the exact Engine payment window.",
    });
  }
  commitment.engineContinuationAtStateVersion = input.playerView.stateVersion;
}

export function bindRunnerEventInstallChoiceEngineContinuation(
  input: AiDecisionInput,
  result: Extract<PlanSchedulerResult, { lane: "engine_window" }>,
  pending: NonNullable<
    ResidentPlanPortfolio["pendingRunnerCostPenaltySupportOrigin"]
  >,
): void {
  const portfolio = result.portfolio;
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === pending.executorInstanceId &&
      instance.moduleId === "runner.develop_board_and_hand" &&
      instance.executionState === "executor",
  );
  const moduleState = executor?.moduleState as
    | { kind?: unknown; signal?: RunnerDevelopmentSignal }
    | undefined;
  const commitment = moduleState?.signal?.eventInstallChoiceCommitment;
  if (!commitment) return;
  const exactContinuation =
    portfolio !== undefined &&
    moduleState?.kind === "development" &&
    portfolio.rootForegroundInstanceId === pending.rootPlanInstanceId &&
    portfolio.executorInstanceId === pending.executorInstanceId &&
    result.origin.rootPlanInstanceId === pending.rootPlanInstanceId &&
    result.origin.leafPlanInstanceId === pending.executorInstanceId &&
    result.actionId === pending.originalActionId &&
    commitment.sourceActionId === pending.originalActionId &&
    commitment.selectedAtStateVersion === pending.selectedAtStateVersion &&
    commitment.engineContinuationAtStateVersion === undefined;
  if (!executor || !exactContinuation) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [pending.originalActionId],
      owner: "continuation",
      planInstanceId: pending.executorInstanceId,
      stepId: pending.sourceStepId,
      removalCondition:
        "Carry an event-install commitment through a payment window only after the exact original action, development executor and Engine continuation were validated.",
    });
  }
  moduleState.signal!.eventInstallChoiceCommitment = {
    ...commitment,
    engineContinuationAtStateVersion: input.playerView.stateVersion,
  };
}

export function bindSelectedRunnerEventInstallChoiceContinuation(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
): void {
  if (
    result.lane !== "plan" ||
    result.route.head.semanticActionType !== "play.runner_event"
  )
    return;
  const executor = result.portfolio.instances.find(
    (instance) =>
      instance.instanceId === result.portfolio.executorInstanceId &&
      instance.moduleId === "runner.develop_board_and_hand",
  );
  const moduleState = executor?.moduleState as
    | { kind?: unknown; signal?: RunnerDevelopmentSignal }
    | undefined;
  const commitment = moduleState?.signal?.eventInstallChoiceCommitment;
  if (!commitment) return;
  const sourceAction = input.legalActions.find(
    (action) => action.actionId === result.route.head.actionId,
  );
  const exactBinding =
    input.side === "runner" &&
    moduleState?.kind === "development" &&
    moduleState.signal?.phase === "execute" &&
    moduleState.signal.developmentId === executor?.dedupeKey &&
    commitment.sourceActionId === result.route.head.actionId &&
    commitment.selectedAtStateVersion === undefined &&
    sourceAction?.side === "runner" &&
    sourceAction.type === "play_event" &&
    sourceAction.expiresAtStateVersion === input.playerView.stateVersion &&
    sourceAction.payload?.cardId === commitment.sourceCardInstanceId &&
    input.playerView.own.gripOrHq.some(
      (card) =>
        card.instanceId === commitment.targetCardInstanceId &&
        card.known !== false &&
        card.definitionId === commitment.targetDefinitionId,
    );
  if (!executor || !exactBinding) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [result.route.head.actionId],
      owner: "continuation",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
      removalCondition:
        "Select an event-install action only through the exact development executor that prebound its Engine-quoted visible target and canonical source capability.",
    });
  }
  moduleState.signal!.eventInstallChoiceCommitment = {
    ...commitment,
    selectedAtStateVersion: input.playerView.stateVersion,
  };
}

export function bindSelectedRunnerProgramSearchAction(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
  candidates: readonly ActionSemanticCandidate[],
): void {
  if (result.lane !== "plan") return;
  const executor = result.portfolio.instances.find(
    (instance) =>
      instance.instanceId === result.portfolio.executorInstanceId &&
      instance.moduleId === "runner.develop_board_and_hand",
  );
  const moduleState = executor?.moduleState as
    | { kind?: unknown; signal?: RunnerDevelopmentSignal }
    | undefined;
  const signal = moduleState?.signal;
  const commitment = signal?.programSearchCommitment;
  if (!executor || moduleState?.kind !== "development" || !commitment) return;
  const candidate = candidates.find(
    (entry) => entry.actionId === result.route.head.actionId,
  );
  if (candidate && !runnerCandidateExecutesProgramSearch(input, candidate)) {
    return;
  }
  const sourceCardInstanceId = candidate
    ? runnerProgramSearchSourceCardInstanceId(input, candidate)
    : undefined;
  const exactBinding =
    signal.phase === "execute" &&
    signal.targetKind === "capability" &&
    signal.actionIds.includes(result.route.head.actionId) &&
    candidate !== undefined &&
    sourceCardInstanceId === commitment.sourceCardInstanceId &&
    runnerCandidateSourceDefinitionId(input, candidate) ===
      commitment.sourceDefinitionId &&
    commitment.plannedAtStateVersion === input.playerView.stateVersion &&
    commitment.selectedActionId === undefined &&
    commitment.selectedAtStateVersion === undefined;
  if (!exactBinding) {
    throw new PlanResolutionFailure("invalid_support_graph", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [result.route.head.actionId],
      owner: "support_graph",
      planInstanceId: executor.instanceId,
      stepId: result.route.head.stepId,
      removalCondition:
        "Select a strategic Runner program search only from its exact development-plan source, current LegalAction and prebound useful program target.",
    });
  }
  commitment.selectedActionId = result.route.head.actionId;
  commitment.selectedAtStateVersion = input.playerView.stateVersion;
}

export function bindSelectedRunnerRecoverySearchAction(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
  candidates: readonly ActionSemanticCandidate[],
): void {
  if (result.lane !== "plan") return;
  const executor = result.portfolio.instances.find(
    (instance) =>
      instance.instanceId === result.portfolio.executorInstanceId &&
      instance.moduleId === "runner.develop_board_and_hand",
  );
  const moduleState = executor?.moduleState as
    | { kind?: unknown; signal?: RunnerDevelopmentSignal }
    | undefined;
  const signal = moduleState?.signal;
  const commitment = signal?.recoverySearchCommitment;
  if (!executor || moduleState?.kind !== "development" || !commitment) return;
  const candidate = candidates.find(
    (entry) => entry.actionId === result.route.head.actionId,
  );
  const recoveryContract = candidate
    ? runnerHeapRecoveryActionContract(input, candidate)
    : undefined;
  const exactBinding =
    signal.phase === "execute" &&
    signal.targetKind === "capability" &&
    signal.actionIds.includes(result.route.head.actionId) &&
    candidate !== undefined &&
    recoveryContract !== undefined &&
    recoveryContract.searchFilter === commitment.searchFilter &&
    (recoveryContract.exactTargetCardId === undefined ||
      recoveryContract.exactTargetCardId === commitment.targetCardInstanceId) &&
    runnerProgramSearchSourceCardInstanceId(input, candidate) ===
      commitment.sourceCardInstanceId &&
    runnerCandidateSourceDefinitionId(input, candidate) ===
      commitment.sourceDefinitionId &&
    input.playerView.own.heapOrArchives.some(
      (card) =>
        card.known === true &&
        card.instanceId === commitment.targetCardInstanceId &&
        card.definitionId === commitment.targetDefinitionId &&
        (commitment.searchFilter === "any_card" || card.type === "program"),
    ) &&
    commitment.plannedAtStateVersion === input.playerView.stateVersion &&
    commitment.selectedActionId === undefined &&
    commitment.selectedAtStateVersion === undefined;
  if (!exactBinding) {
    throw new PlanResolutionFailure("invalid_support_graph", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: [result.route.head.actionId],
      owner: "support_graph",
      planInstanceId: executor.instanceId,
      stepId: result.route.head.stepId,
      removalCondition:
        "Select a Runner heap-recovery search only from its exact development-plan source, current LegalAction and prebound visible recovery target.",
    });
  }
  commitment.selectedActionId = result.route.head.actionId;
  commitment.selectedAtStateVersion = input.playerView.stateVersion;
}
