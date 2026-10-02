import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { rolesForDeckDoctrineCard } from "../../deck-doctrine-card-roles";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type {
  EngineWindowResolution,
  PlanSchedulerContext,
  PlanSchedulerResult,
} from "../../plans/plan-scheduler";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import type { RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";
import { extractAiFeatures } from "../../runtime/ai-features";
import { selectableChoiceOptions } from "../../runtime/choice-option";
import {
  selectedSearchChoiceOptionIds,
  type SearchChoiceScoringContext,
} from "../../runtime/search-choice-option";
import { visibleCardCoversRequiredCoverage } from "./runner-search-coverage-need";

type Choice = NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>;
type CoverageState = {
  kind?: string;
  phase?: string;
  selectedSearchActionId?: string;
  selectedSearchStateVersion?: number;
  gap?: RunnerCoverageGapSignal;
  multiSearchChoiceBinding?: {
    actionId: string;
    choiceId: string;
    stateVersion: number;
    allowedOptionIds: string[];
    selectedOptionIds: string[];
  };
};

function isMultiGripSearch(choice: Choice | undefined): choice is Choice {
  return (
    choice?.side === "runner" &&
    choice.kind === "select_cards" &&
    choice.cardSearchPresentation?.sourceZone === "stack" &&
    choice.cardSearchPresentation.destination === "grip" &&
    choice.maxSelections > 1
  );
}

function failure(input: AiDecisionInput, planInstanceId?: string) {
  return new PlanResolutionFailure("window_origin_missing", {
    side: input.side,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
    legalActionTypes: input.legalActions.map((a) => a.type),
    owner: "continuation",
    ...(planInstanceId ? { planInstanceId } : {}),
    removalCondition:
      "Resolve a multiple-card grip search only from its exact selected coverage source, resident root and executor, current Engine options and owner-bound acquisition payload.",
  });
}

export function resolvePlanBoundRunnerCoverageMultiSearchChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  const { input } = context;
  const choice = input.playerView.pendingChoice;
  if (input.side !== "runner" || !isMultiGripSearch(choice)) return undefined;
  const executor = previous?.instances.find(
    (p) => p.instanceId === previous.executorInstanceId,
  );
  if (executor?.moduleId !== "runner.rig_and_coverage") return undefined;
  const root = previous?.instances.find(
    (p) => p.instanceId === previous.rootForegroundInstanceId,
  );
  const state = executor.moduleState as CoverageState;
  if (!state || state.kind !== "coverage")
    throw failure(input, executor.instanceId);
  const bindings = state.gap?.directSearchChoiceBindings?.filter(
    (b) =>
      b.actionId === state.selectedSearchActionId &&
      b.sourceCardInstanceId === choice.sourceCardInstanceId &&
      b.sourceDefinitionId === choice.sourceCardDefinitionId,
  );
  const actions = input.legalActions.filter((a) => a.type === "resolve_choice");
  const action = actions.length === 1 ? actions[0] : undefined;
  const requirement = action?.choiceRequirements?.[0];
  const options = selectableChoiceOptions(choice.options);
  const lastEvent = input.eventTail?.at(-1);
  const owned =
    root &&
    (root.instanceId === executor.instanceId ||
      (executor.parentInstanceId === root.instanceId &&
        executor.parentNeedId &&
        root.openNeedIds.includes(executor.parentNeedId) &&
        state.gap?.requesterPlanInstanceId === root.instanceId &&
        state.gap.requesterNeedId === executor.parentNeedId));
  const exact =
    previous?.side === "runner" &&
    owned &&
    executor.executionState === "executor" &&
    state.kind === "coverage" &&
    state.phase === "search_answer" &&
    bindings?.length === 1 &&
    state.selectedSearchStateVersion === previous.stateVersion &&
    previous.stateVersion === input.playerView.stateVersion - 1 &&
    choice.stateVersion === input.playerView.stateVersion &&
    choice.visibility === "hidden_info_barrier" &&
    lastEvent?.stateVersionBefore === previous.stateVersion &&
    lastEvent.stateVersionAfter === input.playerView.stateVersion &&
    ["play_event", "activated_card_ability"].includes(lastEvent.type) &&
    lastEvent.publicPayload.actor === "runner" &&
    lastEvent.publicPayload.sourceDefinitionId ===
      choice.sourceCardDefinitionId &&
    action?.side === "runner" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === choice.minSelections &&
    requirement.maxSelections === choice.maxSelections &&
    requirement.optionIds.length === options.length &&
    options.every(
      (o) =>
        requirement.optionIds.includes(o.id) &&
        o.card?.known !== false &&
        o.card?.definitionId,
    );
  if (!exact || !action || !root) throw failure(input, executor.instanceId);
  return {
    actionId: action.actionId,
    reasonCode: "plan_bound_runner_coverage_multi_search_choice",
    origin: {
      rootPlanInstanceId: root.instanceId,
      leafPlanInstanceId: executor.instanceId,
      side: "runner",
      windowKind: "mandatory_choice",
      windowId: choice.choiceId,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
    },
  };
}

export function bindSelectedRunnerCoverageMultiSearchChoice(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
): void {
  if (
    result.lane !== "engine_window" ||
    !result.diagnostics.some(
      (d) => d.code === "plan_bound_runner_coverage_multi_search_choice",
    )
  )
    return;
  const choice = input.playerView.pendingChoice;
  const executor = result.portfolio?.instances.find(
    (p) => p.instanceId === result.origin.leafPlanInstanceId,
  );
  if (
    !isMultiGripSearch(choice) ||
    executor?.moduleId !== "runner.rig_and_coverage" ||
    !result.portfolio
  )
    throw failure(input);
  const state = executor.moduleState as CoverageState;
  const bindings = state.gap?.directSearchChoiceBindings?.filter(
    (b) =>
      b.actionId === state.selectedSearchActionId &&
      b.sourceCardInstanceId === choice.sourceCardInstanceId &&
      b.sourceDefinitionId === choice.sourceCardDefinitionId,
  );
  const binding = bindings?.length === 1 ? bindings[0] : undefined;
  if (!binding || !state.gap) throw failure(input, executor.instanceId);
  const targetOptions = selectableChoiceOptions(choice.options).filter(
    (option) =>
      (binding.targetCardInstanceId !== undefined
        ? option.card?.instanceId === binding.targetCardInstanceId
        : binding.targetDefinitionId !== undefined) &&
      option.card?.definitionId === binding.targetDefinitionId,
  );
  if (targetOptions.length === 0) throw failure(input, executor.instanceId);
  const rolesForCardId = (id: string | undefined) =>
    id ? rolesForDeckDoctrineCard(id) : [];
  let scoring: SearchChoiceScoringContext = {
    features: extractAiFeatures(input, {
      rolesForCardId,
      buildServerFeatures: () => new Map(),
    }),
    rolesForCardId,
    effectsForCardId: (id) =>
      id ? (AI_HINTS_BY_CARD.get(id)?.effects ?? []) : [],
    requiredCoverage: state.gap.requiredRole,
    ...(binding.targetCardInstanceId
      ? { preferredCardInstanceId: binding.targetCardInstanceId }
      : {}),
    ...(binding.targetDefinitionId
      ? { preferredCardDefinitionId: binding.targetDefinitionId }
      : {}),
    ...(state.gap.targetServerId
      ? { preferredServerId: state.gap.targetServerId }
      : {}),
  };
  let remaining = selectableChoiceOptions(choice.options);
  const selectedOptionIds: string[] = [];
  const count = Math.min(choice.maxSelections, remaining.length);
  while (selectedOptionIds.length < count) {
    const ids = selectedSearchChoiceOptionIds(
      { ...choice, minSelections: 1, maxSelections: 1 },
      remaining,
      scoring,
    );
    const pick =
      ids?.length === 1 ? remaining.find((o) => o.id === ids[0]) : undefined;
    if (
      !pick?.card?.definitionId ||
      (selectedOptionIds.length === 0 &&
        !visibleCardCoversRequiredCoverage(
          pick.card,
          state.gap.requiredRole,
          rolesForCardId,
        ))
    )
      throw failure(input, executor.instanceId);
    selectedOptionIds.push(pick.id);
    remaining = remaining.filter((o) => o.id !== pick.id);
    const counts = new Map(scoring.features.gripDefinitionCounts);
    counts.set(
      pick.card.definitionId,
      (counts.get(pick.card.definitionId) ?? 0) + 1,
    );
    // Acquiring the bound answer satisfies this search's need once. It is
    // still in grip: do not project installation, free credits or future MU.
    scoring = {
      features: { ...scoring.features, gripDefinitionCounts: counts },
      rolesForCardId: scoring.rolesForCardId,
      effectsForCardId: scoring.effectsForCardId,
      ...(scoring.preferredServerId
        ? { preferredServerId: scoring.preferredServerId }
        : {}),
    };
  }
  if (selectedOptionIds.length < choice.minSelections)
    throw failure(input, executor.instanceId);
  executor.moduleState = {
    ...state,
    selectedSearchStateVersion: input.playerView.stateVersion,
    multiSearchChoiceBinding: {
      actionId: result.actionId,
      choiceId: choice.choiceId,
      stateVersion: input.playerView.stateVersion,
      allowedOptionIds: selectableChoiceOptions(choice.options).map(
        (o) => o.id,
      ),
      selectedOptionIds,
    },
  };
  result.portfolio.stateVersion = input.playerView.stateVersion;
}

export function selectedBoundRunnerCoverageMultiSearchChoiceOptionIds(
  input: AiDecisionInput,
  action: LegalAction,
  portfolio: ResidentPlanPortfolio | undefined,
): string[] | undefined {
  const choice = input.playerView.pendingChoice;
  if (!isMultiGripSearch(choice)) return undefined;
  const executor = portfolio?.instances.find(
    (p) => p.instanceId === portfolio.executorInstanceId,
  );
  if (executor?.moduleId !== "runner.rig_and_coverage") return undefined;
  const bound = (executor.moduleState as CoverageState)
    .multiSearchChoiceBinding;
  const requirement = action.choiceRequirements?.[0];
  const ids = selectableChoiceOptions(choice.options).map((o) => o.id);
  const exact =
    portfolio?.stateVersion === input.playerView.stateVersion &&
    bound?.stateVersion === input.playerView.stateVersion &&
    choice.stateVersion === bound.stateVersion &&
    bound.actionId === action.actionId &&
    bound.choiceId === choice.choiceId &&
    action.expiresAtStateVersion === bound.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === bound.choiceId &&
    requirement.minSelections === choice.minSelections &&
    requirement.maxSelections === choice.maxSelections &&
    bound.allowedOptionIds.length === ids.length &&
    ids.every((id) => bound.allowedOptionIds.includes(id)) &&
    requirement.optionIds.length === ids.length &&
    ids.every((id) => requirement.optionIds.includes(id)) &&
    bound.selectedOptionIds.length >= choice.minSelections &&
    bound.selectedOptionIds.length <= choice.maxSelections &&
    new Set(bound.selectedOptionIds).size === bound.selectedOptionIds.length &&
    bound.selectedOptionIds.every((id) => ids.includes(id));
  if (!exact || !bound) throw failure(input, executor.instanceId);
  return [...bound.selectedOptionIds];
}
