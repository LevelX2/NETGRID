import type { CorpPunishCampaignSignal } from "./punish-types";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { PlanExecutionOrigin } from "../../plans/plan-continuation";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";

import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { selectableChoiceOptions } from "../../runtime/choice-option";
import { exactCurrentChoiceAction } from "../../runtime/plan-bound-choice-contract";
import type {
  EngineWindowResolution,
  PlanSchedulerContext,
} from "../../plans/plan-scheduler";

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
    (offer) => offer.type === "resolve_choice",
  );
  if (!action) throw invalidPricedPunishTrace(input, leaf.instanceId);
  const origin: PlanExecutionOrigin = {
    rootPlanInstanceId: leaf.parentInstanceId,
    leafPlanInstanceId: leaf.instanceId,
    side: "corp",
    windowKind: "trace",
    windowId: String(input.playerView.trace.traceId),
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
  if (input.side !== "corp" || trace?.phase !== "corp_bid") return undefined;
  const leaf = portfolio?.instances.find(
    (instance) => instance.instanceId === origin.leafPlanInstanceId,
  );
  if (leaf?.moduleId !== "corp.execute_punish_sequence") return undefined;
  const signal = (leaf.moduleState as { signal?: CorpPunishCampaignSignal })
    .signal;
  const binding = signal?.routeContract?.traceBidBinding;
  if (!binding) return undefined;
  const options = choice
    ? selectableChoiceOptions(choice.options).filter(
        (option) => option.value === binding.amount,
      )
    : [];
  const [option] = options;
  const root = portfolio?.instances.find(
    (instance) => instance.instanceId === origin.rootPlanInstanceId,
  );
  if (
    origin.rootPlanInstanceId !== leaf.parentInstanceId ||
    origin.side !== "corp" ||
    origin.stateVersion !== input.playerView.stateVersion ||
    origin.timingPoint !== input.playerView.timingPoint ||
    origin.windowKind !== "trace" ||
    origin.windowId !== String(trace.traceId) ||
    !root ||
    !Number.isSafeInteger(binding.amount) ||
    binding.amount < 0 ||
    exactCurrentChoiceAction(input, choice) !== action ||
    options.length !== 1 ||
    !option ||
    binding.quotedAtStateVersion + 1 !== input.playerView.stateVersion ||
    trace.sourceCardInstanceId !== binding.sourceCardInstanceId ||
    trace.sourceDefinitionId !== binding.sourceDefinitionId ||
    choice?.kind !== "bid_amount" ||
    choice.source !== `trace:${trace.traceId}` ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1
  ) {
    throw invalidPricedPunishTrace(input, leaf.instanceId, action.actionId);
  }
  return { choiceId: choice.choiceId, selectedOptionIds: [option.id] };
}

function invalidPricedPunishTrace(
  input: AiDecisionInput,
  planInstanceId: string,
  actionId?: string,
): PlanResolutionFailure {
  return new PlanResolutionFailure("invalid_support_graph", {
    side: input.side,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
    legalActionTypes: input.legalActions.map((legal) => legal.type),
    owner: "continuation",
    planInstanceId,
    unresolvedActionIds: actionId ? [actionId] : [],
    removalCondition:
      "The priced Punish bid must bind the same source, immediate Engine window, parent, executor and current selectable bid option.",
  });
}
