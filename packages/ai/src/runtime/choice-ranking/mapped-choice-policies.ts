import type { PlanStepMappingResult } from "../../tactical-plans";
import type { SemanticRuntimeChoice } from "../semantic-runtime-types";
import { semanticRuntimeServerId } from "../semantic-runtime-scope";
import { semanticRuntimeChoiceHasScoreComponent } from "./semantic-choice-ranking-support";
import {
  mappedPlanHasImmediateVisibleRunPayoff,
  runnerPlanOverrideIsHardInterrupt,
  runnerPlanTypeRequiresPlanDominance,
  semanticRuntimeChoiceIsDamagePressureHandBufferDraw,
  tacticalPlanDeferredDevelopmentInstallShouldYield,
} from "./runner-plan-overrides";

const BACKGROUND_BANK_BUILD_MAX_SCORE_GAP = 300;
const BACKGROUND_BANK_HAND_BUFFER_MAX_SCORE_DEFICIT = 300;

export function tacticalPlanFundedDevelopmentContinuationBlocksOverride(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
): boolean {
  return (
    mapping.plan.type === "runner.develop_hand_card" &&
    (mapping.plan.evidence.includes(
      "funded_hand_development_continuation:true",
    ) ||
      mapping.plan.evidence.includes(`previous_plan:${mapping.plan.planId}`)) &&
    (mappedChoice.action.type === "install_card" ||
      mappedChoice.action.type === "play_event") &&
    !tacticalPlanDeferredDevelopmentInstallShouldYield(
      mapping,
      mappedChoice,
      overrideChoice,
    ) &&
    !semanticRuntimeChoiceHasScoreComponent(
      overrideChoice,
      "runner_activated_agenda_score",
    )
  );
}

export function bestPlanCompatibleSemanticChoice(
  choices: readonly SemanticRuntimeChoice[],
  mapping: PlanStepMappingResult,
): SemanticRuntimeChoice | undefined {
  const viable = choices.filter((choice) => !choice.exclusion);
  if (viable.length === 0) return undefined;
  const priorityByActionId = tacticalPlanStepPriorityByActionId(mapping);
  const hasStepPriority = viable.some(
    (choice) => (priorityByActionId.get(choice.action.actionId) ?? 0) > 0,
  );
  if (hasStepPriority) {
    return [...viable].sort(
      (left, right) =>
        (priorityByActionId.get(right.action.actionId) ?? 0) -
          (priorityByActionId.get(left.action.actionId) ?? 0) ||
        positiveScoreRank(right.score) - positiveScoreRank(left.score) ||
        right.score - left.score ||
        left.action.actionId.localeCompare(right.action.actionId),
    )[0];
  }
  return [...viable].sort(
    (left, right) =>
      positiveScoreRank(right.score) - positiveScoreRank(left.score) ||
      right.score - left.score ||
      left.action.actionId.localeCompare(right.action.actionId),
  )[0];
}

export function tacticalPlanStepPriorityKeepsMappedChoice(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
): boolean {
  if (
    mapping.plan.side === "corp" &&
    mappedChoice.score < 0 &&
    overrideChoice.score > 0 &&
    mappedChoice.scoreBreakdown.some(
      (component) =>
        component.key === "corp_remote_sprawl_penalty" &&
        component.value < 0,
    )
  ) {
    return false;
  }
  if (
    !mapping.legalActions.some(
      (action) => action.actionId === overrideChoice.action.actionId,
    )
  ) {
    return false;
  }
  const priorityByActionId = tacticalPlanStepPriorityByActionId(mapping);
  const mappedPriority =
    priorityByActionId.get(mappedChoice.action.actionId) ?? 0;
  const overridePriority =
    priorityByActionId.get(overrideChoice.action.actionId) ?? 0;
  return mappedPriority > 0 && mappedPriority > overridePriority;
}

function tacticalPlanStepPriorityByActionId(
  mapping: PlanStepMappingResult,
): ReadonlyMap<string, number> {
  return new Map(
    (mapping.actionPriorities ?? []).map((entry) => [
      entry.actionId,
      entry.priority,
    ]),
  );
}

export function tacticalPlanMappingSelectedEvidence(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
): string[] {
  const priority =
    tacticalPlanStepPriorityByActionId(mapping).get(
      mappedChoice.action.actionId,
    ) ?? 0;
  return [
    "tactical_plan_mapping_outcome:plan_mapping_selected",
    ...(priority > 0
      ? [
          "tactical_plan_step_priority_selected:true",
          `tactical_plan_step_priority:${priority}`,
        ]
      : []),
  ];
}

function positiveScoreRank(score: number): number {
  return score > 0 ? 1 : 0;
}

export function tacticalPlanRunnerMappingBlocksOffPlanOverride(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  mappedActionIds: ReadonlySet<string>,
  exceptions: {
    repeatedRunShouldYield: boolean;
    nonPositiveProjectedRunShouldYield: boolean;
    acuteHandBufferShouldYield: boolean;
    damageReactionReserveShouldYield: boolean;
    lowValueRecoveryShouldYield: boolean;
    inferiorRunTargetShouldYield: boolean;
    corpBoardTriageMismatchShouldYield: boolean;
    deferredDevelopmentInstallShouldYield: boolean;
    backgroundBankBuildShouldYield: boolean;
    noNeedSearchShouldYield: boolean;
    coverageProbeRunShouldYield: boolean;
    lowValueRunEventShouldYield: boolean;
    urgentRunNowDevelopmentShouldYield: boolean;
    unconvertibleFundingShouldYieldToBank: boolean;
    urgentCoverageSearchInstallShouldYield: boolean;
  },
): boolean {
  if (mapping.plan.side !== "runner") return false;
  if (!runnerPlanTypeRequiresPlanDominance(mapping.plan.type)) return false;
  if (mappedActionIds.has(overrideChoice.action.actionId)) return false;
  if (exceptions.repeatedRunShouldYield) return false;
  if (exceptions.nonPositiveProjectedRunShouldYield) return false;
  if (exceptions.acuteHandBufferShouldYield) return false;
  if (exceptions.damageReactionReserveShouldYield) return false;
  if (exceptions.lowValueRecoveryShouldYield) return false;
  if (exceptions.inferiorRunTargetShouldYield) return false;
  if (exceptions.corpBoardTriageMismatchShouldYield) return false;
  if (exceptions.deferredDevelopmentInstallShouldYield) return false;
  if (exceptions.backgroundBankBuildShouldYield) return false;
  if (exceptions.noNeedSearchShouldYield) return false;
  if (exceptions.coverageProbeRunShouldYield) return false;
  if (exceptions.lowValueRunEventShouldYield) return false;
  if (exceptions.urgentRunNowDevelopmentShouldYield) return false;
  if (exceptions.unconvertibleFundingShouldYieldToBank) return false;
  if (exceptions.urgentCoverageSearchInstallShouldYield) return false;
  return !runnerPlanOverrideIsHardInterrupt(
    mapping.plan,
    mappedChoice,
    overrideChoice,
  );
}

export function tacticalPlanLowValueRunEventMappingShouldYield(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  return (
    (mapping.plan.type === "runner.develop_hand_card" ||
      mapping.plan.type === "runner.play_best_hand_card") &&
    mappedChoice.action.type === "play_event" &&
    overrideChoice.score > 0 &&
    scoreGap > 0 &&
    mappedChoice.scoreBreakdown.some(
      (component) =>
        component.key === "runner_run_target_semantic_guidance" &&
        component.value < 0,
    )
  );
}

export function tacticalPlanBackgroundBankBuildShouldYield(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  return (
    mapping.plan.type === "runner.build_credit_bank" &&
    mapping.step.kind === "build_bank_counter" &&
    mapping.plan.evidence.includes("runner_bank_concrete_funding_need:false") &&
    overrideChoice.score > 0 &&
    (scoreGap > BACKGROUND_BANK_BUILD_MAX_SCORE_GAP ||
      (semanticRuntimeChoiceIsDamagePressureHandBufferDraw(overrideChoice) &&
        scoreGap > -BACKGROUND_BANK_HAND_BUFFER_MAX_SCORE_DEFICIT &&
        semanticRuntimeChoiceHasScoreComponent(
          mappedChoice,
          "runner_bank_investment_commitment",
        )))
  );
}

export function tacticalPlanInferiorRunTargetMappingShouldYield(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
  threshold: number,
): boolean {
  if (
    mapping.plan.type !== "runner.opportunistic_central_run" ||
    mappedChoice.action.type !== "start_run" ||
    scoreGap <= 0
  ) {
    return false;
  }
  if (overrideChoice.action.type !== "start_run") {
    const expensiveLowReservePath = mappedChoice.scoreBreakdown.some(
      (component) =>
        component.key === "runner_visible_ice_path_cost" &&
        component.value <= -1500 &&
        /(?:^|;)credits_after:(?:0|1)(?:;|$)/.test(component.reason ?? ""),
    );
    if (!expensiveLowReservePath || overrideChoice.score <= 0) return false;
    return !mappedChoice.scoreBreakdown.some(
      (component) =>
        component.key === "runner_hq_known_agenda" ||
        component.key === "runner_rnd_fresh_memory",
    );
  }
  if (scoreGap <= threshold) return false;
  const mappedServerId = semanticRuntimeServerId(mappedChoice.action);
  const overrideServerId = semanticRuntimeServerId(overrideChoice.action);
  if (
    !mappedServerId ||
    !overrideServerId ||
    mappedServerId === overrideServerId
  ) {
    return false;
  }
  if (
    !mappedChoice.scoreBreakdown.some(
      (component) =>
        component.key === "runner_visible_ice_path_cost" && component.value < 0,
    )
  ) {
    return false;
  }
  if (mappedPlanHasImmediateVisibleRunPayoff(mapping.plan, mappedChoice)) {
    return false;
  }
  return !(
    semanticRuntimeChoiceHasScoreComponent(
      mappedChoice,
      "runner_rnd_fresh_memory",
    ) ||
    mappedChoice.scoreBreakdown.some(
      (component) => component.key === "runner_rnd_fresh_memory",
    )
  );
}
