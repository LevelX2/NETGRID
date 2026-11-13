import type {
  GameState,
  LegalAction,
  VisibleTraceState,
} from "@netgrid/shared";
import {
  definitionFor,
  runnerInstalledCardIds,
} from "../state/card-server-lookup";
import { traceAutoSuccessSource } from "../trace/trace-auto-success";
import { visibleRunnerMaximumTraceStrength } from "./visible-trace-ice-rez-quote";
import {
  traceCorpBaseStrength,
  traceComparisonIsSuccessful,
} from "../trace/trace-rules-profile";

/** Corp-owned quote for the live trace, independent of strategic exposure. */
export function visibleCurrentRunLockBidQuote(
  state: GameState,
  legalActions: readonly LegalAction[],
): VisibleTraceState["currentRunLockBidQuote"] {
  const { trace, run, pendingChoice: choice } = state;
  if (
    trace?.status !== "corp_bid" ||
    trace.traceRulesProfile !== "modern_open" ||
    trace.successEffect.type !== "end_run_and_run_lock" ||
    trace.successEffect.amount <= 0 ||
    trace.subroutineIndex === undefined ||
    !run ||
    run.phase !== "encounter_ice" ||
    run.encounteredIceId !== trace.sourceCardInstanceId ||
    choice?.side !== "corp" ||
    choice.kind !== "bid_amount" ||
    choice.source !== `trace:${trace.traceId}` ||
    choice.stateVersion !== state.stateVersion
  )
    return undefined;
  const maximum = visibleRunnerMaximumTraceStrength(state);
  if (maximum === undefined) return undefined;
  const base = traceCorpBaseStrength(trace);
  if (traceComparisonIsSuccessful(trace.traceRulesProfile, base, maximum))
    return undefined;
  for (const action of legalActions) {
    if (
      action.side !== "corp" ||
      action.type !== "resolve_choice" ||
      action.expiresAtStateVersion !== state.stateVersion
    )
      continue;
    const requirement = action.choiceRequirements?.find(
      (candidate) => candidate.choiceId === choice.choiceId,
    );
    if (!requirement) continue;
    const option = choice.options
      .flatMap((entry) =>
        entry.selectable !== false &&
        typeof entry.value === "number" &&
        Number.isSafeInteger(entry.value) &&
        entry.value > 0 &&
        requirement.optionIds.includes(entry.id) &&
        traceComparisonIsSuccessful(
          trace.traceRulesProfile,
          base + entry.value,
          maximum,
        )
          ? [{ id: entry.id, amount: entry.value }]
          : [],
      )
      .sort((left, right) => left.amount - right.amount)[0];
    if (option)
      return {
        runId: run.runId,
        stateVersion: state.stateVersion,
        actionId: action.actionId,
        choiceId: choice.choiceId,
        optionId: option.id,
        amount: option.amount,
      };
  }
  return undefined;
}

/** Public rule facts only; bid-dependent magnitudes remain uncertified. */
export function visibleTraceBidEffect(
  state: GameState,
): VisibleTraceState["bidEffect"] {
  const trace = state.trace;
  if (!trace) return undefined;
  switch (trace.successEffect.type) {
    case "add_tag":
    case "net_damage":
    case "add_counter":
    case "add_tag_and_counter":
    case "end_run_and_run_lock":
    case "end_run_trash_program_and_run_lock":
    case "end_run_trash_hardware_and_unpreventable_meat_damage":
    case "trash_runner_resource_and_add_tag":
      break;
    case "add_tags_by_trace_margin_over_runner_link":
    case "none":
      return undefined;
    default:
      return undefined;
  }
  const automaticSuccess = traceAutoSuccessSource({
    runnerInstalledCardIds: () =>
      runnerInstalledCardIds(state).filter(
        (id) => state.cardInstances[id]?.faceup === true,
      ),
    definitionFor: (id) => definitionFor(state, id),
  });
  if (automaticSuccess) return "automatic_success_fixed_effect";
  const maximum = visibleRunnerMaximumTraceStrength(state);
  if (
    maximum !== undefined &&
    traceComparisonIsSuccessful(
      trace.traceRulesProfile,
      traceCorpBaseStrength(trace),
      maximum,
    )
  )
    return "zero_corp_bid_guaranteed_fixed_effect";
  return undefined;
}
