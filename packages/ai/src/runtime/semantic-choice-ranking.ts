import type {
  AiDecisionInput,
  LegalAction,
  PublicGameEvent,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import {
  mapPlanStepToLegalActions,
  type PlanStepMappingResult,
  type TacticalPlan,
  type TacticalPlanRuntimeResult,
} from "../tactical-plans";
import type {
  SemanticRuntimeChoice,
  TacticalPlanMappedChoiceResult,
} from "./semantic-runtime-types";
import { semanticRuntimeServerId } from "./semantic-runtime-scope";

// Tactical plans define the active action lane. Scores rank choices inside that lane;
// off-plan Runner overrides need explicit hard-interrupt evidence.
const PLAN_MAPPED_CHOICE_MAX_SCORE_GAP = 600;
const STRATEGIC_EXACT_OVERRIDE_SCORE_GAP = 320;
const STRATEGIC_KIND_OVERRIDE_SCORE_GAP = 480;
const STRATEGIC_EXACT_MAPPING_PROTECTION_SCORE_GAP = 900;
const STRATEGIC_KIND_MAPPING_PROTECTION_SCORE_GAP = 720;

export function bestSemanticRuntimeChoice(
  choices: readonly SemanticRuntimeChoice[],
): SemanticRuntimeChoice | undefined {
  return (
    choices.find((candidate) => !candidate.exclusion && candidate.score > 0) ??
    choices.find((candidate) => !candidate.exclusion)
  );
}

export function bestSemanticRuntimeChoiceForTacticalPlanOverride(
  choices: readonly SemanticRuntimeChoice[],
  planRuntime: TacticalPlanRuntimeResult,
): SemanticRuntimeChoice | undefined {
  const viableChoices = choices.filter(
    (choice) => !tacticalPlanBlocksSemanticChoice(planRuntime, choice),
  );
  return bestSemanticRuntimeChoice(viableChoices);
}

export function tacticalPlanMappedChoice(
  input: AiDecisionInput,
  choices: readonly SemanticRuntimeChoice[],
  mapping: PlanStepMappingResult | undefined,
  overrideChoice: SemanticRuntimeChoice | undefined,
): TacticalPlanMappedChoiceResult {
  if (!mapping) return {};
  const mappedActionIds = new Set(
    mapping.legalActions.map((action) => action.actionId),
  );
  const mappedChoices = mapping.legalActions
    .map((action) =>
      choices.find(
        (choice) =>
          !choice.exclusion &&
          choice.action.actionId === action.actionId,
      ),
    )
    .filter((choice): choice is SemanticRuntimeChoice => Boolean(choice));
  const mappedChoice = bestPlanCompatibleSemanticChoice(mappedChoices);
  if (!mappedChoice) return {};
  if (
    overrideChoice &&
    overrideChoice.action.actionId !== mappedChoice.action.actionId
  ) {
    const scoreGap = roundScore(overrideChoice.score - mappedChoice.score);
    const threshold = tacticalPlanOverrideScoreGapThreshold(
      mappedChoice,
      overrideChoice,
    );
    if (
      tacticalPlanRemoteContestMappingBlocksRunOverride(
        mapping,
        mappedChoice,
        overrideChoice,
        scoreGap,
      )
    ) {
      return tacticalPlanBlockedOverrideResult({
        mappedChoice,
        overrideChoice,
        reason: "remote_contest_plan_mapping",
        scoreGap,
        threshold: 3000,
      });
    }
    if (
      tacticalPlanCoverageMappingBlocksRunOverride(
        mapping,
        mappedChoice,
        overrideChoice,
        mappedActionIds,
        scoreGap,
        threshold.scoreGap,
      )
    ) {
      return tacticalPlanBlockedOverrideResult({
        mappedChoice,
        overrideChoice,
        reason: "coverage_plan_mapping",
        scoreGap,
        threshold: threshold.scoreGap,
      });
    }
    if (
      tacticalPlanCoverageMappingBlocksEconomyOverride(
        mapping,
        mappedChoice,
        overrideChoice,
        scoreGap,
        threshold.scoreGap,
      )
    ) {
      return tacticalPlanBlockedOverrideResult({
        mappedChoice,
        overrideChoice,
        reason: "coverage_plan_mapping",
        scoreGap,
        threshold: Math.max(threshold.scoreGap, 900),
      });
    }
    if (
      tacticalPlanHandBufferMappingBlocksProbeRunOverride(
        mapping,
        overrideChoice,
        scoreGap,
      )
    ) {
      return tacticalPlanBlockedOverrideResult({
        mappedChoice,
        overrideChoice,
        reason: "hand_buffer_plan_mapping",
        scoreGap,
        threshold: 1800,
      });
    }
    const mappedNonPositiveAgainstPositive =
      mappedChoice.score <= 0 && overrideChoice.score > 0;
    if (
      mappedNonPositiveAgainstPositive &&
      tacticalPlanNonPositiveMappingStillProtected(
        mapping,
        mappedChoice,
        overrideChoice,
      )
    ) {
      return tacticalPlanBlockedOverrideResult({
        mappedChoice,
        overrideChoice,
        reason: "economy_route_plan_mapping",
        scoreGap,
        threshold: Math.max(threshold.scoreGap, 900),
      });
    }
    const repeatedRunShouldYield = tacticalPlanRepeatedRunMappingShouldYield(
      input,
      mappedChoice,
      overrideChoice,
      scoreGap,
    );
    const corpBoardTriageMismatchShouldYield =
      tacticalPlanCorpBoardTriageMismatchShouldYield(
        mappedChoice,
        overrideChoice,
        scoreGap,
      );
    if (
      tacticalPlanRunnerMappingBlocksOffPlanOverride(
        mapping,
        overrideChoice,
        mappedActionIds,
        {
          repeatedRunShouldYield,
          corpBoardTriageMismatchShouldYield,
        },
      )
    ) {
      return tacticalPlanBlockedOverrideResult({
        mappedChoice,
        overrideChoice,
        reason: "runner_plan_controller",
        scoreGap,
        threshold: Number.POSITIVE_INFINITY,
      });
    }
    if (
      mappedNonPositiveAgainstPositive ||
      repeatedRunShouldYield ||
      corpBoardTriageMismatchShouldYield ||
      scoreGap > threshold.scoreGap
    ) {
      const result = {
        outcome: "semantic_choice_selected" as const,
        overrideChoice,
        overriddenMappedChoice: mappedChoice,
        overrideReason: mappedNonPositiveAgainstPositive
          ? "mapped_nonpositive_against_positive"
          : repeatedRunShouldYield
            ? "repeated_run_mapping_yield"
            : corpBoardTriageMismatchShouldYield
              ? "corp_board_triage_mismatch_yield"
              : threshold.reason,
        overrideThreshold: threshold.scoreGap,
        scoreGap,
      };
      return {
        ...result,
        choice: semanticRuntimeChoiceWithAddedEvidence(
          overrideChoice,
          tacticalPlanMappingOverrideEvidence(result),
        ),
      };
    }
    return tacticalPlanBlockedOverrideResult({
      mappedChoice,
      overrideChoice,
      reason:
        threshold.reason.endsWith("mapping_protected")
          ? threshold.reason
          : "semantic_score_gap_below_threshold",
      scoreGap,
      threshold: threshold.scoreGap,
    });
  }
  return {
    outcome: "plan_mapping_selected",
    choice: semanticRuntimeChoiceWithAddedEvidence(mappedChoice, [
      "tactical_plan_mapping_outcome:plan_mapping_selected",
    ]),
  };
}

function bestPlanCompatibleSemanticChoice(
  choices: readonly SemanticRuntimeChoice[],
): SemanticRuntimeChoice | undefined {
  const viable = choices.filter((choice) => !choice.exclusion);
  if (viable.length === 0) return undefined;
  return [...viable].sort(
    (left, right) =>
      positiveScoreRank(right.score) - positiveScoreRank(left.score) ||
      right.score - left.score ||
      left.action.actionId.localeCompare(right.action.actionId),
  )[0];
}

function positiveScoreRank(score: number): number {
  return score > 0 ? 1 : 0;
}

function tacticalPlanRunnerMappingBlocksOffPlanOverride(
  mapping: PlanStepMappingResult,
  overrideChoice: SemanticRuntimeChoice,
  mappedActionIds: ReadonlySet<string>,
  exceptions: {
    repeatedRunShouldYield: boolean;
    corpBoardTriageMismatchShouldYield: boolean;
  },
): boolean {
  if (mapping.plan.side !== "runner") return false;
  if (!runnerPlanTypeRequiresPlanDominance(mapping.plan.type)) return false;
  if (mappedActionIds.has(overrideChoice.action.actionId)) return false;
  if (exceptions.repeatedRunShouldYield) return false;
  if (exceptions.corpBoardTriageMismatchShouldYield) return false;
  return !runnerPlanOverrideIsHardInterrupt(overrideChoice);
}

function runnerPlanTypeRequiresPlanDominance(type: TacticalPlan["type"]): boolean {
  return (
    type === "runner.contest_remote" ||
    type === "runner.obtain_breaker_coverage" ||
    type === "runner.opportunistic_central_run" ||
    type === "runner.convert_success_window" ||
    type === "runner.restore_hand_buffer" ||
    type === "runner.develop_hand_card" ||
    type === "runner.play_best_hand_card" ||
    type === "runner.build_credit_base" ||
    type === "runner.build_credit_bank" ||
    type === "runner.cash_out_credit_bank"
  );
}

function runnerPlanOverrideIsHardInterrupt(
  overrideChoice: SemanticRuntimeChoice,
): boolean {
  if (overrideChoice.action.type !== "start_run") return false;
  return semanticRuntimeChoiceHasAnyScoreComponent(overrideChoice, [
    "runner_hq_known_agenda",
    "runner_rnd_fresh_memory",
    "runner_goal_fit_tactical_goal_run_target",
  ]);
}

function tacticalPlanHandBufferMappingBlocksProbeRunOverride(
  mapping: PlanStepMappingResult,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  return (
    mapping.plan.type === "runner.restore_hand_buffer" &&
    overrideChoice.action.type === "start_run" &&
    semanticRuntimeChoiceStrategicFitLevel(overrideChoice) === "none" &&
    scoreGap <= 1800
  );
}

function tacticalPlanRepeatedRunMappingShouldYield(
  input: AiDecisionInput,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  if (scoreGap <= 0) return false;
  if (mappedChoice.action.type !== "start_run") return false;
  if (overrideChoice.action.type === "start_run") return false;
  const serverId = semanticRuntimeServerId(mappedChoice.action);
  if (!serverId) return false;
  return semanticRuntimeRecentRunnerStartRunsOnServer(input, serverId) > 0;
}

function tacticalPlanRemoteContestMappingBlocksRunOverride(
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
  if (!mapping.plan.evidence.includes("runner_run_target_payoff:score_threat")) {
    return false;
  }
  return scoreGap <= 3000;
}

function tacticalPlanNonPositiveMappingStillProtected(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
): boolean {
  if (mappedChoice.score < -500) return false;
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
      ? [`tactical_plan_mapping_score_gap_threshold:${result.overrideThreshold}`]
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

function tacticalPlanBlocksSemanticChoice(
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

function tacticalPlanCoverageMappingBlocksRunOverride(
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
    mappedChoice.action.type !== "gain_credit" &&
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

function tacticalPlanCoverageMappingBlocksEconomyOverride(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
  threshold: number,
): boolean {
  return (
    mapping.plan.type === "runner.obtain_breaker_coverage" &&
    mappedChoice.action.type === "draw_card" &&
    overrideChoice.action.type === "gain_credit" &&
    scoreGap <= Math.max(threshold, 900)
  );
}

function tacticalPlanOverrideScoreGapThreshold(
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
): { scoreGap: number; reason: string } {
  const mappedStrategic = semanticRuntimeChoiceStrategicFitLevel(mappedChoice);
  const overrideStrategic = semanticRuntimeChoiceStrategicFitLevel(overrideChoice);
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

function semanticRuntimeChoiceStrategicFitLevel(
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

function tacticalPlanBlockedOverrideResult(params: {
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

function semanticRuntimeChoiceWithAddedEvidence(
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

function semanticRuntimeRecentRunnerStartRunsOnServer(
  input: AiDecisionInput,
  serverId: string,
): number {
  let count = 0;
  const history = mergedAiPublicHistory(input);
  let seenRunnerActions = 0;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const event = history[index]!;
    const actionType =
      typeof event.publicPayload.actionType === "string"
        ? event.publicPayload.actionType
        : event.type;
    if (input.playerView.stateVersion - aiEventVersion(event) > 18) break;
    if (semanticRuntimeRunnerRunProgressEvent(actionType)) break;
    const actor =
      typeof event.publicPayload.actor === "string"
        ? event.publicPayload.actor
        : undefined;
    if (actor !== "runner" || actionType !== "start_run") continue;
    seenRunnerActions += 1;
    const target = aiServerIdFromEvent(event);
    if (target === serverId) count += 1;
    if (seenRunnerActions >= 8) break;
  }
  return count;
}

function tacticalPlanCorpBoardTriageMismatchShouldYield(
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  return (
    scoreGap > 0 &&
    semanticRuntimeChoiceHasScoreComponent(
      mappedChoice,
      "corp_board_triage_mismatch",
    ) &&
    !semanticRuntimeChoiceHasScoreComponent(
      overrideChoice,
      "corp_board_triage_mismatch",
    )
  );
}

function semanticRuntimeChoiceHasScoreComponent(
  choice: SemanticRuntimeChoice,
  key: string,
): boolean {
  return choice.evidence.includes(`semantic_score_component:${key}`);
}

function semanticRuntimeChoiceHasAnyScoreComponent(
  choice: SemanticRuntimeChoice,
  keys: readonly string[],
): boolean {
  return keys.some((key) => semanticRuntimeChoiceHasScoreComponent(choice, key));
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

function semanticRuntimeRunnerRunProgressEvent(actionType: string): boolean {
  return (
    actionType === "steal_agenda" ||
    actionType === "score_agenda" ||
    actionType === "trash_accessed_card" ||
    actionType === "advance_card" ||
    actionType === "install_card"
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

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}
