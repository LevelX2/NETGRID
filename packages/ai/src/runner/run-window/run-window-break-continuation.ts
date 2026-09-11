import { visibleBreakerEncounterQuote } from "@netgrid/engine";
import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import {
  type EngineWindowResolution,
  type PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { currentEncounteredIceCard } from "../../runtime/current-encounter";
import { visibleRunnerRunPathCreditBudgetForRig } from "../../visible-run-analysis";

export function runnerPostBreakStealthLossChoiceBinding(
  input: AiDecisionInput,
  action: LegalAction,
):
  | {
      breakerInstanceId: string;
      requiredLoss: number;
      sourceMode: "single_stealth_card" | "any_stealth_cards";
    }
  | undefined {
  if (action.type !== "break_subroutine") return undefined;
  const breakerInstanceId =
    typeof action.payload?.breakerId === "string"
      ? action.payload.breakerId
      : action.source;
  const breaker = input.playerView.own.rig?.find(
    (card) => card.instanceId === breakerInstanceId && card.known !== false,
  );
  const ice = currentEncounteredIceCard(input);
  if (!breaker?.definitionId || !ice?.definitionId) return undefined;
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
    iceDefinitionId: ice.definitionId,
    iceInstanceId: ice.instanceId,
    ...(ice.subtypes ? { iceSubtypes: ice.subtypes } : {}),
    ...(ice.effectiveRunQuote?.subroutines
      ? { subroutines: ice.effectiveRunQuote.subroutines }
      : {}),
  });
  if (!quote) return undefined;
  const losses = quote.breakOptions
    .flatMap((option) => option.consequences)
    .filter(
      (
        consequence,
      ): consequence is Extract<
        (typeof quote)["breakOptions"][number]["consequences"][number],
        { kind: "lose_stealth_credits" }
      > => consequence.kind === "lose_stealth_credits",
    );
  const distinctLosses = [
    ...new Map(
      losses.map((loss) => [
        `${loss.amount}:${loss.sourceMode}:${loss.optionalIfUnavailable}`,
        loss,
      ]),
    ).values(),
  ];
  if (distinctLosses.length !== 1) return undefined;
  const [loss] = distinctLosses;
  if (!loss || !Number.isInteger(loss.amount) || loss.amount <= 0)
    return undefined;
  const visibleStealthSources = Object.entries(
    visibleRunnerRunPathCreditBudgetForRig(input.playerView.own.rig ?? [])
      .stealthCreditsBySourceId,
  ).filter(([, amount]) => amount > 0);
  const eligibleSources =
    loss.sourceMode === "single_stealth_card"
      ? visibleStealthSources.filter(([, amount]) => amount >= loss.amount)
      : visibleStealthSources;
  const totalAvailable = visibleStealthSources.reduce(
    (total, [, amount]) => total + amount,
    0,
  );
  if (
    eligibleSources.length <= 1 ||
    (loss.sourceMode === "any_stealth_cards" &&
      totalAvailable < loss.amount &&
      !loss.optionalIfUnavailable)
  )
    return undefined;
  return {
    breakerInstanceId,
    requiredLoss:
      loss.sourceMode === "any_stealth_cards"
        ? Math.min(loss.amount, totalAvailable)
        : loss.amount,
    sourceMode: loss.sourceMode,
  };
}

export function resolvePlanBoundRunnerPostBreakStealthLossChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  const choice = context.input.playerView.pendingChoice;
  if (
    context.input.side !== "runner" ||
    choice?.continuation?.family !== "runner_post_break_stealth_loss"
  )
    return undefined;
  const origin = previous?.selectedActionOrigin;
  const bound =
    origin?.immediateChoicePolicy === "resolve_runner_post_break_stealth_loss";
  const root = previous?.instances.find(
    (instance) => instance.instanceId === origin?.rootPlanInstanceId,
  );
  const executor = previous?.instances.find(
    (instance) =>
      instance.instanceId === origin?.executorInstanceId &&
      instance.executionState === "executor",
  );
  const choiceActions = context.input.legalActions.filter(
    (action) => action.type === "resolve_choice",
  );
  const action = choiceActions.length === 1 ? choiceActions[0] : undefined;
  const [requirement] = action?.choiceRequirements ?? [];
  const optionIds = choice.options.map((option) => option.id);
  const continuation = choice.continuation;
  const expectedSelections =
    continuation.sourceMode === "single_stealth_card"
      ? 1
      : continuation.requiredLoss;
  const exactBinding =
    bound &&
    previous !== undefined &&
    previous.side === "runner" &&
    previous.stateVersion + 1 === context.input.playerView.stateVersion &&
    origin.selectedAtStateVersion === previous.stateVersion &&
    origin.selectedActionId === continuation.originActionId &&
    origin.breakerInstanceId === continuation.breakerInstanceId &&
    origin.requiredLoss === continuation.requiredLoss &&
    origin.sourceMode === continuation.sourceMode &&
    continuation.createdAtStateVersion ===
      context.input.playerView.stateVersion &&
    choice.stateVersion === context.input.playerView.stateVersion &&
    choice.source ===
      `v1922.post_break_stealth_loss:${continuation.sourceMode}:${continuation.requiredLoss}:${continuation.breakerInstanceId}:${context.input.playerView.stateVersion}` &&
    choice.kind === "select_cards" &&
    choice.visibility === "hidden_info_barrier" &&
    choice.minSelections === expectedSelections &&
    choice.maxSelections === expectedSelections &&
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
        "Resolve the post-break Stealth-loss choice only from the immediately preceding Runner run-window executor, exact break action and current Engine continuation.",
    });
  }
  return {
    actionId: action.actionId,
    reasonCode: "plan_bound_runner_post_break_stealth_loss_choice",
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

export function resolvePlanBoundRunnerBrokenIceVirusCounterChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  const choice = context.input.playerView.pendingChoice;
  if (
    context.input.side !== "runner" ||
    !choice?.source.startsWith("broken_ice.virus_counter:")
  ) {
    return undefined;
  }
  const executor = previous?.instances.find(
    (instance) =>
      instance.instanceId === previous.executorInstanceId &&
      (instance.moduleId === "runner.convert_run_window" ||
        instance.moduleId === "runner.pressure_central" ||
        instance.moduleId === "runner.contest_remote") &&
      instance.executionState === "executor",
  );
  const executorState = executor?.moduleState as
    | {
        kind?: unknown;
        brokenIceVirusCounterChoiceBinding?: {
          choiceId: string;
          actionId: string;
          selectedOptionIds: string[];
          observedAtStateVersion: number;
        };
      }
    | undefined;
  const root = previous?.instances.find(
    (instance) => instance.instanceId === previous.rootForegroundInstanceId,
  );
  const choiceActions = context.input.legalActions.filter(
    (action) => action.type === "resolve_choice",
  );
  const action = choiceActions.length === 1 ? choiceActions[0] : undefined;
  const [requirement] = action?.choiceRequirements ?? [];
  const optionIds = choice.options.map((option) => option.id);
  const selectedOptionIds = planBoundRunnerBrokenIceVirusCounterOptions(
    context.input,
    choice,
  );
  const exactChoiceState =
    choice.source ===
      `broken_ice.virus_counter:${context.input.playerView.stateVersion}` &&
    choice.choiceId ===
      `broken_ice_virus_counter_${context.input.playerView.stateVersion}`;
  const exactBinding =
    previous !== undefined &&
    previous.side === "runner" &&
    previous.stateVersion === context.input.playerView.stateVersion - 1 &&
    root?.side === "runner" &&
    executor !== undefined &&
    (executor.parentInstanceId === root.instanceId ||
      executor.instanceId === root.instanceId) &&
    (executorState?.kind === "run_window" ||
      executorState?.kind === "central_pressure" ||
      executorState?.kind === "remote_contest") &&
    previous.turnPlanCommitment?.status === "active" &&
    previous.turnPlanCommitment.sequenceRootPlanInstanceId ===
      root.instanceId &&
    exactChoiceState &&
    choice.side === "runner" &&
    choice.kind === "select_option" &&
    choice.visibility === "public" &&
    choice.stateVersion === context.input.playerView.stateVersion &&
    choice.minSelections > 0 &&
    choice.maxSelections === choice.minSelections &&
    selectedOptionIds !== undefined &&
    selectedOptionIds.length === choice.minSelections &&
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
  if (
    !exactBinding ||
    !action ||
    !root ||
    !executor ||
    !executorState ||
    !selectedOptionIds
  ) {
    const failedChecks = [
      ["previous", previous !== undefined],
      ["previous_side", previous?.side === "runner"],
      [
        "previous_state",
        previous?.stateVersion === context.input.playerView.stateVersion - 1,
      ],
      ["root", root?.side === "runner"],
      ["executor", executor !== undefined],
      [
        "executor_kind",
        ["run_window", "central_pressure", "remote_contest"].includes(
          String(executorState?.kind),
        ),
      ],
      ["turn_plan", previous?.turnPlanCommitment?.status === "active"],
      ["choice_state", exactChoiceState],
      ["selection", selectedOptionIds !== undefined],
      ["action", action !== undefined],
      ["action_source", action?.source === "game_rule"],
      [
        "action_state",
        action?.expiresAtStateVersion === context.input.playerView.stateVersion,
      ],
      ["choice_requirement", requirement?.choiceId === choice.choiceId],
    ]
      .filter(([, valid]) => !valid)
      .map(([name]) => name)
      .join(",");
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
      removalCondition: `Resolve broken-ICE virus counters only from the immediately preceding active Runner run-plan executor, one complete option group per source and the exact current Engine choice contract. Failed=${failedChecks || "unknown"}.`,
    });
  }
  executorState.brokenIceVirusCounterChoiceBinding = {
    choiceId: choice.choiceId,
    actionId: action.actionId,
    selectedOptionIds,
    observedAtStateVersion: context.input.playerView.stateVersion,
  };
  return {
    actionId: action.actionId,
    reasonCode: "plan_bound_runner_broken_ice_virus_counter_choice",
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

function planBoundRunnerBrokenIceVirusCounterOptions(
  input: AiDecisionInput,
  choice: NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>,
): string[] | undefined {
  const targetById = new Map(
    input.playerView.servers.flatMap((server) =>
      server.ice
        .filter(
          (card) =>
            card.known &&
            card.rezzed === true &&
            typeof card.definitionId === "string" &&
            (typeof card.effectiveRunQuote?.effectiveStrength === "number" ||
              typeof card.strength === "number"),
        )
        .map((card) => [card.instanceId, card] as const),
    ),
  );
  const sourceIds = [
    ...new Set(
      choice.options.flatMap((option) =>
        typeof option.metadata?.sourceCardInstanceId === "string"
          ? [option.metadata.sourceCardInstanceId]
          : [],
      ),
    ),
  ].sort();
  if (sourceIds.length !== choice.minSelections) return undefined;
  const selected = sourceIds.flatMap((sourceId) => {
    const candidates = choice.options
      .flatMap((option) => {
        if (
          option.metadata?.sourceCardInstanceId !== sourceId ||
          typeof option.metadata.targetCardInstanceId !== "string" ||
          option.value !== option.metadata.targetCardInstanceId
        ) {
          return [];
        }
        const target = targetById.get(option.metadata.targetCardInstanceId);
        if (!target) return [];
        return [
          {
            optionId: option.id,
            targetId: target.instanceId,
            strength:
              target.effectiveRunQuote?.effectiveStrength ??
              (target.strength ?? 0) + (target.strengthModifier ?? 0),
          },
        ];
      })
      .sort(
        (left, right) =>
          right.strength - left.strength ||
          left.targetId.localeCompare(right.targetId) ||
          left.optionId.localeCompare(right.optionId),
      );
    return candidates[0] ? [candidates[0].optionId] : [];
  });
  return selected.length === sourceIds.length ? selected : undefined;
}
