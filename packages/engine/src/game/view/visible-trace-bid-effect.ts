import type { GameState, VisibleTraceState } from "@netgrid/shared";
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
