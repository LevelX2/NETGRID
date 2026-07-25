import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../run-analysis/runner-run-target-types";

export const RUNNER_RUN_FUNDING_ADMISSION_REASON_CODES = [
  "target_already_directly_convertible",
  "no_concrete_funding_gap",
  "target_not_credit_convertible",
  "same_server_direct_route_blocks_funding",
  "nonurgent_funding_yields_to_direct_run",
  "concrete_funding_gap_admitted",
] as const;

export type RunnerRunFundingAdmissionReasonCode =
  (typeof RUNNER_RUN_FUNDING_ADMISSION_REASON_CODES)[number];

export type RunnerRunFundingAdmission = {
  admitted: boolean;
  reasonCode: RunnerRunFundingAdmissionReasonCode;
  concreteFundingGap: number;
  routeFundingGap: number;
  postRunFloorGap: number;
  requiredPostRunReserve: number;
  requiredPostRunReserveGap: number;
  urgentScoreThreat: boolean;
  targetDirectlyConvertible: boolean;
  sameServerDirectlyConvertibleActionIds: string[];
  alternativeDirectlyConvertibleActionIds: string[];
  evidenceCodes: string[];
};

export type AssessRunnerRunFundingAdmissionParams = {
  target: RunnerRunTargetEvaluation;
  runTargets: readonly RunnerRunTargetEvaluation[];
  economy: Pick<RunnerEconomyPosture, "minimumCreditFloor">;
  urgentScoreThreat?: boolean;
  requiredPostRunReserve?: number;
};

export function assessRunnerRunFundingAdmission(
  params: AssessRunnerRunFundingAdmissionParams,
): RunnerRunFundingAdmission {
  const minimumCreditFloor = nonNegative(params.economy.minimumCreditFloor);
  const targetDirectlyConvertible = runnerRunTargetIsDirectlyConvertible({
    target: params.target,
    economy: params.economy,
    allowCreditFloorOverride: urgentScoreThreatFor(params),
    ...(params.requiredPostRunReserve !== undefined
      ? { requiredPostRunReserve: params.requiredPostRunReserve }
      : {}),
  });
  const routeFundingGap = nonNegative(
    params.target.routeQuote?.fundingGap ?? 0,
  );
  const postRunFloorGap = Math.max(
    0,
    minimumCreditFloor - finiteNumber(params.target.creditsAfterRun),
  );
  const requiredPostRunReserve = nonNegative(
    params.requiredPostRunReserve ?? 0,
  );
  const requiredPostRunReserveGap = Math.max(
    0,
    requiredPostRunReserve - finiteNumber(params.target.creditsAfterRun),
  );
  const concreteFundingGap = Math.max(
    routeFundingGap,
    postRunFloorGap,
    requiredPostRunReserveGap,
  );
  const urgentScoreThreat = urgentScoreThreatFor(params);
  const sameServerDirectlyConvertibleActionIds = directAlternativeActionIds({
    target: params.target,
    runTargets: params.runTargets,
    economy: params.economy,
    sameServerOnly: true,
    allowCreditFloorOverride: urgentScoreThreat,
    requiredPostRunReserve,
  });
  const alternativeDirectlyConvertibleActionIds = [
    ...new Set([
      ...sameServerDirectlyConvertibleActionIds,
      ...directAlternativeActionIds({
        target: params.target,
        runTargets: params.runTargets,
        economy: params.economy,
        sameServerOnly: false,
        allowCreditFloorOverride: false,
        requiredPostRunReserve: 0,
      }),
    ]),
  ].sort();

  const context = {
    concreteFundingGap,
    routeFundingGap,
    postRunFloorGap,
    requiredPostRunReserve,
    requiredPostRunReserveGap,
    urgentScoreThreat,
    targetDirectlyConvertible,
    sameServerDirectlyConvertibleActionIds,
    alternativeDirectlyConvertibleActionIds,
  };

  if (targetDirectlyConvertible) {
    return result(
      false,
      "target_already_directly_convertible",
      context,
    );
  }
  if (concreteFundingGap <= 0) {
    return result(false, "no_concrete_funding_gap", context);
  }
  if (
    !runnerRunTargetPathIsCreditConvertible(
      params.target,
      urgentScoreThreat,
    )
  ) {
    return result(false, "target_not_credit_convertible", context);
  }
  if (sameServerDirectlyConvertibleActionIds.length > 0) {
    return result(
      false,
      "same_server_direct_route_blocks_funding",
      context,
    );
  }
  if (
    alternativeDirectlyConvertibleActionIds.length > 0 &&
    !urgentScoreThreat
  ) {
    return result(
      false,
      "nonurgent_funding_yields_to_direct_run",
      context,
    );
  }
  return result(true, "concrete_funding_gap_admitted", context);
}

export function runnerRunTargetIsDirectlyConvertible(params: {
  target: RunnerRunTargetEvaluation;
  economy: Pick<RunnerEconomyPosture, "minimumCreditFloor">;
  allowCreditFloorOverride?: boolean;
  requiredPostRunReserve?: number;
}): boolean {
  const routeFundingGap = nonNegative(
    params.target.routeQuote?.fundingGap ?? 0,
  );
  const requiredPostRunCredits = Math.max(
    params.allowCreditFloorOverride === true
      ? 0
      : nonNegative(params.economy.minimumCreditFloor),
    nonNegative(params.requiredPostRunReserve ?? 0),
  );
  return (
    params.target.pathPassability === "reachable" &&
    params.target.score > 0 &&
    (params.target.recommendation !== "gain_credits_first" ||
      params.allowCreditFloorOverride === true) &&
    params.target.knownAccessState !== "known_no_current_payoff" &&
    routeFundingGap === 0 &&
    finiteNumber(params.target.creditsAfterRun) >= requiredPostRunCredits
  );
}

function urgentScoreThreatFor(
  params: AssessRunnerRunFundingAdmissionParams,
): boolean {
  return (
    params.urgentScoreThreat === true ||
    params.target.scoreThreat ||
    params.target.accessPayoff === "agenda" ||
    params.target.accessPayoff === "score_threat"
  );
}

function directAlternativeActionIds(params: {
  target: RunnerRunTargetEvaluation;
  runTargets: readonly RunnerRunTargetEvaluation[];
  economy: Pick<RunnerEconomyPosture, "minimumCreditFloor">;
  sameServerOnly: boolean;
  allowCreditFloorOverride: boolean;
  requiredPostRunReserve: number;
}): string[] {
  return [
    ...new Set(
      params.runTargets
        .filter(
          (candidate) =>
            candidate.actionId !== params.target.actionId &&
            (!params.sameServerOnly ||
              candidate.targetServerId === params.target.targetServerId) &&
            runnerRunTargetIsDirectlyConvertible({
              target: candidate,
              economy: params.economy,
              allowCreditFloorOverride: params.allowCreditFloorOverride,
              requiredPostRunReserve: params.requiredPostRunReserve,
            }),
        )
        .map((candidate) => candidate.actionId),
    ),
  ].sort();
}

function runnerRunTargetPathIsCreditConvertible(
  target: RunnerRunTargetEvaluation,
  urgentScoreThreat: boolean,
): boolean {
  return (
    (target.score > 0 || urgentScoreThreat) &&
    target.knownAccessState !== "known_no_current_payoff" &&
    (target.pathPassability === "reachable" ||
      target.pathPassability === "blocked_unpayable")
  );
}

function result(
  admitted: boolean,
  reasonCode: RunnerRunFundingAdmissionReasonCode,
  context: Omit<
    RunnerRunFundingAdmission,
    "admitted" | "reasonCode" | "evidenceCodes"
  >,
): RunnerRunFundingAdmission {
  return {
    admitted,
    reasonCode,
    ...context,
    evidenceCodes: [
      `runner_run_funding_admission:${reasonCode}`,
      `runner_run_funding_gap:${context.concreteFundingGap}`,
      `runner_run_funding_route_gap:${context.routeFundingGap}`,
      `runner_run_funding_floor_gap:${context.postRunFloorGap}`,
      `runner_run_funding_required_post_run_reserve:${context.requiredPostRunReserve}`,
      `runner_run_funding_required_post_run_reserve_gap:${context.requiredPostRunReserveGap}`,
      `runner_run_funding_urgent_score_threat:${context.urgentScoreThreat}`,
      `runner_run_funding_target_direct:${context.targetDirectlyConvertible}`,
      `runner_run_funding_same_server_direct_alternatives:${context.sameServerDirectlyConvertibleActionIds.join(",") || "none"}`,
      `runner_run_funding_direct_alternatives:${context.alternativeDirectlyConvertibleActionIds.join(",") || "none"}`,
    ],
  };
}

function nonNegative(value: number): number {
  return Math.max(0, finiteNumber(value));
}

function finiteNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}
