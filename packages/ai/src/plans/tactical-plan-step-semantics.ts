import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { PlanStep } from "./tactical-plan-types";

export function candidateSemanticsMatchStep(
  step: PlanStep,
  candidate: ActionSemanticCandidate,
): boolean {
  const tokens = candidateSemanticTokens(candidate);
  switch (step.kind) {
    case "install_breaker":
      return (
        hasToken(tokens, "install.card") &&
        hasAnyToken(tokens, ["breaker", "icebreaker", "program"])
      );
    case "search_for_answer":
      return hasAnyToken(tokens, [
        "program_search",
        "breaker_search",
        "search.stack",
        "search_for_answer",
        "setup.program_search",
      ]);
    case "find_survival_answer":
      return hasAnyToken(tokens, [
        "damage.prevent",
        "damage_prevention",
        "flatline_prevention",
        "net_damage_prevention",
        "survival",
        "survival.flatline_prevention",
        "draw.card",
        "economy.gain_credit",
        "search.stack",
      ]);
    case "setup_search_engine":
      return (
        hasToken(tokens, "install.card") &&
        hasAnyToken(tokens, [
          "program_search",
          "breaker_search",
          "search.stack",
          "search_for_answer",
          "setup.program_search",
          "search",
        ])
      );
    case "build_bank_counter":
      return hasAnyToken(tokens, [
        "temporary_resource_bank",
        "counter_bank",
        "charge_bank",
        "build_credit_bank",
        "finite_economy_pool",
      ]);
    case "cash_out_bank":
      return hasAnyToken(tokens, [
        "temporary_resource_bank",
        "counter_bank",
        "cash_out",
        "payout",
        "take_bank",
        "finite_economy_pool",
      ]);
    case "build_rez_reserve":
      return hasAnyToken(tokens, [
        "economy.gain_credit",
        "rez_reserve",
        "corp_economy",
        "operation_economy",
      ]);
    case "clear_tags":
      return hasToken(tokens, "tag.remove");
    case "convert_success_window":
      return hasAnyToken(tokens, [
        "successful_run",
        "successful_run_before_access",
        "successful_run_before_access_effect",
        "requires_successful_run",
        "run.success_followup",
        "success_followup",
        "run.extra_run_after_success",
        "extra_run_after_success",
        "run.followup_run",
        "access.payoff",
        "ice.trash_rezzed",
        "fort.all_rezzed_ice_trash",
        "free_trash",
      ]);
    case "protect_remote":
      return hasAnyToken(tokens, [
        "corp_window.rez",
        "install.card",
        "remote_protection",
        "corp_rez_ice",
      ]);
    case "install_or_prepare_agenda":
      return (
        hasToken(tokens, "install.card") &&
        hasAnyToken(tokens, [
          "scoreline",
          "score_line",
          "corp_score_agenda",
          "agenda",
        ])
      );
    case "advance_score_card":
      return hasAnyToken(tokens, [
        "score.advance_card",
        "advance.corp_counter_bank",
      ]);
    case "score_agenda":
      return hasAnyToken(tokens, ["score.agenda", "score.action_counter_bank"]);
    case "rez_outer_ice":
      return hasAnyToken(tokens, ["corp_window.rez", "corp_rez_ice"]);
    default:
      return false;
  }
}

function candidateSemanticTokens(
  candidate: ActionSemanticCandidate,
): ReadonlySet<string> {
  const tokens = new Set<string>();
  addToken(tokens, candidate.semanticActionType);
  addToken(tokens, candidate.sourceCardId);
  addToken(tokens, candidate.abilityId);
  for (const signal of candidate.cardContextSignals) addToken(tokens, signal);
  for (const signal of candidate.actionTacticSignals) addToken(tokens, signal);
  for (const support of candidate.strategySupport) {
    addToken(tokens, support.strategyId);
    addToken(tokens, support.role);
    addToken(tokens, `${support.strategyId}:${support.role}`);
  }
  for (const condition of candidate.conditions)
    addToken(tokens, condition.kind);
  for (const risk of candidate.risks) addToken(tokens, risk.kind);
  for (const constraint of candidate.constraints) {
    addToken(tokens, constraint.kind);
  }
  for (const cost of candidate.costProfile.additionalCosts) {
    addToken(tokens, cost);
  }
  for (const evidence of candidate.targetContext?.targetProfileMatches.flatMap(
    (entry) => entry.evidence,
  ) ?? []) {
    addToken(tokens, evidence);
  }
  for (const evidence of candidate.evidence) addToken(tokens, evidence);
  return tokens;
}

function hasToken(tokens: ReadonlySet<string>, token: string): boolean {
  return tokens.has(token.toLocaleLowerCase("en-US"));
}

function hasAnyToken(
  tokens: ReadonlySet<string>,
  options: readonly string[],
): boolean {
  return options.some((option) => hasToken(tokens, option));
}

function addToken(tokens: Set<string>, value: string | undefined): void {
  if (!value) return;
  const normalized = value.toLocaleLowerCase("en-US");
  if (!normalized) return;
  tokens.add(normalized);
  for (const dotPart of normalized.split(".")) {
    addTokenPart(tokens, dotPart);
    for (const colonPart of dotPart.split(":")) {
      addTokenPart(tokens, colonPart);
      for (const underscorePart of colonPart.split("_")) {
        addTokenPart(tokens, underscorePart);
        for (const dashPart of underscorePart.split("-")) {
          addTokenPart(tokens, dashPart);
        }
      }
    }
  }
}

function addTokenPart(tokens: Set<string>, value: string): void {
  if (value.length > 0) tokens.add(value);
}

export function actionTypeMatchesStep(
  step: PlanStep,
  actionType: string,
): boolean {
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
    case "find_survival_answer":
      return (
        actionType === "draw_card" ||
        actionType === "gain_credit" ||
        actionType === "install_card" ||
        actionType === "play_event" ||
        actionType === "trigger_ability" ||
        actionType === "activated_card_ability"
      );
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
    case "clear_tags":
      return actionType === "remove_tag";
    case "convert_success_window":
      return false;
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
      return (
        actionType === "trigger_ability" ||
        actionType === "activated_card_ability"
      );
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
