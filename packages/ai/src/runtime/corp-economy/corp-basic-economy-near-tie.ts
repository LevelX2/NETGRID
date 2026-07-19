import type { AiDecisionInput } from "@netgrid/shared";

import { fnv1a } from "../stable-hash";
import { corpOptionalDrawCapacity } from "./corp-defensive-draw";
import type { SemanticRuntimeChoice } from "../semantic-runtime-types";

export const CORP_BASIC_ECONOMY_NEAR_TIE_WINDOW = 100;

export type CorpBasicEconomyNearTieAssessment = {
  eligible: boolean;
  reason:
    | "eligible"
    | "not_corp"
    | "baseline_not_basic_economy"
    | "insufficient_candidates";
  baselineActionId: string;
  selectedActionId: string;
  candidateActionIds: string[];
  strategicScoreGap: number;
  bucket?: number;
  contextHash?: string;
};

export function replayStableCorpBasicEconomyNearTieChoice(
  input: AiDecisionInput,
  choices: readonly SemanticRuntimeChoice[],
  baseline: SemanticRuntimeChoice,
): SemanticRuntimeChoice {
  const assessment = assessCorpBasicEconomyNearTie(input, choices, baseline);
  if (!assessment.eligible) return baseline;
  const selected = choices.find(
    (choice) => choice.action.actionId === assessment.selectedActionId,
  );
  if (!selected) return baseline;
  const reason = [
    `baseline_action:${assessment.baselineActionId}`,
    `selected_action:${assessment.selectedActionId}`,
    `near_tie_window:${CORP_BASIC_ECONOMY_NEAR_TIE_WINDOW}`,
    `strategic_score_gap:${assessment.strategicScoreGap}`,
    `candidate_actions:${assessment.candidateActionIds.join(",")}`,
    `variation_bucket:${assessment.bucket ?? 0}`,
    `variation_context_hash:${assessment.contextHash ?? "none"}`,
  ].join("|");
  return {
    ...selected,
    scoreBreakdown: [
      ...selected.scoreBreakdown,
      {
        key: "corp_seeded_near_tie_variation",
        label: "Replay-stabile Near-Tie-Variation",
        value: 0,
        reason,
      },
    ],
    evidence: [
      ...selected.evidence,
      "corp_seeded_near_tie_variation:true",
      ...reason.split("|").map((entry) => `corp_near_tie_${entry}`),
    ],
  };
}

export function replayStableCorpBasicEconomyNearTieChoiceOrUndefined(
  input: AiDecisionInput,
  choices: readonly SemanticRuntimeChoice[],
  baseline: SemanticRuntimeChoice | undefined,
): SemanticRuntimeChoice | undefined {
  return baseline
    ? replayStableCorpBasicEconomyNearTieChoice(input, choices, baseline)
    : undefined;
}

export function assessCorpBasicEconomyNearTie(
  input: AiDecisionInput,
  choices: readonly SemanticRuntimeChoice[],
  baseline: SemanticRuntimeChoice,
): CorpBasicEconomyNearTieAssessment {
  if (input.side !== "corp") {
    return ineligible("not_corp", baseline);
  }
  if (!corpBasicEconomyChoice(input, baseline)) {
    return ineligible("baseline_not_basic_economy", baseline);
  }
  const positiveChoiceExists = choices.some(
    (choice) => !choice.exclusion && choice.score > 0,
  );
  const baselineStrategicScore = strategicScoreWithoutTypeTieBreaker(baseline);
  const candidates = choices
    .filter(
      (choice) =>
        !choice.exclusion &&
        choice.scopeId === baseline.scopeId &&
        (positiveChoiceExists ? choice.score > 0 : true) &&
        corpBasicEconomyChoice(input, choice) &&
        baselineStrategicScore - strategicScoreWithoutTypeTieBreaker(choice) <=
          CORP_BASIC_ECONOMY_NEAR_TIE_WINDOW,
    )
    .sort((left, right) =>
      left.action.actionId.localeCompare(right.action.actionId),
    );
  if (candidates.length < 2) {
    return ineligible("insufficient_candidates", baseline);
  }
  const candidateActionIds = candidates.map((choice) => choice.action.actionId);
  const contextHash = fnv1a(
    [
      input.seed,
      input.decisionId,
      input.actionNumber,
      input.playerView.stateVersion,
      input.side,
      input.profileId,
      candidateActionIds.join(","),
    ].join("|"),
  );
  const bucket = Number.parseInt(contextHash, 16) % candidates.length;
  const selected = candidates[bucket] ?? baseline;
  const strategicScores = candidates.map(strategicScoreWithoutTypeTieBreaker);
  return {
    eligible: true,
    reason: "eligible",
    baselineActionId: baseline.action.actionId,
    selectedActionId: selected.action.actionId,
    candidateActionIds,
    strategicScoreGap:
      Math.max(...strategicScores) - Math.min(...strategicScores),
    bucket,
    contextHash: `fnv1a:${contextHash}`,
  };
}

function corpBasicEconomyChoice(
  input: AiDecisionInput,
  choice: SemanticRuntimeChoice,
): boolean {
  if (choice.action.source !== "basic_action") return false;
  if (choice.action.type === "gain_credit") return true;
  return (
    choice.action.type === "draw_card" &&
    corpOptionalDrawCapacity(input, choice.action).eligible
  );
}

function strategicScoreWithoutTypeTieBreaker(
  choice: SemanticRuntimeChoice,
): number {
  return (
    choice.score -
    choice.scoreBreakdown
      .filter((component) => component.key === "semantic_type_tie_breaker")
      .reduce((sum, component) => sum + component.value, 0)
  );
}

function ineligible(
  reason: Exclude<CorpBasicEconomyNearTieAssessment["reason"], "eligible">,
  baseline: SemanticRuntimeChoice,
): CorpBasicEconomyNearTieAssessment {
  return {
    eligible: false,
    reason,
    baselineActionId: baseline.action.actionId,
    selectedActionId: baseline.action.actionId,
    candidateActionIds: [baseline.action.actionId],
    strategicScoreGap: 0,
  };
}
