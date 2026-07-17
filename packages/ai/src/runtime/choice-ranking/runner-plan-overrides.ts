import type { AiDecisionInput } from "@netgrid/shared";
import {
  type PlanStepMappingResult,
  type TacticalPlan,
} from "../../tactical-plans";
import type { SemanticRuntimeChoice } from "../semantic-runtime-types";
import { semanticRuntimeServerId } from "../semantic-runtime-scope";
import {
  PLAN_MAPPED_CHOICE_MAX_SCORE_GAP,
  semanticRuntimeChoiceHasAnyScoreComponent,
  semanticRuntimeChoiceHasScoreBreakdownComponent,
  semanticRuntimeChoiceHasScoreComponent,
  semanticRuntimeChoiceStrategicFitLevel,
  semanticRuntimeRecentRunnerStartRunsOnServer,
} from "./semantic-choice-ranking-support";

export function tacticalPlanDeferredDevelopmentInstallShouldYield(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
): boolean {
  if (
    (mapping.plan.type !== "runner.develop_hand_card" &&
      mapping.plan.type !== "runner.play_best_hand_card") ||
    mapping.step.kind !== "install_development_card" ||
    mappedChoice.action.type !== "install_card" ||
    mappedChoice.score > 0 ||
    overrideChoice.score <= 0
  ) {
    return false;
  }
  return mappedChoice.scoreBreakdown.some(
    (component) =>
      component.value < 0 &&
      (component.key === "runner_bank_install_commitment" ||
        component.key === "runner_no_run_economy_install_commitment" ||
        (component.key === "runner_persistent_install_fit" &&
          ((component.reason ?? "").includes("duplicate:redundant_duplicate") ||
            (component.reason ?? "").includes("duplicate:useful_backup") ||
            (component.reason ?? "").includes("delta:backup_only")))),
  );
}

export function tacticalPlanUrgentRunNowDevelopmentShouldYield(
  input: AiDecisionInput,
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  if (
    (mapping.plan.type !== "runner.develop_hand_card" &&
      mapping.plan.type !== "runner.play_best_hand_card") ||
    (mappedChoice.action.type !== "gain_credit" &&
      mappedChoice.action.type !== "install_card" &&
      mappedChoice.action.type !== "play_event") ||
    (mappedChoice.action.type === "gain_credit" &&
      !mapping.plan.evidence.includes("hand_development_fit:blocked")) ||
    (mappedChoice.action.type === "gain_credit" &&
      input.playerView.own.clicks <= 1) ||
    mappedChoice.score > 0 ||
    mappedChoice.scoreBreakdown.some(
      (component) =>
        component.key === "semantic_strategic_action_fit" &&
        component.value > 0,
    ) ||
    overrideChoice.action.type !== "start_run" ||
    overrideChoice.score <= 0 ||
    scoreGap <= PLAN_MAPPED_CHOICE_MAX_SCORE_GAP
  ) {
    return false;
  }
  return overrideChoice.scoreBreakdown.some(
    (component) =>
      component.key === "runner_goal_fit_tactical_goal_run_target" &&
      component.value > 0 &&
      (component.reason ?? "").includes("urgency:high") &&
      (component.reason ?? "").includes("recommendation:run_now"),
  );
}

export function tacticalPlanNoNeedSearchShouldYield(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
): boolean {
  return (
    (mapping.plan.type === "runner.develop_hand_card" ||
      mapping.plan.type === "runner.play_best_hand_card") &&
    (mappedChoice.action.type === "play_event" ||
      mappedChoice.action.type === "activated_card_ability") &&
    mappedChoice.score <= 0 &&
    overrideChoice.score > 0 &&
    mappedChoice.scoreBreakdown.some(
      (component) =>
        component.key === "runner_goal_fit_coverage_search_no_need" &&
        component.value < 0,
    )
  );
}

export function tacticalPlanUnconvertibleFundingShouldYieldToBank(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  return (
    mapping.plan.type === "runner.develop_hand_card" &&
    mapping.step.kind === "gain_credits" &&
    mapping.plan.evidence.includes("funding_same_turn_convertible:false") &&
    mappedChoice.action.type === "gain_credit" &&
    scoreGap > 0 &&
    semanticRuntimeChoiceHasScoreBreakdownComponent(
      overrideChoice,
      "runner_bank_investment_commitment",
    )
  );
}

export function tacticalPlanUrgentCoverageSearchInstallShouldYield(
  mapping: PlanStepMappingResult,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  return (
    (mapping.plan.type === "runner.develop_hand_card" ||
      mapping.plan.type === "runner.build_credit_base") &&
    overrideChoice.action.type === "install_card" &&
    scoreGap > 0 &&
    semanticRuntimeChoiceHasScoreBreakdownComponent(
      overrideChoice,
      "runner_install_coverage_search",
    )
  );
}

export function tacticalPlanMarginalDevelopmentInstallShouldYield(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  const bankEconomyOverride = semanticRuntimeChoiceHasAnyScoreComponent(
    overrideChoice,
    ["runner_bank_investment_commitment", "runner_bank_cashout_gate"],
  );
  const basicCapacityOverride =
    overrideChoice.action.type === "draw_card" ||
    overrideChoice.action.type === "gain_credit";
  const immediateHandPlayOverride = overrideChoice.action.type === "play_event";
  const minimumScoreGap = basicCapacityOverride
    ? 200
    : PLAN_MAPPED_CHOICE_MAX_SCORE_GAP;
  if (
    (mapping.plan.type !== "runner.develop_hand_card" &&
      mapping.plan.type !== "runner.play_best_hand_card") ||
    mapping.step.kind !== "install_development_card" ||
    mappedChoice.action.type !== "install_card" ||
    mappedChoice.score > (bankEconomyOverride ? 800 : 700) ||
    (!bankEconomyOverride &&
      !basicCapacityOverride &&
      !immediateHandPlayOverride) ||
    overrideChoice.score <= 0 ||
    scoreGap <= minimumScoreGap
  ) {
    return false;
  }
  return mappedChoice.scoreBreakdown.some(
    (component) =>
      (bankEconomyOverride &&
        component.key === "runner_install_mandatory_random_action_risk" &&
        component.value < 0) ||
      (component.key === "runner_persistent_install_fit" &&
        component.value <= (bankEconomyOverride ? 150 : 100) &&
        (bankEconomyOverride ||
          immediateHandPlayOverride ||
          (component.reason ?? "").includes("delta:cumulative_capacity"))),
  );
}

export function tacticalPlanDamageReactionReserveShouldYield(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  return (
    mapping.plan.type === "runner.opportunistic_central_run" &&
    semanticRuntimeChoiceIsProjectedRun(mappedChoice) &&
    !mappedPlanHasImmediateVisibleRunPayoff(mapping.plan, mappedChoice) &&
    overrideChoice.action.type === "gain_credit" &&
    overrideChoice.score > 0 &&
    scoreGap > 0 &&
    semanticRuntimeChoiceHasScoreComponent(
      overrideChoice,
      "runner_damage_locked_hand_reaction_reserve",
    )
  );
}

export function runnerPlanTypeRequiresPlanDominance(
  type: TacticalPlan["type"],
): boolean {
  return (
    type === "runner.contest_remote" ||
    type === "runner.obtain_breaker_coverage" ||
    type === "runner.opportunistic_central_run" ||
    type === "runner.clear_tags_or_survive" ||
    type === "runner.convert_success_window" ||
    type === "runner.survival_defense" ||
    type === "runner.restore_hand_buffer" ||
    type === "runner.develop_hand_card" ||
    type === "runner.play_best_hand_card" ||
    type === "runner.build_credit_bank" ||
    type === "runner.cash_out_credit_bank"
  );
}

export function runnerPlanOverrideIsHardInterrupt(
  mappedPlan: TacticalPlan,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
): boolean {
  if (
    semanticRuntimeChoiceHasScoreComponent(
      overrideChoice,
      "runner_activated_agenda_score",
    )
  ) {
    return true;
  }
  if (
    semanticRuntimeChoiceHasScoreComponent(
      overrideChoice,
      "runner_terminal_remote_tool",
    )
  ) {
    return true;
  }
  if (
    semanticRuntimeChoiceHasScoreBreakdownComponent(
      overrideChoice,
      "runner_matchpoint_run_lock_release",
    )
  ) {
    return true;
  }
  if (
    semanticRuntimeChoiceHasScoreBreakdownComponent(
      overrideChoice,
      "runner_viable_followup_run_lock_release",
    )
  ) {
    return true;
  }
  if (
    runnerUrgentRemoteContestRunCanInterruptPlan(mappedPlan, overrideChoice)
  ) {
    return true;
  }
  if (
    runnerEconomyCommitmentCanInterruptPlan(mappedPlan.type) &&
    semanticRuntimeChoiceHasAnyScoreComponent(overrideChoice, [
      "runner_bank_cashout_gate",
      "runner_bank_investment_commitment",
      "runner_no_run_economy_setup_hold",
    ])
  ) {
    return true;
  }
  if (semanticRuntimeChoiceHasAllowedLoanInterrupt(overrideChoice)) {
    return true;
  }
  if (
    acuteHandBufferCanInterruptMappedRun(
      mappedPlan,
      mappedChoice,
      overrideChoice,
    )
  ) {
    return true;
  }
  if (overrideChoice.action.type !== "start_run") return false;
  if (mappedPlan.type === "runner.survival_defense") {
    return semanticRuntimeChoiceHasAnyScoreComponent(overrideChoice, [
      "runner_hq_known_agenda",
    ]);
  }
  return semanticRuntimeChoiceHasAnyScoreComponent(overrideChoice, [
    "runner_hq_known_agenda",
    "runner_rnd_fresh_memory",
    "runner_goal_fit_tactical_goal_run_target",
  ]);
}

export function runnerUrgentRemoteContestRunCanInterruptPlan(
  plan: TacticalPlan,
  choice: SemanticRuntimeChoice,
): boolean {
  if (plan.type !== "runner.contest_remote") {
    return false;
  }
  const planTarget =
    plan.target?.kind === "server" ? plan.target.id : undefined;
  if (
    !planTarget?.startsWith("remote_") ||
    semanticRuntimeServerId(choice.action) !== planTarget
  ) {
    return false;
  }
  const targetMarker = `target:${planTarget}`;
  const urgentGoalFit = choice.scoreBreakdown.some(
    (component) =>
      component.key === "runner_goal_fit_tactical_goal_run_target" &&
      (component.reason ?? "").includes(targetMarker) &&
      (component.reason ?? "").includes("urgency:high") &&
      (component.reason ?? "").includes("recommendation:run_now"),
  );
  return urgentGoalFit;
}

export function tacticalPlanAcuteHandBufferShouldYield(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  return (
    acuteHandBufferCanInterruptMappedRun(
      mapping.plan,
      mappedChoice,
      overrideChoice,
    ) ||
    (scoreGap > 0 &&
      mappedChoice.action.type === "gain_credit" &&
      semanticRuntimeChoiceIsAcuteHandBufferDraw(overrideChoice))
  );
}

function acuteHandBufferCanInterruptMappedRun(
  plan: TacticalPlan,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
): boolean {
  return (
    semanticRuntimeChoiceIsAcuteHandBufferDraw(overrideChoice) &&
    semanticRuntimeChoiceIsProjectedRun(mappedChoice) &&
    !mappedPlanHasImmediateVisibleRunPayoff(plan, mappedChoice)
  );
}

export function mappedPlanHasImmediateVisibleRunPayoff(
  plan: TacticalPlan,
  mappedChoice: SemanticRuntimeChoice,
): boolean {
  return (
    plan.evidence.includes("runner_run_target_payoff:agenda") ||
    plan.evidence.includes("runner_run_target_payoff:score_threat") ||
    semanticRuntimeChoiceHasAnyScoreComponent(mappedChoice, [
      "runner_hq_known_agenda",
    ]) ||
    semanticRuntimeChoiceHasScoreBreakdownComponent(
      mappedChoice,
      "runner_hq_success_window_setup",
    )
  );
}

export function semanticRuntimeChoiceIsAcuteHandBufferDraw(
  choice: SemanticRuntimeChoice,
): boolean {
  if (choice.action.type !== "draw_card") return false;
  const component = choice.scoreBreakdown.find(
    (entry) => entry.key === "runner_hand_buffer_need",
  );
  if (!component) return false;
  const handMatch = /(?:^|\|)hand:(\d+)(?:\||$)/.exec(component.reason ?? "");
  return handMatch !== null && Number(handMatch[1] ?? Number.NaN) <= 2;
}

export function semanticRuntimeChoiceIsDamagePressureHandBufferDraw(
  choice: SemanticRuntimeChoice,
): boolean {
  if (choice.action.type !== "draw_card") return false;
  return choice.scoreBreakdown.some(
    (component) =>
      component.key === "runner_hand_buffer_need" &&
      component.value > 0 &&
      (component.reason ?? "").includes("damage_pressure:true"),
  );
}

export function semanticRuntimeChoiceHasPositiveDevelopmentCommitment(
  choice: SemanticRuntimeChoice | undefined,
): boolean {
  if (!choice) return false;
  return choice.scoreBreakdown.some(
    (component) =>
      component.value > 0 &&
      [
        "runner_bank_investment_commitment",
        "runner_no_run_economy_setup_hold",
      ].includes(component.key),
  );
}

function semanticRuntimeChoiceHasAllowedLoanInterrupt(
  choice: SemanticRuntimeChoice,
): boolean {
  return choice.scoreBreakdown.some(
    (component) =>
      component.key === "runner_loan_liability_assessment" &&
      typeof component.reason === "string" &&
      component.reason.includes("why_loan_allowed_despite_risk:"),
  );
}

function runnerEconomyCommitmentCanInterruptPlan(
  type: TacticalPlan["type"],
): boolean {
  return (
    type === "runner.opportunistic_central_run" ||
    type === "runner.build_credit_base"
  );
}

export function tacticalPlanHandBufferMappingBlocksProbeRunOverride(
  mapping: PlanStepMappingResult,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  return (
    (mapping.plan.type === "runner.restore_hand_buffer" ||
      mapping.plan.type === "runner.survival_defense") &&
    overrideChoice.action.type === "start_run" &&
    semanticRuntimeChoiceStrategicFitLevel(overrideChoice) === "none" &&
    scoreGap <= 1800
  );
}

export function tacticalPlanRepeatedRunMappingShouldYield(
  input: AiDecisionInput,
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  if (scoreGap <= 0) return false;
  if (mappedChoice.action.type !== "start_run") return false;
  const serverId = semanticRuntimeServerId(mappedChoice.action);
  if (!serverId) return false;
  if (semanticRuntimeRecentRunnerStartRunsOnServer(input, serverId) <= 0) {
    return false;
  }
  if (
    semanticRuntimeChoiceHasScoreBreakdownComponent(
      mappedChoice,
      "runner_hq_success_window_setup",
    )
  ) {
    return false;
  }
  if (overrideChoice.action.type !== "start_run") return true;
  if (
    mapping.plan.type !== "runner.opportunistic_central_run" ||
    mappedChoice.score >= 0 ||
    overrideChoice.score <= 0 ||
    mapping.plan.evidence.includes("runner_run_target_payoff:score_threat") ||
    semanticRuntimeChoiceHasAnyScoreComponent(mappedChoice, [
      "runner_hq_known_agenda",
      "runner_rnd_fresh_memory",
    ])
  ) {
    return false;
  }
  const overrideServerId = semanticRuntimeServerId(overrideChoice.action);
  return Boolean(overrideServerId && overrideServerId !== serverId);
}

export function tacticalPlanNonPositiveProjectedRunShouldYield(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
): boolean {
  if (
    mapping.plan.side !== "runner" ||
    !semanticRuntimeChoiceIsProjectedRun(mappedChoice) ||
    mappedChoice.score > 0 ||
    overrideChoice.score <= 0
  ) {
    return false;
  }
  if (mapping.plan.evidence.includes("runner_run_target_payoff:score_threat")) {
    return false;
  }
  return !semanticRuntimeChoiceHasAnyScoreComponent(mappedChoice, [
    "runner_hq_known_agenda",
    "runner_rnd_fresh_memory",
    "runner_goal_fit_tactical_goal_run_target",
  ]);
}

export function semanticRuntimeChoiceIsProjectedRun(
  choice: SemanticRuntimeChoice,
): boolean {
  const runScoreKeys = new Set([
    "runner_run_target_semantic_guidance",
    "runner_known_ice_path_no_access",
    "runner_visible_ice_path_cost",
  ]);
  return (
    choice.action.type === "start_run" ||
    choice.scoreBreakdown.some((component) =>
      runScoreKeys.has(component.key),
    ) ||
    semanticRuntimeChoiceHasAnyScoreComponent(choice, [
      "runner_run_target_semantic_guidance",
      "runner_known_ice_path_no_access",
      "runner_visible_ice_path_cost",
    ])
  );
}

export function tacticalPlanLowValueRecoveryMappingShouldYield(
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  if (scoreGap <= 0 || overrideChoice.score <= 0) return false;
  if (
    overrideChoice.action.type === "gain_credit" ||
    overrideChoice.action.type === "draw_card"
  )
    return false;
  return semanticRuntimeChoiceHasAnyScoreComponent(mappedChoice, [
    "runner_low_value_recovery_repeat",
    "runner_late_no_funding_credit_repeat",
    "runner_basic_setup_over_ready_pressure",
  ]);
}

export function tacticalPlanRemoteContestMappingBlocksRunOverride(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  if (mapping.plan.type !== "runner.contest_remote") return false;
  if (overrideChoice.action.type !== "start_run") return false;
  if (mappedChoice.score < -2200) return false;
  const planTarget =
    mapping.plan.target?.kind === "server" ? mapping.plan.target.id : undefined;
  if (!planTarget?.startsWith("remote_")) return false;
  const overrideTarget = semanticRuntimeServerId(overrideChoice.action);
  if (!overrideTarget || overrideTarget === planTarget) return false;
  if (
    !mapping.plan.evidence.includes("runner_run_target_payoff:score_threat")
  ) {
    return false;
  }
  return scoreGap <= 3000;
}

export function tacticalPlanNonPositiveMappingStillProtected(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
): boolean {
  if (mappedChoice.score < -500) return false;
  if (semanticRuntimeChoiceIsProjectedRun(mappedChoice)) return false;
  if (
    (mapping.plan.type !== "runner.develop_hand_card" &&
      mapping.plan.type !== "runner.play_best_hand_card") ||
    mapping.step.kind !== "install_development_card" ||
    mapping.plan.priority < 900 ||
    overrideChoice.action.type !== "gain_credit"
  ) {
    return false;
  }
  const route = mapping.plan.evidence.find((entry) =>
    entry.startsWith("economy_route:"),
  );
  return Boolean(
    route &&
    route !== "economy_route:unknown" &&
    route !== "economy_route:basic_credit_fallback",
  );
}
