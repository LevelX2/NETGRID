import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { PlanExecutionOrigin } from "./plan-continuation";
import type { ResidentPlanPortfolio } from "./resident-plan-portfolio";
import type { CorpPunishCampaignSignal } from "./corp-tactical-plan-modules";
import { PlanResolutionFailure } from "./plan-resolution-failure";
import type {
  EngineWindowResolution,
  PlanSchedulerContext,
} from "./plan-scheduler";

export function resolveCorpPunishTraceWindow(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  const input = context.input;
  if (input.side !== "corp" || input.playerView.trace?.phase !== "corp_bid")
    return undefined;
  const leaf = previous?.instances.find(
    (instance) =>
      instance.instanceId === previous.executorInstanceId &&
      instance.moduleId === "corp.execute_punish_sequence" &&
      instance.executionState === "executor",
  );
  const signal = (
    leaf?.moduleState as { signal?: CorpPunishCampaignSignal } | undefined
  )?.signal;
  if (!leaf?.parentInstanceId || !signal?.routeContract?.traceBidBinding)
    return undefined;
  const action = input.legalActions.find(
    (action) => action.type === "resolve_choice",
  );
  if (!action) return undefined;
  const origin: PlanExecutionOrigin = {
    rootPlanInstanceId: leaf.parentInstanceId,
    leafPlanInstanceId: leaf.instanceId,
    side: "corp",
    windowKind: "trace",
    windowId: input.playerView.trace.traceId,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
  };
  boundCorpPunishTraceChoices(input, action, origin, previous);
  return {
    actionId: action.actionId,
    origin,
    reasonCode: "corp_punish_priced_trace_continuation",
  };
}

/** Resolves only the amount already priced by the selected Punish route. */
export function boundCorpPunishTraceChoices(
  input: AiDecisionInput,
  action: LegalAction,
  origin: PlanExecutionOrigin,
  portfolio: ResidentPlanPortfolio | undefined,
): { choiceId: string; selectedOptionIds: string[] } | undefined {
  const trace = input.playerView.trace;
  const choice = input.playerView.pendingChoice;
  if (input.side !== "corp" || trace?.phase !== "corp_bid" || !choice)
    return undefined;
  const leaf = portfolio?.instances.find(
    (instance) => instance.instanceId === origin.leafPlanInstanceId,
  );
  if (leaf?.moduleId !== "corp.execute_punish_sequence") return undefined;
  const signal = (leaf.moduleState as { signal?: CorpPunishCampaignSignal })
    .signal;
  const binding = signal?.routeContract?.traceBidBinding;
  if (!binding) return undefined;
  const option = choice.options.find(
    (option) => option.value === binding.amount,
  );
  const requirement = action.choiceRequirements?.find(
    (requirement) => requirement.choiceId === choice.choiceId,
  );
  const root = portfolio?.instances.find(
    (instance) => instance.instanceId === origin.rootPlanInstanceId,
  );
  if (
    origin.rootPlanInstanceId !== leaf.parentInstanceId ||
    !root ||
    !Number.isSafeInteger(binding.amount) ||
    binding.amount < 0 ||
    !requirement ||
    requirement.minSelections !== 1 ||
    requirement.maxSelections !== 1 ||
    !option ||
    !requirement.optionIds.includes(option.id) ||
    action.type !== "resolve_choice" ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    binding.quotedAtStateVersion + 1 !== input.playerView.stateVersion ||
    trace.sourceCardInstanceId !== binding.sourceCardInstanceId ||
    trace.sourceDefinitionId !== binding.sourceDefinitionId ||
    choice.side !== "corp" ||
    choice.kind !== "bid_amount" ||
    choice.source !== `trace:${trace.traceId}` ||
    choice.stateVersion !== input.playerView.stateVersion ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1 ||
    !option
  ) {
    throw new PlanResolutionFailure("invalid_support_graph", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((legal) => legal.type),
      owner: "continuation",
      planInstanceId: leaf.instanceId,
      unresolvedActionIds: [action.actionId],
      removalCondition:
        "The priced Punish bid must bind the same source, immediate Engine window, parent, executor and current bid option.",
    });
  }
  return { choiceId: choice.choiceId, selectedOptionIds: [option.id] };
}
