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

// Tactical plans may break close ties, but a clear semantic gap belongs to the current board.
const PLAN_MAPPED_CHOICE_MAX_SCORE_GAP = 600;

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
  const mappedChoice =
    mappedChoices.find((choice) => choice.score > 0) ?? mappedChoices[0];
  if (!mappedChoice) return {};
  if (
    overrideChoice &&
    overrideChoice.action.actionId !== mappedChoice.action.actionId
  ) {
    const scoreGap = roundScore(overrideChoice.score - mappedChoice.score);
    if (
      tacticalPlanCoverageMappingBlocksRunOverride(
        mapping,
        overrideChoice,
        mappedActionIds,
        scoreGap,
      )
    ) {
      return { choice: mappedChoice };
    }
    if (
      tacticalPlanHandBufferMappingBlocksProbeRunOverride(
        mapping,
        overrideChoice,
        scoreGap,
      )
    ) {
      return { choice: mappedChoice };
    }
    const mappedNonPositiveAgainstPositive =
      mappedChoice.score <= 0 && overrideChoice.score > 0;
    if (
      mappedNonPositiveAgainstPositive ||
      tacticalPlanRepeatedRunMappingShouldYield(
        input,
        mappedChoice,
        overrideChoice,
        scoreGap,
      ) ||
      scoreGap > PLAN_MAPPED_CHOICE_MAX_SCORE_GAP
    ) {
      return {
        overrideChoice,
        overriddenMappedChoice: mappedChoice,
        scoreGap,
      };
    }
  }
  return { choice: mappedChoice };
}

function tacticalPlanHandBufferMappingBlocksProbeRunOverride(
  mapping: PlanStepMappingResult,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  return (
    mapping.plan.type === "runner.restore_hand_buffer" &&
    overrideChoice.action.type === "start_run" &&
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

export function tacticalPlanMappingOverrideEvidence(
  result: TacticalPlanMappedChoiceResult,
): string[] {
  const mappedChoice = result.overriddenMappedChoice;
  if (!mappedChoice) return [];
  return [
    "tactical_plan_mapping_overridden:true",
    "tactical_plan_override_reason:semantic_score_gap",
    `tactical_plan_mapping_score_gap:${result.scoreGap ?? 0}`,
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
  overrideChoice: SemanticRuntimeChoice,
  mappedActionIds: ReadonlySet<string>,
  scoreGap: number,
): boolean {
  return (
    mapping.plan.type === "runner.obtain_breaker_coverage" &&
    overrideChoice.action.type === "start_run" &&
    !mappedActionIds.has(overrideChoice.action.actionId) &&
    scoreGap <= PLAN_MAPPED_CHOICE_MAX_SCORE_GAP
  );
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
    planProgressionReason: _planProgressionReason,
    whyPlanAbandoned: _whyPlanAbandoned,
    ...rest
  } = result;
  return rest;
}

function semanticRuntimeServerId(action: LegalAction): string | undefined {
  const serverId = action.payload?.serverId;
  return typeof serverId === "string" ? serverId : undefined;
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
  const label =
    typeof payload.serverLabel === "string"
      ? payload.serverLabel
      : typeof payload.serverName === "string"
        ? payload.serverName
        : undefined;
  if (!label) return undefined;
  const normalized = label.toLowerCase();
  if (normalized === "r&d" || normalized === "rd") return "rd";
  if (normalized === "hq" || normalized === "headquarters") return "hq";
  if (normalized === "archives" || normalized === "archive") return "archives";
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
