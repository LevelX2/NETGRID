import type { AiDecision, LegalAction } from "@netgrid/shared";
import type { SemanticRuntimeChoice } from "./semantic-runtime-types";

export function semanticRuntimeChoiceIsReactive(
  choice: SemanticRuntimeChoice,
): boolean {
  return semanticRuntimeActionTypeIsReactive(choice.action.type);
}

export function semanticRuntimeActionTypeIsReactive(
  type: LegalAction["type"],
): boolean {
  return (
    type === "mandatory_draw" ||
    type === "resolve_choice" ||
    type === "access_card" ||
    type === "steal_agenda" ||
    type === "trash_accessed_card" ||
    type === "decline_trash" ||
    type === "break_subroutine" ||
    type === "pump_breaker" ||
    type === "continue_run" ||
    type === "jack_out" ||
    false
  );
}

export function isCorpReactiveBaselineDecision(decision: AiDecision): boolean {
  return (
    decision.reasonCode === "corp.choice.resolve" ||
    decision.reasonCode === "corp.trace.bid_visible_amount" ||
    decision.reasonCode === "corp.mandatory_draw" ||
    decision.reasonCode === "corp.rez.defensive_card" ||
    decision.reasonCode === "corp.rez.decline" ||
    decision.reasonCode === "corp.tag.punish_visible_tag" ||
    decision.reasonCode === "corp.tag.source_visible_payoff" ||
    decision.reasonCode === "corp.tag.trash_visible_resource" ||
    decision.reasonCode === "corp.purge.visible_virus_counters"
  );
}

export function isRunnerReactiveBaselineDecision(decision: AiDecision): boolean {
  return (
    decision.reasonCode === "runner.choice.resolve" ||
    decision.reasonCode === "runner.trace.post_bid_link" ||
    decision.reasonCode === "runner.setup.keep" ||
    decision.reasonCode === "runner.setup.mulligan" ||
    decision.reasonCode === "runner.trace.bid_visible_amount" ||
    decision.reasonCode === "runner.access.steal_agenda" ||
    decision.reasonCode === "runner.access.open_card" ||
    decision.reasonCode === "runner.access.decline_trash" ||
    decision.reasonCode === "runner.encounter.break_etr" ||
    decision.reasonCode === "runner.encounter.break_run_remainder_effect" ||
    decision.reasonCode === "runner.encounter.pump_breaker" ||
    decision.reasonCode === "runner.encounter.pump_run_remainder_effect" ||
    decision.reasonCode ===
      "runner.encounter.continue_visible_future_path_risk" ||
    decision.reasonCode === "runner.tag.clear_visible_tag" ||
    decision.reasonCode === "runner.shell_traders.prepare_install" ||
    decision.reasonCode === "runner.shell_traders.remove_counter"
  );
}
