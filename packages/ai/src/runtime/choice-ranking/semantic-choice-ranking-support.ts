import type { AiDecisionInput, PublicGameEvent } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate";
import { isBasicCreditAction } from "../../actions/action-effect-classification";
import {
  mapPlanStepToLegalActions,
  type PlanStepMappingResult,
  type TacticalPlan,
  type TacticalPlanRuntimeResult,
} from "../../tactical-plans";
import type {
  SemanticRuntimeChoice,
  TacticalPlanMappedChoiceResult,
} from "../semantic-runtime-types";
import { semanticRuntimeServerId } from "../semantic-runtime-scope";

export const PLAN_MAPPED_CHOICE_MAX_SCORE_GAP = 600;
const STRATEGIC_EXACT_OVERRIDE_SCORE_GAP = 320;
const STRATEGIC_KIND_OVERRIDE_SCORE_GAP = 480;
const STRATEGIC_EXACT_MAPPING_PROTECTION_SCORE_GAP = 900;
const STRATEGIC_KIND_MAPPING_PROTECTION_SCORE_GAP = 720;
const RUNNER_LOW_VALUE_RUN_OVERRIDE_SCORE_GAP = 400;

export function tacticalPlanOverrideReason(input: {
  urgentRunNowDevelopmentShouldYield: boolean;
  unconvertibleFundingShouldYieldToBank: boolean;
  urgentCoverageSearchInstallShouldYield: boolean;
  noNeedSearchShouldYield: boolean;
  coverageProbeRunShouldYield: boolean;
  lowValueRunEventShouldYield: boolean;
  unconvertedRestrictedActionCapacityShouldYield: boolean;
  mappedNonPositiveAgainstPositive: boolean;
  deferredDevelopmentInstallShouldYield: boolean;
  repeatedRunShouldYield: boolean;
  acuteHandBufferShouldYield: boolean;
  damageReactionReserveShouldYield: boolean;
  lowValueRecoveryShouldYield: boolean;
  inferiorRunTargetShouldYield: boolean;
  corpBoardTriageMismatchShouldYield: boolean;
  softFundingShouldYieldToFiniteEconomy: boolean;
  backgroundBankBuildShouldYield: boolean;
  committedBankBuildShouldYield: boolean;
  hardInterruptShouldYield: boolean;
  thresholdReason: string;
}): string {
  const candidates = [
    [
      input.urgentRunNowDevelopmentShouldYield,
      "urgent_run_now_development_yield",
    ],
    [
      input.unconvertibleFundingShouldYieldToBank,
      "unconvertible_funding_bank_yield",
    ],
    [
      input.urgentCoverageSearchInstallShouldYield,
      "urgent_coverage_search_install_yield",
    ],
    [input.noNeedSearchShouldYield, "no_need_search_mapping_yield"],
    [input.coverageProbeRunShouldYield, "coverage_probe_run_mapping_yield"],
    [input.lowValueRunEventShouldYield, "low_value_run_event_mapping_yield"],
    [
      input.unconvertedRestrictedActionCapacityShouldYield,
      "unconverted_restricted_action_capacity_yield",
    ],
    [
      input.mappedNonPositiveAgainstPositive,
      "mapped_nonpositive_against_positive",
    ],
    [
      input.deferredDevelopmentInstallShouldYield,
      "deferred_development_mapping_yield",
    ],
    [input.repeatedRunShouldYield, "repeated_run_mapping_yield"],
    [input.acuteHandBufferShouldYield, "acute_hand_buffer_mapping_yield"],
    [
      input.damageReactionReserveShouldYield,
      "damage_reaction_reserve_mapping_yield",
    ],
    [input.lowValueRecoveryShouldYield, "low_value_recovery_mapping_yield"],
    [input.inferiorRunTargetShouldYield, "inferior_run_target_mapping_yield"],
    [
      input.corpBoardTriageMismatchShouldYield,
      "corp_board_triage_mismatch_yield",
    ],
    [
      input.softFundingShouldYieldToFiniteEconomy,
      "soft_funding_finite_economy_yield",
    ],
    [
      input.backgroundBankBuildShouldYield,
      "background_bank_build_mapping_yield",
    ],
    [input.committedBankBuildShouldYield, "committed_bank_build_mapping_yield"],
    [input.hardInterruptShouldYield, "runner_hard_interrupt"],
  ] as const;
  return candidates.find(([matches]) => matches)?.[1] ?? input.thresholdReason;
}

export function tacticalPlanMappingOverrideEvidence(
  result: TacticalPlanMappedChoiceResult,
): string[] {
  const mappedChoice = result.overriddenMappedChoice;
  if (!mappedChoice) return [];
  return [
    "tactical_plan_mapping_outcome:semantic_choice_selected",
    "tactical_plan_semantic_choice_selected:true",
    `tactical_plan_semantic_choice_reason:${result.overrideReason ?? "semantic_score_gap"}`,
    `tactical_plan_mapping_score_gap:${result.scoreGap ?? 0}`,
    ...(result.overrideThreshold !== undefined
      ? [
          `tactical_plan_mapping_score_gap_threshold:${result.overrideThreshold}`,
        ]
      : []),
  ];
}

export function tacticalPlanRuntimeAlignedToChoice(
  result: TacticalPlanRuntimeResult,
  choice: SemanticRuntimeChoice | undefined,
  candidates: readonly ActionSemanticCandidate[],
  input: AiDecisionInput,
): TacticalPlanRuntimeResult {
  if (!choice) return tacticalPlanRuntimeWithoutSelectedMapping(result);
  const mapping = tacticalPlanMappingForChoice(
    result,
    choice,
    candidates,
    input,
  );
  if (!mapping) return tacticalPlanRuntimeWithoutSelectedMapping(result);
  return {
    ...result,
    selectedPlan: mapping.plan,
    selectedStep: mapping.step,
    selectedMapping: mapping,
  };
}

export function tacticalPlanBlocksSemanticChoice(
  planRuntime: TacticalPlanRuntimeResult,
  choice: SemanticRuntimeChoice,
): boolean {
  if (choice.action.type !== "start_run") return false;
  const serverId = semanticRuntimeServerId(choice.action);
  if (!serverId) return false;
  return planRuntime.planAlternatives.some(
    (plan) =>
      (plan.status === "abandoned" ||
        plan.status === "blocked" ||
        plan.status === "failed" ||
        plan.status === "expired") &&
      plan.target?.kind === "server" &&
      plan.target.id === serverId,
  );
}

export function tacticalPlanCoverageMappingBlocksRunOverride(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  mappedActionIds: ReadonlySet<string>,
  scoreGap: number,
  threshold: number,
): boolean {
  if (coveragePlanRunOverrideHasUrgentPayoff(mapping, overrideChoice)) {
    return false;
  }
  if (
    mapping.plan.type === "runner.obtain_breaker_coverage" &&
    overrideChoice.action.type === "start_run" &&
    !mappedActionIds.has(overrideChoice.action.actionId) &&
    !semanticRuntimeChoiceIsImmediateEconomy(mappedChoice) &&
    mappedChoice.action.type !== "draw_card"
  ) {
    return mappedChoice.score > 0;
  }
  return (
    mapping.plan.type === "runner.obtain_breaker_coverage" &&
    overrideChoice.action.type === "start_run" &&
    !mappedActionIds.has(overrideChoice.action.actionId) &&
    scoreGap <= threshold
  );
}

export function tacticalPlanCoverageProbeRunShouldYield(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  if (
    mapping.plan.type !== "runner.obtain_breaker_coverage" ||
    overrideChoice.action.type !== "start_run" ||
    mappedChoice.action.type !== "install_card" ||
    overrideChoice.score <= 0 ||
    scoreGap < 200 ||
    !semanticRuntimeChoiceHasScoreComponent(
      overrideChoice,
      "runner_free_server_path",
    )
  ) {
    return false;
  }
  return overrideChoice.scoreBreakdown.some(
    (component) =>
      component.key === "runner_run_target_semantic_guidance" &&
      (component.reason ?? "").includes("recommendation:run_if_free") &&
      (component.reason ?? "").includes("payoff:unknown") &&
      (component.reason ?? "").includes("path:reachable") &&
      (component.reason ?? "").includes(
        "unavoidable_visible_ice_hazard_count:0",
      ),
  );
}

function coveragePlanRunOverrideHasUrgentPayoff(
  mapping: PlanStepMappingResult,
  overrideChoice: SemanticRuntimeChoice,
): boolean {
  return (
    mapping.plan.type === "runner.obtain_breaker_coverage" &&
    overrideChoice.action.type === "start_run" &&
    semanticRuntimeChoiceHasAnyScoreComponent(overrideChoice, [
      "runner_hq_known_agenda",
      "runner_rnd_fresh_memory",
      "runner_goal_fit_tactical_goal_run_target",
    ])
  );
}

export function tacticalPlanCoverageMappingBlocksEconomyOverride(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
  threshold: number,
): boolean {
  return (
    mapping.plan.type === "runner.obtain_breaker_coverage" &&
    mappedChoice.action.type === "draw_card" &&
    semanticRuntimeChoiceIsImmediateEconomy(overrideChoice) &&
    scoreGap <= Math.max(threshold, 900)
  );
}

export function tacticalPlanOverrideScoreGapThreshold(
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
): { scoreGap: number; reason: string } {
  if (
    mappedChoice.action.type === "start_run" &&
    mappedChoice.score <= -500 &&
    overrideChoice.score >=
      mappedChoice.score + RUNNER_LOW_VALUE_RUN_OVERRIDE_SCORE_GAP
  ) {
    return {
      scoreGap: RUNNER_LOW_VALUE_RUN_OVERRIDE_SCORE_GAP,
      reason: "runner_low_value_run_score_gap",
    };
  }
  const mappedStrategic = semanticRuntimeChoiceStrategicFitLevel(mappedChoice);
  const overrideStrategic =
    semanticRuntimeChoiceStrategicFitLevel(overrideChoice);
  if (overrideStrategic !== "none" && mappedStrategic === "none") {
    return {
      scoreGap:
        overrideStrategic === "exact"
          ? STRATEGIC_EXACT_OVERRIDE_SCORE_GAP
          : STRATEGIC_KIND_OVERRIDE_SCORE_GAP,
      reason:
        overrideStrategic === "exact"
          ? "strategic_exact_score_gap"
          : "strategic_kind_score_gap",
    };
  }
  if (mappedStrategic !== "none" && overrideStrategic === "none") {
    return {
      scoreGap:
        mappedStrategic === "exact"
          ? STRATEGIC_EXACT_MAPPING_PROTECTION_SCORE_GAP
          : STRATEGIC_KIND_MAPPING_PROTECTION_SCORE_GAP,
      reason:
        mappedStrategic === "exact"
          ? "strategic_exact_mapping_protected"
          : "strategic_kind_mapping_protected",
    };
  }
  return {
    scoreGap: PLAN_MAPPED_CHOICE_MAX_SCORE_GAP,
    reason: "semantic_score_gap",
  };
}

export function semanticRuntimeChoiceStrategicFitLevel(
  choice: SemanticRuntimeChoice,
): "exact" | "kind" | "generic" | "none" {
  if (
    !choice.evidence.some((entry) =>
      entry.startsWith("semantic_strategic_action_fit:true"),
    )
  ) {
    return "none";
  }
  const targetMatch = choice.evidence.find((entry) =>
    entry.startsWith("strategic_action_fit_target_match:"),
  );
  if (targetMatch === "strategic_action_fit_target_match:exact") return "exact";
  if (targetMatch === "strategic_action_fit_target_match:kind") return "kind";
  return "generic";
}

export function tacticalPlanBlockedOverrideResult(params: {
  mappedChoice: SemanticRuntimeChoice;
  overrideChoice: SemanticRuntimeChoice;
  reason: string;
  scoreGap: number;
  threshold: number;
}): TacticalPlanMappedChoiceResult {
  return {
    outcome: "semantic_choice_blocked",
    choice: semanticRuntimeChoiceWithAddedEvidence(params.mappedChoice, [
      "tactical_plan_mapping_outcome:semantic_choice_blocked",
      "tactical_plan_mapping_override_blocked:true",
      `tactical_plan_override_blocked_reason:${params.reason}`,
      `tactical_plan_mapping_score_gap:${params.scoreGap}`,
      `tactical_plan_mapping_score_gap_threshold:${params.threshold}`,
    ]),
    overrideBlockedChoice: params.overrideChoice,
    overrideBlockedReason: params.reason,
    overrideThreshold: params.threshold,
    scoreGap: params.scoreGap,
  };
}

export function semanticRuntimeChoiceWithAddedEvidence(
  choice: SemanticRuntimeChoice,
  evidence: readonly string[],
): SemanticRuntimeChoice {
  return {
    ...choice,
    evidence: [...choice.evidence, ...evidence],
  };
}

function tacticalPlanMappingForChoice(
  result: TacticalPlanRuntimeResult,
  choice: SemanticRuntimeChoice,
  candidates: readonly ActionSemanticCandidate[],
  input: AiDecisionInput,
): PlanStepMappingResult | undefined {
  for (const plan of result.planAlternatives) {
    if (!tacticalPlanCanMapToCurrentAction(plan)) continue;
    const mapping = mapPlanStepToLegalActions(
      plan,
      plan.currentStep,
      candidates,
      input,
    );
    if (
      mapping.status === "matched" &&
      mapping.legalActions.some(
        (action) => action.actionId === choice.action.actionId,
      )
    ) {
      return mapping;
    }
  }
  return undefined;
}

function tacticalPlanCanMapToCurrentAction(plan: TacticalPlan): boolean {
  return (
    plan.status !== "abandoned" &&
    plan.status !== "expired" &&
    plan.status !== "failed" &&
    plan.status !== "satisfied"
  );
}

function tacticalPlanRuntimeWithoutSelectedMapping(
  result: TacticalPlanRuntimeResult,
): TacticalPlanRuntimeResult {
  const {
    selectedPlan: _selectedPlan,
    selectedStep: _selectedStep,
    selectedMapping: _selectedMapping,
    ...rest
  } = result;
  return rest;
}

export function semanticRuntimeRecentRunnerStartRunsOnServer(
  input: AiDecisionInput,
  serverId: string,
): number {
  let count = 0;
  const history = mergedAiPublicHistory(input);
  let seenRunnerActions = 0;
  let completedRunnerTurns = 0;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const event = history[index]!;
    const actionType =
      typeof event.publicPayload.actionType === "string"
        ? event.publicPayload.actionType
        : event.type;
    const actor =
      typeof event.publicPayload.actor === "string"
        ? event.publicPayload.actor
        : undefined;
    if (semanticRuntimeRunnerRunProgressEvent(actionType, actor)) break;
    if (actor === "runner" && actionType === "end_turn") {
      completedRunnerTurns += 1;
      if (completedRunnerTurns > 3) break;
    }
    if (actor !== "runner" || actionType !== "start_run") continue;
    seenRunnerActions += 1;
    const target = aiServerIdFromEvent(event);
    if (target === serverId) count += 1;
    if (seenRunnerActions >= 8) break;
  }
  return count;
}

export function tacticalPlanCorpBoardTriageMismatchShouldYield(
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  return (
    scoreGap > 0 &&
    ((semanticRuntimeChoiceHasScoreComponent(
      mappedChoice,
      "corp_board_triage_mismatch",
    ) &&
      !semanticRuntimeChoiceHasScoreComponent(
        overrideChoice,
        "corp_board_triage_mismatch",
      )) ||
      (semanticRuntimeChoiceHasScoreComponent(
        overrideChoice,
        "corp_board_triage_alignment",
      ) &&
        !semanticRuntimeChoiceHasScoreComponent(
          mappedChoice,
          "corp_board_triage_alignment",
        )))
  );
}

export function semanticRuntimeChoiceHasScoreComponent(
  choice: SemanticRuntimeChoice,
  key: string,
): boolean {
  return choice.evidence.includes(`semantic_score_component:${key}`);
}

export function semanticRuntimeChoiceHasScoreBreakdownComponent(
  choice: SemanticRuntimeChoice,
  key: string,
): boolean {
  return choice.scoreBreakdown.some((component) => component.key === key);
}

export function semanticRuntimeChoiceHasAnyScoreComponent(
  choice: SemanticRuntimeChoice,
  keys: readonly string[],
): boolean {
  return keys.some((key) =>
    semanticRuntimeChoiceHasScoreComponent(choice, key),
  );
}

export function semanticRuntimeChoiceIsImmediateEconomy(
  choice: SemanticRuntimeChoice,
): boolean {
  return (
    choice.scoreBreakdown.some(
      (component) =>
        component.key === "economy_credit_base" && component.value > 0,
    ) || isBasicCreditAction(choice.action)
  );
}

function mergedAiPublicHistory(input: AiDecisionInput): PublicGameEvent[] {
  const byId = new Map<string, PublicGameEvent>();
  for (const event of [...input.playerView.publicEvents, ...input.eventTail]) {
    byId.set(event.eventId, event);
  }
  return [...byId.values()].sort(
    (left, right) => aiEventVersion(left) - aiEventVersion(right),
  );
}

function semanticRuntimeRunnerRunProgressEvent(
  actionType: string,
  actor?: string,
): boolean {
  return (
    (actor === "runner" &&
      (actionType === "steal_agenda" ||
        actionType === "trash_accessed_card" ||
        actionType === "install_card")) ||
    actionType === "score_agenda"
  );
}

function aiServerIdFromEvent(event: PublicGameEvent): string | undefined {
  const payload = event.publicPayload;
  if (typeof payload.serverId === "string") return payload.serverId;
  if (typeof payload.server === "string") return payload.server;
  if (typeof payload.targetServerId === "string") return payload.targetServerId;
  if (typeof payload.attackedServerId === "string")
    return payload.attackedServerId;
  return undefined;
}

function aiEventVersion(event: PublicGameEvent): number {
  return typeof event.stateVersionAfter === "number"
    ? event.stateVersionAfter
    : 0;
}

export function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}
