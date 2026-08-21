import type { RunnerHandDevelopmentEvaluation } from "../runner-hand-development";

export type RunnerDevelopmentCashOutExceptionKind =
  | "acute_survival"
  | "acute_coverage";

export type RunnerDevelopmentCashOutExceptionWitness = {
  kind: RunnerDevelopmentCashOutExceptionKind;
  targetCardInstanceId: string;
  evidenceCode: string;
};

export type RunnerDevelopmentCashOutRoute = {
  targetCardInstanceId: string;
  exceptionKind?: RunnerDevelopmentCashOutExceptionKind;
  requiredCredits: number;
  missingCredits: number;
  projectedCreditsAfterCashOut: number;
  projectedCreditsAfterDevelopment: number;
  projectedHandAfterDevelopment: number;
  evidenceCodes: string[];
};

export type RunnerDevelopmentCashOutAdmission = {
  admitted: boolean;
  route?: RunnerDevelopmentCashOutRoute;
  rejectionCodes: string[];
};

export function assessRunnerDevelopmentCashOutAdmission(params: {
  evaluations: readonly RunnerHandDevelopmentEvaluation[];
  currentCredits: number;
  estimatedPayout: number;
  clicksRemaining: number;
  gripCount: number;
  minimumHandBuffer: number;
  explicitException?: RunnerDevelopmentCashOutExceptionWitness;
}): RunnerDevelopmentCashOutAdmission {
  const numericInputRejections = invalidCashOutNumericInputs(params);
  if (numericInputRejections.length > 0) {
    return {
      admitted: false,
      rejectionCodes: numericInputRejections,
    };
  }
  const currentCredits = params.currentCredits;
  const estimatedPayout = params.estimatedPayout;
  const clicksRemaining = params.clicksRemaining;
  const gripCount = params.gripCount;
  const minimumHandBuffer = params.minimumHandBuffer;
  const projectedCreditsAfterCashOut = currentCredits + estimatedPayout;
  if (!Number.isFinite(projectedCreditsAfterCashOut)) {
    return {
      admitted: false,
      rejectionCodes: [
        "development_cashout_rejected:invalid_projected_credits_after_cashout",
      ],
    };
  }
  const projectedHandAfterDevelopment = Math.max(0, gripCount - 1);
  const rejectionCodes = new Set<string>();

  if (estimatedPayout <= 0) {
    rejectionCodes.add("development_cashout_rejected:no_positive_payout");
  }
  if (clicksRemaining < 2) {
    rejectionCodes.add(
      "development_cashout_rejected:no_same_turn_conversion_window",
    );
  }

  const routes = params.evaluations.flatMap(
    (evaluation): RunnerDevelopmentCashOutRoute[] => {
      if (
        !(
          (evaluation.availability === "missing_credits" &&
            evaluation.deferReason === "missing_credits") ||
          (evaluation.availability === "legal_now" &&
            evaluation.deferReason === "preserve_credit_floor")
        )
      ) {
        return [];
      }
      const fundingNeed = evaluation.fundingNeed;
      if (!fundingNeed) {
        rejectionCodes.add(
          `development_cashout_rejected:missing_funding_need:${evaluation.cardInstanceId}`,
        );
        return [];
      }
      if (!finiteNonNegative(fundingNeed.installOrPlayCost)) {
        rejectionCodes.add(
          `development_cashout_rejected:invalid_install_or_play_cost:${evaluation.cardInstanceId}`,
        );
      }
      if (!finiteNonNegative(fundingNeed.missingCredits)) {
        rejectionCodes.add(
          `development_cashout_rejected:invalid_missing_credits:${evaluation.cardInstanceId}`,
        );
      }
      if (!finiteNonNegative(fundingNeed.targetCredits)) {
        rejectionCodes.add(
          `development_cashout_rejected:invalid_target_credits:${evaluation.cardInstanceId}`,
        );
      }
      if (
        !finiteNonNegative(fundingNeed.installOrPlayCost) ||
        !finiteNonNegative(fundingNeed.missingCredits) ||
        !finiteNonNegative(fundingNeed.targetCredits)
      ) {
        return [];
      }
      if (
        fundingNeed.targetCredits <= currentCredits ||
        fundingNeed.missingCredits <= 0
      ) {
        rejectionCodes.add(
          `development_cashout_rejected:invalid_funding_need:${evaluation.cardInstanceId}`,
        );
        return [];
      }
      if (!runnerDevelopmentCashOutTargetIsPlanEligible(evaluation)) {
        rejectionCodes.add(
          `development_cashout_rejected:target_not_plan_eligible:${evaluation.cardInstanceId}`,
        );
        return [];
      }
      if (
        fundingNeed.missingCredits > estimatedPayout ||
        fundingNeed.targetCredits > projectedCreditsAfterCashOut
      ) {
        rejectionCodes.add(
          `development_cashout_rejected:payout_does_not_close_gap:${evaluation.cardInstanceId}`,
        );
        return [];
      }

      const exceptionKind =
        projectedHandAfterDevelopment < minimumHandBuffer
          ? matchingExplicitException(evaluation, params.explicitException)
          : undefined;
      if (
        projectedHandAfterDevelopment < minimumHandBuffer &&
        exceptionKind === undefined
      ) {
        rejectionCodes.add(
          `development_cashout_rejected:required_hand_buffer:${evaluation.cardInstanceId}`,
        );
        return [];
      }

      const projectedCreditsAfterDevelopment =
        projectedCreditsAfterCashOut - fundingNeed.installOrPlayCost;
      return [
        {
          targetCardInstanceId: evaluation.cardInstanceId,
          ...(exceptionKind ? { exceptionKind } : {}),
          requiredCredits: fundingNeed.targetCredits,
          missingCredits: fundingNeed.missingCredits,
          projectedCreditsAfterCashOut,
          projectedCreditsAfterDevelopment,
          projectedHandAfterDevelopment,
          evidenceCodes: [
            `development_cashout_target:${evaluation.cardInstanceId}`,
            `development_cashout_missing_credits:${fundingNeed.missingCredits}`,
            `development_cashout_required_credits:${fundingNeed.targetCredits}`,
            `development_cashout_install_cost:${fundingNeed.installOrPlayCost}`,
            `development_cashout_projected_credits:${projectedCreditsAfterCashOut}`,
            `development_cashout_projected_hand:${projectedHandAfterDevelopment}`,
            `development_cashout_required_hand_buffer:${minimumHandBuffer}`,
            ...(exceptionKind
              ? [
                  `development_cashout_exception:${exceptionKind}`,
                  params.explicitException?.evidenceCode ?? "",
                ].filter(Boolean)
              : ["development_cashout_hand_buffer_preserved:true"]),
          ],
        },
      ];
    },
  );

  if (estimatedPayout <= 0 || clicksRemaining < 2 || routes.length === 0) {
    if (routes.length === 0) {
      rejectionCodes.add(
        "development_cashout_rejected:no_bound_convertible_route",
      );
    }
    return {
      admitted: false,
      rejectionCodes: [...rejectionCodes].sort(),
    };
  }

  const route = [...routes].sort(
    (left, right) =>
      routeEvaluationPriority(params.evaluations, right) -
        routeEvaluationPriority(params.evaluations, left) ||
      left.missingCredits - right.missingCredits ||
      left.targetCardInstanceId.localeCompare(right.targetCardInstanceId),
  )[0];
  if (!route) {
    return {
      admitted: false,
      rejectionCodes: [
        "development_cashout_rejected:no_bound_convertible_route",
      ],
    };
  }
  return {
    admitted: true,
    route,
    rejectionCodes: [],
  };
}

function runnerDevelopmentCashOutTargetIsPlanEligible(
  evaluation: RunnerHandDevelopmentEvaluation,
): boolean {
  if (
    evaluation.priority < 500 ||
    evaluation.strategicFit === "blocked" ||
    evaluation.currentNeed === "none" ||
    evaluation.currentNeed === "later" ||
    evaluation.developmentRole === "unknown" ||
    evaluation.developmentRole === "duplicate_or_low_value"
  ) {
    return false;
  }
  if (
    evaluation.activationPrerequisites.some(
      (prerequisite) =>
        prerequisite.kind === "same_turn_access" || !prerequisite.satisfied,
    )
  ) {
    return false;
  }
  if (
    evaluation.persistentInstallEvaluation &&
    (evaluation.persistentInstallEvaluation.finalInstallFit <= 0 ||
      evaluation.persistentInstallEvaluation.duplicateRole ===
        "redundant_duplicate")
  ) {
    return false;
  }
  if (
    evaluation.developmentRole === "defense_support" &&
    evaluation.currentNeed !== "acute"
  ) {
    return false;
  }
  return true;
}

function matchingExplicitException(
  evaluation: RunnerHandDevelopmentEvaluation,
  witness: RunnerDevelopmentCashOutExceptionWitness | undefined,
): RunnerDevelopmentCashOutExceptionKind | undefined {
  if (
    !witness ||
    witness.targetCardInstanceId !== evaluation.cardInstanceId ||
    witness.evidenceCode.trim().length === 0 ||
    evaluation.currentNeed !== "acute"
  ) {
    return undefined;
  }
  if (
    witness.kind === "acute_survival" &&
    evaluation.developmentRole === "defense_support"
  ) {
    return witness.kind;
  }
  if (
    witness.kind === "acute_coverage" &&
    evaluation.developmentRole === "breaker_or_rig_piece"
  ) {
    return witness.kind;
  }
  return undefined;
}

function routeEvaluationPriority(
  evaluations: readonly RunnerHandDevelopmentEvaluation[],
  route: RunnerDevelopmentCashOutRoute,
): number {
  return (
    evaluations.find(
      (evaluation) => evaluation.cardInstanceId === route.targetCardInstanceId,
    )?.priority ?? 0
  );
}

function invalidCashOutNumericInputs(params: {
  currentCredits: number;
  estimatedPayout: number;
  clicksRemaining: number;
  gripCount: number;
  minimumHandBuffer: number;
}): string[] {
  const rejections: string[] = [];
  if (!finiteNonNegative(params.currentCredits)) {
    rejections.push("development_cashout_rejected:invalid_current_credits");
  }
  if (!finiteNonNegative(params.estimatedPayout)) {
    rejections.push("development_cashout_rejected:invalid_estimated_payout");
  }
  if (!nonNegativeInteger(params.clicksRemaining)) {
    rejections.push("development_cashout_rejected:invalid_clicks_remaining");
  }
  if (!nonNegativeInteger(params.gripCount)) {
    rejections.push("development_cashout_rejected:invalid_grip_count");
  }
  if (!nonNegativeInteger(params.minimumHandBuffer)) {
    rejections.push("development_cashout_rejected:invalid_minimum_hand_buffer");
  }
  return rejections.sort();
}

function finiteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function nonNegativeInteger(value: number): boolean {
  return finiteNonNegative(value) && Number.isInteger(value);
}
