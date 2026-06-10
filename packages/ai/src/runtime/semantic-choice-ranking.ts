import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
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
    if (
      tacticalPlanCoverageMappingBlocksRunOverride(
        mapping,
        overrideChoice,
        mappedActionIds,
      )
    ) {
      return { choice: mappedChoice };
    }
    const scoreGap = roundScore(overrideChoice.score - mappedChoice.score);
    const mappedNonPositiveAgainstPositive =
      mappedChoice.score <= 0 && overrideChoice.score > 0;
    if (
      mappedNonPositiveAgainstPositive ||
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
): boolean {
  return (
    mapping.plan.type === "runner.obtain_breaker_coverage" &&
    overrideChoice.action.type === "start_run" &&
    !mappedActionIds.has(overrideChoice.action.actionId)
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

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}
