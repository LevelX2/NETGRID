import type { AiDecisionInput } from "@netgrid/shared";

import type { RunnerHandDevelopmentEvaluation } from "../runner-hand-development";

export const RUNNER_HAND_ROTATION_ASSESSMENT_SCHEMA_VERSION =
  "runner-hand-rotation-assessment-v1" as const;

export type RunnerHandRotationAssessment = Readonly<{
  schemaVersion: typeof RUNNER_HAND_ROTATION_ASSESSMENT_SCHEMA_VERSION;
  handSize: number;
  maxHandSize: number;
  handCapacityGap: number;
  stackHasCards: boolean;
  knownRotationTargetCardInstanceIds: readonly string[];
  genericDrawAdmissible: boolean;
  exactKnownNeedDrawAdmissible: boolean;
  status:
    | "capacity_available"
    | "known_rotation_target_available"
    | "exact_need_cleanup_tradeoff_only"
    | "stack_empty";
  evidenceCodes: readonly string[];
}>;

/**
 * Classifies whether drawing can improve the Runner's current hand without
 * choosing a plan or a LegalAction. Exact plans may accept the explicit
 * cleanup trade-off at full hand; generic option development requires either
 * free hand capacity or a known low-retention card.
 */
export function assessRunnerHandRotation(
  input: AiDecisionInput,
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
): RunnerHandRotationAssessment {
  const handSize = input.playerView.own.gripOrHq.length;
  const maxHandSize = input.playerView.own.maxHandSize;
  const handCapacityGap = maxHandSize - handSize;
  const stackHasCards =
    input.playerView.own.stackOrRdCount > 0 ||
    input.legalActions.some(
      (action) =>
        action.side === "runner" &&
        action.type === "draw_card" &&
        action.source === "basic_action",
    );
  const knownHandInstanceIds = new Set(
    input.playerView.own.gripOrHq
      .filter((card) => card.known)
      .map((card) => card.instanceId),
  );
  const knownRotationTargetCardInstanceIds = handDevelopment
    .filter(
      (evaluation) =>
        knownHandInstanceIds.has(evaluation.cardInstanceId) &&
        runnerHandDevelopmentIsRotationTarget(evaluation),
    )
    .map((evaluation) => evaluation.cardInstanceId)
    .filter((instanceId, index, all) => all.indexOf(instanceId) === index)
    .sort();
  const hasCapacity = handCapacityGap > 0;
  const hasKnownRotationTarget = knownRotationTargetCardInstanceIds.length > 0;
  const genericDrawAdmissible =
    stackHasCards && (hasCapacity || hasKnownRotationTarget);
  const exactKnownNeedDrawAdmissible = stackHasCards;
  const status = !stackHasCards
    ? "stack_empty"
    : hasCapacity
      ? "capacity_available"
      : hasKnownRotationTarget
        ? "known_rotation_target_available"
        : "exact_need_cleanup_tradeoff_only";

  return {
    schemaVersion: RUNNER_HAND_ROTATION_ASSESSMENT_SCHEMA_VERSION,
    handSize,
    maxHandSize,
    handCapacityGap,
    stackHasCards,
    knownRotationTargetCardInstanceIds,
    genericDrawAdmissible,
    exactKnownNeedDrawAdmissible,
    status,
    evidenceCodes: [
      `runner_hand_rotation_status:${status}`,
      `runner_hand_rotation_capacity_gap:${handCapacityGap}`,
      ...(hasKnownRotationTarget
        ? [
            "runner_hand_rotation_known_low_retention_card",
            ...knownRotationTargetCardInstanceIds.map(
              (instanceId) => `runner_hand_rotation_target_card:${instanceId}`,
            ),
          ]
        : []),
    ],
  };
}

function runnerHandDevelopmentIsRotationTarget(
  evaluation: RunnerHandDevelopmentEvaluation,
): boolean {
  if (
    evaluation.currentNeed === "acute" ||
    evaluation.currentNeed === "useful_now"
  ) {
    return false;
  }
  if (
    evaluation.deferReason === "duplicate" ||
    evaluation.developmentRole === "duplicate_or_low_value"
  ) {
    return true;
  }
  const lowStrategicRetention =
    evaluation.strategicFit === "weak" || evaluation.strategicFit === "blocked";
  const noNearTermNeed =
    evaluation.currentNeed === "none" || evaluation.currentNeed === "later";
  if (!lowStrategicRetention || !noNearTermNeed) return false;
  return (
    evaluation.availability === "not_relevant_now" ||
    evaluation.deferReason === "no_current_need" ||
    evaluation.deferReason === "stronger_override" ||
    evaluation.deferReason === "missing_credits" ||
    evaluation.deferReason === "missing_mu" ||
    evaluation.deferReason === "replacement_conflict" ||
    evaluation.deferReason === "preserve_credit_floor"
  );
}
