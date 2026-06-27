import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { candidateSemanticText } from "./tactical-plan-candidate-text";
import type { PlanStep } from "./tactical-plan-types";

export function candidateSemanticsMatchStep(
  step: PlanStep,
  candidate: ActionSemanticCandidate,
): boolean {
  const signalText = candidateSemanticText(candidate);
  switch (step.kind) {
    case "install_breaker":
      return /install\.card/.test(signalText) &&
        /breaker|icebreaker|program/.test(signalText);
    case "search_for_answer":
      return /program_search|breaker_search|search\.stack|search_for_answer|setup\.program_search/.test(signalText);
    case "setup_search_engine":
      return /install\.card/.test(signalText) &&
        /program_search|breaker_search|search\.stack|search_for_answer|setup\.program_search|search/.test(signalText);
    case "build_bank_counter":
      return /temporary_resource_bank|counter_bank|charge_bank|build_credit_bank|finite_economy_pool/.test(signalText);
    case "cash_out_bank":
      return /temporary_resource_bank|counter_bank|cash_out|payout|take_bank|finite_economy_pool/.test(signalText);
    case "build_rez_reserve":
      return /economy\.gain_credit|rez_reserve|corp_economy|operation_economy/.test(signalText);
    case "protect_remote":
      return /corp_window\.rez|install\.card|remote_protection|corp_rez_ice/.test(signalText);
    case "advance_score_card":
      return /score\.advance_card|advance\.corp_counter_bank/.test(signalText);
    case "score_agenda":
      return /score\.agenda|score\.action_counter_bank/.test(signalText);
    case "rez_outer_ice":
      return /corp_window\.rez|corp_rez_ice/.test(signalText);
    default:
      return false;
  }
}

export function actionTypeMatchesStep(step: PlanStep, actionType: string): boolean {
  switch (step.kind) {
    case "install_breaker":
      return actionType === "install_card";
    case "resolve_missing_mu":
      return actionType === "install_card" || actionType === "trigger_ability";
    case "pivot_to_alternative":
      return false;
    case "draw_for_answer":
      return actionType === "draw_card";
    case "draw_hand_buffer":
      return actionType === "draw_card";
    case "search_for_answer":
      return (
        actionType === "trigger_ability" ||
        actionType === "activated_card_ability" ||
        actionType === "play_event"
      );
    case "setup_search_engine":
      return actionType === "install_card";
    case "gain_credits":
      return actionType === "gain_credit";
    case "install_development_card":
      return (
        actionType === "install_card" ||
        actionType === "play_event" ||
        actionType === "trigger_ability" ||
        actionType === "activated_card_ability"
      );
    case "build_remote":
    case "protect_remote":
    case "install_or_prepare_agenda":
      return actionType === "install_card";
    case "build_rez_reserve":
      return (
        actionType === "gain_credit" ||
        actionType === "trigger_ability" ||
        actionType === "activated_card_ability"
      );
    case "build_bank_counter":
    case "cash_out_bank":
      return actionType === "trigger_ability" || actionType === "activated_card_ability";
    case "run_target":
    case "probe_central":
      return (
        actionType === "start_run" ||
        actionType === "play_event" ||
        actionType === "trigger_ability" ||
        actionType === "activated_card_ability"
      );
    case "rez_outer_ice":
      return actionType === "rez_ice";
    case "advance_score_card":
      return actionType === "advance_card";
    case "score_agenda":
      return actionType === "score_agenda";
    case "apply_punish_pressure":
      return (
        actionType === "play_operation" ||
        actionType === "trigger_ability" ||
        actionType === "activated_card_ability" ||
        actionType === "trash_resource"
      );
  }
}
